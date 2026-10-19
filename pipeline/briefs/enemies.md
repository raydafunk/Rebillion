# Content brief: enemies
_Generated 2026-10-19T09:14:47.233Z by pipeline/brief.mjs. Regenerate with `node pipeline/brief.mjs enemies`; do not hand-edit._

**Writer agent:** enemy-designer-agent  |  **Output dir:** `content/enemies/`  |  **Produces:** Rust enemy roster beyond the Tier 0 grunt: role, behaviour, telegraph, stat block.

## Rules (non-negotiable)
1. Ground every item in the GDD. Cite corpus chunk ids in `sources` (ids are the `[...]` tags below). Cite only chunks you actually used.
2. Never invent lore silently. If the GDD states it, `status: "canon"`. If you are extending it, `status: "proposed"` and fill `gddGap` (which gap, why it fits). The owner approves proposals.
3. Authority order when sources disagree: **primary** (owner's GDD docx) > **derived** (specs in design/) > **reference** (PDF drafts, review kit, README). The GDD pitch contains the typo "Rush": the name is **Rust**. The city is **the Fallen City**.
4. Voice: hopeful, energetic, full of personality; Zed's side warm and plain-spoken; the Rust cold and official but always answered or defaced by the community. Never grim, gory, sneering or military. Enemies are pushed back or knocked down, never killed.
5. Numbers stay in engine units and near the engine's Tier 0 values (see engine files). Do not edit anything under `src/`.
6. Banned patterns (the validator rejects them): `\bRush\b` (typo for "Rust" (the GDD pitch has this typo; never copy it)); `\bRusts\b` ("the Rust" is a collective: no "Rusts"); `\bFallen\b(?!\s+City)` ("Fallen" alone; say "the Fallen City"); `\bfallen city\b` (lower-case city name; write "Fallen City"); `\b(driven|pushed|kicked|cleared)\s+out\s+of\s+the\s+Rust\b|\bthe Rust (zone|area|smell|stain)\b` (Rust treated as a place or stain; it is a force of people); `\b(TARGETS? ELIMINATED|MISSION COMPLETE|HOSTILES? NEUTRALI[SZ]ED|NEUTRALI[SZ]E)\b` (military/clinical phrasing on Zed's side); `\b(YOU DIED|PATHETIC|LOSER|GAME OVER)\b` (gloating or grim lose-screen copy); `\b(gore|gory|blood|bloody|corpse|dismember\w*|brains|entrails|slaughter\w*|massacre\w*)\b` (gore; tone is never gory); `\b(kill|kills|killed|killing|murder\w*)\b` (lethal wording; enemies are knocked down / pushed back).
7. Write JSON files to `content/enemies/` (one item object or an array per file, UTF-8). Then run `node pipeline/validate.mjs enemies` and fix every error before you report back.

## Schema
Each item has these fields:
```json
{
  "id": "string, kebab-case, unique within its type",
  "status": "one of canon | proposed",
  "gddGap": "string; REQUIRED when status is \"proposed\", otherwise omit",
  "sources": "array of corpus chunk ids (at least 1)",
  "name": "string",
  "role": "one of grunt | bruiser | ranged | support | elite | boss",
  "tier": "integer 0-3 (0 = Tier 0 prototype; later tiers are expansions)",
  "description": "string, what the player sees (uniform, visor, cold hue, boxy shapes - Rust look)",
  "behaviour": "string, how its AI differs from the grunt (chase, circle, attacker-slot rules)",
  "telegraph": "string, the readable wind-up the player reacts to",
  "weakness": "string, how the player is meant to beat it",
  "spriteKey": "string, dotted asset key like \"rust.enforcer\" (see assets/asset-keys.json)",
  "stats": "{ maxHp, moveSpeed, attackRange, telegraphMs, attackMs, recoverMs, damage, knockback, hitstun } - all positive numbers, same units as src/enemies/gruntData.js"
}
```
Example:
```json
{
  "id": "rust-enforcer",
  "status": "proposed",
  "gddGap": "GDD names one enemy type first; asks for dynamic enemy behaviours later",
  "name": "Rust Enforcer",
  "role": "bruiser",
  "tier": 1,
  "description": "...",
  "behaviour": "...",
  "telegraph": "...",
  "weakness": "...",
  "spriteKey": "rust.enforcer",
  "stats": {
    "maxHp": 60,
    "moveSpeed": 70,
    "attackRange": 80,
    "telegraphMs": 600,
    "attackMs": 300,
    "recoverMs": 900,
    "damage": 14,
    "knockback": 320,
    "hitstun": 300
  },
  "sources": [
    "the-rebellion#4"
  ]
}
```

## Already exists (extend, don't duplicate)
- `rust-iron-line-cordon` Rust Iron Line Cordon (content/enemies/rust-gdd-units.json)
- `rust-breaker` Rust Breaker (content/enemies/rust-gdd-units.json)
- `rust-watcher` Rust Watcher (content/enemies/rust-gdd-units.json)
- `rust-copper-fang` Rust Copper Fang (content/enemies/rust-gdd-units.json)
- `rust-halden-varr` Overseer Halden Varr (content/enemies/rust-gdd-units.json)
- `rust-overseer-voss` Overseer Kade Voss (content/enemies/rust-gdd-units.json)
- `rust-overseer-calder` Overseer Rhea Calder (content/enemies/rust-gdd-units.json)
- `rust-overseer-wren` Overseer Silas Wren (content/enemies/rust-gdd-units.json)
- `rust-overseer-holt` Overseer Dr. Maren Holt (content/enemies/rust-gdd-units.json)
- `rust-grunt` Rust Grunt (content/enemies/rust-roster.json)


## Engine / spec files to stay compatible with
#### src/enemies/gruntData.js
```
// Rust grunt data table (Tier 0). Placeholder numbers; tune here only.
// Times in milliseconds, speeds in px/s, rects relative to the entity origin (facing right).
// NOTE: damage/knockback/hitstun values here are placeholders until combat's combatData.js
// is final; the grunt reads them from this table only.
// Sprite key mirrors assets/asset-keys.json sprites["rust.grunt"]. src/config/assetKeys.js does
// not export it yet (outside my folders), so it is declared here.
export const GRUNT_SPRITE_KEY = 'rust.grunt';
export const GRUNT_ANIMS = {
  idle: 'rust.grunt.idle',
  approach: 'rust.grunt.walk',
  telegraph: 'rust.grunt.telegraph',
  attack: 'rust.grunt.attack',
  hitstun: 'rust.grunt.hit',
  dead: 'rust.grunt.ko',
  recover: 'rust.grunt.idle',
};
export const TELEGRAPH_FX_KEY = 'fx.telegraph';

export const GRUNT = {
  team: 'rust',
  spriteKey: GRUNT_SPRITE_KEY,
  maxHp: 30,
  moveSpeed: 90,
  circleSpeed: 55,
  laneTolerance: 22,    // max vertical (depth) offset at which an attack may start; otherwise close the gap in y first
  attackRange: 70,      // distance to target at which an attack may start
  circleRadius: 180,    // hold at this distance when no attacker slot is free
  spawnIdleMs: 400,     // idle after spawn before chasing
  telegraphMs: 450,     // visible wind-up before the hit (keep >= 300 for readability)
  attackMs: 250,        // total attack state length
  hitActiveAtMs: 100,   // hit-request is emitted this far into the attack state
  recoverMs: 700,
  hitstunMinMs: 150,
  knockbackDecay: 600,  // px/s^2
  hurtbox: { x: -20, y: -80, w: 40, h: 80 },
  attack: {
    hitbox: { x: 20, y: -65, w: 55, h: 40 },
    damage: 8,
    knockback: 220,
    hitstun: 250,
  },
};

// Max grunts that may be in telegraph/attack at once; others circle.
export const ATTACKER_CAP = 2;
```

#### assets/asset-keys.json
```
{
  "_note": "Owner: art-direction-agent. PLACEHOLDER paths; keep keys stable, swap files for final art. Resolution 1280x720. Paths relative to project root.",
  "version": 1,
  "ui": {
    "ui.bar.health.frame": "assets/ui/bar-frame-health.svg",
    "ui.bar.health.fill": "assets/ui/bar-fill-health.svg",
    "ui.bar.timer.frame": "assets/ui/bar-frame-timer.svg",
    "ui.button.default": "assets/ui/button-default.svg",
    "ui.button.hover": "assets/ui/button-hover.svg",
    "ui.button.pressed": "assets/ui/button-pressed.svg",
    "ui.button.disabled": "assets/ui/button-disabled.svg",
    "ui.panel": "assets/ui/panel.svg",
    "ui.icon.heart": "assets/ui/icon-heart.svg",
    "ui.icon.clock": "assets/ui/icon-clock.svg"
  },
  "sprites": {
    "zed": "assets/sprites/zed-placeholder.svg",
    "rust.grunt": "assets/sprites/rust-grunt-placeholder.svg"
  },
  "animations": {
    "zed": [
      "zed.idle",
      "zed.walk",
      "zed.jump",
      "zed.light",
      "zed.heavy",
      "zed.hit",
      "zed.ko"
    ],
    "rust.grunt": [
      "rust.grunt.idle",
      "rust.grunt.walk",
      "rust.grunt.telegraph",
      "rust.grunt.attack",
      "rust.grunt.hit",
      "rust.grunt.ko"
    ]
  },
  "backgrounds": {
    "bg.arena.01": "assets/backgrounds/arena-01-placeholder.svg"
  },
  "fx": {
    "fx.spark": "assets/fx/spark-placeholder.svg",
    "fx.telegraph": "assets/fx/telegraph-icon-placeholder.svg"
  },
  "hitFeedbackSpec": "design/art/hit-feedback-spec.md",
  "menu": {
    "menu.sky": "assets/menu/menu-sky.svg",
    "menu.buildings.far": "assets/menu/menu-buildings-far.svg",
    "menu.buildings.near": "assets/menu/menu-buildings-near.svg",
    "menu.street": "assets/menu/menu-street.svg",
    "menu.wall": "assets/menu/menu-wall.svg",
    "menu.strip.a": "assets/menu/strip-torn-a.svg",
    "menu.strip.b": "assets/menu/strip-torn-b.svg",
    "menu.strip.c": "assets/menu/strip-torn-c.svg",
    "menu.poster.heroes": "assets/menu/poster-local-heroes.svg",
    "menu.poster.curfew": "assets/menu/poster-curfew.svg"
  },
  "menuPalette": {
    "brick": "#9C3B2E",
    "brickDark": "#7A2F25",
    "mustard": "#E1A92B",
    "forest": "#2F5D3A",
    "brown": "#6B4A2F",
    "cream": "#E8DCC0",
    "nearBlack": "#1D1A16"
  },
  "menuFonts": {
    "display": "Anton, Impact, sans-serif",
    "mono": "'Courier Prime', 'Courier New', monospace"
  }
}
```

#### design/art/style-guide.md
```
# The Rebellion: Style Guide (Tier 0)

Status: DRAFT, pending art style approval (see Open Questions). Target resolution: 1280x720.

## 1. Art style: flat vector world, pixel art Zed

DECISION: Zed (the player character) is hand-authored pixel art. Everything else (Rust enemies, UI, backgrounds, FX, menu) stays flat vector until the owner decides otherwise (see Open Question 1). Zed's spec, prompts and sheet layout: `design/art/zed-pixellab-prompt.md`.

Zed pixel rules:
- 128x128 frame, ~96px figure, facing right, feet at bottom-centre.
- Selective 1px outline #2E1F16, 2 to 3 flat tones per colour, light from top left, no gradients, no dithering, no blur, no anti-aliasing.
- Palette limited to the Hope palette in section 2 (Mustard, Mustard Light, Warm Brown, Skin Brown, Dark Brown, Cream, small Brick Red and Forest Green accents); no Rust or combat-signal colours.
- Render the sprite with nearest-neighbour filtering (Phaser `pixelArt` or per-texture `setFilter(NEAREST)`), and keep sprite scale an integer so pixels stay square.
- The ground shadow is not baked in; the game draws the flat 25 percent black ellipse.

The rest of this section describes the flat-vector style for everything that is not Zed.

Flat-vector shapes with a thick dark outline, 2 to 3 tone cel shading, no gradients, no textures.

Why not pixel art:
- Agent-built project: SVG and simple shape rigs can be generated and edited as text by agents; hand-placed pixels cannot be generated reliably.
- The GDD budgets tokens for "at least one character to move" and an animation lead who owns a large workload. Flat vector is the cheapest path to a consistent look.
- Scales cleanly to 1280x720 and other sizes with no filtering artifacts.
- The theme (murals, bold colour, casual fits) suits big colour blocks and strong silhouettes.
- Placeholders and final art share one language, so swapping is low risk.

Rules: outline 4px at 128px sprite height (scale proportionally; Zed is the exception, 1px pixel outline per the Zed pixel rules above), outline colour #2E1F16 for Zed and the world, #14181C for Rust. Shadows are flat 25 percent black ellipses under every character, drawn by the game at runtime (never baked into any sprite, Zed's included). Light source top left.

## 2. Palette

Hope palette (Zed, world, UI):

| Name | Hex | Use |
|---|---|---|
| Mustard | #E3A92B | Primary accent, Zed jacket, buttons, timer frame |
| Mustard Light | #F2C04D | Hover, highlights |
| Brick Red | #A8402E | Panel headers, buildings, heart icon, damage, title shadow (`brickRed`) |
| Forest Green | #2F6B3F | Foliage, gardens, murals |
| Health Green | #4C9A55 / #7BC47F | Health fill / highlight |
| Warm Brown | #6B4423 | Ground, trousers, wood |
| Skin Brown | #8A5A3B | Zed skin (placeholder, open to revision) |
| Dark Brown | #2E1F16 | Outlines, text, bar frames |
| Cream | #F4E6C8 | Panels, light text on dark |
| Sand | #F2D9A0 / #E8C27A | Background sky and walls |

Rust palette (enemy, deliberately colder and harsher):

| Name | Hex | Use |
|---|---|---|
| Slate | #3C4650 | Uniform |
| Gunmetal | #2A3138 | Boots, gloves |
| Steel | #7C8A96 | Helmet |
| Visor Cyan | #4FB3D9 | Visor, Rust UI accents |
| Rust Ink | #14181C | Outline |

Combat signal colours (reserved, never used for decoration):

| Name | Hex | Use |
|---|---|---|
| Telegraph Red | #FF3B30 | Enemy attack warning only |
| Hit White | #FFFFFF | Hit flash |
| Spark Cream | #FFF6D6 | Spark core |
| Low Health | #D9822B then #FF3B30 | Bar at 50 percent and 25 percent |

Contrast: all text must reach 4.5:1 (Cream on Dark Brown ~11:1; Dark Brown on Mustard ~7:1).

## 3. Typography

Street-style set, all Google Fonts under the SIL OFL (licensing confirmed). Real values live in `src/config/assetKeys.js` (`FONTS`).

- Display (game title and large splash text): "Permanent Marker"; fallback `Impact, sans-serif`.
- Buttons and result headings (WIN/LOSE): "Anton"; fallback `Impact, sans-serif`.
- Body and small text: "Rubik" weights 500 and 700; fallback `Arial, sans-serif`.
- Numerals (timer, wave counter): Rubik 700, tabular figures.
- Sizes at 1280x720 (as built in the menu prototype): title 96px, subtitle 32px, button 36px, result heading 72px, HUD label 20px, timer 40px, minimum body 18px.
- Text: Cream with 4px Dark Brown stroke over action; Dark Brown on Mustard/Cream surfaces.

Title treatment: Mustard #E3A92B fill, Dark Brown #2E1F16 outline about 10px, hard Brick Red #A8402E offset shadow 7px right and 7px down with no blur, rotated -2.5 degrees. Subtitle: uppercase Rubik 700, Cream, same -2.5 degree tilt (6px Dark Brown stroke).

Rule: tilt only the title and subtitle. Never rotate HUD, timer, button or other gameplay text.

Font loading: canvas text must not draw before fonts are ready. Call `waitForFonts()` from `src/config/assetKeys.js` before creating text; it waits on `document.fonts.load()` for all three families with a 2.5s cap, then proceeds with the fallbacks.

## 4. UI components

- Button (260x64): Mustard fill, 4px Dark Brown outline, 12px radius, solid dark-mustard drop edge. States: default, hover (#F2C04D), pressed (#C48E1F, shifted down 4px), disabled (#8C8070). Focus ring: 4px Cream outside outline, for keyboard and gamepad. Label centred.
- Health bar (frame 360x32, fill 348x20): Dark Brown frame with Cream 3px border; fill Health Green with a lighter top band. Crop the fill by width (scaleX). Colour shifts at 50 percent and 25 percent. A delayed "chip" bar in Cream shows recent damage for 400ms. Enemy bars use Rust palette (Steel frame, Visor Cyan fill), 96x10, shown only when damaged.
- Timer (frame 160x56): Dark Brown with Mustard border; digits Cream. Last 10 seconds: digits and border pulse Telegraph Red at 2 Hz.
- Panel (560x360): Cream body, Dark Brown 6px outline, Brick Red header strip 48px, 16px radius. Used for pause, win, lose.
- Icons (32x32): flat shapes, 3px Dark Brown outline, one fill colour, rounded joins, no inner detail.
- HUD layout: health top left at (24,24), timer top centre, wave counter top right. Keep 24px safe margin. (ux-flow-designer owns final layout; this is a default.)

## 5. Characters and world

- Zed (pixel art): 128x128 frame, ~96px tall figure, mustard jacket, warm brown trousers, expressive casual fit. Facing right by default; flip for left. Pixel rules in section 1.
- Rust enemies: same frame size, uniform and symmetrical, visor, no personality colour. Contrast through cold hue and straight geometry versus Zed's rounded forms.
- Background: warm, busy mid-ground (corner shop, mural, court hoops, food stall, garden planters), calmer play lane. Background saturation and contrast lower than characters so fighters always pop. Play lane y 440 to 680 stays free of high-contrast detail.

## 6. Do and Don't

Do
- Keep silhouettes distinct: Zed is warm and round, Rust is cold and boxy.
- Reserve Telegraph Red for enemy warnings and the low-time pulse.
- Use outlines on every interactive or combat element.
- Keep the HUD readable at a glance: bar plus number, big timer.

Don't
- Don't use brick red or red-orange on enemies, which confuses damage and telegraph cues.
- Don't put busy mural detail behind the play lane.
- Don't add gradients, blur, or textures (breaks flat-vector consistency).
- Don't mix pixel art and vector assets, except the approved case: pixel-art Zed over a vector world. Keep Zed's outline colour, palette and flat shading so he still sits in the same scene, and don't apply smoothing filters to him.
- Don't rely on colour alone: telegraphs also use shape (icon) and motion.

## 7. Placeholder policy

Everything currently under `assets/` is a PLACEHOLDER generated shape, not final art. Each file contains a placeholder comment. Replace by overwriting the file at the same path or updating the path in `assets/asset-keys.json`; keys do not change.

## 9. Main menu: Wheatpaste Wall (approved brief: design/ux/menu-concept.md)

Scope: main menu scene only. Same flat-vector rule (flat shapes, no gradients, no glow, no outlines needed on scenery), but edges are torn and uneven (irregular polygons) to read as pasted paper and worn walls.

Menu palette (from the approved brief; takes precedence inside the menu scene):

| Name | Hex | Use |
|---|---|---|
| Brick | #9C3B2E | Wall, Rust notice poster |
| Brick Dark | #7A2F25 | Mortar, poster borders |
| Mustard | #E1A92B | Selected strip, lit windows, subtitle, lane dashes |
| Forest | #2F5D3A | Options strip, vines, poster text |
| Brown | #6B4A2F | Quit strip, door, ledge top |
| Cream | #E8DCC0 | Title text, Controls strip, posters, sun |
| Near-black | #1D1A16 | Title strip, ledge, silhouettes, street |

Scenery-only derived tones (placeholder values, not UI colours): sky bands #B5522F, #D07A2C, #E1A92B, #EBC862; far buildings #5B3A2E; near buildings #2B2420 with windows #3A2F28; street #2A2420.

Palette conflict to resolve: the game palette in section 2 uses Mustard #E3A92B, Brick #A8402E, Forest #2F6B3F, Brown #6B4423, Cream #F4E6C8, Dark Brown #2E1F16. The menu values differ slightly. Menu scene uses the menu set; in-game UI keeps section 2 until the owner chooses one set (open question 8).

Typography (menu): display and buttons "Anton" (heavy condensed; fallback `Impact, sans-serif`); small print, subtitle, footer hint "Courier Prime" (fallback `'Courier New', monospace`). This differs from section 3, where the title uses Permanent Marker and body uses Rubik. Courier Prime is OFL on Google Fonts (not yet loaded in `waitForFonts()`; menu-ui-agent to add). Title cream on near-black strip, tilted about 2 degrees; subtitle mustard monospace. Posters ship with block placeholders in place of text; titles must be live text over the poster sprite (SVG loaded as an image cannot use web fonts).

Strip colours: Fight mustard (selected, brightest), Controls cream, Options forest with cream text, Quit brown with cream text. Strip art is one white torn shape tinted per option. Dark text on mustard and cream; cream text on forest and brown.

Selection feedback: tween rotation to 0 and x +10px over about 100 ms, then the bright variant; mouse hover identical.

Layering (back to front): menu.sky, menu.buildings.far (parallax slow), menu.buildings.near, menu.street (place at y 360), menu.wall (x 0, left half, hides left buildings), posters and strips on the wall. Do: keep the wall busy only where the menu is not; keep text over flat areas. Don't: add glow around the sun or lit windows, gradients, or smooth rounded edges on paper.

## 8. Open questions

1. Art style approval: Zed is pixel art (decided). Open: should Rust enemies, UI and backgrounds also move to pixel art, or stay flat vector next to pixel Zed?
2. Resolution: 1280x720 assumed. Scale mode (FIT?) and whether pixel-perfect scaling is needed.
3. Sprite frame size: 128x128 assumed. Is a larger hero (e.g. 192) wanted?
4. Final animation source for Rust enemies and FX: hand-authored spritesheets, skeletal rig (Spine/DragonBones), or tween-driven vector parts? Zed is settled (hand-authored 36-frame pixel sheet, fixed in the manifest) and is out of scope here; this question only affects the Rust grunt frame counts.
5. Zed's design (skin tone, hair, silhouette, and the "young street hero" read) needs creative sign-off from the GDD owner; current look is a placeholder. The GDD does not state Zed's age, role or backstory (canon.md open question 3).
6. Resolved: fonts. Bangers replaced by Permanent Marker (display), Anton added (buttons, result headings), Rubik kept (body); all OFL. See section 3.
7. Audio sync cues for hits are not in this scope; who owns them?
8. Menu palette vs game palette (section 9 vs section 2): unify on one set? Also confirm Anton plus Courier Prime for the menu.
9. Menu SVGs are placeholders generated by script; final hand-polished art not produced. Brick wall has no texture beyond mortar lines.
```

## Retrieved GDD passages (21)
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

### [the-rebellion#8] primary - GameDesignDocument/The Rebellion.docx
Everything changed when RUST, the private security force, swept through the districts. The document describes the city as “overtaken Rust a corrupt private Security Force” — and Zed saw it firsthand.
RUST didn’t arrive like soldiers; they arrived like thieves. They shut down the basketball courts. They fenced off the community gardens. They patrolled the alleys where kids used to play. They tore down murals — including his father’s — replacing them with surveillance towers and propaganda screens.
Zed’s father disappeared after confronting RUST officers during a mural teardown. His mother’s food stall was seized for “security violations.” Friends vanished. Neighbours were beaten. The city’s heartbeat went quiet.
Zed didn’t have a choice. He had to fight.
Why Zed Fights
Zed isn’t a soldier. He’s a kid from a livedin neighbourhood who learned to fight the same way he learned to dance — through rhythm, instinct, and community.
His style reflects the game’s pillars:
Impactful, fast-paced combat — Zed’s punches feel like brickred alley brawls, scrappy but sharp.

### [the-rebellion#10] primary - GameDesignDocument/The Rebellion.docx
Zed embodies the game’s theme: “hopeful, energetic, full of personality and stories.” He’s expressive, stubborn, and fiercely loyal. He cracks jokes mid-fight. He refuses to back down. He carries the city’s colours in his outfit — mustard yellow, brick red, forest green — as a reminder of what he’s fighting for.
Character – the Enemy
Enemy Faction Lore: RUST — The Private Security Force of Fallen City
Overview
Rust began as a private security contractor hired to “stabilize” Fallen City after years of political decay and rising crime. But once they were inside, they never left. Rust transformed from a protective force into a militarized occupation, tightening control over every district and crushing resistance with brutal efficiency.
Their name comes from their signature oxidized metal armour, a symbol of decay — a reminder that Fallen City is rotting under their rule.
Rust’s soldiers are not just guards. They are enforcers, hunters, and executioners. Each unit is trained to suppress civilians, eliminate rebels, and maintain absolute control.
⚙️ Rust’s Origin

### [hit-feedback-spec#4] derived - design/art/hit-feedback-spec.md - 3. Enemy telegraphs (readable at a glance)
Every Rust attack must be dodgeable by a player who reacts to the cue.
| Attack | Windup | Cues |
|---|---|---|
| Grunt basic strike | 400ms (24f) minimum; never below 300ms | 1) 3-frame anticipation pose (arm pulled back, body leaning away) 2) Telegraph icon (`fx.telegraph`, Telegraph Red) pops above head at windup start, 120ms scale-in, holds until strike 3) body tint pulses red 15 percent for the windup 4) 1px-wider outline |
| Heavy or later enemies | 600ms | same cues, icon scaled 1.4, ground danger zone ellipse in red at 30 percent alpha |
- Strike frame is the hitbox-on frame; active for 80ms, then recovery 300ms during which the enemy is vulnerable (gives the punish window).
- Attacker cap: only the enemies currently attacking show the red cue; waiting enemies circle in neutral colours, so the cue means "this one is about to hit".
- Telegraph colour is reserved (see style guide). Do not use it for any other effect.
- Do not interrupt a windup by hit-stop on other characters.

