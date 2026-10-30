/* systems.js — geometry, networks and systems: six ways of showing a structure, each drawn twice from an instrument's
   own record (as a plotting call or a whiteboard draws it, and in WARRANT). The interface is tools/grammar-scenes/
   README.md; the drawing atoms are tools/build-grammar-gallery.js's, so a pair here is drawn the way the gallery draws
   its pairs.
   tools/grammar-scenes/ · cert-machine · 2026-10-30

   THE SIX FORMS, one record each, every number read at build and every caption sentence guarded:
     · a wiring diagram          playground/graph/out/spec.json + facts.json (the graph the engine builds, and refuses)
     · a point in a simplex      playground/simplex/out/decision.json (one attention row, two kernels)
     · an embedding with a tree  playground/neural-geometry/out/geometry.json (a model's dissimilarities, its spanning tree)
     · a ladder of enclosures    instruments/pqc/out/audit.json (SVP-challenge records against the 1.05 wall)
     · a matrix of verdict words instruments/wiring/eval/page.json (lattice claims × the models that judged them)
     · lines of descent          site/machinidae/data/era-0-1.json.gz (a foreign zone, read only, checked against its pin)

   Standing: decided solid, computed dashed, chosen dotted, refused the hatched void with words. A layout placed by a
   float solver is a chosen picture and is said so once; the usual panels are unclassed, one ink, one weight. MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const ROOT = path.resolve(__dirname, '..', '..');
const GAL = require(path.join(ROOT, 'tools', 'build-grammar-gallery.js'));
const PL = require(path.join(ROOT, 'tools', 'build-grammar-plates.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const C = require(path.join(ROOT, 'design', 'components.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const { mstUnique } = require(path.join(ROOT, 'playground', 'mst.js'));
const { f1, line, poly, t, mood, eyebrow, svg, voidWords, sha, makeGuard } = GAL.atoms;
const { PLAIN, PW, PH, TOP } = GAL;
const esc = C.esc;
const rd = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const GUIDE = 'fill="none" stroke="var(--ink-4)" stroke-width="1" stroke-dasharray="2 3"';
const HAIR = 'fill="none" stroke="var(--rule-strong)" stroke-width="1"';
const dot = (x, y, r, a) => '    <circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + r + '" ' + a + '/>';
const rect = (x, y, w, h, a) => '    <rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(w) + '" height="' + f1(h) + '" ' + a + '/>';
const pathD = (d, a) => '    <path d="' + d + '" ' + a + '/>';
const FILL = (v) => 'fill="var(' + v + ')"';
/* an arrowhead for the usual panel's arrows: a filled triangle pointing along (dx, dy) */
const arrow = (x, y, dx, dy) => { const L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, s = 6;
  return '    <path d="M' + f1(x) + ',' + f1(y) + 'L' + f1(x - s * ux + s * 0.45 * uy) + ',' + f1(y - s * uy - s * 0.45 * ux) + 'L' + f1(x - s * ux - s * 0.45 * uy) + ',' + f1(y - s * uy + s * 0.45 * ux) + 'Z" fill="var(--ink-2)"/>'; };
/* text advance bounds, mono: t-note 11.5 px, t-ax 12 px, t-lab 13 px */
const ADV = { 't-note': 6.9, 't-ax': 7.2, 't-lab': 7.8 };
const fitsIn = (s, cls, w) => String(s).length * ADV[cls] <= w;
/* a count in words, for sentences; past twenty, digits */
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const numword = (n) => (n <= 20 ? WORDS[n] : n === 31 ? 'thirty-one' : String(n));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ================================================================ 1. a wiring diagram ==
   The graph of /instruments/graph: one certified cell of the sigma band, as the graph that decides it. The record
   holds the nodes, what each emits, which ports decide, the legal wires and the one the engine refuses. */
