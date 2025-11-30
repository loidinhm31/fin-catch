use crate::{
    error::{ApiError, ApiResult},
    models::{ExchangeRatePoint, ExchangeRateRequest, ExchangeRateResponse},
    sources::exchange_rate_source_trait::ExchangeRateDataSource,
};
use async_trait::async_trait;
use chrono::{DateTime, Duration as ChronoDuration, Utc};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Vietcombank data source for exchange rates
pub struct VietcombankSource {
    base_url: String,
    client: Client,
}

impl VietcombankSource {
    pub fn new() -> Self {
        // Create client with proper timeouts
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .connect_timeout(Duration::from_secs(10))
            .build()
            .unwrap_or_else(|_| Client::new());

        Self {
            base_url: "https://www.vietcombank.com.vn".to_string(),
            client,
        }
    }

    pub fn with_base_url(mut self, base_url: String) -> Self {
        self.base_url = base_url;
        self
    }

    /// Convert Unix timestamp to YYYY-MM-DD format for Vietcombank API
    fn timestamp_to_date(&self, timestamp: i64) -> String {
        let dt = DateTime::<Utc>::from_timestamp(timestamp, 0)
            .unwrap_or_else(|| DateTime::<Utc>::from_timestamp(0, 0).unwrap());
        dt.format("%Y-%m-%d").to_string()
    }

    /// Convert date string (YYYY-MM-DD) back to Unix timestamp
    fn date_to_timestamp(&self, date_str: &str) -> i64 {
        chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d")
            .ok()
            .and_then(|date| date.and_hms_opt(0, 0, 0))
            .and_then(|dt| dt.and_utc().timestamp().into())
            .unwrap_or(0)
    }

    /// Generate list of dates for the date range
    fn generate_date_list(&self, from: i64, to: i64) -> Vec<String> {
        let from_dt = DateTime::<Utc>::from_timestamp(from, 0)
            .unwrap_or_else(|| DateTime::<Utc>::from_timestamp(0, 0).unwrap());
        let to_dt = DateTime::<Utc>::from_timestamp(to, 0)
            .unwrap_or_else(|| DateTime::<Utc>::from_timestamp(0, 0).unwrap());

        let mut dates = Vec::new();
        let mut current_date = from_dt;

        while current_date <= to_dt {
            dates.push(current_date.format("%Y-%m-%d").to_string());
            current_date = current_date + ChronoDuration::days(1);
        }

        dates
    }

    /// Fetch dates sequentially with rate limiting (for small requests)
    async fn fetch_sequential(
        &self,
        dates: &[String],
        currency_code: &str,
    ) -> (Vec<ExchangeRatePoint>, Vec<String>) {
        let mut all_data: Vec<ExchangeRatePoint> = Vec::new();
        let mut failed_dates: Vec<String> = Vec::new();

        for (i, date) in dates.iter().enumerate() {
            tracing::debug!("Fetching date {}/{}: {}", i + 1, dates.len(), date);

            match self.fetch_single_date(date, currency_code).await {
                Ok(mut date_data) => {
                    all_data.append(&mut date_data);
                }
                Err(e) => {
                    tracing::warn!("Failed to fetch date {}: {}", date, e);
                    failed_dates.push(date.clone());
                }
            }

            // Add a delay between requests to avoid rate limiting
            if i < dates.len() - 1 {
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            }
        }

        (all_data, failed_dates)
    }

