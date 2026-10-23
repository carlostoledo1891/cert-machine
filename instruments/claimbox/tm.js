#!/usr/bin/env node
/* instruments/claimbox/tm.js — the SECOND IMPLEMENTATION of tm.py, the receiver's decider for claims about small Turing
   machines, in JavaScript, sharing no code with it. It reads the same claimbox objects, decides the same named functions,
   and prints its rows; the battery holds the two to each other on every object (make test). Standard library only.

     node instruments/claimbox/tm.js --decide --record <out.json> <object.json>...                                 MIT */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..', '..');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
class Refuse extends Error {}

function parseTable(text) {
  const rows = [];
  for (const raw of text.split('\n')) {
    const line = raw.split('#')[0].trim();
    if (!line) continue;
    const cells = line.split(/\s+/);
    if (cells.length !== 2) throw new Refuse('malformed table: a row with ' + cells.length + ' cells');
    rows.push(cells.map((c) => { if (c === '---') return null; const m = /^([01])([LR])(\d+)$/.exec(c); if (!m) throw new Refuse('malformed table: cell ' + c); return [Number(m[1]), m[2] === 'L' ? -1 : 1, Number(m[3])]; }));
  }
  for (let q = 0; q < rows.length; q++) for (const c of rows[q]) if (c && !(c[2] >= 0 && c[2] < rows.length)) throw new Refuse('malformed table: state ' + q + ' targets ' + c[2]);
  const canon = rows.map((r) => r.map((c) => c === null ? '---' : c[0] + (c[1] < 0 ? 'L' : 'R') + c[2]).join(' ')).join('\n') + '\n';
  return { rows, canon };
}
function compileSource(text, fmt) {
  if (fmt === 'standard') return { canon: text.trim().split('_').map((blk) => [blk.slice(0, 3), blk.slice(3, 6)].map((c) => (c === '---' || c[2] === 'Z' || c[2] === '-') ? '---' : c[0] + c[1] + (c.charCodeAt(2) - 65)).join(' ')).join('\n') + '\n', undefined: [] };
  const order = [], table = new Map(); let start = null;
  if (fmt === 'tursi') {
    for (const line of text.split('\n')) {
      const h = /^#!\s*start\s+(\S+)\s*$/.exec(line); if (h) { start = h[1]; continue; }
      if (!line.trim() || line.startsWith('#')) continue;
      const [st, rs, ws, mv, nxt] = line.trim().split(/\s+/);
      if (!order.includes(st)) order.push(st);
      table.set(st + '\u0000' + rs, [Number(ws), mv.toUpperCase().startsWith('L') ? 'L' : 'R', nxt]);
    }
  } else if (fmt === 'nql') {
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      const i = line.indexOf(' = '); const name = line.slice(0, i); const f = line.slice(i + 3).trim().split(/\s+/);
      order.push(name);
      for (const s of [0, 1]) table.set(name + '\u0000' + s, [Number(f[3 * s]), f[3 * s + 1].toUpperCase().startsWith('L') ? 'L' : 'R', f[3 * s + 2]]);
    }
    start = '!ENTRY';
  } else throw new Refuse('unknown format ' + fmt);
  const numbering = new Map(); if (start) numbering.set(start, 0);
  for (const nm of order) if (!numbering.has(nm)) numbering.set(nm, numbering.size);
  const names = [...numbering.keys()].sort((a, b) => numbering.get(a) - numbering.get(b));
  const defined = new Set(order);
  const undefinedT = [...new Set([...table.values()].map((v) => v[2]).filter((n) => !defined.has(n)))].sort();
  const canon = names.map((nm) => [0, 1].map((s) => { const e = table.get(nm + '\u0000' + s); if (!e) return '---'; const [w, d, nxt] = e; return defined.has(nxt) ? w + d + numbering.get(nxt) : '---'; }).join(' ')).join('\n') + '\n';
  return { canon, undefined: undefinedT };
}
function simulate(rows, steps, probe) {
  const ones = new Set(); let head = 0, q = 0;
  for (let t = 1; t <= steps; t++) {
    const c = rows[q][ones.has(head) ? 1 : 0];
    if (c === null) return { halted_at: t, state: q, head, ones };
    if (c[0]) ones.add(head); else ones.delete(head);
    head += c[1]; q = c[2];
    if (probe) probe(t, q, head, ones);
  }
  return { halted_at: null, state: q, head, ones };
}
function pinned(ref) {
  const m = /^(\S+)@([0-9a-f]{64})$/.exec(ref); if (!m) throw new Refuse('a pinned reference is PATH@SHA: ' + ref);
  const p = path.join(ROOT, m[1]); if (!fs.existsSync(p)) throw new Refuse('pinned file missing: ' + m[1]);
  const b = fs.readFileSync(p); if (sha(b) !== m[2]) throw new Refuse('pinned file moved: ' + m[1]);
  return b;
}
function leanLiteralTable(text, name) {
  const i0 = text.indexOf('def ' + name + ' : Machine'); const j = text.indexOf('[', text.indexOf('Machine.ofRows', i0));
  let depth = 0, k = j; for (; ; k++) { if (text[k] === '[') depth++; else if (text[k] === ']') { depth--; if (depth === 0) break; } }
  const rows = [];
  for (const m of text.slice(j + 1, k).matchAll(/\[([^\[\]]*)\]/g)) { const cells = [...m[1].matchAll(/some \((\d), \.(left|right), (\d+)\)|none/g)].map((c) => c[0] === 'none' ? null : [Number(c[1]), c[2] === 'left' ? -1 : 1, Number(c[3])]); if (cells.length) rows.push(cells); }
  return rows;
}
function parseMap(clauses) {
  const out = new Map();
  for (let cl of clauses.split(',')) {
    cl = cl.trim();
    let m = /^(\d+)\.\.(\d+)→q(?:\+(\d+))?$/.exec(cl);
    if (m) { for (let q = Number(m[1]); q <= Number(m[2]); q++) out.set(q, q + Number(m[3] || 0)); continue; }
    m = /^(\d+)→(\d+)$/.exec(cl); if (!m) throw new Refuse('unreadable map clause ' + cl);
    out.set(Number(m[1]), Number(m[2]));
  }
  return out;
}
const sortedOnes = (o) => [...o].sort((a, b) => a - b);
const relKey = (o, h) => sortedOnes(o).map((k) => k - h).join(',');

