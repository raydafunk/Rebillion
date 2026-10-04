import { ASSET_KEYS, ASSET_PATHS, COLORS, CSS, FONTS, GAME_VERSION } from '../config/assetKeys.js';

const W = 1280, H = 720;
const BTN_W = 360, BTN_H = 64; // main-menu.md (art button is 260x64, stretched)

export default class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  preload() {
    // Missing/failed files are tolerated; create() falls back to drawn shapes.
    this.load.on('loaderror', (f) => console.warn('[MenuScene] asset failed, using fallback:', f.key));
    for (const [key, path] of Object.entries(ASSET_PATHS)) {
      if (key === ASSET_KEYS.BG_ARENA) this.load.svg(key, path, { width: 1920, height: 720 });
      else this.load.svg(key, path, { width: 520, height: 128 }); // 2x native 260x64; stretched to BTN_W x BTN_H
    }
  }

  create() {
    this.started = false;
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.buildBackground();

    // Street-style title: tilted, mustard fill, dark-brown outline, hard brick-red offset shadow.
    this.add.text(W / 2, 150, 'THE REBELLION', {
      fontFamily: FONTS.display, fontSize: '96px', color: CSS.mustard, stroke: CSS.darkBrown, strokeThickness: 10,
      shadow: { offsetX: 7, offsetY: 7, color: CSS.brickRed, blur: 0, fill: true, stroke: true },
    }).setOrigin(0.5).setAngle(-2.5);
    this.add.text(W / 2, 240, 'FISTS OF THE FALLEN CITY', {
      fontFamily: FONTS.body, fontSize: '32px', fontStyle: '700', color: CSS.cream, stroke: CSS.darkBrown, strokeThickness: 6,
    }).setOrigin(0.5).setAngle(-2.5);

    // Tier 0: single item. Controls button omitted pending OQ-M1.
    this.items = [{ label: 'START GAME', y: 420, action: () => this.startGame() }];
    this.items.forEach((it, i) => this.buildButton(it, i));
    this.focus = 0;
    this.applyFocus();

    this.add.text(32, 688, 'Up/Down: Move    Enter / Space: Select    Click: Select', {
      fontFamily: FONTS.body, fontSize: '20px', color: CSS.cream, stroke: CSS.darkBrown, strokeThickness: 4,
    }).setOrigin(0, 1);
    this.add.text(1248, 688, GAME_VERSION, {
      fontFamily: FONTS.body, fontSize: '18px', color: CSS.cream, stroke: CSS.darkBrown, strokeThickness: 4,
    }).setOrigin(1, 1);

    const kb = this.input.keyboard;
    // Confirm fires on press only; ignore held-key repeats (flow.md).
    const on = (keys, fn) => keys.forEach((k) => kb.on('keydown-' + k, (e) => { if (!e.repeat) fn(); }));
    on(['UP', 'W'], () => this.moveFocus(-1));
    on(['DOWN', 'S'], () => this.moveFocus(1));
    on(['ENTER', 'SPACE'], () => this.confirm());
  }

  buildBackground() {
    if (this.textures.exists(ASSET_KEYS.BG_ARENA)) {
      this.add.image(W / 2, H / 2, ASSET_KEYS.BG_ARENA); // 1920 wide art, centre 1280 shown
    } else {
      this.add.rectangle(0, 0, W, H, COLORS.sand).setOrigin(0);
    }
    this.add.rectangle(0, 0, W, H, COLORS.darkBrown, 0.55).setOrigin(0); // dim for readability
  }

  buildButton(item, i) {
    const c = this.add.container(W / 2, item.y);
    let art, shape;
    if (this.textures.exists(ASSET_KEYS.BTN_DEFAULT)) {
      art = this.add.image(0, 0, ASSET_KEYS.BTN_DEFAULT).setDisplaySize(BTN_W, BTN_H);
      c.add(art);
    } else {
      shape = this.add.graphics();
      c.add(shape);
    }
    const txt = { fontFamily: FONTS.button, fontSize: '36px', color: CSS.darkBrown };
    const label = this.add.text(0, -2, item.label, txt).setOrigin(0.5);
    // Arrow markers so focus is not colour-only
    const arrow = { ...txt, color: CSS.cream, stroke: CSS.darkBrown, strokeThickness: 5 };
    const left = this.add.text(-BTN_W / 2 - 34, -2, '>', arrow).setOrigin(0.5);
    const right = this.add.text(BTN_W / 2 + 34, -2, '<', arrow).setOrigin(0.5);
    const ring = this.add.graphics(); // focus ring: cream, outside the outline
    ring.lineStyle(4, COLORS.cream, 1).strokeRoundedRect(-BTN_W / 2 - 6, -BTN_H / 2 - 6, BTN_W + 12, BTN_H + 12, 16);
    c.add([ring, label, left, right]);

    const zone = this.add.zone(0, 0, BTN_W, BTN_H).setInteractive({ useHandCursor: true });
    c.add(zone);
    zone.on('pointerover', () => { this.focus = i; this.applyFocus(); });
    zone.on('pointerdown', () => { item.pressed = true; this.applyFocus(); });
    zone.on('pointerout', () => { item.pressed = false; this.applyFocus(); });
    zone.on('pointerup', () => { if (item.pressed) { item.pressed = false; this.confirm(); } });
    Object.assign(item, { c, art, shape, ring, left, right, label });
  }

  drawShapeButton(it, fill, dy) {
    it.shape.clear();
    it.shape.fillStyle(0x8a5f12, 1).fillRoundedRect(-BTN_W / 2, -BTN_H / 2 + 4, BTN_W, BTN_H - 4, 12);
    it.shape.fillStyle(fill, 1).lineStyle(4, COLORS.darkBrown, 1)
      .fillRoundedRect(-BTN_W / 2, -BTN_H / 2 + dy, BTN_W, BTN_H - 8, 12)
      .strokeRoundedRect(-BTN_W / 2, -BTN_H / 2 + dy, BTN_W, BTN_H - 8, 12);
  }

  applyFocus() {
    this.items.forEach((it, i) => {
      const focused = i === this.focus;
      const key = it.pressed ? ASSET_KEYS.BTN_PRESSED : focused ? ASSET_KEYS.BTN_HOVER : ASSET_KEYS.BTN_DEFAULT;
      if (it.art) {
        if (this.textures.exists(key)) it.art.setTexture(key);
        it.art.setDisplaySize(BTN_W, BTN_H);
      } else {
        this.drawShapeButton(it, it.pressed ? COLORS.mustardPressed : focused ? COLORS.mustardLight : COLORS.mustard, it.pressed ? 4 : 0);
      }
      it.ring.setVisible(focused);
      it.left.setVisible(focused);
      it.right.setVisible(focused);
      this.tweens.killTweensOf(it.c);
      it.c.setScale(focused ? 1.05 : 1);
      if (focused) this.tweens.add({ targets: it.c, scale: 1.08, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    });
  }

  moveFocus(d) {
    if (this.started) return;
    this.focus = (this.focus + d + this.items.length) % this.items.length; // wraps
    this.applyFocus();
  }

  confirm() {
    if (this.started) return;
    this.items[this.focus].action();
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
