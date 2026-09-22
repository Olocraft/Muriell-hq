use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use tracing::error;

#[derive(Debug)]
pub enum AppError {
    BadRequest(String),
    NotFound(String),
    Conflict(String),
    Internal(String),
}

#[derive(Debug, Serialize)]
struct ErrorBody {
    success: bool,
    error: ErrorDetails,
}

#[derive(Debug, Serialize)]
struct ErrorDetails {
    code: &'static str,
    message: String,
}

impl AppError {
    fn response_parts(&self) -> (StatusCode, &'static str, String) {
        match self {
            Self::BadRequest(message) => (
                StatusCode::BAD_REQUEST,
                "BAD_REQUEST",
                message.clone(),
            ),

            Self::NotFound(message) => (
                StatusCode::NOT_FOUND,
                "NOT_FOUND",
                message.clone(),
            ),

            Self::Conflict(message) => (
                StatusCode::CONFLICT,
                "CONFLICT",
                message.clone(),
            ),

            Self::Internal(message) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "INTERNAL_SERVER_ERROR",
                message.clone(),
            ),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code, message) = self.response_parts();

        if status.is_server_error() {
            error!(
                code = code,
                message = %message,
                "application error"
            );
        }

        (
            status,
            Json(ErrorBody {
                success: false,
                error: ErrorDetails {
                    code,
                    message,
                },
            }),
        )
            .into_response()
    }
}