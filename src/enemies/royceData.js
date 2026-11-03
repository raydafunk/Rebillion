// "Railgun" Royce, the Level 2 (Mustard Row) mini-boss. No Phaser. A real boss now (RoyceBoss.js), not a grunt stand-in.
// Numbers mirror content/enemies/mini-bosses.json (rust-railgun-royce): maxHp 160, moveSpeed 85, telegraphs 500/650/750/800/550 ms.
// Times in ms, speeds in px/s, rects relative to the entity origin (feet) facing right.
// The five canon moves: Baton Combo, Charging Dash, Shockwave Slam, Rail Trap, Taser Burst (+ a simple Block). He is the game's stun mechanic:
// Taser Burst and Rail Trap lock Zed's inputs for a short hitstun (never more than 600 ms, so the player learns to avoid it rather than die to it).
// Stats, timings and layouts are proposed values for playtest (the content file marks them invented).
import { COMBAT_DEFAULTS } from '../shared/combatData.js';

export const ROYCE_ID = 'rust-railgun-royce';
export const ROYCE_SPRITE_KEY = 'rust.railgun-royce';
export const ROYCE_MAX_HP = 160;

// BLOCK (simple guard), same rules as Dugan's: when Zed starts a melee swing near him he may raise his arms; while blocking the hit resolver
// reads guard:'block' and applies the block multipliers. A heavy hit (damage >= guardBreakDamage) breaks the guard and staggers him.
export const ROYCE_BLOCK = Object.freeze({
  blockChance: 0.3, blockMs: 600, blockCooldownMs: 3000, reactRangePx: 170,
  guardBreakDamage: 18, guardBreakStunMs: 500, clipMs: 250,
});

const hit = (atMs, damage, knockback, hitstun, pierceInvuln = false) => Object.freeze({ atMs, damage, knockback, hitstun, pierceInvuln });
const move = (o) => Object.freeze({ ...o, hits: Object.freeze(o.hits) });

export const ROYCE_MOVES = Object.freeze({
  combo: move({           // 500 ms: baton raised and crackling. Four short strikes; the last one is the heavy finisher worth parrying.
    id: 'combo', name: 'Baton Combo', kind: 'finisher',
    telegraphMs: 500, attackMs: 760, recoverMs: 700,
    hits: [hit(80, 7, 200, 160), hit(250, 7, 200, 160), hit(420, 7, 200, 160), hit(600, 12, 380, 300)], markIndex: 3,
    hitbox: Object.freeze({ x: 20, y: -85, w: 95, h: 60 }),
  }),
  dash: move({            // 650 ms: crouch, visor flashing, a red strip along the floor. He runs the strip; jump or sidestep it. Long recovery.
    id: 'dash', name: 'Charging Dash', kind: 'strike',
    telegraphMs: 650, attackMs: 1300, recoverMs: 1100, wallRecoverMs: 1700,
    hits: [hit(0, 13, 300, 250)], markIndex: 0,
    hitbox: Object.freeze({ x: 10, y: -85, w: 75, h: 65 }),
    chargeSpeed: 520, chargeMaxPx: 760, minRange: 180, maxRange: 700,
  }),
  slam: move({            // 750 ms: baton planted overhead, red circle around him. Answer to a crowding Zed; long recovery to heavy-attack.
    id: 'slam', name: 'Shockwave Slam', kind: 'finisher',
    telegraphMs: 750, attackMs: 500, recoverMs: 1500,
    hits: [hit(150, 15, 450, 350)], markIndex: 0,
    hitbox: Object.freeze({ x: -120, y: -50, w: 240, h: 50 }),     // the red circle: 120 px each way
    radiusPx: 120,
  }),
  trap: move({            // 800 ms: he kneels and a cyan line marks each floor strip, then it electrifies for lifeMs (proposed 4 s).
    id: 'trap', name: 'Rail Trap', kind: 'strike',
    telegraphMs: 800, attackMs: 400, recoverMs: 900,
    hits: [hit(0, 0, 0, 0)], markIndex: 0,                           // cue clock only: the strips do the damage
    hitbox: Object.freeze({ x: 0, y: -85, w: 10, h: 10 }),
    // Strips are lane-deep bars (they cross every depth, so you cannot walk around them): jump them or wait. offsets are relative to Zed.
    trap: Object.freeze({ offsets: [-140, 150], widthPx: 90, lifeMs: 4000, tickMs: 450, damage: 6, knockback: 120, hitstun: 450 }),
  }),
  taser: move({           // 550 ms: arm extends, visor locks on with a red icon. A straight short-range stun shot: step out of its line.
    id: 'taser', name: 'Taser Burst', kind: 'finisher',
    telegraphMs: 550, attackMs: 450, recoverMs: 800,
    hits: [hit(150, 9, 180, 600)], markIndex: 0,                     // 600 ms stun is the cap from the design file
    hitbox: Object.freeze({ x: 25, y: -90, w: 335, h: 70 }),
    minRange: 140, maxRange: 360,
  }),
});

