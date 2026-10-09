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
      items = [['RESUME', () => this._resume()], ['RESTART LEVEL', () => this._restart()], ['MAIN MENU', () => this._menu()]];
    } else {
      const win = mode === 'win';
      const head = win ? 'LEVEL CLEARED' : d.reason === 'timeout' ? "TIME'S UP" : 'KNOCKED OUT';
      const line = win ? 'The Rust have been pushed back.'
        : d.reason === 'timeout' ? `Time ran out with ${d.enemiesLeft} Rust still standing. Shake it off and go again.`
        : `You ran out of health on wave ${d.wavesCleared + 1} of ${d.totalWaves}. Get back up.`;
      T(640, 130, head, 76, FONTS.button, win ? CSS.mustard : CSS.cream);
      T(640, 200, line, 26, FONTS.body);
      const rows = [
        ['WAVES CLEARED', `${d.wavesCleared} / ${d.totalWaves}`],
        ['ENEMIES DEFEATED', `${d.defeated}`],
        ['TIME REMAINING', mmss(d.secondsLeft)],
        ['HEALTH REMAINING', `${Math.ceil(d.hp)} / 100`],
      ];
      this.add.rectangle(640, 380, 720, 240, COLORS.darkBrown, 0.85).setStrokeStyle(4, COLORS.mustard);
      rows.forEach(([k, v], i) => {
        this.add.text(300, 285 + i * 60, k, { fontFamily: FONTS.body, fontSize: '26px', color: CSS.cream }).setOrigin(0, 0.5);
        this.add.text(980, 285 + i * 60, v, { fontFamily: FONTS.button, fontSize: '32px', color: CSS.mustard }).setOrigin(1, 0.5);
      });
      if (!win) T(640, 530, d.reason === 'timeout' ? 'Press the attack, clear faster.' : 'Try blocking or dodging when the wave swarms.', 22, FONTS.body, CSS.sand);
      items = [[win ? 'PLAY AGAIN' : 'TRY AGAIN', () => this._restart()], ['MAIN MENU', () => this._menu()]];
    }

    const y0 = mode === 'pause' ? 300 : 610, dy = mode === 'pause' ? 76 : 0, dx = mode === 'pause' ? 0 : 320;
    this.buttons = items.map(([label, fn], i) => {
      const x = mode === 'pause' ? 640 : 640 - dx / 2 + i * dx, y = y0 + i * dy;
      const bg = this.add.rectangle(x, y, 300, 60, COLORS.mustard).setStrokeStyle(4, COLORS.darkBrown).setInteractive({ useHandCursor: true });
      const t = this.add.text(x, y, label, { fontFamily: FONTS.button, fontSize: '30px', color: CSS.darkBrown }).setOrigin(0.5);
      bg.on('pointerover', () => this._focus(i)); bg.on('pointerdown', () => this._activate(i));
      return { bg, t, fn };
    });
    this.focus = 0; this._focus(0);
    this.add.text(640, 690, 'Up / Down + Enter', { fontFamily: FONTS.body, fontSize: '18px', color: CSS.cream }).setOrigin(0.5);

    const kb = this.input.keyboard;
    const horiz = mode !== 'pause';
    kb.on(horiz ? 'keydown-LEFT' : 'keydown-UP', () => this._focus(this.focus - 1));
    kb.on(horiz ? 'keydown-RIGHT' : 'keydown-DOWN', () => this._focus(this.focus + 1));
    kb.on('keydown-UP', () => this._focus(this.focus - 1));
    kb.on('keydown-DOWN', () => this._focus(this.focus + 1));
    kb.on('keydown-ENTER', () => this._activate(this.focus));
    kb.on('keydown-SPACE', () => this._activate(this.focus));
    if (mode === 'pause') { kb.on('keydown-ESC', () => this._resume()); kb.on('keydown-P', () => this._resume()); }
  }

  _focus(i) {
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

  _menu() {
    this.scene.stop('ArenaScene'); // shutdown tears down listeners
    this.scene.start('MenuScene');
  }
}
