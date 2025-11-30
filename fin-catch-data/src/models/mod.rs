pub mod request;
pub mod response;
pub mod gold;
pub mod unified;
pub mod exchange_rate;
pub mod gold_premium;

pub use exchange_rate::{ExchangeRatePoint, ExchangeRateRequest, ExchangeRateResponse};
pub use gold::{GoldPricePoint, GoldPriceRequest, GoldPriceResponse};
pub use gold_premium::{GoldPremiumPoint, GoldPremiumRequest, GoldPremiumResponse};
pub use request::{Resolution, StockHistoryRequest};
pub use response::{Candle, StockHistoryResponse};
pub use unified::{DataRequest, DataResponse, DataType};
