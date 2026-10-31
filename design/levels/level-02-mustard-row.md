# Level 2: Mustard Row (style guide)

Owner agent: `level-style-02-mustard-row-agent`. Status: **2026-10-21, style set**.

## Known from the level data (do not contradict)
- District: `mustard-row`
- Theme: Mustard-yellow corner shops with hand-lettered signs and shutters the Rust have chained down.
- Palette (GDD family): #E3A92B, #F2C04D, #A8402E, #6B4423
- Time limit: 135 s. Waves: 4. Enemies named: grunt, rust-watcher.
- Intro: "Shutters chained, signs faded. Zed's neighbours are watching from behind the glass. Clear the row and open a shop."
- Outro: "Chains drop, shutters roll up, and the first hand-lettered sign goes back in the window. Mustard Row is open for business."

## House rules that apply to every level
Source: `design/art/style-guide.md`.
- World is 1920x720, camera view 1280x720. The walkable lane is y 460 to 680 (the style guide says 440 to 680; keep 460 to 680 clear).
- Background is warm and busy in the mid-ground, calmer in the play lane. Lower saturation and contrast than characters so fighters always pop.
- Rust enemies read cold, straight and uniform; Zed and the neighbourhood read warm and rounded.
- No gore, no killing. Hopeful tone; the Rust are being pushed back, never gloated over.

## Owner style direction
"Awnings and Neighbours: mustard shopfronts with scalloped red and cream striped awnings, hand-lettered sign boards (Hot Bread, Shoes Mended, Fresh Fish, Tea & Songs), shop windows with neighbours watching from behind the glass and displays of loaves, shoes, fish and teapots, upper floors with green shutters and flower boxes, string lights across the row, A-frame chalkboards and plants at the base. Warm, hopeful morning light. Calm warm-brown lane."

Approved reference: `assets/levels/level-02-mustard-row/concepts/bg-b-awnings-neighbours-detailed.svg`.

## Look
- Palette with hex roles:
  - Sky (flat bands, no gradient): #F5DFA8 top, #F0D9A0 lower
  - Shopfront walls (varied per shop): #E3A92B, #F2C04D, #C98F26, #E8B23C, #D9A02A
  - Brick patch under cornice: #B87B2A, mortar #8A5A1E
  - Cornice, awning red, plant pots: #A8402E; awning cream and sign boards: #F7E7B8 / #F2E3B4
  - Shutters, foliage: #2F6B3F, #3F8A52 (cool note, kept small)
  - Wood, sills, shelves: #6B4423, step #8A6A45
  - Shop glass interior: #3A2A1E frame, #5A4632 inside, reflection #7A5E3E
  - String lights: bulbs #F2C04D, wire #3E3A36, glow at 12 percent
  - Lane: #7A5230 warm brown, top lip #8A6A45, mustard edge line #E3A92B at 35 percent; bottom band and outlines #2E1F16
  - Neighbour skin and clothes: #C98F5A, #9A6B45, #E0B48A, #7A5236; shirts green, red, brown, mustard
  - Overlay: #E3A92B at alpha 0.10
- Time of day and lighting: warm, hopeful morning light; sky is pale sand and the shops carry a soft mustard wash.
- Mood: A neighbourhood waking up and watching, ready to open.

## Background layers (world 3840x720, repeated along the level)
| Layer | Content | Depth | Scroll | Notes |
|---|---|---|---|---|
| far | Flat pale-sand sky bands y 0-460 | back | with world | no parallax, no gradient |
| mid | Eight shopfronts (460 px each, 477 px pitch): cornice, upper windows with green shutters and flower boxes, sign board, scalloped awning, shop window with neighbours and display, step, A-frame chalkboards or plants | wall | with world | busy only above y 460 |
| lane | Warm brown y 460-680, a few faint dark dashes at 10 percent | ground | with world | calm, no high-contrast detail |
| front | String lights along the top (two sags per screen), dark band y 680-720 | foreground | with world | wire at y 8 at both edges |

Screen one (x 0-1920) is the Rust-chained row; screen two (x 1920-3840) is the open, hopeful row, so the level reads as the row reopening (owner-approved addition). Screen one: rolled-down slatted shutters (#7C6A52, slat lines, #5E4F3C top rail) over each shop window with crossed cold grey chains (#3E3A36) and a padlock (#6A5E4A), a grey Rust notice (#CFC8B8, text bars #555B63), faded sign boards (#D8CDB0, lettering #A39578, low contrast, with faint wear marks), faded awnings (#B5766A and #E6DCC2), and a 16 percent grey-tan wash (#B8A98A) over the walls. Neighbours show only in upper windows there; behind-the-glass neighbours and displays appear on screen two. Lane and plants unchanged.

Tiling: sky, wire and lane run edge to edge; shopfronts occupy x 8 to 3813, so no object crosses x 0 or 3840. Screen one (shuttered) is Hot Bread, Shoes Mended, Fresh Fish, Tea & Songs; half two reorders them with different wall tones, awning stripe phase, 2 or 3 upper windows, neighbour placement (one, two or none), peeking upper-window neighbours and chalkboard/plant swaps, so the repeat is every 3840 px.

## Props and landmarks
- Sign boards: Hot Bread (loaves), Shoes Mended (shoes), Fresh Fish (fish), Tea & Songs (teapots). Hand-lettered look in Georgia italic bold, brown on cream with a red underline.
- Neighbours (round faces, warm tones) watch from behind shop glass, no one gloating or hostile.
- A-frame chalkboards and potted plants sit on the step (y 392-460), above the lane.
- Screen one shows the chains and faded signs from the theme; screen two shows green upper-window shutters and open shop windows.
- Exit gate area at the far right: lane is clear, the last shop ends at x 3807 of 3840.

## Asset list
Path convention: `assets/levels/level-02-mustard-row/` (SVG or PNG). The arena loads `background.path` from `content/levels/styles/level-02-mustard-row.json`.
- `assets/levels/level-02-mustard-row/background.svg` (3840x720, flat vector, about 105 KB, final)
- `assets/levels/level-02-mustard-row/concepts/` (reference concepts, not loaded by the game)

## Open questions
- Sign lettering is still live SVG text (Georgia italic bold). Outlining needs a font tool (fontTools or opentype.js) that is not installed; convert later if it must look identical on every machine.
- Rust-Watcher perch spots are not drawn; a small ledge or awning could serve if wanted.
