#!/usr/bin/env node
/* battery.js — the gate for the design system.

   design/DESIGN.md has always said that a figure may use ONLY the token names
   in tokens.FIGURE_TOKENS, because a literal colour is invisible in one of the
   two themes. Until now that was a sentence, not a check — and a cited rule
   with no check is exactly the failure this repository keeps finding in other
   people's work. This file makes it true:

     T  the tokens are complete and defined in BOTH themes
     P  the chart palette passes the checks it claims to pass — recomputed here
        in OKLab with the Machado-Oliveira-Fernandes 2009 CVD model, not quoted
        from the day it was chosen
     F  every generated page's inline SVG uses tokens only, and every figure
        carries a text alternative
     X  falsifiers — each must turn its own target red

   The palette block is the interesting one. tokens.js records that the chart
   trio clears the lightness band, the chroma floor and a CVD separation in the
   6-8 floor band; those are measurements, and a measurement that is not re-run
   is a memory. Re-running it here means a future edit to a chart colour cannot
   quietly break colour-vision safety.

   usage: node design/battery.js
   MIT licensed. Part of cert-machine. */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const T = require(path.join(__dirname, 'tokens.js'));

let fails = 0, checks = 0;
function check(name, cond, detail) {
  checks++;
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail !== undefined ? '   [' + detail + ']' : ''));
  if (!cond) fails++;
}

/* ---------- colour maths (OKLab + Machado 2009), so the claims re-run ------
   The functions live in design/colour.js since 2026-10-29, moved byte for byte so the print register's validator
   (design/print/validate.js) runs the same code this battery does rather than a copy of it. */
const { oklch, deltaE, contrast } = require(path.join(__dirname, 'colour.js'));

const CATK = ['--c-1', '--c-2', '--c-3'];
const SEQK = ['--c-s1', '--c-s2', '--c-s3', '--c-s4', '--c-s5'];
const PAL = T.DARKONLY;
const CHART_SURFACE = PAL['--sunk'];

