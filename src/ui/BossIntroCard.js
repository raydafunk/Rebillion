// Boss intro story card: Zed (left) and the boss (right) trade lines over the frozen arena, then the fight starts.
// Copy and art slots: bossIntroData.js. Enter/Space/click advances one beat; the last beat calls onDone().
// Returns { cancel() } (closes without calling onDone). Scene shutdown cleans up without calling onDone.
// A portrait whose texture is missing is drawn as a grey box with the speaker's name, so the card always works.
import { CSS, FONTS } from '../config/assetKeys.js';
import { BOSS_INTRO } from './bossIntroData.js';

export default function showBossIntroCard(scene, intro, onDone, { reduceMotion = false } = {}) {
  const B = BOSS_INTRO, P = B.portrait;
  const objs = [];
  const add = (o) => { o.setDepth(B.depth).setScrollFactor(0); objs.push(o); return o; };
  const dim = add(scene.add.rectangle(640, 360, 1280, 720, 0x2e1f16, 0.72).setInteractive().setAlpha(0));

  // Portraits: one per side, the speaker lit and the listener dimmed.
  const names = { zed: 'Zed', boss: (intro.beats.find((b) => b.side === 'boss') || {}).name || 'Boss' };
  const portrait = (side, x) => {
    const spec = intro.portraits && intro.portraits[side];
    let o;
    if (spec && scene.textures.exists(spec.key)) o = scene.add.image(x + P.w / 2, P.y + P.h, spec.key).setOrigin(0.5, 1).setDisplaySize(P.w, P.h);
    else {
      o = scene.add.container(x, P.y, [
        scene.add.rectangle(0, 0, P.w, P.h, 0x6b5a4a).setOrigin(0, 0).setStrokeStyle(6, 0x2e1f16),
        scene.add.text(P.w / 2, P.h / 2, `${names[side]}\nPORTRAIT\nPLACEHOLDER`, { fontFamily: FONTS.button, fontSize: '34px', color: CSS.cream, align: 'center' }).setOrigin(0.5),
      ]);
    }
    return add(o).setAlpha(0);
  };
  const pic = { zed: portrait('zed', P.leftX), boss: portrait('boss', P.rightX) };

  // Dialogue panel along the bottom.
  const panel = add(scene.add.rectangle(640, 595, 1160, 190, 0x3a2218, 0.96).setStrokeStyle(6, 0x2e1f16).setAlpha(0));
  const nameTag = add(scene.add.text(110, 515, '', { fontFamily: FONTS.button, fontSize: '34px', color: CSS.mustard, stroke: CSS.darkBrown, strokeThickness: 6 }).setOrigin(0, 0.5).setAlpha(0));
  const body = add(scene.add.text(110, 545, '', { fontFamily: FONTS.body, fontSize: '28px', color: CSS.cream, wordWrap: { width: 1060 }, lineSpacing: 6 }).setOrigin(0, 0).setAlpha(0));
  const prompt = add(scene.add.text(1170, 672, '', { fontFamily: FONTS.body, fontSize: '20px', color: CSS.sand }).setOrigin(1, 0.5).setAlpha(0));
  const title = intro.title ? add(scene.add.text(640, 48, intro.title, { fontFamily: FONTS.button, fontSize: '40px', color: CSS.mustard, stroke: CSS.darkBrown, strokeThickness: 8 }).setOrigin(0.5).setAlpha(0)) : null;
  if (title && title.setLetterSpacing) title.setLetterSpacing(6);

  let i = 0;
  const show = (n) => {
    const b = intro.beats[n];
    nameTag.setText(b.name || names[b.side]);
    body.setText(b.text);
    prompt.setText(n === intro.beats.length - 1 ? B.lastPrompt : B.prompt);
    for (const side of ['zed', 'boss']) {
      const lit = side === b.side;
      pic[side].setAlpha(lit ? 1 : 0.45);
      if (pic[side].setTint) { if (lit) pic[side].clearTint(); else pic[side].setTint(0x7a6a5c); }
    }
  };
  show(0);

  // Entrance: dim and panel fade in; portraits slide in from the sides (plain fade with reduce-motion).
  const slide = reduceMotion ? 0 : 60;
  pic.zed.x -= slide; pic.boss.x += slide;
  const fade = [panel, nameTag, body, prompt, ...(title ? [title] : [])];
  scene.tweens.add({ targets: dim, alpha: 1, duration: 200 });
  scene.tweens.add({ targets: fade, alpha: 1, duration: 220 });
  scene.tweens.add({ targets: pic.zed, x: `+=${slide}`, duration: reduceMotion ? 1 : 260, ease: 'Cubic.easeOut' });
  scene.tweens.add({ targets: pic.boss, x: `-=${slide}`, duration: reduceMotion ? 1 : 260, ease: 'Cubic.easeOut' });

  let done = false;
  const kb = scene.input.keyboard;
  const t0 = scene.time.now;
  let last = t0;
  const cleanup = () => {
    kb.off('keydown-ENTER', next); kb.off('keydown-SPACE', next);
    scene.events.off('shutdown', cancel);
    timer.remove(false);
    scene.tweens.killTweensOf(objs);
    objs.forEach((o) => o.destroy());
  };
  function next() {
    const now = scene.time.now;
    if (done || now - t0 < B.inputGuardMs || now - last < 120) return; // guard: the opening key, and key-repeat
    last = now;
    if (i < intro.beats.length - 1) { show(++i); return; }
    done = true; cleanup(); onDone();
  }
  function cancel() { if (done) return; done = true; cleanup(); }
  kb.on('keydown-ENTER', next); kb.on('keydown-SPACE', next);
  dim.on('pointerdown', next);
  const timer = scene.time.delayedCall(B.autoMs, () => { if (done) return; done = true; cleanup(); onDone(); });
  scene.events.once('shutdown', cancel);
  return { cancel };
}
