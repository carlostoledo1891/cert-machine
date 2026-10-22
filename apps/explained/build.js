/* build.js — the easy read: one scrolling page that explains the method paper the way a good science channel would —
   big pictures, a few things to touch, every number real.

     site/explained/index.html     the page: body.html, page.css and page.js with {{KEYS}} filled from the records, rendered
                                   through design/template.js (the house tokens, sheet, nav and footer) with the page's own
                                   css and script — the house grammar, extended for a scrolling story

   EVERY NUMBER ON THE PAGE IS READ HERE, AT BUILD TIME, from the same gated sources the papers read: the method paper's
   macro file (tools/build-paper-numbers.js, refuse-on-drift from the records), the register's, the Riemann companion's
   (tools/paper-numbers/riemann-finite-layer.js, a third implementation held to claimbox's certificates), the self-audit's
   mutation record, the kissing wave's record and the kissing ledger. The page's interactive pieces compute in the browser
   in exact rational arithmetic over BigInt; the window widget's matrix is computed here, exactly, from the definitions
   (the same chain the companion's generator re-derives) and embedded as rationals. A missing or shapeless number refuses
   the build. Nothing on the page is typed.

   usage: node apps/explained/build.js          (make site runs it; make page R=apps/explained for the edit loop)
   apps/explained · cert-machine                                                                                      MIT */
'use strict';const fs = require('fs');
const path = require('path');
const { ROOT, V, flatten, fill, need, git, T } = require('./records.js');   /* the one reader of the records; shared with the sibling story pages */
const SITE = path.join(ROOT, 'site', 'explained');

/* ---- the window widget's matrix: degree-4 even windows, D₁ at fifteen terms, exactly ---- */
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; };
class Q { constructor(n, d = 1n) { n = BigInt(n); d = BigInt(d); if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; this.n = n / g; this.d = d / g; }
  add(o) { return new Q(this.n * o.d + o.n * this.d, this.d * o.d); } sub(o) { return new Q(this.n * o.d - o.n * this.d, this.d * o.d); } mul(o) { return new Q(this.n * o.n, this.d * o.d); } div(o) { return new Q(this.n * o.d, this.d * o.n); }
  toString() { return this.n + '/' + this.d; } }
const fact = (n) => { let r = 1n; for (let i = 2n; i <= n; i++) r *= i; return r; };
const binom = (n, k) => { let r = 1n; for (let i = 1n; i <= BigInt(k); i++) r = r * (BigInt(n) - i + 1n) / i; return r; };
const aK = (k) => new Q(2n * 4n ** (BigInt(k) + 1n) * fact(BigInt(k)), fact(2n * BigInt(k) + 2n));
const epsK = (K) => { const qq = BigInt((K + 2) * (2 * K + 3)); return aK(K).mul(new Q(qq, qq - 2n * BigInt(K + 1))); };
const padd = (p, e, v) => { p[e] = (p[e] || new Q(0n)).add(v); };
const convPair = (i, j) => { const out = {}; const half = new Q(1n, 2n);
  for (let a = 0; a <= 2 * j; a++) { const c = new Q(binom(2 * j, a)); const n = 2 * i + a + 1;
    for (let e = 0; e <= n; e++) { let v = new Q(binom(n, e)); for (let t = 0; t < n - e; t++) v = v.mul(half); if (e % 2) v = new Q(-v.n, v.d); padd(out, e + 2 * j - a, c.mul(v).div(new Q(BigInt(n)))); }
    let v0 = new Q(1n); for (let t = 0; t < n; t++) v0 = v0.mul(half); if (n % 2) v0 = new Q(-v0.n, v0.d); padd(out, 2 * j - a, new Q(-1n).mul(c).mul(v0).div(new Q(BigInt(n)))); }
  return out; };
