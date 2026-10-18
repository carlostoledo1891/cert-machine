#!/usr/bin/env node
/* run-method-eval.js — the method evaluated as a decision procedure, not by its successes: certs/method-eval.json.

   A reviewer asked (2026-10-18) for a compact, controlled evaluation of the method itself — false acceptance on claims
   known to be false, correct refusal on malformed input, agreement with references, cost, where a conventional check
   fails, and how often the system refuses what a stronger method could decide. A checker that refuses everything
   never accepts a false claim, so the claims known to be TRUE are planted too, and a refusal of one is counted against
   the method. Ground truth is by construction, never by the decider being measured:

     kissing (instruments/kissing/kissing.js, E8 and D4 built from their definitions): a duplicated row, a doubled row
       (parallel), the sum of two contact vectors (at 30 degrees from each), the zero vector — each FALSE; an antipodal
       row added, the coordinates permuted, the configuration negated — each TRUE (the angle condition is invariant);
     entropy certificates (the registry's three, decided by tools/verify_sumdiff.py and tools/verify_twolaw.py): the
       claimed bound raised to the smallest 30-digit number above the ratio — FALSE; a weight moved by one unit — not a
       probability law, so it must be REFUSED; the whole law translated by an integer vector — TRUE (every linear form
       shifts, no entropy moves), so it must certify with the same ratio.

   Beside the planted claims it reads, never re-states, what other records measured: the kernel against Arb
   (certs/kernel-arb-audit.json), the conventional checks that failed on the same objects (certs/sumdiff-ledger.json's
   53-bit checker, certs/envs-record.json's tolerance graders), the refusals a stronger method could convert
   (certs/openai-math-kernel.json, certs/erratum-2026-10-09.json, the kernel audit's in-domain refusals), the red
   controls the control build runs (tools/build-control.js), and the cost of each exercise.

   usage: node tools/run-method-eval.js [--check]   (about a second; --check writes nothing)                                                      MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const K = require(path.join(ROOT, 'instruments', 'kissing', 'kissing.js'));
const OUT = path.join(ROOT, 'certs', 'method-eval.json');
const die = (m) => { console.error('METHOD EVAL REFUSED: ' + m); process.exit(1); };
const J = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const t0 = Date.now();
const rows = [];
const plant = (family, what, truth, run) => {
  let verdict; try { verdict = run(); } catch (e) { verdict = 'REFUSED'; }
  const correct = truth === 'TRUE' ? verdict === 'CERTIFIED' : truth === 'FALSE' ? verdict === 'REFUTED' : verdict === 'REFUSED';
  rows.push({ family, what, truth, verdict, correct });
};

/* ---- kissing: E8 and D4, planted claims ---------------------------------------------------------------------------- */
const toRows = (V) => V.map((v) => v.P.map((x) => Number(x)));
for (const [name, base] of [['E8', K.e8()], ['D4', K.d4()]]) {
  const R = toRows(base), n = R.length, dim = R[0].length;
  const cert = (rows2) => K.certify(K.fromIntegers(rows2)).verdict.replace('WITNESSED', 'CERTIFIED');
  const v0 = cert(R); if (v0 !== 'CERTIFIED') die(name + ' itself does not certify (' + v0 + ')');
  /* two rows at exactly 60 degrees: <x, y> = |x|^2 / 2 */
  const N0 = R[0].reduce((s, x) => s + x * x, 0);
  const j = R.findIndex((y, k) => k > 0 && R[0].reduce((s, x, i) => s + x * y[i], 0) * 2 === N0); if (j < 0) die(name + ': no contact pair found');
  plant('kissing', name + ': a row duplicated', 'FALSE', () => cert(R.concat([R[7]])));
  plant('kissing', name + ': a row doubled (parallel to itself)', 'FALSE', () => cert(R.slice(0, -1).concat([R[3].map((x) => 2 * x)])));
  plant('kissing', name + ': the sum of two contact vectors added (30 degrees from each)', 'FALSE', () => cert(R.concat([R[0].map((x, i) => x + R[j][i])])));
  plant('kissing', name + ': the zero vector added', 'FALSE', () => cert(R.concat([new Array(dim).fill(0)])));
  plant('kissing', name + ': the configuration negated', 'TRUE', () => cert(R.map((r) => r.map((x) => -x))));
  const perm = Array.from({ length: dim }, (_, i) => (i * 3 + 1) % dim);
  if (new Set(perm).size !== dim) die('the permutation is not one');
  plant('kissing', name + ': the coordinates permuted', 'TRUE', () => cert(R.map((r) => perm.map((p) => r[p]))));
  plant('kissing', name + ': rows of different dimension', 'MALFORMED', () => cert(R.slice(0, 5).concat([R[5].slice(0, dim - 1)])));
}

