/* laneaudit — the six independent re-verifications of AI-claimed theorems.

   THE ONE MODULE that knows how to run these verifiers and what their output
   means. The report builder is a consumer; anything else that wants these
   numbers is a consumer too. A rule defined twice will diverge, so the lane
   list, the parsers and the pass condition live here and only here.

   The verifiers themselves are LIFTED BYTES (LIFT.json, legacy/) and are never
   edited from this repo — which is exactly why their output is PARSED rather
   than transcribed: if a lifted verifier changes what it prints or what it
   proves, the number on the page changes with it or the build refuses.

   Each verifier was written against the manuscript, not against the author's
   code, and each carries mutation controls: deliberate corruptions of the
   claim that the verifier MUST reject. A verifier that cannot fail its own
   controls is not evidence, so a control that stops firing refuses the build.

   usage:  node instruments/laneaudit/audit.js        (prints the board)
           require('.../audit.js').run()              (structured records) */
'use strict';

const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const LANE_DIR = path.join(ROOT, 'legacy', 'research', 'challenges', 'lane');

/* ---------------------------------------------------------------- lanes --
   `checked` and `notChecked` are the load-bearing fields on the page: the
   second one is the product. Every entry states the boundary the verifier
   actually reached, in the words of its own VERDICT, never softened. */
