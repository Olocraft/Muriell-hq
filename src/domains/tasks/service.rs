use chrono::Utc;
use rust_decimal::Decimal;
use sea_orm::DatabaseConnection;
use uuid::Uuid;

use crate::{
    domains::tasks::{
        dto::{CreateTaskRequest, TaskResponse},
        repository::TaskRepository,
    },
    errors::AppError,
};

pub struct TaskService<'a> {
    repository: TaskRepository<'a>,
}

impl<'a> TaskService<'a> {
    pub fn new(db: &'a DatabaseConnection) -> Self {
        Self {
            repository: TaskRepository::new(db),
        }
    }

    pub async fn create_task(
        &self,
        user_id: Uuid,
        request: CreateTaskRequest,
    ) -> Result<TaskResponse, AppError> {
        let title = request.title.trim().to_string();

        if title.is_empty() {
            return Err(AppError::BadRequest(
                "task title is required".to_string(),
            ));
        }

        let task_type = request.task_type.trim().to_lowercase();

        if !matches!(
            task_type.as_str(),
            "focus" | "habit" | "discipline"
        ) {
            return Err(AppError::BadRequest(
                "task type must be focus, habit, or discipline"
                    .to_string(),
            ));
        }

        let stake_amount = request
            .stake_amount
            .unwrap_or_else(|| Decimal::ZERO);

        if stake_amount < Decimal::ZERO {
            return Err(AppError::BadRequest(
                "stake amount cannot be negative".to_string(),
            ));
        }

        if let Some(deadline) = request.deadline {
            if deadline <= Utc::now().fixed_offset() {
                return Err(AppError::BadRequest(
                    "deadline must be in the future".to_string(),
                ));
            }
        }

        let task = self
            .repository
            .create(
                user_id,
                title,
                request.description,
                task_type,
                stake_amount,
                request.deadline,
            )
            .await
            .map_err(|error| {
                AppError::Internal(format!(
                    "failed to create task: {error}"
                ))
            })?;

        Ok(Self::to_response(task))
    }

    pub async fn get_task(
        &self,
        user_id: Uuid,
        task_id: Uuid,
    ) -> Result<Option<TaskResponse>, AppError> {
        let task = self
            .repository
            .find_by_id(task_id)
            .await
            .map_err(|error| {
                AppError::Internal(format!(
                    "failed to fetch task: {error}"
                ))
            })?;

        let task = match task {
            Some(task) => task,
            None => return Ok(None),
        };

        // A user must never be able to access another user's task.
        if task.user_id != user_id {
            return Ok(None);
        }

        Ok(Some(Self::to_response(task)))
    }

    pub async fn list_tasks(
        &self,
        user_id: Uuid,
    ) -> Result<Vec<TaskResponse>, AppError> {
        let tasks = self
            .repository
            .find_by_user_id(user_id)
            .await
            .map_err(|error| {
                AppError::Internal(format!(
                    "failed to fetch user tasks: {error}"
                ))
            })?;

        Ok(tasks
            .into_iter()
            .map(Self::to_response)
            .collect())
    }

    fn to_response(task: crate::entities::tasks::Model) -> TaskResponse {
        TaskResponse {
            id: task.id,
            user_id: task.user_id,
            title: task.title,
            description: task.description,
            task_type: task.r#type,
            status: task.status,
            stake_amount: task.stake_amount,
            deadline: task.deadline,
            outcome: task.outcome,
            completed_at: task.completed_at,
            created_at: task.created_at,
            updated_at: task.updated_at,
        }
    }
}