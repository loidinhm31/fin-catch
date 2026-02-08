//! Embedded http server for browser mode (DEVELOPMENT ONLY)
//!
//! This server provides API endpoints on port 25092 that mirror the Tauri invoke commands,
//! allowing the same React app to work in browser mode for easier debugging during development.
//!
//! NOTE: In the new monorepo architecture, the pure http app (apps/http) should use:
//! - IndexedDB for local data storage
//! - qm-center-server APIs for financial data (stock/gold/exchange rates)
//!
//! This embedded server is kept for development convenience when testing the Tauri app
//! in browser mode. In production, the pure http experience should use apps/http instead.
//!
//! The server is started on-demand when user clicks "Open in Browser" and can be
//! stopped gracefully, notifying connected browsers via SSE.

use axum::{
    body::Body,
    extract::{Path, Query, State},
    http::{header, Method, Request, Response, StatusCode, Uri},
    middleware::{self, Next},
    response::sse::{Event, KeepAlive, Sse},
    response::{IntoResponse, Json},
    routing::{get, post, put},
    Router,
};
use futures::stream::Stream;
use qm_fin_catch_data::{DataSourceGateway, ExchangeRateRequest, GoldPremiumRequest, GoldPriceRequest, StockHistoryRequest};
use rust_embed::RustEmbed;
use serde::{Deserialize, Serialize};
use std::convert::Infallible;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::sync::{broadcast, oneshot};
use tower_http::cors::CorsLayer;

use crate::db::{BondCouponPayment, Database, Portfolio, PortfolioEntry};
use crate::session::SharedSessionManager;
use crate::shared_auth::SharedAuthStatusHolder;
use crate::shared_sync::SharedSyncStatusHolder;
use crate::sync::SyncService;

/// Port for the embedded http server
pub const WEB_SERVER_PORT: u16 = 25092;

/// Embed the dist folder at compile time (only in release mode)
/// In debug mode, assets are served by Vite dev server, so we provide a dummy implementation
#[cfg(not(debug_assertions))]
#[derive(RustEmbed)]
#[folder = "../dist"]
struct Asset;

/// Dummy Asset struct for debug/dev mode - returns None for all assets
/// since the Vite dev server handles asset serving on port 1420
#[cfg(debug_assertions)]
struct Asset;

#[cfg(debug_assertions)]
impl Asset {
    fn get(_path: &str) -> Option<rust_embed::EmbeddedFile> {
        None // In dev mode, assets are served by Vite
    }
}


/// Shared state for the http server
#[derive(Clone)]
pub struct WebServerState {
    pub gateway: Arc<DataSourceGateway>,
    pub db: Arc<Database>,
    pub session_manager: SharedSessionManager,
    pub auth_status: SharedAuthStatusHolder,
    pub sync_status: SharedSyncStatusHolder,
    pub sync_service: Arc<Mutex<SyncService>>,
    pub app_handle: tauri::AppHandle,
    /// Broadcast channel for SSE shutdown notifications
    pub shutdown_broadcast: broadcast::Sender<String>,
    // Note: price alerts now handled by qm-sync server, not local http server
}

/// Handle for graceful shutdown
pub struct ServerHandle {
    shutdown_tx: Option<oneshot::Sender<()>>,
    shutdown_broadcast_tx: Option<broadcast::Sender<String>>,
    thread_handle: Option<std::thread::JoinHandle<()>>,
}

impl ServerHandle {
    /// Shutdown the server gracefully, notifying connected browsers first
    pub fn shutdown(mut self) {
        // First, notify all connected browsers via SSE that we're shutting down
        if let Some(tx) = &self.shutdown_broadcast_tx {
            println!("[WebServer] Sending shutdown notification to browsers...");
            let _ = tx.send("shutdown".to_string());
            // Give browsers a moment to receive the message
            std::thread::sleep(Duration::from_millis(500));
        }

        // Then proceed with actual server shutdown
        if let Some(tx) = self.shutdown_tx.take() {
            let _ = tx.send(());
        }
        if let Some(handle) = self.thread_handle.take() {
            let _ = handle.join();
        }
        println!("[WebServer] Server stopped");
    }
}

