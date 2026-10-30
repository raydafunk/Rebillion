# Content brief: lore
_Generated 2026-10-28T13:10:40.043Z by pipeline/brief.mjs. Regenerate with `node pipeline/brief.mjs lore`; do not hand-edit._

**Writer agent:** lore-writer-agent  |  **Output dir:** `content/lore/`  |  **Produces:** Districts, characters, factions, places and story beats.

## Rules (non-negotiable)
1. Ground every item in the GDD. Cite corpus chunk ids in `sources` (ids are the `[...]` tags below). Cite only chunks you actually used.
2. Never invent lore silently. If the GDD states it, `status: "canon"`. If you are extending it, `status: "proposed"` and fill `gddGap` (which gap, why it fits). The owner approves proposals.
3. Authority order when sources disagree: **primary** (owner's GDD docx) > **derived** (specs in design/) > **reference** (PDF drafts, review kit, README). The GDD pitch contains the typo "Rush": the name is **Rust**. The city is **the Fallen City**.
4. Voice: hopeful, energetic, full of personality; Zed's side warm and plain-spoken; the Rust cold and official but always answered or defaced by the community. Never grim, gory, sneering or military. Enemies are pushed back or knocked down, never killed.
5. Numbers stay in engine units and near the engine's Tier 0 values (see engine files). Do not edit anything under `src/`.
6. Banned patterns (the validator rejects them): `\bRush\b` (typo for "Rust" (the GDD pitch has this typo; never copy it)); `\bRusts\b` ("the Rust" is a collective: no "Rusts"); `\bFallen\b(?!\s+City)` ("Fallen" alone; say "the Fallen City"); `\bfallen city\b` (lower-case city name; write "Fallen City"); `\b(driven|pushed|kicked|cleared)\s+out\s+of\s+the\s+Rust\b|\bthe Rust (zone|area|smell|stain)\b` (Rust treated as a place or stain; it is a force of people); `\b(TARGETS? ELIMINATED|MISSION COMPLETE|HOSTILES? NEUTRALI[SZ]ED|NEUTRALI[SZ]E)\b` (military/clinical phrasing on Zed's side); `\b(YOU DIED|PATHETIC|LOSER|GAME OVER)\b` (gloating or grim lose-screen copy); `\b(gore|gory|blood|bloody|corpse|dismember\w*|brains|entrails|slaughter\w*|massacre\w*)\b` (gore; tone is never gory); `\b(kill|kills|killed|killing|murder\w*)\b` (lethal wording; enemies are knocked down / pushed back).
7. Write JSON files to `content/lore/` (one item object or an array per file, UTF-8). Then run `node pipeline/validate.mjs lore` and fix every error before you report back.

## Schema
Each item has these fields:
```json
{
  "id": "string, kebab-case, unique within its type",
  "status": "one of canon | proposed",
  "gddGap": "string; REQUIRED when status is \"proposed\", otherwise omit",
  "sources": "array of corpus chunk ids (at least 1)",
  "kind": "one of district | character | faction | location | event | object",
  "name": "string",
  "summary": "string, one sentence, <= 160 chars",
  "body": "string, 1-3 short paragraphs",
  "tags": "array of lowercase strings"
}
```
Example:
```json
{
  "id": "brick-red-alley",
  "status": "canon",
  "kind": "location",
  "name": "Brick-Red Alley",
  "summary": "The alley where Zed and the neighbourhood kids learned to fight, dance and argue like family.",
  "body": "...",
  "tags": [
    "zed",
    "home"
  ],
  "sources": [
    "the-rebellion#7"
  ]
}
```

## Already exists (extend, don't duplicate)
- `open-windows-music` Open Windows with Music (content/lore/canon-extra.json)
- `street-tournaments` Street Tournaments and Late-Night Sparring (content/lore/canon-extra.json)
- `corner-shops` The Corner Shops (content/lore/canon-more.json)
- `zeds-mission` Taking the City Back (content/lore/canon-more.json)
- `zeds-colours` Zed's City Colours (content/lore/canon-more.json)
- `neighbours-and-friends` The Quiet After the Takeover (content/lore/canon-more.json)
- `rust-grunt` Rust Grunt (content/lore/canon-more.json)
- `zed` Zed (content/lore/canon-people.json)
- `zeds-mother` Zed's Mother (content/lore/canon-people.json)
- `zeds-father` Zed's Father (content/lore/canon-people.json)
- `fallen-city` The Fallen City (content/lore/canon-world.json)
- `brick-red-alley` Brick-Red Alley (content/lore/canon-world.json)
- `food-stall` The Food Stall (content/lore/canon-world.json)
- `community-garden` The Community Garden (content/lore/canon-world.json)
- `basketball-courts` The Basketball Courts (content/lore/canon-world.json)
- `local-heroes-murals` The Local Heroes Murals (content/lore/canon-world.json)
- `surveillance-towers` Surveillance Towers and Propaganda Screens (content/lore/canon-world.json)
- `the-neighbourhood` The Neighbourhood (content/lore/canon-world.json)
- `the-rust` The Rust (content/lore/canon-world.json)
- `rust-takeover` The Takeover (content/lore/canon-world.json)
- `iron-line-push` Iron Line Push (content/lore/districts-6-8.json)
- `copper-fang-courts` Copper Fang Courts (content/lore/districts-6-8.json)
- `overseer-tower` Overseer Tower (content/lore/districts-6-8.json)
- `brick-dugan` "Brick" Dugan (content/lore/mini-bosses.json)
- `railgun-royce` "Railgun" Royce (content/lore/mini-bosses.json)
- `crusher-kane` "Crusher" Kane (content/lore/mini-bosses.json)
- `glitch` "Glitch" (content/lore/mini-bosses.json)
- `raptor` "Raptor" (content/lore/mini-bosses.json)
- `holts-experiment-subject-88` Dr. Holt's Experiment "Subject 88" (content/lore/mini-bosses.json)
- `commander-atlas` Commander Atlas (content/lore/mini-bosses.json)
- `sentinel-x9` Sentinel-X9 (content/lore/mini-bosses.json)
- `rust-notice-114` Rust Notice 114 (content/lore/proposed.json)
- `local-heroes-benefit` Local Heroes Benefit (content/lore/proposed.json)
- `mustard-row` Mustard Row (content/lore/proposed.json)
- `greenline-courts` Greenline Courts (content/lore/proposed.json)
- `stewpot-gardens` Stewpot Gardens (content/lore/proposed.json)
- `songwindow-heights` Songwindow Heights (content/lore/proposed.json)
- `zeds-rage` Zed's Rage (content/lore/rage.json)
- `rage-meter` The Rage Meter (content/lore/rage.json)
- `rage-clean-streak` Staying Clean (content/lore/rage.json)
- `rage-ready` Rage Ready (content/lore/rage.json)
- `zeds-special-move` Zed Rage (content/lore/rage.json)
- `rage-ending` When the Rage Settles (content/lore/rage.json)
- `rage-is-for-the-neighbourhood` Not Hatred, Not a Grudge (content/lore/rage.json)
- `rage-grief-into-fire` Grief Turning to Fire (content/lore/rage.json)
- `rage-feeds-on-the-rust` Every Rust Enemy Counts (content/lore/rage.json)
- `rage-fades-like-held-breath` Held Like a Breath (content/lore/rage.json)
- `rage-waits-for-level-two` Why It Wakes in Level Two (content/lore/rage.json)
- `rust-origin` How the Rust Got Their Foot in the Door (content/lore/rust-expanded.json)
- `commander-halden-varr` Overseer Halden Varr, The Architect of Rust (content/lore/rust-expanded.json)
- `rust-takeover-timeline` Within Months: Curfews, Sealed Districts and Drones (content/lore/rust-expanded.json)
- `rust-doctrine` Order is Strength. Freedom is Weakness. (content/lore/rust-expanded.json)
- `rust-serial-numbers` Serial Numbers (content/lore/rust-expanded.json)
- `rust-grunts-iron-line` Rust Grunts: The Iron Line (content/lore/rust-expanded.json)
- `rust-bruisers-breakers` Rust Bruisers: The Breakers (content/lore/rust-expanded.json)
- `rust-rangers-watchers` Rust Rangers: The Watchers (content/lore/rust-expanded.json)
- `rust-copper-fangs` Rust Specialists: The Copper Fangs (content/lore/rust-expanded.json)
- `rust-overseers` Rust Overseers: The Architects of Control (content/lore/rust-expanded.json)
- `rust-rank-ladder` The Rust Ladder (content/lore/rust-expanded.json)
- `neighbourhood-answer-to-doctrine` The Wall Answers Back (content/lore/rust-expanded.json)
- `weapon-system` Street Weapons (content/lore/weapons.json)
- `baseball-bat` Baseball Bat (content/lore/weapons.json)
- `pipe` Pipe (content/lore/weapons.json)
- `weapon-box` Weapon Box (content/lore/weapons.json)
- `weapon-breakage-and-drops` Worn Out, Dropped, Picked Up Again (content/lore/weapons.json)
- `thrown-weapon` The Throw (content/lore/weapons.json)
- `weapons-from-the-corner-shops` Boxes Left Behind the Shops (content/lore/weapons.json)

## Uncovered GDD names (write these FIRST)
_none detected. Still add new items: pick open questions from design/lore/canon.md or the Focus line, mark them `proposed`._


## Engine / spec files to stay compatible with
#### design/lore/canon.md
```
# Canon Sheet: The Rebellion: Fists of the Fallen City

Source of truth: `GameDesignDocument/The Rebellion.docx` (Pitch, Theme). Menu mock-up docx and `design/ux/menu-concept.md` are secondary and were checked against it. Nothing here is invented; gaps are listed under Open questions.

## Names and spellings

| Thing | Canonical | Notes |
|---|---|---|
| Game title | The Rebellion: Fists of the Fallen City | Menu may split it: title "THE REBELLION", subtitle "Fists of the Fallen City". |
| City | the Fallen City | Always with "City". Never "Fallen" alone. Pitch's "fight your way through Fallen" and "first of the Fallen city" should read "the Fallen City". |
| Hero | Zed | Player character. |
| Antagonist | the Rust | Corrupt private security force. Always "Rust", never "Rush". |
| Rust members | Rust enemies / Rust grunt | "Rust grunt" is the one Tier 0 enemy type (asset-manifest). GDD unit names: Rust Grunts "The Iron Line", Rust Bruisers "The Breakers", Rust Rangers "The Watchers", Rust Specialists "The Copper Fangs", Rust Overseers "The Architects of Control". |
| Rust leader / main boss | Overseer Halden Varr, "The Architect of Rust" | Owner decision: use the GDD's Main Boss wording. The GDD's Rust history section still says "Commander"; the owner chose "Overseer". |
| Zed's side | the neighbourhood, the community, local heroes | Wording from Theme. |

## Factions

- **Zed and the neighbourhood:** warm, rounded, casual, expressive. Fights back to get the city back.
- **The Rust:** a force of people (uniform, symmetrical, visor, cold hue, boxy). Cold, harsh, official. Not a place, a smell, a stain or a status effect. Per the GDD they turned from a protective force into a militarized occupation that crushes resistance with brutal efficiency: "enforcers, hunters, and executioners", each unit trained to suppress civilians, eliminate rebels and maintain absolute control. Breakers use illegal muscle stimulants; Copper Fangs undergo psychological conditioning; recruits are given serial numbers.

## World (from Theme)

Lived-in, human, culturally rich. Corner shops, murals celebrating local heroes, open windows with music, basketball courts, food stalls, community gardens. Casual fits, expressive colours.

## Palette words

Mustard yellow, brick red, forest green, warm browns. Rust is the cold contrast (steel, visor cyan).

## Tone rules

- Hopeful, energetic, full of personality and stories. Fighting back, reclaiming a home.
- Zed's side is hopeful and never gloats; lose screens encourage a retry. Never gory (no blood or dismemberment wording).
- The Rust are menacing, as the GDD writes them: brutal, ruthless, and set on eliminating rebels. Their threat is stated plainly, not softened.
- Zed's side copy is warm and plain-spoken, in a neighbourhood voice. No military or clinical phrasing.
- Rust copy is cold, official and threatening (notices, orders, barks): "suppress", "crush", "eliminate rebels" are in character for the Rust. It is still shown as something the community answers or defaces.

## Wording

| Avoid | Prefer |
|---|---|
| Rush (typo) | Rust |
| "Rust has been driven out of the arena" (Rust as place or stain) | "The Rust have been pushed back." / "The Rust are on the run." |
| "Fallen" alone | "the Fallen City" |
| TARGETS ELIMINATED, MISSION COMPLETE, HOSTILES NEUTRALISED (on Zed's side, such as the win screen; Rust lines may say "eliminate rebels") | The block is ours again. / Nice work, Zed. |
| Generic game-speak (ENEMIES DEFEATED, ENEMIES LEFT) | Rust pushed back / Rust still standing (proposal; HUD owner decides) |
| Gloating lose text (YOU DIED, PATHETIC) | Time ran out. Shake it off and go again. |
| "Rust" plural as "Rusts" | "the Rust" takes plural verbs: "the Rust are...". |

## Zed Lore (story, as written by the owner)

### Zed — The Boy from Brick‑Red Alley

Zed grew up in the heart of Fallen City, in a neighbourhood painted with “corner shops, murals celebrating local heroes, open windows with music drifting out”. His block was known for its mustard‑yellow storefronts, forest‑green basketball courts, and the brick‑red alley where kids learned to fight, dance, and argue like family. It wasn’t perfect, but it was alive — culturally rich, loud, hopeful, and full of people who looked out for each other.

His mother ran a tiny food stall near the community garden, serving hot bowls of stew to anyone who needed a meal. His father, a muralist, painted the faces of local heroes across the district walls — cooks, musicians, activists, teachers — everyday people who kept Fallen City standing. Zed grew up believing that strength wasn’t about power; it was about protecting the people who gave your life meaning.

### The Fall of Fallen City

Everything changed when RUST, the private security force, swept through the districts. The document describes the city as “overtaken Rust a corrupt private Security Force” — and Zed saw it firsthand.

RUST didn’t arrive like soldiers; they arrived like thieves. They shut down the basketball courts. They fenced off the community gardens. They patrolled the alleys where kids used to play. They tore down murals — including his father’s — replacing them with surveillance towers and propaganda screens.

Zed’s father disappeared after confronting RUST officers during a mural teardown. His mother’s food stall was seized for “security violations.” Friends vanished. Neighbours were beaten. The city’s heartbeat went quiet.

Zed didn’t have a choice. He had to fight.

### Why Zed Fights

Zed isn’t a soldier. He’s a kid from a lived‑in neighbourhood who learned to fight the same way he learned to dance — through rhythm, instinct, and community.

His style reflects the game’s pillars:

- Impactful, fast-paced combat — Zed’s punches feel like brick‑red alley brawls, scrappy but sharp.
- Skill depth through combos and defence — he learned to juggle, block, and parry from street tournaments and late-night sparring behind corner shops.
- Wave-clearing under pressure — fighting groups is nothing new; he grew up protecting younger kids from trouble.

He fights not for glory, but to reclaim the places that shaped him — the food stalls, the murals, the music drifting from open windows. The city isn’t just his home; it’s his identity.

### Zed’s Personal Mission

Zed’s goal is simple: Take Fallen City back, one district at a time.

Every wave he clears, every arena he survives, every enemy he knocks down brings him closer to finding out what happened to his father — and to restoring the community that raised him.

He fights so kids can play in the basketball courts again. He fights so music can drift from open windows again. He fights so murals can rise again, celebrating real heroes — not corporate tyrants.

### Tone & Personality

Zed embodies the game’s theme: “hopeful, energetic, full of personality and stories.” He’s expressive, stubborn, and fiercely loyal. He cracks jokes mid-fight. He refuses to back down. He carries the city’s colours in his outfit — mustard yellow, brick red, forest green — as a reminder of what he’s fighting for.

## Open lore questions (GDD silent)

1. Does the Rust impose curfews or issue numbered notices? Menu poster "Rust Notice 114 / CURFEW" implies it. Treated as flavour, not canon, until the owner confirms.
2. Is "Rust" used as a plural noun ("the Rust are") or a collective singular ("the Rust is")? Sheet assumes plural.
3. Who is Zed (age, role, backstory)? Is there a named "local hero" on the murals? (Art currently shows Zed as a young street hero with short dark hair and brown skin; all of that is PLACEHOLDER, see `design/art/zed-pixellab-prompt.md`, not canon.)
4. Names of districts and arena locations. The Rust leader is Overseer Halden Varr, "The Architect of Rust" (owner decision: GDD Main Boss wording); unit nicknames are GDD wording to confirm.
5. What does "get it back" mean in story terms (who held the city before)?
6. Is "Rust enemy" or "Rust grunt" the player-facing term for the enemy?
7. Is a Quit option meaningful in a browser build? (Also flagged in `design/ux/main-menu.md` Later list.)
```

## Retrieved GDD passages (61)
### [the-rebellion#7] primary - GameDesignDocument/The Rebellion.docx
Character – the hero
Zed — The Boy from BrickRed Alley
Zed grew up in the heart of Fallen City, in a neighbourhood painted with “corner shops, murals celebrating local heroes, open windows with music drifting out” . His block was known for its mustardyellow storefronts, forestgreen basketball courts, and the brickred alley where kids learned to fight, dance, and argue like family. It wasn’t perfect, but it was alive — culturally rich, loud, hopeful, and full of people who looked out for each other.
His mother ran a tiny food stall near the community garden, serving hot bowls of stew to anyone who needed a meal. His father, a muralist, painted the faces of local heroes across the district walls — cooks, musicians, activists, teachers — everyday people who kept Fallen City standing. Zed grew up believing that strength wasn’t about power; it was about protecting the people who gave your life meaning.
The Fall of Fallen City

### [the-rebellion#8] primary - GameDesignDocument/The Rebellion.docx
Everything changed when RUST, the private security force, swept through the districts. The document describes the city as “overtaken Rust a corrupt private Security Force” — and Zed saw it firsthand.
RUST didn’t arrive like soldiers; they arrived like thieves. They shut down the basketball courts. They fenced off the community gardens. They patrolled the alleys where kids used to play. They tore down murals — including his father’s — replacing them with surveillance towers and propaganda screens.
Zed’s father disappeared after confronting RUST officers during a mural teardown. His mother’s food stall was seized for “security violations.” Friends vanished. Neighbours were beaten. The city’s heartbeat went quiet.
Zed didn’t have a choice. He had to fight.
Why Zed Fights
Zed isn’t a soldier. He’s a kid from a livedin neighbourhood who learned to fight the same way he learned to dance — through rhythm, instinct, and community.
His style reflects the game’s pillars:
Impactful, fast-paced combat — Zed’s punches feel like brickred alley brawls, scrappy but sharp.

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

### [the-rebellion#9] primary - GameDesignDocument/The Rebellion.docx
Skill depth through combos and defence — he learned to juggle, dodge, and parry from street tournaments and late-night sparring behind corner shops.
Wave-clearing under pressure — fighting groups is nothing new; he grew up protecting younger kids from trouble.
He fights not for glory, but to reclaim the places that shaped him — the food stalls, the murals, the music drifting from open windows. The city isn’t just his home; it’s his identity.
Zed’s Personal Mission
Zed’s goal is simple: Take Fallen City back, one district at a time.
Every wave he clears, every arena he survives, every enemy he knocks down brings him closer to finding out what happened to his father — and to restoring the community that raised him.
He fights so kids can play in the basketball courts again. He fights so music can drift from open windows again. He fights so murals can rise again, celebrating real heroes — not corporate tyrants.
Tone & Personality

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

### [the-rebellion#10] primary - GameDesignDocument/The Rebellion.docx
Zed embodies the game’s theme: “hopeful, energetic, full of personality and stories.” He’s expressive, stubborn, and fiercely loyal. He cracks jokes mid-fight. He refuses to back down. He carries the city’s colours in his outfit — mustard yellow, brick red, forest green — as a reminder of what he’s fighting for.
Character – the Enemy
Enemy Faction Lore: RUST — The Private Security Force of Fallen City
Overview
Rust began as a private security contractor hired to “stabilize” Fallen City after years of political decay and rising crime. But once they were inside, they never left. Rust transformed from a protective force into a militarized occupation, tightening control over every district and crushing resistance with brutal efficiency.
Their name comes from their signature oxidized metal armour, a symbol of decay — a reminder that Fallen City is rotting under their rule.
Rust’s soldiers are not just guards. They are enforcers, hunters, and executioners. Each unit is trained to suppress civilians, eliminate rebels, and maintain absolute control.
⚙️ Rust’s Origin

### [rebellion-menu-desgin#3] primary - GameDesignDocument/Rebellion menu desgin.docx
[table]
Settings | functions | Theme | What happens in game
Music volume | Controls the music | a slider. Posters-on-brick feels like it wants a street-ambience bed | Changes the game music level
SFX volume | a slider covering hits sounds parries and dodges | Same theme as the music volume | Change the SFX on or off
Fullscreen | Makes the screen Fullscreen | Same theme as the music volume | Makes the game screen big
Background posters (non-interactive)
"Local Heroes Benefit: Keep the Lights On": cream, forest-green text. Ties back to the original Local Heroes Mural idea.
Rust Notice 114, "CURFEW" struck through: brick red. It shows the Rust security force's control and the community defacing it.
Visual style
Flat shapes with torn, uneven edges (clip-path style); no gradients or glow.
Heavy condensed display type for titles and buttons, monospace for small print.
Palette: brick red #9C3B2E / #7A2F25, mustard #E1A92B, forest green #2F5D3A, warm brown #6B4A2F, cream #E8DCC0, near-black #1D1A16.
Implementation notes (Phaser)

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

### [the-rebellon-gameplay-system#2] primary - GameDesignDocument/The Rebellon gameplay System.docx
Dropping: There is no drop button. Zed drops a carried weapon when he is hit more than 3 times while carrying it, which means the weapon drops on the 4th hit. A dropped weapon lies on the floor and Zed can pick it up again. It keeps its remaining durability. Picking the weapon back up does not reset the hit count.
Attacks with a weapon: Weapons use the existing light and heavy attack buttons. There are no new inputs and no separate weapon move set. The light and heavy mentioned in the core mechanics refer to Zed's light and heavy attacks, not to light and heavy objects.
Weapon types: Only the baseball bat and the pipe exist for now. There are no other weapons or upgraded versions.
Weapon boxes: Each level from Level 2 has one weapon box in a fixed placement. The box holds one weapon, either a baseball bat or a pipe. Which weapon it holds is fixed for each level and is chosen by the level designer. It is not random. Boxes do not respawn.
Enemy use: Weapons are for Zed only. Enemies cannot pick up or use weapons.

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

### [rebellion-menu-desgin#2] primary - GameDesignDocument/Rebellion menu desgin.docx
[table]
Element | Description
Title | THE REBELLION" in heavy condensed type, cream on a black strip, tilted about 2 degrees. The subtitle "Fists of the Fallen City" sits beneath in mustard monospace.
Fight (selected) | Mustard torn-paper strip, leading ">" marker, straightens and slides right. Starts the game.
Controls | Cream paper strip
Options | Forest-green strip with cream text.
Quit | Warm-brown strip with cream text.
Footer hint | W/S select / Enter confirm", bottom right.
Each option is a separate torn-edge paper strip, tilted slightly. The selected option straightens, moves right and takes the brightest colour. Hover gives the same feedback.
Controls Menu elements(keyboard)q
[table]
Action | Primary | Alternate
Move Left/right | A/D | Left or Right arrows keys
Jump | W or Space | Up arrow key board
Light attack | J | Z
Heavy attack | K | X
Special Move | L | C
Pick up | P | N
Parry | T | M
Block | I | V
Options Menu ( elements)

### [zed-rage-system-spec#14] primary - GameDesignDocument/Zed Rage System Spec.docx - Asset list
Rage meter frame and fill, in 3 visual states (building, READY, active)
READY flare and L button prompt icon
Zed aura overlay for building and Rage
Gain pop and spark effect
Activation flash and impact frames
Rage-end effect
Level 2 HUD intro animation
Special move animation (one exists in assets/sprites/zed/Super_special_move/)

### [zed-rage-system-spec#10] primary - GameDesignDocument/Zed Rage System Spec.docx - 6.2 During Rage
Rage lasts 9 seconds, with the meter draining about 11 per second on a fixed clock. Nothing speeds it up or slows it down: not hits landed, not kills, not damage taken.
Zed's normal attacks are replaced by one Special move. It does not add to them.
Zed can still move, jump and block. There is no dodge during Rage.
The meter gains no Rage during Rage, and kills during Rage give nothing.
The Special does strong damage but never a full boss kill. The player must still finish a boss with normal attacks.

### [zed-rage-system-spec#18] primary - GameDesignDocument/Zed Rage System Spec.docx - 11. Decision Log
[table]
# | Decision
Q1 | Special is triggered by L. The gamepad binding comes later.
Q2 | One single move.
Q3 | Lore as in Section 2.
Q4 | Rage resets each level.
Q5 | The meter drains, including when full. Rage is a timed state in which the Special replaces normal attacks.
Q6 | Kills during Rage give nothing. The meter is built by landing blows on Rust enemies.
Q7 | The Special does strong damage, never a full boss kill.
Q8 | A buffered press fires when Zed lands. He can move, jump and block in Rage, and there is no dodge.
Extra | Rage ends if Zed is knocked out. All Rust enemies, including bosses, fill the meter. The drain pauses on the pause menu and wave transitions.

### [zed-rage-system-spec#2] primary - GameDesignDocument/Zed Rage System Spec.docx - 1. Design Intent
Level 1 is the pace level. The player learns movement, the light and heavy chain, jump kick and block with no extra pressure. From Level 2 onward, a Rage meter rewards aggressive, clean play and builds toward a short, powerful state in which Zed unleashes his Special move.

### [zed-rage-system-spec#15] primary - GameDesignDocument/Zed Rage System Spec.docx - 9. Implementation Notes
Treat special as a named input action, bound to L on keyboard, so the gamepad binding can be added later without changing the state machine.
Keep all tuning numbers (gain, bonus, streak length, drain, READY window, Rage duration) in one config.
Rage needs a state in the player state machine that swaps the attack set for the single Special move and disables dodge.
The meter system listens for blows landed, hits taken, knockout, level start, retry, pause and wave transition.

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

### [the-rebellion#4] primary - GameDesignDocument/The Rebellion.docx
Team Lead agent
Builds the Agent Orchestration
None
Technical Strategy

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

### [the-rebellion#11] primary - GameDesignDocument/The Rebellion.docx
Rust was founded by Overseer Commander Halden Varr, a former military strategist who believed order could only be achieved through fear. When Fallen City’s government collapsed, Varr seized the opportunity. He offered “protection” to the remaining officials, then quietly replaced them with Rust loyalists.
Within months:
Curfews became mandatory
Districts were sealed
Surveillance drones filled the sky
Anyone who resisted disappeared
Rust became the law. Rust became the city.
🔩 Rust’s Philosophy
Rust operates under a single doctrine:
“Order is strength. Freedom is weakness.”
They believe Fallen City must be rebuilt through force. Civilians are treated as assets to control, not people to protect. Rust’s soldiers are conditioned to see rebels — including Zed — as threats to the “greater good.”
Rust Unit Types Enemies
1. Rust Grunts — “The Iron Line”
The backbone of Rust’s force. Once ordinary citizens, they were coerced or manipulated into service. Their armour is cheap, rustcoated plating, and their helmets hide their identities — intentionally.

### [the-rebellion#12] primary - GameDesignDocument/The Rebellion.docx
Lore: Rust strips recruit of their names, replacing them with serial numbers. This erases individuality and ensures obedience.
Purpose: Crowd control, intimidation, frontline combat.
Attacks/Move Lists
Rust Jab Combo A quick 1–2–3 punch string.
Light damage
Used to interrupt the player
Often done in groups to create pressure
Helmet Headbutt A sudden forward lunge using their reinforced helmet.
Short windup
Causes brief stun
Used when the player is too close or grabs too often
2. Rust Bruisers — “The Breakers”
Massive enforcers enhanced with illegal muscle stimulants. Their Armor is reinforced with heavy plating, giving them a hulking silhouette.
Lore: Breakers are often former criminals promised freedom in exchange for loyalty. Rust chemically augments them, making them stronger but unstable.
Purpose: Shock troops, area denial, crushing resistance groups.
Attack/ Move lists
A downward smash with a reinforced gauntlet.
Medium startup
Causes ground bounce
Breaks player block
Signature “thud” sound on impact
2. Rust Uppercut
A rising punch fuelled by muscle stimulants.

### [the-rebellion#13] primary - GameDesignDocument/The Rebellion.docx
Launches the player
Antiair option
Used when the player jumps too often
3. Body Check
A shoulder slam using their plated armour.
Short dash forward
Knocks the player back
Can interrupt combos
Super armour during the dash
3. Rust Rangers — “The Watchers”
Agile units equipped with taser rifles, batons, and tracking visors.
Lore: Watchers are trained to hunt rebels through the city’s alleyways and rooftops. Their visors can scan heat signatures, making hiding nearly impossible.
Purpose: Longrange harassment, pursuit, reconnaissance.
Attack/ Move list
1. Taser Shot
A quick electric bolt fired from their taser rifle.
Light damage
Brief stun on hit
Used constantly to harass
Encourages the player to close distance
2. Baton Strike
A fast melee hit with their electrified baton.
Very quick startup
Interrupts player combos
Used when Zed gets too close
4. Rust Specialists — “The Copper Fangs”
Elite soldiers with advanced gear: electrified gauntlets, grappling hooks, and tactical shields.

### [the-rebellion#14] primary - GameDesignDocument/The Rebellion.docx
Lore: Chosen from the most loyal Rust members, Fangs undergo psychological conditioning to remove fear and hesitation. They are Varr’s personal favourites.
Purpose: Highpriority target elimination, bosstier encounters.
Attack/Move List
👊 Basic Attacks (Sharp, Controlled, Professional)
1. Fang Jab
A lightningquick electrified gauntlet jab.
Very fast startup
Brief stun on hit
Used to interrupt player combos
2. Copper Cross
A crosspunch with crackling electricity.
Medium damage
Causes stagger
Used after dodging a player attack
3. Shield Bash
A forward shove with their tactical shield.
Pushes the player back
Breaks guard
Used to create space for followup attacks
personal favourites.
Mini Bosses in the Each level
Level 1
Mini-Boss: "Brick" Dugan
Former dock worker recruited into Rust.
Appearance
 Heavy black security vest with the Rust insignia
 Riot-control shoulder pads
 Reinforced forearm guards
 Steel-toe security boots
 Utility belt carrying restraints and radio equipment
Move Set
Brick Breaker Punch
Running Shoulder Charge
Ground Stomp
Grab & Wall Slam
Rage Punch (low health)

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

### [the-rebellion#17] primary - GameDesignDocument/The Rebellion.docx
5. Rust Overseers — “The Architects of Control” end of level boss
Role: District bosses, strategic masterminds, Varr’s inner circle Theme: Control through surveillance, fear, and psychological domination Combat Style: Tactical, oppressive, each with unique mechanics
🧠 1. Overseer Kade Voss — “The Eye of the Market”
Boss Theme: Surveillance, prediction, drones, holograms
Arena: Neon Market control hub with screens, drones, hologram emitters
Phase 1 — “Data Acquisition”
📡 Predictive Strike
Voss’s visor scans Zed, projecting a red line showing where he thinks Zed will move.
After 1s, a laser shot fires along that line
Forces players to break patterns
🛸 Drone Swarm
Summons 3–5 drones that orbit him.
Drones shoot small taser bolts
Destroyable
Creates bullethell pressure
🔍 Hologram Decoy
Creates 2 hologram copies.
Copies mimic movement but don’t attack
Real Voss flickers slightly
Forces target identification
📊 Data Spike
Voss slams his hand into a console.
Electric pillars erupt from the ground
Pattern changes each use
Punishes stationary players
Phase 2 — “System Override”

### [the-rebellion#18] primary - GameDesignDocument/The Rebellion.docx
Triggered at 50% HP. Arena lights dim; drones turn red.
🧠 Predictive Lockdown
Voss’s visor locks onto Zed.
Zed’s special meter is disabled for 10 seconds
Voss becomes more aggressive
Forces reliance on fundamentals
🛸 Drone Fusion
Remaining drones merge into a MegaDrone.
Fires sweeping laser beams
Moves slowly
Adds a second bosslike threat
💥 Hologram Assault
Now holograms can attack.
Each hologram performs a weak punch or shot
Real Voss attacks simultaneously
Creates chaotic multiangle pressure
⚡ System Crash (Super Move)
Voss overloads the arena grid.
Entire floor becomes electrified except safe zones
Safe zones shift every second
Forces constant movement
🔥 2. Overseer Rhea Calder — “The Iron Matron”
Boss Theme: Industrial power, machinery, brute force
Arena: Factory floor with conveyors, crushers, steam vents
Phase 1 — “Discipline Through Strength”
🔨 Forge Hammer Smash
Massive overhead hammer strike.
Shockwave travels across floor
Can break player guard
Slow but devastating
💢 Hydraulic Grab
Exosuit arms extend to grab Zed.
Long reach
Leads into a slam or throw

### [the-rebellion#19] primary - GameDesignDocument/The Rebellion.docx
Super Armor during startup
🔥 Steam Burst Armor
Calder vents steam from her suit.
Grants temporary invulnerability
Pushes player back
Used to reset pressure
📦 Conveyor Trap
Activates conveyor belts.
Moves player toward crushers or hazards
Forces repositioning
Adds environmental danger
Phase 2 — “Factory Protocol”
Triggered at 40% HP. Calder’s exosuit glows red.
🔧 Overclock Mode
Her attack speed increases.
Hammer swings faster
Grab startup reduced
Steam bursts more frequent
🛠 Industrial Barrage
Summons robotic arms from the background.
Arms punch or grab from offscreen
Telegraphs with flashing lights
Adds multidirectional threats
💥 Furnace Slam (Super Move)
Calder leaps and slams her hammer into the ground.
Creates molten cracks across the floor
Cracks explode after 2 seconds
High damage, large AoE
🌫 3. Overseer Silas Wren — “The Whisper on the Rooftops”
Boss Theme: Mobility, stealth, vertical control
Arena: Rooftop platforms, zip lines, breakable ledges
Phase 1 — “Silent Hunter”
🪝 GrappleDash Barrage
Silas zips between platforms.
Attacks from above or behind
Very fast

### [the-rebellion#20] primary - GameDesignDocument/The Rebellion.docx
Hard to punish without prediction
⚔️ Skyline Snare
Throws electrified wire traps.
Traps restrict movement
Can immobilize briefly
Forces careful navigation
👣 Silent Step
Turns semiinvisible.
Only faint outline visible
Next attack is guaranteed critical
Used unpredictably
⬇️ Rooftop Execution
Dive attack from above.
High damage
Creates shockwave
Punishes players who stay grounded
Phase 2 — “Ghost of the Skyline”
Triggered at 50% HP. Silas becomes faster and quieter.
🪝 Grapple Clone
Creates afterimages when grappling.
Afterimages perform fake attacks
Real Silas attacks from unexpected angle
⚡ Shadow Pulse
Silas releases a burst of energy.
Knocks player back
Resets spacing
Used after combos
🌫 Vanish Storm (Super Move)
Silas disappears completely.
Multiple silhouettes attack from all sides
Real Silas finishes with a heavy strike
Requires reading patterns
☣ 4. Overseer Dr. Maren Holt — “The Voice of Compliance”
Boss Theme: Chemicals, toxins, psychological control
Arena: Undercity lab with gas vents, toxin pools, fog zones
Phase 1 — “Chemical Control”
💨 Fear Gas
Releases purple fog.

### [the-rebellion#21] primary - GameDesignDocument/The Rebellion.docx
Distorts player controls
Causes screen blur
Forces careful movement
🧪 Obedience Mist
Green fog that slows movement.
Reduces dodge distance
Makes combos harder
☣ Toxin Burst
Throws chemical vials.
Creates AoE damage zones
Zones linger
Controls space
💉 Sedative Shot
Fires a dart.
Reduces player attack speed
Used to punish aggressive players
Phase 2 — “Doctor’s Orders”
Triggered at 40% HP. Holt’s suit glows with chemical pressure.
🧬 NeuroFog
Entire arena fills with fog.
Player vision reduced
Holt becomes harder to track
She uses stealth attacks
🧪 Corrosive Wave
Throws a large vial that explodes.
Creates spreading acid
Damages both player and Holt
Forces repositioning
☣ Compliance Protocol (Super Move)
Holt releases a massive chemical cloud.
Player controls reverse
Damage over time
Holt becomes extremely aggressive
⚡ 5. Overseer Halden Varr — “The Architect of Rust”
Boss Theme: Authority, mastery, hybrid combat
Arena: Corporate Tower command chamber
Phase 1 — “Authority”
⚡ Authority Strike
Electrified gauntlet punch.
High damage
Causes knockback
Fast startup
🛡 Command Shield

### [the-rebellion#22] primary - GameDesignDocument/The Rebellion.docx
Deploys energy shield.
Blocks all frontal attacks
Must be flanked or broken
📡 Command Override
Summons Rust units.
Grunts, Rangers, or Specialists
Varr fights alongside them
🔧 Adaptive Counter
Varr changes stance based on player behavior.
Antiair stance
Antirush stance
Anticombo stance
Forces adaptation
Phase 2 — “Rust Protocol”
Triggered at 30% HP. Varr dons full armor.
⚙ Hybrid Assault
Uses moves from all Rust unit types:
Breaker slam
Ranger taser shot
Fang gauntlet combo
Overseerstyle control attacks
🛸 Drone Command
Summons elite drones.
Drones fire lasers
Create bullethell patterns
⚡ Rust Collapse (Super Move)
Varr overloads his armor.
Massive AoE explosion
Arena walls electrify
Final phase becomes relentless
Level style and Design
Level-style-01-brick-red-alley

### [zed-rage-system-spec#1] primary - GameDesignDocument/Zed Rage System Spec.docx - Zed Special Attack: Rage System
The Rebellion: Game Design Document section. Final draft for review.
Status: design complete. Numbers are starting values to be tuned in playtests. See Section 10 for open items.

### [zed-rage-system-spec#3] primary - GameDesignDocument/Zed Rage System Spec.docx - 2. Lore
Zed's rage is born from the Rust's false promises, the disappearance of his father, and his willingness to fight for his city.
The Special is the release of that rage: a refusal to let his city fall the way his father was taken from it. The Rust is the source of the rage, so every Rust enemy feeds it. The father's story stays implied in the Special itself and is left for cutscenes and dialogue to reveal.

### [zed-rage-system-spec#4] primary - GameDesignDocument/Zed Rage System Spec.docx - 3. Availability
[table]
Level | Rage meter | Special
Level 1 (pace level) | Hidden, cannot fill | Unavailable
Level 2 onward | Visible and active | Available when the meter is full
The meter resets to 0 at the start of every level and on a retry. Nothing carries over.
On Level 2 the meter slides into the HUD and a one-time prompt explains it.

### [zed-rage-system-spec#5] primary - GameDesignDocument/Zed Rage System Spec.docx - 4.1 Source
Landing a blow on any Rust enemy, including bosses, adds Rage.
Every blow adds the same base amount, whichever normal move lands it (light, heavy or jump kick).
All of Zed's normal moves work as usual until the meter is full.
Misses give nothing. Kills and combo finishers give no extra bonus.

### [zed-rage-system-spec#6] primary - GameDesignDocument/Zed Rage System Spec.docx - 4.2 Clean-streak bonus
Landing blows without taking a hit in between adds a bonus. Taking a hit ends the streak.

### [zed-rage-system-spec#7] primary - GameDesignDocument/Zed Rage System Spec.docx - 4.3 Drain
The meter drains on a timer at all times, whether or not the player is fighting. The drain pauses during the pause menu, wave transitions and any cutscenes.
[table]
Setting | Value
Meter range | 0 to 100
Base gain per blow | +3
Clean-streak bonus | +2 extra per blow after 3 consecutive clean blows (so +5)
Streak resets when | Zed takes a hit
Drain while building | 2 per second

### [zed-rage-system-spec#8] primary - GameDesignDocument/Zed Rage System Spec.docx - 5. Ready State
When the meter reaches 100, Rage is READY. It holds at 100 for a 4-second window so the player can finish what they are doing and press L. If the window passes without the press, the meter starts draining from 100 on the normal timer and must be rebuilt.
The window exists because a full meter that drained at once would fall below 100 and could never fire.

### [zed-rage-system-spec#9] primary - GameDesignDocument/Zed Rage System Spec.docx - 6.1 Activation
With the meter READY, the player presses L (keyboard). The gamepad binding is to be designed.
If Zed cannot start Rage at that moment (for example, mid-jump), the press is buffered and Rage begins when he lands.
A hit or a knockout cancels a buffered press. The press is also lost if the READY window runs out first.

### [zed-rage-system-spec#11] primary - GameDesignDocument/Zed Rage System Spec.docx - 6.3 Ending
Rage ends when the meter reaches 0, or immediately if Zed is knocked out (health reaches 0). A knockdown from a hit does not end it. Zed's normal moves then return, and the meter must be refilled from 0 by landing blows on Rust enemies.

### [zed-rage-system-spec#12] primary - GameDesignDocument/Zed Rage System Spec.docx - 7. Expected Pacing
Assuming about 1.2 blows per second in active combat:
[table]
Play style | Time to fill
Sloppy (frequently hit, little bonus) | About 60 seconds
Clean (long no-hit streaks) | About 25 seconds
Not fighting | Meter drains to 0 in about 50 seconds
The target is one or two Rages per level for most players. Clean play is visibly faster, but sloppy play is never locked out.

### [zed-rage-system-spec#13] primary - GameDesignDocument/Zed Rage System Spec.docx - 8. Art Direction
For the Art Director. A rage meter that visibly fills from Level 2 onward, placed near Zed's health bar but clearly distinct from it in shape and colour.
Palette: ember to orange to red-white as it fills.
Motion: the meter bubbles or pulses, and the pulse gets faster as the fill rises.
READY state: the frame flares, a READY cue and the L prompt appear, and a visible 4-second window shows how long the player has.
Rage active: the meter shows a clear 9-second countdown.
Zed: a subtle aura while building, and a stronger glow on his eyes and fists for the whole of Rage. The art can hint at the loss behind it, with grief turning to fire.
Feedback: spark or number pops at the meter on each blow, a flash and impact beat on activation, and a distinct effect when Rage ends.
Accessibility: do not rely on colour alone. Use pulse speed and icon changes as well.

### [zed-rage-system-spec#16] primary - GameDesignDocument/Zed Rage System Spec.docx - 10. Open Items
[table]
Item | Status
Special move damage and recovery time | Placeholders. Set during balancing. Per-hit damage and the 9-second duration must be balanced together so the Special is strong but never a full boss kill.
Gamepad binding | To be designed.
Final tuning | All numbers in Sections 4 to 6 are starting values for playtests.

### [zed-rage-system-spec#17] primary - GameDesignDocument/Zed Rage System Spec.docx - Assumptions to confirm at sign-off
The 4-second READY window (added so a draining full meter can still be used).
The starting numbers: +3 per blow, +2 bonus after 3 clean blows, drain of 2 per second, Rage duration of 9 seconds.
A heavy attack and a jump kick give the same Rage as a light attack.
A knockdown does not end Rage. Only a knockout does.
A hit cancels a buffered L press.
The meter resets on a retry as well as at level start.
Lore wording has not yet been checked against the existing GDD and content/lore files.

### [level-01-brick-red-alley#1] derived - design/levels/level-01-brick-red-alley.md - Level 1: Brick-Red Alley (style guide)
Owner agent: `level-style-01-brick-red-alley-agent`. Status: **2026-10-20, style set**.

### [level-01-brick-red-alley#2] derived - design/levels/level-01-brick-red-alley.md - Known from the level data (do not contradict)
- District: `brick-red-alley`
- Theme: Zed's home alley: brick walls, a mustard corner shop, mural panels and an open window with music.
- Palette (GDD family): #A8402E, #E3A92B, #6B4423, #2F6B3F
- Time limit: 120 s. Waves: 3. Enemies named: grunt.
- Intro: "Home. The alley where Zed learned to fight, dance and argue like family. Push the Rust back and let the block breathe."
- Outro: "The alley is ours again. A window cracks open and a record starts to play. Zed grins. Next stop, Mustard Row."

### [canon#8] derived - design/lore/canon.md - Zed — The Boy from Brick‑Red Alley
Zed grew up in the heart of Fallen City, in a neighbourhood painted with “corner shops, murals celebrating local heroes, open windows with music drifting out”. His block was known for its mustard‑yellow storefronts, forest‑green basketball courts, and the brick‑red alley where kids learned to fight, dance, and argue like family. It wasn’t perfect, but it was alive — culturally rich, loud, hopeful, and full of people who looked out for each other.
His mother ran a tiny food stall near the community garden, serving hot bowls of stew to anyone who needed a meal. His father, a muralist, painted the faces of local heroes across the district walls — cooks, musicians, activists, teachers — everyday people who kept Fallen City standing. Zed grew up believing that strength wasn’t about power; it was about protecting the people who gave your life meaning.

### [canon#9] derived - design/lore/canon.md - The Fall of Fallen City
Everything changed when RUST, the private security force, swept through the districts. The document describes the city as “overtaken Rust a corrupt private Security Force” — and Zed saw it firsthand.
RUST didn’t arrive like soldiers; they arrived like thieves. They shut down the basketball courts. They fenced off the community gardens. They patrolled the alleys where kids used to play. They tore down murals — including his father’s — replacing them with surveillance towers and propaganda screens.
Zed’s father disappeared after confronting RUST officers during a mural teardown. His mother’s food stall was seized for “security violations.” Friends vanished. Neighbours were beaten. The city’s heartbeat went quiet.
Zed didn’t have a choice. He had to fight.

### [critic-log#4] derived - design/lore/critic-log.md - Proposed, not applied (outside design/lore)
| # | File | Line | Before | After | Rule | Owner |
|---|---|---|---|---|---|---|
| 2 | `GameDesignDocument/The Rebellion.docx` (Pitch) | n/a | "overtaken Rush a corrupt private Security Force" | "overtaken by the Rust, a corrupt private Security Force" | Lore break: Rush/Rust spelling | GDD owner |
| 3 | same | n/a | "The Rebellion first of the Fallen city" | "The Rebellion: Fists of the Fallen City" | Lore break: title and "Fallen City" capitalisation | GDD owner |
| 4 | same | n/a | "fight your way through Fallen to get it back" | "fight your way through the Fallen City to get it back" | Lore break: "Fallen" alone; canonical name is "Fallen City" | GDD owner |
| 5 | `design/ux/menu-concept.md` | 4 | "edge of a fallen city block" | "edge of a Fallen City block" | Lore: lowercase reads as a generic description, not the place name | Art/UX owner (design/ux not in this pass's edit scope) |
| 6 | `design/ux/main-menu.md` | 29, 43-45 | Wireframe shows "START GAME" and prompt "Enter / A : Select"; concept shows "Fight" and "W/S select / Enter confirm" | Use FIGHT and the footer in `menu-copy.md` | Consistency: two specs disagree on button label and footer | ui |
| 7 | `design/ux/win.md` | 17 | "Rust has been driven out of the arena." | "The Rust have been pushed back." | Lore: Rust read as a place or stain (known candidate, not part of this menu pass) | ux owner |

### [canon#4] derived - design/lore/canon.md - World (from Theme)
Lived-in, human, culturally rich. Corner shops, murals celebrating local heroes, open windows with music, basketball courts, food stalls, community gardens. Casual fits, expressive colours.

### [canon#12] derived - design/lore/canon.md - Tone & Personality
Zed embodies the game’s theme: “hopeful, energetic, full of personality and stories.” He’s expressive, stubborn, and fiercely loyal. He cracks jokes mid-fight. He refuses to back down. He carries the city’s colours in his outfit — mustard yellow, brick red, forest green — as a reminder of what he’s fighting for.

### [canon#6] derived - design/lore/canon.md - Tone rules
- Hopeful, energetic, full of personality and stories. Fighting back, reclaiming a home.
- Zed's side is hopeful and never gloats; lose screens encourage a retry. Never gory (no blood or dismemberment wording).
- The Rust are menacing, as the GDD writes them: brutal, ruthless, and set on eliminating rebels. Their threat is stated plainly, not softened.
- Zed's side copy is warm and plain-spoken, in a neighbourhood voice. No military or clinical phrasing.
- Rust copy is cold, official and threatening (notices, orders, barks): "suppress", "crush", "eliminate rebels" are in character for the Rust. It is still shown as something the community answers or defaces.

### [lose#2] derived - design/ux/lose.md - Purpose
Tell the player they lost and **exactly why**, then get them back into the fight in one press. The GDD lose condition is: "Get knocked out by health bar or if time runs out" (p.2). These are two distinct reasons with two distinct messages. The tone is encouraging, not punishing: the theme is hopeful and energetic, and the loop depends on fast retries.

### [menu-concept#4] derived - design/ux/menu-concept.md - Background posters (non-interactive)
- "Local Heroes Benefit: Keep the Lights On": cream, forest-green text. Ties back to the original Local Heroes Mural idea.
- Rust Notice 114, "CURFEW" struck through: brick red. It shows the Rust security force's control and the community defacing it.

### [menu-copy#3] derived - design/lore/menu-copy.md - Background posters
| id | text |
|---|---|
| menu.poster.benefit.title | LOCAL HEROES BENEFIT |
| menu.poster.benefit.line | Keep the Lights On |
| menu.poster.rust.title | RUST NOTICE 114 |
| menu.poster.rust.struck | CURFEW (struck through, hand-inked cross-out) |
The poster is one line in the concept doc ("Local Heroes Benefit: Keep the Lights On"); splitting at the colon into title and line is allowed. If kept on one line, use the colon form.

### [critic-log#5] derived - design/lore/critic-log.md - Audited and fine
- Title "THE REBELLION" and subtitle "Fists of the Fallen City": match GDD title; "Fallen City" correct.
- Option labels Fight, Controls, Options, Quit: short, active, fit the voice. FIGHT suits the "Fists" title. Note that Options has no spec and Quit is not meaningful in a browser (open question 7 in canon).
- Poster "Local Heroes Benefit: Keep the Lights On": hopeful, community voice, matches the GDD's murals of local heroes. No change.
- Poster "Rust Notice 114 / CURFEW struck through": Rust is named as a force that issues orders, not a place, and the cross-out shows the community answering it. Tone is right. Caveat: the curfew and numbered notices are not in the GDD; logged as open question 1, treated as flavour.
- Rust/Rush: no occurrence of "Rush" in any menu text. The only instance is the GDD Pitch (item 2).

### [level-01-brick-red-alley-2#1] reference - exports/level-01-brick-red-alley.pdf
Level 1: Brick-Red Alley (style guide)
Owner agent: level-style-01-brick-red-alley-agent . Status: 2026-10-20, style set.
Known from the level data (do not contradict)
District: brick-red-alley Theme: Zed's home alley: brick walls, a mustard corner shop, mural panels and an open window with music. Palette (GDD family): #A8402E, #E3A92B, #6B4423, #2F6B3F Time limit: 120 s. Waves: 3. Enemies named: grunt. Intro: "Home. The alley where Zed learned to fight, dance and argue like family. Push the Rust back and let the block breathe." Outro: "The alley is ours again. A window cracks open and a record starts to play. Zed grins. Next stop, Mustard Row."
House rules that apply to every level
Source: design/art/style-guide.md .

### [player-psychologist#5] reference - gdd-review-kit-main/reviews/player-psychologist.md - Finding 5: The player's motivation and context are thin ("corrupt private security force"), and the level flow is never described
**Problem:** The document says the player fights a corrupt security force through urban districts but gives no goal beyond clearing arenas. There is no sense of a journey across districts, no variety between levels, and no pacing (breathers, bosses, escalation). Repeated arena clearing with a timer risks monotony. This is a player-experience concern about variety and momentum, not a story critique. Also, the title and pitch text are inconsistent ("The Rebellion", "Fists of the Fallen City", "first of the Fallen city"), so players and marketing get no clear identity for the experience.
**Source:** Pitch: "fight through urban districts overtaken Rush a corrupt private Security Force"; the only level structure given is "Defeat Wave / Clear Arena".
**Severity:** MINOR

### [critic-log-2#5] reference - exports/critic-log.docx - Audited and fine
Title "THE REBELLION" and subtitle "Fists of the Fallen City": match GDD title; "Fallen City" correct.
Option labels Fight, Controls, Options, Quit: short, active, fit the voice. FIGHT suits the "Fists" title. Note that Options has no spec and Quit is not meaningful in a browser (open question 7 in canon).
Poster "Local Heroes Benefit: Keep the Lights On": hopeful, community voice, matches the GDD's murals of local heroes. No change.
Poster "Rust Notice 114 / CURFEW struck through": Rust is named as a force that issues orders, not a place, and the cross-out shows the community answering it. Tone is right. Caveat: the curfew and numbered notices are not in the GDD; logged as open question 1, treated as flavour.
Rust/Rush: no occurrence of "Rush" in any menu text. The only instance is the GDD Pitch (item 2).

## Need more?
`node pipeline/search.mjs "<query>" -k 8 --full` searches all 599 chunks across 57 documents.
