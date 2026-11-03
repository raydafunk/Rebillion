# The Rebellion: Fists of the Fallen City — AI Dev Pipeline

A complete map of the AI-driven development pipeline used to take the GDD to a playable 2D browser brawler (Phaser 3, 8 levels), what it produced, what is still manual, and what it costs.

> **Evidence note.** Everything below was audited from this repository on 2026-11-03 (files, git history, blackboard log, playtest reports, and a fresh `npm test` run: **163 tests, 163 pass, 0 fail**). Where the repo holds no evidence, this document says so rather than guessing. That matters most in section 4 (cost).

---

## 0. The pipeline at a glance

```
GDD (6 .docx + 2 PDF, human-written)
  │
  ├─ A. CONTENT PIPELINE        pipeline/*.mjs   (ingest → brief → generate → validate/repair → report)
  │     4 writer agents: lore · enemies · levels · dialogue  → content/*.json + content/build/content.json
  │
  ├─ B. DESIGN AGENTS           .claude/agents/  (art-direction, ux-flow, menu-ui, music, 8 level-style agents,
  │                              critic, refiner)  → design/*.md, assets/*.svg, content/levels/styles/*.json
  │
  ├─ C. BLACKBOARD (goal-oriented build loop)   blackboard/
  │     G1 read-gdd ┐
  │                 ├→ G3 find-gaps → G4 prioritise → G5 generate-code → G6 review ─(fail)→ G5
  │     G2 scan-code┘                                   (owner approves each gap)
  │
  ├─ D. GAME BUILD              src/ (Phaser 3.80.1, ~10.6k lines of non-test JS) + index.html
  │
  └─ E. PLAYTEST AGENTS         qa/playtest-agents/  G7 levels · G8 bosses (Playwright, real key presses, video, invariants)
        → blackboard/facts/playtest-*.json → rebalance → re-run
```

33 agent definitions live in `.claude/agents/`. Two agents never talk to each other: the blackboard (`goals.json`, `facts/`, `log.md`) is the only channel, and `board.mjs` is the only writer of goal state.

| Stage | Entry point | Model calls? |
|---|---|---|
| Ingest + brief + validate + report | `npm run content` | No (free, deterministic) |
| Writer agents | `npm run content:generate` (spawns `claude -p`) | Yes |
| Blackboard round | "use blackboard-director-agent to run the goal board" | Yes |
| Tests | `npm test` | No |
| Playtests | `npm run playtest` / `:levels` / `:bosses` | No (scripted agents, not LLM calls) |
| Play it | `python dev-server.py 8777` → `index.html` | No |

---

## 1. What did the pipeline produce?

Counts below are from `content/REPORT.md` (2026-10-28), `content/build/content.json` (built 2026-11-02), and file listings. "In the build" means the playable game reads or plays it; "generated only" means it exists as data but the game does not use it yet.

### Story and dialogue

| Item | Count | In the playable build? |
|---|---|---|
| Lore entries | 67 (17 proposed, 50 canon) | **Partly.** The story intro card (`src/ui/storyData.js`) is lifted from `content/lore/` (GAP-027, owner-approved). Districts 2–8 lore feeds level styling. |
| Enemy entries | 22 | **Yes** for the units that have stats/sprites (grunt, Watcher, Breaker, Copper Fang, Brick Dugan, Railgun Royce). Others are stat blocks only. |
| Level definitions | 8 (41 waves total: 5/5/5/6/7/4/3/6) | **Yes.** `src/levels/levelData.js` loads `content/levels/levels.json` + `rust-gdd-levels.json` + 8 style files. |
| Dialogue entries | 99 (87 proposed) | **Only title-screen copy (7) and options-menu copy (22).** I found no runtime reference to the Zed barks (fight-start, combo, heavy-hit, low-HP, block, wave-clear, win, lose, retry), Rust taunts, or neighbour lines. That is ~70 entries generated but not wired. |
| Rage HUD copy | local file | Yes (`src/ui/rageHudCopy.js`) — hand-wired, not from the dialogue pipeline |

Validation: 57 of 57 source documents ingested, **0 schema/canon errors** across all four content types. **113 items are marked `proposed` and are awaiting owner approval** (`content/REPORT.md`).

### Levels in the build (all 8 playable)

1. Brick-Red Alley (5 waves, finale = "Brick" Dugan + crew)
2. Mustard Row (5)
3. Greenline Courts (5)
4. Stewpot Gardens (6, Dr. Maren Holt wave)
5. Songwindow Heights (7, Silas Wren wave, Copper Fang finale)
6. Iron Line Push (4)
7. Copper Fang Courts (3)
8. Overseer's Tower (6: cordon, Watcher, Breaker, random mix, all four Overseers among random fillers, then Halden Varr's two-phase final with a random crew; 420 s)

