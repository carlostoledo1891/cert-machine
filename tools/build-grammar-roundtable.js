#!/usr/bin/env node
/* build-grammar-roundtable.js — /grammar/roundtable/: the WARRANT roundtable of 2026-10-29 as a public page (D15).
   tools/ · cert-machine · 2026-10-29

   The operator ruled on 2026-10-29 (D15) that the roundtable, its axioms and its candidate rules become a public page
   beside /grammar/, with the findings drawn as before/after figures, once the fixes and D12 had landed. The note the
   table produced stays local (D16): this page is written from the records and the code, never copied from it.

   SPECIMEN (2026-10-29), for the operator's look before the rest is written:
     · the header, saying what the seats were: AI agents, each judging the grammar by one discipline's published
       principles and named for the person whose work defines it; none of those people took part;
     · THE HERO, the law the table kept (A1, soundness), drawn at the one place this site is known to have broken it:
       the decided staircase on /grammar/, whose upper edge on [1, 3/2] was written to the nearest tenth of a pixel
       until 29 October and sat 7/180 of a pixel inside its record (finding F4). The old path is read from git at the
       commit before the fix, the new one from today's built page, and every pixel position is an exact rational. The
       witness is a point of the record outside the band that was drawn;
     · F1 before and after: the stroke tones until D9, read from git at the commit before the fix, against today's,
       read from playground/warrant.js; OKLab lightness from design/colour.js.
   The rest (the five agreements, the six axioms, the other nine findings, the fifteen candidate rules with their status
   computed from the gates, the open research) follows on the operator's word.

   usage: node tools/build-grammar-roundtable.js     writes site/grammar/roundtable/index.html
          require(...).html()                        the page, for tools/build-site.js                          MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const T = require(path.join(ROOT, 'design', 'tokens.js'));
const COL = require(path.join(ROOT, 'design', 'colour.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const GR = require(path.join(__dirname, 'build-grammar.js'));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const die = (m) => { throw new Error('ROUNDTABLE PAGE REFUSED: ' + m); };
const git = (args) => cp.execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
/* the commit that applied the roundtable's first fixes (F2, F4, F5, F8, F10 and D9); its parent is "before" */
const FIX = 'e310e071';

