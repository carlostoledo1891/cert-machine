cert-machine — cold start. READ FIRST, BUILD SECOND.

Working dir: /Users/carlostoledo/Documents/cert-machine
Read CLAUDE.md and HANDOFF.md; both current. For the tip, run
`git log --oneline -1` — a hash written into this file would name the commit
before the one that carries it, so it is deliberately not stamped here.
NOTE: certs/lambda56-campaign.json on DISK may be ahead of the committed
copy — two nohup'd computations were live at handoff (see SECOND TASK);
do not "clean" it, read it.

FIRST ACTION:  node tools/sweep-claims.js
SECOND ACTION: node tools/targets.js
  24 targets. The rows terra-port and lambda56-nonmonotonicity are this
  handoff's two live campaigns.
THIRD ACTION:  read the MENU at the top of HANDOFF.md, then TERRA-PORT.md
  in full — it is the assigned plan.
FOURTH ACTION: gh issue view 392 --repo teorth/erdosproblems --comments and
  the same for 179 — A MAINTAINER REPLY OUTRANKS EVERYTHING; report and
  pause before acting on one.

YOUR TASK THIS SESSION — THE TERRA PORT (operator, 2026-09-01: "full port
as priority"). frontier-apps/experiments/terra holds a certified finding:
exact congestion-MFG equilibria on the torus whose density carries MORE
LOCAL MAXIMA THAN THE POTENTIAL HAS WELLS (two peaks over one well; a
three-peak instance), via radii-polynomial enclosures at radius ~2.5e-13,
with mechanism (band-pass linear response), an exact constant
(sigma* = 1/(8pi^2), gamma-independent) and a splitting window
(1/16 < r < 1/4). Audited in full last session; the main specimen was
independently re-derived from its stored record. The finding is real; what
it lacks is exactly what this machine exists to add: an adversarial
battery, a second derivation, and pages/papers whose builds refuse when a
check goes red.

THE PLAN IS TERRA-PORT.md — ranked port list, port conditions, do-not-port
list, paper/page rebuild notes, red flags. Follow its order:
  1. Extend OUR MIT reports/verify_congest.py (already in-repo, 2,220
     lines, falsifiers X1-X7) with the A2/A3 data terms and re-certify
     terra's T1 and T6 inside cert-machine. This re-proves the whole
     finding at full standard. Watch the approximate-inverse blocker
     (TERRA-PORT.md item 1).
  2. instruments/critcount from terra's certify-peaks.js — three rigor
     fixes are CONDITIONS OF ENTRY, then a battery whose reds fire.
  3. sigma* = 1/(8pi^2) decided in exact rationals (it is a rational
     identity; no float agreement).
  4-8. Bracket table, terra-cap census, atlas REBUILD from design/
     (never import; needs a scatter form in design/charts.js), facelaw
     with rebuilt evidence, attention phantom-bifurcation catalogue.
RE-INSPECT frontier-apps BEFORE porting — it was still updating during
the audit (a Phase-3E note and a FOURTH paper landed mid-audit; more may
have landed since). frontier-apps has NO GIT and is NOT a valid lift
source: re-lift MIT pieces from sin-mfg originals or author fresh.
sin-mfg remains READ-ONLY, permanently.
HONEST FRAMING IS MANDATORY: the crowd RE-WEIGHTS an existing harmonic
(1.88x across the 1/4 threshold) — it does not "invent structure". One
phenomenon theorem + one three-peak theorem + a bracket table — never
"eight theorems".
OPERATOR QUESTION TO ASK EARLY: was reports/mfg-congest.html ever sent
anywhere? It decides the "first CAP for MFG" priority claim in any paper.

SECOND TASK — FINISH LAMBDA(6) (details in HANDOFF menu). Short form:
lambda(5) is COMPLETE (8/8, committed). lambda(6) is 9/10 VERIFIED:
5 families ok in the record incl. the extremizer family a+e=f; b+2e/c+2e/
d+2e/3e=2f verified closed offline with their in-record run left running
at handoff (nohup pid 24291 — CHECK certs/lambda56-campaign.json stages
FIRST; rerun missing stages with ONLY='<stage names |-separated>').
a+2e=2f was still computing offline at handoff (nohup pid 72893, ~4h,
healthy; verdict written to the PREVIOUS session's scratchpad:
/private/tmp/claude-501/-Users-carlostoledo-Documents-cert-machine/776c9149-d43e-4dae-b0b0-451991a0bdcd/scratchpad/a2e.log
— if missing, rerun ONLY='a+2e = 2f', expect hours, AUTOCLOSE_TRACE=1
for a heartbeat). Then: full no-ONLY run (background it), battery W5 →
all-10 + lambda(6) wall counts, make test, commit. Then the audit
(mirror tools/audit-lambda4.js), write-up, and the NON-MONOTONICITY
announcement — drafts to outreach/, OPERATOR-GATED per item.

THE RULES THAT BIND (full text in CLAUDE.md + HANDOFF): sin-mfg READ-ONLY.
Scout before building; write the targets row. NOTHING POSTS WITHOUT
PER-ITEM OPERATOR APPROVAL. A red control that cannot fail is decoration.
CHECKPOINT LONG COMPUTE (runners write per stage; trace long autoClose
runs). Exceptions are OUTPUT. Coverage is point-by-point from condition
vectors. Every displayed number comes from a gated record. Pages are born
from design/ — never imported.

WHAT THE LAST SESSION WOULD TELL YOU IF IT COULD SAY ONE THING:
  The terra audit's deepest lesson mirrors the lambda campaign's: the
  mathematics was sound in both, and every danger lived in the FRAME —
  an overclaiming title, an inflated theorem count, untested modified
  lines, unfireable red controls. Port the mathematics; refuse the frame.
