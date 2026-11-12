import Textbook
import BridgeA
import BridgeO

/-!
# One Lean (amendment A2 of PREREG-PERCOLATION.md, item P4′; 2026-11-12)

One environment — Lean v4.32.0, Mathlib 81a5d257 — holding the sealed hand-written statement `Textbook.lean`
(sha256 4dc732f5…41ae, unchanged), Anthropic's development (anthropics/formal-math 795efb86, unchanged), OpenAI's ℤ³
closure (openai/math 4eaee875, `OAI/Probability/CriticalZ3/`, ported from Mathlib d13f23b7 to this pin; its statement
file `ComparatorChallenges/CriticalZ3.lean` unchanged) and both bridges (`BridgeA.lean`: the sealed bridge A, unchanged
bytes; `BridgeO.lean`: bridge O with three lines changed as the older Mathlib forces).

The two theorems below are about the SAME constants `TextbookPercolation.Statement` / `Statement3`, `θ`, `pc`, `P`:
there is one `Textbook` module in this environment and both bridges import it.
-/

namespace OneLean

/-- θ(p_c) = 0 for every d ≥ 2, our statement, from Anthropic's theorem through bridge A. -/
theorem statement_from_anthropic : TextbookPercolation.Statement :=
  _root_.statement_from_anthropic

/-- θ(p_c) = 0 at d = 3, our statement, from OpenAI's ℤ³ theorem through bridge O. -/
theorem statement3_from_openai : TextbookPercolation.Statement3 :=
  BridgeO.statement3_from_openai

end OneLean
