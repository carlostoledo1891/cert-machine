#!/usr/bin/env node
/* build-og-report.js — a report's own share card (og:image, twitter:image), the link preview a recipient sees before
   the page: the house header — an eyebrow, the title as the H1, one deck sentence — rendered from design/template.js's
   page shell in Chrome (design/cdp.js, a real wait for the fonts), at 2x and scaled to 1200 × 630, written to
   design/assets/og-<key>.png with a receipt og-<key>.json (the words it set, the PNG's sha256). No number goes on a
   card: a card is rendered when this tool runs, not at every build, and a number on it could go stale unseen.
   tools/build-site.js serves design/assets/og-<key>.png at /og-<key>.png; the page's builder passes
   og: { image: '/og-<key>.png', alt } to TPL.render (the operator, 2026-11-03: a shared report must not carry the
   landing's card).

   usage: node tools/build-og-report.js <key>        the cards are listed in CARDS below, one per report
          node tools/build-og-report.js --all                                                            MIT */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const MAX = 300 * 1024;

const CARDS = {
  /* an ART card (the operator, 2026-11-05: "an abstract representation, on our grammar, to communicate beautifully the subject;
     not every detail; look and feel over message; the hook is in the post text"): no title, no deck — the grammar's marks
     alone (hatched voids for what stays sealed, one solid block for the file shown, one solid line to one anchor), the
     eyebrow and the URL in the corners, rendered in the LIGHT theme. The receipt's description is the alt. */
  'verify-seal': { art: true, theme: 'light', eyebrow: 'Carlos Toledo · Verify Seal', path: '/reports/verify-seal.html',
    title: 'Verify Seal',
    alt: 'Eighteen hatched blocks in three rows, sealed; one block solid; from it one line to a single point at the edge, the anchor.',
    svgRaw: (() => {
      const o = [];
      o.push('<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="Eighteen hatched blocks, sealed; one solid; one line to one anchor" style="position:absolute;left:0;top:0">');
      o.push('<defs><pattern id="og-void" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="var(--surface)"/><path d="M0,9 l9,-9 M-2.25,2.25 l4.5,-4.5 M6.75,11.25 l4.5,-4.5" stroke="var(--ink-5)" stroke-width="0.9" fill="none"/></pattern></defs>');
      const x0 = 140, dx = 122, y0 = 182, dy = 104, w = 88, h = 58, R = 3, Cn = 6, rc = 1, rr = 5;
      for (let r = 0; r < R; r++) for (let c = 0; c < Cn; c++) {
        const x = x0 + c * dx, y = y0 + r * dy, on = r === rc && c === rr;
        o.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" ' + (on ? 'fill="var(--ink)" stroke="var(--ink)"' : 'fill="url(#og-void)" stroke="var(--ink-4)"') + ' stroke-width="1.2"/>');
      }
      const ax = 1064, yl = y0 + rc * dy + h / 2, xr = x0 + rr * dx + w;
      o.push('<line x1="' + xr + '" y1="' + yl + '" x2="' + (ax - 10) + '" y2="' + yl + '" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/>');
      o.push('<circle cx="' + ax + '" cy="' + yl + '" r="6.5" fill="var(--ink)"/>');
      o.push('</svg>');
      return o.join('');
    })() },
  /* an ART card for the six-kernel follow-up (the operator, 2026-11-06: "a nice white mode abstract image like today's one",
     to upload with the post instead of the link preview): one solid block, the export, the same bytes every checker read; six
     solid lines from it to six points, grouped as the designs are (Lean's kernel twice, lean4lean, nanoda, con-leche and
     con-ron together); one dashed line to a hollow ring, the textbook reading that stays a reading. LIGHT theme, no number. */
  'eth-kernels': { art: true, theme: 'light', eyebrow: 'Carlos Toledo · the Exponential Time Hypothesis', path: '/reports/eth-chain.html',
    title: 'Six kernels, one export',
    alt: 'One solid block; six solid lines from it to six points in four groups; one dashed line to a hollow ring.',
    svgRaw: (() => {
      const o = [];
      o.push('<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="One solid block, six solid lines to six points in four groups, one dashed line to a hollow ring" style="position:absolute;left:0;top:0">');
      const bx = 140, by = 278, bw = 132, bh = 74, sx = bx + bw, sy = by + bh / 2, ax = 1064;
      o.push('<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + bh + '" rx="5" fill="var(--ink)" stroke="var(--ink)" stroke-width="1.2"/>');
      for (const y of [176, 200, 262, 338, 404, 428]) {
        o.push('<line x1="' + sx + '" y1="' + sy + '" x2="' + (ax - 10) + '" y2="' + y + '" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round"/>');
        o.push('<circle cx="' + ax + '" cy="' + y + '" r="6.5" fill="var(--ink)"/>');
      }
      const ry = 486;
      o.push('<line x1="' + sx + '" y1="' + sy + '" x2="' + (ax - 11) + '" y2="' + ry + '" stroke="var(--ink-3)" stroke-width="1.4" stroke-dasharray="5 7" stroke-linecap="round"/>');
      o.push('<circle cx="' + ax + '" cy="' + ry + '" r="6.5" fill="var(--surface)" stroke="var(--ink-3)" stroke-width="1.6"/>');
      o.push('</svg>');
      return o.join('');
    })() },
  /* an ART card for /z-in-q/ (2026-11-06, the unlisted ℤ-in-ℚ page): a tower climbing like a stack of exponents (the claim's
     bounds are towers, 2↑↑7 and 2↑↑8), its lower blocks solid (the finite parts decided), its upper blocks hatched voids
     (what stays a premise), and from its top one dashed line to a hollow ring: the theorem, reached only by a reading.
     LIGHT theme, no number, no title text. */
  'z-in-q': { art: true, theme: 'light', eyebrow: 'Carlos Toledo · ℤ is Diophantine in ℚ', path: '/z-in-q/',
    title: 'The claim that ℤ is Diophantine in ℚ',
    alt: 'A tower of seven blocks climbing up and to the right like a stack of exponents, the lower four solid, the upper three hatched; from its top, one dashed line to a hollow ring.',
    svgRaw: (() => {
      const o = [];
      o.push('<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="A tower of blocks climbing like a stack of exponents, the lower ones solid, the upper ones hatched; one dashed line from its top to a hollow ring" style="position:absolute;left:0;top:0">');
      o.push('<defs><pattern id="og-void" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="var(--surface)"/><path d="M0,9 l9,-9 M-2.25,2.25 l4.5,-4.5 M6.75,11.25 l4.5,-4.5" stroke="var(--ink-5)" stroke-width="0.9" fill="none"/></pattern></defs>');
      /* each block a superscript of the one before: 0.74 of its size, its baseline 0.62 of the way up, a gap of a tenth */
      let x = 140, base = 500, s = 168, right = 0, mid = 0;
      for (let i = 0; i < 7; i++) {
        const solid = i < 4;
        right = x + s; mid = base - s / 2;
        o.push('<rect x="' + x.toFixed(1) + '" y="' + (base - s).toFixed(1) + '" width="' + s.toFixed(1) + '" height="' + s.toFixed(1) + '" rx="' + Math.max(2, s / 34).toFixed(1) + '" '
          + (solid ? 'fill="var(--ink)" stroke="var(--ink)"' : 'fill="url(#og-void)" stroke="var(--ink-4)"') + ' stroke-width="1.2"/>');
        x += s * 1.1; base -= 0.62 * s; s *= 0.74;
      }
      const ax = 1064, ay = mid;   /* the ring at the height of the top block's middle */
      o.push('<line x1="' + (right + 14).toFixed(1) + '" y1="' + ay.toFixed(1) + '" x2="' + (ax - 11) + '" y2="' + ay.toFixed(1) + '" stroke="var(--ink-3)" stroke-width="1.4" stroke-dasharray="5 7" stroke-linecap="round"/>');
      o.push('<circle cx="' + ax + '" cy="' + ay.toFixed(1) + '" r="6.5" fill="var(--surface)" stroke="var(--ink-3)" stroke-width="1.6"/>');
      o.push('</svg>');
      return o.join('');
    })() },
  /* an ART card for /reports/erdos-488.html (2026-11-07): the seven pre-registered checks as seven blocks in a row — five
     solid (decided), one hollow (the search that found nothing), one hatched (the reading of who was first) — under one solid
     line, the 2× the question is about; far to the right, above the line, a single diamond: the counterexample, at a size
     no count reaches. LIGHT theme, no number, no title text. */
  'erdos-488': { art: true, theme: 'light', eyebrow: 'Carlos Toledo · Erdős #488', path: '/reports/erdos-488.html',
    title: 'Erdős #488: an AI-assisted refutation, certified',
    alt: 'Seven blocks in a row, five solid, one hollow, one hatched, under one solid line; far to the right, a single diamond above the line.',
    svgRaw: (() => {
      const o = [];
      o.push('<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="Seven blocks in a row, five solid, one hollow, one hatched, under one solid line; far to the right a single diamond above the line" style="position:absolute;left:0;top:0">');
      o.push('<defs><pattern id="og-void" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="var(--surface)"/><path d="M0,9 l9,-9 M-2.25,2.25 l4.5,-4.5 M6.75,11.25 l4.5,-4.5" stroke="var(--ink-5)" stroke-width="0.9" fill="none"/></pattern></defs>');
      const x0 = 140, s = 86, gap = 22, y = 330, kinds = ['solid', 'solid', 'solid', 'solid', 'hollow', 'void', 'solid'];
      kinds.forEach((k, i) => {
        const x = x0 + i * (s + gap);
        const paint = k === 'solid' ? 'fill="var(--ink)" stroke="var(--ink)"' : k === 'void' ? 'fill="url(#og-void)" stroke="var(--ink-4)"' : 'fill="var(--surface)" stroke="var(--ink-3)"';
        o.push('<rect x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '" rx="4" ' + paint + ' stroke-width="1.6"/>');
      });
      const ly = 250, lx1 = 1064;
      o.push('<line x1="' + x0 + '" y1="' + ly + '" x2="' + lx1 + '" y2="' + ly + '" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/>');
      const dx = 1064, dy = 196, d = 11;   /* the counterexample: above the line, far out */
      o.push('<path d="M' + dx + ' ' + (dy - d) + ' L' + (dx + d) + ' ' + dy + ' L' + dx + ' ' + (dy + d) + ' L' + (dx - d) + ' ' + dy + ' Z" fill="var(--ink)"/>');
      o.push('</svg>');
      return o.join('');
    })() },
  /* an ART card for /reports/claims.html (2026-11-08, the first submitted claims): one line arriving from the edge, the
     queue, into four blocks, the four verdicts in the chip grammar's shapes (CERTIFIED filled, REFUTED outlined), no number */
  claims: { art: true, theme: 'light', eyebrow: 'Carlos Toledo · the claims desk', path: '/reports/claims.html',
    title: 'Send us a claim',
    alt: 'A line arriving from the left edge into four blocks in a row: filled, outlined, filled, outlined.',
    svgRaw: (() => {
      const o = [], s = 104, gap = 30, x0 = 470, y = 263, ly = y + s / 2;
      o.push('<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="A line arriving from the left into four blocks, filled, outlined, filled, outlined" style="position:absolute;left:0;top:0">');
      o.push('<line x1="140" y1="' + ly + '" x2="' + (x0 - 24) + '" y2="' + ly + '" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/>');
      ['solid', 'hollow', 'solid', 'hollow'].forEach((k, i) => {
        const x = x0 + i * (s + gap);
        o.push('<rect x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '" rx="6" ' + (k === 'solid' ? 'fill="var(--ink)" stroke="var(--ink)"' : 'fill="var(--surface)" stroke="var(--ink)"') + ' stroke-width="2.4"/>');
      });
      o.push('</svg>');
      return o.join('');
    })() },
  /* an ART card for /reports/lean-intake.html (2026-11-09): two statements of the same shape side by side, one outlined
     and one solid, joined by an equals sign; beneath, the planted ones as a row of small squares, all hollow but the
     matching pair's colour — refused. No number, no label */
  'lean-intake': { art: true, theme: 'light', eyebrow: 'Carlos Toledo · Lean, the right statement', path: '/reports/lean-intake.html',
    title: 'Does an AI’s Lean proof prove the right statement? One command to check',
    alt: 'Two equal rectangles side by side, one outlined and one solid, joined by an equals sign; below them a row of ten small hollow squares.',
    svgRaw: (() => {
      const o = [], w = 250, h = 130, y = 205, x1 = 300, x2 = 650;
      o.push('<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="Two equal rectangles joined by an equals sign, and a row of small hollow squares" style="position:absolute;left:0;top:0">');
      o.push('<rect x="' + x1 + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="8" fill="var(--surface)" stroke="var(--ink)" stroke-width="2.4"/>');
      o.push('<rect x="' + x2 + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="8" fill="var(--ink)" stroke="var(--ink)" stroke-width="2.4"/>');
      for (const dy of [-11, 11]) o.push('<line x1="' + (x1 + w + 30) + '" y1="' + (y + h / 2 + dy) + '" x2="' + (x2 - 30) + '" y2="' + (y + h / 2 + dy) + '" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>');
      for (let i = 0; i < 10; i++) o.push('<rect x="' + (x1 + 6 + i * 60) + '" y="' + (y + h + 70) + '" width="26" height="26" rx="4" fill="var(--surface)" stroke="var(--ink-3)" stroke-width="2"/>');
      o.push('</svg>');
      return o.join('');
    })() },
  /* an ART card for /reports/heptagon.html (2026-11-07): the heptagon itself on its circle, drawn at r = e as the page's
     figure is; the paper's weights by sign alone (solid for the positive, hollow for the negative), no number */
  heptagon: { art: true, theme: 'light', eyebrow: 'Carlos Toledo · Graham’s conjecture', path: '/reports/heptagon.html',
    title: 'Pálvölgyi’s heptagon and the appendix theorem marked unchecked, decided in Lean',
    alt: 'A circle with seven dots on it, the heptagon: one at the leftmost point of the circle and three mirrored pairs; four dots solid, three hollow.',
    svgRaw: (() => {
      const o = [], r = Math.E, s = 205 / r, cx = 600, cy = 322;
      const at = (x, y) => [cx + (x - r) * s, cy - y * s];
      o.push('<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="A circle with seven dots on it, four solid and three hollow" style="position:absolute;left:0;top:0">');
      o.push('<circle cx="' + cx + '" cy="' + cy + '" r="205" fill="none" stroke="var(--ink-3)" stroke-width="1.6"/>');
      const pts = [[0, 0, 1]].concat([[1, -1], [3, 1], [4, -1]].flatMap(([j, w]) => { const y = Math.sqrt(j * (2 * r - j)); return [[j, y, w], [j, -y, w]]; }));
      for (const [x, y, w] of pts) {
        const [px, py] = at(x, y);
        o.push('<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="13" ' + (w > 0 ? 'fill="var(--ink)" stroke="var(--ink)"' : 'fill="var(--surface)" stroke="var(--ink)"') + ' stroke-width="2.4"/>');
      }
      o.push('</svg>');
      return o.join('');
    })() },
  /* an ART card for /reports/prime-gaps-186.html (2026-11-10): three hollow rings, the assumptions, not proved; each joined
     by a dashed line (a premise, as on the ℤ-in-ℚ card) to one solid block, the Lean proof, checked; from it one line to a row of ticks on which two solid dots sit close
     together, two primes a bounded gap apart. No number, no label */
  'prime-gaps-186': { art: true, theme: 'light', eyebrow: 'Carlos Toledo · prime gaps', path: '/reports/prime-gaps-186.html',
    title: 'OpenAI’s prime-gap bound of 186, checked from every side I could reach',
    alt: 'Three hollow rings on the left, each joined by a dashed line to one solid block; from the block a line runs to a row of small ticks on which two solid dots sit close together.',
    svgRaw: (() => {
      const o = [], bx = 430, by = 255, bw = 170, bh = 120, my = by + bh / 2, x0 = 700, x1 = 1070;
      o.push('<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="Three hollow rings joined to one solid block, and a row of ticks with two solid dots close together" style="position:absolute;left:0;top:0">');
      for (const y of [195, 315, 435]) {
        o.push('<line x1="208" y1="' + y + '" x2="' + (bx - 12) + '" y2="' + (my + (y - 315) * 0.28) + '" stroke="var(--ink-3)" stroke-width="1.6" stroke-dasharray="5 7" stroke-linecap="round"/>');
        o.push('<circle cx="180" cy="' + y + '" r="24" fill="var(--surface)" stroke="var(--ink)" stroke-width="2.4"/>');
      }
      o.push('<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + bh + '" rx="8" fill="var(--ink)" stroke="var(--ink)" stroke-width="2.4"/>');
      o.push('<line x1="' + (bx + bw + 14) + '" y1="' + my + '" x2="' + x1 + '" y2="' + my + '" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/>');
      for (let x = x0; x <= x1; x += 37) o.push('<line x1="' + x + '" y1="' + (my - 9) + '" x2="' + x + '" y2="' + (my + 9) + '" stroke="var(--ink-3)" stroke-width="1.6" stroke-linecap="round"/>');
      for (const x of [x0 + 5 * 37, x0 + 7 * 37]) o.push('<circle cx="' + x + '" cy="' + my + '" r="13" fill="var(--ink)" stroke="var(--surface)" stroke-width="3"/>');
      o.push('</svg>');
      return o.join('');
    })() },
  /* the home page's own card (2026-11-11, the operator's headline "Looks right? Zoom in."): LIGHT, the headline and one
     sentence beside the figure the page opens on, the 26 published circles drawn from the pinned bytes (the same file
     tools/home-page.js reads, refused there on a sha256 mismatch), with the witness × where the record's worst pair
     overlaps and a guide ring around it. No number on it. */
  home: { theme: 'light', eyebrow: 'Carlos Toledo · independent exact certification', path: '/',
    title: 'Looks right? Zoom in.',
    deck: 'I check published results exactly, whoever printed them, and answer in one word: certified, refuted or refused.',
    css: 'h1{font-size:64px}',
    svgRaw: (() => {
      const W = require(path.join(ROOT, 'playground', 'warrant.js'));
      const G = require(path.join(ROOT, 'design', 'grammar.js'));
      const IN = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'claims-intake-2026-11-08.json'), 'utf8')).claims['5'];
      const list = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'claims-intake', 'inputs', 'thetaevolve-7c12898-CirclePacking-data.json'), 'utf8')).find((e) => e.name === IN.entry).list;
      const [i, j] = IN.decision.worstPairDistance.pair, A = list[i], B = list[j];
      const d = Math.hypot(B[0] - A[0], B[1] - A[1]), t = (A[2] - (A[2] + B[2] - d) / 2) / d;
      const K = 430, M = 20, X = (v) => (M + v * K).toFixed(2), px = M + (A[0] + (B[0] - A[0]) * t) * K, py = M + (A[1] + (B[1] - A[1]) * t) * K;
      const o = ['<svg viewBox="0 0 470 470" width="470" height="470" role="img" aria-label="Twenty-six circles packed in a square; a red cross marks the one pair to zoom in on">'];
      o.push('<rect x="' + M + '" y="' + M + '" width="' + K + '" height="' + K + '" fill="none" stroke="var(--rule-strong)" stroke-width="1"/>');
      for (const c of list) o.push('<circle cx="' + X(c[0]) + '" cy="' + X(c[1]) + '" r="' + (c[2] * K).toFixed(2) + '" fill="var(--band-fill)" stroke="var(--ink)" stroke-width="1.6"/>');
      o.push('<circle cx="' + px.toFixed(2) + '" cy="' + py.toFixed(2) + '" r="26" fill="none" stroke="var(--ink-3)" stroke-width="1.2" stroke-dasharray="' + G.GUIDE + '"/>');
      o.push(W.witnessMark(px, py, { size: 8, width: 3.2, casing: 'var(--paper)' }));
      o.push('</svg>');
      return o.join('');
    })() },
  wsp: { eyebrow: 'Carlos Toledo · independent certification · Weight-Space Programming (MIT CSAIL)',
    title: 'Weight-Space Programming, decided from its bytes',
    deck: 'The edit is real and exactly as released. Run under its maker’s own recommended settings, the untouched model already reaches the edited one’s score: the gain is termination, the multiplier mostly a settings effect. Every answer graded exactly, every input pinned.',
    path: '/reports/weight-space-programming.html' },
  eth: { eyebrow: 'Carlos Toledo · independent certification · the Exponential Time Hypothesis',
    title: 'Two claims that ETH is false, decided',
    deck: 'Both labs’ Lean proofs replayed by two kernels and accepted against their own statements. The bridges between the two machine models, written by third parties, replayed and certified. The version seam between the two Leans measured, and said to be read, not decided.',
    path: '/eth/' },
  'eth-chain': { eyebrow: 'Carlos Toledo · independent certification',
    title: 'AI proofs that the Exponential Time Hypothesis is false now reach a textbook machine',
    deck: 'The step both papers left in prose is now in Lean, checked by independent kernels. Both sides run in one Lean; the textbook definition stays a reading.',
    css: 'h1{font-size:42px}',
    path: '/eth/',
    svgRaw: '<svg viewBox="0 0 470 400" width="470" height="400" role="img" aria-label="Two lab boxes, linked by solid lines to a standard multitape Turing machine with its tape, and a dashed line to the textbook ETH" style="font-family:var(--mono, ui-monospace, monospace)">'
      + '<defs><marker id="og-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--ink)"/></marker>'
      + '<marker id="og-r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--ink-2)"/></marker></defs>'
      /* the two labs, each on a machine of its own */
      + '<rect x="6" y="20" width="150" height="58" rx="5" fill="var(--surface)" stroke="var(--ink)" stroke-width="2"/>'
      + '<text x="81" y="45" text-anchor="middle" font-size="17" fill="var(--ink)">OpenAI</text><text x="81" y="66" text-anchor="middle" font-size="12" fill="var(--ink-3)">its own machine</text>'
      + '<rect x="6" y="150" width="150" height="58" rx="5" fill="var(--surface)" stroke="var(--ink)" stroke-width="2"/>'
      + '<text x="81" y="175" text-anchor="middle" font-size="17" fill="var(--ink)">Anthropic</text><text x="81" y="196" text-anchor="middle" font-size="12" fill="var(--ink-3)">its own machine</text>'
      + '<line x1="81" y1="78" x2="81" y2="148" stroke="var(--ink)" stroke-width="2.5" marker-end="url(#og-a)"/>'
      + '<path d="M70,96 l22,-6 M70,102 l22,-6" stroke="var(--ink-2)" stroke-width="1.6"/>' + '<text x="100" y="112" font-size="12" fill="var(--ink)">checked</text><text x="100" y="128" font-size="11" fill="var(--ink-3)">K · N</text>'
      /* the standard machine: a head over a tape of bits */
      + '<line x1="156" y1="179" x2="262" y2="179" stroke="var(--ink)" stroke-width="2.5" marker-end="url(#og-a)"/>'
      + '<text x="226" y="168" text-anchor="middle" font-size="12" fill="var(--ink)">checked</text><text x="226" y="198" text-anchor="middle" font-size="11" fill="var(--ink-3)">K · N</text>'
      + '<rect x="264" y="128" width="198" height="104" rx="5" fill="var(--surface)" stroke="var(--ink)" stroke-width="2"/>'
      + '<text x="363" y="154" text-anchor="middle" font-size="14" fill="var(--ink)">a standard multitape</text><text x="363" y="170" text-anchor="middle" font-size="14" fill="var(--ink)">Turing machine</text>'
      + ['1', '0', '1', '1', '0', '0', '1', '0', '1'].map((b, i) => '<rect x="' + (276 + i * 19.5) + '" y="196" width="18" height="24" fill="none" stroke="var(--ink-2)" stroke-width="1.2"/><text x="' + (285 + i * 19.5) + '" y="213" text-anchor="middle" font-size="12" fill="var(--ink-2)">' + b + '</text>').join('')
      + '<path d="M355,181 l12,0 l-6,10 z" fill="var(--ink)"/>'
      /* the reading: dashed, as on every page here */
      + '<line x1="363" y1="234" x2="363" y2="300" stroke="var(--ink-2)" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#og-r)"/>'
      + '<text x="373" y="270" font-size="12" fill="var(--ink-2)">read</text>'
      + '<rect x="284" y="302" width="158" height="52" rx="5" fill="none" stroke="var(--ink-2)" stroke-width="1.6" stroke-dasharray="5 4"/>'
      + '<text x="363" y="333" text-anchor="middle" font-size="15" fill="var(--ink-2)">the textbook ETH</text>'
      + '<text x="6" y="378" font-size="11" fill="var(--ink-3)">solid: decided by two kernels</text><text x="6" y="394" font-size="11" fill="var(--ink-3)">//: a Lean version gap, read · dashed: a reading</text>'
      + '</svg>' }
};

function cardHtml(c) {
  const C = require(path.join(ROOT, 'design', 'components.js'));
  const TPL = require(path.join(ROOT, 'design', 'template.js'));
  const themeHead = c.theme === 'light' ? '<script>document.documentElement.setAttribute("data-theme","light")</script>' : '';
  if (c.art) return TPL.render({
    title: c.title, path: '/', footRaw: null, desc: c.alt, headRaw: themeHead,
    cssRaw: 'nav.topnav,[class*="theme"]{display:none !important}\nbody{margin:0;overflow:hidden}\n.page{padding:0;max-width:none}\n.og-art .eyebrow{animation:none}',
    bodyRaw: '<div class="og-art" style="position:absolute;left:0;top:0;width:1200px;height:630px;overflow:hidden">' + c.svgRaw
      + '<div class="eyebrow" style="position:absolute;left:140px;top:108px">' + C.esc(c.eyebrow) + '</div>'
      + '<div class="eyebrow" style="position:absolute;left:140px;bottom:72px">carlostoledo.co' + C.esc(c.path) + '</div>'
      /* the font check below asks for Inter 550 64px: an art card sets no such text, so one invisible glyph loads the face */
      + '<span aria-hidden="true" style="position:absolute;left:-9999px;top:0;font:550 64px Inter">.</span></div>'
  });
  return TPL.render({
    /* path '/' on purpose: the card is a still, not the page — design/titles.js would otherwise hold its H1 to the registry's */
    title: c.title, path: '/', footRaw: null, desc: c.deck, headRaw: themeHead,
    /* a still, not a page: no nav, no theme pill, no entrance motion; the block set lower and larger so it reads at thumbnail size */
    cssRaw: 'h1,.deck,.stats{animation:none}\nnav.topnav,[class*="theme"]{display:none !important}\n.page{padding-top:var(--s-10)}\n.og-host{margin-top:var(--s-7)}\nh1{font-size:clamp(34px,4.2vw,54px);line-height:1.08}\n.deck{font-size:clamp(18px,1.9vw,24px);line-height:1.45}' + (c.css ? '\n' + c.css : ''),
    bodyRaw: c.svgRaw
      ? '<div class="og-two" style="display:grid;grid-template-columns:1fr 470px;gap:44px;align-items:center;padding:0 56px;margin-top:-64px">'
        + '<div>' + C.header({ eyebrow: c.eyebrow, title: c.title, deck: c.deck }) + '<div class="eyebrow" style="margin-top:22px">carlostoledo.co' + c.path + '</div></div>'
        + '<div>' + c.svgRaw + '</div></div>'
      : C.header({ eyebrow: c.eyebrow, title: c.title, deck: c.deck })
        + '\n<div class="col og-host"><div class="eyebrow">carlostoledo.co' + c.path + '</div></div>'
  });
}

async function build(key) {
  const c = CARDS[key];
  if (!c) throw new Error('no card named ' + key + ' (known: ' + Object.keys(CARDS).join(', ') + ')');
  const OUT = path.join(ROOT, 'design', 'assets', 'og-' + key + '.png'), REC = path.join(ROOT, 'design', 'assets', 'og-' + key + '.json');
  const { withChrome, settle } = require(path.join(ROOT, 'design', 'cdp.js'));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'og-' + key + '-'));
  const page = path.join(dir, 'card.html');
  fs.writeFileSync(page, cardHtml(c));
  try {
    await withChrome(async (send) => {
      await send('Page.enable');
      await send('Runtime.enable');
      await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 2, mobile: false });
      await send('Page.navigate', { url: 'file://' + page });
      await settle(1500);
      await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => document.fonts.size)', awaitPromise: true, returnByValue: true }, 20000);
      await settle(800);
      const fit = await send('Runtime.evaluate', { expression: 'JSON.stringify({ h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth, inter: document.fonts.check("550 64px Inter") })', returnByValue: true });
      const F = JSON.parse(fit.result.value);
      if (F.w > 1200 || F.h > 630) throw new Error('the card overflows 1200 × 630 (' + F.w + ' × ' + F.h + '): shorten the deck');
      if (!F.inter) throw new Error('Inter did not load: the card would be set in a fallback face');
      const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      if (!shot || !shot.data) throw new Error('captureScreenshot returned nothing');
      fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
    });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  cp.execFileSync('/usr/bin/sips', ['-z', '630', '1200', OUT], { stdio: 'ignore' });
  const buf = fs.readFileSync(OUT);
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  if (w !== 1200 || h !== 630) throw new Error('the card is ' + w + ' × ' + h + ', not 1200 × 630');
  if (buf.length >= MAX) throw new Error('the card is ' + buf.length + ' bytes, over 300 KB');
  const receipt = { what: 'The share card of ' + c.path + ' (og:image, twitter:image), rendered by tools/build-og-report.js from the house page shell: the eyebrow, the title and one deck sentence, no number.',
    key, path: c.path, eyebrow: c.eyebrow, title: c.title, description: c.art ? c.alt : c.deck, art: !!c.art, theme: c.theme || 'dark', width: w, height: h, bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex'), rendered: new Date().toISOString().slice(0, 10) };
  fs.writeFileSync(REC, JSON.stringify(receipt, null, 2) + '\n');
  console.log('wrote design/assets/og-' + key + '.png (' + w + ' × ' + h + ', ' + Math.round(buf.length / 1024) + ' KB) and its receipt');
}

/* the alt a page builder passes beside the image: the card's own words, read from its receipt so they cannot disagree */
function alt(key) {
  const R = JSON.parse(fs.readFileSync(path.join(ROOT, 'design', 'assets', 'og-' + key + '.json'), 'utf8'));
  return R.title + ' — ' + R.description;
}

module.exports = { CARDS, alt };
if (require.main === module) {
  const keys = process.argv.includes('--all') ? Object.keys(CARDS) : process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (!keys.length) { console.error('usage: node tools/build-og-report.js <key> | --all   (keys: ' + Object.keys(CARDS).join(', ') + ')'); process.exit(2); }
  (async () => { for (const k of keys) await build(k); })().catch((e) => { console.error('OG-REPORT REFUSED: ' + e.message); process.exit(1); });
}
