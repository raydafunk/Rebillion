// Enemy kinds a wave can mix (wave.mix lists kind ids, cycled in spawn order). No Phaser.
// Gameplay is still the grunt's AI; a kind changes health, speed and (for the view) a tint so the mix reads on screen.
import { SPECIALIST_RANGED } from './specialistRanged.js';
// Ids match content/enemies and the level files. Unknown ids fall back to the plain grunt.
export const KINDS = Object.freeze({
  grunt: Object.freeze({ skin: 'grunt', hpMult: 1, speedMult: 1, tint: null }),
  'rust-watcher': Object.freeze({ skin: 'rust-watcher', hpMult: 1.5, speedMult: 1.1, tint: 0xffd9a0 }), // tougher and quicker, amber wash
  'rust-specialist': Object.freeze({ skin: 'rust-specialist', hpMult: 1.3, speedMult: 1.05, tint: 0xd9a066, ranged: SPECIALIST_RANGED }), // Copper Fang rank and file: a bit tougher, copper wash; also fires Taser volleys then follows with the baton (specialistRanged.js)
  'rust-ranger': Object.freeze({ skin: 'rust-ranger', hpMult: 1.5, speedMult: 1.25, tint: 0xa0e0f0 }), // quickest, 1.5x health to match the Level 4 Ranger waves, cool cyan wash
  'rust-breaker': Object.freeze({ skin: 'rust-breaker', hpMult: 3, speedMult: 0.9, tint: null }), // Rust Bruiser: the Breakers' big guys, heavy and a touch slower
  'rust-breaker-2': Object.freeze({ skin: 'rust-breaker-2', hpMult: 3, speedMult: 0.9, tint: null }), // Breaker Type 2 as a mix kind
});
export const kindFor = (id) => KINDS[id] || KINDS.grunt;
export const SPEED_MULT_RANGE = Object.freeze([0.5, 2]);

/**
 * Which spawn indexes (0-based) of a wave are elites. Default: the last `n` (the wave opens on the small fry and ends on the heavies).
 * spread: scatter them evenly through the back 55 percent of the wave instead, so heavies arrive between the others.
 */
export function elitePositions(count, n, spread = false) {
  const out = new Set();
  if (!n || n < 1) return out;
  if (!spread) { for (let i = Math.max(0, count - n); i < count; i++) out.add(i); return out; }
  const lo = count * 0.45, span = count * 0.55 / n;
  for (let k = 0; k < n; k++) out.add(Math.min(count - 1, Math.floor(lo + (k + 0.5) * span)));
  return out;
}
