use crate::{
    error::{ApiError, ApiResult},
    models::{ExchangeRatePoint, ExchangeRateRequest, ExchangeRateResponse},
    sources::exchange_rate_source_trait::ExchangeRateDataSource,
};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use reqwest::Client;
use serde::{Deserialize, Serialize};

const YAHOO_FINANCE_BASE_URL: &str = "https://query1.finance.yahoo.com";

/// Yahoo Finance exchange rate data source
pub struct YahooFinanceExchangeSource {
    client: Client,
    base_url: String,
}

impl YahooFinanceExchangeSource {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
            base_url: YAHOO_FINANCE_BASE_URL.to_string(),
        }
    }

    pub fn with_base_url(mut self, base_url: String) -> Self {
        self.base_url = base_url;
        self
    }

    /// Convert currency code to Yahoo Finance symbol
    /// Note: For Vietnamese exchange rates, currency_code represents the foreign currency
    /// and we want to know its rate to VND. So for "USD", we use "VND=X" (USD to VND rate)
    fn currency_to_symbol(currency_code: &str) -> String {
        // For Vietnamese exchange rates: VND=X gives USD/VND rate
        // The currency_code in the request is "USD" but the Yahoo symbol is "VND=X"
        if currency_code.to_uppercase() == "USD" {
            "VND=X".to_string()
        } else {
            // For other currencies, use direct mapping (e.g., EUR=X for EUR/USD)
            format!("{}=X", currency_code)
        }
    }

    /// Convert Unix timestamp to human-readable date
    fn timestamp_to_date(&self, timestamp: i64) -> String {
        let dt = DateTime::<Utc>::from_timestamp(timestamp, 0)
            .unwrap_or_else(|| DateTime::<Utc>::from_timestamp(0, 0).unwrap());
        dt.format("%Y-%m-%d").to_string()
    }
}

impl Default for YahooFinanceExchangeSource {
    fn default() -> Self {
        Self::new()
    }
}

/// Yahoo Finance API response structure
#[derive(Debug, Deserialize, Serialize)]
struct YahooFinanceChartResponse {
    chart: YahooFinanceChart,
}

#[derive(Debug, Deserialize, Serialize)]
struct YahooFinanceChart {
    result: Option<Vec<YahooFinanceResult>>,
    error: Option<YahooFinanceError>,
}

#[derive(Debug, Deserialize, Serialize)]
struct YahooFinanceResult {
    meta: YahooFinanceMeta,
    timestamp: Option<Vec<i64>>,
    indicators: YahooFinanceIndicators,
}

#[derive(Debug, Deserialize, Serialize)]
struct YahooFinanceMeta {
    currency: String,
    symbol: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct YahooFinanceIndicators {
    quote: Option<Vec<YahooFinanceQuote>>,
}

#[derive(Debug, Deserialize, Serialize)]
struct YahooFinanceQuote {
    close: Option<Vec<Option<f64>>>,
}

#[derive(Debug, Deserialize, Serialize)]
struct YahooFinanceError {
    code: String,
    description: String,
}

#[async_trait]
impl ExchangeRateDataSource for YahooFinanceExchangeSource {
    fn name(&self) -> &str {
        "yahoo_finance"
    }

