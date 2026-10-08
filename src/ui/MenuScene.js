// Wheatpaste Wall main menu. Layout authority: design/ux/main-menu.md.
// Copy: design/lore/menu-copy.md. Assets/keys: src/config/assetKeys.js (MENU_*).
// Flat shapes only. Every asset has a drawn fallback if its file fails to load.
import { COLORS, CSS, FONTS, MENU_ASSETS, MENU_COLORS as C, MENU_CSS as CC, MENU_FONTS as MF } from '../config/assetKeys.js';

const W = 1280, H = 720;
const STRIP_W = 360, STRIP_H = 64, STRIP_CX = 396, SEL_DX = 10, TWEEN_MS = 100;
const DEG = Math.PI / 180;
const FOOTER = 'W/S select / Enter confirm'; // exact wording from the user; do not reword
const TOAST_MS = 2000;

// colours: idle / selected (brightest) variant, text colour per strip
const ITEMS = [
  { id: 'fight', label: 'FIGHT', y: 270, tilt: -2, art: 'menu.strip.a', idle: 0xb98a22, sel: 0xf5c640, text: CC.nearBlack },
  { id: 'controls', label: 'CONTROLS', y: 352, tilt: 1.5, art: 'menu.strip.b', idle: 0xbdb292, sel: 0xf6eed8, text: CC.nearBlack },
  { id: 'options', label: 'OPTIONS', y: 434, tilt: -1, art: 'menu.strip.c', idle: C.forest, sel: 0x4b8f5c, text: CC.cream },
  { id: 'quit', label: 'QUIT', y: 516, tilt: 2, art: 'menu.strip.b', idle: C.brown, sel: 0x95683f, text: CC.cream },
];

const BINDINGS = [
  ['Move', 'TBD'], ['Light attack', 'TBD'], ['Heavy attack', 'TBD'], ['Block', 'TBD'],
  ['Dodge', 'TBD'], ['Parry / pick-up', 'TBD'], ['Pause', 'TBD'],
];

