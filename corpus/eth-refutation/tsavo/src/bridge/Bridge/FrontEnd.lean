/-
The front end of the bridge: a polynomial-time `pre` that turns Anthropic's plain code of a 3-CNF
(`Sat3.enc φ`: 1ⁿ 0, then three slots of ⌊log₂ 2n⌋+1 bits per clause) into OpenAI's canonical code
of the same formula (`Encoding.encodeCNF`: 1ⁿ 0, then the framed unary codes of the sorted, deduplicated
literal numbers of the sorted, deduplicated clauses).

`pre` is written with the combinators of Anthropic's `PolyT` library (no `match`, no recursion): the
clauses are read with their decoder `Groundwork.Decode.dec`, each clause is mapped to its literal
codes, deduplicated and insertion-sorted, the list of clauses is deduplicated and insertion-sorted in
the lexicographic order, and the result is written out with `flatMap`. Insertion sort is a `foldr` of
an insertion made of `takeWhile`/`dropWhile`; the lexicographic order on `List ℕ` is decided by the
first position where two lists differ (`find?` over `zip`). The unary code of a literal number `k` is
`take k` of a list of `2n+2` ones, built from the header of the input, since `k ≤ 2n+1`.
-/
import MainResults
import ThreeSatRateStatement
import ToTuring.Machine.Host
import ToTuring.Closure.Basic
import ToTuring.Closure.Cases
import ToTuring.Closure.Fold
import ToTuring.Lib.Bool
import ToTuring.Lib.Nat1
import ToTuring.Lib.Nat1b
import ToTuring.Lib.Nat2
import ToTuring.Lib.Int
import ToTuring.Lib.List1
import ToTuring.Lib.List1b
import ToTuring.Lib.List2
import ToTuring.Lib.List3
import ToTuring.Lib.Table
import ToTuring.Lib.Unary
import ToTuring.Poly.Decode
import ToTuring.Poly.Sat
import Bridge.OpenAIStatement

open OAI.Algorithms.SubexponentialSAT Turing Groundwork

namespace Bridge

/-! ## 1. Comparisons and insertion sort in combinator form -/

/-- `a ≤ b` on numbers as a Boolean. -/
def natLeB (a b : ℕ) : Bool := decide (a ≤ b)

@[fun_prop] theorem natLeB_polyT {α : Type} [Enc α] {a b : α → ℕ} (ha : PolyT a) (hb : PolyT b) :
    PolyT fun x => natLeB (a x) (b x) := by
  unfold natLeB; fun_prop

theorem natLeB_iff_le (a b : ℕ) : natLeB a b = true ↔ a ≤ b := by
  simp [natLeB]

/-- `a ≤ b` in the lexicographic order on `List ℕ`, as a Boolean: the first position where the lists
differ decides; if there is none, the shorter list is the smaller. -/
def lexLe (a b : List ℕ) : Bool :=
  ((a.zip b).find? fun p => p.1 != p.2).elim (decide (a.length ≤ b.length)) fun p => decide (p.1 < p.2)

@[fun_prop] theorem lexLe_polyT {α : Type} [Enc α] {a b : α → List ℕ} (ha : PolyT a) (hb : PolyT b) :
    PolyT fun x => lexLe (a x) (b x) := by
  unfold lexLe; fun_prop

theorem lexLe_cons_cons (x y : ℕ) (a b : List ℕ) :
    lexLe (x :: a) (y :: b) = if x = y then lexLe a b else decide (x < y) := by
  unfold lexLe
  by_cases h : x = y
  · subst h
    rw [List.zip_cons_cons, List.find?_cons_of_neg (by simp)]
    simp
  · rw [List.zip_cons_cons, List.find?_cons_of_pos (by simpa using h)]
    simp [h]

theorem lex_cons_cons_iff {x y : ℕ} {a b : List ℕ} :
    List.Lex (· < ·) (y :: b) (x :: a) ↔ y < x ∨ (y = x ∧ List.Lex (· < ·) b a) := by
  constructor
  · intro h
    cases h with
    | rel h => exact Or.inl h
    | cons h => exact Or.inr ⟨rfl, h⟩
  · rintro (h | ⟨rfl, h⟩)
    · exact List.Lex.rel h
    · exact List.Lex.cons h

