use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

use crate::{
    app::AppState,
    domains::users::{
        dto::CreateUserRequest,
        service::UserService,
    },
    errors::AppError,
};

pub async fn create_user(
    State(state): State<AppState>,
    Json(request): Json<CreateUserRequest>,
) -> Result<(StatusCode, Json<serde_json::Value>), AppError> {
    let service = UserService::new(&state.db);

    let user = service.create_user(request).await?;

    Ok((
        StatusCode::CREATED,
        Json(serde_json::json!({
            "success": true,
            "data": user
        })),
    ))
}

pub async fn get_user(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let service = UserService::new(&state.db);

    let user = service
        .get_user(id)
        .await?
        .ok_or_else(|| {
            AppError::NotFound("user not found".to_string())
        })?;

    Ok(Json(serde_json::json!({
        "success": true,
        "data": user
    })))
}