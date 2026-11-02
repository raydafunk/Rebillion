# Dugan Wall Slam impact (art and feedback spec)

Status: PROPOSED starting values for playtest. Owner: art-direction-agent. Covers the moment "Brick" Dugan's Grab and Wall Slam (and the charge-catch grab) slams Zed into the ground. Feedback only: damage, knockback (640 px/s, fast decay), 700 ms lying time, Dugan's 110 ms hit-stop and every other gameplay number are fixed inputs and are not changed here. Flat vector, all shapes drawn in code, no new image files. Times are ms from the `PLAYER_SLAMMED` event, so the impact is t = 0. There is no wind-up: Dugan's hold is the wind-up.

Input: `PLAYER_SLAMMED { attackerId, damage, slamDir (+1 / -1 toward the wall), x, y }`. x0, y0 = Zed's feet at impact. dir = slamDir. All floor shapes are flattened ellipses (height ratio 0.3), same as the Mega Stomp.

## 1. Intent

Mega Stomp is a long rolling wave you read and dodge. Wall Slam is the opposite: a short, brutal, compressed jolt that has already happened. The player should feel one hard crunch (about 0.4 s of shake, not a rumble), see the street split under Zed in a star, see a hot ring shove dust and pebbles outward, and see one long crack race ahead of him in the direction he is about to be thrown. Then it settles: a dark dent under his body, a skid groove behind him, and dust, while he lies there for 700 ms. Same colour families as the stomp (warm broken pavement answers cold Rust power), but no wave front, no teeth, no red: nothing here is a hit test or a warning, so nothing looks like one.

Readability rules: every floor shape sits on the floor layer (depth 440, behind Zed and every fighter), so Zed, his lying pose and the HUD are never covered. The only near-white area is the core flash, 70 ms, flattened and under him. Top-layer pieces (depth 5800) are chunks and sparks only, each 14 px or smaller.

## 2. Timeline (ms from impact)

| Time | Player sees | Camera |
|---|---|---|
| 0 | Dent snaps in under Zed. Core flash (cream, 70 ms). Ring bursts out. Star cracks appear at 15 percent length and run out. 14 chunks, 10 sparks, 12 dust puffs launch. Pebbles and ring dust start moving with the ring. Edge vignette snaps to peak | Shake peak 0.015. Punch-in to 1.03 in 60 ms |
| 0 to 140 | Long cracks and the slide crack grow to full length (Expo.easeOut, the slide crack is the fastest). Spark at the slide crack's growing tip | shake 0.015 then 0.011 |
| 70 | Core flash gone. Ripple 1 starts | |
| 120 | Ripple 2 starts. Zed slides at about 640 px/s: skid groove and slide dust begin | shake 0.0075 |
| 240 | Main ring gone. Ring dust and pebbles still travelling | shake 0.0045 from 200 |
| 300 | Zoom back to 1.0 (260 ms Sine.easeInOut, from 60 to 320). Vignette gone at 400 | shake 0.0022 from 290, ends 380 |
| 350 | Dent holds until here, then fades | none |
| 900 | Dent gone. Slide dust and chunks done by about 1000 | |
| 1200 | Cracks gone (Zed stands up about 700 ms after the slide). Nothing left on screen | |

## 3. Look

### 3.1 Dent and dust bowl (floor layer)
Flattened ellipse at (x0, y0), rx 70 snapping to 110 over 90 ms (Quad.easeOut), ry = 0.3 rx. Fill Dark Brown #2E1F16, alpha 0.55. Rim stroke 3 px Warm Brown #6B4423 alpha 0.6 (the "lip" of the bowl). Holds 350 ms, then alpha to 0 by 900 (Quad.easeIn). It sits under Zed's lying body so the silhouette stays readable against it. Not red, not cold: it reads as pressed earth.

