#!/usr/bin/env node
/* build-grammar.js — /grammar/: the visual grammar (WARRANT), as a public page, and the one page about it.
   tools/ · cert-machine · 2026-10-29, redrawn 2026-10-30

   WHO IT IS FOR. Researchers and engineers who make figures and reports, and anyone who wants to read the pages here
   correctly. It makes one case — a figure can say what each of its marks rests on — and SHOWS it: the operator's ruling
   of 2026-10-30 was that a page about a visual grammar must draw its components, illustrate its rules and draw its
   colour law, and that the grammar has ONE page (the companion beside it was folded in; the review behind the rulings
   is internal and never cited — issues and their fixes are).

   WHAT IT IS MADE OF, and why it cannot fall out of step with the code:
     · every drawing is made by playground/warrant.js on numbers this file computes or reads (y = √x, decided here in
       BigInt; the colours from the rulebook's registry through design/colour.js) — the drawings themselves live in
       tools/build-grammar-plates.js, which invents no data;
     · the rules are design/WARRANT.md's, in plain words; the page refuses when the rulebook holds a rule it does not
       explain or has lost one it does;
     · every issue cited is one a commit fixed on one of our own pages, every number in it read from its record, and
       the counts before and after are taken by the census that gates the site, on the site as git holds it at the
       commit before the fixes and on the site now;
     · the checks' numbers are read from their own output and their records when the page is built.

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
const COL = require(path.join(ROOT, 'design', 'colour.js'));
const CG = require(path.join(__dirname, 'check-grammar.js'));
const PL = require(path.join(__dirname, 'build-grammar-plates.js'));
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

/* THE SPECIMENS' EXACT NUMBERS: y = √x, decided in BigInt. */
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

