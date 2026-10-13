// Options sub-screen, drawn as an overlay owned by MenuScene (same pattern as the Controls panel).
// Logic/data lives in optionsData.js. Scene feeds it actions: up/down/left/right/confirm/back. No key rebinding (Controls is a separate panel).
// Items are proposed placeholders pending owner approval (content/dialogue/options-menu.json).
import { MENU_COLORS as C, MENU_CSS as CC, MENU_FONTS as MF } from '../config/assetKeys.js';
import {
  CATEGORIES, SETTINGS, COPY, adjust, clone, displayValue, getDefaults, isDirty, saveSettings,
} from './optionsData.js';

const VISIBLE = 10, ROW_H = 40, ROW_Y = 156, PX = 120, PW = 1040, LABEL_X = 190, VALUE_X = 1090;
const BUTTONS = [
  { id: 'apply', label: 'APPLY', x: 330, w: 290 },
  { id: 'reset', label: 'RESET TO DEFAULTS', x: 640, w: 290 },
  { id: 'back', label: 'BACK', x: 950, w: 290 },
];

export default class OptionsPanel {
  // host: { scene, applied, env, storage, toast(msg), onApplied(values), onClose() }
  constructor(host) {
    this.h = host;
    this.scene = host.scene;
    this.isOpen = false;
    this.root = null;
  }

  open() {
    this.pending = clone(this.h.applied);
    this.focus = 0; this.top = 0; this.dialog = null;
    this.isOpen = true;
    this.build();
    this.render();
  }

  close() {
    this.isOpen = false;
    if (this.root) { this.root.destroy(); this.root = null; }
    this.h.onClose();
  }

  get dirty() { return isDirty(this.pending, this.h.applied); }
  get rowCount() { return SETTINGS.length; }
  get inButtons() { return this.focus >= this.rowCount; }

  build() {
    const s = this.scene;
    const root = this.root = s.add.container(0, 0).setDepth(10);
    root.add(s.add.rectangle(0, 0, 1280, 720, C.nearBlack, 0.7).setOrigin(0).setInteractive()); // swallows clicks
    root.add(s.add.rectangle(PX + PW / 2, 355, PW, 610, C.cream));
    root.add(s.add.text(PX + 70, 62, COPY.title, { fontFamily: MF.display, fontSize: '40px', color: CC.nearBlack }));
    this.dirtyTxt = s.add.text(PX + PW - 70, 76, 'Unapplied changes', { fontFamily: MF.mono, fontStyle: '700', fontSize: '20px', color: CC.brick }).setOrigin(1, 0.5);
    this.header = s.add.text(PX + 70, 116, '', { fontFamily: MF.mono, fontStyle: '700', fontSize: '24px', color: CC.forest });
    this.hint = s.add.text(PX + 70, 566, '', { fontFamily: MF.mono, fontSize: '20px', color: CC.brown });
    this.scroll = s.add.text(PX + PW - 40, 356, '', { fontFamily: MF.mono, fontSize: '20px', color: CC.brown }).setOrigin(0.5);
    root.add([this.dirtyTxt, this.header, this.hint, this.scroll]);
    this.body = s.add.container(0, 0);
    this.dlg = s.add.container(0, 0).setDepth(12);
    root.add([this.body, this.dlg]);
  }

  // ---------- drawing (rebuilt on every change; ~25 small objects) ----------
  render() {
    const s = this.scene, b = this.body;
    b.removeAll(true);
    this.dirtyTxt.setVisible(this.dirty);
    const rowFocus = Math.min(this.focus, this.rowCount - 1);
    if (rowFocus < this.top) this.top = rowFocus;
    if (rowFocus >= this.top + VISIBLE) this.top = rowFocus - VISIBLE + 1;

    const cat = CATEGORIES.find((c) => c.id === SETTINGS[rowFocus].category);
    this.header.setText(cat.title + '  -  ' + cat.sub);
    this.hint.setText(this.inButtons ? '' : SETTINGS[this.focus].hint);
    this.scroll.setText((this.top > 0 ? '^' : ' ') + '\n\n\n\n\n\n\n\n' + (this.top + VISIBLE < this.rowCount ? 'v' : ' '));

    for (let i = 0; i < VISIBLE; i++) {
      const idx = this.top + i, def = SETTINGS[idx];
      if (!def) break;
      const y = ROW_Y + i * ROW_H, sel = idx === this.focus && !this.inButtons;
      if (sel) b.add(s.add.rectangle(PX + 40, y - 2, PW - 120, ROW_H - 4, C.mustard).setOrigin(0, 0));
      const col = CC.nearBlack;
      if (sel) b.add(s.add.text(LABEL_X - 30, y + 2, '>', { fontFamily: MF.display, fontSize: '26px', color: CC.nearBlack }));
      b.add(s.add.text(LABEL_X + (sel ? 10 : 0), y + 4, def.label, { fontFamily: MF.mono, fontStyle: '700', fontSize: '24px', color: col }));
      b.add(s.add.text(VALUE_X, y + 4, this.valueText(def, sel), { fontFamily: MF.mono, fontSize: '24px', color: sel ? CC.nearBlack : CC.brick }).setOrigin(1, 0));
    }

    BUTTONS.forEach((btn, k) => {
      const sel = this.inButtons && this.focus - this.rowCount === k && !this.dialog;
      b.add(s.add.rectangle(btn.x, 624, btn.w, 44, sel ? C.mustard : C.forest));
      b.add(s.add.text(btn.x, 624, (sel ? '> ' : '') + btn.label, { fontFamily: MF.display, fontSize: '26px', color: sel ? CC.nearBlack : CC.cream }).setOrigin(0.5));
    });
    this.renderDialog();
  }

