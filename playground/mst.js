/* mst.js — is a drawn minimum spanning tree the only one? ONE module for every instrument that draws a tree.

   WHY ONE (2026-10-28). The test was written inside playground/neural-geometry/plate.js and answer-shape and
   exact-geometry reached into that page's plate to borrow it; affect needed it too. A rule two pages read lives
   once (the corpus.js lesson), so it lives here and every tree-drawing page requires this file.

   WHAT IT DECIDES (WARRANT v2, rules 2 and 3). The decide.js files build the tree with a strict "<", so where two
   edges tie the first one found wins: a tie-break, and a tree picked by a tie-break is ONE MEMBER of the set of
   minimum spanning trees the numbers admit — CHOSEN, drawn dotted, said "one of several". Two textbook facts, both
   exact here:
     · MEMBER: a spanning tree is minimum iff no edge outside it is strictly shorter than the longest edge on the
       tree path between its ends (the cycle property). A tree that fails this is no member of the set it claims to
       be picked from, and check() refuses it rather than drawing it.
     · UNIQUE: the minimum tree is the only one iff every edge outside it is strictly LONGER than that path maximum.
   EXACT ON THESE NUMBERS. The tables are integers or integers over two (two answers, asked both ways round, averaged),
   so every distance is a double with no rounding in it and every comparison below is exact. check() refuses a
   distance that is not a multiple of ½ instead of comparing a rounded one: a tie could hide in the rounding. */
'use strict';

function check(D, mst) {
  const n = D.length;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const v = D[i][j];
    if (!Number.isSafeInteger(2 * v)) throw new Error(`mst.js: D[${i}][${j}] = ${v} is not a multiple of ½; the tie test would compare a rounded number`);
  }
  if (!Array.isArray(mst) || mst.length !== n - 1) throw new Error(`mst.js: a spanning tree on ${n} points has ${n - 1} edges, this one ${mst && mst.length}`);
  const adj = Array.from({ length: n }, () => []), inTree = new Set();
  for (const [a, b] of mst) { adj[a].push(b); adj[b].push(a); inTree.add(Math.min(a, b) + '-' + Math.max(a, b)); }
  const pathMax = (s, t) => {
    const stack = [[s, -Infinity]], seen = new Set([s]);
    while (stack.length) {
      const [u, m] = stack.pop();
      if (u === t) return m;
      for (const v of adj[u]) if (!seen.has(v)) { seen.add(v); stack.push([v, Math.max(m, D[u][v])]); }
    }
    return null;
  };
  let unique = true, ties = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    if (inTree.has(i + '-' + j)) continue;
    const top = pathMax(i, j);
    if (top === null) throw new Error(`mst.js: the tree does not span (no path from ${i} to ${j})`);
    if (D[i][j] < top) throw new Error(`mst.js: not a minimum spanning tree — edge ${i}–${j} (${D[i][j]}) is shorter than the tree path's longest edge (${top})`);
    if (D[i][j] === top) { unique = false; ties++; }
  }
  return { member: true, unique, ties };
}

/* the one question the pages ask */
const mstUnique = (D, mst) => check(D, mst).unique;

module.exports = { check, mstUnique };

/* node playground/mst.js — the module's own controls: a path with distinct weights is unique, a square with four
   equal sides ties, and a tree that is not minimal is refused. */
if (require.main === module) {
  const ok = (c, what) => { if (!c) { console.error('mst.js: FAIL ' + what); process.exit(1); } console.log('  ok  ' + what); };
  const P = [[0, 1, 3], [1, 0, 2], [3, 2, 0]];
  ok(mstUnique(P, [[0, 1], [1, 2]]) === true, 'distinct weights: unique');
  const S = [[0, 1, 2, 1], [1, 0, 1, 2], [2, 1, 0, 1], [1, 2, 1, 0]];
  ok(mstUnique(S, [[0, 1], [1, 2], [2, 3]]) === false, 'four equal sides: one of several');
  let refused = false; try { check(P, [[0, 2], [1, 2]]); } catch (e) { refused = /not a minimum/.test(e.message); }
  ok(refused, 'a tree that is not minimal is refused');
  refused = false; try { check([[0, 0.1], [0.1, 0]], [[0, 1]]); } catch (e) { refused = /multiple of/.test(e.message); }
  ok(refused, 'a distance that is not a multiple of ½ is refused');
}
