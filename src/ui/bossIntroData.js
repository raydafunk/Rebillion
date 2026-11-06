// Boss intro story cards: a short Zed / boss conversation shown once the boss has walked in and stopped (idle),
// right before the fight starts. Keys are boss profile ids (the `bossProfile` sent with entity-registered).
// To add a boss: add an entry below (and drop its portrait art in). No scene code changes.
//
// PLACEHOLDER: every line below is a stand-in for the owner to replace. Edit `beats` freely (1-6 beats).
// ART SLOTS: portraits are tall cut-outs (about 420x560, transparent PNG or SVG). The files in assets/ui/story/ are
// grey-box placeholders; overwrite them (same file names) or change `path` here. See design/art/boss-intro-card.md.
import { KANE_ID } from '../enemies/kaneData.js';

export const BOSS_INTRO = {
  prompt: 'Enter / click to continue',
  lastPrompt: 'Enter / click to fight',
  inputGuardMs: 300,     // ignore the key that was already down when the card opened
  autoMs: 90000,         // safety net only: the card closes itself so it can never block the round
  depth: 7000,
  trigger: { insetPx: 220, maxDistPx: 560 }, // boss counts as "walked in" once this far inside the screen edge, or this close to Zed
  portrait: { w: 420, h: 560, y: 40, leftX: 60, rightX: 800 },
};

export const BOSS_INTROS = {
  [KANE_ID]: {
    title: 'GREENLINE COURTS', // PLACEHOLDER
    portraits: {
      zed:  { key: 'story.portrait.zed',  path: 'assets/ui/story/zed-portrait.svg' },
      boss: { key: 'story.portrait.kane', path: 'assets/ui/story/kane-portrait.svg' },
    },
    // side: 'zed' (left) or 'boss' (right). PLACEHOLDER lines.
    beats: [
      { side: 'boss', name: '"Crusher" Kane', text: '[PLACEHOLDER] Kane line 1: the boss sizes Zed up.' },
      { side: 'zed',  name: 'Zed',            text: '[PLACEHOLDER] Zed line 1: Zed answers back.' },
      { side: 'boss', name: '"Crusher" Kane', text: '[PLACEHOLDER] Kane line 2: the threat.' },
      { side: 'zed',  name: 'Zed',            text: '[PLACEHOLDER] Zed line 2: the courts are not yours.' },
    ],
  },
};

/** The intro entry for a boss, or null when it has none (or no valid beats). */
export function bossIntroFor(bossId, table = BOSS_INTROS) {
  const e = table[bossId];
  if (!e || !Array.isArray(e.beats)) return null;
  const beats = e.beats.filter((b) => b && (b.side === 'zed' || b.side === 'boss') && typeof b.text === 'string' && b.text.trim());
  if (!beats.length) return null;
  return { ...e, beats };
}

/** Problems found in an intro table (empty array = fine). Used by the unit test. */
export function bossIntroProblems(table = BOSS_INTROS) {
  const out = [];
  for (const [id, e] of Object.entries(table)) {
    if (!e || !Array.isArray(e.beats) || e.beats.length === 0) { out.push(`${id}: no beats`); continue; }
    if (e.beats.length > 6) out.push(`${id}: more than 6 beats`);
    e.beats.forEach((b, i) => {
      if (!b || (b.side !== 'zed' && b.side !== 'boss')) out.push(`${id}: beat ${i + 1} side must be 'zed' or 'boss'`);
      else if (typeof b.text !== 'string' || !b.text.trim()) out.push(`${id}: beat ${i + 1} has no text`);
      else if (b.text.length > 220) out.push(`${id}: beat ${i + 1} is over 220 characters`);
    });
    for (const side of ['zed', 'boss']) {
      const p = e.portraits && e.portraits[side];
      if (!p || !p.key || !p.path) out.push(`${id}: portrait '${side}' needs a key and a path`);
    }
  }
  return out;
}

/** Every portrait asset the given boss ids need (for preload). */
export function introPortraitAssets(bossIds, table = BOSS_INTROS) {
  const seen = new Map();
  for (const id of bossIds) {
    const e = table[id];
    if (e && e.portraits) for (const p of Object.values(e.portraits)) if (p && p.key && p.path) seen.set(p.key, p);
  }
  return [...seen.values()];
}

/** True once a walking-in boss is far enough on screen (or close enough to Zed) to stop and talk. */
export function introTriggered({ bossX, zedX, viewLeft, viewRight }, t = BOSS_INTRO.trigger) {
  const onScreen = bossX >= viewLeft + t.insetPx && bossX <= viewRight - t.insetPx;
  return onScreen || Math.abs(bossX - zedX) <= t.maxDistPx;
}
