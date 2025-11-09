use serde::{Deserialize, Serialize};

/// Gold price request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoldPriceRequest {
    /// Gold price type/product ID
    pub gold_price_id: String,

    /// Start date (Unix timestamp in seconds)
    pub from: i64,

    /// End date (Unix timestamp in seconds)
    pub to: i64,

    /// Optional: data source to use (e.g., "sjc")
    /// If not specified, uses the default source
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
}

impl GoldPriceRequest {
    pub fn new(gold_price_id: String, from: i64, to: i64) -> Self {
        Self {
            gold_price_id,
            from,
            to,
            source: None,
        }
    }

    pub fn with_source(mut self, source: String) -> Self {
        self.source = Some(source);
        self
    }

    pub fn validate(&self) -> Result<(), String> {
        if self.gold_price_id.is_empty() {
            return Err("Gold price ID cannot be empty".to_string());
        }

        if self.from >= self.to {
            return Err("'from' timestamp must be less than 'to' timestamp".to_string());
        }

        if self.from < 0 || self.to < 0 {
            return Err("Timestamps must be positive".to_string());
        }

        Ok(())
    }
}

/// Gold price data point
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoldPricePoint {
    /// Timestamp (Unix timestamp in seconds)
    pub timestamp: i64,

    /// Gold type/product name (e.g., "Vàng SJC 1L, 10L, 1KG")
    pub type_name: String,

    /// Branch/location name (e.g., "Hồ Chí Minh")
    #[serde(skip_serializing_if = "Option::is_none")]
    pub branch_name: Option<String>,

    /// Buy/bid price
    pub buy: f64,

    /// Sell/ask price
    pub sell: f64,

    /// Buy price difference from previous
    #[serde(skip_serializing_if = "Option::is_none")]
    pub buy_differ: Option<f64>,

    /// Sell price difference from previous
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sell_differ: Option<f64>,
}

/// Gold price response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoldPriceResponse {
    /// Gold price ID
    pub gold_price_id: String,

    /// Data source that provided this data
    pub source: String,

    /// Status code (e.g., "ok", "error")
    pub status: String,

    /// Array of gold price data
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<Vec<GoldPricePoint>>,

    /// Error message if status is "error"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,

    /// Additional metadata
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

impl GoldPriceResponse {
    pub fn success(
        gold_price_id: String,
        source: String,
        data: Vec<GoldPricePoint>,
    ) -> Self {
        Self {
            gold_price_id,
            source,
            status: "ok".to_string(),
            data: Some(data),
            error: None,
            metadata: None,
        }
    }

    pub fn error(gold_price_id: String, source: String, error: String) -> Self {
        Self {
            gold_price_id,
            source,
            status: "error".to_string(),
            data: None,
            error: Some(error),
            metadata: None,
        }
    }

    pub fn with_metadata(mut self, metadata: serde_json::Value) -> Self {
        self.metadata = Some(metadata);
        self
    }
}
