// Applies the Options "Text size" and "High contrast" settings to every scene. Owner: menu-ui-agent.
//
//   Text size     Large = x1.2, Extra large = x1.4. Every Phaser text made with scene.add.text is scaled from its own
//                 base size when it is created, and already-visible text is rescaled the moment Apply is pressed.
//   High contrast a contrast boost on every scene camera (WebGL post effect) plus a dark outline on text that has none.
//                 Where WebGL post effects are missing (canvas fallback) only the text outline is applied.
import { loadSettings } from './optionsData.js';

export const TEXT_SCALE = { Normal: 1, Large: 1.2, 'Extra large': 1.4 };
export const textScale = (settings) => TEXT_SCALE[settings?.textSize] ?? 1;
export const HC_STROKE = { color: '#000000', px: 4 };
export const HC_CONTRAST = 0.4;
export const HC_SATURATE = -0.15;

const walk = (list, fn) => { for (const o of list || []) { fn(o); if (o && o.list) walk(o.list, fn); } };

function styleText(t, st) {
  if (t._basePx == null) return;
  t.setFontSize(Math.round(t._basePx * textScale(st.settings)));
  if (st.settings.highContrast === true && !(t._baseStroke > 0)) t.setStroke(HC_STROKE.color, HC_STROKE.px);
  else if (t._baseStroke != null) t.setStroke(t._baseStrokeColor, t._baseStroke);
}

function syncCameras(game, st) {
  const want = st.settings.highContrast === true;
  for (const scene of game.scene.getScenes(false)) {
    for (const cam of scene.cameras?.cameras || []) {
      if (!cam.postFX) continue; // canvas renderer: no post effects
      if (want && !cam.__hcFx) {
        const fx = cam.postFX.addColorMatrix();
        fx.contrast(HC_CONTRAST); fx.saturate(HC_SATURATE, true);
        cam.__hcFx = fx;
      } else if (!want && cam.__hcFx) {
        cam.postFX.remove(cam.__hcFx); cam.__hcFx = null;
      }
    }
  }
}

/** Install once per Phaser.Game (safe to call again). `settings` optional: defaults to what is saved in localStorage. */
export function installDisplay(game, settings) {
  let st = game.__display;
  if (!st) {
    let saved = {};
    try { saved = loadSettings(globalThis.localStorage); } catch (e) { /* no storage: defaults */ }
    st = game.__display = { settings: saved };
    const F = Phaser.GameObjects.GameObjectFactory.prototype;
    const rawText = F.text;
    F.text = function text(x, y, str, style) {
      const t = rawText.call(this, x, y, str, style);
      t._basePx = parseFloat(t.style.fontSize) || 16;
      t._baseStroke = t.style.strokeThickness || 0;
      t._baseStrokeColor = t.style.stroke || '#000000';
      styleText(t, st);
      return t;
    };
    game.events.on('step', () => syncCameras(game, st));
  }
  if (settings) st.settings = settings;
  applyDisplay(game);
  return st;
}

/** Re-style text that is already on screen (call after Apply). New text picks the setting up on creation. */
export function applyDisplay(game) {
  const st = game.__display;
  if (!st) return;
  for (const scene of game.scene.getScenes(false)) {
    if (scene.sys && scene.sys.displayList) walk(scene.sys.displayList.list, (o) => { if (o._basePx != null) styleText(o, st); });
  }
  syncCameras(game, st);
}
