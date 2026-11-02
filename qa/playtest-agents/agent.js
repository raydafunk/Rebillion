// Goal-oriented playtest agent for The Rebellion. Runs inside the page (playtest.html?agent=<persona>).
//
//   perceive()  -> beliefs (a snapshot of Zed, enemies, bosses, wave/exit state)          read-only scene access
//   GOALS       -> each goal scores its relevance from the beliefs; the highest one wins   (goal-oriented, re-planned every step)
//   act()       -> the winning goal drives the keyboard (real KeyboardEvents, like a player)
//   Monitor     -> adversarial oracle: invariants checked every step, findings with severity (S1..S4, as in qa-agent.md)
//
// The agent never edits game state: it only presses keys and reads the ArenaScene. Everything it learns goes into report().
import { EVENTS } from '../../src/shared/events.js';
import { PLAYER_ID } from '../../src/shared/combatData.js';
import { LANE, VIEW } from '../../src/arena/arenaData.js';
import { personaOf } from './personas.js';

const KEYCODE = { ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Space: 32, KeyJ: 74, KeyK: 75, KeyI: 73, KeyT: 84, KeyL: 76, Enter: 13, KeyP: 80, Escape: 27 };
const KEYNAME = { ArrowLeft: 'ArrowLeft', ArrowUp: 'ArrowUp', ArrowRight: 'ArrowRight', ArrowDown: 'ArrowDown', Space: ' ', KeyJ: 'j', KeyK: 'k', KeyI: 'i', KeyT: 't', KeyL: 'l', Enter: 'Enter', KeyP: 'p', Escape: 'Escape' };
const K = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', jump: 'Space', light: 'KeyJ', heavy: 'KeyK', block: 'KeyI', parry: 'KeyT', special: 'KeyL', enter: 'Enter' };
const GROUND_Y = LANE.maxY - 40;
const REACH = { min: 38, ideal: 62, max: 84 };   // Zed's light hitbox reaches ~20..72 px plus the enemy hurtbox half-width
const LANE_OK = 14;                              // combat DEPTH_TOLERANCE is 36; stay well inside it

