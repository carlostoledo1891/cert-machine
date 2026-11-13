#!/usr/bin/env node
/* build-report-prime-gap-premises.js — reports/prime-gap-premises.html: three Lean proofs of bounded gaps between primes
   (OpenAI's 186; the 182 of romyar1/prime-gaps-lean; Axiom Math's 212) each rest on premises that Lean does not check.
   The page is the list of all of them, and what could be checked about each.

   THE MATHEMATICS IS NOT OURS. The three proofs belong to their authors; nothing on this page proves a premise or
   verifies one of the three bounds. What stays open comes first. A status is printed in the ledger's own words
   (DECIDED ON INSTANCES below 2000 · REPRODUCED · READ: MISMATCH · NOT DECIDED) and never as a verdict chip: none of
   them is a certification of a premise.

   Every number, status word, date and name is read from certs/prime-gap-premises.json
   (tools/record-prime-gap-premises.js, which re-derives it from corpus/prime-gap-premises with --check). The build
   refuses when the record stops saying what a sentence here states.

   usage: node tools/build-report-prime-gap-premises.js                                                            MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const OG = require(path.join(ROOT, 'tools', 'build-og-report.js'));   /* the page's own light art card (og-prime-gap-premises.png) */
const die = (m) => { console.error('PRIME GAP PREMISES REPORT REFUSED: ' + m); process.exit(1); };
const R = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'prime-gap-premises.json'), 'utf8'));
const GH = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';
const rec = (rel) => '<a href="' + C.escAttr(GH + rel) + '"><span class="m">' + C.esc(rel) + '</span></a>';
const m = (s) => '<span class="m">' + C.esc(s) + '</span>';
const a = (href, text) => '<a href="' + C.escAttr(href) + '">' + C.esc(text) + '</a>';
const N = (x) => Number(x).toLocaleString('en-US');
const mins = (s) => Math.round(s / 60);
const day = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/* the words this page states, each read back from the record */
const ST = { D: 'DECIDED ON INSTANCES below 2000', R: 'REPRODUCED', M: 'READ: MISMATCH', N: 'NOT DECIDED' };
const SAYS = { rankFour: ST.D, replay182: ST.R, readings212: ST.M, fourier182: ST.N, certificate212: ST.N, premisesProved: 0 };
for (const [k, v] of Object.entries(SAYS)) if (R.words[k] !== v) die(k + ' is ' + R.words[k] + ' in certs/prime-gap-premises.json, and this page states ' + v);
if (JSON.stringify(R.words['186']) !== JSON.stringify([ST.D, ST.D, ST.R])) die('the three premises of the 186 no longer stand as this page states');
const [P186, P182, P212] = R.proofs;
if (P186.id !== '186' || P182.id !== '182' || P212.id !== '212' || P186.by !== 'OpenAI' || P212.by !== 'Axiom Math') die('the record no longer names the three proofs as this page does');
if (!/^The proofs are OpenAI’s .* and Axiom Math’s/.test(R.undecided) || !/proves no premise and does not verify any of the three bounds/.test(R.undecided) || !R.undecided.includes('“' + P182.attribution.quote + '”')) die('the record no longer says first whose proofs these are and what it does not decide');
const L = R.ledger, RF = R.rankFour, S5 = R.replay182, RD = R.readings212, CT = R.certificate212, I186 = R.inherited186;
if (L.rows !== 16 || L.premises.length !== 16 || P186.premises + P182.premises + P212.premises !== 16) die('the ledger no longer holds the 16 premises the title counts');
const by = (s) => L.byStatus[s] || 0;
if (by(ST.D) + by(ST.R) + by(ST.M) + by(ST.N) !== L.rows) die('a premise carries a status this page does not draw');
if (RF.holdInBoth !== RF.instances || RF.fails !== 0 || RF.undecided !== 0 || RF.agreement.disjoint !== 0 || RF.agreement.bruteForceOutside !== 0 || RF.agreement.instancesCompared !== RF.instances) die('the rank-four premise is not decided on every instance by both deciders');
const [PL3, PL2] = RF.planted;
if (PL3.bound !== 3 || PL2.bound !== 2 || PL3.failInA !== PL3.failInB || PL2.failInA !== PL2.failInB || !PL3.sameSet || !PL3.equalAtEveryPrime || !PL2.equalAtEveryPrime || !(PL3.failInA > 0 && PL2.failInA > 0)) die('a planted bound does not fail alike in both deciders');
if (!(Number(RF.largest.ratio) < RF.bound) || RF.perPrimeDisplayOnly.length !== RF.primes || RF.perPrimeDisplayOnly.some((q) => !(q[1] < RF.bound))) die('a prime’s largest value reaches the assumed bound');
const AC = S5.acceptance, CM = S5.comparison;
if (!/^PASS_COMPLETE/.test(AC.status) || AC.stagesPassed !== AC.stages || AC.audits !== AC.auditsOf || AC.rejected !== AC.rejections || AC.targetInequalities !== S5.inequalities) die('the package’s acceptance is not as this page states');
if (CM.verdict !== 'PASS' || CM.passed !== S5.inequalities || CM.of !== S5.inequalities || CM.equalToLeanLiteral !== S5.inequalities || CM.equalToPublishedValue !== S5.inequalities || CM.strictRows !== 0 || !CM.loggedBeforeProduction) die('the comparison of the 262 numbers is not as this page states');
if (S5.exits.compare !== 0 || S5.exits.redTighten === 0 || S5.exits.redDrop === 0 || S5.redControls.some((x) => x.outcome !== 'FAIL')) die('the comparison’s controls did not behave as this page states');
if (S5.split.cap + S5.split.outer + S5.split.inner !== S5.inequalities) die('the 262 numbers no longer add up');
if (RD.readers !== 2 || RD.mismatchA !== RD.premises || RD.mismatchB !== RD.premises || RD.allNDiscrepancy + RD.addedHypothesis !== RD.premises || by(ST.M) !== RD.premises) die('the two readings of the 212 are not as this page states');
if (CT.status !== ST.N || CT.reason !== 'no witness is published' || CT.issue.number === RD.issue.number) die('the certificate row is not as this page states');
if (I186.axiom1 !== 'CERTIFIED on the instances' || I186.axiom2 !== 'CERTIFIED on the instances' || I186.certificate !== 'REPRODUCED' || I186.primes !== RF.primes || I186.primesBelow !== RF.primesBelow) die('the 186 record no longer says what the 186 rows state');
if (R.seals.length !== 4 || R.gaps.length < 8 || R.gaps[0].id !== 'conditional') die('the seals or the open items are not as this page states');
const TITLE = 'Three Lean proofs of bounded prime gaps, and the 16 premises Lean does not check';
const BELOW = N(RF.primesBelow);

