#!/usr/bin/env node
/* build-report-blinking-light.js — reports/blinking-light.html: the third multitrack run. The least dissipation of a
   hidden network whose lamp, read at random times, has two given correlations: g(3/10, 2/25), narrowed from
   0.02 ≤ g ≤ 0.497 to 0.36572 ≤ g ≤ 0.37713.

   TWO STANDINGS, KEPT APART. The upper bound is decided: a network reproduces the two numbers exactly and its
   dissipation is enclosed. The lower bound is a certificate whose finite conditions are decided here; the two theorems
   that make it a bound were proved by one model and read once by the other, and are NOT decided. The question and the
   phenomenon are Dobrynin and Stroujkova's; they come first. Every number, verdict word and name on the page is read
   from certs/blinking-light.json (the judge's record), corpus/blinking-light/series.json (the bounds as they entered
   the run's record, each checked by the judge against its message) and corpus/blinking-light/readings.json (who read
   what, written by hand); the build refuses when a record stops saying what a sentence of the page states.

   usage: node tools/build-report-blinking-light.js                                                              MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const OG = require(path.join(ROOT, 'tools', 'build-og-report.js'));   /* the page's own light art card (og-blinking-light.png) */
const die = (msg) => { console.error('BLINKING LIGHT PAGE REFUSED: ' + msg); process.exit(1); };
const need = (ok, msg) => { if (!ok) die(msg); };
const GH = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';
const rec = (rel) => '<a href="' + C.escAttr(GH + rel) + '"><span class="m">' + C.esc(rel) + '</span></a>';
const m = (s) => '<span class="m">' + C.breakable(s) + '</span>';
const a = (href, text) => '<a href="' + C.escAttr(href) + '">' + C.esc(text) + '</a>';
const N = (x) => Number(x).toLocaleString('en-US');
const T = (s) => String(s).replace(/'/g, '’').replace(/"([^"]*)"/g, '“$1”');
/* an upper end printed with k decimals is rounded UP, never cut: a cut upper end would state less than was decided.
   A lower end may be cut (cutting a lower end only weakens it). */
const ceilDec = (x, k) => { const [i, f = ''] = String(x).split('.'); const head = f.slice(0, k).padEnd(k, '0'), tail = f.slice(k);
  let n = BigInt(i + head); if (/[1-9]/.test(tail)) n += 1n; const t = n.toString().padStart(k + 1, '0'); return t.slice(0, t.length - k) + '.' + t.slice(t.length - k); };
const floorDec = (x, k) => { const [i, f = ''] = String(x).split('.'); return i + '.' + f.slice(0, k).padEnd(k, '0'); };
const REC = 'certs/blinking-light.json';
const DIR = 'corpus/blinking-light/';
const PRE = 'notes/blinking-light-preregistration-2026-11-19.md';
const INST = 'instruments/blinking-light/';
const PAPER = 'https://arxiv.org/abs/2611.24898';

try { const out = cp.execFileSync('python3', [INST + 'judge.py', '--check'], { cwd: ROOT, encoding: 'utf8' }); need(/^pins intact/.test(out), 'the record did not pass its check: ' + out.trim()); }
catch (e) { die(INST + 'judge.py --check refused: ' + (e.stdout || '') + (e.stderr || '')); }
const R = JSON.parse(fs.readFileSync(path.join(ROOT, REC), 'utf8'));
const RD = JSON.parse(fs.readFileSync(path.join(ROOT, DIR + 'readings.json'), 'utf8'));
const SE = JSON.parse(fs.readFileSync(path.join(ROOT, DIR + 'series.json'), 'utf8'));
const ST = R.statements, GPT = RD.models.gpt.name, CLA = RD.models.claude.name, CTL = RD.models.control.name;
const who = (k) => ({ gpt: GPT, claude: CLA }[k] || k);

/* ---- the words this page states, each read back from the record ---- */
need(['U0', 'U1', 'U2', 'L1'].every((k) => ST[k] && ST[k].verdict === 'CERTIFIED'), 'a statement is no longer CERTIFIED');
need(R.controls.length === 8 && R.controlsMissed.length === 0 && R.controls.every((k) => k.refused), 'a control was missed');
need(R.routesNotConfirming.length === 0, 'a control\'s route no longer confirms its falsity: ' + R.routesNotConfirming.join('; '));
need(/NOT DECIDED/.test(R.theorems), 'the record no longer says the theorems are not decided');
need(R.series.mismatched.length === 0 && R.series.entries === SE.upper.length + SE.lower.length, 'the series no longer matches the run\'s messages');
need(Object.values(ST.L1.concordance).every((x) => x === true), 'the claimants\' verifiers no longer agree on the certificate');
const UP = R.interval.upper.g_at_most, LO = R.interval.lower.g_at_least;
need(UP === '0.37712826127' && LO === '0.3657254238', 'the interval moved');
need(ST.L1.objective === '1828627119/5000000000', 'the certificate\'s bound moved');
const lastU = SE.upper[SE.upper.length - 1], lastL = SE.lower[SE.lower.length - 1];
need(Number(lastU.value) >= Number(UP) && Number(lastU.value) - Number(UP) < 1e-9 && Number(lastL.value) <= Number(LO) && Number(LO) - Number(lastL.value) < 1e-7, 'the series ends away from the record\'s interval');
const ratio = Number(UP) / Number(LO), ratio0 = Number(R.interval.start.g_at_most) / Number(R.interval.start.g_at_least);
const gapPct = ((ratio - 1) * 100).toFixed(1);
need(gapPct === '3.1' && Math.round(ratio0) === 25, 'the page says 3.1% and a factor of 25; the record gives ' + gapPct + '% and ' + ratio0.toFixed(1));
const refused = R.controls.filter((k) => k.refused).length;
const boxes = ST.L1.lower.boxes;
need(Number.isInteger(boxes) && boxes > 0, 'the certificate checker reports no box count');
need(RD.theorems.every((t) => /^PROOF READ/.test(t.status) && t.readBy.length >= 1), 'a reading moved');
need(R.plants.posted === 2 && R.plants.caught.gpt === '2 of 2' && R.plants.caught.claude === '2 of 2', 'the plants moved');

/* ---- the figure: the two bounds as they entered the run's record. Solid where the bound is decided (a network);
   dashed where it is a theorem proved by one model and read once by the other, which this page does not decide. ---- */
const hr = (t) => { const [h, mi, s] = t.split(':').map(Number); return h + mi / 60 + s / 3600; };
const END = hr(SE.end);
const steps = (L) => { const P = []; L.forEach((e, i) => { const x = hr(e.at), y = Number(e.value); if (i) P.push([x, P[P.length - 1][1]]); P.push([x, y]); }); P.push([END, P[P.length - 1][1]]); return P; };
const SERIES = (short) => [
  { name: short ? 'upper bound: a network, decided' : 'upper bound: a network that reproduces both numbers, decided', pts: steps(SE.upper), standing: W.DECIDED },
  { name: short ? 'lower bound: proved, read once' : 'lower bound: proved by one model and read once by the other, not decided', pts: steps(SE.lower), standing: W.COMPUTED }
];
const FALT = 'Two step lines over the run, from 11:04 to 17:49 UTC. The upper one, solid, falls from 0.497 to about 0.377, most of the way by noon. The lower one, dashed, rises from 0.02 to 0.366, in steps through the afternoon. At the end they are 3.1% apart.';
const fig = (w, h, short) => CH.lines({ w, h, x0: 11, x1: 18, y0: 0, y1: 0.55, hover: false, padR: short ? 26 : 22, padL: short ? 40 : 56,
  yTicks: [0, 0.1, 0.2, 0.3, 0.4, 0.5].map((v) => ({ v, t: v ? v.toFixed(1) : '0' })),
  xTicks: (short ? [11, 14, 17] : [11, 12, 13, 14, 15, 16, 17, 18]).map((v) => ({ v, t: v + ':00' })),
  xLabel: short ? 'time (UTC)' : '19 November 2026, time of day (UTC)', yLabel: short ? 'g' : 'g = least dissipation per reading (k_B)',
  series: SERIES(short), alt: FALT });

const TITLE = 'The least dissipation behind a blinking light, narrowed from a factor of 25 to 3%';
const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · generated from the record',
  title: TITLE,
  deck: 'A hidden machine blinks a light, and you look only at random moments. Two numbers you measure break an inequality every machine in equilibrium obeys, so the machine must burn energy; Dobrynin and Stroujkova showed this effect a day before this run and left the least amount open. '
    + 'In under seven hours, ' + CLA + ' (' + RD.models.claude.lab + ') and ' + GPT + ' (' + RD.models.gpt.lab + '), working together, narrowed it for one example from a factor of 25 to 3.1%. '
    + 'With Claude (Anthropic’s AI model), I checked both ends in exact arithmetic: the upper end is decided; the lower end rests on two theorems one model proved and the other read.'
}));
O.push(C.figure({ hero: true, svgRaw: fig(900, 380, false), svgNarrowRaw: fig(360, 420, true), record: [REC, DIR + 'series.json'],
  caption: 'The two bounds on g(3/10, 2/25) during the run, each drawn when the control room registered or decided it. Solid: the best network found so far, decided by the checker: it reproduces both numbers exactly and its dissipation is enclosed. Dashed: the best lower bound so far, a theorem proved by one model and read once by the other. '
    + 'The paper’s own four-state network sits far above the frame, at g = ln 3 ≈ 1.10. At the end: ' + floorDec(LO, 5) + ' ≤ g ≤ ' + ceilDec(UP, 5) + '.',
  stop: 'a decided network or a certificate in the series stops matching the message it cites' }));
