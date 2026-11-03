import OAI.Bridges.AnthropicETH.Reduction

/-!
# RPI-378.3c, part 1: the converter as a function, and its correctness

`conv : List Bool → List Bool` reads Anthropic's word `encClauses 3 φ` and writes ParityLifts'
word `encodeFormula (toFormula φ)` (`conv_encClauses`). It is written in the shape the tree
programs of `Converter/Program.lean` compute:

1. `n` = the number of leading `true`s (the unary `1ⁿ`), `rest` = the word after `1ⁿ0`;
2. `w = wOf n = ⌊log₂ 2n⌋ + 1` (computed as the bit length of `2n`; `wOf_eq`);
3. `chunks (3w) rest`: one chunk of `3w` bits per clause (a fold that carries `3w`);
4. per chunk, three slots of `w` bits; each nonzero slot `v = 2i + 1 + b` becomes the literal
   `(i, b)`, read as `b = ¬ (lowest bit)` and `i = val(remaining bits) − b`. The value is computed
   by a fold capped at `2n + 2` (`capVal`), so every intermediate number stays polynomial on every
   input, and the cap is inactive on valid input;
5. output `encodeNat n ++ encodeNat m ++ ⋯`, each clause as `encodeNat len ++ ⋯ (encodeNat i ++ [b])`.
-/

namespace OAI.Bridges.AnthropicETH.Conv

open OAI.ParityWL.Complexity

/-! ## Definitions -/

/-- Lowest bit first. -/
def valBits : List Bool → ℕ
  | [] => 0
  | b :: bs => b.toNat + 2 * valBits bs

/-- One step of the capped reading: `(cap, acc) ↦ (cap, min cap (2 acc + b))`. -/
def capStep (x : Bool × (ℕ × ℕ)) : ℕ × ℕ := (x.2.1, min x.2.1 (x.2.2 + x.2.2 + x.1.toNat))

/-- `min cap (valBits bs)`, read from the highest bit down (`capVal_eq`). -/
def capVal (x : List Bool × ℕ) : ℕ := (x.1.reverse.foldl (fun s b => capStep (b, s)) (x.2, 0)).2

/-- The literal `(i, b)` of a slot holding `2i + 1 + b` (with the cap `x.2`). -/
def slotLit (x : List Bool × ℕ) : ℕ × Bool :=
  (capVal (x.1.tail, x.2) - (if x.1.headD false then 0 else 1), !x.1.headD false)

/-- A literal in ParityLifts' encoding. -/
def litBits (x : List Bool × ℕ) : List Bool := encodeNat (slotLit x).1 ++ [(slotLit x).2]

/-- Keep a slot iff it is nonzero. -/
def sel (p : List Bool) : List (List Bool) := if p.any id then [p] else []

/-- The nonzero slots of a chunk, in order. -/
def pieces (c : List Bool) (w : ℕ) : List (List Bool) :=
  sel (c.take w) ++ (sel ((c.drop w).take w) ++ sel (((c.drop w).drop w).take w))

/-- One clause in ParityLifts' encoding; `x = (chunk, (w, cap))`. -/
def clauseOut (x : List Bool × (ℕ × ℕ)) : List Bool :=
  encodeNat (pieces x.1 x.2.1).length ++
    ((pieces x.1 x.2.1).map (fun p => litBits (p, x.2.2))).flatten

/-- One chunking step; the state is `(W, rest, chunks so far, reversed)`. -/
def chunkStep (s : ℕ × (List Bool × List (List Bool))) : ℕ × (List Bool × List (List Bool)) :=
  if s.2.1 = [] then s else (s.1, (s.2.1.drop s.1, s.2.1.take s.1 :: s.2.2))

/-- Cut `rest` into chunks of `W` bits. -/
def chunks (W : ℕ) (rest : List Bool) : List (List Bool) :=
  (rest.foldl (fun s _ => chunkStep s) (W, (rest, []))).2.2.reverse

/-- The slot width: `1` if `n = 0`, else the bit length of `2n`. -/
def wOf (n : ℕ) : ℕ := if n = 0 then 1 else (n + n).bits.length

