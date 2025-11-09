use serde::{Deserialize, Serialize};
use super::gold::{GoldPriceRequest, GoldPriceResponse};
use super::request::StockHistoryRequest;
use super::response::StockHistoryResponse;

/// Data type enum to distinguish between different data types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DataType {
    Stock,
    Gold,
}

impl DataType {
    pub fn as_str(&self) -> &str {
        match self {
            DataType::Stock => "stock",
            DataType::Gold => "gold",
        }
    }
}

/// Unified data request that can handle multiple data types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "data_type", rename_all = "lowercase")]
pub enum DataRequest {
    Stock(StockHistoryRequest),
    Gold(GoldPriceRequest),
}

impl DataRequest {
    pub fn data_type(&self) -> DataType {
        match self {
            DataRequest::Stock(_) => DataType::Stock,
            DataRequest::Gold(_) => DataType::Gold,
        }
    }

    pub fn source(&self) -> Option<&str> {
        match self {
            DataRequest::Stock(req) => req.source.as_deref(),
            DataRequest::Gold(req) => req.source.as_deref(),
        }
    }

    pub fn set_source(&mut self, source: String) {
        match self {
            DataRequest::Stock(req) => req.source = Some(source),
            DataRequest::Gold(req) => req.source = Some(source),
        }
    }

    pub fn validate(&self) -> Result<(), String> {
        match self {
            DataRequest::Stock(req) => req.validate(),
            DataRequest::Gold(req) => req.validate(),
        }
    }
}

/// Unified data response that can handle multiple data types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "data_type", rename_all = "lowercase")]
pub enum DataResponse {
    Stock(StockHistoryResponse),
    Gold(GoldPriceResponse),
}

impl DataResponse {
    pub fn data_type(&self) -> DataType {
        match self {
            DataResponse::Stock(_) => DataType::Stock,
            DataResponse::Gold(_) => DataType::Gold,
        }
    }

    pub fn is_success(&self) -> bool {
        match self {
            DataResponse::Stock(resp) => resp.status == "ok",
            DataResponse::Gold(resp) => resp.status == "ok",
        }
    }
}
