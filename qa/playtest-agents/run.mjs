#!/usr/bin/env node
// Records the goal-oriented playtest agents playing The Rebellion and writes what they found.
//
//   node qa/playtest-agents/run.mjs --suite levels          playtest-level-agent: every level + adversarial passes
//   node qa/playtest-agents/run.mjs --suite bosses          playtest-boss-agent: mini-bosses and end-of-level bosses
//   node qa/playtest-agents/run.mjs --suite all
//   node qa/playtest-agents/run.mjs --only L1-brawler,EB-L1-dugan-crew   just these scenario ids
//   options: --seed N  --headed  --out <dir>  --no-blackboard  --renderer canvas (no GPU / CI: software WebGL is too slow to record)
//
// Needs Playwright with Chromium (npm i -D playwright && npx playwright install chromium). ffmpeg is optional (webm -> mp4).
// Output: qa/playtest-agents/runs/<stamp>/{videos/*.mp4|webm, report.json, REPORT.md} and blackboard/facts/playtest-*.json.
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, rename, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { SUITES, scenarioUrl } from './scenarios.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i < 0 ? d : args[i + 1]; };
const flag = (k) => args.includes(`--${k}`);
const suite = opt('suite', 'all');
const only = opt('only', '')?.split(',').filter(Boolean);
const seed = Number(opt('seed', 1));
const renderer = opt('renderer', '');
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUT = resolve(opt('out', join(ROOT, 'qa/playtest-agents/runs', stamp)));

let scenarios = SUITES[suite] || SUITES.all;
if (only.length) scenarios = SUITES.all.filter((s) => only.includes(s.id));
if (!scenarios.length) { console.error('no scenarios match'); process.exit(1); }

// ---------- static server (no-cache, like dev-server.py) ----------
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.flac': 'audio/flac', '.ogg': 'audio/ogg', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = join(ROOT, p === '/' ? 'index.html' : p);
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

// Phaser comes from jsDelivr; if this machine has it locally (offline CI), serve that instead.
const LOCAL_PHASER = [process.env.PHASER_PATH, join(ROOT, 'node_modules/phaser/dist/phaser.min.js'), join(ROOT, 'qa/playtest-agents/.cache/phaser.min.js')].find((p) => p && existsSync(p));

const { chromium } = await import('playwright');
const browser = await chromium.launch({ headless: !flag('headed'), args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
await mkdir(join(OUT, 'videos'), { recursive: true });
const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;
const results = [];

for (const s of scenarios) {
  const t0 = Date.now();
  process.stdout.write(`> ${s.id.padEnd(22)} ${s.persona.padEnd(15)} L${s.level}${s.wave ? ` W${s.wave}` : ''} ... `);
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: join(OUT, 'videos/_raw'), size: { width: 1280, height: 720 } } });
  const page = await ctx.newPage();
  if (LOCAL_PHASER) await page.route(/phaser(\.min)?\.js$/, (r) => r.fulfill({ path: LOCAL_PHASER, contentType: 'text/javascript' }));
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e.message || e).slice(0, 300)));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) pageErrors.push(m.text().slice(0, 300)); });
  await page.goto(BASE + scenarioUrl(s, seed, renderer));
  let rep = null, waveDoneAt = null;
  const deadline = t0 + s.maxSec * 1000;
  while (Date.now() < deadline) {
    await page.waitForTimeout(500);
    rep = await page.evaluate(() => window.__agent && window.__agent.report()).catch(() => rep);
    if (!rep) continue;
    if (rep.outcome) { await page.waitForTimeout(4500); rep = await page.evaluate(() => window.__agent.report()); break; } // let the result screen show in the video
    if (s.stopOn === 'wave' && s.wave && !waveDoneAt && rep.timeline.some((e) => e.type === 'wave-cleared' && e.index === s.wave - 1)) waveDoneAt = Date.now();
    if (waveDoneAt && Date.now() - waveDoneAt > 5000) break; // boss wave cleared: keep 5 s of the aftermath (victory card) on video
  }
  if (rep && !rep.outcome && !waveDoneAt) rep.findings.push({ id: 'scenario-timeout', severity: 'S3', title: `Scenario hit its ${s.maxSec}s cap before the round ended`, detail: `goal at cap: ${rep.timeline.filter((e) => e.type === 'goal').pop()?.id}`, count: 1 });
  if (rep && pageErrors.length) rep.findings.push({ id: 'page-errors', severity: 'S2', title: `${pageErrors.length} JavaScript error(s) in the page`, detail: [...new Set(pageErrors)].slice(0, 5).join(' | '), count: pageErrors.length });
  const video = page.video();
  await ctx.close();
  // Name the video after the scenario; mp4 when ffmpeg is available (plays everywhere).
  let videoFile = null;
  try {
    const raw = await video.path();
    const webm = join(OUT, 'videos', `${s.id}.webm`);
    await rename(raw, webm); videoFile = webm;
    if (hasFfmpeg) {
      const mp4 = join(OUT, 'videos', `${s.id}.mp4`);
      const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', webm, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
      if (r.status === 0) videoFile = mp4;
    }
  } catch (e) { console.error('video:', e.message); }
  const r = { scenario: s, wallSec: Math.round((Date.now() - t0) / 1000), video: videoFile ? videoFile.slice(OUT.length + 1).replace(/\\/g, '/') : null, ...(rep || { findings: [{ id: 'no-agent', severity: 'S1', title: 'Agent never started (page failed to load?)', detail: pageErrors.join(' | ') }] }) };
  results.push(r);
  const o = r.outcome;
  console.log(`${o ? `${o.mode.toUpperCase()} (${o.reason})` : waveDoneAt ? 'BOSS WAVE CLEARED' : 'NO RESULT'}  ${r.findings.length} finding(s)  ${r.wallSec}s`);
}
await browser.close(); server.close();

