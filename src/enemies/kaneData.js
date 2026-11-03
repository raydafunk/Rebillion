// "Crusher" Kane, the Level 3 (Greenline Courts) mini-boss. No Phaser.
// STAND-IN: until his five canon moves get a real boss class (like RoyceBoss), Kane is a RustGrunt with his heavy numbers
// from content/enemies/mini-bosses.json (rust-crusher-kane: maxHp 220, moveSpeed 50, range 105, telegraph 850, attack 340, recover 1400,
// damage 20, knockback 420, hitstun 300) and the Breaker skin. One slow heavy swing; Hammer Slam / Hook / Furnace Kick / Steam Vent /
// Uppercut are not implemented yet.
import { GRUNT } from './gruntData.js';

export const KANE_ID = 'rust-crusher-kane';
export const KANE_SKIN = 'rust-breaker';
export const KANE_MAX_HP = 220;

export const KANE = Object.freeze({
  ...GRUNT,
  maxHp: KANE_MAX_HP,
  moveSpeed: 50,
  circleSpeed: 40,
  attackRange: 105,
  telegraphMs: 850,
  recoverMs: 1400,
  hitstunMinMs: 120,
  hurtbox: Object.freeze({ x: -30, y: -110, w: 60, h: 110 }),
  attack: Object.freeze({ hitbox: Object.freeze({ x: 25, y: -90, w: 90, h: 60 }), damage: 20, knockback: 420, hitstun: 300 }),
  variants: undefined,
  jabString: Object.freeze([Object.freeze({ atMs: 120, damage: 20, knockback: 420, hitstun: 300 })]),
  attackMs: 340,
});