/* RULE 8 IN PIXELS: an enclosure's edges round AWAY from the curve, at a tenth of a pixel (fixed 2026-10-29) */
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
  const P = (f, x, y) => f.px(x).toFixed(1) + ',' + f.py(y).toFixed(1);
  const STROKE_WORD = { [W.DECIDED]: 'solid', [W.COMPUTED]: 'dashed', [W.CHOSEN]: 'dotted', [W.REFUSED]: 'the void' };

  /* THE HERO (D12): the whole grammar in one figure, the page's one figure drawn past the container. √x near zero:
     for x < 0 there is no real root, and the void is drawn; on [0, 4] the decided enclosure, eight steps of 1/2 checked
     by squaring, as two staircases whose edges round AWAY from the curve (rule 8 in pixels); the float curve; the exact
     knots, and the straight segments between them, one curve of many, so their meet is chosen; and the × where the
     segments break the claim to be √x. Every standing is in it, each labelled directly, and the × is the first a reader
     meets, at least as heavy as the decided marks (tools/check-wiring.js reads both from the built page). */
  const HERO = { w: 1000, h: 440, padL: 56, padR: 28, padT: 24, padB: 52, x0: -0.25, x1: 1.25, y0: 0, y1: 1.3 };
  const HERO_N = { w: 400, h: 460, padL: 38, padR: 12, padT: 20, padB: 44, x0: -0.25, x1: 1.25, y0: 0, y1: 1.3 };
  const HERO_DECIDED = 2, HERO_WX = { size: 11, width: 3.5 }, HERO_WX_N = { size: 8, width: 3 };
  guard('the hero\'s × is drawn thinner than its decided marks (a witness is an event at the figure\'s scale)', HERO_WX.width >= HERO_DECIDED && HERO_WX_N.width >= HERO_DECIDED);
  const HX1 = fr(5, 4), inView = KNOTS.filter(([x]) => fnum(x) <= fnum(HX1)), nextK = KNOTS[inView.length];
  /* where the last segment in view leaves the window, exactly: on the line from the last knot in view to the next */
  const exitY = fadd(inView[inView.length - 1][1], fmul(fdiv(fsub(nextK[1], inView[inView.length - 1][1]), fsub(nextK[0], inView[inView.length - 1][0])), fsub(HX1, inView[inView.length - 1][0])));
  guard('the hero\'s window no longer holds the witness and the knots either side of it', inView.length >= 3 && fnum(WX) < fnum(inView[2][0]) && fnum(exitY) < 1.3);
  /* the enclosure in view: the steps that start left of 5/4, the last one cut at the window's edge */
  const cellsIn = cells.filter((c) => fnum(c.x0) < fnum(HX1)).map((c) => (fnum(c.x1) > fnum(HX1) ? Object.assign({}, c, { x1: HX1 }) : c));
  guard('a step of the enclosure in the hero leaves the window it is drawn in', cellsIn.length >= 3 && fnum(cellsIn[cellsIn.length - 1].hi) < 1.3);
  const stairIn = (f, key) => { const dir = key === 'hi' ? -1 : 1;
    return 'M' + cellsIn.map((c, i) => (i ? 'V' + away(f.py(fnum(c[key])), dir) : away(f.px(fnum(c.x0)), -1) + ',' + away(f.py(fnum(c[key])), dir)) + 'H' + away(f.px(fnum(c.x1)), 1)).join(''); };
  { const f = CH.frame(HERO);
    guard('an edge of the hero\'s enclosure is drawn inside its record (the paths round outward to a tenth of a pixel)',
      cellsIn.every((c) => Number(away(f.py(fnum(c.hi)), -1)) <= f.py(fnum(c.hi)) && Number(away(f.py(fnum(c.lo)), 1)) >= f.py(fnum(c.lo)))); }
  const WXTXT = ['x = ' + fstr(WX) + ': the segment reads ' + fstr(WY) + ',', 'and (' + fstr(WY) + ')² = ' + fstr(WY2) + ', not ' + fstr(WX)];
  const heroFig = (() => {
    const draw = (Gm, wxo, r, L) => {
      const f = CH.frame(Gm), hh = PL.hatch();
      const seg = 'M' + inView.concat([[HX1, exitY]]).map(([x, y]) => P(f, fnum(x), fnum(y))).join('L');
      const lab = ([x, y], tx, cls, anchor) => CH.txt(f.px(x), f.py(y), tx, cls, anchor);
      const q = (v, tt) => ({ v, t: tt });
      const vx0 = f.px(-0.25), vx1 = f.px(0);
      return CH.open({ w: Gm.w, h: Gm.h, alt: 'The whole grammar in one figure, the square root of x near zero: left of zero a hatched void, because no real root exists there; an enclosure of the root as two solid staircases; the dashed float curve; three exact knots as solid points with dotted straight segments between them; and a red cross at x one half, where the segment reads two thirds, which squares to four ninths, not one half.' })
        + '\n' + hh.def
        + '\n' + CH.axes(f, { yTicks: [q(0, '0'), q(0.5, '1/2'), q(1, '1')], xTicks: [q(0, '0'), q(0.25, '1/4'), q(0.5, '1/2'), q(0.75, '3/4'), q(1, '1'), q(1.25, '5/4')], xLabel: 'x' })
        + '\n' + PL.voidRect(hh, vx0, f.T, vx1 - vx0, f.ph)
        + '\n    <rect x="' + (vx0 + 3).toFixed(1) + '" y="' + (f.T + f.ph * 0.42 - 22).toFixed(1) + '" width="' + (vx1 - vx0 - 6).toFixed(1) + '" height="48" rx="4" fill="var(--paper)"/>'
        + '\n' + CH.txt((vx0 + vx1) / 2, f.T + f.ph * 0.42, '∅', 't-lab', 'middle')
        + '\n' + CH.txt((vx0 + vx1) / 2, f.T + f.ph * 0.42 + 18, L.voidT, 't-note', 'middle')
        + '\n    <path d="' + stairIn(f, 'hi') + '" ' + W.attrs(W.DECIDED, { width: 1.4 }) + '/>'
        + '\n    <path d="' + stairIn(f, 'lo') + '" ' + W.attrs(W.DECIDED, { width: 1.4 }) + '/>'
        + '\n    <polyline points="' + flo.filter(([x]) => x <= 1.25).map(([x, y]) => P(f, x, y)).join(' ') + '" ' + W.attrs(W.COMPUTED, { width: 1.8 }) + ' stroke-linejoin="round"/>'
        + '\n    <path d="' + seg + '" ' + W.attrs(MEET, { width: 3 }) + '/>'
        + '\n' + inView.map(([x, y]) => '    <circle cx="' + f.px(fnum(x)).toFixed(1) + '" cy="' + f.py(fnum(y)).toFixed(1) + '" r="' + r + '" class="w-decided" fill="var(--ink)" stroke-width="' + HERO_DECIDED + '"/>').join('\n')
        + '\n' + W.witnessMark(f.px(fnum(WX)), f.py(fnum(WY)), wxo)
        + '\n' + (L.wx2 ? lab(L.wx, WXTXT[0], 't-lab', 'start') + '\n' + lab(L.wx2, WXTXT[1], 't-lab', 'start') : lab(L.wx, WXTXT.join(' '), 't-lab', 'start'))
        + '\n' + lab(L.enc, L.encT, 't-note', 'end')
        + '\n' + lab(L.dec, L.decT, 't-note', 'start') + '\n' + lab(L.dec2, L.decT2, 't-note', 'start')
        + '\n' + lab(L.com, L.comT, 't-note', 'end')
        + '\n' + lab(L.cho, L.choT, 't-note', 'start')
        + '\n' + CH.close;
    };
    const svg = draw(HERO, HERO_WX, 7, { voidT: 'x < 0 · refused', wx: [0.55, 0.47],
      enc: [1.24, 1.262], encT: 'an enclosure: √x lies between the staircases · decided, solid',
      dec: [0.27, 0.44], decT: '√(1/4) = 1/2', dec2: [0.27, 0.40], decT2: 'decided, solid',
      com: [0.80, 0.955], comT: 'Math.sqrt · computed',
      cho: [0.66, 0.635], choT: 'a straight segment, one curve of many · chosen, dotted' });
    const svgN = draw(HERO_N, HERO_WX_N, 5, { voidT: 'x < 0', wx: [0.30, 0.25], wx2: [0.30, 0.18],
      enc: [1.24, 1.262], encT: 'the enclosure · decided',
      dec: [0.27, 0.42], decT: 'a knot', dec2: [0.27, 0.36], decT2: 'decided',
      com: [0.98, 1.06], comT: 'Math.sqrt · computed',
      cho: [0.56, 0.64], choT: 'a segment · chosen' });
    return C.figure({ svgRaw: svg, svgNarrowRaw: svgN, hero: true, captionRaw: '<span class="gr-k">the whole grammar, in one figure</span>'
      + 'y = √x near zero. <b>Decided</b>, solid: the enclosure, ' + numword(STEPS) + ' steps of width 1/2, each an integer square root over ' + Q + ' checked by squaring, its edges moved away from the curve to the next tenth of a pixel; and the knots where √x is exact (' + KNOTS.map(([x]) => fstr(x)).join(', ') + '). '
      + '<b>Computed</b>, dashed: Math.sqrt at ' + fmt(NPTS) + ' points (all ' + fmt(inside) + ' inside the enclosure; comparing two doubles is exact). '
      + '<b>Chosen</b>, dotted: the straight segments between the knots, one curve of the infinitely many through them, so ' + m('W.meet(DECIDED, DECIDED, CHOSEN)') + ' is ' + esc(W.NAME[MEET].toLowerCase()) + '. '
      + '<b>Refused</b>: for x &lt; 0 there is no real root, and nothing is drawn but the void. '
      + 'Drawn solid, the segments would claim to be √x, and that claim has a counterexample, exhibited and decided here: '
      + W.witness('the exhibited counterexample') + ' at x = ' + fstr(WX) + ' the segment reads ' + fstr(WY) + ', and (' + fstr(WY) + ')² = ' + fstr(WY2) + ', not ' + fstr(WX) + '.' });
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
    /* the commit is checked to exist and dated from git, and only the date is printed: no link out, no hash (the
       operator, 2026-10-30: the page cites the issue and its fix, never the commit) */
    return '<span class="gr-c">fixed ' + esc(day(c.date)) + '</span>';
  };
  const page = (rel, name) => {
    const f = rel.endsWith('/') ? rel + 'index.html' : rel;
    guard('a page a finding links to is not in the built site', fs.existsSync(path.join(ROOT, 'site', f)), f);
    return a('../' + f, esc(name));
  };
  const found = (rel, name, raw, h) => '<span class="gr-f">Found on ' + page(rel, name) + ': ' + raw + ' ' + commit(h) + '</span>';

  /* each rule: the rulebook's number, a pattern its title must still match (so the page and the rulebook cannot drift
     apart under one number), the plain words, its drawing (tools/build-grammar-plates.js), and the issues that taught it */
  const MARK_RULES = [
    { n: 1, re: /^Standing is not a verdict/, b: 'Standing is not a verdict.',
      t: 'A verdict is a word in a chip; what a mark rests on is its stroke or underline. They never share a channel, so a refutation proved here is drawn solid.',
      f: [found('instruments/neural-geometry/', 'neural-geometry', 'a failed frame verdict struck its fitted number through. The verdict is a word now, and the number keeps its dashed underline.', '17eb3d7c')] },
    { n: 2, re: /^A pick must be a member of the set it was picked from/, b: 'A pick is a member of its set, and the build checks it.',
      t: 'A figure that draws one member of a set the data admit draws a real member, verified exactly when the page is built.',
      f: [found('instruments/census/', 'census', 'its least-squares totals left the ±½ box a rounded integer allows. The repair is now a fit held inside the box, its optimality conditions checked exactly.', '824b1261'),
        found('instruments/occultation/', 'occultation', 'the curve joining its chords is not concave, so no convex body has it; it is drawn dotted, as a chosen picture.', '824b1261'),
        found('instruments/navier-stokes/', 'navier-stokes', 'the drawn core was not incompressible (|div u| about ' + esc(nsOld[1]) + ' times its larger term); the build now refuses it above ' + nsThrHtml + '.', '3a072548')] },
    { n: 3, re: /^A tie is CHOSEN/, b: 'A tie is chosen.',
      t: 'When the optimum is not unique, the one drawn was picked by a tie-break: dotted, and said to be ' + W.value('one of several', W.CHOSEN) + '.',
      f: [found('instruments/neural-geometry/', 'neural-geometry', numword(ngTied) + ' of its ' + numword(ngTrees.length) + ' minimum spanning trees tie; recounted here from its record by the same exact test.', '17eb3d7c')] },
    { n: 4, re: /^Dash is for standing only/, b: 'Dash is for standing only.',
      t: 'Which series or model a line belongs to is carried by weight and opacity, never by a dash, in every figure.',
      f: [found('instruments/answer-shape/', 'answer-shape', 'three models told apart by dash (' + m('6 4') + ' and ' + m('1.6 3.4') + ' among them); the weight-and-opacity ladder was already underneath.', '36b10f33')] },
    { n: 5, re: /^The one accent/, b: 'The one accent.',
      t: 'The red × marks an exhibited counterexample: an object that broke a claim made about its own record, with words. Never a verdict word, a region, a scalar comparison or a deduction. When in doubt, ink.',
      f: [found('instruments/return-level-check/', 'the return-level check', '“not the certified fit” came off the × list: a box clearing a box has no witness point.', '824b1261')] },
    { n: 6, re: /^Mood/, b: 'Mood.',
      t: 'A verdict that holds given a chosen input names it in italic, <em>given h = 3/50</em>; a hypothesis read but not machine-checked is named the same way.',
      f: [found('instruments/return-level-atlas/', 'the return-level atlas', 'each claim’s box is a reading of the paper, drawn dotted with the readings one ' + atMoves[0].deg + '° cell in or out; of its ' + numword(AT.claims.length) + ' claims one turns on the reading (' + esc(atK.where) + ': ' + lc(atK.verdict) + ' as drawn, ' + [...new Set(atMoves.map((x) => lc(x.verdict)))].join(' or ') + ' with an edge moved).', '16a2f42e')] },
    { n: 7, re: /^An empty set is/, b: 'An empty set is ∅.',
      t: 'It gets ∅ and a word, never a zero-height bar or a zero.',
      f: [found('instruments/occultation/', 'occultation', 'at face value no convex silhouette fits the chords; the row prints ∅ and the words instead of a bar.', '824b1261')] },
    { n: 8, re: /^Read our own prose against the record/, b: 'Every printed number comes from its record, rounded outward.',
      t: 'The build refuses when a record stops supporting its sentence. A printed bound rounds outward, never truncated: drawn here on the hero’s own enclosure.',
      f: [found('instruments/blind-spot/', 'blind-spot', 'the headline “' + esc(bsQuote) + '” had no record behind it; it now counts the ' + fmt(bsN) + '-pair sample the page rests on.', '4ad79bd3'),
        found('instruments/contours/', 'contours', ct[1] + '/' + ct[2] + ' was printed by cutting digits as ' + ct[3] + '; rounding gives ' + dec(rnd) + '.', '3a072548')] },
    { n: 9, re: /^A legend wherever a w-\* mark is/, b: 'A legend wherever a mark is.',
      t: 'Every page that uses a stroke or underline of the grammar prints its key; ' + m('tools/check-wiring.js') + ' refuses one that does not.',
      f: [found('instruments/shape-hunt/', 'shape-hunt', 'its marks were committed without a legend, and the build refused until it had one.', '824b1261')] },
    { n: 10, re: /never edited/, b: 'A page copied in is never edited.',
      t: 'It changes only through its wrapper, by anchored replacements that each refuse unless their anchor occurs exactly once.',
      f: [found('instruments/affect/', 'affect', 'its script is a copy and stays untouched; every change is a named passage the wrapper replaces.', '4fbb5ad3')] },
  ];
  const RULINGS = [
    { art: 'layout', b: 'A layout placed by a float solver is a chosen picture.',
      t: 'The caption says so once; each mark keeps the standing of what it asserts, so an edge that exists is solid.',
      f: [found('instruments/neural-geometry/', 'neural-geometry', 'its eigenvector map’s ring is dotted as a chosen picture, and its sentence about the controls was corrected.', '17eb3d7c')] },
    { art: 'answer', b: 'A model’s answer is a claim someone made.',
      t: 'It is ' + W.value('computed', W.COMPUTED) + ', dashed, like a number someone printed; on ' + page('instruments/graph/', 'the wiring instruments') + ' its wire is dashed.', f: [] },
  ];
  const MODEL_RULES = [
    { n: 11, re: /^A number that rests on a model names its premises/, b: 'A number that rests on a model names its premises.',
      t: 'In the order the number travelled, each with its grade and record, ending with the weakest.',
      f: [found('swell/', 'Swell', 'every wave limit is exact over a band that reaches the beach through an unvalidated island model; each beach card now says what its number rests on.', '4a1d50b8')] },
    { n: 12, re: /^A grade comes from a record, and a comparison is calibrated first/, b: 'A comparison is calibrated first.',
      t: 'Before a comparison is trusted, the build re-derives it and it must reproduce the published one it stands in for.',
      f: [found('swell/', 'Swell', 'its island model against a Boussinesq model reproduced the published comparison first, with the same probes and tables.', '4a1d50b8')] },
    { n: 13, re: /^The halo/, b: 'The halo.',
      t: 'An extent carried by a model not validated where it is drawn keeps its crisp edges and gains a blur outside them.',
      f: [found('janela/', 'Janela', 'a band borrowed from the nearest measured site, and the wind band, validated nowhere, gained the halo.', 'bea04b72')] },
    { n: 14, re: /^A forecast line is COMPUTED and dashed/, b: 'A forecast is computed and dashed, on canvas too.',
      t: 'A canvas takes the same patterns: ' + m('setLineDash') + ' is given ' + m('G.claim(width)') + '.',
      f: [found('swell/', 'Swell', 'its forecast lines were solid until 28 October; every one is dashed now.', '4a1d50b8')] },
    { n: 15, re: /^A field drawn from a model is a picture of the model/, b: 'A field drawn from a model is a picture of it.',
      t: 'For crests or streamlines, the legend says so once.',
      f: [found('swell/', 'Swell', 'its legend says the crests are a picture of the island model, not a measurement.', '4a1d50b8')] },
    { n: 16, re: /^Where a comparison says the model reads low/, b: 'Where the model reads low, “under the limit” is flagged.',
      t: 'A flag, not a refusal: a refusal would remove an exact statement.',
      f: [found('swell/', 'Swell', swLowTxt + ' read below the Boussinesq model on swells of ' + swLong[1] + ' s and longer; their cards say so.', '4a1d50b8')] },
  ];
  const ruleNums = MARK_RULES.concat(MODEL_RULES);
  const rb = V2.concat(V21);
  guard('the rulebook holds a rule this page does not explain, or has lost one it does (rules 1–16, by number and title)',
    rb.length === ruleNums.length && ruleNums.every((r, i) => rb[i].n === r.n && r.re.test(rb[i].title)),
    rb.map((r) => r.n + ' ' + r.title.slice(0, 30)).join(' | '));
  guard('the rulebook\'s colour law no longer has seven rules', V22.length === 7 && V22.every((r, i) => r.n === i + 1));

  /* the drawings' data: rule 8 on the hero's step [1, 3/2], cut and rounded to two places, exactly */
  const c8 = cells[2], h8 = c8.hi;
  const cut8 = fr(h8[0] * 100n / h8[1], 100n), up8 = fr((h8[0] * 100n + h8[1] - 1n) / h8[1], 100n);
  guard('rule 8\'s drawing stops showing a cut bound inside its record and a rounded one outside', fnum(cut8) < fnum(h8) && fnum(h8) < fnum(up8) && fstr(c8.x0) === '1');
  const d10 = (p) => { const s = (Number(p[0]) / Number(p[1])).toFixed(6).replace(/0+$/, ''); guard('a decimal on rule 8\'s drawing is not exact', feq(fr(BigInt(s.replace('.', '')), 10n ** BigInt(s.split('.')[1].length)), p)); return s; };
  const CHAIN = [{ grade: W.VALIDATED, verified: false, short: 'the open sea and its band' }, { grade: W.COMPARED, verified: false, short: 'the island model' }, { grade: W.ASSUMED, short: 'breaking at ' + SURF.C.GAMMA.toFixed(2) + ' × depth' }];
  const ART = { 8: { hi: fnum(h8), hiStr: fstr(h8) + ' = ' + d10(h8), cut: Number(d10(cut8)), up: Number(d10(up8)) }, 11: CHAIN,
    12: { n: fmt(swR.all.n), r: swR.all.r.toFixed(2), bias: (swR.all.bias >= 0 ? '+' : '') + swR.all.bias.toFixed(2) }, 16: swLow[0][1].medianRatio.toFixed(2) + '×' };
  const ruleCard = (r) => PL.card({ k: r.n ? 'rule ' + r.n : 'ruling · 28 October', title: esc(r.b), art: PL.RULE_ART[r.art || r.n](ART[r.n]), d: r.t, f: r.f.join('') });

  /* ============================================= the issues, then and now ==
     The fixes of 29 October, each counted twice by one rule: on the site as git holds it at FIX^, the commit before
     them, and on the site as it is built now (the census is tools/check-grammar.js marksCensus, the one that gates). */
  const FIX = 'e310e071';
  const gitRaw = (args) => cp.execFileSync('git', ['-C', ROOT].concat(args), { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const fgt = (p, q) => p[0] * q[1] > q[0] * p[1];
  const decS = (s) => { const [i, f = ''] = s.split('.'); return fr(BigInt(i + f), 10n ** BigInt(f.length)); };
  /* the outward fix, in the specimen's pixel rows: before from git, now by the rule the page draws with */
  guard('the specimen frame moved: y is no longer [0, 9/4]', PANEL.y0 === 0 && PANEL.y1 === 2.25);
  const phP = PANEL.h - PANEL.padT - PANEL.padB, fP = CH.frame(Object.assign({ x0: -1, x1: 4 }, PANEL));
  const rowOf = (v) => fsub(fr(PANEL.padT + phP), fdiv(fmul(v, fr(phP)), fr(9, 4)));
  let pageBefore = '';
  try { pageBefore = gitRaw(['show', FIX + '^:site/grammar/index.html']); } catch (e) { /* refused below */ }
  const pb = /<path d="(M108\.8,143\.9H[^"]+)"/.exec(pageBefore);
  guard('git no longer holds the staircase as it was drawn before the outward fix', !!pb);
  const rowsOf = (d) => [d.match(/^M[0-9.]+,([0-9.]+)/)[1]].concat([...d.matchAll(/V([0-9.]+)/g)].map((x) => x[1]));
  const rowOldS = rowsOf(pb[1])[2], rowNewS = away(fP.py(fnum(h8)), -1);
  const rowExact = rowOf(h8), rowOld = decS(rowOldS), rowNew = decS(rowNewS);
  guard('the edge drawn before the fix is not inside its record, or the edge the rule draws today is', fgt(rowOld, rowExact) && !fgt(rowNew, rowExact));
  /* the tones, before (git) and now (warrant.js) */
  let wBefore = '';
  try { wBefore = gitRaw(['show', FIX + '^:playground/warrant.js']); } catch (e) { /* refused below */ }
  const toneIn = (src, k) => { const x = new RegExp('\\.w-' + k + ' \\{ stroke: var\\((--ink(?:-\\d)?)\\); \\}').exec(src); return x ? x[1] : null; };
  const tones = (src) => [[W.DECIDED, 'decided'], [W.COMPUTED, 'computed'], [W.CHOSEN, 'chosen']].map(([s, k]) => { const tok = toneIn(src, k); return { s, k, tok, L: tok ? COL.oklch(T.DARKONLY[tok])[0] : NaN }; });
  const TB = tones(wBefore), TA = tones(W.css());
  const ordered = (tt) => tt[0].L >= tt[1].L && tt[1].L >= tt[2].L;
  guard('the stroke tones before the fix cannot be read from git, were in order after all, or today\'s run against the order', TB.every((x) => x.tok) && !ordered(TB) && ordered(TA));
  /* the site then, extracted from git and measured by the census that gates the site now */
  const walkHtml = (dir) => { const out = []; (function w(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const q = path.join(d, e.name); if (e.isDirectory()) { if (!/machinidae/.test(q)) w(q); } else if (e.name.endsWith('.html')) out.push(q); } })(dir); return out; };
  const tooltipOnly = (dir) => { let n = 0; for (const f of walkHtml(dir)) { const src = fs.readFileSync(f, 'utf8'); const vis = src.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
    for (const x of src.matchAll(/<span\b[^>]*\bclass="[^"]*\bw-val\b[^"]*"[^>]*\btitle="([^"]+)"/g)) { const tt = x[1].replace(/&[a-z#0-9]+;/g, ' ').split(/ — |: /).pop().trim().slice(0, 40); if (tt && !vis.includes(tt)) n++; } } return n; };
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'grammar-then-'));
  let THEN = null, landingThen = '', ethThen = '', hiddenThen = 0;
  try {
    cp.execSync('git archive ' + FIX + '^ -- ' + JSON.stringify(':(glob)site/**/*.html') + ' | tar -x -C ' + JSON.stringify(tmp), { cwd: ROOT, stdio: ['ignore', 'ignore', 'pipe'] });
    THEN = CG.marksCensus(path.join(tmp, 'site'));
    landingThen = fs.readFileSync(path.join(tmp, 'site', 'index.html'), 'utf8');
    ethThen = fs.readFileSync(path.join(tmp, 'site', 'eth', 'index.html'), 'utf8');
    hiddenThen = tooltipOnly(path.join(tmp, 'site'));
  } catch (e) { /* refused below */ } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  guard('the site as git holds it before the fixes cannot be read and counted', !!THEN);
  const NOW = CG.marksCensus();
  const landingNow = read('site/index.html'), ethNow = read('site/eth/index.html'), hiddenNow = tooltipOnly(path.join(ROOT, 'site'));
  const pagesOf = (o) => Object.keys(o).length;
  const dashAnim = (src) => (src.match(/stroke-dashoffset/g) || []).length;
  const ENT = { '&rsquo;': '’', '&ldquo;': '“', '&rdquo;': '”', '&amp;': '&' };
  const firstTile = (src) => { const i = src.indexOf('class="stats"'); const x = /<div class="stat">([\s\S]*?)<\/div>\s*<\/div>/.exec(src.slice(i)); return x ? x[1].split(/<[^>]+>/).map((s) => s.replace(/&[a-z]+;/g, (e) => ENT[e] || ' ').trim()).filter(Boolean) : null; };
  guard('a fixed issue no longer reads as fixed (the census then and now disagree with the page)',
    THEN.unstanding > NOW.unstanding && THEN.dashedBorders > NOW.dashedBorders && THEN.chipWordsMulti.length > 0 && NOW.chipWordsMulti.length === 0);
  guard('the landing animated a dash before the fix, or animates one now', dashAnim(landingThen) >= 1 && dashAnim(landingNow) === 0);
  const eth0 = firstTile(ethThen), eth1 = firstTile(ethNow);
  guard('/eth/\'s first tile is not where the page says it was or is', !!eth0 && !!eth1 && eth0.some((s) => /CERTIFIED/.test(s)) && eth1.some((s) => /not decided here/.test(s)));
  const wrap = (s, n) => { const out = []; let cur = ''; for (const w of s.split(' ')) { if ((cur + ' ' + w).trim().length > n) { out.push(cur.trim()); cur = w; } else cur += ' ' + w; } if (cur.trim()) out.push(cur.trim()); return out; };
  const tileOf = (tl) => ({ k: tl[0], lines: [tl[1]].concat(wrap(tl.slice(2).join(' '), 24)).slice(0, 3) });
  /* the ink of each pattern at each width: [on, off] inks on/(on+off) with butt caps, (on + w)/(on+off) with round caps of width w */
  const pat = (s) => s.split(/\s+/).map(Number);
  const inkC = (w) => { const [on, off] = pat(w < G.SMALL_BELOW ? G.CLAIM_SM : G.CLAIM); return on / (on + off); };
  const inkP = (w) => { const [on, off] = pat(w < G.SMALL_BELOW ? G.PICK_SM : G.PICK); return Math.min(1, (on + w) / (on + off)); };
  const legendW = Number((/stroke-width="([0-9.]+)"/.exec(W.legendHtml()) || [0, NaN])[1]);
  guard('at the legend\'s own width the dotted line no longer inks more than the dashed one (the open issue would be closed)', inkP(legendW) > inkC(legendW));
  const ISSUES = [
    { k: commit(FIX), title: 'The tone ran against the order', art: PL.tonesArt(TB, TA),
      d: 'A chosen stroke was drawn brighter than a computed one, so the weaker standing read stronger. Lightness now falls with standing, asserted by a battery from the tokens.' },
    { k: commit(FIX), title: 'An edge drawn inside its record', art: PL.outwardArt({ rowExact: fnum(rowExact), rowOld: fnum(rowOld), rowNew: fnum(rowNew), r0: fnum(rowNew) - 0.04, r1: fnum(rowOld) + 0.04,
      labels: { now: 'now: ' + fstr(fsub(rowExact, rowNew)) + ' px outside', exact: 'the record', old: 'before: ' + fstr(fsub(rowOld, rowExact)) + ' px inside', foot: 'the top of the step [1, 3/2], magnified' } }),
      d: 'The staircase’s top was written to the nearest tenth of a pixel and sat ' + fstr(fsub(rowOld, rowExact)) + ' of a pixel inside its record. Every edge now rounds outward, and the build refuses one drawn inside.' },
    { k: commit(FIX), title: 'Dashes with no standing', art: PL.pairsArt([{ k: 'dashed marks with no standing', then: THEN.unstanding, now: NOW.unstanding }, { k: 'pages carrying one', then: pagesOf(THEN.where.unstanding), now: pagesOf(NOW.where.unstanding) }], 'Dashed marks with no standing, before the fix and now, and the pages carrying them.'),
      d: 'The chart kit took a plain “dashed” switch; it takes a standing now, and the census counts what is left, which may only shrink.' },
    { k: commit(FIX), title: 'A verdict word in two chip shapes', art: PL.pairsArt([{ k: 'dashed chip borders', then: THEN.dashedBorders, now: NOW.dashedBorders }, { k: 'verdict words in two shapes', then: THEN.chipWordsMulti.length, now: NOW.chipWordsMulti.length }], 'Dashed borders and verdict words worn in more than one chip shape, before the fix and now.'),
      d: 'A dash is a standing, so no chip wears one, and each verdict word has one shape site-wide.' },
    { k: commit(FIX), title: 'A first tile that said the opposite', art: PL.tileArt(tileOf(eth0), tileOf(eth1)),
      d: 'The ETH report’s first tile read CERTIFIED where the page does not decide that ETH is false. It says so now.' },
    { k: commit(FIX), title: 'Motion in the standing channel', art: PL.pairsArt([{ k: 'dash animations on the landing', then: dashAnim(landingThen), now: dashAnim(landingNow) }], 'Dash-offset animations on the landing, before and now.'),
      d: 'The landing’s flow animated a dash offset: decoration in the channel that carries standing. It is a moving point now.' },
    { k: 'partly fixed', title: 'Standings typed by hand', art: PL.pairsArt([{ k: 'values with a record address', then: THEN.pointed, now: NOW.pointed }, { k: 'values without one', then: THEN.unpointed, now: NOW.unpointed }], 'Printed values with and without a record address, before and now.'),
      d: 'A number’s standing was written where it was printed. A number can now be printed from its record through an address, and a gate re-reads it from the built page; most still have none.' },
    { k: 'open', title: 'A reason only in a tooltip', art: PL.pairsArt([{ k: 'reasons shown only on hover', then: hiddenThen, now: hiddenNow }], 'Value reasons shown only as a tooltip, before and now.'),
      d: 'A value’s reason (“measured, not decided”) is often a hover title: invisible on a phone. It should be visible text.' },
    { k: 'open', title: 'The dotted line inks more than the dashed one', art: PL.inkArt({ inkC, inkP, small: G.SMALL_BELOW, legendW }),
      d: 'At the legend’s ' + legendW + ' px, the chosen pattern inks ' + inkP(legendW).toFixed(2) + ' of its length and the computed one ' + inkC(legendW).toFixed(2) + ': the weaker standing carries more ink. The tone carries the order since the fix above; whether density should too is open.' },
  ];
  /* the candidate rules: what they say, the check that would enforce each, and the status this build decides */
  const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
  const grepCount = (re, dirs) => { let n = 0; for (const d of dirs) { const walkJs = (q) => { for (const e of fs.readdirSync(q, { withFileTypes: true })) { const z = path.join(q, e.name); if (e.isDirectory()) { if (!/node_modules|\.venv|out$/.test(z)) walkJs(z); } else if (e.name.endsWith('.js')) n += (fs.readFileSync(z, 'utf8').match(re) || []).length; } }; walkJs(path.join(ROOT, d)); } return n; };
  const heroPages = walkHtml(path.join(ROOT, 'site')).filter((f) => /\sdata-hero[\s>]/.test(fs.readFileSync(f, 'utf8'))).length;
  const excludes = grepCount(/legendHtml\(\{[^}]*exclude/g, ['tools', 'apps', 'playground']);
  const r20 = /^\s+ok\s+\d+\s+every legend is derived/m.test(wiring);
  const r28 = /RED ok\s+a refused point in a line is drawn as a void/.test(wiring) && /RED ok\s+a refused bar keeps its row/.test(wiring);
  const recCaptions = walkHtml(path.join(ROOT, 'site')).reduce((n, f) => n + (fs.readFileSync(f, 'utf8').match(/<figcaption[^>]*\sdata-record=/g) || []).length, 0);
  const CANDIDATES = [
    ['R17', 'A number’s standing is read from a typed value carrying its record’s address.', NOW.unpointed ? 'partial' : 'gated', fmt(NOW.pointed) + ' values carry an address; ' + fmt(NOW.unpointed) + ' do not'],
    ['R18', 'Every channel the standing scale uses is monotone in it, or constant.', ordered(TA) ? 'gated' : 'open', 'tone falls with standing; a battery asserts it'],
    ['R19', 'Pixels round outward, and a figure prints the smallest difference it can show.', 'partial', 'refused on this page’s enclosure; not yet in the chart kit'],
    ['R20', 'The legend is derived from the figure, never declared.', r20 ? 'gated' : 'open', r20 ? 'every legend derived from its page, figure or drawing code; tools/check-wiring.js refuses an exclude list or an item for a standing not drawn' : excludes + ' calls still tell the legend what to leave out'],
    ['R21', 'A dash is a standing everywhere: strokes, borders, motion.', NOW.unstanding || NOW.dashedBorders ? 'partial' : 'gated', fmt(NOW.unstanding) + ' unclassed dashes and ' + fmt(NOW.dashedBorders) + ' dashed borders left'],
    ['R22', 'A mark’s reason is visible text, never only a tooltip.', hiddenNow ? 'open' : 'gated', fmt(hiddenNow) + ' reasons live only in a tooltip'],
    ['R23', 'A figure names its record and its digest on itself.', recCaptions ? 'partial' : 'open', recCaptions ? recCaptions + ' captions name their record' : 'no caption names its record yet'],
    ['R24', 'A page’s standing is computed by its builder, never typed.', typeof W.pageStanding === 'function' ? 'partial' : 'open', 'not built'],
    ['R25', 'A frame is a page: standing never tweens, a value never travels.', exists('tools/check-frames.js') ? 'gated' : 'open', 'no gate yet'],
    ['R26', 'A chosen input is a handle, and a drag is a test.', exists('playground/return-level-check/drive.js') ? 'partial' : 'open', 'one instrument: the return-level check’s design height'],
    ['R27', 'A premise grade is a pair: whether the code was verified, and how far it was validated.', typeof W.pairWord === 'function' ? 'partial' : 'open', 'on Swell and on this page; other chains as they are next edited'],
    ['R28', 'A witness is an event, and a void has a size.', heroPages && r28 ? 'gated' : heroPages ? 'partial' : 'open', heroPages + ' pages declare a hero, each × first; the chart kit draws a refused value as a void its own size' + (r28 ? '' : ' (not yet)')],
    ['R29', 'The registry is one machine-readable file, copied by digest into every sibling.', exists('design/warrant/registry.json') ? 'gated' : 'open', 'the five patterns still live in several copies'],
    ['R30', 'A figure carries the sentence that would stop it.', 'open', 'not built'],
    ['R31', 'A conformance suite, and the checks as a package.', exists('kits/warrant-check') ? 'partial' : 'open', 'the red controls are its seed'],
  ];
  const nState = (st) => CANDIDATES.filter((r) => r[2] === st).length;

  /* ========================================================= the colours, drawn == */
  const hexOf = (s) => (/#[0-9a-f]{6}/i.exec(s) || [null])[0];
  const regBy = (kind, where) => reg.filter((r) => r[1] === kind && (!where || where.test(r[3])));
  const idRows = regBy('identity');
  const ordRow = regBy('order')[0];
  guard('the registered colours no longer hold two identity hues and a print hue, and one ordered scale of three', idRows.length === 3 && !!ordRow && (ordRow[0].match(/#[0-9a-f]{6}/gi) || []).length === 3);
  const VARS = {};
  const vOf = (name, hex) => { VARS['--gx-' + name] = hex; return '--gx-' + name; };
  const identity = idRows.map((r, i) => ({ v: vOf('id' + i, hexOf(r[0])), word: r[2].split(/ \(|,| compared/)[0].replace(/^the /, '') + ' · ' + (/print/.test(r[3]) ? 'print only' : r[3]) }));
  const ordWords = ordRow[2].split(':').pop().split('·').map((s) => s.trim());
  const order = (ordRow[0].match(/#[0-9a-f]{6}/gi)).map((h, i) => ({ v: vOf('or' + i, h), word: ordWords[i] }));
  const stWords = /allowed · refused by the rule · undetermined/.exec(reg.find((r) => r[1] === 'status')[2]);
  guard('the apps\' status row no longer names allowed, refused by the rule and undetermined', !!stWords);
  ['--v-cert', '--v-refu', '--v-refd'].forEach((k) => { VARS[k] = APP.APP_DARK[k]; });
  const status = [{ v: '--v-cert', icon: '✓', word: 'allowed' }, { v: '--v-refu', icon: '×', word: 'refused by the rule' }, { v: '--v-refd', icon: '?', word: 'undetermined' }];
  /* the validator: the pair that failed and the pair that replaced it, as most see them and as a deuteranope does */
  const pairB = /lineage (#[0-9a-f]{6}) and rules (#[0-9a-f]{6}), read ΔE ([0-9.]+) apart/i.exec(RB);
  guard('the rulebook no longer names the pair that read the same to a deuteranope', !!pairB);
  const pairA = [hexOf(idRows[0][0]), hexOf(idRows[1][0])];
  const lin2hex = (rgb) => '#' + rgb.map((c) => { const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; return Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0'); }).join('');
  const vpair = (tag, hx) => ({ normal: hx.map((h, i) => vOf(tag + i, h)), deutan: hx.map((h, i) => vOf(tag + 'd' + i, lin2hex(COL.simulate(h, 'deutan')))),
    dE: { normal: COL.deltaE(hx[0], hx[1]), deutan: COL.deltaE(hx[0], hx[1], 'deutan') } });
  const VB = vpair('b', [pairB[1], pairB[2]]), VA = vpair('a', pairA);
  const cvdMin = Number(thr[1]);
  guard('the validator no longer reproduces the rulebook\'s ΔE for the failed pair, or the pair that replaced it fails', VB.dE.deutan.toFixed(1) === pairB[3] && VA.dE.deutan >= cvdMin && VA.dE.normal >= Number(thr[2]));
  VB.words = pairB[1] + ' · ' + pairB[2]; VA.words = pairA.join(' · ');
  VB.d = 'Distinct to most readers (ΔE ' + VB.dE.normal.toFixed(1) + '), one colour to a deuteranope (ΔE ' + VB.dE.deutan.toFixed(1) + '). A third hue between them in the list hid it: the validator checks every pair.';
  VA.d = 'Re-stepped: ΔE ' + VA.dE.deutan.toFixed(1) + ' for a deuteranope, ' + VA.dE.normal.toFixed(1) + ' for most. The threshold is ' + cvdMin + ' for every simulated deficiency and ' + thr[2] + ' for normal vision.';
  const RAMP = ['--ink', '--ink-2', '--ink-3', '--ink-4', '--ink-5'].map((tok) => ({ tok, L: COL.oklch(T.DARKONLY[tok])[0] }));
  const contrastW = COL.contrast(witnessHex, T.DARKONLY['--paper']);

  /* =========================================================== the page == */
  const B_ = [];
  B_.push(C.header({ eyebrow: 'Carlos Toledo · the visual grammar', title: 'What each mark rests on',
    deck: 'WARRANT is the grammar every figure, table and number on this site is drawn in. A stroke says what a mark rests on: an exact decision, floating point, a choice, or nothing. A verdict is always a word.' }));
  B_.push(heroFig);

  /* §1 the four marks */
  const MARK_T = { [W.DECIDED]: 'Solid', [W.COMPUTED]: 'Dashed', [W.CHOSEN]: 'Dotted', [W.REFUSED]: 'Nothing' };
  const MARK_D = {
    [W.DECIDED]: 'An exact decision backs it: an interval enclosure, an exact rational comparison, a proof.',
    [W.COMPUTED]: 'Floating point, a solver stopped at a tolerance, a fit, a forecast, a number someone printed. It may be right; nothing decided it.',
    [W.CHOSEN]: 'One member of a set the data admit, picked by something that is not the data: a tie-break, a default, a seed, an interpolation.',
    [W.REFUSED]: 'The instrument declined or the input is missing. Never bridged, never averaged, never drawn as zero.' };
  const MARK_SPEC = { [W.DECIDED]: 'stroke solid · text plain', [W.COMPUTED]: 'stroke ' + G.CLAIM + ', ' + G.CLAIM_SM + ' under ' + G.SMALL_BELOW + ' px · text dashed underline',
    [W.CHOSEN]: 'stroke ' + G.PICK + ' round, ' + G.PICK_SM + ' under ' + G.SMALL_BELOW + ' px · text dotted underline', [W.REFUSED]: 'no stroke; a hatched void · text the word' };
  const MARK_EX = { [W.DECIDED]: '√(1/4) = ' + W.value('1/2', W.DECIDED), [W.COMPUTED]: 'Math.sqrt(2) = ' + W.value(String(Math.sqrt(2)), W.COMPUTED),
    [W.CHOSEN]: 'the segment at 1/2: ' + W.value(fstr(WY), W.CHOSEN), [W.REFUSED]: '√(−1): ' + W.value('refused', W.REFUSED) };
  B_.push(C.section({ lab: 'the marks', title: 'Four standings, four strokes', id: 'marks', wide: true,
    bodyRaw: '<div class="col">' + C.p('Every mark has one standing, and each standing one stroke on a line and one underline in text. Drawn by the module as this page is built:') + '</div>'
      + PL.grid(4, [W.DECIDED, W.COMPUTED, W.CHOSEN, W.REFUSED].map((s) => PL.card({ k: esc(W.NAME[s].toLowerCase()), title: MARK_T[s], art: PL.markArt(s), d: MARK_D[s], code: MARK_EX[s] + '<br>' + esc(MARK_SPEC[s]) })))
      + '<h3 class="gr-h3">The weakest on the path wins</h3>'
      + '<div class="col">' + C.p('The standings are ordered, and a mark takes the weakest standing on its path to the pixel: one float makes it computed, one choice makes it chosen, one refusal leaves the void. Standing is not a confidence: a value known to many decimals can be undecided.') + '</div>'
      + PL.ladderOfStandings() }));

  /* §2 the components */
  const vEx = W.val({ rec: { path: 'certs/eth-kernel.json', ptr: '/counts/decided' }, standing: W.DECIDED, fmt: 'int', why: 'the record\'s count of decided claims' });
  const chipsAll = ['CERTIFIED', 'WITNESSED', 'REFUTED', 'PARTIAL', 'REFUSED', 'NEEDS DATA'].map((w) => C.tag(w)).join(' ');
  const wxSvg = PL.svg(260, 70, 'The witness in a figure: a red cross on the object, drawn at the figure\'s scale.', [PL.line(14, 62, 246, 30, W.attrs(W.DECIDED, { width: 2 })), W.witnessMark(120, 36, { size: 9, width: 3 }), PL.t(136, 24, 'the object that broke it', 't-ax')].join('\n'));
  const COMPONENTS = [
    PL.card({ k: 'a number in text', d: '<div class="gx-vals"><span>' + W.value('1/2', W.DECIDED) + '<em>decided</em></span><span>' + W.value('1.4142', W.COMPUTED) + '<em>computed</em></span><span>' + W.value('2/3', W.CHOSEN) + '<em>chosen</em></span><span>' + W.value('refused', W.REFUSED) + '<em>refused</em></span></div>', code: esc("W.value('1.4142', W.COMPUTED)") }),
    PL.card({ k: 'a verdict word', d: '<div class="gx-chips">' + chipsAll + '</div>One shape per word, everywhere; the word carries the verdict, never a stroke.', code: esc("C.tag('REFUTED')") }),
    PL.card({ k: 'the witness', art: wxSvg, d: 'In text, beside the words that name it ' + W.witness('the exhibited counterexample') + '; in a figure, on the object, at the figure’s scale.', code: esc('W.witnessMark(x, y, { size, width })') }),
    PL.card({ k: 'the legend', d: W.legendHtml({ compact: true }), code: esc('W.legendHtml({ compact: true })') }),
    PL.card({ k: 'a grade', d: '<div class="gx-grades">' + [W.VALIDATED, W.COMPARED, W.VERIFIED, W.ASSUMED].map((g) => W.grade(g)).join('') + '</div>How far a premise was checked: a word first, a three-step glyph second, never a colour.', code: esc('W.grade(W.COMPARED)') }),
    PL.card({ k: 'a number with its address', d: '<div class="gx-big-v">' + vEx + ' <span class="gx-unit">of 2 ETH proofs decided</span></div>The span carries its record’s address, and ' + m('tools/check-marks.js') + ' re-reads it from the built page at every build.', code: esc('data-rec="certs/eth-kernel.json#/counts/decided"') }),
    PL.card({ k: 'mood', d: '<div class="gx-mood-h">' + C.tag('HOLDS', 'held') + ' <em>given h = 3/50</em></div>A verdict over a chosen input names the input, in italic.', code: esc('<em>given h = 3/50</em>') }),
    PL.card({ k: 'the empty set', d: '<div class="gx-empty">∅</div>No convex silhouette fits the chords at face value: the set is empty, and it says so.', code: esc('∅ + a word, never a bar') }),
    PL.card({ k: 'a premise chain', d: W.premisesHtml([{ grade: W.COMPARED, verified: false, label: 'The island model', evidence: 'beside a Boussinesq model.' }, { grade: W.ASSUMED, label: 'Breaking', evidence: 'from the literature.' }], { meetLine: 'The weakest premise is <b>assumed</b>.' }), code: esc('W.premisesHtml([...], { meetLine })') }),
  ];
  B_.push(C.section({ lab: 'the components', title: 'The parts, as the module draws them', id: 'components', wide: true,
    bodyRaw: '<div class="col">' + C.pRaw('Each part below is live: drawn by ' + a(blob('playground/warrant.js'), 'playground/warrant.js') + ' or ' + a(blob('design/components.js'), 'design/components.js') + ' when this page is built, with the call that draws it.') + '</div>'
      + PL.grid(3, COMPONENTS) }));

  /* §3 the rules */
  B_.push(C.section({ lab: 'the rules', title: numword(ruleNums.length).charAt(0).toUpperCase() + numword(ruleNums.length).slice(1) + ' rules, each drawn', id: 'rules', wide: true,
    bodyRaw: '<div class="col">' + C.pRaw('From ' + a(blob('design/WARRANT.md'), 'the rulebook') + ' (' + esc(frozen[1]) + ', frozen ' + esc(day(frozen[2])) + ' ' + esc(frozen[2].slice(0, 4)) + ', with dated rulings since). Each was learned on a page of this site that broke it; each card names the page and the fix.') + '</div>'
      + '<h3 class="gr-h3">Marks</h3>' + PL.grid(3, MARK_RULES.map(ruleCard))
      + '<h3 class="gr-h3">Two rulings</h3>' + PL.grid(3, RULINGS.map(ruleCard))
      + '<h3 class="gr-h3">Numbers that rest on a model</h3>' + PL.grid(3, MODEL_RULES.map(ruleCard)) }));

  /* §4 the colour law */
  const LAWS = [['Ink first.', 'Every figure reads in greyscale; a colour comes with a shape and a word.'], ['One colour, one meaning,', 'in every project on the grammar, each registered with its date.'],
    ['Colour never carries standing.', 'The stroke does; nor does it stand in for a verdict word.'], ['Four kinds only:', 'the witness, identity, order, status.'],
    ['Every pair passes the validator,', 'on the figure’s own ground, for every simulated deficiency.'], ['No yellow, no orange.', ''], ['A new colour needs the report and an approval,', 'recorded in the rulebook.']];
  B_.push(C.section({ lab: 'the colour law', title: 'Ink first, and one red', id: 'colour', wide: true,
    bodyRaw: '<div class="col">' + C.p('The law came from a measurement: a sibling project’s two main series colours, run through the validator, were one colour to a deuteranope. Seven rules:') + '</div>'
      + '<ol class="gx-laws">' + LAWS.map(([b, tt]) => '<li><b>' + esc(b) + '</b> ' + esc(tt) + '</li>').join('') + '</ol>'
      + '<h3 class="gr-h3">Ink first: lightness falls with standing</h3>'
      + PL.grid(2, [PL.card({ k: 'the ink ramp', art: PL.inkRamp({ ramp: RAMP, tones: { decided: TA[0].tok, computed: TA[1].tok, chosen: TA[2].tok } }), d: 'Five greys, OKLab lightness under each. The strokes take them in order of standing, so a copy in greyscale loses nothing.' }),
        PL.card({ k: 'the one red', art: PL.svg(340, 140, 'The witness red as a cross on a dark ground, with its contrast.', [W.witnessMark(70, 70, { size: 26, width: 7 }), PL.t(130, 62, m('').replace(/<[^>]+>/g, '') + '--witness ' + witnessHex, 't-lab'), PL.t(130, 82, contrastW.toFixed(1) + ':1 on the page ground', 't-ax'), PL.t(130, 102, 'a shown counterexample, only', 't-ax')].join('\n')),
          d: 'Until 29 October the apps carried a second red for a refused state, ΔE about ' + esc(de4[1]) + ' from this one: one red to the eye with two meanings. It is folded: the apps’ refused state reads this token, with its meaning.' })])
      + '<h3 class="gr-h3">Four kinds of colour</h3>' + PL.kindsOfColour({ contrast: contrastW, identity, order, status })
      + '<h3 class="gr-h3">Every pair passes the validator</h3>'
      + '<div class="col">' + C.p('OKLab ΔE × 100, every pair that shares a figure, under the colour-vision model of Machado, Oliveira and Fernandes (2009), computed as this page is built:') + '</div>'
      + PL.validatorPlate({ before: VB, after: VA, threshold: cvdMin })
      + '<details class="more"><summary>The registered colours</summary>' + C.plainList(reg.map((r) => ({ raw: '<b>' + cell(r[0]) + '</b> · ' + esc(r[1]) + ' — ' + cell(r[2]) + '. <em>Where:</em> ' + cell(r[3]) + '. <em>Approved:</em> ' + cell(r[4]) + '.' }))) + '</details>' }));

  /* §5 the premise ladder */
  const LADDER_LIT = {
    [W.VALIDATED]: ['validation', 'the open sea’s band, against satellite passes it had not seen'],
    [W.COMPARED]: ['code-to-code comparison', 'the island model, against a Boussinesq model at ' + numword(SW.beaches) + ' beaches'],
    [W.VERIFIED]: ['code verification', 'none yet'],
    [W.ASSUMED]: ['an adopted assumption', 'breaking at ' + SURF.C.GAMMA.toFixed(2) + ' times the depth (Thornton & Guza, 1982), and no sandbars'],
  };
  B_.push(C.section({ lab: 'the premise ladder', title: 'How far a premise was checked', id: 'ladder', wide: true,
    bodyRaw: '<div class="col">' + C.p('Standing says how a number was computed. A number that rests on a physical model needs a second answer: the arithmetic can be exact while its equations never met the thing they describe. Each premise carries a grade, where its checking stopped, and a conclusion is as checked as its weakest premise.') + '</div>'
      + PL.grid(2, [PL.card({ k: 'the ladder, with a wave limit on Swell', art: PL.premiseLadder(CHAIN.concat([])), d: 'The verification-and-validation ladder of Roache (1998), Oberkampf and Roy (2010) and ASME V&amp;V 20 (2009), cut to ' + numword(W.GRADE.length) + ' grades a reader can tell apart. Never a probability, never a confidence.' }),
        PL.card({ k: 'the same chain, as the page prints it', d: W.premisesHtml([
          { grade: W.VALIDATED, verified: false, label: 'The open sea and its band', evidence: 'covered ' + (100 * swU.coverage).toFixed(1) + '% of ' + fmt(swU.n) + ' satellite passes it had not seen; it claims ' + claimIn + ' in ' + missQ[1] + '.' },
          { grade: W.COMPARED, verified: false, label: 'The island model', evidence: 'beside a Boussinesq model at ' + numword(SW.beaches) + ' beaches, ' + fmt(swR.all.n) + ' cases of a ' + swH[1] + ' m swell: r ' + swR.all.r.toFixed(2) + ', the island ' + swR.all.bias.toFixed(2) + ' m higher on average.' },
          { grade: W.ASSUMED, label: 'Breaking', evidence: 'at ' + SURF.C.GAMMA.toFixed(2) + ' times the depth (Thornton & Guza, 1982); no sandbars; the shallow profile from the nautical chart.' },
        ], { meetLine: 'The arithmetic is exact; the weakest premise is <b>' + esc(W.pairWord(W.weakestPair([{ grade: W.VALIDATED, verified: false }, { grade: W.COMPARED, verified: false }, { grade: W.ASSUMED }]))) + '</b>, and neither model was verified against an exact solution of its own equations.' }) })])
      + '<div class="col">' + C.plainList([W.VALIDATED, W.COMPARED, W.VERIFIED, W.ASSUMED].map((g) => ({ raw: W.grade(g) + ' — ' + esc(W.GRADE_GLOSS[g]) + '. <em>On Swell:</em> ' + esc(LADDER_LIT[g][1]) + '.' })))
      + C.pRaw('<b>A read step</b> — a proof step read and not run by a machine — gets no grade of its own: it is ' + W.grade(W.ASSUMED) + '. It never caps a verdict; it is listed in what the page rests on. ' + page('reports/delta3.html', 'δ₃ = 117/2192') + ' is an example: a decided finite core, and three steps proved on paper and read.')
      + '<details class="more"><summary>References</summary>' + C.plainList([
        { text: 'Roache, P. J. (1998). Verification and Validation in Computational Science and Engineering. Hermosa Publishers.' },
        { text: 'Oberkampf, W. L., & Roy, C. J. (2010). Verification and Validation in Scientific Computing. Cambridge University Press.' },
        { text: 'ASME V&V 20-2009. Standard for Verification and Validation in Computational Fluid Dynamics and Heat Transfer. The American Society of Mechanical Engineers.' },
        { text: 'MacEachren, A. M., Roth, R. E., O’Brien, J., Li, B., Swingley, D., & Gahegan, M. (2012). Visual semiotics & uncertainty visualization: an empirical study. IEEE Transactions on Visualization and Computer Graphics, 18(12), 2496–2505.' },
        { text: 'Machado, G. M., Oliveira, M. M., & Fernandes, L. A. F. (2009). A physiologically-based model for simulation of color vision deficiency. IEEE Transactions on Visualization and Computer Graphics, 15(6), 1291–1298.' },
        { text: 'Thornton, E. B., & Guza, R. T. (1982). Energy saturation and phase speeds measured on a natural beach. Journal of Geophysical Research, 87(C12), 9499–9508.' },
      ]) + '</details></div>' }));

  /* §6 issues and their fixes */
  B_.push(C.section({ lab: 'issues and fixes', title: 'Where the site broke its own grammar', id: 'issues', wide: true,
    bodyRaw: '<div class="col">' + C.p('Each issue is a fact about the built site. Where a count moved, it is counted twice by the same rule: on the site as it was just before the fix, and on the site as built now.') + '</div>'
      + PL.grid(3, ISSUES.map((x) => PL.card({ k: x.k, title: esc(x.title), art: x.art, d: x.d }))) }));

  /* §7 the law and the rules in progress */
  const AXIOMS = [
    ['A1', 'Soundness', 'Drawing maps a record to marks; reading maps marks back to the records that could have produced them. A page is sound when every record it draws is among them: no mark stronger than its record, in standing, extent or verdict word.'],
    ['A2', 'Completeness', 'Every row of the record a page draws from is a mark, or the empty set with a word.'],
    ['A3', 'Outward', 'A lower end rounds down and an upper end up, in digits and in pixels, at the resolution the figure declares.'],
    ['A4', 'A scale with a guide', 'Four standings onto five strokes, the legend derived from the scale; every channel it uses is monotone in it, or constant.'],
    ['A5', 'A typed value', 'A value carries its datum, its standing, its premises and its record’s address; the arithmetic demotes it and the renderer only reads it.'],
    ['A6', 'A frame is a page', 'In motion every frame obeys A1; a standing never tweens and a value never travels.'],
  ];
  B_.push(C.section({ lab: 'the foundations', title: 'One law, six axioms', id: 'axioms', wide: true,
    bodyRaw: '<div class="col">' + C.p('The display is a sound map of the record, and the build decides it.') + '</div>'
      + PL.grid(3, AXIOMS.map(([n, tt, d]) => PL.card({ k: n, title: esc(tt), d: esc(d) })))
      + '<h3 class="gr-h3">Rules in progress</h3>'
      + '<div class="col">' + C.p('A rule enters the rulebook when a check exists that refuses a page breaking it; until then it binds new work. The status is decided by this page’s build: ' + nState('gated') + ' gated, ' + nState('partial') + ' partly, ' + nState('open') + ' open.') + '</div>'
      + '<div class="wide"><div class="tw"><table><thead><tr><th>rule</th><th>what it says</th><th>status</th></tr></thead><tbody>'
      + CANDIDATES.map(([n, say, st, note]) => '<tr><td class="mono">' + n + '</td><td>' + esc(say) + '</td><td><span class="gx-st">' + st + '</span><br><span class="gx-note">' + esc(note) + '</span></td></tr>').join('')
      + '</tbody></table></div></div>' }));

  /* §8 how it is enforced */
  const STAND = { [G.CLAIM]: 'computed', [G.CLAIM_SM]: 'computed, thin', [G.PICK]: 'chosen', [G.PICK_SM]: 'chosen, thin', [G.GUIDE]: 'a guide' };
  const CHECKS = [
    { raw: '<b>' + a(blob('tools/check-grammar.js'), 'check-grammar') + '</b> — only the ' + numword(G.PERMITTED.length) + ' patterns may appear; ' + numword(exempt) + ' uses that are not lines are declared by name, each with its reason. The first census, on 5 September, counted twenty-five: the dash had been derived from the stroke width, one carrying ' + m('1.04 5.460000000000001') + ' into published HTML.' },
    { raw: '<b>' + a(blob('tools/check-marks.js'), 'check-marks') + '</b> — a value printed through ' + m('W.val') + ' carries its record’s address; every build follows it back and prints the datum again by the same rule (' + a(blob('design/record.js'), 'design/record.js') + '). Four planted marks are refused on every run.' },
    { raw: '<b>' + a(blob('tools/check-wiring.js'), 'check-wiring') + '</b> — a page with a mark of the grammar and no legend is refused; one hero per page, its × first and at weight.' },
    { raw: '<b>' + a(blob('tools/check-render.js'), 'check-render') + '</b> — no leaked template text, no paint that does not resolve, no figure thinner in ink than its record, no script error. Its paint check went strict when a legend swatch fell through to black on a near-black ground and passed every run.' },
    { raw: '<b>' + a(blob('tools/check-measure.js'), 'check-measure') + '</b> — every page driven in Chrome at ' + vps.join(', ') + ' px; left edges, overflow, escapes and clipped elements may only go down.' },
  ];
  B_.push(C.section({ lab: 'how it is enforced', title: 'A grammar no build checks is a suggestion', id: 'enforced', wide: true,
    bodyRaw: C.stats([
        { k: 'dash patterns', v: String(G.PERMITTED.length), n: 'twenty-five on 5 September; ' + fmt(Number(ctot[2])) + ' conforming uses, ' + fmt(Number(ctot[3])) + ' outside' },
        { k: 'numbers re-read', v: fmt(Number(mk[1])), n: 'on ' + fmt(Number(mk[2])) + ' pages; ' + fmt(Number(unp[1])) + ' still carry no address' },
        { k: 'pages that draw it', v: fmt(Number(leg[2])), n: 'every one prints its legend; ' + fmt(Number(leg[3])) + ' pages walked' },
        { k: 'figures recorded', v: fmt(Object.keys(RBL.figures).length), n: 'none may get thinner in ink' },
        { k: 'pages measured', v: fmt(Object.keys(MB.pages).length), n: 'at ' + vps.join(' and ') + ' px' },
        { k: 'red controls', v: 'every run', n: 'planted violations each check must catch' },
      ])
      + PL.grid(2, [PL.card({ k: 'the dash census', art: PL.censusArt({ uses: Object.fromEntries(G.PERMITTED.map((p) => [p, uses[p]])), labels: STAND }), d: 'Uses of each permitted pattern on the built site, at the last sync.' }),
        PL.card({ k: 'the checks', d: C.plainList(CHECKS) })])
      + '<div class="col">' + C.p('This page is held to the same standard by its own builder, which reads every number on it from its record and refuses to build when one stops saying what the page says.')
      + '<details class="more"><summary>This page refuses to build if …</summary>' + '%%GUARDS%%' + '</details></div>' }));

  /* §9 use it */
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
    '// the legend beside a figure, the stylesheet once per page',
    'W.legendHtml({ compact: true })',
    'W.css()',
  ].join('\n');
  guard('the code sample shows a call whose output is not what the module returns', /stroke-dasharray="5 4"/.test(ex1) && /w-chosen/.test(ex2) && /stroke-dasharray="1 3"/.test(ex2) && /w-computed/.test(ex3));
  B_.push(C.section({ lab: 'use it', title: 'In figures of your own', id: 'use', wide: true,
    bodyRaw: '<div class="col">' + C.pRaw('One file, ' + a(blob('playground/warrant.js'), 'playground/warrant.js') + ', MIT, with the ' + numword(G.PERMITTED.length) + ' patterns in ' + a(blob('design/grammar.js'), 'design/grammar.js') + '; no library. What each call returns as this page was built:')
      + C.code(CODE)
      + C.pRaw('On a canvas, ' + m('setLineDash') + ' takes the same patterns: ' + m('G.dash.claim') + ' is ' + m('[' + G.dash.claim.join(', ') + ']') + ' and ' + m('G.dash.pick') + ' is ' + m('[' + G.dash.pick.join(', ') + ']') + '. '
        + 'The legend and the ladder in Portuguese — ' + WPT.GRADE.map((g) => '<em>' + esc(g) + '</em>').join(', ') + ' — are in ' + a(blob('playground/warrant-pt.js'), 'playground/warrant-pt.js') + '.') + '</div>' }));

  const body = B_.join('\n\n').replace('%%GUARDS%%', () => C.plainList(GUARDS.map((g) => ({ text: '… ' + g + '.' }))));
  const head = (() => { try { return git(['rev-parse', '--short', 'HEAD']); } catch (e) { return 'unknown'; } })();
  const foot = '<p>Built from playground/warrant.js, design/grammar.js, design/WARRANT.md, design/colour.js and the records each card cites, at git ' + esc(head) + ', by tools/build-grammar.js and its drawings, tools/build-grammar-plates.js. MIT. <a href="' + GITHUB + '">Source</a>.</p>';
  const CSS = `
/* /grammar/ (tools/build-grammar.js): the cards, the grids, the drawings' type (the hero under the header is design/template.js) */
:root{${Object.entries(VARS).map(([k, v]) => k + ':' + v).join(';')}}
.gx-grid{display:grid;gap:var(--s-5);grid-template-columns:minmax(0,1fr);margin-top:var(--s-6)}
@media (min-width:700px){.gx-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (min-width:1100px){.gx-grid.c3{grid-template-columns:repeat(3,minmax(0,1fr))}.gx-grid.c4{grid-template-columns:repeat(4,minmax(0,1fr))}}
.gx-card{display:flex;flex-direction:column;gap:var(--s-3);padding:var(--s-5);background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius-m);min-width:0}
.gx-art{background:var(--sunk);border:1px solid var(--rule);border-radius:var(--radius-s);padding:var(--s-3)}
.gx-art svg{display:block;width:100%;height:auto}
.gx-k{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-3)}
.gx-k a{color:var(--ink-3)}
.gx-t{font-family:var(--f-display);font-size:var(--text-body);font-weight:var(--weight-display);color:var(--ink)}
.gx-d{font-size:var(--text-small);color:var(--ink-2)}
.gx-d .w-legend{margin-top:0}
.gx-card .gx-d .w-legend{grid-template-columns:repeat(2,minmax(0,1fr))}
.gx-code{font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-3);border-top:1px solid var(--rule);padding-top:var(--s-3);margin-top:auto;overflow-wrap:anywhere}
.gx-f .gr-f{margin-top:0}
.gx-f .gr-f + .gr-f{margin-top:var(--s-2)}
.gx-vals{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s-3);margin-bottom:var(--s-2)}
.gx-vals span{display:flex;flex-direction:column;gap:var(--s-1);font-family:var(--f-mono);font-size:var(--text-body)}
.gx-vals em{font-style:normal;font-size:var(--text-eyebrow);color:var(--ink-4);text-transform:uppercase;letter-spacing:var(--track-loose)}
.gx-chips{display:flex;flex-wrap:wrap;gap:var(--s-2);margin-bottom:var(--s-3)}
.gx-grades{display:flex;flex-direction:column;gap:var(--s-2);margin-bottom:var(--s-3)}
.gx-big-v{font-family:var(--f-display);font-size:var(--text-3);color:var(--ink);margin-bottom:var(--s-2)}
.gx-unit{font-size:var(--text-small);color:var(--ink-3)}
.gx-mood-h{font-size:var(--text-body);margin-bottom:var(--s-2)}
.gx-empty{font-family:var(--f-display);font-size:var(--text-3);color:var(--ink);margin-bottom:var(--s-1)}
.gx-steps{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s-4);margin-top:var(--s-6)}
@media (min-width:700px){.gx-steps{grid-template-columns:repeat(4,minmax(0,1fr))}}
.gx-step svg{display:block;width:100%;height:auto;margin-top:var(--s-2)}
.gx-arrow{display:flex;justify-content:space-between;font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-4);border-top:1px solid var(--rule-strong);padding-top:var(--s-2);margin-top:var(--s-3)}
.gx-eqs{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--s-5);margin-top:var(--s-6)}
@media (min-width:700px){.gx-eqs{grid-template-columns:repeat(3,minmax(0,1fr))}}
.gx-eq svg{display:block;width:100%;height:auto;max-width:22rem}
.gx-laws{list-style:none;counter-reset:law;padding:0;margin:var(--s-6) 0 0;display:grid;grid-template-columns:minmax(0,1fr);gap:var(--s-3) var(--s-6)}
@media (min-width:700px){.gx-laws{grid-template-columns:repeat(2,minmax(0,1fr))}}
.gx-laws li{counter-increment:law;display:grid;grid-template-columns:var(--s-7) minmax(0,1fr);font-size:var(--text-small);color:var(--ink-2);border-top:1px solid var(--rule);padding-top:var(--s-3)}
.gx-laws li::before{content:counter(law);font-family:var(--f-display);font-size:var(--text-3);color:var(--ink);grid-row:span 2}
.gx-st{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink)}
.gx-note{color:var(--ink-4);font-size:var(--text-small)}
.gr-h3{margin-top:var(--s-8)}
.gr-k{display:block;margin-bottom:var(--s-1);font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-2)}
.gr-f{display:block;margin-top:var(--s-2);font-size:var(--text-small);color:var(--ink-4)}
.gr-f .gr-c{font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-3);white-space:nowrap}
.gr-halo{fill:var(--ink-2);stroke:var(--ink-2);stroke-width:4;stroke-linejoin:round;opacity:.32}
/* the drawings' type: mono eyebrows, the big signs, the chips, the mood */
.gx-eb{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;fill:var(--ink-4)}
.gx-big,.gx-huge,.gx-num,.gx-op,.gx-ans{font-family:var(--f-display);fill:var(--ink)}
.gx-num,.gx-ans{font-family:var(--f-mono)}
.gx-op{fill:var(--ink-3)}
.gx-chip{font-family:var(--f-mono);font-weight:var(--weight-strong);letter-spacing:var(--track-loose);fill:var(--ink-3)}
.gx-chip.on{fill:var(--paper)}
.gx-n{font-family:var(--f-mono);fill:var(--ink-2)}
.gx-mood{font-style:italic;fill:var(--ink)}
.gx-ic{font-family:var(--f-mono);font-weight:var(--weight-strong)}
.gx-before .w-computed{stroke:var(${TB[1].tok})}
.gx-before .w-chosen{stroke:var(${TB[2].tok})}
`;
  return TPL.render({ title: 'The visual grammar', bodyRaw: body, footRaw: foot, path: '/grammar/', cssRaw: CSS,
    desc: 'The visual grammar of this site: a mark’s stroke says what it rests on — decided, computed, chosen or refused — drawn live, with ' + numword(ruleNums.length) + ' rules each illustrated, the colour law and the checks that enforce it.' });
}

if (require.main === module) {
  const out = html();
  fs.mkdirSync(path.join(ROOT, 'site', 'grammar'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'site', 'grammar', 'index.html'), out);
  console.log('site/grammar/index.html written (' + out.length + ' bytes)');
}
module.exports = { html, cells, PANEL, RES, away, stair, fr, fsub, fadd, fmul, fdiv, feq, fnum, fstr, Q, STEPS };
