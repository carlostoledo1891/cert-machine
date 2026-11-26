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
  /* an ART card for /reports/optconst-queue.html (2026-11-23, for the post on the registry's merges of 2026-11-22): five
     registry rows as hollow bars, each with the registry's asterisk at its end struck through, and from each bar a solid
     line to one solid block (the replay that took the mark off). LIGHT theme, no number, no title text. */
  'optconst-queue': { art: true, theme: 'light', eyebrow: 'Carlos Toledo · the registry\'s asterisks', path: '/reports/optconst-queue.html',
    title: 'The registry\'s asterisks, replayed',
    alt: 'Five hollow bars in a column, each ending in an asterisk struck through; from each bar a solid line runs to one solid block on the right.',
    svgRaw: (() => {
      const o = [], x0 = 150, x1 = 560, bh = 34, ys = [170, 245, 320, 395, 470], bx = 900, bw = 150, bby = 250, bbh = 160;
      o.push('<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="Five hollow bars, each with a struck-through asterisk, joined by solid lines to one solid block" style="position:absolute;left:0;top:0">');
      for (const y of ys) {
        const cy = y + bh / 2, ax = x1 + 46;
        o.push('<rect x="' + x0 + '" y="' + y + '" width="' + (x1 - x0) + '" height="' + bh + '" rx="6" fill="var(--surface)" stroke="var(--ink)" stroke-width="2.4"/>');
        for (const a of [0, 60, 120]) {
          const t = a * Math.PI / 180, dx = 13 * Math.cos(t), dy = 13 * Math.sin(t);
          o.push('<line x1="' + (ax - dx).toFixed(1) + '" y1="' + (cy - dy).toFixed(1) + '" x2="' + (ax + dx).toFixed(1) + '" y2="' + (cy + dy).toFixed(1) + '" stroke="var(--ink-4)" stroke-width="2.4" stroke-linecap="round"/>');
        }
        o.push('<line x1="' + (ax - 20) + '" y1="' + (cy + 16) + '" x2="' + (ax + 20) + '" y2="' + (cy - 16) + '" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round"/>');
        o.push('<line x1="' + (ax + 34) + '" y1="' + cy + '" x2="' + (bx - 12) + '" y2="' + (bby + bbh / 2 + (cy - 337) * 0.45).toFixed(1) + '" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/>');
      }
      o.push('<rect x="' + bx + '" y="' + bby + '" width="' + bw + '" height="' + bbh + '" rx="8" fill="var(--ink)" stroke="var(--ink)" stroke-width="2.4"/>');
      o.push('</svg>');
      return o.join('');
    })() },
  /* an ART card for /reports/percolation-critical.html (2026-11-12): a hollow ring (the textbook) joined by a dashed line
     to one solid block (the statement written from it); two hollow rings on the right (the two labs' Lean proofs), each
     with a solid arrow into the block (the bridges). LIGHT theme, no number, no title text. */
  'percolation-critical': { art: true, theme: 'light', eyebrow: 'Carlos Toledo · critical percolation', path: '/reports/percolation-critical.html',
    title: 'Two AI proofs of critical percolation, checked against the textbook statement I wrote',
    alt: 'A hollow ring on the left joined by a dashed line to one solid block; two hollow rings on the right, each with an arrow into the block.',
    svgRaw: (() => {
      const o = [], bx = 500, by = 255, bw = 200, bh = 120, my = by + bh / 2;
      o.push('<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="A hollow ring joined by a dashed line to a solid block, and two hollow rings with arrows into the block" style="position:absolute;left:0;top:0">');
      o.push('<line x1="232" y1="' + my + '" x2="' + (bx - 14) + '" y2="' + my + '" stroke="var(--ink-3)" stroke-width="1.6" stroke-dasharray="5 7" stroke-linecap="round"/>');
      o.push('<circle cx="200" cy="' + my + '" r="28" fill="var(--surface)" stroke="var(--ink)" stroke-width="2.4"/>');
      o.push('<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + bh + '" rx="8" fill="var(--ink)" stroke="var(--ink)" stroke-width="2.4"/>');
      for (const [cy, ty] of [[205, my - 30], [425, my + 30]]) {
        o.push('<line x1="972" y1="' + cy + '" x2="' + (bx + bw + 22) + '" y2="' + ty + '" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/>');
        o.push('<path d="M' + (bx + bw + 10) + ' ' + ty + ' l16 -8 l0 16 z" fill="var(--ink)" transform="rotate(' + (Math.atan2(cy - ty, 972 - (bx + bw + 22)) * 180 / Math.PI) + ' ' + (bx + bw + 10) + ' ' + ty + ')"/>');
        o.push('<circle cx="1000" cy="' + cy + '" r="28" fill="var(--surface)" stroke="var(--ink)" stroke-width="2.4"/>');
      }
      o.push('</svg>');
      return o.join('');
    })() },
  /* an ART card for /reports/macmahon.html (2026-11-12): the thirty cubes as Conway's table, a six-by-six grid with its
     diagonal left empty, the twelve cubes of one minimum set (ABC | DEF) solid and the other eighteen hollow; beside it the
     six letters as a hexagon with the set's two triangles, one filled and one open. LIGHT theme, no number, no label. */
  macmahon: { art: true, theme: 'light', eyebrow: 'Carlos Toledo · MacMahon cubes', path: '/reports/macmahon.html',
    title: 'The ten minimum universal sets of MacMahon cubes: a classification decided twice',
    alt: 'A six-by-six grid of small squares with its diagonal left empty: twelve squares, in two blocks of six, are solid and the other eighteen are hollow. Beside it, a hexagon of six dots joined into two triangles, one filled and one open.',
    svgRaw: (() => {
      const o = [], gx = 250, gy = 143, cell = 46, pitch = 60, cx = 880, cy = 322, r = 128;
      o.push('<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="A grid of squares with an empty diagonal, twelve solid and eighteen hollow, and a hexagon of six dots joined into two triangles" style="position:absolute;left:0;top:0">');
      for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
        if (i === j) continue;
        const on = (i < 3) === (j < 3);
        o.push('<rect x="' + (gx + j * pitch) + '" y="' + (gy + i * pitch) + '" width="' + cell + '" height="' + cell + '" rx="6" fill="var(' + (on ? '--ink' : '--surface') + ')" stroke="var(' + (on ? '--ink' : '--ink-3') + ')" stroke-width="2.4"/>');
      }
      const at = (k) => [cx + r * Math.cos(-Math.PI / 2 + k * Math.PI / 3), cy + r * Math.sin(-Math.PI / 2 + k * Math.PI / 3)];
      [[0, 1, 2], [3, 4, 5]].forEach((tri, n) => o.push('<polygon points="' + tri.map((k) => at(k).map((v) => v.toFixed(1)).join(',')).join(' ') + '" fill="' + (n ? 'none' : 'var(--ink)') + '"' + (n ? '' : ' fill-opacity="0.16"') + ' stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round"/>'));
      for (let k = 0; k < 6; k++) { const [x, y] = at(k); o.push('<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="13" fill="var(' + (k < 3 ? '--ink' : '--surface') + ')" stroke="var(--ink)" stroke-width="2.4"/>'); }
      o.push('</svg>');
      return o.join('');
    })() },
  /* an ART card for /reports/prime-gap-premises.html (2026-11-13): the ledger as three rows of squares, one row per proof
     and one square per premise, each drawn by what was done to it: solid (decided on instances), dashed (reproduced, or
     read), hatched (not decided). LIGHT theme, no number, no label. */
  'prime-gap-premises': { art: true, theme: 'light', eyebrow: 'Carlos Toledo · prime gaps, the premises', path: '/reports/prime-gap-premises.html',
    title: 'Three Lean proofs of bounded prime gaps, and the 16 premises Lean does not check',
    alt: 'Three rows of squares, one row per proof and one square per premise: solid squares, dashed squares and hatched squares.',
    svgRaw: (() => {
      const o = [], x0 = 316, pitch = 72, cell = 52, rows = [['s', 's', 'd'], ['s', 's', 's', 'd', 'v'], ['d', 'd', 'd', 'd', 'd', 'd', 'd', 'v']];
      o.push('<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="Three rows of squares: solid, dashed and hatched" style="position:absolute;left:0;top:0">');
      o.push('<defs><pattern id="og-void" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="var(--surface)"/><path d="M0,9 l9,-9 M-2.25,2.25 l4.5,-4.5 M6.75,11.25 l4.5,-4.5" stroke="var(--ink-5)" stroke-width="0.9" fill="none"/></pattern></defs>');
      rows.forEach((row, r) => row.forEach((k, i) => {
        const at = 'x="' + (x0 + i * pitch) + '" y="' + (186 + r * 96) + '" width="' + cell + '" height="' + cell + '" rx="6"';
        o.push('<rect ' + at + ' ' + (k === 's' ? 'fill="var(--ink)" stroke="var(--ink)" stroke-width="2.4"'
          : k === 'd' ? 'fill="var(--surface)" stroke="var(--ink-2)" stroke-width="2.4" stroke-dasharray="5 4"'
          : 'fill="url(#og-void)" stroke="var(--ink-4)" stroke-width="1.2"') + '/>');
      }));
      o.push('</svg>');
      return o.join('');
    })() },
  /* two ART cards for the physics answer key (2026-11-17), both drawn from the records through the pages' one reading
     (playground/physics-key/facts.js), loaded only when a card is asked for (a getter), so no other builder depends on it.
     The report's: the spin energy of the same tumbling body over ten seconds in every configuration recorded at one
     timestep, faint lines that stay near level (runs with the same bytes are drawn once) and one solid line that falls. The instrument's: one level line and
     the two MuJoCo curves that leave it, one up and one down. Every line is a decided run, so every line is solid.
     LIGHT theme, no number, no label. */
  'physics-key': { art: true, theme: 'light', eyebrow: 'Carlos Toledo · the physics answer key', path: '/reports/physics-key.html',
    title: 'The physics answer key: one hundred simulator runs, two engines, decided in exact arithmetic',
    alt: 'Lines running left to right from one point. The faint ones, one for each other configuration recorded, stay close to a thin level line; one solid line falls steadily away below them.',
    get svgRaw() {
      const K = require(path.join(ROOT, 'playground', 'physics-key', 'facts.js'));
      const H = '0.002', x0 = 150, x1 = 1050, yL = 232, f = (v) => v.toFixed(1);
      const others = K.rowsOf('top').map((g) => g[0]).concat(K.rowsOf('top', K.N_OF.top).map((g) => g[0]).filter((i) => i !== 'semiimplicit'));
      const line = (id) => { const t = K.trace(id, 'T-ENERGY'), n = 240; let d = ''; for (let j = 0; j <= n; j++) { const k = Math.round(j * (t.length - 1) / n); d += (j ? 'L' : 'M') + f(x0 + j * (x1 - x0) / n) + ' ' + f(yL - 100 * t[k] * 4.4); } return d; };
      const o = ['<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="Lines from one point: the faint ones stay near level, one solid line falls" style="position:absolute;left:0;top:0">'];
      o.push('<line x1="' + x0 + '" y1="' + yL + '" x2="' + x1 + '" y2="' + yL + '" stroke="var(--ink-4)" stroke-width="1.2"/>');
      for (const i of others) o.push('<path d="' + line('top-' + i + '-h' + H) + '" fill="none" stroke="var(--ink-3)" stroke-width="2" stroke-linejoin="round"/>');
      o.push('<path d="' + line('top-semiimplicit-h' + H) + '" fill="none" stroke="var(--ink)" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>');
      o.push('<circle cx="' + x0 + '" cy="' + yL + '" r="7" fill="var(--ink)"/>');
      o.push('</svg>');
      return o.join('');
    } },
  'physics-key-instrument': { art: true, theme: 'light', eyebrow: 'Carlos Toledo · the physics answer key · instrument', path: '/instruments/physics-key/',
    title: 'The physics answer key',
    alt: 'A thin level line with two solid curves leaving it from the same point, one climbing in small steps and one falling in small steps.',
    get svgRaw() {
      const K = require(path.join(ROOT, 'playground', 'physics-key', 'facts.js'));
      const x0 = 150, x1 = 1050, yL = 315, f = (v) => v.toFixed(1);
      const up = K.trace('top-euler-h0.002', 'T-ENERGY'), dn = K.trace('top-implicitfast-h0.002', 'T-ENERGY');
      const top = Math.max(up[up.length - 1], -dn[dn.length - 1]) * 1.1;
      const line = (t) => { const n = 240; let d = ''; for (let j = 0; j <= n; j++) { const k = Math.round(j * (t.length - 1) / n); d += (j ? 'L' : 'M') + f(x0 + j * (x1 - x0) / n) + ' ' + f(yL - t[k] / top * 150); } return d; };
      const o = ['<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="A level line and two curves leaving it, one up and one down" style="position:absolute;left:0;top:0">'];
      o.push('<line x1="' + x0 + '" y1="' + yL + '" x2="' + x1 + '" y2="' + yL + '" stroke="var(--ink-4)" stroke-width="1.2"/>');
      o.push('<path d="' + line(up) + '" fill="none" stroke="var(--ink)" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>');
      o.push('<path d="' + line(dn) + '" fill="none" stroke="var(--ink)" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>');
      o.push('<circle cx="' + x0 + '" cy="' + yL + '" r="7" fill="var(--ink)"/>');
      o.push('</svg>');
      return o.join('');
    } },
  /* an ART card for /reports/intmul.html (2026-11-18): the page's own figure without its words. A thin level line near the
     top (the machine's memory), and the memory of the three stopped checkers over their last hour, read from the record
     (certs/intmul-audit.json, memoryCurves): three lines that run level along the bottom and then climb to the line. The
     one checker that ran alone on the machine is the solid one. LIGHT theme, no number, no label. */
  intmul: { art: true, theme: 'light', eyebrow: 'Carlos Toledo · integer multiplication below n log n', path: '/reports/intmul.html',
    title: 'Integer multiplication below n log n: two Lean proofs, replayed by a second party',
    alt: 'Three lines running left to right along the bottom of the card, level for most of the way, then each climbing steeply to a thin level line near the top; one of the three is drawn heavier than the others.',
    get svgRaw() {
      const M = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'intmul-audit.json'), 'utf8')).memoryCurves;
      const x0 = 130, x1 = 1070, yB = 505, yT = 135, f = (v) => v.toFixed(1);
      const X = (m) => x0 + (m + 60) / 60 * (x1 - x0), Y = (g) => yB - g / M.limitGiB * (yB - yT);
      const d = (c) => c.points.map((q, k) => (k ? 'L' : 'M') + f(X(q[0])) + ' ' + f(Y(q[1]))).join(' ');
      const o = ['<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="Three lines level along the bottom, then climbing steeply to a thin line near the top" style="position:absolute;left:0;top:0">'];
      o.push('<line x1="' + x0 + '" y1="' + yT + '" x2="' + x1 + '" y2="' + yT + '" stroke="var(--ink-4)" stroke-width="1.2"/>');
      for (const c of M.series.filter((c) => c.id !== 'con-leche')) o.push('<path d="' + d(c) + '" fill="none" stroke="var(--ink-3)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>');
      const solid = M.series.find((c) => c.id === 'con-leche'), last = solid.points[solid.points.length - 1];
      o.push('<path d="' + d(solid) + '" fill="none" stroke="var(--ink)" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>');
      o.push('<circle cx="' + f(X(last[0])) + '" cy="' + f(Y(last[1])) + '" r="8" fill="var(--ink)"/>');
      o.push('</svg>');
      return o.join('');
    } },
  /* an ART card for /reports/blinking-light.html (2026-11-19): the page's own figure without its words, read from
     corpus/blinking-light/series.json: the upper bound as a heavy solid step line falling from the top, the lower bound
     as a lighter step line rising from the floor, the two ending close together with a dot; under them a row of small
     circles, filled or open at uneven spacing, the lamp as it is read at random moments. LIGHT theme, no number, no label. */
  'blinking-light': { art: true, theme: 'light', eyebrow: 'Carlos Toledo · the least dissipation of a blinking light', path: '/reports/blinking-light.html',
    title: 'The least dissipation behind a blinking light, narrowed from a factor of 25 to 3%',
    alt: 'Two step lines closing in from left to right, a heavy one stepping down from the top and a lighter one stepping up from below, ending close together; beneath them a row of small circles, some filled and some open, at uneven spacing.',
    get svgRaw() {
      const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'blinking-light', 'series.json'), 'utf8'));
      const hr = (t) => { const [h, mi, s] = t.split(':').map(Number); return h + mi / 60 + s / 3600; };
      const x0 = 130, x1 = 1070, yT = 170, yB = 440, t0 = 11, t1 = hr(S.end), lo = 0, hi = 0.52, f = (v) => v.toFixed(1);
      const X = (t) => x0 + (t - t0) / (t1 - t0) * (x1 - x0), Y = (v) => yT + (hi - v) / (hi - lo) * (yB - yT);
      const steps = (L) => { const P = []; L.forEach((e, i) => { const x = hr(e.at), y = Number(e.value); if (i) P.push([x, P[P.length - 1][1]]); P.push([x, y]); }); P.push([t1, P[P.length - 1][1]]); return P; };
      const d = (P) => P.map((q, k) => (k ? 'L' : 'M') + f(X(q[0])) + ' ' + f(Y(q[1]))).join(' ');
      const U = steps(S.upper), L = steps(S.lower), end = U[U.length - 1];
      const o = ['<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="Two step lines closing in, and a row of small filled and open circles beneath" style="position:absolute;left:0;top:0">'];
      o.push('<path d="' + d(L) + '" fill="none" stroke="var(--ink-3)" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>');
      o.push('<path d="' + d(U) + '" fill="none" stroke="var(--ink)" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/>');
      o.push('<circle cx="' + f(X(end[0])) + '" cy="' + f(Y(end[1])) + '" r="8" fill="var(--ink)"/>');
      /* the lamp, read at random moments: a fixed pseudo-random sequence (a linear congruential generator, seed 7) */
      let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
      let x = x0, on = true;
      while (x < x1) { if (rnd() < 0.35) on = !on;
        o.push('<circle cx="' + f(x) + '" cy="505" r="6" ' + (on ? 'fill="var(--ink)"' : 'fill="none" stroke="var(--ink-3)" stroke-width="1.8"') + '/>');
        x += 18 + rnd() * 34; }
      o.push('</svg>');
      return o.join('');
    } },
  /* an ART card for /reports/alpoge-grh.html (2026-11-21): the page's ring of checks without its words — 24 arcs in four
     groups (21 until 2026-11-23), all one tone so the card never states a check's result (a card is not re-rendered at every build) — and inside
     it the critical line, solid, with the first five zeros of ζ at their heights (quoted values). LIGHT theme, no number. */
  'alpoge-grh': { art: true, theme: 'light', eyebrow: 'Carlos Toledo · checking a Lean release on RH', path: '/reports/alpoge-grh.html',
    title: 'Checking Alpöge’s Lean release on RH and Dirichlet GRH',
    alt: 'A ring of twenty-four arcs in four groups, and inside it a vertical line with five dots on it at uneven heights.',
    get svgRaw() {
      const cx = 820, cy = 338, r = 184, sw = 24, n = 24, groups = [4, 8, 6, 6], gap = 0.035, gGap = 0.09, f = (v) => v.toFixed(1);
      const per = (2 * Math.PI - groups.length * gGap - (n - groups.length) * gap) / n;
      const arc = (a0, a1) => 'M' + f(cx + r * Math.cos(a0)) + ' ' + f(cy + r * Math.sin(a0)) + ' A' + r + ' ' + r + ' 0 0 1 ' + f(cx + r * Math.cos(a1)) + ' ' + f(cy + r * Math.sin(a1));
      const o = ['<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="A ring of twenty-four arcs, and inside it a vertical line with five dots" style="position:absolute;left:0;top:0">'];
      let ang = -Math.PI / 2 + gGap / 2;
      for (const g of groups) { for (let i = 0; i < g; i++) { o.push('<path d="' + arc(ang, ang + per) + '" fill="none" stroke="var(--ink-3)" stroke-width="' + sw + '"/>'); ang += per + (i < g - 1 ? gap : 0); } ang += gGap; }
      const yT = cy - r + 46, yB = cy + r - 46;
      o.push('<line x1="' + cx + '" y1="' + yT + '" x2="' + cx + '" y2="' + yB + '" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/>');
      for (const g of [14.134725, 21.022040, 25.010858, 30.424876, 32.935062]) o.push('<circle cx="' + cx + '" cy="' + f(yB - (g - 8) / 30 * (yB - yT)) + '" r="9" fill="var(--ink)"/>');
      o.push('</svg>');
      return o.join('');
    } },
  /* an ART card for /r310/ (2026-11-23, the live R(3,10) page): its case map without its words. A tree of twelve boxes
     from one root, left to right: the decided cases filled in ink, the open ones hollow; a second, lighter group below
     the cover for the other routes. (Until 2026-11-25 one box was drawn double and locked, the sealed case; the seal was
     opened on the operator's word that night and the case, still open, is drawn hollow like the others.)
     LIGHT theme, no number, no label. */
  r310: { art: true, theme: 'light', eyebrow: 'Carlos Toledo · R(3,10), in the open', path: '/r310/',
    title: 'R(3,10), in the open',
    alt: 'A tree of twelve boxes growing from one root to the right: some filled in ink, some hollow.',
    get svgRaw() {
      const o = ['<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="A tree of boxes, some filled, some hollow" style="position:absolute;left:0;top:0">'];
      const X = [140, 380, 640, 900], BW = [180, 200, 200, 180], BH = 40;
      /* rows of the leaves: deg4, c35, s8, near, the three codegree cases, then the other routes */
      const node = { root: [0, 3.6], deg4: [1, 0], c35: [1, 1], mtf: [1, 3.5], s8: [2, 2], near: [2, 3], caseR: [2, 5], r7: [3, 4], c6: [3, 5], r35: [3, 6], sym: [1, 7.5], build: [1, 8.5] };
      const kind = { root: 'open', deg4: 'decided', c35: 'decided', mtf: 'decided', s8: 'decided', near: 'open', caseR: 'open', r7: 'decided', c6: 'open', r35: 'open', sym: 'open', build: 'open' };
      const par = { deg4: 'root', c35: 'root', mtf: 'root', s8: 'mtf', near: 'mtf', caseR: 'mtf', r7: 'caseR', c6: 'caseR', r35: 'caseR', sym: 'root', build: 'root' };
      const Y = (r) => 150 + r * 44, P = (id) => ({ x: X[node[id][0]], y: Y(node[id][1]), w: BW[node[id][0]] });
      for (const [c, p] of Object.entries(par)) { const a = P(p), b = P(c), xm = a.x + a.w + 22; o.push('<path d="M' + (a.x + a.w) + ' ' + (a.y + BH / 2) + ' H' + xm + ' V' + (b.y + BH / 2) + ' H' + b.x + '" fill="none" stroke="var(--ink-4)" stroke-width="1.6"/>'); }
      for (const id of Object.keys(node)) {
        const p = P(id), k = kind[id];
        if (k === 'decided') o.push('<rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + BH + '" rx="6" fill="var(--ink)"/>');
        else if (k === 'open') o.push('<rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + BH + '" rx="6" fill="var(--surface)" stroke="var(--ink-3)" stroke-width="1.6"/>');
        else {
          o.push('<rect x="' + (p.x - 5) + '" y="' + (p.y - 5) + '" width="' + (p.w + 10) + '" height="' + (BH + 10) + '" rx="9" fill="var(--surface)" stroke="var(--ink)" stroke-width="2.6"/>');
          o.push('<rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + BH + '" rx="5" fill="none" stroke="var(--ink-3)" stroke-width="1.2"/>');
          const lx = p.x + 24, ly = p.y + 22;
          o.push('<path d="M' + (lx - 6) + ' ' + (ly - 2) + ' v-5 a6 6 0 0 1 12 0 v5" fill="none" stroke="var(--ink)" stroke-width="2"/><rect x="' + (lx - 9) + '" y="' + (ly - 2) + '" width="18" height="13" rx="2" fill="var(--ink)"/>');
          o.push('<rect x="' + (p.x + 46) + '" y="' + (p.y + 17) + '" width="110" height="7" rx="3.5" fill="var(--ink-5)"/><rect x="' + (p.x + 46) + '" y="' + (p.y + 17) + '" width="26" height="7" rx="3.5" fill="var(--ink)"/>');
        }
      }
      o.push('<line x1="380" y1="' + (Y(7.5) - 14) + '" x2="1080" y2="' + (Y(7.5) - 14) + '" stroke="var(--ink-5)" stroke-width="1.2"/>');
      o.push('</svg>');
      return o.join('');
    } },
  /* an ART card for /vp-vnp/ (2026-11-23, the live VP ≠ VNP audit): the page's rows without their words or states — one
     solid block at the left, the release, and from it five lines to five bands of small hollow tiles, the phases (2, 10,
     5, 2 and 4 rows), all one tone so the card never states a row's result (a card is not re-rendered at every build).
     LIGHT theme, no number, no label. */
  'vp-vnp': { art: true, theme: 'light', eyebrow: 'Carlos Toledo · the VP ≠ VNP claim, in the open', path: '/vp-vnp/',
    title: 'The VP ≠ VNP claim, checked in the open',
    alt: 'One solid block at the left; from it, five lines to five bands of small hollow tiles, of two, ten, five, two and four tiles.',
    svgRaw: (() => {
      const o = ['<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="One solid block; five lines to five bands of hollow tiles" style="position:absolute;left:0;top:0">'];
      const bands = [2, 10, 5, 2, 4], bx = 130, bw = 120, bh = 150, by = 240, tx = 400, tw = 52, th = 36, gx = 12, y0 = 150, dy = 72;
      o.push('<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + bh + '" rx="6" fill="var(--ink)"/>');
      bands.forEach((n, k) => {
        const y = y0 + k * dy;
        o.push('<path d="M' + (bx + bw) + ' ' + (by + bh / 2) + ' C' + (bx + bw + 70) + ' ' + (by + bh / 2) + ' ' + (tx - 80) + ' ' + (y + th / 2) + ' ' + (tx - 12) + ' ' + (y + th / 2) + '" fill="none" stroke="var(--ink-4)" stroke-width="1.6"/>');
        for (let i = 0; i < n; i++) o.push('<rect x="' + (tx + i * (tw + gx)) + '" y="' + y + '" width="' + tw + '" height="' + th + '" rx="5" fill="var(--surface)" stroke="var(--ink-3)" stroke-width="1.6"/>');
      });
      o.push('</svg>');
      return o.join('');
    })() },
  /* an ART card for /omega/ (2026-11-25, the live ω = 9/4 audit): the page's rows without their words or states — one
     solid block at the left, the release, and from it three lines to three bands of small hollow tiles, the phases (13,
     4 and 3 rows), all one tone so the card never states a row's result (a card is not re-rendered at every build).
     LIGHT theme, no number, no label. */
  'omega': { art: true, theme: 'light', eyebrow: 'Carlos Toledo · the exponent of matrix multiplication, in the open', path: '/omega/',
    title: 'The claim that matrix multiplication has exponent 9/4, checked in the open',
    alt: 'One solid block at the left; from it, three lines to three bands of small hollow tiles, of thirteen, four and three tiles.',
    svgRaw: (() => {
      const o = ['<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="One solid block; three lines to three bands of hollow tiles" style="position:absolute;left:0;top:0">'];
      const bands = [13, 4, 3], bx = 140, bw = 120, bh = 150, by = 240, tx = 400, tw = 44, th = 40, gx = 10, y0 = 192, dy = 96;
      o.push('<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + bh + '" rx="6" fill="var(--ink)"/>');
      bands.forEach((n, k) => {
        const y = y0 + k * dy;
        o.push('<path d="M' + (bx + bw) + ' ' + (by + bh / 2) + ' C' + (bx + bw + 70) + ' ' + (by + bh / 2) + ' ' + (tx - 80) + ' ' + (y + th / 2) + ' ' + (tx - 12) + ' ' + (y + th / 2) + '" fill="none" stroke="var(--ink-4)" stroke-width="1.6"/>');
        for (let i = 0; i < n; i++) o.push('<rect x="' + (tx + i * (tw + gx)) + '" y="' + y + '" width="' + tw + '" height="' + th + '" rx="5" fill="var(--surface)" stroke="var(--ink-3)" stroke-width="1.6"/>');
      });
      o.push('</svg>');
      return o.join('');
    })() },
  /* an ART card for /delta3-hol4/ (2026-11-25, the live δ₃-in-HOL4 page): the page's figures without their words or
     states — a solid band across the top (the soundness proof, proved since 25 Nov ~17:46 UTC), under it five solid blocks
     at the true widths of the five regions the certificates cover on [0, 1/2], and below a line, two rows of nine small
     filled tiles, the two families' batches (all finished), all one tone so the card states no score.
     LIGHT theme, no number, no label. */
  'delta3-hol4': { art: true, theme: 'light', eyebrow: 'Carlos Toledo · a certificate checker in HOL4, in the open', path: '/delta3-hol4/',
    title: 'δ₃ in HOL4: the checker and its blind benchmark, live',
    alt: 'A solid band across the top; under it five solid blocks of unequal width side by side; below a thin line, two rows of nine small filled tiles.',
    svgRaw: (() => {
      const o = ['<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="A solid band; five solid blocks of unequal width; two rows of nine filled tiles" style="position:absolute;left:0;top:0">'];
      o.push('<defs><pattern id="og-void" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="var(--surface)"/><path d="M0,9 l9,-9 M-2.25,2.25 l4.5,-4.5 M6.75,11.25 l4.5,-4.5" stroke="var(--ink-5)" stroke-width="0.9" fill="none"/></pattern></defs>');
      const x0 = 140, x1 = 1060, W = x1 - x0, cuts = [0, 1 / 5, 3 / 10, 2 / 5, 9 / 20, 1 / 2];
      o.push('<rect x="' + x0 + '" y="164" width="' + W + '" height="42" rx="5" fill="var(--ink-3)"/>');
      for (let k = 0; k < 5; k++) { const a = x0 + cuts[k] / 0.5 * W, b = x0 + cuts[k + 1] / 0.5 * W; o.push('<rect x="' + (a + (k ? 5 : 0)).toFixed(1) + '" y="224" width="' + (b - a - (k ? 5 : 0) - (k < 4 ? 5 : 0)).toFixed(1) + '" height="92" rx="6" fill="var(--ink)"/>'); }
      o.push('<line x1="' + x0 + '" y1="342" x2="' + x1 + '" y2="342" stroke="var(--ink-4)" stroke-width="1.6"/>');
      const tw = (W - 8 * 14) / 9;
      for (const y of [374, 430]) for (let i = 0; i < 9; i++) o.push('<rect x="' + (x0 + i * (tw + 14)).toFixed(1) + '" y="' + y + '" width="' + tw.toFixed(1) + '" height="40" rx="5" fill="var(--ink-4)"/>');
      o.push('</svg>');
      return o.join('');
    })() },
  /* an ART card for /reports/twelve-blocks-exact.html (2026-11-19): the page's own figure without its words, read from the
     record (certs/twelve-blocks-exact.json) and the first run's table: what is left of the minimum after its two leading
     terms, a heavy solid line where the value is decided (n = 1..95) ending in a dot, and a lighter line continuing
     where it is only proposed. LIGHT theme, no number, no label. */
  'twelve-blocks-exact': { art: true, theme: 'light', eyebrow: 'Carlos Toledo · fifty new exact values', path: '/reports/twelve-blocks-exact.html',
    title: 'Fifty new exact values for a colouring problem, each with a certificate',
    alt: 'A jagged line running left to right, drawn heavy and solid for its first half and ending in a dot, then continuing lighter to the right edge.',
    get svgRaw() {
      const R = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'twelve-blocks-exact.json'), 'utf8')).statements.U1.detail.rows;
      const TB = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'twelve-blocks', 'run', 'gpt', 'optimum-residues.json'), 'utf8'));
      const c = {}; for (const x of TB) c[x.residue] = x.excess_numerator;
      const x0 = 130, x1 = 1070, yT = 190, yB = 470, XM = 190, lo = -0.8, hi = 1.7, f = (v) => v.toFixed(1);
      const X = (n) => x0 + (n - 1) / (XM - 1) * (x1 - x0), Y = (v) => yT + (hi - v) / (hi - lo) * (yB - yT);
      const dec = R.map((r) => [r.n, (2192 * r.V - (117 * r.n * r.n - 1096 * r.n)) / 2192]);
      const pro = []; for (let n = R.length; n <= XM; n++) pro.push([n, c[n % 1096] / 2192]);
      const d = (P) => P.map((q, k) => (k ? 'L' : 'M') + f(X(q[0])) + ' ' + f(Y(q[1]))).join(' ');
      const last = dec[dec.length - 1];
      const o = ['<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="A jagged line, heavy and solid for its first half and ending in a dot, then continuing lighter" style="position:absolute;left:0;top:0">'];
      o.push('<path d="' + d(pro) + '" fill="none" stroke="var(--ink-3)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>');
      o.push('<path d="' + d(dec) + '" fill="none" stroke="var(--ink)" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/>');
      o.push('<circle cx="' + f(X(last[0])) + '" cy="' + f(Y(last[1])) + '" r="8" fill="var(--ink)"/>');
      o.push('</svg>');
      return o.join('');
    } },
  /* an ART card for /reports/twelve-blocks.html (2026-11-19): the twelve blocks themselves, at their true proportions
     (28, 6, 28, 37, 59, 116, 116, 59, 37, 28, 6, 28 out of 548), red blocks solid and blue blocks outlined, with the
     integer lattice as a row of ticks under them. LIGHT theme, no number, no label. */
  'twelve-blocks': { art: true, theme: 'light', eyebrow: 'Carlos Toledo · twelve blocks on the integers', path: '/reports/twelve-blocks.html',
    title: 'Twelve blocks on the integers: two AI models propose an exact minimum',
    alt: 'A horizontal band cut into twelve blocks of unequal width, alternately solid and outlined, symmetric about its middle, with a row of fine evenly spaced ticks beneath it.',
    svgRaw: (() => {
      const Wd = [28, 6, 28, 37, 59, 116, 116, 59, 37, 28, 6, 28], x0 = 130, x1 = 1070, yT = 330, yB = 440, f = (v) => v.toFixed(1);
      const o = ['<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="Twelve blocks of unequal width in a row, alternately solid and outlined, with a row of ticks beneath" style="position:absolute;left:0;top:0">'];
      let x = x0;
      Wd.forEach((w, i) => { const wd = w / 548 * (x1 - x0);
        o.push(i % 2 === 0 ? '<rect x="' + f(x) + '" y="' + yT + '" width="' + f(wd) + '" height="' + (yB - yT) + '" fill="var(--ink)"/>'
          : '<rect x="' + f(x + 1.2) + '" y="' + (yT + 1.2) + '" width="' + f(wd - 2.4) + '" height="' + (yB - yT - 2.4) + '" fill="none" stroke="var(--ink-3)" stroke-width="2.4"/>');
        x += wd; });
      for (let k = 0; k <= 137; k++) { const tx = x0 + k / 137 * (x1 - x0); o.push('<line x1="' + f(tx) + '" y1="' + (yB + 22) + '" x2="' + f(tx) + '" y2="' + (yB + (k % 137 === 0 ? 40 : 32)) + '" stroke="var(--ink-4)" stroke-width="1.2"/>'); }
      o.push('</svg>');
      return o.join('');
    })() },
  /* an ART card for /reports/mfg-two-models.html (2026-11-18): the page's own figure without its words, read from the
     record (certs/mfg-two-models.json, uniqueness.curve). Two curves leave almost the same point at the left and part:
     the heavy one is where the uniqueness argument stops, the lighter one the first fold. LIGHT theme, no number, no
     label. */
  'mfg-two-models': { art: true, theme: 'light', eyebrow: 'Carlos Toledo · a mean-field game, two AI models', path: '/reports/mfg-two-models.html',
    title: 'Two AI models on a mean-field game: claims decided, proofs read',
    alt: 'Two curves that leave nearly the same point at the left of the card and part as they run right: a heavy one rising gently and ending in a dot, and a lighter one falling away below it.',
    get svgRaw() {
      const C = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'mfg-two-models.json'), 'utf8')).uniqueness.curve.filter((q) => q.depthFloat <= 1.2 + 1e-9 && q.GFloat !== null);
      const x0 = 130, x1 = 1070, yT = 150, yB = 500, lo = -12.6, hi = -6.6, f = (v) => v.toFixed(1);
      const X = (a) => x0 + a / 1.2 * (x1 - x0), Y = (c) => yT + (hi - c) / (hi - lo) * (yB - yT);
      const d = (get) => C.map((q, k) => (k ? 'L' : 'M') + f(X(q.depthFloat)) + ' ' + f(Y(get(q)))).join(' ');
      const last = C[C.length - 1];
      const o = ['<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="Two curves leaving nearly the same point and parting: a heavy one rising, a lighter one falling below it" style="position:absolute;left:0;top:0">'];
      o.push('<path d="' + d((q) => q.foldFloat) + '" fill="none" stroke="var(--ink-3)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>');
      o.push('<path d="' + d((q) => -q.GFloat) + '" fill="none" stroke="var(--ink)" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>');
      o.push('<circle cx="' + f(X(last.depthFloat)) + '" cy="' + f(Y(-last.GFloat)) + '" r="8" fill="var(--ink)"/>');
      o.push('</svg>');
      return o.join('');
    } },
  /* an ART card for /instruments/textbook-machine/ (2026-11-12): the four-state busy beaver's whole run, read from the
     instrument's record (playground/textbook-machine/out/facts.json), time running left to right, one column per step and
     one row per cell of the tape; a 1 is a solid cell, and the head's path is a faint line through them. Every mark is a
     decided run, so every mark is solid. LIGHT theme, no number, no title text. */
  'textbook-machine': { art: true, theme: 'light', eyebrow: 'Carlos Toledo · the textbook machine', path: '/instruments/textbook-machine/',
    title: 'The textbook machine',
    alt: 'The whole run of a four-state Turing machine, time running left to right: a staircase of solid cells that grows and shifts as the head sweeps back and forth, a faint line tracing the head.',
    svgRaw: (() => {
      const F = JSON.parse(fs.readFileSync(path.join(ROOT, 'playground', 'textbook-machine', 'out', 'facts.json'), 'utf8')).spacetime;
      const T = F.rows.length, H = F.rows[0].length, x0 = 140, x1 = 1060, cw = (x1 - x0) / T, ch = 17, y0 = 315 - (H * ch) / 2, f = (v) => v.toFixed(1);
      const o = ['<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="The four-state champion’s run, time left to right" style="position:absolute;left:0;top:0">'];
      let d = '';
      F.rows.forEach((row, t) => { for (let i = 0; i < H; i++) if (row[i] === '1') d += 'M' + f(x0 + t * cw) + ' ' + f(y0 + (H - 1 - i) * ch) + 'h' + f(cw - 1.2) + 'v' + (ch - 1.6) + 'h-' + f(cw - 1.2) + 'Z'; });
      o.push('<path d="' + d + '" fill="var(--ink)"/>');
      let h = '';
      F.heads.forEach((p, t) => { h += (t ? 'L' : 'M') + f(x0 + t * cw + cw / 2) + ' ' + f(y0 + (H - 1 - (p - F.lo)) * ch + ch / 2); });
      o.push('<path d="' + h + '" fill="none" stroke="var(--ink-3)" stroke-width="1.6" stroke-linejoin="round"/>');
      o.push('<line x1="' + x0 + '" y1="' + f(y0 + H * ch + 14) + '" x2="' + x1 + '" y2="' + f(y0 + H * ch + 14) + '" stroke="var(--ink-4)" stroke-width="1.2"/>');
      o.push('</svg>');
      return o.join('');
    })() },
  /* an ART card for /instruments/textbook-machine/claims/ (2026-11-12): the page's claims as it serves them, one line each,
     read from the page's own set (playground/textbook-machine/claims.set.js): the line is as long as the claim's sentence,
     and it ends in the shape of the word the claim wears as it stands, in the chip grammar (filled: certified; outlined:
     refuted; hollow and square: refused). Shapes only: LIGHT theme, no number, no word, no title text. */
  'textbook-machine-claims': { art: true, theme: 'light', eyebrow: 'Carlos Toledo · the textbook machine · claims', path: '/instruments/textbook-machine/claims/',
    title: 'Real claims, decided in your tab',
    alt: 'A column of lines, one for each claim, each ending in one of three shapes: a filled pill for certified, an outlined pill for refuted, a hollow square-cornered box for refused.',
    svgRaw: (() => {
      const SET = require(path.join(ROOT, 'playground', 'textbook-machine', 'claims.set.js'));
      const V = require(path.join(ROOT, 'instruments', 'verdict.js'));
      const rows = SET.served().map((c) => ({ len: c.variants[0].say.replace(/<[^>]+>/g, '').length, word: c.variants[0].expect }));
      const max = Math.max(...rows.map((r) => r.len)), x0 = 170, x1 = 830, gap = Math.min(80, 330 / rows.length), y0 = 315 - (gap * (rows.length - 1)) / 2;
      const o = ['<svg viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="One line for each claim, each ending in the shape of its word" style="position:absolute;left:0;top:0">'];
      rows.forEach((r, i) => {
        const y = y0 + i * gap, w = (x1 - x0) * r.len / max;
        o.push('<line x1="' + x0 + '" y1="' + y.toFixed(1) + '" x2="' + (x0 + w).toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="var(--ink)" stroke-width="10" stroke-linecap="round"/>');
        o.push('<line x1="' + (x0 + w + 24).toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="868" y2="' + y.toFixed(1) + '" stroke="var(--ink-4)" stroke-width="1.4"/>');
        o.push(r.word === V.CERTIFIED ? '<rect x="884" y="' + (y - 23).toFixed(1) + '" width="146" height="46" rx="23" fill="var(--ink)" stroke="var(--ink)" stroke-width="2.4"/>'
          : r.word === V.REFUTED ? '<rect x="884" y="' + (y - 23).toFixed(1) + '" width="146" height="46" rx="23" fill="none" stroke="var(--ink)" stroke-width="2.4"/>'
          : '<rect x="884" y="' + (y - 23).toFixed(1) + '" width="146" height="46" rx="4" fill="none" stroke="var(--ink-3)" stroke-width="2"/>');
      });
      o.push('</svg>');
      return o.join('');
    })() },
  /* the home page's own card (2026-11-11, the operator's headline "Looks right? Zoom in."): LIGHT, the headline and one
     sentence beside the two circles at the overlap. The two circles are the pair the claims record names, drawn at
     their true places and sizes from the pinned bytes (the same file tools/home-page.js reads, refused there on a
     sha256 mismatch), touching to the eye; a loupe beside them shows what the zoom shows, the two edges crossed, the
     overlap filled in ink and marked with the witness ×. The loupe's magnification is a picture, and no number is on
     the card. The source of the circles is not named on it (it is credited in the page's footer). */
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
      const d = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / d, uy = (B[1] - A[1]) / d, t = A[2] - (A[2] + B[2] - d) / 2;
      /* the pair at its true geometry, fitted into the upper left of the drawing */
      const x0 = Math.min(A[0] - A[2], B[0] - B[2]), y0 = Math.min(A[1] - A[2], B[1] - B[2]);
      const K = 270 / Math.max(Math.max(A[0] + A[2], B[0] + B[2]) - x0, Math.max(A[1] + A[2], B[1] + B[2]) - y0);
      const X = (v) => 14 + (v - x0) * K, Y = (v) => 14 + (v - y0) * K, f = (v) => v.toFixed(2);
      const px = X(A[0] + ux * t), py = Y(A[1] + uy * t);
      /* the loupe: what the zoom shows at the point, turned as the pair is turned */
      const lx = 356, ly = 352, lr = 106, gap = 40, ang = Math.atan2(uy, ux) * 180 / Math.PI, a2 = Math.atan2(ly - py, lx - px);
      const o = ['<svg viewBox="0 0 470 470" width="470" height="470" role="img" aria-label="Two circles that look as if they touch; a loupe on the point where they meet shows that they overlap, the overlap marked with a red cross">'];
      o.push('<defs><clipPath id="og-loupe"><circle cx="' + lx + '" cy="' + ly + '" r="' + lr + '"/></clipPath></defs>');
      for (const c of [A, B]) o.push('<circle cx="' + f(X(c[0])) + '" cy="' + f(Y(c[1])) + '" r="' + f(c[2] * K) + '" fill="var(--band-fill)" stroke="var(--ink)" stroke-width="1.8"/>');
      o.push('<circle cx="' + f(px) + '" cy="' + f(py) + '" r="13" fill="none" stroke="var(--ink-3)" stroke-width="1.2" stroke-dasharray="' + G.GUIDE + '"/>');
      o.push('<line x1="' + f(px + 13 * Math.cos(a2)) + '" y1="' + f(py + 13 * Math.sin(a2)) + '" x2="' + f(lx - lr * Math.cos(a2)) + '" y2="' + f(ly - lr * Math.sin(a2)) + '" stroke="var(--ink-3)" stroke-width="1.2" stroke-dasharray="' + G.GUIDE + '"/>');
      o.push('<circle cx="' + lx + '" cy="' + ly + '" r="' + lr + '" fill="var(--paper)"/>');
      o.push('<g clip-path="url(#og-loupe)"><g transform="translate(' + lx + ' ' + ly + ') rotate(' + f(ang) + ')">');
      o.push('<rect x="-300" y="-300" width="' + (300 + gap / 2) + '" height="600" fill="var(--band-fill)"/><rect x="' + (-gap / 2) + '" y="-300" width="' + (300 + gap / 2) + '" height="600" fill="var(--band-fill)"/>');
      o.push('<rect x="' + (-gap / 2) + '" y="-300" width="' + gap + '" height="600" fill="var(--ink)" opacity="0.26"/>');
      o.push('<line x1="' + (gap / 2) + '" y1="-300" x2="' + (gap / 2) + '" y2="300" stroke="var(--ink)" stroke-width="1.8"/><line x1="' + (-gap / 2) + '" y1="-300" x2="' + (-gap / 2) + '" y2="300" stroke="var(--ink)" stroke-width="1.8"/>');
      o.push('</g></g>');
      o.push('<circle cx="' + lx + '" cy="' + ly + '" r="' + lr + '" fill="none" stroke="var(--ink)" stroke-width="1.8"/>');
      o.push(W.witnessMark(lx, ly, { size: 10, width: 3.6 }));
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

/* the Atalaia cards (2026-11-16): drawn in apps/atalaia/cartoes.js from that app's pinned records, read only when one of
   them is asked for, so no other card depends on those records */
const ATALAIA = () => require(path.join(ROOT, 'apps', 'atalaia', 'cartoes.js')).cards();
const card = (key) => CARDS[key] || (/^atalaia(-|$)/.test(key) ? ATALAIA()[key] : undefined);

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
  const c = card(key);
  if (!c) throw new Error('no card named ' + key + ' (known: ' + Object.keys(CARDS).join(', ') + ', and atalaia*)');
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
    key, path: c.path, eyebrow: c.eyebrow, title: c.title, description: c.art ? c.alt : (c.deck || c.alt), art: !!c.art, theme: c.theme || 'dark', width: w, height: h, bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex'), rendered: new Date().toISOString().slice(0, 10) };
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
  const keys = process.argv.includes('--all') ? Object.keys(CARDS).concat(Object.keys(ATALAIA())) : process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (!keys.length) { console.error('usage: node tools/build-og-report.js <key> | --all   (keys: ' + Object.keys(CARDS).join(', ') + ')'); process.exit(2); }
  (async () => { for (const k of keys) await build(k); })().catch((e) => { console.error('OG-REPORT REFUSED: ' + e.message); process.exit(1); });
}
