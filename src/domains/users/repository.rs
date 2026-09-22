//Strictly for database operations, no contracts should be done here(cyril)
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait,
    ColumnTrait,
    ConnectionTrait,
    DatabaseConnection,
    EntityTrait,
    QueryFilter,
    Set,
};
use uuid::Uuid;

use crate::entities::users;

pub struct UserRepository<'a> {
    db: &'a DatabaseConnection,
}

impl<'a> UserRepository<'a> {
    pub fn new(db: &'a DatabaseConnection) -> Self {
        Self { db }
    }

    pub async fn find_by_id(
        &self,
        id: Uuid,
    ) -> Result<Option<users::Model>, sea_orm::DbErr> {
        users::Entity::find_by_id(id)
            .one(self.db)
            .await
    }

    pub async fn find_by_email(
        &self,
        email: &str,
    ) -> Result<Option<users::Model>, sea_orm::DbErr> {
        users::Entity::find()
            .filter(users::Column::Email.eq(email))
            .one(self.db)
            .await
    }

    pub async fn create<C>(
        db: &C,
        email: String,
        display_name: Option<String>,
        photo_url: Option<String>,
    ) -> Result<users::Model, sea_orm::DbErr>
    where
        C: ConnectionTrait,
    {
        let now = Utc::now().fixed_offset();

        let user = users::ActiveModel {
            id: Set(Uuid::new_v4()),
            email: Set(email),
            display_name: Set(display_name),
            photo_url: Set(photo_url),
            created_at: Set(now),
            updated_at: Set(now),
            ..Default::default()
        };

        user.insert(db).await
    }
}