/// Global server handle for shutdown
static SERVER_HANDLE: Mutex<Option<ServerHandle>> = Mutex::new(None);

/// Token query parameter
#[derive(Deserialize)]
struct TokenQuery {
    token: Option<String>,
}

/// Start the embedded http server in a background thread.
/// Returns the session token for the browser URL.
/// Note: Price alerts are now handled by qm-sync server, not this local server.
pub fn start_web_server(
    gateway: Arc<DataSourceGateway>,
    db: Arc<Database>,
    session_manager: SharedSessionManager,
    auth_status: SharedAuthStatusHolder,
    sync_status: SharedSyncStatusHolder,
    sync_service: Arc<std::sync::Mutex<SyncService>>,
    app_handle: tauri::AppHandle,
) -> String {
    // Generate a new session token
    let token = session_manager.generate_token();

    let (shutdown_tx, shutdown_rx) = oneshot::channel::<()>();

    // Create a broadcast channel for SSE shutdown notifications
    let (shutdown_broadcast_tx, _) = broadcast::channel::<String>(16);
    let shutdown_broadcast_for_state = shutdown_broadcast_tx.clone();

    let state = WebServerState {
        gateway,
        db,
        session_manager,
        auth_status,
        sync_status,
        sync_service,
        app_handle,
        shutdown_broadcast: shutdown_broadcast_for_state,
    };

    let thread_handle = std::thread::spawn(move || {
        let rt = tokio::runtime::Runtime::new().expect("Failed to create tokio runtime");

        rt.block_on(async {
            // Configure CORS for browser access
            let cors = CorsLayer::new()
                .allow_origin([
                    format!("http://localhost:{}", WEB_SERVER_PORT)
                        .parse::<axum::http::HeaderValue>()
                        .unwrap(),
                    "http://localhost:1420"
                        .parse::<axum::http::HeaderValue>()
                        .unwrap(), // Vite dev
                ])
                .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS])
                .allow_headers([header::CONTENT_TYPE, header::ACCEPT]);

            let app = Router::new()
                // Health check (no auth required)
                .route("/api/health", get(api_health))
                // SSE route for shutdown notifications (no auth required)
                .route("/api/events", get(sse_handler))
                // Data APIs (with security middleware)
                .route("/api/stock-history", post(api_stock_history))
                .route("/api/gold-price", post(api_gold_price))
                .route("/api/exchange-rate", post(api_exchange_rate))
                .route("/api/gold-premium", post(api_gold_premium))
                .route("/api/sources", get(api_get_sources))
                .route("/api/health-check-all", get(api_health_check_all))
                // Auth status endpoint
                .route("/api/auth/status", get(api_auth_status))
                // Sync endpoints
                .route("/api/sync/status", get(api_sync_status))
                .route("/api/sync/now", post(api_sync_now))
                // Portfolio CRUD endpoints
                .route("/api/portfolios",
                    get(api_list_portfolios).post(api_create_portfolio))
                .route("/api/portfolios/:id",
                    get(api_get_portfolio).put(api_update_portfolio).delete(api_delete_portfolio))
                // Portfolio Entry CRUD endpoints
                .route("/api/portfolios/:portfolio_id/entries", get(api_list_entries))
                .route("/api/entries", post(api_create_entry))
                .route("/api/entries/:id",
                    get(api_get_entry).put(api_update_entry).delete(api_delete_entry))
                // Coupon Payment CRUD endpoints
                .route("/api/entries/:entry_id/coupon-payments", get(api_list_coupon_payments))
                .route("/api/coupon-payments", post(api_create_coupon_payment))
                .route("/api/coupon-payments/:id",
                    put(api_update_coupon_payment).delete(api_delete_coupon_payment))
                .layer(middleware::from_fn_with_state(
                    state.clone(),
                    security_middleware,
                ))
                .layer(cors)
                .with_state(state)
                // Static file serving (React app)
                .fallback(get(serve_static));

            let addr = format!("127.0.0.1:{}", WEB_SERVER_PORT);
            println!("[WebServer] Starting on http://{}", addr);

            let listener = tokio::net::TcpListener::bind(&addr)
                .await
                .expect("Failed to bind http server");

            println!("[WebServer] Ready at http://localhost:{}", WEB_SERVER_PORT);

            // Use axum's serve with graceful shutdown
            axum::serve(listener, app)
                .with_graceful_shutdown(async {
                    let _ = shutdown_rx.await;
                    println!("[WebServer] Shutdown signal received");
                })
                .await
                .ok();
        });
    });

    // Store the handle for later shutdown
    let handle = ServerHandle {
        shutdown_tx: Some(shutdown_tx),
        shutdown_broadcast_tx: Some(shutdown_broadcast_tx),
        thread_handle: Some(thread_handle),
    };

    *SERVER_HANDLE.lock().unwrap() = Some(handle);

    token
}

