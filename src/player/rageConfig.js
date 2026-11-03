// Zed Rage system: ALL tuning numbers in one place (spec: GameDesignDocument/Zed Rage System Spec.docx, sections 4-6).
// Numbers are playtest starting values. Plain data, no Phaser.
export const RAGE_CONFIG = {
  enabledFromLevel: 2,       // level numbers are 1-based; Level 1 is the pace level (meter hidden, cannot fill)
  max: 100,
  gainPerBlow: 3,            // same for light, heavy and jump kick; kills / finishers give no extra
  streakLength: 3,           // clean blows (no hit taken in between) before the bonus starts
  streakBonus: 2,            // extra per blow after streakLength clean blows (so +5)
  drainPerSec: 2,            // while BUILDING, always (fighting or not)
  readyWindowSec: 4,         // meter holds at max this long before it starts draining
  rageDurationSec: 9,        // ACTIVE length; meter falls max -> 0 on this fixed clock (~11.1 per sec)
};

// Rage entry flash + whole-world freeze (spec: design/art/rage-entry-flash.md sections 3-6, 11). All times are real (unscaled) ms.
export const RAGE_ENTRY_FX = {
  freezeMs: 450, flashInMs: 50, flashAlphaMax: 0.55, vignetteAlpha: 0.45,
  linesScale: [0.85, 1.25], linesPopMs: 120, holdEndMs: 300, fadeOutMs: 150, titleFadeFromMs: 360, titlePopMs: 120, titleScaleFrom: 1.4,
  shakeMs: 250, shakeIntensity: 0.005, linesJitterPx: 2, coreRadius: 230,
  burst: { count: 46, whiteCount: 4, seed: 0x52a6e, reach: 1000, lengthMin: 520, lengthMax: 760, widthMinPx: 14, widthMaxPx: 34, angleJitter: 0.35 }, // code-drawn line burst, design px at 1280x720
  colors: { red: 0xd62a1e, redWhite: 0xffe3d6, white: 0xffffff, ember: 0x7a2e1a, brown: 0x2e1f16, gold: 0xffd24a, brick: 0xa8402e },
  reduced: { freezeMs: 300, flashAlphaMax: 0.25, linesAlpha: 0.6, shake: false, pulse: false },
};

// Events re-emitted on game.events by Zed (payload: RageMeter snapshot() plus the fields noted).
export const RAGE_EVENTS = Object.freeze({
  CHANGED: 'rage-changed',     // value/state/timers changed: snapshot
  STATE: 'rage-state',         // { ...snapshot, from, to }
  GAIN: 'rage-gain',           // { ...snapshot, amount, bonus:boolean }   (HUD spark / number pop)
  READY: 'rage-ready',         // meter hit max; READY window open
  ACTIVATED: 'rage-activated', // Rage mode began
  ENDED: 'rage-ended',         // { ...snapshot, reason: 'expired' | 'knockout' | 'reset' }
  BUFFER: 'rage-buffer',       // { buffered:boolean }  L press queued / cancelled / consumed
});

// The single Special move (placeholders to balance; see spec section 10).
// `special` + `bossDamageCap` are forwarded on the hit-request so combat can cap damage vs bosses:
//   bossDamageCap = max damage one Special hit may deal to a boss; neverKills = it must leave the boss at >= 1 hp.
export const SPECIAL_MOVE = {
  startup: 8, active: 8, recovery: 24, cancelFrom: 999,
  damage: 22, knockback: 650, hitstun: 36,
  hitbox: { x: 16, y: -36, w: 96, h: 52 },
  special: true, bossDamageCap: 25, neverKills: true,
  chain: {},
};
