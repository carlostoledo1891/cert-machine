/* grade.js — the SECOND exact grader for boxed MATH answers, in JavaScript, written from the convention stated at the head
   of grade.py (the canonical objects and the three-valued decision) and sharing no code with it: its own rational type on
   BigInt, its own extraction, its own parsing. No dependency, no math-verify, nothing of the claimants' mathqa.py.

   The grader is three-valued and never guesses:
     CORRECT  the prediction and the gold answer parse to the SAME canonical exact object
     WRONG    both parse, to DIFFERENT exact objects, or the prediction has no closed \boxed{} at all
     REFUSED  the grader cannot decide (an expression it does not canonicalise, a \pm, an ordering it will not assume, …)

   Canonical objects (every one exact): ['q', Q] · ['q%', Q] · ['deg', Q] (equal to the bare number) · ['sqrt', Q, m] with m
   square-free · ['pi', Q] · ['c', Q, Q] · ['text', word] · ['base', digits, base] · ['tuple', [objects]] (ORDERED; the
   same multiset in another order is REFUSED) · ['lit', string] (equal strings CORRECT, different strings REFUSED).
   tools/wsp-grade-second.js re-grades every pair the Python grader graded and reports the disagreements. MIT */
'use strict';

/* ---- rationals on BigInt --------------------------------------------------------------------------------------- */
const abs = (a) => (a < 0n ? -a : a);
const gcd = (a, b) => { a = abs(a); b = abs(b); while (b) [a, b] = [b, a % b]; return a; };
function Q(n, d = 1n) {
  n = BigInt(n); d = BigInt(d);
  if (d === 0n) throw new Error('zero denominator');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d) || 1n;
  return { n: n / g, d: d / g };
}
const qEq = (a, b) => a.n === b.n && a.d === b.d;
const qAdd = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
const qMul = (a, b) => Q(a.n * b.n, a.d * b.d);
const qDiv = (a, b) => Q(a.n * b.d, a.d * b.n);
const qNeg = (a) => Q(-a.n, a.d);
const qZero = (a) => a.n === 0n;
const qStr = (a) => (a.d === 1n ? String(a.n) : a.n + '/' + a.d);
/* a decimal or integer string, optionally with a leading minus: "12", "-3.25", ".5", "7." */
function qDec(s) {
  const m = /^(-?)(\d*)(?:\.(\d*))?$/.exec(s);
  if (!m || (m[2] === '' && (m[3] === undefined || m[3] === ''))) return null;
  const frac = m[3] || '';
  const n = BigInt((m[2] || '0') + frac);
  const q = Q(n, 10n ** BigInt(frac.length));
  return m[1] ? qNeg(q) : q;
}

/* ---- extraction ------------------------------------------------------------------------------------------------ */
/* the content of the LAST \boxed{…}, brace-matched; "\boxed " without a brace reads to the next "$" or line end;
   no closed box → null */
function extractBoxed(text) {
  if (text === null || text === undefined) return null;
  const i = text.lastIndexOf('\\boxed');
  if (i < 0) return null;
  let j = i + '\\boxed'.length;
  while (j < text.length && text[j] === ' ') j++;
  if (j >= text.length) return null;
  if (text[j] !== '{') {
    let k = j;
    while (k < text.length && text[k] !== '$' && text[k] !== '\n') k++;
    const s = text.slice(j, k).trim();
    return s || null;
  }
  let depth = 0;
  for (let k = j; k < text.length; k++) {
    if (text[k] === '{') depth++;
    else if (text[k] === '}') { depth--; if (depth === 0) return text.slice(j + 1, k); }
  }
  return null;
}

