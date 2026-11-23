import R7Exchanges
import R7Control

/-! Non-vacuity of the D8 completion equivalence on the independently
checked production C-SAT control 89694. -/

namespace R7ExchangeControl
open R7Independence R7Exchange R7Control

abbrev core := graph.comap Sum.inl
abbrev commons (c : Fin 7) := row graph (commonVertex c)
abbrev sides (j : Fin 4) := row graph (sideVertex j)

theorem eight_completions (im : Fin 8) : Completes core 10 commons (sides ∘ source im) :=
  (completes_image_iff _ _ _ _ im).2 ⟨graph, inferInstance, layout, rfl, triangle_free,
    regular, alpha_eq_ten.le, fun _ => rfl, fun _ => rfl⟩

/-- All eight images in this control are distinct as labelled four-tuples. -/
theorem eight_distinct : Function.Injective (fun im : Fin 8 => sides ∘ source im) := by
  have faithful : ∀ m n : Fin 8, (∀ j : Fin 4, source m j = source n j) → m = n := by decide
  have distinct : ∀ i j : Fin 4, sides i = sides j → i = j := by decide +kernel
  exact fun _ _ eq => faithful _ _ (fun j => distinct _ _ (congrFun eq j))

#print axioms eight_completions
#print axioms eight_distinct

end R7ExchangeControl
