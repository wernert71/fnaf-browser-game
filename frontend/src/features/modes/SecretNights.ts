import type { NightConfig, CustomDifficulty, PlayerProfile } from '@/types';

export class SecretNightsManager {
  /**
   * Check if Night 6 is unlocked
   */
  static isNight6Unlocked(profile: Partial<PlayerProfile>): boolean {
    return (profile.highestNightCompleted || 0) >= 5;
  }

  /**
   * Check if Night 7 (Custom Night) is unlocked
   */
  static isNight7Unlocked(profile: Partial<PlayerProfile>): boolean {
    return (profile.highestNightCompleted || 0) >= 6;
  }

  /**
   * Get Night 6 configuration
   */
  static getNight6Config(): NightConfig {
    return {
      night: 6,
      name: 'Nachtmerrie',
      description: 'Een onmogelijke uitdaging... Alle animatronics op maximale agressie.',
      aiLevels: {
        freddy: 10,
        bonnie: 15,
        chica: 15,
        foxy: 10,
      },
      specialRules: {
        powerDrainMultiplier: 1.3, // Faster power drain
        hourDuration: 75000, // Slightly shorter hours
      },
    };
  }

  /**
   * Get Night 7 configuration with custom difficulty
   */
  static getNight7Config(customDifficulty?: CustomDifficulty): NightConfig {
    const difficulty = customDifficulty || {
      freddy: 10,
      bonnie: 10,
      chica: 10,
      foxy: 10,
    };

    return {
      night: 7,
      name: 'Aangepaste Nacht',
      description: 'Stel je eigen uitdaging in! Pas de moeilijkheid van elke animatronic aan.',
      aiLevels: {
        freddy: Math.min(20, Math.max(0, difficulty.freddy)),
        bonnie: Math.min(20, Math.max(0, difficulty.bonnie)),
        chica: Math.min(20, Math.max(0, difficulty.chica)),
        foxy: Math.min(20, Math.max(0, difficulty.foxy)),
      },
      specialRules: {
        isCustom: true,
        maxDifficulty: 20,
      },
    };
  }

  /**
   * Check if difficulty is the legendary 20/20/20/20 mode
   */
  static is2020Mode(difficulty: CustomDifficulty): boolean {
    return (
      difficulty.freddy === 20 &&
      difficulty.bonnie === 20 &&
      difficulty.chica === 20 &&
      difficulty.foxy === 20
    );
  }

  /**
   * Get preset difficulties for quick selection
   */
  static getPresets(): { name: string; difficulty: CustomDifficulty; description: string }[] {
    return [
      {
        name: 'Makkelijk',
        difficulty: { freddy: 5, bonnie: 5, chica: 5, foxy: 5 },
        description: 'Lage moeilijkheid voor beginners',
      },
      {
        name: 'Normaal',
        difficulty: { freddy: 10, bonnie: 10, chica: 10, foxy: 10 },
        description: 'Gemiddelde uitdaging',
      },
      {
        name: 'Moeilijk',
        difficulty: { freddy: 15, bonnie: 15, chica: 15, foxy: 15 },
        description: 'Aanbevolen voor ervaren spelers',
      },
      {
        name: '20/20/20/20',
        difficulty: { freddy: 20, bonnie: 20, chica: 20, foxy: 20 },
        description: '💀 Maximale waanzin - Alleen voor de dapperen',
      },
      {
        name: 'Foxy Nachtmerrie',
        difficulty: { freddy: 5, bonnie: 5, chica: 5, foxy: 20 },
        description: 'Foxy op maximum, anderen normaal',
      },
      {
        name: 'Freddy Finale',
        difficulty: { freddy: 20, bonnie: 10, chica: 10, foxy: 10 },
        description: 'Freddy is de echte vijand',
      },
    ];
  }

  /**
   * Create custom night UI element
   */
  static createCustomNightUI(
    initialDifficulty: CustomDifficulty,
    onStart: (difficulty: CustomDifficulty) => void
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = 'custom-night-ui';

    const animatronics: { id: keyof CustomDifficulty; name: string; emoji: string }[] = [
      { id: 'freddy', name: 'Freddy', emoji: '🐻' },
      { id: 'bonnie', name: 'Bonnie', emoji: '🐰' },
      { id: 'chica', name: 'Chica', emoji: '🐤' },
      { id: 'foxy', name: 'Foxy', emoji: '🦊' },
    ];

    let currentDifficulty = { ...initialDifficulty };

    container.innerHTML = `
      <h2>Aangepaste Nacht</h2>
      <p class="subtitle">Pas de AI-moeilijkheid aan (0-20)</p>

      <div class="difficulty-sliders">
        ${animatronics
          .map(
            a => `
          <div class="slider-row">
            <span class="animatronic-icon">${a.emoji}</span>
            <span class="animatronic-name">${a.name}</span>
            <input type="range" min="0" max="20" value="${initialDifficulty[a.id]}"
                   class="difficulty-slider" data-animatronic="${a.id}" />
            <span class="difficulty-value" data-for="${a.id}">${initialDifficulty[a.id]}</span>
          </div>
        `
          )
          .join('')}
      </div>

      <div class="presets">
        <p>Presets:</p>
        <div class="preset-buttons">
          ${this.getPresets()
            .map(
              (p, i) => `
            <button class="preset-btn" data-preset="${i}" title="${p.description}">
              ${p.name}
            </button>
          `
            )
            .join('')}
        </div>
      </div>

      <div class="warning ${this.is2020Mode(initialDifficulty) ? 'show' : ''}">
        ⚠️ 20/20/20/20 Mode - Bijna onmogelijk!
      </div>

      <button class="start-btn">Start Nacht</button>
    `;

    // Wire up sliders
    container.querySelectorAll('.difficulty-slider').forEach(slider => {
      const input = slider as HTMLInputElement;
      input.addEventListener('input', () => {
        const id = input.dataset.animatronic as keyof CustomDifficulty;
        const value = parseInt(input.value);
        currentDifficulty[id] = value;

        // Update display
        const display = container.querySelector(`[data-for="${id}"]`);
        if (display) display.textContent = String(value);

        // Update warning
        const warning = container.querySelector('.warning');
        if (warning) {
          warning.classList.toggle('show', this.is2020Mode(currentDifficulty));
        }
      });
    });

    // Wire up presets
    container.querySelectorAll('.preset-btn').forEach(btn => {
      const button = btn as HTMLButtonElement;
      button.addEventListener('click', () => {
        const presetIndex = parseInt(button.dataset.preset || '0');
        const preset = this.getPresets()[presetIndex];
        currentDifficulty = { ...preset.difficulty };

        // Update all sliders
        animatronics.forEach(a => {
          const slider = container.querySelector(`[data-animatronic="${a.id}"]`) as HTMLInputElement;
          const display = container.querySelector(`[data-for="${a.id}"]`);
          if (slider) slider.value = String(currentDifficulty[a.id]);
          if (display) display.textContent = String(currentDifficulty[a.id]);
        });

        // Update warning
        const warning = container.querySelector('.warning');
        if (warning) {
          warning.classList.toggle('show', this.is2020Mode(currentDifficulty));
        }
      });
    });

    // Wire up start button
    const startBtn = container.querySelector('.start-btn');
    startBtn?.addEventListener('click', () => {
      onStart(currentDifficulty);
    });

    return container;
  }
}

export default SecretNightsManager;