/* ------------------------------------------------------------------ the ledger, in plain words ----------------- */
const row = (id) => L.premises.find((r) => r.id === id) || die('the ledger has no row ' + id);
const WHO = { '186': P186.by + ' · ' + P186.bound, '182': 'the ' + P182.bound, '212': P212.by + ' · ' + P212.bound };
const inherit = 'Taken over from the ' + P186.bound + ': the ' + P182.bound + ' carries a byte-identical copy of that Lean file and states the same sum, so it inherits that check. That its names resolve to that file’s definitions is a reading.';
const allN = 'Read twice, blind. Both readers: the Lean text bounds the error over all n, where the paper it cites sums over n between x and 2x.';
const PLAIN = {
  '186-1': { k: 'A bound on a rank-three Kloosterman sum', s: 'Every case at the ' + I186.primes + ' primes below ' + BELOW + ' holds, in two programs that share no code: ' + N(I186.axiom1Instances) + ' cases. From the earlier check of the ' + P186.bound + '.' },
  '186-2': { k: 'A correlation bound for Kloosterman sums', s: 'Every case at the same primes holds, in two programs that share no code: ' + N(I186.axiom2Instances) + ' cases. From the earlier check of the ' + P186.bound + '.' },
  '186-3': { k: I186.numbers + ' numerical bounds on integrals', s: 'OpenAI’s program was run again and its ' + I186.numbers + ' numbers were recomputed with no shared code. That each integral is at most its estimate is argued on paper.' },
  '182-1': { k: 'The ' + P186.bound + '’s first premise, again', s: inherit },
  '182-2': { k: 'The ' + P186.bound + '’s second premise, again', s: inherit },
  '182-3': { k: 'A bound on a rank-four Kloosterman sum', s: 'New in this work. Every case at the ' + RF.primes + ' primes below ' + BELOW + ' holds, in two programs that share no code: ' + N(RF.instances) + ' cases, none failing, none left undecided.' },
  '182-4': { k: S5.inequalities + ' numerical bounds on integrals', s: 'The authors’ own numerical package, run again by me: it accepts its own run, and all ' + CM.equalToLeanLiteral + ' fresh values equal the numbers written in Lean. A replay, not an independent decision.' },
  '182-5': { k: 'A local Fourier hypothesis with free constants', s: 'No finite test can refute it: a larger threshold or a larger constant escapes any instance.' },
  '212-TypeIIPolymath': { k: 'A Type II estimate', s: allN },
  '212-TypeIbPolymath': { k: 'A Type I estimate', s: allN },
  '212-TypeIBakerIrving': { k: 'A Type I estimate', s: allN },
  '212-TypeIStadlmann': { k: 'A Type I estimate', s: allN },
  '212-TypeIIIPolymath': { k: 'A Type III estimate', s: allN },
  '212-Gap212HarmanReduction': { k: 'A reduction step', s: allN },
  '212-BilinearBombieriVinogradov': { k: 'A bilinear Bombieri–Vinogradov theorem', s: 'Read twice, blind. Both readers: the Lean text adds a condition that the theorem it cites does not have.' },
  '212-Gap212Certificate': { k: 'A certificate: a function with a stated property exists', s: 'It needs a witness, and none is published. The question is open with the authors.' }
};
for (const r of L.premises) if (!PLAIN[r.id]) die('the ledger holds a row this page has no sentence for: ' + r.id);
if (Object.keys(PLAIN).length !== L.rows) die('this page has a sentence for a row the ledger does not hold');
if (L.premises.filter((r) => PLAIN[r.id].s === allN).length !== RD.allNDiscrepancy) die('the readings’ main clause is not on the rows this page puts it on');

