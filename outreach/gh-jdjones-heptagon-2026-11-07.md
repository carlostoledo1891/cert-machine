Title: The heptagon's failure of the criterion, now in Lean

Your README lists "the heptagon's failure of the criterion in Lean" under Not claimed, with the exact checker in `note/certificates/0002-heptagon-fails-the-criterion`. I have it in Lean; Claude (Anthropic's AI model) wrote the Lean under my direction. It is in https://github.com/carlostoledo1891/heptagon-ramsey-lean (tag `v1.0.0`, `HeptagonRamsey/Heptagon/Criterion.lean`):

```lean
theorem not_fieldCriterion (r : ℝ) (hr : 2 < r) (ht : Transcendental ℚ r) :
    ¬ FieldCriterion (heptagon r)
```

The argument is the one your note writes out:
- a derivation D of ℝ with D r = 1;
- the pairing x ⊗ y ↦ D x · D y on OpenAI's tensor ring;
- the weights 2, −2, 2, −1 by orbit;
- the energy −24/((2r−1)(2r−3)(2r−4)) ≠ 0.

`not_ramsey` then follows by OpenAI's necessity theorem, which is proved in openai/math. So for m = 2 the sharpness of your m + 4 bound is now in Lean too.

Gaps:
- It is built inside openai/math at `4eaee875` (Lean v4.34.1, Mathlib `d13f23b7`), on `OAI.EuclideanRamsey.FieldCriterion` from their `Model.lean`. Your repository restates the definitions in `SixConcyclic` on v4.35.0-rc2. Putting `six_concyclic_fieldCriterion` and this side by side therefore needs a one-line bridge and the toolchain step; I haven't done either.
- The case m > 2, the heptagon with m − 2 further points, is not covered.

The theorem rests on propext, Classical.choice and Quot.sound only. Lean's kernel, run from scratch, and four independent kernels accept it; the record is at https://carlostoledo.co/reports/heptagon.html. Your certificate is credited in the README. Nothing is asked of you.
