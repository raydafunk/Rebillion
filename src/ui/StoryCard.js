// Story intro sequence: Zed's mother at home -> Zed angry -> Zed running into the city (the four story lines) -> arena.
// Copy, scenes and sprite frames live in storyData.js. Calls onDone() once.
// Enter / Space / click advances one beat, Esc skips the whole sequence, and every beat times out (STORY.autoMs)
// so the story can never block the player.
//
// NO WAITING: backgrounds are drawn in code (no image files) so each card shows on its very first frame. The sprites
// are a few tiny 48x48 PNGs fetched by preloadStoryArt (MenuScene starts it the moment Fight is pressed); a sprite
// simply appears when its frames are in, and the text/background never wait for it.
import { COLORS, CSS, FONTS } from '../config/assetKeys.js';
import { STORY, STORY_SCENES, storyAssets } from './storyData.js';

const DEPTH = 1000;

/** Queue + run the story sprites on this scene's loader. Never rejects; resolves when done (or immediately if cached). */
export function preloadStoryArt(scene) {
  return new Promise((resolve) => {
    try {
      let queued = 0;
      for (const a of storyAssets()) if (!scene.textures.exists(a.key)) { scene.load.image(a.key, a.path); queued++; }
      if (!queued) return resolve();
      scene.load.once('complete', resolve);
      scene.load.on('loaderror', () => {}); // a missing sprite just never appears; the card still works
      if (!scene.load.isLoading()) scene.load.start();
    } catch (e) { console.warn('[story art] skipped', e); resolve(); }
  });
}

// Small deterministic random so a tiled skyline repeats seamlessly.
const rng = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

function drawHome(g) {
  g.fillStyle(0x4a2f22).fillRect(0, 0, 1280, 720);
  g.fillStyle(0x3b2418).fillRect(0, 430, 1280, 290);                       // floor
  for (let x = 0; x < 1280; x += 96) g.fillStyle(0x2e1f16).fillRect(x, 430, 3, 290);
  g.fillStyle(0x2e1f16).fillRect(0, 424, 1280, 8);                          // skirting
  // window with a night sky and moon
  g.fillStyle(0x2e1f16).fillRect(120, 70, 250, 250).fillStyle(0x1c2a45).fillRect(132, 82, 226, 226);
  g.fillStyle(0xf4e6c8, 0.9).fillCircle(290, 150, 26);
  g.fillStyle(0x14203a).fillRect(132, 250, 226, 58);
  g.fillStyle(0x2e1f16).fillRect(242, 82, 6, 226).fillRect(132, 192, 226, 6);
  // father's mural on the wall: three colour blocks in a frame
  g.fillStyle(0x2e1f16).fillRect(940, 90, 220, 170).fillStyle(0xf4e6c8).fillRect(950, 100, 200, 150);
  g.fillStyle(0xa8402e).fillRect(960, 110, 58, 130).fillStyle(0xe3a92b).fillRect(1026, 110, 58, 130).fillStyle(0x2f5d3a).fillRect(1092, 110, 48, 130);
  // table, lamp and the empty chair
  g.fillStyle(0x2e1f16).fillRect(880, 440, 300, 18).fillRect(900, 458, 14, 120).fillRect(1146, 458, 14, 120);
  g.fillStyle(0x5a3a28).fillRect(780, 410, 70, 12).fillRect(784, 422, 10, 150).fillRect(836, 422, 10, 150).fillRect(776, 330, 12, 90); // empty chair
  g.fillStyle(0xe3a92b).fillTriangle(1010, 388, 1070, 388, 1040, 340).fillStyle(0x2e1f16).fillRect(1036, 388, 8, 52);
  for (const [r, a] of [[260, 0.05], [190, 0.07], [120, 0.1]]) g.fillStyle(0xf2c04d, a).fillCircle(1040, 380, r); // lamp glow
  g.fillStyle(0x000000, 0.28).fillRect(0, 0, 1280, 720);                    // sad, dim mood
}

function drawAlley(g) {
  g.fillStyle(0x3b1f1a).fillRect(0, 0, 1280, 720);
  g.lineStyle(2, 0x23120f, 1);
  for (let y = 0, row = 0; y < 460; y += 34, row++) {
    g.lineBetween(0, y, 1280, y);
    for (let x = (row % 2) * 40; x < 1280; x += 80) g.lineBetween(x, y, x, y + 34);
  }
  g.fillStyle(0x23120f).fillRect(0, 460, 1280, 260);                        // ground
  for (const [r, a] of [[380, 0.1], [280, 0.14], [180, 0.18]]) g.fillStyle(0xa8402e, a).fillCircle(640, 330, r); // angry red glow
  g.fillStyle(0x000000, 0.22).fillRect(0, 0, 1280, 720);
}

