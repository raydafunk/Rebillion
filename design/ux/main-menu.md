# Main Menu

Scene: `MenuScene`. Resolution assumption: 1280x720 (see `flow.md` A1). Style from `design/art/style-guide.md`.

## Purpose

Get the player into a fight in one press. The GDD says the Menu & UI Agent lets "the player start a game". Tier 0 has a single action.

## Wireframe (1280x720)

```
(0,0)
+--------------------------------------------------------------------------+
|  32 px safe margin                                                       |
|                                                                          |
|                        THE REBELLION            <- title, centre x=640,  |
|                  Fists of the Fallen City          y=150 (anchor mid)    |
|                                                  <- subtitle, y=230      |
|                                                                          |
|                                                                          |
|                    [ >  START GAME  < ]          <- button, centre        |
|                                                     x=640, y=420         |
|                                                     size 360 x 64        |
|                                                                          |
|                    [    CONTROLS     ]          <- optional, see below   |
|                                                     x=640, y=500         |
|                                                                          |
|                                                                          |
|  Enter / A : Select                                      v0.1  (bottom   |
|  <- prompt, bottom-left (32, 688)                        right 1248,688) |
+--------------------------------------------------------------------------+
                                                                  (1280,720)
```

Background: a static arena or city backdrop supplied by `art-direction-agent`, dimmed so text stays readable. Placeholder: flat fill.

## Layout table

| Element | Anchor | Position (px) | Size (px) | Notes |
|---|---|---|---|---|
| Background | top-left | 0,0 | 1280x720 | Static in Tier 0 |
| Title "The Rebellion" | top-centre | centre x=640, y=150 | max width 900 | Largest text on screen, 72 px or more |
| Subtitle "Fists of the Fallen City" | top-centre | centre x=640, y=230 | max width 700 | About 36 px |
| Start Game button | centre | centre x=640, y=420 | 360x64 | Default focus |
| Controls button (optional) | centre | centre x=640, y=500 | 360x64 | Opens a one-panel overlay listing bindings. Included only if the Controls overlay is approved (see OQ-M1). |
| Input prompt | bottom-left | left x=32, baseline y=688 | auto | Glyphs follow last-used device |
| Version tag | bottom-right | right x=1248, baseline y=688 | auto | 16 px or more, low emphasis |

Button spacing: 80 px between button centres, 16 px gap between button edges. Button text 28 px or more.

## Behaviour

- On load, focus is on **Start Game**.
- Start Game: 0.3 s fade to black, then start the level scene. HUD scene starts alongside it.
- Focus change: instant, with a short audible tick (asset requested from art/audio, not specified here).
- Title idle: no looping animation beyond a subtle focus pulse on the selected button (respect a reduced-motion setting if one is added later).
- First user input is required before any audio plays (browser autoplay rule). The menu therefore waits for any key, click or button press if audio is used. Flagged in OQ-M2.
- If no gamepad is connected, gamepad glyphs are not shown. When a gamepad connects, glyphs switch on the next gamepad input.

## Input map

| Action | Keyboard | Gamepad | Mouse |
|---|---|---|---|
| Focus next | Down, S | D-pad down, stick down | Hover |
| Focus previous | Up, W | D-pad up, stick up | Hover |
| Confirm | Enter, Space | A | Click |
| Back | Esc (no effect on this screen, closes the Controls overlay if open) | B (same) | Click outside overlay |

## Data needs

| Data | Source | Use |
|---|---|---|
| Game version string | build config | Version tag |
| Last-used input device | UI input layer | Prompt glyphs |
| (none from Game State) | n/a | The menu needs no live game data in Tier 0 |

Events consumed: none. Events emitted by the UI: `start-game-requested` (proposed). `menu-ui-agent` may instead call the scene manager directly if there is no listener.

## Later

- Options, Level Select, Credits, Continue, Quit (not meaningful in a browser).
- Animated title, character art for Zed.
- Best time or best result display.

## Open questions

- OQ-M1. Is a Controls/How-to-play overlay in Tier 0? The GDD lists many combat tools (light, heavy, block, dodge, parry, pick-ups), and a new player has no way to learn the bindings. Recommended yes, but it is a second menu item, so it needs approval. Bindings are also not yet defined (see `flow.md` OQ-F5).
- OQ-M2. Is audio in Tier 0? If yes, the menu needs a "press any key" gate for browser autoplay.
- OQ-M3. Does the title text come from art (a logo image) or live text? Depends on `art-direction-agent`.
