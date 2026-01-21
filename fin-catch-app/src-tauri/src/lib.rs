mod db;
mod auth;
mod sync;
mod session;
mod shared_auth;
mod shared_sync;
mod web_server;

use std::sync::{Arc, Mutex};
use tauri::{Manager, State};
use fin_catch_data::{
    DataSourceGateway,
    StockHistoryRequest, StockHistoryResponse,
    GoldPriceRequest, GoldPriceResponse,
    ExchangeRateRequest, ExchangeRateResponse,
    GoldPremiumRequest, GoldPremiumResponse,
};
use db::{Database, Portfolio, PortfolioEntry, BondCouponPayment};
use auth::{AuthService, AuthResponse, AuthStatus};
use sync::{SyncService, SyncResult, SyncStatus};

// Application state that holds the data source gateway, database, auth service, and sync service
pub struct AppState {
    gateway: Arc<DataSourceGateway>,
    db: Arc<Database>,
    auth: Arc<Mutex<AuthService>>,
    sync: Arc<Mutex<SyncService>>,
}

// Stock history command
#[tauri::command]
async fn fetch_stock_history(
    request: StockHistoryRequest,
    state: State<'_, AppState>,
) -> Result<StockHistoryResponse, String> {
    state
        .gateway
        .fetch_stock_history(request)
        .await
        .map_err(|e| e.to_string())
}

// Gold price command
#[tauri::command]
async fn fetch_gold_price(
    request: GoldPriceRequest,
    state: State<'_, AppState>,
) -> Result<GoldPriceResponse, String> {
    state
        .gateway
        .fetch_gold_history(request)
        .await
        .map_err(|e| e.to_string())
}

// Exchange rate command
#[tauri::command]
async fn fetch_exchange_rate(
    request: ExchangeRateRequest,
    state: State<'_, AppState>,
) -> Result<ExchangeRateResponse, String> {
    state
        .gateway
        .fetch_exchange_rate_history(request)
        .await
        .map_err(|e| e.to_string())
}

// Gold premium command
#[tauri::command]
async fn fetch_gold_premium(
    request: GoldPremiumRequest,
    state: State<'_, AppState>,
) -> Result<GoldPremiumResponse, String> {
    use fin_catch_data::models::gold_premium::GoldPremiumCalculator;

    // Validate request
    request.validate().map_err(|e| e.to_string())?;

    // Calculate gold premium using the gateway
    GoldPremiumCalculator::calculate(&state.gateway, &request)
        .await
        .map_err(|e| e.to_string())
}

// List all available sources
#[tauri::command]
fn get_sources(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!(state.gateway.list_sources_by_type()))
}

// Health check for all sources
#[tauri::command]
async fn health_check_all(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let results = state.gateway.health_check_all().await;
    Ok(serde_json::json!(results))
}

// Health check for a specific source
#[tauri::command]
async fn health_check_source(
    source_name: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    state
        .gateway
        .health_check(&source_name)
        .await
        .map_err(|e| e.to_string())
}

