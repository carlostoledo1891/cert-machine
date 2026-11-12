/* claim-verdict.js — ONE verdict per claim: the strictest word wins.
   playground/textbook-machine/ · cert-machine · 2026-11-12

   THE ONE MODULE that turns what the claim checker returned into the one word a claim wears. The page's builder
   (claims.build.js), the battery (claims.battery.js) and the tab (claims.app.js) all run THIS text: the builder inlines
   the file byte for byte, so the rule is written once. It runs in Node (module.exports) and in a page with nothing
   but its own text (one global, ClaimVerdict).

   THE RULE (the operator, 2026-11-12):
     REFUSED    the checker refuses the claim (or gives no line at all)
     REFUTED    any part of the claim, or the claim's record, is REFUTED
     CERTIFIED  only when everything that was decided is CERTIFIED
   and two cases the rule's words leave open, both settled here on the careful side and both named in what is returned,
   so a reader of the code or of the page can see which one fired:
     nothing decided   a claim the checker admits with no word on any part              -> REFUSED, "nothing was decided"
     a part undecided  some parts decided and certified, another left without a word    -> REFUSED, never CERTIFIED:
                       a conjunction with an undecided part is not established
   A part that carries the word REFUSED refuses the claim unless another part refutes it: the composition of
   instruments/verdict.js (REFUTED if any, else REFUSED if any, else CERTIFIED), which the battery holds this module to.

   WHAT IT READS. `got` is what ClaimChecker.decide returns (checker-web.build.js), or the same fields from Node:
     got.line     the checker's own line, or null when it printed none
     got.exit     its exit code: 0 exactly when the claim was admitted
     got.kind     its refusal kind
     got.result   what check() returned: decided (one word per part when a record is attached, then "repair:<word>"
                  when the object carries the record's repair), fromObject (one entry per part: null, or the word the
                  object's own exact arithmetic gives, with its value and witness), msg, notes
   THE THREE WORDS are never typed here: the caller hands them in, { CERTIFIED, REFUTED, REFUSED }, read from
   instruments/verdict.js (Node requires it; the builder prints what it read there into the page).

   WHAT IT RETURNS: { verdict, reason, why, admitted, kind, msg, parts: [{ index, word, by, value, witness, violations }],
   repair }. `why` is one of WHY's keys, `reason` its plain sentence; `by` is 'record', 'object' or null; `repair` is the
   word the record's repair was re-decided to, kept beside the verdict and never part of it.
   MIT */
