use sea_orm::DatabaseConnection;
use uuid::Uuid;

use crate::{
    domains::user_stats::{
        dto::UserStatsResponse,
        repository::UserStatsRepository,
    },
    errors::AppError,
};

pub struct UserStatsService<'a> {
    repository: UserStatsRepository<'a>,
}

impl<'a> UserStatsService<'a> {
    pub fn new(db: &'a DatabaseConnection) -> Self {
        Self {
            repository: UserStatsRepository::new(db),
        }
    }

    pub async fn get_stats(
        &self,
        user_id: Uuid,
    ) -> Result<Option<UserStatsResponse>, AppError> {
        let stats = self
            .repository
            .find_by_user_id(user_id)
            .await
            .map_err(|error| {
                AppError::Internal(format!(
                    "failed to fetch user stats: {error}"
                ))
            })?;

        Ok(stats.map(|stats| UserStatsResponse {
            user_id: stats.user_id,
            xp: stats.xp,
            level: stats.level,
            streak: stats.streak,
            rage_meter: stats.rage_meter,
            shame_points: stats.shame_points,
            discipline_score: stats.discipline_score,
            consistency_score: stats.consistency_score,
            roast_intensity: stats.roast_intensity,
        }))
    }
}