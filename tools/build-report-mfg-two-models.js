#!/usr/bin/env node
/* build-report-mfg-two-models.js — reports/mfg-two-models.html: one stationary mean-field game given to two AI models
   (GPT-6.2 Astra, Claude Fable 5.2), each answering one identical message and then reading the other's mathematics.

   THE MATHEMATICS IS THE MODELS'. What stays open comes first. Every number, verdict word and name on the page is read
   from certs/mfg-two-models.json, which is re-checked before a word is written (tools/record-mfg-two-models.js
   --check), and the build refuses when the record stops saying what a sentence of the page states.

   usage: node tools/build-report-mfg-two-models.js                                                              MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const OG = require(path.join(ROOT, 'tools', 'build-og-report.js'));   /* the page's own light art card (og-mfg-two-models.png) */
const die = (msg) => { console.error('MFG TWO MODELS PAGE REFUSED: ' + msg); process.exit(1); };
const need = (ok, msg) => { if (!ok) die(msg); };
const GH = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';
const rec = (rel) => '<a href="' + C.escAttr(GH + rel) + '"><span class="m">' + C.esc(rel) + '</span></a>';
const m = (s) => '<span class="m">' + C.breakable(s) + '</span>';
const a = (href, text) => '<a href="' + C.escAttr(href) + '">' + C.esc(text) + '</a>';
const N = (x) => Number(x).toLocaleString('en-US');
const pct = (x, d) => (100 * x).toFixed(d === undefined ? 0 : d) + '%';
const T = (s) => String(s).replace(/'/g, '’').replace(/"([^"]*)"/g, '“$1”');
const tag = (v) => C.tag(v);
const REC = 'certs/mfg-two-models.json';
const DIR = 'corpus/mfg-two-models/';

try { const out = cp.execFileSync('node', ['tools/record-mfg-two-models.js', '--check'], { cwd: ROOT, encoding: 'utf8' }); need(/^PASS/.test(out), 'the record did not pass its check: ' + out.trim()); }
catch (e) { die('tools/record-mfg-two-models.js --check refused: ' + (e.stdout || '') + (e.stderr || '')); }
const R = JSON.parse(fs.readFileSync(path.join(ROOT, REC), 'utf8'));
const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'mfg-regime-map.json'), 'utf8'));
const S = R.summary, U = R.uniqueness, F = R.folds, RD = R.readings;
const AST = RD.models.astra.name, FAB = RD.models.fable.name;
const who = (k) => ({ astra: AST, fable: FAB, session: 'this session' }[k] || k);

