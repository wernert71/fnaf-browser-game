use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use chrono::Utc;
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{error::AppError, models::*, AppState};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid,
    pub exp: i64,
    pub iat: i64,
}

pub async fn register(
    State(state): State<AppState>,
    Json(req): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    // Check if email already exists
    let existing = sqlx::query_scalar!(
        "SELECT id FROM users WHERE email = $1 OR username = $2",
        req.email,
        req.username
    )
    .fetch_optional(&state.db)
    .await?;

    if existing.is_some() {
        return Err(AppError::Conflict("Email or username already exists".to_string()));
    }

    // Hash password
    let password_hash = hash_password(&req.password)?;

    // Create user
    let user_id = Uuid::new_v4();
    let now = Utc::now();

    sqlx::query!(
        r#"
        INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $5)
        "#,
        user_id,
        req.username,
        req.email,
        password_hash,
        now,
    )
    .execute(&state.db)
    .await?;

    // Create player profile
    sqlx::query!(
        r#"
        INSERT INTO player_profiles (id, user_id, created_at, updated_at)
        VALUES ($1, $2, $3, $3)
        "#,
        Uuid::new_v4(),
        user_id,
        now,
    )
    .execute(&state.db)
    .await?;

    // Generate token
    let token = generate_token(user_id, &state.config.jwt_secret, state.config.jwt_expiry_hours)?;

    Ok(Json(AuthResponse {
        token,
        user: UserPublic {
            id: user_id,
            username: req.username,
            display_name: None,
            avatar_url: None,
        },
    }))
}

pub async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    // Find user
    let user = sqlx::query_as!(
        User,
        "SELECT * FROM users WHERE email = $1 AND is_active = true",
        req.email
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::Unauthorized("Invalid credentials".to_string()))?;

    // Verify password
    if !verify_password(&req.password, &user.password_hash)? {
        return Err(AppError::Unauthorized("Invalid credentials".to_string()));
    }

    // Update last login
    sqlx::query!(
        "UPDATE users SET last_login = $1 WHERE id = $2",
        Utc::now(),
        user.id
    )
    .execute(&state.db)
    .await?;

    // Generate token
    let token = generate_token(user.id, &state.config.jwt_secret, state.config.jwt_expiry_hours)?;

    Ok(Json(AuthResponse {
        token,
        user: user.into(),
    }))
}

pub async fn refresh(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<Json<AuthResponse>, AppError> {
    let user = sqlx::query_as!(
        User,
        "SELECT * FROM users WHERE id = $1 AND is_active = true",
        claims.sub
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::Unauthorized("User not found".to_string()))?;

    let token = generate_token(user.id, &state.config.jwt_secret, state.config.jwt_expiry_hours)?;

    Ok(Json(AuthResponse {
        token,
        user: user.into(),
    }))
}

pub async fn me(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<Json<UserPublic>, AppError> {
    let user = sqlx::query_as!(
        User,
        "SELECT * FROM users WHERE id = $1",
        claims.sub
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    Ok(Json(user.into()))
}

fn hash_password(password: &str) -> Result<String, AppError> {
    use argon2::{
        password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
        Argon2,
    };

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    argon2
        .hash_password(password.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|_| AppError::Internal("Failed to hash password".to_string()))
}

fn verify_password(password: &str, hash: &str) -> Result<bool, AppError> {
    use argon2::{
        password_hash::{PasswordHash, PasswordVerifier},
        Argon2,
    };

    let parsed_hash = PasswordHash::new(hash)
        .map_err(|_| AppError::Internal("Invalid password hash".to_string()))?;

    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok())
}

fn generate_token(user_id: Uuid, secret: &str, expiry_hours: i64) -> Result<String, AppError> {
    let now = Utc::now();
    let exp = now + chrono::Duration::hours(expiry_hours);

    let claims = Claims {
        sub: user_id,
        iat: now.timestamp(),
        exp: exp.timestamp(),
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|_| AppError::Internal("Failed to generate token".to_string()))
}

pub fn decode_token(token: &str, secret: &str) -> Result<Claims, AppError> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|_| AppError::Unauthorized("Invalid token".to_string()))
}
