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
export const FONT_LOADS = ['88px "Permanent Marker"', '30px "Anton"', '500 20px "Rubik"', '700 20px "Rubik"', '40px "Anton"', '20px "Courier Prime"', '700 20px "Courier Prime"'];
export const FONT_LOAD_TIMEOUT_MS = 2500;

export async function waitForFonts() {
  if (!document.fonts || !document.fonts.load) return;
  const loads = Promise.all(FONT_LOADS.map((f) => document.fonts.load(f, 'THE REBELLION Start Game 0123'))).catch(() => {});
  const timeout = new Promise((res) => setTimeout(res, FONT_LOAD_TIMEOUT_MS));
  await Promise.race([loads, timeout]);
}

// Wheatpaste Wall main menu (assets/asset-keys.json "menu", "menuPalette", "menuFonts").
// Menu palette takes precedence over COLORS inside MenuScene (style-guide section 9).
export const MENU_ASSETS = {
  'menu.sky': { path: 'assets/menu/menu-sky.svg', w: 1280, h: 720 },
  'menu.buildings.far': { path: 'assets/menu/menu-buildings-far.svg', w: 1280, h: 720 },
  'menu.buildings.near': { path: 'assets/menu/menu-buildings-near.svg', w: 1280, h: 720 },
  'menu.street': { path: 'assets/menu/menu-street.svg', w: 1280, h: 360 },
  'menu.wall': { path: 'assets/menu/menu-wall.svg', w: 640, h: 720 },
  'menu.strip.a': { path: 'assets/menu/strip-torn-a.svg', w: 560, h: 96 },
  'menu.strip.b': { path: 'assets/menu/strip-torn-b.svg', w: 520, h: 88 },
  'menu.strip.c': { path: 'assets/menu/strip-torn-c.svg', w: 480, h: 96 },
  'menu.poster.heroes': { path: 'assets/menu/poster-local-heroes.svg', w: 300, h: 420 },
  'menu.poster.curfew': { path: 'assets/menu/poster-curfew.svg', w: 300, h: 420 },
};
export const MENU_COLORS = {
  brick: 0x9c3b2e, brickDark: 0x7a2f25, mustard: 0xe1a92b, forest: 0x2f5d3a,
  brown: 0x6b4a2f, cream: 0xe8dcc0, nearBlack: 0x1d1a16,
};
export const MENU_CSS = {
  brick: '#9C3B2E', mustard: '#E1A92B', forest: '#2F5D3A', brown: '#6B4A2F', cream: '#E8DCC0', nearBlack: '#1D1A16',
};
export const MENU_FONTS = {
  display: 'Anton, Impact, sans-serif',
  mono: "'Courier Prime', 'Courier New', monospace",
};

export const GAME_VERSION = 'v0.1';
