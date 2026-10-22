/* build.js — the easy read: one scrolling page that explains the method paper the way a good science channel would —
   big pictures, a few things to touch, every number real.

     site/explained/index.html     the page, from apps/explained/page.html with {{KEYS}} filled from the records

   EVERY NUMBER ON THE PAGE IS READ HERE, AT BUILD TIME, from the same gated sources the papers read: the method paper's
   macro file (tools/build-paper-numbers.js, refuse-on-drift from the records), the register's, the Riemann companion's
   (tools/paper-numbers/riemann-finite-layer.js, a third implementation held to claimbox's certificates), the self-audit's
   mutation record, the kissing wave's record and the kissing ledger. The page's interactive pieces compute in the browser
   in exact rational arithmetic over BigInt; the window widget's matrix is computed here, exactly, from the definitions
   (the same chain the companion's generator re-derives) and embedded as rationals. A missing or shapeless number refuses
   the build. Nothing on the page is typed.

   usage: node apps/explained/build.js          (make site runs it; make page R=apps/explained for the edit loop)
   apps/explained · cert-machine                                                                                      MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const APP = __dirname;
const ROOT = path.join(APP, '..', '..');
const SITE = path.join(ROOT, 'site', 'explained');
const die = (m) => { console.error('explained build REFUSED: ' + m); process.exit(1); };
const need = (c, m) => { if (!c) die(m); };
const git = (() => { try { return cp.execSync('git rev-parse --short=12 HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const J = (rel) => { need(fs.existsSync(path.join(ROOT, rel)), 'missing ' + rel); return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')); };
const T = (rel) => { need(fs.existsSync(path.join(ROOT, rel)), 'missing ' + rel); return fs.readFileSync(path.join(ROOT, rel), 'utf8'); };

/* ---- the macro files: \newcommand{\Name}{value}, brace-balanced; "{,}" is a thousands separator ---- */
function macros(rel) {
  const s = T(rel); const out = {}; const re = /\\newcommand\{\\([A-Za-z]+)\}\{/g; let m;
  while ((m = re.exec(s))) {
    let i = re.lastIndex, depth = 1, v = '';
    while (i < s.length && depth) { const c = s[i]; if (c === '{') depth++; else if (c === '}') depth--; if (depth) v += c; i++; }
    out[m[1]] = v.replace(/\{,\}/g, ',');
  }
  return out;
}
const MT = macros('paper/tex/cert-machine-method-numbers.tex');
const REG = macros('paper/tex/register-numbers.tex');
const RF = macros('paper/tex/riemann-finite-layer-numbers.tex');
const QK = macros('paper/tex/qiushi-kissing-numbers.tex');
const get = (M, k) => { need(k in M, 'macro ' + k + ' is not in its file'); return M[k]; };
const intOf = (s) => { const n = Number(String(s).replace(/,/g, '')); need(Number.isFinite(n), 'not a number: ' + s); return n; };
const fmtInt = (n) => Math.round(n).toLocaleString('en-US');
const sci = (tex) => { /* "8.85\cdot10^{-7" -> {m:'8.85', e:-7} */ const m = String(tex).match(/^([\d.]+)\\cdot10\^\{?(-?\d+)/); need(m, 'not a sci macro: ' + tex); return { m: m[1], e: Number(m[2]) }; };
const sciHtml = (tex) => { const s = sci(tex); return '<span class="sci">' + s.m + '&thinsp;×&thinsp;10<sup>' + s.e + '</sup></span>'; };

/* ---- the numbers ---- */
const V = {};
V.GIT = git; V.DATE = new Date().toISOString().slice(0, 10);
/* the register */
V.REG_ROWS = get(REG, 'RegRows'); V.REG_HOLDS = get(REG, 'RegHolds'); V.REG_DEFECTS = get(REG, 'RegDefects'); V.REG_CLAIMANTS = get(REG, 'RegClaimants'); V.REG_SOURCES = get(REG, 'RegSources');
need(intOf(V.REG_HOLDS) + intOf(V.REG_DEFECTS) <= intOf(V.REG_ROWS), 'the register counts do not add up');
/* the self-audit: the mutation record itself for the counts and the float table */
const SA = J('certs/selfaudit-mutations.json'); const A = SA.all; need(A && A.mutants && A.float, 'the self-audit record lost its totals');
V.SA_OBJECTS = get(MT, 'MtSaMutObjects'); V.SA_ROWS = String(A.rows); V.SA_MUTANTS = String(A.mutants);
need(String(A.mutants) === get(MT, 'MtSaMutants'), 'the self-audit mutant count differs between the record and the paper');
V.SA_FALSE = String(A.byTruth.FALSE); V.SA_TRUE = String(A.byTruth.TRUE); V.SA_MALFORMED = String(A.byTruth.MALFORMED);
V.SA_FALSE_CERT = String(A.falseCertifications); V.SA_FALSE_REF = String(A.falseRefutations); V.SA_REFUSALS_ON_FALSE = String(A.refusalsOnFalse);
V.SA_MALFORMED_NOT_REFUSED = String(A.malformedNotRefused); V.SA_ROWS_WITNESSED = String(SA.killSwitch.rowsWithWitnessedFalse); V.SA_KILL_HALF = String(SA.killSwitch.half);
need(A.falseCertifications === 0 && A.falseRefutations === 0 && SA.killSwitch.tripped === false, 'the self-audit is not the one the paper reports');
const F = (tau) => { const f = A.float[tau]; need(f, 'no float row at ' + tau); return f; };
V.FL = {}; for (const tau of ['1e-6', '1e-9', '1e-12']) { const f = F(tau); V.FL[tau] = { falsePct: (100 * f.witnessedFalseAccepted / f.witnessedFalse).toFixed(1), falseN: f.witnessedFalseAccepted, falseOf: f.witnessedFalse, orig: f.originalsAccepted, origOf: f.originals, trueN: f.trueAccepted, trueOf: f.trueMutants }; }
need(V.FL['1e-6'].falsePct === '27.8' && V.FL['1e-9'].falsePct === '11.2' && V.FL['1e-12'].falsePct === '2.4', 'the float-check rates moved from the ones the paper prints');
/* the kissing wave */
const W = J('certs/kissing-wave.json'); const kw = W.rows.filter((r) => r.claimant === 'qiushi');
need(kw.length === 19 && kw.every((r) => r.verdict === 'WITNESSED' && r.engine.violations === 0), 'the nineteen Qiushi rows are not all WITNESSED');
V.KW_ROWS = String(kw.length); V.KW_PAIRS = fmtInt(kw.reduce((s, r) => s + r.engine.pairs, 0)); V.KW_CONTACTS = fmtInt(kw.reduce((s, r) => s + r.engine.contacts, 0));
V.KW_PAIRS_SCI = get(MT, 'MtKwPairsSci').replace(/\\times/, '×').replace(/\^\{(-?\d+)\}/, '<sup>$1</sup>').replace(/\s+/g, '&thinsp;'); V.KW_GPU_ROWS = get(MT, 'MtKwGpuRows'); V.KW_GPU_HOURS = get(MT, 'MtKwGpuHours'); V.KW_GPU_COST = get(MT, 'MtKwGpuCost'); V.KW_GPU_NAME = get(MT, 'MtKwGpuName'); V.KW_GPU_PRICE = get(MT, 'MtKwGpuPrice');
V.KW_GPU_MAXNORM = get(MT, 'MtKwGpuMaxNorm'); V.KW_DESK_MAXNORM = get(MT, 'MtKwDeskMaxNorm'); V.KW_AXIS_NORM = get(MT, 'MtKwAxisNormSci').replace(/\\times/, '×').replace(/\^\{(-?\d+)\}/, '<sup>$1</sup>'); V.KW_GPU_MAXCOORD = get(QK, 'QkGpuMaxCoord');
V.KW_GPU_PAIRS_EACH = get(MT, 'MtKwGpuPairsEachSci').replace(/\\times/, '×').replace(/\^\{(-?\d+)\}/, '<sup>$1</sup>'); V.KW_MAXDIM = get(MT, 'MtKwMaxDim'); V.KW_DIMS = get(MT, 'MtKwDims').replace(/--/g, '–');
/* the 605 record: two readings of one byte string */
const KL = J('certs/kissing-ledger.json'); const r605 = (KL.openRungs || []).find((r) => r.slug === 'kissing-number-d11-605'); need(r605 && r605.measured, 'the 605 rung is not in the kissing ledger');
V.SIX_N = String(r605.measured.n); V.SIX_PAIRS = fmtInt(r605.measured.pairs); V.SIX_VIOL_DIGITS = fmtInt(r605.measured.violations); V.SIX_WORST_DEG = Number(r605.measured.worstAngleDeg).toFixed(2);
const README = T('corpus/claimbox-riemann/README.md'); const m605 = README.match(/\((9,510) against (9,480) violating pairs on the 605 record\)/); need(m605 && m605[1] === V.SIX_VIOL_DIGITS, 'the translator\'s README no longer states the two readings of the 605 record');
V.SIX_VIOL_DOUBLES = m605[2];
/* the Riemann layer */
for (const k of ['RfSentences', 'RfShaped', 'RfRefused', 'RfRefProse', 'RfRefNoQuantity', 'RfRefAmbiguous', 'RfRefAsymptotic', 'RfRefApproximate', 'RfBandRows', 'RfEdgeBar', 'RfLeanP', 'RfNewP', 'RfLeanD', 'RfNewD', 'RfQuarticP', 'RfMtAgreeDigits', 'RfPlants', 'RfControls', 'RfKPow', 'RfCueUpper', 'RfCueLower', 'RfMathClaims', 'RfMathCertified', 'RfMathRefuted', 'RfOTwentyKFifteenP', 'RfMtSixteen', 'RfZetaDegSix', 'RfPZeroExact', 'RfEdgeExact']) V[k] = get(RF, k);
need(intOf(V.RfRefProse) + intOf(V.RfRefNoQuantity) + intOf(V.RfRefAmbiguous) + intOf(V.RfRefAsymptotic) + intOf(V.RfRefApproximate) === intOf(V.RfRefused) && intOf(V.RfShaped) + intOf(V.RfRefused) === intOf(V.RfSentences), 'the refusal tally does not sum');
V.RF_QUARTIC_GAP = sciHtml(get(RF, 'RfQuarticGapTex')); V.RF_EPS9 = sciHtml(get(RF, 'RfEpsNineTex')); V.RF_EPS15 = sciHtml(get(RF, 'RfEpsFifteenTex')); V.RF_GAIN = sciHtml(get(RF, 'RfGainTex')); V.RF_CEILING_GAP = sciHtml(get(RF, 'RfCeilingGapTex'));
/* the kernel audit */
V.ARB_CASES = get(MT, 'MtArbCases'); V.ARB_OPS = get(MT, 'MtArbOps');
/* the C31 replay, for one line */
const C31 = J('certs/lueker-replay.json'); need(C31.rows.length === 2 && C31.rows.every((r) => r.verdict === 'CERTIFIED'), 'the C31 record is not two CERTIFIED rows');
V.C31_STATES = fmtInt(C31.rows.find((r) => r.h === 10).states); V.C31_BOUND = C31.rows.find((r) => r.h === 10).boundUp; V.C31_PRINTED = C31.rows.find((r) => r.h === 10).printed;
const c10 = C31.rows.find((r) => r.h === 10); V.C31_LAMBDA = c10.lambdaCertUp; V.C31_TABLE_SHA = c10.files.table.slice(0, 12); V.C31_TABLE_SHA_BAD = c10.files.table.slice(0, 11) + (c10.files.table[11] === 'f' ? '0' : 'f');
V.KW_MAXPOINTS = get(MT, 'MtKwMaxPoints');

/* ---- the window widget's matrix: degree-4 even windows, D₁ at fifteen terms, exactly ---- */
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; };
class Q { constructor(n, d = 1n) { n = BigInt(n); d = BigInt(d); if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; this.n = n / g; this.d = d / g; }
  add(o) { return new Q(this.n * o.d + o.n * this.d, this.d * o.d); } sub(o) { return new Q(this.n * o.d - o.n * this.d, this.d * o.d); } mul(o) { return new Q(this.n * o.n, this.d * o.d); } div(o) { return new Q(this.n * o.d, this.d * o.n); }
  toString() { return this.n + '/' + this.d; } }
const fact = (n) => { let r = 1n; for (let i = 2n; i <= n; i++) r *= i; return r; };
const binom = (n, k) => { let r = 1n; for (let i = 1n; i <= BigInt(k); i++) r = r * (BigInt(n) - i + 1n) / i; return r; };
const aK = (k) => new Q(2n * 4n ** (BigInt(k) + 1n) * fact(BigInt(k)), fact(2n * BigInt(k) + 2n));
const epsK = (K) => { const qq = BigInt((K + 2) * (2 * K + 3)); return aK(K).mul(new Q(qq, qq - 2n * BigInt(K + 1))); };
const padd = (p, e, v) => { p[e] = (p[e] || new Q(0n)).add(v); };
const convPair = (i, j) => { const out = {}; const half = new Q(1n, 2n);
  for (let a = 0; a <= 2 * j; a++) { const c = new Q(binom(2 * j, a)); const n = 2 * i + a + 1;
    for (let e = 0; e <= n; e++) { let v = new Q(binom(n, e)); for (let t = 0; t < n - e; t++) v = v.mul(half); if (e % 2) v = new Q(-v.n, v.d); padd(out, e + 2 * j - a, c.mul(v).div(new Q(BigInt(n)))); }
    let v0 = new Q(1n); for (let t = 0; t < n; t++) v0 = v0.mul(half); if (n % 2) v0 = new Q(-v0.n, v0.d); padd(out, 2 * j - a, new Q(-1n).mul(c).mul(v0).div(new Q(BigInt(n)))); }
  return out; };
const pmul = (p, q2) => { const r = {}; for (const a in p) for (const b in q2) padd(r, Number(a) + Number(b), p[a].mul(q2[b])); return r; };
const integ01 = (p) => { let s = new Q(0n); for (const e in p) s = s.add(p[e].div(new Q(BigInt(Number(e) + 1)))); return s; };
const d1 = (K) => { const p = { 1: new Q(1n), 2: new Q(-4n) }; for (let k = 0; k < K; k++) padd(p, 2 * k + 3, aK(k)); return p; };
const intEven = (i) => new Q(1n, 4n ** BigInt(i) * BigInt(2 * i + 1));
function quadForm(m, K) { const D = d1(K); const b = [], M = [];
  for (let i = 0; i < m; i++) { b.push(intEven(i)); M.push([]); for (let j = 0; j < m; j++) { const H = integ01(pmul(D, convPair(i, j))).mul(new Q(2n)); const Hji = integ01(pmul(D, convPair(j, i))).mul(new Q(2n)); M[i].push(intEven(i + j).add(H.add(Hji).div(new Q(2n)))); } }
  return { M, b }; }
function solveQ(M, b) { const n = b.length; const A = M.map((row, i) => row.concat([b[i]]));
  for (let col = 0; col < n; col++) { let piv = col; while (A[piv][col].n === 0n) piv++; [A[col], A[piv]] = [A[piv], A[col]]; const pv = A[col][col]; A[col] = A[col].map((x) => x.div(pv));
    for (let r = 0; r < n; r++) if (r !== col && A[r][col].n !== 0n) { const f = A[r][col]; A[r] = A[r].map((x, k) => x.sub(f.mul(A[col][k]))); } }
  return A.map((row) => row[n]); }
const K15 = 15; const { M, b } = quadForm(3, K15); const x = solveQ(M, b); let bx = new Q(0n); for (let i = 0; i < 3; i++) bx = bx.add(b[i].mul(x[i]));
const kstar = new Q(1n).div(bx); const cstar = x.map((xi) => xi.div(x[0])); const eps15 = epsK(K15);
const decOf = (q, k) => { const neg = q.n < 0n; const a = neg ? -q.n : q.n; const s = 10n ** BigInt(k); const t = ((a * s) / q.d).toString().padStart(k + 1, '0'); return (neg ? '-' : '') + t.slice(0, -k) + '.' + t.slice(-k); };
const pOf = (c) => { let num = new Q(0n), den = new Q(0n); for (let i = 0; i < 3; i++) { den = den.add(b[i].mul(c[i])); for (let j = 0; j < 3; j++) num = num.add(c[i].mul(c[j]).mul(M[i][j])); } return new Q(2n).sub(num.div(den.mul(den))).sub(eps15); };
const Pstar4 = new Q(2n).sub(kstar).sub(eps15); const quartic = [new Q(1n), new Q(-7n, 25n), new Q(-102n, 25n)]; const Pq = pOf(quartic);
need(decOf(Pstar4, 9) === '0.868641400' && decOf(Pq, 8) === '0.86864051' && decOf(pOf(cstar), 12) === decOf(Pstar4, 12), 'the degree-4 window matrix at fifteen terms does not reproduce the companion\'s numbers');
V.WIN = JSON.stringify({ M: M.map((r) => r.map(String)), b: b.map(String), eps: String(eps15), cstar: cstar.map(String), pstar: String(Pstar4), pquartic: String(Pq) });
V.WIN_PSTAR4 = decOf(Pstar4, 10); V.WIN_PQUARTIC15 = decOf(Pq, 10); V.WIN_CSTAR2 = decOf(cstar[1], 4); V.WIN_CSTAR4 = decOf(cstar[2], 4);

/* ---- fill the template ---- */
let html = T('apps/explained/page.html');
const flat = {}; for (const k in V) if (typeof V[k] === 'string') flat[k] = V[k];
for (const tau of ['1e-6', '1e-9', '1e-12']) for (const f in V.FL[tau]) flat['FL_' + tau.replace('1e-', 'E') + '_' + f] = String(V.FL[tau][f]);
html = html.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (all, k) => { need(k in flat, 'the page asks for {{' + k + '}}, which the build did not compute'); return flat[k]; });
need(!/\{\{/.test(html), 'an unfilled placeholder remains');
fs.mkdirSync(SITE, { recursive: true });
fs.writeFileSync(path.join(SITE, 'index.html'), html);
console.log('site/explained/index.html written (' + Math.round(html.length / 1024) + ' KB; ' + Object.keys(flat).length + ' numbers from the records) @ git ' + git);
