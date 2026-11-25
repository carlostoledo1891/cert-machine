import sys, pathlib
src = pathlib.Path(sys.argv[1]).read_text()
out = pathlib.Path(sys.argv[2])
end = "end OAI.LinearAlgebra.MatrixExponent\n"
assert src.count(end) == 1 and src.endswith(end)
head = ("-- Reader test T3 (omega = 9/4 lane, F4). Definitions: byte copy of\n"
        "-- lean/OAI/LinearAlgebra/MatrixExponent/RationalCircuits.lean at openai/math 92b516ef\n"
        "-- (sha256 f25885e4de68fbcf80225455884dfeab932f512f27d42e10dde4531ae249bcd6), lines 1-52.\n"
        "-- Added: the theorem below, the statement of MatrixExponent.omega_eq in FieldFormula.lean.\n")
thm = ("/-- Theorem 1.1 of the paper in its own model: division by nonzero rational functions allowed. -/\n"
       "theorem omega_eq (F : Type*) [Field F] : omega F = 9 / 4 := by\n  sorry\n\n")
good = src[:-len(end)] + thm + end
bad = src[:-len(end)] + thm.replace("omega F = 9 / 4", "omega F = 2.24") + end
(out / "ReaderDivision.lean").write_text(head + good)
(out / "ReaderDivisionPlanted.lean").write_text(head.replace("Reader test T3", "Reader test T3 PLANTED (must be refused)") + bad)
print("written")