  valueText(def, sel) {
    const v = this.pending[def.id];
    return sel ? '< ' + displayValue(def, v) + ' >' : displayValue(def, v);
  }

  renderDialog() {
    const s = this.scene, d = this.dlg;
    d.removeAll(true);
    if (!this.dialog) return;
    const dg = this.dialog;
    d.add(s.add.rectangle(0, 0, 1280, 720, C.nearBlack, 0.6).setOrigin(0).setInteractive());
    d.add(s.add.rectangle(640, 340, 960, 240, C.cream));
    dg.prompt.forEach((line, i) => d.add(s.add.text(640, 290 + i * 34, line, { fontFamily: MF.display, fontSize: '32px', color: CC.nearBlack }).setOrigin(0.5)));
    const n = dg.buttons.length, xs = n === 2 ? [480, 800] : [330, 640, 950];
    dg.buttons.forEach((label, i) => {
      const sel = i === dg.idx;
      d.add(s.add.rectangle(xs[i], 390, 290, 48, sel ? C.mustard : C.forest));
      d.add(s.add.text(xs[i], 390, (sel ? '> ' : '') + label, { fontFamily: MF.mono, fontStyle: '700', fontSize: '24px', color: sel ? CC.nearBlack : CC.cream }).setOrigin(0.5));
    });
  }

  // ---------- input ----------
  // MenuScene calls this first for every key; Options has no key capture, so it never swallows one.
  eatKey() { return false; }

  act(action) {
    if (!this.isOpen) return;
    if (this.dialog) return this.actDialog(action);
    const n = this.rowCount;
    switch (action) {
      case 'up': this.focus = this.inButtons ? n - 1 : (this.focus - 1 + n) % n; break;
      case 'down': this.focus = this.inButtons ? 0 : this.focus + 1; break; // last row drops to the button bar (Apply)
      case 'left': case 'right': return this.horizontal(action === 'left' ? -1 : 1);
      case 'confirm': return this.confirm();
      case 'back': return this.back();
    }
    this.render();
  }

  horizontal(dir) {
    if (this.inButtons) {
      const k = (this.focus - this.rowCount + dir + BUTTONS.length) % BUTTONS.length;
      this.focus = this.rowCount + k;
    } else {
      const def = SETTINGS[this.focus];
      this.pending[def.id] = adjust(def, this.pending[def.id], dir);
    }
    this.render();
  }

  confirm() {
    if (this.inButtons) {
      const id = BUTTONS[this.focus - this.rowCount].id;
      if (id === 'apply') return this.apply();
      if (id === 'reset') return this.openDialog({ kind: 'reset', prompt: [COPY.resetPrompt], buttons: [COPY.resetYes, COPY.resetKeep], idx: 1 }); // default: Keep mine
      return this.back();
    }
    this.horizontal(1);
  }

  back() {
    if (this.dirty) return this.openDialog({ kind: 'unsaved', prompt: COPY.unsavedPrompt, buttons: COPY.unsavedButtons, idx: 0 }); // default: Apply
    this.close();
  }

  openDialog(dg) { this.dialog = dg; this.render(); }

  actDialog(action) {
    const dg = this.dialog, n = dg.buttons.length;
    if (action === 'left') dg.idx = (dg.idx - 1 + n) % n;
    else if (action === 'right') dg.idx = (dg.idx + 1) % n;
    else if (action === 'back') { this.dialog = null; } // Esc = stay / keep mine
    else if (action === 'confirm') {
      const kind = dg.kind, i = dg.idx;
      this.dialog = null;
      if (kind === 'reset' && i === 0) this.pending = getDefaults(this.h.env); // pending only; Apply commits
      if (kind === 'unsaved') {
        if (i === 0) { if (this.apply()) this.close(); return; }
        if (i === 1) return this.close(); // leave without saving: pending discarded
      }
    }
    this.render();
  }

  apply() {
    if (!this.dirty) { this.h.toast(COPY.applyNone); this.render(); return false; }
    const ok = saveSettings(this.h.storage, this.pending);
    this.h.applied = clone(this.pending); // applied for this session even if persisting failed
    this.h.onApplied(this.h.applied);
    this.h.toast(ok ? COPY.applySaved : COPY.applyFail);
    this.render();
    return true;
  }
}
