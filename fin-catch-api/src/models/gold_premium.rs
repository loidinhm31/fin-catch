use serde::{Deserialize, Serialize};

/// Gold premium request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoldPremiumRequest {
    /// Start date (Unix timestamp in seconds)
    pub from: i64,

    /// End date (Unix timestamp in seconds)
    pub to: i64,

    /// Gold type/product ID (e.g., "1" for SJC gold)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gold_price_id: Option<String>,

    /// Currency code for exchange rate (defaults to "USD")
    #[serde(skip_serializing_if = "Option::is_none")]
    pub currency_code: Option<String>,

    /// Optional: gold data source to use (e.g., "mihong", "sjc")
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gold_source: Option<String>,

    /// Optional: exchange rate source to use (e.g., "vietcombank")
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exchange_rate_source: Option<String>,

    /// Optional: stock source to use (defaults to "yahoo-finance")
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stock_source: Option<String>,
}

impl GoldPremiumRequest {
    pub fn new(from: i64, to: i64) -> Self {
        Self {
            from,
            to,
            gold_price_id: Some("1".to_string()),
            currency_code: Some("USD".to_string()),
            gold_source: None,
            exchange_rate_source: None,
            stock_source: None,
        }
    }

    pub fn with_gold_price_id(mut self, gold_price_id: String) -> Self {
        self.gold_price_id = Some(gold_price_id);
        self
    }

    pub fn with_currency_code(mut self, currency_code: String) -> Self {
        self.currency_code = Some(currency_code);
        self
    }

    pub fn with_gold_source(mut self, source: String) -> Self {
        self.gold_source = Some(source);
        self
    }

    pub fn with_exchange_rate_source(mut self, source: String) -> Self {
        self.exchange_rate_source = Some(source);
        self
    }

    pub fn with_stock_source(mut self, source: String) -> Self {
        self.stock_source = Some(source);
        self
    }

    pub fn validate(&self) -> Result<(), String> {
        if self.from >= self.to {
            return Err("'from' timestamp must be less than 'to' timestamp".to_string());
        }

        if self.from < 0 || self.to < 0 {
            return Err("Timestamps must be positive".to_string());
        }

        Ok(())
    }
}

/// Gold premium data point for a specific date
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoldPremiumPoint {
    /// Timestamp (Unix timestamp in seconds)
    pub timestamp: i64,

    /// Target price (local gold price in VND)
    pub target_price: f64,

    /// Market price (international spot price in USD per troy ounce)
    pub market_price_usd: f64,

    /// Exchange rate (USD to VND)
    pub exchange_rate: f64,

    /// Market price converted to VND per lượng (tael)
    pub market_price_vnd: f64,

    /// Premium rate as percentage
    /// Formula: [(target_price - market_price_vnd) / market_price_vnd] × 100%
    pub premium_rate: f64,

    /// Premium rate as percentage
    /// Formula: (target_price - market_price_vnd) 
    pub premium_value: f64,

    /// Gold type/product name (e.g., "SJC", "999")
    pub gold_type: String,
}

/// Gold premium response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoldPremiumResponse {
    /// Status code (e.g., "ok", "error")
    pub status: String,

    /// Array of gold premium data points
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<Vec<GoldPremiumPoint>>,

    /// Error message if status is "error"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,

    /// Additional metadata
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

impl GoldPremiumResponse {
    pub fn success(data: Vec<GoldPremiumPoint>) -> Self {
        Self {
            status: "ok".to_string(),
            data: Some(data),
            error: None,
            metadata: None,
        }
    }

    pub fn error(error: String) -> Self {
        Self {
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
