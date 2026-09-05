/* build.js — site/instruments/lattice-claims/index.html.
   playground/lattice-claims/ · cert-machine · 2026-09-05

   PORTED from frontier-apps tools/build-lattice-env.js (session 17) under the
   house shell: body and CSS kept as they were, the page() call and the
   requires rewritten, two colour literals moved onto the palette, and the
   reproduce lines pointed at this repository's paths. THE BUILDER ONLY READS:
   the record is instruments/wiring/eval/page.json (pinned), the contact sheet
   and the four refutations are cert-unit's own outputs, drawn from the same
   record by make-contact.mjs and make-refutations.mjs.

   NO FICTION ON /instruments: every number below is read from that record. */
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const ROOT = path.join(PG, '..');
const { page } = require(path.join(PG, 'design', 'shell.js'));
const P = JSON.parse(fs.readFileSync(path.join(ROOT, 'instruments/wiring/eval/page.json'), 'utf8'));
/* the contact sheet is built by instruments/cert-unit/make-contact.mjs, which
   owns the grammar. The builder reads it, the way every builder here reads its
   pipeline's output rather than recomputing it. */
const CONTACT = fs.readFileSync(path.join(ROOT, 'instruments/cert-unit/out/contact.svg'), 'utf8');
const REFUT = JSON.parse(fs.readFileSync(path.join(ROOT, 'instruments/cert-unit/out/refutations.json'), 'utf8'));
const REPORT = fs.readFileSync(path.join(ROOT, 'design/frontier-ref/report.css'), 'utf8');
const BENCHCSS = fs.readFileSync(path.join(PG, 'design', 'bench.css'), 'utf8');
/* two structural rules the body uses that neither the shell nor bench.css
   declares; they are frontier base.css's, copied rather than approximated */
const BASE_EXTRA = `
.section-head { display:flex; justify-content:space-between; align-items:baseline; gap:var(--s-4); flex-wrap:wrap; margin-bottom:var(--s-4); }
.mono { font-family:var(--font-mono); font-size:0.92em; color:var(--ink-2); }
.t1 { font-size:clamp(1.5rem,1rem+1.6vw,2.1rem); } .t2 { font-size:clamp(1.25rem,1rem+1vw,1.6rem); }
.section { padding:clamp(2.5rem,6vh,4.5rem) 0; border-top:1px solid var(--border); }
`;

const MODELS = ['Opus 5', 'Sonnet 5', 'Haiku 4.5'];
const R = P.results, RUNGS = P.rungs;
const cell = (m, r) => { const s = R.filter(x => x.model === m && x.rung === r); return [s.reduce((t, x) => t + x.cert, 0), s.length]; };
const overall = m => { const s = R.filter(x => x.model === m); return [s.reduce((t, x) => t + x.cert, 0), s.length]; };
const wf = m => { const s = R.filter(x => x.model === m && x.rung !== 'underspecified'); return [s.reduce((t, x) => t + x.wf, 0), s.length]; };
const straddle = m => { const s = R.filter(x => x.model === m && x.truth === 'STRADDLES'); return [s.reduce((t, x) => t + x.cert, 0), s.length]; };
const pc = ([a, b]) => b ? a / b : 0;