function wiring(guard) {
  guard = makeGuard(guard);
  const SP = 'playground/graph/out/spec.json', FP = 'playground/graph/out/facts.json';
  const S = rd(SP), F = rd(FP);
  const node = (id) => S.nodes.find((n) => n.id === id);
  const decides = (id, port) => node(id).deciding.includes(port);
  const [fa, fp, ta, tp] = S.forbidden;
  const STOP = 'a wire out of a node that emits floats reaches a port that decides, the record stops refusing the screen’s shortlist into the radii polynomial, or a certified cell stops re-deriving identically';
  guard(STOP, node(fa).emits === 'float' && decides(ta, tp) && /^THE FLOAT FIREBREAK/.test(F.refusal)
    && S.wires.every(([a, , b, q]) => !(node(a).emits === 'float' && decides(b, q)))
    && F.disagreed === 0 && F.reDerivedIdentically === F.cellsCertified && F.cellsCertified === F.cellsOnDisk
    && Number(F.worstRelativeDifference) === 0, F.refusal.split('\n')[0]);
  const band = node('band'), screen = node('screen'), radii = node('radii');
  guard(STOP, band.emits === 'interval' && screen.emits === 'float' && radii.instrument && fa === 'screen' && ta === 'radii' && screen.outputs.includes(fp)
    && S.wires.length === 4 && radii.outputs.join() === F.ports.join()
    && S.wires.filter(([a, , b]) => a === 'band' && b === 'radii').length === 3 && S.wires.filter(([a, , b]) => a === 'band' && b === 'screen').length === 1, S.wires.length);
  /* the verdict ports: every cell on disk went out of "certified", so the other two fired on none of them */
  const fired = { certified: F.cellsCertified, refuted: F.cellsOnDisk - F.cellsCertified, refused: F.refusedOnReplay };
  guard(STOP, fired.refuted === 0 && fired.refused === 0);
  /* the drawing: band on the left, the screen above the radii polynomial on the right */
  const BW = 120, ROW = 18;
  const BOX = { band: { x: 14, y: 70, h: 92 }, screen: { x: 200, y: 58, h: 46 }, radii: { x: 200, y: 156, h: 92 } };
  const portY = (id, i) => BOX[id].y + 38 + i * ROW;
  const inAt = (id, port) => [BOX[id].x, portY(id, node(id).inputs.indexOf(port))];
  const outAt = (id, port) => [BOX[id].x + BW, portY(id, node(id).outputs.indexOf(port))];
  const curve = ([x1, y1], [x2, y2]) => 'M' + f1(x1) + ',' + f1(y1) + 'C' + f1(x1 + 34) + ',' + f1(y1) + ' ' + f1(x2 - 34) + ',' + f1(y2) + ' ' + f1(x2) + ',' + f1(y2);
  const box = (id, plain) => { const b = BOX[id], n = node(id), out = [];
    out.push(rect(b.x, b.y, BW, b.h, 'rx="4" fill="var(--sunk)" stroke="var(' + (n.instrument && !plain ? '--ink-3' : '--rule-strong') + ')" stroke-width="1"'));
    out.push(t(b.x + BW / 2, b.y + 17, n.title, 't-note', 'middle'));
    out.push(line(b.x, b.y + 24, b.x + BW, b.y + 24, HAIR));
    n.inputs.forEach((p, i) => { const y = portY(id, i);
      out.push(plain || !n.deciding.includes(p) ? dot(b.x, y, 3.2, plain ? FILL('--ink-2') : 'fill="var(--sunk)" stroke="var(--ink)" stroke-width="1.2"')
        : rect(b.x - 3.6, y - 3.6, 7.2, 7.2, 'class="w-decided" fill="var(--ink)" stroke="var(--ink)" stroke-width="1"'));
      out.push(t(b.x + 8, y + 4, p, 't-ax')); });
    n.outputs.forEach((p, i) => { const y = portY(id, i);
      const on = id !== 'radii' || plain || fired[p] > 0;
      out.push(dot(b.x + BW, y, 3.2, plain ? FILL('--ink-2') : on ? 'fill="var(--ink)" stroke="var(--ink)" stroke-width="1"' : 'fill="var(--sunk)" stroke="var(--ink-3)" stroke-width="1.2"'));
      out.push(t(b.x + BW - 8, y + 4, p, 't-ax', 'end')); });
    return out.join('\n'); };
  const legal = (plain) => S.wires.map(([a, p, b, q]) => {
    const d = curve(outAt(a, p), inAt(b, q));
    if (plain) { const [x2, y2] = inAt(b, q); return pathD(d, PLAIN) + '\n' + arrow(x2 - 3.4, y2, 1, 0); }
    return pathD(d, W.attrs(node(a).emits === 'float' ? W.COMPUTED : W.DECIDED, { width: 1.6 }));
  }).join('\n');
  const [sx, sy] = outAt('screen', fp);
  const counts = (plain) => radii.outputs.map((p, i) => t(BOX.radii.x + BW + 8, portY('radii', i) + 4, String(fired[p]), plain ? 't-ax' : fired[p] ? 't-lab' : 't-note')).join('\n');
  const foot = F.cellsCertified + ' of ' + F.cellsOnDisk + ' cells re-derived identically · ' + F.disagreed + ' disagreed';
  const usual = (() => {
    const out = [eyebrow(8, 14, 'as usually drawn')];
    out.push(t(14, 38, 'the pipeline', 't-ax'));
    out.push(legal(true));
    out.push(line(sx, sy, sx + 26, sy, PLAIN), arrow(sx + 30, sy, 1, 0));
    out.push(box('band', true), box('screen', true), box('radii', true), counts(true));
    out.push(t(14, 280, foot, 't-note'));
    return svg(PW, PH, 'As usually drawn: three boxes, the sigma band, a float screen and the radii polynomial, joined by four arrows in one ink. The band feeds the screen and the polynomial; the screen\'s output, the shortlist, is an arrow that points onward; every port is the same dot, and the three verdict outputs carry their counts, ' + radii.outputs.map((p) => fired[p]).join(', ') + '. Nothing in the drawing says which arrow carries a float, which port decides, or that one connection is forbidden.', out);
  })();
  const warrant = (() => {
    const h = PL.hatch(), out = [h.def, eyebrow(8, 14, 'in warrant')];
    out.push(t(14, 38, 'solid carries intervals · dashed carries floats', 't-note'));
    out.push(legal(false));
    /* the shortlist leaves the screen dashed and stops at the void: the wire into Y0 is refused, so it is not drawn */
    const VY = 112, VH = 36, VX = 210;
    out.push(pathD('M' + f1(sx) + ',' + f1(sy) + 'H' + f1(sx + 26) + 'V' + f1(VY), W.attrs(W.COMPUTED, { width: 1.6 })));
    out.push(PL.voidRect(h, VX, VY, PW - 6 - VX, VH));
    out.push(voidWords((VX + PW - 6) / 2, VY + 15, ['∅ no wire into ' + tp + ':', 'a float never decides']));
    out.push(box('band', false), box('screen', false), box('radii', false), counts(false));
    out.push(t(14, 190, '■ decides', 't-note'), t(14, 206, '● fired', 't-note'), t(14, 222, '○ never fired', 't-note'));
    out.push(t(14, 280, foot, 't-note'));
    return svg(PW, PH, 'In WARRANT: the same three boxes. The sigma band emits exact intervals, so its three wires into the radii polynomial and its wire into the float screen are solid, decided. The float screen emits floats, so its shortlist leaves it as a dashed line, computed, and stops at a hatched void with the words "no wire into ' + tp + ': a float never decides": the engine refuses that wire, so no line is drawn into the port. The radii polynomial\'s three input ports are filled squares because they decide; its three verdict ports are always drawn, certified filled with ' + fired.certified + ' cells, refuted and refused hollow with ' + fired.refuted + ' and ' + fired.refused + '. All ' + F.cellsOnDisk + ' cells on disk re-derived identically through the graph.', out);
  })();
  return {
    id: 'wiring', title: 'A wiring diagram', form: 'a wiring diagram', kind: 'record', record: [SP, FP], stop: STOP, usual, warrant,
    link: 'instruments/graph/',
    hides: 'The usual diagram draws every connection as the same arrow, so it cannot show the one rule that matters: a value that came from floating point may prune, never decide. Here a wire is drawn in the stroke of what it carries, a port that decides is a square, a verdict port that never fired stays on the drawing, and the connection the engine refuses is a void with its reason.',
    rule: 'Draw each wire in the stroke of what its source emits (solid for exact, dashed for float), draw a deciding port as a square, keep every verdict port on the drawing whether it fired or not, and put a refused connection as a hatched void with the reason, never as a line.',
    caption: 'One certified cell of the sigma band as the graph that decides it, read from the graph the page builds: the band hands three exact intervals to the radii polynomial, the only node that may conclude anything, and one interval to a float screen. The screen’s shortlist has no wire into the polynomial; the engine refuses it in the words “' + esc(F.refusal.split('\n')[0].replace(/^THE FLOAT FIREBREAK: /, '')) + '”',
  };
}

/* ================================================================ 2. a point in a simplex ==
   One causal attention row (31 positions) from a tiny GPT. Its weights sum to one, so it is a point of a simplex. */
