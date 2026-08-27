/* Smoke test for mfg-lab.html — Proxy DOM stubs, the house battery convention.
   Verifies: script evaluates; every module initializes (each reset() runs real
   solves); rAF loop drives frames; new features (activateTab, hash apply,
   presets, GGR seed API, card tools injection) execute without error.

   COUNTS, MEASURED 2026-07-31 — do not restate either from memory:
     · 57 checks (counted from this run's own summary line; was 52 before
       the chrome-vocabulary gates: .legend-only, ghost --data, grid2, no
       inline hex swatches, body links --fp-deep);
     · MODS in mfg-lab.html registers 9 modules
       ('1','lq','2d','st','pr','gg','wd','wv','me' — 8 live + the static
       'me' prose module). This header said "all six modules" until today;
       it predated MWD, MWV and the certificates page. A remembered count is
       this repo's most repeated defect. */
'use strict';
const fs = require('fs');
const path = require('path');

/* ---------- element stub ---------- */
function makeCtx(owner) {
  return new Proxy({}, {
    get(t, p) {
      if (p === 'canvas') return owner;
      if (p === 'createImageData') return (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h });
      if (p === 'getImageData') return (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h });
      if (p === 'measureText') return () => ({ width: 10 });
      if (p in t) return t[p];
      return () => undefined;            // any drawing call is a no-op
    },
    set(t, p, v) { t[p] = v; return true; }
  });
}

let idCounter = 0;
function makeEl(tag, id) {
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    id: id || ('el' + (++idCounter)),
    children: [],
    style: {},
    dataset: {},
    attributes: {},
    _handlers: {},
    value: '', defaultValue: '', type: '',
    textContent: '', innerHTML: '', className: '', title: '',
    clientWidth: 600,
    classList: {
      _s: new Set(),
      add(...c) { c.forEach(x => this._s.add(x)); },
      remove(...c) { c.forEach(x => this._s.delete(x)); },
      toggle(c, f) { if (f === undefined) f = !this._s.has(c); f ? this._s.add(c) : this._s.delete(c); return f; },
      contains(c) { return this._s.has(c); }
    },
    setAttribute(k, v) { el.attributes[k] = String(v); if (k === 'width' || k === 'height') el['_attr_' + k] = +v; },
    getAttribute(k) { return el.attributes[k]; },
    removeAttribute(k) { delete el.attributes[k]; },
    addEventListener(t, fn) { (el._handlers[t] = el._handlers[t] || []).push(fn); },
    removeEventListener() {},
    dispatchEvent(ev) { (el._handlers[ev.type] || []).forEach(fn => fn.call(el, ev)); return true; },
    click() { el.dispatchEvent({ type: 'click', target: el, preventDefault() {} }); },
    focus() {},
    appendChild(c) { el.children.push(c); return c; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getContext(kind) { if (!el._ctx) el._ctx = makeCtx(el); return el._ctx; },
    toBlob(cb) { cb(null); }
  };
  // canvas-ish numeric dims (before the lab shadows them)
  el.width = 600; el.height = 300;
  return el;
}

/* The artifact is now routed: pages carry the argument, and the ARIA tablist
   covers the four bench experiments only. Result sections (pr, gg, wd, me) are
   owned by routes and activated by the router, with no button of their own.
   The battery therefore drives BOTH surfaces the way a reader does — nav
   buttons by data-route, bench tabs by data-tab — instead of by index. */
const TABS = ['1', 'lq', '2d', 'st'];
const tabBtns = TABS.map((t, i) => {
  const b = makeEl('button', 'tb' + t);
  b.dataset.tab = t;
  if (i === 0) b.classList.add('tab', 'active'); else b.classList.add('tab');
  return b;
});
const tab = id => {
  const b = tabBtns.find(x => x.dataset.tab === id);
  if (!b) throw new Error('no bench tab ' + id);
  return b;
};
/* In-lab routes. Prose tabs move to site pages (/errata, /program, /certificates);
   this list must match the artifact's ROUTES object exactly. */
const ROUTES = ['/wardrop', '/price', '/water-value', '/random-supply', '/bench'];
const navBtns = ROUTES.map((r, i) => {
  const b = makeEl('button', 'nav' + i);
  b.dataset.route = r;
  b.classList.add('nav');
  if (i === 0) b.classList.add('active');
  return b;
});
const go = r => {
  const b = navBtns.find(x => x.dataset.route === r);
  if (!b) throw new Error('no route ' + r);
  b.click();
};