/* ---- the words this page states, each read back from the record ---- */
const cA = R.claims.astra, cF = R.claims.fable, cS = R.claims.session;
const row = (list, id) => { const r = list.find((x) => x.id === id); need(r, 'the claim ' + id + ' is gone'); return r; };
need(S.astra.refuted === 0 && S.fable.refuted === 0 && S.session.refuted === 0, 'a claim is refuted');
need(S.astra.mostCertifiedAtOnce === 5 && S.fable.mostCertifiedAtOnce === 5 && S.session.mostCertifiedAtOnce === 7, 'the certified counts moved');
need(cS.length === 2 && cS.every((r) => r.word === 'CERTIFIED' && r.wordWithTheGridBound === 'CERTIFIED' && r.claimed === 7 && r.secondDecider === 'agrees' && r.c[0] === -360), 'the seven are no longer certified by both deciders at c = -360');
const fiveBoxA = row(cA, 'forced-five-box'), provedBoxA = row(cA, 'proved-five-box'), uniqA = row(cA, 'unique-rectangle');
need(fiveBoxA.word === 'CERTIFIED' && fiveBoxA.wordWithTheGridBound === 'CERTIFIED' && !fiveBoxA.point && fiveBoxA.claimed === 5, 'Astra’s five over a box moved');
need(provedBoxA.word === 'REFUSED' && uniqA.word === 'REFUSED' && S.astra.refused === 2, 'Astra’s two refused boxes moved');
const lemmaOnly = (list) => list.filter((r) => r.word === 'CERTIFIED' && r.wordWithTheGridBound !== 'CERTIFIED');
need(lemmaOnly(cA).length === 2 && lemmaOnly(cF).length === 1 && lemmaOnly(cA).concat(lemmaOnly(cF)).every((r) => r.claimed === 5 && r.gridPositive === 3 && r.point), 'the three near-vacuum claims moved');
need(S.fable.certified === S.fable.claims, 'a Fable claim is no longer certified');
need(cA.concat(cF).filter((r) => r.point).every((r) => r.secondDecider === 'agrees'), 'the two deciders disagree at a point');
const five = (list) => list.filter((r) => r.word === 'CERTIFIED' && r.claimed === 5);
need(U.authorPoint.lowerBoundFloat > 14.1 && U.authorPoint.needs === 14 && U.map.multipleCellsInsideTheUniqueRegion === 0, 'the uniqueness instrument moved');
need(U.map.undecidedCells === MAP.tally.counts.UNDECIDED && U.map.uniqueByTheArgument > U.map.insideTheAuthorsRectangle, 'the map consequence moved');
const find = (id) => { const f = RD.findings.find((x) => x.id === id); need(f, 'the finding ' + id + ' is gone'); return f; };
need(find('unique-rectangle').status === 'PROOF READ' && find('count-forced').status === 'FALSE AS STATED' && find('evenness').status === 'OPEN' && find('unique-strip').missedByTheFirstReading, 'a reading moved');
need(F.first.every((x) => Math.abs(x.astraFormulaReturns - x.depth) / x.depth < 0.01), 'the fold formula no longer returns the table’s depths within 1%');
const mapShare = (k) => MAP.tally.area[k] / MAP.tally.total;
const certifiedAsSubmitted = S.astra.certified + S.fable.certified, submitted = S.astra.claims + S.fable.claims;
const gridAsSubmitted = S.astra.certifiedWithTheGridBound + S.fable.certifiedWithTheGridBound;

/* ---- the figure: how far the uniqueness argument reaches, against the first fold. The argument's line is an
   inequality decided in exact arithmetic; the fold is floating point and wears the weaker standing. ---- */
const curve = U.curve.filter((p) => p.depthFloat <= 1.2 + 1e-9 && p.GFloat !== null);
need(curve.length > 50 && curve.every((p) => -p.GFloat > p.foldFloat), 'the argument’s curve is no longer everywhere to the right of the fold');
const SERIES = (short) => [
  { name: short ? 'uniqueness proved to here' : 'the uniqueness argument holds down to this coupling (an inequality, exact arithmetic)', pts: curve.map((p) => [p.depthFloat, -p.GFloat]), standing: W.DECIDED },
  { name: short ? 'first fold (floating point)' : 'the first fold, below which three equilibria exist (' + FAB + '’s table, floating point)', pts: curve.map((p) => [p.depthFloat, p.foldFloat]), standing: W.COMPUTED }
];
const last = U.table[U.table.length - 1], first = U.table[0];
const FALT = 'Two curves over the depth A of the potential, from 0 to 1.2, with the coupling c on the vertical axis. The upper curve, where the uniqueness argument stops, falls from about ' + (-first.GFloat).toFixed(1) + ' near A = 0 to ' + (-last.GFloat).toFixed(2) + ' at A = 1.2. The lower curve, the first fold, falls from about ' + first.foldFloat.toFixed(1) + ' to ' + last.foldFloat.toFixed(2) + '. The gap between them widens from ' + first.gap.toFixed(2) + ' to ' + last.gap.toFixed(1) + '.';
const fig = (w, h, short) => CH.lines({ w, h, x0: 0, x1: 1.2, y0: -13, y1: -6, hover: false, padR: short ? 30 : 22, padL: short ? 46 : 62,
  yTicks: [-12, -10, -8, -6].map((v) => ({ v, t: String(v).replace('-', '−') })), xTicks: (short ? [0, 0.6, 1.2] : [0, 0.3, 0.6, 0.9, 1.2]).map((v) => ({ v, t: String(v) })),
  xLabel: short ? 'depth A' : 'depth A of the potential', yLabel: 'coupling c',
  series: SERIES(short), alt: FALT });

