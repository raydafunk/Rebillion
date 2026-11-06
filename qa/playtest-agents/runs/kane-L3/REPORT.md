# Playtest agents report (2026-11-06T07-00-24)

Seed 1. Each run is a goal-oriented agent pressing real keys; the monitor checks invariants every frame. Videos are in `videos/`.

## Bosses (playtest-boss-agent)

| Run | Persona | Level/Wave | Result | Time | HP left | Hits dealt/taken | Parries | Findings | Video |
|---|---|---|---|---|---|---|---|---|---|
| MB-L3-kane-solo<br>"Crusher" Kane (solo) | boss-hunter | L3 W5 | BOSS WAVE CLEARED | 66.0s | - | 31/0 | 2/2 | S1 | [MB-L3-kane-solo](videos/MB-L3-kane-solo.webm) |
| MB-L3-kane-crew<br>"Crusher" Kane + Breaker crew (Level 3 wave 5) | boss-hunter | L3 W5 | BOSS WAVE CLEARED | 51.8s | - | 33/5 | 8/12 | S1 | [MB-L3-kane-crew](videos/MB-L3-kane-crew.webm) |
| MB-L3-kane-parry<br>Kane vs Parry Master | parry-master | L3 W5 | LOSE (ko) | 31.7s | 0 | 19/13 | 4/9 | none | [MB-L3-kane-parry](videos/MB-L3-kane-parry.webm) |
| MB-L3-kane-dodger<br>Kane vs Dodger (no parry) | dodger | L3 W5 | BOSS WAVE CLEARED | 41.1s | - | 29/1 | 0/0 | S1 | [MB-L3-kane-dodger](videos/MB-L3-kane-dodger.webm) |
| MB-L3-kane-trader<br>Kane vs Trader (no parry, no dodge) | trader | L3 W5 | BOSS WAVE CLEARED | 45.0s | - | 34/7 | 0/0 | S1 | [MB-L3-kane-trader](videos/MB-L3-kane-trader.webm) |
| MB-L3-kane-rookie<br>Kane vs Rookie | rookie | L3 W5 | BOSS WAVE CLEARED | 43.4s | - | 34/5 | 0/0 | S1 | [MB-L3-kane-rookie](videos/MB-L3-kane-rookie.webm) |
| ADV-kane-edge<br>Kane vs Edge Exploiter | edge-exploiter | L3 W5 | WIN (cleared) | 52.8s | 50 | 38/6 | 0/0 | none | [ADV-kane-edge](videos/ADV-kane-edge.webm) |
| ADV-kane-masher<br>Kane vs Button Masher | button-masher | L3 W5 | LOSE (ko) | 34.9s | 0 | 25/11 | 1/0 | none | [ADV-kane-masher](videos/ADV-kane-masher.webm) |

## Boss move read-out (bespoke boss AI)

