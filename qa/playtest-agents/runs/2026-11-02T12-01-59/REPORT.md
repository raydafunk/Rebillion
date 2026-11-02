# Playtest agents report (2026-11-02T12-01-59)

Seed 1. Each run is a goal-oriented agent pressing real keys; the monitor checks invariants every frame. Videos are in `videos/`.

## What the agents found (reviewed by hand against the videos)

1. **No breakage.** 22 runs, 0 invariant failures: no soft-locks, bound leaks, stuck grabs, frozen timer, missing result screen or JavaScript errors, including the input-fuzzing and edge-abusing personas.
2. **Difficulty curve is inverted.** The Level 1 finale (Brick Dugan + 4 grunts) killed the Brawler in 3 of 4 full Level 1 runs and the Boss Hunter in the finale run. Almost all the damage came from grunts surrounding Zed while Dugan hung back (EB-L1-dugan-crew: 100 damage in about 6 s of fighting). The Brawler cleared Levels 2-4 and 6-8 taking only 0-24 damage.
3. **Level 5's timer is too tight.** The Brawler timed out on Level 5 in every recording, still at 84-100 HP (210 s for 7 waves with HP multipliers). Level 4 is borderline: it was cleared with only seconds to spare and timed out once in three recordings.
4. **Only Dugan is a real boss.** The Holt, Wren, Copper Fang and Halden Varr waves are stand-in grunts with an HP multiplier (`levelData.js` STAND_IN). They have no tells to read and no victory card, and the final boss died in about 28 s.
5. **Dugan, fought solo, is fair and readable.** The Boss Hunter sidestepped every charge, back-stepped every grab and parried punches and the Rage Punch. The Mega Stomp wave was the move that landed most often. The agent's jump timing may cause some of that, so it is worth a human check.
6. **Grab break works.** When the Button Masher was grabbed, mashing J/K broke the hold.

