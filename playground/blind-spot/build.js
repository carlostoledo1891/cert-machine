/* build.js — site/instruments/blind-spot/index.html.
   playground/blind-spot/ · cert-machine · 2026-09-10

   A REBUILD, not a port of a built page. frontier-apps has its own
   tools/build-blind-spot.js; nothing of it is imported here. The house shell,
   the house tokens, the same bench.css and report.css every other instrument
   page in this repository uses, and one record:
   environments/blind_spot/eval/page.json, regenerated ON THIS MACHINE by
   eval/page_data.py from the pool this machine proved.

   NO FICTION ON /instruments: every number below is read from that record, and
   the ones in prose are computed here rather than typed. */
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const ROOT = path.join(PG, '..');
const { page, esc } = require(path.join(PG, 'design', 'shell.js'));
const GRAMMAR = require(path.join(ROOT, 'design', 'grammar.js'));
const P = JSON.parse(fs.readFileSync(path.join(ROOT, 'environments/blind_spot/eval/page.json'), 'utf8'));
const REPORT = fs.readFileSync(path.join(ROOT, 'design/frontier-ref/report.css'), 'utf8');
const BENCHCSS = fs.readFileSync(path.join(PG, 'design', 'bench.css'), 'utf8');
const W = require(path.join(PG, 'warrant.js'));   /* the grammar's words for the drawn counts (WARRANT v2) */

const BASE_EXTRA = `
.g-mut { grid-template-columns: 250px repeat(var(--cols), minmax(0,1fr)) 90px 90px; }
.g-pair { grid-template-columns: 250px 110px 1fr; }
.g-six { grid-template-columns: 190px repeat(var(--cols), minmax(0,1fr)); }
.g-run { grid-template-columns: 150px repeat(var(--cols), minmax(0,1fr)) 80px 80px 90px; }
.tl { text-align: left; }   /* a left-aligned cell in a numeric grid (2026-09-15) */
/* PHONES (2026-10-28). Each grid's fixed tracks add up past a 390 px phone's 350 px container (g-run 150+80+80+90,
   g-mut 250+90+90, g-pair 250+110), so its minmax(0,1fr) tracks collapsed to nothing: the three models' rung means
   printed on top of one another, the reference table's numbers too, and g-pair's third column was cut off whole.
   Below 720 px the three numeric grids keep real columns at their natural width and scroll inside their own box
   (.gx; the house rule: a component wider than the container scrolls inside it), and g-pair sheds a column: the
   reason each control is there becomes a full-width row under its name and grade. Nothing changes above 720 px. */
@media (max-width: 720px) {
  .gx { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .gx > .gr { width: max-content; min-width: 100%; }
  .g-six { grid-template-columns: 120px repeat(var(--cols), 84px); }
  .g-mut { grid-template-columns: 200px repeat(var(--cols), 76px) 76px 84px; }
  .g-run { grid-template-columns: 110px repeat(var(--cols), 76px) 76px 76px 84px; }
  .g-pair { grid-template-columns: minmax(0,1fr) 120px; }
  .g-pair > div:nth-child(3n) { grid-column: 1 / -1; }
}
.section-head { display:flex; justify-content:space-between; align-items:baseline; gap:var(--s-4); flex-wrap:wrap; margin-bottom:var(--s-4); }
.mono { font-family:var(--font-mono); font-size:0.92em; color:var(--ink-2); }
.t1 { font-size:clamp(1.5rem,1rem+1.6vw,2.1rem); } .t2 { font-size:clamp(1.25rem,1rem+1vw,1.6rem); }
.section { padding:clamp(2.5rem,6vh,4.5rem) 0; border-top:1px solid var(--border); }
`;

const nf = (x) => Number(x).toLocaleString('en-US');
const sgn = (x) => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(3);

/* ------------------------------------------------------------------ the record */
const POOL = P.pool, MUT = P.mutants, ROWS = P.baseline.rows, RES = P.results;
const CLASSES = ['COVERED', 'MINT_ONLY', 'OUTBOX_ONLY', 'ALIGNED_ONLY', 'NOCHANGE', 'IDENTITY'];
const MODELS = ['Opus 5', 'Sonnet 5', 'Haiku 4.5'];
const byPolicy = (p) => ROWS.filter((r) => r.policy === p);
const mean = (xs) => (xs.length ? xs.reduce((t, x) => t + x.reward, 0) / xs.length : 0);
const solvedOf = (xs) => xs.filter((x) => x.reward >= 1).length;
const falseOf = (xs) => xs.reduce((t, x) => t + Number(x.false_claim), 0);
const perClass = (p, k) => {
  const xs = byPolicy(p).filter((r) => r.klass === k);
  return [solvedOf(xs), xs.length];
};
const refusedRows = (m) => RES.filter((r) => r.model === m && (r.stop === 'refusal' || r.outcome === 'REFUSED_BY_POLICY'));
const gradedRows = (m) => RES.filter((r) => r.model === m && !(r.stop === 'refusal' || r.outcome === 'REFUSED_BY_POLICY'));

const KILLS = RES.filter((r) => r.in_box_kill !== null && r.in_box_kill !== undefined);
const OUTBOX_KILLS = KILLS.filter((r) => r.in_box_kill === false).length;

