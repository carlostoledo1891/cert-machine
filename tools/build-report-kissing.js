#!/usr/bin/env node
/* build-report-kissing.js — reports/kissing.html: the kissing ledger.

   Dimension 11's kissing record moved three times in eighteen months and
   every mover was an AI system — AlphaEvolve (593), the EinsteinArena
   agents (594 on the public rung; 604 in the paper), the Station agents
   (three exact 604s in Q(sqrt2)). Each was validated by its producer's own
   verifier. This page re-decides every public witness in exact arithmetic
   over Z[sqrt2] on BigInt, shared-nothing with all of them. The
   EinsteinArena 604's bytes were not public when this ledger first ran
   (2026-09-03): the row read NEEDS DATA and named what would decide it;
   the maintainer published the file on request four days later and the
   row decided. The page tells that story with the dates from the record.

   Gates: the ledger re-runs live at this build (every verdict recomputed
   from the pinned corpus bytes), and the kissing battery must pass with
   every red control fired. A REFUTED row refuses the page.

   usage: node tools/build-report-kissing.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('KISSING REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- gate 1: the ledger, recomputed live ---- */
const led = cp.spawnSync('node', [path.join(ROOT, 'tools', 'run-kissing-ledger.js')], { cwd: ROOT });
if (led.status !== 0) die('the ledger run failed:\n' + String(led.stderr).slice(-600));

/* ---- gate 2: the battery, every red fired ---- */
const bat = cp.spawnSync('node', [path.join(ROOT, 'instruments', 'kissing', 'battery.js')], { cwd: ROOT });
const bout = String(bat.stdout) + String(bat.stderr);
const bm = /kissing battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(bout);
if (bat.status !== 0 || !bm || bm[2] !== bm[3]) die('the kissing battery did not pass clean:\n' + bout.slice(-600));
const nChecks = Number(bm[1]), nReds = Number(bm[2]);

const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'kissing-ledger.json'), 'utf8'));
const row = (id) => { const r = L.rows.find((x) => x.id === id); if (!r) die('missing row ' + id); return r; };
const ae = row('alphaevolve-593'), ea = row('ea-594-winner');
const s1 = row('station-604-1'), s2 = row('station-604-2'), s3 = row('station-604-3');
const sh = row('station-shell-582'), lift = row('station-d12-lift'), ea604 = row('ea-604');
const certified = L.rows.filter((r) => r.verdict === 'CERTIFIED').length;
if (ea604.verdict !== 'CERTIFIED' || ea604.uniformNorm !== true) die('the EinsteinArena 604 row is not CERTIFIED at its shell norm');
if (!ea604.sameGramProfileAs || ea604.sameGramProfileAs.length !== 1 || ea604.sameGramProfileAs[0] !== 'station-604-1') die('the Gram-profile sentence (EinsteinArena 604 ~ Station configuration 1 only) would be false');
if (ea604.contacts !== s1.contacts) die('the EinsteinArena 604 and Station configuration 1 no longer share a contact count');
const daysToBytes = Math.round((Date.parse(ea604.bytesPublished) - Date.parse(ea604.needsDataFrom)) / 86400000);
if (!(daysToBytes > 0)) die('the NEEDS DATA interval is not positive');
const sharedS1 = ea604.sharedDirectionsWith['station-604-1'];
const cg = ea604.congruence || {};
if (!cg['station-604-1'] || cg['station-604-1'].verdict !== 'CONGRUENT' || cg['station-604-1'].isometry !== 'signed coordinate permutation') die('the congruence sentence (EinsteinArena 604 = Station configuration 1 by a signed coordinate permutation) would be false');
if (cg['station-604-2'].verdict !== 'NOT CONGRUENT' || cg['station-604-3'].verdict !== 'NOT CONGRUENT') die('the non-congruence sentence for configurations 2 and 3 would be false');
const CERTF = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'kissing-congruence.json'), 'utf8'));
const Tm = CERTF.certificates['station-604-1'].T;
const Tperm = Tm.map((row) => { const j = row.findIndex((e) => e[0] !== '0'); return (Tm[0] && row[j][0] === '-1' ? '−' : '+') + (j + 1); });
if (!ea604.sharedDirectionsWith['ea-594-winner'] || ea604.integerVectors !== ea604.sharedDirectionsWith['ea-594-winner']) die('the lineage sentence (the 604 keeps exactly the 594\'s integer vectors) would be false');
const n604new = ea604.n - ea604.sharedDirectionsWith['ea-594-winner'];
const n594dec = ea.nonIntegerVectors;
if (!ea604.nearestNonContact) die('no nearest non-contact on the 604');
const OR = L.openRungs || [];
if (OR.length !== 3 || OR.some((r) => !(r.measured.violations > 0))) die('the open rungs are not three measured non-witnesses');
const r841 = OR.find((r) => r.slug === 'kissing-number-d12');
if (!r841 || r841.measured.violations !== 1 || r841.measured.coincident !== 1) die('the n=841 sentence (one repeated vector) would be false');
if (L.rows.some((r) => r.verdict === 'REFUTED')) die('a REFUTED row reached the page builder');
for (const c of [s1, s2, s3]) if (c.uniformNorm !== true) die('a 604 configuration lost its shell-norm-4 uniformity');
const distinct = new Set([s1.contacts, s2.contacts, s3.contacts]).size === 3;
if (!distinct) die('the three 604 contact counts collided — the non-congruence sentence would be false');
const fmt = (x) => x.toLocaleString('en-US');

