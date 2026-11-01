/* app.js — the black-hole viewer, in the reader's tab. playground/black-hole/ · cert-machine · 2026-10-31 (Phase 2)

   WHAT RUNS HERE, by standing (notes/black-hole-phase0-preregistration-2026-10-31.md, § Phase 2):
     COMPUTED  the image: the Phase 1 lensing maps (corpus/bh-maps/, the pinned bytes, sha256 checked here before a
               pixel is drawn), shaded per pixel per frame as I = Σ_n g_n³ J(r_n), J = r⁻² · P on [r_isco, 20 M],
               in float32 on the GPU (raw WebGL2, no library) or in double precision on a canvas 2D fallback;
     ASSUMED   the disk and its brightness pattern P: value noise in (φ, ln r) that turns with the matter at the
               prograde Keplerian rate Ω = 1/(r^{3/2} + a) per t_g, its features born and faded on a global schedule
               (two staggered epochs of 40 t_g, crossfaded at constant variance) so the shear never winds it to stripes;
     DECIDED   the shadow edge is the SVG stroke over the canvas, drawn from the scene record; nothing here moves it.
   The clock: t in t_g, 4 t_g per second on the screen (chosen), printed in days from the mass row's t_g enclosure.
   Nothing is reset: the picture never repeats, and the page never claims it loops. */