O.push(C.stats([
  { k: 'upper bound on g, decided', v: ceilDec(UP, 5), n: 'a 156-state network reproduces both numbers exactly; its dissipation is enclosed to twelve digits' },
  { k: 'lower bound on g, read once', v: floorDec(LO, 5), n: 'its certificate passes every finite check here; the two theorems behind it are read once, not decided' },
  { k: 'what is left', v: gapPct + '%', n: 'from a factor of 25 when the run began' },
  { k: 'planted errors caught', v: '2 of 2', n: 'by each model; the record’s own ' + refused + ' wrong versions all refused' }
]));
O.push(C.scope('The upper end of the interval is decided. The lower end rests on two theorems that one model proved and the other read; they are not decided here. Nothing on this page is about a physical device, and nothing compares the two models.'));

O.push(C.section({ lab: 'read this first', title: 'What is still open', id: 'limits', bodyRaw:
  C.plainList(RD.notDone.map((t) => ({ text: T(t) })))
  + '<details class="more"><summary>The conditions of the run</summary>' + C.plainList(RD.conditions.map((t) => ({ text: T(t) }))) + '</details>' }));

/* ---- figure: the question in six steps (the page's one schematic) ---- */
const SCH = C.flow({ w: 600, h: 410, alt: 'A schema in six steps: a hidden machine; its lamp, read at random moments; two numbers; the equilibrium test, which fails; the question how little the machine can dissipate; and its two ends, an upper end by a machine (decided) and a lower end by a certificate (read once).',
  readout: { k: 'the question', d: 'Select a step for what it means here.' },
  nodes: [
    { id: 'mach', x: 20, y: 16, w: 260, h: 60, role: 'dep', k: '1 · A HIDDEN MACHINE', v: 'states and rates you never see', t: 'the hidden machine', d: 'Any number of hidden states jumping at random with fixed rates, in a steady state. Some states light the lamp, the others do not.' },
    { id: 'lamp', x: 320, y: 16, w: 260, h: 60, role: 'dep', k: '2 · ITS LAMP', v: 'seen only at random moments', t: 'the lamp', d: 'You see only the lamp, and only at the moments of a random clock that ticks twice a second on average.' },
    { id: 'nums', x: 20, y: 122, w: 260, h: 60, role: 'dep', k: '3 · TWO NUMBERS', v: 'C1 = 0.30 · C2 = 0.08', t: 'two numbers', d: 'Consecutive looks agree 65% of the time (C1 = 3/10); looks two apart agree 54% of the time (C2 = 2/25). Both read the same forwards and backwards in time.' },
    { id: 'test', x: 320, y: 122, w: 260, h: 60, role: 'warn', k: '4 · THE EQUILIBRIUM TEST', v: 'needs C2 ≥ 0.09: it fails', t: 'the test', d: 'A machine with no net current through its states always has C2 at least C1². Here C2 is 0.08, below 0.09, so some current must circulate, and a current dissipates.' },
    { id: 'q', x: 170, y: 228, w: 260, h: 60, role: 'dep', k: '5 · THE QUESTION', v: 'the least it can dissipate: g', t: 'the question', d: 'g(3/10, 2/25) is the least dissipation per look, in units of Boltzmann’s constant, over every machine of any size that gives both numbers exactly.' },
    { id: 'up', x: 20, y: 334, w: 260, h: 60, role: 'sig', standing: W.DECIDED, k: '6 · THE UPPER END · A MACHINE', v: 'g ≤ ' + ceilDec(UP, 5) + ' · decided', t: 'the upper end', d: 'A machine that gives both numbers exactly bounds g from above. The best one has 156 states; its numbers are proved exact and its dissipation is enclosed.' },
    { id: 'lo', x: 320, y: 334, w: 260, h: 60, role: 'held', standing: W.COMPUTED, k: '6 · THE LOWER END · A CERTIFICATE', v: 'g ≥ ' + floorDec(LO, 5) + ' · read once', t: 'the lower end', d: 'A certificate shows every machine pays at least a stated amount. Its finite conditions are decided here; the two theorems that make it a bound were proved by one model and read once by the other.' }
  ],
  edges: [
    { d: 'M280 46 L318 46' }, { d: 'M450 78 C450 100 150 100 150 120' }, { d: 'M280 152 L318 152' },
    { d: 'M450 184 C450 206 300 204 300 226' }, { d: 'M250 290 C250 312 150 312 150 332' }, { d: 'M350 290 C350 312 450 312 450 332' }
  ],
  caption: 'The question in six steps. Two numbers that break the equilibrium test prove that the hidden machine dissipates; how little it can dissipate is bounded from both ends.' });