/* ---- normalisation --------------------------------------------------------------------------------------------- */
function balanced(s) {
  let d = 0;
  for (const ch of s) { if (ch === '{') d++; else if (ch === '}') { d--; if (d < 0) return false; } }
  return d === 0;
}
function strip(s) {
  s = s.trim();
  for (const sp of ['\\!', '\\,', '\;', '\\ ']) s = s.split(sp).join('');
  s = s.split('\\left').join('').split('\\right').join('');
  s = s.split('\\dfrac').join('\\frac').split('\\tfrac').join('\\frac');
  s = s.split('\\displaystyle').join('');
  s = s.replace(/\\(?:text|mathrm|textbf|mbox)\{([^{}]*)\}/g, (_, w) => ' ' + w + ' ');
  s = s.split('$').join('');
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/\.+$/, '').trim();
  if (s.startsWith('{') && s.endsWith('}') && balanced(s.slice(1, -1))) s = s.slice(1, -1).trim();
  return s;
}

const NUM = '-?(?:\\d+(?:,\\d{3})+|\\d+\\.\\d*|\\.\\d+|\\d+)';
const full = (re, s) => new RegExp('^(?:' + re + ')$').exec(s);

/* a rational from an integer / decimal / grouped-integer string, or null */
function qNum(s) {
  s = s.trim().split(' ').join('');
  if (full('-?\\d{1,3}(?:,\\d{3})+', s)) s = s.split(',').join('');
  if (full('-?\\d+', s)) return Q(s);
  if (full('-?(?:\\d+\\.\\d*|\\.\\d+)', s)) return qDec(s);
  return null;
}
/* \frac{a}{b}, \frac ab, a/b, -\frac…, a\frac{b}{c} (mixed) → Q or null */
function frac(s) {
  s = s.trim().split(' ').join('');
  const m = full('(-?)(\\d+)?\\\\frac\\{(' + NUM + ')\\}\\{(' + NUM + ')\\}', s) || full('(-?)(\\d+)?\\\\frac(\\d)(\\d)', s)
    || full('(-?)(\\d+)?\\\\frac(\\d)\\{(' + NUM + ')\\}', s) || full('(-?)(\\d+)?\\\\frac\\{(' + NUM + ')\\}(\\d)', s);
  if (m) {
    const whole = m[2] ? Q(m[2]) : Q(0);
    const a = qNum(m[3]), b = qNum(m[4]);
    if (a === null || b === null || qZero(b)) return null;
    const v = qAdd(whole, qDiv(a, b));
    return m[1] ? qNeg(v) : v;
  }
  const m2 = full('(' + NUM + ')/(' + NUM + ')', s);
  if (m2) {
    const a = qNum(m2[1]), b = qNum(m2[2]);
    if (a === null || b === null || qZero(b)) return null;
    return qDiv(a, b);
  }
  return qNum(s);
}
/* n = c²·m with m square-free → [c, m] */
function sqfree(n) {
  let c = 1n, m = n, p = 2n;
  while (p * p <= m) { while (m % (p * p) === 0n) { m /= p * p; c *= p; } p += 1n; }
  return [c, m];
}
/* a coefficient before \sqrt or \pi: "", "-", "3", "-2", "\frac{3}{2}", "3/2" */
function coef(s) {
  s = s.trim();
  if (s === '' || s === '+') return Q(1);
  if (s === '-') return Q(-1);
  return frac(s);
}
function sqrtObj(c, n) {
  const [k, m] = sqfree(n);
  c = qMul(c, Q(k));
  return m === 1n ? ['q', c] : ['sqrt', c, m];
}

