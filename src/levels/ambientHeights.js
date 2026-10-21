// Songwindow Heights ambient animation: the windows are waiting for music. Lit windows breathe and let little
// notes drift out, laundry sways on the lines, and the sun, light shafts, birds and motes come from the outdoor set.
// Decoration only: depth -998 (behind the fighters), flat shapes, Phaser tweens/time events that die with the scene,
// and nothing ever enters the lane (y 460 to 680).
import { tiledItems, laneSafeY } from './ambientData.js';

const DEPTH = -998;
const hex = (s) => Phaser.Display.Color.HexStringToColor(s).color;

export default function addHeightsAmbient(scene, h, period, worldW) {
  const rnd = Phaser.Math.Between;

  // ---- lit windows breathe; every third one flickers like a tired bulb ----
  const windows = tiledItems(h.windows, period, worldW);
  windows.forEach(([x, y], i) => {
    const g = scene.add.rectangle(x, y, h.windowW, h.windowH, 0xE3A92B, 1).setOrigin(0, 0).setAlpha(0.02).setDepth(DEPTH).setBlendMode(Phaser.BlendModes.ADD);
    if (i % 3 === 2) {
      scene.time.addEvent({ delay: 160, loop: true, callback: () => g.setAlpha(Math.random() < 0.15 ? 0.03 : 0.16) });
    } else {
      scene.tweens.add({ targets: g, alpha: 0.28, duration: rnd(1800, 3400), yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: rnd(0, 2500) });
    }
  });

  // ---- music notes drift out of the open windows, wobble upward and fade ----
  const colors = h.noteColors.map(hex);
  windows.forEach(([x, y], wi) => {
    for (let n = 0; n < h.notesPerWindow; n++) {
      const note = scene.add.graphics().setDepth(DEPTH).setAlpha(0);
      const c = colors[(wi + n) % colors.length];
      note.fillStyle(c, 1).fillEllipse(0, 0, 8, 6);
      note.lineStyle(2, c, 1).beginPath().moveTo(3.5, 0).lineTo(3.5, -14).lineTo(9, -10).strokePath();
      const drift = () => {
        const sx = x + rnd(4, h.windowW - 4), sy = y + rnd(0, 14), dx = rnd(-30, 60), rise = rnd(70, 140), dur = rnd(3800, 6200);
        note.setPosition(sx, sy).setAlpha(0).setScale(0.8);
        scene.tweens.add({
          targets: note, duration: dur, ease: 'Sine.easeOut', x: sx + dx, y: sy - rise,
          onUpdate: (tw) => {
            const p = tw.progress;
            note.x = sx + dx * p + Math.sin(p * Math.PI * 3) * 8;
            note.y = laneSafeY(sy - rise * p);
            note.angle = Math.sin(p * Math.PI * 3) * 14;
            note.setScale(0.8 + 0.5 * p).setAlpha(0.85 * Math.sin(Math.PI * p));
          },
          onComplete: () => scene.time.delayedCall(rnd(1500, 7000), drift),
        });
      };
      scene.time.delayedCall(rnd(0, 6000), drift);
    }
  });

  // ---- laundry on the lines sways in the breeze, each cloth on its own beat ----
  const cloth = h.laundryColors.map(hex);
  tiledItems(h.laundry, period, worldW).forEach(([x, y], i) => {
    const piece = scene.add.rectangle(x, y, rnd(16, 22), rnd(24, 32), cloth[i % cloth.length], 1).setOrigin(0.5, 0).setDepth(DEPTH);
    piece.setStrokeStyle(2, 0x2E1F16, 1);
    piece.angle = -6;
    scene.tweens.add({ targets: piece, angle: 7, duration: rnd(1500, 2600), yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: rnd(0, 1800) });
    scene.tweens.add({ targets: piece, scaleX: 0.82, duration: rnd(1200, 2000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: rnd(0, 1500) });
  });
}
