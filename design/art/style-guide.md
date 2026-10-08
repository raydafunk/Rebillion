# The Rebellion: Style Guide (Tier 0)

Status: DRAFT, pending art style approval (see Open Questions). Target resolution: 1280x720.

## 1. Art style: flat vector world, pixel art Zed

DECISION: Zed (the player character) is hand-authored pixel art. Everything else (Rust enemies, UI, backgrounds, FX, menu) stays flat vector until the owner decides otherwise (see Open Question 1). Zed's spec, prompts and sheet layout: `design/art/zed-pixellab-prompt.md`.

Zed pixel rules:
- 128x128 frame, ~96px figure, facing right, feet at bottom-centre.
- Selective 1px outline #2E1F16, 2 to 3 flat tones per colour, light from top left, no gradients, no dithering, no blur, no anti-aliasing.
- Palette limited to the Hope palette in section 2 (Mustard, Mustard Light, Warm Brown, Skin Brown, Dark Brown, Cream, small Brick Red and Forest Green accents); no Rust or combat-signal colours.
- Render the sprite with nearest-neighbour filtering (Phaser `pixelArt` or per-texture `setFilter(NEAREST)`), and keep sprite scale an integer so pixels stay square.
- The ground shadow is not baked in; the game draws the flat 25 percent black ellipse.

The rest of this section describes the flat-vector style for everything that is not Zed.

Flat-vector shapes with a thick dark outline, 2 to 3 tone cel shading, no gradients, no textures.

Why not pixel art:
- Agent-built project: SVG and simple shape rigs can be generated and edited as text by agents; hand-placed pixels cannot be generated reliably.
- The GDD budgets tokens for "at least one character to move" and an animation lead who owns a large workload. Flat vector is the cheapest path to a consistent look.
- Scales cleanly to 1280x720 and other sizes with no filtering artifacts.
- The theme (murals, bold colour, casual fits) suits big colour blocks and strong silhouettes.
- Placeholders and final art share one language, so swapping is low risk.

Rules: outline 4px at 128px sprite height (scale proportionally; Zed is the exception, 1px pixel outline per the Zed pixel rules above), outline colour #2E1F16 for Zed and the world, #14181C for Rust. Shadows are flat 25 percent black ellipses under every character, drawn by the game at runtime (never baked into any sprite, Zed's included). Light source top left.

## 2. Palette

Hope palette (Zed, world, UI):

| Name | Hex | Use |
|---|---|---|
| Mustard | #E3A92B | Primary accent, Zed jacket, buttons, timer frame |
| Mustard Light | #F2C04D | Hover, highlights |
| Brick Red | #A8402E | Panel headers, buildings, heart icon, damage, title shadow (`brickRed`) |
| Forest Green | #2F6B3F | Foliage, gardens, murals |
| Health Green | #4C9A55 / #7BC47F | Health fill / highlight |
| Warm Brown | #6B4423 | Ground, trousers, wood |
| Skin Brown | #8A5A3B | Zed skin (placeholder, open to revision) |
| Dark Brown | #2E1F16 | Outlines, text, bar frames |
| Cream | #F4E6C8 | Panels, light text on dark |
| Sand | #F2D9A0 / #E8C27A | Background sky and walls |

Rust palette (enemy, deliberately colder and harsher):

| Name | Hex | Use |
|---|---|---|
| Slate | #3C4650 | Uniform |
| Gunmetal | #2A3138 | Boots, gloves |
| Steel | #7C8A96 | Helmet |
| Visor Cyan | #4FB3D9 | Visor, Rust UI accents |
| Rust Ink | #14181C | Outline |

Combat signal colours (reserved, never used for decoration):

| Name | Hex | Use |
|---|---|---|
| Telegraph Red | #FF3B30 | Enemy attack warning only |
| Hit White | #FFFFFF | Hit flash |
| Spark Cream | #FFF6D6 | Spark core |
| Low Health | #D9822B then #FF3B30 | Bar at 50 percent and 25 percent |

Contrast: all text must reach 4.5:1 (Cream on Dark Brown ~11:1; Dark Brown on Mustard ~7:1).

## 3. Typography

Street-style set, all Google Fonts under the SIL OFL (licensing confirmed). Real values live in `src/config/assetKeys.js` (`FONTS`).

