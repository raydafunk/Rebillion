# Playtest agents report (2026-11-02T13-50-57)

Seed 2. Each run is a goal-oriented agent pressing real keys; the monitor checks invariants every frame. Videos are in `videos/`.

## Levels (playtest-level-agent)

| Run | Persona | Level/Wave | Result | Time | HP left | Hits dealt/taken | Parries | Findings | Video |
|---|---|---|---|---|---|---|---|---|---|
| L1-brawler | brawler | L1 | WIN (cleared) | 140.1s | 100 | 205/6 | 4/5 | none | [L1-brawler](videos/L1-brawler.mp4) |

## Bosses (playtest-boss-agent)

| Run | Persona | Level/Wave | Result | Time | HP left | Hits dealt/taken | Parries | Findings | Video |
|---|---|---|---|---|---|---|---|---|---|
| EB-L1-dugan-crew<br>"Brick" Dugan + crew (Level 1 finale) | boss-hunter | L1 W5 | WIN (cleared) | 47.0s | 86 | 50/1 | 3/4 | none | [EB-L1-dugan-crew](videos/EB-L1-dugan-crew.mp4) |

## Boss move read-out (bespoke boss AI)

| Run | Boss | Time to KO | Move | Seen | Hit Zed | Evaded | Damage to Zed |
|---|---|---|---|---|---|---|---|
| L1-brawler | brick-dugan-26 | 24.9s | charge | 2 | 0 | 2 | 0 |
| L1-brawler | brick-dugan-26 | 24.9s | stomp | 1 | 1 | 0 | 14 |
| L1-brawler | brick-dugan-26 | 24.9s | grab | 1 | 0 | 1 | 0 |
| L1-brawler | brick-dugan-26 | 24.9s | rage | 1 | 0 | 1 | 0 |
| EB-L1-dugan-crew | brick-dugan-1 | 32.0s | charge | 2 | 0 | 2 | 0 |
| EB-L1-dugan-crew | brick-dugan-1 | 32.0s | stomp | 1 | 1 | 0 | 14 |
| EB-L1-dugan-crew | brick-dugan-1 | 32.0s | punch | 2 | 0 | 2 | 0 |
| EB-L1-dugan-crew | brick-dugan-1 | 32.0s | grab | 1 | 0 | 1 | 0 |
| EB-L1-dugan-crew | brick-dugan-1 | 32.0s | rage | 1 | 0 | 1 | 0 |

## Findings

None. Every invariant held in every run.