/* ================= T · the tokens ======================================== */
{
  const missing = T.FIGURE_TOKENS.filter(k => !(k in PAL));
  check('T1 every FIGURE_TOKEN is defined in the palette',
    missing.length === 0, missing.length ? missing.join(', ') : T.FIGURE_TOKENS.length + ' tokens');
}
{
  /* the light theme (2026-10-30, the operator's word) re-points palette names only, at print-register values only:
     LIGHT_THEME() throws otherwise, and the DARK alias is still the one palette */
  let L = null, why = '';
  try { L = T.LIGHT_THEME(); } catch (e) { why = e.message; }
  const PR = require(path.join(__dirname, 'print', 'tokens.js'));
  const ok = T.DARK === PAL && !!L && Object.keys(L).every((k) => k in PAL)
    && Object.values(L).every((v) => /^rgba\(0,0,0,/.test(v) || PR.REGISTER.some((x) => x.hex === v)) && !('--witness' in L);
  check('T2 the light theme names only palette tokens, takes only the print register\'s values, and keeps the one red'
    + (why ? ' — ' + why : ' — ' + (L ? Object.keys(L).length : 0) + ' names'), ok);
}
{
  /* TWO THEME STATES AND NO THIRD (2026-10-30): the full palette on bare :root with color-scheme:dark, the default;
     exactly one light block under :root[data-theme="light"], set by the reader's pill and never by the OS; and none
     of the retired three-state machinery (a prefers-color-scheme query, a data-theme="dark" block) */
  const css = T.rootCss();
  const ok = /:root\{\n  color-scheme:dark;/.test(css)
    && (css.match(/:root\[data-theme="light"\]\{\n  color-scheme:light;/g) || []).length === 1
    && (css.match(/data-theme/g) || []).length === 1
    && !/prefers-color-scheme/.test(css);
  check('T3 the cascade is dark by declaration plus ONE light block the pill sets — no OS branch, no dead branches', ok);
}
{
  /* T3b — THE SAME QUESTION, ASKED OF EVERY SURFACE THAT SHIPS CSS.
     T3 above reads tokens.js's :root block and nothing else, so on 2026-09-05 it
     was green while design/app-shell.js still declared `color-scheme:light dark`
     on its <select> — the last of the deleted light theme, telling the browser to
     render the native dropdown popup light on a light-OS machine. A one-theme
     gate that only inspects one file is a gate over an incomplete set, which is
     the defect check-wiring exists to name.

     Every generator that emits CSS is concatenated and asked the same three
     questions. Static .css files are read from disk for the same reason. */
  const path = require('path');
  const fs = require('fs');
  const R = path.resolve(__dirname, '..');
  const surfaces = [];
  /* PROSE IS NOT A DECLARATION. These files explain, at length, the light theme
     they deleted — so a gate that greps the raw text flags its own documentation.
     CSS comments are stripped before the questions are asked, the same respect
     check-render pays to prose in a sentence. */
  const decls = (t) => String(t).replace(/\/\*[\s\S]*?\*\//g, '');
  const add = (name, fn) => { try { surfaces.push([name, decls(fn())]); } catch (e) { surfaces.push([name, 'THREW: ' + e.message]); } };
  /* tokens.rootCss is not asked here: it is the ONE place a light block may live since 2026-10-30, and T3 above
     holds its shape. Every other surface is asked whether it declares a second one. */
  add('nav.navCss', () => require(path.join(R, 'design/nav.js')).navCss());
  /* THE APP TOKENS' HALF OF THE ONE LIGHT THEME (2026-10-30 late, the apps took the pill). design/app-shell.js owns
     tokens tokens.js does not have (--v-cert, --v-refd, the washes, the glyph filter), so their light values sit in ONE
     block there, under the same selector. It is not a second theme: it is let through only when it is exactly one
     block, it names exactly APP_LIGHT's tokens, and APP_LIGHT re-points exactly APP_DARK's names (no new name, no
     site token). Anything else in that file that says data-theme is still a leak. */
  add('app-shell.appCss', () => {
    const A = require(path.join(R, 'design/app-shell.js'));
    const css = A.appCss(), re = /:root\[data-theme="light"\]\{([^}]*)\}/g, blocks = [...css.matchAll(re)];
    const same = (a, b) => a.length === b.length && a.every((k) => b.includes(k));
    const names = blocks.length === 1 ? blocks[0][1].split(';').map((d) => d.split(':')[0].trim()).filter(Boolean) : [];
    return blocks.length === 1 && same(names, Object.keys(A.APP_LIGHT)) && same(Object.keys(A.APP_LIGHT), Object.keys(A.APP_DARK))
      ? css.replace(re, '') : css;
  });
  add('template.css', () => require(path.join(R, 'design/template.js')).css());
  add('components.sharedCss', () => require(path.join(R, 'playground/design/components.js')).sharedCss());
  for (const f of ['playground/design/shell.css', 'playground/design/bench.css']) {
    add(f, () => fs.readFileSync(path.join(R, f), 'utf8'));
  }
  global.__lightLeak = (t) => /prefers-color-scheme/.test(t) || /data-theme/.test(t)
    || /color-scheme\s*:\s*(light\b|[^;}]*\blight\s+dark)/.test(t);
  const leaks = [];
  for (const [name, text] of surfaces) {
    if (/prefers-color-scheme/.test(text)) leaks.push(name + ': prefers-color-scheme');
    if (/data-theme/.test(text)) leaks.push(name + ': data-theme');
    if (/color-scheme\s*:\s*(light\b|[^;}]*\blight\s+dark)/.test(text)) leaks.push(name + ': color-scheme with a light branch');
  }
  check('T3b no CSS surface but design/tokens.js declares a light theme (one definition) — ' + surfaces.length + ' surfaces'
    + (leaks.length ? ' — ' + leaks.join(' · ') : ''), leaks.length === 0);
}

/* ================= P · the chart palette, recomputed =====================
   The frontier skin's categorical marks are near-neutral GRAYS: identity is
   carried by LIGHTNESS plus the secondary channels (legend, direct labels,
   dash-for-predicted, hatch), never by hue. That changes what must be proved:
   colour-vision safety comes from neutrality itself (a gray is a gray under
   every CVD), so the battery asserts near-neutrality AND re-simulates the
   worst pair anyway — the simulation is the tripwire for a chromatic value
   sneaking into a slot the neutrality argument covers. */
{
  const cat = CATK.map(k => PAL[k]);
  const chromatic = cat.filter(h => oklch(h)[1] > 0.03);
  check('P1 every categorical mark is near-neutral (OKLCH chroma ≤ 0.03) — CVD-safe by construction',
    chromatic.length === 0, chromatic.length ? chromatic.join(', ') : cat.map(h => oklch(h)[1].toFixed(4)).join(' · '));
  let worst = { d: Infinity }, worstN = { d: Infinity };
  for (let i = 0; i < cat.length; i++) for (let j = i + 1; j < cat.length; j++) {
    for (const kind of ['protan', 'deutan', 'tritan']) {
      const d = deltaE(cat[i], cat[j], kind);
      if (d < worst.d) worst = { d, p: cat[i] + '↔' + cat[j], kind };
    }
    const dn = deltaE(cat[i], cat[j]);
    if (dn < worstN.d) worstN = { d: dn, p: cat[i] + '↔' + cat[j] };
  }
  check('P2 worst all-pairs NORMAL-vision separation clears 15 (lightness does the identity work)',
    worstN.d >= 15, worstN.p + ' ΔE ' + worstN.d.toFixed(1));
  check('P3 worst all-pairs separation under each CVD simulation clears 12 (the chromatic tripwire)',
    worst.d >= 12, worst.p + ' ΔE ' + worst.d.toFixed(1) + ' (' + worst.kind + ')');
  const lowK = cat.filter(h => contrast(h, CHART_SURFACE) < 3);
  check('P4 every categorical mark clears 3:1 against the chart surface',
    lowK.length === 0, lowK.length ? lowK.join(', ') : cat.map(h => contrast(h, CHART_SURFACE).toFixed(2) + ':1').join(' · '));

  const seq = SEQK.map(k => PAL[k]);
  const Ls = seq.map(h => oklch(h)[0]);
  const mono = Ls.every((v, i) => i === 0 || v > Ls[i - 1]);   /* dim -> bright with magnitude */
  const gaps = Ls.slice(1).map((v, i) => Math.abs(v - Ls[i]));
  const seqChromatic = seq.filter(h => oklch(h)[1] > 0.03);
  check('P5 the sequential ramp is near-neutral, monotone dim→bright, ΔL ≥ 0.06 per step',
    mono && Math.min.apply(null, gaps) >= 0.06 && seqChromatic.length === 0,
    'L ' + Ls.map(v => v.toFixed(2)).join('→') + ' · min ΔL ' + Math.min.apply(null, gaps).toFixed(3));
  check('P6 the ramp\'s dim end still clears 2:1 on the chart surface',
    contrast(seq[0], CHART_SURFACE) >= 2, seq[0] + ' at ' + contrast(seq[0], CHART_SURFACE).toFixed(2) + ':1');
  /* W1 — TONE IS MONOTONE IN STANDING (D9, ruled 2026-10-29: chosen was --ink-2, brighter
     than computed's --ink-3, so the weaker standing read stronger). The class → token mapping is READ from
     playground/warrant.js css(), never retyped; on screen L(decided) ≥ L(computed) ≥ L(chosen); on paper
     (design/print/tokens.js) the order reverses with the ground. */
  global.__toneOrder = (map, pal, paper) => {
    const L = (k) => oklch(pal[k])[0];
    const d = L(map['w-decided']), c = L(map['w-computed']), h = L(map['w-chosen']);
    return paper ? (d <= c && c <= h) : (d >= c && c >= h);
  };
  {
    const css = require(path.join(ROOT, 'playground', 'warrant.js')).css();
    const map = {};
    for (const cls of ['w-decided', 'w-computed', 'w-chosen']) {
      const m = new RegExp('\\.' + cls + '\\s*\\{\\s*stroke:\\s*var\\((--[a-z0-9-]+)\\)').exec(css);
      map[cls] = m ? m[1] : null;
    }
    const PR = require(path.join(ROOT, 'design', 'print', 'tokens.js'));
    const pmap = {}, ppal = {};
    for (const s of PR.STANDINGS) if (s.token) { pmap[s.cls] = s.token; ppal[s.token] = PR.hex(s.token); }
    check('W1 stroke tone is monotone in standing: screen L(decided) ≥ L(computed) ≥ L(chosen), paper the reverse (read from warrant.js css() and the print register)',
      Object.values(map).every(Boolean) && global.__toneOrder(map, PAL, false) && global.__toneOrder(pmap, ppal, true),
      'screen ' + ['w-decided', 'w-computed', 'w-chosen'].map((k) => map[k] + ' L ' + (map[k] ? oklch(PAL[map[k]])[0].toFixed(2) : '?')).join(' · ')
        + ' | paper ' + ['w-decided', 'w-computed', 'w-chosen'].map((k) => pmap[k] + ' L ' + oklch(ppal[pmap[k]])[0].toFixed(2)).join(' · '));
  }
  check('P7 verdict separation is weight+shape, not colour: the chip grammar\'s two inks clear 4.5:1 text contrast',
    contrast(PAL['--ink'], PAL['--paper']) >= 4.5 && contrast(PAL['--ink-3'], PAL['--paper']) >= 4.5,
    contrast(PAL['--ink'], PAL['--paper']).toFixed(1) + ':1 · ' + contrast(PAL['--ink-3'], PAL['--paper']).toFixed(1) + ':1');
}

/* ================= F · the generated figures ============================= */
/* Literal colours are the thing this block exists to catch. Everything a
   figure may say is either a var(--token) from the list, or one of the four
   keywords that carry no colour at all. */
const ALLOWED = new Set(T.FIGURE_TOKENS);
const KEYWORDS = new Set(['none', 'transparent', 'currentcolor', 'inherit']);
function svgColourViolations(html, file) {
  const bad = [];
  const svgs = html.match(/<svg[\s\S]*?<\/svg>/g) || [];
  for (const svg of svgs) {
    const re = /(?:fill|stroke|stop-color|flood-color)\s*=\s*"([^"]*)"/g;
    let m;
    while ((m = re.exec(svg))) {
      const v = m[1].trim();
      if (!v || KEYWORDS.has(v.toLowerCase()) || /^url\(#/.test(v)) continue;
      const tok = /^var\(\s*(--[a-z0-9-]+)\s*\)$/i.exec(v);
      if (tok && ALLOWED.has(tok[1])) continue;
      bad.push(file + ': ' + v);
    }
    /* the same rule inside style="" attributes on svg children */
    const sre = /style\s*=\s*"([^"]*)"/g;
    while ((m = sre.exec(svg))) {
      const decls = m[1].split(';');
      for (const d of decls) {
        const kv = /^\s*(fill|stroke|stop-color|color)\s*:\s*(.+)$/i.exec(d);
        if (!kv) continue;
        const v = kv[2].trim();
        if (KEYWORDS.has(v.toLowerCase()) || /^url\(#/.test(v)) continue;
        const tok = /^var\(\s*(--[a-z0-9-]+)\s*\)$/i.exec(v);
        if (tok && ALLOWED.has(tok[1])) continue;
        bad.push(file + ' (style): ' + v);
      }
    }
  }
  return bad;
}
{
  const dir = path.join(ROOT, 'reports');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.html')) : [];
  let bad = [], figs = 0, noAlt = [];
  for (const f of files) {
    const html = fs.readFileSync(path.join(dir, f), 'utf8');
    bad = bad.concat(svgColourViolations(html, f));
    for (const svg of (html.match(/<svg[\s\S]*?>/g) || [])) {
      figs++;
      if (/role="img"/.test(svg) && !/aria-label="[^"]+"/.test(svg)) noAlt.push(f);
    }
  }
  check('F1 no generated report figure carries a literal colour — tokens only, so both themes are real',
    bad.length === 0, bad.length ? bad.slice(0, 4).join(' · ') + (bad.length > 4 ? ' …+' + (bad.length - 4) : '')
      : files.length + ' pages, ' + figs + ' svg roots, 0 literals');
  check('F2 every figure declared role="img" carries a non-empty text alternative',
    noAlt.length === 0, noAlt.length ? [...new Set(noAlt)].join(', ') : figs + ' checked');
}

/* ---- the other way a page lies: markup that arrived as DATA --------------
   components.js escapes everything on the value path, and that escape is the
   honest default — it is why a ledger string can never become markup. The
   cost is a failure mode with no other alarm: a builder that concatenates a
   <strong> into a table cell, or a <span class="m"> into C.p(), ships the TAG
   ITSELF as visible text. The reader sees &lt;strong&gt;9 / 10 certified&lt;/
   strong&gt; where a number should be. Nothing throws, no page fails to
   build, and the defect is invisible to every check above — which is exactly
   how it reached the newest, most-promoted page and stood there in
   production. The escape is never the bug; the raw affordances (pRaw, {raw}
   cells) are the fix. So this check measures the OUTPUT and names the page.

   Cut first: <pre>/<code>, where a source listing shows markup ON PURPOSE,
   and <script>/<style>, where entities are never decoded into anything. The
   tag-name list is what makes the check discriminate rather than nag — a
   report that writes the tensor &lt;2,2,2&gt;, as the matmul pages do
   constantly, is escaping an angle bracket, not leaking a tag. */
const LEAK_TAGS = 'strong|em|code|br|span|b|i|a|p|div|ul|ol|li|h[1-6]|pre|sup|sub'
  + '|blockquote|figure|figcaption|table|tr|td|th';
const LEAK_RE = new RegExp('&lt;/?(?:' + LEAK_TAGS + ')\\b[^<>]{0,200}?&gt;', 'gi');
function escapedTagLeaks(html, file) {
  const text = String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<pre[\s\S]*?<\/pre>/gi, '')
    .replace(/<code[\s\S]*?<\/code>/gi, '');
  const out = [];
  let m;
  LEAK_RE.lastIndex = 0;
  while ((m = LEAK_RE.exec(text))) out.push(file + ': ' + m[0]);
  return out;
}
/* A page carrying a KNOWN leak of exactly this shape and count, whose builder
   the session that added this check did not own. An entry is a DEBT, not a
   pass: the check fails if the count moves in EITHER direction — a new leak,
   or the fix landing and the entry going stale. Deleting the line is the only
   way a page leaves this list, so the exception cannot rot into a hole.
     mfg-observatory.html · 6 · tools/build-report-mfg-observatory.js:467
       a C.p() carrying three C.m() spans; the one-line fix is C.pRaw(). */
