// Options settings: schema, defaults, load/save, pure helpers. No Phaser here so it can be unit tested.
// Copy and control specs: content/dialogue/options-menu.json. Music, SFX and Fullscreen come from the GDD menu docx
// (Options table); everything else is a PROPOSED placeholder pending owner approval. Controls/key bindings are NOT here.

export const STORAGE_KEY = 'rebellion.options.v1';

export const CATEGORIES = [
  { id: 'audio', title: 'SOUND', sub: 'Turn the street up or down.' },
  { id: 'video', title: 'PICTURE', sub: 'Big screen, soft shake, your call.' },
  { id: 'gameplay', title: 'THE FIGHT', sub: 'Same fight, your pace.' },
  { id: 'accessibility', title: 'EASY ON THE EYES', sub: 'Pick what feels good.' },
];

const ONOFF = { options: [true, false], labels: ['On', 'Off'] };
const slider = { control: 'slider', min: 0, max: 100, step: 5 };

export const SETTINGS = [
  { id: 'masterVolume', category: 'audio', ...slider, label: 'MASTER VOLUME', hint: 'Turns the whole street up or down.', default: 80 },
  { id: 'musicVolume', category: 'audio', ...slider, label: 'MUSIC', hint: 'Music drifting out of the open windows.', default: 70 },
  { id: 'sfxVolume', category: 'audio', ...slider, label: 'SFX', hint: 'Hits, parries and dodges.', default: 80 },
  { id: 'muteOnFocusLoss', category: 'audio', control: 'toggle', ...ONOFF, label: 'MUTE WHEN AWAY', hint: 'Goes quiet when you switch tabs.', default: true },
  { id: 'fullscreen', category: 'video', control: 'toggle', ...ONOFF, label: 'FULLSCREEN', hint: 'Esc leaves fullscreen first in most browsers.', default: false },
  { id: 'screenShake', category: 'video', control: 'select', options: ['Off', 'Light', 'Full'], label: 'SCREEN SHAKE', hint: 'Turn it down if it is too much.', default: 'Full' },
  { id: 'hitFlash', category: 'video', control: 'select', options: ['Low', 'Medium', 'High'], label: 'HIT FLASH', hint: 'Lower it if flashes bother your eyes.', default: 'Medium' },
  { id: 'timerVisibility', category: 'gameplay', control: 'toggle', options: ['Shown', 'Hidden'], label: 'TIMER', hint: 'Hiding it does not stop it. Time still counts.', default: 'Shown' },
  { id: 'noticeDisplay', category: 'gameplay', control: 'select', options: ['Short', 'Normal', 'Long'], label: 'NOTICES', hint: 'How long little pop-up notes stay up.', default: 'Normal' },
  { id: 'reducedMotion', category: 'accessibility', control: 'toggle', ...ONOFF, label: 'REDUCED MOTION', hint: 'Calms strips that tilt, slide and rattle.', default: false },
  { id: 'highContrast', category: 'accessibility', control: 'toggle', ...ONOFF, label: 'HIGH CONTRAST', hint: 'Bolder lines and plainer colours.', default: false },
  { id: 'textSize', category: 'accessibility', control: 'select', options: ['Normal', 'Large', 'Extra large'], label: 'TEXT SIZE', hint: 'Makes the words on screen bigger.', default: 'Normal' },
];

export const NOTICE_MS = { Short: 1000, Normal: 2000, Long: 4000 };

export const COPY = {
  title: 'OPTIONS',
  sub: 'Changes wait for Apply. Esc backs out.',
  applySaved: 'Saved. Nice and tidy.',
  applyNone: 'Nothing to apply yet.',
  applyFail: "Couldn't save here. Changes last until you close the tab.", // not in options-menu.json; flagged
  resetPrompt: 'Reset all settings?',
  resetYes: 'Yes, reset',
  resetKeep: 'Keep mine',
  unsavedPrompt: ['You changed a few things.', 'Apply them before you go?'],
  unsavedButtons: ['Apply', 'Leave without saving', 'Stay here'],
};

const byId = new Map(SETTINGS.map((s) => [s.id, s]));
export const getSetting = (id) => byId.get(id);

export const clone = (v) => JSON.parse(JSON.stringify(v));

// env: { reducedMotion, highContrast } from browser media queries (first run only).
export function getDefaults(env = {}) {
  const out = {};
  for (const s of SETTINGS) out[s.id] = clone(s.default);
  if (env.reducedMotion) out.reducedMotion = true;
  if (env.highContrast) out.highContrast = true;
  return out;
}

function valid(s, v) {
  switch (s.control) {
    case 'slider': return Number.isFinite(v) && v >= s.min && v <= s.max && (v - s.min) % s.step === 0;
    case 'toggle': case 'select': return s.options.includes(v);
    default: return false;
  }
}

// Merge stored values over defaults, dropping anything invalid. Never throws.
export function loadSettings(storage, env = {}) {
  const out = getDefaults(env);
  try {
    const raw = storage && storage.getItem(STORAGE_KEY);
    if (!raw) return out;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return out;
    for (const s of SETTINGS) if (s.id in data && valid(s, data[s.id])) out[s.id] = clone(data[s.id]);
  } catch (e) { /* storage unavailable or corrupt: fall back to defaults */ }
  return out;
}

// Returns true on success, false if storage is missing or throws.
export function saveSettings(storage, values) {
  try {
    if (!storage) return false;
    storage.setItem(STORAGE_KEY, JSON.stringify(values));
    return true;
  } catch (e) { return false; }
}

export const isDirty = (pending, applied) => JSON.stringify(pending) !== JSON.stringify(applied);

// Change a value one step. dir = -1 / +1. Sliders clamp; select/toggle wrap.
export function adjust(setting, value, dir) {
  if (setting.control === 'slider') return Math.min(setting.max, Math.max(setting.min, value + dir * setting.step));
  if (setting.control === 'select' || setting.control === 'toggle') {
    const n = setting.options.length;
    return setting.options[(setting.options.indexOf(value) + dir + n) % n];
  }
  return value;
}

export function displayValue(setting, value) {
  if (setting.control === 'slider') return value === 0 ? 'Off' : String(value);
  if (setting.labels) return setting.labels[setting.options.indexOf(value)];
  if (setting.control === 'select' || setting.control === 'toggle') return String(value);
  return String(value);
}
