// Event name constants. All cross-module communication goes through game.events.
// Payload shapes are documented in design/team/contracts.md.
export const EVENTS = Object.freeze({
  HIT_REQUEST: 'hit-request',
  DAMAGE_APPLIED: 'damage-applied',
  // Zed parried this attacker: it is stunned, no knockback. { attackerId, hitstun(ms) }
  PARRY_STUN: 'parry-stun',
  ENTITY_DIED: 'entity-died',
  PLAYER_HEALTH_CHANGED: 'player-health-changed',
  // Score moved (kill, parry or flawless wave). { total, delta, reason, multiplier, streak }
  SCORE_CHANGED: 'score-changed',
  WAVE_STARTED: 'wave-started',
  WAVE_CLEARED: 'wave-cleared',
  ARENA_CLEARED: 'arena-cleared',
  TIMER_TICK: 'timer-tick',
  ROUND_WON: 'round-won',
  ROUND_LOST: 'round-lost',
  RETRY: 'retry',
  // Grab and Wall Slam (Dugan -> Zed). See design/team/contracts.md "Grab and Wall Slam".
  // Dugan: grab connected. { attackerId, targetId, holdMs, slamDamage, slamKnockback, slamDir(+1|-1 toward the wall), anchor:()=>({x,y,facing,lane?}) }
  GRAB: 'grab',
  // Zed answers every GRAB. { attackerId, targetId, accepted:boolean }
  GRAB_RESULT: 'grab-result',
  // Dugan: slam NOW (his slam frame). Optional: Zed slams by itself when holdMs runs out. { attackerId }
  GRAB_SLAM: 'grab-slam',
  // Dugan: let go (he died / was stunned). { attackerId, reason: 'died'|'stunned' }
  GRAB_RELEASE: 'grab-release',
  // Zed: broke the hold by mashing. Dugan should be stunned briefly. { attackerId }
  GRAB_BROKEN: 'grab-broken',
  // Zed: took the slam (after the damage went through DAMAGE_APPLIED). { attackerId, damage, slamDir, x, y } (x,y world position)
  PLAYER_SLAMMED: 'player-slammed',
  // Registration of entities so combat can resolve hits (see contract).
  ENTITY_REGISTERED: 'entity-registered',
  ENTITY_UNREGISTERED: 'entity-unregistered',
});

export const END_REASONS = Object.freeze({
  CLEARED: 'cleared',
  KO: 'ko',
  TIMEOUT: 'timeout',
});
