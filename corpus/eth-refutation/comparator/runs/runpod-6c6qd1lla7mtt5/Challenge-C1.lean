import ComplexityAbstracts.SubexponentialSATAbstract
import Complexity.Computability.WordRAM.Time

namespace EthBridge.WordRAM

open ComplexityAbstracts.SubexponentialSATAbstract

/-- The word-RAM input of a formula: the bits of `encCNF φ`, one bit per word, whatever the word size. -/
def input (_w : ℕ) (φ : Formula) : List ℕ := (encCNF φ).map Bool.toNat

/-- 3-SAT is decided on the word RAM within `c · ⌈2^(δ n)⌉ · (L + 1)^e + c` instructions, at logarithmic word size,
by one fixed program over the additive basis. -/
def RAMDecidableInExpTime (δ : ℝ) : Prop :=
  ∃ c e : ℕ, Cslib.WordRAM.UniformDecidableInTimeLogWord .additive (KSAT 3) input
    (fun φ => (encCNF φ).length)
    (fun φ _ => c * (⌈(2 : ℝ) ^ (δ * numVars φ)⌉₊ * ((encCNF φ).length + 1) ^ e) + c)

/-- ETH on the word RAM: some positive exponential rate is unattainable for 3-SAT. -/
def ETH_RAM : Prop := ∃ δ : ℝ, 0 < δ ∧ ¬ RAMDecidableInExpTime δ

/-- **C1.** ETH is false on the word RAM at logarithmic word size. -/
theorem not_eth_ram : ¬ ETH_RAM := by
  sorry

end EthBridge.WordRAM
