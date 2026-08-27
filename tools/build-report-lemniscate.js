#!/usr/bin/env node
/* build-report-lemniscate.js — generate reports/verify-lemniscate.html: the
   engine rebuild of the cited Erdős #1038 verification page.

   Nothing on the page is remembered: the cited page's own verifier
   (legacy/.../laneb-lemniscate/verify.js, byte-identical) is RE-RUN during
   this build against THIS repository's interval toolkit (staged at the
   core/interval path it searches for — a cross-implementation replication:
   their program, our arithmetic, and the verdict must agree), and the build
   dies unless every check passes, every mutation control is rejected, and
   the verdict line reads CONFIRMED.

   usage: node tools/build-report-lemniscate.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('LEMNISCATE REPORT REFUSED: ' + m); process.exit(1); };
const gitrev = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- re-run the cited verifier against OUR interval toolkit --------------- */
const SCR = fs.mkdtempSync(path.join(os.tmpdir(), 'lemniscate-build-'));
fs.copyFileSync(path.join(ROOT, 'legacy', 'research', 'challenges', 'lane', 'laneb-lemniscate', 'verify.js'),
  path.join(SCR, 'verify.js'));
fs.mkdirSync(path.join(SCR, 'core'));
fs.cpSync(path.join(ROOT, 'instruments', 'interval'), path.join(SCR, 'core', 'interval'), { recursive: true });
let out;
try { out = cp.execSync('node verify.js', { cwd: SCR, stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }
catch (e) { die('verify.js failed:\n' + (e.stdout || e.message)); }
fs.rmSync(SCR, { recursive: true, force: true });

const m = /checks:\s*(\d+) passed,\s*(\d+) failed;\s*(\d+) mutation controls rejected/.exec(out);
if (!m) die('could not parse the verifier summary');
const [passed, failed, mutations] = [Number(m[1]), Number(m[2]), Number(m[3])];
if (failed !== 0 || passed < 26 || mutations < 4) die('verifier summary moved: ' + m[0]);
if (!/VERDICT: CONFIRMED/.test(out)) die('verdict is not CONFIRMED');
if (!/all 30 claimed decimals of D/.test(out)) die('the 30-decimal claim is no longer in the verdict');

const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · the verifier re-runs during every build',
  title: 'Erdős #1038: thirty decimals, and the last one is a rounding',
  deck: 'The July 2026 Darvas–Peng–Tao manuscript solving Erdős–Herzog–Piranian (1958) defines its extremal '
    + 'constant D from the unique zero of a 3-dimensional nonlinear system. This page re-verifies the '
    + 'computational fragment in independent arithmetic — existence AND local uniqueness of the zero by the '
    + 'interval Krawczyk operator, a refinement to width < 10⁻⁴⁰, and a digit-for-digit audit of every decimal '
    + 'expansion the manuscript prints. All of it re-ran during this build: ' + passed + ' checks green, '
    + mutations + ' mutation controls rejected, verdict CONFIRMED.'
}));

O.push(C.tldr({
  findingRaw: 'All 30 printed decimals of the Darvas–Peng–Tao extremal constant verified by an independent '
    + 'route — the 30th digit is a rounding, and it is read correctly.',
  mechanismRaw: 'Existence AND local uniqueness of the defining zero by the interval Krawczyk operator — not '
    + 'bisection, the manuscript\'s route — refined to width below 10⁻⁴⁰, then every printed expansion audited '
    + 'digit by digit.',
  checkRaw: 'the page\'s own verifier re-ran during this build: ' + passed + ' checks green, ' + mutations
    + ' mutation controls rejected — and it is filed on the claiming authors\' repository.'
}));

O.push(C.stats([
  { k: 'checks, this build', v: passed + ' / ' + (passed + failed), role: 'held', n: 'the cited page\'s own verifier, re-run at build time; the build refuses on any failure' },
  { k: 'mutation controls', v: mutations + ' rejected', role: 'held', n: 'digit tamper, sign flip, box shift, constant perturbation — each must fail, and did' },
  { k: 'zero enclosure', v: '< 10⁻⁴⁰', n: 'Krawczyk existence + uniqueness, then fixed-point BigInt interval refinement' },
  { k: 'claimed decimals', v: 'ALL CORRECT', role: 'held', n: 'D to 30 decimals, α, and the full p.24 constant block — digit for digit' },
  { k: 'the 30th decimal', v: 'a ROUNDING', role: 'warn', n: 'the expansion continues …6351247…, so the printed …635125 is a correct half-up rounding, not an expansion prefix' },
  { k: 'replication', v: 'CROSS-TREE', n: 'their verifier, this repository\'s interval instruments — staged at build, same verdict' }
]));

