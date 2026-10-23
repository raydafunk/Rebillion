# Hit Feedback and Telegraph Spec (Tier 0)

Status: proposed starting values for tuning. Assumes 60 FPS (1 frame = ~16.7ms). All values must live in one config object (`hitFeedback` in game data) so they can be tuned without code changes. Consumers: Player Combos, Health & Hitbox, Enemy, Camera & Bounds agents.

## 1. Hit events

| Event | Hit-stop | Flash | Shake | Sparks | Knockback |
|---|---|---|---|---|---|
| Light hit lands | 50ms (3f) | 66ms white on target | none | 1 small spark | 60px, 120ms |
| Heavy hit lands | 100ms (6f) | 83ms white on target | 4px, 120ms | 1 large spark + 3 chips | 160px, 220ms |
| Combo finisher | 120ms (7f) | 100ms white | 6px, 160ms | large spark + 5 chips | 220px |
| Zed takes a hit | 80ms (5f) | 100ms white then 150ms red tint | 3px, 100ms | small cream spark | 80px |
| Enemy KO | 150ms (9f) | 120ms white | 5px, 150ms | large spark + dust puff | falls over 400ms |
| Block (future) | 40ms | none | none | blue-white ring | 20px |

## 2. Rules

- Hit-stop: freeze animations and physics of attacker and target only (not the whole world, not timer, not input buffering). Input during hit-stop is buffered so combos still chain. Never stack hit-stops; take the longest. Cap total at 150ms.
- Game timer must keep running through hit-stop (the GDD lose condition is timed); only entity updates pause.
- Flash: set target tint to full white (Phaser `setTintFill(0xFFFFFF)`), then clear. Single flash, no flicker.
- Shake: camera shake with decay (Phaser `camera.shake(duration, intensity)`; intensity about px/1280, e.g. 4px = 0.003). Only on heavy, finisher, KO, and damage to Zed. Disable via a "reduce screenshake" setting; default on.
- Sparks: spawn at hitbox/hurtbox overlap point, on a layer above characters. Light: scale 0.6, 120ms life, Spark Cream core (#FFF6D6), Mustard edge. Heavy: scale 1.0 to 1.4, 180ms, rotate randomly. Chips are 6px mustard/cream squares, 250ms, outward velocity 200 to 400 px/s.
- Squash and stretch on target for the hit-stop duration: scale x 1.08, y 0.94 (return in 80ms). Optional.
- Damage numbers: optional, off by default.
- Safety: no flashing faster than 3 flashes per second in aggregate; provide a "reduce flashes" toggle that disables white flash and shake.

## 3. Enemy telegraphs (readable at a glance)

Every Rust attack must be dodgeable by a player who reacts to the cue.

| Attack | Windup | Cues |
|---|---|---|
| Grunt basic strike | 400ms (24f) minimum; never below 300ms | 1) 3-frame anticipation pose (arm pulled back, body leaning away) 2) Telegraph icon (`fx.telegraph`, Telegraph Red) pops above head at windup start, 120ms scale-in, holds until strike 3) body tint pulses red 15 percent for the windup 4) 1px-wider outline |
| Heavy or later enemies | 600ms | same cues, icon scaled 1.4, ground danger zone ellipse in red at 30 percent alpha |

- Strike frame is the hitbox-on frame; active for 80ms, then recovery 300ms during which the enemy is vulnerable (gives the punish window).
- Attacker cap: only the enemies currently attacking show the red cue; waiting enemies circle in neutral colours, so the cue means "this one is about to hit".
- Telegraph colour is reserved (see style guide). Do not use it for any other effect.
- Do not interrupt a windup by hit-stop on other characters.

## 4. Priority and layering

Draw order top to bottom: UI, sparks and chips, telegraph icons, characters (sorted by y), ground shadows, background.
If effects overlap, white flash wins over red tint.

## 5. Config sketch

```json
{
  "hitStopMs": { "light": 50, "heavy": 100, "finisher": 120, "playerHurt": 80, "ko": 150, "max": 150 },
  "flashMs": { "light": 66, "heavy": 83, "finisher": 100, "playerHurt": 100, "ko": 120 },
  "shake": { "heavy": [120, 0.003], "finisher": [160, 0.0045], "playerHurt": [100, 0.0023], "ko": [150, 0.0038] },
  "telegraphMs": { "grunt": 400, "heavy": 600 },
  "accessibility": { "reduceShake": false, "reduceFlash": false }
}
```
(shake is [durationMs, intensity]). Values are a first guess and need playtest tuning.

