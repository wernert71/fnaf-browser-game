import type { GameSession, StarRating, RatingBreakdown } from '@/types';

export class StarRatingSystem {
  /**
   * Calculate star rating for a completed game session
   */
  calculateRating(session: Partial<GameSession>): StarRating {
    let stars = 0;
    const breakdown: RatingBreakdown = {
      powerBonus: 0,
      timeBonus: 0,
      noCamerasBonus: 0,
      noDeathsBonus: 0,
      difficultyMultiplier: 1,
    };

    // Must survive to get any rating
    if (!session.survived) {
      return { stars: 0, breakdown, score: 0 };
    }

    // Base: Survival = 1 star
    stars += 1;

    // Power efficiency (max 2 stars)
    const finalPower = session.finalPower || 0;
    if (finalPower >= 50) {
      stars += 2;
      breakdown.powerBonus = 2;
    } else if (finalPower >= 25) {
      stars += 1;
      breakdown.powerBonus = 1;
    }

    // Speed bonus (full night in under 7 minutes real time = 1 star)
    // Night duration is ~9 minutes (540 seconds) normally
    const timeSeconds = session.timeSurvivedSeconds || 540;
    if (timeSeconds <= 420) {
      // Under 7 minutes
      stars += 1;
      breakdown.timeBonus = 1;
    }

    // Additional bonuses could come from:
    // - No cameras used (tracked elsewhere)
    // - No deaths in session (multiplayer)

    // Difficulty multiplier for higher nights
    const nightNumber = session.nightNumber || 1;
    breakdown.difficultyMultiplier = 1 + (nightNumber - 1) * 0.1;

    // Easy mode halves the multiplier
    if (session.easyMode) {
      breakdown.difficultyMultiplier *= 0.5;
    }

    // Cap at 5 stars
    stars = Math.min(5, stars);

    // Calculate score
    const score = this.calculateScore(session, breakdown);

    return { stars, breakdown, score };
  }

  /**
   * Calculate numerical score for leaderboards
   */
  private calculateScore(session: Partial<GameSession>, breakdown: RatingBreakdown): number {
    let base = (session.nightNumber || 1) * 1000;

    // Power bonus
    base += (session.finalPower || 0) * 10;

    // Collectibles bonus
    base += (session.pizzaSlicesFound || 0) * 50;
    base += (session.photosTaken || 0) * 25;

    // Star rating bonus
    base += breakdown.powerBonus * 100;
    base += breakdown.timeBonus * 150;

    // Apply difficulty multiplier
    return Math.floor(base * breakdown.difficultyMultiplier);
  }

  /**
   * Get star display elements
   */
  getStarDisplay(rating: StarRating): string {
    const filled = '⭐'.repeat(rating.stars);
    const empty = '☆'.repeat(5 - rating.stars);
    return filled + empty;
  }

  /**
   * Get rating message based on stars
   */
  getRatingMessage(stars: number): string {
    const messages: Record<number, string> = {
      0: 'Probeer het opnieuw!',
      1: 'Overleefd!',
      2: 'Goed gedaan!',
      3: 'Geweldig!',
      4: 'Uitstekend!',
      5: 'Perfect!',
    };
    return messages[stars] || messages[0];
  }

  /**
   * Render star rating to DOM element
   */
  renderToElement(element: HTMLElement, rating: StarRating): void {
    element.innerHTML = `
      <div class="star-rating">
        <div class="stars">${this.getStarDisplay(rating)}</div>
        <div class="rating-message">${this.getRatingMessage(rating.stars)}</div>
        <div class="score">Score: ${rating.score.toLocaleString()}</div>
        <div class="breakdown">
          ${rating.breakdown.powerBonus > 0 ? `<span class="bonus">🔋 +${rating.breakdown.powerBonus * 100}</span>` : ''}
          ${rating.breakdown.timeBonus > 0 ? `<span class="bonus">⚡ +${rating.breakdown.timeBonus * 150}</span>` : ''}
          ${rating.breakdown.difficultyMultiplier !== 1 ? `<span class="multiplier">×${rating.breakdown.difficultyMultiplier.toFixed(1)}</span>` : ''}
        </div>
      </div>
    `;
  }
}

// Export singleton
export const starRatingSystem = new StarRatingSystem();
export default starRatingSystem;
