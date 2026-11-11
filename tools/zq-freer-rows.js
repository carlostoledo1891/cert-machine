#!/usr/bin/env node
/* zq-freer-rows.js — Cameron Freer's published rows (elliotglazer/diophantine-z-q pull request #23, "Publish quadratic
   rows and durable tables for the quartic stack", head a4502814, directory research/stack-public-evidence/): for each
   of its twelve tables, whether the published decimal table is, coefficient by coefficient, the sum of the squares of
   the published balanced integer rows, with the counts the packet states. Writes certs/zq-freer-rows-2026-11-11.json;
   `--check` re-derives it from the pinned bytes and refuses on any difference.

   THE THEOREM IS UNDECIDED HERE, and so is each pull request's conditional claim. This closes the one question the
   review of 2026-11-08 (certs/zq-freer-2026-11-08.json) left open for want of bytes: the sum of squares. It does not
   decide that the rows are the compiled source system, nor any arithmetic argument.

   Pre-registered in notes/zq-freer-rows-preregistration-2026-11-11.md before this file ran: F the files, T the table
   and its counts, R the rows (text and JSON, the same rows), S the sum of squares, seven controls.

   CLEAN ROOM: written from the packet's README.md and FORMATS.md (what a table and a row are) and the data files.
   check_evidence.py and tools/*.py are not fetched, read or run; CHECK_OUTPUT.txt is not used. The repository has no
   licence, so nothing of it is copied here: the bytes live in $ZQ_FREER_ROWS_DIR (default
   ~/Projects/zq-scout/freer-rows-2026-11-11), fetched by commit and path with `--fetch`, and every byte read is hashed
   into the record (sha256, size, git blob id against the tree GitHub lists for the commit).

   usage: node tools/zq-freer-rows.js --fetch /absolute/empty/folder     (gh for the tree and the PR text; raw bytes by commit)
          ZQ_FREER_ROWS_DIR=/that/folder node tools/zq-freer-rows.js [--check]                                    MIT */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'certs', 'zq-freer-rows-2026-11-11.json');