// Returns the layers to scroll: each is a Graphics 2560 wide holding the same 1280-wide pattern twice.
function drawCity(scene, add) {
  const sky = add(scene.add.graphics());
  sky.fillGradientStyle(0x2e1f16, 0x2e1f16, 0xa8402e, 0xa8402e, 1).fillRect(0, 0, 1280, 470);
  sky.fillStyle(0xe3a92b, 0.9).fillCircle(930, 330, 70).fillStyle(0xf2c04d, 0.25).fillCircle(930, 330, 120);
  const layer = (seed, color, minH, maxH, wMin, wMax, winColor) => {
    const g = add(scene.add.graphics());
    for (let tile = 0; tile < 2; tile++) {
      const r = rng(seed);
      for (let x = 0; x < 1280;) {
        const w = wMin + r() * (wMax - wMin), h = minH + r() * (maxH - minH);
        g.fillStyle(color).fillRect(tile * 1280 + x, 470 - h, w, h);
        if (winColor) for (let wy = 470 - h + 14; wy < 450; wy += 26) for (let wx = x + 8; wx < x + w - 10; wx += 20) {
          if (r() < 0.35) g.fillStyle(winColor, 0.85).fillRect(tile * 1280 + wx, wy, 8, 12); else r();
        }
        x += w + 4;
      }
    }
    return g;
  };
  const far = layer(7, 0x4a2a24, 120, 260, 60, 110, null);
  const mid = layer(11, 0x35201a, 160, 330, 70, 130, 0xe3a92b);
  const near = layer(13, 0x23120f, 90, 200, 90, 160, null);
  const ground = add(scene.add.graphics());
  ground.fillStyle(0x23120f).fillRect(0, 470, 1280, 250).fillStyle(0x3b2418).fillRect(0, 470, 1280, 10);
  const road = add(scene.add.graphics());
  for (let tile = 0; tile < 2; tile++) for (let x = 0; x < 1280; x += 160) road.fillStyle(0xe3a92b, 0.7).fillRect(tile * 1280 + x, 478, 80, 6);
  return [{ g: far, ms: 60000 }, { g: mid, ms: 30000 }, { g: near, ms: 14000 }, { g: road, ms: 3200 }];
}