/* ------------------------------------------------------------------ figure 1 (the hero) -------------------------
   Three proofs across, four standings down, one cell per premise. The stroke is the standing (WARRANT): solid where
   every instance was decided in exact arithmetic; dashed where the numbers are a claimant's, reproduced or quoted and
   not decided here; a hatched void where nothing was decided. The word in the first column is the ledger's own. */
const ROWS = [
  { st: ST.D, sub: 'every case at the primes below ' + BELOW, kind: 'decided' },
  { st: ST.R, sub: 'the authors’ own programs, run again', kind: 'computed' },
  { st: ST.M, sub: 'differs from the paper it cites', kind: 'read' },
  { st: ST.N, sub: '∅ · nothing here could decide it', kind: 'void' }
];
const cellsOf = (proof, st) => L.premises.filter((r) => r.proof === proof && r.status === st);
const CELL = 30, PITCH = 38;
const cell = (r, kind, x, y, hatch) => {
  const tip = '<title>' + C.esc(PLAIN[r.id].k + ' — ' + r.status) + '</title>';
  const box = 'x="' + x + '" y="' + y + '" width="' + CELL + '" height="' + CELL + '" rx="4"';
  if (kind === 'decided') return '    <rect ' + box + ' ' + W.attrs(W.DECIDED, { width: 2 }) + '>' + tip + '</rect>';
  if (kind === 'computed') return '    <rect ' + box + ' ' + W.attrs(W.COMPUTED, { width: 2 }) + '>' + tip + '</rect>';
  if (kind === 'read') return '    <rect ' + box + ' ' + W.attrs(W.COMPUTED, { width: 2 }) + '>' + tip + '</rect>\n' + C.label({ x: x + CELL / 2, y: y + 20, text: '≠', cls: 't-lab', anchor: 'middle' });
  return '    <rect ' + box + ' class="w-void" fill="url(#' + hatch + ')" stroke="var(--ink-4)" stroke-width="1">' + tip + '</rect>';
};
const hatchDef = (id) => '    <defs><pattern id="' + id + '" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="var(--ink-4)" stroke-width="1"/></pattern></defs>';
const countWord = (n, one, many) => n + ' ' + (n === 1 ? one : many);
const HALT = 'A grid of small squares, one per premise: three columns for the three proofs and four rows for what was done. '
  + [P186, P182, P212].map((p) => (p.by ? p.by + ', bound ' + p.bound : 'The proof with the bound ' + p.bound) + ', ' + p.premises + ' premises: '
    + ROWS.map((q) => [cellsOf(p.id, q.st).length, q.st]).filter((q) => q[0]).map((q) => q[0] + ' ' + q[1]).join(', ')).join('. ')
  + '. Solid squares are decided on instances; dashed squares are reproduced or, with a not-equal sign, read as a mismatch; hatched squares are not decided.';