    /// Fetch dates concurrently with rate limiting (for larger requests)
    /// Uses batching with controlled concurrency to respect API rate limits
    async fn fetch_concurrent(
        &self,
        dates: &[String],
        currency_code: &str,
    ) -> (Vec<ExchangeRatePoint>, Vec<String>) {
        let mut all_data: Vec<ExchangeRatePoint> = Vec::new();
        let mut failed_dates: Vec<String> = Vec::new();

        // Process in batches of 5 concurrent requests with 500ms delay between batches
        const BATCH_SIZE: usize = 5;
        let chunks: Vec<_> = dates.chunks(BATCH_SIZE).collect();

        for (batch_idx, chunk) in chunks.iter().enumerate() {
            tracing::debug!(
                "Processing batch {}/{} ({} dates)",
                batch_idx + 1,
                chunks.len(),
                chunk.len()
            );

            // Fetch all dates in this batch concurrently using join_all
            let mut fetch_tasks = Vec::new();
            for date in chunk.iter() {
                let task = self.fetch_single_date(date, currency_code);
                fetch_tasks.push((date.clone(), task));
            }

            let results = futures::future::join_all(
                fetch_tasks.into_iter().map(|(date, task)| async move {
                    (date, task.await)
                })
            ).await;

            // Process results
            for (date, result) in results {
                match result {
                    Ok(mut date_data) => {
                        all_data.append(&mut date_data);
                    }
                    Err(e) => {
                        tracing::warn!("Failed to fetch date {}: {}", date, e);
                        failed_dates.push(date);
                    }
                }
            }

            // Add delay between batches (except for the last batch)
            if batch_idx < chunks.len() - 1 {
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            }
        }

        (all_data, failed_dates)
    }

    /// Fetch exchange rates for a single date
    async fn fetch_single_date(&self, date: &str, currency_code: &str) -> ApiResult<Vec<ExchangeRatePoint>> {
        let url = format!("{}/api/exchangerates?date={}", self.base_url, date);

        tracing::debug!(
            "Vietcombank request: date={}, currency_code={}",
            date,
            currency_code
        );

        // Make request with required headers
        let response = self
            .client
            .get(&url)
            .header("Accept", "*/*")
            .header("Accept-Language", "vi,en-US;q=0.9,en;q=0.8")
            .header("Referer", "https://www.vietcombank.com.vn/vi-VN/To-chuc/Trang-chu-DCTC/KHTC---Ti-gia---DCTC")
            .header("sec-ch-ua", "\"Microsoft Edge\";v=\"141\", \"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"141\"")
            .header("sec-ch-ua-mobile", "?0")
            .header("sec-ch-ua-platform", "\"Linux\"")
            .header("sec-fetch-dest", "empty")
            .header("sec-fetch-mode", "cors")
            .header("sec-fetch-site", "same-origin")
            .header("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0")
            .send()
            .await
            .map_err(|e| {
                let error_msg = if e.is_timeout() {
                    "Request timed out after 30 seconds. The Vietcombank API may be slow or unavailable."
                } else if e.is_connect() {
                    "Failed to connect to Vietcombank API. Check network connectivity and DNS resolution."
                } else if e.is_request() {
                    "Request failed. The API endpoint may have changed or is unreachable."
                } else {
                    "Unknown error occurred while connecting to Vietcombank API."
                };

                tracing::error!("Vietcombank API request failed: {} - {}", e, error_msg);
                ApiError::DataSource(format!("{} Error details: {}", error_msg, e))
            })?;

        let status = response.status();

        // Get response body as text first for debugging
        let response_text = response
            .text()
            .await
            .map_err(|e| {
                tracing::error!("Failed to read Vietcombank API response body: {}", e);
                ApiError::DataSource(format!("Failed to read Vietcombank API response: {}", e))
            })?;

        if !status.is_success() {
            tracing::error!(
                "Vietcombank API returned status {}: {}",
                status,
                response_text
            );
            return Err(ApiError::DataSource(format!(
                "Vietcombank API request failed with status: {}. Response: {}",
                status,
                response_text
            )));
        }

        // Parse JSON response
        let api_response: VietcombankApiResponse = serde_json::from_str(&response_text)
            .map_err(|e| {
                tracing::error!("Failed to parse Vietcombank response JSON: {}. Response was: {}", e, response_text);
                ApiError::DataSource(format!(
                    "Failed to parse Vietcombank API response: {}. This might indicate the API format has changed. Raw response: {}",
                    e,
                    if response_text.len() > 200 {
                        format!("{}...", &response_text[..200])
                    } else {
                        response_text.clone()
                    }
                ))
            })?;

        // Convert to standard format - filter by currency code if specific, otherwise get all
        let timestamp = self.date_to_timestamp(date);
        let data: Vec<ExchangeRatePoint> = api_response
            .data
            .iter()
            .filter(|rate| {
                // If currency_code is "ALL", return all currencies; otherwise filter by code
                currency_code == "ALL" || rate.currency_code == currency_code
            })
            .map(|rate| ExchangeRatePoint {
                timestamp,
                currency_code: rate.currency_code.clone(),
                currency_name: rate.currency_name.clone(),
                buy_cash: rate.buy_cash.parse::<f64>().ok(),
                buy_transfer: rate.buy_transfer.parse::<f64>().ok(),
                sell: rate.sell.parse::<f64>().unwrap_or(0.0),
            })
            .collect();

        Ok(data)
    }
}

