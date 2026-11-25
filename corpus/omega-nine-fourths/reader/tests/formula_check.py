# Checks of the RHS of rectangular_exponent (MatrixExponent.lean l.124-131), exact rationals.
from fractions import Fraction as Q
import itertools, random

def div(a, b):            # Lean's real division: x/0 = 0
    return Q(0) if b == 0 else a / b

def rhs(a, b, c):
    a, b, c = Q(a), Q(b), Q(c)
    A, B, C = max(a, Q(0)), max(b, Q(0)), max(c, Q(0))
    x = max(A, max(B, C)); z = min(A, min(B, C)); y = A + B + C - x - z
    return x + y + div(max((x + y) * z - x * y, Q(0)) ** 2, 4 * x * y * z)

print("(1,1,1) =", rhs(1, 1, 1))
print("(1,1,0), (1,0,0), (0,0,0), (1,1,-5) =", rhs(1, 1, 0), rhs(1, 0, 0), rhs(0, 0, 0), rhs(1, 1, -5))
# denominator zero => numerator zero (so x/0 = 0 never changes a value)
bad = 0
random.seed(1)
vals = [Q(random.randint(-20, 40), random.randint(1, 12)) for _ in range(60)] + [Q(0), Q(1), Q(-1)]
trip = list(itertools.product(vals[:25], repeat=3))
for a, b, c in trip:
    A, B, C = max(a, 0), max(b, 0), max(c, 0)
    x = max(A, B, C); z = min(A, B, C); y = A + B + C - x - z
    if 4 * x * y * z == 0 and max((x + y) * z - x * y, 0) != 0: bad += 1
print("triples with zero denominator but nonzero numerator:", bad, "of", len(trip))
# symmetry under all 6 permutations, homogeneity, bounds
sym = hom = lo = up = cyc = 0
for a, b, c in trip:
    v = rhs(a, b, c)
    if any(rhs(*p) != v for p in itertools.permutations((a, b, c))): sym += 1
    if rhs(3 * a, 3 * b, 3 * c) != 3 * v: hom += 1
    A, B, C = max(a, 0), max(b, 0), max(c, 0)
    if v < max(A + B, B + C, C + A): lo += 1            # output/input-size bound
    if v > A + B + C: up += 1                            # schoolbook bound
    if v < Q(3, 4) * (A + B + C): cyc += 1               # Cor 1.3 in exponent form
print("perm-asymmetric:", sym, "non-homogeneous:", hom, "below pairwise-sum bound:", lo,
      "above schoolbook:", up, "below (3/4)(a+b+c):", cyc)
# the (1,1,t) section that defines formalAlpha
for t in [Q(0), Q(1, 4), Q(1, 2), Q(51, 100), Q(2, 3), Q(1), Q(3, 2)]:
    print("t =", t, " omega(1,1,t) =", rhs(1, 1, t), " = 1+t+1/(4t)?", (t >= Q(1, 2) and t <= 1 and rhs(1, 1, t) == 1 + t + 1 / (4 * t)))