// Portfolio commands
#[tauri::command]
fn create_portfolio(mut portfolio: Portfolio, state: State<'_, AppState>) -> Result<String, String> {
    // Generate UUID if not provided
    if portfolio.id.is_empty() {
        portfolio.id = uuid::Uuid::new_v4().to_string();
    }
    state.db.create_portfolio(&portfolio).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_portfolio(id: String, state: State<'_, AppState>) -> Result<Portfolio, String> {
    state.db.get_portfolio(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_portfolios(state: State<'_, AppState>) -> Result<Vec<Portfolio>, String> {
    state.db.list_portfolios().map_err(|e| e.to_string())
}

#[tauri::command]
fn update_portfolio(portfolio: Portfolio, state: State<'_, AppState>) -> Result<(), String> {
    state.db.update_portfolio(&portfolio).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_portfolio(id: String, state: State<'_, AppState>) -> Result<(), String> {
    state.db.delete_portfolio(&id).map_err(|e| e.to_string())
}

// Portfolio Entry commands
#[tauri::command]
fn create_entry(mut entry: PortfolioEntry, state: State<'_, AppState>) -> Result<String, String> {
    // Generate UUID if not provided
    if entry.id.is_empty() {
        entry.id = uuid::Uuid::new_v4().to_string();
    }
    state.db.create_entry(&entry).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_entry(id: String, state: State<'_, AppState>) -> Result<PortfolioEntry, String> {
    state.db.get_entry(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_entries(portfolio_id: String, state: State<'_, AppState>) -> Result<Vec<PortfolioEntry>, String> {
    state.db.list_entries(&portfolio_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_entry(entry: PortfolioEntry, state: State<'_, AppState>) -> Result<(), String> {
    state.db.update_entry(&entry).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_entry(id: String, state: State<'_, AppState>) -> Result<(), String> {
    state.db.delete_entry(&id).map_err(|e| e.to_string())
}

// Bond Coupon Payment commands
#[tauri::command]
fn create_coupon_payment(mut payment: BondCouponPayment, state: State<'_, AppState>) -> Result<String, String> {
    // Generate UUID if not provided
    if payment.id.is_empty() {
        payment.id = uuid::Uuid::new_v4().to_string();
    }
    state.db.create_coupon_payment(&payment).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_coupon_payments(entry_id: String, state: State<'_, AppState>) -> Result<Vec<BondCouponPayment>, String> {
    state.db.list_coupon_payments(&entry_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_coupon_payment(payment: BondCouponPayment, state: State<'_, AppState>) -> Result<(), String> {
    state.db.update_coupon_payment(&payment).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_coupon_payment(id: String, state: State<'_, AppState>) -> Result<(), String> {
    state.db.delete_coupon_payment(&id).map_err(|e| e.to_string())
}

// Auth commands
#[tauri::command]
async fn auth_configure_sync(
    server_url: Option<String>,
    app_id: Option<String>,
    api_key: Option<String>,
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut auth = state.auth.lock().map_err(|e| format!("Failed to lock auth service: {}", e))?.clone();
    let result = auth.configure_sync(&app_handle, server_url, app_id, api_key).await;

    // Update the shared state with the new configuration
    if result.is_ok() {
        *state.auth.lock().map_err(|e| format!("Failed to lock auth service: {}", e))? = auth;
    }

    result
}

#[tauri::command]
async fn auth_register(
    username: String,
    email: String,
    password: String,
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<AuthResponse, String> {
    let auth = state.auth.lock().map_err(|e| format!("Failed to lock auth service: {}", e))?.clone();
    auth.register(&app_handle, username, email, password).await
}

#[tauri::command]
async fn auth_login(
    email: String,
    password: String,
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    auth_status_holder: State<'_, shared_auth::SharedAuthStatusHolder>,
) -> Result<AuthResponse, String> {
    let auth = state.auth.lock().map_err(|e| format!("Failed to lock auth service: {}", e))?.clone();
    let response = auth.login(&app_handle, email.clone(), password).await?;

    // Update shared auth status for browser mode
    let status = auth.get_auth_status(&app_handle).await;
    auth_status_holder.update(shared_auth::SharedAuthStatus {
        is_authenticated: status.is_authenticated,
        user_id: status.user_id,
        username: None, // Not provided in AuthStatus
        email: Some(email),
        apps: status.apps,
        is_admin: status.is_admin,
        server_url: status.server_url,
    });

    Ok(response)
}

#[tauri::command]
async fn auth_logout(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    auth_status_holder: State<'_, shared_auth::SharedAuthStatusHolder>,
) -> Result<(), String> {
    let auth = state.auth.lock().map_err(|e| format!("Failed to lock auth service: {}", e))?.clone();
    auth.logout(&app_handle).await?;

    // Clear shared auth status
    auth_status_holder.clear();

    Ok(())
}

#[tauri::command]
async fn auth_refresh_token(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let auth = state.auth.lock().map_err(|e| format!("Failed to lock auth service: {}", e))?.clone();
    auth.refresh_token(&app_handle).await
}

#[tauri::command]
async fn auth_get_status(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    auth_status_holder: State<'_, shared_auth::SharedAuthStatusHolder>,
) -> Result<AuthStatus, String> {
    let auth = state.auth.lock().map_err(|e| format!("Failed to lock auth service: {}", e))?.clone();
    let status = auth.get_auth_status(&app_handle).await;

    // Sync shared auth status for browser mode
    auth_status_holder.update(shared_auth::SharedAuthStatus {
        is_authenticated: status.is_authenticated,
        user_id: status.user_id.clone(),
        username: None,
        email: None,
        apps: status.apps.clone(),
        is_admin: status.is_admin,
        server_url: status.server_url.clone(),
    });

    Ok(status)
}

#[tauri::command]
async fn auth_is_authenticated(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let auth = state.auth.lock().map_err(|e| format!("Failed to lock auth service: {}", e))?.clone();
    Ok(auth.is_authenticated(&app_handle).await)
}

// Sync commands
#[tauri::command]
async fn sync_now(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<SyncResult, String> {
    let sync = state.sync.lock().map_err(|e| format!("Failed to lock sync service: {}", e))?.clone();
    sync.sync_now(&app_handle).await
}

#[tauri::command]
async fn sync_get_status(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    sync_status_holder: State<'_, shared_sync::SharedSyncStatusHolder>,
) -> Result<SyncStatus, String> {
    let sync = state.sync.lock().map_err(|e| format!("Failed to lock sync service: {}", e))?.clone();
    let status = sync.get_sync_status(&app_handle).await?;

    // Sync shared status for browser mode
    sync_status_holder.update(shared_sync::SharedSyncStatus {
        configured: status.configured,
        authenticated: status.authenticated,
        server_url: status.server_url.clone(),
        last_sync_at: status.last_sync_at,
        pending_changes: status.pending_changes as i32,
    });

    Ok(status)
}

//=============================================================================
// Browser Sync Commands (On-demand web server)
//=============================================================================

/// Start the browser sync server and return the URL with session token
#[tauri::command]
fn start_browser_sync(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    session_manager: State<'_, session::SharedSessionManager>,
    auth_status_holder: State<'_, shared_auth::SharedAuthStatusHolder>,
    sync_status_holder: State<'_, shared_sync::SharedSyncStatusHolder>,
) -> Result<String, String> {
    // Check if already running
    if web_server::is_server_running() {
        return Err("Browser sync server is already running".to_string());
    }

    // Clone what we need for the web server
    let gateway_clone = state.gateway.clone();
    let db_clone = state.db.clone();
    let sync_service_clone = state.sync.clone();
    let session_manager_clone = (*session_manager).clone();
    let auth_status_clone = (*auth_status_holder).clone();
    let sync_status_clone = (*sync_status_holder).clone();
    let app_handle_clone = app_handle.clone();

    // Start the web server (price alerts now come from qm-sync server, not local)
    let token = web_server::start_web_server(
        gateway_clone,
        db_clone,
        session_manager_clone,
        auth_status_clone,
        sync_status_clone,
        sync_service_clone,
        app_handle_clone,
    );

    // In dev mode, open browser to Vite dev server for HMR support
    // In production, open to the embedded web server
    let is_dev_mode = std::env::var("TAURI_DEV_HOST").is_ok()
        || std::env::var("CARGO_MANIFEST_DIR").is_ok();

    let browser_port = if is_dev_mode {
        1420 // Vite dev server
    } else {
        web_server::WEB_SERVER_PORT // Embedded server (25092)
    };

    let url = format!("http://localhost:{}?session={}", browser_port, token);

    println!("[FinCatch] Browser sync started: {}", url);
    if is_dev_mode {
        println!("   Dev mode: Opening Vite (1420), API on {}", web_server::WEB_SERVER_PORT);
    }
    Ok(url)
}

/// Stop the browser sync server
#[tauri::command]
fn stop_browser_sync(
    session_manager: State<'_, session::SharedSessionManager>,
) -> Result<String, String> {
    web_server::stop_web_server();

    // Clear the session token
    session_manager.clear_token();

    Ok("Browser sync stopped".to_string())
}

/// Check if browser sync is currently active
#[tauri::command]
fn is_browser_sync_active() -> bool {
    web_server::is_server_running()
}

//=============================================================================
// Price Alert Commands (alert config syncs to server, monitoring on qm-sync)
//=============================================================================

/// Set alert settings for an entry (target_price, stop_loss, alert_enabled sync to server)
#[tauri::command]
fn set_entry_alerts(
    entry_id: String,
    target_price: Option<f64>,
    stop_loss: Option<f64>,
    alert_enabled: Option<bool>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state.db.set_entry_alerts(&entry_id, target_price, stop_loss, alert_enabled)
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            // Load environment variables from .env file (ignore errors if file doesn't exist)
            let _ = dotenvy::dotenv();

            // Get qm-sync configuration from environment variables
            let sync_server_url = std::env::var("SYNC_SERVER_URL")
                .unwrap_or_else(|_| "http://localhost:3000".to_string());
            let sync_center_app_id = std::env::var("SYNC_CENTER_APP_ID")
                .unwrap_or_else(|_| "your_app_id_here".to_string());
            let sync_center_api_key = std::env::var("SYNC_CENTER_API_KEY")
                .unwrap_or_else(|_| "your_api_key_here".to_string());

            // Initialize the data source gateway with all sources
            let gateway = Arc::new(DataSourceGateway::with_all_sources());

            // Initialize database
            let app_data_dir = app.path().app_data_dir().expect("failed to get app data dir");
            std::fs::create_dir_all(&app_data_dir).expect("failed to create app data dir");
            let db_path = app_data_dir.join("portfolio.db");
            let db = Arc::new(Database::new(db_path).expect("failed to initialize database"));

            // Initialize auth service with configuration from environment
            let auth = Arc::new(Mutex::new(AuthService::new(
                sync_server_url.clone(),
                sync_center_app_id,
                sync_center_api_key,
            )));

            // Initialize sync service
            let sync = Arc::new(Mutex::new(SyncService::new(
                db.clone(),
                auth.clone(),
            )));

            let app_state = AppState { gateway, db, auth, sync };
            app.manage(app_state);

            // Initialize session manager for browser sync (started on-demand)
            let session_manager = session::create_session_manager();
            app.manage(session_manager);

            // Initialize shared auth status holder for browser mode
            let auth_status_holder = shared_auth::create_auth_status_holder();
            app.manage(auth_status_holder);

            // Initialize shared sync status holder for browser mode
            let sync_status_holder = shared_sync::create_sync_status_holder();
            app.manage(sync_status_holder);

            println!("[FinCatch] Application initialized");
            println!("[FinCatch] Price alerts now managed by qm-sync server");
            println!("[FinCatch] Browser sync available - use 'Open in Browser' to start");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            fetch_stock_history,
            fetch_gold_price,
            fetch_exchange_rate,
            fetch_gold_premium,
            get_sources,
            health_check_all,
            health_check_source,
            create_portfolio,
            get_portfolio,
            list_portfolios,
            update_portfolio,
            delete_portfolio,
            create_entry,
            get_entry,
            list_entries,
            update_entry,
            delete_entry,
            create_coupon_payment,
            list_coupon_payments,
            update_coupon_payment,
            delete_coupon_payment,
            auth_configure_sync,
            auth_register,
            auth_login,
            auth_logout,
            auth_refresh_token,
            auth_get_status,
            auth_is_authenticated,
            sync_now,
            sync_get_status,
            // Browser sync
            start_browser_sync,
            stop_browser_sync,
            is_browser_sync_active,
            // Price alerts (alert configs sync to server, monitoring handled by qm-sync)
            set_entry_alerts,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