/// Stop the http server gracefully
pub fn stop_web_server() {
    let handle = SERVER_HANDLE.lock().unwrap().take();
    if let Some(h) = handle {
        h.shutdown();
    }
}

/// Check if the http server is currently running
pub fn is_server_running() -> bool {
    SERVER_HANDLE.lock().unwrap().is_some()
}

//=============================================================================
// Security Middleware
//=============================================================================

/// Security middleware that validates session token and Host header
async fn security_middleware(
    State(state): State<WebServerState>,
    Query(query): Query<TokenQuery>,
    request: Request<Body>,
    next: Next,
) -> Result<Response<Body>, StatusCode> {
    let path = request.uri().path();

    // Skip security for non-API routes (static files)
    if !path.starts_with("/api/") {
        return Ok(next.run(request).await);
    }

    // Skip security for health check and SSE events
    if path == "/api/health" || path == "/api/events" {
        return Ok(next.run(request).await);
    }

    // Validate Host header (DNS rebinding protection)
    if let Some(host) = request.headers().get("host") {
        if let Ok(host_str) = host.to_str() {
            let valid_hosts = [
                &format!("localhost:{}", WEB_SERVER_PORT),
                "localhost",
            ];
            if !valid_hosts.iter().any(|h| host_str.starts_with(h)) {
                eprintln!("[WebServer] Rejected request with invalid Host: {}", host_str);
                return Err(StatusCode::UNAUTHORIZED);
            }
        }
    }

    // Validate session token
    let token = query.token.clone().unwrap_or_default();
    if !state.session_manager.validate_token(&token) {
        eprintln!("[WebServer] Rejected request with invalid token");
        return Err(StatusCode::UNAUTHORIZED);
    }

    // For POST requests, validate Origin header
    if request.method() == "POST" {
        if let Some(origin) = request.headers().get("origin") {
            if let Ok(origin_str) = origin.to_str() {
                let valid_origins = [
                    &format!("http://localhost:{}", WEB_SERVER_PORT),
                    "http://localhost:1420",
                ];
                if !valid_origins.iter().any(|o| origin_str == *o) {
                    eprintln!("[WebServer] Rejected POST with invalid Origin: {}", origin_str);
                    return Err(StatusCode::UNAUTHORIZED);
                }
            }
        }
    }

    Ok(next.run(request).await)
}

//=============================================================================
// API Endpoints
//=============================================================================

/// Standard API response wrapper
#[derive(Serialize)]
struct ApiResponse<T> {
    success: bool,
    data: Option<T>,
    error: Option<String>,
}

