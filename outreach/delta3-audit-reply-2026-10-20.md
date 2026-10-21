# Reply to the δ₃ audit (Sonny Guardian, e-mail of 2026-10-20) — SENT by the operator 2026-10-20 (e-mail to hello@gocheckyourself.org)

Every point in the audit was checked against the repository before this draft was written; the fixes are in commits
5e4926e2, 9349d8ba and c6f2d6a5. The reply below was SENT by the operator on 2026-10-20. Waiting: the auditor's name and
affiliation for the registry entry (drafted at the end, not added), and the evidence packet (to be pinned by digest, never run).

## What was verified, point by point

1. **The Windows crash.** Real. `instruments/delta3/battery.js:135` stripped the prefix `certs/delta3/` from each
   certificate's label, so a label with backslashes kept its prefix and the forged-certificate lookups at line 196 found
   nothing. Fixed as suggested: the basename with either separator, `e.label.replace(/^.*[\\/]/, '')`. The five default
   labels have no nested folders, so the two keyings agree on macOS; the battery still runs 76 checks and refuses the 40
   forgeries here. (Not run on Windows here; the auditor's run with the label-only adapter is the Windows evidence.)
2. **The first-order sentence.** Real, and re-derived with the instrument's own exact functions: for σ = t on
   [0, 16/1096] and zero elsewhere, E(t) = (9t + 3t²)/18769 (by the centred form and by the definition, equal), and the
   verifier's minorant on the g24·4·8 grid is L(t) = (7t + 2t²)/18769, so E − L = (2t + t²)/18769 has a linear term; on
   the g8·4·0 grid L = (8t + 3t²)/18769. The sentence "which the bathtub bounds exactly; what is lost is second order"
   was false as a statement about every σ (the bathtub is exact only along its own minimiser). The proof uses only
   E ≥ L and L(0) = 0, as the audit says. The page now states the narrower sentence and carries a dated correction
   beside it, crediting an outside audit; no verdict moved.
3. **cert-L256.json.** Ported from the source lab beside its log, `certs/delta3/frontier/s34/cert-L256.json`
   (789,862 bytes, sha256 bb5b8be885a09969a31809bbf38c6716dcb965ce616ea9e7e274b65e50272944, the pin the instrument's
   PROVENANCE.json already carried under notPorted). It is in the claimant's own format (Shor relaxation with triangle
   cuts, exact rational multipliers); this repository's verify.js reads another format and does not replay it — the
   log is the claimant's. Its `claim_delta_lower` is the exact fraction the log prints,
   13813582746575710294310765327/259413873249272903761920000000 = 0.0532492058…; a battery check now holds the file
   to the pin and to the log.
4. **The rounding.** Real: the claimant's log prints 0.05324921, rounded to nearest, above the exact fraction. The
   page and the paper's ladder table now print the bound rounded down, 0.05324920, from the exact fraction the log
   carries, and say what the log prints.

## One more place to look, the operator's call (not changed here)

The manuscript paper/tex/delta3.tex, line 103, says "the first-order part of L at y = 0 is exact up to the bathtub". That is
weaker than the page's old sentence (it does not claim the bathtub itself is exact in every direction), but a referee could
read it the same way. A narrower wording: "L(0) = 0 and E ≥ L; the bathtub bound is attained along its own minimiser {h < v}
and not in every direction σ". The paper's ladder table already prints the bounds rounded down after `make papers`.

## Who the auditor is

Unknown, and the address says so too. The operator gave the sender's address, hello@gocheckyourself.org. Looked up on
2026-10-20: the domain was REGISTERED THE SAME MORNING (Creation Date 2026-10-20T07:21:50Z, registrar Cloudflare), hours
before the e-mail; it has no website (no A record for the apex or www); its mail is forwarded through Cloudflare Email
Routing (route1–3.mx.cloudflare.net), with a Brevo verification record in its TXT; a web search finds nothing under the
domain. So: a fresh, anonymous mailbox made for this contact — consistent with a person who prefers not to be named, or
with an audit run by an agent on someone's behalf. This does not touch the audit's substance, which is correct and
specific. It does set the stance for the reply: answer the points (they are public facts about public records), ask who
they are and whether they want to be named, accept the evidence packet as bytes to PIN and never run (the house rule
for every claimant's code), and send nothing that is not already public. Unknown here otherwise. The name appears nowhere in the records, the outreach log or the repository's issues, and a web search finds no
public footprint under it; the e-mail came to the operator directly. The audit is specific and real (a Windows run of the
battery, a counterexample whose numbers re-derive exactly, the notPorted entry read off PROVENANCE.json, the rounding), so the
sender ran the code. Whether a person or an audit run by an agent is not known; the reply asks for the name to record.

## The reply (for the operator to send, edited as they see fit)

Dear Sonny,

Thank you — an independent audit is exactly what the packet was published for, and all four points held up here.

1. The Windows crash is real: the battery stripped `certs/delta3/` from each label and a backslashed label kept its
   prefix. Fixed as you suggested (the basename with either separator), commit <sha>.
2. The first-order sentence was wrong as written, and I re-derived your example with the instrument's own exact
   functions: E = (9t + 3t²)/18769 and L = (7t + 2t²)/18769 on the g24·4·8 grid, a linear gap of 2t/18769. The page now
   says what the proof actually uses — E ≥ L and L(0) = 0 — and carries a dated correction crediting the audit.
3. cert-L256.json is now in the repository beside its log, `certs/delta3/frontier/s34/cert-L256.json`, sha256
   bb5b8be8…, with its exact claim 13813582746575710294310765327/259413873249272903761920000000. It is in the earlier
   lab's own certificate format; the repository's verifier reads the later format, so the log stays the claimant's.
4. The ladder's bounds are now printed rounded down from the exact fractions; 0.05324921 was the log's own
   round-to-nearest.

Would you be willing to have the audit recorded in the repository's registry of independent reruns
(`corpus/external-reruns.json`, shown on /reports/rerun.html), with the name and affiliation you want recorded and the
date, as the λ(4) audit is? And yes — the full evidence packet would be welcome; it would be pinned beside the record by
its digest (the code in it is read, never run here, as with every claimant's).

With thanks,
Carlos

## The registry entry, if the auditor agrees (not added)

```json
{ "who": "Sonny Guardian", "date": "2026-10-20", "record": "certs/delta3-ledger.json",
  "what": "the δ₃ = 117/2192 packet audited independently (own run of the battery on Windows with a label-only adapter: 76 checks pass, 40 forgeries refused); a false sentence on the first-order term found and a counterexample given; the L = 256 certificate requested; a rounding noted",
  "outcome": "the main argument held; three write-up corrections applied", "where": "/reports/delta3.html", "posted": "e-mail (private)", "hash": null }
```
