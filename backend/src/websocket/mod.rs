use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path, State,
    },
    response::IntoResponse,
};
use futures::{SinkExt, StreamExt};
use std::{
    collections::HashMap,
    sync::Arc,
};
use tokio::sync::{broadcast, RwLock};
use uuid::Uuid;

use crate::{error::AppError, models::*, AppState};

// Store active game rooms
lazy_static::lazy_static! {
    static ref GAME_ROOMS: Arc<RwLock<HashMap<String, GameRoom>>> = Arc::new(RwLock::new(HashMap::new()));
}

pub struct GameRoom {
    pub room_code: String,
    pub tx: broadcast::Sender<String>,
    pub game_state: Option<serde_json::Value>,
    pub players: Vec<ConnectedPlayer>,
}

pub struct ConnectedPlayer {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub role: Option<String>,
    pub is_ready: bool,
}

pub async fn game_ws_handler(
    ws: WebSocketUpgrade,
    Path(room_code): Path<String>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, room_code, state))
}

async fn handle_socket(socket: WebSocket, room_code: String, state: AppState) {
    let (mut sender, mut receiver) = socket.split();
    let player_id = Uuid::new_v4();

    // Get or create room broadcast channel
    let tx = {
        let mut rooms = GAME_ROOMS.write().await;
        if let Some(room) = rooms.get_mut(&room_code) {
            room.players.push(ConnectedPlayer {
                id: player_id,
                user_id: None,
                role: None,
                is_ready: false,
            });
            room.tx.clone()
        } else {
            let (tx, _) = broadcast::channel(100);
            rooms.insert(
                room_code.clone(),
                GameRoom {
                    room_code: room_code.clone(),
                    tx: tx.clone(),
                    game_state: None,
                    players: vec![ConnectedPlayer {
                        id: player_id,
                        user_id: None,
                        role: None,
                        is_ready: false,
                    }],
                },
            );
            tx
        }
    };

    let mut rx = tx.subscribe();

    // Send task - forwards broadcast messages to this client
    let send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });

    // Receive task - handles incoming messages from this client
    let room_code_clone = room_code.clone();
    let tx_clone = tx.clone();
    let recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            if let Message::Text(text) = msg {
                if let Ok(client_msg) = serde_json::from_str::<ClientMessage>(&text) {
                    handle_client_message(&room_code_clone, player_id, client_msg, &tx_clone).await;
                }
            }
        }
    });

    // Wait for either task to finish
    tokio::select! {
        _ = send_task => {},
        _ = recv_task => {},
    }

    // Clean up - remove player from room
    {
        let mut rooms = GAME_ROOMS.write().await;
        if let Some(room) = rooms.get_mut(&room_code) {
            room.players.retain(|p| p.id != player_id);

            // Broadcast player left
            let msg = ServerMessage::PlayerLeft {
                participant_id: player_id,
            };
            let _ = tx.send(serde_json::to_string(&msg).unwrap());

            // Remove room if empty
            if room.players.is_empty() {
                rooms.remove(&room_code);
            }
        }
    }
}

async fn handle_client_message(
    room_code: &str,
    player_id: Uuid,
    msg: ClientMessage,
    tx: &broadcast::Sender<String>,
) {
    match msg {
        ClientMessage::Ping => {
            let response = ServerMessage::Pong;
            let _ = tx.send(serde_json::to_string(&response).unwrap());
        }
        ClientMessage::Ready => {
            let mut rooms = GAME_ROOMS.write().await;
            if let Some(room) = rooms.get_mut(room_code) {
                if let Some(player) = room.players.iter_mut().find(|p| p.id == player_id) {
                    player.is_ready = true;
                }

                // Check if all players ready
                let all_ready = room.players.iter().all(|p| p.is_ready);
                if all_ready && room.players.len() >= 2 {
                    let msg = ServerMessage::GameStart;
                    let _ = tx.send(serde_json::to_string(&msg).unwrap());
                }
            }
        }
        ClientMessage::RoleSelect { role } => {
            let mut rooms = GAME_ROOMS.write().await;
            if let Some(room) = rooms.get_mut(room_code) {
                if let Some(player) = room.players.iter_mut().find(|p| p.id == player_id) {
                    player.role = Some(role);
                }
            }
        }
        ClientMessage::GameAction { action } => {
            // Broadcast action to all players
            let msg = ServerMessage::GameState {
                state: serde_json::json!({
                    "action": action,
                    "from": player_id.to_string()
                }),
            };
            let _ = tx.send(serde_json::to_string(&msg).unwrap());
        }
        ClientMessage::Chat { message } => {
            let msg = ServerMessage::Chat {
                from: player_id.to_string(),
                message,
            };
            let _ = tx.send(serde_json::to_string(&msg).unwrap());
        }
    }
}

// Need to add lazy_static to Cargo.toml
