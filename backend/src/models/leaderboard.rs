use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct LeaderboardEntry {
    pub id: Uuid,
    pub user_id: Uuid,
    pub username: String,
    pub leaderboard_type: String,
    pub score: i64,
    pub additional_data: Option<serde_json::Value>,
    pub achieved_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct LeaderboardEntryWithRank {
    pub rank: i64,
    pub user_id: Uuid,
    pub username: String,
    pub score: i64,
    pub additional_data: Option<serde_json::Value>,
    pub achieved_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct LeaderboardResponse {
    pub leaderboard_type: String,
    pub entries: Vec<LeaderboardEntryWithRank>,
    pub page: i32,
    pub total_pages: i32,
    pub total_entries: i64,
}

#[derive(Debug, Deserialize)]
pub struct LeaderboardQuery {
    pub page: Option<i32>,
    pub limit: Option<i32>,
    pub timeframe: Option<String>, // 'daily', 'weekly', 'monthly', 'all'
}

#[derive(Debug, Serialize)]
pub struct MyRankResponse {
    pub rank: Option<i64>,
    pub score: Option<i64>,
    pub total_players: i64,
}

// Leaderboard types
pub const LEADERBOARD_TYPES: &[&str] = &[
    "night_1",
    "night_2",
    "night_3",
    "night_4",
    "night_5",
    "night_6",
    "night_7",
    "survival",
    "speed_run",
    "photos",
    "pizza_collection",
];
