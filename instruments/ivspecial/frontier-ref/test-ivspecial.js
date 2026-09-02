/* selftests for ivspecial.js — exact closed forms are the falsifiers.
   Half-integer Bessel = elementary functions pins the FRACTIONAL-order
   path (powIv + gammaIv + series) end to end. */
'use strict';
const I = require('../../lib/eqcert/interval.js');
const T = require('../../lib/eqcert/transcendental.js');
const S = require('./ivspecial.js');
const { iv, add, sub, mul, div } = I;

let failures = 0;
function check(name, cond, detail) {
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
  if (!cond) failures++;
}
const width = a => a[1] - a[0];
const containsIv = (a, b) => a[0] <= b[0] && b[1] <= a[1]; // a ⊇ b

/* sqrt */
check('sqrt(4) ∋ 2', I.contains(S.sqrtIv(iv(4)), 2));
check('sqrt(2)² ∋ 2', I.contains(I.mul(S.sqrtIv(iv(2)), S.sqrtIv(iv(2))), 2));

/* atan */
const q1 = S.atanIv(iv(1));
check('atan(1) = π/4', containsIv(q1, div(T.PI, iv(4))) || containsIv(div(T.PI, iv(4)), q1),
  `atan1=[${q1[0]},${q1[1]}] width=${width(q1).toExponential(1)}`);
check('atan(1) width tiny', width(q1) < 1e-13);
for (const t of [0.3, 1.7, 12.5, 4000]) {
  const a = S.atanIv(iv(t));
  check(`atan(${t}) ∋ float`, I.contains(a, Math.atan(t)), `w=${width(a).toExponential(1)}`);
}

/* angleOf quadrants */
for (const [dx, dy, exp] of [[1, 1, Math.PI / 4], [-1, 1, 3 * Math.PI / 4],
  [-1, -1, 5 * Math.PI / 4], [1, -1, 7 * Math.PI / 4], [0, 1, Math.PI / 2], [0, -1, 3 * Math.PI / 2]]) {
  const a = S.angleOf(dx, dy);
  check(`angleOf(${dx},${dy})`, I.contains(a, exp), `w=${width(a).toExponential(1)}`);
}

/* gamma: exact integers */
for (const [z, exp] of [[1, 1], [2, 1], [3, 2], [4, 6], [7, 720], [11, 3628800], [21, 2432902008176640000]]) {
  const g = S.gammaIv(iv(z));
  check(`Γ(${z}) ∋ ${exp}`, I.contains(g, exp), `rel-w=${(width(g) / exp).toExponential(1)}`);
}
/* half-integers: Γ(1.5) = √π/2, Γ(2.5) = 3√π/4, Γ(35.5) via recurrence check */
const sqPi = S.sqrtIv(T.PI);
const g15 = S.gammaIv(iv(1.5));
check('Γ(1.5) = √π/2 overlap', !(g15[1] < div(sqPi, iv(2))[0] || g15[0] > div(sqPi, iv(2))[1]),
  `Γ(1.5)=[${g15[0]},${g15[1]}]`);
const g25 = S.gammaIv(iv(2.5));
const ref25 = mul(iv(0.75), sqPi);
check('Γ(2.5) = 3√π/4 overlap', !(g25[1] < ref25[0] || g25[0] > ref25[1]));
/* functional equation Γ(z+1) = zΓ(z) at fractional z */
for (const z of [1.31, 5.77, 20.4, 33.2]) {
  const lhs = S.gammaIv(iv(z + 1));
  const rhs = mul(iv(z), S.gammaIv(iv(z)));
  const inter = !(lhs[1] < rhs[0] || lhs[0] > rhs[1]);
  check(`Γ(${z}+1) = ${z}·Γ(${z})`, inter,
    `rel-w=${(width(lhs) / lhs[0]).toExponential(1)}`);
}

/* Bessel: J_{1/2}(x) = √(2/(πx))·sin x — exact fractional-order falsifier */
for (const x of [0.5, 1.7, 4.3]) {
  const j = S.besselJIv(iv(0.5), iv(x));
  const ref = mul(S.sqrtIv(div(iv(2), mul(T.PI, iv(x)))), T.sin(iv(x)));
  const inter = !(j[1] < ref[0] || j[0] > ref[1]);
  check(`J_{1/2}(${x}) = √(2/πx)sin x`, inter,
    `J=[${j[0].toFixed(12)},${j[1].toFixed(12)}] w=${width(j).toExponential(1)}`);
}
/* J_{3/2}(x) = √(2/(πx))·(sin x / x − cos x) */
for (const x of [1.1, 3.9]) {
  const j = S.besselJIv(iv(1.5), iv(x));
  const ref = mul(S.sqrtIv(div(iv(2), mul(T.PI, iv(x)))),
    sub(div(T.sin(iv(x)), iv(x)), T.cos(iv(x))));
  const inter = !(j[1] < ref[0] || j[0] > ref[1]);
  check(`J_{3/2}(${x})`, inter, `w=${width(j).toExponential(1)}`);
}
/* integer order vs known values: J_0(1) = 0.7651976865579666, J_1(2) = 0.5767248077568734 */
check('J_0(1)', I.contains(S.besselJIv(iv(0), iv(1)), 0.7651976865579666));
check('J_1(2)', I.contains(S.besselJIv(iv(0), iv(1)), 0.7651976865579666) &&
  I.contains(S.besselJIv(iv(1), iv(2)), 0.5767248077568734));

/* recurrence J_{ν−1}(x) + J_{ν+1}(x) = (2ν/x) J_ν(x) at fractional ν */
for (const [nu, x] of [[1.7058, 3.3], [2.4169, 4.6], [3.4116, 2.2]]) {
  const lhs = add(S.besselJIv(iv(nu - 1), iv(x)), S.besselJIv(iv(nu + 1), iv(x)));
  const rhs = mul(div(mul(iv(2), iv(nu)), iv(x)), S.besselJIv(iv(nu), iv(x)));
  const d = sub(lhs, rhs);
  check(`recurrence ν=${nu} x=${x} ∋ 0`, d[0] <= 0 && d[1] >= 0, `d=[${d[0].toExponential(1)},${d[1].toExponential(1)}]`);
}

/* derivative: J'_ν = J_{ν−1} − (ν/x)J_ν at fractional ν (identity check) */
for (const [nu, x] of [[1.7058, 3.3], [2.235, 1.9]]) {
  const jd = S.besselJdIv(iv(nu), iv(x));
  const ref = sub(S.besselJIv(iv(nu - 1), iv(x)), mul(div(iv(nu), iv(x)), S.besselJIv(iv(nu), iv(x))));
  const inter = !(jd[1] < ref[0] || jd[0] > ref[1]);
  check(`J'_{${nu}}(${x}) identity`, inter, `w=${width(jd).toExponential(1)}`);
}
/* derivative vs numeric */
{
  const nu = 2.4169, x = 3.1, h = 1e-6;
  const num = ((S.besselJIv(iv(nu), iv(x + h))[0] + S.besselJIv(iv(nu), iv(x + h))[1]) / 2
    - (S.besselJIv(iv(nu), iv(x - h))[0] + S.besselJIv(iv(nu), iv(x - h))[1]) / 2) / (2 * h);
  const jd = S.besselJdIv(iv(nu), iv(x));
  check('J\' vs central difference', Math.abs(num - (jd[0] + jd[1]) / 2) < 1e-8,
    `num=${num.toFixed(10)} iv=${((jd[0] + jd[1]) / 2).toFixed(10)}`);
}

console.log(failures ? `\nFAILURES: ${failures}` : '\nALL PASS');
process.exit(failures ? 1 : 0);
