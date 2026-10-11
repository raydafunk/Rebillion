# Content pipeline report
_2026-10-11_

## Sources read
35 of 35 documents ingested.

- read `GameDesignDocument/Rebellion menu desgin.docx` (primary), 4 chunks
- read `GameDesignDocument/The Rebellion.docx` (primary), 10 chunks
- read `PDf/The Rebellion -Frist Draft.pdf` (reference), 2 chunks
- read `PDf/The Rebellion- Final Gdd.pdf` (reference), 5 chunks
- read `README.md` (reference), 0 chunks
- read `design/art/asset-manifest.md` (derived), 13 chunks
- read `design/art/hit-feedback-spec.md` (derived), 7 chunks
- read `design/art/style-guide.md` (derived), 15 chunks
- read `design/art/zed-pixellab-prompt.md` (derived), 8 chunks
- read `design/lore/canon.md` (derived), 13 chunks
- read `design/lore/critic-log.md` (derived), 10 chunks
- read `design/lore/menu-copy.md` (derived), 4 chunks
- read `design/team/agent-diagrams.md` (derived), 7 chunks
- read `design/team/agent-team-setups.md` (derived), 13 chunks
- read `design/team/contracts.md` (derived), 4 chunks
- read `design/team/review.md` (derived), 11 chunks
- read `design/ux/flow.md` (derived), 11 chunks
- read `design/ux/hud.md` (derived), 14 chunks
- read `design/ux/lose.md` (derived), 10 chunks
- read `design/ux/main-menu.md` (derived), 14 chunks
- read `design/ux/menu-concept.md` (derived), 6 chunks
- read `design/ux/pause.md` (derived), 10 chunks
- read `design/ux/win.md` (derived), 10 chunks
- read `gdd-review-kit-main/CLAUDE.md` (reference), 11 chunks
- read `gdd-review-kit-main/README.md` (reference), 8 chunks
- read `gdd-review-kit-main/gdd.txt` (reference), 2 chunks
- read `gdd-review-kit-main/reviews/SYNTHESIS.md` (reference), 12 chunks
- read `gdd-review-kit-main/reviews/adversarial-qa.md` (reference), 13 chunks
- read `gdd-review-kit-main/reviews/business-analyst.md` (reference), 16 chunks
- read `gdd-review-kit-main/reviews/feasibility-lead.md` (reference), 13 chunks
- read `gdd-review-kit-main/reviews/narrative-critic.md` (reference), 13 chunks
- read `gdd-review-kit-main/reviews/player-psychologist.md` (reference), 14 chunks
- read `gdd-review-kit-main/reviews/systems-designer.md` (reference), 11 chunks
- read `gdd-review-kit-main/reviews/viz-audit.md` (reference), 14 chunks
- read `gdd-review-kit-main/reviews/viz-spec.md` (reference), 22 chunks

## Content
| Type | Items | Proposed (needs owner approval) | Errors |
|---|---|---|---|
| lore | 26 | 7 | 0 |
| enemies | 6 | 5 | 0 |
| levels | 5 | 5 | 0 |
| dialogue | 40 | 39 | 0 |