const TITLE = 'Two AI models on a mean-field game: claims decided, proofs read';
const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · generated from the record',
  title: TITLE,
  deck: 'I gave ' + AST + ' (' + RD.models.astra.lab + ') and ' + FAB + ' (' + RD.models.fable.lab + ') the same single message: find something true and new about a stationary mean-field game whose published map left ' + pct(mapShare('UNDECIDED')) + ' of its area undecided. Each answered once, and then each read the other’s mathematics. '
    + 'With Claude (Anthropic’s AI model, and the same model as one of the two), I decided every list of solutions they submitted with this repository’s certifier. Nothing either model claimed was refuted. Five equilibria are certified where three was the most known, seven by a construction that follows from both answers, and a proof that the equilibrium is unique reaches ' + pct(U.map.shareOfMap) + ' of the map. '
    + 'The proofs were read line by line. They were not formally checked, and one model’s proofs have not yet had a reader outside one model family.'
}));
O.push(C.figure({ hero: true, svgRaw: fig(900, 380, false), svgNarrowRaw: fig(360, 420, true), record: [REC, 'labs/mfg/uniqueness.py'],
  caption: 'How far a proof of uniqueness reaches. ' + AST + ' proved that the game has exactly one equilibrium on a rectangle, and the proof ends in one inequality. Evaluated in exact arithmetic for each depth, the inequality holds down to the upper curve. Below the lower curve three equilibria exist; between the two curves the equilibrium is unique on every numerical test, and nobody has proved it. The gap is ' + first.gap.toFixed(2) + ' near A = 0 and ' + last.gap.toFixed(1) + ' at A = 1.2.',
  stop: 'the argument’s curve touches or crosses the fold, or a cell the map proves to hold two equilibria lies above the argument’s curve' }));
O.push(C.stats([
  { k: 'equilibria certified at one parameter', v: String(S.session.mostCertifiedAtOnce), n: 'three was the most known; five from each model’s own numbers, seven built from their count' },
  { k: 'lists of solutions certified as submitted', v: certifiedAsSubmitted + ' of ' + submitted, n: gridAsSubmitted + ' of them also by the certifier’s own positivity bound; none refuted' },
  { k: 'undecided cells of the map a uniqueness proof now covers', v: N(U.map.uniqueByTheArgument) + ' of ' + N(U.map.undecidedCells), n: 'a proof read by two readers of one model family, not formally checked' },
  { k: 'share of the truly unique region the proof reaches', v: pct(U.againstTheFold.argumentReachesShare), n: 'measured against a fold computed in floating point' }
]));
O.push(C.scope('This page reports one experiment; it does not rank the two models. Both worked inside this repository with the certifier at hand, and the session that ran the checks is the same model as one of them. The mathematics is the models’. The checks are mine, run with Claude (Anthropic’s AI model), which wrote the programs under my direction.'));

O.push(C.section({ lab: 'read this first', title: 'What is still open', id: 'limits', bodyRaw:
  C.plainList(RD.notDone.map((t) => ({ text: T(t) })))
  + C.pRaw(C.esc('The conditions of the two runs, which is why nothing here is a comparison of the models:'))
  + C.plainList(RD.conditions.map((t) => ({ text: T(t) }))) }));

