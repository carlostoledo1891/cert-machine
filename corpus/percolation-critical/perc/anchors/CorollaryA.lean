import Bridge
import Anchors

/-- p_c(d) < 1 for every d ≥ 2, from Anthropic's development through bridge A and the anchors (amendment A1). -/
theorem pc_lt_one_from_anthropic {d : ℕ} (hd : 2 ≤ d) : TextbookPercolation.pc d < 1 :=
  TextbookPercolation.pc_lt_one_of_statement statement_from_anthropic hd
