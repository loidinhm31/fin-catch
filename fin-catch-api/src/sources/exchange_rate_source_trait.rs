use crate::{error::ApiResult, models::{ExchangeRateRequest, ExchangeRateResponse}};
use async_trait::async_trait;

/// Trait that all exchange rate data sources must implement
/// This allows for a unified interface across different exchange rate providers
#[async_trait]
pub trait ExchangeRateDataSource: Send + Sync {
    /// Returns the name/identifier of this data source
    fn name(&self) -> &str;

    /// Fetches historical exchange rate data based on the request
    async fn fetch_history(&self, request: &ExchangeRateRequest) -> ApiResult<ExchangeRateResponse>;

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
