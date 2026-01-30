use axum::{
    extract::{Path, State},
    Json,
};
use chrono::{NaiveDate, Utc};
use rand::{Rng, SeedableRng};
use rand::rngs::StdRng;
use uuid::Uuid;

use crate::{error::AppError, models::*, routes::auth::Claims, AppState};

pub async fn get_today(
    State(state): State<AppState>,
    claims: Option<Claims>,
) -> Result<Json<ChallengeResponse>, AppError> {
    let today = Utc::now().date_naive();

    // Try to get existing challenge
    let challenge = match get_or_create_challenge(&state, today).await? {
        Some(c) => c,
        None => return Err(AppError::Internal("Failed to create challenge".to_string())),
    };

    // Check if user has completed it
    let completion = if let Some(claims) = claims {
        sqlx::query_as!(
            DailyChallengeCompletion,
            "SELECT * FROM daily_challenge_completions WHERE user_id = $1 AND challenge_id = $2",
            claims.sub,
            challenge.id
        )
        .fetch_optional(&state.db)
        .await?
    } else {
        None
    };

    Ok(Json(ChallengeResponse {
        challenge,
        completed: completion.is_some(),
        completion,
    }))
}

pub async fn get_history(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<Json<Vec<ChallengeResponse>>, AppError> {
    let challenges = sqlx::query_as!(
        DailyChallenge,
        r#"
        SELECT * FROM daily_challenges
        WHERE challenge_date <= $1
        ORDER BY challenge_date DESC
        LIMIT 30
        "#,
        Utc::now().date_naive()
    )
    .fetch_all(&state.db)
    .await?;

    let mut responses = Vec::new();
    for challenge in challenges {
        let completion = sqlx::query_as!(
            DailyChallengeCompletion,
            "SELECT * FROM daily_challenge_completions WHERE user_id = $1 AND challenge_id = $2",
            claims.sub,
            challenge.id
        )
        .fetch_optional(&state.db)
        .await?;

        responses.push(ChallengeResponse {
            challenge,
            completed: completion.is_some(),
            completion,
        });
    }

    Ok(Json(responses))
}

pub async fn complete(
    State(state): State<AppState>,
    claims: Claims,
    Path(challenge_id): Path<Uuid>,
    Json(req): Json<CompleteChallengeRequest>,
) -> Result<Json<DailyChallengeCompletion>, AppError> {
    // Get challenge
    let challenge = sqlx::query_as!(
        DailyChallenge,
        "SELECT * FROM daily_challenges WHERE id = $1",
        challenge_id
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Challenge not found".to_string()))?;

    // Check if already completed
    let existing = sqlx::query_as!(
        DailyChallengeCompletion,
        "SELECT * FROM daily_challenge_completions WHERE user_id = $1 AND challenge_id = $2",
        claims.sub,
        challenge_id
    )
    .fetch_optional(&state.db)
    .await?;

    if let Some(completion) = existing {
        return Ok(Json(completion));
    }

    // TODO: Validate completion by checking session_id if provided

    let completion_id = Uuid::new_v4();
    let now = Utc::now();

    sqlx::query!(
        r#"
        INSERT INTO daily_challenge_completions (id, user_id, challenge_id, completed_at, score, time_seconds)
        VALUES ($1, $2, $3, $4, $5, $6)
        "#,
        completion_id,
        claims.sub,
        challenge_id,
        now,
        req.score,
        req.time_seconds
    )
    .execute(&state.db)
    .await?;

    Ok(Json(DailyChallengeCompletion {
        id: completion_id,
        user_id: claims.sub,
        challenge_id,
        completed_at: now,
        score: req.score,
        time_seconds: req.time_seconds,
    }))
}

async fn get_or_create_challenge(
    state: &AppState,
    date: NaiveDate,
) -> Result<Option<DailyChallenge>, AppError> {
    // Try to get existing
    let existing = sqlx::query_as!(
        DailyChallenge,
        "SELECT * FROM daily_challenges WHERE challenge_date = $1",
        date
    )
    .fetch_optional(&state.db)
    .await?;

    if let Some(challenge) = existing {
        return Ok(Some(challenge));
    }

    // Generate new challenge deterministically based on date
    let seed = date.num_days_from_ce() as u64;
    let mut rng = StdRng::seed_from_u64(seed);

    let challenge_type_idx = rng.gen_range(0..CHALLENGE_TYPES.len());
    let challenge_type = CHALLENGE_TYPES[challenge_type_idx];

    let (parameters, name_key, description_key, reward_points) = match challenge_type {
        "power_limit" => {
            let limit = [30, 40, 50, 60, 75][rng.gen_range(0..5)];
            (
                serde_json::json!({ "power_limit": limit }),
                format!("challenge_power_{}", limit),
                format!("challenge_power_{}_desc", limit),
                150 - limit,
            )
        }
        "no_cameras" => (
            serde_json::json!({}),
            "challenge_no_cameras".to_string(),
            "challenge_no_cameras_desc".to_string(),
            120,
        ),
        "no_left_door" => (
            serde_json::json!({}),
            "challenge_no_left_door".to_string(),
            "challenge_no_left_door_desc".to_string(),
            100,
        ),
        "no_right_door" => (
            serde_json::json!({}),
            "challenge_no_right_door".to_string(),
            "challenge_no_right_door_desc".to_string(),
            100,
        ),
        "speed_run" => {
            let target = [300, 360, 420][rng.gen_range(0..3)];
            (
                serde_json::json!({ "target_seconds": target }),
                format!("challenge_speed_{}", target / 60),
                format!("challenge_speed_{}_desc", target / 60),
                200 - (target / 3) as i32,
            )
        }
        "specific_night" => {
            let night = rng.gen_range(1..=5);
            (
                serde_json::json!({ "night": night }),
                format!("challenge_night_{}", night),
                format!("challenge_night_{}_desc", night),
                50 + night * 10,
            )
        }
        "collect_pizza" => {
            let count = [3, 5, 8][rng.gen_range(0..3)];
            (
                serde_json::json!({ "pizza_count": count }),
                format!("challenge_pizza_{}", count),
                format!("challenge_pizza_{}_desc", count),
                count * 20,
            )
        }
        "photo_challenge" => {
            let targets = ["freddy", "bonnie", "chica", "foxy"];
            let target = targets[rng.gen_range(0..targets.len())];
            (
                serde_json::json!({ "target": target }),
                format!("challenge_photo_{}", target),
                format!("challenge_photo_{}_desc", target),
                80,
            )
        }
        _ => (serde_json::json!({}), "challenge_unknown".to_string(), "".to_string(), 50),
    };

    let challenge_id = Uuid::new_v4();
    let now = Utc::now();

    sqlx::query!(
        r#"
        INSERT INTO daily_challenges (id, challenge_date, challenge_type, parameters, name_key, description_key, reward_points, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        "#,
        challenge_id,
        date,
        challenge_type,
        parameters,
        name_key,
        description_key,
        reward_points,
        now
    )
    .execute(&state.db)
    .await?;

    Ok(Some(DailyChallenge {
        id: challenge_id,
        challenge_date: date,
        challenge_type: challenge_type.to_string(),
        parameters,
        name_key,
        description_key,
        reward_points,
        created_at: now,
    }))
}