const COLX = [330, 480, 630], ROW0 = 64, ROWH = 62;
const wide = [C.svgOpen({ w: 900, h: ROW0 + ROWS.length * ROWH + 4, alt: HALT }), hatchDef('pgpHatchW')];
wide.push(C.label({ x: 0, y: 18, text: 'what was done to it', cls: 't-ax' }));
[P186, P182, P212].forEach((p, i) => wide.push(C.label({ x: COLX[i], y: 18, text: WHO[p.id], cls: 't-lab' }), C.label({ x: COLX[i], y: 38, text: countWord(p.premises, 'premise', 'premises'), cls: 't-ax' })));
ROWS.forEach((q, j) => {
  const y = ROW0 + j * ROWH;
  wide.push('    <line x1="0" y1="' + (y - 10) + '" x2="900" y2="' + (y - 10) + '" stroke="var(--rule)" stroke-width="1"/>');
  wide.push(C.label({ x: 0, y: y + 14, text: q.st, cls: 't-lab' }), C.label({ x: 0, y: y + 34, text: q.sub, cls: 't-ax' }));
  [P186, P182, P212].forEach((p, i) => cellsOf(p.id, q.st).forEach((r, n) => wide.push(cell(r, q.kind, COLX[i] + n * PITCH, y + 2, 'pgpHatchW'))));
});
wide.push('    </svg>');
const narrow = [''];
let ny = 0;
[P186, P182, P212].forEach((p) => {
  if (ny) { narrow.push('    <line x1="0" y1="' + (ny + 2) + '" x2="360" y2="' + (ny + 2) + '" stroke="var(--rule)" stroke-width="1"/>'); ny += 14; }
  narrow.push(C.label({ x: 0, y: ny + 16, text: WHO[p.id] + ' · ' + countWord(p.premises, 'premise', 'premises'), cls: 't-lab' }));
  ny += 30;
  ROWS.forEach((q) => {
    const cs = cellsOf(p.id, q.st);
    if (!cs.length) return;
    narrow.push(C.label({ x: 0, y: ny + 14, text: q.st + (q.kind === 'void' ? ' · ∅' : ''), cls: 't-ax' }));
    cs.forEach((r, n) => narrow.push(cell(r, q.kind, n * PITCH + 1, ny + 22, 'pgpHatchN')));
    ny += 22 + CELL + 16;
  });
});
narrow.push('    </svg>');
narrow[0] = C.svgOpen({ w: 360, h: ny + 2, alt: HALT }) + '\n' + hatchDef('pgpHatchN');
if ((wide.join('').match(/<rect /g) || []).length !== L.rows || (narrow.join('').match(/<rect /g) || []).length !== L.rows) die('the drawing does not hold one cell per premise');

/* figure 2 — the rank-four sum at each prime, against the assumed bound (decider B's upper ends, rounded up) */
const FIG_RF = CH.scatter({
  w: 900, h: 300, x0: 0, x1: RF.primesBelow, y0: 0, y1: 4.4,
  xTicks: [0, 500, 1000, 1500, 2000].map((v) => ({ v, t: N(v) })), yTicks: [0, 1, 2, 3, 4].map((v) => ({ v, t: String(v) })),
  xLabel: 'the prime p',
  curves: [{ pts: RF.perPrimeDisplayOnly, token: 'var(--c-1)' }],
  hlines: [{ y: RF.bound, t: 'the assumed bound, ' + RF.bound }],
  pts: [{ x: RF.largest.p, y: Number(RF.largest.ratio), token: 'var(--c-1)', k: 'the closest approach', v: RF.largest.ratio + ' at p = ' + RF.largest.p }],
  alt: 'A jagged line over the ' + RF.primes + ' primes below ' + BELOW + ': for each prime, the largest size of the rank-four sum divided by p times the square root of p. It rises quickly to about 2.5 and then wanders between about 2.8 and 3.6, never reaching the horizontal line at the assumed bound ' + RF.bound + '. Its highest point is ' + RF.largest.ratio + ', at p = ' + RF.largest.p + '.'
});

