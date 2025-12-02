use crate::{
    error::{ApiError, ApiResult},
    models::{Candle, StockHistoryRequest, StockHistoryResponse},
    sources::stock_source_trait::StockDataSource,
};
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};

const SSI_BASE_URL: &str = "https://iboard-api.ssi.com.vn";

/// SSI API response structure
/// The response format might be similar to VNDIRECT or different
#[derive(Debug, Deserialize, Serialize)]
#[serde(untagged)]
enum SsiResponse {
    /// Format 1: Similar to VNDIRECT (status with arrays)
    StatusArrays {
        #[serde(rename = "s")]
        status: String,

        #[serde(rename = "t", default)]
        timestamps: Vec<i64>,

        #[serde(rename = "o", default)]
        open: Vec<f64>,

        #[serde(rename = "h", default)]
        high: Vec<f64>,

        #[serde(rename = "l", default)]
        low: Vec<f64>,

        #[serde(rename = "c", default)]
        close: Vec<f64>,

        #[serde(rename = "v", default)]
        volume: Vec<i64>,
    },
    /// Format 2: Object with data array
    ObjectArrays {
        status: String,
        data: SsiDataArrays,
    },
}

#[derive(Debug, Deserialize, Serialize)]
struct SsiDataArrays {
    #[serde(rename = "t", default)]
    timestamps: Vec<i64>,

    #[serde(rename = "o", default)]
    open: Vec<f64>,

    #[serde(rename = "h", default)]
    high: Vec<f64>,

    #[serde(rename = "l", default)]
    low: Vec<f64>,

    #[serde(rename = "c", default)]
    close: Vec<f64>,

    #[serde(rename = "v", default)]
    volume: Vec<i64>,
}

/// SSI data source implementation
pub struct SsiSource {
    client: Client,
    base_url: String,
}

impl SsiSource {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
            base_url: SSI_BASE_URL.to_string(),
        }
    }

    pub fn with_base_url(mut self, base_url: String) -> Self {
        self.base_url = base_url;
        self
    }

    /// Convert SSI response to standard format
    fn convert_response(
        &self,
        ssi_response: SsiResponse,
        request: &StockHistoryRequest,
    ) -> ApiResult<StockHistoryResponse> {
        let (status, timestamps, open, high, low, close, volume) = match ssi_response {
            SsiResponse::StatusArrays {
                status,
                timestamps,
                open,
                high,
                low,
                close,
                volume,
            } => (status, timestamps, open, high, low, close, volume),
            SsiResponse::ObjectArrays { status, data } => (
                status,
                data.timestamps,
                data.open,
                data.high,
                data.low,
                data.close,
                data.volume,
            ),
        };

        // Check status
        if status != "ok" && status != "success" {
            return Ok(StockHistoryResponse::error(
                request.symbol.clone(),
                request.resolution.as_str().to_string(),
                self.name().to_string(),
                format!("SSI API returned status: {}", status),
            ));
        }

        // Ensure all arrays have the same length
        let len = timestamps.len();
        if open.len() != len
            || high.len() != len
            || low.len() != len
            || close.len() != len
            || volume.len() != len
        {
            return Err(ApiError::DataSource(
                "Inconsistent data array lengths in SSI response".to_string(),
            ));
        }

        // Convert to standard candle format
        let candles: Vec<Candle> = (0..len)
            .map(|i| Candle {
                timestamp: timestamps[i],
                open: open[i],
                high: high[i],
                low: low[i],
                close: close[i],
                volume: volume[i],
            })
            .collect();

        Ok(StockHistoryResponse::success(
            request.symbol.clone(),
            request.resolution.as_str().to_string(),
            self.name().to_string(),
            candles,
        )
        .with_metadata(self.metadata()))
    }
}

impl Default for SsiSource {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl StockDataSource for SsiSource {
    fn name(&self) -> &str {
        "ssi"
    }

    async fn fetch_history(&self, request: &StockHistoryRequest) -> ApiResult<StockHistoryResponse> {
        let url = format!("{}/statistics/charts/history", self.base_url);

        let response = self
            .client
            .get(&url)
            .query(&[
                ("resolution", request.resolution.as_str()),
                ("symbol", &request.symbol),
                ("from", &request.from.to_string()),
                ("to", &request.to.to_string()),
            ])
            // Add required headers to mimic browser request
            .header("Accept", "application/json, text/plain, */*")
            .header("Accept-Language", "vi,en-US;q=0.9,en;q=0.8")
            .header("Origin", "https://iboard.ssi.com.vn")
            .header("Referer", "https://iboard.ssi.com.vn/")
            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36")
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(ApiError::DataSource(format!(
                "SSI API request failed with status: {}",
                response.status()
            )));
        }

        let ssi_response: SsiResponse = response.json().await?;
        self.convert_response(ssi_response, request)
    }

    async fn health_check(&self) -> ApiResult<bool> {
        let url = format!("{}/statistics/charts/history", self.base_url);

        // Make a minimal request to check if the API is available
        let response = self
            .client
            .get(&url)
            .query(&[
                ("resolution", "1D"),
                ("symbol", "ACB"),
                ("from", "1739750400"),
                ("to", "1740960000"),
            ])
            // Add required headers to mimic browser request
            .header("Accept", "application/json, text/plain, */*")
            .header("Origin", "https://iboard.ssi.com.vn")
            .header("Referer", "https://iboard.ssi.com.vn/")
            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36")
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
            "provider": "SSI (Saigon Securities Inc.)",
            "supports_resolutions": ["1", "5", "15", "30", "60", "1D", "1W", "1M"],
            "price_scale": 1000,
        })
    }
}
