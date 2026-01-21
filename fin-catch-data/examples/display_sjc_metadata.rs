/// Display SJC metadata in a pretty format
///
/// Usage:
/// ```
/// cargo run --example display_sjc_metadata
/// ```

use fin_catch_data::sources::{GoldDataSource, SjcSource};

fn main() {
    let source = SjcSource::new();
    let metadata = source.metadata();

    println!("=== SJC Gold Source Metadata ===\n");
    println!("{}", serde_json::to_string_pretty(&metadata).unwrap());
}
