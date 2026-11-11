#!/usr/bin/env node
/* record-prime-gaps-186.js — an outside check of OpenAI's conditional Lean proof that liminf (p_{n+1} − p_n) ≤ 186
   (GPT-6 Astra; openai/PrimeGaps186), read back from the facts in corpus/prime-gaps-186/. Writes
   certs/prime-gaps-186.json; `--check` re-derives it from the same facts and refuses on any difference.

   THE MATHEMATICS IS NOT OURS: the bound, its proof, the Lean development and the numerical certificate are OpenAI's.
   The Lean proof is conditional on three axioms it declares. Nothing here proves an axiom, and nothing here verifies
   the bound 186: this record says what an outside party re-ran, with what, and what stays open.

   Facts (copied byte for byte from the working repository of the check; PROVENANCE.json pins each by sha256, and this
   tool refuses a copy that moved):
     records/a2, records/b2            the two exact deciders' lines for the two finite-field axioms, p < 2,000
     records/compare-2000.json         their comparison and the planted wrong axioms; static.json, readings-compare.json
     records/b/runs                    the Lean proof on a rented machine: the status file and the checkers' logs
     intake/                           the six statement-layer records (tools/lean-intake.js)
     records/c1                        OpenAI's certificate replayed: the status, the receipt, our comparison
     work/c2 … work/c4                 the clean-room programs' results: the caps, the 149 rows, the margin
     records/c3/crosscheck-c1-*.txt    each clean-room value against the interval the replayed certificate prints
     records/…/VERDICT*.md, PREREG-*   the records and the rules as written, gaps first

   usage: node tools/record-prime-gaps-186.js [--check]                                                              MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'certs', 'prime-gaps-186.json');
const CORP = path.join(ROOT, 'corpus', 'prime-gaps-186');
const die = (m) => { console.error('record-prime-gaps-186: ' + m); process.exit(1); };
const need = (c, m) => { if (!c) die(m); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const rd = (rel) => { const p = path.join(CORP, rel); if (!fs.existsSync(p)) die('missing fact ' + rel); return fs.readFileSync(p, 'utf8'); };
const js = (rel) => JSON.parse(rd(rel));
const lines = (rel) => rd(rel).split('\n').filter(Boolean);

/* 0 · the copies are the bytes the provenance file names */
const PROV = js('PROVENANCE.json');
for (const f of PROV.files) {
  const p = path.join(ROOT, f.path);
  need(fs.existsSync(p), 'a copied fact is gone: ' + f.path);
  need(sha(fs.readFileSync(p)) === f.sha256, 'a copied fact no longer has the bytes PROVENANCE.json names: ' + f.path);
}

const UNDECIDED = 'The bound liminf (p_{n+1} − p_n) ≤ 186, its proof, the Lean development and the numerical certificate are OpenAI’s (GPT-6 Astra; openai/PrimeGaps186, 30 August 2026). '
  + 'The Lean proof is conditional on three axioms it declares. This record does not verify the bound 186 and proves none of the three axioms.';
const GAPS = [
  { id: 'conditional', b: 'This does not verify the bound 186.', text: 'The Lean proof shows: if three assumptions hold, then 186. Nothing here proves the assumptions.' },
  { id: 'finite', b: 'Two assumptions are theorems quoted from the literature.', text: 'A bound on a rank-three Kloosterman sum, after Deligne and Katz, and a correlation bound of Fouvry, Kowalski and Michel. In Lean they are assumed for every prime. Every instance was decided for the primes below 2,000, and nothing above.' },
  { id: 'majorant', b: 'The third assumption is about integrals; every program computes estimates.', text: 'It asserts 149 upper bounds for integrals and three more bounds. OpenAI’s certificate, and the recomputation here, evaluate upper estimates of the 149 integrals. That each integral is at most its estimate is argued in OpenAI’s note and re-derived by hand in four AI sessions here; it is not in Lean. Its base is: OpenAI’s Lean proves that the underlying law is a probability measure with the expected density. The chain from each integral to its estimate is what is missing.' },
  { id: 'reading', b: 'One reading choice.', text: 'For 61 of the 149 rows the note picks an ingredient by a test whose outcome it does not print. The reading was fixed before anything was compared; under the other reading two rows would exceed their printed bound. The values match OpenAI’s own intervals under the reading taken.' },
  { id: 'sessions', b: 'The recomputation and its review were done by AI sessions.', text: 'Under one person’s direction, with the rules sealed first. No human referee has read the hand derivations.' },
  { id: 'tools', b: 'Two defects of our own statement-checking tool surfaced on the way.', text: 'An absent checker was counted as a kernel that did not accept, and two generated files did not build under the release’s linter option. Both were fixed in public before the records they touched were derived; neither changed a prediction.' }
];

