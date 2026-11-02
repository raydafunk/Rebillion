# Dugan Mega Stomp (art and feedback spec)

Status: PROPOSED starting values for playtest. Owner: art-direction-agent. Extends the Ground Stomp of "Brick" Dugan (Level 1 mini-boss). Gameplay numbers (700 ms wind-up, slam at +150 ms, 850 px/s to 760 px per side, lane-wide, airborne at 30 px or more is safe, parry negates, 14 damage, 360 knockback) are fixed inputs and are not changed here. Flat vector, all shapes drawn in code, no new image files. Times are ms from the start of the wind-up. Slam = 850.

## 1. Intent

The player should feel a 192 px steel man lift off, drop, and break the street open, and should read one thing: a bright wall of broken ground is rolling toward Zed along the whole lane, and the answer is to leave the floor as it touches him. Cold Rust grey gathers (wind-up), warm broken pavement answers (wave), so "Rust power" and "the city taking the hit" stay in the project's two colour families. Two thin cold ghost pulses go out first, then the real hot one, on an even 350 ms beat, so the player learns the speed and shape of the wave before it counts. The wave is drawn as a lane-wide wall, not a circle, because its hit rule ignores depth: the shape tells the truth about the hitbox, so side-stepping in depth visibly cannot work.

## 2. Timeline

Distance d from Dugan's feet. The front reaches a target at 850 + 1.18 x d ms (d 150 = 1026, d 300 = 1203, d 500 = 1438, d 760 = 1744).

| Time (ms) | Player sees | Camera |
|---|---|---|
| 0 | Wind-up starts. Dark flattened ellipse fades in under Dugan (rx 70 growing to 230, ry = 0.3 rx), cold Steel rim. Two thin red dashed "reach gates" fade in at x0 +/- 760, lane tall, so Zed knows how far it reaches | Soft rumble 0.0006 |
| 150 | Ghost pulse A: thin cold slate line, lane tall, travels out from Dugan to 250 px at 850 px/s (294 ms), same shape as the real wave, harmless, alpha 0.5 | rumble |
| 350 | Disc about half grown, Dugan crouched | rumble rises to 0.0012 |
| 500 | Ghost pulse B, identical to A. Beat is 150, 500, 850 (350 ms apart, 2.9 Hz, under the 3 per second limit; thin low-contrast lines, not flashes) | rumble 0.0012 |
| 550 to 700 | Disc rim shifts Steel to Visor Cyan and thickens 3 to 5 px: "now" cue. Disc stops growing | rumble |
| 700 | Leap starts (clip frames of the rise). Disc holds, Dugan's shadow shrinks to 50 percent. Wind-up ends (700 ms, well over the 300 ms minimum) | 0.0020 for 150 ms |
| 850 | SLAM. Attacker hit-stop 90 ms (target 0). One cream flattened core flash at his feet (90 ms), hot ring bursts out, 18 chunks and 14 dust puffs, 6 big radial cracks. The two wave fronts spawn | Peak shake (see 4) |
| 850 to 1744 | Two fronts travel out at 850 px/s. Behind each: Ember band, dust trail, cracks lighting and fading. Ahead: dirt pops warn of the front. Disc turns scorch brown and fades 850 to 1350 | Decaying shake, ends 1740 |
| 1544 to 1744 | Fronts fade (alpha ramp from d 560 to 760). Reach gates fade with them | last tail |
| 1744 to 2450 | Last cracks and dust fade. Nothing left on screen | none |

## 3. Look

### 3.1 Telegraph (0 to 850)
- Disc: flattened ellipse at feet, rx 70 to 230 over 0 to 700 (Quad.easeOut), ry = 0.3 rx. Fill Rust Ink #14181C, alpha 0 to 0.45 (Sine.easeIn). Rim stroke 3 px Steel #7C8A96 alpha 0.8, then Visor Cyan #4FB3D9 and 5 px from 550 to 700. Cold and Rust-coded, no red fill, so it is not the charge strip (#D23A2E translucent strip) and not the parry ring (orange, closing, over the head).
- Ghost pulses: lane-tall vertical line (y 440 to 700), 4 px, Steel #7C8A96 alpha 0.5, no teeth, no glow.
- Reach gates: dashed vertical lines (dash 18, gap 14), 3 px, Telegraph Red #FF3B30 (reserved warning use is correct here), alpha 0 to 0.4 over 300 ms, thin so they do not read as a filled floor strip.
- Close-range rule (for the designer): anyone within about 100 px is hit within 120 ms of the slam and cannot react to the front. They must jump on the leap cue (cyan rim, Dugan leaving the ground). See open questions.

