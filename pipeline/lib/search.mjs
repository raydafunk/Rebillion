// Tiny BM25 retriever over corpus chunks. Corpus is small, so the index is rebuilt per query.
const STOP = new Set('a an and are as at be but by for from has have he her his i if in into is it its of on or our she so that the their them they this to was we were will with you your'.split(' '));

export function tokenize(s) {
  return (s.toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g) || [])
    .map((w) => w.replace(/'s$/, '').replace(/(?<=[a-z]{3})s$/, ''))
    .filter((w) => w.length > 1 && !STOP.has(w));
}

export function buildIndex(chunks) {
  const docs = chunks.map((c) => {
    const toks = tokenize(`${c.heading || ''} ${c.heading || ''} ${c.text}`);
    const tf = new Map();
    for (const t of toks) tf.set(t, (tf.get(t) || 0) + 1);
    return { id: c.id, len: toks.length, tf };
  });
  const df = new Map();
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) || 0) + 1);
  const avg = docs.reduce((a, d) => a + d.len, 0) / (docs.length || 1);
  return { docs, df, avg, n: docs.length, byId: new Map(chunks.map((c) => [c.id, c])) };
}

// The owner's own document outranks derived specs, which outrank reference copies.
const AUTH_BOOST = { primary: 1.25, derived: 1.0, reference: 0.9 };

export function search(index, query, k = 6) {
  const q = tokenize(query);
  const k1 = 1.4, b = 0.75;
  const scored = index.docs.map((d) => {
    let s = 0;
    for (const t of q) {
      const f = d.tf.get(t);
      if (!f) continue;
      const dfT = index.df.get(t);
      const idf = Math.log(1 + (index.n - dfT + 0.5) / (dfT + 0.5));
      s += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * d.len / index.avg));
    }
    return { id: d.id, score: s * (AUTH_BOOST[index.byId.get(d.id).authority] ?? 1) };
  }).filter((x) => x.score > 0).sort((a, b2) => b2.score - a.score);
  return scored.slice(0, k);
}
