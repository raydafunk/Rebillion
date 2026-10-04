# Pause

Overlay in `HudScene`, drawn above the arena and HUD. Resolution assumption: 1280x720 (see `flow.md` A1). Style from `design/art/style-guide.md`.

The GDD does not mention a pause screen. It is included because `menu-ui-agent` lists it in Tier 0 scope and a timed game needs one (a timed fight with no pause punishes a real-world interruption). Flagged in OQ-P1.

## Purpose

Freeze the fight, including the timer, and give three clear exits. It must be fast to open and fast to leave.

## Wireframe (1280x720)

```
(0,0)
+--------------------------------------------------------------------------+
|  [ full-screen dim, 60% black, HUD dimmed to 40% beneath ]               |
|                                                                          |
|                   +----------------------------+                         |
|                   |         PAUSED             |  <- title, y=200        |
|                   |                            |                         |
|                   |    [ >  RESUME      < ]    |  <- y=300, 320x56       |
|                   |    [    RESTART LEVEL  ]   |  <- y=376               |
|                   |    [    MAIN MENU      ]   |  <- y=452               |
|                   |                            |                         |
|                   +----------------------------+                         |
|                    panel 480x360, centre (640,360)                       |
|                                                                          |
|  Enter / A : Select      Esc / B : Resume        <- prompts, bottom-left |
+--------------------------------------------------------------------------+
```

## Layout table

| Element | Anchor | Position (px) | Size (px) | Notes |
|---|---|---|---|---|
| Dim layer | top-left | 0,0 | 1280x720 | 60% opacity, blocks clicks to the arena |
| Panel | centre | centre 640,360 | 480x360 | Top y=180, bottom y=540 |
| Title "PAUSED" | panel top-centre | centre x=640, y=220 | auto | 48 px or more |
| Resume | centre | centre x=640, y=310 | 320x56 | Default focus |
| Restart Level | centre | centre x=640, y=386 | 320x56 | Needs confirm |
| Main Menu | centre | centre x=640, y=462 | 320x56 | Needs confirm |
| Input prompts | bottom-left | left x=32, baseline y=688 | auto | Glyphs follow last-used device |

Button spacing: 76 px between centres, 20 px gap between edges.

### Confirm sub-state (Restart Level and Main Menu)

Panel content is replaced in place, with no new screen.

```
        +----------------------------+
        |   Restart level?           |   (or "Leave to main menu?")
        |   Progress will be lost.   |
        |                            |
        |   [ >  CANCEL  < ] [ YES ] |   <- 2 buttons side by side
        +----------------------------+     centres x=550 and x=730, y=430, each 160x56
```

Default focus is **Cancel**, to avoid accidental loss. Horizontal navigation moves between the two buttons.

## Behaviour

- Open on the pause input (Esc, P, or gamepad Start) while the level is active. Not available during the intro countdown or the result freeze (0.6 s).
- On open, the arena, enemy AI, animations, particles and tweens, and the **timer** all stop. Audio ducks (volume reduced), if audio exists.
- Input from the game scene is ignored while paused. Held attack buttons are cleared on resume so no stray attack fires.
- Resume: closes the overlay and restores everything at once (OQ-F4 in `flow.md` covers a 0.5 s grace window).
- Restart Level: confirm, then start a fresh level exactly as Play Again does (wave 1, full health, full timer).
- Main Menu: confirm, then return to `MenuScene`.
- Losing window focus (browser tab blur) opens the pause overlay automatically. This protects the player from losing to the timer while away.
- Opening pause and resuming are instant (no transition longer than 0.1 s) so the fight rhythm is not broken.

## Input map

| Action | Keyboard | Gamepad | Mouse |
|---|---|---|---|
| Open pause (in level) | Esc, P | Start | n/a |
| Focus next / previous | Down, S / Up, W | D-pad or stick down / up | Hover |
| Confirm | Enter, Space | A | Click |
| Resume (shortcut) | Esc, P | B or Start | n/a |
| In confirm sub-state: left / right | Left, A / Right, D | D-pad / stick left / right | Hover |
| In confirm sub-state: Back = Cancel | Esc, Backspace | B | n/a |

## Data needs

| Data | Source | Use |
|---|---|---|
| `paused` | UI-owned, plus `game-paused` / `game-resumed` (proposed) | Tell Game State to stop the timer and Enemy/Wave agents to halt |
| Last-used input device | UI input layer | Prompt glyphs |

Events emitted: `pause-requested`, `resume-requested`, `restart-requested`, `quit-to-menu-requested` (all proposed). Game State is responsible for freezing the timer. The UI must never stop the clock itself.

## Later

- Options (volume, rebinding), Controls reference, current-run stats readout.
- Pause from the result screen (not needed).

## Open questions

- OQ-P1. Is a pause screen approved for Tier 0? The GDD lists only the main menu, HUD and win/lose in the Menu & UI row, and `menu-ui-agent` adds pause.
- OQ-P2. Does the timer freeze on pause? This spec says yes, which means it is not exploitable as a stalling tool, since the timer stops but so does the fight. Needs Timer owner confirmation.
- OQ-P3. Is auto-pause on window blur wanted? Recommended.
- OQ-P4. Should Restart Level skip the confirm step, given the stated goal of a fast fail-retry loop? This spec keeps confirm for a mid-fight restart only.
