# Playtest agents report (2026-11-03T12-44-13)

Seed 2. Each run is a goal-oriented agent pressing real keys; the monitor checks invariants every frame. Videos are in `videos/`.

## Bosses (playtest-boss-agent)

| Run | Persona | Level/Wave | Result | Time | HP left | Hits dealt/taken | Parries | Findings | Video |
|---|---|---|---|---|---|---|---|---|---|
| MB-L2-royce-solo<br>"Railgun" Royce (solo) | boss-hunter | L2 W5 | BOSS WAVE CLEARED | 42.9s | - | 41/1 | 1/1 | none | [MB-L2-royce-solo](videos/MB-L2-royce-solo.mp4) |
| EB-L2-royce-crew<br>"Railgun" Royce + crew (Level 2 finale) | boss-hunter | L2 W5 | LOSE (ko) | 27.7s | 0 | 21/11 | 4/9 | none | [EB-L2-royce-crew](videos/EB-L2-royce-crew.mp4) |

## Boss move read-out (bespoke boss AI)

| Run | Boss | Time to KO | Move | Seen | Hit Zed | Evaded | Damage to Zed |
|---|---|---|---|---|---|---|---|
| MB-L2-royce-solo | railgun-royce-1 | 10.1s | combo | 1 | 1 | 0 | 7 |
| MB-L2-royce-solo | railgun-royce-1 | 10.1s | slam | 1 | 0 | 1 | 0 |
| EB-L2-royce-crew | railgun-royce-1 | alive (19/160) | combo | 2 | 1 | 1 | 7 |
| EB-L2-royce-crew | railgun-royce-1 | alive (19/160) | slam | 2 | 0 | 1 | 0 |

## Findings

None. Every invariant held in every run.
