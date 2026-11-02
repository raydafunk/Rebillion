# Playtest agents report (2026-11-02T13-54-57)

Seed 3. Each run is a goal-oriented agent pressing real keys; the monitor checks invariants every frame. Videos are in `videos/`.

## Levels (playtest-level-agent)

| Run | Persona | Level/Wave | Result | Time | HP left | Hits dealt/taken | Parries | Findings | Video |
|---|---|---|---|---|---|---|---|---|---|
| L1-brawler | brawler | L1 | WIN (cleared) | 167.1s | 66 | 211/13 | 8/12 | none | [L1-brawler](videos/L1-brawler.mp4) |

## Bosses (playtest-boss-agent)

| Run | Persona | Level/Wave | Result | Time | HP left | Hits dealt/taken | Parries | Findings | Video |
|---|---|---|---|---|---|---|---|---|---|
| EB-L1-dugan-crew<br>"Brick" Dugan + crew (Level 1 finale) | boss-hunter | L1 W5 | WIN (cleared) | 49.1s | 37 | 52/3 | 3/3 | none | [EB-L1-dugan-crew](videos/EB-L1-dugan-crew.mp4) |

## Boss move read-out (bespoke boss AI)

| Run | Boss | Time to KO | Move | Seen | Hit Zed | Evaded | Damage to Zed |
|---|---|---|---|---|---|---|---|
| L1-brawler | brick-dugan-26 | 28.7s | charge | 2 | 0 | 2 | 0 |
| L1-brawler | brick-dugan-26 | 28.7s | stomp | 1 | 1 | 0 | 14 |
| L1-brawler | brick-dugan-26 | 28.7s | grab | 2 | 0 | 2 | 0 |
| L1-brawler | brick-dugan-26 | 28.7s | rage | 1 | 1 | 0 | 35 |
| EB-L1-dugan-crew | brick-dugan-1 | 34.1s | charge | 2 | 0 | 2 | 0 |
| EB-L1-dugan-crew | brick-dugan-1 | 34.1s | stomp | 2 | 2 | 0 | 28 |
| EB-L1-dugan-crew | brick-dugan-1 | 34.1s | punch | 1 | 0 | 1 | 0 |
| EB-L1-dugan-crew | brick-dugan-1 | 34.1s | grab | 1 | 0 | 1 | 0 |
| EB-L1-dugan-crew | brick-dugan-1 | 34.1s | rage | 1 | 1 | 0 | 35 |

## Findings

None. Every invariant held in every run.
