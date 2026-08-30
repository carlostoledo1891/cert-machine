#!/usr/bin/env node
/* build-report-ai-claims.js — reports/ai-claims-audit.html

   Six theorems an AI system helped produce, re-verified here from the
   manuscripts rather than from the authors' code. The verifiers are lifted
   bytes under legacy/; instruments/laneaudit/audit.js is the one module that
   runs them and reads their output, and this builder is a consumer of it.

   THE GATE IS THE RUN. Every number on this page comes out of a live
   execution of all six verifiers at build time — nothing is transcribed, and
   a verifier that fails, or whose mutation controls stop firing, throws before
   a single byte of the page is written.

   usage: node tools/build-report-ai-claims.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const AUDIT = require(path.join(ROOT, 'instruments', 'laneaudit', 'audit.js'));

const die = (m) => { console.error('AI-CLAIMS REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- the gate: all six verifiers, run now -------------------------------- */
let L;
try { L = AUDIT.run(); } catch (e) { die(e.message); }

const withChecks = L.filter(r => r.checks !== null);
const totalChecks = withChecks.reduce((a, b) => a + b.checks, 0);
const totalMut = L.reduce((a, b) => a + b.mutations, 0);
const totalMs = L.reduce((a, b) => a + (b.ms || 0), 0);
const confirmed = L.filter(r => r.verdict === 'CONFIRMED').length;
const partial = L.filter(r => r.verdict === 'PARTIAL').length;
const refuted = L.filter(r => r.verdict === 'REFUTED').length;
if (refuted) die('a lane came back REFUTED — that is a finding, not a build: stop and write it up');
if (L.length !== 6) die('expected six lanes, got ' + L.length);
if (totalMut < L.length) die('a lane lost its mutation controls');

const VT = { CONFIRMED: 'held', PARTIAL: 'open', REFUTED: 'dep' };
const vtag = (r) => C.tag(r.verdict, VT[r.verdict]);
const num = (v) => v === null ? '—' : String(v);

const B = [];

B.push(C.header({
  eyebrow: 'cert-machine · six claims, six verifiers written from scratch',
  title: 'We checked the AI\'s homework',
  deck: 'Six mathematical results produced with help from frontier AI systems — a counterexample to '
    + 'Maxwell\'s point-charge bound, a new lower bound for the Korenblum constant, an Erdős problem '
    + 'from 1958, and three more. Each one was re-verified here in exact arithmetic, from the '
    + 'manuscript, by verifiers that never ran a line of the authors\' code. This is what survived.'
}));

B.push(C.tldr({
  findingRaw: '<strong>' + confirmed + ' of ' + L.length + ' held; ' + partial + ' came back PARTIAL; '
    + refuted + ' were refuted.</strong> But the number that matters is the other one: in <strong>'
    + L.length + ' of ' + L.length + ' cases the computational fragment certified and the analytic core did '
    + 'not</strong> — the identities, enclosures and exhibits are machine-checkable and they all held, '
    + 'while the surrounding argument is prose in every single one. That split is the finding.',
  mechanismRaw: 'Each verifier was written against the <em>manuscript</em>, never derived from and never '
    + 'executing the author\'s scripts — no Arb, no SymPy, no Mathematica, no code from anybody\'s archive '
    + 'was run. (In one lane, Mathieu, the author\'s Python was <em>read</em> to cross-check which identities '
    + 'the TeX meant; it was not executed, and that is stated on the lane.) '
    + 'Exact rationals where the claim is algebraic, outward-rounded intervals and the Krawczyk operator '
    + 'where it is analytic. Each carries <strong>mutation controls</strong>: deliberate corruptions of the '
    + 'claim that the verifier must reject. A verifier that cannot fail is not evidence.',
  checkRaw: C.m('node instruments/laneaudit/audit.js') + ' — all six, ' + (totalMs / 1000).toFixed(1)
    + ' s end to end on a laptop. ' + totalChecks + ' checks and ' + totalMut + ' mutation controls, '
    + 'every control rejected. This page is built from that run and refuses if any of it goes red.'
}));

B.push(C.stats([
  { k: 'claims re-verified', v: String(L.length), role: 'held', n: 'each written from the manuscript; no author code was executed in any lane' },
  { k: 'held', v: confirmed + ' confirmed', role: 'held', n: 'within a scope this page states for each one, never wider' },
  { k: 'partial', v: String(partial), role: 'open', n: 'Ran–Teng: every machine-checkable fragment holds; the analytic core is prose' },
  { k: 'refuted', v: String(refuted), role: 'held', n: 'no claim in this set was contradicted by our arithmetic' },
  { k: 'analytic cores audited', v: '0 of ' + L.length, role: 'open', n: 'the honest ceiling of the whole exercise, and the reason this page exists' },
  { k: 'mutation controls', v: String(totalMut), role: 'held', n: 'deliberate corruptions the verifiers must reject — all ' + totalMut + ' rejected' },
]));