// ---------- tiny seeded RNG so a run can be replayed (?seed=N) ----------
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// ---------- keyboard actuator: real DOM events, the same path a player's keyboard takes ----------
class Keys {
  constructor() { this.held = new Set(); this.taps = []; this.step = 0; }
  _send(type, code) {
    const ev = new KeyboardEvent(type, { code, key: KEYNAME[code], bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'keyCode', { get: () => KEYCODE[code] });
    Object.defineProperty(ev, 'which', { get: () => KEYCODE[code] });
    window.dispatchEvent(ev);
  }
  /** Hold exactly this set of keys (directions, block). */
  hold(codes) {
    const want = new Set(codes);
    for (const c of [...this.held]) if (!want.has(c) && !this.taps.some((t) => t.code === c)) { this._send('keyup', c); this.held.delete(c); }
    for (const c of want) if (!this.held.has(c)) { this._send('keydown', c); this.held.add(c); }
  }
  /** Press and release a button (attack, jump, parry). */
  tap(code, steps = 2) {
    if (this.taps.some((t) => t.code === code)) return false;
    this._send('keydown', code); this.taps.push({ code, at: this.step + steps });
    return true;
  }
  tick() {
    this.step++;
    for (const t of [...this.taps]) if (this.step >= t.at) { if (!this.held.has(t.code)) this._send('keyup', t.code); this.taps.splice(this.taps.indexOf(t), 1); }
  }
  releaseAll() { for (const c of [...this.held]) this._send('keyup', c); this.held.clear(); }
}

// ---------- the oracle: invariants an adversarial tester checks every step ----------
class Monitor {
  constructor(agent) { this.a = agent; this.findings = new Map(); this.c = {}; }
  flag(id, severity, title, detail) {
    const f = this.findings.get(id);
    if (f) { f.count++; f.lastT = this.a.t; return; }
    this.findings.set(id, { id, severity, title, detail, firstT: Math.round(this.a.t), lastT: Math.round(this.a.t), count: 1 });
    this.a.log('finding', { id, severity, title });
  }
  timer(key, cond, ms, dt) { this.c[key] = cond ? (this.c[key] || 0) + dt : 0; return this.c[key] >= ms; }
  check(b, dt) {
    const s = b.scene, z = b.zed;
    if (!z) return;
    const running = b.roundStarted && !b.ended && !b.victoryHold;
    // Positions must be numbers and inside the world / walkable band.
    if (![z.x, z.y, z.laneY].every(Number.isFinite)) this.flag('zed-nan', 'S1', 'Zed position became NaN', `x=${z.x} laneY=${z.laneY}`);
    if (z.x < -5 || z.x > b.world.w + 5) this.flag('zed-out-of-world', 'S2', 'Zed left the world bounds', `x=${Math.round(z.x)} world=${b.world.w}`);
    if (z.laneY < LANE.minY - 6 || z.laneY > LANE.maxY + 6) this.flag('zed-out-of-lane', 'S2', 'Zed left the walkable floor band', `laneY=${Math.round(z.laneY)} band=${LANE.minY}-${LANE.maxY}`);
    if (this.timer('lock', b.lockRange && running && !b.holding && (z.x < b.lockRange.min - 8 || z.x > b.lockRange.max + 8), 150, dt)) this.flag('zed-escaped-lock', 'S2', 'Zed got outside the locked wave screen', `x=${Math.round(z.x)} lock=${Math.round(b.lockRange.min)}-${Math.round(b.lockRange.max)}`);
    if (b.hp && (b.hp.hp < 0 || b.hp.hp > b.hp.maxHp)) this.flag('hp-range', 'S2', 'Player HP outside 0..max', `${b.hp.hp}/${b.hp.maxHp}`);
    for (const e of b.enemies) {
      if (![e.x, e.y].every(Number.isFinite)) this.flag('enemy-nan', 'S1', 'Enemy position became NaN', e.id);
      if (e.hp < 0 && e.alive) this.flag('enemy-negative-hp-alive', 'S2', 'Enemy below 0 HP but still alive', `${e.id} hp=${e.hp}`);
      const off = e.x < b.cam.x - 150 || e.x > b.cam.x + VIEW.w + 150;
      if (this.timer('off:' + e.id, running && e.alive && off, 6000, dt)) this.flag('enemy-offscreen', 'S2', 'Enemy stayed off-screen > 6 s (failsafe should reposition at 2.5 s)', `${e.id} x=${Math.round(e.x)} cam=${Math.round(b.cam.x)}`);
      if (e.y < LANE.minY - 40 || e.y > LANE.maxY + 40) this.flag('enemy-out-of-lane', 'S3', 'Enemy walking outside the floor band', `${e.id} y=${Math.round(e.y)}`);
    }
    // Round clock must tick while the round runs.
    const sec = b.secondsLeft;
    if (this.timer('timer', running && sec === this._lastSec, 2600, dt)) this.flag('timer-frozen', 'S2', 'Round timer stopped while the round was running', `stuck at ${sec}s`);
    this._lastSec = sec;
    // Progress watchdog: nothing hit anyone, no wave moved, Zed did not travel -> soft-lock.
    const token = `${this.a.stats.hitsDealt}|${this.a.stats.hitsTaken}|${b.waveIdx}|${Math.round(z.x / 60)}|${b.enemies.length}`;
    if (this.timer('progress', running && token === this._token, 25000, dt)) this.flag('soft-lock', 'S1', 'No progress for 25 s (no hits, no wave change, no travel)', `wave ${b.waveIdx + 1}, ${b.enemies.length} alive, goal ${this.a.goal}`);
    this._token = token;
    // Wave cleared but the walk to the next wave never starts it.
    if (this.timer('advance', running && b.holding && this.a.goal === 'advance' && Math.abs(z.x - (this._advX ?? z.x)) < 4, 5000, dt)) this.flag('advance-blocked', 'S1', 'Zed walks to the next wave but cannot move', `x=${Math.round(z.x)} nextLock=${b.nextLockX}`);
    this._advX = z.x;
    if (this.timer('exit', running && b.finished && z.x < b.exitX - 40 && this.a.goal === 'exit' && Math.abs(z.x - (this._exX ?? z.x)) < 4, 5000, dt)) this.flag('exit-blocked', 'S1', 'Level finished but Zed cannot reach the exit', `x=${Math.round(z.x)} exit=${b.exitX}`);
    this._exX = z.x;
    if (this.timer('hitstop', (s.hitStopLeft || 0) > 0, 2000, dt)) this.flag('hitstop-stuck', 'S2', 'Hit-stop never released', `${s.hitStopLeft}ms`);
    if (this.timer('victory', b.victoryHold, 20000, dt)) this.flag('victory-card-stuck', 'S1', 'Boss victory card held play for > 20 s', '');
    if (this.timer('noresult', b.ended && !b.victoryHold && !b.resultUp, 6000, dt)) this.flag('no-result-screen', 'S1', 'Round ended but the result screen never opened', '');
    if (this.timer('grabhold', z.grabActive, 6000, dt)) this.flag('grab-forever', 'S1', 'Zed held in a grab for > 6 s', '');
    // Zed stuck in one non-idle state (stun-lock).
    const st = z.state;
    if (this.timer('stun', running && (st === 'hitstun' || st === 'hurt') && st === this._st, 4000, dt)) this.flag('player-stunlock', 'S2', 'Zed stuck in hitstun > 4 s', st);
    this._st = st;
  }
}

// ---------- goals: relevance(beliefs) -> 0..100, act(beliefs) -> presses keys ----------
function makeGoals(a) {
  const P = a.persona, W = P.weights;
  const dirKeys = (dx, dy) => [dx < -6 ? K.left : dx > 6 ? K.right : null, dy < -6 ? K.up : dy > 6 ? K.down : null].filter(Boolean);
  const nearestBoss = (b) => b.enemies.filter((e) => e.alive && e.isBoss).sort((p, q) => Math.abs(p.x - b.zed.x) - Math.abs(q.x - b.zed.x))[0];
  return [
    { id: 'break-free', label: 'Break the grab (mash J/K)', score: (b) => (b.zed.grabHeld ? W.breakFree : 0),
      act: (b) => { a.keys.hold([]); a.keys.tap((a.mashFlip ^= 1) ? K.light : K.heavy, 1); a.stats.grabMashes++; } },

    { id: 'evade-stomp', label: 'Jump the Mega Stomp wave', score: (b) => {
        const d = b.enemies.find((e) => e.alive && e.moveId === 'stomp' && (e.state === 'telegraph' || e.state === 'attack'));
        if (!d) return 0;
        const front = d.wave ? Math.abs(b.zed.x - d.wave.ox) - d.wave.r : Math.abs(b.zed.x - d.x) - 95;
        a._stompFront = front;
        return front < 170 && front > -30 ? W.evadeStomp : 0;
      },
      act: (b) => { a.keys.hold([]); if (!b.zed.airborne && a._stompFront < 120) { a.keys.tap(K.jump, 4); a.note('stomp-jump'); } } },

    { id: 'sidestep-charge', label: 'Sidestep the shoulder charge', score: (b) => {
        const d = b.enemies.find((e) => e.alive && (e.chargeWarning || (e.moveId === 'charge' && e.state === 'attack')));
        return d && Math.abs(b.zed.laneY - d.y) < 80 ? W.sidestepCharge : 0;
      },
      act: (b) => {
        const d = b.enemies.find((e) => e.alive && (e.chargeWarning || e.moveId === 'charge'));
        const goUp = d.y > (LANE.minY + LANE.maxY) / 2;                // go to the far side of the lane band from him
        a.keys.hold([goUp ? K.up : K.down]); a.note('charge-sidestep');
      } },

    { id: 'avoid-grab', label: 'Back-step the grab reach', score: (b) => {
        const d = b.enemies.find((e) => e.alive && e.moveId === 'grab' && e.state === 'telegraph');
        return d && Math.abs(b.zed.x - d.x) < 150 ? W.avoidGrab : 0;
      },
      act: (b) => { const d = b.enemies.find((e) => e.alive && e.moveId === 'grab'); a.keys.hold([b.zed.x < d.x ? K.left : K.right]); a.note('grab-backstep'); } },

    { id: 'parry', label: 'Parry on the closing ring', score: (b) => {
        const t = a.parryCandidate(b);
        return t ? W.parry : 0;
      },
      act: (b) => { a.keys.hold([]); if (a.keys.tap(K.parry, 3)) { const e = a._parryTarget; a._parryRoll.pressed = true; a.stats.parryAttempts++; a.note('parry'); a.log('parry-press', { zed: b.zed.state, by: e.id, clock: Math.round(e.cueClockMs), mark: Math.round(e.parryMarkMs) }); } } },   // one press per attack, like a player

    { id: 'reposition', label: 'Get out of the sandwich', score: (b) => (W.reposition && a.crowdPlan(b) ? W.reposition : 0),
      act: (b) => { const p = a._crowd; a.keys.hold(dirKeys(p.x - b.zed.x, p.y - b.zed.laneY)); a.note('reposition'); } },

    { id: 'heal', label: 'Pick up health', score: (b) => {
        if (!b.pickups.length || !b.hp || b.hp.hp / b.hp.maxHp > 0.7) return 0;
        const danger = b.enemies.some((e) => e.alive && Math.abs(e.x - b.zed.x) < 160);
        return danger ? W.heal * 0.4 : W.heal;
      },
      act: (b) => { const p = b.pickups[0]; a.keys.hold(dirKeys(p.x - b.zed.x, p.y - b.zed.laneY)); } },

    { id: 'attack', label: 'Fight', score: (b) => (b.enemies.some((e) => e.alive) ? W.attack : 0),
      act: (b) => a.fight(b) },

    { id: 'advance', label: 'Walk to the next wave', score: (b) => (b.holding && !b.enemies.some((e) => e.alive) ? W.advance : 0),
      act: (b) => { a.keys.hold([K.right, ...(Math.abs(b.zed.laneY - 580) > 20 ? [b.zed.laneY < 580 ? K.down : K.up] : [])]); } },

    { id: 'exit', label: 'Walk to the EXIT', score: (b) => (b.finished && !b.enemies.some((e) => e.alive) ? W.advance + 1 : 0),
      act: (b) => { a.keys.hold([b.zed.x < b.exitX ? K.right : K.left]); } },

    { id: 'wait', label: 'Wait for the wave', score: () => 1,
      act: (b) => { const mid = b.cam.x + VIEW.w / 2; a.keys.hold(dirKeys(mid - b.zed.x, 570 - b.zed.laneY)); } },
  ];
}

export class PlaytestAgent {
  constructor(game, { persona = 'brawler', levelIndex = 0, seed = 1 } = {}) {
    this.game = game; this.personaName = persona; this.persona = personaOf(persona); this.levelIndex = levelIndex;
    this.rand = rng(seed); this.keys = new Keys(); this.monitor = new Monitor(this);
    this.goals = makeGoals(this); this.goal = 'boot'; this.goalLabel = 'Booting'; this.action = '';
    this.t = 0; this.lastNow = performance.now(); this.timeline = []; this.outcome = null; this.done = false;
    this.stats = { hitsDealt: 0, hitsTaken: 0, damageDealt: 0, damageTaken: 0, parryAttempts: 0, parries: 0, kills: 0, wavesCleared: 0,
      grabs: 0, grabsBroken: 0, grabMashes: 0, slams: 0, pickups: 0, rageUses: 0, minFps: 999, hitches: 0, goalTime: {}, notes: {} };
    this.boss = {};                 // per boss id: { name, seenT, diedT, moves:{id:{seen,hitZed,evaded}}, hpEnd }
    this.parryRolls = new Map(); this.mashFlip = 0; this.combo = { step: 0, nextAt: 0 }; this.chaos = null;
    this._wire(); this._hud();
    this._step = () => this.tick();
    game.events.on('prestep', this._step);
  }

