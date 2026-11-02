# Playtest agents (goal-oriented, adversarial, recorded)

Two blackboard agents that **play** The Rebellion and record it:

| Goal | Agent | Plays | Publishes |
|---|---|---|---|
| G7 | `playtest-level-agent` | levels 1-8 start to finish (Brawler) + adversarial passes | `blackboard/facts/playtest-levels.json` |
| G8 | `playtest-boss-agent` | mini-bosses and end-of-level bosses (Boss Hunter) + adversarial passes | `blackboard/facts/playtest-bosses.json` |

Both need nothing upstream, so the director can run them in parallel with G1/G2, or after G6 to check a generated change.

## Watch one now
```
python dev-server.py 8777
http://localhost:8777/playtest.html?level=1&agent=brawler
http://localhost:8777/playtest.html?level=1&wave=5&agent=boss-hunter     (Brick Dugan)
```
The panel in the bottom-right corner shows the agent's current goal, action, hits, parries and live findings.
Drop `&agent=...` to play the level yourself without the title/menu.

## Record everything
```
npm i -D playwright && npx playwright install chromium     (once)
node qa/playtest-agents/run.mjs --suite levels             (or bosses, or all)
node qa/playtest-agents/run.mjs --only L1-brawler,EB-L1-dugan-crew --headed
```
Options: `--seed N` (replay the same run), `--renderer canvas` (no GPU / CI), `--out <dir>`, `--no-blackboard`.
Output goes to `qa/playtest-agents/runs/<stamp>/`: `videos/<run>.mp4` (webm if ffmpeg is missing), `REPORT.md`, `report.json`.

## Files
- `agent.js`: the brain. perceive -> score goals -> act through real KeyboardEvents; `Monitor` checks invariants every step; `report()` returns stats, boss move read-out, findings and a timeline.
- `personas.js`: Brawler, Boss Hunter, Parry Master (competent); Button Masher, Edge Exploiter, Turtle (adversarial).
- `scenarios.js`: which level/wave each run plays.
- `run.mjs`: static server + Playwright recorder + reports + blackboard facts.
- `../../playtest.html`: boots straight into `?level=N` (and honours ArenaScene's `?wave=N`).

Game code is not touched. The agent only reads `ArenaScene` state and presses keys.

## Severity (same scale as qa-agent)
S1 blocks winning or losing (soft-lock, stuck grab, no result screen, NaN). S2 breaks a contract (bounds leak, frozen timer, enemy stuck off-screen, JS errors). S3 wrong but playable (scenario cap hit, balance outliers). S4 polish.
