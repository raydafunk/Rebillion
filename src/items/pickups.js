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

/**
 * Level-end loot: the last wave's `finishDrop` ({ heals: [n, ...], weapons: n }) scatters health items and throwable weapons across the
 * cleared fight screen. Items are spread evenly around its centre so Zed can walk through them all before the exit.
 * Health items are { kind:'health', heal }, weapons { kind:'weapon' }; all have x, y.
 */
export function finishDrops(wave, groundY) {
  const fd = wave && wave.finishDrop;
  if (!fd) return [];
  const heals = (fd.heals || []).map((heal) => ({ kind: 'health', heal }));
  const weapons = Array.from({ length: fd.weapons || 0 }, () => ({ kind: 'weapon' }));
  // Alternate health and weapons along the row so neither is bunched at one end.
  const items = [];
  for (let i = 0; i < Math.max(heals.length, weapons.length); i++) { if (heals[i]) items.push(heals[i]); if (weapons[i]) items.push(weapons[i]); }
  const centre = wave.lockX + VIEW_W / 2, gap = Math.min(150, 900 / Math.max(1, items.length));
  return items.map((it, i) => ({ ...it, x: Math.round(centre + (i - (items.length - 1) / 2) * gap), y: groundY - (i % 2 ? 24 : 0) })); // two depth lines, not one file
}

export function canCollect(pickup, zedX, airborne = 0) {
  return Math.abs(pickup.x - zedX) <= PICKUP.collectRadius && airborne <= PICKUP.maxAirborne;
}

/**
 * Boss mercy drop: while a boss fight is on and Zed is low, the boss "drops" a health item so a hard fight stays winnable.
 * Rate-limited: at most maxPerFight per fight, at least cooldownMs apart; the first needs Zed under belowFrac of his health.
 */
export const LOW_HEALTH_DROP = Object.freeze({ belowFrac: 0.35, heal: 30, cooldownMs: 12000, maxPerFight: 2 });
export const createLowHealthDrop = () => ({ drops: 0, lastAt: -Infinity });
/** Heal amount to drop now (and records it), or 0. nowMs is the scene clock. */
export function lowHealthDrop(state, hp, maxHp, nowMs, bossAlive, cfg = LOW_HEALTH_DROP) {
  if (!bossAlive || !(hp > 0) || hp / maxHp >= cfg.belowFrac) return 0;
  if (state.drops >= cfg.maxPerFight || nowMs - state.lastAt < cfg.cooldownMs) return 0;
  state.drops++; state.lastAt = nowMs;
  return cfg.heal;
}