  log(type, data = {}) { this.timeline.push({ t: Math.round(this.t), type, ...data }); if (this.timeline.length > 400) this.timeline.shift(); }
  note(k) { this.stats.notes[k] = (this.stats.notes[k] || 0) + 1; this.action = k; }

  _wire() {
    const ev = this.game.events, S = this.stats;
    const on = (n, f) => ev.on(n, f);
    on(EVENTS.DAMAGE_APPLIED, (d) => {
      if (d.amount <= 0) return;
      if (d.attackerId === PLAYER_ID) { S.hitsDealt++; S.damageDealt += d.amount; }
      if (d.targetId === PLAYER_ID) {
        S.hitsTaken++; S.damageTaken += d.amount;
        const bs = this.boss[d.attackerId];
        if (bs && bs.curMove) { const m = bs.moves[bs.curMove]; m.hitZed++; m.damage += d.amount; bs.hitThisMove = true; }
        this.log('hurt', { by: d.attackerId, amount: d.amount, move: bs?.curMove });
      }
    });
    on(EVENTS.PARRY_STUN, () => { S.parries++; this.log('parry-success'); });
    on(EVENTS.ENTITY_DIED, (d) => { if (d.id !== PLAYER_ID) { S.kills++; if (this.boss[d.id]) { this.boss[d.id].diedT = Math.round(this.t); this.log('boss-down', { id: d.id }); } } else this.log('zed-ko'); });
    on(EVENTS.WAVE_STARTED, (p) => this.log('wave-started', { index: p?.index }));
    on(EVENTS.WAVE_CLEARED, (p) => { S.wavesCleared++; this.log('wave-cleared', { index: p?.index }); });
    on(EVENTS.GRAB, () => { S.grabs++; this.log('grabbed'); });
    on(EVENTS.GRAB_BROKEN, () => { S.grabsBroken++; this.log('grab-broken'); });
    on(EVENTS.PLAYER_SLAMMED, () => { S.slams++; this.log('slammed'); });
    on(EVENTS.ROUND_WON, (p) => this._end('win', p?.reason));
    on(EVENTS.ROUND_LOST, (p) => this._end('lose', p?.reason));
  }

