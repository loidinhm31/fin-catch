use crate::{
    error::ApiResult,
    gateway::DataSourceGateway,
    models::{
        ExchangeRateRequest, GoldPremiumPoint, GoldPremiumRequest,
        GoldPremiumResponse, GoldPriceRequest, Resolution, StockHistoryRequest,
    },
};
use axum::{
    extract::State
    ,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde_json::json;
use std::sync::Arc;

/// Application state shared across handlers
#[derive(Clone)]
pub struct AppState {
    pub gateway: Arc<DataSourceGateway>,
}

/// POST /api/v1/stock/history
/// JSON body with StockHistoryRequest
async fn post_stock_history(
    State(state): State<AppState>,
    Json(request): Json<StockHistoryRequest>,
) -> ApiResult<impl IntoResponse> {
    let response = state.gateway.fetch_stock_history(request).await?;
    Ok(Json(response))
}

/// POST /api/v1/gold/history
/// JSON body with GoldPriceRequest
async fn post_gold_history(
    State(state): State<AppState>,
    Json(request): Json<GoldPriceRequest>,
) -> ApiResult<impl IntoResponse> {
    let response = state.gateway.fetch_gold_history(request).await?;
    Ok(Json(response))
}

/// POST /api/v1/exchange-rate/history
/// JSON body with ExchangeRateRequest
async fn post_exchange_rate_history(
    State(state): State<AppState>,
    Json(request): Json<ExchangeRateRequest>,
) -> ApiResult<impl IntoResponse> {
    let response = state.gateway.fetch_exchange_rate_history(request).await?;
    Ok(Json(response))
}

/// GET /api/v1/sources
/// List all available data sources
async fn list_sources(State(state): State<AppState>) -> impl IntoResponse {
    let sources_by_type = state.gateway.list_sources_by_type();
    let metadata = state.gateway.sources_metadata();

    Json(json!({
        "sources_by_type": sources_by_type,
        "metadata": metadata,
    }))
}

/// GET /api/v1/health
/// General health check
async fn health_check() -> impl IntoResponse {
    Json(json!({
        "status": "ok",
        "service": "fin-catch-api",
    }))
}

/// GET /api/v1/health/sources
/// Health check for all data sources
async fn health_check_sources(State(state): State<AppState>) -> impl IntoResponse {
    let health = state.gateway.health_check_all().await;

    Json(json!({
        "sources": health,
    }))
}

/// GET /api/v1/health/source/:name
/// Health check for a specific data source
async fn health_check_source(
    State(state): State<AppState>,
    axum::extract::Path(source_name): axum::extract::Path<String>,
) -> ApiResult<impl IntoResponse> {
    let is_healthy = state.gateway.health_check(&source_name).await?;

    Ok(Json(json!({
        "source": source_name,
        "healthy": is_healthy,
    })))
}

/// POST /api/v1/gold-premium
/// JSON body with GoldPremiumRequest
async fn post_gold_premium(
    State(state): State<AppState>,
    Json(request): Json<GoldPremiumRequest>,
) -> ApiResult<impl IntoResponse> {
    let response = fetch_gold_premium_data(&state.gateway, request).await?;
    Ok(Json(response))
}

/// Helper function to fetch and calculate gold premium data
async fn fetch_gold_premium_data(
    gateway: &DataSourceGateway,
    request: GoldPremiumRequest,
) -> ApiResult<GoldPremiumResponse> {
    // Validate request
    request.validate().map_err(|e| crate::error::ApiError::InvalidRequest(e))?;

    // Set default values
    let gold_price_id = request.gold_price_id.unwrap_or_else(|| "1".to_string());
    let currency_code = request.currency_code.unwrap_or_else(|| "USD".to_string());
    let gold_source = request.gold_source.as_deref().unwrap_or("sjc");

    // Fetch gold price data FIRST to get the actual date range
    let gold_price_request = GoldPriceRequest {
        gold_price_id: gold_price_id.clone(),
        from: request.from,
        to: request.to,
        source: Some(gold_source.to_string()),
    };

    let gold_price_response = gateway.fetch_gold_history(gold_price_request).await?;

    let gold_price_data = gold_price_response.data.as_ref().ok_or_else(|| {
        crate::error::ApiError::DataSource("No gold price data available".to_string())
    })?;

    if gold_price_data.is_empty() {
        return Ok(GoldPremiumResponse::error("No gold price data found for the requested period".to_string()));
    }

    // Determine the actual date range from gold price data
    let min_timestamp = gold_price_data.iter().map(|p| p.timestamp).min().unwrap_or(request.from);
    let max_timestamp = gold_price_data.iter().map(|p| p.timestamp).max().unwrap_or(request.to);

    // Add buffer to ensure we get exchange rate and stock data for all days
    // Buffer helps with timezone differences and ensures complete data coverage
    // However, we must respect the 180-day validation limit for exchange rates
    const MAX_EXCHANGE_RATE_DAYS: i64 = 180;
    const ONE_DAY: i64 = 86400;

    let buffered_from = min_timestamp - ONE_DAY; // 1 day before
    let buffered_to = max_timestamp + ONE_DAY;   // 1 day after

    // Check if buffered range exceeds the limit
    let buffered_days = (buffered_to - buffered_from) / ONE_DAY;

    let (from_with_buffer, to_with_buffer) = if buffered_days > MAX_EXCHANGE_RATE_DAYS {
        // If buffer would exceed limit, use unbuffered dates to stay within validation
        // This typically happens when requesting exactly 180 days (180 + 2 days buffer = 182)
        tracing::info!(
            "Gold premium: buffer would create {}-day range (exceeds 180-day limit), using unbuffered dates",
            buffered_days
        );
        (min_timestamp, max_timestamp)
    } else {
        // Buffer can be safely applied
        tracing::debug!(
            "Gold premium: applying ±1 day buffer for exchange rates ({} days total)",
            buffered_days
        );
        (buffered_from, buffered_to)
    };

    // Determine exchange rate source based on original request date range
    // This enables smart routing: single day -> Vietcombank, date range -> Yahoo Finance
    let exchange_rate_source = if request.exchange_rate_source.is_some() {
        // User explicitly specified a source
        request.exchange_rate_source
    } else {
        // Smart routing based on ORIGINAL request (not buffered dates)
        if request.from == request.to {
            // Single day query - use Vietcombank for official rates
            tracing::debug!("Gold premium: single day query, using vietcombank for exchange rates");
            Some("vietcombank".to_string())
        } else {
            // Date range query - use Yahoo Finance for fast bulk fetching
            tracing::debug!("Gold premium: date range query, using yahoo_finance for exchange rates");
            Some("yahoo_finance".to_string())
        }
    };

    // Fetch exchange rate and stock data based on gold price date range
    let stock_request = StockHistoryRequest {
        symbol: "GC=F".to_string(), // Gold spot price symbol
        resolution: Resolution::OneDay,
        from: from_with_buffer,
        to: to_with_buffer,
        source: request.stock_source.or(Some("yahoo_finance".to_string())),
    };

    let exchange_rate_request = ExchangeRateRequest {
        currency_code: currency_code.clone(),
        from: from_with_buffer,
        to: to_with_buffer,
        source: exchange_rate_source,
    };

    // Fetch data from exchange rate and stock sources
    let stock_response = gateway.fetch_stock_history(stock_request).await?;
    let exchange_rate_response = gateway.fetch_exchange_rate_history(exchange_rate_request).await?;

    // Check if responses have data
    let stock_data = stock_response.data.ok_or_else(|| {
        crate::error::ApiError::DataSource("No stock data available".to_string())
    })?;

    let exchange_rate_data = exchange_rate_response.data.ok_or_else(|| {
        crate::error::ApiError::DataSource("No exchange rate data available".to_string())
    })?;

    // Calculate premium for each data point
    let mut premium_points = Vec::new();

    // Helper function to normalize timestamp to start of day (00:00:00 UTC)
    let normalize_to_day = |timestamp: i64| -> i64 {
        (timestamp / 86400) * 86400
    };

    // Create a map of exchange rates by day for quick lookup
    let mut exchange_rate_map = std::collections::HashMap::new();
    for point in &exchange_rate_data {
        let day = normalize_to_day(point.timestamp);
        exchange_rate_map.insert(day, point.sell);
    }

    // Create a map of stock prices by day
    let mut stock_price_map = std::collections::HashMap::new();
    for candle in &stock_data {
        let day = normalize_to_day(candle.timestamp);
        stock_price_map.insert(day, candle.close);
    }

    // Conversion factor: 1 tael = 1.206 troy ounces
    const TAEL_TO_TROY_OZ: f64 = 1.206;

    // Process gold price data and calculate premium
    for gold_point in gold_price_data {
        // Normalize gold price timestamp to the same day
        let day = normalize_to_day(gold_point.timestamp);

        // Find matching exchange rate and stock price for this day
        let exchange_rate = exchange_rate_map.get(&day);
        let market_price_usd = stock_price_map.get(&day);

        if let (Some(&exchange_rate), Some(&market_price_usd)) = (exchange_rate, market_price_usd) {
            // Calculate market price in VND per tael
            // Formula: USD/oz × Exchange_Rate × 1.206 = VND/tael
            let market_price_vnd = market_price_usd * exchange_rate * TAEL_TO_TROY_OZ;

            // SJC prices are already in VND per tael: 1 tael = 37.5g
            let target_price = gold_point.sell;

            // Calculate premium
            // Premium (%) = [(Target Price - Market Price VND) / Market Price VND] × 100%
            let premium_rate = ((target_price - market_price_vnd) / market_price_vnd) * 100.0;
            let premium_value = target_price - market_price_vnd;

            premium_points.push(GoldPremiumPoint {
                timestamp: gold_point.timestamp,
                target_price,
                market_price_usd,
                exchange_rate,
                market_price_vnd,
                premium_rate,
                premium_value,
                gold_type: gold_point.type_name.clone(),
            });
        }
    }

    if premium_points.is_empty() {
        return Ok(GoldPremiumResponse::error(
            "No matching data points found across all sources".to_string(),
        ));
    }

    Ok(GoldPremiumResponse::success(premium_points).with_metadata(serde_json::json!({
        "gold_source": gold_price_response.source,
        "exchange_rate_source": exchange_rate_response.source,
        "stock_source": stock_response.source,
        "formula": "Premium (%) = [(Target Price - Market Price VND) / Market Price VND] × 100%",
        "conversion": "Market Price VND = USD/oz × Exchange Rate × 1.206 (1 tael = 1.206 troy oz)",
        "note": "Gold prices are in VND per tael",
    })))
}

/// GET / - Root endpoint with API information
async fn root() -> impl IntoResponse {
    Json(json!({
        "service": "fin-catch-api",
        "version": "0.2.0",
        "description": "Financial data aggregation API with support for stock, gold price, and exchange rate data from multiple sources",
        "endpoints": {
            "stock_history_post": "POST /api/v1/stock/history",
            "gold_history_post": "POST /api/v1/gold/history",
            "exchange_rate_history_post": "POST /api/v1/exchange-rate/history",
            "gold_premium_post": "POST /api/v1/gold-premium",
            "list_sources": "GET /api/v1/sources",
            "health": "GET /api/v1/health",
            "health_sources": "GET /api/v1/health/sources",
            "health_source": "GET /api/v1/health/source/:name",
        },
        "example_stock_request": {
            "symbol": "VND",
            "resolution": "1D",
            "from": 1715385600,
            "to": 1720396800,
            "source": "vndirect"
        },
        "example_gold_request": {
            "gold_price_id": "1",
            "from": 1730764800,
            "to": 1731110400,
            "source": "sjc"
        },
        "example_exchange_rate_request": {
            "currency_code": "USD",
            "from": 1730764800,
            "to": 1731110400,
            "source": "vietcombank"
        },
        "example_gold_premium_request": {
            "from": 1730764800,
            "to": 1731110400,
            "gold_price_id": "1",
            "currency_code": "USD",
            "gold_source": "sjc",
            "exchange_rate_source": "vietcombank",
            "stock_source": "yahoo_finance"
        },
    }))
}

/// Create the application router with all routes
pub fn create_router(state: AppState) -> Router {
    Router::new()
        .route("/", get(root))
        .route("/api/v1/stock/history", post(post_stock_history))
        .route("/api/v1/gold/history", post(post_gold_history))
        .route("/api/v1/exchange-rate/history", post(post_exchange_rate_history))
        .route("/api/v1/gold-premium", post(post_gold_premium))
        .route("/api/v1/sources", get(list_sources))
        .route("/api/v1/health", get(health_check))
        .route("/api/v1/health/sources", get(health_check_sources))
        .route("/api/v1/health/source/:name", get(health_check_source))
        .with_state(state)
}