function decideNamed(name, bytes, text) {
  let rows = null, canon = null; try { ({ rows, canon } = parseTable(text)); } catch (e) { if (!(e instanceof Refuse)) throw e; }
  let m;
  if ((m = /^sha256\(M\) = ([0-9a-f]{64})$/.exec(name))) { const got = sha(bytes); return [got === m[1], got, null]; }
  if ((m = /^canonical_sha256\(M\) = ([0-9a-f]{64})$/.exec(name))) { if (!rows) throw new Refuse('M is not a table'); const got = sha(canon); return [got === m[1], got, null]; }
  if ((m = /^states\(M\) (=|<) (\d+)$/.exec(name))) { if (!rows) throw new Refuse('M is not a table'); const n = rows.length; return [m[1] === '=' ? n === Number(m[2]) : n < Number(m[2]), n, null]; }
  if ((m = /^nonhalting_cells\(M\) = (\d+)$/.exec(name))) { const n = rows.reduce((s, r) => s + r.filter((c) => c !== null).length, 0); return [n === Number(m[1]), n, null]; }
  if ((m = /^halting_cells\(M\) = (\[.*\])$/.exec(name))) { const got = []; rows.forEach((r, q) => r.forEach((c, s) => { if (c === null) got.push([q, s]); })); return [JSON.stringify(got) === JSON.stringify(JSON.parse(m[1])), got, null]; }
  if ((m = /^derived\((standard|tursi|nql)\) canonical_sha256\(M\) = ([0-9a-f]{64})$/.exec(name))) { const got = sha(compileSource(text, m[1]).canon); return [got === m[2], got, null]; }
  if ((m = /^derived\((standard|tursi|nql)\) undefined_targets\(M\) ⊆ (\[.*\])$/.exec(name))) { const und = compileSource(text, m[1]).undefined; const allowed = JSON.parse(m[2]); const bad = und.filter((u) => !allowed.includes(u)); return [bad.length === 0, und, bad.length ? bad : null]; }
  if ((m = /^after\(M, (\d+)\) = state (\d+)(?:, head (-?\d+))?(?:, nonzero (\d+))?$/.exec(name))) {
    const fin = simulate(rows, Number(m[1])); if (fin.halted_at !== null) return [false, { halted_at: fin.halted_at }, 'halted'];
    const got = [fin.state].concat(m[3] ? [fin.head] : []).concat(m[4] ? [fin.ones.size] : []); const want = [Number(m[2])].concat(m[3] ? [Number(m[3])] : []).concat(m[4] ? [Number(m[4])] : []);
    return [JSON.stringify(got) === JSON.stringify(want), got, null];
  }
  if ((m = /^after\(M, (\d+)\) ones = (\[.*\])$/.exec(name))) { const got = sortedOnes(simulate(rows, Number(m[1])).ones); return [JSON.stringify(got) === JSON.stringify(JSON.parse(m[2])), got, null]; }
  if ((m = /^no_halt\(M, (\d+)\)$/.exec(name))) { const fin = simulate(rows, Number(m[1])); return [fin.halted_at === null, fin.halted_at, null]; }
  if ((m = /^entries\(M, state (\d+), after (\d+), within (\d+)\) >= (\d+)$/.exec(name))) { const [Q, T, T2, N] = m.slice(1).map(Number); let n = 0; simulate(rows, T2, (t, q) => { if (t >= T && q === Q) n++; }); return [n >= N, n, null]; }
  if ((m = /^entries\(M, state (\d+), after (\d+), within (\d+)\) at steps (\[.*\])$/.exec(name))) {
    const [Q, T, T2] = m.slice(1, 4).map(Number); const want = JSON.parse(m[4]); const ent = new Map(); simulate(rows, T2, (t, q) => { if (t >= T && q === Q) ent.set(t, ent.size); });
    const got = {}; for (const s of want) got[String(s)] = ent.has(s) ? ent.get(s) : null; const miss = want.filter((s) => !ent.has(s)); return [miss.length === 0, got, miss.length ? miss : null];
  }
  if ((m = /^same_tape_and_head\(M, (\d+); (\S+@[0-9a-f]{64}), (\d+)\)$/.exec(name))) {
    const rows2 = parseTable(pinned(m[2]).toString('utf8')).rows; const a = simulate(rows, Number(m[1])), b = simulate(rows2, Number(m[3]));
    const ok = a.halted_at === null && b.halted_at === null && a.head === b.head && sortedOnes(a.ones).join(',') === sortedOnes(b.ones).join(',');
    return [ok, { M: [a.head, a.ones.size], other: [b.head, b.ones.size] }, null];
  }
  if ((m = /^same_tape_and_head_at_entries\(M; (\S+@[0-9a-f]{64}); state (\d+), after (\d+), within (\d+)\) >= (\d+)$/.exec(name))) {
    const rows2 = parseTable(pinned(m[1]).toString('utf8')).rows; const [Q, T, T2, N] = m.slice(2).map(Number);
    const entries = (rr) => { const out = []; simulate(rr, T2, (t, q, h, o) => { if (t > T && q === Q) out.push(relKey(o, h)); }); return out; };
    const e1 = entries(rows), e2 = entries(rows2); const common = Math.min(e1.length, e2.length); let eq = 0; for (let i = 0; i < common; i++) if (e1[i] === e2[i]) eq++;
    return [common >= N && eq === common, { common, equal: eq }, null];
  }
  if ((m = /^stage_entry\(M, (candidate|reference), n = (\d+)\) = (\d+)$/.exec(name))) {
    const cand = m[1] === 'candidate', K = Number(m[2]), want = Number(m[3]); const ones = new Set(); let head = 0, q = 0, found = null; const chk = cand ? 1 : 0;
    const count = (p, d) => { let c = 0; while (ones.has(p)) { c++; p += d; } return c; };
    for (let t = 1; t <= want + 200000; t++) {
      const c = rows[q][ones.has(head) ? 1 : 0]; if (c === null) break; if (c[0]) ones.add(head); else ones.delete(head); head += c[1]; q = c[2];
      if (q === chk && ones.has(head) && !ones.has(head - 1)) { const cp = count(head, 1), cl = count(head - 2, -1), cr = count(head + cp + 1, 1); let n = null; if (!cand && cp === 1 && cl >= 3 && cr === 0) n = cl + 1; else if (cand && cl === 0 && cr === 3 && cp >= 3) n = cp + 1; if (n === K) { found = t; break; } }
    }
    return [found === want, found, null];
  }
  if ((m = /^embeds_into\(M; lean (\S+@[0-9a-f]{64}) def (\w+); map (.+)\)$/.exec(name))) {
    const edited = leanLiteralTable(pinned(m[1]).toString('utf8'), m[2]); const emb = parseMap(m[3]); const bad = [];
    for (let q = 0; q < rows.length; q++) { if (!emb.has(q) || !(emb.get(q) >= 0 && emb.get(q) < edited.length)) { bad.push([q, 'no image']); continue; }
      for (const s of [0, 1]) { const c = rows[q][s], e = edited[emb.get(q)][s]; if (c === null) { if (e !== null) bad.push([q, s]); } else if (e === null || c[0] !== e[0] || c[1] !== e[1] || emb.get(c[2]) !== e[2]) bad.push([q, s]); } }
    return [bad.length === 0, (2 * rows.length - bad.length) + ' of ' + (2 * rows.length), bad.length ? bad : null];
  }
  throw new Refuse('no such function: ' + name);
}
function decideObject(o) {
  const d = o.domain; if (d.kind !== 'finite') throw new Refuse('tm.js decides finite domains (a pinned machine)');
  const p = path.join(ROOT, d.pin.path); if (!fs.existsSync(p)) throw new Refuse('pinned file missing: ' + d.pin.path);
  const b = fs.readFileSync(p); if (sha(b) !== d.pin.sha256) throw new Refuse('pinned file moved: ' + d.pin.path);
  const text = b.toString('utf8'); const words = [], computed = [], witnesses = [];
  o.predicate.forEach((pr, i) => { const g = pr.g; if (pr.rel !== 'holds' || !g || typeof g !== 'object' || g.where !== 'instruments/claimbox/tm.py') throw new Refuse('predicate[' + i + '] is not a holds over a tm.py function');
    const [ok, comp, wit] = decideNamed(g.named, b, text); words.push(ok ? 'CERTIFIED' : 'REFUTED'); computed.push(comp); if (wit) witnesses.push(wit); });
  return { id: o.id, claim: o.text, sha256: d.pin.sha256, path: d.pin.path, named: o.predicate.map((pr) => pr.g.named), computed, words, witness: witnesses.length ? witnesses : null, verdict: words.includes('REFUTED') ? 'REFUTED' : 'CERTIFIED' };
}
const A = process.argv.slice(2);
if (!A.includes('--decide') || !A.includes('--record')) { console.log('usage: tm.js --decide --record <out.json> <object.json>...'); process.exit(2); }
const out = A[A.indexOf('--record') + 1]; const paths = A.filter((a) => a.endsWith('.json') && a !== out);
const rows = []; const t0 = Date.now();
for (const p of paths) {
  const o = JSON.parse(fs.readFileSync(p, 'utf8')); if (!(o.predicate || []).some((pr) => pr.g && typeof pr.g === 'object' && pr.g.where === 'instruments/claimbox/tm.py')) continue; const t1 = Date.now(); let r;
  try { r = decideObject(o); } catch (e) { if (!(e instanceof Refuse)) throw e; r = { id: o.id, claim: o.text, verdict: 'REFUSED', rule: e.message }; }
  r.ms = Date.now() - t1; rows.push(r); console.log('  ' + r.verdict.padEnd(9) + ' ' + r.id + (r.verdict === 'REFUSED' ? '  ' + r.rule : ''));
}
const summary = {}; for (const r of rows) summary[r.verdict] = (summary[r.verdict] || 0) + 1;
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ what: 'the receiver\'s decisions of claimbox objects about small Turing machines, by instruments/claimbox/tm.js (the second implementation of tm.py)', decider: 'instruments/claimbox/tm.js', generated: new Date().toISOString().slice(0, 19) + 'Z', seconds: (Date.now() - t0) / 1000, summary, rows }, null, 1) + '\n');
console.log('tm.js: ' + rows.length + ' objects ' + JSON.stringify(summary) + ' → ' + path.relative(ROOT, out));
