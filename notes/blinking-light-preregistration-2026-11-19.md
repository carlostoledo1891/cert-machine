# The blinking light: g(3/10, 2/25) — pre-registration, 2026-11-19

Written and committed, with the pinned inputs and nothing else, BEFORE any file of this repository's judge for it exists.
The operator's words (2026-11-19, in the control-room chat): "integrate run 3 into cert-machine, after build the
materials and outreach needed."

## What every artifact of this decision says first

"The question and the phenomenon are Dobrynin and Stroujkova's (arXiv:2611.24898, 18 November 2026): a time-reversible
binary record that still requires dissipation, and the least dissipation over all finite networks left open. This
record decides a two-sided bound on one constant of a snapshot version of it. The upper bound is decided: a network
that reproduces the two numbers exactly. The lower bound is a certificate whose finite conditions are decided here; the
two theorems that turn it into a bound were proved by one AI model and read once by the other, and are not decided."

## What this is, honestly

This pre-registration comes AFTER the run. On 2026-11-19, 11:04 to 17:48 UTC, a GPT chat and a Claude chat worked one
goal (`corpus/blinking-light/run/GOAL.md`) through version 3 of the multitrack instrument: the tracks talk, propose and
review; the control room registers their claims in their own words, runs its own tests, decides finite claims with a
decider, and posted two planted errors sealed before the run. The run folder and the control room's private part are
pinned file by file in `corpus/blinking-light/MANIFEST.json`.

**The upper-bound decider already exists and already gave these verdicts in the run.** `lamp` (multitrack
`adapters/lamp.py`, identical to `run/inherited/checker/lamp-v2.py`, sha256 988cfe18dd5f9ba93f0a…) was written by the
control room from the definitions in GOAL.md before the run and amended once (A1: the state limit raised to 400); no
track wrote any of it. U0 to U2 below were decided by it in the run; those are prior observations. The lower-bound
certificate was checked in the run by the two tracks' own programs (`claude/verify_local.py`, the author's;
`gpt/review_local_certificate.py`, the reader's), both run by the control room (k51, k52); those are the claimants'
programs and enter the record as concordance, not as the decision. This file fixes the statements, the domains and
the controls for the record this repository keeps, decided again from the pinned copies by programs of this repository.

**Faults of the control room in the run, kept:** three proposals went unregistered for about 40 minutes (it consumed
its own unread messages before listening); a claim was registered with a JSON certificate as the object of a Python
runner, which "decided" it CERTIFIED by running the JSON (k42), withdrawn by a VOID verdict (k43), after which the
runner refuses files that are not Python; after the run, waiting for a GPT message with the reader's name marked five or
more messages as read by GPT (its read position was put back, conservatively).

## The models

Read from the local session records (model fields only). The GPT track: gpt-6.2-astra at effort xhigh in the Codex
extension. The Claude track: claude-fable-5-2 at effort high in Claude Code, in a window opened on this repository, so
this repository's instructions and memory index were in its context. The control room: claude-opus-5-5 in Claude Code.

## Who decides, and what the judge's authors have read

Carlos Toledo with Claude Opus 5.5 (claude-opus-5-5) in Claude Code, as the control room: the session that ran the
run and wrote `lamp`. Read by it: the conversation, `claude/lifting.md`, `claude/locality.md`, `claude/notes.md`,
`gpt/irreducible.md`, the docstring of `claude/verify_local.py` (its first 40 lines, the format of the certificate
file), and the first 40 lines of `gpt/review_local_certificate.py` (a docstring and one helper, while finding how to
run it). NOT opened beyond that: any program of either track.

Two new programs are written for this record by an agent of the control room, under one rule: it reads the theorems'
text (`lifting.md`, `locality.md`), the format paragraph below and the definitions in GOAL.md, and opens no program of
either track and not `lamp`. `rational` decides a network whose rates are all rational, in exact arithmetic.
`lower` decides the finite conditions of a certificate, over the whole domain, assuming no symmetry.