| Run | Boss | Time to KO | Move | Seen | Hit Zed | Evaded | Parried (boss stunned) | Damage to Zed |
|---|---|---|---|---|---|---|---|---|
| MB-L3-kane-solo | crusher-kane-1 | 8.5s | hammer | 2 | 0 | 2 | 2 | 0 |
| MB-L3-kane-crew | crusher-kane-1 | 8.3s | hammer | 2 | 0 | 2 | 2 | 0 |
| MB-L3-kane-parry | crusher-kane-1 | alive (18/220) | hammer | 1 | 0 | 1 | 1 | 0 |
| MB-L3-kane-parry | crusher-kane-1 | alive (18/220) | kick | 1 | 0 | 1 | 1 | 0 |
| MB-L3-kane-parry | crusher-kane-1 | alive (18/220) | vent | 1 | 0 | 1 | 1 | 0 |
| MB-L3-kane-parry | crusher-kane-1 | alive (18/220) | steam-patch | 1 | 3 | 0 | 0 | 12 |
| MB-L3-kane-parry | crusher-kane-1 | alive (18/220) | hook | 1 | 0 | 0 | 0 | 0 |
| MB-L3-kane-dodger | crusher-kane-1 | 11.5s | hammer | 2 | 0 | 2 | 0 | 0 |
| MB-L3-kane-dodger | crusher-kane-1 | 11.5s | kick | 1 | 1 | 0 | 0 | 12 |
| MB-L3-kane-trader | crusher-kane-1 | 11.2s | hammer | 1 | 1 | 0 | 0 | 20 |
| MB-L3-kane-trader | crusher-kane-1 | 11.2s | vent | 1 | 1 | 0 | 0 | 10 |
| MB-L3-kane-trader | crusher-kane-1 | 11.2s | steam-patch | 1 | 5 | 0 | 0 | 20 |
| MB-L3-kane-trader | crusher-kane-1 | 11.2s | uppercut | 1 | 0 | 1 | 0 | 0 |
| MB-L3-kane-rookie | crusher-kane-1 | 10.6s | hammer | 1 | 1 | 0 | 0 | 20 |
| MB-L3-kane-rookie | crusher-kane-1 | 10.6s | vent | 1 | 1 | 0 | 0 | 10 |
| MB-L3-kane-rookie | crusher-kane-1 | 10.6s | steam-patch | 1 | 3 | 0 | 0 | 12 |
| ADV-kane-edge | crusher-kane-1 | 12.6s | hammer | 2 | 1 | 1 | 0 | 20 |
| ADV-kane-edge | crusher-kane-1 | 12.6s | vent | 1 | 1 | 0 | 0 | 10 |
| ADV-kane-edge | crusher-kane-1 | 12.6s | steam-patch | 1 | 3 | 0 | 0 | 12 |
| ADV-kane-masher | crusher-kane-1 | alive (20/220) | hook | 1 | 1 | 0 | 0 | 8 |
| ADV-kane-masher | crusher-kane-1 | alive (20/220) | hammer | 2 | 2 | 0 | 0 | 25 |
| ADV-kane-masher | crusher-kane-1 | alive (20/220) | vent | 1 | 1 | 0 | 1 | 10 |
| ADV-kane-masher | crusher-kane-1 | alive (20/220) | steam-patch | 1 | 3 | 0 | 0 | 12 |

### Boss fight extras

- MB-L3-kane-solo / crusher-kane-1: stuns 2, steam patches laid 0, vent started with Zed airborne 0x, clock 209s left at first sight, 201s at KO, move order: hammer > hammer
- MB-L3-kane-crew / crusher-kane-1: stuns 2, steam patches laid 0, vent started with Zed airborne 0x, clock 209s left at first sight, 201s at KO, move order: hammer > hammer
- MB-L3-kane-parry / crusher-kane-1: stuns 3, steam patches laid 1, vent started with Zed airborne 0x, clock 209s left at first sight, ?s at KO, move order: hammer > kick > vent > hook
- MB-L3-kane-dodger / crusher-kane-1: stuns 0, steam patches laid 0, vent started with Zed airborne 0x, clock 209s left at first sight, 198s at KO, move order: hammer > hammer > kick
- MB-L3-kane-trader / crusher-kane-1: stuns 0, steam patches laid 1, vent started with Zed airborne 0x, clock 209s left at first sight, 198s at KO, move order: hammer > vent > uppercut
- MB-L3-kane-rookie / crusher-kane-1: stuns 0, steam patches laid 1, vent started with Zed airborne 0x, clock 209s left at first sight, 199s at KO, move order: hammer > vent
- ADV-kane-edge / crusher-kane-1: stuns 0, steam patches laid 1, vent started with Zed airborne 0x, clock 209s left at first sight, 197s at KO, move order: hammer > vent > hammer
- ADV-kane-masher / crusher-kane-1: stuns 1, steam patches laid 1, vent started with Zed airborne 0x, clock 209s left at first sight, ?s at KO, move order: hook > hammer > hammer > vent

## Findings

| Sev | Finding | Run | First at | Count | Detail |
|---|---|---|---|---|---|
| S1 | Level finished but Zed cannot reach the exit | MB-L3-kane-solo | 65.8s | 11 | x=4598 exit=5070 |
| S1 | Level finished but Zed cannot reach the exit | MB-L3-kane-crew | 51.1s | 40 | x=4653 exit=5070 |
| S1 | Level finished but Zed cannot reach the exit | MB-L3-kane-dodger | 40.8s | 15 | x=4918 exit=5070 |
| S1 | Level finished but Zed cannot reach the exit | MB-L3-kane-trader | 44.5s | 30 | x=4810 exit=5070 |
| S1 | Level finished but Zed cannot reach the exit | MB-L3-kane-rookie | 42.6s | 48 | x=4716 exit=5070 |
