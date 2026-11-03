# Rage Intro Card (Level 2 only)

Owner: art-direction-agent. Status: DRAFT, placeholder art, pending owner approval.
Style: flat vector, Hope palette (style-guide section 2) with the Rage palette (section 10.1) as accent. Resolution 1280x720.

## What it is

A **card**, not a screen: a centred 960x460 panel over the arena with a 60 percent Dark Brown dim, same family as `LevelCard`, `StoryCard` and `VictoryCard`. It explains the Rage meter once, at the start of **Level 2 only** (the first level with a meter; Level 1 hides it). It replaces the old hint box under the Rage bar. No scene change, no buttons, no backstory (the father is never mentioned).

Gate: `shouldShowRageIntro(levelNumber)` is true only for 2. Shown after the Level 2 intro card and before the first wave; the Rage clocks are already frozen until the round starts, so nothing drains while it is up. Shown again on a retry of Level 2 only if the lead wants it (open question 2).

## Copy (live text, never baked into the SVG)

| Element | Text | Font | Size | Colour |
|---|---|---|---|---|
| Header | RAGE | Anton | 64px, 4px letter spacing | Rage Red-White #FFE3D6, 4px Dark Brown stroke |
| Line 1 | Land blows on Rust enemies to fill the meter. Clean streaks fill it faster. | Rubik 500 | 24px | Cream #F4E6C8 |
| Line 2 | It starts empty each level. At full it is READY for 4 seconds. | Rubik 500 | 24px | Cream #F4E6C8 |
| Line 3 | Press L to unleash Zed Rage for 9 seconds. Your attacks become the Rage move. | Rubik 700 | 24px | Rage Gold #FFD24A |
| Line 4 | You can still move, jump and block. A hit will not end it, a knockout will. | Rubik 500 | 24px | Cream #F4E6C8 |
| Keycap letter | L | Anton | 40px | Dark Brown #2E1F16 on Cream keycap |
| Prompt | Enter / click to fight on | Rubik 500 | 20px | Cream #F4E6C8 |

Numbers 4 and 9 are built from `RAGE_CONFIG.readyWindowSec` and `rageDurationSec`; a test pins them. Title and prompt live in `rageIntroData.js` (the old under-bar hint box and its `RAGE_COPY.intro*` strings were removed). Bosses count as Rust enemies, so line 1 covers them; every blow counts the same, so no per-attack detail is shown.

Contrast (card body #3A2218): Cream ~11:1, Rage Gold ~9:1, Red-White on Rage Ember header #7A2E1A ~9:1, Dark Brown on Cream keycap ~11:1. All pass 4.5:1.

## Layout (card at x=160, y=130, 960x460)

| Element | Position inside card | Notes |
|---|---|---|
| Header strip | y 6 to 98, Rage Ember | Four faint Rage Orange flame spikes at the corners (55 percent) |
| Band | y 98 to 108, Rage Red | Dark Brown hairlines top and bottom |
| Emblem | centre (175, 262) | Ember burst with Orange spikes, flame in Rage Red / Orange / Red-White, blank Cream L keycap below it (live "L" at 175, 330) |
| Text column | left 340, top 122, width 570 | Four paragraphs, 10px apart; line 3 is the only highlighted one |
| Meter strip | y 378 to 392, x 340 to 850 | Eight blocks ember, orange, red, red-white: a miniature of the filling meter. Decorative |
| Prompt | left 340, top 414 | |

Fit check: worst case each line wraps to two rows at 24px (about 4 x 2 x 33px plus gaps, roughly 290px from y 122), ending near y 410, which touches the meter strip at 378. If a fallback font wraps wider, drop `lineSize` to 22 (one number in `rageIntroData.js`). Verify in the running game.

## Look rules followed

- Panel recipe from the style guide, inverted for night/ember mood: dark body, Dark Brown 6px outline, 16px radius, flat 35 percent drop edge, inner 3px Rage Red keyline.
- 2 to 3 tones per colour, no gradients, no glow, no blur, no textures.
- Rage colours only from section 10.1. No Telegraph Red #FF3B30, no Overload Violet, no Visor Cyan (those belong to the enemy side).
- Every colour is backed by shape or text: the flame, the L keycap and the words carry the meaning, not colour alone.
- Nothing rotated. Reads in greyscale: header dark, emblem mid, text light.

## Motion (for the implementer)

1. Dim fades in 0.2s; card drops 40px with a 0.25s ease-out (plain 0.15s fade when reduced motion is on; `reduceMotion` option on the function).
2. No sound, no flash, no shake: the real Rage entry flash is reserved for activation (`rage-entry-flash.md`), so this card must not pre-empt it.
3. Dismiss on Enter, Space or click; input ignored for the first 1.5s so it is not skipped unread. Auto-closes after 45s as a safety net (the other cards use 8s; this one is meant to be read).
4. Depth 7000, scrollFactor 0, keys and objects cleaned up on dismiss, cancel or scene shutdown; `onDone` fires once.

## Assets

| Key | File | Size | Notes |
|---|---|---|---|
| `ui.card.rage-intro` | `assets/ui/rage-intro-card-frame.svg` | 960x460 | PLACEHOLDER, text-free frame. Swap by overwriting the file. Preload with `RAGE_INTRO_ASSET` from `src/ui/rageIntroData.js` |

Without the asset the card falls back to a plain dark panel.

## Open questions

1. Is a dark card right, or should it match the Cream Hope panels of the other cards? Dark was chosen so Rage reads as its own system.
2. Retry of Level 2: show the card again, or only the first time per session? Default here is whatever the scene decides; the data module only gates on level.
3. Final emblem: keep the flat flame and keycap, or use Zed with the fist glow once Rage frames are final?
4. Wording of line 4 ("a hit will not end it, a knockout will") is plain on purpose; the content pipeline may replace it with a dialogue id later.
5. Fonts were not rendered in a browser here; check line wrapping in the running game.
