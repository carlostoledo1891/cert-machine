# Third verification (main session, 21 Oct 2026), no code shared with src/ or checker/

- `basic_checks.py`: degree 32, triangle-free, multiplier automorphisms {±1, ±13, ±37, ±71} of Cay(Z_240, ±S), and the Delsarte LP bound (67.6, so useless here).
- `bbmis.c`: my own exact "independent set of size >= t?" decider (bitset branch and bound, greedy-colouring bound).
  `test_bbmis.py` validates it against brute force on 300 random graphs (targets alpha and alpha+1, witnesses checked) and on Cay(Z_13, ±{1,5}).
- `drive.py K workers`: orbital branching on the stabilizer of vertex 0 (multipliers), then a split on the smallest next vertex. Every YES witness is re-checked in Python.
  - `python3 drive.py 32 4 400 stop` finds and verifies a 32-set, so the pipeline does find sets.
  - `python3 drive.py 33 4` proves alpha < 33: all 1,665 jobs NO, 0 errors, 1,049 s (`k33.log`).
- `mcq_rerun_k34.log`: fresh compile and re-run of `checker/check_ramsey.py` on the R(3,34) certificate: VERIFIED in 487 s.

Conclusion: alpha = 32 (each neighbourhood is an independent 32-set), so R(3,33) >= 241 and R(3,34) >= 241 directly.
Burr–Erdős–Faudree–Schelp (Utilitas Math. 35, 1989): r(m,n) >= r(m,n-1) + 2m - 3, so R(3,34) >= 244.
