// Minimal emitter for tests.
export function fakeEmitter() {
  const m = new Map();
  return {
    on(e, f) { (m.get(e) ?? m.set(e, []).get(e)).push(f); },
    off(e, f) { m.set(e, (m.get(e) ?? []).filter((x) => x !== f)); },
    emit(e, p) { for (const f of [...(m.get(e) ?? [])]) f(p); },
  };
}
