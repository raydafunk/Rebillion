# Rage Entry Flash and Freeze (design spec)

Owner: art-direction-agent. Status: PROPOSED, placeholder art only. Extends `hit-feedback-spec.md` section 8 and `style-guide.md` section 10. Where it differs from the old `rageFx.activate` (100 ms hit-stop, 2-frame flash, alpha 0.6, 6 px shake) THIS SPEC SUPERSEDES IT per the owner request: a BIG full-screen red and white line burst with a short whole-game freeze. Spec source: Zed Rage System Spec, sections 6 and 8.

## 1. Trigger
Fires once, on `RAGE_EVENTS.ACTIVATED` ('rage-activated', emitted from `RageMeter._activate()`), i.e. the moment Rage actually begins (immediate L press, or a buffered press firing on landing). Never on READY, never on ENDED. Not on Level 1 (meter disabled). Does not re-fire while ACTIVE.

## 2. Palette (all from style-guide section 10.1; no Telegraph Red, no Rust colours)
| Layer colour | Hex |
|---|---|
| Rage Red | #D62A1E |
| Rage Red-White | #FFE3D6 |
| Hit White (peak lines only) | #FFFFFF |
| Rage Ember (vignette edge) | #7A2E1A |
| Dark Brown (title outline) | #2E1F16 |
| Rage Gold (title fill, optional) | #FFD24A |