(function () {
  'use strict';
  var SPEC = JSON.parse(document.getElementById('bh-spec').textContent);
  var $ = function (id) { return document.getElementById(id); };
  var canvas = $('bh-gl'), stage = $('bh-stage');
  var N = SPEC.grid, TEP = SPEC.epochTg, RATE = SPEC.tgPerSecond;
  var S = { key: SPEC.defaultKey, spin: SPEC.defaultSpin, deg: '17', row: SPEC.defaultRow, lay: 3, t: 0, paused: false };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var view = function (k) { for (var i = 0; i < SPEC.views.length; i++) if (SPEC.views[i].key === k) return SPEC.views[i]; return null; };

  /* ---------- half floats ---------- */
  var HALF = new Float32Array(65536);
  for (var h = 0; h < 65536; h++) {
    var s = h & 0x8000 ? -1 : 1, e = (h >> 10) & 31, m = h & 1023;
    HALF[h] = e === 0 ? s * m * Math.pow(2, -24) : e === 31 ? (m ? NaN : s * Infinity) : s * (1 + m / 1024) * Math.pow(2, e - 15);
  }
  var NEG1 = 0xBC00;   /* half(−1): the sentinel for "no crossing" or "no emission" (NaN and +∞ in the corpus) */
  function clean(u16) {
    var out = new Uint16Array(u16.length);
    for (var i = 0; i < u16.length; i++) { var x = u16[i]; out[i] = ((x & 0x7C00) === 0x7C00) ? NEG1 : x; }
    return out;
  }

  /* ---------- the pinned bytes ---------- */
  var pinNote = $('bh-pin');
  var pinState = { checked: 0, failed: 0, unchecked: 0 };
  function hex(buf) { var a = new Uint8Array(buf), s = ''; for (var i = 0; i < a.length; i++) s += (a[i] < 16 ? '0' : '') + a[i].toString(16); return s; }
  function showPins() {
    if (!pinNote) return;
    pinNote.textContent = pinState.failed ? pinState.failed + ' file(s) did not match their pinned sha256 and were not drawn.'
      : pinState.unchecked ? 'This browser offers no digest on this connection, so the ' + pinState.unchecked + ' file(s) in use were not checked against their pins here.'
      : 'The ' + pinState.checked + ' map files loaded so far match their pinned sha256, checked in this tab.';
  }
  function gunzip(bytes) {
    if (typeof DecompressionStream === 'undefined') return Promise.reject(new Error('this browser cannot decompress the maps (no DecompressionStream)'));
    var ds = new DecompressionStream('gzip');
    return new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer();
  }
  function getFile(f) {
    return fetch(SPEC.mapsDir + f.name).then(function (r) { if (!r.ok) throw new Error(f.name + ': HTTP ' + r.status); return r.arrayBuffer(); }).then(function (buf) {
      var b = new Uint8Array(buf), gz = b[0] === 0x1f && b[1] === 0x8b;
      var want = gz ? f.sha256 : f.rawSha256;
      var dig = window.crypto && window.crypto.subtle ? window.crypto.subtle.digest('SHA-256', buf).then(hex) : Promise.resolve(null);
      return dig.then(function (d) {
        if (d === null) pinState.unchecked++; else if (d !== want) { pinState.failed++; showPins(); throw new Error(f.name + ' is not the pinned file'); } else pinState.checked++;
        showPins();
        return gz ? gunzip(b) : buf;
      });
    });
  }
  var maps = {};
  function load(key) {
    if (maps[key]) return maps[key];
    var v = view(key);
    maps[key] = Promise.all(['n0', 'n1', 'n2'].map(function (n) { return getFile(v.files[n]); })).then(function (bufs) {
      var L = bufs.map(function (b) { return clean(new Uint16Array(b)); });
      /* the exposure (CHOSEN): the static image with the pattern flat, so that its brightest 1 % saturate */
      var I0 = [], A = L[0], B = L[1];
      for (var p = 0; p < N * N; p++) {
        var t = 0;
        for (var k = 0; k < 2; k++) { var X = k ? B : A, r = HALF[X[3 * p]], g = HALF[X[3 * p + 2]]; if (g > 0 && r > 0 && r <= 20) t += g * g * g / (r * r); }
        if (t > 0) I0.push(t);
      }
      I0.sort(function (x, y) { return x - y; });
      var expo = I0.length ? I0[Math.floor(0.99 * (I0.length - 1))] / 2.2 : 1;
      return { L: L, expo: expo, key: key };
    });
    return maps[key];
  }

  /* ---------- the pattern (ASSUMED), one definition for both renderers ---------- */
  var GLSL_PATTERN = [
    'float h3(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }',
    'float vn(vec2 x, float per, float seed){ vec2 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);',
    '  float i0 = mod(i.x, per), i1 = mod(i.x + 1.0, per);',
    '  float a = h3(vec3(i0, i.y, seed)), b = h3(vec3(i1, i.y, seed)), c = h3(vec3(i0, i.y + 1.0, seed)), d = h3(vec3(i1, i.y + 1.0, seed));',
    '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y) * 2.0 - 1.0; }',
    'float fbm(float ph, float lr, float seed){ float u = ph * 0.15915494309; return 0.65 * vn(vec2(u * 16.0, lr * 5.0), 16.0, seed) + 0.35 * vn(vec2(u * 32.0, lr * 10.0), 32.0, seed + 17.0); }'
  ].join('\n');
  function fract(x) { return x - Math.floor(x); }
  function h3(x, y, z) {
    x = fract(x * 0.1031); y = fract(y * 0.1030); z = fract(z * 0.0973);
    var d = x * (y + 33.33) + y * (z + 33.33) + z * (x + 33.33);
    x += d; y += d; z += d;
    return fract((x + y) * z);
  }
  function vn(x, y, per, seed) {
    var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    var i0 = ((ix % per) + per) % per, i1 = (((ix + 1) % per) + per) % per;
    var a = h3(i0, iy, seed), b = h3(i1, iy, seed), c = h3(i0, iy + 1, seed), d = h3(i1, iy + 1, seed);
    return ((a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy) * 2 - 1;
  }
  function fbm(ph, lr, seed) { var u = ph * 0.15915494309; return 0.65 * vn(u * 16, lr * 5, 16, seed) + 0.35 * vn(u * 32, lr * 10, 32, seed + 17); }
  /* the epochs, in double precision on this side: which two are live, how far into each, and their weights */
  function epochs(t) {
    var s = t / TEP, kA = Math.floor(s), fA = s - kA, kB = Math.floor(s + 0.5), fB = s + 0.5 - kB;
    var wA = Math.pow(Math.sin(Math.PI * fA), 2), wB = Math.pow(Math.sin(Math.PI * fB), 2), n = Math.sqrt(wA * wA + wB * wB);
    return { kA: kA % 4096, kB: (kB % 4096) + 5000, dA: t - kA * TEP, dB: t - (kB - 0.5) * TEP, wA: wA / n, wB: wB / n };
  }

  /* ---------- the GPU renderer ---------- */
  var gl = null, prog = null, tex = {}, U = {}, glKey = null;
  var VS = '#version 300 es\nin vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
  var FS = '#version 300 es\nprecision highp float; precision highp int; precision highp sampler2D;\n'
    + 'uniform sampler2D t0, t1, t2; uniform float uA, uExpo, uScale, kA, kB, dA, dB, wA, wB; uniform int uLay; uniform vec3 uBg, uInk;\nout vec4 o;\n'
    + GLSL_PATTERN + '\n'
    + 'float pat(float r, float ph){ float om = 1.0 / (r * sqrt(r) + uA), lr = log(r);'
    + '  float F = wA * fbm(ph - om * dA, lr, kA) + wB * fbm(ph - om * dB, lr, kB); return max(0.05, 1.0 + 0.8 * F); }\n'
    + 'float em(vec3 c){ if (c.z <= 0.0 || c.x <= 0.0 || c.x > 20.0) return 0.0; return c.z * c.z * c.z / (c.x * c.x) * pat(c.x, c.y); }\n'
    + 'void main(){ ivec2 q = ivec2(floor(gl_FragCoord.xy * uScale)); q.y = ' + (N - 1) + ' - q.y; float I = 0.0;\n'
    + '  if ((uLay & 1) != 0) I += em(texelFetch(t0, q, 0).xyz);\n'
    + '  if ((uLay & 2) != 0) I += em(texelFetch(t1, q, 0).xyz);\n'
    + '  if ((uLay & 4) != 0) { float s2 = 0.0; for (int dy = -2; dy <= 2; dy++) for (int dx = -2; dx <= 2; dx++) {'
    + '    ivec2 z = clamp(q + 2 * ivec2(dx, dy), ivec2(0), ivec2(' + (N - 1) + ')); s2 += em(texelFetch(t2, z, 0).xyz); } I += s2 / 25.0; }\n'
    + '  float v = pow(1.0 - exp(-I / uExpo), 0.85); o = vec4(mix(uBg, uInk, v), 1.0); }';
  function initGL() {
    try { gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true }); } catch (e) { gl = null; }
    if (!gl) return false;
    var sh = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) { if (window.console) console.warn('black hole: WebGL2 shader refused, using the canvas 2D fallback: ' + e.message); gl = null; return false; }
    gl.useProgram(prog);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ['t0', 't1', 't2', 'uA', 'uExpo', 'uScale', 'kA', 'kB', 'dA', 'dB', 'wA', 'wB', 'uLay', 'uBg', 'uInk'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    gl.uniform1i(U.t0, 0); gl.uniform1i(U.t1, 1); gl.uniform1i(U.t2, 2);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    return true;
  }
  function upload(m) {
    if (glKey === m.key) return;
    if (!tex[m.key]) tex[m.key] = m.L.map(function (L) {
      var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB16F, N, N, 0, gl.RGB, gl.HALF_FLOAT, L);
      return t;
    });
    tex[m.key].forEach(function (t, i) { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); });
    glKey = m.key;
  }
  function drawGL(m, col) {
    upload(m);
    var E = epochs(S.t);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(U.uA, Number(m.spinD)); gl.uniform1f(U.uExpo, m.expo); gl.uniform1f(U.uScale, N / canvas.width);
    gl.uniform1f(U.kA, E.kA); gl.uniform1f(U.kB, E.kB); gl.uniform1f(U.dA, E.dA); gl.uniform1f(U.dB, E.dB); gl.uniform1f(U.wA, E.wA); gl.uniform1f(U.wB, E.wB);
    gl.uniform1i(U.uLay, S.lay);
    gl.uniform3f(U.uBg, col.bg[0] / 255, col.bg[1] / 255, col.bg[2] / 255); gl.uniform3f(U.uInk, col.ink[0] / 255, col.ink[1] / 255, col.ink[2] / 255);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* ---------- the canvas 2D fallback (double precision, a quarter of the pixels, a dozen frames a second) ---------- */
  var ctx2 = null, img2 = null, F32 = {};
  function f32(m) {
    if (!F32[m.key]) F32[m.key] = m.L.map(function (L) { var o = new Float32Array(L.length); for (var i = 0; i < L.length; i++) o[i] = HALF[L[i]]; return o; });
    return F32[m.key];
  }
  function draw2D(m, col) {
    var n = N / 2;
    if (!ctx2) { canvas.width = n; canvas.height = n; ctx2 = canvas.getContext('2d'); img2 = ctx2.createImageData(n, n); }
    var L = f32(m), E = epochs(S.t), a = Number(m.spinD), d = img2.data;
    var em = function (X, p) {
      var r = X[3 * p], ph = X[3 * p + 1], g = X[3 * p + 2];
      if (!(g > 0 && r > 0 && r <= 20)) return 0;
      var om = 1 / (r * Math.sqrt(r) + a), lr = Math.log(r);
      var P = Math.max(0.05, 1 + 0.8 * (E.wA * fbm(ph - om * E.dA, lr, E.kA) + E.wB * fbm(ph - om * E.dB, lr, E.kB)));
      return g * g * g / (r * r) * P;
    };
    for (var j = 0; j < n; j++) for (var i = 0; i < n; i++) {
      var p = (2 * j) * N + 2 * i, I = 0;
      if (S.lay & 1) I += em(L[0], p);
      if (S.lay & 2) I += em(L[1], p);
      if (S.lay & 4) { var s2 = 0; for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) { var y = Math.min(N - 1, Math.max(0, 2 * j + 2 * dy)), x = Math.min(N - 1, Math.max(0, 2 * i + 2 * dx)); s2 += em(L[2], y * N + x); } I += s2 / 25; }
      var v = Math.pow(1 - Math.exp(-I / m.expo), 0.85), o = 4 * (j * n + i);
      d[o] = col.bg[0] + (col.ink[0] - col.bg[0]) * v; d[o + 1] = col.bg[1] + (col.ink[1] - col.bg[1]) * v; d[o + 2] = col.bg[2] + (col.ink[2] - col.bg[2]) * v; d[o + 3] = 255;
    }
    ctx2.putImageData(img2, 0, 0);
  }

  /* ---------- the overlay: the decided curve, the jet sketch, the view's label (the paths: paths.js, shared with the build) ---------- */
  var BP = window.BHPATHS;
  function overlay() {
    var v = view(S.key);
    var cd = BP.curvePath(v.curve.points);
    $('bh-curve').setAttribute('d', cd); $('bh-casing').setAttribute('d', cd);
    $('bh-curve').setAttribute('data-rec', 'playground/black-hole/out/scene.json#/views/' + SPEC.views.indexOf(v) + '/curve/points');
    $('bh-jet').setAttribute('d', BP.jetPath(v.inclinationDeg, 1));
    $('bh-viewtag').textContent = v.model ? 'a picture of the model at ' + v.inclinationDeg + '°, not M87*’s view' : 'M87*’s view, 17° (assumed, from the jet)';
    stage.classList.toggle('model', !!v.model);
  }

  /* ---------- the readouts ---------- */
  var ivOf = function (s) { var m = /\[\s*([-\d.e+]+)\s*,\s*([-\d.e+]+)\s*\]/.exec(s); return m ? [Number(m[1]), Number(m[2])] : null; };
  var down = function (x, d) { var k = Math.pow(10, d); return (Math.floor(x * k) / k).toFixed(d); };
  var up = function (x, d) { var k = Math.pow(10, d); return (Math.ceil(x * k) / k).toFixed(d); };
  function setVal(id, text, rec) { var e = $(id); if (!e) return; e.textContent = text; if (rec) e.setAttribute('data-rec', rec); }
  var esc = function (s) { return String(s).replace(/~/g, '~0').replace(/\//g, '~1'); };
  function readouts() {
    var v = view(S.key), R = SPEC.rows[S.row], base = SPEC.record + '#/enclosures/';
    setVal('bh-tg', R.thetaG, base + 'thetaG/' + S.row + '/uas');
    setVal('bh-pred', R.pred, base + 'predictedUas/' + S.row + '/band17');
    setVal('bh-ratio', R.ratio, base + 'comparison/rows/' + S.row + '/eht2017-2021/band17');
    setVal('bh-tgh', R.tgHours, base + 'clock/' + S.row + '/tgHours');
    setVal('bh-iscod', R.iscoDays[v.iscoKey], base + 'clock/' + S.row + '/iscoDays/' + esc(v.iscoKey));
    setVal('bh-iscotg', SPEC.isco[v.iscoKey], base + 'isco/at/' + esc(v.iscoKey) + '/periodTg');
    var P = ivOf(SPEC.isco[v.iscoKey]);
    setVal('bh-iscos', up(P[1] / RATE, 1));
    var H = ivOf(R.tgHours);
    setVal('bh-speedh', '[' + down(RATE * H[0], 2) + ', ' + up(RATE * H[1], 2) + ']');
    $('bh-rowlabel').textContent = R.label;
    $('bh-circ').hidden = !R.circular;
    $('bh-spinlabel').textContent = v.spinLabel;
  }
  function clock() {
    var R = SPEC.rows[S.row], H = ivOf(R.tgHours);
    $('bh-t').textContent = Math.floor(S.t).toLocaleString('en-US');
    $('bh-days').textContent = '[' + down(S.t * H[0] / 24, 1) + ', ' + up(S.t * H[1] / 24, 1) + ']';
  }

  /* ---------- the controls ---------- */
  function choose(key) {
    S.key = key;
    var v = view(key);
    S.spin = v.spin; S.deg = v.inclinationDeg;
    document.querySelectorAll('[data-spin]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-spin') === v.spin && !v.model)); b.disabled = !!v.model; });
    document.querySelectorAll('[data-view]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === v.inclinationDeg)); });
    $('bh-spinnote').hidden = !v.model;
    overlay(); readouts();
    load(key).then(function () { if (S.key === key) frame(true); }).catch(fail);
  }
  document.querySelectorAll('[data-spin]').forEach(function (b) { b.addEventListener('click', function () { choose(b.getAttribute('data-spin')); }); });
  document.querySelectorAll('[data-view]').forEach(function (b) {
    b.addEventListener('click', function () { var d = b.getAttribute('data-view'); choose(d === '17' ? SPEC.defaultSpin : SPEC.defaultSpin + ' @ ' + d); });
  });
  document.querySelectorAll('[data-lay]').forEach(function (c) {
    c.addEventListener('change', function () { var bit = Number(c.getAttribute('data-lay')); S.lay = c.checked ? (S.lay | bit) : (S.lay & ~bit); frame(true); });
  });
  var rowSel = $('bh-row');
  rowSel.addEventListener('change', function () { S.row = rowSel.value; readouts(); clock(); });

  /* ---------- the loop ---------- */
  var colours = null;
  function readColours() {
    var T = window.WTHEME;
    colours = T ? { bg: T.rgb('--bg'), ink: T.rgb('--ink') } : { bg: [10, 10, 12], ink: [246, 246, 248] };
  }
  if (window.WTHEME) window.WTHEME.on(function () { readColours(); frame(true); });
  readColours();
  var useGL = initGL(), last = null, slow = 0, frames = 0, last2D = 0;
  stage.setAttribute('data-renderer', useGL ? 'webgl2' : 'canvas2d');
  $('bh-renderer').textContent = useGL ? 'WebGL2, float32' : 'canvas 2D, double precision, a quarter of the pixels';
  var current = null;
  function frame(force) {
    var p = maps[S.key];
    if (!p) return;
    p.then(function (m) {
      if (m.key !== S.key) return;
      m.spinD = view(S.key).spinD;
      current = m;
      if (useGL) drawGL(m, colours); else draw2D(m, colours);
      stage.classList.add('ready');
    });
  }
  function tick(now) {
    if (last !== null && !S.paused && !reduce) {
      var dt = Math.min(0.1, (now - last) / 1000);
      S.t += dt * RATE;
      if (useGL) {
        /* degrade gracefully: if frames run slow for a second, shade half the pixels */
        frames++; if (now - last > 40) slow++;
        if (frames === 60) { if (slow > 30 && canvas.width === N) { canvas.width = N / 2; canvas.height = N / 2; $('bh-renderer').textContent = 'WebGL2, float32, half the pixels (this machine ran slow)'; } frames = 0; slow = 0; }
      }
    }
    last = now;
    if (current && (useGL || now - last2D > 80)) { last2D = now; if (useGL) drawGL(current, colours); else draw2D(current, colours); }
    clock();
    requestAnimationFrame(tick);
  }
  function fail(e) { stage.classList.add('failed'); $('bh-viewtag').textContent = 'not drawn: ' + (e && e.message ? e.message : e); }
  if (reduce) $('bh-reduce').hidden = false;
  choose(S.key);
  requestAnimationFrame(tick);
})();