    async fn fetch_history(&self, request: &ExchangeRateRequest) -> ApiResult<ExchangeRateResponse> {
        // Convert currency code to Yahoo Finance symbol
        let symbol = Self::currency_to_symbol(&request.currency_code);
        let url = format!("{}/v8/finance/chart/{}", self.base_url, symbol);

        let now = chrono::Utc::now().timestamp();
        let is_to_current_date = (now - request.to).abs() < 86400; // to is within 24 hours of now
        let is_single_day_query = (request.to - request.from).abs() < 86400; // from == to (same day)

        // Determine query parameters:
        // - If querying current date only (single day), use range-based query for real-time data
        // - If querying a date range that includes current date, adjust 'to' to exclude current date
        // - Otherwise, use period-based query for historical data
        let (use_range_query, adjusted_from, adjusted_to) = if is_to_current_date && is_single_day_query {
            // Single day query for current date - use range-based query for real-time data
            (true, request.from, request.to)
        } else if is_to_current_date && !is_single_day_query {
            // Date range includes current date - exclude current date from historical query
            let start_of_today = chrono::Utc::now()
                .date_naive()
                .and_hms_opt(0, 0, 0)
                .unwrap()
                .and_utc()
                .timestamp();
            (false, request.from, start_of_today)
        } else {
            // Pure historical query
            (false, request.from, request.to)
        };

        tracing::info!(
            "Yahoo Finance exchange rate request: symbol={}, from={}, to={}, use_range_query={}",
            symbol,
            self.timestamp_to_date(adjusted_from),
            self.timestamp_to_date(adjusted_to),
            use_range_query
        );

        // Make HTTP request with proper headers
        let response = if use_range_query {
            // Use range-based query for current/recent data to get real-time rates
            self.client
                .get(&url)
                .query(&[
                    ("range", "1d"),  // Get last day's data
                    ("interval", "1d"),
                    ("includePrePost", "true"),
                ])
                .header("Accept", "*/*")
                .header("Accept-Language", "en-US,en;q=0.9")
                .header("Origin", "https://finance.yahoo.com")
                .header("Referer", "https://finance.yahoo.com/")
                .header("User-Agent", "Mozilla/5.0 (compatible; MSIE 6.0; Windows NT 5.2; .NET CLR 1.0.3705;)")
                .send()
                .await
                .map_err(|e| {
                    tracing::error!("Yahoo Finance API request failed: {}", e);
                    ApiError::DataSource(format!("Failed to fetch from Yahoo Finance: {}", e))
                })?
        } else {
            // Use period-based query for historical data
            self.client
                .get(&url)
                .query(&[
                    ("period1", adjusted_from.to_string().as_str()),
                    ("period2", adjusted_to.to_string().as_str()),
                    ("interval", "1d"),
                ])
                .header("Accept", "*/*")
                .header("Accept-Language", "en-US,en;q=0.9")
                .header("Origin", "https://finance.yahoo.com")
                .header("Referer", "https://finance.yahoo.com/")
                .header("User-Agent", "Mozilla/5.0 (compatible; MSIE 6.0; Windows NT 5.2; .NET CLR 1.0.3705;)")
                .send()
                .await
                .map_err(|e| {
                    tracing::error!("Yahoo Finance API request failed: {}", e);
                    ApiError::DataSource(format!("Failed to fetch from Yahoo Finance: {}", e))
                })?
        };

        if !response.status().is_success() {
            return Err(ApiError::DataSource(format!(
                "Yahoo Finance API request failed with status: {}",
                response.status()
            )));
        }

        // Get response text for debugging
        let response_text = response.text().await
            .map_err(|e| {
                tracing::error!("Failed to read Yahoo Finance response: {}", e);
                ApiError::DataSource(format!("Failed to read Yahoo Finance response: {}", e))
            })?;

        // Try to parse JSON response
        let api_response: YahooFinanceChartResponse = serde_json::from_str(&response_text)
            .map_err(|e| {
                tracing::error!("Failed to parse Yahoo Finance response: {}. Response preview: {}",
                    e,
                    if response_text.len() > 500 {
                        format!("{}...", &response_text[..500])
                    } else {
                        response_text.clone()
                    }
                );
                ApiError::DataSource(format!("Failed to parse Yahoo Finance response: {}", e))
            })?;

        // Check for API errors
        if let Some(error) = api_response.chart.error {
            tracing::warn!("Yahoo Finance API error for {}: {} - {}", symbol, error.code, error.description);
            return Ok(ExchangeRateResponse::error(
                request.currency_code.clone(),
                self.name().to_string(),
                format!("Yahoo Finance API error: {} - {}", error.code, error.description),
            ));
        }

        // Extract data from response
        let results = api_response.chart.result.ok_or_else(|| {
            tracing::error!("No results in Yahoo Finance response for {}", symbol);
            ApiError::DataSource("No results returned from Yahoo Finance API".to_string())
        })?;

        if results.is_empty() {
            tracing::warn!("Empty results array for symbol {}", symbol);
            return Ok(ExchangeRateResponse::error(
                request.currency_code.clone(),
                self.name().to_string(),
                format!("No data available for symbol {}", symbol),
            ));
        }

        let result = &results[0];

        let timestamps = result.timestamp.as_ref().ok_or_else(|| {
            tracing::error!("No timestamp field in Yahoo Finance result for {}. Response preview: {}",
                symbol,
                if response_text.len() > 300 {
                    format!("{}...", &response_text[..300])
                } else {
                    response_text.clone()
                }
            );
            ApiError::DataSource(format!("No timestamp data in Yahoo Finance response for {}", symbol))
        })?;

        let quotes = result.indicators.quote.as_ref().ok_or_else(|| {
            ApiError::DataSource("No quote data in Yahoo Finance response".to_string())
        })?;

        if quotes.is_empty() {
            return Err(ApiError::DataSource(
                "Empty quote data in Yahoo Finance response".to_string(),
            ));
        }

        let close_prices = quotes[0].close.as_ref().ok_or_else(|| {
            ApiError::DataSource("No close prices in Yahoo Finance response".to_string())
        })?;

        // Convert to standard format, filtering out null values
        let data: Vec<ExchangeRatePoint> = timestamps
            .iter()
            .enumerate()
            .filter_map(|(i, &timestamp)| {
                // Yahoo Finance can return null values for some data points
                let close = close_prices.get(i)?.as_ref()?;

                Some(ExchangeRatePoint {
                    timestamp,
                    currency_code: request.currency_code.clone(),
                    currency_name: format!("{} (from Yahoo Finance)", request.currency_code),
                    buy_cash: None, // Yahoo doesn't provide buy/sell spreads
                    buy_transfer: None,
                    sell: *close, // Use close price as the exchange rate
                })
            })
            .collect();

        if data.is_empty() {
            return Ok(ExchangeRateResponse::error(
                request.currency_code.clone(),
                self.name().to_string(),
                format!("No exchange rate data found for {} in the specified date range", symbol),
            ));
        }

        tracing::info!(
            "Yahoo Finance exchange rate request completed: {} data points",
            data.len()
        );

        Ok(ExchangeRateResponse::success(
            request.currency_code.clone(),
            self.name().to_string(),
            data,
        ))
    }

