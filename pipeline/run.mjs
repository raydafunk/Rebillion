// The pipeline runner.
//   node pipeline/run.mjs                    ingest -> brief -> validate -> report (no model calls, free)
//   node pipeline/run.mjs --generate         ... plus run the writer agents (headless `claude -p`) between brief and validate
//   node pipeline/run.mjs --generate --types lore,enemies --focus "the market district" --repair 2
//   node pipeline/run.mjs --generate --dry-run   print what would run
//
// Stages: 1 ingest (read all docs) -> 2 brief (RAG per type) -> 3 generate (writer agents, in dependency order,
// independent types in parallel) -> 4 validate (+ repair loop feeding errors back to the writer) -> 5 report/bundle.
// Critic pass (tone/lore audit) is a separate agent: see content-director-agent / pipeline/README.md.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { ROOT, PATHS, CONTENT_TYPES } from './config.mjs';
import { ingest } from './ingest.mjs';
import { writeBriefs } from './brief.mjs';
import { validate, writeBundle } from './validate.mjs';

const argv = process.argv.slice(2);
const opt = (n, d = null) => { const i = argv.indexOf(n); return i < 0 ? d : argv[i + 1]; };
const has = (n) => argv.includes(n);
const types = (opt('--types') ? opt('--types').split(',') : Object.keys(CONTENT_TYPES)).map((s) => s.trim());
const focus = opt('--focus', '');
const repairRounds = +(opt('--repair', 1));
const dry = has('--dry-run');
for (const t of types) if (!CONTENT_TYPES[t]) { console.error(`unknown type "${t}"`); process.exit(1); }

let agentFailures = 0;
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

function runAgent(type, prompt) {
  const { agent } = CONTENT_TYPES[type];
  if (dry) { console.log(`  [dry-run] claude -p --agent ${agent} (stdin: ${prompt.length} chars)`); return Promise.resolve(0); }
  return new Promise((resolve) => {
    // Prompt goes over stdin so quoting never matters on Windows.
    const p = spawn('claude', ['-p', '--agent', agent, '--permission-mode', 'acceptEdits'], { cwd: ROOT, shell: true, stdio: ['pipe', 'pipe', 'inherit'] });
    let out = '';
    p.stdout.on('data', (d) => { out += d; });
    p.on('error', (e) => { console.error(`  ${agent}: cannot start claude CLI (${e.message})`); resolve(1); });
    p.on('close', (code) => {
      const tail = out.trim().split('\n').slice(-3).join(' | ').slice(0, 300);
      console.log(`  ${agent} exited ${code}${tail ? ': ' + tail : ''}`);
      if (code) agentFailures++;
      resolve(code);
    });
    p.stdin.end(prompt);
  });
}

const genPrompt = (type) =>
  `Run your content job for type "${type}". Read your brief at pipeline/briefs/${type}.md first and follow it exactly. ` +
  `Write JSON content files to ${CONTENT_TYPES[type].dir}/, run "node pipeline/validate.mjs ${type}", and fix every error before you finish. ` +
  `Reply with a short summary: files written, item count, how many are "proposed".`;

const repairPrompt = (type, errors) =>
  `Your previous ${type} content failed validation. Fix ONLY these errors in ${CONTENT_TYPES[type].dir}/ (re-read pipeline/briefs/${type}.md if unsure), ` +
  `then run "node pipeline/validate.mjs ${type}" until it passes:\n` + errors.slice(0, 40).map((e) => `- ${e.file}${e.id ? ` [${e.id}]` : ''}: ${e.msg}`).join('\n');

// Group types into dependency layers; each layer runs in parallel.
function layers(selected) {
  const done = new Set(), out = [];
  let left = [...selected];
  while (left.length) {
    const ready = left.filter((t) => CONTENT_TYPES[t].needs.every((n) => done.has(n) || !selected.includes(n)));
    if (!ready.length) throw new Error('dependency cycle in CONTENT_TYPES');
    out.push(ready); ready.forEach((t) => done.add(t));
    left = left.filter((t) => !ready.includes(t));
  }
  return out;
}

