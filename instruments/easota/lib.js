/* instruments/easota/lib.js — the exact reader for the EinsteinArena table.

   Every solution file in corpus/easota is read as the RATIONALS its decimal
   literals denote (0.1 is 1/10, never the float64 neighbour), whether the
   literal sits in a JSON array or inside a Python `np.array([...])`. The
   deciders then work in instruments/interval/rational.js: BigInt fractions,
   exact comparisons, no tolerance anywhere. Where the platform's verifier
   carries a tolerance (1e-9 on an overlap, 1e-6 on a sum) the decider reports
   the exact slack instead, and the ledger says which side of zero it fell. */
'use strict';
const fs = require('fs');
const path = require('path');
const Q = require(path.join(__dirname, '..', 'interval', 'rational.js'));

const ROOT = path.resolve(__dirname, '..', '..');
const CORPUS = path.join(ROOT, 'corpus', 'easota');

/* a decimal / scientific literal -> exact rational */
function parseDecimal(s) {
  s = String(s).trim();
  const m = /^([+-]?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(s);
  if (!m) throw new Error('not a decimal literal: ' + s);
  const neg = m[1] === '-', frac = m[3] || '';
  let num = BigInt(m[2] + frac), k = BigInt(frac.length);
  if (m[4]) { const e = BigInt(m[4]); if (e >= 0n) { num *= 10n ** e; } else { k += -e; } }
  const r = Q.R(neg ? -num : num, 10n ** k);
  return r;
}
/* JSON numbers arrive as doubles; String(x) is the shortest literal that
   round-trips, which is the literal the file carries whenever the file was
   written by a shortest-repr serialiser (Python's json, numpy's repr). The
   kissing ledger read the platform's 594 the same way. */
const fromJsonNumber = (x) => parseDecimal(typeof x === 'string' ? x : String(x));

/* the numeric literals inside a Python bracketed literal, nested */
function pyLiteral(src, varName) {
  const re = new RegExp(varName + '\\s*=\\s*(?:np\\.array\\(|np\\.concatenate\\()?\\s*');
  const m = re.exec(src);
  if (!m) throw new Error('py: variable not found: ' + varName);
  let i = m.index + m[0].length;
  while (i < src.length && src[i] !== '[') i++;
  if (src[i] !== '[') throw new Error('py: no list literal after ' + varName);
  /* balanced-bracket parse into nested arrays of literal strings */
  const parse = () => {
    if (src[i] !== '[') throw new Error('py: expected [');
    i++;
    const out = [];
    let tok = '';
    const flush = () => { const t = tok.trim(); tok = ''; if (t) out.push(t); };
    for (; i < src.length; i++) {
      const c = src[i];
      if (c === '[') { flush(); out.push(parse()); i--; continue; }   /* parse() leaves i past the inner ']'; the loop's i++ must not skip a char */
      if (c === ']') { flush(); i++; return out; }
      if (c === ',' || /\s/.test(c)) { flush(); continue; }
      tok += c;
    }
    throw new Error('py: unbalanced brackets');
  };
  return parse();
}

const read = (p) => fs.readFileSync(path.join(CORPUS, p), 'utf8');
const readJson = (p) => JSON.parse(read(p));

/* ---- the loaders, one per file shape; each returns exact rationals ---- */
const loaders = {
  circles: (p) => readJson(p).circles.map((c) => c.map(fromJsonNumber)),
  points: (p, key) => readJson(p)[key].map((c) => c.map(fromJsonNumber)),
  autocorrJson: (p) => readJson(p).values.map(fromJsonNumber),
  autocorrPy: (p) => pyLiteral(read(p), 'f_values').map(parseDecimal),
  /* the minimum-overlap step functions: three of the four files fold a half */
  overlapPy: (p, how) => {
    const src = read(p);
    if (how === 'haugland') { const h = pyLiteral(src, 'haugland_half').map(parseDecimal); return h.concat(h.slice(0, -1).reverse()); }
    if (how === 'ae-half') { const h = pyLiteral(src, 'ae_half').map(parseDecimal); return h.slice(0, -1).concat(h.slice().reverse()); }
    return pyLiteral(src, 'h_values').map(parseDecimal);
  },
  weightsPy: (p) => pyLiteral(read(p), 'weights').map((row) => row.map(parseDecimal)),
  coefficientsPy: (p) => pyLiteral(read(p), 'coefficients').map((s) => BigInt(s)),
};

/* display helpers: an exact rational to a decimal string with d digits, and
   the two-sided rounding question the ledger asks of every printed number */
function toFixed(r, d) {
  const neg = Q.sign(r) < 0; const a = Q.abs(r);
  const scaled = a.n * 10n ** BigInt(d) / a.d;                /* floor */
  const s = scaled.toString().padStart(d + 1, '0');
  return (neg ? '-' : '') + s.slice(0, s.length - d) + (d ? '.' + s.slice(s.length - d) : '');
}
/* does the exact value round (half away from zero) to exactly this printed decimal? */
function printedIsRounding(r, printed) {
  const d = (String(printed).split('.')[1] || '').length;
  const p = parseDecimal(printed);
  const half = Q.R(1n, 2n * 10n ** BigInt(d));
  const lo = Q.sub(p, half), hi = Q.add(p, half);
  return Q.cmp(r, lo) >= 0 && Q.cmp(r, hi) <= 0;
}
/* the exact value truncated to the printed digits equals the printed string? */
function printedIsTruncation(r, printed) {
  const d = (String(printed).split('.')[1] || '').length;
  return toFixed(r, d) === String(printed) || toFixed(r, d) === (String(printed).startsWith('-') ? '' : '') + String(printed);
}

module.exports = { Q, parseDecimal, fromJsonNumber, pyLiteral, loaders, read, readJson, toFixed, printedIsRounding, printedIsTruncation, CORPUS, ROOT };
