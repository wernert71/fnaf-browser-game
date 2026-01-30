// FNAF Game - TypeScript Entry Point
// This file initializes the game and connects the TypeScript modules

import { eventBus } from '@/core/EventBus';
import { GameStorage } from '@/utils/storage';
import { apiClient } from '@/api/ApiClient';

// Re-export types for use in JavaScript files during migration
export * from '@/types';
export { eventBus, GameStorage, apiClient };

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('FNAF Game initialized (TypeScript)');

  // Load saved settings
  const settings = GameStorage.getSettings();
  console.log('Loaded settings:', settings);

  // Check if user is authenticated
  if (apiClient.isAuthenticated()) {
    console.log('User is authenticated');
    // Could load profile here
  }

  // Emit ready event
  eventBus.emit('game_ready', { timestamp: Date.now() });
});

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  eventBus.emit('error', { error: event.error, message: event.message });
});

// Export for use in non-module scripts
declare global {
  interface Window {
    FNAF: {
      eventBus: typeof eventBus;
      storage: typeof GameStorage;
      api: typeof apiClient;
    };
  }
}

window.FNAF = {
  eventBus,
  storage: GameStorage,
  api: apiClient,
};
