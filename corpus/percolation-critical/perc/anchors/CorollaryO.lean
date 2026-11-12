import Bridge
import Anchors

/-- p_c(3) < 1, from OpenAI's development through bridge O and the anchors (amendment A1). -/
theorem pc3_lt_one_from_openai : TextbookPercolation.pc 3 < 1 :=
  TextbookPercolation.pc3_lt_one_of_statement3 BridgeO.statement3_from_openai
