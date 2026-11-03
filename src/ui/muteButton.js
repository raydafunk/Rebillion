// The round mute button, shared by the main menu and the pause screen (art: design/art/mute-button.md).
// Switches ALL sound off and on (see audioSettings.js). Saved instantly; Options sliders are untouched. Owner: menu-ui-agent.
import { MENU_COLORS as C, MENU_CSS as CC, MENU_FONTS as MF } from '../config/assetKeys.js';
import { isMuted, onAudioChange, toggleMuted } from './audioSettings.js';

/**
 * scene: any Phaser scene. opts: { x, y, size, depth, canToggle() } -> { toggle, destroy }
 * Bind the M key in the scene yourself and call toggle() (scenes clear their key listeners on shutdown).
 */
export function createMuteButton(scene, { x = 1226, y = 52, size = 56, depth = 5, canToggle = () => true } = {}) {
  const game = scene.game;
  const has = (k) => scene.textures.exists(k);
  const img = has('menu.icon.sound-on')
    ? scene.add.image(x, y, 'menu.icon.sound-on').setDisplaySize(size, size)
    : scene.add.circle(x, y, size / 2, C.mustard).setStrokeStyle(4, C.nearBlack); // drawn fallback if the art did not load
  img.setDepth(depth).setInteractive({ useHandCursor: true });
  const label = scene.add.text(x + 40, y + 42, '', { fontFamily: MF.mono, fontStyle: '700', fontSize: '16px', color: CC.cream }).setOrigin(1, 0).setDepth(depth);
  const hint = scene.add.text(x, y + 60, 'Q', { fontFamily: MF.mono, fontSize: '14px', color: CC.cream }).setOrigin(0.5, 0).setDepth(depth).setAlpha(0.7);

  const paint = () => {
    const muted = isMuted(game);
    if (img.setTexture) {
      const k = muted ? 'menu.icon.sound-off' : 'menu.icon.sound-on';
      if (has(k)) img.setTexture(k).setDisplaySize(size, size);
    } else img.setFillStyle(muted ? C.cream : C.mustard);
    label.setText(muted ? 'SOUND OFF' : 'SOUND ON');
  };
  const toggle = () => { if (canToggle()) toggleMuted(game); };
  img.on('pointerover', () => { if (canToggle()) scene.tweens.add({ targets: img, scale: img.scale * 1.08, duration: 80 }); });
  img.on('pointerout', paint);
  img.on('pointerdown', toggle);
  const off = onAudioChange(game, paint);
  const destroy = () => { off(); [img, label, hint].forEach((o) => o.destroy()); };
  scene.events.once('shutdown', off);
  paint();
  return { toggle, destroy, img };
}
