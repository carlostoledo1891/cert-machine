#!/usr/bin/env node
/* build-report-ai-math-claims.js — reports/ai-math-claims.html: the public mathematics claims of AI labs, June to
   November 2026, what each formal artefact covers, who has checked it, and what is still open; the ETH machine-model
   gap as the lead case. Read from corpus/ai-math-claims/census.json (the outside facts as read on 2026-11-04, each row
   with its sources and a confidence code) and, for every cert-machine verdict on the page, from the record and JSON
   pointer the row names, re-resolved here before a word is written: a pointer that no longer resolves, a record that
   moved, or a count that no longer re-derives refuses the page.

   usage: node tools/build-report-ai-math-claims.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('AI MATH CLAIMS REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const REC = 'corpus/ai-math-claims/census.json';
const D = JSON.parse(fs.readFileSync(path.join(ROOT, REC), 'utf8'));
const GH = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';
const esc = C.esc;

/* ---- the guards: every verdict and every number back to its record ---------------------------------------------- */
const cache = {};
const load = (rel) => cache[rel] || (cache[rel] = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')));
function resolve(rel, ptr) {
  if (!fs.existsSync(path.join(ROOT, rel))) die('a record the page cites is gone: ' + rel);
  let v = load(rel);
  if (!ptr) return v;
  for (const raw of ptr.replace(/^\//, '').split('/')) {
    const t = raw.replace(/~1/g, '/').replace(/~0/g, '~');
    if (v === null || v === undefined || !(t in Object(v))) die('the pointer ' + rel + '#' + ptr + ' no longer resolves');
    v = Array.isArray(v) ? v[Number(t)] : v[t];
  }
  return v;
}
const ids = new Set();
for (const r of D.rows) {
  if (ids.has(r.id)) die('two rows share the id ' + r.id);
  ids.add(r.id);
  for (const k of ['lab', 'claim', 'gap', 'conf']) if (!r[k]) die('row ' + r.id + ' lacks ' + k);
  if (r.ours) {
    resolve(r.ours.record, r.ours.pointer);
    for (const a of r.ours.also || []) resolve(a.record, a.pointer);
    if (r.ours.page && !fs.existsSync(path.join(ROOT, 'site', r.ours.page))) die('row ' + r.id + ' points at a page that is not built: ' + r.ours.page);
  }
}
const NUM = {};
for (const n of D.numbers) {
  const got = resolve(n.record, n.pointer), mode = (n.derive || {}).mode;
  const want = String(n.value).replace(/,/g, '');
  let ok;
  if (!mode) ok = String(got).replace(/,/g, '') === want;
  else if (mode === 'len') ok = Array.isArray(got) && String(got.length) === want;
  else if (mode === 'count') ok = Array.isArray(got) && String(got.filter((x) => Object.entries(n.derive.where).every(([k, v]) => x[k] === v)).length) === want;
  else if (mode === 'sum') ok = String(n.derive.keys.reduce((s, k) => s + Number(got[k]), 0)) === want;
  else if (mode === 'token' && n.derive.text) ok = JSON.stringify(got).includes(n.derive.text);
  else if (mode === 'token') ok = new RegExp('(^|[^0-9.,/])' + want.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '($|[^0-9])').test(JSON.stringify(got).replace(/,(?=\d{3})/g, ''));
  if (!ok) die('the number ' + n.id + ' (' + n.value + ') no longer re-derives from ' + n.record + '#' + n.pointer);
  NUM[n.id] = n;
}

/* ---- counts for the header ---------------------------------------------------------------------------------------- */
const rows = D.rows;
const nFormal = rows.filter((r) => r.formal && r.formal.kind && r.formal.kind !== 'none').length;
const decided = rows.filter((r) => r.ours && !/^(OPEN|ON HOLD|IN PROGRESS)$/.test(r.ours.verdict));
const word = (v) => rows.filter((r) => r.ours && r.ours.verdict === v).length;
const nU = rows.filter((r) => r.conf === 'U').length;

const TAGCLS = { CERTIFIED: 'held', WITNESSED: 'held', REPAIRED: 'held', REFUTED: 'fail' };
const tag = (v) => C.tag(v, TAGCLS[v] || 'open');
const recLink = (rel, ptr) => '<a href="' + C.escAttr(GH + rel) + '"><span class="m">' + esc(rel) + (ptr ? '#' + esc(ptr) : '') + '</span></a>';
const srcLinks = (r) => (r.sources || []).slice(0, 3).map((u, i) => '<a href="' + C.escAttr(u) + '">' + (i + 1) + '</a>').join(' ');
const pageLink = (p) => (p ? ' · <a href="' + C.escAttr(p.startsWith('reports/') ? p.slice(8) : '../' + p) + '">' + (p.startsWith('reports/') ? 'report' : 'page') + '</a>' : '');
const PAT = Object.fromEntries(D.patterns.map((p) => [p.id, p]));

const byPatTop = D.patterns.map((p) => ({ p, rs: rows.filter((r) => (r.pattern || []).includes(p.id)) })).sort((a, b) => b.rs.length - a.rs.length)[0];
const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · the state of AI mathematics claims, November 2026',
  title: 'Public AI math claims, and how far each is checked',
  deck: 'From June to November 2026, AI labs and AI-assisted authors made ' + rows.length + ' public mathematics claims that this census found. '
    + nFormal + ' come with a formal artefact; ' + decided.length + ' have been decided here, from the claimants\' own bytes, with no code shared with them. '
    + 'Where a proof was replayed, the kernels accepted it. What fails, when something fails, is the step between the formal object and the headline. The gaps come first.'
}));
B.push(C.stats([
  { k: 'claims in the census', v: String(rows.length), n: 'June–November 2026; ' + nU + ' rows unconfirmed' },
  { k: 'with a formal artefact', v: String(nFormal), n: 'Lean, mostly' },
  { k: 'decided here', v: String(decided.length), n: word('CERTIFIED') + ' certified · ' + word('REFUTED') + ' refuted · the rest not decided, with the reason' },
  { k: 'the most common gap', v: String(byPatTop.rs.length), n: byPatTop.p.title.toLowerCase() },
]));

