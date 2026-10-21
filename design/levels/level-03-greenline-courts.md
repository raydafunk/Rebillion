# Level 3: Greenline Courts (style guide)

Owner agent: `level-style-03-greenline-courts-agent`. Status: **2026-10-21, style set**.

## Known from the level data (do not contradict)
- District: `greenline-courts`
- Theme: Forest-green basketball courts: chain-link, faded lines, a hoop with no net.
- Palette (GDD family): #2F6B3F, #E3A92B, #6B4423, #A8402E, #F4E6C8
- Time limit: 150 s. Waves: 5. Enemies named: grunt, rust-breaker, rust-watcher.
- Intro: "Faded lines, empty hoops. Zed fights so kids can play here again. Clear the court."
- Outro: "Somebody finds a ball. Bounce, bounce, swish. The courts are full of kids again."

## House rules that apply to every level
Source: `design/art/style-guide.md`.
- World is 1920x720, camera view 1280x720. The walkable lane is y 460 to 680 (the style guide says 440 to 680; keep 460 to 680 clear).
- Background is warm and busy in the mid-ground, calmer in the play lane. Lower saturation and contrast than characters so fighters always pop.
- Rust enemies read cold, straight and uniform; Zed and the neighbourhood read warm and rounded.
- No gore, no killing. Hopeful tone; the Rust are being pushed back, never gloated over.

## Owner style direction
> Golden-Hour Tree Line: open-air basketball court, not a building wall. Flat sunset sky bands (#F2D9A0, #EDC77B, #E5AE55) with a pale sun, a far muted-green hill line, a row of big forest-green trees (#2F6B3F / #3A7B4A), a low wooden chain-link fence (posts #6B4423), bent hoops with backboards and no nets, long soft tree shadows across the lane. Green court lane (#6B7F4A, lip #8A9A58) with very faint cream court lines and kids' chalk drawings (circle, heart, hopscotch) at low opacity. Warm hopeful golden-hour mood. Mustard overlay around alpha 0.08. Must look clearly different from Level 1 (brick wall dusk) and Level 2 (mustard shopfronts).

## Look
- Palette with hex roles:
  - Sky bands: #F2D9A0 (top), #EDC77B (middle), #E5AE55 (low horizon). Pale sun #F7E7B8.
  - Far hills: #4C7D51 (muted green, behind the trees).
  - Trees: #2F6B3F body, #3A7B4A highlight lobes; trunks #6B4423.
  - Fence: posts and rails #6B4423, mesh #7A7A55 at 55 percent.
  - Hoops: poles and arms #4A4540, backboards #F4E6C8, rims #A8402E, no nets.
  - Lane: #6B7F4A, lip #8A9A58 (60 percent), kerb shadow #2E1F16.
  - Court lines and chalk: #F4E6C8 at 10 to 14 percent opacity.
  - Tree shadows: #2E1F16 at 10 percent. Overlay: mustard #E3A92B, alpha 0.08.
- Time of day and lighting: golden hour, low sun from the right of the first screen; long soft shadows fall across the lane.
- Mood: a warm, open evening where the court is ready for kids again.

## Background layers (world 3840x720, repeated along the level)
| Layer | Content | Depth | Scroll | Notes |
|---|---|---|---|---|
| far | three flat sky bands, pale sun (screen one), thin cloud bands (screen two), muted hill line | far | with level | hill line starts and ends at y 300 so the edges tile |
| mid | row of big trees, low wooden chain-link fence | mid | with level | trees x 70 to 3780, none cross an edge; fence posts at x 120 to 3720 |
| lane | green court, faint lines, chalk circle, heart, hopscotch, soft tree shadows | near | with level | y 460 to 680, calm, all marks at 10 to 14 percent opacity |
| front | mustard overlay wash | n/a | n/a | applied by the arena, alpha 0.08 |

Two different screens: hoops sit at x 900 (tilt -4) and x 2780 (tilt +3), court circle and centre line repeat under each; the sun is on screen one only; hill bumps and chalk drawings differ, so the repeat is every 3840 px.

## Props and landmarks
- Two bent hoops with backboards and empty rims (no nets), one per screen.
- Low wooden chain-link fence running the full width.
- Row of big trees; long soft shadows across the lane.
- Kids' chalk drawings: circles, hearts, hopscotch squares, very faint.
- Exit gate area (far right): lane clear, last tree ends near x 3780, no hoop past x 2960.
- Lane check: lane #6B7F4A is a mid olive; Zed and the grunt read clearly against it, and the lane marks stay below 14 percent opacity.
- Differs from Level 1 (brick wall dusk) and Level 2 (mustard shopfronts): open sky, green, no buildings.

## Asset list
Path convention: `assets/levels/level-03-greenline-courts/` (SVG or PNG). The arena loads `background.path` from `content/levels/styles/level-03-greenline-courts.json`.
- `assets/levels/level-03-greenline-courts/background.svg` (3840x720, flat vector, about 13 KB, final)

## Open questions
- Hoop at x 900 is close to the first wave lock; confirm it is fine as backdrop only.
- Ambient animation added (see Ambient animation). Confirm density and speed after a look in game.

## Ambient animation
Configured by the `ambient.outdoor` block in the style JSON (period 3840); code in `src/levels/ambientOutdoor.js`, helpers in `ambientData.js`. All pieces sit at depth -998, use Phaser tweens only, and stay above y 440 (lane untouched).
- Canopy rustle: two small forest-green clusters per tree on the upper rim push in and out (tree positions read from background.svg).
- Sun halo and three light shafts breathe with ADD blend at 2 to 16 percent alpha, near the screen-one sun.
- Three thin clouds slide slowly on screen two.
- Eight leaves (green and gold) blow rightward and fade in and out; three birds cross the sky every 9 to 16 s; twelve pollen glints rise in the sun.
- Leaves, birds and motes spawn around the camera, so counts stay fixed regardless of level length.
- Not done: fence or tree shadow drift on the lane (skipped to keep the lane calm).
