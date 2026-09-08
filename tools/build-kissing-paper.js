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
if (nd.verdict !== 'CERTIFIED' || nd.uniformNorm !== true) die('the EinsteinArena 604 row is not CERTIFIED at its shell norm');
if (!nd.sameGramProfileAs || nd.sameGramProfileAs.join() !== 'station-604-1') die('the Gram-profile remark (EinsteinArena 604 ~ configuration 1 only) would be false');
const daysToBytes = Math.round((Date.parse(nd.bytesPublished) - Date.parse(nd.needsDataFrom)) / 86400000);
const sharedS1 = nd.sharedDirectionsWith['station-604-1'];
const cg = nd.congruence || {};
if (!cg['station-604-1'] || cg['station-604-1'].verdict !== 'CONGRUENT' || cg['station-604-1'].isometry !== 'signed coordinate permutation') die('the congruence theorem would be false');
if (cg['station-604-2'].verdict !== 'NOT CONGRUENT' || cg['station-604-3'].verdict !== 'NOT CONGRUENT') die('the non-congruence statement would be false');
const OR = L.openRungs || []; if (OR.length !== 3) die('open rungs missing');
const r841 = OR.find((r) => r.slug === 'kissing-number-d12'); if (!r841 || r841.measured.coincident !== 1 || r841.measured.violations !== 1) die('the n=841 sentence would be false');
const r605 = OR.find((r) => r.slug === 'kissing-number-d11-605'), r842 = OR.find((r) => r.slug === 'kissing-number-d12-842');