/* ---- figure: the plane of the two numbers. Every equilibrium machine sits on or above C2 = C1²; this lamp sits below ---- */
const PAR = []; for (let i = 0; i <= 40; i++) { const x = 0.2 + i * 0.005; PAR.push([x, x * x]); }
const figPlane = (w, h, short) => CH.lines({ w, h, x0: 0.2, x1: 0.4, y0: 0.02, y1: 0.17, hover: false, padR: short ? 26 : 22, padL: short ? 46 : 56,
  yTicks: [0.04, 0.08, 0.12, 0.16].map((v) => ({ v, t: v.toFixed(2) })),
  xTicks: (short ? [0.2, 0.3, 0.4] : [0.2, 0.25, 0.3, 0.35, 0.4]).map((v) => ({ v, t: v.toFixed(2) })),
  xLabel: 'C1, consecutive looks', yLabel: 'C2, looks two apart',
  vmarks: [{ x: 0.3, t: short ? 'C1 = 0.30' : 'at C1 = 0.30 equilibrium needs C2 ≥ 0.09', standing: W.DECIDED }],
  series: [
    { name: short ? 'C2 = C1²; shaded: must dissipate' : 'C2 = C1²: every equilibrium machine is on or above it; below it (shaded) a machine must dissipate', pts: PAR, standing: W.DECIDED, area: true, token: CH.CAT[0] },
    { name: short ? 'this lamp (0.30, 0.08)' : 'this lamp: C1 = 0.30, C2 = 0.08', pts: [[0.3, 0.08]], standing: W.DECIDED, token: CH.CAT[1] }
  ],
  alt: 'The parabola C2 = C1² rising across the plane, the region under it shaded, and one point at C1 = 0.30, C2 = 0.08, just under the parabola, which passes 0.09 there.' });

