use sqlx::PgPool;
use uuid::Uuid;
use chrono::Utc;

use crate::error::AppError;

pub struct LeaderboardService;

impl LeaderboardService {
    /// Submit a score to the leaderboard
    /// Updates existing entry if score is higher, or creates new entry
    pub async fn submit_score(
        db: &PgPool,
        user_id: Uuid,
        username: &str,
        leaderboard_type: &str,
        score: i64,
        additional_data: Option<serde_json::Value>,
    ) -> Result<(), AppError> {
        let now = Utc::now();

        // Upsert: insert or update if score is higher
        sqlx::query!(
            r#"
            INSERT INTO leaderboard_entries (id, user_id, username, leaderboard_type, score, additional_data, achieved_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (user_id, leaderboard_type)
            DO UPDATE SET
                score = GREATEST(leaderboard_entries.score, EXCLUDED.score),
                additional_data = CASE
                    WHEN EXCLUDED.score > leaderboard_entries.score THEN EXCLUDED.additional_data
                    ELSE leaderboard_entries.additional_data
                END,
                achieved_at = CASE
                    WHEN EXCLUDED.score > leaderboard_entries.score THEN EXCLUDED.achieved_at
                    ELSE leaderboard_entries.achieved_at
                END
            "#,
            Uuid::new_v4(),
            user_id,
            username,
            leaderboard_type,
            score,
            additional_data,
            now
        )
        .execute(db)
        .await?;

        Ok(())
    }

    /// Calculate score for a night completion
    pub fn calculate_night_score(
        night: i32,
        survived: bool,
        final_power: i32,
        time_seconds: i32,
        star_rating: i32,
        easy_mode: bool,
    ) -> i64 {
        if !survived {
            return 0;
        }

        let mut score: i64 = 0;

        // Base score per night
        score += (night as i64) * 1000;

        // Power bonus (max 500)
        score += (final_power as i64) * 5;

        // Star rating bonus (max 500)
        score += (star_rating as i64) * 100;

        // Speed bonus (inverse of time, max ~500 for fast completion)
        let speed_bonus = (600 - time_seconds).max(0) as i64;
        score += speed_bonus;

        // Easy mode penalty
        if easy_mode {
            score = (score as f64 * 0.5) as i64;
        }

        score
    }

    /// Calculate score for survival mode
    pub fn calculate_survival_score(
        time_survived_seconds: i32,
        animatronics_avoided: i32,
        rooms_explored: i32,
        photos_taken: i32,
        pizza_slices: i32,
    ) -> i64 {
        let mut score: i64 = 0;

        // Time is primary factor
        score += (time_survived_seconds as i64) * 10;

        // Bonuses for achievements
        score += (animatronics_avoided as i64) * 50;
        score += (rooms_explored as i64) * 25;
        score += (photos_taken as i64) * 30;
        score += (pizza_slices as i64) * 100;

        score
    }
}
