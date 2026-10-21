/* instruments/selfaudit/shapes.js — the self-audit of cert-machine, Phase 3: the SHAPES family (28 register rows: the 20
   EinsteinArena / Together "new SOTA" constructions of certs/easota-ledger.json and the 8 EinsteinArena bests of
   certs/mc100-einstein-arena.json that are register rows of their own).

   THE OBJECT is the construction as its file carries it — every number the decimal LITERAL the bytes hold — plus the
   printed bar: for the easota rows the README's printed value under the row's printed convention (rounding, ceiling,
   exact); for the mc100 rows the platform's score S under the platform's own resolution (its minImprovement for the
   problem when nonzero, else 1e-12 relative — the agreement rule of tools/run-mc100-einstein.js, which is PART OF THE
   CLAIM there). Kinds: circles (21 circles in a box of w + h ≤ 2, Σr), heilbronn (14 points, min triangle / hull area),
   mindist (16 points, (max d / min d)²), overlap (a step function h, 0 ≤ h ≤ 1, Σh = n/2, the upper bound), edges
   (rows of 20 weights, the platform's envelope score), autocorr (f ≥ 0, C₁), flat (70 coefficients ±1, the supremum
   C⁺ certified as an enclosure), hexagons (12 unit hexagons inside a hexagon of the printed side), kissing (the
   penalty-scored rungs: n vectors in R^d, S = the overlap penalty).

   The pre-registration's classes, as written:
     FALSE   the printed value moved one unit in its last printed digit past the bytes (both directions; FALSE only when
             the witness finds the bar no longer agrees with the exact score under the row's convention, else
             DISCARDED — a row that prints no value has no such mutant, EXCLUDED) · one coordinate perturbed by 10⁻¹²
             (FALSE only with a witness: a violated constraint or a changed exact score past the bar, else DISCARDED;
             the perturbation is aimed where a constraint is tightest — the worst circle pair, a zero of f, a
             coefficient that must be ±1, a step of h; EXCLUDED for hexagons, whose constraints need certified
             trigonometry no standard-library witness has)
     TRUE    a rigid motion the problem admits, stated per kind: circles reflected in x; the points translated by
             (0.125, −0.375); the step function and f reversed; the weight rows reversed; the coefficients reversed
             (the reciprocal polynomial has the same modulus on the circle; the platform's grid is symmetric); the
             hexagons and the outer hexagon translated by (0.125, −0.375); the vectors' coordinates rotated by one
     MALFORMED  a coordinate missing: a short circle, point, weight row, hexagon or vector; a null step, value or
             coefficient

   THE DECIDER UNDER TEST: for the easota rows instruments/easota/decide.js (hexagons.js for the hexagons) composed as
   tools/run-easota-ledger.js composes it — the word WITNESSED / REPAIRED / UNWITNESSED (UNDECIDED for hexagons) from
   the decision, printedAgrees from the ledger's agree() under the row's convention, the register's word CERTIFIED for
   WITNESSED and REPAIRED for REPAIRED (a row with any other word is one the register build refuses: the word is
   reported as the ledger says it); for the mc100 rows tools/run-mc100-einstein.js's own easotaRow / kissingRow,
   required as a module (the same functions the kit's command runs), their word the register's. THE WITNESS is
   instruments/selfaudit/witness_shapes.py — standard library, exact in Fractions (the long convolutions by
   Kronecker substitution into one big integer; the kissing penalty enclosed in directed-rounding Decimal; flat
   polynomials bounded below at an exact rational point of the circle, so only a bar that is too LOW is witnessed);
   it shares no code with any decider. The float check is instruments/selfaudit/floatcheck_shapes.py.      MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const L = require(path.join(ROOT, 'instruments', 'easota', 'lib.js'));
const D = require(path.join(ROOT, 'instruments', 'easota', 'decide.js'));
const H = require(path.join(ROOT, 'instruments', 'easota', 'hexagons.js'));
const MC = require(path.join(ROOT, 'tools', 'run-mc100-einstein.js'));
const WD = require(path.join(ROOT, 'instruments', 'easota', 'word.js'));
const Q = L.Q;

const EASOTA = 'certs/easota-ledger.json', MC100 = 'certs/mc100-einstein-arena.json';
const PROBLEMS = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'einstein-arena', 'problems.json'), 'utf8'));
const SLUG_KIND = { 'erdos-min-overlap': 'overlap', 'first-autocorrelation-inequality': 'autocorr', 'flat-polynomials': 'flat', 'edges-vs-triangles': 'edges', 'circles-rectangle': 'circles', 'min-distance-ratio-2d': 'mindist', 'kissing-number-d12': 'kissing', 'kissing-number-d11-605': 'kissing', 'kissing-number-d11': 'kissing', 'kissing-number-d12-842': 'kissing' };
const DATA_KEY = { circles: 'circles', heilbronn: 'points', mindist: 'points', overlap: 'values', edges: 'weights', autocorr: 'values', flat: 'coefficients', hexagons: 'hexagons', kissing: 'vectors' };

/* ---- literals: every number as the decimal text the file carries ---- */
const litOf = (x) => (x && typeof x.lit === 'string' ? x.lit : x === null ? null : Array.isArray(x) ? x.map(litOf) : x);
const decimalOf = (r, digits) => L.toFixed(r, digits);               /* exact for a terminating decimal at that many digits */
const fracDigits = (s) => (String(s).split('.')[1] || '').replace(/e.*$/i, '').length;
const plus = (s, delta, minDigits = 0) => { const r = Q.add(L.parseDecimal(s), delta); return decimalOf(r, Math.max(fracDigits(s), minDigits)); };
const E12 = Q.R(1n, 10n ** 12n);
const TRANSLATE = ['0.125', '-0.375'];

