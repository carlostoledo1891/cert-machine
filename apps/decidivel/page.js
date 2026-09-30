/* page.js — /decidivel/: Decidível's product face (pt-BR). Every number from
   numbers.js; the map is the ledger's, re-classified in the reader's tab as the
   threshold and the knowledge scenario move, and any cell can be decided again
   there by the bundled engine. apps/decidivel · cert-machine            MIT */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const { br } = require('./numbers.js');
const esc = C.esc;
const REPO = 'https://github.com/carlostoledo1891/cert-machine';
const chip = (v, big) => '<span class="dv-chip ' + ({ PROVADO: 'p', REFUTADO: 'f', RECUSADO: 'r' }[v] || 'u') + (big ? ' big' : '') + '">' + esc(v || 'NÃO DECIDIDO') + '</span>';

function css() {
  return `
.dv-hero h1{font-size:var(--text-display);max-width:16ch;letter-spacing:-.04em}
.dv-hero .deck{max-width:64ch}
.dv-trio{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:var(--radius-m);overflow:hidden;margin:40px 0 0}
.dv-trio > div{background:var(--sunk);padding:22px 24px;display:flex;flex-direction:column;gap:12px}
.dv-trio p{margin:0;color:var(--ink-3);font-size:var(--text-small);line-height:1.55}
@media (max-width:760px){.dv-trio{grid-template-columns:1fr}}
.dv-chip{display:inline-flex;align-items:center;font-family:var(--f-mono);font-size:.625rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;
  padding:.4em .85em;border-radius:var(--radius-pill);white-space:nowrap;align-self:flex-start;border:1px solid transparent}
.dv-chip.big{font-size:.8125rem;padding:.5em 1.05em}
.dv-chip.p{background:var(--ink);color:var(--paper)}
.dv-chip.f{border-color:var(--ink-2);color:var(--ink)}
.dv-chip.r{border:1px dashed var(--ink-4);color:var(--ink-3)}
.dv-chip.u{border:1px dotted var(--rule-strong);color:var(--ink-5)}
.dv-cta{display:flex;flex-wrap:wrap;gap:12px;margin:32px 0 0}
.dv-cta a{border:1px solid var(--rule-strong);border-radius:var(--radius-pill);padding:10px 18px;font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink)}
.dv-cta a.go{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.dv-k{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-4);margin:0 0 10px}
.dv-arch{display:grid;grid-template-columns:1fr auto 1.5fr auto 1fr;gap:0;align-items:stretch}
.dv-st{background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius-m);padding:18px;display:flex;flex-direction:column;gap:8px}
.dv-st.core{border-color:var(--ink-3);background:var(--surface2)}
.dv-st h3{font-size:1.05rem;margin:0}
.dv-st p,.dv-st li{margin:0;font-size:var(--text-small);line-height:1.5;color:var(--ink-3)}
.dv-st ol{margin:4px 0 0;padding-left:18px}
.dv-ar{display:flex;align-items:center;justify-content:center;padding:0 8px;color:var(--ink-4);font-family:var(--f-mono)}
.dv-ar::before{content:'\\2192'}
@media (max-width:1000px){.dv-arch{grid-template-columns:1fr}.dv-ar{padding:6px 0}.dv-ar::before{content:'\\2193'}}
.dv-rc{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.6fr);gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:var(--radius-m);overflow:hidden}
@media (max-width:760px){.dv-rc{grid-template-columns:1fr}}
.dv-rc > div{background:var(--sunk);padding:22px}
.dv-rc > div.claim{background:var(--paper)}
.dv-story{font-style:italic;color:var(--ink-3);font-size:var(--text-small);line-height:1.55;margin:0 0 14px}
.dv-pred{border:1px dashed var(--ink-5);border-radius:var(--radius-s);padding:12px 14px;font-style:italic;color:var(--ink-3);font-family:var(--f-display);font-size:1.1rem}
ul.dv-checks{list-style:none;padding:0;margin:12px 0 0}
ul.dv-checks li{display:grid;grid-template-columns:118px minmax(0,1fr);gap:12px;padding:10px 0;border-top:1px solid var(--rule);align-items:start}
ul.dv-checks li .dv-chip{justify-self:start}
ul.dv-checks li span{color:var(--ink-3);font-size:var(--text-small);line-height:1.5}
@media (max-width:560px){ul.dv-checks li{grid-template-columns:1fr;gap:6px}}
.dv-env{font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink);margin:12px 0 0}
.dv-mc{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;margin:24px 0 0}
@media (max-width:760px){.dv-mc{grid-template-columns:1fr}}
.dv-mc > div{border:1px solid var(--rule-strong);border-radius:var(--radius-m);padding:20px}
.dv-mc > div.claim{border-style:dashed}
.dv-mc .big{font-family:var(--f-display);font-size:clamp(1.5rem,1.1rem + 1.1vw,2.2rem);color:var(--ink);letter-spacing:-.02em}
.dv-mc > div.claim .big{font-style:italic;color:var(--ink-3)}
.dv-mc p{margin:6px 0 0;color:var(--ink-3);font-size:var(--text-small);line-height:1.55}
/* the map */
.dv-ctl{display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center;margin:0 0 16px}
.dv-ctl fieldset{border:0;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:6px}
.dv-ctl legend{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-4);margin-bottom:6px;padding:0}
.dv-ctl label.sc{font-size:var(--text-small);border:1px solid var(--rule);border-radius:var(--radius-pill);padding:6px 12px;cursor:pointer;color:var(--ink-3);background:var(--surface)}
.dv-ctl input[type=radio]{position:absolute;opacity:0;width:1px;height:1px}
.dv-ctl input[type=radio]:checked + label.sc{border-color:var(--ink-3);color:var(--ink);background:var(--surface2)}
.dv-ctl input[type=radio]:focus-visible + label.sc{outline:2px solid var(--ink);outline-offset:2px}
.dv-th{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink-2);max-width:100%}
.dv-th input{width:220px;max-width:100%;accent-color:var(--ink-3)}
.dv-th b{color:var(--ink);font-weight:600;min-width:4.5em}
.dv-mapbox{overflow-x:auto}
svg.dv-map{display:block;width:100%;height:auto;min-width:640px}
.dv-map text{font-family:var(--f-mono);font-size:11px;fill:var(--ink-3)}
.dv-map .ax{stroke:var(--c-axis);stroke-width:1}
.dv-map g.c{cursor:pointer}
.dv-map g.c .bg{fill:var(--sunk);stroke:var(--rule);stroke-width:1}
.dv-map g.c .full{fill:var(--ink);opacity:0}
.dv-map g.c .tri{fill:var(--ink-3);opacity:0}
.dv-map g.c .ring{fill:none;stroke:var(--ink-4);stroke-width:1;opacity:0}
.dv-map g.c.v-P .full{opacity:1}
.dv-map g.c.v-R .tri{opacity:1}
.dv-map g.c.v-F .ring{opacity:1}
.dv-map g.c.on .bg{stroke:var(--ink);stroke-width:2}
.dv-map g.c:focus{outline:none}
.dv-map g.c:focus-visible .bg{stroke:var(--ink);stroke-width:2}
.dv-key{display:flex;flex-wrap:wrap;gap:8px 20px;margin:12px 0 0;font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-3);letter-spacing:.04em}
.dv-key svg{width:14px;height:14px;vertical-align:-3px;margin-right:6px}
.dv-key .full{fill:var(--ink)}
.dv-key .tri{fill:var(--ink-3)}
.dv-key .bg{fill:var(--sunk);stroke:var(--rule);stroke-width:1}
.dv-key .ring{fill:none;stroke:var(--ink-4);stroke-width:1}
.dv-cell{margin:16px 0 0;border:1px solid var(--rule-strong);border-radius:var(--radius-m);padding:16px 18px;font-size:var(--text-small);color:var(--ink-2);line-height:1.6}
.dv-cell button{font:inherit;font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:.06em;cursor:pointer;background:var(--ink);color:var(--paper);border:0;border-radius:var(--radius-pill);padding:7px 14px;margin-top:10px}
.dv-field{margin:24px 0 0}
.dv-bar{display:flex;height:28px;border-radius:var(--radius-s);overflow:hidden;border:1px solid var(--rule-strong);margin:8px 0}
.dv-bar span{display:block;height:100%}
.dv-bar .p{background:var(--ink)}
.dv-bar .r{background:repeating-linear-gradient(135deg,var(--ink-4) 0 3px,var(--sunk) 3px 7px)}
.dv-bar .f{background:var(--surface2)}
.dv-bar .u{background:var(--paper)}
.dv-fl{display:flex;flex-wrap:wrap;gap:6px 18px;font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-3)}
.dv-fl b{color:var(--ink);font-weight:600}
.dv-row{font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink-2)}
.dv-row select{font:inherit;background:var(--sunk);color:var(--ink);border:1px solid var(--rule-strong);border-radius:var(--radius-s);padding:4px 8px}
.dv-ask{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
@media (max-width:760px){.dv-ask{grid-template-columns:1fr}}
.dv-ask > div{border:1px solid var(--rule-strong);border-radius:var(--radius-m);padding:22px}
.dv-ask ul{margin:0;padding-left:18px;color:var(--ink-2);font-size:var(--text-small);line-height:1.6}
.dv-sub{margin-top:56px}
.dv-cites li{margin:0 0 10px}
`;
}