/* ---- figure: g against the number of states. Decided networks solid, floating-point searches dashed ---- */
const GOALT = fs.readFileSync(path.join(ROOT, DIR + 'run/GOAL.md'), 'utf8');
const NOTES = fs.readFileSync(path.join(ROOT, DIR + 'run/claude/notes.md'), 'utf8').replace(/\s+/g, ' ');
need(GOALT.includes('| least g found | 4.94 | 0.749 | 0.629 | 0.542 | 0.519 | 0.497 |'), 'the plain search table moved');
need(NOTES.includes('N=6 0.53725, 8 0.47002, 10 0.43719, 12 0.41903, 16 0.40075, 20 0.39220, 40 0.38072, 80 0.37788, 160 0.37712'), 'the switch-and-ring search moved');
const PLAIN = [[6, 0.542], [7, 0.519], [8, 0.497]];
const SWF_ALL = [[6, 0.53725], [8, 0.47002], [10, 0.43719], [12, 0.41903], [16, 0.40075], [20, 0.39220], [40, 0.38072], [80, 0.37788], [160, 0.37712]].map(([n, g]) => [n + 2, g]);
const SWF = SWF_ALL.filter(([n]) => n <= 42);   /* the search is drawn up to 42 states, where the decided members take over */
const vhi = (id) => { const v = JSON.parse(fs.readFileSync(path.join(ROOT, DIR + 'run/control/verdict-' + id + '.json'), 'utf8'));
  need(v.verdict === 'CERTIFIED', id + ' is no longer CERTIFIED in the run'); const mm = v.summary.match(/g = sigma\/r in \[([0-9.]+), ([0-9.]+)\]/); need(mm, id + ': no enclosure'); return Number(ceilDec(mm[2], 6)); };
const RINGS = [[40, vhi('RING40')], [96, vhi('RING96')], [400, vhi('RING400')]];
const MIXES = [[42, vhi('MIX42')], [84, vhi('RATMIX84')], [156, vhi('MIX156')]];
need(Math.abs(MIXES[2][1] - Number(UP)) < 2e-6, 'the 156-state network in the run differs from the record');
const figSize = (w, h, short) => CH.lines({ w, h, x0: 5, x1: 450, logX: true, y0: 0.34, y1: 0.56, hover: false, padR: short ? 26 : 22, padL: short ? 46 : 56,
  yTicks: [0.35, 0.4, 0.45, 0.5, 0.55].map((v) => ({ v, t: v.toFixed(2) })), xTicks: (short ? [10, 100, 400] : [6, 10, 20, 40, 100, 200, 400]).map((v) => ({ v, t: String(v) })),
  xLabel: short ? 'states (log scale)' : 'number of hidden states (log scale)', yLabel: short ? 'g' : 'g of the best machine found',
  rules: [{ v: Number(LO), t: 'lower end ' + floorDec(LO, 4), standing: W.COMPUTED }],
  series: [
    { name: short ? 'plain search (floats)' : 'before the run: a plain search, rings and complete graphs (floats)', pts: PLAIN, standing: W.COMPUTED, token: CH.CTX },
    { name: short ? 'rings, decided' : 'rings, decided', pts: RINGS, standing: W.DECIDED, token: CH.CAT[0] },
    { name: short ? 'switch + ring (floats)' : 'a switch and a ring, floating-point search', pts: SWF, standing: W.COMPUTED, token: CH.CAT[1] },
    { name: short ? 'switch + ring, decided' : 'a switch and a ring, decided', pts: MIXES, standing: W.DECIDED, token: CH.CAT[1] }
  ],
  alt: 'Four series over the number of states, 6 to 400 on a log scale. Rings, decided, stay near 0.44 to 0.46 from 40 to 400 states. The switch-and-ring family falls in a floating-point search from 0.54 at 8 states to 0.381 at 42, and its decided members continue from 42 to 156 states, ending at 0.377. A dashed rule marks the lower end at 0.3657.' });

/* ---- figure: the 156-state machine itself, drawn from its file. Probabilities and the current are computed in floating
   point from the decided network (the free rates at the centre of their box); the drawing checks that its numbers give
   C1 = 0.3 and C2 = 0.08 before it draws anything ---- */
