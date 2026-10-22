# AI-written claims about the zeta23 certificate — a false-claim battery

Written by Claude (Fable 5.1) in the claimbox session of 2026-10-22, as a claimant summarising the bandwidth-one ceiling's
numeric certificate might: some right, some wrong on purpose, none to be believed. The bytes every claim is held to are the
real ones (zeta23/LawN256.encl.json, decoded from the pinned LawN256.lean; the constants' file is ChallengeDeps.lean); the
expected outcome of each is in corpus/riemann-ai-jobs.json and the run is records/riemann-ai-run.json. One claim per line,
the note above it.

  the edge bound with its digits cut short (false: the exact value is 0.82395316071…)
|D(1)| ≤ 0.8239
  the edge bound rounded up to three digits (true)
|D(1)| ≤ 0.824
  the edge bound cut short by one unit of its eighth digit, strict (false by 7·10⁻¹⁰)
|D(1)| < 0.82395316
  the rows under a tighter tolerance (true: the worst row is 1.84·10⁻⁴⁰)
|256·S(j) − j| ≤ 2·10⁻⁴⁰ (0 < j < 256)
  the rows under a tolerance below the worst row (false)
|256·S(j) − j| ≤ 1e-40 (0 < j < 256)
  the rows with the range narrowed (not the certificate's rows)
|256·S(j) − j| ≤ 3·10⁻⁴⁰ (0 < j < 100)
  the rows with the range one too long (the closed-band row is free)
|256·S(j) − j| ≤ 3·10⁻⁴⁰ (0 < j < 257)
  the simple-point fraction cut short (false: p₀ = 0.68182868…)
p₀ ≤ 0.68182
  the simple-point fraction rounded up to four digits (true)
p₀ ≤ 0.6819
  the simple-point fraction with the relation the wrong way (false)
p₀ ≥ 0.6818287
  the Montgomery–Taylor constant with its last digit wrong (false; decided through the series certificate)
c₁* = 0.7532961…
  the proportion to four digits (true; decided the same way)
2 − 1/c₁* = 0.6725…
  the edge bound without the bars (a different quantity, no functional written for it)
D(1) ≤ 0.82395317
  the edge bound behind a hedge (prose)
we checked that |D(1)| ≤ 0.82395317
  the decimal constant as the Lean file prints it (no shape in the grammar)
1/(6·256²) + τ/512 < 2.5431316·10⁻⁶