function mapSvg(N, k, th) {
  const L = N.L, nx = L.axes.phi.length, ny = L.axes.sg.length;
  const cw = 22, ch = 20, ml = 52, mb = 40, mt = 10, W = ml + nx * cw + 26, H = mt + ny * ch + mb;
  const o = ['<svg class="dv-map" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Mapa de decidibilidade: porosidade no eixo horizontal, saturação de gás no vertical; cada célula PROVADO, REFUTADO, RECUSADO ou não decidido.">'];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const idx = j * nx + i, x = ml + i * cw, y = mt + (ny - 1 - j) * ch;
    const v = N.cls(L.maps[k][idx], th);
    o.push('<g class="c v-' + ({ PROVADO: 'P', REFUTADO: 'F', RECUSADO: 'R' }[v] || 'U') + '" data-i="' + idx + '" tabindex="0" role="button" aria-label="φ ' + L.axes.phi[i].join('–') + ', Sg ' + L.axes.sg[j].join('–') + '">'
      + '<rect class="bg" x="' + (x + 1) + '" y="' + (y + 1) + '" width="' + (cw - 2) + '" height="' + (ch - 2) + '" rx="2"/>'
      + '<rect class="full" x="' + (x + 2) + '" y="' + (y + 2) + '" width="' + (cw - 4) + '" height="' + (ch - 4) + '" rx="1.5"/>'
      + '<path class="tri" d="M' + (x + 2) + ' ' + (y + ch - 2) + 'L' + (x + cw - 2) + ' ' + (y + 2) + 'L' + (x + cw - 2) + ' ' + (y + ch - 2) + 'Z"/>'
      + '<rect class="ring" x="' + (x + 6) + '" y="' + (y + 5) + '" width="' + (cw - 12) + '" height="' + (ch - 10) + '" rx="1"/>'
      + '</g>');
  }
  o.push('<line class="ax" x1="' + ml + '" y1="' + (mt + ny * ch + 2) + '" x2="' + (ml + nx * cw) + '" y2="' + (mt + ny * ch + 2) + '"/>');
  for (let i = 0; i <= nx; i += 5) o.push('<text x="' + (ml + i * cw) + '" y="' + (mt + ny * ch + 18) + '" text-anchor="middle">' + br.dec(i / 100, 2) + '</text>');
  o.push('<text x="' + (ml + nx * cw / 2) + '" y="' + (H - 4) + '" text-anchor="middle">porosidade φ</text>');
  for (let j = 0; j <= ny; j += 3) o.push('<text x="' + (ml - 8) + '" y="' + (mt + (ny - j) * ch + 4) + '" text-anchor="end">' + br.dec(j * 0.04, 2) + '</text>');
  o.push('<text x="12" y="' + (mt + ny * ch / 2) + '" text-anchor="middle" transform="rotate(-90 12 ' + (mt + ny * ch / 2) + ')">Sg injetado</text>');
  o.push('</svg>');
  return o.join('');
}

