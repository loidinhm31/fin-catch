mod db;
mod auth;
mod sync;

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
) -> Result<AuthResponse, String> {
    let auth = state.auth.lock().map_err(|e| format!("Failed to lock auth service: {}", e))?.clone();
    auth.login(&app_handle, email, password).await
}

#[tauri::command]
async fn auth_logout(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let auth = state.auth.lock().map_err(|e| format!("Failed to lock auth service: {}", e))?.clone();
    auth.logout(&app_handle).await
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
) -> Result<AuthStatus, String> {
    let auth = state.auth.lock().map_err(|e| format!("Failed to lock auth service: {}", e))?.clone();
    Ok(auth.get_auth_status(&app_handle).await)
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
) -> Result<SyncStatus, String> {
    let sync = state.sync.lock().map_err(|e| format!("Failed to lock sync service: {}", e))?.clone();
    sync.get_sync_status(&app_handle).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            // Load environment variables from .env file (ignore errors if file doesn't exist)
            let _ = dotenvy::dotenv();

            // Get sync-center configuration from environment variables
            let SYNC_SERVER_URL = std::env::var("SYNC_SERVER_URL")
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
                SYNC_SERVER_URL.clone(),
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
