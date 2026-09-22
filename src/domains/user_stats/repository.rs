//Strictly for database operations, no contracts should be done here(cyril)
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait,
    ConnectionTrait,
    DatabaseConnection,
    EntityTrait,
    Set,
};
use uuid::Uuid;

use crate::entities::user_stats;

pub struct UserStatsRepository<'a> {
    db: &'a DatabaseConnection,
}

impl<'a> UserStatsRepository<'a> {
    pub fn new(db: &'a DatabaseConnection) -> Self {
        Self { db }
    }

    pub async fn find_by_user_id(
        &self,
        user_id: Uuid,
    ) -> Result<Option<user_stats::Model>, sea_orm::DbErr> {
        user_stats::Entity::find_by_id(user_id)
            .one(self.db)
            .await
    }

    pub async fn create_default<C>(
        db: &C,
        user_id: Uuid,
    ) -> Result<user_stats::Model, sea_orm::DbErr>
    where
        C: ConnectionTrait,
    {
        let now = Utc::now().fixed_offset();

        let stats = user_stats::ActiveModel {
            user_id: Set(user_id),
            xp: Set(0),
            level: Set(1),
            streak: Set(0),
            rage_meter: Set(0),
            shame_points: Set(0),
            discipline_score: Set(0.into()),
            consistency_score: Set(0.into()),
            roast_intensity: Set("standard".to_string()),
            updated_at: Set(now),
        };

        stats.insert(db).await
    }
}