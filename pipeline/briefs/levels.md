# Content brief: levels
_Generated 2026-10-30T07:45:28.075Z by pipeline/brief.mjs. Regenerate with `node pipeline/brief.mjs levels`; do not hand-edit._

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
  "waves": "array of { enemy (enemy id; \"grunt\" is the built-in Tier 0 enemy), count, maxAlive, spawnIntervalMs, startDelayMs } - same fields as src/waves/waveData.js. Pacing fields (all optional except restPickup and spawnPattern, see rules): spawnPattern = where enemies enter, one of alternate | flank | ambush | surge (REQUIRED on every wave: alternate = left/right in turn, flank = pairs from each side, ambush = from behind Zed with every third from the front, surge = a wall from the far side); restPickup { heal 1-100 } = health item dropped on the walk to the next wave, REQUIRED on every wave except the last; attackerCap integer >= 1 = enemies allowed to attack at once; hpMult 1-10 = health multiplier for every enemy of the wave (tough specials and bosses); elites + eliteHpMult (grunt waves only) = the last N spawns become 3x-health Breakers"
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
      "count": 4,
      "maxAlive": 2,
      "spawnIntervalMs": 900,
      "startDelayMs": 600,
      "spawnPattern": "alternate",
      "attackerCap": 2,
      "restPickup": {
        "heal": 15
      }
    },
    {
      "enemy": "grunt",
      "count": 6,
      "maxAlive": 3,
      "spawnIntervalMs": 800,
      "startDelayMs": 1000,
      "spawnPattern": "flank",
      "attackerCap": 2
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

## Uncovered GDD names (write these FIRST)
_none detected. Still add new items: pick open questions from design/lore/canon.md or the Focus line, mark them `proposed`._

### Upstream `enemies` content you may reference
- `rust-brick-dugan` "Brick" Dugan
- `rust-railgun-royce` "Railgun" Royce
- `rust-crusher-kane` "Crusher" Kane
- `rust-glitch` "Glitch"
- `rust-raptor` "Raptor"
- `rust-holts-experiment-subject-88` Dr. Holt's Experiment "Subject 88"
- `rust-commander-atlas` Commander Atlas
- `rust-sentinel-x9` Sentinel-X9
- `rust-iron-line-cordon` Rust Iron Line Cordon
- `rust-breaker` Rust Breaker
- `rust-watcher` Rust Watcher
- `rust-copper-fang` Rust Copper Fang
- `rust-halden-varr` Overseer Halden Varr
- `rust-overseer-voss` Overseer Kade Voss
- `rust-overseer-calder` Overseer Rhea Calder
- `rust-overseer-wren` Overseer Silas Wren
- `rust-overseer-holt` Overseer Dr. Maren Holt
- `rust-voss-drone` Rust Surveillance Drone
- `rust-voss-megadrone` Rust MegaDrone
- `rust-hologram-decoy` Rust Hologram Decoy
- `rust-elite-drone` Rust Elite Drone
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
- `iron-line-push` Iron Line Push
- `copper-fang-courts` Copper Fang Courts
- `overseer-tower` Overseer Tower
- `brick-dugan` "Brick" Dugan
- `railgun-royce` "Railgun" Royce
- `crusher-kane` "Crusher" Kane
- `glitch` "Glitch"
- `raptor` "Raptor"
- `holts-experiment-subject-88` Dr. Holt's Experiment "Subject 88"
- `commander-atlas` Commander Atlas
- `sentinel-x9` Sentinel-X9
- `rust-notice-114` Rust Notice 114
- `local-heroes-benefit` Local Heroes Benefit
- `mustard-row` Mustard Row
- `greenline-courts` Greenline Courts
- `stewpot-gardens` Stewpot Gardens
- `songwindow-heights` Songwindow Heights
- `zeds-rage` Zed's Rage
- `rage-meter` The Rage Meter
- `rage-clean-streak` Staying Clean
- `rage-ready` Rage Ready
- `zeds-special-move` Zed Rage
- `rage-ending` When the Rage Settles
- `rage-is-for-the-neighbourhood` Not Hatred, Not a Grudge
- `rage-grief-into-fire` Grief Turning to Fire
- `rage-feeds-on-the-rust` Every Rust Enemy Counts
- `rage-fades-like-held-breath` Held Like a Breath
- `rage-waits-for-level-two` Why It Wakes in Level Two
- `rust-origin` How the Rust Got Their Foot in the Door
- `commander-halden-varr` Overseer Halden Varr, The Architect of Rust
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
- `weapon-system` Street Weapons
- `baseball-bat` Baseball Bat
- `pipe` Pipe
- `weapon-box` Weapon Box
- `weapon-breakage-and-drops` Worn Out, Dropped, Picked Up Again
- `thrown-weapon` The Throw
- `weapons-from-the-corner-shops` Boxes Left Behind the Shops

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

## Retrieved GDD passages (31)
### [the-rebellion#1] primary - GameDesignDocument/The Rebellion.docx
The Rebellion
Fists of the Fallen City
A Face Paced 2d Side Scrolling Brawler that lets you fight back against Corrupt private security force.
Executives Sections
The Pitch
The Rebellion first of the Fallen city is a Fast-paced 2D side-scrolling brawler where players fight through urban districts overtaken Rust a corrupt private Security Force. The game blends classic beat-‘me-up mechanics with modem combo systems character progression, and dynamic enemy behaviours. Take control of Zed and fight your way through Fallen to get it back. Take control of Zed and fight your way through Fallen City to get it back.
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

### [the-rebellon-gameplay-system#2] primary - GameDesignDocument/The Rebellon gameplay System.docx
Dropping: There is no drop button. Zed drops a carried weapon when he is hit more than 3 times while carrying it, which means the weapon drops on the 4th hit. A dropped weapon lies on the floor and Zed can pick it up again. It keeps its remaining durability. Picking the weapon back up does not reset the hit count.
Attacks with a weapon: Weapons use the existing light and heavy attack buttons. There are no new inputs and no separate weapon move set. The light and heavy mentioned in the core mechanics refer to Zed's light and heavy attacks, not to light and heavy objects.
Weapon types: Only the baseball bat and the pipe exist for now. There are no other weapons or upgraded versions.
Weapon boxes: Each level from Level 2 has one weapon box in a fixed placement. The box holds one weapon, either a baseball bat or a pipe. Which weapon it holds is fixed for each level and is chosen by the level designer. It is not random. Boxes do not respawn.
Enemy use: Weapons are for Zed only. Enemies cannot pick up or use weapons.

### [the-rebellon-gameplay-system#1] primary - GameDesignDocument/The Rebellon gameplay System.docx
The Rebellion
Fists of the Fallen City
Game Play Systems
Weapon System
Starting in Level 2, weapon boxes are introduced across the levels, giving players access to baseball bats and pipes for combating Grunt enemies
How it works
From Level 2 onwards, Zed can break weapon boxes, pick up baseball bats and pipes using the pickup animation, and carry them using the carrying animation before attacking enemies.
Weapon Rules
Damage: Bats and pipes hit harder than Zed's heavy attack.
Speed and reach: The baseball bat has a quick swing. The pipe has a longer reach but a slower startup.
Durability: Each weapon wears out after a set number of hits. Exact hit counts are listed under Weapon Balance Values.
Breakage: When a weapon runs out of hits it breaks, a short break effect plays, and Zed goes back to using his fists.
Throwing: Zed can throw a carried weapon. A thrown weapon spins through the air and damages the first enemy it hits. Throwing costs durability and the weapon can be picked up again if it survives, see Weapon Balance Values.

### [the-rebellon-gameplay-system#4] primary - GameDesignDocument/The Rebellon gameplay System.docx
Light and heavy buttons: The light button swings the weapon at the values above. The heavy button does the same swing with 25 percent more damage and 25 percent more knockback, and costs 2 durability instead of 1. The heavy swing deals 25 damage with the bat and 30 damage with the pipe. A heavy swing still goes through when the weapon has only 1 durability left, and the weapon breaks afterwards.
Thrown weapon: Damage 15, knockback 300, hitstun 20 frames. It travels at 480 pixels per second for up to 320 pixels and hits the first enemy in its path. A throw costs 2 durability, the same as a heavy swing. If the weapon still has durability left after the throw, it lands on the floor where it hit an enemy or at the end of its flight, and Zed can pick it up and keep using it until its durability runs out. If the weapon has 2 durability or less when thrown, the throw still goes through and the weapon breaks when it lands, with the same break effect as a worn-out weapon.
Weapon box: A weapon box breaks after 2 hits from Zed. The box break animation is added separately.

### [the-rebellon-gameplay-system#3] primary - GameDesignDocument/The Rebellon gameplay System.docx
HUD: While Zed carries a weapon, the HUD shows a small icon of that weapon with its remaining durability next to the health bar.
Weapon Balance Values
Reference: Starting values, tuned against Zed's current moves (light hits 6, 7 and 12 damage, heavy attack 18 damage with a 12 frame startup) and a Grunt's 30 HP. Frames are at 60 per second. These are first-pass numbers and can be retuned in playtesting.
Baseball bat: Damage 20. Startup 7 frames, active 4, recovery 16. Reach is a hitbox 64 wide. Knockback 400. Hitstun 26 frames. Durability 10 hits. A Grunt goes down in 2 hits.
Pipe: Damage 24. Startup 12 frames, active 4, recovery 20. Reach is a hitbox 84 wide, the longest in the game. Knockback 360. Hitstun 28 frames. Durability 8 hits. A Grunt goes down in 2 hits.

### [the-story-campaign#1] primary - GameDesignDocument/the story campaign .docx
Campaign Progression
[table]
Level | District | Mini-Boss | Main Boss
1 | brick-red-alley | Brick Dugan | -
2 | mustard-row | Railgun Royce | -
3 | Greenline-courts | Crusher Kane | Rhea Calder
4 | Stewpot-gardens | Glitch | Kade Voss
5 | Songwindow-heights | Raptor | Silas Wren
6 | Iron-line-push | Subject 88 | Dr. Maren Holt
7 | Copper-fang-courts | Commander Atlas | Elite Rust Gauntlet
8 | Overseer-tower | Sentinel-X9 | Halden Varr

### [the-rebellion#15] primary - GameDesignDocument/The Rebellion.docx
Fight Theme
Brick should feel like:
A human battering ram
The player's first major skill check
Slow but intimidating
Easy to understand but hard to face head-on
Level 2: Transit District
Mini-Boss: "Railgun" Royce
Former transit security officer.
Appearance
Electrified baton
Armoured trench coat
Scanner visor
Move Set
Baton Combo
Charging Dash
Shockwave Slam
Rail Trap (electrified floor sections)
Taser Burst
Role
Introduces stun mechanics.
Level 3: Industrial Zone
Mini-Boss: "Crusher" Kane
Rhea Calder's chief enforcer.
Appearance
Hydraulic work suit
Industrial hammer
Move Set
Hammer Slam
Hook Chain Grab
Furnace Kick
Steam Vent Burst
Crushing Uppercut
Role
Prepares players for Overseer Calder.
Level 4: Neon Market
Mini-Boss: "Glitch"
A former hacker turned Rust cyber operative.
Appearance
Holographic mask
Portable drone pack
Move Set
Drone Barrage
Hologram Duplicate
Shock Disk Throw
Data Spike
Emergency Teleport
Role
Introduces Voss's deception mechanics.
Level 5: Skyline District
Mini-Boss: "Raptor"
Silas Wren's personal hunter.
Appearance
Grapple launcher
Lightweight armour
Move Set

### [the-rebellion#16] primary - GameDesignDocument/The Rebellion.docx
Dive Kick
Wall Bounce Strike
Grapple Pull
Aerial Barrage
Falcon Drop
Role
Trains players for vertical combat.
Level 6: Undercity
Mini-Boss: Dr. Holt's Experiment "Subject 88"
A failed chemical test subject.
Appearance
Mutated physique
Chemical tanks on back
Glowing green veins
Move Set
Toxic Breath
Acid Spit
Frenzied Charge
Corrosion Slam
Chemical Explosion
Role
Introduces area denial hazards.
Level 7: Rust Military Compound
Mini-Boss: Commander Atlas
Leader of the Copper Fangs.
Appearance
Elite black armour
Tactical shield
Twin electrified gauntlets
Move Set
Shield Bash
Gauntlet Combo
Grapple Hook Pull
Electric Counter
Fang Protocol (calls Specialists)
Role
The toughest non-boss enemy in the game.
Level 8: Corporate Tower
Mini-Boss: Sentinel-X9
An experimental combat android protecting Varr.
Appearance
Corporate security robot
Rust insignia
Energy core chest
Move Set
Laser Sweep
Rocket Punch
Ground Pound
Energy Shield
Self-Repair Mode
Phase 2
Core overloads:
Faster attacks
Red laser barrage
Explosive dash attacks
Role
Final challenge before Halden Varr.

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

### [level-01-brick-red-alley#9] derived - design/levels/level-01-brick-red-alley.md - Open questions
- The theme mentions a mustard corner shop, mural panels and a music window; this direction does not. Add a shop or mural later as a separate sparse landmark?
- Window-wall may need a tile-seam check in game, since the shadow wedge is tied to edges.

### [hud#5] derived - design/ux/hud.md - Layout table
Health bar sits left because the player character commonly starts left and reads left-to-right. Timer sits right so that the two critical survival numbers frame the wave info in the middle. HUD is anchored to the viewport, not the world, and does not move with the camera.
The HUD must not overlap the action zone. The arena camera and floor (Camera & Bounds Agent) should keep characters below y=120 where possible. Flagged in OQ-H4.

### [flow#10] derived - design/ux/flow.md - Later (deferred, not Tier 0)
- Next Level button, level select, and a campaign progress screen.
- Options menu (volume, key rebinding, fullscreen), Controls/How-to-play screen.
- Character progression screens (the pitch mentions "character progression").
- Score, rank, combo counter and combo-meter HUD, defensive-state indicators (parry window, block).
- Boss health bar, enemy health bars beyond the minimal one in `hud.md`, off-screen enemy indicators.
- Multiple lives or continues, leaderboards, pause-menu settings, localisation, mobile touch controls.

### [narrative-critic#1] reference - gdd-review-kit-main/reviews/narrative-critic.md - 1. The story promise has no story behind it (BLOCKING)
**Problem:** The document sets up a narrative premise (rebellion, fallen city, corrupt security force) but contains no story, protagonist, arc, or ending. The premise is a title, not a narrative.
**Passage:** The subtitle "Fists of the Fallen City" and the tagline "fight back against Corrupt private security force" are the only narrative content. The Pitch adds "urban districts overtaken Rush a corrupt private Security Force." There is no section for story, characters, setting history, or endings. The mechanics list ends at "Defeat Wave / Clear Arena to win the level in time frame."
**Why it matters:** "Rebellion" implies a movement, stakes, and escalation. The structure (clear arena, beat the timer, repeat) delivers only repetition. Nothing says why the player fights, what winning a level changes, or what the final victory looks like.

### [adversarial-qa#1] reference - gdd-review-kit-main/reviews/adversarial-qa.md - Finding 1: Win condition and fail state are contradictory or undefined (BLOCKING)
**Problem:** The document gives two different win conditions and no lose condition. "Defeat Wave / Clear Arena to win the level in time frame" is ambiguous. It could mean clearing every wave, clearing the arena, or surviving until the timer ends. Nothing says what happens if the timer expires with enemies still alive. Nothing says what happens if the player's health reaches zero. There is no lives, continue or retry rule.
**Source:** Game Mechanics: "Defeat Wave / Clear Arena to win the level in time frame". Timer Agent: "Keep trick of the time the player has to beat the level". Game Loop Agent: "Control the level and win condition". No section mentions failure, death, game over or a health system.
**Exploits and edge cases:** Does killing the last enemy at 0:00 count as a win? Can a player stall a wave so it never completes? What if an enemy is knocked off-screen or stuck (side-scroller with a "juggle" system) and cannot be reached? The arena can then never be "cleared" and the level soft-locks until the timer runs out.

### [the-rebellion-frist-draft#1] reference - PDf/The Rebellion -Frist Draft.pdf
The Rebellion
Fists of the Fallen City
A Face Paced 2d Side Scrolling Brawler that lets you fight back against Corrupt private security force. Executive Sections
The Pitch The Rebellion first of the Fallen city is a Fast-paced 2D side-scrolling brawler where players fight through urban districts overtaken Rush a corrupt private Security Force. The game blends classic beat-`me-up mechanics with modem combo systems character progression, and dynamic enemy behaviours.
Game Mechanics -what the players does
� Impactful Combat � punchy hits Players moves into a Areas were light and heavy pick-up objects
� Combos and Juggle routes � Defensive tools(block dodge, parry) Enemies spawn to fight � Defeat Wave / Clear Arena to win the level in time frame
AI Architecture Team

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

### [narrative-critic#9] reference - gdd-review-kit-main/reviews/narrative-critic.md - 1. CONFLICTS
**Systems Designer Finding 3 (timer versus defensive depth) versus my Finding 3.** I keep my earlier position with a refinement. Time bonuses, pauses, and time per kill are tuning knobs, and the Feasibility Lead correctly warns each adds shared state between the Timer and Game Loop agents. The narrative reason should be chosen first, because it may make the knob unnecessary (a flat, lenient clock, as the Feasibility Lead proposes, is consistent with a "raid" fiction).

### [narrative-critic#5] reference - gdd-review-kit-main/reviews/narrative-critic.md - 5. The "Enemy Agent" and "Game Loop Agent" leave the narrative with no owner (MINOR)
**Problem:** The AI team covers movement, combos, timer, enemies, and level control. No role owns story, dialogue, level themes, or progression beats, even though "character progression" is promised in the Pitch.
**Passage:** The Pitch says "character progression, and dynamic enemy behaviours," but the Game Loop Agent only "Control the level and win condition." No item in the AI Architecture Team table covers progression or narrative.
**Why it matters:** Progression is promised but has no narrative frame. Nothing links levels to districts or to the rebellion's advance, so "urban districts" are a setting label, not a journey.

## Need more?
`node pipeline/search.mjs "<query>" -k 8 --full` searches all 599 chunks across 57 documents.
