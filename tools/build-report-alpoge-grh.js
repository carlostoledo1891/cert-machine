#!/usr/bin/env node
/* build-report-alpoge-grh.js — reports/alpoge-grh.html: cert-machine's checks of Levent Alpöge's Lean release on the
   Riemann Hypothesis and GRH for Dirichlet L-functions (alpo.ge, 20 November 2026). Every verdict word and number is
   read from certs/alpoge-grh-lean.json (derived from the pods' pulled results by tools/check-alpoge-grh.py) and the
   pinned readings in corpus/alpoge-grh/. The page never says or implies that RH is proved: it reports what each tool
   did with the formal release, and a conditional result always carries its condition.
   While checks are pending the page is a DRAFT: those rows are drawn as pending and a banner says so. With no check
   pending, the page closes only in one of the two closing states registered in advance (ENDING below: A or B), or in
   the one amendment A25 added after the event (D: the statement judge stopped on cost by the operator, no verdict);
   any other state is HELD, with no closing deck. `FINAL=1 make page R=alpoge-grh` runs this builder with FINAL=1
   before the sync and the gates, and FINAL=1 refuses anything but A, B or D, and a page-log entry not written for
   that state. In state D the page LEADS with the fact that the central check gave no verdict.

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
const { row, status, census, nielsenRan, WHEEL, ALL, pending, done, bad, refused, refuted, WORD } = S;
/* the larger machine's run (amendment A17): where S1 and C1 run; its marker files say what the guard did (A21) */
const JR = (() => { const d = path.join(ROOT, DIR, 'runs-judge'); const rs = fs.existsSync(d) ? fs.readdirSync(d).filter((x) => fs.statSync(path.join(d, x)).isDirectory()) : []; return rs.length === 1 ? path.join(d, rs[0]) : null; })();
const jr = (f) => (JR && fs.existsSync(path.join(JR, f)) ? fs.readFileSync(path.join(JR, f), 'utf8') : null);
/* C1's diagnostic on the larger machine, as Comparator printed it (amendment A22: the tail when the full output stays
   on the machine). A17 counts C1 as rejected only with a diagnostic naming the planted statement; the closing state A
   asks for that name here, on top of the record's row */
const C1DIAG = (() => { const t = (jr('C1.out') || jr('C1.tail') || '') + (jr('C1.err') || ''); const m = t.split('\n').find((l) => /do not match|does not match/.test(l)); return m ? m.replace(/^uncaught exception: /, '').trim() : null; })();
/* the page's state, read from the record. Two closing states were registered before S1 had a verdict (amendments A17,
   A19, A21): A, Comparator accepts on the larger machine and C1 is rejected there with its diagnostic; B, Comparator
   stops on resources there, the guard's marker C1.not-run says C1 was not run, and the other controls were each
   rejected. Anything else with no check pending (a rejection not yet traced, a control accepted, a refuted row) is HELD.
   A third closing state was NOT registered in advance: D, amendment A25 (written after the stop, and marked so): the
   operator ended the judge's run on cost before Comparator reported. It is read from the record's own stop block (the
   marker written on the machine), needs the absence of any exit and of any verdict line, and the page says in its
   first paragraph and in its list of gaps that the check gave no verdict and that this ending was not registered. */
const STOP = row('S1').stop || null;
const ENDING = (() => {
  if (pending.length) return 'draft';
  if (refuted.length) return 'hold';
  const others = ALL.filter((x) => !['S1', 'C1-C5', 'BRu'].includes(x.id));
  if (others.some((x) => !['decided', 'computed', 'read'].includes(x.st)) || status('BRu') !== 'refused' || !row('BRu').dropped) return 'hold';
  const c = row('C1-C5').controls || {}, s1 = row('S1'), runs = s1.runs || {};
  const rest = ['C2', 'C3', 'C4', 'C5', 'A1-C2', 'A1-C3'].every((k) => c[k] && c[k].refused);
  if (status('S1') === 'decided' && s1.where === 'larger machine' && status('C1-C5') === 'decided' && c.C1 && c.C1.refused && rest
    && C1DIAG && /RiemannZetaZerosOnLine|riemannZeta_eq_zero_re/.test(C1DIAG)) return 'A';
  if (status('S1') === 'refused' && runs['larger machine'] === 'resources' && status('C1-C5') === 'refused' && /^C1 was not run: it needs the same memory/.test(row('C1-C5').why)
    && c.C1 && c.C1.exit === null && rest && jr('C1.not-run') !== null) return 'B';
  if (status('S1') === 'refused' && runs['larger machine'] === 'stopped on cost' && STOP && STOP.reason === 'cost' && STOP.verdict_lines === 0 && STOP.memory_events && STOP.memory_events.oom_kill === 0
    && STOP.memory_limit_bytes > 0 && jr('S1.stopped-by-operator') !== null && jr('S1.exit') === null && jr('S1.end') === null
    && status('C1-C5') === 'refused' && /^C1 has no result: the statement judge was stopped on cost/.test(row('C1-C5').why)
    && c.C1 && c.C1.exit === null && rest && jr('C1.not-run') !== null) return 'D';
  return 'hold';
})();
const CLOSED = ['A', 'B', 'D'].includes(ENDING);
if (FINAL) need(CLOSED, 'FINAL build in state ' + ENDING + (pending.length ? ' (pending: ' + pending.map((x) => x.id).join(', ') + ')' : '')
  + ': only three states may close the page (A: Comparator accepts on the larger machine and C1 is rejected there with a diagnostic naming the plant; B: Comparator stops on resources there and the guard\'s C1.not-run marker is in the run; D, amendment A25: the operator stopped Comparator on cost, the machine\'s stop marker is in the run and no exit or verdict line is)');
/* the stop's figures, each from the record's stop block (never typed): whole hours and minutes, GB in the unit of the limit */
const hmin = (sec) => Math.floor(sec / 3600) + ' hours ' + Math.floor(sec % 3600 / 60) + ' minutes';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayOf = (iso) => Number(iso.slice(8, 10)) + ' ' + MONTHS[Number(iso.slice(5, 7)) - 1];
const utc = (iso) => iso.slice(0, 16).replace('T', ' ') + ' UTC';
const SD = ENDING === 'D' ? { hours: Math.floor(STOP.wall_seconds / 3600), day: dayOf(STOP.at), gb: Math.round(STOP.rss_kb * 1024 / 1e9), lim: Math.round(STOP.memory_limit_bytes / 1e9),
  limit_h: STOP.timeout_seconds / 3600, bru: /^\d{4}-\d\d-\d\dT/.test(row('BRu').dropped || '') ? dayOf(row('BRu').dropped) : null } : null;
if (ENDING === 'D') need(SD.bru && Number.isInteger(SD.limit_h) && SD.hours > 0 && SD.gb < SD.lim, 'the stop block of S1 does not carry the figures the closing page prints');
/* the page's public change log (corpus/alpoge-grh/page-log.json): the newest entry must state the count the record gives */
const LOG = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'alpoge-grh', 'page-log.json'), 'utf8')).entries;
need(LOG.length > 0 && LOG[LOG.length - 1].done === done.length, 'the newest page-log entry says ' + (LOG.length ? LOG[LOG.length - 1].done : 'nothing') + ' checks done, the record ' + done.length + ': add a dated line to corpus/alpoge-grh/page-log.json');
/* the count of done checks alone cannot tell the closing entry from an older one (21 done now and 21 in ending B): an
   entry may also carry pending, refused and refuted; when it does they must be the record's, and a closing build needs
   all three, so the closing entry is one written for that state */
const NEWEST = LOG[LOG.length - 1], COUNTS = { pending: pending.length, refused: refused.length, refuted: refuted.length };
for (const k of Object.keys(COUNTS)) if (NEWEST[k] !== undefined) need(NEWEST[k] === COUNTS[k], 'the newest page-log entry says ' + NEWEST[k] + ' ' + k + ', the record ' + COUNTS[k]);
if (FINAL) need(Object.keys(COUNTS).every((k) => NEWEST[k] !== undefined), 'a closing build needs a page-log entry written for it, with its pending, refused and refuted counts beside done');
const LAST = NEWEST.at.replace('T', ' ').replace('Z', ' UTC');
/* the standings the wheel fixes (readings and computed comparisons) must be the record's own: the wheel's stop sentence
   ("a check drawn as done is not done in the record") holds for them too */
const RDG = R.readings || {};
need(/^COMPUTED/.test((RDG.I2_mirror || {}).standing || '') && /^COMPUTED/.test((RDG.static_scan || {}).standing || '')
  && /^READ/.test((RDG.M1_metaprogramming || {}).standing || '') && /^READ/.test((RDG.F1_riemannHypothesis || {}).standing || '')
  && /^READ/.test((RDG.F2_dirichlet || {}).standing || '') && /^READ/.test(RT.standing || ''), 'a standing the wheel fixes (I2, SCAN, M1, F1, F2, ROUTE) is not the record\'s');
/* the complex-plane figure says a Lean proof makes the two forms of RH equivalent: the record must show it (SPEC
   CERTIFIED, and its axiom report naming the three standard axioms for both directions), or the figure is refused */
const SPECAX = fs.readFileSync(path.join(ROOT, DIR + 'runs-spec/spec-axioms.out'), 'utf8');
need(status('SPEC') === 'decided' && (SPECAX.match(/depends on axioms: \[propext, Classical\.choice, Quot\.sound\]/g) || []).length === 2, 'the record does not show the equivalence proof (SPEC) compiled on the three standard axioms');