const LEAK_DEBT = {};   /* mfg-observatory.html paid off 2026-08-30 — C.p -> C.pRaw at §8 */
{
  const dir = path.join(ROOT, 'reports');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.html')) : [];
  let bad = [];
  const stale = [];
  for (const f of files) {
    const found = escapedTagLeaks(fs.readFileSync(path.join(dir, f), 'utf8'), f);
    const owed = LEAK_DEBT[f] || 0;
    if (found.length > owed) bad = bad.concat(found);
    else if (found.length < owed) stale.push(f + ' leaks ' + found.length + ', debt says ' + owed
      + ' — the fix landed: DELETE its line from LEAK_DEBT in design/battery.js');
  }
  const owedNote = Object.keys(LEAK_DEBT).length
    ? ' · owed, not forgiven: ' + Object.keys(LEAK_DEBT).map(k => k + ' \u00d7' + LEAK_DEBT[k]).join(', ') : '';
  check('F3 no report page shows an escaped HTML tag as visible text — markup that reached a cell as DATA',
    bad.length === 0 && stale.length === 0,
    bad.length ? bad.slice(0, 4).join(' \u00b7 ') + (bad.length > 4 ? ' \u2026+' + (bad.length - 4) : '')
      : stale.length ? stale.join(' \u00b7 ')
      : files.length + ' pages, 0 leaks' + owedNote);
}