theorem lexLe_spec : ∀ a b : List ℕ, lexLe a b = true ↔ ¬ List.Lex (· < ·) b a
  | [], b => by simp [lexLe]
  | x :: a, [] => by simp [lexLe]
  | x :: a, y :: b => by
    rw [lexLe_cons_cons, lex_cons_cons_iff]
    by_cases h : x = y
    · subst h
      simp [lexLe_spec a b]
    · have h' : y ≠ x := Ne.symm h
      simp only [h, if_false, decide_eq_true_eq, not_or, h', false_and, not_false_eq_true, and_true]
      omega

/-- `lexLe` decides Mathlib's linear order on `List ℕ` (`a ≤ b ↔ ¬ b < a`, `<` lexicographic). -/
theorem lexLe_iff_le (a b : List ℕ) : lexLe a b = true ↔ a ≤ b := by
  rw [lexLe_spec]
  exact (not_lt : ¬ b < a ↔ a ≤ b)

/-- Insertion of `a` into `l` before the first element `b` with `le a b`. -/
def insertC {β : Type} (le : β → β → Bool) (a : β) (l : List β) : List β :=
  l.takeWhile (fun b => !le a b) ++ a :: l.dropWhile (fun b => !le a b)

/-- Insertion sort: a `foldr` of insertions. -/
def sortBy {β : Type} (le : β → β → Bool) (l : List β) : List β := l.foldr (insertC le) []

theorem len_insertC {β : Type} [Enc β] (le : β → β → Bool) (a : β) (l : List β) :
    len (insertC le a l) = len l + len a + 2 := by
  unfold insertC
  have h1 := len_append (l.takeWhile fun b => !le a b) (a :: l.dropWhile fun b => !le a b)
  have h2 := len_append (l.takeWhile fun b => !le a b) (l.dropWhile fun b => !le a b)
  rw [List.takeWhile_append_dropWhile] at h2
  rw [len_cons] at h1
  omega

theorem insertC_polyT {α β : Type} [Enc α] [Enc β] {le : β → β → Bool}
    (hle : PolyT fun p : β × β => le p.1 p.2) {a : α → β} {l : α → List β} (ha : PolyT a)
    (hl : PolyT l) : PolyT fun x => insertC le (a x) (l x) := by
  have hp : PolyT fun p : α × β => !le (a p.1) p.2 :=
    PolyT.not' (PolyT.comp₂ hle (PolyT.comp ha (PolyT.fst PolyT.id')) (PolyT.snd PolyT.id'))
  unfold insertC
  exact PolyT.append (PolyT.takeWhile (f := fun x b => !le (a x) b) hp hl)
    (PolyT.cons' ha (PolyT.dropWhile (f := fun x b => !le (a x) b) hp hl))

/-- Insertion sort is polynomial-time: every insertion adds the length of one element of the list. -/
theorem sortBy_polyT {α β : Type} [Enc α] [Enc β] {le : β → β → Bool}
    (hle : PolyT fun p : β × β => le p.1 p.2) {l : α → List β} (hl : PolyT l) :
    PolyT fun x => sortBy le (l x) := by
  obtain ⟨s, hs, -, hls⟩ := PolyT.len_bound hl
  unfold sortBy
  refine PolyT.foldr_add (g := fun _ e c => insertC le e c) hl (PolyT.const [])
    (insertC_polyT hle (PolyT.fst (PolyT.snd PolyT.id')) (PolyT.snd (PolyT.snd PolyT.id')))
    ⟨fun n => s n + 2, hs.add (PB.const 2), ?_⟩
  intro x c e he
  have := (len_le_of_mem he).trans (hls x)
  rw [len_insertC]
  show len c + len e + 2 ≤ len c + (s (len x) + 2)
  omega

@[fun_prop] theorem sortNat_polyT {α : Type} [Enc α] {l : α → List ℕ} (hl : PolyT l) :
    PolyT fun x => sortBy natLeB (l x) :=
  sortBy_polyT (by fun_prop) hl

@[fun_prop] theorem sortLex_polyT {α : Type} [Enc α] {l : α → List (List ℕ)} (hl : PolyT l) :
    PolyT fun x => sortBy lexLe (l x) :=
  sortBy_polyT (by fun_prop) hl

/-! ### Insertion sort is Mathlib's, so a sorted deduplicated list is `Finset.sort` -/

theorem insertC_eq_orderedInsert {β : Type} [LinearOrder β] (le : β → β → Bool)
    (hle : ∀ a b, le a b = true ↔ a ≤ b) (a : β) :
    ∀ l : List β, insertC le a l = List.orderedInsert (· ≤ ·) a l
  | [] => rfl
  | b :: l => by
    by_cases h : a ≤ b
    · have hb : le a b = true := (hle a b).2 h
      rw [List.orderedInsert_cons_of_le _ l h]
      simp [insertC, hb]
    · have hb : le a b = false := by
        cases hb : le a b
        · rfl
        · exact absurd ((hle a b).1 hb) h
      rw [List.orderedInsert_of_not_le _ l h, ← insertC_eq_orderedInsert le hle a l]
      simp [insertC, hb]

theorem sortBy_eq_insertionSort {β : Type} [LinearOrder β] (le : β → β → Bool)
    (hle : ∀ a b, le a b = true ↔ a ≤ b) :
    ∀ l : List β, sortBy le l = List.insertionSort (· ≤ ·) l
  | [] => rfl
  | a :: l => by
    show insertC le a (sortBy le l) = List.orderedInsert _ a (List.insertionSort _ l)
    rw [sortBy_eq_insertionSort le hle l, insertC_eq_orderedInsert le hle]

/-- Sorting a deduplicated list gives the sorted list of its set of elements. -/
theorem sortBy_dedup_eq_sort {β : Type} [LinearOrder β] [DecidableEq β] (le : β → β → Bool)
    (hle : ∀ a b, le a b = true ↔ a ≤ b) (L : List β) :
    sortBy le L.dedup = L.toFinset.sort (· ≤ ·) := by
  rw [sortBy_eq_insertionSort le hle]
  refine List.SortedLT.eq_of_mem_iff ?_ (Finset.sortedLT_sort _) fun a => ?_
  · exact List.sortedLE_insertionSort.sortedLT_of_nodup
      ((List.perm_insertionSort _ _).nodup_iff.2 (List.nodup_dedup L))
  · rw [List.mem_insertionSort, List.mem_dedup, Finset.mem_sort, List.mem_toFinset]

/-! ## 2. The front end -/

/-- OpenAI's number of a decoded literal `(i, b)`: `2i + b`. -/
def litCode (l : ℕ × Bool) : ℕ := 2 * l.1 + l.2.toNat

@[fun_prop] theorem litCode_polyT {α : Type} [Enc α] {l : α → ℕ × Bool} (hl : PolyT l) :
    PolyT fun x => litCode (l x) := by
  unfold litCode; fun_prop

/-- The sorted distinct literal numbers of a decoded clause. -/
def clauseCodes (C : List (ℕ × Bool)) : List ℕ := sortBy natLeB (C.map litCode).dedup

@[fun_prop] theorem clauseCodes_polyT {α : Type} [Enc α] {C : α → List (ℕ × Bool)} (hC : PolyT C) :
    PolyT fun x => clauseCodes (C x) := by
  unfold clauseCodes; fun_prop

/-- The sorted distinct clauses, each as its sorted literal numbers. -/
def cnfCodes (ψ : List (List (ℕ × Bool))) : List (List ℕ) := sortBy lexLe (ψ.map clauseCodes).dedup

@[fun_prop] theorem cnfCodes_polyT {α : Type} [Enc α] {ψ : α → List (List (ℕ × Bool))} (hψ : PolyT ψ) :
    PolyT fun x => cnfCodes (ψ x) := by
  unfold cnfCodes; fun_prop

/-- `2n + 2` ones, from the `n` ones of the header of the input. -/
def ones (x : List Bool) : List Bool := (x.takeWhile id).flatMap (fun _ => [true, true]) ++ [true, true]

@[fun_prop] theorem ones_polyT {α : Type} [Enc α] {x : α → List Bool} (hx : PolyT x) :
    PolyT fun y => ones (x y) := by
  unfold ones; fun_prop

/-- OpenAI's unary code of `k`, for `k ≤ 2n + 2`: `k` of the ones, then a zero. -/
def encNat (x : List Bool) (k : ℕ) : List Bool := (ones x).take k ++ [false]

@[fun_prop] theorem encNat_polyT {α : Type} [Enc α] {x : α → List Bool} {k : α → ℕ} (hx : PolyT x)
    (hk : PolyT k) : PolyT fun y => encNat (x y) (k y) := by
  unfold encNat; fun_prop

/-- OpenAI's `frame`: every bit preceded by a one, then a zero. -/
def frame' (bits : List Bool) : List Bool := bits.flatMap (fun b => [true, b]) ++ [false]

/-- OpenAI's `encodeList`: every item as a one and its frame, then a zero. -/
def encList' {β : Type} (enc : β → List Bool) (l : List β) : List Bool :=
  l.flatMap (fun a => true :: frame' (enc a)) ++ [false]

@[fun_prop] theorem encBody_polyT {α : Type} [Enc α] {x : α → List Bool} {L : α → List (List ℕ)}
    (hx : PolyT x) (hL : PolyT L) : PolyT fun y => encList' (encList' (encNat (x y))) (L y) := by
  unfold encList' frame'; fun_prop

/-- The front end: the header `1ⁿ 0` of the input, then the framed unary codes of the sorted
distinct clauses read by Anthropic's decoder. -/
def pre (x : List Bool) : List Bool :=
  x.takeWhile id ++ false :: encList' (encList' (encNat x)) (cnfCodes (Decode.dec x).2)

theorem pre_polyT : PolyT pre := by
  have := Decode.dec_polyT
  unfold pre
  fun_prop

/-! ## 3. Correctness on the codes of 3-CNFs -/

theorem takeWhile_replicate_true (n : ℕ) (l : List Bool) :
    (List.replicate n true ++ false :: l).takeWhile id = List.replicate n true := by
  induction n with
  | zero => simp
  | succ n ih => simp [List.replicate_succ, ih]

theorem takeWhile_enc {n : ℕ} (φ : Sat3.CNF n) : (Sat3.enc φ).takeWhile id = List.replicate n true := by
  unfold Sat3.enc
  exact takeWhile_replicate_true _ _

theorem ones_enc {n : ℕ} (φ : Sat3.CNF n) : ones (Sat3.enc φ) = List.replicate (2 * n + 2) true := by
  unfold ones
  rw [takeWhile_enc, List.flatMap_replicate]
  show (List.replicate n (List.replicate 2 true)).flatten ++ List.replicate 2 true = _
  rw [List.flatten_replicate_replicate, List.replicate_append_replicate]
  congr 1
  omega

theorem encNat_enc {n : ℕ} (φ : Sat3.CNF n) {k : ℕ} (hk : k ≤ 2 * n + 2) :
    encNat (Sat3.enc φ) k = Encoding.encodeNat k := by
  unfold encNat Encoding.encodeNat
  rw [ones_enc, List.take_replicate, Nat.min_eq_left hk]

theorem frame'_eq : ∀ bits : List Bool, frame' bits = Encoding.frame bits
  | [] => rfl
  | b :: bs => by
    rw [frame', List.flatMap_cons, List.append_assoc, ← frame', frame'_eq bs]
    rfl

theorem encList'_eq {β : Type} (enc enc' : β → List Bool) :
    ∀ l : List β, (∀ a ∈ l, enc a = enc' a) → encList' enc l = Encoding.encodeList enc' l
  | [], _ => rfl
  | a :: l, h => by
    have ih := encList'_eq enc enc' l fun b hb => h b (List.mem_cons_of_mem a hb)
    unfold encList'
    rw [List.flatMap_cons, List.append_assoc]
    unfold encList' at ih
    rw [ih, h a List.mem_cons_self, frame'_eq]
    rfl

/-- The sorted literal numbers of a clause with its variables read as numbers are OpenAI's
`clauseNumbers` of the clause as a Finset of literals. -/
theorem clauseCodes_toN {n : ℕ} (C : List (Sat3.Lit n)) :
    clauseCodes (C.map fun l => (l.1.val, l.2)) =
      Encoding.clauseNumbers ((C.map fun l => (⟨l.1, l.2⟩ : SAT.Literal (Fin n))).toFinset) := by
  unfold clauseCodes Encoding.clauseNumbers
  rw [sortBy_dedup_eq_sort natLeB natLeB_iff_le]
  congr 1
  ext k
  simp only [List.map_map, List.mem_toFinset, List.mem_map, Finset.mem_image, Function.comp_def,
    litCode, Encoding.literalCode]
  constructor
  · rintro ⟨⟨i, b⟩, hl, rfl⟩
    exact ⟨⟨i, b⟩, ⟨⟨i, b⟩, hl, rfl⟩, by cases b <;> rfl⟩
  · rintro ⟨_, ⟨⟨i, b⟩, hl, rfl⟩, rfl⟩
    exact ⟨⟨i, b⟩, hl, by cases b <;> rfl⟩

/-- The sorted clauses of the decoded formula are OpenAI's `cnfNumbers` of the Finset formula. -/
theorem cnfCodes_toN {n : ℕ} (φ : Sat3.CNF n) :
    cnfCodes (Decode.toN φ) = Encoding.cnfNumbers
      ((φ.map fun C => (C.map fun l => (⟨l.1, l.2⟩ : SAT.Literal (Fin n))).toFinset).toFinset) := by
  unfold cnfCodes Encoding.cnfNumbers
  rw [sortBy_dedup_eq_sort lexLe lexLe_iff_le]
  congr 1
  ext D
  simp only [Decode.toN, List.map_map, List.mem_toFinset, List.mem_map, Finset.mem_image,
    Function.comp_def, clauseCodes_toN]
  constructor
  · rintro ⟨C, hC, rfl⟩
    exact ⟨_, ⟨C, hC, rfl⟩, rfl⟩
  · rintro ⟨_, ⟨C, hC, rfl⟩, rfl⟩
    exact ⟨C, hC, rfl⟩

/-- Every literal number of a formula on `n` variables is at most `2n + 1`. -/
theorem mem_cnfNumbers_le {n : ℕ} (F : SAT.CNF (Fin n)) {D : List ℕ} (hD : D ∈ Encoding.cnfNumbers F)
    {k : ℕ} (hk : k ∈ D) : k ≤ 2 * n + 2 := by
  unfold Encoding.cnfNumbers at hD
  rw [Finset.mem_sort, Finset.mem_image] at hD
  obtain ⟨C, -, rfl⟩ := hD
  unfold Encoding.clauseNumbers at hk
  rw [Finset.mem_sort, Finset.mem_image] at hk
  obtain ⟨l, -, rfl⟩ := hk
  unfold Encoding.literalCode
  have := l.variable.isLt
  split_ifs <;> omega

/-- On the plain code of a 3-CNF, `pre` gives OpenAI's code of the same formula. -/
theorem pre_enc {n : ℕ} (φ : Sat3.CNF n) (h : Sat3.Is3CNF φ) :
    pre (Sat3.enc φ) = Encoding.encodeCNF
      ((φ.map fun C => (C.map fun l => (⟨l.1, l.2⟩ : SAT.Literal (Fin n))).toFinset).toFinset) := by
  have hdec : (Decode.dec (Sat3.enc φ)).2 = Decode.toN φ := by rw [Decode.dec_enc h.1]
  unfold pre
  rw [hdec, cnfCodes_toN, takeWhile_enc]
  unfold Encoding.encodeCNF Encoding.encodeCNFBody Encoding.encodeNat
  rw [List.append_assoc, List.singleton_append]
  congr 2
  exact encList'_eq _ _ _ fun D hD => encList'_eq _ _ _ fun k hk =>
    encNat_enc φ (mem_cnfNumbers_le _ hD hk)

/-- A polynomial-time `pre` that maps every plain code of a 3-CNF to OpenAI's code of the same
formula (the right-hand side is `Main.lean`'s `toFinsetCNF φ`, unfolded). -/
theorem frontEnd_exists' : ∃ pre : List Bool → List Bool, PolyT pre ∧
    ∀ (n : ℕ) (φ : Sat3.CNF n), Sat3.Is3CNF φ → pre (Sat3.enc φ) = Encoding.encodeCNF
      ((φ.map fun C => (C.map fun l => (⟨l.1, l.2⟩ : SAT.Literal (Fin n))).toFinset).toFinset) :=
  ⟨pre, pre_polyT, fun _ φ h => pre_enc φ h⟩

end Bridge