  _end(mode, reason) {
    if (this.outcome) return;
    const b = this.beliefs;
    this.outcome = { mode, reason, t: Math.round(this.t), hp: b?.hp?.hp ?? null, secondsLeft: b?.secondsLeft ?? null, wave: (b?.waveIdx ?? 0) + 1 };
    this.log('round-' + mode, { reason });
  }

  // ---------- perception ----------
  perceive() {
    const s = this.game.scene.getScene('ArenaScene');
    if (!s || !s.zed || !s.arena || !s.sys.settings.active) return null;
    const z = s.zed, cam = s.cameras.main, sp = s.arena.spawner || {};
    const enemies = s.arena.enemies.list().map((g) => ({
      id: g.id, x: g.x, y: g.y, alive: g.alive, hp: g.hp, maxHp: g.maxHp, isBoss: !!g.isBoss, state: g.state, facing: g.facing,
      cueClockMs: g.alive ? g.cueClockMs : null, parryMarkMs: g.alive && g.cueClockMs !== null ? g.parryMarkMs : null,
      kind: g.variant?.kind, moveId: g.move?.id ?? null, moveSeq: g.moveSeq ?? 0, attackCounter: g.attackCounter ?? 0,
      chargeWarning: !!g.chargeWarning, wave: g.wave ? { ox: g.wave.ox, r: g.wave.r } : null, guard: g.guard ?? null,
    }));
    const hp = s.resolver?.getHealth(PLAYER_ID);
    const lift = Math.max(0, GROUND_Y - (z.y + 36));
    return this.beliefs = {
      scene: s, cam: { x: cam.scrollX }, world: s.world, roundStarted: s.roundStarted, ended: s.ended, victoryHold: s.victoryHold,
      resultUp: this.game.scene.isActive('ResultScene'),
      zed: { x: z.x, y: z.y, laneY: z.laneY, facing: z.facing, state: z.state, airborne: lift > 4, grabHeld: !!z.grab?.held, grabActive: !!z.grab?.active,
        dead: !!z.dead, rageReady: !!z.rage?.isReady, rageActive: !!z.rage?.isActive },
      hp, enemies, pickups: (s.pickups || []).map((p) => ({ x: p.x, y: p.y })),
      holding: !!s.arena.holding, finished: !!s.arena.finished, nextLockX: s.arena.nextLockX, exitX: s.level.exitX,
      lockRange: s.arena.bounds?.xRange, secondsLeft: s.state?.secondsLeft, waveIdx: sp.index ?? sp.waveIndex ?? this._waveIdxFromLog(),
      levelName: s.level.name,
    };
  }
  _waveIdxFromLog() { const w = this.timeline.filter((e) => e.type === 'wave-started'); return w.length ? (w[w.length - 1].index ?? w.length - 1) : 0; }

