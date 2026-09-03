/* instruments/covering — the one covering auditor.

   Several of this repository's theorems have the shape "for every parameter in
   a region", proved by cutting the region into pieces and certifying each. The
   way such a proof fails is almost never arithmetic: it is COVERING. If the
   pieces do not actually tile the region, the quantified statement is false no
   matter how good each piece is, and the gap is invisible inside any single
   certificate.

   This module exists because the check was written twice — once for the ember
   band's chunk and sigma-cell ladders, once for the erdos1038 eps-family rung
   ladder — and CLAUDE.md's rule is that a rule defined twice will diverge.
   Consumers: instruments/emberband, instruments/lemniscate, and the two MFG
   regime maps.

   tileGaps(pieces, lo, hi, opts) is the whole idea: hand it intervals in any
   order and it reports whether they tile [lo, hi] with shared endpoints.
     · opts.rel  compare endpoints relatively (for geometric ladders spanning
                 many decades, where an absolute epsilon is meaningless)
     · opts.eps  the tolerance; endpoints must MATCH, not merely be near
   Overlaps are reported but are NOT failures: a covering may overlap, it may
   not have holes. */
'use strict';

function tileGaps(pieces, lo, hi, opts) {
  const o = opts || {};
  const eps = o.eps === undefined ? 1e-12 : o.eps;
  const rel = !!o.rel;
  const near = (a, b) => Math.abs(a - b) <= (rel ? eps * Math.max(Math.abs(a), Math.abs(b), Number.MIN_VALUE) : eps);

  const out = { ok: true, pieces: 0, gaps: [], overlaps: [], startsAt: null, endsAt: null, empty: [], problems: [] };
  const iv = (pieces || []).map((p) => (Array.isArray(p) ? { lo: p[0], hi: p[1] } : { lo: p.lo, hi: p.hi }))
    .filter((p) => Number.isFinite(p.lo) && Number.isFinite(p.hi));
  out.pieces = iv.length;
  if (!iv.length) { out.ok = false; out.problems.push('no pieces'); return out; }

  /* An empty or inverted piece covers nothing. That is a fact about the piece,
     NOT a hole in the region, so it is excluded from the tiling walk and
     reported for the caller to judge — a zero-width piece in a CERTIFIED
     decomposition is worth surfacing (its certificate covers an empty set)
     but it must not be counted as a gap. What it must never do is paper over a
     real gap, which is why it is removed before the walk rather than treated
     as a bridge. */
  const live = [];
  for (const p of iv) (p.hi > p.lo ? live : out.empty).push(p);
  out.degenerate = out.empty.length;
  if (out.empty.length) out.notes = out.empty.length + ' piece(s) cover nothing (zero-width or inverted); excluded from the tiling';
  if (!live.length) { out.ok = false; out.problems.push('every piece is empty'); return out; }
  iv.length = 0; iv.push(...live);

  iv.sort((a, b) => a.lo - b.lo);
  out.startsAt = iv[0].lo;
  out.endsAt = iv[iv.length - 1].hi;
  if (!near(out.startsAt, lo)) { out.ok = false; out.problems.push('starts at ' + out.startsAt + ', not ' + lo); }
  if (!near(out.endsAt, hi)) { out.ok = false; out.problems.push('ends at ' + out.endsAt + ', not ' + hi); }

  /* walk a watermark: the covering is gapless iff the next piece starts at or
     before the furthest point covered so far */
  let mark = iv[0].hi;
  for (let i = 1; i < iv.length; i++) {
    const p = iv[i];
    if (p.lo > mark && !near(p.lo, mark)) {
      out.ok = false;
      out.gaps.push({ from: mark, to: p.lo, size: p.lo - mark });
    } else if (p.lo < mark && !near(p.lo, mark)) {
      out.overlaps.push({ from: p.lo, to: mark });
    }
    if (p.hi > mark) mark = p.hi;
  }
  if (out.gaps.length) out.problems.push(out.gaps.length + ' gap(s), worst ' + Math.max(...out.gaps.map((g) => g.size)).toExponential(3));
  return out;
}

/* a one-line summary fit for a check detail */
function describe(r) {
  if (r.ok) return r.pieces + ' pieces tile [' + r.startsAt + ', ' + r.endsAt + '] with no gap'
    + (r.overlaps.length ? ' (' + r.overlaps.length + ' benign overlap(s))' : '')
    + (r.degenerate ? ' (' + r.degenerate + ' zero-width piece(s) excluded)' : '');
  return r.problems.join('; ');
}

/* ---- 2D: axis-aligned boxes over a rectangle ----------------------------
   An adaptive 2D subdivision (a quadtree) is checked by AREA ACCOUNTING: every
   cell must lie inside the region, and the areas must sum to the region's
   area. If both hold, the union covers the region up to a set of measure zero
   — because any uncovered patch of positive area would leave the sum short,
   and any overlap would push it over.

   The honest limit, stated because it matters: this proves covering ALMOST
   EVERYWHERE, not everywhere. For a tally over a partition (how many cells
   are UNIQUE / MULTIPLE / UNDECIDED) that is exactly the right guarantee — it
   is what makes the counts add up without double counting or lost area. For a
   claim quantified over EVERY parameter it is not sufficient on its own, and a
   consumer making such a claim needs the boundary handled separately. */
function tileArea2D(boxes, region, opts) {
  const o = opts || {};
  const tol = o.tol === undefined ? 1e-9 : o.tol;
  const out = { ok: true, boxes: 0, areaSum: 0, regionArea: 0, outside: [], degenerate: 0, problems: [] };
  const R = { x: [region.x[0], region.x[1]], y: [region.y[0], region.y[1]] };
  out.regionArea = (R.x[1] - R.x[0]) * (R.y[1] - R.y[0]);
  const bs = (boxes || []).filter((b) => b && Array.isArray(b.x) && Array.isArray(b.y));
  out.boxes = bs.length;
  if (!bs.length) { out.ok = false; out.problems.push('no boxes'); return out; }
  const inside = (b) => b.x[0] >= R.x[0] - tol && b.x[1] <= R.x[1] + tol
    && b.y[0] >= R.y[0] - tol && b.y[1] <= R.y[1] + tol;
  for (const b of bs) {
    const a = (b.x[1] - b.x[0]) * (b.y[1] - b.y[0]);
    if (!(a > 0)) { out.degenerate++; continue; }
    if (!inside(b)) { if (out.outside.length < 5) out.outside.push(b); continue; }
    out.areaSum += a;
  }
  if (out.outside.length) { out.ok = false; out.problems.push(out.outside.length + '+ box(es) fall outside the region'); }
  const rel = Math.abs(out.areaSum - out.regionArea) / out.regionArea;
  out.areaRelError = rel;
  if (rel > tol) { out.ok = false; out.problems.push('areas sum to ' + out.areaSum + ', region is ' + out.regionArea + ' (relative error ' + rel.toExponential(3) + ')'); }
  return out;
}
function describe2D(r) {
  if (r.ok) return r.boxes + ' boxes account for the region exactly (relative area error '
    + r.areaRelError.toExponential(2) + ')' + (r.degenerate ? ', ' + r.degenerate + ' zero-area excluded' : '');
  return r.problems.join('; ');
}

module.exports = { tileGaps, describe, tileArea2D, describe2D };