/* ---- the game ---- */
O.push(C.section({ lab: 'the game', title: 'A crowd that is drawn to itself', id: 'game', bodyRaw:
  C.pRaw(C.esc('A mean-field game describes many small players, each choosing a path while reacting to the density of all the others. The stationary quadratic game on a circle is the pair'))
  + C.pRaw('<span class="m">' + C.esc('−σu″ + ½(u′)² + ρ = c·m + A·cos 2πx,   −σm″ − (m·u′)′ = 0,   ∫m = 1,   ∫u = 0,   m > 0,   σ = ½') + '</span>')
  + C.pRaw(C.esc('with m the density, u the value function and ρ a constant. When the coupling c is positive the players avoid each other and the equilibrium is unique, a theorem of Lasry and Lions. When c is negative they are drawn to density, and there can be several equilibria. A is the depth of a potential well.'))
  + C.pRaw(C.esc('This repository had published a map of the rectangle −18 ≤ c ≤ 2, 0 ≤ A ≤ 1.2 in ' + N(MAP.cells.length) + ' cells, each decided over the whole cell: at least two equilibria on ' + pct(mapShare('MULTIPLE')) + ' of the area, exactly one on ' + pct(mapShare('UNIQUE')) + ' (the part with c ≥ 0), and no decision on ' + pct(mapShare('UNDECIDED')) + '. The most equilibria certified at one parameter was three.')) }));

/* ---- what was asked ---- */
O.push(C.section({ lab: 'the experiment', title: 'One message each, then each reads the other', id: 'asked', bodyRaw: C.plainList([
  { b: 'One message.', raw: C.esc('Both models received the same text, with the whole task and nothing attached: the game, what was already known, what would count as new, and how to hand over the numbers of every solution claimed. It is ') + rec(DIR + 'message.md') + C.esc('.') },
  { b: 'One answer.', text: 'Each model worked in one reply and ended it with its claims, each labelled proved, computationally supported or conjecture, with a probability.' },
  { b: 'The check.', text: 'Every list of candidate solutions was given to the certifier exactly as submitted. Nothing was polished: a polished candidate would be the solver’s discovery, not the model’s.' },
  { b: 'The cross-read.', raw: C.esc('Each model then received the other’s mathematics with one identical instruction, to find the strongest reason not to accept it (') + rec(DIR + 'cross-read-instruction.md') + C.esc(').') }
]) }));

/* ---- 1 · multiplicity ---- */
const where = (r) => r.point ? 'c = ' + String(r.c[0]).replace('-', '−') + ', A = ' + r.A[0] : 'a box around c = ' + ((r.c[0] + r.c[1]) / 2).toFixed(2).replace('-', '−') + ', A = ' + Number(((r.A[0] + r.A[1]) / 2).toPrecision(3));
const claimRows = (list) => list.map((r) => [r.id, where(r), String(r.claimed), { raw: tag(r.word) }, r.word === 'CERTIFIED' ? (r.wordWithTheGridBound === 'CERTIFIED' ? 'yes' : 'no: ' + r.gridPositive + ' of ' + r.claimed) : '', r.secondDecider === 'agrees' ? 'agrees' : r.point ? r.secondDecider : 'a box']);
const claimCols = [{ h: 'Claim' }, { h: 'Where' }, { h: 'Equilibria claimed' }, { h: 'Decided' }, { h: 'Positivity also by the grid bound' }, { h: 'Second decider' }];
O.push(C.section({ lab: '1 · how many equilibria', title: 'Five from each model, then seven', id: 'count', wide: true, bodyRaw:
  '<div class="col">' + C.plainList([
    { b: 'The count without a potential.', text: 'Both models found, independently in their first answers, the same exact law at A = 0: the number of even equilibria is 1 + 2·#{j ≥ 1 : π²j² < −c}. Past each threshold c = −π²j² a new pair appears, with j peaks. Each read the other’s proof and found it to hold.' },
    { b: 'Five.', text: 'Just past the third threshold, near c = −90, the two-peak and three-peak pairs coexist with the continuation of the constant state. ' + AST + ' submitted five there over a small box at A = 0.5; ' + FAB + ' submitted five at ' + (five(cF).filter((r) => r.point).length) + ' points and over ' + (five(cF).filter((r) => !r.point).length) + ' boxes. All are certified.' },
    { b: 'Seven.', text: 'Both models stopped at five and said why: the message allowed 64 modes, and the one-peak states are too close to empty to resolve. Their law says how to go further. At A = 0 a j-peak state is a one-peak state rescaled, so at c = −360 the 4-, 5- and 6-peak pairs are one-peak states at c = −22.5, −14.4 and −10, all well resolved. In this session I built those six and the constant with 160 modes, and re-solved them at A = 0.1. Seven pairwise distinct equilibria are certified at both, by both deciders. The candidates are mine; the law is the models’.' },
    { b: 'Positivity.', text: 'The certifier proves the density positive by a bound on a grid, and refuses a density that comes close to zero. Both models prove a short lemma that makes this unnecessary: the flux of any real periodic solution vanishes, so its density is an exponential and cannot change sign. ' + FAB + ' drew the consequence in the cross-read. On this page a list is CERTIFIED when every candidate is enclosed and the enclosures are pairwise disjoint; the column beside it says whether the grid bound agrees. It disagrees on ' + (lemmaOnly(cA).length + lemmaOnly(cF).length) + ' lists, each a five whose one-peak pair has a density near 10⁻⁷.' },
    { b: 'What was not certified.', text: AST + '’s two remaining boxes are too wide for the certifier: its analytic five over a whole unit of c, and the uniqueness rectangle, which is a statement and not a list of solutions. A refusal is not a refutation.' }
  ]) + '</div>'
  + '<div class="wide"><details class="more"><summary>The ' + cA.length + ' lists ' + C.esc(AST) + ' submitted</summary>' + C.table({ cols: claimCols, rows: claimRows(cA) }) + '</details></div>'
  + '<div class="wide"><details class="more"><summary>The ' + cF.length + ' lists ' + C.esc(FAB) + ' submitted</summary>' + C.table({ cols: claimCols, rows: claimRows(cF) }) + '</details></div>'
  + '<div class="wide"><details class="more"><summary>The ' + cS.length + ' lists built in this session</summary>' + C.table({ cols: claimCols, rows: claimRows(cS) }) + '</details></div>'
}));