  // ---------- decisions ----------
  parryCandidate(b) {
    const P = this.persona;
    for (const e of b.enemies) {
      if (!e.alive || e.cueClockMs === null || e.parryMarkMs === null) continue;
      if (e.moveId && !['punch', 'rage'].includes(e.moveId)) continue;             // charge/grab can't be parried; stomp is jumped
      if (Math.abs(e.x - b.zed.x) > 150 || Math.abs(e.y - b.zed.laneY) > 40) continue;
      const w = (this._windups ||= new Map()), prev = w.get(e.id) || { st: null, n: 0 };
      if (e.state === 'telegraph' && prev.st !== 'telegraph') prev.n++;              // one key per wind-up (the hit counter moves mid-string)
      prev.st = e.state; w.set(e.id, prev);
      const key = `${e.id}:${e.isBoss ? 'm' + e.moveSeq : 'w' + prev.n}`;
      if (!this.parryRolls.has(key)) this.parryRolls.set(key, { go: this.rand() < P.parrySkill, at: e.parryMarkMs - 150 + this.rand() * P.reactionMs });
      const r = this.parryRolls.get(key);
      r.live = this._tickNo; r.dueIn = r.at - e.cueClockMs;                          // this wind-up is on screen now; ms until we press
      if (r.go && !r.pressed && e.cueClockMs >= r.at && e.cueClockMs <= e.parryMarkMs + 90) { this._parryRoll = r; this._parryTarget = e; return e; }
    }
    return null;
  }

