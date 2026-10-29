#!/usr/bin/env node
/* build-grammar.js — /grammar/: the visual grammar (WARRANT), as a public page.
   tools/ · cert-machine · 2026-10-29

   WHO IT IS FOR. Researchers and engineers who make figures and reports, and anyone who wants to read the pages here
   correctly. It makes one case — a figure can say what each of its marks rests on — and teaches how.

   WHAT IT IS MADE OF, and why it cannot fall out of step with the code:
     · every specimen is drawn by playground/warrant.js itself (W.attrs, W.meet, W.value, W.witness, W.legendHtml,
       W.grade, W.premisesHtml) on numbers this file computes: y = √x, with the exact parts decided here in BigInt;
     · the rules are design/WARRANT.md's, in plain words. The rulebook is read when the page is built, and the page
       refuses when the rulebook holds a rule this page does not explain or has lost one it does;
     · every finding cited is one the rulebook or a commit names, on one of our own pages, and every number in a
       finding is read from the record or the code that holds it (the tied trees recomputed by playground/mst.js,
       the atlas's readings from its atlas.json, Swell's comparison from certs/), never typed;
     · the checks' numbers are read from their own output (check-grammar --report, check-wiring) and their records
       (the layout ruler's and the render check's baselines) when the page is built.
   The words of the marks (labels, glosses, grade names) are warrant.js's own, so a Portuguese page can follow from
   playground/warrant-pt.js without retyping them.

   THIS PAGE REFUSES TO BUILD IF … — the list it prints IS the GUARDS array below: each guard() checks its condition
   and records its plain words in the same statement (the landing's device, tools/build-site.js).

   usage: node tools/build-grammar.js          writes site/grammar/index.html (the site sync writes it too)
          require(...).html()                  the page, for tools/build-site.js                            MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const T = require(path.join(ROOT, 'design', 'tokens.js'));
const G = require(path.join(ROOT, 'design', 'grammar.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const WPT = require(path.join(ROOT, 'playground', 'warrant-pt.js'));
const APP = require(path.join(ROOT, 'design', 'app-shell.js'));
const { mstUnique } = require(path.join(ROOT, 'playground', 'mst.js'));
const GITHUB = 'https://github.com/carlostoledo1891/cert-machine';
const esc = C.esc, escAttr = C.escAttr;

const GUARDS = [];
const guard = (plain, ok, msg) => {
  if (!GUARDS.includes(plain)) GUARDS.push(plain);
  if (!ok) throw new Error('build-grammar REFUSES: ' + (msg ? msg + ' — ' : '') + 'the page refuses to build if ' + plain);
};
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const J = (p) => JSON.parse(read(p));
const NUMWORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const numword = (k) => NUMWORD[k] || String(k);
const fmt = (n) => Number(n).toLocaleString('en-US');
const a = (href, inner) => '<a href="' + escAttr(href) + '">' + inner + '</a>';
const m = (s) => '<span class="m">' + esc(s) + '</span>';
const blob = (p) => GITHUB + '/blob/main/' + p;
const git = (args) => cp.execFileSync('git', ['-C', ROOT].concat(args), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const day = (iso) => Number(iso.slice(8, 10)) + ' ' + MONTH[Number(iso.slice(5, 7)) - 1];

/* THE SPECIMENS' EXACT NUMBERS, at module level since 2026-10-29 so /grammar/roundtable/ (tools/build-grammar-roundtable.js)
   draws the same enclosure rather than a second copy of it: y = √x, decided in BigInt. */
const B = (x) => BigInt(x);
const gcd = (x, y) => { x = x < 0n ? -x : x; y = y < 0n ? -y : y; while (y) [x, y] = [y, x % y]; return x; };
const fr = (n, d = 1n) => { n = B(n); d = B(d); if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; return [n / g, d / g]; };
const fsub = (p, q) => fr(p[0] * q[1] - q[0] * p[1], p[1] * q[1]);
const fadd = (p, q) => fr(p[0] * q[1] + q[0] * p[1], p[1] * q[1]);
const fmul = (p, q) => fr(p[0] * q[0], p[1] * q[1]);
const fdiv = (p, q) => fr(p[0] * q[1], p[1] * q[0]);
const feq = (p, q) => p[0] * q[1] === q[0] * p[1];
const fnum = (p) => Number(p[0]) / Number(p[1]);
const fstr = (p) => (p[1] === 1n ? String(p[0]) : p[0] + '/' + p[1]);
const isqrt = (n) => { if (n < 2n) return n; let x = B(Math.floor(Math.sqrt(Number(n)))); while (x * x > n) x--; while ((x + 1n) * (x + 1n) <= n) x++; return x; };

/* DECIDED: an enclosure of √x on [0, 4] in eight steps of width 1/2. √ is increasing, so on [k/2, (k+1)/2] it lies
   between √(k/2) and √((k+1)/2); each is bracketed by an integer square root over 64 and checked by squaring. */
const Q = 64n, STEPS = 8, cells = [];
for (let k = 0; k < STEPS; k++) {
  const lo = isqrt(B(k) * Q * Q / 2n), m2 = B(k + 1) * Q * Q / 2n, s = isqrt(m2), hi = s * s === m2 ? s : s + 1n;
  cells.push({ x0: fr(k, 2), x1: fr(k + 1, 2), lo: fr(lo, Q), hi: fr(hi, Q),
    ok: lo * lo * 2n <= B(k) * Q * Q && hi * hi * 2n >= B(k + 1) * Q * Q });
}

/* RULE 8 IN PIXELS, at module level since 2026-10-29 so /grammar/roundtable/ draws the staircase by the same rule:
   an enclosure's edges round AWAY from the curve, at a tenth of a pixel (the roundtable's finding F4) */
const RES = 10;
const away = (v, dir) => ((dir > 0 ? Math.ceil(v * RES) : Math.floor(v * RES)) / RES).toFixed(1);
const stair = (f, key) => { const dir = key === 'hi' ? -1 : 1;
  return 'M' + cells.map((c, i) => (i ? 'V' + away(f.py(fnum(c[key])), dir) : away(f.px(fnum(c.x0)), -1) + ',' + away(f.py(fnum(c[key])), dir)) + 'H' + away(f.px(fnum(c.x1)), 1)).join(''); };

/* the specimen panel's frame (x0 is set per panel) */
const PANEL = { w: 400, h: 250, padL: 40, padR: 16, padT: 16, padB: 46, y0: 0, y1: 2.25 };

