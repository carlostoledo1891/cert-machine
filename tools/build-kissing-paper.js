#!/usr/bin/env node
/* build-kissing-paper.js — emit paper/tex/kissing-ledger.tex from
   certs/kissing-ledger.json, so no constant in the paper can drift from the
   record. Style: paper/tex/certmachine.sty (the bench preamble).

   usage: node tools/build-kissing-paper.js */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const die = (m) => { console.error('KISSING PAPER REFUSED: ' + m); process.exit(1); };
const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'kissing-ledger.json'), 'utf8'));
const row = (id) => { const r = L.rows.find((x) => x.id === id); if (!r) die('missing row ' + id); return r; };
const n = (x) => Number(x).toLocaleString('en-US');

const ae = row('alphaevolve-593'), ea = row('ea-594-winner');
const s1 = row('station-604-1'), s2 = row('station-604-2'), s3 = row('station-604-3');
const sh = row('station-shell-582'), lift = row('station-d12-lift');
const d4 = row('cal-d4-24'), e8 = row('cal-e8-240'), nd = row('ea-604');
if (new Set([s1.contacts, s2.contacts, s3.contacts]).size !== 3) die('the three 604 contact counts are not distinct — the non-congruence corollary would be false');
if (nd.verdict !== 'NEEDS DATA') die('the byteless claim is no longer NEEDS DATA');

