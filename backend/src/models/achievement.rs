use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Achievement {
    pub id: String,
    pub name_key: String,
    pub description_key: String,
    pub icon: String,
    pub category: String,
    pub points: i32,
    pub is_secret: bool,
    pub requirements: serde_json::Value,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct PlayerAchievement {
    pub id: Uuid,
    pub user_id: Uuid,
    pub achievement_id: String,
    pub unlocked_at: DateTime<Utc>,
    pub progress: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct AchievementWithStatus {
    pub id: String,
    pub name_key: String,
    pub description_key: String,
    pub icon: String,
    pub category: String,
    pub points: i32,
    pub is_secret: bool,
    pub unlocked: bool,
    pub unlocked_at: Option<DateTime<Utc>>,
    pub progress: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct AchievementListResponse {
    pub achievements: Vec<AchievementWithStatus>,
    pub total_points: i32,
    pub unlocked_count: i32,
}
