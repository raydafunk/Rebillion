# Playtest agents report (2026-11-06T07-18-53)

Seed 1. Each run is a goal-oriented agent pressing real keys; the monitor checks invariants every frame. Videos are in `videos/`.

## Bosses (playtest-boss-agent)

| Run | Persona | Level/Wave | Result | Time | HP left | Hits dealt/taken | Parries | Findings | Video |
|---|---|---|---|---|---|---|---|---|---|
| MB-L3-kane-kite-dodge<br>Kane long sample: dodge only, never attacks | kiter-dodge | L3 W5 | NO RESULT | 97.3s | - | 2/0 | 0/0 | S3 | [MB-L3-kane-kite-dodge](videos/MB-L3-kane-kite-dodge.webm) |

## Boss move read-out (bespoke boss AI)

| Run | Boss | Time to KO | Move | Seen | Hit Zed | Evaded | Parried (boss stunned) | Damage to Zed |
|---|---|---|---|---|---|---|---|---|
| MB-L3-kane-kite-dodge | crusher-kane-1 | alive (220/220) | hammer | 1 | 0 | 0 | 0 | 0 |

### Boss fight extras

- MB-L3-kane-kite-dodge / crusher-kane-1: stuns 0, steam patches laid 0, vent started with Zed airborne 0x, clock 209s left at first sight, ?s at KO, move order: hammer

## Findings

| Sev | Finding | Run | First at | Count | Detail |
|---|---|---|---|---|---|
| S3 | Scenario hit its 100s cap before the round ended | MB-L3-kane-kite-dodge | - | 1 | goal at cap: attack |
