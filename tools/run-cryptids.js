#!/usr/bin/env node
/* run-cryptids.js — the SECOND IMPLEMENTATION of arm H's decision-bearing computations (tools/run-cryptids.py), in
   JavaScript, sharing no code with it: the table parser and the canonical digest, the three upstream-format derivations,
   the simulator and every checkpoint, the Goldbach stage detection. It reads certs/cryptids-audit.json, recomputes
   each row it knows how to, and refuses on the first disagreement. The battery runs it (make test); the quick rows only
   unless --full (the ten-million-step ZF replay and the 89,775,610-step riemann_120 run).

     node tools/run-cryptids.js [--record certs/cryptids-audit.json] [--corpus corpus/cryptids] [--full]      MIT */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const A = process.argv.slice(2);
const REC = A.includes('--record') ? A[A.indexOf('--record') + 1] : path.join(ROOT, 'certs', 'cryptids-audit.json');
const CORPUS = A.includes('--corpus') ? A[A.indexOf('--corpus') + 1] : path.join(ROOT, 'corpus', 'cryptids');
const FULL = A.includes('--full');
const T = (rel) => fs.readFileSync(path.join(CORPUS, rel), 'utf8');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
let checked = 0, bad = 0;
const same = (id, mine, note) => {
  const r = rec.rows.find((x) => x.id === id);
  if (!r) { console.log('  (no row ' + id + ' in the record)'); return; }
  checked++;
  const theirs = JSON.stringify(r.computed), ours = JSON.stringify(mine);
  if (theirs !== ours) { bad++; console.log('  DISAGREE ' + id + '\n    record: ' + theirs.slice(0, 200) + '\n    js:     ' + ours.slice(0, 200)); }
  else if (note) console.log('  agree    ' + id + (note ? ' — ' + note : ''));
};
const rec = JSON.parse(fs.readFileSync(REC, 'utf8'));

/* ---- the table ---- */
function parseTable(text) {
  const rows = [];
  for (const raw of text.split('\n')) {
    const line = raw.split('#')[0].trim();
    if (!line) continue;
    const cells = line.split(/\s+/);
    if (cells.length !== 2) throw new Error('a row with ' + cells.length + ' cells');
    rows.push(cells.map((c) => { if (c === '---') return null; const m = /^([01])([LR])(\d+)$/.exec(c); if (!m) throw new Error('cell ' + c); return [Number(m[1]), m[2] === 'L' ? -1 : 1, Number(m[3])]; }));
  }
  const canon = rows.map((r) => r.map((c) => c === null ? '---' : c[0] + (c[1] < 0 ? 'L' : 'R') + c[2]).join(' ')).join('\n') + '\n';
  return { rows, canon };
}
/* ---- the three formats ---- */
function derive(src, fmt) {
  if (fmt === 'standard') {
    return src.trim().split('_').map((blk) => [blk.slice(0, 3), blk.slice(3, 6)].map((c) => (c === '---' || c[2] === 'Z' || c[2] === '-') ? '---' : c[0] + c[1] + (c.charCodeAt(2) - 65)).join(' ')).join('\n') + '\n';
  }
  const order = [], table = new Map(); let start = null;
  if (fmt === 'tursi') {
    for (const line of src.split('\n')) {
      const h = /^#!\s*start\s+(\S+)\s*$/.exec(line); if (h) { start = h[1]; continue; }
      if (!line.trim() || line.startsWith('#')) continue;
      const [st, rs, ws, mv, nxt] = line.trim().split(/\s+/);
      if (!order.includes(st)) order.push(st);
      table.set(st + '\u0000' + rs, [Number(ws), mv.toUpperCase().startsWith('L') ? 'L' : 'R', nxt]);
    }
  } else if (fmt === 'nql') {
    for (const line of src.split('\n')) {
      if (!line.trim()) continue;
      const i = line.indexOf(' = '); const name = line.slice(0, i); const f = line.slice(i + 3).trim().split(/\s+/);
      order.push(name);
      for (const s of [0, 1]) table.set(name + '\u0000' + s, [Number(f[3 * s]), f[3 * s + 1].toUpperCase().startsWith('L') ? 'L' : 'R', f[3 * s + 2]]);
    }
    start = '!ENTRY';
  } else throw new Error(fmt);
  const numbering = new Map(); if (start) numbering.set(start, 0);
  for (const nm of order) if (!numbering.has(nm)) numbering.set(nm, numbering.size);
  const names = [...numbering.keys()].sort((a, b) => numbering.get(a) - numbering.get(b));
  const defined = new Set(order);
  return names.map((nm) => [0, 1].map((s) => { const e = table.get(nm + '\u0000' + s); if (!e) return '---'; const [w, d, nxt] = e; return defined.has(nxt) ? w + d + numbering.get(nxt) : '---'; }).join(' ')).join('\n') + '\n';
}
/* ---- the simulator ---- */
function run(rows, steps, on) {
  const ones = new Set(); let head = 0, q = 0;
  for (let t = 1; t <= steps; t++) {
    const c = rows[q][ones.has(head) ? 1 : 0];
    if (c === null) return { halted_at: t, state: q, head, ones };
    if (c[0]) ones.add(head); else ones.delete(head);
    head += c[1]; q = c[2];
    if (on) on(t, q, head, ones);
  }
  return { halted_at: null, state: q, head, ones };
}
const relKey = (ones, head) => [...ones].map((k) => k - head).sort((a, b) => a - b).join(',');

