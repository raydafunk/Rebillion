# Playtest agents report (2026-11-02T13-59-33)

Seed 1. Each run is a goal-oriented agent pressing real keys; the monitor checks invariants every frame. Videos are in `videos/`.

## Levels (playtest-level-agent)

| Run | Persona | Level/Wave | Result | Time | HP left | Hits dealt/taken | Parries | Findings | Video |
|---|---|---|---|---|---|---|---|---|---|
| L2-brawler | brawler | L2 | WIN (cleared) | 75.5s | 100 | 77/1 | 4/4 | none | [L2-brawler](videos/L2-brawler.mp4) |
| L6-parry-master | parry-master | L6 | WIN (cleared) | 100.8s | 94 | 115/7 | 5/9 | none | [L6-parry-master](videos/L6-parry-master.mp4) |

## Bosses (playtest-boss-agent)

| Run | Persona | Level/Wave | Result | Time | HP left | Hits dealt/taken | Parries | Findings | Video |
|---|---|---|---|---|---|---|---|---|---|
| MB-dugan-solo<br>"Brick" Dugan (solo) | boss-hunter | L1 W5 | WIN (cleared) | 43.1s | 56 | 38/3 | 1/1 | none | [MB-dugan-solo](videos/MB-dugan-solo.mp4) |

## Boss move read-out (bespoke boss AI)

| Run | Boss | Time to KO | Move | Seen | Hit Zed | Evaded | Damage to Zed |
|---|---|---|---|---|---|---|---|
| MB-dugan-solo | brick-dugan-1 | 28.1s | charge | 2 | 0 | 2 | 0 |
| MB-dugan-solo | brick-dugan-1 | 28.1s | stomp | 2 | 2 | 0 | 28 |
| MB-dugan-solo | brick-dugan-1 | 28.1s | punch | 1 | 1 | 0 | 16 |
| MB-dugan-solo | brick-dugan-1 | 28.1s | rage | 1 | 0 | 1 | 0 |

## Findings

None. Every invariant held in every run.
