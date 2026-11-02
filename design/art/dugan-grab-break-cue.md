# Dugan Grab Break prompt (art and feedback spec)

Status: PROPOSED starting values for playtest. Owner: art-direction-agent. Covers the bubble shown above Zed while "Brick" Dugan holds him (Grab and Wall Slam, and the running-grab catch). Feedback only: the break rule (6 taps of Light J/Z, Heavy K/X or jump Space fill the meter, `breakTaps` = 6, Dugan stunned 0.8 s), `holdMs` = 900, 22 damage and the Wall Slam impact are fixed inputs and are not changed here. Primitives only (Phaser Graphics plus two pooled Text objects), no new assets. Pixel-art flavour: chunky outlines, integer pixel positions, flat fills, no gradients, no blur, no glow. Times are ms from the start of the hold (`zed.grab.timer` = 0). Slam = `holdMs`.

## 1. Intent

The player has under one second and must read three facts without reading words: (1) press THIS button, (2) press it a lot, (3) there is a clock. One round bubble does it:

- A big orange key cap in the middle shows the button and visibly "presses" at a fast mash rhythm (the verb).
- An outer ring is the clock. It DRAINS to empty at exactly the slam frame.
- Six pips under the key cap are the progress. They FILL, one per tap.

How the two meters never get confused: they are different shapes, different colours and move in opposite directions. The outer ring is a thick cream band that shrinks (goes away = danger coming, turns red at the end). The pips are green blocks that grow (coming in = good). Rule for the player: "fill the green before the ring runs out". Neither meter uses the other's colour, and each is readable in grey-scale by shape alone (a shrinking circle against a row of boxes filling up). The key cap carries the orange accent so the eye lands on the verb first, then the ring, then the pips.

The cue is driven by the real simulation, not tweens: ring = `1 - timer / holdMs` each frame (so it is empty on the very frame the slam fires, whatever `holdMs` is), pips = `zed.grab.progress * breakTaps`.

## 2. Anatomy (bubble local coordinates, centre = 0,0, +y down)

| Part | Spec |
|---|---|
| Outline disc | radius 55, Dark Brown #2E1F16 (this is the 3 px outer outline) |
| Timer track | the dark band from radius 46 to 52 (shows through where the ring has drained) |
| Timer ring | arc stroke 6 px centred at radius 49, starts at 12 o'clock, drains from its end (see 3.2), butt caps, colour by state |
| Separator | 3 px Dark Brown between ring and body (radius 43 to 46) |
| Body | cream disc radius 43, Spark Cream #FFF6D6 |
| Key cap | 36 x 36 at (0, -8), Orange #F58A2A fill, 3 px Dark Brown outline, 4 px darker "side" under it #B85F14 (the cap depth), label Dark Brown (contrast about 6:1 on the orange) |
| Pips | 6 squares, 8 x 8 including a 2 px Dark Brown outline, gap 2, row centred at (0, +24), total width 58 (fits the body chord, 65 px at that height) |
| Tail | triangle, base 18 px on the ring edge, length 16 px (min 10, max 22), Dark Brown 3 px outline, cream fill, points at Zed's head. Drawn under the disc so the disc hides the tail base |
| Hint pill (first time only) | 64 x 24 pill at (0, -69), Orange fill, 3 px Dark Brown outline, text "MASH!" |

Overall footprint: 110 px bubble (+16 px tail), small against the 192 px Dugan and 1280 x 720 view, big enough to read in a glance.

### 2.1 Key label (variable, never hard-coded)
The label text is `keyLabel(KEY_MAP.light[0])` from `src/player/input.js`, so a rebind changes it. Layout function: strip `Key` and `Digit`, `Space` becomes `SPACE`, `ArrowUp/Down/Left/Right` become the glyph words `UP DOWN LEFT RIGHT`, `ShiftLeft` becomes `SHIFT`, everything else upper-cased. The cap grows to fit: cap width = clamp(textWidth + 18, 36, 64); the height stays 36. Font size by length: 1 char 28 px, 2 to 3 chars 20 px, 4 to 5 chars 16 px. Font: the game's button face, `FONTS.button` (Anton, fallback Impact) from `src/config/assetKeys.js`; Anton at 28 px reads as a solid block letter at this size. Re-read the label every time the cue is shown (a bind can change between grabs), not once at boot.

