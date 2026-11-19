# Pre-registration: blinking-light (multitrack run 3)

Written by the control room on 2026-11-19, before any track joined, and posted with `mt prereg`. Its sha256 and the
private part's are in the control log; a change after that is a numbered amendment.

## The question

The least entropy production rate of a stationary finite-state Markov jump process (states even under time
reversal, any number of states) whose binary lamp, read at Poisson times of rate r = 2, has C1 = 3/10 and C2 = 2/25.
Equivalently the constant g(3/10, 2/25) = least sigma / r. Known at the start: 0.02 <= g <= 0.497436 (GOAL.md).
The operator chose this form on 2026-11-19 after the scout (corpus/targets.json row one-bit-dissipation-2026-11 in
cert-machine): the snapshot constant, both models on both sides, the Dobrynin–Stroujkova paper staged from the start.

## What counts as a result

- **An upper bound on g (finite, decided).** A `lamp-network-1` file decided by the `lamp` checker. When it decides
  the file reproduces both numbers exactly and sigma <= X, the report may say "g(3/10, 2/25) <= X / 2, decided".
  A network stated only in floats is a computation, reported as such, never as a bound.
- **A lower bound on g (a theorem).** A proof that every finite network reproducing the two numbers has sigma >= Y.
  It is registered as a theorem, read by the other track, and stays READ ONCE (below). Any finite computation a step
  rests on gets an independent test by the control room, written from the proof's text and run with `mt test --exec`.
  The report may say "g >= Y / 2, proved by the X track and read once by the other model, not decided".
- **The interval at the end** is the least decided upper bound and the greatest lower bound read at least once, each
  labelled by its standing. A claim that g equals a value needs both sides to meet.
- **Novelty** is stated only against the scout's literature, Dobrynin–Stroujkova first; the 0.04 k_B/s bound is
  never presented as new.

## Deciders

- `lamp` (adapters/lamp.py; a copy at inherited/checker/lamp.py), written by the control room from the definitions
  on 2026-11-19, sharing no code with any track. Exact rational arithmetic for exact rates; for two free rates, the
  Krawczyk test in 256-bit outward-rounded interval arithmetic proves exactly one zero of (C1 - 3/10, C2 - 2/25) in
  the box; sigma enclosed with interval logarithms.
- Tested before the run (control/prior/checks-before-the-run.txt): the ring, exact rates, sigma enclosed around
  2 ln 3; best4 and best8 (the plain search's networks, made exact with fit.py) decided, g = 0.748848... and
  0.497435...; the four controls below as expected. Its numbers agree with two other programs: inherited/replay/ring.py
  (fractions) and inherited/baseline/plain.py (NumPy floats, 0.99487013 against the decided 0.99487025 after rounding
  the rates).
- Known limit: Krawczyk refuses boxes wider than about 10^-6 around a zero (interval elimination overestimates); a
  refusal proves nothing about the network, and a smaller box is the answer.

## Controls

Each was checked false before the run, by a route that is not the checker's verdict alone:

- K1: the ring with the claim sigma <= 2.1. False: sigma = 2 ln 3 = 2.1972... (ring.py, exact up to the logarithm).
  Expected and observed: REFUTED.
- K2: the ring against the target C2 = 81/1000. False: the ring's C2 is 2/25 exactly (ring.py). Expected and
  observed: REFUTED.
- K3: best8 with the claim sigma <= 0.99. False: plain.py's float sigma for the same ring is 0.99487. Expected and
  observed: REFUTED.
- K4: best8 with the rate 2->3 raised by 10^-6 and the box unchanged. The claim "a zero lies in this box" is false:
  a 300-bit re-solve puts the free rates at 1.973018934... and 11.506817128..., about 10^-6 from the box, which is
  10^-30 wide. Expected and observed: REFUSED.

## Plants

Two, their content in the private part sealed by its hash: one in a number (a network file with a false claim about
its sigma), one inside a step of a track's lower-bound proof, posted with `mt plant --into` once such a proof is
registered and both tracks are reviewing. Each plant's falsity check runs before it is posted.

## Second readings

The operator chose, on 2026-11-19, to accept READ ONCE for this run: a theorem read by the other track ends READ ONCE.
Lean on this Mac is core only (no Mathlib); it can recheck rational facts about a given network and is not used for the
lower bound unless a track asks and the operator turns it on.

## What the run does not decide

The continuous-record question the paper leaves open (the tracks may work on it; nothing about it is decided here);
any statement about a physical system or a finite recording; novelty beyond the scout's reading; a winner between the
models.
