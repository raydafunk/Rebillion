# Playtest agents report (2026-11-03T16-50-58)

Seed 1. Each run is a goal-oriented agent pressing real keys; the monitor checks invariants every frame. Videos are in `videos/`.

## Levels (playtest-level-agent)

| Run | Persona | Level/Wave | Result | Time | HP left | Hits dealt/taken | Parries | Findings | Video |
|---|---|---|---|---|---|---|---|---|---|
| L2-brawler | brawler | L2 | WIN (cleared) | 136.8s | 100 | 184/8 | 5/6 | none | [L2-brawler](videos/L2-brawler.mp4) |
| L3-brawler | brawler | L3 | LOSE (ko) | 147.1s | 0 | 178/14 | 6/12 | none | [L3-brawler](videos/L3-brawler.mp4) |
| L4-brawler | brawler | L4 | WIN (cleared) | 110.4s | 100 | 106/0 | 0/0 | none | [L4-brawler](videos/L4-brawler.mp4) |
| L5-brawler | brawler | L5 | LOSE (ko) | 70.0s | 0 | 87/10 | 4/7 | none | [L5-brawler](videos/L5-brawler.mp4) |
| L6-brawler | brawler | L6 | WIN (cleared) | 139.7s | 100 | 176/4 | 1/4 | none | [L6-brawler](videos/L6-brawler.mp4) |
| L7-brawler | brawler | L7 | WIN (cleared) | 106.4s | 100 | 140/0 | 4/4 | none | [L7-brawler](videos/L7-brawler.mp4) |
| L8-brawler | brawler | L8 | WIN (cleared) | 124.7s | 92 | 138/4 | 2/3 | none | [L8-brawler](videos/L8-brawler.mp4) |

## Boss move read-out (bespoke boss AI)

| Run | Boss | Time to KO | Move | Seen | Hit Zed | Evaded | Damage to Zed |
|---|---|---|---|---|---|---|---|
| L2-brawler | railgun-royce-31 | 22.9s | combo | 3 | 5 | 0 | 35 |
| L2-brawler | railgun-royce-31 | 22.9s | slam | 3 | 1 | 2 | 15 |

## Findings

None. Every invariant held in every run.
