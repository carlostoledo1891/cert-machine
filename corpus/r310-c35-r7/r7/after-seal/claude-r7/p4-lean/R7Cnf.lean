/-! The clause list F of `P4-STATEMENT-v2.md` (the R(7) production CNF), as an executable definition.
No import beyond Lean's core: the same definition is run to write the bytes (T2) and is the subject of T0 and T1. -/

namespace R7Cnf

abbrev Clause := List Int

/-- The inputs: a graph on 0..26 and four sides (side 0, 1 are the A sides; 2, 3 the B sides). -/
structure Input where
  adj : Fin 27 → Fin 27 → Bool
  side : Fin 4 → Fin 27 → Bool

/-- x(c, y) = 1 + 27c + y. -/
def xv (c : Fin 7) (y : Fin 27) : Nat := 1 + 27 * c.val + y.val

def pos (v : Nat) : Int := Int.ofNat v
def neg (v : Nat) : Int := -Int.ofNat v

/-- AtMost(l; k) with the running variable count `base` on entry. Returns the clauses and the new count. -/
def atMost (base : Nat) (l : List Int) (k : Nat) : List Clause × Nat :=
  if l.length ≤ k then ([], base)
  else if k = 0 then (l.map fun a => [-a], base)
  else
    let s : Nat → Nat → Int := fun i j => pos (base + i * k + j + 1)
    let first : List Clause := [-(l.getD 0 0), s 0 0] :: (List.range' 1 (k - 1)).map fun j => [-(s 0 j)]
    let rest : List Clause := (List.range' 1 (l.length - 1)).flatMap fun i =>
      [[-(l.getD i 0), s i 0], [-(s (i - 1) 0), s i 0]]
        ++ ((List.range' 1 (k - 1)).flatMap fun j =>
              [[-(l.getD i 0), -(s (i - 1) (j - 1)), s i j], [-(s (i - 1) j), s i j]])
        ++ [[-(l.getD i 0), -(s (i - 1) (k - 1))]]
    (first ++ rest, base + l.length * k)

/-- Exactly(l; k) = AtMost(l; k), then AtMost(¬l; n ∸ k). -/
def exactly (base : Nat) (l : List Int) (k : Nat) : List Clause × Nat :=
  let p := atMost base l k
  let q := atMost p.2 (l.map fun a => -a) (l.length - k)
  (p.1 ++ q.1, q.2)

/-- The independent subsequences of an increasing list, in lexicographic order, a prefix before its extensions. -/
def indepSubs (adj : Fin 27 → Fin 27 → Bool) : List (Fin 27) → List (List (Fin 27))
  | [] => [[]]
  | a :: l =>
    let r := indepSubs adj l
    [] :: ((r.filter fun s => s.all fun z => !adj a z).map (a :: ·) ++ r.tail)

/-- IS. -/
def indepSets (adj : Fin 27 → Fin 27 → Bool) : List (List (Fin 27)) := indepSubs adj (List.finRange 27)

def deg (adj : Fin 27 → Fin 27 → Bool) (y : Fin 27) : Nat := ((List.finRange 27).filter fun z => adj y z).length
def sidesAt (side : Fin 4 → Fin 27 → Bool) (y : Fin 27) : Nat := ((List.finRange 4).filter fun j => side j y).length
/-- r′(y) = 9 ∸ deg(y) ∸ sides(y). -/
def rprime (inp : Input) (y : Fin 27) : Nat := 9 - deg inp.adj y - sidesAt inp.side y

/-- 1 if side j is disjoint from I, else 0. -/
def missSide (side : Fin 4 → Fin 27 → Bool) (j : Fin 4) (I : List (Fin 27)) : Nat := if I.all (fun y => !side j y) then 1 else 0
/-- max(m_A(I), m_B(I)). -/
def maxMiss (side : Fin 4 → Fin 27 → Bool) (I : List (Fin 27)) : Nat :=
  max (missSide side 0 I + missSide side 1 I) (missSide side 2 I + missSide side 3 I)
/-- k = 10 ∸ |I| ∸ max(m_A(I), m_B(I)). -/
def kOf (inp : Input) (I : List (Fin 27)) : Nat := 10 - I.length - maxMiss inp.side I

/-- The subsets of {0..6}, in increasing order of Σ 2^c, each as its ascending list of members. -/
def subsets7 : List (List (Fin 7)) := (List.range 128).map fun sub => (List.finRange 7).filter fun c => sub.testBit c.val

/-- (T) -/
def clausesT (adj : Fin 27 → Fin 27 → Bool) : List Clause :=
  (List.finRange 7).flatMap fun c => (List.finRange 27).flatMap fun y =>
    ((List.finRange 27).filter fun z => decide (y.val < z.val) && adj y z).map fun z => [neg (xv c y), neg (xv c z)]

/-- The (I) clauses of one independent set. -/
def clausesOfSet (inp : Input) (ℓ : Nat) (I : List (Fin 27)) : List Clause :=
  if !I.isEmpty && decide (kOf inp I ≤ 7) && decide (I.length ≤ ℓ) then
    (subsets7.filter fun C' => C'.length == kOf inp I).map fun C' => C'.flatMap fun c => I.map fun y => pos (xv c y)
  else []

/-- (I) -/
def clausesI (inp : Input) (ℓ : Nat) : List Clause := (indepSets inp.adj).flatMap (clausesOfSet inp ℓ)

/-- (S) for the rows c and c′ = c + 1: e_y = base + 1 + y. -/
def lexPair (base : Nat) (c c' : Fin 7) : List Clause × Nat :=
  let e : Nat → Nat := fun y => base + 1 + y
  ([pos (e 0)] :: (List.finRange 27).flatMap fun y =>
      [neg (e y.val), neg (xv c y), pos (xv c' y)] ::
        (if y.val < 26 then
          [[neg (e y.val), neg (xv c y), neg (xv c' y), pos (e (y.val + 1))],
           [neg (e y.val), pos (xv c y), pos (xv c' y), pos (e (y.val + 1))]]
         else []),
   base + 27)

/-- A gadget takes the running variable count and returns its clauses and the new count. -/
abbrev Gadget := Nat → List Clause × Nat

def gadgets (inp : Input) (ℓ : Nat) : List Gadget :=
  [fun b => (clausesT inp.adj, b)]
  ++ (List.finRange 7).map (fun c b => exactly b ((List.finRange 27).map fun y => pos (xv c y)) 7)
  ++ (List.finRange 27).map (fun y b => exactly b ((List.finRange 7).map fun c => pos (xv c y)) (rprime inp y))
  ++ [fun b => (clausesI inp ℓ, b)]
  ++ (List.finRange 6).map (fun c b => lexPair b c.castSucc c.succ)

def run (gs : List Gadget) (base : Nat) : List Clause × Nat :=
  gs.foldl (fun acc g => let r := g acc.2; (acc.1 ++ r.1, r.2)) ([], base)

/-- F(X, sides, ℓ): the clauses in order, and the final variable count N. -/
def F (inp : Input) (ℓ : Nat) : List Clause × Nat := run (gadgets inp ℓ) 189

/-! ## The bytes -/

def clauseLine (c : Clause) : String := c.foldl (fun s a => s ++ toString a ++ " ") "" ++ "0\n"

/-- B: the file for the given core number, record number and level. -/
def bytes (inp : Input) (core idx ℓ : Nat) : String :=
  let f := F inp ℓ
  let nI := (clausesI inp ℓ).length
  let head := "c r7cnf core=" ++ toString core ++ " cfg=" ++ toString idx ++ " K=9 SB=1 "
    ++ (if ℓ = 7 then "" else "MAXI=" ++ toString ℓ ++ " ") ++ "independence-clauses=" ++ toString nI ++ "\n"
  let p := "p cnf " ++ toString f.2 ++ " " ++ toString f.1.length ++ "\n"
  f.1.foldl (fun s c => s ++ clauseLine c) (head ++ p)

/-! ## Reading the inputs -/

/-- graph6 line of a 27-vertex graph: bit t of the stream is the pair (i, j), j = 1..26, i = 0..j−1. -/
def adjOfGraph6 (line : String) : Fin 27 → Fin 27 → Bool :=
  let b := line.toUTF8
  let bit : Nat → Bool := fun t => (((b.get! (1 + t / 6)).toNat - 63) >>> (5 - t % 6)) % 2 == 1
  fun y z =>
    let i := min y.val z.val
    let j := max y.val z.val
    i != j && bit (j * (j - 1) / 2 + i)

/-- Record idx of configs.bin: five unsigned little-endian 16-bit numbers. -/
def record (cfg : ByteArray) (idx : Nat) : Nat × Nat × Nat × Nat × Nat :=
  let w : Nat → Nat := fun t => (cfg.get! (10 * idx + 2 * t)).toNat + 256 * (cfg.get! (10 * idx + 2 * t + 1)).toNat
  (w 0, w 1, w 2, w 3, w 4)

/-- The input of a record: the core's graph and the four 6-sets by their numbers among the 6-element members of IS. -/
def inputOf (coreLines : Array String) (cfg : ByteArray) (idx : Nat) : Nat × Input :=
  let (core, a1, a2, b1, b2) := record cfg idx
  let adj := adjOfGraph6 (coreLines[core]!)
  let table : Array (Array Bool) := Array.ofFn fun y : Fin 27 => Array.ofFn fun z : Fin 27 => adj y z
  let adj' : Fin 27 → Fin 27 → Bool := fun y z => table[y.val]![z.val]!
  let L6 := ((indepSets adj').filter fun I => I.length == 6).toArray
  let sets : Array (List (Fin 27)) := #[L6[a1]!, L6[a2]!, L6[b1]!, L6[b2]!]
  let st : Array (Array Bool) := Array.ofFn fun j : Fin 4 => Array.ofFn fun y : Fin 27 => sets[j.val]!.contains y
  (core, { adj := adj', side := fun j y => st[j.val]![y.val]! })

end R7Cnf
