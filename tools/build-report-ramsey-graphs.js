#!/usr/bin/env node
/* build-report-ramsey-graphs.js — reports/ramsey-graphs.html: the 18 Ramsey lower-bound graphs Google released with
   AlphaEvolve (arXiv 2603.09172; google-research 0d94f8c4), each decided by an exhaustive clique search written here.
   Every number comes from certs/ramsey-ledger.json (tools/run-ramsey-ledger.py), which is re-checked first (--check: the
   pins, the small graphs re-searched by both implementations, the long searches re-read from their per-root records,
   the red controls) before a word is written. The gaps lead, dated at the pin.

   usage: node tools/build-report-ramsey-graphs.js                                                                    MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('RAMSEY GRAPHS PAGE REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
const GH = 'https://github.com/carlostoledo1891/cert-machine';

let chk = '';
try { chk = cp.execFileSync('python3', ['-I', 'tools/run-ramsey-ledger.py', '--check'], { cwd: ROOT, encoding: 'utf8' }); } catch (e) { die('the ledger does not re-check: ' + (e.stdout || e.stderr || e.message)); }
const cm = /ramsey-ledger: (\d+) claims held to the pins; (\d+) sides re-searched identically; red controls fired/.exec(chk);
if (!cm) die('the check did not pass whole: ' + chk.trim());
const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'ramsey-ledger.json'), 'utf8'));
const P = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'ramsey', 'alphaevolve', 'PINS.json'), 'utf8'));
if (L.rows.length !== 18) die('expected the 18 released files, the ledger has ' + L.rows.length);

/* what the release's own verifier is, read from the pinned notebook (not run) */
const NB = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'ramsey', 'alphaevolve', 'verify_bounds.ipynb'), 'utf8'));
const code = NB.cells.filter((c) => c.cell_type === 'code');
const src = code.map((c) => [].concat(c.source).join('')).join('\n');
const nbOutputs = code.reduce((a, c) => a + (c.outputs || []).length, 0);
const nbExecuted = code.some((c) => c.execution_count !== null && c.execution_count !== undefined);
const upperOnly = /for i in range\(side\) for j in range\(i \+ 1, side\) if rows\[i\]\[j\] == 1/.test(src);
const listsAll = /\.cliques\(min=r, max=r\)/.test(src) && /\.cliques\(min=s, max=s\)/.test(src);
if (!upperOnly || !listsAll) die('the notebook no longer reads as this page describes it');

const m = (s) => '<span class="m">' + C.esc(s) + '</span>';
const num = (n) => Number(n).toLocaleString('en-US');
const secs = (s) => (s === null || s === undefined ? '—' : s < 90 ? Math.round(s * 10) / 10 + ' s' : s < 5400 ? Math.round(s / 6) / 10 + ' min' : Math.round(s / 360) / 10 + ' h');
const cnt = (w) => L.counts[w] || 0;
const rows = L.rows.slice().sort((a, b) => a.n - b.n);
const small = rows.filter((r) => r.n <= L.method.refMax), large = rows.filter((r) => r.n > L.method.refMax);
const sideCell = (x) => (x.found ? 'FOUND ' + x.found.length + ' (' + x.found.join(', ') + ')' : x.complete ? 'none · ' + num(x.nodes) + ' nodes' : x.rootsDone + ' / ' + x.roots + ' roots · ' + num(x.nodes) + ' nodes');
const refused = rows.filter((r) => r.verdict === 'REFUSED');

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · audit · AlphaEvolve\'s Ramsey graphs · found 2026-10-23 at google-research ' + P.commit.slice(0, 8),
  title: 'AlphaEvolve\'s Ramsey lower bounds, each graph decided',
  deck: 'With AlphaEvolve (arXiv 2603.09172) Google released 18 graphs, one per claimed lower bound on a Ramsey number R(s, t). A graph on m − 1 vertices with no clique of size s and no independent set of size t proves R(s, t) ≥ m. '
    + 'Here each file is read as a simple graph and both properties are decided by an exhaustive search written from the definition, in two implementations held to each other root by root: '
    + cnt('CERTIFIED') + ' of 18 CERTIFIED' + (cnt('REFUTED') ? ', ' + cnt('REFUTED') + ' REFUTED' : '') + (cnt('REFUSED') ? ', ' + cnt('REFUSED') + ' still searching' : '') + '.'
}));
B.push(C.scope('Published, not peer-reviewed. The graphs and the bounds are Google\'s (Apache-2.0), copied unmodified from github.com/google-research/google-research at ' + P.commit.slice(0, 8)
  + ' and pinned by sha256; their sha256 equal those maximusrufus published with the same files (cert-machine#1). Neither Google\'s notebook nor maximusrufus\'s checker was run or read for this decision. '
  + 'A CERTIFIED file proves its bound; whether the bound is new is the paper\'s claim, not checked here.'));