/* ---- F4 · the FULL-ROW RULE (2026-09-02) --------------------------------
   A grid must never expose an empty track (the fused stats grid renders one
   as a giant blank cell — the broken-grid look). Enforcement has two ends:
   the template must CARRY the balanced per-count rules and the remainder
   guards, and every built stats block must carry data-n equal to its cell
   count (the invariant the per-count CSS keys on). */
function statsGridViolations(html, file) {
  const out = [];
  const re = /<div class="stats"([^>]*)>([\s\S]*?)\n  <\/div>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const dn = /data-n="(\d+)"/.exec(m[1]);
    const cells = (m[2].match(/class="stat"/g) || []).length;
    if (!dn) out.push(file + ': a stats grid without data-n (' + cells + ' cells)');
    else if (Number(dn[1]) !== cells) out.push(file + ': data-n=' + dn[1] + ' but ' + cells + ' cells');
  }
  return out;
}
{
  const TPL = require(path.join(__dirname, 'template.js'));
  const cssText = TPL.css();
  let rulesOk = true;
  for (let n = 1; n <= 12; n++) if (!cssText.includes('.stats[data-n="' + n + '"]{grid-template-columns')) rulesOk = false;
  check('F4a the template carries the balanced stats layout for every count 1..12',
    rulesOk && cssText.includes('.stats .stat:last-child:nth-child(odd)'));
  check('F4b .cards and .pk-grid carry the odd-last full-row guard',
    cssText.includes('.cards>:last-child:nth-child(odd)') && cssText.includes('.pk-grid>:last-child:nth-child(odd)'));
  const shell = fs.readFileSync(path.join(ROOT, 'design', 'app-shell.js'), 'utf8');
  check('F4c the app shell grids carry remainder guards',
    shell.includes('.as-datablocks>:last-child:nth-child(4n+1)') && shell.includes('.as-stats>:last-child:nth-child(3n+1)'));
  const dirs = [['reports', path.join(ROOT, 'reports')], ['root', ROOT]];
  let bad = [], pages = 0;
  for (const [tag, dir] of dirs) {
    const files = tag === 'root' ? ['index.html'] : fs.readdirSync(dir).filter(f => f.endsWith('.html'));
    for (const f of files) {
      const p = path.join(dir, f);
      if (!fs.existsSync(p)) continue;
      pages++;
      bad = bad.concat(statsGridViolations(fs.readFileSync(p, 'utf8'), f));
    }
  }
  check('F4d every built stats grid carries data-n equal to its cell count',
    bad.length === 0, bad.length ? bad.slice(0, 4).join(' · ') : pages + ' pages scanned, 0 violations');
}

