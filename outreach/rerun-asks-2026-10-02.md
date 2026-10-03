# The five asks — phase 2 of the rerun program (drafted 2026-10-02, HELD)

Each ask is a SEND and goes only on the operator's per-item word. The corpus is
`corpus/rerun-corpus.json` (ten register rows, five parties); the kit each ask
points at is https://carlostoledo.co/reports/rerun.html (`RERUN.md` in the
repository); a reply is recorded through the `rerun` issue template into
`corpus/external-reruns.json` with the register ids it covers, and the milestone
on the kit page moves only then. Every number below is read from the register
at the build of 2026-10-02; re-run `node tools/build-report-rerun.js` before
pasting if the tree has moved. Nobody from the partner lab is named here.

---

## R1 · rainrzk — three rows with a one-file verifier or a finite sweep
Where: a new issue on github.com/rainrzk/erdos510-lambda4-audit, or a comment under
teorth/erdosproblems #392 (their audit thread). Three rows: `erdos852-cstar`,
`mm-alphaevolve-48-4x4x4`, `optconst-84b`.

> Your λ(4) audit is the first outside re-certification of anything from this lab with no shared code, and it is now the first row of a registry I built because of it: https://carlostoledo.co/reports/rerun.html — for every record the claims register is derived from, the one line that re-derives it, and who outside has re-run what.
>
> If you have an hour for three more, these are the ones where your kind of check — your own code, or a sweep that does not depend on the proof — is worth the most:
>
> 1. **Erdős #852, the published C\*.** A thread post gives 0.0752403861777 with no error bound; the record refutes it at its printed digits (the certified enclosure of C* excludes the printed value). `python3 tools/verify_erdos852.py certs/erdos852-certificate.json --sources corpus/sources` — standard library, 0.6 s, re-hashes the pinned thread, must refute a forged value before it exits green. Page: /reports/erdos852.html.
> 2. **AlphaEvolve's 4×4×4 in 48 multiplications over Z[i].** 4,096 tensor identities from DeepMind's own notebook bytes, pinned by commit. `python3 tools/verify_strassen.py certs/strassen-certificate.json --sources corpus/sources`, 0.3 s. Page: /reports/alphaevolve.html.
> 3. **The optimization registry's C84b.** The asterisked bound C84b ≤ 1.999281 quotes c ≥ 0.000719 from a note whose own chain, re-derived for every choice of its parameters, gives c ≤ 0.0007150507 — so the record holds the note's theorem (1.9993) and not the quoted constant. `python3 tools/run-sumproduct-ledger.py --check`, 37 s; a sweep of your own over the chain's parameters would be the stronger check. Page: /reports/optimization-constants.html.
>
> What I would record: the verdict you obtain, the sha256 the verifier prints, and where it ran — the issue template `rerun` on the repository takes exactly that. A disagreement is worth more than an agreement and is recorded the same way.

## R2 · S. Norin, for Gupta–Ndiaye–Norin–Wei — their own iteration, and a certificate claimed against their theorem
Where: email to the corresponding author (the address on arXiv 2407.19026v2). Two rows:
`gnnw-gai-3782`, `horizonmath-ramsey-asymptotic`.

> Dear Professor Norin,
>
> In v2 of "Optimizing the Campos–Griffiths–Morris–Sahasrabudhe bound" you print, after Remark 17, one more iteration of Theorem 14 proposed by a language model (G_AI), as preliminary and unverified, with the consequence R(k,k) ≤ 3.78233^(k+o(k)) if it holds. I decided it on your theorem: Theorem 14's inequality holds on all of (0, 1] for F = h + G_AI, with Y = Y_f(X) from Lemma 15 for the proved F_0.03 and a continuous witness M chosen by me, in interval arithmetic, by two independent programs (one Python file using only the standard library; one JavaScript program in another arithmetic) that agree on c to 25 digits: c = 3.78232877553731…, so your printed 3.78233 is its rounding. Everything is conditional on your Theorem 14, Lemma 15 and Theorem 1, which I take as given. Five further rounds proposed by a float optimiser, each decided in the region the previous round establishes, reach 3.7721307629…; in floats the iteration converges near 3.77213 at degree 9, so more rounds of this kind buy almost nothing. The page is https://carlostoledo.co/reports/diagonal-ramsey.html; the one-file verifier is `python3 tools/verify_gnnw_gai.py certs/gnnw-certificate.json` (8 s) and its certificate carries every interval.
>
> The second thing concerns a certificate claimed against your theorem. The HorizonMath benchmark (arXiv 2603.15617v2, Appendix A) credits a model with R(k,k) ≤ 3.6961^(k+o(k)) "by a certificate satisfying Theorem 14". Decided from what the appendix prints, the certificate is refuted, not the inequality: at the point where c is read, its pair (X(1), Y(1)) = (0.22745, 0.9988) lies outside your region R (Erdős's 1947 bound at e = 13/2000, p = 11981/500000 exceeds the pair's rate by 0.00130), and 56 of its 201 points are outside R. The cause is the benchmark's checker, which accepts a pair if either of the two inequalities membership in R needs passes; with min replaced by max their own validator fails the certificate on its first interval. Page: https://carlostoledo.co/reports/horizonmath.html; `python3 tools/run-horizonmath-ledger.py --check`, 2 s.
>
> I would be grateful for any of three things: a rerun of the verifier in whatever you trust (the repository's `rerun` issue template records who obtained what, and a disagreement is recorded the same way); a correction if I have read Theorem 14, Lemma 15 or R differently from how you intend them; or nothing at all, in which case the pages stand as they are, with the conditionality stated.
>
> With best regards,
> Carlos Toledo

## R3 · the EinsteinArena thread and the Dualverse Station authors — the 604s and a REPAIRED row
Where: a comment under vinid/einstein-arena #64 (open since 2026-09-08; the operator's reply there
is the last message), and the same text as a new issue on github.com/dualverse-ai/station_data_v2.
Three rows: `kiss-ea-604`, `kiss-station-604-1`, `ea-overlap-together_ai_2026`.

