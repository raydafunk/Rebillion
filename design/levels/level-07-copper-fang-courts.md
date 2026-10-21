# Level 7: Copper Fang at the Courts (style guide)

Owner agent: `level-style-07-copper-fang-courts-agent`. Status: **2026-10-21, style set**.

## Known from the level data (do not contradict)
- District: `greenline-courts`
- Theme: The forest-green basketball courts, hoops bent but standing, with a Rust command post set up at centre court and kids' chalk drawings still on the asphalt.
- Palette (GDD family): #2F6B3F, #E3A92B, #A8402E, #6B4423
- Time limit: 150 s. Waves: 3. Enemies named: rust-watcher, rust-breaker, rust-copper-fang.
- Intro: "Varr's favourite is guarding centre court: a Copper Fang with a shield and a hook. Block, dodge, parry. Give the kids their court back."
- Outro: "The shield cracks and the Fang is pushed back off the court. Somewhere a ball bounces, then another. Zed breathes out. Game on."

## House rules that apply to every level
Source: `design/art/style-guide.md`.
- World is 1920x720, camera view 1280x720. The walkable lane is y 460 to 680 (the style guide says 440 to 680; keep 460 to 680 clear).
- Background is warm and busy in the mid-ground, calmer in the play lane. Lower saturation and contrast than characters so fighters always pop.
- Rust enemies read cold, straight and uniform; Zed and the neighbourhood read warm and rounded.
- No gore, no killing. Hopeful tone; the Rust are being pushed back, never gloated over.

## Owner style direction
"Centre-court command post. Warm golden hour, bent hoops left and right, a cold slate Rust tent with a cyan screen mid-ground, faint chalk drawings on the asphalt. Most literal to the level theme. Add more detail."

Approved concept: `assets/levels/level-07-copper-fang-courts/concepts/bg-1-centre-court-command-post.svg`. `background.svg` is that concept with seam fixes and no live text.

## Look
- Palette with hex roles (sky, walls, ground, accents, shadow):
  - Sky: #F6E3B0 to #EDC77B to #E5A650 (gradient), sun #FFF6DA with glow #F9DE9A, thin clouds #F9E9BE
  - Far blocks #C79A66 with lit windows #F7DC8F; hills #5C8A5A and #4C7D51; trees #2F6B3F and #3A7B4A, trunks #6B4423
  - Chain-link fence mesh #6E7455, posts #5A5A48, top rail #6B6A55; faded kids' bunting in brick #A8402E, mustard #E3A92B, green #2F6B3F, cream #F4E6C8, soft cyan #4FB3D9
  - Court (lane) gradient #4B8556 to #3E7549 to #2F6B3F; court lines #EBDDB0 at 38% opacity; cracks and patches #244F30; weeds #6FA85F
  - Chalk (about 50% opacity): cream #F4E6C8, yellow #F7E27A, pale blue #9CCBE0, pink #F2B6C0
  - Hoops: poles #4A3626, boards cream #F4E6C8 with brick square, rim #C9602E; stray ball #C9702E
  - Rust command post: slate #3C4650, #46535F, #323B44, gunmetal #2A3138, steel #7C8A96, cyan screen #4FB3D9 with glow, dark interior #1B232B
  - Shadow: #1F4A2B at 16%; front strip #1F4A2B and #6B4423
  - Overlay: #2F6B3F at alpha 0.12
- Time of day and lighting: warm golden hour, low sun on the right, long soft shadows from hoops and tent, the only cold light is the tent screen and floodlights.
- Mood in one sentence: a court that is still the kids' (chalk, bunting, bent hoops) with a cold slate command post parked at its heart, ready to be pushed out.

## Background layers (world 1920x720)
| Layer | Content | Depth | Scroll | Notes |
|---|---|---|---|---|
| far | golden sky, sun at x 1480, thin clouds, birds, apartment blocks, two hill bands, tree line | back | with level | all above y 450; clouds kept inside x 100 to 1850 for the seam |
| mid | chain-link fence with sagging bunting, Rust command post (slate tent, cyan screen, banners, dish, floodlights, crates) at centre, bent hoops at x 170 and x 1750 | mid | with level | tent spans x 636 to 1242 and y 250 to 470; hoops mirror each other |
| lane | green court y 460 to 680 with faint lines, cracks, weeds, chalk drawings, long shadows | front | with level | calm, low contrast chalk; right edge clear for the exit gate (only a faint house chalk at x 1480 to 1530) |
| front | dark green and brown strip y 680 to 720, grass tufts | front | with level | |

## Props and landmarks
- Bent hoops (left and right) with cream boards, chalk scribbles and a stray ball by the left hoop.
- Rust command post: slate angular canopy, cyan map screen, antenna and dish with halo, two diamond-badge banners, floodlight pylons, crates, cables, panel barriers.
- Chalk drawings: hopscotch (dots instead of numbers), smiling sun, three stick kids holding hands, house, heart, ball scribble, star, dotted line.
- Fence bunting, cracks with weeds pushing through.
- The tent is the one big landmark and the court is plain at both edges, so repeats are not obvious. If the owner wants a bigger gap between repeats, the tent could be offset.
- The Rust are not shown as figures; the Copper Fang and troops are game sprites.

## Asset list
Path convention: `assets/levels/level-07-copper-fang-courts/` (SVG or PNG). The arena loads `background.path` from `content/levels/styles/level-07-copper-fang-courts.json`.
- `background.svg` (1920x720, tileable, about 17 KB)
- `concepts/bg-1-centre-court-command-post.svg` (approved concept, not loaded by the game)

## Open questions
- The command post repeats every 1920 px; is a second hoop or tent variant wanted for tile 2?
- The background uses a few gradients (sky, court, glow), unlike level 6's flat fills. Keep them, or flatten?
