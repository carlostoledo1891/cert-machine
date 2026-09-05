/**
 * port.mjs — the typed value that travels a wire.
 *
 * certkit's guard rail protects NUMERIC exactness: a Number never becomes an
 * exact value by accident, because Q(0.1) raises and valueOf() throws. That is
 * right and it is table stakes.
 *
 * This file protects the other thing, which is what this bench actually fails
 * on: HYPOTHESIS exactness. Three times in one session, code that was
 * individually correct produced a meaningless result because two values wired
 * together were about different problems — a witness checked against 838
 * constraint rows joined to a ceiling computed over 6677; an additive error
 * allowance joined to a multiplicative loss; a chi-squared from thermal-only
 * sigmas reported as a fact about the data. None of those is a rounding error.
 *
 * So a value carries three things, not one:
 *
 *     datum        the number, interval, or rational
 *     kind         FLOAT | INTERVAL | RATIONAL      (certkit's axis)
 *     hyp          the hypothesis list that makes the datum MEAN what it says
 *
 * and two values may only meet if their hypothesis stamps agree. A wire between
 * mismatched stamps is refused the way Q(0.1) is refused: at the boundary, loudly,
 * before anything downstream can look reasonable.
 */

export const FLOAT = 'float';
export const INTERVAL = 'interval';
export const RATIONAL = 'rational';
export const KINDS = [FLOAT, INTERVAL, RATIONAL];

/** Kinds that a verdict may depend on. A float may prune; it may never decide. */
export const DECIDING = new Set([INTERVAL, RATIONAL]);

export class HypothesisMismatch extends TypeError {}
export class KindRefused extends TypeError {}

const hash = (s) => {                      // FNV-1a; an identity, not a secret
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
};

const canon = (o) => {
  if (o === null || typeof o !== 'object') return JSON.stringify(o);
  if (Array.isArray(o)) return '[' + o.map(canon).join(',') + ']';
  return '{' + Object.keys(o).sort().map(k => JSON.stringify(k) + ':' + canon(o[k])).join(',') + '}';
};

/**
 * An ordered, canonical statement of everything a value is conditional on.
 * Every published number this bench owns is conditional on something; the rail
 * is where those live so the verdict can print the conjunction instead of the
 * headline.
 */
export class Hyp {
  constructor(dict = {}) {
    this.d = Object.freeze({ ...dict });
    this.stamp = hash(canon(this.d));
    Object.freeze(this);
  }
  with(extra) { return new Hyp({ ...this.d, ...extra }); }
  /** A relaxation is a DIFFERENT hypothesis set, and says so. */
  relax(key, value) { return this.with({ [key]: value }); }
  agrees(o) { return this.stamp === o.stamp; }
  diff(o) {
    const keys = [...new Set([...Object.keys(this.d), ...Object.keys(o.d)])].sort();
    return keys.filter(k => canon(this.d[k]) !== canon(o.d[k]))
      .map(k => `${k}: ${JSON.stringify(this.d[k])} vs ${JSON.stringify(o.d[k])}`);
  }
  toString() { return `H:${this.stamp}`; }
  toJSON() { return { stamp: this.stamp, ...this.d }; }
}

export const hyp = (d) => new Hyp(d);
export const NO_HYP = new Hyp({});

export class Val {
  constructor(datum, kind, h = NO_HYP) {
    if (!KINDS.includes(kind)) throw new KindRefused(`unknown kind ${kind}`);
    if (kind !== FLOAT && typeof datum === 'number') {
      throw new KindRefused(
        `a Number was offered as ${kind}: ${datum}. It has already lost the value you meant — ` +
        `pass a string, a BigInt, or an interval.`);
    }
    this.datum = datum; this.kind = kind; this.hyp = h;
    Object.freeze(this);
  }
  /** The guard rail, one level up from certkit's: no implicit anything. */
  valueOf() {
    throw new KindRefused('refusing implicit conversion of a certified value. Read .datum deliberately.');
  }
  toString() { return `${this.kind}(${JSON.stringify(this.datum)})@${this.hyp.stamp}`; }
  toJSON() { return { kind: this.kind, datum: this.datum, hyp: this.hyp.toJSON() }; }
}

export const flt = (x, h) => new Val(x, FLOAT, h);
export const ivl = (lo, hi, h) => new Val({ lo, hi }, INTERVAL, h);
export const rat = (s, h) => new Val(String(s), RATIONAL, h);

/** The check a wire performs. Returns null when the join is legal. */
export function refuseJoin(a, b, { requireSameHyp = true } = {}) {
  if (requireSameHyp && !a.hyp.agrees(b.hyp)) {
    const d = a.hyp.diff(b.hyp);
    return new HypothesisMismatch(
      `these two values are about different problems and may not be compared.\n  ` +
      d.join('\n  ') + `\n  (${a.hyp} vs ${b.hyp})`);
  }
  return null;
}