/* ================= X · falsifiers ======================================== */
console.log('\n    executing falsifiers');
let reds = 0; const redTotal = 15;
{
  /* the grayscale palette gate has teeth: a planted near-identical gray pair
     must fail the ΔE-15 separation the real trio passes */
  const d = deltaE('#a9a9b4', '#b0b0bb');
  if (d < 15) { reds++; console.log('       RED ok  X0 a planted near-identical gray pair fails the separation gate (ΔE ' + d.toFixed(1) + ')'); }
  else console.log('       RED FAIL  X0 an indistinguishable gray pair passed the separation gate');
}
{
  const bad = svgColourViolations('<svg><rect fill="#ff0000"/></svg>', 'planted');
  if (bad.length === 1) { reds++; console.log('       RED ok  X1 a planted literal hex in a figure is caught'); }
  else console.log('       RED FAIL  X1 the literal-colour scanner has no power');
}
{
  const bad = svgColourViolations('<svg><rect style="fill: rgb(1,2,3)"/></svg>', 'planted');
  if (bad.length === 1) { reds++; console.log('       RED ok  X2 a literal hiding inside a style attribute is caught'); }
  else console.log('       RED FAIL  X2 the style-attribute path is not scanned');
}
{
  const bad = svgColourViolations('<svg><rect fill="var(--not-a-token)"/></svg>', 'planted');
  if (bad.length === 1) { reds++; console.log('       RED ok  X3 a var() naming a token outside FIGURE_TOKENS is caught'); }
  else console.log('       RED FAIL  X3 undeclared tokens pass the scanner');
}
{
  const CH = require(path.join(__dirname, 'charts.js'));
  let threw = false;
  try { CH.legend([{ token: 'var(--c-1)' }], 0, 0); } catch (e) { threw = true; }
  if (threw) { reds++; console.log('       RED ok  X4 a legend swatch with no word beside it is REFUSED (colour is never the only channel)'); }
  else console.log('       RED FAIL  X4 an unlabelled swatch was accepted');
}
{
  /* the scatter form (the phase-map picture): rendered output is token-only,
     hover-reachable, and its two construction rules refuse when violated */
  const CH = require(path.join(__dirname, 'charts.js'));
  const svg = CH.scatter({
    w: 400, h: 200, x0: 0.001, x1: 0.1, logX: true, y0: 0, y1: 0.3, alt: 'planted phase map',
    xTicks: [{ v: 0.001, t: '1e-3' }, { v: 0.01, t: '1e-2' }], yTicks: [0, 0.1, 0.2],
    pts: [{ x: 0.002, y: 0.2, token: 'var(--c-1)', k: 'cell', v: '2 peaks' },
          { x: 0.02, y: 0.2, token: 'var(--c-2)', k: 'cell', v: '1 peak' },
          { x: 0.002, y: 0.15, token: 'var(--c-1)', k: 'T4', v: 'theorem', diamond: true }],
    curves: [{ pts: [[0.001, 0.1], [0.01, 0.2]], token: 'var(--c-ctx)', dashed: true, k: 'predicted' }],
    vlines: [{ x: 0.0126, token: 'var(--c-ctx)', t: 'sigma*', dashed: false }],
    keys: [{ token: 'var(--c-1)', t: 'split' }, { token: 'var(--c-2)', t: 'single' }],
  });
  check('F5 the scatter form renders token-only with legend, diamond and hover marks',
    svgColourViolations('<svg' + svg.split('<svg')[1], 'scatter').length === 0
    && /data-cm=/.test(svg) && /stroke-dasharray="5 4"/.test(svg) && /Z" fill=/.test(svg));
  let threw1 = false;
  try { CH.scatter({ w: 400, h: 200, x0: 0, x1: 1, y0: 0, y1: 1, alt: 'x', pts: [{ x: 0.1, y: 0.1, token: 'var(--c-1)' }, { x: 0.2, y: 0.2, token: 'var(--c-2)' }] }); } catch (e) { threw1 = true; }
  if (threw1) { reds++; console.log('       RED ok  X7 a two-colour scatter with no legend is REFUSED'); }
  else console.log('       RED FAIL  X7 a two-colour scatter rendered without a legend');
  let threw2 = false;
  try { CH.scatter({ w: 400, h: 200, x0: 0, x1: 1, logX: true, y0: 0, y1: 1, alt: 'x', pts: [] }); } catch (e) { threw2 = true; }
  if (threw2) { reds++; console.log('       RED ok  X8 a log x-axis with a zero floor is REFUSED, never clamped'); }
  else console.log('       RED FAIL  X8 a zero floor was silently accepted on a log x-axis');

  /* the portrait form: renders token-only with both scales; its one rule fires */
  const dual = CH.lines2({
    w: 400, h: 220, x0: 0, x1: 1, alt: 'planted portrait',
    xTicks: [0, 0.5, 1],
    left: { y0: 0.8, y1: 1.2, ticks: [0.9, 1, 1.1], label: 'm', series: [{ pts: [[0, 1], [0.5, 1.1], [1, 1]], token: 'var(--c-1)', k: 'm' }] },
    right: { y0: -1, y1: 1, ticks: [-1, 0, 1], label: 'V', series: [{ pts: [[0, 1], [0.5, -1], [1, 1]], token: 'var(--c-ctx)', dashed: true, k: 'V' }] },
    keys: [{ token: 'var(--c-1)', t: 'density', kind: 'line' }, { token: 'var(--c-ctx)', t: 'potential', kind: 'dash' }],
  });
  check('F6 the dual-scale portrait form renders token-only with the reference series dashed',
    svgColourViolations('<svg' + dual.split('<svg')[1], 'lines2').length === 0 && /stroke-dasharray="5 4"/.test(dual));
  let threw3 = false;
  try {
    CH.lines2({ w: 400, h: 220, x0: 0, x1: 1, alt: 'x', xTicks: [],
      left: { y0: 0, y1: 1, ticks: [], series: [{ pts: [[0, 0], [1, 1]], token: 'var(--c-1)' }] },
      right: { y0: 0, y1: 1, ticks: [], series: [{ pts: [[0, 1], [1, 0]], token: 'var(--c-1)' }] } });
  } catch (e) { threw3 = true; }
  if (threw3) { reds++; console.log('       RED ok  X9 a right-scale series sharing the left\'s stroke style is REFUSED'); }
  else console.log('       RED FAIL  X9 two scales were allowed to share a stroke style');
}
{
  const bad = escapedTagLeaks('<td>&lt;strong&gt;9 / 10 certified&lt;/strong&gt;</td>', 'planted');
  if (bad.length === 2) { reds++; console.log('       RED ok  X5 the cell that shipped \u2014 an escaped <strong> pair standing in for a number \u2014 is caught'); }
  else console.log('       RED FAIL  X5 escaped markup can reach a page as visible text unseen   [' + bad.length + ' found, want 2]');
}
{
  /* power AND discrimination in one control: a check that fired on every
     escaped angle bracket would flag the tensor notation on half the reports
     and be switched off within a week, which is the same as having no check */
  const bad = escapedTagLeaks('<p>Conjugate the &lt;2,2,2&gt; tensor. &lt;em&gt;this one leaked&lt;/em&gt;</p>', 'planted');
  if (bad.length === 2 && !bad.some(b => /2,2,2/.test(b))) { reds++; console.log('       RED ok  X6 a leaked <em> is caught while the escaped tensor <2,2,2> beside it is not'); }
  else console.log('       RED FAIL  X6 the scanner does not separate a leaked tag from an honestly escaped bracket   [' + bad.length + ' found, want 2]');
}
{
  /* the FULL-ROW RULE's teeth: a stats grid whose data-n lies, and one with
     no data-n at all, must both be caught — that attribute is what keys the
     balanced per-count layout, so a mismatch IS the broken grid */
  const planted = '<div class="stats" data-n="4">\n'
    + Array.from({ length: 6 }, () => '    <div class="stat"><div class="k">A</div></div>').join('\n') + '\n  </div>';
  const b1 = statsGridViolations(planted, 'planted');
  if (b1.length === 1 && /data-n=4 but 6 cells/.test(b1[0])) { reds++; console.log('       RED ok  X10 a stats grid whose data-n lies about its cell count is caught'); }
  else console.log('       RED FAIL  X10 a lying data-n passed the full-row gate   [' + JSON.stringify(b1) + ']');
  const b2 = statsGridViolations('<div class="stats">\n    <div class="stat"><div class="k">A</div></div>\n  </div>', 'planted');
  if (b2.length === 1 && /without data-n/.test(b2[0])) { reds++; console.log('       RED ok  X11 a stats grid emitted without data-n is caught'); }
  else console.log('       RED FAIL  X11 a data-n-less grid passed the full-row gate');
  let threw = false;
  const C = require(path.join(__dirname, 'components.js'));
  try { C.stats(Array.from({ length: 13 }, (_, i) => ({ k: 'k' + i, v: 'v' }))); } catch (e) { threw = /1\.\.12/.test(e.message); }
  if (threw) { reds++; console.log('       RED ok  X12 a 13-cell stats row is REFUSED at the component (the balanced grid is defined for 1..12)'); }
  else console.log('       RED FAIL  X12 an out-of-range stats count was accepted');
}
{
  /* X13 — the light-theme gate must be able to SEE a leak, or T3b is decoration.
     Attacks the same predicate T3b runs, with the exact declaration that was
     live in design/app-shell.js until 2026-09-05. */
  const L = global.__lightLeak;
  const caught = L('select.as-sel{color-scheme:light dark}')
    && L('@media (prefers-color-scheme: light){.x{color:#000}}')
    && !L('select.as-sel{color-scheme:dark}');
  if (caught) { reds++; console.log('       RED ok  X13 a planted light-dark select and a light media query are caught, a dark one is not'); }
  else console.log('       RED FAIL  X13 the light-theme gate cannot see a leak');
}
{
  /* X14 — W1 must be able to see the inversion it was written for: the mapping as it stood until 2026-10-29
     (chosen --ink-2, computed --ink-3) planted into the same predicate W1 runs. */
  const inv = global.__toneOrder({ 'w-decided': '--ink', 'w-computed': '--ink-3', 'w-chosen': '--ink-2' }, PAL, false);
  const ok = global.__toneOrder({ 'w-decided': '--ink', 'w-computed': '--ink-2', 'w-chosen': '--ink-3' }, PAL, false);
  if (!inv && ok) { reds++; console.log('       RED ok  X14 the pre-D9 tone mapping (chosen brighter than computed) is caught by W1\'s predicate'); }
  else console.log('       RED FAIL  X14 W1 cannot see an inverted tone order');
}
console.log('    every falsifier turned its target red   [' + reds + '/' + redTotal + ']');
if (reds !== redTotal) fails++;

console.log('\n' + (fails === 0 ? 'ALL PASS' : fails + ' FAILED') + '   (' + checks + ' checks, ' + reds + '/' + redTotal + ' falsifiers)');
process.exit(fails === 0 ? 0 : 1);
