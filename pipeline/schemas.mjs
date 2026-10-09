// Content schemas, enum lists, house rules and engine contracts. Used by brief.mjs (to tell writers the shape)
// and validate.mjs (to enforce it). Content files are JSON: either one item object or an array of them.

export const STATUS = ['canon', 'proposed'];

// Fields every item carries.
//   sources  - corpus chunk ids ("the-rebellion#3") the item is grounded in. Must exist in the corpus.
//   status   - "canon" = stated in the GDD; "proposed" = a creative extension the owner must approve.
//   gddGap   - required when status is "proposed": the GDD gap this fills and why it fits.
const COMMON = {
  id: 'string, kebab-case, unique within its type',
  status: `one of ${STATUS.join(' | ')}`,
  gddGap: 'string; REQUIRED when status is "proposed", otherwise omit',
  sources: 'array of corpus chunk ids (at least 1)',
};

export const SCHEMAS = {
  lore: {
    kind: ['district', 'character', 'faction', 'location', 'event', 'object'],
    fields: {
      ...COMMON,
      kind: 'one of district | character | faction | location | event | object',
      name: 'string',
      summary: 'string, one sentence, <= 160 chars',
      body: 'string, 1-3 short paragraphs',
      tags: 'array of lowercase strings',
    },
    example: { id: 'brick-red-alley', status: 'canon', kind: 'location', name: 'Brick-Red Alley', summary: 'The alley where Zed and the neighbourhood kids learned to fight, dance and argue like family.', body: '...', tags: ['zed', 'home'], sources: ['the-rebellion#7'] },
  },
  enemies: {
    fields: {
      ...COMMON,
      name: 'string',
      role: 'one of grunt | bruiser | ranged | support | elite | boss',
      tier: 'integer 0-3 (0 = Tier 0 prototype; later tiers are expansions)',
      description: 'string, what the player sees (uniform, visor, cold hue, boxy shapes - Rust look)',
      behaviour: 'string, how its AI differs from the grunt (chase, circle, attacker-slot rules)',
      telegraph: 'string, the readable wind-up the player reacts to',
      weakness: 'string, how the player is meant to beat it',
      spriteKey: 'string, dotted asset key like "rust.enforcer" (see assets/asset-keys.json)',
      stats: '{ maxHp, moveSpeed, attackRange, telegraphMs, attackMs, recoverMs, damage, knockback, hitstun } - all positive numbers, same units as src/enemies/gruntData.js',
    },
    statBounds: { maxHp: [10, 400], moveSpeed: [30, 260], attackRange: [30, 400], telegraphMs: [300, 1500], attackMs: [100, 1200], recoverMs: [200, 2500], damage: [1, 40], knockback: [0, 600], hitstun: [0, 800] },
    example: { id: 'rust-enforcer', status: 'proposed', gddGap: 'GDD names one enemy type first; asks for dynamic enemy behaviours later', name: 'Rust Enforcer', role: 'bruiser', tier: 1, description: '...', behaviour: '...', telegraph: '...', weakness: '...', spriteKey: 'rust.enforcer', stats: { maxHp: 60, moveSpeed: 70, attackRange: 80, telegraphMs: 600, attackMs: 300, recoverMs: 900, damage: 14, knockback: 320, hitstun: 300 }, sources: ['the-rebellion#4'] },
  },
  levels: {
    fields: {
      ...COMMON,
      name: 'string',
      order: 'integer >= 1, play order',
      district: 'string, lore id of the district or location (must exist in content/lore)',
      theme: 'string, the lived-in setting (corner shops, murals, food stalls...)',
      palette: 'array of 3-5 hex strings from the GDD palette family (mustard, brick red, forest green, warm browns)',
      timeLimitSec: 'integer 30-600',
      intro: 'string, <= 200 chars, shown on level start',
      outro: 'string, <= 200 chars, shown on level won',
      waves: 'array of { enemy (enemy id; "grunt" is the built-in Tier 0 enemy), count, maxAlive, spawnIntervalMs, startDelayMs } - same fields as src/waves/waveData.js',
    },
    example: { id: 'level-01-brick-red-alley', status: 'proposed', gddGap: 'GDD does not define levels beyond "urban districts"', name: 'Brick-Red Alley', order: 1, district: 'brick-red-alley', theme: '...', palette: ['#9C3B2E', '#E1A92B', '#2F5D3A'], timeLimitSec: 120, intro: '...', outro: '...', waves: [{ enemy: 'grunt', count: 3, maxAlive: 3, spawnIntervalMs: 900, startDelayMs: 800 }], sources: ['the-rebellion#3'] },
  },
  dialogue: {
    triggers: ['fight_start', 'combo', 'heavy_hit', 'low_hp', 'block', 'wave_clear', 'level_won', 'lose_ko', 'lose_timeout', 'retry', 'pause', 'taunt', 'notice', 'poster', 'menu'],
    speakers: ['zed', 'rust', 'narrator', 'neighbour', 'poster'],
    fields: {
      ...COMMON,
      speaker: 'one of zed | rust | narrator | neighbour | poster',
      trigger: 'one of fight_start | combo | heavy_hit | low_hp | block | wave_clear | level_won | lose_ko | lose_timeout | retry | pause | taunt | notice | poster | menu',
      lines: 'array of 3-8 strings, each <= 80 chars, varied so repeats do not grate',
      level: 'optional level id the lines are specific to',
    },
    example: { id: 'zed-wave-clear', status: 'canon', speaker: 'zed', trigger: 'wave_clear', lines: ['One block at a time.', 'Keep the music playing.', 'That one is for the garden.'], sources: ['the-rebellion#7'] },
  },
};