/* 1 · the two finite-field axioms: both deciders' lines, every prime below 2,000 */
const DA = lines('records/a2/results.jsonl').map((l) => JSON.parse(l)), DB = lines('records/b2/results-2000.jsonl').map((l) => JSON.parse(l));
const cmp = js('records/compare-2000.json'), rdg = js('records/readings-compare.json'), stat = js('records/static.json');
function axiom(n, boundSq) {
  const a = DA.filter((r) => r.axiom === n), b = DB.filter((r) => r.axiom === n);
  need(a.length === b.length && a.every((r, i) => r.p === b[i].p), 'the two deciders do not list the same primes for axiom ' + n);
  const tot = (rows) => rows.reduce((s, r) => ({ instances: s.instances + r.instances, holds: s.holds + r.holds, fails: s.fails + r.fails, undecided: s.undecided + r.undecided }), { instances: 0, holds: 0, fails: 0, undecided: 0 });
  const ta = tot(a), tb = tot(b);
  need(JSON.stringify(ta) === JSON.stringify(tb), 'the two deciders’ totals differ for axiom ' + n);
  need(a.every((r, i) => r.instances === b[i].instances && r.holds === b[i].holds && r.fails === 0 && b[i].fails === 0 && r.undecided === 0 && b[i].undecided === 0), 'a line of axiom ' + n + ' does not hold in both deciders');
  /* the decision is on the square, exactly: the upper end of each prime's largest squared value is below the squared bound */
  need(a.every((r) => BigInt(r.max_hi) < BigInt(boundSq) * 10n ** 12n) && b.every((r) => BigInt(r.max_hi) < BigInt(boundSq) * 10n ** 12n), 'a prime’s maximum reaches the bound of axiom ' + n);
  need(a.every((r, i) => BigInt(r.max_lo) <= BigInt(b[i].max_hi) && BigInt(b[i].max_lo) <= BigInt(r.max_hi)), 'two enclosures of one maximum do not meet (axiom ' + n + ')');
  /* square roots are for display only */
  const per = a.map((r) => [r.p, Math.round(Math.sqrt(Number(r.max_hi) / 1e12) * 1e4) / 1e4]);
  const top = per.reduce((m, x) => (x[1] > m[1] ? x : m), per[0]);
  return { primes: a.length, largestPrime: a[a.length - 1].p, instances: ta.instances, holdInBoth: ta.holds, fails: 0, undecided: 0, bound: Math.sqrt(boundSq), closest: { p: top[0], value: top[1] }, perPrimeDisplayOnly: per };
}
const A1 = axiom(1, 9), A2 = axiom(2, 64);
need(cmp.A1.verdict === 'CERTIFIED' && cmp.A2.verdict === 'CERTIFIED' && cmp.agreement_problems.length === 0, 'the comparison record no longer certifies both axioms on the instances');
need(cmp.A1.totals_a_b.instances[0] === A1.instances && cmp.A2.totals_a_b.instances[0] === A2.instances && cmp.primes_registered === A1.primes, 'the comparison record and the deciders’ lines disagree on the counts');
need(cmp.display.max_abs_Kl3.largest_at_p === A1.closest.p && cmp.display.max_ratio_to_p_sqrt_p.largest_at_p === A2.closest.p, 'the closest approach is not where the comparison record puts it');
const planted = ['R1_axiom1_without_the_1_over_p', 'R2_axiom2_with_8_sqrt_p', 'R3_axiom1_constant_2', 'R4_axiom2_constant_4'].map((k) => ({ id: k.slice(0, 2), planted: cmp[k].planted, refutedAt: cmp[k].refuted_at }));
need(planted.every((r) => Number.isInteger(r.refutedAt)), 'a planted wrong axiom is no longer refuted');
need(rdg.fkm.verdict === 'MATCH' && rdg.katz.verdict === 'MATCH', 'a Lean axiom no longer matches the blind reading of its cited theorem');
need(stat.A5_verdict === 'MATCH' && stat.A4_printed.verdict === 'MATCH' && stat.A5_iv_count.lean_total === 152, 'the printed numbers no longer agree across the release');
const finite = { primesBelow: 2000, axiom1: A1, axiom2: A2, planted, readings: { katz: rdg.katz.verdict, fkm: rdg.fkm.verdict }, printedNumbers: { verdict: stat.A5_verdict, coefficients: stat.A5_i_coefficients.cells_compared, tableCells: Object.values(stat.A5_ii_tables).reduce((s, t) => s + t.cells_compared, 0), bounds: stat.A5_iv_count.lean } };