const NETF = JSON.parse(fs.readFileSync(path.join(ROOT, DIR + 'run/claude/mix156.json'), 'utf8'));
const ratF = (s) => { s = String(s); if (!s.includes('/')) return Number(s); const [p, q] = s.split('/');
  const hp = Number(p.slice(0, 17)), hq = Number(q.slice(0, 17)); return hp / hq * Math.pow(10, (p.length - Math.min(p.length, 17)) - (q.length - Math.min(q.length, 17))); };
const NN = NETF.N, RATE = {};
for (const [i, j, k] of NETF.rates) RATE[i + ',' + j] = ratF(k);
NETF.free.forEach(([i, j], k) => { RATE[i + ',' + j] = (Number(NETF.box[k][0]) + Number(NETF.box[k][1])) / 2; });
const solveF = (A, b) => { const n = b.length, M = A.map((r, i) => r.concat([b[i]]));
  for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) if (r !== c && M[r][c] !== 0) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; } }
  return M.map((r, i) => r[n] / r[i]); };
const Lg = Array.from({ length: NN }, () => new Array(NN).fill(0));
for (const key in RATE) { const [i, j] = key.split(',').map(Number); Lg[i][j] += RATE[key]; Lg[i][i] -= RATE[key]; }
const At = Lg.map((_, j) => Lg.map((row) => row[j])); At[NN - 1] = new Array(NN).fill(1);
const PI = solveF(At, new Array(NN - 1).fill(0).concat([1]));
const rr = Number(NETF.r), fl = NETF.lamp;
const resolvent = (v) => solveF(Lg.map((row, i) => row.map((x, j) => (i === j ? rr : 0) - x)), v.map((x) => rr * x));
const Kf = resolvent(fl), K2f = resolvent(Kf);
const C1f = PI.reduce((s, p, i) => s + p * fl[i] * Kf[i], 0), C2f = PI.reduce((s, p, i) => s + p * fl[i] * K2f[i], 0);
need(PI.every((p) => p > 0) && Math.abs(C1f - 0.3) < 1e-9 && Math.abs(C2f - 0.08) < 1e-9, 'the drawn network does not give C1 = 0.3 and C2 = 0.08 in floating point: ' + C1f + ', ' + C2f);
const adjF = {}; for (const key in RATE) { const [i, j] = key.split(',').map(Number); (adjF[i] = adjF[i] || new Set()).add(j); }
const SW = [NN - 2, NN - 1];
need(adjF[SW[1]].size === 1 && adjF[SW[1]].has(SW[0]) && adjF[SW[0]].size === 2, 'the network is no longer a switch joined to a ring by one edge');
const BR = [...adjF[SW[0]]].find((j) => j !== SW[1]);
const ORDER = [BR]; { let prev = -1, cur = BR; for (;;) { const nx = [...adjF[cur]].filter((j) => j !== prev && !SW.includes(j) && !ORDER.includes(j)); if (!nx.length) break; prev = cur; cur = nx[0]; ORDER.push(cur); } }
need(ORDER.length === NN - 2, 'the ring is not one cycle through every other state');
const flux = ORDER.map((a, k) => { const b = ORDER[(k + 1) % ORDER.length]; return PI[a] * (RATE[a + ',' + b] || 0) - PI[b] * (RATE[b + ',' + a] || 0); });
need(flux.every((x) => x > 0) || flux.every((x) => x < 0), 'the ring\'s current changes direction');
const swMass = PI[SW[0]] + PI[SW[1]], ringMass = 1 - swMass, swFlux = PI[SW[0]] * RATE[SW[0] + ',' + SW[1]] - PI[SW[1]] * RATE[SW[1] + ',' + SW[0]];
need(Math.abs(swFlux) < 1e-12, 'the switch carries a current');
const pct = (x) => Math.round(100 * x) + '%';
const onCount = ORDER.filter((i) => fl[i] === 1).length;
function figMachine(w, short) {
  const h = short ? 600 : 440, cx = short ? 180 : 300, cy = short ? 200 : 215, R = short ? 128 : 170;
  const maxRing = Math.max(...ORDER.map((i) => PI[i])), s = (short ? 2.3 : 3.3) / Math.sqrt(maxRing), rad = (p) => s * Math.sqrt(p);
  const dir = flux[0] > 0 ? 1 : -1, ang = (k) => -Math.PI / 2 + dir * 2 * Math.PI * k / ORDER.length;
  const P = ORDER.map((_, k) => [cx + R * Math.cos(ang(k)), cy + R * Math.sin(ang(k))]);
  const sw = short ? [[110, 500], [250, 500]] : [[640, 140], [640, 320]];
  const o = [CH.open({ w, h, alt: 'The 156-state machine: a ring of 154 small dots, half filled (lamp on) and half hollow (lamp off), with an arrow showing the current going round; beside it two large circles, the two-state switch, one filled and one hollow, joined to each other and by one edge to the ring. The switch holds about ' + pct(swMass) + ' of the probability; the ring about ' + pct(ringMass) + ' and all the current.' })];
  const f1 = (x) => x.toFixed(1);
  o.push('    <path d="M' + f1(P[0][0]) + ' ' + f1(P[0][1]) + ' L' + f1(sw[0][0]) + ' ' + f1(sw[0][1]) + '" stroke="var(--c-axis)" stroke-width="1.4" fill="none"/>');
  o.push('    <path d="M' + f1(sw[0][0]) + ' ' + f1(sw[0][1]) + ' L' + f1(sw[1][0]) + ' ' + f1(sw[1][1]) + '" stroke="var(--c-axis)" stroke-width="1.4" fill="none"/>');
  o.push('    <circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="var(--c-grid)" stroke-width="1"/>');
  ORDER.forEach((i, k) => o.push('    <circle cx="' + f1(P[k][0]) + '" cy="' + f1(P[k][1]) + '" r="' + Math.max(0.9, rad(PI[i])).toFixed(2) + '" '
    + (fl[i] === 1 ? 'fill="var(--c-1)"' : 'fill="var(--sunk)" stroke="var(--c-1)" stroke-width="1"') + '/>'));
  SW.forEach((i, k) => o.push('    <circle cx="' + sw[k][0] + '" cy="' + sw[k][1] + '" r="' + rad(PI[i]).toFixed(1) + '" '
    + (fl[i] === 1 ? 'fill="var(--c-1)"' : 'fill="var(--sunk)" stroke="var(--c-1)" stroke-width="1.6"') + '/>'));
  /* the current: an arc inside the ring with an arrowhead, in the direction the ring's states are visited */
  const r2 = R - 26, a0 = -Math.PI / 2 + dir * 0.35, a1 = -Math.PI / 2 + dir * (2 * Math.PI - 0.6);
  const ex = cx + r2 * Math.cos(a1), ey = cy + r2 * Math.sin(a1);
  o.push('    <path d="M' + f1(cx + r2 * Math.cos(a0)) + ' ' + f1(cy + r2 * Math.sin(a0)) + ' A' + r2 + ' ' + r2 + ' 0 1 ' + (dir > 0 ? 1 : 0) + ' ' + f1(ex) + ' ' + f1(ey) + '" stroke="var(--c-axis)" stroke-width="1.6" fill="none"/>');
  const ta = a1 + dir * Math.PI / 2, hx = Math.cos(ta), hy = Math.sin(ta), nx = -hy, ny = hx;
  o.push('    <path d="M' + f1(ex + 9 * hx) + ' ' + f1(ey + 9 * hy) + ' L' + f1(ex + 5 * nx) + ' ' + f1(ey + 5 * ny) + ' L' + f1(ex - 5 * nx) + ' ' + f1(ey - 5 * ny) + 'Z" fill="var(--c-axis)"/>');
  o.push(CH.txt(cx, cy - 8, 'the ring', 't-lab', 'middle'));
  o.push(CH.txt(cx, cy + 12, ORDER.length + ' states · ' + pct(ringMass), 't-note', 'middle'));
  o.push(CH.txt(cx, cy + 30, 'all of the current', 't-note', 'middle'));
  if (short) {
    o.push(CH.txt(180, 420, 'the switch: 2 states · ' + pct(swMass), 't-lab', 'middle'));
    o.push(CH.txt(180, 438, 'in equilibrium, no current', 't-note', 'middle'));
  } else {
    o.push(CH.txt(712, 212, 'the switch', 't-lab', 'start'));
    o.push(CH.txt(712, 232, '2 states · ' + pct(swMass), 't-note', 'start'));
    o.push(CH.txt(712, 250, 'in equilibrium', 't-note', 'start'));
    o.push(CH.txt(712, 268, 'no current', 't-note', 'start'));
    o.push(CH.txt((P[0][0] + sw[0][0]) / 2, (P[0][1] + sw[0][1]) / 2 - 10, 'one edge', 't-note', 'middle'));
  }
  o.push(CH.legend([{ token: 'var(--c-1)', t: 'lamp on (filled) · lamp off (hollow) · area ∝ probability' }], short ? 20 : 60, h - 14, null, w - 80));
  o.push(CH.close);
  return o.join('\n');
}

