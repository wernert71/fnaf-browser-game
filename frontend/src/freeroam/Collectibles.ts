import * as THREE from 'three';
import type { PizzaSlice, RoomId, Vector3 } from '@/types';
import { GameStorage } from '@/utils/storage';
import { eventBus } from '@/core/EventBus';
import { soundEffects } from '@/features/audio/SoundEffects';

interface PizzaLocation {
  id: string;
  room: RoomId;
  position: Vector3;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

interface CollectibleMesh {
  id: string;
  mesh: THREE.Mesh;
  glow: THREE.PointLight;
  collected: boolean;
  animationPhase: number;
}

export class CollectibleManager {
  private scene: THREE.Scene;
  private collectibles: Map<string, CollectibleMesh> = new Map();
  private collectedIds: Set<string> = new Set();

  // Pizza slice spawn points per room
  private readonly PIZZA_LOCATIONS: PizzaLocation[] = [
    // Easy - visible locations
    { id: 'pizza_stage_1', room: 'stage', position: { x: -5, y: 0.5, z: -3 }, difficulty: 'easy' },
    { id: 'pizza_dining_1', room: 'dining', position: { x: 3, y: 0.5, z: 5 }, difficulty: 'easy' },

    // Medium - slightly hidden
    { id: 'pizza_dining_2', room: 'dining', position: { x: -6, y: 1.2, z: -2 }, difficulty: 'medium' },
    { id: 'pizza_westHall_1', room: 'westHall', position: { x: 0, y: 0.5, z: -4 }, difficulty: 'medium' },
    { id: 'pizza_eastHall_1', room: 'eastHall', position: { x: 0, y: 0.5, z: 4 }, difficulty: 'medium' },

    // Hard - dark rooms or hidden spots
    { id: 'pizza_kitchen_1', room: 'kitchen', position: { x: 0, y: 0.8, z: -3 }, difficulty: 'hard' },
    { id: 'pizza_backstage_1', room: 'backstage', position: { x: 2, y: 1.5, z: 0 }, difficulty: 'hard' },

    // Extreme - near animatronics
    { id: 'pizza_pirate_1', room: 'pirateCove', position: { x: -2, y: 0.3, z: 1 }, difficulty: 'extreme' },
  ];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.loadCollectedFromStorage();
  }

  private loadCollectedFromStorage(): void {
    const progress = GameStorage.getLocalProgress();
    progress.pizzaSlicesCollected.forEach(id => this.collectedIds.add(id));
  }

  /**
   * Spawn collectibles for a specific room
   */
  spawnCollectiblesForRoom(roomId: RoomId): void {
    // Clear existing collectibles for this room
    this.clearRoomCollectibles(roomId);

    const roomCollectibles = this.PIZZA_LOCATIONS.filter(p => p.room === roomId);

    for (const loc of roomCollectibles) {
      if (this.collectedIds.has(loc.id)) continue; // Already collected

      const collectible = this.createPizzaSlice(loc);
      this.collectibles.set(loc.id, collectible);
      this.scene.add(collectible.mesh);
      this.scene.add(collectible.glow);
    }
  }

  private clearRoomCollectibles(roomId: RoomId): void {
    const roomLocations = this.PIZZA_LOCATIONS.filter(p => p.room === roomId);
    for (const loc of roomLocations) {
      const collectible = this.collectibles.get(loc.id);
      if (collectible) {
        this.scene.remove(collectible.mesh);
        this.scene.remove(collectible.glow);
        this.collectibles.delete(loc.id);
      }
    }
  }

