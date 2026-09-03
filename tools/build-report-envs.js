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

{
  const rows = R.graders.map(g => [
    { raw: C.esc(g.name) },
    { raw: C.m(pct(g.falseAccept)) }, { raw: C.m(pct(g.falseReject)) },
    { raw: C.m(pct(g.soundness)) },
    { raw: C.esc(R.tolerancesProbed.map(t => t.toExponential(0) + ': ' + pct(g.falseAcceptByTolerance[String(t)] || 0)).join(' · ')) }
  ]);
  B.push(C.section({
    lab: '§1 · the measurement', title: 'Four graders, one suite', wide: true,
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
    lab: '§2 · the corpus', title: 'Every canary traces to a certificate', wide: true,
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
    lab: '§3 · the uniformity gym', title: 'A verdict without evidence scores zero', wide: true,
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
    lab: '§4 · the attacker', title: 'An environment that rewards breaking things', wide: true,
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
  lab: '§5 · the rules', title: 'What this is not',
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