- Display (game title and large splash text): "Permanent Marker"; fallback `Impact, sans-serif`.
- Buttons and result headings (WIN/LOSE): "Anton"; fallback `Impact, sans-serif`.
- Body and small text: "Rubik" weights 500 and 700; fallback `Arial, sans-serif`.
- Numerals (timer, wave counter): Rubik 700, tabular figures.
- Sizes at 1280x720 (as built in the menu prototype): title 96px, subtitle 32px, button 36px, result heading 72px, HUD label 20px, timer 40px, minimum body 18px.
- Text: Cream with 4px Dark Brown stroke over action; Dark Brown on Mustard/Cream surfaces.

Title treatment: Mustard #E3A92B fill, Dark Brown #2E1F16 outline about 10px, hard Brick Red #A8402E offset shadow 7px right and 7px down with no blur, rotated -2.5 degrees. Subtitle: uppercase Rubik 700, Cream, same -2.5 degree tilt (6px Dark Brown stroke).

Rule: tilt only the title and subtitle. Never rotate HUD, timer, button or other gameplay text.

Font loading: canvas text must not draw before fonts are ready. Call `waitForFonts()` from `src/config/assetKeys.js` before creating text; it waits on `document.fonts.load()` for all three families with a 2.5s cap, then proceeds with the fallbacks.

## 4. UI components

