# Agent team setups for The Rebellion

Source: `The Rebellion.docx` (AI Architecture Team + Technical Strategy tables) and the [Agent Teams docs](https://code.claude.com/docs/en/agent-teams).

## How the GDD's 10 agents map to teams

| GDD agent | Status | Home |
|---|---|---|
| UX flow, Menu & UI, Art direction | Built (`design/`, `src/ui/`, `assets/`) | Setup B |
| Player Mechanics + Player Combos | Not started | Setup A: `player-agent` |
| Health & Hitbox + Game State | Not started | Setup A: `combat-agent` |
| Enemy + Wave Spawner + Camera & Bounds | Not started | Setup A: `encounter-agent` |
| Team Lead | You, in the main session | the lead |
| Critic (lore and tone consistency; not in the GDD tables) | New: `critic-agent` | Setup B (4th teammate), plus a closing pass after Setup A |
| QA (automated testing, bug triage; not in the GDD tables) | New: `qa-agent` | Setup A (4th teammate), plus a gate pass before Setup B |

Asset & Animation Lead is covered by `art-direction-agent` (placeholders exist). Merge its animation work into Setup B when final sprites are due.

## Prerequisites (done)

- `.claude/settings.json` sets `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` and `teammateMode: in-process`. Windows Terminal and VS Code terminals cannot do split panes, so in-process is the right mode. Restart the session after changing settings.
- Teammates are spawned from the subagent definitions in `.claude/agents/`. Their `tools` list and body apply; their `skills` do not.
- One team per session, no nested teams, no resume of in-process teammates. Run one setup per session.
- Permission prompts bubble up to the lead. Pre-approve `Bash(node *)`, `Bash(python -m http.server *)` and edits under `src/` and `design/` first to cut interruptions.

---

## Setup A: Gameplay Build (recommended next)

**Goal:** a playable Tier 0 arena: Zed, one Rust enemy type, 3 waves, timer, win/lose/retry, wired to the existing UI.

| Teammate | Definition | GDD agents | Owns (only edits here) |
|---|---|---|---|
| `combat` | `combat-agent` | Health & Hitbox, Game State | `src/combat/`, `src/state/`, `src/shared/`, `design/team/contracts.md` |
| `player` | `player-agent` | Player Mechanics, Player Combos | `src/player/` |
| `encounter` | `encounter-agent` | Enemy, Wave Spawner, Camera & Bounds | `src/enemies/`, `src/waves/`, `src/arena/` |
| `qa` | `qa-agent` | QA (added; not a GDD agent) | `design/qa/` and test files only (`*.test.*`, `src/**/test/`); never game code |
| lead (you) | main session | Team Lead | `src/scenes/ArenaScene.js`, `index.html`, integration only |

**What QA does:** runs `node --test` for a baseline (6 test files exist; all 16 tests passed at last check), writes tests for the known gaps in `design/team/review.md` (retry mid-round and double `wave-started`, same-tick timeout vs clear, attacker-cap starvation, failsafe removal, enemy stun-lock, dodge/parry contract, pause clock race), and keeps a severity-ranked, owner-assigned bug list in `design/qa/bugs.md` (S1 soft-lock or round cannot end, S2 pillar or contract broken, S3 wrong but playable, S4 polish). It writes `design/qa/report.md` with a go/no-go for integration and a manual `design/qa/playtest.md` checklist for feel and readability. A bug needs a failing test or a file and line; tests are never weakened to pass. S1 and S2 bugs are messaged straight to the owning teammate with the repro command. It does not fix game code: if code needs a seam to be testable (e.g. an injectable clock), it files that as a bug for the owner.

**Why this split:** it follows the GDD dependency chain (Combos need Mechanics; Game State needs Health; Spawner needs Enemy; Camera needs Spawner), gives each teammate disjoint folders (the docs' main warning is two agents editing one file), and keeps token load balanced: `encounter` is the largest, as the GDD says.

**Task order (dependencies):**
1. `combat`: finalize contracts + shared data. *Blocks 2 and 3.*
2. `player`: movement and jump, then light/heavy/combo, then block.
3. `encounter`: Rust grunt, then wave spawner, then camera/bounds failsafe.
4. `combat`: health/hitbox resolution, then game state (timer, win, lose, retry).
5. `qa` (runs alongside 2-4): baseline suite, then tests for the known gaps as each module lands, then triage; reruns after each fix and reports go/no-go before wiring.
6. Lead: `ArenaScene` wiring, then playtest and fix list from `design/qa/bugs.md`.

**Spawn prompt:**

```text
Create an agent team for The Rebellion Tier 0 gameplay build. Read The Rebellion.docx,
design/team/contracts.md and design/team/review.md first. Spawn four teammates from our
project agent types:
- "combat" using combat-agent
- "player" using player-agent
- "encounter" using encounter-agent
- "qa" using qa-agent
Each only edits its own folders. combat must finish the contract (design/team/contracts.md,
src/shared/) first and message the others; player and encounter start on parts that do not
need it and wait for it before using events. Make a task list with 5-6 tasks per teammate,
with dependencies per the contract. I own src/scenes/ArenaScene.js wiring; do not implement
tasks yourself, wait for teammates to finish. Require plan approval before anyone edits files
outside their folders. qa starts with a baseline `node --test`, then writes tests as each
module lands, files bugs with owners in design/qa/bugs.md, and messages owners directly
about S1/S2 bugs; it edits tests and design/qa only. Builders fix their own bugs and
tell qa to re-verify. Use Sonnet for all four.
```

Add `Have each teammate run its own test harness before marking a task complete.` for a cheap quality gate. A `TaskCompleted` hook can enforce it later: run `node --test` and exit 2 if it fails.

**Cost note:** four parallel agents cost roughly 4x a single session. If budget is tight, run `combat` first alone, then `player` and `encounter` together, and bring `qa` in as a single gate pass once their code lands. The Setup A team is now four, above the three-agent target; the three-agent version is the same prompt without `qa`.

---

## Setup B: Presentation Polish (3 existing agents + the Critic)

**Goal:** finish the screens and feel: UI hooked to real game events, final art specs, hit feedback, and a consistent world and voice across all of it.

| Teammate | Definition | Owns |
|---|---|---|
| `ux` | `ux-flow-designer` | `design/ux/` |
| `art` | `art-direction-agent` | `design/art/`, `assets/` |
| `ui` | `menu-ui-agent` | `src/ui/` |
| `critic` | `critic-agent` | `design/lore/` (canon sheet and change log). Wording-only fixes in `design/ux/` and `design/art/`; string fixes in `src/` go through the owner |

**What the Critic does:** builds `design/lore/canon.md` from the GDD, audits every player-facing string and spec for lore breaks (Rush/Rust, "Rust has been driven out of the arena" reading as a place, "Fallen" vs "Fallen City") and tone drift (clinical or grim copy against the hopeful, community voice), and **fixes at least one real inconsistency per pass**, logging each change in `design/lore/critic-log.md` with before/after. It never edits the GDD docx; it proposes GDD text fixes in the log. If a full audit finds nothing, it must say so rather than invent a problem.

```text
Create an agent team using our project agents: "ux" (ux-flow-designer), "art"
(art-direction-agent), "ui" (menu-ui-agent), "critic" (critic-agent). Once Setup A events
exist, have ux review design/ux against design/team/contracts.md and list mismatches, art
finalize the hit-feedback spec and animation list for Zed and the Rust grunt, and ui connect
HudScene/ResultScene to the real events. ui waits for ux and art deliverables before building.
critic starts immediately: build design/lore/canon.md from The Rebellion.docx, then audit
copy from ux, art and ui as it lands, fix at least one lore break or tone drift, and send ui
exact replacement strings for anything in src/ui/. Everyone checks new player-facing text
with critic before marking a task complete.
```

Run after Setup A, since `ui` needs real events to subscribe to. The Critic needs no events, so it can start earlier on the docs alone (see the sequencing notes). Four teammates is above the three-agent target; if you need to stay at three, drop `art` once its manifest is final and keep `critic`.

**After Setup A:** Run a one-off Critic pass over enemy names, wave banners and any new strings the build agents added. Use `Spawn a teammate using the critic-agent type to audit the strings added since the last pass.`

---

## Setup C: GDD Review and Playtest (research only, lowest risk)

Docs recommend starting teams with read-only work. Uses built-in types, nothing to build.

```text
Create an agent team of three read-only reviewers for The Rebellion GDD (The Rebellion.docx)
and the current build:
- "gaps": find rules the GDD leaves undefined (time limit, wave counts, retry rules,
  duplicated Wave Spawner row, "Rush" vs "Rust" typo) and propose defaults
- "scope": check each agent's Technical Strategy budget and dependencies for Tier 0
  feasibility and cut risks
- "skeptic": challenge the other two and the pillars (fast impactful combat, combos/defence,
  wave pressure); flag soft-lock and readability risks
Have them message each other to disprove weak points, then write findings to
design/team/review.md. Do not edit any other files.
```

---

## Recommendation

Run **C** (cheap, resolves GDD gaps that A would otherwise guess at), then **A**, then **B**.