### [style-guide#10] derived - design/art/style-guide.md - 6. Do and Don't
Do
- Keep silhouettes distinct: Zed is warm and round, Rust is cold and boxy.
- Reserve Telegraph Red for enemy warnings and the low-time pulse.
- Use outlines on every interactive or combat element.
- Keep the HUD readable at a glance: bar plus number, big timer.
Don't
- Don't use brick red or red-orange on enemies, which confuses damage and telegraph cues.
- Don't put busy mural detail behind the play lane.
- Don't add gradients, blur, or textures (breaks flat-vector consistency).
- Don't mix pixel art and vector assets, except the approved case: pixel-art Zed over a vector world. Keep Zed's outline colour, palette and flat shading so he still sits in the same scene, and don't apply smoothing filters to him.
- Don't rely on colour alone: telegraphs also use shape (icon) and motion.

### [asset-manifest#7] derived - design/art/asset-manifest.md - Rust Grunt (one enemy type), frame 128x128
| Key | Animation | Frames | FPS | Loop | Owner |
|---|---|---|---|---|---|
| rust.grunt (sprite) | static placeholder | 1 | n/a | n/a | ANIM |
| rust.grunt.idle | idle | 4 | 6 | yes | ANIM |
| rust.grunt.walk | walk | 6 | 10 | yes | ANIM |
| rust.grunt.telegraph | attack windup | 3 | 8 (about 400ms) | no | ANIM |
| rust.grunt.attack | strike and recover | 4 | 20 | no | ANIM |
| rust.grunt.hit | hit reaction | 2 | 12 | no | ANIM |
| rust.grunt.ko | knockout | 5 | 10 | no | ANIM |
Total: 24 frames. Placeholder: assets/sprites/rust-grunt-placeholder.svg.

