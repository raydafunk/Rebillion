// Stage 4 - VALIDATE. Gate for generated content.
//   node pipeline/validate.mjs [type ...] [--bundle]
// Checks: JSON shape, enums, unique ids, citations exist in the corpus, canon/proposed rules, lore/tone bans,
// numeric bounds, cross-references (level -> enemy/lore). Exit code 1 on any error. --bundle writes content/build/content.json.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { PATHS, CONTENT_TYPES, ROOT } from './config.mjs';
import { SCHEMAS, LORE_RULES, STATUS } from './schemas.mjs';
import { loadCorpus } from './search.mjs';

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function* strings(v, p = '') {
  if (typeof v === 'string') yield [p, v];
  else if (Array.isArray(v)) for (let i = 0; i < v.length; i++) yield* strings(v[i], `${p}[${i}]`);
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) {
    if (k === 'sources' || k === 'gddGap' || k === '__file') continue; // citations and gap notes may quote the GDD typo
    yield* strings(x, p ? `${p}.${k}` : k);
  }
}

export function loadItems(type) {
  const dir = path.join(PATHS.content, type);
  const items = [], errors = [];
  if (!fs.existsSync(dir)) return { items, errors };
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    const file = `content/${type}/${f}`;
    try {
      const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8').replace(/^﻿/, ''));
      for (const it of Array.isArray(j) ? j : [j]) items.push({ ...it, __file: file });
    } catch (e) { errors.push({ file, msg: `invalid JSON: ${e.message}` }); }
  }
  return { items, errors };
}

function checkCommon(it, type, chunkIds, err, primaryIds) {
  if (!isStr(it.id) || !kebab.test(it.id)) err('id must be kebab-case');
  if (!STATUS.includes(it.status)) err(`status must be ${STATUS.join(' or ')}`);
  if (it.status === 'proposed' && !isStr(it.gddGap)) err('proposed items need a gddGap note');
  if (!Array.isArray(it.sources) || !it.sources.length) err('sources must list at least one corpus chunk id');
  else for (const s of it.sources) if (!chunkIds.has(s)) err(`source "${s}" not found in corpus (run pipeline/search.mjs to find real ids)`);
  if (it.status === 'canon' && Array.isArray(it.sources) && !it.sources.some((s) => primaryIds.has(s))) err('canon items must cite at least one primary (GameDesignDocument/) source; otherwise mark proposed');
  for (const [p, s] of strings(it)) {
    if (p === 'id' || p === 'spriteKey' || p === 'district' || p === 'level') continue;
    for (const [re, why] of LORE_RULES.banned) if (re.test(s)) err(`${p}: ${why} -> "${s.slice(0, 60)}"`);
  }
}

