# Critic Log

Format: file, line, before, after, rule violated, owner, status.

## Pass 1: main menu copy

Checked: `GameDesignDocument/The Rebellion.docx`, `GameDesignDocument/Rebellion menu desgin.docx`, `design/ux/menu-concept.md`, `design/ux/main-menu.md`, plus a repo-wide search of `design/` for Rush, Rust and Fallen.

### Changes applied (design/lore only)

| # | File | Line | Before | After | Rule | Owner |
|---|---|---|---|---|---|---|
| 1 | `design/lore/menu-copy.md` | menu.footer | "W/S select / Enter confirm" (menu-concept.md:20) | "W/S to choose  /  Enter to go" | Tone drift: terse, system-speak ("confirm") on Zed's side; prefer plain neighbourhood voice | ui |

### Proposed, not applied (outside design/lore)

| # | File | Line | Before | After | Rule | Owner |
|---|---|---|---|---|---|---|
| 2 | `GameDesignDocument/The Rebellion.docx` (Pitch) | n/a | "overtaken Rush a corrupt private Security Force" | "overtaken by the Rust, a corrupt private Security Force" | Lore break: Rush/Rust spelling | GDD owner |
| 3 | same | n/a | "The Rebellion first of the Fallen city" | "The Rebellion: Fists of the Fallen City" | Lore break: title and "Fallen City" capitalisation | GDD owner |
| 4 | same | n/a | "fight your way through Fallen to get it back" | "fight your way through the Fallen City to get it back" | Lore break: "Fallen" alone; canonical name is "Fallen City" | GDD owner |
| 5 | `design/ux/menu-concept.md` | 4 | "edge of a fallen city block" | "edge of a Fallen City block" | Lore: lowercase reads as a generic description, not the place name | Art/UX owner (design/ux not in this pass's edit scope) |
| 6 | `design/ux/main-menu.md` | 29, 43-45 | Wireframe shows "START GAME" and prompt "Enter / A : Select"; concept shows "Fight" and "W/S select / Enter confirm" | Use FIGHT and the footer in `menu-copy.md` | Consistency: two specs disagree on button label and footer | ui |
| 7 | `design/ux/win.md` | 17 | "Rust has been driven out of the arena." | "The Rust have been pushed back." | Lore: Rust read as a place or stain (known candidate, not part of this menu pass) | ux owner |

### Audited and fine

- Title "THE REBELLION" and subtitle "Fists of the Fallen City": match GDD title; "Fallen City" correct.
- Option labels Fight, Controls, Options, Quit: short, active, fit the voice. FIGHT suits the "Fists" title. Note that Options has no spec and Quit is not meaningful in a browser (open question 7 in canon).
- Poster "Local Heroes Benefit: Keep the Lights On": hopeful, community voice, matches the GDD's murals of local heroes. No change.
- Poster "Rust Notice 114 / CURFEW struck through": Rust is named as a force that issues orders, not a place, and the cross-out shows the community answering it. Tone is right. Caveat: the curfew and numbered notices are not in the GDD; logged as open question 1, treated as flavour.
- Rust/Rush: no occurrence of "Rush" in any menu text. The only instance is the GDD Pitch (item 2).

### Open questions for the GDD owner

See `design/lore/canon.md`, Open lore questions (1 to 7).

## Pass 2: Zed pixel-art switch (docs consistency)

Checked: `design/art/style-guide.md`, `design/art/asset-manifest.md`, `design/art/zed-pixellab-prompt.md`, `design/lore/canon.md`, `design/ux/*.md`, `design/team/agent-team-setups.md`. Frame math verified: 6+8+4+4+6+2+6 = 36 frames, 8x5 grid of 128x128 = 1024x640, 4 empty cells; manifest, prompt pack and style guide agree. No "all vector" or "no mixing" claim remains in `design/ux/` or `design/team/` (agent-team-setups.md has no art-style text).

### Changes applied

| # | File | Line | Before | After | Rule | Owner |
|---|---|---|---|---|---|---|
| 8 | `design/art/style-guide.md` | 27 | "Shadows are flat 25 percent black ellipses under every character." (read as baked in, conflicting with Zed's "not baked in"; also 4px outline stated with no Zed exception vs Zed's 1px) | "...under every character, drawn by the game at runtime (never baked into any sprite, Zed's included)." plus "Zed is the exception, 1px pixel outline" | Spec conflict | art |
| 9 | `design/art/style-guide.md` | OQ 4 | "Final animation source: hand-authored spritesheets, skeletal rig..., or tween-driven vector parts? Affects frame counts in the manifest." | Scoped to Rust enemies and FX; states Zed is settled (36-frame pixel sheet fixed in manifest) | Spec conflict with manifest | art |
| 10 | `design/art/zed-pixellab-prompt.md` | 6 | "the style guide currently says flat vector and 'don't mix pixel art and vector'. If you go pixel art, either approve it..." (stale; exception is now approved) | States the approved exception and points to OQ 1 for other art | Stale spec | art |
| 11 | `design/art/zed-pixellab-prompt.md` | 22 | "The game adds a flat 25 percent black ellipse." | "The game draws the flat 25 percent black ellipse under every character at runtime." | Wording consistency | art |
| 12 | `design/art/zed-pixellab-prompt.md` | after 6 | (none) | Added PLACEHOLDER NOTE: young, street-level, short dark hair, brown skin are not canon | Lore: never invent (canon OQ 3) | art |
| 13 | `design/art/style-guide.md` | OQ 5 | "Zed's design (skin tone, hair, silhouette) needs creative sign-off" | Adds "young street hero" read and cites canon OQ 3 | Lore: never invent | art |
| 14 | `design/lore/canon.md` | OQ 3 | "Who is Zed (age, role, backstory)?..." | Appended note that the current look is placeholder, not canon | Lore | critic |

### Verified, no change
- Zed details vs canon: GDD gives no age or looks, so nothing contradicts it once marked placeholder. "Zed's side is warm, rounded, casual" matches the prompt. Style guide Skin Brown row already says placeholder.
- Hit/KO prompts ("eyes squeezed shut", "falls flat on his back") are non-gory and fit tone.
- Remaining "flat-vector" wording in style-guide sections 1, 6 (gradients rule) and 9 (menu) is scoped to non-Zed art; fine.

### Proposed, not applied
- Item 7 (`design/ux/win.md:17` "Rust has been driven out of the arena") is still unfixed per Pass 1 and is in scope for ux owner; not re-checked for edits this pass.
- Style-guide section order is 1-7, 9, 8 (menu section 9 sits before open questions 8); suggest renumbering, structure change left to art owner.
- Phaser `pixelArt: true` would affect all textures (smooths vector SVG-to-PNG art off); recommend per-texture `setFilter(NEAREST)` for Zed only. Message to engine owner, not applied (src/ out of scope).

## Pass 3: Options menu copy (`content/dialogue/options-menu.json`)

Checked: all 30 Options items against `design/lore/canon.md`, the GDD menu design table and the UX specs. No lore breaks. Two tone-drift edits applied by the critic during the content pass (logged here after the fact).

### Changes applied

| # | File | Item | Issue | Fix | Rule | Owner |
|---|---|---|---|---|---|---|
| 15 | `content/dialogue/options-menu.json` | `options-music-volume`, line 2 | Tone drift from the community voice (final wording: "Music drifting out of the open windows.") | Reworded to the open-windows image | Tone | content |
| 16 | `content/dialogue/options-menu.json` | `options-apply`, line 3 | Tone drift (final wording is plain and never scolding) | Reworded to plain, friendly copy | Tone | content |

### Proposed, not applied (owner decision)
- "The wall" and "the block" are not GDD terms; confirm they are acceptable menu vocabulary.
- 28 of 30 items are proposed placeholders (only music and SFX volume are canon).
- Default key table (GDD) conflicts with `flow.md` / `main-menu.md` ("bindings undefined"); pause default P collides with Pick up default P.

## Pass 4: Options controls copy (`content/dialogue/options-controls.json`)

Checked: all 10 items against `design/lore/canon.md` and `content/dialogue/options-menu.json`. No Rush/Rust issues (Rust not mentioned), no military phrasing, no scolding, no gore. Conflict and reserved-key messages are plain and neutral. One tone-drift edit applied (wording only; ids, defaults and key values untouched).

### Changes applied

| # | File | Item | Before | After | Rule | Owner |
|---|---|---|---|---|---|---|
| 17 | `content/dialogue/options-controls.json` | `options-bind-jump`, line 3 | "Not rebindable yet." | "Fixed for now." | Tone: generic game-speak; matches "fixed for now" already used in `options-not-rebindable` line 1 and the PAD item | content |
| 18 | `content/dialogue/options-controls.json` | `options-bind-crouch`, line 3 | "Not rebindable yet." | "Fixed for now." | Same | content |
| 19 | `content/dialogue/options-controls.json` | `options-not-rebindable`, line 2 | "Those three come as a set. Not rebindable yet." | "Those three come as a set. Fixed for now." | Same | content |

### Proposed, not applied (owner decision)
- Consistency conflict: `options-menu.json` `options-bind-move` has `control: rebind` with hint "Press Enter, then the key you want.", but `options-controls.json` (`options-not-rebindable`, `options-bind-jump/crouch` notes) treats Move as read-only. Content owner must pick one; if read-only, Move line 3 should become "Fixed for now."
- Terms "pad", "the wall", "the block" are not GDD terms; confirm as menu vocabulary.
- `options-pickup-pause-collision` is copy for an unresolved default clash (P); drop when resolved.

## Pass: content/ audit (lore, enemies, levels, dialogue)

| File | Before | After | Rule | Owner |
|---|---|---|---|---|
| content/dialogue/extended.json (rust-taunt-shield-sergeant) | "Rust holds this street." | "Rust hold this street." | Rust takes plural verbs | content |
| content/enemies/rust-roster.json (rust-grunt description) | "Rust strips recruits ... and gives them serial numbers" | "the Rust strip recruits ... and give them serial numbers" | Rust is a force of people, plural | content |
| content/lore/rust-expanded.json (rust-origin body) | "Rust transformed ... tightening its control" | "The Rust transformed ... tightening their control" | Rust takes plural | content |
| content/levels/rust-gdd-levels.json (level-06 outro) | "Zed's mother waves a ladle from the stall." | "A neighbour waves a ladle from the stall." | GDD does not say where Zed's mother is (stall seized) | content |

All four mirrored in content/build/content.json. Proposed, not applied: title-wall-writing "Sector 7 ->" (clinical, GDD names no sectors; suggest a district name such as "Mustard Row ->"; text comes from the title-screen mock image, owner to decide).
