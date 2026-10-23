/* zones.js — the folders of site/ that cert-machine does not own.                           design/ · cert-machine

   A FOREIGN ZONE is a byte copy of another repository's build, served at carlostoledo.co under its own folder. Its own
   repository builds and gates it; here it is never written, never pruned and never measured. One list, read by
   tools/build-site.js (the prune loop) and by the four gates that walk every page of site/ (check-style, check-render,
   check-measure, check-grammar) — a rule defined twice WILL diverge, and a gate that met a foreign page would refuse
   every later build of this site over bytes this repository cannot fix.

   Nothing is skipped silently: each gate prints the zones it skipped. Copying a build in, or updating it, is a commit
   like any other and is published only on the operator's word.

   clade-code/ (2026-10-23, at clade-code's request, the operator approving): ~/Projects/clade-code/web/, built there by
   `make web`; the folder holds a copy of its web/dist/ — one self-contained index.html, noindex while a draft. Not in
   the sitemap, linked from no page here. */
'use strict';

const FOREIGN = [
  { dir: 'clade-code/', owner: '~/Projects/clade-code', build: 'make web → web/dist/' },
];

/* rel: a path relative to site/, '/'-separated (a directory may end in '/' or not) */
const isForeign = (rel) => FOREIGN.some((z) => (rel + '/').startsWith(z.dir));

/* for the gates' walks: true when the directory abs (under site) is a foreign zone, and the skip is printed once */
const path = require('path');
const told = new Set();
const skipDir = (site, abs) => {
  const rel = path.relative(site, abs).split(path.sep).join('/');
  if (!isForeign(rel)) return false;
  if (!told.has(rel)) { told.add(rel); console.log('  skip  site/' + rel + '/ — a foreign zone (design/zones.js), built and gated by its own repository'); }
  return true;
};

module.exports = { FOREIGN, isForeign, skipDir };
