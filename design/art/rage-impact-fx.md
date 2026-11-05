# Rage Impact FX: Mega Shake and Kill Dust (design spec)

Owner: art-direction-agent. Status: PROPOSED, code-drawn, no asset files. Data: `src/shared/rageImpactFxData.js` (`RAGE_IMPACT_FX`). Companion to `rage-entry-flash.md` and `hit-feedback-spec.md`. Palette from `RAGE_ENTRY_FX.colors`.

## 1. Trigger
Only when the hit request carries `rage:true` (rageKick, rageUppercut, rageAirKick). Normal hits and the Special keep their existing feedback. Never fires outside Rage ACTIVE.
- MEGA SHAKE: every Rage impact that connects (hit or block-break on any enemy).
- KILL DUST: only when that hit reduces the enemy to 0 hp (the kill). It plays in addition to the mega shake.

## 2. Mega shake (per move)
| Move | shake durationMs | intensity | hitStopMs | flash alpha | flash in/out ms | impact burst radius |
|---|---|---|---|---|---|---|
| rageKick | 150 | 0.009 | 70 | 0.35 | 20 / 110 | 70 px |
| rageUppercut | 240 | 0.016 | 120 | 0.50 | 25 / 170 | 110 px |
| rageAirKick | 170 | 0.011 | 80 | 0.40 | 20 / 120 | 80 px |

- Ordering: uppercut >= airKick >= kick on every column (the uppercut is the finisher).
- Intensity is Phaser camera shake fraction (0.005 is about 6 px at 1280): kick about 11 px, air kick about 14 px, uppercut about 20 px, decaying.
- Hit-stop freezes only attacker and target (see hit-feedback-spec), real time. Replaces, not adds to, the normal hit-stop (use the larger).
- Flash: one rect with scrollFactor 0, colour `flash.color` (red-white #FFE3D6 for kick and air kick, pure white #FFFFFF peak for uppercut) over a #D62A1E tint, monotone rise then fall, never above 0.55.
- Impact burst: radial spark at the contact point, white centre fading to #D62A1E edge, radius per table, lasts `impactBurst.durationMs`, scale 0.6 to 1.0 then alpha to 0.
- Rapid hits: restart rather than stack. Camera shake keeps the stronger of current and new. Flash never overlaps itself (max about 3 flashes per second in aggregate rule: if a flash fired under 300 ms ago, use 60 percent alpha).
- Does not overlap the 450 ms rage entry freeze (world is frozen then; no hits land).

## 3. Kill dust
Drawn in code (Graphics circles and ellipses, pooled), at the enemy's feet (sprite bottom centre, world px), depth just below actors so the corpse and Zed stay readable.

| Param | Value |
|---|---|
| Puff count | 40 (pool cap 120 active) |
| Start radius | 8 to 26 px, grows to 1.8x |
| Speed | 110 to 360 px/s outward, fan 160 degrees about the ground plane, plus rise 30 to 140 px/s |
| Drift | horizontal drag 0.9 per second, gravity -60 px/s2 (keeps rising slowly) |
| Lifetime | 450 to 900 ms |
| Fade | alpha 0.85 to 0, quad ease-out |
| Spawn jitter | 24 px x, 6 px y |
| Colours (weight) | Dark Brown #2E1F16 (3), Rage Ember #7A2E1A (3), Brick #A8402E (1), dust tan #B08A5A (3), pale tan #D9B27A (3), Rage Red-White #FFE3D6 (1) |

Ground ring puff: flat ellipse (y squash 0.35) at the feet, radius 12 to 150 px over 380 ms, stroke 10 px #FFE3D6 alpha 0.8 to 0, fill #7A2E1A alpha 0.25 to 0. Second thinner ring after 70 ms: radius to 105 px, 6 px #D62A1E, 320 ms.

Palette note: dust tones are warm browns (level styles share the street and brick palette); there is no Rust steel grey so it never reads as an enemy telegraph. Level-specific tan tints are an open question (Q2).

## 4. Reduced motion (hitFlash 'Low' or reducedMotion, same test as `ArenaScene._reduceFlash()`)
| Item | Reduced |
|---|---|
| Camera shake | none |
| Hit-stop | half of normal (scale 0.5) |
| Flash | alpha max 0.2, #D62A1E only, no pure white; no impact burst |
| Kill dust | half the puffs (20), speed x0.6, main ring kept, second ring off |

## 5. Accessibility
Single monotone flash per hit, alpha cap 0.55 (0.2 reduced). Meaning not by colour alone: freeze, shake and the dust burst carry the kill. Dust is low contrast to the telegraph red (telegraph red is never used here except the thin ring #D62A1E, which is Rage Red, not Telegraph Red).

## 6. Config sketch
```js
RAGE_IMPACT_FX = {
  shake: { rageKick:{durationMs,intensity,hitStopMs,flash,impactBurst}, rageUppercut:{...}, rageAirKick:{...} },
  killDust: { count, radiusMin, radiusMax, growTo, speedMin, speedMax, spreadDeg, riseSpeedMin, riseSpeedMax, gravity, drag,
              lifetimeMinMs, lifetimeMaxMs, alphaStart, alphaEnd, fade, spawnYJitter, spawnXJitter, colors, colorWeights,
              ring, secondaryRing, maxActiveParticles },
  reduced: { shake, shakeScale, hitStopScale, flashAlphaMax, flashColor, noPureWhite, impactBurst,
             killDustCountScale, killDustSpeedScale, killDustRing, killDustSecondaryRing },
}
```

## 7. Open questions
1. Are 20 px peak shakes too strong in tight arenas? Playtest range: 0.7x to 1.3x.
2. Tint dust per level style (e.g. court grey, garden green)?
3. Should the killing blow's hit-stop be longer than the non-kill uppercut (e.g. +30 ms)?
4. Audio for the heavy impact and the kill: unowned.
5. Final art style for the impact burst (placeholder radial) needs owner approval.
