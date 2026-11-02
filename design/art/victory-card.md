# Victory Card (Brick Dugan down)

Owner: art-direction-agent. Status: DRAFT, placeholder art, pending owner approval.
Style: flat vector, Hope palette from `style-guide.md` section 2. Resolution 1280x720.

## What it is

A **card**, not a screen. It is a centred panel (960x460 asset) over the frozen arena with a light 45 percent Dark Brown dim, in the same family as `LevelCard` and `StoryCard`. It is not `ResultScene`: no stats, no buttons, no scene change. It appears the moment Brick Dugan's KO animation finishes, the player reads one line, presses Enter or clicks, and play continues.

## Copy (live text, never baked into the SVG)

| Element | Text | Font | Size | Colour |
|---|---|---|---|---|
| Header | VICTORY | Anton | 64px, 4px letter spacing | Cream #F4E6C8, 4px Dark Brown stroke |
| Line 1 | The mighty Dugen has fallen. | Anton | 46px | Dark Brown #2E1F16 |
| Line 2 | The path forward is clear. | Rubik 700 | 30px | Brick Red #A8402E |
| Prompt | Enter / click to continue | Rubik 500 | 20px | Dark Brown #2E1F16 |

Contrast: Dark Brown on Cream ~11:1, Cream on Brick Red header ~5.3:1 with the stroke, Brick Red on Cream ~5.3:1. All pass 4.5:1.

Spelling flag: the line was supplied as "Dugen". The code, lore and GDD all spell the boss "Dugan" (`BrickDugan`, `content/lore/mini-bosses.json`). The card uses "Dugen" exactly as written. If that is a typo, change the one string.

## Layout (card at x=160, y=130, 960x460)

| Element | Position inside card | Notes |
|---|---|---|
| Header strip | y 6 to 98, Brick Red | Faint brick-course lines in Brick Dark #7A2F25 |
| Mustard band | y 98 to 108 | Dark Brown hairlines top and bottom |
| Emblem | centre (175, 262) | Cracked brick on a Mustard sun-burst. The brick is Dugan's nickname; broken in two means he is done |
| Line 1 | left 340, top 160, width 570 | Wraps to two lines only if the fallback font is used |
| Line 2 | left 340, top 276 | |
| Lane dashes + chevrons | y 378 to 392, x 340 to 850 | Mustard dashes from the menu street, pointing right: the path forward |
| Prompt | left 340, top 414 | |

## Look rules followed

- Panel recipe from the style guide: Cream body, Dark Brown 6px outline, Brick Red header, 16px radius, flat 25 percent drop edge.
- 2 to 3 tones per colour, no gradients, no glow, no blur, no textures.
- No Rust colours and no Telegraph Red: this is a Hope-side moment. The brick is Brick Red (world), not an enemy body colour.
- Nothing on the card is rotated (rotation is reserved for the title and subtitle).
- Reads in greyscale: header dark, emblem mid, body light, text dark.

## Motion (for the implementer)

1. Arena holds 0.6s after Dugan's KO lands.
2. Dim fades in 0.2s. Card drops from y -40 to its rest position with a 0.25s ease-out and a 4px settle bounce.
3. Emblem: the two brick halves start together and split 12px apart over 0.3s (SVG would need the halves exported as two layers; placeholder is a single image, so a 1.0 to 1.06 scale pop is the fallback).
4. Lane dashes slide in left to right, 60ms stagger.
5. Plays the existing `level-complete-sting.mp3` once. Hit-stop and screenshake are already done by the KO; add none here.
6. Dismiss on Enter, Space or click (ignore input for the first 300ms, same as `LevelCard`). Auto-closes after 8s so it never blocks the player.

## Assets

| Key | File | Size | Notes |
|---|---|---|---|
| `ui.card.victory` | `assets/ui/victory-card-frame.svg` | 960x460 | PLACEHOLDER, text-free frame. Swap by overwriting the file |
| (reference) | `design/art/victory-card-preview.png` | 1280x720 | Mock over the Level 1 arena. Fonts in the preview are stand-ins; Anton and Rubik were not installable where it was rendered |

## Open questions

1. Is "Dugen" intended, or should it read "Dugan"?
2. Should the same card, recoloured and re-emblemed, serve later mini-bosses (Copper Fang, Varr, the Overseers)? The frame is built so only the emblem and two strings change.
3. Final emblem: keep the flat cracked brick, or use a Dugan portrait once his sprite set is final?
4. Wiring: done. Copy per boss lives in `src/ui/victoryData.js` (`VICTORY_LINES`, keyed by boss id); the card is `src/ui/VictoryCard.js`; `ArenaScene` shows it 1.4s after a boss dies, freezes play, and holds the results screen until the card is dismissed.
