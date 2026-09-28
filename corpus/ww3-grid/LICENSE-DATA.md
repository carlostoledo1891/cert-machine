# Licence of the extracted series

The monthly files in `months/` are significant wave height values extracted from the
Ifremer WAVEWATCH III hindcast **GLOBMULTI_ERA5_GLOBCUR_01** (GLOB-30M), the dataset of
Reis, Guimarães et al., Ocean Engineering 359 (2026) 125841.

- Dataset: Accensi, M. GLOBMULTI_ERA5_GLOBCUR_01. IFREMER.
  https://doi.org/10.12770/857a3337-f59a-481a-bf98-5561e8b61e7b
- Model: Alday, M., Accensi, M., Ardhuin, F., Dodet, G. (2021). A global wave parameter
  database for geophysical applications. Part 3: Improved forcing and spectral resolution.
  Ocean Modelling 166, 101848.
- Licence: **Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)**, as the
  Sextant record states. The extracted series are a derivative and are shared under the same
  licence: https://creativecommons.org/licenses/by-sa/4.0/

What was changed: nothing but selection. The int16 values of `hs` at the grid points named in
`points.json` are kept raw (Hs = raw / 500 m; −32767 is the fill value), with the time axis and
the sha256 of the compressed chunks they were read from. The code that extracted them
(`tools/fetch-ww3-points.py`) is MIT, like the rest of this repository.
