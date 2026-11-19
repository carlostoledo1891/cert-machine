"""Four-state continuous-time ring, observed at independent Poisson times.
Run with Python 3. The fractions below are population predictions.

Derivation of the model-class lower bound
-----------------------------------------
Assume a stationary finite continuous-time Markov jump process, all states
even under time reversal, an instantaneous deterministic output f in {-1,1},
and an independent Poisson sampling clock of rate r. sigma is the stationary
path entropy production in k_B per second, i.e. the rate of relative entropy
in nats between the forward and reversed hidden path laws.

Let K be the one-sample kernel, K* its stationary adjoint, and use the
stationary inner product. Define h=(Kf+K*f)/2 and d=(Kf-K*f)/2. Since
||f||=1 and C1=<f,h>, while C2=<K*f,Kf>=||h||^2-||d||^2, we have
||d||^2 >= C1^2-C2. At each starting state i, |d(i)| is at most the
total variation distance of K(i,.) and K*(i,.). Apply Pinsker row by row:
relative entropy of the forward hidden endpoint pair versus its reversal
is at least 2||d||^2. Data processing bounds that relative entropy above
by the relative entropy of the hidden paths with their sampled duration.
The independent duration has mean 1/r, so the latter is sigma/r.
Thus sigma >= 2*r*(C1^2-C2). The Python replay verifies the finite
example and arithmetic; this derivation supplies the general implication.
"""
from fractions import Fraction as F
from itertools import product


def solve(matrix, rhs):
    n = len(rhs)
    rows = [[F(v) for v in row] + [F(y)] for row, y in zip(matrix, rhs)]
    for j in range(n):
        i = next(i for i in range(j, n) if rows[i][j])
        rows[j], rows[i] = rows[i], rows[j]
        pivot = rows[j][j]
        rows[j] = [v / pivot for v in rows[j]]
        for i in range(n):
            if i != j:
                k = rows[i][j]
                rows[i] = [a-k*b for a, b in zip(rows[i], rows[j])]
    return [row[-1] for row in rows]


def sampled_kernel(cw, ccw, rate):
    # K = rate * (rate I - Q)^(-1), for row-generator Q.
    mat = [[0]*4 for _ in range(4)]
    for i in range(4):
        mat[i][i] = rate + cw + ccw
        mat[i][(i+1)%4] = -cw
        mat[i][(i-1)%4] = -ccw
    columns = [solve(mat, [rate * (i == j) for i in range(4)]) for j in range(4)]
    return list(zip(*columns))


def observations(cw, ccw):
    K = sampled_kernel(cw, ccw, rate=2)
    light = [1, 1, -1, -1]
    reflection = [(1-i)%4 for i in range(4)]
    assert all(sum(row) == 1 and min(row) > 0 for row in K)
    assert all(sum(col) == 1 for col in zip(*K))  # uniform stationary law
    assert all(light[i] == light[reflection[i]] for i in range(4))
    assert all(K[i][j] == K[reflection[j]][reflection[i]]
               for i, j in product(range(4), repeat=2))
    # These symmetries map every hidden path to one emitting its reversed word.
    c1 = c2 = same = twice_same = F(0)
    for i, j, k in product(range(4), repeat=3):
        prob = K[i][j]*K[j][k]/4
        c1 += prob*light[i]*light[j]
        c2 += prob*light[i]*light[k]
        same += prob*(light[i] == light[j])
        twice_same += prob*(light[i] == light[j] == light[k])
    return c1, c2, same, twice_same


if __name__ == "__main__":
    c1, c2, same, twice = observations(3, 1)
    assert (c1, c2, same, twice) == (F(3,10), F(2,25), F(13,20), F(21,50))
    assert twice - same**2 == -F(1,400)
    a, b, p, q = observations(2, 2)
    assert b >= a*a and q >= p*p
    assert observations(1, 3) == observations(3, 1)
    print("Lag correlations:", c1, c2)
    print("Probability of agreement:", same)
    print("Probability of agreement twice:", twice)
    print("Covariance of successive agreement flags:", twice - same**2)
    rate = 2
    lower_bound = 2*rate*(c1*c1-c2)
    assert lower_bound == F(1,25)
    print("Entropy-production lower bound in k_B/s:", lower_bound)