/* ---- figures: every mark from a ledger field; the kit applies the chart rules ---- */
const gz = row('ganzhinov-592');
for (const r of [sh, gz, ae, ea, ea604, s1]) if (!r.date) die('the timeline needs a date on ' + r.id);
const decYear = (iso) => { const d = new Date(iso + 'T00:00:00Z'); const y = d.getUTCFullYear();
  return y + (Date.UTC(y, d.getUTCMonth(), d.getUTCDate()) - Date.UTC(y, 0, 1)) / (365.25 * 86400000); };
const EV = [
  { id: sh.id, y: 582, x: decYear(sh.date), t: '582 · Best 1980', v: 'CERTIFIED · ' + fmt(sh.contacts) + ' exact contacts', tok: 'var(--c-1)' },
  { id: gz.id, y: 592, x: decYear(gz.date), t: '592 · Ganzhinov 2022 (queued)', v: 'QUEUED — bytes not yet pulled; drawn dashed', tok: CH.CTX, queued: true },
  { id: ae.id, y: 593, x: decYear(ae.date), t: '593 · AlphaEvolve', v: 'CERTIFIED · ' + fmt(ae.contacts) + ' exact contacts', tok: 'var(--c-1)' },
  { id: ea.id, y: 594, x: decYear(ea.date), t: '594 · EinsteinArena rung', v: 'CERTIFIED · ' + fmt(ea.contacts) + ' exact contacts', tok: 'var(--c-1)' },
  { id: ea604.id, y: 604, x: decYear(ea604.date), t: '604 · EinsteinArena', v: 'CERTIFIED · ' + fmt(ea604.contacts) + ' exact contacts · file public ' + ea604.date, tok: 'var(--c-1)' },
  { id: s1.id, y: 604, x: decYear(s1.date), t: '604 ×3 · the Station', v: 'CERTIFIED ×3 · configuration 1 is the EinsteinArena 604 in another frame', tok: 'var(--c-1)' },
].sort((a, b) => a.x - b.x);
function timelinePanel(o) {
  const f = CH.frame(o);
  const out = [CH.axes(f, o)];
  /* the record as a step function: level = the highest bound so far; a
     horizontal run is dashed while its level rests on a QUEUED (uncertified) row */
  const inside = EV.filter((e) => e.x >= o.x0 && e.x <= o.x1);
  let level = 0, levelQueued = false, lx = o.x0;
  for (const e of EV) if (e.x < o.x0 && e.y > level) { level = e.y; levelQueued = !!e.queued; }
  const seg = (x0, x1, y, dashed) => '    <line x1="' + f.px(x0).toFixed(1) + '" y1="' + f.py(y).toFixed(1) + '" x2="' + f.px(x1).toFixed(1)
    + '" y2="' + f.py(y).toFixed(1) + '" stroke="' + (dashed ? CH.CTX : 'var(--c-1)') + '" stroke-width="2" stroke-linecap="round"' + (dashed ? ' stroke-dasharray="5 4"' : '') + '/>';
  for (const e of inside) {
    if (e.y > level) {
      if (level) out.push(seg(lx, e.x, level, levelQueued));
      if (level) out.push('    <line x1="' + f.px(e.x).toFixed(1) + '" y1="' + f.py(level).toFixed(1) + '" x2="' + f.px(e.x).toFixed(1) + '" y2="' + f.py(e.y).toFixed(1) + '" stroke="' + CH.AXIS + '" stroke-width="1"/>');
      level = e.y; levelQueued = !!e.queued; lx = e.x;
    }
  }
  if (level) out.push(seg(lx, o.x1, level, levelQueued));
  for (const e of inside) {
    const cx = f.px(e.x), cy = f.py(e.y);
    out.push('    <circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="5" fill="' + (e.queued ? CH.SURFACE : e.tok) + '" stroke="' + (e.queued ? CH.CTX : CH.SURFACE) + '" stroke-width="2"/>');
    out.push('    <circle ' + CH.hit('cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="13" fill="transparent"', e.t, e.v) + '/>');
    const lab = o.labels && o.labels[e.id];
    if (lab) out.push(CH.txt(CH.clampX(f, cx + lab.dx, e.t, lab.anchor || 'start'), cy + lab.dy, e.t, 't-lab', lab.anchor || 'start'));
  }
  if (o.title) out.push(CH.txt(f.L, f.T - 6, o.title, 't-note', 'start'));
  return out.join('\n');
}
const TL_Y = { y0: 577, y1: 613, yTicks: [{ v: 582, t: '582' }, { v: 592, t: '592' }, { v: 604, t: '604' }] };
const FIG_TIMELINE = [
  CH.open({ w: 900, h: 300, alt: 'The K(11) lower bound over time as a step function: 582 from 1980, 592 in 2022 (queued, dashed), then 593, 594 and 604 inside eighteen months of 2025 and 2026, the last reached by two platforms four months apart.' }),
  timelinePanel(Object.assign({ w: 900, h: 300, padL: 62, padR: 900 - 62 - 300, padT: 34, padB: 62, x0: 1978, x1: 2027.6,
    xTicks: [1980, 1990, 2000, 2010, 2020].map((v) => ({ v, t: String(v) })), title: '1980 – 2026: the whole record',
    labels: { [sh.id]: { dx: 10, dy: -12 }, [gz.id]: { dx: -10, dy: -12, anchor: 'end' } } }, TL_Y)),
  timelinePanel(Object.assign({ w: 900, h: 300, padL: 62 + 300 + 78, padR: 22, padT: 34, padB: 62, x0: 2025.0, x1: 2026.95,
    xTicks: [{ v: 2025.0, t: '2025' }, { v: 2025.5, t: 'Jul' }, { v: 2026.0, t: '2026' }, { v: 2026.5, t: 'Jul' }], title: 'the eighteen months: 2025 – 2026, three machines',
    labels: { [ae.id]: { dx: 10, dy: -12 }, [ea.id]: { dx: -10, dy: 20, anchor: 'end' }, [ea604.id]: { dx: -10, dy: -14, anchor: 'end' }, [s1.id]: { dx: -10, dy: -32, anchor: 'end' } } }, TL_Y)),
  CH.legend([{ kind: 'line', token: 'var(--c-1)', t: 'record held by a configuration CERTIFIED here' }, { kind: 'dash', token: CH.CTX, t: 'held by a row still QUEUED (bytes not yet pulled)' }], 62, 293, undefined, 816),
  CH.close,
].join('\n');

