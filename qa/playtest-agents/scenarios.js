// What the two playtest agents play. One entry = one recorded run.
// level/wave are 1-based. wave+solo use ArenaScene's own test flags (?wave=N drops into that wave, ?solo sends a leader in alone).
// stopOn: 'round' waits for the win/lose screen; 'wave' stops once that wave is cleared (boss fights inside a longer level).

const lvl = (level, persona, extra = {}) => ({ id: `L${level}-${persona}`, agent: 'playtest-level-agent', level, persona, stopOn: 'round', maxSec: 330, ...extra });

// playtest-level-agent: every level start to finish with the competent Brawler, plus adversarial passes.
export const LEVEL_SCENARIOS = [
  lvl(1, 'brawler'), lvl(2, 'brawler'), lvl(3, 'brawler'), lvl(4, 'brawler'),
  lvl(5, 'brawler'), lvl(6, 'brawler'), lvl(7, 'brawler'), lvl(8, 'brawler'),
  lvl(1, 'button-masher', { maxSec: 150 }),
  lvl(2, 'edge-exploiter', { maxSec: 150 }),
  lvl(3, 'turtle', { maxSec: 75 }),
  lvl(6, 'parry-master', { maxSec: 200 }),
  lvl(1, 'rookie'),
];

// playtest-boss-agent: mini-bosses (mid-level boss waves, and Brick Dugan, the canon Level 1 mini-boss) and end-of-level bosses.
// Only Dugan has bespoke boss AI today; the Overseer/Copper Fang/Halden Varr waves are stand-in grunts with an HP multiplier
// (levelData.js STAND_IN), so their runs measure the wave's pacing, not a finished boss.
const boss = (o) => ({ agent: 'playtest-boss-agent', persona: 'boss-hunter', stopOn: 'wave', maxSec: 180, ...o });
export const BOSS_SCENARIOS = [
  boss({ id: 'MB-dugan-solo', tier: 'mini-boss', boss: '"Brick" Dugan (solo)', level: 1, wave: 5, solo: true, bespoke: true }),
  boss({ id: 'MB-L4-holt', tier: 'mini-boss', boss: 'Overseer Dr. Maren Holt wave', level: 4, wave: 2 }),
  boss({ id: 'MB-L5-copper-fang', tier: 'mini-boss', boss: 'Rust Copper Fang wave', level: 5, wave: 2 }),
  boss({ id: 'MB-L5-wren', tier: 'mini-boss', boss: 'Overseer Silas Wren wave', level: 5, wave: 5 }),
  boss({ id: 'EB-L1-dugan-crew', tier: 'end-boss', boss: '"Brick" Dugan + crew (Level 1 finale)', level: 1, wave: 5, bespoke: true, stopOn: 'round' }),
  boss({ id: 'EB-L5-copper-fang', tier: 'end-boss', boss: 'Rust Copper Fang (Level 5 finale)', level: 5, wave: 7, stopOn: 'round' }),
  boss({ id: 'EB-L7-copper-fang', tier: 'end-boss', boss: 'Rust Copper Fang (Level 7 finale)', level: 7, wave: 3, stopOn: 'round' }),
  boss({ id: 'EB-L8-halden-varr', tier: 'end-boss', boss: 'Overseer Halden Varr (final boss)', level: 8, wave: 4, stopOn: 'round' }),
  boss({ id: 'EB-L1-dugan-crew-rookie', tier: 'end-boss', boss: '"Brick" Dugan + crew vs a first-timer', level: 1, wave: 5, bespoke: true, persona: 'rookie', stopOn: 'round' }),
  // Adversarial passes on the one bespoke boss.
  boss({ id: 'ADV-dugan-edge', tier: 'mini-boss', boss: 'Dugan vs Edge Exploiter', level: 1, wave: 5, solo: true, bespoke: true, persona: 'edge-exploiter', maxSec: 150 }),
  boss({ id: 'ADV-dugan-masher', tier: 'mini-boss', boss: 'Dugan vs Button Masher', level: 1, wave: 5, solo: true, bespoke: true, persona: 'button-masher', maxSec: 150 }),
];

export const SUITES = { levels: LEVEL_SCENARIOS, bosses: BOSS_SCENARIOS, all: [...LEVEL_SCENARIOS, ...BOSS_SCENARIOS] };

export const scenarioUrl = (s, seed = 1, renderer = '') => {
  const q = new URLSearchParams({ level: String(s.level), agent: s.persona, seed: String(seed) });
  if (renderer) q.set('renderer', renderer);
  if (s.wave) q.set('wave', String(s.wave));
  let u = `playtest.html?${q}`;
  if (s.solo) u += '&solo';
  return u;
};
