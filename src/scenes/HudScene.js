// HudScene: health bar, wave block, timer, wave banner. Pure event consumer (design/ux/hud.md).
import { EVENTS } from '../shared/events.js';
import { WAVES } from '../waves/waveData.js';
import { ROUND_TIME_SECONDS } from '../state/config.js';
import { COLORS, CSS, FONTS } from '../config/assetKeys.js';

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default class HudScene extends Phaser.Scene {
  constructor() { super('HudScene'); }

  create() {
    const ev = this.game.events;
    const txt = (x, y, s, size, ox = 0, family = FONTS.button) =>
      this.add.text(x, y, s, { fontFamily: family, fontSize: `${size}px`, color: CSS.cream, stroke: CSS.darkBrown, strokeThickness: 5 }).setOrigin(ox, 0);

    txt(32, 20, 'ZED', 24);
    this.hpBar = this.add.graphics();
    this.hpText = txt(400, 52, '', 20, 0, FONTS.body);
    this.waveText = txt(640, 20, '', 32, 0.5);
    this.leftText = txt(640, 60, '', 22, 0.5, FONTS.body);
    this.timerText = txt(1248, 20, mmss(ROUND_TIME_SECONDS), 40, 1);
    this.banner = this.add.text(640, 240, '', { fontFamily: FONTS.display, fontSize: '88px', color: CSS.mustard, stroke: CSS.darkBrown, strokeThickness: 10 })
      .setOrigin(0.5).setAlpha(0);
    this.hint = txt(1248, 676, 'Esc: pause', 20, 1, FONTS.body);
    this.tweens.add({ targets: this.hint, alpha: 0, delay: 5000, duration: 600 });

    this.hp = { hp: 100, maxHp: 100 };
    this.waveIndex = -1; this.killed = 0;
    this._drawHp();

    const on = (n, f) => { ev.on(n, f); this.events.once('shutdown', () => ev.off(n, f)); };
    on(EVENTS.PLAYER_HEALTH_CHANGED, (p) => { this.hp = p; this._drawHp(); });
    on(EVENTS.TIMER_TICK, ({ secondsLeft }) => {
      this.timerText.setText(mmss(secondsLeft)).setColor(secondsLeft <= 10 ? '#D13B2C' : CSS.cream);
    });
    on(EVENTS.WAVE_STARTED, ({ index, total }) => {
      this.waveIndex = index; this.killed = 0;
      this.waveText.setText(`WAVE ${index + 1} / ${total}`);
      this._left();
      this._banner(index === 0 ? 'FIGHT!' : `WAVE ${index + 1}`);
    });
    on(EVENTS.ENTITY_DIED, ({ team }) => { if (team === 'rust') { this.killed++; this._left(); } });
    on(EVENTS.RETRY, () => { this.killed = 0; });
  }

  _left() {
    const w = WAVES[this.waveIndex];
    this.leftText.setText(w ? `ENEMIES LEFT: ${Math.max(0, w.count - this.killed)}` : '');
  }

  _drawHp() {
    const { hp, maxHp } = this.hp, W = 360, H = 28, x = 32, y = 52;
    const pct = Math.max(0, hp / maxHp);
    this.hpBar.clear()
      .fillStyle(COLORS.darkBrown, 1).fillRect(x - 4, y - 4, W + 8, H + 8)
      .fillStyle(0x4a3326, 1).fillRect(x, y, W, H)
      .fillStyle(pct > 0.3 ? COLORS.mustard : 0xd13b2c, 1).fillRect(x, y, W * pct, H);
    this.hpText.setText(`${Math.ceil(hp)}/${maxHp}`).setPosition(x + W + 12, y + 2);
  }

  _banner(s) {
    this.tweens.killTweensOf(this.banner);
    this.banner.setText(s).setAlpha(1);
    this.tweens.add({ targets: this.banner, alpha: 0, delay: 1200, duration: 300 });
  }
}