/* the angle spectra: the four 604s as small multiples — identical panels are identical configurations' fingerprints */
const spectrum = (r) => r.gram.multiset.split(' ').map((e) => { const [k, c] = e.split('x'); const [ab, N] = k.split('/'); const [a, b] = ab.split(',').map(Number);
  const v = (a + b * Math.SQRT2) / Number(N); return { k, c: Number(c), deg: Math.acos(Math.max(-1, Math.min(1, v))) * 180 / Math.PI, contact: k === '1,0/2' }; });
const SPEC = [
  { r: ea604, title: 'EinsteinArena 604 = Station configuration 1 · ' + ea604.gram.distinct + ' distinct angles · ' + fmt(ea604.contacts) + ' contacts' },
  { r: s2, title: 'Station configuration 2 · ' + s2.gram.distinct + ' distinct angles · ' + fmt(s2.contacts) + ' contacts' },
  { r: s3, title: 'Station configuration 3 · ' + s3.gram.distinct + ' distinct angles · ' + fmt(s3.contacts) + ' contacts' },
];
if (s1.gram.multiset !== ea604.gram.multiset) die('the spectra of ea-604 and configuration 1 differ — the panel title would lie');
const SP_H = 128, SP_GAP = 36, SP_TOP = 30, SP_W = 900;
const spH = SP_TOP + SPEC.length * (SP_H + SP_GAP) + 30;
const FIG_SPECTRA = [CH.open({ w: SP_W, h: spH, alt: 'Three panels, one per distinct 604-point configuration, each a stem chart of pair counts on a log axis against the pairwise angle from 0 to 180 degrees. The EinsteinArena 604 and Station configuration 1 share one panel because their spectra are identical; configurations 2 and 3 have fewer distinct angles and different counts.' })];
SPEC.forEach((p, k) => {
  const T = SP_TOP + k * (SP_H + SP_GAP);
  const o = { w: SP_W, h: spH, padL: 62, padR: 22, padT: T, padB: spH - T - SP_H, x0: 0, x1: 180, logY: true, y0: 100, y1: 100000,
    yTicks: [{ v: 100, t: '100' }, { v: 1000, t: '1k' }, { v: 10000, t: '10k' }, { v: 100000, t: '100k' }],
    xTicks: k === SPEC.length - 1 ? [0, 30, 60, 90, 120, 150, 180].map((v) => ({ v, t: v + '°' })) : [] };
  const f = CH.frame(o);
  FIG_SPECTRA.push(CH.axes(f, o));
  FIG_SPECTRA.push(CH.txt(f.L, f.T - 8, p.title, 't-lab', 'start'));
  for (const e of spectrum(p.r)) {
    const x = f.px(e.deg), y = f.py(Math.max(100, e.c)), tok = e.contact ? 'var(--c-1)' : 'var(--c-3)';
    FIG_SPECTRA.push('    <line x1="' + x.toFixed(1) + '" y1="' + (f.T + f.ph) + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="' + tok + '" stroke-width="2" stroke-linecap="round"/>');
    FIG_SPECTRA.push('    <circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="4" fill="' + tok + '" stroke="' + CH.SURFACE + '" stroke-width="2"/>');
    FIG_SPECTRA.push('    <circle ' + CH.hit('cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="12" fill="transparent"', e.deg.toFixed(2) + '° · cos = ' + e.k.replace('/', ' / ') + (e.k.includes(',0/') ? '' : ' (with √2)'), fmt(e.c) + ' pairs') + '/>');
  }
});
FIG_SPECTRA.push(CH.txt(SP_W / 2, spH - 30, 'angle between the two directions of a pair (every angle decided exactly; drawn to 0.01°)', 't-note', 'middle'));
FIG_SPECTRA.push(CH.legend([{ token: 'var(--c-1)', t: 'pairs at exactly 60° — the contacts' }, { token: 'var(--c-3)', t: 'every other angle' }], 62, spH - 7, undefined, 816));
FIG_SPECTRA.push(CH.close);
const FIG_SPECTRA_SVG = FIG_SPECTRA.join('\n');

/* the certificate, drawn: T as an 11 × 11 grid */
const MX = (() => {
  const cell = 24, gap = 2, L = 190, TOP = 44, n = Tm.length;
  const w = 900, h = TOP + n * (cell + gap) + 48;
  const out = [CH.open({ w, h, alt: 'The 11 by 11 matrix T of the congruence certificate drawn as a grid: exactly one filled cell per row and per column, ten of them marked minus one and one plus one — a signed permutation of the coordinates.' }), CH.HATCH_DEF];
  out.push(CH.txt(L + (n * (cell + gap)) / 2, 14, 'coordinate of the EinsteinArena vector (doubled)', 't-note', 'middle'));
  for (let c = 0; c < n; c++) out.push(CH.txt(L + c * (cell + gap) + cell / 2, TOP - 8, String(c + 1), 't-ax', 'middle'));
  for (let r = 0; r < n; r++) {
    out.push(CH.txt(L - 12, TOP + r * (cell + gap) + cell / 2 + 4, 'Station coordinate ' + (r + 1), 't-ax', 'end'));
    for (let c = 0; c < n; c++) {
      const e = Tm[r][c]; const p = e[0]; const x = L + c * (cell + gap), y = TOP + r * (cell + gap);
      if (p === '0') { out.push('    <rect x="' + x + '" y="' + y + '" width="' + cell + '" height="' + cell + '" rx="3" fill="none" stroke="' + CH.GRID + '" stroke-width="1"/>'); continue; }
      const neg = p.startsWith('-');
      out.push('    <rect ' + CH.hit('x="' + x + '" y="' + y + '" width="' + cell + '" height="' + cell + '" rx="3" fill="' + (neg ? 'url(#cmHatch)' : 'var(--c-1)') + '"' + (neg ? ' stroke="var(--c-3)" stroke-width="1"' : ''),
        'T[' + (r + 1) + ',' + (c + 1) + '] = ' + (neg ? '−1' : '+1'), 'Station coordinate ' + (r + 1) + ' = ' + (neg ? '− ' : '') + '2 × EinsteinArena coordinate ' + (c + 1)) + '/>');
    }
  }
  out.push(CH.legend([{ token: 'var(--c-1)', t: '+1' }, { kind: 'hatch', t: '−1' }, { token: CH.SURFACE, t: '0 (outlined)' }], L, h - 7, undefined, 900 - L - 22));
  out.push(CH.close);
  return out.join('\n');
})();

/* the lineage as stacked bars: what each configuration is made of */
const FIG_LINEAGE = CH.segments({
  w: 900, x0: 0, x1: 620, rowH: 44, padL: 236, padR: 26, xLabel: 'directions',
  xTicks: [0, 100, 200, 300, 400, 500, 600].map((v) => ({ v, t: String(v) })),
  alt: 'Three stacked horizontal bars. The 594 rung winner: 496 integer vectors and 98 decimal-valued ones. The 604: the same 496 integer vectors kept, plus 108 new vectors with a square-root-of-two part. The classical 582 shell: 176 directions shared with the 604 and 406 not.',
  rows: [
    { k: '594 rung winner · ' + ea.date, segs: [
      { x0: 0, x1: ea.n - n594dec, token: 'var(--c-2)', k: '594 winner · integer vectors', v: fmt(ea.n - n594dec) },
      { x0: ea.n - n594dec, x1: ea.n, hatch: true, token: 'var(--c-3)', k: '594 winner · decimal-valued vectors', v: fmt(n594dec) }] },
    { k: '604 · ' + ea604.date, segs: [
      { x0: 0, x1: ea604.sharedDirectionsWith['ea-594-winner'], token: 'var(--c-2)', k: '604 · the winner\'s integer vectors, kept', v: fmt(ea604.sharedDirectionsWith['ea-594-winner']) },
      { x0: ea604.sharedDirectionsWith['ea-594-winner'], x1: ea604.n, token: 'var(--c-1)', k: '604 · new vectors with a √2 part', v: fmt(n604new) }] },
    { k: 'the classical 582 shell', segs: [
      { x0: 0, x1: ea604.sharedDirectionsWith['station-shell-582'], token: 'var(--c-2)', k: '582 shell · directions also in the 604', v: fmt(ea604.sharedDirectionsWith['station-shell-582']) },
      { x0: ea604.sharedDirectionsWith['station-shell-582'], x1: sh.n, token: CH.CTX, k: '582 shell · directions not in the 604', v: fmt(sh.n - ea604.sharedDirectionsWith['station-shell-582']) }] },
  ],
  keys: [{ token: 'var(--c-2)', t: 'integer vectors' }, { kind: 'hatch', t: 'decimal-valued vectors' }, { token: 'var(--c-1)', t: 'vectors with a √2 part' }, { token: CH.CTX, t: 'not in the 604' }],
});

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · the registry · every witness re-decided at this build',
  title: 'Two platforms announced 604. It is one configuration.',
  deck: 'The kissing number asks how many unit spheres can touch a central one — Newton and Gregory argued '
    + 'about dimension 3 in 1694. In dimension 11 the record stood near 582 for decades, then three AI systems '
    + 'moved it three times in eighteen months, each validated by its producer\'s own verifier — and two of them, '
    + 'four months apart, announced 604. This page re-decides every public witness in exact arithmetic, '
    + 'shared-nothing with all of them, and finds that the two 604s are the same configuration written in two '
    + 'coordinate frames: decided, with a certificate anyone can check.'
}));

