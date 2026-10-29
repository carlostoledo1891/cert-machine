#!/usr/bin/env node
/* check-svg.js — a print figure against OUR two rules: only the five permitted dashes, only the register's colours.
   design/print/ · cert-machine (2026-10-29)

   ONE RULE, ONE READER. The dash half is tools/check-grammar.js's own census: its normalisation and its three patterns
   (exported for this on 2026-10-29), and the permitted list it reads, design/grammar.js PERMITTED. Nothing is
   retyped, so a figure printed for a Petrobras report and a page on the site are held to the same list. The colour
   half reads design/print/tokens.js: a value that is not a register colour is a colour no validator has seen. A
   translucent register colour is one too (on paper, ink at 40% is a lighter grey nobody validated), and so is a
   raster <image>, whose colours cannot be read at all.

   usage: node design/print/check-svg.js [--mono] file.svg ...    exit 1 on any violation
          node design/print/check-svg.js --selftest               the red controls
   Used by design/print/specimen.js on the specimen sheets and by kits/warrant-mpl's test on the kit's figures.
   MIT licensed. Part of cert-machine. */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const G = require(path.join(ROOT, 'design', 'grammar.js'));
const { norm, RE } = require(path.join(ROOT, 'tools', 'check-grammar.js'));
const PR = require(path.join(__dirname, 'tokens.js'));

const PERMITTED = new Set(G.PERMITTED.map(norm));
const KEYWORDS = new Set(['none', 'transparent', 'currentcolor', 'inherit']);
const NAMED = { black: '#000000', white: '#ffffff' };
const registerSet = (mode) => new Set(PR.REGISTER.map((t) => (mode === 'mono' ? PR.mono(t.hex) : t.hex).toLowerCase()));

function normColour(v) {
  const s = String(v).trim().toLowerCase();
  if (KEYWORDS.has(s) || /^url\(#/.test(s)) return { skip: true };
  if (NAMED[s]) return { hex: NAMED[s] };
  let m = /^#([0-9a-f]{3})$/.exec(s); if (m) return { hex: '#' + m[1].split('').map((c) => c + c).join('') };
  m = /^#([0-9a-f]{6})$/.exec(s); if (m) return { hex: s };
  m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(s);
  if (m) { const a = m[4] === undefined ? 1 : Number(m[4]); return { hex: '#' + [m[1], m[2], m[3]].map((x) => Number(x).toString(16).padStart(2, '0')).join(''), alpha: a, raw: s }; }
  return { bad: s };
}

/* every colour and every opacity an SVG declares, attribute or style property, wherever it sits */
function colours(svg) {
  const out = [];
  const ATTR = /\b(fill|stroke|stop-color|flood-color|color)\s*=\s*"([^"]*)"/g;
  const STYLE = /style\s*=\s*"([^"]*)"/g;
  const CSSBLOCK = /<style[^>]*>([\s\S]*?)<\/style>/g;
  let m;
  while ((m = ATTR.exec(svg))) out.push({ prop: m[1], value: m[2] });
  const decls = (text) => { for (const d of text.split(';')) { const kv = /^\s*(fill|stroke|stop-color|flood-color|color)\s*:\s*(.+?)\s*$/i.exec(d); if (kv) out.push({ prop: kv[1], value: kv[2] }); } };
  while ((m = STYLE.exec(svg))) decls(m[1]);
  while ((m = CSSBLOCK.exec(svg))) for (const body of m[1].split(/[{}]/)) decls(body);
  return out;
}
function opacities(svg) {
  const out = [];
  const RX = /\b(opacity|fill-opacity|stroke-opacity|stop-opacity)\s*[=:]\s*"?([0-9.]+)"?/g;
  let m;
  while ((m = RX.exec(svg))) out.push({ prop: m[1], value: Number(m[2]) });
  return out;
}
function dashes(svg) {
  const seen = [];
  for (const re of RE) {
    re.lastIndex = 0; let m;
    while ((m = re.exec(svg))) { const p = norm(m[1]); if (!p || p === 'none') continue; seen.push(p); }
  }
  return seen;
}