Which button is shown: the Light attack (default J). The cue accepts any attack or jump, but showing three keys would not read in a glance. A small `Z` or `SPACE` secondary is NOT shown (see open question 3). Heavy is not shown even though it works, because the one best-known verb is the clearest.

### 2.2 Gamepad variant
If a pad is the last-used input device, the cap becomes a circle (radius 19, same colours) labelled with the face button for `PAD_MAP.light` (index 2): Xbox-style and unknown pads show `X`; PlayStation-style pads (id contains DualShock, DualSense or Wireless Controller) draw a square outline primitive (14 x 14, 3 px) instead of text; Nintendo-style pads show `Y` (standard mapping index 2 is the left face button, which is labelled Y there). The label comes from `PAD_MAP.light[0]` so a pad rebind follows. The last-used device is whichever of keyboard or pad produced the last input.

## 3. States and timing

Let `t = timer / holdMs` (0..1), `timeLeft = holdMs - timer`, `urgencyMs` = 250.

### 3.1 Pop-in (0 to 80 ms)
First draw is on the same frame the state becomes `held` (well inside the 60 ms requirement): alpha 1 immediately, scale 0.4, then to 1.0 in 80 ms with Back.easeOut (overshoot 1.7, peaks about 1.1 near 55 ms). The ring is already correct and full on frame 1 because it reads `timer`. Reduced Motion: scale 1 from the first frame.

### 3.2 Timer ring (the clock)
Remaining fraction `r = 1 - t`, drawn as an arc from 12 o'clock sweeping clockwise for `r` of a full turn, with the drained part removed from the END of the arc, i.e. the visible arc's start stays at 12 o'clock and its end retreats back toward it. It is empty (nothing drawn, track only) on the slam frame.

Colour by remaining time (never the only cue, the shrinking length is the signal):
- `timeLeft` above 450 ms: Cream #FFF6D6.
- 450 ms down to the urgency threshold: Mustard #E3A92B.
- Last 250 ms (urgency): Telegraph Red #FF3B30 (reserved for enemy attack warnings; this is exactly that: the slam is coming), ring width 6 to 8 px (inside radius 45 to 53, the track is 1 px thinner), and a thin 2 px Telegraph Red outer ring at radius 57, alpha 0.8 (shape cue: the bubble itself "swells a danger line").
Colour changes are hard steps (no flash).

### 3.3 Key cap rhythm (the verb)
Needs 6 taps inside 900 ms, about 7 per second, so the cue shows an 8 Hz beat (125 ms period): cap goes down 3 px (side shrinks 4 px to 1 px) for 55 ms, back up in 70 ms (Back.easeOut). Real presses (attack or jump) always play the same down and up (50 ms down, 70 ms up) immediately, ignoring the beat, so response feels instant. The 8 Hz metronome only runs while the player has not pressed for 200 ms (a stalled player is exactly who needs the hint); a real press restarts it 200 ms later. Urgency state: metronome period 100 ms (10 Hz), and the whole bubble pulses scale 1.00 to 1.06 at 10 Hz.
- Every real press: the bubble also gets a micro bounce, scale 1.05 then 1.0 over 90 ms (Back.easeOut). Presses can come about 10 per second, so there is no white or cream brightness flash on a press (see 5, flash rate limit): only motion.
- Reduced Motion: cap and bubble static (no press animation, no pulse, no bounce). The cap shows its label with the side at 3 px.

