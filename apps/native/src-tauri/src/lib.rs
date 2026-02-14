use std::sync::Arc;
use tauri::{Manager, State};
use qm_fin_catch_data::{
    DataSourceGateway,
    StockHistoryRequest, StockHistoryResponse,
    GoldPriceRequest, GoldPriceResponse,
    ExchangeRateRequest, ExchangeRateResponse,
    GoldPremiumRequest, GoldPremiumResponse,
};

/// Application state that holds the data source gateway for market data
pub struct AppState {
    gateway: Arc<DataSourceGateway>,
}

//=============================================================================
// Market Data Commands (fin-catch-data)
// These run natively for better performance than HTTP calls
//=============================================================================

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

#[tauri::command]
async fn fetch_gold_premium(
    request: GoldPremiumRequest,
    state: State<'_, AppState>,
) -> Result<GoldPremiumResponse, String> {
    use qm_fin_catch_data::models::gold_premium::GoldPremiumCalculator;

    request.validate().map_err(|e| e.to_string())?;

    GoldPremiumCalculator::calculate(&state.gateway, &request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_sources(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!(state.gateway.list_sources_by_type()))
}

#[tauri::command]
async fn health_check_all(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let results = state.gateway.health_check_all().await;
    Ok(serde_json::json!(results))
}

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            // Initialize the data source gateway with all sources
            let gateway = Arc::new(DataSourceGateway::with_all_sources());

            let app_state = AppState { gateway };
            app.manage(app_state);

            println!("[FinCatch] Native app initialized");
            println!("[FinCatch] Market data available via native commands");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Market data commands (native for performance)
            fetch_stock_history,
            fetch_gold_price,
            fetch_exchange_rate,
            fetch_gold_premium,
            get_sources,
            health_check_all,
            health_check_source,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