/* the gate: returns { ok, violations[], dashes{}, colours{} } */
function check(svg, { mode = 'colour', file = 'svg' } = {}) {
  const allowed = registerSet(mode), v = [];
  const dashCount = {}, colourCount = {};
  for (const p of dashes(svg)) {
    dashCount[p] = (dashCount[p] || 0) + 1;
    if (!PERMITTED.has(p)) v.push(file + ': dash "' + p + '" is not in design/grammar.js PERMITTED');
  }
  for (const c of colours(svg)) {
    const n = normColour(c.value);
    if (n.skip) continue;
    if (n.bad) { v.push(file + ': ' + c.prop + ' "' + c.value + '" is not a colour the register can name'); continue; }
    colourCount[n.hex] = (colourCount[n.hex] || 0) + 1;
    if (!allowed.has(n.hex)) v.push(file + ': ' + c.prop + ' ' + n.hex + ' is not in the print register' + (mode === 'mono' ? ' (greyscale)' : ''));
    if (n.alpha !== undefined && n.alpha < 1) v.push(file + ': ' + c.prop + ' ' + n.raw + ' is translucent');
  }
  for (const o of opacities(svg)) if (o.value < 1) v.push(file + ': ' + o.prop + ' ' + o.value + ' makes a register colour into one nobody validated');
  if (/<image\b/.test(svg)) v.push(file + ': a raster <image>, whose colours cannot be read');
  return { ok: v.length === 0, violations: v, dashes: dashCount, colours: colourCount };
}

function selftest() {
  const ink = PR.hex('--ink'), paper = PR.hex('--paper');
  const clean = '<svg><rect fill="' + paper + '"/><path style="fill: none; stroke: ' + ink + '; stroke-dasharray: 5,4"/><line stroke="' + PR.hex('--ink-2') + '" stroke-dasharray="1 5" stroke-linecap="round"/></svg>';
  const cases = [
    { id: 'S0', want: true, what: 'a clean figure (register colours, permitted dashes) passes', svg: clean },
    { id: 'S1', want: false, what: 'a planted forbidden dash ("6,4", the identity dash frontier recorded) is refused', svg: clean.replace('5,4', '6,4') },
    { id: 'S2', want: false, what: 'a planted width-derived dash ("7.68 5.28") is refused', svg: clean.replace('5,4', '7.68 5.28') },
    { id: 'S3', want: false, what: 'a planted off-register colour (#1f77b4, matplotlib\'s default blue) is refused', svg: clean.replace(ink, '#1f77b4') },
    { id: 'S4', want: false, what: 'a planted rgb() off the register is refused', svg: clean.replace('fill="' + paper + '"', 'fill="rgb(255,127,14)"') },
    { id: 'S5', want: false, what: 'a register colour at 40% opacity is refused', svg: clean.replace('<rect ', '<rect fill-opacity="0.4" ') },
    { id: 'S6', want: false, what: 'a raster <image> is refused', svg: clean.replace('</svg>', '<image href="x.png"/></svg>') },
    { id: 'S7', want: false, what: 'a named colour outside the register ("orange") is refused', svg: clean.replace('fill="' + paper + '"', 'fill="orange"') },
    { id: 'S8', want: false, what: 'the colour sheet\'s blue on the greyscale sheet is refused', svg: clean.replace(ink, PR.hex('--id-2')), mode: 'mono' },
    { id: 'S9', want: true, what: 'the greyscale value of the blue passes on the greyscale sheet', svg: clean.replace(ink, PR.mono(PR.hex('--id-2'))), mode: 'mono' },
  ];
  let ok = 0;
  for (const c of cases) {
    const r = check(c.svg, { mode: c.mode || 'colour', file: c.id });
    const good = r.ok === c.want; if (good) ok++;
    console.log('       ' + (good ? 'RED ok  ' : 'RED FAIL  ') + c.id + ' ' + c.what + (good ? '' : '   [' + (r.violations.join('; ') || 'passed') + ']'));
  }
  console.log('    check-svg self-test: ' + ok + '/' + cases.length);
  return ok === cases.length;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args[0] === '--selftest') process.exit(selftest() ? 0 : 1);
  const mode = args.includes('--mono') ? 'mono' : 'colour';
  const files = args.filter((a) => !a.startsWith('--'));
  if (!files.length) { console.log('usage: node design/print/check-svg.js [--mono] file.svg ...'); process.exit(2); }
  let bad = 0;
  for (const fpath of files) {
    const r = check(fs.readFileSync(fpath, 'utf8'), { mode, file: path.basename(fpath) });
    const ds = Object.entries(r.dashes).map(([p, n]) => '"' + p + '"×' + n).join(' ') || 'none';
    const cs = Object.keys(r.colours).sort().join(' ');
    if (r.ok) console.log('PASS  ' + path.basename(fpath) + ' (' + mode + ')   [dashes ' + ds + ' · colours ' + cs + ']');
    else { bad++; console.log('FAIL  ' + path.basename(fpath) + ' (' + mode + ')'); for (const x of r.violations.slice(0, 12)) console.log('        ' + x); if (r.violations.length > 12) console.log('        …+' + (r.violations.length - 12)); }
  }
  process.exit(bad ? 1 : 0);
}

module.exports = { check, colours, dashes, opacities, selftest };