### 3.2 Wave front, per side (850 to 1744)
Drawn in screen space, lane tall (y 440 to 700, 20 px margin each side), travelling away from Dugan. Layers from the leading edge backward:
1. Leading line, 6 px wide, Spark Cream #FFF6D6, alpha 1. This is the single truth for the jump: feet must be 30 px or more off the floor as this line crosses Zed.
2. Crest teeth: 12 triangles along the line, one per 22 px of y, base 14 px, height 34 px (taller than the 30 px threshold, so "clear the teeth" equals "be safe"), pointing up and leaning 8 px toward travel. Fill Sand #E8C27A, 2 px outline #2E1F16. Height stays 34 until the fade starts.
3. Ember band: 26 px behind the line, Ember #F58A2A, alpha 0.8 at the line to 0.3 at the back (linear).
4. Dust trail: 80 px band behind the Ember band, Dust #C9B79A alpha 0.35 to 0.
5. Warning dirt pops ahead: 1 small 2x18 px Warm Brown #6B4423 tick every 30 px, from 30 to 120 px ahead of the front (about 100 ms of look-ahead), alpha 0.5, fading as the front reaches them.
Alpha: full to d 560, then linear to 0 at d 760. Only the leading line is the hit test; the band and trail are cosmetic.
Hot orange justification: Ember #F58A2A is already pending in hit-feedback-spec 7.5 and is the "broken ground glows" colour, not an enemy-body colour. The wave avoids Telegraph Red, Enemy Critical and Finisher Orange #FFA41C (parry).

### 3.3 Cracks, dust, debris
- Cracks: a 3-segment jagged polyline spawned each time the front passes a 40 px station (19 per side), random y in 460 to 680, length 30 to 60 px, flattened to the floor. Core line 3 px #2E1F16 alpha 0.6 (hold 300 ms then fade 400, 700 total). Inner glow line 1 px Ember #F58A2A alpha 0.9 to 0 over 400 ms. At the slam: 6 big radial cracks, 120 to 200 px long, same look, life 900 ms.
- Dust: 1 puff per 38 px station per side (20 per side), ellipse 24 to 48 px wide, h = 0.8 w, random y in lane, rises 30 px, alpha 0.5 to 0, life 500 to 700, colours Dust #C9B79A 60 percent, Sand #E8C27A 25 percent, Warm Brown #6B4423 15 percent. Slam burst: 14 puffs, 40 to 80 px, life 700 to 900.
- Debris: slam 18 chunks (rects and triangles 6 to 14 px), speed 300 to 700, cone 55 to 125 degrees up, gravity 1400, one floor bounce at restitution 0.35, life 700 to 1000, colours Warm Brown 40 percent, Dark Brown #2E1F16 25 percent, Dust 20 percent, Steel #7C8A96 15 percent. Along the front: 1 chunk per 60 px per side (12 per side), thrown up (vy -380 to -520), life 450. Debris layer follows hit-feedback-spec 7.3.3 (layer B, depth 5800); floor FX (disc, cracks, band) sit below characters and above ground shadows.
- Slam core: Spark Cream flattened ellipse, rx 80 to 200, 90 ms, alpha 0.8, Quad.easeOut. Slam ring: flattened ellipse stroke 8 px, Spark Cream to Ember, rx 30 to 260 over 260 ms, Cubic.easeOut, alpha 1 to 0.
- Optional reward: when Zed is airborne as the front passes under him, 6 small dust puffs at his feet. No flash.

## 4. Mega screen shake

