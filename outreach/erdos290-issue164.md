# Erdős #290 — the GitHub issue comment (teorth/erdosproblems#164)

STATUS (2026-08-31): the comment reproduced below was POSTED 2026-08-04 by
carlostoledo1891 on https://github.com/teorth/erdosproblems/issues/164
(Woett's "HELP WANTED: Computing sequence for Erdős problem #290", opened
2025-11-28, label help-wanted, still OPEN). No replies.

**THE SUMMIT FINISHED 2026-08-31 AND THE FOLLOW-UP IS NOW SENDABLE.** The six
detached shards closed the contiguous block l = 293..310; the main record
holds 250 degrees closed, 0 open, l = 61..310 contiguous. The follow-up draft
below has been rewritten against that horizon. It was HELD until now on
purpose: its own text promised a third unconditional digit "when the squeeze
reaches l ≈ 310", and sending it before that landed would have bought a stale
comment and forced a third.

THE PROMISE LANDED:

    unconditional  c        ∈ [0.830416407911, 0.831220912621]   (l ≤ 310)
    unconditional  1/(1+c)  ∈ [0.546083759260, 0.546323774021]

so **0.546 is now pinned WITHOUT the tail assumption** — previously only 0.54
was. The "6" the correspondent guessed is confirmed unconditionally. The
assumption now enters only at l = 311 (even d ≥ 622), was l = 242.

STILL TRUE: the erdosproblems problem-page comment promised in the posted
text ("will add the link here as soon as it is up") remains in that site's
moderation queue, and is the likeliest reason the loop never closed.

SEND ON THE OPERATOR'S WORD ONLY. Nothing here has been posted.

## The posted comment (2026-08-04), verbatim

