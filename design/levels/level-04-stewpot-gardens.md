# Level 4: Stewpot Gardens (style guide)

Owner agent: `level-style-04-stewpot-gardens-agent`. Status: **2026-10-21, style set, animation added**.

## Known from the level data (do not contradict)
- District: `stewpot-gardens`
- Theme: Food stalls with striped awnings and community garden planters behind Rust fencing.
- Palette (GDD family): #2F6B3F, #E3A92B, #A8402E, #6B4423, #F2D9A0
- Time limit: 180 s. Waves: 6. Enemies named: grunt, rust-overseer-holt, rust-watcher, rust-breaker.
- Intro: "Zed's mother's stall stood just past the fence. Keep moving, sidestep those darts, and bring dinner back."
- Outro: "The fence comes down, the planters get watered, and a pot of stew goes on. Everyone gets a bowl."

## House rules that apply to every level
Source: `design/art/style-guide.md`.
- World is 1920x720, camera view 1280x720. The walkable lane is y 460 to 680 (the style guide says 440 to 680; keep 460 to 680 clear).
- Background is warm and busy in the mid-ground, calmer in the play lane. Lower saturation and contrast than characters so fighters always pop.
- Rust enemies read cold, straight and uniform; Zed and the neighbourhood read warm and rounded.
- No gore, no killing. Hopeful tone; the Rust are being pushed back, never gloated over.

## Owner style direction
"Golden hour market row. Sand sky, brick skyline, string lights and three striped stalls in red, green and mustard. Matches the GDD palette most directly. Added extra detail: sun with halo, soft clouds and a few birds; brick skyline of 8 buildings with cornices, chimneys, lit mustard windows, a green mural panel, laundry line and red banner; wavy string-light line (same height at left and right edges so it tiles) with soft glow halos, plus bunting in red/mustard/green/cream; three striped-awning stalls (red, green, mustard) with woodgrain counters, hanging produce, fruit/veg rows, a cream 'STEW' sign; stacked crates, a barrel, a planter with a mustard flower, a crate of green produce, a sleeping cat; calm cobbled lane in very low-contrast tones with flat shadow pools under each stall."

Palette given: sand #F2D9A0 / #E8C27A / #F0CE8C, cream #F4E6C8, brick-red buildings #9A6A55 / #8A5A48 / #7A4A3A, mustard #E3A92B, brick red #A8402E, forest green #2F6B3F, warm brown #6B4423, outline #2E1F16, lane ground #C9A06A with cobble tones #B8905C / #BC9660. Concept preview (960x360) approved; scaled to 1920x720. Light mustard overlay in the style file.

## Animation direction
"add cool animations to level 4"

Plan (data-driven `ambient` block in the style JSON, period 1920, drawn by the arena; the SVG itself is static). All pieces sit above y 440, low alpha, flat shapes, small counts.
- String lights: `row` block with shopCount 0 (no shop effects). 16 bulbs, x 60 + 120n, a colour wave of glows runs along the wire. The painted wire was redrawn as eight 240 px swags (ends y 46, sag 28, bulbs at y 75) so it matches the renderer's parabola (bulbY 48, sag 28, span 240). Still tileable. The row code also sends an occasional balloon drifting over the rooftops (crazy 0, gentlest setting).
- Lit windows: four mustard windows on the y 236 row (x 990, 1056, 1230, 1296) breathe; every third one flickers like a tired bulb. Only one window row is supported, so the others stay painted.
- Sky: sun halo breathes (960, 230, r 150); two faint light shafts (x 800 and 1040); four soft clouds at the painted cloud positions drift slowly; a few birds (up to 3) cross now and then.
- Air: 6 blown leaves (green, mustard, gold, brick red) and 10 warm motes drifting up in the sun.

Not possible with the current renderer (suggestions): steam rising from the STEW pot; awnings swaying; the sleeping cat breathing; hanging produce and bunting swinging; laundry line fluttering; the red banner waving; per-window lit positions at differing heights.

## Look
- Palette with hex roles:
  - Sky: #F0CE8C (top), #E8C27A (mid, deepest), #F2D9A0 (horizon). Sun and clouds: #F4E6C8.
  - Skyline walls: #9A6A55, #8A5A48, #7A4A3A. Cornices and chimneys: #6B4423 / #7A4A3A. Lit windows #E3A92B, dark windows #5A3A2C.
  - Stalls: awnings alternate cream #F4E6C8 with #A8402E, #2F6B3F or #E3A92B; counters and posts #6B4423 (grain #8A5A38).
  - Lane ground: #C9A06A; cobbles #B8905C / #BC9660 at 55% opacity; stall shadow pools #B8905C at 60%.
  - Outline: #2E1F16 (3 to 4 px on structures, none in the lane).
  - Overlay: #E3A92B at alpha 0.10.
- Time of day and lighting: golden hour, low warm sun behind the skyline, glow halos on string lights, flat shadow pools under stalls (no gradients on shapes).
- Mood: a warm, hopeful market evening where the neighbourhood is ready to feed everyone.

## Background layers (world 1920x720, tile repeats every 1920)
| Layer | Content | Depth | Scroll | Notes |
|---|---|---|---|---|
| far | Sand sky bands, sun with halo (x 960), 4 clouds, 4 birds | y 0 to 320 | background repeat | Lowest contrast; nothing touches edges |
| mid | 8 brick buildings (240 px pitch) with cornices, chimneys, lit windows, green mural (x 500), laundry line (x 1210), red banner (x 910); string-light wave (y 60 +/-14) and bunting line (y 300 +/-14) | y 40 to 460 | repeat | Both lines are periodic in 1920 so edges match |
| mid-front | 3 stalls (x 150, 760, 1370; 380 wide) with striped awnings, woodgrain counters, hanging produce, fruit rows, STEW sign above stall 2 | y 262 to 462 | repeat | Counter base ends at y 460 |
| lane | Cobbled #C9A06A ground, flat shadow pools under stalls | y 460 to 720 | repeat | Calm, cobbles at low contrast, no outlines |
| front | none | | | Kept clear so the gate area at far right stays open |

## Props and landmarks
- Stacked crates (x 60), planter with mustard flower (x 590), barrel (x 1170), crate of green produce (x 1260), sleeping cat (x 1830). All sit above y 462, outside the lane.
- Landmarks: cream "STEW" sign (x 860 to 1040), green mural, red banner. One of each per 1920 tile; at 3500 to 4500 px the repeat is about two times, so the sparse landmarks are not obvious.
- Fence/Rust elements are not in the background; the arena draws them. Planters are the community-garden nod.

## Asset list
Path convention: `assets/levels/level-04-stewpot-gardens/` (SVG or PNG). The arena loads `background.path` from `content/levels/styles/level-04-stewpot-gardens.json`.
- `assets/levels/level-04-stewpot-gardens/background.svg`: 1920x720 flat vector, tileable, about 50 KB, string-light wire drawn as 240 px swags to line up with the animated bulbs. Generated, final unless the owner supplies painted art.

## Open questions
- Should the exit gate area (far right) get a bespoke landmark? Currently only the lane is clear and the cat sits at x 1830 above the lane.
- Level data lists 3500 to 4500 px worlds; confirm the loader repeats the 1920 tile (Level 2 uses a 3840 image instead).
- Is the green mural meant to say anything? Currently abstract (sun and hill).