function html() {
  /* ======================================================== the rulebook ==
     design/WARRANT.md, read now. Its numbered rules are listed by section, and the page explains every one of them:
     a rule added to the rulebook, or one taken away, refuses the page until this file says it in plain words. */
  const RB = read('design/WARRANT.md');
  const between = (from, to) => { const i = RB.indexOf(from), j = to ? RB.indexOf(to, i + 1) : RB.length; return i < 0 ? '' : RB.slice(i, j < 0 ? RB.length : j); };
  const numbered = (txt) => [...txt.matchAll(/^\s{0,4}(\d+)\. \*\*(.+?)\*\*/gm)].map((x) => ({ n: Number(x[1]), title: x[2] }));
  const V2 = numbered(between('## The rules', '## Decided 2026-10-28'));
  const V21 = numbered(between('## v2.1', '## v2.2'));
  const V22 = numbered(between('## v2.2', '**Registered colours**'));
  const frozen = /^# WARRANT (v\d+)[^\n]*\(frozen (\d{4}-\d{2}-\d{2})\)/m.exec(RB);
  guard('the rulebook (design/WARRANT.md) is not a frozen version with a date on its first line', !!frozen);

  /* =========================================================== the marks ==
     The four standings and their strokes, as warrant.js and grammar.js draw them. The page describes "solid, dashed
     5 4, dotted 1 5 with round caps, no stroke"; the module must still draw exactly that. */
  const sD = W.stroke(W.DECIDED), sC = W.stroke(W.COMPUTED), sH = W.stroke(W.CHOSEN), sR = W.stroke(W.REFUSED);
  const sCs = W.stroke(W.COMPUTED, { width: 1 }), sHs = W.stroke(W.CHOSEN, { width: 1 });
  guard('warrant.js draws a standing with a stroke other than the one this page describes',
    W.NAME.length === 4 && sD.dash === null && sC.dash === G.CLAIM && sH.dash === G.PICK && sH.cap === 'round' && sR === null
      && sCs.dash === G.CLAIM_SM && sHs.dash === G.PICK_SM && G.PERMITTED.length === 5
      && W.meet(W.DECIDED, W.DECIDED, W.CHOSEN) === W.CHOSEN && W.meet(W.DECIDED, W.REFUSED) === W.REFUSED
      && W.throughFloat(W.DECIDED) === W.COMPUTED,
    JSON.stringify({ sD, sC, sH, sR }));
  const LEGEND_FULL = W.legendHtml();
  const hatch = /<pattern id="([^"]+)"/.exec(LEGEND_FULL);
  guard('the standing legend no longer defines its own hatch for the void (the specimens below paint the void with it)', !!hatch);
  const HATCH = hatch[1];
  /* the Portuguese words exist for every word the legend and the ladder use, so a pt page can follow */
  guard('playground/warrant-pt.js lacks a Portuguese word for a legend or ladder word on this page',
    W.LEGEND.every((L) => WPT.LEGEND[L.label] && WPT.LEGEND[L.gloss]) && WPT.GRADE.length === W.GRADE.length);

  /* =============================================== the specimens' numbers ==
     y = √x on [−1, 4]. Everything exact is decided here in BigInt; everything float is Math.sqrt. */
  guard('a step of the decided enclosure of √x fails its own exact check (squaring the bounds)', cells.every((c) => c.ok));
  /* COMPUTED: Math.sqrt at 401 points. Whether each double lies inside the enclosure is an exact comparison of two
     doubles (a bound over 64 is a double exactly), so that much is decided; the values themselves are not. */
  const NPTS = 401, flo = [];
  for (let i = 0; i < NPTS; i++) { const x = 4 * i / (NPTS - 1); flo.push([x, Math.sqrt(x)]); }
  const inside = flo.filter(([x, y]) => { const k = Math.min(STEPS - 1, Math.floor(2 * x)), c = cells[k]; return fnum(c.lo) <= y && y <= fnum(c.hi); }).length;
  guard('a float value of Math.sqrt lies outside the decided enclosure (the caption says every one is inside)', inside === NPTS, inside + ' of ' + NPTS);
  /* the meet: five knots where √x is exact */
  const KNOTS = [[fr(0), fr(0)], [fr(1, 4), fr(1, 2)], [fr(1), fr(1)], [fr(9, 4), fr(3, 2)], [fr(4), fr(2)]];
  guard('a knot of the meet specimen is not an exact square root (y² = x, checked in rationals)', KNOTS.every(([x, y]) => feq(fmul(y, y), x)));
  /* the witness: the segment between the knots at 1/4 and 1, read at x = 1/2, against √(1/2) */
  const WX = fr(1, 2), [k1, k2] = [KNOTS[1], KNOTS[2]];
  const WY = fadd(k1[1], fmul(fdiv(fsub(k2[1], k1[1]), fsub(k2[0], k1[0])), fsub(WX, k1[0])));
  const WY2 = fmul(WY, WY);
  guard('the witness specimen stops breaking its claim (the segment\'s value at x = 1/2 squares to 1/2)', !feq(WY2, WX) && fnum(WX) > fnum(k1[0]) && fnum(WX) < fnum(k2[0]));
  const MEET = W.meet(W.DECIDED, W.DECIDED, W.CHOSEN);

  /* ------------------------------------------------------------ drawing -- */
  const yT = [0, 1, 2].map((v) => ({ v, t: String(v) }));
  const xT = (lo) => [-1, 0, 1, 2, 3, 4].filter((v) => v >= lo).map((v) => ({ v, t: v < 0 ? '−' + Math.abs(v) : String(v) }));
  const P = (f, x, y) => f.px(x).toFixed(1) + ',' + f.py(y).toFixed(1);
  /* RULE 8 IN PIXELS (ruled 2026-10-29; the roundtable's finding F4: these paths were written with toFixed, nearest,
     so an upper edge could sit inside the record by up to half the written resolution). An enclosure's edges round
     AWAY from the curve: py grows downward, so the upper edge floors and the lower edge ceils; x0 floors, x1 ceils.
     The resolution the paths are written at is a tenth of a pixel, and the caption prints what one pixel is worth. */
  { const f = CH.frame(Object.assign({ x0: -1, x1: 4 }, PANEL));
    guard('an edge of the decided specimen is drawn inside its enclosure (the paths round outward to a tenth of a pixel)',
      cells.every((c) => Number(away(f.py(fnum(c.hi)), -1)) <= f.py(fnum(c.hi)) && Number(away(f.py(fnum(c.lo)), 1)) >= f.py(fnum(c.lo))
        && Number(away(f.px(fnum(c.x0)), -1)) <= f.px(fnum(c.x0)) && Number(away(f.px(fnum(c.x1)), 1)) >= f.px(fnum(c.x1)))); }
  const RESOLUTION = (() => { const f = CH.frame(Object.assign({ x0: -1, x1: 4 }, PANEL)); return { x: 5 / f.pw, y: (PANEL.y1 - PANEL.y0) / f.ph }; })();
  const panel = (alt, x0, inner) => {
    const f = CH.frame(Object.assign({ x0, x1: 4 }, PANEL));
    return CH.open({ w: PANEL.w, h: PANEL.h, alt }) + '\n' + CH.axes(f, { yTicks: yT, xTicks: xT(x0), xLabel: 'x' }) + '\n' + inner(f) + '\n' + CH.close;
  };
  const figure = (svg, capRaw, cls) => '<figure' + (cls ? ' class="' + cls + '"' : '') + '><div class="figbox">\n' + svg + '\n</div><figcaption>' + capRaw + '</figcaption></figure>';
  const STROKE_WORD = { [W.DECIDED]: 'solid', [W.COMPUTED]: 'dashed', [W.CHOSEN]: 'dotted', [W.REFUSED]: 'the void' };
  const key = (s) => '<span class="gr-k">' + esc(W.NAME[s]) + ' · ' + esc(STROKE_WORD[s]) + '</span>';
  const midCells = cells.map((c) => Object.assign({}, c, { mid: fr(c.lo[0] * c.hi[1] + c.hi[0] * c.lo[1], 2n * c.lo[1] * c.hi[1]) }));
  const midPath = (f) => 'M' + midCells.map((c, i) => (i ? 'V' + f.py(fnum(c.mid)).toFixed(1) : P(f, fnum(c.x0), fnum(c.mid))) + 'H' + f.px(fnum(c.x1)).toFixed(1)).join('');
  const SPEC = [
    figure(panel('Specimen, decided: two solid staircases enclose the curve y equals the square root of x on 0 to 4, in eight steps of one half.', -1, (f) =>
      '    <path d="' + stair(f, 'hi') + '" ' + W.attrs(W.DECIDED, { width: 1.8 }) + '/>\n    <path d="' + stair(f, 'lo') + '" ' + W.attrs(W.DECIDED, { width: 1.8 }) + '/>'),
      key(W.DECIDED) + 'An enclosure. On each of the ' + numword(STEPS) + ' steps of width 1/2, √x lies between the two lines for every x: '
        + 'each step is an integer square root over ' + Q + ', checked by squaring when this page is built. Drawn outward: every edge is moved away from the curve to the next tenth of a pixel, never toward it. One pixel of this panel is ' + RESOLUTION.x.toPrecision(3) + ' in x and ' + RESOLUTION.y.toPrecision(3) + ' in y; a gap narrower than that is not shown.'),
    figure(panel('Specimen, computed: the float curve of Math.sqrt, dashed.', -1, (f) =>
      '    <polyline points="' + flo.map(([x, y]) => P(f, x, y)).join(' ') + '" ' + W.attrs(W.COMPUTED, { width: 2 }) + ' stroke-linejoin="round"/>'),
      key(W.COMPUTED) + 'Math.sqrt at ' + fmt(NPTS) + ' points, closer together than a pixel, joined. Floating point: it may well be right, and nothing decided it. '
        + '(All ' + fmt(inside) + ' values do lie inside the enclosure; comparing two doubles is exact.)'),
    figure(panel('Specimen, chosen: the midpoint of the enclosure on each step, dotted.', -1, (f) =>
      '    <path d="' + midPath(f) + '" ' + W.attrs(W.CHOSEN, { width: 2.2 }) + '/>'),
      key(W.CHOSEN) + 'The midpoint of the enclosure on each step: one member of the set the enclosure admits, picked by a rule that is not the data. '
        + 'It is the number a table usually prints.'),
    figure(panel('Specimen, refused: for x below zero there is no mark, only a hatched void and the empty-set sign.', -1, (f) => {
      const x0 = f.px(-1), x1 = f.px(0), y0 = f.T, y1 = f.T + f.ph, cx = (x0 + x1) / 2;
      return '    <rect x="' + x0.toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + (x1 - x0).toFixed(1) + '" height="' + (y1 - y0).toFixed(1)
        + '" class="w-void" fill="url(#' + HATCH + ')" stroke="var(--rule-strong)" stroke-width="1"/>\n'
        + CH.txt(cx, y0 + f.ph / 2 - 4, '∅', 't-lab', 'middle') + '\n' + CH.txt(cx, y0 + f.ph / 2 + 14, 'x < 0', 't-note', 'middle');
    }),
      key(W.REFUSED) + 'For x below 0 the real square root does not exist, and the instrument declines: no stroke, a hatched void, and a word. '
        + 'Never bridged, never drawn as zero.'),
  ];

  /* THE HERO (D12, ruled 2026-10-29): the meet with its witness, the page's one figure drawn past the container, at its
     own scale. Every standing on the page is in it — decided knots, the chosen segments between them, the float curve —
     and the × is drawn where the segments break the claim to be √x, before the caption names it in words
     (tools/check-wiring.js reads that order and the ×'s weight from the built page). Labelled directly. The window is
     x, y in [0, 5/4], where the segments and the curve are far enough apart to be told apart from across a room; over
     [1, 4] they run within a pixel or two of each other at any size the page can give them. */
  /* two drawings of one figure (D12): the wide one past the container, and a phone one at a scale a phone can read,
     swapped by the hero track's own rule (design/template.js). Same data, same marks; the labels are placed per drawing. */
  const HERO = { w: 1000, h: 400, padL: 56, padR: 28, padT: 26, padB: 52, x0: 0, x1: 1.25, y0: 0, y1: 1.25 };
  const HERO_N = { w: 400, h: 400, padL: 40, padR: 14, padT: 20, padB: 44, x0: 0, x1: 1.25, y0: 0, y1: 1.25 };
  const HERO_DECIDED = 2, HERO_WX = { size: 11, width: 3.5 }, HERO_WX_N = { size: 8, width: 3 };
  guard('the hero\'s × is drawn thinner than its decided marks (R28: a witness is an event at the figure\'s scale)', HERO_WX.width >= HERO_DECIDED && HERO_WX_N.width >= HERO_DECIDED);
  const HX1 = fr(5, 4), inView = KNOTS.filter(([x]) => fnum(x) <= fnum(HX1)), nextK = KNOTS[inView.length];
  /* where the last segment in view leaves the window, exactly: on the line from the last knot in view to the next */
  const exitY = fadd(inView[inView.length - 1][1], fmul(fdiv(fsub(nextK[1], inView[inView.length - 1][1]), fsub(nextK[0], inView[inView.length - 1][0])), fsub(HX1, inView[inView.length - 1][0])));
  guard('the hero\'s window no longer holds the witness and the knots either side of it', inView.length >= 3 && fnum(WX) < fnum(inView[2][0]) && fnum(exitY) < 1.25);
  const WXTXT = ['x = ' + fstr(WX) + ': the segment reads ' + fstr(WY) + ',', 'and (' + fstr(WY) + ')² = ' + fstr(WY2) + ', not ' + fstr(WX)];
  const meetFig = (() => {
    const draw = (G, wxo, r, L) => {
      const f = CH.frame(G);
      const seg = 'M' + inView.concat([[HX1, exitY]]).map(([x, y]) => P(f, fnum(x), fnum(y))).join('L');
      const lab = ([x, y], t, cls, anchor) => CH.txt(f.px(x), f.py(y), t, cls, anchor);
      const q = (v, t) => ({ v, t });
      return CH.open({ w: G.w, h: G.h, alt: 'The meet, drawn large between x zero and five quarters: three exact knots of the square root as solid points, straight dotted segments between them, the dashed float curve above the segments, and a red cross at x one half where the segment reads two thirds, which squares to four ninths, not one half.' })
        + '\n' + CH.axes(f, { yTicks: [q(0, '0'), q(0.5, '1/2'), q(1, '1')], xTicks: [q(0, '0'), q(0.25, '1/4'), q(0.5, '1/2'), q(0.75, '3/4'), q(1, '1'), q(1.25, '5/4')], xLabel: 'x' })
        + '\n    <polyline points="' + flo.filter(([x]) => x <= 1.25).map(([x, y]) => P(f, x, y)).join(' ') + '" ' + W.attrs(W.COMPUTED, { width: 1.8 }) + ' stroke-linejoin="round"/>'
        + '\n    <path d="' + seg + '" ' + W.attrs(MEET, { width: 3 }) + '/>'
        + '\n' + inView.map(([x, y]) => '    <circle cx="' + f.px(fnum(x)).toFixed(1) + '" cy="' + f.py(fnum(y)).toFixed(1) + '" r="' + r + '" class="w-decided" fill="var(--ink)" stroke-width="' + HERO_DECIDED + '"/>').join('\n')
        + '\n' + W.witnessMark(f.px(fnum(WX)), f.py(fnum(WY)), wxo)
        + '\n' + (L.wx2 ? lab(L.wx, WXTXT[0], 't-lab', 'start') + '\n' + lab(L.wx2, WXTXT[1], 't-lab', 'start') : lab(L.wx, WXTXT.join(' '), 't-lab', 'start'))
        + '\n' + lab(L.dec, '√(1/4) = 1/2 · decided, solid', 't-note', 'start')
        + '\n' + lab(L.com, 'Math.sqrt · computed, dashed', 't-note', 'end')
        + '\n' + lab(L.cho, L.choT, 't-note', 'start')
        + '\n' + CH.close;
    };
    const svg = draw(HERO, HERO_WX, 7, { wx: [0.55, 0.49], dec: [0.27, 0.38], com: [0.8, Math.sqrt(0.8) + 0.08], cho: [0.70, 0.66], choT: 'a straight segment, one curve of many · chosen, dotted' });
    const svgN = draw(HERO_N, HERO_WX_N, 5, { wx: [0.30, 0.29], wx2: [0.30, 0.21], dec: [0.29, 0.41], com: [0.8, Math.sqrt(0.8) + 0.08], cho: [0.58, 0.62], choT: 'a segment · chosen, dotted' });
    return C.figure({ svgRaw: svg, svgNarrowRaw: svgN, hero: true, captionRaw: '<span class="gr-k">the meet · ' + esc(W.NAME[MEET]) + ', ' + esc(STROKE_WORD[MEET]) + '</span>'
      + '√x is exact at x = ' + KNOTS.map(([x]) => fstr(x)).join(', ') + ' (checked by squaring): ' + numword(KNOTS.length) + ' decided knots, drawn solid; the first ' + numword(inView.length) + ' are in view. '
      + 'The straight segments between them are one curve of the infinitely many through those knots, so '
      + m('W.meet(DECIDED, DECIDED, CHOSEN)') + ' is ' + esc(W.NAME[MEET]) + ': dotted. The thin dashed line is the float curve. '
      + 'Drawn solid, the segments would claim to be √x. That claim has a counterexample, exhibited and decided here: '
      + W.witness('the exhibited counterexample') + ' at x = ' + fstr(WX) + ' the segment reads ' + fstr(WY) + ', and (' + fstr(WY) + ')² = ' + fstr(WY2) + ', not ' + fstr(WX) + '.' });
  })();

  /* the halo: a key, not data. Janela and Swell draw it this way on their bands; warrant.js has no halo of its own. */
  const haloFig = (() => {
    /* two bands side by side since D12 (the meet it sat beside became the hero): one strip across the track */
    const H = 30, Y = 58, band = (L, R, halo) => (halo ? '    <rect class="gr-halo" filter="url(#gr-blur)" x="' + L + '" y="' + Y + '" width="' + (R - L) + '" height="' + H + '"/>\n' : '')
      + '    <rect x="' + L + '" y="' + Y + '" width="' + (R - L) + '" height="' + H + '" fill="var(--band-fill)"/>\n'
      + '    <line x1="' + L + '" y1="' + Y + '" x2="' + R + '" y2="' + Y + '" ' + W.attrs(W.DECIDED, { width: 1.5 }) + '/>\n'
      + '    <line x1="' + L + '" y1="' + (Y + H) + '" x2="' + R + '" y2="' + (Y + H) + '" ' + W.attrs(W.DECIDED, { width: 1.5 }) + '/>';
    const svg = CH.open({ w: 1000, h: 140, alt: 'The halo, as a key: two bands side by side with the same crisp solid edges; the right one, carried by a model not validated where it is drawn, also has a blurred halo outside its edges.' })
      + '\n    <defs><filter id="gr-blur" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="2.4"/></filter></defs>'
      + '\n' + CH.txt(40, 40, 'validated where it is drawn', 't-lab', 'start') + '\n' + band(40, 460, false)
      + '\n' + CH.txt(540, 40, 'carried here by a model not validated here', 't-lab', 'start') + '\n' + band(540, 960, true)
      + '\n' + CH.txt(540, 124, 'the same edges; the blur is the model’s own error', 't-note', 'start')
      + '\n' + CH.close;
    return figure(svg, '<span class="gr-k">the halo · rule 13</span>A key, not data. A band a model carries to a place where the model was not validated keeps its crisp edges, '
      + 'because the decision is made on them given the model, and gains a blur outside them: the model’s own error there has no edge to draw. '
      + 'A validated band has no halo. The edges are drawn by warrant.js; the blur by this page, the way ' + a('../janela/', 'Janela') + ' draws it (' + a('../swell/', 'Swell') + ' draws the same on a canvas).');
  })();

  /* ============================================ the records behind findings == */
  /* neural-geometry: the tied minimum spanning trees, recomputed from its record with the one exact test */
  const NG = J('playground/neural-geometry/out/geometry.json');
  const ngTrees = NG.sets.filter((s) => !s.order).flatMap((s) => s.models.filter((x) => !x.incomplete && x.mst).map((x) => mstUnique(x.D, x.mst)));
  const ngTied = ngTrees.filter((u) => !u).length;
  guard('neural-geometry\'s record no longer holds a tied minimum spanning tree (rule 3\'s finding would be false)', ngTied > 0 && ngTrees.length > ngTied, ngTied + ' of ' + ngTrees.length);
  /* blind-spot: the retired headline, quoted from its builder's own note, and the sample its record is */
  const bsSrc = read('playground/blind-spot/build.js');
  const bsOld = /"(Fourteen million certified verdicts\s+could not see this mutant)/.exec(bsSrc);
  const bsN = read('corpus/blindspot/mut/corpus.hex').split(/\r?\n/).filter(Boolean).length;
  const bsLive = read('site/instruments/blind-spot/index.html');
  guard('blind-spot\'s builder no longer records the headline it retired, or its live headline no longer counts the corpus sample it is built from',
    !!bsOld && bsN === 4000 && /Four thousand certified verdicts could not see this mutant/.test(bsLive), 'sample ' + bsN);
  const bsQuote = bsOld[1].replace(/\s+/g, ' ');
  /* the atlas: each claim box is our reading; the claims that turn on it, from the page's own data */
  const AT = J('site/instruments/return-level-atlas/atlas.json');
  const atTurn = AT.claims.filter((k) => !k.robust);
  guard('the atlas no longer holds exactly one claim whose verdict turns on the reading of its box', atTurn.length === 1 && AT.claims.length > 1, atTurn.map((k) => k.id).join(', '));
  const atK = atTurn[0];
  const atMoves = atK.reads.filter((r) => r.verdict !== atK.verdict).map((r) => {
    const d = ['lat', 'lon'].flatMap((ax) => [0, 1].map((i) => [ax, i, r.box[ax][i] - atK.box[ax][i]])).find(([, , dd]) => dd);
    const edge = d[0] === 'lat' ? (d[1] === 0 ? 'south' : 'north') : (d[1] === 0 ? 'west' : 'east');
    const dir = d[0] === 'lat' ? (d[2] > 0 ? 'north' : 'south') : (d[2] > 0 ? 'east' : 'west');
    return { edge, dir, deg: Math.abs(d[2]), verdict: r.verdict };
  });
  guard('the atlas claim that turns on its box no longer turns by moving one edge', atMoves.length > 0 && atMoves.every((x) => x.deg > 0));
  const lc = (v) => String(v).toLowerCase();
  /* navier-stokes: the threshold its build refuses on, and what the old field read */
  const nsSrc = read('playground/navier-stokes/build.js');
  const nsThr = /if \(!\(worst < ([0-9.e-]+)\)\)/.exec(nsSrc), nsOld = /The field it replaced read about ([0-9.]+) here/.exec(nsSrc);
  const nsLive = read('site/instruments/navier-stokes/index.html');
  guard('navier-stokes\' build no longer refuses a drawn field that is not divergence-free, or its page lost the italic "given" and h = 3/50',
    !!nsThr && !!nsOld && /<em>given<\/em>/.test(nsLive) && /3\/50/.test(nsLive));
  const nsExp = Number(nsThr[1]).toExponential().split('e');
  guard('navier-stokes\' threshold is no longer a power of ten', nsExp[0] === '1', nsThr[1]);
  const nsThrHtml = '10<sup>' + nsExp[1].replace('-', '−') + '</sup>';
  /* contours: a truncated expected count, from its builder's own note, rounded here exactly */
  const ctSrc = read('playground/contours/build.js');
  const ct = /(\d+)\/(\d+) as "(0\.\d+)"/.exec(ctSrc);
  guard('contours\' builder no longer records the expected count it printed truncated', !!ct);
  const ctQ = fr(ct[1], ct[2]), ctD = ct[3].length - 2;
  const scale = 10n ** B(ctD), cut = ctQ[0] * scale / ctQ[1], rnd = (2n * ctQ[0] * scale + ctQ[1]) / (2n * ctQ[1]);
  const dec = (v) => '0.' + String(v).padStart(ctD, '0');
  guard('the truncated count is not what cutting its digits gives, or rounding gives the same', dec(cut) === ct[3] && rnd !== cut, dec(cut) + ' vs ' + ct[3]);
  /* occultation: the joined dots named as no member of the set; the empty face-value set as ∅ */
  const ocLive = read('site/instruments/occultation/index.html');
  guard('occultation no longer says its joined dots are not a member of the set, or no longer prints the empty face-value set as ∅',
    /nor a member of the set/.test(ocLive) && /&empty;|∅/.test(ocLive));
  /* the first dash census, as grammar.js records it */
  const grSrc = read('design/grammar.js');
  const gr25 = /returned TWENTY-FIVE distinct\s+dash patterns/.test(grSrc) && /"1\.04 5\.460000000000001"/.test(grSrc);
  guard('design/grammar.js no longer records the first census it was written after (twenty-five patterns, one with a float artefact)', gr25);
  /* Swell: the comparison, the held-out band, the breaking ratio, the beaches where the island reads low */
  const SW = J('certs/swell-island-boussinesq.json'), swR = SW.readings.swell;
  const EV = J('certs/janela-providers-eval.json'), swU = EV.results.find((x) => x.option === 'U(E,N)' && x.miss === '1/10');
  const SURF = require(path.join(ROOT, 'apps', 'swell', 'model', 'surf.js'));
  const swLong = /Swells of (\d+) s and longer/.exec(SW.note), swH = /for a (\d+) m swell/.exec(SW.what);
  guard('Swell\'s comparison or its held-out band record no longer says what the chain on this page prints',
    !!swU && swU.n > 0 && swR.all.n === SW.pairs && Object.keys(swR.byBeach).length === SW.beaches && !!swLong && !!swH && SURF.C.GAMMA > 0);
  /* Swell's rule (apps/swell/app/build-app.js): a beach whose long-swell median ratio is below 1 reads low */
  const swLow = Object.entries(swR.byBeachLong).filter(([, v]) => v.medianRatio < 1).sort((x, y) => x[1].medianRatio - y[1].medianRatio);
  guard('no beach reads low any more (rule 16\'s finding would be false)', swLow.length > 0);
  const listAnd = (xs) => (xs.length > 1 ? xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1] : xs.join(''));
  const swLowTxt = listAnd(swLow.map(([k, v]) => esc(k) + ' (' + v.medianRatio.toFixed(2) + '×)'));
  const swLive = (() => { try { return read('site/swell/app.js'); } catch (e) { return ''; } })();
  guard('Swell\'s legend no longer says its crests are a picture of the island model', /crests are a picture of the island model/.test(swLive));
  const missQ = swU.miss.split('/').map(Number), claimIn = missQ[1] - missQ[0];
  /* delta3: read steps listed as assumed under a decided core */
  const d3Live = read('site/reports/delta3.html');
  guard('the δ₃ report no longer lists its read steps as assumed premises', /class="w-premises"/.test(d3Live) && /read line by line/.test(d3Live) && /three steps proved on paper and read/.test(d3Live));

  /* ========================================================= the colours == */
  const reg = between('**Registered colours**', '\nRetired the same day').split('\n').filter((l) => /^\|/.test(l)).slice(2)
    .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
  const witnessHex = T.DARKONLY['--witness'];
  guard('the rulebook\'s registered colours disagree with the tokens, or the apps\' refused state is a second red again',
    reg.length >= 5 && reg.every((r) => r.length === 5) && reg.some((r) => r[0].includes('--witness') && r[0].includes(witnessHex))
      && APP.APP_DARK['--v-refu'] === witnessHex, reg.length + ' rows');
  const thr = /CVD ΔE ≥ (\d+) and normal vision\s+≥ (\d+)/.exec(RB);
  const de04 = /read ΔE ([0-9.]+) apart to a deuteranope/.exec(RB), de4 = /ΔE ~(\d+)\)/.exec(RB);
  guard('the rulebook no longer states the validator\'s thresholds, or the two measurements the colour law came from', !!thr && !!de04 && !!de4);
  const cell = (s) => esc(s).replace(/`([^`]+)`/g, '<span class="m">$1</span>');

  /* ========================================================== the checks == */
  const run = (args) => { const r = cp.spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return (r.stdout || '') + (r.stderr || ''); };
  const census = run(['tools/check-grammar.js', '--report']);
  const uses = Object.fromEntries([...census.matchAll(/^\s+ok\s+"([^"]+)"\s+(\d+) use\(s\)/gm)].map((x) => [x[1], Number(x[2])]));
  const ctot = /(\d+) distinct pattern\(s\) · (\d+) conforming use\(s\) · (\d+) drifting use\(s\)/.exec(census);
  const exempt = Object.keys(J('design/grammar-baseline.json').exempt || {}).length;
  guard('the dash census (tools/check-grammar.js --report) cannot be read, or counts a pattern outside the five',
    !!ctot && G.PERMITTED.every((p) => p in uses) && Number(ctot[3]) === 0, ctot ? ctot[0] : census.slice(-200));
  /* D10 (2026-10-29): the pointed numbers, re-read; and the ones that still carry no address, counted */
  const marksOut = run(['tools/check-marks.js']);
  const mk = /check-marks: PASS — (\d+) pointed mark\(s\) on (\d+) page\(s\), 0 refused · (\d+)\/(\d+) red controls fired/.exec(marksOut);
  const unp = /unpointed: (\d+)/.exec(census);
  guard('the marks gate (tools/check-marks.js) did not pass with every red control fired, or the census stopped counting the values without an address',
    !!mk && mk[3] === mk[4] && !!unp, mk ? mk[0] : marksOut.slice(-200));
  const wiring = run(['tools/check-wiring.js']);
  const leg = /^\s+(ok|FAIL)\s+\d+\s+every page that draws the grammar prints its legend\s+\[(\d+) of (\d+) pages draw it\]/m.exec(wiring);
  guard('the legend check (tools/check-wiring.js) cannot be read, or finds a page that draws the grammar without its legend', !!leg && leg[1] === 'ok', leg ? leg[0] : wiring.slice(-300));
  const MB = J('design/measure-baseline.json'), RBL = J('design/render-baseline.json');
  guard('the layout ruler\'s or the render check\'s record is missing its viewports, pages or figures',
    Array.isArray(MB.viewports) && MB.viewports.length >= 2 && Object.keys(MB.pages || {}).length > 0 && Object.keys(RBL.figures || {}).length > 0);
  const vps = MB.viewports.slice().sort((x, y) => y - x);

  /* ======================================================= the findings == */
  const COMMITS = {};
  const commit = (h) => {
    if (!COMMITS[h]) {
      let full = '', date = '';
      try { full = git(['rev-parse', '--verify', '--quiet', h + '^{commit}']); date = git(['show', '-s', '--format=%cs', full]); } catch (e) { /* refused below */ }
      guard('a commit it cites as a fix is not in this repository\'s history', /^[0-9a-f]{40}$/.test(full) && /^\d{4}-\d{2}-\d{2}$/.test(date), h);
      COMMITS[h] = { full, date };
    }
    const c = COMMITS[h];
    return '<a class="gr-c" href="' + escAttr(GITHUB + '/commit/' + c.full) + '">fixed ' + esc(day(c.date)) + ' · ' + esc(h) + '</a>';
  };
  const page = (rel, name) => {
    const f = rel.endsWith('/') ? rel + 'index.html' : rel;
    guard('a page a finding links to is not in the built site', fs.existsSync(path.join(ROOT, 'site', f)), f);
    return a('../' + f, esc(name));
  };
  const found = (rel, name, raw, h) => '<span class="gr-f">Found on ' + page(rel, name) + ': ' + raw + ' ' + commit(h) + '</span>';

  /* each rule: the rulebook's number, a pattern its title must still match (so the page and the rulebook cannot drift
     apart under one number), the plain words, and the findings */
  const MARK_RULES = [
    { n: 1, re: /^Standing is not a verdict/, b: 'Standing is not a verdict.',
      t: 'What an instrument concluded about a claim — CERTIFIED, REFUTED, REFUSED — is said in words and chips; what a mark rests on is said by its stroke or its underline. The two never share a channel, so a refutation proved here is drawn solid.',
      f: [found('instruments/neural-geometry/', 'neural-geometry', 'a frame verdict that failed was shown by striking its fitted number through, a line through a computed value carrying a verdict. The verdict is a word now, and the number keeps its dashed underline.', '17eb3d7c')] },
    { n: 2, re: /^A pick must be a member of the set it was picked from/, b: 'A pick must be a member of the set it was picked from, and the build checks that it is.',
      t: 'When a figure draws one member of a set the data admit, it must really be a member, and the page’s build verifies the membership exactly.',
      f: [found('instruments/census/', 'census', 'the totals it drew (Table I’s least-squares repair) moved two edges outside the ±½ a rounded integer allows, while the page said they were inside. The repair is now a fit held inside the box, with its optimality (KKT) conditions checked exactly.', '824b1261'),
        found('instruments/occultation/', 'occultation', 'the curve joining the measured chords is not concave, so no convex body has it: it was never a member of the set of silhouettes the chords admit. It is drawn dotted, as a chosen picture, and says so.', '824b1261'),
        found('instruments/navier-stokes/', 'navier-stokes', 'the drawn core was not incompressible: the field it replaced read |div u| about ' + esc(nsOld[1]) + ' times its larger term. The field is now solved from continuity in closed form, and the build refuses the page unless |div u| stays below ' + nsThrHtml + ' of it over the drawn range.', '3a072548')] },
    { n: 3, re: /^A tie is CHOSEN/, b: 'A tie is chosen.',
      t: 'When the optimum is not unique, the one drawn was picked by a tie-break: it is drawn dotted and said to be ' + W.value('one of several', W.CHOSEN) + '.',
      f: [found('instruments/neural-geometry/', 'neural-geometry', numword(ngTied) + ' of the ' + numword(ngTrees.length) + ' minimum spanning trees it draws tie (two edges of one length), so a tie-break picked them; they are dotted and named one of several. Recounted here from its record, by the same exact test.', '17eb3d7c')] },
    { n: 4, re: /^Dash is for standing only/, b: 'Dash is for standing only.',
      t: 'Which series or which model a line belongs to is carried by weight and opacity, never by a dash, in every figure on the site: a licence that held in one figure and not the next could not be read off the mark.',
      f: [found('instruments/answer-shape/', 'answer-shape', 'its three models were told apart by dash patterns (' + m('6 4') + ' and ' + m('1.6 3.4') + ' among them); the first dash census found them, and the page already carried the weight-and-opacity ladder underneath.', '36b10f33'),
        found('instruments/answer-shape/', 'answer-shape', 'its closing edge and the model chips still used a dash for a role; they use opacity now.', '17eb3d7c')] },
    { n: 5, re: /^The one accent/, b: 'The one accent.',
      t: 'The witness red marks an exhibited counterexample, a specific object that broke a claim someone made about that object’s own record, always as a × beside words (the one in the figure at the top of this page). It never marks a verdict word or a region, a scalar comparison (a box that clears a box has no witness point), a refutation reached by deduction, or an object taken from another record. When in doubt, ink.',
      f: [found('instruments/return-level-check/', 'the return-level check', 'its list of × marks became one module, and “not the certified fit” came off it, because a box clearing a box has no witness point; on the atlas, the design table’s rows stay ink, because their objects belong to another record than the claim’s.', '824b1261')] },
    { n: 6, re: /^Mood/, b: 'Mood.',
      t: 'A verdict that holds given a chosen input names that input in italic — <em>given h = 3/50</em> — and a hypothesis that was read but not machine-checked is named the same way.',
      f: [found('instruments/navier-stokes/', 'navier-stokes', 'its verdicts now name, in italic, the drawn stress and the theorems they cite.', '3a072548'),
        found('instruments/stereo-reach/', 'stereo-reach', 'the verdict now names its chosen inputs in italic.', '824b1261'),
        found('instruments/return-level-atlas/', 'the return-level atlas', 'each claim’s box is a reading of the paper’s words, so it is drawn dotted, with the readings one '
          + atMoves[0].deg + '° cell in or out beside it, and every claim is decided again on each. Of its ' + numword(AT.claims.length) + ' claims, one turns on the reading: the claim for '
          + esc(atK.where) + ' ' + lc(atK.verdict) + ' for the box as drawn, and ' + [...new Set(atMoves.map((x) => lc(x.verdict)))].join(' or ') + ' with '
          + atMoves.map((x) => 'the ' + x.edge + ' edge moved ' + x.deg + '° ' + x.dir).join(', or ') + '. The page says that verdict is a reading.', '16a2f42e')] },
    { n: 7, re: /^An empty set is/, b: 'An empty set is ∅.',
      t: 'It gets ∅ and a word, never a zero-height bar or a zero.',
      f: [found('instruments/occultation/', 'occultation', 'at face value (no error at all) the set of convex silhouettes the chords admit is empty; its row now prints ∅ and the words instead of a bar.', '824b1261')] },
    { n: 8, re: /^Read our own prose against the record/, b: 'Read the site’s own prose against the record.',
      t: 'Every number typed on a page comes from a record and is checked by that page’s build, so the build refuses when the record no longer supports the sentence. A headline with no record behind it is the failure this rule exists for. A printed bound is rounded outward, never truncated.',
      f: [found('instruments/blind-spot/', 'blind-spot', 'the headline read “' + esc(bsQuote) + '.” No record runs that corpus against the mutants; what the page rests on is a ' + fmt(bsN) + '-pair sample of it, and the headline now counts the sample, read from the file.', '4ad79bd3'),
        found('instruments/contours/', 'contours', 'two expected counts were printed by cutting digits: ' + ct[1] + '/' + ct[2] + ' as ' + ct[3] + ', where rounding gives ' + dec(rnd) + ' (both computed here, exactly). They are rounded from the exact values now.', '3a072548')] },
    { n: 9, re: /^A legend wherever a w-\* mark is/, b: 'A legend wherever a mark is.',
      t: 'Every page that uses a stroke or an underline of the grammar prints its legend, compact beside a figure; ' + m('tools/check-wiring.js') + ' refuses a page that has the marks without it.',
      f: [found('instruments/shape-hunt/', 'shape-hunt', 'its marks were committed without a legend, and the build refused at that check until the legend was added.', '824b1261')] },
    { n: 10, re: /never edited/, b: 'A page copied in is never edited.',
      t: 'A page copied byte for byte from another source changes only through its wrapper, by anchored replacements that each refuse unless their anchor occurs exactly once, or through a patch declared beside the copy.',
      f: [found('instruments/affect/', 'affect', 'its page script is a copy and stays untouched; every change on the page is a named passage the wrapper replaces, each refusing unless its anchor occurs exactly once.', '4fbb5ad3')] },
  ];
  const RULINGS = [
    { b: 'A layout placed by a float solver is a chosen picture.',
      t: 'An embedding or an eigenvector map says so once, in its caption; each mark on it keeps the standing of what it asserts, so an edge that exists is solid.',
      f: [found('instruments/neural-geometry/', 'neural-geometry', 'its map’s coordinates come from an eigendecomposition; the ring around the controls is dotted as a chosen picture, and the map’s sentence was corrected (one structured set sits inside the ring the page said the controls held alone).', '17eb3d7c')] },
    { b: 'A model’s answer is a claim someone made.',
      t: 'It is ' + W.value('computed', W.COMPUTED) + ', dashed, like a number someone printed.  The typed graph behind ' + page('instruments/graph/', 'the wiring instruments') + ' already drew it so: the node holding a model’s answer emits a float, and its wire is dashed.', f: [] },
  ];
  const MODEL_RULES = [
    { n: 11, re: /^A number that rests on a model names its premises/, b: 'A number that rests on a model names its premises.',
      t: 'In the order the number travelled through them, each with its grade and the record behind it, ending with a line that names the weakest — beside the certificate, and on the method page.',
      f: [found('swell/', 'Swell', 'every wave limit is decided exactly over a measured band, and the band reaches each beach through an island model whose own error at the shore has never been measured: true, and misleading read alone. Every beach card now says what its number rests on (the chain above).', '4a1d50b8')] },
    { n: 12, re: /^A grade comes from a record, and a comparison is calibrated first/, b: 'A grade comes from a record, and a comparison is calibrated first.',
      t: 'The build re-derives the comparison; before it is trusted, it must reproduce the published comparison it stands in for.',
      f: [found('swell/', 'Swell', 'its island model against a Boussinesq model first reproduced the published comparison, with the same probes and tables. On the current tables its record reads N ' + fmt(swR.all.n) + ', r ' + swR.all.r.toFixed(2) + ', bias +' + swR.all.bias.toFixed(2) + ' m, re-derived by the app’s battery.', '4a1d50b8')] },
    { n: 13, re: /^The halo/, b: 'The halo.',
      t: 'An extent carried to a place by a model that is not validated there keeps its crisp edges, because the decision is made on them given the model, and gains a halo outside them. A validated extent has no halo (the key above).',
      f: [found('janela/', 'Janela', 'a band borrowed from the nearest measured site, and the wind band, validated nowhere, gained the halo.', 'bea04b72')] },
    { n: 14, re: /^A forecast line is COMPUTED and dashed/, b: 'A forecast line is computed and dashed, on canvas too.',
      t: 'A canvas takes the same patterns: ' + m('setLineDash') + ' is given ' + m('G.claim(width)') + ' from design/grammar.js.',
      f: [found('swell/', 'Swell', 'its forecast lines were drawn solid until 28 October; every one (waves, wind, gusts, tide, the open sea) is dashed now.', '4a1d50b8')] },
    { n: 15, re: /^A field drawn from a model is a picture of the model/, b: 'A field drawn from a model is a picture of the model.',
      t: 'For crests or streamlines, the legend says so once.',
      f: [found('swell/', 'Swell', 'its legend says the crests are a picture of the island model, not a measurement.', '4a1d50b8')] },
    { n: 16, re: /^Where a comparison says the model reads low/, b: 'Where the model reads low, “under the limit” is flagged.',
      t: 'Where a comparison says the model reads low at a place, any “under the limit” there is flagged as calling for more caution than the arithmetic shows: a flag, not a refusal, because a refusal would remove an exact statement.',
      f: [found('swell/', 'Swell', swLowTxt + ' read below the Boussinesq model on swells of ' + swLong[1] + ' s and longer (the median ratio), and their cards say so.', '4a1d50b8')] },
  ];
  const ruleNums = MARK_RULES.concat(MODEL_RULES);
  const rb = V2.concat(V21);
  guard('the rulebook holds a rule this page does not explain, or has lost one it does (rules 1–16, by number and title)',
    rb.length === ruleNums.length && ruleNums.every((r, i) => rb[i].n === r.n && r.re.test(rb[i].title)),
    rb.map((r) => r.n + ' ' + r.title.slice(0, 30)).join(' | '));
  guard('the rulebook\'s colour law no longer has seven rules', V22.length === 7 && V22.every((r, i) => r.n === i + 1));
  const ruleList = (rs) => C.plainList(rs.map((r) => ({ raw: '<b>' + (r.n ? r.n + '. ' : '') + esc(r.b) + '</b> ' + r.t + (r.f.length ? r.f.join('') : '') })));

  /* =========================================================== the page == */
  const B_ = [];
  B_.push(C.header({ eyebrow: 'Carlos Toledo · the visual grammar', title: 'The visual grammar: what each mark rests on',
    deck: 'WARRANT is the grammar the figures, tables and numbers on this site are drawn in. The stroke of every line and the underline of every number say what it rests on: an exact decision, floating-point arithmetic, a choice, or nothing at all. A verdict is always a word. It covers the instruments and the pages read most; every other report takes it when it is next edited, and material already submitted elsewhere stays exactly as submitted. Below: the four marks, drawn live by the module; the '
      + numword(ruleNums.length) + ' rules, each with the finding on one of these pages that taught it; the colour law; the premise ladder for numbers that rest on a model; how the build enforces all of it; and how to use it in figures of your own.' }));

  B_.push(meetFig);
  B_.push(C.section({ lab: 'what it is', title: 'A stroke says what the number behind it rests on', id: 'what', wide: true,
    bodyRaw: '<div class="col">' + C.p('A chart and a table both assert things, and neither usually says which of its marks the data forced and which the renderer, the solver or the tolerance chose. A fitted curve drawn solid looks exactly like a proved bound drawn solid. This grammar gives every mark one of four standings, and each standing one stroke:')
      + C.plainList([
        { raw: '<b>' + esc(W.NAME[W.DECIDED]) + '</b> — solid; in text, plain. An exact decision backs it: an interval enclosure, an exact rational comparison, a proof.' },
        { raw: '<b>' + esc(W.NAME[W.COMPUTED]) + '</b> — dashed, ' + m(G.CLAIM) + '; in text, ' + W.value('a dashed underline', W.COMPUTED) + '. Floating-point arithmetic, a solver stopped at a tolerance, a fit, a forecast, or a number someone printed: it may well be right, and nothing decided it.' },
        { raw: '<b>' + esc(W.NAME[W.CHOSEN]) + '</b> — dotted, ' + m(G.PICK) + ' with round caps; in text, ' + W.value('a dotted underline', W.CHOSEN) + '. One member of a set the data admit, picked by something that is not the data: a tie-break, a default, a seed, a prior, an interpolation.' },
        { raw: '<b>' + esc(W.NAME[W.REFUSED]) + '</b> — no mark at all. The instrument declined, or the input is missing; the void is drawn, hatched, and in text it reads ' + W.value('refused', W.REFUSED) + '. It is never interpolated across, never averaged, never a zero.' },
      ])
      + C.pRaw('A mark takes the <b>weakest</b> standing on its path to the pixel: a knot computed exactly is solid, and the line drawn between two such knots is dotted, because a straight line is one curve of many through them. '
        + 'Standing is not a verdict. CERTIFIED, REFUTED and REFUSED are what an instrument concluded about a claim; they are said in words and chips, never in a stroke, and a refutation proved here is drawn solid. '
        + 'Nor is standing a confidence: a value known to many decimals can still be undecided, and a decided value can have a wide bracket, which is drawn as its own extent.') + '</div>'
      + LEGEND_FULL
      + '<div class="col">' + C.pRaw('How this grammar was examined: <a href="roundtable/index.html">the roundtable</a>, where eleven seats judged it on 29 October 2026, the law they kept drawn where this site once broke it, ten findings each as it was and as it is, and the fifteen rules they proposed with the status a build decides.') + '</div>' }));

  B_.push(C.section({ lab: 'live specimens', title: 'Drawn by the module when this page is built', id: 'specimens', wide: true,
    bodyRaw: '<div class="col">' + C.pRaw('Every mark below is drawn by ' + a(blob('playground/warrant.js'), 'playground/warrant.js') + ' as this page is built, on one curve: y = √x for x from −1 to 4. '
        + 'The exact parts are decided by this page’s builder in integer arithmetic; the float parts are Math.sqrt. If the module changes, these drawings change with it.') + '</div>'
      + '<div class="gr-spec" data-n="' + SPEC.length + '">' + SPEC.join('\n') + '</div>'
      + W.legendHtml()
      + '<div class="gr-two">' + haloFig + '</div>'
      + '<div class="col"><h3 class="gr-h3">A premise chain, with its ladder</h3>'
      + C.pRaw('A number that rests on a model names what it rests on, in the order the number travelled, each premise with its grade: '
        + [W.VALIDATED, W.COMPARED, W.VERIFIED, W.ASSUMED].map((g) => W.grade(g)).join(' · ') + ' (the ladder is explained below). '
        + 'This is the chain behind a wave limit at a beach on ' + a('../swell/', 'Swell') + ', built here from the records Swell reads:') + '</div>'
      + '<div class="col"><div class="rd">' + W.premisesHtml([
        { grade: W.VALIDATED, verified: false, label: 'The open sea and its band', evidence: 'covered ' + (100 * swU.coverage).toFixed(1) + '% of ' + fmt(swU.n) + ' satellite passes it had not seen; it claims ' + claimIn + ' in ' + missQ[1] + '.' },
        { grade: W.COMPARED, verified: false, label: 'The island model', evidence: 'beside a Boussinesq model at ' + numword(SW.beaches) + ' beaches, ' + fmt(swR.all.n) + ' cases of a ' + swH[1] + ' m swell: r ' + swR.all.r.toFixed(2) + ', the island ' + swR.all.bias.toFixed(2) + ' m higher on average. Compared at those beaches; assumed at the others.' },
        { grade: W.ASSUMED, label: 'Breaking', evidence: 'the wave breaks at ' + SURF.C.GAMMA.toFixed(2) + ' times the depth (Thornton & Guza, 1982); no sandbars; the shallow profile taken from the nautical chart.' },
      ], { meetLine: 'The arithmetic is exact; the weakest premise is <b>' + esc(W.pairWord(W.weakestPair([{ grade: W.VALIDATED, verified: false }, { grade: W.COMPARED, verified: false }, { grade: W.ASSUMED }]))) + '</b>, and neither model was verified against an exact solution of its own equations (D11). Where the island reads less than the Boussinesq model — ' + swLowTxt + ' — “under the limit” calls for more caution than the arithmetic shows.' }) + '</div></div>' }));

  B_.push(C.section({ lab: 'the rules', title: numword(ruleNums.length).charAt(0).toUpperCase() + numword(ruleNums.length).slice(1) + ' rules, each learned on a page of this site', id: 'rules', wide: true,
    bodyRaw: '<div class="col">' + C.pRaw('The rulebook is ' + a(blob('design/WARRANT.md'), 'design/WARRANT.md') + ' (' + esc(frozen[1]) + ', frozen ' + esc(day(frozen[2])) + ' ' + esc(frozen[2].slice(0, 4)) + ', with dated rulings since). '
        + 'Each rule below was found on a page here that broke it. Each names the page, what was wrong, and the change that fixed it; the fix is checked by that page’s own build, which refuses when its record stops supporting its sentence.')
      + '<h3 class="gr-h3">Marks</h3>' + ruleList(MARK_RULES)
      + '<h3 class="gr-h3">Two rulings of 28 October</h3>' + ruleList(RULINGS)
      + '<h3 class="gr-h3">Numbers that rest on a model</h3>' + ruleList(MODEL_RULES) + '</div>' }));

  B_.push(C.section({ lab: 'the colour law', title: 'Ink first, and one red', id: 'colour', wide: true,
    bodyRaw: '<div class="col">' + C.pRaw('Ink comes first: a figure must read completely in greyscale, and a colour always arrives with a shape and a word. The law came from a measurement: run through the validator, the palette of Machinidae, a sibling project built on this grammar, showed its two main series colours ΔE '
        + esc(de04[1]) + ' apart to a deuteranope. To that reader they were one colour.')
      + C.plainList([
        { b: '1. Ink first.', text: 'Every figure reads completely in greyscale; a colour always comes with a shape and a word.' },
        { b: '2. One colour, one meaning,', text: 'in every project built on the grammar. Each colour is registered, below, with its meaning and the date it was approved.' },
        { b: '3. Colour never carries standing', text: '(the stroke does), and it never stands in for a verdict word.' },
        { b: '4. Four kinds of colour only:', text: 'the witness, one red, for a shown counterexample; identity, at most three hues for the series compared in one figure, each with its own shape; order, one hue in lightness steps, for an ordered scale; status, an app’s decided states, always with an icon and a word.' },
        { b: '5. Every pair passes the validator.', raw: 'Every set of colours that shares a figure is compared pair by pair, on the figure’s own ground, in OKLab (ΔE × 100) under the colour-vision model of Machado, Oliveira and Fernandes (2009): ΔE ≥ ' + esc(thr[1]) + ' for each simulated colour-vision deficiency and ≥ ' + esc(thr[2]) + ' for normal vision, every pair and not only neighbours in a list.' },
        { b: '6. No yellow and no orange.', text: '' },
        { b: '7. A new colour enters only with the validator’s report and an approval,', text: 'recorded in the rulebook.' },
      ])
      + '<h3 class="gr-h3">The registered colours</h3>'
      + C.pRaw('Read from the rulebook when this page is built. No swatches: the only colour this page draws is the witness ×.')
      + C.plainList(reg.map((r) => ({ raw: '<b>' + cell(r[0]) + '</b> · ' + esc(r[1]) + ' — ' + cell(r[2]) + '. <em>Where:</em> ' + cell(r[3]) + '. <em>Approved:</em> ' + cell(r[4]) + '.' })))
      + '<h3 class="gr-h3">One red</h3>'
      + C.pRaw('The witness red, ' + m(witnessHex) + ' (the × in the figure at the top of this page), marks an exhibited counterexample and nothing else. Until 29 October the apps carried a second red for a refused state, ΔE about ' + esc(de4[1])
        + ' from the witness: one red to the eye with two meanings, against law 2. It is folded now. The apps’ refused state reads the witness token, with the witness’s meaning: a decided state shown together with the datum that breaks the rule, always with its icon and its word.') + '</div>' }));

  const LADDER_LIT = {
    [W.VALIDATED]: ['validation', 'the open sea’s band, against satellite passes it had not seen'],
    [W.COMPARED]: ['code-to-code comparison', 'the island model, against a Boussinesq model at ' + numword(SW.beaches) + ' beaches'],
    [W.VERIFIED]: ['code verification', 'none yet'],
    [W.ASSUMED]: ['an adopted assumption', 'breaking at ' + SURF.C.GAMMA.toFixed(2) + ' times the depth (Thornton & Guza, 1982), and no sandbars'],
  };
  B_.push(C.section({ lab: 'the premise ladder', title: 'How far a premise was checked', id: 'ladder', wide: true,
    bodyRaw: '<div class="col">' + C.p('Standing says how a number was computed. A number that rests on a physical model needs a second answer that standing cannot give: the arithmetic can be exact while the equations it was exact about have never met the thing they describe. So each premise carries a grade, which says where the checking of it stopped. Strongest first:')
      + C.plainList([W.VALIDATED, W.COMPARED, W.VERIFIED, W.ASSUMED].map((g) => ({ raw: W.grade(g) + ' — ' + esc(W.GRADE_GLOSS[g]) + '. <em>In the literature:</em> ' + esc(LADDER_LIT[g][0]) + '. <em>On Swell:</em> ' + esc(LADDER_LIT[g][1]) + '.' })))
      + C.pRaw('The ladder is the verification-and-validation ladder of the modelling literature — Roache (1998), Oberkampf and Roy (2010), the ASME V&amp;V 20 standard (2009) — cut to ' + numword(W.GRADE.length) + ' grades a reader can tell apart. '
        + 'A conclusion is as checked as its weakest premise (' + m('W.weakest') + '), and the page that states it names that premise. A grade is never a probability and never a confidence. It is carried by a word first and a three-step glyph second, never by colour.')
      + C.pRaw('<b>A read step (ruled 29 October).</b> A proof step that was read and not run by a machine gets no grade of its own: it is ' + W.grade(W.ASSUMED) + ', and the gloss says so. It does not cap a verdict. CERTIFIED, PARTIAL, REFUTED and REFUSED keep the meaning their certificate gives them; every read step is listed, graded assumed, in the page’s “what it rests on”, and the chain’s last line names it. '
        + 'A reader always sees where the machine stopped; the verdict word never hides a reading, and a reading never demotes a decision it does not touch. ' + page('reports/delta3.html', 'δ₃ = 117/2192') + ' is an example: a decided finite core, and three steps proved on paper and read, listed as assumed.')
      + C.pRaw('Where a model carries an extent, the same idea is drawn as the halo (rule 13, the key above): blur is the sign of uncertainty readers understand most readily (MacEachren et al. 2012).')
      + '<details class="more"><summary>References</summary>' + C.plainList([
        { text: 'Roache, P. J. (1998). Verification and Validation in Computational Science and Engineering. Hermosa Publishers.' },
        { text: 'Oberkampf, W. L., & Roy, C. J. (2010). Verification and Validation in Scientific Computing. Cambridge University Press.' },
        { text: 'ASME V&V 20-2009. Standard for Verification and Validation in Computational Fluid Dynamics and Heat Transfer. The American Society of Mechanical Engineers.' },
        { text: 'MacEachren, A. M., Roth, R. E., O’Brien, J., Li, B., Swingley, D., & Gahegan, M. (2012). Visual semiotics & uncertainty visualization: an empirical study. IEEE Transactions on Visualization and Computer Graphics, 18(12), 2496–2505.' },
        { text: 'Machado, G. M., Oliveira, M. M., & Fernandes, L. A. F. (2009). A physiologically-based model for simulation of color vision deficiency. IEEE Transactions on Visualization and Computer Graphics, 15(6), 1291–1298.' },
        { text: 'Thornton, E. B., & Guza, R. T. (1982). Energy saturation and phase speeds measured on a natural beach. Journal of Geophysical Research, 87(C12), 9499–9508.' },
      ]) + '</details></div>' }));

  const STAND = { [G.CLAIM]: 'computed, the line pattern', [G.CLAIM_SM]: 'computed, under ' + G.SMALL_BELOW + ' px of stroke', [G.PICK]: 'chosen, round caps', [G.PICK_SM]: 'chosen, under ' + G.SMALL_BELOW + ' px', [G.GUIDE]: 'a guide: an axis, a ruler, a ghost; it says nothing' };
  const CHECKS = [
        { raw: '<b>' + a(blob('tools/check-grammar.js'), 'tools/check-grammar.js') + ' — the dash census.</b> Only the ' + numword(G.PERMITTED.length) + ' patterns of ' + a(blob('design/grammar.js'), 'design/grammar.js') + ' may appear in a built page; '
            + numword(exempt) + ' uses of a dash array that are not lines (an arc length, a draw-on animation, and a retired pattern that survives only in the three submitted Petrobras pages, kept as submitted) are declared by name, each with its reason. '
            + 'The first census, on 5 September, counted twenty-five patterns: the dash had been derived from the stroke width, so every width minted a pattern of its own, one of them carrying a float artefact (' + m('1.04 5.460000000000001') + ') into published HTML. At the last sync, ' + fmt(Number(ctot[2])) + ' conforming uses and ' + fmt(Number(ctot[3])) + ' outside the ' + numword(G.PERMITTED.length) + ':'
            + '<ul class="gr-pats">' + G.PERMITTED.map((p) => '<li>' + m(p) + ' ' + esc(STAND[p]) + ' — ' + fmt(uses[p]) + ' uses</li>').join('') + '</ul>' },
        { raw: '<b>' + a(blob('tools/check-marks.js'), 'tools/check-marks.js') + ' — a printed number is re-read from its record.</b> A value written through ' + m('W.val') + ' carries the address of its record cell ('
            + m('data-rec') + ': a file under certs/ or corpus/ and a pointer) and the format it was printed by; at every build this gate follows each address from the built page back into the record, prints the datum again by the same rule ('
            + a(blob('design/record.js'), 'design/record.js') + '), and refuses a page whose text differs, whose pointer no longer resolves, or whose decided value was cut to nearest where an end was needed. At the last check, '
            + fmt(Number(mk[1])) + ' numbers on ' + fmt(Number(mk[2])) + ' pages were re-read this way, and ' + fmt(Number(unp[1])) + ' values still carry no address: that count is recorded and may only shrink. '
            + 'Four planted marks — a dangling pointer, an upper end rounded inward, a wrong digit, a decided value cut short — are refused on every run.' },
        { raw: '<b>' + a(blob('tools/check-wiring.js'), 'tools/check-wiring.js') + ' — a legend wherever a mark is.</b> A page with a mark of the grammar and no legend is refused. At the last check, ' + fmt(Number(leg[2])) + ' of the ' + fmt(Number(leg[3])) + ' pages it walks draw the grammar, and every one prints its legend. Its red control plants a computed line with no legend, and must catch it.' },
        { raw: '<b>' + a(blob('tools/check-render.js'), 'tools/check-render.js') + ' — what a page shows.</b> No text a builder leaked (a template that never filled, a cell reading undefined or NaN, a stray backtick); no mark whose paint does not resolve; no figure thinner in ink than its record (' + fmt(Object.keys(RBL.figures).length) + ' figures recorded); no new mark too faint to see; no script error while the page loads. '
            + 'Its paint check was made strict when the legend’s void swatch fell through to SVG’s default fill, black on a near-black ground, and had passed every run, because black is a paint.' },
        { raw: '<b>' + a(blob('tools/check-measure.js'), 'tools/check-measure.js') + ' — the layout ruler.</b> Every built page driven in Chrome at ' + vps.join(', ') + ' px; the number of left edges, sideways overflow, blocks escaping the screen and clipped elements may only go down (' + fmt(Object.keys(MB.pages).length) + ' pages recorded).' },
  ];
  const nChecks = numword(CHECKS.length);
  B_.push(C.section({ lab: 'how it is enforced', title: 'The checks that refuse a page', id: 'enforced', wide: true,
    bodyRaw: '<div class="col">' + C.p('A grammar that no build checks is a suggestion. ' + nChecks.charAt(0).toUpperCase() + nChecks.slice(1) + ' programs read every built page and refuse the site when a page breaks the grammar or its layout gets worse. Each carries red controls, planted violations it must catch, so a check that cannot fail is caught too. The numbers below are read from their output and their records as this page is built.')
      + C.plainList(CHECKS)
      + C.p('This page is held to the same standard by its own builder, ' + 'tools/build-grammar.js, which reads every number above from its record and refuses to build when one stops saying what the page says.')
      + '<details class="more"><summary>This page refuses to build if …</summary>' + '%%GUARDS%%' + '</details></div>' }));

  /* the module's own output, for the code sample: what each call returns today */
  const ex1 = W.attrs(W.COMPUTED), ex2 = W.attrs(W.meet(W.DECIDED, W.CHOSEN), { width: 1 }), ex3 = W.value('3.1416', W.COMPUTED);
  const CODE = [
    "const W = require('./playground/warrant.js');",
    '',
    '// a line: its standing picks the stroke',
    'W.attrs(W.COMPUTED)',
    '  → ' + ex1,
    'W.attrs(W.meet(W.DECIDED, W.CHOSEN), { width: 1 })',
    '  → ' + ex2,
    '',
    '// a number in text',
    "W.value('3.1416', W.COMPUTED)",
    '  → ' + ex3,
    '',
    '// the legend, compact beside a figure, and the stylesheet, once per page',
    'W.legendHtml({ compact: true })',
    'W.css()',
    '',
    '// a chain of premises, in the order the number travelled through them',
    'W.premisesHtml([',
    "  { grade: W.VALIDATED, label: 'The open sea and its band', evidence: '...' },",
    "  { grade: W.ASSUMED, label: 'Breaking', evidence: '...' },",
    "], { meetLine: 'The weakest premise is assumed.' })",
  ].join('\n');
  guard('the code sample shows a call whose output is not what the module returns', /stroke-dasharray="5 4"/.test(ex1) && /w-chosen/.test(ex2) && /stroke-dasharray="1 3"/.test(ex2) && /w-computed/.test(ex3));
  B_.push(C.section({ lab: 'use it', title: 'In figures of your own', id: 'use', wide: true,
    bodyRaw: '<div class="col">' + C.pRaw('The module is one file, ' + a(blob('playground/warrant.js'), 'playground/warrant.js') + ', MIT-licensed, with the ' + numword(G.PERMITTED.length) + ' patterns in ' + a(blob('design/grammar.js'), 'design/grammar.js') + ' beside it; it needs no library. In Node, with what each call returns as this page was built:')
      + C.code(CODE)
      + C.pRaw('On a canvas, ' + m('setLineDash') + ' takes the same patterns from grammar.js: ' + m('G.dash.claim') + ' is ' + m('[' + G.dash.claim.join(', ') + ']') + ' and ' + m('G.dash.pick') + ' is ' + m('[' + G.dash.pick.join(', ') + ']') + '. '
        + 'The legend and the ladder in Portuguese — ' + WPT.GRADE.map((g) => '<em>' + esc(g) + '</em>').join(', ') + ' — are in ' + a(blob('playground/warrant-pt.js'), 'playground/warrant-pt.js') + '. The rules are in ' + a(blob('design/WARRANT.md'), 'design/WARRANT.md') + '.')
      + C.p('A print version and a Python kit for matplotlib are in preparation.') + '</div>' }));

  const body = B_.join('\n\n').replace('%%GUARDS%%', () => C.plainList(GUARDS.map((g) => ({ text: '… ' + g + '.' }))));
  const head = (() => { try { return git(['rev-parse', '--short', 'HEAD']); } catch (e) { return 'unknown'; } })();
  const foot = '<p>Built from playground/warrant.js, design/grammar.js, design/WARRANT.md and the records each finding cites, at git ' + esc(head) + ', by tools/build-grammar.js. MIT. <a href="' + GITHUB + '">Source</a>.</p>';
  const CSS = `
