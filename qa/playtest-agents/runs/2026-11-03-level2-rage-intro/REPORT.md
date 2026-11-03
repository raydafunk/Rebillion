# Playtest agents report (2026-11-03T18-19-26)

Seed 1. Each run is a goal-oriented agent pressing real keys; the monitor checks invariants every frame. Videos are in `videos/`.

## Levels (playtest-level-agent)

| Run | Persona | Level/Wave | Result | Time | HP left | Hits dealt/taken | Parries | Findings | Video |
|---|---|---|---|---|---|---|---|---|---|
| L2-brawler | brawler | L2 | LOSE (ko) | 106.6s | 0 | 160/11 | 3/6 | none | [L2-brawler](videos/L2-brawler.mp4) |

## Boss move read-out (bespoke boss AI)

| Run | Boss | Time to KO | Move | Seen | Hit Zed | Evaded | Damage to Zed |
|---|---|---|---|---|---|---|---|
| L2-brawler | railgun-royce-31 | alive (23/160) | combo | 2 | 4 | 0 | 28 |
| L2-brawler | railgun-royce-31 | alive (23/160) | slam | 1 | 0 | 1 | 0 |

## Findings

None. Every invariant held in every run.

## Rage intro card check (Level 2) - playtest-level-agent

Run `L2-brawler`, seed 1, canvas renderer, `--no-blackboard` (G7 was already `done`, 2/2 attempts, so the board was left untouched). `npm test`: 171/171 pass.

| Check | Result |
|---|---|
| Card appears on Level 2 after the level intro card, before wave 1 | PASS (video ~8.5 s) |
| Header, 4 copy lines, L keycap, flame emblem, "Enter / click to fight on" prompt present | PASS |
| Copy numbers match config (READY 4 s, Rage 9 s) | PASS |
| Rage clocks frozen while card is up (meter empty, round not started) | PASS |
| Dismissed by Enter; "FIGHT!" follows, no stuck state | PASS |
| Text fits inside the card without collision | **FAIL (S3)**: see RAGE-001 |

Screenshot: `rage-intro-card-L2-brawler-8.6s.png`. Evidence: `videos/L2-brawler.mp4` ~8.6 s.

Note: this seed lost to KO (Royce 23/160 alive); the earlier 16:50 run won. Balance data, not a bug. No invariant findings (S1:0 S2:0).
