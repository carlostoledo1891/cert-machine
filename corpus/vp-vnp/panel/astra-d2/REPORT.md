**COMPUTED.** The full solution space has dimension **7 at \(\mu=2\)** and **1 at \(\mu=3\)**.

| \(\mu\) | Unknowns | Equations | Exact rank | Dimension |
|---:|---:|---:|---:|---:|
| 2 | 120 | 864 | 113 | **7** |
| 3 | 130,816 | 8,580,096 | 130,815 | **1** |

The counts use each unordered transversal direction pair at every basepoint. Exact rational elimination covered every translation character, and a separate elimination on the original 120 variables confirmed the \(\mu=2\) result. The function \(R(x,y)=\operatorname{rk}(x-y)\) passed direct evaluation on every equation at both sizes.

**REASONED.** At \(\mu=3\), \(R\) therefore spans the full solution space, confirming the conclusion of Steps 4–7. At \(\mu=2\), a basis consists of \(R\) and the six functions
\[
E_S(x,y)=\mathbf 1_{\{x+y=S\}}\,(-1)^{\operatorname{tr}(S^{-1}x)},
\qquad S\in\mathrm{GL}_2(\mathbb F_2),
\]
with trace in \(\mathbb F_2\). Each \(E_S\) is supported on a different invertible displacement and gives opposite signs to the two diagonals of every transversal quadrilateral with that displacement.

[Report](/Users/carlostoledo/Projects/cert-machine/notes/vp-vnp-blind-2026-11-23/astra-d2/work/REPORT.md) · [Code](/Users/carlostoledo/Projects/cert-machine/notes/vp-vnp-blind-2026-11-23/astra-d2/work/check_d2.py) · [Full output](/Users/carlostoledo/Projects/cert-machine/notes/vp-vnp-blind-2026-11-23/astra-d2/work/OUTPUT.txt)