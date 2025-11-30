/// Integration tests for all data sources
/// These tests verify that connections to external APIs work correctly
///
/// To run these tests:
/// ```
/// cargo test --test sources_integration_test -- --test-threads=1 --nocapture
/// ```
///
/// Note: These are integration tests that make real API calls.
/// They may fail if:
/// - Network connectivity is unavailable
/// - External APIs are down or rate-limiting
/// - API endpoints have changed

use fin_catch_data::{
    models::{GoldPriceRequest, Resolution, StockHistoryRequest},
    sources::{
        GoldDataSource, SjcSource, SsiSource, StockDataSource, VndirectSource,
    },
};


// Test timestamps based on the shell scripts
const STOCK_FROM: i64 = 1720396800; // July 8, 2024
const STOCK_TO: i64 = 1720483200; // July 9, 2024
const GOLD_FROM: i64 = 1739750400; // Feb 17, 2025
const GOLD_TO: i64 = 1739836800; // Feb 18, 2025
const SSI_FROM: i64 = 1739750400; // Feb 17, 2025
const SSI_TO: i64 = 1739836800; // Feb 18, 2025

/// Test helper to print test results
fn print_test_result(source_name: &str, test_name: &str, success: bool) {
    if success {
        println!("✓ {}: {} - PASSED", source_name, test_name);
    } else {
        println!("✗ {}: {} - FAILED", source_name, test_name);
    }
}

// =============================================================================
// STOCK DATA SOURCE TESTS
// =============================================================================

#[tokio::test]
async fn test_vndirect_fetch_history() {
    println!("\n=== Testing VNDIRECT Source ===");

    let source = VndirectSource::new();
    let request = StockHistoryRequest {
        symbol: "VND".to_string(),
        resolution: Resolution::OneDay,
        from: STOCK_FROM,
        to: STOCK_TO,
        source: Some("vndirect".to_string()),
    };

    match source.fetch_history(&request).await {
        Ok(response) => {
            print_test_result("VNDIRECT", "fetch_history", true);
            assert_eq!(response.status, "ok", "Response status should be 'ok'");
            assert_eq!(response.source, "vndirect");
            assert_eq!(response.symbol, "VND");
            assert!(response.data.is_some(), "Response should contain data");

            if let Some(data) = response.data {
                println!("  → Received {} candles", data.len());
                assert!(!data.is_empty(), "Should have at least some candle data");

                // Verify data structure
                if let Some(first_candle) = data.first() {
                    println!("  → First candle: timestamp={}, open={}, close={}",
                        first_candle.timestamp, first_candle.open, first_candle.close);
                    assert!(first_candle.timestamp > 0);
                    assert!(first_candle.open > 0.0);
                    assert!(first_candle.close > 0.0);
                }
            }
        }
        Err(e) => {
            print_test_result("VNDIRECT", "fetch_history", false);
            panic!("VNDIRECT fetch_history failed: {:?}", e);
        }
    }
}

#[tokio::test]
async fn test_vndirect_health_check() {
    let source = VndirectSource::new();

    match source.health_check().await {
        Ok(is_healthy) => {
            print_test_result("VNDIRECT", "health_check", is_healthy);
            assert!(is_healthy, "VNDIRECT source should be healthy");
            println!("  → VNDIRECT API is healthy");
        }
        Err(e) => {
            print_test_result("VNDIRECT", "health_check", false);
            panic!("VNDIRECT health_check failed: {:?}", e);
        }
    }
}

#[tokio::test]
async fn test_vndirect_metadata() {
    let source = VndirectSource::new();
    let metadata = source.metadata();

    print_test_result("VNDIRECT", "metadata", true);
    assert_eq!(metadata["source"], "vndirect");
    println!("  → Metadata: {}", serde_json::to_string_pretty(&metadata).unwrap());
}