### [canon#3] derived - design/lore/canon.md - Factions
- **Zed and the neighbourhood:** warm, rounded, casual, expressive. Fights back to get the city back.
- **The Rust:** a force of people (uniform, symmetrical, visor, cold hue, boxy). Cold, harsh, official. Not a place, a smell, a stain or a status effect. Per the GDD they turned from a protective force into a militarized occupation that crushes resistance with brutal efficiency: "enforcers, hunters, and executioners", each unit trained to suppress civilians, eliminate rebels and maintain absolute control. Breakers use illegal muscle stimulants; Copper Fangs undergo psychological conditioning; recruits are given serial numbers.

### [style-guide#9] derived - design/art/style-guide.md - 5. Characters and world
- Zed (pixel art): 128x128 frame, ~96px tall figure, mustard jacket, warm brown trousers, expressive casual fit. Facing right by default; flip for left. Pixel rules in section 1.
- Rust enemies: same frame size, uniform and symmetrical, visor, no personality colour. Contrast through cold hue and straight geometry versus Zed's rounded forms.
- Background: warm, busy mid-ground (corner shop, mural, court hoops, food stall, garden planters), calmer play lane. Background saturation and contrast lower than characters so fighters always pop. Play lane y 440 to 680 stays free of high-contrast detail.

