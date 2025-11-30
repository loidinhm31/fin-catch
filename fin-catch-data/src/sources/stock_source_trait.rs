use crate::{error::ApiResult, models::{StockHistoryRequest, StockHistoryResponse}};
use async_trait::async_trait;

/// Trait that all stock data sources must implement
/// This allows for a unified interface across different data providers
#[async_trait]
pub trait StockDataSource: Send + Sync {
    /// Returns the name/identifier of this data source
    fn name(&self) -> &str;

    /// Fetches historical stock data based on the request
    async fn fetch_history(&self, request: &StockHistoryRequest) -> ApiResult<StockHistoryResponse>;

    /// Optional: Check if the data source is available/healthy
    async fn health_check(&self) -> ApiResult<bool> {
        Ok(true)
    }

    /// Optional: Get any source-specific configuration or metadata
    fn metadata(&self) -> serde_json::Value {
        serde_json::json!({
            "source": self.name(),
        })
    }
}