/* ---- the entropy certificates, through the standard-library deciders ------------------------------------------- */
const PY = `
import json, sys, os
sys.path.insert(0, os.path.join(sys.argv[1], 'tools'))
from decimal import Context, Decimal, setcontext
from fractions import Fraction
import verify_sumdiff as V, verify_twolaw as W
out = []
def single(path, label):
    prob, mu = V.read(path)
    r = V.ratio(prob, mu)
    c30 = Context(prec=30, rounding='ROUND_FLOOR'); above = c30.next_plus(c30.plus(r[1]))
    out.append(['entropy', label + ': the bound claimed just above the ratio', 'FALSE', V.decide(r, str(above))])
    shifted = {(x + 7, y - 3): w for (x, y), w in mu.items()}
    out.append(['entropy', label + ': the law translated by (7, -3)', 'TRUE', V.decide(V.ratio(prob, shifted), str(V.DOWN.subtract(r[0], Decimal('1e-40'))))])
    bent = dict(mu); k = next(iter(bent)); bent[k] = bent[k] + Fraction(1, 10 ** 60)
    try:
        if sum(bent.values()) != 1: raise ValueError('REFUSED: the weights are not a probability law')
        out.append(['entropy', label + ': a weight moved by 10^-60', 'MALFORMED', V.decide(V.ratio(prob, bent), '0')])
    except ValueError:
        out.append(['entropy', label + ': a weight moved by 10^-60', 'MALFORMED', 'REFUSED'])
setcontext(Context(prec=1, traps=[]))
root = os.path.join(sys.argv[1], 'corpus', 'optimization-constants')
single(os.path.join(root, 'mi2026', 'c3b_pr92', 'certificate_3b_13pt.json'), 'C3b, 13 points')
single(os.path.join(root, 'l2026', 'certificate_3c_147pt.json'), 'C3c, 147 points')
cert = json.load(open(W.CERT))
r = W.decide(cert)['ratio']
c30 = Context(prec=30, rounding='ROUND_FLOOR'); above = c30.next_plus(c30.plus(r[1]))
out.append(['entropy', 'C3c, two laws: the bound claimed just above the ratio', 'FALSE', V.decide(r, str(above))])
sh = dict(cert, laws=[dict(L, points=[[x + 5, y + 2] for x, y in L['points']]) for L in cert['laws']])
out.append(['entropy', 'C3c, two laws: both laws translated by (5, 2)', 'TRUE', V.decide(W.decide(sh)['ratio'], '1.674894211307116')])
try:
    W.decide(dict(cert, base=53)); out.append(['entropy', 'C3c, two laws: base 53, the digit map not injective', 'MALFORMED', 'CERTIFIED'])
except ValueError:
    out.append(['entropy', 'C3c, two laws: base 53, the digit map not injective', 'MALFORMED', 'REFUSED'])
print(json.dumps(out))
`;
const py = cp.spawnSync('python3', ['-I', '-c', PY, ROOT], { encoding: 'utf8' });
if (py.status !== 0) die('the entropy plantings failed: ' + py.stderr.slice(-600));
for (const [family, what, truth, verdict] of JSON.parse(py.stdout)) {
  const correct = truth === 'TRUE' ? verdict === 'CERTIFIED' : truth === 'FALSE' ? verdict === 'REFUTED' : verdict === 'REFUSED';
  rows.push({ family, what, truth, verdict, correct });
}

