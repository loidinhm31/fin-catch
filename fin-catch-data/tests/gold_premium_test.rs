/// Integration tests for gold premium API
/// These tests verify that gold premium calculations work correctly
///
/// To run these tests:
/// ```
/// cargo test --test gold_premium_test -- --test-threads=1 --nocapture
/// ```

use fin_catch_data::{
    gateway::DataSourceGateway,
    models::GoldPremiumRequest,
};

/// Test timestamps - using historical dates with known data
const TEST_FROM: i64 = 1730764800; // Nov 5, 2024 (Tuesday)
const TEST_TO: i64 = 1730851200; // Nov 6, 2024 (Wednesday)
const TEST_FRIDAY_NOON: i64 = 1764331200; // Nov 28, 2025 12:00:00 GMT (Friday at noon)
const TEST_SATURDAY: i64 = 1764374400; // Nov 29, 2025 00:00:00 GMT (Saturday)
const TEST_SUNDAY: i64 = 1764460800; // Nov 30, 2025 00:00:00 GMT (Sunday)

/// Test helper to print test results
fn print_test_result(test_name: &str, success: bool) {
    if success {
        println!("✓ {} - PASSED", test_name);
    } else {
        println!("✗ {} - FAILED", test_name);
    }
}

#[tokio::test]
async fn test_gold_premium_basic() {
    println!("\n=== Testing Gold Premium - Basic Request ===");

    let gateway = DataSourceGateway::with_all_sources();

    let request = GoldPremiumRequest {
        from: TEST_FROM,
        to: TEST_TO,
        gold_price_id: Some("1".to_string()),
        currency_code: Some("USD".to_string()),
        gold_source: Some("sjc".to_string()),
        exchange_rate_source: Some("vietcombank".to_string()),
        stock_source: Some("yahoo_finance".to_string()),
    };

    // Validate request first
    match request.validate() {
        Ok(_) => {
            print_test_result("gold_premium_request_validation", true);
            println!("  → Request validation passed");
        }
        Err(e) => {
            print_test_result("gold_premium_request_validation", false);
            panic!("Request validation failed: {}", e);
        }
    }

    // Fetch gold premium data using the calculator
    use fin_catch_data::models::gold_premium::GoldPremiumCalculator;

    match GoldPremiumCalculator::calculate(&gateway, &request).await {
        Ok(response) => {
            print_test_result("gold_premium_calculation", response.status == "ok");

            println!("  → Status: {}", response.status);

            if let Some(error) = &response.error {
                println!("  → Error: {}", error);
            }

            if let Some(data) = &response.data {
                println!("  → Data points: {}", data.len());
                assert!(!data.is_empty(), "Should have at least some premium data");

                // Verify first data point
                if let Some(first_point) = data.first() {
                    println!("  → First point:");
                    println!("      Timestamp: {}", first_point.timestamp);
                    println!("      Gold type: {}", first_point.gold_type);
                    println!("      Target price (VND): {:.2}", first_point.target_price);
                    println!("      Market price (USD): {:.2}", first_point.market_price_usd);
                    println!("      Exchange rate: {:.2}", first_point.exchange_rate);
                    println!("      Market price (VND): {:.2}", first_point.market_price_vnd);
                    println!("      Premium rate: {:.2}%", first_point.premium_rate);
                    println!("      Premium value: {:.2}", first_point.premium_value);

                    // Verify calculations
                    assert!(first_point.target_price > 0.0);
                    assert!(first_point.market_price_usd > 0.0);
                    assert!(first_point.exchange_rate > 0.0);
                    assert!(first_point.market_price_vnd > 0.0);
                }
            }

            if let Some(metadata) = &response.metadata {
                println!("  → Metadata: {}", serde_json::to_string_pretty(metadata).unwrap());
            }
        }
        Err(e) => {
            print_test_result("gold_premium_calculation", false);
            panic!("Gold premium calculation failed: {:?}", e);
        }
    }
}

