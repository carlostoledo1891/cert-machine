/-! CONTROL C5 COPY: the checker of LemmaPCheck.lean with the core perturbed to C35(1,7,11,15). The kernel checker for Lemma P's branching certificate (cert-machine, 2026-11-21). Computable definitions only;
the soundness proof is in PathLemma.lean. A certificate piece is checked as `runAll cert s = some s'` for explicit
stacks `s`, `s'` (LemmaPCert.lean); the first stack is `[initA, initE]` and the last is empty. -/

namespace RamseyScout.ControlC5

/-! ## The checker (computable; vertices are Nats below 35, vertex sets are Nat bitmasks) -/
namespace Check

def full : Nat := 34359738367  -- 2^35 - 1
/-- The circular distances 1, 7, 11, 16 and their negatives 34, 28, 24, 19. -/
def baseAdj : Nat := 2^1 + 2^7 + 2^11 + 2^15 + 2^20 + 2^24 + 2^28 + 2^34
/-- The neighbourhood of `v < 35` in the circulant: `baseAdj` rotated by `v`. -/
def adjM (v : Nat) : Nat := ((baseAdj <<< v) ||| (baseAdj >>> (35 - v))) &&& full

def bit (m v : Nat) : Bool := m.testBit v

/-- A search state: the sets A, B, C (`s0 s1 s2`) and the vertices forbidden from each (`f0 f1 f2`). -/
structure St where
  s0 : Nat
  s1 : Nat
  s2 : Nat
  f0 : Nat
  f1 : Nat
  f2 : Nat
  deriving DecidableEq

def St.s (st : St) : Fin 3 → Nat
  | 0 => st.s0
  | 1 => st.s1
  | 2 => st.s2

def St.f (st : St) : Fin 3 → Nat
  | 0 => st.f0
  | 1 => st.f1
  | 2 => st.f2

def St.add (st : St) (v : Nat) : Fin 3 → St
  | 0 => { st with s0 := st.s0 ||| 2 ^ v }
  | 1 => { st with s1 := st.s1 ||| 2 ^ v }
  | 2 => { st with s2 := st.s2 ||| 2 ^ v }

def St.forbid (st : St) (v : Nat) : Fin 3 → St
  | 0 => { st with f0 := st.f0 ||| 2 ^ v }
  | 1 => { st with f1 := st.f1 ||| 2 ^ v }
  | 2 => { st with f2 := st.f2 ||| 2 ^ v }

/-- `v` may join `X`: in no set (`occ` is the union of the three), not forbidden from `X`, no neighbour in `X`. -/
def can (occ : Nat) (st : St) (v : Nat) (X : Fin 3) : Bool :=
  !bit occ v && !bit (st.f X) v && (adjM v &&& st.s X == 0)

/-- Side `false` is A ∪ B, side `true` is B ∪ C. -/
def sideSets (side : Bool) : Fin 3 × Fin 3 := if side then (1, 2) else (0, 1)

def opts (side : Bool) (vs : List Nat) : List (Nat × Fin 3) :=
  vs.flatMap fun v => [(v, (sideSets side).1), (v, (sideSets side).2)]

/-- One child per allowed option, in order: option i taken, the allowed options before it forbidden. -/
def kids (occ : Nat) (st : St) : List (Nat × Fin 3) → List St
  | [] => []
  | (v, X) :: os => if can occ st v X then st.add v X :: kids occ (st.forbid v X) os else kids occ st os

def maskOf : List Nat → Nat
  | [] => 0
  | v :: vs => 2 ^ v ||| maskOf vs

def unionOf (st : St) (side : Bool) : Nat := st.s (sideSets side).1 ||| st.s (sideSets side).2

/-- The requirement is an independent 8-set of the core that the side's union does not meet. -/
def validE (st : St) (side : Bool) (vs : List Nat) : Bool :=
  decide vs.Nodup && vs.all (fun v => decide (v < 35)) &&
    vs.all (fun u => adjM u &&& maskOf vs == 0) && (maskOf vs &&& unionOf st side == 0)

def vlist (x : Nat) : Nat → List Nat
  | 0 => []
  | n + 1 => x % 64 :: vlist (x / 64) n

def step : List St → Nat → Option (List St)
  | [], _ => none
  | st :: rest, e =>
    if validE st (e % 2 == 1) (vlist (e / 2) 8) then
      some (kids (st.s0 ||| st.s1 ||| st.s2) st (opts (e % 2 == 1) (vlist (e / 2) 8)) ++ rest)
    else none

def runChunk : List Nat → List St → Option (List St)
  | [], stk => some stk
  | e :: es, stk =>
    match step stk e with
    | none => none
    | some stk' => runChunk es stk'

def runAll : List (List Nat) → List St → Option (List St)
  | [], stk => some stk
  | c :: cs, stk =>
    match runChunk c stk with
    | none => none
    | some stk' => runAll cs stk'

/-- The two roots: vertex 0 in A, and A empty. -/
def initA : St := ⟨1, 0, 0, 0, 0, 0⟩
def initE : St := ⟨0, 0, 0, full, 0, 0⟩

end Check

end RamseyScout.ControlC5
