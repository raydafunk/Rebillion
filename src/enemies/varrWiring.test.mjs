// Wiring checks for the Level 8 final boss (same spirit as raptorSubject88Wiring.test.mjs): manager spawn and UI tables, the real hit resolver
// (shield, transform invulnerability, phase 2 HP restore), a long simulated fight through EnemyManager that must reach every phase 2 move
// with phase 2 art only, and VarrFx run against a recording fake scene (cues, phase banner, no throws, reduceFlash).
import assert from 'node:assert/strict';
import { fakeEmitter } from '../shared/fakeEmitter.mjs';
import { EVENTS } from '../shared/events.js';
import { EnemyManager } from './EnemyManager.js';
import { createHitResolver } from '../combat/hitResolver.js';
import { VarrBoss } from './VarrBoss.js';
import { VARR, VARR_ID, VARR_MOVES } from './varrData.js';
import { isVarrEnemy, VARR_CUES } from './varrSound.js';
import { VarrFx } from './VarrFx.js';
import { varrPose, varrAssets, varrAnimDefs, varrRotationKey } from './varrSprites.js';
import { BOSS_PROFILES } from '../ui/bossBarData.js';
import { victoryFor, victoryProblems } from '../ui/victoryData.js';
import { bossIntroFor } from '../ui/bossIntroData.js';

// ---- manager + UI tables
{
  const ev = fakeEmitter(), reg = [];
  ev.on(EVENTS.ENTITY_REGISTERED, (p) => reg.push(p));
  const mgr = new EnemyManager({ events: ev, getXRange: () => ({ min: 0, max: 1280 }) });
  const g = mgr.spawn({ id: 'e1', x: 900, y: 520, enemy: VARR_ID, hpMult: 1 });
  assert.ok(g instanceof VarrBoss); assert.equal(g.maxHp, VARR.maxHp);
  assert.equal(reg[0].bossProfile, VARR_ID); assert.equal(reg[0].boss, true);
  assert.ok(isVarrEnemy(g));
  assert.ok(BOSS_PROFILES[VARR_ID] && BOSS_PROFILES[VARR_ID].maxHpFallback > 0);
  assert.ok(victoryFor(VARR_ID)); assert.ok(bossIntroFor(VARR_ID)); assert.deepEqual(victoryProblems(), []);
  assert.equal(VARR.visualScale, 1.3);
  mgr.dispose();
}

// ---- the simulated fight
let seed = 7;
const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const rec = () => { const p = new Proxy(function () {}, { get: (_, k) => (k === 'then' ? undefined : p), apply: () => p }); return p; };
const fakeScene = { add: { graphics: rec, text: rec }, tweens: rec(), sys: {} };