/* ------------------------------------------- WARRANT v2 (2026-10-28): what the record says
   FOUR SENTENCES OF THIS PAGE WERE NOT THE RECORD'S, and they are read from it now.

   1. "COVERED — the 14.95M-pair corpus sees it." MCY's own tag rule (config.mcy, the coverage run this pool imports)
      gives COVERED to a killable mutation that TWO OR MORE of its four testbenches kill — the else branch after the
      four ONLY classes — and the corpus testbench is not the corpus: it is a stratified 4,000-pair sample of it
      (families.py). 52 of the 302 COVERED marks get past that sample, so 98 killable mutations do, not 46. The 46
      are the ones exactly one constructed family sees, which is what the rings and squares are.
   2. "A test corpus of 14.95 million pairs … reports full coverage … and for 46 of those mutations every one of
      those pairs returns the same answer." No record here holds a coverage report or a run of the full corpus
      against these 400 mutants; the record holds MCY's run, so the lede says what that run decided.
   3. "The out-of-box family kills 96.8% of these mutants." The figure is the source lab's table (CERTIFIER.md,
      337 of 348), whose kill column is COVERED plus the family's own ONLY class — as if every COVERED mutation fell
      to every family. In MCY's results the out-of-box family kills 79 of the 348. "About one in ten of the family"
      is read off the pinned family file below: 8–10 in a hundred, by coordinate.
   4. "It declined all twelve of them, plus three located tasks." Opus declined one blind task too: sixteen, which
      the table's own declined column already printed.
   And one word: the comparator does not decide whether one vector is longer than another; it decides the kissing
   predicate, u·v ≤ 0 or 4(u·v)² ≤ (u·u)(v·v) — whether the two are at least 60° apart (design.py).

   STANDING. Every class, witness and grade on this page is decided — a simulation of the netlist or a SAT proof. A
   score is a different object when what it counts was DRAWN: eight random pairs per task, seeded by the task (the
   shotgun rows), or a model's replies (an LLM's draw). Those counts are CHOSEN, dotted: one member of the scores
   the same policy would get on other draws. abstain, never and sat draw nothing, and the false-claim column does
   not depend on the draw, so they carry no mark.

   RED. A model that answers EQUIVALENT claims that no valid pair tells this mutant from the design — universal,
   and about that mutant. Where the mutant is killable, its SAT witness is an object that refutes it, and it is on
   the mutant's own card: the one place on this page that earns the ×. A kill declared on a design the miter proved
   unchanged is refuted by proof, with no pair to show, and carries none. */
const FAMS = ['corpus', 'mint', 'outbox', 'aligned'];
const KILLABLE = MUT.filter((m) => !m.equivalent);
const seenBy = (m) => FAMS.filter((f) => m.profile[f]);
const ONLY_CLASSES = ['MINT_ONLY', 'OUTBOX_ONLY', 'ALIGNED_ONLY'];
const ONLY = MUT.filter((m) => ONLY_CLASSES.includes(m.klass));
if (!MUT.filter((m) => m.klass === 'COVERED').every((m) => !m.equivalent && seenBy(m).length >= 2)
  || !KILLABLE.every((m) => (seenBy(m).length >= 2) === (m.klass === 'COVERED'))
  || !ONLY.every((m) => seenBy(m).length === 1 && seenBy(m)[0] === m.klass.replace('_ONLY', '').toLowerCase()))
  throw new Error('blind-spot: COVERED is no longer "two or more testbenches", or an ONLY class no longer one; rewrite the legend');
const CORPUS_MISS = KILLABLE.filter((m) => !m.profile.corpus);
const COVERED_MISS = CORPUS_MISS.filter((m) => m.klass === 'COVERED');
if (CORPUS_MISS.length !== COVERED_MISS.length + ONLY.length) throw new Error('blind-spot: a corpus-sample miss is neither COVERED nor an ONLY class; rewrite the map note');
const OUTBOX_ALL = KILLABLE.filter((m) => m.profile.outbox).length;
const IN_BOX_CHECK = ONLY.filter((m) => m.region === 'box check').length;
/* the four testbench files MCY ran, as pinned in corpus/blindspot/mut: their size, and how much of the out-of-box
   family spoils any one coordinate (a record is 68 bits: u0..u10, v0..v10 at 3 bits, then 2 verdict bits) */
const HEX = (f) => fs.readFileSync(path.join(ROOT, 'corpus', 'blindspot', 'mut', f + '.hex'), 'utf8').split(/\r?\n/).filter(Boolean);
const FAM_N = HEX('corpus').length;
if (!FAMS.every((f) => HEX(f).length === FAM_N)) throw new Error('blind-spot: the four testbench files are not one size; rewrite the lede');
/* THE HEADLINE, READ FROM THE SAME RECORD (2026-10-28, a follow-up to the lede). "Fourteen million certified verdicts
   could not see this mutant" has no record behind it for any of the 400: MCY ran a 4,000-pair stratified sample of
   that corpus against them, the SAT miter is over every input (out-of-box ones included), and no in-box-only proof
   exists per mutant — so even the box-check mutants are unseen by the sample, not proved unseeable by the corpus.
   The headline now names what was run, from the file's own length. And the card's "46 no valid input can see" was
   false for 11 of them: the minted and aligned families are in-box, valid inputs, every pair of them (read below), and
   they are what sees the 8 MINT_ONLY and 3 ALIGNED_ONLY mutants. The cards now count what the corpus test misses. */
const FAM_WORDS = { 4000: 'Four thousand' }[FAM_N];
if (!FAM_WORDS) throw new Error('blind-spot: the corpus test is no longer 4,000 pairs; rewrite the headline');
const inBoxAll = (f) => HEX(f).every((h) => { const b = BigInt('0x' + h) >> 2n; for (let k = 0; k < 22; k++) if (((b >> BigInt((21 - k) * 3)) & 7n) === 4n) return false; return true; });
if (!['corpus', 'mint', 'aligned'].every(inBoxAll)) throw new Error('blind-spot: a corpus, minted or aligned pair is out of the box; the headline note would be false');
const SPOIL = (() => {
  const L = HEX('outbox'), n = new Array(22).fill(0);
  for (const h of L) {
    const b = BigInt('0x' + h) >> 2n;
    for (let k = 0; k < 22; k++) { let x = Number((b >> BigInt((21 - k) * 3)) & 7n); if (x >= 4) x -= 8; if (x === -4) n[k]++; }
  }
  return [Math.min(...n) / L.length, Math.max(...n) / L.length];
})();
if (!(SPOIL[0] > 0.05 && SPOIL[1] < 0.15)) throw new Error('blind-spot: the out-of-box family no longer spoils a coordinate about one time in ten; rewrite the note');
const pct = (x) => (100 * x).toFixed(1);
/* the pairs a policy draws at random (policies.py: a random.Random seeded by task id and policy) */
const SHOTGUN = new Set(['random8', 'corpus8', 'mint8', 'outbox8', 'aligned8', 'union8', 'profile']);
/* D10: a reference policy's score is computed over the 1,200 rows of the baseline (one address: the rows themselves); a
   model's count names one cell of each of its replies that it is computed from */
