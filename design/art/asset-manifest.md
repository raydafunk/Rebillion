# Asset Manifest: Tier 0

Status: all "Current" files are PLACEHOLDERS (generated SVG shapes). Final art is NOT produced. Keys live in `assets/asset-keys.json`.
Owner abbreviations: ART = art-direction-agent (this agent), ANIM = Asset & Animation Lead, UI = menu-ui-agent.
Format "SVG" for placeholders; final art is flat vector, exported as PNG spritesheet (frame grid) unless Open Question 4 changes this.

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

| Key | Animation | Frames | FPS | Loop | Owner | Notes |
|---|---|---|---|---|---|---|
| zed (sprite) | static placeholder | 1 | n/a | n/a | ANIM | assets/sprites/zed-placeholder.svg |
| zed.idle | idle | 6 | 8 | yes | ANIM | breathing bob |
| zed.walk | walk | 8 | 12 | yes | ANIM | |
| zed.jump | jump | 4 (rise, apex, fall, land) | 10 | no | ANIM | land frame 80ms |
| zed.light | light attack | 4 (windup 1, strike 1, active 1, recover 1) | 24 | no | ANIM | ~170ms total, strike frame is hitbox-on |
| zed.heavy | heavy attack | 6 (windup 2, strike 1, active 1, recover 2) | 20 | no | ANIM | ~300ms, bigger smear |
| zed.hit | hit reaction | 2 | 12 | no | ANIM | |
| zed.ko | knockout | 6 | 10 | no | ANIM | ends lying down, holds last frame |

Totals: 36 frames. Sheet suggestion: `assets/sprites/zed.png` 1024x... grid 128x128, frame order as above; Phaser animation keys exactly as in the table. Frame counts are proposed; ANIM may adjust but must keep keys and report the hit-active frame index per attack to Player Combos and Health & Hitbox agents.

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

## FX

| Key | Filename | Size | Frames | Owner |
|---|---|---|---|---|
| fx.spark | assets/fx/spark-placeholder.svg | 64x64 | 1 (final: 4-frame burst) | ART |
| fx.telegraph | assets/fx/telegraph-icon-placeholder.svg | 32x48 | 1 | ART |

Hit flash, screenshake and hit-stop need no art; see `design/art/hit-feedback-spec.md`.

## Not in Tier 0 scope (not produced)
Pick-up objects, block/dodge/parry effects, additional enemies, audio, title logo, extra levels. Pick-ups and block/parry are in the GDD pillars; flagged as a gap.
