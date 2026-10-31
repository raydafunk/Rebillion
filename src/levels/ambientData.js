// Ambient background animation: pure layout helpers, no Phaser, so they are unit-testable.
// A level style may carry an `ambient` block (see content/levels/styles/level-01-brick-red-alley.json).
// Its x positions are measured inside one background image of `period` px; the image repeats along the level.

/** Every copy of the x positions that starts inside [0, worldW). */
export function tiledXs(xs, period, worldW) {
  if (!Array.isArray(xs) || !(period > 0) || !(worldW > 0)) return [];
  const out = [];
  for (let offset = 0; offset < worldW; offset += period) {
    for (const x of xs) if (offset + x < worldW) out.push(offset + x);
  }
  return out;
}

/** Shopfront slots for a row-style background: x of each shop, and whether its shutter is still chained. */
export function rowShops(row, worldW) {
  if (!row || !(row.period > 0) || !(row.shopPitch > 0) || !(row.shopCount > 0) || !(worldW > 0)) return [];
  const out = [];
  for (let offset = 0; offset < worldW; offset += row.period) {
    for (let i = 0; i < row.shopCount; i++) {
      const x = offset + row.shopX0 + i * row.shopPitch;
      if (x < worldW) out.push({ x, chained: i < row.chainedCount });
    }
  }
  return out;
}

/** Bulb positions along the string-light wire; y follows the wire's sag per span. */
export function rowBulbs(row, worldW) {
  if (!row || !(row.period > 0) || !(row.bulbStep > 0) || !(row.bulbCount > 0) || !(row.bulbSpan > 0)) return [];
  const out = [];
  for (let offset = 0; offset < worldW; offset += row.period) {
    for (let i = 0; i < row.bulbCount; i++) {
      const x = offset + row.bulbX0 + i * row.bulbStep;
      if (x >= worldW) continue;
      const t = ((row.bulbX0 + i * row.bulbStep) % row.bulbSpan) / row.bulbSpan;
      out.push({ x, y: row.bulbY + 4 * t * (1 - t) * row.bulbSag, i });
    }
  }
  return out;
}

function readRow(period, r) {
  if (!r || !(r.shopPitch > 0)) return null;
  const num = (v, d) => (Number.isFinite(v) && v >= 0 ? v : d);
  return {
    period,
    shopX0: num(r.shopX0, 8), shopPitch: r.shopPitch, shopCount: Math.round(num(r.shopCount, 8)), chainedCount: Math.round(num(r.chainedCount, 0)),
    bulbX0: num(r.bulbX0, 34), bulbStep: num(r.bulbStep, 68), bulbCount: Math.round(num(r.bulbCount, 0)),
    bulbY: num(r.bulbY, 14), bulbSag: num(r.bulbSag, 22), bulbSpan: num(r.bulbSpan, 960),
    crazy: Math.max(0, Math.min(3, num(r.crazy, 1))),
  };
}

/** Cleaned ambient config, or null when there is nothing to animate. */
export function readAmbient(style) {
  const a = style && style.ambient;
  if (!a || !(a.period > 0)) return null;
  const num = (v, d) => (Number.isFinite(v) ? v : d);
  return {
    period: a.period,
    windowY: num(a.windowY, 110), windowW: num(a.windowW, 140), windowH: num(a.windowH, 170),
    color: typeof a.color === 'string' ? a.color : '#E3A92B',
    lit: Array.isArray(a.lit) ? a.lit : [],
    dark: Array.isArray(a.dark) ? a.dark : [],
    dustPerBeam: Math.max(0, Math.min(12, Math.round(num(a.dustPerBeam, 6)))),
    beamBottom: num(a.beamBottom, 430),
    row: readRow(a.period, a.row),
    outdoor: readOutdoor(a.outdoor),
    heights: readHeights(a.heights),
    market: readMarket(a.market),
    court: readCourt(a.court),
    tower: readTower(a.tower),
  };
}

// ---- Market (Level 6 Iron Line Push) helpers ----
const pointsOf = (list, minLen) =>
  (Array.isArray(list) ? list : []).filter((p) => Array.isArray(p) && p.length >= minLen && p.slice(0, minLen).every(Number.isFinite));