/* ---------------------------------------------------------------- HERO: the wheel */
function figWheel(w, narrow) {
  const h = narrow ? 500 : Math.max(520, 34 + WHEEL.length * 27 + ALL.length * 17 + 36), cx = narrow ? w / 2 : 300, cy = narrow ? 172 : 260, r = narrow ? 128 : 168, sw = narrow ? 22 : 28;
  const o = [CH.open({ w, h, alt: 'A ring of ' + ALL.length + ' arcs, one per check, in four groups: the bytes, the build and the kernels, the statement, the context. Solid arcs are decided, dashed are computed, dotted are readings; a grey arc is refused, and an empty track is pending. In the centre the theorem’s name, the count of checks done, and the counts pending and refused.' })];
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
      o.push('    ' + CH.hit('<path class="wh-track wd' + k + (st === 'pending' ? ' wh-run' : '') + '" data-wi="' + k + '" d="' + arc(a0, a1, r) + '" fill="none" stroke="var(--mark)" stroke-width="' + sw + '" pointer-events="stroke"', x.t, WORD[st] + ' · ' + x.d) + '/>');
      const mw = st === 'read' ? 3.5 : st === 'computed' ? sw - 6 : sw;
      const gs = s && s.dash ? W.stroke(kind, { width: mw }) : null;   /* the grammar's pattern (design/grammar.js), never a literal */
      const dash = gs ? ' stroke-dasharray="' + gs.dash + '"' + (gs.cap ? ' stroke-linecap="' + gs.cap + '"' : '') : '';
      if (s || st === 'refused' || st === 'refuted') o.push('    <path class="wh-seg ws' + k + ' ' + (s ? s.class : 'w-none') + '" data-wi="' + k + '" d="' + arc(a0, a1, r) + '" fill="none" stroke="' + tok + '" stroke-width="' + mw + '"' + dash
        + ' pointer-events="none"/>');
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
    const nr = its.filter((x) => x.st === 'refused').length, nx = its.filter((x) => x.st === 'refuted').length;
    const y = cy + r + sw / 2 + 40 + i * 26;
    o.push(CH.txt(16, y, (i + 1) + '  ' + G.g.replace('The build and the kernels', 'Build · kernels').toUpperCase(), 't-ax', 'start', ' style="letter-spacing:.06em"'));
    o.push(CH.txt(w - 16, y, nd + ' of ' + its.length + ' done' + (np ? ' · ' + np + ' pending' : '') + (nr ? ' · ' + nr + ' refused' : '') + (nx ? ' · ' + nx + ' refuted' : ''), np || nr || nx ? 't-note' : 't-lab', 'end', ' style="font-size:11.5px"'));
  });
  /* centre */
  o.push(CH.txt(cx, cy - 26, 'riemannHypothesis', 't-lab', 'middle', ' style="font-family:var(--f-mono);font-size:' + (narrow ? 13 : 15) + 'px"'));
  o.push(CH.txt(cx, cy - 6, ': RiemannHypothesis', 't-note', 'middle', ' style="font-family:var(--f-mono)"'));
  o.push(CH.txt(cx, cy + 26, done.length + ' of ' + ALL.length + ' checks done', 't-lab', 'middle', ' style="font-size:' + (narrow ? 15 : 18) + 'px;font-weight:600"'));
  /* pending, refused and refuted are three states: the centre names each that occurs, never one for another */
  const centre = [pending.length ? pending.length + ' pending' : null, refused.length ? refused.length + ' refused' : null, refuted.length ? refuted.length + ' refuted' : null].filter(Boolean);
  o.push(CH.txt(cx, cy + 46, centre.length ? centre.join(' · ') : 'none pending, none refused', 't-note', 'middle'));
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
  o.push(CH.legend([{ token: 'var(--sig)', t: 'decided (solid)' }, { token: 'var(--sig)', kind: 'dash', t: 'computed (dashed)' }, { token: 'var(--sig)', kind: 'dot', t: 'read (dotted)' }, { token: 'var(--ink-3)', t: 'refused (grey)' }]
    .concat(refuted.length ? [{ token: 'var(--witness)', t: 'refuted' }] : []).concat([{ token: 'var(--mark)', t: 'pending (empty track)' }]),
    narrow ? 16 : 40, h - 14, null, w - (narrow ? 32 : 80)));
  o.push(CH.close);
  return o.join('\n');
}

/* ---------------------------------------------------------------- the complex plane (interactive) */
const ZEROS = [14.134725, 21.022040, 25.010858, 30.424876, 32.935062];   /* the first five positive ordinates of nontrivial zeros, quoted (LMFDB / Odlyzko): an illustration, no evidence for the universal claim */
function figPlane(w, narrow) {
  const h = narrow ? 560 : 500;
  const x0 = narrow ? 18 : 40, x1 = w - (narrow ? 14 : 40), y0 = narrow ? 64 : 40, y1 = h - 56;
  const reMin = narrow ? -6.6 : -7, reMax = narrow ? 2.6 : 3, imMin = -3, imMax = 40;
  const X = (re) => x0 + (re - reMin) / (reMax - reMin) * (x1 - x0), Y = (im) => y1 - (im - imMin) / (imMax - imMin) * (y1 - y0);
  const f = (x) => x.toFixed(1);
  const o = [CH.open({ w, h, alt: 'The complex plane. A shaded vertical band between real parts 0 and 1 is the critical strip; a solid line at real part 1/2 is the critical line, with the first five nontrivial zeros of ζ of positive imaginary part drawn on it (published values, an illustration); dots at −2, −4 and −6 on the real axis are the trivial zeros; a ring at 1 is the pole; the region right of real part 1 is grey: ζ has no zeros there. Buttons above the figure highlight what each statement talks about.', cls: 'zplane' })];
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
  o.push('    <circle ' + CH.hit('class="zp-pole" cx="' + f(X(1)) + '" cy="' + f(Y(0)) + '" r="6" fill="var(--paper)" stroke="var(--warn)" stroke-width="2"', 'the pole of ζ at s = 1', 'the classical ζ has a pole here; Mathlib gives ζ(1) a convention value, which is not 0, and every statement excludes s = 1') + '/>');
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
  const o = [CH.open({ w, h, alt: 'A treemap of the release: one rectangle per larger library, its area proportional to its lines of Lean, split into its folders; the smallest libraries are listed under it. Development holds most of it; Formalism, GroundTheory and ReciprocityTheory follow; the two files that state the five theorems are a sliver.' })];
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
  o.push(CH.txt(4, h - 12, narrow ? 'Main.lean + Statements.lean: 28 lines' : 'Too small to see: ' + tiny.map((l) => l.name + ' (' + N(l.lines) + ')').join(', ') + ' lines. Main.lean and Statements.lean, which state the five theorems: 28 lines.', 't-note', 'start'));
  o.push(CH.close);
  return o.join('\n');
}

/* ---------------------------------------------------------------- the planted errors (C1–C5), as cards */
const CTL = (row('C1-C5').controls) || {};
/* a card's state, per registered control: rejected (with its registered diagnostic); accepted (exit 0 from the tool
   that had to say no, or an axiom report that ran and did not name the plant); no valid result (an exit that is
   neither: a kill, a time limit, a missing diagnostic); pending (no exit while the row is pending); not run */
