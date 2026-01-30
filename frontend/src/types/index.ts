// ============================================
// FNAF Game - Core Type Definitions
// ============================================

// Game State Types
export interface GameState {
  night: number;
  hour: number; // 0-5 (12AM - 5AM)
  power: number; // 0-100
  powerUsage: number;
  isPlaying: boolean;
  cameraOpen: boolean;
  currentCamera: CameraId;
  leftDoorClosed: boolean;
  rightDoorClosed: boolean;
  leftLightOn: boolean;
  rightLightOn: boolean;
  gameOver: boolean;
  officePosition: 'left' | 'center' | 'right';
  easyMode: boolean;
  customDifficulty?: CustomDifficulty;
  jumpscareEnabled: boolean;
  powerDrainMultiplier: number;
  hourDurationMultiplier: number;
  animatronicSpeedMultiplier: number;
  cameraPowerFree: boolean;
  doorPowerMultiplier: number;
  showAnimatronicIndicators: boolean;
}

export interface CustomDifficulty {
  freddy: number; // 0-20
  bonnie: number;
  chica: number;
  foxy: number;
}

export type AnimatronicId = 'freddy' | 'bonnie' | 'chica' | 'foxy';
export type CameraId = '1A' | '1B' | '2A' | '2B' | '3' | '4A' | '4B';

export interface Animatronic {
  id: AnimatronicId;
  name: string;
  emoji: string;
  position: CameraId | 'LEFT_DOOR' | 'RIGHT_DOOR';
  aiLevel: number;
  path: string[];
  moveInterval: number | null;
  skin?: AnimatronicSkin;
}

export interface AnimatronicSkin {
  id: string;
  animatronicId: AnimatronicId;
  name: string;
  colorOverride?: number;
  emissive?: number;
  eyeColor?: number;
  transparent?: number;
  shiny?: boolean;
  unlocked: boolean;
}

// Free Roam Types
export type RoomId =
  | 'stage'
  | 'dining'
  | 'westHall'
  | 'westCorner'
  | 'eastHall'
  | 'eastCorner'
  | 'office'
  | 'pirateCove'
  | 'supplyCloset'
  | 'restrooms'
  | 'kitchen'
  | 'backstage';

export interface FreeRoamState {
  isActive: boolean;
  is3DMode: boolean;
  currentRoom: RoomId;
  isSurvivalMode: boolean;
  isHiding: boolean;
  flashlightOn: boolean;
  lightsOn: boolean;
}

// Session & Progress Types
export interface GameSession {
  id: string;
  sessionType: 'night' | 'freeroam' | 'survival' | 'multiplayer';
  nightNumber?: number;
  startTime: Date;
  endTime?: Date;
  survived: boolean;
  finalPower: number;
  timeSurvivedSeconds: number;
  starRating: number;
  score: number;
  deathBy?: AnimatronicId;
  powerUpsUsed: PowerUpType[];
  pizzaSlicesFound: number;
  photosTaken: number;
  easyMode: boolean;
}

export interface PlayerProfile {
  id: string;
  userId: string;
  highestNightCompleted: number;
  totalNightsSurvived: number;
  totalDeaths: number;
  totalPlaytimeSeconds: number;
  pizzaSlicesCollected: number;
  photosTaken: number;
  easyModeEnabled: boolean;
  unlockedSkins: string[];
  unlockedDecorations: string[];
  equippedDecorations: string[];
  jukeboxSongs: string[];
  audioVolume: number;
  musicVolume: number;
}

// Achievement Types
export interface Achievement {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  category: AchievementCategory;
  points: number;
  isSecret: boolean;
  requirements: Record<string, unknown>;
}

export type AchievementCategory =
  | 'survival'
  | 'skills'
  | 'collectibles'
  | 'photos'
  | 'secrets'
  | 'minigames';

export interface PlayerAchievement {
  achievementId: string;
  unlockedAt: Date;
  progress?: Record<string, number>;
}

// Power-up Types
export enum PowerUpType {
  EXTRA_BATTERY = 'extra_battery',
  DOOR_REPAIR = 'door_repair',
  SLOW_MO = 'slow_mo',
  CAMERA_BOOST = 'camera_boost',
}

