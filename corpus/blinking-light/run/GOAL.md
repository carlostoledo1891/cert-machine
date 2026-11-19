# The goal: how much dissipation can one blinking light prove?

## The question

A machine runs on hidden states: a stationary, finite-state, continuous-time Markov jump process, every state even
under time reversal, any number of states, any rates. All you see is a lamp, on in some states and off in the others
(write f = +1 on, f = -1 off). You read the lamp at the times of an independent Poisson clock of rate r = 2 per second,
and you learn two numbers:

- C1 = E[f(X_0) f(X_1)], consecutive readings: **C1 = 3/10** (two successive readings agree with probability 13/20);
- C2 = E[f(X_0) f(X_2)], readings two apart: **C2 = 2/25** (three successive readings agree pairwise twice with
  probability 21/50).

In equilibrium (detailed balance) the kernel between readings is self-adjoint in the stationary inner product, so
C2 = <Kf, Kf> >= <f, Kf>^2 = C1^2. Here C2 falls short of C1^2 by 1/100, so the machine must dissipate.

**What is the least entropy production rate sigma (k_B per second) of a hidden network, of any size, that reproduces
these two numbers exactly?** Speeding every rate and the clock up together changes nothing observable, so the answer
is r times a constant g(C1, C2). The question is the constant **g(3/10, 2/25)**. Today the record is
**0.02 <= g <= 0.497436** (below). Narrow it from either side, or settle it.

The operator's words for it: "how much entropy production can a single blinking light prove?"

## What is already known
(Finding it again is a correct reproduction, not an advance.)

1. **Dobrynin and Stroujkova, arXiv:2611.24898 (posted 18 Nov 2026)**, in `inherited/paper/`. For a CONTINUOUS-TIME
   record of the lamp: a time-reversible binary record can require dissipation; the test g(2t) >= g(t)^2 on the
   persistence g(t) (and the sign of C(2t) - C(t)^2); a bound for every finite network, sigma >= 2 delta artanh(delta/mu)
   with mu = -g'(0), s^2 = g''(0), delta = sqrt(mu^2 - s^2), never attained; a finite-window bound
   sigma >= 8 sup_t (g(t)^2 - g(2t))/t from Pinsker's inequality (their S5.3); the least-dissipation four-state model in
   a sign-symmetric family (their Eq. 10); and, in their words, "the minimum over all finite-state Markov processes
   remains unknown". Their bounds use the continuous record (switching rate, persistence curvature); the observer
   here has only the two snapshot correlations, which do not determine mu or s.
2. **The lower bound g >= 0.02.** The idea arrived with sigma >= 2 r (C1^2 - C2) = 0.04 k_B/s: write K for the
   one-interval kernel and K* for its stationary adjoint; h = (Kf + K*f)/2, d = (Kf - K*f)/2; then
   ||d||^2 >= C1^2 - C2, |d(i)| is at most the total variation between K(i,.) and K*(i,.), Pinsker, and data processing
   over one sampling interval of mean 1/r. Same shape as item 1's finite-window bound. In `inherited/idea/`.
3. **The four-state ring** (clockwise rate 3, counterclockwise 1, lamp on two adjacent states) reproduces both numbers
   with sigma = 2 ln 3, so g = ln 3 = 1.0986. It is item 1's least-dissipation four-state model for its own
   continuous record. Its lamp autocorrelation is e^(-4t) cos 2t.
4. **Bounds built on the time asymmetry of the observed signal give nothing here**: the lamp sequence has the same law
   as its reversal (checked exactly for every word up to length 7).

## What a plain search already finds

Random restarts of a constrained optimiser (floats) over rings and complete graphs of 3 to 8 states, minimising sigma
subject to C1 = 3/10 and C2 = 2/25 (`inherited/baseline/`):

| states | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|
| least g found | 4.94 | 0.749 | 0.629 | 0.542 | 0.519 | 0.497 |

The best is always a ring with the lamp on a contiguous block of about half the states; complete graphs did no better (the optimiser may simply
miss there). Fixing the lamp's on-fraction at 1/2 changes nothing. Two of these were made exact and checked:
`best4.json`, g = 0.748848..., and `best8.json` (an eight-state ring), **g = 0.497435...** It is still falling as
states are added.

## What would be new

- A network, of any size, that reproduces the two numbers exactly with g below 0.497435; or a family whose g tends to
  a limit, with that limit.
- A lower bound above 0.02 that holds for every finite network, with its proof.
- The exact value of g(3/10, 2/25); or g(C1, C2) as a function on the region C2 < C1^2.
- If you get there: the continuous-record question item 1 leaves open.

## Material in this folder

- `inherited/paper/`: the paper (PDF) and a plain-text extraction of it, supplement included.
- `inherited/idea/`: the text the operator received from a Codex chat with this idea (`idea.md`) and the replay script
  it pointed to (`one_bit_thermodynamics.py`).
- `inherited/replay/ring.py`: the ring's numbers in exact fractions, written separately from the idea's script.
- `inherited/baseline/`: the plain search (`plain.py`, `plain-results.json`), `fit.py` (turns a float network into an
  exact file, below), `best4.json`, `best8.json`, `ring.json`.
- `inherited/checker/lamp.py`: the program the control room uses to check a network. Its format and definitions are
  at the top of the file.

## If you have a number or an object

A network goes in a `lamp-network-1` file (the format is at the top of `inherited/checker/lamp.py`). Rational rates
rarely hit 3/10 and 2/25 exactly, so a file may give every rate but two as a rational, name the two free edges, and
give a small box for them (around 10^-30 wide, centred on a high-precision solution); the checker proves that exactly
one point of the box reproduces both numbers and encloses sigma there. `inherited/baseline/fit.py` does the rounding
and the high-precision solve. You can run `python3 inherited/checker/lamp.py FILE` yourself. A lower bound is a
theorem: write its proof, and if a step rests on a finite computation, keep the short script that redoes it.
