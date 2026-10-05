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

export function resetHealth(h) {
  h.hp = h.maxHp;
  h.dead = false;
  h.hitstunUntil = 0;
  h.invulnUntil = 0;
}