B.push(C.tldr({
  findingRaw: '<strong>EinsteinArena\'s 604 and the Station\'s configuration 1 are the same configuration</strong> — '
    + 'congruent under a signed permutation of the eleven coordinates, with the certificate (a bijection of the 604 '
    + 'vectors and the orthogonal matrix) verified exactly on every vector at every build; the Station\'s '
    + 'configurations 2 and 3 are not congruent to it, proved by exhaustion of the same search. Underneath that, '
    + '<strong>K(11) &ge; 604 is independently certified here</strong> from four published 604-point configurations '
    + 'in exact Z[&radic;2] arithmetic, with ' + fmt(s1.contacts) + ' / ' + fmt(s2.contacts) + ' / ' + fmt(s3.contacts)
    + ' exact contacts on the Station\'s three, and the whole AI ladder certifies from each claimant\'s own bytes — '
    + 'AlphaEvolve\'s 593, the EinsteinArena rung winner\'s 594. The EinsteinArena 604\'s coordinates were not '
    + 'public when this ledger first ran: the row read NEEDS DATA for ' + daysToBytes + ' days and named the bytes '
    + 'that would decide it; the maintainer published them on request and the row decided the same day.',
  mechanismRaw: 'A set of nonzero directions with every pairwise angle &ge; 60&deg; IS a kissing configuration '
    + '(put each sphere at 2x/|x|), and that condition is scale-invariant per vector: '
    + C.m('⟨x,y⟩ ≤ 0  or  4⟨x,y⟩² ≤ ⟨x,x⟩⟨y,y⟩') + ', decided '
    + 'exactly. The whole instrument is BigInt arithmetic in Z[&radic;2] — the field the 604s live in — with '
    + 'the classical two-case sign test; a decimal literal is read as the exact rational it denotes, never as '
    + 'its float64 neighbor. No float participates in any decision on this page.',
  checkRaw: C.m('node instruments/kissing/battery.js') + ' — ' + nChecks + ' checks, ' + nReds + ' red controls '
    + 'that must fire, D4 (24) and E8 (240) re-proved from generated bytes at every run. '
    + C.m('node tools/run-kissing-ledger.js') + ' rebuilds every verdict from the pinned corpus bytes.'
}));

