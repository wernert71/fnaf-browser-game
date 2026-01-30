use axum::{
    extract::{Path, State},
    Json,
};
use chrono::Utc;
use uuid::Uuid;

use crate::{error::AppError, models::*, routes::auth::Claims, AppState};

pub async fn list_all(
    State(state): State<AppState>,
) -> Result<Json<Vec<Achievement>>, AppError> {
    let achievements = sqlx::query_as!(
        Achievement,
        "SELECT * FROM achievements ORDER BY category, points"
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(achievements))
}

pub async fn get_mine(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<Json<AchievementListResponse>, AppError> {
    // Get all achievements with user's unlock status
    let achievements = sqlx::query!(
        r#"
        SELECT
            a.id, a.name_key, a.description_key, a.icon, a.category, a.points, a.is_secret, a.requirements,
            pa.unlocked_at, pa.progress
        FROM achievements a
        LEFT JOIN player_achievements pa ON a.id = pa.achievement_id AND pa.user_id = $1
        ORDER BY a.category, a.points
        "#,
        claims.sub
    )
    .fetch_all(&state.db)
    .await?;

    let mut total_points = 0;
    let mut unlocked_count = 0;

    let achievements_with_status: Vec<AchievementWithStatus> = achievements
        .into_iter()
        .map(|row| {
            let unlocked = row.unlocked_at.is_some();
            if unlocked {
                total_points += row.points;
                unlocked_count += 1;
            }

            AchievementWithStatus {
                id: row.id,
                name_key: row.name_key,
                description_key: row.description_key,
                icon: row.icon,
                category: row.category,
                points: row.points,
                is_secret: row.is_secret,
                unlocked,
                unlocked_at: row.unlocked_at,
                progress: row.progress,
            }
        })
        .collect();

    Ok(Json(AchievementListResponse {
        achievements: achievements_with_status,
        total_points,
        unlocked_count,
    }))
}

pub async fn claim(
    State(state): State<AppState>,
    claims: Claims,
    Path(achievement_id): Path<String>,
) -> Result<Json<PlayerAchievement>, AppError> {
    // Check if achievement exists
    let achievement = sqlx::query_as!(
        Achievement,
        "SELECT * FROM achievements WHERE id = $1",
        achievement_id
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Achievement not found".to_string()))?;

    // Check if already unlocked
    let existing = sqlx::query_as!(
        PlayerAchievement,
        "SELECT * FROM player_achievements WHERE user_id = $1 AND achievement_id = $2",
        claims.sub,
        achievement_id
    )
    .fetch_optional(&state.db)
    .await?;

    if let Some(pa) = existing {
        return Ok(Json(pa));
    }

    // TODO: Validate requirements based on player profile
    // For now, just grant it

    let player_achievement_id = Uuid::new_v4();
    let now = Utc::now();

    sqlx::query!(
        r#"
        INSERT INTO player_achievements (id, user_id, achievement_id, unlocked_at)
        VALUES ($1, $2, $3, $4)
        "#,
        player_achievement_id,
        claims.sub,
        achievement_id,
        now,
    )
    .execute(&state.db)
    .await?;

    Ok(Json(PlayerAchievement {
        id: player_achievement_id,
        user_id: claims.sub,
        achievement_id,
        unlocked_at: now,
        progress: serde_json::json!({}),
    }))
}