### [canon#5] derived - design/lore/canon.md - Palette words
Mustard yellow, brick red, forest green, warm browns. Rust is the cold contrast (steel, visor cyan).

### [win#8] derived - design/ux/win.md - Data needs
Delivered once with `round-won` or in a `round-stats` event (proposed), so the screen does not need to read live game state.
| Data | Type | Source | Notes |
|---|---|---|---|
| `winReason` | enum: `arena-cleared` (Tier 0 only value) | Game State | Future: `reached-exit` |
| `wavesCleared` | number | Wave Spawner / Game State | |
| `waveTotal` | number | Wave Spawner | |
| `enemiesDefeated` | number | Enemy / Game State | |
| `secondsRemaining` | number | Timer | Value at the moment of the win |
| `timeLimitSeconds` | number | Game State | For the "(of 02:00)" text |
| `currentHealth` | number | Health & Hitbox | At the moment of the win |
| `maxHealth` | number | Health & Hitbox | |

### [hit-feedback-spec#1] derived - design/art/hit-feedback-spec.md - Hit Feedback and Telegraph Spec (Tier 0)
Status: proposed starting values for tuning. Assumes 60 FPS (1 frame = ~16.7ms). All values must live in one config object (`hitFeedback` in game data) so they can be tuned without code changes. Consumers: Player Combos, Health & Hitbox, Enemy, Camera & Bounds agents.