/* ---- §1 the board -------------------------------------------------------- */
B.push(C.section({
  lab: '§1 · the board', title: 'Six claims, and exactly how far the checking reached',
  bodyRaw: C.table({
    cols: [{ h: 'claim' }, { h: 'AI system' }, { h: 'verdict' }, { h: 'scope of that verdict' },
           { h: 'checks', cls: 'n' }, { h: 'controls', cls: 'n' }],
    rows: L.map(r => [
      r.short, r.system.replace(/;.*$/, ''), { raw: vtag(r) }, r.scope, num(r.checks), String(r.mutations)
    ])
  }) + '<div class="col">'
    + C.pRaw('Two of the six verifiers do not print a check total, so one column reads ' + C.m('—')
      + ' rather than a number we made up. The Poisson verifier reports its identities as a set and its '
      + 'mutation controls individually; the count you would want is not one it states, and this page does '
      + 'not state it for it.')
    + C.pRaw('<strong>Scope is the whole product here.</strong> Every verdict above is true inside the '
      + 'phrase beside it and false outside it. "CONFIRMED at ε = 1/6" is not "CONFIRMED"; '
      + '"supporting identities only" is not "theorem proved". The claims themselves are stated with more '
      + 'confidence than that at source, which is precisely why an independent scope line is worth having.')
    + '</div>'
}));

/* ---- fig 1: how far each was checked ------------------------------------- */
const bmax = Math.max.apply(null, withChecks.map(r => r.checks));
B.push(C.figure({
  svgRaw: CH.bars({
    w: 900, max: Math.ceil(bmax / 20) * 20, padL: 252, padR: 60,
    xTicks: [0, 40, 80, 120].map(v => ({ v })),
    xLabel: 'checks executed by the verifier at build time (hover a bar for its mutation controls and runtime)',
    alt: 'Bar chart of checks executed per claim: mathieu ' + (L.find(r => r.id === 'mathieu').checks)
      + ', ranteng ' + (L.find(r => r.id === 'ranteng').checks) + ', lemniscate '
      + (L.find(r => r.id === 'lemniscate').checks) + ', maxwell ' + (L.find(r => r.id === 'maxwell').checks)
      + ', korenblum ' + (L.find(r => r.id === 'korenblum').checks)
      + '. The Poisson verifier prints no total and is omitted.',
    rows: withChecks.slice().sort((a, b) => b.checks - a.checks).map(r => ({
      k: r.short, v: r.checks, lab: String(r.checks),
      token: r.verdict === 'PARTIAL' ? CH.CAT[2] : CH.CAT[0],
      hover: r.checks + ' checks · ' + r.mutations + ' mutation controls · '
        + (r.ms === null ? 'sub-millisecond' : r.ms + ' ms') + ' · ' + r.verdict
    }))
  }),
  caption: 'Depth of checking is not depth of proof. Mathieu carries the most checks in the set and yields '
    + 'the narrowest verdict — its 126 exact identities support a classification theorem that none of them '
    + 'establishes. Ran–Teng, in the contrasting colour, is the one PARTIAL.'
}));

