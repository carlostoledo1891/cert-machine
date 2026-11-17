/* build.js — site/instruments/physics-key/index.html: the physics answer key.
   playground/physics-key/ · cert-machine · 2026-11-17

   A physics engine writes its state as binary64 numbers and each of those is an exact fraction, so a conservation law
   can be decided on a recorded run with whole numbers. This page lets a reader pick one of the 60 recorded MuJoCo runs
   (three scenes, five integrators, four timesteps), fetches its pinned bytes, and decides it again in the tab with the
   same decider the record was made with.

   WHAT THE PAGE READS, and nothing it types: certs/physics-key.json (every verdict and every number, written by
   tools/record-physics-key.js only when two deciders agree), corpus/physics-key/runs/runs.json (the manifest), the
   run files themselves (copied beside the page, each checked against its pinned sha256), and
   instruments/physicskey/decide.js, inlined byte for byte, so the tab runs the code that made the record.

   WHAT IT DOES NOT CLAIM: none of this is a bug report. MuJoCo's documentation states the behaviour this page
   measures; the page quotes it. The tolerances are the page's own. */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const ROOT = path.join(PG, '..');
const { page, esc } = require(path.join(PG, 'design', 'shell.js'));
const K = require(path.join(HERE, 'facts.js'));      /* the one reading of the record; it refuses when a sentence below stops being true */
const { REC, MAN, F, SCENES, INTEGRATORS, STEPS, NAME, HEAD_LAW, DEFAULT, run, top, need, sha } = K;
const fmt = (x) => Number(x).toLocaleString('en-US');
const RUNS_DIR = path.join(ROOT, 'corpus', 'physics-key', 'runs');
const DECIDE = fs.readFileSync(path.join(ROOT, 'instruments', 'physicskey', 'decide.js'), 'utf8');
const FMT = fs.readFileSync(path.join(HERE, 'fmt.js'), 'utf8');
const APP = fs.readFileSync(path.join(HERE, 'app.js'), 'utf8');
const CSS = fs.readFileSync(path.join(HERE, 'page.css'), 'utf8');
for (const [name, src] of [['decide.js', DECIDE], ['fmt.js', FMT], ['app.js', APP]]) need(!/<\/script/i.test(src), name + ' holds a closing script tag');
const man = {};
for (const r of MAN.runs) man[r.id] = r;
const ENGINE = K.engine;

const SCENE = {
  fall: { name: 'A falling body', idea: 'Its height has a formula.', seconds: 2,
    what: 'One body, dropped from rest, nothing in its way. Physics gives its height at every instant: the starting height minus half of g times the time squared.' },
  pendulum: { name: 'A pendulum', idea: 'Its energy cannot change.', seconds: 10,
    what: 'One weight on a frictionless hinge, let go from rest well above the horizontal. Nothing adds energy and nothing takes it away, so the total must stay what it was.' },
  top: { name: 'A tumbling body', idea: 'No force acts on it at all.', seconds: 10,
    what: 'One flat body in empty space, set spinning about its middle axis with a small nudge, so it flips over and over. No force and no torque act on it: its spin energy and its angular momentum must both stay what they were.' },
};
const dflt = top('euler', '0.002'), dfi = top('implicitfast', '0.002'), drk = top('rk4', '0.002'), fallE = K.fallE;

/* ---- the tables: one per scene, its headline law, every integrator at every timestep ---- */
function table(s) {
  const body = K.rowsOf(s).map((group) => {
    const cells = STEPS.map((h) => {
      const c = K.cell(s, group[0], h);
      return `<td><span class="pk-max">${c.max}</span>${c.end === null ? '' : '<span class="pk-end">' + c.end + ' at the end</span>'}<span class="pk-held">${c.held === null ? 'holds at no tolerance tried' : 'holds to ' + c.held}</span></td>`;
    }).join('');
    return `<tr><td class="k">${group.map((i) => NAME[i]).join(', ')}</td>${cells}</tr>`;
  }).join('');
  return `<div class="tw"><table class="pk-t"><thead><tr><th>integrator</th>${STEPS.map((h) => '<th>timestep ' + h + ' s' + (h === '0.002' ? ' <span class="pk-dflt">the default</span>' : '') + '</th>').join('')}</tr></thead><tbody>${body}</tbody></table></div>`;
}

/* ---- the card: the default run's spin energy climbing and the recommended integrator's falling, as decided ---- */
const trace = K.trace;
function cardArt() {
  const up = trace('top-euler-h0.002', 'T-ENERGY'), dn = trace('top-implicitfast-h0.002', 'T-ENERGY');
  const W = 120, H = 120, n = 60, top = Math.max(up[up.length - 1], -dn[dn.length - 1]) * 1.1;
  const line = (a) => { let d = ''; for (let j = 0; j <= n; j++) { const k = Math.round(j * (a.length - 1) / n); d += (j ? 'L' : 'M') + (j * W / n).toFixed(1) + ' ' + (H / 2 - a[k] / top * (H / 2 - 6)).toFixed(1); } return d; };
  return `<svg class="shape" viewBox="0 0 ${W} ${H}" role="img" aria-label="The spin energy of a body with no force on it, as recorded: rising under one integrator, falling under another, when it should stay level.">`
    + `<line x1="0" x2="${W}" y1="${H / 2}" y2="${H / 2}" stroke="currentColor" stroke-width="1" opacity=".35"/>`
    + `<path d="${line(up)}" fill="none" stroke="currentColor" stroke-width="2"/><path d="${line(dn)}" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".6"/></svg>`;
}