function simplex(guard) {
  guard = makeGuard(guard);
  const REC = 'playground/simplex/out/decision.json';
  const D = rd(REC), M = D.meta, T = D.top3, N = M.positions;
  const last = D.view[D.view.length - 1];
  const STOP = 'the decided grid stops sharpening the row (its participation ratio no longer strictly falls), a planted mutant stops failing, or the three positions drawn stop being the row’s three largest at the trail’s end';
  const top = last.w.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, 3).map((x) => x[1]);
  guard(STOP, D.ok && D.checks.every((c) => c.ok) && D.exact.every((r, i) => i === 0 || r.PR < D.exact[i - 1].PR)
    && Object.values(D.mutants).every((m) => m.down === false) && top.join() === T.join() && D.exact.every((r) => r.w.length === N),
  top.join());
  /* the in-grid part of the softmax trail is exactly the part at or under the grid's last β */
  const bMax = D.exact[D.exact.length - 1].beta;
  guard(STOP, D.view.every((v) => v.certified === (v.beta <= bMax)), bMax);
  const face = (w) => { const s = T.reduce((a, i) => a + w[i], 0); return T.map((i) => w[i] / s); };
  const kn = D.exact.map((r) => face(r.w));
  /* each step of the decided grid moves the restricted row toward the first vertex */
  guard(STOP, kn.every((p, i) => i === 0 || p[0] > kn[i - 1][0]) && face(last.w)[0] > 0.95, kn.map((p) => p[0].toFixed(4)).join());
  /* the usual panel: the row at the decided grid's last temperature, as 31 bars */
  const endRow = D.exact[D.exact.length - 1].w, wMax = Math.max(...endRow);
  const usual = (() => {
    const O = { w: PW, h: PH, padL: 46, padR: 14, padT: TOP, padB: 40, x0: -0.7, x1: N - 0.3, y0: 0, y1: 0.06 };
    const f = CH.frame(O), out = [CH.axes(f, { yTicks: [0, 0.02, 0.04, 0.06].map((v) => ({ v, t: String(v) })), xTicks: [0, 10, 20, 30].map((v) => ({ v, t: String(v) })) }), eyebrow(8, 14, 'as usually drawn')];
    const bw = (f.px(1) - f.px(0)) * 0.7;
    endRow.forEach((v, i) => out.push(rect(f.px(i) - bw / 2, f.py(v), bw, f.py(0) - f.py(v), FILL('--ink-3'))));
    out.push(t(f.L, f.T - 12, 'attention by position, β = ' + bMax, 't-ax'));
    out.push(t(f.L + f.pw, f.T + f.ph + 32, 'position', 't-ax', 'end'));
    const lo3 = (Math.floor(Math.min(...endRow) * 1000) / 1000).toFixed(3), hi3 = (Math.ceil(wMax * 1000) / 1000).toFixed(3);
    return svg(PW, PH, 'As usually drawn: an attention row as ' + numword(N) + ' bars, the weight on each position at inverse temperature ' + bMax + ', the last temperature of the grid on which the rational kernel is decided. The bars run between ' + lo3 + ' and ' + hi3 + '; one ink, and nothing in the chart says where the row sits among all possible rows or where it is heading as the temperature sharpens.', out);
  })();
  const warrant = (() => {
    const out = [eyebrow(8, 14, 'in warrant')];
    /* the face: vertex T[0] at the top, T[1] bottom left, T[2] bottom right */
    const V = [[176, 66], [56, 274], [296, 274]];
    const P = (p) => [p[0] * V[0][0] + p[1] * V[1][0] + p[2] * V[2][0], p[0] * V[0][1] + p[1] * V[1][1] + p[2] * V[2][1]];
    const ctr = P([1 / 3, 1 / 3, 1 / 3]);
    /* the rings: participation ratio on the face, exact by its formula, drawn as a ruler; every 6th point kept */
    const rings = D.contours.filter((c) => [1.5, 2, 2.5].includes(c.level));
    for (const c of rings) { const pts = c.pts.filter((_, i) => i % 6 === 0 || i === c.pts.length - 1).map(P); out.push(poly(pts, HAIR)); }
    out.push(poly([V[0], V[1], V[2], V[0]], 'fill="none" stroke="var(--ink-4)" stroke-width="1"'));
    /* each ring labelled just above its lowest point, under the centre, where no mark runs */
    for (const lv of [2, 2.5]) { const low = D.contours.filter((x) => x.level === lv).flatMap((c) => c.pts.map(P)).filter((q) => Math.abs(q[0] - ctr[0]) < 30).reduce((a, q) => (q[1] > a[1] ? q : a));
      out.push(t(ctr[0], low[1] - 4, 'PR ' + lv, 't-note', 'middle')); }
    out.push(t(V[0][0], V[0][1] - 6, 'position ' + T[0], 't-ax', 'middle'));
    out.push(t(V[1][0] - 2, V[1][1] + 18, 'position ' + T[1], 't-ax', 'start'));
    out.push(t(V[2][0] + 2, V[2][1] + 18, 'position ' + T[2], 't-ax', 'end'));
    /* the softmax trail: float, dashed, every 4th row kept */
    const trail = D.view.filter((_, i) => i % 4 === 0 || i === D.view.length - 1).map((v) => P(face(v.w)));
    out.push(poly(trail, W.attrs(W.COMPUTED, { width: 1.6 })));
    /* the trail's words sit outside the face's left edge, level with the trail's middle */
    const LY = V[0][1] + 52, edgeX = V[0][0] + (V[1][0] - V[0][0]) * (LY + 14 - V[0][1]) / (V[1][1] - V[0][1]);
    guard(STOP, fitsIn('float, to β = ' + M.viewMaxBeta, 't-note', edgeX - 12), 'the trail\'s words no longer fit beside the face');
    out.push(t(edgeX - 8, LY, 'softmax trail,', 't-note', 'end'), t(edgeX - 8, LY + 14, 'float, to β = ' + M.viewMaxBeta, 't-note', 'end'));
    /* the decided knots, and a ring that magnifies them: the guide circle and its leader say nothing */
    const Z = 5, IC = [340, 150], IR = 48;
    /* the ring is centred on the knots' own middle, so the whole decided stretch sits inside it */
    const a0 = P(kn[0]), a1 = P(kn[kn.length - 1]), km = [(a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2];
    const zoom = (q) => [IC[0] + (q[0] - km[0]) * Z, IC[1] + (q[1] - km[1]) * Z];
    for (const p of kn) out.push(dot(...P(p), 1.6, 'class="w-decided" fill="var(--ink)"'));
    out.push(dot(km[0], km[1], 8, GUIDE), line(km[0] + 8, km[1], IC[0] - IR, IC[1] + 8, GUIDE));
    out.push('    <clipPath id="sx-clip"><circle cx="' + IC[0] + '" cy="' + IC[1] + '" r="' + (IR - 1) + '"/></clipPath>');
    out.push(dot(IC[0], IC[1], IR, 'fill="var(--sunk)" stroke="var(--ink-4)" stroke-width="1" stroke-dasharray="2 3"'));
    out.push('    <g clip-path="url(#sx-clip)">', poly(D.view.filter((v) => v.certified).map((v) => zoom(P(face(v.w)))), W.attrs(W.COMPUTED, { width: 1.6 })));
    for (const p of kn) out.push(dot(...zoom(P(p)), 2.6, 'class="w-decided" fill="var(--ink)"'));
    out.push('    </g>');
    const k0 = zoom(P(kn[0])), k1 = zoom(P(kn[kn.length - 1]));
    const spread = Math.max(...kn.map((p) => Math.hypot(P(p)[0] - ctr[0], P(p)[1] - ctr[1])));
    guard(STOP, spread < 16, 'the decided knots are no longer a few pixels from the centre');
    out.push(t(IC[0], IC[1] + IR + 16, 'zoom ' + Z + ':1', 't-note', 'middle'));
    out.push(t(IC[0], IC[1] + IR + 30, 'β ¼ to ' + bMax + ' decided', 't-note', 'middle'));
    out.push(mood(PW - 6, 38, 'given positions ' + T.join(', ') + ' (the top three)', 'end'));
    guard(STOP, [k0, k1].every((q) => Math.hypot(q[0] - IC[0], q[1] - IC[1]) < IR - 6), 'the magnified knots no longer fit their ring');
    return svg(PW, PH, 'In WARRANT: the row restricted to its three most-attended positions, ' + T.join(', ') + ', and renormalised, drawn as a point of a triangle, a face of the simplex; the face is a choice, named in italic. The rational kernel\'s row at its nine decided temperatures, β from 1/4 to ' + bMax + ', is ' + numword(D.exact.length) + ' solid knots, decided in exact arithmetic, all within a few pixels of the centre, magnified ' + numword(Z) + ' times in a dotted ring. The softmax row is a dashed trail, computed in floating point, running from the centre to the corner of position ' + T[0] + ' by β = ' + M.viewMaxBeta + '. Thin solid rings are the participation ratio on the face at 1.5, 2 and 2.5, a ruler. What the figure shows: the decided part of the journey is a few pixels long; the long run to the corner is float.', out);
  })();
  return {
    id: 'simplex', title: 'An attention row as a point', form: 'a point in a simplex', kind: 'record', record: REC, stop: STOP, usual, warrant,
    link: 'instruments/simplex/',
    hides: 'Weights that sum to one are a point in a simplex, and a bar chart throws that away: ' + numword(N) + ' bars at one temperature say nothing about where the row is heading. Drawn as a point, the row’s path is visible, and the grammar shows how little of it is decided: ' + numword(D.exact.length) + ' solid knots near the centre, and a long dashed float trail to the corner.',
    rule: 'Draw a composition that sums to one as a point in a simplex (restricted to a face you name in italic), each exact value a solid knot, a float path dashed, and magnify a short decided stretch in a ring rather than stretching the axes.',
    caption: cap(M.what) + ', ' + N + ' positions. The knots are the rational kernel (1 + βs)<sup>' + M.p + '</sup> at the ' + D.exact.length + ' temperatures on which its participation ratio is decided to fall strictly, in exact arithmetic; the trail is softmax in floating point, to β = ' + M.viewMaxBeta + '. On the face the participation ratio is 1/Σpᵢ² and its rings are exact circles, drawn as a ruler.',
  };
}

/* ================================================================ 3. an embedding with a tree ==
   Ten carnivores, one model's elicited dissimilarities (integers, or halves where asked both ways), placed by an
   eigendecomposition in floating point, and the minimum spanning tree the numbers admit. */