export default class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  preload() {
    this.load.on('loaderror', (f) => console.warn('[MenuScene] asset failed, using fallback:', f.key));
    for (const [key, a] of Object.entries(MENU_ASSETS)) this.load.svg(key, a.path, { width: a.w, height: a.h });
  }

  create() {
    this.started = false;
    this.panelOpen = false;
    this.toast = null;
    this.focus = 0;
    this.padCool = 0;
    this.padPrev = { a: false, b: false };
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.buildBackground();
    this.buildPosters();
    this.buildTitle();
    this.items = ITEMS.map((cfg, i) => this.buildStrip(cfg, i));
    this.applyFocus(true);
    this.buildFooter();
    this.buildPanel();
    this.bindInput();
  }

  has(key) { return this.textures.exists(key); }

  // ---------- background ----------
  buildBackground() {
    const rect = (x, y, w, h, c, d) => this.add.rectangle(x, y, w, h, c).setOrigin(0).setDepth(d);
    if (this.has('menu.sky')) this.add.image(0, 0, 'menu.sky').setOrigin(0).setDepth(0);
    else { rect(0, 0, W, H, 0xd07a2c, 0); rect(0, 0, W, 240, 0xb5522f, 0); this.add.circle(960, 500, 70, C.cream).setDepth(0); }

    if (this.has('menu.buildings.far')) this.add.image(0, 0, 'menu.buildings.far').setOrigin(0).setDepth(1);
    else for (let i = 0; i < 6; i++) rect(640 + i * 110, 300 - (i % 3) * 50, 100, 240 + (i % 3) * 50, 0x5b3a2e, 1);

    if (this.has('menu.buildings.near')) this.add.image(0, 0, 'menu.buildings.near').setOrigin(0).setDepth(1);
    else for (let i = 0; i < 4; i++) rect(660 + i * 150, 250 + (i % 2) * 60, 140, 270 - (i % 2) * 60, 0x2b2420, 1);

    if (this.has('menu.street')) this.add.image(0, 360, 'menu.street').setOrigin(0).setDepth(1);
    else {
      rect(0, 520, W, 200, 0x2a2420, 1);
      for (let x = 660; x < W; x += 120) rect(x, 610, 60, 8, C.mustard, 1);
    }

    if (this.has('menu.wall')) this.add.image(0, 0, 'menu.wall').setOrigin(0).setDepth(2);
    else {
      rect(0, 0, 640, H, C.brick, 2);
      for (let y = 0; y < 640; y += 32) rect(0, y, 640, 2, C.brickDark, 2);
      rect(0, 640, 640, 80, C.nearBlack, 2);
    }
  }

  // ---------- posters (live text over art) ----------
  buildPosters() {
    const mk = (x, y, scale, angle, key, fallbackColor, draw) => {
      const c = this.add.container(x, y).setDepth(3).setScale(scale).setAngle(angle);
      if (this.has(key)) c.add(this.add.image(0, 0, key));
      else c.add(this.add.rectangle(0, 0, 300, 420, fallbackColor));
      const g = this.add.graphics();
      c.add(g);
      const R = (rx, ry, rw, rh, col) => g.fillStyle(col, 1).fillRect(rx - 150, ry - 210, rw, rh);
      const T = (tx, ty, str, style) => c.add(this.add.text(tx - 150, ty - 210, str, style).setOrigin(0.5));
      draw(R, T, g);
      return c;
    };
    const disp = { fontFamily: MF.display, color: CC.cream };
    const mono = { fontFamily: MF.mono, fontStyle: '700', fontSize: '18px', align: 'center', wordWrap: { width: 200 } };

    // Poster A: cream, forest text (160 px wide)
    mk(112, 300, 160 / 300, -3, 'menu.poster.heroes', C.cream, (R, T) => {
      R(36, 100, 228, 90, C.forest);
      T(150, 126, 'LOCAL HEROES', { ...disp, fontSize: '34px' });
      T(150, 164, 'BENEFIT', { ...disp, fontSize: '34px' });
      R(40, 200, 220, 92, C.cream);
      T(150, 246, 'Corner shop open late. Come by.', { ...mono, color: CC.forest });
      R(36, 300, 228, 38, C.mustard);
      T(150, 319, 'Keep the Lights On', { fontFamily: MF.display, fontSize: '26px', color: CC.forest });
    });

    // Poster B: brick red, Rust notice, CURFEW struck through
    mk(112, 540, 0.476, 2, 'menu.poster.curfew', C.brick, (R, T, g) => {
      R(30, 96, 250, 100, C.brick);
      R(40, 100, 220, 70, C.nearBlack);
      T(150, 117, 'RUST NOTICE 114', { ...disp, fontSize: '28px' });
      R(52, 134, 196, 30, C.cream);
      T(150, 149, 'CURFEW', { fontFamily: MF.display, fontSize: '26px', color: CC.nearBlack });
      g.fillStyle(C.mustard, 1).fillPoints([
        { x: 44 - 150, y: 152 - 210 }, { x: 254 - 150, y: 126 - 210 }, { x: 256 - 150, y: 138 - 210 }, { x: 46 - 150, y: 164 - 210 },
      ], true);
      R(40, 214, 220, 96, C.brick);
      T(150, 262, 'By order of the Rust. Lights out at nine.', { ...mono, color: CC.cream });
    });
  }

  // ---------- title ----------
  buildTitle() {
    const c = this.add.container(STRIP_CX, 110).setDepth(5).setAngle(-2);
    if (this.has('menu.strip.a')) c.add(this.add.image(0, 0, 'menu.strip.a').setDisplaySize(440, 84).setTint(C.nearBlack));
    else c.add(this.add.rectangle(0, 0, 440, 84, C.nearBlack));
    c.add(this.add.text(0, 2, 'THE REBELLION', { fontFamily: MF.display, fontSize: '66px', color: CC.cream }).setOrigin(0.5));

    const sub = this.add.text(STRIP_CX, 176, 'Fists of the Fallen City', {
      fontFamily: MF.mono, fontStyle: '700', fontSize: '24px', color: CC.mustard,
    }).setOrigin(0.5).setDepth(5);
    if (sub.width > 440) sub.setScale(440 / sub.width);
  }

  // ---------- strips ----------
  buildStrip(cfg, i) {
    const c = this.add.container(STRIP_CX, cfg.y).setDepth(4).setAngle(cfg.tilt);
    let art;
    if (this.has(cfg.art)) { art = this.add.image(0, 0, cfg.art).setDisplaySize(STRIP_W, STRIP_H); art.paint = (col) => art.setTint(col); }
    else { art = this.add.rectangle(0, 0, STRIP_W, STRIP_H, cfg.idle); art.paint = (col) => art.setFillStyle(col); }
    art.paint(cfg.idle);
    const label = this.add.text(-STRIP_W / 2 + 56, 0, cfg.label, { fontFamily: MF.display, fontSize: '38px', color: cfg.text }).setOrigin(0, 0.5);
    const marker = this.add.text(-STRIP_W / 2 + 24, 0, '>', { fontFamily: MF.display, fontSize: '38px', color: cfg.text }).setOrigin(0.5).setAlpha(0);
    c.add([art, label, marker]);

    // Hit area is fixed (untilted 360x64 + 10 px right) so the moving strip does not flicker hover.
    const zone = this.add.zone(STRIP_CX + SEL_DX / 2, cfg.y, STRIP_W + SEL_DX, STRIP_H).setDepth(6).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => { if (this.blocked()) return; this.hideToast(); this.select(i); });
    zone.on('pointerdown', () => { if (this.blocked()) return; this.select(i); this.confirm(); });
    return { cfg, c, art, marker };
  }

  applyFocus(instant) {
    this.items.forEach((it, i) => {
      const sel = i === this.focus;
      it.art.paint(sel ? it.cfg.sel : it.cfg.idle);
      const target = { x: STRIP_CX + (sel ? SEL_DX : 0), rotation: (sel ? 0 : it.cfg.tilt) * DEG };
      this.tweens.killTweensOf(it.c);
      this.tweens.killTweensOf(it.marker);
      if (instant) { it.c.setPosition(target.x, it.cfg.y).setRotation(target.rotation); it.marker.setAlpha(sel ? 1 : 0); }
      else {
        this.tweens.add({ targets: it.c, ...target, duration: TWEEN_MS, ease: 'Quad.easeOut' });
        this.tweens.add({ targets: it.marker, alpha: sel ? 1 : 0, duration: TWEEN_MS, ease: 'Quad.easeOut' });
      }
    });
  }

  select(i) {
    if (i === this.focus) return;
    this.focus = i;
    this.applyFocus(false);
  }

  move(d) {
    if (this.blocked()) return;
    this.hideToast();
    this.select((this.focus + d + this.items.length) % this.items.length); // wraps
  }

  // ---------- footer ----------
  buildFooter() {
    this.add.text(1248, 688, FOOTER, { fontFamily: MF.mono, fontSize: '20px', color: CC.cream }).setOrigin(1, 1).setDepth(5);
  }

  // ---------- toast ----------
  showToast(msg) {
    this.hideToast();
    const c = this.add.container(STRIP_CX, 596).setDepth(8);
    const bg = this.has('menu.strip.a')
      ? this.add.image(0, 0, 'menu.strip.a').setDisplaySize(480, 56).setTint(C.nearBlack)
      : this.add.rectangle(0, 0, 480, 56, C.nearBlack);
    const t = this.add.text(0, 0, msg, { fontFamily: MF.display, fontSize: '24px', color: CC.cream }).setOrigin(0.5);
    while (t.width > 440 && parseInt(t.style.fontSize, 10) > 14) t.setFontSize(parseInt(t.style.fontSize, 10) - 1);
    c.add([bg, t]);
    this.toast = c;
    this.toastTimer = this.time.delayedCall(TOAST_MS, () => this.hideToast());
  }

  hideToast() {
    if (this.toastTimer) { this.toastTimer.remove(false); this.toastTimer = null; }
    if (this.toast) { this.toast.destroy(); this.toast = null; }
  }

  // ---------- controls panel ----------
  buildPanel() {
    const p = this.panel = this.add.container(0, 0).setDepth(10).setVisible(false).setAlpha(0);
    const dim = this.add.rectangle(0, 0, W, H, C.nearBlack, 0.6).setOrigin(0).setInteractive();
    dim.on('pointerdown', () => this.closePanel());
    const bg = this.has('menu.strip.a')
      ? this.add.image(640, 360, 'menu.strip.a').setDisplaySize(720, 420).setTint(C.cream)
      : this.add.rectangle(640, 360, 720, 420, C.cream);
    const blocker = this.add.zone(640, 360, 720, 420).setInteractive(); // clicks inside the panel do not close it
    p.add([dim, bg, blocker]);
    p.add(this.add.text(640, 190, 'CONTROLS', { fontFamily: MF.display, fontSize: '40px', color: CC.nearBlack }).setOrigin(0.5, 0));
    BINDINGS.forEach(([act, key], i) => {
      const y = 252 + i * 34;
      p.add(this.add.text(300, y, act, { fontFamily: MF.mono, fontStyle: '700', fontSize: '24px', color: CC.nearBlack }));
      p.add(this.add.text(700, y, key, { fontFamily: MF.mono, fontSize: '24px', color: CC.brick }));
    });
    p.add(this.add.text(960, 520, 'Esc / B close', { fontFamily: MF.mono, fontSize: '20px', color: CC.brown }).setOrigin(1, 1));
  }

  openPanel() {
    this.panelOpen = true;
    this.panel.setVisible(true);
    this.tweens.add({ targets: this.panel, alpha: 1, duration: 100 });
  }

  closePanel() {
    if (!this.panelOpen) return;
    this.panelOpen = false;
    this.tweens.add({ targets: this.panel, alpha: 0, duration: 100, onComplete: () => this.panel.setVisible(false) });
  }

  // ---------- input ----------
  blocked() { return this.started || this.panelOpen; }

  bindInput() {
    const kb = this.input.keyboard;
    // Fire on press only; held-key repeats ignored (flow.md).
    const on = (keys, fn) => keys.forEach((k) => kb.on('keydown-' + k, (e) => { if (!e.repeat) fn(); }));
    on(['UP', 'W'], () => this.move(-1));
    on(['DOWN', 'S'], () => this.move(1));
    on(['ENTER', 'SPACE'], () => this.confirm());
    on(['ESC', 'BACKSPACE'], () => this.closePanel());
    this.events.once('shutdown', () => kb.removeAllListeners());
  }

  update(time) {
    // Minimal gamepad: d-pad / stick up-down, A confirm, B back.
    const pad = this.input.gamepad && this.input.gamepad.total ? this.input.gamepad.getPad(0) : null;
    if (!pad) return;
    const a = pad.buttons[0] && pad.buttons[0].pressed;
    const b = pad.buttons[1] && pad.buttons[1].pressed;
    if (a && !this.padPrev.a) this.confirm();
    if (b && !this.padPrev.b) this.closePanel();
    this.padPrev = { a, b };
    const dir = (pad.up || pad.axes[1]?.getValue() < -0.5) ? -1 : (pad.down || pad.axes[1]?.getValue() > 0.5) ? 1 : 0;
    if (!dir) { this.padCool = 0; return; }
    if (time >= this.padCool) { this.move(dir); this.padCool = time + (this.padCool === 0 ? 250 : 100); }
  }

  confirm() {
    if (this.started) return;
    if (this.panelOpen) { this.closePanel(); return; } // Confirm also closes the panel
    this.hideToast();
    switch (ITEMS[this.focus].id) {
      case 'fight': return this.startGame();
      case 'controls': return this.openPanel();
      case 'options': return this.showToast('Options: not in Tier 0');
      case 'quit': return this.showToast("Can't quit a browser game. Close the tab.");
    }
  }

  startGame() {
    this.started = true;
    console.log('[MenuScene] start-game');
    this.game.events.emit('start-game');
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.tweens.killAll();
      this.children.removeAll(true);
      this.cameras.main.setBackgroundColor(COLORS.darkBrown);
      this.cameras.main.fadeIn(150, 0, 0, 0);
      this.add.text(W / 2, H / 2, 'Level starts here', {
        fontFamily: FONTS.button, fontSize: '72px', color: CSS.cream, stroke: CSS.darkBrown, strokeThickness: 8,
      }).setOrigin(0.5);
      this.add.text(W / 2, H / 2 + 70, 'Placeholder: no gameplay scene yet. Press Esc to return to the menu.', {
        fontFamily: FONTS.body, fontSize: '24px', color: CSS.cream,
      }).setOrigin(0.5);
      this.input.keyboard.once('keydown-ESC', () => this.scene.restart());
    });
  }
}
