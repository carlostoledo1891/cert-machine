# erdos510 comment — POSTED by the operator, 2026-08-26; awaiting moderation

STATUS (2026-08-26, operator's word): the comment below was posted to the
#510 page and sits in the site's moderation queue. Do not cite it as public
until a fetch of the page shows it; the sweep (tools/sweep-claims.js) now
watches this thread and shouts when the table appears. When it does,
snapshot the page as evidence bytes beside this note.

Original prep note follows.

Operator posts; nothing in this repo auto-sends. Target:
https://www.erdosproblems.com/510 (Chowla's cosine problem; comments on the
problem page). POST ORDER: after the public repo is live — unlike the #852
comment, a global lower bound on a cosine sum cannot be re-proved in five
stdlib lines, so this comment cites the detached certificate and battery
instead of carrying its whole proof inline. Fix the repository URL below if
the GitHub handle differs from carlostoledo1891/cert-machine.

Every number below is read from certs/lambda-table.json; bounds are the exact
dyadic enclosure endpoints CEILED at 12 decimals via exact rationals (an upper
bound rounds UP, never to nearest); `make test` re-proves the table (lambda battery:
Mercer's proved closed forms recomputed, the n=4 box reproduced to the
per-stage kill split, four red controls).

---- PASTE BELOW THIS LINE ----

Some certified finite-$n$ data for this problem, in case it is useful to have exact values on record.

Write $\lambda(n) = -\sup_A \min_\theta \sum_{a\in A}\cos(a\theta)$, the supremum over sets of $n$ distinct positive integers (the notation of Mercer, *INTEGERS* 19 (2019), #A4, who proved $\lambda(2)=9/8$ and $\lambda(3)=\frac{17+7\sqrt 7}{27}\approx 1.315565$). This problem asks whether $\lambda(N) \gg N^{1/2}$.

I have computed certified upper bounds on $\lambda(n)$ for $n = 4,\dots,17$ by exhaustive sweeps over boxes $A \subset \{1,\dots,M\}$: every set in the box is decided exactly (integer-arithmetic kills at roots of unity, then exact-rational Chebyshev/Sturm certification of survivors; enclosure endpoints are exact dyadic rationals; a per-box conservation identity accounts for every set). Two caveats stated plainly: $\lambda(n)$ is an infimum over **all** $n$-sets, so each row is a certified **upper bound** witnessed by an explicit set, exact as an optimum only within its stated box; and the printed values are the certificate's exact dyadic enclosure endpoints **rounded up** at the 12th decimal (an upper bound may only ever be rounded up — the full exact endpoints are in the certificate).

| $n$ | $\lambda(n)\le$ | witness $A$ | box $M$ | sets decided |
|---|---|---|---|---|
| 4 | 1.519557881643 | 1,2,3,4 | 20 | 4,845 |
| 5 | 1.627460664467 | 1,2,4,5,6 | 60 | 5,461,512 |
| 6 | 1.591832329324 | 1,2,4,6,7,8 | 50 | 15,890,700 |
| 7 | 1.893455418993 | 1,2,3,5,6,7,8 | 30 | 2,035,800 |
| 8 | 1.956787693633 | 2,3,4,5,7,8,10,12 | 30 | 5,852,925 |
| 9 | 2.069282587092 | 2,3,4,5,7,9,10,12,14 | 30 | 14,307,150 |
| 10 | 2.057447274609 | 1,2,3,5,6,7,8,10,11,13 | 30 | 30,045,015 |
| 11 | 2.102381279243 | 1,2,3,4,5,6,8,9,10,11,14 | 30 | 54,627,300 |
| 12 | 2.213895922406 | 1,2,3,4,5,6,7,8,9,10,11,15 | 30 | 86,493,225 |
| 13 | 2.318232650153 | 1,2,3,4,5,6,7,9,10,11,12,13,16 | 30 | 119,759,850 |
| 14 | 2.320690691855 | 1,3,4,5,9,10,12,13,14,17,22,23,26,27 | 30 | 145,422,675 |
| 15 | 2.418912126896 | 1,2,3,4,6,7,8,9,10,11,12,14,18,20,21 | 30 | 155,117,520 |
| 16 | 2.454832753028 | 1,2,3,4,5,6,7,8,10,11,13,14,15,16,17,21 | 30 | 145,422,675 |
| 17 | 2.564897120546 | 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,19,22 | 30 | 119,759,850 |

Remarks.

- For $n = 4, 5, 6$ the box optima coincide with the conjectured extremal sets listed in Mercer (2019); the sweeps add certified exhaustion over the stated boxes. I am not aware of a published table beyond $n = 6$.
- The bounds are not monotone in $n$ (the $n=6$ witness dips less than the $n=5$ one); nothing orders rows at different $n$, since these are upper bounds on an infimum.
- The ratios $\lambda(n)/\sqrt n$ along this table fall from $0.760$ at $n=4$ to $0.622$ at $n=17$ — upper bounds on $\lambda(n)/\sqrt n$, consistent with the $\sqrt N$ ceiling from the Sidon $B-B$ construction and with slower growth.
- A caution for reading structure off shallow boxes: at $M=25$ the best $n=14$ set found was the near-interval $\{1,2,3,4,5,6,8,9,10,12,13,14,15,18\}$ ($\lambda(14)\le 2.3664$); widening to $M=30$ produced the structurally different witness above and improved the bound to $2.3207$. The $n = 13, 15, 16, 17$ optima were confirmed unchanged at $M=30$.

The detached certificate (every row with its enclosure, witness, box and conservation identity) is `certs/lambda-table.json` in https://github.com/carlostoledo1891/cert-machine, re-proved by the repository's test battery on every run; the same repository holds the instrument (exact rational arithmetic end to end — floating point is used only to prune, never to admit).

---- END PASTE ----