/* §1 the gaps, by kind */
const byPat = D.patterns.map((p) => ({ p, rs: rows.filter((r) => (r.pattern || []).includes(p.id)) })).sort((a, b) => b.rs.length - a.rs.length);
B.push(C.section({
  lab: '§1 · the gaps', title: 'Where the claims stop short of their headlines', id: 'gaps',
  bodyRaw: C.pRaw('Each claim is filed under every kind of gap it shows. A claim can show several.')
    + C.table({ cols: [{ h: 'kind of gap' }, { h: 'claims' }, { h: 'what it means' }],
      rows: byPat.map(({ p, rs }) => [{ raw: '<b>' + esc(p.title) + '</b>' }, String(rs.length), p.line]) })
}));

/* §2 the lead case: ETH */
const E = D.eth;
const ethSteps = E.steps.map((s) => ({ b: s.verdict + '.', raw: esc(s.text) + (s.record ? ' Record: ' + recLink(s.record) + '.' : '') }));
for (const s of E.steps) if (s.record) resolve(s.record);
B.push(C.section({
  lab: '§2 · the lead case', title: 'ETH: from the labs\' machines to the textbook', id: 'eth',
  bodyRaw: C.pRaw('In October 2026 OpenAI and Anthropic each published a Lean proof that the Exponential Time Hypothesis is false. Both proofs check. Each is stated for a machine and an input format of its own lab\'s choosing, so the question left is whether those statements are the textbook ETH. This is where that question stands, step by step, as of ' + esc(E.asOf) + '.')
    + C.plainList(ethSteps.map((s) => ({ b: s.b, raw: s.raw })))
    + C.pRaw('The page on the two proofs is <a href="../eth/">/eth/</a>; the plan for the open steps is pre-registered in ' + recLink('notes/eth-model-gap-preregistration-2026-11-04.md') + '.')
}));

