use crate::{error::ApiResult, models::{GoldPriceRequest, GoldPriceResponse}};
use async_trait::async_trait;

/// Trait that all gold price data sources must implement
/// This allows for a unified interface across different gold price providers
#[async_trait]
pub trait GoldDataSource: Send + Sync {
    /// Returns the name/identifier of this data source
    fn name(&self) -> &str;

    /// Fetches historical gold price data based on the request
    async fn fetch_history(&self, request: &GoldPriceRequest) -> ApiResult<GoldPriceResponse>;

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
