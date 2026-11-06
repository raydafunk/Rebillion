# Playtest agents report (2026-11-06T07-33-47)

Seed 1. Each run is a goal-oriented agent pressing real keys; the monitor checks invariants every frame. Videos are in `videos/`.

## Levels (playtest-level-agent)

| Run | Persona | Level/Wave | Result | Time | HP left | Hits dealt/taken | Parries | Findings | Video |
|---|---|---|---|---|---|---|---|---|---|
| L3-brawler | brawler | L3 | WIN (cleared) | 175.8s | 100 | 175/10 | 4/6 | S1 | [L3-brawler](videos/L3-brawler.webm) |

## Boss move read-out (bespoke boss AI)

| Run | Boss | Time to KO | Move | Seen | Hit Zed | Evaded | Parried (boss stunned) | Damage to Zed |
|---|---|---|---|---|---|---|---|---|
| L3-brawler | crusher-kane-23 | 14.3s | hammer | 2 | 1 | 1 | 0 | 20 |
| L3-brawler | crusher-kane-23 | 14.3s | vent | 1 | 1 | 0 | 0 | 10 |
| L3-brawler | crusher-kane-23 | 14.3s | steam-patch | 1 | 5 | 0 | 0 | 20 |
| L3-brawler | crusher-kane-23 | 14.3s | uppercut | 1 | 1 | 0 | 0 | 18 |

### Boss fight extras

- L3-brawler / crusher-kane-23: stuns 0, steam patches laid 1, vent started with Zed airborne 0x, clock 209s left at first sight, 195s at KO, move order: hammer > vent > uppercut > hammer

## Findings

| Sev | Finding | Run | First at | Count | Detail |
|---|---|---|---|---|---|
| S1 | Level finished but Zed cannot reach the exit | L3-brawler | 175.2s | 26 | x=4931 exit=5070 |
