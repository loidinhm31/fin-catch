mod db;

use std::sync::Arc;
use tauri::{Manager, State};
use fin_catch_data::{
    DataSourceGateway,
    StockHistoryRequest, StockHistoryResponse,
    GoldPriceRequest, GoldPriceResponse,
    ExchangeRateRequest, ExchangeRateResponse,
    GoldPremiumRequest, GoldPremiumResponse,
};
use db::{Database, Portfolio, PortfolioEntry, BondCouponPayment};

// Application state that holds the data source gateway and database
pub struct AppState {
    gateway: Arc<DataSourceGateway>,
    db: Arc<Database>,
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
fn create_portfolio(portfolio: Portfolio, state: State<'_, AppState>) -> Result<i64, String> {
    state.db.create_portfolio(&portfolio).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_portfolio(id: i64, state: State<'_, AppState>) -> Result<Portfolio, String> {
    state.db.get_portfolio(id).map_err(|e| e.to_string())
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
fn delete_portfolio(id: i64, state: State<'_, AppState>) -> Result<(), String> {
    state.db.delete_portfolio(id).map_err(|e| e.to_string())
}

// Portfolio Entry commands
#[tauri::command]
fn create_entry(entry: PortfolioEntry, state: State<'_, AppState>) -> Result<i64, String> {
    state.db.create_entry(&entry).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_entry(id: i64, state: State<'_, AppState>) -> Result<PortfolioEntry, String> {
    state.db.get_entry(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_entries(portfolio_id: i64, state: State<'_, AppState>) -> Result<Vec<PortfolioEntry>, String> {
    state.db.list_entries(portfolio_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_entry(entry: PortfolioEntry, state: State<'_, AppState>) -> Result<(), String> {
    state.db.update_entry(&entry).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_entry(id: i64, state: State<'_, AppState>) -> Result<(), String> {
    state.db.delete_entry(id).map_err(|e| e.to_string())
}

// Bond Coupon Payment commands
#[tauri::command]
fn create_coupon_payment(payment: BondCouponPayment, state: State<'_, AppState>) -> Result<i64, String> {
    state.db.create_coupon_payment(&payment).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_coupon_payments(entry_id: i64, state: State<'_, AppState>) -> Result<Vec<BondCouponPayment>, String> {
    state.db.list_coupon_payments(entry_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_coupon_payment(payment: BondCouponPayment, state: State<'_, AppState>) -> Result<(), String> {
    state.db.update_coupon_payment(&payment).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_coupon_payment(id: i64, state: State<'_, AppState>) -> Result<(), String> {
    state.db.delete_coupon_payment(id).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Initialize the data source gateway with all sources
            let gateway = Arc::new(DataSourceGateway::with_all_sources());

            // Initialize database
            let app_data_dir = app.path().app_data_dir().expect("failed to get app data dir");
            std::fs::create_dir_all(&app_data_dir).expect("failed to create app data dir");
            let db_path = app_data_dir.join("portfolio.db");
            let db = Arc::new(Database::new(db_path).expect("failed to initialize database"));

            let app_state = AppState { gateway, db };
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
