/* sin_reference.js — headless reference run of the SHIPPED sin-mfg kernel,
   for the cross-language differential (mfglab test_crosslang_continuum.py).

   Pattern of python/tools/js_reference.js: extract the kernel from the
   artifact at run time (never a copy that can go stale), solve, print JSON
   with the artifact's PATH and sha256 so the battery records exactly which
   file the Python port was validated against. The Picard mechanics mirror the
   artifact's own driver (theta=0.5, tol 1e-10, cap 250; residual PRE-update),
   identical to test-sin.js Layer A.

   `artifact` and `sha256` are the provenance pair, and BOTH are needed. A sha
   alone says only that some file was hashed; it never says whose. The consumer
   (test_crosslang_continuum.py) re-hashes `artifact` itself and checks the
   result is in the shipped export set, so this reference cannot validate a file
   the project does not publish. Emit the path whenever you change this shape.
   SIN_HTML exists so the gate can be proved red against an unshipped copy; it
   is not a way to aim the differential elsewhere, since the consumer rejects
   any path outside the export set however it was set. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/* TWO TREES, TWO LAYOUTS — measured 2026-08-04. This resolved one path only,
   `__dirname/../sin-mfg.html`, which is right in the monorepo and CANNOT EXIST in
   the export: build-public.js performs what it calls "the ONE renaming move" and
   ships research/stock-constraint/stock-constraint.html as technical-reports/stock-constraint.html,
   while this file itself ships under research/stock-constraint/tools/. So the export's copy of the
   cross-language differential failed at setup — five errors, every one of them
   "artifact not found" — and the PUBLIC repo's CI badge was red for it while the
   monorepo stayed green, because in the monorepo the single path is correct.
   That asymmetry is the whole defect: a shipped consumer must resolve the artifact
   in the tree it is READ in, not the tree it was WRITTEN in.

   Ordered candidates, first hit wins — but SIN_HTML is AUTHORITATIVE, NEVER a
   candidate. Making it one is a defect this edit committed and its own control
   caught: with SIN_HTML pointed at a file that does not exist, a fallback list
   quietly resolves the built-in path instead and the run PASSES. That would take
   away the single mechanism this gate has for being proved red against an
   unshipped copy — the thing the paragraph above says SIN_HTML is FOR. When it is
   set it is the whole list, so a wrong value fails loudly, as it must. */
/* ONE CANDIDATE SINCE 2026-08-21. The list existed because the note had one address here and
   another in the export; the structure migration makes source path and published path the same
   string, so `research/stock-constraint/stock-constraint.html` is the answer in both trees. The
   env override stays — it is how a caller points this at a copy under test. */
const CANDIDATES = (process.env.SIN_HTML ? [process.env.SIN_HTML] : [
  path.resolve(__dirname, '..', 'stock-constraint.html'),
]).map(p => path.resolve(p));
const HTML = CANDIDATES.find(p => fs.existsSync(p));
if (!HTML) {
  /* A MISSING FILE, not a failed assertion — say so, instead of dying in an
     ENOENT stack that reads like a bug in fs. With no artifact there is nothing
     to run and nothing to certify: add a candidate above if it MOVED again, and
     retire this reference (and the Python differential that consumes it)
     deliberately if it was DELETED — never leave it to crash, never to pass.
     Print EVERY path tried: the one-path version printed the single path it
     wanted, which read as "the artifact is missing" when the truth was "this
     harness does not know where this tree keeps it". */
  console.error('sin_reference.js: artifact not found at any known location');
  for (const p of CANDIDATES) console.error('  tried: ' + p);
  console.error('  expected the shipped sin-mfg artifact; SIN_HTML=' +
    (process.env.SIN_HTML || '(unset)'));
  process.exit(2);
}
const html = fs.readFileSync(HTML, 'utf8');
const sha = crypto.createHash('sha256').update(html).digest('hex').slice(0, 16);

