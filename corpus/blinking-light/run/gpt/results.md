# Entropy production from a blinking lamp

For the two Poisson snapshot correlations C1=3/10 and C2=2/25, the reviewed bounds on the infimum are

```
903439/2500000 = 0.3613756 <= g <= 0.377128261270.
```

At two readings per second the corresponding bounds on the entropy production rate are 0.7227512 and 0.754256522540 in k_B/s. The left endpoint applies to every finite stationary network. The upper bound comes from Claude's irreducible 156-state network. The exact infimum and the optimality of rings remain open.

## Lower bound

Claude's latest reviewed [certificate](../claude/cert333.json) gives the affine lower bound with coefficients (66092/3125, -1868729/50000, -299349/100000) multiplying (C1, C2, 1). At (3/10, 2/25) this gives 903439/2500000. I checked the pointwise inequalities for both lamp signs and the local matrix over the entire domain using exact rational arithmetic.

| Claude certificate | Verified lower bound | Knot intervals | Covering rectangles in the independent check |
| --- | ---: | ---: | ---: |
| cert211.json | 0.3392862 | 24 | 370 |
| cert211b.json | 0.3532012 | 45 | 2010 |
| cert222.json | 0.3587562 | 33 | 1205 |
| cert322.json | 0.3606284 | 33 | 902 |
| cert333.json | 0.3613756 | 33 | 830 |

Reproduce the strongest bound from this folder with

```sh
python3 -B review_local_certificate.py ../claude/cert333.json
```

The SHA-256 of the reviewed certificate is `7c2d1f6bda5991149b3486f6689c7e9845271b5bce6625a33990194d05ee3610`.

## Earlier lower bound

The proof in **potential-bound.md** reduces the problem to two inequalities for rational piecewise linear functions. The first is a pointwise quadratic inequality. The second controls the stationary current on every possible edge, regardless of the number of hidden states. Reproduce the finite part with

```sh
python3 -B verify_potential.py potential-refined.json 147/1000
```

The Claude track independently re-derived the generator argument and checked the two inequalities using a separate exact-rational subdivision covering 268,375 boxes. Its verifier is in `../claude/review_g16.py`.

**joint-bound.md** also gives a bound with no computational step. At the target it yields (239+166 sqrt(2))/2009, approximately 0.235819.

## New upper bound from Claude

A driven 154-state ring is connected to a reversible two-state lamp by a single bridge. Stationarity forces zero net current through that bridge. The run checker isolates a choice of the two free rates that gives both observed moments exactly. It encloses this network's entropy production in [0.754256522539930041624545139049, 0.754256522539930041624545139050] k_B/s. [Checker verdict](../control/verdict-MIX156.json)

Extrapolating the floating-point mixtures with 80 and 160 ring states under a correction proportional to the inverse square of the state count gives 0.3768700. The exact infimum remains open. Claude also tested candidate lower bounds numerically. In one saved candidate with objective 0.3602386, the pointwise inequality D1 has slack below -0.034 at an interior point of its domain. The exact arithmetic check is in [review_t222.py](review_t222.py). Claude’s [locality theorem](../claude/locality.md) shows how to verify a proposed lower-bound certificate over two continuous variables. I checked its edge subdivision, treatment of the subdivision boundaries, and limiting inequality.

## Earlier fully rational upper bound

The Claude track found that mixing a driven ring with a reversible two-state lamp sharply reduced the required dissipation. The 84-state construction in **rational-mixture-84.json** refines that idea using two reversible two-state lamps. Three positive rational component weights match the two target correlations exactly. A reversible joining kernel connects the components, and its effect on the correlations cancels an explicit rescaling. **rational-mixture.md** contains the construction and commands for exact verification. The general checker independently established both target equalities by rational linear algebra and enclosed the entropy in [0.755752463490635672405365985561, 0.755752463490635672405365985562] k_B/s. Its verdict is in **rational-mixture-84-check.json**.

## Earlier ring-only upper bound

The asymmetric seed is the Claude track's optimized 40-state ring in `../claude/ringbig-12_16_24_32_40.json`. The interpolated ring in **reordered-ring-400.json** was fitted here. Its stationary masses, gap affinities and one net current were varied in a smooth finite-dimensional family. The numerical optimization supplied a starting point. The certificate fixes all but two rates to rationals and isolates an exact solution for the two remaining rates.

The independent ring-specific verifier below uses fixed-point intervals rounded outwards with integer arithmetic. It checks both correlations, uniqueness in the rate box, and an upper bound on entropy using a rational logarithm series.

```sh
python3 -B verify_cycle.py reordered-ring-400.json
```

The run's general network checker also certified this file. Its outward-rounded enclosure for the ring is [0.886283814026519962685516386155, 0.886283814026519962685516398133] k_B/s. The machine-readable verdict is in **reordered-ring-400-check.json**. Reproduce it with

```sh
python3 -B ../inherited/checker/lamp-v2.py reordered-ring-400.json
```

The files **smooth_ring.py**, **fit_cycle.py**, and **remap_ring.py** produce the floating-point seed, fit two free rates, and choose the elimination order used in the final network. Only the two checkers establish the rigorous bounds on its moments and entropy.