/* ---- 2 · uniqueness ---- */
const fU = find('unique-rectangle'), fS = find('unique-strip');
O.push(C.section({ lab: '2 · where the equilibrium is unique', title: 'A proof, and how far it reaches', id: 'unique', wide: true, bodyRaw:
  '<div class="col">' + C.plainList([
    { b: 'The proof.', raw: C.esc(AST + ' proved that for −7 ≤ c ≤ 0 and 0 ≤ A ≤ 1.2 the game has exactly one equilibrium, even or not. The proof is in ') + rec(DIR + 'astra-report.tex') + C.esc('. It bounds every possible solution, then shows that two different solutions would force a quantity above ' + U.authorPoint.lowerBoundFloat.toFixed(2) + ' to be at most ' + U.authorPoint.needs + '.') },
    { b: 'Its readers.', text: 'I read it with Claude line by line and found no error. ' + FAB + ' read it in the cross-read, filled eight steps the text leaves implicit, recomputed every constant and found none either. Both readers are the same model, and the second knew the result of the first. No one outside that family has read it.' },
    { b: 'The proof as an instrument.', raw: C.esc('The proof uses only the largest |c| and the largest A of its rectangle, so its last inequality decides any rectangle. ') + rec('labs/mfg/uniqueness.py') + C.esc(' evaluates it in exact rational arithmetic and finds, for each depth, the most negative coupling at which it holds. ' + FAB + ' computed the same curve independently in the cross-read.') },
    { b: 'On the map.', text: N(U.map.uniqueByTheArgument) + ' of the ' + N(U.map.undecidedCells) + ' undecided cells lie inside the region where the inequality holds, ' + pct(U.map.shareOfMap, 1) + ' of the map’s area; the rectangle as its author stated it covers ' + N(U.map.insideTheAuthorsRectangle) + ' cells, ' + pct(U.map.shareOfMapAuthorsRectangle) + '. No cell the map proves to hold two equilibria lies inside. The published map is not changed by this page.' },
    { b: 'Against the truth.', text: 'By ' + FAB + '’s fold table, the part of the map with c < 0 where the equilibrium is unique is ' + pct(U.againstTheFold.shareOfMapFloat, 1) + ' of the area. The proof reaches ' + pct(U.againstTheFold.argumentReachesShare, 1) + ' of it. ' + FAB + ' also showed why this kind of argument cannot pass c = −π²: it is uniform down to A = 0, where uniqueness fails beyond that value.' },
    { b: 'A second, weaker proof, and what a reader found in it.', text: FAB + ' proved uniqueness when |c|·exp(3|c| + 3A/π) < π², a thin strip. I had read that proof and reported no error. ' + AST + ', reading it afterwards, found that it never proves an equilibrium exists (and supplied the argument), that one entry of its table was rounded the wrong way, and that one step tightens to give exp(2|c| + 2A/π). The uniqueness itself holds.' }
  ]) + '</div>'
  + C.table({ cols: [{ h: 'Depth A up to' }, { h: 'Uniqueness proved for c ≥' }, { h: 'First fold (floating point)' }, { h: 'Gap' }],
    rows: U.table.map((t) => [String(t.depthFloat), (-t.GFloat).toFixed(2).replace('-', '−'), t.foldFloat.toFixed(2).replace('-', '−'), t.gap.toFixed(2)]) })
}));

