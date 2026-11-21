#!/usr/bin/env node
/* build-report-alpoge-grh.js — reports/alpoge-grh.html: Levent Alpöge's Lean proof of the Riemann Hypothesis (alpo.ge,
   20 November 2026), checked by cert-machine. Every verdict word and number is read from certs/alpoge-grh-lean.json
   (derived from the pod's pulled results by tools/check-alpoge-grh.py) and the pinned readings in corpus/alpoge-grh/.
   While checks are still running the page is a DRAFT: those rows are drawn as pending and a banner says so;
   `FINAL=1 node tools/build-report-alpoge-grh.js` refuses to build while any row is pending.

   The page explains, in plain words, what a computer check of a 17-million-line proof is and is not: the 360° wheel of
   checks (hero), what the theorem says on the complex plane (interactive), the size of the proof (treemap), the chain of
   checks (the page's one schematic), the planted defects, the route inside the proof and Nielsen's findings, the bridges
   to the August release and to Masullo's draft, and the credits.                                                    MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const OG = require(path.join(ROOT, 'tools', 'build-og-report.js'));
const die = (msg) => { console.error('ALPOGE-GRH PAGE REFUSED: ' + msg); process.exit(1); };
const need = (ok, msg) => { if (!ok) die(msg); };
const GH = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';
const rec = (rel) => '<a href="' + C.escAttr(GH + rel) + '"><span class="m">' + C.esc(rel) + '</span></a>';
const a = (href, text) => '<a href="' + C.escAttr(href) + '">' + C.esc(text) + '</a>';
const N = (x) => Number(x).toLocaleString('en-US');
const FINAL = process.env.FINAL === '1';

const REC = 'certs/alpoge-grh-lean.json', DIR = 'corpus/alpoge-grh/';
const R = require(path.join(ROOT, 'instruments', 'alpoge-grh', 'status.js')).R;
const PINS = JSON.parse(fs.readFileSync(path.join(ROOT, DIR + 'PINS.json'), 'utf8'));
const RD = JSON.parse(fs.readFileSync(path.join(ROOT, DIR + 'readings.json'), 'utf8'));
const RT = JSON.parse(fs.readFileSync(path.join(ROOT, DIR + 'route-reading.json'), 'utf8'));
const SS = JSON.parse(fs.readFileSync(path.join(ROOT, DIR + 'source-stats.json'), 'utf8'));
need(SS.archive_sha256 === PINS.archive.sha256 && SS.files === PINS.archive.lean_files, 'the source statistics are not of the pinned archive');
const S = require(path.join(ROOT, 'instruments', 'alpoge-grh', 'status.js'));
const { row, status, census, nielsenRan, WHEEL, ALL, pending, done, bad, WORD } = S;
if (FINAL) need(pending.length === 0, 'FINAL build with pending checks: ' + pending.map((x) => x.id).join(', '));
/* the page's public change log (corpus/alpoge-grh/page-log.json): the newest entry must state the count the record gives */
const LOG = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'alpoge-grh', 'page-log.json'), 'utf8')).entries;
need(LOG.length > 0 && LOG[LOG.length - 1].done === done.length, 'the newest page-log entry says ' + (LOG.length ? LOG[LOG.length - 1].done : 'nothing') + ' checks done, the record ' + done.length + ': add a dated line to corpus/alpoge-grh/page-log.json');
const LAST = LOG[LOG.length - 1].at.replace('T', ' ').replace('Z', ' UTC');

/* ---------------------------------------------------------------- HERO: the wheel */
function figWheel(w, narrow) {
  const h = narrow ? 500 : Math.max(520, 34 + WHEEL.length * 27 + ALL.length * 17 + 36), cx = narrow ? w / 2 : 300, cy = narrow ? 172 : 260, r = narrow ? 128 : 168, sw = narrow ? 22 : 28;
  const o = [CH.open({ w, h, alt: 'A ring of ' + ALL.length + ' arcs, one per check, in four groups: the bytes, the build and the kernels, the statement, the context. Solid arcs are decided, dashed are computed, dotted are readings; grey arcs are still running. In the centre the theorem’s name and the count of checks done.' })];
  const n = ALL.length, gap = 0.035, gGap = 0.09, groups = WHEEL.length;
  const per = (2 * Math.PI - groups * gGap - (n - groups) * gap) / n;
  let ang = -Math.PI / 2 + gGap / 2;
  const f = (x) => x.toFixed(1);
  const arc = (a0, a1, rr) => 'M' + f(cx + rr * Math.cos(a0)) + ' ' + f(cy + rr * Math.sin(a0)) + ' A' + rr + ' ' + rr + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + f(cx + rr * Math.cos(a1)) + ' ' + f(cy + rr * Math.sin(a1));
  let k = 0;
  const labels = [];
  WHEEL.forEach((G, gi) => {
    const g0 = ang;
    G.items.forEach((it, ii) => {
      const x = ALL[k];
      const a0 = ang, a1 = ang + per;
      const st = x.st;
      const kind = st === 'decided' ? W.DECIDED : st === 'computed' ? W.COMPUTED : st === 'read' ? W.CHOSEN : null;
      const s = kind !== null ? W.stroke(kind, { width: sw }) : null;
      const tok = st === 'refuted' ? 'var(--witness)' : st === 'refused' ? 'var(--ink-3)' : 'var(--sig)';
      /* the track: every check has one; the mark on it says its state (solid decided, dashed computed, dotted read, none running) */
      /* the track carries the hover (a full-width target for every state); the mark on it is drawn over it and ignores the pointer */
      o.push('    ' + CH.hit('<path class="wh-track' + (st === 'pending' ? ' wh-run' : '') + '" data-wi="' + k + '" d="' + arc(a0, a1, r) + '" fill="none" stroke="var(--mark)" stroke-width="' + sw + '" style="animation-delay:' + (k * 90) + 'ms" pointer-events="stroke"', x.t, WORD[st] + ' · ' + x.d) + '/>');
      const mw = st === 'read' ? 3.5 : st === 'computed' ? sw - 6 : sw;
      const gs = s && s.dash ? W.stroke(kind, { width: mw }) : null;   /* the grammar's pattern (design/grammar.js), never a literal */
      const dash = gs ? ' stroke-dasharray="' + gs.dash + '"' + (gs.cap ? ' stroke-linecap="' + gs.cap + '"' : '') : '';
      if (s || st === 'refused' || st === 'refuted') o.push('    <path class="wh-seg ' + (s ? s.class : 'w-none') + '" data-wi="' + k + '" d="' + arc(a0, a1, r) + '" fill="none" stroke="' + tok + '" stroke-width="' + mw + '"' + dash
        + ' style="animation-delay:' + (200 + k * 90) + 'ms" pointer-events="none"/>');
      k++;
      ang = a1 + (ii < G.items.length - 1 ? gap : 0);
    });
    const mid = (g0 + ang) / 2;
    labels.push({ mid, t: G.g, n: G.items.length });
    ang += gGap;
  });
  /* phone: a numeral per group outside the ring (one character never clips), and the groups listed under it */
  labels.forEach((L, i) => {
    const rr = r + sw / 2 + 12;
    o.push(CH.txt(cx + rr * Math.cos(L.mid), cy + rr * Math.sin(L.mid) + 4, String(i + 1), 't-ax', 'middle', ' style="font-size:12px"'));
    if (!narrow) return;
    const G = WHEEL[i], its = G.items.map((it) => ALL.find((z) => z.id === it.id));
    const nd = its.filter((x) => ['decided', 'computed', 'read'].includes(x.st)).length, np = its.filter((x) => x.st === 'pending').length;
    const y = cy + r + sw / 2 + 40 + i * 26;
    o.push(CH.txt(16, y, (i + 1) + '  ' + G.g.replace('The build and the kernels', 'Build · kernels').toUpperCase(), 't-ax', 'start', ' style="letter-spacing:.06em"'));
    o.push(CH.txt(w - 16, y, nd + ' of ' + its.length + ' done' + (np ? ' · ' + np + ' running' : ''), np ? 't-note' : 't-lab', 'end', ' style="font-size:11.5px"'));
  });
  /* centre */
  o.push(CH.txt(cx, cy - 26, 'riemannHypothesis', 't-lab', 'middle', ' style="font-family:var(--f-mono);font-size:' + (narrow ? 13 : 15) + 'px"'));
  o.push(CH.txt(cx, cy - 6, ': RiemannHypothesis', 't-note', 'middle', ' style="font-family:var(--f-mono)"'));
  o.push(CH.txt(cx, cy + 26, done.length + ' of ' + ALL.length + ' checks done', 't-lab', 'middle', ' style="font-size:' + (narrow ? 15 : 18) + 'px;font-weight:600"'));
  o.push(CH.txt(cx, cy + 46, pending.length ? pending.length + ' still running' : (bad.length ? bad.length + ' refused' : 'none refused'), 't-note', 'middle'));
  /* the side list (wide only): the checks of each group, in order, with their state */
  if (!narrow) {
    let y = 34;
    WHEEL.forEach((G, gi) => {
      o.push(CH.txt(560, y, (gi + 1) + '  ' + G.g.toUpperCase(), 't-ax', 'start', ' style="letter-spacing:.08em"'));
      y += 18;
      G.items.forEach((it) => {
        const wi = ALL.findIndex((z) => z.id === it.id), x = ALL[wi];
        o.push(CH.txt(560, y, (x.st === 'pending' ? '◌ ' : x.st === 'refused' || x.st === 'refuted' ? '✕ ' : x.st === 'dropped' ? '– ' : '● ') + it.t, (x.st === 'pending' || x.st === 'dropped' ? 't-note' : 't-lab') + ' wh-li', 'start',
          ' ' + CH.hit('style="font-size:12.5px" data-wi="' + wi + '"', it.t, WORD[x.st] + ' · ' + it.d)));
        y += 17;
      });
      y += 9;
    });
  }
  o.push(CH.legend([{ token: 'var(--sig)', t: 'decided (solid)' }, { token: 'var(--sig)', kind: 'dash', t: 'computed (dashed)' }, { token: 'var(--sig)', kind: 'dot', t: 'read (dotted)' }, { token: 'var(--mark)', t: 'running (empty track)' }],
    narrow ? 16 : 40, h - 14, null, w - (narrow ? 32 : 80)));
  o.push(CH.close);
  return o.join('\n');
}

