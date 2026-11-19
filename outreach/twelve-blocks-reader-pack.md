# A pack for one outside reader — the localisation step

STATUS (2026-11-19): DRAFT, nothing sent. The operator chooses the reader and sends it. The reader should be a
combinatorialist or an analyst who has NOT seen this work and is not an AI model of either family that wrote it.

---

## The message (to adapt; first person, mine)

Subject: one lemma to check — monochromatic 3-term progressions near the Parrilo–Robertson–Saracino colouring

I would be grateful for one hour of your reading on a single step of a longer argument.

Two AI models (OpenAI's GPT and Anthropic's Claude), working together under my direction, have written a proof that the
twelve-block colouring of Parrilo, Robertson and Saracino is exactly optimal on the integers at every length n = 548m,
and an exact formula for the minimum at every n ≥ 15,756. Each model has read the other's proofs; no person has. I am
not asking you to referee all of it. I am asking about the one step that turns a search near a construction into a
statement about all colourings:

> **Take an arbitrary 2-colouring of 1..n with no more monochromatic 3-term progressions than the rounded twelve
> blocks. Show that, after exchanging colours if needed, it differs from them only within 75 sites of the eleven block
> boundaries (n ≥ 20,700).**

It is Theorem 1 of the attached document, proved in its sections 1 to 3 (about four pages). Does the argument hold, and
if not, where does it break?

I should say plainly what it rests on. It uses a lower bound from October 2026 (δ₃ ≥ 117/2192), which is my own claim,
proved by five exact certificates that two independent programs accept, and not refereed. The step also uses two lemmas
of that proof that are on paper only. If you find those unconvincing, that is an answer too.

A separate, smaller result needs no trust in any of this and may interest you by itself: exact values of the minimum for
every n up to 95 (the OEIS table stopped at 45), each with a certificate that a short program checks.

Thank you for considering it. I did this with Claude (Anthropic's AI model), which wrote the programs and drafted this
note under my direction.

Carlos Toledo

---

## What to attach or link (all public once the record is pushed)

- The document: `corpus/twelve-blocks-2/run/gpt/Localisation.md` (GPT's; sections 1–3 for the question, 4 for the two
  maps, 7–10 for the exact scales).
- The other model's reading of it, with what it re-derived and what it only read: the messages c5, c6, c7, c9, c11, c12 in
  `corpus/twelve-blocks-2/run/CHAT.md`.
- The report pages: https://carlostoledo.co/reports/twelve-blocks.html and
  https://carlostoledo.co/reports/twelve-blocks-exact.html
- The October result: https://carlostoledo.co/reports/delta3.html

## The inputs of Theorem 1, and what kind of thing each is

| Input | Where | Standing |
|---|---|---|
| Centring identity E(σ) = ∫hσ + Q(φ*σ), and the field h | Lemma 1 | on paper; h itself is computed exactly |
| Discretisation E ≥ L (the "bathtub" bound) | Lemma 2 | on paper; no machine has checked it. At n = 548 a finite version is proved by counting (section 10) |
| E ≥ μ²/948, and sharper constants for small μ (1/315, 1/213, 1/175, 1/168, 1/166) | Lemma 3 | exact: polynomial identities and positive definite matrices, rebuilt by both models and by this repository's verifier at 948 |
| Exact identity 4M = T − 3n/2 + (S₀² + S₁²)/2 + n²Q + R | Lemma 4 | on paper; checked on every colouring to n = 14 and 45,964 colourings in all by this repository |
| The rounded colouring's excess ≤ 1453/137, period 1096 | Lemma 5 | counted exactly for n = 1..3288 |
| The mass bootstrap k < 362/5 | Lemma 6 | arithmetic, redone in fractions by the other model |
| The cost of restoring one far flip | Lemma 7 | on paper; re-derived by the other model; this is the new argument |

## Where a reader should press, in the other model's words

1. Everything stands on one object: the paper lemma E ≥ L together with the inner identity. The new argument uses the
   multipliers λ as information where the October proof used them only as slack, so it leans on that object harder.
2. The cutoff is tuned to the last half site. At n = 20,700: W = 75.5 against 2n/548 = 75.547; 3W = 226.5 against 226.64;
   74.583 against 75. No error was found, and the document now displays the margins 13/274 and 39/274.
3. At n = 1096 the exclusion is sensitive to how the lattice correction is charged to sites: with another sound scheme
   the same three vectors leave 84 cells alive. The document says which scheme it uses.
4. The exact scales m ≥ 2 also need the first run's classification inside the windows, read once.

## What has no need of a reader

Decided in `certs/twelve-blocks-exact.json` with nothing but the definition: V(n) for every n ≤ 95; V(548) ≥ 15,385;
V(548) = 15,756 exactly, with 102 minimising colourings (the last step by a separate judge that proves the October
inequalities again by counting on the 548 sites; its report leads with its gaps).