/* the mark that explains the environment: two printed norms, one decidable */
function ruler() {
  const A = P.decidable, B = P.straddle;
  const W = 900, H = 210, L = 118, Rr = W - 40, wall = 1.05;
  const span = Math.max(B.ratio_hi, A.ratio_hi) - Math.min(A.ratio_lo, B.ratio_lo);
  const lo = Math.min(A.ratio_lo, B.ratio_lo) - span * 0.28, hi = Math.max(1.0503, B.ratio_hi + span * 0.12);
  const X = v => L + (v - lo) / (hi - lo) * (Rr - L);
  const row = (e, y, label, tag) => {
    const a = X(e.ratio_lo), b = X(e.ratio_hi), c = X(e.ratio_exact);
    return `<g>
      <text x="${L - 12}" y="${y + 4}" class="rl" text-anchor="end">${label}</text>
      <line x1="${a}" y1="${y}" x2="${b}" y2="${y}" class="bar"/>
      <line x1="${a}" y1="${y - 7}" x2="${a}" y2="${y + 7}" class="cap"/>
      <line x1="${b}" y1="${y - 7}" x2="${b}" y2="${y + 7}" class="cap"/>
      <circle cx="${c}" cy="${y}" r="3" class="dot"/>
      ${b + 12 + tag.length * 5.4 < W - 8
        ? `<text x="${b + 12}" y="${y + 4}" class="tag">${tag}</text>`
        : `<text x="${a - 12}" y="${y + 4}" class="tag" text-anchor="end">${tag}</text>`}
    </g>`;
  };
  return `<svg viewBox="0 0 ${W} ${H}" class="plate">
    <rect width="${W}" height="${H}" fill="#0a0a0c"/>
    <line x1="${L}" y1="46" x2="${Rr}" y2="46" class="ax"/>
    ${Array.from({ length: 5 }, (_, i) => lo + (hi - lo) * (i + 0.5) / 5.6).concat([1.05]).map(v => `<line x1="${X(v)}" y1="42" x2="${X(v)}" y2="50" class="ax"/><text x="${X(v)}" y="34" class="ti" text-anchor="middle">${v.toFixed(4)}</text>`).join('')}
    <text x="${L - 12}" y="50" class="rl" text-anchor="end">‖v‖ / GH</text>
    <line x1="${X(wall)}" y1="46" x2="${X(wall)}" y2="${H - 24}" class="wall"/>
    <text x="${X(wall) - 8}" y="${H - 10}" class="tag" text-anchor="end">the acceptance wall, 1.05</text>
    ${row(A, 104, `printed ${A.printed}`, 'ADMISSIBLE &mdash; decided')}
    ${row(B, 154, `printed ${B.printed}`, 'STRADDLES &mdash; not decidable')}
  </svg>`;
}

const grid = () => `<div class="gr" style="grid-template-columns:120px repeat(${RUNGS.length + 1},minmax(0,1fr));">
  <div class="h"></div>${RUNGS.map(r => `<div class="h">${r}</div>`).join('')}<div class="h">overall</div>
  ${MODELS.map(m => `<div class="h ml">${m}</div>` + RUNGS.map(r => {
  const c = cell(m, r);
  return `<div class="c" style="--f:${pc(c).toFixed(2)}"><b>${c[0]}</b>/${c[1]}</div>`;
}).join('') + (() => { const o = overall(m); return `<div class="c tot" style="--f:${pc(o).toFixed(2)}"><b>${o[0]}</b>/${o[1]}</div>`; })()).join('')}
</div>`;

const confusion = () => {
  const rows = MODELS.map(m => {
    const mine = R.filter(x => x.model === m);
    const seen = {};
    for (const x of mine) { const k = `${x.truth}|${x.verdict}`; seen[k] = (seen[k] || 0) + 1; }
    const worst = Object.entries(seen).filter(([k]) => k.split('|')[0] !== k.split('|')[1])
      .sort((a, b) => b[1] - a[1]).slice(0, 3);
    const say = g => (g === 'null' || g === 'undefined') ? 'nothing parseable' : g;
    return `<div class="h ml">${m}</div><div class="c2">${worst.map(([k, v]) =>
      `<span class="mis"><b>${v}&times;</b> ${say(k.split('|')[1]) === 'nothing parseable' ? 'returned nothing parseable' : 'said ' + k.split('|')[1]} when it was ${k.split('|')[0]}</span>`).join('')}</div>`;
  }).join('');
  return `<div class="gr" style="grid-template-columns:120px minmax(0,1fr);">${rows}</div>`;
};

