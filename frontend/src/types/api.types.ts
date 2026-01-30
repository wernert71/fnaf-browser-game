// API-specific types for communication with the backend

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateSessionRequest {
  sessionType: string;
  nightNumber?: number;
  easyMode?: boolean;
  customDifficulty?: {
    freddy: number;
    bonnie: number;
    chica: number;
    foxy: number;
  };
}

export interface UpdateSessionRequest {
  survived?: boolean;
  finalPower?: number;
  timeSurvivedSeconds?: number;
  starRating?: number;
  score?: number;
  deathBy?: string;
  powerUpsUsed?: string[];
  pizzaSlicesFound?: number;
  photosTaken?: number;
}

export interface UpdateProfileRequest {
  displayName?: string;
  avatarUrl?: string;
  easyModeEnabled?: boolean;
  audioVolume?: number;
  musicVolume?: number;
  equippedDecorations?: string[];
}

export interface CreateRoomRequest {
  gameMode: string;
  maxPlayers?: number;
  settings?: Record<string, unknown>;
}

export interface JoinRoomRequest {
  guestName?: string;
}

export interface CompleteChallengeRequest {
  score?: number;
  timeSeconds?: number;
  sessionId?: string;
}

export interface LeaderboardQuery {
  page?: number;
  limit?: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all';
}

// WebSocket message types
export interface WsClientMessage {
  type: 'Ready' | 'RoleSelect' | 'GameAction' | 'Chat' | 'Ping';
  role?: string;
  action?: {
    actionType: string;
    data: Record<string, unknown>;
  };
  message?: string;
}

export interface WsServerMessage {
  type: 'RoomState' | 'GameState' | 'PlayerJoined' | 'PlayerLeft' | 'GameStart' | 'GameEnd' | 'Chat' | 'Error' | 'Pong';
  room?: unknown;
  state?: unknown;
  participant?: unknown;
  participantId?: string;
  result?: unknown;
  from?: string;
  message?: string;
}