const pmul = (p, q2) => { const r = {}; for (const a in p) for (const b in q2) padd(r, Number(a) + Number(b), p[a].mul(q2[b])); return r; };
const integ01 = (p) => { let s = new Q(0n); for (const e in p) s = s.add(p[e].div(new Q(BigInt(Number(e) + 1)))); return s; };
const d1 = (K) => { const p = { 1: new Q(1n), 2: new Q(-4n) }; for (let k = 0; k < K; k++) padd(p, 2 * k + 3, aK(k)); return p; };
const intEven = (i) => new Q(1n, 4n ** BigInt(i) * BigInt(2 * i + 1));
function quadForm(m, K) { const D = d1(K); const b = [], M = [];
  for (let i = 0; i < m; i++) { b.push(intEven(i)); M.push([]); for (let j = 0; j < m; j++) { const H = integ01(pmul(D, convPair(i, j))).mul(new Q(2n)); const Hji = integ01(pmul(D, convPair(j, i))).mul(new Q(2n)); M[i].push(intEven(i + j).add(H.add(Hji).div(new Q(2n)))); } }
  return { M, b }; }
function solveQ(M, b) { const n = b.length; const A = M.map((row, i) => row.concat([b[i]]));
  for (let col = 0; col < n; col++) { let piv = col; while (A[piv][col].n === 0n) piv++; [A[col], A[piv]] = [A[piv], A[col]]; const pv = A[col][col]; A[col] = A[col].map((x) => x.div(pv));
    for (let r = 0; r < n; r++) if (r !== col && A[r][col].n !== 0n) { const f = A[r][col]; A[r] = A[r].map((x, k) => x.sub(f.mul(A[col][k]))); } }
  return A.map((row) => row[n]); }
const K15 = 15; const { M, b } = quadForm(3, K15); const x = solveQ(M, b); let bx = new Q(0n); for (let i = 0; i < 3; i++) bx = bx.add(b[i].mul(x[i]));
const kstar = new Q(1n).div(bx); const cstar = x.map((xi) => xi.div(x[0])); const eps15 = epsK(K15);
const decOf = (q, k) => { const neg = q.n < 0n; const a = neg ? -q.n : q.n; const s = 10n ** BigInt(k); const t = ((a * s) / q.d).toString().padStart(k + 1, '0'); return (neg ? '-' : '') + t.slice(0, -k) + '.' + t.slice(-k); };
const pOf = (c) => { let num = new Q(0n), den = new Q(0n); for (let i = 0; i < 3; i++) { den = den.add(b[i].mul(c[i])); for (let j = 0; j < 3; j++) num = num.add(c[i].mul(c[j]).mul(M[i][j])); } return new Q(2n).sub(num.div(den.mul(den))).sub(eps15); };
const Pstar4 = new Q(2n).sub(kstar).sub(eps15); const quartic = [new Q(1n), new Q(-7n, 25n), new Q(-102n, 25n)]; const Pq = pOf(quartic);
need(decOf(Pstar4, 9) === '0.868641400' && decOf(Pq, 8) === '0.86864051' && decOf(pOf(cstar), 12) === decOf(Pstar4, 12), 'the degree-4 window matrix at fifteen terms does not reproduce the companion\'s numbers');
V.WIN = JSON.stringify({ M: M.map((r) => r.map(String)), b: b.map(String), eps: String(eps15), cstar: cstar.map(String), pstar: String(Pstar4), pquartic: String(Pq) });
V.WIN_PSTAR4 = decOf(Pstar4, 10); V.WIN_PQUARTIC15 = decOf(Pq, 10); V.WIN_CSTAR2 = decOf(cstar[1], 4); V.WIN_CSTAR4 = decOf(cstar[2], 4);