const BSP = 'environments/blind_spot/eval/page.json';
const resCells = (rows, ...fields) => rows.flatMap((x) => fields.map((f) => BSP + '#/results/' + RES.indexOf(x) + '/' + f));
const drawn = (p, h) => (SHOTGUN.has(p) ? W.value(h, W.CHOSEN, { derived: [BSP + '#/baseline/rows'], title: 'one seeded draw of eight pairs per task; another draw scores otherwise' }) : h);
const sample = (h, derived) => W.value(h, W.CHOSEN, { derived, title: 'one sample of the model’s replies — each grade decided, the sample drawn' });
/* the model answers that declared a gap closed on a killable mutant, and the ones that declared a kill on a design
   proved unchanged: the first are refuted by the mutant's own witness, the second by proof */
const GAPS = RES.filter((r) => r.reward < 0 && r.verdict === 'EQUIVALENT' && r.truth === 'KILL');
const ALARMS = RES.filter((r) => r.reward < 0 && r.verdict === 'KILL' && r.truth === 'EQUIVALENT');
if (GAPS.length + ALARMS.length !== RES.filter((r) => r.reward < 0).length) throw new Error('blind-spot: a wrong answer is neither kind; rewrite the note');
if (!GAPS.every((r) => { const m = MUT.find((x) => x.id === r.mutant); return m && m.witness; })) throw new Error('blind-spot: a refuted EQUIVALENT has no witness on its card; the × would point at nothing');
const OPUS_DECLINED = P.rungs.map((g) => [g, refusedRows('Opus 5').filter((r) => r.rung === g).length, RES.filter((r) => r.model === 'Opus 5' && r.rung === g).length]);
if (!OPUS_DECLINED.some(([g, a, b]) => g === 'profile' && a === b)) throw new Error('blind-spot: Opus no longer declines the whole profile rung; rewrite the note');
const nw = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const word = (n) => nw[n] || String(n);

/* ------------------------------------------------------- the map: 400 mutants
   One row per region of the netlist, mutants ordered by the line their cell was
   elaborated from. THE MARK CARRIES THE CLASS, and it carries it by SHAPE — a
   reader who cannot separate two greys must still be able to separate a mutant
   the corpus sees from one it does not. Colour is never the only channel. */
const REGIONS = P.regions;
function mark(kind, x, y) {
  /* NUMBERS, not strings. The card once passed `x.toFixed(1)` and `${x + 3.6}`
     then concatenated instead of adding — "26.7" + 3.6 = "26.73.6" — which
     emitted a malformed diamond that drew as a stray vertical bar. Coerced here
     so no caller can reintroduce it. */
  x = Number(x); y = Number(y);
  const o = { COVERED: 0.42, MINT_ONLY: 0.95, OUTBOX_ONLY: 0.95, ALIGNED_ONLY: 0.95, NOCHANGE: 0.30, IDENTITY: 0.95 }[kind];
  if (kind === 'COVERED') return `<circle cx="${x}" cy="${y}" r="1.9" fill="currentColor" fill-opacity="${o}"/>`;
  if (kind === 'NOCHANGE') return `<path d="M${x - 2.2},${y - 2.2} l4.4,4.4 M${x + 2.2},${y - 2.2} l-4.4,4.4" stroke="currentColor" stroke-opacity="${o}" stroke-width="1"/>`;
  if (kind === 'MINT_ONLY') return `<circle cx="${x}" cy="${y}" r="3.1" fill="none" stroke="currentColor" stroke-opacity="${o}" stroke-width="1.2"/>`;
  if (kind === 'OUTBOX_ONLY') return `<g><circle cx="${x}" cy="${y}" r="3.4" fill="none" stroke="currentColor" stroke-opacity="${o}" stroke-width="1.2"/><circle cx="${x}" cy="${y}" r="1.3" fill="currentColor" fill-opacity="${o}"/></g>`;
  if (kind === 'ALIGNED_ONLY') return `<rect x="${x - 2.8}" y="${y - 2.8}" width="5.6" height="5.6" fill="currentColor" fill-opacity="${o}"/>`;
  return `<path d="M${x},${y - 3.6} L${x + 3.6},${y} L${x},${y + 3.6} L${x - 3.6},${y} Z" fill="none" stroke="currentColor" stroke-opacity="${o}" stroke-width="1.2"/>`;
}

function blindMap() {
  const W = 940, LEFT = 152, RIGHT = W - 24, ROW = 34, TOP = 26;
  const H = TOP + REGIONS.length * ROW + 16;
  const out = [`<svg viewBox="0 0 ${W} ${H}" class="fig" role="img" aria-label="Every one of MCY's 400 mutations of the comparator, placed in the region of the netlist it sits in, and marked by which testbench family can see it.">`];
  REGIONS.forEach((reg, i) => {
    const y = TOP + i * ROW + ROW / 2;
    const here = MUT.filter((m) => m.region === reg).sort((a, b) => a.vline - b.vline || a.id - b.id);
    out.push(`<text x="${LEFT - 12}" y="${y + 3.5}" class="rl" text-anchor="end">${esc(reg)}</text>`);
    out.push(`<line x1="${LEFT}" y1="${y}" x2="${RIGHT}" y2="${y}" stroke="currentColor" stroke-opacity="0.12" stroke-width="1"/>`);
    const n = here.length || 1;
    const step = Math.min(11, (RIGHT - LEFT - 10) / n);
    here.forEach((m, j) => {
      const x = LEFT + 6 + j * step;
      /* a transparent disc behind each mark so a 4px glyph has a 12px target —
         the mark says what it is, the disc is what you can actually hit */
      out.push(`<g class="mk" data-id="${m.id}" role="button" tabindex="-1" aria-label="mutation ${m.id}, ${esc(m.klass.toLowerCase().replace(/_/g, ' '))}, netlist line ${m.vline}">`
        + `<circle cx="${x.toFixed(1)}" cy="${y}" r="6" fill="transparent"/>` + mark(m.klass, x, y) + '</g>');
    });
    out.push(`<text x="${RIGHT}" y="${y - 11}" class="rl" text-anchor="end" opacity="0.55">${here.length}</text>`);
  });
  out.push('</svg>');
  return out.join('');
}

