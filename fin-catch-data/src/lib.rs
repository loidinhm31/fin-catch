pub mod error;
pub mod gateway;
pub mod models;
pub mod sources;

// Routes module is only needed for server mode
#[cfg(feature = "server")]
pub mod routes;

// Re-export commonly used types
pub use error::{ApiError, ApiResult};
pub use gateway::DataSourceGateway;
pub use models::{
    request::{StockHistoryRequest, Resolution},
    response::{StockHistoryResponse, Candle},
    gold::{GoldPriceRequest, GoldPriceResponse, GoldPricePoint},
    exchange_rate::{ExchangeRateRequest, ExchangeRateResponse, ExchangeRatePoint},
    gold_premium::{GoldPremiumRequest, GoldPremiumResponse, GoldPremiumPoint, GoldPremiumCalculator},
    unified::{DataRequest, DataResponse, DataType},
};
