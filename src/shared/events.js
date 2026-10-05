// Event name constants. All cross-module communication goes through game.events.
// Payload shapes are documented in design/team/contracts.md.
export const EVENTS = Object.freeze({
  HIT_REQUEST: 'hit-request',
  DAMAGE_APPLIED: 'damage-applied',
  ENTITY_DIED: 'entity-died',
  PLAYER_HEALTH_CHANGED: 'player-health-changed',
  WAVE_STARTED: 'wave-started',
  WAVE_CLEARED: 'wave-cleared',
  ARENA_CLEARED: 'arena-cleared',
  TIMER_TICK: 'timer-tick',
  ROUND_WON: 'round-won',
  ROUND_LOST: 'round-lost',
  RETRY: 'retry',
  // Registration of entities so combat can resolve hits (see contract).
  ENTITY_REGISTERED: 'entity-registered',
  ENTITY_UNREGISTERED: 'entity-unregistered',
});

export const END_REASONS = Object.freeze({
  CLEARED: 'cleared',
  KO: 'ko',
  TIMEOUT: 'timeout',
});
