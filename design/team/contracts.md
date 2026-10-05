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
| `wave-started` | waves | `{ index, total }` | ui, arena |
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
- `getState()` may include optional `guard: 'dodge' | 'parry' | 'block' | null`, read by combat at hit time. dodge/parry: damage negated, `damage-applied` still emitted with `amount: 0, knockback: 0, hitstun: 0` and unchanged `hpAfter` (no hp change, no invulnerability consumed). block: damage x `BLOCK_DAMAGE_MULT` (0.25, min 1), knockback x `BLOCK_KNOCKBACK_MULT` (0.25), hitstun 0. Dedupe per (attackId, target) still applies.
- Invulnerable or dead targets take no damage and emit no `damage-applied`.
- After `round-won`/`round-lost`, combat ignores `hit-request` until `retry`.
- On `retry`: state resets timer/state, combat resets all hp and clears registrations' flags. waves restarts at wave 1; player/enemy respawn and re-emit `entity-registered`.
- All damage and health numbers live in `src/combat/`, `src/shared/combatData.js`, or move/enemy data tables. Nobody hard-codes them elsewhere. Round constants: `src/state/config.js`.

## Open (GDD gaps)

- Round time limit and retry rules unspecified. Placeholder: 120 s, unlimited retries.
- Number of waves and enemies per wave unspecified. Placeholder: 3 waves of 3, 4, 5 grunts.
- Damage/HP values (player 100, grunt 30), invulnerability after a hit (400 ms) are placeholders.
