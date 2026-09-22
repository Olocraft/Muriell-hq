//what our Api accepts and returns, cyril avoid this file
use rust_decimal::Decimal;
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct UserStatsResponse {
    pub user_id: Uuid,
    pub xp: i32,
    pub level: i32,
    pub streak: i32,
    pub rage_meter: i32,
    pub shame_points: i32,
    pub discipline_score: Decimal,
    pub consistency_score: Decimal,
    pub roast_intensity: String,
}