### [the-rebellion-final-gdd#4] reference - PDf/The Rebellion- Final Gdd.pdf
Agent Technical Desponds Budget constraint On Player Sprite Asset & Token coast to Mechanics animations for Animation make at least idle, walk, jump; Lead one character to input handling move two hundred tokens Player combos One state Player Token Cost to Agent machine for Mechanics make the attacks combos work 200 tokens Health & Shared damage, None Size is medium Hitbox Agent health, and so medium hitbox data that Health & Enemy Agent every agent Hitbox, It is large as it reads Asset & will run the Game State Chase and Animation enemy note Agent attack Asset & Wave Spawner behaviour, Animation Medium cost of Asset & attacker cap, Health & token Animation Lead one enemy type Hitbox first Agent Large as it runs Win check, lose Enemy the Animation state, time-out Agent result, retry Spawn triggers, None rate, cap, and positions Sprite source, animation list, hit stop, and feedback Camera & Arena camera Wave Bounds Agent lock, world Spawner (new) bounds, unreachable- Game State, Medium Token Menu & UI enemy failsafe Agent HUD (health, Health & use as well timer), win/lose screens, menus Hitbox

### [adversarial-qa#10] reference - gdd-review-kit-main/reviews/adversarial-qa.md - 2. CONNECTIONS
**My Finding 2 (unbounded spawns, infinite juggles) plus the Player Psychologist's Finding 4 (no cap on simultaneous attackers, no telegraphs).** Together they describe a specific unfair-death loop. Spawns with no caps and no rules for how many enemies may attack at once, combined with parry and dodge that need telegraphs the document never mentions, produce crowd deaths the player cannot read. The Psychologist sees this as churn. I add that the same missing cap is an exploit vector in the other direction: a player who juggles one enemy indefinitely can hold the rest of the wave in a passive state, if the AI waits its turn. The absent attacker cap therefore produces a cheap loss for new players and a stall win for experienced ones.

