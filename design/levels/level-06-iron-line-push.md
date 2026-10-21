# Level 6: The Iron Line Push (style guide)

Owner agent: `level-style-06-iron-line-push-agent`. Status: **2026-10-21, style set**.

## Known from the level data (do not contradict)
- District: `stewpot-gardens`
- Theme: Stewpot Gardens, where the Rust have strung a line of barriers between the planters and the food stalls; steam still rises from the stew pots behind it.
- Palette (GDD family): #2F6B3F, #E3A92B, #A8402E, #6B4423
- Time limit: 150 s. Waves: 4. Enemies named: rust-iron-line-cordon, rust-watcher, rust-breaker.
- Intro: "The Iron Line is holding the garden gate. Faceless helmets, cheap plating. Zed's neighbours are watching from the stalls. Push the line back, then the Watchers and Breakers behind it."
- Outro: "The line gives way and the stew pots are steaming again. Zed's mother waves a ladle from the stall. The garden is the neighbourhood's once more."

## House rules that apply to every level
Source: `design/art/style-guide.md`.
- World is 1920x720, camera view 1280x720. The walkable lane is y 460 to 680 (the style guide says 440 to 680; keep 460 to 680 clear).
- Background is warm and busy in the mid-ground, calmer in the play lane. Lower saturation and contrast than characters so fighters always pop.
- Rust enemies read cold, straight and uniform; Zed and the neighbourhood read warm and rounded.
- No gore, no killing. Hopeful tone; the Rust are being pushed back, never gloated over.

## Owner style direction
"Option 3: Stall Row Behind the Line. A row of awnings in mustard, brick and green, with hanging ladles, pots and chalkboard menus. Cut-out neighbour silhouettes watch from behind the stalls, which fits the intro line. Steam rises from big pots and the Rust cordon sits in front."

Approved sketch: sand sky with bunting, 4 to 6 stalls per tile with scalloped striped awnings, plank walls, chalkboard menus (no live text), produce counters, steam pots, hat and green-apron neighbours, faint distant cordon hint, plain warm lane, clear right edge for the exit gate.

## Look
- Palette with hex roles (sky, walls, ground, accents, shadow):
  - Sky bands: #F2D9A0, #EBD08A
  - Awnings: cream #F4E6C8 striped with brick #A8402E, mustard #E3A92B or forest green #2F6B3F (brick only on food and awnings)
  - Stall walls #8C5B3B (plank lines #7A4E32); counters and posts #6B4423
  - Lane ground #7A5230, top edge #8A6038, dashes and front strip #6B4423
  - Neighbour silhouettes #4A3224; chalkboards #3A2A20 with cream lines; stew pots #2A2420 with mustard rim; steam #F4E6C8
  - Distant cordon hint (50% opacity, above lane only): slate #3C4650, gunmetal #2A3138, steel #7C8A96, visor slits #4FB3D9
  - Overlay: #6B4423 at alpha 0.1
- Time of day and lighting: warm late morning, flat cel light, no gradients or blur.
- Mood in one sentence: a busy, hopeful market row where the neighbours watch and the stew keeps steaming behind the Rust line.

## Background layers (world 1920x720)
| Layer | Content | Depth | Scroll | Notes |
|---|---|---|---|---|
| far | sand sky bands, bunting string (symmetric, matches at both edges), faint cordon panels | back | with level | cordon low contrast, outside lane |
| mid | 5 stalls (y 170 to 470) with varied widths and awning colours, neighbours, pots with steam | mid | with level | stalls kept inside x 40 to 1790 so the seam is plain |
| lane | warm brown ground y 460 to 680, faint dashes | front | with level | calm, no high-contrast detail, clear at right edge |
| front | #6B4423 strip y 680 to 720 | front | with level | |

## Props and landmarks
- Hanging ladles and pots, chalkboard menus (cream block lines only), tomatoes, greens and squash on counters, steam pots, bunting.
- Neighbour silhouettes: one with a hat (stall 3), one with a green apron (stall 4), others plain.
- Landmarks are sparse: stall pattern varies by width and awning colour, so repeats across 3500 to 4500 px are not obvious.
- The Rust cordon is only a faint hint; the real cordon is game sprites.

## Asset list
Path convention: `assets/levels/level-06-iron-line-push/` (SVG or PNG). The arena loads `background.path` from `content/levels/styles/level-06-iron-line-push.json`.
- `background.svg` (1920x720, tileable, about 6 KB)

## Open questions
- Should the cordon hint appear more strongly, or stay this faint?
- Stall 1 and 5 are the same shape as the others; want any unique landmark (e.g. mother's ladle stall for the outro)?
