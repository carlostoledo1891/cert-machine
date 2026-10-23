# NOTICE — corpus/ramsey/alphaevolve

The 18 adjacency matrices in `graphs/`, `README-ramsey_number_bounds.md`, `README-improved_bounds.md` and
`verify_bounds.ipynb` are Google LLC's, from github.com/google-research/google-research at commit
0d94f8c4d92678ce5f7a0eacae725f79174cfb03 (directory `ramsey_number_bounds/`), licensed under the Apache License 2.0
(`LICENSE`, copied from that repository's root at the same commit). They are copied unmodified; only the graph files
were renamed (`R(s, t) >= m.txt` → `R_s_t_ge_m.txt`), and `PINS.json` records each original path and its sha256.

The graphs and the results they encode are Google's (AlphaEvolve, arXiv 2603.09172). cert-machine adds only its own
decision of each file (instruments/ramsey, tools/run-ramsey-ledger.py, certs/ramsey-ledger.json), which runs none of
the code above: `verify_bounds.ipynb` is kept as a record of what the release ships, not executed.
