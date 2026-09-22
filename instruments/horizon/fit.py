"""The time-horizon fit as a certificate.

METR's time horizon (Kwa, West et al. 2025) is read off a weighted, L2-penalised
logistic regression of run success on log2(human minutes): the 50 % horizon is
the human length at which the fitted curve crosses one half. Their estimator is
scikit-learn's LogisticRegression(C = 1/λ) with per-run sample weights summing
to one; the fitted (slope, intercept) is the minimiser of

    J(w, b) = Σ_i s_i · [ −y_i log p_i − (1 − y_i) log(1 − p_i) ] + (λ/2) w²,
    p_i = σ(w x_i + b),  x_i = log2(minutes_i),

which is strictly convex, so the minimiser is the unique zero of the score

    F(w, b) = ( λ w − Σ s_i (y_i − p_i) x_i ,  −Σ s_i (y_i − p_i) ).

Here that zero is CERTIFIED: a float Newton iteration finds a candidate, and the
Krawczyk operator, evaluated in outward-rounded interval arithmetic over every
run with exp from the certified series, proves that a box around the candidate
contains exactly one zero of F. The horizon at success rate q is then the
interval extension  2^((logit q − b)/w)  over that box: an enclosure, never a
point. scikit-learn's own answer is a point found by L-BFGS to a tolerance; the
certified box says how far from the true minimiser any such point can be.

Two arithmetics, one formula set: floats for the candidate, intervals for the
certificate. The float path is never trusted for a stated number.
"""
from __future__ import annotations

import math
from fractions import Fraction
from typing import Dict, List, Optional, Sequence, Tuple

from . import interval as I

Iv = I.Iv


# --------------------------------------------------------------- the data
class Runs:
    """One agent's runs: minutes, outcome in [0, 1], weight, as floats and as
    intervals. The minute literal is read as the rational it denotes and
    enclosed by its float neighbours; log2 of it by the certified log."""

    def __init__(self, minutes: Sequence[float], y: Sequence[float], weights: Sequence[float]):
        n = len(minutes)
        if not (n == len(y) == len(weights)) or n == 0:
            raise ValueError("runs: mismatched or empty columns")
        self.n = n
        self.xf = [math.log2(float(m)) for m in minutes]
        self.yf = [float(v) for v in y]
        self.wf = [float(s) for s in weights]
        self.xi: List[Iv] = []
        for m in minutes:
            q = Fraction(str(m)) if not isinstance(m, Fraction) else m
            if q <= 0:
                raise ValueError("a run with non-positive human minutes")
            lo, hi = I.log_point(q)
            l2 = (I.from_fraction(lo / I.LN2_Q[1])[0], I.from_fraction(hi / I.LN2_Q[0])[1])
            self.xi.append(l2)
        q = lambda v: v if isinstance(v, Fraction) else Fraction(str(v))
        self.yi: List[Iv] = [I.from_fraction(q(v)) for v in y]
        self.wi: List[Iv] = [I.from_fraction(q(s)) for s in weights]
        self.weight_sum = math.fsum(self.wf)


# --------------------------------------------------------------- floats
def _sigma(z: float) -> float:
    """The logistic function without overflow: for z < 0 use e^z/(1+e^z)."""
    if z >= 0:
        return 1.0 / (1.0 + math.exp(-z))
    e = math.exp(z)
    return e / (1.0 + e)


def _score_f(R: Runs, lam: float, w: float, b: float) -> Tuple[float, float]:
    g_w, g_b = lam * w, 0.0
    for x, y, s in zip(R.xf, R.yf, R.wf):
        p = _sigma(w * x + b)
        r = s * (y - p)
        g_w -= r * x
        g_b -= r
    return g_w, g_b


def _hessian_f(R: Runs, lam: float, w: float, b: float) -> Tuple[float, float, float]:
    """(J_ww, J_wb, J_bb) of the score: Σ s p(1−p) x², Σ s p(1−p) x, Σ s p(1−p), plus λ on ww."""
    a, c, d = lam, 0.0, 0.0
    for x, s in zip(R.xf, R.wf):
        p = _sigma(w * x + b)
        v = s * p * (1.0 - p)
        a += v * x * x
        c += v * x
        d += v
    return a, c, d


def newton(R: Runs, lam: float, w0: float = -0.5, b0: float = 0.0, iters: int = 200) -> Tuple[float, float, int]:
    """Damped Newton on the score. Returns (w, b, iterations)."""
    w, b = w0, b0
    for k in range(iters):
        gw, gb = _score_f(R, lam, w, b)
        if abs(gw) < 1e-15 and abs(gb) < 1e-15:
            return w, b, k
        a, c, d = _hessian_f(R, lam, w, b)
        det = a * d - c * c
        if det <= 0:
            raise ArithmeticError("the Hessian is not positive definite")
        dw = (d * gw - c * gb) / det
        db = (a * gb - c * gw) / det
        t = 1.0
        # backtracking on the score norm
        n0 = gw * gw + gb * gb
        while t > 1e-6:
            gw2, gb2 = _score_f(R, lam, w - t * dw, b - t * db)
            if gw2 * gw2 + gb2 * gb2 < n0:
                break
            t /= 2
        w, b = w - t * dw, b - t * db
    return w, b, iters