function fight({ reduceFlash }) {
  const ev = fakeEmitter(); let now = 1000;
  const resolver = createHitResolver(ev, () => now);
  const mgr = new EnemyManager({ events: ev, rng, getXRange: () => ({ min: 40, max: 1240 }) });
  const zed = { x: 500, y: 520 };
  ev.emit(EVENTS.ENTITY_REGISTERED, { id: 'zed', team: 'player', maxHp: 1e9, hurtbox: { x: -20, y: -80, w: 40, h: 80 }, getState: () => ({ x: zed.x, y: zed.y, lane: zed.y, facing: 1 }) });
  const restored = []; ev.on(EVENTS.BOSS_HP_RESTORED, (p) => restored.push(p));
  const v = mgr.spawn({ id: 'varr', x: 900, y: 520, enemy: VARR_ID, hpMult: 1 });
  const cues = new Set(); let phaseCalls = 0, shake = 0;
  const fx = new VarrFx(fakeScene, { getBosses: () => mgr.list().filter(isVarrEnemy), getXRange: () => ({ min: 40, max: 1240 }), onCue: (n) => { assert.ok(VARR_CUES[n], `known cue ${n}`); cues.add(n); }, onShake: () => { shake++; }, onPhaseChange: () => { phaseCalls++; }, reduceFlash: () => reduceFlash });
  const assets = new Set(varrAssets().map((a) => a.key)), anims = new Set(varrAnimDefs().map((d) => d.key));
  const moves1 = new Set(), moves2 = new Set(), clips2 = new Set(), states2 = new Set(); let leaked = 0, hitN = 0, crew = 0, bolts = 0;
  const dt = 16;
  for (let t = 0; t < 240000 && v.alive; t += dt) {
    now += dt;
    zed.x = v.x - v.facing * (Math.floor(t / 4000) % 2 ? 300 : 90); zed.y = v.y;        // stand close, then back off (taser and drones need range)
    if (t % 600 < dt) { // Zed swings every 600 ms: alternate front and behind so both shield outcomes happen
      const fromFront = ((t / 600) | 0) % 3 !== 0, ox = fromFront ? v.x - v.facing * 60 : v.x + v.facing * 60;
      ev.emit(EVENTS.HIT_REQUEST, { attackerId: 'zed', attackId: `z${++hitN}`, team: 'player', hitbox: { x: -200, y: -90, w: 400, h: 100 }, origin: { x: ox, y: v.y }, lane: v.y, facing: fromFront ? v.facing * -1 : v.facing, damage: 5, knockback: 60, hitstun: 80 });
    }
    mgr.update(dt, { x: zed.x, y: zed.y, lift: 0 });
    bolts = Math.max(bolts, mgr.bolts.length); crew = Math.max(crew, v.summoned.size);
    fx.update(dt);
    if (v.move && (v.state === 'telegraph' || v.state === 'attack')) (v.phase === 2 ? moves2 : moves1).add(v.move.id);
    const p = varrPose(v);
    if (v.phase === 2) {
      states2.add(v.state); if (p.anim) clips2.add(p.anim); if (p.still) clips2.add(p.still);
      for (const k of [p.anim, p.still].filter(Boolean)) if (/\.(idle|strike|shield|override|counter|laugh)\.(east|west)/.test(k) || /still\.(idle|walk1)\./.test(k)) leaked++;
    }
    for (const k of [p.anim && !p.death ? p.anim : null, p.still, p.rotation].filter(Boolean)) assert.ok(anims.has(k) || assets.has(k), `pose key exists: ${k}`);
  }
  fx.destroy(); resolver.destroy(); mgr.dispose();
  return { v, cues, phaseCalls, shake, restored, moves1, moves2, clips2, states2, leaked, crew, bolts };
}

for (const reduceFlash of [false, true]) {
  const r = fight({ reduceFlash });
  assert.equal(r.v.alive, false, 'the fight ends with Varr down');
  assert.equal(r.v.phase, 2);
  assert.equal(r.phaseCalls, 1, 'phase 2 banner/hook fired once');
  assert.equal(r.restored.length, 1, 'boss bar told about the HP restore once');
  assert.ok(r.cues.has('transform') && r.cues.has('slam') && r.cues.has('taser') && r.cues.has('drones') && r.cues.has('pulse') && r.cues.has('collapseCharge') && r.cues.has('collapseBlast'), `cues: ${[...r.cues]}`);
  assert.ok(r.cues.has('summon') && r.cues.has('shieldRaise'), 'phase 1 cues');
  for (const id of ['slam', 'taser', 'combo', 'control', 'drones', 'collapse']) assert.ok(r.moves2.has(id), `phase 2 move reached: ${id} (got ${[...r.moves2]})`);
  for (const id of ['strike', 'shield', 'override']) assert.ok(r.moves1.has(id), `phase 1 move reached: ${id}`);
  assert.ok(![...r.moves2].some((id) => VARR_MOVES[id].phase === 1), 'no phase 1 move in phase 2');
  assert.equal(r.leaked, 0, 'no phase 1 art in phase 2');
  assert.ok(r.v.wallsLive === false, 'walls shut off after death');
  assert.ok(r.crew > 0, 'Command Override summoned crew'); assert.ok(r.bolts > 0, 'taser / drone shots flew');
  assert.ok(r.shake > 0);
}
console.log('varr wiring ok');
