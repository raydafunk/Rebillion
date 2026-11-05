// Zed's shock look (Copper Fang taser hit). No Phaser; see design/art/zed-shock.md. Pure functions so they can be tested.
export const SHOCK = Object.freeze({
  minMs: 450,
  flickerHz: 14,
  stepMs: 55,           // arcs are redrawn this often so they crackle
  arcs: 5,
  arcsReduced: 2,
  segments: [4, 6],
  jitterPx: 2,
  cyan: 0x5fe8ff,
  white: 0xffffff,
  fadeFrom: 0.6,        // fraction of the shock after which everything fades
  depth: 5000,
});

/** Shock length in ms for a hit with `hitstunMs` of stun (the damage event's hitstun is in ms). */
export const shockDuration = (hitstunMs = 0) => Math.max(SHOCK.minMs, Math.round(hitstunMs));

/** Deterministic 0..1 noise so tests are stable. */
export const noise = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

/** Only a Specialist's landed hit shocks. attackerSkin is the enemy's skin; amount is the damage dealt. */
export const isShockHit = (attackerSkin, amount) => attackerSkin === 'rust-specialist' && amount > 0;

/** State at `t` ms into a shock of `total` ms. Returns null when it is over. */
export function shockState(t, total, reduce = false) {
  if (t < 0 || t >= total) return null;
  const u = t / total;
  const fade = u < SHOCK.fadeFrom ? 1 : 1 - (u - SHOCK.fadeFrom) / (1 - SHOCK.fadeFrom);
  const flicker = !reduce && u < SHOCK.fadeFrom;
  const phase = Math.floor((t / 1000) * SHOCK.flickerHz * 2) % 2;
  return {
    fade,
    tint: flicker ? (phase ? SHOCK.white : SHOCK.cyan) : SHOCK.cyan,
    tintFill: flicker && phase === 1,                 // white frames are a solid flash, cyan frames a wash
    jitterX: flicker ? (phase ? SHOCK.jitterPx : -SHOCK.jitterPx) : 0,
    arcs: reduce ? SHOCK.arcsReduced : Math.max(1, Math.round(SHOCK.arcs * fade)),
    step: Math.floor(t / SHOCK.stepMs),
  };
}

/** One jagged arc as [x, y] points inside the box (x, y, w, h), seeded by (step, index). Runs bottom to top with sideways zig-zags. */
export function arcPoints(box, step, index) {
  const n = SHOCK.segments[0] + Math.floor(noise(step, index) * (SHOCK.segments[1] - SHOCK.segments[0] + 1));
  const x0 = box.x + box.w * (0.15 + 0.7 * noise(step + 1, index));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const sway = (noise(step + i * 3, index * 7 + 1) - 0.5) * box.w * 0.55;
    pts.push([Math.min(box.x + box.w, Math.max(box.x, x0 + sway)), box.y + box.h * (1 - k)]);
  }
  return pts;
}