/* ------------------------------------------------------------------ the page ----------------------------------- */
const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · generated from the records',
  title: TITLE,
  deck: 'Three Lean proofs bound the gaps between primes: OpenAI’s (' + P186.bound + '), one whose repository credits “' + P182.attribution.quote + '” (' + P182.bound + '), and Axiom Math’s (' + P212.bound + '). The proofs are theirs, and nothing on this page proves a premise or verifies any of the three bounds. '
    + 'Each proof starts from statements it takes as given, which Lean does not check. Here is the list, ' + L.rows + ' in all, and what I could check about each, with Claude.'
}));

O.push(C.figure({ svgRaw: wide.join('\n'), svgNarrowRaw: narrow.join('\n'), hero: true, record: ['certs/prime-gap-premises.json', L.file],
  stop: 'a premise’s status is not the one its evidence gives, or a premise has no cell',
  caption: 'One square per premise. Solid: every case at the primes below ' + BELOW + ' was decided in exact arithmetic, which is not a proof for all primes. Dashed: the authors’ numbers, reproduced with their own programs, or (≠) a quoted theorem that two readers found to differ from its source. Hatched: nothing here could decide it. No square is a proof of a premise.' }));
O.push('<div class="col">' + W.legendHtml({ compact: true }) + '</div>');

O.push(C.stats([
  { k: 'proofs', v: String(R.proofs.length), n: 'with the bounds ' + P186.bound + ', ' + P182.bound + ' and ' + P212.bound },
  { k: 'premises proved here', v: R.words.premisesProved + ' of ' + L.rows, n: 'they remain premises' },
  { k: 'decided on instances', v: String(by(ST.D)), n: 'every case at the ' + RF.primes + ' primes below ' + BELOW },
  { k: 'reproduced', v: String(by(ST.R)), n: 'the authors’ numbers, with their own programs' },
  { k: 'read: mismatch', v: String(by(ST.M)), n: 'against the papers they cite, by two readers' },
  { k: 'not decided', v: String(by(ST.N)), n: 'nothing here could decide them' }
]));

O.push(C.scope('The three proofs, their Lean developments and their numerical packages belong to their authors. This page lists what they assume and what could be checked about it; it is not new mathematics. The checks are mine, done with Claude (Anthropic’s AI model), which wrote the programs under my direction; the readings of the ' + P212.bound + ' were made by AI readers working blind.'));

O.push(C.section({
  lab: 'read this first', title: 'What is still open', id: 'limits',
  bodyRaw: C.plainList(R.gaps.map((g) => ({ b: g.b, text: g.text })))
}));

const proofLine = (p, whoRaw) => ({ b: 'The bound ' + p.bound + '.', raw: whoRaw + C.esc(' ') + a(p.repository + '/tree/' + p.commit, p.name + ' at ' + p.commit.slice(0, 8)) + C.esc(' · ' + countWord(p.premises, 'premise', 'premises') + '.') });
const ledgerTable = C.table({
  cols: [{ h: 'proof' }, { h: 'premise' }, { h: 'as quoted' }, { h: 'status' }],
  rows: L.premises.map((r) => [
    { raw: '<b>' + C.esc(r.proof) + '</b>' },
    { raw: '<b>' + C.esc(PLAIN[r.id].k) + '</b><br><span class="small"><span class="m">' + C.breakable(r.lean) + '</span> · ' + C.esc(r.shape) + '</span>' },
    { raw: '<span class="m">' + C.esc(r.statement) + '</span>' },
    { raw: '<b>' + C.esc(r.status) + '</b><br><span class="small">' + C.esc(PLAIN[r.id].s) + '</span>' }
  ])
});
if (JSON.stringify(L.premises.map((r) => r.proof)) !== JSON.stringify([P186, P182, P212].flatMap((p) => Array(p.premises).fill(p.id)))) die('the ledger’s rows are not grouped by proof');
O.push(C.section({
  lab: 'the ledger', title: 'The ' + L.rows + ' premises, proof by proof', id: 'ledger', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw(C.esc('Each row is one statement a proof takes as given. The third column quotes or summarises it, as the ledger does: the Lean text, shortened, or for the ' + P212.bound + ' the theorem it cites. The status is in the ledger’s own words, and none of the four is a proof of the premise.'))
    + C.plainList([
      proofLine(P186, C.esc('OpenAI’s.')),
      proofLine(P182, C.esc('Its repository’s notice reads: “Project attribution: ' + P182.attribution.quote + '” It carries no licence for its own material, so it is quoted and linked here, never copied.')),
      proofLine(P212, C.esc('Axiom Math’s. In its quoted rows, [1] is a Polymath paper and [2] a paper of Stadlmann.'))
    ]) + '</div>'
    + ledgerTable
}));

