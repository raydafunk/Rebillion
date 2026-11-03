// Rage intro card data: pure, no Phaser. Spec: design/art/rage-intro-card.md. Card: RageIntroCard.js.
// Shown ONCE per level start on Level 2 only (the first level with a Rage meter; Level 1 hides it).
// Numbers in the copy come from RAGE_CONFIG so the card can never disagree with the rules.
import { RAGE_CONFIG } from '../player/rageConfig.js';

export const RAGE_INTRO_LEVEL = 2;

// What the scene must preload: this.load.svg(RAGE_INTRO_ASSET.key, RAGE_INTRO_ASSET.path, { width: w, height: h })
export const RAGE_INTRO_ASSET = {
  key: 'ui.card.rage-intro',
  path: 'assets/ui/rage-intro-card-frame.svg', // PLACEHOLDER art, text-free
  w: 960,
  h: 460,
};

export const RAGE_INTRO = {
  title: 'RAGE',
  // Order matters: lines[2] (the L press) is the highlighted line.
  lines: [
    'Land blows on Rust enemies to fill the meter. Clean streaks fill it faster.',
    `It starts empty each level. At full it is READY for ${RAGE_CONFIG.readyWindowSec} seconds.`,
    `Press L to unleash Zed Rage for ${RAGE_CONFIG.rageDurationSec} seconds. Your attacks become the Rage move.`,
    'You can still move, jump and block. A hit will not end it, a knockout will.',
  ],
  highlightLine: 2,
  keyLabel: 'L',
  prompt: 'Enter / click to fight on',
  autoMs: 45000,       // long enough to read at leisure; Enter / click still dismisses it
  inputGuardMs: 1500,  // ignore early Enter/clicks (incl. the one that closed the level card) so it is not skipped unread
  frameKey: RAGE_INTRO_ASSET.key,
  frameW: RAGE_INTRO_ASSET.w,
  frameH: RAGE_INTRO_ASSET.h,
  depth: 7000,
  layout: {
    x: 160, y: 130,                   // top-left of the frame on the 1280x720 view
    titleY: 52, titleSize: 64,        // centred in the header strip
    textX: 340, textY: 116, textW: 600, // text column (inside-card x 180 + 160 from the left edge)
    lineSize: 22, lineGap: 8, lineSpacing: 3,
    promptY: 414, promptSize: 20,
    keyX: 175, keyY: 330, keySize: 40, // live "L" on the blank keycap
  },
  colors: { title: '#FFE3D6', titleStroke: '#2E1F16', line: '#F4E6C8', highlight: '#FFD24A', prompt: '#F4E6C8', key: '#2E1F16' },
};

/** True only on Level 2 (1-based level number). */
export function shouldShowRageIntro(levelNumber) {
  return levelNumber === RAGE_INTRO_LEVEL;
}

/** Problems found in the card data (empty array = fine). */
export function rageIntroProblems(d = RAGE_INTRO) {
  const out = [];
  if (!d.title || !d.title.trim()) out.push('title is empty');
  if (!Array.isArray(d.lines) || d.lines.length < 3 || d.lines.length > 4) out.push('needs 3 to 4 lines');
  else d.lines.forEach((l, i) => { if (typeof l !== 'string' || !l.trim()) out.push(`line ${i + 1} is empty`); else if (l.length > 90) out.push(`line ${i + 1} is too long`); });
  if (!d.prompt || !d.prompt.trim()) out.push('prompt is empty');
  if (!(d.autoMs > 0)) out.push('autoMs must be positive');
  return out;
}
