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
        if self.from > self.to {
            return Err("'from' timestamp must be less than or equal to 'to' timestamp".to_string());
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

    /// Market price converted to VND per tael
    pub market_price_vnd: f64,

    /// Premium rate as percentage
    /// Formula: [(target_price - market_price_vnd) / market_price_vnd] × 100%
    pub premium_rate: f64,

    /// Premium rate as percentage
    /// Formula: (target_price - market_price_vnd)
    pub premium_value: f64,

    /// Gold type/product name (e.g., "SJC", "999")
    pub gold_type: String,

    /// Timestamp from gold price source (Unix timestamp in seconds)
    pub gold_price_timestamp: i64,

    /// Timestamp from exchange rate source (Unix timestamp in seconds)
    pub exchange_rate_timestamp: i64,

    /// Timestamp from stock/market price source (Unix timestamp in seconds)
    pub stock_price_timestamp: i64,
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

/// Calculator for gold premium calculations
pub struct GoldPremiumCalculator;

impl GoldPremiumCalculator {
    /// Check if a timestamp falls on a weekend (Saturday or Sunday)
    fn is_weekend(timestamp: i64) -> bool {
        use chrono::{DateTime, Datelike, Utc};
        let datetime = DateTime::<Utc>::from_timestamp(timestamp, 0).unwrap();
        let weekday = datetime.weekday();
        weekday == chrono::Weekday::Sat || weekday == chrono::Weekday::Sun
    }

    /// Get the previous Friday from a weekend date at 12:00:00 GMT (noon)
    /// If the date is not a weekend, returns the original timestamp
    fn get_previous_friday(timestamp: i64) -> i64 {
        use chrono::{DateTime, Datelike, NaiveTime, Utc};

        if !Self::is_weekend(timestamp) {
            return timestamp;
        }

        let datetime = DateTime::<Utc>::from_timestamp(timestamp, 0).unwrap();
        let weekday = datetime.weekday();

        // Calculate days to subtract to get to Friday
        let days_to_subtract = match weekday {
            chrono::Weekday::Sat => 1, // Saturday -> Friday (1 day back)
            chrono::Weekday::Sun => 2, // Sunday -> Friday (2 days back)
            _ => 0,
        };

        // Get Friday's date
        let friday_date = datetime.date_naive() - chrono::Days::new(days_to_subtract as u64);

        // Set time to 12:00:00 GMT (noon)
        let friday_datetime = friday_date
            .and_time(NaiveTime::from_hms_opt(12, 0, 0).unwrap())
            .and_utc();

        friday_datetime.timestamp()
    }

    /// Calculate gold premium by fetching and combining data from multiple sources
    pub async fn calculate(
        gateway: &crate::gateway::DataSourceGateway,
        request: &GoldPremiumRequest,
    ) -> crate::error::ApiResult<GoldPremiumResponse> {
        use crate::models::{GoldPriceRequest, ExchangeRateRequest, request::{StockHistoryRequest, Resolution}};

        // Set default values
        let gold_price_id = request.gold_price_id.clone().unwrap_or_else(|| "1".to_string());
        let currency_code = request.currency_code.clone().unwrap_or_else(|| "USD".to_string());
        let gold_source = request.gold_source.as_deref().unwrap_or("sjc");

        // Check if requested dates fall on weekends and adjust
        let mut weekend_warnings = Vec::new();
        let adjusted_from = if Self::is_weekend(request.from) {
            let friday = Self::get_previous_friday(request.from);
            weekend_warnings.push(format!(
                "Requested 'from' date falls on a weekend. Using previous Friday's data instead."
            ));
            friday
        } else {
            request.from
        };

        let adjusted_to = if Self::is_weekend(request.to) {
            let friday = Self::get_previous_friday(request.to);
            weekend_warnings.push(format!(
                "Requested 'to' date falls on a weekend. Using previous Friday's data instead."
            ));
            friday
        } else {
            request.to
        };

        // Fetch gold price data FIRST to get the actual date range
        let gold_price_request = GoldPriceRequest {
            gold_price_id: gold_price_id.clone(),
            from: adjusted_from,
            to: adjusted_to,
            source: Some(gold_source.to_string()),
        };

        let gold_price_response = gateway.fetch_gold_history(gold_price_request).await?;

        let gold_price_data = gold_price_response.data.as_ref().ok_or_else(|| {
            crate::error::ApiError::DataSource("No gold price data available".to_string())
        })?;

        if gold_price_data.is_empty() {
            return Ok(GoldPremiumResponse::error("No gold price data found for the requested period".to_string()));
        }

        // Determine the actual date range from gold price data
        let min_timestamp = gold_price_data.iter().map(|p| p.timestamp).min().unwrap_or(request.from);
        let max_timestamp = gold_price_data.iter().map(|p| p.timestamp).max().unwrap_or(request.to);

        // Add buffer to ensure we get exchange rate and stock data for all days
        const MAX_EXCHANGE_RATE_DAYS: i64 = 180;
        const ONE_DAY: i64 = 86400;

        let buffered_from = if request.from == request.to {
            max_timestamp
        } else {
            min_timestamp
        };
        let buffered_to = max_timestamp;

        let buffered_days = (buffered_to - buffered_from) / ONE_DAY;

        let (from_with_buffer, to_with_buffer) = if buffered_days > MAX_EXCHANGE_RATE_DAYS {
            (min_timestamp, max_timestamp)
        } else {
            (buffered_from, buffered_to)
        };

        // Determine exchange rate source based on adjusted request
        let exchange_rate_source = if request.exchange_rate_source.is_some() {
            request.exchange_rate_source.clone()
        } else {
            if adjusted_from == adjusted_to {
                Some("vietcombank".to_string())
            } else {
                Some("yahoo_finance".to_string())
            }
        };

        // Fetch exchange rate and stock data
        let stock_request = StockHistoryRequest {
            symbol: "GC=F".to_string(),
            resolution: Resolution::OneDay,
            from: from_with_buffer,
            to: to_with_buffer,
            source: request.stock_source.clone().or(Some("yahoo_finance".to_string())),
        };

        let exchange_rate_request = ExchangeRateRequest {
            currency_code: currency_code.clone(),
            from: from_with_buffer,
            to: to_with_buffer,
            source: exchange_rate_source,
        };

        let stock_response = gateway.fetch_stock_history(stock_request).await?;
        let exchange_rate_response = gateway.fetch_exchange_rate_history(exchange_rate_request).await?;

        let stock_data = stock_response.data.ok_or_else(|| {
            crate::error::ApiError::DataSource("No stock data available".to_string())
        })?;

        let exchange_rate_data = exchange_rate_response.data.ok_or_else(|| {
            crate::error::ApiError::DataSource("No exchange rate data available".to_string())
        })?;

        // Calculate premium for each data point
        let mut premium_points = Vec::new();

        // Helper function to normalize timestamp to start of day
        let normalize_to_day = |timestamp: i64| -> i64 {
            (timestamp / 86400) * 86400
        };

        // Create maps for quick lookup - store (timestamp, value) tuples
        let mut exchange_rate_map = std::collections::HashMap::new();
        for point in &exchange_rate_data {
            let day = normalize_to_day(point.timestamp);
            exchange_rate_map.insert(day, (point.timestamp, point.sell));
        }

        let mut stock_price_map = std::collections::HashMap::new();
        for candle in &stock_data {
            let day = normalize_to_day(candle.timestamp);
            stock_price_map.insert(day, (candle.timestamp, candle.close));
        }

        // Conversion factor: 1 tael = 1.206 troy ounces
        const TAEL_TO_TROY_OZ: f64 = 1.206;

        // Process gold price data and calculate premium
        for gold_point in gold_price_data {
            let day = normalize_to_day(gold_point.timestamp);

            let exchange_rate_data = exchange_rate_map.get(&day);
            let stock_price_data = stock_price_map.get(&day);

            if let (Some(&(exchange_rate_timestamp, exchange_rate)), Some(&(stock_price_timestamp, market_price_usd))) = (exchange_rate_data, stock_price_data) {
                let market_price_vnd = market_price_usd * exchange_rate * TAEL_TO_TROY_OZ;
                let target_price = gold_point.sell;
                let premium_rate = ((target_price - market_price_vnd) / market_price_vnd) * 100.0;
                let premium_value = target_price - market_price_vnd;

                premium_points.push(GoldPremiumPoint {
                    timestamp: gold_point.timestamp,
                    target_price,
                    market_price_usd,
                    exchange_rate,
                    market_price_vnd,
                    premium_rate,
                    premium_value,
                    gold_type: gold_point.type_name.clone(),
                    gold_price_timestamp: gold_point.timestamp,
                    exchange_rate_timestamp,
                    stock_price_timestamp,
                });
            }
        }

        if premium_points.is_empty() {
            return Ok(GoldPremiumResponse::error(
                "No matching data points found across all sources".to_string(),
            ));
        }

        let mut metadata = serde_json::json!({
            "gold_source": gold_price_response.source,
            "exchange_rate_source": exchange_rate_response.source,
            "stock_source": stock_response.source,
            "formula": "Premium (%) = [(Target Price - Market Price VND) / Market Price VND] × 100%",
            "conversion": "Market Price VND = USD/oz × Exchange Rate × 1.206 (1 tael = 1.206 troy oz)",
            "note": "Gold prices are in VND per tael",
        });

        // Add weekend warnings if any
        if !weekend_warnings.is_empty() {
            metadata["warnings"] = serde_json::json!(weekend_warnings);
            metadata["caution"] = serde_json::json!(
                "Weekend dates detected. Markets are typically closed on weekends, so data from the previous Friday is used."
            );
        }

        Ok(GoldPremiumResponse::success(premium_points).with_metadata(metadata))
    }
}