impl<T: Serialize> ApiResponse<T> {
    fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    fn error(message: String) -> ApiResponse<()> {
        ApiResponse {
            success: false,
            data: None,
            error: Some(message),
        }
    }
}

/// Health check endpoint
async fn api_health() -> impl IntoResponse {
    Json(ApiResponse::success("OK"))
}

/// SSE endpoint for shutdown notifications
/// Browsers connect to this endpoint and receive events when:
/// - The server is about to shut down
/// Note: Price alerts are now handled by qm-sync server via push/email/SSE
async fn sse_handler(
    State(state): State<WebServerState>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let mut shutdown_rx = state.shutdown_broadcast.subscribe();

    let stream = async_stream::stream! {
        // Send an initial "connected" event
        yield Ok(Event::default().event("connected").data("Browser connected to desktop server"));

        // Keep connection alive and wait for events
        loop {
            tokio::select! {
                // Check for shutdown broadcast
                result = shutdown_rx.recv() => {
                    match result {
                        Ok(msg) => {
                            println!("[WebServer] SSE: Sending {} event to browser", msg);
                            yield Ok(Event::default().event(&msg).data("Server is shutting down"));
                            break;
                        }
                        Err(broadcast::error::RecvError::Closed) => {
                            yield Ok(Event::default().event("shutdown").data("Server connection closed"));
                            break;
                        }
                        Err(broadcast::error::RecvError::Lagged(_)) => {
                            continue;
                        }
                    }
                }
                // Send keepalive ping every 30 seconds
                _ = tokio::time::sleep(Duration::from_secs(30)) => {
                    yield Ok(Event::default().event("ping").data("keepalive"));
                }
            }
        }
    };

    Sse::new(stream).keep_alive(KeepAlive::default())
}

/// Stock history API
async fn api_stock_history(
    State(state): State<WebServerState>,
    Json(request): Json<StockHistoryRequest>,
) -> impl IntoResponse {
    match state.gateway.fetch_stock_history(request).await {
        Ok(response) => Json(ApiResponse::success(response)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(e.to_string())),
        )
            .into_response(),
    }
}

/// Gold price API
async fn api_gold_price(
    State(state): State<WebServerState>,
    Json(request): Json<GoldPriceRequest>,
) -> impl IntoResponse {
    match state.gateway.fetch_gold_history(request).await {
        Ok(response) => Json(ApiResponse::success(response)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(e.to_string())),
        )
            .into_response(),
    }
}

/// Exchange rate API
async fn api_exchange_rate(
    State(state): State<WebServerState>,
    Json(request): Json<ExchangeRateRequest>,
) -> impl IntoResponse {
    match state.gateway.fetch_exchange_rate_history(request).await {
        Ok(response) => Json(ApiResponse::success(response)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(e.to_string())),
        )
            .into_response(),
    }
}

/// Gold premium API
async fn api_gold_premium(
    State(state): State<WebServerState>,
    Json(request): Json<GoldPremiumRequest>,
) -> impl IntoResponse {
    use qm_fin_catch_data::models::gold_premium::GoldPremiumCalculator;

    if let Err(e) = request.validate() {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error(e.to_string())),
        )
            .into_response();
    }

    match GoldPremiumCalculator::calculate(&state.gateway, &request).await {
        Ok(response) => Json(ApiResponse::success(response)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(e.to_string())),
        )
            .into_response(),
    }
}

/// Get available sources
async fn api_get_sources(State(state): State<WebServerState>) -> impl IntoResponse {
    Json(ApiResponse::success(state.gateway.list_sources_by_type()))
}

/// Health check all sources
async fn api_health_check_all(State(state): State<WebServerState>) -> impl IntoResponse {
    let results = state.gateway.health_check_all().await;
    Json(ApiResponse::success(results))
}

/// Get current auth status (read-only, managed by desktop)
async fn api_auth_status(State(state): State<WebServerState>) -> impl IntoResponse {
    let status = state.auth_status.get();
    Json(ApiResponse::success(status))
}

