use crate::{
    error::{ApiError, ApiResult},
    models::{GoldPricePoint, GoldPriceRequest, GoldPriceResponse},
    sources::gold_source_trait::GoldDataSource,
};
use async_trait::async_trait;
use chrono::{DateTime, Duration as ChronoDuration, Utc};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Maximum number of days SJC API supports in a single request
const MAX_DAYS_PER_REQUEST: i64 = 90;

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

    /// Convert Unix timestamp to DD/MM/YYYY format
    fn timestamp_to_date(&self, timestamp: i64) -> String {
        let dt = DateTime::<Utc>::from_timestamp(timestamp, 0)
            .unwrap_or_else(|| DateTime::<Utc>::from_timestamp(0, 0).unwrap());
        dt.format("%d/%m/%Y").to_string()
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

    /// Split date range into chunks of MAX_DAYS_PER_REQUEST
    /// Returns a vector of (from_timestamp, to_timestamp) tuples
    fn split_date_range(&self, from: i64, to: i64) -> Vec<(i64, i64)> {
        let from_dt = DateTime::<Utc>::from_timestamp(from, 0)
            .unwrap_or_else(|| DateTime::<Utc>::from_timestamp(0, 0).unwrap());
        let to_dt = DateTime::<Utc>::from_timestamp(to, 0)
            .unwrap_or_else(|| DateTime::<Utc>::from_timestamp(0, 0).unwrap());

        let total_duration = to_dt.signed_duration_since(from_dt);
        let total_days = total_duration.num_days();

        // If within limit, return single range
        if total_days < MAX_DAYS_PER_REQUEST {
            return vec![(from, to)];
        }

        // Split into chunks
        let mut chunks = Vec::new();
        let mut current_start = from_dt;

        while current_start < to_dt {
            // Calculate chunk end ensuring it's less than MAX_DAYS_PER_REQUEST from start
            let chunk_end = std::cmp::min(
                current_start + ChronoDuration::days(MAX_DAYS_PER_REQUEST - 1),
                to_dt
            );

            chunks.push((
                current_start.timestamp(),
                chunk_end.timestamp()
            ));

            // If we've reached the end, stop
            if chunk_end >= to_dt {
                break;
            }

            // Move to next chunk, starting from the day after chunk_end
            // This ensures no overlap between chunks
            current_start = chunk_end + ChronoDuration::days(1);
        }

        chunks
    }

    /// Fetch data for a single date range chunk (internal method)
    async fn fetch_chunk(&self, request: &GoldPriceRequest, from: i64, to: i64) -> ApiResult<Vec<GoldPricePoint>> {
        let url = format!("{}/GoldPrice/Services/PriceService.ashx", self.base_url);

        let from_date = self.timestamp_to_date(from);
        let to_date = self.timestamp_to_date(to);

        tracing::debug!(
            "SJC chunk request: fromDate={}, toDate={}, goldPriceId={}",
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
            return Err(ApiError::DataSource("SJC API returned success=false".to_string()));
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

        Ok(data)
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
        // Split date range into chunks if necessary
        let chunks = self.split_date_range(request.from, request.to);

        tracing::info!(
            "SJC request split into {} chunk(s) for date range {} to {}",
            chunks.len(),
            self.timestamp_to_date(request.from),
            self.timestamp_to_date(request.to)
        );

        // Fetch all chunks sequentially
        let mut all_data: Vec<GoldPricePoint> = Vec::new();

        for (i, (from, to)) in chunks.iter().enumerate() {
            tracing::debug!(
                "Fetching chunk {}/{}: {} to {}",
                i + 1,
                chunks.len(),
                self.timestamp_to_date(*from),
                self.timestamp_to_date(*to)
            );

            match self.fetch_chunk(request, *from, *to).await {
                Ok(mut chunk_data) => {
                    all_data.append(&mut chunk_data);
                }
                Err(e) => {
                    // If any chunk fails, return error
                    return Ok(GoldPriceResponse::error(
                        request.gold_price_id.clone(),
                        self.name().to_string(),
                        format!("Failed to fetch chunk {}/{}: {}", i + 1, chunks.len(), e),
                    ));
                }
            }

            // Add a small delay between requests to avoid overwhelming the API
            if i < chunks.len() - 1 {
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            }
        }

        // Remove duplicates based on timestamp (in case there's overlap)
        // Sort by timestamp first
        all_data.sort_by_key(|p| p.timestamp);

        // Deduplicate entries with the same timestamp
        // Using dedup_by to handle all consecutive duplicates properly
        all_data.dedup_by(|a, b| a.timestamp == b.timestamp);

        tracing::info!(
            "SJC request completed: fetched {} data points from {} chunk(s)",
            all_data.len(),
            chunks.len()
        );

        let mut response = GoldPriceResponse::success(
            request.gold_price_id.clone(),
            self.name().to_string(),
            all_data,
        );

        // Add metadata with unit information
        // IMPORTANT: SJC API ALWAYS returns prices per tael (lượng = 37.5g = 10 chỉ)
        // This is true for ALL gold types regardless of their typical trading unit
        response.metadata = Some(serde_json::json!({
            "unit": "tael",
            "unit_label": "Tael/Lượng (37.5g)",
            "currency": "VND",
            "price_scale": 1.0,
            "note": "All prices are per tael (lượng). User entries in other units will be converted."
        }));

        Ok(response)
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
            "currency": "VND",
            "default_unit": "tael",
            "unit_label": "Tael/Lượng (37.5g)",
            "note": "All API prices are returned per tael (37.5g), regardless of gold type",
            "gold_type_categories": [
                {
                    "category": "Gold Bars (1L, 10L, 1KG)",
                    "description": "Large gold bars - Vàng SJC 1L, 10L, 1KG",
                    "unit": "tael",
                    "unit_label": "Tael/Lượng (37.5g)",
                    "locations": [
                        {"id": "1", "location": "Hồ Chí Minh"},
                        {"id": "2", "location": "Miền Bắc"},
                        {"id": "4", "location": "Nha Trang"},
                        {"id": "5", "location": "Cà Mau"},
                        {"id": "7", "location": "Huế"},
                        {"id": "8", "location": "Biên Hòa"},
                        {"id": "9", "location": "Miền Tây"},
                        {"id": "10", "location": "Quảng Ngãi"},
                        {"id": "13", "location": "Hạ Long"},
                        {"id": "16", "location": "Bạc Liêu"}
                    ]
                },
                {
                    "category": "5 Chỉ Gold",
                    "description": "Medium-sized gold pieces - Vàng SJC 5 chỉ",
                    "unit": "tael",
                    "unit_label": "Tael/Lượng (37.5g)",
                    "locations": [
                        {"id": "17", "location": "Hồ Chí Minh"},
                        {"id": "18", "location": "Miền Bắc"},
                        {"id": "20", "location": "Nha Trang"},
                        {"id": "21", "location": "Cà Mau"},
                        {"id": "23", "location": "Huế"},
                        {"id": "24", "location": "Biên Hòa"},
                        {"id": "25", "location": "Miền Tây"},
                        {"id": "26", "location": "Quảng Ngãi"},
                        {"id": "29", "location": "Hạ Long"},
                        {"id": "32", "location": "Bạc Liêu"}
                    ]
                },
                {
                    "category": "Small Gold (0.5-2 Chỉ)",
                    "description": "Smaller gold pieces - Vàng SJC 0.5 chỉ, 1 chỉ, 2 chỉ",
                    "unit": "tael",
                    "unit_label": "Tael/Lượng (37.5g)",
                    "locations": [
                        {"id": "33", "location": "Hồ Chí Minh"},
                        {"id": "34", "location": "Miền Bắc"},
                        {"id": "36", "location": "Nha Trang"},
                        {"id": "37", "location": "Cà Mau"},
                        {"id": "39", "location": "Huế"},
                        {"id": "40", "location": "Biên Hòa"},
                        {"id": "41", "location": "Miền Tây"},
                        {"id": "42", "location": "Quảng Ngãi"},
                        {"id": "45", "location": "Hạ Long"},
                        {"id": "48", "location": "Bạc Liêu"}
                    ]
                },
                {
                    "category": "Gold Rings",
                    "description": "Gold jewelry/rings - Vàng nhẫn SJC 99.99% 1 chỉ, 2 chỉ, 5 chỉ",
                    "unit": "tael",
                    "unit_label": "Tael/Lượng (37.5g) - API format",
                    "typical_display_unit": "mace",
                    "typical_display_label": "Mace/Chỉ (3.75g) - User display",
                    "locations": [
                        {"id": "49", "location": "Hồ Chí Minh"},
                        {"id": "50", "location": "Miền Bắc"},
                        {"id": "52", "location": "Nha Trang"},
                        {"id": "53", "location": "Cà Mau"},
                        {"id": "55", "location": "Huế"},
                        {"id": "56", "location": "Biên Hòa"},
                        {"id": "57", "location": "Miền Tây"},
                        {"id": "58", "location": "Quảng Ngãi"}
                    ]
                }
            ],
            "total_supported_ids": 38,
            "documentation": "See docs/SJC_GOLD_PRICE_IDS.md for complete reference"
        })
    }
}
