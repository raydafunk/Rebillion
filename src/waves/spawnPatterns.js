// Where each enemy of a wave enters. Pure, no Phaser. Waves without a spawnPattern keep the fixed edge round-robin.
//   alternate  left, right, left, right (first one on the side away from Zed)
//   flank      pairs: two enter from the far side, the next two from Zed's side, and so on
//   ambush     mostly from behind Zed (the side he is not facing), every third from the front
//   surge      a wall marching in from the far side; only the last one comes from the other edge
//   pincer     the teaching wave for crowd control: one from each edge in turn (far, near, far, near), so Zed is always
//              sandwiched and learns to step out until both are in front of him. Use with a low maxAlive (2).
// Depth always varies across the lane so enemies do not line up on one row.
export const SPAWN_PATTERNS = Object.freeze(['alternate', 'flank', 'ambush', 'surge', 'pincer']);

export const LEADER_ENTRANCES = Object.freeze(['far-side', 'near-side', 'front', 'behind']);

export const VIEW_W = 1280;
export const EDGE_INSET = 60;       // matches the fixed spawn points (lockX + 60 / lockX + VIEW_W - 60)
export const MIN_SPAWN_GAP = 260;   // never appear closer than this to Zed horizontally
const LANE_YS = Object.freeze([500, 545, 590, 635, 655]);
const Y_JITTER = 14;
const X_JITTER = 36;

const leftX = (lockX) => lockX + EDGE_INSET;
const rightX = (lockX) => lockX + VIEW_W - EDGE_INSET;

/**
 * @param {object} o
 * @param {string} o.pattern  one of SPAWN_PATTERNS
 * @param {number} o.lockX    camera lock of the wave
 * @param {number} o.index    0-based spawn number within the wave
 * @param {number} o.count    enemies in the wave
 * @param {number} o.waveIndex
 * @param {{x:number, facing:number}} o.player  Zed
 * @param {'left'|'right'} [o.anchorSide]  surge/pincer: the far side picked at the wave's first spawn (surge: the wall keeps to one edge; pincer: pairs stay split)
 * @param {() => number} [o.rng]  0..1, injected so tests are deterministic
 * @returns {{x:number, y:number, side:'left'|'right'}}
 */
export function pickSpawn({ pattern, lockX, index, count, waveIndex = 0, player, anchorSide = null, rng = Math.random }) {
  const mid = lockX + VIEW_W / 2;
  const other = (s) => (s === 'left' ? 'right' : 'left');
  // surge and pincer lock their sides at the wave's first spawn, so Zed walking across the middle cannot put a pair on one edge.
  const farSide = (pattern === 'surge' || pattern === 'pincer') && anchorSide ? anchorSide : (player.x < mid ? 'right' : 'left');
  const nearSide = other(farSide);
  const behindSide = player.facing >= 0 ? 'left' : 'right';
  const frontSide = other(behindSide);

  let side;
  switch (pattern) {
    case 'flank': side = Math.floor(index / 2) % 2 === 0 ? farSide : nearSide; break;
    case 'ambush': side = index % 3 === 2 ? frontSide : behindSide; break;
    case 'surge': side = index === count - 1 && count > 1 ? nearSide : farSide; break;
    case 'pincer': side = index % 2 === 0 ? farSide : nearSide; break;
    case 'alternate':
    default: side = index % 2 === 0 ? farSide : nearSide;
  }

  // Do not drop an enemy on top of Zed: if the chosen edge is too close, use the other one.
  const edge = (s) => (s === 'left' ? leftX(lockX) : rightX(lockX));
  if (Math.abs(edge(side) - player.x) < MIN_SPAWN_GAP && Math.abs(edge(other(side)) - player.x) >= MIN_SPAWN_GAP) side = other(side);

  const inward = Math.round(rng() * X_JITTER) * (side === 'left' ? 1 : -1);
  const y = LANE_YS[(index * 2 + waveIndex) % LANE_YS.length] + Math.round((rng() * 2 - 1) * Y_JITTER);
  return { x: edge(side) + inward, y, side };
}

/**
 * Where a wave's leader (a mini-boss) walks in: one of LEADER_ENTRANCES, relative to Zed.
 * far-side = the edge away from Zed, near-side = the edge on Zed's side, front/behind = the side Zed faces / turns his back to.
 * Same edge rules as pickSpawn (never within MIN_SPAWN_GAP of Zed). The leader walks in mid-lane.
 */
export function pickLeaderSpawn({ entrance = 'far-side', lockX, player }) {
  const mid = lockX + VIEW_W / 2;
  const farSide = player.x < mid ? 'right' : 'left';
  const other = (s) => (s === 'left' ? 'right' : 'left');
  const behindSide = player.facing >= 0 ? 'left' : 'right';
  let side = { 'far-side': farSide, 'near-side': other(farSide), front: other(behindSide), behind: behindSide }[entrance] || farSide;
  const edge = (s) => (s === 'left' ? leftX(lockX) : rightX(lockX));
  if (Math.abs(edge(side) - player.x) < MIN_SPAWN_GAP && Math.abs(edge(other(side)) - player.x) >= MIN_SPAWN_GAP) side = other(side);
  return { x: edge(side), y: 580, side };
}
