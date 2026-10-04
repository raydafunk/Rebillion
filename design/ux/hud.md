# HUD

Scene: `HudScene`, running in parallel above the arena scene. Resolution assumption: 1280x720 (see `flow.md` A1). Style from `design/art/style-guide.md`.

## Purpose

Pillar 3 is "wave-clearing under pressure", so the player must always know three things at a glance, with no clutter over the action:

1. **Health** - how close am I to losing?
2. **Timer** - how long do I have left? (the GDD lists "time runs out" as a lose condition)
3. **Wave** - how far through the fight am I, and how much is left?

Nothing else is shown in Tier 0. Every extra element needs a Tier 1 justification.

## Wireframe (1280x720)

```
(0,0)
+----------------------------------------------------------------------------------+
| (32,24)                          (640,24)                            (1248,24)   |
| ZED                              WAVE 2 / 4                              01:23   |
| [#########-----------]           ENEMIES LEFT: 5                      (timer,    |
|  health bar 360x28                                                    right-     |
|  (left-aligned)                  (top-centre block)                   aligned)   |
|                                                                                  |
|                                                                                  |
|                                                                                  |
|                       ARENA ACTION ZONE: keep clear                              |
|                       (y 120 to 660, full width)                                 |
|                                                                                  |
|                                                                                  |
|                                                                                  |
|                                                                                  |
|                                                                                  |
|                                                                                  |
|                                                                   (bottom 60 px  |
|                                                                    left clear)   |
+----------------------------------------------------------------------------------+
```

Top band: y 0 to 96. Everything in the HUD lives in this band. The rest of the screen is reserved for action. Transient banners (see Wave banner) are the only exception.

## Layout table

| Element | Anchor | Position (px) | Size (px) | Notes |
|---|---|---|---|---|
| Health block | top-left | left x=32, top y=24 | 360x56 total | Label "ZED" (24 px) above, bar below |
| Health bar | within block | x=32, y=52 | 360x28 | Fill shrinks right to left. Numeric "HP 72/100" optional at right of bar, 20 px (see OQ-H3) |
| Wave block | top-centre | centre x=640, top y=24 | 320x56 | Line 1: "WAVE 2 / 4" (32 px). Line 2: "ENEMIES LEFT: 5" (22 px) |
| Timer | top-right | right x=1248, top y=24 | 160x48 | "MM:SS", 40 px, tabular (fixed-width) digits so it does not jitter |
| Wave banner (transient) | centre | centre x=640, y=240 | max 640x96 | "WAVE 3" for 1.2 s at wave start, then fades 0.3 s. No input blocking. |
| Pause hint (optional) | bottom-right | right x=1248, baseline y=688 | auto | Small, shown for the first 5 s only (see OQ-H5) |

Health bar sits left because the player character commonly starts left and reads left-to-right. Timer sits right so that the two critical survival numbers frame the wave info in the middle. HUD is anchored to the viewport, not the world, and does not move with the camera.

The HUD must not overlap the action zone. The arena camera and floor (Camera & Bounds Agent) should keep characters below y=120 where possible. Flagged in OQ-H4.

## Reactions

### Health

| State | Trigger | Reaction |
|---|---|---|
| Normal | health > 50% | Static bar |
| Damage taken | any decrease | Bar fill drops immediately. A trailing "ghost" segment (damage chunk) shrinks over 0.4 s to show how much was lost. Bar does a 2 px, 0.1 s shake (not on every tick of continuous damage; at most once per 0.15 s). |
| Heal | any increase (if pick-ups heal, see OQ-H2) | Fill grows over 0.2 s |
| Low health | health <= 25% | Bar pulses (flash between normal and alert look) at 2 Hz, and a persistent alert icon or label "LOW" appears beside the bar. The pulse uses shape or brightness, not only hue. Optional faint screen-edge vignette at 20% opacity, never covering the centre. |
| Critical | health <= 10% | Pulse rate rises to 4 Hz |
| Zero | health = 0 | Bar empties, pulse stops, HUD stays visible until the result screen takes over (0.6 s) |

Thresholds (25%, 10%) are proposals, not GDD values.

### Timer

| State | Trigger | Reaction |
|---|---|---|
| Normal | more than 30 s left | Static |
| Warning | 30 s or less | Timer takes warning look, and the digits stop being plain (for example bold or larger) |
| Last 10 seconds | 10 s or less | Digits pulse at 1 Hz and scale 100% to 115%. On each whole second, a short tick sound (audio TBD). The timer shows whole seconds only (no tenths), to avoid visual noise. |
| Zero | 0 s | Timer shows 00:00 and holds. `round-lost` follows. |

