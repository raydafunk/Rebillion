// Story intro card: full-screen text overlay shown once between the menu and the arena.
// Copy lives in storyData.js. Calls onDone() once, on Enter/Space/click or after STORY.autoMs.
import { COLORS, CSS, FONTS } from '../config/assetKeys.js';
import { STORY } from './storyData.js';

export default function showStoryCard(scene, onDone) {
  const objs = [];
  const add = (o) => { o.setDepth(1000); objs.push(o); return o; };
  const bg = add(scene.add.rectangle(640, 360, 1280, 720, COLORS.darkBrown, 0.94).setInteractive());
  add(scene.add.text(640, 150, STORY.title, { fontFamily: FONTS.button, fontSize: '64px', color: CSS.mustard,
    stroke: CSS.darkBrown, strokeThickness: 8 }).setOrigin(0.5));
  add(scene.add.text(640, 370, STORY.lines.join('\n\n'), { fontFamily: FONTS.body, fontSize: '26px', color: CSS.cream,
    align: 'center', wordWrap: { width: 900 } }).setOrigin(0.5));
  add(scene.add.text(640, 660, STORY.prompt, { fontFamily: FONTS.body, fontSize: '20px', color: CSS.sand }).setOrigin(0.5));

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
  const timer = scene.time.delayedCall(STORY.autoMs, finish);
}