/* ---- the spec the tab reads ---- */
const SPEC = {
  dir: 'runs/', engine: ENGINE, default: DEFAULT, scenes: SCENES, integrators: INTEGRATORS, timesteps: STEPS,
  scene: SCENE, names: NAME,
  runs: MAN.runs.filter((r) => r.notRun === undefined).map((r) => ({ id: r.id, scene: r.scene, integrator: r.integrator, timestep: r.timestep, steps: r.steps, nq: r.nq, nv: r.nv, sha256: r.sha256, params: r.params })),
  record: Object.fromEntries(REC.runs.map((r) => [r.id, { status: r.status, nonFiniteStep: r.nonFiniteStep, laws: r.laws }])),
};

const sceneTabs = SCENES.map((s, i) => `<button type="button" role="tab" class="pk-step" data-scene="${s}" aria-selected="false"><span class="n">${i + 1}</span><span class="idea">${esc(SCENE[s].name)}</span><span class="nm">${esc(SCENE[s].idea)}</span></button>`).join('');
const pick = (attr, items, label) => `<div class="pk-pick" role="group" aria-label="${label}">${items.map(([v, t]) => `<button type="button" class="pk-opt" data-${attr}="${v}" aria-pressed="false">${t}</button>`).join('')}</div>`;

const body = `
<header class="hero pk-hero"><div class="wrap">
  <div class="eyebrow">Carlos Toledo &middot; instruments &middot; the physics answer key</div>
  <h1><span>Every number a simulator writes</span> <span>is an exact fraction.</span></h1>
  <p class="lede">So whether a recorded run kept its energy, to any tolerance you name, can be decided with whole numbers and no rounding. Three scenes whose physics is known exactly, run in ${esc(ENGINE)} with each of its five integrators at four timesteps. Pick a run: your tab fetches the recorded bytes and decides them again.</p>
</div></header>

<section class="wrap pk-sec" id="run">
  <div class="pk-ladder" role="tablist" aria-label="Three scenes with a known answer">${sceneTabs}</div>
  <div class="pk-machine">
    <div class="pk-top"><p id="pk-what"></p></div>
    <div class="pk-picks">
      <div><span class="eyebrow">integrator</span>${pick('integrator', INTEGRATORS.map((i) => [i, NAME[i]]), 'Integrator')}</div>
      <div><span class="eyebrow">timestep, seconds</span>${pick('timestep', STEPS.map((h) => [h, h]), 'Timestep')}</div>
    </div>
    <p class="pk-same" id="pk-same"></p>
    <div class="pk-stage">
      <div class="pk-view">
        <svg id="pk-anim" viewBox="0 0 320 320" role="img" aria-label="The recorded run, replayed"></svg>
        <div class="pk-play">
          <button class="pk-btn solid" id="pk-playb" type="button">Pause</button>
          <input id="pk-scrub" type="range" min="0" max="1000" value="0" aria-label="Step">
          <span class="pk-clock" id="pk-clock"></span>
        </div>
      </div>
      <div class="pk-chartbox">
        <div class="pk-laws" id="pk-laws" role="group" aria-label="Law"></div>
        <svg id="pk-chart" viewBox="0 0 640 300" role="img" aria-label="How far the recorded run is from the law, step by step, on a scale of powers of ten"></svg>
        <p class="pk-cap" id="pk-cap"></p>
      </div>
    </div>
    <div class="pk-verdicts" id="pk-verdicts"></div>
    <p class="pk-status" id="pk-status" aria-live="polite"></p>
  </div>
</section>

<section class="wrap pk-sec" id="record">
  <h2>What the 60 recorded runs say.</h2>
  <p class="prose">In each cell: the largest distance from the law anywhere in the run, rounded up, and the tightest of six tolerances the whole run stays inside. Integrators that wrote the same bytes share a row. Nothing was refused: all ${fmt(K.verdicts)} verdicts are ${fmt(REC.count.CERTIFIED)} Certified and ${fmt(REC.count.REFUTED)} Refuted.</p>
  <h3>The falling body: height against the formula, over 2 seconds</h3>
  ${table('fall')}
  <p class="prose">At the default timestep the body ends ${F.size(fallE.max.hi, 'm')} from where the formula puts it, and passes 1 cm of error at step ${fmt(fallE.tolerances['1e-2'].firstStep)}. Its speed is right to the last digits; only the position lags, which is what a first-order step does. With RK4 the position stays within a millionth of a millionth of a metre at the same timestep.</p>
  <h3>The pendulum: energy against its starting value, over 10 seconds</h3>
  ${table('pendulum')}
  <h3>The tumbling body: spin energy against its starting value, over 10 seconds</h3>
  ${table('top')}
  <p class="prose">With Euler, which is still the engine&rsquo;s default, the spin energy rises at the very first step and is ${F.signed(dflt['T-ENERGY'].last.lo, dflt['T-ENERGY'].last.hi, 'rel')} after 10 seconds at the default timestep, with no force acting. With implicitfast, the integrator the documentation recommends, it is ${F.signed(dfi['T-ENERGY'].last.lo, dfi['T-ENERGY'].last.hi, 'rel')}: the energy never rises at any step of any of those runs, exactly, and it leaks instead. With RK4 the largest change is ${F.size(drk['T-ENERGY'].max.hi, 'rel')}.</p>
</section>

<section class="wrap pk-sec" id="said">
  <div class="pk-grow">
    <div>
      <h2>The engine&rsquo;s own documentation says so.</h2>
      <p class="prose">None of this is a fault report. An integrator of finite order is expected to move away from the true motion, and MuJoCo&rsquo;s documentation describes the behaviour above. What this page adds is the decision: each statement checked on the recorded bytes with whole numbers, the step where it first fails, and the same check run again in your tab.</p>
      <p class="prose">One sentence of that documentation is a claim exact enough to decide: that under its implicit integrators the spin energy of a free body never increases. On the ${K.docRuns} recorded runs it covers, it holds at every step with no tolerance at all. (The four <span class="m">discrete</span> runs are the same bytes as implicitfast in this scene, so it holds there too.)</p>
    </div>
    <figure class="pk-quote">
      <blockquote>The kinetic energy of a spinning free body is non-increasing in the absence of applied force. Steady spins about principal axes are conserved almost exactly; tumbling motion is mildly damped [&hellip;]. Systems requiring long-horizon energy conservation of tumbling bodies should use the RK4 integrator.</blockquote>
      <figcaption>MuJoCo documentation, Computation, Numerical integration, &ldquo;Gyroscopic derivatives for free bodies&rdquo;, read 17 November 2026. <a href="https://mujoco.readthedocs.io/en/stable/computation/index.html">Source</a>.</figcaption>
    </figure>
  </div>
</section>

<section class="wrap pk-sec" id="how">
  <h2>How a float gets decided.</h2>
  <div class="pk-three">
    <p class="prose"><b>The bytes.</b> A run is a file: the engine&rsquo;s time, positions and velocities after every step, as it wrote them. Each of the 60 files is named by its sha256, and your tab checks that before deciding anything.</p>
    <p class="prose"><b>The fraction.</b> A 64-bit float is a whole number times a power of two. Energy and angular momentum are sums of products of those, so they are fractions too, and &ldquo;within 1%&rdquo; becomes a comparison of two whole numbers. Only the pendulum needs a cosine, which is trapped between two fractions as tightly as the comparison needs.</p>
    <p class="prose"><b>Twice.</b> The record was written only after two programs that share no code, one in JavaScript and one in Python, agreed on every field of every run, and after ${REC.planted.files.length} planted files with a known answer were each decided as planted.</p>
  </div>
  <p class="prose">The rules were written and committed before the first simulation step; one law was added afterwards and is marked as such. <a href="/reports/physics-key.html">The report</a> has the rules, the limits and what is still open.</p>
</section>`;

