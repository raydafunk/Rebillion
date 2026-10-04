# UX Flow - Tier 0

Source of truth: `The Rebellion- Final Gdd.pdf` (core loop p.3, win/lose p.2, Menu & UI Agent p.5/7).
Style (palette, fonts, component look): `design/art/style-guide.md` from `art-direction-agent`. These specs define layout and behaviour only. No colours or fonts are fixed here.
Implementation owner: `menu-ui-agent` (`MenuScene`, `HudScene`, `ResultScene`, plus a pause overlay in `HudScene`).

## Assumptions

- **A1. Game resolution is 1280x720 (16:9).** This was assumed, not taken from the GDD, which gives no resolution. All positions are in game pixels, origin top-left (0,0), x right, y down. The Phaser config should use a FIT scale mode so everything scales uniformly. Confirm with `art-direction-agent`, who also lists resolution as an open question.
- **A2. Safe margin is 32 px** on all edges. No UI element may sit inside it except full-screen backdrops.
- **A3. Tier 0 has one level.** The core loop has "Next Level begins", but there is no second level to go to. The win screen therefore offers Play Again and Main Menu, and Next Level is deferred (see Later).
- **A4. Text sizes** are in game pixels at 1280x720. Minimum body text is 24 px. HUD numerals are 32 px or more. Final font comes from the style guide.

## Screen inventory (Tier 0)

| Screen | File | Phaser scene |
|---|---|---|
| Main menu | `main-menu.md` | `MenuScene` |
| HUD | `hud.md` | `HudScene` (runs in parallel over the arena scene) |
| Pause | `pause.md` | overlay in `HudScene` |
| Win | `win.md` | `ResultScene` (mode = win) |
| Lose | `lose.md` | `ResultScene` (mode = lose) |

## Flow diagram

```
                     +-------------+
      (boot) ------> |  MAIN MENU  | <------------------------+
                     +------+------+                          |
                            | Start Game                      |
                            v                                 |
                  +-------------------+                       |
        +-------> |  LEVEL (arena)    | <---+                 |
        |         |  HUD always on    |     |                 |
        |         +--+------+------+--+     |                 |
        |            |      |      |        |                 |
        |   Pause key|      |      |        | Resume          |
        |            v      |      |        |                 |
        |        +--------+ |      |        |                 |
        |        | PAUSE  |-+------+--------+                 |
        |        +---+----+ |      |                          |
        |            |Restart      |                          |
        |            | Level       |                          |
        |            +-----+       |                          |
        |                  |       |                          |
        |   all waves      |       | health = 0               |
        |   cleared        |       | OR timer = 0             |
        |   (round-won)    |       | (round-lost)             |
        |        v         |       v                          |
        |   +---------+    |   +---------+                    |
        |   |  WIN    |    |   |  LOSE   |                    |
        |   +--+---+--+    |   +--+---+--+                    |
        |      |   |       |      |   |                       |
        | Play |   +-------+------+---+-- Main Menu ----------+
        | Again|                  |
        +------+------------------+
                       Retry
```

Pause also offers Main Menu (not drawn, same target as above).

## Flow as a list

1. **Boot -> Main Menu.** Focus lands on Start Game.
2. **Main Menu -> Level** on Start Game. Short fade (0.3 s). Level begins with a 3-2-1-FIGHT intro. The timer starts at FIGHT, not before (see `hud.md`).
3. **Level -> Pause** on the pause input. Gameplay and the timer freeze.
4. **Pause -> Level** on Resume. A 3-2-1 countdown is not needed. Resume is immediate, with a 0.5 s grace window where the player takes no damage (open question OQ-F4).
5. **Pause -> Level (fresh)** on Restart Level. **Pause -> Main Menu** on Main Menu. Both show a confirm step, because they discard progress.
6. **Level -> Win** on `round-won`. Win screen explains the win (see `win.md`).
7. **Level -> Lose** on `round-lost`, with a reason of `health` or `time`. The lose screen states which (see `lose.md`).
8. **Win -> Play Again** gives a fresh level. **Win -> Main Menu**.
9. **Lose -> Retry** gives a fresh level, the same as Play Again. **Lose -> Main Menu**.

