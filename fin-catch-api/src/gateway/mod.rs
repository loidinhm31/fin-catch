use crate::{
    error::{ApiError, ApiResult},
    models::{
        DataRequest, DataResponse, DataType, GoldPriceRequest, GoldPriceResponse,
        StockHistoryRequest, StockHistoryResponse, ExchangeRateRequest, ExchangeRateResponse,
    },
    sources::{GoldDataSource, StockDataSource, ExchangeRateDataSource},
};
use std::{collections::HashMap, sync::Arc};

/// Gateway that manages multiple data sources (stock, gold, and exchange rates)
/// Routes requests to the appropriate data source based on data type
pub struct DataSourceGateway {
    stock_sources: HashMap<String, Arc<dyn StockDataSource>>,
    gold_sources: HashMap<String, Arc<dyn GoldDataSource>>,
    exchange_rate_sources: HashMap<String, Arc<dyn ExchangeRateDataSource>>,
    default_stock_source: String,
    default_gold_source: String,
    default_exchange_rate_source: String,
}

impl DataSourceGateway {
    pub fn new(default_stock_source: String, default_gold_source: String, default_exchange_rate_source: String) -> Self {
        Self {
            stock_sources: HashMap::new(),
            gold_sources: HashMap::new(),
            exchange_rate_sources: HashMap::new(),
            default_stock_source,
            default_gold_source,
            default_exchange_rate_source,
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

    /// Register a new exchange rate data source
    pub fn register_exchange_rate_source(&mut self, source: Arc<dyn ExchangeRateDataSource>) {
        let name = source.name().to_string();
        self.exchange_rate_sources.insert(name, source);
    }

    /// Get a stock data source by name
    pub fn get_stock_source(&self, name: &str) -> Option<&Arc<dyn StockDataSource>> {
        self.stock_sources.get(name)
    }

    /// Get a gold data source by name
    pub fn get_gold_source(&self, name: &str) -> Option<&Arc<dyn GoldDataSource>> {
        self.gold_sources.get(name)
    }

    /// Get an exchange rate data source by name
    pub fn get_exchange_rate_source(&self, name: &str) -> Option<&Arc<dyn ExchangeRateDataSource>> {
        self.exchange_rate_sources.get(name)
    }

    /// List all available stock data sources
    pub fn list_stock_sources(&self) -> Vec<String> {
        self.stock_sources.keys().cloned().collect()
    }

    /// List all available gold data sources
    pub fn list_gold_sources(&self) -> Vec<String> {
        self.gold_sources.keys().cloned().collect()
    }

    /// List all available exchange rate data sources
    pub fn list_exchange_rate_sources(&self) -> Vec<String> {
        self.exchange_rate_sources.keys().cloned().collect()
    }

    /// List all available data sources by type
    pub fn list_sources_by_type(&self) -> HashMap<String, Vec<String>> {
        let mut result = HashMap::new();
        result.insert("stock".to_string(), self.list_stock_sources());
        result.insert("gold".to_string(), self.list_gold_sources());
        result.insert("exchange_rate".to_string(), self.list_exchange_rate_sources());
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

        for (name, source) in &self.exchange_rate_sources {
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

    /// Fetch exchange rate history using the specified or default source
    pub async fn fetch_exchange_rate_history(
        &self,
        mut request: ExchangeRateRequest,
    ) -> ApiResult<ExchangeRateResponse> {
        // Validate request
        request
            .validate()
            .map_err(|e| ApiError::InvalidRequest(e))?;

        // Determine which source to use
        let source_name = request
            .source
            .as_ref()
            .unwrap_or(&self.default_exchange_rate_source)
            .clone();

        // Get the source
        let source = self
            .get_exchange_rate_source(&source_name)
            .ok_or_else(|| ApiError::UnknownSource(source_name.clone()))?;

        // Fetch data from the source
        source.fetch_history(&request).await
    }

    /// Health check for all sources (stock, gold, and exchange rates)
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

        for (name, source) in &self.exchange_rate_sources {
            let is_healthy = source.health_check().await.unwrap_or(false);
            results.insert(name.clone(), is_healthy);
        }

        results
    }

    /// Health check for a specific source (searches stock, gold, and exchange rate sources)
    pub async fn health_check(&self, source_name: &str) -> ApiResult<bool> {
        // Try stock sources first
        if let Some(source) = self.get_stock_source(source_name) {
            return source.health_check().await;
        }

        // Try gold sources
        if let Some(source) = self.get_gold_source(source_name) {
            return source.health_check().await;
        }

        // Try exchange rate sources
        if let Some(source) = self.get_exchange_rate_source(source_name) {
            return source.health_check().await;
        }

        Err(ApiError::UnknownSource(source_name.to_string()))
    }
}

impl Default for DataSourceGateway {
    fn default() -> Self {
        Self::new("vndirect".to_string(), "sjc".to_string(), "vietcombank".to_string())
    }
}
