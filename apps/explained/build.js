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
  V.CHOSEN_ATTRS = WR.attrs(WR.CHOSEN, { width: 2 }); V.WIN_LEGEND = WR.legendHtml({ compact: true, exclude: [WR.DECIDED, WR.COMPUTED, WR.REFUSED] }); }

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
