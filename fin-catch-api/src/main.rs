mod error;
mod gateway;
mod models;
mod routes;
mod sources;

use crate::{
    gateway::DataSourceGateway,
    routes::{create_router, AppState},
    sources::{MihongSource, SjcSource, SsiSource, VndirectSource, YahooFinanceSource},
};
use std::sync::Arc;
use tower_http::{
    cors::CorsLayer,
    trace::{DefaultMakeSpan, DefaultOnResponse, TraceLayer},
};
use tracing::Level;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() {
    // Initialize tracing/logging
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                "fin_catch_api=debug,tower_http=debug,axum=trace".into()
            }),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("Starting fin-catch-api server...");

    // Initialize the data source gateway
    // Default stock source: vndirect, Default gold source: sjc
    let mut gateway = DataSourceGateway::new("vndirect".to_string(), "sjc".to_string());

    // Register stock data sources
    let vndirect_source = Arc::new(VndirectSource::new());
    gateway.register_stock_source(vndirect_source);
    tracing::info!("Registered stock data source: VNDIRECT");

    let ssi_source = Arc::new(SsiSource::new());
    gateway.register_stock_source(ssi_source);
    tracing::info!("Registered stock data source: SSI");

    let yahoo_finance_source = Arc::new(YahooFinanceSource::new());
    gateway.register_stock_source(yahoo_finance_source);
    tracing::info!("Registered stock data source: Yahoo Finance");

    // Register gold data sources
    let sjc_source = Arc::new(SjcSource::new());
    gateway.register_gold_source(sjc_source);
    tracing::info!("Registered gold data source: SJC");

    let mihong_source = Arc::new(MihongSource::new());
    gateway.register_gold_source(mihong_source);
    tracing::info!("Registered gold data source: MIHONG");

    let gateway = Arc::new(gateway);
    tracing::info!(
        "Data source gateway initialized with {} stock sources and {} gold sources",
        gateway.list_stock_sources().len(),
        gateway.list_gold_sources().len()
    );

    // Create application state
    let state = AppState { gateway };

    // Build the application router with middleware
    let app = create_router(state)
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(DefaultMakeSpan::new().level(Level::INFO))
                .on_response(DefaultOnResponse::new().level(Level::INFO)),
        )
        .layer(CorsLayer::permissive()); // Enable CORS for all origins (adjust for production)

    // Get the port from environment variable or use default
    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "3000".to_string())
        .parse::<u16>()
        .expect("PORT must be a valid number");

    let addr = format!("0.0.0.0:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("Failed to bind to address");

    tracing::info!("Server listening on http://{}", addr);
    tracing::info!("API documentation available at http://{}/", addr);

    // Start the server
    axum::serve(listener, app)
        .await
        .expect("Server failed to start");
}
