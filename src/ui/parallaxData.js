// Menu background scroll. Pure data + function, no Phaser, so it is unit-testable.
// The city (sky, buildings, road) drifts continuously to the right and wraps around; the wall art stays put.
// GDD gives no speeds: PLACEHOLDER values in px per second, need a playtest. Sky is slowest so it reads as far away.
export const SCROLL_LAYERS = [
  { id: 'sky', speed: 2 },
  { id: 'buildings', speed: 6 }, // buildings and the road move together
];

export function layerSpeed(id) {
  const l = SCROLL_LAYERS.find((x) => x.id === id);
  return l ? l.speed : 0;
}

// Rightward offset in px, wrapped into [0, width) so two copies of an image, one at +offset and one at
// offset - width, always cover the screen. Zero when reduced motion is on.
export function scrollOffset(id, timeMs, reducedMotion = false, width = 1280) {
  if (reducedMotion) return 0;
  return ((layerSpeed(id) * timeMs) / 1000) % width;
}
