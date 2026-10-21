// Mustard Row ambient animation: the chained shutters rattle and shed Rust notices, the open shops throw confetti,
// neighbours wave, music drifts out of the windows, awnings shimmer and the string lights chase each other.
// Everything is decoration behind the fighters (depth -998), built from Phaser tweens that die with the scene.
import { rowShops, rowBulbs } from './ambientData.js';

const DEPTH = -998;
const PAPER = [0xE3A92B, 0xF2C04D, 0xA8402E, 0xF7E7B8, 0x2F6B3F];
const SKIN = [0xC98F5A, 0x9A6B45, 0xE0B48A, 0x7A5236];
const BULB = [0xF2C04D, 0xA8402E, 0xF7E7B8, 0x2F6B3F];

// Shop geometry in background px, relative to the shop's x (matches design/levels/level-02-mustard-row.md).
const WIN = { x: 44, y: 280, w: 372, h: 132 };
const AWNING = { x: 16, y: 214, w: 428, h: 36 };

export default function addRowAmbient(scene, row, worldW) {
  const rnd = Phaser.Math.Between;
  const every = (min, max, fn, first) => {
    const go = () => { fn(); scene.time.delayedCall(rnd(min, max), go); };
    scene.time.delayedCall(first ?? rnd(0, max), go);
  };
  const add = (o) => o.setDepth(DEPTH);
  const k = row.crazy; // 0 calm .. 3 mayhem

  rowShops(row, worldW).forEach((s) => (s.chained ? chainedShop(s.x) : openShop(s.x)));

  // ---- chained shops: something is pushing on the shutter, notices flap loose, the padlock glints ----
  function chainedShop(x) {
    const slats = scene.add.graphics().setDepth(DEPTH);
    slats.fillStyle(0x7C6A52, 1).fillRect(0, 0, WIN.w, WIN.h);
    for (let y = 8; y < WIN.h; y += 11) slats.fillStyle(0x2E1F16, 0.35).fillRect(0, y, WIN.w, 2.5);
    slats.lineStyle(3, 0x3E3A36, 1);
    slats.lineBetween(4, 24, WIN.w - 4, WIN.h - 14).lineBetween(WIN.w - 4, 24, 4, WIN.h - 14);
    slats.setPosition(x + WIN.x, WIN.y).setAlpha(0);

    const bang = () => {
      const hits = rnd(1, 2 + k);
      slats.setAlpha(0.92);
      scene.tweens.add({ targets: slats, x: slats.x + rnd(3, 6), duration: 45, yoyo: true, repeat: hits * 4, ease: 'Sine.easeInOut',
        onComplete: () => { slats.setAlpha(0); slats.x = x + WIN.x; } });
      scene.tweens.add({ targets: slats, y: WIN.y - rnd(2, 5), duration: 70, yoyo: true, repeat: hits * 2 });
      for (let n = 0; n < 3 + k; n++) spark(x + WIN.x + rnd(60, WIN.w - 60), WIN.y + rnd(30, WIN.h - 30));
      if (Math.random() < 0.7) notice(x + WIN.x + rnd(10, WIN.w - 40), WIN.y + 20);
    };
    every(2600, 6200 - k * 800, bang);

    const lock = add(scene.add.star(x + WIN.x + WIN.w / 2, WIN.y + 66, 4, 2, 9, 0xF7E7B8, 1)).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: lock, alpha: 0.9, scale: 1.4, angle: 45, duration: 700, yoyo: true, repeat: -1, hold: 900, delay: rnd(0, 2000) });
  }

  function spark(x, y) {
    const p = add(scene.add.rectangle(x, y, 3, 3, 0xF7E7B8, 1)).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: p, x: x + rnd(-24, 24), y: y + rnd(6, 26), alpha: 0, duration: rnd(250, 500), onComplete: () => p.destroy() });
  }

  // A cold Rust notice tears off the shutter and tumbles away on the wind.
  function notice(x, y) {
    const p = add(scene.add.rectangle(x, y, 12, 16, 0xCFC8B8, 1)).setStrokeStyle(1, 0x2E1F16);
    const dur = rnd(2400, 3800);
    scene.tweens.add({ targets: p, x: x + rnd(140, 360), angle: rnd(-540, 540), duration: dur, ease: 'Sine.easeOut' });
    scene.tweens.add({ targets: p, y: [y - rnd(30, 70), y + rnd(120, 300)], duration: dur, ease: 'Sine.easeInOut',
      onUpdate: (tw) => { if (tw.progress > 0.7) p.setAlpha(1 - (tw.progress - 0.7) / 0.3); }, onComplete: () => p.destroy() });
  }

  // ---- open shops ----
  function openShop(x) {
    // Awning shimmer: a bright band sweeps across the scallops on its own beat.
    const sheen = add(scene.add.rectangle(x + AWNING.x, AWNING.y, 46, AWNING.h, 0xF7E7B8, 1)).setOrigin(0, 0).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: sheen, x: x + AWNING.x + AWNING.w - 46, duration: 1400, ease: 'Sine.easeInOut', repeat: -1, repeatDelay: rnd(1800, 4200), delay: rnd(0, 3000),
      onUpdate: (tw) => { sheen.setAlpha(0.42 * Math.sin(Math.PI * tw.progress)); } });

    // A neighbour waves from behind the glass.
    const armX = x + WIN.x + WIN.w - 46, armY = WIN.y + WIN.h - 8;
    const skin = SKIN[rnd(0, SKIN.length - 1)];
    const arm = scene.add.container(armX, armY).setDepth(DEPTH);
    arm.add([scene.add.rectangle(0, -22, 9, 44, 0x2F6B3F, 1).setStrokeStyle(2, 0x2E1F16), scene.add.circle(0, -50, 9, skin, 1).setStrokeStyle(2, 0x2E1F16)]);
    arm.setAngle(-22);
    scene.tweens.add({ targets: arm, angle: 22, duration: rnd(260, 380), yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: rnd(0, 800) });

    // Confetti cannons in the upper windows.
    every(3600 - k * 500, 8200 - k * 1200, () => confetti(x + 230, 106));

    // Music notes float out of the shop window.
    every(1400, 3200 - k * 400, () => note(x + WIN.x + rnd(40, WIN.w - 40), WIN.y + 20));
  }

  function confetti(x, y) {
    const n = 10 + k * 6;
    for (let i = 0; i < n; i++) {
      const p = add(scene.add.rectangle(x, y, rnd(5, 8), rnd(8, 12), PAPER[rnd(0, PAPER.length - 1)], 1));
      const dx = rnd(-170, 170), peak = y - rnd(30, 80), land = rnd(430, 600), dur = rnd(1800, 2800);
      scene.tweens.add({ targets: p, x: x + dx + rnd(-30, 30), duration: 350 + dur, ease: 'Sine.easeOut' });
      scene.tweens.add({ targets: p, angle: rnd(-720, 720), scaleY: { from: 1, to: 0.2 }, duration: 350 + dur, yoyo: false });
      scene.tweens.add({ targets: p, y: peak, duration: 350, ease: 'Quad.easeOut',
        onComplete: () => scene.tweens.add({ targets: p, y: land, alpha: 0, duration: dur, ease: 'Sine.easeIn', onComplete: () => p.destroy() }) });
    }
  }

  function note(x, y) {
    const t = add(scene.add.text(x, y, ['♪', '♫'][rnd(0, 1)], { fontFamily: 'Georgia, serif', fontSize: `${rnd(20, 30)}px`, color: '#F7E7B8', stroke: '#2E1F16', strokeThickness: 3 })).setOrigin(0.5).setAlpha(0);
    const sway = rnd(20, 40);
    scene.tweens.add({ targets: t, y: y - rnd(120, 200), duration: 2600, ease: 'Sine.easeOut', onComplete: () => t.destroy(),
      onUpdate: (tw) => { t.setAlpha(Math.sin(Math.PI * tw.progress)); t.x = x + Math.sin(tw.progress * Math.PI * 3) * sway; t.angle = Math.sin(tw.progress * Math.PI * 3) * 20; } });
  }

  // ---- string lights: a colour wave runs down the wire, every bulb pulsing as it passes ----
  const bulbs = rowBulbs(row, worldW).map((b) => {
    const c = BULB[b.i % BULB.length];
    return { b, g: add(scene.add.circle(b.x, b.y + 6, 15, c, 1)).setAlpha(0.1).setBlendMode(Phaser.BlendModes.ADD) };
  });
  if (bulbs.length) {
    let phase = 0;
    scene.time.addEvent({ delay: 60, loop: true, callback: () => {
      phase += 0.35 + k * 0.1;
      bulbs.forEach(({ b, g }) => { g.setAlpha(0.1 + 0.55 * Math.max(0, Math.sin(phase - b.x / 90))); g.setScale(1 + 0.4 * Math.max(0, Math.sin(phase - b.x / 90))); });
    } });
  }

  // ---- bunting-style balloons drift across the rooftops now and then ----
  every(5000, 11000 - k * 2000, () => {
    const y = rnd(70, 330), x0 = rnd(0, Math.max(1, worldW - 400));
    const bal = add(scene.add.ellipse(x0, y, 24, 30, PAPER[rnd(0, 2)], 1)).setStrokeStyle(2, 0x2E1F16);
    const str = add(scene.add.rectangle(x0, y + 24, 2, 22, 0x2E1F16, 1));
    const dx = rnd(240, 480), dur = rnd(7000, 11000);
    scene.tweens.add({ targets: [bal, str], x: `+=${dx}`, duration: dur, ease: 'Sine.easeInOut' });
    scene.tweens.add({ targets: [bal, str], y: `-=${rnd(60, 120)}`, duration: dur, ease: 'Sine.easeInOut',
      onUpdate: (tw) => { const a = Math.sin(Math.PI * tw.progress) * 1.5; bal.setAlpha(Math.min(1, a)); str.setAlpha(Math.min(1, a)); },
      onComplete: () => { bal.destroy(); str.destroy(); } });
  }, 1500);
}
