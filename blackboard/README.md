# Blackboard

Shared workspace for the goal-oriented agents. Agents never message each other. They read the board, claim a goal they own, post a fact, and mark the goal done.

```
blackboard/
  goals.json        goals, owners, preconditions (needs), status, attempts
  facts/            what agents have published (one file per goal)
  log.md            append-only history
  board.mjs         the only thing that edits goals.json
```

## Goal chain

```
G1 read-gdd ----\
                 >-- G3 find-gaps -- G4 prioritise -- G5 generate-code -- G6 review
G2 scan-code ---/                                          ^                  |
                                                           +---- fail --------+
```

| Goal | Agent | Reads | Publishes |
|---|---|---|---|
| G1 | `gdd-reader-agent` | `pipeline/corpus/`, GDD docs | `facts/gdd-requirements.json` |
| G2 | `code-scanner-agent` | `src/`, tests, `assets/asset-keys.json` | `facts/code-inventory.json` |
| G3 | `gap-analyst-agent` | G1 + G2 facts | `facts/gaps.json` |
| G4 | `prioritiser-agent` | `facts/gaps.json` | `facts/priorities.json` |
| G5 | `code-generator-agent` | `facts/priorities.json`, `design/team/contracts.md` | code in `src/`, `facts/generated.json` |
| G6 | `reviewer-agent` | `facts/generated.json`, the diff, `npm test` | `facts/review.json` |

G1 and G2 are independent, so run them in parallel. A failed review reopens G5, which resets G6 (`board.mjs reopen`). After `maxAttempts` the goal becomes `blocked` and the director reports it to the owner.

## Commands

```bash
node blackboard/board.mjs status
node blackboard/board.mjs ready
node blackboard/board.mjs claim <goal-id>
node blackboard/board.mjs done <goal-id> "note"
node blackboard/board.mjs block <goal-id> "reason"
node blackboard/board.mjs reopen <goal-id> "reason"
node blackboard/board.mjs reset
```

## Run it

Ask Claude Code: **"use blackboard-director-agent to run the goal board"**. It loops: `ready`, spawn the owners (in parallel when several are ready), repeat, until nothing is open. To run another round on the next gap, `reset` then run again; G1/G2 will refresh the facts.

## Rules every agent follows

1. Claim before working (`claim`). If the claim fails, stop: someone else has it or the needs are unmet.
2. Write only your own `facts/` file, and only the code your goal allows.
3. Every fact carries evidence: a chunk id (`the-rebellion#8`) or `file:line`. No evidence, mark it `suspected`.
4. Missing input? `block` the goal with the reason. Never guess.
5. Need something new? Add it to the `requests` array of your fact file for the director to turn into a goal.
6. Never edit `GameDesignDocument/` or `goals.json`.
