# Atalaia — a proposed protocol for military drones when the GPS cannot be trusted

**Live, unlisted:** carlostoledo.co/atalaia/ (pt-BR, `noindex`, in no hub and no sitemap). Built 2026-11-15 on the
operator's word ("páginas live não listadas", hosted here; the Atalaia front's sources stay private in
`~/Projects/atalaia`). Written in Portuguese because the operator ruled "Pt-BR for this project" (2026-11-14).

**What it is.** A doctrine page, not a product page: ten rules for planning, flying and checking a drone mission under
GPS jamming or spoofing (four pre-flight laudos in the worst case, a guaranteed area in flight, precision descent only
on the receiver's one-time marker with the pilot's authorization, a sealed record anyone can re-check, receive-only),
shown on a hypothetical resupply mission in Blumenau (SC) and tested in simulation first.

**Rules that bind this page.**
- The battalion the operator is talking to is **not named** until it agrees; the scenario says only "Blumenau (SC)".
  No installation is plotted: base and post are points chosen on the relief.
- Every mission number is read from `data/` (written by the private generators over the Copernicus GLO-90 relief and the
  DJI FlyCart 30 spec sheet); `data/PROVENANCE.json` pins inputs and records by sha256 and the build refuses a drifted
  record. The build also refuses if a stated verdict (12 kg passes, 30 kg needs data, the serra refuses) stops holding.
- The test results in §5 are LOCUS and Veto records (frontier-apps), each with its stage; nothing on the page has flown.
- Red lines (receive-only, no weapon guidance, no tracking of people) are on the page and do not change.

**Rebuild.** `make page R=apps/atalaia`. To change the scenario, regenerate `data/` from `~/Projects/atalaia`
(`ferramentas/missao.py` → `central.py` → `missao.py`, scenario `ferramentas/cenarios/blumenau.json`) and re-pin.