const tex = `\\documentclass[11pt]{article}
\\usepackage{certmachine}

\\title{Independent exact certification of the dimension-eleven kissing records}
\\author{\\cmauthor}
\\date{September 2026}

\\begin{document}
\\maketitle

\\begin{abstract}
The kissing number $K(d)$ is the largest number of non-overlapping unit spheres
that can touch a central unit sphere in $\\R^d$. In dimension eleven the record
stood near $582$ for decades and then moved three times in eighteen months, each
time by an AI system, and each configuration was validated by the verifier of
the group that produced it. We re-decide every publicly available witness in
exact arithmetic over $\\Z[\\sqrt2]$ on arbitrary-precision integers, sharing no
code with any producer, and confirm $K(11) \\ge 604$. The three $604$-point
configurations have distinct exact contact counts
(${n(s1.contacts)}, ${n(s2.contacts)}, ${n(s3.contacts)}), which certifies
that they are pairwise non-congruent. One claim resists certification for a
reason worth recording: the configuration behind the headline $604$ of one
platform is not published, so its row measures opacity rather than geometry.
No new bound is claimed and no upper bound is touched.
\\end{abstract}

\\section{The decision procedure}

A finite set of non-zero vectors $x_1,\\dots,x_n \\in \\R^d$ yields a kissing
configuration exactly when the pairwise angles are at least $60^\\circ$: place a
unit sphere at $2x_i/\\abs{x_i}$ and all of them touch the central sphere without
overlapping. The condition is invariant under scaling each vector separately, so
any exact representative of each direction decides the claim, and for $i \\ne j$
it reads
\\[
  \\langle x_i, x_j\\rangle \\le 0
  \\qquad\\text{or}\\qquad
  4\\langle x_i, x_j\\rangle^2 \\le \\langle x_i,x_i\\rangle\\langle x_j,x_j\\rangle .
\\]
Both alternatives are polynomial in the coordinates, so a configuration given in
any real quadratic field can be decided without error. The $604$-point records
live in $\\Q(\\sqrt2)$, so the certifier works in $\\Z[\\sqrt2]$: a number is a pair
$(a,b)$ standing for $a + b\\sqrt2$ with $a,b$ arbitrary-precision integers, and
the sign of $a + b\\sqrt2$ is decided by comparing $a^2$ with $2b^2$ when the
coefficients disagree in sign. The tie $a^2 = 2b^2$ with $(a,b) \\ne (0,0)$ is
impossible over the integers because $\\sqrt2$ is irrational; the implementation
raises on it, and that raise is exercised as a control. No floating-point number
participates in any decision.

A decimal input such as $-0.1449$ is read as the exact rational it denotes,
$-1449/10000$, and never as the nearest binary double. This matters in
Section~\\ref{sec:ladder}.

\\section{Calibration}

The instrument is calibrated at every run against two configurations whose
kissing numbers are known exactly, generated from their own definitions rather
than stored: the $D_4$ root directions give $K(4) \\ge ${d4.n}$, and the $E_8$
roots give $K(8) = ${e8.n}$. The $E_8$ run reports ${n(e8.contacts)} pairs at
exactly $60^\\circ$, which is the textbook count $240 \\cdot 56/2$ for that root
system and is reproduced as an equality in exact arithmetic rather than as a
float comparison.

\\section{The dimension-eleven ladder}\\label{sec:ladder}

\\begin{theorem}
$K(11) \\ge 604$, certified in exact arithmetic over $\\Z[\\sqrt2]$ from published
coordinates, independently of any producer's verifier.
\\end{theorem}

\\begin{table}[h]\\centering\\small
\\begin{tabular}{@{}llrr@{}}
\\toprule
bound & witness & verdict & exact contacts \\\\
\\midrule
$582$ & classical norm-four shell & CERTIFIED & ${n(sh.contacts)} \\\\
$593$ & AlphaEvolve, integer coordinates & CERTIFIED & ${n(ae.contacts)} \\\\
$594$ & platform rung winner, decimal coordinates & CERTIFIED & ${n(ea.contacts)} \\\\
$604$ & configuration 1, $(a+b\\sqrt2)/6$ & CERTIFIED & ${n(s1.contacts)} \\\\
$604$ & configuration 2, $(a+b\\sqrt2)/6$ & CERTIFIED & ${n(s2.contacts)} \\\\
$604$ & configuration 3, $(a+b\\sqrt2)/6$ & CERTIFIED & ${n(s3.contacts)} \\\\
$604$ & headline claim, coordinates unpublished & NEEDS DATA & --- \\\\
\\midrule
$604$ in $\\R^{12}$ & integral $D_{12}$ lift of configuration 3 & CERTIFIED & ${n(lift.contacts)} \\\\
\\bottomrule
\\end{tabular}
\\end{table}

Each certified row is decided at shell norm exactly four where the producer
states one, and every enclosure is an exact comparison rather than a tolerance.

\\begin{corollary}
The three $604$-point configurations are pairwise non-congruent.
\\end{corollary}

\\begin{proof}
Congruences preserve the multiset of pairwise inner products and therefore the
number of pairs at exactly $60^\\circ$. The three configurations have
${n(s1.contacts)}, ${n(s2.contacts)} and ${n(s3.contacts)} such pairs,
computed as exact equalities in $\\Z[\\sqrt2]$, so no two can be congruent.
\\end{proof}

\\begin{remark}
The rung winner at $594$ is instructive about verification rather than about
geometry. That platform scores submissions in fixed-precision decimal and
switches to exact integer arithmetic only for integer-valued submissions, and
the winning vectors are not integral. Read as the exact rationals their decimal
literals denote, they are nonetheless a genuine exact witness, with
${n(ea.contacts)} pairs at exactly $60^\\circ$ and every other pair strictly
clear. High-precision decimal is not proof; here it happened to be reporting a
true statement.
\\end{remark}

\\section{What could not be certified, and why that is the sharpest row}

One row of the ledger is not a geometric verdict. The configuration behind the
headline $604$ of one platform, which the field's reference tables credit, is
not published: the public interface serves the solved $594$ rung and an open
$605$ rung, and discussion of the $604$ describes it without carrying its
coordinates. The claim is very likely true. It is also, today, not checkable by
anyone outside that platform, and the ledger says so rather than assuming it.

The threshold is explicit and small: publish the $604$ vectors in any exact or
decimal form and the row is decided in minutes.

\\section{Scope}

No bound is improved here and no configuration was searched for. Upper bounds,
which come from semidefinite programming, are untouched; this paper concerns
lower-bound witnesses only. Where a producer had already verified its own
configuration exactly, the contribution is independence: different code, a
different language, different arithmetic, and no shared line with the producer.

\\cmrepro{The instrument is \\texttt{instruments/kissing}; the ledger is
\\texttt{certs/kissing-ledger.json}; the pinned coordinates are in
\\texttt{corpus/kissing} with the upstream digest of each source recorded.
Running \\texttt{node instruments/kissing/battery.js} re-derives the $D_4$ and
$E_8$ calibrations from their definitions, re-certifies one $604$-point
configuration live, and requires every red control to
fire, among them the mixed-sign $\\sqrt2$ comparator and the exactness of
decimal-literal parsing.}

\\begin{thebibliography}{9}\\small
\\bibitem{ODSL} A.~M. Odlyzko and N.~J.~A. Sloane. New bounds on the number of
unit spheres that can touch a unit sphere in $n$ dimensions.
\\emph{J. Combin. Theory Ser. A} 26 (1979), 210--214.
\\bibitem{Musin} O.~R. Musin. The kissing number in four dimensions.
\\emph{Ann. of Math.} 168 (2008), 1--32.
\\bibitem{Best} M.~R. Best. Binary codes with a minimum distance of four.
\\emph{IEEE Trans. Inform. Theory} 26 (1980), 738--742.
\\end{thebibliography}

\\end{document}
`;
fs.mkdirSync(path.join(ROOT, 'paper', 'tex'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'paper', 'tex', 'kissing-ledger.tex'), tex);
console.log('wrote paper/tex/kissing-ledger.tex from certs/kissing-ledger.json');
