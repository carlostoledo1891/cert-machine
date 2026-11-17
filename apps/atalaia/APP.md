# Atalaia — a proposed protocol for military drones when the GPS cannot be trusted

**Live, unlisted:** carlostoledo.co/atalaia/ (pt-BR, `noindex`, in no hub and no sitemap). Built 2026-11-15 on the
operator's word ("páginas live não listadas", hosted here; the Atalaia front's sources stay private in
`~/Projects/atalaia`). Written in Portuguese because the operator ruled "Pt-BR for this project" (2026-11-14).

**What it is.** A doctrine page, not a product page. Since v0.2 (2026-11-15, on the operator's word) it is a
*minuta*, a draft doctrinal protocol for review. It keeps six parts apart:
- principles (ten);
- responsibilities (five layers plus outside verification, five resilience dimensions);
- procedures: four questions before flight (viability, resilience, safety, auditability) and six mission states with
  action and authority agreed before flight;
- technical requirements: what the guaranteed area guarantees and under which hypotheses, and why message
  authentication is not position integrity;
- validation criteria (four qualification stages);
- governance.

Every claim carries one of three maturity levels (Demonstrado / Validado em campo / Proposto). The stat strip counts
them as the page is built. The build refuses any claim marked field-validated, because nothing has flown. The worked
mission is a hypothetical resupply in Blumenau (SC), in simulation first. Every outside fact (FM 3-14, CALL 18-28,
Belfer 2026, FAA, OSNMA, ICA 100-40 of 2026, RBAC nº 100, EB20-MF-10.102, PDDMT 2025) is cited with a link on the
page.

**Rules that bind this page.**
- The battalion the operator is talking to is **not named** until it agrees; the scenario says only "Blumenau (SC)",
  and the page says "a unidade", never "o batalhão". No person from the unit is named anywhere in this repository
  (page, data, code, commit messages). No installation is plotted: base and post are points chosen on the relief.
- The page does not mention the outside review that shaped v0.2.
- Every mission number is read from `data/` (written by the private generators over the Copernicus GLO-90 relief and the
  DJI FlyCart 30 spec sheet); `data/PROVENANCE.json` pins inputs and records by sha256 and the build refuses a drifted
  record. The build also refuses if a stated verdict (12 kg passes, 30 kg needs data, the serra refuses) stops holding.
- The test results in §5 are LOCUS and Veto records (frontier-apps), each with its stage; nothing on the page has flown.
- Red lines (receive-only, no weapon guidance, no tracking of people) are on the page and do not change.

**Three pages, one reading of the records (v0.4.1, 2026-11-16, D31).** `/atalaia/` (landing.js, the short story and
four pre-rendered replays), `/atalaia/doutrina/` (build.js, the minuta) and `/atalaia/eb/` (eb.js, for military
interlocutors: an independent proposal with no Army endorsement, no coat of arms or Army visual identity, zero flights
validated, and one ask — a preliminary technical evaluation with no commitment; it compares the protocol with the 2025
ESAO constructive simulation the minuta cites, Souza e Burity, in the study's own words). All three are unlisted and read
`registros.js`: the pins, the verdicts the pages state, the version, and each test result written once (`EVID`), so the
pages cannot state one result two ways. The position region is the "região de proteção" since v0.4.1, defined in §8
at its two levels (deterministic under declared bounds, probabilistic under the declared noise model).

**The marketing pages (v0.5, 2026-11-16).** `/atalaia/` is now the landing for investors (landing.js): the hero
with MARCA.lema, the problem, the four films (each captioned with the verdict its record states), how it works with
the R1 drawing from nucleo-esquemas.js, the missions gallery, the proof strip, what is different, silent by default
and the active module (proposed; the operator's rule of 2026-11-16 put its capabilities and the test bench on the
public site), the business model (proposed), the roadmap and its gates, a short FAQ, the latest posts, the technical
pages and the contact card. Behind it: `/atalaia/missoes/` and one page per mission (missoes.js),
`/atalaia/investidores/` (investidores.js) and `/atalaia/blog/` with its posts (blog.js). All unlisted, like every
page here. Their words and numbers come from `data/missoes.json` (pinned in PROVENANCE.json) and `conteudo/`
(lp.json, investidores.json, blog/*.md), read once in vitrine.js, which also holds the five stage chips (simulation,
real data, calculation, published by others, illustrative: no two share a look), the sub-navigation, the footer with
MARCA.sinais and the names guard (a page that names what the project keeps private refuses to be written). A
missing content file leaves its page out; `ATALAIA_STUBS=<folder outside the repo>` builds drafts from stub files
of the same shape, and those drafts are never committed.

**The hero film and the share cards (2026-11-16).** The landing's hero carries the hills mission's film (the attack
case) beside the headline on a desk and under it on a phone, its 16:9 box reserved, played only on screen and never
under reduced motion. Each marketing page names its own light card (cartoes.js, drawn from the records, rendered by
`node tools/build-og-report.js atalaia atalaia-missoes atalaia-investidores atalaia-en atalaia-en-missoes
atalaia-en-investidores`); vitrine.js checks each card against its receipt and copies it to site/atalaia/og/.

**The English mirror (2026-11-16).** `/atalaia/en/` repeats the landing, the missions (index and ten pages), the
investors' page and the blog (index and five posts), same structure, slugs and design, unlisted, each page with a
PT | EN switch to its counterpart; links to the technical pages (Núcleo, doutrina, EB) stay on the Portuguese pages,
marked (PT). The words live in conteudo/en/ (lp.json and investidores.json mirror their Portuguese files key by key,
blog/*.md mirror the posts file by file, missoes.json carries only the missions' words). lingua.js is the guard: an
English string whose numbers differ from the Portuguese one beside it, a stage of another kind, a source naming other
files, "certif…", "the first" or an em dash refuses the build; the missions' values, units, stages, verdicts and times
are read from the pinned record and localized by rule, never retyped. `node apps/atalaia/lingua.js` runs the same
checks alone. registros.js holds MARCA_EN (the tagline, the family line and the signals sentence in English), once.

**Rebuild.** `make page R=apps/atalaia` (build.js also writes the landing and the EB page). To change the scenario, regenerate `data/` from `~/Projects/atalaia`
(`ferramentas/missao.py` → `central.py` → `missao.py`, scenario `ferramentas/cenarios/blumenau.json`) and re-pin.