The 30 s and 10 s thresholds are proposals. The 10 s warning matches the brief. The 30 s step is optional and can be dropped.

### Wave

| State | Trigger | Reaction |
|---|---|---|
| Wave start | `wave-started` | Wave number updates, centre banner "WAVE N" for 1.2 s. If it is the final wave, banner reads "FINAL WAVE". |
| Enemy killed | `enemies-remaining-changed` | Count decrements with a quick 0.1 s scale pop. |
| Wave cleared | `wave-cleared` | Line 2 changes to "WAVE CLEARED" for 1 s. If more waves follow, next banner follows. |
| Last enemy of final wave | remaining = 1 | Optional emphasis, deferred. |

## Clutter rules

- Maximum 3 persistent elements (health, wave, timer). No icons, minimap, combo counter or score in Tier 0.
- HUD text must be readable over any arena background: each element gets a backing plate or outline, as set by the style guide, at 60 to 70% opacity.
- Banners never block input and never cover the player. The wave banner is at y=240, above the usual fighting line (check against the art-chosen floor height, OQ-H4).
- No more than one transient banner at a time. A new banner replaces the old one.
- All motion respects a future reduced-motion flag (pulses become a static change of look).

## States of the HUD scene

| State | Visible | Notes |
|---|---|---|
| Intro (3-2-1-FIGHT) | Health full, timer shows full time but frozen, wave shows "WAVE 1" | Countdown text uses the centre banner slot |
| Active | All three elements | Timer runs |
| Paused | All three elements dimmed 40%, pause overlay on top | Timer frozen |
| Round end | Frozen for 0.6 s, then hidden under result screen | |

## Data needs

| Data | Type | Source / event | Notes |
|---|---|---|---|
| `currentHealth` | number | `player-health-changed` | Payload should include `current`, `max` |
| `maxHealth` | number | `player-health-changed` | Needed for bar ratio and thresholds |
| `secondsRemaining` | number | `timer-tick` | Integer seconds are enough. Fires at least once per second. |
| `timeLimitSeconds` | number | `round-started` (proposed) | For the initial display and for "per-wave or per-level" handling |
| `waveIndex` | number (1-based) | `wave-started` (proposed) | |
| `waveTotal` | number | `round-started` or `wave-started` (proposed) | If waves are endless or random, show "WAVE N" only (OQ-H6) |
| `enemiesRemaining` | number | `enemies-remaining-changed` (proposed) | In the current wave, including enemies not yet spawned if the spawner has a queue |
| `isFinalWave` | boolean | `wave-started` (proposed) | For the "FINAL WAVE" banner |
| `paused` | boolean | `game-paused` / `game-resumed` (proposed) | |

The HUD reads only. It never changes health, timer or wave state.

## Input map

The HUD is not interactive and takes no focus. The only HUD-related input is pause.

| Action | Keyboard | Gamepad |
|---|---|---|
| Pause | Esc, P | Start |

## Later

- Combo counter and hit-chain display (pillar 2, "skill depth").
- Parry/block and cooldown indicators.
- Enemy health bars (a thin bar over the targeted enemy is the first likely addition).
- Score or rank, pick-up/weapon icon when a pick-up object is held (the GDD mentions light and heavy pick-up objects, so this one may be needed sooner, see OQ-H7).
- Off-screen enemy indicator (relevant to the "unreachable-enemy failsafe" owned by Camera & Bounds).
- Screen-edge damage indicators, boss bar, multi-player HUD.

## Open questions

- OQ-H1. What is the time limit and is it per level or per wave? The GDD says "win the level in time frame" and "time runs out" but gives no value and no scope. The timer format and the 30 s / 10 s thresholds depend on it. If the limit is under 30 s or per wave, the warning tiers must be rescaled.
- OQ-H2. Do pick-ups heal? If so the health bar needs a heal reaction (shown above as conditional).
- OQ-H3. Show numeric HP as well as the bar? Recommendation: bar only. The ghost segment communicates loss faster than numbers. Needs a call from the Health & Hitbox owner on whether health is a clean 100 or varies.
- OQ-H4. What are the camera and floor rules? The HUD reserves y 0 to 96 and the wave banner uses y=240. Needs confirmation of where characters stand (Camera & Bounds Agent).
- OQ-H5. Is the pause hint wanted? It adds a fourth element during the first 5 s only.
- OQ-H6. How many waves are there, or are they endless? The GDD gives no wave count. "WAVE 2 / 4" is a placeholder.
- OQ-H7. Do held pick-up objects need a HUD slot? The GDD names pick-up objects but not how they are shown.
- OQ-H8. Is there only one enemy type in Tier 0 (the Technical Strategy says "one enemy type first")? The wave counter assumes enemies are countable.
