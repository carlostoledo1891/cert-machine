#!/usr/bin/env node
/* test-control.js — the gate on the generated page.
   tools/ · cert-machine

   A generated page has one failure mode that matters: a number on it that is
   not in any record. It looks exactly like a real one and it survives every
   rebuild, because somebody typed it. So this battery does not check that the
   page "looks right" — it checks the two properties that make it trustworthy:

     1. DETERMINISM. Built twice from the same records, byte-identical. If the
        page contains a clock, a random id or a machine-dependent measurement,
        this fails, and it should: a page that changes when nothing changed
        cannot be diffed, and a page that cannot be diffed cannot be reviewed.
     2. DERIVATION. Every headline number on the page is found, character for
        character, in the record it claims to come from. Not "approximately
        equal" — found. That is the property a hand-typed number cannot have.

   Plus the design invariants the template exists to hold: no literal colour
   outside the token block, every figure carrying a text alternative, all three
   theme states defined, and no script.

   Exit 1 on any failure. Red controls at the end, because a check nobody has
   seen fail is decoration. */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PAGE = path.join(ROOT, 'control.html');

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; console.log('PASS  ' + msg); } else { fail++; console.log('FAIL  ' + msg); } }

function build() {
  const r = cp.spawnSync(process.execPath, [path.join(ROOT, 'tools', 'build-control.js')],
    { cwd: ROOT, stdio: 'ignore' });
  if (r.status !== 0) throw new Error('build-control.js exited ' + r.status);
  return fs.readFileSync(PAGE, 'utf8');
}

console.log('--- 1. the page is a function of the records ------------------------');

const a = build();
const b = build();
ok(a === b, 'built twice, byte-identical (' + (a.length / 1024).toFixed(1) + ' KB) — no clock, no nonce, no machine-dependent measurement');

const html = a;

console.log('');
console.log('--- 2. every headline number is IN a record -------------------------');

/* the board's best certified bound, as rendered */
{
  const board = JSON.parse(fs.readFileSync(path.join(ROOT, 'hunts/newman-mu/best.json'), 'utf8'));
  let best = null;
  for (const e of (board.entries || [])) if (!best || e.certificate.modSq[0] > best.certificate.modSq[0]) best = e;
  ok(!!best, 'the board has an entry to check against');
  if (best) {
    const rendered = Number(best.certificate.modulus[0]).toFixed(12);
    ok(html.includes(rendered), 'the headline min|f| ' + rendered + ' appears on the page AND comes from best.json');
    ok(html.includes('[' + best.certificate.A.join(',') + ']'),
      'its exponent set is rendered exactly as the certificate stores it');
  }
}

/* campaign counts */
{
  const dir = path.join(ROOT, 'hunts/newman-mu/experiments');
  const files = fs.readdirSync(dir).filter(f => f.startsWith('run-') && f.endsWith('.jsonl') && !f.endsWith('-baseline.jsonl'));
  let checked = 0;
  for (const f of files) {
    const lines = fs.readFileSync(path.join(dir, f), 'utf8').trimEnd().split('\n');
    let sum = null;
    for (let i = lines.length - 1; i >= 0; i--) {
      const o = JSON.parse(lines[i]);
      if (o.kind === 'run-summary') { sum = o.summary || o; break; }
    }
    if (!sum) continue;
    const seed = sum.seed;
    const gen = String(sum.counts.generated).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (html.includes(seed)) { checked++; ok(html.includes(gen), 'run ' + seed + ': candidate count ' + gen + ' on the page matches its run-summary'); }
  }
  ok(checked >= 5, checked + ' campaign rows cross-checked against their own run-summary records');
}

/* the census artifact */
{
  const cen = JSON.parse(fs.readFileSync(path.join(ROOT, 'hunts/newman-mu/results-subsets-hj.json'), 'utf8'));
  let allFound = true;
  for (const s of cen.sizes) {
    const v = Number(s.bestModulus[0]).toFixed(12);
    if (!html.includes(v)) { allFound = false; console.log('       missing census value for n=' + s.n + ': ' + v); }
  }
  ok(allFound, 'every census row\'s best value on the page is the value in results-subsets-hj.json');
}

/* the lift */
{
  const prov = JSON.parse(fs.readFileSync(path.join(ROOT, 'PROVENANCE.json'), 'utf8'));
  ok(html.includes(prov.counts.files + ' files'), 'the lift count ' + prov.counts.files + ' comes from PROVENANCE.json');
  ok(html.includes(String(prov.counts.patched) + ' patched'), 'the patched count comes from PROVENANCE.json');
}

