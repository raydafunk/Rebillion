import assert from 'node:assert/strict';
import {
  STORAGE_KEY, SETTINGS, getDefaults, loadSettings, saveSettings, isDirty, adjust, getSetting, displayValue,
} from './optionsData.js';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) }; };
const thrower = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };

// defaults
{
  const d = getDefaults();
  assert.equal(Object.keys(d).length, SETTINGS.length);
  assert.equal(d.masterVolume, 80); assert.equal(d.musicVolume, 70); assert.equal(d.screenShake, 'Full');
  assert.equal(d['bind.light'], undefined); // controls live in MenuScene, not Options
  assert.ok(SETTINGS.every((x) => !x.id.startsWith('bind.')));
  assert.equal(getDefaults({ reducedMotion: true }).reducedMotion, true);
}
// save / load round trip, corrupt + unavailable storage
{
  const st = mem(), v = getDefaults(); v.musicVolume = 30;
  assert.equal(saveSettings(st, v), true);
  assert.deepEqual(loadSettings(st), v);
  st.setItem(STORAGE_KEY, '{nope');
  assert.deepEqual(loadSettings(st), getDefaults());
  st.setItem(STORAGE_KEY, JSON.stringify({ musicVolume: 33, screenShake: 'Bogus', fullscreen: true }));
  const l = loadSettings(st);
  assert.equal(l.musicVolume, 70); assert.equal(l.screenShake, 'Full'); assert.equal(l.fullscreen, true);
  assert.equal(saveSettings(thrower, v), false); assert.equal(saveSettings(null, v), false);
  assert.deepEqual(loadSettings(thrower), getDefaults());
}
// dirty + adjust
{
  const a = getDefaults(), p = getDefaults();
  assert.equal(isDirty(p, a), false);
  p.sfxVolume = adjust(getSetting('sfxVolume'), p.sfxVolume, 1);
  assert.equal(p.sfxVolume, 85); assert.equal(isDirty(p, a), true);
  assert.equal(adjust(getSetting('sfxVolume'), 100, 1), 100); assert.equal(adjust(getSetting('sfxVolume'), 0, -1), 0);
  assert.equal(adjust(getSetting('screenShake'), 'Full', 1), 'Off'); // wraps
  assert.equal(adjust(getSetting('fullscreen'), false, 1), true);
  assert.equal(displayValue(getSetting('musicVolume'), 0), 'Off'); assert.equal(displayValue(getSetting('fullscreen'), true), 'On');
}
console.log('optionsData ok');