impl Default for VietcombankSource {
    fn default() -> Self {
        Self::new()
    }
}

/// Vietcombank API response structure
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
struct VietcombankApiResponse {
    data: Vec<VietcombankExchangeRate>,
}

/// Vietcombank exchange rate item
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct VietcombankExchangeRate {
    currency_code: String,
    currency_name: String,
    #[serde(rename = "cash")]
    buy_cash: String,
    #[serde(rename = "transfer")]
    buy_transfer: String,
    sell: String,
}

#[async_trait]
impl ExchangeRateDataSource for VietcombankSource {
    fn name(&self) -> &str {
        "vietcombank"
    }

    async fn fetch_history(&self, request: &ExchangeRateRequest) -> ApiResult<ExchangeRateResponse> {
        // Generate list of dates to fetch
        let dates = self.generate_date_list(request.from, request.to);

        tracing::info!(
            "Vietcombank request for {} date(s) from {} to {}",
            dates.len(),
            self.timestamp_to_date(request.from),
            self.timestamp_to_date(request.to)
        );

        // Determine fetch strategy based on number of dates
        // For small requests (1-5 days), use sequential fetching
        // For larger requests, use concurrent fetching with rate limiting
        let (all_data, failed_dates) = if dates.len() <= 5 {
            self.fetch_sequential(&dates, &request.currency_code).await
        } else {
            self.fetch_concurrent(&dates, &request.currency_code).await
        };

        // Sort by timestamp
        let mut all_data = all_data;
        all_data.sort_by_key(|p| p.timestamp);

        tracing::info!(
            "Vietcombank request completed: fetched {} data points from {} date(s), {} failed",
            all_data.len(),
            dates.len(),
            failed_dates.len()
        );

        // If we have some data, return success with metadata about failures
        if !all_data.is_empty() {
            let mut response = ExchangeRateResponse::success(
                request.currency_code.clone(),
                self.name().to_string(),
                all_data,
            );

            // Add metadata about failures if any
            if !failed_dates.is_empty() {
                response = response.with_metadata(serde_json::json!({
                    "total_dates_requested": dates.len(),
                    "successful_dates": dates.len() - failed_dates.len(),
                    "failed_dates": failed_dates,
                    "partial_success": true,
                }));
            }

            Ok(response)
        } else {
            // If all dates failed, return error
            Ok(ExchangeRateResponse::error(
                request.currency_code.clone(),
                self.name().to_string(),
                format!(
                    "Failed to fetch all {} date(s). Errors: {:?}",
                    dates.len(),
                    failed_dates
                ),
            ))
        }
    }

    async fn health_check(&self) -> ApiResult<bool> {
        // Simple health check with current date
        let now = chrono::Utc::now();
        let date = now.format("%Y-%m-%d").to_string();
        let url = format!("{}/api/exchangerates?date={}", self.base_url, date);

        let response = self
            .client
            .get(&url)
            .header("Accept", "*/*")
            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
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
            "provider": "Vietcombank",
            "country": "Vietnam",
            "max_date_range_days": 180,
            "fetching_strategy": {
                "small_requests": "Sequential (1-5 days) with 500ms delay",
                "large_requests": "Concurrent batching (6+ days, 5 per batch) with 500ms delay between batches"
            },
            "features": {
                "partial_success": true,
                "concurrent_fetching": true,
                "error_reporting": "Failed dates reported in metadata"
            },
            "supported_currencies": "ALL (USD, EUR, JPY, etc.)",
            "description": "Exchange rates from Vietcombank. Supports single currency or ALL currencies. Optimized with concurrent fetching and partial success handling."
        })
    }
}
