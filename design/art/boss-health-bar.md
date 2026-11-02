# Boss health bar (art and feedback spec)

Status: PROPOSED starting values for playtest. Owner: art-direction-agent. Covers the big end-of-level health bar shown in the HUD while a boss ("Brick" Dugan first) is alive. Feedback and layout only: no gameplay number changes (150 HP, 0.30 rage threshold, hitstun immunity, hit-stop and everything in `duganData.js` are fixed inputs). Flat vector, everything drawn with Phaser Graphics and Text in `HudScene`, no new image files, fonts are the existing `FONTS.button` (Anton) and `FONTS.body` (Rubik). Times are ms from the named event; px are 1280x720 view pixels.

Builds on: `hit-feedback-spec.md` section 7 (enemy bar: border, bevel, bands, delayed drain chunk, KO behaviour), `dugan-wall-slam.md` and `dugan-grab-break-cue.md` (structure, Reduced Motion, Hit Flash Low), `style-guide.md` section 2 (Rust palette, combat signal colours) and `design/ux/hud.md` (HUD clutter rules).

## 1. Intent

Dugan is the player's first real skill check. Until now he wears the same 96x10 bar as a grunt, so nothing says "this one is different". The boss bar fixes that with three reads, in order: (1) a heavy riveted Rust steel frame with a hazard-stripe cap and a name plate announces a big fight, (2) a long cyan fill with a bright leading edge and a cream chunk that drains after each hit shows exactly how much each blow cost, (3) a notch, a skull and a hatched "danger zone" at the left end tell the player that the last 30 percent is a different fight (Rage Punch). Then it pays off: the notch is crossed, the bar goes hot, the name plate rattles, and the plate stays tense until he drops and the bar shatters.

Faction look: Rust, not Hope. Steel, soot (Rust Ink), Gunmetal, hazard orange stripes, Visor Cyan for healthy fill (same cyan as every Rust enemy bar, so the player already reads cyan as "enemy health"), brick-red hatching for the danger zone. No Mustard, no Cream plate (Cream appears only as text and as the damage chunk, exactly as on the enemy bar).

Readability rules: HUD scene only, so the bar never gets covered by sprites. Single near-white area is the 40 px leading-edge flash for 66 ms (rate limited, section 6.4). The frame never rotates or tilts (style guide: never rotate HUD text). Colour is never the only signal (section 11).

## 2. Placement and layout (1280x720)

### 2.1 Where, and why

Block anchor: top-centre, x 320 to 960 (640 wide, centred on x 640), y 138 to 230. Existing HUD (from `HudScene.js`): ZED label and health bar x 32 to 392 / y 20 to 80; Rage meter x 32 to 342 / y 96 to 118 (Level 2+); wave block centre x 640 / y 20 to 84; LEVEL name text centre x 640 / y 100 to 124; timer and score top-right x 1048 to 1248 / y 20 to 96; boost readout top-right y 100 to 136; wave banner centre x 640 / y 240 (88 px, about y 195 to 285); GO arrow right y 360; pause hint bottom-right y 676 for 5 s.

Why top-centre under the level name and not the bottom:
- The play lane is y 460 to 680 (`LANE`), and fighters' feet go all the way to y 680. A bottom bar (even a thin one at y 684 to 716) would sit under the front-lane feet, collide with the pause hint and with Zed's lowest shadow, and the player's eyes (on Zed and the boss) are in the middle of the screen. Top-centre keeps the boss bar where the enemy's name and health are read without leaving the action.
- The top-centre column is the one place that is empty from y 124 down to the banner: the wave block ends at about y 84, the level name ends at y 124. Left (Zed bar, Rage meter) and right (timer, score, boost) stay untouched, and the bar's width stops at x 320 and x 960, so it is clear of the Rage meter (right edge about 342) by its y range (118 vs 138) and of the boost text (x 1048+).
- Dugan is 192 px tall. At the far lane (feet y 460) his head reaches about y 268, 38 px below the bottom of the bar block (y 230). Grunts are shorter. A high jump can briefly overlap the bar region; the HUD draws above the world, and the bar is opaque, so it stays legible.
- It is where players of the genre already look for an end-level boss bar (top-centre).

### 2.2 Layout table (block origin BX = 320, BY = 138)