### 3.4 Pips (the progress)
`filled = floor(zed.grab.progress * breakTaps + 0.0001)`; if progress is between steps the next pip shows a partial fill (bottom up, height = fraction, 2 px minimum once above 0.1). Pips fill left to right.
- Empty pip: Dust #C9B79A fill, 2 px Dark Brown outline.
- Filled pip: Health Green #4C9A55 fill with a 2 px lighter top band #7BC47F.
- Next pip (the one to fill): outline Orange #F58A2A 2 px instead of Dark Brown, always on (static shape cue, also in Reduced Motion).
- On fill: the new pip starts bright (#A8E6AB) at scale 1.7 and settles to green at scale 1.0 over 100 ms (Back.easeOut). A brightness settle, not a flash.
- About to break (`filled >= breakTaps - 1`, the 5th pip filled): all filled pips use the brighter #7BC47F fill with a Spark Cream top band, and the last empty pip pulses its orange outline 2 to 3 px at 4 Hz (static orange outline in Reduced Motion). Pop on the 6th is the break (3.5).
- If the meter ever drains (gameplay may decay it), pips drain right to left with no animation. Spec assumes no decay (open question 4).

### 3.5 Break free (success)
Trigger: the break state fires (6th tap). Zed drops (gameplay).
| Time | Spec |
|---|---|
| 0 | The 6th pip fills for one frame, then the bubble bursts: body and outline scale 1.0 to 1.25 in 70 ms (Quad.easeOut) with alpha 1 to 0; ring and pips vanish |
| 0 | 8 ring shards: 14 to 18 px long, 5 px thick strokes in Cream #FFF6D6 (4 of them Mustard #E3A92B), start at radius 52, fly outward to radius 96 over 260 ms (Cubic.easeOut), alpha 1 to 0. Pure shape, 8 primitives |
| 0 | Soft burst: Spark Cream disc radius 30 to 70, alpha 0.6 to 0 over 70 ms (Quad.easeOut). One burst, not repeated |
| 0 to 480 | Word "FREE!" in `FONTS.display` (Permanent Marker, fallback Impact) 34 px, Cream fill with 5 px Dark Brown stroke, no rotation. Pops 0.5 to 1.15 scale in 90 ms (Back.easeOut), 1.15 to 1.0 by 160 ms, then rises 18 px and fades to 0 from 260 to 480 ms (Quad.easeIn). World-anchored at the bubble's last position (it does not follow Zed, he has dropped) |
- Reduced Motion: no burst scale, no shards. Bubble fades 1 to 0 in 120 ms; "FREE!" shown static (scale 1, no rise) for 400 ms then fades 80 ms.
- Hit Flash Low: the soft burst disc is Sand #E8C27A, alpha 0.3, 160 ms (no cream core).

### 3.6 Slam (failed)
Trigger: `PLAYER_SLAMMED` (slam frame, `timer >= holdMs`). The ring is empty on this frame. The cue must not fight the Wall Slam impact spec: it is on the top layer, small, and gone in 450 ms.
| Time | Spec |
|---|---|
| 0 | Ring empty, red. Three jagged crack lines across the body (Dark Brown 3 px, 40 to 60 px, jitter 4 px, from the key cap down through the pips) appear instantly. The bubble keeps shaking with the world camera (it is on the world camera, no extra shake) |
| 0 to 50 | Crack hold (about 3 frames) |
| 50 | The bubble splits into 8 pie wedges (the disc cut into 45 degree sectors, each drawn as a polygon of the arc, cream fill, 3 px Dark Brown outline, plus the tail as a 9th piece) that are blown away along `slamDir`: speed 520 to 900 px/s, cone +/-35 degrees around slamDir biased 25 degrees up, spin +/-8 rad/s, gravity 900, alpha 1 to 0 over 420 ms (last 40 percent of life) |
| 50 | Key cap and pips are drawn on the wedges they sit on (as part of the wedge, cut at the sector line) or drop straight down 60 px at gravity 900 with alpha 0 by 300 ms (simpler, recommended: the cap and pips fall as 2 loose pieces) |
| 470 | All gone |
- Reduced Motion: crack lines shown for 150 ms, then bubble fades out in 150 ms, no wedges.
- Hit Flash Low: no change (nothing here flashes).

### 3.7 Release (Dugan died or was stunned before the slam)
No fanfare: alpha 1 to 0 and scale 1.0 to 0.9 over 160 ms (Quad.easeIn). The ring and pips freeze at their current values while fading. Reduced Motion: fade only.

## 4. Placement and layering

World-anchored to Zed on the main (world) camera so it follows him as Dugan carries him (running-grab included), drawn at depth 5900: above the Wall Slam chunks and sparks (5800), below the HUD scene (a separate scene or camera, never covered). "FREE!" at depth 5950.

Position (screen = world minus camera scroll):
- Zed hangs about 120 px up and is about 90 px tall: `headTopY = zed.y - 120 - 90` (with `zed.y` = his shadow/feet line; if the sprite's `zed.z` holds the lift, use `zed.y - zed.z - 90`).
- Bubble centre: x = zed.x, y = `headTopY - tailLen(16) - gap(6) - 55` which is `zed.y - 287`. At a typical lane y 520 the bubble spans screen y 178 to 288 (centre 233).
- Clamp in screen space: x to [16 + 55, 1280 - 16 - 55] = [71, 1209]; y to at least 70 (HUD band) + 8 + 55 = 133 (add the 28 px of the hint pill while the hint is shown, so centre y at least 161). Clamp only moves the bubble; the tail always points from the bubble edge at Zed's head (tail length 10 to 22 px, shrinks if the clamp pushes it nearer).
- No horizontal offset: the bubble sits at least 20 px above Dugan's head (head top about zed.y - 192, the bubble's tail tip is at zed.y - 210), so Dugan's face is never covered.
- Positions are rounded to whole pixels every frame (pixel-art rule, no sub-pixel shimmer). No smoothing lag: the bubble is rigid with Zed.
- Camera zoom from Wall Slam (1.03) scales the bubble with the world, harmless.

## 5. Accessibility

- Reduced Motion: no pop-in scale, no pulses, no bounce, no rhythm, no shards, no flying wedges, no shake. The ring still drains (it is state, not decoration) and pips still step in, static. The next-pip orange outline and the red last 250 ms stay.
- Hit Flash Low: no Spark Cream core flash on break (Sand at alpha 0.3 instead); no brightness pops on pips (the settle colour is the same as the final); Telegraph Red ring stays a solid colour (no blinking). There are no white flashes anywhere in this cue, and no element changes brightness more than 3 times per second (the pip settle is a 100 ms fade, and only the pop of scale repeats at tap rate).
- Colour is never the only signal: the ring shrinks (length), the pips count (shape), the cap presses (motion), the next pip has an orange outline, urgency thickens the ring and adds an outer line.
- Contrast: label Dark Brown on Orange about 6:1; Dark Brown outline on Cream about 11:1; ring Cream and Red on the Dark Brown track above 4.5:1.

## 6. First-time hint (decision)
Show "MASH!" on the pill above the bubble for the first grabs of a session until the player has broken free once, at most 3 times (module-level counter; resets on reload; never persisted, so it is not nagging a returning player). Worth it because it costs one pooled Text and the word reads in about 100 ms where the key cap alone does not say "many times". Text: Anton 18 px, Dark Brown on the Orange pill (contrast about 6:1), no rotation. Not shown if the clamp leaves no room (then skip it silently). Reduced Motion: same, static.

## 7. Implementation notes

Suggested split (matches the pattern in `telegraphCueData.js`):
- `src/enemies/grabBreakCueData.js`: the `grabBreakCue` constants (below) plus a pure function `grabBreakCue({ timerMs, holdMs, progress, breakTaps, reduce })` returning `{ ring: {frac, color, widthPx, urgent}, pips: [0..1 x6], aboutToBreak, nextPip }`, and `keyLabel(code)`, `padLabel(index, padId)`. No Phaser.
- `src/enemies/GrabBreakCueFx.js`: owns one Graphics (depth 5900), two pooled Texts (label, word), and a 9-wedge pool. API: `show(zed, dugan)`, `update(dtMs, { timer, holdMs, progress, tapPressed })`, `onBreak()`, `onSlam(slamDir)`, `onRelease()`. `tapPressed` is true on the frame an attack or jump press is read in `held`, independent of whether the meter moved.
- Budget: 1 Graphics redrawn per frame (circle arcs, 6 pips, cap, tail), 2 Texts, up to 17 transient primitives on the success burst (8 shards, 1 disc, word), 9 wedges on the slam. Redraw only while the cue is alive.
- Audio hook (not specified here): a rising tick per tap (pitch up per pip), a bright chime on break, the existing slam thud on the slam frame.

## 8. Data

```json
{
  "grabBreakCue": {
    "events": { "show": "Zed state becomes held", "tap": "attack or jump pressed while held", "break": "break state fires (breakTaps reached)", "slam": "PLAYER_SLAMMED", "release": "Dugan died or stunned before the slam" },
    "inputs": { "timerMs": "zed.grab.timer", "holdMs": "holdMs", "progress": "zed.grab.progress", "breakTaps": 6, "urgencyMs": 250 },
    "anchor": { "x": "zed.x", "headTopY": "zed.y - 120 - 90", "bubbleCentreY": "headTopY - tailLen - gapPx - bubbleRadius", "gapPx": 6, "roundToWholePx": true, "followSmoothing": 0 },
    "layers": { "depth": 5900, "wordDepth": 5950, "camera": "main world camera", "belowHud": true },
    "view": { "w": 1280, "h": 720, "marginPx": 16, "hudBandPx": 70, "hudGapPx": 8, "hintExtraTopPx": 28 },
    "bubble": {
      "outlineColor": "#2E1F16", "outlineRadius": 55,
      "track": { "color": "#2E1F16", "radiusFrom": 46, "radiusTo": 52 },
      "ring": { "centreRadius": 49, "widthPx": 6, "urgentWidthPx": 8, "startAtDeg": -90, "direction": "clockwise", "drainsFromEnd": true },
      "separatorPx": 3, "body": { "radius": 43, "fill": "#FFF6D6" },
      "tail": { "basePx": 18, "lengthPx": 16, "minPx": 10, "maxPx": 22, "outlinePx": 3, "fill": "#FFF6D6" }
    },
    "ringColors": [
      { "whenTimeLeftMsAbove": 450, "color": "#FFF6D6" },
      { "whenTimeLeftMsAbove": 250, "color": "#E3A92B" },
      { "whenTimeLeftMsAtMost": 250, "color": "#FF3B30", "outerLine": { "radius": 57, "widthPx": 2, "alpha": 0.8 } }
    ],
    "keyCap": {
      "sizePx": [36, 36], "centre": [0, -8], "fill": "#F58A2A", "side": "#B85F14", "sidePx": 4, "pressDropPx": 3,
      "outlinePx": 3, "outlineColor": "#2E1F16", "labelColor": "#2E1F16",
      "font": "FONTS.button", "fontPxByLength": { "1": 28, "2-3": 20, "4-5": 16 }, "widthPad": 18, "widthClampPx": [36, 64],
      "label": "keyLabel(KEY_MAP.light[0])",
      "pad": { "shape": "circle", "radius": 19, "label": "padLabel(PAD_MAP.light[0], pad.id)", "xbox": "X", "playstation": "square primitive 14px, 3px stroke", "nintendo": "Y" },
      "rhythm": { "periodMs": 125, "downMs": 55, "upMs": 70, "idleBeforeMetronomeMs": 200, "urgentPeriodMs": 100, "pressDownMs": 50, "pressUpMs": 70, "upEase": "Back.easeOut" },
      "bubbleBump": { "scale": 1.05, "ms": 90, "ease": "Back.easeOut" }
    },
    "pips": {
      "count": 6, "sizePx": 8, "gapPx": 2, "outlinePx": 2, "centre": [0, 24], "outline": "#2E1F16",
      "empty": "#C9B79A", "filled": "#4C9A55", "filledTop": "#7BC47F", "nextOutline": "#F58A2A",
      "partialFill": true, "partialMinPx": 2,
      "fillPop": { "fromScale": 1.7, "ms": 100, "ease": "Back.easeOut", "fromColor": "#A8E6AB" },
      "aboutToBreak": { "filledAtLeast": 5, "filled": "#7BC47F", "top": "#FFF6D6", "nextPulseHz": 4, "nextPulseWidthPx": [2, 3] }
    },
    "popIn": { "fromScale": 0.4, "ms": 80, "ease": "Back.easeOut", "overshoot": 1.7, "maxDelayMs": 60 },
    "urgency": { "pulseHz": 10, "pulseScale": [1.0, 1.06] },
    "breakFree": {
      "bubble": { "scaleTo": 1.25, "ms": 70, "ease": "Quad.easeOut", "alpha": [1, 0] },
      "shards": { "count": 8, "lengthPx": [14, 18], "widthPx": 5, "fromRadius": 52, "toRadius": 96, "ms": 260, "ease": "Cubic.easeOut", "colors": ["#FFF6D6", "#E3A92B"], "mustardCount": 4, "alpha": [1, 0] },
      "burst": { "color": "#FFF6D6", "radius": [30, 70], "alpha": [0.6, 0], "ms": 70, "ease": "Quad.easeOut" },
      "word": { "text": "FREE!", "font": "FONTS.display", "sizePx": 34, "fill": "#FFF6D6", "strokePx": 5, "stroke": "#2E1F16", "popFrom": 0.5, "popTo": 1.15, "popMs": 90, "settleMs": 160, "risePx": 18, "fadeFromMs": 260, "fadeToMs": 480, "followZed": false }
    },
    "slam": {
      "cracks": { "count": 3, "lengthPx": [40, 60], "widthPx": 3, "color": "#2E1F16", "jitterPx": 4, "holdMs": 50 },
      "wedges": { "count": 8, "plusTail": 1, "fill": "#FFF6D6", "outlinePx": 3, "speed": [520, 900], "coneDeg": 35, "upBiasDeg": 25, "spinRadPerS": 8, "gravity": 900, "lifeMs": 420, "fadeLastShare": 0.4, "startMs": 50, "directionFrom": "slamDir" },
      "looseParts": { "capAndPips": "fall 60px, gravity 900, alpha 0 by 300ms" },
      "totalMs": 470
    },
    "release": { "ms": 160, "ease": "Quad.easeIn", "scaleTo": 0.9, "alpha": [1, 0] },
    "hint": { "text": "MASH!", "font": "FONTS.button", "sizePx": 18, "color": "#2E1F16", "pill": { "sizePx": [64, 24], "fill": "#F58A2A", "outlinePx": 3, "outline": "#2E1F16", "centreY": -69 }, "maxShowsPerSession": 3, "stopAfterFirstBreak": true, "persist": false },
    "reduce": {
      "reducedMotion": { "popIn": "none", "pulse": "none", "keyRhythm": "none", "bubbleBump": "none", "shards": "none", "wedges": "none", "breakFadeMs": 120, "wordStaticMs": 400, "wordFadeMs": 80, "slamCrackMs": 150, "slamFadeMs": 150, "keepRingDrain": true, "keepNextPipOutline": true, "keepUrgencyRed": true },
      "hitFlashLow": { "burst": { "color": "#E8C27A", "alpha": 0.3, "ms": 160 }, "pipFillPopColorChange": false, "ringBlink": false, "padNote": "Telegraph Red stays solid, nothing blinks" }
    }
  }
}
```

## 9. Open questions and playtest notes
1. 8 Hz rhythm and 10 Hz urgency: needing 6 taps in 900 ms is about 7 per second, which is already at the edge of comfortable mashing, so the beat shown is a little above what is needed on purpose. Watch whether players try to match it or just mash; if the beat reads as a metronome to keep, slow it to 6.5 Hz.
2. Ring direction and the 250 ms red: check that the player does not read "ring shrinking" as "progress". If testers confuse it, flip the ring to a hand sweep with a small slam icon at 12 o'clock, or fill it instead of draining it.
3. Only Light is shown (J). Z, K, X and Space also work. Consider a small "ANY" tag, or a second tiny cap, if testers do not realise other buttons count. Left out for glance-readability.
4. Does the break meter decay between taps? The spec assumes no. If it decays, pips need a drain animation and `aboutToBreak` may flicker.
5. `zed.y`, the 120 px lift and the 90 px height are taken from the brief; the anchor formula may need `zed.z` or the held-sprite origin from `Zed.js`/`DuganGrab`. Verify in the scene that the tail lands on his head.
6. The bubble is on the world camera so it shakes and zooms with the Wall Slam. If the world camera scrolls hard during the running-grab catch, check the clamp does not jitter; fall back to rigid world position with a 1-frame-lag clamp.
7. First-time hint: 3 shows until the first break might be too many or too few; try 2.
8. Gamepad glyph for PlayStation pads is a drawn square; if the id sniffing misfires, default to `X`.
9. Audio is not covered (hooks listed in 7).

## 10. Assumptions
- `holdMs` and `breakTaps` are read at runtime from the grab state, so the cue still matches if Dugan's tuning changes.
- Fonts are loaded by `waitForFonts()` before any Text is created (Anton and Permanent Marker are in `FONT_LOADS`).
- The HUD is on its own scene or camera above or apart from the world camera.
- Telegraph Red is allowed here because the bubble warns of an enemy attack (the slam); no Brick Red or red-orange is used on enemy bodies.
- The key cap letter is 28 px Anton; confirm it stays crisp against the integer-scale pixel look when the bubble is scaled by the pop.

## Revision (owner request, after playtest feedback)

- **Break taps are now 7** (`GRAB_CONFIG.breakTaps`); the pips follow it (7 pips, "about to break" from the 6th).
- **The ring is now a clock, not a meter.** A draining ring could be read as progress. The time that has gone now fills **red** clockwise behind a small hand; the time left stays cream, then mustard in the last 450 ms. The pips are the only green. Rule: fill the green before the red closes the ring. The hand reaches 12 o'clock on the slam frame. The urgency state (last 250 ms) keeps the thicker ring, the outer red line and the 10 Hz pulse.
- The key cap shows both attack keys, "J / K"; jump does not count.