function readMarket(m) {
  if (!m || typeof m !== 'object') return null;
  const n = (v, d, max) => Math.max(0, Math.min(max, Math.round(Number.isFinite(v) ? v : d)));
  return {
    steam: pointsOf(m.steam, 2),               // [x, y] of a pot rim, steam rises from here
    puffsPerPot: n(m.puffsPerPot, 4, 8),
    flags: pointsOf(m.flags, 2),               // [x, y, colourIndex] top-left of a bunting flag
    flagColors: Array.isArray(m.flagColors) && m.flagColors.length ? m.flagColors : ['#A8402E', '#E3A92B', '#2F6B3F'],
    hangers: pointsOf(m.hangers, 3),           // [x, y, stringLength, kind] kind 0 pot, 1 ladle; y is the hook
    neighbours: pointsOf(m.neighbours, 2),     // [x, y, kind] head centre; kind 0 plain, 1 hat, 2 apron and ladle
    visors: pointsOf(m.visors, 2),             // [x, y] of a distant Rust visor slit
  };
}
export { readMarket };

/** Flutter timing for the bunting: neighbouring flags are a little out of step so a gust travels along the wire. */
export function flagPhase(x, period) {
  if (!(period > 0) || !Number.isFinite(x)) return 0;
  return ((x % period) / period) * 2400;
}

// ---- Heights (Level 5 Songwindow Heights) helpers ----
const isPoint = (p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]);

function readHeights(h) {
  if (!h || typeof h !== 'object') return null;
  const n = (v, d, max) => Math.max(0, Math.min(max, Math.round(Number.isFinite(v) ? v : d)));
  return {
    windows: (Array.isArray(h.windows) ? h.windows : []).filter(isPoint),   // [x, y] top-left of a lit window
    windowW: n(h.windowW, 45, 200), windowH: n(h.windowH, 62, 200),
    laundry: (Array.isArray(h.laundry) ? h.laundry : []).filter(isPoint),   // [x, y] where a hanging cloth is pinned
    laundryColors: Array.isArray(h.laundryColors) && h.laundryColors.length ? h.laundryColors : ['#F4E6C8', '#2F6B3F', '#E3A92B'],
    noteColors: Array.isArray(h.noteColors) && h.noteColors.length ? h.noteColors : ['#F4E6C8', '#E3A92B'],
    notesPerWindow: n(h.notesPerWindow, 2, 4),
  };
}
export { readHeights };

// ---- Outdoor (Level 3 golden hour) helpers ----
/** Lowest y any outdoor ambient piece may reach: just above the lane (y 460 to 680) so the fight stays readable. */
export const OUTDOOR_MAX_Y = 440;

/** Clamp a y so the piece never enters the lane. */
export function laneSafeY(y) {
  return Math.min(Number.isFinite(y) ? y : OUTDOOR_MAX_Y, OUTDOOR_MAX_Y);
}

/** Tile items whose first element is an x (e.g. [x, y, r]) across the world; the first element is shifted per copy. */
export function tiledItems(items, period, worldW) {
  if (!Array.isArray(items) || !(period > 0) || !(worldW > 0)) return [];
  const out = [];
  for (let offset = 0; offset < worldW; offset += period) {
    for (const it of items) {
      if (Array.isArray(it) && Number.isFinite(it[0]) && offset + it[0] < worldW) out.push([offset + it[0], ...it.slice(1)]);
    }
  }
  return out;
}

/** Rim puff positions on the upper half of a canopy [x, y, r]: `n` points spread over the top arc. */
export function canopyPuffs(tree, n) {
  if (!Array.isArray(tree) || !(tree[2] > 0) || !(n > 0)) return [];
  const [cx, cy, r] = tree, out = [];
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (1.15 + (0.7 * (i + 0.5)) / n); // between about 207 and 333 degrees (upper arc)
    out.push({ x: cx + Math.cos(a) * r * 0.93, y: cy + Math.sin(a) * r * 0.93 });
  }
  return out;
}

/** x range [min, max] in which to spawn a drifting piece: around the camera, kept inside the world. */
export function spawnRange(scrollX, viewW, worldW, margin = 120) {
  const lo = Math.max(0, (Number.isFinite(scrollX) ? scrollX : 0) - margin);
  const hi = Math.min(worldW, lo + viewW + margin * 2);
  return [lo, Math.max(lo, hi)];
}

