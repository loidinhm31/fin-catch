/// Test to verify that all stock sources include price_scale in metadata
///
/// To run this test:
/// ```
/// cargo test --test metadata_price_scale_test -- --nocapture
/// ```

use fin_catch_data::{
    models::{Resolution, StockHistoryRequest},
    sources::{SsiSource, StockDataSource, VndirectSource, YahooFinanceSource},
};

#[test]
fn test_source_metadata_includes_price_scale() {
    println!("\n=== Testing Source Metadata for price_scale ===");

    // Test SSI
    let ssi_source = SsiSource::new();
    let ssi_metadata = ssi_source.metadata();
    println!("\nSSI metadata: {}", serde_json::to_string_pretty(&ssi_metadata).unwrap());
    assert!(ssi_metadata.get("price_scale").is_some(), "SSI metadata should include price_scale");
    assert_eq!(ssi_metadata["price_scale"], 1000, "SSI price_scale should be 1000");
    println!("✓ SSI metadata includes price_scale: {}", ssi_metadata["price_scale"]);

    // Test VNDirect
    let vndirect_source = VndirectSource::new();
    let vndirect_metadata = vndirect_source.metadata();
    println!("\nVNDirect metadata: {}", serde_json::to_string_pretty(&vndirect_metadata).unwrap());
    assert!(vndirect_metadata.get("price_scale").is_some(), "VNDirect metadata should include price_scale");
    assert_eq!(vndirect_metadata["price_scale"], 1000, "VNDirect price_scale should be 1000");
    println!("✓ VNDirect metadata includes price_scale: {}", vndirect_metadata["price_scale"]);

    // Test Yahoo Finance
    let yahoo_source = YahooFinanceSource::new();
    let yahoo_metadata = yahoo_source.metadata();
    println!("\nYahoo Finance metadata: {}", serde_json::to_string_pretty(&yahoo_metadata).unwrap());
    assert!(yahoo_metadata.get("price_scale").is_some(), "Yahoo Finance metadata should include price_scale");
    assert_eq!(yahoo_metadata["price_scale"], 1, "Yahoo Finance price_scale should be 1");
    println!("✓ Yahoo Finance metadata includes price_scale: {}", yahoo_metadata["price_scale"]);
}

#[tokio::test]
async fn test_response_includes_metadata() {
    println!("\n=== Testing Response Includes Metadata ===");

    // Test with VNDirect
    let source = VndirectSource::new();
    let request = StockHistoryRequest {
        symbol: "VND".to_string(),
        resolution: Resolution::OneDay,
        from: 1715385600, // May 11, 2024
        to: 1715472000,   // May 12, 2024
        source: None,
    };

    match source.fetch_history(&request).await {
        Ok(response) => {
            println!("\nVNDirect response status: {}", response.status);
            if response.status == "ok" {
                assert!(response.metadata.is_some(), "Response should include metadata");
                let metadata = response.metadata.unwrap();
                println!("Response metadata: {}", serde_json::to_string_pretty(&metadata).unwrap());
                assert!(metadata.get("price_scale").is_some(), "Response metadata should include price_scale");
                println!("✓ Response includes metadata with price_scale: {}", metadata["price_scale"]);
            } else {
                println!("⚠ Skipping metadata check - API returned non-ok status: {}", response.status);
            }
        }
        Err(e) => {
            println!("⚠ Warning: API call failed (this may be due to network/API issues): {}", e);
            println!("  Skipping response metadata verification");
        }
    }
}