function mapLegend() {
  const items = [
    ['COVERED', 'two or more testbenches see it'],
    ['MINT_ONLY', 'only the minted family sees it'],
    ['OUTBOX_ONLY', 'only out-of-box inputs see it'],
    ['ALIGNED_ONLY', 'only aligned inputs see it'],
    ['NOCHANGE', 'proved equivalent — nothing to see'],
    ['IDENTITY', 'the unmutated design'],
  ];
  return `<div class="legend">${items.map(([k, t]) => {
    const n = MUT.filter((m) => m.klass === k).length;
    return `<span class="li"><svg viewBox="0 0 14 14" aria-hidden="true">${mark(k, 7, 7)}</svg>`
      + `<b>${k.toLowerCase().replace(/_/g, ' ')}</b> ${esc(t)} <i>${n}</i></span>`;
  }).join('')}</div>`;
}

/* ------------------------------------------------- the reference table, by rung */
const REF_ROWS = P.baseline.policies.map((p) => {
  const xs = byPolicy(p);
  return {
    p, all: mean(xs), solved: solvedOf(xs), n: xs.length, fc: falseOf(xs),
    rungs: P.rungs.map((r) => mean(xs.filter((x) => x.rung === r))),
  };
});
const POLICY_NOTE = {
  abstain: 'answers UNDECIDED to everything',
  never: 'answers EQUIVALENT to everything',
  random8: 'eight random pairs',
  corpus8: 'eight pairs drawn from the corpus',
  mint8: 'eight from the minted family',
  outbox8: 'eight from the out-of-box family',
  aligned8: 'eight from the aligned family',
  union8: 'eight drawn from all four',
  profile: 'reads the profile rung, then eight from the first family that sees it',
  sat: 'the SAT witness, or the proof',
};

/* THE DETAIL PAYLOAD. Everything the card shows for one mutation, and nothing
   else: 253 KB for 400 records, which is the price of the page being able to
   answer "what IS this mark" without a round trip. */
const CARD_KEYS = ['id', 'klass', 'region', 'vline', 'equivalent', 'described',
                   'statement', 'bent', 'drivers', 'profile', 'witness'];
const CARD_DATA = MUT.map((m) => {
  const o = {};
  for (const k of CARD_KEYS) if (m[k] !== undefined && m[k] !== null) o[k] = m[k];
  return o;
});

const CSS = `
.fig { width:100%; height:auto; display:block; color:var(--ink); }
.fig .rl { font-family:var(--font-mono); font-size:9.5px; fill:var(--ink-4); }
.legend { display:flex; flex-wrap:wrap; gap:var(--s-2) var(--s-5); margin-top:var(--s-3); }
.legend .li { display:inline-flex; align-items:center; gap:6px; font-family:var(--font-mono); font-size:var(--text-eyebrow); color:var(--ink-4); }
.legend .li svg { width:14px; height:14px; color:var(--ink); flex:none; }
.legend .li b { color:var(--ink-2); font-weight:500; }
.legend .li i { color:var(--ink-5); font-style:normal; }
.gr .c b { color:var(--ink); }
.mk { cursor:pointer; }
.mk:hover circle:last-of-type, .mk:hover rect, .mk:hover path { stroke:var(--ink); }
.mk.sel { color:var(--ink); }
.mk.sel circle:first-of-type { fill:color-mix(in srgb,var(--ink) 22%,transparent); }
.picker { display:flex; flex-wrap:wrap; gap:var(--s-3); align-items:center; margin-top:var(--s-4); }
.picker select, .picker input { font-family:var(--font-mono); font-size:var(--text-eyebrow); color:var(--ink);
  background:var(--bg); border:1px solid var(--border-strong); border-radius:var(--radius-s); padding:5px 8px; }
.picker input { min-width:22ch; } .picker label { font-family:var(--font-mono); font-size:9px;
  letter-spacing:.14em; text-transform:uppercase; color:var(--ink-5); }
.picker button { font-family:var(--font-mono); font-size:var(--text-eyebrow); color:var(--ink-3);
  background:transparent; border:1px solid var(--border-strong); border-radius:var(--radius-pill);
  padding:5px 12px; cursor:pointer; }
.picker button:hover { color:var(--ink); border-color:var(--ink-3); }
.card2 { margin-top:var(--s-4); border:1px solid var(--border); border-radius:var(--radius-m);
  padding:var(--s-4); background:var(--bg-raised); }
.card2 .hd { display:flex; flex-wrap:wrap; gap:var(--s-2) var(--s-4); align-items:baseline; margin-bottom:var(--s-3); }
.card2 .hd b { font-size:var(--text-small); color:var(--ink); }
.card2 .tag2 { font-family:var(--font-mono); font-size:8.5px; letter-spacing:.16em; text-transform:uppercase;
  border:1px solid var(--border-strong); border-radius:var(--radius-pill); padding:1px 8px; color:var(--ink-3); }
.card2 dl { display:grid; grid-template-columns:132px minmax(0,1fr); gap:5px var(--s-4); margin:0; }
.card2 dt { font-family:var(--font-mono); font-size:9px; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-5); }
.card2 dd { margin:0; font-family:var(--font-mono); font-size:var(--text-eyebrow); line-height:1.6; color:var(--ink-2);
  overflow-wrap:anywhere; }
.card2 dd .q { color:var(--ink-5); }
.verd { font-family:var(--font-mono); font-size:var(--text-small); color:var(--ink); }
.verd .why { display:block; font-size:var(--text-eyebrow); color:var(--ink-4); margin-top:4px; line-height:1.6; }
.win { color:var(--ink); font-weight:500; }
.dim { color:var(--ink-5); }
${GRAMMAR.css('.fig')}
`;


