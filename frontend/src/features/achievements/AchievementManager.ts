import type { Achievement, PlayerAchievement, AchievementCategory } from '@/types';
import { GameStorage } from '@/utils/storage';
import { eventBus } from '@/core/EventBus';
import { ACHIEVEMENTS } from './AchievementData';

export class AchievementManager {
  private unlockedAchievements: Set<string> = new Set();
  private achievementProgress: Map<string, number> = new Map();

  constructor() {
    this.loadFromStorage();
    this.setupEventListeners();
  }

  private loadFromStorage(): void {
    const progress = GameStorage.getLocalProgress();
    progress.achievements.forEach(a => this.unlockedAchievements.add(a.id));

    const achievementProgress = GameStorage.getAchievementProgress();
    Object.entries(achievementProgress).forEach(([id, value]) => {
      this.achievementProgress.set(id, value);
    });
  }

  private setupEventListeners(): void {
    // Night completed
    eventBus.on('night_completed', (data: unknown) => {
      const { night, survived, finalPower, timeSeconds, noCameras } = data as {
        night: number;
        survived: boolean;
        finalPower: number;
        timeSeconds: number;
        noCameras: boolean;
      };

      if (survived) {
        this.tryUnlock(`survive_night_${night}`);

        if (finalPower >= 50) {
          this.tryUnlock('power_saver');
        }

        if (noCameras) {
          this.tryUnlock('no_cameras');
        }

        if (timeSeconds < 300) {
          this.tryUnlock('speed_demon');
        }
      }
    });

    // Power out survival
    eventBus.on('power_out', (data: unknown) => {
      const { survived } = data as { survived: boolean };
      if (survived) {
        this.tryUnlock('no_power_survive');
      }
    });

    // Pizza collected
    eventBus.on('pizza_collected', (data: unknown) => {
      const { totalCollected } = data as { totalCollected: number };
      if (totalCollected >= 1) {
        this.tryUnlock('first_pizza');
      }
      if (totalCollected >= 8) {
        this.tryUnlock('pizza_master');
      }
    });

    // Photo taken
    eventBus.on('photo_taken', (data: unknown) => {
      const { totalPhotos, hasGoldenFreddy } = data as {
        totalPhotos: number;
        hasGoldenFreddy: boolean;
      };

      this.updateProgress('photographer', totalPhotos, 10);
      if (totalPhotos >= 10) {
        this.tryUnlock('photographer');
      }
      if (hasGoldenFreddy) {
        this.tryUnlock('rare_shot');
      }
    });

    // Golden Freddy encounter
    eventBus.on('golden_freddy_seen', () => {
      this.tryUnlock('golden_freddy_seen');
    });

    // Survival mode time
    eventBus.on('survival_time_update', (data: unknown) => {
      const { seconds } = data as { seconds: number };
      if (seconds >= 600) {
        this.tryUnlock('marathon');
      }
    });

    // Minigame completed
    eventBus.on('minigame_completed', (data: unknown) => {
      const { totalCompleted } = data as { totalCompleted: number };
      if (totalCompleted >= 3) {
        this.tryUnlock('all_minigames');
      }
    });

    // Night 7 custom completion
    eventBus.on('night_7_completed', (data: unknown) => {
      const { difficulty } = data as { difficulty: { freddy: number; bonnie: number; chica: number; foxy: number } };
      if (
        difficulty.freddy === 20 &&
        difficulty.bonnie === 20 &&
        difficulty.chica === 20 &&
        difficulty.foxy === 20
      ) {
        this.tryUnlock('survive_night_7_2020');
      }
    });
  }

  tryUnlock(achievementId: string): boolean {
    if (this.unlockedAchievements.has(achievementId)) {
      return false; // Already unlocked
    }

    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) {
      console.warn(`Unknown achievement: ${achievementId}`);
      return false;
    }

    this.unlockedAchievements.add(achievementId);
    GameStorage.unlockAchievement(achievementId);

    // Show notification
    this.showUnlockNotification(achievement);

    // Emit event
    eventBus.emit('achievement_unlocked', { achievement });

    return true;
  }

  updateProgress(achievementId: string, current: number, target: number): void {
    const progress = Math.min(current / target, 1);
    this.achievementProgress.set(achievementId, progress);
    GameStorage.trackAchievementProgress(achievementId, current);
  }

  isUnlocked(achievementId: string): boolean {
    return this.unlockedAchievements.has(achievementId);
  }

  getProgress(achievementId: string): number {
    return this.achievementProgress.get(achievementId) || 0;
  }

  getAllAchievements(): (Achievement & { unlocked: boolean; progress?: number })[] {
    return ACHIEVEMENTS.map(achievement => ({
      ...achievement,
      unlocked: this.unlockedAchievements.has(achievement.id),
      progress: this.achievementProgress.get(achievement.id),
    }));
  }

  getUnlockedAchievements(): Achievement[] {
    return ACHIEVEMENTS.filter(a => this.unlockedAchievements.has(a.id));
  }

  getTotalPoints(): number {
    return this.getUnlockedAchievements().reduce((sum, a) => sum + a.points, 0);
  }

  getByCategory(category: AchievementCategory): Achievement[] {
    return ACHIEVEMENTS.filter(a => a.category === category);
  }

  private showUnlockNotification(achievement: Achievement): void {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-info">
        <div class="achievement-title">Prestatie Ontgrendeld!</div>
        <div class="achievement-name">${this.getLocalizedName(achievement)}</div>
        <div class="achievement-points">+${achievement.points} punten</div>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });

    // Remove after delay
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 500);
    }, 4000);
  }

  private getLocalizedName(achievement: Achievement): string {
    // TODO: Implement proper localization
    const names: Record<string, string> = {
      'survive_night_1': 'Eerste Nacht',
      'survive_night_2': 'Tweede Nacht',
      'survive_night_3': 'Derde Nacht',
      'survive_night_4': 'Vierde Nacht',
      'survive_night_5': 'Veteraan',
      'survive_night_6': 'Nachtmerrie',
      'survive_night_7_2020': '20/20/20/20 Mode',
      'power_saver': 'Energie Bespaarder',
      'no_power_survive': 'Duisternis',
      'no_cameras': 'Blind Spelen',
      'first_pizza': 'Pizza Vinder',
      'pizza_master': 'Pizza Meester',
      'photographer': 'Fotograaf',
      'rare_shot': 'Zeldzame Opname',
      'golden_freddy_seen': 'Het is mij',
      'all_minigames': 'Arcade Meester',
      'speed_demon': 'Snelheidsduivel',
      'marathon': 'Marathon Loper',
    };
    return names[achievement.id] || achievement.nameKey;
  }
}

// Export singleton
export const achievementManager = new AchievementManager();
export default achievementManager;
