# Terra verification invitations (STAGED 2026-09-02, NOT SENT)

Status: **staged**. Outward sends happen on the operator's word only.
Same model as outreach/ember-verification-invites.md: a verification
invitation with an adversarial ask, converting to co-authorship on the
journal version only if engagement makes that natural.

NOTE: the KAUST letter (outreach/kaust-mfg-lab.md, staged 2026-08-28,
targeting Ricardo de Lima Ribeiro) predates the terra release and pitches
the LAB. Either send it updated with one paragraph on the released atlas,
or fold that recipient into this file's list — operator's choice; do not
send both.

Still needed from the operator:
1. recipients and order (recommendation below),
2. three sentences of your own at the top,
3. a yes/no on the closing ask.

## Recipients, ranked by fit

1. **Marco Cirant** (Padova) — the authority on non-uniqueness and
   non-monotone MFG; the mechanism note already fences against
   Cesaroni–Cirant (arXiv:1705.10741), and he is the natural referee for
   the peak-count claim.
2. **Annalisa Cesaroni** (Padova) — co-author of the fenced paper;
   same reasons.
3. **KAUST MFG group** (Ribeiro; Diogo Gomes' group) — the staged lab
   letter's target; the strongest numerical-MFG group, natural verifiers
   of the census and regime map.

## The letter (one body, personalized opener per recipient)

> [OPERATOR: three sentences — who you are.]
>
> I am writing because of your work on [PERSONALIZE: non-uniqueness and
> concentration in MFG / stationary MFG with congestion / numerical
> methods for MFG].
>
> I have released a set of computer-assisted results that may interest
> you: certified equilibria of a discounted congestion-averse mean-field
> game on the torus whose EXACT peak count strictly exceeds the
> potential's well count — a single-well cost landscape provably carrying
> two-peak, and in one instance three-peak, equilibrium densities. The
> certificates are validated-numerics enclosures (radii-polynomial
> argument, two independent implementations agreeing on the certified
> radius; peak counts derived from certified region signs only), and the
> harmonic crossover behind the mechanism, sigma* = 1/(8 pi^2), is
> decided in exact rational arithmetic and is independent of the
> discount. To my knowledge these are the first validated-numerics
> equilibrium enclosures for a mean-field game — I would genuinely like
> to know if you are aware of prior art I have missed.
>
> The atlas is https://carlostoledo.co/reports/terra.html (its companion,
> the base single-harmonic instance, is /reports/mfg-congest.html);
> every certificate re-runs from the repository (archived at DOI
> 10.5281/zenodo.22225860), e.g.:
>
>     git clone https://github.com/carlostoledo1891/cert-machine
>     python3 instruments/mfgcap/run_recert.py t1
>     node labs/mfg/census.js --N 5 --c -12
>
> My ask is adversarial: try to break it — the enclosures, the peak
> counts, or the priority claims. Companion results you may want to
> attack first: certified multiplicity (three distinct exact solutions in
> pairwise disjoint balls at six couplings, where Lasry–Lions
> monotonicity is silent) and a Krawczyk exhaustion census proving the
> truncated system has EXACTLY three solutions in an explicit box.
>
> [OPERATOR yes/no on this closing:] If the verification interests you
> beyond a look, I would welcome discussing a joint journal version.

## Notes

- Cirant first is the recommendation; his reading either kills the
  peak-count framing early (cheap) or is the strongest possible
  endorsement of it.
- The claims in the letter are exactly the released page's claims with
  their fences; nothing is added.