Each level has its own background SVG (`assets/levels/*/background.svg`, plus 7 concept variants for Levels 2 and 7), its own ambient-effects module (`src/levels/ambient*.js`), a per-level music track, and a shared end-boss track (a separate track for the final boss).

### Art assets

- **4,097 pixel-art PNG frames** under `assets/sprites/` — Zed (1,048), Brick Dugan (873), Railgun Royce (419), Rust Breakers (504 + 375 Type 2 + 72 walking + 80 action), Rust Watchers (375), Copper Fangs (128), hit/death FX (89 + 80), items such as bat, boxes and health pickups (54). Metadata (`assets/sprites/metadata.json`) shows they were produced with a pixel-art character/animation generator (the design docs name Pixel Lab) using text prompts and an 8-direction template.
- **Vector (SVG) UI and menu art:** 14 UI pieces (bars, buttons, panel, icons, victory card frame), 11 menu layers/posters, 8 level backgrounds, FX placeholder.
- **Still placeholders (15 SVGs in `assets/sprites/`):** drone, elite drone, megadrone, hologram, Iron Line cordon, Overseers Calder / Holt / Voss / Wren, Halden Varr, plus the original grunt/Watcher/Breaker/Copper Fang/Zed placeholders.

### Audio (31 files in `assets/sound/`)

8 level tracks, 2 boss tracks, menu theme, results music, level-complete sting, and ~16 SFX (punches, kicks, grunts, death cries, footsteps, whoosh, "go"). Music was sourced by `music-agent` from CC0 libraries (`design/audio/audio-manifest.md`). **Licence gap:** the SFX filenames are Freesound IDs and the repo records no licence or attribution for them (`design/audio/CREDITS.md` covers music only).

### Gameplay systems (all covered by `npm test`, 163 passing)

Light/heavy/finisher combat, parry with indicator, dodge/block, jump and kick, grab/throw, weapon pickups (bat, pipe), Zed's Rage system with HUD and entry flash, wave spawner with `ambush` / `pincer` / `surge` patterns, crew-waits-for-leader logic, boss health bar, bespoke boss AI for Brick Dugan (charge, grab, mega stomp, wall slam, rage punch, block) and Railgun Royce, title screen, main menu with parallax, options panel, pause, mute, victory card, loading screen, story card.

### Quality evidence from the playtest agents

- First full pass (2026-11-02): 22 runs, **0 invariant failures** (no soft-locks, bound leaks, stuck grabs, frozen timers, missing result screens or JS errors, including fuzzing and edge-abusing personas).
- Findings it raised: Level 1 finale was too punishing (Brawler lost 3 of 4); Level 5's 210 s timer too tight; only Dugan was a real boss (others were stand-in grunts).
- After the crowd-control and Level 1 rebalance, Level 1 full runs went **won 4/4** and the finale **won 4/4** for the competent personas. One new issue was logged (Dugan charging for 3 minutes without being hit by the "Rookie" persona).
- Honest caveat from the reports themselves: 3–4 runs per row, enemy AI unseeded — direction, not proof.

---

## 2. What manual steps remain?

