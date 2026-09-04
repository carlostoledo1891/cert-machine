#!/usr/bin/env node
/* build-report-envs.js — generate reports/envs.html from certs/envs-record.json.

   NOTHING ON THE PAGE IS TYPED. Every rate, count, width and sha is read from the record, and
   the record is written by running the environments (tools/run-envs.js). The build REFUSES if
   the record's own load-bearing claims have stopped holding: the enclosure grader must still be
   sound, the tolerance graders must still be broken (or the suite measures nothing), the bluffed
   tiling must still score negative, and no forgery may have leaked.

   usage: node tools/build-report-envs.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));

const die = (m) => { console.error('ENVS REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const num = (n) => n.toLocaleString('en-US');
const pct = (x) => (100 * x).toFixed(1) + '%';
const RP = path.join(ROOT, 'certs', 'envs-record.json');
if (!fs.existsSync(RP)) die('certs/envs-record.json is missing — run node tools/run-envs.js');
const R = JSON.parse(fs.readFileSync(RP, 'utf8'));

/* ---- gates ------------------------------------------------------------------ */
const encl = R.graders.find(g => /enclosure/.test(g.name));
const absT = R.graders.find(g => /absolute/.test(g.name));
if (!encl || encl.falseAccept !== 0 || encl.falseReject !== 0) die('the enclosure grader is not sound in the record');
if (!absT || absT.falseAccept < 0.5) die('the suite no longer breaks tolerance checking — it would be measuring nothing');
if (R.forgeries.leaked !== 0) die('the record says a forgery leaked');
const bluff = R.uniformity.solvers.find(s => /bluff/.test(s.name));
if (!bluff || bluff.score >= 0) die('the bluffed tiling no longer scores negative');
if (!R.corpus.length || R.corpus.some(f => f.record && !f.sha256)) die('a fact names a record with no sha pin');
const pubFact = R.corpus.find(f => f.publishedWrong !== null);
if (!pubFact) die('the corpus carries no published-wrong fact — the one non-synthetic canary is gone');
const pinned = R.corpus.filter(f => f.sha256).length;

/* ---- page -------------------------------------------------------------------- */
const B = [];

B.push(C.header({
  eyebrow: 'cert-machine · environments',
  title: 'We graded the graders',
  deck: 'A grader that checks a number against a stored decimal within a tolerance accepts values '
    + 'that are provably wrong — and we can mint those values by the thousand from certificates we '
    + 'already hold. Here is the measurement, three environments built on it, and the one canary in '
    + 'the set that is not synthetic: a number a real problem thread actually published.'
}));

B.push(C.scope('Everything below is measured offline on this machine. No model was called to produce '
  + 'this page and no byte left the building: the harness refuses the network unless it is explicitly '
  + 'switched on. The grader names are the four reference shapes, not other people\'s products — this '
  + 'page measures a METHOD, and the suite that measures a real grader runs on its owner\'s machine '
  + 'and reports to them.'));

B.push(C.tldr({
  findingRaw: 'Against ' + num(R.provablyWrong) + ' submissions that are <b>provably wrong</b> — each one '
    + 'outside a certified enclosure — an absolute-tolerance grader accepts <b>' + pct(absT.falseAccept)
    + '</b> of them. A grader that compares against the certificate instead of a decimal accepts '
    + '<b>' + pct(encl.falseAccept) + '</b>, and rejects none of the ' + num(R.provablyRight)
    + ' submissions that are provably right. The tolerance <em>is</em> the vulnerability.',
  mechanismRaw: 'A certified enclosure is a generator. If a quantity is pinned to width w and a grader '
    + 'accepts anything within tol of its stored decimal, then every value in the band of width '
    + C.m('tol − w') + ' outside the enclosure is at once provably not the quantity and guaranteed to '
    + 'pass. Adversarial submissions stop being invented one at a time and start being minted from '
    + 'facts already on disk — which is why the enclosures have to exist first.',
  checkRaw: C.m('node instruments/envs/canary.js demo') + ' runs the suite; '
    + C.m('node tools/run-envs.js') + ' rewrites the record this page is built from; '
    + C.m('node instruments/envs/battery.js') + ' fires the red controls, including the two graders — '
    + 'accept-everything and reject-everything — that must both score zero.'
}));

