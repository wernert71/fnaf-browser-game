use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub last_login: Option<DateTime<Utc>>,
    pub is_active: bool,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct PlayerProfile {
    pub id: Uuid,
    pub user_id: Uuid,
    pub highest_night_completed: i32,
    pub total_nights_survived: i32,
    pub total_deaths: i32,
    pub total_playtime_seconds: i64,
    pub pizza_slices_collected: i32,
    pub photos_taken: i32,
    pub easy_mode_enabled: bool,
    pub unlocked_skins: serde_json::Value,
    pub unlocked_decorations: serde_json::Value,
    pub equipped_decorations: serde_json::Value,
    pub jukebox_songs: serde_json::Value,
    pub audio_volume: f32,
    pub music_volume: f32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserPublic,
}

#[derive(Debug, Serialize)]
pub struct UserPublic {
    pub id: Uuid,
    pub username: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
}

impl From<User> for UserPublic {
    fn from(user: User) -> Self {
        UserPublic {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            avatar_url: user.avatar_url,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct UpdateProfileRequest {
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub easy_mode_enabled: Option<bool>,
    pub audio_volume: Option<f32>,
    pub music_volume: Option<f32>,
    pub equipped_decorations: Option<serde_json::Value>,
}