## Definitions

A network: states 1..N, rates k_ij >= 0, the generator L, an irreducible stationary law pi, a lamp f_i = +-1. Readings
at Poisson rate r: K = r (r - L)^-1. C1 = sum_i pi_i f_i (K f)_i, C2 = sum_i pi_i f_i (K^2 f)_i. Entropy production
sigma = sum_{i<j} (pi_i k_ij - pi_j k_ji) ln(pi_i k_ij / (pi_j k_ji)), every edge with its reverse; g = sigma / r.
g(c, q) is the infimum of sigma / r over networks with C1 = c, C2 = q.

The certificate format (from the docstring of `claude/verify_local.py`): rational knots 0 = h_0 < ... < h_K = 1 and,
at the knots, the values of A_0..A_{na-1}, K_0..K_{nk-1}, P_0..P_{npsi-1}, piecewise linear in |h|, A and P odd in h,
K even in h; p = sum_k A_k(h) d^(2k), q = sum_k K_k(h) d^(2k+1), psi = sum_k P_k(h) d^(2k+1), on the diamond
|h| + |d| <= 1 (h = (w+v)/2, d = (w-v)/2); and rationals l1, l2, mu and the stated bound.
- (D1) 2 p (h - f) + 2 q d - l1 f h - l2 (h^2 - d^2) - mu >= 0 on the diamond, for f = +1 and f = -1.
- (LOC) at every interior point of every strip between consecutive knot lines (of the diamond, h in [-1, 1]), the
  matrix [[8 p_h - x1^2, 4 (p_d + q_h) - x1 x2], [same, 8 q_d - x2^2]], x1 = 2q - psi_h, x2 = 2p - psi_d, is
  positive semidefinite.
- Continuity: p, q, psi continuous on the diamond (the odd functions vanish at h = 0).
The agent derives (D1) and (LOC) again from Theorems D and C in their own notation and reports any disagreement with
this paragraph; a disagreement is reported, never resolved silently.

## What is decided

