-- a minimal reproduction for nanoda (cert-machine, ZQ Track B amendment D): Lean's kernel reduces the inner power and
-- never computes the outer one; a checker that evaluates every literal power must compute 2 ^ 4294967296.
theorem nanoda_pow_repro : (2 : Nat) ^ (2 ^ 32) = 2 ^ 4294967296 := rfl