/* ------------------------------------------------------------------ the page's own script
   Two things, and both refuse rather than guess: the detail card, which says what a mark IS,
   and the specification box, which decides a pair YOU name the way the unmutated design would.
   Neither grades a kill — a kill is a simulation of the netlist under the mutation, and that
   runs offline. Saying so is the point; a box that looked like a grader would be a lie. */
const SCRIPT = `
(function () {
  'use strict';
  var M = JSON.parse(document.getElementById('bs-mutants').textContent);
  var byId = {}; M.forEach(function (m) { byId[m.id] = m; });
  var card = document.getElementById('card'), pick = document.getElementById('pick');
  var sel = null;

  M.slice().sort(function (a, b) { return a.id - b.id; }).forEach(function (m) {
    var o = document.createElement('option');
    o.value = m.id;
    o.textContent = 'mutation ' + m.id + ' · ' + m.klass.toLowerCase().replace(/_/g, ' ') + ' · line ' + m.vline;
    pick.appendChild(o);
  });

  var esc = function (t) { return String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  var row = function (k, v) { return v ? '<dt>' + esc(k) + '</dt><dd>' + v + '</dd>' : ''; };

  function show(id) {
    var m = byId[id]; if (!m) return;
    sel = m;
    document.querySelectorAll('.mk.sel').forEach(function (e) { e.classList.remove('sel'); });
    var g = document.querySelector('.mk[data-id="' + id + '"]');
    if (g) g.classList.add('sel');
    if (pick.value !== String(id)) pick.value = String(id);
    var prof = m.profile ? Object.keys(m.profile).map(function (f) {
      return f + ' ' + (m.profile[f] ? 'KILLED' : 'survived');
    }).join(' · ') : '';
    var w = m.witness;
    var wit = w
      ? '[' + w.u.join(',') + ']  [' + w.v.join(',') + ']<br><span class="q">the unmutated design says ' +
        esc(w.original) + '; the mutant says ' + esc(w.mutant) + '</span>'
      : '<span class="q">none — the miter proved this design changes nothing</span>';
    card.innerHTML =
      '<div class="hd"><b>mutation ' + m.id + '</b>' +
      '<span class="tag2">' + esc(m.klass.toLowerCase().replace(/_/g, ' ')) + '</span>' +
      '<span class="tag2">' + (m.equivalent ? 'proved equivalent' : 'killable') + '</span></div>' +
      '<dl>' +
      row('what it does', esc(m.described)) +
      row('region', esc(m.region) + ' · netlist line ' + m.vline) +
      row('the statement', '<span class="q">' + esc(m.statement) + '</span>') +
      row('the bent wire', '<span class="q">' + esc(m.bent) + '</span>') +
      row('its drivers', (m.drivers || []).map(function (d) {
        return '<span class="q">' + esc(d) + '</span>'; }).join('<br>')) +
      row('who sees it', esc(prof)) +
      row('SAT witness', wit) +
      '</dl>';
    card.hidden = false;
  }

  document.querySelectorAll('.mk').forEach(function (g) {
    g.addEventListener('click', function () { show(Number(g.dataset.id)); });
  });
  pick.addEventListener('change', function () { show(Number(pick.value)); });
  document.getElementById('pick-witness').addEventListener('click', function () {
    if (!sel || !sel.witness) return;
    document.getElementById('u').value = sel.witness.u.join(',');
    document.getElementById('v').value = sel.witness.v.join(',');
    decide();
    document.getElementById('spec').scrollIntoView({ block: 'center', behavior: 'smooth' });
  });

  /* ---- the specification, exactly as design.py states it ---------------- */
  var D = 11, CMAX = 3, LO = -4, HI = 3;
  function parse(txt) {
    var parts = String(txt).split(/[\\s,]+/).filter(function (x) { return x.length; });
    if (parts.length !== D) throw new Error(parts.length + ' coordinates; the design has ' + D);
    return parts.map(function (x) {
      if (!/^-?\\d+$/.test(x)) throw new Error('"' + x + '" is not an integer');
      var n = Number(x);
      /* STRICT, NEVER MASKED: a 4 is not a 3-bit value, and silently folding it to
         -4 would test a pair the reader did not name. */
      if (n < LO || n > HI) throw new Error(n + ' is outside -4..3, and is refused rather than masked');
      return n;
    });
  }
  function decide() {
    var out = document.getElementById('spec'), u, v;
    try { u = parse(document.getElementById('u').value); v = parse(document.getElementById('v').value); }
    catch (e) {
      out.innerHTML = '<div class="verd">REFUSED TO READ<span class="why">' + esc(e.message) + '</span></div>';
      return;
    }
    var inBox = u.concat(v).every(function (x) { return x >= -CMAX && x <= CMAX; });
    var p = 0, s = 0, t = 0, i;
    for (i = 0; i < D; i++) { p += u[i] * v[i]; s += u[i] * u[i]; t += v[i] * v[i]; }
    var verdict, why;
    if (!inBox) {
      verdict = 'REFUSED';
      why = 'a coordinate is -4, which is outside the declared box. The design refuses rather than ' +
            'deciding — the branch only an invalid input drives, where most of the blind spots live.';
    } else if (p <= 0) {
      verdict = 'CERTIFIED';
      why = 'p = u·v = ' + p + ' ≤ 0, so the trivial branch certifies without the comparator.';
    } else {
      var l = 4 * p * p, r = s * t;
      verdict = l <= r ? 'CERTIFIED' : 'REFUTED';
      why = 'p = ' + p + ', s = ' + s + ', t = ' + t + ' → 4p² = ' + l + (l <= r ? ' ≤ ' : ' > ') +
            s + '·' + t + ' = ' + r + ', so the comparator fires ' + (l <= r ? 'le' : 'gt') + '.';
    }
    out.innerHTML = '<div class="verd">' + verdict + '<span class="why">' + esc(why) +
      ' <br>This is the specification. It does not grade a kill: that is a simulation of the netlist ' +
      'under the mutation, and it runs offline.</span></div>';
  }
  document.getElementById('run').addEventListener('click', decide);
  ['u', 'v'].forEach(function (id) {
    document.getElementById(id).addEventListener('keydown', function (e) { if (e.key === 'Enter') decide(); });
  });
  decide();
  show(M.find(function (m) { return m.klass === 'OUTBOX_ONLY'; }) ? M.find(function (m) { return m.klass === 'OUTBOX_ONLY'; }).id : M[0].id);
})();
`;