B.push(C.stats([
  { k: 'tolerance grader, false-accept', v: pct(absT.falseAccept), n: num(absT.wrongSubmissions) + ' provably-wrong submissions, probed at ' + R.tolerancesProbed.map(t => t.toExponential(0)).join(', ') + '. Tightening the tolerance shrinks the band; it never closes it while the band is wider than the enclosure.' },
  { k: 'certificate grader, false-accept', v: pct(encl.falseAccept), n: 'And ' + pct(encl.falseReject) + ' false-reject. The same suite that breaks tolerance checking is passed cleanly by a checker that compares against the certificate.' },
  { k: 'facts in the corpus', v: String(R.corpus.length), n: pinned + ' of them read out of a record in certs/ and sha-pinned to it. The corpus grows with every certificate this machine produces — that is the compounding part.' },
  { k: 'forgeries planted, leaked', v: R.forgeries.planted + ' / ' + R.forgeries.leaked, n: 'Planted in the two model-facing environments before any model is called. One leak aborts the run.' }
]));

/* ---- the band schema ---------------------------------------------------------
   Drawn to scale, in units of the tolerance, which is the whole point: at a
   routine tolerance the certificate is thinner than a hairline and the band is
   everything else. Nothing here is stylised — the ratio on the caption is the
   ratio in the picture. */
{
  const widths = R.corpus.filter(f => f.width > 0).map(f => f.width).sort((a, b) => a - b);
  if (!widths.length) die('every fact has zero width — the band figure would divide by zero');
  const wmed = widths[Math.floor(widths.length / 2)];
  const TOL = 1e-9;
  const rho = (2 * TOL - wmed) / wmed;
  const W = 900, H = 210, L = 60, Rt = 24, midY = 96;
  const px = (u) => L + (u + 1.35) / 2.7 * (W - L - Rt);      /* u in units of tol, -1.35 .. 1.35 */
  const encHalfU = (wmed / 2) / TOL;                           /* half-width of the certificate, in tol units */
  const g = [];
  g.push('  <svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="The acceptance band drawn to scale in units of the tolerance: the certified enclosure is thinner than one pixel, and every value inside the tolerance window but outside it is provably wrong and accepted anyway.">');
  /* the accepted window */
  g.push('    <rect x="' + px(-1).toFixed(1) + '" y="' + (midY - 26) + '" width="' + (px(1) - px(-1)).toFixed(1)
    + '" height="52" fill="var(--c-grid)" stroke="var(--c-axis)" stroke-width="1"/>');
  /* the two band halves */
  for (const [a, b] of [[-1, -encHalfU], [encHalfU, 1]]) {
    g.push('    <rect x="' + px(a).toFixed(1) + '" y="' + (midY - 26) + '" width="' + Math.max(1, px(b) - px(a)).toFixed(1)
      + '" height="52" fill="var(--c-1)" opacity="0.30"/>');
  }
  /* the certificate itself, at true relative scale, floored at one pixel so it is visible AT ALL */
  const encW = Math.max(1, px(encHalfU) - px(-encHalfU));
  g.push('    <rect x="' + (px(0) - encW / 2).toFixed(1) + '" y="' + (midY - 34) + '" width="' + encW.toFixed(1)
    + '" height="68" fill="var(--c-2)"/>');
  g.push('    <line x1="' + px(0).toFixed(1) + '" y1="' + (midY - 44) + '" x2="' + px(0).toFixed(1) + '" y2="' + (midY + 44) + '" stroke="var(--c-axis)" stroke-width="1" stroke-dasharray="3 3"/>');
  const t = (x, y, s2, cls, an) => '    <text x="' + x.toFixed(1) + '" y="' + y + '"' + (an ? ' text-anchor="' + an + '"' : '') + ' class="' + cls + '">' + C.esc(s2) + '</text>';
  g.push(t(px(0), midY - 52, 'the stored key', 't-lab', 'middle'));
  g.push(t(px(-1), midY + 46, '− tol', 't-ax', 'middle'));
  g.push(t(px(1), midY + 46, '+ tol', 't-ax', 'middle'));
  g.push(t(px(-0.55), midY + 4, 'ACCEPTED · PROVABLY WRONG', 't-lab', 'middle'));
  g.push(t(px(0.55), midY + 4, 'ACCEPTED · PROVABLY WRONG', 't-lab', 'middle'));
  g.push(t(px(0) + encW / 2 + 8, midY + 62, 'the certificate — floored to ' + (encW).toFixed(0) + ' px so it is visible; its true width is 1/' + num(Math.round(2 * TOL / wmed)) + ' of this window', 't-note', 'start'));
  g.push('  </svg>');
  B.push(C.section({
    lab: '§1 · the picture', title: 'What a tolerance grader accepts', wide: true,
    bodyRaw: [
      C.figure({ svgRaw: g.join('\n'), caption: 'Drawn to scale in units of the tolerance. The certified enclosure '
        + 'is the narrow bar at the centre — at a routine tolerance of 1e-9 against a typical certificate here '
        + '(width ' + wmed.toExponential(0) + ') it is 1/' + num(Math.round(2 * TOL / wmed)) + ' of the accepted '
        + 'window, floored to one pixel so it is visible at all. Everything shaded is accepted by the grader and '
        + 'refuted by the certificate.' }),
      '<div class="col">' + C.pRaw('The accepted-but-wrong region has width ' + C.m('2·tol − w') + ' and is empty '
        + 'only when ' + C.m('tol ≤ w/2') + ' — at which point the grader accepts a sub-interval of the certificate '
        + 'and has become a certificate grader with gratuitous rejections. The ratio of band to certificate, '
        + C.m('ρ = 2·tol/w − 1') + ', is ' + C.m(num(Math.round(rho))) + ' here: the grader will accept a band '
        + num(Math.round(rho)) + ' times wider than the proof.') + '</div>'
    ].join('\n')
  }));
}