function build(N, bundleText, git) {
  const L = N.L, D = N.D, H = N.H, rc = H.receipt, th = N.theta;
  const scen = L.scenarios;
  const B = [];
  const w = (x) => br.dec(x, 2) + '%';
  const w1 = (x) => br.dec(x, 1) + '%';
  const GL = { PROVADO: 'DETECTÁVEL — garantido para todo cenário admissível', REFUTADO: 'INDETECTÁVEL — garantido: nenhum levantamento nesta resolução vê', RECUSADO: 'INDETERMINADO — contraexemplos dos dois lados e a medição que decide' };
  const gl = (v) => chip(v, true) + '<p class="dv-k">' + esc(GL[v]) + '</p>';
  const NOTA = '/decidivel/nota-tecnica-exemplo.pdf', DECK = '/decidivel/decidivel-apresentacao.pdf';
  const REF = {
    mero: 'https://agenciabrasil.ebc.com.br/economia/noticia/2026-04/petrobras-investe-em-monitoramento-sismico-em-subsolo-marinho',
    buzios: 'https://agencia.petrobras.com.br/w/negocio/campo-de-buzios-inicia-novo-levantamento-sismico',
    tupi: 'https://sbgf.org.br/mysbgf/eventos/expanded_abstracts/17th_CISBGf/175420210615233804FINAL_ENVIADO_SBGF_2.pdf',
    tle: 'https://pubs.geoscienceworld.org/seg/tle/article-abstract/40/12/886/609992/',
    pxgeo: 'https://www.bairdmaritime.com/offshore/exploration-development/subsea-surveying/pxgeo-secures-two-obn-seismic-acquisition-contracts-with-petrobras',
    lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14993.htm',
    decreto: 'http://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/d13095.htm',
    f20: 'https://www.sec.gov/Archives/edgar/data/1119639/000129281426002168/pbrform20f_2025.htm',
    conexoes: 'https://mercadoeconsumo.com.br/04/07/2022/economia/petrobras-lanca-oportunidades-para-aquisicao-de-solucoes-inovadoras/',
    unisim: 'https://www.unisim.cepetro.unicamp.br/benchmarks/en/unisim-iv/unisim-iv-2026',
    quadros: 'https://doi.org/10.1038/s41598-025-11646-y',
    doi: 'https://doi.org/10.5281/zenodo.22800699'
  };
  const a = (k, t) => '<a href="' + REF[k] + '">' + esc(t) + '</a>';

  /* ---- the numbers the sections quote ---- */
  const A = H.attributes, MC = H.mc15, CR = H.correlated, PR = H.price;
  const res15 = { K0: N.resolution('K0', 1.5), K1: N.resolution('K1', 1.5), K4: N.resolution('K4', 1.5) };
  const res3 = { K0: N.resolution('K0', 3), K1: N.resolution('K1', 3), K4: N.resolution('K4', 3) };
  const thin0 = res15.K0[0], thin4 = res15.K4[0];
  const detK4 = res15.K4.map((r) => r.PROVADO).reduce((x, y) => Math.max(x, y), 0);
  const detRow = res15.K4.reduce((m, r) => (r.PROVADO > (m ? m.PROVADO : 0) ? r : m), null);
  const firstDet = detRow ? N.first('K4', 1.5, L.axes.sg.indexOf(detRow.sg), 'PROVADO') : null;
  const firstRef = N.first('K0', 1.5, 0, 'REFUTADO');
  const k1at3 = res3.K1;
  const sgUpTo = (rows) => { let last = null; for (const r of rows) { if (r.REFUTADO > r.RECUSADO + r.PROVADO + r.open) last = r.sg[1]; else break; } return last; };
  const refUpK1 = sgUpTo(k1at3), refUpK0 = sgUpTo(res3.K0);
  const und = rc.witnesses.und, det = rc.witnesses.det;
  const undPct = und ? R_pct(und.r) : null, detPct = det ? R_pct(det.r) : null;
  function R_pct(r) { return (Math.sqrt(r[0]) - 1) * 100; }
  const signH = N.signAt(L.axes.sg.findIndex((s) => s[0] === '0.16'), L.axes.phi.findIndex((p) => p[0] === '0.13'));
  const priceDecides = (list) => list.filter((x) => x.slices);
  const cellsTot = br.int(N.active);

  /* 0 · header */
  B.push('<header class="col dv-hero">'
    + '<div class="eyebrow">Decidível · Geofísica e Petrofísica · estudo de viabilidade 4D · WAG-CO₂ · portfólios de Reservatórios e CCUS</div>'
    + '<h1>Desafio: decidir, antes de adquirir, se um levantamento 4D pode ver a injeção de gás ou CO₂ no pré-sal.</h1>'
    + '<p class="deck">O estudo de viabilidade 4D de hoje entrega um número por cenário ou uma probabilidade de detecção. O Decidível acrescenta o que falta ao suporte à decisão go/no-go de aquisição: sobre o <b>envelope de incerteza declarado</b> (faixas de parâmetros com fonte) e o modelo petroelástico padrão, calcula por <b>aritmética intervalar rigorosa</b> o mínimo e o máximo garantidos de ΔIp/Ip por célula — a <b>garantia de pior caso</b> — e devolve um de três vereditos na resolução do levantamento, com um <b>contraexemplo</b> de cada lado quando a evidência não decide e a medição que decide.</p>'
    + '<div class="dv-trio">'
    + '<div>' + gl('PROVADO') + '<p>Todo cenário dentro do envelope declarado muda a impedância além da resolução do levantamento.</p></div>'
    + '<div>' + gl('REFUTADO') + '<p>Nenhum cenário do envelope chega à resolução: o levantamento não pode responder à pergunta. Não adquira para esta pergunta.</p></div>'
    + '<div>' + gl('RECUSADO') + '<p>Há cenários admissíveis dos dois lados, cada um verificado; o certificado publica o requisito de resolução e o plano de redução de incerteza.</p></div>'
    + '</div>'
    + '<div class="dv-cta"><a class="go" href="#demonstracao">A demonstração ↓</a><a href="' + NOTA + '">Nota Técnica de exemplo (PDF)</a><a href="' + DECK + '">Apresentação (PDF)</a><a href="#plano">Plano de trabalho</a></div>'
    + '</header>');

  B.push(C.stats([
    { k: 'custo em jogo', v: 'US$ 450 mi', n: 'o monitoramento sísmico 4D permanente de Mero, Consórcio de Libra, abril de 2026 (Agência Brasil); Búzios: 3.500 nós OBN em 780 km², oito meses (Petrobras, 2024)' },
    { k: 'resolução real', v: '1,5%', n: 'variações de impedância acústica distinguíveis no piloto OBN de Tupi, com NRMS de 2 a 3% (Cruz et al. 2021)' },
    { k: 'a 1,5%, no análogo', v: br.int(thin0.REFUTADO) + ' · ' + br.int(detK4), n: 'células INDETECTÁVEIS com uma frente fina (Sg < 4%) só com a faixa física; células DETECTÁVEIS com frente de 44–48%, gás pobre, uniforme, arcabouço medido — de ' + cellsTot },
    { k: 'o que o Monte Carlo diria', v: br.pct(100 * MC.K4[1].pDetect, 1), n: 'dos ' + br.int(MC.K4[1].draws) + ' sorteios na mesma célula detectam a 1,5%; existe um cenário admissível, com valor garantido, que muda ' + w(H.table[4].range[1]) }
  ]));

  /* 1 · the problem in numbers */
  B.push(C.section({ lab: '1 · o problema em números', title: 'Um 4D OBN no pré-sal custa centenas de milhões; a 1,5% de impedância, Tupi já mostrou que o sinal pode sumir.',
    bodyRaw: '<div class="col">'
      + C.pRaw('O Consórcio de Libra anunciou em abril de 2026 cerca de ' + a('mero', 'US$ 450 milhões (R$ 2,2 bilhões) no monitoramento sísmico 4D permanente de Mero') + '. Em Búzios, a segunda aquisição OBN do campo, a primeira para 4D, depositou ' + a('buzios', '3.500 nós em 780 km² durante oito meses') + ' (2024). A PXGEO recebeu dois contratos de aquisição e monitoramento OBN 4C de consórcios liderados pela Petrobras para 2026 (' + a('pxgeo', 'Baird Maritime, novembro de 2025') + '). Cada campanha responde a uma pergunta de gerenciamento de reservatórios: onde a frente de gás do WAG-CO₂ chegou, onde a água avançou, onde ficou óleo.')
      + C.pRaw('No piloto OBN de Tupi (' + a('tupi', 'Cruz et al. 2021, SBGf') + '; ' + a('tle', 'The Leading Edge 40(12):886') + '): NRMS médio de cerca de 3% no processamento 4D padrão e de cerca de 2% com migração por mínimos quadrados; variações de impedância acústica de aproximadamente <b>1,5%</b> distinguíveis além da vizinhança dos poços; em torno de WAG1, variação <b>abaixo dos 2% inicialmente considerados o corte</b> para o pré-sal. A modelagem petroelástica que considera só os efeitos de saturação <b>superestima</b> as amplitudes e impedâncias 4D; quanto maior o teor de CO₂ no gás injetado (cerca de 80% no gás rico, cerca de 5% no pobre), <b>menor o contraste</b> de impedância com o óleo ou a água. Os modelos publicados antes do piloto previam variações em torno de 2% para a maioria dos casos (Costa et al. 2019).')
      + C.pRaw('Ou seja: no pré-sal, a resolução que o levantamento alcança e a variação que a rocha produz são do mesmo tamanho. A pergunta de viabilidade não é “qual a probabilidade de detectar”, é: <b>para todo cenário compatível com a evidência, este levantamento vê a injeção?</b> E quando não vê, <b>que medição decide, antes da aquisição?</b>')
      + '</div>' }));

  /* 2 · what Petrobras does today, and what is added */
  B.push(C.section({ lab: '2 · o que a Petrobras já faz, e o que acrescenta', title: 'O estudo de viabilidade atual entrega um número por cenário ou uma probabilidade; o Decidível acrescenta o envelope garantido e o contraexemplo.',
    bodyRaw: '<div class="col">' + C.p('Nada é substituído: o estudo de viabilidade continua a ser feito como hoje, e o Decidível entra como anexo. Cada linha diz o que o fluxo atual entrega e o que o anexo acrescenta.') + '</div>'
      + C.table({ cols: [{ h: 'hoje' }, { h: 'entrega' }, { h: 'o que o Decidível acrescenta' }], rows: [
        ['Modelagem petroelástica (Gassmann, cenários P10/P50/P90)', 'um ΔIp/Ip por cenário', 'o mínimo e o máximo garantidos de ΔIp/Ip sobre o envelope inteiro, com arredondamento para fora'],
        ['Monte Carlo, probabilidade de detecção', '“detectável em 97% dos sorteios”', 'o cenário admissível que os sorteios não amostraram, com valor garantido, e a fração do envelope que não detecta'],
        ['Regra de NRMS / repetibilidade', 'um limiar único', 'o requisito de resolução do levantamento, célula a célula, como especificação de aquisição'],
        ['Valor da informação (VOI) em esperança', 'quanto vale medir, em média', 'o plano de redução de incerteza deste caso: a medição que decide, na ordem do custo'],
        ['Inversão bayesiana / quantificação de incerteza', 'uma distribuição condicionada ao prior', 'o conjunto admissível inteiro, sem prior; o contraexemplo é um modelo, não um percentil'],
        ['Interpretação 4D pós-aquisição', 'endurecimento ou amolecimento lidos por experiência', 'a densidade de gás acima da qual o sinal do ΔIp deixa de ser garantido por célula']
      ] })
      + '<div class="col"><p class="scope"><b>Glossário.</b> Envelope declarado (nas páginas do motor, “caixa”): as faixas de parâmetros com fonte que a evidência admite. Contraexemplos (“testemunhas”): um cenário verificado de cada lado do limiar. Certificado de decisão (“recibo”): a Nota Técnica de uma página, reexecutável sem o nosso código. Casos de controle negativos (“controles vermelhos”): erros plantados que cada build precisa recusar. Os selos PROVADO, REFUTADO e RECUSADO leem-se DETECTÁVEL, INDETECTÁVEL e INDETERMINADO.</p></div>' }));

  /* 3 · how it decides */
  const hb = H.box;
  const hand = (() => {
    /* a hand-recomputable example: the undetectable counterexample of the headline cell, point by point */
    const p = {}; for (const k of Object.keys(und.at)) p[k] = und.at[k][0];
    const so1 = 1 - p.Swi, K1 = 1 / (p.Swi / p.Kw + so1 / p.Ko);
    const so2 = 1 - p.Swi - p.dSg, L2 = (p.Swi + so2) / (p.Swi / p.Kw + so2 / p.Ko), sl = 1 - p.dSg;
    const Re = 1 / (sl / L2 + p.dSg / p.Kg), Vo = sl * L2 + p.dSg * p.Kg, K2 = Re + p.w * (Vo - Re);
    const kr = p.s * (1 - p.phi / p.phic), Kdry = kr * p.Kmin, Gdry = p.gk * Kdry;
    const Ks = (K) => Kdry + (1 - kr) ** 2 / (p.phi / K + (1 - p.phi - kr) / p.Kmin);
    const rho1 = (1 - p.phi) * p.rhomin + p.phi * (p.Swi * p.rhow + so1 * p.rhoo), rho2 = rho1 + p.phi * p.dSg * (p.rhog - p.rhoo);
    const M1 = Ks(K1) + 4 / 3 * Gdry, M2 = Ks(K2) + 4 / 3 * Gdry;
    const Ip1 = Math.sqrt(rho1 * M1), Ip2 = Math.sqrt(rho2 * M2);
    const f = (x, d) => br.dec(x, d);
    return { p, rows: [
      ['fluido antes (Reuss água–óleo)', 'K₁ = 1 / (Swi/Kw + So/Ko)', f(K1, 3) + ' GPa'],
      ['líquido depois (a água ocupa fração maior)', 'L₂ = (Swi + So₂) / (Swi/Kw + So₂/Ko)', f(L2, 3) + ' GPa'],
      ['fluido depois, mistura w entre Reuss e Voigt', 'K₂ = R + w·(V − R)', f(K2, 3) + ' GPa (w = ' + f(p.w, 2) + ')'],
      ['arcabouço seco na tendência de porosidade crítica', 'Kdry = s·(1 − φ/φc)·Kmin; Gdry = (G/K)·Kdry', f(Kdry, 2) + ' · ' + f(Gdry, 2) + ' GPa'],
      ['Gassmann, antes e depois', 'Ksat = Kdry + (1 − Kdry/Kmin)² / (φ/Kfl + (1 − φ)/Kmin − Kdry/Kmin²)', f(Ks(K1), 3) + ' → ' + f(Ks(K2), 3) + ' GPa'],
      ['densidade', 'ρ = (1 − φ)ρmin + φ·Σ Sᵢρᵢ', f(rho1, 4) + ' → ' + f(rho2, 4) + ' g/cm³'],
      ['impedância', 'Ip = √(ρ·(Ksat + 4G/3))', f(Ip1, 3) + ' → ' + f(Ip2, 3)],
      ['a mudança', 'ΔIp/Ip = Ip₂/Ip₁ − 1', '<b>' + br.pct(100 * (Ip2 / Ip1 - 1), 2) + '</b>']
    ] };
  })();
  B.push(C.section({ lab: '3 · como decide', title: 'Modelo petroelástico declarado com fonte; limites garantidos por aritmética intervalar; contraexemplos verificados.',
    bodyRaw: '<div class="wide"><div class="dv-arch">'
      + '<div class="dv-st"><div class="dv-k">envelope declarado</div><h3>Faixas, com fonte por parâmetro</h3><p>Porosidade e saturação de gás da célula; arcabouço seco de nove plugues de Iracema (Quadros et al. 2025) na tendência de porosidade crítica; salmoura e óleo vivo por Batzle–Wang; gás de metano a CO₂ puro pelo NIST; a mistura de fluidos de Reuss a Voigt (toda lei de Brie); Swi e Sorg do UNISIM-IV.</p></div><div class="dv-ar" aria-hidden="true"></div>'
      + '<div class="dv-st core"><div class="dv-k">o método</div><h3>Garantia de pior caso sobre o envelope inteiro</h3><ol>'
      + '<li><b>Modelo petroelástico</b>: Gassmann; mistura de fluidos Reuss–Brie–Voigt; arcabouço seco Kdry = s·(1 − φ/φc)·Kmin. O veredito fala deste modelo e deste envelope.</li>'
      + '<li><b>Limites garantidos</b>: aritmética intervalar com arredondamento para fora; derivadas intervalares; ramificação e poda; cada parâmetro de efeito provadamente monótono fixado no extremo.</li>'
      + '<li><b>Contraexemplos</b>: um cenário-limite verificado de cada lado do limiar, com o valor garantido, e a medição que o elimina.</li></ol></div><div class="dv-ar" aria-hidden="true"></div>'
      + '<div class="dv-st"><div class="dv-k">o que sai</div><h3>Certificado de decisão</h3><p>' + chip('PROVADO') + ' ' + chip('REFUTADO') + ' ' + chip('RECUSADO') + '</p><p>ΔIp/Ip, ΔIs/Is e ΔVp/Vs garantidos; o requisito de resolução; o plano de redução de incerteza; a reprodução. Uma página (<a href="' + NOTA + '">exemplo em PDF</a>).</p></div>'
      + '</div></div>'
      + '<div class="col">' + C.pRaw('<b>Verificação.</b> Uma segunda implementação em Python (módulo decimal, 50 dígitos, a forma de livro-texto, sem código em comum) confere o motor em ' + esc(N.battery.split('referência em Python em ')[1] || '') + ' de entrada; ' + esc(N.battery.split(', ')[1]) + ' a cada build. Cada célula do mapa pode ser decidida de novo no navegador.')
      + C.pRaw('<b>Fora desta versão, dito aqui e não no rodapé.</b> O efeito de pressão (o módulo do arcabouço versus a tensão efetiva) entra na Fase 1 com plugues sob tensão da Petrobras; até lá, nos injetores, a saturação sozinha superestima o sinal, como Tupi registrou. Espessura e sintonia: o veredito é da etapa petroelástica (detectabilidade de célula), não da resposta sísmica convolvida; a espessura entra como faixa adicional em E5. Frequência e dissolução em carbonato: hipóteses de Gassmann, do modelo.')
      + '</div>'
      + '<div class="col dv-sub sec-head"><h3>Um contraexemplo recalculável à mão</h3></div>'
      + '<div class="col">' + C.p('O cenário indetectável da célula de coquina (φ = ' + br.dec(hand.p.phi, 2) + ', s = ' + br.dec(hand.p.s, 2) + ', G/K = ' + br.dec(hand.p.gk, 2) + ', Kmin = ' + br.dec(hand.p.Kmin, 0) + ' GPa, Sg = ' + br.dec(hand.p.dSg, 2) + ', w = ' + br.dec(hand.p.w, 0) + ', Kgás = ' + br.dec(hand.p.Kg, 2) + ' GPa, ρgás = ' + br.dec(hand.p.rhog, 2) + ' g/cm³, Ko = ' + br.dec(hand.p.Ko, 2) + ', ρo = ' + br.dec(hand.p.rhoo, 2) + ', Kw = ' + br.dec(hand.p.Kw, 1) + ', ρw = ' + br.dec(hand.p.rhow, 2) + ', ρmin = ' + br.dec(hand.p.rhomin, 2) + ', Swi = ' + br.dec(hand.p.Swi, 2) + '), linha a linha. Um geofísico refaz numa planilha; o motor garante o mesmo valor com intervalo.') + '</div>'
      + C.table({ cols: [{ h: 'passo' }, { h: 'fórmula' }, { h: 'valor' }], rows: hand.rows.map((r) => [r[0], { raw: '<code>' + esc(r[1]) + '</code>' }, { raw: r[2] }]) }) }));

  /* 4 · demonstration */
  const rowsTab = L.axes.sg.map((sg, j) => {
    const cell = (r) => { const parts = []; if (r.PROVADO) parts.push('<b>DET ' + br.int(r.PROVADO) + '</b>'); if (r.REFUTADO) parts.push('IND<sub>ect</sub> ' + br.int(r.REFUTADO)); if (r.RECUSADO) parts.push('<span class="scope">indet. ' + br.int(r.RECUSADO) + '</span>'); if (r.open) parts.push('<span class="scope">n.d. ' + br.int(r.open) + '</span>'); return { raw: parts.join(' · ') }; };
    return ['Sg ' + br.dec(Number(sg[0]) < 0.01 ? 0 : Number(sg[0]), 2) + '–' + br.dec(Number(sg[1]), 2), cell(res15.K0[j]), cell(res15.K4[j]), cell(res3.K1[j]), cell(res3.K4[j])];
  });
  const c1 = rc.checks.find((c) => c.id === 'deteccao');
  const tab = H.table.map((t) => {
    const s = D.scenarios[t.k], v = t.range;
    return [s.label, s.note, { raw: chip(t.verdict) }, w(v[0]) + ' – ' + w(v[3]), v[0] > 0 ? 'resolver ' + w(v[0]) + ' → DETECTÁVEL' : 'nenhuma resolução: há cenário sem mudança'];
  });
  const corrRows = [['Só a faixa física, arcabouço correlacionado (9 plugues)', 'a rigidez s e a razão G/K confinadas à envoltória convexa dos plugues (' + CR.K0.boxes + ' caixas)', { raw: chip(CR.K0.verdict) }, w(CR.K0.range[0]) + ' – ' + w(CR.K0.range[3]), CR.K0.range[0] > 0 ? 'resolver ' + w(CR.K0.range[0]) + ' → DETECTÁVEL' : 'nenhuma resolução: há cenário sem mudança'],
    ['Gás pobre, uniforme, arcabouço correlacionado', 'idem, com a composição medida e w ≤ 0,25', { raw: chip(CR.K3.verdict) }, w(CR.K3.range[0]) + ' – ' + w(CR.K3.range[3]), CR.K3.range[0] > 0 ? 'resolver ' + w(CR.K3.range[0]) + ' → DETECTÁVEL' : '—']];
  const attrRows = ['K0', 'K4'].map((k) => [D.scenarios[k].label, w(A[k].Ip[0]) + ' – ' + w(A[k].Ip[3]), w(A[k].Is[0]) + ' – ' + w(A[k].Is[3]), w(A[k].VpVs[0]) + ' – ' + w(A[k].VpVs[3])]);
  const scenRadios = scen.map((k, i) => '<input type="radio" name="dvk" id="dvk-' + k + '" value="' + k + '"' + (i === 0 ? ' checked' : '') + '><label class="sc" for="dvk-' + k + '">' + esc(D.scenarios[k].label) + '</label>').join('');
  const rows = L.axes.sg.map((s, j) => '<option value="' + j + '"' + (j === 5 ? ' selected' : '') + '>Sg ' + br.dec(Number(s[0]) < 0.01 ? 0 : Number(s[0]), 2) + '–' + br.dec(Number(s[1]), 2) + '</option>').join('');
  const p0 = PR.K0, p4 = PR.K4, dec0 = priceDecides(p0), dec4 = priceDecides(p4);
  B.push('<section id="demonstracao"><div class="col sec-head"><div class="lab">4 · demonstração</div><h2>A 1,5%, o análogo do pré-sal tem ' + br.int(detK4) + ' células DETECTÁVEIS, ' + br.int(thin0.REFUTADO) + ' INDETECTÁVEIS e ' + br.int(res15.K0[5].RECUSADO) + ' INDETERMINADAS — em frentes de gás diferentes.</h2></div>'
    + '<div class="col">' + C.pRaw('O análogo é o benchmark público ' + a('unisim', 'UNISIM-IV-2026') + ' (UNICAMP, ODbL): ' + cellsTot + ' células ativas, cada uma na coluna da sua porosidade, com o gás injetado a 44% de CO₂, Swi = 0,18 e Sorg = 0,35. Cada célula é uma caixa decidida por inteiro (faixa de porosidade × faixa de saturação de gás × todas as faixas declaradas). A tabela responde, por saturação da frente de gás, quanto do campo é decidido em cada estado de conhecimento e resolução. DET: DETECTÁVEL; IND<sub>ect</sub>: INDETECTÁVEL; indet.: INDETERMINADO (contraexemplos dos dois lados); n.d.: não decidido neste orçamento de cálculo.') + '</div>'
    + '<div class="wide">' + C.table({ cols: [{ h: 'frente de gás' }, { h: 'faixa física · 1,5%' }, { h: 'gás pobre, uniforme, medido · 1,5%' }, { h: 'gás rico em CO₂ · 3%' }, { h: 'gás pobre, uniforme, medido · 3%' }], rows: rowsTab }) + '</div>'
    + '<div class="col">' + C.pRaw('<b>Três leituras.</b> (1) Uma frente fina, abaixo de 4% de saturação, é <b>INDETECTÁVEL a 1,5% em ' + br.int(thin0.REFUTADO) + ' células só com a faixa física</b> e em ' + br.int(thin4.REFUTADO) + ' com o gás medido: o veredito “não adquira para esta pergunta” existe, com prova — ' + (firstRef ? 'a primeira célula, φ ' + firstRef.phi.join('–') + ', tem mudança garantida ≤ ' + w(firstRef.v[3]) : '') + '. (2) Entre 4% e 28% de saturação, o campo inteiro é <b>INDETERMINADO a 1,5% em todos os estados</b>: é a faixa em que Tupi operou, e o certificado devolve, por célula, a resolução que decide. (3) Com frente de 44–48%, gás pobre, uniforme e arcabouço medido, <b>' + br.int(detK4) + ' células são DETECTÁVEIS a 1,5%</b>' + (firstDet ? ' a partir de φ ' + firstDet.phi.join('–') : '') + '. A 3% com gás rico em CO₂, a frente é INDETECTÁVEL na maior parte do campo até ' + (refUpK1 ? br.dec(Number(refUpK1) * 100, 0) + '%' : '—') + ' de saturação: a resolução do processamento padrão não responde à pergunta do WAG-CO₂.')
    + '</div>'

    + '<div class="col dv-sub sec-head"><h3>O mapa de detectabilidade garantida por célula</h3></div>'
    + '<div class="col">' + C.p('Mova o requisito de resolução do levantamento e o estado de conhecimento; o mapa se reclassifica a partir dos números garantidos do registro. Toque numa célula para ver os quatro números, e decida-a de novo no seu navegador.') + '</div>'
    + '<div class="wide"><div class="dv-ctl"><fieldset><legend>o que se sabe</legend>' + scenRadios + '</fieldset>'
    + '<label class="dv-th" for="dv-th">resolução do levantamento <input type="range" id="dv-th" min="0.25" max="5" step="0.25" value="' + th + '"><b id="dv-thv">' + w(th) + '</b></label></div>'
    + '<div class="figbox dv-mapbox">' + mapSvg(N, scen[0], th) + '</div>'
    + '<div class="dv-key"><span><svg viewBox="0 0 14 14"><rect class="full" x="1" y="1" width="12" height="12" rx="2"/></svg>PROVADO · detectável</span><span><svg viewBox="0 0 14 14"><rect class="bg" x="0.5" y="0.5" width="13" height="13" rx="2"/><path class="tri" d="M1 13L13 1L13 13Z"/></svg>RECUSADO · indeterminado</span><span><svg viewBox="0 0 14 14"><rect class="bg" x="0.5" y="0.5" width="13" height="13" rx="2"/><rect class="ring" x="4" y="4" width="6" height="6" rx="1"/></svg>REFUTADO · indetectável</span><span><svg viewBox="0 0 14 14"><rect class="bg" x="0.5" y="0.5" width="13" height="13" rx="2"/></svg>não decidido neste orçamento</span></div>'
    + '<div class="dv-cell" id="dv-cell" aria-live="polite">Toque numa célula.</div>'
    + '<div class="dv-field"><div class="dv-row"><label for="dv-row">O campo inteiro, se a frente de gás chegar a </label><select id="dv-row">' + rows + '</select></div>'
    + '<div class="dv-bar" id="dv-bar" role="img" aria-label="Células do benchmark por veredito"></div><div class="dv-fl" id="dv-fl"></div>'
    + '<p class="dv-story">As ' + cellsTot + ' células ativas do UNISIM-IV (' + Object.entries(N.rockCounts).filter(([, v]) => v > 100).map(([k, v]) => br.int(v) + ' de ' + k).join(', ') + '). Benchmark UNISIM-IV-2026 (UNICAMP), ODbL.</p></div>'
    + '</div>'

    + '<div class="col dv-sub sec-head"><h3>Uma célula, decidida: coquina, frente de gás WAG, o limite de Tupi</h3></div>'
    + '<div class="wide"><div class="dv-rc"><div class="claim"><div class="dv-k">a pergunta</div><p class="dv-story">Uma célula de coquina na porosidade mediana do benchmark (φ entre 0,13 e 0,15), a frente de gás de um ciclo WAG entre 15% e 30% de saturação, e o limite de detecção do piloto de Tupi, 1,5% de impedância.</p>'
    + '<div class="dv-pred">Um levantamento 4D que resolve 1,5% vê a injeção, para todo cenário do envelope declarado?</div></div>'
    + '<div><div class="dv-k">o que o Decidível decide</div>' + chip(rc.verdict, true)
    + '<p class="dv-env">ΔIp/Ip garantido em [' + w(rc.envelope[0]) + '; ' + w(rc.envelope[1]) + '] para todo cenário admissível</p>'
    + '<ul class="dv-checks">' + rc.checks.map((c) => '<li>' + chip(c.verdict) + '<span>' + esc(c.text.replace('testemunhas', 'contraexemplos').replace('A caixa contém modelos', 'O envelope contém cenários')) + '</span></li>').join('') + '</ul>'
    + '<p class="dv-story"><a href="' + NOTA + '">Nota Técnica desta célula (PDF, uma página)</a></p></div></div></div>'
    + '<div class="col">' + C.p('A mesma célula, com o que se passa a saber. Cada linha é um envelope decidido por inteiro; a última coluna é o requisito de resolução que tornaria a resposta DETECTÁVEL.') + '</div>'
    + C.table({ cols: [{ h: 'estado de conhecimento' }, { h: 'como' }, { h: 'a 1,5%' }, { h: 'mudança garantida' }, { h: 'o que decide' }], rows: tab.concat(corrRows) })
    + '<div class="col">' + C.pRaw('<b>Caixas correlacionadas.</b> A rigidez do arcabouço e a razão G/K não são independentes: os nove plugues de Iracema ocupam uma envoltória convexa dentro do retângulo declarado, e o motor decide a união das caixas que a cobrem. A correlação aperta os limites (o máximo garantido só com a faixa física cai de ' + w(H.table[0].range[3]) + ' para ' + w(CR.K0.range[3]) + '; com o gás pobre e uniforme, a menor mudança atingida sobe de ' + w(H.table[3].range[1]) + ' para ' + w(CR.K3.range[1]) + '), não o veredito a 1,5%. Correlacionar a composição do gás com (K, ρ) também não o muda: o cenário indetectável está no ponto do CO₂ puro, que toda curva de composição contém. A saturação de gás por célula e por tempo do simulador é o insumo da Fase 1 (E1); aqui a frente é uma faixa.')
    + C.pRaw('<b>Nenhuma medição isolada decide esta célula a 1,5%.</b> Cortando cada faixa mensurável em 2, 4 e 8 fatias (composição do gás por PVT, rigidez do arcabouço em plugue, distribuição do gás, saturação por perfil), ' + (dec0.length ? dec0.map((x) => x.what + ' decide em ' + x.slices + ' fatias').join('; ') : 'nenhuma fatia sai decidida só com a faixa física') + '; com o gás pobre, uniforme e o arcabouço medido, ' + (dec4.length ? dec4.map((x) => x.what + ' decide em ' + x.slices + ' fatias').join('; ') : 'tampouco') + '. O que decide é o requisito de resolução: ' + w(H.table[4].range[0]) + ' de impedância. É um insumo de especificação de aquisição (OBN, PRM), não uma medição de rocha.')
    + '</div>'

    + '<div class="col dv-sub sec-head"><h3>Monte Carlo cara a cara, na resolução real</h3></div>'
    + '<div class="wide"><div class="dv-mc">'
    + '<div class="claim"><div class="dv-k">o que o estudo por sorteio diria a 1,5%</div><div class="big">' + br.pct(100 * MC.K4[1].pDetect, 1) + '</div><p>dos ' + br.int(MC.K4[1].draws) + ' sorteios detectam (com ' + br.int(MC.K4[0].draws) + ' sorteios: ' + br.pct(100 * MC.K4[0].pDetect, 1) + '), na célula com gás pobre, uniforme e arcabouço medido. Só com a faixa física: ' + br.pct(100 * MC.K0[1].pDetect, 1) + ' de ' + br.int(MC.K0[1].draws) + '. A menor mudança entre os sorteios: ' + w(MC.K4[1].min) + '.</p></div>'
    + '<div><div class="dv-k">o que o Decidível garante</div><div class="big">' + w(H.table[4].range[1]) + '</div><p>Um cenário admissível, com valor garantido, muda só isso: a menor mudança possível é pelo menos ' + w(H.table[4].range[0]) + '. Só com a faixa física há um cenário que muda ' + (undPct !== null ? w(undPct) : '—') + ' e outro que muda ' + (detPct !== null ? w(detPct) : '—') + '. A fração do envelope que não detecta é ' + br.pct(100 * (1 - MC.K4[1].pDetect), 1) + ' (estimativa por sorteio, rotulada como tal); a medição que elimina o contraexemplo é a resolução de ' + w(H.table[4].range[0]) + '.</p></div>'
    + '</div></div>'
    + '<div class="col">' + C.pRaw('Na mesma célula a 0,5%, o par que abriu esta página: mil sorteios viram no mínimo ' + w(H.mc.min) + '; o motor provou um cenário com ' + w(H.mc.attainedLo) + '. A frase que fica: <b>o estudo diria detectável em ' + br.pct(100 * MC.K4[1].pDetect, 0) + ' dos sorteios; existe um cenário admissível, com valor garantido, que não detecta; a especificação que o elimina é resolver ' + w(H.table[4].range[0]) + '.</b>') + '</div>'

    + '<div class="col dv-sub sec-head"><h3>O sinal pode mudar de sinal</h3></div>'
    + '<div class="col">' + C.pRaw('Gás mais denso que o óleo vivo mais leve admissível (0,66 g/cm³) pode <b>endurecer</b> a rocha: a densidade sobe mais do que o módulo cai. O motor bisseciona a densidade do gás injetado e devolve, por célula, a menor densidade em que um cenário verificado <b>ganha</b> impedância. Na célula de coquina: <b>' + (signH !== null ? br.dec(signH, 3) + ' g/cm³' : 'não encontrada neste orçamento') + '</b>. No mapa inteiro (só a faixa física): de ' + br.dec(N.signStats.min, 3) + ' a ' + br.dec(N.signStats.max, 3) + ' g/cm³ (mediana ' + br.dec(N.signStats.median, 3) + '), encontrada em ' + br.int(N.signStats.found) + ' de ' + br.int(N.signStats.of) + ' células. O metano a 60 MPa e 65 °C tem 0,26 g/cm³; o CO₂ puro nas condições do pré-sal, 0,89 a 0,97 (NIST). Acima dessa densidade, <b>o 4D a 1,5% não garante nem o sinal da mudança</b>: um amolecimento lido como “o gás chegou” e um endurecimento lido como “não chegou” são ambos admissíveis. A fração molar de CO₂ correspondente sai do PVT do gás do campo (E1); com o gás rico em CO₂ de Tupi (cerca de 80%), o envelope da célula já contém os dois sinais.') + '</div>'

    + '<div class="col dv-sub sec-head"><h3>Is e Vp/Vs saem do mesmo envelope</h3></div>'
    + '<div class="col">' + C.p('Gassmann não altera o módulo de cisalhamento: Is muda só pela densidade, e Vp/Vs só pelo módulo. Os três atributos, garantidos sobre a mesma célula:') + '</div>'
    + C.table({ cols: [{ h: 'estado de conhecimento' }, { h: '|ΔIp/Ip|' }, { h: '|ΔIs/Is|' }, { h: '|ΔVp/Vs|' }], rows: attrRows })
    + '<div class="col">' + C.pRaw('Para uma mudança só de saturação, a mudança de Ip é, em módulo, a soma das duas partes: <b>Ip é o atributo mais sensível</b>, e nenhum atributo resgata uma célula INDETERMINADA em Ip. O que Is e Vp/Vs acrescentam é a separação da parte de densidade e da parte de módulo, que é como o efeito de pressão será isolado com os dados OBN 4C na Fase 1.')
    + C.pRaw('<b>Os cenários publicados cabem no envelope.</b> Em Tupi, a variação de impedância em torno de WAG1 ficou abaixo dos 2% e as variações distinguíveis foram de cerca de 1,5% (Cruz et al. 2021): dentro do envelope garantido da célula de coquina, [' + w(rc.envelope[0]) + '; ' + w(rc.envelope[1]) + ']. A auditoria quantitativa de um estudo de viabilidade — os cenários de da Silva, Davolio, dos Santos e Schiozer (BrJG 2025; J. Appl. Geophys. 2026) plotados dentro do intervalo garantido, e o cenário admissível fora deles que muda o veredito — é a entrega E4, com os parâmetros do estudo.')
    + '</div></section>');

  /* 5 · value case */
  B.push(C.section({ lab: '5 · caso de valor', title: 'Seis decisões da Petrobras mudam; a mais cara é a aquisição.',
    bodyRaw: C.table({ cols: [{ h: 'decisão da Petrobras' }, { h: 'custo em jogo' }, { h: 'o que muda com o Decidível' }, { h: 'evidência no demonstrador' }], rows: [
      ['Adquirir ou não um 4D (go/no-go)', { raw: 'uma campanha OBN 4D no pré-sal: centenas de milhões de dólares (Mero, ' + a('mero', 'US$ 450 mi') + '; Búzios, ' + a('buzios', '3.500 nós, 8 meses') + ')' }, 'veredito garantido antes da aquisição; nunca comprar um levantamento que não pode responder à pergunta', 'a frente fina INDETECTÁVEL em ' + br.int(thin0.REFUTADO) + ' células a 1,5%'],
      ['Especificar o levantamento (repetibilidade alvo; OBN, PRM ou streamer)', 'a diferença de custo entre tecnologias de aquisição (ordem de grandeza; sem fonte pública por campanha)', '“resolver ≤ X%” vira requisito de especificação, célula a célula', 'a coluna “o que decide”: ' + w(H.table[4].range[0]) + ' para a coquina mediana'],
      ['Sequenciar medições baratas antes da cara', 'PVT e ultrassom em plugues: ordem de grandeza abaixo do levantamento (sem fonte pública)', 'a medição que decide cada INDETERMINADO, ordenada por custo; e quando nenhuma decide, dizê-lo', 'a Nota Técnica, seção 6'],
      ['Interpretar a frente WAG-CO₂ no 4D', 'risco de ler endurecimento como ausência de gás', 'a densidade de gás acima da qual o sinal deixa de ser garantido', 'o mapa do sinal: ' + (signH !== null ? br.dec(signH, 2) + ' g/cm³ na coquina' : '—')],
      ['Auditar um estudo de viabilidade existente', 'o custo do estudo e da decisão que ele informa', 'o cenário admissível que o ensemble não amostrou, com valor garantido', 'Monte Carlo cara a cara; E4'],
      ['Comprovar o armazenamento dedicado de CO₂ ao regulador', { raw: 'obrigações de monitoramento e encerramento do operador de estocagem (' + a('lei', 'Lei 14.993/2024, art. 29') + '; ' + a('decreto', 'Decreto 13.095/2026') + ') — <b>não alcança a reinjeção para recuperação avançada</b> (art. 26, § 4º)' }, 'certificado reexecutável do que os dados provam e do que não provam', 'módulo E6, condicionado ao portfólio de CCUS']
    ] })
    + '<div class="col">' + C.pRaw('<b>Frequência e dono da decisão.</b> Campanhas 4D OBN no pré-sal nomeadas publicamente em três anos: o piloto de Tupi (2020), Búzios (2024–25), o monitor OBN 4D da PXGEO (2024), dois contratos OBN 4C para 2026 e o sistema permanente de Mero (2026–27). Cada uma nasce de um estudo de viabilidade. Dono na Fase 1: a gerência de geofísica de reservatórios e o gerenciamento de reservatórios do ativo; na Fase 2, a área de CCUS. A Petrobras reinjetou ' + a('f20', '19,6 Mt de CO₂ em 2025') + ' (20-F) — é WAG-CO₂ para recuperação avançada, fora do alcance da lei de estocagem, e dentro do gerenciamento de reservatórios.')
    + C.pRaw('<b>Onde entra no fluxo atual (nada é substituído).</b> (1) Estudo de viabilidade 4D existente → o anexo: o envelope garantido e os contraexemplos. (2) Plano de aquisição → o requisito de resolução por célula e a lista de medições que decidem. (3) Interpretação 4D pós-aquisição → o intervalo do sinal, inclusive o seu sinal, por célula. (4) Plano de monitoramento de CO₂ dedicado → certificado por levantamento. (5) Cada levantamento adquirido volta como evidência e aperta o envelope do próximo campo.')
    + '</div>' }));

  /* 6 · state of the art */
  const cites = [
    ['Cruz et al. 2021 · SBGf 17th ICBGf; The Leading Edge 40(12):886', 'Piloto 4D OBN de Tupi: NRMS de 2 a 3%, variações de impedância de cerca de 1,5% distinguíveis; a saturação sozinha superestima o sinal; mais CO₂, menos contraste.'],
    ['da Silva, Davolio, dos Santos e Schiozer 2025 · Braz. J. Geophys. 43(2); 2026 · J. Appl. Geophys. 245', 'Modelagem petroelástica 4D com interação rocha-fluido num reservatório análogo ao pré-sal (UNISIM) e viabilidade por cenários: nenhuma garantia sobre toda a faixa de parâmetros.'],
    ['Chadwick, Marchant e Williams 2014 · Energy Procedia', 'Limiares de detecção de CO₂ em Sleipner dados como probabilidade de detecção.'],
    ['Bergmann e Chadwick 2015 · Geophysics', 'Limites de massa de CO₂ por enumeração de saturações e espessuras: o antecedente mais próximo, sem aritmética rigorosa e sem decisão.'],
    ['Zhang et al. 2023 · Geophys. J. Int.', 'FWI variacional 3D: o ADVI subestima sistematicamente a incerteza.'],
    ['Grana et al. 2022 · Geophysics', 'Revisão da inversão petrofísica probabilística: respostas condicionadas ao prior.'],
    ['Anyosa et al. 2021 · IJGGC', 'Valor da informação do monitoramento de CO₂, calculado em esperança, não caso a caso.'],
    ['Hansen e Walster 2004 · Global Optimization Using Interval Analysis', 'O método: ramificação e poda intervalar com teste de monotonicidade — aqui aplicado a Gassmann.']
  ];
  B.push(C.section({ lab: '6 · estado da arte', title: 'Toda detectabilidade publicada é probabilística ou por cenários; nenhuma garante o envelope.',
    bodyRaw: '<div class="col">' + C.p('Os limiares de NRMS são regras que dependem da banda; a incerteza bayesiana e variacional depende do prior e é reconhecidamente enviesada; a viabilidade por cenários responde pelos cenários escolhidos. Não encontramos, em nenhuma delas, um veredito garantido sobre o envelope inteiro, a recusa com contraexemplos e a medição que decide.')
      + '<ul class="dv-cites">' + cites.map(([x, y]) => '<li><b>' + esc(x) + '.</b> ' + esc(y) + '</li>').join('') + '</ul></div>' }));

  /* 7 · work plan */
  B.push('<section id="plano"><div class="col sec-head"><div class="lab">7 · plano de trabalho</div><h2>Doze meses, uma fase central: viabilidade 4D decidida num campo do pré-sal, com dados da Petrobras, no ambiente da Petrobras.</h2></div>'
    + '<div class="col">' + C.pRaw('<b>Objetivo geral.</b> Decidir, para um campo do pré-sal com dados da Petrobras e no ambiente da Petrobras, onde um levantamento 4D vê a injeção de gás ou CO₂ para todo cenário admissível, onde nenhum vê, e o que medir onde a evidência não decide. <b>Objetivos específicos.</b> (1) envelope declarado do campo com perfis, plugues e PVT; (2) mapa de detectabilidade garantida por célula do modelo do campo a 1,5% e 3%; (3) plano de redução de incerteza por INDETERMINADO, ordenado por custo; (4) comparação com o estudo de viabilidade interno; (5) ferramenta rodando no ambiente Petrobras sem o autor; (6) opcional: certificado de monitoramento de CO₂ dedicado.') + '</div>'
    + C.table({ cols: [{ h: 'entrega' }, { h: 'meses', cls: 'n' }, { h: 'o que entrega' }, { h: 'critério de aceitação' }, { h: 'TRL', cls: 'n' }], rows: [
      ['E1 · Envelope declarado', '0–2', 'faixas de φ, Sg (do simulador, por célula e por tempo), arcabouço (plugues sob tensão, tipo de poro), fluidos (PVT), mistura, com fonte por parâmetro', 'assinado pelo geofísico-par; nenhum parâmetro sem fonte', '3'],
      ['E2 · Mapa decidido', '2–4', 'veredito por célula do modelo do campo a 1,5% e 3%; Ip, Is e Vp/Vs', '100% das células com veredito ou “não decidido” explicado; três vereditos recalculados à mão por geofísico da Petrobras', '4'],
      ['E3 · Plano de redução de incerteza', '3–5', 'para cada INDETERMINADO: a medição ou o estreitamento que decide, custo estimado, ordem', 'lista priorizada aceita pela equipe de reservatório do ativo', '4'],
      ['E4 · Auditoria do estudo interno', '5–8', 'cenários do estudo de viabilidade interno dentro do envelope; modelos admissíveis não amostrados, com valor garantido', 'relatório revisado pela gerência de geofísica; pelo menos um contraexemplo confirmado ou a sua ausência provada', '5'],
      ['E5 · Integração', '6–10', 'certificados por decisão no ambiente Petrobras; extensão de pressão (módulo × tensão efetiva); espessura como faixa; casos de controle negativos por domínio', 'roda sem o autor; controles negativos recusados em cada build', '5–6'],
      ['E6 · Módulo CO₂ dedicado (opcional)', '8–12', 'o que um levantamento prova sobre pluma e contenção, e o que não prova, em certificado reexecutável', 'revisão com a área de CCUS e regulatório; escopo legal já verificado: art. 26, § 4º exclui a recuperação avançada', '4']
    ] })
    + '<div class="col">' + C.pRaw('<b>Marcos e portões.</b> M0 (mês 0): kick-off, dados no ambiente Petrobras, NDA. M3: primeiro mapa decidido; portão técnico — se mais de 90% das células forem INDETERMINADAS a 3%, ativar caixas correlacionadas, Sg do simulador e atributos adicionais antes de E3. M6: revisão de meio-termo com o portfólio; go/no-go para E4–E6. M12: entrega final; decisão de implantação (anexo padrão ao estudo de viabilidade ou licença por ativo). E1 a E3 formam a fase central; o portão do mês 6 libera E4 a E6, e E6 só entra se o portfólio de CCUS confirmar interesse.') + '</div>'
    + '<div class="wide"><div class="dv-ask"><div><div class="dv-k">o que pedimos</div><ul><li>um campo e uma pergunta de aquisição ou monitoramento</li><li>perfis, plugues e PVT no ambiente da Petrobras</li><li>um geofísico-par (4 h/semana) e mentoria do portfólio</li><li>doze meses</li></ul></div>'
    + '<div><div class="dv-k">o que a Petrobras recebe</div><ul><li>o mapa decidido do campo e o plano de redução de incerteza</li><li>a auditoria do estudo interno</li><li>a ferramenta instalada, com certificados reexecutáveis</li><li>um método que qualquer geofísico da casa refaz sem o nosso código</li></ul></div></div></div></section>');

  /* 8 · risks, business model, IP, deployment */
  B.push(C.section({ lab: '8 · riscos, modelo de negócio, implantação', title: 'O maior risco técnico é o excesso de INDETERMINADO; a mitigação está no plano.',
    bodyRaw: C.table({ cols: [{ h: 'risco' }, { h: 'efeito' }, { h: 'mitigação' }, { h: 'onde' }], rows: [
      ['Excesso de INDETERMINADO na resolução real', 'ferramenta lida como conservadora demais', 'caixas correlacionadas; Sg do simulador; Is e Vp/Vs; todo INDETERMINADO sai com a medição que decide ou com a declaração de que nenhuma decide e o requisito de resolução', 'seção 4; portão M3'],
      ['Modelo petroelástico fora da rocha real (tipo de poro, Gassmann em carbonato, frequência)', 'um DETECTÁVEL que a rocha desmente', 'envelope do arcabouço a partir de plugues da Petrobras, com tipo de poro; limites de Hashin–Shtrikman como sanidade; “o veredito fala do modelo declarado” na primeira página', 'E1; seção 3'],
      ['Efeito de pressão ausente', 'sinal superestimado nos injetores', 'caixa de módulo × tensão efetiva com plugues sob tensão', 'E1, E5'],
      ['Espessura e sintonia fora do modelo', 'detectabilidade de célula ≠ detectabilidade sísmica', 'dito na seção 3; espessura como caixa adicional em E5', 'seção 3'],
      ['Acesso a dados', 'sem dados, sem campo', 'tudo no ambiente Petrobras; NDA; dados públicos de Tupi e o UNISIM como plano B', 'M0'],
      ['Equipe de uma pessoa', 'risco de execução', 'colaboração acadêmica de geociência em negociação; geofísico-par; segunda implementação independente já existente', 'seção 9'],
      ['Adoção interna', 'ferramenta paralela, não usada', 'formato de anexo ao estudo de viabilidade existente; nada substituído', 'E4, E5'],
      ['Escopo legal do módulo CO₂', 'hook regulatório que não se aplica', { raw: 'verificado: a ' + a('lei', 'Lei 14.993/2024') + ' exclui do regime de estocagem a injeção para recuperação avançada (art. 26, § 4º); E6 e o texto desta página tratam só do armazenamento dedicado' }, 'E6']
    ] })
    + '<div class="col">' + C.pRaw('<b>Modelo de negócio (CRL 2 → o que falta dizer).</b> Fase de PD&amp;I: contrato de inovação de 12 meses no instrumento do módulo em que a submissão cair; como referência, o módulo Aquisição de Soluções do Conexões previu ' + a('conexoes', 'até R$ 1,6 milhão por proposta, contratos de até 12 meses prorrogáveis por 12') + ' (2022). Depois: anexo de decisão por estudo de viabilidade (serviço) ou licença anual por ativo com certificados reexecutáveis e suporte; a Petrobras escolhe no M12. O núcleo de aritmética é MIT e fica aberto — auditável, condição do próprio método; o valor pago está na construção do envelope com dados do ativo, na integração ao fluxo, na suíte de controles por domínio e no suporte.')
    + C.pRaw('<b>Escalabilidade e abrangência.</b> O mesmo método decide outras perguntas de “medir antes de pagar”: profundidade sob o sal (a incerteza de velocidade dos evaporitos sobre alvos e contatos), posicionamento de poços, armazenamento dedicado de CO₂, monitoramento de integridade. Uma frase cada, sem prazo prometido.')
    + C.pRaw('<b>Propriedade intelectual e confidencialidade.</b> Titularidade do que for desenvolvido no projeto conforme a regra do módulo; aceita. Envelopes, mapas e certificados do campo são da Petrobras; nenhum dado ou derivado sai do ambiente. O método permanece público; a Petrobras recebe direito de uso irrestrito do núcleo.')
    + C.pRaw('<b>Implantação ao final do projeto — o critério de sucesso.</b> Ao final do M12, um geofísico da Petrobras produz o mapa decidido de um novo campo sem o autor, e o anexo de decisão passa a acompanhar o estudo de viabilidade 4D do ativo.')
    + '</div>' }));

  /* 9 · maturity and team */
  B.push(C.section({ lab: '9 · maturidade e equipe', title: 'TRL 3 com evidência pública; colaboração de geociência em negociação; geofísico-par da Petrobras no piloto.',
    bodyRaw: '<div class="col">'
      + C.pRaw('<b>TRL 3</b> — prova de conceito: o método implementado, a suíte de verificação com segunda implementação independente em Python, o demonstrador público sobre o benchmark do pré-sal, o código e os registros arquivados com DOI (' + a('doi', '10.5281/zenodo.22800699') + '). A mesma aritmética já decide, em produção pública, milhares de ajustes de extremos metoceânicos e resultados de IA de fronteira. <b>CRL 2</b> — problema e comprador identificados; o piloto é o próximo passo.')
      + C.pRaw('<b>Equipe.</b> Carlos Toledo, fundador: design industrial, direção de arte e desenvolvimento; ex-EmbraerX (inovação corporativa em aeroespacial). Colaboração de geociência em negociação com um laboratório universitário; geofísico-par da Petrobras no piloto. Uma pessoa hoje; o piloto define as próximas.')
      + C.pRaw('<b>Contato.</b> carlos@carlostoledo.co · <a href="' + DECK + '">apresentação (PDF)</a> · <a href="' + NOTA + '">Nota Técnica de exemplo (PDF)</a> · <a href="' + REPO + '/tree/main/apps/decidivel">código</a>')
      + C.pRaw('<span class="scope">O demonstrador declara as suas faixas com fonte: plugues de ' + a('quadros', 'Quadros et al. 2025') + ', fluidos de Batzle–Wang 1992 e NIST, limiares de Cruz et al. 2021, o modelo UNISIM-IV-2026. Não são dados da Petrobras. Um PROVADO fala do modelo declarado e do envelope declarado, não da rocha: as hipóteses de Gassmann são do modelo.</span>')
      + '</div>' }));

  /* 10 · the ask */
  B.push(C.section({ lab: '10 · o pedido', title: 'Primeiro passo: PVT e plugues de um poço; mapa decidido das suas células em quatro semanas.',
    bodyRaw: '<div class="col">' + C.p('É o pedido que um representante de portfólio consegue aprovar sozinho: o PVT e os plugues de um poço (ou os dados já públicos de Tupi), no ambiente da Petrobras, e em quatro semanas o mapa decidido das células daquele poço, com a Nota Técnica de cada uma. Depois, os doze meses da seção 7.')
      + '<div class="dv-cta"><a class="go" href="mailto:carlos@carlostoledo.co?subject=Decid%C3%ADvel%20%E2%80%94%20primeiro%20passo">carlos@carlostoledo.co</a><a href="' + NOTA + '">Nota Técnica de exemplo (PDF)</a><a href="' + DECK + '">Apresentação (PDF)</a></div></div>' }));

  const mapData = JSON.stringify({ maps: L.maps, axes: L.axes, scenarios: scen, perCol: N.perCol, declared: D, sign: L.sign }).replace(/</g, '\\u003c');
  const script = '<script>' + bundleText + '</script>\n<script type="application/json" id="dv-data">' + mapData + '</script>\n<script>' + CLIENT + '</script>';
  const foot = '<p>' + esc('Gerado por apps/decidivel/build.js a partir de apps/decidivel/data/decidivel-ledger.json, apps/decidivel/declared.json e corpus/unisim-iv; bateria ' + N.battery + '.') + '</p><p>' + esc('git ' + git) + '</p>';
  return TPL.render({
    title: 'Decidível — decidibilidade garantida de sísmica 4D para injeção de gás e CO₂ no pré-sal', lang: 'pt-BR',
    desc: 'Suporte à decisão go/no-go de aquisição 4D: sobre um envelope de incerteza declarado com fonte e o modelo petroelástico padrão, o mínimo e o máximo garantidos de ΔIp/Ip por célula, e um de três vereditos — DETECTÁVEL, INDETECTÁVEL ou INDETERMINADO com contraexemplos e a medição que decide.',
    path: '/decidivel/', bodyRaw: B.join('\n\n'), footRaw: foot, cssRaw: css(), scriptRaw: script
  });
}

