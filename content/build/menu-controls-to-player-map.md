# Menu controls to player contract map

Sources: `GameDesignDocument/Rebellion menu desgin.docx` (corpus id `rebellion-menu-desgin`, chunks 1-3, authority primary), `design/ux/flow.md`, `main-menu.md`, `pause.md`, `design/team/contracts.md`. Code read: `src/player/{input,config,moves,jump,stateMachine,Zed}.js`, `src/scenes/{ArenaScene,ResultScene,HudScene}.js`, `src/ui/MenuScene.js`. No source was modified. Note: the docx has embedded images (pixels not read), so any bindings drawn only in the mock-up image are not covered.

Authority: the menu design docx is primary and is the only document that defines gameplay bindings. `flow.md` says gameplay bindings are "not defined in the GDD", and the Controls panel in `MenuScene` shows "TBD". The docx table therefore supersedes those.

## Gameplay controls (docx "Action | Primary | Alternate" table)

| Control (menu design) | Input binding (doc) | Player action/state | Implementing code location | Status |
|---|---|---|---|---|
| Move left/right | A/D; Left/Right arrows | `left`/`right` -> moveX, state `run`, facing flip | `input.js` KEY_MAP.left/right; `Zed.js` update() horizontal block (runSpeed 220) | implemented |
| Jump | W or Space; Up arrow | `jump` -> JumpController (coyote 90 ms, buffer 110 ms), state `jump`; variable height on release | `input.js` KEY_MAP.jump (ArrowUp, KeyW, Space); `jump.js`; `Zed.js` update() | implemented |
| Crouch | S; Down arrow | none | no `crouch` in ACTIONS, KEY_MAP, WATCHED or the state machine (states: idle, run, jump, attack, hitstun, block, dodge) | missing |
| Light attack | J; Z | `light` -> opener `light1`, chain light1 -> light2 -> light3 | `input.js` KEY_MAP.light; `moves.js` OPENERS/MOVES; `stateMachine.js` step() | implemented |
| Heavy attack | K; X | `heavy` -> opener `heavy1`; cancel into heavy1 from light1/light2 | `input.js` KEY_MAP.heavy; `moves.js`; `stateMachine.js` | implemented |
| Dodge / dash | L; C | state `dodge` (24 f, 14 i-frames, 30 f cooldown, 380 px/s) | Code binds dodge to ShiftLeft, V (`input.js` KEY_MAP.dodge). L and C are bound to block instead | conflicting |
| Block | I; V | state `block`, first 8 frames = parry window, then block | Code binds block to KeyL, KeyC (`input.js` KEY_MAP.block). KeyI is not bound anywhere. V is bound to dodge | conflicting |
| Parry | not listed in table (only "Parry / pick-up" row in Controls panel, key TBD) | `guardType` 'parry' = first `parryFrames` (8) of a fresh block | `stateMachine.js` guardType; `moves.js` GUARD; `Zed.js` _handleDamage (negates damage) | implemented (no own key; see gap 5) |
| Pick-up objects | not listed (panel row "Parry / pick-up", key TBD) | none | no pickup code in `src/` | missing |

## Menu and pause controls

