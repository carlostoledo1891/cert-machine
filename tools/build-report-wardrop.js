#!/usr/bin/env node
/* build-report-wardrop.js — generate reports/wardrop-repro.html: the engine
   rebuild of the Wardrop reproduction page, in cert-machine's design system.

   The gate: the sent page embeds its stdlib-Python verifier as base64. This
   build extracts it from the byte-preserved page, runs it, and refuses to
   render unless it reports VERIFIED with the recorded scenario verdicts
   (S2 exact, S3 Krawczyk, S1 refused) and the certified erratum value.

   usage: node tools/build-report-wardrop.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const os = require('os');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('WARDROP REPORT REFUSED: ' + m); process.exit(1); };
const gitrev = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

const page = fs.readFileSync(path.join(ROOT, 'legacy', 'research', 'wardrop-repro', 'wardrop-repro.html'), 'utf8');
const m64 = /__VERIFY_WARDROP_B64\s*=\s*["']([A-Za-z0-9+/=\\n]+)["']/.exec(page);
if (!m64) die('embedded verifier blob not found in the published page');
const code = Buffer.from(m64[1].replace(/\\n/g, ''), 'base64').toString('utf8');
const sha = crypto.createHash('sha256').update(code).digest('hex');
const SCR = fs.mkdtempSync(path.join(os.tmpdir(), 'wardrop-build-'));
fs.writeFileSync(path.join(SCR, 'verify_wardrop.py'), code);
let out;
try { out = cp.execSync('python3 verify_wardrop.py', { cwd: SCR, stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }
catch (e) { die('embedded verifier failed:\n' + (e.stdout || e.message)); }
fs.rmSync(SCR, { recursive: true, force: true });

if (!/WARDROP REPRODUCTION: VERIFIED/.test(out)) die('verdict is not VERIFIED');
if (!/S1 verdict: total CERTIFIED \+ split REFUSED/.test(out)) die('S1 verdict moved');
if (!/S2 verdict: CERTIFIED EXACTLY/.test(out)) die('S2 verdict moved');
if (!/S3 verdict: CERTIFIED \(existence \+ local uniqueness/.test(out)) die('S3 verdict moved');
if (!/edge \(4,7\) total = 1940\/37/.test(out)) die('the erratum value moved');
const box = (/unique KKT zero in a box of max radius ([\d.e+-]+)/.exec(out) || [])[1];
if (!box) die('S3 box radius not found');

const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · the page re-proves itself at every build',
  title: 'A convergent flow finds the equilibrium. A certificate encloses it.',
  deck: 'A certified reproduction of the multi-population Wardrop equilibria in Bakaryan, Aoun, de Lima Ribeiro, '
    + 'Hovakimyan & Gomes (AIMS Mathematics 11(5), 2026, doi:10.3934/math.2026623). The paper validates each '
    + 'equilibrium by watching a globally convergent flow settle; this reproduction adds the complementary thing '
    + 'a stopping rule cannot give — a certificate that the answer is there, alone, and positive — and where the '
    + 'instance does not support one, it REFUSES instead of picking a solution. The verifier is embedded in the '
    + 'published page; it was extracted and re-run during this build.'
}));

O.push(C.stats([
  { k: 'S2 · affine costs', v: 'EXACT', role: 'held', n: 'the exact rational equilibrium, 38 unknowns; Wardrop gap EXACTLY 0 — not a small residual' },
  { k: 'S3 · nonlinear costs', v: 'KRAWCZYK', role: 'held', n: 'exactly one KKT zero in a box of radius ' + box + ' — existence AND local uniqueness' },
  { k: 'S1 · degenerate', v: 'REFUSED', role: 'warn', n: 'cost monotone but not strictly: the split has a 6-dimensional exact null space; only the totals are pinned, and the non-uniqueness is displayed' },
  { k: 'the erratum', v: '(4,7) = 52', role: 'warn', n: 'Table 1 prints 54; the exact total is 1940/37 = 52.432…, certified four independent ways — 3 of 15 printed totals differ by rounding' },
  { k: 'verifier', v: 'stdlib · ' + (code.length / 1024).toFixed(0) + ' KB', n: 'embedded in the published page; extracted and re-run at build; sha256 ' + sha.slice(0, 12) + '…' },
  { k: 'reflexive catch', v: '1 bug, OWN code', n: 'certifying against the paper\'s Figure 4 exposed a dropped 10⁻³ emission factor in the reproduction\'s own cost code — certificates catch the implementer\'s mistakes too' }
]));

O.push(C.section({
  lab: '§1 · what a certificate adds', title: 'Existence-by-algorithm is not enclosure',
  bodyRaw: '<div class="col">'
    + C.pRaw('A traffic equilibrium is the flow pattern in which no driver gains by switching routes. The paper '
      + 'computes each one with a globally convergent Hessian–Riemannian flow and validates it numerically — '
      + 'existence by algorithm plus a benchmark match. A stopping rule tells you WHERE the equilibrium is; it '
      + 'cannot tell you that what it converged to is the only solution nearby, or that the residual being small '
      + 'means the answer is right. The certificate is the complementary object: where the costs are affine, an '
      + 'EXACT rational equilibrium with the Wardrop gap identically zero; where they are smooth and nonlinear, '
      + 'a Krawczyk box holding exactly one solution; where the instance is degenerate, an honest refusal that '
      + 'exhibits the degeneracy instead of hiding it.')
    + '</div>'
}));

O.push(C.section({
  lab: '§2 · three scenarios, three outcomes', title: 'Exact, enclosed, refused — each for a proved reason',
  bodyRaw: '<div class="col">'
    + C.pRaw('S2 (cars + trucks, affine costs): the equilibrium is solved over exact rationals — 38 unknowns, '
      + 'support slacks identically zero, so the Wardrop gap is EXACTLY 0 and the paper\'s Figure 2 reproduces '
      + 'with no arithmetic left over. S3 (emission cost, smooth nonlinear): an interval Krawczyk contraction '
      + 'proves a unique KKT zero in an explicit box of radius ' + box + ' — the paper\'s convergent iterate is '
      + 'now the provably unique equilibrium of its neighbourhood. S1 (degenerate linear cost): the cost is '
      + 'monotone but NOT strictly, the paper\'s uniqueness theorem does not apply, and the reproduction proves '
      + 'why no split certificate can exist — the split-conservation operator has an exact null space of '
      + 'dimension six. The totals are certified; the split is refused; refusal is the correct verdict, not a '
      + 'failure to reach one.')
    + '</div>'
}));

O.push(C.section({
  lab: '§3 · the erratum', title: 'Three printed totals, one self-inconsistent row',
  bodyRaw: '<div class="col">'
    + C.pRaw('Binding the certified S1 equilibrium to the paper\'s Table 1: twelve of fifteen printed totals '
      + 'match exactly after integer rounding; two differ by one unit of rounding; and edge (4,7) differs by '
      + 'two — the exact total is 1940/37 = 52.432…, which rounds to 52 where the table prints 54. The value is '
      + 'certified four independent ways in the reproduction, and it is reported as what it is: a rounding typo '
      + 'in a table, an erratum for the authors\' benefit — not a defect in their method, whose scenarios all '
      + 'reproduce. This is the audit lane\'s contract: corrections carry certificates, and the correction and '
      + 'the confirmation come from the same arithmetic.')
    + '</div>'
}));

O.push(C.section({
  lab: '§4 · the reflexive catch', title: 'The certificate caught its own author first',
  bodyRaw: '<div class="col">'
    + C.pRaw('Reproducing the paper\'s Figure 4 forced this reproduction to find a bug in its OWN cost code — a '
      + 'dropped 10⁻³ emission factor and a congestion-flow slip. That is the strongest argument for certificates '
      + 'in reproduction work: they catch the implementer\'s mistakes, not only the author\'s. Under the corrected '
      + 'cost the certified equilibrium is invariant to the edge-length reading, so nothing hinges on measuring a '
      + 'figure. (This episode sits in the benign corner of the <a href="erdos852.html">failure taxonomy</a> this '
      + 'site maintains — caught before publication, by exactly the machinery built to catch it.)')
    + '</div>'
}));

O.push(C.section({
  lab: '§5 · check it', title: 'The proof travels inside the page',
  bodyRaw: '<div class="col">'
    + C.pRaw('The <a href="/research/wardrop-repro/wardrop-repro.html">published page</a> (byte-preserved, exactly '
      + 'as sent) embeds its complete verifier — plain Python, standard library only, MIT. This build extracted '
      + 'those bytes (<span class="m">sha256 ' + sha.slice(0, 16) + '…</span>), ran them, and required VERIFIED '
      + 'plus every scenario verdict and the erratum value above; any drift refuses the page. Do the same: '
      + 'download the verifier from the original page and run <span class="m">python3 verify_wardrop.py</span> — '
      + 'under a second, exact Fractions end to end.')
    + '</div>'
}));

const foot = '<footer class="col"><p>' + C.esc('Generated by tools/build-report-wardrop.js @ git ' + gitrev
  + ' — the embedded verifier extracted from the published bytes and re-run during this build (VERIFIED, or no page). '
  + 'The original page as sent is byte-preserved at /research/wardrop-repro/wardrop-repro.html.') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'wardrop-repro.html'),
  TPL.render({ title: 'Wardrop, certified: exact, enclosed, refused · cert-machine', bodyRaw: O.join('\n\n'), footRaw: foot }));
console.log('reports/wardrop-repro.html written: VERIFIED re-proved (S2 exact, S3 box ' + box + ', S1 refused, erratum 52) @ git ' + gitrev);