### 3.2 Core flash and ring
- Core: Spark Cream #FFF6D6 flattened ellipse, rx 40 to 120 over 70 ms (Quad.easeOut), alpha 0.7 to 0. Under Zed.
- Ring: flattened ellipse stroke, rx 20 to 210 over 240 ms (Cubic.easeOut), width 6 to 2 px, colour Cream #FFF6D6 until 35 percent of life then Ember #F58A2A, alpha 1 to 0.
- Ripples: two thin trailing rings behind the main ring, Dust #C9B79A, 2 px, alpha 0.35 to 0. Ripple 1 starts at 70 ms, rx 30 to 300, life 380 ms. Ripple 2 starts at 120 ms, rx 30 to 380, life 460 ms. Both Cubic.easeOut. They carry the "area" feel past the star and are cheap (two strokes).

### 3.3 Cracks: star, area-wide, and the slide crack (floor layer)
Look for every crack: core line 3 px Dark Brown #2E1F16 alpha 0.7, plus a 1 px Ember #F58A2A glow line alpha 0.8 that fades over the first 250 ms, so the crack looks freshly broken then goes cold. Cracks are jagged polylines (segments of 40 to 60 px, jitter +/-5 px in x, +/-3 px in y). Vertical component is scaled 0.3 like all floor shapes, and every point is clamped to y 445 to 695. Hold 700 ms, then fade 500 ms (life 1200).
1. Short radial cracks: 4, evenly spaced with +/-0.25 rad jitter, length 90 to 140 px.
2. Long radial cracks: 2, one on each side of the screen (angle 0 and 180 deg, +/-0.2 rad), length 220 to 300 px. These carry the damage across the area.
3. Slide crack: 1, along slamDir, starts at (x0, y0 + 2), length 360 px, nearly straight (jitter +/-3 px, y drift at most 8 px), grows from 0 to full length in 140 ms (Expo.easeOut). Its tip emits 1 spark per 35 ms while growing (4 sparks total, small, counted in the spark budget). It leads ahead of the sliding body and shows where he is going.
4. Branches: 3 total, one on each long radial and one on the slide crack, at 40 to 55 percent of length, +/-35 deg off the parent, length 40 percent of the parent, same look.
5. Arena clamp: if the crack would pass the arena's walkable x range, cut it at the edge (data flag `clampToArenaX`).

### 3.4 Chunks (top layer, depth 5800)
14 chunks, rects and triangles 6 to 12 px (40 percent triangles), spawn at x0 +/-24, y0 +/-8, speed 260 to 620, cone 60 to 120 deg up, gravity 1400, one floor bounce at restitution 0.3, life 600 to 900, fade over the last 30 percent. 4 of the 14 get a horizontal bias of +0.3 along slamDir so debris leans with the slide. Colours Warm Brown #6B4423 40 percent, Dark Brown #2E1F16 25 percent, Dust #C9B79A 20 percent, Steel #7C8A96 15 percent.

### 3.5 Sparks (top layer)
10 sparks (include the 4 from the slide crack tip, so 6 at the contact point). Rotated rect, length 14 to 20, thickness 3, 3-sample trail, cone +/-30 deg around slamDir biased 20 deg up, speed 420 to 760, gravity 900, life 220 to 320. Colour by life with the project's hot-to-cool ramp (hit-feedback-spec 7.3.2): White #FFFFFF, Gold #FFD24A at 0.2, Ember #F58A2A at 0.5, Rust brown #9C5A2E at 0.8. White is a single frame on spawn, not a flash. Scrape sparks while sliding: 1 every 90 ms while slide speed is above 200 px/s, 3 at most, same look at 60 percent size, flung opposite to slamDir.

### 3.6 Shockwave shoves dust and pebbles (floor layer, small)
- Ring dust: 16 puffs placed evenly around the ellipse at radius 40, each travels out with the ring to rx 200 over 420 ms (Quad.easeOut), size 26 to 44 (grows x1.3), height ratio 0.8, alpha 0.5 to 0, colours Dust 60 percent, Sand 25, Warm Brown 15. This is the visible "ring pushes dust" beat: the dust trails slightly behind the ring edge.
- Pebbles: 14 tiny 3 to 5 px Warm Brown or Dust squares that were "lying" at radius 30 to 160 from the impact at a random angle. At the moment the ring passes their radius (ring radius equals their radius) each hops: vz 120 to 260 px/s, then lands, drifting outward 60 to 140 px/s, gravity 1000, life 400. Result: small stuff visibly jumps as the ring passes, nothing is pre-drawn.
- Burst dust: 12 big puffs 40 to 72 px, spawn x0 +/-70, life 650 to 850, rise 24, alpha 0.55 to 0.

