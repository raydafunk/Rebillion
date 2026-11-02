# Shared contracts (FINAL for Tier 0, owned by `combat-agent`)

Everything communicates through Phaser's global event emitter (`game.events`). Constants: `src/shared/events.js` (`EVENTS`, `END_REASONS`). Shapes: `src/shared/combatData.js`. Never reach into another module's state.

## Events

| Event | Emitted by | Payload | Consumed by |
|---|---|---|---|
| `entity-registered` | player, enemy (on spawn) | `{ id, team, maxHp, hurtbox:{x,y,w,h}, getState:()=>({x,y,facing}) }` | combat |
| `entity-unregistered` | player, enemy (on destroy) | `{ id }` | combat |
| `hit-request` | player, enemy | `{ attackerId, attackId, team, hitbox:{x,y,w,h}, origin:{x,y}, facing:1\|-1, damage, knockback, hitstun }` | combat |
| `damage-applied` | combat | `{ targetId, attackerId, amount, hpAfter, knockback (signed), hitstun (ms) }` | player, enemy, fx |
| `entity-died` | combat | `{ id, team }` | waves, state, enemy, player |
| `player-health-changed` | combat | `{ hp, maxHp }` (also on spawn/reset) | ui |
| `wave-started` | waves | `{ index, total, hint? }` (hint: optional coaching line from the wave data) | ui, arena |
| `wave-cleared` | waves | `{ index }` | arena, state |
| `arena-cleared` | waves | `{}` (after final wave) | state |
| `timer-tick` | state | `{ secondsLeft }` (every second) | ui |
| `round-won` | state | `{ reason: 'cleared' }` | ui |
| `round-lost` | state | `{ reason: 'ko' \| 'timeout' }` | ui |
| `retry` | ui | `{}` | state, combat, waves, player |

## Rules

- `team`: `'player' | 'rust'`. Hits only affect the opposing team.
- Hitbox/hurtbox rects are relative to the entity origin, authored facing right; combat mirrors them when `facing = -1`.
- `attackId` is unique per swing. combat ignores a repeat (attackId, target) pair, so one swing hits a target once.
- Player id is `'player'`. Enemy ids unique (e.g. `grunt-1`).
- Player/enemy own movement and animation; combat owns hp, hit-stun and invulnerability flags. On `damage-applied` the target applies knockback and plays hurt; on `entity-died` it plays death and removes itself, then emits `entity-unregistered`.
- `getState()` may include optional `guard: 'parry' | 'block' | null`, read by combat at hit time. parry: damage negated, `damage-applied` still emitted with `amount: 0, knockback: 0, hitstun: 0` and unchanged `hpAfter` (no hp change, no invulnerability consumed). block: damage x `BLOCK_DAMAGE_MULT` (0.25, min 1), knockback x `BLOCK_KNOCKBACK_MULT` (0.25), hitstun 0. Dedupe per (attackId, target) still applies.
- Invulnerable or dead targets take no damage and emit no `damage-applied`.
- After `round-won`/`round-lost`, combat ignores `hit-request` until `retry`.
- On `retry`: state resets timer/state, combat resets all hp and clears registrations' flags. waves restarts at wave 1; player/enemy respawn and re-emit `entity-registered`.
- All damage and health numbers live in `src/combat/`, `src/shared/combatData.js`, or move/enemy data tables. Nobody hard-codes them elsewhere. Round constants: `src/state/config.js`.

## Open (GDD gaps)

- Round time limit and retry rules unspecified. Placeholder: 120 s, unlimited retries.
- Number of waves and enemies per wave unspecified. Placeholder: 3 waves of 3, 4, 5 grunts.
- Damage/HP values (player 100, grunt 30), invulnerability after a hit (400 ms) are placeholders.

## Grab and Wall Slam (Dugan -> Zed)

Zed's side lives in `src/player/grab.js` (pure `GrabController`), tuned in `src/player/grabConfig.js`, wired in `Zed.js`. Dugan decides whether the grab connects (range, lane, airborne ignored: a jump does not avoid it; block/parry do not apply) and then emits `grab`.

| Event | Emitted by | Payload | Notes |
|---|---|---|---|
| `grab` | Dugan | `{ attackerId, targetId:'player', holdMs, slamDamage, slamKnockback, slamDir:+1\|-1, anchor:()=>({x,y,facing,lane?}) }` | `anchor` is polled every frame: Dugan's world position (`y` = body centre like `getState().y`), facing and optionally his floor line. Zed hangs at `GRAB_CONFIG.handOffset` (x along Dugan's facing) and faces him. `slamDir` points at the wall. `holdMs` is the maximum hold. |
| `grab-result` | Zed | `{ attackerId, targetId, accepted }` | `accepted:false` if Zed is dead, already held/down, or in the post-break / get-up invulnerability window: Dugan should whiff. Same answer from `zed.startGrab(req)` (boolean). |
| `grab-slam` | Dugan | `{ attackerId }` | Optional "slam now" on his slam frame. If never sent, Zed slams by itself when `holdMs` runs out. |
| `grab-release` | Dugan | `{ attackerId, reason:'died'\|'stunned' }` | Zed drops, no damage, 250 ms invulnerability. Also automatic when `entity-died` arrives for the attacker. Zed's own parry-stun does not apply while held (a held Zed cannot parry); if Dugan is stunned another way, emit this. |
| `grab-broken` | Zed | `{ attackerId }` | 7 light (J) or heavy (K) attack taps (`breakTaps`; jump does not count) while held. Zed lands `breakDropDx` px in front of Dugan with 250 ms invulnerability. Dugan should be stunned briefly (lead wires). |
| `player-slammed` | Zed | `{ attackerId, damage, slamDir, x, y }` | Emitted right after the slam damage went through `damage-applied`. `damage` is the amount actually applied. Use for camera shake / hit-stop. |

Slam damage: Zed emits a synthetic `hit-request` for Dugan (`attackId` `<attackerId>:slam:<n>`, team `rust`, `pierceInvuln`, `unblockable`, `hitstun 0`, origin placed so combat's signed knockback points along `slamDir`), so health, `damage-applied`, `player-health-changed` and `entity-died` behave as for any hit. Nothing writes health directly.

Invulnerability without a combat change: while held, down, getting up or in the break/release window, `getState().lift` reports `COMBAT_DEFAULTS.AIR_DODGE_LIFT`, so the resolver skips ordinary hit-requests as for an airborne target (the slam request is resolved with the real lift). Zed.js also ignores any `damage-applied` it receives in those states. `guard` is `null`.

Zed states (`zed.state`): `held`, `slammed` (700 ms down), `getup` (300 ms, also used after a break); then `idle`. Controls are locked in all of them; the machine is parked via `PlayerStateMachine.lock/unlock`. Rage: a hold or knockdown never ends Rage; the slam counts as a hit taken (ends the clean streak, as any hit); no blows can land while held, so no rage gain. Visual: tint + squash poses `held`/`slammed`/`getup` in `zedPose` (no new art). HUD helper: `zed.grab.progress` (0..1 break meter).
