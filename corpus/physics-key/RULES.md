# The physics answer key, v0 — rules written before any simulation step was run

Written 2026-11-17, on the branch `physics-key`, and committed before the generator
existed. At the time of writing, the engine had been imported and its enum names and
model defaults read; no simulation step had been taken. Anything learned later that
changes a rule is a DATED AMENDMENT at the end of this file, never an edit above it.

## 1. What is decided, and what is not

A physics engine writes its state as IEEE-754 binary64 numbers. Every finite binary64
number is an exact rational. So a statement such as "the kinetic energy at step k is
within 1% of its initial value" is, for a recorded trajectory, a statement about
rationals, and it is decided here in exact arithmetic with no tolerance in the
decision. Where a cosine is needed, it is enclosed between two rationals and the
enclosure is tightened until the comparison is decided.

The subject of every verdict is a PINNED FILE OF BYTES (one recorded run), not an
engine. A verdict says: these bytes do, or do not, satisfy this law within this stated
tolerance at every recorded step.

Not decided: whether the engine has a bug (none of this is a bug report: an integrator
of finite order is expected to drift); anything with contact or friction; anything
about a real robot; anything about runs that were not recorded.

## 2. The three verdict words

For one run, one law and one tolerance ε:

- CERTIFIED: the inequality holds at every recorded step.
- REFUTED: it fails at some step; `firstStep` is the smallest such step.
- REFUSED: neither could be established (a non-finite number in the file, a malformed
  file, or a comparison not decided at the precision cap of section 7).

A definite violation at any step gives REFUTED even if an earlier step was undecided.

## 3. The file of one run

`<run-id>.f64` is raw little-endian binary64. Rows are steps k = 0, 1, …, N. Row k
holds `1 + nq + nv` numbers: the engine's time, then its position vector `qpos`, then
its velocity vector `qvel`, read from the engine after k steps (row 0 is the initial
state). It is stored gzipped as `<run-id>.f64.gz`; every sha256 is of the uncompressed
bytes.

`runs.json` lists the runs. Each entry: `id`, `scene`, `engine`, `engineVersion`,
`integrator`, `timestep` (decimal string) and `timestepBits`, `steps` (N), `nq`, `nv`,
`sha256`, `params` (name → bits), `warnings`. "Bits" always means the 16 lowercase hex
digits of the binary64 bit pattern, most significant first. A decider reads parameters
from `params`, as the rational each bit pattern denotes, and from nowhere else.

A file is MALFORMED if its length is not exactly `8 · (N + 1) · (1 + nq + nv)` bytes or
its sha256 differs from the manifest. A step is NON-FINITE if any number in its row is
an infinity or a NaN, or (scene `top`) its quaternion is all zeros.

## 4. Scenes

All three: one body, no contact, no friction, no damping, no actuator. Initial states
are set by the generator and are row 0 of the file.

- `fall`: a free body under gravity, at rest at the origin. `qpos = (x, y, z, qw, qx,
  qy, qz)`, `qvel = (vx, vy, vz, w1, w2, w3)`. Parameter `G` (the engine's stored
  gravity, sign flipped so G > 0). Horizon 2 s.