| Part | Rect (x, y, w, h) | Notes |
|---|---|---|
| Hard shadow | (324, 142, 640, 40) plus plate | Rust Ink #14181C at alpha 0.45, flat 4 px offset right and down (same hard-shadow language as the title), no blur |
| Name plate (parallelogram) | x 320, y 138, w = max(230, nameTextW + 44), h 30 | Right edge leans 12 px (top-right at x+w, bottom-right at x+w-12). Fill Rust Ink #14181C, 3 px Steel #7C8A96 border, bottom edge flush with the frame top (y 168). Two 2.5 px rivets (Steel Light #A9B6C1) at (x+9, y+15) and (x+w-18, y+15) |
| Name text | origin (0, 0.5) at (x+22, y+15) | `FONTS.button` 30 px, uppercase, Cream #F4E6C8, stroke Rust Ink 5 px, letterSpacing 1 px |
| Rage tag "ENRAGED" (hidden until rage) | x = plate right + 14, y 142, h 22, w = textW + 20 | Pill with 2 px Rust Ink border, fill Hazard Orange #F58A2A, text `FONTS.button` 18 px Rust Ink #14181C (contrast about 7:1 on the orange). A leading 8 px skull glyph (section 5.4) |
| Epithet | right-aligned at x 960, text vertical centre y 153 | `FONTS.body` 700, 14 px, uppercase, letterSpacing 1.5 px, Steel Light #A9B6C1, stroke Rust Ink 4 px. Hidden if it would overlap the plate or the ENRAGED tag |
| Frame outer | (320, 168, 640, 40) | Layers from the outside in: 3 px Rust Ink outline, 4 px Steel band, 3 px Rust Ink inner line, trough |
| Left cap | (320, 168, 24, 40) | Hazard stripe cap: Rust Ink base, 45 degree Hazard Orange #F58A2A stripes (6 px orange, 6 px ink along x), clipped to the cap, inside the 3 px outline |
| Right cap | (936, 168, 24, 40) | Steel with two 3.5 px rivets at (948, 177) and (948, 199), Steel Light highlight, Slate #3C4650 shade |
| Fill area (trough) | (348, 178, 584, 20) | Everything bar-related is positioned from this rect; 1% of HP = 5.84 px; Dugan's 150 HP = 3.89 px per HP |
| Rage notch / danger zone | notch x = 348 + 584 x 0.30 = 523.2; zone x 348 to 523.2 | Section 5 |
| Skull tab | (511, 208, 24, 18), centred on the notch x | Steel tab under the frame with the skull glyph, 2 px Rust Ink outline |
| HP readout | right-aligned at x 960, y 211 | "98/150", `FONTS.body` 700, 16 px, Cream, stroke Rust Ink 4 px. Same format as the player's `hpText` |

Total block extents: x 320 to 964 (with shadow), y 138 to 230. Fill area is the only place the HP is drawn.

### 2.3 Integration with the rest of the HUD

- Wave banner: the banner is centred at y 240 and would collide with the readout and tab row (y 208 to 230). While the boss bar is shown, set the banner's y to 276 (glyph about y 231 to 321, clear of the bar, still above the usual fighting line of the far lane head height). One-line change in `HudScene` (`this.banner.setY(bossBar.visible ? 276 : 240)`), no other HUD element moves.
- LEVEL name text (y 100 to 124) stays. The plate starts 14 px below it.
- The small floating enemy bar over the boss is hidden while the boss bar is shown (section 10).

### 2.4 Several bosses

One full bar at a time. Rule: `slots = 2`. The first registered boss still alive gets the full bar. A second simultaneous boss gets a compact bar stacked 12 px below the full block: 640 x 24 frame (same layers, no plate row, name inline at the left in 18 px, no epithet, no skull tab, readout off, notch still drawn), at y = 242 (below the full block). When the primary dies its death sequence plays, then the secondary promotes to the full layout (slides up to y 138 and grows to full height over 220 ms Cubic.easeOut, instant under Reduced Motion). A third or later boss simply keeps its small floating bar. Level 1 wave 5 has only Dugan, so this is only exercised by future levels (bosses of the Level 3 and later fights are one at a time in the current content).

## 3. Data model

Per boss profile (`bossBar` JSON, section 12): `name`, `epithet`, `maxHp` (taken from the registered payload at runtime, the profile value is only a fallback), `rageThreshold` (0.30 for Dugan), optional `phaseNotches` (array of fractions, each drawn as an extra notch with no skull) and `palette` overrides. Profiles are keyed by the content id (`rust-brick-dugan`).

Inputs at runtime:
- `entity-registered { id, team, boss: true, maxHp }`: start the intro and create a bar state. The payload has no name, so the HUD looks the profile up by `level.miniBoss` (levels.json has `"miniBoss": "rust-brick-dugan"` and `HudScene` already receives `this.level`). Adding an optional `profile` field to the payload later is additive and welcome; it is not required.
- `damage-applied { targetId, hpAfter, amount }` where `targetId` is a known boss: update `frac`, the drain chunk, the jolt and the rage crossing.
- `entity-died { id }` for a known boss: start the death sequence if the lethal `damage-applied` did not already.
- `retry` or scene shutdown: remove all bars at once (no animation).
- Per frame: `hp`, `maxHp`, `alive` from the shared state if the HUD polls; the event path above is enough and is the preferred source, so the bar can never disagree with the combat code.

