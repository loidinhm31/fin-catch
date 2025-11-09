use crate::{
    error::{ApiError, ApiResult},
    models::{Candle, StockHistoryRequest, StockHistoryResponse, Resolution},
    sources::stock_source_trait::StockDataSource,
};
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};

const YAHOO_FINANCE_BASE_URL: &str = "https://query1.finance.yahoo.com";

/// Yahoo Finance API response structure for chart data
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
    #[serde(rename = "instrumentType")]
    instrument_type: String,
    #[serde(rename = "exchangeName")]
    exchange_name: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct YahooFinanceIndicators {
    quote: Option<Vec<YahooFinanceQuote>>,
}

#[derive(Debug, Deserialize, Serialize)]
struct YahooFinanceQuote {
    open: Option<Vec<Option<f64>>>,
    high: Option<Vec<Option<f64>>>,
    low: Option<Vec<Option<f64>>>,
    close: Option<Vec<Option<f64>>>,
    volume: Option<Vec<Option<i64>>>,
}

#[derive(Debug, Deserialize, Serialize)]
struct YahooFinanceError {
    code: String,
    description: String,
}

/// Yahoo Finance data source implementation
pub struct YahooFinanceSource {
    client: Client,
    base_url: String,
}

impl YahooFinanceSource {
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

    /// Map internal Resolution enum to Yahoo Finance interval parameter
    fn resolution_to_interval(resolution: &Resolution) -> &str {
        match resolution {
            Resolution::OneMinute => "1m",
            Resolution::FiveMinutes => "5m",
            Resolution::FifteenMinutes => "15m",
            Resolution::ThirtyMinutes => "30m",
            Resolution::OneHour => "1h",
            Resolution::OneDay => "1d",
            Resolution::OneWeek => "1wk",
            Resolution::OneMonth => "1mo",
        }
    }

    /// Convert Yahoo Finance response to standard format
    fn convert_response(
        &self,
        yahoo_response: YahooFinanceChartResponse,
        request: &StockHistoryRequest,
    ) -> ApiResult<StockHistoryResponse> {
        // Check for API error
        if let Some(error) = yahoo_response.chart.error {
            return Ok(StockHistoryResponse::error(
                request.symbol.clone(),
                request.resolution.as_str().to_string(),
                self.name().to_string(),
                format!("Yahoo Finance API error: {} - {}", error.code, error.description),
            ));
        }

        // Check if we have results
        let results = yahoo_response.chart.result.ok_or_else(|| {
            ApiError::DataSource("No results returned from Yahoo Finance API".to_string())
        })?;

        if results.is_empty() {
            return Ok(StockHistoryResponse::error(
                request.symbol.clone(),
                request.resolution.as_str().to_string(),
                self.name().to_string(),
                "No data available for this symbol".to_string(),
            ));
        }

        let result = &results[0];

        // Get timestamps
        let timestamps = result.timestamp.as_ref().ok_or_else(|| {
            ApiError::DataSource("No timestamp data in Yahoo Finance response".to_string())
        })?;

        // Get quote data
        let indicators = &result.indicators;
        let quotes = indicators.quote.as_ref().ok_or_else(|| {
            ApiError::DataSource("No quote data in Yahoo Finance response".to_string())
        })?;

        if quotes.is_empty() {
            return Err(ApiError::DataSource(
                "Empty quote data in Yahoo Finance response".to_string(),
            ));
        }

        let quote = &quotes[0];

        // Get OHLCV arrays
        let open_arr = quote.open.as_ref().ok_or_else(|| {
            ApiError::DataSource("No open prices in Yahoo Finance response".to_string())
        })?;
        let high_arr = quote.high.as_ref().ok_or_else(|| {
            ApiError::DataSource("No high prices in Yahoo Finance response".to_string())
        })?;
        let low_arr = quote.low.as_ref().ok_or_else(|| {
            ApiError::DataSource("No low prices in Yahoo Finance response".to_string())
        })?;
        let close_arr = quote.close.as_ref().ok_or_else(|| {
            ApiError::DataSource("No close prices in Yahoo Finance response".to_string())
        })?;
        let volume_arr = quote.volume.as_ref().ok_or_else(|| {
            ApiError::DataSource("No volume data in Yahoo Finance response".to_string())
        })?;

        // Ensure all arrays have the same length
        let len = timestamps.len();
        if open_arr.len() != len
            || high_arr.len() != len
            || low_arr.len() != len
            || close_arr.len() != len
            || volume_arr.len() != len
        {
            return Err(ApiError::DataSource(
                "Inconsistent data array lengths in Yahoo Finance response".to_string(),
            ));
        }

        // Convert to standard candle format, filtering out null values
        let candles: Vec<Candle> = (0..len)
            .filter_map(|i| {
                // Yahoo Finance can return null values for some data points
                // We only include candles where all OHLCV values are present
                let open = open_arr[i]?;
                let high = high_arr[i]?;
                let low = low_arr[i]?;
                let close = close_arr[i]?;
                let volume = volume_arr[i]?;

                Some(Candle {
                    timestamp: timestamps[i],
                    open,
                    high,
                    low,
                    close,
                    volume,
                })
            })
            .collect();

        Ok(StockHistoryResponse::success(
            request.symbol.clone(),
            request.resolution.as_str().to_string(),
            self.name().to_string(),
            candles,
        ))
    }
}

impl Default for YahooFinanceSource {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl StockDataSource for YahooFinanceSource {
    fn name(&self) -> &str {
        "yahoo_finance"
    }

    async fn fetch_history(&self, request: &StockHistoryRequest) -> ApiResult<StockHistoryResponse> {
        let url = format!("{}/v8/finance/chart/{}", self.base_url, request.symbol);
        let interval = Self::resolution_to_interval(&request.resolution);

        let response = self
            .client
            .get(&url)
            .query(&[
                ("period1", request.from.to_string().as_str()),
                ("period2", request.to.to_string().as_str()),
                ("interval", interval),
                ("includePrePost", "true"),
                ("events", "div%7Csplit%7Cearn"),
            ])
            .header("Accept", "*/*")
            .header("Accept-Language", "en-US,en;q=0.9")
            .header("Origin", "https://finance.yahoo.com")
            .header("Referer", "https://finance.yahoo.com/")
            .header("User-Agent", "Mozilla/5.0 (compatible; MSIE 6.0; Windows NT 5.2; .NET CLR 1.0.3705;)")
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(ApiError::DataSource(format!(
                "Yahoo Finance API request failed with status: {}",
                response.status()
            )));
        }

        let yahoo_response: YahooFinanceChartResponse = response.json().await?;
        self.convert_response(yahoo_response, request)
    }

    async fn health_check(&self) -> ApiResult<bool> {
        let url = format!("{}/v8/finance/chart/AAPL", self.base_url);

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
            "provider": "Yahoo Finance",
            "supports_resolutions": ["1m", "5m", "15m", "30m", "1h", "1d", "1wk", "1mo"],
            "supports_symbols": ["stocks", "indices", "forex", "crypto", "futures", "commodities"],
            "notes": "Supports a wide range of financial instruments including gold futures (GC=F), silver (SI=F), oil (CL=F), etc."
        })
    }
}
