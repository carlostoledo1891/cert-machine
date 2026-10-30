/* build-grammar-gallery.js — the charts people already draw, twice: as a plotting library draws them and as WARRANT
   does. The gallery of /grammar/ (tools/build-grammar.js), and the page's one hero pair.
   tools/ · cert-machine · 2026-10-30

   WHY PAIRS. A reader cannot see what a grammar adds until the same numbers are drawn without it. Each "usual" panel
   is the same data through the same frame, every mark in one ink at one weight, a gap bridged and a missing value drawn
   as zero, the way a default plotting call draws them: no hand-made straw chart, and none of its strokes carries a
   standing (they are unclassed, so no check counts them as marks of the grammar). The WARRANT panel draws the same
   numbers with each mark in the stroke of what it rests on.

   THREE KINDS OF SOURCE, each said on the figure (design/components.js figure({ record | source })):
     · a record: the design wave reads buoy A's certified levels from the extract the matplotlib kit ships
       (kits/warrant-mpl/examples/data/buoy-a.json), and refuses if that extract no longer carries the digest of
       certs/hseva-ledger.json as it is now;
     · built here: Moody's chart, 64/Re exactly and Colebrook's equation iterated in floating point as this page is built;
     · an illustration: invented numbers, said so on the figure in the grammar's own mood ("given an invented record"),
       with no record address and no witness: a red × on invented data would be a forged counterexample. The arithmetic
       on them is still exact, so their ranks, gaps and counts are decided given the invention.

   Every check a scenario runs is a guard of the page; its plain words are the figure's stop sentence (R30). MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const C = require(path.join(ROOT, 'design', 'components.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const OUT = require(path.join(ROOT, 'design', 'outward.js'));
const PL = require(path.join(__dirname, 'build-grammar-plates.js'));
const esc = C.esc;
const f1 = (v) => (+v).toFixed(1);

/* ------------------------------------------------------------- atoms -- */
/* the usual panel's one ink: every mark alike, as a default plotting call draws it */
const PLAIN = 'stroke="var(--ink-2)" stroke-width="1.6" fill="none" stroke-linejoin="round"';
const plainDot = (x, y, r) => '    <circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + (r || 3.2) + '" fill="var(--ink-2)"/>';
const line = (x1, y1, x2, y2, a) => '    <line x1="' + f1(x1) + '" y1="' + f1(y1) + '" x2="' + f1(x2) + '" y2="' + f1(y2) + '" ' + a + '/>';
const poly = (pts, a) => '    <polyline points="' + pts.map(([x, y]) => f1(x) + ',' + f1(y)).join(' ') + '" ' + a + ' stroke-linejoin="round"/>';
const t = (x, y, s, cls, anchor) => CH.txt(x, y, s, cls || 't-note', anchor || 'start');
/* a label in the grammar's mood: a chosen input named in italic */
const mood = (x, y, s, anchor) => '    <text x="' + f1(x) + '" y="' + f1(y) + '" class="t-note gx-it"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + esc(s) + '</text>';
const eyebrow = (x, y, s) => '    <text x="' + f1(x) + '" y="' + f1(y) + '" class="gx-eb" font-size="10.5">' + esc(s) + '</text>';
const knot = (x, y, standing, hollow) => '    <circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="4.2" class="' + (standing === W.DECIDED ? 'w-decided' : '') + '" '
  + (hollow ? 'fill="var(--sunk)" stroke="var(--ink)" stroke-width="1.4"' : 'fill="var(--ink)" stroke="var(--ink)" stroke-width="1"') + '/>';
const square = (x, y, hollow) => '    <rect x="' + f1(x - 4) + '" y="' + f1(y - 4) + '" width="8" height="8" class="w-decided" '
  + (hollow ? 'fill="var(--sunk)" stroke="var(--ink)" stroke-width="1.4"' : 'fill="var(--ink)" stroke="var(--ink)" stroke-width="1"') + '/>';
/* words on a hatched void sit on a paper patch, so the hatch never runs through a letter */
const voidWords = (x, y, lines, cls) => { const w = Math.max(...lines.map((l) => l.length)) * 6.9 + 12, h = lines.length * 14 + 8;
  return ['    <rect x="' + f1(x - w / 2) + '" y="' + f1(y - 13) + '" width="' + f1(w) + '" height="' + f1(h) + '" rx="3" fill="var(--sunk)"/>']
    .concat(lines.map((l, i) => t(x, y + i * 14, l, i === 0 && cls ? cls : 't-note', 'middle'))).join('\n'); };