  /**
   * Crowd control (what a beat-'em-up player does): never fight with enemies on BOTH sides. When flanked, run to the edge of the
   * locked screen on the side with fewer enemies, and to the far side of the floor band from the crowd, so the whole crowd ends up
   * in front of Zed. Commits to the move for a moment so it does not dither, then cools down.
   */
  crowdPlan(b) {
    const z = b.zed, c = this._crowd;
    if (c && this.t < c.until && Math.abs(c.x - z.x) > 22) return true;      // committed: keep running
    if (c) { this._crowd = null; this._crowdCd = this.t + 1400; this.log('reposition-done'); }
    if (this.t < (this._crowdCd || 0)) return false;
    const near = b.enemies.filter((e) => e.alive && Math.abs(e.x - z.x) < 230 && Math.abs(e.y - z.laneY) < 80);
    const L = near.filter((e) => e.x < z.x - 12), R = near.filter((e) => e.x > z.x + 12);
    if (!L.length || !R.length) return false;
    const r = b.lockRange || { min: b.cam.x + 40, max: b.cam.x + VIEW.w - 40 };
    const goLeft = L.length < R.length || (L.length === R.length && z.x - r.min < r.max - z.x);
    const meanY = near.reduce((n, e) => n + e.y, 0) / near.length;
    const y = meanY > (LANE.minY + LANE.maxY) / 2 ? LANE.minY + 12 : LANE.maxY - 12;
    this._crowd = { x: goLeft ? r.min + 45 : r.max - 45, y, until: this.t + 1800 };
    this.stats.repositions = (this.stats.repositions || 0) + 1;
    this.log('reposition', { left: L.length, right: R.length, to: goLeft ? 'left' : 'right' });
    return true;
  }

  fight(b) {
    const P = this.persona, z = b.zed;
    if (P.useRage && z.rageReady && this.keys.tap(K.special, 2)) { this.stats.rageUses++; this.note('rage-special'); return; }
    const alive = b.enemies.filter((e) => e.alive);
    // Boss first when the persona hunts bosses; otherwise the closest threat.
    const score = (e) => Math.abs(e.x - z.x) + 2 * Math.abs(e.y - z.laneY) - (P.punishRecovery && e.isBoss ? 300 : 0);
    const tgt = alive.sort((p, q) => score(p) - score(q))[0];
    if (!tgt) return;
    // Edge exploiter: fight from a corner of the locked screen and let enemies come.
    if (P.edgeHug) {
      const r = b.lockRange || { min: b.cam.x + 40, max: b.cam.x + VIEW.w - 40 };
      if (!this._corner || this.rand() < 0.004) this._corner = { x: this.rand() < 0.5 ? r.min + 4 : r.max - 4, y: this.rand() < 0.5 ? LANE.minY + 2 : LANE.maxY - 2 };
      const far = Math.abs(tgt.x - z.x) > 110;
      if (far) { const dx = this._corner.x - z.x, dy = this._corner.y - z.laneY; this.keys.hold([dx < -6 ? K.left : dx > 6 ? K.right : null, dy < -4 ? K.up : dy > 4 ? K.down : null].filter(Boolean)); this.action = 'hug-corner'; return; }
    }
    if (P.blockHold && Math.abs(tgt.x - z.x) < 180) {
      if (!this._blockUntil || this.t > this._blockUntil + 400) this._blockUntil = this.rand() < P.blockHold ? this.t + 1200 : this.t;
      if (this.t < this._blockUntil) { this.keys.hold([K.block]); this.action = 'turtle-block'; return; }
    }
    if (P.waitForCue && tgt.cueClockMs === null && Math.abs(tgt.x - z.x) < 100 && this.rand() < 0.6 && !tgt.isBoss) { this.keys.hold([]); this.action = 'wait-for-ring'; return; }
    const side = z.x < tgt.x ? -1 : 1;                       // stand on our current side of the target
    const wantX = tgt.x + side * REACH.ideal, dx = wantX - z.x, dy = tgt.y - z.laneY;
    const inX = Math.abs(tgt.x - z.x) >= REACH.min && Math.abs(tgt.x - z.x) <= REACH.max;
    const facing = Math.sign(tgt.x - z.x) === Math.sign(z.facing || 1);
    if (!inX || Math.abs(dy) > LANE_OK || !facing) {
      const keys = [];
      if (!inX) keys.push(dx < 0 ? K.left : K.right);
      else if (!facing) keys.push(tgt.x < z.x ? K.left : K.right);
      if (Math.abs(dy) > LANE_OK - 4) keys.push(dy < 0 ? K.up : K.down);
      this.keys.hold(keys); this.action = 'close-in'; return;
    }
    this.keys.hold([]);
    // A parry is planned on a wind-up that is already running: stop swinging so Zed is free when the ring closes (a parry press mid-combo is ignored).
    if ([...this.parryRolls.values()].some((r) => r.go && !r.pressed && r.live === this._tickNo && r.dueIn <= 380)) { this.action = 'hold for parry'; return; }
    // Heavy breaks Dugan's block and punishes a recovering boss; otherwise a 3-hit light string (taps ~180 ms apart).
    const punish = P.punishRecovery && tgt.isBoss && (tgt.state === 'recover' || tgt.state === 'hitstun');
    if (tgt.guard === 'block' || (punish && this.rand() < 0.5) || this.rand() < P.heavyChance * 0.05) {
      if (this.t >= this.combo.nextAt && this.keys.tap(K.heavy, 2)) { this.combo = { step: 0, nextAt: this.t + 520 }; this.note(tgt.guard === 'block' ? 'guard-break' : 'heavy'); }
      return;
    }
    if (this.t >= this.combo.nextAt && this.keys.tap(K.light, 2)) {
      this.combo.step = (this.combo.step + 1) % 3;
      this.combo.nextAt = this.t + (this.combo.step === 0 ? 480 : 175);
      this.action = `combo ${this.combo.step || 3}/3`;
    }
  }

