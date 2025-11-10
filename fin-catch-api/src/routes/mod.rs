use crate::{
    error::ApiResult,
    gateway::DataSourceGateway,
    models::{DataRequest, GoldPriceRequest, StockHistoryRequest, ExchangeRateRequest},
};
use axum::{
    extract::{Query, State},
    http::StatusCode,
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

/// GET /api/v1/stock/history
/// Query parameters: symbol, resolution, from, to, source (optional)
async fn get_stock_history(
    State(state): State<AppState>,
    Query(request): Query<StockHistoryRequest>,
) -> ApiResult<impl IntoResponse> {
    let response = state.gateway.fetch_stock_history(request).await?;
    Ok(Json(response))
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

/// GET /api/v1/gold/history
/// Query parameters: gold_price_id, from, to, source (optional)
async fn get_gold_history(
    State(state): State<AppState>,
    Query(request): Query<GoldPriceRequest>,
) -> ApiResult<impl IntoResponse> {
    let response = state.gateway.fetch_gold_history(request).await?;
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

/// GET /api/v1/exchange-rate/history
/// Query parameters: currency_code, from, to, source (optional)
async fn get_exchange_rate_history(
    State(state): State<AppState>,
    Query(request): Query<ExchangeRateRequest>,
) -> ApiResult<impl IntoResponse> {
    let response = state.gateway.fetch_exchange_rate_history(request).await?;
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

/// POST /api/v1/data
/// Unified endpoint that handles both stock and gold data requests
/// JSON body with DataRequest (tagged union with data_type field)
async fn post_unified_data(
    State(state): State<AppState>,
    Json(request): Json<DataRequest>,
) -> ApiResult<impl IntoResponse> {
    let response = state.gateway.fetch_data(request).await?;
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

/// GET / - Root endpoint with API information
async fn root() -> impl IntoResponse {
    Json(json!({
        "service": "fin-catch-api",
        "version": "0.2.0",
        "description": "Financial data aggregation API with support for stock, gold price, and exchange rate data from multiple sources",
        "endpoints": {
            "stock_history_get": "GET /api/v1/stock/history?symbol={symbol}&resolution={resolution}&from={from}&to={to}&source={source}",
            "stock_history_post": "POST /api/v1/stock/history",
            "gold_history_get": "GET /api/v1/gold/history?gold_price_id={id}&from={from}&to={to}&source={source}",
            "gold_history_post": "POST /api/v1/gold/history",
            "exchange_rate_history_get": "GET /api/v1/exchange-rate/history?currency_code={code}&from={from}&to={to}&source={source}",
            "exchange_rate_history_post": "POST /api/v1/exchange-rate/history",
            "unified_data": "POST /api/v1/data",
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
        "example_unified_request": {
            "stock": {
                "data_type": "stock",
                "symbol": "VND",
                "resolution": "1D",
                "from": 1715385600,
                "to": 1720396800,
                "source": "vndirect"
            },
            "gold": {
                "data_type": "gold",
                "gold_price_id": "1",
                "from": 1730764800,
                "to": 1731110400,
                "source": "sjc"
            }
        }
    }))
}

/// Create the application router with all routes
pub fn create_router(state: AppState) -> Router {
    Router::new()
        .route("/", get(root))
        .route("/api/v1/stock/history", get(get_stock_history))
        .route("/api/v1/stock/history", post(post_stock_history))
        .route("/api/v1/gold/history", get(get_gold_history))
        .route("/api/v1/gold/history", post(post_gold_history))
        .route("/api/v1/exchange-rate/history", get(get_exchange_rate_history))
        .route("/api/v1/exchange-rate/history", post(post_exchange_rate_history))
        .route("/api/v1/data", post(post_unified_data))
        .route("/api/v1/sources", get(list_sources))
        .route("/api/v1/health", get(health_check))
        .route("/api/v1/health/sources", get(health_check_sources))
        .route("/api/v1/health/source/:name", get(health_check_source))
        .with_state(state)
}