### [feasibility-lead#11] reference - gdd-review-kit-main/reviews/feasibility-lead.md - 2. CONNECTIONS
**Defensive kit dependency chain (Business Analyst F3, Player Psychologist F4, my F3/F4).** Parry and dodge need enemy attack telegraphs. Telegraphs need enemy animation. Enemy animation is unbudgeted. The Enemy Agent has a one-line brief and is depended on by parry, spawn rules (QA F2) and the attacker cap (Psychologist F4). So the Enemy Agent is the most overloaded and least specified component in the document, and no colleague states that in one place.
**Health, damage and hitbox state (Systems Designer F4) and QA F1.** No agent owns health, damage or hitbox/hurtbox data. It is the shared state that every agent reads and writes, and it is also the missing input to the lose condition. This is the most likely integration failure point.
**Timer time-out (Player Psychologist F2, Narrative Critic F3, QA F1).** Three lenses agree that time-out has no defined outcome. For the build, that means the Game Loop Agent has no defined transition on the most common failure event, so retry granularity (whole level or current wave) cannot be implemented.

### [player-psychologist#4] reference - gdd-review-kit-main/reviews/player-psychologist.md - Finding 4: Difficulty curve, death/failure handling, and player feedback are absent
**Problem:** Brawlers commonly lose players through cheap damage, unreadable enemy attacks, and crowding. The document says enemies "spawn to fight" and are "dynamic" but gives no enemy types, attack telegraphs, limits on how many can attack at once, or difficulty ramp. It also does not say what happens on death (lives, checkpoints, continues), how health is shown, or how the game makes hits feel good beyond the phrase "punchy hits". Players will not know why they lost, which is a primary churn driver.
**Source:** "Enemies spawn to fight"; "Enemy Agent: This will control the Enemies in the game"; the "Impactful Combat – punchy hits" bullet. Nothing about health, lives, difficulty, or telegraphing.
**Severity:** MAJOR