function embedding(guard) {
  guard = makeGuard(guard);
  const REC = 'playground/neural-geometry/out/geometry.json';
  const G = rd(REC), set = G.sets.find((s) => s.id === 'carnivores');
  const STOP = 'a distance stops being a whole or half number, the drawn tree stops being a minimum spanning tree, or an edge drawn solid can be swapped for one of equal length';
  /* per edge: in every minimum spanning tree (no outside edge of equal length closes a cycle through it), or tied */
  const edges = (m) => {
    const n = m.D.length, D = m.D, Tr = m.mst.map(([a, b]) => [Math.min(a, b), Math.max(a, b)]);
    mstUnique(D, m.mst);   /* refuses a distance that is not a multiple of ½, and a tree that is not minimum */
    const adj = Array.from({ length: n }, () => []); Tr.forEach(([a, b], k) => { adj[a].push([b, k]); adj[b].push([a, k]); });
    const route = (s, e) => { const st = [[s, []]], seen = new Set([s]); while (st.length) { const [u, p] = st.pop(); if (u === e) return p; for (const [v, k] of adj[u]) if (!seen.has(v)) { seen.add(v); st.push([v, p.concat(k)]); } } return null; };
    const inT = new Set(Tr.map(([a, b]) => a + '-' + b)), tied = new Set(), alts = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (inT.has(i + '-' + j)) continue;
      const p = route(i, j), mx = Math.max(...p.map((k) => D[Tr[k][0]][Tr[k][1]]));
      if (D[i][j] < mx) throw new Error('systems: not a minimum spanning tree');
      if (D[i][j] === mx) { alts.push([i, j]); p.forEach((k) => { if (D[Tr[k][0]][Tr[k][1]] === D[i][j]) tied.add(k); }); }
    }
    return { Tr, tied, alts };
  };
  /* the model drawn: the carnivore tree with the most tied edges (a stated rule; it must pick one alone) */
  const scored = set.models.map((m) => ({ m, e: edges(m) })).sort((a, b) => b.e.tied.size - a.e.tied.size);
  guard(STOP, scored[0].e.tied.size > scored[1].e.tied.size && scored[0].e.tied.size > 0, scored.map((x) => x.e.tied.size).join());
  const { m, e } = scored[0], n = m.D.length;
  guard(STOP, set.models.length === 3 && set.items.length === n, n);
  guard(STOP, e.Tr.length === n - 1 && e.alts.length >= 1 && m.D.every((r) => r.every((v) => Number.isSafeInteger(2 * v))));
  const name = (i) => set.items[i].replace(/^domestic /, '');
  const short = (id) => id.replace('claude-', '').replace(/-4-5$/, ' 4.5').replace(/-5$/, ' 5').replace(/^./, (c) => c.toUpperCase());
  /* one frame for both panels: equal scale on both axes, the layout's own coordinates */
  const xs = m.pts.map((p) => p[0]), ys = m.pts.map((p) => p[1]);
  const X0 = Math.min(...xs), X1 = Math.max(...xs), Y0 = Math.min(...ys), Y1 = Math.max(...ys);
  const BOXL = 112, BOXR = 318, BOXT = 74, BOXB = 222;
  const k = Math.min((BOXR - BOXL) / (X1 - X0), (BOXB - BOXT) / (Y1 - Y0));
  const cx = (BOXL + BOXR) / 2 - (X0 + X1) / 2 * k, cy = (BOXT + BOXB) / 2 + (Y0 + Y1) / 2 * k;
  const PX = (i) => [cx + m.pts[i][0] * k, cy - m.pts[i][1] * k];
  const mid = [(BOXL + BOXR) / 2, (BOXT + BOXB) / 2];
  /* labels pushed out from the layout's centre; a label that would cross another drops below its dot */
  const labels = () => { const L = [];
    for (let i = 0; i < n; i++) {
      const [x, y] = PX(i), a = Math.atan2(y - mid[1], x - mid[0]);
      let lx = x + Math.cos(a) * 10, ly = y + Math.sin(a) * 10 + 4;
      const anchor = Math.cos(a) > 0.3 ? 'start' : Math.cos(a) < -0.3 ? 'end' : 'middle';
      if (anchor === 'middle') ly = y + (Math.sin(a) > 0 ? 16 : -8);
      const w = name(i).length * ADV['t-ax'];
      const x0 = anchor === 'start' ? lx : anchor === 'end' ? lx - w : lx - w / 2;
      guard(STOP, x0 >= 4 && x0 + w <= PW - 4, 'the label ' + name(i) + ' would leave the drawing');
      L.push({ i, lx, ly, anchor, box: [x0, ly - 10, x0 + w, ly + 2] });
    }
    const hit = (a, b) => a.box[0] < b.box[2] && b.box[0] < a.box[2] && a.box[1] < b.box[3] && b.box[1] < a.box[3];
    for (let pass = 0; pass < 4; pass++) for (let a = 0; a < L.length; a++) for (let b = 0; b < a; b++) if (hit(L[a], L[b])) {
      const lo = L[a].ly >= L[b].ly ? L[a] : L[b]; lo.ly += 13; lo.box[1] += 13; lo.box[3] += 13; }
    return L.map((l) => t(l.lx, l.ly, name(l.i), 't-ax', l.anchor)).join('\n'); };
  const head = numword(n) + ' carnivores · ' + short(m.id) + '’s dissimilarities';
  /* each alternative edge against the tree edge of the same length it could replace, said as one choice */
  const ties = e.alts.map(([c, d]) => {
    const tw = e.Tr.find(([a, b], kk) => e.tied.has(kk) && m.D[a][b] === m.D[c][d] && (a === c || a === d || b === c || b === d));
    if (!tw) return name(c) + '–' + name(d) + ' ties the tree at ' + m.D[c][d];
    const v = [c, d].find((x) => tw.includes(x)), o1 = tw.find((x) => x !== v), o2 = [c, d].find((x) => x !== v);
    return name(v) + ': ' + name(o1) + ' or ' + name(o2) + ', both ' + m.D[c][d];
  });
  guard(STOP, ties.length <= 2 && ties.every((s) => fitsIn(s, 't-note', PW - 46)), ties.join(' | '));
  const usual = (() => {
    const out = [eyebrow(8, 14, 'as usually drawn'), t(14, 38, head, 't-ax')];
    /* a scatter's axes: the layout's own coordinates, as a default plotting call labels them */
    const tick = (v) => String(Math.round(v));
    const AXL = 34, AXB = BOXB + 30;
    out.push(line(AXL, AXB, PW - 8, AXB, 'stroke="var(--c-axis)" stroke-width="1"'), line(AXL, BOXT - 16, AXL, AXB, 'stroke="var(--c-axis)" stroke-width="1"'));
    for (const v of [-40, -20, 0, 20, 40]) { const x = cx + v * k; if (x > AXL + 10 && x < PW - 14) out.push(line(x, AXB, x, AXB + 4, 'stroke="var(--c-axis)" stroke-width="1"'), t(x, AXB + 17, tick(v), 't-ax', 'middle')); }
    for (const v of [-20, 0, 20]) { const y = cy - v * k; if (y > BOXT - 16 && y < AXB) out.push(line(AXL - 4, y, AXL, y, 'stroke="var(--c-axis)" stroke-width="1"'), t(AXL - 7, y + 4, tick(v), 't-ax', 'end')); }
    for (const [a, b] of e.Tr) out.push(line(...PX(a), ...PX(b), PLAIN));
    for (let i = 0; i < n; i++) out.push(dot(...PX(i), 3.2, FILL('--ink-2')));
    out.push(labels());
    return svg(PW, PH, 'As usually drawn: a scatter plot of ' + numword(n) + ' carnivores at the coordinates an eigendecomposition gave them, axes labelled dimension 1 and 2, and the minimum spanning tree of the model\'s dissimilarities drawn as ' + numword(e.Tr.length) + ' lines in one ink. The axes look like measurements and every edge looks equally certain; nothing says the picture is one placement among many, or that ' + numword(e.tied.size) + ' of the edges could be swapped for others of the same length.', out);
  })();
  const warrant = (() => {
    const out = [eyebrow(8, 14, 'in warrant'), t(14, 38, head, 't-note')];
    for (const [a, b] of e.alts) out.push(line(...PX(a), ...PX(b), GUIDE));
    e.Tr.forEach(([a, b], kk) => out.push(line(...PX(a), ...PX(b), W.attrs(e.tied.has(kk) ? W.CHOSEN : W.DECIDED, { width: e.tied.has(kk) ? 2 : 1.8 }))));
    for (let i = 0; i < n; i++) out.push(dot(...PX(i), 3.4, 'fill="var(--ink)"'));
    out.push(labels());
    /* each tie in words: the item both edges reach, the two it could hang from, and their one exact length */
    ties.forEach((s, q) => out.push(line(14, 252 + q * 15, 34, 252 + q * 15, W.attrs(W.CHOSEN, { width: 2 })), t(40, 256 + q * 15, s, 't-note')));
    out.push(mood(14, 254 + ties.length * 15 + 12, 'positions: a chosen picture (2-D holds ' + Math.round(100 * m.captured) + '%)', 'start'));
    return svg(PW, PH, 'In WARRANT: the same ' + numword(n) + ' carnivores with no axes, because the positions are a picture chosen by an eigendecomposition in floating point (it holds ' + Math.round(100 * m.captured) + '% of the structure, a computed share), said once in italic. The minimum spanning tree of the model\'s whole- and half-number dissimilarities is drawn edge by edge: ' + numword(e.Tr.length - e.tied.size) + ' edges are in every minimum tree and are solid, decided; ' + numword(e.tied.size) + ' are tied with an edge outside the tree of exactly the same length, so the tree drawn is one of several and those edges are dotted, chosen; the tied alternatives are faint guide lines, and each tie is said in words under the drawing (' + ties.join('; ') + '). What the figure shows: the tree is decided except where two exact lengths are equal.', out);
  })();
  return {
    id: 'embedding', title: 'An embedding with a tree', form: 'an embedding with decided edges', kind: 'record', record: REC, stop: STOP, usual, warrant,
    link: 'instruments/neural-geometry/',
    hides: 'The usual scatter gives an eigendecomposition’s picture axes, as if its coordinates were measured, and draws every edge of the tree alike. Here the positions are said once to be a chosen picture, an edge in every minimum tree is solid, and an edge that ties with another of exactly the same length is dotted, its alternative drawn faintly beside it.',
    rule: 'Draw a layout placed by a float solver without measurement axes and say once that it is a chosen picture; draw an edge that the numbers force solid, an edge picked among exact ties dotted with its length, and its tied alternatives as faint guides.',
    caption: short(m.id) + '’s dissimilarity judgements on ' + numword(n) + ' carnivores, each pair asked both ways round and averaged: of the three models’ carnivore trees, the one with the most tied edges. The tree is decided from the whole- and half-number table by the cycle property in exact comparisons; the positions come from the Gram matrix’s two leading eigenvectors in floating point. Labels drop the word “domestic”.',
  };
}

