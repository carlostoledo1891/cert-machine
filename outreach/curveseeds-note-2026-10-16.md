# The NIST curve-seeds certificate — two notes (drafted 2026-10-16 night; every send is the operator's)

Written for: (1) Filippo Valsorda, who organized the NIST Elliptic Curves Seeds Bounty and is the person the
cryptographic community will look to for "has anyone checked this"; (2) the post's authors at Anthropic, via Steve
Weis, whose saweis.net investigation preceded the post and who is named on it. Short, factual, offer-shaped. The page
is live at https://carlostoledo.co/reports/curve-seeds.html; the repository holds the pins, the pre-registration and
both deciders. Nothing in either note claims more than the ledger.

STATUS: NOT SENT. Channels: Valsorda — words.filippo.io's contact or a reply where he announces the bounty's
resolution (Bluesky/Mastodon/HN thread; the operator picks the one that exists); Weis — the e-mail on saweis.net, or
Anthropic's research contact. If the post gets a public thread (HN, Lobsters), the Valsorda note doubles as the
comment, minus the greeting.

---

## 1 · To Filippo Valsorda

Subject: an independent re-derivation of the claimed curve seeds, from the standards, no shared code

Filippo,

Anthropic's post today says the fourteen NIST/X9.62 seeds are lrand48 candidates seeded from 1997–98 Unix timestamps,
and that six base points come from FreeLIP's generator. I re-decided every checkable row the same evening, from the
specifications rather than from their script:

- 14 of 14 seeds: the stated candidate of the stated srand48 run, by the POSIX LCG written from the man page
  (prime curves: the top byte of each lrand48 output; binary curves: whole 31-bit words from the halved clock).