/* ---- 1 · the question ---- */
O.push(C.section({ lab: '1 · the question', title: 'A light that has to cost energy', id: 'question', wide: true, bodyRaw:
  SCH
  + C.figure({ svgRaw: figPlane(900, 340, false), svgNarrowRaw: figPlane(360, 400, true), record: [DIR + 'run/GOAL.md'],
    caption: 'Why this light costs energy. A machine in equilibrium always lands on or above the curve C2 = C1²; this lamp lands just under it, 0.08 against 0.09.',
    stop: 'the target is no longer (3/10, 2/25)' })
  + '<div class="col">' + C.plainList([
    { b: 'The paper.', raw: C.esc('A. V. Dobrynin and A. Stroujkova, ') + a(PAPER, 'When Time-Reversible Sensor Records Require Hidden Dissipation') + C.esc(' (arXiv:2611.24898, 18 November 2026), shows this effect for a lamp watched continuously and leaves the least dissipation over all finite machines open. Here the observer has only the two numbers.') },
    { b: 'Before the run.', text: 'g was known to lie between 0.02 (an inequality of Pinsker’s type) and 0.497 (an eight-state ring). The paper’s four-state machine gives ln 3 ≈ 1.10.' }
  ]) + '</div>' }));

/* ---- 2 · the upper end ---- */
const NET = { RING40: [40, 'gpt', 'a ring'], RING400: [400, 'gpt', 'a ring'], MIX42: [42, 'claude', 'a switch, a ring, one edge'],
  RATMIX84: [84, 'gpt', 'two switches and a ring, every rate a fraction'], MIX156: [156, 'claude', 'a switch, a ring, one edge'] };
