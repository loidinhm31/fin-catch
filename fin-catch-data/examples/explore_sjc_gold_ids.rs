/// Exploration tool to discover available SJC gold price IDs
///
/// This program queries the SJC API with different gold_price_id values
/// to discover what gold types are available and document them.
///
/// Usage:
/// ```
/// cargo run --example explore_sjc_gold_ids
/// ```

use fin_catch_data::{
    models::GoldPriceRequest,
    sources::{GoldDataSource, SjcSource},
};
use chrono::{Duration, Utc};

#[tokio::main]
async fn main() {
    println!("=== SJC Gold Price ID Explorer ===\n");
    println!("Exploring SJC API to discover available gold price IDs...\n");

    let source = SjcSource::new();

    // Use a recent date range for testing (last 7 days)
    let now = Utc::now();
    let to = now.timestamp();
    let from = (now - Duration::days(7)).timestamp();

    println!("Date range: {} to {}",
        chrono::DateTime::<Utc>::from_timestamp(from, 0)
            .unwrap()
            .format("%Y-%m-%d"),
        chrono::DateTime::<Utc>::from_timestamp(to, 0)
            .unwrap()
            .format("%Y-%m-%d")
    );
    println!();

    // Test a range of IDs
    // Based on the current implementation, we know IDs 1, 2, 49 exist
    // Let's explore a wider range to find more
    let test_ids = vec![
        "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
        "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
        "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
        "31", "32", "33", "34", "35", "36", "37", "38", "39", "40",
        "41", "42", "43", "44", "45", "46", "47", "48", "49", "50",
        "51", "52", "53", "54", "55", "56", "57", "58", "59", "60",
    ];

    let mut found_ids = Vec::new();

    for gold_price_id in test_ids {
        let request = GoldPriceRequest {
            gold_price_id: gold_price_id.to_string(),
            from,
            to,
            source: Some("sjc".to_string()),
        };

        print!("Testing ID {:<3} ... ", gold_price_id);

        match source.fetch_history(&request).await {
            Ok(response) => {
                if response.status == "ok" {
                    if let Some(data) = &response.data {
                        if !data.is_empty() {
                            println!("✓ FOUND ({} data points)", data.len());

                            // Collect unique type names
                            let mut type_names: Vec<String> = data
                                .iter()
                                .map(|p| p.type_name.clone())
                                .collect();
                            type_names.sort();
                            type_names.dedup();

                            // Collect unique branch names
                            let mut branch_names: Vec<String> = data
                                .iter()
                                .filter_map(|p| p.branch_name.clone())
                                .collect();
                            branch_names.sort();
                            branch_names.dedup();

                            found_ids.push((
                                gold_price_id.to_string(),
                                type_names.clone(),
                                branch_names.clone(),
                                data.len(),
                            ));

                            println!("    Types: {}", type_names.join(", "));
                            if !branch_names.is_empty() {
                                println!("    Branches: {}", branch_names.join(", "));
                            }

                            // Show sample price
                            if let Some(first) = data.first() {
                                println!("    Sample: Buy={:.0} VND, Sell={:.0} VND",
                                    first.buy, first.sell);
                            }
                            println!();
                        } else {
                            println!("✗ Empty data");
                        }
                    } else {
                        println!("✗ No data field");
                    }
                } else {
                    println!("✗ Status not OK: {}", response.status);
                }
            }
            Err(e) => {
                println!("✗ Error: {}", e);
            }
        }

        // Small delay to avoid overwhelming the API
        tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
    }

    // Summary
    println!("\n=== SUMMARY ===");
    println!("Found {} valid gold price IDs:", found_ids.len());
    println!();

    for (id, types, branches, count) in found_ids {
        println!("ID {}: {} data points", id, count);
        println!("  Gold Types:");
        for type_name in types {
            println!("    - {}", type_name);
        }
        if !branches.is_empty() {
            println!("  Locations/Branches:");
            for branch in branches {
                println!("    - {}", branch);
            }
        }
        println!();
    }

    println!("Exploration complete!");
    println!("\nNOTE: Update the metadata() method in src/sources/sjc.rs with the discovered IDs.");
}
