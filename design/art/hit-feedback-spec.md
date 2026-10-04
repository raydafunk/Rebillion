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
