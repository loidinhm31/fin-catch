mod error;
mod gateway;
mod models;
mod routes;
mod sources;

use crate::{
    gateway::DataSourceGateway,
    routes::{create_router, AppState},
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
                "fin_catch_data=debug,tower_http=debug,axum=trace".into()
            }),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("Starting fin-catch-data server...");

    // Initialize the data source gateway with all default sources
    let gateway = Arc::new(DataSourceGateway::with_all_sources());

    tracing::info!(
        "Data source gateway initialized with {} stock sources, {} gold sources, and {} exchange rate sources",
        gateway.list_stock_sources().len(),
        gateway.list_gold_sources().len(),
        gateway.list_exchange_rate_sources().len()
    );
    tracing::info!("Stock sources: {:?}", gateway.list_stock_sources());
    tracing::info!("Gold sources: {:?}", gateway.list_gold_sources());
    tracing::info!("Exchange rate sources: {:?}", gateway.list_exchange_rate_sources());

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
