/* registro.js — THE receipt of one scenario version, drawn once: the page's first
   render at build time, the deck, the Registro de cálculo and every re-decision in
   the reader's tab call this same function. INK: a published claim is a proposer's
   number — italic, dashed, claim ink; what the kernel decided is solid. They never
   share a stroke. apps/abatimento · cert-machine                              MIT */
'use strict';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const CLS = { PROVADO: 'provado', REFUTADO: 'refutado', RECUSADO: 'recusado', 'COMPATÍVEL': 'provado', 'INCOMPATÍVEL': 'refutado', 'NÃO AVALIADO': 'nao' };
const MEANS = { PROVADO: 'vale para toda premissa dentro do envelope declarado', REFUTADO: 'falha, e a falha está provada no envelope inteiro', RECUSADO: 'o envelope contém pontos de ambos os lados; o registro diz o que medir' };
function chip(v, big) { return '<span class="ab-chip ' + (CLS[v] || 'nao') + (big ? ' big' : '') + '">' + esc(v) + '</span>'; }
const toF = (s) => { const [n, d] = String(s).split('/'); return Number(n) / (d ? Number(d) : 1); };
/* pt-BR integer with thousands separators, from a rational string or a number */
function br0(x) { const v = typeof x === 'number' ? x : toF(x); return Math.round(v).toLocaleString('pt-BR'); }
function brk(x) { const v = typeof x === 'number' ? x : toF(x); return Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(2).replace('.', ',') + ' Mt' : Math.abs(v) >= 1e3 ? Math.round(v / 1e3).toLocaleString('pt-BR') + ' mil' : Math.round(v).toLocaleString('pt-BR'); }
function brd(x, d) { const v = typeof x === 'number' ? x : toF(x); return v.toFixed(d).replace('.', ','); }

/* the number line: the enclosure solid; the class thresholds as guides; the claim a dashed line */
function numberLine(r, classes, narrow) {
  const W = narrow ? 360 : 680, H = 104, L = 16, Rm = 16, y = 44;
  const lo = toF(r.enclosure[0]), hi = toF(r.enclosure[1]);
  const claim = r.afirmacao && r.afirmacao.valor !== null && r.afirmacao.valor !== undefined ? toF(r.afirmacao.valor) : null;
  const ths = []; for (const [nome, [a, b]] of Object.entries(classes)) { if (b !== null && b !== undefined) ths.push({ v: toF(b), t: nome + ' | ' + Object.keys(classes)[Object.keys(classes).indexOf(nome) + 1] }); }
  /* scale: the enclosure plus the thresholds within a factor, plus the claim */
  let a = Math.min(lo, claim === null ? lo : claim), b = Math.max(hi, claim === null ? hi : claim);
  for (const t of ths) if (t.v > b * 0.25 && t.v < b * 4) { a = Math.min(a, t.v); b = Math.max(b, t.v); }
  const pad = Math.max(1, (b - a) * 0.12); a -= pad; b += pad; if (a < 0 && lo >= 0) a = 0;
  const x = (v) => L + (W - L - Rm) * (Math.min(Math.max(v, a), b) - a) / (b - a);
  const o = ['<svg class="ab-nl' + (narrow ? ' narrow' : ' wide') + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('Intervalo decidido de ' + br0(lo) + ' a ' + br0(hi) + ' tCO2e por ano' + (claim !== null ? '; afirmação publicada ' + br0(claim) : '')) + '">'];
  o.push('<line class="ab-axis" x1="' + L + '" y1="' + y + '" x2="' + (W - Rm) + '" y2="' + y + '"/>');
  for (const t of ths) { if (t.v < a || t.v > b) continue; const xt = x(t.v); o.push('<line class="ab-guide" x1="' + xt.toFixed(1) + '" y1="' + (y - 26) + '" x2="' + xt.toFixed(1) + '" y2="' + (y + 16) + '"/>'); o.push('<text class="dim" x="' + xt.toFixed(1) + '" y="' + (y - 30) + '" text-anchor="middle">' + esc(brk(t.v)) + '</text>'); }
  const xa = x(lo), xb = x(hi);
  o.push('<rect class="ab-enc" x="' + xa.toFixed(1) + '" y="' + (y - 9) + '" width="' + Math.max(2, xb - xa).toFixed(1) + '" height="18" rx="3"/>');
  o.push('<text x="' + xa.toFixed(1) + '" y="' + (y + 30) + '" text-anchor="' + (xa < 60 ? 'start' : 'middle') + '">' + esc(br0(lo)) + '</text>');
  o.push('<text x="' + xb.toFixed(1) + '" y="' + (y + 30) + '" text-anchor="' + (xb > W - 60 ? 'end' : 'middle') + '">' + esc(br0(hi)) + '</text>');
  if (claim !== null) { const xc = x(claim); o.push('<line class="ab-claim" x1="' + xc.toFixed(1) + '" y1="' + (y - 18) + '" x2="' + xc.toFixed(1) + '" y2="' + (y + 18) + '"/>'); o.push('<text class="claim" x="' + xc.toFixed(1) + '" y="' + (y + 46) + '" text-anchor="' + (xc > W - 110 ? 'end' : xc < 110 ? 'start' : 'middle') + '">' + (narrow ? '' : 'afirmação ') + esc(br0(claim)) + '</text>'); }
  o.push('</svg>');
  return o.join('');
}

