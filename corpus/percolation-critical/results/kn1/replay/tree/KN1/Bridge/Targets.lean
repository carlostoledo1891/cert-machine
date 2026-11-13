import KNConjectures.Conjectures
import KNConjectures.KN1Bridge
import KN1.Bridge.Compare

/-!
# KN1.Bridge.Targets — the three targets ARE the propositions proved by the three theorems

This file imports the third party's proofs, to read the TYPES of their theorems. No declaration here uses a
theorem of theirs as a term: `type_of%` elaborates to the type only (the dependency walk of each check is in
`KN1.Bridge.Walk`).
-/

namespace KN1Targets

/-- T1: the type of `KNAll.conjecture1_holds` is the named definition `KNAll.Conjecture1`. -/
theorem T1_is_the_type : (type_of% @KNAll.conjecture1_holds) = KNAll.Conjecture1 := rfl

/-- T2: the type of `KN1Statement.multiplicativeGluing_holds` is `KN1Statement.MultiplicativeGluing`. -/
theorem T2_is_the_type :
    (type_of% @KN1Statement.multiplicativeGluing_holds) = KN1Statement.MultiplicativeGluing := rfl

/-- T3: the type of `KN1Corollary.kozmaNitzan_conjecture1` is `KN1Compare.T3`. -/
theorem T3_is_the_type : (type_of% @KN1Corollary.kozmaNitzan_conjecture1) = KN1Compare.T3 := rfl

-- The same three checks on the terms themselves (syntactic, up to binder names), and what T1's definition and
-- T3's type are to each other.
open Lean Elab Command in
run_cmd do
  let env ← getEnv
  let some c1 := env.find? ``KNAll.conjecture1_holds | throwError "missing conjecture1_holds"
  let some c2 := env.find? ``KN1Statement.multiplicativeGluing_holds | throwError "missing multiplicativeGluing_holds"
  let some c3 := env.find? ``KN1Corollary.kozmaNitzan_conjecture1 | throwError "missing kozmaNitzan_conjecture1"
  let some (.defnInfo d1) := env.find? ``KNAll.Conjecture1 | throwError "missing KNAll.Conjecture1"
  let some (.defnInfo d3) := env.find? ``KN1Compare.T3 | throwError "missing T3"
  let t1 := c1.type == mkConst ``KNAll.Conjecture1
  let t2 := c2.type == mkConst ``KN1Statement.MultiplicativeGluing
  let t3 := c3.type == d3.value
  let t13 := c3.type == d1.value
  logInfo m!"type of KNAll.conjecture1_holds is the constant KNAll.Conjecture1 (syntactic): {t1}\ntype of KN1Statement.multiplicativeGluing_holds is the constant KN1Statement.MultiplicativeGluing (syntactic): {t2}\ntype of KN1Corollary.kozmaNitzan_conjecture1 is the body of KN1Compare.T3 (syntactic): {t3}\ntype of KN1Corollary.kozmaNitzan_conjecture1 is the body of KNAll.Conjecture1 (syntactic): {t13}"
  unless t1 && t2 do throwError "a target is not the type of its theorem"

end KN1Targets