  chaosStorm(b) {
    // Input fuzz: random holds and taps, sometimes every button at once.
    if (!this.chaos || this.t > this.chaos.until) {
      const all = Object.values(K).filter((k) => k !== K.enter && k !== K.special);
      const pick = () => all[Math.floor(this.rand() * all.length)];
      const n = this.rand() < 0.15 ? all.length : 1 + Math.floor(this.rand() * 3);
      this.chaos = { until: this.t + 120 + this.rand() * 380, hold: Array.from({ length: n }, pick) };
      this.note('fuzz');
    }
    this.keys.hold(this.chaos.hold.filter((k) => [K.left, K.right, K.up, K.down, K.block].includes(k)));
    for (const k of this.chaos.hold) if (![K.left, K.right, K.up, K.down, K.block].includes(k)) this.keys.tap(k, 1);
  }

  tick() {
    const now = performance.now(), dt = Math.min(250, now - this.lastNow);
    if (now - this.lastNow > 250) this.stats.hitches++;
    this.lastNow = now; this.t += dt;
    const fps = this.game.loop.actualFps; if (this.t > 3000 && fps) this.stats.minFps = Math.min(this.stats.minFps, Math.round(fps));
    this.keys.tick(); this._tickNo = (this._tickNo || 0) + 1;
    const b = this.perceive();
    if (!b) { this._render(); return; }
    this._trackBosses(b);
    this.monitor.check(b, dt);
    // Cards: dismiss the level intro (after a beat, so the video shows it) and the boss victory card.
    if (!b.roundStarted && !b.ended) { this._setGoal('intro', 'Read the level card'); this.keys.hold([]); if (this.t > 1800 && this.t % 1000 < dt + 1) this.keys.tap(K.enter, 2); this._render(); return; }
    if (b.victoryHold) { this._setGoal('victory', 'Boss down: victory card'); this.keys.hold([]); this._vh = (this._vh || 0) + dt; if (this._vh > 2500) { this.keys.tap(K.enter, 2); this._vh = 0; } this._render(); return; }
    if (b.ended || this.outcome) { this._setGoal('done', this.outcome ? `Round ${this.outcome.mode} (${this.outcome.reason})` : 'Round over'); this.keys.releaseAll(); this.done = true; this._render(); return; }
    // Goal selection: highest relevance wins. Adversarial personas mix in chaos and jump spam.
    const P = this.persona;
    if (P.chaos && this.rand() < P.chaos * 0.06 || (this.chaos && this.t < this.chaos.until)) { this._setGoal('fuzz', 'Fuzz the controls'); this.chaosStorm(b); this._render(); return; }
    if (P.jumpSpam && !b.zed.airborne && this.rand() < P.jumpSpam * 0.05) { this.keys.tap(K.jump, 3); this.note('jump-spam'); }
    let best = null, bestScore = -1;
    for (const g of this.goals) { const sc = g.score(b); if (sc > bestScore) { best = g; bestScore = sc; } }
    this._setGoal(best.id, best.label);
    best.act(b);
    this._render();
  }

