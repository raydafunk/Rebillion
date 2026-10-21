# Level 5: Songwindow Heights (style guide)

Owner agent: `level-style-05-songwindow-heights-agent`. Status: **2026-10-21, style set**.

## Known from the level data (do not contradict)
- District: `songwindow-heights`
- Theme: Tall apartment blocks, painted-over mural walls and open windows waiting for music.
- Palette (GDD family): #A8402E, #E3A92B, #2F6B3F, #6B4423, #F4E6C8
- Time limit: 210 s. Waves: 7. Enemies named: grunt, rust-copper-fang, rust-watcher, rust-overseer-wren, rust-breaker.
- Intro: "Every window is shut and every mural is painted over. Zed climbs the Heights so the music can drift out again."
- Outro: "A window opens, then another. Music pours down the block and the murals start to rise. The city sings."

## House rules that apply to every level
Source: `design/art/style-guide.md`.
- World is 1920x720, camera view 1280x720. The walkable lane is y 460 to 680 (the style guide says 440 to 680; keep 460 to 680 clear).
- Background is warm and busy in the mid-ground, calmer in the play lane. Lower saturation and contrast than characters so fighters always pop.
- Rust enemies read cold, straight and uniform; Zed and the neighbourhood read warm and rounded.
- No gore, no killing. Hopeful tone; the Rust are being pushed back, never gloated over.

## Owner style direction
Golden Hour Climb: warm late-afternoon sky in Sand and Mustard. Brick-red apartment blocks in the mid-ground with mostly shut windows (dark brown) and a few cream or mustard lit ones, green shutters, small balconies with planters, window air-conditioner units, a fire escape, laundry lines between the blocks, a shop awning and sign, a rooftop water tank, birds, clouds and sagging power lines. Painted-over mural patches in muted beige-grey with a hint of the original forest-green and mustard mural (plant, sun) showing through. Calm warm-brown rooftop-edge lane. Mood: hope on the horizon.

## Look
- Palette with hex roles:
  - Sky bands: Sand #F2D9A0, #EDCB88, #E8C27A, with a Mustard #E3A92B band at 55 percent near the horizon.
  - Sun and clouds: Cream #F4E6C8 and #F8EFD6.
  - Walls (near blocks): Brick Red #A8402E, shade #8F3626 for cornices and floor lines.
  - Far blocks: #9A6B4A with windows #7E5238 (hazy, low contrast).
  - Windows: shut Dark Brown #2E1F16; a few lit Cream #F4E6C8 or Mustard #E3A92B; shutters Forest Green #2F6B3F.
  - Painted-over murals: #C9B79A with Forest Green and Mustard remnants (plant, sun).
  - Lane (rooftop edge): #C9A06A with Warm Brown #6B4423 edge, faint Brick Red stripe, #B88F5C dashes.
  - Props and line work: Warm Brown #6B4423, Dark Brown #2E1F16.
- Time of day and lighting: late afternoon golden hour, sun low right of centre, light from top left per house rule. Flat colour only, no glow or gradients.
- Mood: hope on the horizon; the Heights are quiet but warm and waiting for music.

## Background layers (world 1920x720, SVG drawn on a 680x255 viewBox scaled 2.8235)
| Layer | Content | Depth | Scroll | Notes |
|---|---|---|---|---|
| far | Sand and Mustard sky bands, sun, clouds, birds, sagging power lines, hazy far blocks, water tank | back | slowest (or static) | Power lines start and end at the same height so the tile seam is invisible |
| mid | Brick-red blocks, windows, shutters, balconies, planters, AC units, fire escape, laundry lines, shop awning and sign, mural patches | mid | with level | Only about 5 blocks, a 72 px (reference) gap at the seam shows far blocks, so repeats read as skyline |
| lane | Rooftop edge, #C9A06A, y 457 to 720 (play lane y 460 to 680) | ground | with level | Calm: only a thin brown edge, a faint red stripe and three low-contrast dashes; nothing near the right edge for the exit gate |
| front | None | n/a | n/a | Kept empty so fighters stay clear |

Tiling: left and right edges match (far block continues across the seam, both power lines end at the same y, no landmark touches either edge). Repeats every 1920 px, so the sun, fire escape and shop sign recur 2 to 3 times per level; accepted as sparse enough.

## Props and landmarks
- Sun disc with Cream core, right of centre; clouds as rounded bars.
- Fire escape on the left face of the tallest block; shop awning (brick) with a Mustard sign and a small door above street level.
- Rooftop water tank on a far block; second tank-like chimney cap on a mid block.
- Laundry lines between blocks with a few cream, mustard and green pieces.
- Window AC units, small balconies with Forest Green planters, green shutters.
- Two painted-over mural patches (beige-grey) with a green plant and mustard sun showing through; a low painted-over strip with green sprouts.
- Birds (four small arcs) and two sagging power lines.

## Asset list
Path convention: `assets/levels/level-05-songwindow-heights/` (SVG or PNG). The arena loads `background.path` from `content/levels/styles/level-05-songwindow-heights.json`.
- `background.svg`: 1920x720 flat vector, about 9 KB, tileable. Style file adds a Mustard wash at alpha 0.08.

## Open questions
- Repeats: the sun recurs every 1920 px. If that is noticeable in play, a second variant tile could be added.
- Lane starts about y 457 in the art, a few px above the 460 rule; the edge stripe is low contrast. Check against Zed and the grunt in game.
- No changes to waves, timer or intro and outro text are needed.