/* 2 · the Lean proof */
const ST = {};
for (const l of lines('records/b/runs/_status.txt')) {
  const m = l.match(/^(\S+) end (\S+) exit (\d+) wall (\d+)s maxRSS\(time -v\) (\d+) KB/);
  if (m) ST[m[2]] = { at: m[1], exit: Number(m[3]), seconds: Number(m[4]), peakKB: Number(m[5]) };
}
const step = (k) => { need(ST[k], 'the status file has no line for ' + k); return ST[k]; };
const bl = (f) => rd('records/b/runs/' + f);
need(step('b1-build').exit === 0 && /Build completed successfully \((\d+) jobs\)/.test(bl('b1-build.log')) && !/warning/i.test(bl('b1-build.log')), 'the build as shipped is not clean');
const compLog = bl('b2-comparator.log');
need(step('b2-comparator').exit === 0 && /nanoda kernel accepts the solution/.test(compLog) && /Lean default kernel accepts the solution/.test(compLog) && /Your solution is okay!/.test(compLog), 'Comparator’s run is not the result the claimant reports');
const ctl = (k, decl) => {
  const m = bl(k + '.log').match(/Challenge and solution theorem statement do not match: '([^']+)'/);
  need(step(k).exit !== 0 && m && m[1] === decl, 'Comparator did not reject the altered statement file ' + k);
  return { exit: step(k).exit, rejects: m[1] };
};
const audit = js('records/b/runs/b3-audit.json');
const SIX = ['Classical.choice', 'PrimeGap186.kloosterman2_correlation_bound', 'PrimeGap186.kloosterman3_bound', 'PrimeGap186.physical_integral_bounds', 'Quot.sound', 'propext'];
need(audit.verdict === 'PASS' && audit.targets.length === 3 && audit.targets.every((t) => t.verdict === 'PASS' && JSON.stringify([...t.axiomsOurs].sort()) === JSON.stringify(SIX) && t.forbiddenFound.length === 0), 'the axiom audit no longer finds exactly the three standard and the three declared axioms');
const nan = bl('b5-nanoda.log').match(/Checked (\d+) declarations with no typechecker errors/), l4l = bl('b5-lean4lean.log').match(/checked (\d+) declarations/);
need(step('b5-nanoda').exit === 0 && nan && step('b5-lean4lean').exit === 0 && l4l, 'nanoda or lean4lean no longer accepts');
need(step('b4-leanchecker').exit === 0 && step('b4-fresh').exit === 0 && /--fresh/.test(bl('b4-fresh.log')), 'leanchecker no longer accepts');
const declines = (k, re) => { need(step(k).exit !== 0 && re.test(bl(k + '.log')), k + ' no longer declines for the declared axioms'); return 'declines: a proof that declares axioms is not supported'; };
const anchors = (bl('b7-anchors-w0.log').match(/depends on axioms: \[propext, Classical\.choice, Quot\.sound\]/g) || []).length;
need(step('b7-anchors-w0').exit === 0 && anchors === 9, 'the Lean anchors are not the nine theorems on the standard axioms');
const IDS = ['dhl', 'tuple', 'liminf', 'ax1', 'ax2', 'tuple-x'];
const IN = IDS.map((id) => ({ id, r: js('intake/lean-intake-pg186-' + id + '.json') }));
need(IN.every((x) => x.r.verdict === 'CERTIFIED' && x.r.words.F1 === 'CERTIFIED' && x.r.conditionalOn && x.r.kernels.every((k) => k.word === 'ACCEPTS')), 'a statement-layer record is no longer CERTIFIED with every kernel accepting');
const MUT = IN.flatMap((x) => x.r.mutants.map((mu) => ({ of: x.id, id: mu.id, kind: mu.kind, why: mu.why, outcome: mu.outcome })));
const REDS = IN.flatMap((x) => x.r.reds.map((re) => ({ of: x.id, id: re.id, why: re.why, caught: re.caught, how: re.how })));
const reworded = MUT.filter((mu) => mu.kind === 'same'), altered = MUT.filter((mu) => mu.kind !== 'same');
need(reworded.every((mu) => mu.outcome === 'ACCEPTED') && altered.every((mu) => mu.outcome !== 'ACCEPTED') && REDS.every((re) => re.caught), 'a planted statement or defect did not come out as required');
const pin = IN[0].r.pins.canonical;
const lean = {
  build: { exit: 0, seconds: step('b1-build').seconds, peakGB: Math.round(step('b1-build').peakKB / 1e5) / 10, warnings: 0 },
  comparator: { exit: 0, seconds: step('b2-comparator').seconds, says: 'the three theorems and the three axioms match the statement file; nanoda and Lean’s kernel accept' },
  comparatorControls: [Object.assign({ id: 'K1', planted: '186 made 185 in the statement file' }, ctl('b2-K1', 'PrimeGap186.primeGapLiminf_le_186')), Object.assign({ id: 'K2', planted: 'the constant 3 made 2 in the first axiom' }, ctl('b2-K2', 'PrimeGap186.kloosterman3_bound'))],
  audit: { verdict: audit.verdict, axioms: SIX, theorems: audit.targets.map((t) => ({ name: t.target, closureConstants: t.closureConstants, closureModules: t.closureModules })) },
  kernels: [
    { name: 'Lean (the build)', word: 'accepts' },
    { name: 'leanchecker', word: 'accepts', seconds: step('b4-leanchecker').seconds },
    { name: 'leanchecker --fresh', word: 'accepts', seconds: step('b4-fresh').seconds, note: 'every import replayed from an empty environment' },
    { name: 'nanoda', word: 'accepts', declarations: Number(nan[1]), seconds: step('b5-nanoda').seconds },
    { name: 'lean4lean', word: 'accepts', declarations: Number(l4l[1]), seconds: step('b5-lean4lean').seconds },
    { name: 'con-ron', word: declines('b5-con-ron', /declined: non-standard axiom/) },
    { name: 'con-leche', word: declines('b5-con-leche', /non-standard axiom/) }
  ],
  statementLayer: { declarations: IDS.length, verdict: 'CERTIFIED', conditionalOn: IN[0].r.conditionalOn.axioms, planted: MUT, rewordingsAccepted: reworded.length, rewordings: reworded.length, alterationsAccepted: altered.filter((mu) => mu.outcome === 'ACCEPTED').length, alterations: altered.length,
    alterationsRefusedByMismatch: altered.filter((mu) => /type mismatch/.test(mu.outcome)).length, alterationsNotElaborating: altered.filter((mu) => /FAILED/.test(mu.outcome)).length, defects: REDS, defectsCaught: REDS.filter((re) => re.caught).length },
  anchors: { theorems: anchors, at: 'p = 2 and 3', axioms: 'the three standard ones' }
};

