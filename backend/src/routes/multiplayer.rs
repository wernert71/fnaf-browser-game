use axum::{
    extract::{Path, State},
    Json,
};
use chrono::Utc;
use rand::Rng;
use uuid::Uuid;

use crate::{error::AppError, models::*, routes::auth::Claims, AppState};

pub async fn create_room(
    State(state): State<AppState>,
    claims: Claims,
    Json(req): Json<CreateRoomRequest>,
) -> Result<Json<RoomResponse>, AppError> {
    let room_id = Uuid::new_v4();
    let room_code = generate_room_code();
    let now = Utc::now();

    sqlx::query!(
        r#"
        INSERT INTO multiplayer_rooms (id, room_code, host_user_id, game_mode, max_players, settings, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        "#,
        room_id,
        room_code,
        claims.sub,
        req.game_mode,
        req.max_players.unwrap_or(2),
        req.settings,
        now
    )
    .execute(&state.db)
    .await?;

    // Add host as participant
    let participant_id = Uuid::new_v4();
    sqlx::query!(
        r#"
        INSERT INTO multiplayer_participants (id, room_id, user_id, joined_at)
        VALUES ($1, $2, $3, $4)
        "#,
        participant_id,
        room_id,
        claims.sub,
        now
    )
    .execute(&state.db)
    .await?;

    // Get user info
    let user = sqlx::query!(
        "SELECT username FROM users WHERE id = $1",
        claims.sub
    )
    .fetch_one(&state.db)
    .await?;

    let room = MultiplayerRoom {
        id: room_id,
        room_code: room_code.clone(),
        host_user_id: Some(claims.sub),
        game_mode: req.game_mode,
        max_players: req.max_players.unwrap_or(2),
        current_players: 1,
        status: "waiting".to_string(),
        settings: req.settings,
        created_at: now,
        started_at: None,
        ended_at: None,
    };

    Ok(Json(RoomResponse {
        room,
        participants: vec![ParticipantInfo {
            id: participant_id,
            username: Some(user.username),
            guest_name: None,
            role: None,
            is_ready: false,
        }],
    }))
}

pub async fn get_room(
    State(state): State<AppState>,
    Path(room_code): Path<String>,
) -> Result<Json<RoomResponse>, AppError> {
    let room = sqlx::query_as!(
        MultiplayerRoom,
        "SELECT * FROM multiplayer_rooms WHERE room_code = $1",
        room_code
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Room not found".to_string()))?;

    let participants = get_room_participants(&state, room.id).await?;

    Ok(Json(RoomResponse { room, participants }))
}

pub async fn join_room(
    State(state): State<AppState>,
    claims: Option<Claims>,
    Path(room_code): Path<String>,
    Json(req): Json<JoinRoomRequest>,
) -> Result<Json<RoomResponse>, AppError> {
    let room = sqlx::query_as!(
        MultiplayerRoom,
        "SELECT * FROM multiplayer_rooms WHERE room_code = $1",
        room_code
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Room not found".to_string()))?;

    if room.status != "waiting" {
        return Err(AppError::BadRequest("Game already started".to_string()));
    }

    if room.current_players >= room.max_players {
        return Err(AppError::BadRequest("Room is full".to_string()));
    }

    let now = Utc::now();
    let participant_id = Uuid::new_v4();

    let (user_id, username, guest_name) = if let Some(ref claims) = claims {
        let user = sqlx::query!(
            "SELECT username FROM users WHERE id = $1",
            claims.sub
        )
        .fetch_one(&state.db)
        .await?;
        (Some(claims.sub), Some(user.username), None)
    } else {
        (None, None, req.guest_name.clone())
    };

    // Check if user already in room
    if let Some(uid) = user_id {
        let existing = sqlx::query!(
            "SELECT id FROM multiplayer_participants WHERE room_id = $1 AND user_id = $2",
            room.id,
            uid
        )
        .fetch_optional(&state.db)
        .await?;

        if existing.is_some() {
            return get_room(State(state), Path(room_code)).await;
        }
    }

    sqlx::query!(
        r#"
        INSERT INTO multiplayer_participants (id, room_id, user_id, guest_name, joined_at)
        VALUES ($1, $2, $3, $4, $5)
        "#,
        participant_id,
        room.id,
        user_id,
        guest_name,
        now
    )
    .execute(&state.db)
    .await?;

    // Update player count
    sqlx::query!(
        "UPDATE multiplayer_rooms SET current_players = current_players + 1 WHERE id = $1",
        room.id
    )
    .execute(&state.db)
    .await?;

    get_room(State(state), Path(room_code)).await
}

async fn get_room_participants(
    state: &AppState,
    room_id: Uuid,
) -> Result<Vec<ParticipantInfo>, AppError> {
    let participants = sqlx::query!(
        r#"
        SELECT
            mp.id, mp.user_id, mp.guest_name, mp.role, mp.is_ready,
            u.username
        FROM multiplayer_participants mp
        LEFT JOIN users u ON mp.user_id = u.id
        WHERE mp.room_id = $1
        "#,
        room_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(participants
        .into_iter()
        .map(|p| ParticipantInfo {
            id: p.id,
            username: p.username,
            guest_name: p.guest_name,
            role: p.role,
            is_ready: p.is_ready,
        })
        .collect())
}

fn generate_room_code() -> String {
    const CHARS: &[u8] = b"ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let mut rng = rand::thread_rng();
    (0..6)
        .map(|_| CHARS[rng.gen_range(0..CHARS.len())] as char)
        .collect()
}