### 3.7 Slide trail (while Zed skids)
Reads Zed's real x each frame, so it follows whatever the slide physics does. Active while slide speed is above 120 px/s.
- Skid groove: a 3 px Dark Brown #2E1F16 line at alpha 0.35 from x0 to Zed's current x, 2 px below his feet y, 5 px of jitter free. Stays 400 ms after he stops, then fades over 300 ms.
- Slide dust: 1 puff per 45 ms behind him (opposite slamDir), size 24 to 40, height ratio 0.8, rise 14, alpha 0.4 to 0, life 400 to 550, Dust and Sand. Maximum 10 puffs over the slide.

### 3.8 Edge vignette (screen space, optional but recommended)
Four screen-edge bands drawn as 6 nested rectangular frames (each 14 px wide, 84 px of total depth), colour Dark Brown #2E1F16, alpha from 0.30 (outermost) stepping to 0.05 (innermost). The whole thing multiplies by an envelope: 0 to 1 in 30 ms, then 1 to 0 over 370 ms (Quad.easeOut, ends at 400). Peak effective outer alpha is 0.30. It is a darkening, not a bright flash, so it does not count toward the flash-rate limit. It lives in screen space (scrollFactor 0) on the main camera only, below the HUD, so it never dims the HUD (see open question 2).

### 3.9 Camera punch-in (optional)
Zoom 1.0 to 1.03 in 60 ms (Quad.easeOut), then back to 1.0 over 260 ms (Sine.easeInOut). Aim at Zed's x0 y0 (the camera should pan its view centre a maximum of 40 px toward him, which keeps him inside the frame). Gives "the world hits you" without a long rumble.

## 4. Slam screen shake

Phaser camera.shake is constant intensity per call and ignores a new shake while one runs unless `force` is true, so run each keyframe with force true. Keyframes `[atMs, durationMs, intensity]`:
`[0,50,0.015] [50,70,0.011] [120,80,0.0075] [200,90,0.0045] [290,90,0.0022]`
- Peak 0.015 (about 19 px) is below the Mega Stomp's 0.018 and above the old 0.012. Total length 380 ms, versus 890 ms for the Mega Stomp. It replaces the scene's current 320 ms at 0.012 (the scene must not run both).
- How it differs in feel: the Mega Stomp is a loud thing that arrives and then rolls away (about 0.9 s, 9 steps, with a rumble leading up to it). This is a compressed jolt: a 50 ms hit at 0.015 with the biggest drop first (0.015 to 0.011 to 0.0075 in 120 ms), then a short ringing tail, finished before Zed has even stopped sliding. About 3 frames at peak, so it reads as one hard crack, not a quake. Total shake energy (intensity x duration) is about a fifth of the Mega Stomp's.
- Screen Shake Light: all intensities x0.5 (peak 0.0075), same timings, zoom delta halved (1.015). Off: no shake keyframes and no zoom.
- Reduced Motion: treated as shake Off (no shake, no zoom), pebbles, chunks, sparks, ring dust, burst dust and slide dust halved. The ring, cracks, dent, vignette (at 0.6 alpha) and skid groove are kept, so the slam still reads clearly and nothing is lost for the player. Cracks appear at full length with no growth animation in this mode.
- Hit Flash Low: skip the cream core flash and replace it with the same ellipse in Sand #E8C27A at alpha 0.3 over 160 ms; ring colours Cream to Sand #E8C27A, alpha 0.6, width 3; sparks start at Gold (no White stop); vignette x0.6; glow lines alpha x0.5. Zoom and shake are not flashes and stay on their own settings.
- The scene keeps Dugan's 110 ms hit-stop on Dugan only. The FX run on real time and are not frozen by it. The HUD should stay on its own camera so it does not shake or zoom.

## 5. Budget
Peak live pieces: chunks 14, sparks 10, burst dust 12, ring dust 16, pebbles 14, slide dust 10, cracks 10 (4 + 2 + 1 + 3 branches), ripples 2, ring 1, core 1, dent 1, groove 1: about 92 at the busiest moment (around 150 ms), 100 hard cap (drop slide dust, then pebbles first). All primitives, 2 Graphics (floor 440, top 5800) plus one screen-space Graphics for the vignette.