/* ---------------------------------------------------------------- the complex plane (interactive) */
const ZEROS = [14.134725, 21.022040, 25.010858, 30.424876, 32.935062];   /* the first five ordinates, quoted (LMFDB / Odlyzko) */
function figPlane(w, narrow) {
  const h = narrow ? 560 : 500;
  const x0 = narrow ? 18 : 40, x1 = w - (narrow ? 14 : 40), y0 = narrow ? 64 : 40, y1 = h - 56;
  const reMin = narrow ? -6.6 : -7, reMax = narrow ? 2.6 : 3, imMin = -3, imMax = 40;
  const X = (re) => x0 + (re - reMin) / (reMax - reMin) * (x1 - x0), Y = (im) => y1 - (im - imMin) / (imMax - imMin) * (y1 - y0);
  const f = (x) => x.toFixed(1);
  const o = [CH.open({ w, h, alt: 'The complex plane. A shaded vertical band between real parts 0 and 1 is the critical strip; a solid line at real part 1/2 is the critical line, with the first five zeros of ζ drawn on it; dots at −2, −4 and −6 on the real axis are the trivial zeros; a ring at 1 is the pole; the region right of real part 1 is grey: ζ has no zeros there. Buttons above the figure highlight what each statement talks about.', cls: 'zplane' })];
  /* zero-free region Re ≥ 1 */
  o.push('    <rect class="zp-free" x="' + f(X(1)) + '" y="' + y0 + '" width="' + f(x1 - X(1)) + '" height="' + f(y1 - y0) + '" fill="var(--mark)" opacity="0.5"/>');
  /* the strip */
  o.push('    <rect class="zp-strip" x="' + f(X(0)) + '" y="' + y0 + '" width="' + f(X(1) - X(0)) + '" height="' + f(y1 - y0) + '" fill="var(--band-fill)"/>');
  /* axes */
  o.push('    <line x1="' + x0 + '" y1="' + f(Y(0)) + '" x2="' + x1 + '" y2="' + f(Y(0)) + '" stroke="var(--c-axis)" stroke-width="1"/>');
  o.push('    <line x1="' + f(X(0)) + '" y1="' + y0 + '" x2="' + f(X(0)) + '" y2="' + y1 + '" stroke="var(--c-axis)" stroke-width="1"/>');
  for (const re of [-6, -4, -2, 1, 2]) o.push(CH.txt(X(re), Y(0) + 16, String(re), 't-ax', 'middle'));
  o.push(CH.txt(X(0.5), y1 + 18, 'Re s = 1/2', 't-ax', 'middle'));
  o.push(CH.txt(x1, Y(0) - 6, 'Re s', 't-ax', 'end'));
  o.push(CH.txt(X(0) - 6, y0 + 4, 'Im s', 't-ax', 'end'));
  /* the critical line */
  o.push('    <line class="zp-line" x1="' + f(X(0.5)) + '" y1="' + y0 + '" x2="' + f(X(0.5)) + '" y2="' + y1 + '" stroke="var(--sig)" stroke-width="2.4"/>');
  /* zeros on the line: quoted values (dashed outline) */
  ZEROS.forEach((g, i) => {
    o.push('    <circle ' + CH.hit('class="zp-zero" cx="' + f(X(0.5)) + '" cy="' + f(Y(g)) + '" r="5.5" fill="var(--sig)" stroke="var(--paper)" stroke-width="1.5" style="animation-delay:' + (400 + i * 380) + 'ms"', 'a nontrivial zero of ζ', '1/2 + ' + g.toFixed(6) + 'i · a published value (quoted), not computed here') + '/>');
    o.push(CH.txt(X(0.5) - 10, Y(g) + 4, g.toFixed(2) + 'i', 't-note', 'end'));
  });
  o.push(CH.txt(X(0.5) - 10, y0 + 30, '↑ infinitely many more', 't-note', 'end'));
  /* trivial zeros */
  for (const t of [-2, -4, -6]) o.push('    <circle ' + CH.hit('class="zp-triv" cx="' + f(X(t)) + '" cy="' + f(Y(0)) + '" r="5" fill="var(--ink-3)"', 'a trivial zero of ζ', 's = ' + t + ' · excluded by Mathlib’s definition') + '/>');
  /* the pole */
  o.push('    <circle ' + CH.hit('class="zp-pole" cx="' + f(X(1)) + '" cy="' + f(Y(0)) + '" r="6" fill="var(--paper)" stroke="var(--warn)" stroke-width="2"', 'the pole of ζ at s = 1', 'excluded: ζ is not defined there; Mathlib’s value at 1 is not a zero') + '/>');
  /* region labels */
  o.push(CH.txt(narrow ? X(1) + 4 : X(0.5), y0 - (narrow ? 30 : 14), narrow ? 'the critical strip, 0 < Re s < 1' : 'the critical strip, 0 < Re s < 1', 't-lab', narrow ? 'end' : 'middle'));
  if (!narrow) o.push(CH.txt((X(1) + x1) / 2, y0 + 40, 'no zeros here', 't-note', 'middle'));
  o.push(CH.txt(X(-4), Y(0) - 14, 'trivial zeros', 't-note', 'middle'));
  if (!narrow) {
    o.push(CH.txt(X(-6.8), y0 + 34, 'ζ(s) = 1 + 1/2ˢ + 1/3ˢ + … for Re s > 1,', 't-note', 'start'));
    o.push(CH.txt(X(-6.8), y0 + 52, 'continued to every other s except the pole at 1.', 't-note', 'start'));
    o.push(CH.txt(X(-6.8), y0 + 80, 'RH: the zeros in the strip all sit on its middle line.', 't-lab', 'start'));
  }
  /* annotation layers toggled by the buttons */
  o.push('    <g class="zp-ann zp-a-mathlib"><path d="M' + f(X(-6.6)) + ' ' + f(Y(0) - 26) + ' L' + f(X(1.4)) + ' ' + f(Y(0) - 26) + '" stroke="var(--ink-3)" stroke-dasharray="2 3" fill="none"/>'
    + CH.txt(X(-6.6), Y(0) - 32, 'Mathlib: every zero except these and s = 1 …', 't-note', 'start') + '</g>');
  o.push('    <g class="zp-ann zp-a-strip"><rect x="' + f(X(0) - 3) + '" y="' + (y0 + 20) + '" width="' + f(X(1) - X(0) + 6) + '" height="' + f(y1 - y0 - 20) + '" fill="none" stroke="var(--sig)" stroke-width="2" rx="4"/>'
    + CH.txt(X(1) + 10, y0 + 70, '… = every zero in the strip', 't-note', 'start') + '</g>');
  o.push(CH.close);
  return o.join('\n');
}
const planeButtons = '<div class="zp-btns" role="group" aria-label="What each statement talks about">'
  + '<button type="button" data-zp="mathlib" aria-pressed="false">Mathlib’s definition</button>'
  + '<button type="button" data-zp="strip" aria-pressed="false">The textbook form</button>'
  + '<button type="button" data-zp="both" aria-pressed="false">Proved equivalent</button></div>'
  + '<p class="zp-say" aria-live="polite">Select a statement to see what it talks about.</p>';

/* ---------------------------------------------------------------- the treemap of the proof */
function squarify(items, x, y, w, h) {
  /* squarified treemap (Bruls, Huizing, van Wijk 2000) over items sorted by value, descending */
  const out = [];
  const total = items.reduce((s, it) => s + it.v, 0);
  if (!total) return out;
  let rest = items.map((it) => Object.assign({}, it, { a: it.v / total * w * h }));
  let rx = x, ry = y, rw = w, rh = h;
  while (rest.length) {
    const side = Math.min(rw, rh);
    let rowItems = [], best = Infinity;
    for (let i = 0; i < rest.length; i++) {
      const cand = rest.slice(0, i + 1), s = cand.reduce((t, c) => t + c.a, 0);
      const worst = Math.max(...cand.map((c) => Math.max(side * side * c.a / (s * s), s * s / (side * side * c.a))));
      if (worst <= best) { best = worst; rowItems = cand; } else break;
    }
    const s = rowItems.reduce((t, c) => t + c.a, 0);
    if (rw >= rh) {
      const cw = s / rh; let cy = ry;
      for (const c of rowItems) { const ch = c.a / cw; out.push(Object.assign(c, { x: rx, y: cy, w: cw, h: ch })); cy += ch; }
      rx += cw; rw -= cw;
    } else {
      const chh = s / rw; let cx = rx;
      for (const c of rowItems) { const cw = c.a / chh; out.push(Object.assign(c, { x: cx, y: ry, w: cw, h: chh })); cx += cw; }
      ry += chh; rh -= chh;
    }
    rest = rest.slice(rowItems.length);
  }
  return out;
}
const LIBTOK = ['var(--c-s1)', 'var(--c-s2)', 'var(--c-s3)', 'var(--c-s4)', 'var(--c-s5)'];
function figTree(w, narrow) {
  const h = narrow ? 560 : 420, pad = 2;
  const o = [CH.open({ w, h, alt: 'A treemap of the release: one rectangle per library, its area proportional to its lines of Lean, split into its folders. Development holds most of it; Formalism, GroundTheory and ReciprocityTheory follow; the files that state the theorem are a sliver.' })];
  const libs = SS.libraries.filter((l) => l.lines > 1000).map((l) => ({ name: l.name, v: l.lines, l }));
  const tiny = SS.libraries.filter((l) => l.lines <= 1000);
  const tops = squarify(libs, 0, 0, w, h - 34);
  tops.forEach((t, i) => {
    const tok = i < LIBTOK.length ? LIBTOK[i] : 'var(--c-ctx)';
    const folders = t.l.folders.slice(0, 14).map((fo) => ({ name: fo.name, v: fo.lines, fo }));
    const restL = t.l.folders.slice(14).reduce((s, fo) => s + fo.lines, 0), restF = t.l.folders.slice(14).reduce((s, fo) => s + fo.files, 0);
    if (restL > 0) folders.push({ name: '(' + (t.l.folders.length - 14) + ' more folders)', v: restL, fo: { files: restF, lines: restL } });
    const cells = squarify(folders, t.x + pad, t.y + pad, Math.max(1, t.w - 2 * pad), Math.max(1, t.h - 2 * pad));
    for (const c of cells) {
      o.push('    <rect ' + CH.hit('class="tm-cell" x="' + c.x.toFixed(1) + '" y="' + c.y.toFixed(1) + '" width="' + Math.max(0, c.w - 1).toFixed(1) + '" height="' + Math.max(0, c.h - 1).toFixed(1) + '" fill="' + tok + '" opacity="0.82"',
        t.name + ' / ' + c.name, N(c.fo.files) + ' files · ' + N(c.fo.lines) + ' lines') + '/>');
    }
    o.push('    <rect x="' + t.x.toFixed(1) + '" y="' + t.y.toFixed(1) + '" width="' + t.w.toFixed(1) + '" height="' + t.h.toFixed(1) + '" fill="none" stroke="var(--paper)" stroke-width="3"/>');
    if (t.w > 70 && t.h > 30) {
      const fit = Math.max(3, Math.floor((t.w - 16) / 8.2));
      const nm = t.name.length > fit ? t.name.slice(0, fit - 1) + '…' : t.name;
      /* the label sits on its own plate (the page's surface), so it reads in either theme whatever grey the cell is */
      const sub = (t.l.lines / 1e6 >= 1 ? (t.l.lines / 1e6).toFixed(1) + 'M' : Math.round(t.l.lines / 1e3) + 'k') + ' lines';
      const pw = Math.min(t.w - 8, 16 + 7.6 * Math.max(nm.length, t.h > 46 ? sub.length : 0)), ph = t.h > 46 ? 40 : 22;
      o.push('    <rect x="' + (t.x + 4).toFixed(1) + '" y="' + (t.y + 4).toFixed(1) + '" width="' + pw.toFixed(1) + '" height="' + ph + '" rx="3" fill="var(--surface)" opacity="0.92" pointer-events="none"/>');
      o.push(CH.txt(t.x + 10, t.y + 19, nm, 't-lab', 'start', ' style="font-weight:600;pointer-events:none"'));
      if (t.h > 46) o.push(CH.txt(t.x + 10, t.y + 36, sub, 't-note', 'start', ' style="pointer-events:none"'));
    }
  });
  o.push(CH.txt(4, h - 12, narrow ? 'Main.lean + Statements.lean: 28 lines' : 'Too small to see: ' + tiny.map((l) => l.name + ' (' + N(l.lines) + ')').join(', ') + ' lines. The theorem itself: 28 lines.', 't-note', 'start'));
  o.push(CH.close);
  return o.join('\n');
}