function ctlState(keys) {
  const xs = keys.map((k) => [k, CTL[k]]);
  if (xs.every(([, x]) => x && x.refused)) return 'rejected';
  if (xs.some(([, x]) => x && x.exit === 0 && !x.refused)) return 'accepted';
  if (xs.some(([, x]) => !x || x.exit === null || x.exit === undefined)) return status('C1-C5') === 'pending' ? 'pending' : 'notrun';
  return 'invalid';
}
/* what each tool printed, verbatim from the run's own output files (never a paraphrase in quotation marks) */
const RUNDIR = path.join(ROOT, DIR, 'runs', R.run);
const runText = (...fs_) => fs_.map((f) => (fs.existsSync(path.join(RUNDIR, f)) ? fs.readFileSync(path.join(RUNDIR, f), 'utf8') : '')).join('\n');
const firstLine = (t, re) => { const l = (t || '').split('\n').find((x) => re.test(x)); return l ? l.replace(/^uncaught exception: /, '').trim() : null; };
const OBS = {
  C1: C1DIAG,
  C2: firstLine(runText('C2.err', 'C2.out'), /Illegal axiom detected/), C3: firstLine(runText('C3.err', 'C3.out'), /Illegal axiom detected/),
  C4: firstLine(runText('C4.err', 'C4.out'), /do not match|does not match/), C5: firstLine(runText('C5.err', 'C5.out'), /assertion failed|type mismatch/)
};
const ex_ = (k) => (CTL[k] && CTL[k].exit !== null && CTL[k].exit !== undefined ? ' (exit ' + CTL[k].exit + ')' : '');
const PLANTED = [
  { id: 'C1', keys: ['C1'], t: 'A changed constant', code: ['s.re = 1 / 2', 's.re = 1 / 3'], diff: true, who: 'Comparator', expect: 'a mismatch naming RiemannZetaZerosOnLine or the theorem that uses it', why: 'A changed constant in our challenge: the judge must notice when the theorem proved is not the theorem asked, even by one character.' },
  { id: 'C2', keys: ['C2', 'A1-C2'], t: 'A smuggled axiom', code: ['axiom cheat :', '  RiemannHypothesis', 'theorem', '  riemannHypothesis', '  := cheat'], who: 'Comparator and Lean’s axiom report', expect: 'Comparator, an illegal axiom named cheat; the report, cheat among the axioms', why: 'Assuming RH and calling it a proof must be caught by two different tools.' },
  { id: 'C3', keys: ['C3', 'A1-C3'], t: 'A missing proof', code: ['theorem', '  riemannHypothesis', '  := sorry'], who: 'Comparator and Lean’s axiom report', expect: 'Comparator, an illegal axiom named sorryAx; the report, sorryAx among the axioms', why: 'Lean’s placeholder for “proof goes here” must never pass as a proof.' },
  { id: 'C4', keys: ['C4'], t: 'A hijacked definition', code: ['def', '  RiemannZetaZerosOnLine', '  : Prop := True'], who: 'Comparator', expect: 'a mismatch naming RiemannZetaZerosOnLine', why: 'Redefining the statement as something trivially true must not slip past.' },
  { id: 'C5', keys: ['C5'], t: 'A corrupted export', code: ['riemannHypothesis', '  : False', '-- proof unchanged'], who: 'nanoda, the second kernel', expect: 'a type-checking failure', why: 'The release’s own exported proof, with the declaration riemannHypothesis re-typed as False and its proof term left as it was, must fail in the independent kernel.' }
];
function observed(p, st) {
  if (st === 'pending') return p.id === 'C1' && jr('C1.start') === null ? 'nothing yet: queued behind the statement judge' : 'nothing yet: pending';
  if (st === 'notrun' && p.id === 'C1' && ENDING === 'D') return 'no result: never started. The statement judge it was queued behind was stopped for cost (amendment A25)';
  if (st === 'notrun') return p.id === 'C1' && jr('C1.not-run') !== null ? 'no result: the guard stopped the judge script when the statement judge stopped on resources (amendment A19)' : 'no result: not run';
  const o = OBS[p.id];
  const tail = p.id === 'C2' ? '; the axiom report lists cheat among riemannHypothesis’s axioms' : p.id === 'C3' ? '; the axiom report lists sorryAx among riemannHypothesis’s axioms' : '';
  return (o ? '“' + o + '”' + ex_(p.id) : 'no diagnostic line found' + ex_(p.id)) + (st === 'rejected' ? tail : '');
}
function plantedCards() {
  const word = { pending: 'pending', rejected: 'rejected', accepted: 'ACCEPTED: the control failed', notrun: 'no result', invalid: 'no valid result' };
  return '<div class="wide"><div class="pe-grid" role="list">' + PLANTED.map((p, i) => {
    const st = ctlState(p.keys);
    const code = p.diff
      ? '<code class="pe-code"><span class="pe-old">' + C.esc(p.code[0]) + '</span><span class="pe-new">' + C.esc(p.code[1]) + '</span></code>'
      : '<code class="pe-code">' + p.code.map((l) => '<span class="pe-new">' + C.esc(l) + '</span>').join('') + '</code>';
    return '<div class="pe-card pe-' + (st === 'notrun' || st === 'invalid' ? 'none' : st) + '" role="listitem" style="--i:' + i + '">'
      + '<div class="pe-head"><span class="pe-id">' + p.id + '</span><span class="pe-t">' + C.esc(p.t) + '</span></div>'
      + code
      + '<p class="pe-why">' + C.esc(p.why) + '</p>'
      + '<p class="pe-who"><span>must say no</span>' + C.esc(p.who) + ', expected: ' + C.esc(p.expect) + '</p>'
      + '<p class="pe-who"><span>observed</span>' + C.esc(observed(p, st)) + '</p>'
      + '<p class="pe-st" aria-label="state">' + (st === 'rejected' ? '✕ ' : st === 'pending' ? '◌ ' : st === 'accepted' ? '! ' : '– ') + C.esc(word[st]) + '</p>'
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
const SMALL0 = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const NI = (R.computed && R.computed.nielsen) || {};
const WF = (R.computed && R.computed.wordfacts) || {};
/* the census's WORDFACTS trace, in words: how many selected declarations, and the range of their release-only closures */
const WFC = (WF.targets || []).map((t) => t.release_closure).filter((n) => typeof n === 'number');
const WFW = WFC.length ? (SMALL0[WFC.length] || String(WFC.length)) + ' selected declarations, whose release-only dependency closures hold ' + N(Math.min(...WFC)) + ' to ' + N(Math.max(...WFC)) + ' constants' : null;
function niWord(name) {
  /* the census's NIELSEN probe for this name (amendment A10), as the checker parsed it; running until phase 2 */
  if (!nielsenRan || !NI[name]) return 'is it in the compiled proof? running';
  return NI[name].in_closure > 0 ? 'in the compiled proof (' + NI[name].in_closure + ' constant' + (NI[name].in_closure > 1 ? 's' : '') + ' of that name)' : 'not in the compiled proof of the five theorems';
}
function figRoute(w, narrow) {
  const nodes = [
    { k: 'Main.lean', v: 'riemannHypothesis : RiemannHypothesis', d: 'The headline: Mathlib’s RH, no hypotheses. 12 lines.', t: 'route' },
    { k: 'rhOfAll → rh_of_every', v: 'RH from Dirichlet nonvanishing', d: 'If no Dirichlet L-function vanishes right of 1/2 (the principal one away from s = 1), ζ (modulus 1) has no zero there; ζ’s functional equation handles the left half.', t: 'route' },
    { k: 'everyCharacter', v: 'no zeros right of 1/2, every character', d: 'Every Dirichlet L-function is nonzero for Re s > 1/2 (the principal one away from s = 1). The rest of the route supplies this nonvanishing input.', t: 'route' },
    { k: 'zeroFree_of_rpow_window', v: 'a window criterion', d: 'A one-sided bound for a smoothed sum over windows [Y, Y^(1+δ)], Y as large as you like, rules out zeros past the bound’s exponent; the exponent is pushed to 1/2. 30 files, 2,475 lines — small enough to read.', t: 'route' },
    { k: 'the divisor link', v: 'height = formula (by rfl) + two inequalities', d: 'Takes a height equation that holds by definition and two inequalities passed separately (P.wordFacts), whose inputs the readings leave untraced. ' + (WFW ? 'The census traces what feeds them: ' + WFW + '.' : 'The census traces what feeds them (pending).'), t: 'key' },
    { k: 'Row', v: 'a Galois-representation statement', d: 'The arithmetic input, proved inside the release under the name Row; whether it is the literature theorem it is named after is a reading question.', t: 'route' }
  ];
  const side = [
    { k: 'anyGeometry', v: ':= fun _ _ _ => True', d: 'The geometric condition passed where the bundle needs a certificate is the predicate True (Nielsen; confirmed).', n: 'anyGeometry' },
    { k: 'divXFl', v: 'a degenerate model, iMj = 0', d: 'The geometric witness: sections are the whole space, degrees 0, the lattice-to-sections map is zero (Nielsen; confirmed).', n: 'divXFl' },
    { k: 'siegel_eisenstein_simple_pole', v: 'proves True', d: 'A theorem named for a simple pole proves GlobalTheory.Published.UnusedSlot72, which is True (Astra; confirmed).', n: 'siegel_eisenstein_simple_pole' },
    { k: 'OpenLiteratureStatements', v: '⟨h, recTExists, h⟩', d: 'Two inputs named for two papers are the same proposition (Astra; confirmed).', n: null }
  ];
  const h = narrow ? 806 : 524, bw = narrow ? w - 32 : 380, bh = narrow ? 58 : 62, x = narrow ? 16 : 30;
  const o = [CH.open({ w, h, alt: 'The route of the proof, as read, as a chain of six boxes from Main.lean down to the arithmetic input, the divisor link highlighted; beside it four dotted boxes for parts named for deep mathematics that hold something else in the code: a geometry predicate that is True, a degenerate geometric model with a zero map, a theorem named for a simple pole that proves True, and two literature inputs that are one proposition.' })];
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
  if (narrow) { o.push(CH.txt(sx, sy0 - 26, 'NAMES ARE NOT EVIDENCE:', 't-ax', 'start', ' style="letter-spacing:.06em"')); o.push(CH.txt(sx, sy0 - 10, 'FOUR EXAMPLES IN THE CODE', 't-ax', 'start', ' style="letter-spacing:.06em"')); }
  else o.push(CH.txt(sx, sy0 - 10, 'NAMES ARE NOT EVIDENCE: FOUR EXAMPLES IN THE CODE', 't-ax', 'start', ' style="letter-spacing:.06em"'));
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
  const o = [CH.open({ w, h, alt: 'Three boxes: the August release (asymptotically, at least two thirds of the zeros simple and on the line), this release (five Lean statements of RH and GRH for Dirichlet L-functions) and Masullo’s draft (GRH for every number field, its main theorem not yet written). Arrows: assuming RH and the August bound, the August bound for distinct zeros holds on the critical line (compiled in Lean); and our reading of Masullo’s description for ℚ implies the release’s statement for primitive characters and simple zeros off the centre (compiled). Under the first arrow: the two releases in one environment, ' + (status('BRu') === 'decided' ? 'checked.' : status('BRu') === 'pending' ? 'pending.' : 'not run.') })];
  o.push('    <defs><marker id="bra" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="var(--ink-3)"/></marker></defs>');
  const bw = narrow ? w - 32 : 300, bh = 118;
  const B = narrow
    ? [{ x: 16, y: 16, w: bw, h: bh }, { x: 16, y: 252, w: bw, h: bh }, { x: 16, y: 488, w: bw, h: bh }]
    : [{ x: 20, y: 20, w: bw, h: bh }, { x: w / 2 - bw / 2, y: 236, w: bw, h: bh }, { x: w - 20 - bw, y: 20, w: bw, h: bh }];
  /* this release's box says what was checked of it (it compiles, three kernels accept it), never that its zeros are on the line */
  const kst = ['B1', 'A1', 'K2', 'KR', 'K3'].every((id) => status(id) === 'decided') ? 'decided' : 'pending';
  const boxes = [
    { k: 'August 2026 · Anthropic', t: '≥ 2/3 of the zeros', s: 'simple and on the line, asymptotically', f: status('P0') === 'decided' ? '✓ re-checked here on today’s Mathlib' : 'being re-checked here', st: status('P0') },
    { k: '20 November · Alpöge', t: 'RH, and GRH for Dirichlet', s: 'five statements in Lean', f: kst === 'decided' ? '✓ compiles; three kernels accept it' : 'being checked here (pending)', st: kst },
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
  /* each arrow is a statement compiled in Lean (BRc+MB), and says its hypotheses; the two releases in one environment
     (BRu) is a separate check, written under the first arrow with its own state (amendment A21: not run, for cost) */
  const L = (lines, x, y, anchor, st) => (st === 'decided' ? lines : lines.concat([st === 'refused' ? '(not run)' : '(pending)'])).map((t, j) => CH.txt(x, y + j * 16, t, 't-note', anchor)).join('\n');
  const bru = status('BRu') === 'decided' ? ['in one environment:', 'checked'] : ['in one environment:', status('BRu') === 'pending' ? 'pending' : 'not run (cost)'];
  const A1L = ['assuming RH and the', 'August bound: 5/6 of', 'the zeros distinct', 'AND on the line'];
  const MBL = ['read for ℚ: implies', 'the primitive-', 'character statement,', 'and simple zeros', 'off the centre'];
  const edges = narrow
    ? [{ d: 'M' + (w / 2) + ' ' + (16 + bh + 2) + ' L' + (w / 2) + ' 248', lines: A1L, extra: bru, lx: w / 2 + 10, ly: 146, a: 'start', st: status('BRc+MB') },
       { d: 'M' + (w / 2) + ' 484 L' + (w / 2) + ' ' + (252 + bh + 4), lines: MBL, lx: w / 2 + 10, ly: 396, a: 'start', st: status('BRc+MB') }]
    : [{ d: 'M170 ' + (20 + bh + 2) + ' C170 236 220 295 ' + (w / 2 - bw / 2 - 4) + ' 295', lines: A1L, extra: bru, lx: 156, ly: 180, a: 'end', st: status('BRc+MB') },
       { d: 'M' + (w - 170) + ' ' + (20 + bh + 2) + ' C' + (w - 170) + ' 236 ' + (w - 220) + ' 295 ' + (w / 2 + bw / 2 + 4) + ' 295', lines: MBL, lx: w - 156, ly: 180, a: 'start', st: status('BRc+MB') }];
  for (const e of edges) {
    const s = e.st === 'decided' ? W.stroke(W.DECIDED, { width: 2 }) : null;
    o.push('    <path class="br-edge ' + (s ? s.class : 'w-none') + '" d="' + e.d + '" fill="none" stroke="' + (e.st === 'decided' ? 'var(--sig)' : 'var(--ink-5)') + '" stroke-width="2"' + (e.st === 'decided' ? '' : ' stroke-dasharray="2 3"') + ' marker-end="url(#bra)"/>');
    o.push(L(e.lines, e.lx, e.ly, e.a, e.st));
    if (e.extra) o.push(e.extra.map((t, j) => CH.txt(e.lx, e.ly + (e.lines.length + 0.6 + j) * 16, t, 't-note', e.a)).join('\n'));
  }
  o.push(CH.legend([{ token: 'var(--sig)', t: 'compiled in Lean, with its hypotheses, checked here' }].concat(edges.some((e) => e.st !== 'decided') ? [{ token: 'var(--ink-3)', kind: 'guide', t: edges.some((e) => e.st === 'refused') ? 'not run' : 'pending' }] : []).concat([{ token: 'var(--ink-3)', kind: 'dot', t: 'a reading of a draft' }]), narrow ? 16 : 30, h - 10, null, w - 60));
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
const OTS = fs.readFileSync(path.join(ROOT, DIR + 'timestamps/rules-2026-11-21.txt.ots'));
const OTS_BTC = OTS.includes(Buffer.from('0588960d73d71901', 'hex'));
/* what the stamped list holds, and how many calendars the stored proof names: read from the two files, never typed */
const OTS_CAL = new Set((OTS.toString('latin1').match(/https:\/\/[a-z0-9.-]+/g) || [])).size;
const RULES_TXT = fs.readFileSync(path.join(ROOT, DIR + 'timestamps/rules-2026-11-21.txt'), 'utf8');
const RULES_N = (RULES_TXT.match(/^[0-9a-f]{64}  \S/gm) || []).length;
const RULES_AT = (RULES_TXT.match(/\((\d{4}-\d\d-\d\dT\d\d:\d\d):\d\dZ\)/) || [])[1];
need(RULES_N > 0 && RULES_AT && OTS_CAL > 0, 'the stamped rule list or its proof is not readable');
const PRE = fs.readFileSync(path.join(ROOT, 'notes', 'alpoge-grh-preregistration-2026-11-20.md'), 'utf8');
const AMENDMENTS = (PRE.match(/^## Amendment A\d+/gm) || []).length;
/* the amendments written after the result they change are marked AFTER in their own heading; the page names them */
const AFTER = (PRE.match(/^## Amendment A\d+[^\n]*\bAFTER\b/gm) || []).map((h) => h.match(/A\d+/)[0]);
const SMALL = SMALL0;
const nw = (n) => SMALL[n] || String(n);
/* the history of the rules, in the words the registration's own headings support: the original registration came
   before the build, the replay and the judges (not before the first fetch and the source scan, made earlier that day);
   A14 and A20 are marked AFTER the result they change; A18 followed a parallel observation, before the registered run;
   A21 and A22 were written while the statement judge was running, before it had a result */
const RULES_WORDS = 'The build, replay and judging rules were registered on 20 November, before those runs; the archive’s first fetch and the source scan came earlier that day. '
  + AMENDMENTS + ' dated amendments since' + (AFTER.length ? ': ' + AFTER_WORDS_SHORT() : '') + '.';
function AFTER_WORDS_SHORT() { return AFTER.join(' and ') + ' changed how a result is read after it was seen, and say so'; }
const AFTER_WORDS = AFTER.length
  ? (AFTER.length === 1 ? 'one later amendment (' + AFTER[0] + ') changed' : nw(AFTER.length) + ' later amendments (' + AFTER.join(', ') + ') changed') + ' how a result is read after it was seen, and say so'
  : '';
const B1P = (R.computed && R.computed.b1_progress) || {};
const hhmm = (iso) => iso.slice(11, 16) + ' UTC';
function timeline() {
  const STAGES = [
    { t: 'Rules first', rows: [], d: RULES_WORDS + ' A18 followed an observation on a second machine and came before the registered run; A21 and A22 were written while the statement judge was running, before it had a result. One check was dropped at the start (A7)' + (status('BRu') === 'refused' ? '; the two releases in one environment were closed for cost (A21).' : '.'), link: GH + 'notes/alpoge-grh-preregistration-2026-11-20.md' },
    { t: 'Files and statement', rows: ['I1', 'I2', 'SCAN', 'M1', 'F1', 'F2', 'SPEC', 'CHAR', 'ROUTE', 'P0', 'BRc+MB'], d: 'The announced files, no shortcut found in the source, and Lean proofs that two of the five statements are equivalent to their textbook forms.' },
    { t: 'The build', rows: ['B1', 'MI', 'RB'], d: 'Lean compiles all 175,187 Lean source files with exit 0.' },
    { t: 'Axioms, judge, planted errors', rows: ['A1', 'S1', 'C1-C5', 'NIELSEN', 'WORDFACTS'], d: 'What the proof rests on, whether its statements match our challenge, and five planted errors the tools must catch.' },
    { t: 'Three kernels', rows: ['K2', 'KR', 'K3'], d: 'nanoda and con-leche check the exported proof; Lean replays the compiled modules from an empty environment.' },
    { t: 'A clean machine', rows: ['CR'], d: 'A machine that never ran Alpöge’s code, whose only input from the build was the exported proof, builds the same checkers and the same challenge from source, and checks the export there.' },
    { t: 'The two releases combined', rows: ['BRu'], d: 'The August proof and this one in one environment, to test whether this release discharges the RH hypothesis of the August bound there. '
      + (status('BRu') === 'refused' ? 'Not run: closed for cost before the statement judge reported (A21). The conditional statement, with RH and the August bound as hypotheses, is compiled (step 2).' : '') },
    { t: 'The closing record', rows: [], final: true, d: 'Every verdict, the gaps first.' }
  ];
  const stOfId = (id) => (ALL.find((z) => z.id === id) || { st: status(id) }).st;
  let nowSeen = false;
  const st = STAGES.map((S) => {
    if (S.final) return CLOSED && FINAL ? 'done' : 'planned';
    if (!S.rows.length) return 'done';
    /* a step whose checks were refused is not done: it says so, in the grey of a step not reached (no new colour) */
    if (S.rows.every((id) => stOfId(id) !== 'pending') && S.rows.some((id) => ['refused', 'refuted'].includes(stOfId(id)))) return 'refused';
    if (S.rows.every((id) => stOfId(id) !== 'pending')) return 'done';
    if (!nowSeen) { nowSeen = true; return 'now'; }
    return 'next';
  });
  const WORDS = { done: 'done', now: 'pending now', next: 'next', planned: 'when every check has a verdict', refused: 'refused' };
  let prog = '';
  const bi = 2;
  if (st[bi] === 'now' && B1P.built && stOfId('B1') === 'pending') {
    const pct = Math.floor(100 * B1P.built / B1P.of);
    const mins = (Date.parse(B1P.at) - Date.parse(B1P.started)) / 60000, rate = B1P.built / mins;
    const eta = new Date(Date.parse(B1P.at) + (B1P.of - B1P.built) / rate * 60000).toISOString();
    prog = '<div class="tl-bar" role="img" aria-label="' + C.escAttr(pct + '% of the files compiled') + '"><span style="width:' + pct + '%"></span></div>'
      + '<p class="tl-count"><b>' + pct + '%</b> · ' + N(B1P.built) + ' of ' + N(B1P.of) + ' files compiled at ' + C.esc(hhmm(B1P.at)) + ' · ' + B1P.failed + ' errors · ' + B1P.sorry + ' sorry</p>'
      + '<p class="tl-proj">projected end of the build: about ' + C.esc(hhmm(eta)) + ', at its average pace so far (' + Math.round(rate) + ' files a minute)</p>';
  }
  return '<section class="tl" aria-label="The release timeline"><div class="tl-head"><span class="tl-k">Where the checks stand</span>'
    + '<span class="tl-sub">' + C.esc('Status at ' + LAST + ': ' + done.length + ' of ' + ALL.length + ' checks done, ' + pending.length + ' pending, ' + refused.length + ' refused' + (refuted.length ? ', ' + refuted.length + ' refuted' : '') + '. Results land on this page as each check finishes; the closing record goes out only in a closing state the rules name, never on an untraced rejection.') + '</span></div>'
    + '<ol class="tl-rail">' + STAGES.map((S, i) => '<li class="tl-step tl-' + st[i] + '"><span class="tl-dot" aria-hidden="true"></span>'
      + '<span class="tl-n">' + (i + 1) + '</span><span class="tl-t">' + C.esc(S.t) + '</span><span class="tl-st">' + C.esc(WORDS[st[i]]) + '</span>'
      + '<span class="tl-d">' + C.esc(S.d) + (S.link ? ' <a href="' + C.escAttr(S.link) + '">Read them.</a>' : '') + '</span>' + (i === bi ? prog : '') + '</li>').join('') + '</ol></section>';
}

/* ---------------------------------------------------------------- the page */
/* ONE title in every state (draft, closing, held): it names the release and the work, and never says that RH is proved.
   design/titles.json holds the same string as `title` and `was`, so the registry never swaps a draft title back in. */
const TITLE = 'Checking Alpöge’s Lean release on RH and Dirichlet GRH';
/* the opening, read from the record clause by clause. The release rule (pre-registration) puts the gaps first: what is
   pending, refused or refuted, and the readings, then what is done. Each clause appears only when its checks are in
   that state; no clause says more than its rows. */
const d_ = (id) => status(id) === 'decided';
const hm = (sec) => new Date(Number(sec) * 1000).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
const S1START = (jr('S1.start') || '').trim();
/* each check that is not done, in plain words, with its reason (the record's reason, put without its internal words) */
function notDone(x) {
  const r = row(x.id), c = r.controls || {};
  if (x.id === 'S1' && x.st === 'pending') return 'the statement judge Comparator (' + (S1START ? 'started on the larger machine at ' + hm(S1START) + ', no exit yet' : 'not started') + ')';
  if (x.id === 'C1-C5' && x.st === 'pending') { const n4 = ['C2', 'C3', 'C4', 'C5'].filter((k) => c[k] && c[k].refused).length;
    return 'the last planted error, C1 (' + (jr('C1.start') === null ? 'queued behind the statement judge' : 'started, no exit yet') + '; ' + (n4 === 4 ? 'the other four were each rejected' : nw(n4) + ' of the other four were rejected') + ')'; }
  if (x.id === 'BRu' && x.st === 'refused' && r.dropped) return 'the two releases in one environment (not run: dropped for cost before the statement judge had a verdict, amendment A21)';
  if (x.id === 'S1' && ENDING === 'D') return 'the statement judge Comparator (no verdict: stopped for cost after ' + SD.hours + ' hours on the larger machine, amendment A25; an earlier run, at the build machine’s 256 GB limit, was stopped when it made no progress, amendment A17)';
  if (x.id === 'C1-C5' && ENDING === 'D') return 'the planted-error check as a whole (C1, which needs the same judge on the same machine, was never started, amendment A25; C2 to C5 were each rejected)';
  if (x.id === 'S1' && x.st === 'refused' && (r.runs || {})['larger machine'] === 'resources') return 'the statement judge Comparator (it stopped on resources on the larger machine and gives no verdict; an earlier run, at the build machine’s 256 GB limit, was stopped when it made no progress, amendments A17 and A19)';
  if (x.id === 'S1' && x.st === 'refused' && (r.runs || {})['larger machine'] === 'rejected') return 'the statement judge Comparator (it reported a rejection on the larger machine; under amendment A17 the check is refused until the rejection is traced)';
  if (x.id === 'C1-C5' && x.st === 'refused' && /^C1 was not run/.test(r.why)) return 'the planted-error check as a whole (C1 has no result on the larger machine, amendment A19; C2 to C5 were each rejected)';
  return 'the check “' + x.t + '” (' + WORD[x.st] + '; the record’s reason is in the table of checks)';
}
const READS = ALL.filter((x) => x.st === 'read');
/* each reading with its standing as the record states it (once, twice) and its reader where the record names one */
const READ_OF = { M1: RDG.M1_metaprogramming, F1: RDG.F1_riemannHypothesis, F2: RDG.F2_dirichlet, ROUTE: RT };
const READ_WORDS = { M1: 'the release’s metaprogramming', F1: 'Mathlib’s RH against the classical statement', F2: 'what GRH covers here', ROUTE: 'the route inside the proof' };
const howRead = (id) => { const s = ((READ_OF[id] || {}).standing || ''); return (/TWICE/.test(s) ? 'read twice' + (/two model families/.test(s) ? ', by two model families' : '') : /ONCE/.test(s) ? 'read once' : 'read') + (/Astra 6\.2/.test(s) ? ', by Astra 6.2' : '') + (/spot-checked/.test(s) ? ', five items spot-checked here' : ''); };
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
/* the deck names the gaps by count; the list under the header gives each with its reason */
const gapWords = () => {
  const xs = [pending.length ? nw(pending.length) + ' ' + (pending.length === 1 ? 'is' : 'are') + ' pending' : null, refused.length ? nw(refused.length) + ' ' + (refused.length === 1 ? 'was' : 'were') + ' refused' : null,
    refuted.length ? nw(refuted.length) + ' ' + (refuted.length === 1 ? 'was' : 'were') + ' refuted' : null, nw(READS.length) + ' ' + (READS.length === 1 ? 'is a reading' : 'are readings') + ' that no program decides'].filter(Boolean);
  return 'Of those checks, ' + (xs.length > 1 ? xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1] : xs[0]) + '; each is listed with its reason just below.';
};
const doneWords = () => {
  const c = row('C1-C5').controls || {};
  const nrej = ['C1', 'C2', 'C3', 'C4', 'C5'].filter((k) => c[k] && c[k].refused).length;
  const xs = [d_('I1') ? 'the files are the announced ones' : null, d_('B1') ? 'all 175,187 Lean source files compile' : null,
    d_('K2') && d_('KR') && d_('K3') ? 'Lean’s own replay, nanoda and con-leche accept the compiled proof' : null,
    d_('CR') ? 'on a clean machine whose only input from the build was the exported proof, nanoda accepted it and con-leche matched each of the five theorems to the challenge compiled there' : null,
    d_('S1') ? 'Comparator accepted the five theorems against our challenge on the larger machine' : null,
    d_('SPEC') && d_('CHAR') ? 'Lean proves Mathlib’s RH and the release’s Dirichlet zero statement each equivalent to its textbook form' : null,
    d_('C1-C5') ? 'the five planted errors were each rejected by the tool they target' : nrej ? nw(nrej) + ' of the five planted errors were rejected by the tool they target' : null].filter(Boolean);
  return xs.length ? (CLOSED ? 'Done: ' : 'Done so far: ') + xs.join('; ') + '. ' : '';
};
/* state D leads with the gap (the operator's rule for this ending: the central check gave no verdict is the headline
   fact), then the two refusals beside it, then the release and the counts, then what is done */
const DECK_D = () => 'The central check of this audit did not finish. Comparator, the tool registered to test whether the five theorems of Levent Alpöge’s Lean release state what our challenge states, ran for '
  + SD.hours + ' hours on a rented machine with ' + SD.lim + ' GB of memory, printed nothing of its own, and was stopped on ' + SD.day + ' 2026 for cost. It gave no verdict, for or against. '
  + 'The planted error that was to test it there (C1) was never started, and a third check, the two releases in one environment, had been dropped for cost on ' + SD.bru + '. '
  + 'The release (alpo.ge, 20 November 2026) is 175,187 Lean source files stating the Riemann Hypothesis and GRH for Dirichlet L-functions; Alpöge says he made the proof working with Claude. This page puts it through ' + ALL.length + ' checks. '
  + gapWords() + ' '
  + doneWords()
  + 'What a computer check cannot tell you is said just as plainly below.';
const DECK = ENDING === 'D' ? DECK_D() : 'On 20 November 2026 Levent Alpöge announced a proof of the Riemann Hypothesis and of GRH for Dirichlet L-functions, which he says he made working with Claude, and released it only as Lean: 175,187 source files, in a language whose kernel, a small program, checks each declaration it is given. '
  + 'This page puts that release through ' + ALL.length + ' checks. '
  + (ENDING === 'hold' ? 'Every check has a state, but not one of the closing states the rules name, so this page holds until the record is traced. ' : '')
  + gapWords() + ' '
  + doneWords()
  + 'What a computer check cannot tell you is said just as plainly below.';
const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · generated from the record' + (pending.length ? ' · DRAFT' : ENDING === 'hold' ? ' · HELD' : ' · FINAL'),
  title: TITLE,
  deck: DECK
}));
/* the gaps, in full, before anything else on the page (the release rule): every check that is not done with its reason,
   every reading with its standing, and what lies outside the 24 */
const F3R = ((RDG.F3_remark || {}).rows || []).find((r) => /^REFUSED/.test(r[1] || ''));
/* state D: the stop itself, in full, is the first thing under the header; then what compares the statements in its place */
const GAP_STOP = ENDING === 'D' ? { b: 'The statement judge gave no verdict.', text: 'Comparator started on the larger machine at ' + utc(STOP.started) + ' and was stopped at ' + utc(STOP.at)
  + ', on the operator’s word, for cost. By then it had run ' + hmin(STOP.comparator_elapsed_seconds) + ', used ' + hmin(STOP.comparator_cpu_seconds) + ' of processor time and held about ' + SD.gb + ' GB of the machine’s ' + SD.lim
  + ' GB. Its own time limit was ' + SD.limit_h + ' hours, and nothing had been killed for memory. It had printed no line of its own: no acceptance, no mismatch, no error. '
  + 'This is not evidence against the proof, and it is not evidence for it. It is the second check of this audit closed for cost. This ending was not one of the two registered before the judge could report: amendment A25, written after the stop, records it.' } : null;
const GAP_ONE_TOOL = ENDING === 'D' && d_('K3') && d_('CR') && (row('CR').gates || {}).CRS && (row('CR').gates || {}).CRC1 && ((row('K3').controls || {}).K3C1 || {}).refused
  ? { b: 'So one tool compared the statements, not two.', text: 'con-leche matched each of the five theorems to our challenge, on the build machine and on the clean machine, and on both it rejected the challenge with 1/2 changed to 1/3. Comparator, the tool registered for this check, gave no verdict.' } : null;
const GAPS = [
  GAP_STOP,
  pending.length ? { b: 'Pending.', text: pending.map((x) => cap(notDone(x))).join('. ') + '.' } : null,
  refused.length ? { b: 'Refused.', text: refused.map((x) => cap(notDone(x))).join('. ') + '.' } : null,
  refuted.length ? { b: 'Refuted.', text: refuted.map((x) => cap(notDone(x))).join('. ') + '.' } : null,
  GAP_ONE_TOOL,
  { b: 'Readings.', text: cap(READS.map((x) => (READ_WORDS[x.id] || x.t) + ', ' + howRead(x.id)).join('; ')) + '. A reading is attributed to its reader, and no program decides it.' },
  { b: 'Outside the ' + ALL.length + '.', text: 'A clean second verifier (V) was registered and dropped before it ran (amendment A7). '
    + (F3R ? 'The remark’s sentences about the process (' + F3R[0] + ') cannot be decided from the files. ' : '')
    + 'The comparison with Masullo’s draft rests on our reading of a theorem the draft has not yet stated.' },
  { b: CLOSED ? 'What the checks that are done do not mean.' : 'What a pass would not mean.', text: 'These checks are about a formal release: whether its files compile, what its statements say, and whether independently written checkers accept its compiled proof. They do not judge the mathematics as mathematics, they are not a refereed review, and they do not explain why the argument works.' }
].filter(Boolean);
O.push('<div class="col">' + C.plainList(GAPS) + '</div>');
O.push('<div class="col">' + (pending.length ? '<p class="draft-note"><b>Draft.</b> ' + C.esc(pending.length + ' of ' + ALL.length + ' checks are pending. The build, replay and judging rules were registered before those runs' + (AFTER.length ? '; ' + AFTER_WORDS : '') + '. This page rebuilds from the record as results arrive.') + '</p>'
  : ENDING === 'hold' ? '<p class="draft-note"><b>Held.</b> ' + C.esc('No check is pending, but the record is not in one of the closing states the rules name. The page holds until the result is traced and a dated amendment says how it is read.') + '</p>' : '')
  + '<p class="upd">Last updated ' + C.esc(LAST) + ' · <a href="#changes">changes to this page</a></p></div>');
if (pending.length) O.push('<div class="wide">' + timeline() + '</div>');
O.push(C.figure({ hero: true, svgRaw: figWheel(900, false), svgNarrowRaw: figWheel(360, true), record: [REC, DIR + 'readings.json', DIR + 'route-reading.json'],
  caption: 'Every check on this page, as one ring. Each arc is one check; hover or tap it for what it tests. Solid arcs are decided by a program; dashed arcs are counts and comparisons computed by a program; dotted arcs are readings by a person or a model, which no program decides. A grey arc is refused, and an empty track is pending. Decided means the record meets the check’s registered rule.',
  stop: 'a check drawn as done is not done in the record' }));
O.push('<div class="col">' + W.legendHtml({ compact: true }) + '</div>');
const CTL0 = row('C1-C5').controls || {};
const NREJ = ['C1', 'C2', 'C3', 'C4', 'C5'].filter((k) => CTL0[k] && CTL0[k].refused).length;
O.push(C.stats([
  { k: 'checks done', v: done.length + ' of ' + ALL.length, n: [pending.length ? pending.length + ' pending' : 'none pending', refused.length ? refused.length + ' refused' : null, refuted.length ? refuted.length + ' refuted' : null].filter(Boolean).join(' · ') },
  { k: 'axioms the proof uses', v: status('A1') === 'decided' ? '3' : '…', n: status('A1') === 'decided' ? 'propext, Classical.choice, Quot.sound — the standard three' : 'the report is pending' },
  { k: 'planted errors caught', v: NREJ + ' of 5', n: status('C1-C5') === 'decided' ? 'each by the tool it targets' : status('C1-C5') === 'pending' ? 'C1 pending, behind the statement judge' : ENDING === 'D' ? 'C1 was never started (amendment A25)' : CTL0.C1 && CTL0.C1.exit === null ? 'C1 has no result (amendment A19)' : 'see the cards below' },
  { k: 'kernels that accept it', v: ['K2', 'KR', 'K3'].some((i) => status(i) !== 'pending') ? ['K2', 'KR', 'K3'].filter((i) => status(i) === 'decided').length + ' of 3' : '…', n: 'nanoda, Lean’s own replay, con-leche' }
]));
O.push(C.scope('This page checks a formal release: whether the files compile, what the statements say, and whether independent checkers accept the compiled proof. It does not judge the mathematics as mathematics, and it is not a refereed review.'));

/* 1 · what is claimed */
O.push(C.section({ lab: '1 · what is claimed', title: 'One sentence about where ζ vanishes', id: 'claim', wide: true, bodyRaw:
  '<div class="col">' + C.plainList([
    { b: 'The Riemann Hypothesis.', text: 'The zeta function ζ(s) is zero at s = −2, −4, −6, … (the “trivial” zeros) and at infinitely many other points, all inside the vertical band 0 < Re s < 1. RH says all those other zeros lie exactly on the middle line, Re s = 1/2. It controls how evenly the primes are spread.' },
    { b: 'What the proof states.', raw: C.esc('The headline theorem is ') + '<span class="m">riemannHypothesis : RiemannHypothesis</span>' + C.esc(', where RiemannHypothesis is Mathlib’s own definition, written years before this release: every zero of ζ, except the trivial ones and the point s = 1, has real part 1/2.') },
    { b: 'Is that really RH?', text: 'Two readers from two model families say yes. We also wrote RH the textbook way (“every zero in the critical strip has real part 1/2”) and proved in Lean that the two formal statements are equivalent, over the same Mathlib ζ. That the Mathlib function is the classical ζ stays a reading; the next point removes that dependence for two of the statements.' },
    { b: 'Even without Mathlib’s ζ.', text: 'In a workspace with Mathlib alone, Lean proves that Mathlib’s RiemannHypothesis and the release’s DirichletLZerosOnLine are each equivalent to the corresponding textbook strip statement, with ζ and the L-functions characterised the way a textbook does: holomorphic on ℂ ∖ {1} and equal to the series 1 + 2^−s + 3^−s + … (and Σ χ(n)·n^−s) for Re s > 1, a holomorphic function being fixed by its values there' + (status('CHAR') === 'decided' ? '.' : ' (pending).') + ' For those two statements the meaning no longer depends on how Mathlib defines ζ or L. The release’s other three statements were matched to our challenge by con-leche and read twice; this proof does not cover them.' }
  ]) + '</div>'
  + '<div class="wide zp-wrap">' + planeButtons + '</div>'
  + C.figure({ svgRaw: dual(figPlane(900, false), figPlane(360, true)), record: ['instruments/alpoge-grh/spec/Spec.lean', DIR + 'runs-spec/spec-axioms.out', DIR + 'readings.json'],
    caption: 'The complex plane, where RH lives. The band is the critical strip; the line in it is Re s = 1/2, with the first five nontrivial zeros of ζ of positive imaginary part drawn on it (published values, quoted as an illustration, not computed here). The dots on the left are the trivial zeros; the ring at 1 is the classical pole, a point every statement excludes. ζ has no zeros right of the band (the grey region). Use the buttons: Mathlib’s definition and the textbook form talk about the same zeros, and a Lean proof says so.',
    stop: 'the record does not show the equivalence proof (SPEC) compiled on the three standard axioms' })
  + '<div class="col">' + C.plainList([
    { b: 'And GRH?', text: 'Of the five theorems, two are about ζ (RH, in two forms) and three about Dirichlet L-functions, the relatives of ζ that count primes in arithmetic progressions, for every positive modulus and every character: no zero right of 1/2 (away from the principal pole), every zero in the critical strip on the line, and the same for primitive characters. Our second reading’s label for this is GRH for Dirichlet L-functions. The release makes no general claim about other number fields; the announcement expects the “Extended” RH “with more time”.' }
  ]) + '</div>' }));

/* 2 · how big */
O.push(C.section({ lab: '2 · how big is it', title: '17 million lines, five statements', id: 'size', wide: true, bodyRaw:
  C.figure({ svgRaw: dual(figTree(900, false), figTree(360, true)), record: [DIR + 'source-stats.json', DIR + 'PINS.json'],
    caption: 'The release, drawn by size: each large rectangle is a library, its area proportional to its lines of Lean, split into its folders; the smallest libraries are listed under it. Hover for counts. Nobody can read this by hand. Lean’s kernel checks each declaration it is given; what that does not cover, the checks below test separately.',
    stop: 'the counts are not of the pinned archive' })
  + '<div class="col">' + C.plainList([
    { b: 'Why a computer check matters.', text: 'A human-readable version of this argument would run past 250,000 pages, the author says. A formal development this size is checked the way a large program is: by checkers written by different people, run on the compiled declarations, agreeing. Whether its statements mean what mathematicians mean is checked separately, by the statement checks and the readings.' },
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
/* the kernels step is decided only when all three are; running while any runs; otherwise its worst state */
const KST = (() => { const s3 = ['K2', 'KR', 'K3'].map(fst); return s3.every((x) => x === 'decided') ? 'decided' : s3.includes('pending') ? 'pending' : s3.find((x) => x !== 'decided'); })();
const STEPS = [
    { id: 'bytes', role: roleOf(fst('I1')), standing: standing(fst('I1')), k: '1 · THE FILES · ' + WORD[fst('I1')].toUpperCase(), v: 'the 14 announced parts', t: 'the files', d: 'The archive is fetched from alpo.ge and every part checked against the checksums recorded the day it appeared. The registered fetch matched, and so did the later fetches on two more machines.' },
    { id: 'build', role: roleOf(fst('B1')), standing: standing(fst('B1')), k: '2 · THE BUILD · ' + WORD[fst('B1')].toUpperCase(), v: '175,187 source files compile', t: 'the build', d: 'Lean compiles every Lean source file with exit 0, and every source has its compiled file. Compiling runs the kernel on each declaration, but a placeholder (sorry) passes with a warning: the next step is what catches it.' },
    { id: 'ax', role: roleOf(fst('A1')), standing: standing(fst('A1')), k: '3 · THE AXIOMS · ' + WORD[fst('A1')].toUpperCase(), v: 'only the standard three', t: 'the axioms', d: 'Lean reports which axioms each theorem ultimately rests on. Anything beyond propext, Classical.choice and Quot.sound — sorryAx, the axiom behind the placeholder sorry, included — would be a hole.' },
    { id: 'kern', role: roleOf(KST), standing: standing(KST), k: '4 · THREE KERNELS · ' + WORD[KST].toUpperCase(), v: 'nanoda, Lean’s replay, con-leche', t: 'three kernels', d: 'The proof is exported and checked by nanoda and by con-leche, two kernels written independently of Lean, and Lean’s own checker replays the compiled modules from an empty environment. A kernel bug would have to be shared by all three to pass, and Lean’s replay does not read the export.' },
    { id: 'judge', role: roleOf(fst('S1')), standing: standing(fst('S1')), k: '5 · THE STATEMENTS · ' + WORD[fst('S1')].toUpperCase(), v: 'the five theorems against our challenge', t: 'the statements', d: 'Comparator, the Lean FRO’s statement-comparison tool, tests whether the five proved theorems state what our challenge states: a file compiled from Mathlib alone, holding Mathlib’s RH and the four statements as the release’s Statements.lean writes them. It compares each declaration and every constant it uses, bodies included, so no definition elsewhere in the release can change their meaning. '
      + (fst('S1') === 'decided' ? 'It accepted Main, with Lean’s default kernel, in landrun’s best-effort sandbox. ' : fst('S1') === 'pending' ? 'Its verdict is pending. '
        : ENDING === 'D' ? 'It gave no verdict: it was stopped for cost after ' + SD.hours + ' hours, having printed nothing of its own (amendment A25). ' : 'It gave no verdict. ') + 'con-leche makes the same comparison separately (step 4).' },
    { id: 'ctl', role: roleOf(fst('C1-C5')), standing: standing(fst('C1-C5')), k: '6 · PLANTED ERRORS · ' + WORD[fst('C1-C5')].toUpperCase(), v: 'five planted changes', t: 'planted errors', d: 'The controls test whether each tool detects a specified change: a changed constant in the challenge (C1), a smuggled axiom (C2), a missing proof (C3), a hijacked definition (C4) and the exported theorem re-typed as False (C5). Comparator must reject C1 to C4, Lean’s axiom report must also name the plants in C2 and C3, and nanoda must reject C5.'
      + (ENDING === 'D' ? ' C2 to C5 were each rejected. C1 was never started, so the check as a whole is refused.' : '') },
    ENDING === 'D' && KST === 'decided' && d_('A1') && d_('CR')
      ? { id: 'what', role: 'held', k: 'AND WHAT THIS MEANS', v: 'a fact about a formal release', t: 'what it means', d: 'Lean’s kernel and two independently written ones accept closed terms of the five stated theorems from the three standard axioms, and one tool, con-leche, matches the statements to our Mathlib-only challenge. Comparator, the judge registered for that comparison, gave no verdict. That is a fact about a formal release. It is not a refereed review, and it does not explain why the argument works.' }
      : { id: 'what', role: 'held', k: 'AND WHAT A PASS MEANS', v: 'a fact about a formal release', t: 'what it means', d: 'If the remaining checks pass, independently written kernels accept closed terms of the five stated theorems from the three standard axioms, and the statements match our Mathlib-only challenge. That is a fact about a formal release. It is not a refereed review, and it does not explain why the argument works.' }
];
const stepState = (n) => n.id === 'what' ? 'held' : n.role === 'sig' ? 'decided' : n.role === 'dep' ? 'pending' : n.role === 'warn' ? 'refused' : 'held';
const SCH = C.figure({ record: [REC],
  svgRaw: '<ol class="ch" aria-label="The checks as a chain, in order">' + STEPS.map((n, i) => {
    const st = stepState(n), parts = n.k.split(' · ');
    const word = /PENDING|RUNNING|DECIDED|REFUSED|REFUTED|COMPUTED|READ/.test(parts[parts.length - 1]) ? parts.pop() : null;
    return '<li class="ch-step ch-' + st + '">'
      + (i < STEPS.length - 1 ? '<span class="ch-flow" aria-hidden="true" style="animation-delay:' + (-i * 0.55).toFixed(2) + 's"></span>' : '')
      + '<div class="ch-box"><span class="ch-k">' + C.esc(parts.join(' · ')) + (word ? ' · <span class="ch-st">' + C.esc(word.toLowerCase()) + '</span>' : '') + '</span>'
      + '<span class="ch-v">' + C.esc(n.v) + '</span></div>'
      + '<p class="ch-d">' + C.esc(n.d) + '</p></li>';
  }).join('') + '</ol>',
  caption: 'How the release is checked, in six steps and a note on what they mean. A box is outlined bright when the record has decided its step, ' + (pending.length ? 'and faint while it is pending.' : 'and grey when its step was refused.'),
  stop: 'a step drawn as decided is not CERTIFIED in the record' });
O.push(C.section({ lab: '3 · how a computer checks it', title: 'Six checks, each able to say no', id: 'chain', wide: true, bodyRaw: SCH }));

/* 4 · the checks, one by one */
/* a check that is not done shows the record's own reason beside what it tests (the row's why, as recorded) */
const TABROWS = ALL.map((x) => [x.t, x.g, { raw: C.tag(WORD[x.st], x.st === 'decided' ? 'held' : x.st === 'pending' || x.st === 'dropped' ? 'open' : x.st === 'refused' || x.st === 'refuted' ? 'dep' : 'cert') },
  x.d + (['pending', 'refused', 'refuted'].includes(x.st) && R.rows.some((r) => r.id === x.id) ? ' The record: ' + row(x.id).why + '.' : '')]);
O.push(C.section({ lab: '4 · every check', title: 'The ' + ALL.length + ' checks, one by one', id: 'checks', wide: true, bodyRaw:
  '<div class="col">' + C.p('Every arc of the ring above is one check. The build, replay and judging rules were registered before those runs, and every later change is dated' + (AFTER.length ? '; ' + AFTER_WORDS : '') + '.')
  + C.plainList([{ b: 'Negative controls.', text: 'Five planted changes test whether specified tools detect specified errors: Comparator must reject C1 to C4, Lean’s axiom report must also name the plants in C2 and C3, and nanoda must reject C5. Each is a separate input, built to be wrong; none of them is the release. con-leche also rejected C1 on the build machine and on the clean machine, and nanoda and con-leche each rejected C5 on the clean machine; those results are reported beside the registered controls. If a plant were accepted, the controls check would fail: the tool that accepted it could not be trusted on that run.'
    + (ENDING === 'D' ? ' C1 has no Comparator result: it was queued behind the statement judge on the larger machine and was never started.' : '') }]) + '</div>'
  + plantedCards()
  + '<div class="wide"><details class="more"><summary>All ' + ALL.length + ' checks, one by one</summary>' + C.table({ cols: [{ h: 'Check' }, { h: 'Group' }, { h: 'State' }, { h: 'What it means' }], rows: TABROWS }) + '</details></div>'
  + '<div class="col">' + C.plainList([
    { b: 'Registered first.', raw: C.esc('The build, replay and judging rules were committed in public before those runs, and every later change is dated' + (AFTER.length ? ', the ' + nw(AFTER.length) + ' made after a result (' + AFTER.join(', ') + ') marked as such' : '') + ': ') + rec('notes/alpoge-grh-preregistration-2026-11-20.md') + C.esc(' (' + AMENDMENTS + ' amendments) and ') + rec(DIR + 'DEVIATIONS.md') + C.esc('.' + (ENDING === 'D' ? ' The state this page closes in, the statement judge stopped for cost with no verdict, was not registered in advance: amendment A25 records it, and was written after the stop.' : '')) },
    { b: 'Read by a model from another family.', text: 'Astra 6.2 gave second readings of the RH and Dirichlet statements, read the route inside the proof (five of its items spot-checked here against the archive) and red-teamed the plan three times. Its first round found a real defect in our own setup — the judge was configured to compare the types but not the bodies of four definitions — fixed before the affected Comparator runs (S1, C1 to C4).' }
  ]) + '</div>' }));

/* 5 · inside the proof */
O.push(C.section({ lab: '5 · inside the proof', title: 'What carries the conclusion', id: 'route', wide: true, bodyRaw:
  '<div class="col">' + C.plainList([
    { b: 'The route.', text: 'Read from the top down, by Astra 6.2: RH follows from “no Dirichlet L-function vanishes right of 1/2, away from the principal pole”, plus ζ’s functional equation for the left half. That in turn rests on a window criterion and on a link that takes a height equation and two inequalities as separate inputs.' },
    { b: 'Names are not evidence.', text: 'Several parts are named for deep mathematics but hold something else in the code: a geometry condition that is literally True, a geometric model whose key map is zero, a theorem named for a simple pole that proves True, two “literature” inputs that are the same proposition. The kernel checks what is there, not what things are called, so those names do not explain the proof.' }
  ]) + '</div>'
  + C.figure({ svgRaw: dual(figRoute(900, false), figRoute(360, true)), record: [DIR + 'route-reading.json'],
    caption: 'The route of the proof, from the headline down (solid boxes; a reading by Astra 6.2, five of its items spot-checked here against the archive), and, set apart under their own heading, four places named for deep mathematics that hold something else in the code (dotted boxes). They are not on the route as drawn; whether the compiled proof uses them is what the census measures. Hover for each. The highlighted box is the step whose two inequalities the readings leave untraced.',
    stop: 'a mark “in the proof term” is not the census’s count in the record' })
  + '<div class="col">' + C.plainList([
    { b: 'J. L. Nielsen’s critique.', raw: C.esc('A paper posted the same day, ') + a('https://philarchive.org/rec/NIEIOT-2', 'The Invalidity of Alpöge’s Proposed Proof of the Riemann Hypothesis') + C.esc(', reads the source and finds the vacuous geometric and lattice witnesses above, and a height set equal to its own formula. We checked each quote against the pinned archive: as quoted. Our verdict on that point: the geometric interpretation of this step remains unverified. The paper’s title goes further than its analysis: the formal theorem is decided by the kernels, not by the names, and the paper’s own Appendix A grants that it does not show the proof term fails to typecheck.') },
    { b: 'The question that remains.', text: 'The height enters with two inequalities supplied separately. ' + (WFW ? 'The census traces what feeds them in the compiled proof: ' + WFW + '. ' : 'The census traces what feeds them in the compiled proof (pending). ') + 'Whether those inputs carry the argument, and what they mean, is a question for number theorists, not for a kernel.' }
  ]) + '</div>' }));

/* 6 · bridges */
O.push(C.section({ lab: '6 · connections', title: 'Two other claims, connected in Lean', id: 'bridges', wide: true, bodyRaw:
  C.figure({ svgRaw: dual(figBridge(900, false), figBridge(360, true)), record: [DIR + 'runs-bridge/podB-lyq17afbn6smbz/P0J.out', DIR + 'runs-bridge/podB-lyq17afbn6smbz/BB2-after-fix.txt', 'instruments/alpoge-grh/bridge/CertMachine/BridgeConditional.lean', 'instruments/alpoge-grh/bridge/CertMachine/MasulloReading.lean'],
    caption: 'Three claims about the zeros of ζ from 2026, and what Lean says connects them. Solid arrows are statements compiled in Lean and checked here; each carries its hypotheses. The two releases in one environment, which would discharge the first arrow’s hypotheses, is its own check, written under that arrow with its state. The dotted box is a reading of a draft whose main theorem is not yet written.',
    stop: 'an arrow drawn as compiled is not CERTIFIED in the record' })
  + '<div class="col">' + C.plainList([
    { b: 'The August release.', text: 'Anthropic’s August release proves, asymptotically, that at least two thirds of the zeros are simple and on the critical line. It checks unchanged — all 326 source files — on the Mathlib of this release, and its own 17-statement judge run accepts it with nanoda and Lean’s kernel. Assuming RH and the August distinct-zero bound, Lean proves that for every ε > 0 the count of distinct zeros on the line is eventually at least (5/6 − ε) times the count of zeros with multiplicity; the same holds for each primitive Dirichlet character, assuming the primitive-character zero statement and its August bound. The simplicity bounds this implies are the August constants again. '
      + (status('BRu') === 'decided' ? 'In one environment, the two releases discharge those hypotheses: this release’s theorems supply the zero statements and the August theorems the bounds.'
        : status('BRu') === 'refused' ? 'Putting the two releases in one environment, to test whether they discharge those hypotheses there, was not run: it was dropped for cost before the statement judge reported (amendment A21).'
        : 'Putting the two releases in one environment, to test whether they discharge those hypotheses there, is pending.') },
    { b: 'Masullo’s draft.', raw: C.esc('Alessandro Maria Masullo’s draft (') + a('https://math216.wordpress.com/2026/11/20/hurried-announcement-alessandro-masullo-grh/', 'posted by Ravi Vakil') + C.esc(', 940 pages) describes a claim for every number field F: the nontrivial zeros on the critical line and, off the centre, multiplicity at most [F : ℚ]. Its main zero theorem is not yet written in the draft (page 522: “Insert statement.”). Assuming our reading of that description for ℚ, Lean derives the release’s zero statement for primitive characters, and simplicity of the zeros off the centre. An off-centre double zero of a primitive Dirichlet L-function would contradict that reading while remaining compatible with RH.') }
  ]) + '</div>' }));

/* 7 · credits */
O.push(C.section({ lab: 'credits', title: 'Whose work this uses', id: 'credits', bodyRaw: C.plainList([
  { b: 'The claim.', raw: C.esc('Levent Alpöge, ') + a('https://alpo.ge/remark.pdf', 'Remark') + C.esc(' and the Lean archive (alpo.ge, 20 November 2026); he says he worked with Claude.') },
  { b: 'An independent record.', raw: C.esc('Andrew Sutherland (MIT) published his own verification record of the release the same day, run with Claude Code: ') + a('https://math.mit.edu/~drew/grh/', 'math.mit.edu/~drew/grh') + C.esc('. Our comparison of compiled bytes uses his published manifest.') },
  { b: 'The community’s statement.', raw: C.esc('The Lean and Mathlib communities’ ') + a('https://leanprover-community.github.io/blog/posts/riemann-hypothesis/', 'joint statement on the release') + C.esc(' (21 November). We have not pinned a copy, and the record quotes nothing from it.') },
  { b: 'The second readings and the red team.', text: 'Astra 6.2, a model from another family: second readings of the RH and Dirichlet statements, the reading of the route inside the proof (five of its items spot-checked here against the archive), a reading that corrected our description of Masullo’s draft, and three red-team rounds on the plan. Its findings were checked against the sources here before any change was made.' },
  { b: 'The critique.', raw: C.esc('J. L. Nielsen, ') + a('https://philarchive.org/rec/NIEIOT-2', 'PhilArchive NIEIOT-2') + C.esc('.') },
  { b: 'The August release.', raw: a('https://github.com/anthropics/formal-math', 'anthropics/formal-math') + C.esc(', zeta23: Levent Alpöge and Ralph Furman, Claude, and the Lean formalization by Eric Easley’s team.') },
  { b: 'Masullo’s draft.', text: 'Alessandro Maria Masullo, “The Music of the Primes” (a draft), posted by Ravi Vakil. Its acknowledgments name Brian Conrad, under whom the work began at Stanford, and his planned help with the exposition.' },
  { b: 'The venue.', raw: C.esc('Terence Tao’s ') + a('https://terrytao.wordpress.com/2026/11/20/unforced-euler-singularity-unforced-navier-stokes-singularity-and-the-generalized-riemann-hypothesis/', 'post of 20 November') + C.esc(' and the Lean Zulip thread it names.') },
  { b: 'The tools.', text: 'Lean and Lake, Mathlib; Comparator, lean4export and con-leche (Lean FRO); nanoda (ammkrn); landrun; OpenTimestamps.' }
]) }));

/* 8 · check it yourself */
/* the rows the kit's comparison prints are the recorder's own list (POD_ROWS), read from its source, never typed twice */
const KIT_ROWS = ((fs.readFileSync(path.join(ROOT, 'tools', 'check-alpoge-grh.py'), 'utf8').match(/^POD_ROWS = \[([^\]]*)\]/m) || [])[1] || '').split(',').map((x) => x.trim().replace(/'/g, '')).filter(Boolean);
need(KIT_ROWS.length > 0 && KIT_ROWS.every((id) => R.rows.some((r) => r.id === id)), 'the rerun kit’s row list (POD_ROWS in tools/check-alpoge-grh.py) is not readable or names a row the record lacks');
const KIT_REFUSED = KIT_ROWS.filter((id) => status(id) === 'refused');
O.push(C.section({ lab: 'check it yourself', title: 'How to re-run it', id: 'rerun', bodyRaw: C.plainList([
  { b: 'The kit.', raw: C.esc('The kit in ') + rec('instruments/alpoge-grh/rerun/README.md') + C.esc(' reruns the build machine’s scripts on a Linux machine of your own and compares ' + KIT_ROWS.length + ' of the checks with ours (') + '<span class="m">--compare-run</span>' + C.esc(')'
    + (KIT_REFUSED.length ? '; ' + nw(KIT_REFUSED.length) + ' of those ' + KIT_ROWS.length + ' are refused here, so agreement on them means only that neither run has a verdict' : '') + '. Its README says what 256 GB of memory is enough for (the build and the three kernels) and what it is not enough for (the statement judge: amendment A17'
    + (ENDING === 'D' ? ', and A25 for what a larger machine gave' : '') + '), and why it still starts the bridge’s waiting script although the bridge was not run here (A21). In our run, Lean’s replay, the statement judge and the clean-machine check ran on separate machines (amendments A15, A17, A12).') },
  { b: 'The record.', raw: rec(REC) + C.esc(', re-derived from the machine’s logs by ') + rec('tools/check-alpoge-grh.py') + C.esc(' (') + '<span class="m">--check</span>' + C.esc(').') },
  { b: 'The machines’ scripts.', raw: rec('tools/runpod-alpoge-grh-p1.sh') + C.esc(' (fetch, challenge, build), ') + rec('tools/runpod-alpoge-grh-p2.sh') + C.esc(' (axioms, census, judge, controls, kernels), ') + rec('tools/runpod-alpoge-grh-p3-bridge.sh') + C.esc(' (the bridge, not run), ') + rec('tools/runpod-alpoge-grh-p4.sh') + C.esc(' (con-leche), ') + rec('tools/runpod-alpoge-grh-parallel.sh') + C.esc(' (Lean’s replay), ') + rec('tools/runpod-alpoge-grh-judge.sh') + C.esc(' and ') + rec('tools/runpod-alpoge-grh-judge-guard.sh') + C.esc(' (the statement judge on the larger machine) and ') + rec('tools/runpod-alpoge-grh-clean.sh') + C.esc(' (the clean machine).') },
  { b: 'Our challenge file and the proofs we wrote.', raw: rec('instruments/alpoge-grh/Challenge.lean') + C.esc(', ') + rec('instruments/alpoge-grh/spec/Spec.lean') + C.esc(', ') + rec('instruments/alpoge-grh/spec/Textbook.lean') + C.esc(' and ') + rec('instruments/alpoge-grh/bridge/CertMachine') + C.esc('.') },
  { b: 'The rules, timestamped.', raw: rec(DIR + 'timestamps/rules-2026-11-21.txt') + C.esc(' lists the checksums of ' + nw(RULES_N) + ' rule files as they stood at ' + RULES_AT.replace('T', ' ') + ' UTC, before S1, K2 and K3 reported; the amendments after that are not in it. Its OpenTimestamps proof (') + rec(DIR + 'timestamps/rules-2026-11-21.txt.ots') + C.esc(OTS_BTC ? ') anchors it in Bitcoin.' : ') holds pending attestations from ' + nw(OTS_CAL) + ' calendars; its Bitcoin confirmation was still pending at this update.') }
]) }));

/* each entry's count is printed against the number of checks at its time: amendment A12 (2026-11-21, about 12:30 UTC)
   added three checks to the first 21, so an entry from before it says "of the then 21" (an outside reading, 2026-11-23) */
const A12_AT = '2026-11-21T12:30Z', BEFORE_A12 = ALL.length - 3;
const ofAt = (e) => (e.at < A12_AT ? ' of the then ' + BEFORE_A12 : ' of ' + ALL.length);
O.push(C.section({ lab: 'changes', title: 'Changes to this page', id: 'changes', bodyRaw: C.plainList(LOG.slice().reverse().map((e) => ({ b: e.at.replace('T', ' ').replace('Z', ' UTC') + '.', text: e.what + (e.done !== undefined ? ' (' + e.done + ofAt(e) + ' checks done.)' : '') }))) }));

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
/* the ring's staggered entrance, as classes (an inline delay per arc grew the page's inline styles each time a check landed) */
const WHD = Array.from({ length: ALL.length }, (_, k) => '.wd' + k + '{animation-delay:' + (k * 90) + 'ms}.ws' + k + '{animation-delay:' + (200 + k * 90) + 'ms}').join('');
const STYLE = WHD + `
.tl{margin:var(--s-4) 0 var(--s-2);border-top:1px solid var(--rule-strong);border-bottom:1px solid var(--rule-strong);padding:var(--s-4) 0 var(--s-5);}
.tl-head{display:flex;flex-direction:column;gap:var(--s-1);margin-bottom:var(--s-4);}
.tl-k{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink);font-weight:bold;}
.tl-sub{font-size:var(--text-small);color:var(--ink-2);}
.tl-rail{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:0 var(--s-3);}
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
.tl-next .tl-t,.tl-planned .tl-t,.tl-refused .tl-t{color:var(--ink-2);}
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
const foot = '<p>' + C.esc('Generated by tools/build-report-alpoge-grh.js from ' + REC + (pending.length ? ' — a draft: ' + pending.length + ' checks pending.' : ENDING === 'hold' ? ' — held.' : '.') + ' I did this with Claude (Anthropic), which wrote this audit’s programs under my direction; Astra 6.2 gave second readings and red-teamed.') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p>';
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'alpoge-grh.html'), TPL.render({ title: TITLE + ' · cert-machine', bodyRaw: O.join('\n\n'), footRaw: foot, path: '/reports/alpoge-grh.html',
  cssRaw: STYLE, scriptRaw: SCRIPT, og: { image: '/og-alpoge-grh.png', alt: OG.alt('alpoge-grh') },
  /* the description travels without the page (search results, share cards): in state D it carries the headline fact too */
  desc: (ENDING === 'D' ? 'The central check gave no verdict: the statement judge was stopped for cost after ' + SD.hours + ' hours. ' + done.length + ' of ' + ALL.length + ' checks are done and ' + refused.length + ' refused. ' : '')
    + 'Levent Alpöge’s Lean release on the Riemann Hypothesis and GRH for Dirichlet L-functions, put through ' + ALL.length + ' checks under rules registered before the build and the judges ran: the files, the build, the axioms, three kernels, the statements against our challenge and their textbook forms, planted errors, the route inside the proof and two bridges, with what the checks do not settle first.' }));
console.log('reports/alpoge-grh.html written · ' + done.length + ' of ' + ALL.length + ' done · ' + pending.length + ' pending · ' + refused.length + ' refused · ' + refuted.length + ' refuted · state ' + ENDING + (FINAL ? ' · FINAL' : ''));
