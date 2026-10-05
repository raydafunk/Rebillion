// Attacker cap: at most `cap` enemies may hold an attack slot (telegraph/attack) at once.
export class AttackSlots {
  constructor(cap = 2) { this.cap = cap; this.holders = new Set(); }
  tryAcquire(id) {
    if (this.holders.has(id)) return true;
    if (this.holders.size >= this.cap) return false;
    this.holders.add(id);
    return true;
  }
  release(id) { this.holders.delete(id); }
  get count() { return this.holders.size; }
}