B.push(C.tldr({
  findingRaw: '<b>' + cnt('CERTIFIED') + ' of 18 files prove their bounds' + (cnt('REFUTED') ? '; ' + cnt('REFUTED') + ' do not' : '; none fails') + '.</b> '
    + 'All 18 are simple graphs of the order their names claim. The ' + small.length + ' graphs up to ' + L.method.refMax + ' vertices were searched to the end on both sides by both implementations, with equal node counts at every root. '
    + (refused.length ? 'Of the ' + large.length + ' large graphs, every clique side is closed; the independent-set side of ' + refused.map((r) => r.claim).join(', ') + ' is still being searched (' + refused.map((r) => r.I.rootsDone + '/' + r.I.roots + ' roots').join(', ') + '). '
      : 'The ' + large.length + ' large graphs were searched to the end too, by the fast implementation, every finished root on record. ')
    + 'Two gaps in the release\'s own check, neither of which changes a verdict, lead below.',
  mechanismRaw: 'For each side, every clique of the forbidden size would start at its lowest-ranked vertex in a smallest-last order and lie among that vertex\'s later neighbours; each such root is searched with a greedy colouring as the bound '
    + '(c colour classes are independent sets, so no clique among them is larger than c). A branch closes only on that bound or on too few candidates — both theorems — so "none" means none. A "found" answer would print the vertices and be re-checked edge by edge without the search.',
  checkRaw: m('python3 tools/run-ramsey-ledger.py --check') + ' re-checks the pins, re-searches the small graphs with both implementations, re-reads every long search from its per-root record, fires a planted triangle and a planted independent set, refuses four malformed matrices and decides 24 random graphs both ways (seconds); '
    + m('python3 tools/run-ramsey-ledger.py --only R_8_12_ge_511 --budget 0') + ' re-runs a long search from nothing.'
}));
B.push(C.stats([
  { k: 'files decided', v: Object.entries(L.counts).map(([w, n]) => n + ' ' + w).join(' · '), n: 'Google\'s 18 released graphs, google-research ' + P.commit.slice(0, 8) + ', ramsey_number_bounds/improved_bounds.' },
  { k: 'both implementations', v: small.length + ' of ' + small.length, n: 'Graphs up to ' + L.method.refMax + ' vertices: the C kernel and the Python reference count the same search nodes at every root, on both sides.' },
  { k: 'largest search closed', v: (() => { const done = rows.flatMap((r) => [r.K, r.I]).filter((x) => x.complete && !x.found); const b = done.reduce((a, x) => (x.nodes > a.nodes ? x : a), done[0]); return num(b.nodes) + ' nodes'; })(), n: 'One side, every root to the end.' },
  { k: 'release\'s own check', v: nbExecuted || nbOutputs ? 'ran' : 'unexecuted', n: 'verify_bounds.ipynb ships with ' + nbOutputs + ' outputs and no execution count.' }
]));

/* §1 the gaps */
B.push(C.section({
  lab: '§1 · the gaps', title: 'What the release\'s own check leaves out',
  bodyRaw: [
    C.note({ lab: 'G1 · record · found 2026-10-23', bodyRaw: C.pRaw('<b>The verifier ships unexecuted.</b> The release\'s check is a notebook, ' + m('verify_bounds.ipynb') + ', which lists every clique of size s in the graph and every clique of size t in its complement with igraph\'s '
      + m('cliques(min=k, max=k)') + '. It is published with ' + nbOutputs + ' output cells and no execution count, so the release carries no record that the check was run on any file, or how long the five large ones took. ')
      + C.pRaw('<b>What would close it.</b> The notebook\'s output, or the run\'s log and timing, beside the files.') }),
    C.note({ lab: 'G2 · reading · found 2026-10-23', bodyRaw: C.pRaw('<b>Half the matrix is read.</b> The notebook builds the graph from the entries above the diagonal that equal 1. Symmetry and the diagonal are never looked at, and an entry other than 0 or 1 would be read as "no edge". '
      + 'All 18 files are in fact symmetric 0/1 matrices with a zero diagonal (checked here, ' + m('instruments/ramsey/graph.py') + '), so no verdict changes; a file that was not would have been "verified" as the graph of its upper triangle.')
      + C.pRaw('<b>What would close it.</b> Three assertions before the graph is built: square, symmetric, zero diagonal, entries in {0, 1}.') })
  ].join('\n')
}));

