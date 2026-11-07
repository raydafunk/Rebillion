import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SUBJECT88, SUBJECT88_MOVES, SUBJECT88_ID, SUBJECT88_MAX_HP, SUBJECT88_EXPLODE_AT, pickSubject88Move } from './subject88Data.js';
import { GLITCH } from './glitchData.js';
import { SUBJECT88_ID as INTRO_ID } from '../ui/bossIntroData.js';

const rdy = (o = {}) => ({ breath: true, spit: true, charge: true, slam: true, explosion: false, ...o });
const ctx = (o) => ({ dist: 400, dy: 0, ready: rdy(), lastId: null, forceExplosion: false, flared: false, ...o });
const only = (id, o = {}) => ({ breath: false, spit: false, charge: false, slam: false, explosion: false, [id]: true, ...o });

test('id matches the intro data and the content file', () => {
  assert.equal(SUBJECT88_ID, INTRO_ID);
  const json = JSON.parse(fs.readFileSync('content/enemies/mini-bosses.json', 'utf8'));
  const list = Array.isArray(json) ? json : (json.enemies || json.bosses || Object.values(json).find(Array.isArray));
  assert.ok(JSON.stringify(list).includes(SUBJECT88_ID));
});
test('tougher than the content file and every other mini-boss', () => {
  assert.ok(SUBJECT88_MAX_HP > 200 && SUBJECT88.maxHp > GLITCH.maxHp);
});
test('telegraphs and names match mini-bosses.json', () => {
  const order = ['breath', 'spit', 'charge', 'slam', 'explosion'];
  assert.deepEqual(order.map((k) => SUBJECT88_MOVES[k].telegraphMs), [600, 650, 800, 750, 1000]);
  assert.deepEqual(order.map((k) => SUBJECT88_MOVES[k].name), ['Toxic Breath', 'Acid Spit', 'Frenzied Charge', 'Corrosion Slam', 'Chemical Explosion']);
  assert.ok(SUBJECT88_MOVES.spit.puddle.lifeMs === 3000);
  assert.ok(SUBJECT88_EXPLODE_AT.includes(0.4));
});
test('picker: explosion only when forced, charge only when flared', () => {
  assert.equal(pickSubject88Move(ctx({ forceExplosion: true, ready: rdy({ explosion: true }) }), () => 0).id, 'explosion');
  assert.notEqual(pickSubject88Move(ctx({ ready: rdy({ explosion: true }) }), () => 0)?.id, 'explosion');
  assert.equal(pickSubject88Move(ctx({ ready: only('charge') }), () => 0), null, 'not flared: no charge');
  assert.equal(pickSubject88Move(ctx({ flared: true, ready: only('charge') }), () => 0).id, 'charge');
  assert.equal(pickSubject88Move(ctx({ flared: true, dy: 100, ready: only('charge') }), () => 0), null, 'out of lane: no charge');
});
test('picker: range gates and no repeats', () => {
  assert.equal(pickSubject88Move(ctx({ dist: 100, ready: only('slam') }), () => 0).id, 'slam');
  assert.equal(pickSubject88Move(ctx({ dist: 400, ready: only('slam') }), () => 0), null);
  assert.equal(pickSubject88Move(ctx({ dist: 400, ready: only('spit') }), () => 0).id, 'spit');
  assert.equal(pickSubject88Move(ctx({ dist: 100, ready: only('spit') }), () => 0), null, 'too close to lob');
  assert.equal(pickSubject88Move(ctx({ dist: 400, lastId: 'spit', ready: only('spit') }), () => 0), null);
  assert.equal(pickSubject88Move(ctx({ ready: only('breath', { slam: false }), dist: 120 }), () => 0).id, 'breath');
});
