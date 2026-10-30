// Shapes and conventions for combat data. Plain objects only, no Phaser.

export const TEAMS = Object.freeze({ PLAYER: 'player', RUST: 'rust' });

/**
 * Rect relative to the entity origin, facing right (facing = 1).
 * combat mirrors it when facing = -1: worldX = originX + facing * x  (rect spans x..x+w mirrored).
 * @typedef {{x:number,y:number,w:number,h:number}} Rect
 */

/**
 * Attack instance. attackId must be unique per swing (e.g. `${attackerId}:${counter}`),
 * so one swing cannot hit the same target twice.
 * @typedef {Object} HitRequest
 * @property {string} attackerId
 * @property {string} attackId
 * @property {'player'|'rust'} team   attacker team; only the opposing team is hit
 * @property {Rect} hitbox            relative to attacker origin
 * @property {{x:number,y:number}} origin  attacker world position
 * @property {1|-1} facing
 * @property {number} damage
 * @property {number} knockback       horizontal px/s, pushed away from attacker
 * @property {number} hitstun         ms
 * @property {boolean} [special]      Rage Special: with `boss` targets, damage is capped
 * @property {number} [bossDamageCap] max damage per hit vs a boss (only when special/neverKills)
 * @property {boolean} [neverKills]   vs a boss, never reduce below 1 hp
 */

/**
 * Sent by player/enemy once when they spawn so combat can resolve hits.
 * Rect is relative to origin; position is read each frame via getState.
 * @typedef {Object} EntityRegistration
 * @property {string} id
 * @property {'player'|'rust'} team
 * @property {number} maxHp
 * @property {boolean} [boss]         true for bosses; enables bossDamageCap / neverKills handling
 * @property {Rect} hurtbox
 * @property {() => {x:number,y:number,facing:1|-1}} getState
 */

/**
 * @typedef {Object} DamageApplied
 * @property {string} targetId
 * @property {string} attackerId
 * @property {number} amount
 * @property {number} hpAfter
 * @property {number} knockback  signed: positive pushes right
 * @property {number} hitstun    ms
 * @property {boolean} [landed]  true when the blow connected, even if amount is 0 (boss clamped at 1 hp);
 *                               false when parried. Listeners wanting 'blow landed' should use `landed`.
 */

// Data-table conventions. Tables are keyed by id; numbers live here, never in scenes.
// MOVES:   { punch: { damage, knockback, hitstun, hitbox:Rect, startup, active, recovery } }  (ms)
// ENEMIES: { grunt: { maxHp, hurtbox:Rect, speed, moves:[moveId] } }

export const COMBAT_DEFAULTS = Object.freeze({
  PLAYER_MAX_HP: 100,
  GRUNT_MAX_HP: 30,
  BLOCK_DAMAGE_MULT: 0.25,    // fraction of damage taken while guard === 'block'
  BLOCK_KNOCKBACK_MULT: 0.25, // fraction of knockback while blocking
  INVULN_MS_AFTER_HIT: 400, // player only; enemies use hitstun
  AIR_DODGE_LIFT: 30,       // px a target's feet must be off the floor to be out of reach of ground melee (jump over grunts)
});

export const PLAYER_ID = 'player';

// Single source for attack numbers. src/player/moves.js and src/enemies/gruntData.js
// read from here. knockback is horizontal px/s. hitstun and the hitbox rects are
// unchanged from the previous tables: player hitstun is in frames (60 fps), grunt hitstun in ms.
export const PLAYER_MOVE_COMBAT = Object.freeze({
  light1: Object.freeze({ damage: 6,  knockback: 120, hitstun: 14, hitbox: Object.freeze({ x: 20, y: -24, w: 40, h: 24 }) }),
  light2: Object.freeze({ damage: 7,  knockback: 140, hitstun: 14, hitbox: Object.freeze({ x: 20, y: -24, w: 44, h: 24 }) }),
  light3: Object.freeze({ damage: 12, knockback: 320, hitstun: 24, hitbox: Object.freeze({ x: 20, y: -28, w: 52, h: 32 }) }),
  // Jumping flying kick (light press while airborne): big launch (knockback above heavy1), hitbox forward and low.
  airkick: Object.freeze({ damage: 8, knockback: 520, hitstun: 18, hitbox: Object.freeze({ x: 16, y: -22, w: 48, h: 30 }) }),
  heavy1: Object.freeze({ damage: 18, knockback: 380, hitstun: 28, hitbox: Object.freeze({ x: 24, y: -30, w: 56, h: 36 }) }),
});

export const GRUNT_ATTACK_COMBAT = Object.freeze({
  attack: Object.freeze({
    damage: 8, knockback: 220, hitstun: 250,
    hitbox: Object.freeze({ x: 20, y: -65, w: 55, h: 40 }),
  }),
});