O.push(C.section({
  lab: '1 · the ' + P182.bound + '’s rank-four premise', title: 'Every case for the primes below ' + BELOW, id: 'rank-four', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw(C.esc('The ' + P182.bound + ' adds a premise the ' + P186.bound + ' does not have: a bound on a sum over a finite field, one for every prime p and every nonzero c. Its size is to be at most ' + RF.bound + ' times p√p. It is Deligne’s bound for the rank-four Kloosterman sum, taken as a hypothesis. A computer can decide it prime by prime, which proves nothing about all primes and still tests whether the Lean statement says something false.'))
    + C.plainList([
      { b: 'All hold.', text: N(RF.instances) + ' cases, for the ' + RF.primes + ' primes below ' + BELOW + ', each decided by two programs that share no code: one in exact integers, one in interval arithmetic. None fails; none is left undecided.' },
      { b: 'The two programs agree case by case.', text: 'On all ' + N(RF.agreement.instancesCompared) + ' cases their enclosures of the sum overlap. A third program, a direct triple sum, recomputed the ' + RF.agreement.bruteForceInstances + ' cases at the primes up to ' + RF.agreement.bruteForcePrimesUpTo + ' and landed inside both.' },
      { b: 'Wrong versions are caught.', text: 'With ' + RF.bound + ' replaced by ' + PL3.bound + ', ' + N(PL3.failInB) + ' cases fail in both programs, the same ' + N(PL3.failInB) + ', the earliest at p = ' + PL3.firstPrime + '. With ' + RF.bound + ' replaced by ' + PL2.bound + ', ' + N(PL2.failInB) + ' fail in both, the same number at every prime.' },
      { b: 'How close it comes.', text: 'The sum reaches ' + RF.largest.ratio + ' times p√p against the assumed ' + RF.bound + ', at p = ' + N(RF.largest.p) + ' and c = ' + RF.largest.c + '.' }
    ]) + '</div>'
    + C.figure({ svgRaw: FIG_RF, wide: false, record: ['certs/prime-gap-premises.json', 'corpus/prime-gap-premises/out/decider-b.jsonl'], stop: 'a prime’s largest value reaches the bound, or the two programs disagree',
      caption: 'The rank-four premise: the largest size of the sum at each prime, divided by p√p, against the assumed bound ' + RF.bound + '. Each point is the upper end of an interval enclosure, rounded up.' })
}));