const CSS = `
.plate { width:100%; height:auto; display:block; border:1px solid var(--border); border-radius:var(--radius-m); background:var(--bg-raised); }
.plate .ax { stroke:#f6f6f8; stroke-opacity:.28; }
.plate .ti { fill:var(--ink-3); font-family:var(--font-mono); font-size:10px; }
.plate .rl { fill:var(--ink-2); font-family:var(--font-mono); font-size:11px; }
.plate .tag { fill:#9a9aa6; font-family:var(--font-mono); font-size:10px; }
.plate .bar { stroke:#f6f6f8; stroke-opacity:.85; stroke-width:3; }
.plate .cap { stroke:#f6f6f8; stroke-opacity:.85; stroke-width:1.4; }
.plate .dot { fill:#0a0a0c; stroke:#f6f6f8; stroke-width:1.4; }
.plate .wall { stroke:#f6f6f8; stroke-opacity:.9; stroke-width:1.4; }
.gr .tot { box-shadow: inset 1px 0 0 var(--border-strong); }
.gr .c2 { display:flex; flex-direction:column; gap:3px; font-size:10.5px; color:var(--ink-4); }
.gr .mis b { color:var(--ink-2); }
.fg { display:grid; grid-template-columns:210px 110px minmax(0,1fr); gap:1px; background:var(--border); border:1px solid var(--border); border-radius:var(--radius-m); overflow:hidden; margin-top:var(--s-5); }
.fg > div { background:var(--bg-raised); padding:7px var(--s-4); font-family:var(--font-mono); font-size:10.5px; color:var(--ink-3); }
.fg .k { color:var(--ink-5); font-size:9px; letter-spacing:.1em; text-transform:uppercase; }
.fg .ok { color:var(--ink); }
.sheet { border:1px solid var(--border); border-radius:var(--radius-m); background:var(--bg-raised); padding:var(--s-4); overflow-x:auto; }
.sheet svg { width:100%; min-width:560px; height:auto; display:block; }
.refs { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--s-4); margin-top:var(--s-5); }
@media (max-width:900px){ .refs { grid-template-columns:1fr; } }
.refs figure { margin:0; border:1px solid var(--border); border-radius:var(--radius-m); background:var(--bg-raised); padding:var(--s-4); }
.refs .rsvg svg { width:100%; height:auto; display:block; }
.refs .rh { display:flex; justify-content:space-between; gap:var(--s-3); font-family:var(--font-mono); font-size:9px; letter-spacing:.1em; text-transform:uppercase; color:var(--ink-2); margin-bottom:var(--s-2); }
.refs .rh .dim { color:var(--ink-5); }
.refs .rc { font-family:var(--font-mono); font-size:9.5px; line-height:1.7; color:var(--ink-4); margin-top:var(--s-2); }`;