/* ================================================================ 4. a ladder of enclosures ==
   Published SVP-challenge records near the acceptance wall: the hall of fame prints the norm as a whole number, so each
   record's ratio to the Gaussian heuristic is known only to the window that rounding leaves. */
function ladder(guard) {
  guard = makeGuard(guard);
  const REC = 'instruments/pqc/out/audit.json';
  const A = rd(REC), WALL = 1.05, K = 10;
  const STOP = 'a record’s exact ratio leaves its own window, a published ratio leaves its window by more than its last printed digit, or a record other than the one drawn open has a window that crosses the wall';
  const rows = A.map((a) => ({ a, at: Number(a.atN), lo: Number(a.window[0]), hi: Number(a.window[1]) })).sort((x, y) => y.at - x.at);
  const open = rows.filter((r) => r.a.vN === 'ADMISSIBLE' && r.a.vHi !== 'ADMISSIBLE');
  guard(STOP, rows.every((r) => r.lo <= r.at && r.at <= r.hi && r.a.ratio >= r.lo - 5e-6 && r.a.ratio <= r.hi + 5e-6)
    && open.length === 1 && open[0] === rows[0] && rows[0].lo < WALL && WALL < rows[0].hi
    && rows.slice(1).every((r) => r.a.vN === 'ADMISSIBLE' && r.a.vHi === 'ADMISSIBLE' && r.hi < WALL), open.length);
  const shown = rows.slice(0, K), rest = rows.length - K;
  const O = { w: PW, h: PH, padL: 88, padR: 80, padT: TOP + 8, padB: 40, x0: 1.0482, x1: 1.0503, y0: 0, y1: K };
  guard(STOP, shown.every((r) => r.lo > O.x0 && r.hi < O.x1 && r.a.ratio > O.x0));
  const rowY = (f, i) => f.T + (i + 0.5) * (f.ph - 14) / K;
  const ax = (f) => CH.axes(f, { xTicks: [1.0485, 1.049, 1.0495].map((v) => ({ v, t: v.toFixed(4) })) });
  const lab = (r) => r.a.n + ' · ' + r.a.norm;
  const usual = (() => {
    const f = CH.frame(O), out = [ax(f), eyebrow(8, 14, 'as usually drawn')];
    out.push(line(f.px(WALL), f.T - 6, f.px(WALL), f.T + f.ph, PLAIN), t(f.px(WALL) + 4, f.T - 2, '1.05', 't-ax'));
    shown.forEach((r, i) => { const y = rowY(f, i); out.push(t(f.L - 8, y + 4, lab(r), 't-ax', 'end'), dot(f.px(r.a.ratio), y, 3.2, FILL('--ink-2'))); });
    out.push(t(14, f.T - 20, 'published ‖v‖ / GH · dimension · norm', 't-ax'));
    out.push(t(f.L + f.pw, f.T + f.ph + 34, 'ratio to the Gaussian heuristic', 't-ax', 'end'));
    return svg(PW, PH, 'As usually drawn: ten SVP-challenge records, labelled by dimension and printed norm, each a dot at its published ratio to the Gaussian heuristic, with a line at the acceptance wall of 1.05. Every dot sits left of the line, so every record looks accepted; the chart does not say that the printed norm is rounded, nor that the published ratio is a six-figure float.', out);
  })();
  const warrant = (() => {
    const f = CH.frame(O), h = PL.hatch(), out = [h.def, ax(f), eyebrow(8, 14, 'in warrant')];
    out.push(line(f.px(WALL), f.T - 6, f.px(WALL), f.T + f.ph, W.attrs(W.DECIDED, { width: 1.6 })), t(f.px(WALL) + 4, f.T - 2, 'wall 1.05', 't-note'));
    const VX = f.L + f.pw + 8;
    shown.forEach((r, i) => {
      const y = rowY(f, i);
      out.push(t(f.L - 8, y + 4, lab(r), 't-ax', 'end'));
      /* the window: the exact ratio for every true norm that prints as this one, an enclosure, solid */
      out.push(line(f.px(r.lo), y, f.px(r.hi), y, 'class="w-decided" stroke-width="2"'));
      out.push(line(f.px(r.lo), y - 4, f.px(r.lo), y + 4, 'class="w-decided" stroke-width="1.4"'), line(f.px(r.hi), y - 4, f.px(r.hi), y + 4, 'class="w-decided" stroke-width="1.4"'));
      /* the published six-figure ratio: a float with no bound, a dashed tick */
      out.push(line(f.px(r.a.ratio), y - 8, f.px(r.a.ratio), y + 8, W.attrs(W.COMPUTED, { width: 1.6 })));
      if (r === open[0]) { out.push(PL.voidRect(h, VX, y - 9, PW - 4 - VX, 18)); out.push(voidWords(VX + (PW - 4 - VX) / 2, y + 4, ['∅ open'])); }
      else out.push(t(VX + 2, y + 4, 'admissible', 't-note'));
    });
    /* the cut: the rows below it were left out by a rule, so the line that ends the ladder is dotted */
    out.push(line(14, f.T + f.ph - 7, PW - 6, f.T + f.ph - 7, W.attrs(W.CHOSEN, { width: 1.8 })));
    out.push(t(14, f.T + f.ph + 34, rest + ' farther away not drawn: cut chosen', 't-note'));
    /* the key, drawn with the marks themselves */
    const KY = f.T - 24;
    out.push(line(14, KY, 34, KY, 'class="w-decided" stroke-width="2"'), line(14, KY - 4, 14, KY + 4, 'class="w-decided" stroke-width="1.4"'), line(34, KY - 4, 34, KY + 4, 'class="w-decided" stroke-width="1.4"'));
    out.push(t(40, KY + 4, 'rounding window', 't-note'));
    out.push(line(170, KY - 8, 170, KY + 8, W.attrs(W.COMPUTED, { width: 1.6 })), t(178, KY + 4, 'published ratio', 't-note'));
    return svg(PW, PH, 'In WARRANT: the same ten records. Each record\'s window, the exact range of its ratio for every true norm that prints as the published whole number, is a solid bracket, decided; the published six-figure ratio is a short dashed tick, computed, a float printed without a bound. The wall at 1.05 is a solid line. ' + cap(numword(K - 1)) + ' windows end left of the wall and carry the word admissible; the nearest record, dimension ' + open[0].a.n + ' with norm ' + open[0].a.norm + ', has a window that crosses the wall, so whether it clears cannot be decided from what is published: its verdict cell is a hatched void marked open. A dotted line under the last row says the cut is chosen: the ' + rest + ' records farther from the wall are not drawn.', out);
  })();
  return {
    id: 'pqc-ladder', title: 'Records against a wall', form: 'a ladder of enclosures', kind: 'record', record: REC, stop: STOP, usual, warrant,
    link: 'instruments/pqc/',
    hides: 'The usual chart puts every published ratio left of the wall, so every record looks accepted. Each norm was printed rounded to a whole number, so each ratio is really a window; drawn as windows, ' + numword(K - 1) + ' clear the wall and one crosses it, and its verdict is a void, open until someone publishes the norm in full.',
    rule: 'Draw each value as the window its rounding leaves (a solid bracket) beside the printed figure (a dashed tick), put the threshold as a solid line, give each row its verdict word, and leave a hatched void where the window straddles the threshold.',
    caption: 'The ' + K + ' of ' + rows.length + ' audited SVP-challenge records nearest the 1.05 acceptance wall, by their exact ratio at the printed norm, from proved lattice determinants. A window’s ends are the exact ratios at the printed norm minus and plus one half. Admissible is decided in exact integers at the window’s upper end, so it holds for every true norm that prints as the published one; for the open record it holds at the printed norm and fails at the upper end.',
  };
}