(function (root, factory) {
  if (typeof module === 'object' && module && module.exports) module.exports = factory();
  else root.ClaimVerdict = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var REPAIR = 'repair:';

  /* why the word is what it is, in plain words: the page prints these */
  var WHY = {
    'silent': 'The checker gave no answer, so nothing is decided.',
    'checker-refused': 'The checker refused the claim before deciding it.',
    'unreadable': 'The checker answered in a shape this page does not read, so nothing is decided.',
    'nothing-decided': 'The claim is well formed, but nothing was decided.',
    'part-undecided': 'A part of the claim was not decided.',
    'part-refused': 'A part of the claim was refused.',
    'refuted': 'A part of the claim is false.',
    'certified': 'Every part of the claim was decided, and every part holds.'
  };

  /* the checker's refusal kinds that a visitor of the page can reach, in plain words; any other kind keeps WHY's line */
  var KIND = {
    'json-number': 'A number in the claim is written without quotes. A program would read it as a rounded double, so the checker refuses to read it at all.',
    'printed-not-in-quote': 'The claim states a number that its own source does not print.',
    'printed-mismatch': 'The number the claim decides is not the number it says the source prints.',
    'canonical': 'The claim states a number that its own source does not print as a whole number.',
    'record-bar-mismatch': 'The record decided a different number than the one this claim states.',
    'record-decision-mismatch': 'Deciding the claim again gives a different word than the record holds, so the record does not speak for it.',
    'record-verdict-word': 'The claim declares a word its record does not give.',
    'record-missing': 'The claim names a record this page does not carry.',
    'record-row-missing': 'The claim names a row its record does not hold.',
    'pin-mismatch': 'A file the claim cites is not the file it pinned.',
    'pin-unresolved': 'The claim cites a file this page does not carry.',
    'quote-not-verbatim': 'The claim quotes words its source does not contain.',
    'data': 'The claim describes its data differently from what the pinned file holds.',
    'schema': 'The claim is not written in the form the checker reads.'
  };

  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function three(W) {
    if (!W || typeof W !== 'object') throw new Error('claim-verdict: pass the three words, read from instruments/verdict.js');
    var w = [W.CERTIFIED, W.REFUTED, W.REFUSED], i;
    for (i = 0; i < 3; i++) if (typeof w[i] !== 'string' || !w[i] || w.indexOf(w[i]) !== i) throw new Error('claim-verdict: the three words must be three different strings');
    return w;
  }

  function claimVerdict(got, W) {
    var words = three(W);
    var out = { verdict: W.REFUSED, why: 'silent', reason: WHY.silent, admitted: false, kind: null, msg: '', parts: [], repair: null };
    var settle = function (verdict, why, reason) { out.verdict = verdict; out.why = why; out.reason = reason || WHY[why]; return out; };
    if (!got || typeof got !== 'object' || typeof got.line !== 'string' || !got.result || typeof got.result !== 'object') return out;
    var r = got.result;
    if (got.exit !== 0 || r.word === W.REFUSED) {
      out.kind = typeof got.kind === 'string' ? got.kind : typeof r.kind === 'string' ? r.kind : null;
      out.msg = typeof r.msg === 'string' ? r.msg : '';
      return settle(W.REFUSED, 'checker-refused', out.kind !== null && has(KIND, out.kind) ? KIND[out.kind] : WHY['checker-refused']);
    }
    out.admitted = true;
    if (!Array.isArray(r.decided) || !Array.isArray(r.fromObject)) return settle(W.REFUSED, 'unreadable');

    /* the record's words, one per part, and the repair's word beside them */
    var rec = [], i, d;
    for (i = 0; i < r.decided.length; i++) {
      d = r.decided[i];
      if (typeof d !== 'string') return settle(W.REFUSED, 'unreadable');
      if (d.indexOf(REPAIR) === 0) out.repair = d.slice(REPAIR.length); else rec.push(d);
    }
    if (out.repair !== null && words.indexOf(out.repair) < 0) return settle(W.REFUSED, 'unreadable');
    if (rec.length && rec.length !== r.fromObject.length) return settle(W.REFUSED, 'unreadable');

    var n = r.fromObject.length, any = false, undecided = false, refused = false, refuted = false, fo, word;
    for (i = 0; i < n; i++) {
      fo = r.fromObject[i];
      word = rec.length ? rec[i] : (fo && typeof fo === 'object' ? fo.word : null);
      if (word !== null && words.indexOf(word) < 0) return settle(W.REFUSED, 'unreadable');
      out.parts.push({ index: i, word: word, by: word === null ? null : rec.length ? 'record' : 'object',
        value: fo && typeof fo.value === 'string' ? fo.value : null,
        witness: fo && fo.witness ? fo.witness : null, violations: fo && fo.violations !== undefined ? fo.violations : null });
      if (word === null) undecided = true; else any = true;
      if (word === W.REFUTED) refuted = true;
      if (word === W.REFUSED) refused = true;
    }
    if (refuted) return settle(W.REFUTED, 'refuted');
    if (!any) return settle(W.REFUSED, 'nothing-decided');
    if (undecided) return settle(W.REFUSED, 'part-undecided');
    if (refused) return settle(W.REFUSED, 'part-refused');
    return settle(W.CERTIFIED, 'certified');
  }

  return { claimVerdict: claimVerdict, WHY: WHY, KIND: KIND, REPAIR: REPAIR };
});