/* ---- the rows: the easota ledger's and the mc100 pool's, each with its object in literals and its bar ---- */
function rows(register, J) {
  const out = [];
  const E = J(EASOTA);
  for (const r of E.rows) {
    const [kind, name] = r.id.split('/');
    const rowId = 'ea-' + kind + '-' + name;
    const reg = register.rows.find((x) => x.id === rowId);
    if (!reg) throw new Error('shapes: no register row ' + rowId);
    const rel = r.file.replace(/^corpus\/easota\//, '');
    let data;
    if (kind === 'circles') data = { circles: litOf(MC.parseJsonExact(L.read(rel)).circles) };
    else if (kind === 'heilbronn') data = { points: litOf(MC.parseJsonExact(L.read(rel)).points) };
    else if (kind === 'mindist') data = { points: litOf(MC.parseJsonExact(L.read(rel)).vectors) };
    else if (kind === 'overlap') { const src = L.read(rel); const how = /haugland/.test(rel) ? 'haugland' : /alphaevolve/.test(rel) ? 'ae-half' : 'full';
      let h; if (how === 'haugland') { const half = L.pyLiteral(src, 'haugland_half'); h = half.concat(half.slice(0, -1).reverse()); } else if (how === 'ae-half') { const half = L.pyLiteral(src, 'ae_half'); h = half.slice(0, -1).concat(half.slice().reverse()); } else h = L.pyLiteral(src, 'h_values');
      data = { values: h.map(String), folded: how }; }
    else if (kind === 'edges') data = { weights: L.pyLiteral(L.read(rel), 'weights').map((row) => row.map(String)) };
    else if (kind === 'autocorr') data = { values: /\.py$/.test(rel) ? L.pyLiteral(L.read(rel), 'f_values').map(String) : litOf(MC.parseJsonExact(L.read(rel)).values) };
    else if (kind === 'flat') data = { coefficients: L.pyLiteral(L.read(rel), 'coefficients').map(String) };
    else if (kind === 'hexagons') { const j = MC.parseJsonExact(L.read(rel)); data = { hexagons: litOf(j.hexagons), outer: { center: litOf(j.outer_center), side: litOf(j.outer_side_length), angleDeg: litOf(j.outer_angle_deg) } }; }
    else throw new Error('shapes: unknown easota kind ' + kind);
    out.push({ rowId, record: EASOTA, entryId: r.id, verdict: reg.verdict, entry: { kind, source: 'easota', file: r.file, data, bar: { printed: r.printed || null, convention: r.printedConvention || null }, ledgerVerdict: r.verdict } });
  }
  const M = J(MC100);
  for (const r of M.rows) {
    if (r.sameClaimAs) continue;
    const rowId = 'mc100-' + r.id;
    const reg = register.rows.find((x) => x.id === rowId);
    if (!reg) throw new Error('shapes: no register row ' + rowId);
    const slug = r.id.replace(/^ea-best-/, '');
    const kind = SLUG_KIND[slug];
    if (!kind) throw new Error('shapes: no kind for ' + slug);
    const prob = PROBLEMS.find((p) => p.slug === slug);
    const B = MC.parseJsonExact(fs.readFileSync(path.join(ROOT, r.source), 'utf8'));
    const data = { [DATA_KEY[kind]]: litOf(B.data[DATA_KEY[kind]]) };
    out.push({ rowId, record: MC100, entryId: r.id, verdict: reg.verdict, entry: { kind, source: 'mc100', file: r.source, data, bar: { printed: B.score.lit, convention: 'platform', minImprovement: prob.minImprovement }, slug, prob: { slug: prob.slug, title: prob.title, minImprovement: prob.minImprovement }, mcRow: { id: r.id } } });
  }
  return out;
}

const claimOf = (e) => ({ kind: e.kind, source: e.source, bar: e.bar, data: e.data, ...(e.source === 'mc100' ? { slug: e.slug } : {}) });
const describe = (e) => e.kind + ' (' + e.source + ', ' + e.file.replace(/^corpus\//, '') + '), printed ' + (e.bar.printed === null ? 'nothing' : e.bar.printed + ' (' + e.bar.convention + (e.bar.minImprovement !== undefined ? ', minImprovement ' + e.bar.minImprovement : '') + ')');
const clone = (x) => JSON.parse(JSON.stringify(x));
const unitOf = (printed) => Q.R(1n, 10n ** BigInt(fracDigits(printed)));

/* where to aim the 10⁻¹² perturbation, per kind: the tightest constraint, found exactly in the same literals */
function perturb(e, c) {
  const k = e.kind, d = c.data;
  if (k === 'circles') {
    const C = d.circles.map((t) => t.map(L.parseDecimal));
    let worst = null;
    for (let i = 0; i < C.length; i++) for (let j = i + 1; j < C.length; j++) { const d2 = Q.add(Q.mul(Q.sub(C[i][0], C[j][0]), Q.sub(C[i][0], C[j][0])), Q.mul(Q.sub(C[i][1], C[j][1]), Q.sub(C[i][1], C[j][1]))); const s2 = Q.mul(Q.add(C[i][2], C[j][2]), Q.add(C[i][2], C[j][2])); const slack = Q.sub(d2, s2); if (!worst || Q.cmp(slack, worst.slack) < 0) worst = { i, j, slack }; }
    const { i, j } = worst; const dir = Q.sign(Q.sub(C[j][0], C[i][0])) >= 0 ? E12 : Q.neg(E12);
    d.circles[i][0] = plus(d.circles[i][0], dir, 12);
    return 'circle ' + i + ' moved ' + (Q.sign(dir) > 0 ? '+' : '−') + '10⁻¹² in x toward circle ' + j + ' (the pair with the least slack)';
  }
  if (k === 'heilbronn' || k === 'mindist') { d.points[0][0] = plus(d.points[0][0], E12, 12); return 'point 0 moved +10⁻¹² in x'; }
  if (k === 'overlap') { const i = d.values.findIndex((v) => Q.sign(L.parseDecimal(v)) > 0 && Q.cmp(L.parseDecimal(v), Q.ONE) < 0); const at = i < 0 ? 0 : i; d.values[at] = plus(d.values[at], E12, 12); return 'h[' + at + '] += 10⁻¹² (Σh = n/2 no longer holds)'; }
  if (k === 'autocorr') { const z = d.values.findIndex((v) => Q.sign(L.parseDecimal(v)) === 0); if (z >= 0) { d.values[z] = plus(d.values[z], Q.neg(E12), 12); return 'f[' + z + '] (a zero) moved to −10⁻¹²: f ≥ 0 no longer holds'; } d.values[0] = plus(d.values[0], E12, 12); return 'f[0] += 10⁻¹²'; }
  if (k === 'edges') { d.weights[0][0] = plus(d.weights[0][0], E12, 12); return 'weights[0][0] += 10⁻¹²'; }
  if (k === 'flat') { d.coefficients[0] = plus(d.coefficients[0], E12, 12); return 'coefficient 0 moved by +10⁻¹²: no longer ±1'; }
  if (k === 'kissing') { d.vectors[0][0] = plus(d.vectors[0][0], E12, 12); return 'vectors[0][0] += 10⁻¹²'; }
  return null;
}
function motion(e, c) {
  const k = e.kind, d = c.data;
  if (k === 'circles') { d.circles = d.circles.map(([x, y, r]) => [decimalOf(Q.neg(L.parseDecimal(x)), fracDigits(x)), y, r]); return 'every circle reflected in x (x → −x): the box and Σr are invariant'; }
  if (k === 'heilbronn' || k === 'mindist') { d.points = d.points.map(([x, y]) => [plus(x, L.parseDecimal(TRANSLATE[0]), 3), plus(y, L.parseDecimal(TRANSLATE[1]), 3)]); return 'every point translated by (' + TRANSLATE.join(', ') + ')'; }
  if (k === 'overlap') { d.values = d.values.slice().reverse(); return 'the step function reversed (the correlation maximum over lags is reversal-invariant)'; }
  if (k === 'autocorr') { d.values = d.values.slice().reverse(); return 'f reversed (the autoconvolution\'s maximum is reversal-invariant)'; }
  if (k === 'edges') { d.weights = d.weights.slice().reverse(); return 'the weight rows reversed (the curve is sorted by ρ)'; }
  if (k === 'flat') { d.coefficients = d.coefficients.slice().reverse(); return 'the coefficients reversed: the reciprocal polynomial has the same modulus on the circle'; }
  if (k === 'hexagons') { d.hexagons = d.hexagons.map(([x, y, a]) => [plus(x, L.parseDecimal(TRANSLATE[0]), 3), plus(y, L.parseDecimal(TRANSLATE[1]), 3), a]); d.outer = { ...d.outer, center: [plus(d.outer.center[0], L.parseDecimal(TRANSLATE[0]), 3), plus(d.outer.center[1], L.parseDecimal(TRANSLATE[1]), 3)] }; return 'every hexagon and the outer hexagon translated by (' + TRANSLATE.join(', ') + ')'; }
  if (k === 'kissing') { d.vectors = d.vectors.map((v) => v.map((_, i) => v[(i + 1) % v.length])); return 'the coordinates rotated by one (the penalty is invariant)'; }
  return null;
}
function malform(e, c) {
  const k = e.kind, d = c.data;
  if (k === 'circles') { d.circles[0] = d.circles[0].slice(0, 2); return 'circle 0 without its radius'; }
  if (k === 'heilbronn' || k === 'mindist') { d.points[0] = d.points[0].slice(0, 1); return 'point 0 with one coordinate'; }
  if (k === 'overlap' || k === 'autocorr') { d.values[0] = null; return 'value 0 missing (null)'; }
  if (k === 'edges') { d.weights[0] = d.weights[0].slice(0, 19); return 'row 0 with 19 weights'; }
  if (k === 'flat') { d.coefficients[0] = null; return 'coefficient 0 missing (null)'; }
  if (k === 'hexagons') { d.hexagons[0] = d.hexagons[0].slice(0, 2); return 'hexagon 0 without its angle'; }
  if (k === 'kissing') { d.vectors[0] = d.vectors[0].slice(0, -1); return 'vector 0 short by one coordinate'; }
  return null;
}

function mutants(e) {
  const base = claimOf(e), out = [];
  if (base.bar.printed === null) out.push({ class: 'printed-plus-one-unit', excluded: 'the row prints no value (the ledger certifies the exact value with no printed bar), so there is no printed digit to move' }, { class: 'printed-minus-one-unit', excluded: 'the row prints no value' });
  else {
    const u = unitOf(base.bar.printed);
    for (const [cls, sgn] of [['printed-plus-one-unit', 1], ['printed-minus-one-unit', -1]]) { const c = clone(base); c.bar = { ...c.bar, printed: plus(base.bar.printed, sgn > 0 ? u : Q.neg(u)) }; out.push({ class: cls, truth: 'FALSE', transformation: 'the printed ' + base.bar.printed + ' moved ' + (sgn > 0 ? '+' : '−') + ' one unit in its last digit → ' + c.bar.printed + ' (FALSE only when the witness finds the bar no longer agrees with the exact score under the ' + base.bar.convention + ' convention, else DISCARDED)', claim: c }); }
  }
  if (e.kind === 'hexagons') out.push({ class: 'coordinate-perturbed-1e-12', excluded: 'the hexagons\' constraints (separation, containment) are cosines and sines of printed angles; a standard-library witness of a violated constraint would need certified trigonometry, which it does not have' });
  else { const c = clone(base); const t = perturb(e, c); out.push({ class: 'coordinate-perturbed-1e-12', truth: 'FALSE', transformation: t + ' (FALSE only with a witness: a violated constraint or an exact score past the bar, else DISCARDED)', claim: c }); }
  { const c = clone(base); const t = motion(e, c); out.push({ class: 'rigid-motion', truth: 'TRUE', preservesOriginal: true, transformation: t + ' (preserves the original\'s status: a REPAIRED row is REPAIRED again)', claim: c }); }
  { const c = clone(base); const t = malform(e, c); out.push({ class: 'coordinate-missing', truth: 'MALFORMED', transformation: t, claim: c }); }
  return out;
}
/* the witness's red control: the bar moved far past the bytes (halved for flat, where only a bar too low is witnessable) */
function controls(e) {
  const base = claimOf(e);
  if (base.bar.printed === null) return [];
  const p = L.parseDecimal(base.bar.printed);
  const far = e.kind === 'flat' ? Q.div(p, Q.R(2n)) : Q.add(Q.mul(p, Q.R(2n)), Q.ONE);
  const c = clone(base); c.bar = { ...c.bar, printed: decimalOf(far, Math.max(fracDigits(base.bar.printed), 1)) };
  return [{ id: 'control-bar-far', claim: c }];
}

/* ---- the deciders, as the register's tools call them ---- */
const toQ = (x) => { if (x === null || x === undefined) throw new Error('a value is missing'); return L.parseDecimal(x); };
const toLit = (x) => (x === null ? null : Array.isArray(x) ? x.map(toLit) : { lit: String(x) });
/* the easota ledger's agree(): rounds-to or ceils-to the printed digits, or equals it */
const agree = (exact, printed, convention) => {
  if (convention === 'ceiling') { const d = fracDigits(printed); const p = L.parseDecimal(printed); const step = Q.R(1n, 10n ** BigInt(d)); return Q.cmp(exact, p) <= 0 && Q.cmp(exact, Q.sub(p, step)) > 0; }
  if (convention === 'exact') return Q.cmp(exact, L.parseDecimal(printed)) === 0;
  return L.printedIsRounding(exact, printed);
};
function decideEasota(claim) {
  const k = claim.kind, d = claim.data, bar = claim.bar;
  let word, exact = null, printedAgrees = null, why;
  if (k === 'circles') { const r = D.circles(d.circles.map((t) => { if (t.length !== 3) throw new Error('a circle without three numbers'); return t.map(toQ); })); word = r.witnessed ? 'WITNESSED' : r.repair ? 'REPAIRED' : 'UNWITNESSED'; exact = r.witnessed ? r.sumR : r.repair ? r.repair.sumR : null; why = 'Σr = ' + L.toFixed(r.sumR, 16) + ', ' + r.overlaps + ' overlapping pairs, box slack ' + L.toFixed(r.boxSlack, 16); }
  else if (k === 'heilbronn') { const r = D.heilbronn(d.points.map((t) => { if (t.length !== 2) throw new Error('a point without two coordinates'); return t.map(toQ); })); word = r.witnessed ? 'WITNESSED' : 'UNWITNESSED'; exact = r.score; why = 'min triangle / hull = ' + L.toFixed(r.score, 16); }
  else if (k === 'mindist') { const r = D.mindist(d.points.map((t) => { if (t.length !== 2) throw new Error('a point without two coordinates'); return t.map(toQ); })); word = r.witnessed ? 'WITNESSED' : 'UNWITNESSED'; exact = r.score; why = r.score ? '(max d / min d)² = ' + L.toFixed(r.score, 16) : 'two points coincide'; }
  else if (k === 'overlap') { const r = D.overlap(d.values.map(toQ)); word = r.witnessed ? 'WITNESSED' : r.repair ? 'REPAIRED' : 'UNWITNESSED'; exact = r.witnessed ? r.bound : r.repair ? r.repair.bound : null; why = 'bound ' + L.toFixed(r.bound, 16) + ', Σh − n/2 = ' + L.toFixed(r.sumSlack, 16) + ', in range ' + r.inRange; }
  else if (k === 'edges') { const r = D.edges(d.weights.map((row) => { if (row.length !== 20) throw new Error('a row without 20 weights'); return row.map(toQ); })); word = r.witnessed ? 'WITNESSED' : 'UNWITNESSED'; exact = r.score; why = 'score ' + L.toFixed(r.score, 16); }
  else if (k === 'autocorr') { const r = D.autocorr(d.values.map(toQ)); word = r.witnessed ? 'WITNESSED' : 'UNWITNESSED'; exact = r.C1 || null; why = r.witnessed ? 'C1 = ' + L.toFixed(r.C1, 16) : r.reason; }
  else if (k === 'flat') { const c = d.coefficients.map((x) => { if (x === null || !/^-?\d+$/.test(String(x))) throw new Error('a coefficient that is not an integer literal'); return BigInt(x); }); if (c.length !== 70) throw new Error('flat: ' + c.length + ' coefficients'); const r = D.flat(c); word = r.witnessed ? 'WITNESSED' : 'UNWITNESSED'; exact = r.witnessed ? r.Cplus : null; why = r.witnessed ? 'C⁺ ∈ [' + L.toFixed(r.Cplus[0], 16) + ', ' + L.toFixed(r.Cplus[1], 16) + ']' : r.reason; }
  else if (k === 'hexagons') { const data = { hexagons: d.hexagons.map((h) => { if (h.length !== 3) throw new Error('a hexagon without three numbers'); return h.map(toQ); }), outer: { center: d.outer.center.map(toQ), side: toQ(d.outer.side), angleDeg: toQ(d.outer.angleDeg) } }; const r = H.decide(data); word = r.verdict; exact = r.witnessed ? r.score : null; why = 'pairs ' + JSON.stringify(r.pairTally) + ', vertices ' + JSON.stringify(r.vertexTally); }
  else throw new Error('unknown kind ' + k);
  if (bar.printed !== null && exact !== null) printedAgrees = Array.isArray(exact) ? agree(exact[0], bar.printed, bar.convention) && agree(exact[1], bar.printed, bar.convention) : agree(exact, bar.printed, bar.convention);
  else if (bar.printed !== null) printedAgrees = false;
  /* the word composed as the ledger composes it (instruments/easota/word.js, one place since the fix of 2026-10-21) */
  word = WD.wordOf({ verdict: word, printed: bar.printed, printedAgrees });
  const rw = WD.registerWord(word);
  const register = rw ? rw.verdict : word;
  return { verdict: register, ledgerVerdict: word, printedAgrees, why: why + (bar.printed !== null ? '; printed ' + bar.printed + (printedAgrees ? ' agrees' : ' DOES NOT agree') + ' (' + bar.convention + ')' : '; nothing printed') };
}
function decideMc100(claim) {
  const prob = PROBLEMS.find((p) => p.slug === claim.slug);
  const B = { id: { lit: '0' }, score: { lit: claim.bar.printed }, data: { [DATA_KEY[claim.kind]]: toLit(claim.data[DATA_KEY[claim.kind]]) } };
  const mr = { id: 'ea-best-' + claim.slug };
  const res = claim.kind === 'kissing' ? MC.kissingRow(mr, B, prob) : MC.easotaRow(mr, B, prob);
  if (!res) throw new Error('the mc100 decider has no case for ' + claim.slug);
  return { verdict: res.verdict, kind: res.kind, why: String(res.scope).slice(0, 240) };
}
function decide(id, claim) {
  const t0 = process.hrtime.bigint();
  let r;
  try { r = claim.source === 'easota' ? decideEasota(claim) : decideMc100(claim); }
  catch (e) { r = { verdict: 'REFUSED', why: 'the decider threw: ' + String(e.message || e).slice(0, 200) }; }
  return { ...r, why: String(r.why).slice(0, 300), ms: Math.round(Number(process.hrtime.bigint() - t0) / 1e5) / 10 };
}

module.exports = {
  family: 'shapes',
  records: [EASOTA, MC100],
  decider: 'easota rows: instruments/easota/decide.js (hexagons.js) composed as tools/run-easota-ledger.js composes it — the decision from the bytes, printedAgrees from agree() under the row\'s convention, the word by instruments/easota/word.js (WITNESSED, MISPRINTED since the fix of 2026-10-21, REPAIRED, UNWITNESSED, UNDECIDED) and the register\'s word for it (CERTIFIED, REFUTED, REPAIRED; any other reported as the ledger says it); mc100 rows: tools/run-mc100-einstein.js easotaRow / kissingRow required as a module (the agreement rule, the platform\'s resolution, is theirs)',
  witness: 'instruments/selfaudit/witness_shapes.py',
  floatcheck: 'instruments/selfaudit/floatcheck_shapes.py',
  redControl: null,
  classes: { FALSE: ['printed-plus-one-unit', 'printed-minus-one-unit', 'coordinate-perturbed-1e-12'], TRUE: ['rigid-motion'], MALFORMED: ['coordinate-missing'] },
  rows, claimOf, mutants, controls, decide, describe
};
