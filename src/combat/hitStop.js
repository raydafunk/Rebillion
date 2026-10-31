import { HIT_STOP_MS } from '../shared/hitFeedback.js';

// Pure: hit-stop duration in ms for a hit type ('light', 'heavy', ...). Unknown type -> 0.
export function hitStopMs(type, config = HIT_STOP_MS) {
  const ms = config[type];
  if (type === 'max' || typeof ms !== 'number' || ms < 0) return 0;
  return Math.min(ms, config.max);
}

// Pure: overlapping hit-stops do not stack; take the longest, capped at max.
export function mergeHitStop(currentMs, type, config = HIT_STOP_MS) {
  return Math.min(Math.max(currentMs, hitStopMs(type, config)), config.max);
}
