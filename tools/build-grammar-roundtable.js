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

  /* ====================================== the findings' numbers, then and now ==
     The site's HTML as git holds it at FIX^ is extracted to a temporary folder and measured by the same census that
     gates today's site (tools/check-grammar.js marksCensus), so a "before" and an "after" are counted by one rule. */
  const os = require('os');
  const CG = require(path.join(__dirname, 'check-grammar.js'));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'roundtable-'));
  const CG_walk = (dir) => { const out = []; (function w(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const q = path.join(d, e.name); if (e.isDirectory()) { if (!/machinidae/.test(q)) w(q); } else if (e.name.endsWith('.html')) out.push(q); } })(dir); return out; };
  /* F7: a value's reason (its title) that the page never shows as text, counted on the whole site, then and now */
  const tooltipOnly = (dir) => { let n = 0; for (const f of CG_walk(dir)) { const src = fs.readFileSync(f, 'utf8'); const vis = src.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
    for (const m of src.matchAll(/<span\b[^>]*\bclass="[^"]*\bw-val\b[^"]*"[^>]*\btitle="([^"]+)"/g)) { const t = m[1].replace(/&[a-z#0-9]+;/g, ' ').split(/ — |: /).pop().trim().slice(0, 40); if (t && !vis.includes(t)) n++; } } return n; };
  let THEN, NOW, landingThen, ethThen, hiddenThen;
  try {
    cp.execSync('git archive ' + FIX + '^ -- ' + JSON.stringify(':(glob)site/**/*.html') + ' | tar -x -C ' + JSON.stringify(tmp), { cwd: ROOT, stdio: ['ignore', 'ignore', 'pipe'] });
    THEN = CG.marksCensus(path.join(tmp, 'site'));
    landingThen = fs.readFileSync(path.join(tmp, 'site', 'index.html'), 'utf8');
    ethThen = fs.readFileSync(path.join(tmp, 'site', 'eth', 'index.html'), 'utf8');
    hiddenThen = tooltipOnly(path.join(tmp, 'site'));
  } catch (e) { die('git history is needed: the site as it was at ' + FIX + '^ could not be read (' + e.message.split('\n')[0] + ')'); }
  finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  NOW = CG.marksCensus();
  const landingNow = fs.readFileSync(path.join(ROOT, 'site', 'index.html'), 'utf8');
  const ethNow = fs.readFileSync(path.join(ROOT, 'site', 'eth', 'index.html'), 'utf8');
  const pagesOf = (o) => Object.keys(o).length;
  const dashAnim = (src) => (src.match(/stroke-dashoffset/g) || []).length;
  const firstTile = (src) => { const i = src.indexOf('class="stats"'); const m = /<div class="stat">([\s\S]*?)<\/div>\s*<\/div>/.exec(src.slice(i)); return m ? m[1].split(/<[^>]+>/).map((t) => t.replace(/&[a-z]+;/g, (x) => ({ '&rsquo;': '’', '&ldquo;': '“', '&rdquo;': '”', '&amp;': '&' }[x] || ' ')).trim()).filter(Boolean).join(' · ') : null; };
  if (THEN.unstanding <= NOW.unstanding || THEN.dashedBorders <= NOW.dashedBorders || !THEN.chipWordsMulti.length || NOW.chipWordsMulti.length) die('a fixed finding no longer reads as fixed: the census then and now disagree with the page');
  if (dashAnim(landingThen) < 1 || dashAnim(landingNow) !== 0) die('F10: the landing animated a dash before the fix and must not now');
  const eth0 = firstTile(ethThen), eth1 = firstTile(ethNow);
  if (!eth0 || !eth1 || !/CERTIFIED/.test(eth0) || !/not decided here/.test(eth1)) die('F8: /eth/\'s first tile is not where the page says it was or is');

  /* a pair of bars per measure, then (dimmer) and now (ink), each row on its own scale; every value a count, decided */
  const pairs = (rows, alt) => {
    const w = 760, rh = 84, h = 8 + rows.length * rh;
    const o = [CH.open({ w, h, alt })];
    rows.forEach((r, i) => {
      const y = 8 + i * rh, L = 80, R = w - 140, mx = Math.max(r.then, r.now, 1), x = (v) => L + v / mx * (R - L);
      o.push(CH.txt(0, y + 12, r.k, 't-lab', 'start'));
      for (const [j, v, word, op] of [[0, r.then, 'before', 0.4], [1, r.now, 'now', 1]]) {
        const yy = y + 24 + j * 24;
        o.push(CH.txt(L - 10, yy + 12, word, 't-ax', 'end'));
        if (v > 0) o.push('    <rect x="' + L + '" y="' + yy + '" width="' + (x(v) - L).toFixed(1) + '" height="14" fill="var(--ink)" fill-opacity="' + op + '"/>');
        else o.push(CH.txt(L, yy + 12, '0', 't-ax', 'start'));
        if (v > 0) o.push(CH.txt(x(v) + 8, yy + 12, fmtN(v) + (r.unit ? ' ' + r.unit : ''), 't-ax', 'start'));
      }
    });
    o.push(CH.close);
    return o.join('\n');
  };
  const fmtN = (n) => Number(n).toLocaleString('en-US');

  /* F3, the ink of each pattern at each width: a dash pattern [on, off] inks on/(on+off) with butt caps and
     (on + w)/(on+off) with round caps of width w, capped at 1; exact rationals of the constants in design/grammar.js */
  const Gm = require(path.join(ROOT, 'design', 'grammar.js'));
  const pat = (str) => str.split(/\s+/).map(Number);
  const inkC = (w) => { const [on, off] = pat(w < Gm.SMALL_BELOW ? Gm.CLAIM_SM : Gm.CLAIM); return on / (on + off); };
  const inkP = (w) => { const [on, off] = pat(w < Gm.SMALL_BELOW ? Gm.PICK_SM : Gm.PICK); return Math.min(1, (on + w) / (on + off)); };
  const legendW = Number((/stroke-width="([0-9.]+)"/.exec(W.legendHtml()) || [0, NaN])[1]);
  if (!(inkP(legendW) > inkC(legendW))) die('F3: at the legend\'s own width the dotted line no longer inks more than the dashed one');
  /* where the dotted line inks more: (1 + w)/(on + off) > the dashed fraction, solved exactly per regime */
  const cross = (P, Cc) => { const [on, off] = pat(P), [a, b] = pat(Cc); return fr(BigInt(Math.round(a * 10)) * BigInt(Math.round((on + off) * 10)) - BigInt(Math.round(on * 10)) * BigInt(Math.round((a + b) * 10)), BigInt(Math.round((a + b) * 10)) * 10n); };
  const xSmall = cross(Gm.PICK_SM, Gm.CLAIM_SM), xBig = cross(Gm.PICK, Gm.CLAIM);
  const f3Svg = (() => {
    const o = { w: 760, h: 300, padL: 56, padR: 24, padT: 22, padB: 50, x0: 0.5, x1: 3, y0: 0.3, y1: 0.75 };
    const f = CH.frame(o), out = [CH.open({ w: o.w, h: o.h, alt: 'The fraction of its length each pattern inks, against stroke width from half a pixel to three: the dashed (computed) line is flat at each of its two patterns; the dotted (chosen) line rises with width and crosses above it twice.' }), CH.axes(f, { yTicks: [0.3, 0.4, 0.5, 0.6, 0.7].map((v) => ({ v, t: v.toFixed(1) })), xTicks: [0.5, 1, 1.5, 2, 2.5, 3].map((v) => ({ v, t: v + ' px' })), xLabel: 'stroke width' })];
    const line = (g, cls) => { const pts = []; for (let i = 0; i <= 250; i++) { const w = 0.5 + 2.5 * i / 250; pts.push([w, g(w)]); }
      /* each regime drawn on its own: the patterns switch at SMALL_BELOW, and a line across the switch would draw values nobody computed */
      const a = pts.filter(([w]) => w < Gm.SMALL_BELOW), b = pts.filter(([w]) => w >= Gm.SMALL_BELOW);
      return [a, b].map((seg) => '    <polyline points="' + seg.map(([x, y]) => f.px(x).toFixed(1) + ',' + f.py(y).toFixed(1)).join(' ') + '" fill="none" stroke="var(--ink)" stroke-width="' + cls + '" stroke-linejoin="round"/>').join('\n'); };
    out.push(line(inkC, 1.4), line(inkP, 2.6));
    out.push('    <line x1="' + f.px(Gm.SMALL_BELOW).toFixed(1) + '" y1="' + f.T + '" x2="' + f.px(Gm.SMALL_BELOW).toFixed(1) + '" y2="' + (f.T + f.ph) + '" stroke="var(--ink-4)" stroke-width="1" stroke-dasharray="' + Gm.GUIDE + '"/>');
    out.push('    <line x1="' + f.px(legendW).toFixed(1) + '" y1="' + f.T + '" x2="' + f.px(legendW).toFixed(1) + '" y2="' + (f.T + f.ph) + '" stroke="var(--ink-4)" stroke-width="1" stroke-dasharray="' + Gm.GUIDE + '"/>');
    out.push(CH.txt(f.px(Gm.SMALL_BELOW) + 6, f.T + 12, 'the small patterns end at ' + Gm.SMALL_BELOW + ' px', 't-note', 'start'));
    out.push(CH.txt(f.px(legendW) + 6, f.T + 30, 'the legend draws at ' + legendW + ' px', 't-note', 'start'));
    out.push(CH.txt(f.px(1.6), f.py(0.385), 'dotted (chosen), thick line', 't-lab', 'start'));
    out.push(CH.txt(f.px(1.6), f.py(0.585), 'dashed (computed), thin line', 't-lab', 'start'));
    out.push(CH.close);
    return out.join('\n');
  })();

  /* the candidate rules, each with a status the build decides from the code and the census */
  const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
  const grepCount = (re, dirs) => { let n = 0; for (const d of dirs) { const walkJs = (q) => { for (const e of fs.readdirSync(q, { withFileTypes: true })) { const z = path.join(q, e.name); if (e.isDirectory()) { if (!/node_modules|\.venv|out$/.test(z)) walkJs(z); } else if (e.name.endsWith('.js')) n += (fs.readFileSync(z, 'utf8').match(re) || []).length; } }; walkJs(path.join(ROOT, d)); } return n; };
  const heroPages = CG_walk(path.join(ROOT, 'site')).filter((f) => /\sdata-hero[\s>]/.test(fs.readFileSync(f, 'utf8'))).length;
  const excludes = grepCount(/legendHtml\(\{[^}]*exclude/g, ['tools', 'apps', 'playground']);
  const recCaptions = CG_walk(path.join(ROOT, 'site')).reduce((n, f) => n + (fs.readFileSync(f, 'utf8').match(/<figcaption[^>]*\sdata-record=/g) || []).length, 0);
  const reasonsHidden = tooltipOnly(path.join(ROOT, 'site'));
  const RULES = [
    ['R17', 'A number’s standing is read from a typed value with its record’s address, never typed at a call site.', 'a census of values without an address, ratcheted down; tools/check-marks.js re-reads every addressed one', NOW.unpointed ? 'partial' : 'gated', fmtN(NOW.pointed) + ' values carry an address; ' + fmtN(NOW.unpointed) + ' still do not'],
    ['R18', 'Every channel the standing scale uses is monotone in it, or constant.', 'design/battery.js asserts the tone order from the tokens, on screen and on paper', ordered(TA) ? 'gated' : 'open', 'tone falls with standing since D9'],
    ['R19', 'Pixels round outward, and a figure prints the smallest difference it can show.', 'an edge drawn inside its record refuses the build', 'partial', 'refused on /grammar/’s staircase; not yet in design/charts.js'],
    ['R20', 'The legend is derived from the figure, never declared.', 'no builder passes the legend a list of what to leave out', excludes ? 'open' : 'gated', excludes + ' call' + (excludes === 1 ? '' : 's') + ' still tell the legend what to leave out'],
    ['R21', 'A dash is a standing everywhere: on strokes, borders and in motion.', 'the marks census: dashes without a standing, dashed borders, a verdict word in two chip shapes', NOW.unstanding || NOW.dashedBorders ? 'partial' : 'gated', fmtN(NOW.unstanding) + ' unclassed dashes and ' + fmtN(NOW.dashedBorders) + ' dashed borders left, ratcheted; chip shape a function of the word'],
    ['R22', 'A mark’s reason is visible text, never only a tooltip.', 'a value whose reason appears nowhere on its page refuses it', reasonsHidden ? 'open' : 'gated', fmtN(reasonsHidden) + ' reasons live only in a tooltip'],
    ['R23', 'A figure names its record and its digest on itself.', 'a figure with standing marks and no record named in its caption refuses the page', recCaptions ? 'partial' : 'open', recCaptions ? recCaptions + ' captions name their record' : 'no caption names its record yet'],
    ['R24', 'A page’s standing is computed by its builder, never typed.', 'the printed standing equals the meet of the page’s marks', typeof W.pageStanding === 'function' ? 'partial' : 'open', 'not built'],
    ['R25', 'A frame is a page: standing never tweens, a value never travels.', 'every frame of a video passes the page checks', exists('tools/check-frames.js') ? 'gated' : 'open', 'the tail video is the model; no gate yet'],
    ['R26', 'A chosen input is a handle, and a drag is a test.', 'under a drag no decided mark moves (a Chrome drive)', exists('playground/return-level-check/drive.js') ? 'partial' : 'open', 'one instrument: the return-level check’s design height (D14)'],
    ['R27', 'A premise grade is a pair: a verification bit and a validation rung.', 'a chain whose top rung lacks the bit prints the word “unverified”', typeof W.pairWord === 'function' ? 'partial' : 'open', 'declared on Swell and on /grammar/; other chains as they are next edited (D11)'],
    ['R28', 'A witness is an event and a void has a size.', 'one hero per page, its × first and at weight; a refused cell keeps its area', heroPages ? 'partial' : 'open', heroPages + ' page' + (heroPages === 1 ? '' : 's') + ' declare a hero (D12); the void’s size is not built'],
    ['R29', 'The registry is one machine-readable file, lifted by digest into every sibling.', 'make drift on both ends', exists('design/warrant/registry.json') ? 'gated' : 'open', 'the five patterns still live in several copies'],
    ['R30', 'A figure carries the sentence that would stop it.', 'a guarded figure without its sentence refuses the page', 'open', 'not built'],
    ['R31', 'A conformance suite, and the checks as a package.', 'fixtures labelled pass or refuse that every implementation agrees on', exists('kits/warrant-check') ? 'partial' : 'open', 'the red controls are its seed'],
  ];
  const nState = (st) => RULES.filter((r) => r[3] === st).length;

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
  B.push(C.section({ lab: 'what the table agreed', title: 'Five points nobody argued against', id: 'agreed', wide: true,
    bodyRaw: C.plainList([
      { b: 'The two axes are the invention.', text: 'How a number was made (the stroke) is kept apart from what a question got (the word) and from how far a model was checked (the grade). Every seat built on that separation; none asked to merge the axes.' },
      { b: 'Ink is read, never chosen — enforced one level too low.', text: 'The drawing module takes no style, but it takes a standing typed by the author. The first recommendation was to read the standing from a typed value that carries its record (R17).' },
      { b: 'The one red is the best decision in the house.', text: 'One colour, kept for an exhibited counterexample. Nobody asked for a second hue.' },
      { b: 'A refusal drawn as a refusal is new.', text: 'The empty set and a word, never a zero-height bar. The table asked for the void to be drawn larger, not smaller.' },
      { b: 'The display is a sound map of the record, and the build decides it.', text: '“A system that is the mathematics itself” was refused as a slogan and kept as this law, drawn at the top of this page.' },
    ]) }));
  B.push(C.section({ lab: 'the foundations', title: 'Six axioms', id: 'axioms', wide: true,
    bodyRaw: C.plainList([
      { b: 'A1 · Soundness.', text: 'Drawing is a map from a record to marks; reading is the map back to the records that could have produced them. A page is sound when every record it draws is among the records its marks can be read back to: no mark stronger than its record, in standing, in extent or in verdict word.' },
      { b: 'A2 · Completeness.', text: 'Every row of the record a page draws from is a mark, or the empty set with a word.' },
      { b: 'A3 · Outward, in digits and in pixels.', text: 'A lower end rounds down and an upper end rounds up, at the resolution the figure declares.' },
      { b: 'A4 · Standing is a scale with a guide.', text: 'Four standings onto five strokes, with the legend derived from the scale; every channel the scale uses is monotone in it or constant.' },
      { b: 'A5 · Standing is read from a typed value.', text: 'The value carries its datum, its standing, its premises and its record’s address; the arithmetic demotes it and the renderer only reads it.' },
      { b: 'A6 · A frame is a page.', text: 'In motion every frame obeys A1; a standing never tweens and a value never travels: it appears, or its enclosure narrows onto it.' },
    ]) }));
  const finding = (n, title, bodyRaw, fig, alt) => '<div class="rt-f"><h3 class="rt-h3"><span class="rt-n">' + n + '</span> ' + title + '</h3>' + C.pRaw(bodyRaw)
    + (fig ? C.figure({ svgRaw: fig, wide: false }) : '') + '</div>';
  B.push(C.section({ lab: 'the findings', title: 'Ten findings, each as it was and as it is', id: 'findings', wide: true,
    bodyRaw: '<div class="col">' + C.p('Each finding is a fact about the built site on 29 October, measured again before the rulings. Where a number moved, it is counted here twice by the same rule: on the site as git holds it at ' + FIX + '^, the commit before the first fixes, and on the site as it is built today.') + '</div>'
      + f1Fig
      + finding('F2', 'A dash with no standing', 'Dashed marks in figures that carried no standing, so nothing could check what the dash meant. The chart kit took a plain “dashed” switch; now it takes a standing, and the census counts what is left, which may only shrink.',
        pairs([{ k: 'dashed marks with no standing', then: THEN.unstanding, now: NOW.unstanding }, { k: 'pages carrying one', then: pagesOf(THEN.where.unstanding), now: pagesOf(NOW.where.unstanding) }], 'Dashed marks with no standing, before the fixes and now, and the pages carrying them.'))
      + finding('F3', 'The dotted line inks more than the dashed one', 'At the width the legend draws its strokes, ' + legendW + ' px, the chosen pattern inks ' + inkP(legendW).toFixed(3) + ' of its length and the computed one ' + inkC(legendW).toFixed(3) + ': the weaker standing carries more ink. It crosses above at ' + esc(fstr(xSmall)) + ' px in the small patterns and at ' + esc(fstr(xBig)) + ' px in the large ones. <b>Open.</b> Since D9 the tone carries the order (F1), and whether the density should too is a question for the reader study below.', f3Svg)
      + finding('F4', 'Pixels rounded to the nearest, not outward', 'Drawn at the top of this page: the staircase’s top on [1, 3/2] sat ' + esc(fstr(inside)) + ' of a pixel inside its record. Every edge now rounds outward and the builder refuses one drawn inside.', '')
      + finding('F5', 'A verdict chip wore a dash, and its shape was not a function of its word', 'A dash is a standing, so a chip border may not be dashed; and a word like CERTIFIED wore several chip shapes across the site. Before: ' + THEN.chipWordsMulti.map(esc).join('; ') + '. Now each word has one shape, and the census refuses a second.',
        pairs([{ k: 'dashed borders in page styles', then: THEN.dashedBorders, now: NOW.dashedBorders }, { k: 'verdict words in more than one shape', then: THEN.chipWordsMulti.length, now: NOW.chipWordsMulti.length }], 'Dashed borders and verdict words worn in more than one chip shape, before the fixes and now.'))
      + finding('F6', 'Standings typed at the call site', 'A number’s standing was written by hand where it was printed. Since D10 a number can be printed from its record through an address, and a gate re-reads every addressed number from the built page. <b>Partial:</b> most values still carry no address.',
        pairs([{ k: 'values with a record address', then: THEN.pointed, now: NOW.pointed }, { k: 'values without one', then: THEN.unpointed, now: NOW.unpointed }], 'Printed values with and without a record address, before the fixes and now.'))
      + finding('F7', 'A reason that lives only in a tooltip', 'A value’s reason (“measured, not decided”) was a hover title: invisible on a phone, a door with no handle on a desktop. <b>Open</b> (R22).',
        pairs([{ k: 'reasons shown only on hover', then: hiddenThen, now: reasonsHidden }], 'Value reasons shown only as a tooltip, before the fixes and now.'))
      + finding('F8', 'The ETH page said the opposite of its finding in ten seconds', 'Its first tile read “' + esc(eth0) + '”. A reader left believing ETH had been certified false. The first tile now reads “' + esc(eth1) + '”.', '')
      + finding('F9', 'The constants retyped in a sibling project', 'Machinidae carried its own copy of the five dash patterns, which is how twenty-five patterns once grew on this site. <b>Open</b> (R29): one registry file, lifted by digest.', '')
      + finding('F10', 'Motion in the standing channel', 'The landing’s flow animated a dash offset (' + dashAnim(landingThen) + ' animation then, ' + dashAnim(landingNow) + ' now): decoration in the channel that carries standing. It is a translated point now, and a video that slid a decided tick was rejected.', '')
      + W.legendHtml() }));
  B.push(C.section({ lab: 'the candidate rules', title: 'Fifteen rules, and which of them a build enforces', id: 'rules', wide: true,
    bodyRaw: '<div class="col">' + C.p('The table proposed fifteen rules. A rule enters the rulebook when a check exists that refuses a page breaking it; until then it binds new work. The status below is decided by this page’s build, from the code and the census: ' + nState('gated') + ' gated, ' + nState('partial') + ' partly, ' + nState('open') + ' open.') + '</div>'
      + '<div class="wide"><div class="tw"><table><thead><tr><th>rule</th><th>what it says</th><th>the check</th><th>status</th></tr></thead><tbody>'
      + RULES.map(([n, say, check, st, note]) => '<tr><td class="mono">' + n + '</td><td>' + esc(say) + '</td><td>' + esc(check) + '</td><td><span class="rt-st">' + st + '</span><br><span class="rt-note">' + esc(note) + '</span></td></tr>').join('')
      + '</tbody></table></div></div>' }));
  B.push(C.section({ lab: 'what is open', title: 'The research the table asked for', id: 'open', wide: true,
    bodyRaw: C.plainList([
      { b: 'The soundness census.', text: 'Over every figure the render gate already records: how many extents are drawn from a float midpoint or rounded inward, how many dashes carry no standing. A measurement before a rule.' },
      { b: 'The ink-density theorem.', text: 'The ink each pattern carries at each width, the order checked at every width the site draws (F3).' },
      { b: 'The frame census.', text: 'Every frame of a video checked like a page (R25).' },
      { b: 'The reader study.', text: 'Pre-registered, a few hundred readers, the specimens on the grammar page, one question: which of these lines was proved? A grammar checked only by its own red controls has never left the house.' },
    ]) + '<div class="col">' + C.pRaw('The rulebook itself is <a href="../index.html">the grammar page</a>; the rulings that followed this table are its dated sections.') + '</div>' }));

  const head = (() => { try { return git(['rev-parse', '--short', 'HEAD']).trim(); } catch (e) { return 'unknown'; } })();
  const foot = '<p>Built from playground/warrant.js, design/tokens.js, design/grammar.js, the grammar page, the marks census (tools/check-grammar.js) run on the site now and as git holds it at ' + FIX + '^, at git ' + esc(head) + ', by tools/build-grammar-roundtable.js. MIT.</p>';
  const CSS = `
/* /grammar/roundtable/ (tools/build-grammar-roundtable.js): the caption key (the hero under the header is design/template.js), F1's old tones,
   the findings' headings, the rules' status */
.rt-k{display:block;margin-bottom:var(--s-1);font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-2)}
.rt-before .w-computed{stroke:var(${TB[1].tok})}
.rt-before .w-chosen{stroke:var(${TB[2].tok})}
.rt-f{margin-top:var(--s-7)}
.rt-h3{margin-bottom:var(--s-2)}
.rt-n{font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink-3);margin-right:var(--s-2)}
.rt-f figure{margin-top:var(--s-4)}
.rt-st{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink)}
.rt-note{color:var(--ink-4);font-size:var(--text-small)}
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
