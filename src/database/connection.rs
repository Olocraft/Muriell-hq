use sea_orm::{Database, DatabaseConnection};

use crate::config::Settings;

pub async fn connect(settings: &Settings) -> DatabaseConnection {
    Database::connect(&settings.database_url)
        .await
        .expect("Failed to connect to PostgreSQL")
}