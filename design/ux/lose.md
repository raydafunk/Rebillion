# Lose Screen

Scene: `ResultScene` (mode = lose). Resolution assumption: 1280x720 (see `flow.md` A1). Style from `design/art/style-guide.md`.

## Purpose

Tell the player they lost and **exactly why**, then get them back into the fight in one press. The GDD lose condition is: "Get knocked out by health bar or if time runs out" (p.2). These are two distinct reasons with two distinct messages. The tone is encouraging, not punishing: the theme is hopeful and energetic, and the loop depends on fast retries.

## Wireframe (1280x720)

```
(0,0)
+--------------------------------------------------------------------------+
|  [ frozen arena visible behind, dimmed 60% ]                             |
|                                                                          |
|                        KNOCKED OUT              <- headline, y=130       |
|                (or: TIME'S UP)                                           |
|        You ran out of health on wave 3 of 4.   <- reason line, y=190     |
|        (or: Time ran out with 4 enemies left.)                           |
|                                                                          |
|        +------------------------------------------------+                |
|        |  REACHED WAVE         3 / 4                    |  <- stats panel|
|        |  ENEMIES DEFEATED     11                       |     (640,380)  |
|        |  ENEMIES LEFT         4                        |     720x240    |
|        |  TIME REMAINING       00:00 / 00:48            |                |
|        +------------------------------------------------+                |
|                                                                          |
|              [ >  RETRY  < ]    [  MAIN MENU  ]         <- y=600         |
|                                                                          |
|  Enter / A : Select                                                      |
+--------------------------------------------------------------------------+
```

Stats panel rows differ slightly by reason (see below). Panel geometry is identical to `win.md` so `ResultScene` can share one layout.

## Layout table

| Element | Anchor | Position (px) | Size (px) | Notes |
|---|---|---|---|---|
| Dim layer | top-left | 0,0 | 1280x720 | 60% opacity over the frozen arena |
| Headline | top-centre | centre x=640, y=130 | max 900 | 64 px or more, text depends on `loseReason` |
| Reason line | top-centre | centre x=640, y=190 | max 900 | 28 px, text built from live numbers |
| Stats panel | centre | centre 640,380 | 720x240 | Top y=260, bottom y=500. 4 rows, 60 px per row, label left at x=300, value right at x=980 |
| Retry | bottom-centre | centre x=500, y=600 | 280x64 | Default focus |
| Main Menu | bottom-centre | centre x=800, y=600 | 280x64 | |
| Input prompt | bottom-left | left x=32, baseline y=688 | auto | |

## Reason text (the "why")

| `loseReason` | Headline | Reason line | Highlighted row |
|---|---|---|---|
| `health` | KNOCKED OUT | "Zed's health ran out on wave {waveIndex} of {waveTotal}." | Reached Wave |
| `time` | TIME'S UP | "Time ran out with {enemiesRemaining} Rust enemies still standing." | Time Remaining (shows 00:00) and Enemies Left |
| `failsafe` (if the Camera & Bounds failsafe ends a round, see OQ-L2) | ROUND OVER | "A Rust enemy could not be reached." | Enemies Left |

Rules:
- The headline and the reason line are always both shown, so the reason is stated in words and in numbers.
- The highlighted row uses an emphasis style (weight or marker, not only colour).
- If both conditions happen on the same frame, health takes priority (the player was knocked out). This is a proposal (OQ-L3).
- Optional single tip line under the panel, 22 px, chosen by reason: for `health` "Try blocking or dodging when the wave swarms."; for `time` "Press the attack, clear faster." Tips are placeholder copy to be approved (OQ-L4). Tips support the pillars (defence, pressure) and are the only advice shown.

## Behaviour

- Triggered by `round-lost` with a `loseReason` payload. Gameplay input locked. The arena freezes for 0.6 s: on `health` the final hit and the KO animation play out, on `time` the timer shows 00:00. Then the panel fades in over 0.3 s.
- Stats appear immediately (no count-up, to keep the retry loop fast).
- Retry: fade 0.2 s, fresh level (wave 1, full health, full timer), with the 3-2-1-FIGHT intro shortened to the FIGHT call only on retry (proposal, OQ-L5). Target under 1 s from press to control.
- Main Menu: fade 0.3 s, return to `MenuScene`.
- Retry is always available and unlimited (see `flow.md` OQ-F1).

## Input map

| Action | Keyboard | Gamepad | Mouse |
|---|---|---|---|
| Focus left / right | Left, A / Right, D | D-pad or stick left / right | Hover |
| Confirm | Enter, Space | A | Click |
| Quick retry | R (works anywhere on this screen) | Y | n/a |
| Back | Esc: moves focus to Main Menu (no instant exit) | B: same | n/a |

Quick retry is optional and exists to serve the fast-retry loop. It is a proposal (OQ-L5).

## Data needs

Delivered once with `round-lost` or in `round-stats` (proposed).

| Data | Type | Source | Notes |
|---|---|---|---|
| `loseReason` | enum: `health`, `time` (and `failsafe` if approved) | Game State | Required. Without this the screen cannot say why. |
| `waveIndex` | number | Wave Spawner | Wave reached when the round ended |
| `waveTotal` | number | Wave Spawner | |
| `enemiesDefeated` | number | Enemy / Game State | |
| `enemiesRemaining` | number | Wave Spawner / Enemy | In the current wave, plus unspawned if known |
| `secondsRemaining` | number | Timer | 0 when `loseReason` = `time` |
| `timeLimitSeconds` | number | Game State | |

## Later

- Continues or lives, "closest you got" best-attempt comparison.
- Per-reason tips driven by data (for example "You took most damage from X").
- Death-cam replay or highlight of the killing blow.

## Open questions

- OQ-L1. Does the lose reason payload exist? The `round-lost` event named in `menu-ui-agent.md` has no reason field defined. Game State must supply `loseReason`. The GDD lists "time-out result" as a separate Game State output (p.5), which suggests it does.
- OQ-L2. What happens to the "unreachable-enemy failsafe" (Camera & Bounds Agent, p.5)? Does it teleport the enemy, auto-defeat it, or end the round? This spec lists `failsafe` as a conditional reason only. Remove it if the failsafe resolves silently.
- OQ-L3. If health and the timer hit zero on the same frame, which wins? Proposed: health.
- OQ-L4. Is tip copy wanted, and who writes it?
- OQ-L5. Is the quick-retry shortcut and the shortened intro on retry approved? Both shorten the loop but add a binding and a special case.
- OQ-L6. The retry rule itself is undefined in the GDD (see `flow.md` OQ-F1): unlimited retries from wave 1 is assumed, with no penalty and no checkpoint.