- 14 of 14 seed → curve derivations: ANSI X9.62's SHA-1 chain reproduces the intermediate c that FIPS 186-2 itself
  prints for the five NIST prime curves (the calibration that caught X9.62's leftmost-bit rule), b²c ≡ −27 holds for
  all ten prime curves, and the four binary b's come out bit for bit in the normal basis.
- 6 of 6 base points: FreeLIP's zrstarts/zrandom/zrandomb as lip.c codes them, 26-bit limbs, seven draws discarded,
  from LIP seeds 20000–20517.

Two implementations (Python stdlib; Node BigInt) agree on 383 fields; fifteen forgeries fail as they must (a timestamp
one second off, a candidate one off, the clock not halved, the chain without the leftmost-bit rule, a LIP seed one off,
30-bit limbs, …). The published values are read from the pinned FIPS 186-2 text layer and OpenSSL's table, never
retyped; the post's code is pinned as evidence and never run.

What the page does not claim, and lists as readings: the skipped-candidate statement (candidate 876 of P-256 etc.)
needs point counting and is outside the certificate; the 1/5810 is a null-model number; "less plausible" is
interpretation; the halved clock is the post's own reading.

Page: https://carlostoledo.co/reports/curve-seeds.html · repository: github.com/carlostoledo1891/cert-machine
(corpus/curveseeds, instruments/curveseeds). If anything there is wrong I would like to hear it first.

Carlos Toledo

## 2 · To Steve Weis (and the post's authors)

Subject: your curve-seeds result, re-derived independently — all 34 checkable rows hold

Steve,

Congratulations on closing this. I built an independent certificate of the post this evening: every seed, every
seed-to-curve derivation and the six FreeLIP base points, re-decided from POSIX, X9.62/FIPS 186-2 and lip.c by two
programs that share no code with each other or with yours, calibrated on FIPS's own printed intermediates, with
fifteen red controls. All 34 rows hold. The page separates what it decides from what it reads: the skipped candidates
(point counting), the 1/5810, the halved clock and the plausibility sentence are listed as readings with what would
decide each.

Two small things you may want to know: (1) FIPS 186-2 prints c for the NIST prime curves, so the chain can be checked
against the standard's own intermediate, not only against b; (2) your base-point reading needs FreeLIP's SINGLE_MUL
build (NBITS = 26) — the default 30-bit build does not reproduce Gx — which may be worth a sentence in the post for
whoever re-runs it.

https://carlostoledo.co/reports/curve-seeds.html · github.com/carlostoledo1891/cert-machine

Carlos Toledo

---
Before sending: re-read certs/curveseeds-ledger.json (34 CERTIFIED) and, if the optional PARI lane has run, decide
whether its skipped-candidate counts belong in the note (they are counted apart on the page). The operator's word per
note.

## 3 · Hacker News — the live thread (691 points, 274 comments at 02:10 UTC 10-17; https://news.ycombinator.com/item?id=50122800)

Read 02:10 UTC: nobody in the thread reports a re-derivation; one secondary blog (cellcog.ai) says it re-ran Anthropic's
own script, which is not independence. The thread's recurring questions: "is it independently verifiable?"
(nickysielicki, 50124063), selection vs. production (fidotron, 50123213), and what is still open. Post ONLY after the
page is deployed (push → Vercel) and `curl -sI https://carlostoledo.co/reports/curve-seeds.html` returns 200.

Top-level comment (plain text; HN has no markdown):

    I re-derived the claim independently this evening — from the specifications, without running Anthropic's script:
    the POSIX LCG written from the drand48 man page, ANSI X9.62's SHA-1 derivation as FIPS 186-2 prints its
    intermediates, and FreeLIP's lip.c for the base points. Two implementations (Python stdlib, Node BigInt), no shared
    code, 383 fields identical.

    All 34 checkable rows hold: the 14 seeds are the stated candidate of the stated srand48 run (prime curves: top byte
    of each lrand48 output; binary curves: whole 31-bit words from the halved clock); each seed yields its curve by
    X9.62 — the chain reproduces the intermediate c that FIPS 186-2 itself prints for the five NIST prime curves, and
    the four binary b's come out bit for bit in the normal basis; the six base points come out of FreeLIP's generator
    from LIP seeds 20000–20517. Fifteen forgeries fail as they must (timestamp ±1 s, candidate ±1, clock not halved,
    the chain without X9.62's leftmost-bit rule, 30-bit limbs instead of 26, …).

    Two details worth knowing if you re-run it: the prime-case chain clears the leftmost bit of the first SHA-1 block
    (FIPS's printed c shows it), and the base-point reading needs FreeLIP's SINGLE_MUL build (26-bit limbs; the default
    30-bit build does not reproduce Gx).

    What the page does not decide, and says so: the skipped-candidate statement (candidate 876 of P-256 etc.) needs
    point counting and is listed apart; the 1/5810 is a null-model number; "much less plausible" is interpretation;
    B-163 and most base points remain open, as the post says. That a 32-bit srand48 argument regenerates 160 published
    bits fourteen times is the computation; that it was a wall clock in 1997 is the reader's inference.

    Page with the pins, the pre-registration and both deciders: https://carlostoledo.co/reports/curve-seeds.html
    (repo: github.com/carlostoledo1891/cert-machine, corpus/curveseeds).

Reply variant, under nickysielicki's "It's independently verifiable" (50124063): the first paragraph above plus the
link, two sentences on what stays open.

## 4 · Short posts (Bluesky / Mastodon; the operator's accounts)

    Anthropic's NIST curve-seeds result, re-derived independently from the standards the evening it appeared: 14/14
    seeds, 14/14 seed→curve derivations (FIPS 186-2's own printed c reproduced), 6/6 FreeLIP base points; two
    deciders, no shared code, 15 forgeries failing. What stays a reading is named. https://carlostoledo.co/reports/curve-seeds.html

## 5 · Two courtesy notes to the people who framed the question (optional, the operator's)

- Neal Koblitz and Alfred Menezes ("A Riddle Wrapped in an Enigma", eprint 2015/1018): one paragraph — the riddle's
  computational half now has an independent certificate; what remains (selection, B-163, base points) is listed; link.
- Daniel J. Bernstein and Tanja Lange (SafeCurves, the "rigidity" criterion): the same paragraph; the page's limits
  section is the honest match for their rigidity vocabulary (production explained, selection not).

## 6 · A Zenodo deposit of the certificate (the operator's account)

The audit's bytes (corpus/curveseeds, instruments/curveseeds, certs/curveseeds-ledger.json, the page) as a versioned
deposit under the lab's concept DOI, so the HN comment and the notes can cite a DOI that does not move. Metadata as
for the earlier deposits (corpus/zenodo.json); upload by hand or with a token.

ORDER OF SENDS (recommended): deploy first → HN top-level comment (the thread is live now; the window is tonight and
tomorrow) → Valsorda → Weis/authors → the short posts → the courtesy notes → the Zenodo deposit when convenient.