## 6. Open questions
- Is a combo finisher defined by Player Combos? The finisher row is conditional on that.
- Should hit-stop also apply to the whole world for heavy hits (stronger feel, risks timer fairness)? Currently entity-only.
- Do accessibility toggles belong on the settings screen (ux-flow-designer / menu-ui-agent)?
- Audio hit cues are unowned.

## 7. Grunt health bar and hit particles (encounter-agent implementation values)

Status: decided by art direction, extends section 2 (section 2 values still apply where not overridden here). Flat vector, drawn with Phaser Graphics or rectangles, no textures needed. Style-guide section 5 already says enemy bars are Rust palette, 96x10, shown only when damaged; this section fixes the rest. Placeholder-grade: tune after playtest.

### 7.1 Enemy health bar (all Rust enemies, Grunt first)

| Property | Value |
|---|---|
| Overall size | 96 x 10 px outer (frame included). Heavy or later enemies: 128 x 12 |
| Position | Centred horizontally on the enemy; bottom edge 12 px above the top of the sprite body (not the hitbox). Follows enemy x/y every frame, no smoothing. Does not flip with facing |
| Shape | Hard rectangle, square corners (Rust is boxy, Zed's UI is rounded) |
| Frame | 2 px border #14181C (Rust Ink), then 1 px inner line #7C8A96 (Steel) top and left only as a bevel highlight |
| Background (empty) | #2A3138 (Gunmetal), 100 percent alpha |
| Fill area | 90 x 4 px inside the frame (outer minus 2px border and 1px padding each side). Crop by width = hp / maxHp, anchored left |
| Fill, over 50 percent | #4FB3D9 (Visor Cyan), with a 1 px lighter top row #A9DDF0 |
| Fill, 26 to 50 percent | #D9822B (Low Health orange), top row #F0A957 |
| Fill, 25 percent or less | #C9452F ("Enemy Critical"), top row #E9715C. Deliberately NOT #FF3B30: Telegraph Red is reserved for attack warnings |
| Drain (lag) bar | Cream #F4E6C8 segment behind the fill, covering the lost chunk. Holds 300 ms after a hit, then shrinks to the current hp over 250 ms (ease Quad.easeOut). New hit during the hold restarts the 300 ms hold and keeps the older left edge |
| Hit pulse | On damage the whole bar scales to 1.12 (about its centre) and returns in 100 ms; fill flashes #FFFFFF for 66 ms |
| Visibility | Hidden at full health. Appears on first damage (alpha 0 to 1 in 80 ms). Stays at alpha 1 for 3000 ms after the last damage, then fades to alpha 0.35 (never hidden again while the enemy lives) so remaining health stays readable in a crowd. Re-brightens to 1 on next damage. Under 50 percent hp it never fades below 0.6 |
| On KO | Drain bar empties, then bar fades out over 150 ms as the enemy starts its fall |
| Depth | Above characters, below sparks and the Zed HUD. Never occluded by other enemies |
| Telegraph interaction | The telegraph icon (`fx.telegraph`) sits ABOVE the bar: icon bottom = bar top - 4 px, so both stay readable |
| Text | No numbers on the bar |

### 7.2 Enemy sprite hit flash

- Flash: `setTintFill(0xFFFFFF)` for 66 ms (light), 83 ms (heavy), 100 ms (finisher), then `clearTint()`. Same as section 1; confirmed as the single flash. White wins over the telegraph red tint; if the enemy was telegraphing, restore the red pulse after the flash ends.
- Stagger pose: scale x 1.08, y 0.94 for the hit-stop duration, return in 80 ms (promote from optional to on for the Grunt).
- Rust enemies are never tinted warm colours on hit (warm is Zed-world).
- Reduce-flash setting on: skip the white fill, instead tint 0xBFC8CF (light steel) for the same duration and no bar pulse flash.

### 7.3 Hit particles (v2, "punchy and layered")

Status: REVISES the first 7.3 (small star, chips, thin sparks), which read as small and sparse in test. Same direction rule, same 60 cap, same accessibility principle (extended below). Flat vector only: every piece is a Graphics primitive (fillRect, fillCircle, fillTriangle or fillPoints, strokeCircle, lineBetween, rotate). No textures.

#### 7.3.1 Direction rule (mandatory, unchanged)

Spray AWAY from the attacker. `dir = sign(target.x - attacker.x)` (if equal, attacker facing). Base angle 0 deg when dir = +1, 180 deg when dir = -1, spread +/- the cone per layer, up bias 10 deg. Never toward the attacker. Spawn point: hitbox/hurtbox overlap centre (fallback: target centre x, target y minus 60 percent of height). Non-directional pieces are only the core flash, ring and star (centred on the contact point). The slash is drawn along the attack axis but its centre is pushed 20 percent of its length in the spray direction, so it visibly leads away from the attacker.

#### 7.3.2 Hot-to-cool ramp (sparks, trails)

Colour by life fraction t. Linear interpolate RGB between stops.

| t | Colour | Name |
|---|---|---|
| 0.00 | #FFFFFF | White hot |
| 0.20 | #FFD24A | Gold |
| 0.50 | #F58A2A | Ember orange |
| 0.80 | #9C5A2E | Rust brown |
| 1.00 | #9C5A2E at alpha 0 | gone |

Other new hexes: Rust Dark #6B3E22 (flake shade), Smoke Light #AEB6BC. Existing: Spark Cream #FFF6D6, Mustard #E3A92B, Steel #7C8A96, Light Steel #BFC8CF, Rust Ink #14181C, Dust #C9B79A. Rust brown (hue about 25 deg) and Ember (about 29 deg) are warm browns and oranges, never red: Telegraph Red #FF3B30 and Enemy Critical #C9452F stay reserved and appear in no particle.

#### 7.3.3 Layers, in draw order

Two Graphics objects. Layer A "shapes" (ring, core, slash, star, in that order, star on top) at depth 5050: above characters, BELOW the health bar (5100), so a flash never covers the bar. Layer B "debris" (ground dust, smoke, flakes, shards, sparks) at depth 5800 as before.

Values are light / heavy / finisher / KO. `t = age / life`.

| # | Layer | Shape and look | Count | Size (px) | Colour | Motion and easing | Life (ms) |
|---|---|---|---|---|---|---|---|
| 1 | Core flash | fillCircle at contact | 1 | radius 10 / 16 / 22 / 28 | #FFFFFF | radius 0.5R to R, Quad.easeOut. Alpha 0.85 x (1-t)^2 | 50 / 60 / 70 / 80 |
| 2 | Shockwave ring | strokeCircle at contact | 1 | start radius 6, end radius 28 / 48 / 64 / 72 | #FFFFFF, switching to Gold #FFD24A at t 0.4 | radius Cubic.easeOut. Line width 4 to 1 linear (finisher and KO: 6 to 1). Alpha 1 - t^1.5 | 140 / 180 / 220 / 260 |
| 3a | Impact star, back | 8-point jagged polygon (fillPoints), 2 px outline | 1 | outer radius 18 / 30 / 40 / 46, inner ratio 0.45, each outer tip jittered x0.8 to 1.15, whole star rotated random +/-15 deg | fill Gold #FFD24A, outline Rust Ink #14181C | scale 0.4 to 1.1 over first 50 percent, Back.easeOut, then hold. Alpha 1 until t 0.6, then linear to 0 | 100 / 150 / 180 / 200 |
| 3b | Impact star, front | same polygon and rotation | 1 (not counted in totals, same burst) | 0.6 x back radius | #FFFFFF, no outline | same scale curve. Alpha 1 until t 0.4 then linear to 0 (gold rim lingers last) | 80 / 120 / 144 / 160 |
| 4 | Comic hit line (slash) | tapered 4-vertex rhombus (fillPoints) through the contact point, tilt random +/-12 deg off the attack axis, centre pushed 20 percent of length in dir | 1 / 1 / 2 / 2 (2nd is a crossing slash, 60 percent length, +/-35 deg) | length 60 / 110 / 150 / 170, max thickness 6 / 10 / 12 / 14 | #FFFFFF; heavy and up add a 2 px #FFD24A outline | length 0.3 to 1.0 over the first 35 percent, Expo.easeOut. Thickness x (1-t)^2 (Quad.easeIn to 0) | 80 / 110 / 130 / 150 |
| 5 | Sparks with trails | head: rotated rect, length 14-20 (light) or 18-26 (heavy and up), thickness 3. Trail: 5 samples of past position 14 ms apart, drawn with lineBetween, width 3 tapering to 1 | 6 / 9 / 12 / 12 (1 in 4 is a "streamer": speed x1.5, life x0.7, thickness 2) | see shape | head colour = ramp(t). Trail segment i colour = ramp(t + 0.12 i), so older is cooler. Alpha 1 until t 0.8, then to 0 | speed 420-780 (light), 520-900 (heavy and up). Cone +/-25 deg. Gravity 400 px/s2. Head length x(1 - 0.6 t) | 180-260 / 220-300 / 240-320 / 240-320 |
| 6 | Metal shards | rotated rect 2:1, or fillTriangle (50 percent each). Spin random +/-540 deg/s | 4 / 7 / 10 / 11 | long side 5-8 (light), 7-12 (heavy and up); short side half | Steel #7C8A96 40 percent, Light Steel #BFC8CF 25 percent, Spark Cream #FFF6D6 20 percent, Mustard #E3A92B 15 percent | speed 220-420 light, 300-560 heavy and up. Cone +/-40 deg. Gravity 1100. FLOOR BOUNCE at floorY = target feet y + rnd(-4, 6): vy = -0.45 vy, vx x0.7, spin x0.6. Max 1 bounce (light), 2 (heavy and up). Alpha 1 until t 0.7, then to 0. No shrink | 450-650 |
| 7 | Rust flakes | fillRect squares, spin +/-360 deg/s | 6 / 10 / 14 / 14 | 3-5 | Rust brown #9C5A2E 50 percent, Rust Dark #6B3E22 25 percent, Ember #F58A2A 25 percent | speed 120-300, cone +/-55 deg (wider, lighter). Gravity 700. On reaching floorY: stop (vx = vy = spin = 0), lie there, fade over the last 150 ms. No bounce | 350-500 |
| 8 | Smoke puff | fillCircle, drawn as 2 stacked circles (r at full alpha, 0.6 r at half) | 3 / 4 / 6 / 6 | start diameter 10-18, grows to x2.0, Quad.easeOut | Smoke Light #AEB6BC 60 percent, Steel #7C8A96 40 percent. Start alpha 0.5, then x(1-t) | speed 30-90, cone +/-70 deg. Gravity -80 (rises). Invisible for the first 40 ms (delay) so it follows the flash | 300-450 |
| 9 | Ground dust (KO only) | fillCircle at feet | 6 | 8-14, grows x1.6 | #C9B79A, alpha 0.6 x (1-t) | speed 60-140 along the ground, cone +/-60 deg biased 20 deg down. Gravity -50 | 400 |

Particle totals per hit (rows 1, 2, 3a, 4 to 9; front star excluded): light 22, heavy 34, finisher 47, KO 54. Each is under the 60 cap alone.

#### 7.3.4 Cap, culling, readability

- Live cap 60. When over, drop in this order, oldest first within a kind: flakes, smoke, shards, ground dust. Never drop core, ring, star, slash or sparks (they define the hit and live under 320 ms). The existing `cullForCap` culls kind 'chip' first, so map flake and shard onto that priority.
- Readability: all layer A shapes are gone by 260 ms and the core by 80 ms. Max shape radius is 46 px, centred on the contact point (about mid-torso on a 128 px sprite), and layer A sits below the health bar, so the enemy silhouette and the bar stay legible. The white core and front star are the only large near-white areas and each lasts 80 ms or less. Debris pieces are under 12 px.
- Rate limit: if a core flash spawned less than 120 ms ago, skip the new core flash and front star (keep everything else). With the sprite flash in 7.2 this keeps aggregate white flashes under 3 per second in sustained combos.
- Particles do not freeze during hit-stop. They spawn at hit-stop start and play on real time, not slowed.
- Heavier classes are heavier through size, count, ring radius and the second crossing slash, not through longer screen coverage. Shake and hit-stop per class stay as in section 1 (heavy 4px/120ms, finisher 6px/160ms, KO 5px/150ms). KO also adds the ground dust and the largest ring.

#### 7.3.5 Accessibility

Reduce-flash ON: skip the core flash, the white front star and the slash. Keep the back star only if recoloured Spark Cream #FFF6D6 at alpha 0.6 with no outline flash. Keep the ring but recolour it Light Steel #BFC8CF at alpha 0.5, width 2. Sparks ramp starts at Gold (skip the white stop). Shards, flakes, smoke and dust unchanged. Reduce-shake affects camera shake only. Neither setting removes the debris layers.

#### 7.3.6 Zed taking a hit (class `playerHurt`, same system, deliberately smaller so enemy hits stay the loudest thing on screen)

dir away from the enemy. Ring: end radius 22, Spark Cream #FFF6D6 to Mustard #E3A92B, 120 ms. Star: 8-point, outer radius 14, fill #FFF6D6, outline 2 px #E3A92B, 90 ms. Sparks: 4, ramp stops #FFF6D6, #E3A92B, #D9822B, length 12-16, speed 350-600, 150-200 ms. Chips: 4 Spark Cream squares 4-6 px, speed 180-320, gravity 900, 250-350 ms. No core flash, shards, flakes or smoke. 10 particles.

### 7.4 Config sketch (encounter-agent can copy; replaces the previous `hitParticles` block. `enemyBar` and `enemyFlashMs` are unchanged)

Per-class values are keyed `light, heavy, finisher, ko`. Ranges are [min, max]. Colours are hex strings.

```json
{
  "hitParticles": {
    "awayFromAttacker": true, "upBiasDeg": 10, "cap": 60,
    "cullOrder": ["flake", "smoke", "shard", "groundDust"],
    "layerDepth": { "shapes": 5050, "debris": 5800 },
    "flashRateLimitMs": 120,
    "ramp": [[0.0, "#FFFFFF"], [0.2, "#FFD24A"], [0.5, "#F58A2A"], [0.8, "#9C5A2E"]],
    "core":  { "radius": { "light": 10, "heavy": 16, "finisher": 22, "ko": 28 }, "color": "#FFFFFF", "alpha": 0.85,
               "lifeMs": { "light": 50, "heavy": 60, "finisher": 70, "ko": 80 }, "ease": "Quad.easeOut" },
    "ring":  { "startRadius": 6, "radius": { "light": 28, "heavy": 48, "finisher": 64, "ko": 72 },
               "width": { "light": [4, 1], "heavy": [4, 1], "finisher": [6, 1], "ko": [6, 1] },
               "colors": ["#FFFFFF", "#FFD24A"], "switchAt": 0.4,
               "lifeMs": { "light": 140, "heavy": 180, "finisher": 220, "ko": 260 }, "ease": "Cubic.easeOut" },
    "star":  { "points": 8, "innerRatio": 0.45, "tipJitter": [0.8, 1.15], "tiltDeg": 15,
               "radius": { "light": 18, "heavy": 30, "finisher": 40, "ko": 46 },
               "back": { "fill": "#FFD24A", "outline": "#14181C", "outlinePx": 2 },
               "front": { "fill": "#FFFFFF", "radiusRatio": 0.6 },
               "scale": [0.4, 1.1], "scaleEase": "Back.easeOut", "scaleUntil": 0.5,
               "lifeMs": { "light": 100, "heavy": 150, "finisher": 180, "ko": 200 }, "frontLifeRatio": 0.8 },
    "slash": { "count": { "light": 1, "heavy": 1, "finisher": 2, "ko": 2 },
               "length": { "light": 60, "heavy": 110, "finisher": 150, "ko": 170 },
               "thickness": { "light": 6, "heavy": 10, "finisher": 12, "ko": 14 },
               "tiltDeg": 12, "crossDeg": 35, "crossLengthRatio": 0.6, "leadRatio": 0.2,
               "fill": "#FFFFFF", "outline": "#FFD24A", "outlineFrom": "heavy",
               "lifeMs": { "light": 80, "heavy": 110, "finisher": 130, "ko": 150 }, "lengthEase": "Expo.easeOut", "growUntil": 0.35 },
    "sparks": { "count": { "light": 6, "heavy": 9, "finisher": 12, "ko": 12 }, "streamerEvery": 4,
                "lenPx": { "light": [14, 20], "heavy": [18, 26] }, "thickness": 3, "streamerThickness": 2,
                "speed": { "light": [420, 780], "heavy": [520, 900] }, "streamerSpeedMul": 1.5, "streamerLifeMul": 0.7,
                "coneDeg": 25, "gravity": 400,
                "lifeMs": { "light": [180, 260], "heavy": [220, 300], "finisher": [240, 320], "ko": [240, 320] },
                "trail": { "samples": 5, "spacingMs": 14, "widthPx": [3, 1], "coolPerSample": 0.12 } },
    "shards": { "count": { "light": 4, "heavy": 7, "finisher": 10, "ko": 11 },
                "sizePx": { "light": [5, 8], "heavy": [7, 12] }, "aspect": 2, "triangleShare": 0.5,
                "colors": [["#7C8A96", 0.4], ["#BFC8CF", 0.25], ["#FFF6D6", 0.2], ["#E3A92B", 0.15]],
                "speed": { "light": [220, 420], "heavy": [300, 560] }, "coneDeg": 40, "gravity": 1100, "spinDegPerSec": 540,
                "floor": { "yOffset": [-4, 6], "restitution": 0.45, "vxKeep": 0.7, "spinKeep": 0.6,
                           "maxBounces": { "light": 1, "heavy": 2, "finisher": 2, "ko": 2 } },
                "lifeMs": [450, 650], "fadeFrom": 0.7 },
    "flakes": { "count": { "light": 6, "heavy": 10, "finisher": 14, "ko": 14 }, "sizePx": [3, 5],
                "colors": [["#9C5A2E", 0.5], ["#6B3E22", 0.25], ["#F58A2A", 0.25]],
                "speed": [120, 300], "coneDeg": 55, "gravity": 700, "spinDegPerSec": 360,
                "landStop": true, "landFadeMs": 150, "lifeMs": [350, 500] },
    "smoke": { "count": { "light": 3, "heavy": 4, "finisher": 6, "ko": 6 }, "sizePx": [10, 18], "grow": 2.0, "growEase": "Quad.easeOut",
               "colors": [["#AEB6BC", 0.6], ["#7C8A96", 0.4]], "alpha": 0.5, "speed": [30, 90], "coneDeg": 70, "gravity": -80,
               "delayMs": 40, "lifeMs": [300, 450] },
    "groundDust": { "count": { "ko": 6 }, "sizePx": [8, 14], "grow": 1.6, "color": "#C9B79A", "alpha": 0.6,
                    "speed": [60, 140], "coneDeg": 60, "downBiasDeg": 20, "gravity": -50, "lifeMs": 400 },
    "reduceFlash": { "skip": ["core", "slash", "starFront"], "starBack": { "fill": "#FFF6D6", "alpha": 0.6 },
                     "ring": { "color": "#BFC8CF", "alpha": 0.5, "widthPx": 2 }, "rampSkipsWhite": true },
    "playerHurt": { "ring": { "radius": 22, "colors": ["#FFF6D6", "#E3A92B"], "lifeMs": 120 },
                    "star": { "radius": 14, "fill": "#FFF6D6", "outline": "#E3A92B", "lifeMs": 90 },
                    "sparks": { "count": 4, "ramp": ["#FFF6D6", "#E3A92B", "#D9822B"], "lenPx": [12, 16], "speed": [350, 600], "lifeMs": [150, 200] },
                    "chips": { "count": 4, "color": "#FFF6D6", "sizePx": [4, 6], "speed": [180, 320], "gravity": 900, "lifeMs": [250, 350] } }
  }
}
```

### 7.5 Open questions and implementation notes
- Renderer additions needed in `EnemyHitFx.js` (art direction does not edit src): a second Graphics layer at depth 5050; `strokeCircle` (ring); `lineBetween` or rotated rects (trails); `fillTriangle` (shard variant); per-particle position history, delay field, floor bounce, hot-to-cool colour lerp, and new kinds core, ring, slash, shard, flake, smoke. `hitFeedbackData.js` and its test still hold the OLD 7.3 values (chips, sparks, burst, dust) and will not match this spec until the encounter-agent updates them.
- New palette colours (Ember #F58A2A, Gold #FFD24A, Rust Brown #9C5A2E, Rust Dark #6B3E22, Smoke Light #AEB6BC) are not yet in the style guide. Ember is close to the Low Health orange #D9822B used on the bar; they never share a screen role, but confirm. Owner approval needed.
- All counts, sizes and speeds are placeholder-grade first values. If it still reads small, scale ring and star radius by 1.25 first (cheapest lever), then counts, keeping the total under 60.
- Enemy Critical #C9452F is a new colour; confirm the owner is fine adding it to the style-guide palette (kept distinct from Telegraph Red #FF3B30).
- Final grunt sprite height is not fixed; the 12 px bar offset assumes the 128 px frame and a bar anchored to the sprite body top.
- Idle-fade (never fully hidden once damaged) is a readability choice; revert to hide-after-3s if it clutters.