const CLIENT = `(function () {
  var DV = self.DECIDIVEL; var data = JSON.parse(document.getElementById('dv-data').textContent);
  var R = DV && DV.R, nx = data.axes.phi.length, ny = data.axes.sg.length;
  var cells = [].slice.call(document.querySelectorAll('.dv-map g.c')), th = document.getElementById('dv-th'), thv = document.getElementById('dv-thv');
  var cellBox = document.getElementById('dv-cell'), rowSel = document.getElementById('dv-row'), bar = document.getElementById('dv-bar'), fl = document.getElementById('dv-fl');
  var k = data.scenarios[0], sel = null;
  function pct(x) { return x === null ? '—' : x.toFixed(2).replace('.', ',') + '%'; }
  function cls(v, t) { if (t <= v[0]) return 'P'; if (t > v[3]) return 'F'; if (v[1] !== null && v[2] !== null && v[1] < t && t <= v[2]) return 'R'; return 'U'; }
  var WORD = { P: 'PROVADO', F: 'REFUTADO', R: 'RECUSADO', U: 'NÃO DECIDIDO' };
  function paint() {
    var t = +th.value; thv.textContent = pct(t);
    cells.forEach(function (g) { var v = data.maps[k][+g.getAttribute('data-i')]; g.setAttribute('class', 'c v-' + cls(v, t) + (g === sel ? ' on' : '')); });
    var j = +rowSel.value, o = { P: 0, R: 0, F: 0, U: 0 }, n = 0;
    for (var i = 0; i < nx; i++) { var c = cls(data.maps[k][j * nx + i], t); o[c] += data.perCol[i]; n += data.perCol[i]; }
    bar.innerHTML = ['P', 'R', 'F', 'U'].map(function (x) { return o[x] ? '<span class="' + x.toLowerCase() + '" style="--w:' + (100 * o[x] / n).toFixed(3) + '"></span>' : ''; }).join('');
    [].forEach.call(bar.children, function (s) { s.style.width = s.style.getPropertyValue('--w') + '%'; });
    fl.innerHTML = ['P', 'R', 'F', 'U'].map(function (x) { return '<span>' + WORD[x] + ' <b>' + o[x].toLocaleString('pt-BR') + '</b></span>'; }).join('');
    if (sel) show(sel, false);
  }
  function box(i) { var j = Math.floor(i / nx), q = i % nx, b = {}; var D = data.declared; for (var key in D.box) b[key] = D.box[key]; var m = D.scenarios[k].mod; for (var key2 in m) b[key2] = m[key2]; b.phi = data.axes.phi[q]; b.dSg = data.axes.sg[j]; return b; }
  function show(g, rerun) {
    sel = g; cells.forEach(function (x) { x.classList.toggle('on', x === g); });
    var i = +g.getAttribute('data-i'), v = data.maps[k][i], j = Math.floor(i / nx), q = i % nx, t = +th.value;
    var sg0 = data.sign ? data.sign[i] : null;
    cellBox.innerHTML = '<b>φ ' + data.axes.phi[q].join('–') + ' · Sg ' + data.axes.sg[j].join('–') + '</b> · ' + WORD[cls(v, t)] + ' a ' + pct(t) + (k === data.scenarios[0] && sg0 !== null ? ' · ganha impedância a partir de ρgás = ' + sg0.toFixed(3).replace('.', ',') + ' g/cm³' : '') + '<br>'
      + 'menor mudança: provada ≥ ' + pct(v[0]) + ', um modelo mostra ' + pct(v[1]) + ' · maior mudança: um modelo mostra ' + pct(v[2]) + ', provada ≤ ' + pct(v[3])
      + (R ? '<br><button type="button" id="dv-rerun">Decidir de novo no meu navegador</button> <span id="dv-rr"></span>' : '');
    var b = document.getElementById('dv-rerun');
    if (b) b.addEventListener('click', function () {
      var t0 = performance.now(), A = R.absRange(R.box(box(i)), { budget: 12000 });
      var r = [Math.floor(A.lo * 1e6) / 1e6, A.loA === null ? null : Math.round(A.loA * 1e6) / 1e6, A.hiA === null ? null : Math.round(A.hiA * 1e6) / 1e6, Math.ceil(A.hi * 1e6) / 1e6, A.sign];
      var same = JSON.stringify(r) === JSON.stringify(v);
      document.getElementById('dv-rr').textContent = 'decidida em ' + Math.round(performance.now() - t0) + ' ms · ' + (same ? 'idêntica ao registro' : 'DIFERENTE do registro');
    });
  }
  cells.forEach(function (g) { g.addEventListener('click', function () { show(g, false); }); g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(g, false); } }); });
  th.addEventListener('input', paint); rowSel.addEventListener('change', paint);
  [].forEach.call(document.querySelectorAll('input[name=dvk]'), function (r) { r.addEventListener('change', function () { k = r.value; paint(); }); });
  var h = decodeURIComponent(location.hash.slice(1)), m = /^k=(K\\d)&t=([\\d.]+)$/.exec(h);
  if (m) { k = m[1]; th.value = m[2]; var el = document.getElementById('dvk-' + k); if (el) el.checked = true; }
  paint();
})();`;

module.exports = { build };
