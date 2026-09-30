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

  B.push('<header class="col dv-hero">'
    + '<div class="eyebrow">Decidível · geofísica e petrofísica · sísmica 4D e monitoramento de CO₂</div>'
    + '<h1>Antes de pagar por um levantamento 4D, saiba se ele pode responder à sua pergunta.</h1>'
    + '<p class="deck">Um estudo de viabilidade roda um modelo de rocha, alguns cenários ou mil sorteios, e imprime uma probabilidade. O Decidível decide para <b>toda</b> rocha e <b>todo</b> fluido que a evidência admite — com aritmética exata, sem amostrar — se a injeção será visível na sísmica 4D. Quando a evidência não decide, ele diz exatamente o que medir.</p>'
    + '<div class="dv-trio">'
    + '<div>' + chip('PROVADO', true) + '<p>O levantamento vê a mudança para toda rocha e todo fluido declarados.</p></div>'
    + '<div>' + chip('REFUTADO', true) + '<p>Nenhum levantamento com essa resolução vê, qualquer que seja a rocha. Não pague por ele.</p></div>'
    + '<div>' + chip('RECUSADO', true) + '<p>Depende: há modelos dos dois lados, ambos provados, e o recibo diz o que medir para decidir.</p></div>'
    + '</div>'
    + '<div class="dv-cta"><a class="go" href="#mapa">O mapa ao vivo ↓</a><a href="/decidivel/decidivel-apresentacao.pdf">Apresentação (PDF)</a><a href="#projeto">O projeto de PD&amp;I</a></div>'
    + '</header>');

  const mc = H.mc;
  B.push(C.stats([
    { k: 'caixas decididas', v: br.int(N.boxes), n: br.int(N.cells) + ' células de porosidade × saturação, sob 5 estados de conhecimento, cada uma com dois extremos provados' },
    { k: 'o que o Monte Carlo não viu', v: w(mc.attainedLo) + ' × ' + w(mc.min), n: 'a menor mudança provada num modelo admissível, contra a menor entre ' + br.int(mc.draws) + ' sorteios' },
    { k: 'arcabouço de plugues reais', v: '9', n: 'plugues do pré-sal (Iracema, Bacia de Santos) fixam a caixa da rigidez da rocha seca' },
    { k: 'células de um análogo público do pré-sal', v: br.int(N.active), n: 'do benchmark UNISIM-IV (UNICAMP), porosidade e tipo de rocha lidos do modelo' }
  ]));

  B.push(C.section({ lab: '1 · o problema', title: 'O 4D no pré-sal ainda está em debate',
    bodyRaw: '<div class="col">'
      + C.p('No piloto 4D de Tupi, com nós de fundo oceânico, a repetibilidade chegou a NRMS de cerca de 2 a 3%, e mudanças de impedância de cerca de 1,5% passaram a ser distinguíveis. A equipe registrou que a saturação sozinha superestima o sinal, e que quanto mais CO₂ no gás injetado, mais denso ele é e menor o contraste (Cruz et al., 2021). Em carbonatos rígidos, o sinal é pequeno e pode sumir.')
      + C.pRaw('Os estudos de viabilidade respondem com um modelo, com cenários ou com uma probabilidade de detecção. Nenhum responde à pergunta que decide o dinheiro: <b>este levantamento vê a injeção para toda rocha e todo fluido que a evidência admite?</b> E quando não se sabe, <b>o que medir para saber?</b>')
      + '</div>' }));

  B.push(C.section({ lab: '2 · como decide', title: 'Caixas, não amostras',
    bodyRaw: '<div class="wide"><div class="dv-arch">'
      + '<div class="dv-st"><div class="dv-k">o que se declara</div><h3>Faixas, com fonte</h3><p>Porosidade e saturação da célula; rigidez do arcabouço de plugues reais; fluidos de Batzle–Wang e NIST; a distribuição do gás, de uniforme a em manchas.</p></div><div class="dv-ar" aria-hidden="true"></div>'
      + '<div class="dv-st core"><div class="dv-k">o motor</div><h3>A caixa inteira, em aritmética exata</h3><ol>'
      + '<li><b>Física declarada</b>: Gassmann, a mistura de Reuss a Voigt (toda lei de Brie entre elas), o arcabouço na tendência de porosidade crítica.</li>'
      + '<li><b>Extremos provados</b>: intervalos com arredondamento para fora, derivadas intervalares, e cada parâmetro de efeito provadamente monótono fixado no extremo.</li>'
      + '<li><b>Testemunhas</b>: um modelo real de cada lado do limiar, com o valor provado.</li></ol></div><div class="dv-ar" aria-hidden="true"></div>'
      + '<div class="dv-st"><div class="dv-k">o que sai</div><h3>Veredito e o que decidiria</h3><p>' + chip('PROVADO') + ' ' + chip('REFUTADO') + ' ' + chip('RECUSADO') + '</p><p>Com o intervalo provado da mudança, os limiares que viram o veredito e a medição que o decide.</p></div>'
      + '</div></div>' }));

  /* the headline receipt */
  const c1 = rc.checks.find((c) => c.id === 'deteccao');
  const tab = H.table.map((t) => {
    const s = D.scenarios[t.k], v = t.range;
    return [s.label, s.note, { raw: chip(t.verdict) }, w(v[0]) + ' – ' + w(v[3]), v[0] > 0 ? 'resolver ' + w(v[0]) + ' decide PROVADO' : 'nenhuma resolução: há modelo sem mudança'];
  });
  B.push('<section id="pergunta"><div class="col sec-head"><div class="lab">3 · uma pergunta, decidida</div><h2>Uma célula de coquina, uma frente de gás, o limite de Tupi</h2></div>'
    + '<div class="wide"><div class="dv-rc"><div class="claim"><div class="dv-k">a pergunta</div><p class="dv-story">' + esc(D.headline.why.replace('A coquina cell at the benchmark\'s median porosity (0.139), a WAG gas front between 15% and 30% saturation, and the Tupi pilot\'s 1.5% detection limit.', 'Uma célula de coquina na porosidade mediana do benchmark (φ entre 0,13 e 0,15), a frente de gás de um ciclo WAG entre 15% e 30% de saturação, e o limite de detecção do piloto de Tupi, 1,5% de impedância.')) + '</p>'
    + '<div class="dv-pred">Um levantamento 4D que resolve 1,5% vai ver a injeção?</div></div>'
    + '<div><div class="dv-k">o que o Decidível decide</div>' + chip(rc.verdict, true)
    + '<p class="dv-env">ΔIp/Ip provado em [' + w(rc.envelope[0]) + '; ' + w(rc.envelope[1]) + '] para todo modelo admissível</p>'
    + '<ul class="dv-checks">' + rc.checks.map((c) => '<li>' + chip(c.verdict) + '<span>' + esc(c.text) + '</span></li>').join('') + '</ul>'
    + '</div></div></div>'
    + '<div class="col dv-sub sec-head"><h3>O que decidiria: o preço da informação</h3></div>'
    + '<div class="col">' + C.p('A mesma célula, com o que se passa a saber. Cada linha é uma caixa decidida por inteiro; a última coluna é a resolução de levantamento que tornaria a resposta PROVADA.') + '</div>'
    + C.table({ cols: [{ h: 'o que se sabe' }, { h: 'como' }, { h: 'a 1,5%' }, { h: 'mudança provada' }, { h: 'o que decide' }], rows: tab })
    + '<div class="wide"><div class="dv-mc">'
    + '<div class="claim"><div class="dv-k">o que um Monte Carlo diria</div><div class="big">≥ ' + w(mc.min) + '</div><p>A menor mudança entre ' + br.int(mc.draws) + ' sorteios da mesma caixa (gás pobre em CO₂, uniforme). Um estudo que confiasse nela diria “detectável” a qualquer limiar abaixo disso.</p></div>'
    + '<div><div class="dv-k">o que o Decidível prova</div><div class="big">' + w(mc.attainedLo) + '</div><p>Um modelo admissível, com o valor provado, muda só isso; a menor mudança possível é pelo menos ' + w(mc.provedLo) + '. Entre as duas, o Monte Carlo teria dito PROVADO e estaria errado.</p></div>'
    + '</div></div></section>');

  /* the live map */
  const scenRadios = scen.map((k, i) => '<input type="radio" name="dvk" id="dvk-' + k + '" value="' + k + '"' + (i === 0 ? ' checked' : '') + '><label class="sc" for="dvk-' + k + '">' + esc(D.scenarios[k].label) + '</label>').join('');
  const rows = L.axes.sg.map((s, j) => '<option value="' + j + '"' + (j === 5 ? ' selected' : '') + '>Sg ' + br.dec(Number(s[0]) < 0.01 ? 0 : Number(s[0]), 2) + '–' + br.dec(Number(s[1]), 2) + '</option>').join('');
  B.push('<section id="mapa"><div class="col sec-head"><div class="lab">4 · o mapa ao vivo</div><h2>Onde o 4D vê, onde não vê, onde depende</h2></div>'
    + '<div class="col">' + C.p('Cada célula é uma caixa: uma faixa de porosidade, uma faixa de saturação do gás injetado e todas as faixas declaradas. Mova a resolução do levantamento e o que se sabe; o mapa se reclassifica a partir dos números provados do registro. Toque numa célula para vê-los, e decida-a de novo no seu navegador.') + '</div>'
    + '<div class="wide"><div class="dv-ctl"><fieldset><legend>o que se sabe</legend>' + scenRadios + '</fieldset>'
    + '<label class="dv-th" for="dv-th">resolução do levantamento <input type="range" id="dv-th" min="0.25" max="5" step="0.25" value="' + th + '"><b id="dv-thv">' + w(th) + '</b></label></div>'
    + '<div class="figbox dv-mapbox">' + mapSvg(N, scen[0], th) + '</div>'
    + '<div class="dv-key"><span><svg viewBox="0 0 14 14"><rect class="full" x="1" y="1" width="12" height="12" rx="2"/></svg>PROVADO</span><span><svg viewBox="0 0 14 14"><rect class="bg" x="0.5" y="0.5" width="13" height="13" rx="2"/><path class="tri" d="M1 13L13 1L13 13Z"/></svg>RECUSADO</span><span><svg viewBox="0 0 14 14"><rect class="bg" x="0.5" y="0.5" width="13" height="13" rx="2"/><rect class="ring" x="4" y="4" width="6" height="6" rx="1"/></svg>REFUTADO</span><span><svg viewBox="0 0 14 14"><rect class="bg" x="0.5" y="0.5" width="13" height="13" rx="2"/></svg>não decidido neste orçamento</span></div>'
    + '<div class="dv-cell" id="dv-cell" aria-live="polite">Toque numa célula.</div>'
    + '<div class="dv-field"><div class="dv-row"><label for="dv-row">O campo inteiro, se a frente de gás chegar a </label><select id="dv-row">' + rows + '</select></div>'
    + '<div class="dv-bar" id="dv-bar" role="img" aria-label="Células do benchmark por veredito"></div><div class="dv-fl" id="dv-fl"></div>'
    + '<p class="dv-story">As ' + br.int(N.active) + ' células ativas do UNISIM-IV (' + Object.entries(N.rockCounts).filter(([, v]) => v > 100).map(([k, v]) => br.int(v) + ' de ' + k).join(', ') + '), cada uma na coluna da sua porosidade. Benchmark UNISIM-IV-2026 (UNICAMP), ODbL.</p></div>'
    + '</div></section>');

  /* the state of the art */
  const cites = [
    ['Cruz et al. 2021 · SBGf e The Leading Edge 40(12)', 'Piloto 4D OBN de Tupi: NRMS de 2 a 3%, detecção por volta de 1,5% de impedância; a saturação sozinha superestima o sinal.'],
    ['da Silva, Davolio, dos Santos e Schiozer 2025 · BrJG', 'Viabilidade 4D num reservatório análogo ao pré-sal (UNISIM) por cenários: nenhuma garantia sobre toda a faixa de parâmetros.'],
    ['Chadwick, Marchant e Williams 2014 · Energy Procedia', 'Limiares de detecção de CO₂ em Sleipner dados como probabilidade de detecção.'],
    ['Bergmann e Chadwick 2015 · Geophysics', 'Limites de massa de CO₂ por enumeração de saturações e espessuras: o antecedente mais próximo, sem aritmética rigorosa e sem decisão.'],
    ['Zhang et al. 2023 · Geophys. J. Int', 'FWI variacional 3D: o ADVI subestima sistematicamente a incerteza.'],
    ['Grana et al. 2022 · Geophysics', 'Revisão da inversão petrofísica probabilística: respostas condicionadas ao prior.'],
    ['Anyosa et al. 2021 · IJGGC', 'Valor da informação do monitoramento de CO₂, calculado em esperança, não caso a caso.'],
    ['Lei 14.993/2024, art. 29 · Decreto 13.095/2026, art. 11', 'O operador de estocagem de CO₂ monitora vazamentos e só encerra quando a estabilidade for comprovada perante a ANP.']
  ];
  B.push(C.section({ lab: '5 · estado da arte', title: 'O que a fronteira entrega, e o que falta',
    bodyRaw: '<div class="col">' + C.p('Toda afirmação de detectabilidade que encontramos é probabilística (curvas de probabilidade de detecção, ensembles, valor da informação em esperança) ou por cenários. Nenhuma vale para todo modelo admissível de uma caixa declarada; os limiares de NRMS são regras de bolso que dependem da banda; a incerteza bayesiana e variacional depende do prior e é reconhecidamente enviesada. O Decidível acrescenta o que falta: um veredito provado sobre a caixa inteira, a recusa com testemunhas, e a medição que decide.')
      + '<ul class="dv-cites">' + cites.map(([a, b]) => '<li><b>' + esc(a) + '.</b> ' + esc(b) + '</li>').join('') + '</ul></div>' }));

  B.push(C.section({ lab: '6 · o que substitui', title: 'Da probabilidade de detecção para a decisão',
    bodyRaw: C.table({ cols: [{ h: 'hoje' }, { h: 'entrega' }, { h: 'com o Decidível' }], rows: [
      ['Um modelo de física de rochas', 'um número por cenário', 'o intervalo provado para toda rocha e fluido da caixa'],
      ['Monte Carlo, probabilidade de detecção', '“detectável em 97% dos sorteios”', 'o modelo que os sorteios não viram, com o valor provado'],
      ['Regra de bolso de NRMS', 'um limiar único para qualquer rocha', 'o limiar exato que vira o veredito nesta caixa'],
      ['Valor da informação em esperança', 'quanto vale medir, em média', 'qual medição decide este caso, e com que resolução'],
      ['Inversão bayesiana', 'uma distribuição condicionada ao prior', 'o conjunto admissível inteiro, sem prior'],
      ['Monitoramento de CO₂ para a ANP', 'simulações e curvas', 'um recibo reexecutável do que os dados provam e do que não provam']
    ] }) }));

  B.push('<section id="projeto"><div class="col sec-head"><div class="lab">7 · o projeto de PD&amp;I proposto</div><h2>Doze meses para decidir antes de adquirir</h2></div>'
    + '<div class="col">' + C.p('O motor e o demonstrador estão publicados; o projeto os leva para um campo real, com os dados da Petrobras, dentro da Petrobras.') + '</div>'
    + C.table({ cols: [{ h: 'frente' }, { h: 'meses', cls: 'n' }, { h: 'o que entrega' }, { h: 'TRL', cls: 'n' }], rows: [
      ['1 · Viabilidade 4D decidida', '0–5', 'Num campo do pré-sal: a caixa declarada com perfis, plugues e PVT da Petrobras; o mapa de decidibilidade por célula do modelo; a medição que decide cada RECUSADO.', '3 → 5'],
      ['2 · Conformidade de CO₂', '3–9', 'Para a reinjeção: o que um levantamento prova sobre a pluma e a contenção, e o que não prova, num recibo que a ANP pode refazer.', '2 → 4'],
      ['3 · Profundidade sob o sal', '6–12', 'A incerteza de velocidade dos evaporitos (halita, anidrita, sais solúveis) decidida sobre alvos e contatos: o alvo fica acima do contato para todo modelo de velocidade?', '2 → 4'],
      ['4 · No fluxo de interpretação', '6–12', 'O motor ao lado das ferramentas de física de rochas e inversão; recibos por decisão; controles adversariais por domínio.', '3 → 6']
    ] })
    + '<div class="wide"><div class="dv-ask"><div><div class="dv-k">como medimos</div><ul><li>cada veredito refeito por um geofísico da Petrobras sem o nosso código</li><li>cada RECUSADO sai com a medição que o decide</li><li>controles vermelhos recusados a cada build, inclusive um Monte Carlo que erra</li><li>nenhum dado sai do ambiente da Petrobras</li></ul></div>'
    + '<div><div class="dv-k">o que pedimos à Petrobras</div><ul><li>um campo e uma pergunta de aquisição ou monitoramento</li><li>perfis, plugues e PVT no ambiente da Petrobras</li><li>um geofísico-par e mentoria do portfólio</li><li>doze meses</li></ul></div></div></div></section>');

  B.push(C.section({ lab: '8 · maturidade e equipe', title: 'Onde estamos',
    bodyRaw: '<div class="col">'
      + C.pRaw('<b>TRL 3</b> — prova de conceito: o motor, a bateria com uma segunda implementação em Python e o mapa sobre um benchmark público do pré-sal. A mesma aritmética já decide, em produção pública, milhares de ajustes de extremos metoceânicos e resultados de IA de fronteira. <b>CRL 2</b> — o problema e o comprador identificados; o piloto é o próximo passo.')
      + C.pRaw('<b>Equipe.</b> Carlos Toledo, fundador. Uma pessoa hoje; o piloto define as próximas.')
      + C.pRaw('<b>Contato.</b> carlos@carlostoledo.co · <a href="/decidivel/decidivel-apresentacao.pdf">apresentação (PDF)</a> · <a href="' + REPO + '/tree/main/apps/decidivel">código</a>')
      + C.pRaw('<span class="scope">O demonstrador declara as suas faixas com fonte: plugues de Quadros et al. 2025, fluidos de Batzle–Wang 1992 e NIST, limiares de Cruz et al. 2021, o modelo UNISIM-IV-2026. Não são dados da Petrobras. Um PROVADO fala do modelo declarado e da caixa declarada, não da rocha: as hipóteses de Gassmann são do modelo.</span>')
      + '</div>' }));

  const mapData = JSON.stringify({ maps: L.maps, axes: L.axes, scenarios: scen, perCol: N.perCol, declared: D }).replace(/</g, '\\u003c');
  const script = '<script>' + bundleText + '</script>\n<script type="application/json" id="dv-data">' + mapData + '</script>\n<script>' + CLIENT + '</script>';
  const foot = '<p>' + esc('Gerado por apps/decidivel/build.js a partir de apps/decidivel/data/decidivel-ledger.json, apps/decidivel/declared.json e corpus/unisim-iv; bateria ' + N.battery + '.') + '</p><p>' + esc('git ' + git) + '</p>';
  return TPL.render({
    title: 'Decidível — a sísmica 4D decidida antes da aquisição', lang: 'pt-BR',
    desc: 'Decidível decide, para toda rocha e todo fluido admissíveis e com aritmética exata, se a injeção de gás ou CO₂ será visível na sísmica 4D do pré-sal: PROVADO, REFUTADO ou RECUSADO, com a medição que decide cada recusa.',
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
    cellBox.innerHTML = '<b>φ ' + data.axes.phi[q].join('–') + ' · Sg ' + data.axes.sg[j].join('–') + '</b> · ' + WORD[cls(v, t)] + ' a ' + pct(t) + '<br>'
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
