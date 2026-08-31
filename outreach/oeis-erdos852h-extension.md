# OEIS extension pack — runs of pairwise-distinct consecutive prime gaps

STAGED, NOT SENT. Submitting is the operator's call.

## What is new

A078515 holds 27 terms, A079889 27, A079007 31 (n = 0..30),
all ending at the prime 196948778371. An exhaustive scan to 5e+11 (4042 s)
reproduced every one of those terms and found 1 record run(s) past them.

Because the scan was exhaustive to 5e+11, the claim is not merely that these runs exist:
no longer record run exists below that bound.

### run length 31 — opening prime 263552821783

| field | value |
| --- | --- |
| A079007(31) | 263552821783 |
| A078515 next term (index n) | 10435962861 |
| A079889 next term (prime) | 263552821783 |
| run spans | 263552821783 .. 263552823109 |
| the 31 gaps | 76, 8, 34, 36, 26, 106, 38, 82, 18, 54, 50, 16, 62, 70, 14, 48, 42, 64, 6, 104, 24, 12, 66, 22, 30, 96, 2, 10, 74, 4, 32 |
| next gap | 4 — already present, so the run is exactly 31 |

## How to check it in a minute

```
node instruments/erdos852h/verify-record.js 263552821783 31
```

A separate implementation from the scan that found it: deterministic Miller-Rabin in
BigInt, next-prime by stepping, a set for distinctness. It certifies EXISTENCE — this
prime opens this many pairwise-distinct gaps, and the next gap repeats one of them, so
the run is exactly that long.

## The caveat that belongs in the submission

Minimality — that this is the SMALLEST index achieving the length — rests on the
exhaustive scan, not on the independent verifier. Evidence for the scan: it reproduced
all 27 published A078515 indices and all 27 A079889 start primes exactly before
extending them.

## Full record table

| n (index) | opening prime | run length | in OEIS |
| --- | --- | --- | --- |
| 1 | 2 | 2 | yes |
| 7 | 17 | 3 | yes |
| 23 | 83 | 4 | yes |
| 30 | 113 | 5 | yes |
| 94 | 491 | 6 | yes |
| 219 | 1367 | 7 | yes |
| 279 | 1801 | 8 | yes |
| 773 | 5869 | 9 | yes |
| 1856 | 15919 | 10 | yes |
| 3724 | 34883 | 11 | yes |
| 6999 | 70639 | 12 | yes |
| 7000 | 70657 | 13 | yes |
| 19205 | 214867 | 15 | yes |
| 184163 | 2515871 | 16 | yes |
| 280103 | 3952733 | 17 | yes |
| 849876 | 13010143 | 18 | yes |
| 1870722 | 30220163 | 19 | yes |
| 3570761 | 60155567 | 20 | yes |
| 4114341 | 69931991 | 21 | yes |
| 11271072 | 203674907 | 22 | yes |
| 55282774 | 1092101119 | 23 | yes |
| 68256040 | 1363592621 | 24 | yes |
| 68256041 | 1363592677 | 25 | yes |
| 104011359 | 2124140323 | 26 | yes |
| 1009322491 | 23024158649 | 27 | yes |
| 1311699253 | 30282104173 | 29 | yes |
| 7889803997 | 196948778371 | 30 | yes |
| 10435962861 | 263552821783 | 31 | **new** |
