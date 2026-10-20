# Level 1: Brick-Red Alley (style guide)

Owner agent: `level-style-01-brick-red-alley-agent`. Status: **2026-10-20, style set**.

## Known from the level data (do not contradict)
- District: `brick-red-alley`
- Theme: Zed's home alley: brick walls, a mustard corner shop, mural panels and an open window with music.
- Palette (GDD family): #A8402E, #E3A92B, #6B4423, #2F6B3F
- Time limit: 120 s. Waves: 3. Enemies named: grunt.
- Intro: "Home. The alley where Zed learned to fight, dance and argue like family. Push the Rust back and let the block breathe."
- Outro: "The alley is ours again. A window cracks open and a record starts to play. Zed grins. Next stop, Mustard Row."

## House rules that apply to every level
Source: `design/art/style-guide.md`.
- World is 1920x720, camera view 1280x720. The walkable lane is y 460 to 680 (the style guide says 440 to 680; keep 460 to 680 clear).
- Background is warm and busy in the mid-ground, calmer in the play lane. Lower saturation and contrast than characters so fighters always pop.
- Rust enemies read cold, straight and uniform; Zed and the neighbourhood read warm and rounded.
- No gore, no killing. Hopeful tone; the Rust are being pushed back, never gloated over.

## Owner style direction
2. Window-Light Dusk
Scene: Low sun comes down the alley, with long warm-brown shadows. Mustard light spills from a few windows, and a plain-brick back wall sits behind them.
Palette: Deep brown and brick base, mustard glow, a muted green door as the one cool note.
Mood: Hopeful, with a quiet "someone is still home" warmth. Using a mustard overlay at alpha 0.12-0.15 would unify it.

Approved concept: plain brick-red back wall; 3-4 windows (two or three glowing mustard, one dark); a single muted forest-green door near the centre; diagonal long warm-brown shadow wedges from the left and right across the wall; faint mustard light spill below the lit windows; a calm warm-brown lane (y 460-680) with only very faint light patches; a few low crates/bins at the edges; darkest brown band at the bottom.

## Look
- Palette with hex roles:
  - Wall: #8F4033 (muted brick red, a step below #A8402E), mortar #7A3328
  - Ledge / sills / crate dark: #5A3A20
  - Lane: #6B4423 warm brown
  - Bottom band, outlines, shadow wedges: #2E1F16 (wedges at 32 percent opacity)
  - Window glow: #E3A92B (one #D9A02A), dark window #3A2A1E
  - Light spill: #E3A92B at 14 percent (wall), 7 percent (lane)
  - Door (only cool note): #2F6B3F, panel #275A35
  - Overlay: #E3A92B at alpha 0.13
- Time of day and lighting: low dusk sun from the sides; long shadow wedges from both left and right, window light spilling down the wall.
- Mood: Hopeful, with a quiet "someone is still home" warmth.

## Background layers (world 1920x720)
| Layer | Content | Depth | Scroll | Notes |
|---|---|---|---|---|
| far | Plain brick wall with faint mortar lines | back | with world | single image, no parallax |
| mid | 4 windows (3 lit, 1 dark), green door at x 900-1020, spill polygons, ledge y 436-460 | wall | with world | only landmarks, sparse |
| lane | Warm brown y 460-680, two very faint light patches, soft edge shadow wedges | ground | with world | calm, no high-contrast detail |
| front | Bottom band y 680-720, dark brown | foreground | with world | |

Tiling: shadow wedges touch the top and lane edges with the same profile on both sides, no object crosses x 0 or 3840, so left and right edges match. The image is two screens wide with different window, crate and drainpipe placement in each half; the green door appears once per 3840.

## Props and landmarks
- Windows at x 350, 670 (dark), 1200, 1520; each 140x170.
- Green door at tile centre (x 960).
- Low crates and a grey-brown bin at the wall foot (y 346-436), above the lane, at x 150, 1100, 1740.
- Landmarks are sparse so repeats along the 3500-4500 px level are not obvious; the shop, mural and music window from the theme are not drawn (open question).

## Asset list
Path convention: `assets/levels/level-01-brick-red-alley/` (SVG or PNG). The arena loads `background.path` from `content/levels/styles/level-01-brick-red-alley.json`.
- `assets/levels/level-01-brick-red-alley/background.svg` (3840x720, final flat vector, two different screens so landmarks repeat only every 3840 px)

## Open questions
- The theme mentions a mustard corner shop, mural panels and a music window; this direction does not. Add a shop or mural later as a separate sparse landmark?
- Window-wall may need a tile-seam check in game, since the shadow wedge is tied to edges.
