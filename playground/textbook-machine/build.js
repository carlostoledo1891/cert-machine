/* build.js — site/instruments/textbook-machine/index.html: the textbook machine.
   playground/textbook-machine/ · cert-machine · 2026-11-12

   THE OPERATOR'S DRAFT (~/Downloads/The textbook machine · instrument demo.html, 2026-11-11) rebuilt in the house
   system, with what the brainstorm of 2026-11-11 asked of it: every step said as a sentence; the machines as a ladder of
   ideas (follow the rules, answer yes or no, check a setting, find a setting, will it stop?); "check a setting" beside
   "find a setting", two series on one chart; the busy beaver table as the reason REFUSED exists, each value as its
   source prints it; reserved heights, so no control moves the layout (tools/check-textbook-machine.js measures it);
   "more than doubles", which the battery holds for every n the page prints; and a short menu of claims the machine
   itself decides, CERTIFIED, REFUTED or REFUSED.

   WHAT THE PAGE READS, and nothing it types: playground/textbook-machine/out/facts.json (every count, re-derived here
   from machines.js and refused unless identical, and again by battery.js in the test suite), and machines.js itself,
   inlined byte for byte, so the tab runs the code that counted the record. The tab counts everything again and says
   whether it got the same numbers. */
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const { page, esc } = require(path.join(PG, 'design', 'shell.js'));
const BAT = require(path.join(HERE, 'battery.js'));
const TM = require(path.join(HERE, 'machines.js'));
const OG = require(path.join(PG, '..', 'tools', 'build-og-report.js'));   /* the page's own light art card (og-textbook-machine.png) */
const die = (m) => { throw new Error('textbook machine: ' + m); };

const F = JSON.parse(fs.readFileSync(BAT.REC, 'utf8'));
if (fs.readFileSync(BAT.REC, 'utf8') !== BAT.text(BAT.derive())) die('out/facts.json does not re-derive from machines.js: node playground/textbook-machine/battery.js --write after a reviewed change');
const MACHINES = fs.readFileSync(path.join(HERE, 'machines.js'), 'utf8');
const APP = fs.readFileSync(path.join(HERE, 'app.js'), 'utf8');
const CSS = fs.readFileSync(path.join(HERE, 'page.css'), 'utf8');
const fmt = (x) => Number(x).toLocaleString('en-US');
const S = F.series, N = S.n.length, last = N - 1;
const champ = (k) => F.champions.find((c) => c.states === k);
const claimOf = (id) => F.claims.find((c) => c.id === id);
if (!F.ratios.every((r) => r > 2)) die('the page says "more than doubles" and a ratio is not above 2');

/* ---- the chart: finding against checking, 1 to 10 switches. Both series are counts of exact runs, so every mark is
   solid; identity is carried by weight and by the words beside the marks, never by a colour. ---- */
function chart() {
  const Wd = 640, H = 300, L = 8, R = 8, T = 28, B = 34, pw = Wd - L - R, ph = H - T - B, col = pw / N;
  const max = S.find[last], y = (v) => T + ph - Math.max(2, (v / max) * ph);
  let g = '';
  for (let i = 0; i < N; i++) {
    const x0 = L + i * col, fw = col * 0.52, cw = Math.max(5, col * 0.14), fx = x0 + (col - fw - cw - 3) / 2, cx = fx + fw + 3;
    g += `<g class="tm-col" data-i="${i}" tabindex="${i === last ? 0 : -1}" role="button" aria-label="${S.n[i]} switch${S.n[i] === 1 ? '' : 'es'}: checking ${fmt(S.check[i])} steps, finding ${fmt(S.find[i])} steps">`
      + `<rect class="tm-hit" x="${x0.toFixed(1)}" y="${T - 20}" width="${col.toFixed(1)}" height="${ph + 20 + B}"/>`
      + `<path class="tm-find" d="M${fx.toFixed(1)} ${(T + ph).toFixed(1)}V${(y(S.find[i]) + 3).toFixed(1)}q0 -3 3 -3h${(fw - 6).toFixed(1)}q3 0 3 3V${(T + ph).toFixed(1)}Z"/>`
      + `<rect class="tm-check" x="${cx.toFixed(1)}" y="${y(S.check[i]).toFixed(1)}" width="${cw.toFixed(1)}" height="${(T + ph - y(S.check[i])).toFixed(1)}"/>`
      + `<text class="tm-xl" x="${(x0 + col / 2).toFixed(1)}" y="${T + ph + 18}">${S.n[i]}</text></g>`;
  }
  const lx = L + last * col + col * 0.24;
  return `<svg class="tm-chart" viewBox="0 0 ${Wd} ${H}" role="group" aria-label="Steps to check the setting that opens the lock and to find it by trying every setting, for 1 to 10 switches. Checking grows by one step per switch; finding more than doubles with every switch.">`
    + g
    + `<line class="tm-base" x1="${L}" x2="${Wd - R}" y1="${T + ph}" y2="${T + ph}"/>`
    + `<text class="tm-dl" x="${lx.toFixed(1)}" y="${(y(S.find[last]) - 8).toFixed(1)}" text-anchor="end">finding: ${fmt(S.find[last])}</text>`
    + `<text class="tm-dl dim" x="${L}" y="${(T + ph - 10).toFixed(1)}">checking: ${fmt(S.check[0])} to ${fmt(S.check[last])}, the short bars</text>`
    + `<text class="tm-xt" x="${Wd - R}" y="${H - 1}" text-anchor="end">switches</text></svg>`;
}

