// Health pickups dropped in the breather between waves. No Phaser.
// A cleared wave with a restPickup drops one item on the walk to the next lock, so the player recovers before the next fight.
export const PICKUP = Object.freeze({
  spriteKey: 'item.health',
  spritePath: 'assets/sprites/Items/health_pick_up/rotations/health_pick_up.png',
  displaySize: 72,
  collectRadius: 50,    // horizontal px from Zed's feet line
  maxAirborne: 60,      // px Zed may be off the ground and still grab it
});

const VIEW_W = 1280;

/** The item to drop once `wave` is cleared, or null (no restPickup, or no next wave to rest before). */
export function pickupDrop(wave, nextWave, groundY) {
  if (!wave || !nextWave || !wave.restPickup) return null;
  // Just short of where the next wave triggers (next lock + half a screen), past the right edge of the cleared screen:
  // Zed has to walk out of the fight to reach it, and playtest showed anything nearer is grabbed the moment the wave ends.
  const x = Math.round(nextWave.lockX + VIEW_W / 2 - 100);
  return { x, y: groundY, heal: wave.restPickup.heal };
}

export function canCollect(pickup, zedX, airborne = 0) {
  return Math.abs(pickup.x - zedX) <= PICKUP.collectRadius && airborne <= PICKUP.maxAirborne;
}
