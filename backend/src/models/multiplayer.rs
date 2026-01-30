use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct MultiplayerRoom {
    pub id: Uuid,
    pub room_code: String,
    pub host_user_id: Option<Uuid>,
    pub game_mode: String,
    pub max_players: i32,
    pub current_players: i32,
    pub status: String,
    pub settings: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub started_at: Option<DateTime<Utc>>,
    pub ended_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct MultiplayerParticipant {
    pub id: Uuid,
    pub room_id: Uuid,
    pub user_id: Option<Uuid>,
    pub guest_name: Option<String>,
    pub role: Option<String>,
    pub joined_at: DateTime<Utc>,
    pub is_ready: bool,
}

#[derive(Debug, Deserialize)]
pub struct CreateRoomRequest {
    pub game_mode: String,
    pub max_players: Option<i32>,
    pub settings: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct JoinRoomRequest {
    pub guest_name: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct RoomResponse {
    pub room: MultiplayerRoom,
    pub participants: Vec<ParticipantInfo>,
}

#[derive(Debug, Serialize)]
pub struct ParticipantInfo {
    pub id: Uuid,
    pub username: Option<String>,
    pub guest_name: Option<String>,
    pub role: Option<String>,
    pub is_ready: bool,
}

// WebSocket message types
#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ClientMessage {
    Ready,
    RoleSelect { role: String },
    GameAction { action: GameAction },
    Chat { message: String },
    Ping,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GameAction {
    pub action_type: String,
    pub data: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ServerMessage {
    RoomState { room: RoomResponse },
    GameState { state: serde_json::Value },
    PlayerJoined { participant: ParticipantInfo },
    PlayerLeft { participant_id: Uuid },
    GameStart,
    GameEnd { result: serde_json::Value },
    Chat { from: String, message: String },
    Error { message: String },
    Pong,
}
