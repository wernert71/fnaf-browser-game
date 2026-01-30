use axum::{
    extract::{Path, State},
    Json,
};
use chrono::Utc;
use uuid::Uuid;

use crate::{error::AppError, models::*, routes::auth::Claims, AppState};

pub async fn get_profile(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<Json<PlayerProfile>, AppError> {
    let profile = sqlx::query_as!(
        PlayerProfile,
        r#"SELECT * FROM player_profiles WHERE user_id = $1"#,
        claims.sub
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Profile not found".to_string()))?;

    Ok(Json(profile))
}

pub async fn update_profile(
    State(state): State<AppState>,
    claims: Claims,
    Json(req): Json<UpdateProfileRequest>,
) -> Result<Json<PlayerProfile>, AppError> {
    // Update user if display_name or avatar provided
    if req.display_name.is_some() || req.avatar_url.is_some() {
        sqlx::query!(
            r#"
            UPDATE users
            SET display_name = COALESCE($1, display_name),
                avatar_url = COALESCE($2, avatar_url),
                updated_at = $3
            WHERE id = $4
            "#,
            req.display_name,
            req.avatar_url,
            Utc::now(),
            claims.sub
        )
        .execute(&state.db)
        .await?;
    }

    // Update profile
    sqlx::query!(
        r#"
        UPDATE player_profiles
        SET easy_mode_enabled = COALESCE($1, easy_mode_enabled),
            audio_volume = COALESCE($2, audio_volume),
            music_volume = COALESCE($3, music_volume),
            equipped_decorations = COALESCE($4, equipped_decorations),
            updated_at = $5
        WHERE user_id = $6
        "#,
        req.easy_mode_enabled,
        req.audio_volume,
        req.music_volume,
        req.equipped_decorations,
        Utc::now(),
        claims.sub
    )
    .execute(&state.db)
    .await?;

    get_profile(State(state), claims).await
}

pub async fn get_public_profile(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let user = sqlx::query_as!(
        User,
        "SELECT * FROM users WHERE id = $1 AND is_active = true",
        user_id
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    let profile = sqlx::query_as!(
        PlayerProfile,
        "SELECT * FROM player_profiles WHERE user_id = $1",
        user_id
    )
    .fetch_optional(&state.db)
    .await?;

    // Return limited public info
    Ok(Json(serde_json::json!({
        "user": {
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name,
            "avatar_url": user.avatar_url,
        },
        "stats": profile.map(|p| serde_json::json!({
            "highest_night_completed": p.highest_night_completed,
            "total_nights_survived": p.total_nights_survived,
            "pizza_slices_collected": p.pizza_slices_collected,
            "photos_taken": p.photos_taken,
        }))
    })))
}

pub async fn create_session(
    State(state): State<AppState>,
    claims: Claims,
    Json(req): Json<CreateSessionRequest>,
) -> Result<Json<SessionResponse>, AppError> {
    let session_id = Uuid::new_v4();
    let now = Utc::now();

    sqlx::query!(
        r#"
        INSERT INTO game_sessions (id, user_id, session_type, night_number, started_at, easy_mode, custom_difficulty)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        "#,
        session_id,
        claims.sub,
        req.session_type,
        req.night_number,
        now,
        req.easy_mode.unwrap_or(false),
        req.custom_difficulty,
    )
    .execute(&state.db)
    .await?;

    Ok(Json(SessionResponse {
        id: session_id,
        session_type: req.session_type,
        night_number: req.night_number,
        started_at: now,
    }))
}

pub async fn update_session(
    State(state): State<AppState>,
    claims: Claims,
    Path(session_id): Path<Uuid>,
    Json(req): Json<UpdateSessionRequest>,
) -> Result<Json<GameSession>, AppError> {
    let now = Utc::now();

    // Verify session belongs to user
    let session = sqlx::query_as!(
        GameSession,
        "SELECT * FROM game_sessions WHERE id = $1 AND user_id = $2",
        session_id,
        claims.sub
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Session not found".to_string()))?;

    // Update session
    sqlx::query!(
        r#"
        UPDATE game_sessions
        SET ended_at = $1,
            survived = COALESCE($2, survived),
            final_power = COALESCE($3, final_power),
            time_survived_seconds = COALESCE($4, time_survived_seconds),
            star_rating = COALESCE($5, star_rating),
            score = COALESCE($6, score),
            death_by = COALESCE($7, death_by),
            power_ups_used = COALESCE($8, power_ups_used),
            pizza_slices_found = COALESCE($9, pizza_slices_found),
            photos_taken = COALESCE($10, photos_taken)
        WHERE id = $11
        "#,
        now,
        req.survived,
        req.final_power,
        req.time_survived_seconds,
        req.star_rating,
        req.score,
        req.death_by,
        req.power_ups_used,
        req.pizza_slices_found,
        req.photos_taken,
        session_id
    )
    .execute(&state.db)
    .await?;

    // Update player profile stats
    if let Some(survived) = req.survived {
        if survived {
            sqlx::query!(
                r#"
                UPDATE player_profiles
                SET total_nights_survived = total_nights_survived + 1,
                    highest_night_completed = GREATEST(highest_night_completed, $1),
                    total_playtime_seconds = total_playtime_seconds + COALESCE($2, 0),
                    pizza_slices_collected = pizza_slices_collected + COALESCE($3, 0),
                    photos_taken = photos_taken + COALESCE($4, 0),
                    updated_at = $5
                WHERE user_id = $6
                "#,
                session.night_number.unwrap_or(0),
                req.time_survived_seconds.map(|t| t as i64),
                req.pizza_slices_found,
                req.photos_taken,
                now,
                claims.sub
            )
            .execute(&state.db)
            .await?;
        } else {
            sqlx::query!(
                r#"
                UPDATE player_profiles
                SET total_deaths = total_deaths + 1,
                    total_playtime_seconds = total_playtime_seconds + COALESCE($1, 0),
                    updated_at = $2
                WHERE user_id = $3
                "#,
                req.time_survived_seconds.map(|t| t as i64),
                now,
                claims.sub
            )
            .execute(&state.db)
            .await?;
        }
    }

    // Return updated session
    let updated = sqlx::query_as!(
        GameSession,
        "SELECT * FROM game_sessions WHERE id = $1",
        session_id
    )
    .fetch_one(&state.db)
    .await?;

    Ok(Json(updated))
}
