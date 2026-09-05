/**
 * contact.mjs — many rollouts, one image.
 *
 * A full node graph is unreadable at thumbnail size, so a rollout is reduced to
 * the only topology that matters: an instrument's output ports, with the one
 * that fired filled and the one that should have fired ringed. Aligned ring and
 * fill is a pass; a ring with no fill beside it is a miss, and you can read a
 * whole run's failure shape without reading a single number.
 *
 * The ink follows the same rule as everywhere else and is still not chosen: the
 * left edge of each cell is solid when the rollout declared the reference it
 * actually decided against, and dashed when it slipped. A column of dashed
 * edges under a column of correct verdicts is a model getting the right answer
 * for a reason it did not state, which is the failure this whole grammar exists
 * to make visible.
 */

/* the cells must dominate the width or the sheet reads as a table of labels
   with a chart attached, which is the wrong way round. */
const SLOT = 9, GAP = 3.5, CW = 15, ROWLAB = 112, PORTLAB = 68, ROWGAP = 19, PAD = 14;
const LABW = ROWLAB + PORTLAB;

/** cells: [{ fired, truth, wellFormed }], rows: [{ label, cells }] */
export function contactSheet(rows, ports, { title = '', scale = 1, note = '' } = {}) {
  const cellH = ports.length * (SLOT + GAP) - GAP;
  const nCols = Math.max(...rows.map((r) => r.cells.length));
  /* the caption is drawn inside the viewBox, so the viewBox has to be wide
     enough for it or it is silently clipped at the right edge */
  const W = Math.max(LABW + nCols * CW + PAD * 2, note.length * 4.5 + PAD * 2);
  const H = PAD + rows.length * (cellH + ROWGAP) + PAD + (title ? 22 : 0) + (note ? 18 : 0);
  const parts = [];
  if (title) parts.push(`<text x="${PAD}" y="16" class="ct">${title}</text>`);

  /* the port names once, in their own gutter, so they cannot collide with the
     row labels beside them */
  ports.forEach((p, i) => {
    const y = PAD + (title ? 22 : 0) + i * (SLOT + GAP) + SLOT - 1;
    parts.push(`<text x="${LABW - 7}" y="${y}" class="cp" text-anchor="end">${p}</text>`);
  });

  rows.forEach((row, r) => {
    const y0 = PAD + (title ? 22 : 0) + r * (cellH + ROWGAP);
    parts.push(`<text x="${PAD}" y="${y0 + cellH / 2 + 3}" class="cl">${row.label}</text>`);
    row.cells.forEach((c, k) => {
      const x = LABW + k * CW;
      ports.forEach((p, i) => {
        const y = y0 + i * (SLOT + GAP);
        const fired = c.fired === p, truth = c.truth === p;
        parts.push(`<rect x="${x}" y="${y}" width="${SLOT}" height="${SLOT}" rx="1" class="cs${fired ? ' fired' : ''}"/>`);
        /* the truth ring sits OUTSIDE the square. Stroking the square itself
           puts a white ring on a white fill, which is invisible exactly where
           it matters -- on the cells that got it right. */
        if (truth) parts.push(`<rect x="${x - 2}" y="${y - 2}" width="${SLOT + 4}" height="${SLOT + 4}" rx="2" class="ck"/>`);
      });
      /* the reference, read not chosen. Underneath the cell rather than beside
         it: a vertical rule between columns reads as a separator and starts
         organising the picture into something it is not. */
      parts.push(`<line x1="${x}" y1="${y0 + cellH + 4}" x2="${x + SLOT}" y2="${y0 + cellH + 4}" class="cr ${c.wellFormed ? 'solid' : 'dashed'}"/>`);
    });
  });
  if (note) parts.push(`<text x="${PAD}" y="${H - 6}" class="cn">${note}</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${Math.round(W * scale)}" class="cg">
<style>${CONTACT_CSS}</style><rect width="${W}" height="${H}" class="cbg"/>${parts.join('')}</svg>`;
}

export const CONTACT_CSS = `
.cg .cbg { fill:#0a0a0c; }
.cg .cs { fill:#f6f6f8; fill-opacity:.05; stroke:none; }
.cg .cs.fired { fill-opacity:.92; }
/* fill inside a ring is right; a fill with no ring is a wrong answer; a ring
   with no fill is the answer it missed. */
.cg .ck { fill:none; stroke:#f6f6f8; stroke-opacity:.5; stroke-width:1; }
.cg .cl { fill:#9a9aa6; font-family:ui-monospace,Menlo,monospace; font-size:9px; }
.cg .cp { fill:#5f5f6b; font-family:ui-monospace,Menlo,monospace; font-size:6.5px; }
.cg .ct { fill:#e8e8ee; font-family:ui-monospace,Menlo,monospace; font-size:10px; letter-spacing:.1em; }
.cg .cn { fill:#6e6e7a; font-family:ui-monospace,Menlo,monospace; font-size:8px; }
.cg .cr { stroke:#f6f6f8; stroke-width:1.6; }
.cg .cr.solid { stroke-opacity:.55; }
.cg .cr.dashed { stroke-opacity:.28; stroke-dasharray:1.5 2; }`;
