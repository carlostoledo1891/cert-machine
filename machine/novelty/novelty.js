/* novelty.js — occupancy as a SCORE, computed locally, at admission.

   The gate this replaces cost the source lab a day: its chowla campaign spent
   ~700K tokens rediscovering a basin Mercer published in 2019, and found out at
   promotion because occupancy was a expensive binary check at the END. Here it
   is cheap, continuous, and runs when an object is found.

   It answers one question — "have we seen this before, and where?" — against
   whatever corpora are on disk. It does NOT answer "is this new to the world";
   nothing local can, and a score that pretended to would be worse than none.
   A low score means GO LOOK, not GO PUBLISH.

   THREE MATCH KINDS, weakest evidence to strongest:
     value  — the certified number matches a known value to k digits. Catches
              rediscovering a published constant under a different set.
     object — the exact canonical object is already known. Catches re-finding
              our own board or a literature witness.
     family — the object is a translate/dilation/reversal/subset of something
              known. Catches the case the chowla campaign actually hit: the
              right neighbourhood, already occupied.

   Corpora are supplied by the caller, so this file knows nothing about Newman
   polynomials or any other object. */
'use strict';

const fs = require('fs');
const path = require('path');

/* ---- corpus loading -------------------------------------------------------
   A corpus entry is { key, value, label, source }. `key` is the caller's
   canonical form (a string), `value` a number if the object carries one. */

function corpusFromEntries(entries, source) {
  return (entries || []).map(e => ({
    key: e.key, value: e.value, label: e.label || e.key, source: source || e.source || 'unnamed'
  }));
}

/* Grep a directory tree for a literal string and return the files that hold it.
   Used to ask the source lab "does this number appear anywhere in your records"
   without needing to understand them. READ-ONLY by construction — it opens
   files and never writes. */
function grepCorpus(root, needles, opts) {
  const o = opts || {};
  const exts = o.exts || ['.md', '.json', '.jsonl', '.txt', '.yaml'];
  const maxBytes = o.maxBytes || 8e6;
  const maxDepth = o.maxDepth === undefined ? 5 : o.maxDepth;
  const hits = new Map();                       /* needle -> [files] */
  for (const n of needles) hits.set(n, []);

  function walk(dir, depth) {
    if (depth > maxDepth) return;
    let es;
    try { es = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const e of es) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p, depth + 1); continue; }
      if (!exts.some(x => e.name.endsWith(x))) continue;
      let st; try { st = fs.statSync(p); } catch (err) { continue; }
      if (st.size > maxBytes) continue;
      let txt; try { txt = fs.readFileSync(p, 'utf8'); } catch (err) { continue; }
      for (const n of needles) if (txt.indexOf(n) >= 0) hits.get(n).push(p);
    }
  }
  walk(root, 0);
  return hits;
}

/* ---- scoring -------------------------------------------------------------- */

/* score(obj, corpus, opts) -> { novelty, matches[], verdict }

   obj: { key, value, variants? }  — `variants` are the caller's own symmetry
   images (translates, dilations, reversals, sub-objects), so this file never
   has to know what a symmetry is for the object at hand.

   novelty runs 0 (fully occupied) to 1 (nothing local knows it). It is a
   COMPASS, not a verdict: 1 means nobody here has seen it, which is exactly
   when a literature read is worth its cost. */
function score(obj, corpus, opts) {
  const o = opts || {};
  const digits = o.digits === undefined ? 9 : o.digits;
  const matches = [];

  const near = (a, b) => {
    if (typeof a !== 'number' || typeof b !== 'number') return false;
    return a.toFixed(digits) === b.toFixed(digits);
  };

  for (const c of corpus) {
    if (c.key === obj.key) {
      matches.push({ kind: 'object', weight: 1.0, label: c.label, source: c.source });
      continue;
    }
    if (obj.variants && obj.variants.indexOf(c.key) >= 0) {
      matches.push({ kind: 'family', weight: 0.8, label: c.label, source: c.source });
      continue;
    }
    if (near(c.value, obj.value)) {
      matches.push({ kind: 'value', weight: 0.6, label: c.label, source: c.source });
    }
  }

  const worst = matches.reduce((a, m) => Math.max(a, m.weight), 0);
  const novelty = 1 - worst;
  return {
    novelty,
    matches,
    verdict: worst >= 1 ? 'KNOWN-OBJECT'
      : worst >= 0.8 ? 'KNOWN-FAMILY'
        : worst >= 0.6 ? 'VALUE-COLLISION'
          : 'UNSEEN-LOCALLY'
  };
}

/* The honest line this module must always be read with. Exported so a report
   cannot render a novelty score without it. */
const CAVEAT = 'novelty is scored against LOCAL corpora only. UNSEEN-LOCALLY means '
  + 'nobody here has seen it — which is when a literature read is worth its cost, not a '
  + 'finding in itself. Nothing local can establish that an object is new to the world.';

module.exports = { score, corpusFromEntries, grepCorpus, CAVEAT };
