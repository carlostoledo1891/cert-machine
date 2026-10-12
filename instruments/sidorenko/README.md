# instruments/sidorenko — a measurement pilot for an explicit Sidorenko counterexample kernel

H is the incidence graph of OpenAI's 22 triples on 13 points (35 vertices, 66 edges; openai/math family 161). The
preprint proves a host exists but does not give one. This instrument measures how small the margin

    margin(W) = log t(H,W) - 66 log p(W),   t(H,W) = E_{x in [N]^13} prod_T E_y prod_{i in T} W[x_i, y],   p = E W

can be made on explicit N x N kernels W >= 0 at a fixed distance from constant. A negative margin would be a
counterexample kernel. Pre-registration: `corpus/sidorenko/preregistration.json`.

**Where H comes from.** `FACES` in `pilot.py` is the `faces` table of `lean/ComparatorChallenges/SidorenkoCounterexample.lean`
(sha256 `489688f5…87de9`) and Table `tab:complex` of the preprint's `complex.tex` (sha256 `b7023c77…bbe8a`), both at
openai/math `fd4aeeb2`. `battery.py --source CLONE` re-reads both as text and checks the hashes.

**How t is computed.** The 13 point variables are summed by bucket elimination along an elimination order from an exact
subset DP. The widest pairwise contraction touches 6 point indices and keeps 5, so one evaluation costs about 6 N^6
multiply-adds and N^5 memory.

**Float screen, exact certify.**
- *Search.* W = sigmoid(Z), U = W / mean W, margin = log t(H,U). Adam with annealing noise and random restarts
  (Gaussian, block and low-rank starts). Each cell holds delta = rms(U-1) fixed through a penalty that tightens over
  each restart. Without that constraint the minimum is the constant kernel's trivial 0. It runs on torch (CUDA when
  present), or on numpy float64 with a hand-written reverse pass.
- *Certificate.* Each cell's best kernel is rounded to integers A / Q, and S = sum_x prod_T F(x_T) is computed modulo
  primes. The primes are small enough that every float64 contraction stays below 2^53, so each residue is exact. The
  residues are recombined by the CRT under a proven bound on S and checked against one extra prime. The decision is
  then `S N^53 M^44 < (sum A)^66`, in integers only.
- *Floats never decide.* A float margin that comes out negative while the exact margin does not is a slip.

```
python3 battery.py                         # 25 checks + 7 red controls (28 + 7 with torch); ~15 s
python3 pilot.py time --n 8,12,16          # one forward+backward per N, and the exact check's time
python3 pilot.py search --prereg ../../corpus/sidorenko/preregistration.json --budget-hours H --out DIR
python3 pilot.py certify DIR [--backend torch]   # decide every saved kernel again on this CPU
```

The pod: `tools/runpod-sidorenko.sh` (credential-free; env `AUDIT_SHA`, `BUDGET_HOURS`).
