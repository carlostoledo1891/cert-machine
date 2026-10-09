# Abatimento — the Registro de Abatimento (Contraprova for Petrobras's CPSI 7004641677)

**Live (after a site build):** carlostoledo.co/abatimento/ (pt-BR). **Built 2026-10-08** as the solution
material for Petrobras's "Aquisição de Soluções" opportunity 7004641677 — *Sistema de cálculo de
potencial de abatimento de emissões (Escopo 1 e 2 abrangendo Emissões Evitadas, Escopo 3 e ACV) de
portifólio de Centro de Pesquisas e Desenvolvimentos* — proposals on Petronect until **2026-10-19 17:00**.

**What it is.** A registry, not a calculator: every abatement potential of a portfolio is a versioned
record (emission source, MACC category, premises as ranges with unit and source, a multilinear formula,
technical and agreed deployment fractions, the published claim), and the kernel DECIDES over the whole
envelope of premises — exact corners in BigInt rationals — the class of potential (the Caderno's own
Incremental / Moderado / Alto), the compatibility of the published point claim, the sum by levels with a
double-counting audit (mutually exclusive technologies on one source; a sum that exceeds what the source
emits), and the diff between versions. For every RECUSADO it names the premise to measure and to what
width (the price of information, by exact bisection).

| verdict | meaning |
|---|---|
| **PROVADO** | the class (or the claim, or the sum) holds for every premise in the declared envelope |
| **REFUTADO** | it fails for every premise — proved, with the witness corners |
| **RECUSADO** | the envelope straddles a threshold (or two exclusive scenarios were summed); the record says what would decide |

## Honest boundaries (on the page)
- Physical factors are pinned public tables (IPCC 2006 Table 2.2 with its 95% limits, GHG Protocol GWPs
  AR5/AR6, MCTI/SIN monthly factors — the last read from a secondary source this version); the activity
  data (gas displaced, MWh, captured CO2) are ILLUSTRATIVE ranges and say so on their line. Not Petrobras data.
- Life-cycle assessment is not computed: an LCA figure enters as a declared range with its study pinned,
  tagged "acv" and summed apart from the operational terms. Non-multilinear formulas are out of this
  version (E3 of the plan: outward-rounded interval arithmetic, flagged "intervalo externo").
- A PROVADO speaks of the declared envelope, not of the world.
- "Certificado", "aprovado", "homologado" never appear as our verdict words.

## Layout
```
engine/abatimento.js   the kernel: Q (exact decimals/rationals), enclose (corners), decideClass,
                       decideClaim, sensitivity + price of information, deploy, aggregate (audit), diff, decide
engine/reference.py    the second implementation (Python stdlib fractions, no shared code)
engine/battery.js      60 checks, 9 reds, reference agreement, 2,400 interior points
data/cenarios.json     the scenarios (8 versions, 4 sources), classes, pinned sources
data/registro-ledger.json   the record build.js re-decides and compares (drift refuses)
registro.js            THE receipt (page, tab, deck, nota share it)
numbers.js             every displayed number, from the records; throws when a record loses its shape
page.js · deck.js · nota.js · proposta.js   the page, the 12-slide deck, the Registro de cálculo (A4),
                       the Proposta Técnica (A4, 3 pages; the commercial section is the proponent's)
build.js               the gated build → site/abatimento/
```
Sources pinned in corpus/sources (PINS.json): ipcc-2006-v2-ch2-stationary-combustion.pdf,
ghgp-gwp-values-2024-08.pdf, petrobras-caderno-clima-2025_text.txt (+ .json with the PDF's sha256).