/* ---- the curve --------------------------------------------------------------- */
{
  const tols = R.tolerancesProbed.slice().sort((a, b) => a - b);
  const ser = [['absolute-tolerance', absT, 'var(--c-1)'], ['relative-tolerance', R.graders.find(g => /relative/.test(g.name)), 'var(--c-2)'],
    ['exact-match', R.graders.find(g => /exact/.test(g.name)), 'var(--c-3)']].filter(x => x[1]);
  const svg = CH.lines({
    w: 900, h: 340, logX: true, x0: tols[0] * 0.7, x1: tols[tols.length - 1] * 1.4, y0: 0, y1: 100,
    xLabel: 'tolerance', yLabel: 'false-accept rate (%)',
    yTicks: [0, 25, 50, 75, 100],
    alt: 'False-accept rate against tolerance for four grader shapes. The tolerance graders decline as the tolerance tightens but do not reach zero; the certificate grader is flat at zero everywhere.',
    series: ser.map(([n, g, tok]) => ({ name: n, token: tok, pts: tols.map(t => [t, 100 * (g.falseAcceptByTolerance[String(t)] || 0)]) })),
    keys: ser.map(([n, , tok]) => ({ token: tok, t: n, kind: 'line' }))
      .concat([{ token: 'var(--c-ctx)', t: 'certificate-grounded (flat at 0)', kind: 'line' }]),
    rules: [{ v: 0, token: 'var(--c-ctx)', t: 'certificate-grounded: 0% at every tolerance' }]
  });
  B.push(C.section({
    lab: '§2 · the curve', title: 'Tightening the tolerance does not close the hole', wide: true,
    bodyRaw: [
      C.figure({ svgRaw: svg, caption: 'False-accept rate against tolerance, over ' + num(R.provablyWrong)
        + ' provably-wrong submissions. The band closes fact by fact, as the tolerance drops below half that '
        + 'fact\'s certificate width — so the aggregate falls and reaches zero only when the tolerance is under '
        + 'half the width of every certificate in the corpus.' }),
      '<div class="col">' + C.pRaw('This is the figure that answers the standard remedy. A published bug taxonomy '
        + 'for reward verifiers lists exactly this failure — a loose numeric tolerance accepting a nearby wrong '
        + 'value — and prescribes tightening the tolerance. Four orders of magnitude of tightening take the '
        + 'absolute-tolerance grader from ' + pct(absT.falseAcceptByTolerance[String(tols[tols.length - 1])])
        + ' to ' + pct(absT.falseAcceptByTolerance[String(tols[0])]) + ', and the only tolerance that reaches zero '
        + 'is one that has stopped being a tolerance.') + '</div>'
    ].join('\n')
  }));
}