Caveat: the agents have no crowd positioning (they don't back off to keep every enemy on one side), so finding 2 is partly an agent limit. A human player may do better.

## Levels (playtest-level-agent)

| Run | Persona | Level/Wave | Result | Time | HP left | Hits dealt/taken | Parries | Findings | Video |
|---|---|---|---|---|---|---|---|---|---|
| L1-brawler | brawler | L1 | LOSE (ko) | 126.3s | 0 | 199/13 | 4/6 | none | [L1-brawler](videos/L1-brawler.mp4) |
| L2-brawler | brawler | L2 | WIN (cleared) | 78.4s | 100 | 84/1 | 1/1 | none | [L2-brawler](videos/L2-brawler.mp4) |
| L3-brawler | brawler | L3 | WIN (cleared) | 125.2s | 100 | 164/0 | 0/0 | none | [L3-brawler](videos/L3-brawler.mp4) |
| L4-brawler | brawler | L4 | WIN (cleared) | 184.7s | 100 | 231/2 | 2/2 | none | [L4-brawler](videos/L4-brawler.mp4) |
| L5-brawler | brawler | L5 | LOSE (timeout) | 217.0s | 100 | 299/0 | 5/5 | none | [L5-brawler](videos/L5-brawler.mp4) |
| L6-brawler | brawler | L6 | WIN (cleared) | 88.9s | 100 | 105/0 | 1/2 | none | [L6-brawler](videos/L6-brawler.mp4) |
| L7-brawler | brawler | L7 | WIN (cleared) | 46.1s | 100 | 32/0 | 0/0 | none | [L7-brawler](videos/L7-brawler.mp4) |
| L8-brawler | brawler | L8 | WIN (cleared) | 58.2s | 100 | 49/0 | 0/0 | none | [L8-brawler](videos/L8-brawler.mp4) |
| L1-button-masher | button-masher | L1 | LOSE (ko) | 117.0s | 0 | 138/20 | 2/0 | none | [L1-button-masher](videos/L1-button-masher.mp4) |
| L2-edge-exploiter | edge-exploiter | L2 | WIN (cleared) | 113.1s | 60 | 84/8 | 0/0 | none | [L2-edge-exploiter](videos/L2-edge-exploiter.mp4) |
| L3-turtle | turtle | L3 | LOSE (ko) | 23.5s | 0 | 12/25 | 1/3 | none | [L3-turtle](videos/L3-turtle.mp4) |
| L6-parry-master | parry-master | L6 | WIN (cleared) | 88.0s | 100 | 106/8 | 9/10 | none | [L6-parry-master](videos/L6-parry-master.mp4) |

## Bosses (playtest-boss-agent)

| Run | Persona | Level/Wave | Result | Time | HP left | Hits dealt/taken | Parries | Findings | Video |
|---|---|---|---|---|---|---|---|---|---|
| MB-dugan-solo<br>"Brick" Dugan (solo) | boss-hunter | L1 W5 | WIN (cleared) | 41.6s | 86 | 38/1 | 2/2 | none | [MB-dugan-solo](videos/MB-dugan-solo.mp4) |
| MB-L4-holt<br>Overseer Dr. Maren Holt wave | boss-hunter | L4 W2 | BOSS WAVE CLEARED | 64.9s | - | 87/0 | 0/0 | none | [MB-L4-holt](videos/MB-L4-holt.mp4) |
| MB-L5-copper-fang<br>Rust Copper Fang wave | boss-hunter | L5 W2 | BOSS WAVE CLEARED | 69.4s | - | 84/0 | 0/0 | none | [MB-L5-copper-fang](videos/MB-L5-copper-fang.mp4) |
| MB-L5-wren<br>Overseer Silas Wren wave | boss-hunter | L5 W5 | BOSS WAVE CLEARED | 82.1s | - | 101/3 | 1/2 | none | [MB-L5-wren](videos/MB-L5-wren.mp4) |
| EB-L1-dugan-crew<br>"Brick" Dugan + crew (Level 1 finale) | boss-hunter | L1 W5 | LOSE (ko) | 22.7s | 0 | 4/10 | 4/11 | none | [EB-L1-dugan-crew](videos/EB-L1-dugan-crew.mp4) |
| EB-L5-copper-fang<br>Rust Copper Fang (Level 5 finale) | boss-hunter | L5 W7 | WIN (cleared) | 42.6s | 100 | 70/0 | 3/2 | none | [EB-L5-copper-fang](videos/EB-L5-copper-fang.mp4) |
| EB-L7-copper-fang<br>Rust Copper Fang (Level 7 finale) | boss-hunter | L7 W3 | WIN (cleared) | 23.1s | 100 | 18/0 | 0/0 | none | [EB-L7-copper-fang](videos/EB-L7-copper-fang.mp4) |
| EB-L8-halden-varr<br>Overseer Halden Varr (final boss) | boss-hunter | L8 W4 | WIN (cleared) | 28.2s | 92 | 29/1 | 0/1 | none | [EB-L8-halden-varr](videos/EB-L8-halden-varr.mp4) |
| ADV-dugan-edge<br>Dugan vs Edge Exploiter | edge-exploiter | L1 W5 | LOSE (ko) | 45.5s | 0 | 38/6 | 0/0 | none | [ADV-dugan-edge](videos/ADV-dugan-edge.mp4) |
| ADV-dugan-masher<br>Dugan vs Button Masher | button-masher | L1 W5 | BOSS WAVE CLEARED | 41.2s | - | 36/5 | 0/0 | none | [ADV-dugan-masher](videos/ADV-dugan-masher.mp4) |

## Boss move read-out (bespoke boss AI)

| Run | Boss | Time to KO | Move | Seen | Hit Zed | Evaded | Damage to Zed |
|---|---|---|---|---|---|---|---|
| L1-brawler | brick-dugan-26 | alive (10/300) | charge | 2 | 0 | 2 | 0 |
| L1-brawler | brick-dugan-26 | alive (10/300) | stomp | 2 | 1 | 1 | 14 |
| L1-brawler | brick-dugan-26 | alive (10/300) | punch | 1 | 1 | 0 | 16 |
| L1-brawler | brick-dugan-26 | alive (10/300) | rage | 1 | 1 | 0 | 14 |
| L1-button-masher | brick-dugan-26 | alive (263/300) | charge | 1 | 0 | 1 | 0 |
| L1-button-masher | brick-dugan-26 | alive (263/300) | punch | 1 | 1 | 0 | 16 |
| L1-button-masher | brick-dugan-26 | alive (263/300) | stomp | 1 | 1 | 0 | 14 |
| MB-dugan-solo | brick-dugan-1 | 27.7s | charge | 2 | 0 | 2 | 0 |
| MB-dugan-solo | brick-dugan-1 | 27.7s | stomp | 1 | 1 | 0 | 14 |
| MB-dugan-solo | brick-dugan-1 | 27.7s | grab | 1 | 0 | 1 | 0 |
| MB-dugan-solo | brick-dugan-1 | 27.7s | punch | 1 | 0 | 1 | 0 |
| MB-dugan-solo | brick-dugan-1 | 27.7s | rage | 1 | 0 | 1 | 0 |
| EB-L1-dugan-crew | brick-dugan-1 | alive (300/300) | charge | 1 | 0 | 1 | 0 |
| EB-L1-dugan-crew | brick-dugan-1 | alive (300/300) | stomp | 1 | 0 | 0 | 0 |
| ADV-dugan-edge | brick-dugan-1 | alive (8/300) | stomp | 2 | 1 | 1 | 14 |
| ADV-dugan-edge | brick-dugan-1 | alive (8/300) | punch | 4 | 4 | 0 | 51 |
| ADV-dugan-edge | brick-dugan-1 | alive (8/300) | rage | 1 | 1 | 0 | 35 |
| ADV-dugan-masher | brick-dugan-1 | 23.8s | charge | 1 | 0 | 1 | 0 |
| ADV-dugan-masher | brick-dugan-1 | 23.8s | punch | 2 | 2 | 0 | 32 |
| ADV-dugan-masher | brick-dugan-1 | 23.8s | stomp | 2 | 2 | 0 | 28 |
| ADV-dugan-masher | brick-dugan-1 | 23.8s | rage | 1 | 1 | 0 | 35 |

## Findings

None. Every invariant held in every run.