/-- The converter. -/
def conv (x : List Bool) : List Bool :=
  encodeNat (truePrefix x) ++
    (encodeNat (chunks (wOf (truePrefix x) + wOf (truePrefix x) + wOf (truePrefix x))
        (x.drop (truePrefix x + 1))).length ++
      ((chunks (wOf (truePrefix x) + wOf (truePrefix x) + wOf (truePrefix x))
        (x.drop (truePrefix x + 1))).map
          (fun c => clauseOut (c, (wOf (truePrefix x), truePrefix x + truePrefix x + 2)))).flatten)

/-! ## Arithmetic facts -/

theorem wOf_eq (n : ℕ) : wOf n = Nat.log2 (2 * n) + 1 := by
  unfold wOf
  split_ifs with h
  · subst h; simp
  · have hm : n + n ≠ 0 := by omega
    rw [Nat.size_eq_bits_len, show 2 * n = n + n by ring]
    apply le_antisymm
    · exact Nat.size_le.2 ((Nat.log2_lt hm).1 (Nat.lt_succ_self _))
    · have := (Nat.log2_lt hm).2 (Nat.lt_size_self (n + n))
      omega

theorem wOf_pos (n : ℕ) : 0 < wOf n := by rw [wOf_eq]; omega

theorem lt_two_pow_wOf {n : ℕ} (hn : n ≠ 0) : 2 * n < 2 ^ wOf n := by
  rw [wOf_eq]; exact (Nat.log2_lt (by omega)).1 (Nat.lt_succ_self _)

theorem toNat_testBit_zero (v : ℕ) : (v.testBit 0).toNat = v % 2 := by
  rw [Nat.testBit_zero]
  rcases Nat.mod_two_eq_zero_or_one v with h | h <;> simp [h]

/-- The bits `(range w).map v.testBit` (lowest first) read back as `v` when `v < 2^w`. -/
theorem valBits_testBits (w : ℕ) : ∀ v : ℕ, v < 2 ^ w →
    valBits ((List.range w).map v.testBit) = v := by
  induction w with
  | zero => intro v hv; simp at hv; subst hv; rfl
  | succ w ih =>
    intro v hv
    rw [List.range_succ_eq_map, List.map_cons, List.map_map, valBits]
    have hf : (v.testBit ∘ Nat.succ) = (v / 2).testBit := by
      funext j; simp [Nat.testBit_succ]
    rw [hf, ih (v / 2) (by rw [pow_succ] at hv; omega), toNat_testBit_zero]
    omega

theorem testBits_tail (w v : ℕ) :
    ((List.range (w + 1)).map v.testBit).tail = (List.range w).map (v / 2).testBit := by
  rw [List.range_succ_eq_map, List.map_cons, List.tail_cons, List.map_map]
  congr 1; funext j; simp [Nat.testBit_succ]

theorem testBits_headD (w v : ℕ) :
    ((List.range (w + 1)).map v.testBit).headD false = v.testBit 0 := by
  rw [List.range_succ_eq_map]; rfl

theorem any_eq_valBits (bs : List Bool) : bs.any id = decide (valBits bs ≠ 0) := by
  induction bs with
  | nil => rfl
  | cons b bs ih => cases b <;> simp [valBits, ih]

theorem min_cap_double (cap x t : ℕ) :
    min cap (min cap x + min cap x + t) = min cap (x + x + t) := by omega

theorem capVal_eq (bs : List Bool) (cap : ℕ) : capVal (bs, cap) = min cap (valBits bs) := by
  unfold capVal
  rw [List.foldl_reverse]
  induction bs with
  | nil => simp [valBits]
  | cons b bs ih =>
    simp only [List.foldr_cons]
    have h1 : (List.foldr (fun b s => capStep (b, s)) (cap, 0) bs).1 = cap := by
      clear ih
      induction bs with
      | nil => rfl
      | cons c cs ih' => exact ih'
    rw [capStep]
    simp only [h1, ih, valBits]
    rw [min_cap_double]
    congr 1; ring

/-! ## Correctness on one slot -/

/-- Anthropic's slot `w` bits for the optional literal `o`. -/
def slotBits {n : ℕ} (w : ℕ) (o : Option (MainResults.Lit n)) : List Bool :=
  (List.range w).map (MainResults.slot o).testBit

theorem slot_lt {n : ℕ} (o : Option (MainResults.Lit n)) : MainResults.slot o < 2 ^ wOf n := by
  cases o with
  | none => simp [MainResults.slot]
  | some l =>
    have hn : n ≠ 0 := fun h => by subst h; exact l.1.elim0
    have := lt_two_pow_wOf hn
    have := l.1.isLt
    cases h : l.2 <;> simp [MainResults.slot, h] <;> omega

