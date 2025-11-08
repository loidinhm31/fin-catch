use crate::{
    error::ApiResult,
    gateway::DataSourceGateway,
    models::StockHistoryRequest,
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
    let response = state.gateway.fetch_history(request).await?;
    Ok(Json(response))
}

/// POST /api/v1/stock/history
/// JSON body with StockHistoryRequest
async fn post_stock_history(
    State(state): State<AppState>,
    Json(request): Json<StockHistoryRequest>,
) -> ApiResult<impl IntoResponse> {
    let response = state.gateway.fetch_history(request).await?;
    Ok(Json(response))
}

/// GET /api/v1/sources
/// List all available data sources
async fn list_sources(State(state): State<AppState>) -> impl IntoResponse {
    let sources = state.gateway.list_sources();
    let metadata = state.gateway.sources_metadata();

    Json(json!({
        "sources": sources,
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
        "version": "0.1.0",
        "description": "Stock data aggregation API with support for multiple data sources",
        "endpoints": {
            "stock_history_get": "GET /api/v1/stock/history?symbol={symbol}&resolution={resolution}&from={from}&to={to}&source={source}",
            "stock_history_post": "POST /api/v1/stock/history",
            "list_sources": "GET /api/v1/sources",
            "health": "GET /api/v1/health",
            "health_sources": "GET /api/v1/health/sources",
            "health_source": "GET /api/v1/health/source/:name",
        },
        "example_request": {
            "symbol": "VND",
            "resolution": "1D",
            "from": 1715385600,
            "to": 1720396800,
            "source": "vndirect"
        }
    }))
}

/// Create the application router with all routes
pub fn create_router(state: AppState) -> Router {
    Router::new()
        .route("/", get(root))
        .route("/api/v1/stock/history", get(get_stock_history))
        .route("/api/v1/stock/history", post(post_stock_history))
        .route("/api/v1/sources", get(list_sources))
        .route("/api/v1/health", get(health_check))
        .route("/api/v1/health/sources", get(health_check_sources))
        .route("/api/v1/health/source/:name", get(health_check_source))
        .with_state(state)
}