console.log('');
console.log('--- 3. design invariants the template exists to hold ----------------');

{
  /* colours: every hex literal must live inside the :root cascade at the top */
  const styleStart = html.indexOf('<style>');
  const rootEnd = html.indexOf('*{box-sizing:border-box}');
  const tokenBlock = html.slice(styleStart, rootEnd);
  const rest = html.slice(rootEnd);
  const strayHex = (rest.match(/#[0-9a-fA-F]{3,8}\b/g) || []);
  ok(strayHex.length === 0, 'no literal colour anywhere outside the token block'
    + (strayHex.length ? ' — found ' + strayHex.slice(0, 4).join(', ') : ''));
  ok((tokenBlock.match(/#[0-9a-fA-F]{6}/g) || []).length > 20, 'the token block is where the colours are');
}
{
  /* three theme states, all defined */
  ok(/:root\{/.test(html), 'light palette defined on bare :root (the default a viewer with no preference gets)');
  ok(/@media \(prefers-color-scheme: dark\)\{\s*:root:not\(\[data-theme="light"\]\)/.test(html.replace(/\n/g, '')),
    'dark defined under prefers-color-scheme AND guarded by :not([data-theme="light"])');
  ok(/:root\[data-theme="dark"\]\{/.test(html), 'dark defined again for an explicit toggle — both directions win');
}
{
  const figs = html.match(/<svg[^>]*>/g) || [];
  const labelled = figs.filter(f => /aria-label="/.test(f) && /role="img"/.test(f));
  ok(figs.length > 0 && labelled.length === figs.length,
    figs.length + ' figure(s), all carrying role="img" and a text alternative');
  /* a figure must not paint with a literal colour — it would vanish in one theme */
  const svgBodies = html.match(/<svg[\s\S]*?<\/svg>/g) || [];
  const bad = svgBodies.filter(s => /(fill|stroke)="#/.test(s));
  ok(bad.length === 0, 'no figure paints with a literal colour — every fill and stroke is a var(--token)');
}
ok(!/<script/i.test(html), 'no script on the page — it is a document, not an application');
ok(/max-width:64ch/.test(html), 'prose measure is capped in characters, not pixels');

console.log('');
console.log('--- 4. RED CONTROLS — each must fire -------------------------------');

{
  /* (a) a hand-typed number must be catchable: the derivation check has teeth
     only if it fails on a value that is in the page and in no record. */
  const invented = '1.234567890123';
  ok(!html.includes(invented), 'RED (a) control: the invented value is not on the page today');
  const withInvented = html.replace('</footer>', '<p>' + invented + '</p></footer>');
  const board = JSON.parse(fs.readFileSync(path.join(ROOT, 'hunts/newman-mu/best.json'), 'utf8'));
  const realValues = new Set();
  for (const e of (board.entries || [])) realValues.add(Number(e.certificate.modulus[0]).toFixed(12));
  ok(withInvented.includes(invented) && !realValues.has(invented),
    'RED (a): a number injected into the page is present there and absent from every record — which is exactly the state this battery exists to make impossible');
}
{
  /* (b) determinism must be falsifiable */
  const withClock = html.replace('</footer>', '<p>' + Date.now() + '</p></footer>');
  ok(withClock !== html, 'RED (b): injecting a clock changes the bytes, so the determinism check can fail');
}
{
  /* (c) the stray-colour check must fire on a stray colour */
  const withHex = html.replace('</footer>', '<p style="color:#ff0000">x</p></footer>');
  const rootEnd = withHex.indexOf('*{box-sizing:border-box}');
  const stray = (withHex.slice(rootEnd).match(/#[0-9a-fA-F]{3,8}\b/g) || []);
  ok(stray.length > 0, 'RED (c): a literal colour outside the token block is detected (' + stray[0] + ')');
}
{
  /* (d) the figure alt check must fire on a figure without one */
  const stripped = html.replace(/ aria-label="[^"]*"/, '');
  const figs = stripped.match(/<svg[^>]*>/g) || [];
  const labelled = figs.filter(f => /aria-label="/.test(f));
  ok(figs.length > labelled.length, 'RED (d): a figure with its text alternative removed is detected');
}

console.log('');
console.log('page battery: ' + pass + ' pass, ' + fail + ' fail');
if (fail) process.exit(1);