need(SE.upper.slice(1).every((e) => NET[e.claim]), 'a network in the series has no description here');
O.push(C.section({ lab: '2 · the upper end, decided', title: 'The machine that won: a switch and a ring', id: 'upper', wide: true, bodyRaw:
  C.figure({ svgRaw: figMachine(900, false), svgNarrowRaw: figMachine(360, true), record: [DIR + 'run/claude/mix156.json', REC],
    caption: 'The 156-state machine of the upper end, drawn from its file. Most of the probability (' + pct(swMass) + ') sits in a two-state switch in equilibrium; a ring of ' + ORDER.length + ' states carries all the current, with the lamp on for ' + onCount + ' of them in a row; one edge joins the two. Areas and the current are computed in floating point from the decided network.',
    stop: 'the drawn network stops giving C1 = 0.3 and C2 = 0.08, or stops being a switch joined to a ring' })
  + C.figure({ svgRaw: figSize(900, 360, false), svgNarrowRaw: figSize(360, 420, true), record: [DIR + 'run/control/verdict-MIX156.json', DIR + 'run/control/verdict-RING400.json', DIR + 'run/claude/notes.md'],
    caption: 'Rings stall near 0.44 however many states they get. The switch-and-ring shape keeps falling: dashed where it was found by a floating-point search, solid where machines were decided exactly. In the search it reaches 0.37712 at 162 states; ' + CLA + ' extrapolates 0.3769.',
    stop: 'a decided network in the figure is no longer CERTIFIED in the run' })
  + '<div class="col">' + C.plainList([
    { b: 'How a machine is decided.', text: 'The checker computes both numbers exactly. When two rates are left free in a tiny box, an interval Newton test (Krawczyk’s) proves exactly one choice in the box hits both numbers; then it encloses the dissipation.' },
    { b: 'Two programs on one machine.', text: 'The 84-state machine, every rate a fraction, was decided again by a second program written without opening the checker: g ≤ ' + ceilDec(ST.U1.rational.g_hi, 8) + '.' }
  ]) + '</div>'
  + '<div class="wide"><details class="more"><summary>The decided machines</summary>' + C.table({ cols: [{ h: 'Network' }, { h: 'States' }, { h: 'Shape' }, { h: 'From' }, { h: 'g at most' }, { h: 'Standing' }],
    rows: SE.upper.slice(1).map((e) => [e.claim, String(NET[e.claim][0]), NET[e.claim][2], who(NET[e.claim][1]), { raw: m(ceilDec(e.value, 8)) }, { raw: C.tag('DECIDED', 'cert') }]) }) + '</details></div>'
}));

/* ---- 3 · the lower end ---- */
const CERTS = SE.lower.filter((e) => /^CERT/.test(e.claim));
O.push(C.section({ lab: '3 · the lower end, read once', title: 'A certificate every machine must pay', id: 'lower', wide: true, bodyRaw:
  '<div class="col">' + C.plainList([
    { b: 'The idea.', text: 'Label every hidden state by what it predicts about the lamp’s future and what it remembers of its past: a point in a square. A certificate is three functions on that square. If two conditions hold everywhere, every machine dissipates at least a stated amount (Theorem D), and it is enough to check a 2×2 matrix inequality at each single point (Theorem C).' },
    { b: 'Decided here.', text: 'The best certificate passes both conditions over the whole square, for both lamp states, in exact arithmetic: ' + N(boxes) + ' boxes, checked by a program written from the theorems’ text alone. Its bound is 1828627119/5000000000 = ' + floorDec(LO, 7) + '. Two other programs, the author’s and ' + GPT + '’s, agree.' },
    { b: 'Not decided.', text: 'Theorems D and C were proved by ' + CLA + ' and re-derived by ' + GPT + '; nobody else has checked them. If either fails, the lower end falls; the upper end does not.' }
  ]) + '</div>'
  + C.table({ cols: [{ h: 'Certificate' }, { h: 'g at least' }, { h: 'Entered the record (UTC)' }],
    rows: CERTS.map((e) => [e.claim, { raw: m(e.value) }, e.at.slice(0, 5)]) })
  + '<div class="wide"><details class="more"><summary>The theorems and who read them</summary>' + C.table({ cols: [{ h: 'Claim' }, { h: 'From' }, { h: 'Read by' }, { h: 'Standing' }, { h: 'How it was read' }],
    rows: RD.theorems.map((c) => [T(c.statement), who(c.from), c.readBy.map(who).join(', '), { raw: C.tag(c.status, 'cert') }, T(c.note)]) })
  + C.pRaw(C.esc('PROOF READ means a written proof was followed and re-derived by the reader named, who found no error. It is not a formal check and not this repository’s verdict. The proofs are ') + rec(DIR + 'run/claude/lifting.md') + C.esc(' and ') + rec(DIR + 'run/claude/locality.md') + C.esc('.')) + '</details></div>'
}));

