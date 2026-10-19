# Content pipeline report
_2026-10-19_

## Sources read
38 of 38 documents ingested.

- read `GameDesignDocument/Rebellion menu desgin.docx` (primary), 4 chunks
- read `GameDesignDocument/The Rebellion.docx` (primary), 20 chunks
- read `GameDesignDocument/The Title Screen.docx` (primary), 1 chunks
- read `PDf/The Rebellion -Frist Draft.pdf` (reference), 2 chunks
- read `PDf/The Rebellion- Final Gdd.pdf` (reference), 5 chunks
- read `README.md` (reference), 2 chunks
- read `blackboard/README.md` (reference), 5 chunks
- read `blackboard/log.md` (reference), 1 chunks
- read `design/art/asset-manifest.md` (derived), 13 chunks
- read `design/art/hit-feedback-spec.md` (derived), 7 chunks
- read `design/art/style-guide.md` (derived), 15 chunks
- read `design/art/zed-pixellab-prompt.md` (derived), 8 chunks
- read `design/lore/canon.md` (derived), 13 chunks
- read `design/lore/critic-log.md` (derived), 16 chunks
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
| lore | 38 | 9 | 0 |
| enemies | 10 | 9 | 0 |
| levels | 8 | 8 | 0 |
| dialogue | 99 | 87 | 0 |

