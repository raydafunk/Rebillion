// Rust grunt data table (Tier 0). Placeholder numbers; tune here only.
// Times in milliseconds, speeds in px/s, rects relative to the entity origin (facing right).
// maxHp and attack damage/knockback/hitstun are read from src/shared/combatData.js (single source).
// Sprite key mirrors assets/asset-keys.json sprites["rust.grunt"]. src/config/assetKeys.js does
// not export it yet (outside my folders), so it is declared here.
import { COMBAT_DEFAULTS, GRUNT_ATTACK_COMBAT } from '../shared/combatData.js';

export const GRUNT_SPRITE_KEY = 'rust.grunt';
export const GRUNT_ANIMS = {
  idle: 'rust.grunt.idle',
  approach: 'rust.grunt.walk',
  telegraph: 'rust.grunt.telegraph',
  attack: 'rust.grunt.attack',
  hitstun: 'rust.grunt.hit',
  dead: 'rust.grunt.ko',
  recover: 'rust.grunt.idle',
};
export const TELEGRAPH_FX_KEY = 'fx.telegraph';

// Rust Jab 1-2-3. atMs = when each hit-request is emitted, measured from the start of the attack state.
// Per-hit numbers are the shared grunt attack numbers from combatData.js.
const JAB_STRING = Object.freeze([100, 260, 420].map((atMs) => Object.freeze({
  atMs,
  damage: GRUNT_ATTACK_COMBAT.attack.damage,
  knockback: GRUNT_ATTACK_COMBAT.attack.knockback,
  hitstun: GRUNT_ATTACK_COMBAT.attack.hitstun,
})));

export const GRUNT = {
  team: 'rust',
  spriteKey: GRUNT_SPRITE_KEY,
  maxHp: COMBAT_DEFAULTS.GRUNT_MAX_HP,
  moveSpeed: 90,
  circleSpeed: 55,
  laneTolerance: 22,    // max vertical (depth) offset at which an attack may start; otherwise close the gap in y first
  attackRange: 70,      // distance to target at which an attack may start
  circleRadius: 180,    // hold at this distance when no attacker slot is free
  spawnIdleMs: 400,     // idle after spawn before chasing
  telegraphMs: 450,     // visible wind-up before the hit (keep >= 300 for readability)
  attackMs: JAB_STRING[JAB_STRING.length - 1].atMs + 150, // total attack state length: last jab + follow-through
  jabString: JAB_STRING, // 1-2-3 Rust Jab: one hit-request per entry, each with its own attackId
  recoverMs: 700,
  hitstunMinMs: 150,
  knockbackDecay: 600,  // px/s^2
  hurtbox: { x: -20, y: -80, w: 40, h: 80 },
  attack: {
    hitbox: { x: 20, y: -65, w: 55, h: 40 },
    damage: GRUNT_ATTACK_COMBAT.attack.damage,
    knockback: GRUNT_ATTACK_COMBAT.attack.knockback,
    hitstun: GRUNT_ATTACK_COMBAT.attack.hitstun,
  },
};

// Max grunts that may be in telegraph/attack at once; others circle.
export const ATTACKER_CAP = 2;