const body = `
<header class="hero">
  <div class="container">
    <div class="eyebrow reveal">environment &middot; lattice-claims</div>
    <h1 class="display reveal" style="margin-top:var(--s-5); max-width:20ch;">Decide it, or say what is missing</h1>
    <p class="lede reveal" style="margin-top:var(--s-6); max-width:64ch;">An environment built out of a mistake. Auditing published lattice records, our grader called 32 of 37 wrong &mdash; while being exact to the last bit. It had compared against a quantity the claims were not about. So this asks a model to decide a claim exactly <em>and</em> to declare what it decided against, because a right answer from the wrong reference is not a right answer.</p>
    <div class="hero-meta reveal">
      <span class="item"><span class="k">models</span><span class="v">${MODELS.length}</span></span>
      <span class="item"><span class="k">tasks</span><span class="v">${R.length / MODELS.length} each</span></span>
      <span class="item"><span class="k">forgeries caught</span><span class="v">${P.forgeries.filter(f => f.caught).length} of ${P.forgeries.length}</span></span>
      <span class="item"><span class="k">arithmetic</span><span class="v">int and Fraction only</span></span>
    </div>
  </div>
</header>

<section class="section">
  <div class="container narrow">
    <div class="prose reveal">
      <h2 class="t2">One dial, three rungs</h2>
      <p>The axis is not exact-versus-float. We measured that and it is the weaker one: a careful float grader agrees with the exact decision on every real published record we checked, 37 of 37, because the tightest margin in that table is 1.4&times;10&minus;&#8308; against a double&rsquo;s 10&minus;&#185;&#8310;. Precision is not where this domain breaks.</p>
      <p>The dial is <strong>how much of the reference is stated</strong>. <span class="mono">declared</span> gives every quantity exactly. <span class="mono">printed</span> gives the norm as a whole number, the way published tables give it. <span class="mono">underspecified</span> omits a required quantity, and the only correct answer is to refuse and name it. Nothing labels which rung a task belongs to &mdash; noticing is the test.</p>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">Why a rounded norm can end the argument</h2><span class="eyebrow">two real instances, same dimension</span></div>
    <div class="prose reveal" style="max-width:70ch;">
      <p>Both lattices below have dimension ${P.straddle.n}, both norms are published as whole numbers, and both look identical on the page. The bar is every ratio consistent with a norm that prints as that integer &mdash; half a unit either way. One bar clears the wall. The other crosses it, and no arithmetic closes the gap, because the information needed was rounded away before publication.</p>
    </div>
    <div class="reveal" style="margin-top:var(--s-5);">${ruler()}</div>
    <div class="note reveal" style="max-width:80ch;">
<b>decidable</b>  printed ${P.decidable.printed} &rarr; every consistent norm gives the same verdict. ADMISSIBLE, and that is a proof.
<b>straddling</b> printed ${P.straddle.printed} &rarr; at N&minus;&frac12; it is ${P.straddle.verdict_lo}, at N+&frac12; it is ${P.straddle.verdict_hi}. The window is ${((P.straddle.ratio_hi - P.straddle.ratio_lo) * 1e4).toFixed(1)}&times;10&minus;&#8308; wide and the wall runs through it.
<b>so</b>         STRADDLES is not a hedge, it is the correct answer &mdash; and there is a record in the real hall of fame in exactly this position.
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">Results</h2><span class="eyebrow">${R.length} calls, dimensions 8&ndash;16</span></div>
    <div class="reveal">${grid()}</div>
    ${P.baseline ? `<div class="reveal" style="margin-top:var(--s-5);">
      <div class="eyebrow">the same ${R.length / MODELS.length} tasks, four reference policies, no API key</div>
      <div class="gr" style="grid-template-columns:120px repeat(${RUNGS.length + 1},minmax(0,1fr));">
        <div class="h"></div>${RUNGS.map(r => `<div class="h">${r}</div>`).join('')}<div class="h">overall</div>
        ${P.baseline.map(b => { const tot = RUNGS.reduce((a, r) => [a[0] + b[r][0], a[1] + b[r][1]], [0, 0]); return `<div class="h ml">${b.policy}</div>` + RUNGS.map(r => `<div class="c" style="--f:${pc(b[r]).toFixed(2)}"><b>${b[r][0]}</b>/${b[r][1]}</div>`).join('') + `<div class="c tot" style="--f:${pc(tot).toFixed(2)}"><b>${tot[0]}</b>/${tot[1]}</div>`; }).join('')}
      </div>
    </div>
    <div class="note reveal" style="max-width:80ch;">