## 6. Data

```json
{
  "wallSlam": {
    "event": "PLAYER_SLAMMED",
    "anchor": { "x": "event.x", "y": "event.y", "dir": "event.slamDir", "heightRatio": 0.3, "clampYToLane": [445, 695] },
    "layers": { "floorDepth": 440, "topDepth": 5800, "vignetteDepth": "below HUD, main camera, scrollFactor 0", "particleCap": 100 },
    "dent": { "fill": "#2E1F16", "alpha": 0.55, "rx": [70, 110], "growMs": 90, "growEase": "Quad.easeOut", "rim": { "color": "#6B4423", "widthPx": 3, "alpha": 0.6 }, "holdMs": 350, "fadeToMs": 900, "fadeEase": "Quad.easeIn" },
    "core": { "color": "#FFF6D6", "rx": [40, 120], "alpha": [0.7, 0], "lifeMs": 70, "ease": "Quad.easeOut" },
    "ring": { "colors": ["#FFF6D6", "#F58A2A"], "switchAtLife": 0.35, "rx": [20, 210], "widthPx": [6, 2], "alpha": [1, 0], "lifeMs": 240, "ease": "Cubic.easeOut" },
    "ripples": [
      { "startMs": 70, "rx": [30, 300], "lifeMs": 380, "color": "#C9B79A", "widthPx": 2, "alpha": [0.35, 0], "ease": "Cubic.easeOut" },
      { "startMs": 120, "rx": [30, 380], "lifeMs": 460, "color": "#C9B79A", "widthPx": 2, "alpha": [0.35, 0], "ease": "Cubic.easeOut" }
    ],
    "cracks": {
      "core": { "color": "#2E1F16", "widthPx": 3, "alpha": 0.7 },
      "glow": { "color": "#F58A2A", "widthPx": 1, "alpha": 0.8, "fadeMs": 250 },
      "segmentPx": [40, 60], "jitterPx": [5, 3], "holdMs": 700, "fadeMs": 500,
      "short": { "count": 4, "lengthPx": [90, 140], "angleJitterRad": 0.25 },
      "long": { "count": 2, "anglesDeg": [0, 180], "angleJitterRad": 0.2, "lengthPx": [220, 300] },
      "slide": { "count": 1, "alongSlamDir": true, "lengthPx": 360, "jitterPx": [3, 8], "growMs": 140, "growEase": "Expo.easeOut", "yOffsetPx": 2, "tipSparks": { "everyMs": 35, "count": 4 } },
      "branches": { "count": 3, "atPercent": [40, 55], "angleDeg": 35, "lengthScale": 0.4 },
      "startLengthScale": 0.15, "clampToArenaX": true
    },
    "chunks": { "count": 14, "sizePx": [6, 12], "triangleShare": 0.4, "spawnSpreadPx": [24, 8], "speed": [260, 620], "coneDegUp": [60, 120], "gravity": 1400, "restitution": 0.3, "bounceMax": 1, "lifeMs": [600, 900], "slideBiasCount": 4, "slideBias": 0.3, "colors": [["#6B4423", 0.4], ["#2E1F16", 0.25], ["#C9B79A", 0.2], ["#7C8A96", 0.15]] },
    "sparks": { "count": 6, "lengthPx": [14, 20], "thicknessPx": 3, "trailSamples": 3, "coneDeg": 30, "upBiasDeg": 20, "speed": [420, 760], "gravity": 900, "lifeMs": [220, 320], "ramp": [[0, "#FFFFFF"], [0.2, "#FFD24A"], [0.5, "#F58A2A"], [0.8, "#9C5A2E"]], "scrape": { "everyMs": 90, "max": 3, "minSlideSpeed": 200, "sizeScale": 0.6 } },
    "ringDust": { "count": 16, "startRx": 40, "endRx": 200, "travelMs": 420, "ease": "Quad.easeOut", "sizePx": [26, 44], "grow": 1.3, "heightRatio": 0.8, "alpha": [0.5, 0], "colors": [["#C9B79A", 0.6], ["#E8C27A", 0.25], ["#6B4423", 0.15]] },
    "pebbles": { "count": 14, "sizePx": [3, 5], "radiusPx": [30, 160], "hopVz": [120, 260], "driftSpeed": [60, 140], "gravity": 1000, "lifeMs": 400, "colors": ["#6B4423", "#C9B79A"], "triggeredByRingRadius": true },
    "burstDust": { "count": 12, "sizePx": [40, 72], "spreadPx": 70, "lifeMs": [650, 850], "risePx": 24, "alpha": [0.55, 0] },
    "slide": {
      "activeAboveSpeed": 120,
      "groove": { "color": "#2E1F16", "widthPx": 3, "alpha": 0.35, "yOffsetPx": 2, "lingerMs": 400, "fadeMs": 300 },
      "dust": { "everyMs": 45, "max": 10, "sizePx": [24, 40], "heightRatio": 0.8, "risePx": 14, "alpha": [0.4, 0], "lifeMs": [400, 550] }
    },
    "vignette": { "color": "#2E1F16", "frames": 6, "frameWidthPx": 14, "alphaOuterToInner": [0.30, 0.05], "inMs": 30, "outMs": 370, "ease": "Quad.easeOut" },
    "zoom": { "to": 1.03, "inMs": 60, "inEase": "Quad.easeOut", "outMs": 260, "outEase": "Sine.easeInOut", "maxPanPx": 40 },
    "shake": [[0, 50, 0.015], [50, 70, 0.011], [120, 80, 0.0075], [200, 90, 0.0045], [290, 90, 0.0022]],
    "lightScale": 0.5,
    "reduce": {
      "shakeOffOrReducedMotion": { "cameraShake": "none", "zoom": "none", "particleCountScale": 0.5, "scaledGroups": ["chunks", "sparks", "ringDust", "pebbles", "burstDust", "slideDust"], "crackGrow": "instant", "vignetteAlphaScale": 0.6 },
      "light": { "shakeScale": 0.5, "zoomTo": 1.015 },
      "hitFlashLow": { "core": { "color": "#E8C27A", "alpha": 0.3, "lifeMs": 160 }, "ring": { "colors": ["#FFF6D6", "#E8C27A"], "alpha": 0.6, "widthPx": 3 }, "sparkRampSkipWhite": true, "vignetteAlphaScale": 0.6, "glowAlphaScale": 0.5 }
    },
    "hitStopMs": { "attacker": 110, "target": 0, "note": "unchanged, owned by Dugan" }
  }
}
```