const registry = new Map();
function getEl(id) {
  if (!registry.has(id)) {
    const el = makeEl('div', id);
    // range inputs by known ids
    if (/^(sigma|cong|gamma|alpha1|beta|c2d|s2d|stS|stC|stG|stA|stV|prPk|prWd|prAd|prS|ggA|ggS|wdQ2|wdWT|wvDepth|wvRbar|wvHbar|wvPhi|wvSeed)$/.test(id)) {
      el.type = 'range';
      const defaults = { sigma: '0.18', cong: '2.0', gamma: '1.5', alpha1: '1.0', beta: '0.67',
        c2d: '0.5', s2d: '0.15', stS: '0.18', stC: '2.0', stG: '1.5', stA: '1.0', stV: '1.0',
        prPk: '0.5', prWd: '0.7', prAd: '1.25', prS: '0.10', ggA: '0.25', ggS: '1.0', wdQ2: '50', wdWT: '2',
        wvDepth: '4', wvRbar: '0.8', wvHbar: '0.35', wvPhi: '0.55', wvSeed: '7' };
      el.value = el.defaultValue = defaults[id] || '0';
    }
    if (id === 'ggSeed') { el.type = 'text'; el.value = '42'; }
    if (/^sec(1|lq|2d|st|pr|gg|wd|wv|me)$/.test(id)) {
      el.querySelectorAll = sel => (sel === 'canvas' ? [] : []);
    }
    if (/^pg(Start|Wardrop|Price|Water|Noise|Bench|Cert|Verif|Program)$/.test(id)) {
      el.querySelectorAll = () => [];
    }
    registry.set(id, el);
  }
  return registry.get(id);
}

/* ---------- globals ---------- */
const rafQ = [];
const g = globalThis;
g.window = g;
try { g.addEventListener = () => {}; } catch (e) { Object.defineProperty(g, 'addEventListener', { value: () => {}, configurable: true }); }
g.document = {
  title: 'MFG Lab — smoke',
  getElementById: getEl,
  createElement: tag => makeEl(tag),
  querySelectorAll: sel => {
    if (sel === '.tab') return tabBtns;
    if (sel === '.nav') return navBtns;
    if (sel === '.chip' || sel === '.card' || sel === '[data-goto]') return [];
    return [];
  },
  addEventListener() {}
};
g.matchMedia = () => ({ matches: false });
g.requestAnimationFrame = cb => { rafQ.push(cb); return rafQ.length; };
g.history = { replaceState() {} };
/* boot on the bench so the first assertions see the same auto-solve the old
   single-tab landing gave; the default '/' route is asserted separately below. */
g.location = { hash: '#/bench&t=1' };
Object.defineProperty(g, 'navigator', { value: { clipboard: { writeText: () => Promise.resolve() } }, configurable: true });
if (typeof g.Event === 'undefined') g.Event = class { constructor(t) { this.type = t; } };
g.URL = g.URL || { createObjectURL: () => 'blob:x', revokeObjectURL() {} };
if (typeof g.performance === 'undefined') g.performance = { now: () => Date.now() };
if (typeof g.getComputedStyle === 'undefined')
  g.getComputedStyle = () => ({ getPropertyValue: () => '#000' });

/* ---------- run the extracted script ---------- */
/* Extract the script from the HTML at run time. Previously this read a
   hardcoded /home/claude/mfg/script.js, which could (and did) go stale
   relative to the artifact under test — the suite reported green while
   validating an older file. Deriving from the HTML makes that impossible. */
/* The '..' segment that used to sit in this join was a leftover from a nested
   sandbox layout. It resolved one level ABOVE the repo, to a path that does not
   exist, so `node smoke.js` died at readFileSync and the suite only ran when
   MFG_HTML happened to be set. Worse: a stale July-18 copy of mfg-lab.html sits
   in a sibling directory, so on a slightly different layout this would have
   silently certified the wrong artifact — the exact defect FINDINGS.md Result 5
   is about. Resolve against __dirname, and print the sha256 so which-file-was-
   validated is answerable at a glance rather than after a session of forensics. */
