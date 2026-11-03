// Victory card copy, one entry per boss. Keys are boss profile ids (the `bossProfile` sent with entity-registered,
// e.g. DUGAN_ID = 'rust-brick-dugan'). To add a boss line, add an entry here: no scene code changes.
// lines[0] is the big headline; any further lines are shown smaller underneath.
// A boss with no entry here gets no card.
import { DUGAN_ID } from '../enemies/duganData.js';
import { ROYCE_ID } from '../enemies/royceData.js';
import { KANE_ID } from '../enemies/kaneData.js';

export const VICTORY = {
  header: 'VICTORY',
  prompt: 'Enter / click to continue',
  autoMs: 8000,          // the card closes itself so it never blocks the player
  inputGuardMs: 300,     // ignore the Enter that was already down when the card opened
  showDelayMs: 1400,     // after the boss dies: let the fall animation play before the card drops in
  frameKey: 'ui.card.victory',
  frameW: 960,
  frameH: 460,
};

// PLACEHOLDER spelling "Dugen" is the owner's wording from the brief; the game spells the boss "Dugan".
export const VICTORY_LINES = {
  [DUGAN_ID]: { lines: ['The mighty Dugen has fallen.', 'The path forward is clear.'] },
  // PLACEHOLDER lines mirroring Dugan's card: the owner supplies Royce's real lines.
  [ROYCE_ID]: { lines: ['"Railgun" Royce has fallen.', 'Mustard Row is open.'] },
  // PLACEHOLDER lines for Level 3: the owner supplies Kane's real lines.
  [KANE_ID]: { lines: ['"Crusher" Kane has fallen.', 'The courts are open.'] },
  // 'rust-copper-fang': { lines: ['...', '...'] },
};

/** The card entry for a boss, or null when it has no (valid) lines. Optional per-boss `header` overrides the default. */
export function victoryFor(bossId, table = VICTORY_LINES) {
  const e = table[bossId];
  if (!e || !Array.isArray(e.lines)) return null;
  const lines = e.lines.filter((l) => typeof l === 'string' && l.trim().length > 0);
  if (!lines.length) return null;
  return { header: (typeof e.header === 'string' && e.header.trim()) || VICTORY.header, lines };
}

/** Problems found in a lines table (empty array = fine). Used by the unit test. */
export function victoryProblems(table = VICTORY_LINES) {
  const out = [];
  for (const [id, e] of Object.entries(table)) {
    if (!e || !Array.isArray(e.lines) || e.lines.length === 0) { out.push(`${id}: no lines`); continue; }
    e.lines.forEach((l, i) => { if (typeof l !== 'string' || !l.trim()) out.push(`${id}: line ${i + 1} is empty`); });
    if (e.lines.length > 3) out.push(`${id}: more than 3 lines will not fit the card`);
  }
  return out;
}
