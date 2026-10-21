// Greenline Courts ambient animation: a golden-hour breeze. Canopies rustle, light shafts and the sun breathe,
// clouds drift, leaves blow across, a few birds cross the sky and pollen glints in the sun.
// Decoration only: depth -998 (behind the fighters), flat shapes, Phaser tweens/time events that die with the scene,
// and nothing ever enters the lane (y 460 to 680).
import { tiledItems, canopyPuffs, spawnRange, laneSafeY } from './ambientData.js';

const DEPTH = -998;
const CANOPY = 0x2F6B3F;
const CREAM = 0xF7E7B8;
const hex = (s) => Phaser.Display.Color.HexStringToColor(s).color;

export default function addOutdoorAmbient(scene, o, period, worldW) {
  const rnd = Phaser.Math.Between;
  const cam = scene.cameras.main;
  const add = (g) => g.setDepth(DEPTH);
  const addGlow = (g) => add(g).setBlendMode(Phaser.BlendModes.ADD);
  // Run fn forever at random gaps.
  const every = (min, max, fn, first) => {
    const go = () => { fn(); scene.time.delayedCall(rnd(min, max), go); };
    scene.time.delayedCall(first ?? rnd(0, max), go);
  };
  // Drifters spawn around the camera so the few we have are the ones the player sees.
  const spawnX = () => { const [lo, hi] = spawnRange(cam.scrollX, cam.width, worldW); return rnd(lo, hi); };

  // ---- canopies rustle: leaf clusters on the upper rim push in and out, each on its own beat ----
  tiledItems(o.trees, period, worldW).forEach((t) => {
    canopyPuffs(t, o.puffsPerTree).forEach((p) => {
      const puff = add(scene.add.circle(p.x, p.y, rnd(9, 13), CANOPY, 1));
      const out = 4 + rnd(0, 3);
      const dx = ((p.x - t[0]) / t[2]) * out, dy = ((p.y - t[1]) / t[2]) * out;
      scene.tweens.add({ targets: puff, x: p.x + dx, y: p.y + dy, duration: rnd(1800, 3200), yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: rnd(0, 2500) });
    });
  });

  // ---- sun breathes ----
  tiledItems(o.suns, period, worldW).forEach(([x, y, r]) => {
    const halo = addGlow(scene.add.circle(x, y, r, CREAM, 1)).setAlpha(0.05);
    scene.tweens.add({ targets: halo, alpha: 0.16, scale: 1.12, duration: 4200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  });

  // ---- soft light shafts through the trees, pulsing slowly (sky and canopy only, ending above the lane) ----
  tiledItems(o.shafts, period, worldW).forEach(([x, w]) => {
    const bottom = laneSafeY(440), lean = 150;
    const shaft = addGlow(scene.add.polygon(x, 0, [0, 0, w, 0, w + lean, bottom, lean, bottom], CREAM, 1)).setOrigin(0, 0).setAlpha(0.02);
    scene.tweens.add({ targets: shaft, alpha: 0.07, duration: rnd(3500, 5500), yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: rnd(0, 3000) });
  });

  // ---- thin clouds slide slowly across the second screen ----
  tiledItems(o.clouds, period, worldW).forEach(([x, y, rx]) => {
    const c = add(scene.add.ellipse(x, y, rx * 2, 24, CREAM, 1)).setAlpha(0.32);
    scene.tweens.add({ targets: c, x: x + rnd(90, 160), duration: rnd(16000, 24000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: rnd(0, 4000) });
  });

  // ---- leaves blow across on the breeze, green and gold, fading in and out above the lane ----
  const leafColors = o.leafColors.map(hex);
  for (let n = 0; n < o.leaves; n++) {
    const leaf = add(scene.add.ellipse(0, 0, rnd(11, 15), rnd(5, 7), leafColors[n % leafColors.length], 1)).setAlpha(0);
    const fly = () => {
      const x0 = spawnX(), y0 = rnd(70, 330), dur = rnd(8000, 13000), dx = rnd(420, 760), fall = rnd(50, 110), amp = rnd(14, 30), spin = rnd(-500, 500);
      leaf.setPosition(x0, y0).setAlpha(0);
      scene.tweens.add({
        targets: leaf, x: x0 + dx, duration: dur, ease: 'Sine.easeInOut',
        onUpdate: (tw) => {
          const p = tw.progress;
          leaf.y = laneSafeY(y0 + fall * p + Math.sin(p * Math.PI * 5) * amp);
          leaf.angle = spin * p;
          leaf.setAlpha(0.85 * Math.sin(Math.PI * p));
        },
        onComplete: () => scene.time.delayedCall(rnd(500, 4000), fly),
      });
    };
    scene.time.delayedCall(rnd(0, 7000), fly);
  }

  // ---- a few birds cross the sky: a small flapping V, never below the treeline ----
  const flock = () => {
    const y = rnd(60, 190), x0 = spawnX(), dir = Math.random() < 0.7 ? 1 : -1, size = Math.min(o.birds, rnd(2, 3));
    for (let b = 0; b < size; b++) {
      const bird = add(scene.add.graphics()).setAlpha(0);
      bird.lineStyle(3, 0x4A3A2A, 1).beginPath().moveTo(-9, -4).lineTo(0, 2).lineTo(9, -4).strokePath();
      const sx = x0 - dir * b * 46, sy = y + b * rnd(10, 22), dur = rnd(11000, 15000);
      bird.setPosition(sx, sy).setScale(dir, 1);
      scene.tweens.add({ targets: bird, scaleY: 0.35, duration: rnd(260, 340), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      scene.tweens.add({ targets: bird, x: sx + dir * rnd(700, 900), y: sy - rnd(10, 40), duration: dur, ease: 'Sine.easeInOut',
        onUpdate: (tw) => bird.setAlpha(Math.min(1, 3 * Math.sin(Math.PI * tw.progress)) * 0.8), onComplete: () => bird.destroy() });
    }
  };
  if (o.birds > 0) every(9000, 16000, flock, 2500);

  // ---- pollen glints drift up in the sun ----
  for (let n = 0; n < o.motes; n++) {
    const mote = addGlow(scene.add.circle(0, 0, rnd(1, 2), CREAM, 1)).setAlpha(0);
    const drift = () => {
      const sx = spawnX(), sy = rnd(120, 420);
      mote.setPosition(sx, sy).setAlpha(0);
      scene.tweens.add({ targets: mote, x: sx + rnd(-20, 40), y: laneSafeY(sy - rnd(30, 80)), duration: rnd(4500, 8500), ease: 'Sine.easeInOut',
        onUpdate: (tw) => mote.setAlpha(0.6 * Math.sin(Math.PI * tw.progress)), onComplete: drift });
    };
    scene.time.delayedCall(rnd(0, 6000), drift);
  }
}