/* ---- a few more, for the cold open and the instruments ---- */
/* the route of a claim, the house flow figure (design/components.js), read on click */
const C = require(path.join(ROOT, 'design', 'components.js'));
const NODES = [
  { k: 'sentence', v: 'as printed', t: 'The sentence, as the source prints it', d: 'A claim is read at the head of its sentence or not at all: the bar as the exact rational its digits mean, the relation, the quantity. A hedge, a leading quantifier or a number nobody printed is refused with the rule.', role: 'dep' },
  { k: 'grammar', v: 'closed list', t: 'A closed grammar of claim shapes', d: 'A bound, an absolute bound with a finite range, a value printed to its digits and cut off, a constant published rounded, an exact identity, a kissing count, a tensor decomposition. Nothing else; no model, no guess.', role: 'dep' },
  { k: 'object', v: 'the reading', t: 'The object: the reading written down', d: 'The line of the source that prints the claim and the file\'s digest; the pin of the bytes and how they were decoded; the predicate; the hypotheses under which the predicate is the claim; the shape a witness against it would take.', role: 'sig' },
  { k: 'bytes', v: 'pinned', t: 'The claimant\'s bytes, pinned by sha256', d: 'The data the claim is about, as the claimant published it, held to its digest. A file that does not match is refused before it is read. The reading of the bytes is part of the verdict.', role: 'dep' },
  { k: 'decide', v: 'exact', t: 'Decided over exact rationals', d: 'The predicate is evaluated over the bytes in exact arithmetic, or in outward-rounded intervals with explicit tail bounds. Two checkers that share no code decide every object; a floating-point comparison is a screen, never an authority.', role: 'held' },
  { k: 'word', v: 'with witness', t: 'One of three words, with what justifies it', d: 'Certified with the certificate and its falsifier; refuted with the violating input; refused with the reason and, where there is one, the threshold that would change the word.', role: 'held' }
];
const nodes = NODES.map((n, i) => Object.assign({ x: 20 + i * 148, y: 34, w: 124, h: 52 }, n));
const edges = []; for (let i = 0; i < nodes.length - 1; i++) { const a = nodes[i], b = nodes[i + 1]; edges.push({ d: 'M' + (a.x + a.w) + ' 60 L' + b.x + ' 60' }); }
V.FLOW = C.flow({ w: 920, h: 120, alt: 'the route of a claim: sentence, grammar, object, bytes, decide, word', readout: { k: 'The route of a claim', d: 'Click a station to read what happens there. The dashed lines move while the page is open; nothing else on this figure is simulated.' }, nodes, edges, caption: 'The claim-machine translates; cert-machine decides. Every station leaves a record.' })
  .replace('<svg ', '<div class="flow-scroll"><svg ').replace('</svg>', '</svg></div>');
need(V.FLOW.includes('flow-scroll'), 'the flow figure did not wrap');

/* ---- fill the three parts and render through the house template ---- */
const bodyRaw = fill(T('apps/explained/body.html'), 'body.html');
const cssRaw = fill(T('apps/explained/page.css'), 'page.css');
const scriptRaw = '<script>\n(function(){\n\'use strict\';\n' + T('apps/explained/common.js') + '\n' + fill(T('apps/explained/page.js'), 'page.js') + '\n})();</script>';
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const footRaw = '<p>Every number on this page was read at build time from the records of the cert-machine repository at commit ' + git + ' on ' + V.DATE + ': the method paper\'s, the register\'s and the Riemann companion\'s macro files, the self-audit\'s mutation record, the kissing wave\'s record and ledger, the Chvátal–Sankoff replay and the translator\'s pinned README. The instruments compute in your browser in exact rational arithmetic over BigInt; nothing in them is simulated except the one byte corrupted on request, which says so. Written with AI assistance (Claude) under a written brief; the verdicts quoted are the machine\'s. The page builder is apps/explained/build.js.</p>';
const html = TPL.render({
  title: 'Who checks the machine\'s mathematics? The easy read', lang: 'en', bodyClass: 'easy', path: '/explained/',
  desc: 'Machines now produce mathematics faster than anyone can referee it. Six acts and five instruments explain how cert-machine decides such claims exactly: three words, one string of digits read two ways, 572 planted errors, exact arithmetic on a GPU, and the finite layer of a famous proof. Every number is read from a record.',
  bodyRaw, footRaw, cssRaw, scriptRaw
});
fs.mkdirSync(SITE, { recursive: true });
fs.writeFileSync(path.join(SITE, 'index.html'), html);
console.log('site/explained/index.html written (' + Math.round(html.length / 1024) + ' KB; ' + Object.keys(flatten()).length + ' numbers from the records) @ git ' + git);