/* A MISSING SUBJECT MUST BE A SENTENCE, NOT A STACK TRACE. Guard copied from
   test-index.js (which already solved this for itself). An unguarded
   readFileSync throws ENOENT: the runner sees a node internal frame and a
   nonzero exit, and cannot tell "the gate caught something" from "the gate is
   broken". Worse, the throw aborts the module, so every check after it — and
   the PASS/FAIL summary — silently stops running. MEASURED 2026-07-28: with
   MFG_HTML pointed at a missing path this battery printed ZERO PASS lines,
   ZERO FAIL lines and a stack trace. The guard prints on stdout, where this
   battery's other FAIL lines live, so a runner grepping one stream sees it. */
function mustExist(p, what, advice) {
  if (fs.existsSync(p)) return;
  console.log('FAIL  S0 ' + what + ' is not there: ' + p);
  console.log('      This is a MISSING FILE, not a failed assertion. ' + advice);
  console.log('\n0/0 checks passed — subject missing, so NO check in this battery ran.');
  process.exit(1);
}

const HTML = process.env.MFG_HTML || require('path').resolve(__dirname, '..', 'mfg-lab.html');
mustExist(HTML, 'the artifact this battery smokes',
  'Re-point MFG_HTML (or the default beside this file) at the artifact under test; ' +
  'if the artifact was renamed or retired, re-point or retire this battery deliberately, ' +
  'do not let it crash.');
const html = fs.readFileSync(HTML, 'utf8');

/* --- extraction: count blocks LAZILY, then choose one BY NAME -------------
   This used to be a single GREEDY /<script>([\s\S]*)<\/script>/. On a
   one-block file that is right by accident; on a two-block file it swallows
   `</script> … <script>` into the middle of the source and `new Function`
   dies with `SyntaxError: Unexpected token '<'` — exit 1, zero PASS/FAIL
   lines, indistinguishable from a broken harness.

   MEASURED 2026-07-28 over the 30 HTML artifacts tracked in this repository:
   10 carry no bare <script> block, 12 carry one, and 8 carry TWO. So the
   two-block shape is ordinary, not exotic — a generated page routinely pairs a
   behaviour block with a base64 payload block — and one-block was never a
   property of artifacts, only of the one artifact this battery happened to be
   pointed at. A harness that is right by accident on its own subject and dies
   on a quarter of the tree is the "hardcoded path" defect wearing a regex.

   The block count is REPORTED, never guessed. With more than one block the
   battery refuses rather than picking silently: pass MFG_SCRIPT_INDEX=<n> to
   say which one, so the choice is on the record instead of in a regex. */
const rawBlocks = (html.match(/<script>([\s\S]*?)<\/script>/g) || [])
  .map(b => b.slice('<script>'.length, -'</script>'.length));
/* Theme bootstrap (FOUC + .theme-toggle) is short and names enclosure-theme —
   not the lab kernel. Drop it when auto-selecting so Phase-4 chrome does not
   force MFG_SCRIPT_INDEX on every instrument. IDX still indexes rawBlocks. */
const isThemeBoot = (b) => b.length < 5000 && /enclosure-theme/.test(b);
const blocks = rawBlocks.filter((b) => !isThemeBoot(b));
const sizes = rawBlocks.map((b, i) => '[' + i + '] ' + b.length + ' chars'
  + (isThemeBoot(b) ? ' theme-boot' : '')).join(' · ');
const IDX = process.env.MFG_SCRIPT_INDEX === undefined ? null : Number(process.env.MFG_SCRIPT_INDEX);
if (rawBlocks.length === 0) {
  console.log('FAIL  S0a no bare <script> block in ' + HTML);
  console.log('      This is a MISSING SUBJECT, not a failed assertion. The battery runs the');
  console.log('      artifact\'s own script; there is none to run.');
  console.log('\n0/0 checks passed — nothing to extract, so NO check in this battery ran.');
  process.exit(1);
}
if (IDX !== null && !(Number.isInteger(IDX) && IDX >= 0 && IDX < rawBlocks.length)) {
  console.log('FAIL  S0b MFG_SCRIPT_INDEX=' + process.env.MFG_SCRIPT_INDEX +
              ' is not one of the ' + rawBlocks.length + ' bare <script> blocks in ' + HTML);
  console.log('      blocks: ' + sizes);
  console.log('\n0/0 checks passed — no block selected, so NO check in this battery ran.');
  process.exit(1);
}
if (IDX === null && blocks.length !== 1) {
  console.log('FAIL  S0c ' + HTML + ' carries ' + rawBlocks.length +
              ' bare <script> blocks (' + blocks.length + ' after skipping theme-boot);' +
              ' this battery runs ONE and will not guess which.');
  console.log('      blocks: ' + sizes);
  console.log('      A generated page routinely pairs a behaviour block with a base64 payload');
  console.log('      block; running the wrong one, or the greedy span between them, is a fake');
  console.log('      certificate for the harness itself. Re-run with MFG_SCRIPT_INDEX=<n>.');
  console.log('\n0/0 checks passed — block ambiguous, so NO check in this battery ran.');
  process.exit(1);
}
const src = IDX === null ? blocks[0] : rawBlocks[IDX];
const sha = require('crypto').createHash('sha256').update(html).digest('hex').slice(0, 16);
console.log('harness: ' + HTML);
const runIdx = IDX === null ? rawBlocks.indexOf(src) : IDX;
console.log('         ' + Buffer.byteLength(html, 'utf8') + ' bytes · sha256 ' + sha +
            ' · ' + rawBlocks.length + ' bare <script> block(s) [' + sizes + ']' +
            ' · running block ' + runIdx + ', ' + src.length + ' chars');
