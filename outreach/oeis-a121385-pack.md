# OEIS pack — A121385, fifty new terms (a(46)..a(95))

STATUS (2026-11-19): READY TO PASTE once the record is public. Nothing was sent. The send is the operator's, by hand,
under his own OEIS account. Before pasting, look at https://oeis.org/A121385 and its history once more: if someone has
extended it since 2026-11-19, the edit below must be rewritten around theirs.

What this is: an EDIT of an existing sequence (Edit → "Extend the sequence"), not a new sequence. It adds terms, one
comment, links and an extension line. A121386 (the number of minimising colourings) is NOT extended: this work proves
values, not counts, except at n = 548.

Every term below is decided in this repository's record `certs/twelve-blocks-exact.json` (statement U1): a lower-bound
certificate checked in exact arithmetic by a checker that shares no code with the search, and a colouring that attains it.

---

## The edit

DATA (append after the existing 86; the sequence then runs a(1)..a(95))

    90, 95, 100, 104, 110, 114, 119, 124, 130, 135, 140, 146, 151, 157, 163, 169, 174, 181, 187, 194, 200, 207, 214,
    220, 228, 234, 241, 248, 256, 263, 270, 278, 286, 294, 302, 310, 318, 326, 335, 343, 352, 361, 370, 379, 388, 397,
    406, 416, 425, 435

(The OEIS data field holds about 260 characters; the editors may keep fewer terms in DATA and the rest in the b-file.)

COMMENTS (add)

    The upper bounds a(46) <= 90, a(47) <= 95, a(48) <= 100, a(49) <= 104, a(50) <= 110 given by Rob Pratt are sharp.
    For 46 <= n <= 95 each lower bound is proved by a certificate: the 2^n colorings are partitioned into subcubes
    (partial colorings), and on each subcube 4*M = T + Sum_{i<j} w(i,j)*x_i*x_j, with x_i = +-1 the colors, T the number
    of 3-term progressions in {1..n} and w(i,j) the number of them containing both i and j, is bounded below by means of
    one positive semidefinite integer matrix. A short checker verifies each certificate in exact
    integer and rational arithmetic; it shares no code with the program that found the certificates. The matching upper
    bounds are explicit colorings. The same certificates reprove a(1)..a(45) independently of the integer programs. -
    Carlos Toledo, Nov 19 2026
    For every n <= 95, a(n) = (117*n^2 + c(n mod 1096))/2192 - n/2 for a table of 1096 integers c(r) with
    -1476 <= c(r) <= 3516 (see the link). It is conjectured that this holds for all n; the leading term 117*n^2/2192 is
    the conjecture of Parrilo, Robertson and Saracino. - Carlos Toledo, Nov 19 2026

LINKS (add)

    Carlos Toledo, <a href="https://carlostoledo.co/reports/twelve-blocks-exact.html">Exact values of the least number
    of monochromatic 3-term progressions, n <= 95: certificates, checker and colorings</a>, 2026.
    Carlos Toledo, <a href="/A121385/b121385.txt">Table of n, a(n) for n = 1..95</a>   [upload b121385-to-95.txt as the
    b-file; it replaces the synthesized one]

EXTENSIONS (add)

    a(46)-a(95) from Carlos Toledo, Nov 19 2026. The certificates were found by Claude (Anthropic's AI model) in a
    session I ran and were verified by an independent exact checker; a second model (OpenAI's GPT) re-verified a(46)-a(50),
    a(64) and a(88) with its own program.

OPTIONAL COMMENT (only after the record's unit-scale step is public and you are content with it)

    a(548) = 15756, attained by exactly 102 colorings: the twelve-block coloring of Parrilo, Robertson and Saracino with
    block lengths 28, 6, 28, 37, 59, 116, 116, 59, 37, 28, 6, 28, its color exchange, and 50 variants of each near the
    block boundaries (see the link). - Carlos Toledo, Nov 19 2026

KEYWORD: remove "more" only if the editors wish; the method slows near n = 95 (about 3,000 subcubes and twenty minutes
per term) but has not hit a wall.

---

## The OEIS's rules on AI (read on 2026-11-19 at https://oeis.org/wiki/Use_of_AI_for_OEIS_Submissions; read it again before submitting)

- The author is a person and "is responsible for the correctness of any content produced by a large language model".
- FORBIDDEN: "using AI to generate the full text of comments"; pasting AI-generated text into the pink boxes as answers
  to the editors; listing an AI tool as author or co-author; bulk or serial AI submissions without permission.
- So THE COMMENT AND EXTENSION TEXTS ABOVE ARE NOTES, NOT TEXT TO PASTE: they were drafted by Claude. Write the comments
  yourself, in your own words, from the facts in them, and answer the editors yourself. The terms and the b-file are
  data, each proved by a checked certificate; those can go in as they are.
- The page cites the test that an author should be able to give "a clear, expert-level talk" on the result. Before
  submitting, be able to explain the certificate in your own words: the identity 4M = T + Σ w x_i x_j, the cubes, the
  one positive semidefinite matrix per cube, and what the checker verifies (the page's section "the certificate").
- The page does not require disclosing AI use. Disclose it anyway, in your own sentence in EXTENSIONS: it is true, it is
  this repository's rule, and an editor who finds it out later will trust the terms less.

## Notes for the conversation with the editors

- An earlier version of this file said the OEIS asks contributors to say when AI was used. That was written without
  reading the policy; the policy is the section above.
- If an editor asks how to check a term: `python3 instruments/twelve-blocks/exact/cubepsd.py` is not needed; the command is
  `python3 instruments/twelve-blocks/exact/judge.py --only U1` in the public repository (about four minutes for all 95
  rows); the certificates are in `corpus/twelve-blocks-2/certificates/` (xz), their format in
  `corpus/twelve-blocks-2/run/claude/CERT-FORMAT-V.md`.
- The conjecture comment is the weakest part of the edit. It is true as stated (a conjecture, verified to n = 95). If an
  editor prefers to drop it, drop it; do not strengthen it. In particular do NOT write that 117/2192 is proved: in print
  it is a conjecture, and the proof claim on erdosproblems.com/1186 is ours and unrefereed.
- b-file: `outreach/b121385-to-95.txt` (95 lines, plus one comment line the uploader should delete if the OEIS rejects it).
