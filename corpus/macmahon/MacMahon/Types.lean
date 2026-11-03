module

public import Mathlib

@[expose] public section
namespace MacMahon

/-- Conway tableau labels, distinct from the six face colours. -/
abbrev Label := Fin 6
abbrev Pair := Label × Label
abbrev Corner := Fin 40
abbrev Slot := Fin 8
abbrev Inventory := Pair → ℕ

end MacMahon