/* ---- 3 · the fold ---- */
O.push(C.section({ lab: '3 · the first fold', title: 'Two derivations, one curve', id: 'fold', bodyRaw: C.plainList([
  { b: 'The law.', text: 'Where the count goes from one to three there is a fold. ' + AST + ' derived its depth as A = (4/3)·√(2/(3π²))·δ^(3/2)·(1 + δ/(16π²) + …) with δ = −c − π². ' + FAB + ' derived the leading term another way and computed the fold as a table. The two leading terms are algebraically the same.' },
  { b: 'The comparison.', text: 'At the couplings where ' + FAB + '’s table puts the fold for A = ' + F.first.map((x) => x.depth).join(', ') + ', ' + AST + '’s two-term formula returns A = ' + F.first.map((x) => x.astraFormulaReturns).join(', ') + '. It is an expansion near the cusp, and it drifts as the depth grows.' },
  { b: 'The higher folds.', text: 'In the cross-read ' + AST + ' gave the leading behaviour of the second and third folds: they leave −4π² and −9π² like ' + F.second.astraCoefficient.toFixed(4) + '·A^(4/3) and ' + F.third.astraCoefficient.toFixed(6) + '·A². ' + FAB + '’s independent table gives ' + F.third.fableTableGives[0].value.toFixed(6) + ' for the third, and ' + F.second.fableTableGives.map((x) => x.value.toFixed(4)).join(', ') + ' at A = ' + F.second.fableTableGives.map((x) => x.depth).join(', ') + ' for the second, falling toward the stated value. That proof has had no reader but its author.' },
  { b: 'What this is.', text: 'Floating point on both sides. Nothing on this page certifies a fold.' }
]) }));

/* ---- 4 · the readings ---- */
const statusTag = (s) => s === 'CERTIFIED' ? tag('CERTIFIED') : C.tag(s, s === 'PROOF READ' ? 'cert' : s === 'FALSE AS STATED' ? 'dep' : 'open');
O.push(C.section({ lab: '4 · finding by finding', title: 'Who found what, and what each reading found', id: 'readings', wide: true, bodyRaw:
  '<div class="col">' + C.pRaw(C.esc('CERTIFIED is the certifier’s word. PROOF READ means a written proof was followed line by line by the readers named and no error was found; it is not a formal check. SUPPORTED is numerical agreement only.')) + '</div>'
  + C.table({ cols: [{ h: 'Finding' }, { h: 'From' }, { h: 'Standing' }, { h: 'What the check or the reading found' }],
    rows: RD.findings.map((f) => [T(f.statement), f.from.map(who).join(', '), { raw: statusTag(f.status) }, T(f.found.replace(/\bastra\b/g, AST).replace(/\bfable\b/g, FAB).replace(/\bthe session\b/g, 'I') + (f.limit ? '. Limit: ' + f.limit : '') + (f.missedByTheFirstReading ? '. Missed at first: ' + f.missedByTheFirstReading.replace(/\bthe session\b/g, 'I') : ''))]) })
}));