## Proposed items awaiting owner approval (56)
- **lore/rust-grunt**: The GDD says only 'Rust Enemies'. 'Rust grunt' is the working Tier 0 enemy name from the asset manifest and canon open question 6; the owner has not confirmed it as the player-facing term.
- **lore/rust-notice-114**: The menu design doc shows a poster 'Rust Notice 114 / CURFEW' but the main GDD never says the Rust issue curfews or numbered notices (canon open question 1). Kept as flavour pending owner approval.
- **lore/local-heroes-benefit**: The menu poster 'Local Heroes Benefit: Keep the Lights On' implies community fundraising events, which the GDD does not describe.
- **lore/mustard-row**: The GDD says 'urban districts' but names none. Built from the mustard-yellow storefronts and corner shops of the Theme.
- **lore/greenline-courts**: No districts are named in the GDD. Built from the forest-green basketball courts of Zed's block.
- **lore/stewpot-gardens**: No districts are named in the GDD. Built from the food stalls and community gardens of the Theme and Zed's mother's stall.
- **lore/songwindow-heights**: No districts are named in the GDD. Built from the open windows with music and the murals celebrating local heroes.
- **enemies/rust-enforcer**: GDD says one enemy type first and promises dynamic enemy behaviours later; difficulty comes from how waves arrive. A heavier bruiser gives waves a slow, high-threat piece to mix with grunts.
- **enemies/rust-baton-scout**: GDD lists dynamic enemy behaviours and defensive tools (block, dodge, parry) but gives no enemy roster. A fast, light attacker with a clear tell is a natural parry trainer.
- **enemies/rust-dart-marksman**: GDD asks for dynamic enemy behaviours and a player toolkit of block, dodge and parry. A ranged role forces the player to close distance and use lane movement, which melee-only enemies do not.
- **enemies/rust-shield-sergeant**: GDD names block, dodge and parry as defence tools but never says which enemies reward them. A shielded elite makes the player use combos and juggles rather than button-mashing.
- **enemies/rust-signal-warden**: GDD promises dynamic enemy behaviours and says difficulty comes from how waves arrive, but names no support role. A Rust officer who buffs nearby grunts gives wave composition a priority target and rewards lane movement and juggle routes that reach the back line.
- **levels/level-01-brick-red-alley**: The GDD says 'urban districts' and 'Defeat Wave / Clear Arena ... in time' but sets no level count, order, wave counts or time limit. Wave numbers and the 120 s limit copy the Tier 0 placeholders in src/waves/waveData.js and src/state/config.js, so they are engine-matched but not GDD-confirmed.
- **levels/level-02-mustard-row**: No level structure in the GDD. Introduces the Rust Baton Scout (proposed enemy) as the first new threat; wave sizes and 135 s limit are assumed.
- **levels/level-03-greenline-courts**: No level structure in the GDD. Introduces the Rust Enforcer (proposed bruiser) after the scout; waves vary arrival pattern (slow heavy waves, then a quick burst) rather than only raising counts.
- **levels/level-04-stewpot-gardens**: No level structure in the GDD. Introduces the Rust Dart Marksman (proposed ranged enemy) and pairs it with melee waves so the player must use lane movement. Also introduces the proposed Rust Signal Warden (support, buffs grunts); engine waves hold one enemy type each, so a Warden wave stands alone until mixed waves exist (further gap). 180 s limit assumed.
- **levels/level-05-songwindow-heights**: No level structure or final-level beat in the GDD (narrative review notes the premise has no ending). Introduces the Rust Shield Sergeant (proposed elite); the finale mixes every enemy type including the proposed Rust Signal Warden; 210 s limit assumed. Five levels is an assumption.
- **dialogue/zed-fight-start-brick-red-alley**: Level-specific barks are not in the GDD; built on Brick-Red Alley, where Zed's kids learned to fight, dance and argue like family.
- **dialogue/zed-fight-start-mustard-row**: Mustard Row is a proposed district; lines lean on the GDD's mustard-yellow storefronts and corner shops.
- **dialogue/zed-fight-start-greenline-courts**: Greenline Courts is a proposed district; lines follow the GDD's forest-green basketball courts and Zed's wish for kids to play again.
- **dialogue/zed-fight-start-stewpot-gardens**: Stewpot Gardens is a proposed district; lines draw on the community garden and the stew from his mother's food stall (her fate is not stated).
- **dialogue/zed-fight-start-songwindow-heights**: Songwindow Heights is a proposed district; lines use the GDD's open windows with music drifting out and the surveillance towers.
- **dialogue/zed-level-won-brick-red-alley**: Per-level win lines are not in the GDD; extends Zed's 'one district at a time' mission. Father is hinted at only as longing, no answer given.
- **dialogue/zed-level-won-greenline-courts**: Per-level win lines are not in the GDD; built on Zed fighting so kids can play on the courts again.
- **dialogue/zed-level-won-songwindow-heights**: Final-level win lines are not in the GDD; kept hopeful and open-ended, since the GDD does not say what Zed finds about his father.
- **dialogue/zed-pause**: No pause copy in the GDD; short, warm lines for the pause overlay in the neighbourhood voice.
- **dialogue/zed-grab-pickup**: GDD names pick-up objects in combat but no bark; lines are cheeky improvisation matching his jokes mid-fight.
- **dialogue/zed-wave-clear-stewpot-gardens**: Level-specific wave-clear barks are not in the GDD; use the community garden and food stall details.
- **dialogue/zed-low-hp-songwindow-heights**: Level-specific barks are not in the GDD; hold to 'stubborn' and 'refuses to back down', with hope for music from the windows.
- **dialogue/rust-taunt-baton-scout**: GDD has no enemy speech; Baton Scout is a proposed enemy. Cold, official patrol-style lines.
- **dialogue/rust-taunt-enforcer**: GDD has no enemy speech; Enforcer is a proposed bruiser. Blunt bureaucratic lines, no threats of death or gore.
- **dialogue/rust-taunt-dart-marksman**: GDD has no enemy speech; Dart Marksman is a proposed ranged enemy. Lines stay clinical and official, never lethal.
- **dialogue/rust-taunt-shield-sergeant**: GDD has no enemy speech; Shield Sergeant is a proposed elite. Stiff, rule-quoting lines.
- **dialogue/rust-taunt-signal-warden**: GDD has no enemy speech; Signal Warden is a proposed support enemy that calls in others via radio and screens.
- **dialogue/rust-notice-screens**: GDD says surveillance towers and propaganda screens replaced the murals; their specific slogans are invented flavour.
- **dialogue/neighbour-cheer-level-won**: GDD has no neighbour lines; extends 'people who looked out for each other' with level-clear celebration.
- **dialogue/neighbour-low-hp**: GDD has no neighbour lines; shows the community encouraging Zed when he is hurt.
- **dialogue/neighbour-retry**: GDD has no neighbour lines; encouraging retry copy from the community, in line with canon lose-screen tone.
- **dialogue/poster-community-defaced**: Menu concept shows the community defacing the Rust notice; these hand-inked responses extend that idea.
- **dialogue/poster-small-print-extra**: Extra small print in the same style as menu-copy.md's proposed set: no named characters or places, community flavour only.
- **dialogue/narrator-level-intro**: GDD mentions no narration or dialogue delivery (narrative-critic flags this); short intro captions are a proposed delivery mechanism.
- **dialogue/rust-notice**: GDD mentions 'security violations' and the Rust surveilling districts; numbered curfew notices are only implied by the menu poster (canon open question 1).
- **dialogue/rust-taunt**: GDD gives no enemy speech; these are cold, official lines extending the Rust as a bureaucratic security force.
- **dialogue/neighbour-cheer**: GDD says people on the block look out for each other but gives no neighbour lines.
- **dialogue/poster-rust-notice-114**: Rust Notice 114 with CURFEW struck through appears only in the menu concept, not the primary GDD (canon open question 1).
- **dialogue/poster-small-print**: Small print is marked proposed in menu-copy.md; community flavour from the lived-in neighbourhood theme.
- **dialogue/zed-fight-start**: GDD gives Zed's tone (expressive, stubborn, jokes mid-fight) but no scripted barks; these lines extend that voice.
- **dialogue/zed-combo**: No combo barks in the GDD; written from his rhythm-and-dance fighting style and joking nature.
- **dialogue/zed-heavy-hit**: No heavy-hit barks in the GDD; extends the scrappy-but-sharp brawler tone.
- **dialogue/zed-low-hp**: No low-health barks in the GDD; built from 'stubborn' and 'refuses to back down'.
- **dialogue/zed-block**: No block barks in the GDD; extends the defensive-tools pillar with a cheeky tone.
- **dialogue/zed-wave-clear**: No wave-clear barks in the GDD; draws on what Zed fights for (courts, music, murals).
- **dialogue/zed-level-won**: No victory lines in the GDD; written from Zed's mission of taking the Fallen City back one district at a time.
- **dialogue/zed-lose-ko**: GDD lose condition is 'knocked out by health bar'; no lines exist. Copy encourages a retry per tone rules.
- **dialogue/zed-lose-timeout**: GDD lose condition includes time running out; no lines exist. Wording follows canon.md's encouraging lose-copy example.
- **dialogue/zed-retry**: GDD lists retry as a game-state rule but has no copy; lines extend Zed's refusal to back down.

## Validation errors (0)
_none_