const body = `
<section class="section no-rule">
  <div class="container">
    <div class="prose reveal rd">
      <div class="eyebrow">environment &middot; mutation blind spots</div>
      <h1 class="t1">${FAM_WORDS} certified verdicts could not see this mutant.</h1>
      <p>A hardware comparator decides whether two integer vectors are at least 60&deg; apart &mdash;
      <span class="mono">u&middot;v &le; 0</span> or <span class="mono">4(u&middot;v)&sup2; &le; (u&middot;u)(v&middot;v)</span>,
      eleven 3-bit coordinates a side. A corpus of <strong>14.95&nbsp;million pairs</strong> from finished,
      certified mathematics is the testbench anyone would reach for first. Then MCY mutates the netlist
      ${nf(POOL.mutations)} ways and runs four testbenches of ${nf(FAM_N)} pairs against every mutant: a stratified
      sample of that corpus, and three families built to look where it cannot. The corpus sample misses
      ${nf(CORPUS_MISS.length)} of the ${nf(POOL.killable)} mutations some pair can kill, and for ${nf(ONLY.length)} of them
      <em>only one of the three families sees anything at all.</em>
      The task is to name a pair that tells the mutant from the design.</p>
      <p>There is no answer key, no judge and no tolerance. A kill is checked by
      <strong>simulating the actual netlist under the actual mutation</strong>; EQUIVALENT is checked
      against a <strong>SAT proof</strong> on a hand-written miter. ${nf(POOL.killable)} mutations carry a
      verified witness, ${nf(POOL.equivalent)} are proved equivalent, and the identity mutation is in the
      pool as a control that must be recognised rather than killed.</p>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">Where the corpus cannot look</h2><span class="eyebrow">${nf(POOL.mutations)} mutations, by region of the netlist</span></div>
    <div class="reveal">${blindMap()}${mapLegend()}</div>
    <div class="reveal picker">
      <label for="pick">or pick one</label>
      <select id="pick"></select>
      <button id="pick-witness" type="button">load its witness below</button>
    </div>
    <div class="reveal card2" id="card" hidden></div>
    <div class="note reveal rd">
<b>read the shapes, not the shade</b> a filled dot is a mutation two or more testbenches catch; a ring or a
square is one only one constructed family catches; a cross is one a proof says changes nothing. The blind spots
are not scattered &mdash; ${IN_BOX_CHECK} of the ${ONLY.length} sit in the <span class="mono">box check</span>, the part of
the design that only an <em>invalid</em> input drives to refuse, which is where a corpus of valid inputs does not reach.
<b>a filled dot is not the corpus</b> MCY tags a mutation COVERED when two or more of its four testbenches kill it,
and ${COVERED_MISS.length} of the ${POOL.by_class.COVERED} dots get past the corpus sample, caught by the constructed
families alone &mdash; ${CORPUS_MISS.length} misses in all, with the ${ONLY.length} rings and squares.
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">Name a pair yourself</h2><span class="eyebrow">the specification, run here &mdash; not the netlist</span></div>
    <div class="reveal picker">
      <label for="u">u</label><input id="u" spellcheck="false" value="0,0,0,0,1,1,-1,0,0,0,1">
      <label for="v">v</label><input id="v" spellcheck="false" value="0,0,0,0,1,0,-1,0,-1,0,1">
      <button id="run" type="button">decide it</button>
    </div>
    <div class="reveal card2" id="spec"></div>
    <div class="note reveal rd">
<b>this is the specification, not the grader</b> it computes what the UNMUTATED design decides:
in-box, then <span class="mono">p = u&middot;v</span>, then <span class="mono">4p&sup2;</span> against
<span class="mono">s&middot;t</span>. <strong>It does not grade a kill.</strong> A kill is a simulation of the
actual netlist under the actual mutation, and that runs offline &mdash; which is the whole point of the
environment, and the reason this box cannot tell you whether your pair breaks anything.
<b>coordinates are read strictly in &minus;4..3</b> and a 4 is refused rather than masked to &minus;4. Masking
would silently test a pair you did not name, and &minus;4 is a legitimate out-of-box value that half of every
recorded kill used.
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">Knowing the family is not the pair</h2><span class="eyebrow">the reference policies, by class</span></div>
    <div class="reveal gx"><div class="gr g-six" style="--cols:${CLASSES.length}">
      <div class="h">eight pairs from &hellip;</div>${CLASSES.map((k) => `<div class="h">${k.toLowerCase().replace(/_/g, ' ')}</div>`).join('')}
      ${['corpus8', 'mint8', 'outbox8', 'aligned8', 'union8', 'sat'].map((p) => {
        const cells = CLASSES.map((k) => { const [a, b] = perClass(p, k); return `<div class="c" style="--f:${(b ? a / b : 0).toFixed(2)}">${drawn(p, `<b>${a}</b>/${b}`)}</div>`; }).join('');
        return `<div class="ml">${p}</div>${cells}`;
      }).join('')}
    </div></div>
    <div class="note reveal rd">
<b>the out-of-box family sees all ${POOL.by_class.OUTBOX_ONLY} of its own mutants</b> as a family of ${nf(FAM_N)} pairs &mdash; that is
what the class means &mdash; and ${OUTBOX_ALL} of the ${POOL.killable} killable ones overall. Eight random members
of it kill <strong>${drawn('outbox8', perClass('outbox8', 'OUTBOX_ONLY')[0] + ' of ' + perClass('outbox8', 'OUTBOX_ONLY')[1])}</strong> of the mutants only it can see, and every eight-pair
shotgun kills <strong>${drawn('corpus8', Math.max(...[...SHOTGUN].map((p) => perClass(p, 'ALIGNED_ONLY')[0])) + ' of ' + perClass('corpus8', 'ALIGNED_ONLY')[1])}</strong> of the aligned-only ones. A mutant on the box check of ONE
coordinate is killed only by pairs that spoil THAT coordinate &mdash; ${pct(SPOIL[0])}&ndash;${pct(SPOIL[1])} in a hundred of the family,
depending on the coordinate.
<b>dotted</b> eight random pairs are one draw of the many a policy could make, seeded by the task; another draw kills
other mutants, so every shotgun count is chosen. <span class="mono">sat</span> draws nothing, and its row is decided.
<b>so the class names the family and the defect names the member</b> and only the member is a kill. That is
the whole environment: the <span class="mono">profile</span> rung hands the model the family and watches
what it does with it.
    </div>
    ${W.legendHtml({ compact: true })}
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">The reference table</h2><span class="eyebrow">${P.baseline.n_per_rung} tasks per rung, seed ${P.baseline.seed}, no API key</span></div>
    <div class="reveal gx"><div class="gr g-mut" style="--cols:${P.rungs.length + 1}">
      <div class="h">policy</div>${P.rungs.map((r) => `<div class="h">${r}</div>`).join('')}<div class="h">all</div><div class="h">solved</div><div class="h">false claims</div>
      ${REF_ROWS.map((r) => `<div class="ml">${r.p} <span class="dim">&middot; ${esc(POLICY_NOTE[r.p] || '')}</span></div>`
        + r.rungs.map((v) => `<div class="c" style="--f:${((v + 1) / 2).toFixed(2)}">${drawn(r.p, sgn(v))}</div>`).join('')
        + `<div class="c ${r.all >= 1 ? 'win' : ''}" style="--f:${((r.all + 1) / 2).toFixed(2)}">${drawn(r.p, `<b>${sgn(r.all)}</b>`)}</div>`
        + `<div class="c">${drawn(r.p, `${r.solved}/${r.n}`)}</div><div class="c">${r.fc}</div>`).join('')}
    </div></div>
    <div class="note reveal rd">
<b>+1</b> a pair that flips a pin, or EQUIVALENT on a design the miter proved unchanged. <b>0</b> a miss, an
UNDECIDED, or a reply that could not be read. <b>&minus;1</b> a false claim either way &mdash; a kill declared on
a design that cannot change, or a gap declared closed on one that can.
<b>the ceiling is published</b> <span class="mono">sat</span> scores ${sgn(REF_ROWS.find((r) => r.p === 'sat').all)} on every rung, because the environment
knows the answer it will not tell you.
<b>dotted</b> the rows that draw their pairs at random. The false-claim column does not depend on the draw &mdash; a
shotgun claims a kill on every task, so it is wrong on every equivalent one &mdash; and carries no mark.
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">Three models</h2><span class="eyebrow">${RES.length} calls &middot; refusals counted apart, never reworded</span></div>
    <div class="reveal gx"><div class="gr g-run" style="--cols:${P.rungs.length + 1}">
      <div class="h">model</div>${P.rungs.map((r) => `<div class="h">${r}</div>`).join('')}<div class="h">all</div><div class="h">solved</div><div class="h">wrong</div><div class="h">declined</div>
      ${MODELS.map((m) => {
        const g = gradedRows(m), ref = refusedRows(m);
        const cells = P.rungs.map((r) => {
          const xs = g.filter((x) => x.rung === r);
          return xs.length ? `<div class="c" style="--f:${((mean(xs) + 1) / 2).toFixed(2)}">${sample(sgn(mean(xs)), resCells(xs, 'reward'))}</div>`
                           : '<div class="c dim" title="no graded call: every one was declined">&empty;</div>';
        }).join('');
        return `<div class="ml">${esc(m)}</div>${cells}`
          + `<div class="c" style="--f:${((mean(g) + 1) / 2).toFixed(2)}">${sample(`<b>${sgn(mean(g))}</b>`, resCells(g, 'reward'))}</div>`
          + `<div class="c">${sample(solvedOf(g), resCells(g, 'reward'))}</div><div class="c">${sample(g.filter((x) => x.reward < 0).length, resCells(g, 'reward'))}</div>`
          + `<div class="c ${ref.length ? '' : 'dim'}">${sample(ref.length || 0, resCells(RES.filter((r) => r.model === m), 'stop', 'outcome'))}</div>`;
      }).join('')}
    </div></div>
    <div class="note reveal rd">
<b>the profile rung cannot evaluate Opus as written</b> it declined all ${word(OPUS_DECLINED.find(([g]) => g === 'profile')[1])} of them on a content policy,
plus ${OPUS_DECLINED.filter(([g, a]) => g !== 'profile' && a).map(([g, a]) => `${word(a)} <span class="mono">${g}</span> task${a === 1 ? '' : 's'}`).join(' and ')} &mdash;
${refusedRows('Opus 5').length} in all, the declined column &mdash; so its <span class="mono">profile</span> cell is &empty;: there is no
mean of nothing. That is recorded as a fact and the prompt was not
reworded to get past the classifier &mdash; a rung that only scores the models willing to answer it is not
measuring what it claims to.
<b>${OUTBOX_KILLS * 2 === KILLS.length ? 'half of every kill' : 'kills'} went outside the box</b> ${sample(OUTBOX_KILLS + ' of the ' + KILLS.length, resCells(KILLS, 'in_box_kill'))} kills used a &minus;4 coordinate, which the
declared input box excludes. The thesis, showing up as a diagnostic rather than as a score.
<b>dotted</b> every model number is one sample of that model&rsquo;s replies: each reply is graded exactly, but the
replies are a draw, and a rerun draws others.
<b>${word(GAPS.length)} gap${GAPS.length === 1 ? '' : 's'} declared closed</b> ${W.witness('a model’s EQUIVALENT, refuted by the mutant’s own witness')} ${GAPS.map((r) => `${esc(r.model)} called mutation ${r.mutant} EQUIVALENT`).join(', and ')}.
EQUIVALENT says no valid pair tells that mutant from the design, and the SAT witness on its card above is such a
pair &mdash; an object you can load, which is why these alone are marked. The other ${ALARMS.length} wrong answers
declared a kill on a design the miter proved unchanged: refuted by proof, with no pair to exhibit.
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">The controls run before any model does</h2><span class="eyebrow">${P.controls.length} planted, ${P.controls_failed.length} misbehaved</span></div>
    <div class="reveal"><div class="gr g-pair">
      <div class="h">planted submission</div><div class="h">must grade</div><div class="h">why it is there</div>
      ${P.controls.map((c) => `<div class="ml">${esc(c.name)}</div>`
        /* the OBSERVED grade, not the expectation: three of these controls pin only the
           outcome and say nothing about the reward, so reading the reward off `expect`
           printed "-NaN" in three cells. What the row is for is what it actually graded. */
        + `<div class="c ${c.expect.outcome === 'SOLVED' ? 'win' : ''}">${esc(c.outcome)} ${sgn(c.reward)}</div>`
        + `<div class="ml dim tl">${esc(c.note)}</div>`).join('')}
    </div></div>
    <div class="note reveal rd">
<b>what each one pins</b> the grade shown is what the control actually graded; ${P.controls_failed.length ? `${P.controls_failed.length} did not match` : 'every one matched'}, and
${word(P.controls.filter((c) => !('reward' in c.expect)).length)} of the ${word(P.controls.length)} deliberately pin only the outcome and leave the reward to follow from it.
<b>${word(P.controls.filter((c) => c.expect.outcome === 'SOLVED').length)} of them must SCORE</b> and that is the half people leave out. A simulator that is not live scores
every submission as a miss and reports perfect refusal discipline; a suite that fails everything reports
perfect coverage. Those are the same mistake, and it is the one this environment is named for.
    </div>
  </div>
</section>

<section class="section">
  <div class="container narrow">
    <div class="prose reveal">
      <h2 class="t2">How a verdict is reached, and what it is worth</h2>
      <p>One control design carries all ${nf(POOL.mutations)} mutations under a select input, so a kill is
      four thousand simulated records a second rather than four hundred rebuilds. EQUIVALENT is a
      <span class="mono">yosys sat</span> proof on a hand-written miter &mdash; ${Math.round(POOL.sat_seconds)}&nbsp;seconds for the whole
      pool on this laptop &mdash; and every witness the prover returns is re-run through the simulator before
      it is believed.</p>
      <p><strong>This environment was ported into this repository and its labels were re-derived here, not
      copied.</strong> The SAT run was repeated on this machine and compared against the source lab's own
      record: every mutation id, label, class, profile, mutation text, witness pair and witness pin-pair is
      identical, ${nf(POOL.mutations)} of ${nf(POOL.mutations)} on each. The only fields that differ anywhere in the record are the
      SAT <em>timings</em>, which are the machine and not the mathematics.</p>
      <p>What it certifies is arithmetic about one elaborated netlist and one mutation set.
      <strong>It is not a claim about any shipped chip, and it does not say a corpus that misses these
      mutants is a bad corpus</strong> &mdash; it says a coverage number computed from valid inputs cannot see a
      defect that only invalid inputs reach, which is a statement about the measurement, not about the
      people who took it.</p>
      <p class="mono ink-4 mt5 cmd">
      cd environments/blind_spot &amp;&amp; python3 -m pytest tests -q<br>
      python3 -m blind_spot gate<br>
      python3 -m blind_spot baseline --n 40<br>
      python3 environments/blind_spot/battery.py<br>
      node playground/build.js</p>
    </div>
  </div>
</section>`;

