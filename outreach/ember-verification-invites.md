# Ember verification invitations (STAGED 2026-09-02, NOT SENT)

Status: **staged**. Outward sends happen on the operator's word only.
Purpose: convert "not independently rerun" into either a refutation (which
we want to know) or a confirmation with a natural collaborator. The model
is a VERIFICATION INVITATION, not a cold co-authorship offer — deep
engagement converts to co-authorship on the journal version if both sides
want it.

Still needed from the operator before any of these can go out:
1. which recipients, and in what order (recommendation below),
2. three sentences of your own at the top — who you are, in your words,
3. a yes/no on the closing ask as written.

## Recipients, ranked by fit

1. **Lawford Hatcher** (arXiv:2405.19508, hot spots for non-convex
   polygons) — working exactly on polygon hot spots right now; the most
   natural verifier and, if engaged, collaborator for the census (P3).
2. **Chris Judge & Sugata Mondal** (the Annals triangle theorem) — the
   corner-expansion analysis here is the computational twin of theirs;
   the vertex-A corollary is the direct analogue of their
   extrema-at-vertices refinement.
3. **Krzysztof Burdzy** (lip domains; the counterexample with Werner) —
   the probabilistic side's authority; a skeptical read from him is worth
   the most.
4. **Jaume de Dios Pont** (arXiv:2412.06344, convex sets can have
   interior hot spots) — thinks about exactly the convex frontier this
   result sits inside.
5. **Deng–Gui–Jiang–Yang–Yao** (arXiv:2604.19003, symmetric quadrangles)
   — the group closest to the quadrilateral edge; also the race.

## The letter (one body, personalized opener per recipient)

> [OPERATOR: three sentences — who you are.]
>
> I am writing because of your work on the hot spots conjecture
> [PERSONALIZE: for polygons / for triangles / on lip domains / on the
> high-dimensional counterexamples / on symmetric quadrangles].
>
> I have a certified computation that may interest you: for the convex
> trapezoid with vertices (0,0), (1,0), (17/20, 9/10), (1/4, 9/10) —
> no symmetry axis, side slopes 6 and 18/5, so not a lip domain — the
> second Neumann eigenfunction attains its extrema on the boundary only,
> and the maximum is attained at vertex A and only there. The second
> Neumann eigenvalue is simple, enclosed in [12.020976137, 12.022398349].
> To my knowledge this is the first certified hot-spots domain outside
> every analytically proven class; the report and the fence list are at
> https://carlostoledo.co/reports/ember.html, the draft write-up and all
> machine-checked records are in the repository (archived at DOI
> 10.5281/zenodo.22225860), and the entire certificate chain re-runs
> deterministically in about two minutes with one command:
>
>     git clone https://github.com/carlostoledo1891/cert-machine
>     node tools/run-ember-chain.js
>
> The chain's only literature inputs are two quoted lemmas of
> You–Xie–Liu (arXiv:1808.08148); everything else — spectrum
> localization, boundary defect, eigenfunction enclosure, an interior
> partition decided in exact rational arithmetic, and corner expansions
> with coefficients certified at two independent annuli — re-derives
> from scratch, and the battery's planted forgeries must fire.
>
> My ask is adversarial: try to break it, or name the weakest link and
> I will strengthen it. One open question you may find interesting: the
> minimum sits within current enclosure widths of vertex C, and whether
> the cold spot is at the vertex or strictly inside the top edge is
> undecided — an off-vertex answer would contrast with the triangle
> behaviour your [PERSONALIZE] established.
>
> [OPERATOR yes/no on this closing:] If the verification interests you
> beyond a look, I would welcome discussing a joint journal version.

## Notes

- Send at most two at once; Hatcher first is the recommendation.
- The race consideration cuts both ways with recipient 5: they are the
  most likely to be scooped-or-scooping on quadrangles. The DOI stamp
  and the public release already protect priority; sharing now costs
  little and may prevent duplicated work.
- Every claim in the letter is on the released page with its fences; the
  letter adds nothing the site does not already say.