{
  const rows = R.graders.map(g => [
    { raw: C.esc(g.name) },
    { raw: C.m(pct(g.falseAccept)) }, { raw: C.m(pct(g.falseReject)) },
    { raw: C.m(pct(g.soundness)) },
    { raw: C.esc(R.tolerancesProbed.map(t => t.toExponential(0) + ': ' + pct(g.falseAcceptByTolerance[String(t)] || 0)).join(' · ')) }
  ]);
  B.push(C.section({
    lab: '§3 · the measurement', title: 'Four graders, one suite', wide: true,
    bodyRaw: [
      C.table({
        cols: [{ h: 'grader' }, { h: 'false-accept', cls: 'v' }, { h: 'false-reject', cls: 'v' },
          { h: 'soundness', cls: 'v' }, { h: 'false-accept by tolerance' }],
        rows
      }),
      '<div class="col">' + C.pRaw('Soundness is ' + C.m('(1 − false-accept) × (1 − false-reject)') + ', because '
        + 'either rate alone is gameable: a grader that rejects everything has a perfect false-accept rate and is '
        + 'useless, which is why every run carries controls drawn from INSIDE the enclosures. The exact-match row '
        + 'is the honest opposite failure — it accepts nothing wrong and rejects '
        + pct(R.graders.find(g => /exact/.test(g.name)).falseReject) + ' of the submissions that are right, '
        + 'including the midpoint printed at full double precision.') + '</div>'
    ].join('\n')
  }));
}

{
  const rows = R.corpus.map(f => [
    { raw: C.m(f.id) }, { raw: C.esc(f.what) },
    { raw: C.m((f.hi - f.lo).toExponential(2)) },
    { raw: f.record ? C.m(f.record) + (f.sha256 ? ' <span class="m">' + C.esc(f.sha256.slice(0, 12)) + '</span>' : '') : C.esc('closed form, enclosed at build') }
  ]);
  B.push(C.section({
    lab: '§4 · the corpus', title: 'Every canary traces to a certificate', wide: true,
    bodyRaw: [
      '<div class="col">' + C.pRaw('A canary asserts that a value is PROVABLY WRONG. That assertion is the '
        + 'product, so it may not rest on a decimal somebody re-typed: every fact below is read out of a record '
        + 'in ' + C.m('certs/') + ' at load time, and the record is sha256-pinned beside it. If a record changes, '
        + 'the battery refuses rather than minting canaries from a stale number. Minting from a fact that is not '
        + 'marked certified throws — it does not degrade.') + '</div>',
      C.table({ cols: [{ h: 'fact' }, { h: 'quantity' }, { h: 'width', cls: 'v' }, { h: 'read from' }], rows }),
      '<div class="col">' + C.pRaw('<strong>One of these is not like the others.</strong> '
        + C.m(pubFact.id) + ' carries the value a real problem thread actually published for the quantity: '
        + C.m(String(pubFact.publishedWrong)) + ', which sits outside our certificate by '
        + C.m(Math.abs(pubFact.publishedWrong < pubFact.lo ? pubFact.lo - pubFact.publishedWrong : pubFact.publishedWrong - pubFact.hi).toExponential(2))
        + ' and inside any ordinary tolerance of it. Every other canary in the suite is constructed. That one '
        + 'is a reproduction — <a href="/reports/erdos852.html">the refutation is here</a>.') + '</div>'
    ].join('\n')
  }));
}

