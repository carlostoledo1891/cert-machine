# Writer B · Matrix multiplication over a field

I use the arithmetic-operation interpretation of the exponent in Markus Bläser, *Fast Matrix Multiplication*, Theory of Computing Graduate Surveys 5 (2013), from memory. A single circuit computes all entries of one matrix product. The size parameter is a positive integer, and the field can be finite or infinite.

## Sources for the definitions

I did not consult the survey or other literature during this task. I recall Bläser's discussions by topic and do not have a reliable definition number for them. The numbered references below use Bürgisser, Clausen and Shokrollahi, *Algebraic Complexity Theory* (1997), abbreviated BCS, with the chapter pointers supplied in the brief. For the rectangular and dual exponents I also use the formulation in François Le Gall, *Faster Algorithms for Rectangular Matrix Multiplication* (2012), §1, from memory.

| Lean definition | Definition followed and translation into Lean |
| --- | --- |
| `Input`, `EntryPoly`, `productEntry` | Bläser's matrix multiplication map (from memory), BCS ch. 15. The two sets of coordinates are disjoint even for square matrices. Over the polynomial ring on their union, entry `(i,j)` is the sum over the shared coordinate `h` of the left entry `(i,h)` times the right entry `(h,j)`. |
| `Op`, `Wire`, `Circuit` | Arithmetic circuits and straight-line programs, BCS ch. 4 (from memory). Arithmetic nodes have two ordered operands. Each operand is a constant, an input, or the result of an earlier node. A topological numbering represents the finite DAG. The `cost` field is its number of arithmetic nodes, and `output` selects the wires to read. |
| `Op.Holds`, `Wire.value`, `Circuit.ComputesOver` | Gate-by-gate interpretation of a straight-line computation, BCS ch. 4 (from memory). A wire reads its source. A single assignment gives values to all shared gates and satisfies their operation equations. Only indices below `cost` are read from that assignment. The same ring map interprets input coordinates, field constants and target entries. |
| `Model`, `Circuit.Correct` | Division-free polynomial computation and computation with division, BCS ch. 4 (from memory). The identity map of the polynomial ring and its canonical embedding into its fraction field implement the two identity tests in the brief. |
| `side` | Integral dimensions for rectangular multiplication, Bläser's rectangular problem and Le Gall §1 (from memory). The floor convention for the thin dimension comes from the brief. I use it on all three dimensions. |
| `AdmitsExponent` | Bläser's asymptotic arithmetic operation bound and BCS ch. 15 (from memory). For the meaning of big O, see also Cormen, Leiserson, Rivest and Stein, *Introduction to Algorithms*, 3rd ed., §3.1 (from memory). The positive constant and the threshold are chosen before the size. The circuit can then depend on the size. |
| `omega` | Bläser's infimum of admissible cost exponents and BCS ch. 15 (from memory), applied to each fixed rectangular shape as in Le Gall §1 (from memory). The optional last argument selects the gate model and defaults to division-free. |
| `alpha` | Dual exponent for the product with two long outside dimensions and a thin shared dimension, Le Gall §1 (from memory). I take the supremum on the closed interval in the brief. |
| `SquareExponent`, `SquareExponentWithDivision` | Claim 1 of the brief supplies the value. The exponent is the square specialization of Bläser's arithmetic exponent, BCS ch. 15 (from memory), using the respective gate model. |
| `DualExponent` | Claim 2 supplies the value for the dual exponent defined above, Le Gall §1 (from memory). |
| `RectangularExponent` | Claim 3 supplies the formula for the rectangular arithmetic exponent. The dimensions follow the matrix multiplication map of BCS ch. 15 (from memory). The formula is transcribed from the brief. |

## Conventions that affect the reading

**Cost and sharing.** Each addition, subtraction or multiplication costs one, including multiplication by a field constant. Each division also costs one in the division model. The circuit can reuse any value arbitrarily often. Input wires, copies and output designations are free. I allow every element of the fixed ground field as a free constant leaf. A constant-free circuit convention restricts the available constants, for example to zero, one and minus one. Other measures include formula size, which counts repeated subcomputations separately, and multiplicative complexity, which can allow free linear operations. Tensor rank is the minimum number of products in a bilinear decomposition of the map. Border rank also admits degenerations. I use total gate count because the brief asks for the number of scalar operations.

**Formal correctness.** The inputs are independent indeterminates over the given field. This matters over a finite field of order `q`, where `X^q` and `X` take the same values on all field elements although they are distinct polynomials. In the division model every denominator must be a nonzero rational function. A denominator can vanish at particular input matrices. The claim specifies a rational-function identity, so a circuit with such a pole can qualify. Requiring evaluation on every ground-field input would impose an additional condition.

**Asymptotic bound.** Field arithmetic has unit cost, and a circuit may be chosen separately for each size. A uniform model could also require a procedure to generate those circuits. The coefficient and threshold of the bound may depend on the field, the gate model, the fixed weights and the candidate exponent. Quantifying over every sufficiently large integer size implements big O directly. Requiring a bound at every positive size allows the coefficient to absorb the finitely many smaller cases. Taking the infimum allows the endpoint to be unattained, as in the convention of giving a bound with an arbitrarily small positive exponent slack.

**Dimension order and rounding.** In `omega F a b c`, the left input has dimensions `⌊n^a⌋ × ⌊n^b⌋` and the right input has dimensions `⌊n^b⌋ × ⌊n^c⌋`. Ceilings and padding to convenient integer sizes are other common conventions. Floors give exactly the thin dimension specified in the brief. Its notation `ω(F;1,1,t)` puts the variable weight last, while its description of the dual problem puts that weight on the shared dimension. Following the matrices gives `omega F 1 t 1` in this file. At `t = 0` the product is an outer product. Both endpoints are eligible for the exponent-two test. Taking the supremum requires no choice of a maximizing weight.

**Rectangular formula.** The arguments on the left stay in row, shared, column order. On the right, `x` is their maximum, `z` their minimum, and subtracting both from their sum gives the middle weight `y`, including ties. All three must be strictly positive. The square applies to the entire positive part, and its divisor is the product `4xyz`. At weights `(1,1,1)` this gives `2 + 1/4`. At `(1,t,1)` with `0 < t ≤ 1`, the expression inside the positive part is `2t − 1`.

I used the permitted local Mathlib source to check names. I did not run Lean. Elaboration remains unverified.

I did not see the claimant's Lean statement