/* the sensitivity bars: each premise's share of the enclosure's width */
function sensBars(r) {
  const rows = r.sensibilidade.linhas.slice(0, 6);
  return '<ul class="ab-sens">' + rows.map((l) => { const p = Math.max(0, Math.min(100, Number(l.parcelaPct.replace(',', '.')))); return '<li><span class="k">' + esc(l.premissa) + '</span><span class="bar"><i style="width:' + p.toFixed(1) + '%"></i></span><span class="n">' + esc(l.parcelaPct) + '%</span></li>'; }).join('') + '</ul>';
}

/* c: the scenario record; r: the receipt; classes; meta: the run line */
function receiptHtml(c, r, classes, meta) {
  const o = [];
  const claimTxt = c.afirmacao && c.afirmacao.texto ? c.afirmacao.texto : null;
  o.push('<div class="ab-rc">');
  o.push('<div class="ab-common"><div class="ab-k">' + esc(c.categoria) + ' · ' + esc(c.fonte_emissora) + ' · v' + esc(c.versao) + '</div>'
    + '<h3 class="ab-title">' + esc(c.titulo) + '</h3>'
    + '<p class="ab-status">' + esc(c.status || '') + (c.mudanca ? ' — ' + esc(c.mudanca) : '') + '</p>'
    + (claimTxt ? '<div class="ab-pred"><span>afirmação publicada</span><b>' + esc(claimTxt) + '</b>' + (c.afirmacao.classe ? '<span>classe afirmada</span><b>' + esc(c.afirmacao.classe) + '</b>' : '') + '</div>' : '')
    + '<div class="ab-k" style="margin-top:14px">premissas declaradas (faixa · unidade · fonte)</div><table class="ab-prem">' + Object.entries(c.premissas).map(([k, p]) => '<tr><td>' + esc(k) + '</td><td>' + esc(p.lo) + ' – ' + esc(p.hi) + '</td><td>' + esc(p.un || '') + '</td><td>' + esc(p.fonte || '') + '</td></tr>').join('') + '</table>'
    + '<div class="ab-k" style="margin-top:12px">fórmula (tCO2e/ano)</div><pre class="ab-formula">' + esc(r.formula) + '</pre>'
    + '</div>');
  const cls = r.classe.porClasse.map((x) => '<li>' + chip(x.verdict) + '<div><b>' + esc(x.classe) + '</b><span>' + esc(x.ate === null ? '≥ ' + brk(x.de) : brk(x.de) + ' a ' + brk(x.ate)) + ' tCO2e/ano</span></div></li>').join('');
  const claimRow = r.afirmacao ? '<li>' + chip(r.afirmacao.verdict) + '<div><b>afirmação publicada: ' + esc(br0(r.afirmacao.valor)) + ' tCO2e/ano</b><span>' + (r.afirmacao.verdict === 'COMPATÍVEL' ? 'está dentro do intervalo decidido' : 'está ' + esc(r.afirmacao.lado) + ' do intervalo decidido: nenhuma premissa declarada a produz') + (r.afirmacao.classeAfirmada ? '; classe afirmada ' + esc(r.afirmacao.classeAfirmada) + ' → ' + esc(r.classe.porClasse.find((x) => x.classe === r.afirmacao.classeAfirmada).verdict) : '') + '</span></div></li>' : '';
  const esc_ = Object.entries(r.porEscopo).map(([e, v]) => '<tr><td>escopo ' + esc(e) + '</td><td>' + esc(br0(v.lo)) + ' a ' + esc(br0(v.hi)) + '</td></tr>').join('');
  const imp = Object.entries(r.implantacao || {}).map(([k, v]) => '<tr><td>' + esc(k) + ' · fração ' + esc(v.fracao[0]) + '–' + esc(v.fracao[1]) + '</td><td>' + esc(br0(v.lo)) + ' a ' + esc(br0(v.hi)) + '</td></tr>').join('');
  const preco = r.sensibilidade.preco ? '<div class="ab-flip"><div class="ab-k">o que decidiria</div><p>' + esc(r.sensibilidade.preco.texto) + '.</p></div>' : '';
  o.push('<div class="ab-cert"><div class="ab-k">O que o registro decide</div>'
    + '<div class="ab-vline">' + chip(r.verdict, true) + '<span class="ab-means">' + esc(r.verdict === 'PROVADO' ? 'classe ' + r.classe.decidida + ': ' + MEANS.PROVADO : MEANS[r.verdict]) + '</span></div>'
    + '<p class="ab-enc-t">abatimento ∈ [' + esc(br0(r.enclosure[0])) + '; ' + esc(br0(r.enclosure[1])) + '] tCO2e/ano para toda premissa declarada · ' + esc(String(r.cantos)) + ' cantos avaliados em racionais exatos</p>'
    + numberLine(r, classes) + numberLine(r, classes, true)
    + '<ul class="ab-checks">' + cls + claimRow + '</ul>'
    + '<div class="ab-two"><div><div class="ab-k">por escopo</div><table class="ab-mini">' + esc_ + '</table></div>'
    + (imp ? '<div><div class="ab-k">implantação (técnica · acordada)</div><table class="ab-mini">' + imp + '</table></div>' : '') + '</div>'
    + '<div class="ab-k" style="margin-top:14px">de onde vem a largura</div>' + sensBars(r)
    + preco
    + '<div class="ab-k" style="margin-top:14px">testemunhas (cantos que realizam os extremos)</div><p class="ab-wit">mínimo: ' + esc(Object.entries(r.testemunhas.lo.canto).map(([k, s]) => k + '=' + s).join(', ')) + '<br>máximo: ' + esc(Object.entries(r.testemunhas.hi.canto).map(([k, s]) => k + '=' + s).join(', ')) + '</p>'
    + '<div class="ab-run">' + (meta ? esc(meta) : '') + '</div>'
    + '</div>');
  o.push('</div>');
  return o.join('');
}

