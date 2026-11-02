# Playtest agents report (2026-11-02T15-00-25)

Seed 4. Each run is a goal-oriented agent pressing real keys; the monitor checks invariants every frame. Videos are in `videos/`.

## Levels (playtest-level-agent)

| Run | Persona | Level/Wave | Result | Time | HP left | Hits dealt/taken | Parries | Findings | Video |
|---|---|---|---|---|---|---|---|---|---|
| L1-brawler | brawler | L1 | WIN (cleared) | 161.5s | 75 | 207/12 | 4/7 | none | [L1-brawler](videos/L1-brawler.mp4) |
| L1-rookie | rookie | L1 | WIN (cleared) | 143.9s | 81 | 202/3 | 2/2 | none | [L1-rookie](videos/L1-rookie.mp4) |

## Bosses (playtest-boss-agent)

| Run | Persona | Level/Wave | Result | Time | HP left | Hits dealt/taken | Parries | Findings | Video |
|---|---|---|---|---|---|---|---|---|---|
| EB-L1-dugan-crew<br>"Brick" Dugan + crew (Level 1 finale) | boss-hunter | L1 W5 | WIN (cleared) | 55.0s | 86 | 50/1 | 3/3 | none | [EB-L1-dugan-crew](videos/EB-L1-dugan-crew.mp4) |

## Boss move read-out (bespoke boss AI)

| Run | Boss | Time to KO | Move | Seen | Hit Zed | Evaded | Damage to Zed |
|---|---|---|---|---|---|---|---|
| L1-brawler | brick-dugan-26 | 39.3s | charge | 3 | 0 | 3 | 0 |
| L1-brawler | brick-dugan-26 | 39.3s | stomp | 2 | 2 | 0 | 28 |
| L1-brawler | brick-dugan-26 | 39.3s | grab | 2 | 0 | 2 | 0 |
| L1-brawler | brick-dugan-26 | 39.3s | rage | 1 | 1 | 0 | 35 |
| L1-rookie | brick-dugan-26 | 37.0s | charge | 3 | 0 | 3 | 0 |
| L1-rookie | brick-dugan-26 | 37.0s | stomp | 2 | 2 | 0 | 28 |
| L1-rookie | brick-dugan-26 | 37.0s | punch | 1 | 0 | 1 | 0 |
| L1-rookie | brick-dugan-26 | 37.0s | grab | 1 | 0 | 1 | 0 |
| L1-rookie | brick-dugan-26 | 37.0s | rage | 1 | 1 | 0 | 35 |
| EB-L1-dugan-crew | brick-dugan-1 | 37.1s | charge | 3 | 0 | 3 | 0 |
| EB-L1-dugan-crew | brick-dugan-1 | 37.1s | stomp | 1 | 1 | 0 | 14 |
| EB-L1-dugan-crew | brick-dugan-1 | 37.1s | punch | 2 | 0 | 2 | 0 |
| EB-L1-dugan-crew | brick-dugan-1 | 37.1s | grab | 2 | 0 | 2 | 0 |
| EB-L1-dugan-crew | brick-dugan-1 | 37.1s | rage | 1 | 0 | 1 | 0 |

## Findings

None. Every invariant held in every run.