/* §2 the decisions */
B.push(C.section({
  lab: '§2 · the decisions', title: 'Every file, both sides', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'claim' }, { h: 'vertices' }, { h: 'no s-clique (K side)' }, { h: 'no independent t-set (I side)' }, { h: 'both implementations' }, { h: 'verdict' }],
    rows: rows.map((r) => [r.claim, String(r.n), sideCell(r.K), sideCell(r.I), r.n <= L.method.refMax ? 'yes, root by root' : 'kernel; roots on record', { raw: '<b>' + C.esc(r.verdict) + '</b>' }])
  }) + C.pRaw('Node counts are search nodes of this algorithm, comparable between its two implementations and across runs, not across programs. A long side\'s finished roots are kept in '
    + m('corpus/ramsey/runs/<file>.<side>.progress') + ' ("rank nodes"), so a stopped search resumes and every closed root stays on record.')
}));

/* §3 the method */
B.push(C.section({
  lab: '§3 · the method', title: 'An exhaustive search, stated so it can be held to',
  bodyRaw: C.pRaw('<b>Reading.</b> ' + m('graph.py') + ' refuses a file that is not square, has an entry outside {0, 1}, is not symmetric, has a vertex joined to itself, or has a vertex count other than the m − 1 its name claims. The independent-set side searches the complement for cliques of size t.')
    + C.pRaw('<b>Search.</b> ' + C.esc(L.method.order) + '; ' + C.esc(L.method.bounds) + '. ' + m('clique.py') + ' is the reference: standard library, agreeing with brute force on thousands of random small graphs. '
      + m('clique.c') + ' is the kernel, threaded over roots, held to the reference: the same order, the same colouring, the same branch order, so on every graph both finish the per-root node counts must be equal, or the build refuses.')
    + C.pRaw('<b>Independence.</b> Written from the definition of R(s, t). Google\'s notebook (igraph) and maximusrufus\'s checker were not run and their code was not read for this decision; the only things taken from the release are the 18 matrices and the claims in their file names.')
}));

/* §4 limits */
B.push(C.section({
  lab: '§4 · what is claimed, and what is not', title: 'The limits',
  bodyRaw: C.plainList([
    { b: 'Claimed.', text: 'For each CERTIFIED file: the pinned bytes are a simple graph on m − 1 vertices with no clique of size s and no independent set of size t, so R(s, t) ≥ m.' },
    { b: 'Not claimed.', text: 'That a bound is new or best known (the paper\'s comparison with the literature is not re-checked), anything about how AlphaEvolve found the graphs, or the code in the release\'s code/ directory.' },
    { b: 'The trust in a "none".', text: 'An exhaustive search has no short certificate. It rests on the algorithm (stated in full in ' + m('clique.py') + '), on its two implementations agreeing node for node where both run, and on the kernel for the large graphs alone.' },
    { b: 'Independence.', text: 'From Google and from maximusrufus, whose results on the same files (cert-machine#1) were read only after these were decided; not from the operator (one).' }
  ])
}));

const foot = '<p>' + C.esc('Generated by tools/build-report-ramsey-graphs.js from certs/ramsey-ledger.json, re-checked at build (' + cm[1] + ' claims, ' + cm[2] + ' sides re-searched); record sha256 ' + sha('certs/ramsey-ledger.json').slice(0, 12) + '…; clique.c ' + L.code['instruments/ramsey/clique.c'].slice(0, 12) + '…, clique.py ' + L.code['instruments/ramsey/clique.py'].slice(0, 12) + '…. Rebuild: node tools/build-report-ramsey-graphs.js.') + '</p>'
  + '<p>' + C.esc('git ' + git) + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'ramsey-graphs.html'), TPL.render({
  title: 'AlphaEvolve\'s Ramsey lower bounds, each graph decided · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'Google\'s 18 Ramsey lower-bound graphs for AlphaEvolve, each decided by an exhaustive clique search in two implementations held to each other: ' + Object.entries(L.counts).map(([w, n]) => n + ' ' + w).join(', ') + '; two gaps in the release\'s own check.',
  path: '/reports/ramsey-graphs.html'
}));
console.log('reports/ramsey-graphs.html written: ' + Object.entries(L.counts).map(([w, n]) => n + ' ' + w).join(', ') + ' @ git ' + git);
