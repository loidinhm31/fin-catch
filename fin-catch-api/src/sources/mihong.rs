use crate::{
    error::{ApiError, ApiResult},
    models::{GoldPricePoint, GoldPriceRequest, GoldPriceResponse},
    sources::gold_source_trait::GoldDataSource,
};
use async_trait::async_trait;
use chrono::{DateTime, NaiveDateTime, Utc};
use reqwest::{cookie::Jar, Client};
use serde::{Deserialize, Serialize};
use std::{sync::Arc, time::Duration};

/// MiHong Gold data source
pub struct MihongSource {
    base_url: String,
    client: Client,
}

impl MihongSource {
    pub fn new() -> Self {
        // Create a cookie jar to maintain session
        let cookie_jar = Arc::new(Jar::default());

        // Create client with cookie jar and proper timeouts
        let client = Client::builder()
            .cookie_provider(cookie_jar)
            .timeout(Duration::from_secs(30))
            .connect_timeout(Duration::from_secs(10))
            .danger_accept_invalid_certs(true) // Handle SSL cert issues
            .build()
            .unwrap_or_else(|_| Client::new());

        Self {
            base_url: "https://mihong.vn".to_string(),
            client,
        }
    }

    pub fn with_base_url(mut self, base_url: String) -> Self {
        self.base_url = base_url;
        self
    }

    /// Initialize session by visiting the main page to get cookies
    async fn init_session(&self) -> ApiResult<()> {
        let url = format!("{}/en/vietnam-gold-pricings", self.base_url);

        let response = self
            .client
            .get(&url)
            .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
            .header("Accept-Language", "vi,en-US;q=0.9,en;q=0.8")
            .header("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36")
            .send()
            .await
            .map_err(|e| {
                tracing::error!("MiHong session init failed: {}", e);
                ApiError::DataSource(format!("Failed to initialize MiHong session: {}", e))
            })?;

        if !response.status().is_success() {
            return Err(ApiError::DataSource(format!(
                "MiHong session init returned status: {}",
                response.status()
            )));
        }

        tracing::debug!("MiHong session initialized successfully");
        Ok(())
    }

    /// Convert date_type parameter based on time range
    /// 1 = 1H, 2 = 24H, 3 = 15D, 4 = 1M (default), 5 = 6M, 7 = 1Y
    fn date_type_from_request(&self, request: &GoldPriceRequest) -> &str {
        let seconds_diff = request.to - request.from;
        let hours_diff = seconds_diff / 3600;
        let days_diff = seconds_diff / 86400;

        if hours_diff <= 1 {
            "1" // 1 hour
        } else if hours_diff <= 24 {
            "2" // 24 hours
        } else if days_diff <= 15 {
            "3" // 15 days
        } else if days_diff <= 30 {
            "4" // 1 month (default)
        } else if days_diff <= 180 {
            "5" // 6 months
        } else {
            "7" // 1 year
        }
    }

    /// Parse date format from MiHong API (e.g., "2025/10/27 00:00:00")
    fn parse_iso_date(&self, date_str: &str) -> i64 {
        // MiHong uses format: "2025/10/27 00:00:00" or "2025\/10\/27 00:00:00"
        // First, unescape the slashes if needed
        let cleaned_date = date_str.replace("\\/", "/");

        // Try parsing with slash format
        if let Ok(naive_dt) = NaiveDateTime::parse_from_str(&cleaned_date, "%Y/%m/%d %H:%M:%S") {
            return naive_dt.and_utc().timestamp();
        }

        // Try parsing with dash format (ISO 8601)
        if let Ok(naive_dt) = NaiveDateTime::parse_from_str(date_str, "%Y-%m-%d %H:%M:%S") {
            return naive_dt.and_utc().timestamp();
        }

        // Try RFC 3339 format
        if let Ok(dt) = DateTime::parse_from_rfc3339(date_str) {
            return dt.timestamp();
        }

        // Try parsing date only (with slash)
        if let Ok(naive_dt) = NaiveDateTime::parse_from_str(
            &format!("{} 00:00:00", cleaned_date),
            "%Y/%m/%d %H:%M:%S"
        ) {
            return naive_dt.and_utc().timestamp();
        }

        0
    }
}

impl Default for MihongSource {
    fn default() -> Self {
        Self::new()
    }
}

/// MiHong API response structure
#[derive(Debug, Deserialize, Serialize)]
struct MihongApiResponse {
    success: bool,
    #[serde(default)]
    message: Option<String>,
    #[serde(default)]
    data: Option<Vec<MihongGoldPrice>>,
}

/// MiHong gold price item
#[derive(Debug, Deserialize, Serialize)]
struct MihongGoldPrice {
    #[serde(default)]
    id: Option<i64>,
    #[serde(default)]
    gold_code: Option<String>,
    #[serde(default)]
    gold_name: Option<String>,
    #[serde(default)]
    company_name: Option<String>,
    #[serde(default)]
    buy: Option<f64>,
    #[serde(default)]
    sell: Option<f64>,
    #[serde(default)]
    date: Option<String>,
    #[serde(default)]
    updated_at: Option<String>,
    #[serde(default)]
    created_at: Option<String>,
}

