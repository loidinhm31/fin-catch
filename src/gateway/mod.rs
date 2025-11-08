use crate::{
    error::{ApiError, ApiResult},
    models::{StockHistoryRequest, StockHistoryResponse},
    sources::StockDataSource,
};
use std::{collections::HashMap, sync::Arc};

/// Gateway that manages multiple stock data sources
/// Routes requests to the appropriate data source
pub struct DataSourceGateway {
    sources: HashMap<String, Arc<dyn StockDataSource>>,
    default_source: String,
}

impl DataSourceGateway {
    pub fn new(default_source: String) -> Self {
        Self {
            sources: HashMap::new(),
            default_source,
        }
    }

    /// Register a new data source
    pub fn register_source(&mut self, source: Arc<dyn StockDataSource>) {
        let name = source.name().to_string();
        self.sources.insert(name, source);
    }

    /// Get a data source by name
    pub fn get_source(&self, name: &str) -> Option<&Arc<dyn StockDataSource>> {
        self.sources.get(name)
    }

    /// List all available data sources
    pub fn list_sources(&self) -> Vec<String> {
        self.sources.keys().cloned().collect()
    }

    /// Get metadata for all sources
    pub fn sources_metadata(&self) -> HashMap<String, serde_json::Value> {
        self.sources
            .iter()
            .map(|(name, source)| (name.clone(), source.metadata()))
            .collect()
    }

    /// Fetch stock history using the specified or default source
    pub async fn fetch_history(
        &self,
        mut request: StockHistoryRequest,
    ) -> ApiResult<StockHistoryResponse> {
        // Validate request
        request
            .validate()
            .map_err(|e| ApiError::InvalidRequest(e))?;

        // Determine which source to use
        let source_name = request
            .source
            .as_ref()
            .unwrap_or(&self.default_source)
            .clone();

        // Get the source
        let source = self
            .get_source(&source_name)
            .ok_or_else(|| ApiError::UnknownSource(source_name.clone()))?;

        // Fetch data from the source
        source.fetch_history(&request).await
    }

    /// Health check for all sources
    pub async fn health_check_all(&self) -> HashMap<String, bool> {
        let mut results = HashMap::new();

        for (name, source) in &self.sources {
            let is_healthy = source.health_check().await.unwrap_or(false);
            results.insert(name.clone(), is_healthy);
        }

        results
    }

    /// Health check for a specific source
    pub async fn health_check(&self, source_name: &str) -> ApiResult<bool> {
        let source = self
            .get_source(source_name)
            .ok_or_else(|| ApiError::UnknownSource(source_name.to_string()))?;

        source.health_check().await
    }
}

impl Default for DataSourceGateway {
    fn default() -> Self {
        Self::new("vndirect".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::sources::VndirectSource;

    #[test]
    fn test_gateway_creation() {
        let mut gateway = DataSourceGateway::new("vndirect".to_string());
        let source = Arc::new(VndirectSource::new());
        gateway.register_source(source);

        assert_eq!(gateway.list_sources().len(), 1);
        assert!(gateway.get_source("vndirect").is_some());
    }
}
