#!/usr/bin/env node
/* export-keller-certificate.js — detach the keller certificates from the
   machine that produced them (review R7: the outside-checkable artifact).

   Walks families/keller-audit.js, re-certifies every entry, and writes
   certs/keller-certificate.json: every polynomial as explicit monomials with
   exact rational coefficients, every witness as exact rationals, the claimed
   constant determinant, and the source pins. A stranger with a Python
   interpreter and NO code from this repository can then run

       python3 tools/verify_keller.py certs/keller-certificate.json

   which re-derives the Jacobian, expands the determinant symbolically over
   stdlib fractions, evaluates the collisions, and decides — the same three
   facts, none of this repo's arithmetic trusted.

   usage: node tools/export-keller-certificate.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const FAM = require(path.join(ROOT, 'families', 'keller-audit.js'));
const Q = require(path.join(ROOT, 'instruments', 'interval', 'rational.js'));
const PIN = require(path.join(ROOT, 'instruments', 'pin.js'));

/* a polynomial Map('e0,e1,..' -> rational) as sorted explicit monomials:
   [[e0, e1, ..., 'p/q'], ...] — nothing implicit, nothing floating */
function serialize(p) {
  const rows = [...p.entries()].map(([k, v]) => [...k.split(',').map(Number), Q.toString(v)]);
  rows.sort((a, b) => a.slice(0, -1).join(',') < b.slice(0, -1).join(',') ? -1 : 1);
  return rows;
}

const sh = (c) => { try { return cp.execSync(c, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return null; } };

const entries = [];
for (let i = 0; ; i++) {
  const o = FAM.enumerate(i);
  if (!o) break;
  if (!o.claim) continue;
  const c = FAM.certify(o);
  if (c.verdict !== 'HIT') continue;                /* only certificates detach */
  entries.push({
    id: 'keller-' + i, n: o.n, source: o.source,
    hessian: !!o.hessian || undefined,
    padded: !!o.padded || undefined,
    statement: c.text,
    det: Q.toString(o.claim.det),
    F: o.claim.F.map(serialize),
    collisions: o.claim.collisions.map(pt => pt.map(Q.toString)),
    image: o.claim.image.map(Q.toString),
    transcription: o.transcription || undefined,
    sourcePin: (c.extra && c.extra.sourcePin) || undefined,
    sweep: (c.extra && c.extra.sweep) || undefined
  });
}

const out = {
  what: 'Detached certificates for Jacobian/Hessian-conjecture counterexamples. Each entry claims: '
    + '(1) det of the Jacobian of F is identically the stated constant — a polynomial identity over Q; '
    + '(2) the listed rational points all map to the listed image under F, exactly; '
    + '(3) the points are pairwise distinct. Together: F is a Keller map that is not injective, so the '
    + 'Jacobian conjecture is false in that dimension (for hessian entries, F = grad Psi and the Hessian '
    + 'conjecture is false). Verify with tools/verify_keller.py — Python stdlib only, no code from this repo.',
  polynomialFormat: 'each polynomial is a list of monomials [e_1, ..., e_n, coeff] — exponents of x_1..x_n, '
    + 'then the exact rational coefficient as a string',
  generatedBy: 'tools/export-keller-certificate.js @ git ' + (sh('git rev-parse --short HEAD') || 'unknown'),
  sourcePins: PIN.PINS,
  entries
};

fs.mkdirSync(path.join(ROOT, 'certs'), { recursive: true });
const file = path.join(ROOT, 'certs', 'keller-certificate.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
console.log('certs/keller-certificate.json: ' + entries.length + ' certificates detached');
