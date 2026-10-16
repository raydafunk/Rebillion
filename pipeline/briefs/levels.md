# Content brief: levels
_Generated 2026-10-16T15:20:39.838Z by pipeline/brief.mjs. Regenerate with `node pipeline/brief.mjs levels`; do not hand-edit._

**Writer agent:** level-designer-agent  |  **Output dir:** `content/levels/`  |  **Produces:** District levels: arena theme, wave plans, time limits, intro/outro beats.

## Rules (non-negotiable)
1. Ground every item in the GDD. Cite corpus chunk ids in `sources` (ids are the `[...]` tags below). Cite only chunks you actually used.
2. Never invent lore silently. If the GDD states it, `status: "canon"`. If you are extending it, `status: "proposed"` and fill `gddGap` (which gap, why it fits). The owner approves proposals.
3. Authority order when sources disagree: **primary** (owner's GDD docx) > **derived** (specs in design/) > **reference** (PDF drafts, review kit, README). The GDD pitch contains the typo "Rush": the name is **Rust**. The city is **the Fallen City**.
4. Voice: hopeful, energetic, full of personality; Zed's side warm and plain-spoken; the Rust cold and official but always answered or defaced by the community. Never grim, gory, sneering or military. Enemies are pushed back or knocked down, never killed.
5. Numbers stay in engine units and near the engine's Tier 0 values (see engine files). Do not edit anything under `src/`.
6. Banned patterns (the validator rejects them): `\bRush\b` (typo for "Rust" (the GDD pitch has this typo; never copy it)); `\bRusts\b` ("the Rust" is a collective: no "Rusts"); `\bFallen\b(?!\s+City)` ("Fallen" alone; say "the Fallen City"); `\bfallen city\b` (lower-case city name; write "Fallen City"); `\b(driven|pushed|kicked|cleared)\s+out\s+of\s+the\s+Rust\b|\bthe Rust (zone|area|smell|stain)\b` (Rust treated as a place or stain; it is a force of people); `\b(TARGETS? ELIMINATED|MISSION COMPLETE|HOSTILES? NEUTRALI[SZ]ED|NEUTRALI[SZ]E)\b` (military/clinical phrasing on Zed's side); `\b(YOU DIED|PATHETIC|LOSER|GAME OVER)\b` (gloating or grim lose-screen copy); `\b(gore|gory|blood|bloody|corpse|dismember\w*|brains|entrails|slaughter\w*|massacre\w*)\b` (gore; tone is never gory); `\b(kill|kills|killed|killing|murder\w*)\b` (lethal wording; enemies are knocked down / pushed back).
7. Write JSON files to `content/levels/` (one item object or an array per file, UTF-8). Then run `node pipeline/validate.mjs levels` and fix every error before you report back.

## Schema
Each item has these fields:
```json
{
  "id": "string, kebab-case, unique within its type",
  "status": "one of canon | proposed",
  "gddGap": "string; REQUIRED when status is \"proposed\", otherwise omit",
  "sources": "array of corpus chunk ids (at least 1)",
  "name": "string",
  "order": "integer >= 1, play order",
  "district": "string, lore id of the district or location (must exist in content/lore)",
  "theme": "string, the lived-in setting (corner shops, murals, food stalls...)",
  "palette": "array of 3-5 hex strings from the GDD palette family (mustard, brick red, forest green, warm browns)",
  "timeLimitSec": "integer 30-600",
  "intro": "string, <= 200 chars, shown on level start",
  "outro": "string, <= 200 chars, shown on level won",
  "waves": "array of { enemy (enemy id; \"grunt\" is the built-in Tier 0 enemy), count, maxAlive, spawnIntervalMs, startDelayMs } - same fields as src/waves/waveData.js"
}
```
Example:
```json
{
  "id": "level-01-brick-red-alley",
  "status": "proposed",
  "gddGap": "GDD does not define levels beyond \"urban districts\"",
  "name": "Brick-Red Alley",
  "order": 1,
  "district": "brick-red-alley",
  "theme": "...",
  "palette": [
    "#9C3B2E",
    "#E1A92B",
    "#2F5D3A"
  ],
  "timeLimitSec": 120,
  "intro": "...",
  "outro": "...",
  "waves": [
    {
      "enemy": "grunt",
      "count": 3,
      "maxAlive": 3,
      "spawnIntervalMs": 900,
      "startDelayMs": 800
    }
  ],
  "sources": [
    "the-rebellion#3"
  ]
}
```

## Already exists (extend, don't duplicate)
- `level-01-brick-red-alley` Brick-Red Alley (content/levels/levels.json)
- `level-02-mustard-row` Mustard Row (content/levels/levels.json)
- `level-03-greenline-courts` Greenline Courts (content/levels/levels.json)
- `level-04-stewpot-gardens` Stewpot Gardens (content/levels/levels.json)
- `level-05-songwindow-heights` Songwindow Heights (content/levels/levels.json)
- `level-06-iron-line-push` The Iron Line Push (content/levels/rust-gdd-levels.json)
- `level-07-copper-fang-courts` Copper Fang at the Courts (content/levels/rust-gdd-levels.json)
- `level-08-overseer-tower` The Overseer's Tower (content/levels/rust-gdd-levels.json)

### Upstream `enemies` content you may reference
- `rust-iron-line-cordon` Rust Iron Line Cordon
- `rust-breaker` Rust Breaker
- `rust-watcher` Rust Watcher
- `rust-copper-fang` Rust Copper Fang
- `rust-architect` Rust Architect
- `rust-grunt` Rust Grunt

### Upstream `lore` content you may reference
- `open-windows-music` Open Windows with Music
- `street-tournaments` Street Tournaments and Late-Night Sparring
- `corner-shops` The Corner Shops
- `zeds-mission` Taking the City Back
- `zeds-colours` Zed's City Colours
- `neighbours-and-friends` The Quiet After the Takeover
- `rust-grunt` Rust Grunt
- `zed` Zed
- `zeds-mother` Zed's Mother
- `zeds-father` Zed's Father
- `fallen-city` The Fallen City
- `brick-red-alley` Brick-Red Alley
- `food-stall` The Food Stall
- `community-garden` The Community Garden
- `basketball-courts` The Basketball Courts
- `local-heroes-murals` The Local Heroes Murals
- `surveillance-towers` Surveillance Towers and Propaganda Screens
- `the-neighbourhood` The Neighbourhood
- `the-rust` The Rust
- `rust-takeover` The Takeover
- `rust-notice-114` Rust Notice 114
- `local-heroes-benefit` Local Heroes Benefit
- `mustard-row` Mustard Row
- `greenline-courts` Greenline Courts
- `stewpot-gardens` Stewpot Gardens
- `songwindow-heights` Songwindow Heights
- `rust-origin` How the Rust Got Their Foot in the Door
- `commander-halden-varr` Commander Halden Varr
- `rust-takeover-timeline` Within Months: Curfews, Sealed Districts and Drones
- `rust-doctrine` Order is Strength. Freedom is Weakness.
- `rust-serial-numbers` Serial Numbers
- `rust-grunts-iron-line` Rust Grunts: The Iron Line
- `rust-bruisers-breakers` Rust Bruisers: The Breakers
- `rust-rangers-watchers` Rust Rangers: The Watchers
- `rust-copper-fangs` Rust Specialists: The Copper Fangs
- `rust-overseers` Rust Overseers: The Architects of Control
- `rust-rank-ladder` The Rust Ladder
- `neighbourhood-answer-to-doctrine` The Wall Answers Back

## Engine / spec files to stay compatible with
#### src/waves/waveData.js
```
// Wave table (Tier 0): 3 waves of 3, 4, 5 grunts (placeholder counts, see contracts.md).
// lockX = camera scrollX held while the wave is active. spawnPoints are world coordinates,
// just inside the locked view edges, alternated round-robin.
// All times in ms.
const VIEW_W = 1280;
const sides = (lockX) => [
  { x: lockX + 60, y: 520 },
  { x: lockX + VIEW_W - 60, y: 580 },
  { x: lockX + 60, y: 640 },
  { x: lockX + VIEW_W - 60, y: 500 },
];

export const WAVES = Object.freeze([
  { enemy: 'grunt', count: 3, maxAlive: 3, spawnIntervalMs: 900, startDelayMs: 800, lockX: 0,   spawnPoints: sides(0) },
  { enemy: 'grunt', count: 4, maxAlive: 3, spawnIntervalMs: 800, startDelayMs: 1500, lockX: 320, spawnPoints: sides(320) },
  { enemy: 'grunt', count: 5, maxAlive: 4, spawnIntervalMs: 700, startDelayMs: 1500, lockX: 640, spawnPoints: sides(640) },
]);
```

#### src/arena/arenaData.js
```
// Arena geometry and failsafe tuning (Tier 0). Pixels / ms. Tune here only.
export const VIEW = Object.freeze({ w: 1280, h: 720 });
export const WORLD = Object.freeze({ w: 1920, h: 720 });
// Walkable floor band (entity origin = feet).
export const LANE = Object.freeze({ minY: 460, maxY: 680 });
// Horizontal padding keeping fighters inside the locked screen.
export const LOCK_MARGIN = 40;

export const FAILSAFE = Object.freeze({
  offscreenMargin: 120,   // px outside the view before an enemy counts as off-screen
  offscreenMs: 2500,      // off-screen this long -> reposition
  stuckMs: 4000,          // chasing but barely moving this long -> reposition
  stuckMinMove: 12,       // px moved within the stuck window counts as "moving"
  maxTeleports: 3,        // after this many repositions, remove the enemy
  checkEveryMs: 250,
});
```

#### src/state/config.js
```
// Placeholder round rules (GDD gaps; see contracts.md open questions).
export const ROUND_TIME_SECONDS = 120;
export const MAX_RETRIES = Infinity; // unlimited
export const WAVES = Object.freeze([
  Object.freeze({ enemy: 'grunt', count: 3 }),
  Object.freeze({ enemy: 'grunt', count: 4 }),
  Object.freeze({ enemy: 'grunt', count: 5 }),
]);
```

## Retrieved GDD passages (21)
### [the-rebellion#1] primary - GameDesignDocument/The Rebellion.docx
The Rebellion
Fists of the Fallen City
A Face Paced 2d Side Scrolling Brawler that lets you fight back against Corrupt private security force.
Executives Sections
The Pitch
The Rebellion first of the Fallen city is a Fast-paced 2D side-scrolling brawler where players fight through urban districts overtaken Rust a corrupt private Security Force. The game blends classic beat-‘me-up mechanics with modem combo systems character progression, and dynamic enemy behaviours. Take control of Zed and fight your way through Fallen to get it back.
The 3 Pillars of Game Play
[table]
Impactful, Fast-paced combat | Skill depth through combos and Defence | Wave-clearing under pressure
Punchy hits" with light and heavy attacks and pick-up objects, in a fast 2D side-scrolling brawl. | Combos and Juggle routes" on offense, plus block, dodge, and parry on defence. | Enemies spawn in waves, and the player must "Defeat Wave / Clear Arena to win the level in time frame", tracked by the Timer Agent.
The Win and Lose conditions.

### [the-rebellion#2] primary - GameDesignDocument/The Rebellion.docx
[table]
Win conditions | Lose conditions
Fight you way to the end of the level while beating Rust Enemies | Get knocked out by health bar or if time runs out
Core Loop of the game.
Wave Cleared
Enter City Level begins
Enemies Spawn
Fight
Combat tools
Level Won
Reach the end.
Lose State
Next Level begins
Game a loop.
game
Game Mechanics -what the players does.
Impactful Combat – punchy hits Players moves into an Areas were light and heavy pick-up objects.
Combos and Juggle routes
Defensive tools(block dodge, parry)
Enemies spawn to fight.
Defeat Wave / Clear Arena to win the level in time.
AI Architecture Team

### [the-rebellion#5] primary - GameDesignDocument/The Rebellion.docx
[table]
Agent | Technical constraint | Desponds On | Budget
Player Mechanics | Sprite animations for idle, walk, jump; input handling | Asset & Animation Lead | Token coast to make at least one character to move two hundred tokens
Player combos Agent | One state machine for attacks | Player Mechanics | Token Cost to make the combos work 200 tokens
Health & Hitbox Agent | Shared damage, health, and hitbox data that every agent reads | None | Size is medium so medium
Enemy Agent | Chase and attack behaviour, attacker cap, one enemy type first | Health & Hitbox, Asset & Animation / Asset & Animation | It is large as it will run the enemy note
Game State Agent | Win check, lose state, time-out result, retry | Health & Hitbox Agent | Medium cost of token
Wave Spawner | Spawn triggers, rate, cap, and positions | Enemy Agent | 
Asset & Animation Lead | Sprite source, animation list, hit stop, and feedback | None | Large as it runs the Animation
Camera & Bounds Agent (new) | Arena camera lock, world bounds, unreachable-enemy failsafe | Wave Spawner | 
Menu & UI Agent | HUD (health, timer), win/lose screens, menus | Game State, Health & Hitbox | Medium Token use as well
Team Lead agent | Builds the Agent Orchestration |  | 

### [the-rebellion#6] primary - GameDesignDocument/The Rebellion.docx
Game Engine
Phaser
Why Phaser is use for the game building for now.
2D side-scrolling: Phaser is built for 2D and has Arcade physics, sprite animation, and input handling.
Prototype goal: the GDD says Phaser is for "creating a playable prototype". It runs in the browser with no install, so playtesting and sharing a build are easy.
AI-assisted build: the Technical Strategy budgets in tokens, which suggests AI agents write the code. Phaser uses JavaScript or TypeScript, which AI agents oversee well, and it has plenty of documentation and examples.
Small scope: Tier 0 is one character, one enemy type, waves, and a timer. Phaser manages that without much setup.
Theme of the game
Background Themes
Takeaway: Livedin, human, culturally rich.
Corner shops, murals celebrating local heroes, open windows with music drifting out
Basketball courts, food stalls, community gardens
Characters feel connected — casual fits, expressive colours
Colour palette: mustard yellow, brick red, forest green, warm browns
Atmosphere: hopeful, energetic, full of personality and stories
The Story

### [the-rebellion#9] primary - GameDesignDocument/The Rebellion.docx
Skill depth through combos and defence — he learned to juggle, dodge, and parry from street tournaments and late-night sparring behind corner shops.
Wave-clearing under pressure — fighting groups is nothing new; he grew up protecting younger kids from trouble.
He fights not for glory, but to reclaim the places that shaped him — the food stalls, the murals, the music drifting from open windows. The city isn’t just his home; it’s his identity.
Zed’s Personal Mission
Zed’s goal is simple: Take Fallen City back, one district at a time.
Every wave he clears, every arena he survives, every enemy he knocks down brings him closer to finding out what happened to his father — and to restoring the community that raised him.
He fights so kids can play in the basketball courts again. He fights so music can drift from open windows again. He fights so murals can rise again, celebrating real heroes — not corporate tyrants.
Tone & Personality

### [the-rebellion#7] primary - GameDesignDocument/The Rebellion.docx
Character – the hero
Zed — The Boy from BrickRed Alley
Zed grew up in the heart of Fallen City, in a neighbourhood painted with “corner shops, murals celebrating local heroes, open windows with music drifting out” . His block was known for its mustardyellow storefronts, forestgreen basketball courts, and the brickred alley where kids learned to fight, dance, and argue like family. It wasn’t perfect, but it was alive — culturally rich, loud, hopeful, and full of people who looked out for each other.
His mother ran a tiny food stall near the community garden, serving hot bowls of stew to anyone who needed a meal. His father, a muralist, painted the faces of local heroes across the district walls — cooks, musicians, activists, teachers — everyday people who kept Fallen City standing. Zed grew up believing that strength wasn’t about power; it was about protecting the people who gave your life meaning.
The Fall of Fallen City

### [the-rebellion#3] primary - GameDesignDocument/The Rebellion.docx
[table]
Agent | Development role | Gameplay Effect
Player Mechanics agent | Movement, jump, input handling | The player moves and feels responsive
Player combos Agent | One state machine for attacks, combos, cancel windows, hit stun | Light and heavy attacks chain into combos
Enemy Agent | Control the A.I Enemies | This will control the Enemies in the game
Game State Agent | Win check, lose state, time-out result, retry | Clear the arena to win; fail and retry have rules
Wave Spawner | Win check, lose state, time-out result, retry | Difficulty comes from how waves arrive
Asset & Animation Lead | Sprite source, animation list, hit stop and feedback | Punchy hits" and readable telegraphs
Health & Hitbox Agent | Owns health, damage values, and hitbox/hurt box data | Hits land, damage registers, the player can die
Camera & Bounds Agent (new) | Arena camera lock, world bounds, unreachable-enemy failsafe | Prevents the off-screen soft lock
Menu & UI Agent | Builds and owns every screen and on-screen element the player sees outside the arena action |  | The player can start a game, read the state of the fight, and see why they won or lost

### [win#2] derived - design/ux/win.md - Purpose
Tell the player they won **and why**. The GDD win condition is: "Fight your way to the end of the level while beating Rust enemies" and "Defeat Wave / Clear Arena ... in time". The screen must show that the arena was cleared and that it was done in time, using real numbers from the run.

### [win#10] derived - design/ux/win.md - Open questions
- OQ-W1. What exactly is the win condition: clear all waves, or reach an end-of-level point? The GDD says both "Fight your way to the end of the level while beating Rust Enemies" (p.2) and "Defeat Wave / Clear Arena" (p.2, p.4). The core loop (p.3) shows "Wave Cleared -> Level Won, Reach the end". This spec assumes the arena clearing is the win, which makes the "reached exit" reason a Later item.
- OQ-W2. Are the four stats the right ones? They are the minimum to show "why" and are cheap, but each needs an emitter. If any is unavailable, drop the row rather than showing 0.
- OQ-W3. Is there a Next Level for Tier 0? (`flow.md` OQ-F2.)
- OQ-W4. Should a win need a time-remaining bonus or grade to give the player a reason to replay (pillar 2, skill depth)? Deferred, but the data above already supports it.

### [canon#4] derived - design/lore/canon.md - World (from Theme)
Lived-in, human, culturally rich. Corner shops, murals celebrating local heroes, open windows with music, basketball courts, food stalls, community gardens. Casual fits, expressive colours.

### [asset-manifest#8] derived - design/art/asset-manifest.md - Arena background
| Key | Filename | Size | Format | Frames | Owner |
|---|---|---|---|---|---|
| bg.arena.01 | assets/backgrounds/arena-01-placeholder.svg | 1920x720 | SVG now, PNG final | 1 | ART |
1920 wide gives 640px of camera scroll over a 1280 viewport. Play lane y 440 to 680. Final should be split into far and near parallax layers (open question). Theme: corner shop, mural, basketball hoop, food stall, planters.

### [hud#5] derived - design/ux/hud.md - Layout table
Health bar sits left because the player character commonly starts left and reads left-to-right. Timer sits right so that the two critical survival numbers frame the wave info in the middle. HUD is anchored to the viewport, not the world, and does not move with the camera.
The HUD must not overlap the action zone. The arena camera and floor (Camera & Bounds Agent) should keep characters below y=120 where possible. Flagged in OQ-H4.

### [narrative-critic#1] reference - gdd-review-kit-main/reviews/narrative-critic.md - 1. The story promise has no story behind it (BLOCKING)
**Problem:** The document sets up a narrative premise (rebellion, fallen city, corrupt security force) but contains no story, protagonist, arc, or ending. The premise is a title, not a narrative.
**Passage:** The subtitle "Fists of the Fallen City" and the tagline "fight back against Corrupt private security force" are the only narrative content. The Pitch adds "urban districts overtaken Rush a corrupt private Security Force." There is no section for story, characters, setting history, or endings. The mechanics list ends at "Defeat Wave / Clear Arena to win the level in time frame."
**Why it matters:** "Rebellion" implies a movement, stakes, and escalation. The structure (clear arena, beat the timer, repeat) delivers only repetition. Nothing says why the player fights, what winning a level changes, or what the final victory looks like.

### [feasibility-lead#5] reference - gdd-review-kit-main/reviews/feasibility-lead.md - Finding 5: Success criteria and the definition of "prototype" are vague, and the cost model has no cut plan
- Problem: The budget is a single unit ("tokens") with no conversion to time or cost, and the 200-token figures are unfalsifiable. The document doesn't say what happens if estimates are exceeded. Levels are won by "Defeat Wave / Clear Arena ... in time frame", but there is no level count, no time-limit tuning approach, and no minimum viable slice.
- Passage: "200 tokens" entries; "Defeat Wave / Clear Arena to win the level in time frame".
- Severity: MINOR (compounds Finding 1)

### [adversarial-qa#1] reference - gdd-review-kit-main/reviews/adversarial-qa.md - Finding 1: Win condition and fail state are contradictory or undefined (BLOCKING)
**Problem:** The document gives two different win conditions and no lose condition. "Defeat Wave / Clear Arena to win the level in time frame" is ambiguous. It could mean clearing every wave, clearing the arena, or surviving until the timer ends. Nothing says what happens if the timer expires with enemies still alive. Nothing says what happens if the player's health reaches zero. There is no lives, continue or retry rule.
**Source:** Game Mechanics: "Defeat Wave / Clear Arena to win the level in time frame". Timer Agent: "Keep trick of the time the player has to beat the level". Game Loop Agent: "Control the level and win condition". No section mentions failure, death, game over or a health system.
**Exploits and edge cases:** Does killing the last enemy at 0:00 count as a win? Can a player stall a wave so it never completes? What if an enemy is knocked off-screen or stuck (side-scroller with a "juggle" system) and cannot be reached? The arena can then never be "cleared" and the level soft-locks until the timer runs out.

### [adversarial-qa#2] reference - gdd-review-kit-main/reviews/adversarial-qa.md - Finding 2: Enemy spawning has no rules, so the wave system can be broken or become unwinnable (MAJOR)
**Problem:** "Enemies spawn to fight" is the entire spawn spec. Nothing defines spawn triggers, caps, rates, positions or whether spawns are timer-driven or clear-driven. If spawns are time-driven, a player who is slow (or one who hoards enemies with juggles) faces unbounded enemy accumulation. If spawns are clear-driven, a player can stand at an edge and exploit spawn positions. It is also unclear whether enemies spawn inside the player's attack range or behind the player.
**Source:** "Enemies spawn to fight", "Enemy Agent: Control the A.I Enemies" (no behavior described), and the Pitch's claim of "dynamic enemy behaviours" with no definition.
**Exploits and edge cases:** Juggle routes are advertised ("Combos and Juggle routes"). There are no rules on infinite combos, enemy hit-stun decay, or boss and heavy-enemy immunity. This is the classic brawler exploit and the document does not address it.

### [the-rebellion-final-gdd#4] reference - PDf/The Rebellion- Final Gdd.pdf
Agent Technical Desponds Budget constraint On Player Sprite Asset & Token coast to Mechanics animations for Animation make at least idle, walk, jump; Lead one character to input handling move two hundred tokens Player combos One state Player Token Cost to Agent machine for Mechanics make the attacks combos work 200 tokens Health & Shared damage, None Size is medium Hitbox Agent health, and so medium hitbox data that Health & Enemy Agent every agent Hitbox, It is large as it reads Asset & will run the Game State Chase and Animation enemy note Agent attack Asset & Wave Spawner behaviour, Animation Medium cost of Asset & attacker cap, Health & token Animation Lead one enemy type Hitbox first Agent Large as it runs Win check, lose Enemy the Animation state, time-out Agent result, retry Spawn triggers, None rate, cap, and positions Sprite source, animation list, hit stop, and feedback Camera & Arena camera Wave Bounds Agent lock, world Spawner (new) bounds, unreachable- Game State, Medium Token Menu & UI enemy failsafe Agent HUD (health, Health & use as well timer), win/lose screens, menus Hitbox

### [systems-designer#8] reference - gdd-review-kit-main/reviews/systems-designer.md - 2. CONNECTIONS
**QA F2 (spawn rules) + my F4 (no numbers) = the difficulty curve has no control variable.** QA shows that time-driven versus clear-driven spawning produces opposite failure modes (unbounded accumulation versus edge exploits). I flagged missing spawn rate and caps. Combined, the point is that spawn logic is the only lever this design has for difficulty, because there are no enemy types and no progression. Since the Enemy Agent owns behavior and the Game Loop Agent owns the win condition, and neither is budgeted (QA F5), the one lever that sets difficulty has no owner and no cost. Neither of us saw that alone.

### [feasibility-lead#12] reference - gdd-review-kit-main/reviews/feasibility-lead.md - 2. CONNECTIONS
**Business Analyst F5 (Combos constraint is "Same as the player mechanics") plus QA F5 and my F5.** The only two numbers in the document may double-count one shared animation pipeline, and three other agents have no numbers. The total cannot be summed from what is written.
**Spawn logic as the only difficulty lever (Systems Designer connection to QA F2).** With no enemy roster or progression, spawn rate and caps are the only knob. Implementing that requires the Enemy and Game Loop agents to share a spawn interface that the document never defines. I did not see this without both colleagues.

### [the-rebellion-final-gdd#2] reference - PDf/The Rebellion- Final Gdd.pdf
Win conditions Lose conditions Fight you way to the end of the Get knocked out by health bar level while beating Rust or if time runs out Enemies Core Loop of the game.
Enter City Level Enemies Fight Wave Cleared begins Spawn Combat tools
Lose State Level Won Reach the end. Next Level begins Game a loop. game Game Mechanics -what the players does.
� Impactful Combat � punchy hits Players moves into an Areas were light and heavy pick-up objects.
� Combos and Juggle routes � Defensive tools(block dodge, parry)
Enemies spawn to fight.
� Defeat Wave / Clear Arena to win the level in time. AI Architecture Team
Agent Development role Gameplay Effect Player Mechanics Movement, jump, The player moves agent input handling and feels responsive Player combos Agent One state machine Light and heavy for attacks, combos, attacks chain into cancel windows, hit combos stun

### [the-rebellion-final-gdd#3] reference - PDf/The Rebellion- Final Gdd.pdf
Enemy Agent Control the A.I This will control the Game State Agent Enemies Enemies in the game Win check, lose Clear the arena to Wave Spawner state, time-out win; fail and retry result, retry have rules Asset & Animation Win check, lose Difficulty comes Lead state, time-out from how waves Health & Hitbox result, retry arrive Agent Sprite source, Punchy hits" and Camera & Bounds animation list, hit readable telegraphs Agent (new) stop and feedback Owns health, Hits land, damage Menu & UI Agent damage values, and registers, the player hitbox/hurt box data can die Arena camera lock, Prevents the off- world bounds, screen soft lock unreachable-enemy failsafe The player can Builds and owns start a game, read every screen and on- the state of the screen element the fight, and see why player sees outside they won or lost the arena action Technical Strategy

## Need more?
`node pipeline/search.mjs "<query>" -k 8 --full` searches all 368 chunks across 38 documents.
