use crate::{
    error::{ApiError, ApiResult},
    models::{
        DataRequest, DataResponse, DataType, GoldPriceRequest, GoldPriceResponse,
        StockHistoryRequest, StockHistoryResponse,
    },
    sources::{GoldDataSource, StockDataSource},
};
use std::{collections::HashMap, sync::Arc};

/// Gateway that manages multiple data sources (stock and gold)
/// Routes requests to the appropriate data source based on data type
pub struct DataSourceGateway {
    stock_sources: HashMap<String, Arc<dyn StockDataSource>>,
    gold_sources: HashMap<String, Arc<dyn GoldDataSource>>,
    default_stock_source: String,
    default_gold_source: String,
}

impl DataSourceGateway {
    pub fn new(default_stock_source: String, default_gold_source: String) -> Self {
        Self {
            stock_sources: HashMap::new(),
            gold_sources: HashMap::new(),
            default_stock_source,
            default_gold_source,
        }
    }

    /// Register a new stock data source
    pub fn register_stock_source(&mut self, source: Arc<dyn StockDataSource>) {
        let name = source.name().to_string();
        self.stock_sources.insert(name, source);
    }

    /// Register a new gold data source
    pub fn register_gold_source(&mut self, source: Arc<dyn GoldDataSource>) {
        let name = source.name().to_string();
        self.gold_sources.insert(name, source);
    }

    /// Get a stock data source by name
    pub fn get_stock_source(&self, name: &str) -> Option<&Arc<dyn StockDataSource>> {
        self.stock_sources.get(name)
    }

    /// Get a gold data source by name
    pub fn get_gold_source(&self, name: &str) -> Option<&Arc<dyn GoldDataSource>> {
        self.gold_sources.get(name)
    }

    /// List all available stock data sources
    pub fn list_stock_sources(&self) -> Vec<String> {
        self.stock_sources.keys().cloned().collect()
    }

    /// List all available gold data sources
    pub fn list_gold_sources(&self) -> Vec<String> {
        self.gold_sources.keys().cloned().collect()
    }

    /// List all available data sources by type
    pub fn list_sources_by_type(&self) -> HashMap<String, Vec<String>> {
        let mut result = HashMap::new();
        result.insert("stock".to_string(), self.list_stock_sources());
        result.insert("gold".to_string(), self.list_gold_sources());
        result
    }

    /// Get metadata for all sources
    pub fn sources_metadata(&self) -> HashMap<String, serde_json::Value> {
        let mut metadata = HashMap::new();

        for (name, source) in &self.stock_sources {
            metadata.insert(name.clone(), source.metadata());
        }

        for (name, source) in &self.gold_sources {
            metadata.insert(name.clone(), source.metadata());
        }

        metadata
    }

    /// Fetch stock history using the specified or default source
    pub async fn fetch_stock_history(
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
            .unwrap_or(&self.default_stock_source)
            .clone();

        // Get the source
        let source = self
            .get_stock_source(&source_name)
            .ok_or_else(|| ApiError::UnknownSource(source_name.clone()))?;

        // Fetch data from the source
        source.fetch_history(&request).await
    }

    /// Fetch gold price history using the specified or default source
    pub async fn fetch_gold_history(
        &self,
        mut request: GoldPriceRequest,
    ) -> ApiResult<GoldPriceResponse> {
        // Validate request
        request
            .validate()
            .map_err(|e| ApiError::InvalidRequest(e))?;

        // Determine which source to use
        let source_name = request
            .source
            .as_ref()
            .unwrap_or(&self.default_gold_source)
            .clone();

        // Get the source
        let source = self
            .get_gold_source(&source_name)
            .ok_or_else(|| ApiError::UnknownSource(source_name.clone()))?;

        // Fetch data from the source
        source.fetch_history(&request).await
    }

    /// Unified fetch method that handles both stock and gold data
    pub async fn fetch_data(&self, mut request: DataRequest) -> ApiResult<DataResponse> {
        match request {
            DataRequest::Stock(ref mut stock_req) => {
                let response = self.fetch_stock_history(stock_req.clone()).await?;
                Ok(DataResponse::Stock(response))
            }
            DataRequest::Gold(ref mut gold_req) => {
                let response = self.fetch_gold_history(gold_req.clone()).await?;
                Ok(DataResponse::Gold(response))
            }
        }
    }

    /// Health check for all sources (both stock and gold)
    pub async fn health_check_all(&self) -> HashMap<String, bool> {
        let mut results = HashMap::new();

        for (name, source) in &self.stock_sources {
            let is_healthy = source.health_check().await.unwrap_or(false);
            results.insert(name.clone(), is_healthy);
        }

        for (name, source) in &self.gold_sources {
            let is_healthy = source.health_check().await.unwrap_or(false);
            results.insert(name.clone(), is_healthy);
        }

        results
    }

    /// Health check for a specific source (searches both stock and gold sources)
    pub async fn health_check(&self, source_name: &str) -> ApiResult<bool> {
        // Try stock sources first
        if let Some(source) = self.get_stock_source(source_name) {
            return source.health_check().await;
        }

        // Try gold sources
        if let Some(source) = self.get_gold_source(source_name) {
            return source.health_check().await;
        }

        Err(ApiError::UnknownSource(source_name.to_string()))
    }
}

impl Default for DataSourceGateway {
    fn default() -> Self {
        Self::new("vndirect".to_string(), "sjc".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::sources::{SjcSource, VndirectSource};

    #[test]
    fn test_gateway_creation() {
        let mut gateway = DataSourceGateway::new("vndirect".to_string(), "sjc".to_string());

        let stock_source = Arc::new(VndirectSource::new());
        gateway.register_stock_source(stock_source);

        let gold_source = Arc::new(SjcSource::new());
        gateway.register_gold_source(gold_source);

        assert_eq!(gateway.list_stock_sources().len(), 1);
        assert_eq!(gateway.list_gold_sources().len(), 1);
        assert!(gateway.get_stock_source("vndirect").is_some());
        assert!(gateway.get_gold_source("sjc").is_some());
    }
}
