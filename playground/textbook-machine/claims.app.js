/* claims.app.js — the claims page in the tab. playground/textbook-machine/ · cert-machine · 2026-11-12
   Runs after the page's bundle (window.ClaimChecker: instruments/claimbox/check.js, wrapped) and after
   claim-verdict.js (window.ClaimVerdict: the one rule), both loaded before this file. Nothing here decides anything:
   it hands a claim's text to the checker, hands what came back to the rule, and prints the word.
   Every element whose content changes has its size reserved in claims.css, and the layer one click down is a native
   <dialog>, which is out of the page's flow: no control moves the layout (tools/check-textbook-claims.js measures it).
   A claim that cannot be decided here (no checker in this browser, the checker gave no line, a change that does not
   apply) says so in plain words and wears no verdict. */
(function () {
  'use strict';
  var SPEC = JSON.parse(document.getElementById('tc-spec').textContent), W = SPEC.words;
  var $ = function (id) { return document.getElementById(id); };
  var CHIP = {}; CHIP[W.CERTIFIED] = 'held'; CHIP[W.REFUTED] = 'dep'; CHIP[W.REFUSED] = 'open';
  var NO_CHECKER = 'This browser could not run the checker (it needs exact big-number arithmetic and current regular expressions), so nothing is decided here.';
  var NO_CHANGE = 'This change does not apply to the claim as the page carries it, so nothing is decided.';
  var state = {};
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var fmt = function (x) { return Number(x).toLocaleString('en-US'); };
  var chip = function (w) { return '<span class="tag ' + CHIP[w] + '">' + esc(w) + '</span>'; };
  var checker = function () { return window.ClaimChecker; };

  /* a claim's text with one declared change applied: each edit must match exactly once, or there is no text */
  function textOf(c, vi) {
    var t = checker().text(c.path), e = c.variants[vi].edits, i;
    for (i = 0; i < e.length; i++) { if (t.split(e[i][0]).length !== 2) return null; t = t.split(e[i][0]).join(e[i][1]); }
    return t;
  }
  function decide(c, vi) {
    var st = { v: vi, text: null, got: null, res: null, fail: '' };
    try {
      if (!checker() || !window.ClaimVerdict) { st.fail = NO_CHECKER; return st; }
      st.text = textOf(c, vi);
      if (st.text === null) { st.fail = NO_CHANGE; return st; }
      st.got = checker().decide(st.text, c.file);
      st.res = window.ClaimVerdict.claimVerdict(st.got, W);
      if (st.res.why === 'silent') st.fail = st.res.reason;
    } catch (e) { st.fail = 'The checker stopped on this claim, so nothing is decided.'; st.error = String(e && e.message || e); }
    return st;
  }
  function paint(c) {
    var st = state[c.id], li = document.querySelector('[data-claim="' + c.id + '"]');
    $('tc-say-' + c.id).innerHTML = c.variants[st.v].say;
    [].forEach.call(li.querySelectorAll('[data-v]'), function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-v') === st.v)); });
    li.querySelector('[data-reset]').disabled = st.v === 0;
    if (st.fail) {
      li.setAttribute('data-verdict', '');
      $('tc-word-' + c.id).innerHTML = '<span class="tc-none">Not decided</span>';
      $('tc-why-' + c.id).textContent = st.fail;
    } else {
      li.setAttribute('data-verdict', st.res.verdict);
      $('tc-word-' + c.id).innerHTML = chip(st.res.verdict);
      $('tc-why-' + c.id).textContent = st.res.reason;
    }
  }
  function set(c, vi) { state[c.id] = decide(c, vi); paint(c); }

  /* ---- one click down: the checker's own line, the word of each part, the claim object as decided, the files ---- */
  var dlg = $('tc-dlg'), opener = null;
  function row(k, v) { return '<div class="tc-row"><span class="eyebrow">' + k + '</span><div>' + v + '</div></div>'; }
  function trust(c) {
    var st = state[c.id], r = st.res, h = '', i, p, M, files, obj;
    h += '<p class="tc-dlg-say">' + c.variants[st.v].say + '</p>';
    if (st.fail) h += row('the word', '<span class="tc-none">Not decided</span> ' + esc(st.fail) + (st.error ? ' <code>' + esc(st.error) + '</code>' : ''));
    else {
      h += row('the word', chip(r.verdict) + ' ' + esc(r.reason));
      if (!r.admitted) h += row('the checker says', '<code>' + esc(r.kind || '') + '</code> ' + esc(r.msg || ''));
      else {
        var parts = '';
        for (i = 0; i < r.parts.length; i++) {
          p = r.parts[i];
          parts += '<li>' + (p.word === null ? '<span class="tc-none">Not decided</span> here: this part names a computation a browser does not run, and no record is attached'
            : chip(p.word) + (p.by === 'record' ? ' decided against the record' : ' computed from the claim’s own data')
              + (p.witness ? ', which fails at ' + esc(JSON.stringify(p.witness.at)) + (p.violations ? ' (' + fmt(p.violations) + ' failing in all)' : '') : '')
              + (p.value ? '<span class="tc-val">value ' + esc(p.value.length > 64 ? p.value.slice(0, 64) + '…' : p.value) + '</span>' : '')) + '</li>';
        }
        h += row(r.parts.length === 1 ? 'its one part' : 'its ' + r.parts.length + ' parts', '<ol class="tc-parts">' + parts + '</ol>');
        if (r.repair !== null) h += row('the record’s repair', chip(r.repair) + ' The record also holds a repaired form of this claim, decided again here. It stays beside the verdict and is no part of it.');
        if (st.got.result.notes && st.got.result.notes.length) h += row('the checker notes', '<ul class="tc-notes">' + st.got.result.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>');
      }
    }
    if (st.got) h += row('the checker’s own line', '<pre class="tc-pre">' + esc(st.got.line !== null ? st.got.line : (st.got.stderr || st.got.error || 'no line')) + '</pre>');
    if (st.text !== null) h += row('the claim, as decided', '<pre class="tc-pre tc-obj">' + esc(st.text) + '</pre>');
    if (checker()) {
      M = checker().manifest; obj = M.objects.filter(function (o) { return o.path === c.path; })[0];
      files = (obj ? obj.needs : []).map(function (f) { return '<li><code>' + esc(f) + '</code><span class="tc-val">sha256 ' + esc(M.files[f][1].slice(0, 16)) + '… · ' + fmt(M.files[f][2]) + ' bytes</span></li>'; }).join('');
      h += row('the files it read', '<ul class="tc-files">' + files + '</ul>');
      h += row('what ran', 'The claim checker <code>' + esc(M.checker.path) + '</code>, byte for byte, <span class="tc-val">sha256 ' + esc(M.checker.sha256.slice(0, 16)) + '…</span> Every file above is inside this page and was hashed in your tab before it was read.');
    }
    $('tc-dlg-body').innerHTML = h;
  }
  function open(c, from) {
    trust(c); opener = from;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    $('tc-dlg-body').scrollTop = 0;
  }
  function close() { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
  dlg.addEventListener('close', function () { if (opener && opener.focus) opener.focus(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
  dlg.querySelector('[data-close]').addEventListener('click', close);

  SPEC.claims.forEach(function (c) {
    var li = document.querySelector('[data-claim="' + c.id + '"]');
    [].forEach.call(li.querySelectorAll('[data-v]'), function (b) { b.addEventListener('click', function () { set(c, +b.getAttribute('data-v')); }); });
    li.querySelector('[data-reset]').addEventListener('click', function () { set(c, 0); });
    li.querySelector('[data-trust]').addEventListener('click', function (e) { open(c, e.currentTarget); });
    set(c, 0);
  });

  /* the page's own files, hashed in the tab */
  (function () {
    var s = $('tc-status'), v = null;
    if (!checker()) { s.textContent = NO_CHECKER; return; }
    try { v = checker().verify(); } catch (e) { v = null; }
    s.textContent = v && v.ok ? 'Your tab hashed the ' + v.files + ' files this page carries and each one matches its pin. The words below were decided here, just now.'
      : 'A file this page carries does not match its pin in your tab: do not trust the words below.';
  })();

  window.__tc = { spec: SPEC, state: state, set: function (id, vi) { var c = SPEC.claims.filter(function (x) { return x.id === id; })[0]; set(c, vi); return state[id]; } };
})();