export interface PowerUp {
  type: PowerUpType;
  name: string;
  description: string;
  icon: string;
  duration: number; // 0 for instant
}

export interface ActivePowerUp {
  type: PowerUpType;
  remainingTime: number;
}

// Collectible Types
export interface PizzaSlice {
  id: string;
  room: RoomId;
  position: Vector3;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  collected: boolean;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

// Photo Mode Types
export interface CapturedPhoto {
  id: string;
  imageData: string;
  subjects: PhotoSubject[];
  bonuses: PhotoBonus[];
  totalPoints: number;
  timestamp: Date;
  location: RoomId;
}

export interface PhotoSubject {
  type: 'animatronic' | 'easter_egg' | 'collectible';
  id: string;
  distance: number;
  centered: boolean;
}

export interface PhotoBonus {
  condition: string;
  points: number;
  message: string;
}

// Decoration Types
export interface Decoration {
  id: string;
  name: string;
  slot: DecorationSlot;
  unlockCondition: string;
  unlocked: boolean;
}

export type DecorationSlot =
  | 'wall_left'
  | 'wall_right'
  | 'wall_back'
  | 'desk'
  | 'desk_fan'
  | 'monitors';

// Jukebox Types
export interface JukeboxTrack {
  id: string;
  name: string;
  file: string;
  unlockCondition?: string;
  unlocked: boolean;
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  additionalData?: Record<string, unknown>;
  achievedAt: Date;
}

export type LeaderboardType =
  | 'night_1' | 'night_2' | 'night_3' | 'night_4' | 'night_5' | 'night_6' | 'night_7'
  | 'survival'
  | 'speed_run'
  | 'photos'
  | 'pizza_collection';

// Daily Challenge Types
export interface DailyChallenge {
  id: string;
  challengeDate: string;
  challengeType: ChallengeType;
  parameters: Record<string, unknown>;
  nameKey: string;
  descriptionKey: string;
  rewardPoints: number;
  completed: boolean;
}

export type ChallengeType =
  | 'power_limit'
  | 'no_cameras'
  | 'no_left_door'
  | 'no_right_door'
  | 'speed_run'
  | 'specific_night'
  | 'collect_pizza'
  | 'photo_challenge';

// Multiplayer Types
export interface MultiplayerRoom {
  id: string;
  roomCode: string;
  hostUserId?: string;
  gameMode: 'coop' | 'versus' | 'online';
  maxPlayers: number;
  currentPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  participants: MultiplayerParticipant[];
}

export interface MultiplayerParticipant {
  id: string;
  username?: string;
  guestName?: string;
  role?: 'guard' | 'animatronic';
  isReady: boolean;
}

// Star Rating Types
export interface StarRating {
  stars: number; // 1-5
  breakdown: RatingBreakdown;
  score: number;
}

export interface RatingBreakdown {
  powerBonus: number;
  timeBonus: number;
  noCamerasBonus: number;
  noDeathsBonus: number;
  difficultyMultiplier: number;
}

// Audio Types
export interface SoundConfig {
  id: string;
  file: string | string[];
  volume?: number;
  loop?: boolean;
  category: 'sfx' | 'ambience' | 'music' | 'voice';
}

// Minigame Types
export interface MinigameResult {
  gameId: string;
  score: number;
  won: boolean;
  highScore: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

// Night Configuration Types
export interface NightConfig {
  night: number;
  name: string;
  description: string;
  aiLevels: CustomDifficulty;
  specialRules?: {
    powerDrainMultiplier?: number;
    hourDuration?: number;
    isCustom?: boolean;
    maxDifficulty?: number;
  };
}

// Event Types
export interface GameEvent {
  type: GameEventType;
  data: Record<string, unknown>;
  timestamp: Date;
}

export type GameEventType =
  | 'night_started'
  | 'night_completed'
  | 'night_failed'
  | 'animatronic_moved'
  | 'jumpscare'
  | 'power_out'
  | 'door_toggled'
  | 'camera_switched'
  | 'pizza_collected'
  | 'photo_taken'
  | 'powerup_used'
  | 'achievement_unlocked';