Pure rules (all in the data module, all unit testable):
- `frac = clamp(hp / maxHp, 0, 1)`.
- `raged = frac < rageThreshold` (strictly below, same as Dugan's `ragePending`: "below 30 percent"). Exactly 45 of 150 HP is not raged; 44 is.
- `critical = frac <= 0.10` (15 HP of 150).
- `band` = `rage` when raged, `critical` when critical (critical wins), else `high`.
- `displayFrac = min(introFrac, frac)`: a hit during the entrance never shows the fill above the real HP; the drain chunk starts only after the entrance finishes.

## 4. Fill, leading edge, tick marks

Fill is flat: three horizontal bands inside the 584 x 20 trough, no gradients.

| Band | Body | Top highlight (6 px) | Bottom shade (4 px) | Extra |
|---|---|---|---|---|
| high (frac >= 0.30) | Visor Cyan #4FB3D9 | #A9DDF0 | #2F7FA3 | none |
| rage (0.10 to 0.30) | Hazard Orange #F58A2A | #FFB36B | #B85F14 | diagonal ink hatch on the fill (section 5.3) |
| critical (<= 0.10) | Enemy Critical #C9452F (NOT Telegraph Red #FF3B30) | #E9715C | #8E2F20 | hatch plus sawtooth leading edge (section 8) |

Band changes are hard steps except at the rage crossing (section 6). Rage Orange #F58A2A is the existing "Rage Orange / Ember" value; it is shared with Zed's Rage meter, but this bar is the Rust-frame, top-centre, hatched one, so the shape language differs (style guide 10.5: tie every colour change to a shape or text change, which section 11 does).

Leading edge: a 3 px vertical strip at the fill's right end, full 20 px height, colour Spark Cream #FFF6D6 alpha 0.9 (the one bright element of the bar, it reads as the live HP). When a hit lands the edge widens to 10 px and fades back to 3 px over 120 ms (Quad.easeOut) (section 6.4 for flash safety). The edge is clipped to the fill: at frac 0 it is not drawn.

Tick marks every 25 percent: at 25, 50 and 75 percent (x = 494.0, 640.0, 786.0). Each is a 2 px wide Rust Ink #14181C line at alpha 0.55, 6 px long from the top edge of the trough (y 178 to 184) and 6 px from the bottom (y 192 to 198), drawn over the fill, plus a 1 px Steel Light #A9B6C1 line at alpha 0.5 at the same x on the steel band above (y 172 to 175) so the tick reads from the frame as well. They are 25 percent of max HP, so for a 150 HP boss the ticks sit at 37.5 HP steps.

Trough background: Gunmetal #2A3138 with a 1 px Rust Ink line at the top (inner shadow). Inside the danger zone the trough has the brick-red hatch (below).

## 5. Rage threshold: notch, danger zone, skull

### 5.1 Notch
A vertical Rust Ink 3 px line at x = 523.2 over the full block height from y 170 to 206 (through both steel bands), crossing the fill. A 1 px Steel Light highlight 1 px to its left. Always visible, both before and after the crossing, so the player can see the line and how far the boss is from it from the first second.

### 5.2 Danger zone (x 348 to 523.2, 0 to 30 percent)
The zone is drawn in the trough background, behind the fill, so it is visible as soon as the fill (and the cream chunk) drains out of the 0 to 30 percent segment, and is hidden behind the fill while the boss is healthy. Brick Dark #5A1F18 base at alpha 0.85 with 45 degree Rust Ink hatch lines at alpha 0.5 (2 px wide, 8 px pitch, clipped to the zone). The hatch is the signal, brick red is secondary; the left cap's hazard stripes point the same way. Before rage the fill sits over it, so the zone is shown ahead of time by the notch line and skull tab (5.1, 5.4); the hatch itself shows through when the fill drops below 30 percent.

### 5.3 Hatch on the fill
When the band is rage or critical the fill gets the same 45 degree Rust Ink hatch at alpha 0.18, 8 px pitch, so a colour-blind player gets a pattern change as well as an orange change. In Full motion the hatch scrolls left at 20 px/s while raged (static under Reduced Motion).

### 5.4 Skull tab and glyph
Steel tab under the frame, (511, 208, 24, 18), 2 px Rust Ink outline, 2 px bevel (Steel Light top and left). Skull glyph centred at (523, 217), primitives only, 14 px wide: cranium circle r 5.5 Cream #F4E6C8, jaw rect 7 x 3 under it, two eye holes (2.5 px circles) and a nose notch in Rust Ink. A small 8 px copy of the skull sits inside the ENRAGED tag.
- Before the crossing: glyph Cream on a Steel tab ("a warning on the wall").
- After the crossing: the tab turns Hazard Orange #F58A2A, the skull turns Rust Ink with Cream eye holes, and a three-tongue flame crown (triangles, 6 px high, Hazard Orange with a #FFD24A inner tongue) burns above the skull behind the tab (flicker 3 Hz, tongue heights jitter +/-2 px, static under Reduced Motion).

## 6. Timeline and motion

All times are real time ms (HUD clock). Easing names are Phaser tween names.

### 6.1 Entrance (from `entity-registered { boss: true }`)

Starts `introDelayMs` 400 after registration so the wave banner and Dugan's walk-in are not stepped on. Total about 1200 ms of motion after that. The bar does not block input or gameplay.

| t (ms) | What happens |
|---|---|
| 0 | Frame appears as an iris wipe from the centre: visible half-width 0 to 320 px over 260 ms (Cubic.easeOut). Trough empty, no fill, no notch tab yet. Shadow wipes with it |
| 200 | Name text starts, scale 2.4 to 1.0 over 140 ms (Cubic.easeIn), alpha 0 to 1 over the first 60 ms. The plate fades in under it over 120 ms |
| 340 | SLAM impact (name reaches scale 1): plate and name jolt 4 px down and settle over 100 ms (Quad.easeOut); 8 dust rects (Steel and Slate, 3 to 5 px, speed 90 to 220 up-and-out, gravity 700, life 260 to 380) from the plate's bottom edge; camera shake call-out on the arena camera: 160 ms, intensity 0.004 (about 5 px, same as the KO shake); screen-edge pulse (section 6.6) |
| 300 to 1200 | Fill grows from 0 to `frac` over 900 ms (Cubic.easeOut: fast start, slow finish). The leading edge strip rides the fill front. Each time the front passes a tick (25, 50, 75) the tick brightens to Steel Light for 80 ms (a small "latch" cue, no white). Notch tab and skull fade in at t 700 over 200 ms |
| 500 | Epithet slides in from +16 px to its place and fades in over 200 ms (Cubic.easeOut), after the name has landed |
| 1000 | HP readout fades in over 150 ms |
| 1200 | Entrance done. Drain and hit reactions are fully live (they work from t 0 on `displayFrac` but a hit during the entrance only clamps the fill and skips the chunk) |

Camera shake and the edge pulse are the optional call-outs. They are in the data so the owner can turn either off (`intro.cameraShake`, `intro.edgePulse`).

### 6.2 Damage chunk (the trailing "ghost")
Same as the enemy bar but tuned for a 584 px bar (hit-feedback-spec 7.1 uses hold 300 / shrink 250 on a 90 px bar; a boss hit is a bigger visible loss, so hold is a bit longer):
- Cream #F4E6C8 segment from the new fill front to the previous displayed edge (`drainFrom`), alpha 1.
- Hold 350 ms, then shrinks to the new front over 300 ms (Quad.easeOut, `easeOutQuad`).
- A hit during the hold keeps the older left edge (`drainFrom`), exactly as `barOnDamage` in `hitFeedbackData.js`; a hit during the shrink starts from the currently shown edge. Same maths, so the two bars feel the same.
- Chunk debris (Full motion only): when the chunk starts shrinking, spawn `min(6, ceil(dropFrac x 40))` tiny rects 3 x 3 px Cream and Steel from the chunk's left end, falling (gravity 900, small outward vx 20 to 70, life 280 to 360, alpha out over the last 40 percent), at most 14 alive.
- Lethal hit: no hold (chunk shrink starts immediately, 250 ms) as in the enemy bar KO rule.

### 6.3 Hit reaction (every `damage-applied`, amount > 0)
- Jolt: the frame group (frame, fill, hatch, caps, tab) drops 3 px on a light hit (amount < 12, the same `heavyAt` 12 as `EnemyHitFx`) and 5 px on a heavy or finisher hit, then returns over 110 ms (Quad.easeOut). The plate and name follow at 50 percent (1.5 px and 2.5 px). Rate limit: a new jolt may start only 60 ms after the previous one started (chunk and fill still update every hit). No horizontal shake on a plain hit.
- Leading-edge flare: edge widens to 10 px, 120 ms (above).
- Fill flash: the last 40 px of the fill (the region just behind the edge) tints to Spark Cream #FFF6D6 alpha 0.9 for 66 ms (light), 83 ms (heavy, finisher, ko). Only 40 px of a 584 px bar flashes, so the bright area is about 800 square px, far under the "no large flashes" guidance; and only if 120 ms have passed since the last fill flash (`flashRateLimitMs`). A combo only brightens every other hit.
- No colour change of the whole frame on a plain hit.

### 6.4 Flash and strobe safety
Total bright events from this bar: edge flash at most 8 per second (120 ms limiter), the rage crossing flash once, the entrance edge pulse once, the death burst once. The rage and critical pulses are slow, soft amplitude changes of orange and not white (below). Nothing exceeds 3 per second at full contrast.

### 6.5 Phase change: crossing below the rage threshold
Fires once, on the first `damage-applied` where `raged` becomes true (`frac < rageThreshold` and the bar was not raged). Also fires on a retry spawn only if the new boss starts raged (it does not).

| t (ms) | What happens |
|---|---|
| 0 | The hit's normal jolt (use heavy size, 5 px) and chunk. Frame flash: the steel bands and notch line flash Spark Cream #FFF6D6 at alpha 0.85 for 80 ms, decaying to 0 over the next 160 ms (Quad.easeOut). Skull tab pops: scale 1 to 1.6 to 1 over 240 ms (Back.easeOut), the skull ignites (section 5.4). Fill band swaps to rage. Fill colour crossfades from cyan to Hazard Orange over 200 ms (linear, not through white) |
| 0 | Camera shake call-out on the arena camera: 200 ms, intensity 0.004 (about 5 px). Screen-edge pulse in Hazard Orange (section 6.6), stronger than the entrance one (peak alpha 0.30) |
| 0 to 400 | Name plate shake: x offset +/-3 px alternating every 40 ms (25 Hz, 10 half-cycles), amplitude decays linearly to 0 by 400 ms. The plate border turns Hazard Orange and the plate fill Brick Dark #5A1F18 (hard step at t 0, stays) |
| 100 | "ENRAGED" tag slams in right of the plate: scale 1.8 to 1.0 over 120 ms (Cubic.easeIn) and a 3 px jolt of its own |
| 0 to 260 | Heat sweep: an Hazard Orange hatch band (the danger zone hatch) sweeps in from the notch to the left cap (x 523 to 348) over 260 ms (Cubic.easeOut), after which the zone hatch stays brighter (alpha 0.5 to 0.75) |
| 0 on | Sustained rage state (section 6.7) |

### 6.6 Screen-edge pulse (call-out)
HUD scene graphics layer, four frames of 28 px along the screen edges built from 4 stacked 7 px strips at alpha 0.45, 0.30, 0.18, 0.08 of the peak (stepped, no gradient). Colour Hazard Orange #F58A2A. Entrance: peak alpha 0.18, up in 60 ms, down over 300 ms (Quad.easeOut). Rage crossing: peak alpha 0.30, up in 60 ms, down over 400 ms. It sits under the bar and under every HUD text, never covers the lane centre (28 px at the edges only). Death burst uses Gold #FFD24A at peak 0.15, 250 ms.

### 6.7 Sustained rage pulse (while `raged`)
- Heat halo: three nested 1 px rect strokes around the frame, offsets 4, 8 and 12 px, Hazard Orange, base alphas 0.50, 0.30, 0.15, multiplied by pulse(t) = 0.5 + 0.5 x sin-wave, 1.6 Hz (period 625 ms), range 0.30 to 1.0 of base (Sine.easeInOut feel).
- Fill top highlight: pulses between #FFB36B and #FFD9A8 at the same 1.6 Hz.
- Skull flame flickers at 3 Hz (small and local).
- Danger-zone hatch scrolls left at 20 px/s.
- Plate border pulses Hazard Orange to #FFB36B at 1.6 Hz.
Everything is slow and small amplitude (max alpha swing about 0.35), under the 3 Hz flash limit.

### 6.8 Low HP danger state (frac <= 0.10, bar `critical`)
Shape, text and rate all change, not only colour:
- Fill body Enemy Critical #C9452F with the hatch of rage kept.
- Leading edge becomes a sawtooth: 3 teeth, each 4 px wide and 6 px deep, in Spark Cream, instead of the straight 3 px strip (shape cue).
- Pulse rate rises from 1.6 Hz to 2.5 Hz (halo and fill top). Never above 2.5.
- The readout turns Hazard Orange #F58A2A and gets a trailing "!" ("12/150 !"): a text cue.
- The tick and notch are unchanged.
Entering critical does not repeat the rage crossing effects; a single 3 px jolt only.

### 6.9 Death / defeat (about 700 ms)
Starts on the lethal `damage-applied` (`hpAfter <= 0`), or on `entity-died` if no lethal damage event was seen. Dugan's own KO fall (hit-feedback-spec: KO falls over 400 ms, hit-stop and shake belong to combat) plays in the arena at the same time; the bar matches that KO feel: sharp, then it leaves.

| t (ms) | What happens |
|---|---|
| 0 | Lethal-hit jolt (5 px) and edge flare as usual. Drain chunk starts shrinking immediately (no hold), 250 ms (Quad.easeOut) to empty. Halo, hatch scroll and plate shake stop, pulse freezes at 0.5 |
| 0 | Camera shake call-out: 150 ms, 0.004 (the existing KO number, 5 px). No edge pulse from the bar here (the combat code owns the KO flash); only a Gold pulse of 0.15 peak at t 250 |
| 250 | The empty frame SHATTERS: 12 pieces (10 equal slices of the 584 px middle body, 58.4 px wide, plus the two caps). Each piece is a rect with the same layers (ink outline, steel band, trough). Order outward from the centre: delay = |i - 4.5| x 14 ms (0 to 63 ms). Motion: initial hop vy -120 px/s, gravity 1800, vx = (i - 4.5) x 18 px/s, rotation to +/-(8 to 24) degrees depending on side (they are shards, not HUD text), life 380 ms, alpha 1 to 0 over the last 40 percent. Slices are hidden behind nothing (they fall over the lane edge; they may overlap the lane, they are only 380 ms and alpha-fading) |
| 250 | Burn-down: 16 sparks from random x along the frame top, rect 6 x 2 px, cone 80 to 100 degrees up +/-40, speed 120 to 320, gravity 600, life 300 to 500, colours by life: Gold #FFD24A, Hazard Orange #F58A2A, Rust brown #9C5A2E (no White stop, so no flash). 6 smoke puffs (Slate #3C4650, size 14 to 24, rise 20 px, alpha 0.5 to 0, life 400) |
| 300 to 600 | Name plate, ENRAGED tag, epithet, readout fade out over 300 ms (alpha 1 to 0, Quad.easeIn) while they sink 10 px (no rotation). Epithet and readout fade first (250 to 400) |
| 700 | Everything destroyed, bar slot freed (and a secondary boss, if any, promotes) |

Reduced Motion version: drain 250 ms as normal, hold the empty frame 100 ms, then the whole block alpha 1 to 0 linearly over 350 ms (350 to 700), no slices, no sparks, no smoke, no shake.

## 7. Layering

`HudScene` sits above `ArenaScene`. Depths inside `HudScene` (the existing HUD objects use default depth 0 to 9; the Rage meter uses 6 to 9):

| Depth | Object |
|---|---|
| 20 | Screen-edge pulse graphics |
| 21 | Shadow, trough, danger zone, skull tab (frame back layer) |
| 22 | Fill, chunk, hatch, ticks, notch, leading edge |
| 23 | Frame bands, caps, rivets, halo strokes |
| 24 | Name plate, ENRAGED tag |
| 25 | Text: name, epithet, readout |
| 26 | Debris, shards, sparks, smoke (death and entrance) |

Three Graphics objects (`back`, `fill`, `front`), one more for particles, plus Text objects for name, epithet, tag and readout. All cleared and redrawn each frame (like `EnemyHitFx.update`). Pause: `BossBarHud.update(time, delta)` is driven from `HudScene.update` and clamps `delta` to 50 ms, so animations freeze with the scene and cannot jump when resumed.

## 8. Text and font notes

- Name: `FONTS.button` (Anton) because the heavy condensed face is the industrial one; `FONTS.display` (Permanent Marker) is the Hope hand-drawn font and is kept off Rust UI on purpose.
- All text waits for `waitForFonts()` (already done before scenes start); first draw happens after fonts load.
- Contrast: Cream on Rust Ink about 13:1; Steel Light #A9B6C1 on Rust Ink about 8.6:1 (epithet); Rust Ink on Hazard Orange about 7:1 (tag); readout Cream on stroke 4 px.
- Name content: "BRICK DUGAN" (the content name is `"Brick" Dugan`; the plate drops the quotes and uppercases). Epithet (proposed): "THE HUMAN BATTERING RAM", taken from the GDD tone in `mini-bosses.json` ("built like a human battering ram"). It is a descriptive tag, not new lore: he stays a former dock worker recruited into the Rust and no rank or title is invented. Alternative that is strictly canon: "FORMER DOCK WORKER". Open question 1.

## 9. Readout decision

Show a small numeric readout ("98/150") under the bar at the right. Reasons: Dugan has 150 HP and the player's own bar already shows numbers in the same format, so it costs no new reading rule; with chunky 3.9 px per HP the exact number helps the first learning attempts and the playtest. It is small, off the bar (not on the fill), and a data flag (`readout: 'none'`) removes it for polished bosses. Default `hp`.

## 10. Integration notes (not changing gameplay)

1. Hide the small floating bar over a boss with a big bar. `EnemyHitFx.onDamage` creates a `bars` entry for any enemy that takes damage. Add an optional constructor option `hasBossBar(id)` (or a shared `bossBarIds` Set exported from `bossBarData.js`) and skip bar creation and drawing for those ids. Because the boss bar creation (entity-registered) happens before the first damage, the floating bar never shows for Dugan. Reset on retry.
2. `telegraphBottomY(id)` returns `null` when an enemy has no small bar. Dugan's telegraph icons (Brick Breaker Punch, charge strip, stomp circle, the grab cue) must fall back to the sprite-top position in that case. Check this in the Dugan code path; if the telegraph icon anchors to the bar top, return the same y the small bar would have used for Dugan (`barPosition(...)`-derived) without drawing it.
3. Camera shake call-outs run on the `ArenaScene` main camera (`this.scene.get('ArenaScene').cameras.main.shake(ms, intensity)`), scaled by the Options screen shake scale: `st.reducedMotion === true ? 0 : shakeScale(st.screenShake)` (the same helper `MegaStompFx` and `WallSlamFx` use). The HUD itself is not shaken.
4. Settings read: `loadSettings(globalThis.localStorage)` in try/catch; `reducedMotion`, `screenShake` and `hitFlash` ('Low' | 'Medium' | 'High') as in `optionsData.js`. Re-read at each trigger so Options changes apply immediately.
5. Banner y shift (section 2.3).
6. Level-start order: the bar's intro starts 400 ms after `entity-registered`; if the boss is registered before `HudScene` exists (the HUD scene is created after the arena), seed from `ArenaScene` state in `create()` the same way `RageMeterHud` seeds from the level number.

## 11. Accessibility

Reduced Motion (Options `reducedMotion`):
- No wipe, no name slam, no slide: the whole block fades in over 200 ms and the fill appears full at that moment (instant fill; the leading edge is still drawn).
- No camera shake, no plate shake, no jolt, no dust, no sparks, no shards, no debris, no flame flicker, no hatch scroll.
- Pulse becomes a static look: halo fixed at 0.30 of its range (alpha 0.15, 0.09, 0.045), fill top highlight fixed, critical state static.
- The drain chunk still shows and shrinks (it is information, not decoration); entrance edge pulse and rage edge pulse become a static 150 ms fade of peak alpha 0.10.
- Death: section 6.9 fade.
Hit Flash Low (Options `hitFlash === 'Low'`, independent of motion):
- No Spark Cream or White flash anywhere. Fill flash tint becomes #BFC8CF (`REDUCE_FLASH_TINT`), leading-edge colour stays Spark Cream at alpha 0.6 instead of 0.9 (no flash, a static edge), frame flash at the rage crossing becomes Sand #E8C27A alpha 0.45 for 160 ms, screen-edge pulse peak alpha 0.12 (entrance 0.08), death sparks start at Gold (they already do), edge flash limiter 240 ms.
- Shake and zoom are not flashes and follow their own settings.
Colour is never the only signal:
- Rage state: ENRAGED text tag, skull ignition and flame crown, plate shake, hatch pattern on the fill, notch always present, pulse (when motion allowed).
- Low HP: sawtooth leading edge, readout colour plus "!" text, faster pulse.
- Healthy vs damaged: cyan fill versus empty trough, with length as the main signal, plus the numeric readout and ticks.
- Danger zone: hatch and notch line, not just red.
- Chunk vs fill: cream chunk is also a different position/length.
- Cyan vs orange fill under deuteranopia: the two differ in lightness (cyan #4FB3D9 is lighter) and in the hatch overlay.

## 12. Machine-readable data (`bossBar`)

Every number is px or ms; colours are hex strings (convert with `hex()` in the data module like `hitFeedbackData.js`); `ease` values are Phaser tween ease names. Profiles are keyed by content id. Copy straight into `src/ui/bossBarData.js` as `BOSS_BAR` and `BOSS_PROFILES`.

```json
{
  "bossBar": {
    "version": 1,
    "profiles": {
      "rust-brick-dugan": {
        "name": "BRICK DUGAN",
        "epithet": "THE HUMAN BATTERING RAM",
        "maxHpFallback": 150,
        "rageThreshold": 0.30,
        "phaseNotches": [],
        "readout": "hp",
        "palette": null
      }
    },
    "layout": {
      "block": { "x": 320, "y": 138, "w": 640 },
      "viewport": { "w": 1280, "h": 720 },
      "shadow": { "dx": 4, "dy": 4, "color": "#14181C", "alpha": 0.45 },
      "plate": { "y": 138, "h": 30, "minW": 230, "textPadX": 44, "lean": 12, "border": 3, "textX": 22, "rivetR": 2.5, "rivets": [9, -18] },
      "frame": { "x": 320, "y": 168, "w": 640, "h": 40, "outline": 3, "band": 4, "innerLine": 3, "capW": 24 },
      "fillArea": { "x": 348, "y": 178, "w": 584, "h": 20 },
      "fillBands": { "topPx": 6, "bottomPx": 4 },
      "ticks": { "everyFrac": 0.25, "widthPx": 2, "lenPx": 6, "alpha": 0.55, "frameMarkAlpha": 0.5 },
      "notch": { "widthPx": 3, "y0": 170, "y1": 206, "highlightPx": 1 },
      "skullTab": { "w": 24, "h": 18, "y": 208, "outline": 2, "glyphY": 217, "glyphW": 14 },
      "readout": { "align": "right", "x": 960, "y": 211, "fontSize": 16, "stroke": 4, "criticalSuffix": " !" },
      "epithet": { "align": "right", "x": 960, "y": 153, "fontSize": 14, "letterSpacing": 1.5, "stroke": 4 },
      "name": { "fontSize": 30, "letterSpacing": 1, "stroke": 5 },
      "rageTag": { "gap": 14, "y": 142, "h": 22, "padX": 10, "fontSize": 18, "border": 2, "text": "ENRAGED" },
      "compact": { "h": 24, "yBelowFull": 242, "gap": 12, "nameFontSize": 18, "promoteMs": 220, "promoteEase": "Cubic.easeOut" },
      "slots": 2,
      "bannerYWhileShown": 276,
      "bannerYDefault": 240
    },
    "colors": {
      "ink": "#14181C", "steel": "#7C8A96", "steelLight": "#A9B6C1", "slate": "#3C4650", "gunmetal": "#2A3138",
      "hazard": "#F58A2A", "hazardLight": "#FFB36B", "hazardPale": "#FFD9A8", "hazardDark": "#B85F14",
      "gold": "#FFD24A", "rustBrown": "#9C5A2E", "brickDark": "#5A1F18",
      "cream": "#F4E6C8", "sparkCream": "#FFF6D6", "sand": "#E8C27A", "reduceTint": "#BFC8CF",
      "text": "#F4E6C8", "epithetText": "#A9B6C1"
    },
    "fill": {
      "high":     { "body": "#4FB3D9", "top": "#A9DDF0", "bottom": "#2F7FA3", "hatch": false },
      "rage":     { "body": "#F58A2A", "top": "#FFB36B", "bottom": "#B85F14", "hatch": true },
      "critical": { "body": "#C9452F", "top": "#E9715C", "bottom": "#8E2F20", "hatch": true },
      "criticalAt": 0.10,
      "hatch": { "color": "#14181C", "alpha": 0.18, "pitchPx": 8, "widthPx": 2, "angleDeg": 45, "scrollPxPerSec": 20 },
      "edge": { "color": "#FFF6D6", "alpha": 0.9, "widthPx": 3, "flarePx": 10, "flareMs": 120, "flareEase": "Quad.easeOut", "teethCritical": { "count": 3, "wPx": 4, "hPx": 6 } },
      "crossfadeMs": 200
    },
    "dangerZone": {
      "base": "#5A1F18", "baseAlpha": 0.85, "hatchColor": "#14181C", "hatchAlpha": 0.5, "hatchAlphaRage": 0.75,
      "hatchPitchPx": 8, "hatchWidthPx": 2, "angleDeg": 45, "sweepMs": 260, "sweepEase": "Cubic.easeOut"
    },
    "hazardCap": { "stripePx": 6, "angleDeg": 45, "colorA": "#F58A2A", "colorB": "#14181C" },
    "drain": {
      "color": "#F4E6C8", "holdMs": 350, "shrinkMs": 300, "ease": "Quad.easeOut", "lethalHoldMs": 0, "lethalShrinkMs": 250,
      "debris": { "perFrac": 40, "maxPerHit": 6, "maxAlive": 14, "sizePx": 3, "gravity": 900, "vx": [20, 70], "lifeMs": [280, 360], "colors": ["#F4E6C8", "#7C8A96"] }
    },
    "hit": {
      "heavyAt": 12,
      "joltPx": { "light": 3, "heavy": 5 }, "joltMs": 110, "joltEase": "Quad.easeOut", "joltMinGapMs": 60,
      "plateFollow": { "plate": 0.5, "name": 0.5 },
      "flash": { "region": 40, "color": "#FFF6D6", "alpha": 0.9, "ms": { "light": 66, "heavy": 83, "finisher": 83, "ko": 83 }, "rateLimitMs": 120 }
    },
    "intro": {
      "delayMs": 400,
      "wipe": { "ms": 260, "ease": "Cubic.easeOut", "halfW": 320 },
      "epithet": { "atMs": 500, "ms": 200, "slidePx": 16, "ease": "Cubic.easeOut" },
      "name": { "atMs": 200, "ms": 140, "scaleFrom": 2.4, "scaleTo": 1.0, "ease": "Cubic.easeIn", "fadeMs": 60, "plateFadeMs": 120 },
      "slam": { "atMs": 340, "joltPx": 4, "joltMs": 100, "joltEase": "Quad.easeOut", "dustCount": 8, "dustColors": ["#7C8A96", "#3C4650"], "dustSizePx": [3, 5], "dustSpeed": [90, 220], "dustGravity": 700, "dustLifeMs": [260, 380] },
      "fill": { "atMs": 300, "ms": 900, "ease": "Cubic.easeOut" },
      "tickLatchMs": 80,
      "tab": { "atMs": 700, "ms": 200 },
      "readout": { "atMs": 1000, "ms": 150 },
      "totalMs": 1200,
      "cameraShake": { "enabled": true, "ms": 160, "intensity": 0.004 },
      "edgePulse": { "enabled": true, "color": "#F58A2A", "peakAlpha": 0.18, "inMs": 60, "outMs": 300, "outEase": "Quad.easeOut" }
    },
    "edgePulse": { "widthPx": 28, "strips": 4, "stripAlphas": [0.45, 0.30, 0.18, 0.08] },
    "rage": {
      "joltPx": 5,
      "frameFlash": { "color": "#FFF6D6", "alpha": 0.85, "holdMs": 80, "decayMs": 160, "ease": "Quad.easeOut" },
      "tabPop": { "scale": 1.6, "ms": 240, "ease": "Back.easeOut" },
      "cameraShake": { "ms": 200, "intensity": 0.004 },
      "edgePulse": { "color": "#F58A2A", "peakAlpha": 0.30, "inMs": 60, "outMs": 400 },
      "plateShake": { "amplitudePx": 3, "stepMs": 40, "ms": 400, "decay": "linear" },
      "plateFill": "#5A1F18", "plateBorder": "#F58A2A",
      "tag": { "atMs": 100, "ms": 120, "scaleFrom": 1.8, "ease": "Cubic.easeIn", "joltPx": 3 },
      "pulseHz": 1.6, "criticalPulseHz": 2.5, "maxPulseHz": 2.5,
      "halo": { "offsets": [4, 8, 12], "alphas": [0.50, 0.30, 0.15], "min": 0.30, "max": 1.0 },
      "flame": { "tongues": 3, "heightPx": 6, "jitterPx": 2, "hz": 3, "colors": ["#F58A2A", "#FFD24A"] }
    },
    "death": {
      "drainMs": 250, "shatterAtMs": 250, "totalMs": 700,
      "cameraShake": { "ms": 150, "intensity": 0.004 },
      "goldPulse": { "atMs": 250, "color": "#FFD24A", "peakAlpha": 0.15, "ms": 250 },
      "shatter": { "slices": 10, "pieces": 12, "delayPerStepMs": 14, "hopVy": -120, "gravity": 1800, "vxPerStep": 18, "rotDeg": [8, 24], "lifeMs": 380, "fadeFromFrac": 0.6 },
      "sparks": { "count": 16, "rectPx": [6, 2], "coneDeg": 40, "speed": [120, 320], "gravity": 600, "lifeMs": [300, 500], "ramp": [[0.0, "#FFD24A"], [0.5, "#F58A2A"], [0.8, "#9C5A2E"]] },
      "smoke": { "count": 6, "color": "#3C4650", "sizePx": [14, 24], "risePx": 20, "lifeMs": 400, "alpha": 0.5 },
      "textFade": { "fromMs": 300, "ms": 300, "sinkPx": 10, "ease": "Quad.easeIn", "epithetReadoutFromMs": 250, "epithetReadoutMs": 150 }
    },
    "reduce": {
      "reducedMotion": {
        "wipe": "none", "nameSlam": "none", "slide": "none", "introFadeMs": 200, "introFill": "instant",
        "cameraShake": "none", "plateShake": "none", "jolt": "none", "debris": "none", "shatter": "none", "sparks": "none", "smoke": "none",
        "flameFlicker": "none", "hatchScroll": "none", "pulse": "static",
        "staticHaloAlphas": [0.15, 0.09, 0.045],
        "edgePulse": { "peakAlpha": 0.10, "ms": 150, "static": true },
        "death": { "drainMs": 250, "holdMs": 100, "fadeFromMs": 350, "fadeMs": 350 }
      },
      "hitFlashLow": {
        "flashTint": "#BFC8CF", "edgeAlpha": 0.6, "frameFlash": { "color": "#E8C27A", "alpha": 0.45, "ms": 160 },
        "edgePulsePeakAlpha": { "intro": 0.08, "rage": 0.12, "death": 0.08 }, "flashRateLimitMs": 240, "noWhiteStop": true
      }
    },
    "depths": { "edgePulse": 20, "back": 21, "fill": 22, "front": 23, "plate": 24, "text": 25, "particles": 26 },
    "maxDeltaMs": 50
  }
}
```

## 13. Suggested test coverage (`bossBarData.test.mjs`)

Pure maths worth pinning: `fillArea` (584 x 20) and `notchX(0.30)` = 523.2; `tickXs()` = 494, 640, 786; `isRaged(0.30)` false, `isRaged(44/150)` true; `bandFor(frac)`; `displayFrac` clamps to `min(introFrac, frac)`; drain hold and shrink behave like `barOnDamage` (hit during hold keeps `drainFrom`; lethal skips the hold); `joltAmplitude(amount)` 3 or 5 and the 60 ms rate limit; flash limiter 120 ms (240 under Hit Flash Low); `pulse(t, hz)` range and `maxPulseHz` clamp (never above 2.5); `introFill(t)` at t 300 (0), 750 (about 0.875 of the eased value), 1200 (1); `shatterPieces()` count 12 and delays 0 to 63 ms; `clipPolygonToRect` for the hazard stripes; Reduced Motion and Hit Flash Low resolution tables returning the values above; stacking (`slots`, promotion order, a third boss gets no big bar); profile lookup fallback via `level.miniBoss`.

## 14. Asset and manifest note

No image assets. Everything is Graphics rects, polygons, circles and Text. The skull and flame are polygons and circles. Nothing here is final art; it is a code-drawn placeholder-quality spec that can be skinned later with a 640 x 40 frame sprite without changing the data (the fill area rect is the contract).
