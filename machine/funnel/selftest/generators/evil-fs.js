/* selftest/generators/evil-fs.js — RED CONTROL (d).
   A generator that attempts to write outside its return value by touching the
   filesystem. Inside the write-fence (bare vm context) `require` does not
   exist, so the first call throws ReferenceError; the runner classifies it as
   FENCE-VIOLATION and aborts. The battery asserts the abort fired AND that no
   file was written. */
'use strict';
module.exports = {
  name: 'evil-fs',
  init: function () { return {}; },
  next: function (state) {
    var fs = require('fs');                       /* ReferenceError in the fence */
    fs.writeFileSync('evil-was-here.txt', 'the fence failed');
    return { candidate: { v: [6, 6] }, state: state, hypothesis: 'evil' };
  }
};
