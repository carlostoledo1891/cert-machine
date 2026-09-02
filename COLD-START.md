cert-machine — cold start. READ FIRST, BUILD SECOND.

Working dir: /Users/carlostoledo/Documents/cert-machine
Read CLAUDE.md and HANDOFF.md; both current. For the tip, run
`git log --oneline -1` — a hash written into this file would name the commit
before the one that carries it, so it is deliberately not stamped here.

FIRST ACTION:  node tools/sweep-claims.js
SECOND ACTION: node tools/targets.js
  25 targets. The rows ember-port and lambda56-nonmonotonicity are this
  handoff's two live campaigns; terra-port is BUILT (items 1-8 + T5, the
  atlas, the paper) with only the live solver and the papers-3/4 split
  question open.
THIRD ACTION:  read the MENU at the top of HANDOFF.md, then EMBER-PORT.md
  in full — it is the assigned plan.
FOURTH ACTION: check the offline lambda(6) computation BEFORE anything
  else long-running: `ps -p 72893 -o pid,%cpu,etime` and
  `cat '/private/tmp/claude-501/-Users-carlostoledo-Documents-cert-machine/776c9149-d43e-4dae-b0b0-451991a0bdcd/scratchpad/a2e.log'`
  (a+2e = 2f, ~22 h at handoff; the log is 0 bytes until the verdict —
  that is normal). If it has FINISHED: fold the verdict in per HANDOFF's
  SECOND TASK (in-record ONLY run, then the full no-ONLY run, battery,
  commit). If it died: rerun per HANDOFF. Do not block the ember port on
  it — background and continue.
FIFTH ACTION:  gh issue view 392 --repo teorth/erdosproblems --comments and
  the same for 179 — A MAINTAINER REPLY OUTRANKS EVERYTHING; report and
  pause before acting on one.

YOUR TASK THIS SESSION — THE EMBER PORT (operator, 2026-09-02: "ember is
finished on frontier, plan the port" — plan written and committed; now
execute it). frontier-apps/experiments/ember holds a certified theorem:
the second Neumann eigenfunction of the trapezoid A(0,0) B(1,0)
C(17/20, 9/10) D(1/4, 9/10) — convex, no symmetry axis, not a lip domain,
OUTSIDE EVERY CLASS where the hot spots conjecture was previously proven —
attains its extrema ON THE BOUNDARY ONLY; mu1 is simple in
[12.020976127, 12.022398359]. Six-stage certificate chain, ~3 min
deterministic runtime, on the frontier bench. The finding is real; what it
lacks is what this machine adds: red controls on a chain that has none,
independent cross-derivations, pinned literature inputs, records, and a
page + paper whose builds refuse when a check goes red.

THE PLAN IS EMBER-PORT.md — ranked list, port conditions, do-not-port,
red flags. Follow its order:
  1. instruments/ivspecial — interval Gamma (Spouge) + fractional-order
     Bessel J_nu incl. NEGATIVE order, copy-with-sha of the operator's
     own MIT ivspecial.js + line-by-line review + the 47 falsifiers as a
     registered battery + NEW bigfloat cross-check reds. The missing
     instrument for the whole spectral-geometry lane.
  2. instruments/hotspots — the six cert stages re-run here on
     instruments/interval, one record per stage in certs/ember-*.json,
     battery with firing reds (mutated vertex, forged I0 != 5/48,
     dropped reflection layer, flipped ladder identity, partition
     completeness re-decided in RATIONALS).
  3. Independent cross-derivations — I0 = 5/48 and C_tr in exact
     rationals; mu1 upper bound on an independent basis; the corner
     coefficients b0/b1/b2 re-extracted at a SECOND annulus radius
     (condition of entry — the chain's most delicate step).
  4. Pin Liu arXiv:1808.08148 into corpus/sources; the two literature
     inputs are named trust-base assumptions in every record.
  5. reports/ember.html from design/ — the OPERATOR'S report, archaeology
     gate enforced (the terra treatment; see tools/build-report-terra.js
     for the pattern, including the gate that refuses bench narrative).
  6. tools/build-ember-writeup.js -> paper + PDF (the printToPDF pipeline
     is tools/build-terra-pdf.js — reuse; note the raw-socket CDP client
     and its handshake gotcha, both already solved there).
  P3 (the quadrilateral census toward "convex quadrilaterals have no hot
  spots") is a SEPARATE future campaign — do not start it, do not count
  it.

HONEST FRAMING (mandatory): "to our knowledge the first certified
hot-spots domain outside every analytically proven class" — ALWAYS with
the fence list (Judge-Mondal triangles/Annals; dDP convex high-d; lip
domains; symmetric quadrilateral subcases arXiv:2604.19003) and the
weekly arXiv race watch. One domain, one theorem — never more.

STANDING CONTEXT (details in HANDOFF):
  · The frontier skin IS the house design system now; charts are our
    inline-SVG forms (scatter with theorem diamonds, lines2 dual-scale,
    merged-path cell maps) — batteries keep their grip on figure bytes.
  · frontier-apps is a publication-bound SANDBOX (operator ruling
    2026-09-01): its artifacts will be published, so publishable
    versions are rebuilt HERE from certificates; provenance lives in
    records, never on pages. Nothing is public yet; the first release
    carries the priority stamp. ALL SENDS ARE OPERATOR-GATED.
  · sin-mfg remains READ-ONLY, permanently.
  · The terra claims ledger (what we will claim at the end) is in the
    session report artifact and mirrors reports/terra.html + the paper.
