import type { SoundConfig } from '@/types';
import { GameStorage } from '@/utils/storage';

export class SoundEffectsManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer[]> = new Map();
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;

  // Sound definitions
  readonly SOUNDS: Record<string, SoundConfig> = {
    // UI sounds
    door: { id: 'door', file: 'door_slam.mp3', category: 'sfx' },
    camera: { id: 'camera', file: 'camera_switch.mp3', category: 'sfx' },
    button: { id: 'button', file: 'button_click.mp3', category: 'sfx' },

    // Game sounds
    jumpscare: { id: 'jumpscare', file: 'jumpscare_scream.mp3', category: 'sfx', volume: 1.0 },
    powerout: { id: 'powerout', file: 'power_down.mp3', category: 'sfx' },
    victory: { id: 'victory', file: 'victory_chime.mp3', category: 'sfx' },

    // Movement sounds
    footstep_player: { id: 'footstep_player', file: ['footstep_1.mp3', 'footstep_2.mp3', 'footstep_3.mp3'], category: 'sfx', volume: 0.5 },
    footstep_animatronic: { id: 'footstep_animatronic', file: ['metal_step_1.mp3', 'metal_step_2.mp3'], category: 'sfx', volume: 0.7 },
    foxy_running: { id: 'foxy_running', file: 'foxy_sprint.mp3', category: 'sfx' },

    // Ambience
    fan_loop: { id: 'fan_loop', file: 'fan_spinning.mp3', category: 'ambience', loop: true },
    static: { id: 'static', file: 'tv_static.mp3', category: 'ambience', loop: true },
    breathing: { id: 'breathing', file: 'breathing_heavy.mp3', category: 'ambience', loop: true, volume: 0.3 },

    // Interaction sounds
    pizza_collect: { id: 'pizza_collect', file: 'pickup_ding.mp3', category: 'sfx' },
    powerup_activate: { id: 'powerup_activate', file: 'powerup_whoosh.mp3', category: 'sfx' },
    photo_shutter: { id: 'photo_shutter', file: 'camera_shutter.mp3', category: 'sfx' },
    light_switch: { id: 'light_switch', file: 'light_switch.mp3', category: 'sfx' },
    door_knock: { id: 'door_knock', file: 'door_knock.mp3', category: 'sfx' },

    // Phone
    phone_ring: { id: 'phone_ring', file: 'phone_ringing.mp3', category: 'sfx' },
  };

  constructor() {
    // Don't initialize until user interaction (browser policy)
  }

  async init(): Promise<void> {
    if (this.audioContext) return;

    this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Create gain nodes for volume control
    this.masterGain = this.audioContext.createGain();
    this.sfxGain = this.audioContext.createGain();
    this.musicGain = this.audioContext.createGain();
    this.ambienceGain = this.audioContext.createGain();

    // Connect gain nodes
    this.sfxGain.connect(this.masterGain);
    this.musicGain.connect(this.masterGain);
    this.ambienceGain.connect(this.masterGain);
    this.masterGain.connect(this.audioContext.destination);

    // Load volume settings
    const settings = GameStorage.getSettings();
    this.setVolume('sfx', settings.audioVolume);
    this.setVolume('music', settings.musicVolume);
  }

  async preloadSound(id: string): Promise<void> {
    if (!this.audioContext) await this.init();

    const config = this.SOUNDS[id];
    if (!config) {
      console.warn(`Unknown sound: ${id}`);
      return;
    }

    const files = Array.isArray(config.file) ? config.file : [config.file];
    const buffers: AudioBuffer[] = [];

    for (const file of files) {
      try {
        const response = await fetch(`/assets/audio/sfx/${file}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
        buffers.push(audioBuffer);
      } catch (error) {
        console.warn(`Failed to load sound: ${file}`, error);
      }
    }

    if (buffers.length > 0) {
      this.sounds.set(id, buffers);
    }
  }

  async preloadAll(): Promise<void> {
    await this.init();
    const promises = Object.keys(this.SOUNDS).map(id => this.preloadSound(id));
    await Promise.all(promises);
  }

  playSound(id: string, options: { volume?: number; loop?: boolean; pitch?: number } = {}): void {
    if (!this.audioContext) {
      // Fall back to procedural sound
      this.playProceduralSound(id);
      return;
    }

    const buffers = this.sounds.get(id);
    const config = this.SOUNDS[id];

    if (!buffers || buffers.length === 0) {
      // Fall back to procedural sound
      this.playProceduralSound(id);
      return;
    }

    // Pick random buffer if multiple
    const buffer = buffers[Math.floor(Math.random() * buffers.length)];

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    // Apply pitch if specified
    if (options.pitch) {
      source.playbackRate.value = options.pitch;
    }

    // Create gain for this sound
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = (options.volume ?? config?.volume ?? 1.0);

    // Connect to appropriate category gain
    const categoryGain = this.getCategoryGain(config?.category || 'sfx');
    source.connect(gainNode);
    gainNode.connect(categoryGain);

    // Handle looping
    source.loop = options.loop ?? config?.loop ?? false;

    source.start();

    // Track active sources for stopping later
    if (source.loop) {
      this.activeSources.set(id, source);
    }
  }

  stopSound(id: string): void {
    const source = this.activeSources.get(id);
    if (source) {
      source.stop();
      this.activeSources.delete(id);
    }
  }

  stopAll(): void {
    this.activeSources.forEach((source, id) => {
      source.stop();
    });
    this.activeSources.clear();
  }

  setVolume(category: 'master' | 'sfx' | 'music' | 'ambience', value: number): void {
    const gain = {
      master: this.masterGain,
      sfx: this.sfxGain,
      music: this.musicGain,
      ambience: this.ambienceGain,
    }[category];

    if (gain) {
      gain.gain.value = Math.max(0, Math.min(1, value));
    }
  }

  private getCategoryGain(category: string): GainNode {
    switch (category) {
      case 'music':
        return this.musicGain!;
      case 'ambience':
        return this.ambienceGain!;
      default:
        return this.sfxGain!;
    }
  }

  /**
   * Procedural sound generation (fallback when audio files not loaded)
   */
  private playProceduralSound(type: string): void {
    if (!this.audioContext) {
      this.init();
      return;
    }

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain || ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'door':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(100, now);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialDecayTo(0.001, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
        break;

      case 'camera':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialDecayTo(0.001, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        break;

      case 'jumpscare':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.3);
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialDecayTo(0.001, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;

      case 'powerout':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, now);
        oscillator.frequency.exponentialRampToValueAtTime(55, now + 2);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialDecayTo(0.001, now + 2);
        oscillator.start(now);
        oscillator.stop(now + 2);
        break;

      case 'victory':
        // Three ascending tones
        [523, 659, 784].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(this.sfxGain || ctx.destination);
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.2, now + i * 0.15);
          gain.gain.exponentialDecayTo(0.001, now + i * 0.15 + 0.3);
          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 0.3);
        });
        return;

      case 'pizza_collect':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, now);
        oscillator.frequency.setValueAtTime(1320, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialDecayTo(0.001, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
        break;

      case 'photo_shutter':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(2000, now);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialDecayTo(0.001, now + 0.05);
        oscillator.start(now);
        oscillator.stop(now + 0.05);
        break;

      default:
        // Generic beep
        oscillator.type = 'sine';
        oscillator.frequency.value = 440;
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialDecayTo(0.001, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
    }
  }
}

// Polyfill for exponentialDecayTo
declare global {
  interface AudioParam {
    exponentialDecayTo(value: number, endTime: number): void;
  }
}

AudioParam.prototype.exponentialDecayTo = function(value: number, endTime: number) {
  this.exponentialRampToValueAtTime(Math.max(0.0001, value), endTime);
};

// Export singleton
export const soundEffects = new SoundEffectsManager();
export default soundEffects;
