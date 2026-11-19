# The goal: twelve blocks, the second run

A first run, by two models like you working together for 73 minutes, proposed that the twelve-block colouring is
exactly optimal on the integers at large lengths. Everything it produced is in this folder and you may
read all of it from the start. This run goes after what that result still lacks.

## The setting

Colour each of 1..n red or blue. M(s) is the number of triples (a, a+d, a+2d), d ≥ 1, inside 1..n, of one colour.
V(n) is the least M over all 2ⁿ colourings. f(n) = 117n²/2192 − n/2. Sites and colours are labelled; say so wherever you
quotient by reflection or colour exchange.

The twelve blocks: unit edges B = (28, 34, 62, 99, 158, 274, 390, 449, 486, 514, 520) out of 548. C_n is the colouring
of 1..n that changes colour after the sites ⌊nB_j/548 + ½⌋, red first; at n = 548m it is the exact twelve blocks B_m.

## The question, in three parts, in this order

**1. Every sufficiently good colouring is close to the twelve blocks.** This is the step that turns a search near one
construction into a statement about all colourings, and it is where the first run's finite argument meets an unrefereed
result. The task, as a reviewer of the first run put it: start with an ARBITRARY colouring of 1..n whose count is at most
that of C_n, and prove that everything that separates it from C_n lies inside the stated windows around the eleven
boundaries. Rebuild it from its three inputs: the continuum stability bound, the exact identity on the integers, and the
cost of removing a flip far from every boundary.

What would settle it for a reader who has seen none of this: ONE self-contained document. The statement with every
constant. Each input as a named lemma, with where it comes from and what kind of thing it is (checked by a machine,
proved on paper, taken from the October result). Every finite inequality written so that it can be tested at scale.
Then attack it: look for the weakest step and try to break it. A derivation by a different route from the first run's
is worth more than a second pass along the same one; say which you did.

**2. V(46) = 90.** A small result that stands on its own: it does not depend on the October lower bound at all, and it
would be a new exact value (the published table stops at 45). V(46) ≤ 90 is in hand: C_46 itself has 90, counted. What
is missing is that no colouring of 1..46 has 89 or fewer. The deliverable is a certificate that a program sharing
nothing with your search can check. Describe the certificate's format in a proposal BEFORE you rely on it: the control
room writes its checker from your description alone. Then 47, 48, 49, 50 if they come cheaply: the values 95, 100, 104,
110 are attained (counted), and again only the lower bounds are missing.

**3. Why the answer has this shape.** Take whichever of these has a real idea behind it.
- The first run's exact formula for n ≥ 92,000 is the same statement as V(n + 1096) = V(n) + 117n + 63,568. Is there a
  reversible construction: enlarge an optimal colouring by one period, shrink a larger optimum back, at exactly that
  cost? It would have to carry the number of minimisers too.
- The correction c_r and the number of minimisers agree at the residues r and −r mod 1096, on all 1,096 rows. Reversing
  the sites keeps n, so reflection alone does not explain it. Is there a map between the two classes in the 22 boundary
  variables?
- The formula with the 1,096 corrections gives every one of the 45 known values of V(n), from n = 1. The proof needs
  n ≥ 92,000. Is the formula true for every n, in value? (The number of minimisers is not: 2 at n = 1, where the table
  says 24.) What forces the cutoff, and can it come down? The scales the first run left open are n = 548m with even
  m ≤ 116 or odd m ≤ 121.

Another table or a larger sweep is not a result here.

## What is already known

Finding any of this again is a correct reproduction, not an advance.

**In print.** V(n) ≤ (117/2192)n²(1 + o(1)) by the twelve blocks (Parrilo, Robertson, Saracino 2008), V(n) ≥
(1675/32768)n²(1 + o(1)) (same paper); block colourings give (117/2192)n² + O(n) and nothing with eleven or fewer blocks
does better (Butler, Costello, Graham 2010); a conjecture that every colouring has at least (117/2192)n² + O(n) (Butler,
Graham, Lu 2012); the twelve blocks optimal among antisymmetric colourings with at most twelve blocks (Greenwood, Kariv,
Williams 2023); V(n) exactly for n ≤ 45, the last values by integer programming, and upper bounds 90, 95, 100, 104, 110
for n = 46..50 (OEIS A121385, R. Pratt 2014). Same shape in neighbouring problems: an exact minimum for every n for
Schur triples (Koutschan, Wong 2020); 3-term progressions in ℤ_n with constants depending on n mod 24 (Sjöland 2014).
`inherited/cert-machine/corpus/twelve-blocks/literature-2026-11-19.md` has the search and its limits.

**The October result, not refereed.** δ₃ ≥ 117/2192: no colouring beats the twelve blocks to leading order, by five exact
certificates that two independent programs accept (`inherited/cert-machine/certs/delta3`, the verifier beside them).
It rests on two lemmas written on paper that no machine has checked: the centring identity and E ≥ L.

