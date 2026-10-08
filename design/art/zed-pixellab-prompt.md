# Zed: Pixel Lab prompt pack

Source: `design/art/asset-manifest.md` (Zed section) and `design/art/style-guide.md` sections 2 and 5.
This file is standalone. It does not change the manifest, so the shipped placeholder stays until you swap in `assets/sprites/zed.png`.

NOTE: pixel-art Zed over a flat-vector world is the approved exception in the style guide (section 1 and Do and Don't). Zed will not match the vector Rust, UI and backgrounds in rendering, so keep the palette and outline rules below so he still reads as the same world. Whether other art also goes pixel is still style-guide Open Question 1.

PLACEHOLDER NOTE: "young", "street-level", "short dark hair" and "brown skin" below are working guesses for the look only. The GDD does not set Zed's age, role, backstory or appearance (canon.md open question 3; style-guide open question 5). Do not treat them as canon, and do not add backstory to prompts.

## 1. Settings

- Canvas: 128x128 per frame, side view, facing right, transparent background.
- Feet at bottom-centre. The figure is about 96px tall, so leave about 32px headroom for jump and attack smears.
- Outline: 1 selective dark outline, colour #2E1F16.
- Shading: flat 2 to 3 tones per colour, light source top left, no gradients, no dithering, no blur, no texture.
- Palette (keep to these, max ~12 colours):
  - Mustard #E3A92B, Mustard Light #F2C04D (jacket, highlights)
  - Warm Brown #6B4423 (trousers)
  - Skin Brown #8A5A3B (skin, open to revision)
  - Dark Brown #2E1F16 (outline, hair, boots)
  - Cream #F4E6C8 (shirt, shoe soles, small accents)
  - Brick Red #A8402E and Forest Green #2F6B3F (small casual-fit accents only, e.g. wristband, sneaker laces)
- Do NOT use Telegraph Red #FF3B30 or any cold slate/cyan (those belong to the Rust enemy and combat signals).
- Do not draw a ground shadow in the sprite. The game draws the flat 25 percent black ellipse under every character at runtime.

## 2. Character prompt (create Zed first, then animate)

```
Side-view 2D pixel art fighting-game hero, facing right, 128x128 canvas, transparent background.
Zed: young street-level neighbourhood hero, warm, rounded, casual and expressive.
Mustard yellow jacket, warm brown trousers, cream t-shirt, dark brown sneakers with cream soles,
short dark hair, brown skin. Friendly determined face, relaxed but ready stance, fists loosely raised.
Chunky readable silhouette, round shapes, slightly oversized jacket.
Clean 1-pixel dark brown outline (#2E1F16), flat cel shading with 2 to 3 tones per colour,
light from top left, limited warm palette, no gradients, no dithering, no anti-aliasing blur.
Full body, feet at bottom centre, about 96 pixels tall.
```

Negative prompt, if supported:
```
3D, realistic, gradients, glow, blur, text, background, ground shadow, red enemy colours,
cold blue or grey clothing, military uniform, helmet, weapons
```

Approve one idle pose before animating. Re-use that exact image as the reference/skeleton source for everything below.

## 3. Animations (keys must match the manifest exactly)

One animation per request, same character reference every time, same 128x128 canvas and same foot position in every frame.

| Key | Frames | FPS | Loop | Prompt |
|---|---|---|---|---|
| `zed.idle` | 6 | 8 | yes | "Fighting-stance idle, gentle breathing bob, shoulders and jacket rise and fall 1 to 2 pixels, fists loosely up, feet planted. Seamless loop." |
| `zed.walk` | 8 | 12 | yes | "Confident street walk cycle toward the right, relaxed fists, alternating legs, slight body bounce, jacket sways. Seamless 8 frame loop." |
| `zed.jump` | 4 | 10 | no | "Jump in 4 frames: 1 crouch and push off rising, 2 apex with knees tucked, 3 falling with legs reaching down, 4 landing squash with bent knees." |
| `zed.light` | 4 | 24 | no | "Quick light punch, fast jab with right fist. Frame 1 windup pulling fist back, frame 2 STRIKE arm fully extended forward with small motion smear, frame 3 active arm held extended, frame 4 recover pulling back to stance." |
| `zed.heavy` | 6 | 20 | no | "Heavy haymaker punch, big committed swing. Frames 1 to 2 windup leaning back and coiling the shoulder, frame 3 STRIKE huge swing with a large arc smear, frame 4 active arm fully extended with body twisted forward, frames 5 to 6 recover returning to stance." |
| `zed.hit` | 2 | 12 | no | "Hit reaction: frame 1 head snaps back and body recoils with eyes squeezed shut, frame 2 staggered backward, off balance." |
| `zed.ko` | 6 | 10 | no | "Knockout fall: staggers, is knocked backward off his feet, falls and lands flat on his back, ends lying on the ground, last frame is held still." |

Rules for every animation:
- Keep Zed facing right (the game flips him for left).
- Keep the feet on the same baseline except in `zed.jump` and `zed.ko`.
- Keep the same colours, outline and proportions in every frame.
- `zed.light` strike is frame 2 and `zed.heavy` strike is frame 3. Report these as the hit-active frames.

## 4. Assembling the sheet

Frame order (36 frames), 8 columns by 5 rows, 1024x640:

| Row | Columns 1 to 8 |
|---|---|
| 1 | idle 1 to 6, walk 1 to 2 |
| 2 | walk 3 to 8, jump 1 to 2 |
| 3 | jump 3 to 4, light 1 to 4, heavy 1 to 2 |
| 4 | heavy 3 to 6, hit 1 to 2, ko 1 to 2 |
| 5 | ko 3 to 6 |

Export as a PNG with a transparent background and no padding or spacing between cells. Save as `assets/sprites/zed.png`.
If the tool exports one GIF or strip per animation, join them in Aseprite or LibreSprite (File, Import Sprite Sheet / Export Sprite Sheet) in the order above.

## 5. Check before accepting

- Same face, outfit and colours in all 36 frames.
- Feet land on the same baseline in `idle`, `walk`, `light`, `heavy` and `hit`.
- Idle and walk loop with no pop between the last and first frame.
- The strike frames read clearly (light 2, heavy 3).
- No Rust or combat-signal colours leaked in.