# --------------------------------------------------------------- intervals
def _score_i(R: Runs, lam: Iv, W: Iv, B: Iv) -> Tuple[Iv, Iv]:
    g_w, g_b = I.mul(lam, W), (0.0, 0.0)
    for x, y, s in zip(R.xi, R.yi, R.wi):
        p = I.logistic(I.add(I.mul(W, x), B))
        r = I.mul(s, I.sub(y, p))
        g_w = I.sub(g_w, I.mul(r, x))
        g_b = I.sub(g_b, r)
    return g_w, g_b


def _jacobian_i(R: Runs, lam: Iv, W: Iv, B: Iv) -> List[List[Iv]]:
    a, c, d = lam, (0.0, 0.0), (0.0, 0.0)
    one = (1.0, 1.0)
    for x, s in zip(R.xi, R.wi):
        p = I.logistic(I.add(I.mul(W, x), B))
        v = I.mul(s, I.mul(p, I.sub(one, p)))
        a = I.add(a, I.mul(v, I.mul(x, x)))
        c = I.add(c, I.mul(v, x))
        d = I.add(d, v)
    return [[a, c], [c, d]]


def krawczyk(R: Runs, lam: float, w0: float, b0: float, max_rounds: int = 30) -> Dict:
    """Prove a box around (w0, b0) holds exactly one zero of the score.

    K(X) = x0 − A F(x0) + (I − A J(X)) (X − x0), with A the float inverse of the
    Hessian at x0. If K(X) lies strictly inside X, X holds exactly one zero (the
    Krawczyk theorem; the map is a contraction there). The radius starts at twice
    the Newton step at x0 and grows until the test passes or the rounds run out."""
    lam_i = I.from_fraction(lam if isinstance(lam, Fraction) else Fraction(str(lam)))
    a, c, d = _hessian_f(R, lam, w0, b0)
    det = a * d - c * c
    A = [[d / det, -c / det], [-c / det, a / det]]
    F0 = _score_i(R, lam_i, (w0, w0), (b0, b0))
    dvec = [I.add(I.mul((A[i][0], A[i][0]), F0[0]), I.mul((A[i][1], A[i][1]), F0[1])) for i in range(2)]
    x0 = [w0, b0]
    rad = [2 * I.mag(dvec[i]) + 1e-12 * max(1.0, abs(x0[i])) for i in range(2)]
    K = []
    for rnd in range(max_rounds):
        X = [(I.nd(x0[i] - rad[i]), I.nu(x0[i] + rad[i])) for i in range(2)]
        try:
            J = _jacobian_i(R, lam_i, X[0], X[1])
        except (ValueError, ZeroDivisionError, OverflowError) as e:
            # the box grew past what the certified exp can enclose: no certificate
            return {"ok": False, "box": X, "image": K, "rounds": rnd + 1, "why": str(e)}
        K = []
        ok = True
        for i in range(2):
            acc = I.sub((x0[i], x0[i]), dvec[i])
            for j in range(2):
                s = (0.0, 0.0)
                for k in range(2):
                    s = I.add(s, I.mul((A[i][k], A[i][k]), J[k][j]))
                m = I.neg(s)
                if i == j:
                    m = I.add((1.0, 1.0), m)
                acc = I.add(acc, I.mul(m, I.sub(X[j], (x0[j], x0[j]))))
            K.append(acc)
            if not I.interior(acc, X[i]):
                ok = False
        if ok:
            return {"ok": True, "box": X, "image": K, "rounds": rnd + 1, "maxRad": max(I.rad(k) for k in K)}
        rad = [r * 2 for r in rad]
    return {"ok": False, "box": X, "image": K, "rounds": max_rounds}


def horizon(box: List[Iv], q: float) -> Iv:
    """2^((logit q − b)/w) over the box, in minutes. Refuses a box whose slope
    interval touches zero."""
    lq = I.log(I.div(I.from_fraction(Fraction(str(q))), I.from_fraction(1 - Fraction(str(q)))))
    W, B = box
    if W[0] <= 0 <= W[1]:
        raise ArithmeticError("the slope box contains zero: no horizon")
    return I.exp2(I.div(I.sub(lq, B), W))


def fit(minutes: Sequence[float], y: Sequence[float], weights: Sequence[float], lam: float,
        quantiles: Sequence[float] = (0.5, 0.8)) -> Dict:
    """The whole certificate for one agent."""
    R = Runs(minutes, y, weights)
    w, b, it = newton(R, lam)
    K = krawczyk(R, lam, w, b)
    out = {"n": R.n, "weightSum": R.weight_sum, "lambda": lam, "candidate": {"slope": w, "intercept": b, "newtonIterations": it},
           "certified": K["ok"], "rounds": K["rounds"]}
    if not K["ok"]:
        out["why"] = "the Krawczyk image never lay inside the box"
        return out
    W, B = K["box"]
    out["box"] = {"slope": list(W), "intercept": list(B), "maxRad": K["maxRad"]}
    out["horizons"] = {}
    for q in quantiles:
        try:
            h = horizon(K["box"], q)
            out["horizons"][str(q)] = {"minutes": list(h), "verdict": "ENCLOSED"}
        except ArithmeticError as e:
            out["horizons"][str(q)] = {"minutes": None, "verdict": "REFUSED", "why": str(e)}
    return out
