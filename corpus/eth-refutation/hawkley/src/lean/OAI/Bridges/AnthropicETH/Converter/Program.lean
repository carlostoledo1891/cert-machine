import OAI.Bridges.AnthropicETH.Converter.Spec

/-!
# RPI-378.3c, part 2: the converter as a ParityLifts tree program

`convProgram : PolyProgram (List Bool) (List Bool) conv` is assembled from ParityLifts' verified
tree programs (`truePrefix`, `drop`, `take`, `splitAt`, `natAdd`, `natSub`, `natMin`, `natBits`,
`length`, `encodeNat`, `append`, `reverse`, `any`, `mapWith`, `foldlGrowing`, `foldlBounded`).
`PolyProgram` carries an `FCode`, its exact run (`BEval`), and a time bound
`coefficient · (size + 1)^degree`; composition multiplies degrees, so the converter has one fixed
degree `convProgram.degree`, independent of every downstream machine.

Three folds needed growth bounds (the obligations of `foldlGrowing` / `foldlBounded`):

* `capValProgram`: the capped reading stays below `max acc cap` (`fold_capStep`);
* `flattenProgram`: appending grows the accumulator by the size of the appended piece;
* `chunksProgram`: moving one chunk from `rest` to the accumulator adds two tree nodes.
-/

namespace OAI.Bridges.AnthropicETH.Conv

open OAI.ParityWL.Complexity

/-! ## Capped reading of a slot value -/

noncomputable def capStepProgram : PolyProgram (Bool × (ℕ × ℕ)) (ℕ × ℕ) capStep := by
  let cap := (PolyProgram.snd Bool (ℕ × ℕ)).comp (PolyProgram.fst ℕ ℕ)
  let acc := (PolyProgram.snd Bool (ℕ × ℕ)).comp (PolyProgram.snd ℕ ℕ)
  let dbl := (acc.pair acc).comp PolyProgram.natAdd
  let bn : PolyProgram (Bool × (ℕ × ℕ)) ℕ (fun x => if x.1 then 1 else 0) :=
    (PolyProgram.fst Bool (ℕ × ℕ)).ite (PolyProgram.const 1) (PolyProgram.const 0)
  let sum := (dbl.pair bn).comp PolyProgram.natAdd
  let mn := (cap.pair sum).comp PolyProgram.natMin
  refine (cap.pair mn).congr ?_
  rintro ⟨b, c, a⟩
  cases b <;> rfl

theorem fold_capStep (xs : List Bool) (s : ℕ × ℕ) :
    (xs.foldl (fun c a => capStep (a, c)) s).1 = s.1 ∧
      (xs.foldl (fun c a => capStep (a, c)) s).2 ≤ max s.2 s.1 := by
  induction xs generalizing s with
  | nil => simp
  | cons b xs ih =>
    obtain ⟨h1, h2⟩ := ih (capStep (b, s))
    simp only [List.foldl_cons]
    refine ⟨h1.trans rfl, h2.trans ?_⟩
    simp only [capStep]
    omega

noncomputable def capValProgram : PolyProgram (List Bool × ℕ) ℕ capVal := by
  let init := ((PolyProgram.fst (List Bool) ℕ).comp (PolyProgram.reverse Bool)).pair
    ((PolyProgram.snd (List Bool) ℕ).pair (PolyProgram.const (α := List Bool × ℕ) 0))
  have hg : ∀ (xs : List Bool) (s : ℕ × ℕ),
      (treeEncode (xs.foldl (fun c a => capStep (a, c)) s)).size ≤
        2 * ((treeEncode (xs, s)).size + 1) ^ 1 := by
    intro xs s
    obtain ⟨h1, h2⟩ := fold_capStep xs s
    have hx := treeEncode_list_length xs
    simp only [treeEncode_prod, treeEncode_nat, DataTree.size, numTree_size, pow_one]
    rw [h1]
    omega
  let F := capStepProgram.foldlBounded 2 1 hg
  exact ((init.comp F).comp (PolyProgram.snd ℕ ℕ)).congr (fun _ => rfl)

/-! ## One slot, one literal -/