function build(OUTDIR) {
  const dir = path.join(OUTDIR, 'blind-spot');
  fs.mkdirSync(dir, { recursive: true });
  const html = page({
    title: `${FAM_WORDS} certified verdicts could not see this mutant — cert-machine`,
    desc: 'A chip-task environment: one mutant of a comparator, or the unmutated design. Name the input pair whose pins differ, or prove there is none. Kills verified by simulating the netlist, equivalence by SAT, and no answer key anywhere.',
    path: '/instruments/blind-spot/',
    css: `${BENCHCSS}\n${BASE_EXTRA}\n${REPORT}\n${CSS}`,
    body: `<main>${body}</main>\n<script type="application/json" id="bs-mutants">${JSON.stringify(CARD_DATA).replace(/</g, '\\u003c')}</script>`,
    /* the shell emits `script` RAW, so the tags belong to the caller. Without them
       the whole behaviour was dropped into the page as nothing at all and the
       build still reported success — caught by parsing the built page's inline
       scripts, which found zero. */
    script: '<scr' + 'ipt>' + SCRIPT + '</scr' + 'ipt>',
  });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, mutations: POOL.mutations, killable: POOL.killable, equivalent: POOL.equivalent };
}

/* the card on the gathering page: the map itself, cropped to the regions that
   carry the blind spots — the drawing IS the finding. */
function cardArt() {
  const W = 560, H = 560, out = [`<svg viewBox="0 0 ${W} ${H}" class="shape" role="img" aria-label="The ${POOL.mutations} mutations of the comparator arranged by region; the rings and squares are the ones only one constructed testbench sees.">`];
  const cols = 20, step = W / (cols + 1);
  MUT.slice().sort((a, b) => a.vline - b.vline || a.id - b.id).forEach((m, i) => {
    const x = step * (1 + (i % cols)), y = step * (1 + Math.floor(i / cols));
    out.push(mark(m.klass, x, y));
  });
  out.push('</svg>');
  return out.join('');
}

/* corpusMiss and famWords are what the gathering card prints (playground/build.js): the killable mutants the corpus
   test misses, and the size of that test in words; `blind` (seen by exactly one constructed family) is kept for any
   other reader */
module.exports = { build, cardArt, facts: { mutations: POOL.mutations, killable: POOL.killable, equivalent: POOL.equivalent, blind: POOL.by_class.MINT_ONLY + POOL.by_class.OUTBOX_ONLY + POOL.by_class.ALIGNED_ONLY,
  corpusMiss: CORPUS_MISS.length, famWords: FAM_WORDS } };
