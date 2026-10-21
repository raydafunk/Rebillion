// Ambient background animation for a level (window glow, someone-home lights, drifting dust).
// Everything sits between the background and the fighters, uses Phaser tweens (which die with the scene),
// and never touches the lane's gameplay.
import { tiledXs, readAmbient } from './ambientData.js';
import addRowAmbient from './ambientRow.js';
import addOutdoorAmbient from './ambientOutdoor.js';
import addHeightsAmbient from './ambientHeights.js';
import addMarketAmbient from './ambientMarket.js';
import addCourtAmbient from './ambientCourt.js';

const DEPTH = -998;

export default function addAmbient(scene, style, worldW) {
  const cfg = readAmbient(style);
  if (!cfg) return;
  if (cfg.row) addRowAmbient(scene, cfg.row, worldW);
  if (cfg.outdoor) addOutdoorAmbient(scene, cfg.outdoor, cfg.period, worldW);
  if (cfg.heights) addHeightsAmbient(scene, cfg.heights, cfg.period, worldW);
  if (cfg.market) addMarketAmbient(scene, cfg.market, cfg.period, worldW);
  if (cfg.court) addCourtAmbient(scene, cfg.court, cfg.period, worldW);
  const color = Phaser.Display.Color.HexStringToColor(cfg.color).color;
  const rnd = Phaser.Math.Between;
  const glow = (x, w, h, y, alpha) =>
    scene.add.rectangle(x, y, w, h, color, 1).setAlpha(alpha).setOrigin(0, 0).setDepth(DEPTH).setBlendMode(Phaser.BlendModes.ADD);

  // Lit windows breathe slowly, each on its own beat; every third one stutters like a tired bulb.
  tiledXs(cfg.lit, cfg.period, worldW).forEach((x, i) => {
    const g = glow(x, cfg.windowW, cfg.windowH, cfg.windowY, 0);
    if (i % 3 === 2) {
      scene.time.addEvent({ delay: 140, loop: true, callback: () => { g.setAlpha(Math.random() < 0.18 ? 0.02 : 0.1); } });
    } else {
      scene.tweens.add({ targets: g, alpha: 0.17, duration: rnd(2200, 4200), yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: rnd(0, 2500) });
    }
  });

  // Dark windows: now and then someone switches the light on, then off again.
  tiledXs(cfg.dark, cfg.period, worldW).forEach((x) => {
    const g = glow(x, cfg.windowW, cfg.windowH, cfg.windowY, 0);
    const cycle = () => {
      scene.tweens.add({
        targets: g, alpha: 0.8, duration: 600, hold: rnd(2500, 5000), yoyo: true, ease: 'Sine.easeInOut',
        onComplete: () => scene.time.delayedCall(rnd(6000, 14000), cycle),
      });
    };
    scene.time.delayedCall(rnd(2000, 9000), cycle);
  });

  // Dust motes float up through each lit window's beam.
  tiledXs(cfg.lit, cfg.period, worldW).forEach((x) => {
    for (let n = 0; n < cfg.dustPerBeam; n++) {
      const mote = scene.add.circle(0, 0, rnd(1, 2), color, 1).setAlpha(0).setDepth(DEPTH).setBlendMode(Phaser.BlendModes.ADD);
      const drift = () => {
        const sx = x + rnd(-10, cfg.windowW + 20);
        const sy = rnd(cfg.windowY + cfg.windowH + 20, cfg.beamBottom);
        mote.setPosition(sx, sy).setAlpha(0);
        scene.tweens.add({
          targets: mote, x: sx + rnd(-18, 28), y: sy - rnd(40, 90),
          duration: rnd(4000, 8000), ease: 'Sine.easeInOut',
          onUpdate: (tw) => { mote.setAlpha(0.55 * Math.sin(Math.PI * tw.progress)); },
          onComplete: drift,
        });
      };
      scene.time.delayedCall(rnd(0, 6000), drift);
    }
  });
}
