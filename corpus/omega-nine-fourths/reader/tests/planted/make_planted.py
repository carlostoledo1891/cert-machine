import sys, pathlib
src = pathlib.Path(sys.argv[1]).read_text()
out = pathlib.Path(sys.argv[2])
V = {
 "V1_wireDimension_floor": ("def wireDimension (N : ℕ) (w : ℝ) : ℕ := ⌈(N : ℝ) ^ w⌉₊",
                            "def wireDimension (N : ℕ) (w : ℝ) : ℕ := ⌊(N : ℝ) ^ w⌋₊"),
 "V2_sub_reversed":        ("(fun i j => v i + v j) (fun i j => v i - v j) (fun i j => v i * v j)",
                            "(fun i j => v i + v j) (fun i j => v j - v i) (fun i j => v i * v j)"),
 "V3_product_commuted":    ("∑ j : Fin b, X (Sum.inl (i, j)) * X (Sum.inr (j, k))",
                            "∑ j : Fin b, X (Sum.inr (j, k)) * X (Sum.inl (i, j))"),
 "V4_constant_cost_one":   ("  | .constant _ => 0\n", "  | .constant _ => 1\n"),
 "V5_dual_Icc_0_2":        ("sSup {t : ℝ | t ∈ Set.Icc 0 1 ∧ ω t = 2}",
                            "sSup {t : ℝ | t ∈ Set.Icc 0 2 ∧ ω t = 2}"),
 "V6_C_at_least_one":      ("∃ C : ℝ, 0 < C ∧ ∀ N : ℕ, 1 ≤ N →",
                            "∃ C : ℝ, 1 ≤ C ∧ ∀ N : ℕ, 1 ≤ N →"),
}
for name, (a, b) in V.items():
    n = src.count(a)
    assert n == 1, (name, n)
    (out / f"{name}.lean").write_text(src.replace(a, b))
    print(name, "ok")