  private createPizzaSlice(location: PizzaLocation): CollectibleMesh {
    // Create pizza slice geometry (triangular for slice shape)
    const geometry = new THREE.ConeGeometry(0.25, 0.05, 3);
    geometry.rotateX(Math.PI / 2);

    const material = new THREE.MeshStandardMaterial({
      color: 0xffa500,
      emissive: 0xffa500,
      emissiveIntensity: 0.3,
      metalness: 0.1,
      roughness: 0.8,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(location.position.x, location.position.y, location.position.z);
    mesh.castShadow = true;

    // Add glow effect
    const glow = new THREE.PointLight(0xffaa00, 0.5, 3);
    glow.position.copy(mesh.position);

    return {
      id: location.id,
      mesh,
      glow,
      collected: false,
      animationPhase: Math.random() * Math.PI * 2,
    };
  }

  /**
   * Update collectibles animation and check for collection
   */
  update(delta: number, playerPosition: THREE.Vector3): void {
    for (const [id, collectible] of this.collectibles) {
      if (collectible.collected) continue;

      // Floating animation
      collectible.animationPhase += delta * 2;
      const baseY = this.getLocationById(id)?.position.y || 0.5;
      collectible.mesh.position.y = baseY + Math.sin(collectible.animationPhase) * 0.1;

      // Rotation animation
      collectible.mesh.rotation.y += delta;

      // Glow pulsing
      const glowIntensity = 0.3 + Math.sin(collectible.animationPhase * 2) * 0.2;
      collectible.glow.intensity = glowIntensity;
      collectible.glow.position.copy(collectible.mesh.position);

      // Check player proximity for collection
      const distance = playerPosition.distanceTo(collectible.mesh.position);
      if (distance < 1.5) {
        this.collect(id);
      }
    }
  }

  private getLocationById(id: string): PizzaLocation | undefined {
    return this.PIZZA_LOCATIONS.find(p => p.id === id);
  }

  private collect(id: string): void {
    const collectible = this.collectibles.get(id);
    if (!collectible || collectible.collected) return;

    collectible.collected = true;
    this.collectedIds.add(id);

    // Save to storage
    GameStorage.collectPizzaSlice(id);

    // Play sound
    soundEffects.playSound('pizza_collect');

    // Play collect animation
    this.playCollectAnimation(collectible);

    // Emit event
    eventBus.emit('pizza_collected', {
      sliceId: id,
      totalCollected: this.collectedIds.size,
      totalSlices: this.PIZZA_LOCATIONS.length,
    });

    // Show UI feedback
    this.showCollectFeedback(collectible);
  }

  private playCollectAnimation(collectible: CollectibleMesh): void {
    const startY = collectible.mesh.position.y;
    const startScale = 1;
    let progress = 0;

    const animate = () => {
      progress += 0.05;

      if (progress >= 1) {
        // Remove from scene
        this.scene.remove(collectible.mesh);
        this.scene.remove(collectible.glow);
        return;
      }

      // Rise and shrink
      collectible.mesh.position.y = startY + progress * 2;
      const scale = startScale * (1 - progress);
      collectible.mesh.scale.set(scale, scale, scale);

      // Spin faster
      collectible.mesh.rotation.y += 0.3;

      // Fade glow
      collectible.glow.intensity = 0.5 * (1 - progress);

      requestAnimationFrame(animate);
    };

    animate();
  }

  private showCollectFeedback(collectible: CollectibleMesh): void {
    // Create floating text
    const feedback = document.createElement('div');
    feedback.className = 'collect-feedback';
    feedback.innerHTML = `
      <span class="icon">🍕</span>
      <span class="text">+1 Pizza Slice!</span>
      <span class="progress">${this.collectedIds.size}/${this.PIZZA_LOCATIONS.length}</span>
    `;

    document.body.appendChild(feedback);

    // Animate
    requestAnimationFrame(() => {
      feedback.classList.add('show');
    });

    // Remove after delay
    setTimeout(() => {
      feedback.classList.remove('show');
      setTimeout(() => feedback.remove(), 500);
    }, 2000);
  }

  /**
   * Get collection progress
   */
  getProgress(): { collected: number; total: number; percentage: number } {
    return {
      collected: this.collectedIds.size,
      total: this.PIZZA_LOCATIONS.length,
      percentage: (this.collectedIds.size / this.PIZZA_LOCATIONS.length) * 100,
    };
  }

  /**
   * Get remaining slice locations for a room
   */
  getRemainingInRoom(roomId: RoomId): PizzaLocation[] {
    return this.PIZZA_LOCATIONS.filter(
      p => p.room === roomId && !this.collectedIds.has(p.id)
    );
  }

  /**
   * Check if a specific slice is collected
   */
  isCollected(sliceId: string): boolean {
    return this.collectedIds.has(sliceId);
  }

  /**
   * Reset all collectibles (for new game)
   */
  reset(): void {
    // Clear scene
    for (const [_, collectible] of this.collectibles) {
      this.scene.remove(collectible.mesh);
      this.scene.remove(collectible.glow);
    }
    this.collectibles.clear();

    // Don't clear storage - collectibles are persistent
  }

  /**
   * Debug: Reset all collected slices
   */
  debugResetAll(): void {
    this.collectedIds.clear();
    // Would also need to clear from storage
  }
}

export default CollectibleManager;
