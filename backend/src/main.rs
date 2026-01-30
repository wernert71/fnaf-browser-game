use axum::{
    routing::{get, post, put},
    Router,
};
use sqlx::postgres::PgPoolOptions;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod db;
mod error;
mod middleware;
mod models;
mod routes;
mod services;
mod websocket;

use config::Config;
use routes::{auth, challenges, leaderboard, multiplayer, achievements, users};

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub config: Arc<Config>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "fnaf_backend=debug,tower_http=debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    dotenvy::dotenv().ok();
    let config = Config::from_env()?;

    // Create database pool
    let db = PgPoolOptions::new()
        .max_connections(5)
        .connect(&config.database_url)
        .await?;

    // Run migrations
    sqlx::migrate!("./migrations").run(&db).await?;

    let state = AppState {
        db,
        config: Arc::new(config.clone()),
    };

    // Build router
    let app = Router::new()
        // Auth routes
        .route("/api/auth/register", post(auth::register))
        .route("/api/auth/login", post(auth::login))
        .route("/api/auth/refresh", post(auth::refresh))
        .route("/api/auth/me", get(auth::me))
        // User/Profile routes
        .route("/api/profile", get(users::get_profile).put(users::update_profile))
        .route("/api/profile/:id", get(users::get_public_profile))
        // Game sessions
        .route("/api/sessions", post(users::create_session))
        .route("/api/sessions/:id", put(users::update_session))
        // Achievements
        .route("/api/achievements", get(achievements::list_all))
        .route("/api/achievements/mine", get(achievements::get_mine))
        .route("/api/achievements/:id/claim", post(achievements::claim))
        // Leaderboards
        .route("/api/leaderboard/:type", get(leaderboard::get_leaderboard))
        .route("/api/leaderboard/:type/rank", get(leaderboard::get_my_rank))
        // Daily challenges
        .route("/api/challenges/today", get(challenges::get_today))
        .route("/api/challenges/history", get(challenges::get_history))
        .route("/api/challenges/:id/complete", post(challenges::complete))
        // Multiplayer
        .route("/api/multiplayer/rooms", post(multiplayer::create_room))
        .route("/api/multiplayer/rooms/:code", get(multiplayer::get_room))
        .route("/api/multiplayer/rooms/:code/join", post(multiplayer::join_room))
        // WebSocket for multiplayer
        .route("/ws/game/:room_code", get(websocket::game_ws_handler))
        // Middleware
        .layer(TraceLayer::new_for_http())
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .with_state(state);

    // Start server
    let addr = format!("{}:{}", config.host, config.port);
    tracing::info!("Starting server on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
