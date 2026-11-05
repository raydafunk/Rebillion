// Rust Specialist (Copper Fangs) ranged state: Taser Shots, then the Baton Strike. No Phaser.
// The sequence: at mid range, lined up with Zed, the Specialist raises the rifle (red lane line = telegraph), fires BOLTS taser bolts along its
// lane, then closes in and follows with a baton string (the plain 1-2-3 swing). Bolts travel, so a sidestep in depth, a jump or a parry beats them.
// Animation: assets/.../A_ranged_state (9 frames, 24 fps, east/north/south/west). Frame RELEASE_FRAME is where the rifle is level; the bolt leaves then.

export const RANGED_FRAMES = 9;
export const RANGED_FPS = 24;
export const RANGED_RELEASE_FRAME = 4;                                   // aim has settled on frame 4 (0-based); frames 0-3 raise the rifle
export const RANGED_RELEASE_MS = Math.round(RANGED_RELEASE_FRAME * 1000 / RANGED_FPS); // 167 ms into the attack state
export const RANGED_BOLTS = 2;
export const RANGED_BOLT_GAP_MS = 260;                                   // second bolt leaves from the held aim pose
const TAIL_MS = 150;

export const SPECIALIST_RANGED = Object.freeze({
  minDist: 300,            // closer than this it never shoots: it closes in and uses the baton. Far enough that Zed has time to sidestep or jump the bolt (620 ms warning + ~0.5 s of flight)
  maxDist: 480,            // farther than this it keeps advancing
  laneTol: 14,             // max depth offset to start a volley: it lines up with Zed first, then fires along that lane
  holdMs: 260,             // extra wind-up on top of the shared telegraph (360), so the red lane line shows for 620 ms (readability floor is 300)
  recoverMs: 300,
  firstCooldownMs: 1200,   // no volley in the first seconds after it spawns
  cooldownMs: 3200,        // between volleys
  chainWindowMs: 2600,     // after the volley, the next attack is the baton string if it gets in range inside this window
  bolt: Object.freeze({
    speed: 460,            // px/s: slow enough to read and sidestep
    maxDist: 520,
    muzzle: Object.freeze({ x: 64, y: -98 }),   // from the Specialist's feet, facing right: the rifle tip in the aimed frames (68 px frame, muzzle at x 55 / y 24, feet at y 56, drawn 3x). The hitbox below stays at chest height; the dart eases down to it.
    hitbox: Object.freeze({ x: -9, y: -70, w: 18, h: 24 }),  // chest height (Zed's hurtbox spans the 80 px above his feet); origin is the lane (feet) y
    damage: 6,             // lighter than a baton jab (8) and the finisher (16): there are two per volley
    knockback: 110,
    hitstun: 200,
  }),
});

const boltHit = (atMs) => Object.freeze({
  atMs, projectile: true,
  damage: SPECIALIST_RANGED.bolt.damage, knockback: SPECIALIST_RANGED.bolt.knockback, hitstun: SPECIALIST_RANGED.bolt.hitstun,
});
const HITS = Object.freeze(Array.from({ length: RANGED_BOLTS }, (_, i) => boltHit(RANGED_RELEASE_MS + RANGED_BOLT_GAP_MS * i)));

/** Not in ATTACK_VARIANTS: the AI picks it by situation (range + lane), never at random. kind 'ranged' drives the pose, the telegraph line and the chain. */
export const RANGED_VARIANT = Object.freeze({
  id: 'taser-volley', weight: 0, holdMs: SPECIALIST_RANGED.holdMs, hits: HITS, markIndex: HITS.length - 1, kind: 'ranged', noCue: true,
  attackMs: HITS[HITS.length - 1].atMs + TAIL_MS,
});
export const isRangedAttack = (e) => e?.variant?.kind === 'ranged';

let boltSeq = 0;
/** One travelling bolt. Each frame it asks for a small hit-request at its position; the hit resolver ignores repeats once it has landed (same attackId). */
export class TaserBolt {
  constructor({ ownerId, x, y, lane, facing, spec = SPECIALIST_RANGED.bolt, damage = spec.damage, knockback = spec.knockback, hitstun = spec.hitstun }) {
    this.id = `${ownerId}:bolt:${++boltSeq}`;
    this.ownerId = ownerId; this.x = x; this.y = y; this.lane = lane; this.facing = facing >= 0 ? 1 : -1;
    this.spec = spec; this.damage = damage; this.knockback = knockback; this.hitstun = hitstun;
    this.travelled = 0; this.alive = true; this.age = 0;
  }
  update(dtMs) {
    if (!this.alive) return null;
    const step = this.spec.speed * Math.min(dtMs, 50) / 1000;   // cap a long frame so a bolt cannot skip over Zed
    this.x += this.facing * step; this.travelled += step; this.age += dtMs;
    if (this.travelled >= this.spec.maxDist) { this.alive = false; return null; }
    return {
      attackerId: this.ownerId, attackId: this.id, team: 'rust',
      hitbox: { ...this.spec.hitbox }, origin: { x: this.x, y: this.y }, lane: this.lane, facing: this.facing,
      damage: this.damage, knockback: this.knockback, hitstun: this.hitstun, pierceInvuln: false,
    };
  }
  kill() { this.alive = false; }
}