- Button (260x64): Mustard fill, 4px Dark Brown outline, 12px radius, solid dark-mustard drop edge. States: default, hover (#F2C04D), pressed (#C48E1F, shifted down 4px), disabled (#8C8070). Focus ring: 4px Cream outside outline, for keyboard and gamepad. Label centred.
- Health bar (frame 360x32, fill 348x20): Dark Brown frame with Cream 3px border; fill Health Green with a lighter top band. Crop the fill by width (scaleX). Colour shifts at 50 percent and 25 percent. A delayed "chip" bar in Cream shows recent damage for 400ms. Enemy bars use Rust palette (Steel frame, Visor Cyan fill), 96x10, shown only when damaged.
- Timer (frame 160x56): Dark Brown with Mustard border; digits Cream. Last 10 seconds: digits and border pulse Telegraph Red at 2 Hz.
- Panel (560x360): Cream body, Dark Brown 6px outline, Brick Red header strip 48px, 16px radius. Used for pause, win, lose.
- Icons (32x32): flat shapes, 3px Dark Brown outline, one fill colour, rounded joins, no inner detail.
- HUD layout: health top left at (24,24), timer top centre, wave counter top right. Keep 24px safe margin. (ux-flow-designer owns final layout; this is a default.)

## 5. Characters and world

- Zed (pixel art): 128x128 frame, ~96px tall figure, mustard jacket, warm brown trousers, expressive casual fit. Facing right by default; flip for left. Pixel rules in section 1.
- Rust enemies: same frame size, uniform and symmetrical, visor, no personality colour. Contrast through cold hue and straight geometry versus Zed's rounded forms.
- Background: warm, busy mid-ground (corner shop, mural, court hoops, food stall, garden planters), calmer play lane. Background saturation and contrast lower than characters so fighters always pop. Play lane y 440 to 680 stays free of high-contrast detail.

## 6. Do and Don't

Do
- Keep silhouettes distinct: Zed is warm and round, Rust is cold and boxy.
- Reserve Telegraph Red for enemy warnings and the low-time pulse.
- Use outlines on every interactive or combat element.
- Keep the HUD readable at a glance: bar plus number, big timer.

Don't
- Don't use brick red or red-orange on enemies, which confuses damage and telegraph cues.
- Don't put busy mural detail behind the play lane.
- Don't add gradients, blur, or textures (breaks flat-vector consistency).
- Don't mix pixel art and vector assets, except the approved case: pixel-art Zed over a vector world. Keep Zed's outline colour, palette and flat shading so he still sits in the same scene, and don't apply smoothing filters to him.
- Don't rely on colour alone: telegraphs also use shape (icon) and motion.

## 7. Placeholder policy

Everything currently under `assets/` is a PLACEHOLDER generated shape, not final art. Each file contains a placeholder comment. Replace by overwriting the file at the same path or updating the path in `assets/asset-keys.json`; keys do not change.

## 9. Main menu: Wheatpaste Wall (approved brief: design/ux/menu-concept.md)

Scope: main menu scene only. Same flat-vector rule (flat shapes, no gradients, no glow, no outlines needed on scenery), but edges are torn and uneven (irregular polygons) to read as pasted paper and worn walls.

Menu palette (from the approved brief; takes precedence inside the menu scene):

| Name | Hex | Use |
|---|---|---|
| Brick | #9C3B2E | Wall, Rust notice poster |
| Brick Dark | #7A2F25 | Mortar, poster borders |
| Mustard | #E1A92B | Selected strip, lit windows, subtitle, lane dashes |
| Forest | #2F5D3A | Options strip, vines, poster text |
| Brown | #6B4A2F | Quit strip, door, ledge top |
| Cream | #E8DCC0 | Title text, Controls strip, posters, sun |
| Near-black | #1D1A16 | Title strip, ledge, silhouettes, street |

Scenery-only derived tones (placeholder values, not UI colours): sky bands #B5522F, #D07A2C, #E1A92B, #EBC862; far buildings #5B3A2E; near buildings #2B2420 with windows #3A2F28; street #2A2420.

Palette conflict to resolve: the game palette in section 2 uses Mustard #E3A92B, Brick #A8402E, Forest #2F6B3F, Brown #6B4423, Cream #F4E6C8, Dark Brown #2E1F16. The menu values differ slightly. Menu scene uses the menu set; in-game UI keeps section 2 until the owner chooses one set (open question 8).

Typography (menu): display and buttons "Anton" (heavy condensed; fallback `Impact, sans-serif`); small print, subtitle, footer hint "Courier Prime" (fallback `'Courier New', monospace`). This differs from section 3, where the title uses Permanent Marker and body uses Rubik. Courier Prime is OFL on Google Fonts (not yet loaded in `waitForFonts()`; menu-ui-agent to add). Title cream on near-black strip, tilted about 2 degrees; subtitle mustard monospace. Posters ship with block placeholders in place of text; titles must be live text over the poster sprite (SVG loaded as an image cannot use web fonts).

Strip colours: Fight mustard (selected, brightest), Controls cream, Options forest with cream text, Quit brown with cream text. Strip art is one white torn shape tinted per option. Dark text on mustard and cream; cream text on forest and brown.

Selection feedback: tween rotation to 0 and x +10px over about 100 ms, then the bright variant; mouse hover identical.

Layering (back to front): menu.sky, menu.buildings.far (parallax slow), menu.buildings.near, menu.street (place at y 360), menu.wall (x 0, left half, hides left buildings), posters and strips on the wall. Do: keep the wall busy only where the menu is not; keep text over flat areas. Don't: add glow around the sun or lit windows, gradients, or smooth rounded edges on paper.

## 8. Open questions

1. Art style approval: Zed is pixel art (decided). Open: should Rust enemies, UI and backgrounds also move to pixel art, or stay flat vector next to pixel Zed?
2. Resolution: 1280x720 assumed. Scale mode (FIT?) and whether pixel-perfect scaling is needed.
3. Sprite frame size: 128x128 assumed. Is a larger hero (e.g. 192) wanted?
4. Final animation source for Rust enemies and FX: hand-authored spritesheets, skeletal rig (Spine/DragonBones), or tween-driven vector parts? Zed is settled (hand-authored 36-frame pixel sheet, fixed in the manifest) and is out of scope here; this question only affects the Rust grunt frame counts.
5. Zed's design (skin tone, hair, silhouette, and the "young street hero" read) needs creative sign-off from the GDD owner; current look is a placeholder. The GDD does not state Zed's age, role or backstory (canon.md open question 3).
6. Resolved: fonts. Bangers replaced by Permanent Marker (display), Anton added (buttons, result headings), Rubik kept (body); all OFL. See section 3.
7. Audio sync cues for hits are not in this scope; who owns them?
8. Menu palette vs game palette (section 9 vs section 2): unify on one set? Also confirm Anton plus Courier Prime for the menu.
9. Menu SVGs are placeholders generated by script; final hand-polished art not produced. Brick wall has no texture beyond mortar lines.
