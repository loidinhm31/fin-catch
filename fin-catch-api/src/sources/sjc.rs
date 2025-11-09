use crate::{
    error::{ApiError, ApiResult},
    models::{GoldPricePoint, GoldPriceRequest, GoldPriceResponse},
    sources::gold_source_trait::GoldDataSource,
};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

/// SJC Gold Company data source
pub struct SjcSource {
    base_url: String,
    client: Client,
}

impl SjcSource {
    pub fn new() -> Self {
        // Create client with proper timeouts
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .connect_timeout(Duration::from_secs(10))
            .build()
            .unwrap_or_else(|_| Client::new());

        Self {
            base_url: "https://sjc.com.vn".to_string(),
            client,
        }
    }

    pub fn with_base_url(mut self, base_url: String) -> Self {
        self.base_url = base_url;
        self
    }

    /// Convert Unix timestamp to MM/DD/YYYY format
    fn timestamp_to_date(&self, timestamp: i64) -> String {
        let dt = DateTime::<Utc>::from_timestamp(timestamp, 0)
            .unwrap_or_else(|| DateTime::<Utc>::from_timestamp(0, 0).unwrap());
        dt.format("%m/%d/%Y").to_string()
    }

    /// Parse .NET JSON date format: /Date(1762275600000)/
    fn parse_dotnet_date(&self, date_str: &str) -> i64 {
        // Extract timestamp from /Date(1762275600000)/
        if let Some(start) = date_str.find('(') {
            if let Some(end) = date_str.find(')') {
                if let Ok(millis) = date_str[start + 1..end].parse::<i64>() {
                    return millis / 1000; // Convert milliseconds to seconds
                }
            }
        }
        0
    }
}

impl Default for SjcSource {
    fn default() -> Self {
        Self::new()
    }
}

/// SJC API response structure
#[derive(Debug, Deserialize, Serialize)]
struct SjcApiResponse {
    success: bool,
    data: Vec<SjcGoldPrice>,
}

/// SJC gold price item
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "PascalCase")]
struct SjcGoldPrice {
    #[serde(rename = "Id")]
    id: i64,
    type_name: String,
    branch_name: String,
    buy: String,
    buy_value: f64,
    sell: String,
    sell_value: f64,
    buy_differ: Option<String>,
    buy_differ_value: f64,
    sell_differ: Option<String>,
    sell_differ_value: f64,
    group_date: String,
}

#[async_trait]
impl GoldDataSource for SjcSource {
    fn name(&self) -> &str {
        "sjc"
    }