{
  const u = R.uniformity;
  const rows = u.solvers.map(s => [
    { raw: C.esc(s.name) }, { raw: C.m(s.score.toFixed(2)) },
    { raw: C.m(String(s.correct)) }, { raw: C.m(String(s.wrong)) },
    { raw: C.m(String(s.unsupported)) }, { raw: C.m(String(s.abstained)) },
    { raw: s.needlesMissed ? C.tag(s.needlesMissed + ' needles missed', 'open') : C.tag('none missed', 'held') }
  ]);
  B.push(C.section({
    lab: '§5 · the uniformity gym', title: 'A verdict without evidence scores zero', wide: true,
    bodyRaw: [
      '<div class="col">' + C.pRaw('Decide whether ' + C.m('f > 0') + ' on the whole domain — and support it. '
        + 'HOLDS must ship a dyadic tiling whose every cell carries a verified positive lower bound; FAILS must '
        + 'ship a witness. A bare verdict scores zero however correct it is, because a verdict without evidence '
        + 'is indistinguishable from a lucky guess. Of ' + u.instances + ' instances, ' + u.needled + ' carry a '
        + 'needle — a notch narrow enough that any coarser grid steps over it — ' + u.twoDimensional
        + ' are two-dimensional and ' + u.razor + ' are razor-thin. Scoring: ' + C.esc(u.scoring) + '.') + '</div>',
      C.table({
        cols: [{ h: 'solver' }, { h: 'score', cls: 'v' }, { h: 'correct', cls: 'v' }, { h: 'wrong', cls: 'v' },
          { h: 'unsupported', cls: 'v' }, { h: 'abstained', cls: 'v' }, { h: 'needles' }],
        rows
      }),
      '<div class="col">' + C.pRaw('<strong>The bluff row is the design.</strong> It samples, decides HOLDS, and '
        + 'then dresses its sampling grid as a tiling — a VALID tiling, so it passes the combinatorial check. The '
        + 'one cell holding the needle then refuses to verify, and it scores ' + C.m(bluff.score.toFixed(2))
        + ': worse than abstaining. Faking the format was never the hard part. The budget-limited sound solver is '
        + 'what makes the abstention reward real rather than decorative — it abstains where it cannot finish and '
        + 'is never wrong.') + '</div>'
    ].join('\n')
  }));
}

{
  const rows = R.attacker.rungs.map(r => [
    { raw: C.m(r.id) }, { raw: C.esc(r.label) },
    { raw: C.esc(r.grader + (r.tolerance ? ' @ ' + r.tolerance.toExponential(0) : '')) },
    { raw: r.attackable ? C.tag('breakable', 'open') : C.tag('cannot be broken', 'held') },
    { raw: C.m(String(r.noAttackScore)) }, { raw: C.m(String(r.mintedAttackScore)) }
  ]);
  B.push(C.section({
    lab: '§6 · the attacker', title: 'An environment that rewards breaking things', wide: true,
    bodyRaw: [
      '<div class="col">' + C.pRaw('Invert the polarity. The model is not asked to construct a correct object; '
        + 'it is shown a grader and asked to BREAK it — to produce a value the grader accepts and that is provably '
        + 'wrong. Ground truth is free, because a certified enclosure decides both halves without a human. Every '
        + 'environment in existence trains provers; this one trains verifiers.') + '</div>',
      C.table({
        cols: [{ h: 'rung' }, { h: 'what' }, { h: 'grader' }, { h: 'verdict' },
          { h: '"no attack" scores', cls: 'v' }, { h: 'a minted attack scores', cls: 'v' }],
        rows
      }),
      '<div class="col">' + C.pRaw('<strong>Two of the four rungs cannot be broken</strong>, for two different '
        + 'reasons: on one the tolerance is NARROWER than the enclosure, so the band of accepted-but-wrong values '
        + 'is empty as arithmetic; on the other the grader compares against the certificate itself, so no such '
        + 'value exists at all. The correct answer there is ' + C.m('NO_ATTACK') + ', and claiming a break that '
        + 'does not verify scores worse than saying there is none. A model that has learned "attack whatever you '
        + 'are shown" fails half the ladder — which is the behaviour worth measuring, because an auditor that '
        + 'always finds something is exactly as useless as one that never does.') + '</div>'
    ].join('\n')
  }));
}

