// Pure input mapping: key codes -> abstract actions. No Phaser dependency.
export const ACTIONS = ['left', 'right', 'jump', 'light', 'heavy', 'block', 'dodge'];

// Keys are KeyboardEvent.code-style names; Zed.js converts Phaser keys to these.
export const KEY_MAP = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  jump: ['ArrowUp', 'KeyW', 'Space'],
  light: ['KeyJ', 'KeyZ'],
  heavy: ['KeyK', 'KeyX'],
  block: ['KeyL', 'KeyC'],
  dodge: ['ShiftLeft', 'KeyV'],
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