B.push(C.stats([
  { k: 'the record, certified here', v: 'K(11) ≥ 604', role: 'held', n: 'four published 604-point configurations — the Station\'s three and EinsteinArena\'s headline — each independently re-decided from sha-pinned bytes' },
  { k: 'the interval, today', v: '604 ≤ K(11) ≤ 868', role: 'open', n: 'upper bound: literature (SDP), NOT audited here — this page touches lower-bound witnesses only' },
  { k: 'ladder rows certified', v: certified + ' of ' + L.rows.length, role: 'held', n: '582 · 593 · 594 · 604×4 · a D12 lift · two classical calibrations — every verdict recomputed at this build' },
  { k: 'the two platforms\' 604s', v: 'one configuration', role: 'held', n: 'EinsteinArena\'s 604 and the Station\'s configuration 1 are congruent — a signed coordinate permutation, decided in ' + fmt(cg['station-604-1'].ms) + ' ms and certified exactly; configurations 2 and 3 are not' },
  { k: 'needs data → certified', v: daysToBytes + ' days', role: 'held', n: 'EinsteinArena\'s headline 604: NEEDS DATA on ' + ea604.needsDataFrom + ', coordinates published on request ' + ea604.bytesPublished + ', decided the same day in ' + ea604.ms + ' ms' },
  { k: 'calibration', v: 'E8: 6,720 contacts', role: 'held', n: '240·56/2 — the textbook count of 60° pairs in the E8 root system, re-derived from generated bytes every run' },
]));