## 3. Layers (bottom to top, all above the world, below pause menu)
1. Red flash: full-screen rect #D62A1E, alpha 0 to 0.55 in 50 ms, hold, fade to 0 by end of freeze. Cap 0.55 (below the 0.6 cap in hit-feedback 8.6).
2. Ember vignette: radial, transparent centre to #7A2E1A 45 percent at edges, same fade as layer 1. Keeps Zed's centre readable.
3. Line burst (drawn in code, no asset file; geometry in `rageEntryFxData.js` `lineBurst()`, seeded): 46 tapered wedges radiating from screen centre (anchor on Zed's screen position if known, see Q2), mix of #D62A1E, #FFE3D6 and a few #FFFFFF. Clear core about 230 px radius so Zed stays visible. Scale 0.85 to 1.25 over the burst (expands outward), alpha 1 to 0.
4. Optional title "RAGE": Anton 140 px, Rage Gold fill, 10 px Dark Brown stroke, Brick Red hard offset shadow 7 px, tilt -2.5 degrees (display text rule), centred 120 px above Zed. Scale punch 1.4 to 1.0 in 120 ms. Lore supports the word (the Special is "Zed Rage"; meter label is RAGE). No father or backstory text. Copy owned by `RAGE_COPY`.
5. Zed glow: his eyes and fists glow (existing `fx.rage.glow.*`) switches on at flash peak, so the frozen frame shows the transformation.

## 4. Timing (real, unscaled ms; total freeze 450 ms)
| t (ms) | Event |
|---|---|
| 0 | Freeze begins. Flash alpha 0 to 0.55 (50 ms, Quad.easeOut). Line burst appears at scale 0.85. Shake starts. Title punches in. |
| 0 to 120 | Lines scale 0.85 to 1.15 (Cubic.easeOut), alpha 1. |
| 120 to 300 | Hold; lines drift to scale 1.25, slight 2 px jitter at most; flash holds then eases to 0.3. |
| 300 to 450 | Everything fades to 0 (Quad.easeIn). Title fades from 360. |
| 450 | Freeze ends, play resumes. Layers destroyed (or pooled). |
Tuning range: freeze 350 to 550 ms. Reduced-flash variant: 300 ms (section 6). Skippable: no.

Frame budget at 60 fps: 450 ms = 27 frames.

## 5. Screen shake
Camera shake 250 ms, intensity 0.005 (about 6 px at 1280), decaying; runs on real time during the freeze (its tail may continue 100 ms after). Disabled by reduce-shake or reduced motion.

## 6. Accessibility (photosensitivity)
- Exactly ONE flash per activation: monotone rise then fall, no strobing. Line layer does not blink or alternate frames.
- Max flash alpha 0.55, below the 0.6 repo cap; never above 3 flashes per second in aggregate (hit-feedback 2). Rage cannot re-activate within 450 ms, and activations are seconds apart by design.
- Reduced variant when `loadSettings().hitFlash === 'Low'` or `reducedMotion === true` (same test as `ArenaScene._reduceFlash()`): no white-red full-screen flash; use red tint alpha max 0.25, lines at 60 percent alpha in #D62A1E/#FFE3D6 only (no pure #FFFFFF), no shake, no scale pulse, freeze 300 ms. Title stays (it is information, not a flash).
- Meaning is never colour alone: title text and the freeze itself carry it.
- Photosensitive pre-check: red flash area is the whole screen, so keep luminance change gentle (peak colour #D62A1E is saturated red; avoid pairing with a full white fill).

## 7. HUD
HUD (health, Rage meter, timer, score) STAYS VISIBLE and unshaken: put it on the HudScene above the overlay or use `setScrollFactor(0)` overlay depth below HUD. The Rage meter itself keeps its existing activation pop (RageMeterHud sets `flash=1` and calls `cameras.main.flash(180, 255,120,40)`; see Q3, this camera flash would stack with the new one and should be removed or suppressed when this effect plays).

## 8. Resolution scaling
Authored at 1280x720 (design resolution). Overlay is added with scrollFactor 0 and sized to the camera view, so it covers any width. The code-drawn line Graphics (design px, 1280x720) is scaled by max(w/1280, h/720) times the burst scale (0.85 to 1.25) about Zed's screen position. Title scales with min(w/1280, h/720). Vector drawing stays crisp at any resolution.

## 9. Freeze rules
Freeze is a whole-world pause, distinct from hit-stop (hit-stop freezes only attacker and target and keeps timer running; this does not). Use a dedicated `rageFreezeLeft` clock counted in REAL delta (`dt` passed to scene update, not scaled), so the overlay animates while the sim is stopped.

| System | During freeze |
|---|---|
| Physics (arcade bodies, gravity, knockback) | PAUSED (set `physics.world.isPaused` or skip `arena.update`; keep body.moves false for Zed) |
| Zed state machine, animation, input processing | PAUSED (no `zed.update`) |
| Enemy AI, attack windups and telegraph clocks | PAUSED (skip `arena.update`) |
| Enemy and Zed sprite animations | PAUSED (`anims.pause()` or timeScale 0, restore after) |
| Round timer (`state.tick`) | PAUSED. Fair to the player: the pause is a reward, and it is a fixed 450 ms. (Differs from hit-stop, which keeps the timer running; see Q4.) |
| Rage clocks (`tickRage`: drain, ACTIVE 9 s countdown) | PAUSED. The 9 s must start AFTER the freeze, so pass `hold = true`. |
| Input | NOT processed during freeze, but key presses are BUFFERED (latched edges in `Zed._pending`/`tapped` already survive); flush into the first post-freeze frame so a dash of attack presses is not eaten. Pause key (ESC/P) is ignored during the 450 ms. |
| Existing hit-stop | Cleared at freeze start (`_clearHitStop`), no stacking. |
| Audio | Music keeps playing (duck 30 percent for 450 ms optional); play a rage sting at t=0. Not paused. |
| KEEPS ANIMATING (real time) | Flash, vignette, line burst, title, camera shake, HUD, Zed glow-on. |
Edge: if Zed is knocked out (health 0) or the round ends during the freeze, the freeze cancels immediately. A hit cannot land (world frozen).

## 10. Assets
| Key | File | Status |
|---|---|---|
| (none) | n/a | The line burst is code-drawn (Phaser Graphics wedges, previously a placeholder SVG, now removed). Red flash, vignette and title are also code. |
Line burst, red flash, vignette and title are all drawn in code (graphics wedges, rect, radial gradient texture, text); no line-art asset is loaded. Final line style: owner decision (Q1). Replaces the old 2-frame radial `fx.rage.activate.flash` in the manifest for this use; that row is kept for the Zed-feet impact.

## 11. Config sketch
```js
rageEntryFx: {
  freezeMs: 450, flashInMs: 50, flashAlphaMax: 0.55, linesScale: [0.85, 1.25], fadeOutMs: 150,
  titleText: 'RAGE', shakeMs: 250, shakeIntensity: 0.005, hudVisible: true,
  reduced: { freezeMs: 300, flashAlphaMax: 0.25, linesAlpha: 0.6, shake: false, pulse: false }
}
```

## 12. Open questions
1. Final line style: radial burst (placeholder) or diagonal manga speed lines? Hand-drawn vector or generated in code? Owner approval needed.
2. Anchor point: screen centre or Zed's screen position (better framing, needs camera to world conversion)?
3. Remove the existing `cameras.main.flash(180, 255,120,40)` and HUD `flash` in `RageMeterHud` ACTIVATED handler to avoid double flash? (Code owner call.)
4. Should the round timer pause during the freeze (proposed yes) or keep running like hit-stop?
5. Freeze length: 450 ms proposed; playtest range 350 to 550. A shorter one on repeat activations?
6. Show "RAGE" title or "ZED RAGE"? Needs copy owner (`rageHudCopy.js`), and a localisation decision.
7. Gamepad rumble during the freeze (not in GDD)?
8. Does the old design value (100 ms hit-stop, 2 frames) get formally retired in `hit-feedback-spec.md` 8.7? (Not edited by this agent: file left as is.)
9. Audio sting: unowned.