noncomputable def slotLitProgram : PolyProgram (List Bool × ℕ) (ℕ × Bool) slotLit := by
  let hd := (PolyProgram.fst (List Bool) ℕ).comp (PolyProgram.head Bool false)
  let tl := (((PolyProgram.fst (List Bool) ℕ).comp (PolyProgram.tail Bool)).pair
    (PolyProgram.snd (List Bool) ℕ)).comp capValProgram
  let sub : PolyProgram (List Bool × ℕ) ℕ (fun x => if x.1.headD false then 0 else 1) :=
    hd.ite (PolyProgram.const 0) (PolyProgram.const 1)
  let i := (tl.pair sub).comp PolyProgram.natSub
  let pol := hd.comp PolyProgram.not
  exact (i.pair pol).congr (fun _ => rfl)

noncomputable def litBitsProgram : PolyProgram (List Bool × ℕ) (List Bool) litBits := by
  let enc := (((PolyProgram.fst ℕ Bool).comp PolyProgram.encodeNat).pair
    (((PolyProgram.snd ℕ Bool).pair (PolyProgram.const (α := ℕ × Bool) ([] : List Bool))).comp
      (PolyProgram.cons Bool))).comp (PolyProgram.append Bool)
  exact (slotLitProgram.comp enc).congr (fun _ => rfl)

/-! ## Lists of lists -/

theorem foldl_append_flatten {α : Type} (L : List (List α)) (acc : List α) :
    L.foldl (fun b a => b ++ a) acc = acc ++ L.flatten := by
  induction L generalizing acc with
  | nil => simp
  | cons a L ih => simp [ih, List.append_assoc]

noncomputable def flattenProgram (α : Type) [TreeCodec α] :
    PolyProgram (List (List α)) (List α) List.flatten := by
  let step := ((PolyProgram.snd (List α) (List α)).pair (PolyProgram.fst (List α) (List α))).comp
    (PolyProgram.append α)
  have hg : ∀ (a b : List α), (treeEncode (b ++ a)).size ≤
      (treeEncode b).size + 1 * ((treeEncode a).size + 1) ^ 1 := by
    intro a b
    have := treeEncode_append_size b a
    rw [pow_one]; omega
  let F := step.foldlGrowing 1 1 hg
  refine (((PolyProgram.id (List (List α))).pair
    (PolyProgram.const (α := List (List α)) ([] : List α))).comp F).congr ?_
  intro L
  change L.foldl (fun b a => b ++ a) [] = L.flatten
  rw [foldl_append_flatten]; rfl

/-! ## One clause -/

noncomputable def selProgram : PolyProgram (List Bool) (List (List Bool)) sel := by
  let keep := ((PolyProgram.id (List Bool)).pair
    (PolyProgram.const (α := List Bool) ([] : List (List Bool)))).comp (PolyProgram.cons (List Bool))
  exact ((PolyProgram.any (PolyProgram.id Bool)).ite keep
    (PolyProgram.const (α := List Bool) ([] : List (List Bool)))).congr (fun _ => rfl)

noncomputable def piecesProgram :
    PolyProgram (List Bool × ℕ) (List (List Bool)) (fun x => pieces x.1 x.2) := by
  let c := PolyProgram.fst (List Bool) ℕ
  let w := PolyProgram.snd (List Bool) ℕ
  let p0 := ((w.pair c).comp (PolyProgram.take Bool)).comp selProgram
  let d1 := (w.pair c).comp (PolyProgram.drop Bool)
  let p1 := ((w.pair d1).comp (PolyProgram.take Bool)).comp selProgram
  let d2 := (w.pair d1).comp (PolyProgram.drop Bool)
  let p2 := ((w.pair d2).comp (PolyProgram.take Bool)).comp selProgram
  exact ((p0.pair ((p1.pair p2).comp (PolyProgram.append (List Bool)))).comp
    (PolyProgram.append (List Bool))).congr (fun _ => rfl)

noncomputable def clauseOutProgram : PolyProgram (List Bool × (ℕ × ℕ)) (List Bool) clauseOut := by
  let ps := ((PolyProgram.fst (List Bool) (ℕ × ℕ)).pair
    ((PolyProgram.snd (List Bool) (ℕ × ℕ)).comp (PolyProgram.fst ℕ ℕ))).comp piecesProgram
  let len := (ps.comp (PolyProgram.length (List Bool))).comp PolyProgram.encodeNat
  let body := ((ps.pair ((PolyProgram.snd (List Bool) (ℕ × ℕ)).comp (PolyProgram.snd ℕ ℕ))).comp
    (PolyProgram.mapWith litBitsProgram)).comp (flattenProgram Bool)
  exact ((len.pair body).comp (PolyProgram.append Bool)).congr (fun _ => rfl)

/-! ## Chunking -/