// House rules shared by the writers and enforced by validate.mjs (see canon in design/lore/canon.md).
export const LORE_RULES = {
  // [regex, message]. Applied to every string value of every content item.
  banned: [
    [/\bRush\b/, 'typo for "Rust" (the GDD pitch has this typo; never copy it)'],
    [/\bRusts\b/, '"the Rust" is a collective: no "Rusts"'],
    [/\bFallen\b(?!\s+City)/, '"Fallen" alone; say "the Fallen City"'],
    [/\bfallen city\b/, 'lower-case city name; write "Fallen City"'],
    [/\b(driven|pushed|kicked|cleared)\s+out\s+of\s+the\s+Rust\b|\bthe Rust (zone|area|smell|stain)\b/i, 'Rust treated as a place or stain; it is a force of people'],
    [/\b(TARGETS? ELIMINATED|MISSION COMPLETE|HOSTILES? NEUTRALI[SZ]ED|NEUTRALI[SZ]E)\b/i, 'military/clinical phrasing on Zed\'s side'],
    [/\b(YOU DIED|PATHETIC|LOSER|GAME OVER)\b/i, 'gloating or grim lose-screen copy'],
    [/\b(gore|gory|blood|bloody|corpse|dismember\w*|brains|entrails|slaughter\w*|massacre\w*)\b/i, 'gore; tone is never gory'],
    [/\b(kill|kills|killed|killing|murder\w*)\b/i, 'lethal wording; enemies are knocked down / pushed back'],
  ],
  maxLoreSummary: 160,
  maxLine: 80,
  maxBeat: 200,
};

// Files whose numbers/shape new content must stay compatible with; pasted into the relevant briefs.
export const ENGINE_FILES = {
  lore: ['design/lore/canon.md'],
  enemies: ['src/enemies/gruntData.js', 'assets/asset-keys.json', 'design/art/style-guide.md'],
  levels: ['src/waves/waveData.js', 'src/arena/arenaData.js', 'src/state/config.js'],
  dialogue: ['design/lore/canon.md', 'design/lore/menu-copy.md'],
};