function report(result, manifest) {
  const date = new Date().toISOString().slice(0, 10);
  let md = `# Content pipeline report\n_${date}_\n\n## Sources read\n${manifest.filter((m) => m.status === 'ingested').length} of ${manifest.length} documents ingested.\n\n`;
  md += manifest.map((m) => `- ${m.status === 'ingested' ? 'read' : '**SKIPPED**'} \`${m.file}\` (${m.authority})${m.status === 'ingested' ? `, ${m.chunks} chunks` : ` - ${m.reason}`}`).join('\n');
  md += '\n\n## Content\n| Type | Items | Proposed (needs owner approval) | Errors |\n|---|---|---|---|\n';
  for (const [t, r] of Object.entries(result)) md += `| ${t} | ${r.items.length} | ${r.proposed} | ${r.errors.length} |\n`;
  const proposed = Object.entries(result).flatMap(([t, r]) => r.items.filter((i) => i.status === 'proposed').map((i) => ({ t, ...i })));
  md += `\n## Proposed items awaiting owner approval (${proposed.length})\n`;
  md += proposed.length ? proposed.map((i) => `- **${i.t}/${i.id}**: ${i.gddGap}`).join('\n') : '_none_';
  const errs = Object.entries(result).flatMap(([t, r]) => r.errors.map((e) => `- ${t}: ${e.file}${e.id ? ` [${e.id}]` : ''}: ${e.msg}`));
  md += `\n\n## Validation errors (${errs.length})\n${errs.length ? errs.join('\n') : '_none_'}\n`;
  fs.writeFileSync(PATHS.report, md);
}

console.log('== 1. INGEST');
const { manifest } = ingest();
console.log('\n== 2. BRIEF');
for (const p of writeBriefs(types, { focus })) console.log('  wrote', rel(p));

if (has('--generate')) {
  console.log('\n== 3. GENERATE');
  const generated = new Set();
  for (const layer of layers(types)) {
    console.log(`  layer: ${layer.join(', ')}`);
    await Promise.all(layer.map((t) => runAgent(t, genPrompt(t))));
    layer.forEach((t) => generated.add(t));
    // downstream briefs now list the freshly written upstream ids
    const rest = types.filter((t) => !generated.has(t));
    if (rest.length) writeBriefs(rest, { focus });
  }
} else {
  console.log('\n== 3. GENERATE (skipped: pass --generate to run the writer agents, or ask content-director-agent)');
}

console.log('\n== 4. VALIDATE');
let result = validate(types);
for (let round = 1; has('--generate') && round <= repairRounds; round++) {
  const failing = Object.entries(result).filter(([, r]) => r.errors.length);
  if (!failing.length) break;
  console.log(`  repair round ${round}: ${failing.map(([t]) => t).join(', ')}`);
  await Promise.all(failing.map(([t, r]) => runAgent(t, repairPrompt(t, r.errors))));
  result = validate(types);
}
let bad = 0;
for (const [t, r] of Object.entries(result)) {
  console.log(`  ${r.errors.length ? 'FAIL' : 'ok  '} ${t}: ${r.items.length} items, ${r.errors.length} errors`);
  for (const e of r.errors.slice(0, 10)) console.log(`     - ${e.file}${e.id ? ` [${e.id}]` : ''}: ${e.msg}`);
  bad += r.errors.length;
}

console.log('\n== 5. REPORT');
const full = validate();
report(full, manifest);
console.log('  wrote', rel(PATHS.report));
if (!Object.values(full).some((r) => r.errors.length)) console.log('  bundle:', rel(writeBundle(full)));
else console.log('  bundle not written (fix validation errors first)');
if (agentFailures) console.error(`
${agentFailures} writer agent run(s) failed; content was NOT generated. If the message says "Not logged in", run \`claude\` once in a terminal to sign in, or use content-director-agent inside Claude Code instead.`);
process.exit(bad || agentFailures ? 1 : 0);
