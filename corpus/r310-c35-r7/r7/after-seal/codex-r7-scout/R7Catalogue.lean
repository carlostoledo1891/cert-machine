import R7Composition

/-! graph6 on 27 vertices and the P2/C1 interface. Positions are zero-based
in the decompressed McKay file. The four production lines are embedded by
Lean at elaboration. The full-census scan is a separate byte-level check. -/

namespace R7Catalogue
open Finset SimpleGraph R7Composition

def filteredData : String := include_str ".."/"claude-r7"/"cores_e85.g6"

/-- Each graph6 record occupies 60 ASCII bytes plus a line feed. -/
abbrev Graph6Line := Array UInt8

def filteredLine (j : Fin 4) : Graph6Line :=
  filteredData.toUTF8.data.extract (61 * j.val) (61 * j.val + 60)

private def edgeBit (line : Graph6Line) (lo hi : ℕ) : Bool :=
  let bit := hi * (hi - 1) / 2 + lo
  let byte := line.getD (1 + bit / 6) 0
  (byte.toNat - 63).testBit (5 - bit % 6)

/-- The payload starts after the one-byte graph6 header. The bits for i<j occur
in increasing j, then increasing i, most significant bit first. -/
def readGraph (line : Graph6Line) : SimpleGraph Core where
  Adj x y := x ≠ y ∧ edgeBit line (min x.val y.val) (max x.val y.val) = true
  symm := ⟨fun x y h => ⟨Ne.symm h.1, by rw [min_comm, max_comm]; exact h.2⟩⟩
  loopless := ⟨fun _ h => h.1 rfl⟩

instance (s : Graph6Line) : DecidableRel (readGraph s).Adj := fun x y =>
  inferInstanceAs (Decidable (x ≠ y ∧ edgeBit s (min x.val y.val) (max x.val y.val) = true))

abbrev graph (j : Fin 4) := readGraph (filteredLine j)
abbrev X0 := graph 0
abbrev Census := Fin 477142 → Graph6Line

def position : Fin 4 → Fin 477142 := ![49240,49288,49914,49938]

/-- The literature premise P2 for the supplied numbered census. -/
def P2 (lines : Census) : Prop :=
  ∀ H : SimpleGraph Core, H.CliqueFree 3 → H.indepNum ≤ 7 →
    ∃ i, Nonempty (H ≃g readGraph (lines i))

/-- The computed finite fact C1, separate from P2. Only the required direction
of the sieve and the four exact labelled lines enter the proof. -/
def C1 (lines : Census) : Prop :=
  (∀ i, (readGraph (lines i)).edgeFinset.card = 85 → ∃ j, i = position j) ∧
  ∀ j, lines (position j) = filteredLine j

theorem catalogue_iso_of_85 {lines : Census} (complete : P2 lines) (slice : C1 lines)
    (H : SimpleGraph Core) [DecidableRel H.Adj] (tri : H.CliqueFree 3)
    (alpha : H.indepNum ≤ 7) (edges : H.edgeFinset.card = 85) :
    ∃ j, Nonempty (H ≃g graph j) := by
  obtain ⟨i, ⟨f⟩⟩ := complete H tri alpha
  obtain ⟨j, hj⟩ := slice.1 i (f.card_edgeFinset_eq.symm.trans edges)
  rw [hj, slice.2 j] at f
  exact ⟨j, ⟨f⟩⟩

/-- Counts neighbours of v whose degree is six. -/
def sixNeighbors (H : SimpleGraph Core) [DecidableRel H.Adj] (v : Core) : Finset Core :=
  (H.neighborFinset v).filter fun u => H.degree u = 6

/-- An oriented edge between two degree-six vertices which have respectively
one and four degree-six neighbours. This distinguishes X0 among the four. -/
def X0Marker (H : SimpleGraph Core) [DecidableRel H.Adj] : Prop :=
  ∃ u v, H.Adj u v ∧ H.degree u = 6 ∧ H.degree v = 6 ∧
    (sixNeighbors H u).card = 1 ∧ (sixNeighbors H v).card = 4

