# Asset Manifest: Tier 0

Status: all "Current" files are PLACEHOLDERS (generated SVG shapes). Final art is NOT produced. Keys live in `assets/asset-keys.json`.
Owner abbreviations: ART = art-direction-agent (this agent), ANIM = Asset & Animation Lead, UI = menu-ui-agent.
Format "SVG" for placeholders; final art is flat vector, exported as PNG spritesheet (frame grid) unless Open Question 4 changes this. EXCEPTION: Zed is hand-authored pixel art (see Zed section); everything else stays flat vector.

## UI

| Key | Filename | Size | Format | Frames | Owner | Current |
|---|---|---|---|---|---|---|
| ui.bar.health.frame | assets/ui/bar-frame-health.svg | 360x32 | SVG to PNG | 1 | ART | placeholder |
| ui.bar.health.fill | assets/ui/bar-fill-health.svg | 348x20 | SVG to PNG | 1 (scaled) | ART | placeholder |
| ui.bar.timer.frame | assets/ui/bar-frame-timer.svg | 160x56 | SVG to PNG | 1 | ART | placeholder |
| ui.button.default | assets/ui/button-default.svg | 260x64 | SVG to PNG | 1 | ART | placeholder |
| ui.button.hover | assets/ui/button-hover.svg | 260x64 | SVG to PNG | 1 | ART | placeholder |
| ui.button.pressed | assets/ui/button-pressed.svg | 260x64 | SVG to PNG | 1 | ART | placeholder |
| ui.button.disabled | assets/ui/button-disabled.svg | 260x64 | SVG to PNG | 1 | ART | placeholder |
| ui.panel | assets/ui/panel.svg | 560x360 | SVG to PNG | 1 (9-slice, 24px corners) | ART | placeholder |
| ui.icon.heart | assets/ui/icon-heart.svg | 32x32 | SVG to PNG | 1 | ART | placeholder |
| ui.icon.clock | assets/ui/icon-clock.svg | 32x32 | SVG to PNG | 1 | ART | placeholder |

Text screens (title, win, lose) use the panel, buttons and fonts; UI agent assembles them. No extra art in Tier 0.

## Zed (player), frame 128x128, facing right, origin (0.5, 1.0) at feet

Art style: PIXEL ART (hand-authored, e.g. Pixel Lab plus Aseprite cleanup), unlike the flat-vector rest of the game. Render with nearest-neighbour filtering and integer scale only; no smoothing. No baked shadow in the frames (the game draws it). Spec, prompts and sheet layout: `design/art/zed-pixellab-prompt.md`; rules in style-guide.md section 1.
Final sheet: `assets/sprites/zed.png`, 1024x640 (8 columns x 5 rows of 128x128), transparent PNG, no padding or spacing. `assets/sprites/zed-placeholder.svg` (vector placeholder) remains in use until `zed.png` exists, then is retired.

| Key | Animation | Frames | FPS | Loop | Owner | Notes |
|---|---|---|---|---|---|---|
| zed (sprite) | static placeholder (vector SVG, not pixel art) | 1 | n/a | n/a | ANIM | assets/sprites/zed-placeholder.svg; kept until zed.png exists |
| zed.idle | idle | 6 | 8 | yes | ANIM | breathing bob |
| zed.walk | walk | 8 | 12 | yes | ANIM | |
| zed.jump | jump | 4 (rise, apex, fall, land) | 10 | no | ANIM | land frame 80ms |
| zed.light | light attack | 4 (windup 1, strike 1, active 1, recover 1) | 24 | no | ANIM | ~170ms total, strike frame is hitbox-on; hit-active = frame 2 |
| zed.heavy | heavy attack | 6 (windup 2, strike 1, active 1, recover 2) | 20 | no | ANIM | ~300ms, bigger smear; hit-active = frame 3 |
| zed.hit | hit reaction | 2 | 12 | no | ANIM | |
| zed.ko | knockout | 6 | 10 | no | ANIM | ends lying down, holds last frame |

Totals: 36 frames. Sheet `assets/sprites/zed.png` 1024x640, 8 columns x 5 rows, 128x128 cells, frames numbered left to right, top to bottom (1-based per animation below). Frame order (from zed-pixellab-prompt.md section 4):

| Row | Columns 1 to 8 |
|---|---|
| 1 | idle 1 to 6, walk 1 to 2 |
| 2 | walk 3 to 8, jump 1 to 2 |
| 3 | jump 3 to 4, light 1 to 4, heavy 1 to 2 |
| 4 | heavy 3 to 6, hit 1 to 2, ko 1 to 2 |
| 5 | ko 3 to 6 (columns 7 and 8 empty) |