B.push(C.section({
  lab: '§1 · the ladder', title: 'Thirty years at 582. Then eighteen months.',
  wide: true,
  bodyRaw: C.figure({ svgRaw: FIG_TIMELINE, caption: 'The K(11) lower bound as a step function of time, drawn twice: the whole record since 1980, and the eighteen months in which three AI systems moved it. Every level is a ledger row; a run is dashed while the record rests on the one row still queued (Ganzhinov\'s 592). The two markers at 604 are four months apart and, decided below, one configuration.' })
  + C.table({
    cols: [{ h: 'bound' }, { h: 'who, when' }, { h: 'the bytes' }, { h: 'verdict here', cls: 'n' }, { h: 'exact contacts', cls: 'n' }],
    rows: [
      ['582', 'classical shell (Best 1977 class); bytes from the Station bundle', 'integer vectors, norm² 4', { raw: C.tag('CERTIFIED', 'cert') }, fmt(sh.contacts)],
      ['592', 'Ganzhinov 2022 (arXiv:2207.08266) — the last pre-AI record', 'not yet pulled', { raw: C.tag('QUEUED', 'dep') }, '—'],
      ['593', 'AlphaEvolve (DeepMind), May 2025', 'integer vectors, entries up to ~8.7·10¹²', { raw: C.tag('CERTIFIED', 'cert') }, fmt(ae.contacts)],
      ['594', 'EinsteinArena agents — the solved public rung, score-0 winner', 'decimal literals, read as exact rationals', { raw: C.tag('CERTIFIED', 'cert') }, fmt(ea.contacts)],
      ['604 ×3', 'The Station agents (dualverse-ai), 2026', '(a+b√2)/6 entries, shell norm exactly 4', { raw: C.tag('CERTIFIED', 'cert') }, fmt(s1.contacts) + ' · ' + fmt(s2.contacts) + ' · ' + fmt(s3.contacts)],
      ['604', 'EinsteinArena (arXiv:2606.10402) — the paper\'s headline, credited by Cohn\'s table; coordinates published on request ' + ea604.bytesPublished, 'p + q√2 integer pairs, shell norm exactly 36', { raw: C.tag('CERTIFIED', 'cert') }, fmt(ea604.contacts)],
      ['(R¹²) 604', 'the Station\'s D₁₂ lift of configuration 3 — the construction device, integer coordinates', 'integer vectors in R¹²', { raw: C.tag('CERTIFIED', 'cert') }, fmt(lift.contacts)],
    ]
  }) + '<div class="col">'
  + C.pRaw('Three sentences of history. The norm-4 integer shell tops out at 582 — the Station carries a Lean 4 '
    + 'proof of that maximum, which is why every deeper record needs a richer alphabet: AlphaEvolve went to '
    + 'enormous integers, the 604s live in Q(&radic;2). Ganzhinov\'s 592 (2022) was the last human record; '
    + 'AlphaEvolve took 593 in May 2025; the two agent platforms then pushed to 604 within a year. The upper '
    + 'bound 868 is semidefinite-programming literature and is not audited by this page.')
  + C.pRaw('The distinct contact counts are doing quiet work in that table: congruent configurations have equal '
    + 'contact counts, so ' + fmt(s1.contacts) + ' &ne; ' + fmt(s2.contacts) + ' &ne; ' + fmt(s3.contacts)
    + ' certifies that the three Station 604s are pairwise non-congruent — three genuinely different ways to reach '
    + 'the record, decided by the same exact arithmetic that certifies them.')
  + C.pRaw('The EinsteinArena 604 has ' + fmt(ea604.contacts) + ' contacts — configuration 1\'s count — and the '
    + 'coincidence is total: <strong>the two are congruent</strong>. Decided, not observed: the configurations are '
    + 'complete graphs whose edges carry the exact normalised inner product (' + cg['station-604-1'].edgeColours
    + ' distinct values), and individualisation-refinement — colour refinement as the invariant, backtracking over '
    + 'the smallest cell, the procedure inside nauty, written here without it — finds the bijection in '
    + fmt(cg['station-604-1'].nodes) + ' search nodes. The certificate is explicit and re-verified at every build '
    + 'without the search: a permutation π of the 604 vectors and an 11 × 11 matrix T over Q(&radic;2) with '
    + C.m('T · 2aᵢ = b_π(i)') + ' for every i and ' + C.m('TᵀT = I') + ', all in exact arithmetic. T turns out to be '
    + 'a <strong>signed permutation of the coordinates</strong>: coordinates 1 … 11 of a Station vector are coordinates '
    + Tperm.map((t) => t.slice(1)).join(', ') + ' of the EinsteinArena vector, doubled, with ' + Tperm.filter((t) => t[0] === '−').length
    + ' of the eleven signs flipped — so the two files are one configuration written in two frames. Configurations 2 and 3 are '
    + '<strong>not</strong> congruent to it: the same search exhausts at its first node (their contact counts already '
    + 'said so; the search says it independently and would have said it without the counts).')
  + C.figure({ wide: false, svgRaw: FIG_SPECTRA_SVG, caption: 'The angle spectrum of each distinct 604-point configuration: how many of the 182,106 pairs sit at each angle, on a log scale, every angle decided exactly in Z[√2]. The EinsteinArena 604 and Station configuration 1 share the top panel because their spectra are identical (read from the ledger, gated); configurations 2 and 3 have 14 and 15 distinct angles instead of 22. A spectrum is a fingerprint an isometry cannot change — necessary for congruence; the certificate below is what makes it sufficient.' })
  + C.figure({ wide: false, svgRaw: MX, caption: 'The certificate, drawn. T is the 11 × 11 matrix with T · 2aᵢ = b_π(i) for every i, read from certs/kissing-congruence.json: one filled cell per row and per column, so it is a permutation of the coordinates with signs — the hatched cells are −1. The matrix is verified exactly at every build; hover a cell for the coordinate it maps.' })
  + C.pRaw('Where the 604 came from is also in the bytes. ' + fmt(ea604.sharedDirectionsWith['ea-594-winner'])
    + ' of its directions are the EinsteinArena 594 rung winner\'s — exactly its ' + fmt(ea604.integerVectors)
    + ' integer vectors — and the 594\'s ' + fmt(n594dec) + ' decimal-valued vectors were replaced by '
    + fmt(n604new) + ' vectors with a &radic;2 part: the record was reached by keeping the integer skeleton and '
    + 'rebuilding the rest in Z[&radic;2]. ' + fmt(ea604.sharedDirectionsWith['station-shell-582']) + ' of the 604 directions '
    + 'are the classical 582 shell\'s. Its slack is small: ' + fmt(ea604.nearestNonContact.count) + ' pairs sit at '
    + ea604.nearestNonContact.angleDeg.toFixed(2) + '&deg;, under a degree from contact.')
  + C.figure({ wide: false, svgRaw: FIG_LINEAGE, caption: 'What each configuration is made of, counted exactly by primitive direction: the 594 rung winner (' + ea.date + ') is 496 integer vectors and 98 decimal-valued ones; the 604 (' + ea604.date + ', two days later) keeps those 496 integer vectors and replaces the rest with 108 vectors carrying √2; 176 of its directions are also the classical 582 shell\'s.' })
  + C.pRaw('As data, for whoever needs it: the EinsteinArena file entered a public repository on 2026-04-12 (its paper, '
    + 'arXiv:2606.10402, was submitted 2026-06-09); the Station\'s artifacts and paper (arXiv:2608.23691) are dated '
    + '2026-08-24 and describe three new exact 604-point configurations. Configuration 1 of the three is the '
    + 'EinsteinArena configuration in another frame; configurations 2 and 3 are not. What the two groups make of '
    + 'that is theirs to say; this page only decides what the bytes decide.') + '</div>'
}));

