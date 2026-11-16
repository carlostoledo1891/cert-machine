/* nucleo-modelo.js — the idealized "certified endurance without GNSS" model of the Atalaia Núcleo page, ONCE: the
   builder (nucleo.js) evaluates it in Node to write and check the page's numbers, and inlines this very file into the
   page so the interactive chart runs the same code. apps/atalaia · cert-machine · 2026-11-16                      MIT

   A MODEL, NOT A MEASUREMENT. The spec sheets' bias instability is treated as a constant bound (it is not one), there is
   no position, velocity or attitude error at the moment GNSS is lost, and ε = 5 m is chosen. Inertial only: a constant
   gyro bias ω gives g·ω·t³/6 of horizontal error and an accelerometer bias a gives ½·a·t². The carousel (alternating
   yaw, one turn per minute) is modelled as leaving ½·g·(ω/Ω)·t² at the worst phase. The drag lever caps the region at
   the wind-change bound times t. The plotted quantity is 2·r(t) + ε, the region's diameter plus the gate tolerance, and
   the certified endurance is the time it takes to reach the phase's alert limit.                                   */
var NUCLEO = (function () {
  'use strict';
  var G = 9.80665, DEG = Math.PI / 180, OMC = 2 * Math.PI / 60, EPS = 5, TMAX = 900;
  var IMU = {
    hg: { nome: 'Honeywell HG4930-S', curto: 'HG4930-S', gyro: 0.25, acc: 0.025e-3 },   /* °/h; g (bias instability, spec sheets) */
    ep: { nome: 'Epson M-G370', curto: 'Epson M-G370', gyro: 0.8, acc: 24e-6 } };
  function raio(imu, t, o) {                                     /* r(t), metres */
    var w = imu.gyro * DEG / 3600, a = imu.acc * G;
    var gy = o.carrossel ? 0.5 * G * (w / OMC) * t * t : G * w * t * t * t / 6;
    var r = gy + 0.5 * a * t * t;
    if (o.arrasto) r = Math.min(r, o.dv * t);
    return r;
  }
  function largura(imu, t, o) { return 2 * raio(imu, t, o) + EPS; }
  function autonomia(imu, L, o) {                                /* seconds until 2r + ε reaches L, or null past TMAX */
    var f = function (t) { return largura(imu, t, o); };
    if (f(0) >= L) return 0;
    if (f(TMAX) < L) return null;
    var lo = 0, hi = TMAX;
    for (var i = 0; i < 60; i++) { var m = (lo + hi) / 2; if (f(m) >= L) hi = m; else lo = m; }
    return hi;
  }
  function relogio(s) { if (s == null) return 'mais de 15:00'; var T = Math.round(s); return Math.floor(T / 60) + ':' + String(T % 60).padStart(2, '0'); }
  /* the chart, as SVG markup (the builder writes the first one, the page redraws on input): computed curves are
     dashed (the house grammar); the alert limit is a solid rule; one viewBox, so nothing moves when it redraws */
  function grafico(o) {
    var W = 720, H = 340, l = 58, r = 18, t = 16, b = 46, imu = IMU[o.imu];
    var ymax = Math.max(100, Math.ceil(o.L * 1.5 / 50) * 50);
    var X = function (s) { return l + (W - l - r) * s / TMAX; }, Y = function (m) { return H - b - (H - b - t) * Math.min(m, ymax) / ymax; };
    var path = function (opt) { var d = ''; for (var s = 0; s <= TMAX; s += 3) { var v = largura(imu, s, opt); d += (s ? 'L' : 'M') + X(s).toFixed(1) + ' ' + Y(v).toFixed(1); if (v >= ymax) break; } return d; };   /* stops at the top: no false plateau */
    var so = { carrossel: false, arrasto: false }, com = { carrossel: o.carrossel, arrasto: o.arrasto, dv: o.dv };
    var a0 = autonomia(imu, o.L, so), a1 = autonomia(imu, o.L, com), out = '';
    for (var m = 0; m <= 15; m += 3) out += '<line class="nu-grid" x1="' + X(m * 60) + '" x2="' + X(m * 60) + '" y1="' + t + '" y2="' + (H - b) + '"/><text class="nu-ax" x="' + X(m * 60) + '" y="' + (H - b + 18) + '" text-anchor="middle">' + m + '</text>';
    for (var k = 0; k <= 4; k++) { var v = ymax * k / 4; out += '<line class="nu-grid" x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/><text class="nu-ax" x="' + (l - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + Math.round(v) + '</text>'; }
    out += '<text class="nu-axl" x="' + ((l + W - r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle">minutos sem GNSS</text>';
    out += '<text class="nu-axl" x="14" y="' + ((t + H - b) / 2) + '" text-anchor="middle" transform="rotate(-90 14 ' + ((t + H - b) / 2) + ')">largura da região + ε (m)</text>';
    out += '<line class="nu-lim" x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(o.L) + '" y2="' + Y(o.L) + '"/><text class="nu-lb" x="' + (l + 6) + '" y="' + (Y(o.L) - 8) + '">limite de alerta, ' + o.L + ' m</text>';
    out += '<path class="nu-c0" d="' + path(so) + '"/><path class="nu-c1" d="' + path(com) + '"/>';
    [[a0, 'só inercial'], [a1, 'com as alavancas']].forEach(function (p, i) { if (p[0] == null) return; var x = X(p[0]), right = x > (l + W - r) / 2;
      out += '<circle class="nu-mk" cx="' + x.toFixed(1) + '" cy="' + Y(o.L).toFixed(1) + '" r="5"/><text class="nu-lb" x="' + (x + (right ? -10 : 10)).toFixed(1) + '" y="' + (Y(o.L) + 22 + 18 * i).toFixed(1) + '" text-anchor="' + (right ? 'end' : 'start') + '">' + p[1] + ' ' + relogio(p[0]) + '</text>'; });
    return { svg: '<svg class="nu-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Largura da região de proteção mais ε, em metros, ao longo dos minutos sem GNSS, para o ' + imu.curto + ': só inercial e com as alavancas escolhidas; linha tracejada: calculada pelo modelo">' + out + '</svg>', a0: a0, a1: a1 };
  }
  return { G: G, EPS: EPS, TMAX: TMAX, IMU: IMU, raio: raio, largura: largura, autonomia: autonomia, relogio: relogio, grafico: grafico };
})();
if (typeof module !== 'undefined') module.exports = NUCLEO;