Phaser animation keys exactly as in the table. Hit-active frames: `zed.light` = frame 2 (strike), `zed.heavy` = frame 3 (strike); report to Player Combos and Health & Hitbox agents. Frame counts, FPS and loop flags are fixed for Tier 0; changes need Art approval (Open Question 4 in the style guide may revisit).

## Rust Grunt (one enemy type), frame 128x128

| Key | Animation | Frames | FPS | Loop | Owner |
|---|---|---|---|---|---|
| rust.grunt (sprite) | static placeholder | 1 | n/a | n/a | ANIM |
| rust.grunt.idle | idle | 4 | 6 | yes | ANIM |
| rust.grunt.walk | walk | 6 | 10 | yes | ANIM |
| rust.grunt.telegraph | attack windup | 3 | 8 (about 400ms) | no | ANIM |
| rust.grunt.attack | strike and recover | 4 | 20 | no | ANIM |
| rust.grunt.hit | hit reaction | 2 | 12 | no | ANIM |
| rust.grunt.ko | knockout | 5 | 10 | no | ANIM |

Total: 24 frames. Placeholder: assets/sprites/rust-grunt-placeholder.svg.

## Arena background

| Key | Filename | Size | Format | Frames | Owner |
|---|---|---|---|---|---|
| bg.arena.01 | assets/backgrounds/arena-01-placeholder.svg | 1920x720 | SVG now, PNG final | 1 | ART |

1920 wide gives 640px of camera scroll over a 1280 viewport. Play lane y 440 to 680. Final should be split into far and near parallax layers (open question). Theme: corner shop, mural, basketball hoop, food stall, planters.

## Main menu: Wheatpaste Wall (placeholders, SVG)

Source brief: design/ux/menu-concept.md. All PLACEHOLDER flat SVG, no gradients or glow, torn/uneven edges. Final: PNG with alpha at same size. Scene y offsets assume 1280x720.

| Key | Filename | Size | Frames | Owner | Notes |
|---|---|---|---|---|---|
| menu.sky | assets/menu/menu-sky.svg | 1280x720 | 1 | ART | Flat sky bands, cream low sun at (960,500); opaque; parallax layer 1 |
| menu.buildings.far | assets/menu/menu-buildings-far.svg | 1280x720 | 1 | ART | Silhouettes, transparent, ground at y 540; layer 2 |
| menu.buildings.near | assets/menu/menu-buildings-near.svg | 1280x720 | 1 | ART | Window grids (some lit mustard), water tank, antennas, hut, vents, wires, fire escape on tower 4, 4 striped awning shopfronts (second has a sign, live text optional); ground y 520; layer 3 |
| menu.street | assets/menu/menu-street.svg | 1280x360 | 1 | ART | Place at y 360. Road top at scene y 520, yellow dashes, street lamp at x about 1135. Reusable as arena floor backdrop |
| menu.wall | assets/menu/menu-wall.svg | 640x720 | 1 | ART | Foreground left half: brick, dark ledge y 590, boarded door, fire escape, vines at bottom, uneven right edge |
| menu.strip.a | assets/menu/strip-torn-a.svg | 560x96 | 1 | ART | White, tint per button |
| menu.strip.b | assets/menu/strip-torn-b.svg | 520x88 | 1 | ART | White, tint per button |
| menu.strip.c | assets/menu/strip-torn-c.svg | 480x96 | 1 | ART | White, tint per button |
| menu.poster.heroes | assets/menu/poster-local-heroes.svg | 300x420 | 1 | ART | Cream, forest text blocks. Live text: "Local Heroes Benefit" / "Keep the Lights On" |
| menu.poster.curfew | assets/menu/poster-curfew.svg | 300x420 | 1 | ART | Brick red, Rust Notice 114. Live text "CURFEW" struck through (mustard strike bar is in the art) |

Not drawn (UI owns): title strip (near-black, live text), selected ">" marker, footer hint. Fonts: Anton (display), Courier Prime (mono); tokens in assets/asset-keys.json under menuFonts and menuPalette.

## FX

| Key | Filename | Size | Frames | Owner |
|---|---|---|---|---|
| fx.spark | assets/fx/spark-placeholder.svg | 64x64 | 1 (final: 4-frame burst) | ART |
| fx.telegraph | assets/fx/telegraph-icon-placeholder.svg | 32x48 | 1 | ART |

Hit flash, screenshake and hit-stop need no art; see `design/art/hit-feedback-spec.md`.

## Not in Tier 0 scope (not produced)
Pick-up objects, block/dodge/parry effects, additional enemies, audio, title logo, extra levels. Pick-ups and block/parry are in the GDD pillars; flagged as a gap.
