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
| lead (you) | main session | Team Lead | `src/scenes/ArenaScene.js`, `index.html`, integration only |

**Why this split:** it follows the GDD dependency chain (Combos need Mechanics; Game State needs Health; Spawner needs Enemy; Camera needs Spawner), gives each teammate disjoint folders (the docs' main warning is two agents editing one file), and keeps token load balanced: `encounter` is the largest, as the GDD says.

**Task order (dependencies):**
1. `combat`: finalize contracts + shared data. *Blocks 2 and 3.*
2. `player`: movement and jump, then light/heavy/combo, then block.
3. `encounter`: Rust grunt, then wave spawner, then camera/bounds failsafe.
4. `combat`: health/hitbox resolution, then game state (timer, win, lose, retry).
5. Lead: `ArenaScene` wiring, then playtest and fix list.

**Spawn prompt:**

```text
Create an agent team for The Rebellion Tier 0 gameplay build. Read The Rebellion.docx
and design/team/contracts.md first. Spawn three teammates from our project agent types:
- "combat" using combat-agent
- "player" using player-agent
- "encounter" using encounter-agent
Each only edits its own folders. combat must finish the contract (design/team/contracts.md,
src/shared/) first and message the others; player and encounter start on parts that do not
need it and wait for it before using events. Make a task list with 5-6 tasks per teammate,
with dependencies per the contract. I own src/scenes/ArenaScene.js wiring; do not implement
tasks yourself, wait for teammates to finish. Require plan approval before anyone edits files
outside their folders. Use Sonnet for all three.
```

Add `Have each teammate run its own test harness before marking a task complete.` for a cheap quality gate. A `TaskCompleted` hook can enforce it later.

**Cost note:** three parallel implementers cost roughly 3x a single session. If budget is tight, run `combat` first alone, then `player` and `encounter` together.

---

## Setup B: Presentation Polish (existing agents, no new files)

**Goal:** finish the screens and feel: UI hooked to real game events, final art specs, hit feedback.

| Teammate | Definition | Owns |
|---|---|---|
| `ux` | `ux-flow-designer` | `design/ux/` |
| `art` | `art-direction-agent` | `design/art/`, `assets/` |
| `ui` | `menu-ui-agent` | `src/ui/` |

```text
Create an agent team using our project agents: "ux" (ux-flow-designer), "art"
(art-direction-agent), "ui" (menu-ui-agent). Once Setup A events exist, have ux review
design/ux against design/team/contracts.md and list mismatches, art finalize the hit-feedback
spec and animation list for Zed and the Rust grunt, and ui connect HudScene/ResultScene to
the real events. ui waits for ux and art deliverables before building.
```

Run after Setup A, since `ui` needs real events to subscribe to.

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
