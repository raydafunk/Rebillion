// Level intro card: shown over the arena before each level's first wave. Copy comes from the level JSON.
// Calls onDone() once, on Enter/Space/click or after autoMs, so it never blocks the player.
import { COLORS, CSS, FONTS } from '../config/assetKeys.js';

export const LEVEL_CARD_AUTO_MS = 8000;

export default function showLevelCard(scene, { number, total, name, text }, onDone) {
  const objs = [];
  const add = (o) => { o.setDepth(7000).setScrollFactor(0); objs.push(o); return o; };
  const bg = add(scene.add.rectangle(640, 360, 1280, 720, COLORS.darkBrown, 0.8).setInteractive());
  add(scene.add.text(640, 190, `LEVEL ${number} / ${total}`, { fontFamily: FONTS.body, fontSize: '28px', color: CSS.cream }).setOrigin(0.5));
  add(scene.add.text(640, 270, name.toUpperCase(), { fontFamily: FONTS.button, fontSize: '72px', color: CSS.mustard,
    stroke: CSS.darkBrown, strokeThickness: 8, align: 'center', wordWrap: { width: 1100 } }).setOrigin(0.5));
  if (text) add(scene.add.text(640, 420, text, { fontFamily: FONTS.body, fontSize: '26px', color: CSS.cream,
    align: 'center', wordWrap: { width: 860 } }).setOrigin(0.5));
  add(scene.add.text(640, 640, 'Enter / click to fight', { fontFamily: FONTS.body, fontSize: '20px', color: CSS.cream }).setOrigin(0.5));

  let done = false;
  const kb = scene.input.keyboard;
  const t0 = scene.time.now;
  const finish = () => {
    if (done || scene.time.now - t0 < 300) return; done = true; // ignore the Enter that opened the card
    kb.off('keydown-ENTER', finish); kb.off('keydown-SPACE', finish);
    timer.remove(false);
    objs.forEach((o) => o.destroy());
    onDone();
  };
  kb.on('keydown-ENTER', finish); kb.on('keydown-SPACE', finish);
  bg.on('pointerdown', finish);
  const timer = scene.time.delayedCall(LEVEL_CARD_AUTO_MS, finish);
  // Scene shut down while the card is up (e.g. quit to menu): drop the key listeners.
  scene.events.once('shutdown', () => { done = true; kb.off('keydown-ENTER', finish); kb.off('keydown-SPACE', finish); });
}
