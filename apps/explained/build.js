/* build.js — the easy read: one scrolling page that explains the method paper the way a good science channel would —
   big pictures, a few things to touch, every number real.

     site/explained/index.html     the page: body.html, page.css and page.js with {{KEYS}} filled from the records, rendered
                                   through design/template.js (the house tokens, sheet, nav and footer) with the page's own
                                   css and script — the house grammar, extended for a scrolling story

   EVERY NUMBER ON THE PAGE IS READ HERE, AT BUILD TIME, from the same gated sources the papers read: the method paper's
   macro file (tools/build-paper-numbers.js, refuse-on-drift from the records), the register's, the Riemann companion's
   (tools/paper-numbers/riemann-finite-layer.js, a third implementation held to claimbox's certificates), the self-audit's
   mutation record, the kissing wave's record and the kissing ledger. The page's interactive pieces compute in the browser
   in exact rational arithmetic over BigInt; the window widget's matrix is computed here, exactly, from the definitions
   (the same chain the companion's generator re-derives) and embedded as rationals. A missing or shapeless number refuses
   the build. Nothing on the page is typed.

   usage: node apps/explained/build.js          (make site runs it; make page R=apps/explained for the edit loop)
   apps/explained · cert-machine                                                                                      MIT */
'use strict';const fs = require('fs');
const path = require('path');
const { ROOT, V, flatten, fill, need, git, T, numword } = require('./records.js');   /* the one reader of the records; shared with the sibling story pages */
const SITE = path.join(ROOT, 'site', 'explained');

/* ---- the window widget's matrix: degree-4 even windows, D₁ at fifteen terms, exactly (apps/explained/window.js, shared with v1) ---- */
require('./window.js');
/* the window curve is the reader's pick, drawn in float: CHOSEN, dotted, whatever the verdict on P (WARRANT rule 1 — the
   curve used to turn dashed when the window was refused, a verdict carried by the standing channel) */
{ const WR = require(path.join(ROOT, 'playground', 'warrant.js'));
  V.CHOSEN_ATTRS = WR.attrs(WR.CHOSEN, { width: 2 }); V.WIN_LEGEND = WR.legendHtml({ compact: true, from: V.CHOSEN_ATTRS }); }   /* the window draws one mark, chosen (R20) */