/* §3 the census, by lab */
const LABS = ['OpenAI', 'Anthropic', 'Google DeepMind'];
const groups = LABS.map((l) => [l, rows.filter((r) => r.lab === l)]).concat([['Others', rows.filter((r) => !LABS.includes(r.lab))]]);
const cell = (r) => r.ours ? { raw: tag(r.ours.verdict) + '<br><span class="small">' + esc(r.ours.scope || '') + '</span><br><span class="small">' + recLink(r.ours.record, r.ours.pointer) + pageLink(r.ours.page) + '</span>' } : { raw: '<span class="small">not examined here</span>' };
const indep = (r) => (r.independent || []).length ? { raw: (r.independent || []).map((x) => x.url ? '<a href="' + C.escAttr(x.url) + '">' + esc(x.who) + '</a>' : esc(x.who)).join('; ') } : '—';
for (const [lab, rs] of groups) {
  B.push(C.section({
    lab: '§3 · the census', title: lab + ' (' + rs.length + ')', id: 'census-' + lab.toLowerCase().replace(/[^a-z]+/g, '-'), wide: true,
    bodyRaw: C.table({ cols: [{ h: 'claim' }, { h: 'formal' }, { h: 'checked by others' }, { h: 'decided here' }, { h: 'still open' }],
      rows: rs.map((r) => [{ raw: (r.lab !== lab ? '<span class="small">' + esc(r.lab) + '</span><br>' : '') + esc(r.claim) + '<br><span class="small">' + esc(r.date || '') + ' · sources ' + srcLinks(r) + (r.conf !== 'C' ? ' · confidence ' + esc(r.conf) : '') + '</span>' },
        r.formal && r.formal.url ? { raw: '<a href="' + C.escAttr(r.formal.url) + '">' + esc(r.formal.kind) + '</a>' } : ((r.formal && r.formal.kind) || 'none'),
        indep(r), cell(r), r.gap]) })
  }));
}

/* §4 limits */
B.push(C.section({
  lab: '§4 · limits', title: 'What this census is, and is not', id: 'limits',
  bodyRaw: C.plainList([
    { b: 'A reading, dated.', text: 'The outside facts were read on ' + D.asOf + ' from the sources each row cites. A claim, a fix or an outside check after that date is not here. Confidence C means confirmed at the primary source, P partly, U not confirmed (' + nU + ' rows).' },
    { b: 'Our verdicts are records.', text: 'Every verdict in the "decided here" column is re-read from the record and pointer printed beside it when this page is built; the page refuses to build if one has moved. A verdict covers exactly the scope written beside it.' },
    { b: 'Not a ranking.', text: 'Labs publish in different forms and amounts; counting their rows says nothing about the quality of their mathematics.' },
    { b: 'Not exhaustive.', text: 'The census found ' + rows.length + ' claims; there are more. Headline research claims from several labs were looked for and not found in the window.' },
    { b: 'Same operator.', text: 'Where a new proof is written for the ETH steps, claimbox writes it and cert-machine decides it; both are this author\'s, so a decision here is a separation of roles, not a second party.' },
  ])
}));

const foot = '<p>' + esc('Generated by tools/build-report-ai-math-claims.js from ' + REC + ' (as of ' + D.asOf + '; ' + rows.length + ' rows, ' + D.numbers.length + ' numbers re-derived from their records) @ git ' + git + '. Built with Claude (Anthropic).') + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'ai-math-claims.html'), TPL.render({
  title: 'Public AI math claims, and how far each is checked · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'A census of ' + rows.length + ' public mathematics claims by AI labs and AI-assisted authors, June to November 2026: the formal artefact behind each, who has checked it, cert-machine\'s verdict where one exists, and the gap still open; the ETH machine-model gap as the lead case.',
  path: '/reports/ai-math-claims.html'
}));
console.log('reports/ai-math-claims.html written: ' + rows.length + ' rows, ' + decided.length + ' decided here, ' + D.numbers.length + ' numbers re-derived @ git ' + git);
