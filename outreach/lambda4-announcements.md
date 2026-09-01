# lambda(4) announcements — DRAFTS, operator posts; nothing here auto-sends

Two channels, both public-record rather than cold outreach. Facts checked at
draft time (2026-09-01): teorth/erdosproblems has NO issue mentioning #510,
Chowla, or cosine (gh search, zero hits); our lambda-table comment on
erdosproblems.com/510 was still in the moderation queue at the last sweep;
Erdős #510 asks whether lambda(N) >> N^(1/2) — the ASYMPTOTIC question, which
lambda(4) does not resolve; lambda(4) is finite-front progress on the same
quantity. Re-verify both facts at send time (CLAUDE.md outreach rule).

---

## A · erdosproblems.com/510 — follow-up comment (after the pending one clears)

POST ORDER: only after the 2026-08-26 lambda-table comment is visible (the
sweep watches; its n=13 signature is the tripwire). If the moderator prefers,
this can replace rather than follow it.

---- PASTE BELOW THIS LINE ----

Following up on the certified table above: the value of $\lambda(4)$ is now
exactly determined. $\lambda(4) = -L(1,2,3,4)$, the root of
$512y^3 - 1227y^2 + 600y + 125$ near $1.5195578816428$ — the value Mercer
conjectured (*INTEGERS* 19 (2019), #A4, §5) alongside a reduction strategy he
wrote he could not execute. The proof executes and completes that strategy:
his fourteen exceptional families are re-derived symbolically (five close
themselves), the remaining nine are closed by second-level weight arguments
with derived thresholds, and 2,231 finite cases are decided in exact rational
arithmetic. The proof is machine-derived and not peer-reviewed; it re-runs in
one command from the public repository, an independent audit walk (no code
shared with the proving engine) covers every gcd-reduced 4-set with
max element ≤ 30 with zero holes, and a referee-grade write-up is included.
Archived at doi:10.5281/zenodo.22225861; proof page:
https://carlostoledo.co/reports/lambda4.html. Refutations welcome. This does
not touch the asymptotic question this page asks — it is the finite front.

---- END PASTE ----

## B · github.com/teorth/erdosproblems — new issue (a formalization offer,
##     which is that repo's genre; also the organic channel to its maintainer)

TITLE: Problem #510 (Chowla cosine): lambda(4) exactly determined —
machine-derived proof offered as a Lean formalization target

---- PASTE BELOW THIS LINE ----

Not a resolution of #510 (which asks whether $\lambda(N) \gg N^{1/2}$), but a
new exactly-proved datum on its central quantity, offered here because its
structure makes it an unusually clean Lean formalization target.

**Claim.** $\lambda(4) = -L(1,2,3,4)$: no set of four positive integers has
cosine-sum minimum shallower than $\{1,2,3,4\}$. Exactly, $\lambda(4)$ is the
root of $512y^3 - 1227y^2 + 600y + 125 \approx 1.5195578816428$. This was
conjectured by Mercer (INTEGERS 19 (2019) #A4, arXiv:1709.06612), who proved
$\lambda(2)$ and $\lambda(3)$ and left a reduction strategy for $\lambda(4)$
he wrote he could not execute. The proof executes and completes his strategy.

**Why it may be formalizable with unusually little pain:** the entire proof is
(i) six elementary lemmas (averages of cosines over equispaced sets; Mercer's
two-set approximation lemma; three cosine chord/convexity bounds), (ii) exact
rational identities over finitely many linear collision conditions on integer
cones, and (iii) 2,231 finite cases each carrying a certified enclosure. No
analysis beyond single-variable convexity is used anywhere.

**Status, stated plainly:** machine-derived (an AI-driven certified-arithmetic
engine; the statement, strategy and core lemmas are Mercer's), NOT
peer-reviewed. The full record re-derives in one command; an independent audit
implementation (no shared code) walks every gcd-reduced 4-set with max element
≤ 30 and finds every one covered by an explicit clause, zero holes, zero
refuters. Write-up: paper/lambda4-proof.md in the repository; archived at
doi:10.5281/zenodo.22225861; page: https://carlostoledo.co/reports/lambda4.html.

Happy to restructure any of it toward a formalization effort, or to be told
where it breaks.

---- END PASTE ----

## C · FrontierMath note (for the record, no action)

Epoch's "Chowla's Cosine Problem" open problem is the OTHER direction —
explicit sets with small normalized minimum, i.e. refuting Chowla's
conjecture. lambda(4) neither claims nor advances that prize. If anything our
certified data (c rising with n) is consistent with their own stated risk
that the problem is unsolvable. The one live Epoch-facing item remains the
verifier-soundness demonstration (their sampling check accepts a false set;
certified counterexample already in certs/chowla-records.json notes) — a
separate decision, unrelated to this claim.
