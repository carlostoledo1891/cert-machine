# certified-mathbench

**Seven construction families, each decided exactly. Reward 1 means a certificate exists.**

The model is asked for an *object* — a Golomb ruler, a cap set, a binary code, a
Ramsey witness, a sum-difference entropy law, a kissing configuration, a bilinear
algorithm over F2 — at one of 46 rungs that run from textbook to the published
record and, in five families, one rung past it. The grader decides the object's
defining property in integer, exact rational or rigorous-interval arithmetic.

There is no answer key, no judge model and no tolerance anywhere in the scoring.
A reward of 1 is a theorem about the returned object; a reward of 0 says which of
three things happened — the certificate failed, the object was the wrong shape, or
no object came back — and never confuses them.

```bash
pip install certified-mathbench
python -m certified_mathbench.cli gate          # the forgery battery: 28 green, 20 red, ~2 s
python -m certified_mathbench.cli baseline      # the textbook baseline on every rung, no API key
python -m certified_mathbench.cli tasks 5 --prompts
```

## The ladder

| family | the object | rungs | beyond the record |
|---|---|---|---|
| `golomb` | n marks, all pairwise differences distinct, length ≤ L | n = 6, 8, 10, 11, 12, 13 at the optimal lengths | — (all optimal) |
| `capset` | k points of F₃ⁿ with no three on a line | (3,9) (4,20) (5,45) (6,112) (7,236) (7,237) | 237 in dimension 7 |
| `code` | a binary (n, M, d) code | (7,16,3) (8,20,3) (10,72,3) (12,144,4) (16,256,6) (10,73,3) | 73 words, length 10, distance 3 |
| `ramsey` | a graph with no K_s and no independent t-set on n vertices | R(3,4)>8 … R(4,6)>36 | R(4,6) > 36 |
| `sumdiff3b` | a law on Z² with H(X−Y) ≥ c·max(H(X), H(Y), H(X+Y)) | c = 1.6 … 1.77898884 (the record), 1.7789889 | c = 1.7789889 |
| `kissing` | k equal-norm integer vectors, pairwise ≥ 60°, span ≤ n | K(3..8) = 12, 24, 40, 72, 126, 240; 41 in dimension 5 | 41 in dimension 5 |
| `polymulF2` | a rank-R bilinear algorithm for n-term polynomial products over F2 | (2,3) (3,6) (4,9) (5,13) (6,17) (7,22) | — (the published ranks) |

A certified object on a *beyond the record* rung would be a new result. It is
**not** announced from a reward: the certificate is re-decided by a second,
independent implementation first, and only then does the page say so.

## What it scores, before you spend anything

The textbook baseline of each family (a greedy ruler, a lexicographic cap, a
lexicode, a quadratic-residue circulant, the uniform law on {0,1,2}², the Dₙ roots,
schoolbook multiplication) is decided like any proposal. It certifies **6 of 46**
rungs with no model and no key; those rungs measure recall, not search.

The v0 run (one sample per rung, max 24,000 output tokens, pre-registered before
the first call, every row in the public ledger):

| model | certified / graded | out of tokens before an object |
|---|---:|---:|
| claude-haiku-4-5 | 5 / 46 | 0 |
| claude-sonnet-5 | 18 / 21 | 25 |
| claude-opus-5 | 21 / 23 | 23 |

No beyond-the-record rung was certified. Read the last column: at this cap the
stronger models mostly ran out of room before returning an object, so v0 measured
finishing more than correctness. The page, with every number recomputed from the
ledger at build: https://carlostoledo.co/reports/mathbench.html

## The contract

- `reward` — 1.0 exactly when the returned object is CERTIFIED at its rung. This is what trains.
- `refuted` — an object of the right shape whose certificate fails.
- `rejected` — an object parsed but not of the rung's shape (too few vectors, the wrong length).
- `malformed` — no object the family's parser accepts. A reply that cannot be read is never a wrong one.

The reply format is in each prompt (a JSON list or object, no prose); the parser
takes the last JSON value in the reply and refuses floats and wrong shapes rather
than guessing.

## The controls, run before any prompt is served

Every rung with a witness on record carries a **green control** that must certify
(the optimal rulers, the proved caps, the Hamming and extended codes, the Paley
graphs, the record entropy law, the Dₙ and E₈ roots, Karatsuba) and **red
controls** forged from a witness by the smallest change that breaks it — a
repeated ruler difference, a completed line, two codewords at distance 2, one
circulant distance too many, a law with ratio exactly 1, a duplicated vector, one
flipped coefficient — that must refute. `load_environment` runs this gate first and
raises rather than serve a prompt if any control fails.

## Where the grader lives

The seven families are `instruments/mathbench/families.py` of
[cert-machine](https://github.com/carlostoledo1891/cert-machine) — the same file
its battery, its eval harness and its report read. The wheel carries a
byte-identical copy; a source tree reads the repository's; both are pinned by
sha256 and re-hashed at every build of the site. A reward here and a row of
`certs/mathbench-ledger.jsonl` are the same decision by the same code.

Every decided claim of that repository can be re-run in one line:
https://carlostoledo.co/reports/rerun.html

## License

MIT. Carlos Toledo, 2026.
