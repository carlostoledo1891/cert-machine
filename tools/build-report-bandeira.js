#!/usr/bin/env node
/* build-report-bandeira.js — reports/bandeira.html: the Qiushi Engine's disproof of Bandeira's Open Problem 0.2(a), audited.
   Every number comes from certs/bandeira-ledger.json (tools/run-bandeira-ledger.py), re-derived here before a word is
   written, from the battery's own count, and from corpus/bandeira/sdp-screen.json (a float screen, shown as such).

   usage: node tools/build-report-bandeira.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('BANDEIRA REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const py = (args) => cp.execFileSync('python3', ['-I'].concat(args), { cwd: ROOT, encoding: 'utf8' });

try { py(['tools/run-bandeira-ledger.py']); } catch (e) { die('the ledger does not re-derive: ' + (e.stdout || e.message)); }
let bat = ''; try { bat = py(['instruments/bandeira/battery.py']); } catch (e) { die('the battery did not pass: ' + (e.stdout || e.message)); }
const bm = /bandeira battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(bat);
if (!bm || bm[2] !== bm[3]) die('the battery did not pass whole');
const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'bandeira-ledger.json'), 'utf8'));
const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'bandeira', 'sdp-screen.json'), 'utf8'));
const row = (id) => { const r = L.rows.find((x) => x.id === id); if (!r) die('no row ' + id); return r; };
const core = row('bandeira-02a-sos-infeasible-120'), theirs = row('bandeira-02a-claimant-certificate'), equiv = row('bandeira-02a-equivalence'), leanR = row('bandeira-02a-lean-reading'), head = row('bandeira-02a-headline');
if (core.verdict !== 'CERTIFIED' || theirs.verdict !== 'CERTIFIED' || head.verdict !== 'CERTIFIED' || leanR.verdict !== 'CERTIFIED' || !/no definition of Lai--Lim's SDP/.test(leanR.finding)) die('a row is not what the page describes — rewrite the page');
const ours = L.decisions.ours.leftT, cl = L.decisions.claimant;
if (ours.verdict !== 'CERTIFIED' || cl.none.verdict !== 'CERTIFIED' || cl.leftT.verdict === 'CERTIFIED' || cl.rightT.verdict === 'CERTIFIED') die('the convention finding moved — rewrite the page');
const sec = L.secondImplementation && L.secondImplementation.checks;
if (!sec || !Object.values(sec).every((c) => c.agree)) die('the JavaScript second implementation does not agree');
const fmt = (x) => Number(x).toLocaleString('en-US');
const lam = S.case55.reduce((o, r) => (o[r.convention] = r.lambda2, o), {});
const tag = (v) => C.tag(v, v === 'CERTIFIED' ? 'held' : v === 'REFUTED' ? 'fail' : 'dep');
const commit8 = L.repositoryCommit.slice(0, 8);

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · audit · a disproof of an open problem',
  title: 'Bandeira\'s Open Problem 0.2(a): the disproof, decided',
  deck: 'A university group\'s autonomous research system published a disproof of Bandeira\'s matrix AM–GM problem at n = 5: a reduction to Lai–Lim\'s '
    + 'refutation of the Recht–Ré conjecture, an exact rational Farkas certificate for the semidefinite program behind it, and a Lean 4 formalization. '
    + 'Two gaps, both at the boundary the paper itself declares external: the claimant\'s certificate decides a different semidefinite program — the one its code wrote, '
    + 'without the polynomial transposes that make the Gram form a sum of squares — and the Lean development checks the certificate\'s arithmetic, not the program\'s infeasibility: '
    + 'no SDP is defined in Lean, and its impossibility theorems assume as fields what the certificate must deliver. '
    + 'The finite core is re-decided here with a certificate of our own, found in seconds and decided in exact rationals, so the conclusion stands.'
}));
B.push(C.scope('The claim: github.com/Oxelra-AI/Bandeira-0.2a-open-source at commit ' + commit8 + ' (MIT; 2026-06), its paper, its certificate (an npz of pickled '
  + 'object arrays, read inertly by opcode and never unpickled) and its Lean sources, all pinned by sha256 in corpus/bandeira/PINS.json. What is decided is '
  + 'the semidefinite program\'s infeasibility, from the SDP\'s definition in Lai–Lim (ICML 2020) as read here, with no code of the claimant\'s run; the '
  + 'Positivstellensatz step is a published theorem, cited. Pre-registered before any verdict (corpus/bandeira/preregistration.json). Nothing has been sent to the claimant.'));
B.push(C.tldr({
  findingRaw: '<b>Gap 1 — the claimant\'s certificate certifies a different SDP.</b> Its code reproduces Lai–Lim\'s "β X_i βᵀ" literally, with no transpose of the basis monomials; '
    + 'under that convention its certificate holds, pivot for pivot as published, and under the sum-of-squares form fᵀ X_i f it does not. In floating point the two programs have the '
    + 'same optimum on every case of Lai–Lim\'s Table 1 and at (5,5) — ' + lam.none.toFixed(4) + ' against ' + lam.leftT.toFixed(4) + ' — and whether they are equivalent in general is not decided here. '
    + '<b>Gap 2 — the Lean checks arithmetic, not infeasibility.</b> The development proves (−M) ⪰ 0 for the claimant\'s matrices and an abstract contradiction over a structure whose '
    + 'fields assume the standard-form pairing and the cone inequality; no SDP is defined in Lean and the proved (−M) ⪰ 0 is never supplied to the contradiction — its own docstrings '
    + 'say the adapter remains to be filled "rather than by assumptions". The paper\'s boundary section says as much of C_i and b; its abstract says "the entire certificate". '
    + '<b>The disproof holds.</b> Lai–Lim\'s sum-of-squares SDP at m = n = 5 is infeasible at λ = 120 by a Farkas certificate of our own '
    + '(y₀ = −1, denominators ≤ ' + fmt(ours.maxDenominator) + ', margin m₀₀ = ' + C.esc(ours.m00) + ', scalar ' + C.esc(ours.scalar) + '), so λ₂ > 120 = 5! and Bandeira\'s inequality (a) fails for n = 5 — '
    + 'with the noncommutative Positivstellensatz cited, as the claimant\'s paper also cites it. Nothing here rests on the claimant\'s certificate or its Lean.',
  mechanismRaw: 'The 3,906 monomial constraints of the SDP built from the definition in exact rationals (the one convention taken from the claimant, the order of the monomials, '
    + 'is tested by the scalar value); the dual slack\'s six 31 × 31 blocks decided positive definite by an exact LDLᵀ; the scalar inequality decided; a second implementation in '
    + 'JavaScript BigInt agreeing on every pivot. Our certificate was proposed by a float search (cvxpy, CLARABEL) that maximises the blocks\' margin, then rounded and decided; '
    + 'the solver is never in the trust path.',
  checkRaw: C.m('python3 -I tools/run-bandeira-ledger.py') + ' · ' + C.m('python3 -I instruments/bandeira/battery.py') + ' — ' + bm[1] + ' checks, ' + bm[3] + ' red controls.'
}));
B.push(C.stats([
  { k: 'constraints', v: fmt(ours.monomials), n: 'One per noncommutative monomial of degree ≤ 5 in five variables; ' + fmt(ours.basis) + ' basis monomials; six 31 × 31 blocks and one scalar.' },
  { k: 'λ₂ at (5,5), float', v: lam.leftT.toFixed(4), n: 'Lai–Lim print ' + S.laiLim55 + '. The bound the conjecture needs is 120. A screen, not a verdict.' },
  { k: 'our certificate', v: 'exact', n: 'Denominators ≤ ' + fmt(ours.maxDenominator) + '; every pivot positive; found in seconds, decided in seconds, twice.' },
  { k: 'the claimant\'s', v: 'other SDP', n: 'Holds without the transposes; fails the sum-of-squares form under either transpose.' }
]));
B.push(C.section({
  lab: '§1 · the chain', title: 'Four claims, one verdict each', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'verdict' }, { h: 'claim' }, { h: 'how, and what is not decided' }],
    rows: [core, theirs, equiv, leanR, head].map((r) => [{ raw: tag(r.verdict) }, { raw: C.esc(r.claim) }, { raw: C.esc((r.scope ? r.scope + ' ' : '') + r.how) }])
  })
}));
B.push(C.section({
  lab: '§2 · the transpose', title: 'Which semidefinite program a certificate belongs to',
  bodyRaw: [
    C.pRaw('Lai–Lim write the sum-of-squares side as tr(β X_i βᵀ Y_i) with β the column of basis monomials. A noncommutative square is fᵀ X_i f with f = Σ u_a β_a, '
      + 'and fᵀ X_i f = Σ u_a u_b β_aᵀ X_i β_b: the Gram form needs the first basis monomial reversed (X₁X₂ ↦ X₂X₁), which the notation βᵀ carries silently. '
      + 'The claimant\'s builder (corpus/bandeira/sources/lailim_sdp.py.txt, read as text) forms β_a X_i β_b with no reversal. That is a different linear map from Gram '
      + 'matrices to polynomials, so its Farkas certificate is a certificate of a different program.'),
    C.table({
      cols: [{ h: 'certificate' }, { h: 'fᵀ X f, left transpose' }, { h: 'right transpose' }, { h: 'no transpose' }],
      rows: [
        [{ raw: 'the claimant\'s (y₀ = ' + C.esc(cl.none.y0) + ')' }, { raw: tag(cl.leftT.verdict) }, { raw: tag(cl.rightT.verdict) }, { raw: tag(cl.none.verdict) }],
        [{ raw: 'ours (y₀ = ' + C.esc(ours.y0) + ')' }, { raw: tag(L.decisions.ours.leftT.verdict) }, { raw: tag(L.decisions.ours.rightT.verdict) }, { raw: tag(L.decisions.ours.none.verdict) }]
      ]
    }),
    C.pRaw('Under its own convention the claimant\'s certificate holds exactly as published: m₀₀ = ' + C.esc(cl.none.m00) + ', scalar ' + C.esc(cl.none.scalar) + ', and the smallest LDLᵀ pivot of '
      + 'each block equal to the one its verification summary prints. The same multipliers under the sum-of-squares form lose positive definiteness in every block. '
      + 'The claimant\'s paper calls the identification of its matrices with Lai–Lim\'s SDP the one component outside its Lean proof; this is what sits there. '
      + 'The optimum of the two programs coincides in floating point on every case tried (§3), so the finding is about what the published certificate decides, not about the theorem.')
  ].join('\n')
}));
B.push(C.section({
  lab: '§3 · the screen', title: 'Lai–Lim\'s Table 1, re-solved under each convention', wide: true,
  bodyRaw: C.table({
    cols: [{ h: '(m, n)' }, { h: 'λ₁ / λ₂, left transpose' }, { h: 'right transpose' }, { h: 'no transpose' }, { h: 'Lai–Lim' }, { h: 'n!/(n−m)!' }],
    rows: S.table1.map((r) => [{ raw: '(' + r.m + ', ' + r.n + ')' }, { raw: r.lambda1.leftT.toFixed(4) + ' / ' + r.lambda2.leftT.toFixed(4) }, { raw: r.lambda1.rightT.toFixed(4) + ' / ' + r.lambda2.rightT.toFixed(4) },
      { raw: r.lambda1.none.toFixed(4) + ' / ' + r.lambda2.none.toFixed(4) }, { raw: r.laiLim[0].toFixed(4) + ' / ' + r.laiLim[1].toFixed(4) }, { raw: String(r.bound) }])
      .concat([[{ raw: '(5, 5)' }, { raw: '— / ' + lam.leftT.toFixed(4) }, { raw: '—' }, { raw: '— / ' + lam.none.toFixed(4) }, { raw: '— / ' + S.laiLim55 }, { raw: '120' }]])
  }) + C.pRaw('Floating point (cvxpy, SCS at 10⁻⁸), shown as a measurement: for m ≤ 3 the conjecture is a theorem, so λ₁, λ₂ ≤ n!/(n−m)! must hold, and does, under every convention. '
    + 'The verdict rests on the exact certificates of §1 and §2, never on these numbers.')
}));
B.push(C.section({
  lab: '§4 · the Lean', title: 'What the formalization proves, read at the pins',
  bodyRaw: [
    C.pRaw('What the files state, and the paper lists: the equivalence 0.2(a) ⇔ (RR)ₙ,ₙ over an abstract ordered type (Core/BandeiraAMGM.lean), the spectral-norm power identity '
      + '(Core/SpectralNormPSD.lean), the abstract scalar Farkas contradiction (Farkas/AbstractFarkas.lean), 5,766 standard-form entry equalities Q = −M by norm_num '
      + '(Certificate/FarkasStandard/FarkasStandardFull.lean), six 31 × 31 blocks Q_b = L D Lᵀ row by row with positive pivots, hence PosSemidef (Certificate/Blocks/B*/), and '
      + 'the 187 × 187 block-diagonal −M PosSemidef (Farkas/AllBlocksFarkasChain.lean: negM_full_posSemidef). All of it for the claimant\'s matrices — the SDP of §2 without the transposes.'),
    C.pRaw('What they do not state: a definition of Lai–Lim\'s SDP, or a theorem that any SDP is infeasible. The two impossibility theorems — '
      + C.m('no_lailim_feasible_from_certificate_semantics') + ' (Farkas/SDPFarkasSemantics.lean) and ' + C.m('no_native_farkas_feasible') + ' (Bridges/NativeFarkasAdapter.lean) — '
      + 'are IsEmpty of structures whose fields assume the standard-form pairing pairM = y₀c₀ + lin, the cone inequality or (−M) ⪰ 0, the bound c₀ ≤ 120 and the scalar inequality; '
      + 'negM_full_posSemidef is never supplied to either, nothing imports AllBlocksFarkasChain, and GeneratedFarkasTheoremShape takes three arbitrary Props as hypotheses. '
      + 'The docstrings say it: "the remaining work is to fill GeneratedCertificateAdapter from the actual generated theorem families rather than by assumptions." '
      + 'So Lean checks the certificate\'s arithmetic — which §2 also checks here, exactly, in two implementations — and the identification with Lai–Lim\'s program, the step §2 finds '
      + 'wanting, is outside Lean, as the paper\'s boundary section says of C_i and b. Its abstract says "the entire certificate" and its overview names "an SDP infeasibility semantic bridge".'),
    C.pRaw('Smaller, at the pin: Tests/UnformalizedDependencies.lean still lists the spectral-norm power identity as unformalized while Core/SpectralNormPSD.lean proves it, and calls the '
      + 'integer bound 144 > 120 "floating-point and NOT a rigorous bound" — that bound is proved by native_decide and is not load-bearing. native_decide (trust in the compiled evaluator, '
      + 'axiom Lean.ofReduceBool) appears on the default target in the NativePSD probes, a test file and that bound; on no theorem of the −M chain.'),
    C.pRaw(L.lean.status === 'PENDING' ? '<b>Build:</b> the default Lake target (' + fmt(439) + ' sources, Lean v4.29.1, Mathlib at the manifest\'s pin) is being built here; the slow tail is the '
      + 'NativePSD probes evaluating 31 × 31 rational LDL factors with native_decide. When it finishes, the axioms of the four theorems above are asked of the kernel and recorded in '
      + 'corpus/bandeira/lean-build.json; this paragraph then says what came back. Nothing on this page rests on the build.'
      : '<b>Build:</b> ' + C.esc(L.lean.summary || JSON.stringify(L.lean)))
  ].join('\n')
}));
B.push(C.section({
  lab: '§5 · limits', title: 'What is not decided here',
  bodyRaw: C.plainList([
    { b: 'The Positivstellensatz.', text: 'That infeasibility of the sum-of-squares SDP yields a PSD tuple violating the inequality is Helton–Klep–McCullough\'s theorem for bounded linear matrix-inequality domains, as Lai–Lim state it; cited, not re-derived, here as in the claimant\'s paper.' },
    { b: 'The equivalence of the two programs.', text: 'The program the claimant certified and the sum-of-squares program have the same optimum on every case solved; whether their feasible sets coincide in general is not decided. It does not affect the conclusion, which rests on our certificate for the sum-of-squares program.' },
    { b: 'Same-author second implementation.', text: 'verify.py and verify.js were written by the same author from the same definition; they catch a slip in one arithmetic, not a shared misreading of Lai–Lim. The claimant\'s published pivots, reproduced exactly under its convention, are the outside check on the construction.' },
    { b: 'The Lean, when built.', text: 'Compilation and the kernel\'s axiom list say whether the statements read in §4 are proved as written; they cannot add a theorem the sources do not state.' },
    { b: 'Explicit witnesses.', text: 'No five PSD matrices violating the inequality are exhibited, by the claimant or here; Lai–Lim note that none is known.' }
  ])
}));
const foot = '<p>' + C.esc('Generated by tools/build-report-bandeira.js from certs/bandeira-ledger.json (' + L.generated + '), re-derived at build; battery ' + bm[1] + ' checks, ' + bm[3] + ' red controls; @ git ' + git + '.') + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'bandeira.html'), TPL.render({
  title: 'Bandeira\'s Open Problem 0.2(a): the disproof, decided · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'The Qiushi Engine\'s disproof of Bandeira\'s matrix AM–GM problem at n = 5, audited: Lai–Lim\'s sum-of-squares SDP infeasible at λ = 120 by our own exact certificate; the claimant\'s certificate decides the program written without the transposes.',
  path: '/reports/bandeira.html'
}));
console.log('reports/bandeira.html written: ' + L.rows.length + ' rows, ' + L.rows.filter((r) => r.verdict === 'CERTIFIED').length + ' certified @ git ' + git);