/* 3 · OpenAI's certificate, replayed */
const c1s = rd('records/c1/runs/_status.txt'), c1 = js('records/c1/compare.json');
need(/c1a fixed: c0a exit 0; repro: correct: True/.test(c1s) && /c1a stock: c0a exit 1; repro: correct: False/.test(c1s), 'the stock and corrected stacks no longer differ as recorded');
need(step('b8-c0a-0.9.0').exit === 1 && step('b8-c0a-0.8.0').exit === 1, 'the startup check no longer stops on both released versions');
need(/end c1b exit 0/.test(c1s) && c1.receipt.passed === true && c1.word === 'REPRODUCED' && c1.all152.equal === 152 && c1.all152.of === 152, 'the replayed certificate is no longer REPRODUCED 152 of 152');
const wall = rd('records/c1/runs/c1b.time').match(/Elapsed \(wall clock\) time \(h:mm:ss or m:ss\): (\d+):(\d+):(\d+)/);
const frac = (s) => { const [n, d] = s.split('/').map(BigInt); return Number(n * 10n ** 16n / d) / 1e16; };
const certificate = {
  onReleasedLibrary: 'stops at its own startup check (python-flint 0.9.0 with FLINT 3.6.0, and 0.8.0)',
  fix: { where: 'flintlib/flint#2790', by: 'Fredrik Johansson', url: 'https://github.com/flintlib/flint/pull/2790', note: 'a commit of 10 August 2026, merged the next day; on FLINT’s main branch and in no release; OpenAI’s numerics note cites it' },
  run: { exit: 0, minutes: Number(wall[1]) * 60 + Number(wall[2]) + (Number(wall[3]) >= 30 ? 1 : 0), status: c1.receipt.status, passed: c1.receipt.passed },
  word: c1.word, integersEqual: c1.all152.equal, integers: c1.all152.of, totalLoss: c1.receipt.source_total_relative_units, margin: frac(c1.receipt.final_margin_lower), marginExact: c1.receipt.final_margin_lower, required: c1.receipt.required_margin
};
need(wall && certificate.totalLoss === 696075110, 'the receipt’s total is not the published one');

