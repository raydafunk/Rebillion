# Level 8: The Overseer's Tower (style guide)

Owner agent: `level-style-08-overseer-tower-agent`. Status: **2026-10-21, style set**.

## Known from the level data (do not contradict)
- District: `songwindow-heights`
- Theme: Songwindow Heights, where a surveillance tower and propaganda screens loom over the windows that used to play music; murals half-painted over in grey.
- Palette (GDD family): #A8402E, #E3A92B, #6B4423, #2F6B3F
- Time limit: 180 s. Waves: 4. Enemies named: rust-iron-line-cordon, rust-watcher, rust-breaker, rust-halden-varr.
- Intro: "Varr runs the whole city from this tower, with squads, drones and shields at his call. Fight through, reach the command chamber and break the order. Let the music back in."
- Outro: "The screens flicker out and Varr gives up the tower. A window opens, then another, and music drifts down over the Heights. The first mural stroke goes back up."

## House rules that apply to every level
Source: `design/art/style-guide.md`.
- World is 1920x720, camera view 1280x720. The walkable lane is y 460 to 680 (the style guide says 440 to 680; keep 460 to 680 clear).
- Background is warm and busy in the mid-ground, calmer in the play lane. Lower saturation and contrast than characters so fighters always pop.
- Rust enemies read cold, straight and uniform; Zed and the neighbourhood read warm and rounded.
- No gore, no killing. Hopeful tone; the Rust are being pushed back, never gloated over.

## Owner style direction
"Grey tower at dusk. The tower dominates the skyline in cold slate with one cyan eye, while the warm sun sets behind the Heights. The first look at the final fight, with the cold tower set against the warm district." Owner wants more detail than earlier levels since it is the final level.

## Look
- Palette with hex roles (sky, walls, ground, accents, shadow):
  - Sky bands, top to bottom: #3B3550, #5E4560, #A2535C, #D9744B, #F0A257, #FBCF86; thin clouds warm #F6B27A and violet #7A5A78 (about 55% opacity, kept inside x 100 to 1850)
  - Sun #FFF4CC with core halo #FBCF86 and soft radial halos, nine faint rays (7% opacity) fanning toward the tower; centre x 576 (30%), y 392, half hidden by the skyline
  - The Heights: far brick #B4574A, near darker #7C3D45, sun-facing edge light #FBCF86 at 28%, lit windows #FFD27A, beacon lights #E8604A with soft glow
  - Tower: slate #4A5560 (lit side), shadow side #39424C, seams and ribs #2F3740, dark window slits #1F262D (a few glowing cyan), orange rim light #D08A5C on the sun-facing edges
  - Eye: housing #1F262D with #2F3740 frame, eye #6FE3F2, core #E6FFFF, two faint halo rings at 28% and 16%; antenna cyan tip; side struts end in red lights #E8604A
  - Cyan light cone from the eye to a cyan pool on the street (cone 22% fading to 4%, pool 12 to 16%), thin cyan glow strip along the far edge of the floor
  - Floor: #2C2838 to #16131C gradient, warm rim line #D08A5C along the far edge, seams and cracks #0F0C14 at 25 to 50%
  - Barricades slate #4A5560 with mustard #E3A92B and slate stripes; amber street lamps #FFD27A with glow
  - Overlay: #2C2838 at alpha 0.10 (mutes saturation so fighters pop)
- Time of day and lighting: dusk. Warm low sun from the left lights the Heights and rims the tower's left edges in orange; the tower's right side is in cold shadow; the only cold light is the eye, its cone and pool.
- Mood in one sentence: a cold grey tower with one watching eye looms over a warm, still-lit district, the first look at the final fight with the music waiting to come back.

## Background layers (world 1920x720)
| Layer | Content | Depth | Scroll | Notes |
|---|---|---|---|---|
| far | six sky bands, cloud streaks, setting sun with halos and rays, far brick skyline with spires, beacons and amber windows | back | with level | all above y 452; sun gap in the skyline at x 480 to 680; edge buildings equal height at x 0 and x 1920 for the seam |
| mid | near darker skyline with spires and beacons; the Overseer's Tower at x 1300 (antenna y 12 to base y 458, width 190 at shoulders, 340 at buttress base) with struts and eye at y 190; two amber street lamps at x 330 and x 1640 | mid | with level | tower is the one landmark, one per 1920 px repeat; right edge skyline stays low for the exit gate |
| lane | plum floor y 460 to 680, perspective seams, cracks, cyan pool at x 1300 y 560, thin cone, sparse embers | front | with level | calm, low contrast; pool and cone are faint so Zed and the grunt stay readable; right edge clear |
| front | dark strip y 680 to 720 with faint warm rim | front | with level | |

## Props and landmarks
- The Overseer's Tower: stepped crown, dark eye housing, ONE cyan eye with two halo rings, antenna with cyan tip, buttressed base, panel seams, vertical ribs, rivet rows, window slits (a few lit cyan), two pairs of side struts ending in red lights.
- Cyan light cone and street pool, cyan glow strip along the far edge of the floor.
- The Heights: two skyline layers with spires, red beacons and many amber windows (music is still waiting inside).
- Barricades at both edges (x 30 and x 1766, sitting behind the lane at y 418 to 464) and two amber street lamps.
- Embers: warm near the ground, cyan near the tower, none heavy in the lane.
- The Rust are not shown as figures; Varr and troops are game sprites.

## Asset list
Path convention: `assets/levels/level-08-overseer-tower/` (SVG or PNG). The arena loads `background.path` from `content/levels/styles/level-08-overseer-tower.json`.
- `background.svg` (1920x720, tileable, about 52 KB, flat vector with a few soft gradients for glows)

## Open questions
- The tower repeats every 1920 px (twice or more across a 3500 to 4500 px level). Is that fine for the final level, or should a later tile drop the tower (needs a second image or a code change)?
- Ambient animation (pulsing eye, flickering beacons, drifting embers) like levels 5 to 7 needs a new src module; not done because this agent may not edit `src/`.
- The file is larger than earlier levels (about 52 KB) because of the extra detail; trim windows if that is a concern.
