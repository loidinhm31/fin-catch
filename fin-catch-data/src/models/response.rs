use serde::{Deserialize, Serialize};

/// Standard OHLCV candle data point
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Candle {
    /// Timestamp (Unix timestamp in seconds)
    pub timestamp: i64,

    /// Open price
    pub open: f64,

    /// High price
    pub high: f64,

    /// Low price
    pub low: f64,

    /// Close price
    pub close: f64,

    /// Volume
    pub volume: i64,
}

/// Standard stock history response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockHistoryResponse {
    /// Stock symbol
    pub symbol: String,

    /// Resolution/timeframe
    pub resolution: String,

    /// Data source that provided this data
    pub source: String,

    /// Status code (e.g., "ok", "error")
    pub status: String,

    /// Array of candle data
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<Vec<Candle>>,

    /// Error message if status is "error"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,

    /// Additional metadata
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

impl StockHistoryResponse {
    pub fn success(
        symbol: String,
        resolution: String,
        source: String,
        data: Vec<Candle>,
    ) -> Self {
        Self {
            symbol,
            resolution,
            source,
            status: "ok".to_string(),
            data: Some(data),
            error: None,
            metadata: None,
        }
    }

    pub fn error(symbol: String, resolution: String, source: String, error: String) -> Self {
        Self {
            symbol,
            resolution,
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
