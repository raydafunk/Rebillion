// Stage 1 - INGEST. Reads every doc under the project root and writes the retrieval corpus.
//   node pipeline/ingest.mjs
// Outputs: pipeline/corpus/corpus.json (chunks) and pipeline/corpus/manifest.json (every file found + status).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { ROOT, PATHS, DOC_EXTENSIONS, EXCLUDE_DIRS, AUTHORITY_RULES } from './config.mjs';
import { READERS } from './lib/readers.mjs';
import { chunkBlocks } from './lib/chunk.mjs';

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const slug = (s) => s.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('~$')) continue; // Word lock files
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (EXCLUDE_DIRS.includes(e.name)) continue;
      yield* walk(full);
    } else yield full;
  }
}

export function ingest({ quiet = false } = {}) {
  const files = [...walk(ROOT)].filter((f) => DOC_EXTENSIONS.includes(path.extname(f).toLowerCase())).sort();
  const manifest = [];
  const chunks = [];
  const usedSlugs = new Set();

  for (const file of files) {
    const r = rel(file);
    const ext = path.extname(file).toLowerCase();
    const authority = AUTHORITY_RULES.find((x) => x.match.test(r)).authority;
    const bytes = fs.readFileSync(file);
    const entry = { file: r, authority, bytes: bytes.length, sha1: crypto.createHash('sha1').update(bytes).digest('hex').slice(0, 12) };
    try {
      const { blocks, warnings } = READERS[ext](file);
      let id = slug(path.basename(file));
      while (usedSlugs.has(id)) id += '-2';
      usedSlugs.add(id);
      const cs = chunkBlocks(blocks);
      cs.forEach((c, i) => chunks.push({ id: `${id}#${i + 1}`, doc: id, file: r, authority, heading: c.heading, text: c.text }));
      Object.assign(entry, { status: 'ingested', docId: id, chunks: cs.length, chars: cs.reduce((a, c) => a + c.text.length, 0), warnings });
    } catch (err) {
      Object.assign(entry, { status: 'skipped', reason: err.message });
    }
    manifest.push(entry);
  }

  fs.mkdirSync(path.dirname(PATHS.corpus), { recursive: true });
  fs.writeFileSync(PATHS.corpus, JSON.stringify({ builtAt: new Date().toISOString(), chunks }, null, 1));
  fs.writeFileSync(PATHS.manifest, JSON.stringify({ builtAt: new Date().toISOString(), files: manifest }, null, 2));

  if (!quiet) {
    console.log(`INGEST: ${manifest.filter((m) => m.status === 'ingested').length}/${manifest.length} docs, ${chunks.length} chunks`);
    for (const m of manifest) {
      console.log(`  ${m.status === 'ingested' ? 'ok  ' : 'SKIP'} [${m.authority}] ${m.file}` +
        (m.status === 'ingested' ? ` (${m.chunks} chunks${m.warnings.length ? '; ' + m.warnings.join('; ') : ''})` : ` - ${m.reason}`));
    }
  }
  return { manifest, chunks };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) ingest();
