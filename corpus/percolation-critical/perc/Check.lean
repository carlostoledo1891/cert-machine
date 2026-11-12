import Textbook
#check @TextbookPercolation.Statement
#check @TextbookPercolation.Statement3
#print axioms TextbookPercolation.adjacent_comm
#check (ProbabilityTheory.bernoulliMeasure : Bool → Bool → unitInterval → MeasureTheory.Measure Bool)
example (p : unitInterval) : MeasureTheory.IsProbabilityMeasure (TextbookPercolation.P 3 p) := by unfold TextbookPercolation.P; infer_instance