    async fn fetch_history(&self, request: &GoldPriceRequest) -> ApiResult<GoldPriceResponse> {
        let url = format!("{}/GoldPrice/Services/PriceService.ashx", self.base_url);

        let from_date = self.timestamp_to_date(request.from);
        let to_date = self.timestamp_to_date(request.to);

        tracing::debug!(
            "SJC request: fromDate={}, toDate={}, goldPriceId={}",
            from_date,
            to_date,
            request.gold_price_id
        );

        // Prepare form data as vector of tuples for consistent ordering
        let form_data = vec![
            ("method", "GetGoldPriceHistory"),
            ("fromDate", from_date.as_str()),
            ("toDate", to_date.as_str()),
            ("goldPriceId", request.gold_price_id.as_str()),
        ];

        // Make request with required headers
        // Note: .form() automatically sets Content-Type to application/x-www-form-urlencoded
        let response = self
            .client
            .post(&url)
            .form(&form_data)
            .header("Accept", "*/*")
            .header("Accept-Language", "vi,en-US;q=0.9,en;q=0.8")
            .header("Origin", "https://sjc.com.vn")
            .header("Referer", "https://sjc.com.vn/bieu-do-gia-vang")
            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0")
            .header("X-Requested-With", "XMLHttpRequest")
            .header("Cookie", "ASP.NET_SessionId=a76a053b-db28-45a8-b118-4049d768e08c; SRV=154e77e7-a844-45fd-a837-f87154b48930")
            .send()
            .await
            .map_err(|e| {
                // Provide specific error messages based on error type
                let error_msg = if e.is_timeout() {
                    "Request timed out after 30 seconds. The SJC API may be slow or unavailable."
                } else if e.is_connect() {
                    "Failed to connect to SJC API. Check network connectivity and DNS resolution."
                } else if e.is_request() {
                    "Request failed. The API endpoint may have changed or is unreachable."
                } else {
                    "Unknown error occurred while connecting to SJC API."
                };

                tracing::error!("SJC API request failed: {} - {}", e, error_msg);
                ApiError::DataSource(format!("{} Error details: {}", error_msg, e))
            })?;

        let status = response.status();

        // Get response body as text first for debugging
        let response_text = response
            .text()
            .await
            .map_err(|e| {
                tracing::error!("Failed to read SJC API response body: {}", e);
                ApiError::DataSource(format!("Failed to read SJC API response: {}", e))
            })?;

        // tracing::debug!("SJC API response (status {}): {}", status, response_text);

        if !status.is_success() {
            tracing::error!(
                "SJC API returned status {}: {}",
                status,
                response_text
            );
            return Err(ApiError::DataSource(format!(
                "SJC API request failed with status: {}. Response: {}",
                status,
                response_text
            )));
        }

        // Parse JSON response
        let api_response: SjcApiResponse = serde_json::from_str(&response_text)
            .map_err(|e| {
                tracing::error!("Failed to parse SJC response JSON: {}. Response was: {}", e, response_text);
                ApiError::DataSource(format!(
                    "Failed to parse SJC API response: {}. This might indicate the API format has changed. Raw response: {}",
                    e,
                    if response_text.len() > 200 {
                        format!("{}...", &response_text[..200])
                    } else {
                        response_text.clone()
                    }
                ))
            })?;

        if !api_response.success {
            return Ok(GoldPriceResponse::error(
                request.gold_price_id.clone(),
                self.name().to_string(),
                "SJC API returned success=false".to_string(),
            ));
        }

        // Convert to standard format
        let data: Vec<GoldPricePoint> = api_response
            .data
            .iter()
            .map(|item| GoldPricePoint {
                timestamp: self.parse_dotnet_date(&item.group_date),
                type_name: item.type_name.clone(),
                branch_name: Some(item.branch_name.clone()),
                buy: item.buy_value,
                sell: item.sell_value,
                buy_differ: if item.buy_differ_value != 0.0 {
                    Some(item.buy_differ_value)
                } else {
                    None
                },
                sell_differ: if item.sell_differ_value != 0.0 {
                    Some(item.sell_differ_value)
                } else {
                    None
                },
            })
            .collect();

        Ok(GoldPriceResponse::success(
            request.gold_price_id.clone(),
            self.name().to_string(),
            data,
        ))
    }

    async fn health_check(&self) -> ApiResult<bool> {
        let url = format!("{}/GoldPrice/Services/PriceService.ashx", self.base_url);

        // Simple health check with a minimal request
        // Use current date to avoid potential date range issues
        let now = chrono::Utc::now();
        let from_date = now.format("%m/%d/%Y").to_string();
        let to_date = now.format("%m/%d/%Y").to_string();

        let form_data = vec![
            ("method", "GetGoldPriceHistory"),
            ("fromDate", from_date.as_str()),
            ("toDate", to_date.as_str()),
            ("goldPriceId", "1"),
        ];

        let response = self
            .client
            .post(&url)
            .form(&form_data)
            .header("Accept", "*/*")
            .header("Origin", "https://sjc.com.vn")
            .header("Referer", "https://sjc.com.vn/bieu-do-gia-vang")
            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
            .header("X-Requested-With", "XMLHttpRequest")
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
            "data_type": "gold",
            "provider": "SJC Gold Company",
            "country": "Vietnam",
            "supported_gold_types": [
                {"id": "1", "name": "Vàng SJC 1L, 10L, 1KG"},
                {"id": "2", "name": "Vàng nữ trang 99.99"},
                {"id": "3", "name": "Vàng nữ trang 99%"},
                {"id": "4", "name": "Vàng nữ trang 75%"},
                {"id": "5", "name": "Vàng nữ trang 58.3%"}
            ]
        })
    }
}
