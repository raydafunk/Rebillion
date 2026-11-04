// "Crusher" Kane, the Level 3 (Greenline Courts) mini-boss. No Phaser. A real boss now (KaneBoss.js), not a grunt stand-in.
// Numbers mirror content/enemies/mini-bosses.json (rust-crusher-kane): maxHp 220, damage 20, telegraphs 850/700/600/900/750 ms.
// moveSpeed is 55 (owner change, was 50 in the content file).
// Times in ms, speeds in px/s, rects relative to the entity origin (feet) facing right.
// The five canon moves: Hammer Slam, Hook Chain Grab, Furnace Kick, Steam Vent Burst, Crushing Uppercut.
// Slow, heavy, long recoveries: a slower version of the grunt's timing that foreshadows Calder's 900 ms telegraphs.
// Stats, timings and layouts are proposed values for playtest (the content file marks them invented).
import { COMBAT_DEFAULTS } from '../shared/combatData.js';

export const KANE_ID = 'rust-crusher-kane';
export const KANE_SKIN = KANE_ID;   // his own art (kaneSprites.js)
export const KANE_MAX_HP = 220;

const hit = (atMs, damage, knockback, hitstun, pierceInvuln = false) => Object.freeze({ atMs, damage, knockback, hitstun, pierceInvuln });
const move = (o) => Object.freeze({ ...o, hits: Object.freeze(o.hits) });

export const KANE_MOVES = Object.freeze({
  hammer: move({          // 850 ms: hammer lifted overhead, red ground circle in front of him. His main attack; long recovery to punish.
    id: 'hammer', name: 'Hammer Slam', kind: 'finisher',
    telegraphMs: 850, attackMs: 340, recoverMs: 1400,
    hits: [hit(120, 20, 420, 300)], markIndex: 0,
    hitbox: Object.freeze({ x: -15, y: -60, w: 170, h: 60 }),
    circle: Object.freeze({ cx: 70, rx: 85 }),                      // the red circle: centre 70 px in front of him, 85 px each way
  }),
  hook: move({            // 700 ms: chain whirls overhead, the hook flashes. A straight ranged pull: knockback is NEGATIVE (towards him).
    id: 'hook', name: 'Hook Chain Grab', kind: 'strike',
    telegraphMs: 700, attackMs: 500, recoverMs: 1300, landedRecoverMs: 800,
    hits: [hit(150, 8, -560, 420)], markIndex: 0,
    hitbox: Object.freeze({ x: 30, y: -85, w: 390, h: 50 }),
    minRange: 170, maxRange: 410,
  }),
  kick: move({            // 600 ms: leg pulls back, steam hisses from the knee. Short, quick sweep.
    id: 'kick', name: 'Furnace Kick', kind: 'strike',
    telegraphMs: 600, attackMs: 380, recoverMs: 1000,
    hits: [hit(140, 12, 360, 260)], markIndex: 0,
    hitbox: Object.freeze({ x: 5, y: -55, w: 135, h: 55 }),
    maxRange: 100,
  }),
  vent: move({            // 900 ms: suit shakes, steam builds on the shoulders, red cone on the ground. Burst, then a steam patch (proposed 3 s).
    id: 'vent', name: 'Steam Vent Burst', kind: 'finisher',
    telegraphMs: 900, attackMs: 600, recoverMs: 1300,
    hits: [hit(100, 10, 250, 250)], markIndex: 0,
    hitbox: Object.freeze({ x: 10, y: -70, w: 260, h: 70 }),         // the cone's reach
    patch: Object.freeze({ offsetX: 150, widthPx: 240, depthPx: 70, lifeMs: 3000, tickMs: 500, damage: 4, knockback: 100, hitstun: 200 }),
  }),
  uppercut: move({        // 750 ms: hammer swung low behind him, red strip in front. Only if Zed stands close. Heavy, long hitstun.
    id: 'uppercut', name: 'Crushing Uppercut', kind: 'finisher',
    telegraphMs: 750, attackMs: 420, recoverMs: 1300,
    hits: [hit(160, 18, 300, 450)], markIndex: 0,
    hitbox: Object.freeze({ x: 0, y: -110, w: 95, h: 110 }),
    maxRange: 80,
  }),
});

export const KANE = Object.freeze({
  team: 'rust',
  miniBoss: true,
  spriteKey: 'rust.crusher-kane',
  skin: KANE_SKIN,
  maxHp: KANE_MAX_HP,
  moveSpeed: 55,          // owner change: 50 -> 55
  circleSpeed: 44,        // keeps the old 4:5 ratio to moveSpeed
  attackRange: 105,       // distance at which a close move may start
  laneTolerance: 24,      // depth offset allowed for a swing to connect; otherwise he lines up first
  hookLaneTolerance: 26,
  spawnIdleMs: 250,
  hitstunMinMs: 120,
  parryStunMs: 800,       // a parried move stuns him; ordinary hits never do (boss hitstun immunity, no juggle loops)
  knockbackScale: 0.2,    // heavy suit: barely pushed
  knockbackDecay: 600,
  hurtbox: Object.freeze({ x: -30, y: -110, w: 60, h: 110 }),
  visualScale: 1,
  // pacing
  hookCooldownMs: 6500, hookFirstMs: 3000,
  kickCooldownMs: 3500, kickFirstMs: 0,
  ventCooldownMs: 8500, ventFirstMs: 5000, ventCrowdPx: 50, ventMeleeMs: 2200,
  uppercutCooldownMs: 5500, uppercutFirstMs: 2000,
  uppercutChance: 0.5, kickChance: 0.45, hookChance: 0.6,
  moveCooldownMs: 600,    // pause after any move before the next decision
});

// The attack numbers used by the old stand-in swing, kept for tests and the sprite clip length.
export const KANE_SLAM_TELEGRAPH_MS = KANE_MOVES.hammer.telegraphMs;
export const KANE_SLAM_ATTACK_MS = KANE_MOVES.hammer.attackMs;

/**
 * Pick his next move. Pure; rng: () => [0,1).
 * @param {{dist:number, dy:number, lift:number, meleeMs:number, ready:{hook:boolean,kick:boolean,vent:boolean,uppercut:boolean}, lastId:string|null}} s
 * @returns {object|null} an entry of KANE_MOVES
 */
export function pickKaneMove(s, rng = Math.random, d = KANE) {
  const M = KANE_MOVES;
  if (s.dist <= d.attackRange) {
    const airborne = s.lift >= COMBAT_DEFAULTS.AIR_DODGE_LIFT;
    if (s.ready.vent && (airborne || s.dist <= d.ventCrowdPx || s.meleeMs >= d.ventMeleeMs)) return M.vent;   // crowding him: vent steam
    if (s.ready.uppercut && !airborne && s.dist <= M.uppercut.maxRange && rng() < d.uppercutChance) return M.uppercut;
    if (s.ready.kick && s.dist <= M.kick.maxRange && s.lastId !== 'kick' && rng() < d.kickChance) return M.kick;
    return M.hammer;
  }
  const k = M.hook;
  if (s.ready.hook && Math.abs(s.dy) <= d.hookLaneTolerance && s.dist >= k.minRange && s.dist <= k.maxRange && rng() < d.hookChance) return k;
  return null;
}
