// "Railgun" Royce, the Level 2 (Mustard Row) mini-boss. No Phaser.
// STAND-IN: until his five canon moves (Baton Combo, Charging Dash, Shockwave Slam, Rail Trap, Taser Burst) are built he fights with the
// grunt AI and jab string (the Baton Combo, in effect), with the boss stat block from content/enemies/mini-bosses.json (maxHp 160, 500 ms wind-up).
// He is registered as a boss (health bar + victory card keyed by ROYCE_ID) but is NOT flagged isBoss: that flag also means Dugan's art and voice.
import { GRUNT } from './gruntData.js';

export const ROYCE_ID = 'rust-railgun-royce';

export const ROYCE = Object.freeze({
  ...GRUNT,
  maxHp: 160,
  moveSpeed: 105,         // content stat is 85; the grunt chase needs a little more to keep pressure on the player
  circleSpeed: 85,
  attackRange: 80,
  telegraphMs: 500,       // Baton Combo wind-up
  recoverMs: 600,
  hitstunMinMs: 160,      // heavier than a grunt (300): a juggle cannot lock him
  knockbackScale: 0.35,
  spawnIdleMs: 500,
  hurtbox: Object.freeze({ x: -26, y: -96, w: 52, h: 96 }),
  visualScale: 1.25,      // drawn larger than a grunt
  tint: 0x9ad8ea,         // cool cyan wash: the scanner-visor colour, so he reads as a different unit
});
