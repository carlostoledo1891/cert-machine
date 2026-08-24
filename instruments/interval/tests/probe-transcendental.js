/* probe-transcendental.js — GRADUATED.

   The measurement that corrected PLAN.md §5.3 (JS can soundly enclose exp
   without Rust) now lives in:
     core/interval/transcendental.js
     core/interval/tests/test-transcendental.js  (in make check-eqcert)

   This file stays as a redirect so old run commands still exit meaningfully.
   Run: node core/interval/tests/probe-transcendental.js
*/
'use strict';
console.log('probe-transcendental: graduated → test-transcendental.js');
require('./test-transcendental.js');