[erdos290-programs.zip](https://github.com/user-attachments/files/30711725/erdos290-programs.zip)

Short answer to the sequencing question first: the value to sequence is 1/(1+c), and it is

    1/(1+c) ∈ [0.545485611000, 0.546712849449]   unconditionally, and
    1/(1+c) = 0.546229310400104587412660585438363...   under one stated assumption
              about the Galois groups in the tail.

Unconditionally that interval pins only the first two digits, so my instinct is that only
the conditional expansion is worth an OEIS entry, with the assumption written into the
definition — including its failure semantics: the assumption enters only at even d >= 122,
so a first failure at degree d0 moves c by at most 0.607/(d0(d0+1)), and 1/(1+c) by about
a third of that; by interval containment (the kernel prints and asserts the counts), a
failure at d0 = 122 would preserve only 0.5462 — four digits — and the entry would be
amended by raising d0 rather than retracted. But that is a call for you and an OEIS
editor, so I would rather ask than guess.

One dependency stated plainly, since it is yours: the unconditional interval takes
Lemma 32's Magma determination that G_d = S_l^+ for even d <= 60 outside {8, 24, 48} as
given — I certified the irreducibility half independently, not the group half. Beyond
that it assumes nothing.

The blocker was the Galois groups. The three the paper leaves open (d = 8, 24, 48) are now
pinned exactly, and the determination extends to every even d ≤ 120 — which turned up two
further exceptional degrees, d = 80 and d = 120.

There is also a clean reason for those degrees. For even d = 2l,

    disc(f_d) = (d+1) * (2^l * l! * disc h)^2,

where h is the pair polynomial with f_d(x+l) = h(x^2). The bracket is a perfect square, so
disc(f_d) is a square exactly when d+1 is — and for even d that means d+1 = (2k+1)^2, i.e.
d = 4k(k+1). So no other degree can drop into the even-weight subgroup, for any k -- a
theorem rather than the pattern I first took it for. (Two scope notes, so this is not read
as more than it is: whether the group actually drops at a given 4k(k+1) is the separate
per-degree question above, answered yes at every degree computed and open past d = 120; and
"exceptional" beyond the computed range could in principle also mean a drop to a subgroup
NOT inside A_{2l}, which a nonsquare discriminant does not forbid — no computed degree does
that, but the identity alone does not exclude it.) The composition identity inside the
proof is published — Altmann, Awtrey, Cryan, Shannon, Touchette, J. Algebra Appl. 19 (2020)
2050014, Thm 2.4, restated as Chen-Chin-Tan, arXiv:2210.10257, Prop. 2.8 — in MONIC form;
the non-monic leading factor a = lead(h) = d+1 is exactly what makes the criterion
non-trivial here. The specialization to f_d I could not find anywhere: van Doorn's paper
never uses the word "discriminant", and neither disc(f_d) = 1, 12, 2000, 6728000, ... nor
the disc(h) sequence appears in OEIS (the degree pattern itself is A033996, with no comment
connecting it to polynomials or Galois groups).

I am posting the mathematics as a comment on the problem page, since CONTRIBUTING asks
that mathematical content go there, and will add the link here as soon as it is up.

Everything is attached, and also downloadable as a pack at
https://mfg-lab.vercel.app/technical-reports/erdos290 — plain Node.js, no dependencies, no
Sage and no Magma. Run them in this order:

    node theorem.js         the square-discriminant law, as an exact integer identity; ~15 s
    node tail-sweep.js      regenerates tail-deltas.json; ~10 minutes, the slow one
    node kernel.js          the enclosure (reads tail-deltas.json); ~20 s
    node galois8.js         d = 8 by enumerating all 1659 subgroups of S_4^+; ~2 minutes
    node galois-exceptions.js   d = 24, 48 by structural elimination
    node pattern-check.js   the d = 168 check
    node narrowing.js       regenerates the figure data (narrowing.json); instant

kernel.js reads tail-deltas.json, so running it before the sweep certifies a stored file
rather than a recomputed one — every stored entry is re-derived from its declared group's
closed form and gated by the theorem (an index-2 entry at a degree where d+1 is not a
square refuses). About fifteen minutes end to end. Five of the seven carry
deliberately broken variants that must fail (twelve in all); pattern-check.js instead carries
two directional controls, d = 118 which must show a non-residue and d = 120 which must not;
narrowing.js asserts monotonicity and, when run beside the write-up page, that every number
the page hardcodes matches the generated copy.

AI disclosure: this computation was carried out with AI assistance. The programs were
written and run under my direction and every number is reproducible by running them. I have
checked every claim in this text myself. No third party has re-run the programs, so the
checks and the code still share an author — they rule out slips but not a shared
misconception. An independent recomputation of delta(f_8) = 25/64 in Sage or Magma would
take an afternoon and is what I would most like from this thread.


## The follow-up comment — DRAFTED, NOT POSTED (2026-08-31)

A pure delta on the 2026-08-04 comment above, which IS already posted. It
does not re-introduce the problem or restate the method; it says only what
changed. Post as a new comment on teorth/erdosproblems#164 — `gh` is
authenticated and can do it on the operator's word.

---

@Woett — the third digit is now unconditional.

When I posted above, the unconditional bracket was

    1/(1+c) in [0.545485611000, 0.546712849449]

which, as I said then, pins only the first two digits. The determination has
since been pushed from even d <= 120 to **every even d <= 620** — 250
consecutive degrees closed by the five-candidate structural squeeze, unique
survivor at each, none left open. That gives

    c        in [0.830416407911, 0.831220912621]
    1/(1+c)  in [0.546083759260, 0.546323774021]

so **1/(1+c) = 0.546... with no assumption of any kind.** The 6 you guessed
is now proved rather than conditional.

Three things came with it.

**The exceptional degrees all fell.** d = 4k(k+1) for k = 6..11 — that is
168, 224, 288, 360, 440, 528 — every one closed to an exact delta. They are
also the only degrees in that range that drop, which is forced by

    disc(f_d) = (d+1) * ( 2^l * l! * disc(h) )^2,    where f_d(x+l) = h(x^2),

so disc(f_d) is a perfect square exactly when d+1 is.

**The conditional expansion is unchanged in value, but its assumption now
starts far later** — at even d >= 622 instead of d >= 62:

    1/(1+c) = 0.54622931040010458741266058543836314273483317015360257199417712941054333303218493659023941816307519773773368722

**On sequencing, my view is unchanged**: the conditional expansion is the one
worth an entry, with the assumption written into the definition and its
failure semantics stated — a first failure at d0 moves c by at most
1/(d0(d0+1)) and 1/(1+c) by at most about 0.299/(d0(d0+1)), which at
d0 = 622 is below 8e-7, so such an entry is amended by raising d0 and never
retracted. What is new is that there is now a clean unconditional companion
to set beside it, 0.546, for an editor who would rather have three digits
that assume nothing than 110 that assume something. I am happy either way.

**Where this stops, and it is worth saying plainly.** The bracket width is
essentially 1/(4*horizon) — it is the unpinned tail Sum_{l>L} 1/(2l(2l+1))
and nothing else, since every undetermined degree is charged the full
delta in [0,1]. A fourth unconditional digit therefore needs the horizon near
3100 rather than 310: ten times the degrees, each roughly 10^4 times more
expensive. That is no longer a compute problem. What would actually move it
is a theorem that stops charging the full unit — even a proof that delta lies
in *some* interval of width 0.1 for all large even d would shrink the entire
tail tenfold, immediately, with no computation at all.

The check I asked for still stands, and is still what this computation most
wants from someone else's hands: delta(f_8) = 25/64 re-derived in Sage or
Magma is an afternoon. And one dependency remains yours, stated plainly: the
unconditional interval takes Lemma 32's Magma determination that G_d = S_l^+
for even d <= 60 outside {8, 24, 48} as given — I certified the
irreducibility half independently, not the group half.

Everything above re-certifies at every build, and the method and code are at
https://www.carlostoledo.co/reports/erdos290.html
