import type { GameState, CustomDifficulty } from '@/types';

export interface EasyModeConfig {
  aiMultiplier: number;
  powerDrainMultiplier: number;
  hourDurationMultiplier: number;
  jumpscareEnabled: boolean;
  audioWarningVolume: number;
  showAnimatronicIndicators: boolean;
}

export const EASY_MODE_CONFIG: EasyModeConfig = {
  aiMultiplier: 0.6, // 40% reduction in AI
  powerDrainMultiplier: 0.7, // 30% slower power drain
  hourDurationMultiplier: 1.2, // 20% longer hours
  jumpscareEnabled: false, // No jumpscares
  audioWarningVolume: 1.5, // Louder audio cues
  showAnimatronicIndicators: true, // Show position hints
};

export class EasyModeModifier {
  /**
   * Apply easy mode modifications to game state
   */
  static applyToGameState(gameState: GameState): GameState {
    return {
      ...gameState,
      easyMode: true,
      jumpscareEnabled: EASY_MODE_CONFIG.jumpscareEnabled,
      powerDrainMultiplier: EASY_MODE_CONFIG.powerDrainMultiplier,
      hourDurationMultiplier: EASY_MODE_CONFIG.hourDurationMultiplier,
      showAnimatronicIndicators: EASY_MODE_CONFIG.showAnimatronicIndicators,
    };
  }

  /**
   * Apply easy mode to animatronic AI levels
   */
  static applyToAiLevels(aiLevels: CustomDifficulty): CustomDifficulty {
    return {
      freddy: Math.floor(aiLevels.freddy * EASY_MODE_CONFIG.aiMultiplier),
      bonnie: Math.floor(aiLevels.bonnie * EASY_MODE_CONFIG.aiMultiplier),
      chica: Math.floor(aiLevels.chica * EASY_MODE_CONFIG.aiMultiplier),
      foxy: Math.floor(aiLevels.foxy * EASY_MODE_CONFIG.aiMultiplier),
    };
  }

  /**
   * Get modified power drain rate
   */
  static getModifiedPowerDrain(baseDrain: number, isEasyMode: boolean): number {
    if (!isEasyMode) return baseDrain;
    return baseDrain * EASY_MODE_CONFIG.powerDrainMultiplier;
  }

  /**
   * Get modified hour duration
   */
  static getModifiedHourDuration(baseDuration: number, isEasyMode: boolean): number {
    if (!isEasyMode) return baseDuration;
    return baseDuration * EASY_MODE_CONFIG.hourDurationMultiplier;
  }

  /**
   * Get modified animatronic move interval
   */
  static getModifiedMoveInterval(baseInterval: number, isEasyMode: boolean): number {
    if (!isEasyMode) return baseInterval;
    // Slower movement = longer intervals
    return baseInterval * (1 / EASY_MODE_CONFIG.aiMultiplier);
  }

  /**
   * Check if jumpscare should play
   */
  static shouldPlayJumpscare(isEasyMode: boolean): boolean {
    if (!isEasyMode) return true;
    return EASY_MODE_CONFIG.jumpscareEnabled;
  }

  /**
   * Get UI label
   */
  static getLabel(): string {
    return '🐣 Makkelijke Modus';
  }

  /**
   * Get UI description
   */
  static getDescription(): string {
    return 'Langzamere animatronics, meer stroom, geen jumpscares';
  }

  /**
   * Get feature list for UI
   */
  static getFeatures(): string[] {
    return [
      '🐌 Animatronics bewegen 40% langzamer',
      '🔋 Stroom verbruikt 30% langzamer',
      '⏰ Uren duren 20% langer',
      '😌 Geen jumpscares (alleen game over)',
      '📍 Positie-indicatoren op camera kaart',
      '🔊 Luidere waarschuwingsgeluiden',
    ];
  }

  /**
   * Create easy mode toggle element
   */
  static createToggleElement(isEnabled: boolean, onChange: (enabled: boolean) => void): HTMLElement {
    const container = document.createElement('div');
    container.className = 'easy-mode-toggle';
    container.innerHTML = `
      <label class="toggle-label">
        <input type="checkbox" ${isEnabled ? 'checked' : ''} />
        <span class="toggle-text">${this.getLabel()}</span>
      </label>
      <p class="toggle-description">${this.getDescription()}</p>
      <ul class="features-list">
        ${this.getFeatures().map(f => `<li>${f}</li>`).join('')}
      </ul>
    `;

    const checkbox = container.querySelector('input') as HTMLInputElement;
    checkbox.addEventListener('change', () => {
      onChange(checkbox.checked);
    });

    return container;
  }
}

export default EasyModeModifier;