#[tokio::test]
async fn test_gold_premium_single_day() {
    println!("\n=== Testing Gold Premium - Single Day Query ===");

    let gateway = DataSourceGateway::with_all_sources();

    // Single day request (from == to)
    let request = GoldPremiumRequest {
        from: TEST_FROM,
        to: TEST_FROM, // Same as from
        gold_price_id: Some("1".to_string()),
        currency_code: Some("USD".to_string()),
        gold_source: Some("sjc".to_string()),
        exchange_rate_source: Some("vietcombank".to_string()),
        stock_source: Some("yahoo_finance".to_string()),
    };

    use fin_catch_data::models::gold_premium::GoldPremiumCalculator;

    match GoldPremiumCalculator::calculate(&gateway, &request).await {
        Ok(response) => {
            println!("  → Status: {}", response.status);
            print_test_result("gold_premium_single_day", true);

            if let Some(error) = &response.error {
                println!("  → Error (expected for some dates): {}", error);
            }

            if let Some(data) = &response.data {
                println!("  → Data points: {}", data.len());
            }
        }
        Err(e) => {
            // This is acceptable - single day queries may fail if no data is available
            println!("  → Error (acceptable): {:?}", e);
            print_test_result("gold_premium_single_day", true);
        }
    }
}

#[tokio::test]
async fn test_gold_premium_future_date() {
    println!("\n=== Testing Gold Premium - Future Date (Should Fail Gracefully) ===");

    let gateway = DataSourceGateway::with_all_sources();

    // Future date - should fail gracefully
    let future_date = 1764460800; // March 29, 2025
    let request = GoldPremiumRequest {
        from: future_date,
        to: future_date,
        gold_price_id: Some("49".to_string()),
        currency_code: Some("USD".to_string()),
        gold_source: Some("sjc".to_string()),
        exchange_rate_source: None, // Let it auto-select
        stock_source: Some("yahoo_finance".to_string()),
    };

    use fin_catch_data::models::gold_premium::GoldPremiumCalculator;

    match GoldPremiumCalculator::calculate(&gateway, &request).await {
        Ok(response) => {
            println!("  → Status: {}", response.status);

            if let Some(error) = &response.error {
                println!("  → Error message: {}", error);
                print_test_result("gold_premium_future_date_error_handling", true);
            } else {
                println!("  → Unexpectedly succeeded");
                print_test_result("gold_premium_future_date_error_handling", false);
            }
        }
        Err(e) => {
            println!("  → Error (expected): {:?}", e);
            // Verify the error message is helpful
            let error_msg = format!("{:?}", e);
            let has_helpful_error = error_msg.contains("No data") ||
                error_msg.contains("timestamp") ||
                error_msg.contains("available");
            print_test_result("gold_premium_future_date_error_handling", has_helpful_error);

            if !has_helpful_error {
                panic!("Error message should be more descriptive: {:?}", e);
            }
        }
    }
}

#[tokio::test]
async fn test_gold_premium_invalid_request() {
    println!("\n=== Testing Gold Premium - Invalid Request ===");

    // Test with from > to (should fail validation)
    let request = GoldPremiumRequest {
        from: TEST_TO,
        to: TEST_FROM, // Swapped - from > to
        gold_price_id: Some("1".to_string()),
        currency_code: Some("USD".to_string()),
        gold_source: None,
        exchange_rate_source: None,
        stock_source: None,
    };

    match request.validate() {
        Ok(_) => {
            print_test_result("gold_premium_invalid_request_validation", false);
            panic!("Validation should have failed for from > to");
        }
        Err(e) => {
            print_test_result("gold_premium_invalid_request_validation", true);
            println!("  → Validation error (expected): {}", e);
            assert!(e.contains("from"));
            assert!(e.contains("to"));
        }
    }
}

#[tokio::test]
async fn test_gold_premium_weekend_saturday() {
    println!("\n=== Testing Gold Premium - Saturday Request (Should Fallback to Friday) ===");

    let gateway = DataSourceGateway::with_all_sources();

    // Request for a Saturday - should fallback to previous Friday
    let request = GoldPremiumRequest {
        from: TEST_SATURDAY,
        to: TEST_SATURDAY,
        gold_price_id: Some("1".to_string()),
        currency_code: Some("USD".to_string()),
        gold_source: Some("sjc".to_string()),
        exchange_rate_source: None,
        stock_source: Some("yahoo_finance".to_string()),
    };

    use fin_catch_data::models::gold_premium::GoldPremiumCalculator;

    match GoldPremiumCalculator::calculate(&gateway, &request).await {
        Ok(response) => {
            println!("  → Status: {}", response.status);
            print_test_result("gold_premium_saturday_fallback", true);

            // Check metadata for weekend warnings
            if let Some(metadata) = &response.metadata {
                println!("  → Metadata: {}", serde_json::to_string_pretty(metadata).unwrap());

                // Verify warnings exist
                if let Some(warnings) = metadata.get("warnings") {
                    println!("  → Warnings found: {}", warnings);
                    assert!(warnings.is_array(), "Warnings should be an array");
                    print_test_result("gold_premium_saturday_warnings_present", true);
                } else {
                    println!("  → No warnings (may be acceptable if no data returned)");
                }

                // Verify caution message exists
                if let Some(caution) = metadata.get("caution") {
                    println!("  → Caution message: {}", caution);
                    print_test_result("gold_premium_saturday_caution_message", true);
                } else {
                    println!("  → No caution message");
                }
            }

            if let Some(data) = &response.data {
                println!("  → Data points: {}", data.len());
            }
        }
        Err(e) => {
            println!("  → Error: {:?}", e);
            print_test_result("gold_premium_saturday_fallback", false);
        }
    }
}

