module

public import Mathlib

@[expose] public section

/-!
# The ten minimum universal sets of MacMahon cubes

Independent statement surface: only Mathlib is imported, not the proof library.
Colours are 1,...,6; faces are +x,-x,+y,-y,+z,-z. The labels A,...,F
(indexed 0,...,5) are Conway tableau labels, not face colours. Repeated
physical cubes are allowed. Only exposed faces must match: there is no internal
face-matching constraint. Counts are with fixed face colours, not modulo
permutations of the colours. Each deliberate `sorry` is a comparator target.

The tables below specify the geometric representatives. The compared coverage,
uniqueness, rotation and outward-face theorems certify their interpretation.
-/
namespace MacMahon
open scoped BigOperators

abbrev Label := Fin 6
abbrev Pair := Label × Label
abbrev Slot := Fin 8
abbrev Inventory := Pair → ℕ

def faceColours : Label → Label → Fin 6 → Fin 7 := ![![![0, 0, 0, 0, 0, 0], ![1, 5, 2, 4, 6, 3], ![1, 6, 2, 3, 5, 4], ![1, 4, 2, 6, 3, 5], ![1, 3, 2, 5, 4, 6], ![1, 2, 3, 4, 5, 6]], ![![1, 5, 2, 4, 3, 6], ![0, 0, 0, 0, 0, 0], ![1, 2, 3, 5, 6, 4], ![1, 6, 2, 5, 4, 3], ![1, 4, 2, 3, 6, 5], ![1, 3, 2, 6, 5, 4]], ![![1, 6, 2, 3, 4, 5], ![1, 2, 3, 5, 4, 6], ![0, 0, 0, 0, 0, 0], ![1, 3, 2, 4, 5, 6], ![1, 5, 2, 6, 3, 4], ![1, 4, 2, 5, 6, 3]], ![![1, 4, 2, 6, 5, 3], ![1, 6, 2, 5, 3, 4], ![1, 3, 2, 4, 6, 5], ![0, 0, 0, 0, 0, 0], ![1, 2, 3, 6, 4, 5], ![1, 5, 2, 3, 4, 6]], ![![1, 3, 2, 5, 6, 4], ![1, 4, 2, 3, 5, 6], ![1, 5, 2, 6, 4, 3], ![1, 2, 3, 6, 5, 4], ![0, 0, 0, 0, 0, 0], ![1, 6, 2, 4, 3, 5]], ![![1, 2, 3, 4, 6, 5], ![1, 3, 2, 6, 4, 5], ![1, 4, 2, 5, 3, 6], ![1, 5, 2, 3, 6, 4], ![1, 6, 2, 4, 5, 3], ![0, 0, 0, 0, 0, 0]]]

def exposedFaces : Slot → Fin 3 → Fin 6 := ![![0, 2, 4], ![0, 2, 5], ![0, 3, 4], ![0, 3, 5], ![1, 2, 4], ![1, 2, 5], ![1, 3, 4], ![1, 3, 5]]

def rotations : Fin 24 → Fin 6 → Fin 6 := ![![0, 1, 2, 3, 4, 5], ![0, 1, 3, 2, 5, 4], ![0, 1, 4, 5, 3, 2], ![0, 1, 5, 4, 2, 3], ![1, 0, 2, 3, 5, 4], ![1, 0, 3, 2, 4, 5], ![1, 0, 4, 5, 2, 3], ![1, 0, 5, 4, 3, 2], ![2, 3, 0, 1, 5, 4], ![2, 3, 1, 0, 4, 5], ![2, 3, 4, 5, 0, 1], ![2, 3, 5, 4, 1, 0], ![3, 2, 0, 1, 4, 5], ![3, 2, 1, 0, 5, 4], ![3, 2, 4, 5, 1, 0], ![3, 2, 5, 4, 0, 1], ![4, 5, 0, 1, 2, 3], ![4, 5, 1, 0, 3, 2], ![4, 5, 2, 3, 1, 0], ![4, 5, 3, 2, 0, 1], ![5, 4, 0, 1, 3, 2], ![5, 4, 1, 0, 2, 3], ![5, 4, 2, 3, 0, 1], ![5, 4, 3, 2, 1, 0]]

def FaceFits (t p : Pair) (k : Slot) (r : Fin 24) : Prop :=
  ∀ f : Fin 3, faceColours p.1 p.2 (rotations r (exposedFaces k f)) =
    faceColours t.1 t.2 (exposedFaces k f)