B.push(C.section({
  lab: '§2 · the verifiers', title: 'Everyone verified their own record. That is the gap.',
  bodyRaw: '<div class="col">'
  + C.pRaw('EinsteinArena scores submissions with Python <code>decimal.Decimal</code> at 30–80 significant '
    + 'digits, and switches to exact integer arithmetic only for integer-valued submissions. Fixed-precision '
    + 'decimal is high-precision float, not proof — and the winning 594 bytes are NOT integers (982 of their '
    + '6,534 entries are decimals). Read as the exact rationals those literals denote, the winner turns out to '
    + 'be a genuine exact witness: 17,088 pairs sit at exactly 60&deg; and every other pair clears it. To our '
    + 'knowledge this page is the first exact reading of those bytes.')
  + C.pRaw('The Station agents did verify their 604s exactly — a sympy notebook pinned to the same npz this '
    + 'page consumes, plus Lean 4 formalizations of spotlight sub-theorems (the 582 shell maximum among them). '
    + 'What this page adds there is independence: different code, different language, different arithmetic '
    + '(BigInt Z[&radic;2] instead of sympy), sharing not one line with the producer — the difference between '
    + 'an author\'s checksum and an audit.')
  + C.pRaw('And one row measured opacity before it measured geometry. On ' + ea604.needsDataFrom + ' EinsteinArena\'s '
    + 'paper claimed 604, the field\'s reference table credited it, the platform\'s own threads discussed the '
    + '&ldquo;frozen 604&rdquo; — and the public API served only the solved 594 rung and the open 605 rung. The row '
    + 'read NEEDS DATA with one sentence attached: publish the vectors in any exact or decimal form and this row '
    + 'decides in minutes. The ledger asked (vinid/einstein-arena#64); on ' + ea604.bytesPublished + ' the '
    + 'maintainer answered with the repository holding the file — 604 rows of 22 integers, p + q&radic;2 per '
    + 'coordinate at shell norm 36, the same field as the Station\'s. It decided in ' + ea604.ms + ' ms. The '
    + 'sentence was the price, exactly.') + '</div>'
}));