O.push(C.section({
  lab: '2 · the ' + P182.bound + '’s numbers', title: 'The authors’ numerical package, run again', id: 'replay',
  bodyRaw: C.pRaw(C.esc('Another premise of the ' + P182.bound + ' is a list of ' + S5.inequalities + ' inequalities between integrals and fractions: ' + S5.split.cap + ' cap bounds, ' + S5.split.outer + ' outer and ' + S5.split.inner + ' inner. Its authors support them with a numerical package, released as an archive. I ran it again.'))
    + C.plainList([
      { b: 'What was run.', raw: C.esc('The release archive, pinned by its hash, and the repository at its pinned commit, on a rented Linux machine. The arithmetic library is FLINT ' + S5.stack.flintRelease + ' with one upstream correction (') + m(S5.stack.flintCorrection) + C.esc('), built from source. No byte of the package was changed.') },
      { b: 'The package accepts its own run.', text: 'Its ' + AC.auditsOf + ' audits pass, its ' + AC.rejections + ' rejection tests all reject, and all ' + AC.stages + ' production stages pass, in ' + Math.floor(AC.wallSeconds / 3600) + ' h ' + Math.round((AC.wallSeconds % 3600) / 60) + ' min. Its acceptance step reports a complete recomputation of the ' + AC.targetInequalities + ' inequalities.' },
      { b: 'My comparison.', text: 'A script of mine, with its hash logged before production started, compares the ' + CM.of + ' fresh values with the fractions it parses from the Lean files at the pinned commit, not with the package’s own targets. ' + CM.passed + ' of ' + CM.of + ' are on the right side.' },
      { b: 'There is no slack.', text: 'All ' + CM.equalToLeanLiteral + ' fresh values are equal to the numbers written in Lean, and equal to the published values. The Lean numbers are exactly what the package computes, so nothing separates a computed bound from the bound Lean assumes.' },
      { b: 'The comparison catches a wrong number.', text: 'With one Lean number tightened past its value, it fails and names the row. With one row removed, it fails on the count.' }
    ])
}));

O.push(C.section({
  lab: '3 · the ' + P212.bound + '’s quoted theorems', title: 'Seven quoted premises, read blind twice', id: 'readings',
  bodyRaw: C.pRaw(C.esc(RD.premises + ' of the ' + P212.premises + ' premises of the ' + P212.bound + ' are theorems quoted from two papers. For these the question is whether the Lean text says what the paper says.'))
    + C.plainList([
      { b: 'How they were read.', text: 'By two AI readers. Each read the cited paper and recorded what it states before opening the Lean file; the second reader did not see the other’s work.' },
      { b: 'What both found.', text: 'All ' + RD.premises + ' differ from the statements they cite. In ' + RD.allNDiscrepancy + ', the Lean text bounds an error over all n, where the paper sums over n between x and 2x; a helper for the paper’s version is defined in the file and never used. The other one adds a condition its source does not have.' },
      { b: 'Already public.', raw: C.esc('The readings, hypothesis by hypothesis, are in ') + rec(RD.folder) + C.esc(', and the main difference is reported to the authors as ') + a(RD.issue.url, 'issue #' + RD.issue.number) + C.esc(' of their repository.') },
      { b: 'Readings, not decisions.', text: 'A reading compares two texts. Neither reader is a human referee, and no program decided anything in this section.' }
    ])
}));

O.push(C.section({
  lab: '4 · the ' + P212.bound + '’s certificate', title: 'A certificate with no published witness', id: 'certificate',
  bodyRaw: C.plainList([
    { b: 'What it asks for.', text: 'The remaining premise of the ' + P212.bound + ' says that a function with a stated property exists. To check it, one needs the function.' },
    { b: 'None is published.', text: 'I looked in the repository at its pinned commit, whose own README says the certificate is assumed, and in the library it depends on, which holds such functions for two other bounds. Finding one myself would be a research computation, and was not attempted.' },
    { b: 'Asked.', raw: C.esc('The question is open with the authors as ') + a(CT.issue.url, 'issue #' + CT.issue.number) + C.esc(' of their repository. The row stays ' + CT.status + '.') }
  ])
}));

O.push(C.section({
  lab: 'the method', title: 'How it was done', id: 'method',
  bodyRaw: C.plainList([
    { b: 'Rules before results.', raw: C.esc('The rules for each stage, with its verdict words and its predictions, were written and sealed before the stage ran: a salted fingerprint of the private work, posted to a public registry, which proves the date without showing the content. There are ' + R.seals.length + ' fingerprints (' + R.seals.map((s) => s.what).join('; ') + '), and the rules are now public: ') + rec(R.method.rules[0]) + '.' },
    { b: 'A wrong version on every check.', text: 'A bound made too small, a number tightened, a row removed: each check had to catch its own.' },
    { b: 'Departures are listed.', text: 'Among them: the first rented machine was deleted partway through the long run, and the whole step was run again from the start on a second one.' },
    { b: 'Size.', text: 'One day, ' + day(R.dates.work) + ': a laptop and ' + R.money.pods + ' rented machines, about US$' + R.money.usd.toFixed(2) + ' by the clock.' }
  ])
}));

