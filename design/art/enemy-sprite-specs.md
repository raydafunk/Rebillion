# Rust Enemy Sprite Specs (all 14 units)

Owner: art-direction-agent. Status: DRAFT for owner approval. Nothing in this file is final art. Every sprite in `assets/sprites/rust-*-placeholder.svg` is a generated PLACEHOLDER box (slate body, steel helmet, cyan visor) so other agents can wire keys now.

Sources of truth, read in full: `content/enemies/rust-roster.json` (grunt), `content/enemies/rust-gdd-units.json` (the other 13), `design/art/style-guide.md`, `design/art/hit-feedback-spec.md`, `design/art/asset-manifest.md`, `assets/asset-keys.json`, `src/player/zedVisual.js` and `assets/sprites/zed/` (Zed's loading convention). Telegraph and attack timings below are copied from the unit JSON; where a move has no timing in the JSON the cell says "not set" and the enemy owner must set it (rule: never below 300 ms).

## 0. Decisions that need owner approval (summary)

1. Phase-2 "red" glows (Calder suit, Voss drones) break the no-red-on-enemies rule. APPROVED by the owner: Overload Violet `#8E5BFF` with Overload Ice `#BFF4FF` core. See section 3.1.
2. KO is a knockdown, never a kill. Spec in section 3.2. The boss defeat beat (what the player sees when a boss reaches 0 HP) is a narrative question for the owner.
3. Art style for Rust. The style guide says Rust stays flat vector next to pixel Zed, but Open Question 1 is still open. This spec is written for flat vector delivered as PNG. If the owner picks pixel art, see section 1.2 note.
4. Copper Fang's "copper" gauntlets cannot be copper-orange (red-orange ban). Recommended muted Bronze `#9A8466`. Section 2.3.
5. Grunt display height (96 px figure) is shorter than Zed (frame 120 px on screen, figure unmeasured here, roughly 100 to 110 px). Confirm in-engine that the grunt does not read as a child next to Zed. Sizes below keep the grunt as the base (1.00).
6. Unit assumptions marked "ASSUMPTION" in the unit sections (Copper Fang phase-2 shield, Hologram attack is a punch only, Cordon has no Jab Combo, Varr stance colours, Wren Rooftop Execution shown as a knockdown dive).
7. The placeholder `assets/sprites/rust-grunt-placeholder.svg` has a baked ground-shadow ellipse. That breaks the style-guide rule (the game draws the shadow). I did not edit it. New placeholders do not bake a shadow.

## 1. Global rules

### 1.1 Frame size, scale, feet anchor

- Frames are authored at final on-screen size. Display scale is 1.0 for every enemy, with one exception: if Rust becomes pixel art (1.2).
- One canvas size per unit, used for every state and both facings, so the engine never needs a per-clip origin table (Zed needs one because its clips have mixed canvases; enemies must not).
- Feet anchor: the lowest standing-foot pixel row is `frameHeight * 15/16 - 1` (128 frame: row 119, matching the grunt placeholder). Engine origin for every ground unit is `(0.5, 0.9375)`, horizontally centred on the body mass at rest. Flyers (drones, MegaDrone): the same baseline row marks the ground point under the unit; the body floats 20 px above it in Idle, bob up to 3 px is authored into the Idle loop.
- Keep the figure inside the canvas in every pose, including raised weapons, lunges and the extended-arm poses. Leave 4 px of empty border on every side.
- No ground shadow in any frame (the game draws the flat 25 percent ellipse).

| Unit | Sprite key | Frame (px) | Figure at rest (W x H) | Height vs grunt | Height vs Zed (about 110) |
|---|---|---|---|---|---|
| Grunt | rust.grunt | 128x128 | 52x96 | 1.00 | 0.87 |
| Iron Line Cordon | rust.iron-line-cordon | 128x128 | 56x96 | 1.00 | 0.87 |
| Breaker | rust.breaker | 192x192 | 110x150 | 1.56 | 1.36 |
| Watcher | rust.watcher | 128x128 | 44x92 | 0.96 | 0.84 |
| Copper Fang | rust.copper-fang | 160x160 | 70x112 | 1.17 | 1.02 |
| Halden Varr | rust.halden-varr | 224x224 | P1 84x130, P2 100x160 | 1.35 / 1.67 | 1.18 / 1.45 |
| Voss | rust.overseer-voss | 160x160 | 66x108 | 1.13 | 0.98 |
| Calder | rust.overseer-calder | 256x256 | 140x190 | 1.98 | 1.73 |
| Wren | rust.overseer-wren | 160x160 | 48x100 | 1.04 | 0.91 |
| Holt | rust.overseer-holt | 160x160 | 60x108 | 1.13 | 0.98 |
| Voss Drone | rust.drone | 64x64 | 40x36 (body) | 0.38 | n/a (hovers at head height) |
| MegaDrone | rust.megadrone | 192x128 | 150x80 (body) | 0.83 | n/a |
| Hologram Decoy | rust.hologram | 160x160 | 66x108 (same as Voss) | 1.13 | 0.98 |
| Elite Drone | rust.elite-drone | 80x80 | 52x44 (body) | 0.46 | n/a |

Rationale: Varr and Voss are near Zed's height so the duel reads as equals; the Breaker and Calder are the only units clearly bigger than Zed (heavy-enemy cue); the Watcher and Wren are slimmer, not shorter, so their lean silhouette is the cue.

### 1.2 Style

- Flat vector look: 2 to 3 flat tones per colour, no gradients, no textures, no dithering. Outline `#14181C` (Rust Ink), 4 px at 128 px frame height, scaled proportionally (192 frame: 6 px, 256 frame: 8 px, 64 frame: 2 px). Light from top left.
- Deliver as PNG (transparent, straight alpha). Vector source (SVG or layered file) is kept alongside under `assets/sprites/_src/<unit>/` if the artist wants, but the game loads PNG only.
- Silhouette first: every unit must be identifiable as a solid black shape. Boxy, symmetrical, straight edges (Zed is round and warm).
- NOTE if the owner chooses pixel art for Rust: author at Zed's pixel density (1 source px = 2.5 screen px), so frame sizes above divide by 2.5 (grunt about 51x51, rounded up to a multiple of 4), display scale 2.5, nearest-neighbour filtering, 1 px outline `#14181C`. Counts, states and naming do not change.

### 1.3 Facing

- Side view only, east and west textures per frame, same as Zed (`ZED_SPRITE.dir`: right = east, left = west). The engine swaps textures; never `flipX`.
- West may be generated as a mirror export of east (units are boxy and symmetrical) but the artist must check asymmetric props after mirroring: Calder's hammer arm, Copper Fang's shield/hook sides, Varr's gauntlet/emitter sides, Watcher's rifle. The prop side may swap after mirroring, which is acceptable; text, serial numbers and logos must be re-set so they do not read backwards. Do not ship the 6 other Zed directions (south, north etc.); not needed.

### 1.4 Folders, files, keys (mirrors Zed's layout)

Zed layout, for reference: `assets/sprites/zed/<State>/rotations/<dir>.png` and `assets/sprites/zed/<Folder>/animations/<AnimName>/<dir>/frame_000.png`.

Enemy layout:

- Unit folder: sprite key with dots replaced by dashes: `assets/sprites/rust-grunt/`, `assets/sprites/rust-iron-line-cordon/`, `rust-breaker`, `rust-watcher`, `rust-copper-fang`, `rust-halden-varr`, `rust-overseer-voss`, `rust-overseer-calder`, `rust-overseer-wren`, `rust-overseer-holt`, `rust-drone`, `rust-megadrone`, `rust-hologram`, `rust-elite-drone`.
- State folder (PascalCase, underscore separates state and move): `Idle`, `Walk`, `Hit`, `Ko`, `Telegraph`, `Attack`, `Telegraph_GauntletSmash`, `Attack_GauntletSmash`, `Hold_SteamBurst`, `Transition_Phase2`, and so on. Phase-2 variants carry a `P2_` prefix: `P2_Idle`, `P2_Telegraph_RustCollapse`.
- Key pose (one static image per state, used for the Phaser texture before animations register, and as a fallback): `assets/sprites/<unit>/<State>/rotations/east.png` and `west.png`. For Telegraph states the key pose is the peak wind-up frame; for Attack states it is the strike frame; for other states it is frame 000.
- Animation frames: `assets/sprites/<unit>/<State>/animations/<state-lowercase>/<dir>/frame_000.png`, `frame_001.png`, ... (3-digit, zero based, same as `zedFramePath`).
- Example, Breaker smash wind-up: `assets/sprites/rust-breaker/Telegraph_GauntletSmash/rotations/east.png` and `.../Telegraph_GauntletSmash/animations/telegraph_gauntlet-smash/west/frame_004.png`. The animations subfolder name is the folder name lowercased with moves in kebab case.
- Phaser texture key (like `zedTextureKey`): `<spriteKey>.<state>[.<move>][.p2].<dir>`; frame key adds `.<i>`. Animation key (what `asset-keys.json` lists): `rust.breaker.telegraph.gauntlet-smash`, `rust.copper-fang.p2.telegraph.hook`. Direction suffix `.east` / `.west` is appended by the loader exactly as Zed's (`zed.run.east`). Move ids are kebab case (`gauntlet-smash`).
- The grunt's existing default clips keep their keys (`rust.grunt.telegraph`, `rust.grunt.attack`); later grunt moves add `.headbutt`, `.jab-combo`.
- `assets/asset-keys.json` lists every animation key per unit (generated from the same table as this spec). The enemy-owner's data table (like `gruntData.js`) maps its states to these keys.

### 1.5 Clips, tempo and the telegraph rule

- Nominal fps for authoring: Idle 6, Walk 10, Hit 12, Ko 10, Attack 20, Hold loops 6. Telegraph clips are authored at a nominal 8 fps but the engine stretches them to the unit's `telegraphMs` (`anims.timeScale = (frames / fps) / (telegraphMs / 1000)`, the same technique `zedVisual.js` uses for punches and parry). So artists draw poses, not timings.
- Telegraph clip construction (all units, all moves), per `hit-feedback-spec.md` section 3:
  1. Frame 1 already differs from Idle in silhouette. The cue starts at t = 0, not after a lead-in.
  2. The peak pose (last frame) is reached by about the first third of the wind-up and then holds. Totals: the peak pose is on screen for at least 300 ms for any wind-up of 450 ms or more; for the 320 to 400 ms wind-ups (Fang Jab, Watcher baton, Varr Authority Strike, Wren GrappleDash) the whole wind-up is at least 300 ms by the JSON floor and the peak holds for the remaining 60 percent.
  3. The peak pose reads in solid-black silhouette alone: the weapon or limb must leave the body outline (arm cocked back, braces overhead, rifle raised), never an interior detail.
  4. Outline is 1 px wider (scaled: 5 px at 128 frame) on every frame of a Telegraph clip. This is baked, it is cue 4 of the hit-feedback spec.
  5. Never bake red anywhere. The red icon (`fx.telegraph`), the 15 percent red body tint, ground danger zones, scan lines and hit-flash are all runtime effects. The art must be cold enough that a 15 percent `#FF3B30` tint is visible: keep slate/steel mid-tones, avoid large near-white areas on the body (white wins over red in the flash rules, but a white torso hides the tint).
  6. The window between the end of Telegraph and the strike is the Attack clip. Attack frame 2 is the hit-active frame unless a unit section says otherwise (Zed uses the same one-frame rule). The final Attack frame is a recovery pose that is clearly different from Idle (open, off balance), so the player sees the punish window.
- Super armour or guard states (Breaker Body Check dash, Calder Hydraulic Grab startup, Varr Command Shield, Copper Fang shield) are shown by a bright outline `#BFF4FF` drawn by the FX layer at runtime. Art must leave a clean outer silhouette for that outline to hug. FX owner to confirm (open question 6).
- Hit clip (2 frames): frame 1 snaps the head back and tilts the torso away; frame 2 holds the stagger. Heavy units flinch less: the Breaker and Calder Hit clips are 2 frames with a small shift only (they are unflinching during wind-ups; the engine simply does not play Hit then).

### 1.6 KO, tone

See section 3.2. Short form: KO is a knockdown. Held last frame is the lying pose; the game fades or removes the body.

### 1.7 Derived exports (no new drawing)

Flag `d` in the counts below = a script or palette swap of already-drawn frames:

- `P2_` palette-swap exports for bosses whose phase 2 is a recolour/glow (Voss, Calder, Wren, Holt, Drone).
- `Idle_Cloak` and `Walk_Cloak` (Wren): outline-only variant of Idle/Walk, fill removed, 2 px outline `#4FB3D9`.
- Hologram `Idle` and `Walk`: Voss Idle and Walk re-exported flat Visor Cyan at 45 percent alpha with horizontal scanlines.

Each export script must be committed with the art so a later change to the base frames can be re-exported.

## 2. Palette (Rust)

Existing (style-guide section 2): Slate `#3C4650`, Gunmetal `#2A3138`, Steel `#7C8A96`, Visor Cyan `#4FB3D9`, Rust Ink `#14181C`. Reserved and forbidden on enemies: Telegraph Red `#FF3B30`, Brick Red `#A8402E`, Low Health orange `#D9822B`, Mustard (Zed's colour), Health Green.

### 2.1 Additions proposed (owner approval, flagged)

| Name | Hex | Use |
|---|---|---|
| Slate Light | #566471 | Top-left lit planes, second tone on slate |
| Steel Light | #A9B6C1 | Helmet and shoulder highlights |
| Bronze Muted | #9A8466 | Copper Fang gauntlets only (hue about 37 degrees, saturation about 20 percent, so it never reads as red-orange) |
| Overload Violet | #8E5BFF | Phase-2 power state glow (seams, vents, drone rims, cracks), max 15 percent of the sprite area |
| Overload Ice | #BFF4FF | Core of the glow, super-armour outline, Holt's phase-2 glow |
| Lens Bright | #7FE3F5 | Elite Drone lens and Varr command accents |
| Hologram Cyan | #4FB3D9 at 45 percent alpha | Hologram Decoy body |

### 2.2 Per-unit accent rules

- All units: slate body, steel helmet or head plate, cyan visor or lens. No personal marks on grunts and Cordon (serial-number recruits). Overseers get ONE signature accent each, below.
- No yellow-green or orange hazard stripes anywhere on enemies.

### 2.3 Copper Fang bronze

The GDD and JSON say copper-toned gauntlets. True copper is red-orange and collides with Telegraph Red and Brick Red. Use Bronze Muted `#9A8466` with Steel Light highlights. Flag for owner: accept bronze, or approve a deeper copper.

## 3. Resolutions of open points

### 3.1 Phase-2 red (Calder suit, Voss drones)

Conflict: the GDD says Calder's suit "glows red" and Voss's drones "turn red" in phase 2. Style guide and hit-feedback spec reserve red for warnings; a red enemy during a phase-2 fight would make every telegraph less readable at exactly the moment the fights get busiest. The JSON already hedges ("non-red cue tint" for Calder, "red-lit" for MegaDrone).

Decision (owner approved violet): phase-2 power state is Overload Violet `#8E5BFF` with an Overload Ice `#BFF4FF` core.

- Calder: seams, hydraulic joints, back vents and visor rim glow violet, pulsing (runtime alpha pulse 1 Hz), at most 15 percent of the sprite area. Overclock Mode "the red glow itself" becomes the violet pulse.
- Voss P2: drones (Drone P2_ clips) get violet lens rims and a violet ring under the body; MegaDrone is authored violet-lit by default (it only exists in phase 2). Voss's coat gets thin violet seam lights. Arena lights dim is a background FX.
- Varr P2: armour cracks glow violet; Rust Collapse charge brightens them to Overload Ice. The red ground danger zone is a runtime FX, not part of the sprite.
- Wren P2: no glow; "faster and quieter" is darker slate and thinner outline.
- Holt P2: "glows with chemical pressure": use Overload Ice (not violet) so the glow cannot be confused with her purple Fear Gas fog. Her phase-2 visor and vial belt glow ice-white/cyan.

Why violet: not in Zed's palette, not near red or red-orange in hue, high enough luminance against slate, and still reads as "electrical overload" next to the cyan base. Colour is never the only cue: the P2 state also carries shape changes (glowing seams outline the body, drones add a ring) and the Transition clip. If the owner insists on red, the alternative is to move Telegraph Red to another hue for the whole game; I do not recommend it. Flagged for owner and for the FX owner (the red GDD cues Voss visor scan line, Predictive Strike line, Calder shockwave lane and crack preview are all runtime FX in Telegraph Red and are fine).

### 3.2 KO is a knockdown, no gore

Tone rule: no killing, no gore. For every humanoid, `Ko` (5 to 7 frames, hold last frame):

1. Stagger back, arms out.
2. Knees give, helmet stays on (helmets hide identity, and showing a face would humanise a recruit we are not ready to reveal).
3. Falls flat on the back or sits slumped against the floor, one frame of bounce.
4. Visor and lens go dark (swap cyan to Slate `#3C4650`), lying still.
5. No blood, no debris, no missing parts, no fire. Dust puff is a runtime FX.

Drones: spark-out, tilt, drop and land inert (4 to 5 frames); no explosion, no fire; the small cream spark FX only. Hologram Decoy: dissolves into cyan squares and fades (4 frames); it is not a character. Boss `Ko` is the same knockdown, plus the owner's call on a defeat beat (kneeling, surrender, retreat); the art delivers the knockdown only until the owner decides (open question 4). Ko is only needed in the final-phase look for two-phase bosses (see per unit).

## 4. Asset counts and priority

Frames are per facing. PNG files = 2 facings x (frames + one key-pose per state folder). Core = needed for the unit to be playable. Extra = additional moves and phase-2 move art. Derived = scripted export, no new drawing.

| Unit | State folders | Core frames | Extra frames | Derived frames | Drawn (core + extra) | PNG files (all) | Priority |
|---|---|---|---|---|---|---|---|
| rust.grunt | 10 | 24 | 16 | 0 | 40 | 100 | 1 |
| rust.breaker | 10 | 27 | 15 | 0 | 42 | 104 | 2 |
| rust.watcher | 8 | 24 | 7 | 0 | 31 | 78 | 2 |
| rust.iron-line-cordon | 8 | 25 | 7 | 0 | 32 | 80 | 3 |
| rust.drone | 10 | 15 | 0 | 15 | 15 | 80 | 4 |
| rust.elite-drone | 6 | 15 | 3 | 0 | 18 | 48 | 4 |
| rust.copper-fang | 23 | 51 | 38 | 0 | 89 | 224 | 5 |
| rust.overseer-voss | 33 | 43 | 39 | 45 | 82 | 320 | 6 |
| rust.hologram | 6 | 8 | 6 | 10 | 14 | 60 | 6 |
| rust.megadrone | 7 | 25 | 3 | 0 | 28 | 70 | 6 |
| rust.halden-varr | 31 | 73 | 50 | 0 | 123 | 308 | 7 |
| rust.overseer-calder | 31 | 48 | 32 | 52 | 80 | 326 | 8 |
| rust.overseer-wren | 39 | 23 | 50 | 66 | 73 | 356 | 9 |
| rust.overseer-holt | 25 | 28 | 34 | 37 | 62 | 248 | 10 |
| Total | 247 | 429 | 300 | 225 | 729 | 2402 | |

The grunt row is the established Tier 0 sheet (24 core frames, exactly `asset-manifest.md`: idle 4, walk 6, telegraph 3, attack 4, hit 2, ko 5); Headbutt and Jab Combo are later-tier extras.

### 4.1 Priority order

1. Grunt (core 24): the Tier 0 enemy, every other enemy borrows its rig, tempo and telegraph language. Final art first, so all the rules can be proven on one unit.
2. Breaker and Watcher (core 27 and 24): the two Tier 2 archetypes that define opposite ends (huge and slow with a 700 ms ground-slam telegraph; lean and ranged with a 650 ms rifle raise). Their primary move only (Gauntlet Smash, Taser Shot) before any extras.
3. Iron Line Cordon (core 25): grunt rig plus a push-bar; cheap, widens wave variety.
4. Voss Drone and Elite Drone (core 15 each): tiny frames, cheap, needed as soon as any Overseer arrives. Hover loop first.
5. Copper Fang (core 51): first boss-tier unit; teaches shielded and phase states.
6. Voss kit: Voss, Hologram Decoy, MegaDrone (Hologram idle and walk derive from Voss, so Voss goes first).
7. Halden Varr: main boss, the largest kit (123 drawn); do the phase-1 core and the Phase 2 transition early, Hybrid Assault moves last.
8. Calder, 9. Wren, 10. Holt: order is a guess because the GDD does not fix arena order (open question 5). Move up whichever arena ships first.

Inside every unit: pass 1 = core clips; pass 2 = extra moves (extras sorted by how often the move appears); pass 3 = derived exports. Re-export the placeholders only as final art lands (replace the file at the same path or update the path in `asset-keys.json`; keys never change).

## 5. Unit specs

Conventions in the unit tables: Tel = Telegraph, Atk = Attack. Wind-up ms from the unit JSON. "Key pose" = what the silhouette must show at the peak of the wind-up.

### 5.1 rust.grunt (established)

- Frame 128x128, figure 52x96 (scale 1.00, 0.87 of Zed). Folder `assets/sprites/rust-grunt/`.
- Look: slate uniform, steel helmet, cyan visor, cheap oxidised plating kept to cold slate; boxy, symmetrical, no personal marks. Silhouette: square helmet on a square torso, arms straight to the sides.
- Palette: Slate, Slate Light, Gunmetal (boots, gloves), Steel (helmet), Visor Cyan, Rust Ink.
- Core clips (24 frames): Idle 4 (weight shift), Walk 6, Telegraph 3 (450 ms, arm pulled back, torso leaning away), Attack 4 (250 ms; hit-active frame 2, frame 4 open recovery), Hit 2, Ko 5.
- Extra (16): Telegraph_Headbutt 3 (short wind-up, chin tucked) / Attack_Headbutt 4 (forward lunge, helmet leads); Telegraph_JabCombo 3 / Attack_JabCombo 6 (three 2-frame punches; hit-active frames 2, 4, 6). Timings for those two moves are not set (engine does not implement them yet).
- Telegraph key pose: the strike arm cocked fully behind the back line, body lean past the foot line, visibly longer silhouette than Idle.

### 5.2 rust.iron-line-cordon

- Frame 128x128, figure 56x96, scale 1.00 (same height as the grunt, wider body). Folder `assets/sprites/rust-iron-line-cordon/`.
- Look: grunt silhouette, cheap rust-coated slate plating, plain steel helmet with cyan visor and no marks, a gunmetal push-bar held across the chest at all times (the bar is what separates it from a grunt at a glance, make it 60 percent of body width).
- Palette: grunt palette plus Gunmetal bar with Steel Light end caps.
- Core (25): Idle 4 (guard stance, bar across chest, this is the "guard stance" the JSON mentions), Walk 6 (shuffle, bar stays level), Tel_PushBarSweep 4 (500 ms; both arms pull the bar to one side, bar leaves the body outline by about 30 px), Atk_PushBarSweep 4 (260 ms; wide sweep, bar travels to the opposite side, hit-active frame 2, wide reach is why the frame stays 128 wide with the bar inside it), Hit 2, Ko 5.
- Extra (7): Tel_Headbutt 3 / Atk_Headbutt 4 (the grunt headbutt with the bar slung to one side). Not set: timing.
- ASSUMPTION: no Jab Combo for the Cordon (the behaviour text lists only the sweep and the headbutt). If the owner wants it, reuse the grunt jab with the bar held vertically; flagged.
- Telegraph key pose: bar angled back across one hip, torso twisted, clear gap between bar and body.

### 5.3 rust.breaker

- Frame 192x192, figure 110x150, scale 1.00 (1.56 x grunt height, about 2.1 x grunt width). Folder `assets/sprites/rust-breaker/`.
- Look: hulking squared-off silhouette, small head and helmet with a cyan visor (the head is tiny, about 28 px wide, to make the body read huge), heavy slate and steel plating, gunmetal brace on each forearm (the braces are the glowing-bright read, make them 40 px wide). Walks hunched, knuckles low.
- Palette: Slate, Slate Light, Gunmetal braces, Steel plates, Visor Cyan. No orange stimulant tubes; if the owner wants a stimulant read, use small Visor Cyan vials on the neck.
- Core (27): Idle 4 (heaving shoulders), Walk 6 (slow, 8 fps, heavy foot plant), Tel_GauntletSmash 5 (700 ms; both braces raised overhead, braces extend at most 24 px above the head and stay inside the canvas), Atk_GauntletSmash 4 (320 ms; hit-active frame 2 = braces slammed into the floor, frame 3 shows rattled ground pose, frame 4 hunched recovery), Hit 2 (small shift, it is stagger-resistant), Ko 6 (slow topple onto its back, braces open).
- Extra (15): Tel_RustUppercut 4 / Atk_RustUppercut 4 (rising fist, hit-active frame 2, the whole body leaves the ground by 12 px); Tel_BodyCheck 3 / Atk_BodyCheck 4 (shoulder lowered, forward dash; super armour outline is runtime, leave the silhouette clean, hit-active frame 2). Timings not set in the JSON for these two moves (wind-up must be at least 300 ms).
- Telegraph key pose (smash): braces together overhead, elbows locked, knees slightly bent; visible as a tall T shape above the body.

### 5.4 rust.watcher

- Frame 128x128, figure 44x92, scale 1.00 (0.96 x grunt height, lean). Folder `assets/sprites/rust-watcher/`.
- Look: lean slate uniform, gunmetal taser rifle, baton at the belt, wide tracking visor with a cyan scan line across it (the line stays inside the visor in the sprite; the floor scan line to Zed is a runtime FX), lighter boxy build.
- Palette: Slate, Gunmetal rifle, Steel Light baton, Visor Cyan.
- Core (24): Idle 4 (scan-sweep head tilt, rifle held low), Walk 6 (strafe; also reused when backing away, no extra frames), Tel_TaserShot 4 (650 ms; rifle shouldered and raised level, visor tilted at Zed), Atk_TaserShot 3 (220 ms; muzzle forward, recoil, hit-active frame 1 because it fires the bolt, frame 3 lowers the rifle), Hit 2, Ko 5.
- Extra (7): Tel_BatonStrike 3 / Atk_BatonStrike 4 (350 ms wind-up; baton pulled back over the shoulder, hit-active frame 2).
- The taser bolt, scan line and hit spark are FX (not in this spec).
- Telegraph key pose (taser): rifle horizontal at shoulder height, front arm extended; a long horizontal line in silhouette, unlike every other pose.

### 5.5 rust.copper-fang (mini-boss, 2 phases)

- Frame 160x160, figure 70x112, scale 1.00 (1.17 x grunt). Folder `assets/sprites/rust-copper-fang/`.
- Look: sharper slate uniform (narrower waist, squared shoulder plates), narrow cyan visor, Bronze Muted electrified gauntlets (crackle is runtime FX), tactical shield strapped to the left arm (east-facing; mirrored on west), grappling hook launcher on the right forearm.
- Phase 1 (shielded): Idle 4 (shield up front), Walk 6 (advance behind shield); Tel_GauntletLunge 4 (650 ms, gauntlet drawn back, shield dropped slightly) / Atk_GauntletLunge 4 (300 ms, lunge, hit-active frame 2); Hit 2; Hit_Shield 2 (shield absorbs a light hit, body barely moves); Transition_ShieldBreak 5 (heavy attack cracks the shield and it falls away, 5 frames, plays once; also the shield is gone for phase 2). Extras: Tel_FangJab 3 (320 ms, the shortest allowed) / Atk_FangJab 3; Tel_CopperCross 4 (500 ms) / Atk_CopperCross 4; Tel_ShieldBash 4 (550 ms, shield pulled in tight) / Atk_ShieldBash 4.
- Phase 2 (below half health, shield gone): P2_Idle 4, P2_Walk 6, P2_Tel_Hook 4 (750 ms, launcher raised level toward Zed, the thin cyan path is FX) / P2_Atk_Hook 4 (launcher fires, arm yanks back; hit-active frame 2), P2_Hit 2, P2_Ko 6 (the only Ko). Extras: P2_ FangJab 3+3, P2_ CopperCross 4+4 (the JSON says phase two ends in a gauntlet jab after the hook).
- ASSUMPTION: the shield is destroyed at the phase change (heavy attacks break it per the weakness text). The JSON does not say if phase 2 keeps the shield; flagged.
- Core 51, extra 38, derived 0, total 89.
- Telegraph key poses: Lunge = gauntlet drawn behind the head height; Hook = launcher arm straight toward Zed; Jab = jab arm at the hip with the other arm up.

### 5.6 rust.halden-varr (main boss, 2 looks)

- Frame 224x224 (one canvas for both phases). Phase 1 figure 84x130 (1.35), phase 2 figure 100x160 (1.67). Folder `assets/sprites/rust-halden-varr/`. Anchor identical in both looks (feet row 209).
- Phase 1 look: crisp slate command coat (long, straight-hemmed, symmetrical) over oxidised plating, electrified gauntlet on the near fist (Bronze-free: gauntlet is Gunmetal with Visor Cyan lines), energy-shield emitter on the other forearm (a Steel Light disc), tall cyan visor.
- Phase 2 look: the coat is gone; full oxidised armour, heavier and boxier, shoulders 25 percent wider, helm with a tall visor, violet cracks (Overload Violet, section 3.1). Circling drones are separate sprites (rust.elite-drone).
- Phase 1 clips: Idle 4, Walk 6, Tel_AuthorityStrike 4 (400 ms, gauntlet drawn back) / Atk_AuthorityStrike 4 (hit-active 2), Hit 2, Tel_CommandShield 3 (500 ms, emitter arm raised, glow on the emitter) / Hold_CommandShield 2 (loop; the shield bubble is FX, the pose is the guard stance), Hit_Shield 2, Tel_CommandOverride 5 (800 ms, hand slams a console pulse, rings are FX) / Atk_CommandOverride 3, Tel_AdaptiveCounter 3 (stance change, not set: timing) with three stance loops: Stance_AntiAir 2 (fist raised, shield up), Stance_AntiRush 2 (low crouch, shield forward), Stance_AntiCombo 2 (wide guard, arms open). Stance is shown by shape first and by a chest-light colour second: anti-air Visor Cyan `#4FB3D9`, anti-rush Overload Ice `#BFF4FF`, anti-combo Lens Bright `#7FE3F5` (ASSUMPTION, three cold lights that are hard to tell apart; the shape cue carries the readability; flagged).
- Transition_Phase2 8: the coat is torn away, armour locks, violet cracks light; plays once, about 1 second. Used once.
- Phase 2 clips: P2_Idle 4, P2_Walk 6, P2_Hit 2, P2_Ko 7, P2_Tel_AuthorityStrike 4 / P2_Atk_AuthorityStrike 4, P2_Tel_RustCollapse 8 (1500 ms charge, armour opens, cracks brighten to Ice, arms spread) / P2_Atk_RustCollapse 5 (overload burst; the explosion and floor zone are FX). Hybrid Assault (extra): P2_Tel_BreakerSlam 5 / P2_Atk_BreakerSlam 4 (Breaker pose, 700 ms), P2_Tel_TaserShot 4 / P2_Atk_TaserShot 3 (650 ms), P2_Tel_FangCombo 3 / P2_Atk_FangCombo 5 (320 to 500 ms, jab-cross-jab), P2_Tel_DroneCommand 4 / P2_Atk_DroneCommand 3 (600 ms, drones are separate sprites). Overseer control attacks in Hybrid Assault reuse the move art of the other bosses only when the owner approves (not specified, flagged).
- Core 73, extra 50, derived 0, total 123.
- Telegraph key poses: Strike = gauntlet cocked back; Shield = emitter arm raised high, other hand open; Collapse = arms spread, chest open, cracks lit.

### 5.7 rust.overseer-voss (The Eye of the Market)

- Frame 160x160, figure 66x108, scale 1.00 (1.13 x grunt). Folder `assets/sprites/rust-overseer-voss/`.
- Look: slate command coat, steel shoulder plates, wide cyan visor. Official, not armoured: slim silhouette, hands behind the back in Idle. The visor in the sprite is cyan only. The thin red scan line in the GDD is the Predictive Strike telegraph line drawn as FX; do not bake it into the sprite (red rule). The real Voss "flicker" is a runtime effect (alpha 0.85 to 1 at about 4 Hz and a 1 px horizontal scanline shift). It must not apply to holograms.
- Palette: Slate, Steel plates, Visor Cyan; accent: Lens Bright on the shoulder pin. Phase 2: thin Overload Violet seam lights on the coat (derived P2 exports).
- Core (43): Idle 4, Walk 6 (floating glide, slow), Hit 2, Ko 5, Tel_PredictiveStrike 5 (1000 ms, visor lock, arm extended toward Zed; this is the longest telegraph so use the extra frames for build-up) / Atk_PredictiveStrike 3 (240 ms, hit-active frame 1 as it fires, laser is FX), Transition_Phase2 5 (lights dim, seams light), P2_Tel_SystemCrash 8 (1500 ms, arms raised, coat flares) / P2_Atk_SystemCrash 5.
- Extra (39): Tel_DroneSwarm 4 (700 ms console flash) / Atk_DroneSwarm 3; Tel_HologramDecoy 3 (500 ms shimmer) / Atk_HologramDecoy 3; Tel_DataSpike 4 (600 ms, hand raised) / Atk_DataSpike 3 (hand slammed on console, hit-active frame 1 spawns pillars); P2_Tel_PredictiveLockdown 3 (600 ms) / 3; P2_Tel_HologramAssault 3 (500 ms) / 3; P2_Tel_DroneFusion 4 (800 ms) / 3.
- Derived (45): P2_ exports of all 12 phase-1 clips.
- Total drawn 82, exports 127 frames.
- Telegraph key poses: Predictive Strike = arm straight toward Zed with the visor leaning forward (a stiff horizontal arm line); Data Spike = hand high over a console; Decoy = both hands spread.

### 5.8 rust.overseer-calder (The Iron Matron)

- Frame 256x256, figure 140x190, scale 1.00 (1.98 x grunt, the largest). Folder `assets/sprites/rust-overseer-calder/`. Feet row 239.
- Look: heavy slate exosuit, steel plating, long hydraulic arms (shown in Idle and Walk at about 70 percent extension), squared helmet with a cyan visor, a massive hammer carried on the near arm (head about 60 px wide, Gunmetal with a Steel Light striking face), steam vents on the back (vents are drawn Steel Light slots; steam puffs are FX). Phase 2: seams, hydraulic joints, vents and visor rim glow Overload Violet (derived P2 exports, 15 percent max area).
- Core (48): Idle 4, Walk 6 (very slow, stomping, 8 fps), Hit 2 (small), Ko 6 (suit collapses forward then onto its back, hammer dropped beside), Tel_ForgeHammer 6 (900 ms, hammer lifted overhead, the hammer head clears the helmet by 40 px; peak holds) / Atk_ForgeHammer 4 (350 ms, hit-active frame 2 impact, frame 4 stuck hammer recovery, 1300 ms recovery), Transition_Phase2 6 (suit powers up, seams ignite, shoulders flare), P2_Tel_FurnaceSlam 8 (1500 ms, crouch and leap windup; 1500 ms) / P2_Atk_FurnaceSlam 6 (leap apex, falling slam, impact; hit-active frame 5; molten cracks are FX).
- Extra (32): Tel_HydraulicGrab 4 (600 ms, arms extended, long reach) / Atk_HydraulicGrab 5 (grab, lift, slam, slam is a knockdown not a crush); Tel_SteamBurst 3 (400 ms, vents open) / Atk_SteamBurst 3 and Hold_SteamBurst 2 (loop while invulnerable, body braced); Tel_ConveyorTrap 4 (700 ms, fist raised to console) / Atk_ConveyorTrap 3; Prop_ArmPunch 4 and Prop_ArmGrab 4 (Industrial Barrage background arms: hydraulic arms entering from the screen edge, drawn at the same scale as Calder's arms, these are separate props, frame 192x192, east and west).
- Derived (52): P2_ exports of the 13 phase-1 clips (Overclock is the P2 glow plus faster playback, not new drawing).
- Total drawn 80, exports 132.
- Telegraph key poses: Hammer = vertical hammer over the head (a tall T); Grab = both arms stretched forward at full length; Steam = shoulders hunched, vents flared; Furnace = crouched with hammer on the shoulder.
- Super armour outline on Grab startup is runtime (section 1.5).

### 5.9 rust.overseer-wren (The Whisper on the Rooftops)

- Frame 160x160, figure 48x100 (slimmest, 1.04 x grunt height), scale 1.00. Folder `assets/sprites/rust-overseer-wren/`.
- Look: lean dark slate suit (use Gunmetal as the main fill, Slate Light edges), grapple launcher on each forearm, slim cyan visor, a faint Visor Cyan outline on the silhouette kept at all times so the semi-invisible state still reads. Light and fast; still boxy and symmetrical.
- Core (23): Idle 4 (low crouch, light bounce), Walk 6 (fast run, 12 fps), Hit 2, Ko 5, Tel_GrappleDash 3 (400 ms, launcher arm aimed, line is FX) / Atk_GrappleDash 3 (dash, hit-active frame 2).
- Extra (50): Perch 2 (loop, crouched on a platform edge), Airborne 2 (loop while zipping), Tel_SkylineSnare 4 (600 ms, wire thrown out) / Atk_SkylineSnare 3, Tel_SilentStep 3 (500 ms shimmer), Tel_RooftopExecution 3 (600 ms, leaps up and aims down; the red floor shadow is FX) / Atk_RooftopExecution 3 (dive, head-first falling pose, hit-active frame 3 at the landing) / Land_RooftopExecution 3 (knee-down shockwave landing). Tone: the dive knocks Zed down and pushes him back; the sprite never aims at the head or shows contact (open question 3, the GDD move name is "Rooftop Execution"). Phase 2 new: P2_Tel_GrappleClone 3 (500 ms) / 3, P2_Tel_ShadowPulse 3 (450 ms) / 3, P2_Tel_VanishStorm 6 (1200 ms fade-out, 6 poses: standing, fading, outline only) / P2_Atk_VanishStorm 5 (the real Silas's heavy finishing strike, heavier outline), P2_Silhouette_VanishStorm 4 (flat dark clone silhouette strike, the clones use these).
- Derived (66): Idle_Cloak 4, Walk_Cloak 6, and P2_ exports of all 14 phase-1 clips plus both Cloak clips. Phase 2 look = darker, thinner outline.
- Afterimages (Grapple Clone) are runtime copies of the current frame at 40 percent alpha with Visor Cyan tint; no extra art.
- Real Wren vs clone: real has a heavier outline (a runtime 2 px outline on top of art), clones use the Silhouette clip. Flag for FX owner.
- Total drawn 73, exports 139.
- Telegraph key poses: GrappleDash = arm aimed, body low; Rooftop = crouched coil before leaving the ground; SkylineSnare = wire arm swung back.

### 5.10 rust.overseer-holt (The Voice of Compliance)

- Frame 160x160, figure 60x108, scale 1.00 (1.13 x grunt). Folder `assets/sprites/rust-overseer-holt/`.
- Look: slate lab coat (long, square hem) over light plating, rebreather with a cyan visor, belt of chemical vials, dart launcher on one forearm. The vials are small accents (Violet-tinted `#7A5CC0` and Pale Green `#8FD16A`, a few px each, never more than 4 percent of the sprite) to tie to the fog colours without matching the Health Green `#4C9A55`. Phase 2: coat and visor glow Overload Ice (section 3.1).
- Core (28): Idle 4, Walk 6 (measured steps), Hit 2, Ko 5 (sinks to a seat against the floor, coat spread), Tel_GasRelease 4 (700 ms, vents on the belt open, arms out) / Atk_GasRelease 3 (puff release, hit-active frame 2). The same clip is used for Fear Gas, Obedience Mist and NeuroFog; fog colour and size are FX. Transition_Phase2 4 (coat vents glow ice-white).
- Extra (34): Tel_ToxinBurst 4 (600 ms, vial raised) / Atk_ToxinBurst 3 (throw); Tel_SedativeShot 3 (450 ms, arm aimed) / Atk_SedativeShot 3; P2_Tel_CorrosiveWave 4 (700 ms, big vial lifted over head) / P2_Atk_CorrosiveWave 4 (overhand throw); P2_Tel_ComplianceProtocol 8 (1500 ms charge, arms spread, belt flaring) / P2_Atk_ComplianceProtocol 5.
- Derived (37): P2_ exports of the 10 phase-1 clips. Stealth in the fog (NeuroFog) is a runtime alpha, not art.
- Total drawn 62, exports 99.
- Telegraph key poses: Gas = both arms out, palms down; Toxin = vial held high; Sedative = dart arm extended.

### 5.11 rust.drone (Voss surveillance drone)

- Frame 64x64, body 40x36, scale 1.00 (0.38 x grunt height), hovers at head height (engine offset; the 20 px gap above the baseline is baked). Folder `assets/sprites/rust-drone/`.
- Look: small boxy slate body, a single cyan lens, short taser prong underneath, no markings, 2 px outline.
- Clips: Idle 4 (hover bob, also used while orbiting), Tel 3 (600 ms, lens enlarges and brightens, prong points at Zed), Atk 2 (150 ms, prong recoils, hit-active frame 1), Hit 2, Ko 4 (spark-out, tilts, drops, lands inert; no fire or explosion). 15 core frames; P2_ exports of all 5 clips (derived 15): Overload Violet lens rim and a 2 px violet underside ring.
- No Walk clip: the Idle hover loop plays while it moves.
- Total drawn 15, exports 30.
- Telegraph key pose: the lens at full size, prong aimed straight at Zed (it faces east or west, never away).

### 5.12 rust.megadrone

- Frame 192x128 (wide, not square), body 150x80, scale 1.00. Folder `assets/sprites/rust-megadrone/`. Baseline at row 119; body floats 20 px above it.
- Look: large boxy slate drone built from fused drone parts (visible panel seams), wide cyan lens bar, two beam emitters on the sides. It exists only in Voss phase 2, so it is authored violet-lit by default (violet seams and emitter rims, section 3.1), not recoloured later.
- Clips: Idle 4 (slow drift), Spawn 5 (800 ms merge flash: parts snap together; the flash is FX), Tel_SweepingLaser 5 (800 ms, emitters swing out and charge) / Atk_SweepingLaser 4 (600 ms, beams are FX, hit-active frame 2), Hit 2, Ko 5 (shuts down, tilts, lands inert), Turn 3 (extra: east to west swap pose; the engine swaps textures, Turn is a 3-frame bridge).
- Total drawn 28, exports 28.
- Telegraph key pose: both emitters extended outward, level.

### 5.13 rust.hologram (Hologram Decoy)

- Frame 160x160, same figure as Voss (66x108, 1.13 x grunt) so the decoy matches him exactly. Folder `assets/sprites/rust-hologram/`.
- Look: flat Hologram Cyan `#4FB3D9` at 45 percent alpha, steady 3 px outline `#4FB3D9` at full alpha, thin horizontal scanlines. No flicker (the real Voss flickers; the copy does not). Not red anywhere.
- Clips: Idle 4 (derived from Voss Idle), Walk 6 (derived from Voss Walk; the decoy mimics his movement), Spawn 4 (shimmer in: scanline reveal, drawn), Ko 4 (dissolve into squares; any hit dissolves it, so there is no Hit clip), Tel_Punch 3 (500 ms) / Atk_Punch 3 (200 ms, phase 2 only).
- ASSUMPTION: the "weak punch or shot" is a punch only to save art; owner can add a Shot (same frames as Voss Atk_PredictiveStrike derived).
- Total drawn 14, derived 10, total 24.
- Telegraph key pose: arm drawn back at the hip, scanline shimmer.

### 5.14 rust.elite-drone

- Frame 80x80, body 52x44, scale 1.00 (0.46 x grunt height); hovers in formation. Folder `assets/sprites/rust-elite-drone/`.
- Look: sleeker than the Voss drone (tapered wedge body, steel plating, bright cyan lens `#7FE3F5`), no violet (it is Varr's, not Voss's).
- Clips: Idle 4, Tel 3 (600 ms, the lens charges, nose points at the target), Atk 2 (150 ms), Hit 2, Ko 4 (spark-out, drop, inert), Spawn 3 (extra, formation arrival; cyan ring is FX).
- Total drawn 18, exports 18.
- Telegraph key pose: nose pointed at Zed, lens at full brightness.

## 6. Placeholders and keys

- Placeholder files: `assets/sprites/rust-<unit>-placeholder.svg` for each new unit, a boxy slate body with a steel head and cyan visor at the frame size above, feet baseline marked in a comment, no baked shadow, header comment saying PLACEHOLDER. The hologram placeholder is a dashed cyan box. These are generated shapes, not art.
- Keys: `assets/asset-keys.json` now lists `sprites["rust.<unit>"]` for every unit and `animations["rust.<unit>"]` with every animation key from section 5. No existing key or path was changed; `rust.grunt` only gained the four later-tier keys (headbutt, jab-combo). A top-level `enemySpriteSpec` entry points to this file.
- Swap rule: replace the placeholder by overwriting its path or changing the path value; do not rename keys. When real per-state PNGs land, add a `spriteSheets` or folder path alongside (the loader owner decides the shape; Zed's `loadZedSprites` is the model).

## 7. Open questions

1. Rust art style: flat vector (guide default) or pixel art to match Zed (section 1.2).
2. Phase-2 colour: DECIDED, Overload Violet and Ice (section 3.1).
3. Wren's "Rooftop Execution" name and Varr's "executioners" wording: art shows knockdowns only; the owner may rename the move.
4. Boss defeat beat: knockdown only (current) or a story beat (kneel, retreat, surrender)?
5. Arena order, to settle the Calder, Wren, Holt priority.
6. FX owner: the super-armour outline, the real-Voss flicker, the real-Wren outline, the Calder pulse, scan lines and ground zones all rely on runtime effects; confirm they will be built.
7. Copper Fang gauntlets: Bronze Muted or a deeper copper.
8. Zed's measured figure height, to confirm the grunt's 96 px vs Zed's about 110 px (section 0, item 5).
9. Attacker-slot and timing values for moves marked "not set" (Grunt Headbutt and Jab Combo, Cordon Headbutt, Breaker Uppercut and Body Check, Varr Adaptive Counter) need numbers from the enemy owner; art assumes at least 300 ms.
