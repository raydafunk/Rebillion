// Retrieval CLI (the RAG lookup agents call from Bash).
//   node pipeline/search.mjs "zed father mural" [-k 6] [--authority primary] [--full]
// Prints chunk ids, source file, and text. Cite the ids in a content item's `sources`.
import fs from 'node:fs';
import { PATHS } from './config.mjs';
import { buildIndex, search } from './lib/search.mjs';
import { ingest } from './ingest.mjs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function loadCorpus() {
  if (!fs.existsSync(PATHS.corpus)) ingest({ quiet: true });
  const { chunks } = JSON.parse(fs.readFileSync(PATHS.corpus, 'utf8'));
  return { chunks, index: buildIndex(chunks) };
}

export function query(corpus, q, k = 6, authority = null) {
  const hits = search(corpus.index, q, authority ? 200 : k);
  return hits.map((h) => ({ ...corpus.index.byId.get(h.id), score: h.score }))
    .filter((c) => !authority || c.authority === authority).slice(0, k);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const flag = (n) => { const i = args.indexOf(n); if (i < 0) return null; return args.splice(i, 2)[1]; };
  const k = +(flag('-k') || 6);
  const authority = flag('--authority');
  const full = args.includes('--full'); if (full) args.splice(args.indexOf('--full'), 1);
  const q = args.join(' ');
  if (!q) { console.error('usage: node pipeline/search.mjs "<query>" [-k N] [--authority primary|derived|reference] [--full]'); process.exit(1); }
  const corpus = loadCorpus();
  const hits = query(corpus, q, k, authority);
  if (!hits.length) console.log('(no matches)');
  for (const h of hits) {
    const text = full ? h.text : h.text.slice(0, 400) + (h.text.length > 400 ? ' ...' : '');
    console.log(`[${h.id}] ${h.authority} | ${h.file}${h.heading ? ' | ' + h.heading : ''} | score ${h.score.toFixed(2)}\n${text}\n`);
  }
}