## Proposed items awaiting owner approval (113)
- **lore/rust-grunt**: The GDD says only 'Rust Enemies'. 'Rust grunt' is the working Tier 0 enemy name from the asset manifest and canon open question 6; the owner has not confirmed it as the player-facing term.
- **lore/rust-notice-114**: The menu design doc shows a poster 'Rust Notice 114 / CURFEW' but the main GDD never says the Rust issue curfews or numbered notices (canon open question 1). Kept as flavour pending owner approval.
- **lore/local-heroes-benefit**: The menu poster 'Local Heroes Benefit: Keep the Lights On' implies community fundraising events, which the GDD does not describe.
- **lore/mustard-row**: The GDD says 'urban districts' but names none. Built from the mustard-yellow storefronts and corner shops of the Theme.
- **lore/greenline-courts**: No districts are named in the GDD. Built from the forest-green basketball courts of Zed's block.
- **lore/stewpot-gardens**: No districts are named in the GDD. Built from the food stalls and community gardens of the Theme and Zed's mother's stall.
- **lore/songwindow-heights**: No districts are named in the GDD. Built from the open windows with music and the murals celebrating local heroes.
- **lore/rust-rank-ladder**: The GDD lists five unit types but not how they relate on the ground. This ties them into one ladder (Grunts, Rangers, Breakers, Copper Fangs, Overseers) so levels and enemy writers can pace waves; the owner should confirm it.
- **lore/neighbourhood-answer-to-doctrine**: The GDD gives the Rust's doctrine but no community reply. The tone rules say Rust copy is always answered or defaced by the neighbourhood, so this proposes a painted answer to the creed.
- **enemies/rust-iron-line-cordon**: The GDD lists Rust Grunts, 'The Iron Line', for crowd control and frontline combat, but the Tier 0 rust-grunt is the only canon stat block. This is the Iron Line's crowd-control variant: a grunt that holds a line and sweeps a wide arc, so waves can pin the lane without adding a new silhouette. The base Iron Line unit remains rust-grunt (canon). FINAL BALANCE (tuned against the combat contract: Zed light 6-7, heavy 12, finisher 18 damage; grunt 30 HP / 8 damage / 450 ms telegraph as the Tier 0 anchor; every telegraph at least 300 ms): 36 HP is about 5 light hits, same damage as the grunt, 500 ms wind-up so the wide sweep reads one beat slower. Final.
- **enemies/rust-breaker**: The GDD defines Rust Bruisers, "The Breakers": massive shock troops on muscle stimulants (former criminals promised freedom for loyalty) for area denial, with three named moves: Gauntlet Smash, Rust Uppercut and Body Check. It gives no stats. The stat block and telegraph timings are proposed; the three moves are canon. Open question for the combat contract: ground bounce, block-break and super armour do not exist in the engine yet. Merged: replaces rust-enforcer. FINAL BALANCE (tuned against the combat contract: Zed light 6-7, heavy 12, finisher 18 damage; grunt 30 HP / 8 damage / 450 ms telegraph as the Tier 0 anchor; every telegraph at least 300 ms): 90 HP is about 5 heavy hits, 16 damage is two grunt hits, 700 ms wind-up and 1100 ms recovery give a big punish window. Final.
- **enemies/rust-watcher**: The GDD defines Rust Rangers, "The Watchers": agile units with taser rifles, batons and tracking visors that scan heat signatures, for long-range harassment, pursuit and reconnaissance, with two named moves: Taser Shot and Baton Strike. It gives no stats. Stats are proposed. Conflict to resolve: the GDD gives the Baton Strike a "very quick startup", but the readability rule keeps telegraphs at 300 ms or more, so this entry uses 350 ms. Merged: replaces rust-dart-marksman and rust-baton-scout. FINAL BALANCE (tuned against the combat contract: Zed light 6-7, heavy 12, finisher 18 damage; grunt 30 HP / 8 damage / 450 ms telegraph as the Tier 0 anchor; every telegraph at least 300 ms): 28 HP (fragile, rewards closing in), 7 damage per bolt, 650 ms taser wind-up, 350 ms baton wind-up. Final.
- **enemies/rust-copper-fang**: The GDD defines Rust Specialists, "The Copper Fangs": elite soldiers with electrified gauntlets, grappling hooks and tactical shields, Varr's personal favourites, conditioned to remove fear and hesitation, for high-priority targets and boss-tier encounters. The GDD now lists three Basic Attacks (Fang Jab, Copper Cross, Shield Bash), which are canon; the shield-breaking, grappling-hook and two-phase mini-boss structure and every number here are proposed. Merged: replaces rust-shield-sergeant. Tier 3. FINAL BALANCE (tuned against the combat contract: Zed light 6-7, heavy 12, finisher 18 damage; grunt 30 HP / 8 damage / 450 ms telegraph as the Tier 0 anchor; every telegraph at least 300 ms): 140 HP, 15 damage, 650 ms wind-up, 750 ms hook. Numbers final.
- **enemies/rust-halden-varr**: The GDD names Overseer Halden Varr, "The Architect of Rust", as the Main Boss (Corporate Tower command chamber, theme: authority, mastery, hybrid combat) with two phases and named moves, but no stats, numbers or timings. The moves and the 30 percent HP phase trigger are canon; every stat and wind-up below is proposed. GDD wording clashes with the tone rules in places (Rust described as executioners, "brutal"); this entry keeps Varr cold and official, and knocks Zed down rather than harming him lethally. Also: the GDD stance name "Antirush" is probably a typo and is recorded here as the anti-rush-down stance. FINAL BALANCE (tuned against the combat contract: Zed light 6-7, heavy 12, finisher 18 damage; grunt 30 HP / 8 damage / 450 ms telegraph as the Tier 0 anchor; every telegraph at least 300 ms): 320 HP is about 18 finishers and the top of the curve (grunt 30, Breaker 90, Fang 140, Architect 160); 18 damage on the fast Authority Strike keeps Zed alive for at least 5 hits; 400 ms is the shortest boss wind-up, justified by the GDD "fast startup", and stays above the 300 ms floor. Phase 2 (30 percent HP): moveSpeed x1.15, recoverMs x0.8, damage unchanged, so "relentless" comes from tempo and drones, not one-shots. Numbers final.
- **enemies/rust-overseer-voss**: The GDD names Overseer Kade Voss, "The Eye of the Market" (theme: surveillance, prediction, drones, holograms; arena: Neon Market control hub with screens, drones and hologram emitters). Phase 1 "Data Acquisition": Predictive Strike, Drone Swarm, Hologram Decoy, Data Spike. Phase 2 "System Override" at 50 percent HP: Predictive Lockdown, Drone Fusion, Hologram Assault, System Crash (super). Combat contract support needed: bullet-hell drone entities with their own HP, hologram decoys that can later attack, a 10 second special-meter lockout on Zed, a safe-zone floor hazard, and moving electric pillars. All Overseers are district bosses, strategic masterminds and Varr's inner circle, with a tactical, oppressive combat style and unique mechanics (GDD role line). Moves, phases, phase trigger and arena are canon; all numbers and timings are proposed. Zed is knocked down and pushed back, never put down for good. FINAL BALANCE (same method as Varr and the other tier 3 items; combat contract: Zed light 6-7, heavy 12, finisher 18 damage; grunt 30 HP / 8 damage / 450 ms as the anchor; every telegraph at least 300 ms; below Varr at 320 HP): 200 HP (a mobile ranged boss, fragile once reached), 10 damage per shot or pillar, 1000 ms Predictive Strike wind-up (the GDD says the shot fires after 1 s, so the red line is the telegraph). Numbers final.
- **enemies/rust-overseer-calder**: The GDD names Overseer Rhea Calder, "The Iron Matron" (theme: industrial power, machinery, brute force; arena: factory floor with conveyors, crushers and steam vents). Phase 1 "Discipline Through Strength": Forge Hammer Smash, Hydraulic Grab, Steam Burst Armor, Conveyor Trap. Phase 2 "Factory Protocol" at 40 percent HP: Overclock Mode, Industrial Barrage, Furnace Slam (super). Combat contract support needed: traveling floor shockwave, guard break, grab/throw with super armour during startup, temporary invulnerability, conveyor and crusher hazards, off-screen arm attacks, and delayed exploding floor cracks. All Overseers are district bosses, strategic masterminds and Varr's inner circle, with a tactical, oppressive combat style and unique mechanics (GDD role line). Moves, phases, phase trigger and arena are canon; all numbers and timings are proposed. Zed is knocked down and pushed back, never put down for good. FINAL BALANCE (same method as Varr and the other tier 3 items; combat contract: Zed light 6-7, heavy 12, finisher 18 damage; grunt 30 HP / 8 damage / 450 ms as the anchor; every telegraph at least 300 ms; below Varr at 320 HP): 260 HP (the tankiest of the four, slow brute), 20 damage on the Forge Hammer (the highest single hit besides the super, which is about 20 percent of a 100 HP player), 900 ms wind-up and 1300 ms recovery for the "slow but devastating" hammer. Numbers final.
- **enemies/rust-overseer-wren**: The GDD names Overseer Silas Wren, "The Whisper on the Rooftops" (theme: mobility, stealth, vertical control; arena: rooftop platforms, zip lines and breakable ledges). Phase 1 "Silent Hunter": GrappleDash Barrage, Skyline Snare, Silent Step, Rooftop Execution. Phase 2 "Ghost of the Skyline" at 50 percent HP: Grapple Clone, Shadow Pulse, Vanish Storm (super). Combat contract support needed: platform and vertical movement with attacks from above or behind, restraint traps, a semi-invisible state, a guaranteed-critical flag (no critical hit exists in the contract), afterimages that perform fake attacks, and multiple silhouettes. Tone note: the GDD move name "Rooftop Execution" is kept as canon but should be shown as a dive attack that knocks Zed down, never a lethal blow; the owner may prefer to rename it. All Overseers are district bosses, strategic masterminds and Varr's inner circle, with a tactical, oppressive combat style and unique mechanics (GDD role line). Moves, phases, phase trigger and arena are canon; all numbers and timings are proposed. Zed is knocked down and pushed back, never put down for good. FINAL BALANCE (same method as Varr and the other tier 3 items; combat contract: Zed light 6-7, heavy 12, finisher 18 damage; grunt 30 HP / 8 damage / 450 ms as the anchor; every telegraph at least 300 ms; below Varr at 320 HP): 180 HP (the most fragile, the fastest at 120 move speed), 14 damage, 400 ms wind-up for the "very fast" grapple dash, kept above the 300 ms floor; the dive uses 600 ms so grounded players can read it. Numbers final.
- **enemies/rust-overseer-holt**: The GDD names Overseer Dr. Maren Holt, "The Voice of Compliance" (theme: chemicals, toxins, psychological control; arena: undercity lab with gas vents, toxin pools and fog zones). Phase 1 "Chemical Control": Fear Gas, Obedience Mist, Toxin Burst, Sedative Shot. Phase 2 "Doctor's Orders" at 40 percent HP: NeuroFog, Corrosive Wave, Compliance Protocol (super). Combat contract support needed: control distortion and reversal on Zed, screen blur and reduced vision, movement slow and reduced dodge distance, lingering and spreading area damage zones, an attack-speed debuff, stealth attacks, damage over time, and damage that also hits Holt herself. Tone note: these are comic-book gas effects (blur, slow, reversed controls), not graphic harm; keep them clearly non-lethal. All Overseers are district bosses, strategic masterminds and Varr's inner circle, with a tactical, oppressive combat style and unique mechanics (GDD role line). Moves, phases, phase trigger and arena are canon; all numbers and timings are proposed. Zed is knocked down and pushed back, never put down for good. FINAL BALANCE (same method as Varr and the other tier 3 items; combat contract: Zed light 6-7, heavy 12, finisher 18 damage; grunt 30 HP / 8 damage / 450 ms as the anchor; every telegraph at least 300 ms; below Varr at 320 HP): 190 HP, 9 damage (the lowest, since her pressure is debuffs and zones), 600 ms wind-up for the vial throw. Numbers final.
- **levels/level-01-brick-red-alley**: The GDD says 'urban districts' and 'Defeat Wave / Clear Arena ... in time' but sets no level count, order, wave counts or time limit. Wave numbers and the 120 s limit copy the Tier 0 placeholders in src/waves/waveData.js and src/state/config.js, so they are engine-matched but not GDD-confirmed.
- **levels/level-02-mustard-row**: No level structure in the GDD. Introduces the Rust Baton Scout (proposed enemy) as the first new threat; wave sizes and 135 s limit are assumed.
- **levels/level-03-greenline-courts**: No level structure in the GDD. Introduces the Rust Enforcer (proposed bruiser) after the scout; waves vary arrival pattern (slow heavy waves, then a quick burst) rather than only raising counts.
- **levels/level-04-stewpot-gardens**: No level structure in the GDD. Introduces the Rust Dart Marksman (proposed ranged enemy) and pairs it with melee waves so the player must use lane movement. Also fields the named Overseer Dr. Maren Holt (rust-overseer-holt) as the district boss wave; the GDD gives Holt an undercity lab arena with gas vents and fog, so the garden planters and food-stall fog are only the closest fit (no GDD level for her; flag). Engine waves hold one enemy type each and counts cannot shrink, so the boss wave keeps the wave count of 5 with maxAlive 1 until boss-encounter waves exist (further gap). 180 s limit assumed.
- **levels/level-05-songwindow-heights**: No level structure or final-level beat in the GDD (narrative review notes the premise has no ending). Introduces the Rust Shield Sergeant (proposed elite); the finale mixes every enemy type including the named Overseer Silas Wren (rust-overseer-wren), whose GDD arena is rooftop platforms and zip lines, the best fit for the Heights (his wave keeps count 6 with maxAlive 1 because counts cannot shrink); 210 s limit assumed. Five levels is an assumption.
- **levels/level-06-iron-line-push**: The GDD sets no level count, tiers or level list. This is an extra proposed level (order 6, after the five in levels.json) that introduces the GDD-named Rust units in escalation: Iron Line cordon, then Watchers, then Breakers. Wave numbers and the 150 s limit are placeholders in the Tier 0 shape. Uses the proposed expansion enemies from rust-gdd-units.json, so it depends on owner approval of those.
- **levels/level-07-copper-fang-courts**: The GDD says Copper Fangs serve boss-tier encounters but gives no level list, tiers or boss placement. This proposes a mini-boss level (order 7): a ladder of single units rising Watcher, Breaker, Copper Fang. Each wave has count 1 because the validator requires wave counts not to shrink, so a lone boss wave must follow count-1 waves; mixed-escort boss waves need a schema extension (one enemy per wave today).
- **levels/level-08-overseer-tower**: The GDD gives Overseer Halden Varr, "The Architect of Rust", the Main Boss slot in the Corporate Tower command chamber, but defines no level list or tiers. This proposes the end-level boss encounter (order 8) as the last level of the Rust push, against Varr. Varr's own summons (Command Override, Drone Command) are behaviour in rust-gdd-units.json, not wave data, so waves here are a single-unit ladder (counts cannot shrink; one enemy type per wave). The district id is the closest existing lore district (Songwindow Heights, surveillance tower and screens); the Corporate Tower arena itself is not yet a district, a GDD gap. The named Overseers Kade Voss (Neon Market) and Rhea Calder (Factory floor) have no level yet.
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
- **dialogue/options-screen-title**: GDD names the OPTIONS strip but defines no Options screen; title wording and sub-line are new. OPTIONS itself is canon (menu-copy).
- **dialogue/options-header-audio**: GDD lists only music and SFX volume; the category grouping and header wording are new.
- **dialogue/options-header-video**: GDD defines no video settings; header and grouping are new.
- **dialogue/options-header-gameplay**: GDD defines no gameplay settings; header is new.
- **dialogue/options-header-accessibility**: GDD has no accessibility requirements; header is new. Fits the hopeful, community tone (everyone gets a seat).
- **dialogue/options-master-volume**: GDD defines Music volume and SFX volume only; a master volume slider is new. Fits as the parent of the two canon sliders.
- **dialogue/options-mute-on-focus-loss**: GDD is silent on audio focus behaviour. pause.md auto-pauses on tab blur (OQ-P3); this setting covers whether sound also drops.
- **dialogue/options-screen-shake**: GDD asks for punchy hits and hit feedback but sets no shake setting; scaling it is new.
- **dialogue/options-hit-flash**: GDD asks for hit stop and feedback; a flash intensity control is new, added for photosensitivity comfort.
- **dialogue/options-timer-visibility**: GDD has a timer and a time-out lose rule but no setting to hide it; an option is new, for players who find a ticking clock stressful.
- **dialogue/options-notice-display**: Menu notices (main-menu.md toast, 2 s) exist but have no setting; how long they stay is new.
- **dialogue/options-reduced-motion**: GDD has no accessibility settings; reduced motion is new. Fits the menu's tilting, sliding strips (main-menu.md selected state).
- **dialogue/options-high-contrast**: GDD gives a palette but no high-contrast mode; this option is new and needs Art sign-off on the alternate palette.
- **dialogue/options-text-size**: GDD sets no text sizes; flow.md A4 sets 24 px minimum body text. A scaling option is new.
- **dialogue/options-back**: Back behaviour on Options is new; main-menu.md Back input (Esc/B) exists for the Controls panel only.
- **dialogue/options-reset-defaults**: Reset behaviour is new; no Options spec in the GDD.
- **dialogue/options-apply**: Apply and its confirmation are new; no Options spec in the GDD.
- **dialogue/options-unsaved-notice**: Unsaved-change warning is new; no Options spec in the GDD.
- **dialogue/rust-notice**: GDD mentions 'security violations' and the Rust surveilling districts; numbered curfew notices are only implied by the menu poster (canon open question 1).
- **dialogue/rust-taunt**: GDD gives no enemy speech; these are cold, official lines extending the Rust as a bureaucratic security force.
- **dialogue/neighbour-cheer**: GDD says people on the block look out for each other but gives no neighbour lines.
- **dialogue/poster-rust-notice-114**: Rust Notice 114 with CURFEW struck through appears only in the menu concept, not the primary GDD (canon open question 1).
- **dialogue/poster-small-print**: Small print is marked proposed in menu-copy.md; community flavour from the lived-in neighbourhood theme.
- **dialogue/rust-notice-doctrine**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/rust-notice-serial-rollcall**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/rust-notice-sealed-district**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/rust-overseer-announcement**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/rust-varr-order**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/neighbour-defaced-doctrine**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/neighbour-answers-serial**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/neighbour-answers-curfew**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/zed-answers-overseer**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/zed-answers-varr**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/rust-iron-line-spawn**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/rust-iron-line-telegraph**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/rust-iron-line-pushed-back**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/zed-answers-iron-line**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/rust-breaker-spawn**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/rust-breaker-telegraph**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/rust-breaker-pushed-back**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/zed-answers-breaker**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/rust-watcher-spawn**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/rust-watcher-telegraph**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/rust-watcher-pushed-back**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/zed-answers-watcher**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/rust-copper-fang-spawn**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/rust-copper-fang-telegraph**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/rust-copper-fang-pushed-back**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/zed-answers-copper-fang**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/rust-halden-varr-spawn**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/rust-halden-varr-telegraph**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/rust-halden-varr-pushed-back**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
- **dialogue/zed-answers-halden-varr**: The GDD gives the Rust doctrine, serial numbers and unit types but no spoken lines; these are voice flavour in that register, answered by the community, for the owner to approve.
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