const tex = `\\documentclass[11pt]{article}
\\usepackage{certmachine}

\\title{Two platforms, one configuration:\\\\ independent exact certification of the dimension-eleven kissing records}
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
code with any producer, and confirm $K(11) \\ge 604$ from four published
$604$-point configurations. Three, from one platform, have distinct exact
contact counts (${n(s1.contacts)}, ${n(s2.contacts)}, ${n(s3.contacts)}),
which certifies that they are pairwise non-congruent. The fourth, the headline
configuration of the other platform, was unpublished when this ledger first
ran: its row measured opacity for ${daysToBytes} days, naming the bytes that
would decide it, and decided the day they were published on request. It is
congruent to the first of the three: a signed permutation of the coordinates
carries one onto the other, and the certificate is verified exactly. The three
open rungs of the platform are measured as distances to a witness. No new
bound is claimed and no upper bound is touched.
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
$604$ & headline claim, $p+q\\sqrt2$ pairs, published on request & CERTIFIED & ${n(nd.contacts)} \\\\
\\midrule
$604$ in $\\R^{12}$ & integral $D_{12}$ lift of configuration 3 & CERTIFIED & ${n(lift.contacts)} \\\\
\\bottomrule
\\end{tabular}
\\end{table}

Each certified row is decided at the shell norm its producer states (four for
the three configurations given over six, thirty-six for the headline
configuration), and every enclosure is an exact comparison rather than a
tolerance.

\\begin{corollary}
The Station's three $604$-point configurations are pairwise non-congruent.
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

\\section{The row that measured opacity, and how it closed}

One row of the ledger was not, at first, a geometric verdict. On
${nd.needsDataFrom} the configuration behind the headline $604$ of one
platform, which the field's reference tables credit, was not published: the
public interface served the solved $594$ rung and an open $605$ rung, and
discussion of the $604$ described it without carrying its coordinates. The row
read NEEDS DATA, with the threshold stated in one sentence: publish the vectors
in any exact or decimal form and the row is decided in minutes.

The ledger asked. On ${nd.bytesPublished}, ${daysToBytes} days later, the
platform's maintainer answered with the repository holding the file: $604$
vectors as pairs of integers $(p,q)$ per coordinate, standing for $p+q\\sqrt2$,
every vector at shell norm exactly $36$. Pinned by its digest, the file decided
CERTIFIED in ${nd.ms} milliseconds with ${n(nd.contacts)} exact contacts.
A row of this kind measures the claim-maker rather than the geometry, and the
measurement here is favourable: the price of checkability was one request.

\\section{The two platforms' $604$s are one configuration}

\\begin{theorem}
The EinsteinArena $604$-point configuration and configuration~1 of the Station
are congruent. Explicitly, there is a bijection $\\pi$ of the $604$ vectors and a
signed permutation matrix $T$ of the eleven coordinates with $T\\,(2a_i) =
b_{\\pi(i)}$ for every $i$.
\\end{theorem}

\\begin{proof}
Two configurations at one shell norm each are congruent exactly when a bijection
matches every pairwise inner product up to the ratio of norms. Each
configuration is therefore a complete graph on $604$ vertices whose edges carry
the exact normalised inner product (${cg['station-604-1'].edgeColours} distinct
values here), and congruence is isomorphism of edge-coloured graphs. It was
decided by individualisation--refinement: colour refinement as the invariant,
backtracking over the smallest cell, the procedure inside \\textsc{nauty},
implemented independently. The search found $\\pi$ in
${n(cg['station-604-1'].nodes)} nodes. From $\\pi$ the matrix $T$ was solved on
eleven independent vectors in exact $\\Q(\\sqrt2)$ arithmetic and verified on all
$604$, together with $T^{\\mathsf T}T = I$; the certificate $(\\pi, T)$ is stored
beside the ledger and re-verified at every build without repeating the search.
$T$ has entries in $\\{0, \\pm1\\}$ with one non-zero per row.
\\end{proof}

\\begin{corollary}
Configurations 2 and 3 of the Station are congruent neither to configuration~1
nor to each other. (Their contact counts differ; independently, the same
search exhausts at its first node for each pair.)
\\end{corollary}

\\begin{remark}
The lineage of the headline configuration is in its bytes. Of its $604$
directions, ${n(nd.sharedDirectionsWith['ea-594-winner'])} are those of the same
platform's $594$ rung winner --- exactly its ${n(nd.integerVectors)} integer
vectors --- and the winner's ${n(ea.nonIntegerVectors)} decimal-valued vectors were
replaced by ${n(nd.n - nd.sharedDirectionsWith['ea-594-winner'])} vectors with a
$\\sqrt2$ part; ${n(nd.sharedDirectionsWith['station-shell-582'])} directions are
the classical $582$ shell's. Its slack is small: ${n(nd.nearestNonContact.count)}
pairs sit at ${nd.nearestNonContact.angleDeg.toFixed(2)}$^\\circ$. As data: the
EinsteinArena file entered a public repository on 2026-04-12 and its paper was
submitted 2026-06-09; the Station's artifacts and paper are dated 2026-08-24.
\\end{remark}

\\section{The open rungs, measured}

The platform lists three open rungs --- $n = 605$ in dimension eleven, $n = 841$
and $n = 842$ in dimension twelve --- each with a best submission it scores above
zero. The instrument reads those too, as a distance rather than a verdict:
every pair decided exactly, every violation counted, the worst named. The best
$605$ has ${n(r605.measured.violations)} violating pairs, the worst at
${r605.measured.worstAngleDeg.toFixed(2)}$^\\circ$; the best $842$ has
${n(r842.measured.violations)}, the worst at
${r842.measured.worstAngleDeg.toFixed(2)}$^\\circ$; the best $841$ fails by exactly
one pair, and that pair is a vector repeated: ${n(r841.measured.n - 1)} distinct
directions with ${n(r841.measured.contacts)} exact contacts, an $840$-point
configuration submitted as $841$. None of this refutes anything: an attempt that
fails is not a bound that fails.

\\section{Scope}

No bound is improved here and no configuration was searched for. Upper bounds,
which come from semidefinite programming, are untouched; this paper concerns
lower-bound witnesses only. Where a producer had already verified its own
configuration exactly, the contribution is independence: different code, a
different language, different arithmetic, and no shared line with the producer.

\\cmrepro{The instrument is \\texttt{instruments/kissing}; the ledger is
\\texttt{certs/kissing-ledger.json}; the pinned coordinates are in
\\texttt{corpus/kissing} with the upstream digest of each source recorded (the
headline $604$ file is held byte for byte and re-hashed at every run).
Running \\texttt{node instruments/kissing/battery.js} re-derives the $D_4$ and
$E_8$ calibrations from their definitions, re-certifies two $604$-point
configurations live from their pinned bytes, and requires every red control to
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
