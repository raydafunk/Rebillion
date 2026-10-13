// Title screen shown first. Spec: GameDesignDocument/The Title Screen.docx; mock: PDf/the-rebellion-title-screen.png.
// Copy: content/dialogue/title-screen.json (loaded as TITLE_COPY, with built-in fallbacks).
// Flow: any key / click / gamepad button -> short loading bar -> MenuScene.
import { MENU_COLORS as C, MENU_CSS as CC, MENU_FONTS as MF, FONTS, TITLE_COPY, TITLE_TIMING } from '../config/assetKeys.js';

const W = 1280, H = 720;
const DEG = Math.PI / 180;
const INK = '#120a07', BROWN = '#3a2418', RED = '#a8402e', CREAM = '#f4e6c8';
const PILL = { x: 267, y: 640, w: 746, h: 58 };
const FALLBACK = {
  'title-banner': ['THE REBELLION', 'FISTS OF THE FALLEN CITY', 'THE REBELLION: Fists of the Fallen City'],
  'title-tagline': ['Brawl through the blocks. Take the city back.', 'Brawl through the blocks.', 'Take the city back.'],
  'title-press-prompt': ['PRESS ANY BUTTON', 'CH. 01', '(c) 2026'],
  'title-loading-bar': ['Loading the Fallen City...', 'Pasting up the posters...', 'Opening the windows...', 'Turning the music up...', 'Lights on. Almost there.'],
  'title-wall-writing': ['HOLD THE LINE', "Nobody's coming. Be somebody.", 'Rebels', 'Sector 7 →', 'we were here'],
  'title-stamp-extras': ['RISE', 'BLOCK CREW'],
};