export const ROYCE = Object.freeze({
  team: 'rust',
  miniBoss: true,
  spriteKey: ROYCE_SPRITE_KEY,
  skin: ROYCE_ID,
  maxHp: ROYCE_MAX_HP,
  moveSpeed: 85,
  circleSpeed: 70,
  attackRange: 110,       // distance at which the Baton Combo may start
  laneTolerance: 26,      // depth offset allowed for a swing to connect; otherwise he lines up first
  spawnIdleMs: 500,
  hitstunMinMs: 0,
  parryStunMs: 800,       // a parried move stuns him; ordinary hits never do (boss hitstun immunity, no juggle loops)
  knockbackScale: 0.25,
  knockbackDecay: 600,
  hurtbox: Object.freeze({ x: -26, y: -96, w: 52, h: 96 }),
  visualScale: 1.25,      // drawn larger than a grunt
  tint: 0x9ad8ea,         // kept for data compatibility; his own art is drawn untinted
  dashLaneTolerance: 34, dashCooldownMs: 4500, dashFirstMs: 2500,
  slamCooldownMs: 5000, slamCrowdPx: 50, slamMeleeMs: 2200, slamAirLift: COMBAT_DEFAULTS.AIR_DODGE_LIFT,
  trapCooldownMs: 9000, trapFirstMs: 3500, trapMinRange: 150, trapMaxRange: 600,
  taserCooldownMs: 3000, taserFirstMs: 2000, taserLaneTolerance: 26,
  moveCooldownMs: 700,    // pause after any move before the next decision
});

/**
 * Pick his next move. Pure; rng: () => [0,1).
 * @param {{dist:number, dy:number, lift:number, meleeMs:number, ready:{dash:boolean,slam:boolean,trap:boolean,taser:boolean}, lastId:string|null}} s
 * @returns {object|null} an entry of ROYCE_MOVES
 */
export function pickRoyceMove(s, rng = Math.random, d = ROYCE) {
  const inMelee = s.dist <= d.attackRange;
  if (inMelee) {
    if (s.ready.slam && (s.lift >= d.slamAirLift || s.dist <= d.slamCrowdPx || s.meleeMs >= d.slamMeleeMs)) return ROYCE_MOVES.slam; // crowding him
    return ROYCE_MOVES.combo;
  }
  const t = ROYCE_MOVES.taser, c = ROYCE_MOVES.dash;
  if (s.ready.taser && Math.abs(s.dy) <= d.taserLaneTolerance && s.dist >= t.minRange && s.dist <= t.maxRange && rng() < 0.55) return t;
  if (s.ready.trap && s.dist >= d.trapMinRange && s.dist <= d.trapMaxRange && s.lastId !== 'trap' && rng() < 0.5) return ROYCE_MOVES.trap;
  if (s.ready.dash && Math.abs(s.dy) <= d.dashLaneTolerance && s.dist >= c.minRange && s.dist <= c.maxRange) return c;
  if (s.ready.trap && s.dist >= d.trapMinRange && s.dist <= d.trapMaxRange) return ROYCE_MOVES.trap;
  return null;
}
