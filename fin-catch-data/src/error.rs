#[cfg(feature = "server")]
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("Data source error: {0}")]
    DataSource(String),

    #[error("Invalid request: {0}")]
    InvalidRequest(String),

    #[error("HTTP request failed: {0}")]
    HttpRequest(#[from] reqwest::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Unknown data source: {0}")]
    UnknownSource(String),

    #[error("Internal server error: {0}")]
    Internal(String),
}

#[cfg(feature = "server")]
impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            ApiError::DataSource(msg) => (StatusCode::BAD_GATEWAY, msg.clone()),
            ApiError::InvalidRequest(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            ApiError::HttpRequest(err) => (
                StatusCode::BAD_GATEWAY,
                format!("Failed to fetch data: {}", err),
            ),
            ApiError::Serialization(err) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Data serialization error: {}", err),
            ),
            ApiError::UnknownSource(source) => (
                StatusCode::BAD_REQUEST,
                format!("Unknown data source: {}", source),
            ),
            ApiError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
        };

        let error_response = ErrorResponse {
            error: status.to_string(),
            message,
        };

        (status, Json(error_response)).into_response()
    }
}

pub type ApiResult<T> = Result<T, ApiError>;
