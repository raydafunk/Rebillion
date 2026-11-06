# Playtest agents report (2026-11-06T06-58-52)

Seed 1. Each run is a goal-oriented agent pressing real keys; the monitor checks invariants every frame. Videos are in `videos/`.

## Bosses (playtest-boss-agent)

| Run | Persona | Level/Wave | Result | Time | HP left | Hits dealt/taken | Parries | Findings | Video |
|---|---|---|---|---|---|---|---|---|---|
| MB-L3-kane-solo<br>"Crusher" Kane (solo) | boss-hunter | L3 W5 | BOSS WAVE CLEARED | 64.4s | - | 31/4 | 2/3 | S1 | [MB-L3-kane-solo](videos/MB-L3-kane-solo.webm) |

## Boss move read-out (bespoke boss AI)

| Run | Boss | Time to KO | Move | Seen | Hit Zed | Evaded | Parried (boss stunned) | Damage to Zed |
|---|---|---|---|---|---|---|---|---|
| MB-L3-kane-solo | crusher-kane-1 | 8.5s | hammer | 2 | 0 | 2 | 2 | 0 |

### Boss fight extras

- MB-L3-kane-solo / crusher-kane-1: stuns 2, steam patches laid 0, vent started with Zed airborne 0x, clock 209s left at first sight, 201s at KO, move order: hammer > hammer

## Findings

| Sev | Finding | Run | First at | Count | Detail |
|---|---|---|---|---|---|
| S1 | Level finished but Zed cannot reach the exit | MB-L3-kane-solo | 64.4s | 1 | x=4701 exit=5070 |