    async fn health_check(&self) -> ApiResult<bool> {
        let url = format!("{}/v8/finance/chart/VND=X", self.base_url);

        // Make a minimal request to check if the API is available
        let response = self
            .client
            .get(&url)
            .query(&[
                ("period1", "1730419200"),
                ("period2", "1730505600"),
                ("interval", "1d"),
            ])
            .header("Accept", "*/*")
            .header("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36")
            .timeout(std::time::Duration::from_secs(5))
            .send()
            .await;

        match response {
            Ok(resp) => Ok(resp.status().is_success()),
            Err(_) => Ok(false),
        }
    }

    fn metadata(&self) -> serde_json::Value {
        serde_json::json!({
            "source": self.name(),
            "base_url": self.base_url,
            "data_type": "exchange_rate",
            "provider": "Yahoo Finance",
            "coverage": "Global",
            "date_range_support": true,
            "single_api_call": true,
            "features": {
                "date_range": "Full support with period1/period2 parameters",
                "real_time": true,
                "historical": "Extensive historical data available"
            },
            "supported_currencies": "Major currencies with =X suffix (e.g., VND=X, EUR=X, JPY=X)",
            "rate_types": "Mid-market rates (no buy/sell spread)",
            "description": "Yahoo Finance exchange rates. Optimized for date range queries. Returns mid-market rates."
        })
    }
}
