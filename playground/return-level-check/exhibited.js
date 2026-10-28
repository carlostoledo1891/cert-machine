/* exhibited.js — which decisions of a printed fit rest on an EXHIBITED OBJECT, and so carry the house's one accent, a red ×
   (WARRANT v2; design/tokens.js --witness). One list for both pages that decide a printed fit — the return-level check
   and the return-level atlas — moved here from the check's app.js on 2026-10-28, because a rule written twice diverges.
   printed.js, which makes the decisions, stays byte-identical (certs/design-table-audit.json pins it); this only reads
   the code it returns. Loaded as a plain script (window.HS_EXHIBITED) or required by Node.

   Two kinds of object, and the difference is whose record it lives in:
     the DIGITS'   the printed digits themselves allow a scale or a shape at or below zero: the object is in what was
                   printed, so it breaks the printed fit against any record;
     the RECORD's  observed values outside the printed support, or a fit of the same family more likely on these values
                   (the certified maximum, the lognormal the family approaches, the fit with its location at zero): the
                   object is in the record decided against, so it breaks "this is THIS record's fit" — a witness only
                   when the record is the one the fit was made from. The check decides a fit against the series it was
                   printed for; the atlas decides one against a hindcast cell, where a table made from another record
                   is not expected to be the maximum, and there these stay ink.
   Left out on purpose: NOT THE CERTIFIED FIT. The certified maximum's box lies outside every value the digits allow, and
   that is an enclosure clearing a box, a refutation with no point in it (the grammar's rule: a scalar refutation has no
   witness point). It was red on the check at 957711a5; it is ink now.

   usage: HS_EXHIBITED.mark(code, ownRecord) -> the × as HTML, or '' */
(function (root) {
  'use strict';
  const DIGITS = new Set(['NOT A MEMBER OF THE FAMILY']);
  const RECORD = new Set(['OUTSIDE ITS SUPPORT', 'OFF THE MAXIMUM', 'BELOW ITS LIMIT', 'BELOW A MEMBER OF ITS OWN FAMILY']);
  const exhibited = (code, ownRecord) => DIGITS.has(code) || (!!ownRecord && RECORD.has(code));
  const mark = (code, ownRecord) => (exhibited(code, ownRecord) ? '<span class="wx" aria-label="refuted by an exhibited object">&times;</span> ' : '');
  const API = { DIGITS, RECORD, exhibited, mark };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.HS_EXHIBITED = API;
})(typeof self !== 'undefined' ? self : this);
