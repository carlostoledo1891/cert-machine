# The island model's depths — licence and limits

The files `island/*.png` and `beaches.json` in this directory are **derived from nautical chart 1902 of the
Brazilian Navy** (Diretoria de Hidrografia e Navegação — DHN / Centro de Hidrografia da Marinha, 1:100 000)
and its soundings, with GMRT (CC BY 4.0) outside the chart's coverage.

- **Non-commercial use only.** Commercial use of DHN chart data is licensed by the Navy (through EMGEPRON);
  these derived files are not covered by this repository's MIT licence and may not be used commercially.
- **NOT FOR NAVIGATION.** They are inputs to a linear wave model; depths inside 10 m are a fitted Dean profile,
  not soundings.
- © Marinha do Brasil — DHN. GMRT: Ryan et al. (2009), Global Multi-Resolution Topography, CC BY 4.0.

Swell's code (everything else under `apps/swell/` that is not data) is MIT. A commercial use of the method
needs licensed bathymetry (a DHN data purchase or a survey) — the same pipeline re-runs on it.
