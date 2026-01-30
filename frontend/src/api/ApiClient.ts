import type {
  AuthResponse,
  PlayerProfile,
  GameSession,
  Achievement,
  DailyChallenge,
  LeaderboardEntry,
  MultiplayerRoom,
} from '@/types';
import type {
  RegisterRequest,
  LoginRequest,
  CreateSessionRequest,
  UpdateSessionRequest,
  UpdateProfileRequest,
  CreateRoomRequest,
  JoinRoomRequest,
  CompleteChallengeRequest,
  LeaderboardQuery,
} from '@/types/api.types';

const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage
    this.token = localStorage.getItem('fnaf_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('fnaf_token', token);
    } else {
      localStorage.removeItem('fnaf_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(response.token);
    return response;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(response.token);
    return response;
  }

  async logout(): Promise<void> {
    this.setToken(null);
  }

  async getMe(): Promise<AuthResponse['user']> {
    return this.request('/auth/me');
  }

  // Profile endpoints
  async getProfile(): Promise<PlayerProfile> {
    return this.request('/profile');
  }

  async updateProfile(data: UpdateProfileRequest): Promise<PlayerProfile> {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getPublicProfile(userId: string): Promise<unknown> {
    return this.request(`/profile/${userId}`);
  }

  // Session endpoints
  async createSession(data: CreateSessionRequest): Promise<GameSession> {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSession(sessionId: string, data: UpdateSessionRequest): Promise<GameSession> {
    return this.request(`/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Achievement endpoints
  async getAchievements(): Promise<Achievement[]> {
    return this.request('/achievements');
  }

  async getMyAchievements(): Promise<{
    achievements: (Achievement & { unlocked: boolean; unlockedAt?: string })[];
    totalPoints: number;
    unlockedCount: number;
  }> {
    return this.request('/achievements/mine');
  }

  async claimAchievement(achievementId: string): Promise<unknown> {
    return this.request(`/achievements/${achievementId}/claim`, {
      method: 'POST',
    });
  }

  // Leaderboard endpoints
  async getLeaderboard(
    type: string,
    query: LeaderboardQuery = {}
  ): Promise<{
    leaderboardType: string;
    entries: LeaderboardEntry[];
    page: number;
    totalPages: number;
    totalEntries: number;
  }> {
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.timeframe) params.set('timeframe', query.timeframe);

    const queryString = params.toString();
    return this.request(`/leaderboard/${type}${queryString ? `?${queryString}` : ''}`);
  }

  async getMyRank(type: string): Promise<{
    rank: number | null;
    score: number | null;
    totalPlayers: number;
  }> {
    return this.request(`/leaderboard/${type}/rank`);
  }

  // Challenge endpoints
  async getTodayChallenge(): Promise<{
    challenge: DailyChallenge;
    completed: boolean;
    completion?: unknown;
  }> {
    return this.request('/challenges/today');
  }

  async getChallengeHistory(): Promise<{
    challenge: DailyChallenge;
    completed: boolean;
  }[]> {
    return this.request('/challenges/history');
  }

  async completeChallenge(challengeId: string, data: CompleteChallengeRequest): Promise<unknown> {
    return this.request(`/challenges/${challengeId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Multiplayer endpoints
  async createRoom(data: CreateRoomRequest): Promise<MultiplayerRoom> {
    return this.request('/multiplayer/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRoom(roomCode: string): Promise<MultiplayerRoom> {
    return this.request(`/multiplayer/rooms/${roomCode}`);
  }

  async joinRoom(roomCode: string, data: JoinRoomRequest = {}): Promise<MultiplayerRoom> {
    return this.request(`/multiplayer/rooms/${roomCode}/join`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // WebSocket connection
  connectToRoom(roomCode: string): WebSocket {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/game/${roomCode}`);
    return ws;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
