// The Overseer's Tower (Level 8) ambient animation: the cold tower watches while the warm district burns down to dusk.
// The cyan eye pulses and sweeps, rings roll out of it, the light cone shimmers, the antenna and beacons blink, and
// warm embers, cyan motes and slow cloud streaks drift through. Decoration only: depth -998 (behind the fighters),
// Phaser tweens/time events that die with the scene, and nothing ever enters the lane (y 460 to 680).
import { laneSafeY } from './ambientData.js';

const DEPTH = -998;
const CYAN = 0x6FE3F2;
const PALE = 0xE6FFFF;
const RED = 0xE8604A;
const WARM = [0xFFD27A, 0xF6B27A, 0xFFB25A];
const LANE_TOP = 436;

export default function addTowerAmbient(scene, t, period, worldW) {
  const rnd = Phaser.Math.Between;
  const add = (g) => g.setDepth(DEPTH);
  const additive = (g) => g.setBlendMode(Phaser.BlendModes.ADD);
  const loop = (cfg) => scene.tweens.add({ yoyo: true, repeat: -1, ease: 'Sine.easeInOut', ...cfg });

  for (let off = 0; off < worldW; off += period) tile(off);

  function tile(ox) {
    const [ex, ey] = t.eye;

    // ---- the eye: a halo that breathes, a hot core that stutters like it is thinking ----
    const halo = additive(add(scene.add.circle(ox + ex, ey, 46, CYAN, 1))).setAlpha(0.1);
    loop({ targets: halo, alpha: 0.3, scale: 1.25, duration: 1600 });
    const core = additive(add(scene.add.circle(ox + ex, ey, 14, PALE, 1))).setAlpha(0.1);
    scene.time.addEvent({ delay: 120, loop: true, callback: () => core.setAlpha(Math.random() < 0.12 ? 0.04 : 0.2 + Math.random() * 0.12) });

    // ---- a scan ring rolls out of the eye now and then, then fades ----
    const ping = () => {
      const ring = add(scene.add.circle(ox + ex, ey, 20, CYAN, 0)).setStrokeStyle(2, CYAN, 0.7);
      scene.tweens.add({ targets: ring, scale: 4.2, alpha: 0, duration: 2200, ease: 'Sine.easeOut', onComplete: () => { ring.destroy(); scene.time.delayedCall(rnd(1800, 4200), ping); } });
    };
    scene.time.delayedCall(rnd(500, 2500), ping);

    // ---- the light cone shimmers, with a bright band sliding down it ----
    if (t.cone.length >= 3) {
      const pts = t.cone.map((p) => ({ x: ox + p[0], y: laneSafeY(p[1]) }));
      const cone = additive(add(scene.add.polygon(0, 0, pts.map((p) => [p.x, p.y]).flat(), CYAN, 1))).setOrigin(0, 0).setAlpha(0.03);
      loop({ targets: cone, alpha: 0.1, duration: 2100 });
      const top = t.cone[0][1], span = LANE_TOP - top;
      const xs = t.cone.map((p) => p[0]);
      const band = additive(add(scene.add.rectangle(ox + (Math.min(...xs) + Math.max(...xs)) / 2, top, (Math.max(...xs) - Math.min(...xs)) * 0.55, 8, PALE, 1))).setAlpha(0);
      const slide = () => {
        band.setPosition(band.x, top).setAlpha(0.2);
        scene.tweens.add({ targets: band, y: top + span, alpha: 0, duration: 2600, ease: 'Sine.easeIn', onComplete: () => scene.time.delayedCall(rnd(800, 2400), slide) });
      };
      scene.time.delayedCall(rnd(0, 2000), slide);
    }

    // ---- sweep beams: thin cyan searchlights swing across the sky above the eye, each on its own beat ----
    for (let n = 0; n < t.sweeps; n++) {
      const beam = additive(add(scene.add.polygon(ox + ex, ey, [0, 0, 520, -16, 520, 16], CYAN, 1))).setOrigin(0, 0).setAlpha(0.07);
      const side = n % 2 ? 1 : -1;
      beam.angle = -90 + side * 12;
      loop({ targets: beam, angle: -90 - side * 62, duration: 5200 + n * 1300, delay: n * 700 });
      loop({ targets: beam, alpha: 0.14, duration: 1900 + n * 400 });
    }

    // ---- electric sparks crawl down the shaft: window slits flash cyan in short stutters ----
    t.slits.forEach(([sx, sy]) => {
      const slit = additive(add(scene.add.rectangle(ox + sx, sy, 5, 13, PALE, 1))).setAlpha(0);
      const flash = () => {
        let blinks = rnd(1, 4);
        const step = () => {
          slit.setAlpha(blinks % 2 ? 0.75 : 0.1);
          if (--blinks > -2) scene.time.delayedCall(rnd(50, 120), step);
          else { slit.setAlpha(0); scene.time.delayedCall(rnd(1500, 6000), flash); }
        };
        step();
      };
      scene.time.delayedCall(rnd(0, 4000), flash);
    });
    for (let n = 0; n < t.sparks; n++) {
      const spark = additive(add(scene.add.rectangle(0, 0, 2, rnd(10, 18), PALE, 1))).setAlpha(0);
      const zip = () => {
        const sx = ox + ex + rnd(-40, 40), sy = ey + rnd(20, 70);
        spark.setPosition(sx, sy).setAlpha(0.8);
        scene.tweens.add({ targets: spark, y: sy + rnd(60, 140), alpha: 0, duration: rnd(260, 520), ease: 'Quad.easeIn', onComplete: () => scene.time.delayedCall(rnd(1200, 5000), zip) });
      };
      scene.time.delayedCall(rnd(0, 4000), zip);
    }

    // ---- the setting sun breathes, and a few Heights windows twinkle ----
    if (t.sun) {
      [[120, 0.015], [90, 0.02], [62, 0.03], [38, 0.04]].forEach(([r, a], i) => {
        const sunGlow = additive(add(scene.add.circle(ox + t.sun[0], t.sun[1], r, 0xFFD27A, 1))).setAlpha(a);
        loop({ targets: sunGlow, alpha: a * 3, scale: 1.12, duration: 3200, delay: i * 250 });
      });
      [-38, 0, 38].forEach((a, i) => {
        const ray = additive(add(scene.add.polygon(ox + t.sun[0], t.sun[1], [0, 0, 640, -34, 640, 34], 0xFFE3A0, 1))).setOrigin(0, 0).setAlpha(0.02);
        ray.angle = -90 + a * 1.6;
        loop({ targets: ray, alpha: 0.09, angle: ray.angle + 7, duration: 3800 + i * 900, delay: i * 600 });
      });
    }
    t.twinkles.forEach(([wx, wy]) => {
      const w = additive(add(scene.add.rectangle(ox + wx, wy, 6, 8, 0xFFD27A, 1))).setAlpha(0);
      loop({ targets: w, alpha: 0.85, duration: rnd(700, 1800), hold: rnd(200, 1500), delay: rnd(0, 4000) });
    });

    // ---- antenna tip: a steady cyan blink ----
    if (t.antenna) {
      const tip = additive(add(scene.add.circle(ox + t.antenna[0], t.antenna[1], 6, CYAN, 1))).setAlpha(0.05);
      loop({ targets: tip, alpha: 0.9, scale: 1.6, duration: 700, hold: 400, ease: 'Stepped' });
    }

    // ---- red beacons on the struts and across the Heights blink out of step ----
    [...t.beacons, ...t.skylineBeacons].forEach(([bx, by], i) => {
      const b = additive(add(scene.add.circle(ox + bx, by, 8, RED, 1))).setAlpha(0.05);
      loop({ targets: b, alpha: 0.7, duration: rnd(500, 900), hold: rnd(300, 900), delay: rnd(0, 1500) + i * 120, ease: 'Stepped' });
    });
  }

  // ---- warm embers float up from the burning district, cyan motes fall away from the eye ----
  const spawnX = () => rnd(0, worldW);
  for (let n = 0; n < t.embers; n++) {
    const ember = additive(add(scene.add.circle(0, 0, rnd(1, 2), WARM[n % WARM.length], 1))).setAlpha(0);
    const rise = () => {
      const sx = spawnX(), sy = rnd(360, LANE_TOP);
      ember.setPosition(sx, sy).setAlpha(0);
      scene.tweens.add({
        targets: ember, x: sx + rnd(-30, 60), y: sy - rnd(80, 190), duration: rnd(5000, 9000), ease: 'Sine.easeInOut',
        onUpdate: (tw) => ember.setAlpha(0.7 * Math.sin(Math.PI * tw.progress)),
        onComplete: rise,
      });
    };
    scene.time.delayedCall(rnd(0, 7000), rise);
  }
  for (let n = 0; n < t.motes; n++) {
    const mote = additive(add(scene.add.circle(0, 0, rnd(1, 2), CYAN, 1))).setAlpha(0);
    const fall = () => {
      const [ex, ey] = t.eye;
      const tileX = Math.floor(rnd(0, worldW - 1) / period) * period;
      const sx = tileX + ex + rnd(-90, 90), sy = ey + rnd(-30, 40);
      mote.setPosition(sx, sy).setAlpha(0);
      scene.tweens.add({
        targets: mote, x: sx + rnd(-40, 40), y: laneSafeY(sy + rnd(120, 230)), duration: rnd(4500, 8000), ease: 'Sine.easeInOut',
        onUpdate: (tw) => mote.setAlpha(0.6 * Math.sin(Math.PI * tw.progress)),
        onComplete: fall,
      });
    };
    scene.time.delayedCall(rnd(0, 6000), fall);
  }

  // ---- dusk birds cross the sky in little flocks, wings flapping ----
  for (let n = 0; n < t.birds; n++) {
    const bird = add(scene.add.graphics()).setAlpha(0.75);
    bird.lineStyle(2, 0x3A2A3A, 1).beginPath().moveTo(-7, -3).lineTo(0, 2).lineTo(7, -3).strokePath();
    loop({ targets: bird, scaleY: 0.35, duration: rnd(220, 340), delay: rnd(0, 300) });
    const fly = () => {
      const dir = Math.random() < 0.5 ? 1 : -1, y = rnd(90, 250), x0 = dir > 0 ? -30 : worldW + 30;
      bird.setPosition(x0, y);
      scene.tweens.add({
        targets: bird, x: x0 + dir * (worldW + 60), y: y + rnd(-40, 40), duration: rnd(32000, 52000), ease: 'Linear',
        onComplete: () => scene.time.delayedCall(rnd(2000, 12000), fly),
      });
    };
    scene.time.delayedCall(rnd(0, 20000), fly);
  }

  // ---- thin dusk cloud streaks drift slowly across the sky and wrap round ----
  for (let n = 0; n < t.clouds; n++) {
    const w = rnd(120, 240);
    const streak = additive(add(scene.add.rectangle(rnd(0, worldW), rnd(80, 210), w, rnd(4, 7), 0xF6B27A, 1))).setAlpha(0.1);
    const drift = () => {
      const from = streak.x;
      scene.tweens.add({
        targets: streak, x: from + rnd(260, 520), duration: rnd(30000, 52000), ease: 'Linear',
        onComplete: () => { if (streak.x > worldW + w) streak.x = -w; drift(); },
      });
    };
    scene.time.delayedCall(rnd(0, 3000), drift);
  }
}
