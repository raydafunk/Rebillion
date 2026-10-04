// Single place for asset keys + paths used by src/ui. Mirrors assets/asset-keys.json
// (owned by art-direction-agent). Swap art by editing paths here or replacing files.
export const ASSET_KEYS = {
  BG_ARENA: 'bg.arena.01',
  BTN_DEFAULT: 'ui.button.default',
  BTN_HOVER: 'ui.button.hover',
  BTN_PRESSED: 'ui.button.pressed',
};

export const ASSET_PATHS = {
  [ASSET_KEYS.BG_ARENA]: 'assets/backgrounds/arena-01-placeholder.svg',
  [ASSET_KEYS.BTN_DEFAULT]: 'assets/ui/button-default.svg',
  [ASSET_KEYS.BTN_HOVER]: 'assets/ui/button-hover.svg',
  [ASSET_KEYS.BTN_PRESSED]: 'assets/ui/button-pressed.svg',
};

// Style guide palette (design/art/style-guide.md section 2)
export const COLORS = {
  mustard: 0xe3a92b, mustardLight: 0xf2c04d, mustardPressed: 0xc48e1f,
  brickRed: 0xa8402e, darkBrown: 0x2e1f16, cream: 0xf4e6c8, sand: 0xf2d9a0,
};
export const CSS = { darkBrown: '#2E1F16', cream: '#F4E6C8', mustard: '#E3A92B', brickRed: '#A8402E' };

// Urban street-style fonts (Google Fonts, all OFL). Loaded via <link> in index.html.
// display = title (marker/spray), button = button labels, body = small text.
export const FONTS = {
  display: '"Permanent Marker", Impact, sans-serif',
  button: '"Anton", Impact, sans-serif',
  body: '"Rubik", Arial, sans-serif',
};

// Specs passed to document.fonts.load() so canvas text is not first drawn in a fallback.
export const FONT_LOADS = ['88px "Permanent Marker"', '30px "Anton"', '500 20px "Rubik"', '700 20px "Rubik"'];
export const FONT_LOAD_TIMEOUT_MS = 2500;

export async function waitForFonts() {
  if (!document.fonts || !document.fonts.load) return;
  const loads = Promise.all(FONT_LOADS.map((f) => document.fonts.load(f, 'THE REBELLION Start Game 0123'))).catch(() => {});
  const timeout = new Promise((res) => setTimeout(res, FONT_LOAD_TIMEOUT_MS));
  await Promise.race([loads, timeout]);
}

export const GAME_VERSION = 'v0.1';
