// HudScene: health bar, wave block, timer, wave banner. Pure event consumer (design/ux/hud.md).
import { EVENTS } from '../shared/events.js';
import { COLORS, CSS, FONTS } from '../config/assetKeys.js';
import RageMeterHud from '../ui/RageMeterHud.js';

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default class HudScene extends Phaser.Scene {
  constructor() { super('HudScene'); }

  init(data) { this.level = data.level; this.levelNumber = data.number; this.levelTotal = data.total; }

  create() {
    const ev = this.game.events;
    const txt = (x, y, s, size, ox = 0, family = FONTS.button) =>
      this.add.text(x, y, s, { fontFamily: family, fontSize: `${size}px`, color: CSS.cream, stroke: CSS.darkBrown, strokeThickness: 5 }).setOrigin(ox, 0);

    txt(32, 20, 'ZED', 24);
    txt(640, 100, `LEVEL ${this.levelNumber}: ${this.level.name.toUpperCase()}`, 18, 0.5, FONTS.body);
    this.hpBar = this.add.graphics();
    this.hpText = txt(400, 52, '', 20, 0, FONTS.body);
    this.waveText = txt(640, 20, '', 32, 0.5);
    this.leftText = txt(640, 60, '', 22, 0.5, FONTS.body);
    this.timerText = txt(1248, 20, mmss(this.level.timeLimitSec), 40, 1);
    this.scoreText = txt(1248, 68, 'SCORE 0', 26, 1);
    this.boostText = txt(1248, 100, '', 22, 1, FONTS.body).setVisible(false);   // rhythm: parry streak + x2 boost
    this.boostBar = this.add.graphics();
    this.banner = this.add.text(640, 240, '', { fontFamily: FONTS.display, fontSize: '88px', color: CSS.mustard, stroke: CSS.darkBrown, strokeThickness: 10 })
      .setOrigin(0.5).setAlpha(0);
    // Shown after a wave is cleared in a scrolling level: tells the player to keep moving right.
    this.go = this.add.text(1230, 360, '', { fontFamily: FONTS.button, fontSize: '56px', color: CSS.mustard, stroke: CSS.darkBrown, strokeThickness: 8, align: 'right' })
      .setOrigin(1, 0.5).setVisible(false);
    this.tweens.add({ targets: this.go, x: 1250, alpha: 0.55, yoyo: true, repeat: -1, duration: 450 });
    this.hint = txt(1248, 676, 'Esc: pause', 20, 1, FONTS.body);
    this.tweens.add({ targets: this.hint, alpha: 0, delay: 5000, duration: 600 });

    this.hp = { hp: 100, maxHp: 100 };
    this.waveIndex = -1; this.killed = 0;
    this._drawHp();
    this.rageHud = new RageMeterHud(this, this.levelNumber); // Rage meter: hidden on level 1, slides in on level 2

    const on = (n, f) => { ev.on(n, f); this.events.once('shutdown', () => ev.off(n, f)); };
    on(EVENTS.PLAYER_HEALTH_CHANGED, (p) => { this.hp = p; this._drawHp(); });
    this.shownScore = 0; this.scoreTarget = 0;
    on(EVENTS.SCORE_CHANGED, (r) => { this.scoreTarget = r.total; if (r.reason !== 'kill') this._pulse(this.scoreText); });
    on(EVENTS.TIMER_TICK, ({ secondsLeft }) => {
      this.timerText.setText(mmss(secondsLeft)).setColor(secondsLeft <= 10 ? '#D13B2C' : CSS.cream);
    });
    const goOff = () => this.go.setVisible(false);
    on(EVENTS.WAVE_CLEARED, ({ index }) => {
      if (!this.level.scrolling) return;
      const last = index + 1 >= this.level.waves.length;
      this.go.setText(last ? 'TO THE EXIT  ▶' : 'GO  ▶').setVisible(true);
      this._banner(last ? 'AREA CLEAR' : 'WAVE CLEARED');
    });
    on(EVENTS.ARENA_CLEARED, goOff);
    on(EVENTS.WAVE_STARTED, ({ index, total }) => {
      goOff();
      this.waveIndex = index; this.killed = 0;
      this.waveText.setText(`WAVE ${index + 1} / ${total}`);
      this._left();
      this._banner(index === 0 ? 'FIGHT!' : `WAVE ${index + 1}`);
    });
    on(EVENTS.ENTITY_DIED, ({ team }) => { if (team === 'rust') { this.killed++; this._left(); } });
    on(EVENTS.RETRY, () => { this.killed = 0; this.shownScore = 0; this.scoreTarget = 0; this.scoreText.setText('SCORE 0'); goOff(); });
  }

  update(time, delta) {
    this.rageHud?.update(time, delta);
    // score counts up to its target instead of jumping
    if (this.shownScore !== this.scoreTarget) {
      this.shownScore = Math.min(this.scoreTarget, this.shownScore + Math.max(10, Math.ceil((this.scoreTarget - this.shownScore) * Math.min(1, delta / 120))));
      this.scoreText.setText(`SCORE ${this.shownScore.toLocaleString('en-US')}`);
    }
    // rhythm readout: parry streak and time left on the x2 boost, read from the arena's own clock (so it stops when paused)
    const arena = this.scene.get('ArenaScene'), sc = arena && arena.score;
    const left = sc ? sc.boostLeft(arena.simNow) : 0;
    const streak = sc ? sc.streakAt(arena.simNow) : 0;
    this.boostBar.clear();
    if (left > 0) {
      this.boostText.setVisible(true).setText(`BOOST x2${streak > 1 ? `   PARRY STREAK ${streak}` : ''}`);
      const w = 200 * (left / 5000);
      this.boostBar.fillStyle(COLORS.darkBrown, 1).fillRect(1048, 128, 200, 8).fillStyle(COLORS.mustardLight, 1).fillRect(1248 - w, 128, w, 8);
    } else this.boostText.setVisible(false);
  }

  _pulse(obj) { this.tweens.killTweensOf(obj); obj.setScale(1.25); this.tweens.add({ targets: obj, scale: 1, duration: 260 }); }

  _left() {
    const w = this.level.waves[this.waveIndex];
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