export default class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  preload() {
    this.load.on('loaderror', (f) => console.warn('[TitleScene] copy failed, using fallback:', f.key));
    this.load.json(TITLE_COPY.key, TITLE_COPY.path);
  }

  create() {
    this.loading = false;
    this.padPrev = false;
    this.copy = this.readCopy();
    document.title = this.copy('title-banner', 2);
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.buildSky();
    this.buildSkyline();
    this.buildSidePosters();
    this.buildPoster();
    this.buildTape();
    this.buildPrompt();
    this.bindInput();
  }

  readCopy() {
    const data = this.cache.json.get(TITLE_COPY.key);
    const byId = {};
    if (Array.isArray(data)) for (const e of data) byId[e.id] = e.lines;
    return (id, i) => (byId[id] && byId[id][i]) || FALLBACK[id][i];
  }

  txt(x, y, s, size, color, font, extra = {}) {
    const { originX = 0.5, originY = 0.5, ...style } = extra;
    const t = this.add.text(x, y, s, { fontFamily: font, fontSize: size + 'px', color, ...style });
    if (style.letterSpacing) t.setLetterSpacing(style.letterSpacing);
    return t.setOrigin(originX, originY);
  }

  // ---------- sky, searchlights, skyline ----------
  buildSky() {
    const g = this.add.graphics().setDepth(0);
    const top = Phaser.Display.Color.ValueToColor(0x1d0f0b), bot = Phaser.Display.Color.ValueToColor(0xb5522f);
    for (let y = 0; y < H; y += 6) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bot, H, y);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1).fillRect(0, y, W, 6);
    }
    this.add.circle(1060, 250, 78, 0xe9c77a).setDepth(0);
    // searchlights sweep
    [900, 1010, 1130].forEach((x, i) => {
      const b = this.add.graphics({ x, y: 0 }).setDepth(0).setAlpha(0.13);
      b.fillStyle(0xf4e6c8, 1).fillTriangle(-30, 0, 30, 0, 0, 430).fillTriangle(0, 0, -34, 0, -150, 430).fillTriangle(0, 0, 34, 0, 150, 430);
      this.tweens.add({ targets: b, angle: { from: -4, to: 4 }, duration: 3200 + i * 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
    // drifting smoke
    for (let i = 0; i < 4; i++) {
      const s = this.add.ellipse(780 + i * 150, 330 - i * 12, 160, 46, 0x2a1a14, 0.35).setDepth(0);
      this.tweens.add({ targets: s, x: s.x + 60, alpha: 0.12, duration: 5000 + i * 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  buildSkyline() {
    const g = this.add.graphics().setDepth(1);
    const blocks = [[0, 480, 62], [830, 460, 120], [950, 400, 90], [1040, 470, 110], [1150, 360, 80], [1230, 440, 60], [880, 520, 200], [1080, 500, 200]];
    for (const [x, y, w] of blocks) {
      g.fillStyle(0x2b1a12, 1).fillRect(x, y, w, 620 - y);
      g.fillStyle(0xe1a92b, 0.45);
      for (let wy = y + 14; wy < 600; wy += 20) for (let wx = x + 8; wx < x + w - 6; wx += 16) if ((wx * 7 + wy * 3) % 5 < 2) g.fillRect(wx, wy, 5, 7);
    }
    // toppled tower: a slanted slab leaning on its neighbours
    g.fillStyle(0x1d120d, 1).fillPoints([{ x: 1150, y: 360 }, { x: 1196, y: 330 }, { x: 1270, y: 470 }, { x: 1232, y: 495 }], true);
  }

  // ---------- poster stack ----------
  buildSidePosters() {
    // HOLD THE LINE sheet (forest green, partly under the main poster)
    const hold = this.add.container(915, 280).setDepth(2).setAngle(2.5);
    const sheet = this.add.graphics();
    sheet.fillStyle(0x000000, 0.35).fillRect(-98, -168, 216, 350);
    sheet.fillStyle(C.forest, 1).fillRect(-105, -175, 216, 350);
    sheet.fillStyle(0xe8dcc0, 0.22);
    for (let y = -168; y < 170; y += 12) for (let x = -98; x < 105; x += 12) sheet.fillRect(x, y, 2, 2);
    hold.add(sheet);
    this.copy('title-wall-writing', 0).split(' ').forEach((w, i) =>
      hold.add(this.txt(-20, -118 + i * 82, w, 92, i === 1 ? CC.mustard : CC.cream, FONTS.button)));
    hold.add(this.txt(-55, 150, this.copy('title-stamp-extras', 1), 14, CC.cream, MF.mono, { fontStyle: 'bold' }));

    // cream note
    const note = this.add.container(1092, 368).setDepth(3).setAngle(-1);
    const n = this.add.graphics();
    n.fillStyle(0x000000, 0.3).fillRect(-122, -82, 245, 180);
    n.fillStyle(0xe8d9b4, 1).fillRect(-125, -88, 245, 180);
    note.add(n);
    const [a, b] = this.copy('title-wall-writing', 1).split('. ');
    note.add(this.txt(-112, -50, a + '.', 23, RED, FONTS.display, { originX: 0 }).setAngle(-5));
    note.add(this.txt(-112, -10, b, 23, RED, FONTS.display, { originX: 0 }).setAngle(-5));

    // spray tag, stencil sign, scrawl
    this.txt(1100, 540, this.copy('title-wall-writing', 2), 78, CC.mustard, FONTS.display).setAngle(-8).setDepth(3);
    this.txt(1130, 603, this.copy('title-wall-writing', 3), 28, '#6e625a', FONTS.button, { letterSpacing: 3 }).setDepth(3);
    this.txt(1128, 85, this.copy('title-wall-writing', 4), 28, CREAM, FONTS.display).setAngle(4).setDepth(3);
  }

  // THE REBELLION banner: letters slam in one by one (screen shake on the last), then a wave + light glint repeat
  animateBanner(str, d) {
    const X = 80, Y = 108, style = { fontFamily: FONTS.button, fontSize: '92px', color: CREAM };
    const probe = this.add.text(0, 0, '', style).setLetterSpacing(2).setVisible(false);
    const letters = [];
    [...str].forEach((ch, i) => {
      probe.setText(str.slice(0, i));
      const x = X + (i ? probe.width : 0);
      if (ch === ' ') return;
      const t = this.add.text(x, Y - 70, ch, style).setLetterSpacing(2).setOrigin(0, 0.5).setDepth(d).setAlpha(0).setScale(1.7).setAngle(Phaser.Math.Between(-14, 14));
      letters.push({ t, x, i });
    });
    probe.destroy();

    const total = letters.length;
    letters.forEach(({ t }, n) => {
      this.tweens.add({
        targets: t, y: Y, alpha: 1, scale: 1, angle: 0, duration: 380, delay: 450 + n * 75, ease: 'Back.easeOut',
        onComplete: () => { if (n === total - 1) this.bannerLanded(letters, d); },
      });
    });
  }

  bannerLanded(letters, d) {
    this.cameras.main.shake(160, 0.005);
    // repeating wave across the letters
    this.time.addEvent({
      delay: 3600, loop: true, startAt: 2400,
      callback: () => letters.forEach(({ t }, n) =>
        this.tweens.add({ targets: t, y: t.y - 9, scaleY: 1.08, duration: 160, delay: n * 55, yoyo: true, ease: 'Sine.easeOut' })),
    });
    // glint sweeping across the red banner, clipped to it
    const clip = this.make.graphics({ x: 0, y: 0, add: false }).fillRect(46, 62, 654, 96);
    const glint = this.add.rectangle(20, 110, 46, 140, 0xf4e6c8, 0.38).setAngle(18).setDepth(d + 1);
    glint.setMask(clip.createGeometryMask());
    this.time.addEvent({
      delay: 3600, loop: true, startAt: 1800,
      callback: () => { glint.x = 20; this.tweens.add({ targets: glint, x: 740, duration: 700, ease: 'Sine.easeInOut' }); },
    });
  }

  buildPoster() {
    const d = 4;
    const g = this.add.graphics().setDepth(d);
    // shadow + mustard sheet with torn edge
    const sheet = [{ x: 50, y: 152 }, { x: 300, y: 149 }, { x: 560, y: 153 }, { x: 823, y: 146 }, { x: 826, y: 380 }, { x: 819, y: 600 }, { x: 560, y: 606 }, { x: 62, y: 612 }, { x: 56, y: 380 }];
    g.fillStyle(0x000000, 0.35).fillPoints(sheet.map((p) => ({ x: p.x + 8, y: p.y + 8 })), true);
    g.fillStyle(0xe3a92b, 1).fillPoints(sheet, true);
    g.fillStyle(0xb98a22, 0.5);
    for (let y = 166; y < 600; y += 14) for (let x = 64; x < 815; x += 14) g.fillCircle(x + ((y / 14) % 2) * 7, y, 1.5);

    // red stencil banner
    g.fillStyle(0x000000, 0.35).fillRect(51, 65, 660, 108);
    g.fillStyle(0xa8402e, 1).fillPoints([{ x: 43, y: 62 }, { x: 330, y: 56 }, { x: 700, y: 60 }, { x: 700, y: 158 }, { x: 330, y: 160 }, { x: 46, y: 158 }], true);
    g.fillStyle(0x120a07, 1).fillRect(46, 154, 654, 5);
    this.animateBanner(this.copy('title-banner', 0), d);

    // stacked title: FISTS OF THE / FALLEN / CITY (line break after OF THE, CITY kept with the name)
    const [l1, l2] = this.copy('title-banner', 1).split(' FALLEN ');
    this.txt(92, 222, l1, 84, INK, FONTS.button, { originX: 0, letterSpacing: 2 }).setDepth(d).setScale(1.3, 1);
    this.txt(90, 330, 'FALLEN', 125, BROWN, FONTS.button, { originX: 0 }).setDepth(d).setScale(1.75, 1);
    this.txt(92, 456, l2 || 'CITY', 110, RED, FONTS.button, { originX: 0, stroke: '#7a2f25', strokeThickness: 4 }).setDepth(d).setScale(2.2, 1);
    // crack through the lettering
    const crack = this.add.graphics().setDepth(d);
    crack.lineStyle(4, 0xe3a92b, 1).beginPath().moveTo(497, 200).lineTo(483, 262).lineTo(510, 290).lineTo(480, 330).lineTo(495, 360).lineTo(478, 395).strokePath();

    this.txt(104, 545, this.copy('title-tagline', 1) + '\n' + this.copy('title-tagline', 2), 17, '#4a3118', MF.mono, { originX: 0, fontStyle: 'bold', lineSpacing: 6, letterSpacing: 2 }).setDepth(d).setAngle(-1);

    // barcode
    const bc = this.add.graphics().setDepth(d).fillStyle(0x120a07, 1);
    for (let x = 617, i = 0; x < 785; i++) { const w = 2 + ((i * 7) % 4); bc.fillRect(x, 523, w, 50); x += w + 2 + ((i * 5) % 3); }

    // tape
    const tape = (x, y, w, h, a) => this.add.rectangle(x, y, w, h, 0xf4e6c8, 0.55).setAngle(a).setDepth(d + 1);
    tape(48, 112, 110, 34, -38);
    tape(272, 592, 90, 22, 0);

    // raised-fist stamp
    const st = this.add.container(775, 95).setDepth(d + 2);
    const s = this.add.graphics();
    s.fillStyle(0x000000, 0.3).fillCircle(6, 8, 97);
    s.fillStyle(C.forest, 1).fillCircle(0, 0, 97);
    s.lineStyle(7, 0xf4e6c8, 1);
    for (let a = 0; a < 360; a += 20) s.beginPath().arc(0, 0, 80, a * DEG, (a + 12) * DEG).strokePath();
    s.fillStyle(0xe8dcc0, 1).fillRoundedRect(-30, -42, 60, 48, 14).fillRoundedRect(-18, 2, 40, 28, 6).fillRect(-14, 24, 30, 16);
    s.lineStyle(3, C.forest, 1);
    for (const x of [-15, 0, 15]) s.beginPath().moveTo(x, -38).lineTo(x, -14).strokePath();
    st.add(s);
    st.add(this.txt(0, 58, this.copy('title-stamp-extras', 0), 22, CC.mustard, MF.mono, { fontStyle: 'bold', letterSpacing: 5 }));
    st.setAngle(-2);
  }

  // ---------- hazard tape + prompt ----------
  buildTape() {
    const g = this.add.graphics().setDepth(6);
    g.fillStyle(0x120a07, 1).fillRect(0, 618, W, 102);
    g.fillStyle(0xe3a92b, 1);
    for (let x = -120; x < W + 60; x += 80) g.fillPoints([{ x, y: 720 }, { x: x + 40, y: 720 }, { x: x + 40 + 102, y: 618 }, { x: x + 102, y: 618 }], true);
    g.fillStyle(0x120a07, 1).fillRect(0, 618, W, 3);
  }

  buildPrompt() {
    const { x, y, w, h } = PILL;
    const g = this.add.graphics().setDepth(7);
    g.fillStyle(0x120a07, 1).fillRect(x, y, w, h).lineStyle(3, 0xe3a92b, 1).strokeRect(x, y, w, h);
    const cy = y + h / 2;
    const small = { fontStyle: 'bold', letterSpacing: 3 };
    this.txt(x + 70, cy, this.copy('title-press-prompt', 1), 15, '#8a7a66', MF.mono, small).setDepth(8);
    this.txt(x + w - 70, cy, this.copy('title-press-prompt', 2).replace('(c)', '©'), 15, '#8a7a66', MF.mono, small).setDepth(8);
    this.prompt = this.txt(640, cy, this.copy('title-press-prompt', 0), 30, CC.mustard, MF.mono, { fontStyle: 'bold', letterSpacing: 10 }).setDepth(8);
    this.blinkT = 0;

    // loading UI (hidden until input)
    this.loadText = this.txt(640, y + 20, '', 20, CC.cream, MF.mono, { fontStyle: 'bold' }).setDepth(8).setVisible(false);
    this.barBack = this.add.rectangle(640, y + 43, 480, 8, 0x3a2418).setDepth(8).setVisible(false);
    this.bar = this.add.rectangle(400, y + 43, 480, 8, 0xe3a92b).setOrigin(0, 0.5).setScale(0, 1).setDepth(9).setVisible(false);
  }

  // ---------- input / flow ----------
  bindInput() {
    this.input.keyboard.on('keydown', () => this.begin());
    this.input.on('pointerdown', () => this.begin());
    if (this.input.gamepad) this.input.gamepad.on('down', () => this.begin());
  }

  update(_t, dt) {
    if (!this.loading) {
      const { blinkOnMs: on, blinkOffMs: off } = TITLE_TIMING;
      this.blinkT = (this.blinkT + dt) % (on + off);
      this.prompt.setVisible(this.blinkT < on);
    }
    // gamepad poll as a fallback to the plugin 'down' event
    const pads = this.input.gamepad ? this.input.gamepad.gamepads : [];
    const any = pads.some((p) => p && p.buttons.some((b) => b.pressed));
    if (any && !this.padPrev) this.begin();
    this.padPrev = any;
  }

  begin() {
    if (this.loading) return;
    this.loading = true;
    this.prompt.setVisible(false);
    this.barBack.setVisible(true);
    this.bar.setVisible(true);
    this.loadText.setVisible(true);
    const lines = Array.from({ length: 5 }, (_, i) => this.copy('title-loading-bar', i));
    let shown = -1;
    this.tweens.addCounter({
      from: 0, to: 1, duration: TITLE_TIMING.loadMs,
      onUpdate: (tw) => {
        const v = tw.getValue();
        this.bar.setScale(v, 1);
        const i = Math.min(lines.length - 1, Math.floor(v * lines.length));
        if (i !== shown) { shown = i; this.loadText.setText(lines[i]); }
      },
      onComplete: () => this.cameras.main.fadeOut(200, 0, 0, 0),
    });
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
  }
}
