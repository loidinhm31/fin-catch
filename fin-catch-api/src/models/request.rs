use serde::{Deserialize, Serialize};

/// Standard resolution/timeframe for stock data
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum Resolution {
    #[serde(rename = "1")]
    OneMinute,
    #[serde(rename = "5")]
    FiveMinutes,
    #[serde(rename = "15")]
    FifteenMinutes,
    #[serde(rename = "30")]
    ThirtyMinutes,
    #[serde(rename = "60")]
    OneHour,
    #[serde(rename = "1D")]
    OneDay,
    #[serde(rename = "1W")]
    OneWeek,
    #[serde(rename = "1M")]
    OneMonth,
}

impl Resolution {
    pub fn as_str(&self) -> &str {
        match self {
            Resolution::OneMinute => "1",
            Resolution::FiveMinutes => "5",
            Resolution::FifteenMinutes => "15",
            Resolution::ThirtyMinutes => "30",
            Resolution::OneHour => "60",
            Resolution::OneDay => "1D",
            Resolution::OneWeek => "1W",
            Resolution::OneMonth => "1M",
        }
    }
}

/// Standard stock history request
/// Compatible with multiple data sources
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockHistoryRequest {
    /// Stock symbol (e.g., "VND", "AAPL")
    pub symbol: String,

    /// Resolution/timeframe (e.g., "1D" for daily)
    pub resolution: Resolution,

    /// Start timestamp (Unix timestamp in seconds)
    pub from: i64,

    /// End timestamp (Unix timestamp in seconds)
    pub to: i64,

    /// Optional: data source to use (e.g., "vndirect", "yahoo", "alpha_vantage")
    /// If not specified, uses the default source
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
}

impl StockHistoryRequest {
    pub fn new(symbol: String, resolution: Resolution, from: i64, to: i64) -> Self {
        Self {
            symbol,
            resolution,
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
        if self.symbol.is_empty() {
            return Err("Symbol cannot be empty".to_string());
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