/// Get current sync status (read-only, managed by desktop)
async fn api_sync_status(State(state): State<WebServerState>) -> impl IntoResponse {
    let status = state.sync_status.get();
    Json(ApiResponse::success(status))
}

/// Trigger sync now from browser
async fn api_sync_now(State(state): State<WebServerState>) -> impl IntoResponse {
    // Get sync service and app_handle
    let sync_service = match state.sync_service.lock() {
        Ok(s) => s.clone(),
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<()>::error(format!("Failed to lock sync service: {}", e))),
            )
                .into_response();
        }
    };

    // Perform sync
    match sync_service.sync_now(&state.app_handle).await {
        Ok(result) => {
            // Update shared sync status after successful sync
            let status = sync_service.get_sync_status(&state.app_handle).await;
            if let Ok(s) = status {
                state.sync_status.update(crate::shared_sync::SharedSyncStatus {
                    configured: s.configured,
                    authenticated: s.authenticated,
                    server_url: s.server_url,
                    last_sync_at: s.last_sync_at,
                    pending_changes: s.pending_changes as i32,
                });
            }
            Json(ApiResponse::success(result)).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(e)),
        )
            .into_response(),
    }
}

//=============================================================================
// Portfolio CRUD API Endpoints
//=============================================================================

/// Create a new portfolio
async fn api_create_portfolio(
    State(state): State<WebServerState>,
    Json(mut portfolio): Json<Portfolio>,
) -> impl IntoResponse {
    // Generate UUID if not provided
    if portfolio.id.is_empty() {
        portfolio.id = uuid::Uuid::new_v4().to_string();
    }

    match state.db.create_portfolio(&portfolio) {
        Ok(id) => Json(ApiResponse::success(id)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(e.to_string())),
        )
            .into_response(),
    }
}

/// List all portfolios
async fn api_list_portfolios(State(state): State<WebServerState>) -> impl IntoResponse {
    match state.db.list_portfolios() {
        Ok(portfolios) => Json(ApiResponse::success(portfolios)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(e.to_string())),
        )
            .into_response(),
    }
}

/// Get a portfolio by ID
async fn api_get_portfolio(
    State(state): State<WebServerState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match state.db.get_portfolio(&id) {
        Ok(portfolio) => Json(ApiResponse::success(portfolio)).into_response(),
        Err(e) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<()>::error(e.to_string())),
        )
            .into_response(),
    }
}

/// Update a portfolio
async fn api_update_portfolio(
    State(state): State<WebServerState>,
    Path(_id): Path<String>,
    Json(portfolio): Json<Portfolio>,
) -> impl IntoResponse {
    match state.db.update_portfolio(&portfolio) {
        Ok(()) => Json(ApiResponse::success(())).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(e.to_string())),
        )
            .into_response(),
    }
}

/// Delete a portfolio
async fn api_delete_portfolio(
    State(state): State<WebServerState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match state.db.delete_portfolio(&id) {
        Ok(()) => Json(ApiResponse::success(())).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(e.to_string())),
        )
            .into_response(),
    }
}

//=============================================================================
// Portfolio Entry CRUD API Endpoints
//=============================================================================

/// Create a new entry
async fn api_create_entry(
    State(state): State<WebServerState>,
    Json(mut entry): Json<PortfolioEntry>,
) -> impl IntoResponse {
    // Generate UUID if not provided
    if entry.id.is_empty() {
        entry.id = uuid::Uuid::new_v4().to_string();
    }

    match state.db.create_entry(&entry) {
        Ok(id) => Json(ApiResponse::success(id)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(e.to_string())),
        )
            .into_response(),
    }
}

/// List entries for a portfolio
async fn api_list_entries(
    State(state): State<WebServerState>,
    Path(portfolio_id): Path<String>,
) -> impl IntoResponse {
    match state.db.list_entries(&portfolio_id) {
        Ok(entries) => Json(ApiResponse::success(entries)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(e.to_string())),
        )
            .into_response(),
    }
}