// ---------- reports ----------
const sevRank = { S1: 1, S2: 2, S3: 3, S4: 4 };
const verdict = (r) => r.outcome ? `${r.outcome.mode === 'win' ? 'WIN' : 'LOSE'} (${r.outcome.reason})` : r.timeline?.some((e) => e.type === 'wave-cleared' && e.index === (r.scenario.wave ?? 0) - 1) ? 'BOSS WAVE CLEARED' : 'NO RESULT';
const ms = (n) => (n == null ? '-' : `${(n / 1000).toFixed(1)}s`);
await writeFile(join(OUT, 'report.json'), JSON.stringify({ stamp, seed, base: 'playtest.html', results }, null, 2));

const md = [`# Playtest agents report (${stamp})`, '', `Seed ${seed}. Each run is a goal-oriented agent pressing real keys; the monitor checks invariants every frame. Videos are in \`videos/\`.`, ''];
for (const [title, agent] of [['Levels (playtest-level-agent)', 'playtest-level-agent'], ['Bosses (playtest-boss-agent)', 'playtest-boss-agent']]) {
  const rows = results.filter((r) => r.scenario.agent === agent);
  if (!rows.length) continue;
  md.push(`## ${title}`, '', '| Run | Persona | Level/Wave | Result | Time | HP left | Hits dealt/taken | Parries | Findings | Video |', '|---|---|---|---|---|---|---|---|---|---|');
  for (const r of rows) {
    const s = r.scenario, S = r.stats || {};
    md.push(`| ${s.id}${s.boss ? `<br>${s.boss}` : ''} | ${s.persona} | L${s.level}${s.wave ? ` W${s.wave}` : ''} | ${verdict(r)} | ${ms(r.outcome?.t ?? r.elapsedMs)} | ${r.outcome?.hp ?? '-'} | ${S.hitsDealt ?? '-'}/${S.hitsTaken ?? '-'} | ${S.parries ?? 0}/${S.parryAttempts ?? 0} | ${r.findings.map((f) => f.severity).join(' ') || 'none'} | ${r.video ? `[${s.id}](${r.video})` : '-'} |`);
  }
  md.push('');
}
const bossRuns = results.filter((r) => r.bosses?.length);
if (bossRuns.length) {
  md.push('## Boss move read-out (bespoke boss AI)', '', '| Run | Boss | Time to KO | Move | Seen | Hit Zed | Evaded | Damage to Zed |', '|---|---|---|---|---|---|---|---|');
  for (const r of bossRuns) for (const b of r.bosses) for (const [m, v] of Object.entries(b.moves)) md.push(`| ${r.scenario.id} | ${b.id} | ${b.diedT ? ms(b.diedT - b.seenT) : `alive (${Math.round(b.hpEnd)}/${b.maxHp})`} | ${m} | ${v.seen} | ${v.hitZed} | ${v.evaded} | ${v.damage} |`);
  md.push('');
}
const all = results.flatMap((r) => r.findings.map((f) => ({ ...f, run: r.scenario.id })));
md.push('## Findings', '');
if (!all.length) md.push('None. Every invariant held in every run.');
else {
  md.push('| Sev | Finding | Run | First at | Count | Detail |', '|---|---|---|---|---|---|');
  for (const f of all.sort((a, b) => sevRank[a.severity] - sevRank[b.severity])) md.push(`| ${f.severity} | ${f.title} | ${f.run} | ${ms(f.firstT)} | ${f.count ?? 1} | ${String(f.detail || '').replace(/\|/g, '/')} |`);
}
await writeFile(join(OUT, 'REPORT.md'), md.join('\n') + '\n');

// ---------- blackboard facts (G7 / G8) ----------
if (!flag('no-blackboard')) {
  for (const [agent, file] of [['playtest-level-agent', 'playtest-levels.json'], ['playtest-boss-agent', 'playtest-bosses.json']]) {
    const rows = results.filter((r) => r.scenario.agent === agent);
    if (!rows.length) continue;
    const fact = {
      agent, run: stamp, reportDir: OUT.slice(ROOT.length + 1).replace(/\\/g, '/'),
      runs: rows.map((r) => ({ id: r.scenario.id, persona: r.scenario.persona, level: r.scenario.level, wave: r.scenario.wave ?? null, result: verdict(r), video: r.video, findings: r.findings.map((f) => `${f.severity} ${f.id}`) })),
      findings: rows.flatMap((r) => r.findings.map((f) => ({ ...f, evidence: `${r.scenario.id} @ ${ms(f.firstT)} (video ${r.video})`, status: f.severity === 'S1' || f.severity === 'S2' ? 'open' : 'suspected' }))),
      requests: rows.flatMap((r) => r.findings.filter((f) => f.severity === 'S1').map((f) => `Fix ${f.id} seen in ${r.scenario.id}`)),
    };
    await mkdir(join(ROOT, 'blackboard/facts'), { recursive: true });
    await writeFile(join(ROOT, 'blackboard/facts', file), JSON.stringify(fact, null, 2) + '\n');
  }
}
console.log(`\nReport: ${join(OUT, 'REPORT.md')}`);