/* BLOCK SELECTION BY ANCHOR, NEVER BY A GREEDY SPAN — fixed 2026-08-03.
   This read `/<script>([\s\S]*)<\/script>/`: first `<script>` to LAST `</script>`. With one
   block that is the same thing as the right answer, which is why it survived for months. With
   TWO it silently spans them, so the extracted text carries `</script> … <script>` in its
   middle and `new Function` throws `SyntaxError: Unexpected token '<'` — a syntax error
   reported against the ARTIFACT for a defect in this HARNESS. That is precisely what happened:
   the theme-toggle rollout (8e86d1c) added two unrelated blocks and this reference stopped
   running, taking the Python cross-language differential down with it.

   It was masked in CI, which died earlier at check-route on the same root cause and never got
   here. Fixing check-route is what exposed it — one defect, two victims, and the second only
   became visible once the first was cleared.

   The kernel block is the one carrying MARK, so name it. The same narrowing, for the same
   reason, is used by the L2.0x assertion in another unit's artifact battery. (That unit was
   named here until 2026-08-03, when the export's private-token scan correctly refused the
   file: the unit is private and unexported, and a shipping comment must not name it. The
   REASONING is what mattered and it is kept; only the pointer is gone.) */
const MARK = '/* ---------------- canvases (dpr-crisp; logical coordinates) ---------------- */';
const blocks = (html.match(/<script>([\s\S]*?)<\/script>/g) || [])
  .map(b => b.slice('<script>'.length, -'</script>'.length));
if (!blocks.length) {
  console.error('sin_reference.js: no <script> block in ' + HTML +
    ' — this is not the sin-mfg artifact, or its shape changed.');
  process.exit(2);
}
const carriers = blocks.filter(b => b.indexOf(MARK) >= 0);
if (carriers.length !== 1) {
  console.error('sin_reference.js: expected exactly ONE script block carrying the kernel end ' +
    'marker in ' + HTML + ', found ' + carriers.length + ' (of ' + blocks.length + ' blocks).');
  console.error('  Zero means the artifact shape changed and extraction would take the whole ' +
    'script, DOM and all; more than one means extraction is ambiguous. Refusing either way — ' +
    'a reference that guesses which block is the kernel certifies nothing.');
  process.exit(2);
}
const FULL = carriers[0];
const KSRC = FULL.slice(0, FULL.indexOf(MARK));
const EXPORTS = ['NT', 'dt', 'NX', 'hx', 'xs', 'P', 'solveField', 'makeN', 'bisect',
  'clearSlice', 'dispatch', 'dpAudit', 'welfareOf', 'thomas'];
const K = new Function(KSRC + '\nreturn {' + EXPORTS.join(',') + '};')();

const { NT, NX, hx } = K;
const price = new Float64Array(NT).fill(0.8);
let field = null, disp = null, res = 1, it = 0;
for (let k = 0; k < 250; k++) {
  field = K.solveField(price);
  disp = K.dispatch(field.Ux);
  const pNew = disp.sl.map(s => s.p);
  res = 0;
  for (let t = 0; t < NT; t++) res = Math.max(res, Math.abs(pNew[t] - price[t]));
  it++;
  if (res < 1e-10) break;
  for (let t = 0; t < NT; t++) price[t] = 0.5 * price[t] + 0.5 * pNew[t];
}

let massDrift = 0, minM = Infinity;
for (let t = 0; t <= NT; t++) {
  let s = 0;
  for (let i = 0; i < NX; i++) { s += field.m[t][i] * hx; minM = Math.min(minM, field.m[t][i]); }
  massDrift = Math.max(massDrift, Math.abs(s - 1));
}
let clearWorst = 0;
for (let t = 0; t < NT; t++) {
  const s = disp.sl[t];
  clearWorst = Math.max(clearWorst, Math.abs(K.makeN(t, field.Ux[t])(s.p) - s.h + s.k - s.d));
}
const audit = K.dpAudit([...price], field);

console.log(JSON.stringify({
  artifact: HTML, sha256: sha,
  converged: res < 1e-10, iterations: it, residual: res,
  price: [...price], w: disp.w, spill: disp.spill, mix: disp.mix,
  massDrift, minM, clearWorst, eps: audit.eps,
  welfare: K.welfareOf([...price], field, disp),
}));
