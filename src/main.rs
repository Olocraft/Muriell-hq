use axum::{routing::get, Router};
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/health", get(health));

    let address = SocketAddr::from(([127, 0, 0, 1], 3000));

    println!("Muriel API running on http://{}", address);

    let listener = tokio::net::TcpListener::bind(address)
        .await
        .expect("failed to bind server");

    axum::serve(listener, app)
        .await
        .expect("server failed");
}

async fn health() -> &'static str {
    "ok"
}