/* ---------------------------------------------------------------- the planted errors (C1–C5), as cards */
const CTL = (row('C1-C5').controls) || {};
function ctlState(keys) {
  const xs = keys.map((k) => CTL[k]).filter(Boolean);
  if (xs.length < keys.length || xs.some((x) => x.exit === null || x.exit === undefined)) return 'pending';
  return xs.every((x) => x.refused) ? 'rejected' : 'accepted';
}
const PLANTED = [
  { id: 'C1', keys: ['C1'], t: 'A changed constant', code: ['s.re = 1 / 2', 's.re = 1 / 3'], diff: true, who: 'Comparator, the judge', say: '“the statements do not match”', why: 'The judge must notice when the theorem proved is not the theorem asked, even by one character.' },
  { id: 'C2', keys: ['C2', 'A1-C2'], t: 'A smuggled axiom', code: ['axiom cheat :', '  RiemannHypothesis', 'theorem', '  riemannHypothesis', '  := cheat'], who: 'Comparator and Lean’s axiom report', say: '“illegal axiom: cheat”', why: 'Assuming RH and calling it a proof must be caught by two different tools.' },
  { id: 'C3', keys: ['C3', 'A1-C3'], t: 'A missing proof', code: ['theorem', '  riemannHypothesis', '  := sorry'], who: 'Comparator and Lean’s axiom report', say: '“illegal axiom: sorryAx”', why: 'Lean’s placeholder for “proof goes here” must never pass as a proof.' },
  { id: 'C4', keys: ['C4'], t: 'A hijacked definition', code: ['def', '  RiemannZetaZerosOnLine', '  : Prop := True'], who: 'Comparator, the judge', say: '“the statements do not match”', why: 'Redefining the statement as something trivially true must not slip past.' },
  { id: 'C5', keys: ['C5'], t: 'A corrupted proof', code: ['riemannHypothesis', '  : False', '-- proof unchanged'], who: 'nanoda, the second kernel', say: 'a type mismatch', why: 'The release’s own exported proof, with its theorem re-typed as False, must fail in the independent kernel.' }
];
function plantedCards() {
  const word = { pending: 'running', rejected: 'rejected', accepted: 'ACCEPTED: the judge failed' };
  return '<div class="wide"><div class="pe-grid" role="list">' + PLANTED.map((p, i) => {
    const st = ctlState(p.keys);
    const code = p.diff
      ? '<code class="pe-code"><span class="pe-old">' + C.esc(p.code[0]) + '</span><span class="pe-new">' + C.esc(p.code[1]) + '</span></code>'
      : '<code class="pe-code">' + p.code.map((l) => '<span class="pe-new">' + C.esc(l) + '</span>').join('') + '</code>';
    return '<div class="pe-card pe-' + st + '" role="listitem" style="--i:' + i + '">'
      + '<div class="pe-head"><span class="pe-id">' + p.id + '</span><span class="pe-t">' + C.esc(p.t) + '</span></div>'
      + code
      + '<p class="pe-why">' + C.esc(p.why) + '</p>'
      + '<p class="pe-who"><span>must say no</span>' + C.esc(p.who) + ': ' + C.esc(p.say) + '</p>'
      + '<p class="pe-st" aria-label="state">' + (st === 'rejected' ? '✕ ' : st === 'pending' ? '◌ ' : '! ') + C.esc(word[st]) + '</p>'
      + '</div>';
  }).join('') + '</div></div>';
}