/* ---- prior work ---- */
O.push(C.section({ lab: 'prior work', title: 'What was already known', id: 'prior', bodyRaw:
  C.pRaw(C.esc('A short search, not a survey. Nothing on this page should be called new before someone who knows this literature has read it.'))
  + C.plainList(RD.priorWork.map((p) => ({ raw: a(p.url, p.who + ', ' + p.what + ' (' + p.year + ')') + C.esc(T(': ' + p.says + '.')) })))
  + C.pRaw(C.esc('Not found: a uniqueness result for this game with a potential, with an explicit region; a certified coexistence of five or seven equilibria.')) }));

O.push(C.section({ lab: 'who did what', title: 'Each step is a separate job', id: 'roles', bodyRaw: C.plainList([
  { b: 'The mathematics.', text: AST + ' and ' + FAB + ': the reduction, the count, the proofs of uniqueness, the fold laws, and the candidate solutions each submitted. Each finding is credited in the table above.' },
  { b: 'The readings.', text: 'Each model on the other’s proofs; and I, with Claude, on both.' },
  { b: 'The certifier.', text: 'This repository’s validated-numerics certifier for the game, and its point version as a second decider. It decides what it is given; it found nothing.' },
  { b: 'The seven, the instrument and this page.', text: 'Carlos Toledo, with Claude (Anthropic), which wrote the programs under my direction. The runs were made on 18 November 2026 on one laptop.' }
]) }));

O.push(C.section({ lab: 'check it yourself', title: 'How to re-read it', id: 'rerun', bodyRaw: C.plainList([
  { b: 'The record.', raw: m('node tools/record-mfg-two-models.js --check') + C.esc(' re-decides a sample of the claims, recomputes the uniqueness curve and the fold comparison, and refuses on any difference from ') + rec(REC) + C.esc('. ') + m('--write') + C.esc(' decides every claim again; it takes minutes.') },
  { b: 'What the models wrote.', raw: rec(DIR + 'astra-report.tex') + C.esc(', ') + rec(DIR + 'astra-cross-read.txt') + C.esc(' and ') + rec(DIR + 'fable-proofs.md') + C.esc(', with their numbers in ') + rec(DIR + 'astra-claims.json') + C.esc(' and ') + rec(DIR + 'fable-claims.json') + C.esc('.') },
  { b: 'Who read what.', raw: rec(DIR + 'readings.json') + C.esc(', written by hand; the page states nothing about a proof that is not in it.') },
  { b: 'The uniqueness curve.', raw: m('python3 labs/mfg/uniqueness.py') + C.esc(' prints it, with the map consequence, from the standard library alone.') }
]) }));

const foot = '<p>' + C.esc('Generated by tools/build-report-mfg-two-models.js from ' + REC + ', re-checked as the page is built. I did this with Claude (Anthropic); Claude wrote the programs under my direction.') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p>';
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'mfg-two-models.html'), TPL.render({ title: TITLE + ' · cert-machine', bodyRaw: O.join('\n\n'), footRaw: foot, path: '/reports/mfg-two-models.html',
  og: { image: '/og-mfg-two-models.png', alt: OG.alt('mfg-two-models') },
  desc: 'One stationary mean-field game given to GPT-6.2 Astra and Claude Fable 5.2: five and seven coexisting equilibria certified, a uniqueness proof read and measured, and no claim refuted.' }));
console.log('reports/mfg-two-models.html written · certified as submitted ' + certifiedAsSubmitted + ' of ' + submitted + ' · most at once ' + S.session.mostCertifiedAtOnce + ' · unique cells ' + U.map.uniqueByTheArgument);