/* 4 · the 152 quantities, recomputed */
const c2 = js('work/c2/work/results.json');
need(['decision_1  23685317816e-24 <= trialIH', 'decision_2  trialIH <= 23685317890e-24', 'decision_3  90248755123e-24 <= trialJLambdaH'].every((k) => c2[k] === 'DECIDED TRUE'), 'a cap inequality is no longer decided true');
const digits = Math.floor(-Math.log10(Number(c2.trialIH.width_in_1e_24_rounded_up || c2.trialIH['width_in_1e-24_rounded_up']) / Number(c2.trialIH['lower_in_1e-24_rounded_down'])));
const words = (rows) => rows.flatMap((r) => ['root', 'face', 'inner', 'mass'].filter((k) => r[k] && r[k].word).map((k) => r[k].word));
const P = [].concat(words(js('work/c3/work/results.json').rows), words(js('work/c3/work/results_iia.json').rows), words(js('work/c3/work/results_iib.json').rows));
const H = words(js('work/c3h/work/results.json').deciding_rows_rig_ideal), LJ = js('work/c3l/work/results_L.json'), L = words(LJ.rows_literal_reading);
const agree = (w) => w.filter((x) => x === 'AGREES').length;
need(P.length === 48 && H.length === 8 && L.length === 93 && agree(P) === 48 && agree(H) === 8 && agree(L) === 93, 'a recomputed row no longer sits at or below its printed bound');
/* each clean-room value against the interval the replayed certificate prints for the same quantity */
const pos = [];
const take = (rel, kind, re) => { for (const l of lines('records/c3/' + rel)) { const m = l.match(re); if (m) { const part = (l.match(/\b(root|face|inner|mass) +theirs/) || [])[1]; if (!part) die('a cross-check line names no part: ' + rel); pos.push({ kind, part, inside: m[1] === 'True', position: Number(m[2]), ceil: / = ceil\(theirs upper\): True/.test(l) }); } } };
take('crosscheck-c1-stage-i.txt', 'P', /ours inside theirs: (True|False) \| position in their interval: (-?[\d.]+)/);
take('crosscheck-c1-stage-ii.txt', 'P', /\| inside: (True|False) \| position (-?[\d.]+)/);
take('crosscheck-c1-h.txt', 'H', /inside theirs: (True|False) \| position (-?[\d.]+)/);
take('crosscheck-c1-L.txt', 'L', /\| inside: (True|False)\s+\| position\s+(-?[\d.]+)/);
const n = (k) => pos.filter((x) => x.kind === k).length;
need(n('P') === 48 && n('H') === 8 && n('L') === 93 && pos.every((x) => x.ceil), 'the cross-check files no longer carry 149 rows, each printed bound the ceiling of the certificate’s own upper end');
const outside = pos.filter((x) => !x.inside);
const fu = lines('records/c3/crosscheck-c1-followup.txt').filter((l) => /the note's recurrence/.test(l)).map((l) => /inside: True \| position 0\.5000/.test(l));
need(outside.length === 2 && outside.every((x) => x.kind === 'P' && x.position < 0) && fu.length === 2 && fu.every(Boolean), 'the two rows first below the certificate’s interval are no longer explained by the follow-up');
const caps = lines('records/c1/crosscheck-c2.txt').filter((l) => /^(trialIH|trialJLambdaH)\s/.test(l)).map((l) => { const m = l.match(/ours inside theirs: (True|False) \| theirs\/ours - 1 at ends: (-[\d.e+-]+), \+([\d.e+-]+)/); return { name: l.split(/\s+/)[0], inside: m[1] === 'True', position: Math.round(-Number(m[2]) / (Number(m[3]) - Number(m[2])) * 1000) / 1000 }; });
need(caps.length === 2 && caps.every((c) => c.inside), 'a cap quantity is no longer inside the certificate’s enclosure');
const recomputed = {
  caps: { inequalities: 3, quantities: 2, decided: 'all three hold', digits, marginsInUnits: [c2.trialIH['distance_to_lower_bound_in_1e-24'], c2.trialIH['distance_to_upper_bound_in_1e-24'], c2.trialJLambdaH['distance_to_lower_bound_in_1e-24']].map((x) => Math.round(Number(x) * 100) / 100), insideTheCertificatesInterval: caps },
  rows: { rankTwo: { integers: P.length, atOrBelowPrinted: agree(P) }, high: { integers: H.length, atOrBelowPrinted: agree(H) }, low: { integers: L.length, atOrBelowPrinted: agree(L), reading: LJ.reading } },
  integers: 3 + P.length + H.length + L.length,
  againstTheCertificatesIntervals: { rows: pos.length, insideAsFirstComputed: pos.length - outside.length, belowAsFirstComputed: outside.length, belowExplained: 'both are inside, at the middle, once the note’s recurrence (2.1) is used as its (2.9) writes it', printedIsCeilingOfUpperEnd: pos.filter((x) => x.ceil).length, positions: pos.map((x) => [x.kind === 'L' ? 'L ' + x.part : x.kind, x.position]) }
};

/* 5 · the final inequality on these numbers */
const mg = js('work/c4/work/results_margin.json'), ours = mg.computation_2_ours, prn = mg.computation_1_printed, room = mg.computation_3_room;
need(/^MARGIN CERTIFIED/.test(mg.word) && ours.enclosures_used === 149 && ours.enclosures_with_m_plus_at_most_printed === 149 && prn.total_T === certificate.totalLoss && prn.exact_F_with_printed_integers.margin_normalised_exact === certificate.marginExact, 'the margin record no longer certifies the inequality, or its rule no longer reproduces the certificate’s margin');
const margin = { word: mg.word, totalLossOurs: ours.total_T_ours, totalLossPrinted: prn.total_T, marginOurs: frac(ours.main.margin_normalised_exact), marginPrinted: frac(prn.exact_F_with_printed_integers.margin_normalised_exact), stated: '1/50000',
  roomToPositivityPercent: Math.round(Number(room.ours.required_threshold_0.relative_room_percent) * 10) / 10, roomToStatedPercent: Math.round(Number(room.ours['stated_threshold_1/50000'].relative_room_percent) * 10) / 10, budgetsReproduced: prn.budget_check.rows };
need(margin.marginOurs > 0 && margin.marginOurs > 1 / 50000, 'the margin on our numbers is not above the stated threshold');

/* 6 · the review of the hand derivations (a record in prose; its counts are read from its own sentence) */
const rv = rd('records/c4/VERDICT-REVIEW.md').replace(/\s+/g, ' ').match(/Of (\d+) links: (\d+) HOLD \(re-derived\), (\d+) HOLD WITH A CONDITION .*?, (\d+) NOT VERIFIED/);
need(rv && Number(rv[2]) + Number(rv[3]) + Number(rv[4]) === Number(rv[1]) && /No link was found WRONG OR INCOMPLETE/.test(rd('records/c4/VERDICT-REVIEW.md')), 'the review record no longer states its counts');
const review = { links: Number(rv[1]), hold: Number(rv[2]), holdUnderACheckedCondition: Number(rv[3]), notRederived: Number(rv[4]), foundWrong: 0, by: 'a separate AI session told to look for errors; not a human referee' };

/* 6b · the replays (a record in prose), and the note's DOI, which the page prints only once the deposit is published */
const rp = rd('records/c3/REPLAY-2.md').replace(/\s+/g, ' ');
need(/every clean-room program has now been re-run by the orchestrator from a clean copy, and every recorded number came back/.test(rp), 'the replay record no longer says every recorded number came back');
const replays = { word: 'every clean-room program re-run from a clean copy on a second machine; every recorded number came back', formOnly: 'for the 32 outer low rows the author’s row files differ from the committed program’s output in form only (one diagnostic field absent; in 7, one field written as integers, not strings)' };
need(/all 32 outer rows/.test(rp) && /in 7 of them/.test(rp), 'the replay record no longer names the difference of form');
const NOTE = js('note.json');
const note = NOTE.published === true ? { published: true, doi: NOTE.doi } : { published: false };

/* 7 · the day and the money, from the records' own lines */
const days = [...new Set([...Object.values(ST).map((s) => s.at.slice(0, 10)), ...c1s.split('\n').filter(Boolean).map((l) => l.slice(0, 10))])].sort();
const usdB = rd('records/b/VERDICT.md').match(/about US\$([\d.]+); deleted/), usdC = rd('records/c3/VERDICT.md').match(/= US\$([\d.]+) of the US\$25 limit\. All three/);
need(usdB && usdC, 'the records no longer state what the rented machines cost');
const method = { rentedMachineDays: days, rentedMachines: 4, rentedUSD: Math.round((Number(usdB[1]) + Number(usdC[1])) * 100) / 100, rules: ['PREREG-PG186.md', 'PREREG-PG186-A2-C0.md', 'PREREG-PG186-B.md', 'PREREG-PG186-C.md'].map((f) => 'corpus/prime-gaps-186/' + f) };

const verdicts = { build: 'builds as shipped', comparator: 'CONCORDANT', kernels: 'three accept', statementLayer: lean.statementLayer.verdict, axiom1: cmp.A1.verdict + ' on the instances', axiom2: cmp.A2.verdict + ' on the instances', certificate: certificate.word, recomputed: recomputed.integers + ' of ' + recomputed.integers, margin: 'CERTIFIED on our numbers', axioms: 'ASSUMED, all three' };
const record = {
  what: 'An outside check of OpenAI’s conditional Lean proof that prime gaps are at most 186, re-derived from the facts in corpus/prime-gaps-186 by tools/record-prime-gaps-186.js.',
  undecided: UNDECIDED,
  gaps: GAPS,
  pins: { repository: 'https://github.com/openai/PrimeGaps186', commit: pin.head, statementFile: pin.path, statementSha256: pin.sha256, toolchain: pin.toolchain, paper: 'https://cdn.openai.com/pdf/51126fac-1b68-4128-9666-c908bcc16033/short_gaps.pdf' },
  verdicts, lean, finite, certificate, recomputed, margin, review, replays, method, note,
  provenance: { file: 'corpus/prime-gaps-186/PROVENANCE.json', files: PROV.files.length }
};
const text = JSON.stringify(record, null, 1) + '\n';
if (process.argv.includes('--check')) {
  need(fs.existsSync(OUT), 'certs/prime-gaps-186.json is missing');
  need(fs.readFileSync(OUT, 'utf8') === text, 'certs/prime-gaps-186.json is not what the facts give');
  console.log('record-prime-gaps-186 --check: PASS · ' + Object.entries(verdicts).map(([k, v]) => k + ' ' + v).join(' · '));
} else {
  fs.writeFileSync(OUT, text);
  console.log('certs/prime-gaps-186.json written · ' + Object.entries(verdicts).map(([k, v]) => k + ' ' + v).join(' · '));
}