Phaser applies constant intensity per call and ignores a new shake while one runs unless `force` is true, so call each keyframe with force true. Keyframes `[atMs, durationMs, intensity]`:
`[0,350,0.0006] [350,350,0.0012] [700,150,0.0020] [850,90,0.018] [940,110,0.013] [1050,140,0.009] [1190,170,0.005] [1360,200,0.0025] [1560,180,0.0012]`
- Slam shake runs 850 to 1740 (0.89 s, under the 1.4 s cap), with decay of about 0.7x per step. Peak 0.018 is about 23 px, 4x the biggest existing shake (0.0045). Justified because it is the loudest event in Level 1, happens once per stomp, and the peak lasts only 90 ms; by 1050 it is already at 0.009, so the front stays readable while the player decides. The wave reads the same with the shake off because the front is positioned in world space.
- Screen Shake Light: every intensity x0.5 (peak 0.009), same timings. Off: no keyframes.
- Reduced Motion: treated as shake Off (no camera calls), dust and debris counts halved, ghost pulses and pops kept. The wave, cracks and teeth are unchanged so the move stays fully readable.
- Hit Flash Low: skip the cream core flash (replace with the same ellipse at alpha 0.35 over 200 ms, Sand #E8C27A); leading line colour Spark Cream becomes Sand #E8C27A; slam ring alpha 0.5 and width 4; Ember glow alpha x0.5; ghost pulses alpha 0.35. Persistent lines are not flashes, so the jump cue stays at full contrast.
- Recommend the HUD stays on its own camera so it does not shake.

## 5. Data

```json
{
  "megaStomp": {
    "telegraph": {
      "durationMs": 700, "slamAtMs": 850,
      "disc": { "shape": "ellipse", "heightRatio": 0.3, "rx": [70, 230], "rxEase": "Quad.easeOut", "fill": "#14181C", "alpha": [0, 0.45], "alphaEase": "Sine.easeIn", "rim": { "colors": ["#7C8A96", "#4FB3D9"], "switchFromMs": 550, "switchToMs": 700, "widthPx": [3, 5], "alpha": 0.8 }, "afterSlam": { "fill": "#2E1F16", "alpha": [0.5, 0], "fadeMs": [850, 1350] } },
      "ghostPulses": { "startsMs": [150, 500], "speedPxPerSec": 850, "reachPx": 250, "colors": ["#7C8A96"], "widthPx": 4, "alpha": 0.5, "laneY": [440, 700] },
      "reachGates": { "xOffsetPx": 760, "dash": [18, 14], "widthPx": 3, "color": "#FF3B30", "alpha": [0, 0.4], "fadeInMs": 300, "fadeOutMs": [1544, 1744] },
      "leapShadowScale": 0.5
    },
    "wave": {
      "speedPxPerSec": 850, "reachPx": 760, "laneY": [440, 700], "spawnAtMs": 850,
      "front": { "color": "#FFF6D6", "widthPx": 6, "alpha": 1 },
      "teeth": { "count": 12, "spacingPx": 22, "basePx": 14, "heightPx": 34, "leanPx": 8, "fill": "#E8C27A", "outline": "#2E1F16", "outlinePx": 2 },
      "band": { "color": "#F58A2A", "widthPx": 26, "alpha": [0.8, 0.3] },
      "trail": {
        "dust": { "color": "#C9B79A", "widthPx": 80, "alpha": [0.35, 0] },
        "cracks": { "everyPx": 40, "lengthPx": [30, 60], "segments": 3, "core": { "color": "#2E1F16", "widthPx": 3, "alpha": 0.6, "holdMs": 300, "fadeMs": 400 }, "glow": { "color": "#F58A2A", "widthPx": 1, "alpha": 0.9, "fadeMs": 400 }, "radial": { "count": 6, "lengthPx": [120, 200], "lifeMs": 900 } },
        "warningPops": { "everyPx": 30, "aheadPx": [30, 120], "sizePx": [2, 18], "color": "#6B4423", "alpha": 0.5 }
      },
      "fade": { "fromPx": 560, "toPx": 760 },
      "hitTest": "leading line only; feet lift of 30 px or more is safe",
      "slamCore": { "color": "#FFF6D6", "rx": [80, 200], "heightRatio": 0.3, "alpha": 0.8, "lifeMs": 90, "ease": "Quad.easeOut" },
      "slamRing": { "colors": ["#FFF6D6", "#F58A2A"], "rx": [30, 260], "heightRatio": 0.3, "widthPx": 8, "lifeMs": 260, "ease": "Cubic.easeOut" },
      "passUnder": { "puffs": 6, "color": "#C9B79A", "lifeMs": 400 }
    },
    "debris": {
      "slam": { "count": 18, "sizePx": [6, 14], "triangleShare": 0.4, "speed": [300, 700], "coneDegUp": [55, 125], "gravity": 1400, "bounce": { "restitution": 0.35, "max": 1 }, "lifeMs": [700, 1000], "colors": [["#6B4423", 0.4], ["#2E1F16", 0.25], ["#C9B79A", 0.2], ["#7C8A96", 0.15]] },
      "front": { "everyPx": 60, "vy": [-380, -520], "sizePx": [6, 10], "gravity": 1400, "lifeMs": 450 },
      "layerDepth": 5800
    },
    "dust": {
      "slamBurst": { "count": 14, "sizePx": [40, 80], "lifeMs": [700, 900] },
      "trail": { "everyPx": 38, "sizePx": [24, 48], "heightRatio": 0.8, "riseYPx": 30, "alpha": [0.5, 0], "lifeMs": [500, 700] },
      "colors": [["#C9B79A", 0.6], ["#E8C27A", 0.25], ["#6B4423", 0.15]]
    },
    "shake": [[0, 350, 0.0006], [350, 350, 0.0012], [700, 150, 0.0020], [850, 90, 0.018], [940, 110, 0.013], [1050, 140, 0.009], [1190, 170, 0.005], [1360, 200, 0.0025], [1560, 180, 0.0012]],
    "lightScale": 0.5,
    "reduce": {
      "shakeOffOrReducedMotion": { "cameraShake": "none", "debrisAndDustCountScale": 0.5, "keeps": ["ghostPulses", "wave", "cracks", "teeth", "warningPops"] },
      "hitFlashLow": { "slamCore": { "color": "#E8C27A", "alpha": 0.35, "lifeMs": 200 }, "frontColor": "#E8C27A", "slamRing": { "alpha": 0.5, "widthPx": 4 }, "glowAlphaScale": 0.5, "ghostPulseAlpha": 0.35 }
    },
    "hitStopMs": { "attacker": 90, "target": 0 }
  }
}
```

## 6. Open questions and playtest notes
1. Zed's jump airtime and take-off delay are not given here. The 30 px window must stay above 30 px for long enough to cover the front passing his hurtbox plus input error; if airtime is under about 450 ms, jump timing will feel unforgiving. Needs a number from Player Combos.
2. Close range: a player within about 100 px is hit within 120 ms of the slam and cannot react to the front. Options (owner call, not decided): spawn the fronts at his body edge (about +/-70 px), or accept it as "you stood too close". I did not change the gameplay numbers.
3. Reach gates (red dashed lines) are my addition and use Telegraph Red; cut them if the lane gets too busy. Camera view is 1280 px, so the far gate may be off-screen.
4. Parry: the spec says parry negates, but not whether the existing orange closing ring shows. I left it off so the jump reads as the answer; a player who parries by instinct has no cue. Confirm.
5. Peak shake 0.018 (about 23 px) is a guess; try 0.012 to 0.02. Phaser shake is random per frame, so test it on a real display.
6. Cost: about 140 simple shapes alive at peak (cracks 44, dust 54, debris 42), above the 60 cap in hit-feedback-spec 7.3 which covers hit particles only. Use a separate pool.
7. Hit-stop 90 ms freezes Dugan only; the wave keeps running in real time. Combined with the 80 ms Zed hurt stop the cap (150) still holds.
8. Ember #F58A2A and Sand #E8C27A as Rust-attack colours need owner approval (Ember is already pending in hit-feedback-spec 7.5). The wave band is hot-warm on purpose; if the owner wants it colder, swap the band to Light Steel #BFC8CF.
9. The wave front is lane tall (y 440 to 700) rather than a flattened ellipse, deliberately, so it matches the depth-ignoring hitbox. Floor discs, rings and cracks still use the 0.3 ratio.
