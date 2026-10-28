/* apps/explained/records.js — THE ONE READER of the records behind the story pages (/explained/ and its siblings).
   Every number a story page displays comes from here: the macro files of the papers, the self-audit's mutation record, the
   kissing wave's record and ledger, the Chvátal–Sankoff replay, the translator's pinned README. A number that is missing or
   shapeless refuses the build; the counts are cross-checked. Two pages reading the same record through two readers would
   diverge (the corpus.js lesson), so both builders require this file.                                               MIT */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const die = (m) => { console.error('page build REFUSED: ' + m); process.exit(1); };
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
V.KW_GPU_MAXNORM = get(MT, 'MtKwGpuMaxNorm'); V.KW_DESK_MAXNORM = get(MT, 'MtKwDeskMaxNorm'); V.KW_AXIS_NORM = get(MT, 'MtKwAxisNormSci').replace(/\s*\\times\s*/, '&thinsp;×&thinsp;').replace(/\^\{(-?\d+)\}/, '<sup>$1</sup>'); V.KW_GPU_MAXCOORD = get(QK, 'QkGpuMaxCoord');
V.KW_GPU_PAIRS_EACH = get(MT, 'MtKwGpuPairsEachSci').replace(/\s*\\times\s*/, '&thinsp;×&thinsp;').replace(/\^\{(-?\d+)\}/, '<sup>$1</sup>'); V.KW_MAXDIM = get(MT, 'MtKwMaxDim'); V.KW_DIMS = get(MT, 'MtKwDims').replace(/--/g, '–');
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
/* the cold open's stage: six claims from the records fly through the box and come out with their word; each verdict is pinned to its record */
need(kw.some((r) => r.dim === Number(V.KW_MAXDIM) && fmtInt(r.claimed) === V.KW_MAXPOINTS), 'the largest kissing row is not the dimension-' + V.KW_MAXDIM + ' row at ' + V.KW_MAXPOINTS);
need(r605.measured.violations > 0, 'the 605 rung is not refuted');
const AI = get(RF, 'RfAiRows');
need(/\\mbox\{we checked that \}\|D\(1\)\| \\le  0\.82395317\$ & [^&]*& \\vF\{\} \(prose\)/.test(AI), 'the prose-prefixed |D(1)| claim is not REFUSED (prose) in the companion\'s AI rows');
need(/\$\|D\(1\)\| < 0\.82395316\$ & [^&]*& \\vR/.test(AI), 'the cut-short |D(1)| claim is not REFUTED in the companion\'s AI rows');
need(/\|256\\cdot S\(j\) - j\| \\le  3\\cdot 10\^\{-40\}[^&]*&[^&]*&[^&]*& \\vC/.test(get(RF, 'RfRunRows')), 'the band-rows claim is not CERTIFIED in the companion\'s run rows');
need(get(RF, 'RfEdgeBar') === '0.82395317' && get(RF, 'RfTauTex') === '3\\cdot10^{-40}', 'the companion\'s edge bar or tolerance changed; the stage chips quote them');
V.RF_D1_SHORT = '0.82395316'; V.RF_TAU_PLAIN = '3·10⁻⁴⁰';

/* ---- the cold open's dates and plain-text forms ---- */
V.KW_REQUEST_DATE = get(MT, 'MtKwRequestDate'); V.KW_POINTS_DATE1 = get(MT, 'MtKwPointsDates').split(' ')[0]; V.KW_FROM_RELEASES = get(MT, 'MtKwFromReleases');
need(/^\d{4}-\d{2}-\d{2}$/.test(V.KW_REQUEST_DATE) && /^\d{4}-\d{2}-\d{2}$/.test(V.KW_POINTS_DATE1), 'the kissing request and points dates are not dates');
const C31P = J('corpus/optconst-queue/c31-2026-10-21/PINS.json'); need(C31P.pr && /^\d{4}-\d{2}-\d{2}T/.test(C31P.pr.mergedAt), 'the C31 pin has no merge date'); V.C31_MERGED = C31P.pr.mergedAt.slice(0, 10);
V.RF_FETCHED = get(RF, 'RfPinsFetched'); need(/^\d{4}-\d{2}-\d{2}$/.test(V.RF_FETCHED), 'the Riemann fetch date');
const pairsTotal = kw.reduce((s, r) => s + r.engine.pairs, 0); V.KW_PAIRS_BIG = String(pairsTotal); V.KW_PAIRS_PER_FRAME = String(Math.floor(pairsTotal / 100));
const sciPlain = get(MT, 'MtKwPairsSci').match(/^([\d.]+)\s*\\times\s*10\^\{(\d+)\}$/); need(sciPlain, 'the pairs macro is not m×10^e'); V.KW_PAIRS_SCI_PLAIN = sciPlain[1] + '·10' + sciPlain[2].replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
V.KW_DESK_MAXNORM_PLAIN = V.KW_DESK_MAXNORM.replace(/,/g, ''); need(/^\d+$/.test(V.KW_DESK_MAXNORM_PLAIN), 'the laptop norm is not an integer');

/* ---- WARRANT v2.1 site pass, 2026-10-28: every count a story page used to type, read here instead ---- */
const NUMWORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const numword = (n) => { need(Number.isInteger(n) && n >= 0 && n < NUMWORD.length, 'no word for ' + n); return NUMWORD[n]; };
/* the register: 132 rows, ONE of them QUEUED — "of 132 decided" was false on three pages; holds + defects = decided, and
   the macro file is held to the live ledger so a stale macro cannot reach a page */
