// Single source of truth for the content pipeline. Edit here, not in the scripts.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PATHS = {
  corpus: path.join(ROOT, 'pipeline', 'corpus', 'corpus.json'),
  manifest: path.join(ROOT, 'pipeline', 'corpus', 'manifest.json'),
  briefs: path.join(ROOT, 'pipeline', 'briefs'),
  content: path.join(ROOT, 'content'),
  report: path.join(ROOT, 'content', 'REPORT.md'),
  bundle: path.join(ROOT, 'content', 'build', 'content.json'),
};

// Every file with one of these extensions anywhere under ROOT is read, so a new GDD doc is picked up automatically.
export const DOC_EXTENSIONS = ['.docx', '.pdf', '.md', '.txt'];
export const EXCLUDE_DIRS = ['.git', 'node_modules', '.claude', 'pipeline', 'content', 'assets'];

// First matching rule wins. primary = the owner's GDD; derived = specs agents wrote from it; reference = everything else.
export const AUTHORITY_RULES = [
  { match: /^GameDesignDocument\//, authority: 'primary' },
  { match: /^design\//, authority: 'derived' },
  { match: /^PDf\//, authority: 'reference' },
  { match: /^gdd-review-kit-main\//, authority: 'reference' },
  { match: /.*/, authority: 'reference' },
];

// One entry per content type. `agent` is the .claude/agents/ writer, `needs` are types that must be generated first.
export const CONTENT_TYPES = {
  lore: {
    agent: 'lore-writer-agent',
    dir: 'content/lore',
    needs: [],
    queries: [
      'Zed hero backstory neighbourhood Brick-Red Alley family',
      'Rust private security force corrupt city overtaken',
      'Fallen City districts theme lived-in murals food stalls community gardens basketball courts',
      'tone hopeful energetic personality stories palette',
      'Local Heroes mural Rust Notice curfew poster',
    ],
    summary: 'Districts, characters, factions, places and story beats.',
  },
  enemies: {
    agent: 'enemy-designer-agent',
    dir: 'content/enemies',
    needs: [],
    queries: [
      'Enemy agent AI chase attack attacker cap enemy type',
      'Rust enemies telegraph readable wind-up attack',
      'enemy behaviours dynamic enemy waves difficulty',
      'Rust security force uniform visor cold hue boxy',
      'health damage hitbox values',
    ],
    summary: 'Rust enemy roster beyond the Tier 0 grunt: role, behaviour, telegraph, stat block.',
  },
  levels: {
    agent: 'level-designer-agent',
    dir: 'content/levels',
    needs: ['enemies', 'lore'],
    queries: [
      'urban districts levels arena clear wave win time frame',
      'wave spawner spawn triggers rate cap positions difficulty',
      'win conditions lose conditions timer level won next level',
      'background themes corner shops murals open windows basketball courts',
      'camera lock world bounds arena',
    ],
    summary: 'District levels: arena theme, wave plans, time limits, intro/outro beats.',
  },
  dialogue: {
    agent: 'dialogue-agent',
    dir: 'content/dialogue',
    needs: ['lore', 'enemies'],
    queries: [
      'Zed tone personality cracks jokes mid-fight stubborn loyal',
      'win screen lose screen retry why you won or lost',
      'Rust Notice curfew propaganda screens surveillance',
      'menu posters footer hint Local Heroes Benefit Keep the Lights On',
      'hopeful tone never grim never gory',
    ],
    summary: 'Zed barks, Rust notices/taunts, win/lose/retry lines, poster copy.',
  },
};

export const BRIEF_TOP_K = 5;
