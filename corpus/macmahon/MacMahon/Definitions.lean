module

public import MacMahon.Data

@[expose] public section

namespace MacMahon
open scoped BigOperators

def HasCorner (p : Pair) (c : Corner) : Prop := c ∈ cornerList p.1 p.2
instance (p : Pair) (c : Corner) : Decidable (HasCorner p c) :=
  inferInstanceAs (Decidable (c ∈ cornerList p.1 p.2))
def Usable (t p : Pair) : Prop := ∃ c : Corner, HasCorner t c ∧ HasCorner p c
instance (t p : Pair) : Decidable (Usable t p) :=
  inferInstanceAs (Decidable (∃ c : Corner, HasCorner t c ∧ HasCorner p c))

def FaceFits (t p : Pair) (k : Slot) (r : Fin 24) : Prop :=
  ∀ f : Fin 3, faceColours p.1 p.2 (rotations r (exposedFaces k f)) =
    faceColours t.1 t.2 (exposedFaces k f)
instance (t p : Pair) (k : Slot) (r : Fin 24) : Decidable (FaceFits t p k r) :=
  inferInstanceAs (Decidable (∀ f : Fin 3,
    faceColours p.1 p.2 (rotations r (exposedFaces k f)) =
      faceColours t.1 t.2 (exposedFaces k f)))

abbrev Stock (a : Inventory) := (p : Pair) × Fin (a p)
def Builds (a : Inventory) (t : Pair) : Prop :=
  ∃ f : Slot ↪ Stock a, ∀ k, HasCorner (f k).1 (cornerAt t.1 t.2 k)
def PhysicalBuilds (a : Inventory) (t : Pair) : Prop :=
  ∃ f : Slot ↪ Stock a, ∀ k, ∃ r : Fin 24, FaceFits t (f k).1 k r
def PhysicalUniversal (a : Inventory) : Prop :=
  ∀ i j : Label, i ≠ j → PhysicalBuilds a (i,j)
def Universal (a : Inventory) : Prop := ∀ i j : Label, i ≠ j → Builds a (i,j)
def DiagonalZero (a : Inventory) : Prop := ∀ i : Label, a (i,i) = 0
def total (a : Inventory) : ℕ := ∑ p, a p
def row (a : Inventory) (i : Label) : ℕ := ∑ j, a (i,j)
def col (a : Inventory) (j : Label) : ℕ := ∑ i, a (i,j)
def usableCount (a : Inventory) (t : Pair) : ℕ :=
  ∑ p : Pair, if Usable t p then a p else 0


end MacMahon
