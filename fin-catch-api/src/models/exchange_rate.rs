use serde::{Deserialize, Serialize};

/// Exchange rate request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExchangeRateRequest {
    /// Currency code (e.g., "USD", "EUR", "JPY")
    pub currency_code: String,

    /// Start date (Unix timestamp in seconds)
    pub from: i64,

    /// End date (Unix timestamp in seconds)
    pub to: i64,

    /// Optional: data source to use (e.g., "vietcombank")
    /// If not specified, uses the default source
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
}

impl ExchangeRateRequest {
    pub fn new(currency_code: String, from: i64, to: i64) -> Self {
        Self {
            currency_code,
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
        if self.currency_code.is_empty() {
            return Err("Currency code cannot be empty".to_string());
        }

        if self.from >= self.to {
            return Err("'from' timestamp must be less than 'to' timestamp".to_string());
        }

        if self.from < 0 || self.to < 0 {
            return Err("Timestamps must be positive".to_string());
        }

        // Validate 180-day limit
        const MAX_DAYS: i64 = 180;
        let days_requested = (self.to - self.from) / 86400; // seconds to days
        if days_requested > MAX_DAYS {
            return Err(format!(
                "Date range exceeds maximum limit of {} days. Requested: {} days",
                MAX_DAYS, days_requested
            ));
        }

        Ok(())
    }
}

/// Exchange rate data point
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExchangeRatePoint {
    /// Timestamp (Unix timestamp in seconds)
    pub timestamp: i64,

    /// Currency code (e.g., "USD", "EUR")
    pub currency_code: String,

    /// Currency name (e.g., "US Dollar", "Euro")
    pub currency_name: String,

    /// Buy/cash in rate (Mua tiền mặt)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub buy_cash: Option<f64>,

    /// Buy/transfer in rate (Mua chuyển khoản)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub buy_transfer: Option<f64>,

    /// Sell rate (Bán)
    pub sell: f64,
}

/// Exchange rate response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExchangeRateResponse {
    /// Currency code
    pub currency_code: String,

    /// Data source that provided this data
    pub source: String,

    /// Status code (e.g., "ok", "error")
    pub status: String,

    /// Array of exchange rate data
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<Vec<ExchangeRatePoint>>,

    /// Error message if status is "error"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,

    /// Additional metadata
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

impl ExchangeRateResponse {
    pub fn success(
        currency_code: String,
        source: String,
        data: Vec<ExchangeRatePoint>,
    ) -> Self {
        Self {
            currency_code,
            source,
            status: "ok".to_string(),
            data: Some(data),
            error: None,
            metadata: None,
        }
    }

    pub fn error(currency_code: String, source: String, error: String) -> Self {
        Self {
            currency_code,
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