/* ---- 4 · controls and plants ---- */
const ctl = (re) => R.controls.find((k) => re.test(k.control));
need(ctl(/^KL1a/) && ctl(/^KL1a/).routeConfirms === true, 'the unscaled certificate is no longer refused with a witness');
O.push(C.section({ lab: '4 · could the checks fail?', title: 'Wrong versions, refused', id: 'controls', bodyRaw: C.plainList([
  { b: 'Controls.', text: refused + ' wrong versions, all refused: a rate moved by a millionth, a dissipation claimed just below its enclosure, the search box moved off its zero, the certificate before its final scaling, its constant raised, its bound misstated, one function bent at one point.' },
  { b: 'Planted in the run.', text: 'Two false claims, sealed before the run: a network with a wrong dissipation and a wrong step inside a proof. Each model caught both.' }
]) }));

O.push(C.section({ lab: 'who did what', title: 'Each step is a separate job', id: 'roles', bodyRaw: C.plainList([
  { b: 'The networks.', text: 'Rings by both models; the switch-and-ring family by ' + CLA + ', which ' + GPT + ' turned into a network with every rate a fraction.' },
  { b: 'The lower bounds.', text: GPT + ' gave the first strong one, 0.2612, with an idea the later certificates generalise. ' + CLA + ' wrote the two theorems, the certificates and their verifier; ' + GPT + ' re-derived the theorems and re-verified five of the certificates with its own program.' },
  { b: 'The checkers and the judge.', text: 'The network checker was written by the control room (' + CTL + ', Anthropic) before the run, from the definitions. For this record a second network program and the certificate checker were written from the definitions and the theorems’ text, without opening either model’s programs.' },
  { b: 'The run and this page.', text: 'Carlos Toledo, with Claude (Anthropic), which wrote the programs under my direction. The run went from 11:04 to 17:49 UTC on 19 November 2026, on one laptop: ' + N(RD.run.messages.gpt + RD.run.messages.claude) + ' messages between the two models in one shared folder. The question came to me from a conversation with another AI model, which did not cite the paper; I found the paper before the run.' }
]) }));

O.push(C.section({ lab: 'check it yourself', title: 'How to re-read it', id: 'rerun', bodyRaw: C.plainList([
  { b: 'The record.', raw: m('python3 ' + INST + 'judge.py --check') + C.esc(' re-checks the pinned files and decides the start, the rational network and the certificate again; ') + m('--write') + C.esc(' decides everything, controls included, and writes ') + rec(REC) + C.esc('. The statements were written down before the judge existed: ') + rec(PRE) + C.esc('.') },
  { b: 'A network.', raw: C.esc('Give any network file to ') + rec(INST + 'lamp.py') + C.esc(' (or, with every rate a fraction, to ') + rec(INST + 'rational.py') + C.esc('). A machine of any size with the same two correlations and less dissipation than ' + ceilDec(UP, 5) + ' per look would move the upper end in one file.') },
  { b: 'The certificate.', raw: rec(DIR + 'run/claude/cert222g.json') + C.esc(' and its checker ') + rec(INST + 'lower.py') + C.esc('; the checker’s own account, limits first, is ') + rec(INST + 'CHECKERS.md') + C.esc('.') },
  { b: 'What the models wrote.', raw: C.esc('Their notes, data and the whole conversation are under ') + rec(DIR + 'run') + C.esc('. Their programs are not copied here; each is pinned by its hash in ') + rec(DIR + 'MANIFEST.json') + C.esc('. The two planted claims and the checks that showed them false are in ') + rec(DIR + 'private') + C.esc('.') }
]) }));

const foot = '<p>' + C.esc('Generated by tools/build-report-blinking-light.js from ' + REC + ', re-checked as the page is built. I did this with Claude (Anthropic); Claude wrote the programs under my direction.') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p>';
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'blinking-light.html'), TPL.render({ title: TITLE + ' · cert-machine', bodyRaw: O.join('\n\n'), footRaw: foot, path: '/reports/blinking-light.html',
  og: { image: '/og-blinking-light.png', alt: OG.alt('blinking-light') },
  desc: 'The least dissipation of a hidden machine whose lamp, read at random times, has two given correlations: ' + floorDec(LO, 5) + ' ≤ g ≤ ' + ceilDec(UP, 5) + ', the upper end decided, the lower end read once.' }));
console.log('reports/blinking-light.html written · ' + floorDec(LO, 7) + ' <= g <= ' + ceilDec(UP, 8) + ' · gap ' + gapPct + '% · controls refused ' + refused + ' of ' + R.controls.length);
