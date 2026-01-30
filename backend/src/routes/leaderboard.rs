use axum::{
    extract::{Path, Query, State},
    Json,
};

use crate::{error::AppError, models::*, routes::auth::Claims, AppState};

pub async fn get_leaderboard(
    State(state): State<AppState>,
    Path(leaderboard_type): Path<String>,
    Query(query): Query<LeaderboardQuery>,
) -> Result<Json<LeaderboardResponse>, AppError> {
    // Validate leaderboard type
    if !LEADERBOARD_TYPES.contains(&leaderboard_type.as_str()) {
        return Err(AppError::BadRequest(format!(
            "Invalid leaderboard type. Valid types: {:?}",
            LEADERBOARD_TYPES
        )));
    }

    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(50).min(100);
    let offset = (page - 1) * limit;

    // Get total count
    let total_entries = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM leaderboard_entries WHERE leaderboard_type = $1",
        leaderboard_type
    )
    .fetch_one(&state.db)
    .await?
    .unwrap_or(0);

    // Get entries with rank
    let entries = sqlx::query!(
        r#"
        SELECT
            user_id,
            username,
            score,
            additional_data,
            achieved_at,
            RANK() OVER (ORDER BY score DESC) as rank
        FROM leaderboard_entries
        WHERE leaderboard_type = $1
        ORDER BY score DESC
        LIMIT $2 OFFSET $3
        "#,
        leaderboard_type,
        limit as i64,
        offset as i64
    )
    .fetch_all(&state.db)
    .await?;

    let entries_with_rank: Vec<LeaderboardEntryWithRank> = entries
        .into_iter()
        .map(|row| LeaderboardEntryWithRank {
            rank: row.rank.unwrap_or(0),
            user_id: row.user_id,
            username: row.username,
            score: row.score,
            additional_data: row.additional_data,
            achieved_at: row.achieved_at,
        })
        .collect();

    let total_pages = ((total_entries as f64) / (limit as f64)).ceil() as i32;

    Ok(Json(LeaderboardResponse {
        leaderboard_type,
        entries: entries_with_rank,
        page,
        total_pages,
        total_entries,
    }))
}

pub async fn get_my_rank(
    State(state): State<AppState>,
    claims: Claims,
    Path(leaderboard_type): Path<String>,
) -> Result<Json<MyRankResponse>, AppError> {
    // Get user's rank and score
    let my_entry = sqlx::query!(
        r#"
        WITH ranked AS (
            SELECT
                user_id,
                score,
                RANK() OVER (ORDER BY score DESC) as rank
            FROM leaderboard_entries
            WHERE leaderboard_type = $1
        )
        SELECT rank, score FROM ranked WHERE user_id = $2
        "#,
        leaderboard_type,
        claims.sub
    )
    .fetch_optional(&state.db)
    .await?;

    // Get total players
    let total_players = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM leaderboard_entries WHERE leaderboard_type = $1",
        leaderboard_type
    )
    .fetch_one(&state.db)
    .await?
    .unwrap_or(0);

    Ok(Json(MyRankResponse {
        rank: my_entry.as_ref().and_then(|e| e.rank),
        score: my_entry.map(|e| e.score),
        total_players,
    }))
}
