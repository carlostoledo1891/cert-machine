/* receipt.js — THE receipt, drawn once: the page's first render at build time
   and every re-decision in the reader's tab call this same function, so the
   receipt a crawler reads and the one a reader re-runs cannot be two designs.
   INK: the proposal is a claim — italic, dashed, in the claim ink; what the
   gate decided is solid. They never share a stroke or a type style.
   apps/contraprova · cert-machine                                        MIT */
'use strict';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const CLS = { 'PROVADO': 'provado', 'REFUTADO': 'refutado', 'RECUSADO': 'recusado', 'NÃO AVALIADO': 'nao' };
const MEANS = {
  'PROVADO': 'vale para toda entrada declarada',
  'REFUTADO': 'falha — e a falha está provada',
  'RECUSADO': 'a evidência declarada não decide'
};
function chip(v, big) { return '<span class="cp-chip ' + (CLS[v] || 'nao') + (big ? ' big' : '') + '">' + esc(v) + '</span>'; }
const br = (x, d) => Number(x).toFixed(d).replace('.', ',');
const brNum = (s) => { const x = Number(s); return Math.abs(x) >= 1000 ? Math.round(x).toLocaleString('pt-BR') : String(s).replace('.', ','); };

/* the number line: the decided enclosure solid, the declared limit a guide,
   the proposal a dashed claim. A claim far off the scale is pinned to the edge
   with its value written, never allowed to stretch the scale into a line. */
function numberLine(r, limit, narrow) {
  const W = narrow ? 360 : 640, H = 98, L = 18, R = 18, y = 40;
  const claim = Number(r.claim), lim = Number(limit);
  const pts = [lim].concat(r.enclosure || []);
  let lo = Math.min(...pts), hi = Math.max(...pts);
  const pad = Math.max(4, (hi - lo) * 0.25); lo -= pad; hi += pad;
  const inView = claim >= lo && claim <= hi;
  if (!inView && claim >= lo - 25 && claim <= hi + 25) { lo = Math.min(lo, claim - 3); hi = Math.max(hi, claim + 3); }
  const x = (v) => L + (W - L - R) * (Math.min(Math.max(v, lo), hi) - lo) / (hi - lo);
  const o = ['<svg class="cp-nl' + (narrow ? ' narrow' : ' wide') + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('Intervalo decidido' + (r.enclosure ? ' de ' + br(r.enclosure[0], 1) + ' a ' + br(r.enclosure[1], 1) + ' bar' : ': nenhum') + '; limite ' + limit + ' bar; proposta ' + brNum(r.claim) + ' bar') + '">'];
  o.push('<line class="cp-axis" x1="' + L + '" y1="' + y + '" x2="' + (W - R) + '" y2="' + y + '"/>');
  if (r.enclosure) {
    const a = x(r.enclosure[0]), b = x(r.enclosure[1]);
    o.push('<rect class="cp-enc" x="' + a.toFixed(1) + '" y="' + (y - 9) + '" width="' + Math.max(2, b - a).toFixed(1) + '" height="18" rx="3"/>');
    o.push('<text class="cp-t" x="' + a.toFixed(1) + '" y="' + (y + 28) + '" text-anchor="middle">' + br(r.enclosure[0], 1) + '</text>');
    o.push('<text class="cp-t" x="' + b.toFixed(1) + '" y="' + (y + 28) + '" text-anchor="middle">' + br(r.enclosure[1], 1) + '</text>');
  } else o.push('<text class="cp-t dim" x="' + (W / 2) + '" y="' + (y + 28) + '" text-anchor="middle">' + (narrow ? 'nenhum intervalo afirmado' : 'nenhum intervalo afirmado: fora do domínio do modelo') + '</text>');
  const xl = x(lim);
  o.push('<line class="cp-guide" x1="' + xl.toFixed(1) + '" y1="' + (y - 22) + '" x2="' + xl.toFixed(1) + '" y2="' + (y + 14) + '"/>');
  o.push('<text class="cp-t" x="' + xl.toFixed(1) + '" y="' + (y - 27) + '" text-anchor="middle">limite ' + esc(limit) + '</text>');
  const off = claim < lo || claim > hi, xc = x(claim);
  o.push('<line class="cp-claim" x1="' + xc.toFixed(1) + '" y1="' + (y - 16) + '" x2="' + xc.toFixed(1) + '" y2="' + (y + 16) + '"/>');
  const anchor = xc > W - 90 ? 'end' : xc < 90 ? 'start' : 'middle';
  /* a narrow line has no room for a phrase under the axis */
  o.push('<text class="cp-t claim" x="' + xc.toFixed(1) + '" y="' + (y + 28 + (r.enclosure ? 14 : 0)) + '" text-anchor="' + anchor + '">' + (off ? (claim > hi ? '→ ' : '← ') : '') + 'proposta ' + brNum(r.claim) + '</text>');
  o.push('</svg>');
  return o.join('');
}

/* c: the case (title, story, confidence, fault); r: the receipt; meta: the run line */
function receiptHtml(c, r, limit, meta) {
  const o = [];
  o.push('<div class="cp-rc">');
  o.push('<div class="cp-common"><div class="cp-k">' + (c.kind === 'proposta' ? 'O que o modelo entrega' : 'Falha injetada: ' + esc(c.fault)) + '</div>'
    + '<p class="cp-story">' + esc(c.story) + '</p>'
    + '<div class="cp-pred"><span>previsão</span><b>' + esc(brNum(r.claim)) + ' bar</b>' + (c.confidence ? '<span>confiança</span><b>' + esc(c.confidence) + '</b>' : '') + '</div></div>');
  o.push('<div class="cp-cert"><div class="cp-k">O que a Contraprova decide</div>'
    + '<div class="cp-vline">' + chip(r.verdict, true) + '<span class="cp-means">' + esc(MEANS[r.verdict]) + '</span></div>'
    + (r.enclosure ? '<p class="cp-enc-t">P_wh ∈ [' + br(r.enclosure[0], 1) + '; ' + br(r.enclosure[1], 1) + '] bar para toda entrada declarada</p>' : '<p class="cp-enc-t">Nenhum intervalo afirmado: o modelo declarado não se aplica a toda a caixa.</p>')
    + numberLine(r, limit) + numberLine(r, limit, true)
    + '<ul class="cp-checks">' + r.checks.map((k) => '<li>' + chip(k.verdict) + '<div><b>' + esc(k.name) + '</b><span>' + esc(k.text) + '</span></div></li>').join('') + '</ul>'
    + (r.thresholds.length ? '<div class="cp-flip"><div class="cp-k">O que decidiria</div><ul>' + r.thresholds.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul></div>' : '')
    + '<div class="cp-run">' + esc(r.proved + ' de ' + r.of + ' verificações provadas · ' + r.evals + ' avaliações intervalares') + (meta ? ' · ' + esc(meta) : '') + '</div>'
    + '</div>');
  o.push('</div>');
  return o.join('');
}

const api = { receiptHtml, numberLine, chip, esc, MEANS };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
