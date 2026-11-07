# Playtest agents report (2026-11-06T18-36-55)

Seed 1. Each run is a goal-oriented agent pressing real keys; the monitor checks invariants every frame. Videos are in `videos/`.

## Bosses (playtest-boss-agent)

| Run | Persona | Level/Wave | Result | Time | HP left | Hits dealt/taken | Parries | Findings | Video |
|---|---|---|---|---|---|---|---|---|---|
| MB-L5-raptor-solo<br>Raptor (Level 5 boss, solo) | boss-hunter | L5 W5 | LOSE (ko) | 48.9s | 0 | 0/12 | 2/11 | none | [MB-L5-raptor-solo](videos/MB-L5-raptor-solo.webm) |
| EB-L5-raptor-crew<br>Raptor + crew (Level 5 final wave) | boss-hunter | L5 W5 | LOSE (ko) | 67.5s | 0 | 0/12 | 6/21 | none | [EB-L5-raptor-crew](videos/EB-L5-raptor-crew.webm) |
| ADV-raptor-edge<br>Raptor vs Edge Exploiter | edge-exploiter | L5 W5 | WIN (cleared) | 49.9s | 90 | 40/2 | 0/0 | none | [ADV-raptor-edge](videos/ADV-raptor-edge.webm) |
| ADV-raptor-masher<br>Raptor vs Button Masher | button-masher | L5 W5 | LOSE (ko) | 45.0s | 0 | 8/12 | 1/0 | none | [ADV-raptor-masher](videos/ADV-raptor-masher.webm) |

## Boss move read-out (bespoke boss AI)

| Run | Boss | Time to KO | Move | Seen | Hit Zed | Evaded | Parried (boss stunned) | Damage to Zed |
|---|---|---|---|---|---|---|---|---|
| MB-L5-raptor-solo | raptor-1 | alive (320/320) | barrage | 1 | 2 | 0 | 0 | 10 |
| EB-L5-raptor-crew | raptor-1 | alive (320/320) | barrage | 1 | 2 | 0 | 0 | 10 |
| ADV-raptor-edge | raptor-1 | 29.0s | barrage | 1 | 2 | 0 | 0 | 10 |
| ADV-raptor-masher | raptor-1 | alive (270/320) | dive | 2 | 1 | 1 | 0 | 14 |
| ADV-raptor-masher | raptor-1 | alive (270/320) | barrage | 1 | 2 | 0 | 0 | 10 |

### Boss fight extras

- MB-L5-raptor-solo / raptor-1: stuns 0, steam patches laid 0, vent started with Zed airborne 0x, clock 209s left at first sight, ?s at KO, move order: barrage
- EB-L5-raptor-crew / raptor-1: stuns 0, steam patches laid 0, vent started with Zed airborne 0x, clock 209s left at first sight, ?s at KO, move order: barrage
- ADV-raptor-edge / raptor-1: stuns 0, steam patches laid 0, vent started with Zed airborne 0x, clock 209s left at first sight, 191s at KO, move order: barrage
- ADV-raptor-masher / raptor-1: stuns 0, steam patches laid 0, vent started with Zed airborne 0x, clock 209s left at first sight, ?s at KO, move order: dive > barrage > dive

## Findings

None. Every invariant held in every run.