function readOutdoor(o) {
  if (!o || typeof o !== 'object') return null;
  const n = (v, d, max) => Math.max(0, Math.min(max, Math.round(Number.isFinite(v) ? v : d)));
  return {
    trees: Array.isArray(o.trees) ? o.trees : [],
    clouds: Array.isArray(o.clouds) ? o.clouds : [],
    shafts: Array.isArray(o.shafts) ? o.shafts : [],
    suns: Array.isArray(o.suns) ? o.suns : [],
    puffsPerTree: n(o.puffsPerTree, 2, 4),
    leaves: n(o.leaves, 8, 14),
    birds: n(o.birds, 2, 4),
    motes: n(o.motes, 12, 20),
    leafColors: Array.isArray(o.leafColors) && o.leafColors.length ? o.leafColors : ['#3A7B4A', '#E3A92B'],
  };
}
export { readOutdoor };

// ---- Court (Level 7 Copper Fang at the Courts) helpers ----
export const lerp = (a, b, t) => a + (b - a) * t;

function readCourt(c) {
  if (!c || typeof c !== 'object') return null;
  const nums = (v, len) => Array.isArray(v) && v.length >= len && v.slice(0, len).every(Number.isFinite) ? v.slice(0, len) : null;
  const hoop = nums(c.hoop, 4), screen = nums(c.screen, 4), dish = nums(c.dish, 2), sun = nums(c.sun, 2);
  if (!hoop || !screen || !dish || !sun) return null;
  const n = (v, d, max) => Math.max(0, Math.min(max, Math.round(Number.isFinite(v) ? v : d)));
  return {
    hoop,                                      // [leftRimX, leftRimY, rightRimX, rightRimY]
    screen,                                    // [x, y, w, h] of the cyan screen
    dish, sun,                                 // [x, y]
    roof: (Array.isArray(c.roof) ? c.roof : []).filter((p) => nums(p, 2)),   // tent edge polyline
    banners: pointsOf(c.banners, 2),           // [x, y] diamond centres
    lamps: pointsOf(c.lamps, 2),               // [x, y] floodlight heads
    trees: pointsOf(c.trees, 2),               // [x, y] canopy centres that shed leaves
    drones: n(c.drones, 2, 4), birds: n(c.birds, 4, 10), clouds: n(c.clouds, 4, 8), fireflies: n(c.fireflies, 8, 20),
  };
}
export { readCourt };

// ---- Tower (Level 8 The Overseer's Tower) helpers ----
function readTower(t) {
  if (!t || typeof t !== 'object') return null;
  const nums = (v, len) => Array.isArray(v) && v.length >= len && v.slice(0, len).every(Number.isFinite) ? v.slice(0, len) : null;
  const eye = nums(t.eye, 2);
  if (!eye) return null;
  const n = (v, d, max) => Math.max(0, Math.min(max, Math.round(Number.isFinite(v) ? v : d)));
  return {
    eye,                                       // [x, y] centre of the cyan eye
    antenna: nums(t.antenna, 2),               // [x, y] of the antenna tip
    cone: (Array.isArray(t.cone) ? t.cone : []).filter((p) => nums(p, 2)),   // light cone polygon, kept above the lane
    beacons: pointsOf(t.beacons, 2),           // [x, y] red lights on the tower struts
    skylineBeacons: pointsOf(t.skylineBeacons, 2),   // [x, y] red lights on the Heights
    embers: n(t.embers, 12, 24), motes: n(t.motes, 8, 16), clouds: n(t.clouds, 3, 6),
    sun: nums(t.sun, 2),                       // [x, y] centre of the setting sun
    slits: pointsOf(t.slits, 2),               // [x, y] window slits on the tower shaft that flicker cyan
    twinkles: pointsOf(t.twinkles, 2),         // [x, y] lit windows on the Heights that twinkle
    sweeps: n(t.sweeps, 2, 4), birds: n(t.birds, 4, 8), sparks: n(t.sparks, 3, 8),
  };
}
export { readTower };

/** Evenly spaced dots along a polyline of [x, y] points. */
export function roofDots(poly, n) {
  if (!Array.isArray(poly) || poly.length < 2 || !(n > 1)) return [];
  const segs = [];
  let total = 0;
  for (let i = 1; i < poly.length; i++) {
    const len = Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]);
    segs.push(len); total += len;
  }
  const out = [];
  for (let k = 0; k < n; k++) {
    let d = (total * k) / (n - 1), i = 0;
    while (i < segs.length - 1 && d > segs[i]) { d -= segs[i]; i++; }
    const t = segs[i] ? Math.min(1, d / segs[i]) : 0;
    out.push([lerp(poly[i][0], poly[i + 1][0], t), lerp(poly[i][1], poly[i + 1][1], t)]);
  }
  return out;
}