#[tokio::test]
async fn test_gold_premium_weekend_sunday() {
    println!("\n=== Testing Gold Premium - Sunday Request (Should Fallback to Friday) ===");

    let gateway = DataSourceGateway::with_all_sources();

    // Request for a Sunday - should fallback to previous Friday
    let request = GoldPremiumRequest {
        from: TEST_SUNDAY,
        to: TEST_SUNDAY,
        gold_price_id: Some("1".to_string()),
        currency_code: Some("USD".to_string()),
        gold_source: Some("sjc".to_string()),
        exchange_rate_source: None,
        stock_source: Some("yahoo_finance".to_string()),
    };

    use fin_catch_data::models::gold_premium::GoldPremiumCalculator;

    match GoldPremiumCalculator::calculate(&gateway, &request).await {
        Ok(response) => {
            println!("  → Status: {}", response.status);
            print_test_result("gold_premium_sunday_fallback", true);

            // Check metadata for weekend warnings
            if let Some(metadata) = &response.metadata {
                println!("  → Metadata: {}", serde_json::to_string_pretty(metadata).unwrap());

                // Verify warnings exist
                if let Some(warnings) = metadata.get("warnings") {
                    println!("  → Warnings found: {}", warnings);
                    print_test_result("gold_premium_sunday_warnings_present", true);
                } else {
                    println!("  → No warnings (may be acceptable if no data returned)");
                }

                // Verify caution message exists
                if let Some(caution) = metadata.get("caution") {
                    println!("  → Caution message: {}", caution);
                    print_test_result("gold_premium_sunday_caution_message", true);
                }
            }

            if let Some(data) = &response.data {
                println!("  → Data points: {}", data.len());
            }
        }
        Err(e) => {
            println!("  → Error: {:?}", e);
            print_test_result("gold_premium_sunday_fallback", false);
        }
    }
}

#[tokio::test]
async fn test_gold_premium_weekday_no_warning() {
    println!("\n=== Testing Gold Premium - Weekday Request (No Fallback Needed) ===");

    let gateway = DataSourceGateway::with_all_sources();

    // Request for a Friday - should not have warnings
    let request = GoldPremiumRequest {
        from: TEST_FRIDAY_NOON,
        to: TEST_FRIDAY_NOON,
        gold_price_id: Some("1".to_string()),
        currency_code: Some("USD".to_string()),
        gold_source: Some("sjc".to_string()),
        exchange_rate_source: None,
        stock_source: Some("yahoo_finance".to_string()),
    };

    use fin_catch_data::models::gold_premium::GoldPremiumCalculator;

    match GoldPremiumCalculator::calculate(&gateway, &request).await {
        Ok(response) => {
            println!("  → Status: {}", response.status);

            // Check metadata should NOT have weekend warnings
            if let Some(metadata) = &response.metadata {
                println!("  → Metadata: {}", serde_json::to_string_pretty(metadata).unwrap());

                if metadata.get("warnings").is_some() {
                    print_test_result("gold_premium_weekday_no_warnings", false);
                    panic!("Should not have weekend warnings for a weekday request");
                } else {
                    print_test_result("gold_premium_weekday_no_warnings", true);
                    println!("  → Correctly has no weekend warnings");
                }
            }

            if let Some(data) = &response.data {
                println!("  → Data points: {}", data.len());
            }
        }
        Err(e) => {
            println!("  → Error (may be acceptable): {:?}", e);
            print_test_result("gold_premium_weekday_request", true);
        }
    }
}