**Upper bounds: networks (decided, unconditional).**
- **U0, the start.** `run/inherited/baseline/ring.json` (the four-state ring of the paper's Eq. 10, rates 3 and 1):
  C1 = 3/10 and C2 = 2/25 exactly, sigma enclosing 2 ln 3 (g = ln 3 = 1.0986...). `run/inherited/baseline/best8.json`:
  exact, g <= 0.497436 (the record when the run began). Decider: `lamp`.
- **U1.** `run/gpt/rational-mixture-84.json`: 84 states, every rate rational; C1 = 3/10 and C2 = 2/25 exactly; g in
  [0.377876231745, 0.377876231746]. Deciders: `lamp` and `rational`, which must agree.
- **U2.** `run/claude/mix156.json`: 156 states, every rate rational but two; in the given box exactly one value of the
  two free rates gives C1 = 3/10 and C2 = 2/25 exactly, and there g is in [0.377128261269, 0.377128261270].
  Decider: `lamp` (Krawczyk, 256-bit outward-rounded intervals). **Hence g(3/10, 2/25) <= 0.37712826127.**

**The lower bound's finite conditions (decided).**
- **L1.** `run/claude/cert222g.json` satisfies (D1) for both lamp values, (LOC) and continuity on the whole diamond, and
  l1 (3/10) + l2 (2/25) + mu = 1828627119/5000000000 = 0.3657254238 exactly, equal to the file's stated bound.
  Decider: `lower`. Concordance, not the decision: the author's and the reader's verifiers passed it in the run.

**Not decided, by name.** Theorem D (weak duality, `lifting.md` section 3) and Theorem C with Lemma S (locality,
`locality.md`), which turn L1 into **g(3/10, 2/25) >= 0.3657254**: proved by the Claude track, re-derived by the GPT
track (g19, g39), READ ONCE; no machine and no reader outside the two families has checked them. Also not decided:
Theorem L (the convex lifting; READ ONCE on C1 < 1, and false as printed at C1 = 1, g47 and k54), INTERIOR, the earlier
lower bounds of the GPT track (GENBOUND, JOINT, POTENTIAL, AFFINE, AUXCLOCK), the conjecture g = 0.3769 and the
optimality of "telegraph + ring", the function R(m), the continuous-record question of the paper, any statement about a
physical system or a finite recording, and novelty beyond the scout's reading.

## Controls: each must be refused, or the judge is not testing the result

Each is false by a route that is not the judge's verdict alone (named with it).
- KU1a: U1's file with one rate raised by 10^-6: C1 or C2 is no longer exact (both deciders must refuse). Route:
  `rational` and `lamp` both; the exact values are printed.
- KU1b: U1's file claiming sigma <= 0.75575246 (below the enclosure). Route: U1's enclosure.
- KU2a: U2's file claiming sigma <= 0.7542565225 (below the enclosure [0.754256522539, ...]). Route: U2's enclosure.
- KU2b: U2's box moved by 10^-20 in both free rates (the box is about 10^-30 wide): no zero in it. Route: the
  Krawczyk test on one box holding both proves a single zero there, and U2 places it in the original box, which is
  disjoint from the moved one.
- KL1a: `run/claude/cert222f.json`, the unscaled search output, which the author reports refused. `lower` must refuse
  it and name a rational point where a condition is negative; the value there is recomputed exactly by the judge.
- KL1b: cert222g with mu raised by 1/1000 (the run's float test found the least (D1) slack near 1.9 x 10^-4). Route:
  an exact negative value at the point `lower` names.
- KL1c: cert222g with the stated bound raised by 10^-7 and l1, l2, mu unchanged. Route: exact arithmetic.
- KL1d: cert222g with P_0 raised by 1 at the knot h = 3/10 (a slope of 100 in psi near that knot, so x1 ~ 100 d
  against a bounded 8 p_h). Route: an exact negative value at the point `lower` names.
Context, decided in the run (not part of this record's verdict): the four controls of the run's pre-registration
(K1-K4), all as expected.
Every control the judge fails to refuse is reported as MISSED, by name.

## The plants (reported, not decided)

Two planted errors, sealed by hash before the run (`corpus/blinking-light/private/`): EIGHT, a network file with a false
claim about its sigma; SHARPER, a false step inside a lower-bound proof of the run. Each family caught both (GPT within
minutes; Claude at the end of its work). Two plants measure little; the count is reported as it is.

## Predictions

U0-U2 and L1 CERTIFIED; every control refused (U0-U2 and the concordance of L1 were seen in the run; `lower` and
`rational` are new and have not run).

## Record and replay

`python3 instruments/blinking-light/judge.py --write` writes `certs/blinking-light.json`; `--check` re-hashes the pins
and decides again. Changes after this commit are amendments below, dated, each committed before the code it changes.

## Amendment A1, 2026-11-19 (one control's wording and route; committed before any file of the judge is committed)

The first full run of the judge (not committed, its record not kept) refused all eight controls, and the route of one of
them, KU2b, did not confirm. Two things were wrong in this file, both about KU2b, neither about a statement:
- U2's box is 2 x 10^-45 wide in each free rate, not "about 10^-30" as written above. Moving it by 10^-20 still makes
  the two boxes disjoint; the control is unchanged.
- "One box holding both" was first built as [lo, hi + 10^-20], which leaves the zero within 2 x 10^-45 of its lower
  edge; the Krawczyk test was not conclusive there (its image is not strictly inside the box when the zero sits on an
  edge), so the route did not confirm. The box holding both is now [lo - 10^-20, hi + 10^-20], with the zero near its
  centre. Run alone, the Krawczyk test proves a single zero in it.
Every other statement, control and route is as written. U0-U2, L1 and the other seven controls came out as predicted
in that run: rational.py and lower.py agreed with lamp and with the run's verdicts.