/// Get a single entry by ID
async fn api_get_entry(
    State(state): State<WebServerState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match state.db.get_entry(&id) {
        Ok(entry) => Json(ApiResponse::success(entry)).into_response(),
        Err(e) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<()>::error(e.to_string())),
        )
            .into_response(),
    }
}

/// Update an entry
async fn api_update_entry(
    State(state): State<WebServerState>,
    Path(_id): Path<String>,
    Json(entry): Json<PortfolioEntry>,
) -> impl IntoResponse {
    match state.db.update_entry(&entry) {
        Ok(()) => Json(ApiResponse::success(())).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(e.to_string())),
        )
            .into_response(),
    }
}

/// Delete an entry
async fn api_delete_entry(
    State(state): State<WebServerState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match state.db.delete_entry(&id) {
        Ok(()) => Json(ApiResponse::success(())).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(e.to_string())),
        )
            .into_response(),
    }
}

//=============================================================================
// Coupon Payment CRUD API Endpoints
//=============================================================================

/// Create a new coupon payment
async fn api_create_coupon_payment(
    State(state): State<WebServerState>,
    Json(mut payment): Json<BondCouponPayment>,
) -> impl IntoResponse {
    // Generate UUID if not provided
    if payment.id.is_empty() {
        payment.id = uuid::Uuid::new_v4().to_string();
    }

    match state.db.create_coupon_payment(&payment) {
        Ok(id) => Json(ApiResponse::success(id)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(e.to_string())),
        )
            .into_response(),
    }
}

/// List coupon payments for an entry
async fn api_list_coupon_payments(
    State(state): State<WebServerState>,
    Path(entry_id): Path<String>,
) -> impl IntoResponse {
    match state.db.list_coupon_payments(&entry_id) {
        Ok(payments) => Json(ApiResponse::success(payments)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(e.to_string())),
        )
            .into_response(),
    }
}

/// Update a coupon payment
async fn api_update_coupon_payment(
    State(state): State<WebServerState>,
    Path(_id): Path<String>,
    Json(payment): Json<BondCouponPayment>,
) -> impl IntoResponse {
    match state.db.update_coupon_payment(&payment) {
        Ok(()) => Json(ApiResponse::success(())).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(e.to_string())),
        )
            .into_response(),
    }
}

/// Delete a coupon payment
async fn api_delete_coupon_payment(
    State(state): State<WebServerState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match state.db.delete_coupon_payment(&id) {
        Ok(()) => Json(ApiResponse::success(())).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(e.to_string())),
        )
            .into_response(),
    }
}

//=============================================================================
// Static Asset Serving
//=============================================================================

/// Serve static files from embedded dist folder
async fn serve_static(uri: Uri) -> impl IntoResponse {
    let path = uri.path().trim_start_matches('/');

    // Try to serve the requested file, or fall back to index.html for SPA routing
    let file_path = if path.is_empty() { "index.html" } else { path };

    match Asset::get(file_path) {
        Some(content) => {
            let mime = mime_guess::from_path(file_path).first_or_octet_stream();
            Response::builder()
                .status(StatusCode::OK)
                .header(header::CONTENT_TYPE, mime.as_ref())
                .body(Body::from(content.data.into_owned()))
                .unwrap()
        }
        None => {
            // For SPA routing, return index.html for non-file paths
            match Asset::get("index.html") {
                Some(content) => Response::builder()
                    .status(StatusCode::OK)
                    .header(header::CONTENT_TYPE, "text/html")
                    .body(Body::from(content.data.into_owned()))
                    .unwrap(),
                None => Response::builder()
                    .status(StatusCode::NOT_FOUND)
                    .body(Body::from("Not Found"))
                    .unwrap(),
            }
        }
    }
}