abbrev Stock (a : Inventory) := (p : Pair) × Fin (a p)
def PhysicalBuilds (a : Inventory) (t : Pair) : Prop :=
  ∃ f : Slot ↪ Stock a, ∀ k, ∃ r : Fin 24, FaceFits t (f k).1 k r
def PhysicalUniversal (a : Inventory) : Prop :=
  ∀ i j : Label, i ≠ j → PhysicalBuilds a (i,j)
def DiagonalZero (a : Inventory) : Prop := ∀ i : Label, a (i,i) = 0
noncomputable def total (a : Inventory) : ℕ := ∑ p, a p
abbrev MinimumPhysicalInventory :=
  {a : Inventory // DiagonalZero a ∧ total a = 12 ∧ PhysicalUniversal a}
def twoTriangles (s : Finset Label) : Inventory := fun p =>
  if p.1 ≠ p.2 ∧ ((p.1 ∈ s ∧ p.2 ∈ s) ∨ (p.1 ∉ s ∧ p.2 ∉ s)) then 1 else 0

theorem faceOne_bound : 1 < 6 := by decide

def opposite (f : Fin 6) : Fin 6 :=
  if f.val % 2 = 0 then f + ⟨1, faceOne_bound⟩ else f - ⟨1, faceOne_bound⟩
def fromAxes (a b c : Fin 6) : Fin 6 → Fin 6 :=
  ![a, opposite a, b, opposite b, c, opposite c]

/-- Distinct coordinate axes and determinant +1. -/
def ValidAxes (a b c : Fin 6) : Prop :=
  a.val / 2 ≠ b.val / 2 ∧ a.val / 2 ≠ c.val / 2 ∧ b.val / 2 ≠ c.val / 2 ∧
  (a.val % 2 + b.val % 2 + c.val % 2) % 2 =
    ((if a.val / 2 > b.val / 2 then 1 else 0) +
     (if a.val / 2 > c.val / 2 then 1 else 0) +
     (if b.val / 2 > c.val / 2 then 1 else 0)) % 2
instance (a b c : Fin 6) : Decidable (ValidAxes a b c) := by
  unfold ValidAxes; infer_instance

def ProperRotation (r : Fin 6 → Fin 6) : Prop :=
  ∃ a b c, ValidAxes a b c ∧ r = fromAxes a b c

/-- Sharp minimum, including an attaining inventory. -/
theorem minimum_size : IsLeast
    {n : ℕ | ∃ a : Inventory, DiagonalZero a ∧ PhysicalUniversal a ∧ total a = n} 12 := by
  sorry

theorem physical_minimum (a : Inventory) (hz : DiagonalZero a)
    (h : PhysicalUniversal a) : 12 ≤ total a := by sorry

theorem physical_exactly_ten : Nat.card MinimumPhysicalInventory = 10 := by sorry

theorem physical_iff_two_triangles (a : Inventory) (hz : DiagonalZero a)
    (ht : total a = 12) : PhysicalUniversal a ↔
    ∃ s : Finset Label, s.card = 3 ∧ a = twoTriangles s := by sorry

theorem physical_minimum_has_no_repeats (a : Inventory) (hz : DiagonalZero a)
    (ht : total a = 12) (h : PhysicalUniversal a) : ∀ p, a p ≤ 1 := by sorry

theorem proper_rotation_iff (r : Fin 6 → Fin 6) :
    ProperRotation r ↔ ∃ n : Fin 24, r = rotations n := by sorry

theorem exposed_face_rule : ∀ k : Slot, ∀ d : Fin 3,
    (exposedFaces k d).val = 2*d.val + (k.val / 2^(2-d.val)) % 2 := by sorry

theorem face_colours_valid : ∀ i j : Label, i ≠ j →
    Function.Injective (faceColours i j) ∧ ∀ f : Fin 6, faceColours i j f ≠ 0 := by sorry

theorem face_assignment_coverage (f : Fin 6 → Fin 7) (hi : Function.Injective f)
    (hn : ∀ d, f d ≠ 0) :
    ∃ i j : Label, i ≠ j ∧ ∃ r : Fin 24,
      ∀ d : Fin 6, f d = faceColours i j (rotations r d) := by sorry

theorem face_assignment_unique (i j : Label) (hij : i ≠ j)
    (u v : Label) (huv : u ≠ v) (r s : Fin 24)
    (hf : ∀ d : Fin 6, faceColours i j (rotations r d) = faceColours u v (rotations s d)) :
    i = u ∧ j = v ∧ r = s := by sorry

end MacMahon