/* ---- the space-time picture of the four-state champion: one row per step, time running down ---- */
function spacetime(card) {
  const st = F.spacetime, rows = st.rows, w = rows[0].length, c = card ? 4.6 : 7, r = card ? 4.6 : 3.4;
  let d = '', h = '';
  rows.forEach((row, t) => {
    for (let i = 0; i < w; i++) if (row[i] === '1') d += `M${(i * c).toFixed(1)} ${(t * r).toFixed(1)}h${(c - 0.8).toFixed(1)}v${(r - 0.6).toFixed(1)}h-${(c - 0.8).toFixed(1)}Z`;
    h += (t ? 'L' : 'M') + ((st.heads[t] - st.lo) * c + c / 2).toFixed(1) + ' ' + (t * r + r / 2).toFixed(1);
  });
  const W = w * c, Hh = rows.length * r;
  return `<svg class="${card ? 'shape' : 'tm-st'}" viewBox="${card ? -((Hh - W) / 2).toFixed(1) : 0} 0 ${card ? Hh.toFixed(1) : W.toFixed(1)} ${Hh.toFixed(1)}" role="img" aria-label="The four-state champion's run, one row per step from the blank tape at the top to the stop at the bottom: ${rows.length - 1} steps, ${champ(4).ones} ones left.">`
    + `<path d="${d}" fill="currentColor" opacity="${card ? 0.85 : 0.9}"/><path d="${h}" fill="none" stroke="currentColor" stroke-width="${card ? 1.4 : 1}" opacity="0.45"/></svg>`;
}

/* ---- the busy beaver table: each value as its source prints it; the tab runs the champions ---- */
const SRC = F.sources;
const bbRows = [2, 3, 4, 5, 6].map((k) => {
  const s = SRC[k], c = champ(k);
  const val = s.steps === null ? '<span class="tag open">Refused</span> <span class="tm-unk">not known</span>' : fmt(s.steps);
  const run = c ? `<button type="button" class="tm-btn sm" data-bb="${k}">Run it</button><span class="tm-bbout" id="tm-bb${k}" aria-live="polite"></span>` : '<span class="tm-bbout dim">no champion to run</span>';
  return `<tr><td class="k">${k}</td><td class="v">${val}</td><td>${esc(s.who)} <a class="tm-src" href="${esc(s.url)}">source</a></td><td class="run">${run}</td></tr>`;
}).join('');

/* ---- the claims ---- */
const VK = { CERTIFIED: 'held', REFUTED: 'dep', REFUSED: 'open' };
const claims = F.claims.map((c) => `<li class="tm-claim" data-claim="${c.id}"><p>${esc(c.text)}</p>`
  + `<div class="tm-cact"><button type="button" class="tm-btn" data-decide="${c.id}">Decide</button>`
  + `<span class="tm-cout" id="tm-c-${c.id}" aria-live="polite"></span>`
  + `<button type="button" class="tm-watch" data-watch="${c.id}">watch it</button></div></li>`).join('');

