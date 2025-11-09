pub mod stock_source_trait;
pub mod gold_source_trait;
pub mod vndirect;
pub mod ssi;
pub mod yahoo_finance;
pub mod sjc;
pub mod mihong;

pub use stock_source_trait::StockDataSource;
pub use gold_source_trait::GoldDataSource;
pub use vndirect::VndirectSource;
pub use ssi::SsiSource;
pub use yahoo_finance::YahooFinanceSource;
pub use sjc::SjcSource;
pub use mihong::MihongSource;
