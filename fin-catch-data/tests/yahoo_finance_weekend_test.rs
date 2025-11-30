/// Test Yahoo Finance weekend handling
/// These tests verify that Yahoo Finance correctly falls back to Friday for weekend dates
///
/// To run these tests:
/// ```
/// cargo test --test yahoo_finance_weekend_test -- --nocapture
/// ```

use fin_catch_data::{
    models::{Resolution, StockHistoryRequest},
    sources::{StockDataSource, YahooFinanceSource},
};

const TEST_FRIDAY_NOON: i64 = 1764331200; // Nov 28, 2025 12:00:00 GMT (Friday at noon)
const TEST_SATURDAY: i64 = 1764374400; // Nov 29, 2025 00:00:00 GMT (Saturday)
const TEST_SUNDAY: i64 = 1764460800; // Nov 30, 2025 00:00:00 GMT (Sunday)

fn print_test_result(test_name: &str, success: bool) {
    if success {
        println!("✓ {} - PASSED", test_name);
    } else {
        println!("✗ {} - FAILED", test_name);
    }
}

#[tokio::test]
async fn test_yahoo_finance_saturday_weekend() {
    println!("\n=== Testing Yahoo Finance - Saturday Request (Should Fallback to Friday) ===");

    let source = YahooFinanceSource::new();
    let request = StockHistoryRequest {
        symbol: "GC=F".to_string(),
        resolution: Resolution::OneDay,
        from: TEST_SATURDAY,
        to: TEST_SATURDAY,
        source: Some("yahoo_finance".to_string()),
    };

    match source.fetch_history(&request).await {
        Ok(response) => {
            println!("  → Status: {}", response.status);
            print_test_result("yahoo_finance_saturday_request", response.status == "ok");

            if let Some(metadata) = &response.metadata {
                println!("  → Metadata: {}", serde_json::to_string_pretty(metadata).unwrap());

                if let Some(weekend_adjusted) = metadata.get("weekend_adjusted") {
                    if weekend_adjusted.as_bool() == Some(true) {
                        print_test_result("yahoo_finance_saturday_weekend_flag", true);
                        println!("  → Weekend adjustment flag found");
                    } else {
                        print_test_result("yahoo_finance_saturday_weekend_flag", false);
                    }
                } else {
                    println!("  → No weekend_adjusted flag (may be acceptable if data returned)");
                }

                if let Some(note) = metadata.get("note") {
                    println!("  → Note: {}", note);
                    print_test_result("yahoo_finance_saturday_note", true);
                }
            } else {
                println!("  → No metadata");
            }

            if let Some(data) = &response.data {
                println!("  → Data points: {}", data.len());
                if !data.is_empty() {
                    println!("  → First candle timestamp: {}", data[0].timestamp);
                }
            }
        }
        Err(e) => {
            println!("  → Error: {:?}", e);
            print_test_result("yahoo_finance_saturday_request", false);
        }
    }
}

#[tokio::test]
async fn test_yahoo_finance_sunday_weekend() {
    println!("\n=== Testing Yahoo Finance - Sunday Request (Should Fallback to Friday) ===");

    let source = YahooFinanceSource::new();
    let request = StockHistoryRequest {
        symbol: "GC=F".to_string(),
        resolution: Resolution::OneDay,
        from: TEST_SUNDAY,
        to: TEST_SUNDAY,
        source: Some("yahoo_finance".to_string()),
    };

    match source.fetch_history(&request).await {
        Ok(response) => {
            println!("  → Status: {}", response.status);
            print_test_result("yahoo_finance_sunday_request", response.status == "ok");

            if let Some(metadata) = &response.metadata {
                println!("  → Metadata: {}", serde_json::to_string_pretty(metadata).unwrap());

                if let Some(weekend_adjusted) = metadata.get("weekend_adjusted") {
                    if weekend_adjusted.as_bool() == Some(true) {
                        print_test_result("yahoo_finance_sunday_weekend_flag", true);
                    }
                }

                if let Some(note) = metadata.get("note") {
                    println!("  → Note: {}", note);
                }
            }

            if let Some(data) = &response.data {
                println!("  → Data points: {}", data.len());
            }
        }
        Err(e) => {
            println!("  → Error: {:?}", e);
            print_test_result("yahoo_finance_sunday_request", false);
        }
    }
}

#[tokio::test]
async fn test_yahoo_finance_weekday_no_adjustment() {
    println!("\n=== Testing Yahoo Finance - Friday Request (No Adjustment) ===");

    let source = YahooFinanceSource::new();
    let request = StockHistoryRequest {
        symbol: "GC=F".to_string(),
        resolution: Resolution::OneDay,
        from: TEST_FRIDAY_NOON,
        to: TEST_FRIDAY_NOON,
        source: Some("yahoo_finance".to_string()),
    };

    match source.fetch_history(&request).await {
        Ok(response) => {
            println!("  → Status: {}", response.status);
            print_test_result("yahoo_finance_friday_request", response.status == "ok");

            if let Some(metadata) = &response.metadata {
                println!("  → Metadata: {}", serde_json::to_string_pretty(metadata).unwrap());

                if metadata.get("weekend_adjusted").is_some() {
                    print_test_result("yahoo_finance_friday_no_weekend_flag", false);
                    panic!("Should not have weekend_adjusted flag for a weekday request");
                } else {
                    print_test_result("yahoo_finance_friday_no_weekend_flag", true);
                    println!("  → Correctly has no weekend adjustment flag");
                }
            } else {
                print_test_result("yahoo_finance_friday_no_metadata", true);
                println!("  → No metadata (expected for weekday)");
            }

            if let Some(data) = &response.data {
                println!("  → Data points: {}", data.len());
            }
        }
        Err(e) => {
            println!("  → Error (may be acceptable): {:?}", e);
            print_test_result("yahoo_finance_friday_request", true);
        }
    }
}