const LANES = [
  {
    id: 'maxwell',
    dir: 'laneb-maxwell',
    short: 'Maxwell\'s point-charge bound',
    problem: 'Maxwell conjectured that n point charges produce at most (n−1)² critical points of their potential.',
    claim: 'Five positive point charges in ℝ³ whose potential has at least 24 nondegenerate critical points — exceeding the conjectured bound of 16.',
    system: 'OpenAI GPT-5.6 Sol (idea); written up by Arathoon, Ball and Kvalheim',
    sourceCheck: 'Three-author verification; Mathematica and Maple checks — floating point, no code artifact, no certificate, and no concrete ε.',
    verdict: 'CONFIRMED',
    scope: 'at ε = 1/6 only',
    checked: 'At the fixed rational ε = 1/6 with qε = 859/248832 exactly, 24 pairwise-disjoint boxes, each certifying existence and local uniqueness of a critical point by the Krawczyk operator and nondegeneracy by an interval Hessian determinant that excludes zero. 24 > 16 is then exact integer arithmetic.',
    notChecked: 'The theorem’s asymptotic statement — "for all sufficiently small ε" — and every proof in the paper. One ε is certified, not a range.',
    moves: { from: 16, to: 24, unit: 'critical points', fromLab: 'Maxwell’s bound (5−1)²', toLab: 'certified here' }
  },
  {
    id: 'korenblum',
    dir: 'laneb-korenblum',
    short: 'The Korenblum constant',
    problem: 'The Korenblum constant c₂ had a best published lower bound of 0.3554.',
    claim: 'c₂ ≥ 0.4263, via a moment-duality criterion and an explicit rational eight-atom measure (arXiv:2607.17748).',
    system: 'OpenAI Codex (GPT-5.6 Sol), disclosed in the paper; author proof by Frank Wikström',
    sourceCheck: 'An Arb interval certificate shipped with the paper, plus a Zenodo archive.',
    verdict: 'CONFIRMED',
    scope: 'the numerical criterion',
    checked: 'Every inequality of the paper’s moment-duality criterion for its explicit measure, under our own outward-rounded interval arithmetic — no Arb, no python-flint, and no code from the Zenodo archive executed. The A-family over k = 1..2183, the B-family over k = 1..1299, both tails by exact induction.',
    notChecked: 'The duality argument itself — the paper’s Lemma 3.1 and Wang’s Proposition 2.1. The bound follows from what we certified only if that argument holds.',
    moves: { from: 0.3554, to: 0.4263, unit: 'lower bound on c₂', fromLab: 'previous published bound', toLab: 'claimed, and certified here' }
  },
  {
    id: 'lemniscate',
    dir: 'laneb-lemniscate',
    short: 'Erdős Problem #1038',
    problem: 'Among monic polynomials with all roots in [−1,1], what is the infimum of the measure of the set where |f| < 1? Open since Erdős–Herzog–Piranian, 1958.',
    claim: 'The infimum is exactly D = 1.834430475762661711090753635125…, in a July 2026 manuscript of Darvas, Peng and Tao.',
    system: 'GPT-5.5 Pro (initial main argument in a solver–verifier framework, then revised by the human authors)',
    sourceCheck: 'Author-checked manuscript shipping its own three Arb certificates and two SymPy verifiers; the official Erdős-problems record was still open.',
    verdict: 'CONFIRMED',
    scope: 'the computational fragment',
    checked: 'The extremal triple exists, is unique inside a certified box, lies in the admissible region, and every printed decimal of the extremal constants is correct — including all 30 claimed decimals of D.',
    notChecked: 'The proof that this triple is extremal. We certified the number the manuscript names; we did not certify that no polynomial does better.',
    moves: null
  },
  {
    id: 'ranteng',
    dir: 'laneb-ranteng',
    short: 'Ran–Teng Conjecture 20',
    problem: 'The exact nonreal spectral region for a family of structured matrices — a conjecture in matrix analysis.',
    claim: 'Resolved, in a preprint. Source status: "Human-checked mathematical proof; no formal proof assistant artifact located" (24 Feb 2026).',
    system: 'GPT-5.2 Thinking',
    sourceCheck: 'Human-checked prose. No artifact of any kind was located.',
    verdict: 'PARTIAL',
    scope: 'machine-checkable fragment only',
    checked: 'Every load-bearing polynomial identity of the proof, exactly over ℚ. Both boundary-attainment families re-proved exactly, including an exact re-proof that every nonreal eigenvalue of the A_L family lies ON the conjectured curve. Certified eigenvalue enclosures over 272 exact matrices found zero counterexamples to the necessity conditions, and attainment is Krawczyk-certified at 10 interior points.',
    notChecked: 'The analytic core — the argument parametrization, the convexity/Jensen/Karamata optimization that makes necessity hold for ALL parameters, and the branch bookkeeping. It is prose. This is why the verdict is PARTIAL and not CONFIRMED.',
    moves: null
  },
  {
    id: 'mathieu',
    dir: 'laneb-mathieu',
    short: 'The Mathieu property for Lie groups',
    problem: 'For which compact connected Lie groups G is the kernel of Haar integration on R(G) a Mathieu–Zhao space?',
    claim: 'Exactly the tori — a classification.',
    system: 'not recorded at source',
    sourceCheck: 'An author SymPy script, which we read but did not execute.',
    verdict: 'CONFIRMED',
    scope: 'supporting identities only',
    checked: 'Every supporting identity the classification rests on, exactly over ℚ with BigInt rational Laurent arithmetic: the weighted witness moments, the explicit abelian pair and its printed four-term expansion, the matrix-entry representatives and their invariance. Disclosure specific to this lane: the author’s Python was READ to cross-check which identities the TeX intended — its blocks match the manuscript and are the ones re-verified here — but it was never executed, and no value on this page came from it.',
    notChecked: 'The classification theorem itself. Confirming the identities a proof uses is not confirming the proof, and this lane is the clearest case of that distinction in the set.',
    moves: null
  },
  {
    id: 'poisson',
    dir: 'laneb-poisson',
    short: 'The rank-two Poisson conjecture',
    problem: 'A conjecture about rank-two Poisson structures.',
    claim: 'An explicit counterexample: polynomials R, T, D, S in ℚ[x,q,p,z] with prescribed bracket relations.',
    system: 'not recorded at source',
    sourceCheck: 'The author’s own scripts, which we neither derived from nor executed.',
    verdict: 'CONFIRMED',
    scope: 'the explicit counterexample',
    checked: 'All six bracket relations ({D,R} = 1, {S,T} = 1 and the four vanishing ones) hold identically and exactly; the 4×4 symbolic Jacobian determinant is identically 1; and the three claimed points each map exactly to their stated image. A counterexample is an existence claim, so certifying the exhibit IS certifying the claim — the only lane in this set where that is true.',
    notChecked: 'The author’s surrounding prose beyond the extracted definitions. Nothing load-bearing: the counterexample stands or falls on the exhibit, and the exhibit holds.',
    moves: null
  }
];

/* -------------------------------------------------------------- parsing --
   Output formats differ between verifiers because they were written months
   apart against different manuscripts. Rather than normalise them by editing
   lifted bytes, each lane declares how to read its own report.

   `total` wins when a verifier states its own count; otherwise PASS lines are
   counted, split at `mutAt` so a mutation control is never scored as a check.
   A lane that yields neither is reported as null and the page says so —
   inventing a count for a verifier that does not print one is exactly the
   kind of number this repository exists not to publish. */
