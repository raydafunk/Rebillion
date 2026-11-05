import { EVENTS } from '../shared/events.js';
import { COMBAT_DEFAULTS, PLAYER_ID } from '../shared/combatData.js';
import { createHealth, applyDamage, applyGlancingHit, applyHeal, resetHealth, isInvulnerable } from './health.js';

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
  const onBossRestored = ({ id, share = 1 }) => { // a boss rebuilt itself: refill (never revives the dead)
    const e = entities.get(id);
    if (e && !e.health.dead) e.health.hp = Math.max(e.health.hp, Math.min(e.health.maxHp, Math.ceil(e.health.maxHp * share)));
  };

  const onHit = (req) => {
    if (locked) return;
    const t = now();
    const box = worldRect(req.hitbox, req.origin, req.facing);
    for (const [id, e] of entities) {
      if (e.reg.team === req.team || id === req.attackerId) continue;
      const key = `${req.attackId}|${id}`;
      if (seen.has(key)) continue;
      const st = e.reg.getState();
      if ((st.lift ?? 0) >= COMBAT_DEFAULTS.AIR_DODGE_LIFT) continue; // airborne: ground melee passes underneath
      if (req.lane != null && st.lane != null && Math.abs(req.lane - st.lane) > COMBAT_DEFAULTS.DEPTH_TOLERANCE) continue; // not on the same floor line
      if (!rectsOverlap(box, worldRect(e.reg.hurtbox, st, st.facing))) continue;
      const dir = st.x >= req.origin.x ? 1 : -1;
      if (st.invuln) continue; // a boss mid-transformation (Varr, phase change) cannot be hurt
      let guard = st.guard ?? null;
      if (guard === 'shield') { // Varr's Command Shield: negates every blow from the front, flank him to hurt him
        const inFront = (req.origin.x >= st.x ? 1 : -1) === st.facing;
        if (inFront) {
          seen.add(key);
          events.emit(EVENTS.DAMAGE_APPLIED, {
            targetId: id, attackerId: req.attackerId, attackId: req.attackId, amount: 0,
            hpAfter: e.health.hp, knockback: 0, hitstun: 0, landed: false, shield: true, shieldDmg: req.damage,
          });
          continue;
        }
        guard = null;
      }
      if (guard === 'parry' && !req.unparryable) { // unparryable (Mega Stomp wave): a parry does nothing, the answer is to jump
        // Negated: no hp change, no invulnerability spent, but Zed still gets told.
        if (req.pierceInvuln ? e.health.dead : isInvulnerable(e.health, t)) continue; // piercing hits can be parried even inside the invuln window
        seen.add(key);
        events.emit(EVENTS.DAMAGE_APPLIED, {
          targetId: id, attackerId: req.attackerId, attackId: req.attackId, amount: 0,
          hpAfter: e.health.hp, knockback: 0, hitstun: 0, landed: false,
        });
        continue;
      }
      const blocked = guard === 'block' && !req.unblockable; // unblockable (Dugan's Mega Stomp wave): a block does nothing, only a parry or a jump does
      const dmg = blocked ? Math.max(1, Math.round(req.damage * COMBAT_DEFAULTS.BLOCK_DAMAGE_MULT)) : req.damage;
      const kb = blocked ? req.knockback * COMBAT_DEFAULTS.BLOCK_KNOCKBACK_MULT : req.knockback;
      const stun = blocked ? 0 : req.hitstun;
      // Special / neverKills vs a boss: capped at bossDamageCap and never below 1 hp.
      // If nothing is left to deal (boss already at 1 hp) the blow still lands (hitstun, knockback, event).
      let r;
      const hpFloor = st.hpFloor ?? null; // phase-gated boss: damage stops at this hp until its next phase opens
      if ((e.reg.boss && (req.special || req.neverKills)) || req.nonLethal || hpFloor !== null) {
        let cap = dmg;
        if (Number.isFinite(req.bossDamageCap)) cap = Math.min(cap, req.bossDamageCap);
        if (hpFloor !== null) cap = Math.min(cap, Math.max(0, e.health.hp - hpFloor));
        if (req.neverKills || req.nonLethal) cap = Math.min(cap, e.health.hp - 1); // nonLethal: hurts but always leaves 1 hp (Dugan's slam)
        r = cap > 0 ? applyDamage(e.health, cap, t, stun) : applyGlancingHit(e.health, t, stun);
      } else {
        r = applyDamage(e.health, dmg, t, stun, { pierce: !!req.pierceInvuln });
      }
      if (!r.applied) continue;
      seen.add(key);
      events.emit(EVENTS.DAMAGE_APPLIED, {
        targetId: id, attackerId: req.attackerId, attackId: req.attackId, amount: r.amount,
        hpAfter: r.hpAfter, knockback: dir * kb, hitstun: stun, landed: true,
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
  events.on(EVENTS.BOSS_HP_RESTORED, onBossRestored);
  events.on(EVENTS.HIT_REQUEST, onHit);
  events.on(EVENTS.ROUND_WON, onEnd);
  events.on(EVENTS.ROUND_LOST, onEnd);
  events.on(EVENTS.RETRY, onRetry);

  return {
    getHealth: (id) => entities.get(id)?.health,
    /** Restore hp (health pickups). Returns hp actually gained; 0 at full health. */
    heal(id, amount) {
      const e = entities.get(id);
      if (!e) return 0;
      const gained = applyHeal(e.health, amount);
      if (gained > 0 && id === PLAYER_ID) emitPlayerHp(e.health);
      return gained;
    },
    destroy() {
      events.off(EVENTS.ENTITY_REGISTERED, onRegister);
      events.off(EVENTS.ENTITY_UNREGISTERED, onUnregister);
      events.off(EVENTS.BOSS_HP_RESTORED, onBossRestored);
      events.off(EVENTS.HIT_REQUEST, onHit);
      events.off(EVENTS.ROUND_WON, onEnd);
      events.off(EVENTS.ROUND_LOST, onEnd);
      events.off(EVENTS.RETRY, onRetry);
    },
  };
}
