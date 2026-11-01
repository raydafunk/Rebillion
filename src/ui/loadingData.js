// Arena loading screen copy. Pure, no Phaser. The arena loads hundreds of sprite frames on first entry,
// so the screen shows the level name, a progress bar and a line that changes as it fills.
export const LOADING_LINES = Object.freeze([
  'Heading into the district...',
  'Pasting up the posters...',
  'Lacing up the boots...',
  'Rust on the horizon...',
  'Almost there.',
]);

/** Line for load progress 0..1 (clamped). */
export function loadingLine(progress, lines = LOADING_LINES) {
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  return lines[Math.min(lines.length - 1, Math.floor(p * lines.length))];
}
