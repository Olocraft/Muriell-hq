//business rules for muriell, no database logic here, just the rules of the business
use sea_orm::{DatabaseConnection, TransactionTrait};
use uuid::Uuid;

use crate::{
    domains::{
        user_stats::repository::UserStatsRepository,
        users::{
            dto::{CreateUserRequest, UserResponse},
            repository::UserRepository,
        },
    },
    errors::AppError,
};

pub struct UserService<'a> {
    db: &'a DatabaseConnection,
}

impl<'a> UserService<'a> {
    pub fn new(db: &'a DatabaseConnection) -> Self {
        Self { db }
    }

    pub async fn create_user(
        &self,
        request: CreateUserRequest,
    ) -> Result<UserResponse, AppError> {
        let email = request.email.trim().to_lowercase();

        if email.is_empty() {
            return Err(AppError::BadRequest(
                "email is required".to_string(),
            ));
        }

        if UserRepository::new(self.db)
            .find_by_email(&email)
            .await
            .map_err(|error| {
                AppError::Internal(format!(
                    "failed to check existing user: {error}"
                ))
            })?
            .is_some()
        {
            return Err(AppError::Conflict(
                "a user with this email already exists".to_string(),
            ));
        }

        let transaction = self.db.begin().await.map_err(|error| {
            AppError::Internal(format!(
                "failed to begin user creation transaction: {error}"
            ))
        })?;

        let user = UserRepository::create(
            &transaction,
            email,
            request.display_name,
            request.photo_url,
        )
        .await
        .map_err(|error| {
            AppError::Internal(format!(
                "failed to create user: {error}"
            ))
        })?;

        UserStatsRepository::create_default(
            &transaction,
            user.id,
        )
        .await
        .map_err(|error| {
            AppError::Internal(format!(
                "failed to initialize user stats: {error}"
            ))
        })?;

        transaction.commit().await.map_err(|error| {
            AppError::Internal(format!(
                "failed to commit user creation transaction: {error}"
            ))
        })?;

        Ok(UserResponse {
            id: user.id,
            email: user.email,
            display_name: user.display_name,
            role: user.role,
            photo_url: user.photo_url,
            routine: user.routine,
        })
    }

    pub async fn get_user(
        &self,
        id: Uuid,
    ) -> Result<Option<UserResponse>, AppError> {
        let user = UserRepository::new(self.db)
            .find_by_id(id)
            .await
            .map_err(|error| {
                AppError::Internal(format!(
                    "failed to fetch user: {error}"
                ))
            })?;

        Ok(user.map(|user| UserResponse {
            id: user.id,
            email: user.email,
            display_name: user.display_name,
            role: user.role,
            photo_url: user.photo_url,
            routine: user.routine,
        }))
    }
}