/* ---- the machines ---- */
const PINS = {};
for (const line of T('baselines/PROVENANCE.md').split('\n')) {
  const m = /^\| `([a-z_0-9]+)` \(`(\d+)` states\) \| `sources\/([^`]+)` \| `(\w+)` [^|]*\| `([0-9a-f]{64})` \| `tables\/([^`]+)` \| `([0-9a-f]{64})` \| `([0-9a-f]{64})` \|/.exec(line);
  if (m) PINS[m[1]] = { states: Number(m[2]), source: 'baselines/sources/' + m[3], format: m[4], sourceSha: m[5], table: 'baselines/tables/' + m[6], tableSha: m[7], machineSha: m[8] };
}
const M = {};
for (const [name, p] of Object.entries(PINS)) {
  const { rows, canon } = parseTable(T(p.table)); M[name] = { rows, canon, path: p.table };
  same('prov-machine-sha-' + name, sha(canon));
  same('prov-states-' + name, rows.length);
  same('derive-' + name, derive(T(p.source), p.format) === canon ? 'equal' : 'different');
}
for (const cid of ['goldbach_21', 'zf_380', 'riemann_104', 'riemann_95']) {
  const { rows, canon } = parseTable(T('artifacts/' + cid + '/machine.txt')); M[cid] = { rows, canon, path: 'artifacts/' + cid + '/machine.txt' };
  same('cand-states-' + cid, rows.length);
  same('verifypy-cand-sha-' + cid, T('verify.py').includes(sha(canon)) ? 'present' : 'absent');
}
const nh = (n) => M[n].rows.reduce((s, r) => s + r.filter((c) => c !== null).length, 0);
same('cells-goldbach-25', nh('goldbach')); same('cells-goldbach-21', nh('goldbach_21'));
same('cells-zf', [nh('zf_393'), nh('zf_380')]); same('cells-riemann', [nh('riemann_120'), nh('riemann_104')]);
/* the Goldbach embedding */
const embed = (q) => q === 0 ? 2 : q === 1 ? 0 : q === 2 ? 23 : q < 8 ? q : q === 8 ? 9 : q < 15 ? q + 2 : q === 15 ? 24 : q + 2;
{
  const g = T('Cryptids/Goldbach21.lean'); const i0 = g.indexOf('def edited : Machine 25 2 := Machine.ofRows [');
  let j = g.indexOf('[', i0 + 'def edited : Machine 25 2 := Machine.ofRows'.length), depth = 0, k = j;
  for (; ; k++) { if (g[k] === '[') depth++; else if (g[k] === ']') { depth--; if (depth === 0) break; } }
  const body = g.slice(j + 1, k); const edited = [];
  for (const m of body.matchAll(/\[([^\[\]]*)\]/g)) { const cells = [...m[1].matchAll(/some \((\d), \.(left|right), (\d+)\)|none/g)].map((c) => c[0] === 'none' ? null : [Number(c[1]), c[2] === 'left' ? -1 : 1, Number(c[3])]); if (cells.length) edited.push(cells); }
  same('goldbach-edited-rows', edited.length);
  let ok = 0; const cand = M['goldbach_21'].rows;
  for (let q = 0; q < 21; q++) for (const s of [0, 1]) { const c = cand[q][s], e = edited[embed(q)][s]; if (c === null ? e === null : (e !== null && c[0] === e[0] && c[1] === e[1] && embed(c[2]) === e[2])) ok++; }
  same('goldbach-embed', ok + ' of 42');
}
/* ZF */
{
  const zf = (name) => { const rec = { boot: null, post: [] }; const fin = run(M[name].rows, 250000, (t, q, h, o) => { if (t === 39753) rec.boot = [q, h, relKey(o, h), [...o].sort((a, b) => a - b).join(',')]; else if (t > 39753 && q === 64) rec.post.push([t, relKey(o, h)]); }); rec.fin = fin; return rec; };
  const r = zf('zf_393'), c = zf('zf_380');
  same('zf-393-boot-state', r.boot[0]); same('zf-380-boot-state', c.boot[0]);
  same('zf-boot-tapes-equal', (r.boot[1] === c.boot[1] && r.boot[3] === c.boot[3]) ? 'equal' : 'different');
  const common = Math.min(r.post.length, c.post.length); let eq = 0, sameT = 0, first = null;
  for (let i = 0; i < common; i++) { if (r.post[i][1] === c.post[i][1]) eq++; if (r.post[i][0] === c.post[i][0]) sameT++; else if (first === null) first = i; }
  same('zf-post-boot-checkpoints', { common, equal: eq });
  same('zf-overhead-starts-after-boot', { checkpoints_at_the_same_step: sameT, first_differing_checkpoint: first, delta_steps_there: first === null ? null : c.post[first][0] - r.post[first][0] });
  same('zf-no-halt-250k', [r.fin.halted_at, c.fin.halted_at]);
  let q99 = null; run(M['zf_393'].rows, 39773, (t, q) => { if (t === 39773) q99 = q; }); same('zf-393-39773-state-99', q99);
  if (FULL) {
    const big = {};
    run(M['zf_393'].rows, 10000000, (t, q, h, o) => { if (t === 1000000 || t === 10000000) big['r' + t] = h + '|' + [...o].sort((a, b) => a - b).join(','); });
    run(M['zf_380'].rows, 10015814, (t, q, h, o) => { if (t === 1000930 || t === 10015814) big['c' + t] = h + '|' + [...o].sort((a, b) => a - b).join(','); });
    same('zf-overhead-1m', big.r1000000 === big.c1000930 ? 'same' : 'different', 'ten-million-step replay');
    same('zf-overhead-10m', big.r10000000 === big.c10015814 ? 'same' : 'different');
  }
}
/* riemann_104 */
{
  let boot = null; const roots = []; const fin = run(M['riemann_104'].rows, 500000, (t, q, h, o) => { if (t === 9037) boot = [q, h, o.size]; if (t >= 9037 && q === 19) roots.push([t, h, o.size]); });
  same('riemann-104-boot', boot);
  same('riemann-104-root-dispatches', roots.filter((x) => x[0] <= 250000).length);
  same('riemann-104-no-halt-250k', fin.halted_at === null || fin.halted_at > 250000 ? null : fin.halted_at);
  const at = {}; roots.forEach((x, i) => { at[x[0]] = { ordinal_among_root_entries: i, head: x[1], nonzero: x[2] }; });
  same('riemann-104-table-steps-are-root-entries', Object.fromEntries([26093, 28934, 165200, 498382].map((s) => [s, at[s] || null])));
}
/* riemann_95 */
{
  const rows = M['riemann_95'].rows; const ones = new Set(); let head = 0, q = 0, sel = 0;
  for (let t = 0; t < 3634; t++) { const s = ones.has(head) ? 1 : 0; if (q === 41 && s === 1) sel++; const c = rows[q][s]; if (c[0]) ones.add(head); else ones.delete(head); head += c[1]; q = c[2]; }
  same('riemann-95-init', [q, head]); same('riemann-95-init-tape', [...ones].sort((a, b) => a - b)); same('riemann-95-selector-unvisited', sel);
  same('cells-riemann-95', { defined: nh('riemann_95'), halting: rows.flatMap((r, i) => r.map((c, s) => c === null ? [i, s] : null)).filter(Boolean) });
}
/* Goldbach stages */
{
  const stages = (name, cand) => { const rows = M[name].rows; const out = []; const ones = new Set(); let head = 0, q = 0; const chk = cand ? 1 : 0;
    const count = (p, d) => { let c = 0; while (ones.has(p)) { c++; p += d; } return c; };
    for (let t = 1; t <= 400000; t++) { const c = rows[q][ones.has(head) ? 1 : 0]; if (c === null) return { out, halt: t }; if (c[0]) ones.add(head); else ones.delete(head); head += c[1]; q = c[2];
      if (q === chk && ones.has(head) && !ones.has(head - 1)) { const cp = count(head, 1), cl = count(head - 2, -1), cr = count(head + cp + 1, 1); if (!cand && cp === 1 && cl >= 3 && cr === 0) out.push([t, cl + 1]); else if (cand && cl === 0 && cr === 3 && cp >= 3) out.push([t, cp + 1]); } }
    return { out, halt: null }; };
  const r = stages('goldbach', false), c = stages('goldbach_21', true);
  same('goldbach-no-halt-400k', [r.halt, c.halt]);
  same('goldbach-lockstep', { ref: r.out.slice(0, 16).map((x) => x[1]), cand: c.out.slice(0, 16).map((x) => x[1]) });
  const sr = Object.fromEntries(r.out.map(([t, n]) => [n, t])), sc = Object.fromEntries(c.out.map(([t, n]) => [n, t]));
  same('goldbach-boot-steps', [sr[4] ?? null, sc[4] ?? null]); same('goldbach-steps-through-40', [sr[42] ?? null, sc[42] ?? null]);
}
if (FULL) { const t0 = Date.now(); const f = run(M['riemann_120'].rows, 89775610); same('riemann-120-no-halt-boot-length', f.halted_at, 'in ' + Math.round((Date.now() - t0) / 1000) + ' s'); }
for (const name of ['goldbach', 'goldbach_21', 'zf', 'riemann', 'riemann_120']) same('no-halt-250k-' + name, run(M[name].rows, 250000).halted_at);
console.log('cryptids second implementation: ' + checked + ' rows recomputed, ' + bad + ' disagree' + (FULL ? ' (full)' : ' (quick rows)'));
process.exit(bad ? 1 : 0);
