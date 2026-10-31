// Pure health component. Time is passed in (ms) so it is testable without Phaser.
export function createHealth({ maxHp, invulnMsAfterHit = 0 }) {
  return {
    maxHp,
    hp: maxHp,
    dead: false,
    hitstunUntil: 0,
    invulnUntil: 0,
    invulnMsAfterHit,
  };
}

export const isInvulnerable = (h, now) => h.dead || now < h.invulnUntil;
export const isStunned = (h, now) => now < h.hitstunUntil;

// Returns { applied, amount, hpAfter, died }.
export function applyDamage(h, amount, now, hitstunMs = 0) {
  if (amount <= 0 || isInvulnerable(h, now)) {
    return { applied: false, amount: 0, hpAfter: h.hp, died: false };
  }
  const dealt = Math.min(amount, h.hp);
  h.hp -= dealt;
  h.hitstunUntil = now + hitstunMs;
  h.invulnUntil = now + h.invulnMsAfterHit;
  let died = false;
  if (h.hp <= 0) { h.dead = true; died = true; }
  return { applied: true, amount: dealt, hpAfter: h.hp, died };
}

// A blow that connects but deals 0 hp (e.g. a never-kill hit on a boss at 1 hp). Applies hitstun/invuln only.
export function applyGlancingHit(h, now, hitstunMs = 0) {
  if (isInvulnerable(h, now)) return { applied: false, amount: 0, hpAfter: h.hp, died: false };
  h.hitstunUntil = now + hitstunMs;
  h.invulnUntil = now + h.invulnMsAfterHit;
  return { applied: true, amount: 0, hpAfter: h.hp, died: false };
}

// Restores up to `amount` hp (never above maxHp, never revives). Returns the hp actually restored.
export function applyHeal(h, amount) {
  if (h.dead || !(amount > 0)) return 0;
  const gained = Math.min(amount, h.maxHp - h.hp);
  h.hp += gained;
  return gained;
}

export function resetHealth(h) {
  h.hp = h.maxHp;
  h.dead = false;
  h.hitstunUntil = 0;
  h.invulnUntil = 0;
}