function html() {
  const { cells, PANEL, fr, fsub, fadd, fmul, fdiv, fnum, fstr } = GR;
  const fgt = (p, q) => p[0] * q[1] > q[0] * p[1];
  const dec = (s) => { const [i, f = ''] = s.split('.'); return fr(BigInt(i + f), 10n ** BigInt(f.length)); };

  /* ======================================== the hero's numbers: F4, exactly ==
     The specimen's frame maps a value v to the pixel row T + ph − (v − y0) / (y1 − y0) · ph, every term rational. */
  const ph = PANEL.h - PANEL.padT - PANEL.padB;
  const rowOf = (v) => fsub(fr(PANEL.padT + ph), fdiv(fmul(fsub(v, fr(0)), fr(ph)), fr(9, 4)));
  if (PANEL.y0 !== 0 || PANEL.y1 !== 2.25) die('the specimen frame moved: y is no longer [0, 9/4]');
  /* the upper staircase as written on /grammar/: before the fix (git) and today (the built page) */
  const upperPath = (page) => { const m = /<path d="(M108\.8,143\.9H[^"]+)"/.exec(page) || /<path d="(M108\.8,14[0-9.]+H[^"]+)"/.exec(page); return m ? m[1] : null; };
  let before;
  try { before = git(['show', FIX + '^:site/grammar/index.html']); } catch (e) { die('git history is needed: the page reads the staircase as it was drawn at ' + FIX + '^'); }
  const pathBefore = upperPath(before);
  const nowPage = fs.readFileSync(path.join(ROOT, 'site', 'grammar', 'index.html'), 'utf8');
  const pathNow = /<path d="(M108\.[0-9],1[0-9.]+H143\.[0-9]V[^"]+)"[^>]*class="w-decided"/.exec(nowPage) || /<path d="(M108\.[0-9],1[0-9.]+H143\.[0-9]V[^"]+)"/.exec(nowPage);
  if (!pathBefore || !pathNow) die('the staircase path is not where it was on /grammar/ (before or now)');
  const rows = (d) => [d.match(/^M[0-9.]+,([0-9.]+)/)[1]].concat([...d.matchAll(/V([0-9.]+)/g)].map((m) => m[1]));
  const K = 2, cell = cells[K];                     /* the step on [1, 3/2], where the top was written inside its record */
  const rowExact = rowOf(cell.hi), rowOld = dec(rows(pathBefore)[K]), rowNew = dec(rows(pathNow[1])[K]);
  const inside = fsub(rowOld, rowExact), outside = fsub(rowExact, rowNew);
  if (!(fstr(cell.x0) === '1' && fstr(cell.x1) === '3/2')) die('the step is no longer [1, 3/2]');
  if (!fgt(rowOld, rowExact)) die('the edge drawn before the fix is not inside its record: F4 has no witness here');
  if (fgt(rowNew, rowExact)) die('the edge drawn today is inside its record: the fix does not hold');
  const WX = fr(9, 8);                              /* the witness: a point of the record above the band drawn before */

  /* ============================================================ the hero ==
     Left: the decided staircase at its own scale, the step boxed. Right: that step's top, 2,000× taller, in the
     specimen's own pixel rows: the record's edge, the edge drawn until 29 October, the edge drawn now. */
  const DECIDED_W = 2, WXO = { size: 10, width: 3.5 };
  const hero = (G) => {
    const o = [CH.open({ w: G.w, h: G.h, alt: 'Left, the decided staircase that encloses the square root of x on 0 to 4, with the step on 1 to 3/2 boxed. Right, that step\'s top edge magnified: the record\'s edge at 79/64, the edge drawn until 29 October 7/180 of a pixel below it, inside the record, and the edge drawn now 11/180 of a pixel above it; a red cross marks the record\'s point at x 5/4 that the old band left out.' })];
    /* the staircase */
    const f = CH.frame(Object.assign({ x0: -1, x1: 4, w: G.w, h: G.h, y0: 0, y1: 2.25 }, G.left));
    o.push(CH.axes(f, { yTicks: [0, 1, 2].map((v) => ({ v, t: String(v) })), xTicks: [0, 1, 2, 3, 4].map((v) => ({ v, t: String(v) })), xLabel: 'x' }));
    /* drawn by the grammar page's own outward rule (F4's fix), never to nearest */
    o.push('    <path d="' + GR.stair(f, 'hi') + '" ' + W.attrs(W.DECIDED, { width: 1.6 }) + '/>');
    o.push('    <path d="' + GR.stair(f, 'lo') + '" ' + W.attrs(W.DECIDED, { width: 1.6 }) + '/>');
    const bx0 = f.px(1) - 4, bx1 = f.px(1.5) + 4, by = f.py(fnum(cell.hi));
    o.push('    <rect x="' + bx0.toFixed(1) + '" y="' + (by - 9).toFixed(1) + '" width="' + (bx1 - bx0).toFixed(1) + '" height="18" fill="none" stroke="var(--ink-3)" stroke-width="1" stroke-dasharray="2 3"/>');
    o.push(CH.txt(f.L, f.T - 8, 'the decided enclosure of √x on /grammar/', 't-note', 'start'));
    /* the zoom, in the specimen's pixel rows */
    const Z = G.zoom, r0 = 100.76, r1 = 100.94;
    const zy = (r) => Z.top + (fnum(r) - r0) / (r1 - r0) * Z.h, zx = (x) => Z.left + (fnum(x) - 1) / 0.5 * Z.w;
    o.push('    <line x1="' + (bx1).toFixed(1) + '" y1="' + by.toFixed(1) + '" x2="' + Z.left + '" y2="' + (Z.top + Z.h / 2).toFixed(1) + '" stroke="var(--ink-4)" stroke-width="1" stroke-dasharray="2 3"/>');
    for (const [r, t] of [[rowNew, rows(pathNow[1])[K]], [rowExact, fstr(rowExact)], [rowOld, rows(pathBefore)[K]]]) o.push(CH.txt(Z.left - 10, zy(r) + 4, 'row ' + t, 't-ax', 'end'));
    const line = (r, attrs) => '    <line x1="' + Z.left + '" y1="' + zy(r).toFixed(2) + '" x2="' + (Z.left + Z.w) + '" y2="' + zy(r).toFixed(2) + '" ' + attrs + '/>';
    o.push(line(rowExact, W.attrs(W.DECIDED, { width: DECIDED_W })));
    o.push(line(rowOld, W.attrs(W.COMPUTED, { width: DECIDED_W })));
    o.push(line(rowNew, W.attrs(W.DECIDED, { width: DECIDED_W })));
    o.push(W.witnessMark(zx(WX), zy(rowExact), WXO));
    const lab = (r, dy, t, cls) => CH.txt(Z.left + Z.w, zy(r) + dy, t, cls || 't-note', 'end');
    o.push(lab(rowNew, -8, G.narrow ? 'now: outward, ' + fstr(outside) + ' px out' : 'drawn now: outward, ' + fstr(outside) + ' px outside the record'));
    o.push(lab(rowExact, -8, 'the record: √x ≤ ' + fstr(cell.hi), 't-lab'));
    o.push(lab(rowOld, 18, G.narrow ? 'until 29 Oct: nearest, ' + fstr(inside) + ' px in' : 'drawn until 29 October: to nearest, ' + fstr(inside) + ' px inside', 't-note'));
    o.push(G.narrow ? CH.txt(12, Z.top + Z.h + 26, 'rows ' + r0 + '–' + r1 + ' of the ' + PANEL.w + ' × ' + PANEL.h + ' specimen', 't-note', 'start')
      : CH.txt(Z.left, Z.top + Z.h + 26, 'the step’s top, x ∈ [1, 3/2]: rows ' + r0 + ' to ' + r1 + ' of the ' + PANEL.w + ' × ' + PANEL.h + ' specimen', 't-note', 'start'));
    o.push(CH.txt(zx(WX) + 16, zy(rowExact) + 22, G.narrow ? 'outside the old band' : 'x = ' + fstr(WX) + ': in the record, outside the old band', 't-note', 'start'));
    o.push(CH.close);
    return o.join('\n');
  };
  const heroWide = hero({ narrow: false, w: 1000, h: 420, left: { padL: 44, padR: 1000 - 44 - 330, padT: 40, padB: 50 }, zoom: { left: 520, top: 70, w: 440, h: 260 } });
  const heroNarrow = hero({ narrow: true, w: 400, h: 600, left: { padL: 40, padR: 14, padT: 34, padB: 600 - 34 - 220 }, zoom: { left: 100, top: 330, w: 288, h: 220 } });
  const heroFig = C.figure({ svgRaw: heroWide, svgNarrowRaw: heroNarrow, hero: true,
    captionRaw: '<span class="rt-k">the law · A1, soundness</span>A figure is a map from a record to marks; reading the marks back must give a set of records that contains the one that was drawn. '
      + 'The decided staircase on <a href="../index.html">the grammar page</a> encloses √x, and on [1, 3/2] its record says √x ≤ ' + esc(fstr(cell.hi)) + '. Until 29 October that top was written to the nearest tenth of a pixel, row '
      + esc(rows(pathBefore)[K]) + ', ' + esc(fstr(inside)) + ' of a pixel inside the record: the band claimed a bound the record never proved. '
      + W.witness('a point of the record outside the band drawn before the fix') + ' At x = ' + esc(fstr(WX)) + ' the record reaches ' + esc(fstr(cell.hi)) + ' and the old band stopped short of it. '
      + 'The table’s finding F4; fixed at ' + FIX + ' by rounding every edge outward, and the builder now refuses an edge drawn inside its record. The rows are read from the page as it was before the fix (git) and as it is now.' });

  /* ========================================================= F1, the tones ==
     Until D9 the computed stroke was --ink-3 and the chosen --ink-2: the weaker standing read brighter. */
  let wBefore;
  try { wBefore = git(['show', FIX + '^:playground/warrant.js']); } catch (e) { die('git history is needed for the tones before ' + FIX); }
  const toneIn = (src, s) => { const m = new RegExp('\\.w-' + s + ' \\{ stroke: var\\((--ink(?:-\\d)?)\\); \\}').exec(src); return m ? m[1] : null; };
  const STAND = [[W.DECIDED, 'decided'], [W.COMPUTED, 'computed'], [W.CHOSEN, 'chosen']];
  const tones = (src) => STAND.map(([s, k]) => { const tok = toneIn(src, k); if (!tok) die('no stroke tone for ' + k); const hex = T.DARKONLY[tok]; return { s, k, tok, hex, L: COL.oklch(hex)[0] }; });
  const TB = tones(wBefore), TA = tones(W.css());
  const ordered = (t) => t[0].L >= t[1].L && t[1].L >= t[2].L;
  if (ordered(TB)) die('the tones before D9 were in order after all: F1 has nothing to show');
  if (!ordered(TA)) die('today\'s tones run against the order: D9 does not hold');
  const f1 = (G) => {
    const o = [CH.open({ w: G.w, h: G.h, alt: 'The three standing strokes in the tones they had until 29 October and the tones they have now, each with its lightness: before, chosen was lighter than computed; now lightness falls with the standing.' })];
    G.cols.forEach(([x, y, title, t, cls]) => {
      o.push('    <g class="' + cls + '">');
      o.push(CH.txt(x, y, title, 't-lab', 'start'));
      t.forEach((r, i) => {
        const yy = y + 34 + i * 34;
        o.push(CH.txt(x, yy + 4, r.k, 't-note', 'start'));
        o.push('    <line x1="' + (x + 92) + '" y1="' + yy + '" x2="' + (x + 92 + G.len) + '" y2="' + yy + '" ' + W.attrs(r.s, { width: 2.4 }) + '/>');
        o.push(CH.txt(x + 92 + G.len + 14, yy + 4, r.tok + ' · L ' + r.L.toFixed(3), 't-note', 'start'));
      });
      o.push(CH.txt(x, y + 34 * 3 + 30, ordered(t) ? 'lightness falls with standing' : 'chosen reads brighter than computed: against the order', 't-note', 'start'));
      o.push('    </g>');
    });
    o.push(CH.close);
    return o.join('\n');
  };
  const f1Wide = f1({ w: 1000, h: 190, len: 120, cols: [[40, 28, 'until 29 October (' + FIX + '^)', TB, 'rt-before'], [540, 28, 'since D9 (today)', TA, 'rt-after']] });
  const f1Fig = C.figure({ svgRaw: f1Wide, captionRaw: '<span class="rt-k">F1 · the tone ran against the order</span>The grammar orders its standings, decided above computed above chosen, and says a mark takes the weakest on its path. '
    + 'The dash carried that order; the tone did not. Until 29 October a chosen stroke was drawn in --ink-2 and a computed one in --ink-3, so the weaker standing read brighter (OKLab lightness '
    + TB.map((r) => r.k + ' ' + r.L.toFixed(3)).join(', ') + '). Since D9 lightness falls with the standing, a battery asserts it from the tokens, and on paper the order runs the other way, darker for stronger. '
    + 'Before: read from playground/warrant.js at ' + FIX + '^. After: read from it today.' });

  /* =========================================================== the page == */
  const B = [];
  B.push(C.header({ eyebrow: 'Carlos Toledo · the visual grammar · the roundtable', title: 'The roundtable: the grammar examined from eleven seats',
    deck: 'On 29 October 2026 eleven seats judged WARRANT, the grammar this site is drawn in, against its rulebook and five built pages. They kept one law, that the display is a sound map of the record and the build decides it, and found ten places where the site broke its own rules. This page draws the law, each finding before and after its fix, the six axioms, and the fifteen rules the table proposed, with which of them a build now enforces.' }));
  B.push(heroFig);
  B.push(C.section({ lab: 'who sat', title: 'Eleven seats, and what a seat was', id: 'seats', wide: true,
    bodyRaw: '<div class="col">' + C.pRaw('Each seat was an AI agent (Claude, Anthropic’s model) briefed with the rulebook, the brainstorm behind it, the module that draws the marks and five built pages, and asked to judge the grammar by one discipline’s published principles. Each is named for the person whose work defines that discipline. <b>None of those people took part</b>, and nothing on this page is theirs: the seats argued from their published ideas, and every number the table reported was measured again on the built site before it was written here.') + '</div>'
      + C.plainList([
        { b: 'the Tufte seat', text: 'a display of evidence: data ink, the lie factor, sources on the graphic' },
        { b: 'the Wilkinson seat', text: 'a grammar in the strict sense: components, scales, guides, composition laws' },
        { b: 'the Bertin seat', text: 'the retinal variables, and the level of organisation each can carry' },
        { b: 'the Victor seat', text: 'an interface to a decision procedure: handles, the ladder of abstraction' },
        { b: 'the Sanderson seat', text: 'the grammar in time: what a frame is, what may move' },
        { b: 'the Bostock seat', text: 'a library and a data format: the API, the interchange object, the validator' },
        { b: 'the Norman seat', text: 'the gulf of evaluation: signifiers, knowledge in the world, the first ten seconds' },
        { b: 'the Maeda seat', text: 'computational design: generated, not drawn' },
        { b: 'the Sagmeister seat', text: 'beauty as a function: scarcity, scale, the void as an event' },
        { b: 'the Chief Scientist seat', text: 'order theory, provenance, Galois connections, theorems the house can check' },
        { b: 'the CTO seat', text: 'a platform: the portable core, the sibling projects, the build plan and its cost' },
      ]) }));
  B.push(C.section({ lab: 'the findings', title: 'Ten findings, each before and after', id: 'findings', wide: true,
    bodyRaw: '<div class="col">' + C.p('Each finding is a fact about the built site on 29 October, measured again before the rulings, and each is drawn here as it was and as it is. This specimen shows the first.') + '</div>' + f1Fig + W.legendHtml() }));

  const head = (() => { try { return git(['rev-parse', '--short', 'HEAD']).trim(); } catch (e) { return 'unknown'; } })();
  const foot = '<p>Built from playground/warrant.js, design/tokens.js, the grammar page and git history, at git ' + esc(head) + ', by tools/build-grammar-roundtable.js. MIT.</p>';
  const CSS = `
/* /grammar/roundtable/ (tools/build-grammar-roundtable.js): the caption key, the hero under the header, F1's old tones */
.rt-k{display:block;margin-bottom:var(--s-1);font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-2)}
.page > header + .hero{margin-top:var(--s-7)}
.rt-before .w-computed{stroke:var(${TB[1].tok})}
.rt-before .w-chosen{stroke:var(${TB[2].tok})}
`;
  return TPL.render({ title: 'The roundtable', bodyRaw: B.join('\n\n'), footRaw: foot, path: '/grammar/roundtable/', cssRaw: CSS,
    desc: 'The WARRANT roundtable of 29 October 2026: eleven seats judged the grammar this site is drawn in; the law they kept, the findings before and after, the axioms and the candidate rules.' });
}

if (require.main === module) {
  const out = html();
  fs.mkdirSync(path.join(ROOT, 'site', 'grammar', 'roundtable'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'site', 'grammar', 'roundtable', 'index.html'), out);
  console.log('site/grammar/roundtable/index.html written (' + out.length + ' bytes)');
}
module.exports = { html };
