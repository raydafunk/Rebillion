# Playtest agents report (2026-11-06T07-21-37)

Seed 2. Each run is a goal-oriented agent pressing real keys; the monitor checks invariants every frame. Videos are in `videos/`.

## Bosses (playtest-boss-agent)

| Run | Persona | Level/Wave | Result | Time | HP left | Hits dealt/taken | Parries | Findings | Video |
|---|---|---|---|---|---|---|---|---|---|
| MB-L3-kane-solo<br>"Crusher" Kane (solo) | boss-hunter | L3 W5 | BOSS WAVE CLEARED | 133.3s | - | 30/0 | 2/2 | S1 | [MB-L3-kane-solo](videos/MB-L3-kane-solo.webm) |
| MB-L3-kane-parry<br>Kane vs Parry Master | parry-master | L3 W5 | BOSS WAVE CLEARED | 59.3s | - | 37/10 | 5/9 | none | [MB-L3-kane-parry](videos/MB-L3-kane-parry.webm) |
| MB-L3-kane-trader<br>Kane vs Trader (no parry, no dodge) | trader | L3 W5 | BOSS WAVE CLEARED | 54.0s | - | 31/3 | 0/0 | none | [MB-L3-kane-trader](videos/MB-L3-kane-trader.webm) |

## Boss move read-out (bespoke boss AI)

| Run | Boss | Time to KO | Move | Seen | Hit Zed | Evaded | Parried (boss stunned) | Damage to Zed |
|---|---|---|---|---|---|---|---|---|
| MB-L3-kane-solo | crusher-kane-1 | 8.0s | hammer | 2 | 0 | 2 | 2 | 0 |
| MB-L3-kane-parry | crusher-kane-1 | 20.0s | hammer | 3 | 0 | 3 | 3 | 0 |
| MB-L3-kane-parry | crusher-kane-1 | 20.0s | vent | 1 | 0 | 1 | 0 | 0 |
| MB-L3-kane-parry | crusher-kane-1 | 20.0s | steam-patch | 1 | 2 | 0 | 0 | 8 |
| MB-L3-kane-parry | crusher-kane-1 | 20.0s | hook | 1 | 0 | 1 | 0 | 0 |
| MB-L3-kane-trader | crusher-kane-1 | 8.6s | hammer | 1 | 1 | 0 | 0 | 20 |
| MB-L3-kane-trader | crusher-kane-1 | 8.6s | vent | 1 | 1 | 0 | 0 | 10 |
| MB-L3-kane-trader | crusher-kane-1 | 8.6s | steam-patch | 1 | 1 | 0 | 0 | 4 |

### Boss fight extras

- MB-L3-kane-solo / crusher-kane-1: stuns 2, steam patches laid 0, vent started with Zed airborne 0x, clock 209s left at first sight, 202s at KO, move order: hammer > hammer
- MB-L3-kane-parry / crusher-kane-1: stuns 3, steam patches laid 1, vent started with Zed airborne 0x, clock 209s left at first sight, 190s at KO, move order: hammer > hammer > vent > hook > hammer
- MB-L3-kane-trader / crusher-kane-1: stuns 0, steam patches laid 1, vent started with Zed airborne 0x, clock 209s left at first sight, 201s at KO, move order: hammer > vent

## Findings

| Sev | Finding | Run | First at | Count | Detail |
|---|---|---|---|---|---|
| S1 | Level finished but Zed cannot reach the exit | MB-L3-kane-solo | 133.2s | 11 | x=4601 exit=5070 |