const head = (f, s, cls) => t(f.L, f.T - 12, s, cls || 't-note');
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
const svg = (w, h, alt, inner) => CH.open({ w, h, alt }) + '\n' + inner.join('\n') + '\n' + CH.close;
/* a panel's frame: the same numbers through the same frame on both sides */
const PW = 400, PH = 300, TOP = 50;

/* every scenario registers its checks here; build-grammar.js turns them into page guards */
function makeGuard(guard) { return guard || ((plain, ok, msg) => { if (!ok) throw new Error('gallery REFUSES: ' + (msg ? msg + ' — ' : '') + plain); }); }

/* ===================================================== 1. the design wave ==
   Buoy A's certified 100-year significant wave height, by the block the maxima are taken over: the case the
   matplotlib kit draws as its first example, here on screen. */
function designWave(guard) {
  guard = makeGuard(guard);
  const REC = 'certs/hseva-ledger.json', EX = 'kits/warrant-mpl/examples/data/buoy-a.json';
  const D = JSON.parse(fs.readFileSync(path.join(ROOT, EX), 'utf8'));
  const STOP = 'the kit\'s extract no longer carries the digest of buoy A\'s record, a level is no longer an enclosure, or the annual family choice is no longer refused';
  guard(STOP, D.source && D.source.record === REC && D.source.sha256 === sha(REC)
    && D.blocks.length === 5 && D.blocks[4].verdict === 'REFUSED' && D.blocks.slice(0, 4).every((b) => b.verdict === 'DECIDED'),
  D.source && D.source.sha256);
  const NAMES = { native: 'hourly', daily: 'daily', weekly: 'weekly', monthly: 'monthly', annual: 'annual' };
  const lv = (F) => F.levels['100'].map(Number);
  guard(STOP, D.blocks.every((b) => Object.values(b.families).every((F) => !F.certified || (lv(F)[0] <= lv(F)[1]))));
  const O = { w: PW, h: PH, padL: 46, padR: 14, padT: TOP, padB: 40, x0: -0.6, x1: 4.6, y0: 8, y1: 22 };
  const ticks = (f) => CH.axes(f, { yTicks: [8, 12, 16, 20].map((v) => ({ v, t: v + ' m' })), xTicks: D.blocks.map((b, i) => ({ v: i, t: NAMES[b.block] })) });
  const off = { expweibull: -0.13, lognormal: 0.13 };
  const big = Number(D.largestHour);
  /* the picked 100-year level by block, the story's two ends printed outward */
  const picked = D.blocks.slice(0, 4).map((b) => ({ b: b.block, fam: b.pick, iv: lv(b.families[b.pick]) }));
  const lowP = picked.reduce((a, b) => (b.iv[0] < a.iv[0] ? b : a)), highP = picked.reduce((a, b) => (b.iv[1] > a.iv[1] ? b : a));
  const lowS = OUT.down(String(lowP.iv[0]), 2), highS = OUT.up(String(highP.iv[1]), 2);
  /* the usual panel: one curve through the picked levels, the annual block's one certified fit drawn as if picked,
     error bars from the delta method, all one ink */
  const usual = (() => {
    const f = CH.frame(O), out = [ticks(f), eyebrow(8, 14, 'as usually drawn')];
    const pts = D.blocks.map((b, i) => { const fam = b.pick || Object.keys(b.families).find((k) => b.families[k].certified); return { i, F: b.families[fam] }; });
    out.push(poly(pts.map(({ i, F }) => [f.px(i), f.py(lv(F)[1])]), PLAIN));
    for (const { i, F } of pts) {
      if (F.delta && F.delta['100']) { const [d0, d1] = F.delta['100'].map(Number); out.push(line(f.px(i), f.py(d0), f.px(i), f.py(d1), PLAIN)); }
      out.push(plainDot(f.px(i), f.py(lv(F)[1])));
    }
    out.push(head(f, '100-year significant wave height', 't-ax'));
    return svg(PW, PH, 'As usually drawn: one curve through the 100-year wave height of each block, error bars, and the annual block drawn like the others.', out);
  })();
  const warrant = (() => {
    const f = CH.frame(O), h = PL.hatch(), out = [h.def, ticks(f), eyebrow(8, 14, 'in warrant')];
    out.push(line(f.px(-0.6), f.py(big), f.px(3.5), f.py(big), W.attrs(W.DECIDED, { width: 1 })));
    out.push(t(f.px(-0.55), f.py(big) + 13, 'largest hour, ' + D.largestHour + ' m', 't-note'));
    D.blocks.forEach((b, i) => {
      if (b.verdict === 'REFUSED') {
        out.push(PL.voidRect(h, f.px(i - 0.42), f.T, f.px(i + 0.42) - f.px(i - 0.42), f.ph));
        out.push(voidWords(f.px(i), f.T + 22, ['∅', 'family', 'refused'], 't-lab'));
        return;
      }
      for (const [fam, F] of Object.entries(b.families)) {
        if (!F.certified) continue;
        const x = f.px(i + off[fam]), y = f.py(lv(F)[1]), pick = b.pick === fam;
        if (pick && F.delta && F.delta['100']) { const [d0, d1] = F.delta['100'].map(Number); out.push(line(x, f.py(d0), x, f.py(d1), W.attrs(W.COMPUTED, { width: 1.6 }))); }
        out.push(fam === 'expweibull' ? knot(x, y, W.DECIDED, !pick) : square(x, y, !pick));
      }
    });
    out.push(head(f, '● exp. Weibull  ■ lognormal  ○ □ not picked'));
    return svg(PW, PH, 'In WARRANT: each family\'s certified level a decided knot, filled where Anderson–Darling picks it; the delta method\'s interval a dashed whisker, computed; the annual block a hatched void, the family choice refused; the largest hour on record a solid line.', out);
  })();
  return {
    id: 'design-wave', title: 'A design wave', kind: 'record', record: REC, stop: STOP, usual, warrant,
    hides: 'The usual chart draws a trend with error bars. The spread is two choices, the block and the family: the picked 100-year wave runs from ' + lowS + ' m (' + NAMES[lowP.b] + ') to ' + highS + ' m (' + NAMES[highP.b] + '). The error bars are the only float on the page, and on annual maxima one family has no certified fit, so the choice between them is refused, not drawn.',
    caption: 'Buoy A (NDBC), ' + D.years + ' years of hourly sea states: the certified 100-year significant wave height of the two families Anderson–Darling picks there, by block. Each level is an enclosure narrower than its dot; the whiskers are the delta method’s 95% interval.',
  };
}

