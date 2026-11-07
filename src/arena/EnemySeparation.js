// Enemy spacing: stops live enemies stacking on one spot (e.g. when Zed stands against the end of the
// arena and the whole crowd is clamped to the same wall). Pure, no Phaser. Runs after enemies move and
// before the failsafe clamp. Enemies mid-swing (telegraph/attack) and bosses are anchors: others yield.
import { SEPARATION } from './arenaData.js';

const ANCHOR_STATES = new Set(['telegraph', 'attack']);

export function separateEnemies(grunts, bounds, cfg = SEPARATION) {
  const list = grunts.filter((g) => g.alive);
  const rx = cfg.radiusX, ry = cfg.radiusY;
  const range = bounds.locked ? bounds.xRange : { min: 0, max: bounds.world.w };
  const anchored = (g) => g.isBoss || g.miniBoss || ANCHOR_STATES.has(g.state);

  for (let pass = 0; pass < cfg.passes; pass++) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx / rx, dy / ry);   // 1 = just touching (elliptical: lanes are shallower than they are wide)
        if (d >= 1) continue;
        if (d < 0.001) { // exact overlap: pick a stable direction from the ids so pairs fan out, not jitter
          const s = (hash(a.id) + hash(b.id)) % 2 ? 1 : -1;
          dx = s * 0.01; dy = (hash(b.id) % 2 ? 1 : -1) * 0.5;
        }
        const len = Math.hypot(dx, dy) || 1;
        let ux = dx / len, uy = dy / len;
        const reach = 1 / Math.hypot(ux / rx, uy / ry);          // px gap the ellipse wants along this direction
        const push = Math.max(0, reach - len) * cfg.strength;   // px to move apart in total
        const wa = anchored(a) ? 0 : (anchored(b) ? 1 : 0.5), wb = anchored(b) ? 0 : (anchored(a) ? 1 : 0.5);
        if (wa + wb === 0) continue;
        // Against a wall the x push has nowhere to go: put it into depth (y) so the crowd fans out along the wall.
        const aWall = a.x <= range.min + 1 || a.x >= range.max - 1, bWall = b.x <= range.min + 1 || b.x >= range.max - 1;
        if ((aWall && bWall) && Math.abs(uy) < 0.5) { uy = uy >= 0 ? 1 : -1; ux *= 0.3; }
        a.x -= ux * push * wa; a.y -= uy * push * wa;
        b.x += ux * push * wb; b.y += uy * push * wb;
      }
    }
    // keep everyone inside the walkable area between passes so pushes cannot shove anyone out of the arena
    for (const g of list) {
      g.x = Math.min(range.max, Math.max(range.min, g.x));
      g.y = Math.min(bounds.lane.maxY, Math.max(bounds.lane.minY, g.y));
    }
  }
}

function hash(id) {
  let h = 0; const s = String(id);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Personal space around Zed: enemies that are walking, waiting or recovering never stand on top of him (a boss at point-blank makes the
// parry cue unreadable). Swinging / airborne / charging enemies are left alone (their moves own their position).
const GAP_STATES = new Set(['idle', 'approach', 'recover', 'block']);
export function keepFromPlayer(grunts, player, bounds, cfg = SEPARATION) {
  if (!player) return;
  const range = bounds.locked ? bounds.xRange : { min: 0, max: bounds.world.w };
  for (const g of grunts) {
    if (!g.alive || !GAP_STATES.has(g.state) || g.running || (g.lift || 0) > 0) continue;
    const gx = g.miniBoss || g.isBoss ? cfg.playerGapBossX : cfg.playerGapX;
    let dx = g.x - player.x; const dy = g.y - player.y;
    if (Math.hypot(dx / gx, dy / cfg.playerGapY) >= 1) continue;
    let sx = Math.sign(dx) || (hash(g.id) % 2 ? 1 : -1);
    const need = Math.abs(gx * Math.sqrt(Math.max(0, 1 - (dy / cfg.playerGapY) ** 2))) ;
    let nx = player.x + sx * need;
    if (nx < range.min + 1 || nx > range.max - 1) {           // Zed's back is to the wall: go around him in depth instead of through him
      nx = Math.min(range.max, Math.max(range.min, nx));
      const sy = Math.sign(dy) || (hash(g.id) % 2 ? 1 : -1);
      g.y = Math.min(bounds.lane.maxY, Math.max(bounds.lane.minY, player.y + sy * cfg.playerGapY));
    }
    g.x = nx;
  }
}