B.push(C.section({
  lab: '§3 · the open rungs', title: 'What the platform is still trying, measured exactly',
  wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'rung' }, { h: 'best submission at fetch' }, { h: 'platform score', cls: 'n' }, { h: 'violating pairs, exact', cls: 'n' }, { h: 'worst angle', cls: 'n' }, { h: 'exact contacts', cls: 'n' }, { h: 'reading' }],
    rows: OR.map((r) => [
      r.title.replace('Kissing Number in ', ''),
      '#' + r.best.id + ' · ' + r.best.agent + ' · ' + String(r.best.createdAt).slice(0, 10),
      String(r.best.score).slice(0, 10), fmt(r.measured.violations),
      r.measured.worstAngleDeg === null ? '—' : r.measured.worstAngleDeg.toFixed(2) + '°', fmt(r.measured.contacts),
      r.measured.coincident ? (r.measured.n - r.measured.coincident) + ' distinct directions and ' + r.measured.coincident + ' repeated — an ' + (r.measured.n - r.measured.coincident) + '-point configuration, not an ' + r.measured.n
        : (fmt(r.measured.violations) + ' pairs inside 60°; ' + (r.measured.worstAngleDeg < 50 ? 'far from a witness' : 'the closest of the three to a witness')),
    ])
  }) + '<div class="col">'
  + C.pRaw('Three rungs on the platform are open — n = 605 in dimension 11, n = 841 and n = 842 in dimension 12 — and '
    + 'each has a best submission the platform scores above zero. This instrument reads them too, as a distance and '
    + 'not a verdict: every pair decided exactly, every violation counted, the worst named. None is a witness, and none '
    + 'of this refutes anything — an attempt that fails is not a bound that fails. The n = 841 reading is worth a look: '
    + 'the best submission is ' + (r841.measured.n - 1) + ' distinct directions with one vector repeated, an 840-point '
    + 'configuration handed in as 841. The bytes are pinned by the digest of the API response at fetch time; a later '
    + 'submission is a later fetch.') + '</div>'
}));

B.push(C.note({
  lab: 'what this page does NOT claim',
  bodyRaw: C.pRaw('No new mathematics: no bound is improved, no configuration searched for, and the upper bound '
    + 'is untouched. The Station\'s own exact verification of the 604s predates this page — the claim here is '
    + 'independence (shared-nothing re-decision from their sha-pinned bytes), not priority of verification. '
    + 'What is, to our knowledge, first here: a third-party exact certification of the 604 record from both '
    + 'platforms\' bytes, the exact reading of the EinsteinArena winner\'s bytes, the non-congruence of the three '
    + 'Station 604s stated as a certified corollary, and the congruence of the EinsteinArena 604 with the Station\'s '
    + 'configuration 1 decided with an explicit, re-verified certificate. The open-rung readings decide nothing about '
    + 'any bound. Sources are published, not peer-reviewed; the Ganzhinov 592 row and the '
    + 'dimension-12 record 841 (arXiv:2606.18984) are queued, not forgotten.')
}));

const foot = '<footer class="col"><p>Generated by tools/build-report-kissing.js @ git ' + git + '. Gates at this '
  + 'build: the ledger recomputed live from pinned corpus bytes (upstream sha256 recorded per row; the Station '
  + 'npz hash matches the value their own notebook asserts), the kissing battery (' + nChecks + ' checks, '
  + nReds + ' red controls, all fired), D4 and E8 re-proved from generated bytes. A REFUTED row, a lost '
  + 'shell-norm, or a contact-count collision refuses this page.</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'kissing.html'),
  TPL.render({ title: 'The kissing ledger: dimension eleven, decided', bodyRaw: B.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/kissing.html',
    desc: 'Two AI platforms announced K(11) >= 604 four months apart; exact arithmetic finds the two configurations congruent — a signed permutation of the coordinates, with a certificate. The whole AI-era ladder (AlphaEvolve 593, EinsteinArena 594, four 604s) re-decided in exact Z[sqrt2] arithmetic from published bytes.' }));
console.log('reports/kissing.html written: ' + certified + '/' + L.rows.length + ' rows certified, battery '
  + nChecks + ' checks / ' + nReds + ' reds @ git ' + git);