**The first run** (`inherited/run1`: both tracks' notes, programs and tables, the whole conversation, the claims). Each
claim was read once, by the other model, and found to hold. None is decided.
- For n = 548m with even m ≥ 118 or odd m ≥ 123: V(n) = f(n) + (m mod 2), minimisers classified (2 and 102).
- For every n: f(n) − 281/16 ≤ V(n) ≤ f(n) + 1453/137.
- For every n ≥ 92,000: V(n) = (117n² + c_r)/2192 − n/2, r = n mod 1096, with a table of c_r and of the number of
  minimisers (`inherited/run1/gpt/optimum-residues.json`).
- Its route: a strict margin E ≥ μ²/948 from one certificate strengthened by a rank-one term (947 fails); an exact
  identity 4M = T_n − 3n/2 + (S_e² + S_o²)/2 + n²Q + R_n; a colouring at or below the baseline differs from it in fewer
  than 244 sites; a flip outside the windows of radius 2m costs at least 2m + 1; inside the windows the cost is a positive
  definite quadratic form in 22 integers, enumerated.

**What a judge decided afterwards** (`inherited/cert-machine/certs/twelve-blocks.json`, its README beside the judge):
the finite facts those proofs display, each on a stated finite domain: ten statements and one Lean lemma certified, 19
planted wrong versions refused. It names what it does not decide, and the theorem is the first item. The Lean lemma is
the transfer of the 253 flip coefficients from m to m + 2 for every m; nothing else is in Lean.

**A review of the report** (`inherited/review.md`, by a separate GPT chat). The control room checked its claims:
- Any period of V(n) − f(n) is a multiple of 1,096, and the recurrence above is the periodic formula restated: holds
  (117 and 1,096 are coprime; f(n + 1096) − f(n) = 117n + 63,568 exactly).
- c_r = c_{−r} and equal numbers of minimisers at r and −r: holds on all 1,096 rows of the table.
- The table's formula gives the 45 known values and 90, 95, 100, 104, 110 at n = 46..50: holds. The table's own
  colourings at n = 46..50 were counted: 90, 95, 100, 104, 110.
- Every one of the 1,096 table values is attained at the least n ≥ 92,000 of its class: holds. The control room recounted all
  1,096 witnesses from their bits with its own counter, n = 92,000 to 93,095 (`control/prior/witnesses-all.json`). That is
  V(n) ≤ the table's value at those lengths, and nothing about the other direction.

## What a plain search already finds

- For part 2. A depth-first search that colours 1, 2, …, n in order (site 1 red) and cuts a branch once the triples
  already complete reach the target visits 0.7, 2.3, 6.9, 31 million nodes to prove V(n) at n = 24, 26, 28, 30
  (`control/prior/dfs.log`): about twice as many per extra site. Carried to n = 46 that is of the order of 10¹² nodes:
  hours in a compiled language on this machine, not days. So the lower bound is within reach of a plain search; what a
  plain search does not give is a certificate someone else can check.
- From the first run: single-flip local search (tabu from B_m, annealing from random colourings) finds nothing below B_m
  at m ≤ 4, and finds B_2 itself from random starts.

## What would be new

In rising order: the localisation written so that it can be refereed, with its weakest step found; a break in it;
V(46) = 90 with a certificate; the same at 47 to 50; an explanation of the r and −r symmetry; a reversible construction
for the period; the cutoff 92,000 brought down, or the formula proved for every n; the scales m < 118 settled.

## Material in this folder

- `inherited/run1/`: the first run, complete. `gpt/` and `claude/` are the two tracks' folders as they left them;
  `CHAT.md` is their conversation; `claims/` the cards; `GOAL.md` and `twelve-block-session.md` what they were given.
- `inherited/cert-machine/`: public files of the cert-machine repository at the commit in `COMMIT.txt`, paths kept: the
  delta-three certificates, definitions and verifier (`node instruments/delta3/verify.js` runs from that folder); the
  judge of the first run, its record, the Lean lemma (`instruments/twelve-blocks`, `certs/twelve-blocks.json`); the
  pre-registration; the literature check; who read what (`corpus/twelve-blocks`).
- `inherited/review.md`: the review. `inherited/oeis-b121385.txt`: the 45 known values.
- `control/prior/`: what the control room computed before this run. `control/decider-ap3.py`: its counter.
The report of the first run is public: https://carlostoledo.co/reports/twelve-blocks.html

## If you have a number or an object

A colouring and its count can be checked without a question. Put it in a JSON file in your folder:

    {"items": [{"name": "a colouring of 1..46", "n": 46, "coloring": {"string": "RRB…"}, "count": 90}]}

`coloring` is one of `{"string": "RRBB…"}` (n letters), `{"runs": [...], "first": "R"}`, `{"red": [sites]}`, or
`{"base": m, "flip": [sites]}` for B_m with those sites flipped; with n = 548m you may also state `"delta"` (M − M(B_m))
or `"beats"`. A lower bound is not a colouring: for part 2, propose the certificate's format first.
