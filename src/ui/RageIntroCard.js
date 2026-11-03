// Rage intro card: a centred panel shown over the arena at the start of Level 2 only (see shouldShowRageIntro).
// Spec: design/art/rage-intro-card.md. Copy and numbers: rageIntroData.js. Frame art: assets/ui/rage-intro-card-frame.svg (placeholder, text-free).
// Same contract as showLevelCard: onDone() is called exactly once, on Enter/Space/click or after RAGE_INTRO.autoMs.
// Returns { cancel() } to close it without calling onDone. Scene shutdown cleans up without calling onDone.
// The scene must preload RAGE_INTRO_ASSET (rageIntroData.js); without it a plain dark panel is drawn.
import { FONTS } from '../config/assetKeys.js';
import { RAGE_INTRO } from './rageIntroData.js';

export default function showRageIntroCard(scene, onDone, { reduceMotion = false } = {}) {
  const R = RAGE_INTRO, L = R.layout, C = R.colors;
  const objs = [];
  const add = (o) => { o.setDepth(R.depth).setScrollFactor(0); objs.push(o); return o; };
  const dim = add(scene.add.rectangle(640, 360, 1280, 720, 0x2e1f16, 0.6).setInteractive().setAlpha(0));
  const card = [];
  const put = (o) => { add(o); card.push(o); return o; };

  if (scene.textures.exists(R.frameKey)) put(scene.add.image(L.x, L.y, R.frameKey).setOrigin(0, 0));
  else put(scene.add.rectangle(L.x, L.y, R.frameW - 16, R.frameH - 16, 0x3a2218).setOrigin(0, 0).setStrokeStyle(6, 0x2e1f16)); // frame art missing: plain panel

  const title = scene.add.text(L.x + 6 + (R.frameW - 22) / 2, L.y + L.titleY, R.title, { fontFamily: FONTS.button, fontSize: `${L.titleSize}px`,
    color: C.title, stroke: C.titleStroke, strokeThickness: 8 }).setOrigin(0.5);
  if (title.setLetterSpacing) title.setLetterSpacing(4);
  put(title);
  put(scene.add.text(L.x + L.keyX, L.y + L.keyY, R.keyLabel, { fontFamily: FONTS.button, fontSize: `${L.keySize}px`, color: C.key }).setOrigin(0.5));

  let y = L.y + L.textY;
  R.lines.forEach((line, i) => {
    const t = put(scene.add.text(L.x + L.textX, y, line, { fontFamily: FONTS.body, fontStyle: i === R.highlightLine ? '700' : '500', fontSize: `${L.lineSize}px`,
      color: i === R.highlightLine ? C.highlight : C.line, wordWrap: { width: L.textW }, lineSpacing: L.lineSpacing }).setOrigin(0, 0));
    y += t.height + L.lineGap;
  });
  put(scene.add.text(L.x + L.textX, L.y + L.promptY, R.prompt, { fontFamily: FONTS.body, fontSize: `${L.promptSize}px`, color: C.prompt }).setOrigin(0, 0));

  // Entrance: dim fades in, card drops 40px (plain fade with reduce-motion).
  const dy = reduceMotion ? 0 : 40;
  card.forEach((o) => { o.y -= dy; o.setAlpha(0); });
  scene.tweens.add({ targets: dim, alpha: 1, duration: 200 });
  scene.tweens.add({ targets: card, y: `+=${dy}`, alpha: 1, duration: reduceMotion ? 150 : 250, ease: 'Cubic.easeOut' });

  let done = false;
  const kb = scene.input.keyboard;
  const t0 = scene.time.now;
  const cleanup = () => {
    kb.off('keydown-ENTER', finish); kb.off('keydown-SPACE', finish);
    scene.events.off('shutdown', cancel);
    timer.remove(false);
    scene.tweens.killTweensOf([dim, ...card]);
    objs.forEach((o) => o.destroy());
  };
  function finish() {
    if (done || scene.time.now - t0 < R.inputGuardMs) return; done = true; // ignore the Enter that opened the card
    cleanup(); onDone();
  }
  function cancel() { if (done) return; done = true; cleanup(); }
  kb.on('keydown-ENTER', finish); kb.on('keydown-SPACE', finish);
  dim.on('pointerdown', finish);
  const timer = scene.time.delayedCall(R.autoMs, finish);
  scene.events.once('shutdown', cancel);
  return { cancel };
}