O.push(C.section({
  lab: 'who did what', title: 'Each step is a separate job', id: 'roles',
  bodyRaw: C.plainList([
    { b: 'The three proofs.', text: 'OpenAI (' + P186.bound + '); “' + P182.attribution.quote + '”, in the words of that repository’s notice (' + P182.bound + '); Axiom Math (' + P212.bound + ').' },
    { b: 'The theorems the premises quote.', text: 'Deligne and Katz, and Fouvry, Kowalski and Michel, for the sums over finite fields; Polymath and Stadlmann, for the ' + P212.bound + '’s estimates.' },
    { b: 'The numerical package of the ' + P182.bound + ', and FLINT.', text: 'Their authors.' },
    { b: 'The checks on this page.', text: 'I did them, with Claude, Anthropic’s AI model, which wrote the programs under my direction.' },
    { b: 'The readings of the ' + P212.bound + '.', text: 'Two AI readers that I ran, each working blind.' }
  ])
}));

O.push(C.section({
  lab: 'check it yourself', title: 'How to re-run it', id: 'rerun',
  bodyRaw: C.plainList([
    { b: 'The record.', raw: m('node tools/record-prime-gap-premises.js --check') + C.esc(' re-derives every number on this page from ') + rec('corpus/prime-gap-premises') + C.esc(' (' + R.provenance.files + ' files, each pinned by its hash) and refuses on any difference.') },
    { b: 'The two deciders.', raw: C.esc('In that folder, ') + m('python3 decider_a.py') + C.esc(' (it needs NumPy; about ' + mins(RF.deciderA.seconds) + ' minutes) and ') + m('node decider_b.js') + C.esc(' (about ' + mins(RF.deciderB.seconds) + ' minutes) decide the rank-four premise again; a smaller bound on the command line makes a shorter run. Given ') + m('--values') + C.esc(' and a file name, each also writes its value for every case, and ') + m('compare.py') + C.esc(' compares the two files and runs the direct triple sum.') },
    { b: 'The comparison script.', raw: rec(CM.script) + C.esc(' needs a run of the authors’ package and a copy of their repository at the pinned commit.') },
    { b: 'What is withheld, and why.', raw: C.esc('The package’s own output from my run is not published, because the ' + P182.bound + ' repository carries no licence: what I read from it is published, with the hashes of the files. Two large files of per-case values are given by hash; the deciders write them again. ') + rec(R.method.notes) + C.esc(' says what differs from the private files.') },
    { b: 'What was checked.', raw: [P186, P182, P212].map((p) => a(p.repository + '/tree/' + p.commit, p.name + ' at ' + p.commit.slice(0, 8))).join(C.esc(', ')) + C.esc('. The earlier check of the ' + P186.bound + ': ') + a('/reports/prime-gaps-186.html', 'its report') + '.' },
    { b: 'The results as written.', raw: C.esc('With what stays open at the top: ') + rec(R.method.result) + '.' }
  ])
}));

const foot = '<p>' + C.esc('Generated by tools/build-report-prime-gap-premises.js from certs/prime-gap-premises.json (tools/record-prime-gap-premises.js --check). I did this with Claude (Anthropic); Claude wrote the programs under my direction.') + '</p>'
  + '<p>' + C.esc('git ' + (cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim() || '—') + ' · cert-machine · Carlos Toledo') + '</p>';
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'prime-gap-premises.html'),
  TPL.render({ title: TITLE + ' · cert-machine', bodyRaw: O.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/prime-gap-premises.html', og: { image: '/og-prime-gap-premises.png', alt: OG.alt('prime-gap-premises') },
    desc: 'Three Lean proofs of bounded gaps between primes, with the bounds ' + P186.bound + ', ' + P182.bound + ' and ' + P212.bound + ', each rest on premises that Lean does not check. The list of all ' + L.rows + ', and what could be checked about each: ' + by(ST.D) + ' decided on every instance below ' + BELOW + ', ' + by(ST.R) + ' reproduced, ' + by(ST.M) + ' read and found to differ from the papers they cite, ' + by(ST.N) + ' not decided. No premise is proved here.' }));
console.log('reports/prime-gap-premises.html written · ' + L.rows + ' premises · ' + Object.entries(L.byStatus).map(([k, v]) => k + ' ' + v).join(' · ') + ' · proved here ' + R.words.premisesProved);