### Result-screen timing rule (applies to Win and Lose)

- On the end event, gameplay input is locked and the arena freezes or slow-motions for 0.6 s so the player sees the final hit or the zero timer.
- The result panel then fades in over 0.3 s.
- Buttons accept input only after a 0.5 s delay, so a button-mashing player does not skip the screen by accident.
- Retry is the default focus on Lose. Play Again is the default focus on Win. Retry should take less than 1 s to reach a playable state, which keeps the fail-retry loop fast.

## Global input map (all menus)

Gameplay bindings are not defined in the GDD. They are owned by Player Mechanics and are out of scope here. Only UI navigation is specified.

| Action | Keyboard | Gamepad (standard mapping) |
|---|---|---|
| Move focus up / down | Up / Down, W / S | D-pad up/down, left stick up/down |
| Move focus left / right (where horizontal) | Left / Right, A / D | D-pad left/right, left stick left/right |
| Confirm | Enter, Space | A (bottom face button) |
| Back / Cancel | Esc, Backspace | B (right face button) |
| Pause (in level only) | Esc, P | Start |
| Mouse | Hover sets focus, click confirms | n/a |

Rules:
- Input device is auto-detected on last input. Button prompts on screen show the last-used device's glyphs (keyboard labels or gamepad labels).
- Stick navigation uses a 0.5 dead zone with a 0.25 s initial repeat delay and a 0.1 s repeat rate.
- Focus wraps from the last item to the first, and the reverse.
- Exactly one item has focus at any time. The focus indicator must be visible without relying on colour alone (for example an arrow marker plus a size or outline change). Colours come from the style guide.
- Esc in a level pauses. Esc in the pause overlay resumes. Esc on the main menu does nothing (browser game, no quit).
- Held-key repeat on Confirm is ignored. Confirm fires on press, once.

## Events the UI needs (summary)

Existing names come from `menu-ui-agent.md`. The names marked **proposed** do not exist yet and need agreement with Game State, Wave Spawner and Health & Hitbox. Per-screen files list the payloads.

| Event | Status | Emitter |
|---|---|---|
| `player-health-changed` | existing | Health & Hitbox |
| `timer-tick` | existing | Game State (Timer) |
| `round-won` | existing | Game State |
| `round-lost` | existing | Game State |
| `wave-started` | proposed | Wave Spawner |
| `wave-cleared` | proposed | Wave Spawner |
| `enemies-remaining-changed` | proposed | Wave Spawner / Enemy |
| `round-started` | proposed | Game State |
| `game-paused` / `game-resumed` | proposed | Game State |
| `round-stats` | proposed | Game State |

## Later (deferred, not Tier 0)

- Next Level button, level select, and a campaign progress screen.
- Options menu (volume, key rebinding, fullscreen), Controls/How-to-play screen.
- Character progression screens (the pitch mentions "character progression").
- Score, rank, combo counter and combo-meter HUD, defensive-state indicators (parry window, block).
- Boss health bar, enemy health bars beyond the minimal one in `hud.md`, off-screen enemy indicators.
- Multiple lives or continues, leaderboards, pause-menu settings, localisation, mobile touch controls.

## Open questions (flow level)

- OQ-F1. What is the retry rule? The GDD says "fail and retry have rules" (Game State Agent, p.5) but gives none. This spec assumes unlimited retries, restarting the level from wave 1 at full health with a full timer.
- OQ-F2. Is there a Next Level in Tier 0? This spec assumes one level and hides Next Level.
- OQ-F3. Does the game remember progress across a browser reload? This spec assumes no.
- OQ-F4. Should resuming from pause give brief invulnerability? This spec proposes 0.5 s. Needs a Player Mechanics / Health decision.
- OQ-F5. Gameplay key and button bindings are not defined, so pause on Esc/P and Start may collide with them.
- OQ-F6. Is 1280x720 the confirmed resolution? Several agents depend on it.