#[tokio::test]
async fn test_ssi_fetch_history() {
    println!("\n=== Testing SSI Source ===");

    let source = SsiSource::new();
    let request = StockHistoryRequest {
        symbol: "ACB".to_string(),
        resolution: Resolution::OneDay,
        from: SSI_FROM,
        to: SSI_TO,
        source: Some("ssi".to_string()),
    };

    match source.fetch_history(&request).await {
        Ok(response) => {
            print_test_result("SSI", "fetch_history", true);
            assert_eq!(response.status, "ok", "Response status should be 'ok'");
            assert_eq!(response.source, "ssi");
            assert_eq!(response.symbol, "ACB");
            assert!(response.data.is_some(), "Response should contain data");

            if let Some(data) = response.data {
                println!("  → Received {} candles", data.len());
                assert!(!data.is_empty(), "Should have at least some candle data");

                // Verify data structure
                if let Some(first_candle) = data.first() {
                    println!("  → First candle: timestamp={}, open={}, close={}",
                        first_candle.timestamp, first_candle.open, first_candle.close);
                    assert!(first_candle.timestamp > 0);
                    assert!(first_candle.open > 0.0);
                    assert!(first_candle.close > 0.0);
                }
            }
        }
        Err(e) => {
            print_test_result("SSI", "fetch_history", false);
            panic!("SSI fetch_history failed: {:?}", e);
        }
    }
}

#[tokio::test]
async fn test_ssi_health_check() {
    let source = SsiSource::new();

    match source.health_check().await {
        Ok(is_healthy) => {
            print_test_result("SSI", "health_check", is_healthy);
            assert!(is_healthy, "SSI source should be healthy");
            println!("  → SSI API is healthy");
        }
        Err(e) => {
            print_test_result("SSI", "health_check", false);
            panic!("SSI health_check failed: {:?}", e);
        }
    }
}

#[tokio::test]
async fn test_ssi_metadata() {
    let source = SsiSource::new();
    let metadata = source.metadata();

    print_test_result("SSI", "metadata", true);
    assert_eq!(metadata["source"], "ssi");
    println!("  → Metadata: {}", serde_json::to_string_pretty(&metadata).unwrap());
}

// =============================================================================
// GOLD DATA SOURCE TESTS
// =============================================================================

#[tokio::test]
async fn test_sjc_fetch_history() {
    println!("\n=== Testing SJC Source ===");

    let source = SjcSource::new();
    let request = GoldPriceRequest {
        gold_price_id: "1".to_string(), // Vàng SJC 1L, 10L, 1KG
        from: GOLD_FROM,
        to: GOLD_TO,
        source: Some("sjc".to_string()),
    };

    match source.fetch_history(&request).await {
        Ok(response) => {
            print_test_result("SJC", "fetch_history", true);
            assert_eq!(response.status, "ok", "Response status should be 'ok'");
            assert_eq!(response.source, "sjc");
            assert_eq!(response.gold_price_id, "1");
            assert!(response.data.is_some(), "Response should contain data");

            if let Some(data) = response.data {
                println!("  → Received {} gold price points", data.len());
                assert!(!data.is_empty(), "Should have at least some gold price data");

                // Verify data structure
                if let Some(first_point) = data.first() {
                    println!("  → First point: timestamp={}, type={}, buy={}, sell={}",
                        first_point.timestamp, first_point.type_name,
                        first_point.buy, first_point.sell);
                    assert!(first_point.timestamp > 0);
                    assert!(first_point.buy > 0.0);
                    assert!(first_point.sell > 0.0);
                    assert!(!first_point.type_name.is_empty());
                }
            }
        }
        Err(e) => {
            print_test_result("SJC", "fetch_history", false);
            panic!("SJC fetch_history failed: {:?}", e);
        }
    }
}