/* ================================================================ 5. a matrix of verdict words ==
   Fifteen lattice claims, each with an exact answer, and what three models said about each. */
function matrix(guard) {
  guard = makeGuard(guard);
  const REC = 'instruments/wiring/eval/page.json';
  const P = rd(REC), RUNG = 'printed', MODELS = ['Opus 5', 'Sonnet 5', 'Haiku 4.5'];
  const STOP = 'the three models stop answering the same tasks in the same order, a grade stops matching its verdict against the exact answer, or a missing answer is drawn as a verdict';
  const by = (m) => P.results.filter((r) => r.model === m && r.rung === RUNG);
  const cols = MODELS.map(by), NT = cols[0].length;
  guard(STOP, cols.every((c) => c.length === NT && c.map((r) => r.truth).join() === cols[0].map((r) => r.truth).join())
    && cols.every((c) => c.every((r) => (r.cert === 1) === (r.verdict === r.truth) && (r.verdict === null) === (r.wf === 0))), NT);
  const WORD = { ADMISSIBLE: 'ADMISSIBLE', REFUSED: 'REFUSED', STRADDLES: 'STRADDLES', NEEDS_DATA: 'NEEDS DATA' };
  const truth = cols[0].map((r) => r.truth);
  guard(STOP, truth.every((v) => WORD[v]) && cols.every((c) => c.every((r) => r.verdict === null || WORD[r.verdict])));
  /* the WARRANT order: grouped by the exact answer, then by how many models disagree (a sort: chosen) */
  const GROUP = ['ADMISSIBLE', 'REFUSED', 'STRADDLES'];
  const miss = (i) => cols.filter((c) => c[i].verdict !== truth[i]).length;
  const order = truth.map((_, i) => i).sort((a, b) => GROUP.indexOf(truth[a]) - GROUP.indexOf(truth[b]) || miss(b) - miss(a) || a - b);
  const right = cols.map((c) => c.filter((r) => r.cert === 1).length), none = cols.map((c) => c.filter((r) => r.verdict === null).length);
  /* the alt text's one fact: of the answers that came and missed, most are NEEDS DATA */
  const missed = cols.flat().filter((r) => r.verdict !== null && r.verdict !== r.truth), hedged = missed.filter((r) => r.verdict === 'NEEDS_DATA').length;
  guard(STOP, 2 * hedged > missed.length, hedged + ' of ' + missed.length);
  /* columns: the task label, the exact answer (its longest word), then three model columns wide enough for ≠ and a word */
  const L = 34, EW = 76, CW = 96, RT = 60, RH = (PH - RT - 26) / NT;
  const colX = (j) => (j === 0 ? L + EW / 2 : L + EW + CW * (j - 1) + CW / 2);
  guard(STOP, L + EW + 3 * CW <= PW - 2 && fitsIn('≠ NEEDS DATA', 't-note', CW - 8) && fitsIn('ADMISSIBLE', 't-note', EW - 4));
  const usual = (() => {
    const out = [eyebrow(8, 14, 'as usually drawn'), t(14, 36, 'graded correct, per task', 't-ax')];
    MODELS.forEach((m, j) => out.push(t(colX(j + 1), RT - 8, m, 't-ax', 'middle')));
    for (let i = 0; i < NT; i++) {
      const y = RT + i * RH;
      out.push(t(L - 6, y + RH / 2 + 4, String(i + 1), 't-ax', 'end'));
      cols.forEach((c, j) => out.push(rect(colX(j + 1) - 30, y + 1.5, 60, RH - 3, c[i].cert === 1 ? FILL('--ink-3') : 'fill="none" stroke="var(--ink-5)" stroke-width="1"')));
    }
    cols.forEach((c, j) => out.push(t(colX(j + 1), RT + NT * RH + 18, right[j] + '/' + NT, 't-ax', 'middle')));
    return svg(PW, PH, 'As usually drawn: a grid of fifteen tasks by three models, Opus 5, Sonnet 5 and Haiku 4.5, each cell filled where the answer was graded correct and empty where it was not, with totals of ' + right.join(', ') + ' out of ' + NT + ' underneath. The grid does not say what each model answered, what the right answer was, or that ' + numword(none.reduce((a, b) => a + b, 0)) + ' empty cells are answers that never came, counted as wrong.', out);
  })();
  const warrant = (() => {
    const h = PL.hatch(), out = [h.def, eyebrow(8, 14, 'in warrant'), t(14, 36, 'what each said · the exact answer first', 't-note')];
    out.push(t(colX(0), RT - 8, 'exact', 't-ax', 'middle'));
    MODELS.forEach((m, j) => out.push(t(colX(j + 1), RT - 8, m, 't-ax', 'middle')));
    order.forEach((i, r) => {
      const y = RT + r * RH, by0 = y + RH / 2 + 4;
      if (r > 0 && truth[order[r - 1]] !== truth[i]) out.push(line(14, y, PW - 4, y, HAIR));
      out.push(t(L - 4, by0, '#' + (i + 1), 't-note', 'end'));
      out.push(CH.txt(colX(0), by0, WORD[truth[i]], 't-note gx-f2', 'middle'));   /* .gx-f1/.gx-f2: the page's ink classes (no inline style) */
      cols.forEach((c, j) => {
        const v = c[i].verdict, x = colX(j + 1);
        if (v === null) { out.push(PL.voidRect(h, x - CW / 2 + 3, y + 1, CW - 6, RH - 2)); out.push(voidWords(x, by0, ['∅ no answer'])); return; }
        const s = (v === truth[i] ? '' : '≠ ') + WORD[v], w = s.length * ADV['t-note'];
        out.push(CH.txt(x, by0, s, v === truth[i] ? 't-note' : 't-note gx-f1', 'middle'));
        /* a model's answer is a claim it made: computed, underlined dashed, as a number in text is */
        out.push(line(x - w / 2, by0 + 2.5, x + w / 2, by0 + 2.5, W.attrs(W.COMPUTED, { width: 1 })));
      });
    });
    out.push(line(6, RT + 2, 6, RT + NT * RH - 2, W.attrs(W.CHOSEN, { width: 1.8 })));
    out.push(t(14, RT + NT * RH + 18, 'rows sorted by the exact answer: order chosen', 't-note'));
    return svg(PW, PH, 'In WARRANT: the same fifteen tasks, each row keeping its task number, the rows grouped by the exact answer (admissible, refused, straddles) and then by how many models disagree; a dotted line down the left edge says the order is chosen. The first column is the exact answer, decided, in plain words. Each model cell holds the model\'s own verdict word, underlined dashed because a model\'s answer is a claim it made, computed; a word that differs from the exact answer is brighter and carries ≠. A model that returned no verdict has a hatched void with the words no answer, not an empty cell. What the figure shows: ' + hedged + ' of the ' + missed.length + ' wrong answers are NEEDS DATA, said of claims the arithmetic decides.', out);
  })();
  return {
    id: 'verdict-matrix', title: 'A matrix of verdicts', form: 'a matrix of verdict words', kind: 'record', record: REC, stop: STOP, usual, warrant,
    link: 'instruments/lattice-claims/',
    hides: 'The usual grid fills a cell for right and leaves it empty for wrong, so a wrong verdict, a hedge and an answer that never came all look the same. Here each cell holds the word the model said, underlined dashed as a claim, beside the exact answer; a missing answer is a void, and the row order, a choice made to group the answers, is drawn dotted.',
    rule: 'Put the decided answer in the first column, write each claim’s own verdict word in its cell (underlined dashed, marked ≠ where it differs), leave a hatched void where no answer came, and when you sort the rows keep their labels and draw the order dotted.',
    caption: 'The ' + numword(NT) + ' tasks of the “printed” level of lattice-claims: each is a claim that a lattice vector clears the 1.05 wall of the SVP challenge, with its norm printed as a whole number, and has an exact answer: ADMISSIBLE, REFUSED (it does not clear), or STRADDLES (the rounding window crosses the wall, so the printed digits cannot decide). ' + MODELS.join(', ').replace(/, ([^,]*)$/, ' and $1') + ' each judged the same ' + numword(NT) + ', once. REFUSED is the environment’s verdict word; the hatched void is a missing answer.',
  };
}

