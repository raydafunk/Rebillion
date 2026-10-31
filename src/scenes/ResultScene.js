// ResultScene: win / lose / pause overlay over the frozen ArenaScene. Copy follows design/lore/canon.md
// (encouraging, never gloating). Reasons use contract names: 'cleared' | 'ko' | 'timeout'.
import { COLORS, CSS, FONTS } from '../config/assetKeys.js';

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default class ResultScene extends Phaser.Scene {
  constructor() { super('ResultScene'); }

  init(data) { this.data_ = data; }

  create() {
    const d = this.data_, mode = d.mode;
    this.add.rectangle(640, 360, 1280, 720, 0x000000, mode === 'pause' ? 0.6 : 0.5);
    const T = (x, y, s, size, family = FONTS.button, color = CSS.cream) =>
      this.add.text(x, y, s, { fontFamily: family, fontSize: `${size}px`, color, stroke: CSS.darkBrown, strokeThickness: size > 40 ? 8 : 4, align: 'center', wordWrap: { width: 900 } }).setOrigin(0.5);

    let items;
    if (mode === 'pause') {
      T(640, 200, 'PAUSED', 72);
      items = [['RESUME', () => this._resume()],
        ['RESTART LEVEL', () => this._confirm('Restart level?', () => this._restart())],
        ['MAIN MENU', () => this._confirm('Leave to main menu?', () => this._menu())]];
    } else {
      const win = mode === 'win';
      const last = win && d.nextLevelIndex == null;
      const head = last ? 'ALL LEVELS CLEARED' : win ? 'LEVEL CLEARED' : d.reason === 'timeout' ? "TIME'S UP" : 'KNOCKED OUT';
      const line = win ? (d.outro || 'The Rust have been pushed back.')
        : d.reason === 'timeout' ? `Time ran out with ${d.enemiesLeft} Rust still standing. Shake it off and go again.`
        : `You ran out of health on wave ${d.wavesCleared + 1} of ${d.totalWaves}. Get back up.`;
      T(640, 130, head, 76, FONTS.button, win ? CSS.mustard : CSS.cream);
      T(640, 200, line, 26, FONTS.body);
      T(640, 262, `SCORE  ${(d.score || 0).toLocaleString('en-US')}`, 52, FONTS.button, CSS.mustard);
      this.add.text(640, 60, `LEVEL ${d.levelNumber} / ${d.totalLevels}: ${(d.levelName || '').toUpperCase()}`, { fontFamily: FONTS.body, fontSize: '22px', color: CSS.cream }).setOrigin(0.5);
      const rows = [
        ['WAVES CLEARED', `${d.wavesCleared} / ${d.totalWaves}`],
        ['ENEMIES DEFEATED', `${d.defeated}`],
        ['FLAWLESS WAVES', `${d.flawlessWaves || 0}`],
        ['PARRIES (BEST STREAK)', `${d.parries || 0} (${d.bestStreak || 0})`],
        ['TIME REMAINING', mmss(d.secondsLeft)],
        ['HEALTH REMAINING', `${Math.ceil(d.hp)} / 100`],
      ];
      this.add.rectangle(640, 440, 720, 270, COLORS.darkBrown, 0.85).setStrokeStyle(4, COLORS.mustard);
      rows.forEach(([k, v], i) => {
        this.add.text(300, 330 + i * 44, k, { fontFamily: FONTS.body, fontSize: '24px', color: CSS.cream }).setOrigin(0, 0.5);
        this.add.text(980, 330 + i * 44, v, { fontFamily: FONTS.button, fontSize: '28px', color: CSS.mustard }).setOrigin(1, 0.5);
      });
      if (!win) T(640, 596, d.reason === 'timeout' ? 'Press the attack, clear faster.' : 'Try blocking or parrying when the wave swarms.', 22, FONTS.body, CSS.sand);
      const first = win ? (last ? ['PLAY AGAIN', () => this._goToLevel(0)] : ['NEXT LEVEL', () => this._goToLevel(d.nextLevelIndex)])
        : ['TRY AGAIN', () => this._restart()];
      items = [first, ['MAIN MENU', () => this._menu()]];
    }

    if (mode === 'win') this.playOutro();
    this.mode = mode;
    this.confirmUi = [];
    this.setButtons(items, mode === 'pause'
      ? { y0: 300, dy: 76, horiz: false } : { y0: 642, dy: 0, horiz: true });
    this.add.text(640, 690, 'Enter / A select   |   Up / Down move' + (mode === 'pause' ? '   |   Esc / B resume' : ''),
      { fontFamily: FONTS.body, fontSize: '18px', color: CSS.cream }).setOrigin(0.5);

    const kb = this.input.keyboard;
    const step = (d) => this._focus(this.focus + d);
    const pk = (keys, fn) => keys.forEach((k) => kb.on('keydown-' + k, (e) => { if (!e.repeat) fn(); }));
    pk(['UP', 'W'], () => step(-1)); pk(['DOWN', 'S'], () => step(1));
    pk(['LEFT', 'A'], () => step(-1)); pk(['RIGHT', 'D'], () => step(1));
    pk(['ENTER', 'SPACE'], () => this._activate(this.focus));
    if (mode === 'pause') pk(['ESC', 'P', 'BACKSPACE'], () => this._back());
    this.events.once('shutdown', () => kb.removeAllListeners());
    this.padPrev = {}; this.padCool = 0;
  }

  // Level-clear sting, then the results beat loops under the stats until the player moves on.
  playOutro() {
    const vol = (this.registry.get('options')?.musicVolume ?? 70) / 100;
    const has = (k) => this.cache.audio.exists(k);
    const loop = () => { if (!has('result.music') || !this.scene.isActive()) return; this.beat = this.sound.add('result.music', { loop: true, volume: vol * 0.8 }); this.beat.play(); };
    if (has('result.sting')) {
      this.sting = this.sound.add('result.sting', { volume: vol });
      this.sting.once('complete', loop);
      this.sting.play();
    } else loop();
    this.events.once('shutdown', () => { [this.sting, this.beat].forEach((s) => { if (s) { s.stop(); s.destroy(); } }); this.sting = this.beat = null; });
  }

  // Builds (or rebuilds) the button row/column. Used for the main set and the pause confirm sub-state.
  setButtons(items, { y0, dy, horiz, w = 300, gap = 320 }) {
    (this.btnObjs || []).forEach((o) => o.destroy());
    this.btnObjs = [];
    this.buttons = items.map(([label, fn], i) => {
      const x = horiz ? 640 - (items.length - 1) * gap / 2 + i * gap : 640, y = y0 + i * dy;
      const bg = this.add.rectangle(x, y, w, 60, COLORS.mustard).setStrokeStyle(4, COLORS.darkBrown).setInteractive({ useHandCursor: true });
      const t = this.add.text(x, y, label, { fontFamily: FONTS.button, fontSize: '30px', color: CSS.darkBrown }).setOrigin(0.5);
      bg.on('pointerover', () => this._focus(i)); bg.on('pointerdown', () => { this._focus(i); this._activate(i); });
      this.btnObjs.push(bg, t);
      return { bg, t, fn };
    });
    this.focus = 0; this._focus(0);
  }

  // Pause: Restart / Main Menu need a confirm (design/ux/pause.md). Default focus is Cancel.
  _confirm(question, onYes) {
    this.confirming = true;
    this.pauseMain = this.pauseMain || this.buttons.map((b) => [b.t.text, b.fn]);
    this.btnObjs.forEach((o) => o.setVisible(false));
    this.btnObjs.forEach((o) => o.disableInteractive && o.disableInteractive());
    const oldObjs = this.btnObjs;
    this.confirmUi = [
      this.add.rectangle(640, 360, 480, 360, COLORS.darkBrown, 0.95).setStrokeStyle(4, COLORS.mustard),
      this.add.text(640, 320, question, { fontFamily: FONTS.button, fontSize: '36px', color: CSS.cream, align: 'center' }).setOrigin(0.5),
      this.add.text(640, 372, 'Progress will be lost.', { fontFamily: FONTS.body, fontSize: '22px', color: CSS.sand }).setOrigin(0.5),
    ];
    this.setButtons([['CANCEL', () => this._closeConfirm()], ['YES', onYes]], { y0: 440, dy: 0, horiz: true, w: 160, gap: 180 });
    oldObjs.forEach((o) => o.destroy());
  }

  _closeConfirm() {
    this.confirming = false;
    this.confirmUi.forEach((o) => o.destroy()); this.confirmUi = [];
    this.setButtons(this.pauseMain, { y0: 300, dy: 76, horiz: false });
  }

  _back() {
    if (this.confirming) this._closeConfirm(); else if (this.mode === 'pause') this._resume();
  }

  update(time) {
    const pad = this.input.gamepad && this.input.gamepad.total ? this.input.gamepad.getPad(0) : null;
    if (!pad) return;
    const btn = (i) => !!(pad.buttons[i] && pad.buttons[i].pressed);
    const now = { a: btn(0), b: btn(1), start: btn(9) };
    if (now.a && !this.padPrev.a) this._activate(this.focus);
    if ((now.b && !this.padPrev.b) || (this.mode === 'pause' && now.start && !this.padPrev.start)) this._back();
    this.padPrev = now;
    const ax = pad.axes[0] ? pad.axes[0].getValue() : 0, ay = pad.axes[1] ? pad.axes[1].getValue() : 0;
    const dir = (pad.up || pad.left || ay < -0.5 || ax < -0.5) ? -1 : (pad.down || pad.right || ay > 0.5 || ax > 0.5) ? 1 : 0;
    if (!dir) { this.padCool = 0; return; }
    if (time >= this.padCool) { this._focus(this.focus + dir); this.padCool = time + (this.padCool === 0 ? 250 : 150); }
  }

  _focus(i) {
    if (!this.buttons || !this.buttons.length) return;
    this.focus = (i + this.buttons.length) % this.buttons.length;
    this.buttons.forEach((b, k) => b.bg.setFillStyle(k === this.focus ? COLORS.mustardLight : COLORS.mustard).setScale(k === this.focus ? 1.06 : 1));
  }

  _activate(i) { this.buttons[i].fn(); }

  _resume() { this.scene.resume('ArenaScene'); this.scene.stop(); }

  _restart() {
    const arena = this.scene.get('ArenaScene');
    this.scene.resume('ArenaScene');
    this.scene.stop();
    arena.game.events.emit('retry', {});
  }

  // Rebuild the arena for another level (the scene's shutdown tears down HUD, this overlay and listeners).
  _goToLevel(levelIndex) {
    this.scene.get('ArenaScene').scene.restart({ levelIndex });
  }

  _menu() {
    this.scene.stop('ArenaScene'); // shutdown tears down listeners
    this.scene.start('MenuScene');
  }
}
