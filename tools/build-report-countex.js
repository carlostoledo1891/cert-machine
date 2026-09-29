#!/usr/bin/env node
/* build-report-countex.js — reports/counterexample-machine.html: an AI counterexample library, decided case by case.
   Every number comes from certs/countex-ledger.json (tools/run-countex-ledger.py), re-derived here (--check) before a
   word is written, and from the battery's own count.

   usage: node tools/build-report-countex.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('COUNTEX REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const py = (args) => cp.execFileSync('python3', args, { cwd: ROOT, encoding: 'utf8' });

try { py(['tools/run-countex-ledger.py', '--check']); } catch (e) { die('the ledger does not re-derive: ' + (e.stdout || e.message)); }
let bat = ''; try { bat = py(['instruments/countex/battery.py']); } catch (e) { die('the battery did not pass: ' + (e.stdout || e.message)); }
const bm = /countex battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(bat);
if (!bm || bm[2] !== bm[3]) die('the battery did not pass whole');
const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'countex-ledger.json'), 'utf8'));
const rows = L.rows, n = rows.length, cert = rows.filter((r) => r.verdict === 'CERTIFIED'), part = rows.filter((r) => r.verdict === 'PARTIAL');
if (cert.length + part.length !== n) die('a case is neither certified nor partial');
const dpp = rows.find((r) => r.id === 'dpp-feasible-step');
if (!dpp || dpp.verdict !== 'PARTIAL' || dpp.kind !== 'depends-on-reading') die('the DPP case is no longer the reading-dependent one the page describes');
const words = (k) => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][k] || String(k);
const lines = fs.readdirSync(path.join(ROOT, 'instruments', 'countex', 'cases')).filter((f) => f.endsWith('.py'))
  .reduce((a, f) => a + fs.readFileSync(path.join(ROOT, 'instruments', 'countex', 'cases', f), 'utf8').split('\n').length, 0);
const byFinder = rows.reduce((o, r) => { for (const f of r.foundBy) { const k = /GPT|OpenAI|Codex/i.test(f.by) ? 'an OpenAI model' : /Opus/i.test(f.by) ? 'a Claude model' : 'by hand'; o[k] = (o[k] || 0) + 1; } return o; }, {});
const partWords = { 'aim-problems': 'one of four results rests on cited universal theorems', 'lorentzian-jensen': 'one of two results needs bodies only a cited theorem supplies', 'odonnell-matrix-conjecture': 'the all-m step is argued in prose', 'variance-only-matrix-discrepancy': 'the all-m step is argued in prose', 'dpp-feasible-step': 'it holds under one of the two definitions of "feasible" its own text gives' };

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · audit · an AI counterexample library',
  title: 'The counterexample machine, decided',
  deck: 'Suvrit Sra\'s open library of counterexamples, most of them found by language models, decided case by case by programs that '
    + 'read the published certificate and never the authors\' checker. Every case\'s mathematics holds where it can be decided; '
    + words(part.length - 1) + ' cases rest partly on a cited theorem or an argument over all m, and one holds under only one of the two definitions its own text gives.'
}));
B.push(C.scope('The library: github.com/suvrit/count-ex-machina at commit ' + L.source.commit.slice(0, 8) + ' (Apache-2.0), the companion of arXiv '
  + '2608.29595, "GPT, the Counterexample Machine". Fourteen cases, mirrored verbatim in corpus/countex. What is decided is each counterexample '
  + 'as the case states it; what the library\'s authors chose to call a conjecture is theirs. Nothing has been sent to them.'));
B.push(C.tldr({
  findingRaw: '<b>' + cert.length + ' of ' + n + ' cases CERTIFIED whole; ' + part.length + ' PARTIAL, and no case REFUTED.</b> The partial ones: '
    + part.map((r) => C.esc(r.title) + ' (' + partWords[r.id] + ')').join('; ') + '. <b>The DPP case</b> defines "feasible" twice: as keeping the iterate positive '
    + 'definite, under which a = 5 descends and the conjecture falls, and as Prop. A.1\'s bound, about 1.90 here, which a = 5 exceeds. <b>None of the fourteen '
    + 'checkers reads the published certificate</b>: each writes it from a witness in its own code.',
  mechanismRaw: 'One standard-library program per case (' + lines.toLocaleString('en-US') + ' lines in all), written from the case\'s statement before its '
    + 'verify.py was read, reading the published artifact, recomputing every number the case prints and comparing it as a separate check. Exact rationals '
    + 'and integers; where a transcendental enters, decimal intervals in named contexts with a proved series tail. Each program also decides a FORGE — the '
    + 'certificate changed by the smallest amount that breaks it — which must not certify.',
  checkRaw: C.m('python3 tools/run-countex-ledger.py --check') + ' · ' + C.m('python3 instruments/countex/battery.py') + ' — ' + bm[1] + ' checks, '
    + bm[3] + ' forges refused.'
}));
B.push(C.stats([
  { k: 'cases decided', v: String(n), n: 'Found by ' + Object.entries(byFinder).map(([k, v]) => v + ' ' + k).join(', ') + ' (a case can credit several).' },
  { k: 'certified whole', v: String(cert.length), n: 'Every fact the counterexample needs, re-derived from the published artifact.' },
  { k: 'partly', v: String(part.length), n: 'A certified part beside a part that rests on a cited theorem, an argument over all m, or a reading.' },
  { k: 'checkers that read the certificate', v: '0', n: 'Of fourteen. Each writes it; the library\'s CI checks that the written file equals the committed one.' }
]));
/* a checker's own code, quoted between backticks in the ledger, is set in mono rather than shown with its backticks */
const code = (t) => t.split('`').map((seg, i) => (i % 2 ? C.m(seg) : C.esc(seg))).join('');
const finders = (r) => [...new Set(r.foundBy.map((f) => f.by.replace(/^bugfixed by /, '')))].join(', ') || '—';
B.push(C.section({
  lab: '§1 · the cases', title: 'Fourteen counterexamples, one verdict each', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'verdict' }, { h: 'case' }, { h: 'found by' }],
    rows: rows.map((r) => [{ raw: C.tag(r.verdict, r.verdict === 'CERTIFIED' ? 'held' : 'dep') }, { raw: C.esc(r.title) }, { raw: C.esc(finders(r)) }])
  })
}));
B.push(C.section({
  lab: '§2 · case by case', title: 'What is decided, and what the authors\' checker does',
  bodyRaw: C.plainList(rows.map((r) => ({
    b: r.title + ' — ' + r.verdict + '.',
    raw: C.esc('Decided: ' + r.scope + '. Found by ' + [...new Set(r.foundBy.map((f) => f.by + (f.when ? ' (' + f.when + ')' : '')))].join('; ') + '. Their checker: ') + code(r.theirChecker)
  })))
}));
B.push(C.section({
  lab: '§3 · one case, two definitions', title: 'When is a step feasible?',
  bodyRaw: [
    C.pRaw('The DPP case refutes a conjecture of Mariet and Sra (2015): that every feasible Picard step a ≥ 1 increases the log-likelihood. Its context '
      + 'paragraph says a step "is feasible when it keeps the iterate positive definite, which the source guarantees for a ≤ 1/(1 − γ)"; its statement '
      + 'block says "feasibility is the bound a ≤ 1/(1 − γ) of Prop. A.1". The witness takes a = 5.'),
    C.plainList([
      { b: 'Under the first reading it holds.', text: 'L₀ and L₁ = L₀ + 5·L₀ΔL₀ are both positive definite, and the log-likelihood falls: decided exactly, every printed number reproduced.' },
      { b: 'Under the second it refutes nothing.', text: 'For this L₀ the bound 1/(1 − γ) is about 1.90, and a = 5 is outside it. The steps tried inside the bound — a = 1, 3/2, 9/5 and 1899/1000 — all ascend.' }
    ]),
    C.pRaw('The source\'s own sentence, "Prop. A.1 presents an easily computable upper bound on feasible a", reads more naturally the first way, so the '
      + 'counterexample stands for the conjecture as posed. What it does not show is a descending step that Prop. A.1\'s bound admits; that question '
      + 'is still open, and the case\'s statement block, as written, asks it.')
  ].join('\n')
}));
B.push(C.section({
  lab: '§4 · the checkers', title: 'What a checker that writes its certificate proves',
  bodyRaw: [
    C.pRaw(code(L.theirCheckers)),
    C.pRaw('That design makes each certificate reproducible, which is worth having. It does not let anyone check a certificate they were handed, and '
      + 'several checkers type in what they should compute: a diagonal assigned rather than built, a residual formula written in, a Kostka matrix copied, '
      + 'a sign settled by SymPy\'s numerical evaluation, two tails left to Sage scripts the Python checker does not run. In every case the mathematics '
      + 'survives the stricter decision here; the point is where the rigor sits.')
  ].join('\n')
}));
B.push(C.section({
  lab: '§5 · limits', title: 'What is not decided here',
  bodyRaw: C.plainList([
    { b: 'Universal theorems a case cites.', text: 'Marcus 1963 and Lieb 1966 for the AIM Problem 35; Shephard\'s realization theorem for the log-volume distance. Their conclusions are used, not re-derived.' },
    { b: 'Arguments over all m.', text: 'Refuting a universal constant needs a family that is unbounded; the finite members are certified (to m = 11 and m = 10) and the step to all m is prose, checked by hand here and not by code.' },
    { b: 'The deciders\' origin.', text: 'They were written in this session by three parallel agents, each from the statements before reading the authors\' checkers, and are published with the ledger; they are checked by their forges and by agreement with every printed number, not by a second independent implementation.' }
  ])
}));
const foot = '<p>' + C.esc('Generated by tools/build-report-countex.js from certs/countex-ledger.json (' + L.generated + '), re-derived at build; battery ' + bm[1] + ' checks, ' + bm[3] + ' forges refused.') + '</p><p>' + C.esc('git ' + git) + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'counterexample-machine.html'), TPL.render({
  title: 'The counterexample machine, decided · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'S. Sra\'s open library of AI-found counterexamples (arXiv 2608.29595), decided case by case by standard-library programs that read the published certificates: ' + cert.length + ' of ' + n + ' certified whole, ' + part.length + ' partly, none refuted — and none of the authors\' checkers reads the certificate it publishes.',
  path: '/reports/counterexample-machine.html'
}));
console.log('reports/counterexample-machine.html written: ' + cert.length + ' certified, ' + part.length + ' partial of ' + n + ' @ git ' + git);