/* the aggregation audit, one block */
function aggregateHtml(g, agg, titles) {
  const dup = agg.duplaContagem.map((d) => '<li>' + chip('RECUSADO') + '<div><b>dupla contagem</b><span>' + esc(d.texto) + '</span></div></li>').join('');
  const pf = agg.porFonte.map((p) => '<li>' + chip(p.verdict) + '<div><b>fonte ' + esc(p.fonte) + ' · ' + esc(p.ids.join(' + ')) + '</b><span>' + esc(p.texto) + '</span></div></li>').join('');
  return '<div class="ab-agg"><div class="ab-vline">' + chip(agg.verdict, true) + '<span class="ab-means">' + esc(g.titulo) + '</span></div>'
    + '<p class="ab-enc-t">soma ∈ [' + esc(br0(agg.lo)) + '; ' + esc(br0(agg.hi)) + '] tCO2e/ano' + (agg.verdict !== 'PROVADO' ? ' — uma soma que o registro NÃO publica como potencial do portfólio' : '') + '</p>'
    + '<ul class="ab-checks">' + dup + pf + '</ul></div>';
}

/* the diff between two versions */
function diffHtml(d) {
  const rows = d.premissas.map((p) => '<tr><td>' + esc(p.premissa) + '</td><td>' + esc(p.mudanca) + '</td><td>' + (p.antes ? esc(p.antes.join(' – ')) : '—') + '</td><td>' + (p.depois ? esc(p.depois.join(' – ')) : '—') + '</td></tr>').join('');
  return '<div class="ab-diff"><div class="ab-k">v' + esc(d.de) + ' → v' + esc(d.para) + '</div><table class="ab-mini"><tr><th>premissa</th><th>mudança</th><th>antes</th><th>depois</th></tr>' + rows + '</table>'
    + '<p class="ab-enc-t">intervalo: [' + esc(br0(d.envelope.antes[0])) + '; ' + esc(br0(d.envelope.antes[1])) + '] → [' + esc(br0(d.envelope.depois[0])) + '; ' + esc(br0(d.envelope.depois[1])) + '] · largura ' + esc(br0(d.envelope.larguraAntes)) + ' → ' + esc(br0(d.envelope.larguraDepois)) + '</p>'
    + '<p class="ab-enc-t">classe: ' + esc(d.classe.antes || 'não decidida (RECUSADO)') + ' → ' + esc(d.classe.depois || 'não decidida (RECUSADO)') + (d.termosMudaram ? ' · a fórmula mudou' : ' · a fórmula não mudou') + '</p></div>';
}

const api = { receiptHtml, aggregateHtml, diffHtml, numberLine, chip, esc, br0, brk, brd, toF, MEANS };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
