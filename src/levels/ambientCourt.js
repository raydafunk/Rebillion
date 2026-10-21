// Copper Fang at the Courts (Level 7) ambient animation: a court that will not sit still.
// A ghost game of hoops runs between the bent rims (swish, confetti, and the Rust screen flinches), the command post
// glitches and pings, roof lights chase, searchlights sweep the sky, patrol drones circle the tent, and birds, clouds,
// fireflies and leaves drift through. Decoration only: depth -998 (behind the fighters), Phaser tweens/time events that
// die with the scene, and nothing ever enters the lane (y 460 to 680).
import { lerp, roofDots } from './ambientData.js';

const DEPTH = -998;
const CYAN = 0x4FB3D9;
const PALE = 0xCFF1FB;
const SLATE = 0x2A3138;
const CONFETTI = [0xE3A92B, 0xA8402E, 0xF4E6C8, CYAN, 0x6FA85F];
const LANE_TOP = 436;

export default function addCourtAmbient(scene, c, period, worldW) {
  const rnd = Phaser.Math.Between;
  const add = (g) => g.setDepth(DEPTH);
  const additive = (g) => g.setBlendMode(Phaser.BlendModes.ADD);
  const loop = (cfg) => scene.tweens.add({ yoyo: true, repeat: -1, ease: 'Sine.easeInOut', ...cfg });
  // A tween on a plain {p: 0..1} object: lets callers drive any custom motion from one progress value.
  const run = (cfg) => {
    const o = { p: 0 };
    return scene.tweens.add({ targets: o, p: 1, ease: 'Linear', ...cfg, onUpdate: () => cfg.onUpdate(o.p), onComplete: cfg.onComplete });
  };

  for (let off = 0; off < worldW; off += period) tile(off);
  sky();

  function tile(ox) {
    const [lx, ly, rx, ry] = c.hoop;
    const [sx, sy, sw, sh] = c.screen;
    const [dx, dy] = c.dish;

    // ---- the command post screen: scanline, flicker, glitch strips, dropouts, blinking blips ----
    const screen = additive(add(scene.add.rectangle(ox + sx, sy, sw, sh, PALE, 1)).setOrigin(0, 0)).setAlpha(0);
    scene.time.addEvent({ delay: 80, loop: true, callback: () => screen.setAlpha(Math.random() < 0.2 ? 0.22 : 0.04) });
    const scan = additive(add(scene.add.rectangle(ox + sx, sy, sw, 6, PALE, 1)).setOrigin(0, 0)).setAlpha(0.5);
    loop({ targets: scan, y: sy + sh - 6, duration: 950, ease: 'Linear' });
    const dropout = add(scene.add.rectangle(ox + sx, sy, sw, sh, 0x0F2A36, 1)).setOrigin(0, 0).setAlpha(0);
    const glitch = () => {
      const strips = [];
      for (let n = 0; n < rnd(2, 4); n++) {
        const h = rnd(4, 12), y = sy + rnd(0, sh - h), shift = rnd(-18, 18);
        strips.push(add(scene.add.rectangle(ox + sx + Math.max(0, shift), y, sw - Math.abs(shift), h, Math.random() < 0.5 ? PALE : 0x0F2A36, 0.85)).setOrigin(0, 0));
      }
      if (Math.random() < 0.4) dropout.setAlpha(0.7);
      scene.time.delayedCall(rnd(70, 140), () => { strips.forEach((s) => s.destroy()); dropout.setAlpha(0); });
      scene.time.delayedCall(rnd(600, 1900), glitch);
    };
    scene.time.delayedCall(rnd(300, 1200), glitch);
    for (let n = 0; n < 5; n++) {
      const blip = add(scene.add.rectangle(ox + sx + rnd(10, 52), sy + rnd(8, 30), 4, 4, 0xE6FAFF, 1)).setAlpha(0);
      loop({ targets: blip, alpha: 1, duration: rnd(250, 600), delay: rnd(0, 1500), hold: rnd(100, 400), ease: 'Stepped' });
    }

    // ---- the dish: a cyan ping rolls out of the antenna, the tip pulses, a halo breathes ----
    const halo = additive(add(scene.add.circle(ox + dx, dy, 22, CYAN, 1))).setAlpha(0.08);
    loop({ targets: halo, alpha: 0.28, scale: 1.4, duration: 700 });
    const ping = () => {
      const ring = add(scene.add.circle(ox + dx, dy, 14, CYAN, 0)).setStrokeStyle(2, CYAN, 0.6);
      ring.setBlendMode(Phaser.BlendModes.NORMAL);
      scene.tweens.add({ targets: ring, scale: 18, alpha: 0, duration: 2200, ease: 'Sine.easeOut', onComplete: () => ring.destroy() });
    };
    scene.time.addEvent({ delay: 2400, loop: true, startAt: 1800, callback: ping });

    // ---- roof edge lights: a chase races up one side of the tent and down the other ----
    const pts = roofDots(c.roof, 24);
    pts.forEach(([x, y], i) => {
      const d = additive(add(scene.add.circle(ox + x, y, 5, PALE, 1))).setAlpha(0);
      scene.tweens.add({ targets: d, alpha: 1, duration: 150, yoyo: true, repeat: -1, delay: i * 55, repeatDelay: pts.length * 55 - 300 });
    });

    // ---- banner diamonds throb ----
    c.banners.forEach(([x, y], i) => {
      const dia = additive(add(scene.add.polygon(ox + x, y, [0, -16, 12, 0, 0, 16, -12, 0], CYAN, 1))).setAlpha(0.1);
      loop({ targets: dia, alpha: 0.8, scale: 1.5, duration: 500, delay: i * 250 });
    });

    // ---- searchlights sweep the sky from the floodlight pylons ----
    c.lamps.forEach(([x, y], i) => {
      const beam = additive(add(scene.add.polygon(ox + x, y, [0, 0, -46, -560, 46, -560], PALE, 1)).setOrigin(0, 0)).setAlpha(0.08);
      beam.setAngle(i ? 38 : -38);
      loop({ targets: beam, angle: i ? -38 : 38, duration: 3600 + i * 700, ease: 'Sine.easeInOut' });
      const bulb = additive(add(scene.add.circle(ox + x, y, 12, PALE, 1))).setAlpha(0.3);
      loop({ targets: bulb, alpha: 0.9, duration: 320, delay: i * 160 });
    });

    // ---- patrol drones: lissajous loops round the tent, each trailing a scanning cone ----
    for (let n = 0; n < c.drones; n++) {
      const drone = add(scene.add.container(ox + dx, dy));
      const cone = additive(scene.add.polygon(0, 8, [0, 0, -26, 84, 26, 84], CYAN, 1)).setOrigin(0, 0).setAlpha(0.12);
      const body = scene.add.rectangle(0, 0, 26, 9, SLATE, 1);
      const eye = additive(scene.add.circle(0, 1, 3, CYAN, 1));
      const rotors = scene.add.rectangle(0, -7, 34, 2, 0x7C8A96, 1);
      drone.add([cone, body, eye, rotors]);
      loop({ targets: rotors, scaleX: 0.25, duration: 50, ease: 'Linear' });
      loop({ targets: cone, angle: 10, duration: 1100, delay: n * 300 });
      const ph = n * Math.PI;
      run({
        duration: 9000 - n * 1500, repeat: -1,
        onUpdate: (p) => {
          const a = p * Math.PI * 2 + ph;
          drone.setPosition(ox + dx + 340 * Math.sin(a), dy - 10 + 36 * Math.sin(2 * a));
          drone.setAngle(8 * Math.cos(a));
        },
      });
    }

    // ---- the sun: a throbbing glow and slow turning rays (short, so they never reach the lane) ----
    const [sunX, sunY] = c.sun;
    const glow = additive(add(scene.add.circle(ox + sunX, sunY, 100, 0xFFE9A8, 1))).setAlpha(0.06);
    loop({ targets: glow, alpha: 0.16, scale: 1.25, duration: 2200 });
    const rays = add(scene.add.container(ox + sunX, sunY));
    for (let n = 0; n < 12; n++) {
      const r = scene.add.polygon(0, 0, [0, 0, -9, -165, 9, -165], 0xFFF1C2, 1).setOrigin(0, 0).setAlpha(0.1).setAngle(n * 30);
      rays.add(additive(r));
    }
    scene.tweens.add({ targets: rays, angle: 360, duration: 48000, repeat: -1 });

    // ---- the ghost game: a ball arcs hoop to hoop forever; every swish pops confetti and the Rust screen flinches ----
    playGame(ox, lx, ly, rx, ry, screen);

    // ---- fireflies wander the tree line ----
    for (let n = 0; n < c.fireflies; n++) {
      const f = additive(add(scene.add.circle(0, 0, rnd(2, 3), 0xFFE9A8, 1))).setAlpha(0);
      const hop = () => {
        const x = ox + rnd(0, period), y = rnd(250, 420);
        f.setPosition(x, y);
        run({
          duration: rnd(3500, 6500),
          onUpdate: (p) => { f.setPosition(x + 50 * Math.sin(p * 7), y - 40 * p + 14 * Math.sin(p * 11)); f.setAlpha(0.9 * Math.sin(Math.PI * p) * (0.6 + 0.4 * Math.sin(p * 40))); },
          onComplete: hop,
        });
      };
      scene.time.delayedCall(rnd(0, 4000), hop);
    }

    // ---- leaves tumble off the trees ----
    c.trees.forEach(([x, y]) => {
      const leaf = add(scene.add.ellipse(0, 0, 9, 5, rnd(0, 2) ? 0x6FA85F : 0xE3A92B, 1)).setAlpha(0);
      const fall = () => {
        const x0 = ox + x + rnd(-40, 40), y0 = y - rnd(20, 60), sway = rnd(18, 40);
        leaf.setPosition(x0, y0);
        run({
          duration: rnd(4200, 6500),
          onUpdate: (p) => { leaf.setPosition(x0 + sway * Math.sin(p * 9), lerp(y0, LANE_TOP, p)); leaf.setAngle(p * 540); leaf.setAlpha(Math.min(1, p * 8) * (1 - p * p)); },
          onComplete: () => scene.time.delayedCall(rnd(1000, 6000), fall),
        });
      };
      scene.time.delayedCall(rnd(0, 7000), fall);
    });
  }

  function playGame(ox, lx, ly, rx, ry, screen) {
    const ball = add(scene.add.container(ox + lx, ly));
    const skin = scene.add.circle(0, 0, 12, 0xC9702E, 1);
    const seams = scene.add.graphics().lineStyle(2, 0x5A2E12, 1);
    seams.strokeCircle(0, 0, 11).lineBetween(-12, 0, 12, 0).lineBetween(0, -12, 0, 12);
    ball.add([skin, seams]);
    const ghosts = [];
    for (let i = 0; i < 6; i++) ghosts.push(additive(add(scene.add.circle(0, 0, 11 - i, 0xFFC27A, 1))).setAlpha(0));
    const trail = [];

    const swish = (x, y) => {
      const rim = additive(add(scene.add.ellipse(x, y, 62, 14, 0xFFF1C2, 1))).setAlpha(0.9);
      scene.tweens.add({ targets: rim, scaleX: 1.9, scaleY: 3, alpha: 0, duration: 520, onComplete: () => rim.destroy() });
      screen.setAlpha(0.6);
      for (let n = 0; n < 22; n++) {
        const piece = add(scene.add.rectangle(x, y, 7, 3, CONFETTI[n % CONFETTI.length], 1));
        const vx = rnd(-170, 170), vy = -rnd(140, 320), life = rnd(1000, 1700), spin = rnd(-20, 20);
        run({
          duration: life,
          onUpdate: (p) => {
            const s = (p * life) / 1000;
            piece.setPosition(x + vx * s, Math.min(LANE_TOP, y + vy * s + 430 * s * s));
            piece.setAngle(piece.angle + spin);
            piece.setAlpha(1 - p * p);
          },
          onComplete: () => piece.destroy(),
        });
      }
    };

    const shoot = (fx, fy, tx, ty, next) => {
      ball.setPosition(fx, fy).setAlpha(1);
      const lift = 190 + Math.abs(tx - fx) * 0.05;
      run({
        duration: 1800,
        onUpdate: (p) => {
          const x = lerp(fx, tx, p), y = lerp(fy, ty, p) - 4 * lift * p * (1 - p);
          ball.setPosition(x, y).setAngle(p * 1080 * Math.sign(tx - fx));
          trail.push([x, y]);
          if (trail.length > 24) trail.shift();
          ghosts.forEach((g, i) => {
            const t = trail[trail.length - 1 - (i + 1) * 3];
            if (t) g.setPosition(t[0], t[1]).setAlpha(0.32 - i * 0.05); else g.setAlpha(0);
          });
        },
        onComplete: () => {
          trail.length = 0; ghosts.forEach((g) => g.setAlpha(0));
          swish(tx, ty);
          scene.tweens.add({
            targets: ball, y: ty + 70, alpha: 0, duration: 420, ease: 'Quad.easeIn',
            onComplete: () => scene.time.delayedCall(rnd(300, 900), () => next()),
          });
        },
      });
    };
    const goRight = () => shoot(ox + lx, ly, ox + rx, ry, goLeft);
    const goLeft = () => shoot(ox + rx, ry, ox + lx, ly, goRight);
    scene.time.delayedCall(1200, goRight);
  }

  // World-wide sky traffic: birds in loose V's and soft clouds crossing the whole level.
  function sky() {
    for (let n = 0; n < c.birds; n++) {
      const bird = add(scene.add.graphics()).setPosition(-80, 0);
      bird.lineStyle(3, 0x7A5A3A, 0.85).beginPath().moveTo(-12, 3).lineTo(0, -4).lineTo(12, 3).strokePath();
      loop({ targets: bird, scaleY: -0.5, duration: rnd(180, 260), ease: 'Sine.easeInOut' });
      const fly = () => {
        const y = rnd(70, 230), dur = rnd(18000, 30000);
        bird.x = -80;
        run({ duration: dur, onUpdate: (p) => bird.setPosition(lerp(-80, worldW + 80, p), y + 22 * Math.sin(p * 26)), onComplete: () => scene.time.delayedCall(rnd(0, 6000), fly) });
      };
      scene.time.delayedCall(n * 4200 + rnd(0, 2500), fly);
    }
    for (let n = 0; n < c.clouds; n++) {
      const cloud = add(scene.add.ellipse(0, 0, rnd(220, 340), rnd(22, 34), 0xFFF3D0, 1)).setAlpha(0.4);
      const y = rnd(40, 200), dur = rnd(60000, 100000);
      scene.tweens.add({ targets: cloud, x: { from: -200, to: worldW + 200 }, y, duration: dur, repeat: -1, delay: -rnd(0, dur) });
    }
  }
}