private theorem six_count_iso {H J : SimpleGraph Core} [DecidableRel H.Adj] [DecidableRel J.Adj]
    (f : H ≃g J) (v : Core) : (sixNeighbors J (f v)).card = (sixNeighbors H v).card := by
  have mapped : (sixNeighbors H v).map f.toEquiv.toEmbedding = sixNeighbors J (f v) := by
    ext y
    obtain ⟨x,rfl⟩ := f.surjective y
    constructor
    · intro h
      obtain ⟨z,hz,eq⟩ := mem_map.mp h
      change f z = f x at eq
      obtain rfl := f.injective eq
      simpa [sixNeighbors, f.degree_eq, f.map_adj_iff] using hz
    · intro h
      exact mem_map.mpr ⟨x, by simpa [sixNeighbors, f.degree_eq, f.map_adj_iff] using h, rfl⟩
  rw [← mapped, card_map]

private theorem marker_map {H J : SimpleGraph Core} [DecidableRel H.Adj] [DecidableRel J.Adj]
    (f : H ≃g J) (m : X0Marker H) : X0Marker J := by
  obtain ⟨u,v,adj,du,dv,cu,cv⟩ := m
  exact ⟨f u,f v,f.map_adj_iff.mpr adj,(f.degree_eq u).trans du,(f.degree_eq v).trans dv,
    (six_count_iso f u).trans cu,(six_count_iso f v).trans cv⟩

-- Small evaluation tables. Both tables are verified against the graph6 graphs below.
private def degreeTable : Fin 4 → Core → ℕ :=
  ![![7,7,6,7,6,7,7,7,6,6,6,6,5,7,7,7,7,6,7,5,6,6,5,6,7,6,5],
    ![7,7,6,7,6,7,7,6,6,7,6,6,5,7,7,7,6,7,7,5,6,6,5,6,7,6,5],
    ![7,6,6,7,6,7,7,7,7,6,7,6,5,7,7,6,7,6,7,5,6,6,5,6,7,6,5],
    ![7,6,6,7,6,7,7,6,7,7,7,6,5,7,7,6,6,7,7,5,6,6,5,6,7,6,5]]

private def sixTable : Fin 4 → Core → ℕ :=
  ![![5,5,2,3,2,2,5,1,2,1,4,2,2,2,4,3,2,2,3,2,0,2,2,3,1,2,2],
    ![5,5,2,3,2,2,5,1,2,1,4,2,2,2,4,3,2,2,3,2,0,2,2,3,1,2,2],
    ![4,5,2,3,2,2,4,1,2,1,4,3,2,2,4,3,2,2,3,2,1,2,2,3,1,2,2],
    ![4,5,2,3,2,2,4,1,2,1,4,3,2,2,4,3,2,2,3,2,1,2,2,3,1,2,2]]

private theorem degree_checked : ∀ j v, (graph j).degree v = degreeTable j v := by decide +kernel

private theorem six_checked (j : Fin 4) (v : Core) : (sixNeighbors (graph j) v).card = sixTable j v := by
  have eq : sixNeighbors (graph j) v =
      ((graph j).neighborFinset v).filter (fun x => degreeTable j x = 6) := by
    ext x
    simp only [sixNeighbors, mem_filter, degree_checked]
  rw [eq]
  exact (by decide +kernel : ∀ k w, (((graph k).neighborFinset w).filter
    (fun x => degreeTable k x = 6)).card = sixTable k w) j v

theorem marker_catalogue (j : Fin 4) : X0Marker (graph j) ↔ j = 0 := by
  unfold X0Marker
  simp only [degree_checked, six_checked]
  revert j
  decide +kernel

theorem identify_X0 {lines : Census} (complete : P2 lines) (slice : C1 lines)
    (H : SimpleGraph Core) [DecidableRel H.Adj] (tri : H.CliqueFree 3)
    (alpha : H.indepNum ≤ 7) (edges : H.edgeFinset.card = 85) :
    X0Marker H ↔ Nonempty (H ≃g X0) := by
  constructor
  · intro m
    obtain ⟨j,⟨f⟩⟩ := catalogue_iso_of_85 complete slice H tri alpha edges
    obtain rfl := (marker_catalogue j).mp (marker_map f m)
    exact ⟨f⟩
  · rintro ⟨f⟩
    exact marker_map f.symm ((marker_catalogue 0).mpr rfl)

#print axioms catalogue_iso_of_85
#print axioms marker_catalogue
#print axioms identify_X0

end R7Catalogue