const t0 = Date.now();
/* Same rule as the missing file and the ambiguous block: a THROW here is a
   crash with zero PASS/FAIL lines, which a Makefile cannot tell from a broken
   harness. The exit code stays 1 — nothing is softened, the red is the same
   red — but it now arrives as a sentence naming what threw. MEASURED
   2026-07-28: onepager.html's lab block throws `ReferenceError:
   IntersectionObserver is not defined` under this Proxy DOM (a real gap in the
   stubs, not an extraction bug), and before this it printed a bare node stack. */
try {
  new Function(src)();        // module IIFEs run: every reset() does real solves
} catch (e) {
  console.log('FAIL  S1 the artifact\'s script threw while evaluating: ' + e.name + ': ' + e.message);
  console.log('      block ' + (IDX === null ? 0 : IDX) + ' of ' + HTML);
  console.log('      A SyntaxError means the artifact is broken. A ReferenceError usually means');
  console.log('      this Proxy DOM lacks a stub the artifact uses — extend the stubs, do not');
  console.log('      point the battery somewhere easier.');
  console.log('\n0/0 checks passed — the script did not evaluate, so NO check in this battery ran.');
  process.exit(1);
}
const tInit = Date.now() - t0;

/* drive the rAF loop */
function pump(n) {
  for (let k = 0; k < n; k++) {
    const q = rafQ.splice(0, rafQ.length);
    q.forEach(fn => fn());
  }
}
pump(20);

/* ---------- assertions on real numerics via DOM readouts ---------- */
function txt(id) { return getEl(id).textContent; }
const checks = [];
function check(name, cond) { checks.push([name, !!cond]); }

/* M1 solved a few iterations after auto-solve boot click + 20 frames */
check('M1 iterated (roIter set)', /\d/.test(txt('roIter')));
check('M1 mass drift shown', txt('roMass').length > 0 && txt('roMass') !== '—');
/* MGG resim ran with certificates */
check('GGR invariant machine-small', /e-1[0-9]/.test(txt('roGgInv')) || /e-0?9/.test(txt('roGgInv')));
check('GGR closed form label', txt('roGgWcf').indexOf('−3+2α') === 0 || txt('roGgWcf').indexOf('-3+2') === 0);
check('GGR corr computed', /-0\.\d/.test(txt('roGgCor')));
check('GGR status carries seed', /seed 42/.test(txt('ggStatus')));
/* Modules initialize at load, before any routing: WD must already carry its
   scenario label. (This is asserted here rather than later because opening
   /wardrop auto-solves and overwrites the init status.) */
check('WD initialized (scenario label)', /Table I/.test(txt('wdStatus')));