const ladder = TM.ORDER.map((k, i) => `<button type="button" role="tab" class="tm-step" data-k="${k}" aria-selected="false"><span class="n">${i + 1}</span><span class="idea">${esc(TM.M[k].idea)}</span><span class="nm">${esc(TM.M[k].name)}</span></button>`).join('');

const SPEC = { series: S, champions: F.champions.map((c) => ({ states: c.states, steps: c.steps, ones: c.ones })), claims: F.claims.map((c) => ({ id: c.id, verdict: c.verdict, steps: c.steps })) };

const body = `
<header class="hero tm-hero"><div class="wrap">
  <div class="eyebrow">Carlos Toledo &middot; instruments &middot; the textbook machine</div>
  <h1><span>One tape. One head.</span> <span>A few rules.</span></h1>
  <p class="lede">Everything a computer can do, this can do. Slower, but you can watch. Five machines, each one idea past the last; every step is said in words as it happens.</p>
</div></header>

<section class="wrap tm-sec" id="machine">
  <div class="tm-ladder" role="tablist" aria-label="Five machines, each one idea past the last">${ladder}</div>
  <div class="tm-machine">
    <div class="tm-top"><p id="tm-what"></p><span class="tm-verdict" id="tm-verdict"></span></div>
    <div class="tm-tapewrap" id="tm-tapewrap">
      <div class="tm-state">state <b id="tm-state"></b></div>
      <div class="tm-tape"><div class="tm-tape-in" id="tm-tape"></div></div>
      <div class="tm-head" id="tm-head"></div>
      <div class="tm-fade l"></div><div class="tm-fade r"></div>
    </div>
    <p class="tm-say" id="tm-say" aria-live="off"></p>
    <div class="tm-dash">
      <div class="tm-count"><span class="eyebrow">steps</span><b id="tm-steps">0</b></div>
      <div class="tm-ctl">
        <label class="tm-speed"><span class="eyebrow">speed</span><input id="tm-speedr" type="range" min="0" max="100" value="38" aria-label="Speed"></label>
        <button class="tm-btn" id="tm-reset" type="button">Reset</button>
        <button class="tm-btn" id="tm-stepb" type="button">Step</button>
        <button class="tm-btn solid" id="tm-play" type="button">Play</button>
      </div>
    </div>
    <div class="tm-lower">
      <div>
        <span class="eyebrow" id="tm-inlab">Input</span>
        <div class="tm-inp" id="tm-inp"></div>
        <p class="tm-hint" id="tm-hint"></p>
      </div>
      <div>
        <span class="eyebrow">the rules &middot; the bright one just fired</span>
        <div class="tm-rules-box"><table class="tm-rules" id="tm-rules"></table></div>
      </div>
    </div>
  </div>
</section>

<section class="wrap tm-sec" id="check-find">
  <div class="tm-grow">
    <div>
      <h2>Checking is one pass. Finding more than doubles.</h2>
      <p class="prose">The lock opens only when every switch is on. Checking a setting walks along it once: ${fmt(S.check[0])} steps for one switch, ${fmt(S.check[last])} for ten, one more for each switch added. Finding the setting by trying them in order, checking each, more than doubles with every switch: ${fmt(S.find[0])} steps for one switch, ${fmt(S.find[last])} for ten.</p>
      <p class="prose">The lock is simple on purpose, so you can see the answer before the machine does. What it shows is the gap: checking a proposed answer stays cheap while finding one grows out of reach. That gap is why checking someone else&rsquo;s proof is feasible at all: the checker never has to find the proof, only follow it.</p>
      <p class="prose">For a whole family of such puzzles, 3-SAT, the Exponential Time Hypothesis (Impagliazzo and Paturi, 1999) says no machine, however clever, can keep the work from multiplying by some fixed factor above one with each switch added. In October 2026 OpenAI and Anthropic each published a Lean proof meant to show that it is false. <a href="/reports/eth-chain.html">What I checked in those proofs</a>.</p>
    </div>
    <figure class="tm-fig">
      <div class="tm-key"><span><i class="sw find"></i>finding a setting</span><span><i class="sw check"></i>checking one</span></div>
      ${chart()}
      <p class="tm-ro" id="tm-ro" aria-live="polite">${S.n[last]} switches: checking ${fmt(S.check[last])} steps, finding ${fmt(S.find[last])}, which is ${F.ratios[last - 1].toFixed(2)} times the count for ${S.n[last - 1]}.</p>
      <figcaption>Every count is a run of the two machines above, to the last step, made when this page was built. <span id="tm-rerun">Your tab runs all twenty again when the page opens.</span></figcaption>
      <div class="tw"><table class="tm-t tm-series"><thead><tr><th>switches</th>${S.n.map((n) => '<th>' + n + '</th>').join('')}</tr></thead><tbody>
        <tr><td class="k">checking</td>${S.check.map((v) => '<td>' + fmt(v) + '</td>').join('')}</tr>
        <tr><td class="k">finding</td>${S.find.map((v) => '<td>' + fmt(v) + '</td>').join('')}</tr></tbody></table></div>
    </figure>
  </div>
</section>

<section class="wrap tm-sec" id="stop">
  <div class="tm-grow">
    <div>
      <h2>Some questions running cannot answer.</h2>
      <p class="prose">Running a machine can show that it stops: you watch it stop. Running can never show that it does not, because at every step it might still stop at the next one. So a checker that only runs things needs a third answer besides yes and no. On this site that answer is REFUSED: not false, only not decided by this check.</p>
      <p class="prose">The busy beaver question asks it at full strength: of all the machines with n states that stop on a blank tape, which runs longest? Answering it means settling every other machine of that size, including each one that never stops, and each of those needs an argument, not a run.</p>
    </div>
    <figure class="tm-fig tm-stfig">
      ${spacetime(false)}
      <figcaption>The four-state champion, one row per step, time running down: ${fmt(champ(4).steps)} steps from a blank tape, and ${champ(4).ones} ones left when it stops. The faint line is the head.</figcaption>
    </figure>
  </div>
  <div class="tw"><table class="tm-t tm-bb"><thead><tr><th>states</th><th>the longest run that stops</th><th>how it is known</th><th>in your tab</th></tr></thead><tbody>${bbRows}</tbody></table></div>
  <p class="prose">Your tab runs each champion and confirms that it stops after exactly that many steps. That no other machine of its size runs longer is what the cited proofs establish; a run cannot.</p>
</section>

<section class="wrap tm-sec" id="claims">
  <h2>Give it a claim.</h2>
  <p class="prose">Each claim names a machine and what it is given. Decide runs it in your tab with a budget of ${fmt(F.budget)} steps: <span class="tag held">Certified</span> when the run ends the way the claim says, <span class="tag dep">Refuted</span> when it ends the other way, <span class="tag open">Refused</span> when the budget runs out first.</p>
  <ul class="tm-claims">${claims}</ul>
</section>`;

const FOOT = '<p>A single-tape teaching machine. The Lean chain on the ETH page uses the multitape machine of cslib, which is a different object. Every step count here was counted by running the machine, once when the page was built and again in your tab; the busy beaver values are as their sources print them.</p>';

function build(OUT) {
  const dir = path.join(OUT, 'textbook-machine');
  fs.mkdirSync(dir, { recursive: true });
  const html = page({
    title: 'The textbook machine',
    desc: 'A Turing machine you run in your browser: one tape, one head, a few rules. Five machines up a ladder of ideas, each step said in words; checking a setting stays one pass while finding one more than doubles with every switch; and the question running cannot answer.',
    path: '/instruments/textbook-machine/', body, css: CSS, foot: FOOT, og: { image: '/og-textbook-machine.png', alt: OG.alt('textbook-machine') },
    script: `<script id="tm-spec" type="application/json">${JSON.stringify(SPEC).replace(/</g, '\\u003c')}</script>\n<script>${MACHINES}</script>\n<script>${APP}</script>`
  });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length };
}

/* the card: the four-state champion's run, plain ink */
const cardArt = () => spacetime(true);
module.exports = { build, cardArt, facts: { find10: S.find[last], check10: S.check[last], n: S.n[last] } };
