// Iron Line Push (Level 6) ambient animation: a market that refuses to stop. Steam rolls off the stew pots,
// bunting flutters in waves, ladles and pots swing on their hooks, neighbours breathe and one stirs a ladle,
// a sunlit band sweeps the stalls and the distant Rust visors keep a slow watch.
// Decoration only: depth -998 (behind the fighters), flat shapes, Phaser tweens/time events that die with the scene,
// and nothing ever enters the lane (y 460 to 680).
import { tiledItems, flagPhase } from './ambientData.js';

const DEPTH = -998;
const CREAM = 0xF4E6C8;
const WARM = 0xFFF1C2;
const DARK = 0x3A2A20;
const SKIN = 0x4A3224;
const hex = (s) => Phaser.Display.Color.HexStringToColor(s).color;

export default function addMarketAmbient(scene, m, period, worldW) {
  const rnd = Phaser.Math.Between;
  const add = (g) => g.setDepth(DEPTH);
  const loop = (cfg) => scene.tweens.add({ yoyo: true, repeat: -1, ease: 'Sine.easeInOut', ...cfg });

  // ---- steam: soft puffs roll up off every pot, swelling, swaying and fading as they climb ----
  tiledItems(m.steam, period, worldW).forEach(([x, y]) => {
    for (let n = 0; n < m.puffsPerPot; n++) {
      const puff = add(scene.add.ellipse(x, y, 40, 22, CREAM, 1)).setAlpha(0);
      const rise = () => {
        const x0 = x + rnd(-8, 8), sway = rnd(-20, 20), top = y - rnd(130, 190), dur = rnd(3200, 4600);
        puff.setPosition(x0, y).setScale(0.55).setAlpha(0);
        scene.tweens.add({
          targets: puff, y: top, duration: dur, ease: 'Sine.easeOut',
          onUpdate: (tw) => {
            const p = tw.progress;
            puff.x = x0 + Math.sin(p * Math.PI * 2) * sway;
            puff.setScale(0.55 + 1.3 * p, 0.55 + 1.0 * p);
            puff.setAlpha(0.95 * Math.sin(Math.PI * Math.min(1, p * 1.05)) * (1 - 0.35 * p));
          },
          onComplete: rise,
        });
      };
      scene.time.delayedCall((n * 3800) / m.puffsPerPot + rnd(0, 400), rise);
    }
    // The pot rim shivers as the stew boils.
    const lid = add(scene.add.rectangle(x, y + 4, 56, 5, 0xE3A92B, 1));
    loop({ targets: lid, y: y + 1, duration: rnd(240, 420), delay: rnd(0, 400) });
  });

  // ---- bunting flutters: every flag swings from its top corner, a gust travelling along the wire ----
  const colors = m.flagColors.map(hex);
  tiledItems(m.flags, period, worldW).forEach(([x, y, ci], i) => {
    const flag = add(scene.add.graphics()).setPosition(x + 12, y);
    flag.fillStyle(colors[(ci | 0) % colors.length], 1).fillTriangle(-12, 0, 12, 0, 0, 26);
    loop({ targets: flag, angle: i % 2 ? 11 : -11, scaleX: 0.88, duration: rnd(900, 1500), delay: flagPhase(x, period) });
  });

  // ---- hanging pots and ladles swing on their hooks ----
  tiledItems(m.hangers, period, worldW).forEach(([x, y, len, kind], i) => {
    const g = add(scene.add.graphics()).setPosition(x, y);
    g.lineStyle(3, DARK, 1).beginPath().moveTo(0, 0).lineTo(0, len).strokePath();
    g.fillStyle(DARK, 1);
    if (kind === 1) { g.fillRect(-13.5, len, 27, 14); g.fillEllipse(0, len + 14, 27, 24); }
    else g.fillEllipse(0, len + 12, 18, 24);
    g.setAngle(-4);
    loop({ targets: g, angle: 5 + (i % 3), duration: rnd(1300, 2100), delay: rnd(0, 1400) });
  });

  // ---- neighbours: breathing, a nodding head, a hat, an apron and a ladle that stirs ----
  tiledItems(m.neighbours, period, worldW).forEach(([x, y, kind], i) => {
    const base = scene.add.container(x, y + 80);
    add(base);
    const body = scene.add.graphics().fillStyle(SKIN, 1).fillRoundedRect(-30, -64, 60, 64, { tl: 30, tr: 30, bl: 0, br: 0 });
    const head = scene.add.container(0, -80, [scene.add.circle(0, 0, 17, SKIN, 1)]);
    base.add([body, head]);
    if (kind === 2) base.add(scene.add.rectangle(0, -14, 40, 55, 0x2F6B3F, 1));
    if (kind === 1) head.add(scene.add.polygon(0, -31, [-30, 7, 30, 7, 22, -7, -22, -7], DARK, 1));
    if (kind === 2) {
      const arm = scene.add.graphics().setPosition(24, -40);
      arm.lineStyle(4, 0x6B4423, 1).beginPath().moveTo(0, 0).lineTo(8, -42).strokePath();
      arm.fillStyle(DARK, 1).fillEllipse(9, -46, 16, 12);
      base.add(arm);
      arm.setAngle(-24);
      loop({ targets: arm, angle: 22, duration: rnd(520, 760) });
    }
    loop({ targets: base, scaleY: 1.025, angle: i % 2 ? 1.2 : -1.2, duration: rnd(1700, 2500), delay: rnd(0, 1500) });
    loop({ targets: head, y: -81.5, x: i % 2 ? 2 : -2, angle: i % 2 ? 4 : -4, duration: rnd(1400, 2200), delay: rnd(0, 1200) });
  });

  // ---- a band of low sun sweeps the stall row now and then, warming the awnings (stays above the lane) ----
  const sweepEvery = () => {
    const band = add(scene.add.polygon(0, 0, [0, 0, 70, 0, 150, 440, 80, 440], WARM, 1)).setOrigin(0, 0).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    const cam = scene.cameras.main;
    const x0 = cam.scrollX - 100, dx = cam.width + 300;
    band.setPosition(x0, 0);
    scene.tweens.add({
      targets: band, x: x0 + dx, duration: 9000, ease: 'Sine.easeInOut',
      onUpdate: (tw) => band.setAlpha(0.1 * Math.sin(Math.PI * tw.progress)),
      onComplete: () => { band.destroy(); scene.time.delayedCall(rnd(5000, 9000), sweepEvery); },
    });
  };
  scene.time.delayedCall(2500, sweepEvery);

  // ---- the distant Iron Line keeps watch: visor slits pulse like a slow scan, one after another ----
  tiledItems(m.visors, period, worldW).forEach(([x, y], i) => {
    const v = add(scene.add.rectangle(x, y, 12, 3, 0x4FB3D9, 1)).setOrigin(0, 0).setAlpha(0.15);
    loop({ targets: v, alpha: 0.7, duration: 700, delay: i * 450, hold: 400, repeatDelay: 1800 });
  });
}
