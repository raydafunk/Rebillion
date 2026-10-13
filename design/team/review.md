# GDD review and build audit (Setup C)

Three read-only reviewers: **gaps** (undefined rules), **scope** (Tier 0 feasibility), **skeptic** (verified the other two against the code and tests). Run as parallel subagents, not a live agent team, so the skeptic challenged the others' written reports rather than debating in real time. Skeptic ran `node --test`: all 16 tests pass.

## Headline

Tier 0 is feasible and the code is well ahead of the plan. `src/` already has player, combat, enemies, waves, arena, state and a MenuScene, with tests. **Missing:** `ArenaScene`, `HudScene`, `ResultScene`, and the `index.html` wiring (it only logs `start-game`). Nothing calls `state.start()` or `state.tick()`, so the timer does not run yet.

## 1. GDD gaps and proposed defaults

| # | Gap | Default | Status |
|---|---|---|---|
| 1 | Win condition contradicts itself ("reach the end" vs "clear arena") | Win = final wave cleared (`arena-cleared`) | In code; fix the GDD text |
| 2 | Time limit missing | 120 s | `src/state/config.js`. `design/ux/lose.md:25` shows 00:48, fix it |
| 3 | Wave and enemy counts | 3 waves of 3, 4, 5 grunts | Code and contract agree. `lose.md:18` says "wave 3 of 4" |
| 4 | Retry rules | Unlimited, full reset to wave 1 | Done |
| 5 | HP and damage | Player 100, grunt 30, 400 ms invuln | Placeholders in `combatData.js` |
| 6 | Lose edge cases | Failsafe teleports and never ends the round. Same-frame tie: first emission wins | Tie order depends on scene update order. Decide when `ArenaScene` is written |
| 7 | "Next level" | Not in Tier 0. Win leads to Play Again and Main Menu | Mark it post-Tier 0 in the loop diagram |
| 8 | Defence | Block takes 25% damage and knockback. Dodge and parry negate | Parry window, dodge i-frames and cooldown still unset |
| 9 | Attacker cap | 2 | In code |
| 10 | **Pick-up objects** | **Cut from Tier 0** (no default, code or owner) | Decision needed |
| 11 | Pause and input bindings | Esc/P pauses | Proposed only |
| 12 | Resolution | 1280x720, FIT | Assumed |

**GDD text fixes:** Wave Spawner row repeats the Game State text; "Rush" should be "Rust" in the Pitch; "200 tokens" budgets and blank budget cells are not meaningful (replace with S/M/L plus a task cap); typos ("Face Paced", "modem", "Desponds On", "Token coast", "Executives Sections"); Lose State has no arrow back to Retry; Camera & Bounds' dependency should be Enemy (failsafe) and Wave Spawner (lock).

## 2. Code vs docs mismatches (verified)

- **Lose reasons:** contract and code use `ko` / `timeout`; `flow.md:70` and `lose.md:87` use `health` / `time` / `failsafe`. Use the contract names and map them in the UI.
- **UI-proposed events not in the contract:** `enemies-remaining-changed`, `round-started`, `game-paused`, `game-resumed`, `round-stats`. Add them to `contracts.md` and `src/shared/events.js` or cut the UI features that need them.
- Correction to the gaps report: no "4 / 4" in `win.md`; only `lose.md:18` is wrong.
- Correction to the scope report: Game State does not depend directly on Wave Spawner (it listens for `arena-cleared`); the dependency is through events only.

## 3. Risks both first-pass reviewers missed (from the skeptic)

Ordered by likelihood of hurting the build:

1. **Double start on retry.** `WaveSpawner` restarts itself on `retry` (`WaveSpawner.js:14`) and `Arena.start()` also calls `spawner.start()`. If `ArenaScene` does both, `wave-started` fires twice and the UI shows duplicate banners.
2. **Retry ordering and ownership.** Five independent `retry` listeners (enemy destroy, combat reset, spawner restart, state reset, Zed respawn) depend on construction order. Nobody owns calling `Zed.respawn()`. Lead should own a retry integration test.
3. **Pause race.** Combat invulnerability uses `Date.now()` while the timer uses `tick(delta)`. A pause freezes the timer but not invuln or hit-stun windows. Switch combat to the scene clock before building pause.
4. **Attacker-cap starvation.** Slots are taken at `circleRadius` (180 px), not at attack time, and the failsafe skips circling grunts. Two blocked grunts can starve the rest with nothing flagged as stuck.
5. **Failsafe teleports land on spawn points**, which can be on top of the player. With spawns at `lockX+60` and `lockX+1220` the player can be cornered, and 400 ms invulnerability is the only protection.
6. **Enemies have 0 ms invulnerability and hit-stun resets on every hit**, so one grunt can be stun-locked forever.
7. **Wave transitions have no breathing beat.** `wave-cleared` and `wave-started` fire in the same call and the camera lock unlocks and relocks in one tick.
8. **After `round-lost` enemies keep updating** and attacking visibly. A lost-state freeze is unspecified.
9. `seen` in `hitResolver.js` grows until retry (minor). `Zed._handleDamage` ignores the dodge/parry contract.

## 4. Pillars vs what exists

| Pillar | State |
|---|---|
| Impactful, fast combat | **Partial.** Move data, knockback, hit-stun and grunt telegraph exist. **No hit-stop, screen shake or sound anywhere in `src`**; `design/art/hit-feedback-spec.md` is spec only. |
| Combos and defence | Combos tested (3-hit chain, cancel windows). Block, dodge and parry work in combat but parry has no reward. No juggle. |
| Wave pressure | Mechanics exist, but pressure is weak: 12 grunts at about 3 s each is about 36 s of the 120 s, and roughly 11 HP/s undefended against 100 HP. The timer will rarely bite. Tune `config.js` (shorter timer or more enemies) after a first playtest. |

## 5. Missing tests

- Real `Zed` integration (needs Phaser).
- Timeout and clear on the same tick resolve deterministically.
- Retry mid-round and double `wave-started`.
- Slot starvation, and failsafe removing a grunt on the 4th trigger.
- Dodge/parry on the player path matches the combat contract.

## 6. Recommended build order and cuts

1. Fix the GDD text and the UX mismatches above (cheap, doc-only).
2. Add the five UI events to the contract, or cut them.
3. `ArenaScene` wiring (lead): call `state.start()`/`tick()`, decide who starts the spawner on retry, call `Zed.respawn()`.
4. `HudScene` and `ResultScene` (Setup B), using the real events.
5. Hit-stop, shake and sparks per the hit-feedback spec.
6. First playtest, then tune wave pressure and fix the risks in section 3.
7. **Defer:** juggle, parry reward, pick-up objects, scroll lock, gamepad, pause menu, "Next level".

## Decisions for the owner

- Confirm cutting pick-up objects from Tier 0.
- Confirm the 120 s limit and 3x(3,4,5) waves, or change them in `config.js`.
- Rename the UI's lose reasons to the contract's, or the other way round.
