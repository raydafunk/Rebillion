// Document readers. Zero dependencies: .docx is parsed with node:zlib, .pdf via the `pdftotext` CLI if installed.
// Every reader returns { blocks: [{ heading: string|null, text: string }], warnings: string[] }.
import fs from 'node:fs';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';

// ---------- minimal zip reader (stored + deflate) ----------
function zipDirectory(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a zip file');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const entries = [];
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    entries.push({
      name: buf.toString('utf8', p + 46, p + 46 + nameLen),
      method: buf.readUInt16LE(p + 10),
      csize: buf.readUInt32LE(p + 20),
      localOff: buf.readUInt32LE(p + 42),
    });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function zipRead(buf, entry) {
  const lNameLen = buf.readUInt16LE(entry.localOff + 26);
  const lExtraLen = buf.readUInt16LE(entry.localOff + 28);
  const start = entry.localOff + 30 + lNameLen + lExtraLen;
  const data = buf.subarray(start, start + entry.csize);
  return entry.method === 0 ? data : zlib.inflateRawSync(data);
}

const unescapeXml = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&amp;/g, '&');

function paraText(p) {
  let out = '';
  const re = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<w:br\/>/g;
  let m;
  while ((m = re.exec(p))) out += m[1] !== undefined ? m[1] : ' ';
  return unescapeXml(out).replace(/\s+/g, ' ').trim();
}

export function readDocx(file) {
  const warnings = [];
  const buf = fs.readFileSync(file);
  const entries = zipDirectory(buf);
  const main = entries.find((e) => e.name === 'word/document.xml');
  if (!main) throw new Error('word/document.xml missing');
  const doc = zipRead(buf, main).toString('utf8');
  const blocks = [];
  let heading = null;
  const recent = [];
  const push = (text) => {
    if (!text) return;
    // Flowchart text boxes are stored twice (AlternateContent); drop near-immediate repeats.
    if (recent.includes(text)) return;
    recent.push(text);
    if (recent.length > 6) recent.shift();
    blocks.push({ heading, text });
  };
  const re = /<w:tbl>[\s\S]*?<\/w:tbl>|<w:p[ >][\s\S]*?<\/w:p>/g;
  let m;
  while ((m = re.exec(doc))) {
    const chunk = m[0];
    if (chunk.startsWith('<w:tbl>')) {
      const rows = chunk.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g) || [];
      const lines = rows.map((r) => (r.match(/<w:tc>[\s\S]*?<\/w:tc>/g) || [])
        .map((c) => (c.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || []).map(paraText).filter(Boolean).join(' / '))
        .join(' | '));
      const text = lines.filter((l) => l.replace(/[|\s]/g, '')).join('\n');
      if (text) blocks.push({ heading, text: `[table]\n${text}` });
    } else {
      const style = (chunk.match(/<w:pStyle w:val="([^"]+)"/) || [])[1] || '';
      const text = paraText(chunk);
      if (/^(Title|Heading\d?)$/i.test(style) && text) { heading = text; continue; }
      push(text);
    }
  }
  if (entries.some((e) => e.name.startsWith('word/media/'))) warnings.push('contains embedded images (pixels not read)');
  return { blocks, warnings };
}

export function readPdf(file) {
  const r = spawnSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.error || r.status !== 0) {
    throw new Error('pdftotext unavailable or failed (install poppler to ingest PDFs)');
  }
  const blocks = r.stdout.split(/\n\s*\n/).map((t) => t.replace(/\s+/g, ' ').trim()).filter(Boolean)
    .map((text) => ({ heading: null, text }));
  return { blocks, warnings: blocks.length ? [] : ['no text layer (scanned PDF?)'] };
}

export function readText(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  const blocks = [];
  let heading = null;
  for (const para of raw.split(/\r?\n\s*\r?\n/)) {
    const t = para.trim();
    if (!t) continue;
    const lone = t.match(/^#{1,4}\s+(.+)$/);
    if (lone) { heading = lone[1].trim(); continue; }
    const hb = t.match(/^#{1,4}\s+(.+)\r?\n([\s\S]+)$/);
    if (hb) { heading = hb[1].trim(); blocks.push({ heading, text: hb[2].trim() }); continue; }
    blocks.push({ heading, text: t.replace(/[ \t]+/g, ' ') });
  }
  return { blocks, warnings: [] };
}

export const READERS = { '.docx': readDocx, '.pdf': readPdf, '.md': readText, '.txt': readText };
