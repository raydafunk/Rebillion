# Zed shock (Copper Fang taser hit)

Owner agent: `art-direction-agent`. Status: **placeholder, drawn in code (Phaser Graphics + tint), no image assets.**

## When
A Rust Specialist's strike (Taser_Shot pose) damages Zed. Not on a parry, and not on a block (no damage lands). Other enemies never trigger it.

## Look
- Body: Zed flickers between a solid cool white and cyan (#5FE8FF) at about 14 Hz, then settles to a steady cyan wash as it fades out. A 2 px sideways jitter reads as a body spasm.
- Lightning: 5 jagged arcs (4 to 6 segments each) hug Zed's silhouette from feet to head; they are redrawn every 55 ms so they crackle. Two thin white-hot cores over a wider cyan glow stroke.
- Length: 450 ms, or the hit-stun if longer. Arc count and brightness fade over the last 40%.
- Palette: cyan #5FE8FF and white only. The Rust read cold; the cyan matches Royce's taser bolt, so the family is consistent.

## Readability and safety
- Reduce-flash setting: no flicker and no jitter. Steady cyan wash, 2 slow arcs, same length.
- Never covers the health bar or HUD; arcs sit at world depth 5000 like the other combat effects.
- Zed's own hit-reaction clip keeps playing underneath; the effect only adds colour and lightning.

## Open questions
- Should the shock also stun for longer than the normal hit-stun? Currently visual only; gameplay numbers are unchanged.
- Placeholder: swap for painted electric frames when art exists.