/* ================================================================ 6. lines of descent ==
   Machinidae's era 0, run 1: three arms bred from one hand-written founder at the same budget of births. Read from the
   run file the Machinidae zone ships (site/machinidae/, a byte copy of its own build), checked against the zone's pin. */
function descent(guard) {
  guard = makeGuard(guard);
  const REC = 'site/machinidae/data/era-0-1.json.gz', PIN = 'corpus/zones/machinidae.json';
  const STOP = 'the run file stops matching the zone’s pin, a best score so far stops being the best certified birth up to its generation, a champion stops descending from the founder, or the arms stop having the same births in every generation';
  const pin = rd(PIN).files['data/era-0-1.json.gz'];
  guard(STOP, pin && pin.sha256 === sha(REC), 'pin');
  const D = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(ROOT, REC))).toString('utf8'));
  const Cc = D.cols, NB = Cc.arm.length, LIVED = D.fates.indexOf('lived');
  const nm = (i) => D.arms[Cc.arm[i]] + '-' + Cc.gen[i] + '-' + Cc.slot[i];
  const GENS = D.trajectory[D.arms[0]].length - 1;
  const arm = D.arms.map((a, ai) => {
    const mine = []; for (let i = 0; i < NB; i++) if (Cc.arm[i] === ai) mine.push(i);
    const perGen = new Map(); for (const i of mine) perGen.set(Cc.gen[i], (perGen.get(Cc.gen[i]) || 0) + 1);
    /* the best certified score up to each generation, re-derived from the births */
    const best = [D.founder.fit]; for (let g = 1; g <= GENS; g++) { let b = best[g - 1]; for (const i of mine) if (Cc.gen[i] === g && Cc.fate[i] === LIVED && Cc.fit[i] > b) b = Cc.fit[i]; best.push(b); }
    const top = Math.max(...mine.filter((i) => Cc.fate[i] === LIVED).map((i) => Cc.fit[i]));
    const tied = mine.filter((i) => Cc.fate[i] === LIVED && Cc.fit[i] === top).sort((x, y) => Cc.seq[x] - Cc.seq[y]);
    const champ = mine.find((i) => nm(i) === D.champions[a]);
    const line = []; for (let j = champ; j >= 0; j = Cc.parent[j]) line.push(j);
    return { a, ai, mine, perGen, best, top, tied, champ, line: line.reverse() };
  });
  guard(STOP, arm.every((r) => r.best.every((v, g) => v === D.trajectory[r.a][g]) && r.tied[0] === r.champ && Cc.fit[r.champ] === r.top
    && r.line.every((j, k) => Cc.arm[j] === r.ai && (k === 0 ? Cc.parent[j] === -1 : Cc.gen[j] > Cc.gen[r.line[k - 1]]))
    && r.perGen.size === GENS && [...r.perGen.values()].every((v) => v === arm[0].perGen.get(1))), arm.map((r) => r.tied.length).join());
  const PER = arm[0].perGen.get(1), BUDGET = PER * GENS;
  const A = Object.fromEntries(arm.map((r) => [r.a, r]));
  guard(STOP, A.lineage.tied.length === 1 && A.rules.tied.length > 1 && A.aleator.tied.length > 1 && A.aleator.mine.every((i) => Cc.parent[i] === -1)
    && A.aleator.best.slice(Cc.gen[A.aleator.champ]).every((v) => v === A.aleator.top)
    && A.rules.top > A.lineage.top && A.lineage.top > A.aleator.top, 'the story');
  /* the record ships a score as an integer in millionths: printed at that resolution, nothing rounded */
  const S = 1e6, fmt = (v) => (v / S).toFixed(6);
  const O = { w: PW, h: PH, padL: 46, padR: 104, padT: TOP, padB: 40, x0: 0, x1: GENS, y0: 0.16, y1: 0.21 };
  const ax = (f) => CH.axes(f, { yTicks: [0.17, 0.18, 0.19, 0.2].map((v) => ({ v, t: v.toFixed(2) })), xTicks: [0, 25, 50, 75, 100].map((v) => ({ v, t: String(v) })) });
  /* the best-so-far as steps; from the founder's level (fromFounder) or from the arm's first certified improvement */
  const steps = (f, r, fromFounder) => { const g0 = r.best.findIndex((v) => v !== r.best[0]);
    const p = fromFounder ? [[f.px(0), f.py(r.best[0] / S)], [f.px(g0), f.py(r.best[0] / S)]] : [];
    p.push([f.px(g0), f.py(r.best[g0] / S)]);
    for (let g = g0 + 1; g <= GENS; g++) if (r.best[g] !== r.best[g - 1]) p.push([f.px(g), f.py(r.best[g - 1] / S)], [f.px(g), f.py(r.best[g] / S)]);
    p.push([f.px(GENS), f.py(r.best[GENS] / S)]); return p; };
  const ID = { lineage: { w: 2.2, o: 1 }, rules: { w: 1.8, o: 0.8 }, aleator: { w: 1.4, o: 0.6 } };
  const shape = (a, x, y, r, attrs) => a === 'lineage' ? dot(x, y, r, attrs) : a === 'rules' ? rect(x - r * 0.9, y - r * 0.9, r * 1.8, r * 1.8, attrs)
    : '    <path d="M' + f1(x) + ',' + f1(y - r * 1.2) + 'L' + f1(x + r * 1.2) + ',' + f1(y) + 'L' + f1(x) + ',' + f1(y + r * 1.2) + 'L' + f1(x - r * 1.2) + ',' + f1(y) + 'Z" ' + attrs + '/>';
  /* the right-hand labels, spaced so the two near the top never touch */
  const LX = (f) => f.L + f.pw + 8;
  guard(STOP, arm.every((r) => fitsIn('1 of ' + r.tied.length + ' tied', 't-note', O.padR - 20)), 'the tie words no longer fit beside the plot');
  /* rules ends highest and the lineage just under it: rules' words go above its end, the lineage's below */
  const ends = (f) => ({ rules: f.py(A.rules.top / S) - 16, lineage: f.py(A.lineage.top / S) + 15, aleator: f.py(A.aleator.top / S) + 4 });
  const usual = (() => {
    const f = CH.frame(O), out = [ax(f), eyebrow(8, 14, 'as usually drawn')];
    for (const r of arm) out.push(poly(steps(f, r, true), PLAIN));
    const ys = ends(f);
    for (const r of arm) out.push(t(LX(f), ys[r.a], r.a, 't-ax'));
    out.push(t(f.L, f.T - 12, 'best training score, by generation', 't-ax'));
    return svg(PW, PH, 'As usually drawn: three step lines in one ink, the best training score so far of the lineage, rules and aleator arms over ' + GENS + ' generations, all starting from the same value, the rules arm ending highest at ' + fmt(A.rules.top) + ', the lineage at ' + fmt(A.lineage.top) + ' and aleator flat from generation ' + Cc.gen[A.aleator.champ] + ' at ' + fmt(A.aleator.top) + '. It reads as a race; it does not say where the start came from, which births each line descends through, or that two of the winners are one of many tied births.', out);
  })();
  const warrant = (() => {
    const f = CH.frame(O), out = [ax(f), eyebrow(8, 14, 'in warrant')];
    out.push(line(f.px(0), f.py(D.founder.fit / S), f.px(GENS), f.py(D.founder.fit / S), W.attrs(W.CHOSEN, { width: 1.8 })));
    out.push(mood(f.px(28), f.py(D.founder.fit / S) - 6, 'given ' + D.founder_name + ', written by hand'));
    /* until a child beats the founder an arm's best is the founder's own score: the dotted line carries it */
    for (const r of arm) out.push(poly(steps(f, r, false), W.attrs(W.DECIDED, { width: ID[r.a].w }).replace('fill="none"', 'fill="none" stroke-opacity="' + ID[r.a].o + '"')));
    /* the champion's line of descent: every ancestor a knot, from the record's parent pointers */
    for (const r of arm) for (const j of r.line.slice(0, -1)) out.push(shape(r.a, f.px(Cc.gen[j]), f.py(Cc.fit[j] / S), 2.3, 'class="w-decided" fill="var(--ink)" fill-opacity="' + ID[r.a].o + '"'));
    const ys = ends(f);
    for (const r of arm) {
      const x = f.px(Cc.gen[r.champ]), y = f.py(Cc.fit[r.champ] / S);
      out.push(shape(r.a, x, y, 3.6, 'fill="var(--ink)" stroke="var(--ink)" stroke-width="1"'));
      if (r.tied.length > 1) out.push(dot(x, y, 7.5, W.attrs(W.CHOSEN, { width: 1.6 })));
      out.push(shape(r.a, LX(f) + 3, ys[r.a] - 4, 3, 'fill="var(--ink)" fill-opacity="' + ID[r.a].o + '"'), t(LX(f) + 10, ys[r.a], r.a, 't-ax'));
      out.push(t(LX(f) + 10, ys[r.a] + 13, r.tied.length > 1 ? '1 of ' + r.tied.length + ' tied' : 'unique', 't-note'));
    }
    out.push(t(f.px(60), f.py(A.aleator.top / S) + 16, 'aleator: no heredity', 't-note', 'middle'));
    out.push(t(f.L, f.T - 12, PER + ' births a generation, every arm', 't-note'));
    return svg(PW, PH, 'In WARRANT: the same three arms, each at ' + PER + ' births a generation (' + BUDGET.toLocaleString('en-US') + ' each). The founder ' + D.founder_name + ' was written by hand, so its score is a dotted line across the plot, chosen, named in italic. Each arm\'s best certified score so far is a solid step line, decided, from the generation one of its own births first beat the founder; before that the founder\'s dotted line carries it. The arms are told apart by weight and by shape: the lineage a circle, rules a square, aleator a diamond. The knots on each line are the births its champion descends from, read from the record\'s parent pointers: the lineage\'s champion descends through ' + numword(A.lineage.line.length - 1) + ' earlier births, the rules arm\'s through ' + numword(A.rules.line.length - 1) + ', aleator\'s through none, because its children are each one fresh edit of the founder. The lineage\'s champion is the only birth at its score, a plain knot; the rules arm\'s is the earliest of ' + A.rules.tied.length + ' births tied at the top score and aleator\'s the earliest of ' + A.aleator.tied.length + ', so each is ringed dotted, chosen. What the figure shows: two of the three winners were picked by birth order among equals.', out);
  })();
  return {
    id: 'machinidae-descent', title: 'Lines of descent', form: 'arms over generations, with lines of descent', kind: 'record', record: REC, stop: STOP, usual, warrant,
    link: 'machinidae/era-0.html',
    hides: 'The usual chart is a race of three curves from one start. Here the start is a program someone wrote, drawn dotted; each curve carries the births its winner descends from, read from the parent pointers; and a winner picked by birth order among births tied at the top score is ringed dotted, with how many it was picked from.',
    rule: 'Draw each arm’s best-so-far as a solid step line told apart by shape and weight, put the hand-made starting point as a dotted line named in italic, mark the winner’s ancestors as knots from the record’s parent pointers, and ring a winner that was picked from a tie dotted, saying from how many.',
    caption: 'Machinidae, era 0, run 1: from the founder ' + D.founder_name + ', the lineage (a model’s edits, under selection, with heredity), Aleator (the same model, every child a fresh edit of the founder) and blind rules (selection with a page of fixed edits, no model), ' + PER + ' births each per generation for ' + GENS + ' generations. A birth’s training score is judged exactly on ' + numword(D.instances.length) + ' instances; the record ships it to six decimals, and the champion is the earliest birth at the arm’s best score.',
  };
}

module.exports = {
  topic: { id: 'systems', title: 'Geometry, networks and systems',
    lead: 'Structures rather than series: a wiring diagram, a point in a simplex, an embedding with its tree, a ladder of enclosures against a wall, a matrix of verdicts, and an evolution experiment’s lines of descent. Each is read from an instrument’s own record and drawn twice. In a structure the standing sits on the parts: an edge, a port, a window, a cell, a winner.' },
  scenes: [wiring, simplex, embedding, ladder, matrix, descent],
};
