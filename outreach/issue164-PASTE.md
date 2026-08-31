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
