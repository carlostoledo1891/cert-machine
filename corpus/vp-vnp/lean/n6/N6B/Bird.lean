import Mathlib

/-! Algebraic interface to the division-free Bird recurrence at the pinned Mathlib version. -/

namespace N6B

variable {R : Type*} {n : ℕ}

/-- Serialize a square matrix in the row-major order expected by Bird's algorithm. -/
def flatten (A : Matrix (Fin n) (Fin n) R) : Array R :=
  Array.ofFn fun k : Fin (n * n) => A k.divNat k.modNat

theorem flatten_size (A : Matrix (Fin n) (Fin n) R) : (flatten A).size = n * n :=
  Array.size_ofFn

theorem ofArray_flatten (A : Matrix (Fin n) (Fin n) R) :
    Matrix.ofArray (flatten A) (flatten_size A) = A :=
  Matrix.ofArray_ofFn A

variable [CommRing R]

theorem get_flatten (A : Matrix (Fin n) (Fin n) R) (i j : Fin n) :
    BirdDet.get n (flatten A) i j = A i j := by
  have h := ofArray_flatten A
  rw [Matrix.ofArray_eq_of_getD] at h
  exact congrArg (fun M : Matrix (Fin n) (Fin n) R => M i j) h

theorem det_flatten (A : Matrix (Fin n) (Fin n) R) :
    A.det = BirdDet.birdDet n (flatten A) := by
  simpa only [ofArray_flatten] using
    (BirdDet.det_eq_birdDet (flatten A) (flatten_size A))

end N6B
