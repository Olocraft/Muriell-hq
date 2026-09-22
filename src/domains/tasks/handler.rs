use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

use crate::{
    app::AppState,
    domains::tasks::{
        dto::CreateTaskRequest,
        service::TaskService,
    },
    errors::AppError,
};

pub async fn create_task(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
    Json(request): Json<CreateTaskRequest>,
) -> Result<(StatusCode, Json<serde_json::Value>), AppError> {
    let service = TaskService::new(&state.db);

    let task = service.create_task(user_id, request).await?;

    Ok((
        StatusCode::CREATED,
        Json(serde_json::json!({
            "success": true,
            "data": task
        })),
    ))
}

pub async fn get_task(
    State(state): State<AppState>,
    Path((user_id, task_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>, AppError> {
    let service = TaskService::new(&state.db);

    let task = service
        .get_task(user_id, task_id)
        .await?
        .ok_or_else(|| AppError::NotFound("task not found".to_string()))?;

    Ok(Json(serde_json::json!({
        "success": true,
        "data": task
    })))
}

pub async fn list_tasks(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let service = TaskService::new(&state.db);

    let tasks = service.list_tasks(user_id).await?;

    Ok(Json(serde_json::json!({
        "success": true,
        "data": tasks
    })))
}