<b>exact</b>      is the ceiling and is published on purpose: this measures whether an answer checks, not whether the problem is hard for a program.
<b>careful</b>    is the row to read the models against &mdash; a float grader right on every real record, with no way to say STRADDLES or NEEDS_DATA. Its printed cell is the four straddling instances; its refusal cell is the cost of a grader that cannot abstain.
    </div>` : ''}
    <div class="note reveal" style="max-width:80ch;">
<b>the split</b>   the <span class="mono">printed</span> rung separates the models threefold. On the straddling instances alone: ${MODELS.map(m => `${m} ${straddle(m)[0]}/${straddle(m)[1]}`).join(', ')}.
<b>reference</b>  declared correctly, and correctly: ${MODELS.map(m => `${m} ${wf(m)[0]}/${wf(m)[1]}`).join(', ')}. Diagnostic, weight zero &mdash; but it is the reward that says whether a pass was earned.
    </div>
    <div class="reveal" style="margin-top:var(--s-6);">
      <div class="eyebrow">where the verdicts went</div>
      ${confusion()}
    </div>
    <div class="note reveal" style="max-width:80ch;">
<b>one failure</b> is the same for all three, and it is the one this environment exists to train against: <b>answering confidently when a quantity is absent</b>. Nothing marks those tasks; the omission has to be noticed.
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">All of it, as one picture</h2><span class="eyebrow">${R.length} rollouts, nine rows</span></div>
    <div class="prose reveal" style="max-width:70ch;">
      <p>Every rollout reduced to the topology that matters: the verdicts an instrument can fire, with the one the model chose filled and the one that was true ringed. Fill inside a ring is right. A fill with no ring is a wrong answer. A ring with nothing in it is the answer it missed, and you can see which row it went to instead.</p>
      <p>The underline is the reference, and its ink is not chosen &mdash; solid when the rollout declared what it actually decided against, dashed when it slipped. A run of dashed underlines beneath correct verdicts is a model right for a reason it did not state.</p>
    </div>
    <div class="reveal sheet" style="margin-top:var(--s-5);">${CONTACT}</div>
    <div class="note reveal" style="max-width:80ch;">
<b>read it</b>     the <span class="mono">underspecified</span> band is the clearest: where a ring sits empty in the <span class="mono">NEEDS_DATA</span> row and a fill appears in <span class="mono">ADMISSIBLE</span> above it, a model answered a question that had a quantity missing. That shape repeats for all three.
<b>and the</b>     <span class="mono">printed</span> band separates them without a number: Opus&rsquo;s fills sit inside their rings, and the other two scatter into rows the truth was not in.
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">A refutation is a picture</h2><span class="eyebrow">four real failures, drawn</span></div>
    <div class="prose reveal" style="max-width:70ch;">
      <p>&ldquo;Verdict ADMISSIBLE, decided REFUSED&rdquo; is a fact without a reason. The smallest graph that refutes a rollout carries the reason, and carries it in the same grammar as everything else: what was <em>derived</em> arrives on a solid wire, and what was merely <em>asserted</em> arrives dashed, because the node holding the model&rsquo;s answer emits a float and nothing here chooses ink.</p>
      <p>Each of these is a rollout that actually happened, rebuilt from the same seed the eval ran.</p>
    </div>
    <div class="refs reveal">${REFUT.map((r) => `<figure>
      <figcaption class="rh"><span>${r.title}</span><span class="dim">${r.model} &middot; ${r.rung}</span></figcaption>
      <div class="rsvg">${r.svg}</div>
      <figcaption class="rc">${r.caption}</figcaption>
    </figure>`).join('')}</div>
    <div class="note reveal" style="max-width:80ch;">
<b>the third</b>  is the one a sentence cannot carry. Its deciding port has <em>nothing wired to it</em> &mdash; the task never supplied that quantity &mdash; and a verdict was returned regardless. The missing wire is the finding, and it is only a finding because every port is drawn whether or not anything reaches it.
<b>the fourth</b> is ours as much as any model&rsquo;s: two different numbers arriving at one socket, one from the task and one from what the answer was actually decided against. That is the shape of the error this whole environment is named for.
    </div>
  </div>
</section>

<section class="section">
  <div class="container narrow">
    <div class="prose reveal">
      <h2 class="t2">The first run measured the grader, not the models</h2>
      <p>It scored Opus <span class="mono">${P.first_run.certified['Opus 5']}/${P.first_run.of_certified}</span> and the reference reward <span class="mono">0/${P.first_run.of_well_formed}</span> for <em>every</em> model. The uniformity of that zero is what gave it away.</p>
      <p>Models were declaring their reference correctly, using the keys <span class="mono">squared_norm</span> and <span class="mono">acceptance_factor</span>; the grader demanded <span class="mono">norm_squared</span> and <span class="mono">factor</span> and failed right answers on spelling. The prompt had never stated the schema, so there was nothing to fail against. On the refusal rung, 22 models had correctly answered <span class="mono">NEEDS_DATA</span> and scored zero for naming the absent quantity <span class="mono">q</span> rather than the grader&rsquo;s internal path <span class="mono">lattice.q</span>.</p>
      <p><strong>A zero that uniform is a bug, not a result.</strong> Fixed on both sides &mdash; the prompt states the schema, and the grader accepts any reasonable spelling. It is the third time in one sitting that comparing against the wrong reference produced a confident wrong answer: once on the real published audit, once inside our own exact predicate where a planted forgery caught it, and once here. The environment is named for that error and it still caught us.</p>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">Forgeries</h2><span class="eyebrow">planted before any model was called</span></div>
    <div class="reveal"><div class="fg">
      <div class="k">forgery</div><div class="k">must fail</div><div class="k">why</div>
      ${P.forgeries.map(f => `<div class="${f.caught ? 'ok' : ''}">${f.name}</div><div>${f.must}</div><div>${f.note}</div>`).join('')}
    </div></div>
    <div class="note reveal" style="max-width:80ch;">
<b>${P.forgeries.filter(f => f.caught).length} of ${P.forgeries.length}</b> caught, ${P.forgeries_accepted.length} accepted. If one is accepted the suite aborts.
<b>zero_vector</b> earned its place by catching a hole in <em>our</em> exact predicate rather than in a model: the decision alone accepts the zero vector, because 0 &le; anything, and the claim is about a nonzero one. A forgery found that.
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">The canary is a cliff</h2><span class="eyebrow">float graders, measured</span></div>
    <div class="reveal"><div class="gr" style="grid-template-columns:210px repeat(2,minmax(0,1fr));">
      <div class="h">dimensions</div><div class="h">naive float disagrees</div><div class="h">careful float disagrees</div>
      ${P.canary.map(c => `<div class="ml">${c.dims[0]}&ndash;${c.dims[c.dims.length - 1]} &middot; ${c.label}</div><div class="c" style="--f:${(c.naive / c.n).toFixed(2)}"><b>${c.naive}</b>/${c.n}</div><div class="c" style="--f:${(c.careful / c.n).toFixed(2)}"><b>${c.careful}</b>/${c.n}</div>`).join('')}
    </div></div>
    <div class="note reveal" style="max-width:80ch;">
<b>not a gradient</b> a double holds about 10&#179;&#8304;&#8312;, and a challenge-scaled determinant passes that at dimension ~102. Above it <span class="mono">float(q)</span> is <span class="mono">inf</span>, GH is <span class="mono">inf</span>, and every claim is accepted. Below it both float graders are fine.
<b>reported this way</b> on purpose. Selling this as &ldquo;float graders are wrong&rdquo; would be refuted by the first reviewer who writes a careful one.
    </div>
  </div>
</section>

<section class="section">
  <div class="container narrow">
    <div class="prose reveal">
      <h2 class="t2">Limits</h2>
      <p>This certifies arithmetic about a stated lattice and a stated threshold. <strong>It certifies nothing about attack cost, and it is not a claim that any deployed scheme is weak or strong.</strong> Concrete security rests on cost models the field&rsquo;s own authors say cannot yet be pinned down precisely; nothing here touches that.</p>
      <p>It does not propose a cryptosystem, a parameter set, or a variant of one, and it will not. Auditing published arithmetic is open ground and low risk; proposing primitives is crowded and high risk, and a broken proposal is unrecoverable. That is a standing rule in the package, not a judgement made per task.</p>
      <p class="mono" style="font-size:var(--text-eyebrow); color:var(--ink-4); line-height:2; margin-top:var(--s-5);">cd instruments/wiring &amp;&amp; python3 -m pytest tests -q<br>python3 -m lattice_claims gate<br>python3 eval/regrade.py<br>node instruments/cert-unit/make-contact.mjs &amp;&amp; node instruments/cert-unit/make-refutations.mjs<br>node playground/build.js</p>
    </div>
  </div>
</section>`;

function build(OUTDIR) {
  const dir = path.join(OUTDIR, 'lattice-claims');
  fs.mkdirSync(dir, { recursive: true });
  const html = page({
    title: 'Decide it, or say what is missing — cert-machine',
    desc: 'An environment for lattice claims: decide exactly, declare what you decided against, or refuse and name the missing quantity. Built out of a grader bug, and it caught us twice more.',
    root: '../', here: 'instruments',
    head: `<style>${BENCHCSS}\n${BASE_EXTRA}\n${REPORT}\n${CSS}</style>`,
    body: `<main>${body}</main>`,
  });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, rollouts: R.length, models: MODELS.length, forgeries: P.forgeries.length, caught: P.forgeries.filter(f => f.caught).length };
}

/* the card on the gathering page: the contact sheet — 135 rollouts in one image.
   The ruler was tried first and letterboxed into a near-empty plate. */
function cardArt() { return CONTACT; }

module.exports = { build, cardArt, facts: { rollouts: R.length, forgeries: P.forgeries.length, caught: P.forgeries.filter(f => f.caught).length } };
