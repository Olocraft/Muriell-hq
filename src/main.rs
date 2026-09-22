mod app;
mod config;
mod database;
mod domains;
mod entities;
mod errors;

use axum::{
    routing::{get, post},
    Router,
};
use config::Settings;
use std::net::SocketAddr;
use tracing::info;

use app::AppState;
use domains::{
    tasks::handler::{
        create_task,
        get_task,
        list_tasks,
    },
    users::handler::{
        create_user,
        get_user,
    },
};

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            std::env::var("RUST_LOG")
                .unwrap_or_else(|_| "info".to_string()),
        )
        .init();

    let settings = Settings::from_env();

    let database = database::connect(&settings).await;

    let state = AppState {
        db: database,
    };

    let app = Router::new()
    .route("/health", get(health))
    .route("/api/users", post(create_user))
    .route("/api/users/{id}", get(get_user))
    .route(
        "/api/users/{user_id}/tasks",
        post(create_task).get(list_tasks),
    )
    .route(
        "/api/users/{user_id}/tasks/{task_id}",
        get(get_task),
    )
    .with_state(state);

    let address = format!("{}:{}", settings.host, settings.port)
        .parse::<SocketAddr>()
        .expect("Invalid server address");

    let listener = tokio::net::TcpListener::bind(address)
        .await
        .expect("Failed to bind server");

    info!("Muriel API listening on {}", address);

    axum::serve(listener, app)
        .await
        .expect("Server failed");
}

async fn health() -> &'static str {
    "ok"
}