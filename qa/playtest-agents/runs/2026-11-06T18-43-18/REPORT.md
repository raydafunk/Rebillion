# Playtest agents report (2026-11-06T18-43-18)

Seed 1. Each run is a goal-oriented agent pressing real keys; the monitor checks invariants every frame. Videos are in `videos/`.

## Bosses (playtest-boss-agent)

| Run | Persona | Level/Wave | Result | Time | HP left | Hits dealt/taken | Parries | Findings | Video |
|---|---|---|---|---|---|---|---|---|---|
| MB-L5-raptor-kite<br>Raptor long sample: passive, keeps range (move coverage) | kiter-dodge | L5 W5 | NO RESULT | 98.5s | - | 17/7 | 0/0 | S1 S3 | [MB-L5-raptor-kite](videos/MB-L5-raptor-kite.webm) |
| MB-L5-raptor-parry<br>Raptor vs Parry Master | parry-master | L5 W5 | LOSE (ko) | 72.1s | 0 | 0/12 | 12/39 | none | [MB-L5-raptor-parry](videos/MB-L5-raptor-parry.webm) |

## Boss move read-out (bespoke boss AI)

| Run | Boss | Time to KO | Move | Seen | Hit Zed | Evaded | Parried (boss stunned) | Damage to Zed |
|---|---|---|---|---|---|---|---|---|
| MB-L5-raptor-kite | raptor-1 | alive (307/320) | barrage | 2 | 2 | 0 | 0 | 10 |
| MB-L5-raptor-kite | raptor-1 | alive (307/320) | dive | 1 | 1 | 0 | 0 | 14 |
| MB-L5-raptor-parry | raptor-1 | alive (320/320) | barrage | 1 | 2 | 0 | 0 | 10 |

### Boss fight extras

- MB-L5-raptor-kite / raptor-1: stuns 0, steam patches laid 0, vent started with Zed airborne 0x, clock 209s left at first sight, ?s at KO, move order: barrage > dive > barrage
- MB-L5-raptor-parry / raptor-1: stuns 0, steam patches laid 0, vent started with Zed airborne 0x, clock 209s left at first sight, ?s at KO, move order: barrage

## Findings

| Sev | Finding | Run | First at | Count | Detail |
|---|---|---|---|---|---|
| S1 | No progress for 25 s (no hits, no wave change, no travel) | MB-L5-raptor-kite | 66.4s | 1930 | wave 5, 1 alive, goal attack |
| S3 | Scenario hit its 100s cap before the round ended | MB-L5-raptor-kite | - | 1 | goal at cap: attack |
