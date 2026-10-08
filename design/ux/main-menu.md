# Main Menu: "Wheatpaste Wall"

Scene: `MenuScene`. Resolution 1280x720 (`flow.md` A1), origin top-left, x right, y down. Concept source: `menu-concept.md`. Colours and final art: `design/art/style-guide.md` (palette hexes in the concept are placeholders until art confirms).

## Purpose

Get the player into a fight in one press, with a hand-made, defiant look. The menu sits on a brick wall (left half) with a dusk street (right half).

## Wireframe (1280x720)

```
x=0                         x=640                                    x=1280
+---------------------------+-----------------------------------------------+ y=0
| BRICK WALL                | DUSK STREET (sky, sun, buildings, lamp)       |
|        +----------------+ |                                               |
|        | THE REBELLION  | |  title strip 440x84, -2 deg, centre (396,110) |
|        +----------------+ |                                               |
|       Fists of the Fallen | City  (subtitle, centre 396,176)              |
| +------+                  |                                               |
| |POSTER|   > FIGHT        |  strip centre y=270                           |
| |  A   |     CONTROLS     |  y=352                                        |
| |      |     OPTIONS      |  y=434                                        |
| +------+     QUIT         |  y=516                                        |
| +------+                  |                                               |
| |POSTER|                  |                                               |
| |  B   |                  |                                               |
| +------+                  |                                               |
|~~ledge + vines~~~~~~~~~~~~|~~street, lane dashes~~~ W/S select / Enter confirm| y=688
+---------------------------+-----------------------------------------------+ y=720
```

## Background (3 parallax layers, back to front)

| Depth | Layer | Covers | Content |
|---|---|---|---|
| 0 | Sky and sun | full 1280x720 | Mustard/orange sky, low sun right of centre |
| 1 | Buildings and street | x 640-1280 fully, bleeds to x 600 | Far then near silhouettes, lit windows, rooftop props, awnings, street y 600-720 with lane dashes and lamp |
| 2 | Brick wall foreground | x 0-640 (right edge torn/irregular, up to 24 px overlap) | Brick, dark ledge y 640-720, boarded door, adjacent fire escape, vines along base |

Parallax is optional polish. Tier 0 default: static. If enabled, the mouse offset moves layer 0 by +/-4 px, layer 1 by +/-10 px, layer 2 by 0 (wall is the anchor). Wall pixels stay fixed so the menu text never drifts. Menu UI depth: posters 3, strips 4, title 5, footer 5, panel overlay 10.

## Layout table

| Element | Centre / anchor (px) | Size (px) | Tilt | Notes |
|---|---|---|---|---|
| Title strip "THE REBELLION" | centre 396,110 | 440x84 | -2 deg | Cream heavy condensed on near-black strip, torn edges |
| Subtitle "Fists of the Fallen City" | centre 396,176 | max width 440, 24 px | 0 | Mustard monospace |
| Fight strip | centre 396,270 | 360x64 | -2 deg | Default selected |
| Controls strip | centre 396,352 | 360x64 | +1.5 deg | |
| Options strip | centre 396,434 | 360x64 | -1 deg | |
| Quit strip | centre 396,516 | 360x64 | +2 deg | |
| Poster A "Local Heroes Benefit: Keep the Lights On" | centre 112,300 | 160x220 | -3 deg | Cream, forest-green text. Non-interactive |
| Poster B "Rust Notice 114" with "CURFEW" struck through | centre 112,540 | 160x200 | +2 deg | Brick red. Non-interactive |
| Footer hint "W/S select / Enter confirm" | right edge x=1248, baseline y=688 | auto, 20 px mono | 0 | Right-aligned, low emphasis, on the dark street |

Strip pitch is 82 px (18 px gap before tilt). Strip text is 32 px or more, left-aligned with 56 px left padding (room for the ">" marker at 24 px from the left edge). Strip right edges (x=576) sit 64 px inside the wall edge (x=640). Posters end at x=192, 24 px clear of the strips (x=216), so they never sit under selected text. Poster text is decorative small print; no gameplay information lives on the posters. Tilt is about the strip centre. Strips never overlap the title strip (title bottom ~152, first strip top ~238).

## Strip colours (placeholder, tint reused torn-edge shapes)

| State | Fight | Controls | Options | Quit |
|---|---|---|---|---|
| Idle | mustard (dimmed) | cream | forest green, cream text | warm brown, cream text |
| Selected | brightest variant of its own colour, "> " marker shown | same rule | same rule | same rule |

Per the concept, Fight is mustard when selected. Any strip, when selected, swaps to a bright variant, straightens and shifts right. Selection must not rely on colour alone: the ">" marker and the x offset also change.

## Selected state

