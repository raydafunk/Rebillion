# Win Screen

Scene: `ResultScene` (mode = win). Resolution assumption: 1280x720 (see `flow.md` A1). Style from `design/art/style-guide.md`.

## Purpose

Tell the player they won **and why**. The GDD win condition is: "Fight your way to the end of the level while beating Rust enemies" and "Defeat Wave / Clear Arena ... in time". The screen must show that the arena was cleared and that it was done in time, using real numbers from the run.

## Wireframe (1280x720)

```
(0,0)
+--------------------------------------------------------------------------+
|  [ frozen arena visible behind, dimmed 50% ]                             |
|                                                                          |
|                         LEVEL CLEARED          <- headline, y=130        |
|            Rust has been driven out of the arena.  <- reason line, y=190 |
|                                                                          |
|        +------------------------------------------------+                |
|        |  WAVES CLEARED        4 / 4                    |  <- stats panel|
|        |  ENEMIES DEFEATED     18                       |     centre     |
|        |  TIME REMAINING       00:41  (of 02:00)        |     (640,380)  |
|        |  HEALTH REMAINING     64 / 100                 |     720x240    |
|        +------------------------------------------------+                |
|                                                                          |
|              [ >  PLAY AGAIN  < ]    [  MAIN MENU  ]    <- y=600         |
|                                                                          |
|  Enter / A : Select                                                      |
+--------------------------------------------------------------------------+
```

## Layout table

| Element | Anchor | Position (px) | Size (px) | Notes |
|---|---|---|---|---|
| Dim layer | top-left | 0,0 | 1280x720 | 50% opacity over the frozen arena |
| Headline | top-centre | centre x=640, y=130 | max 900 | "LEVEL CLEARED", 64 px or more |
| Reason line | top-centre | centre x=640, y=190 | max 900 | 28 px. Plain-language reason for winning (see Reason text) |
| Stats panel | centre | centre 640,380 | 720x240 | Top y=260, bottom y=500. 4 rows, 60 px per row, label left-aligned at x=300, value right-aligned at x=980 |
| Play Again | bottom-centre | centre x=500, y=600 | 280x64 | Default focus |
| Main Menu | bottom-centre | centre x=800, y=600 | 280x64 | |
| Input prompt | bottom-left | left x=32, baseline y=688 | auto | |

Buttons sit side by side with a 40 px gap. Left/Right moves focus.

## Reason text

The win has one cause in Tier 0, so the reason line is fixed copy plus the proof in the stats panel:

- Headline: "LEVEL CLEARED"
- Reason line: "All Rust enemies defeated with time to spare." (When the timer data exists, show the time-left row; this makes "in time" visible.)

If a later rule adds more win types (for example reaching a level exit, which the GDD's "Fight your way to the end of the level" phrase suggests), the reason line switches by `winReason` (see Data needs).

## Behaviour

- Triggered by `round-won`. Gameplay input is locked. Arena freezes for 0.6 s, then the panel fades in over 0.3 s (see `flow.md` result-screen timing rule).
- Stats rows count up from zero over 0.6 s total, staggered 0.1 s per row, and can be skipped by pressing Confirm once. A second press activates the focused button (the 0.5 s input delay applies first).
- Time Remaining shows the timer's final value, and the starting limit in smaller text.
- Play Again: fade 0.3 s, fresh level (wave 1, full health, full timer).
- Main Menu: fade 0.3 s, return to `MenuScene`.
- No Next Level button in Tier 0 (see `flow.md` A3).

## Input map

| Action | Keyboard | Gamepad | Mouse |
|---|---|---|---|
| Focus left / right | Left, A / Right, D | D-pad or stick left / right | Hover |
| Confirm | Enter, Space | A | Click |
| Skip stat count-up | Enter, Space | A | Click |
| Back | Esc: moves focus to Main Menu (no instant exit) | B: same | n/a |

## Data needs

Delivered once with `round-won` or in a `round-stats` event (proposed), so the screen does not need to read live game state.

| Data | Type | Source | Notes |
|---|---|---|---|
| `winReason` | enum: `arena-cleared` (Tier 0 only value) | Game State | Future: `reached-exit` |
| `wavesCleared` | number | Wave Spawner / Game State | |
| `waveTotal` | number | Wave Spawner | |
| `enemiesDefeated` | number | Enemy / Game State | |
| `secondsRemaining` | number | Timer | Value at the moment of the win |
| `timeLimitSeconds` | number | Game State | For the "(of 02:00)" text |
| `currentHealth` | number | Health & Hitbox | At the moment of the win |
| `maxHealth` | number | Health & Hitbox | |

## Later

- Next Level button, rank or grade, score, best time, new-record callout.
- Combo stats (highest combo, parries), unlocks and progression rewards.
- Story beat or art after a win.

## Open questions

- OQ-W1. What exactly is the win condition: clear all waves, or reach an end-of-level point? The GDD says both "Fight your way to the end of the level while beating Rust Enemies" (p.2) and "Defeat Wave / Clear Arena" (p.2, p.4). The core loop (p.3) shows "Wave Cleared -> Level Won, Reach the end". This spec assumes the arena clearing is the win, which makes the "reached exit" reason a Later item.
- OQ-W2. Are the four stats the right ones? They are the minimum to show "why" and are cheap, but each needs an emitter. If any is unavailable, drop the row rather than showing 0.
- OQ-W3. Is there a Next Level for Tier 0? (`flow.md` OQ-F2.)
- OQ-W4. Should a win need a time-remaining bonus or grade to give the player a reason to replay (pillar 2, skill depth)? Deferred, but the data above already supports it.