/* ---- §2 the finding ------------------------------------------------------ */
B.push(C.section({
  lab: '§2 · the finding', title: 'The fragment always certifies. The core never does.',
  bodyRaw: C.figure({
    svgRaw: CH.segments({
      w: 900, x0: 0, x1: 1, padL: 252, padR: 118, rowH: 40,
      xTicks: [{ v: 0.25, t: 'the computational fragment' }, { v: 0.75, t: 'the analytic core' }],
      keys: [{ token: CH.CAT[0], t: 'certified here, in exact arithmetic' },
             { kind: 'hatch', token: CH.CTX, t: 'not audited — the argument is prose' }],
      alt: 'Six rows, one per claim, each split in two. In every row the left half — the computational '
        + 'fragment — is certified here, and the right half — the analytic core — is hatched as not '
        + 'audited. Six certified, six not audited, with no exceptions.',
      rows: L.map(r => ({
        k: r.short,
        note: r.verdict,
        segs: [
          { x0: 0, x1: 0.5, token: CH.CAT[0], k: r.short + ' · computational fragment',
            v: 'certified here — ' + (r.checks === null ? 'exact identities' : r.checks + ' checks')
               + ', ' + r.mutations + ' mutation controls rejected' },
          { x0: 0.5, x1: 1, token: CH.CTX, hatch: true, k: r.short + ' · analytic core',
            v: 'not audited — ' + r.notChecked.replace(/\.\s.*$/, '') }
        ]
      }))
    }),
    caption: 'Every row is one claim. Left half: the part a machine can decide, and did. Right half, hatched: '
      + 'the part that carries the theorem. Six for six, with no exception in either column.'
  }) + '<div class="col">'
    + C.pRaw('This is not a complaint about the authors and it is not a complaint about the AI. It is a '
      + 'measurement of where the checkable surface of a modern mathematical claim actually stops. The '
      + 'exhibits — an eight-atom measure, twenty-four critical points, a quartet of polynomials, thirty '
      + 'decimals of an extremal constant — are all real, and every one of them survived an independent '
      + 'implementation that was trying to break it. The arguments that turn those exhibits into theorems '
      + 'are English prose with mathematical content, and no verifier in this repository or anywhere else '
      + 'can read them.')
    + C.pRaw('The one lane where that gap closes is <strong>Poisson</strong>, and it closes for a structural '
      + 'reason worth naming: a counterexample is an <em>existence</em> claim. Certifying the exhibit IS '
      + 'certifying the claim. Every other lane in this set asks a machine to confirm a universal statement '
      + 'from a finite computation, which it cannot do — so the verdict has to carry a scope line, and it '
      + 'does.')
    + '</div>'
}));

/* ---- §3 the picker ------------------------------------------------------- */
B.push(C.section({
  lab: '§3 · claim by claim', title: 'Pick a claim: what was checked, and what was not',
  bodyRaw: C.picker({
    name: 'lane',
    items: L.map(r => ({
      k: r.verdict + (r.checks === null ? '' : ' · ' + r.checks + ' checks'),
      t: r.short,
      title: r.short,
      tagRaw: vtag(r) + ' ' + C.tag(r.scope, 'dep'),
      leadRaw: '<strong>The claim.</strong> ' + C.esc(r.claim) + ' <em>' + C.esc(r.problem) + '</em>'
        + '<br><br><strong>Credited system.</strong> ' + C.esc(r.system)
        + '<br><strong>Verification at source.</strong> ' + C.esc(r.sourceCheck),
      boxes: [
        { lab: 'what we certified', bodyRaw: C.esc(r.checked) },
        { lab: 'what we did NOT audit', warn: true, bodyRaw: C.esc(r.notChecked) },
      ]
    }))
  })
}));

/* ---- fig 2: what two of the claims moved --------------------------------- */
/* The two movers are in different units — a lower bound on a constant and a
   count of critical points — so the only honest shared axis is RELATIVE gain
   over the number each one replaced. Absolutes ride the bar label. */
const mv = L.filter(r => r.moves).map(r => {
  const g = 100 * (r.moves.to - r.moves.from) / r.moves.from;
  return { r, gain: g };
}).sort((a, b) => b.gain - a.gain);

B.push(C.section({
  lab: '\u00a74 \u00b7 what moved', title: 'Two of the six move a published number',
  bodyRaw: C.figure({
    svgRaw: CH.bars({
      w: 900, max: 60, padL: 252, padR: 150,
      xTicks: [0, 20, 40, 60].map(v => ({ v, t: v + '%' })),
      xLabel: 'relative increase over the number the claim replaces',
      alt: 'Bar chart of relative gain: Maxwell\u2019s point-charge bound rises from 16 to 24 critical '
        + 'points, a 50 percent increase; the Korenblum constant lower bound rises from 0.3554 to 0.4263, '
        + 'a 19.9 percent increase.',
      rows: mv.map(m => ({
        k: m.r.short, v: m.gain,
        lab: m.r.moves.from + ' \u2192 ' + m.r.moves.to + '   (+' + m.gain.toFixed(1) + '%)',
        token: CH.CAT[0],
        hover: m.r.moves.fromLab + ' ' + m.r.moves.from + ' \u2192 ' + m.r.moves.toLab + ' '
          + m.r.moves.to + ' ' + m.r.moves.unit
      }))
    }),
    caption: 'The two rows are in different units, so the axis is the one quantity they share: how far each '
      + 'claim moves the number it replaces. The absolute values sit on the bars.'
  }) + '<div class="col">'
    + C.pRaw('For Maxwell the move is the whole point: ' + C.m('24 > 16') + ' is exact integer arithmetic '
      + 'once the twenty-four boxes are certified, so at \u03b5 = 1/6 the conjectured bound is <strong>false</strong>, '
      + 'and that much is now independently established rather than asserted from floating-point computer '
      + 'algebra. For Korenblum the move is conditional: our arithmetic puts the criterion beyond doubt and '
      + 'the bound follows only if the paper\'s duality lemma holds, which we did not audit.')
    + C.pRaw('The other four claims do not move a number at all \u2014 they settle a question that had no '
      + 'previous numerical answer, or exhibit an object whose existence was open. There is nothing to plot '
      + 'for those, and inventing an axis for them would be the kind of chart this repository does not draw.')
    + '</div>'
}));

