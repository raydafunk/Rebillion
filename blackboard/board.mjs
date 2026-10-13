// Blackboard helper. Deterministic goal bookkeeping so agents never edit goals.json by hand.
// Usage: node blackboard/board.mjs <command> [args]
//   status                     table of goals
//   ready                      goals whose needs are all done and status is open
//   claim <id> <agent>         open -> claimed
//   done <id> [note]           claimed -> done
//   block <id> <reason>        -> blocked
//   reopen <id> <reason>       -> open again; everything downstream of it is reset to open.
//                              Becomes blocked when attempts reach maxAttempts.
//   reset                      every goal back to open, attempts 0
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const goalsPath = join(dir, 'goals.json');
const board = JSON.parse(readFileSync(goalsPath, 'utf8'));
const byId = (id) => {
  const g = board.goals.find((x) => x.id === id);
  if (!g) { console.error(`unknown goal: ${id}`); process.exit(1); }
  return g;
};
const save = () => writeFileSync(goalsPath, JSON.stringify(board, null, 2) + '\n');
const log = (agent, goal, event, note = '') =>
  appendFileSync(join(dir, 'log.md'), `${new Date().toISOString()} | ${agent} | ${goal} | ${event} | ${note}\n`);
const ready = () => board.goals.filter((g) => g.status === 'open' && g.needs.every((n) => byId(n).status === 'done'));
const downstream = (id) => {
  const out = new Set();
  const walk = (x) => board.goals.filter((g) => g.needs.includes(x)).forEach((g) => { if (!out.has(g.id)) { out.add(g.id); walk(g.id); } });
  walk(id);
  return [...out];
};

const [cmd, id, ...rest] = process.argv.slice(2);
switch (cmd) {
  case 'status':
    for (const g of board.goals) console.log(`${g.status.padEnd(8)} ${g.id.padEnd(18)} ${g.owner}  (attempts ${g.attempts}/${g.maxAttempts})${g.note ? '  - ' + g.note : ''}`);
    break;
  case 'ready':
    console.log(ready().map((g) => `${g.id}\t${g.owner}`).join('\n') || '(none)');
    break;
  case 'claim': {
    const g = byId(id);
    if (!ready().includes(g)) { console.error(`${id} is not ready (status ${g.status} or needs unmet)`); process.exit(1); }
    g.status = 'claimed'; g.attempts += 1; g.note = undefined; save(); log(rest[0] ?? g.owner, id, 'claimed', `attempt ${g.attempts}`);
    break;
  }
  case 'done': { const g = byId(id); g.status = 'done'; g.note = rest.join(' ') || undefined; save(); log(g.owner, id, 'done', rest.join(' ')); break; }
  case 'block': { const g = byId(id); g.status = 'blocked'; g.note = rest.join(' '); save(); log(g.owner, id, 'blocked', g.note); break; }
  case 'reopen': {
    const g = byId(id);
    const reason = rest.join(' ');
    if (g.attempts >= g.maxAttempts) { g.status = 'blocked'; g.note = `max attempts: ${reason}`; }
    else { g.status = 'open'; g.note = reason; }
    for (const d of downstream(id)) { const x = byId(d); x.status = 'open'; x.note = `reset: ${id} reopened`; }
    save(); log('director', id, g.status === 'open' ? 'reopened' : 'blocked', reason);
    break;
  }
  case 'reset': board.goals.forEach((g) => { g.status = 'open'; g.attempts = 0; g.note = undefined; }); save(); log('director', '-', 'reset'); break;
  default: console.error('commands: status | ready | claim <id> <agent> | done <id> [note] | block <id> <reason> | reopen <id> <reason> | reset'); process.exit(1);
}
