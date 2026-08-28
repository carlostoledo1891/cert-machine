# Zenodo deposits — the safety layer (staged; clicks are the operator's)

WHY (recorded 2026-08-28): priority and attribution rest on immutable
third-party timestamps. Our GitHub history was force-pushed once (the
IP-leak remediation), the site recomputes by design, and issue
attachments are deletable — so DOI-stamped Zenodo deposits are earned
insurance, not ceremony. ORCID first (5 minutes, instant), since Zenodo,
arXiv and OEIS metadata all hang off it.

## Deposit 1 — the repo snapshot (do any week; repeatable per release)

Mechanism: zenodo.org -> log in (GitHub OAuth) -> GitHub integration ->
flip cert-machine ON -> create a tagged release (e.g. v2026.08) ->
Zenodo archives the tarball automatically and mints a versioned DOI
under one concept-DOI. Future releases each get a DOI.

Metadata (paste-ready):
  Title:    cert-machine: verification layers for AI-scale mathematical
            search (certified audits, proof-grounded evals, verified
            reward channels)
  Creators: Toledo, Carlos (ORCID when created)
  License:  MIT (code); note in description that pinned third-party
            corpora under corpus/sources/ retain their own licenses.
  Description: the README positioning paragraph + "every page recomputes
            its numbers at build; a build that drifts refuses to ship".
  Related identifiers:
    - https://carlostoledo.co  (isSupplementTo)
    - https://github.com/carlostoledo1891/cert-machine (isIdenticalTo)

## Deposit 2 — the Erdős #290 computation (AFTER the l≈310 campaign:
## deposit the perfect version once, cite the DOI everywhere)

Contents: the seven rerunnable programs (legacy/research/challenges/
erdos290 + tools/galois-exceptions-lean.js + run-erdos290-tail-ext.js),
certs/erdos290-tail-ext.json, the report as PDF (print
reports/erdos290.html to PDF at deposit time), and a README naming the
one-command reruns and the certified enclosure.

Metadata (paste-ready; review literature before deposit):
  Title:    A certified enclosure for the Erdős #290 constant: the
            4k(k+1) discriminant law, exceptional Galois degrees, and
            the decimal expansion of van Doorn's c_0 = 1/(1+c)
  Creators: Toledo, Carlos
  License:  MIT (programs), CC-BY-4.0 (text/report)
  Related identifiers:
    - arXiv:2411.03073  (cites: W. van Doorn, On the non-monotonicity
      of the denominator of generalized harmonic sums)
    - https://www.erdosproblems.com/290  (isSupplementTo)
    - https://github.com/teorth/erdosproblems/issues/164 (isSupplementTo)
    - OEIS A375081, A033996 (references; add our A-numbers when minted)
    - J. Algebra Appl. 19 (2020) 2050014, doi:10.1142/S0219498820500140
      (cites: Altmann-Awtrey-Cryan-Shannon-Touchette)
    - arXiv:2210.10257 (cites: Chen-Chin-Tan restatement)
    - https://github.com/Woett/Lean-files/blob/main/ErdosProblem290.lean
      (references: van Doorn's Lean formalization of b(a) <= 6a)
  Description: the report's tl;dr block, plus the honest scope notes
      (one labeled group-theory assumption for the conditional digits;
      the unconditional interval; Lemma 32's Magma determination taken
      as given for even d <= 60).

## Order (one thing at a time)

1. NOW-ANYTIME: ORCID, then Deposit 1 (repo release DOI).
2. AFTER the l≈310 campaign: Deposit 2, then cite its DOI in the OEIS
   constant packs (4-5) and the issue-164 follow-up.
3. The arXiv note (math.NT, short) FOLLOWS Woett engagement — he is the
   natural endorser; the note cites Deposit 2's DOI.