#[tokio::test]
async fn test_sjc_fetch_history_gold_type_2() {
    println!("\n=== Testing SJC Source with Gold Type 2 ===");

    let source = SjcSource::new();
    let request = GoldPriceRequest {
        gold_price_id: "2".to_string(), // Vàng nữ trang 99.99%
        from: GOLD_FROM,
        to: GOLD_TO,
        source: Some("sjc".to_string()),
    };

    match source.fetch_history(&request).await {
        Ok(response) => {
            print_test_result("SJC", "fetch_history (type 2)", true);
            assert_eq!(response.status, "ok");
            assert_eq!(response.gold_price_id, "2");

            if let Some(data) = response.data {
                println!("  → Received {} gold price points for type 2", data.len());
            }
        }
        Err(e) => {
            print_test_result("SJC", "fetch_history (type 2)", false);
            panic!("SJC fetch_history (type 2) failed: {:?}", e);
        }
    }
}

#[tokio::test]
async fn test_sjc_health_check() {
    let source = SjcSource::new();

    match source.health_check().await {
        Ok(is_healthy) => {
            print_test_result("SJC", "health_check", is_healthy);
            assert!(is_healthy, "SJC source should be healthy");
            println!("  → SJC API is healthy");
        }
        Err(e) => {
            print_test_result("SJC", "health_check", false);
            panic!("SJC health_check failed: {:?}", e);
        }
    }
}

#[tokio::test]
async fn test_sjc_metadata() {
    let source = SjcSource::new();
    let metadata = source.metadata();

    print_test_result("SJC", "metadata", true);
    assert_eq!(metadata["source"], "sjc");
    assert_eq!(metadata["data_type"], "gold");
    assert_eq!(metadata["country"], "Vietnam");
    println!("  → Metadata: {}", serde_json::to_string_pretty(&metadata).unwrap());
}

// =============================================================================
// COMPREHENSIVE TEST - ALL SOURCES
// =============================================================================

#[tokio::test]
async fn test_all_sources_health_check() {
    println!("\n=== Testing All Sources Health Check ===");

    let vndirect = VndirectSource::new();
    let ssi = SsiSource::new();
    let sjc = SjcSource::new();

    let mut all_healthy = true;

    // Test VNDIRECT
    match vndirect.health_check().await {
        Ok(healthy) => {
            println!("VNDIRECT: {}", if healthy { "✓ Healthy" } else { "✗ Unhealthy" });
            all_healthy &= healthy;
        }
        Err(e) => {
            println!("VNDIRECT: ✗ Error - {:?}", e);
            all_healthy = false;
        }
    }

    // Test SSI
    match ssi.health_check().await {
        Ok(healthy) => {
            println!("SSI: {}", if healthy { "✓ Healthy" } else { "✗ Unhealthy" });
            all_healthy &= healthy;
        }
        Err(e) => {
            println!("SSI: ✗ Error - {:?}", e);
            all_healthy = false;
        }
    }

    // Test SJC
    match sjc.health_check().await {
        Ok(healthy) => {
            println!("SJC: {}", if healthy { "✓ Healthy" } else { "✗ Unhealthy" });
            all_healthy &= healthy;
        }
        Err(e) => {
            println!("SJC: ✗ Error - {:?}", e);
            all_healthy = false;
        }
    }

    assert!(all_healthy, "All sources should be healthy");
    println!("\n✓ All sources are healthy!");
}

#[tokio::test]
async fn test_all_sources_metadata() {
    println!("\n=== Testing All Sources Metadata ===");

    let sources: Vec<(&str, serde_json::Value)> = vec![
        ("VNDIRECT", VndirectSource::new().metadata()),
        ("SSI", SsiSource::new().metadata()),
        ("SJC", SjcSource::new().metadata()),
    ];

    for (name, metadata) in sources {
        println!("\n{} Metadata:", name);
        println!("{}", serde_json::to_string_pretty(&metadata).unwrap());
        assert!(metadata.is_object(), "{} metadata should be an object", name);
        assert!(metadata.get("source").is_some(), "{} metadata should have 'source' field", name);
    }
}
