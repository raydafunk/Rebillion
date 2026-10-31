#!/usr/bin/env node
// Tracks the evaluate -> refine loop so it stops at a score threshold or a retry cap.
//   node pipeline/refine.mjs record "<target>" <score> "<reason summary>"
//   node pipeline/refine.mjs status "<target>"
// Exit code of `status`: 0 = pass, 1 = refine again, 2 = cap reached without passing.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const THRESHOLD = 8;
const MAX_ROUNDS = 3;
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'evals');
const [cmd, target, score, ...rest] = process.argv.slice(2);

if (!cmd || !target) {
  console.error('usage: refine.mjs record <target> <score> <reason> | status <target>');
  process.exit(64);
}

const file = path.join(dir, target.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') + '.json');
const load = () => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { target, rounds: [] });

if (cmd === 'record') {
  const n = Number(score);
  if (!Number.isInteger(n) || n < 0 || n > 10) {
    console.error('score must be an integer 0-10');
    process.exit(64);
  }
  const state = load();
  state.rounds.push({ round: state.rounds.length + 1, score: n, reason: rest.join(' '), at: new Date().toISOString() });
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state, null, 2));
}

const state = load();
const last = state.rounds.at(-1);
if (!last) {
  console.log(`${target}: no evaluations yet`);
  process.exit(1);
}
const done = last.score >= THRESHOLD;
const capped = !done && state.rounds.length >= MAX_ROUNDS;
const trail = state.rounds.map((r) => r.score).join(' -> ');
console.log(`${target}: ${trail} (threshold ${THRESHOLD}, round ${state.rounds.length}/${MAX_ROUNDS})`);
console.log(done ? 'PASS' : capped ? 'CAP REACHED: escalate to owner' : 'REFINE AGAIN');
process.exit(done ? 0 : capped ? 2 : 1);
