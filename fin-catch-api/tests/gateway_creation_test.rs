#[cfg(test)]
mod tests {
    use fin_catch_api::gateway::DataSourceGateway;
    use fin_catch_api::sources::{SjcSource, VndirectSource};
    use std::sync::Arc;

    #[test]
    fn test_gateway_creation() {
        let mut gateway = DataSourceGateway::new("vndirect".to_string(), "sjc".to_string(), "vietcombank".to_string());

        let stock_source = Arc::new(VndirectSource::new());
        gateway.register_stock_source(stock_source);

        let gold_source = Arc::new(SjcSource::new());
        gateway.register_gold_source(gold_source);

        assert_eq!(gateway.list_stock_sources().len(), 1);
        assert_eq!(gateway.list_gold_sources().len(), 1);
        assert!(gateway.get_stock_source("vndirect").is_some());
        assert!(gateway.get_gold_source("sjc").is_some());
    }
}