### [feasibility-lead#2] reference - gdd-review-kit-main/reviews/feasibility-lead.md - Finding 2: Feature list far exceeds the budgeted work
- Problem: The Game Mechanics section promises combos, juggle routes, block/dodge/parry, pick-up objects, wave spawning, timed levels, "character progression" and "dynamic enemy behaviours". The budget covers only "at least 1 character to move" and "the combos work". Nothing is allocated to defensive tools, juggling, pickups, progression, enemy AI, art, audio, or level content.
- Passage: "Combos and Juggle routes", "Defensive tools(block dodge, parry)", "character progression, and dynamic enemy behaviours" versus a two-line budget table.
- Severity: MAJOR. Juggle physics and parry timing windows are hard to tune, and the document doesn't say what gets cut first.

### [systems-designer#2] reference - gdd-review-kit-main/reviews/systems-designer.md - Finding 2: Progression is promised but has no defined system (BLOCKING)
**Problem:** The pitch claims "modern combo systems, character progression, and dynamic enemy behaviours". The systems sections do not mention progression. There are no stats, unlocks, upgrades, moves gained over time, level count, or difficulty ramp. Pacing across a full playthrough cannot be assessed because the document never says how long a playthrough is or how a level differs from the last. The "Corrupt private security force" is the only enemy described, and there are no enemy types, bosses or districts beyond "urban districts".
**Source:** The pitch sentence above, and the absence of any progression, level list or enemy roster anywhere else in the document.

