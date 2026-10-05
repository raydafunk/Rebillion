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
 */

/**
 * Sent by player/enemy once when they spawn so combat can resolve hits.
 * Rect is relative to origin; position is read each frame via getState.
 * @typedef {Object} EntityRegistration
 * @property {string} id
 * @property {'player'|'rust'} team
 * @property {number} maxHp
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
});

export const PLAYER_ID = 'player';
