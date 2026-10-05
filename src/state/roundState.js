import { EVENTS, END_REASONS } from '../shared/events.js';
import { ROUND_TIME_SECONDS, MAX_RETRIES } from './config.js';
import { PLAYER_ID } from '../shared/combatData.js';

export const RoundStatus = Object.freeze({ RUNNING: 'running', WON: 'won', LOST: 'lost' });

// Timer is driven by tick(dtMs) (call from scene update) so it is testable;
// attachClock gives a setInterval-less option: scene calls state.tick(delta).
export function createRoundState(events, { seconds = ROUND_TIME_SECONDS, maxRetries = MAX_RETRIES } = {}) {
  let status = RoundStatus.RUNNING;
  let msLeft = seconds * 1000;
  let lastWholeSec = seconds;
  let retries = 0;

  const finish = (kind, reason) => {
    if (status !== RoundStatus.RUNNING) return;
    status = kind;
    events.emit(kind === RoundStatus.WON ? EVENTS.ROUND_WON : EVENTS.ROUND_LOST, { reason });
  };

  const onDied = ({ id }) => { if (id === PLAYER_ID) finish(RoundStatus.LOST, END_REASONS.KO); };
  const onCleared = () => finish(RoundStatus.WON, END_REASONS.CLEARED);
  const onRetry = () => {
    if (retries >= maxRetries) return;
    retries++;
    status = RoundStatus.RUNNING;
    msLeft = seconds * 1000;
    lastWholeSec = seconds;
    events.emit(EVENTS.TIMER_TICK, { secondsLeft: seconds });
  };

  events.on(EVENTS.ENTITY_DIED, onDied);
  events.on(EVENTS.ARENA_CLEARED, onCleared);
  events.on(EVENTS.RETRY, onRetry);

  return {
    get status() { return status; },
    get secondsLeft() { return Math.ceil(msLeft / 1000); },
    // Emits timer-tick once per whole second; round-lost 'timeout' at 0.
    tick(dtMs) {
      if (status !== RoundStatus.RUNNING) return;
      msLeft = Math.max(0, msLeft - dtMs);
      const whole = Math.ceil(msLeft / 1000);
      while (lastWholeSec > whole) {
        lastWholeSec--;
        events.emit(EVENTS.TIMER_TICK, { secondsLeft: lastWholeSec });
      }
      if (msLeft === 0) finish(RoundStatus.LOST, END_REASONS.TIMEOUT);
    },
    // Emit initial tick so UI shows full time.
    start() { events.emit(EVENTS.TIMER_TICK, { secondsLeft: seconds }); },
    destroy() {
      events.off(EVENTS.ENTITY_DIED, onDied);
      events.off(EVENTS.ARENA_CLEARED, onCleared);
      events.off(EVENTS.RETRY, onRetry);
    },
  };
}
