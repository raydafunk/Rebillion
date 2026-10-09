// Pack reader blocks into retrieval chunks (<= maxChars), never mixing headings.
export function chunkBlocks(blocks, { maxChars = 1100 } = {}) {
  const chunks = [];
  let cur = null;
  const flush = () => { if (cur && cur.text.trim()) chunks.push(cur); cur = null; };
  for (const b of blocks) {
    if (!cur || cur.heading !== b.heading || cur.text.length + b.text.length + 1 > maxChars) {
      flush();
      cur = { heading: b.heading, text: '' };
    }
    cur.text += (cur.text ? '\n' : '') + b.text;
  }
  flush();
  return chunks;
}