| # | Manual friction point | Where it shows up |
|---|---|---|
| 1 | **Owner approval of 113 "proposed" items** (lore, enemies, all 8 levels, 87 dialogue). Nothing generated is canon until you say so. | `content/REPORT.md` |
| 2 | **Wiring generated content into the game.** Dialogue/barks and most lore are data only; a person or a code agent must hand-wire each one (e.g. `rageHudCopy.js` is still hand-written). | `src/`, `content/dialogue/` |
| 3 | **Art is made outside the pipeline.** Sprites are generated in an external tool, exported by hand, dropped into folders with ad-hoc names (some contain curly quotes and em dashes), then registered by hand in `assets/asset-keys.json` and `design/art/asset-manifest.md`. | `assets/sprites/` |
| 4 | **Remaining stand-in enemies and bosses.** Holt, Wren, Copper Fang (as end boss), Varr and several Rust units still spawn as grunts with an HP multiplier (`STAND_IN` in `levelData.js`); 15 placeholder SVGs remain. | `src/levels/levelData.js` |
| 5 | **Audio sourcing and licence checks.** The agent could not open OpenGameArt (HTTP 403); picks were not listened to; a human downloads, auditions and approves. SFX licences are unrecorded. | `design/audio/` |
| 6 | **Each blackboard round is human-triggered and human-steered.** You `reset`, ask the director to run, then pick which gap to build and approve it. (This is a deliberate gate, but it is manual.) | `blackboard/log.md` |
| 7 | **Playtest needs a real browser.** On 2026-11-03 G7 was blocked: the cloud sandbox had no Chromium and the Playwright CDN was blocked. Runs only work on your machine today. | `blackboard/log.md` |
| 8 | **Test list is hand-maintained.** `package.json` enumerates ~50 test files by name; a new test file is silently skipped until someone adds it. | `package.json` |
| 9 | **Duplicated data to keep in sync.** Level data lives in `content/levels/*.json` and a fallback mirror in `src/waves/waveData.js`. | `src/waves/` |
| 10 | **Human judgement of "feel".** Reports repeatedly flag questions only a human can answer (does the wave-3 hint teach? is Dugan's charge fair?). | `qa/playtest-agents/runs/*/SUMMARY.md` |
| 11 | **Housekeeping and delivery.** 9 modified + 3 untracked paths are uncommitted; a 19 MB `_playtest_bundle.tar.gz` and `_to_delete/` are manual leftovers; GDD source typos ("Rush" for "Rust") must be fixed by the document owner. | repo root |
| 12 | **Cost is not metered anywhere** (see section 4). | — |

---

## 3. What would it take to eliminate them?

Full automation is possible for most of this; a few steps are deliberately human and should be replaced by *policy*, not removed.

| Manual step | What 100% automation requires |
|---|---|
| 1. Approval of proposals | Replace per-item review with a **rule-based auto-approver**: auto-accept `proposed` items that pass the critic agent, cite sources, and conflict with no canon; escalate only conflicts. Record approvals in the blackboard. (Removes the gate for low-risk copy; keep a human for story-changing items.) |
| 2. Wiring content into the game | A **content-binding layer**: a generated manifest (`trigger → content id`) and a runtime `Barks.play(trigger)` that reads `content/build/content.json`. Add a gap-analyst check "every dialogue trigger has a call site", so G3 finds and G5 builds unwired content automatically. |
| 3. External art | Call the art generator from a **scripted step** via its API (prompt → generate → download → slice → name → register in `asset-keys.json`), driven by `asset-manifest.md`. Add a CI check that every manifest entry has a file and every file has a key. Needs an API key and a credit budget cap. |
| 4. Stand-ins and placeholders | Make the same art step **consume the enemy roster** (22 entries) so each unit gets sprites; add a G-goal "no `STAND_IN` waves allowed" that blocks release until bosses have bespoke AI and sprites. |
| 5. Audio | Pin audio to **licence-verified sources with an API** (Freesound/Kenney/OGA mirrors), have the agent record licence + URL per file into `CREDITS.md`, and fail CI on any file lacking a record. Auditioning by ear can be replaced by loudness/loop-point analysis plus a spot check. |
| 6. Human-driven rounds | A **scheduled runner** (CI or scheduled task) that runs `reset → director → review` nightly and opens a PR per gap; owner approval becomes PR review. |
| 7. Browser playtest | Run playtests in **CI with the Playwright image** (Chromium preinstalled, `--renderer canvas`), upload videos and `report.json` as build artifacts, and feed failures back into G5 automatically. |
| 8. Test list | Use `node --test "src/**/*.test.*"` so tests are discovered, not listed. |
| 9. Duplicate data | Delete the mirror; load `content/build/content.json` as the single source and generate the fallback at build time. |
| 10. Feel | Not automatable. Replace with a **small scheduled human playtest** (5 players, recorded) and use telemetry from the same invariants the agents track (time-to-clear, HP at finale, deaths per wave). |
| 11. Housekeeping | Pre-commit hook + CI: run tests, block uncommitted generated output, auto-clean temp bundles. GDD typo fixes: let the critic agent open an edit request to the document owner. |
| 12. Cost metering | Run every headless agent with `claude -p --output-format json`, append `total_cost_usd` and token counts to `pipeline/cost-log.jsonl`, and have `run.mjs` and `board.mjs` print a per-stage total. About 20 lines of code. |

**Realistic ceiling:** items 2, 6–9, 11 and 12 can be fully automated with code. Items 3–5 can be automated given paid APIs and a spend cap. Items 1 and 10 stay human by design, reduced to review and playtest rather than hand-work.

---

## 4. Cost analysis

### 4.1 Total actual run cost

**$ not recorded — the repository contains no usage, billing, token or cost data, so I cannot state an actual dollar figure without inventing one.**

I searched every pipeline script, the blackboard, the playtest runner and the settings file for cost, token, usage and credit tracking. The only hits were unrelated words. `pipeline/run.mjs` calls `claude -p` and prints the exit code and last lines of output, but discards token counts and cost. Blackboard log entries carry timestamps but no usage.

What *can* be stated from evidence:

| Component | Cost evidence |
|---|---|
| Ingest, brief, validate, report (`npm run content`) | $0 — no model calls |
| Tests (163) and the scripted playtest agents | $0 — local code, no LLM calls |
| Music | $0 — CC0 sources, no attribution required for the picks that shipped |
| Sound effects | Licence/cost not recorded (verify) |
| Writer agents, blackboard agents, design agents, code generation | **Unmetered.** They ran through the Claude Code CLI; cost depends on your plan (subscription usage vs. API billing), and no per-run figure was captured |
| 4,097 pixel-art frames | **Unmetered.** Generator credits/subscription not recorded in the repo |
| Human time | Not tracked (84 commits across 2026-10-04 → 2026-11-03) |

**To get the real number (takes a few minutes):**

1. On the machine where the agents ran, run `npx ccusage` (reads Claude Code's local session logs) and filter to 2026-10-04 → 2026-11-03 for this project. That gives actual tokens and API-equivalent cost per day and per session.
2. Open the art generator's billing/usage page and read credits spent on the Zed, Dugan, Royce, Breaker, Watcher and Copper Fang batches.
3. Paste both totals in here:

| Line item | Amount |
|---|---|
| Claude Code usage (writer + blackboard + design + code agents), 2026-10-04 → 2026-11-03 | $____ |
| Art generator credits | $____ |
| Audio / other | $0 (CC0) + $____ |
| **Total actual run cost** | **$____** |

If you share the `ccusage` output or billing exports, I will fill this table in from them.

### 4.2 Most expensive pipeline step

**Not measurable from this repo.** Based on structure only (this is an inference from token volume, not a measurement):

- **Likeliest top model-spend step: the writer agents with full-document briefs** (`npm run content:generate`). Each of the four writers receives a RAG brief plus whole primary documents (`fullDocs` in `pipeline/config.mjs`, e.g. all of "The Rebellion.docx", the 18-chunk Rage spec) and runs a repair loop up to `--repair N` rounds, with the level and dialogue writers also reading lore and enemy output. Output was large (99 dialogue entries, 67 lore entries).
- **Second: blackboard G5 code generation and G6 review**, repeated per gap across 6+ rounds (logs show 4–6 gap builds on 2026-10-13, 10-19), each re-reading `contracts.md`, the diff and the full test run.
- **Likely largest *non-LLM* spend: the sprite generator** — 4,097 frames is far more volume than any text step.

The cost-log step in section 3 (row 12) turns this guess into a measured answer after one run.

### 4.3 Solo / small-team sustainability

**Assessment: very likely sustainable for a solo developer or small team, with two conditions.** This is a judgement from the pipeline's structure, not from a measured bill.

Why it is sustainable:

- **The expensive part is bounded and one-off per change.** The deterministic stages (ingest, validate, test, scripted playtests) are free, so cost scales with how often you regenerate content or build a gap, not with every run.
- **Each blackboard round is small.** The log shows individual agent tasks finishing in roughly 1–2 minutes, one gap per round, so cost is incremental and controllable.
- **Free-licensed audio and a free engine** (Phaser, CC0 music) keep fixed costs near zero.
- **Quality gates catch waste early.** 0 validation errors on the final run, tests and invariant-checking playtest agents mean fewer paid retries.

Conditions that must hold:

1. **Meter it.** Without a cost log you cannot know whether a full regeneration costs a coffee or a week of budget. Do section 3, row 12 before scaling up.
2. **Cap art generation.** Sprites are the volume risk; set a credit budget per character and reuse rigs. Re-generating all ~4,100 frames when one design changes would be the most expensive mistake available.

Main risk to sustainability is not API spend but **human review time** (113 proposals, wiring, art cleanup, feel playtests); automating items 2, 6, 7 and 9 in section 3 reduces that most.

---

## Appendix: commands

```bash
npm run content                 # ingest, brief, validate, report (free)
npm run content:generate        # + run the 4 writer agents (model calls)
npm test                        # 163 tests
npm run playtest                # all playtest agents (needs Playwright Chromium)
node blackboard/board.mjs status
python dev-server.py 8777       # then open http://localhost:8777/index.html
```

Key files: `pipeline/README.md`, `blackboard/README.md`, `qa/playtest-agents/README.md`, `content/REPORT.md`, `design/team/agent-team-setups.md`.