### [adversarial-qa#2] reference - gdd-review-kit-main/reviews/adversarial-qa.md - Finding 2: Enemy spawning has no rules, so the wave system can be broken or become unwinnable (MAJOR)
**Problem:** "Enemies spawn to fight" is the entire spawn spec. Nothing defines spawn triggers, caps, rates, positions or whether spawns are timer-driven or clear-driven. If spawns are time-driven, a player who is slow (or one who hoards enemies with juggles) faces unbounded enemy accumulation. If spawns are clear-driven, a player can stand at an edge and exploit spawn positions. It is also unclear whether enemies spawn inside the player's attack range or behind the player.
**Source:** "Enemies spawn to fight", "Enemy Agent: Control the A.I Enemies" (no behavior described), and the Pitch's claim of "dynamic enemy behaviours" with no definition.
**Exploits and edge cases:** Juggle routes are advertised ("Combos and Juggle routes"). There are no rules on infinite combos, enemy hit-stun decay, or boss and heavy-enemy immunity. This is the classic brawler exploit and the document does not address it.

### [the-rebellion-final-gdd#3] reference - PDf/The Rebellion- Final Gdd.pdf
Enemy Agent Control the A.I This will control the Game State Agent Enemies Enemies in the game Win check, lose Clear the arena to Wave Spawner state, time-out win; fail and retry result, retry have rules Asset & Animation Win check, lose Difficulty comes Lead state, time-out from how waves Health & Hitbox result, retry arrive Agent Sprite source, Punchy hits" and Camera & Bounds animation list, hit readable telegraphs Agent (new) stop and feedback Owns health, Hits land, damage Menu & UI Agent damage values, and registers, the player hitbox/hurt box data can die Arena camera lock, Prevents the off- world bounds, screen soft lock unreachable-enemy failsafe The player can Builds and owns start a game, read every screen and on- the state of the screen element the fight, and see why player sees outside they won or lost the arena action Technical Strategy

## Need more?
`node pipeline/search.mjs "<query>" -k 8 --full` searches all 375 chunks across 38 documents.
