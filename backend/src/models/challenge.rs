use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct DailyChallenge {
    pub id: Uuid,
    pub challenge_date: NaiveDate,
    pub challenge_type: String,
    pub parameters: serde_json::Value,
    pub name_key: String,
    pub description_key: String,
    pub reward_points: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct DailyChallengeCompletion {
    pub id: Uuid,
    pub user_id: Uuid,
    pub challenge_id: Uuid,
    pub completed_at: DateTime<Utc>,
    pub score: Option<i32>,
    pub time_seconds: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct ChallengeResponse {
    pub challenge: DailyChallenge,
    pub completed: bool,
    pub completion: Option<DailyChallengeCompletion>,
}

#[derive(Debug, Deserialize)]
pub struct CompleteChallengeRequest {
    pub score: Option<i32>,
    pub time_seconds: Option<i32>,
    pub session_id: Option<Uuid>,
}

// Challenge types
pub const CHALLENGE_TYPES: &[&str] = &[
    "power_limit",      // Survive with limited starting power
    "no_cameras",       // Survive without using cameras
    "no_left_door",     // Survive without left door
    "no_right_door",    // Survive without right door
    "speed_run",        // Complete night in target time
    "specific_night",   // Complete a specific night
    "collect_pizza",    // Find X pizza slices in free roam
    "photo_challenge",  // Take photos of specific animatronics
];