/* /grammar/ (tools/build-grammar.js): the specimen grids, the finding lines, the halo key (the hero under the header is design/template.js) */
.gr-spec{display:grid;gap:var(--s-5);grid-template-columns:minmax(0,1fr);margin-top:var(--s-5)}
@media (min-width:700px){.gr-spec{grid-template-columns:repeat(2,minmax(0,1fr))}}
.gr-spec figure{margin:0}
.gr-spec figcaption{margin-bottom:0}
.gr-two{margin-top:var(--s-7)}
.gr-k{display:block;margin-bottom:var(--s-1);font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-2)}
.gr-h3{margin-top:var(--s-7)}
.gr-f{display:block;margin-top:var(--s-2);font-size:var(--text-small);color:var(--ink-4)}
.gr-f a.gr-c{font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-3);white-space:nowrap}
ul.plain .gr-pats{list-style:none;padding:0;margin:var(--s-2) 0 0}
ul.plain .gr-pats li{padding:var(--s-1) 0;border-top:0;font-size:var(--text-small)}
.gr-halo{fill:var(--ink-2);stroke:var(--ink-2);stroke-width:4;stroke-linejoin:round;opacity:.32}
`;
  return TPL.render({ title: 'The visual grammar', bodyRaw: body, footRaw: foot, path: '/grammar/', cssRaw: CSS,
    desc: 'The visual grammar of this site: a mark’s stroke says what it rests on, decided, computed, chosen or refused, with '
      + numword(ruleNums.length) + ' rules, each from a finding on one of its own pages.' });
}

if (require.main === module) {
  const out = html();
  fs.mkdirSync(path.join(ROOT, 'site', 'grammar'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'site', 'grammar', 'index.html'), out);
  console.log('site/grammar/index.html written (' + out.length + ' bytes)');
}
module.exports = { html, cells, PANEL, RES, away, stair, fr, fsub, fadd, fmul, fdiv, feq, fnum, fstr, Q, STEPS };
