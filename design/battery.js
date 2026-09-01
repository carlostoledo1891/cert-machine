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

/* ---------- colour maths (OKLab + Machado 2009), so the claims re-run ------ */
const MACHADO = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]]
};
const hex2srgb = h => { h = h.trim().replace(/^#/, ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255); };
const toLin = h => hex2srgb(h).map(v => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
function oklabFromLin([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
          1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
          0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
const oklch = h => { const [L, a, b] = oklabFromLin(toLin(h)); return [L, Math.hypot(a, b)]; };
const okhue = h => { const [, a, b] = oklabFromLin(toLin(h)); return ((Math.atan2(b, a) * 180 / Math.PI) % 360 + 360) % 360; };
function simulate(h, kind) {
  const [r, g, b] = toLin(h), M = MACHADO[kind], cl = c => Math.max(0, Math.min(1, c));
  return [cl(M[0][0] * r + M[0][1] * g + M[0][2] * b), cl(M[1][0] * r + M[1][1] * g + M[1][2] * b),
          cl(M[2][0] * r + M[2][1] * g + M[2][2] * b)];
}
function deltaE(h1, h2, kind) {
  const a = oklabFromLin(kind ? simulate(h1, kind) : toLin(h1));
  const b = oklabFromLin(kind ? simulate(h2, kind) : toLin(h2));
  return 100 * Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
const relLum = h => { const [r, g, b] = toLin(h); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

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
  check('T2 the LIGHT/DARK compatibility aliases resolve to the ONE palette (no second copy to drift)',
    T.LIGHT === PAL && T.DARK === PAL);
}
{
  /* one deliberate theme state (the frontier skin is dark-only): the full
     palette on bare :root with color-scheme:dark, and NONE of the retired
     three-state machinery lingering to define colours nobody can reach */
  const css = T.rootCss();
  const ok = /:root\{/.test(css) && /color-scheme:dark/.test(css)
    && !/prefers-color-scheme/.test(css) && !/data-theme/.test(css);
  check('T3 the cascade is ONE deliberate theme state — dark by declaration, no dead branches', ok);
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

/* ================= X · falsifiers ======================================== */
console.log('\n    executing falsifiers');
let reds = 0; const redTotal = 10;
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
console.log('    every falsifier turned its target red   [' + reds + '/' + redTotal + ']');
if (reds !== redTotal) fails++;

console.log('\n' + (fails === 0 ? 'ALL PASS' : fails + ' FAILED') + '   (' + checks + ' checks, ' + reds + '/' + redTotal + ' falsifiers)');
process.exit(fails === 0 ? 0 : 1);