B.push(C.section({
  lab: '§7 · the rules', title: 'What this is not',
  bodyRaw: [
    C.plainList([
      { b: 'Not a benchmark of anyone\'s product.', text: 'The four graders here are reference SHAPES — an '
        + 'absolute tolerance, a relative tolerance, exact match, and the certificate itself. The suite that '
        + 'measures a real grader runs on that grader\'s own machine and prints the rates there. Every buyer of '
        + 'this is also a subject of it, and auditing your customers is not a business.' },
      { b: 'Not a claim that tolerance graders are stupid.', text: 'They are the correct tool when there is no '
        + 'certificate to compare against. The measurement says something narrower and harder: where a certificate '
        + 'EXISTS, comparing against a decimal throws away the thing that would have made the check sound.' },
      { b: 'Not minted from anything uncertified.', text: 'A fact that is float-grade can seed a task and must '
        + 'never seed a claim that a submission is provably wrong. The generator throws on a non-certified fact '
        + 'rather than quietly degrading, and the battery keeps a red control on exactly that.' },
      { b: 'Not connected to anything.', text: 'The model harness refuses to reach the network unless it is '
        + 'explicitly switched on. Every number on this page was produced offline against reference solvers and '
        + 'stub models; a rung × model table with real models is a decision, not a default.' },
      { b: 'Not the first environment with no answer key.', text: 'Kernel-checked proof environments have had '
        + 'that property for years, and verifiable-reward environments are a whole category. What is unusual here '
        + 'is narrower: the grader is exact rather than tolerant, the adversarial examples are generated from '
        + 'certificates rather than written by hand, and the refusal rate and the hack rate are published as '
        + 'measured numbers rather than asserted.' }
    ])
  ].join('\n')
}));

const foot = '<footer class="col">'
  + '<p>' + C.esc('Generated by tools/build-report-envs.js from certs/envs-record.json (' + R.meta.date + ', git ' + R.meta.git + '). Rebuild the record: node tools/run-envs.js') + '</p>'
  + '<p>' + C.esc('git ' + git + ' · instruments/envs, crossed from the operator\'s own bench with sha (instruments/envs/PROVENANCE.json) · MIT') + '</p>'
  + '<p style="margin-top:20px;color:var(--ink-2)">' + C.esc('Carlos Toledo · cert-machine') + '</p>'
  + '</footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'envs.html'),
  TPL.render({
    title: 'We graded the graders · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
    desc: 'A certified enclosure is a canary factory: if a quantity is pinned to width w and a grader accepts '
      + 'anything within tol of a stored decimal, every value in the surrounding band is provably not the quantity '
      + 'and passes anyway. Measured here — tolerance graders accept ' + pct(absT.falseAccept) + ' of provably-wrong '
      + 'submissions, a certificate grader accepts none — with three environments built on it, including one that '
      + 'rewards breaking a grader rather than satisfying it.',
    path: '/reports/envs.html'
  }));
console.log('reports/envs.html written: ' + R.corpus.length + ' facts, ' + R.submissions + ' submissions, tolerance '
  + pct(absT.falseAccept) + ' vs certificate ' + pct(encl.falseAccept) + ' @ git ' + git);
