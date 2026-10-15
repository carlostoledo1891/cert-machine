#!/usr/bin/env node
/* build-report-wowii.js — reports/wowii-counterexamples.html: five Written-on-the-Wall-II conjectures and the explicit
   counterexamples filed against them on formal-conjectures, decided. Every number comes from certs/wowii-ledger.json
   (tools/run-wowii-ledger.py), re-derived here before a word is written, and from the battery's own count.

   usage: node tools/build-report-wowii.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('WOWII REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const py = (args) => cp.execFileSync('python3', ['-I'].concat(args), { cwd: ROOT, encoding: 'utf8' });

try { py(['tools/run-wowii-ledger.py']); } catch (e) { die('the ledger does not re-derive: ' + (e.stdout || e.message)); }
let bat = ''; try { bat = py(['instruments/wowii/battery.py']); } catch (e) { die('the battery did not pass: ' + (e.stdout || e.message)); }
const bm = /wowii battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(bat);
if (!bm || bm[2] !== bm[3]) die('the battery did not pass whole');
const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'wowii-ledger.json'), 'utf8'));
const rows = L.rows;
if (rows.length !== 5 || rows.some((r) => r.verdict !== 'CERTIFIED')) die('the page says five counterexamples hold — the record no longer does; rewrite it');
const R = (id) => rows.find((r) => r.id === 'wowii-' + id);
const tag = (v) => C.tag(v, v === 'CERTIFIED' ? 'held' : v === 'REFUTED' ? 'fail' : 'dep');
const r360 = R('360'), r396 = R('396'), r395 = R('395b'), r353 = R('353'), r373 = R('373');

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · audit · five Graffiti.pc conjectures, 2009–2010',
  title: 'Written on the Wall II: five counterexamples, decided',
  deck: 'On 2026-10-14 one account filed sixty issues and twenty-three pull requests on DeepMind\'s formal-conjectures repository, each a Written-on-the-Wall-II conjecture of DeLaViña\'s '
    + 'Graffiti.pc with a Lean statement, a "research solved" tag and a disproof manuscript. Five of them — three on total domination in trees, two on 2-domination in connected graphs — '
    + 'come with explicit witness graphs. All five witnesses are rebuilt here from the author\'s own Lean tables and decided in exact arithmetic from the archive\'s definitions: every one '
    + 'refutes its conjecture, by the margins the author states. Two notes on the statements and one on provenance: the author\'s fork had rewritten the cited commits before this page was built.'
}));
B.push(C.scope('The conjectures: WOWII 353, 360, 373 (18 Feb 2009) and 395b, 396 (Jan 2010), open in DeLaViña\'s archive (cms.uhd.edu/faculty/delavinae/research/wowII), read from the Internet Archive\'s '
  + '2010 and 2016 snapshots of open.html and the live definitions file; the claims: issues #7304, #7305, #7306, #7308, #7330 and PRs #7310, #7321, #7322, #7320, #7337 on google-deepmind/formal-conjectures '
  + '(author RhudeJJJJ, self-identified Jonas J. Gebendorfer, Codex-assisted; sorry-proofs with a formal_proof link to the author\'s fork). Every byte pinned by sha256 in corpus/wowii/PINS.json; no Lean built, '
  + 'no claimant code run. Pre-registered in corpus/wowii/preregistration.json. What is decided: that each graph is a counterexample to the archive\'s inequality. Not decided: the manuscripts\' infinite families, '
  + 'or whether the Lean proofs in the fork compile.'));
B.push(C.tldr({
  findingRaw: '<b>All five graphs refute their conjectures.</b> 353: γ_t = ' + r353.lhs + ' against a right side of ' + C.esc(r353.rhs) + ' on a 25-vertex tree. 360: γ_t = ' + r360.lhs + ' against ' + C.esc(r360.rhs)
    + ' (and ' + C.esc(r360.rhsWithoutTheHalf) + ' without the ½ the 2026 archive copy dropped — either way). 373: γ_t = ' + r373.lhs + ' against ' + C.esc(r373.rhs) + ' on 150 vertices. 396: γ₂ = ' + r396.lhs + ' against ' + r396.rhs
    + ' on six bridged cliques. 395b: γ₂ = ' + r395.lhs + ' against ' + r395.rhs + ' on three. <b>Two notes on the Lean statements:</b> 395b adds a hypothesis the archive does not have (V ∖ A nonempty — needed because δ(G[V∖A]) is undefined on regular graphs; it weakens the universal, and the witness satisfies it); '
    + '396 writes dd_mode as the number of modes, which definition 45 leaves undefined for a unique mode — moot here, the witness has two. <b>Provenance:</b> the five formal_proof links 404 since ~20:45 UTC on 10-15 and the fork\'s main no longer carries the files; the copies decided here were fetched at 17:14 UTC and are pinned.',
  mechanismRaw: 'Standard library, exact: γ_t by a tree dynamic programme sandwiched by the author\'s explicit sets (upper) and vertices with pairwise disjoint open neighbourhoods (lower); γ₂ by exhaustion over 2¹⁵ subsets, or on 39 vertices by the private-vertex argument — each clique keeps two vertices with no outside neighbour, '
    + 'forcing two per clique into every 2-dominating set — met by an explicit set; components, eccentricities, centres, periphery, modes and averages as rationals. The DP equals brute force on 25 random trees.',
  checkRaw: C.m('python3 -I tools/run-wowii-ledger.py') + ' · ' + C.m('python3 -I instruments/wowii/battery.py') + ' — ' + bm[1] + ' checks, ' + bm[3] + ' red controls.'
}));
B.push(C.stats([
  { k: 'conjectures refuted', v: '5 of 5', n: 'Open in the archive since 2009–2010; every witness as the author built it.' },
  { k: 'largest witness', v: '150', n: 'Vertices, for 373; γ_t = 12 against 19676/1639.' },
  { k: 'margin', v: '1', n: 'The clique graphs beat their bounds by two (396) and one (395b); the trees by ½, 1/160 and 8/1639.' },
  { k: 'statement notes', v: '2', n: 'A hypothesis added to 395b; dd_mode on a unique mode in 396. Neither touches the witnesses.' }
]));
B.push(C.section({
  lab: '§1 · the five', title: 'Each inequality on its witness', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'WOWII' }, { h: 'the inequality' }, { h: 'witness' }, { h: 'left side' }, { h: 'right side' }, { h: 'verdict' }],
    rows: rows.map((r) => [{ raw: C.esc(r.id.replace('wowii-', '')) }, { raw: C.esc(r.conjecture.replace(/^WOWII \S+ \([^)]*\): /, '').split(',')[0]) },
      { raw: C.esc(r.graph.n + ' vertices, ' + r.graph.m + ' edges' + (r.graph.tree ? ', a tree' : ', connected')) }, { raw: C.esc(String(r.lhs)) }, { raw: C.esc(String(r.rhs)) }, { raw: tag(r.verdict) }])
  }) + C.pRaw('A CERTIFIED row says the graph is a counterexample: the inequality fails on it by exact arithmetic. Left sides are domination numbers decided exactly (the DP, the exhaustion, or the private-vertex argument met by a set); right sides are the archive\'s expressions as rationals.')
}));
B.push(C.section({
  lab: '§2 · how each side was decided', title: 'The deciders, row by row',
  bodyRaw: C.plainList(rows.map((r) => ({ b: r.id.replace('wowii-', 'WOWII ') + '.', text: r.how })))
}));
B.push(C.section({
  lab: '§3 · the statements', title: 'The Lean against the archive',
  bodyRaw: C.plainList(rows.map((r) => ({ b: r.id.replace('wowii-', 'WOWII ') + '.', text: r.leanReading })))
    + C.pRaw('On 360 the archive\'s own copies disagree: the Internet Archive\'s 2010 and 2016 snapshots carry "½ · dist_avg(C,V)" as the byte 0xBD; the 2026 copy the author first read shows a blank there. The ½ is original. The witness refutes both readings, so nothing turns on it.')
}));
B.push(C.section({
  lab: '§4 · limits', title: 'What is not decided here',
  bodyRaw: C.plainList([
    { b: 'The manuscripts\' families.', text: 'Each paper claims infinitely many counterexamples (every order ≥ 150 for 373; 39r vertices for 396); only the one explicit witness of each is decided.' },
    { b: 'The fork\'s Lean.', text: 'Whether the author\'s proofs compile is not checked; the witnesses are read from them as data. Their statements were compared with the archive by reading.' },
    { b: 'Priority and the sixty issues.', text: 'The other fifty-five issues and eighteen PRs of the same account are not examined; nothing is said about them.' },
    { b: 'Same-author second implementation.', text: 'The DP and the brute force are the same author\'s; the sandwich certificates (the author\'s sets and the disjoint-neighbourhood lower bounds) are the independent leg.' }
  ])
}));
const foot = '<p>' + C.esc('Generated by tools/build-report-wowii.js from certs/wowii-ledger.json (' + L.generated + '), re-derived at build; battery ' + bm[1] + ' checks, ' + bm[3] + ' red controls; @ git ' + git + '.') + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'wowii-counterexamples.html'), TPL.render({
  title: 'Written on the Wall II: five counterexamples, decided · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'Five Graffiti.pc conjectures open since 2009–2010 and the explicit counterexamples filed against them on formal-conjectures, rebuilt from the author\'s Lean tables and decided in exact arithmetic.',
  path: '/reports/wowii-counterexamples.html'
}));
console.log('reports/wowii-counterexamples.html written: ' + rows.length + ' rows, all certified @ git ' + git);