V.REG_DECIDED = get(REG, 'RegDecided');
need(intOf(V.REG_HOLDS) + intOf(V.REG_DEFECTS) === intOf(V.REG_DECIDED), 'the register\'s holds and defects do not sum to its decided rows');
{ const CL = J('certs/claims-ledger.json'); need(CL.decided === intOf(V.REG_DECIDED) && CL.count === intOf(V.REG_ROWS), 'paper/tex/register-numbers.tex is behind certs/claims-ledger.json (' + V.REG_DECIDED + '/' + V.REG_ROWS + ' against ' + CL.decided + '/' + CL.count + ') — rebuild the paper numbers'); }
/* the self-audit's own defects ("two, both fixed on the record") and the malformed mutant read silently ("one") */
V.SA_FIXES_WORD = numword(SA.fixes.length); V.SA_MALFORMED_NOT_REFUSED_WORD = numword(A.malformedNotRefused);
need(SA.fixes.length >= 1 && A.malformedNotRefused >= 1, 'the self-audit no longer records the defects and the silent read the pages describe');
/* the Riemann layer's finite claims, as a word ("the ten sentences a machine can check") */
V.RF_SHAPED_WORD = numword(intOf(V.RfShaped));
/* the wave as a number word: 9.75·10¹⁵ is NEARLY ten quadrillion, never "ten quadrillion" */
need(pairsTotal >= 9e15 && pairsTotal < 1e16, 'the wave is no longer between nine and ten quadrillion pairs; the words "nearly ten quadrillion" are false');
V.KW_PAIRS_WORDS = 'nearly ten quadrillion';
/* the ruler's marks, from the wave (they were typed: 192n, 395n·10³³ and "dimensions 49–55"). The dimension-38 axis rows'
   squared norm is 394,674,026,743,945,636,732,262,714,818,942,096 exactly; the page printed 395 followed by 33 zeros as if exact */
{ const gpu = kw.filter((r) => (r.engine.families || []).some((f) => /tensor cores/.test(f.path || '')));
  need(gpu.length === intOf(V.KW_GPU_ROWS), 'the GPU rows of the wave are not the ' + V.KW_GPU_ROWS + ' the paper counts');
  const dims = gpu.map((r) => r.dim).sort((a, b) => a - b); need(dims[dims.length - 1] - dims[0] === dims.length - 1, 'the GPU dimensions are not one run');
  V.KW_GPU_DIMS = dims[0] + '–' + dims[dims.length - 1]; V.KW_GPU_MAXNORM_PLAIN = String(Math.max(...gpu.map((r) => Number(r.engine.norm[0]))));
  need(V.KW_GPU_MAXNORM_PLAIN === V.KW_GPU_MAXNORM, 'the GPU rows\' largest squared norm differs between the wave and the paper');
  const d38 = kw.find((r) => r.dim === 38); const ax = d38 && /\/\s*(\d{30,})/.exec(d38.engine.normShow || ''); need(ax, 'the dimension-38 axis norm is not in the wave record');
  V.KW_AXIS_NORM_EXACT = ax[1]; const lead = Number(ax[1].slice(0, 4)) / 1000; need(lead.toFixed(2) + '\\times10^{' + (ax[1].length - 1) + '}' === get(MT, 'MtKwAxisNormSci').replace(/\s+/g, ''), 'the paper\'s axis norm is not the wave\'s, rounded');
  V.KW_DESK_ROWS = get(MT, 'MtKwDeskRows'); need(intOf(V.KW_DESK_ROWS) + gpu.length === kw.length, 'the laptop and GPU rows do not make the wave'); }
/* the method paper's version, from the papers index (the easy read's credits typed v0.8 while the paper was at v0.9) */
{ const PI = J('paper/INDEX.json'); const p = PI.papers.find((x) => x.name === 'cert-machine-method'); need(p && /\bv\d+\.\d+/.test(String(p.status)), 'paper/INDEX.json has no version for the method paper');
  V.PAPER_VERSION = /\bv\d+\.\d+/.exec(String(p.status))[0]; }

/* ---- the placeholders: {{KEY}} in a page's parts, filled from the numbers; a key the build did not compute refuses ---- */
const flatten = () => { const flat = {}; for (const k in V) if (typeof V[k] === 'string') flat[k] = V[k];
  for (const tau of ['1e-6', '1e-9', '1e-12']) for (const f in V.FL[tau]) flat['FL_' + tau.replace('1e-', 'E') + '_' + f] = String(V.FL[tau][f]);
  return flat; };   /* read at fill time: a builder adds its own numbers to V before it fills */
const fill = (txt, what) => { const flat = flatten(); const out = txt.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (all, k) => { need(k in flat, what + ' asks for {{' + k + '}}, which the build did not compute'); return flat[k]; }); need(!/\{\{[A-Za-z0-9_]+\}\}/.test(out), 'an unfilled placeholder survived in ' + what); return out; };
module.exports = { ROOT, V, flatten, fill, need, die, git, J, T, macros, get, intOf, fmtInt, sci, sciHtml, numword, MT, REG, RF, QK };
