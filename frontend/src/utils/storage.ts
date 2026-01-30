import type { PlayerProfile, Achievement, PizzaSlice, CapturedPhoto } from '@/types';

const PREFIX = 'fnaf_';

// Local progress that can work offline
export interface LocalProgress {
  highestNightCompleted: number;
  totalNightsSurvived: number;
  totalDeaths: number;
  totalPlaytimeSeconds: number;
  pizzaSlicesCollected: string[]; // slice IDs
  photosTaken: number;
  easyModeEnabled: boolean;
  unlockedSkins: string[];
  unlockedDecorations: string[];
  equippedDecorations: string[];
  jukeboxSongs: string[];
  audioVolume: number;
  musicVolume: number;
  achievements: { id: string; unlockedAt: string }[];
}

export class GameStorage {
  static getDefaultProgress(): LocalProgress {
    return {
      highestNightCompleted: 0,
      totalNightsSurvived: 0,
      totalDeaths: 0,
      totalPlaytimeSeconds: 0,
      pizzaSlicesCollected: [],
      photosTaken: 0,
      easyModeEnabled: false,
      unlockedSkins: [],
      unlockedDecorations: [],
      equippedDecorations: [],
      jukeboxSongs: [],
      audioVolume: 1.0,
      musicVolume: 0.5,
      achievements: [],
    };
  }

  // Local progress (offline-first)
  static getLocalProgress(): LocalProgress {
    const data = localStorage.getItem(`${PREFIX}progress`);
    return data ? JSON.parse(data) : this.getDefaultProgress();
  }

  static saveLocalProgress(progress: LocalProgress): void {
    localStorage.setItem(`${PREFIX}progress`, JSON.stringify(progress));
  }

  static updateProgress(updates: Partial<LocalProgress>): LocalProgress {
    const current = this.getLocalProgress();
    const updated = { ...current, ...updates };
    this.saveLocalProgress(updated);
    return updated;
  }

  // Achievement tracking
  static getAchievementProgress(): Record<string, number> {
    const data = localStorage.getItem(`${PREFIX}achievement_progress`);
    return data ? JSON.parse(data) : {};
  }

  static trackAchievementProgress(id: string, progress: number): void {
    const achievements = this.getAchievementProgress();
    achievements[id] = Math.max(achievements[id] || 0, progress);
    localStorage.setItem(`${PREFIX}achievement_progress`, JSON.stringify(achievements));
  }

  static unlockAchievement(id: string): void {
    const progress = this.getLocalProgress();
    if (!progress.achievements.find(a => a.id === id)) {
      progress.achievements.push({
        id,
        unlockedAt: new Date().toISOString(),
      });
      this.saveLocalProgress(progress);
    }
  }

  // Pizza slice collection
  static collectPizzaSlice(sliceId: string): void {
    const progress = this.getLocalProgress();
    if (!progress.pizzaSlicesCollected.includes(sliceId)) {
      progress.pizzaSlicesCollected.push(sliceId);
      this.saveLocalProgress(progress);
    }
  }

  static isPizzaCollected(sliceId: string): boolean {
    return this.getLocalProgress().pizzaSlicesCollected.includes(sliceId);
  }

  // Settings
  static getSettings(): { audioVolume: number; musicVolume: number; easyMode: boolean } {
    const progress = this.getLocalProgress();
    return {
      audioVolume: progress.audioVolume,
      musicVolume: progress.musicVolume,
      easyMode: progress.easyModeEnabled,
    };
  }

  static saveSettings(settings: { audioVolume?: number; musicVolume?: number; easyMode?: boolean }): void {
    const progress = this.getLocalProgress();
    if (settings.audioVolume !== undefined) progress.audioVolume = settings.audioVolume;
    if (settings.musicVolume !== undefined) progress.musicVolume = settings.musicVolume;
    if (settings.easyMode !== undefined) progress.easyModeEnabled = settings.easyMode;
    this.saveLocalProgress(progress);
  }

  // Pending actions queue (for offline sync)
  static getPendingActions(): Array<{ action: string; data: unknown; timestamp: number }> {
    const data = localStorage.getItem(`${PREFIX}pending_actions`);
    return data ? JSON.parse(data) : [];
  }

  static addPendingAction(action: string, data: unknown): void {
    const pending = this.getPendingActions();
    pending.push({ action, data, timestamp: Date.now() });
    localStorage.setItem(`${PREFIX}pending_actions`, JSON.stringify(pending));
  }

  static clearPendingActions(): void {
    localStorage.removeItem(`${PREFIX}pending_actions`);
  }

  // Session state (for resuming after page refresh)
  static saveSessionState(state: unknown): void {
    sessionStorage.setItem(`${PREFIX}session`, JSON.stringify(state));
  }

  static getSessionState<T>(): T | null {
    const data = sessionStorage.getItem(`${PREFIX}session`);
    return data ? JSON.parse(data) : null;
  }

  static clearSessionState(): void {
    sessionStorage.removeItem(`${PREFIX}session`);
  }

  // Photos (stored locally as they can be large)
  static savePhoto(photo: CapturedPhoto): void {
    const photos = this.getPhotos();
    photos.unshift(photo); // Add to beginning
    // Keep only last 50 photos
    if (photos.length > 50) photos.pop();
    localStorage.setItem(`${PREFIX}photos`, JSON.stringify(photos));
  }

  static getPhotos(): CapturedPhoto[] {
    const data = localStorage.getItem(`${PREFIX}photos`);
    return data ? JSON.parse(data) : [];
  }

  static deletePhoto(photoId: string): void {
    const photos = this.getPhotos().filter(p => p.id !== photoId);
    localStorage.setItem(`${PREFIX}photos`, JSON.stringify(photos));
  }

  // Clear all data
  static clearAll(): void {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
    sessionStorage.removeItem(`${PREFIX}session`);
  }
}

export default GameStorage;
