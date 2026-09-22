use chrono::Utc;
use rust_decimal::Decimal;
use sea_orm::{
    ActiveModelTrait,
    ColumnTrait,
    DatabaseConnection,
    EntityTrait,
    QueryFilter,
    QueryOrder,
    Set,
};
use uuid::Uuid;

use crate::entities::tasks;

pub struct TaskRepository<'a> {
    db: &'a DatabaseConnection,
}

impl<'a> TaskRepository<'a> {
    pub fn new(db: &'a DatabaseConnection) -> Self {
        Self { db }
    }

    pub async fn find_by_id(
        &self,
        id: Uuid,
    ) -> Result<Option<tasks::Model>, sea_orm::DbErr> {
        tasks::Entity::find_by_id(id)
            .one(self.db)
            .await
    }

    pub async fn find_by_user_id(
        &self,
        user_id: Uuid,
    ) -> Result<Vec<tasks::Model>, sea_orm::DbErr> {
        tasks::Entity::find()
            .filter(tasks::Column::UserId.eq(user_id))
            .order_by_asc(tasks::Column::Deadline)
            .all(self.db)
            .await
    }

    pub async fn find_by_user_and_status(
        &self,
        user_id: Uuid,
        status: &str,
    ) -> Result<Vec<tasks::Model>, sea_orm::DbErr> {
        tasks::Entity::find()
            .filter(tasks::Column::UserId.eq(user_id))
            .filter(tasks::Column::Status.eq(status))
            .order_by_asc(tasks::Column::Deadline)
            .all(self.db)
            .await
    }

    pub async fn create(
    &self,
    user_id: Uuid,
    title: String,
    description: Option<String>,
    task_type: String,
    stake_amount: Decimal,
    deadline: Option<chrono::DateTime<chrono::FixedOffset>>,
) -> Result<tasks::Model, sea_orm::DbErr> {
    let now = Utc::now().fixed_offset();

    let task = tasks::ActiveModel {
        id: Set(Uuid::new_v4()),
        user_id: Set(user_id),
        title: Set(title),
        description: Set(description),
        r#type: Set(task_type),
        status: Set("pending".to_string()),
        stake_amount: Set(stake_amount),
        deadline: Set(deadline),
        created_at: Set(now),
        updated_at: Set(now),
        ..Default::default()
    };

    task.insert(self.db).await
}
}