## 7. Open questions and playtest notes
1. Zed's slide distance is not given (640 px/s decaying fast). The slide crack is a fixed 360 px so it should lead him; if he slides much farther, or the wall is closer than 360 px, make it min(360, distance to arena edge) (the `clampToArenaX` flag handles the second case).
2. HUD depth and camera: the vignette and zoom assume the HUD is on its own camera or above depth 5800. If the HUD shares the main camera, the zoom will scale it (cut the zoom) and the vignette must be drawn below it. Needs a check against the scene.
3. Camera follow: a zoom while the camera is scrolling may fight the follow logic. If it looks bad, cut the zoom first; it is optional.
4. Peak 0.015 (about 19 px) is a guess; try 0.012 to 0.017. At the same time make sure the 380 ms tail does not look like the old 320 ms constant shake.
5. Chunks on the top layer can briefly cross Zed's body (14 px or smaller, under 900 ms). If they hide his hurt pose, move the chunks to depth just above Zed's y instead.
6. Damage scaling: one fixed intensity. If Dugan's slam damage varies, scale shake and ring radius by damage / reference (not proposed here since there is only one damage value).
7. The vignette is dark brown on purpose (not Telegraph Red #FF3B30, not white). If the owner wants Zed's hurt to read warmer, use Ember at alpha 0.15, but that is a flash risk and needs sign-off.
8. Audio is not covered: a deep thud with a short crack layer on t = 0 and a gravel scatter at 150 ms would match this timing.
9. Same event is used for the charge-catch grab, so there is only one version; if the catch should be lighter, use Light-scale values as the data (a `intensityScale` multiplier on everything).