const PREV = 'certs/zq-freer-2026-11-08.json';
const die = (m) => { console.error('zq-freer-rows: ' + m); process.exit(1); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const gitBlob = (b) => crypto.createHash('sha1').update('blob ' + b.length + '\0').update(b).digest('hex');

/* ---- the pin (pre-registration) ------------------------------------------------------------------------------------ */
const REPO = 'elliotglazer/diophantine-z-q';
const PR = 23;
const COMMIT = 'a4502814c0a1b8c6f2fb31b97ba9e6ea7b5322ea';
const PKG = 'research/stack-public-evidence';
const TOP = ['README.md', 'FORMATS.md', 'INDEX.json', 'MANIFEST.json'];
const ROLES = ['table', 'rowsText', 'rowsIr', 'diagonalCertificate', 'balancedSummary'];
const SAFE = /^tables\/[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)+$/;   /* a path read out of INDEX.json: inside tables/, no ".." */
const safe = (p) => SAFE.test(p) && !p.split('/').includes('..') && !/\.py$/.test(p);
/* the eight tables decided on 2026-11-08, by this packet's label -> that record's input key */
const PREV_KEY = { 'pr08-389': '#8 table', 'pr09-385': '#9 table', 'pr11-385': '#11 table', 'pr12-383': '#12 table', 'pr13-380': '#13 table, order 45',
  'pr13-383-order47': '#13 table, order 47', 'pr16-380': '#16 table, order 45', 'pr16-383-order47': '#16 table, order 47' };

/* ---- --fetch: the pinned bytes into a folder outside cert-machine --------------------------------------------------- */
async function fetchInto(dir) {
  if (!path.isAbsolute(dir)) die('--fetch needs an absolute folder');
  if (path.resolve(dir).startsWith(path.resolve(ROOT) + path.sep)) die('--fetch must not write inside cert-machine (the repository has no licence: nothing of it is copied here)');
  fs.mkdirSync(path.join(dir, 'meta'), { recursive: true });
  const gh = (p) => JSON.parse(execFileSync('gh', ['api', p], { encoding: 'utf8', maxBuffer: 1 << 28 }));
  const t = gh('repos/' + REPO + '/git/trees/' + COMMIT + '?recursive=1');
  if (t.truncated) die('the tree at ' + COMMIT + ' came back truncated');
  const tree = t.tree.filter((e) => e.type === 'blob' && e.path.startsWith(PKG + '/')).map((e) => ({ path: e.path.slice(PKG.length + 1), blob: e.sha, bytes: e.size }));
  fs.writeFileSync(path.join(dir, 'meta', 'tree.json'), JSON.stringify({ repository: REPO, commit: COMMIT, directory: PKG, files: tree }, null, 1) + '\n');
  const p = gh('repos/' + REPO + '/pulls/' + PR);
  fs.writeFileSync(path.join(dir, 'meta', 'pr-' + PR + '.json'), JSON.stringify({ number: p.number, title: p.title, state: p.state, merged: p.merged, head: { sha: p.head.sha, ref: p.head.ref, repo: p.head.repo && p.head.repo.full_name },
    base: { sha: p.base.sha, ref: p.base.ref }, created_at: p.created_at, updated_at: p.updated_at, body: p.body }, null, 1) + '\n');
  const blobOf = new Map(tree.map((e) => [e.path, e.blob]));
  const get = async (rel) => {
    if (!blobOf.has(rel)) die('the tree at the pin has no ' + rel);
    const r = await fetch('https://raw.githubusercontent.com/' + REPO + '/' + COMMIT + '/' + PKG + '/' + rel);
    if (!r.ok) die('HTTP ' + r.status + ' for ' + rel);
    const b = Buffer.from(await r.arrayBuffer());
    if (gitBlob(b) !== blobOf.get(rel)) die(rel + ' is not the blob the tree lists');
    const dst = path.join(dir, PKG, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.writeFileSync(dst, b);
    return b;
  };
  let n = 0;
  for (const rel of TOP) { await get(rel); n++; }
  const index = JSON.parse(fs.readFileSync(path.join(dir, PKG, 'INDEX.json'), 'utf8'));
  const want = new Set();
  for (const tb of index.tables) for (const role of ROLES) { const rel = tb.roles[role]; if (typeof rel !== 'string' || !safe(rel)) die('INDEX.json gives no safe path for ' + tb.label + ' ' + role); want.add(rel); }
  for (const rel of want) { await get(rel); n++; }
  console.log('zq-freer-rows: fetched ' + n + ' files of ' + REPO + ' @ ' + COMMIT.slice(0, 8) + ' into ' + dir + ' (no .py file); now: ZQ_FREER_ROWS_DIR=' + dir + ' node tools/zq-freer-rows.js --check');
}

/* ---- exact arithmetic ---------------------------------------------------------------------------------------------- */
const abs = (a) => (a < 0n ? -a : a);
const gcd = (a, b) => { a = abs(a); b = abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
/* a monomial is its sorted list of variable indices, written "i,j,k,l" ("" is 1) */
const key = (idx) => idx.join(',');
const mulKey = (a, b) => { const out = []; let i = 0, j = 0; while (i < a.length || j < b.length) out.push(j >= b.length || (i < a.length && a[i] <= b[j]) ? a[i++] : b[j++]); return out; };
const show = (k) => { if (k === '') return '1'; const c = new Map(); for (const i of k.split(',')) c.set(i, (c.get(i) || 0) + 1); return [...c].map(([i, e]) => 'x' + i + (e > 1 ? '^' + e : '')).join('*'); };
/* rationals as [numerator, positive denominator], reduced; the integer case takes no gcd */
const qParse = (s) => { const m = /^(-?\d+)(?:\/(\d+))?$/.exec(s); if (!m) return null; let n = BigInt(m[1]), d = m[2] ? BigInt(m[2]) : 1n; if (d === 0n) return null; if (d !== 1n) { const g = gcd(n, d); n /= g; d /= g; } return [n, d]; };
const qMul = (a, b) => { if (a[1] === 1n && b[1] === 1n) return [a[0] * b[0], 1n]; const n = a[0] * b[0], d = a[1] * b[1], g = gcd(n, d); return [n / g, d / g]; };
const qAdd = (a, b) => { if (a[1] === 1n && b[1] === 1n) return [a[0] + b[0], 1n]; const n = a[0] * b[1] + b[0] * a[1], d = a[1] * b[1], g = gcd(n, d); return [n / g, d / g]; };

/* ---- the formats (FORMATS.md) -------------------------------------------------------------------------------------- */
/* a monomial of the table or of a row: "1", or factors xi / xi^e joined by "*", indices strictly increasing */
function parseMonomial(s, maxExp) {
  if (s === '1') return [];
  const out = []; let last = -1;
  for (const f of s.split('*')) {
    const m = /^x(0|[1-9]\d*)(?:\^([2-9]))?$/.exec(f);
    if (!m) return null;
    const i = Number(m[1]), e = m[2] ? Number(m[2]) : 1;
    if (i <= last || e > maxExp) return null;
    last = i;
    for (let k = 0; k < e; k++) out.push(i);
  }
  return out;
}
const INT = /^-?[1-9]\d*$/;   /* a nonzero integer, written without a leading zero or a plus sign */

function parseTable(text) {
  const bad = [];
  const lines = text.split('\n');
  if (lines.pop() !== '') bad.push('the table does not end with a newline');
  const head = /^# Variables: (\d+); input: x0; degree: 4; monomials: (\d+)\.$/.exec(lines[1] || '');
  if (!/^# /.test(lines[0] || '') || !head || !/^# Format: integer coefficient, TAB, monomial; sum all data rows\.$/.test(lines[2] || '')) bad.push('the three header lines are not the format\'s');
  const poly = new Map(), order = [];
  for (let n = 3; n < lines.length; n++) {
    const parts = lines[n].split('\t');
    const idx = parts.length === 2 && INT.test(parts[0]) ? parseMonomial(parts[1], 4) : null;
    if (!idx || idx.length > 4) { bad.push('data line ' + (n + 1) + ' is not "<nonzero integer> TAB <monomial of degree at most 4>"'); if (bad.length > 5) break; continue; }
    const k = key(idx);
    if (poly.has(k)) { bad.push('monomial ' + show(k) + ' is repeated'); continue; }
    poly.set(k, BigInt(parts[0])); order.push(k);
  }
  return { bad, poly, order, statedVariables: head ? Number(head[1]) : null, statedMonomials: head ? Number(head[2]) : null };
}

function parseRowsText(text) {
  const bad = [], vars = [], rows = [];
  const lines = text.split('\n');
  if (lines.pop() !== '') bad.push('the rows text does not end with a newline');
  let cur = null;
  for (let n = 0; n < lines.length && bad.length < 6; n++) {
    const L = lines[n];
    if (L.startsWith('#')) continue;
    const p = L.split('\t');
    if (p[0] === 'V' && p.length === 4 && /^\d+$/.test(p[1]) && /^\d+$/.test(p[2])) {
      if (Number(p[1]) !== vars.length) bad.push('V line ' + (n + 1) + ' is out of order');
      if (rows.length) bad.push('a V line follows an R line');
      vars.push({ id: Number(p[2]), name: p[3] });
    } else if (p[0] === 'R' && p.length === 4 && /^\d+$/.test(p[1]) && /^\d+$/.test(p[2])) {
      if (Number(p[1]) !== rows.length) bad.push('R line ' + (n + 1) + ' is out of order');
      cur = { id: Number(p[2]), name: p[3], terms: [] }; rows.push(cur);
    } else {
      const idx = p.length === 2 && INT.test(p[0]) ? parseMonomial(p[1], 2) : null;
      if (!idx || idx.length > 2 || !cur) { bad.push('line ' + (n + 1) + ' is not a V line, an R line or "<nonzero integer> TAB <monomial of degree at most 2>" inside a row'); continue; }
      cur.terms.push([idx, BigInt(p[0])]);
    }
  }
  return { bad, vars, rows };
}

/* the rows JSON (diagonally-scaled-integer-quadratic-ir-v2), compacted: xk is the coordinate with the k-th smallest id */
function parseRowsJson(J) {
  const bad = [];
  if (J.format !== 'diagonally-scaled-integer-quadratic-ir-v2') bad.push('the rows JSON has format ' + J.format);
  const ids = J.coordinates.map((c) => c.id);
  if (ids.some((x) => !Number.isInteger(x) || x < 0) || new Set(ids).size !== ids.length) bad.push('the coordinate ids are not distinct non-negative integers');
  const sorted = J.coordinates.slice().sort((a, b) => a.id - b.id);
  const at = new Map(sorted.map((c, k) => [c.id, k]));
  const rows = J.residuals.map((r, n) => ({ id: r.id, name: r.name, terms: r.terms.map((t) => {
    const q = typeof t.coefficient === 'string' ? qParse(t.coefficient) : null;
    if (!q || t.sPower !== 0 || !Array.isArray(t.monomial) || t.monomial.length > 2 || t.monomial.some((i) => !at.has(i))) { if (bad.length < 6) bad.push('row ' + n + ' has a term that is not {monomial of at most two known ids, rational coefficient, sPower 0}'); return [[], [0n, 1n]]; }
    return [t.monomial.map((i) => at.get(i)).sort((a, b) => a - b), q];
  }) }));
  return { bad, vars: sorted.map((c) => ({ id: c.id, name: c.name })), rows };
}

/* ---- the decisions -------------------------------------------------------------------------------------------------- */
/* Σ_k (row k)², in integers */
function sumOfSquares(rows) {
  const P = new Map();
  const add = (k, v) => { const s = (P.get(k) || 0n) + v; if (s === 0n) P.delete(k); else P.set(k, s); };
  for (const r of rows) {
    const t = r.terms;
    for (let i = 0; i < t.length; i++) {
      add(key(mulKey(t[i][0], t[i][0])), t[i][1] * t[i][1]);
      for (let j = i + 1; j < t.length; j++) add(key(mulKey(t[i][0], t[j][0])), 2n * t[i][1] * t[j][1]);
    }
  }
  return P;
}
/* the same sum in rationals (the JSON's coefficients are rational strings) */
function sumOfSquaresQ(rows) {
  const P = new Map();
  const add = (k, v) => { const s = P.has(k) ? qAdd(P.get(k), v) : v; if (s[0] === 0n) P.delete(k); else P.set(k, s); };
  for (const r of rows) {
    const t = r.terms;
    for (let i = 0; i < t.length; i++) {
      add(key(mulKey(t[i][0], t[i][0])), qMul(t[i][1], t[i][1]));
      for (let j = i + 1; j < t.length; j++) add(key(mulKey(t[i][0], t[j][0])), qMul([2n, 1n], qMul(t[i][1], t[j][1])));
    }
  }
  return P;
}
/* P against the table, coefficient by coefficient; `q` when P holds rationals */
function comparePoly(P, table, q) {
  let differing = 0, first = null;
  const note = (k, a, b) => { differing++; if (!first || k < first.k) first = { k, monomial: show(k), sumOfSquares: a, table: b }; };
  const str = (v) => (v === undefined ? 'absent' : q ? (v[1] === 1n ? String(v[0]) : v[0] + '/' + v[1]) : String(v));
  const brief = (s) => (s.length > 60 ? s.slice(0, 24) + '…' + s.slice(-24) + ' (' + s.replace('-', '').length + ' digits)' : s);
  for (const [k, v] of P) { const t = table.get(k); if (t === undefined || (q ? v[1] !== 1n || v[0] !== t : v !== t)) note(k, brief(str(v)), brief(t === undefined ? 'absent' : String(t))); }
  for (const [k, t] of table) if (!P.has(k)) note(k, 'absent', brief(String(t)));
  if (first) delete first.k;
  return { equal: differing === 0, monomialsCompared: table.size, differing, first };
}
const rowMap = (r, q) => { const m = new Map(); let rep = false; for (const [idx, c] of r.terms) { const k = key(idx); if (m.has(k)) rep = true; m.set(k, q ? c : [c, 1n]); } return { m, rep }; };
/* the text rows against the JSON rows: the same variables, the same rows in the same order, term for term */
function compareRows(TX, JS) {
  if (TX.vars.length !== JS.vars.length) return { equal: false, first: 'the text lists ' + TX.vars.length + ' variables, the JSON ' + JS.vars.length };
  for (let k = 0; k < TX.vars.length; k++) if (TX.vars[k].id !== JS.vars[k].id || TX.vars[k].name !== JS.vars[k].name) return { equal: false, first: 'variable x' + k + ' is ' + TX.vars[k].id + ' ' + TX.vars[k].name + ' in the text and ' + JS.vars[k].id + ' ' + JS.vars[k].name + ' in the JSON' };
  if (TX.rows.length !== JS.rows.length) return { equal: false, first: 'the text has ' + TX.rows.length + ' rows, the JSON ' + JS.rows.length };
  for (let n = 0; n < TX.rows.length; n++) {
    const a = TX.rows[n], b = JS.rows[n];
    if (a.id !== b.id || a.name !== b.name) return { equal: false, first: 'row ' + n + ' is ' + a.id + ' ' + a.name + ' in the text and ' + b.id + ' ' + b.name + ' in the JSON' };
    const A = rowMap(a, false).m, B = rowMap(b, true).m;
    if (A.size !== B.size) return { equal: false, first: 'row ' + n + ' (' + a.name + ') has ' + A.size + ' terms in the text and ' + B.size + ' in the JSON' };
    for (const [k, v] of A) { const w = B.get(k); if (!w || w[1] !== 1n || w[0] !== v[0]) return { equal: false, first: 'row ' + n + ' (' + a.name + ') differs at ' + show(k) }; }
  }
  return { equal: true, first: null };
}
/* the text rows on their own: n variables with increasing ids, r rows, indices below n, no repeat, primitive */
function rowsFacts(TX) {
  const bad = TX.bad.slice();
  const n = TX.vars.length;
  for (let k = 1; k < n; k++) if (TX.vars[k].id <= TX.vars[k - 1].id) { bad.push('the V lines\' ids do not increase at x' + k); break; }
  let terms = 0, maxDegree = 0, notPrimitive = 0;
  const used = new Set();
  TX.rows.forEach((r, i) => {
    if (!r.terms.length) bad.push('row ' + i + ' is empty');
    if (rowMap(r, false).rep) bad.push('row ' + i + ' repeats a monomial');
    let g = 0n;
    for (const [idx, c] of r.terms) { terms++; maxDegree = Math.max(maxDegree, idx.length); g = gcd(g, c); for (const v of idx) { if (v >= n) bad.push('row ' + i + ' names x' + v + ', beyond the ' + n + ' variables'); used.add(v); } }
    if (r.terms.length && g !== 1n) notPrimitive++;
  });
  if (notPrimitive) bad.push(notPrimitive + ' row(s) are not primitive');
  return { bad: bad.slice(0, 6), variables: n, rows: TX.rows.length, terms, maxDegree, variablesUsed: used.size };
}
function tableFacts(TB) {
  let max = 0n, content = 0n, degree = 0;
  const used = new Set();
  for (const [k, v] of TB.poly) { const a = abs(v); if (a > max) max = a; content = gcd(content, a); const idx = k === '' ? [] : k.split(','); degree = Math.max(degree, idx.length); for (const i of idx) used.add(Number(i)); }
  const x04 = TB.poly.get('0,0,0,0');
  return { variables: used.size, largestIndex: Math.max(-1, ...used), monomials: TB.poly.size, degree, content: String(content), x0FourthCoefficient: x04 === undefined ? 'absent' : String(x04),
    maxDigits: String(max).length, maxBits: max.toString(2).length, max };
}

/* one table's four questions, from its parsed pieces and what the packet states of it */
function decide(label, P) {
  const { files, stated, TB, TX, JS, summary } = P;
  /* F */
  const fBad = files.problems.slice();
  /* T */
  const tf = tableFacts(TB);
  const tBad = TB.bad.slice();
  const eq = (name, got, want) => { if (got !== want) tBad.push(name + ' ' + got + ', stated ' + want); };
  eq('header variables', TB.statedVariables, stated.variables); eq('header monomials', TB.statedMonomials, stated.monomials);
  eq('variables occurring', tf.variables, stated.variables); eq('largest index', tf.largestIndex, stated.variables - 1);
  eq('monomials', tf.monomials, stated.monomials); eq('degree', tf.degree, 4); eq('content', tf.content, '1'); eq('x0^4 coefficient', tf.x0FourthCoefficient, '1');
  eq('largest-coefficient digits', tf.maxDigits, stated.digits);
  eq('summary coordinates', summary.coordinates, stated.variables); eq('summary residuals', summary.residuals, stated.rows); eq('summary monomials', summary.monomials, stated.monomials);
  eq('summary digits', summary.maximumCoefficientDigits, stated.digits); eq('largest-coefficient bits', tf.maxBits, summary.maximumCoefficientBits);
  let maxIs = null;
  if (summary.cExponent !== null && summary.cExponent !== undefined) { maxIs = '28902*3^' + 4 * summary.cExponent; if (tf.max !== 28902n * 3n ** BigInt(4 * summary.cExponent)) tBad.push('the largest |coefficient| is not ' + maxIs); }
  /* R */
  const rf = rowsFacts(TX);
  const rBad = rf.bad.concat(JS.bad);
  if (rf.variables !== stated.variables) rBad.push('V lines ' + rf.variables + ', stated ' + stated.variables);
  if (rf.rows !== stated.rows) rBad.push('rows ' + rf.rows + ', stated ' + stated.rows);
  if (rf.maxDegree > 2) rBad.push('a row has degree ' + rf.maxDegree);
  const same = compareRows(TX, JS);
  if (!same.equal) rBad.push('text and JSON rows differ: ' + same.first);
  /* S */
  const sText = comparePoly(sumOfSquares(TX.rows), TB.poly, false);
  const sJson = comparePoly(sumOfSquaresQ(JS.rows), TB.poly, true);
  const sBad = [];
  if (!sText.equal) sBad.push('from the text rows, ' + sText.differing + ' monomial(s) differ; first ' + sText.first.monomial + ': sum of squares ' + sText.first.sumOfSquares + ', table ' + sText.first.table);
  if (!sJson.equal) sBad.push('from the JSON rows, ' + sJson.differing + ' monomial(s) differ; first ' + sJson.first.monomial + ': sum of squares ' + sJson.first.sumOfSquares + ', table ' + sJson.first.table);
  const verdicts = { F: fBad.length ? 'REFUSED' : 'CERTIFIED', T: tBad.length ? 'REFUTED' : 'CERTIFIED', R: rBad.length ? 'REFUTED' : 'CERTIFIED', S: sBad.length ? 'REFUTED' : 'CERTIFIED' };
  const verdict = verdicts.F !== 'CERTIFIED' ? 'REFUSED' : Object.values(verdicts).every((v) => v === 'CERTIFIED') ? 'CERTIFIED' : 'REFUTED';
  return { verdicts, verdict, problems: { F: fBad, T: tBad, R: rBad, S: sBad },
    numbers: { variables: tf.variables, rows: rf.rows, rowTerms: rf.terms, rowMaxDegree: rf.maxDegree, monomials: tf.monomials, degree: tf.degree, content: tf.content, x0FourthCoefficient: tf.x0FourthCoefficient,
      maxCoefficientDigits: tf.maxDigits, maxCoefficientBits: tf.maxBits, ...(maxIs ? { maxAbsCoefficient: maxIs } : {}), monomialsCompared: sText.monomialsCompared, differingFromTextRows: sText.differing, differingFromJsonRows: sJson.differing } };
}

/* ---- the record ----------------------------------------------------------------------------------------------------- */
const UNDECIDED = 'The theorem (Z is Diophantine in Q) is undecided here, and so is the conditional claim of each pull request of the stack (that the rational zero projection of its quartic is Z, given the inherited arithmetic inputs). '
  + 'This decides one finite identity per table: that the published decimal table is, coefficient by coefficient, the sum of the squares of the published balanced integer rows, with the counts the packet states. '
  + 'That the rows are the compiled source system, and every arithmetic argument, are not decided.';
const NOT_DECIDED = [
  'the step from the raw representation to the compiled one (the gate identities, reduction-certificate.json), which the pull request itself says is not replayed',
  'the diagonal maps, the factored-pole transports, the compiled-to-next comparisons and the exact-rewrite certificates of #13 and #18 (the packet checker\'s items 5 to 8): not replayed here',
  'the bindings of the packet\'s files to hashes published at other commits (75e76303, 452c8620); of INDEX.json\'s 216 copied files, 132 bound and 84 not, only the count of its own flags is read',
  'whether the rows are a faithful encoding of each PROOF.md; every positivity, domain, zero-branch, valuation, completeness, height or prime-selection argument; the eleven inherited inputs',
  'anything in #30 (the 214-variable family opened on 2026-11-11, when #8 to #20 were closed as archived research, #23 staying open), and the Version 14 to 16 material of the repository',
  'check_evidence.py and tools/*.py: not fetched, read or run, and their sha256 in MANIFEST.json not compared (their sizes are, against the tree); CHECK_OUTPUT.txt is not used',
  'the conditional claim of any pull request, and the theorem',
];

function build(DIR) {
  const t0 = Date.now();
  const P = (rel) => path.join(DIR, PKG, rel);
  const meta = (rel) => { const f = path.join(DIR, 'meta', rel); if (!fs.existsSync(f)) die('no ' + f + ' (run --fetch)'); return JSON.parse(fs.readFileSync(f, 'utf8')); };
  const tree = meta('tree.json'), pr = meta('pr-' + PR + '.json');
  if (tree.commit !== COMMIT || tree.repository !== REPO || tree.directory !== PKG) die('meta/tree.json is of another commit, repository or directory');
  if (pr.number !== PR || pr.head.sha !== COMMIT) die('meta/pr-' + PR + '.json names another head than the pin: ' + pr.head.sha);
  const treeOf = new Map(tree.files.map((e) => [e.path, e]));
  const inputs = {};
  /* every byte read goes through here: hashed, sized, and held to the blob the commit's tree lists */
  const read = (rel) => {
    if (!fs.existsSync(P(rel))) die('no ' + P(rel) + ' (run --fetch)');
    const stored = fs.readFileSync(P(rel));
    const e = treeOf.get(rel);
    const rec = { sha256: sha(stored), bytes: stored.length, gitBlob: gitBlob(stored), blobInTree: !!e && e.blob === gitBlob(stored) };
    let bytes = stored;
    if (/\.gz$/.test(rel)) { try { bytes = zlib.gunzipSync(stored); } catch (err) { bytes = null; } if (bytes) { rec.inflatedSha256 = sha(bytes); rec.inflatedBytes = bytes.length; } }
    inputs[rel] = rec;
    return { stored, bytes, rec };
  };
  const readme = read('README.md').bytes.toString('utf8');
  read('FORMATS.md');
  const index = JSON.parse(read('INDEX.json').bytes.toString('utf8'));
  const manifest = JSON.parse(read('MANIFEST.json').bytes.toString('utf8'));
  const manOf = new Map(manifest.files.map((f) => [f.path, f]));
  /* the README's table of the twelve */
  const statedRows = [...readme.matchAll(/^\| (pr\d\d-[\w-]+) \| #(\d+) \| (\d+) \| (\d+) \| (\d+) \| (\d+) \| (3\^\d+) \| `([0-9a-f]{8})…([0-9a-f]{6})` \| `([0-9a-f]{8})…([0-9a-f]{6})` \|/gm)]
    .map((m) => ({ label: m[1], pr: Number(m[2]), variables: Number(m[3]), rows: Number(m[4]), monomials: Number(m[5]), digits: Number(m[6]), anchor: m[7], tableSha: [m[8], m[9]], rowsSha: [m[10], m[11]] }));
  const prev = JSON.parse(fs.readFileSync(path.join(ROOT, PREV), 'utf8'));
  const short = (h, [a, b]) => h.startsWith(a) && h.endsWith(b);

  /* the files of one path against the tree, MANIFEST.json and INDEX.json */
  const fileProblems = (rel, r) => {
    const bad = [];
    if (!r.rec.blobInTree) bad.push(rel + ' is not the blob the tree lists at the pin');
    const m = manOf.get(rel);
    if (rel !== 'MANIFEST.json' && (!m || m.sha256 !== r.rec.sha256 || m.bytes !== r.rec.bytes)) bad.push(rel + ' is not the sha256 and size MANIFEST.json gives');
    const ix = index.files[rel] || index.derived[rel];
    if (ix) {
      if (ix.storedSha256 !== r.rec.sha256 || ix.storedBytes !== r.rec.bytes) bad.push(rel + ' is not the stored sha256 and size INDEX.json gives');
      if (!r.bytes) bad.push(rel + ' does not gunzip');
      else if (ix.sha256 !== sha(r.bytes) || ix.bytes !== r.bytes.length) bad.push(rel + ' does not decompress to the sha256 and size INDEX.json gives');
    } else if (/^tables\//.test(rel)) bad.push(rel + ' is not in INDEX.json');
    return bad;
  };
  const topProblems = TOP.flatMap((rel) => fileProblems(rel, { rec: inputs[rel], bytes: fs.readFileSync(P(rel)) }));

  const parsed = {};
  const tables = index.tables.map((tb, i) => {
    const st = statedRows[i];
    const f = {};
    for (const role of ROLES) { const rel = tb.roles[role]; if (typeof rel !== 'string' || !safe(rel)) die('INDEX.json gives no safe path for ' + tb.label + ' ' + role); f[role] = Object.assign(read(rel), { rel }); }
    const problems = ROLES.flatMap((role) => fileProblems(f[role].rel, f[role]));
    if (!st || st.label !== tb.label || st.pr !== tb.pr) die('the README\'s table of the twelve does not list ' + tb.label + ' in INDEX.json\'s order');
    for (const role of ROLES) if (!f[role].bytes) die(f[role].rel + ' does not gunzip');
    const tableSha = sha(f.table.bytes), rowsTextSha = sha(f.rowsText.bytes), rowsJsonSha = sha(f.rowsIr.bytes);
    if (!short(tableSha, st.tableSha)) problems.push('the table is not the README\'s ' + st.tableSha.join('…'));
    if (!short(rowsTextSha, st.rowsSha)) problems.push('the rows text is not the README\'s ' + st.rowsSha.join('…'));
    const summary = JSON.parse(f.balancedSummary.bytes.toString('utf8'));
    if (JSON.stringify(summary) !== JSON.stringify(tb.publishedSummary)) problems.push('the balanced summary is not INDEX.json\'s publishedSummary');
    if (summary.tableSha256 !== tableSha || summary.tableBytes !== f.table.bytes.length) problems.push('the table is not the sha256 and size its summary gives');
    const diag = JSON.parse(f.diagonalCertificate.bytes.toString('utf8'));
    if (diag.newIrSha256 !== rowsJsonSha) problems.push('the diagonal certificate names other rows than the rows JSON');
    let sameTableAs1108 = null;
    if (PREV_KEY[tb.label]) { const pin = prev.inputs[PREV_KEY[tb.label]]; sameTableAs1108 = !!pin && pin.sha256 === tableSha; if (!sameTableAs1108) problems.push('the table is not the one ' + PREV + ' pinned as ' + PREV_KEY[tb.label]); }
    const pieces = { files: { problems }, stated: st, summary, TB: parseTable(f.table.bytes.toString('utf8')), TX: parseRowsText(f.rowsText.bytes.toString('utf8')), JS: parseRowsJson(JSON.parse(f.rowsIr.bytes.toString('utf8'))), f };
    parsed[tb.label] = pieces;
    const d = decide(tb.label, pieces);
    return { label: tb.label, pr: '#' + tb.pr, head: tb.head, stated: { variables: st.variables, rows: st.rows, monomials: st.monomials, maxCoefficientDigits: st.digits },
      files: { table: f.table.rel, rowsText: f.rowsText.rel, rowsJson: f.rowsIr.rel, tableSha256: tableSha, rowsTextSha256: rowsTextSha, rowsJsonSha256: rowsJsonSha, ...(sameTableAs1108 === null ? {} : { sameTableAsDecided20261108: sameTableAs1108 }) },
      numbers: d.numbers, verdicts: d.verdicts, verdict: d.verdict, ...(d.verdict === 'CERTIFIED' ? {} : { problems: d.problems }) };
  });
  if (statedRows.length !== tables.length) die('the README lists ' + statedRows.length + ' tables, INDEX.json ' + tables.length);

  /* the packet as the pull request states it: counts only */
  const treeBytes = tree.files.reduce((a, e) => a + e.bytes, 0);
  const listedBytes = tree.files.filter((e) => e.path !== 'MANIFEST.json').reduce((a, e) => a + e.bytes, 0);
  const manifestCovers = tree.files.every((e) => e.path === 'MANIFEST.json' || (manOf.has(e.path) && manOf.get(e.path).bytes === e.bytes)) && manifest.files.every((f) => treeOf.has(f.path)) && manifest.files.length === tree.files.length - 1
    && manifest.fileCount === manifest.files.length && manifest.totalBytes === listedBytes;
  const idxFiles = Object.values(index.files);
  /* "5.9 MB" is read as the manifest's total: every file but MANIFEST.json itself */
  const packet = { tables: tables.length, filesInTree: tree.files.length, bytesInTree: treeBytes, bytesListedInManifest: listedBytes, megabytes: (listedBytes / 1e6).toFixed(1), manifestListsEveryOtherFileAtItsSize: manifestCovers,
    filesReadAndHashed: Object.keys(inputs).length, pythonFilesNotFetched: tree.files.filter((e) => /\.py$/.test(e.path)).map((e) => e.path),
    indexCopiedFiles: idxFiles.length, indexBound: idxFiles.filter((v) => v.bound === true).length, indexUnbound: idxFiles.filter((v) => v.bound !== true).length,
    pullRequestStates: { '12 selected tables': /the 12 selected tables/.test(pr.body), 'The packet is 5.9 MB': /The packet is 5\.9 MB/.test(pr.body), 'Of 216 copied files, 132 are bound by previously published hashes and 84 have no prior published binding': /Of 216 copied files, 132 are bound by previously published hashes and 84 have no prior published binding/.test(pr.body) },
    topFileProblems: topProblems };
  const packetOk = !topProblems.length && manifestCovers && packet.tables === 12 && packet.megabytes === '5.9' && packet.indexCopiedFiles === 216 && packet.indexBound === 132 && packet.indexUnbound === 84 && Object.values(packet.pullRequestStates).every(Boolean);

  /* ---- the seven controls, each on every table, in memory ---- */
  const ctl = [];
  const each = (id, what, expect, fn) => {
    const per = tables.map((t) => { let r; try { r = fn(parsed[t.label], t); } catch (e) { r = { ok: false, note: 'threw: ' + e.message }; } return Object.assign({ label: t.label }, r); });
    const passed = per.every((x) => x.ok);
    ctl.push({ id, what, expect, tables: per.length, asExpected: per.filter((x) => x.ok).length, passed, example: per[0].note, ...(passed ? {} : { failedOn: per.filter((x) => !x.ok).map((x) => x.label + ': ' + x.note) }) });
  };
  const cloneRows = (TX) => ({ bad: TX.bad, vars: TX.vars, rows: TX.rows.map((r) => ({ id: r.id, name: r.name, terms: r.terms.map(([i, c]) => [i, c]) })) });
  const mid = (TX) => Math.floor(TX.rows.length / 2);
  const S = (rows, TB) => comparePoly(sumOfSquares(rows), TB.poly, false);
  each('C1', 'one coefficient of one row raised by one (row ⌊r/2⌋, its first term)', 'S fails', (p) => {
    const X = cloneRows(p.TX), k = mid(X); X.rows[k].terms[0][1] += 1n;
    const s = S(X.rows.map((r) => ({ terms: r.terms.filter((t) => t[1] !== 0n) })), p.TB);
    return { ok: !s.equal, note: 'row ' + k + ' (' + X.rows[k].name + '): ' + s.differing + ' monomial(s) of the sum differ from the table' };
  });
  each('C2', 'one coefficient of the table raised by one (data line ⌊m/2⌋)', 'S fails', (p) => {
    const k = p.TB.order[Math.floor(p.TB.order.length / 2)], T2 = new Map(p.TB.poly); T2.set(k, T2.get(k) + 1n);
    const s = comparePoly(sumOfSquares(p.TX.rows), T2, false);
    return { ok: !s.equal && s.differing === 1 && s.first.monomial === show(k), note: 'at ' + show(k) + ': ' + s.differing + ' monomial differs' };
  });
  each('C3', 'one row dropped (row ⌊r/2⌋)', 'S fails', (p) => {
    const k = mid(p.TX), s = S(p.TX.rows.filter((_, i) => i !== k), p.TB);
    return { ok: !s.equal, note: 'without row ' + k + ' (' + p.TX.rows[k].name + '): ' + s.differing + ' monomial(s) differ' };
  });
  const sameRow = (a, b) => { const A = rowMap(a, false).m, B = rowMap(b, false).m; if (A.size !== B.size) return false; for (const [k, v] of A) { const w = B.get(k); if (!w || w[0] !== v[0]) return false; } return true; };
  each('C4', 'two neighbouring rows of the text exchanged (the first pair from ⌊r/2⌋ on that differ)', 'S still holds (a sum does not see order); R fails (the text no longer matches the JSON row by row)', (p) => {
    const X = cloneRows(p.TX); let k = mid(X); while (k + 1 < X.rows.length && sameRow(X.rows[k], X.rows[k + 1])) k++;
    if (k + 1 >= X.rows.length) return { ok: false, note: 'no two differing neighbours' };
    /* the R lines keep their places (k, id, name); the terms change places */
    const t = X.rows[k].terms; X.rows[k].terms = X.rows[k + 1].terms; X.rows[k + 1].terms = t;
    const s = S(X.rows, p.TB), r = compareRows(X, p.JS);
    return { ok: s.equal && !r.equal, note: 'rows ' + k + ' and ' + (k + 1) + ': sum of squares ' + (s.equal ? 'unchanged' : 'CHANGED') + '; ' + (r.equal ? 'rows NOT caught' : r.first) };
  });
  each('C5', 'one row of the text multiplied by −1 (row ⌊r/2⌋)', 'S still holds (a square does not see sign); R fails', (p) => {
    const X = cloneRows(p.TX), k = mid(X); for (const t of X.rows[k].terms) t[1] = -t[1];
    const s = S(X.rows, p.TB), r = compareRows(X, p.JS);
    return { ok: s.equal && !r.equal, note: 'row ' + k + ': sum of squares ' + (s.equal ? 'unchanged' : 'CHANGED') + '; ' + (r.equal ? 'rows NOT caught' : r.first) };
  });
  each('C6', 'one byte of the stored table changed (the middle byte, its lowest bit)', 'F refuses', (p) => {
    const b = Buffer.from(p.f.table.stored); b[b.length >> 1] ^= 1;
    const m = manOf.get(p.f.table.rel), refused = sha(b) !== m.sha256 && gitBlob(b) !== treeOf.get(p.f.table.rel).blob;
    return { ok: refused, note: 'sha256 ' + sha(b).slice(0, 16) + '… (MANIFEST.json ' + m.sha256.slice(0, 16) + '…)' };
  });
  each('C7', 'the stated number of variables raised by one', 'T fails', (p, t) => {
    const d = decide(t.label, Object.assign({}, p, { stated: Object.assign({}, p.stated, { variables: p.stated.variables + 1 }) }));
    return { ok: d.verdicts.T === 'REFUTED', note: d.problems.T[0] || 'T not refuted' };
  });

  const controlsOk = ctl.every((c) => c.passed);
  const all = tables.every((t) => t.verdict === 'CERTIFIED');
  const verdict = !controlsOk || !packetOk ? 'REFUSED' : all ? 'CERTIFIED' : tables.some((t) => t.verdict === 'REFUTED') ? 'REFUTED' : 'REFUSED';
  const reason = !controlsOk ? 'a control did not come out as pre-registered: ' + ctl.filter((c) => !c.passed).map((c) => c.id).join(', ')
    : !packetOk ? 'the packet is not as the pull request states it (see packet)'
      : all ? 'for each of the twelve tables (#8, #9, #11, #12, #13 at orders 45 and 47, #16 at orders 45 and 47, #17, #18, #19, #20): the files are the blobs of the pinned commit with the hashes the packet\'s manifest, index and README give; the table has the stated variables, monomials and largest-coefficient digits, degree 4, content 1 and x0^4 coefficient 1; the rows text and the rows JSON are the same integral, primitive rows of degree at most 2, in the stated number; and the sum of their squares, expanded in exact integers from the text and in exact rationals from the JSON, is the table coefficient by coefficient; every control came out as pre-registered'
        : 'see the table whose verdict is not CERTIFIED';
  return {
    rec: {
      what: 'Cameron Freer\'s published rows for the conditional quartic stack on github.com/elliotglazer/diophantine-z-q (pull request #23, open when decided; twelve tables of #8 to #20), decided by a non-author with code of its own (Node, BigInt and exact rationals; the packet\'s checker and tools not fetched, read or run): '
        + 'F the files, T each table and its stated counts, R the rows (text and JSON), S that the table is the sum of the squares of the rows.',
      undecided: UNDECIDED,
      notDecided: NOT_DECIDED,
      generated: new Date().toISOString().slice(0, 10),
      preregistration: 'notes/zq-freer-rows-preregistration-2026-11-11.md',
      reviewer: { name: 'Carlos Toledo', github: 'carlostoledo1891', with: 'Claude agents: Anthropic Claude (claude-fable-5-2) in Claude Code, one agent session',
        role: 'a non-author check of published rows; not a review under that repository\'s protocol, and neither is nor stands in for its "Protocol / independent agent audit" check' },
      repository: 'github.com/' + REPO, pullRequest: { number: PR, title: pr.title, head: COMMIT, directory: PKG },
      follows: { record: PREV, leftOpenThere: 'the sum of squares (the residual rows were not published)', sameTables: tables.filter((t) => t.files.sameTableAsDecided20261108 === true).length },
      inputs,
      code: { 'tools/zq-freer-rows.js': sha(fs.readFileSync(__filename)) },
      verdict, reason,
      packet,
      tables,
      controls: ctl,
      readings: {
        F: 'every file read is hashed (sha256, size) and its git blob id compared with the tree GitHub lists for the commit (meta/tree.json, saved by --fetch); stored bytes against MANIFEST.json, stored and decompressed bytes against INDEX.json; the README\'s shortened hashes; the diagonal certificate\'s newIrSha256 against the rows JSON (a name, not a replay of the map); for the eight tables of #8 to #16, the table\'s sha256 against ' + PREV + '.',
        T: 'FORMATS.md: three header lines, then "<integer> TAB <monomial>" lines; a monomial is 1 or factors xi / xi^e (e in 2..4) joined by *, indices strictly increasing; no repeated monomial, no zero coefficient. The numbers are read from the parsed polynomial and held to the README\'s row and INDEX.json\'s publishedSummary; with a cExponent, the largest |coefficient| is 28902·3^(4·cExponent).',
        R: 'FORMATS.md: # comments; V<TAB>k<TAB>id<TAB>name for k = 0..n−1 with increasing ids; R<TAB>k<TAB>id<TAB>name starts row k; each following "<integer> TAB <monomial>" line a term of degree at most 2. The JSON rows (coordinates, residuals, terms {monomial, coefficient, sPower}) are compacted by increasing id and compared with the text row by row, as maps from monomial to coefficient, ids and names included.',
        S: 'Σ_k (row k)² expanded term by term (squares and doubled cross products) into a map from monomial to an exact integer (BigInt) from the text rows, and to an exact rational from the JSON rows; compared with the table both ways: every monomial of either side must be on the other with the same coefficient.',
      },
    },
    seconds: (Date.now() - t0) / 1000,
  };
}

/* ---- main ---------------------------------------------------------------------------------------------------------- */
const fi = process.argv.indexOf('--fetch');
if (fi > 0) {
  fetchInto(process.argv[fi + 1] || die('usage: --fetch /absolute/empty/folder')).catch((e) => die(e.message));
} else {
  const DIR = process.env.ZQ_FREER_ROWS_DIR || path.join(os.homedir(), 'Projects', 'zq-scout', 'freer-rows-2026-11-11');
  if (!fs.existsSync(path.join(DIR, PKG))) die('no packet at ' + DIR + ' (node tools/zq-freer-rows.js --fetch /absolute/empty/folder, then set ZQ_FREER_ROWS_DIR)');
  const { rec: R, seconds } = build(DIR);
  const strip = (x) => JSON.stringify(Object.assign({}, x, { generated: null }));
  const line = (r) => r.tables.filter((t) => t.verdict === 'CERTIFIED').length + ' of ' + r.tables.length + ' tables CERTIFIED (F, T, R, S) · ' + r.tables.reduce((a, t) => a + t.numbers.monomialsCompared, 0).toLocaleString('en-US') + ' coefficients compared · controls '
    + r.controls.filter((c) => c.passed).length + '/' + r.controls.length;
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(OUT)) die('no record to check');
    if (strip(JSON.parse(fs.readFileSync(OUT, 'utf8'))) !== strip(R)) die('certs/zq-freer-rows-2026-11-11.json is not what the pinned inputs and this code give now');
    console.log('zq-freer-rows: re-derived, identical · ' + R.verdict + ' · ' + line(R) + ' · ' + seconds.toFixed(1) + ' s');
  } else {
    fs.writeFileSync(OUT, JSON.stringify(R, null, 1) + '\n');
    console.log('zq-freer-rows: ' + R.verdict + ' · ' + line(R) + ' · ' + seconds.toFixed(1) + ' s');
    for (const t of R.tables) if (t.verdict !== 'CERTIFIED') console.log('  ' + t.label + ' ' + JSON.stringify(t.verdicts) + ': ' + JSON.stringify(t.problems));
    for (const c of R.controls.filter((x) => !x.passed)) console.log('  control ' + c.id + ' NOT as expected: ' + (c.failedOn || []).join(' | '));
    if (R.packet.topFileProblems.length) console.log('  packet: ' + R.packet.topFileProblems.join('; '));
  }
}
