/* app.js — the textbook machine in the tab. playground/textbook-machine/ · cert-machine · 2026-11-12
   Runs machines.js (inlined before this file, window.TM). Every element whose content changes has its size reserved in
   page.css, so no control moves the layout (tools/check-textbook-machine.js measures it). */
(function () {
  'use strict';
  var TM = window.TM, SPEC = JSON.parse(document.getElementById('tm-spec').textContent);
  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement, tapeEl = $('tm-tape'), headEl = $('tm-head'), wrapEl = $('tm-tapewrap');
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var cur, m, s, fired = null, timer = 0, playing = false, acc = 0, last = 0;
  var fmt = function (x) { return Number(x).toLocaleString('en-US'); };
  var END_WORD = { HALT: 'stopped', YES: 'answered yes', NO: 'answered no' };

  function load() {
    stop(); s = TM.begin(m, m.input()); fired = null; rules(); paint(0);
  }
  function tick() {
    if (s.end) return 0;
    fired = TM.step(m, s);
    return fired ? fired.move : 0;
  }
  function cellPx() { return parseFloat(getComputedStyle(root).getPropertyValue('--tm-cell')) || 52; }
  function paint(dir, quick) {
    var cell = cellPx(), w = wrapEl.clientWidth, K = Math.ceil(w / cell / 2) + 2, h = '', i, v, c;
    for (i = s.pos - K; i <= s.pos + K; i++) {
      v = s.tape[i]; c = v === undefined ? 'blank' : (v === '1' ? 'one' : '');
      if (s.end === 'NO' && i === s.pos) c += ' bad';
      h += '<div class="tm-c ' + c + '" style="--x:' + ((i - s.pos) * cell - cell / 2) + 'px">' + (v === undefined ? '' : v) + '</div>';
    }
    tapeEl.innerHTML = h;
    if (dir && !quick && !reduce) {
      tapeEl.style.transition = 'none'; tapeEl.style.transform = 'translateX(' + (dir * cell) + 'px)'; void tapeEl.offsetWidth;
      tapeEl.style.transition = 'transform ' + Math.min(220, delay() * 0.8) + 'ms cubic-bezier(.2,.7,.2,1)'; tapeEl.style.transform = 'none';
    } else { tapeEl.style.transition = 'none'; tapeEl.style.transform = 'none'; }
    headEl.className = 'tm-head' + (s.end === 'NO' ? ' bad' : '');
    $('tm-state').textContent = s.end ? END_WORD[s.end] : s.state;
    $('tm-steps').textContent = fmt(s.steps);
    $('tm-say').textContent = fired ? TM.sentence(fired, s.steps)
      : s.end ? TM.sentence(null, s.steps)
      : 'Step 0. The head is on the first cell, in state ' + s.state + '. Press Step to fire the first rule, or Play.';
    $('tm-verdict').innerHTML = s.end === 'YES' ? '<span class="tm-ans yes">Yes</span>'
      : s.end === 'NO' ? '<span class="tm-ans no"><span class="tm-x">&times;</span>No</span>'
      : s.end === 'HALT' ? '<span class="tm-ans yes">Stopped</span>'
      : '<span class="tm-ans run">' + (playing ? 'Running' : 'Ready') + '</span>';
    $('tm-play').textContent = playing ? 'Pause' : 'Play'; $('tm-play').disabled = !!s.end; $('tm-stepb').disabled = !!s.end;
    var f = document.querySelector('.tm-rules td.fire'); if (f) f.classList.remove('fire');
    if (fired) { f = document.querySelector('.tm-rules td[data-k="' + cssq(fired.state + '|' + fired.read) + '"]'); if (f) f.classList.add('fire'); }
  }
  function cssq(x) { return x.replace(/["\\]/g, '\\$&'); }
  function rules() {
    var h = '<tr><th>state</th>' + m.syms.map(function (y) { return '<th>reads ' + (y === '_' ? 'blank' : y) + '</th>'; }).join('') + '</tr>';
    Object.keys(m.rules).forEach(function (st) {
      h += '<tr><td class="st">' + st + '</td>' + m.syms.map(function (y) {
        var r = m.rules[st][y];
        if (!r) return '<td class="none">&middot;</td>';
        var nx = r[2] === 'HALT' ? 'stop' : r[2] === 'YES' ? 'yes' : r[2] === 'NO' ? 'no' : r[2];
        return '<td data-k="' + st + '|' + y + '">' + (r[0] === '_' ? '&#9633;' : r[0]) + ' ' + (r[1] > 0 ? '&rarr;' : r[1] < 0 ? '&larr;' : '&middot;') + ' ' + nx + '</td>';
      }).join('') + '</tr>';
    });
    $('tm-rules').innerHTML = h;
  }
  function delay() { var v = +$('tm-speedr').value; return 700 * Math.pow(0.0016, v / 100); }   /* 700 ms to about 1 ms a step */
  function stop() { playing = false; cancelAnimationFrame(timer); }
  function loop(t) {
    if (!playing) return;
    var d = delay(), n = 0, dir = 0; acc += t - last; last = t;
    while (acc >= d && n < 400) { dir = tick(); acc -= d; n++; if (s.end) break; }
    if (acc > d * 400) acc = 0;
    if (n) paint(dir, n > 1 || d < 60);
    if (s.end) { playing = false; paint(0); } else timer = requestAnimationFrame(loop);
  }
  function play() { if (s.end) return; playing = true; acc = 0; last = performance.now(); paint(0); timer = requestAnimationFrame(loop); }
  $('tm-play').addEventListener('click', function () { if (playing) { stop(); paint(0); } else play(); });
  $('tm-stepb').addEventListener('click', function () { stop(); paint(tick()); });
  $('tm-reset').addEventListener('click', load);

  function inputs() {
    var box = $('tm-inp'); box.innerHTML = ''; $('tm-hint').textContent = m.hint;
    if (cur === 'palindrome' || cur === 'check') {
      var pal = cur === 'palindrome';
      $('tm-inlab').textContent = pal ? 'your word' : 'your setting';
      var i = document.createElement('input'); i.type = 'text'; i.value = m.text; i.maxLength = pal ? 16 : 12; i.id = 'tm-word';
      i.setAttribute('aria-label', pal ? 'A word made of a and b' : 'A setting made of 0 and 1'); i.autocapitalize = 'off'; i.spellcheck = false;
      i.addEventListener('input', function () { i.value = i.value.toLowerCase().replace(pal ? /[^ab]/g : /[^01]/g, ''); m.text = i.value; load(); });
      box.appendChild(i);
    } else if (cur === 'find') {
      $('tm-inlab').textContent = 'switches';
      box.innerHTML = '<span class="tm-stepper"><button type="button" aria-label="One switch fewer">&minus;</button><b id="tm-n">' + m.n + '</b><button type="button" aria-label="One switch more">+</button></span>';
      var bs = box.querySelectorAll('button');
      bs[0].addEventListener('click', function () { setN(m.n - 1); }); bs[1].addEventListener('click', function () { setN(m.n + 1); });
    } else { $('tm-inlab').textContent = 'input'; box.innerHTML = '<span class="tm-fixed">' + (cur === 'beaver' ? 'a blank tape' : 'starts at 0') + '</span>'; }
  }
  function setN(n) { TM.M.find.n = Math.max(1, Math.min(TM.NMAX, n)); if (cur === 'find') { inputs(); load(); } }
  function pick(k, nohash) {
    cur = TM.M[k] ? k : 'count'; m = TM.M[cur];
    document.querySelectorAll('.tm-step').forEach(function (t) { var on = t.getAttribute('data-k') === cur; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    $('tm-what').textContent = m.what; inputs(); load();
    if (!nohash) { try { history.replaceState(null, '', '#' + cur); } catch (e) { /* a file:// page may refuse */ } }
  }
  var steps = [].slice.call(document.querySelectorAll('.tm-step'));
  steps.forEach(function (b, i) {
    b.addEventListener('click', function () { pick(b.getAttribute('data-k')); });
    b.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!d) return; e.preventDefault(); var nb = steps[(i + d + steps.length) % steps.length]; nb.focus(); nb.click();
    });
  });

  /* the chart: the readout follows the pointer and the keys; the tab counts all twenty again */
  var cols = [].slice.call(document.querySelectorAll('.tm-col')), S = SPEC.series, sel = S.n.length - 1;
  function show(i, keep) {
    cols.forEach(function (c, k) { c.classList.toggle('on', k === i); if (keep) c.tabIndex = k === i ? 0 : -1; });
    $('tm-ro').textContent = S.n[i] + (S.n[i] === 1 ? ' switch' : ' switches') + ': checking ' + fmt(S.check[i]) + ' steps, finding ' + fmt(S.find[i])
      + (i ? ', which is ' + (S.find[i] / S.find[i - 1]).toFixed(2) + ' times the count for ' + S.n[i - 1] + '.' : '.');
  }
  cols.forEach(function (c, i) {
    c.addEventListener('mouseenter', function () { show(i); });
    c.addEventListener('mouseleave', function () { show(sel); });
    c.addEventListener('focus', function () { sel = i; show(i, true); });
    c.addEventListener('click', function () { sel = i; show(i, true); });
    c.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
      e.preventDefault(); cols[Math.max(0, Math.min(cols.length - 1, i + d))].focus();
    });
  });
  show(sel, true);
  setTimeout(function () {
    var got = TM.series(), same = ['check', 'find'].every(function (k) { return got[k].every(function (v, i) { return v === S[k][i]; }); });
    $('tm-rerun').textContent = same ? 'Your tab ran all twenty again just now and counted the same steps.' : 'Your tab ran all twenty again and counted different steps: this page is not what its record says.';
  }, 50);

  /* the busy beaver champions, run in the tab in slices so the page stays live (the five-state one is 47 million steps) */
  document.querySelectorAll('[data-bb]').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = +b.getAttribute('data-bb'), c = TM.CHAMPIONS.filter(function (x) { return x.states === k; })[0], want = SPEC.champions.filter(function (x) { return x.states === k; })[0];
      var out = $('tm-bb' + k), job = TM.run(TM.parseStd(c.std), '', 1e9), t0 = performance.now();
      b.disabled = true; out.textContent = 'running';
      (function slice() {
        job.go(4000000);
        if (!job.end) { out.textContent = 'running, ' + fmt(job.steps) + ' steps'; setTimeout(slice, 0); return; }
        var ok = job.end === 'HALT' && job.steps === want.steps && job.ones === want.ones;
        out.textContent = (ok ? 'stopped after ' + fmt(job.steps) + ' steps, ' + fmt(job.ones) + ' ones' : 'did not match: ' + fmt(job.steps) + ' steps')
          + ' (' + Math.max(1, Math.round(performance.now() - t0)) + ' ms)';
        b.disabled = false;
      })();
    });
  });

  /* the claims */
  var VK = { CERTIFIED: 'held', REFUTED: 'dep', REFUSED: 'open' }, WORD = { CERTIFIED: 'Certified', REFUTED: 'Refuted', REFUSED: 'Refused' };
  TM.CLAIMS.forEach(function (cl) {
    var out = $('tm-c-' + cl.id), btn = document.querySelector('[data-decide="' + cl.id + '"]');
    btn.addEventListener('click', function () {
      var r = TM.decide(cl);
      var tail = r.verdict === 'REFUSED' ? 'no end in ' + fmt(r.steps) + ' steps' : (r.end === 'HALT' ? 'stopped' : r.end === 'YES' ? 'yes' : 'no') + ' after ' + fmt(r.steps) + ' steps';
      out.innerHTML = '<span class="tag ' + VK[r.verdict] + '">' + WORD[r.verdict] + '</span> <span class="tm-ctail">' + tail + '</span>';
    });
    document.querySelector('[data-watch="' + cl.id + '"]').addEventListener('click', function () {
      if (cl.machine === 'palindrome' || cl.machine === 'check') TM.M[cl.machine].text = cl.input;
      if (cl.machine === 'find') TM.M.find.n = cl.input.length;
      pick(cl.machine);
      $('machine').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  });

  window.addEventListener('resize', function () { paint(0); });
  window.addEventListener('hashchange', function () { pick(location.hash.slice(1), true); });
  pick(location.hash.slice(1) || 'count', true);
  if (!reduce) setTimeout(function () { if (!s.steps && !playing) play(); }, 900);
  window.__tm = { TM: TM, spec: SPEC };
})();
