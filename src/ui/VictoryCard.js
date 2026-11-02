// Victory card: a centred panel (not a full screen) shown over the frozen arena when a boss falls.
// Spec: design/art/victory-card.md. Copy: victoryData.js. Frame art: assets/ui/victory-card-frame.svg (text-free; text is live).
// Returns { cancel() }. Calls onDone() once on Enter/Space/click or after VICTORY.autoMs (never when cancelled).
import { CSS, FONTS } from '../config/assetKeys.js';
import { VICTORY } from './victoryData.js';

const CARD = { x: 160, y: 130, depth: 7000 };   // top-left of the 960x460 frame on the 1280x720 view
const TEXT_X = CARD.x + 180 + 160;               // text column starts right of the emblem (spec: left 340 inside the card)
const TEXT_W = 570;

export default function showVictoryCard(scene, { header = VICTORY.header, lines }, onDone, { reduceMotion = false, sound = null } = {}) {
  const objs = [];
  const add = (o) => { o.setDepth(CARD.depth).setScrollFactor(0); objs.push(o); return o; };
  const dim = add(scene.add.rectangle(640, 360, 1280, 720, 0x2e1f16, 0.45).setInteractive().setAlpha(0));
  const card = []; // everything that drops in together
  const put = (o) => { add(o); card.push(o); return o; };

  if (scene.textures.exists(VICTORY.frameKey)) put(scene.add.image(CARD.x, CARD.y, VICTORY.frameKey).setOrigin(0, 0));
  else put(scene.add.rectangle(CARD.x, CARD.y, VICTORY.frameW - 16, VICTORY.frameH - 16, 0xf4e6c8).setOrigin(0, 0).setStrokeStyle(6, 0x2e1f16)); // frame art missing: plain cream card
  const title = scene.add.text(CARD.x + 6 + (VICTORY.frameW - 22) / 2, CARD.y + 52, header, { fontFamily: FONTS.button, fontSize: '64px', color: CSS.cream,
    stroke: CSS.darkBrown, strokeThickness: 8 }).setOrigin(0.5);
  if (title.setLetterSpacing) title.setLetterSpacing(4);
  put(title);
  const head = put(scene.add.text(TEXT_X, CARD.y + 160, lines[0], { fontFamily: FONTS.button, fontSize: '46px', color: CSS.darkBrown,
    wordWrap: { width: TEXT_W }, lineSpacing: 6 }).setOrigin(0, 0));
  if (lines.length > 1) {
    put(scene.add.text(TEXT_X, head.y + head.height + 18, lines.slice(1).join('\n'), { fontFamily: FONTS.body, fontStyle: '700', fontSize: '30px',
      color: CSS.brickRed, wordWrap: { width: TEXT_W }, lineSpacing: 6 }).setOrigin(0, 0));
  }
  put(scene.add.text(TEXT_X, CARD.y + 414, VICTORY.prompt, { fontFamily: FONTS.body, fontSize: '20px', color: CSS.darkBrown }).setOrigin(0, 0));

  // Entrance: dim fades in, card drops 40px with a small settle (a plain fade when reduce-motion is on).
  const dy = reduceMotion ? 0 : 40;
  card.forEach((o) => { o.y -= dy; o.setAlpha(0); });
  scene.tweens.add({ targets: dim, alpha: 1, duration: 200 });
  scene.tweens.add({ targets: card, y: `+=${dy}`, alpha: 1, duration: reduceMotion ? 150 : 250, ease: 'Cubic.easeOut' });
  if (sound) { try { sound(); } catch { /* sound is a nicety */ } }

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
    if (done || scene.time.now - t0 < VICTORY.inputGuardMs) return; done = true;
    cleanup(); onDone();
  }
  function cancel() { if (done) return; done = true; cleanup(); }
  kb.on('keydown-ENTER', finish); kb.on('keydown-SPACE', finish);
  dim.on('pointerdown', finish);
  const timer = scene.time.delayedCall(VICTORY.autoMs, finish);
  scene.events.once('shutdown', cancel);
  return { cancel };
}