theorem sel_slotBits_none {n : ℕ} : sel (slotBits (n := n) (wOf n) none) = [] := by
  simp [sel, slotBits, MainResults.slot]

theorem sel_slotBits_some {n : ℕ} (l : MainResults.Lit n) :
    sel (slotBits (wOf n) (some l)) = [slotBits (wOf n) (some l)] := by
  have h := valBits_testBits _ _ (slot_lt (some l))
  simp only [sel, any_eq_valBits, slotBits] at h ⊢
  rw [h]
  simp [MainResults.slot]

theorem litBits_slotBits {n : ℕ} (l : MainResults.Lit n) :
    litBits (slotBits (wOf n) (some l), n + n + 2) = encodeNat l.1.val ++ [l.2] := by
  obtain ⟨w, hw⟩ : ∃ w, wOf n = w + 1 := ⟨wOf n - 1, by have := wOf_pos n; omega⟩
  have hlt := slot_lt (some l)
  rw [hw] at hlt
  have hvdef : MainResults.slot (some l) = 2 * l.1.val + 1 + l.2.toNat := rfl
  have hi := l.1.isLt
  have htail : valBits ((List.range w).map (MainResults.slot (some l) / 2).testBit) =
      MainResults.slot (some l) / 2 :=
    valBits_testBits _ _ (by rw [pow_succ] at hlt; omega)
  have hhead : (MainResults.slot (some l)).testBit 0 = !l.2 := by
    rw [Nat.testBit_zero, hvdef]; cases h : l.2 <;> simp; omega
  unfold litBits slotLit
  rw [slotBits, hw, testBits_tail, testBits_headD, capVal_eq, htail, hhead, Bool.not_not]
  congr 2
  rw [hvdef]
  cases h : l.2 <;> simp <;> omega

/-! ## Correctness on one clause -/

/-- Anthropic's chunk for one clause. -/
def clauseBits {n : ℕ} (C : List (MainResults.Lit n)) : List Bool :=
  (List.range 3).flatMap fun j => slotBits (wOf n) C[j]?

theorem clauseBits_eq {n : ℕ} (C : List (MainResults.Lit n)) :
    clauseBits C = slotBits (wOf n) C[0]? ++ (slotBits (wOf n) C[1]? ++ slotBits (wOf n) C[2]?) := by
  simp [clauseBits, List.range_succ]

theorem slotBits_length {n : ℕ} (w : ℕ) (o : Option (MainResults.Lit n)) :
    (slotBits w o).length = w := by simp [slotBits]

theorem clauseBits_length {n : ℕ} (C : List (MainResults.Lit n)) :
    (clauseBits C).length = wOf n + wOf n + wOf n := by
  rw [clauseBits_eq]; simp [slotBits_length]; ring

theorem pieces_clauseBits {n : ℕ} (C : List (MainResults.Lit n)) :
    pieces (clauseBits C) (wOf n) =
      sel (slotBits (wOf n) C[0]?) ++ (sel (slotBits (wOf n) C[1]?) ++ sel (slotBits (wOf n) C[2]?)) := by
  rw [clauseBits_eq, pieces]
  simp [List.take_left' (slotBits_length _ _), List.drop_left' (slotBits_length _ _),
    List.take_of_length_le (le_of_eq (slotBits_length _ _))]

theorem clauseOut_clauseBits {n : ℕ} (C : List (MainResults.Lit n)) (hC : C.length ≤ 3) :
    clauseOut (clauseBits C, (wOf n, n + n + 2)) = encodeClause (toClause C) := by
  unfold clauseOut encodeClause
  rw [pieces_clauseBits, toClause_literals hC]
  match C, hC with
  | [], _ => simp [sel_slotBits_none]
  | [a], _ => simp [sel_slotBits_none, sel_slotBits_some, litBits_slotBits]
  | [a, b], _ => simp [sel_slotBits_none, sel_slotBits_some, litBits_slotBits]
  | [a, b, c], _ => simp [sel_slotBits_some, litBits_slotBits]

/-! ## Chunking -/

theorem foldl_const {α β : Type} (g : β → β) (xs : List α) (s : β) :
    xs.foldl (fun s _ => g s) s = g^[xs.length] s := by
  induction xs generalizing s with
  | nil => rfl
  | cons a xs ih => simp [ih, Function.iterate_succ_apply]