/* ---------------------------------------------------------------- how much of the release the proof uses (census) */
const LIBROOTS = ['Mathlib', 'Init', 'Std', 'Batteries', 'Aesop', 'Lean', 'Qq', 'ProofWidgets', 'Plausible', 'LeanSearchClient', 'ImportGraph', '_current'];
function figUse(w, narrow) {
  const mods = census.modules_by_root_parsed || null, cons = census.constants_by_root_parsed || null;
  const relMods = mods ? mods.filter(([r]) => !LIBROOTS.includes(r)).reduce((s, [, n]) => s + n, 0) : null;
  const libMods = mods ? mods.filter(([r]) => LIBROOTS.includes(r)).reduce((s, [, n]) => s + n, 0) : null;
  const relCons = cons ? cons.filter(([r]) => !LIBROOTS.includes(r)).reduce((s, [, n]) => s + n, 0) : null;
  const libCons = cons ? cons.filter(([r]) => LIBROOTS.includes(r)).reduce((s, [, n]) => s + n, 0) : null;
  const h = (narrow ? 180 : 186) + (cons ? 40 : 0), x0 = narrow ? 16 : 30, bw = w - x0 * 2, bh = narrow ? 30 : 34;
  const o = [CH.open({ w, h, alt: 'Two bars. The first is the release’s ' + N(SS.files) + ' files; the part the five theorems’ compiled proof actually reaches is filled' + (relMods === null ? ' once the census has run' : ': ' + N(relMods) + ' files') + '. The second splits the declarations the proof uses between Mathlib and the release' + (relCons === null ? ', measured by the same census' : ': ' + N(libCons) + ' from the libraries and ' + N(relCons) + ' from the release') + '.' })];
  let y = 30;
  o.push(CH.txt(x0, y - 10, 'THE RELEASE: ' + N(SS.files) + ' FILES', 't-ax', 'start', ' style="letter-spacing:.06em"'));
  o.push('    <rect x="' + x0 + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="4" fill="var(--mark)"/>');
  if (relMods !== null) {
    const fw = Math.max(2, bw * relMods / SS.files);
    o.push('    <rect class="use-fill" ' + CH.hit('x="' + x0 + '" y="' + y + '" width="' + fw.toFixed(1) + '" height="' + bh + '" rx="4" fill="var(--sig)"', 'files the proof reaches', N(relMods) + ' of ' + N(SS.files) + ' (' + (100 * relMods / SS.files).toFixed(1) + '%) · computed by the census') + '/>');
    o.push(CH.txt(x0, y + bh + 18, N(relMods) + ' files (' + (100 * relMods / SS.files).toFixed(1) + '%) are reached by the proof of the five theorems', 't-lab', 'start'));
  } else {
    o.push('    <rect x="' + x0 + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="4" fill="var(--mark)" opacity="0.6"/>');
    o.push(CH.txt(x0, y + bh + 18, narrow ? 'how much the proof reaches: running' : 'how much of it the proof actually reaches: measured by the census (running)', 't-note', 'start'));
  }
  y += bh + (narrow ? 70 : 64);
  o.push(CH.txt(x0, y - 10, narrow ? 'DECLARATIONS THE PROOF USES' : 'DECLARATIONS THE PROOF TERM USES, BY WHERE THEY LIVE', 't-ax', 'start', ' style="letter-spacing:.06em"'));
  if (relCons !== null && libCons !== null) {
    const tot = relCons + libCons, lw = bw * libCons / tot;
    o.push('    <rect ' + CH.hit('x="' + x0 + '" y="' + y + '" width="' + lw.toFixed(1) + '" height="' + bh + '" fill="var(--c-s4)"', 'from Mathlib and Lean’s own libraries', N(libCons) + ' declarations') + '/>');
    o.push('    <rect ' + CH.hit('x="' + (x0 + lw).toFixed(1) + '" y="' + y + '" width="' + (bw - lw).toFixed(1) + '" height="' + bh + '" fill="var(--sig)"', 'from the release', N(relCons) + ' declarations') + '/>');
    o.push(CH.txt(x0, y + bh + 18, 'Mathlib and Lean: ' + N(libCons), 't-note', 'start'));
    o.push(CH.txt(x0 + bw, y + bh + 18, 'the release: ' + N(relCons), 't-lab', 'end'));
    o.push(CH.txt(x0, y + bh + 40, 'in all ' + N(tot) + ' declarations, every one checked by the kernel', 't-note', 'start'));
  } else {
    o.push('    <rect x="' + x0 + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="4" fill="none" stroke="var(--rule-strong)" stroke-dasharray="2 3"/>');
    o.push(CH.txt(x0 + bw / 2, y + bh / 2 + 4, narrow ? 'running' : 'Mathlib’s share and the release’s share: running', 't-note', 'middle'));
  }
  o.push(CH.close);
  return o.join('\n');
}

/* ---------------------------------------------------------------- the route inside the proof */
const NI = (R.computed && R.computed.nielsen) || {};
const WF = (R.computed && R.computed.wordfacts) || {};
function niWord(name) {
  /* the census's NIELSEN probe for this name (amendment A10), as the checker parsed it; running until phase 2 */
  if (!nielsenRan || !NI[name]) return 'is it in the compiled proof? running';
  return NI[name].in_closure > 0 ? 'in the compiled proof (' + NI[name].in_closure + ' constant' + (NI[name].in_closure > 1 ? 's' : '') + ' of that name)' : 'not in the compiled proof of the five theorems';
}
function figRoute(w, narrow) {
  const nodes = [
    { k: 'Main.lean', v: 'riemannHypothesis : RiemannHypothesis', d: 'The headline: Mathlib’s RH, no hypotheses. 12 lines.', t: 'route' },
    { k: 'rhOfAll → rh_of_every', v: 'RH from Dirichlet nonvanishing', d: 'If no Dirichlet L-function vanishes right of 1/2, ζ (modulus 1) has no zero there; ζ’s functional equation handles the left half.', t: 'route' },
    { k: 'everyCharacter', v: 'no zeros right of 1/2, every character', d: 'Every Dirichlet L-function is nonzero for Re s > 1/2 (the principal one away from s = 1). All the weight is here.', t: 'route' },
    { k: 'zeroFree_of_rpow_window', v: 'a window criterion', d: 'A one-sided bound for a smoothed sum over windows [Y, Y^(1+δ)], Y as large as you like, rules out zeros past the bound’s exponent; the exponent is pushed to 1/2. 30 files, 2,475 lines — small enough to read.', t: 'route' },
    { k: 'the divisor link', v: 'height = formula (by rfl) + two inequalities', d: 'Takes a height equation that holds by definition and two inequalities passed separately (P.wordFacts), built from about 40 matrix-norm, covolume and valuation estimates. This is where the content must be.', t: 'key' },
    { k: 'Row', v: 'a Galois-representation statement', d: 'The arithmetic input, proved inside the release under the name Row; whether it is the literature theorem it is named after is a reading question.', t: 'route' }
  ];
  const side = [
    { k: 'anyGeometry', v: ':= fun _ _ _ => True', d: 'The geometric condition passed where the bundle needs a certificate is the predicate True (Nielsen; confirmed).', n: 'anyGeometry' },
    { k: 'divXFl', v: 'a degenerate model, iMj = 0', d: 'The geometric witness: sections are the whole space, degrees 0, the lattice-to-sections map is zero (Nielsen; confirmed).', n: 'divXFl' },
    { k: 'siegel_eisenstein_simple_pole', v: 'proves True', d: 'A theorem named for a simple pole proves GlobalTheory.Published.UnusedSlot72, which is True (Astra; confirmed).', n: 'siegel_eisenstein_simple_pole' },
    { k: 'OpenLiteratureStatements', v: '⟨h, recTExists, h⟩', d: 'Two inputs named for two papers are the same proposition (Astra; confirmed).', n: null }
  ];
  const h = narrow ? 806 : 524, bw = narrow ? w - 32 : 380, bh = narrow ? 58 : 62, x = narrow ? 16 : 30;
  const o = [CH.open({ w, h, alt: 'The route of the proof as a chain of six boxes from Main.lean down to the arithmetic input, the divisor link highlighted; beside it four dotted boxes for parts that are named for deep mathematics but are vacuous: a geometry predicate that is True, a degenerate geometric model with a zero map, a theorem named for a simple pole that proves True, and two literature inputs that are one statement.' })];
  o.push('    <defs><marker id="rta" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="var(--ink-3)"/></marker></defs>');
  const gapY = narrow ? 18 : 22;
  nodes.forEach((nd, i) => {
    const y = 16 + i * (bh + gapY);
    const key = nd.t === 'key';
    o.push('    <g ' + CH.hit('class="rt-node"', nd.k, nd.d) + '><rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="6" fill="var(--surface)" stroke="' + (key ? 'var(--held)' : 'var(--rule-strong)') + '" stroke-width="' + (key ? 2.2 : 1.2) + '"/>'
      + CH.txt(x + 14, y + 22, nd.k, 't-lab', 'start', ' style="font-family:var(--f-mono);font-size:12.5px"')
      + CH.txt(x + 14, y + bh - 14, nd.v, 't-note', 'start') + '</g>');
    if (i < nodes.length - 1) o.push('    <path d="M' + (x + 40) + ' ' + (y + bh) + ' L' + (x + 40) + ' ' + (y + bh + gapY - 2) + '" stroke="var(--ink-3)" stroke-width="1.3" fill="none" marker-end="url(#rta)"/>');
  });
  const sx = narrow ? 16 : 460, sw2 = narrow ? w - 32 : w - 490;
  const sy0 = narrow ? 16 + nodes.length * (bh + gapY) + 46 : 30;
  if (narrow) { o.push(CH.txt(sx, sy0 - 26, 'NAMED FOR DEEP MATHEMATICS,', 't-ax', 'start', ' style="letter-spacing:.06em"')); o.push(CH.txt(sx, sy0 - 10, 'VACUOUS IN THE CODE', 't-ax', 'start', ' style="letter-spacing:.06em"')); }
  else o.push(CH.txt(sx, sy0 - 10, 'NAMED FOR DEEP MATHEMATICS, VACUOUS IN THE CODE', 't-ax', 'start', ' style="letter-spacing:.06em"'));
  side.forEach((sd, i) => {
    const y = sy0 + i * (narrow ? 72 : 96);
    const s = W.stroke(W.CHOSEN, { width: 1.6 });
    o.push('    <g ' + CH.hit('class="rt-side"', sd.k, sd.d + (sd.n ? ' · ' + niWord(sd.n) : '')) + '><rect class="' + s.class + '" x="' + sx + '" y="' + y + '" width="' + sw2 + '" height="' + (narrow ? 56 : 62) + '" rx="6" fill="none" stroke="var(--warn)" stroke-width="1.6" stroke-dasharray="' + W.stroke(W.CHOSEN, { width: 1.6 }).dash + '" stroke-linecap="round"/>'
      + CH.txt(sx + 14, y + 22, sd.k, 't-lab', 'start', ' style="font-family:var(--f-mono);font-size:12px"')
      + CH.txt(sx + 14, y + (narrow ? 42 : 46), sd.v, 't-note', 'start') + '</g>');
    if (!narrow && sd.n) o.push(CH.txt(sx + sw2 - 12, y + 46,nielsenRan && NI[sd.n] ? (NI[sd.n].in_closure > 0 ? 'in the proof term' : 'not in the proof term') : 'in the proof term? running', 't-note', 'end', ' style="font-size:11px"'));
  });
  o.push(CH.close);
  return o.join('\n');
}

/* ---------------------------------------------------------------- the bridges */
function figBridge(w, narrow) {
  const h = narrow ? 690 : 400;
  const o = [CH.open({ w, h, alt: 'Three boxes: the August release (at least two thirds of the zeros simple and on the line), today’s release (RH and GRH for Dirichlet L-functions) and Masullo’s draft (GRH for every number field, main theorem not yet written). Arrows between them: the August proof re-checked on today’s Mathlib; combined with RH, its 5/6 bound for distinct zeros moves onto the critical line; and Masullo’s claim, as read here, implies today’s statements and adds simple zeros.' })];
  o.push('    <defs><marker id="bra" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="var(--ink-3)"/></marker></defs>');
  const bw = narrow ? w - 32 : 300, bh = 118;
  const B = narrow
    ? [{ x: 16, y: 16, w: bw, h: bh }, { x: 16, y: 252, w: bw, h: bh }, { x: 16, y: 488, w: bw, h: bh }]
    : [{ x: 20, y: 20, w: bw, h: bh }, { x: w / 2 - bw / 2, y: 236, w: bw, h: bh }, { x: w - 20 - bw, y: 20, w: bw, h: bh }];
  const a1st = ALL.find((z) => z.id === 'A1').st;
  const boxes = [
    { k: 'August 2026 · Anthropic', t: '≥ 2/3 of the zeros', s: 'simple and on the critical line', f: status('P0') === 'decided' ? '✓ re-checked here on today’s Mathlib' : 'being re-checked here', st: status('P0') },
    { k: '20 November · Alpöge', t: 'RH, and GRH for Dirichlet', s: 'every zero on the critical line', f: a1st === 'decided' ? '✓ checked here' : 'being checked here (running)', st: a1st },
    { k: '20 November · Masullo', t: 'GRH, every number field', s: 'a draft, 940 pages', f: 'main theorem not yet written', st: 'read' }
  ];
  boxes.forEach((b, i) => {
    const p = B[i];
    const dotted = i === 2;
    o.push('    <rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '" rx="8" fill="var(--surface)" stroke="' + (dotted ? 'var(--ink-3)' : b.st === 'decided' ? 'var(--sig)' : 'var(--rule-strong)') + '" stroke-width="' + (b.st === 'decided' && !dotted ? 1.8 : 1.4) + '"' + (dotted ? ' stroke-dasharray="' + W.stroke(W.CHOSEN, { width: 1.6 }).dash + '" stroke-linecap="round"' : '') + '/>');
    o.push(CH.txt(p.x + 14, p.y + 22, b.k.toUpperCase(), 't-ax', 'start', ' style="letter-spacing:.06em"'));
    o.push(CH.txt(p.x + 14, p.y + 52, b.t, 't-lab', 'start', ' style="font-size:15px;font-weight:600"'));
    o.push(CH.txt(p.x + 14, p.y + 74, b.s, 't-note', 'start'));
    o.push(CH.txt(p.x + 14, p.y + 100, b.f, b.st === 'decided' ? 't-lab' : 't-note', 'start', ' style="font-size:11.5px"'));
  });
  /* the arrows and their words; on the wide figure the words sit outside each curve, never over a box */
  const L = (lines, x, y, anchor, run) => (run ? lines.concat(['(running)']) : lines).map((t, j) => CH.txt(x, y + j * 16, t, 't-note', anchor)).join('\n');
  const edges = narrow
    ? [{ d: 'M' + (w / 2) + ' ' + (16 + bh + 2) + ' L' + (w / 2) + ' 248', lines: ['with RH: 5/6 of the', 'zeros distinct AND', 'on the line'], lx: w / 2 + 10, ly: 162, a: 'start', st: status('BRu') },
       { d: 'M' + (w / 2) + ' 484 L' + (w / 2) + ' ' + (252 + bh + 4), lines: ['read for ℚ: implies', 'these statements,', 'plus simple zeros'], lx: w / 2 + 10, ly: 400, a: 'start', st: status('BRc+MB') }]
    : [{ d: 'M170 ' + (20 + bh + 2) + ' C170 236 220 295 ' + (w / 2 - bw / 2 - 4) + ' 295', lines: ['with RH: 5/6 of the', 'zeros distinct AND', 'on the line'], lx: 156, ly: 186, a: 'end', st: status('BRu') },
       { d: 'M' + (w - 170) + ' ' + (20 + bh + 2) + ' C' + (w - 170) + ' 236 ' + (w - 220) + ' 295 ' + (w / 2 + bw / 2 + 4) + ' 295', lines: ['read for ℚ: implies', 'these statements,', 'plus simple zeros'], lx: w - 156, ly: 186, a: 'start', st: status('BRc+MB') }];
  for (const e of edges) {
    const s = e.st === 'decided' ? W.stroke(W.DECIDED, { width: 2 }) : null;
    o.push('    <path class="br-edge ' + (s ? s.class : 'w-none') + '" d="' + e.d + '" fill="none" stroke="' + (e.st === 'decided' ? 'var(--sig)' : 'var(--ink-5)') + '" stroke-width="2"' + (e.st === 'decided' ? '' : ' stroke-dasharray="2 3"') + ' marker-end="url(#bra)"/>');
    o.push(L(e.lines, e.lx, e.ly, e.a, e.st !== 'decided'));
  }
  o.push(CH.legend([{ token: 'var(--sig)', t: 'proved in Lean, checked here' }, { token: 'var(--ink-3)', kind: 'guide', t: 'running' }, { token: 'var(--ink-3)', kind: 'dot', t: 'a reading of a draft' }], narrow ? 16 : 30, h - 10, null, w - 60));
  o.push(CH.close);
  return o.join('\n');
}

/* a non-hero figure with a phone drawing: components.figure swaps only heroes, so the page carries the same rule for its
   other figures (.dual, in STYLE); the phone drawing's ids are suffixed so no id (hatch, arrowheads) appears twice */
const dual = (wide, narrow) => '<div class="dual"><div class="hv-w">\n' + wide + '\n</div><div class="hv-n">\n'
  + narrow.replace(/id="([\w-]+)"/g, 'id="$1-n"').replace(/url\(#([\w-]+)\)/g, 'url(#$1-n)') + '\n</div></div>';

/* ---------------------------------------------------------------- the release timeline (hero, while the run is a draft)
   Every state is read from the ring's checks (status.js); the build's count is the record's computed.b1_progress, a count
   pulled from the pod; the one projection on the page (the build's end) is labelled "projected" and set in italics, so a
   projected time never reads like a decided one. */
/* the timestamp's state, read from the proof file itself: a Bitcoin block-header attestation, or only calendar ones */
const OTS_BTC = fs.readFileSync(path.join(ROOT, DIR + 'timestamps/rules-2026-11-21.txt.ots')).includes(Buffer.from('0588960d73d71901', 'hex'));
const PRE = fs.readFileSync(path.join(ROOT, 'notes', 'alpoge-grh-preregistration-2026-11-20.md'), 'utf8');
const AMENDMENTS = (PRE.match(/^## Amendment A\d+/gm) || []).length;
const B1P = (R.computed && R.computed.b1_progress) || {};
const hhmm = (iso) => iso.slice(11, 16) + ' UTC';
function timeline() {
  const STAGES = [
    { t: 'Rules first', rows: [], d: 'Every check and the rule that decides it, in public before it runs — ' + AMENDMENTS + ' dated amendments since.' },
    { t: 'Files and statement', rows: ['I1', 'I2', 'SCAN', 'M1', 'F1', 'F2', 'SPEC', 'CHAR', 'ROUTE', 'P0', 'BRc+MB'], d: 'The announced files, no shortcut in the source, and the theorem proved to be the textbook RH.' },
    { t: 'The build', rows: ['B1', 'MI', 'RB'], d: 'Lean compiles all 175,187 files; its kernel checks every step on the way.' },
    { t: 'Axioms, judge, planted errors', rows: ['A1', 'S1', 'C1-C5', 'NIELSEN', 'WORDFACTS'], d: 'What the proof rests on, whether it states exactly our statement, and five planted errors that must be caught.' },
    { t: 'Three kernels', rows: ['K2', 'KR', 'K3'], d: 'nanoda, Lean’s own replay and con-leche each re-check the whole proof.' },
    { t: 'Clean machine, bridge', rows: ['CR', 'BRu'], d: 'A machine that never ran the release re-checks it; the August proof and this one combined.' },
    { t: 'The full verification', rows: [], final: true, d: 'Every verdict, the gaps first, and a kit to re-run all of it yourself.' }
  ];
  const stOfId = (id) => (ALL.find((z) => z.id === id) || { st: status(id) }).st;
  let nowSeen = false;
  const st = STAGES.map((S) => {
    if (S.final) return pending.length === 0 && FINAL ? 'done' : 'planned';
    if (!S.rows.length) return 'done';
    if (S.rows.every((id) => stOfId(id) !== 'pending')) return 'done';
    if (!nowSeen) { nowSeen = true; return 'now'; }
    return 'next';
  });
  const WORDS = { done: 'done', now: 'running now', next: 'next', planned: 'when every check has a verdict' };
  let prog = '';
  const bi = 2;
  if (st[bi] === 'now' && B1P.built && stOfId('B1') === 'pending') {
    const pct = Math.floor(100 * B1P.built / B1P.of);
    const mins = (Date.parse(B1P.at) - Date.parse(B1P.started)) / 60000, rate = B1P.built / mins;
    const eta = new Date(Date.parse(B1P.at) + (B1P.of - B1P.built) / rate * 60000).toISOString();
    prog = '<div class="tl-bar" role="img" aria-label="' + C.escAttr(pct + '% of the files compiled') + '"><span style="width:' + pct + '%"></span></div>'
      + '<p class="tl-count"><b>' + N(B1P.built) + '</b> of ' + N(B1P.of) + ' files compiled at ' + C.esc(hhmm(B1P.at)) + ' · ' + B1P.failed + ' errors · ' + B1P.sorry + ' sorry</p>'
      + '<p class="tl-proj">projected end of the build: about ' + C.esc(hhmm(eta)) + ', at its average pace so far (' + Math.round(rate) + ' files a minute)</p>';
  }
  return '<section class="tl" aria-label="The release timeline"><div class="tl-head"><span class="tl-k">Building the full verification</span>'
    + '<span class="tl-sub">' + C.esc(done.length + ' of ' + ALL.length + ' checks done. Results land on this page as each check finishes; the full record goes out when the last one has a verdict.') + '</span></div>'
    + '<ol class="tl-rail">' + STAGES.map((S, i) => '<li class="tl-step tl-' + st[i] + '"><span class="tl-dot" aria-hidden="true"></span>'
      + '<span class="tl-n">' + (i + 1) + '</span><span class="tl-t">' + C.esc(S.t) + '</span><span class="tl-st">' + C.esc(WORDS[st[i]]) + '</span>'
      + '<span class="tl-d">' + C.esc(S.d) + '</span>' + (i === bi ? prog : '') + '</li>').join('') + '</ol></section>';
}

/* ---------------------------------------------------------------- the page */
const TITLE_FINAL = 'Alpöge’s Lean proof of the Riemann Hypothesis, checked';
const TITLE_DRAFT = 'Alpöge’s Lean proof of RH: the right statement. Now, the proof.';
const TITLE = pending.length ? TITLE_DRAFT : TITLE_FINAL;
const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · generated from the record' + (pending.length ? ' · DRAFT' : ''),
  title: TITLE,
  deck: 'On 20 November 2026 Levent Alpöge announced a proof of the Riemann Hypothesis, made with Claude and released only as a computer proof: 175,187 files of Lean, a language in which a small program, the kernel, checks every step. '
    + (pending.length
      ? 'Done: the files are the announced ones, and Lean proofs show that the statement is exactly the textbook RH, even with ζ defined by its series rather than by Mathlib. Running now: the replay of every file, the statement judge, three kernels (two of them written independently of Lean) and five planted errors the checkers must catch. '
      : 'Here is everything we checked about it, in plain words: that the files are the announced ones, that they compile, that the theorem says exactly what mathematicians mean by RH, that several independent checkers accept the proof, and that those checkers do catch errors we planted. ')
    + 'What a computer check cannot tell you is said just as plainly.'
}));
O.push('<div class="col">' + (pending.length ? '<p class="draft-note"><b>Draft.</b> ' + C.esc(pending.length + ' of ' + ALL.length + ' checks are still running. Every check and the rule that decides it were published before that check ran. This page rebuilds from the record as results arrive.') + '</p>' : '')
  + '<p class="upd">Last updated ' + C.esc(LAST) + ' · <a href="#changes">changes to this page</a></p></div>');
if (pending.length) O.push('<div class="wide">' + timeline() + '</div>');
O.push(C.figure({ hero: true, svgRaw: figWheel(900, false), svgNarrowRaw: figWheel(360, true), record: [REC, DIR + 'readings.json', DIR + 'route-reading.json'],
  caption: 'Every check on this page, as one ring. Each arc is one check; hover or tap it for what it is. Solid arcs are decided by a program; dashed arcs are counts and comparisons computed by a program; dotted arcs are careful readings by a person or a model, which no program decides. Grey arcs are still running.',
  stop: 'a check drawn as done is not done in the record' }));
O.push('<div class="col">' + W.legendHtml({ compact: true }) + '</div>');
O.push(C.stats([
  { k: 'files of Lean', v: N(SS.files), n: N(SS.lines) + ' lines; the theorem itself is stated in 28' },
  { k: 'checks done', v: done.length + ' of ' + ALL.length, n: pending.length ? pending.length + ' still running' : 'none running' },
  { k: 'axioms the proof uses', v: status('A1') === 'decided' ? '3' : '…', n: status('A1') === 'decided' ? 'propext, Classical.choice, Quot.sound — the standard three' : 'the report is still running' },
  { k: 'planted errors caught', v: status('C1-C5') === 'decided' ? '5 of 5' : '…', n: 'a judge that cannot fail proves nothing' }
]));
O.push(C.scope('This page checks a computer proof: whether the files compile, what the theorem says, and whether independent checkers accept it. It does not judge the mathematics as mathematics, and it is not a refereed review.'));

/* 1 · what is claimed */
O.push(C.section({ lab: '1 · what is claimed', title: 'One sentence about where ζ vanishes', id: 'claim', wide: true, bodyRaw:
  '<div class="col">' + C.plainList([
    { b: 'The Riemann Hypothesis.', text: 'The zeta function ζ(s) is zero at s = −2, −4, −6, … (the “trivial” zeros) and at infinitely many other points, all inside the vertical band 0 < Re s < 1. RH says all those other zeros lie exactly on the middle line, Re s = 1/2. It controls how evenly the primes are spread.' },
    { b: 'What the proof states.', raw: C.esc('The headline theorem is ') + '<span class="m">riemannHypothesis : RiemannHypothesis</span>' + C.esc(', where RiemannHypothesis is Mathlib’s own definition, written years before this proof: every zero of ζ, except the trivial ones and the point s = 1, has real part 1/2.') },
    { b: 'Is that really RH?', text: 'Two readers from two model families say yes. More: we wrote RH a second way, the textbook way (“every zero in the critical strip has real part 1/2”), and proved in Lean that the two statements are equivalent. That turns a reading into a proof.' },
    { b: 'Even without Mathlib’s ζ.', text: 'One step further: we defined ζ and the L-functions the way a textbook does — the functions given by the series 1 + 2^−s + 3^−s + … (and χ(n)·n^−s) that continue smoothly to the rest of the plane — and proved in Lean that the release’s statements say exactly the same thing about them' + (status('CHAR') === 'decided' ? '.' : ' (running).') + ' The statement no longer depends on how Mathlib happens to define ζ.' }
  ]) + '</div>'
  + '<div class="wide zp-wrap">' + planeButtons + '</div>'
  + C.figure({ svgRaw: dual(figPlane(900, false), figPlane(360, true)), record: ['instruments/alpoge-grh/spec/Spec.lean', DIR + 'runs-spec/spec-axioms.out', DIR + 'readings.json'],
    caption: 'The complex plane, where RH lives. The band is the critical strip; the line in it is Re s = 1/2, with the first five zeros of ζ drawn on it (published values, not computed here). The dots on the left are the trivial zeros; the ring at 1 is ζ’s pole. ζ has no zeros right of the band (the grey region). Use the buttons: Mathlib’s definition and the textbook form talk about the same zeros, and a Lean proof says so.',
    stop: 'the equivalence proof no longer compiles on the three standard axioms' })
  + '<div class="col">' + C.plainList([
    { b: 'And GRH?', text: 'Four more theorems say the same for Dirichlet L-functions, the relatives of ζ that count primes in arithmetic progressions: every modulus, every character. That is the usual meaning of the Generalized Riemann Hypothesis. It is not the “Extended” RH for other number fields, which the announcement expects “with more time”.' }
  ]) + '</div>' }));

/* 2 · how big */
O.push(C.section({ lab: '2 · how big is it', title: '17 million lines, one theorem', id: 'size', wide: true, bodyRaw:
  C.figure({ svgRaw: dual(figTree(900, false), figTree(360, true)), record: [DIR + 'source-stats.json', DIR + 'PINS.json'],
    caption: 'The release, drawn by size: each rectangle is a library, its area proportional to its lines of Lean, split into its folders. Hover for counts. Nobody can read this by hand; the point of Lean is that nobody has to — a small, trusted kernel checks every line.',
    stop: 'the counts are not of the pinned archive' })
  + '<div class="col">' + C.plainList([
    { b: 'Why a computer check matters.', text: 'A human-readable version of this argument would run past 250,000 pages, the author says. A proof this size can only be trusted the way a large program is trusted: by machines that check every step, written by different people, agreeing.' },
    { b: 'How much of it carries the proof?', text: 'Not every file has to matter. Once everything is compiled we walk the finished proof of the five theorems, declaration by declaration, and count what it really reaches — in the release and in Mathlib.' }
  ]) + '</div>'
  + C.figure({ svgRaw: dual(figUse(900, false), figUse(360, true)), record: [REC, DIR + 'source-stats.json'],
    caption: 'What the compiled proof reaches. The top bar is the whole release; the filled part is the files the proof of the five theorems uses. The bottom bar splits the declarations it uses between Mathlib (and Lean’s own libraries) and the release. Both are counts made by a program walking the compiled proof.',
    stop: 'a count drawn here is not in the record' }) }));

/* 3 · the chain of checks (the page's one schematic) */
const fst = (id) => { const s = ALL.find((z) => z.id === id); return s ? s.st : status(id); };
const standing = (st) => st === 'decided' ? W.DECIDED : st === 'computed' ? W.COMPUTED : undefined;
const roleOf = (st) => st === 'decided' ? 'sig' : st === 'pending' ? 'dep' : st === 'refused' || st === 'refuted' ? 'warn' : 'held';
/* the chain, as a list with every step's explanation printed beside it (no click needed): a box per step, solid when the
   record has decided it, dashed while it runs; a spine joins the boxes and a point travels down it */
const STEPS = [
    { id: 'bytes', role: roleOf(fst('I1')), standing: standing(fst('I1')), k: '1 · THE FILES · ' + WORD[fst('I1')].toUpperCase(), v: 'the 14 announced parts', t: 'the files', d: 'The archive is fetched from alpo.ge and every part checked against the checksums recorded the day it appeared. Three fetches, from two continents, gave the same bytes.' },
    { id: 'build', role: roleOf(fst('B1')), standing: standing(fst('B1')), k: '2 · THE BUILD · ' + WORD[fst('B1')].toUpperCase(), v: '175,187 files compile', t: 'the build', d: 'Lean compiles every file. Compiling already runs the kernel on every declaration; an error anywhere would stop it.' },
    { id: 'ax', role: roleOf(fst('A1')), standing: standing(fst('A1')), k: '3 · THE AXIOMS · ' + WORD[fst('A1')].toUpperCase(), v: 'only the standard three', t: 'the axioms', d: 'Lean reports which axioms each theorem ultimately rests on. Anything beyond propext, Classical.choice and Quot.sound — or the placeholder sorry — would be a hole.' },
    { id: 'kern', role: roleOf(fst('K2')), standing: standing(fst('K2')), k: '4 · SECOND KERNEL · ' + WORD[fst('K2')].toUpperCase(), v: 'nanoda re-checks it all', t: 'a second kernel', d: 'The whole proof is exported and re-checked by nanoda, a kernel written independently in another language. A bug in Lean’s kernel would have to be repeated there.' },
    { id: 'judge', role: roleOf(fst('S1')), standing: standing(fst('S1')), k: '5 · THE JUDGE · ' + WORD[fst('S1')].toUpperCase(), v: 'our statement = theirs', t: 'the judge', d: 'Comparator, Lean’s official judge, checks that the proved theorems state exactly what our own statement file says, word for word, using Mathlib only — so no definition in the release can change their meaning.' },
    { id: 'ctl', role: roleOf(fst('C1-C5')), standing: standing(fst('C1-C5')), k: '6 · PLANTED ERRORS · ' + WORD[fst('C1-C5')].toUpperCase(), v: 'five wrong versions out', t: 'planted errors', d: 'A judge that never says no proves nothing. We planted five errors — a changed constant, a smuggled axiom, a missing proof, a hijacked definition, a corrupted proof — and every one must be rejected.' },
    { id: 'what', role: 'held', k: '7 · WHAT IT MEANS', v: 'a formal proof of RH', t: 'what it means', d: 'If every check passes, independent kernels accept a proof of exactly the textbook RH from the three standard axioms. That is the strongest evidence a computer can give; it is not a human understanding of why the proof works.' }
];
const stepState = (n) => n.id === 'what' ? 'held' : n.role === 'sig' ? 'decided' : n.role === 'dep' ? 'pending' : n.role === 'warn' ? 'refused' : 'held';
const SCH = C.figure({ record: [REC],
  svgRaw: '<ol class="ch" aria-label="The checks as a chain, in order">' + STEPS.map((n, i) => {
    const st = stepState(n), parts = n.k.split(' · ');
    const word = /RUNNING|DECIDED|REFUSED|REFUTED|COMPUTED|READ/.test(parts[parts.length - 1]) ? parts.pop() : null;
    return '<li class="ch-step ch-' + st + '">'
      + (i < STEPS.length - 1 ? '<span class="ch-flow" aria-hidden="true" style="animation-delay:' + (-i * 0.55).toFixed(2) + 's"></span>' : '')
      + '<div class="ch-box"><span class="ch-k">' + C.esc(parts.join(' · ')) + (word ? ' · <span class="ch-st">' + C.esc(word.toLowerCase()) + '</span>' : '') + '</span>'
      + '<span class="ch-v">' + C.esc(n.v) + '</span></div>'
      + '<p class="ch-d">' + C.esc(n.d) + '</p></li>';
  }).join('') + '</ol>',
  caption: 'How a computer checks a proof, in seven steps. A box is outlined bright when the record has decided its step, and faint while it still runs.',
  stop: 'a step drawn as decided is not CERTIFIED in the record' });
O.push(C.section({ lab: '3 · how a computer checks it', title: 'Seven steps, each able to say no', id: 'chain', wide: true, bodyRaw: SCH }));

/* 4 · the checks, one by one */
const TABROWS = ALL.map((x) => [x.t, x.g, { raw: C.tag(WORD[x.st], x.st === 'decided' ? 'held' : x.st === 'pending' || x.st === 'dropped' ? 'open' : x.st === 'refused' || x.st === 'refuted' ? 'dep' : 'cert') }, x.d]);
O.push(C.section({ lab: '4 · every check', title: 'The ' + ALL.length + ' checks, one by one', id: 'checks', wide: true, bodyRaw:
  '<div class="col">' + C.p('Every arc of the ring above is one check. Each was written down, with the rule that decides it, before it ran.')
  + C.plainList([{ b: 'A judge that cannot say no proves nothing.', text: 'So we planted five wrong versions of the proof, each wrong in a different way, and ran them through the same judges. Every one must be rejected — and if any is accepted, the whole run is void.' }]) + '</div>'
  + plantedCards()
  + '<div class="wide"><details class="more"><summary>All ' + ALL.length + ' checks, one by one</summary>' + C.table({ cols: [{ h: 'Check' }, { h: 'Group' }, { h: 'State' }, { h: 'What it means' }], rows: TABROWS }) + '</details></div>'
  + '<div class="col">' + C.plainList([
    { b: 'Written down first.', raw: C.esc('Every check and the rule that decides it were committed in public before that check ran, and every later change is dated: ') + rec('notes/alpoge-grh-preregistration-2026-11-20.md') + C.esc(' (' + AMENDMENTS + ' amendments) and ') + rec(DIR + 'DEVIATIONS.md') + C.esc('.') },
    { b: 'Attacked three times.', text: 'Astra 6.2, a model from another family, red-teamed the plan three times. Its first round found a real defect in our own setup — the judge was configured to accept any body for four definitions — fixed before anything ran.' }
  ]) + '</div>' }));

/* 5 · inside the proof */
O.push(C.section({ lab: '5 · inside the proof', title: 'What carries the conclusion', id: 'route', wide: true, bodyRaw:
  '<div class="col">' + C.plainList([
    { b: 'The route.', text: 'Read from the top down: RH follows from “no Dirichlet L-function vanishes right of 1/2”, plus ζ’s functional equation for the left half. That in turn rests on a window criterion and on a link whose two inequalities come from matrix estimates.' },
    { b: 'Names are not evidence.', text: 'Several parts are named for deep mathematics but are empty in the code: a geometry condition that is literally True, a geometric model whose key map is zero, a theorem named for a simple pole that proves True, two “literature” inputs that are one statement. The proof can still be valid — the kernel checks what is there, not what things are called — but those names do not explain it.' }
  ]) + '</div>'
  + C.figure({ svgRaw: dual(figRoute(900, false), figRoute(360, true)), record: [DIR + 'route-reading.json'],
    caption: 'The route of the proof, from the headline down (left), and four places named for deep mathematics that are vacuous in the code (right, dotted). Hover for each. The highlighted box is where the real content has to be.',
    stop: 'a quoted line no longer matches the pinned archive' })
  + '<div class="col">' + C.plainList([
    { b: 'J. L. Nielsen’s critique.', raw: C.esc('A paper posted the same day, ') + a('https://philarchive.org/rec/NIEIOT-2', 'The Invalidity of Alpöge’s Proposed Proof of the Riemann Hypothesis') + C.esc(', reads the source and finds the vacuous geometric and lattice witnesses above, and a height set equal to its own formula. We confirmed each quote in the pinned files. Our verdict on that point: the geometric interpretation of this step remains unverified. The paper’s title goes further than its analysis: the formal theorem is decided by the kernels, not by the names, and the paper’s own appendix grants that the proof term may well check.') },
    { b: 'The question that remains.', text: 'The height enters with two inequalities supplied separately, derived from about forty matrix-norm, covolume and valuation estimates. Whether those estimates are where the argument really lives — and what they mean — is a question for number theorists, not for a kernel. We trace, in the compiled proof, which sub-proofs feed them' + (ALL.find((z) => z.id === 'WORDFACTS').st === 'computed' ? '.' : ' (running).') }
  ]) + '</div>' }));

/* 6 · bridges */
O.push(C.section({ lab: '6 · connections', title: 'Two other claims, connected in Lean', id: 'bridges', wide: true, bodyRaw:
  C.figure({ svgRaw: dual(figBridge(900, false), figBridge(360, true)), record: [DIR + 'runs-bridge/podB-lyq17afbn6smbz/P0J.out', 'instruments/alpoge-grh/bridge/CertMachine/Bridge.lean', 'instruments/alpoge-grh/bridge/CertMachine/MasulloReading.lean'],
    caption: 'Three claims about the zeros of ζ from 2026, and what Lean says connects them. Solid arrows are proved in Lean and checked here; grey ones are still running; the dotted box is a reading of a draft whose main theorem is not yet written.',
    stop: 'a bridge drawn as proved is not CERTIFIED in the record' })
  + '<div class="col">' + C.plainList([
    { b: 'The August release.', text: 'Anthropic’s August proof that at least two thirds of the zeros are simple and on the critical line checks unchanged — all 326 files — on the Mathlib of today’s release, and both kernels accept it. Put together with today’s RH, its bound that 5/6 of the zeros are distinct becomes a bound for distinct zeros on the line. The simplicity bounds this implies are the August ones again; nothing new beyond the composition.' },
    { b: 'Masullo’s draft.', raw: C.esc('Alessandro Masullo’s all-human draft (') + a('https://math216.wordpress.com/2026/11/20/hurried-announcement-alessandro-masullo-grh/', 'posted by Ravi Vakil') + C.esc(', 940 pages, reviewed for months by Brian Conrad) claims GRH for every number field and more: off the centre, every zero simple. Its main zero theorem is not yet written in the draft (page 522: “Insert statement.”). Read for ℚ, the claim implies this release’s statements; one double zero would refute it while leaving RH intact.') }
  ]) + '</div>' }));

/* 7 · credits */
O.push(C.section({ lab: 'credits', title: 'Whose work this uses', id: 'credits', bodyRaw: C.plainList([
  { b: 'The claim.', raw: C.esc('Levent Alpöge, ') + a('https://alpo.ge/remark.pdf', 'Remark') + C.esc(' and the Lean archive (alpo.ge, 20 November 2026), made with Claude.') },
  { b: 'An independent record.', raw: C.esc('Andrew Sutherland (MIT) published his own verification of the release the same day, with Claude Code: ') + a('https://math.mit.edu/~drew/grh/', 'math.mit.edu/~drew/grh') + C.esc('. Our comparison of compiled bytes uses his published manifest.') },
  { b: 'The second readings and the red team.', text: 'Astra 6.2, a model from another family, read the statements, Masullo’s draft and the proof’s route, and red-teamed our plan three times; every claim it made was checked against the sources here before it was used.' },
  { b: 'The critique.', raw: C.esc('J. L. Nielsen, ') + a('https://philarchive.org/rec/NIEIOT-2', 'PhilArchive NIEIOT-2') + C.esc('.') },
  { b: 'The August release.', raw: a('https://github.com/anthropics/formal-math', 'anthropics/formal-math') + C.esc(', zeta23: Levent Alpöge and Ralph Furman, Claude, and the team that formalized it in Lean.') },
  { b: 'Masullo’s draft.', text: 'Alessandro Maria Masullo, “The Music of the Primes”, posted by Ravi Vakil; reviewed by Brian Conrad.' },
  { b: 'The venue.', raw: C.esc('Terence Tao’s ') + a('https://terrytao.wordpress.com/2026/11/20/unforced-euler-singularity-unforced-navier-stokes-singularity-and-the-generalized-riemann-hypothesis/', 'post of 20 November') + C.esc(' and the Lean Zulip thread it names.') },
  { b: 'The tools.', text: 'Lean and Lake, Mathlib; Comparator, lean4export and con-leche (Lean FRO); nanoda (ammkrn); landrun; OpenTimestamps.' }
]) }));

/* 8 · check it yourself */
O.push(C.section({ lab: 'check it yourself', title: 'How to re-run it', id: 'rerun', bodyRaw: C.plainList([
  { b: 'One command.', raw: C.esc('The kit in ') + rec('instruments/alpoge-grh/rerun/README.md') + C.esc(' runs the same scripts in the same order on a Linux machine of your own, and compares your verdicts with ours, check by check.') },
  { b: 'The record.', raw: rec(REC) + C.esc(', re-derived from the machine’s logs by ') + rec('tools/check-alpoge-grh.py') + C.esc(' (') + '<span class="m">--check</span>' + C.esc(').') },
  { b: 'The machine’s scripts.', raw: rec('tools/runpod-alpoge-grh-p1.sh') + C.esc(' (fetch, statement file, build), ') + rec('tools/runpod-alpoge-grh-p2.sh') + C.esc(' (axioms, census, judge, controls, kernels) and ') + rec('tools/runpod-alpoge-grh-p3-bridge.sh') + C.esc(' (the bridge), ') + rec('tools/runpod-alpoge-grh-p4.sh') + C.esc(' (con-leche) and ') + rec('tools/runpod-alpoge-grh-clean.sh') + C.esc(' (the clean machine).') },
  { b: 'Our statement file and the proofs we wrote.', raw: rec('instruments/alpoge-grh/Challenge.lean') + C.esc(', ') + rec('instruments/alpoge-grh/spec/Spec.lean') + C.esc(', ') + rec('instruments/alpoge-grh/spec/Textbook.lean') + C.esc(' and ') + rec('instruments/alpoge-grh/bridge/CertMachine') + C.esc('.') },
  { b: 'The rules, timestamped.', raw: rec(DIR + 'timestamps/rules-2026-11-21.txt') + C.esc(' lists the checksum of every rule file; its OpenTimestamps proof (') + rec(DIR + 'timestamps/rules-2026-11-21.txt.ots') + C.esc(OTS_BTC ? ') anchors it in Bitcoin, so anyone can confirm the rules existed before the results.' : ') was submitted to four OpenTimestamps calendars on 21 November, before the judges and kernels reported; its Bitcoin confirmation was still pending at this update.') }
]) }));

O.push(C.section({ lab: 'changes', title: 'Changes to this page', id: 'changes', bodyRaw: C.plainList(LOG.slice().reverse().map((e) => ({ b: e.at.replace('T', ' ').replace('Z', ' UTC') + '.', text: e.what + (e.done !== undefined ? ' (' + e.done + ' of ' + ALL.length + ' checks done.)' : '') }))) }));

const SCRIPT = CH.script() + `<script>
(function(){
  var fig=document.querySelector('svg.zplane'); var btns=document.querySelectorAll('.zp-btns button'); var say=document.querySelector('.zp-say');
  var words={mathlib:'Mathlib’s definition: every zero of ζ, except −2, −4, −6, … and the point 1, has real part 1/2.',
    strip:'The textbook form: every zero inside the critical strip 0 < Re s < 1 has real part 1/2.',
    both:'Proved in Lean (Spec.lean): the two statements are equivalent — outside the strip, ζ has no zeros but the trivial ones.'};
  function set(m){ var all=document.querySelectorAll('svg.zplane'); for(var j=0;j<all.length;j++){ all[j].setAttribute('data-zp',m); }
    for(var i=0;i<btns.length;i++){ btns[i].setAttribute('aria-pressed', btns[i].getAttribute('data-zp')===m?'true':'false'); }
    if(say) say.textContent=words[m]; }
  for(var i=0;i<btns.length;i++){ btns[i].addEventListener('click', function(){ set(this.getAttribute('data-zp')); }); }
})();
(function(){
  /* the ring and its list light each other up */
  function hl(el,on){ var svg=el.ownerSVGElement; if(!svg) return; var k=el.getAttribute('data-wi'); var all=svg.querySelectorAll('[data-wi]');
    for(var j=0;j<all.length;j++){ all[j].classList.toggle('wh-on', on && all[j].getAttribute('data-wi')===k); } svg.classList.toggle('wh-hl', on); }
  function pick(e){ return e.target && e.target.closest ? e.target.closest('[data-wi]') : null; }
  document.addEventListener('pointerover',function(e){ var el=pick(e); if(el) hl(el,true); });
  document.addEventListener('pointerout',function(e){ var el=pick(e); if(el) hl(el,false); });
  document.addEventListener('focusin',function(e){ var el=pick(e); if(el) hl(el,true); });
  document.addEventListener('focusout',function(e){ var el=pick(e); if(el) hl(el,false); });
  /* the planted-error cards come in one by one when they reach the screen */
  var g=document.querySelector('.pe-grid'); if(!g) return;
  if(!('IntersectionObserver' in window)){ return; }
  document.documentElement.classList.add('pe-js');
  var io=new IntersectionObserver(function(es){ es.forEach(function(x){ if(x.isIntersecting){ g.classList.add('in'); io.disconnect(); } }); },{threshold:0.2});
  io.observe(g);
})();
</script>`;
const STYLE = `
.tl{margin:var(--s-4) 0 var(--s-2);border-top:1px solid var(--rule-strong);border-bottom:1px solid var(--rule-strong);padding:var(--s-4) 0 var(--s-5);}
.tl-head{display:flex;flex-direction:column;gap:var(--s-1);margin-bottom:var(--s-4);}
.tl-k{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink);font-weight:bold;}
.tl-sub{font-size:var(--text-small);color:var(--ink-2);}
.tl-rail{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:0 var(--s-3);}
.tl-step{position:relative;display:flex;flex-direction:column;gap:var(--s-1);padding-top:var(--s-5);min-width:0;}
.tl-step::before{content:"";position:absolute;left:0;right:calc(-1 * var(--s-3));top:calc(var(--s-2) - 1px);height:2px;background:var(--rule);}
.tl-step:last-child::before{right:0;}
.tl-done::before{background:var(--sig);}
.tl-dot{position:absolute;left:0;top:0;width:16px;height:16px;border-radius:50%;box-sizing:border-box;border:2px solid var(--rule-strong);background:var(--surface);z-index:1;}
.tl-done .tl-dot{background:var(--sig);border-color:var(--sig);}
.tl-now .tl-dot{border-color:var(--sig);animation:tlPulse calc(var(--dur-slow) * 4) ease-in-out infinite;}
@keyframes tlPulse{0%,100%{box-shadow:0 0 0 0 var(--sig-soft)}50%{box-shadow:0 0 0 6px var(--sig-soft)}}
.tl-n{font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-3);}
.tl-t{font-weight:bold;font-size:var(--text-body);color:var(--ink);line-height:var(--leading-snug);}
.tl-st{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-3);}
.tl-done .tl-st{color:var(--sig);}
.tl-now .tl-st{color:var(--ink);font-weight:bold;}
.tl-d{font-size:var(--text-small);line-height:var(--leading-body);color:var(--ink-2);}
.tl-next .tl-t,.tl-planned .tl-t{color:var(--ink-2);}
.tl-bar{height:6px;border-radius:var(--radius-pill);background:var(--mark);overflow:hidden;margin-top:var(--s-1);}
.tl-bar span{display:block;height:100%;background:var(--sig);border-radius:var(--radius-pill);}
.tl-count{margin:var(--s-1) 0 0;font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink);line-height:var(--leading-snug);}
.tl-proj{margin:var(--s-1) 0 0;font-size:var(--text-eyebrow);font-style:italic;color:var(--ink-3);line-height:var(--leading-snug);}
@media(max-width:980px){.tl-rail{grid-template-columns:1fr;gap:0}.tl-step{padding:0 0 var(--s-4) var(--s-6)}.tl-step::before{left:calc(var(--s-2) - 1px);right:auto;top:var(--s-4);bottom:0;width:2px;height:auto}.tl-step:last-child::before{display:none}}
@media(prefers-reduced-motion:reduce){.tl-now .tl-dot{animation:none}}
.upd{font-family:var(--f-mono);font-size:.74rem;letter-spacing:.04em;color:var(--ink-3);margin:.3rem 0 0;}
.draft-note{border-left:3px solid var(--warn);padding:.4rem .8rem;color:var(--ink-2);background:var(--warn-soft);border-radius:4px;}
.wh-seg,.wh-track{animation:whIn .8s ease both;}
.wh-track.wh-run{animation:whIn .8s ease both, whRun 2.4s ease-in-out 1.6s infinite;}
@keyframes whIn{from{opacity:0}to{opacity:1}}
@keyframes whRun{0%,100%{opacity:1}50%{opacity:.35}}
svg.zplane .zp-zero{animation:zpOn .6s ease both;}
@keyframes zpOn{from{opacity:0;r:1}to{opacity:1}}
@media(prefers-reduced-motion:reduce){.wh-seg,.wh-track,.wh-track.wh-run,svg.zplane .zp-zero{animation:none}}
.zp-btns{display:flex;flex-wrap:wrap;gap:.5rem;margin:.2rem 0 .4rem;}
.zp-btns button{font:inherit;font-size:.82rem;padding:.35rem .75rem;border:1px solid var(--rule-strong);border-radius:var(--radius-pill);background:var(--surface);color:var(--ink);cursor:pointer;}
.zp-btns button[aria-pressed="true"]{border-color:var(--sig);color:var(--sig);background:var(--sig-soft);}
.zp-say{font-size:.86rem;color:var(--ink-3);margin:0 0 .4rem;min-height:1.3em;}
svg.zplane .zp-ann{opacity:0;transition:opacity .35s ease;}
svg.zplane[data-zp="mathlib"] .zp-a-mathlib, svg.zplane[data-zp="strip"] .zp-a-strip, svg.zplane[data-zp="both"] .zp-ann{opacity:1;}
svg.zplane[data-zp="mathlib"] .zp-triv, svg.zplane[data-zp="mathlib"] .zp-pole{stroke:var(--warn);stroke-width:3;}
@media(prefers-reduced-motion:reduce){svg.zplane .zp-ann{transition:none}}
.dual .hv-n{display:none}
.ch{list-style:none;margin:4px 0;padding:0;}
.ch-step{position:relative;display:grid;grid-template-columns:minmax(0,340px) minmax(0,1fr);column-gap:40px;align-items:start;padding:0 0 30px;}
.ch-step:last-child{padding-bottom:0;}
.ch-step:not(:last-child)::before{content:"";position:absolute;left:40px;top:0;bottom:0;width:1.5px;background:var(--rule-strong);}
.ch-box{position:relative;z-index:1;border:1px solid var(--rule-strong);border-left:3px solid var(--mark);border-radius:var(--radius-s);background:var(--surface);padding:11px 14px 12px;}
.ch-step+.ch-step .ch-box::before{content:"";position:absolute;left:33px;top:-10px;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid var(--ink-3);}
.ch-k{display:block;font-family:var(--f-mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);}
.ch-v{display:block;font-family:var(--f-mono);font-size:14.5px;font-weight:500;color:var(--ink);margin-top:7px;}
.ch-d{margin:0;padding-top:4px;font-size:.92rem;line-height:1.6;color:var(--ink-2);max-width:64ch;}
.ch-decided .ch-box{border-color:var(--sig);border-left-color:var(--ink);}
.ch-decided .ch-st{color:var(--ink);}
.ch-pending .ch-box{border-color:var(--rule);}
.ch-pending .ch-v{color:var(--ink-2);}
.ch-pending .ch-st{animation:whRun 2.4s ease-in-out infinite;}
.ch-refused .ch-box{border-color:var(--ink-3);}
.ch-held .ch-box{border-left-color:var(--ink-2);}
.ch-flow{position:absolute;z-index:0;left:38px;top:0;width:6px;height:6px;border-radius:50%;background:var(--ink-3);animation:chFlow 3.6s linear infinite;}
@keyframes chFlow{from{top:0}to{top:calc(100% - 6px)}}
@media (max-width:680px){.ch-step{display:block;padding-bottom:26px}.ch-d{padding:10px 0 0 58px;font-size:.88rem}}
@media(prefers-reduced-motion:reduce){.ch-flow{display:none}.ch-pending .ch-st{animation:none}}
@media (max-width:680px){.dual .hv-w{display:none}.dual .hv-n{display:block}}
.rt-node, .rt-side, .tm-cell, .wh-li{cursor:help;}
svg.wh-hl .wh-seg, svg.wh-hl .wh-track, svg.wh-hl .wh-li{opacity:.25 !important;transition:opacity .2s ease;}
svg.wh-hl .wh-on{opacity:1 !important;}
svg.wh-hl .wh-track.wh-on{stroke:var(--ink-5);}
.pe-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.75rem;margin:1.4rem 0 1.6rem;}
@media(max-width:1100px){.pe-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
@media(max-width:620px){.pe-grid{grid-template-columns:1fr;}}
.pe-card{border:1px solid var(--rule-strong);border-radius:var(--radius-s);background:var(--surface);padding:.85rem .9rem .8rem;display:flex;flex-direction:column;gap:.6rem;min-width:0;}
.pe-js .pe-card{opacity:0;transform:translateY(10px);transition:opacity .5s ease,transform .5s ease;transition-delay:calc(var(--i) * 140ms);}
.pe-js .pe-grid.in .pe-card{opacity:1;transform:none;}
.pe-head{display:flex;gap:.55rem;align-items:baseline;}
.pe-id{font-family:var(--f-mono);font-size:.72rem;letter-spacing:.08em;color:var(--ink-3);}
.pe-t{font-weight:600;font-size:.92rem;color:var(--ink);}
.pe-code{display:flex;flex-direction:column;font-family:var(--f-mono);font-size:.66rem;line-height:1.55;background:var(--paper);border:1px solid var(--rule);border-radius:5px;padding:.45rem .5rem;white-space:pre-wrap;overflow-wrap:anywhere;}
.pe-old{color:var(--ink-3);text-decoration:line-through;}
.pe-new{color:var(--ink);}
.pe-why{font-size:.8rem;color:var(--ink-2);margin:0;line-height:1.45;}
.pe-who{font-size:.78rem;color:var(--ink-2);margin:0;line-height:1.4;}
.pe-who span{display:block;font-family:var(--f-mono);font-size:.64rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);margin-bottom:.15rem;}
.pe-st{margin:auto 0 0;font-family:var(--f-mono);font-size:.74rem;letter-spacing:.06em;text-transform:uppercase;padding-top:.55rem;border-top:1px solid var(--rule);}
.pe-pending{border-color:var(--rule);}
.pe-pending .pe-st{color:var(--ink-3);animation:whRun 2.4s ease-in-out infinite;}
.pe-rejected{border-color:var(--sig);}
.pe-rejected .pe-st{color:var(--sig);font-weight:600;}
.pe-accepted{border-color:var(--witness);}
.pe-accepted .pe-st{color:var(--witness);}
.pe-js .pe-grid.in .pe-rejected .pe-st{animation:peStamp .5s cubic-bezier(.2,1.6,.4,1) both;animation-delay:calc(var(--i) * 140ms + .5s);}
@keyframes peStamp{from{opacity:0;transform:scale(1.5)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.pe-js .pe-card{opacity:1;transform:none;transition:none}.pe-st{animation:none !important}}
`;
const foot = '<p>' + C.esc('Generated by tools/build-report-alpoge-grh.js from ' + REC + (pending.length ? ' — a draft: ' + pending.length + ' checks still running.' : '.') + ' I did this with Claude (Anthropic), which wrote the programs under my direction; Astra 6.2 read and red-teamed.') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p>';
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'alpoge-grh.html'), TPL.render({ title: TITLE + ' · cert-machine', bodyRaw: O.join('\n\n'), footRaw: foot, path: '/reports/alpoge-grh.html',
  cssRaw: STYLE, scriptRaw: SCRIPT, og: { image: '/og-alpoge-grh.png', alt: OG.alt('alpoge-grh') },
  desc: 'Levent Alpöge’s Lean proof of the Riemann Hypothesis, checked step by step: the files, the build, the axioms, independent kernels, the statement, planted errors, the route inside the proof, and two bridges to other claims.' }));
console.log('reports/alpoge-grh.html written · ' + done.length + ' of ' + ALL.length + ' done · ' + pending.length + ' running · ' + bad.length + ' refused' + (FINAL ? ' · FINAL' : ' · draft'));