const PARSE = {
  maxwell: { total: /(\d+) checks, (\d+) failures/, mutAt: /^\[\d+\] Mutation controls/m, ms: /Wall time ([\d.]+) s/ },
  korenblum: { mutAt: /^\[\d+\] Mutation controls/m, ms: /Total wall time: ([\d.]+) s/ },
  lemniscate: { total: /checks: (\d+) passed, (\d+) failed/, mutTotal: /(\d+) mutation controls rejected/, ms: /rejected;\s+([\d.]+) s/ },
  ranteng: { total: /(\d+) checks, (\d+) failures/, mutAt: /^\[\d+\] Mutation controls/m, msMs: /Total wall time: (\d+) ms/ },
  mathieu: { total: /checks: (\d+), failures: (\d+)/, mutTotal: /mutation controls rejected: (\d+)\//, ms: /runtime: ([\d.]+)s/ },
  poisson: { mutTotal: null, mutLines: /^Mutation control \d+ .*rejected.*OK$/gm, ms: /Elapsed: ([\d.]+)s/ }
};

const countPass = (s) => (s.match(/^\s*(?:PASS|OK)\b/gm) || []).length;

function parse(lane, out) {
  const P = PARSE[lane.id];
  let checks = null, failures = 0, mutations = 0;

  if (P.total) {
    const m = P.total.exec(out);
    if (!m) throw new Error(lane.id + ': the verifier stopped printing its own check total');
    checks = Number(m[1]); failures = Number(m[2]);
  }

  if (P.mutTotal) {
    const m = P.mutTotal.exec(out);
    if (!m) throw new Error(lane.id + ': the verifier stopped printing its mutation-control total');
    mutations = Number(m[1]);
  } else if (P.mutLines) {
    mutations = (out.match(P.mutLines) || []).length;
  } else if (P.mutAt) {
    const at = P.mutAt.exec(out);
    if (!at) throw new Error(lane.id + ': the mutation-control section is gone from the output');
    mutations = countPass(out.slice(at.index));
    if (checks === null) checks = countPass(out.slice(0, at.index));
  }

  let ms = null;
  if (P.ms) { const m = P.ms.exec(out); if (m) ms = Math.round(Number(m[1]) * 1000); }
  if (P.msMs) { const m = P.msMs.exec(out); if (m) ms = Number(m[1]); }

  return { checks, failures, mutations, ms };
}

/* ------------------------------------------------------------------ run --
   Green means: exit 0, no failing check, at least one mutation control
   rejected, and no refusal word anywhere in the output. */
function run() {
  return LANES.map(lane => {
    const cwd = path.join(LANE_DIR, lane.dir);
    const r = cp.spawnSync('node', ['verify.js'], { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    const out = String(r.stdout || '') + String(r.stderr || '');
    if (r.status !== 0) throw new Error(lane.id + ': verifier exited ' + r.status + '\n' + out.slice(-800));
    if (/\bREFUTED\b|FAILED TO REJECT|^\s*FAIL\b/m.test(out)) throw new Error(lane.id + ': the verifier reported a failure\n' + out.slice(-800));

    const p = parse(lane, out);
    if (p.failures !== 0) throw new Error(lane.id + ': ' + p.failures + ' failing checks');
    if (p.mutations < 1) throw new Error(lane.id + ': no mutation control fired — a verifier that cannot fail is not evidence');

    return Object.assign({}, lane, p, { out });
  });
}

module.exports = { run, LANES };

if (require.main === module) {
  const rows = run();
  const n = (v) => v === null ? '—' : String(v);
  console.log('laneaudit — six independent re-verifications of AI-claimed theorems\n');
  for (const r of rows) {
    console.log('  ' + r.id.padEnd(11) + r.verdict.padEnd(10)
      + ('checks ' + n(r.checks)).padEnd(13)
      + ('mutations ' + r.mutations).padEnd(15)
      + (r.ms === null ? '' : r.ms + ' ms'));
  }
  const tc = rows.filter(r => r.checks !== null).reduce((a, b) => a + b.checks, 0);
  const tm = rows.reduce((a, b) => a + b.mutations, 0);
  const tms = rows.reduce((a, b) => a + (b.ms || 0), 0);
  console.log('\n  ' + tc + ' checks across ' + rows.filter(r => r.checks !== null).length + ' of ' + rows.length
    + ' verifiers, ' + tm + ' mutation controls all rejected, ' + (tms / 1000).toFixed(1) + ' s total');
}