theorem chunkStep_iter {W : ℕ} (cs : List (List Bool)) (hcs : ∀ c ∈ cs, c.length = W)
    (hcne : ∀ c ∈ cs, c ≠ []) (acc : List (List Bool)) :
    chunkStep^[cs.length] (W, (cs.flatten, acc)) = (W, ([], cs.reverse ++ acc)) := by
  induction cs generalizing acc with
  | nil => rfl
  | cons c cs ih =>
    rw [List.length_cons, Function.iterate_succ_apply]
    have hne : c ++ cs.flatten ≠ [] := by simp [hcne c List.mem_cons_self]
    have hcW := hcs c List.mem_cons_self
    have hstep : chunkStep (W, ((c :: cs).flatten, acc)) = (W, (cs.flatten, c :: acc)) := by
      simp only [chunkStep, List.flatten_cons, hne, ↓reduceIte]
      rw [← hcW, List.drop_left, List.take_left]
    rw [hstep, ih (fun c' h => hcs c' (List.mem_cons_of_mem c h))
      (fun c' h => hcne c' (List.mem_cons_of_mem c h))]
    simp

theorem chunks_flatten {W : ℕ} (cs : List (List Bool)) (hcs : ∀ c ∈ cs, c.length = W)
    (hW : 0 < W) : chunks W cs.flatten = cs := by
  have hcne : ∀ c ∈ cs, c ≠ [] := fun c h hc => by have := hcs c h; simp [hc] at this; omega
  have hlen : cs.length ≤ cs.flatten.length := by
    rw [List.length_flatten]
    have : ∀ c ∈ cs, 1 ≤ c.length := fun c h => by rw [hcs c h]; exact hW
    calc cs.length = (cs.map fun _ => 1).sum := by simp
      _ ≤ (cs.map List.length).sum := List.sum_le_sum (by simpa using this)
  unfold chunks
  rw [foldl_const, show cs.flatten.length = (cs.flatten.length - cs.length) + cs.length by omega,
    Function.iterate_add_apply, chunkStep_iter cs hcs hcne,
    Function.iterate_fixed (by simp [chunkStep])]
  simp

/-! ## The converter on Anthropic's words -/

theorem truePrefix_replicate (n : ℕ) (r : List Bool) :
    truePrefix (List.replicate n true ++ false :: r) = n := by
  induction n with
  | zero => rfl
  | succ n ih => simp [List.replicate_succ, truePrefix, ih]

theorem drop_header (n : ℕ) (r : List Bool) :
    (List.replicate n true ++ false :: r).drop (n + 1) = r := by
  induction n with
  | zero => rfl
  | succ n ih => simpa [List.replicate_succ] using ih

theorem encClauses_eq {n : ℕ} (φ : MainResults.CNF n) :
    MainResults.encClauses 3 φ = List.replicate n true ++ false :: (φ.map clauseBits).flatten := by
  unfold MainResults.encClauses
  rw [List.flatMap_def]
  congr 3
  apply List.map_congr_left
  intro C _
  simp [clauseBits, slotBits, wOf_eq]

/-- **Converter correctness.** On Anthropic's word for a formula whose clauses have at most three
literals, `conv` writes ParityLifts' word for the same formula. -/
theorem conv_encClauses {n : ℕ} (φ : MainResults.CNF n) (hφ : ∀ C ∈ φ, C.length ≤ 3) :
    conv (MainResults.encClauses 3 φ) = encodeFormula (toFormula φ) := by
  have hW : 0 < wOf n + wOf n + wOf n := by have := wOf_pos n; omega
  have hch : chunks (wOf n + wOf n + wOf n) (φ.map clauseBits).flatten = φ.map clauseBits :=
    chunks_flatten _ (by simp [clauseBits_length]) hW
  rw [encClauses_eq]
  unfold conv
  rw [truePrefix_replicate, drop_header, hch]
  simp only [encodeFormula, toFormula_length, List.length_map, List.map_map, List.append_assoc]
  congr 2
  rw [toFormula, List.flatMap_def, List.map_map]
  congr 1
  apply List.map_congr_left
  intro C hC
  exact clauseOut_clauseBits C (hφ C hC)

end OAI.Bridges.AnthropicETH.Conv