const VALIDATORS = {
  lore(it, err) {
    if (!SCHEMAS.lore.kind.includes(it.kind)) err(`kind must be ${SCHEMAS.lore.kind.join('|')}`);
    for (const k of ['name', 'summary', 'body']) if (!isStr(it[k])) err(`${k} required`);
    if (isStr(it.summary) && it.summary.length > LORE_RULES.maxLoreSummary) err(`summary > ${LORE_RULES.maxLoreSummary} chars`);
    if (!Array.isArray(it.tags)) err('tags must be an array');
  },
  enemies(it, err) {
    for (const k of ['name', 'description', 'behaviour', 'telegraph', 'weakness']) if (!isStr(it[k])) err(`${k} required`);
    if (!['grunt', 'bruiser', 'ranged', 'support', 'elite', 'boss'].includes(it.role)) err('role invalid');
    if (!Number.isInteger(it.tier) || it.tier < 0 || it.tier > 3) err('tier must be integer 0-3');
    if (!isStr(it.spriteKey) || !/^rust\.[a-z0-9-]+$/.test(it.spriteKey)) err('spriteKey must look like "rust.enforcer"');
    if (!it.stats || typeof it.stats !== 'object') return err('stats required');
    for (const [k, [lo, hi]] of Object.entries(SCHEMAS.enemies.statBounds)) {
      const v = it.stats[k];
      if (!isNum(v)) err(`stats.${k} must be a number`);
      else if (v < lo || v > hi) err(`stats.${k}=${v} outside sane range ${lo}-${hi}`);
    }
    if (isNum(it.stats.telegraphMs) && it.stats.telegraphMs < 300) err('telegraphMs < 300 is unreadable (hit-feedback spec)');
  },
  levels(it, err, ctx) {
    for (const k of ['name', 'theme', 'intro', 'outro', 'district']) if (!isStr(it[k])) err(`${k} required`);
    if (!Number.isInteger(it.order) || it.order < 1) err('order must be integer >= 1');
    if (!Number.isInteger(it.timeLimitSec) || it.timeLimitSec < 30 || it.timeLimitSec > 600) err('timeLimitSec must be 30-600');
    for (const k of ['intro', 'outro']) if (isStr(it[k]) && it[k].length > LORE_RULES.maxBeat) err(`${k} > ${LORE_RULES.maxBeat} chars`);
    if (!Array.isArray(it.palette) || it.palette.length < 3 || it.palette.length > 5 || !it.palette.every((c) => /^#[0-9a-fA-F]{6}$/.test(c))) err('palette must be 3-5 #RRGGBB strings');
    if (isStr(it.district) && ctx.lore.size && !ctx.lore.has(it.district)) err(`district "${it.district}" is not a lore id in content/lore`);
    if (!Array.isArray(it.waves) || !it.waves.length) return err('waves required');
    it.waves.forEach((w, i) => {
      const e = (m) => err(`waves[${i}]: ${m}`);
      if (w.enemy !== 'grunt' && !ctx.enemies.has(w.enemy)) e(`enemy "${w.enemy}" is neither "grunt" nor an id in content/enemies`);
      for (const k of ['count', 'maxAlive', 'spawnIntervalMs', 'startDelayMs']) if (!isNum(w[k]) || w[k] < 0) e(`${k} must be a number >= 0`);
      if (isNum(w.count) && (w.count < 1 || w.count > 30)) e('count must be 1-30');
      if (isNum(w.maxAlive) && isNum(w.count) && (w.maxAlive < 1 || w.maxAlive > w.count)) e('maxAlive must be 1..count');
      if (isNum(w.spawnIntervalMs) && w.spawnIntervalMs < 300) e('spawnIntervalMs < 300 floods the arena');
    });
    // Difficulty should climb: total enemies per wave must not shrink.
    for (let i = 1; i < it.waves.length; i++) if (it.waves[i].count < it.waves[i - 1].count) err(`waves[${i}] has fewer enemies than waves[${i - 1}]`);
  },
  dialogue(it, err) {
    if (!SCHEMAS.dialogue.speakers.includes(it.speaker)) err(`speaker must be ${SCHEMAS.dialogue.speakers.join('|')}`);
    if (!SCHEMAS.dialogue.triggers.includes(it.trigger)) err(`trigger must be ${SCHEMAS.dialogue.triggers.join('|')}`);
    if (!Array.isArray(it.lines) || it.lines.length < 3 || it.lines.length > 8) return err('lines must be an array of 3-8');
    it.lines.forEach((l, i) => {
      if (!isStr(l)) err(`lines[${i}] must be a non-empty string`);
      else if (l.length > LORE_RULES.maxLine) err(`lines[${i}] > ${LORE_RULES.maxLine} chars`);
    });
    if (new Set(it.lines).size !== it.lines.length) err('duplicate lines');
    if (it.trigger.startsWith('lose') && it.lines.some((l) => /!{2,}|\bfail(ed|ure)?\b/i.test(l))) err('lose copy must encourage a retry, not shout or call failure');
  },
};

export function validate(types = Object.keys(CONTENT_TYPES)) {
  const corpus = loadCorpus();
  const chunkIds = new Set(corpus.chunks.map((c) => c.id));
  const primaryIds = new Set(corpus.chunks.filter((c) => c.authority === 'primary').map((c) => c.id));
  const all = Object.fromEntries(Object.keys(CONTENT_TYPES).map((t) => [t, loadItems(t)]));
  const ctx = { lore: new Set(all.lore.items.map((i) => i.id)), enemies: new Set(all.enemies.items.map((i) => i.id)) };
  const result = {};
  for (const t of types) {
    const { items, errors } = all[t];
    const errs = [...errors];
    const ids = new Set();
    for (const it of items) {
      const err = (msg) => errs.push({ file: it.__file, id: it.id, msg });
      if (ids.has(it.id)) err('duplicate id');
      ids.add(it.id);
      checkCommon(it, t, chunkIds, err, primaryIds);
      VALIDATORS[t](it, err, ctx);
    }
    result[t] = { items, errors: errs, proposed: items.filter((i) => i.status === 'proposed').length };
  }
  return result;
}

export function writeBundle(result) {
  const bundle = { builtAt: new Date().toISOString() };
  for (const [t, r] of Object.entries(result)) bundle[t] = r.items.map(({ __file, ...rest }) => rest);
  fs.mkdirSync(path.dirname(PATHS.bundle), { recursive: true });
  fs.writeFileSync(PATHS.bundle, JSON.stringify(bundle, null, 2));
  return PATHS.bundle;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const bundle = args.includes('--bundle');
  const types = args.filter((a) => !a.startsWith('--'));
  const useTypes = types.length ? types : Object.keys(CONTENT_TYPES);
  for (const t of useTypes) if (!CONTENT_TYPES[t]) { console.error(`unknown type "${t}"`); process.exit(1); }
  const result = validate(useTypes);
  let bad = 0;
  for (const [t, r] of Object.entries(result)) {
    console.log(`${r.errors.length ? 'FAIL' : 'ok  '} ${t}: ${r.items.length} items (${r.proposed} proposed), ${r.errors.length} errors`);
    for (const e of r.errors) console.log(`   - ${e.file}${e.id ? ` [${e.id}]` : ''}: ${e.msg}`);
    bad += r.errors.length;
  }
  if (bundle && !bad) console.log('bundle:', path.relative(ROOT, writeBundle(validate())));
  process.exit(bad ? 1 : 0);
}
