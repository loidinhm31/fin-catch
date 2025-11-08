use crate::{
    error::{ApiError, ApiResult},
    models::{Candle, StockHistoryRequest, StockHistoryResponse},
    sources::source_trait::StockDataSource,
};
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};

const VNDIRECT_BASE_URL: &str = "https://dchart-api.vndirect.com.vn";

/// VNDIRECT API response structure
#[derive(Debug, Deserialize, Serialize)]
struct VndirectResponse {
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
}

/// VNDIRECT data source implementation
pub struct VndirectSource {
    client: Client,
    base_url: String,
}

impl VndirectSource {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
            base_url: VNDIRECT_BASE_URL.to_string(),
        }
    }

    pub fn with_base_url(mut self, base_url: String) -> Self {
        self.base_url = base_url;
        self
    }

    /// Convert VNDIRECT response to standard format
    fn convert_response(
        &self,
        vnd_response: VndirectResponse,
        request: &StockHistoryRequest,
    ) -> ApiResult<StockHistoryResponse> {
        if vnd_response.status != "ok" {
            return Ok(StockHistoryResponse::error(
                request.symbol.clone(),
                request.resolution.as_str().to_string(),
                self.name().to_string(),
                format!("VNDIRECT API returned status: {}", vnd_response.status),
            ));
        }

        // Ensure all arrays have the same length
        let len = vnd_response.timestamps.len();
        if vnd_response.open.len() != len
            || vnd_response.high.len() != len
            || vnd_response.low.len() != len
            || vnd_response.close.len() != len
            || vnd_response.volume.len() != len
        {
            return Err(ApiError::DataSource(
                "Inconsistent data array lengths in VNDIRECT response".to_string(),
            ));
        }

        // Convert to standard candle format
        let candles: Vec<Candle> = (0..len)
            .map(|i| Candle {
                timestamp: vnd_response.timestamps[i],
                open: vnd_response.open[i],
                high: vnd_response.high[i],
                low: vnd_response.low[i],
                close: vnd_response.close[i],
                volume: vnd_response.volume[i],
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

impl Default for VndirectSource {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl StockDataSource for VndirectSource {
    fn name(&self) -> &str {
        "vndirect"
    }

    async fn fetch_history(&self, request: &StockHistoryRequest) -> ApiResult<StockHistoryResponse> {
        let url = format!("{}/dchart/history", self.base_url);

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
            .header("Origin", "https://dchart.vndirect.com.vn")
            .header("Referer", "https://dchart.vndirect.com.vn/")
            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36")
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(ApiError::DataSource(format!(
                "VNDIRECT API request failed with status: {}",
                response.status()
            )));
        }

        let vnd_response: VndirectResponse = response.json().await?;
        self.convert_response(vnd_response, request)
    }

    async fn health_check(&self) -> ApiResult<bool> {
        let url = format!("{}/dchart/history", self.base_url);

        // Make a minimal request to check if the API is available
        let response = self
            .client
            .get(&url)
            .query(&[
                ("resolution", "1D"),
                ("symbol", "VND"),
                ("from", "1715385600"),
                ("to", "1715472000"),
            ])
            // Add required headers to mimic browser request
            .header("Accept", "application/json, text/plain, */*")
            .header("Origin", "https://dchart.vndirect.com.vn")
            .header("Referer", "https://dchart.vndirect.com.vn/")
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
            "provider": "VNDIRECT",
            "supports_resolutions": ["1", "5", "15", "30", "60", "1D", "1W", "1M"],
        })
    }
}