export default function showStoryCard(scene, onDone, { reduceMotion = (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) } = {}) {
  const kb = scene.input.keyboard;
  const base = [];
  const addBase = (o) => { o.setDepth(DEPTH).setScrollFactor?.(0); base.push(o); return o; };
  const bg = addBase(scene.add.rectangle(640, 360, 1280, 720, COLORS.darkBrown, 1).setInteractive());
  const panel = addBase(scene.add.rectangle(640, 590, 1160, 200, 0x3a2218, 0.96).setStrokeStyle(6, 0x2e1f16));
  const nameTag = addBase(scene.add.text(110, 510, '', { fontFamily: FONTS.button, fontSize: '34px', color: CSS.mustard, stroke: CSS.darkBrown, strokeThickness: 6 }).setOrigin(0, 0.5));
  const body = addBase(scene.add.text(110, 540, '', { fontFamily: FONTS.body, fontSize: '26px', color: CSS.cream, wordWrap: { width: 1060 }, lineSpacing: 6 }));
  const prompt = addBase(scene.add.text(1170, 676, '', { fontFamily: FONTS.body, fontSize: '20px', color: '#F2D9A0' }).setOrigin(1, 0.5));
  const title = addBase(scene.add.text(640, 40, '', { fontFamily: FONTS.button, fontSize: '40px', color: CSS.mustard, stroke: CSS.darkBrown, strokeThickness: 8 }).setOrigin(0.5));
  if (title.setLetterSpacing) title.setLetterSpacing(6);
  // depth order: scene art sits between the backdrop and the text panel
  bg.setDepth(DEPTH); [panel, nameTag, body, prompt, title].forEach((o) => o.setDepth(DEPTH + 10));

  let si = -1, bi = 0, sceneObjs = [], spriteTimer = null, beatTimer = null, done = false;
  const t0 = scene.time.now;
  let last = t0;

  const clearScene = () => {
    if (spriteTimer) { spriteTimer.remove(false); spriteTimer = null; }
    scene.tweens.killTweensOf(sceneObjs);
    sceneObjs.forEach((o) => o.destroy()); sceneObjs = [];
  };
  const addScene = (o) => { o.setDepth(DEPTH + 1).setScrollFactor?.(0); sceneObjs.push(o); return o; };

  function startScene(i) {
    clearScene();
    si = i; bi = 0;
    const sc = STORY_SCENES[i];
    if (sc.bg === 'home') drawHome(addScene(scene.add.graphics()));
    else if (sc.bg === 'alley') drawAlley(addScene(scene.add.graphics()));
    else {
      for (const { g: layer, ms } of drawCity(scene, addScene)) {
        if (!reduceMotion) scene.tweens.add({ targets: layer, x: -1280, duration: ms, repeat: -1 });
      }
    }
    title.setText(sc.title);
    // Fade the new backdrop in over the previous one.
    sceneObjs.forEach((o) => o.setAlpha(0));
    scene.tweens.add({ targets: sceneObjs.slice(), alpha: 1, duration: reduceMotion ? 1 : 260 });
    // Sprite: appears once its frames are loaded (usually already, because it loads while the card above is read).
    const a = sc.art;
    const place = () => {
      if (!a || !a.frames.every((f) => scene.textures.exists(f.key))) return false;
      for (const f of a.frames) scene.textures.get(f.key).setFilter?.(1); // NEAREST: crisp pixel art
      const animKey = `${a.key}.loop`;
      if (!scene.anims.exists(animKey)) scene.anims.create({ key: animKey, frames: a.frames.map((f) => ({ key: f.key })), frameRate: a.fps, repeat: -1 });
      const spr = addScene(scene.add.sprite(a.x, a.y, a.frames[0].key).setOrigin(0.5, 1).setScale(a.scale).setAlpha(0));
      spr.play(animKey);
      if (sc.bg === 'city' && !reduceMotion) scene.tweens.add({ targets: spr, y: a.y - 6, duration: 160, yoyo: true, repeat: -1 }); // run bounce
      scene.tweens.add({ targets: spr, alpha: 1, duration: reduceMotion ? 1 : 220 });
      return true;
    };
    if (!place() && a) spriteTimer = scene.time.addEvent({ delay: 80, loop: true, callback: () => { if (place()) { spriteTimer.remove(false); spriteTimer = null; } } });
    showBeat();
  }

  function showBeat() {
    const sc = STORY_SCENES[si], b = sc.beats[bi];
    nameTag.setText(b.name || '');
    body.setY(b.name ? 540 : 520).setText(b.text);
    const lastBeat = si === STORY_SCENES.length - 1 && bi === sc.beats.length - 1;
    prompt.setText(lastBeat ? 'Enter / click to start' : `${STORY.prompt}   ·   ${STORY.skipHint}`);
    if (beatTimer) beatTimer.remove(false);
    beatTimer = scene.time.delayedCall(STORY.autoMs, advance);
  }

  function advance() {
    if (done) return;
    const sc = STORY_SCENES[si];
    if (bi < sc.beats.length - 1) { bi++; showBeat(); return; }
    if (si < STORY_SCENES.length - 1) { startScene(si + 1); return; }
    finish();
  }
  function input() {
    const now = scene.time.now;
    if (done || now - t0 < 300 || now - last < 120) return; // ignore the Enter that opened the card, and key repeat
    last = now; advance();
  }
  function skip() { if (!done && scene.time.now - t0 >= 300) finish(); }
  function finish() {
    if (done) return; done = true;
    kb.off('keydown-ENTER', input); kb.off('keydown-SPACE', input); kb.off('keydown-ESC', skip);
    scene.events.off('shutdown', abort);
    if (beatTimer) beatTimer.remove(false);
    clearScene();
    base.forEach((o) => o.destroy());
    onDone();
  }
  function abort() { // scene shut down under us: clean up without starting the arena
    if (done) return; done = true;
    if (beatTimer) beatTimer.remove(false);
    clearScene(); base.forEach((o) => o.destroy());
  }

  kb.on('keydown-ENTER', input); kb.on('keydown-SPACE', input); kb.on('keydown-ESC', skip);
  bg.on('pointerdown', input);
  scene.events.once('shutdown', abort);
  startScene(0);
}