O.push(C.section({
  lab: '§1 · the two findings', title: 'What the digit machinery decided',
  bodyRaw: '<div class="col">'
    + C.pRaw('1 — Every constant the manuscript prints checks out. The p.24 block — q*, u*, v*, p*, α, r*, z*, '
      + 'and D to 18–19 decimals — matches the certified enclosures as exact truncations. The extremal value '
      + 'is real, unique in its box, and printed correctly.')
    + C.pRaw('2 — The headline D on p.2, printed to 30 decimals ending “…635125…”, is not an expansion prefix: '
      + 'the true expansion continues …635124<b>7</b>861…, so the 30th decimal of the expansion is 4, not 5. '
      + 'The printed value is a correct half-up ROUNDING, accurate to under 5·10⁻³¹ — but a trailing ellipsis '
      + 'conventionally promises an expansion. Not an error in the mathematics; a presentation defect only '
      + 'certified digit arithmetic can even see. (The same half-ulp class appears in the '
      + '<a href="erdos852.html">Erdős #852 audit</a> — it is the benign end of the failure taxonomy named there.)')
    + '</div>'
}));

O.push(C.section({
  lab: '§2 · the method', title: 'Their definition, our arithmetic, nothing of theirs executed',
  bodyRaw: '<div class="col">'
    + C.pRaw('The verifier re-derives everything from the manuscript\'s Appendix A definitions alone: consistency '
      + 'of the displayed derivatives with automatic differentiation; the certified face inequalities on the '
      + 'box B*; existence and LOCAL UNIQUENESS of the zero by the interval Krawczyk operator (a genuinely '
      + 'different route than the manuscript\'s scalar intermediate-value argument — Lemma A.1 confirmed both '
      + 'ways); containment of B* in the uniqueness box, so the manuscript\'s triple and ours are the SAME zero; '
      + 'and a BigInt fixed-point refinement to width < 10⁻⁴⁰ with directed rounding and explicit series tails. '
      + 'The authors\' python-flint/Arb scripts were read for scope only — no line of theirs runs here, and no '
      + 'numeric value of theirs enters except the CLAIMED decimals under audit.')
    + C.pRaw('New in this rebuild: the verifier now runs against THIS repository\'s interval instruments '
      + '(instruments/interval/, the lifted eqcert toolkit) staged at the core/interval path it searches for — '
      + 'a second implementation substrate reaching the identical verdict, re-established on every build.')
    + '</div>'
}));

O.push(C.section({
  lab: '§3 · scope', title: 'What was NOT audited, stated so it cannot be assumed',
  bodyRaw: '<div class="col">'
    + C.pRaw('That D is the INFIMUM — the entire proof of the paper\'s Theorem 1.1 (normal form, forcing lemma, '
      + 'dual measure construction, endpoint certificate, sharpness) — was not audited: this page verifies the '
      + 'DEFINITION of D and its claimed digits, not its extremality. Also unchecked: the manuscript\'s other '
      + 'Arb and SymPy certificates (read for scope only), the authors\' own κ sign-change proof of Lemma A.1 '
      + '(the Krawczyk route replaces it; the lemma itself is confirmed), and the AI-use chronology. '
      + 'A verification note that does not draw this line invites the reader to assume more than was checked.')
    + '</div>'
}));

O.push(C.section({
  lab: '§4 · provenance', title: 'The cited page, byte-preserved',
  bodyRaw: '<div class="col">'
    + C.pRaw('This page supersedes the one cited in the Erdős #1038 GitHub issue (Pengbinghui/pipeline-math#5, '
      + '2026-08-05); that page is preserved byte-identically in '
      + '<a href="https://github.com/carlostoledo1891/cert-machine/blob/main/legacy/research/challenges/verify-lemniscate.html">the repository</a> '
      + '(the citation path 301s here), beside <a href="https://github.com/carlostoledo1891/cert-machine/blob/main/legacy/research/challenges/lane/laneb-lemniscate/verify.js">the verifier itself</a> '
      + '— hash-pinned through this repository\'s lift provenance. Re-run it from '
      + '<a href="https://github.com/carlostoledo1891/cert-machine">the repository</a>: '
      + '<span class="m">node tools/build-report-lemniscate.js</span> rebuilds this page and refuses unless '
      + 'the verifier is green.')
    + '</div>'
}));

const foot = '<footer class="col">'
  + '<p>' + C.esc('Generated by tools/build-report-lemniscate.js @ git ' + gitrev + ' — the cited verifier re-run against this repository\'s interval instruments during the build; ' + passed + ' checks, ' + mutations + ' mutation controls, verdict CONFIRMED, or no page.') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p>'
  + '</footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'verify-lemniscate.html'),
  TPL.render({ title: 'Erdős #1038: thirty decimals verified · cert-machine', bodyRaw: O.join('\n\n'), footRaw: foot }));
console.log('reports/verify-lemniscate.html written: ' + passed + ' checks, ' + mutations + ' mutations rejected, CONFIRMED @ git ' + gitrev);
