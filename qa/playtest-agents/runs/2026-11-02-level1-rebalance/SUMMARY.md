# Level 1 rebalance (crowd-control lesson, smaller finale crew, crew waits for Dugan)

## What changed
| Where | Change |
|---|---|
| `content/levels/levels.json` + `src/waves/waveData.js` (fallback mirror) | **Wave 3**: spawn pattern `ambush` -> new `pincer` (one grunt from each edge in turn), `maxAlive` 4 -> 2, coaching line `hint`. **Wave 5**: `maxAlive` 4 -> 3; Dugan `leader.crewAfter: "first-move"`, `crewDelayMs` 900, `crewMaxWaitMs` 9000 |
| `src/waves/spawnPatterns.js` | `pincer` pattern; pincer and surge lock their sides at the wave's first spawn |
| `src/waves/WaveSpawner.js` | crew hold until the leader's first move is done (+ 900 ms beat; 9 s safety net so the wave can never stall); `hint` rides on `wave-started` |
| `src/arena/Arena.js` | tells the spawner when a leader has finished his first move (move counter moved and he is out of wind-up/strike, or he is gone) |
| `src/levels/levelData.js` | carries and validates `hint`, `crewAfter`, `crewDelayMs`, `crewMaxWaitMs` |
| `src/scenes/HudScene.js` | shows the wave hint under the banner for ~4.5 s |
| `design/team/contracts.md` | `wave-started` payload is now `{ index, total, hint? }` |
| tests | levelData, waveData, WaveSpawner (crewAfter, safety net, hint), spawnPatterns (pincer, anchoring). `npm test` green |

## Playtest after the change (seeds 1-4)
| Run | Before | After |
|---|---|---|
| Level 1 full, Brawler (repositions) | won 3/3 | **won 4/4**, HP left 78 / 100 / 100 / 75 |
| Finale, Boss Hunter (repositions) | won 3/3, 14-90 damage taken | **won 4/4**, 14-54 damage taken |
| Finale, Rookie (never repositions, weak parries) | 2 wins, 1 KO; avg 89 damage taken | **no KOs**: 2 wins (40 / 54 HP left), 1 stall (see below); avg 45 damage taken |
| Level 1 full, Rookie | 2 wins, 1 KO | 3 wins, 1 KO |

Crew timing verified in play: Dugan's first move (a shoulder charge) ends about 4 s after he walks in, and the grunts arrive about 1 s later.

## Caveats
- 3-4 runs per row and the enemy AI is not seeded: read these as direction, not proof.
- The Rookie cannot learn, so the wave 3 lesson cannot show up in its numbers. Whether the hint teaches is a question for a human playtest.
- **New observation (not caused by this change):** in one Rookie finale run Dugan charged back and forth for 3 minutes and was never hit. The Rookie kept walking up to him along his lane at range, which is exactly when he charges, and the 1000 px charge carries him out of reach again. Players who approach off his lane, or punish the wall crash, are fine. Worth a human check.
