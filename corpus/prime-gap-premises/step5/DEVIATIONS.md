# Step 5 — deviations from the package's own instructions (dated 2026-11-12; none touches a byte of the package)

The package (prime-gaps-external-182, release sha256 2960729e…6f3b) is tested by its authors on Apple Silicon macOS with
its bundled libraries. Here it runs on Linux x86-64 (pod p-182), on FLINT v3.6.0 + 7ad753d5 and python-flint 0.9.0
(572c8a21) built from source. `check_package.py` passes on the unpacked tree before and after the run: no package file
is edited. What differs is OUR environment:

1. **Which `flint` is imported.** The package's worker puts its bundled macOS build first on `sys.path`; it cannot load
   on Linux ("invalid ELF header", attempt 1). `step5_flint_shim.py`, loaded by a `.pth` line in each venv, resolves the
   top-level module `flint` from the venv (our build). Attempt 1 used `sitecustomize.py`; Ubuntu ships its own, so the
   shim never loaded and every stage stopped at `import flint` (logs in runs/attempt1). Nothing had been computed.
2. **A library that is hashed, not loaded.** Two producers record the sha256 of `flint/.dylibs/libflint.24.0.dylib` by
   path. A copy of the package's own file is placed there in each venv so the path exists. THE RECORDED HASH THEREFORE
   NAMES THE PACKAGE'S macOS LIBRARY, NOT THE LIBRARY THAT COMPUTED HERE (runs/libraries.sha256 has both). That the
   library that computed carries the signed-FFT repair is shown by function, not by hash: the package's
   `check_certificate_runtime` audit (its 24 exact products) passes on it, and our three-line witness prints the
   correct product on it and the wrong one on the stock wheel.
3. **The obsolete-runtime rejection test.** As shipped it swaps a macOS library file, which changes nothing here.
   `test_rejection_linux.py` is `test_rejection.py` with one change (runs/test_rejection_linux.diff): that one case
   runs under the stock python-flint 0.9.0 wheel. It is rejected, with "signed" in its log, as the test requires.
4. **`/bin/cp -cR`.** `audit.py` and `test_rejection.py` call the macOS clone flag; GNU cp has none. A wrapper at
   /usr/bin/cp drops the `c` (runs/cp-wrapper.sh). The copy is the same files, not cloned.
5. **Python 3.12.3** (the package names 3.12; its acceptance run was 3.12.14), NumPy 2.3.5 as required.
6. `verify.py --jobs 3` (the package allows 1–3).