  _setGoal(id, label) {
    if (id !== this.goal) this.log('goal', { id });
    this.goal = id; this.goalLabel = label;
    this.stats.goalTime[id] = (this.stats.goalTime[id] || 0) + 1;
  }

  _trackBosses(b) {
    for (const e of b.enemies) {
      if (!e.isBoss) continue;
      const bs = this.boss[e.id] ||= { id: e.id, seenT: Math.round(this.t), diedT: null, maxHp: e.maxHp, moves: {}, curMove: null, lastSeq: -1, minHp: e.hp };
      bs.minHp = Math.min(bs.minHp, e.hp); bs.hpEnd = e.hp;
      if (e.moveId && e.moveSeq !== bs.lastSeq && (e.state === 'telegraph' || e.state === 'attack')) {
        if (bs.curMove && !bs.hitThisMove) bs.moves[bs.curMove].evaded++;
        bs.lastSeq = e.moveSeq; bs.curMove = e.moveId; bs.hitThisMove = false;
        (bs.moves[e.moveId] ||= { seen: 0, hitZed: 0, damage: 0, evaded: 0 }).seen++;
      }
      if (!e.alive && bs.curMove) { if (!bs.hitThisMove) bs.moves[bs.curMove].evaded++; bs.curMove = null; }
    }
  }

  // ---------- on-screen overlay so the video explains what the agent is thinking ----------
  _hud() {
    const d = document.createElement('div');
    d.id = 'agent-hud';
    d.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:99;font:600 13px/1.35 Consolas,monospace;color:#f3e6c8;background:rgba(20,12,8,.78);border:1px solid #d9a441;border-radius:6px;padding:8px 10px;min-width:280px;pointer-events:none;white-space:pre';
    document.body.appendChild(d); this.hudEl = d;
  }
  _render() {
    if (!this.hudEl || (this._hudAt && this.t - this._hudAt < 100)) return;
    this._hudAt = this.t;
    const b = this.beliefs, S = this.stats;
    const boss = b?.enemies.find((e) => e.isBoss && e.alive);
    const lines = [
      `AGENT  ${this.persona.label.toUpperCase()}  (${this.persona.kind})`,
      `GOAL   ${this.goalLabel}`,
      `ACT    ${this.action || '-'}`,
      `HP ${b?.hp ? Math.max(0, Math.round(b.hp.hp)) : '-'}  hits ${S.hitsDealt}/${S.hitsTaken}  parry ${S.parries}/${S.parryAttempts}  KOs ${S.kills}`,
      boss ? `BOSS   ${Math.round(boss.hp)}/${boss.maxHp}  move ${boss.moveId || '-'} (${boss.state})` : null,
      `FINDINGS ${[...this.monitor.findings.values()].map((f) => f.severity).join(' ') || 'none'}`,
    ].filter(Boolean);
    this.hudEl.textContent = lines.join('\n');
  }

  report() {
    const S = this.stats, total = Object.values(S.goalTime).reduce((n, v) => n + v, 0) || 1;
    return {
      persona: this.personaName, kind: this.persona.kind, level: this.levelIndex + 1, levelName: this.beliefs?.levelName,
      outcome: this.outcome, done: this.done, elapsedMs: Math.round(this.t),
      stats: { ...S, goalShare: Object.fromEntries(Object.entries(S.goalTime).map(([k, v]) => [k, Math.round((v / total) * 100)])) },
      bosses: Object.values(this.boss).map(({ hitThisMove, curMove, lastSeq, ...r }) => r),
      findings: [...this.monitor.findings.values()],
      timeline: this.timeline,
    };
  }

  stop() { this.game.events.off('prestep', this._step); this.keys.releaseAll(); }
}

export function startAgent(game, opts) { return new PlaytestAgent(game, opts); }