noncomputable def chunkStepProgram :
    PolyProgram (ℕ × (List Bool × List (List Bool))) (ℕ × (List Bool × List (List Bool)))
      chunkStep := by
  let W := PolyProgram.fst ℕ (List Bool × List (List Bool))
  let rest := (PolyProgram.snd ℕ (List Bool × List (List Bool))).comp
    (PolyProgram.fst (List Bool) (List (List Bool)))
  let acc := (PolyProgram.snd ℕ (List Bool × List (List Bool))).comp
    (PolyProgram.snd (List Bool) (List (List Bool)))
  let test := rest.comp (PolyProgram.null Bool)
  let sp := (W.pair rest).comp (PolyProgram.splitAt Bool)
  let next := W.pair ((sp.comp (PolyProgram.snd (List Bool) (List Bool))).pair
    (((sp.comp (PolyProgram.fst (List Bool) (List Bool))).pair acc).comp
      (PolyProgram.cons (List Bool))))
  refine (test.ite (PolyProgram.id _) next).congr ?_
  rintro ⟨W, rest, acc⟩
  cases rest <;> rfl

theorem chunkStep_size (s : ℕ × (List Bool × List (List Bool))) :
    (treeEncode (chunkStep s)).size ≤ (treeEncode s).size + 2 := by
  rcases s with ⟨W, rest, acc⟩
  unfold chunkStep
  split_ifs
  · omega
  · have h := treeEncode_append_size (rest.take W) (rest.drop W)
    rw [List.take_append_drop] at h
    simp only [treeEncode_prod, treeEncode_cons, DataTree.size]
    omega

noncomputable def chunksProgram :
    PolyProgram (ℕ × List Bool) (List (List Bool)) (fun x => chunks x.1 x.2) := by
  let step := (PolyProgram.snd Bool (ℕ × (List Bool × List (List Bool)))).comp chunkStepProgram
  have hg : ∀ (a : Bool) (s : ℕ × (List Bool × List (List Bool))),
      (treeEncode (chunkStep s)).size ≤ (treeEncode s).size + 2 * ((treeEncode a).size + 1) ^ 0 := by
    intro a s; simpa using chunkStep_size s
  let F := step.foldlGrowing 2 0 hg
  let init := (PolyProgram.snd ℕ (List Bool)).pair ((PolyProgram.fst ℕ (List Bool)).pair
    ((PolyProgram.snd ℕ (List Bool)).pair
      (PolyProgram.const (α := ℕ × List Bool) ([] : List (List Bool)))))
  exact ((((init.comp F).comp (PolyProgram.snd ℕ (List Bool × List (List Bool)))).comp
    (PolyProgram.snd (List Bool) (List (List Bool)))).comp
      (PolyProgram.reverse (List Bool))).congr (fun _ => rfl)

/-! ## The whole converter -/

noncomputable def wOfProgram : PolyProgram ℕ ℕ wOf := by
  let bitsLen := ((((PolyProgram.id ℕ).pair (PolyProgram.id ℕ)).comp PolyProgram.natAdd).comp
    PolyProgram.natBits).comp (PolyProgram.length Bool)
  refine (PolyProgram.natZero.ite (PolyProgram.const 1) bitsLen).congr ?_
  intro n
  simp only [wOf, decide_eq_true_eq]
  rfl

/-- **The converter program.** -/
noncomputable def convProgram : PolyProgram (List Bool) (List Bool) conv := by
  let n := PolyProgram.truePrefix
  let rest := ((n.comp PolyProgram.natSucc).pair (PolyProgram.id (List Bool))).comp
    (PolyProgram.drop Bool)
  let w := n.comp wOfProgram
  let W := (((w.pair w).comp PolyProgram.natAdd).pair w).comp PolyProgram.natAdd
  let cap := (((n.pair n).comp PolyProgram.natAdd).comp PolyProgram.natSucc).comp PolyProgram.natSucc
  let cs := (W.pair rest).comp chunksProgram
  let body := ((cs.pair (w.pair cap)).comp (PolyProgram.mapWith clauseOutProgram)).comp
    (flattenProgram Bool)
  let len := (cs.comp (PolyProgram.length (List Bool))).comp PolyProgram.encodeNat
  exact (((n.comp PolyProgram.encodeNat).pair ((len.pair body).comp (PolyProgram.append Bool))).comp
    (PolyProgram.append Bool)).congr (fun _ => rfl)

end OAI.Bridges.AnthropicETH.Conv
