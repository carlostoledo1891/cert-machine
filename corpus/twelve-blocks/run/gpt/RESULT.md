# Twelve blocks at finite length

**The twelve-block coloring is globally optimal at every even scale m≥118 and odd scale m≥123. The run also determines the exact optimum for every integer length n≥92,000.**

Let M count monochromatic three-term progressions with positive difference, let V(n) be its minimum over all binary colorings of 1 through n, and put f(n)=117n²/2192−n/2.

| Domain | Exact result |
| --- | --- |
| n=548m, even m≥118 | V(n)=f(n). The two labeled minimizers are the twelve blocks and their color exchange. |
| n=548m, odd m≥123 | V(n)=f(n)+1. There are 102 labeled minimizers, obtained from 51 boundary masks and their color exchanges. |
| Every n≥92,000 | V(n)=f(n)+c_r/2192 for r=n mod 1096. The [residue table](optimum-residues.json) gives c_r, the number of labeled minimizers and a witness for every r. |
| Every m≥1 | At even scales the twelve blocks are within 14 progressions of optimal. At odd scales they are within 16. |
| Every n≥1 | f(n)−281/16 ≤ V(n) ≤ f(n)+1453/137. |

For example, V(92,000)=451,727,723, attained by four labeled colorings. At n=92,284, moving six rounded boundaries by one site saves 10 progressions. That coloring and seven further large-length examples were recounted by the control room.

The continuum certificates give a lower bound in terms of the squared distance to the ideal blocks. An exact lattice identity controls the error from rounding. Together they force all minimizing defects to occur near the eleven boundaries. Near each boundary, fix the signed numbers of flipped even and odd sites. Moving flips of each parity towards the boundary strictly improves the count whenever the original positions had gaps or cancellations. This reduces the unrestricted calculation to minimizing a positive definite quadratic in 22 integer variables per residue.

## Proofs and replay

- [The arbitrary-length periodic optimum](periodic-optimum.md) gives the localization, period transfer, lattice problem and table format. Run `python3 -B residue_optima.py`.
- [The global twelve-block proof](global.md), [the parity-specific pruning step](sharper-cutoffs.md), and [the final cutoff improvement](../claude/NOTES-alln.md) give the even and odd thresholds. Run `python3 -B global_core.py` and `python3 -B review_alln.py`.
- [The window proof](windows.md) classifies the 51 masks. [The integer penalties](even-penalties.md) explain even-scale uniqueness. Run `python3 -B window_core.py` and `python3 -B penalty_check.py`.
- [The all-length continuum and lattice bounds](../claude/NOTES-alln.md) and [the rounded construction](rounding.md) give the uniform inequalities. The other track's standalone replay is `python3 -B ../claude/core_alln.py`.
- Run `python3 -B falsifiers.py` to reproduce the midpoint, diagonal, zero-difference, tie-count, first-boundary swap and rounding-sign controls.

The sufficient cutoffs leave exact optimality of B_m open here at even m≤116 and odd m≤121. The 1,096-class formula for V(n) happens to match all 45 small-length reference values recorded in this run. Its multiplicities already differ at n=1. The proof relies on exact computational certificates and written mathematical arguments. The certificates, code and cross-track reviews in this run have not been externally refereed.
