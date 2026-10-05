// Rust grunt data table (Tier 0). Placeholder numbers; tune here only.
// Times in milliseconds, speeds in px/s, rects relative to the entity origin (facing right).
// NOTE: damage/knockback/hitstun values here are placeholders until combat's combatData.js
// is final; the grunt reads them from this table only.
// Sprite key mirrors assets/asset-keys.json sprites["rust.grunt"]. src/config/assetKeys.js does
// not export it yet (outside my folders), so it is declared here.
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

export const GRUNT = {
  team: 'rust',
  spriteKey: GRUNT_SPRITE_KEY,
  maxHp: 30,
  moveSpeed: 90,
  circleSpeed: 55,
  attackRange: 70,      // distance to target at which an attack may start
  circleRadius: 180,    // hold at this distance when no attacker slot is free
  spawnIdleMs: 400,     // idle after spawn before chasing
  telegraphMs: 450,     // visible wind-up before the hit (keep >= 300 for readability)
  attackMs: 250,        // total attack state length
  hitActiveAtMs: 100,   // hit-request is emitted this far into the attack state
  recoverMs: 700,
  hitstunMinMs: 150,
  knockbackDecay: 600,  // px/s^2
  hurtbox: { x: -20, y: -80, w: 40, h: 80 },
  attack: {
    hitbox: { x: 20, y: -65, w: 55, h: 40 },
    damage: 8,
    knockback: 220,
    hitstun: 250,
  },
};

// Max grunts that may be in telegraph/attack at once; others circle.
export const ATTACKER_CAP = 2;
