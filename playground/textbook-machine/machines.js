/* machines.js — the textbook machine: one tape, one head, a table of rules. THE ONE MODULE.
   playground/textbook-machine/ · cert-machine · 2026-11-12

   The builder requires it, the battery requires it, and the page inlines this same file, so the step counts printed on
   the page, the ones the battery re-derives and the ones the reader's tab runs come from one definition (a rule written
   twice diverges). Nothing in here is a float.

   A machine: { start, syms, rules: { state: { symbol: [write, move, next] } } }. move is 1 (right), -1 (left) or 0
   (stay); next is a state, or one of the three ends: HALT (it stops), YES, NO (it answers). The blank is '_'. A step is
   one rule firing, the last one included, the convention of Radó's busy beaver and of the bbchallenge project.

   The busy beaver champions are kept in the bbchallenge's standard text format ("1RB1LB_1LA0LC_1RZ1LD_1RD0RA": per
   state, what it does on 0 and on 1; Z is the halt) and parsed here, so each is the string its source prints. */
(function (root) {
  'use strict';
  var ENDS = { HALT: 1, YES: 1, NO: 1 };

  /* the ladder, in the order the ideas build on each other */
  var M = {
    count: {
      name: 'Count in binary', idea: 'Follow the rules',
      what: 'Counts forever in binary: 1, 10, 11, 100, and on.',
      syms: ['0', '1', '_'], start: 'right', input: function () { return '0'; },
      rules: {
        right: { '0': ['0', 1, 'right'], '1': ['1', 1, 'right'], '_': ['_', -1, 'carry'] },
        carry: { '0': ['1', 1, 'right'], '1': ['0', -1, 'carry'], '_': ['1', 1, 'right'] }
      },
      hint: 'Two states and six rules. Nothing in the table says stop, so it never does: pause it when you like.'
    },
    palindrome: {
      name: 'Spot a palindrome', idea: 'Answer yes or no',
      what: 'Does the word read the same both ways?',
      syms: ['a', 'b', '_'], start: 'start', text: 'abba', input: function () { return this.text; },
      rules: {
        start: { a: ['_', 1, 'carry a'], b: ['_', 1, 'carry b'], _: ['_', 1, 'YES'] },
        'carry a': { a: ['a', 1, 'carry a'], b: ['b', 1, 'carry a'], _: ['_', -1, 'match a'] },
        'carry b': { a: ['a', 1, 'carry b'], b: ['b', 1, 'carry b'], _: ['_', -1, 'match b'] },
        'match a': { a: ['_', -1, 'rewind'], b: ['b', 0, 'NO'], _: ['_', 1, 'YES'] },
        'match b': { b: ['_', -1, 'rewind'], a: ['a', 0, 'NO'], _: ['_', 1, 'YES'] },
        rewind: { a: ['a', -1, 'rewind'], b: ['b', -1, 'rewind'], _: ['_', 1, 'start'] }
      },
      hint: 'It rubs out the first letter, carries it to the far end and compares. Type any mix of a and b; try abab.'
    },
    check: {
      name: 'The lock checker', idea: 'Check a setting',
      what: 'The lock opens only when every switch is on. Does this setting open it?',
      syms: ['0', '1', '_'], start: 'check', text: '1111', input: function () { return this.text; },
      rules: { check: { '0': ['0', 0, 'NO'], '1': ['1', 1, 'check'], '_': ['_', 0, 'YES'] } },
      hint: 'One pass along the switches: a setting of n switches takes at most n + 1 steps. Type 0s and 1s.'
    },
    find: {
      name: 'The lock finder', idea: 'Find a setting',
      what: 'Try every setting in order, checking each, until one opens the lock.',
      syms: ['0', '1', '_'], start: 'check', n: 4, input: function () { return new Array(this.n + 1).join('0'); },
      rules: {
        check: { '0': ['0', 1, 'to end'], '1': ['1', 1, 'check'], '_': ['_', 0, 'YES'] },
        'to end': { '0': ['0', 1, 'to end'], '1': ['1', 1, 'to end'], '_': ['_', -1, 'next'] },
        next: { '0': ['1', -1, 'back'], '1': ['0', -1, 'next'], '_': ['_', 1, 'NO'] },
        back: { '0': ['0', -1, 'back'], '1': ['1', -1, 'back'], '_': ['_', 1, 'check'] }
      },
      hint: 'Its first row is the checker, with one change: a failed check walks on to the next setting instead of answering no.'
    },
    beaver: {
      name: 'Busy beaver', idea: 'Will it stop?',
      what: 'Four states, a blank tape. Does it ever stop?',
      std: '1RB1LB_1LA0LC_1RZ1LD_1RD0RA', input: function () { return ''; },
      hint: 'Of all the four-state machines of this kind that stop, none runs longer than this one.'
    }
  };
  var ORDER = ['count', 'palindrome', 'check', 'find', 'beaver'];

  /* the standard text format: per state (A, B, ...), what it does on 0 and on 1; '---' is no rule; Z (or H) halts */
  function parseStd(s) {
    var groups = s.split('_'), names = groups.map(function (g, i) { return String.fromCharCode(65 + i); }), rules = {};
    groups.forEach(function (g, i) {
      if (g.length !== 6) throw new Error('machines.js: not a two-symbol state: ' + g);
      var r = {};
      [0, 1].forEach(function (sym) {
        var t = g.substr(3 * sym, 3);
        if (t === '---') return;
        var nx = t[2] === 'Z' || t[2] === 'H' ? 'HALT' : t[2];
        if (nx !== 'HALT' && names.indexOf(nx) < 0) throw new Error('machines.js: no state ' + nx + ' in ' + s);
        r[sym ? '1' : '_'] = [t[0] === '1' ? '1' : '_', t[1] === 'R' ? 1 : t[1] === 'L' ? -1 : 0, nx];
      });
      rules[names[i]] = r;
    });
    return { start: 'A', syms: ['_', '1'], rules: rules };
  }
  ORDER.forEach(function (k) { var m = M[k]; if (m.std) { var p = parseStd(m.std); m.start = p.start; m.syms = p.syms; m.rules = p.rules; } });

  /* the champions the busy beaver table runs, each the string its source prints */
  var CHAMPIONS = [
    { states: 2, std: '1RB1LB_1LA1RZ' },
    { states: 3, std: '1RB1RZ_1LB0RC_1LC1LA' },
    { states: 4, std: '1RB1LB_1LA0LC_1RZ1LD_1RD0RA' },
    { states: 5, std: '1RB1LC_1RC1RB_1RD0LE_1LA1LD_1RZ0LA' }
  ];

  /* one step on a sparse tape (the page's machine): returns the fired rule, or null when no rule applies */
  function step(m, s) {
    var sym = s.tape[s.pos] === undefined ? '_' : s.tape[s.pos], r = m.rules[s.state] && m.rules[s.state][sym];
    if (!r) { s.end = 'HALT'; return null; }
    var fired = { state: s.state, read: sym, write: r[0], move: r[1], next: r[2], at: s.pos };
    if (r[0] === '_') delete s.tape[s.pos]; else s.tape[s.pos] = r[0];
    s.pos += r[1]; s.steps++;
    if (ENDS[r[2]]) s.end = r[2]; else s.state = r[2];
    return fired;
  }
  function begin(m, input) {
    var t = {}, i;
    for (i = 0; i < input.length; i++) if (input[i] !== '_') t[i] = input[i];
    return { tape: t, pos: 0, state: m.start, steps: 0, end: '' };
  }

  /* the fast run, for long ones (the five-state champion's 47 million steps): states and symbols as small integers, the
     tape a byte array that grows in both directions. It can be resumed: run(m, input, cap) returns a job; job.go(n)
     takes up to n more steps and returns the job. job.end is '' while it has neither stopped nor answered. */
  function compile(m) {
    var names = Object.keys(m.rules), syms = m.syms.slice(), S = names.length, Y = syms.length;
    var W = new Int16Array(S * Y), D = new Int8Array(S * Y), N = new Int16Array(S * Y), i, j;
    for (i = 0; i < S; i++) for (j = 0; j < Y; j++) {
      var r = m.rules[names[i]][syms[j]], k = i * Y + j;
      if (!r) { N[k] = -1; continue; }
      W[k] = syms.indexOf(r[0]); D[k] = r[1];
      N[k] = r[2] === 'HALT' ? -4 : r[2] === 'YES' ? -2 : r[2] === 'NO' ? -3 : names.indexOf(r[2]);
      if (W[k] < 0) throw new Error('machines.js: writes a symbol it does not list: ' + r[0]);
      if (N[k] === -1) throw new Error('machines.js: no state ' + r[2]);
    }
    return { names: names, syms: syms, S: S, Y: Y, W: W, D: D, N: N, blank: syms.indexOf('_') };
  }
  function run(m, input, cap) {
    var c = compile(m), size = 1024, tape = new Uint8Array(size), off = size >> 1, pos = 0, st = c.names.indexOf(m.start), i;
    tape.fill(c.blank);
    for (i = 0; i < input.length; i++) tape[off + i] = c.syms.indexOf(input[i]);
    var job = { steps: 0, end: '', cap: cap, ones: 0, cells: 0 };
    job.go = function (n) {
      var lim = Math.min(job.cap, job.steps + (n || Infinity)), steps = job.steps, Y = c.Y, W = c.W, D = c.D, N = c.N;
      while (!job.end && steps < lim) {
        var p = off + pos;
        if (p < 0 || p >= size) {                                      /* grow both ways, keep the head's cell */
          var nt = new Uint8Array(size * 2); nt.fill(c.blank); nt.set(tape, size >> 1); off += size >> 1; size *= 2; tape = nt; p = off + pos;
        }
        var k = st * Y + tape[p], nx = N[k];
        if (nx === -1) { job.end = 'HALT'; break; }                    /* no rule: it stops without a step */
        tape[p] = W[k]; pos += D[k]; steps++;
        if (nx < 0) { job.end = nx === -4 ? 'HALT' : nx === -2 ? 'YES' : 'NO'; break; }
        st = nx;
      }
      job.steps = steps;
      {                                                                /* what it has left so far: the 1s, the cells it wrote */
        var one = c.syms.indexOf('1'), ones = 0, lo = -1, hi = -1;
        for (i = 0; i < size; i++) if (tape[i] !== c.blank) { if (lo < 0) lo = i; hi = i; if (tape[i] === one) ones++; }
        job.ones = ones; job.cells = lo < 0 ? 0 : hi - lo + 1;
      }
      return job;
    };
    return job;
  }
  /* the whole run at once, for the short ones */
  function runAll(m, input, cap) { return run(m, input, cap).go(); }

  /* a step said as a sentence */
  var SAY = { '_': 'blank' };
  function word(s) { return SAY[s] || s; }
  function sentence(f, steps) {
    if (!f) return 'No rule for this state and symbol, so it stops.';
    var mv = f.move > 0 ? 'move right' : f.move < 0 ? 'move left' : 'stay put';
    var wr = f.write === f.read ? 'leave the ' + word(f.read) : 'write ' + word(f.write);
    var nx = f.next === 'HALT' ? 'and stop' : f.next === 'YES' ? 'and answer yes' : f.next === 'NO' ? 'and answer no'
      : f.next === f.state ? 'stay in ' + f.state : 'go to ' + f.next;
    return 'Step ' + steps.toLocaleString('en-US') + '. In state ' + f.state + ', reading ' + word(f.read) + ': ' + wr + ', ' + mv + ', ' + nx + '.';
  }

  /* the claims the machine itself decides: each names a machine, its input and the answer that would make it true.
     CERTIFIED when the run ends with that answer, REFUTED when it ends with the other, REFUSED when the budget runs out
     first: a run that has not stopped yet says nothing about whether it ever will. */
  var CLAIMS = [
    { id: 'abba', text: 'abba reads the same both ways.', machine: 'palindrome', input: 'abba', holds: 'YES' },
    { id: 'abab', text: 'abab reads the same both ways.', machine: 'palindrome', input: 'abab', holds: 'YES' },
    { id: 'lock10', text: 'Some setting of 10 switches opens the lock.', machine: 'find', input: '0000000000', holds: 'YES' },
    { id: 'beaver', text: 'The four-state champion stops on a blank tape.', machine: 'beaver', input: '', holds: 'HALT' },
    { id: 'count', text: 'Counting in binary stops.', machine: 'count', input: '0', holds: 'HALT' }
  ];
  var BUDGET = 1000000;
  function decide(cl, cap) {
    var j = runAll(M[cl.machine], cl.input, cap || BUDGET);
    return { verdict: !j.end ? 'REFUSED' : j.end === cl.holds ? 'CERTIFIED' : 'REFUTED', steps: j.steps, end: j.end };
  }

  /* the two series: checking the setting that opens the lock, and finding it, for 1 to 10 switches */
  var NMAX = 10;
  function series() {
    var out = { n: [], check: [], find: [] }, n;
    for (n = 1; n <= NMAX; n++) {
      out.n.push(n);
      out.check.push(runAll(M.check, new Array(n + 1).join('1'), 1e9).steps);
      out.find.push(runAll(M.find, new Array(n + 1).join('0'), 1e9).steps);
    }
    return out;
  }

  var TM = { M: M, ORDER: ORDER, ENDS: ENDS, CHAMPIONS: CHAMPIONS, CLAIMS: CLAIMS, BUDGET: BUDGET, NMAX: NMAX,
    parseStd: parseStd, begin: begin, step: step, run: run, runAll: runAll, sentence: sentence, decide: decide, series: series };
  if (typeof module !== 'undefined' && module.exports) module.exports = TM; else root.TM = TM;
})(this);
