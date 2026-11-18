import IntMulBridge.Bounds
import IntMulBridge.Encodings
import IntMulBridge.Finite

/-!
# The community release proves the other release's challenge statement

`SubNLogN.Challenge.IntMulSubNLogN` (the statement file `SubNLogN/Challenge.lean`, imported as it
was written) from the community release's own machine and time bound:

1. `IntMulBridge.mulInTimeFinite` (`Finite.lean`): the community machine, its time function in
   `O(n (log n) ^ (1 - 4222422970 / 2 ^ 46))`, and every stack alphabet finite;
2. `IntMulEnc.reencode` (`Encodings.lean`): the same machine behind a prelude that reads the
   separated encoding `encodeNatPair`, at `c * (L + 2)` more steps on inputs one symbol longer;
3. `IntMulEnc.bigO_shift` (`Encodings.lean`): the bound survives that shift (the saving is `≤ 1`);
4. `IntMulBridge.community_to_natForm` (`Bounds.lean`): the real `O`-bound at the community saving
   gives the challenge's inequality in `ℕ` at saving `2 ^ (-46)`.
-/

theorem IntMulBridge.community_proves_challenge : SubNLogN.Challenge.IntMulSubNLogN := by
  obtain ⟨M, hfin, hbig⟩ := IntMulBridge.mulInTimeFinite
  obtain ⟨M', hfin', c, hc⟩ := IntMulEnc.reencode Computability.encodingNatBool.encode
    (fun p : ℕ × ℕ => p.1 * p.2) M hfin
  have hbig' := IntMulEnc.bigO_shift M.time M'.time (4222422970 / 2 ^ 46 : ℝ) (by norm_num) c hc hbig
  have hnat : IntMulBridge.NatForm M'.time := IntMulBridge.community_to_natForm M'.time hbig'
  unfold SubNLogN.Challenge.IntMulSubNLogN
  exact ⟨M', hfin', hnat⟩

#print axioms IntMulBridge.community_proves_challenge
#print axioms IntMulBridge.mulInTimeFinite
