# KAUST MFG group — LAB v0 delivery letter (STAGED, NOT SENT)

Status: **staged**. Outward sends happen on the operator's word only.
Paired with: `reports/mfg-observatory.html` (live), `labs/mfg/` (public).
Target reader, by name: **Ricardo de Lima Ribeiro**, KAUST MFG group.
Written 2026-08-28. Supersedes the older "KAUST letter" item — the objection
recorded against that draft ("reword *live in the browser*") is now moot: it is
literally live in the browser.

Still needed from the operator before this can go out:
1. the recipient (Ribeiro alone, or Ribeiro + one more),
2. three sentences of your own at the top — who you are, in your words,
3. a yes/no on the closing ask as written.

---

**Subject:** the multiplicity result, as a map — and a certifier you can run

Dear Dr de Lima Ribeiro,

[OPERATOR: three sentences here — who you are and why you are writing.]

Two years ago the interesting statement in the non-monotone regime was that
multiplicity happens *somewhere*. I have turned that into a map. For the
stationary quadratic MFG on the torus with F(m) = c·m and V = A cos 2πx, the
coupling–potential plane is partitioned into cells, and each cell is decided
**uniformly over the whole cell** — not sampled at its centre:

- where two equilibria are enclosed in provably disjoint balls, that is a proof
  that uniqueness fails on a set of positive measure, cell by cell, each with an
  exact witness;
- where the cell sits in c ≥ 0, Lasry–Lions gives global uniqueness (yours, not
  mine — cited as such) and what I add is the enclosure of that solution,
  uniform over the cell;
- everywhere else the verdict is UNDECIDED with the reason kept verbatim,
  including the seam along c* = −σ²(2π)² where no enclosure *can* exist and the
  certifier is required to refuse.

    https://carlostoledo.co/reports/mfg-observatory.html

The technical step that made a map possible rather than a hairline: with a fixed
candidate the residual grows linearly in the cell width and only cells narrower
than about 0.004 in c close on the herding branch. Carrying the tangent
(DΦ ẋ = −∂_sΦ, from the Jacobian already factored for the approximate inverse)
makes the first-order term cancel, the bound becomes a mean-value form, and
cells sixteen times wider close. The battery freezes the predictor and requires
the same cell to fail, so that claim is checked rather than asserted.

Three ways to use it without me:

- the paste box on that page runs the certifier in your tab — give it a
  rectangle of parameters, get the verdict and both radii;
- `mfg-certify.js` beside the page is the same certifier as one file with **no
  dependencies** — `node mfg-certify.js '{"c":[-16.03,-15.97],"A":[0.288,0.313]}'`;
- `labs/mfg/` in the repository is the certifier, the sweep and the battery,
  MIT, with the scope stated in the README.

There is also a refutation mode, which is the direction a solver cannot give
you: paste a claimed equilibrium and the accuracy you claim for it, and if one
equation's residual exceeds what the whole ball of that radius could move it,
then no exact solution lies that close — and the witness is that one equation,
its residual and its row bound, three numbers you can check by hand.

Full disclosure on provenance: the kernel this is built on was lifted
file-level from the published mfg-lab tree and is recorded with its sha256; my
box certifier is a second implementation of the same radii-polynomial argument,
and the build refuses unless the two agree bit-for-bit at zero cell width. The
radii-polynomial framework is van den Berg–Lessard, unchanged. The mathematics
is your group's line and Lasry–Lions/Cirant's; the certification layer, and any
error in it, is mine. Published, not peer-reviewed, not independently rerun —
which is precisely why I am writing to someone who could rerun it.

**The ask, and it is small: send me the one claim that costs your group the most
time to defend.** A uniqueness regime, a numerical equilibrium, a bound a
referee keeps poking. If it is decidable I will certify it as the
demonstration, with the witness, and the answer is yours whether or not it is
the one you wanted. If it turns out not to be decidable by these instruments, I
will tell you that instead, and why.

Carlos Toledo
carlostoledo.co · github.com/carlostoledo1891/cert-machine