/* ======================================================= 2. Moody's chart ==
   Friction in a pipe: 64/Re where the flow is laminar, Colebrook's equation where it is turbulent, and between them a
   range where neither holds. Drawn from the equations as the page is built. */
function moody(guard) {
  guard = makeGuard(guard);
  const STOP = 'a point of Colebrook\'s equation stops converging (its residual above 10⁻¹²), or 64/Re stops being exact at the ends drawn';
  const ROUGH = [[0, 'smooth'], [1e-4, '0.0001'], [1e-3, '0.001'], [1e-2, '0.01'], [5e-2, '0.05']];
  /* Colebrook (1939): 1/√f = −2 log10(ε/3.7 + 2.51/(Re √f)), solved for x = 1/√f by fixed-point iteration */
  const colebrook = (Re, e) => { let x = 8, r = 1; for (let k = 0; k < 200 && r > 1e-14; k++) { const nx = -2 * Math.log10(e / 3.7 + 2.51 * x / Re); r = Math.abs(nx - x); x = nx; } return { f: 1 / (x * x), r: Math.abs(-2 * Math.log10(e / 3.7 + 2.51 * x / Re) - x) }; };
  const RE = []; for (let i = 0; i <= 96; i++) RE.push(Math.pow(10, Math.log10(4000) + i / 96 * (8 - Math.log10(4000))));
  const curves = ROUGH.map(([e, lab]) => ({ e, lab, pts: RE.map((Re) => ({ Re, ...colebrook(Re, e) })) }));
  const worst = Math.max(...curves.flatMap((c) => c.pts.map((p) => p.r)));
  guard(STOP, worst < 1e-12, 'residual ' + worst);
  /* 64/Re at the laminar line's two ends, exactly: 64/640 = 1/10 and 64/2300 = 16/575 */
  const RE0 = 640, RE1 = 2300, RE2 = 4000;
  guard(STOP, 64 * 10 === RE0 * 1 && 64 * 575 === RE1 * 16);
  const O = { w: PW, h: PH, padL: 46, padR: 14, padT: TOP, padB: 40, x0: 600, x1: 1e8, y0: 0.005, y1: 0.1, logX: true, logY: true };
  const SUP = { 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸' };
  const ticks = (f) => CH.axes(f, { yTicks: [0.01, 0.02, 0.05, 0.1].map((v) => ({ v, t: String(v) })), xTicks: [3, 4, 5, 6, 7, 8].map((k) => ({ v: Math.pow(10, k), t: '10' + SUP[k] })) });
  const P = (f, Re, fr) => [f.px(Re), f.py(fr)];
  const usual = (() => {
    const f = CH.frame(O), out = [ticks(f), eyebrow(8, 14, 'as usually drawn')];
    /* the laminar line carried on to 4000, then a pen stroke to the smooth curve: the bridge every chart draws */
    out.push(poly([P(f, RE0, 0.1), P(f, RE2, 64 / RE2)], PLAIN));
    out.push(poly([P(f, RE1, 64 / RE1), P(f, RE2, curves[0].pts[0].f)], PLAIN));
    for (const c of curves) out.push(poly(c.pts.map((p) => P(f, p.Re, p.f)), PLAIN));
    out.push(head(f, 'friction factor f, against Re', 't-ax'));
    return svg(PW, PH, 'As usually drawn: the laminar line and five turbulent curves, all one ink, the laminar line carried into the transition and joined to the smooth curve.', out);
  })();
  const warrant = (() => {
    const f = CH.frame(O), h = PL.hatch(), out = [h.def, ticks(f), eyebrow(8, 14, 'in warrant')];
    out.push(PL.voidRect(h, f.px(RE1), f.T, f.px(RE2) - f.px(RE1), f.ph));
    out.push(t(f.px(Math.sqrt(RE1 * RE2)), f.T + f.ph - 10, '∅', 't-lab', 'middle'));
    out.push(t(f.px(4600), f.py(0.093), '∅ Re 2300–4000: no correlation holds', 't-note'));
    out.push(poly([P(f, RE0, 0.1), P(f, RE1, 64 / RE1)], W.attrs(W.DECIDED, { width: 2 })));
    out.push(t(f.px(650), f.py(0.016), '64/Re', 't-lab'), t(f.px(650), f.py(0.0132), 'exact', 't-note'));
    for (const c of curves) out.push(poly(c.pts.map((p) => P(f, p.Re, p.f)), W.attrs(W.COMPUTED, { width: 1.4 })));
    const last = (c) => c.pts[c.pts.length - 1];
    for (const c of curves.slice(1)) out.push(mood(f.L + f.pw - 2, f.py(last(c).f) - 4, 'given ε/D = ' + c.lab, 'end'));
    out.push(mood(f.L + f.pw - 2, f.py(last(curves[0]).f) - 4, 'smooth', 'end'));
    out.push(head(f, 'friction factor f, against Re'));
    return svg(PW, PH, 'In WARRANT: 64 over Re solid, exact; the transition from Re 2300 to 4000 a hatched void; Colebrook\'s turbulent curves dashed, computed, each named by the roughness it was drawn given, in italic.', out);
  })();
  return {
    id: 'moody', title: 'Moody’s chart', kind: 'built', source: 'built here from 64/Re and Colebrook (1939)', stop: STOP, usual, warrant,
    hides: 'The usual chart draws an exact law and a 1939 fit in one ink, and carries a pen across the transition. Here 64/Re is solid, Colebrook’s curves are dashed, each names the roughness it was drawn given, and from Re 2300 to 4000, where no correlation holds, nothing is drawn.',
    caption: 'Friction factor against Reynolds number. Laminar: 64/Re, exact arithmetic. Turbulent: Colebrook’s equation, solved for each point by iteration in floating point (every residual under 10⁻¹²); the equation itself is a fit to measured pipes, a premise ' + W.grade(W.ASSUMED) + ' here.',
  };
}

/* ======================================================== 3. a leaderboard ==
   Six models on 500 items: invented. */
function leaderboard(guard) {
  guard = makeGuard(guard);
  const N = 500;
  const ROWS = [
    { m: 'Model A', k: 357 }, { m: 'Model B', k: 357 }, { m: 'Model C', k: 341 },
    { m: 'Model D', k: 338, self: true }, { m: 'Model E', k: null }, { m: 'Model F', k: 296 },
  ];
  const STOP = 'the invented counts stop tying first place, or a missing run is drawn as a score';
  guard(STOP, ROWS[0].k === ROWS[1].k && ROWS[0].k > ROWS[2].k && ROWS.filter((r) => r.k === null).length === 1);
  const O = { w: PW, h: PH, padL: 70, padR: 40, padT: TOP, padB: 40, x0: 0, x1: N, y0: 0, y1: ROWS.length };
  const rowY = (f, i) => f.T + (i + 0.5) * f.ph / ROWS.length, bh = 18;
  const ax = (f) => CH.axes(f, { xTicks: [0, 100, 200, 300, 400, 500].map((v) => ({ v, t: String(v) })) });
  const usual = (() => {
    const f = CH.frame(O), out = [ax(f), eyebrow(8, 14, 'as usually drawn')];
    const order = ROWS.slice().sort((a, b) => (b.k || 0) - (a.k || 0));
    order.forEach((r, i) => {
      const y = rowY(f, i);
      out.push(t(f.L - 8, y + 4, '#' + (i + 1) + ' ' + r.m.replace('Model ', ''), 't-ax', 'end'));
      if (r.k) out.push('    <rect x="' + f1(f.px(0)) + '" y="' + f1(y - bh / 2) + '" width="' + f1(f.px(r.k) - f.px(0)) + '" height="' + bh + '" fill="var(--ink-3)"/>');
      out.push(t(f.px(r.k || 0) + 5, y + 4, String(r.k || 0), 't-ax'));
    });
    out.push(t(f.L + f.pw, f.T + f.ph + 32, 'items correct of ' + N, 't-ax', 'end'), head(f, 'ranked', 't-ax'));
    return svg(PW, PH, 'As usually drawn: six bars ranked one to six, the missing run a zero at the bottom, every score alike.', out);
  })();
  const warrant = (() => {
    const f = CH.frame(O), h = PL.hatch(), out = [h.def, ax(f), eyebrow(8, 14, 'in warrant')];
    ROWS.forEach((r, i) => {
      const y = rowY(f, i);
      out.push(t(f.L - 8, y + 4, r.m.replace('Model ', ''), 't-ax', 'end'));
      if (r.k === null) {
        out.push(PL.voidRect(h, f.px(0), y - bh / 2, f.pw, bh));
        out.push(voidWords(f.px(N / 2), y + 4, ['∅ not run · needs data']));
        return;
      }
      out.push('    <rect x="' + f1(f.px(0)) + '" y="' + f1(y - bh / 2) + '" width="' + f1(f.px(r.k) - f.px(0)) + '" height="' + bh + '" '
        + (r.self ? W.extentAttrs(W.COMPUTED, { width: 1.6 }) + ' stroke-dasharray="5 4"' : 'fill="var(--ink-3)"') + '/>');
      out.push(t(f.px(r.k) + 5, y + 4, String(r.k), 't-ax'));
    });
    /* the tie: which of A and B is first was picked (here, by name), so their order is drawn as a choice */
    const yA = rowY(f, 0), yB = rowY(f, 1), xb = f.px(ROWS[0].k) + 34;
    out.push('    <path d="M' + f1(xb - 6) + ',' + f1(yA) + 'H' + f1(xb) + 'V' + f1(yB) + 'H' + f1(xb - 6) + '" ' + W.attrs(W.CHOSEN, { width: 1.8 }) + '/>');
    out.push(t(xb + 6, (yA + yB) / 2 - 3, 'tie, order', 't-note'), t(xb + 6, (yA + yB) / 2 + 11, 'chosen', 't-note'));
    out.push(t(f.px(338) + 30, rowY(f, 3) + 4, 'self-reported', 't-note'));
    out.push(t(f.L + f.pw, f.T + f.ph + 32, 'items correct of ' + N, 't-ax', 'end'), head(f, 'counted: solid · reported: dashed'));
    return svg(PW, PH, 'In WARRANT: counts as solid bars; first and second tied, their order a dotted bracket, chosen; a self-reported score a dashed bar, a number someone printed; the missing run a hatched void, not run.', out);
  })();
  return {
    id: 'leaderboard', title: 'A leaderboard', kind: 'illustration', stop: STOP, usual, warrant,
    hides: 'The usual chart ranks six models one to six. First place is a tie broken by name; fourth is a score someone reported and nobody re-counted; the zero at the bottom is a run that never happened.',
    caption: 'Six models on 500 items, the counts invented. A count of items correct is decided by counting; an order between equal counts is chosen; a reported score is computed until it is re-counted.',
  };
}

/* ========================================================= 4. an epidemic curve ==
   Daily hospital admissions over eight weeks, invented: a reporting gap and a week still being counted. */
function admissions(guard) {
  guard = makeGuard(guard);
  const DAYS = 56, GAP = [33, 34], TAIL = 7;
  /* the invented series, by a formula (no randomness), and the share of each recent day reported so far */
  const truth = Array.from({ length: DAYS }, (_, d) => Math.round(34 + 0.55 * d + 9 * Math.sin(d / 4.2) + 4 * Math.sin(d / 1.7)));
  const SHARE = [0.93, 0.86, 0.78, 0.66, 0.52, 0.37, 0.21];
  const seen = truth.map((v, d) => (GAP.includes(d) ? null : d >= DAYS - TAIL ? Math.floor(v * SHARE[d - (DAYS - TAIL)]) : v));
  /* the nowcast: what is seen, scaled up by the share reported (computed: a model of the delay) */
  const now = seen.map((v, d) => (d >= DAYS - TAIL ? v / SHARE[d - (DAYS - TAIL)] : null));
  /* a seven-day mean over complete days only: the window is a choice */
  const avg = seen.map((_, d) => { if (d < 6 || d >= DAYS - TAIL) return null; const w = seen.slice(d - 6, d + 1); return w.includes(null) ? null : w.reduce((a, b) => a + b, 0) / 7; });
  const STOP = 'the invented week being counted stops reading lower than the weeks before it, or the unreported days stop being unreported';
  const lastFull = seen.slice(DAYS - TAIL - 7, DAYS - TAIL).reduce((a, b) => a + b, 0), lastSeen = seen.slice(DAYS - TAIL).reduce((a, b) => a + b, 0);
  guard(STOP, lastSeen < lastFull && GAP.every((d) => seen[d] === null), lastSeen + ' vs ' + lastFull);
  const ymax = Math.max(...truth) * 1.12;
  const O = { w: PW, h: PH, padL: 40, padR: 14, padT: TOP, padB: 40, x0: -0.5, x1: DAYS - 0.5, y0: 0, y1: ymax };
  const ax = (f) => CH.axes(f, { yTicks: [0, 25, 50].map((v) => ({ v, t: String(v) })), xTicks: [0, 14, 28, 42].map((v) => ({ v, t: 'day ' + (v + 1) })) });
  const bw = (f) => (f.px(1) - f.px(0)) * 0.72;
  const usual = (() => {
    const f = CH.frame(O), out = [ax(f), eyebrow(8, 14, 'as usually drawn')];
    seen.forEach((v, d) => { if (v) out.push('    <rect x="' + f1(f.px(d) - bw(f) / 2) + '" y="' + f1(f.py(v)) + '" width="' + f1(bw(f)) + '" height="' + f1(f.py(0) - f.py(v)) + '" fill="var(--ink-4)"/>'); });
    /* a seven-day mean over everything, the gap read as zero and the incomplete week as complete */
    const z = seen.map((v) => v || 0), m = z.map((_, d) => (d < 6 ? null : z.slice(d - 6, d + 1).reduce((a, b) => a + b, 0) / 7));
    out.push(poly(m.map((v, d) => (v === null ? null : [f.px(d), f.py(v)])).filter(Boolean), PLAIN));
    out.push(head(f, 'admissions per day', 't-ax'));
    return svg(PW, PH, 'As usually drawn: daily bars, two days at zero, and a seven-day mean that dips at the gap and falls over the last week.', out);
  })();
  const warrant = (() => {
    const f = CH.frame(O), h = PL.hatch(), out = [h.def, ax(f), eyebrow(8, 14, 'in warrant')];
    seen.forEach((v, d) => { if (v) out.push('    <rect x="' + f1(f.px(d) - bw(f) / 2) + '" y="' + f1(f.py(v)) + '" width="' + f1(bw(f)) + '" height="' + f1(f.py(0) - f.py(v)) + '" fill="var(--ink-4)"/>'); });
    out.push(PL.voidRect(h, f.px(GAP[0]) - bw(f) / 2, f.T, f.px(GAP[1]) - f.px(GAP[0]) + bw(f), f.ph));
    out.push(t(f.px(GAP[0] + 0.5), f.T + 14, '∅', 't-lab', 'middle'), t(f.px(GAP[0]) - bw(f), f.T + 14, 'not reported', 't-note', 'end'));
    const segs = []; let cur = [];
    avg.forEach((v, d) => { if (v === null) { if (cur.length) segs.push(cur); cur = []; } else cur.push([f.px(d), f.py(v)]); });
    if (cur.length) segs.push(cur);
    for (const s of segs) if (s.length > 1) out.push(poly(s, W.attrs(W.CHOSEN, { width: 2 })));
    out.push(poly(now.map((v, d) => (v === null ? null : [f.px(d), f.py(v)])).filter(Boolean), W.attrs(W.COMPUTED, { width: 2 })));
    out.push(t(f.px(DAYS - 1), f.py(now[DAYS - 1]) + 18, 'nowcast', 't-note', 'end'));
    out.push(t(f.px(0), f.py(58), '7-day mean · window chosen', 't-note'));
    out.push(head(f, 'per day · the last week still being counted'));
    return svg(PW, PH, 'In WARRANT: the counts received as solid bars; the two unreported days a hatched void; the seven-day mean dotted, over complete days only, its window chosen; the last week\'s nowcast dashed, computed.', out);
  })();
  return {
    id: 'admissions', title: 'An epidemic curve', kind: 'illustration', stop: STOP, usual, warrant,
    hides: 'The usual chart shows a dip and a fall. The dip is two days nobody reported, drawn as zero; the fall is a week still being counted. Here the gap is a void, the mean stops where the data stop, and the last week is a nowcast, dashed.',
    caption: 'Eight weeks of daily admissions, the counts invented by a formula. The bars are counts received; the last seven days are counted so far, and the nowcast scales them by the share usually reported by then.',
  };
}

/* ====================================================== 5. a paragraph and a table ==
   A sentence and a table from a wave report: invented ("Buoy X"). Prose flattens standing more than any chart. */
function reportText() {
  const V = (s, st) => W.value(s, st, { illustration: true });
  const usualP = '<p class="gx-prose">At Buoy X the 100-year significant wave height is 12.4 m (95% CI 11.6–13.3 m), and the design wave is 13 m. The platform deck clears the design wave.</p>'
    + '<table class="gx-mini"><thead><tr><th>return period</th><th>Hs</th></tr></thead><tbody><tr><td>10 years</td><td>9.8 m</td></tr><tr><td>100 years</td><td>12.4 m</td></tr><tr><td>1000 years</td><td>—</td></tr></tbody></table>';
  const warrantP = '<p class="gx-prose">At Buoy X the 100-year significant wave height is ' + V('12.38–12.41', W.DECIDED) + ' m <em>given the GEV family</em>, with a 95% interval of '
    + V('11.6–13.3', W.COMPUTED) + ' m. The design wave is ' + V('13', W.CHOSEN) + ' m, rounded up by the code’s rule. The platform deck clears it: ' + C.tag('HOLDS', 'held') + ' <em>given a design wave of 13 m</em>.</p>'
    + '<table class="gx-mini"><thead><tr><th>return period</th><th>Hs, m</th></tr></thead><tbody><tr><td>10 years</td><td>' + V('9.80–9.83', W.DECIDED) + '</td></tr><tr><td>100 years</td><td>' + V('12.38–12.41', W.DECIDED) + '</td></tr><tr><td>1000 years</td><td>' + V('not computed', W.REFUSED) + '</td></tr></tbody></table>'
    + '<p class="gx-rests">It rests on the hindcast, ' + W.grade(W.COMPARED) + ' against the buoy’s own record, and on the GEV family, ' + W.grade(W.ASSUMED) + ', chosen by the analyst. The weakest premise is <b>assumed</b>.</p>';
  return {
    id: 'report', title: 'A paragraph and a table', kind: 'illustration', usualRaw: usualP, warrantRaw: warrantP,
    hides: 'In prose a fit, a float interval and a rounded design value look the same, and a dash in a table could mean zero, missing or not applicable. Here each number wears its underline, the chosen family is named in italic, the verdict is a word, the empty cell says why, and the premises are listed with the weakest last.',
  };
}

module.exports = { designWave, moody, leaderboard, admissions, reportText, PLAIN, PW, PH };
