// Pure input mapping: key codes -> abstract actions. No Phaser dependency.
export const ACTIONS = ['left', 'right', 'jump', 'light', 'heavy', 'block', 'dodge'];

// Keys are KeyboardEvent.code-style names; Zed.js converts Phaser keys to these.
export const KEY_MAP = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  jump: ['ArrowUp', 'KeyW', 'Space'],
  light: ['KeyJ', 'KeyZ'],
  heavy: ['KeyK', 'KeyX'],
  block: ['KeyI', 'KeyV'],
  dodge: ['KeyL', 'KeyC'],
};

const emptyActions = () => Object.fromEntries(ACTIONS.map((a) => [a, false]));

/** Map a set/array of held key codes to {action: bool}. */
export function mapKeys(downKeys, keyMap = KEY_MAP) {
  const down = downKeys instanceof Set ? downKeys : new Set(downKeys);
  const out = emptyActions();
  for (const a of ACTIONS) out[a] = (keyMap[a] || []).some((k) => down.has(k));
  return out;
}

/** Stateful edge detector. Call poll(downKeys) once per frame. */
export class InputState {
  constructor(keyMap = KEY_MAP) {
    this.keyMap = keyMap;
    this.held = emptyActions();
    this.pressed = emptyActions();
    this.released = emptyActions();
  }
  poll(downKeys) {
    const now = mapKeys(downKeys, this.keyMap);
    for (const a of ACTIONS) {
      this.pressed[a] = now[a] && !this.held[a];
      this.released[a] = !now[a] && this.held[a];
    }
    this.held = now;
    // Opposite directions cancel; moveX in {-1,0,1}
    this.moveX = (now.right ? 1 : 0) - (now.left ? 1 : 0);
    return this;
  }
}

// Standard-mapping gamepad -> the same key codes, so InputState needs no second path.
// A=jump, X=light, Y=heavy, B/RB=dodge, LB/LT/RT=block, d-pad / left stick = move.
export const PAD_MAP = { jump: [0], light: [2], heavy: [3], dodge: [1, 5], block: [4, 6, 7], left: [14], right: [15] };
export function padToKeys(pad, deadzone = 0.35) {
  const out = [];
  if (!pad || !pad.buttons) return out;
  const on = (i) => !!(pad.buttons[i] && pad.buttons[i].pressed);
  const ax = pad.axes && pad.axes.length ? pad.axes[0] : 0;
  const rep = { jump: 'Space', light: 'KeyJ', heavy: 'KeyK', dodge: 'KeyL', block: 'KeyI' };
  for (const [a, btns] of Object.entries(PAD_MAP)) {
    if (a === 'left' || a === 'right') continue;
    if (btns.some(on)) out.push(rep[a]);
  }
  if (on(PAD_MAP.left[0]) || ax < -deadzone) out.push('ArrowLeft');
  if (on(PAD_MAP.right[0]) || ax > deadzone) out.push('ArrowRight');
  return out;
}