- `pendulum`: one hinge about the y axis, the centre of mass a distance `L` below the
  hinge when `qpos = 0`. `qpos = (θ)`, `qvel = (θ')`. Parameters `M`, `L`, `IYY` (the
  body's inertia about the hinge axis through its centre of mass), `G`. Released from
  rest at θ = 2. Horizon 10 s.
- `top`: a free body, no gravity, principal inertias `I1`, `I2`, `I3` on the body
  axes, spinning about the middle axis with a small perturbation: body-frame angular
  velocity (0.0625, 4, 0.0625). Same `qpos`, `qvel` layout as `fall`; the quaternion is
  (qw, qx, qy, qz), scalar first, and `qvel[3..5]` is the angular velocity IN THE BODY
  FRAME (the engine's convention as I understand it; confirmed or refused by the
  calibration of section 8 before any verdict is read). Horizon 10 s.

Engine: MuJoCo 4.0.1 from PyPI. Integrators: every one its enum names (Euler, RK4,
implicit, implicitfast, discrete; what `discrete` does had not been read when this was
written). Timesteps: 0.01, 0.005, 0.002 (the engine's default), 0.001. Sixty runs. An
integrator that will not run is recorded as not run, with the engine's message.

## 5. Laws

Write `t_k`, and the state at step k, for the rationals in row k.

`fall`
- F-POS(ε): `|z_k − Z_k| ≤ ε`, where `Z_k = z_0 − (G/2)·(t_k − t_0)²`. Metres.
- F-VEL(ε): `|vz_k − V_k| ≤ ε`, where `V_k = vz_0 − G·(t_k − t_0)`. Metres per second.
- ε ∈ {1e-2, 1e-3, 1e-6, 1e-9, 1e-12, 0}.

`pendulum`
- P-ENERGY(ε): `|D_k| ≤ ε`, where, with `J = IYY + M·L²`,
  `D_k = (J / (2·M·G·L))·(θ'_k² − θ'_0²) − (cos θ_k − cos θ_0)`.
  This is the energy change since step 0 divided by `M·G·L`.
- ε ∈ {1e-2, 1e-4, 1e-6, 1e-9, 1e-12, 0}.

`top`, with `ω = qvel[3..5]`, `p = (I1·ω1, I2·ω2, I3·ω3)`:
- T-ENERGY(ε): `|T_k − T_0| ≤ ε·T_0`, `T = ½·(I1·ω1² + I2·ω2² + I3·ω3²)`.
- T-LMAG(ε): `|Λ_k − Λ_0| ≤ ε·Λ_0`, `Λ = p·p`, the SQUARED magnitude of the angular
  momentum (so ε here is about twice the relative change of the magnitude).
- T-LVEC(ε): `|ℓ_k − ℓ_0|² ≤ ε²·Λ_0`, where `ℓ = R(q)·p` is the angular momentum in
  the world frame and, for `q = (w, x, y, z)` and `n = w² + x² + y² + z²`,

  ```
  R(q) = (1/n) · | w²+x²−y²−z²   2(xy−wz)      2(xz+wy)    |
                 | 2(xy+wz)      w²−x²+y²−z²   2(yz−wx)    |
                 | 2(xz−wy)      2(yz+wx)      w²−x²−y²+z² |
  ```

  R(q) is rational and exactly orthogonal for every non-zero q, normalised or not.
- ε ∈ {1e-2, 1e-4, 1e-6, 1e-9, 1e-12, 0}.

Each tolerance is the exact decimal it is written as. If `M·G·L`, `T_0` or `Λ_0` is
zero the run is treated as malformed.

## 6. What a decider outputs

One JSON object, `{"runs": {<run-id>: R}}`, with

```
R = { "status": "ok" | "malformed" | "nonfinite",
      "nonFiniteStep": k | null,
      "laws": { <LAW>: { "tolerances": { <ε>: { "verdict": …, "firstStep": k | null } },
                         "max":  { "step": k, "lo": s, "hi": s } | "REFUSED" | null,
                         "last": { "lo": s, "hi": s } | "REFUSED" | null } } }
```

Tolerance keys are the strings "1e-2", "1e-3", "1e-4", "1e-6", "1e-9", "1e-12", "0".

- The DEVIATION of a law at step k is: F-POS `z_k − Z_k`; F-VEL `vz_k − V_k`;
  P-ENERGY `D_k`; T-ENERGY `(T_k − T_0)/T_0`; T-LMAG `(Λ_k − Λ_0)/Λ_0`; T-LVEC
  `|ℓ_k − ℓ_0|²/Λ_0` (squared, never negative).
- `max`: the smallest step at which the ABSOLUTE deviation is largest, and that
  absolute deviation.
- `last`: the SIGNED deviation at step N.
- `malformed`: every tolerance REFUSED, `firstStep` null, `max` and `last` null.
- `nonfinite` at first non-finite step k: steps ≥ k are not examined. Each tolerance
  is REFUTED if a step before k violates it, otherwise REFUSED. `max` is over steps
  before k (null if k = 0); `last` is null.

A number `v` is printed as a pair of decimal strings `lo ≤ v ≤ hi` with 12 significant
digits, rounded OUTWARD. `0` prints as "0" and "0". Otherwise write `|v| = m·10^e` with
`1 ≤ m < 10`; the lower magnitude is `⌊m·10^11⌋/10^11` and the upper is
`⌈m·10^11⌉/10^11` (an upper magnitude of 10 becomes 1 with e + 1). For v > 0, lo is the
lower magnitude and hi the upper; for v < 0, lo is minus the upper and hi minus the
lower. The string is an optional "-", one digit, ".", exactly eleven digits, "e", and
the exponent as a plain integer ("e0", "e-5", "e3"). An exactly representable value
has lo = hi.

## 7. The cosine

Only P-ENERGY needs it. For rational x and any N ≥ 0,

`|cos x − Σ_{n=0..N} (−1)^n x^{2n}/(2n)!| ≤ x^{2N+2}/(2N+2)!`

(the Lagrange remainder; every derivative of cos is bounded by 1). A decider may use
any rigorous enclosure; this one is enough.

Exactness without computation: if `|θ_k| = |θ_0|` then `cos θ_k = cos θ_0` and `D_k` is
the rational `(J/(2MGL))·(θ'_k² − θ'_0²)`. If `|θ_k| ≠ |θ_0|` then `D_k` is not a
rational (Lindemann–Weierstrass: for distinct algebraic exponents the exponentials are
linearly independent over the algebraic numbers, so `cos θ_k − cos θ_0 − r ≠ 0` for
every rational r). So in that case `|D_k| ≤ 0` is violated, `|D_k| = ε` never happens,
and tightening the enclosure always ends.

Precision ladder: enclose with remainder at most 10^-40, then 10^-80, then 10^-160.
A comparison still undecided at 10^-160 is REFUSED. For printing, tighten until the lo
strings of both ends of the enclosure agree and the hi strings agree. For `max`, tighten
until one step is strictly largest, treating two steps with equal `|θ|` and equal `θ'²`
as equal (the smaller step wins); if distinct steps cannot be separated at 10^-160,
`max` is "REFUSED".

## 8. Calibration, in floating point, before any verdict is read

These are checks of MY READING of the engine's conventions, not verdicts.

- C0: a second model with the engine's energy flag and an angular-momentum sensor must
  produce a trajectory file byte-identical to the uninstrumented one (so watching does
  not change the run).
- C1 (`top`): `ℓ_k` computed in doubles from the formula of section 5 agrees with the
  engine's own subtree angular momentum sensor to 1e-9·|ℓ_0| at every step. A planted
  misreading (angular velocity taken as world-frame) must disagree by more than 1e-3.
- C2 (`pendulum`, `top`): the energy change since step 0 from the formulas of section 5
  agrees with the change in the engine's own energy to 1e-9 of the law's scale.

If C1 or C2 fails for a scene, that scene's laws are not read and the failure is the
finding.

## 9. Two deciders and the planted files

Decider 1 is JavaScript (integers only), written by me. Decider 2 is Python, written
by an agent that is given this file and the file format and nothing of decider 1. A
verdict is published only if both outputs agree field for field on every run.

Planted files, made before either decider is run on a real run:
- RC1 `fall`: the exact `Z_k` rounded to the nearest double, with the time column
  accumulated as the engine does. Expected: F-POS CERTIFIED at 1e-12.
- RC2 `top`: constant spin about the middle axis (every law CERTIFIED at 0), and a copy
  with ω2 multiplied by (1 + 2^-20) at step 700 only. Expected: T-ENERGY REFUTED at
  1e-6 with firstStep 700, CERTIFIED at 1e-4.
- RC3: a NaN at step 5. Expected: `nonfinite`, every tolerance REFUSED.
- RC4: a truncated file. Expected: `malformed`.
- RC5 `pendulum`: a step that returns to (−θ_0, −θ'_0) among copies of the initial
  state. Expected: P-ENERGY CERTIFIED at 0.

## 10. What I expect, written before running

From the textbook, not from a run: the semi-implicit Euler step is first order, so
F-POS should fail at 1 cm within the 2 s horizon at the default timestep (error about
G·h·t/2) while F-VEL holds to rounding; RK4 should hold F-POS to rounding. For the
`top`, I expect the integrators that do not treat the gyroscopic term implicitly to
drift in energy more than the ones that do, and I do not know the sizes. Being wrong
about any of this is a result and will be reported as written here.

## 11. Limits, said first

- One engine, one version, one machine. Bytes from another platform may differ in the
  last bits; the verdicts are about the pinned bytes.
- The tolerances are mine. No engine documentation is quoted as promising them.
- A law holding on every recorded step says nothing between steps.
- The pendulum's phase and the top's attitude are not checked against a closed form;
  only conserved quantities are.
- Decider 2 is independent by procedure (a separate author with no sight of decider
  1), under one operator.
