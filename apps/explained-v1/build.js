/* build.js — the easy read: one scrolling page that explains the method paper the way a good science channel would —
   big pictures, a few things to touch, every number real.

     site/explained/v1/index.html  the ROUND-ONE page (its own visual language, before the house-grammar rebuild of 2026-10-23),
                                   kept beside the house version so the two can be compared; from apps/explained-v1/page.html

   EVERY NUMBER ON THE PAGE IS READ HERE, AT BUILD TIME, through THE ONE READER the house version uses
   (apps/explained/records.js) and the one window matrix (apps/explained/window.js). Until 2026-10-28 this file carried its own
   copy of both, line for line — the corpus.js lesson waiting to happen — and the page beside it typed what the reader did
   not hold: a hero chip "K(43) ≥ 1,021,000" that no record states, "C₁c ≥ 0.41030211724" painted refuted where the
   claimbox object refuses it, 605 and 572 in prose, and the tile counter's 9,752,282,639,769,360 as a literal. Those are
   placeholders now, gated where the house page's are. The round-one palette is the page's own and is left as it was
   (operator, 2026-10-28: no colour added, none taken away); the WARRANT marks are the house version's, not this one's.

   usage: node apps/explained-v1/build.js       (make site runs it; make page R=apps/explained-v1 for the edit loop)
   apps/explained-v1 · cert-machine                                                                                      MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, V, flatten, fill } = require('../explained/records.js');
require('../explained/window.js');
const SITE = path.join(ROOT, 'site', 'explained', 'v1');

const html = fill(fs.readFileSync(path.join(__dirname, 'page.html'), 'utf8'), 'explained-v1/page.html');
fs.mkdirSync(SITE, { recursive: true });
fs.writeFileSync(path.join(SITE, 'index.html'), html);
console.log('site/explained/v1/index.html written (' + Math.round(html.length / 1024) + ' KB; ' + Object.keys(flatten()).length + ' numbers from the records) @ git ' + V.GIT);
