use chrono::{DateTime, FixedOffset};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateTaskRequest {
    pub title: String,
    pub description: Option<String>,
    #[serde(rename = "type")]
    pub task_type: String,
    pub stake_amount: Option<Decimal>,
    pub deadline: Option<DateTime<FixedOffset>>,
}

#[derive(Debug, Serialize)]
pub struct TaskResponse {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    #[serde(rename = "type")]
    pub task_type: String,
    pub status: String,
    pub stake_amount: Decimal,
    pub deadline: Option<DateTime<FixedOffset>>,
    pub outcome: Option<String>,
    pub completed_at: Option<DateTime<FixedOffset>>,
    pub created_at: DateTime<FixedOffset>,
    pub updated_at: DateTime<FixedOffset>,
}