/* ---- a few more, for the cold open and the instruments ---- */
/* the route of a claim, the house flow figure (design/components.js), read on click */
const C = require(path.join(ROOT, 'design', 'components.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
/* each station's outline is what the station IS (WARRANT v2): the sentence is a claim someone made, COMPUTED and dashed;
   the reading is one of the readings the bytes admit (Act II: the digits as printed, or the doubles they denote), named in
   the object, CHOSEN and dotted; the grammar's match, the pin, the decision and the word are exact, DECIDED and solid */
const NODES = [
  { k: 'sentence', v: 'as printed', t: 'The sentence, as the source prints it', d: 'A claim is read at the head of its sentence or not at all: the bar as the exact rational its digits mean, the relation, the quantity. A hedge, a leading quantifier or a number nobody printed is refused with the rule. Until it is decided it is a claim someone made.', role: 'dep', standing: W.COMPUTED },
  { k: 'grammar', v: 'closed list', t: 'A closed grammar of claim shapes', d: 'A bound, an absolute bound with a finite range, a value printed to its digits and cut off, a constant published rounded, an exact identity, a kissing count, a tensor decomposition. Nothing else; no model, no guess. A sentence matches a shape or is refused.', role: 'dep', standing: W.DECIDED },
  { k: 'object', v: 'the reading', t: 'The object: the reading written down', d: 'The line of the source that prints the claim and the file\'s digest; the pin of the bytes and how they were decoded; the predicate; the hypotheses under which the predicate is the claim; the shape a witness against it would take. The reading is one of those the bytes admit, chosen and named, so the verdict says which.', role: 'sig', standing: W.CHOSEN },
  { k: 'bytes', v: 'pinned', t: 'The claimant\'s bytes, pinned by sha256', d: 'The data the claim is about, as the claimant published it, held to its digest. A file that does not match is refused before it is read. The reading of the bytes is part of the verdict.', role: 'dep', standing: W.DECIDED },
  { k: 'decide', v: 'exact', t: 'Decided over exact rationals', d: 'The predicate is evaluated over the bytes in exact arithmetic, or in outward-rounded intervals with explicit tail bounds. Two checkers that share no code decide every object; a floating-point comparison is a screen, never an authority.', role: 'held', standing: W.DECIDED },
  { k: 'word', v: 'with witness', t: 'One of three words, with what justifies it', d: 'Certified with the certificate and its falsifier; refuted with the violating input; refused with the reason and, where there is one, the threshold that would change the word.', role: 'held', standing: W.DECIDED }
];
const nodes = NODES.map((n, i) => Object.assign({ x: 20 + i * 148, y: 34, w: 124, h: 52 }, n));
const edges = []; for (let i = 0; i < nodes.length - 1; i++) { const a = nodes[i], b = nodes[i + 1]; edges.push({ d: 'M' + (a.x + a.w) + ' 60 L' + b.x + ' 60' }); }
V.FLOW = C.flow({ w: 920, h: 120, alt: 'the route of a claim: sentence, grammar, object, bytes, decide, word', readout: { k: 'The route of a claim', d: 'Click a station to read what happens there. A station\'s outline is what the station is: the claimant\'s sentence dashed, the reading dotted, the exact steps solid. The dots travelling the arrows are a picture of the flow; nothing else on this figure moves.' }, nodes, edges, caption: 'The claim-machine translates; cert-machine decides. Every station leaves a record.' })
  .replace('<svg ', '<div class="flow-scroll"><svg ').replace('</svg>', '</svg></div>');
need(V.FLOW.includes('flow-scroll'), 'the flow figure did not wrap');

/* ---- the cold open's stage, a figure: the page's hero (D12), its motion under D13 ----
   It was HTML and CSS motion labelled as only a picture. Now every mark is the house grammar's, drawn by
   playground/warrant.js: a claim as published runs into the one DECIDE box on a COMPUTED (dashed) route, because someone
   printed it and nothing has decided it; what leaves the box is DECIDED and solid; a refusal leaves nothing, so its route
   out is the void, hatched; each word wears the house chip (certified FILL, refuted OUTLINE, refused hollow and
   square-cornered, never a dash). The 605's worst pair is the one counterexample a claim here exhibits, so its × is drawn
   beside the word at the figure's scale, the first × on the page (tools/check-wiring.js). The claims, the words and the
   witness are records.js STAGE, read through design/record.js; each route carries its record's pointer (data-rec), which
   tools/check-marks.js follows. A FRAME IS A PAGE: the drawing is whole and still; the only motion is a point translated
   along each route (SMIL animateMotion, as the route of a claim below), hidden in the claim's word or in the box when it
   rests, shown only when motion is not reduced. No dash moves, no standing changes, no value travels. */
{ const { STAGE } = require('./records.js');
  const f = (v) => (+v).toFixed(1);
  const txt = (x, y, s, a) => '      <text x="' + f(x) + '" y="' + f(y) + '"' + (a || '') + '>' + C.esc(s) + '</text>';
  const used = new Set();
  /* a cubic from (a, ya) to (b, yb) with horizontal tangents; straight when the two heights agree */
  const curve = (a, ya, b, yb) => (Math.abs(ya - yb) < 0.05 ? 'M' + f(a) + ',' + f(ya) + 'L' + f(b) + ',' + f(yb)
    : 'M' + f(a) + ',' + f(ya) + 'C' + f(a + (b - a) / 2) + ',' + f(ya) + ' ' + f(b - (b - a) / 2) + ',' + f(yb) + ' ' + f(b) + ',' + f(yb));
  const cubicLen = (a, ya, b, yb) => { let L = 0, px = a, py = ya; for (let k = 1; k <= 64; k++) { const t = k / 64, u = 1 - t, m = (a + b) / 2;
    const x = u * u * u * a + 3 * u * u * t * m + 3 * u * t * t * m + t * t * t * b, y = u * u * u * ya + 3 * u * u * t * ya + 3 * u * t * t * yb + t * t * t * yb;
    L += Math.hypot(x - px, y - py); px = x; py = y; } return L; };
  /* greedy wrap at spaces for the phone's claim column */
  const wrap = (s, n) => { const out = []; let line = ''; for (const w of String(s).split(' ')) { if (line && (line + ' ' + w).length > n) { out.push(line); line = w; } else line = line ? line + ' ' + w : w; } if (line) out.push(line); return out; };
  const wit = STAGE.find((s) => s.witness);
  need(wit && STAGE.filter((s) => s.witness).length === 1, 'the stage exhibits one counterexample, the 605\'s pair');
  const WI = wit.witness, pair = 'points ' + WI.i.v + ' and ' + WI.j.v;
  const CYCLE = 9.6, GAP_T = CYCLE / STAGE.length;

  function stage(o) {
    const H0 = o.top, rows = [];
    let y = H0;
    for (const s of STAGE) {
      const lines = o.wrap ? wrap(s.claim, o.wrap) : [s.claim];
      const h = Math.max(lines.length * o.lh, o.ch), band = s.witness && o.band ? o.band : 0;
      rows.push({ s, lines, y: y + h / 2 }); y += h + band + o.gap;
    }
    const H = y - o.gap + o.bottom;
    const cy = (rows[0].y + rows[rows.length - 1].y) / 2;
    for (const r of rows) r.e = cy + (r.y - cy) * o.k;
    const boxT = Math.min(...rows.map((r) => r.e)) - o.pad, boxB = Math.max(...rows.map((r) => r.e)) + o.pad;
    const boxR = o.boxL + o.boxW, chipR = o.chipL + o.chipW, x0 = o.claimR + o.lead;
    const P = [C.svgOpen({ w: o.w, h: Math.round(H), alt: 'Six claims, as published, each drawn on a dashed route into one box labelled decide and out of it as its word: '
      + STAGE.map((s) => s.claim + ', ' + s.word + (s.rule ? ' (' + s.rule + ')' : '') + (s.witness ? ', its witness ' + pair + ', closer than 60°' : '')).join('; ') + '.' })];
    P.push('      <defs><pattern id="' + o.id + '-void" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="var(--ink-4)" stroke-width="1.2"/></pattern></defs>');
    /* the two headings, over the claims' right edge and the words' left */
    P.push(txt(o.claimR, o.head, 'CLAIMS, AS PUBLISHED', ' text-anchor="end" font-size="' + o.fh + '" letter-spacing=".12em" fill="var(--ink-4)"'));
    P.push(txt(o.wordsX, o.head, 'WORDS, WITH WITNESSES', ' text-anchor="' + o.wordsAnchor + '" font-size="' + o.fh + '" letter-spacing=".12em" fill="var(--ink-4)"'));
    /* the routes: into the box COMPUTED, out of it DECIDED, or the void where nothing came out */
    for (const r of rows) {
      P.push('      <path d="' + curve(x0, r.y, o.boxL, r.e) + '" ' + W.attrs(W.COMPUTED, { width: 1.5, rec: r.s.claimRec }) + '/>'); used.add(W.COMPUTED);
      if (r.s.word === 'refused') { P.push('      <path d="' + curve(boxR, r.e, o.chipL - 4, r.y) + '" ' + W.attrs(W.REFUSED, { rec: r.s.rec }) + ' stroke="url(#' + o.id + '-void)" stroke-width="7"/>'); used.add(W.REFUSED); }
      else { P.push('      <path d="' + curve(boxR, r.e, o.chipL, r.y) + '" ' + W.attrs(W.DECIDED, { width: 1.5, rec: r.s.rec }) + '/>'); used.add(W.DECIDED); }
    }
    /* the points, under the box and the words that hide them at rest: one per claim, a stride apart, at one speed */
    const L = rows.map((r) => cubicLen(x0, r.y, o.boxL, r.e) + (r.s.word === 'refused' ? o.boxW / 2 : o.boxW + cubicLen(boxR, r.e, o.chipL, r.y) + o.chipW / 2));
    const v = Math.max(...L) / (CYCLE / 2);
    rows.forEach((r, k) => {
      const d = curve(x0, r.y, o.boxL, r.e) + 'L' + f(r.s.word === 'refused' ? o.boxL + o.boxW / 2 : boxR) + ',' + f(r.e)
        + (r.s.word === 'refused' ? '' : curve(boxR, r.e, o.chipL, r.y).replace(/^M[^LC]+/, '') + 'L' + f(o.chipL + o.chipW / 2) + ',' + f(r.y));
      const frac = Math.min(0.95, L[k] / v / CYCLE);
      P.push('      <circle class="stg-f" r="' + o.dot + '"><animateMotion dur="' + CYCLE + 's" begin="' + (k ? (k * GAP_T - CYCLE).toFixed(1) : '0') + 's" repeatCount="indefinite" calcMode="linear" keyPoints="0;1;1" keyTimes="0;' + frac.toFixed(3) + ';1" path="' + d + '"/></circle>');
    });
    /* the box: a ground, then its DECIDED outline, then its name */
    P.push('      <rect x="' + f(o.boxL) + '" y="' + f(boxT) + '" width="' + f(o.boxW) + '" height="' + f(boxB - boxT) + '" rx="6" fill="var(--surface)"/>');
    P.push('      <rect x="' + f(o.boxL) + '" y="' + f(boxT) + '" width="' + f(o.boxW) + '" height="' + f(boxB - boxT) + '" rx="6" ' + W.attrs(W.DECIDED, { width: 1.5 }) + '/>');
    const bx = o.boxL + o.boxW / 2, by = (boxT + boxB) / 2;
    P.push(txt(bx, by + o.fb * 0.36, 'DECIDE', ' text-anchor="middle" font-size="' + o.fb + '" font-weight="600" letter-spacing=".16em" fill="var(--ink)"' + (o.vertical ? ' transform="rotate(-90 ' + f(bx) + ' ' + f(by) + ')"' : '')));
    /* the claims, as printed; the words, as the house chips */
    for (const r of rows) {
      r.lines.forEach((ln, li) => P.push(txt(o.claimR, r.y + (li - (r.lines.length - 1) / 2) * o.lh + o.fc * 0.36, ln, ' text-anchor="end" font-size="' + o.fc + '" fill="var(--ink-2)"')));
      const t = r.y - o.ch / 2, w = r.s.word;
      const chip = w === 'certified' ? 'rx="' + o.ch / 2 + '" fill="var(--ink)"' : w === 'refuted' ? 'rx="' + o.ch / 2 + '" fill="var(--sunk)" stroke="var(--rule-strong)" stroke-width="1"' : 'rx="4" fill="var(--sunk)" stroke="var(--ink-4)" stroke-width="1"';
      P.push('      <rect x="' + f(o.chipL) + '" y="' + f(t) + '" width="' + f(o.chipW) + '" height="' + o.ch + '" ' + chip + '/>');
      P.push(txt(o.chipL + o.chipW / 2, r.y + o.fw * 0.36, w.toUpperCase(), ' text-anchor="middle" font-size="' + o.fw + '" font-weight="600" letter-spacing=".1em" fill="' + (w === 'certified' ? 'var(--paper)' : 'var(--ink-3)') + '"'));
      if (!r.s.witness) continue;
      /* THE WITNESS: the house ×, beside the word, at a stroke no thinner than the decided lines; its words beside it */
      P.push('      ' + W.witnessMark(chipR + o.wxGap, r.y, { size: o.wx, width: 2.4 }));
      const [wx, wy, wa] = o.witnessAt(r, chipR);
      P.push(txt(wx, wy, pair, ' text-anchor="' + wa + '" font-size="' + o.fc + '" fill="var(--ink)"'));
      P.push(txt(wx, wy + o.lh, 'closer than 60°', ' text-anchor="' + wa + '" font-size="' + (o.fc - 1) + '" fill="var(--ink-3)"'));
    }
    P.push(C.svgClose);
    return P.join('\n');
  }
  /* the desk: one row a claim, the routes drawn in to one small box and out again (k: how far they converge) */
  const WIDE = stage({ id: 'stg-w', w: 900, top: 40, bottom: 18, gap: 14, lh: 15, ch: 20, band: 0, k: 0.3, pad: 16,
    claimR: 304, lead: 8, boxL: 396, boxW: 112, chipL: 590, chipW: 90, head: 20, fh: 10.5, fb: 11, fc: 12, fw: 10, dot: 3,
    wordsX: 590, wordsAnchor: 'start', wx: 6, wxGap: 16, witnessAt: (r, chipR) => [chipR + 32, r.y - 2, 'start'] });
  /* the phone: the same figure at a phone's scale, the box a column every route crosses straight, the claims wrapped, the
     witness's words in a band opened under its row (the gsm8k strip's form) */
  const NARROW = stage({ id: 'stg-n', w: 320, top: 32, bottom: 12, gap: 10, lh: 13, ch: 20, band: 30, k: 1, pad: 12, wrap: 21,
    claimR: 138, lead: 6, boxL: 162, boxW: 24, chipL: 212, chipW: 78, head: 14, fh: 9, fb: 9.5, fc: 10.5, fw: 9.5, dot: 2.5, vertical: true,
    wordsX: 314, wordsAnchor: 'end', wx: 5, wxGap: 12, witnessAt: (r) => [314, r.y + 10 + 14, 'end'] });
  /* the caption: what the marks mean, the witness's numbers read from the record (W.val: the pointer goes in the span) */
  const RP = (x) => ({ path: x.path, ptr: x.ptr });
  const legend = W.legendHtml({ compact: true, from: [...used] });   /* the standings the figure's marks use (R20) */
  /* R23, R30: the figure names the records its claims and words are read from (STAGE's own addresses, in order) and the
     sentence of the check that would stop it: records.js refuses the stage when the 605's witness is not such a pair */
  const STAGE_RECORDS = [...new Set(STAGE.flatMap((s) => [s.claimRec.path, s.rec.path].concat(s.witness ? Object.values(s.witness).map((x) => x.path) : [])))];
  V.STAGE = C.figure({ hero: true, svgRaw: WIDE, svgNarrowRaw: NARROW, record: STAGE_RECORDS,
    stop: 'the 605\'s worst pair is not a pair of its own points closer than sixty degrees', captionRaw:
    'Each claim and its word read from its record: certs/lueker-replay.json, certs/kissing-ledger.json, certs/kissing-wave.json and the Riemann companion\'s two runs. '
    + 'A claim runs in dashed, as printed; what leaves the box is decided; the hedged sentence is refused by the grammar, and nothing leaves the box for it. '
    + 'The × is the one counterexample a claim here exhibits: points ' + W.val({ rec: RP(WI.i), standing: W.DECIDED, fmt: 'int' }) + ' and ' + W.val({ rec: RP(WI.j), standing: W.DECIDED, fmt: 'int' })
    + ' of the ' + W.val({ rec: RP(WI.n), standing: W.DECIDED, fmt: 'int' }) + ' published, ' + W.val({ rec: RP(WI.deg), standing: W.COMPUTED, fmt: 'fixed:2' }) + '° apart. '
    + 'The cut-short bound on |D(1)| is refuted by comparing two numbers, which leaves no point to mark. The dots are a picture of the flow; nothing else moves.'
    + legend });
}

/* ---- the page's own shape, counted, not typed: the deck said "six acts" over five acts and an epilogue ---- */
{ const raw = T('apps/explained/body.html');
  const acts = (raw.match(/<div class="act">Act [IVX]+ ·/g) || []).length, epi = (raw.match(/<div class="act">Epilogue ·/g) || []).length;
  const instr = new Set(raw.match(/Instrument \d+ ·/g) || []).size;
  need(acts >= 2 && epi === 1 && instr >= 2, 'the easy read lost its acts, its epilogue or its instruments');
  V.ACTS_WORDS = numword(acts) + ' acts and an epilogue'; V.INSTRUMENTS_WORD = numword(instr); }

/* ---- fill the three parts and render through the house template ---- */
const bodyRaw = fill(T('apps/explained/body.html'), 'body.html');
const cssRaw = fill(T('apps/explained/page.css'), 'page.css');
const scriptRaw = '<script>\n(function(){\n\'use strict\';\n' + T('apps/explained/common.js') + '\n' + fill(T('apps/explained/page.js'), 'page.js') + '\n})();</script>';
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const footRaw = '<p>Every number on this page was read at build time from the records of the cert-machine repository at commit ' + git + ' on ' + V.DATE + ': the method paper\'s, the register\'s and the Riemann companion\'s macro files, the self-audit\'s mutation record, the kissing wave\'s record and ledger, the Chvátal–Sankoff replay and the translator\'s pinned README. The instruments compute in your browser in exact rational arithmetic over BigInt; nothing in them is simulated except the one byte corrupted on request, which says so. The cold open\'s flight, the tiles of Act IV and the dots travelling the route of a claim are pictures, and each says so where it is drawn. Written with AI assistance (Claude) under a written brief; the verdicts quoted are the machine\'s. The page builder is apps/explained/build.js.</p>';
const html = TPL.render({
  title: 'Who checks the machine\'s mathematics? The easy read', lang: 'en', bodyClass: 'easy', path: '/explained/',
  desc: 'Machines now produce mathematics faster than anyone can referee it. ' + V.ACTS_WORDS.replace(/^./, (c) => c.toUpperCase()).replace(' and an epilogue', ', an epilogue') + ' and ' + V.INSTRUMENTS_WORD + ' instruments explain how cert-machine decides such claims exactly: three words, one string of digits read two ways, ' + V.SA_MUTANTS + ' planted errors, exact arithmetic on a GPU, and the finite layer of a famous proof. Every number is read from a record.',
  bodyRaw, footRaw, cssRaw, scriptRaw
});
fs.mkdirSync(SITE, { recursive: true });
fs.writeFileSync(path.join(SITE, 'index.html'), html);
console.log('site/explained/index.html written (' + Math.round(html.length / 1024) + ' KB; ' + Object.keys(flatten()).length + ' numbers from the records) @ git ' + git);