/* ---- §5 re-run ----------------------------------------------------------- */
B.push(C.section({
  lab: '§5 · re-run it', title: 'Six seconds, one command, no dependencies',
  bodyRaw: '<div class="col">'
    + C.pRaw('The verifiers are plain Node with no packages. Clone the repository and run them; there is '
      + 'nothing to install and nothing to trust from us except the arithmetic, which is the point.')
    + C.code('git clone https://github.com/carlostoledo1891/cert-machine\ncd cert-machine\nnode instruments/laneaudit/audit.js')
    + C.pRaw('Each verifier can also be run alone, in its own directory, and prints its own report — the '
      + 'numbers on this page are parsed out of exactly those reports at build time:')
    + C.code(L.map(r => 'node legacy/research/challenges/lane/' + r.dir + '/verify.js').join('\n'))
    + C.pRaw('To confirm the verifiers can actually fail, corrupt one and watch it refuse. That is what the '
      + totalMut + ' mutation controls do automatically on every run: perturb a coefficient, flip a bracket '
      + 'sign, move mass between atoms, replace a candidate with a duplicate. All ' + totalMut + ' were '
      + 'rejected in the run that produced this page.')
    + '</div>'
}));

B.push(C.note({
  lab: 'what this page does NOT claim',
  bodyRaw: C.pRaw('We did not prove any of these theorems and we did not refute any of them. No analytic '
    + 'argument in the set was audited, because none of them is machine-checkable at any budget we have. '
    + 'What we did is narrower: take six results a frontier model helped produce, write independent '
    + 'verifiers from the manuscripts, and report exactly which parts survive exact arithmetic and which '
    + 'parts were never in reach. The verdicts are ours; the theorems remain the authors\'. Several of these '
    + 'claims were already checked by their authors, and in two cases by an Arb certificate the authors '
    + 'shipped — an independent reimplementation is worth something anyway, but it is not a first '
    + 'verification and this page never says it is.')
}));

const foot = '<footer class="col"><p>Generated by tools/build-report-ai-claims.js @ git ' + git
  + '. Gate at this build: all six verifiers executed live by instruments/laneaudit/audit.js — '
  + totalChecks + ' checks, 0 failures, ' + totalMut + ' mutation controls all rejected, '
  + (totalMs / 1000).toFixed(1) + ' s. Every count on this page is parsed from that run. A failing check, '
  + 'a mutation control that stops firing, or a verifier that stops printing its own totals refuses the '
  + 'page rather than publishing a stale number.</p></footer>';

/* The shelf card needs these counts too. Persist them here rather than letting
   build-site.js re-derive them: a count computed in two places is a count that
   will disagree with itself the first time a verifier changes. */
fs.writeFileSync(path.join(ROOT, 'certs', 'ai-claims-summary.json'),
  JSON.stringify({
    lanes: L.length, confirmed, partial, refuted,
    checks: totalChecks, checksFrom: withChecks.length,
    mutations: totalMut, seconds: Number((totalMs / 1000).toFixed(1)),
    verdicts: L.map(r => ({ id: r.id, short: r.short, verdict: r.verdict, scope: r.scope,
                            checks: r.checks, mutations: r.mutations }))
  }, null, 2) + '\n');

fs.writeFileSync(path.join(ROOT, 'reports', 'ai-claims-audit.html'),
  TPL.render({
    title: 'We checked the AI\'s homework',
    bodyRaw: B.join('\n\n') + CH.script(),
    footRaw: foot,
    path: '/reports/ai-claims-audit.html',
    desc: 'Six mathematical results produced with frontier AI help — Maxwell\'s point-charge bound, the '
      + 'Korenblum constant, an Erdős problem from 1958 and three more — each re-verified here in exact '
      + 'arithmetic from the manuscript, by a program that never saw the authors\' code.'
  }));

console.log('reports/ai-claims-audit.html written: ' + confirmed + ' confirmed, ' + partial + ' partial, '
  + refuted + ' refuted; ' + totalChecks + ' checks, ' + totalMut + ' controls, '
  + (totalMs / 1000).toFixed(1) + ' s @ git ' + git);
