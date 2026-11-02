# Crowd-control re-test: is the Level 1 finale too hard?

The competent personas (Brawler, Boss Hunter, Parry Master) now have a `reposition` goal (agent.js `crowdPlan`): when enemies are on
both sides of Zed, he runs to the edge of the locked screen on the side with fewer enemies, and to the far side of the floor
band, so the whole crowd ends up in front of him. Nothing else changed.

| Run | Before (no repositioning) | After (3 seeds) |
|---|---|---|
| Level 1 full run (Brawler) | lost 3 of 4, KO'd at the Dugan wave | **won 3/3**, HP left 85 / 100 / 66 |
| Level 1 finale, Dugan + 4 grunts (Boss Hunter) | lost 2/2, KO'd in ~6 s of fighting | **won 3/3**, HP left 70 / 86 / 37, Dugan down in 32-34 s |
| Regression: L2 Brawler, L6 Parry Master, Dugan solo | won | won |

**Verdict:** the finale is beatable with basic beat-'em-up technique. It is not too hard, but it is a hard skill check for Level 1:
it punishes standing between enemies very fast (100 HP gone in ~6 s), and nothing in Level 1 teaches the player to keep the
crowd on one side before it. One of three wins ended at 37 HP. Options: teach it earlier (a 2-sided wave in W3/W4), lower
`maxAlive` on W5 from 4 to 3, or have the crew walk in after Dugan's first move.

Seeds 1-3 are in `seed1/`, `seed2/`, `seed3/` (videos + report each); regression runs in `regress/`.