const FOOT = '<p>One engine, one version, one machine. Every verdict is about a recorded file of bytes, not about the engine in general; the tolerances are this page&rsquo;s, not a promise the engine makes; and a law that holds at every recorded step says nothing about the instants between them.</p>';

function build(OUT) {
  const dir = path.join(OUT, 'physics-key'), rdir = path.join(dir, 'runs');
  fs.mkdirSync(rdir, { recursive: true });
  /* the run files beside the page, each the pinned bytes; nothing else in runs/ */
  const want = new Set();
  let total = 0;
  for (const r of SPEC.runs) {
    const name = r.id + '.f64.gz', src = path.join(RUNS_DIR, name), gz = fs.readFileSync(src);
    need(sha(zlib.gunzipSync(gz)) === r.sha256, name + ' is not the pinned file');
    want.add(name); total += gz.length;
    const dst = path.join(rdir, name);
    if (!fs.existsSync(dst) || !fs.readFileSync(dst).equals(gz)) fs.copyFileSync(src, dst);
  }
  for (const f of fs.readdirSync(rdir)) if (!want.has(f)) fs.unlinkSync(path.join(rdir, f));
  const html = page({
    title: 'The physics answer key',
    desc: 'Every number a physics engine writes is an exact fraction, so whether a recorded run conserved energy can be decided with whole numbers. Sixty MuJoCo runs of three scenes with a known answer, decided again in your tab.',
    path: '/instruments/physics-key/', body, css: CSS, foot: FOOT,
    script: `<script id="pk-spec" type="application/json">${JSON.stringify(SPEC).replace(/</g, '\\u003c')}</script>\n<script id="pk-decide">${DECIDE}</script>\n<script>${FMT}</script>\n<script>${APP}</script>`
  });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, runs: SPEC.runs.length, dataBytes: total };
}

module.exports = { build, cardArt, facts: { runs: REC.runs.length, engine: ENGINE, verdicts: REC.count.CERTIFIED + REC.count.REFUTED } };
