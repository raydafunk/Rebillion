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

// Rust Jab 1-2-3. atMs = when each hit-request is emitted, measured from the start of the attack state.
// Per-hit numbers are the shared grunt attack numbers from combatData.js.
const JAB_STRING = Object.freeze([70, 150, 240].map((atMs) => Object.freeze({
  atMs,
  damage: GRUNT_ATTACK_COMBAT.attack.damage,
  knockback: GRUNT_ATTACK_COMBAT.attack.knockback,
  hitstun: GRUNT_ATTACK_COMBAT.attack.hitstun,
})));

// Attack variants (parry mix-up). One is picked per attack, before the wind-up, so the cue can show which it is.
//   holdMs   : extra wind-up before the swing (the pose is held; the closing ring simply takes longer)
//   hits     : hit-requests, atMs from the start of the attack state (same animation, same total length as the plain string)
//   markIndex: the hit the cue ring is aimed at (the one worth parrying); kind 'finisher' draws it orange
// The ring always closes PARRY_CUE_LEAD_MS before its hit, so "press parry when the ring closes" is right for every variant.
export const PARRY_CUE_LEAD_MS = 80;
const LIGHT_HITS = JAB_STRING;
// Missing the ring is punished: the heavy finisher and the flurry after it PIERCE the player's 400 ms post-hit invulnerability
// (otherwise a landed first jab would swallow them), so an unparried finisher is a real combo. A parry stuns the grunt and
// cancels every hit still to come, so the flurry only happens when the finisher was not parried (blocked = chip damage only).
export const FLURRY = Object.freeze({ damage: 6, knockback: 150, hitstun: 250, count: 2, gapMs: 90 });
const FINISHER_AT = JAB_STRING[2].atMs;
const FINISHER_HITS = Object.freeze([
  JAB_STRING[0], JAB_STRING[1],
  Object.freeze({ atMs: FINISHER_AT, pierceInvuln: true,
    damage: GRUNT_ATTACK_COMBAT.attack.damage * 2,
    knockback: Math.round(GRUNT_ATTACK_COMBAT.attack.knockback * 1.6),
    hitstun: Math.round(GRUNT_ATTACK_COMBAT.attack.hitstun * 1.5) }),
  ...Array.from({ length: FLURRY.count }, (_, i) => Object.freeze({
    atMs: FINISHER_AT + FLURRY.gapMs * (i + 1), pierceInvuln: true,
    damage: FLURRY.damage, knockback: FLURRY.knockback, hitstun: FLURRY.hitstun })),
]);
const ATTACK_TAIL_MS = 150;
const variant = (id, weight, holdMs, hits, markIndex, kind) => Object.freeze({
  id, weight, holdMs, hits, markIndex, kind, attackMs: hits[hits.length - 1].atMs + ATTACK_TAIL_MS,
});
export const ATTACK_VARIANTS = Object.freeze([
  variant('string', 3, 0, LIGHT_HITS, 0, 'strike'),
  variant('hold', 2, 260, LIGHT_HITS, 0, 'strike'),
  variant('finisher', 3, 0, FINISHER_HITS, 2, 'finisher'),
  variant('hold-finisher', 1, 260, FINISHER_HITS, 2, 'finisher'),
]);

/** Weighted pick that never repeats lastId back to back. rng: () => [0,1). */
export function pickAttackVariant(rng = Math.random, lastId = null, variants = ATTACK_VARIANTS) {
  const pool = variants.filter((v) => v.id !== lastId);
  const total = pool.reduce((n, v) => n + v.weight, 0);
  let r = rng() * total;
  for (const v of pool) { r -= v.weight; if (r < 0) return v; }
  return pool[pool.length - 1];
}

export const GRUNT = {
  team: 'rust',
  spriteKey: GRUNT_SPRITE_KEY,
  maxHp: COMBAT_DEFAULTS.GRUNT_MAX_HP,
  moveSpeed: 135,
  circleSpeed: 85,
  laneTolerance: 22,    // max vertical (depth) offset at which an attack may start; otherwise close the gap in y first
  attackRange: 70,      // distance to target at which an attack may start
  circleRadius: 180,    // hold at this distance when no attacker slot is free
  spawnIdleMs: 250,     // idle after spawn before chasing
  telegraphMs: 360,     // visible wind-up before the hit (keep >= 300 for readability)
  attackMs: JAB_STRING[JAB_STRING.length - 1].atMs + 150, // total attack state length: last jab + follow-through
  jabString: JAB_STRING, // 1-2-3 Rust Jab: one hit-request per entry, each with its own attackId
  variants: ATTACK_VARIANTS, // parry mix-up patterns; RustGrunt uses plain jabString unless it is given a pickVariant
  recoverMs: 200,
  hitstunMinMs: 300,
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
