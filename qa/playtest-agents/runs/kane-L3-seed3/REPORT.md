# Playtest agents report (2026-11-06T07-29-45)

Seed 3. Each run is a goal-oriented agent pressing real keys; the monitor checks invariants every frame. Videos are in `videos/`.

## Bosses (playtest-boss-agent)

| Run | Persona | Level/Wave | Result | Time | HP left | Hits dealt/taken | Parries | Findings | Video |
|---|---|---|---|---|---|---|---|---|---|
| MB-L3-kane-solo<br>"Crusher" Kane (solo) | boss-hunter | L3 W5 | BOSS WAVE CLEARED | 111.8s | - | 32/0 | 2/2 | none | [MB-L3-kane-solo](videos/MB-L3-kane-solo.webm) |
| MB-L3-kane-parry<br>Kane vs Parry Master | parry-master | L3 W5 | BOSS WAVE CLEARED | 40.4s | - | 31/1 | 2/2 | S1 | [MB-L3-kane-parry](videos/MB-L3-kane-parry.webm) |
| MB-L3-kane-trader<br>Kane vs Trader (no parry, no dodge) | trader | L3 W5 | BOSS WAVE CLEARED | 43.6s | - | 34/9 | 0/0 | S1 | [MB-L3-kane-trader](videos/MB-L3-kane-trader.webm) |

## Boss move read-out (bespoke boss AI)

| Run | Boss | Time to KO | Move | Seen | Hit Zed | Evaded | Parried (boss stunned) | Damage to Zed |
|---|---|---|---|---|---|---|---|---|
| MB-L3-kane-solo | crusher-kane-1 | 9.0s | hammer | 2 | 0 | 2 | 2 | 0 |
| MB-L3-kane-parry | crusher-kane-1 | 8.0s | hammer | 2 | 1 | 1 | 1 | 20 |
| MB-L3-kane-trader | crusher-kane-1 | 12.4s | hammer | 2 | 2 | 0 | 0 | 40 |
| MB-L3-kane-trader | crusher-kane-1 | 12.4s | vent | 1 | 1 | 0 | 0 | 10 |
| MB-L3-kane-trader | crusher-kane-1 | 12.4s | steam-patch | 1 | 5 | 0 | 0 | 20 |

### Boss fight extras

- MB-L3-kane-solo / crusher-kane-1: stuns 2, steam patches laid 0, vent started with Zed airborne 0x, clock 209s left at first sight, 200s at KO, move order: hammer > hammer
- MB-L3-kane-parry / crusher-kane-1: stuns 1, steam patches laid 0, vent started with Zed airborne 0x, clock 209s left at first sight, 201s at KO, move order: hammer > hammer
- MB-L3-kane-trader / crusher-kane-1: stuns 0, steam patches laid 1, vent started with Zed airborne 0x, clock 209s left at first sight, 197s at KO, move order: hammer > vent > hammer

## Findings

| Sev | Finding | Run | First at | Count | Detail |
|---|---|---|---|---|---|
| S1 | Level finished but Zed cannot reach the exit | MB-L3-kane-parry | 39.8s | 35 | x=4314 exit=5070 |
| S1 | Level finished but Zed cannot reach the exit | MB-L3-kane-trader | 43.1s | 29 | x=4779 exit=5070 |
