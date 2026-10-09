// Stage 2 - BRIEF. Retrieves the GDD passages each writer needs and assembles pipeline/briefs/<type>.md.
//   node pipeline/brief.mjs [type ...] [--focus "extra theme"]
// The brief is the writer agent's grounded context: task, schema, rules, retrieved GDD chunks (with ids to cite),
// engine files to stay compatible with, and what content already exists.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, PATHS, CONTENT_TYPES, BRIEF_TOP_K } from './config.mjs';
import { SCHEMAS, LORE_RULES, ENGINE_FILES } from './schemas.mjs';
import { loadCorpus, query } from './search.mjs';

export function existingContent(type) {
  const dir = path.join(PATHS.content, type);
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.json'))) {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      for (const it of Array.isArray(j) ? j : [j]) out.push({ id: it.id, name: it.name || it.trigger || '', file: `content/${type}/${f}` });
    } catch { /* validate.mjs reports malformed files */ }
  }
  return out;
}

export function buildBrief(type, corpus, { focus = '' } = {}) {
  const cfg = CONTENT_TYPES[type];
  const schema = SCHEMAS[type];
  const seen = new Set();
  const chunks = [];
  const queries = focus ? [...cfg.queries, focus] : cfg.queries;
  for (const q of queries) {
    for (const c of query(corpus, q, BRIEF_TOP_K)) if (!seen.has(c.id)) { seen.add(c.id); chunks.push(c); }
  }
  // The owner's own GDD always ships in full for lore-bearing types, so nothing in it is missed by retrieval.
  if (type === 'lore' || type === 'dialogue') {
    for (const c of corpus.chunks.filter((x) => x.authority === 'primary' && x.file.includes('The Rebellion.docx'))) {
      if (!seen.has(c.id)) { seen.add(c.id); chunks.push(c); }
    }
  }
  chunks.sort((a, b) => ({ primary: 0, derived: 1, reference: 2 }[a.authority] - { primary: 0, derived: 1, reference: 2 }[b.authority]));

  const existing = existingContent(type);
  const deps = cfg.needs.map((t) => [t, existingContent(t)]);
  const engine = (ENGINE_FILES[type] || []).filter((f) => fs.existsSync(path.join(ROOT, f)))
    .map((f) => `#### ${f}\n\`\`\`\n${fs.readFileSync(path.join(ROOT, f), 'utf8').trim()}\n\`\`\``).join('\n\n');

  return `# Content brief: ${type}
_Generated ${new Date().toISOString()} by pipeline/brief.mjs. Regenerate with \`node pipeline/brief.mjs ${type}\`; do not hand-edit._

**Writer agent:** ${cfg.agent}  |  **Output dir:** \`${cfg.dir}/\`  |  **Produces:** ${cfg.summary}
${focus ? `\n**Focus for this run:** ${focus}\n` : ''}
## Rules (non-negotiable)
1. Ground every item in the GDD. Cite corpus chunk ids in \`sources\` (ids are the \`[...]\` tags below). Cite only chunks you actually used.
2. Never invent lore silently. If the GDD states it, \`status: "canon"\`. If you are extending it, \`status: "proposed"\` and fill \`gddGap\` (which gap, why it fits). The owner approves proposals.
3. Authority order when sources disagree: **primary** (owner's GDD docx) > **derived** (specs in design/) > **reference** (PDF drafts, review kit, README). The GDD pitch contains the typo "Rush": the name is **Rust**. The city is **the Fallen City**.
4. Voice: hopeful, energetic, full of personality; Zed's side warm and plain-spoken; the Rust cold and official but always answered or defaced by the community. Never grim, gory, sneering or military. Enemies are pushed back or knocked down, never killed.
5. Numbers stay in engine units and near the engine's Tier 0 values (see engine files). Do not edit anything under \`src/\`.
6. Banned patterns (the validator rejects them): ${LORE_RULES.banned.map(([re, why]) => `\`${re.source}\` (${why})`).join('; ')}.
7. Write JSON files to \`${cfg.dir}/\` (one item object or an array per file, UTF-8). Then run \`node pipeline/validate.mjs ${type}\` and fix every error before you report back.

## Schema
Each item has these fields:
\`\`\`json
${JSON.stringify(schema.fields, null, 2)}
\`\`\`
Example:
\`\`\`json
${JSON.stringify(schema.example, null, 2)}
\`\`\`

## Already exists (extend, don't duplicate)
${existing.length ? existing.map((e) => `- \`${e.id}\` ${e.name} (${e.file})`).join('\n') : '_nothing yet_'}
${deps.map(([t, items]) => `\n### Upstream \`${t}\` content you may reference\n${items.length ? items.map((e) => `- \`${e.id}\` ${e.name}`).join('\n') : '_none generated yet; reference only what the GDD states_'}`).join('\n')}

## Engine / spec files to stay compatible with
${engine || '_none_'}

## Retrieved GDD passages (${chunks.length})
${chunks.map((c) => `### [${c.id}] ${c.authority} - ${c.file}${c.heading ? ' - ' + c.heading : ''}\n${c.text}`).join('\n\n')}

## Need more?
\`node pipeline/search.mjs "<query>" -k 8 --full\` searches all ${corpus.chunks.length} chunks across ${new Set(corpus.chunks.map((c) => c.file)).size} documents.
`;
}

export function writeBriefs(types, opts = {}) {
  const corpus = loadCorpus();
  fs.mkdirSync(PATHS.briefs, { recursive: true });
  const out = [];
  for (const t of types) {
    const p = path.join(PATHS.briefs, `${t}.md`);
    fs.writeFileSync(p, buildBrief(t, corpus, opts));
    out.push(p);
  }
  return out;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const fi = args.indexOf('--focus');
  const focus = fi >= 0 ? args.splice(fi, 2)[1] : '';
  const types = args.length ? args : Object.keys(CONTENT_TYPES);
  for (const t of types) if (!CONTENT_TYPES[t]) { console.error(`unknown type "${t}" (have: ${Object.keys(CONTENT_TYPES).join(', ')})`); process.exit(1); }
  for (const p of writeBriefs(types, { focus })) console.log('wrote', path.relative(ROOT, p));
}