> A follow-up to the 604 row, now that the rest of the kit is public. Every row of the register is re-derivable from the repository in one line, and there is a registry of who outside has re-run what: https://carlostoledo.co/reports/rerun.html. Three rows are yours.
>
> 1. **Your 604** (`solution_n=604_d=11.json`, commit c388c6f7) and **the Station's configuration 1** (`kissing_certificates.npz`): both CERTIFIED from the published bytes in exact arithmetic, and decided congruent — one configuration in two frames, with the certificate (π, T) public at /certs/kissing-congruence.json. `node tools/run-kissing-ledger.js`, 3 s, re-decides every configuration on the page; `instruments/kissing/congruence.js` re-checks the congruence without the search.
> 2. **The Erdős minimum-overlap step function** (`together_ai_2026.py`, 600 steps, printed upper bound 0.380871): as published it is a witness only within the platform's tolerance — 0 ≤ h ≤ 1 holds, but Σh − n/2 = −1.0e-15 rather than 0 (inside the platform's 1e-6) — so the file as it stands does not satisfy the constraint it claims; 1 − h scaled to the exact constraint is certified at 0.3808703105862199, of which your printed 0.380871 is the ceiling. The row is REPAIRED: the bound survives, the witness as published does not, and that is the verdict an author most wants to check. `node tools/run-easota-ledger.js`, 3 s; page /reports/easota.html.
>
> If either of you runs the line, or re-decides the files with your own code, the `rerun` issue template on the repository records the verdict obtained and the hash printed, under your name. Disagreement is the useful outcome; it is recorded exactly like agreement.

## R4 · S. Sra — the one case that depends on its own reading
Where: an issue on github.com/suvrit/count-ex-machina, or email. One row: `countex-dpp-feasible-step`.

> Your counterexample library was decided case by case here — fourteen programs written from the statements before your checkers were read, each reading only the published certificate: nine cases hold whole, five hold in part, none is refuted (https://carlostoledo.co/reports/counterexample-machine.html). One case is the reason I am writing: **feasible Picard steps for DPP likelihood** holds under the context paragraph's reading of "feasible" (the step keeps the iterate positive definite: a = 5 does, and the likelihood falls) and does not hold under the statement block's own reading ("feasibility is the bound a ≤ 1/(1 − γ) of Prop. A.1"), because for this L0 that bound is about 1.90, which a = 5 exceeds, and every step tried inside the bound ascends. The record calls that PARTIAL with the defect kind "depends-on-reading", and only the author can say which reading the case means.
>
> Two things would settle it: your reading, which I will record on the page as yours; and, if you have five minutes, a rerun — `python3 tools/run-countex-ledger.py --check` re-decides all fourteen cases in 33 s with the standard library, and the repository's `rerun` issue template records what you obtained. One observation from the audit, offered rather than claimed: none of the fourteen `verify.py` files reads the certificate it writes.

## R5 · the LabECO pair — the benchmark's marginals, in their own field
Where: the open WhatsApp thread with the two of them (the operator's; in Portuguese; names stay
out of the repository). One row: `ecbench-marginals`. The ask doubles as the first concrete step of
the P1 review: the row IS the paper's §4.

> [SAUDAÇÃO — OPERADOR PREENCHE]
>
> Uma coisa concreta e pequena, antes de qualquer revisão de texto. Toda linha do registro de claims agora se re-deriva com um comando, e há um registro público de quem de fora re-rodou o quê: https://carlostoledo.co/reports/rerun.html. A linha que é da área de vocês é a dos marginais do benchmark de contornos ambientais: dos 15 ajustes de Hs que as equipes imprimiram para as boias A, B e C, 5 reproduzem um máximo de verossimilhança certificado, 1 impresso como Hs reproduz o ajuste certificado de Tz, 3 usam outro estimador (mínimos quadrados) e não são decididos aqui, e 6 não são decidíveis na precisão impressa. É a tabela do §4 do P1.
>
> O pedido: rodar `node tools/run-hseva-ledger.js --check` no repositório (uns 6 minutos; re-deriva e compara, não escreve nada) e me dizer se o veredito bate — ou, melhor ainda, re-ajustar uma das 15 linhas no pipeline de vocês (scipy, com a localização fixa ou livre, como vocês fazem) e comparar com o intervalo certificado da página /reports/return-levels.html. O que eu registro é o veredito que vocês obtiveram, com o nome que quiserem; uma discordância vale mais que uma concordância e entra do mesmo jeito.
>
> [ASSINATURA]

---

Not in the five, with their own pending sends (HANDOFF, "SENDS"): the HorizonMath authors
(the either-orientation rule; drafted in chat 2026-09-29), the optimizationproblems pull request
(84b and the three stars), Gao and Castañeda–Honorato–Valenzuela-Henríquez (courtesy notes).