- Rotation tweens to 0 deg.
- x moves +10 px (e.g. Fight centre 396 -> 406).
- Duration 100 ms, ease Quad.Out.
- Bright colour variant swapped on tween start. Marker ">" fades in at the strip's left padding.
- The previously selected strip reverses the same tween (to its idle tilt, x back, idle colour, marker hidden).
- Short tick sound on change (asset from art/audio, only after first input if audio is in Tier 0).
- Exactly one strip selected at all times. On load: Fight.

## Input map

| Action | Keyboard | Gamepad | Mouse |
|---|---|---|---|
| Select previous | W, Up | D-pad up, stick up | Hover over strip |
| Select next | S, Down | D-pad down, stick down | Hover over strip |
| Confirm | Enter, Space | A | Left click on strip |
| Back | Esc, Backspace (closes Controls panel; nothing otherwise) | B (same) | Click outside panel |

- Hover = keyboard selection: hover runs the same select-state tween and moves the selection. Mouse leaving a strip does not deselect (the last selection stays).
- Hit area is the strip's untilted 360x64 rectangle plus 10 px right (covers the shifted position), so a moving strip does not flicker the hover.
- Selection wraps first to last and last to first. Confirm fires on press once, held keys ignored. Stick: 0.5 dead zone, 0.25 s first repeat, 0.1 s repeat (`flow.md` global map).
- Footer text is keyboard-only wording as briefed. When a gamepad was last used, show "Up/Down select / A confirm". Gamepad support is a minor addition; confirm with OQ-M5.
- While the Controls panel is open, strips ignore input.

## Item behaviour

| Item | On confirm | Event / result |
|---|---|---|
| Fight | 0.3 s fade to black, start level scene, start HUD scene alongside | Emits `start-game` (no payload) |
| Controls | Opens bindings panel (below) | None |
| Options | Shows a notice "Options: not in Tier 0" | None. Strip stays selected |
| Quit | Shows a notice "Can't quit a browser game. Close the tab." | None. Does not close the window |

Notice: small toast, 480x56, centre 396,596 (just under Quit, clear of the footer), 24 px text, auto-dismiss after 2 s or on any input, one at a time. Options and Quit strips look identical to the others (not greyed), so the menu feels complete; the notice carries the explanation.

### Controls panel

- Modal overlay: dim layer over the full screen (60% near-black), panel 720x420 centred at 640,360, torn-paper look, title "CONTROLS" 40 px at the panel top, 32 px padding.
- Body: two-column list (action, key) at 24 px minimum. Rows: Move, Light attack, Heavy attack, Block, Dodge, Parry/pick-up, Pause. Key values are placeholders ("TBD") until Player Mechanics defines bindings (OQ-M1).
- Footer inside panel: "Esc / B close", bottom-right of panel.
- Opens with a 100 ms fade, closes on Back or Confirm. Focus returns to the Controls strip.

## Data needs

| Data | Source | Use |
|---|---|---|
| Key bindings list | Player Mechanics (not yet defined) | Controls panel |
| Last-used input device | UI input layer | Footer hint wording |
| Game version string (optional) | build config | Not shown in this layout (see OQ-M6) |
| Live game data | none | Menu needs no Game State data |

Events emitted: `start-game`. Events consumed: none.

## Later

- Real Options (volume, rebinding, fullscreen), Level Select, Continue, Credits.
- Quit (only in a desktop wrapper).
- Parallax animation, animated lamp or flickering windows, character art for Zed.
- Best time/result display on the wall (a third poster).

## Open questions

- OQ-M1. Controls panel needs real bindings; none are defined in the GDD or `flow.md` (OQ-F5). Panel is built with "TBD" values until then. The Controls item is a second menu item and `flow.md` called it optional; this brief makes it required.
- OQ-M2. Options and Quit are shown but inert in Tier 0 with a notice. Alternative: omit them (brief lists 4 strips, so kept). Confirm.
- OQ-M3. Is audio in Tier 0? If yes, a "press any key" gate is needed for the browser autoplay rule (the tick and any music wait for first input).
- OQ-M4. Title is live text or a logo image? Depends on `art-direction-agent`. Spec uses a 440x84 strip either way.
- OQ-M5. Footer wording is keyboard-only per brief. Is a gamepad variant wanted?
- OQ-M6. The old version tag was dropped to keep the footer to one hint. Confirm.
- OQ-M7. Event name is now `start-game` (per brief), replacing the proposed `start-game-requested`. `flow.md` still says "Start Game" and lists the old name in the menu context; it should be updated to "Fight".
- OQ-M8. Wall/street split at x=640 and posters at x 32-192 assume the art keeps the left half free of detail that clashes with text; art must keep strips' backgrounds contrast-safe.
