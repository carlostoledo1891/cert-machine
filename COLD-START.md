cert-machine — cold start. READ FIRST, BUILD SECOND.

Working dir: /Users/carlostoledo/Documents/cert-machine
Read CLAUDE.md and HANDOFF.md; both current. For the tip, run
`git log --oneline -1` — a hash written into this file would name the commit
before the one that carries it, so it is deliberately not stamped here.
make test 43 PASS · wiring ALL PASS · working tree clean, origin in sync,
site deployed (Vercel publishes on push).

FIRST ACTION:  node tools/sweep-claims.js
SECOND ACTION: node tools/targets.js
  23 targets with the citation that killed or opened each. The row
  lambda56-nonmonotonicity is YOUR campaign's memory.
THIRD ACTION:  read the MENU at the top of HANDOFF.md, and the session-g log
  right below it — it carries the method notes this file compresses.
FOURTH ACTION: gh issue view 392 --repo teorth/erdosproblems --comments and
  the same for 179 — A MAINTAINER REPLY OUTRANKS EVERYTHING; report and
  pause before acting on one.

YOUR TASK THIS SESSION — FINISH LAMBDA(6), continuing the operator's
2026-09-01 assignment (lambda(5) is DONE; the pair proves the first
non-monotonicity, lambda(6) = -L(1,2,4,6,7,8) < lambda(5) = -L(1,2,4,5,6)).

WHERE THE CAMPAIGN STANDS (certs/lambda56-campaign.json, one stage per
family; runner tools/run-lambda56-campaign.js re-derives everything on each
run, ~7 min):

  · LAMBDA(5) REDUCTION COMPLETE. All 8 exception families CLOSED: 74 dot
    theorems, 76 anchored closures (thresholds derived), 1725 finite sets
    decided, coverage at 15330 points, {1,2,4,5,6} walled at 4 leaves.
  · LAMBDA(6): generic certified (10 families); d+e=f, 2e=f, c+e=f and
    b+e=f CLOSED (the last two first-try). REMAINING SIX:
    a+e=f (6 subs, THE EXTREMIZER FAMILY — its omcsq-d conditions are the
    lambda(5) worklist one level down: 2d=f, 3d=2f, b+2d=2f, b+d=f
    [extremizer active], c+2d=2f [extremizer active], c+d=f; expect the
    comb on the b+d = a+e = f core, walls in two subtrees) ·
    a+2e=2f (probed: omcsq a, 8 subs mirroring lambda(5)'s a+2d=2e, plus
    the new e=2a sub where b,c,d ALL float in (a,2a) — budget its midpoint
    triangulation generously) · b+2e=2f (extremizer at a=be) · c+2e=2f ·
    d+2e=2f · 3e=2f (root triangulations; lambda(5) took 3/7/17 cones).

THE METHOD, proven over nine closed families — follow it mechanically:
  1. PROBE: dotTheorem on the family cone, S(top member, pi), gConst 2/3,
     single omcsq atom per candidate member; keep the fewest-positives
     weight. Zero positives = family closed, write the stage.
  2. PARAMETRIZE each positive condition as a cone (evaluate the CONDITION
     VECTOR — labels on custom cones are GARBAGE, two wrong-leaf hunts
     last session prove it). Regions that are not one simplicial cone get
     'split' nodes; family roots too (closeFamily accepts a split root).
  3. RECURSE: 3-dof-and-up cones get their own dots; 2-dof cones become
     'auto' leaves (anchor found by menu search — a witness, not an
     assumption). A 2-dof leaf that resists the whole menu usually closes
     by ITS OWN dot with zero exceptions — try that before inventing
     anchors.
  4. THE CORE: if every classical atom lands base > 0 on a sub-cone, you
     are on a double sum system (two member pairs summing to the top
     member. On S(top, pi) matches annihilate with complement wraps —
     structural, not a bug). Use the sq atom: comb |(1+z_a)(5+7z_b+
     5z_b^2)|^2 with z_m = e^{i(m+top)theta} on S(top, 2pi/3, Bmax 14),
     gConst 7/6. Choose comb members from DIFFERENT complement pairs.
  5. WALLS: the extremizer must land in finite parts and be skipped there.
     Find its active conditions by EVALUATING VECTORS at its coordinates;
     the battery counts walls — update the count when lambda(6)'s are in.
  6. Batteries: instruments/lambda56/battery.js must stay green (16 checks,
     5 red controls; W2 pins the complete lambda(5) worklist, W5 the
     lambda(6) closure count). Extend it as families close.

AFTER LAMBDA(6) CLOSES (possibly same session): (1) the independent audit,
mirroring tools/audit-lambda4.js — an alien clause walk over all reduced
6-sets in a box, zero shared code; (2) the write-up via the
build-lambda4-writeup.js pattern; (3) the NON-MONOTONICITY result is the
headline — lambda(2) < lambda(3) < lambda(4) < lambda(5) > lambda(6), the
sequence turns; announcement drafts to outreach/, OPERATOR-GATED per item.

THE RULES THAT BIND (full text in CLAUDE.md + HANDOFF):
  sin-mfg is READ-ONLY, permanently. Scout before building; write the
  targets row. NOTHING POSTS WITHOUT PER-ITEM OPERATOR APPROVAL. A red
  control that cannot fail is decoration. CHECKPOINT LONG COMPUTE — the
  runner writes its record after every stage; keep it that way. Exceptions
  are OUTPUT, never input. Coverage is point-by-point, scoped to the
  raising cone, from condition vectors. Every displayed number comes from
  a gated record.

WHAT THE LAST SESSION WOULD TELL YOU IF IT COULD SAY ONE THING:
  When a family resists, the failure MODE is information: base > 0 on
  every classical weight means a double-sum core (reach for the comb);
  an auto leaf with zero certifying pairs but deep minima means the menu
  is wrong, not the family (run the leaf's own dot); a finite part
  refusing on the conjectured optimizer means you missed a wall (evaluate
  its condition vectors again). Every dead end this session turned out to
  be the machine telling the truth.
