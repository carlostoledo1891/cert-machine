# Nonnegative integer penalties at even scales

For any mask in the 44m-site windows at an even scale, the **unscaled** excess D is the sum below. Use the signed window totals z_i, the signed even-minus-odd totals v_i, the matrix A and vectors H, β from windows.md. Let J_i=(H_i−2)(z_i mod 2), J=ΣJ_i and e=(Σz_i mod 2).

| Penalty | Value |
| --- | --- |
| Gaps and cancellations | Σ H_i (holes + lr), over each window i and each site parity |
| Boundary totals | (zᵀAz−J+e)/4 |
| Net parity imbalance | ((Σv_i)²−e)/4 |
| Individual parity imbalances | Σ (H_i v_i²+2β_i v_i+J_i)/4 |

In the first row l and r are the numbers of left and right flips at that parity and window. In each outward sequence a selected zero-based position k contributes the number of skipped positions before it. The sum of these contributions on both sides is **holes**. Summing its linear progression costs differs from the compact cost by exactly H_i(holes+lr) in D. This follows from Σ(2k+1)=l²+2 holes on the left, the identical right-side formula and l²+r²−(l−r)²=2lr.

Every term is a nonnegative integer. In the last row |β_i|=H_i−1 and z_i≡v_i modulo 2. For H_i=2 its numerator is 2v_i(v_i±1); for H_i=3 it is 3v_i²±4v_i+(v_i mod 2). Both are nonnegative multiples of 4. The third row is integral since Σv_i≡e modulo 2. For the second row, 2zᵀKz is divisible by 4 because K is symmetric integral with diagonal 2. Also H_i z_i²−J_i≡2z_i modulo 4 and (Σz_i)²≡e modulo 4. Thus zᵀAz−J+e is divisible by 4.

If zᵀAz>5, then zᵀAz−J>0 since J≤5. Inside the ellipsoid zᵀAz≤5 the exact enumeration in window_core.py finds 21 integer vectors. At zero the difference is zero. At each of the other 20 it is exactly 4. The second row therefore vanishes only at z=0. At that point v_i is even and the last row vanishes only at v=0. The first row then forces the empty mask, since there are zero net charges and lr=0 for each parity and boundary. Adding the four rows recovers D by the compact-cost identity in windows.md.

Replay the finite check from gpt/ with `python3 -B penalty_check.py`.