| Control (menu design / UX specs) | Input binding | Player action/state | Implementing code location | Status |
|---|---|---|---|---|
| Menu select up/down | W/S (docx footer), also Up/Down, pad D-pad/stick | Selection tween, wraps | `MenuScene.js` ~l.177 (wrap), key handlers ~l.239-248, pad ~l.250 | implemented |
| Menu confirm | Enter (docx footer); Space, pad A, click (flow.md) | Fight starts game, Controls opens panel, Options/Quit show notice | `MenuScene.js` l.244, confirm() l.269 | implemented |
| Mouse hover/click | Hover selects, click confirms | Same as keyboard | `MenuScene.js` l.148-149 | implemented |
| Footer hint | "W/S select / Enter confirm" | Text only | `MenuScene.js` l.9 FOOTER | implemented |
| Controls panel back | Esc, Backspace, B, click outside | Closes panel | `MenuScene.js` l.245, l.208 | implemented |
| Controls panel content | Rows Move, Light, Heavy, Block, Dodge, Parry/pick-up, Pause | Displays bindings | `MenuScene.js` l.21-22 BINDINGS all "TBD" | missing (values not filled; docx now supplies them) |
| Pause open (in level) | Esc, P, pad Start; auto on tab blur | Scene pause, ResultScene mode 'pause' | `ArenaScene.js` l.73-102, `_pause()` l.117 | implemented |
| Pause resume | Esc, P, Backspace, B, Start | Resumes ArenaScene | `ResultScene.js` l.60, l.103, l.112, `_resume()` l.128 | implemented |
| Pause navigation/confirm | Up/Down (W/S), Enter/Space, A | Resume / Restart (confirm) / Main Menu (confirm) | `ResultScene.js` l.49-60, l.80-99 | implemented |
| Clear held keys on resume | pause.md l.65 | No stray attack after resume | `Zed.js` keeps its own `down` Set fed by keydown/keyup; nothing clears it on pause/resume. A key released while paused may stay "held" | missing (risk) |
| HUD hint | "Esc: pause" | Text only | `HudScene.js` l.25 | implemented |

## Gaps and conflicts

1. CONFLICT, block/dodge: docx says Dodge = L/C and Block = I/V. Code has Block = L/C and Dodge = Shift/V. L/C are swapped between actions, I is unbound, V is bound to the opposite action, and Shift is an undocumented dodge key. Affects `input.js` KEY_MAP and the `WATCHED` list in `Zed.js`. Player-agent should change the bindings to match the docx (primary authority), with tests in `src/player/test/` updated.
2. MISSING, crouch (S / Down): no action, state or animation. Also S and Down are menu navigation keys, which is fine in menus, but in the arena the keys are unbound today. Needs a decision on what crouch does mechanically (low dodge, evades highs, nothing in Tier 0).
3. MISSING, Controls panel values: `MenuScene.js` BINDINGS are all "TBD" (OQ-M1 / OQ-F5). The docx now defines most bindings, so the panel can be filled once gap 1 is settled. Menu-ui-agent work; Pause key is Esc/P (Start on pad).
4. MISSING, pick-up objects: the GDD pillars mention pick-up objects, and the docx lists no key for it. No code exists. Needs an owner decision on whether it is in Tier 0 and on its key.
5. UNDEFINED, parry key: the docx table has no Parry row, but the Controls panel lists "Parry / pick-up". Code treats parry as the first 8 frames of a fresh block (no separate key). Needs owner confirmation that "parry = timed block" is the intended design.
6. RISK, held-key state across pause: pause.md requires held buttons to be cleared on resume. `Zed.down` is not cleared; stuck-key or stray-attack behavior is possible after pause or tab blur. Code fix belongs to player-agent.
7. NOTE, Space double role: Space = Jump in the arena and Confirm in menus/pause. Both work as specified because they are in different scenes, but Space pressed to confirm "Resume" on the pause overlay could leak into a jump on resume if the held state is not cleared (ties to gap 6).
8. NOTE, pause key vs gameplay keys: `flow.md` OQ-F5 feared collisions. With the docx bindings, Esc/P/Start do not collide with any gameplay key. Resolved by the docx, but flow.md should be updated.
9. NOTE, contract drift: `contracts.md` says block gives damage x0.25 and hitstun 0, while `Zed._handleDamage` for block only applies reduced knockback and relies on combat for damage (not verified in this task). Out of scope for controls mapping.
10. GDD typo carried through: "Rush" for "Rust" appears in `the-rebellion` text (not editable by this pipeline).

## Needs owner approval

- Confirm the docx bindings (Block I/V, Dodge L/C) are final, and approve changing player code to match; confirm whether ShiftLeft should be dropped.
- Decide crouch behavior and Tier 0 inclusion.
- Decide pick-up objects scope and key.
- Confirm parry = first frames of block (no separate key) or add a key.
- Approve filling the Controls panel from the docx table (and adding rows for Crouch and Pause).
- Confirm pause on Esc/P/Start (OQ-P1, OQ-F5) and held-input clearing on resume.

No content files were changed, so the validator gate was not needed. Corpus read: manifest at `pipeline/corpus/manifest.json` lists the menu docx as ingested (3 chunks, images unread).
