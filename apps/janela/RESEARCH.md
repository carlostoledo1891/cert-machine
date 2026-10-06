# Janela — the sourced findings its numbers stand on

Read 2026-10-06. Every load-bearing claim is from a primary text that was read; what was
not read says so.

## The standard
- **DNV-OS-H101 (Oct 2011), Sec.4** — read verbatim (pinned: `scenario/rules/dnv-alpha.json`).
  - B501: weather-restricted if TR < 96 h and TPOP < 72 h. B402: TR ≥ 2·TPOP if TC is not assessed.
  - B701: OPWF = α·OPLIM. B704: "The expected uncertainty in the weather forecast should be calculated
    based on statistical data for the actual site and the operation schedule, i.e. TPOP." Guidance note:
    P(exceeding OPLIM by more than 50%) < 10⁻⁴. B705: the tables are for the North Sea and Norwegian Sea,
    "a guideline for other offshore areas". B706: period uncertainty matters for swell-sensitive operations.
  - Tables 4-1 … 4-6 transcribed and checked against the text.
- **DNVGL-ST-N001** (current edition 2023-12) carries the scheme; its §2.6.8–2.6.10 wording was NOT read.

## How the tables were made
- The 2005–07 DNV joint industry project (report 2006-1756, not public), as reconstructed by
  **Wilcken (2012)**, University of Stavanger MSc thesis, §4.1, hdl.handle.net/11250/182992 — read.
  The 1e-4 is on the largest individual wave (Rayleigh), the forecast error is Gaussian with the
  project's bias and SD by observed-Hs group and lead (Table 10), half of a positive bias is used.
- Re-implemented here (`audit/alpha.py`, standard library only): 16 of 20 cells of Table 4-1 within
  ±0.02, 12 within ±0.01; the 4–6 m rows at 48–72 h come out up to 0.057 LOWER than the table
  (the table is less conservative there). The guidance note read literally reproduces 0 of 20.
- **Natskår, Moan & Alvær (2015)**, Ocean Eng. 108:636–647, doi:10.1016/j.oceaneng.2015.08.034 —
  a ratio/lognormal model on the maximum over the window, Skarv field, truth = a WAM hindcast;
  "these standards yield conservative results compared with our data set". **Natskår & Moan (2021)**,
  Ocean Eng. 235:109364 — the alpha method "compensates adequately" in a structural reliability model.
- **Wu & Gao (2021)**, Mar. Struct. 79:103050; **Wu, Gao & Zhao (2022)**, Ocean Eng. 260:111801 —
  response-based alpha. **Guachamin Acero et al. (2016)**, Ocean Eng. 125:308–327 — restates the note
  (and wrongly credits Natskår 2015 as the tables' basis).
- Wilcken also derived a SITE alpha for Snøhvit (Barents Sea): up to 0.12 below the standard.

## The limits Janela decides (`scenario/rules/npcp.json`)
- Eleven pinned acts (Capitania dos Portos NPCPs and portarias, one port-authority resolution),
  every table read from the rendered page, every quote checked against the text.
- NPCP-SC is at Mod.21 (Portaria 62/2025, in force 31/07/2025); NPCP-RS at Rev.1/MOD.1 (Portaria
  59/CPRS, in force 15/09/2025); NPCP-SP Portaria 82/2026; NPCP-RJ 3ª Rev. Mod.3 + Portaria 200/2026.
- Terminal Gás Sul's parameters were EXPERIMENTAL and the period ended (30/12/2024 per the NPCP,
  31/12/2024 per Portaria 55/2024); no final parameters found. TEFRAN prints no metocean limit.
- TEBAR must keep a "Protocolo Meteoceanográfico para Operação/Interrupção das Manobras de STS"
  (not published). Sepetiba requires real-time sensors (SISMO).

## The data
- ECMWF open data (CC BY 4.0): archive on Google Cloud from 2023-07-12 and AWS from 2023-01-18;
  layout `0p4-beta` (0.4°) until 2024-02-28, `ifs/0p25` from 2024-02-29 (probed). Wave fields are
  GRIB2 CCSDS simple packing: values are (R + X·2^E)/10^D exactly.
- NOAA/NESDIS RADS-built along-track NRT altimetry (coastwatch.noaa.gov), public domain, from 2020,
  ~0.5 MB per mission-day; integers (swh mm, wind cm/s).
- METAR: only SBLB (platform P-25, Campos) reports offshore; IEM archive from 2023 at least.
- Ifremer WAVEWATCH III GLOBMULTI_ERA5_GLOBCUR_01 (CC BY-SA 4.0): `corpus/ww3-points`, 3-hourly
  1993–2024 at six basin nodes.

## The market (for the product, not for any number on the page)
- Petrobras Business Plan 2026–30: US$9.7 bn decommissioning + well abandonment; 19 units to
  decommission by 2030; 8 new production systems; 40 new support vessels.
- 346 offshore support vessels in Brazil (Riviera, 2026-03-25); PSVs over US$50k/day (2024).
- ANP Res. 817/2020: the decommissioning programme gives an execution-window schedule.
- Competition: DTN markets lowering alpha through forecast quality; StormGeo (owns Climatempo);
  OceanPact; Hidromares (SISMO); Miros. No vendor found publishing verified skill or selling
  site-specific alpha validation (absence of evidence, not proof).

## The operations' own pains (read 2026-10-06, for the app view)
- **Offloading criteria, as published.** Tannuri, Pesce, Simos et al., "Seasonal downtime analysis of DP
  and non-DP offloading", OMAE2010-20147 (USP repository, PDF sha256 ffbc2212…f73a16, read): the wave
  group Hs > 3.5 m and the wind group > 50 knots "are above the offloading limits defined by Petrobras
  regulation"; minimum 50 m between shuttle tanker and FPSO; the tanker kept inside a green zone of
  +45°/−60°; hawser tension above 100 tf is unsafe. Campos downtime for a DP Suezmax at the bow station
  0–7% in summer, 8–16% in winter. A 2010 statement of a 2010 rule: the app cites it as such.
- **"Alívios críticos".** Offloadings close to full storage are an "imminent risk of production loss";
  scheduling is framed around avoiding "parada de produção por falta de espaço" (Garcia Jr., USP TCC,
  Santos, 2020; 21 DP shuttle tankers, ~1,800 offloadings a year then). PPSA's 2022 offloading panel:
  ~50 DP2 shuttle tankers hired for the pre-salt, fleet adequacy an open question; Transpetro ordered
  9 DP2 Suezmax (eixos, 2025-03-18).
- **Equatorial Margin.** Petrobras' CEO on Foz do Amazonas drilling: "com a correnteza atrapalhando";
  the Morpho campaign stretched from 5 to 10 months (eixos, 2026-06-12). Current is the governing
  variable there and is not in Janela's feed.
- **Not found** (absence of evidence): public PSV waiting-on-weather figures, helideck motion tables
  (NORMAM-223 behind Cloudflare), a named case of storage-full curtailment, any Brazilian practice
  of a site-specific DNV alpha.