/* ---- routing: every route resolves to its page, and owns the right section ---- */
check('router: bench tabs switch within the bench page', (() => {
  tab('2d').click();
  const ok = tab('2d').classList.contains('active') && !tab('1').classList.contains('active')
    && tab('2d').getAttribute('aria-selected') === 'true'
    && tab('1').getAttribute('aria-selected') === 'false'
    && getEl('sec2d').classList.contains('active');
  tab('1').click();
  return ok;
})());
check('router: every nav route shows its own page and hides the others', (() => {
  /* '/' -> pgStart REMOVED 2026-07-30 with the page itself. It was a landing page inside an
     instrument and the site homepage now does that job. The router's default moved to /bench, so
     this map is the eight real routes and nothing else. The assertion is UNCHANGED in strength:
     it still requires every route to show exactly its own page and hide all the others, which is
     the property that would catch a page failing to hide. */
  const PAGES = { '/wardrop': 'pgWardrop', '/price': 'pgPrice',
    '/water-value': 'pgWater', '/random-supply': 'pgNoise', '/bench': 'pgBench' };
  for (const r of ROUTES) {
    go(r);
    for (const [rr, pid] of Object.entries(PAGES))
      if (getEl(pid).classList.contains('active') !== (rr === r)) return false;
    const btn = navBtns.find(b => b.dataset.route === r);
    if (!btn.classList.contains('active')) return false;
    if (btn.getAttribute('aria-current') !== 'page') return false;
  }
  return true;
})());
check('router: a result route activates the section it owns', (() => {
  go('/wardrop');
  const wd = getEl('secwd').classList.contains('active') && !getEl('secpr').classList.contains('active');
  go('/price');
  const pr = getEl('secpr').classList.contains('active') && !getEl('secwd').classList.contains('active');
  return wd && pr;
})());
check('router: lab hash routes are instrument-only (prose lives on site pages)', (() => {
  const src = fs.readFileSync(HTML, 'utf8');
  return /SITE_REDIRECTS\s*=\s*\{[\s\S]*?\/certificates['"]\s*:\s*['"]\/certificates['"]/.test(src)
    && !/data-route="\/certificates"/.test(src)
    && !/data-route="\/verification"/.test(src)
    && !/data-route="\/program"/.test(src);
})());

/* landing on a result route auto-solves it once — the demo must not open on a still */
go('/price');
pump(80);                                 // Anderson iterations, 3/frame desktop
check('MPR auto-solves when its route is opened', txt('roPrClr') !== '—' && txt('roPrClr').length > 0);
getEl('prSolveBtn').click();              // explicit re-solve
pump(80);
check('MPR clearing residual shown', txt('roPrClr') !== '—' && txt('roPrClr').length > 0);
check('MPR rebound computed', /%/.test(txt('roPrReb')) || /\d/.test(txt('roPrReb')));

/* GGR seed API through the seed box */
go('/random-supply');
const sb = getEl('ggSeed');
sb.value = '12345';
sb.dispatchEvent({ type: 'change', target: sb });
check('GGR reseeded via box', /seed 12345/.test(txt('ggStatus')));

/* keyboard nav across the bench tablist */
go('/bench');
tab('st').dispatchEvent({ type: 'keydown', key: 'ArrowRight', target: tab('st'), preventDefault() {} });
check('keyboard wraps to first bench tab', tab('1').classList.contains('active'));

/* Wardrop: full solve through the loop */
go('/wardrop');
getEl('wdSolveBtn').click();
pump(400);                                 // merit steps + polish inside finish()
check('WD converged with certificate', /Wardrop certificate at machine zero/.test(txt('wdStatus')));
check('WD polished gap tiny', /e-1[2-9]/.test(txt('roWdGap')));
check('WD Kirchhoff machine-zero', /e-1[0-9]/.test(txt('roWdK')));
check('WD Table I deviation within rounding', (()=>{const m=txt('roWdT1').match(/^([\d.]+)/);return m&&+m[1]<=2.0;})());
check('WD entrance costs finite', /\d/.test(txt('roWdC1')) && /\d/.test(txt('roWdC2')));
/* reseed → split non-uniqueness receipt (scenario 1) */
getEl('wdSeedBtn').click();
getEl('wdSolveBtn').click();
pump(400);
check('WD S1 non-uniqueness receipt', /totals unique, the split is not/.test(txt('roWdU')));
/* scenario 2 uniqueness */
getEl('wdS2').click();
getEl('wdSolveBtn').click();
pump(400);
getEl('wdSeedBtn').click();
getEl('wdSolveBtn').click();
pump(400);
check('WD S2 uniqueness receipt', /unique \(strict monotonicity/.test(txt('roWdU')));
/* duel: projected-gradient comparison */
getEl('wdPGBtn').click();
// the duel must compare at the SAME tolerance and disclose PG is faster to coarse
// gap (the earlier text compared different tolerances and hid PG's win — "never
// rig this comparison" cuts both ways).
check('WD duel line honest (same-tolerance, PG faster to coarse gap disclosed)',
  /SAME tolerance/.test(txt('wdStatus')) && /FASTER to coarse gap/.test(txt('wdStatus'))
  && /never leaves the manifold/.test(txt('wdStatus')));
check('WD pre-projection violation readout', /e\+/.test(txt('roWdPG')) && /≡ 0/.test(txt('roWdPG')));
/* Water value: the stock-constrained page must certify, and must gate its
   verdict on the STRUCTURAL audit rather than on the duality gap alone. */
go('/water-value');
pump(2);
check('WV auto-solves and certifies on its own route', /CERTIFIED OPTIMAL/.test(txt('wvStatus')));
check('WV duality gap machine-zero', /e-1[2-9]/.test(txt('roWvGap')));
check('WV martingale residual machine-zero', /e-1[2-9]/.test(txt('roWvMart')));
check('WV trichotomy clean', txt('roWvTri') === '0');
check('WV binding count disclosed beside the claim', /\d+ \/ \d+/.test(txt('roWvBind')));
check('WV states the martingale only over interior nodes',
  /interior node/.test(txt('wvStatus')) || /Every node binds/.test(txt('wvStatus')));
/* The decision rule tested on inputs the sliders cannot produce. On every
   reachable instance all branches agree, so driving the UI can never tell a
   real audit from `gap < tol` — the catalogued trap (a check that agrees with
   its mutant at rest is decoration). Feed it certificates that disagree. */
check('WV verdict is the STRUCTURAL audit, not the duality gap alone', (() => {
  if (typeof __wvAudit !== 'function') return false;
  const clean = { dynErr:0, boxErr:0, tri:0, wedgeSignErr:0, compSlack:0,
                  spillDualErr:0, gapRel:0, martingaleRes:0, bindingNodes:0 };
  const A = c => __wvAudit(Object.assign({}, clean, c), 15);
  return A({}).certified                                   // clean ⇒ certified
    && !A({ tri: 1 }).certified                            // trichotomy violated
    && !A({ wedgeSignErr: 1e-3 }).certified                // wrong dual sign
    && !A({ compSlack: 1e-3 }).certified                   // complementarity
    && !A({ spillDualErr: 1e-3 }).certified                // negative water value
    && !A({ dynErr: 1e-3 }).certified                      // primal infeasible
    && !A({ boxErr: 1e-3 }).certified
    && !A({ gapRel: 1e-6 }).certified;                     // and the gap still counts
})());
check('WV martingale is not styled as passing when no node is interior', (() => {
  if (typeof __wvAudit !== 'function') return false;
  const clean = { dynErr:0, boxErr:0, tri:0, wedgeSignErr:0, compSlack:0,
                  spillDualErr:0, gapRel:0, martingaleRes:0, bindingNodes:0 };
  /* every node binding ⇒ the theorem asserts nothing ⇒ must NOT read as passing,
     and a real residual must not be lit either */
  return __wvAudit(Object.assign({}, clean, { bindingNodes: 15 }), 15).martOK === false
      && __wvAudit(Object.assign({}, clean, { martingaleRes: 1e-3 }), 15).martOK === false
      && __wvAudit(clean, 15).martOK === true;
})());
getEl('wvSolveBtn').click(); pump(2);
check('WV re-solve is stable', /CERTIFIED OPTIMAL/.test(txt('wvStatus')));

/* site /certificates carries the method standard (promoted out of the lab) */
(() => {
  /* ONE CANDIDATE SINCE 2026-08-21. There were two — `certificates.html` in the monorepo and
     `certificates.html` at the export root — because the site tree and the export root were
     different places. The structure migration made the repo root the site root, so the chrome page
     is at the same relative path in both trees and the two-candidate probe has one answer. Found
     by MARKER, not by counting `..`: the tree root is the nearest ancestor holding `core/`, which
     is true in the monorepo and in the export (C52). */
  const treeRoot = (() => {
    for (let d = __dirname; ; d = path.dirname(d)) {
      if (fs.existsSync(path.join(d, 'core'))) return d;
      if (path.dirname(d) === d) return null;
    }
  })();
  const candidate = treeRoot ? path.join(treeRoot, 'certificates.html') : null;
  const certPath = candidate && fs.existsSync(candidate) ? candidate : null;
  const cert = certPath ? fs.readFileSync(certPath, 'utf8') : '';
  check('site /certificates carries the method standard',
    !!certPath
    && /What counts as a certificate here/.test(cert)
    && /pre-update residuals only/.test(cert)
    && !/consistency floor/.test(cert)
    && !/1e-4 exploitability floor/.test(cert));
})();

/* --- floor-discipline regressions (2026-07 audit; see FINDINGS.md) --------
   The exploitability floor was previously a hardcoded 1e-4 literal and prose
   asserting an O(h+dt) "consistency floor". Measured: eps is ITERATION-limited
   (eps ~ residual, linear), |eps|/(h+dt) ~ 5e-9 so the O(h+dt) bound is
   vacuous, and |eps|/residual spans 2400x across the parameter box so no
   calibrated absolute floor is defensible. These checks pin the fix. */
go('/bench'); tab('2d').click();
getEl('modeHerd').click(); getEl('solve2dBtn').click(); pump(1500);
check('2D herding: eps NOT certified as equilibrium at a 4e-2 residual',
  /residual too large to attribute/.test(txt('status2d')));
check('2D herding: no fabricated "consistency floor" verdict',
  !/below the consistency floor/.test(txt('status2d')));
check('2D herding: eps readout not styled ok while unconverged',
  getEl('ro2Eps').className.indexOf('ok') < 0);
getEl('modeMono').click(); getEl('solve2dBtn').click(); pump(1500);
check('2D monotone: converged eps IS styled ok',
  getEl('ro2Eps').className.indexOf('ok') >= 0);
tab('1').click();
check('M1 mass drift is machine-small',
  /e-1[0-9]/.test(txt('roMass')));

/* --- prose regressions: the fabricated floor must not reappear anywhere.
   Three separate copies of "eps < 1e-4 / O(h+dt) consistency floor" survived
   the first pass and had to be removed by hand; pin them. Also pin the MPR
   iteration range: prose claimed 50-160 (remembered), an ad-hoc sweep then
   said 32-78; the dedicated battery (test-mpr.js) measures 37-180 with 4 of
   16 slider corners capped at 200 as slow tails (8.6e-9..1.1e-7). Pin the
   battery-measured figures and the absence of BOTH superseded ranges. */
{
  const page = require('fs').readFileSync(HTML, 'utf8');
  check('prose: no "consistency floor" language anywhere',
    !/consistency floor/.test(page));
  check('prose: no fabricated 1e-4 exploitability floor',
    !/policy-evaluation floor/.test(page) && !/ε sits below 1e−4/.test(page));
  check('prose: MPR iteration range carries neither superseded figure (50-160, 32-78)',
    !/50–160 iterations/.test(page) && !/32–78 iterations/.test(page));
  check('prose: MPR sweep disclosure present (battery-measured 37–180 on 12 of 16)',
    /converges on 12 corners/.test(page) &&
    /37–180 iterations on 12 of 16 slider corners/.test(page));
}
/* Semantics, not just magnitude. At rest the terminal row IS the max, so a
   terminal-row-only implementation prints the same number and is invisible.
   The two disagree MID-ITERATION (measured: ~19 of 400 frames), so sample
   there: the displayed value must equal the max over all slices at all times. */
check('M1 mass certificate is max-over-slices throughout the iteration',
  (() => {
    if (typeof __m1mass !== 'function') return false;
    getEl('solveBtn').click();
    let checked = 0, agreed = 0, sawOffTerminal = 0;
    for (let i = 0; i < 400; i++) {
      pump(1);
      const r = __m1mass();
      checked++;
      if (r.recomputedRow !== r.NT) sawOffTerminal++;
      if (Math.abs(r.shown - r.recomputedWorst) <= 1e-18 + 1e-9 * r.recomputedWorst) agreed++;
    }
    return checked > 0 && agreed === checked && sawOffTerminal > 0;
  })());

/* --- design regressions (2026-07 visual pass; see DESIGN_PLAN.md) ---------
   The brief: sans + mono only, no layout shift on interaction. These pin the
   parts a future edit could silently undo. */
{
  const page = require('fs').readFileSync(HTML, 'utf8');
  const css = page.slice(page.indexOf('<style>'), page.indexOf('</style>'));
  /* SUPERSEDED 2026-08-24 by owner ruling. This asserted "sans + mono only", which was the
     2026-07 brief and was true until the design system took its type from the unchecked-checker
     reference: the BODY face is a serif now, and --body leads with Georgia. Checking it here
     would fail every page in the tree for conforming to the system it is supposed to conform to.
     What the rule was protecting — that type is not chosen per page — is now protected far more
     directly: check-seed asserts this page carries the canonical block byte-identical to what
     research/_engine/design/ emits, so the faces cannot be page-local at all. Replaced rather
     than deleted, so the original brief stays legible. */
  check('design: type comes from the shared system, not from this page',
    css.includes('ENCLOSURE DESIGN SYSTEM') || /var\(--body\)|var\(--ui\)|var\(--data\)/.test(css),
    'faces resolve through the design tokens');
  check('design: certificate values are mono with tabular figures',
    /\.ro \.v\{[^}]*var\(--data\)/.test(css) && /tabular-nums/.test(css));
  check('design: status reserves >1 line so long messages cannot push the canvas',
    /\.status\{[^}]*min-height:2\.9em/.test(css));
  check('design: canvas height reserved before JS sizing', (() => {
    /* A single generic ratio is NOT enough: real h/w spans 0.17..1.0, so one
       16/9 floor mis-reserved by ~394px on cvM2. Each canvas must declare its
       own ratio, matching the HFIT map the JS sizing uses. */
    const HFIT = { cvResid:0.32, cvWdGap:0.17, cvWdNet:0.42, cvWdBar:0.20,
      cvWvTree:0.38, cvM:0.63, cvU:0.63, cvLine:0.36, cvLqErr:0.55, cvLqOverlay:0.36,
      cvResid2:0.28, cvM2:1.0, cvBif:0.8, cvStF:0.30, cvStSol:0.36,
      cvPrCert:0.30, cvPrDS:0.36, cvPrPrice:0.60, cvPrHeat:0.60,
      cvGgFig:0.36, cvGgCoef:0.60, cvGgAg:0.60 };
    if (!/canvas\[style\*='height'\]\{aspect-ratio:auto\}/.test(css)) return false;
    for (const [id, hw] of Object.entries(HFIT)) {
      const m = css.match(new RegExp('#' + id + '\\{aspect-ratio:([\\d.]+)\\}'));
      if (!m) return false;
      if (Math.abs(1 / parseFloat(m[1]) - hw) > 0.005) return false;
    }
    return true;
  })());
  check('design: reduced motion honoured in CSS',
    /prefers-reduced-motion/.test(css));
  check('design: no interactive state changes a dimension', (() => {
    const re = /([^{}]+)\{([^}]*)\}/g; let m;
    while ((m = re.exec(css))) {
      const sel = m[1], body = m[2];
      if (!/:hover|:focus|\.active|\.on\b|:checked/.test(sel)) continue;
      if (/(^|;|\s)(width|height|padding|margin|font-size|letter-spacing|gap)\s*:/.test(body)) return false;
    }
    return true;
  })());
  check('design: palette tokens the canvas reads are all defined', (() => {
    const needed = ['--amber','--card','--fp','--grid','--hjb','--ink','--ink-soft','--paper'];
    return needed.every(k => new RegExp('\\' + k + '\\s*:').test(css));
  })());
  /* Chrome vocabulary — silent drift here is how Wardrop legends glued together
     (orphan class="leg" with no CSS) and ghost buttons left the seed face. */
  check('design: legends use .legend only (no orphan .leg)',
    !/\bclass=(["'])leg\1/.test(page) && !/\bclass=(["'])[^"']*\bleg\b/.test(page.replace(/class="legend"/g, ''))
    && (page.match(/class="legend"/g) || []).length >= 4);
  check('design: ghost buttons use the seed --data face',
    /button\.ghost\{[^}]*font-family:\s*var\(--data\)/.test(css));
  check('design: grid2 is fluid two-up with a mobile collapse (no empty third track)',
    /\.grid2\{[^}]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(260px/.test(css)
    && /max-width:640px\)\{[\s\S]*?\.grid2\{[^}]*grid-template-columns:\s*1fr/.test(css));
  check('design: no inline hex colour on swatches / legend chips',
    !/class="sw[^"]*"[^>]*style="[^"]*#[0-9A-Fa-f]{3,8}/.test(page)
    && !/<i\s+style="[^"]*background\s*:[^"]*#[0-9A-Fa-f]{3,8}/.test(page));
  check('design: body links use --fp-deep (not --good / bare --fp)',
    /(?:^|\n)\s*a\{[^}]*color:\s*var\(--fp-deep\)/.test(css));
}
let fail = 0;
for (const [name, ok] of checks) {
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name);
  if (!ok) fail++;
}
console.log(`\ninit ${tInit} ms · ${checks.length - fail}/${checks.length} checks passed`);
process.exit(fail ? 1 : 0);
