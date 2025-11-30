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
    use crate::models::gold_premium::GoldPremiumCalculator;

    // Validate request
    request.validate().map_err(|e| crate::error::ApiError::InvalidRequest(e))?;

    // Use the calculator from the models module
    GoldPremiumCalculator::calculate(gateway, &request).await
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
