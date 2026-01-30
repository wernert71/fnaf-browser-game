use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct GameSession {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub session_type: String,
    pub night_number: Option<i32>,
    pub started_at: DateTime<Utc>,
    pub ended_at: Option<DateTime<Utc>>,
    pub survived: Option<bool>,
    pub final_power: Option<i32>,
    pub time_survived_seconds: Option<i32>,
    pub star_rating: Option<i32>,
    pub score: i32,
    pub death_by: Option<String>,
    pub power_ups_used: serde_json::Value,
    pub pizza_slices_found: i32,
    pub photos_taken: i32,
    pub easy_mode: bool,
    pub custom_difficulty: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSessionRequest {
    pub session_type: String, // 'night', 'freeroam', 'survival', 'multiplayer'
    pub night_number: Option<i32>,
    pub easy_mode: Option<bool>,
    pub custom_difficulty: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSessionRequest {
    pub survived: Option<bool>,
    pub final_power: Option<i32>,
    pub time_survived_seconds: Option<i32>,
    pub star_rating: Option<i32>,
    pub score: Option<i32>,
    pub death_by: Option<String>,
    pub power_ups_used: Option<serde_json::Value>,
    pub pizza_slices_found: Option<i32>,
    pub photos_taken: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct SessionResponse {
    pub id: Uuid,
    pub session_type: String,
    pub night_number: Option<i32>,
    pub started_at: DateTime<Utc>,
}