/* ---- what the other records measured ------------------------------------------------------------------------- */
const ARB = J('certs/kernel-arb-audit.json');
if (ARB.counts.violations !== 0 || !Object.values(ARB.redControls).every((r) => r.violationsCaught > 0)) die('the kernel audit is not clean with its red controls caught');
const SD = J('certs/sumdiff-ledger.json'), ENV = J('certs/envs-record.json');
const okFalse = SD.observed.runs.filter((r) => r.printed === 'OK' && /REFUTED/.test(r.truth)).length;
const gAbs = ENV.graders.find((g) => /^absolute/.test(g.name)), gRel = ENV.graders.find((g) => /^relative/.test(g.name)), gEnc = ENV.graders.find((g) => /^enclosure/.test(g.name));
const OK = J('certs/openai-math-kernel.json').counts.words, ERR = J('certs/erratum-2026-10-09.json');
/* the cosine family's straddles: enclosures that neither clear nor miss the bar, REFUSED since the erratum (were "rejects") */
const CH = J('ledger.json').families.find((f) => f.name === 'chowla-cosine');
const chBefore = ERR.before.families.find((f) => f.name === 'chowla-cosine');
if (!CH || !chBefore || CH.counts.refused !== chBefore.counts.rejects) die('the cosine family\'s refusals are not the erratum\'s former rejects');
const straddles = CH.counts.refused;
const src = fs.readFileSync(path.join(ROOT, 'tools', 'build-control.js'), 'utf8');
const reds = [...src.matchAll(/·\s*(\d+)\s+red controls?/g)].map((m) => Number(m[1]));
const KW = J('certs/kissing-wave.json').rows.filter((r) => r.claimant === 'qiushi');

const tally = (f) => { const x = rows.filter(f); return { planted: x.length, correct: x.filter((r) => r.correct).length }; };
const rec = {
  what: 'The method evaluated as a decision procedure: planted claims whose truth is known by construction, decided by the system\'s own deciders, beside what the other records measured. Written by tools/run-method-eval.js.',
  generated: new Date().toISOString(),
  planted: {
    rows,
    falseClaims: tally((r) => r.truth === 'FALSE'), falseAccepted: rows.filter((r) => r.truth === 'FALSE' && r.verdict === 'CERTIFIED').length,
    trueClaims: tally((r) => r.truth === 'TRUE'), trueRejected: rows.filter((r) => r.truth === 'TRUE' && r.verdict !== 'CERTIFIED').length,
    malformed: tally((r) => r.truth === 'MALFORMED'), malformedDecided: rows.filter((r) => r.truth === 'MALFORMED' && r.verdict !== 'REFUSED').length,
  },
  reference: { kernelVsArb: { cases: ARB.counts.cases, contained: ARB.counts.contained, violations: ARB.counts.violations, operations: Object.keys(ARB.byOp).length, malformed: ARB.counts.malformed, malformedRefused: ARB.counts.malformedRefused, inDomainRefused: ARB.counts.refused, redControls: ARB.redControls } },
  conventional: {
    checker53bit: { printedOkOnFalse: okFalse, of: SD.observed.runs.length },
    toleranceGraders: { wrongSubmissions: ENV.provablyWrong, absoluteAccepts: gAbs.falseAccept, relativeAccepts: gRel.falseAccept, enclosureAccepts: gEnc.falseAccept },
    kissingRelease: { pairwiseCheckedByClaimant: false, pairsDecidedHere: KW.reduce((s, r) => s + r.engine.pairs, 0) }
  },
  incompleteness: { openaiChallengesRefusedForResources: OK.REFUSED || 0, openaiChallenges: OK.CERTIFIED + (OK.REFUSED || 0) + (OK.REJECTED || 0),
    cosineStraddles: straddles, kernelInDomainRefusals: ARB.counts.refused },
  redControls: { batteriesWithACount: reds.length, total: reds.reduce((a, b) => a + b, 0) },
  seconds: Math.round((Date.now() - t0) / 100) / 10
};
const P = rec.planted;
if (P.falseAccepted || P.trueRejected || P.malformedDecided) die('a planted claim was decided wrongly: ' + JSON.stringify(rows.filter((r) => !r.correct)));
if (!process.argv.includes('--check')) fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');   /* --check: decide, write nothing */
console.log('method eval: ' + rows.length + ' planted claims — false ' + P.falseClaims.correct + '/' + P.falseClaims.planted + ' refuted, true ' + P.trueClaims.correct + '/' + P.trueClaims.planted + ' certified, malformed ' + P.malformed.correct + '/' + P.malformed.planted + ' refused; kernel vs Arb ' + ARB.counts.cases + ' cases, 0 violations; red controls ' + rec.redControls.total + ' across ' + reds.length + ' batteries; straddles ' + straddles + ' (' + rec.seconds + ' s)');
