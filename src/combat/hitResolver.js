import { EVENTS } from '../shared/events.js';
import { COMBAT_DEFAULTS, PLAYER_ID } from '../shared/combatData.js';
import { createHealth, applyDamage, resetHealth, isInvulnerable } from './health.js';

export function worldRect(rect, origin, facing) {
  const x0 = origin.x + facing * rect.x;
  const x1 = origin.x + facing * (rect.x + rect.w);
  return { x: Math.min(x0, x1), y: origin.y + rect.y, w: rect.w, h: rect.h };
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

// events: any emitter with on/off/emit (game.events). now: () => ms.
export function createHitResolver(events, now = () => Date.now()) {
  const entities = new Map(); // id -> { reg, health }
  const seen = new Set();     // `${attackId}|${targetId}`
  let locked = false;

  const emitPlayerHp = (h) =>
    events.emit(EVENTS.PLAYER_HEALTH_CHANGED, { hp: h.hp, maxHp: h.maxHp });

  const onRegister = (reg) => {
    const health = createHealth({
      maxHp: reg.maxHp,
      invulnMsAfterHit: reg.id === PLAYER_ID ? COMBAT_DEFAULTS.INVULN_MS_AFTER_HIT : 0,
    });
    entities.set(reg.id, { reg, health });
    if (reg.id === PLAYER_ID) emitPlayerHp(health);
  };
  const onUnregister = ({ id }) => { entities.delete(id); };

  const onHit = (req) => {
    if (locked) return;
    const t = now();
    const box = worldRect(req.hitbox, req.origin, req.facing);
    for (const [id, e] of entities) {
      if (e.reg.team === req.team || id === req.attackerId) continue;
      const key = `${req.attackId}|${id}`;
      if (seen.has(key)) continue;
      const st = e.reg.getState();
      if (!rectsOverlap(box, worldRect(e.reg.hurtbox, st, st.facing))) continue;
      const dir = st.x >= req.origin.x ? 1 : -1;
      const guard = st.guard ?? null;
      if (guard === 'dodge' || guard === 'parry') {
        // Negated: no hp change, no invulnerability spent, but Zed still gets told.
        if (isInvulnerable(e.health, t)) continue;
        seen.add(key);
        events.emit(EVENTS.DAMAGE_APPLIED, {
          targetId: id, attackerId: req.attackerId, amount: 0,
          hpAfter: e.health.hp, knockback: 0, hitstun: 0,
        });
        continue;
      }
      const blocked = guard === 'block';
      const dmg = blocked ? Math.max(1, Math.round(req.damage * COMBAT_DEFAULTS.BLOCK_DAMAGE_MULT)) : req.damage;
      const kb = blocked ? req.knockback * COMBAT_DEFAULTS.BLOCK_KNOCKBACK_MULT : req.knockback;
      const stun = blocked ? 0 : req.hitstun;
      const r = applyDamage(e.health, dmg, t, stun);
      if (!r.applied) continue;
      seen.add(key);
      events.emit(EVENTS.DAMAGE_APPLIED, {
        targetId: id, attackerId: req.attackerId, amount: r.amount,
        hpAfter: r.hpAfter, knockback: dir * kb, hitstun: stun,
      });
      if (id === PLAYER_ID) emitPlayerHp(e.health);
      if (r.died) events.emit(EVENTS.ENTITY_DIED, { id, team: e.reg.team });
    }
  };

  const onEnd = () => { locked = true; };
  const onRetry = () => {
    locked = false;
    seen.clear();
    for (const e of entities.values()) resetHealth(e.health);
    const p = entities.get(PLAYER_ID);
    if (p) emitPlayerHp(p.health);
  };

  events.on(EVENTS.ENTITY_REGISTERED, onRegister);
  events.on(EVENTS.ENTITY_UNREGISTERED, onUnregister);
  events.on(EVENTS.HIT_REQUEST, onHit);
  events.on(EVENTS.ROUND_WON, onEnd);
  events.on(EVENTS.ROUND_LOST, onEnd);
  events.on(EVENTS.RETRY, onRetry);

  return {
    getHealth: (id) => entities.get(id)?.health,
    destroy() {
      events.off(EVENTS.ENTITY_REGISTERED, onRegister);
      events.off(EVENTS.ENTITY_UNREGISTERED, onUnregister);
      events.off(EVENTS.HIT_REQUEST, onHit);
      events.off(EVENTS.ROUND_WON, onEnd);
      events.off(EVENTS.ROUND_LOST, onEnd);
      events.off(EVENTS.RETRY, onRetry);
    },
  };
}