#[async_trait]
impl GoldDataSource for MihongSource {
    fn name(&self) -> &str {
        "mihong"
    }

    async fn fetch_history(&self, request: &GoldPriceRequest) -> ApiResult<GoldPriceResponse> {
        // Initialize session to get cookies
        self.init_session().await?;

        let date_type = self.date_type_from_request(request);

        // Default gold_code to 999 if gold_price_id is empty or use the provided value
        let gold_code = if request.gold_price_id.is_empty() {
            "999"
        } else {
            &request.gold_price_id
        };

        let url = format!(
            "{}/api/v1/gold/prices?gold_code={}&date_type={}",
            self.base_url,
            gold_code,
            date_type
        );

        tracing::debug!(
            "MiHong request: gold_code={}, date_type={}",
            gold_code,
            date_type
        );

        // Make API request with required headers
        let response = self
            .client
            .get(&url)
            .header("Accept", "*/*")
            .header("Accept-Language", "vi,en-US;q=0.9,en;q=0.8")
            .header("Referer", format!("{}/en/vietnam-gold-pricings", self.base_url))
            .header("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0")
            .header("X-Requested-With", "XMLHttpRequest")
            .send()
            .await
            .map_err(|e| {
                let error_msg = if e.is_timeout() {
                    "Request timed out after 30 seconds. The MiHong API may be slow or unavailable."
                } else if e.is_connect() {
                    "Failed to connect to MiHong API. Check network connectivity."
                } else {
                    "Unknown error occurred while connecting to MiHong API."
                };

                tracing::error!("MiHong API request failed: {} - {}", e, error_msg);
                ApiError::DataSource(format!("{} Error details: {}", error_msg, e))
            })?;

        let status = response.status();

        // Get response body as text first for debugging
        let response_text = response
            .text()
            .await
            .map_err(|e| {
                tracing::error!("Failed to read MiHong API response body: {}", e);
                ApiError::DataSource(format!("Failed to read MiHong API response: {}", e))
            })?;

        // tracing::debug!("MiHong API response (status {}): {}", status, response_text);

        if !status.is_success() {
            tracing::error!(
                "MiHong API returned status {}: {}",
                status,
                response_text
            );
            return Err(ApiError::DataSource(format!(
                "MiHong API request failed with status: {}. Response: {}",
                status,
                response_text
            )));
        }

        // Parse JSON response
        let api_response: MihongApiResponse = serde_json::from_str(&response_text)
            .map_err(|e| {
                tracing::error!("Failed to parse MiHong response JSON: {}. Response was: {}", e, response_text);
                ApiError::DataSource(format!(
                    "Failed to parse MiHong API response: {}. Raw response: {}",
                    e,
                    if response_text.len() > 200 {
                        format!("{}...", &response_text[..200])
                    } else {
                        response_text.clone()
                    }
                ))
            })?;

        if !api_response.success {
            let error_msg = api_response.message.unwrap_or_else(|| "Unknown error".to_string());
            return Ok(GoldPriceResponse::error(
                request.gold_price_id.clone(),
                self.name().to_string(),
                format!("MiHong API returned success=false: {}", error_msg),
            ));
        }

        // Convert to standard format
        let data: Vec<GoldPricePoint> = api_response
            .data
            .unwrap_or_default()
            .iter()
            .filter_map(|item| {
                // Skip items with missing essential data
                let buy_price = item.buy?;
                let sell_price = item.sell?;

                let timestamp = if let Some(date) = &item.date {
                    self.parse_iso_date(date)
                } else if let Some(updated_at) = &item.updated_at {
                    self.parse_iso_date(updated_at)
                } else if let Some(created_at) = &item.created_at {
                    self.parse_iso_date(created_at)
                } else {
                    return None;
                };

                Some(GoldPricePoint {
                    timestamp,
                    // Use gold_code from request (gold_price_id) as the primary type_name
                    // Fallback to API response fields if needed
                    type_name: gold_code.to_string(),
                    branch_name: item.company_name.clone(),
                    buy: buy_price,
                    sell: sell_price,
                    buy_differ: None,
                    sell_differ: None,
                })
            })
            .collect();

        Ok(GoldPriceResponse::success(
            request.gold_price_id.clone(),
            self.name().to_string(),
            data,
        ))
    }

    async fn health_check(&self) -> ApiResult<bool> {
        // Try to initialize session as a health check
        match self.init_session().await {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    fn metadata(&self) -> serde_json::Value {
        serde_json::json!({
            "source": self.name(),
            "base_url": self.base_url,
            "data_type": "gold",
            "provider": "MiHong Vietnam",
            "country": "Vietnam",
            "default_gold_code": "999",
            "supported_gold_codes": [
                "SJC",
                "999",
                "985",
                "980",
                "950",
                "750",
                "680",
                "610",
                "580",
                "410"
            ],
            "date_types": {
                "1": "1 hour",
                "2": "24 hours",
                "3": "15 days",
                "4": "1 month (default)",
                "5": "6 months",
                "7": "1 year"
            }
        })
    }
}