function splitTop(s, sep) {
  const out = []; let d = 0, cur = '';
  for (const ch of s) {
    if ('({['.includes(ch)) d++; else if (')}]'.includes(ch)) d--;
    if (ch === sep && d === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map((p) => p.trim());
}

function atom(s) {
  s = s.trim();
  if (s === '') return null;
  let m;
  /* a percentage */
  if ((m = full('(' + NUM + ')\\s*\\\\%', s)) || (m = full('(' + NUM + ')\\s*%', s))) return ['q%', qNum(m[1])];
  /* degrees */
  if ((m = full('(-?[\\d.,/\\\\{}frac]+?)\\s*\\^\\s*(?:\\\\circ|\\{\\\\circ\\})', s))) {
    const q = frac(m[1]);
    if (q !== null) return ['deg', q];
  }
  /* a plain rational */
  const q = frac(s);
  if (q !== null) return ['q', q];
  /* a base-n literal */
  if ((m = full('(\\d+)_\\{?(\\d+)\\}?', s))) return ['base', m[1], m[2]];
  /* c·√m */
  const t = s.split(' ').join('');
  if ((m = full('(-?\\d*|-?\\\\frac\\{\\d+\\}\\{\\d+\\}|-?\\d+/\\d+)\\\\sqrt(?:\\{(\\d+)\\}|(\\d+))(?:/(\\d+))?', t))) {
    let c = coef(m[1]);
    const n = BigInt(m[2] !== undefined ? m[2] : m[3]);
    if (c !== null) { if (m[4]) c = qDiv(c, Q(m[4])); return sqrtObj(c, n); }
  }
  if ((m = full('(-?)\\\\frac\\{(\\d*)\\\\sqrt\\{?(\\d+)\\}?\\}\\{(\\d+)\\}', t))) {
    let c = Q(m[2] ? m[2] : 1, m[4]);
    if (m[1]) c = qNeg(c);
    return sqrtObj(c, BigInt(m[3]));
  }
  /* c·π */
  if ((m = full('(-?\\d*|-?\\\\frac\\{\\d+\\}\\{\\d+\\}|-?\\d+/\\d+)\\\\pi(?:/(\\d+))?', t))) {
    let c = coef(m[1]);
    if (c !== null) { if (m[2]) c = qDiv(c, Q(m[2])); return ['pi', c]; }
  }
  if ((m = full('(-?)\\\\frac\\{(\\d*)\\\\pi\\}\\{(\\d+)\\}', t))) {
    let c = Q(m[2] ? m[2] : 1, m[3]);
    if (m[1]) c = qNeg(c);
    return ['pi', c];
  }
  /* a + b i with rational a, b (the convention's statement; "3i" and "-3i" are b i with a = 0) */
  const FR = '-?\\\\frac\\{\\d+\\}\\{\\d+\\}';
  if ((m = full('(' + NUM + '|' + FR + ')?\\s*([+-])?\\s*(' + NUM + '|\\\\frac\\{\\d+\\}\\{\\d+\\})?\\s*i', s)) && s.includes('i') && (m[1] || m[2] || m[3])) {
    const re_ = m[1], sign = m[2], im_ = m[3];
    if (re_ && !sign && im_ === undefined) {
      const b = frac(re_);
      return b === null ? null : ['c', Q(0), b];
    }
    const a = re_ ? frac(re_) : Q(0);
    let b = im_ ? frac(im_) : Q(1);
    if (a === null || b === null) return null;
    if (sign === '-') b = qNeg(b);
    return ['c', a, b];
  }
  if ((m = full('(-?)(' + NUM + '|\\\\frac\\{\\d+\\}\\{\\d+\\})?i', t))) {
    const b = m[2] ? frac(m[2]) : Q(1);
    if (b === null) return null;
    return ['c', Q(0), m[1] ? qNeg(b) : b];
  }
  /* a bare word */
  if (full('[A-Za-z][A-Za-z ]*', s)) return ['text', s.trim().toLowerCase()];
  return null;
}

/* the canonical exact object of an answer string, or ['lit', normalised] when nothing else applies */
function canon(s) {
  if (s === null || s === undefined) return null;
  s = strip(s);
  if (s === '') return ['lit', ''];
  const ns = s.split(' ').join('');
  if (full('-?\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?', ns)) return ['q', qDec(ns.split(',').join(''))];
  let inner = s;
  const wrapped = (s.startsWith('(') && s.endsWith(')')) || (s.startsWith('[') && s.endsWith(']'));
  if (wrapped) inner = s.slice(1, -1);
  const parts = splitTop(inner, ',');
  if (parts.length > 1) {
    const atoms = parts.map(atom);
    if (atoms.every((a) => a !== null)) {
      const o = s[0], c = s[s.length - 1];
      if ('(['.includes(o) && ')]'.includes(c) && ((o === '(' && c === ']') || (o === '[' && c === ')'))) return ['lit', ns];   /* an interval */
      return ['tuple', atoms];
    }
  }
  const a = atom(s);
  if (a !== null) return a;
  return ['lit', ns];
}

/* ---- the decision ----------------------------------------------------------------------------------------------- */
function key(o) {   /* an injective string of a canonical object, for exact equality and multiset comparison */
  return o.map((x) => (typeof x === 'object' && x !== null && 'n' in x ? 'Q' + qStr(x) : Array.isArray(x) ? '[' + x.map(key).join(';') + ']' : typeof x === 'bigint' ? 'B' + x : 'S' + x)).join('|');
}
function same(g, p) {
  if (key(g) === key(p)) return true;
  if (g[0] === 'deg' && p[0] === 'q' && qEq(g[1], p[1])) return true;   /* the gold's degree sign read as decoration */
  if (g[0] === 'q' && p[0] === 'deg' && qEq(g[1], p[1])) return true;
  return false;
}
const show = (o) => o[0] + ':' + o.slice(1).map((x) => (typeof x === 'object' && x !== null && 'n' in x ? qStr(x) : String(x))).join(',');

/* returns [verdict, reason]: CORRECT / WRONG / REFUSED */
function grade(gold, pred) {
  if (pred === null || pred === undefined) return ['WRONG', 'no closed \\boxed{} in the response'];
  const g = canon(gold), p = canon(pred);
  if (g[0] === 'lit' || p[0] === 'lit') {
    if (g[0] === 'lit' && p[0] === 'lit' && g[1] === p[1]) return ['CORRECT', 'identical after normalisation'];
    return ['REFUSED', 'not canonicalised: gold ' + g[0] + ' / pred ' + p[0]];
  }
  if (g[0] === 'tuple' && p[0] === 'tuple') {
    if (g[1].length !== p[1].length) return ['WRONG', 'tuples of different length'];
    if (g[1].every((x, i) => same(x, p[1][i]))) return ['CORRECT', 'equal tuples'];
    if (g[1].map(key).sort().join('\n') === p[1].map(key).sort().join('\n')) return ['REFUSED', 'the same elements in another order (a set may be meant)'];
    if (g[1].some((x) => x[0] === 'lit') || p[1].some((y) => y[0] === 'lit')) return ['REFUSED', 'a tuple element not canonicalised'];
    return ['WRONG', 'different tuples'];
  }
  if (g[0] === 'tuple' || p[0] === 'tuple') {
    if (g[0] === 'tuple' && g[1].length === 1 && same(g[1][0], p)) return ['CORRECT', 'a singleton tuple'];
    return ['WRONG', 'a tuple against a scalar'];
  }
  if (same(g, p)) return ['CORRECT', 'equal exact objects'];
  if (g[0] === 'text' || p[0] === 'text') return [g[0] === 'text' && p[0] === 'text' ? 'WRONG' : 'REFUSED', 'text answers'];
  if ((g[0] === 'q%' || p[0] === 'q%') && g[0] !== p[0]) return ['REFUSED', 'a percentage against a number (the convention is not decided here)'];
  if ((g[0] === 'base' || p[0] === 'base') && g[0] !== p[0]) return ['REFUSED', 'a base-n literal against a bare number (the convention is not decided here)'];
  return ['WRONG', 'different exact objects: ' + show(g) + ' vs ' + show(p)];
}

module.exports = { extractBoxed, canon, grade, Q, key };

if (require.main === module) {
  const [gold, pred] = process.argv.slice(2);
  console.log(JSON.stringify(grade(gold, pred === undefined ? null : pred)));
}
