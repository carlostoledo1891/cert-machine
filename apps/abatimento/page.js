/* page.js — /abatimento/: the product face (pt-BR) of the Registro de Abatimento, the
   solution proposed for Petrobras's CPSI 7004641677 (Aquisição de Soluções: "Sistema de
   cálculo de potencial de abatimento de emissões"). Every number is read by numbers.js
   from the record that decided it; every receipt is drawn by registro.js, the same
   function the reader's tab re-runs. apps/abatimento · cert-machine               MIT */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const RC = require('./registro.js');
const esc = C.esc;
const REPO = 'https://github.com/carlostoledo1891/cert-machine';

function css() {
  return `
/* ---- Abatimento (apps/abatimento/page.js) ---- */
.ab-hero{padding:8px 0 0}
.ab-hero h1{font-size:var(--text-display);max-width:17ch;letter-spacing:-.04em}
.ab-hero .deck{max-width:64ch}
.ab-trio{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:var(--radius-m);overflow:hidden;margin:40px 0 0}
.ab-trio > div{background:var(--sunk);padding:22px 24px;display:flex;flex-direction:column;gap:12px}
.ab-trio p{margin:0;color:var(--ink-3);font-size:var(--text-small);line-height:1.55}
@media (max-width:760px){.ab-trio{grid-template-columns:1fr}}
.ab-chip{display:inline-flex;align-items:center;font-family:var(--f-mono);font-size:.625rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;padding:.4em .85em;border-radius:var(--radius-pill);white-space:nowrap;align-self:flex-start;border:1px solid transparent}
.ab-chip.big{font-size:.8125rem;padding:.5em 1.05em}
.ab-chip.provado{background:var(--ink);color:var(--paper)}
.ab-chip.refutado{border-color:var(--ink-2);color:var(--ink)}
.ab-chip.recusado{border:1px dashed var(--ink-4);color:var(--ink-3)}
.ab-chip.nao{border:1px dotted var(--rule-strong);color:var(--ink-5)}
.ab-cta{display:flex;flex-wrap:wrap;gap:12px;margin:32px 0 0}
.ab-cta a{border:1px solid var(--rule-strong);border-radius:var(--radius-pill);padding:10px 18px;font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink)}
.ab-cta a.go{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.ab-cta a:hover{border-color:var(--ink)}
.ab-k{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-4);margin:0 0 10px}
.ab-arch{display:grid;grid-template-columns:1fr auto 1fr auto 1.5fr auto 1fr;align-items:stretch;gap:0;margin:8px 0 0}
.ab-st{background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius-m);padding:18px;display:flex;flex-direction:column;gap:8px}
.ab-st.core{border-color:var(--ink-3);background:var(--surface2)}
.ab-st.claim{border-style:dashed}
.ab-st h3{font-size:1.05rem;margin:0}
.ab-st p,.ab-st li{margin:0;font-size:var(--text-small);line-height:1.5;color:var(--ink-3)}
.ab-st ol{margin:4px 0 0;padding-left:18px}
.ab-st ol li{margin:0 0 6px;color:var(--ink-2)}
.ab-ar{display:flex;align-items:center;justify-content:center;padding:0 8px;color:var(--ink-4);font-family:var(--f-mono)}
.ab-ar::before{content:'\\2192'}
@media (max-width:1000px){.ab-arch{grid-template-columns:1fr}.ab-ar{padding:6px 0}.ab-ar::before{content:'\\2193'}}
/* the live registry */
.ab-reg{display:grid;grid-template-columns:minmax(220px,300px) minmax(0,1fr);gap:24px;align-items:start}
@media (max-width:900px){.ab-reg{grid-template-columns:1fr}}
.ab-cases{display:flex;flex-direction:column;gap:6px}
.ab-cases .ab-k{margin:14px 0 4px}
.ab-cases .ab-k:first-child{margin-top:0}
@media (max-width:900px){.ab-cases{flex-direction:row;flex-wrap:wrap}.ab-cases .ab-k{flex-basis:100%}}
.ab-case{font:inherit;text-align:left;cursor:pointer;background:var(--surface);color:var(--ink-2);border:1px solid var(--rule);border-radius:var(--radius-s);padding:10px 12px;display:flex;flex-direction:column;gap:3px}
.ab-case small{font-family:var(--f-mono);font-size:.625rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-4)}
.ab-case span{font-size:var(--text-small);line-height:1.35}
.ab-case:hover{border-color:var(--rule-strong)}
.ab-case[aria-pressed="true"]{border-color:var(--ink-3);background:var(--surface2);color:var(--ink)}
.ab-case:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.ab-rc{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.5fr);gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:var(--radius-m);overflow:hidden}
@media (max-width:760px){.ab-rc{grid-template-columns:1fr}}
.ab-common,.ab-cert{background:var(--sunk);padding:22px}
.ab-common{background:var(--paper)}
.ab-title{font-size:1.05rem;margin:0 0 6px;line-height:1.3}
.ab-status{font-style:italic;color:var(--ink-3);font-size:var(--text-small);line-height:1.5;margin:0 0 14px}
.ab-pred{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;align-items:baseline;border:1px dashed var(--ink-5);border-radius:var(--radius-s);padding:12px 14px}
.ab-pred span{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-4)}
.ab-pred b{font-style:italic;font-weight:400;color:var(--ink-3);font-size:var(--text-small);line-height:1.45}
table.ab-prem,table.ab-mini{border-collapse:collapse;width:100%;font-size:var(--text-small)}
table.ab-prem td,table.ab-mini td,table.ab-mini th{padding:5px 6px;border-top:1px solid var(--rule);vertical-align:top;color:var(--ink-2);line-height:1.35}
table.ab-prem td:first-child,table.ab-mini td:first-child{font-family:var(--f-mono);font-size:.75rem;color:var(--ink)}
table.ab-mini th{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-4);text-align:left;border-top:0}
pre.ab-formula{font-family:var(--f-mono);font-size:.75rem;line-height:1.5;color:var(--ink-2);white-space:pre-wrap;margin:0;background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius-s);padding:10px 12px}
.ab-vline{display:flex;flex-wrap:wrap;align-items:center;gap:12px}
.ab-means{color:var(--ink-2);font-size:var(--text-small)}
.ab-enc-t{font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink);margin:14px 0 4px}
svg.ab-nl{display:block;width:100%;height:auto;margin:4px 0 8px}
svg.ab-nl.narrow{display:none}
@media (max-width:560px){svg.ab-nl.wide{display:none}svg.ab-nl.narrow{display:block}}
.ab-nl .ab-axis{stroke:var(--c-axis);stroke-width:1}
.ab-nl .ab-enc{fill:var(--band-fill);stroke:var(--ink);stroke-width:1.5}
.ab-nl .ab-guide{stroke:var(--ink-3);stroke-width:1;stroke-dasharray:2 3}
.ab-nl .ab-claim{stroke:var(--ink-3);stroke-width:2;stroke-dasharray:5 4}
.ab-nl text{font-family:var(--f-mono);font-size:12px;fill:var(--ink-2)}
.ab-nl text.claim{font-style:italic;fill:var(--ink-3)}
.ab-nl text.dim{fill:var(--ink-4)}
ul.ab-checks{list-style:none;padding:0;margin:8px 0 0}
ul.ab-checks li{display:grid;grid-template-columns:118px minmax(0,1fr);gap:12px;padding:10px 0;border-top:1px solid var(--rule);align-items:start}
ul.ab-checks li .ab-chip{justify-self:start}
ul.ab-checks li b{display:block;color:var(--ink);font-weight:500;font-size:var(--text-small)}
ul.ab-checks li span{display:block;color:var(--ink-3);font-size:var(--text-small);line-height:1.5}
@media (max-width:560px){ul.ab-checks li{grid-template-columns:1fr;gap:6px}}
.ab-two{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:14px}
@media (max-width:560px){.ab-two{grid-template-columns:1fr}}
ul.ab-sens{list-style:none;margin:0;padding:0}
ul.ab-sens li{display:grid;grid-template-columns:120px 1fr 52px;gap:10px;align-items:center;padding:3px 0;font-size:var(--text-small)}
ul.ab-sens .k{font-family:var(--f-mono);font-size:.75rem;color:var(--ink)}
ul.ab-sens .bar{height:10px;background:var(--surface);border:1px solid var(--rule);border-radius:3px;overflow:hidden}
ul.ab-sens .bar i{display:block;height:100%;background:var(--ink-3)}
ul.ab-sens .n{font-family:var(--f-mono);font-size:.75rem;color:var(--ink-3);text-align:right}
.ab-flip{margin:12px 0 0;border:1px solid var(--rule-strong);border-radius:var(--radius-s);padding:12px 14px}
.ab-flip p{margin:0;color:var(--ink-2);font-size:var(--text-small);line-height:1.5}
.ab-wit{font-family:var(--f-mono);font-size:.72rem;color:var(--ink-3);line-height:1.5;margin:0}
.ab-run{margin-top:14px;font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-4);line-height:1.5}
.ab-agg,.ab-diff{background:var(--sunk);border:1px solid var(--rule);border-radius:var(--radius-m);padding:20px 22px;margin:0 0 14px}
.ab-form{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;margin:20px 0 0;padding:16px;border:1px dashed var(--ink-5);border-radius:var(--radius-m)}
.ab-form label{display:flex;flex-direction:column;gap:6px;font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-4)}
.ab-form input,.ab-form select{font:inherit;font-family:var(--f-mono);font-size:var(--text-small);width:150px;background:var(--sunk);color:var(--ink);border:1px solid var(--rule-strong);border-radius:var(--radius-s);padding:8px 10px;text-transform:none;letter-spacing:0}
.ab-form button{font:inherit;font-family:var(--f-mono);font-size:var(--text-small);cursor:pointer;background:var(--ink);color:var(--paper);border:0;border-radius:var(--radius-pill);padding:9px 18px}
.ab-form p{flex-basis:100%;margin:0;color:var(--ink-4);font-size:var(--text-small)}
.ab-ev{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
@media (max-width:900px){.ab-ev{grid-template-columns:1fr}}
.ab-ev > div{background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius-m);padding:22px;display:flex;flex-direction:column;gap:10px}
.ab-ev .big{font-family:var(--f-display);font-size:clamp(1.5rem,1.1rem + 1.2vw,2.2rem);color:var(--ink);letter-spacing:-.02em;line-height:1.05}
.ab-ev p{margin:0;color:var(--ink-3);font-size:var(--text-small);line-height:1.55}
.ab-sub{margin-top:56px}
.ab-req td:first-child{white-space:normal;font-family:var(--f-mono);font-size:.78rem;color:var(--ink)}
.ab-conf{display:inline-flex;align-items:center;gap:8px;font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3);margin:0 0 10px}
.ab-conf i{width:8px;height:8px;border-radius:50%;background:var(--ink-5);display:inline-block}
.ab-conf.ok i{background:var(--ink)}
`;
}

function build(N, bundleText, git) {
  const { D, br, pb, tbg } = N;
  const B = [];
  const NOTA = '/abatimento/registro-de-calculo-exemplo.pdf', DECK = '/abatimento/abatimento-apresentacao.pdf', PROP = '/abatimento/proposta-tecnica.pdf';
  const GL = { PROVADO: 'a classe (ou a afirmação) vale para toda premissa dentro do envelope declarado', REFUTADO: 'falha para toda premissa do envelope — a falha está provada, com as testemunhas', RECUSADO: 'o envelope contém pontos de ambos os lados; o registro nomeia a premissa a medir e a que largura' };
  const gl = (v) => RC.chip(v, true) + '<p class="ab-k">' + esc(GL[v]) + '</p>';
  const REF = {
    caderno: 'https://api.mziq.com/mzfilemanager/v2/d/25fdf098-34f5-4608-b7fa-17d60b2de47d/81e0b1ad-f62e-dcfe-bdfc-eca67a63c5c3?origin=2',
    cpsi: 'https://conexoes-inovacao.petrobras.com.br/conexoesinovacao/s/desafio/a6zU40000000LSfIAM/sistema-de-c%C3%A1lculo-de-potencial-de-abatimento-de-emiss%C3%B5es-escopo-1-e-2-abran',
    ipcc: 'https://www.ipcc-nggip.iges.or.jp/public/2006gl/pdf/2_Volume2/V2_2_Ch2_Stationary_Combustion.pdf',
    gwp: 'https://ghgprotocol.org/sites/default/files/2024-08/Global-Warming-Potential-Values%20%28August%202024%29.pdf',
    mcti: 'https://www.gov.br/mcti/pt-br/acompanhe-o-mcti/sirene/dados-e-ferramentas/fatores-de-emissao',
    wri: 'https://www.wri.org/research/estimating-and-reporting-comparative-emissions-impacts-products',
    contraprova: '/contraprova/', decidivel: '/decidivel/', janela: '/janela/'
  };
  const a = (k, t) => '<a href="' + REF[k] + '">' + esc(t) + '</a>';
  const vers = D.cenarios;
  const caseBtn = (c, i) => '<button type="button" class="ab-case" data-i="' + i + '" aria-pressed="' + (i === 1 ? 'true' : 'false') + '"><small>' + esc(c.categoria) + ' · v' + esc(c.versao) + ' · ' + esc(N.r(c.id, c.versao).verdict) + '</small><span>' + esc(c.titulo) + '</span></button>';
  const lead = N.c('tbg-ecomp', 2), leadR = N.r('tbg-ecomp', 2);

  /* ---- 0 · header ---- */
  B.push('<header class="col ab-hero">'
    + '<div class="eyebrow">Contraprova · Registro de Abatimento · proposta para a oportunidade CPSI 7004641677 (Aquisição de Soluções, Petrobras/CENPES)</div>'
    + '<h1>Cada potencial de abatimento do portfólio com envelope declarado, versão, rastro e recálculo — decidido, não estimado.</h1>'
    + '<p class="deck">A Curva MAC Integrada da Petrobras organiza mais de ' + br.int(pb.macc) + ' oportunidades de mitigação e o Fundo de Descarbonização aloca US$ ' + esc(pb.fundoUSD) + ' em 2026–30 por custo marginal e “quantidade total de GEE abatida” [1]. Cada oportunidade chega como um número: “≈ ' + br.int(pb.tbgClaim) + ' tCO₂e/ano”. O Registro de Abatimento é o sistema que guarda esse número com as premissas que o produziram, cada uma como faixa com fonte, e DECIDE sobre o envelope inteiro: a classe de potencial, a compatibilidade da afirmação, a soma sem dupla contagem, o que uma nova medição mudaria. O que não cabe no envelope o registro recusa, e diz o que medir.</p>'
    + '<div class="ab-trio">'
    + '<div>' + gl('PROVADO') + '<p>“Moderado” vale para toda combinação admissível das premissas — não no ponto médio, não em média.</p></div>'
    + '<div>' + gl('REFUTADO') + '<p>A classe afirmada não é alcançada por premissa alguma do envelope; ou a soma abate mais do que a fonte emite.</p></div>'
    + '<div>' + gl('RECUSADO') + '<p>O envelope atravessa um limiar da MACC: o registro diz qual premissa medir, com que erro, para decidir — o preço da informação.</p></div>'
    + '</div>'
    + '<div class="ab-cta"><a class="go" href="#registro">O registro ao vivo ↓</a><a href="' + PROP + '">Proposta Técnica (PDF)</a><a href="' + DECK + '">Apresentação (PDF)</a><a href="' + NOTA + '">Registro de cálculo de exemplo (PDF)</a><a href="#aderencia">Aderência ao edital</a></div>'
    + '</header>');

  B.push(C.stats([
    { k: 'a MACC integrada', v: '> ' + br.int(pb.macc), n: 'oportunidades de mitigação, em cinco categorias (eficiência, perdas, energia, processos, CCUS), cada uma com um potencial de abatimento em três classes [1, p. 51, 76]' },
    { k: 'o fundo que decide', v: 'US$ ' + esc(pb.fundoUSD), n: 'Fundo de Descarbonização 2026–30; em 2025, ' + pb.fundoOpp + ' oportunidades, ' + esc(pb.fundoCommitted) + ' comprometidos, ' + esc(pb.fundoMt) + ' tCO₂e/ano de potencial — alocados por custo marginal e GEE abatido [1, p. 52]' },
    { k: 'no demonstrador', v: N.versoes + ' versões decididas', n: N.cenarios + ' cenários em ' + N.fontes + ' fontes emissoras; ' + N.battery.fired + '/' + N.battery.reds + ' falhas injetadas pegas; a segunda implementação (Python, frações) concorda em ' + N.battery.refVersions + ' de ' + N.versoes },
    { k: 'o que a planilha imprime', v: br.int(tbg.mid) + ' → RECUSADO', n: 'o ponto médio das premissas da eletrificação da TBG cai em “Moderado”; o envelope [' + br.int(tbg.lo1) + '; ' + br.int(tbg.hi1) + '] atravessa 100 mil — medir o gás deslocado decide' }
  ]));

  /* ---- 1 · the problem ---- */
  B.push(C.section({ lab: '1 · o problema em números', title: 'A MACC decide por classes e o portfólio chega em pontos: um número sem envelope não diz em que classe está, nem o que mudaria de classe.',
    bodyRaw: '<div class="col">'
      + C.pRaw('O Caderno de Mudanças Climáticas 2025 classifica cada ação por potencial de abatimento — ' + esc(pb.classes) + ' — e publica os projetos como pontos: a eletrificação das estações de compressão da TBG “estima-se um abatimento de aproximadamente ' + br.int(pb.tbgClaim) + ' tCO₂e/ano”, a reliquefação do boil-off “aproximadamente ' + br.int(pb.bogClaim) + ' tCO₂e/ano” ' + a('caderno', '[1, p. 86]') + '. Declaradas as premissas que um engenheiro declararia (gás deslocado, fatores do IPCC com os seus limites de 95%, GWP do AR5 ao AR6, fator do SIN do MCTI), o envelope do primeiro é [' + br.int(tbg.lo1) + '; ' + br.int(tbg.hi1) + '] tCO₂e/ano: o número publicado está dentro, e a classe NÃO está decidida — o envelope atravessa 100 mil. O ponto médio dessas premissas, ' + br.int(tbg.mid) + ', cai em Moderado; é o que uma planilha imprime.')
      + C.pRaw('<b>O fator que ninguém declara.</b> O fator de emissão da eletricidade do SIN variou de 0,0215 (março) a 0,0289 tCO₂/MWh (abril) nos meses publicados de 2025 pelo MCTI ' + a('mcti', '[4]') + '; o fator implícito no reporte da própria Petrobras (' + br.int(pb.irecT) + ' tCO₂ neutralizados para ' + br.int(pb.irecMWh) + ' MWh) é ' + esc(pb.irecFactor) + ' ' + a('caderno', '[1, p. 116]') + '. Só esse fator leva a linha de escopo 2 de Incremental a Moderado: ' + br.int(N.irec.enclosure[0]) + ' a ' + br.int(N.irec.enclosure[1]) + ' tCO₂e. Nenhuma das duas escolhas é errada; a escolha é uma premissa, e o registro a guarda como tal.')
      + C.pRaw('<b>A soma que vale duas vezes.</b> Captura por amina e oxicombustão atuam sobre os mesmos gases exaustos de um FPSO: somadas, como uma planilha soma, dão [' + br.int(N.ccus.both.result.lo) + '; ' + br.int(N.ccus.both.result.hi) + '] tCO₂e/ano — mais do que a unidade emite no alto do envelope. Uma usina solar numa refinaria e a neutralização por I-REC atuam sobre o mesmo escopo 2. O edital pede “mecanismos para evitar dupla contagem” entre tecnologias concorrentes ' + a('cpsi', '[2]') + '; o registro os decide, não os recomenda.')
      + '</div>' }));

  /* ---- 2 · what exists, what is added ---- */
  B.push(C.section({ lab: '2 · o que já existe, e o que acrescenta', title: 'Planilhas de MACC, software de ACV e inventários produzem os números; o registro guarda cada um com envelope, versão e recálculo, e decide o que a soma e a classe suportam.',
    bodyRaw: '<div class="col">' + C.p('Nada é substituído: a MACC Integrada, o inventário, a ACV e o Fundo continuam como hoje. O registro entra como a camada de governança do número — o que o grupo 8 do edital pede: premissas rastreáveis, controle de versão de cenários e hipóteses, resultados reproduzíveis e auditáveis, suporte a revisões técnicas.') + '</div>'
      + C.table({ cols: [{ h: 'hoje' }, { h: 'entrega' }, { h: 'o que o registro acrescenta' }], rows: [
        ['Curva MAC Integrada (> 1.000 oportunidades) e Fundo de Descarbonização', 'um potencial e um custo marginal por oportunidade; a classe de impacto', 'o potencial como intervalo garantido sobre as premissas declaradas; a classe DECIDIDA (ou recusada, com o que medir)'],
        ['Planilhas de cálculo de abatimento', 'um número no ponto médio', 'o mesmo cálculo em todos os cantos do envelope, exato; as testemunhas que realizam o mínimo e o máximo'],
        ['Software de ACV (inventários de ciclo de vida)', 'emissões incorporadas e evitadas por unidade funcional', 'nada é recalculado: o resultado da ACV entra como faixa declarada com o estudo pinado; a separação operacional / ACV é mantida no registro'],
        ['Inventário de GEE (escopos 1, 2 e 3)', 'o reporte do ano', 'a fonte emissora de cada cenário com a sua emissão declarada: a soma dos abatimentos de uma fonte não pode exceder o que ela emite'],
        ['Análise de sensibilidade e Monte Carlo', 'uma distribuição, uma probabilidade', 'a parcela da largura que cada premissa explica e o PREÇO DA INFORMAÇÃO: medir qual premissa, com que erro, decide'],
        ['Revisão técnica e auditoria', 'o julgamento, meses depois, refazendo o estudo', 'o registro de cálculo: um arquivo, um comando, a segunda implementação — reexecutável sem o nosso código']
      ] })
      + '<div class="col"><p class="scope"><b>Glossário.</b> Envelope declarado: as faixas das premissas, com fonte. Classe: as faixas de potencial da própria MACC (Nota 1 das tabelas do Caderno). Testemunha: o canto do envelope que realiza um extremo, verificado em aritmética exata. Preço da informação: a medição que decide. Fonte emissora: o que o cenário abate, com a sua emissão anual declarada.</p></div>' }));

  /* ---- 3 · how it decides ---- */
  B.push(C.section({ lab: '3 · como decide', title: 'Premissas como faixas com fonte; a forma multilinear avaliada em todos os cantos, em racionais exatos; a classe, a afirmação e a soma decididas; o que decidiria, nomeado.',
    bodyRaw: '<div class="wide"><div class="ab-arch">'
      + '<div class="ab-st"><div class="ab-k">registro</div><h3>O cenário, versionado</h3><p>Fonte emissora, categoria da MACC, premissas como faixas com unidade e fonte (IPCC, GHG Protocol, MCTI, o estudo de ACV, a medição), a fórmula como soma de produtos de premissas, a implantação técnica e a acordada por ano, a afirmação publicada.</p></div><div class="ab-ar" aria-hidden="true"></div>'
      + '<div class="ab-st claim"><div class="ab-k">quem propõe</div><h3>A planilha · a ACV · o estudo · a área</h3><p>Um número e as premissas que o produziram. O registro não refaz a ACV nem o inventário: decide sobre o que foi declarado, e guarda cada versão.</p></div><div class="ab-ar" aria-hidden="true"></div>'
      + '<div class="ab-st core"><div class="ab-k">o método</div><h3>Garantia sobre o envelope inteiro</h3><ol>'
      + '<li><b>Forma multilinear</b>: abatimento = Σ sinal × fator × Π premissas, cada premissa não negativa e uma vez por termo. Os extremos de uma forma assim ficam nos cantos do envelope — um teorema, não uma amostra.</li>'
      + '<li><b>Cantos em racionais exatos</b> (BigInt): 2ⁿ avaliações, nenhum float participa de um veredito; o mínimo e o máximo vêm com os cantos que os realizam.</li>'
      + '<li><b>Decisões</b>: a classe contra os limiares declarados; a afirmação publicada dentro ou fora; a soma com auditoria de dupla contagem e de excesso sobre a fonte; o diff entre versões.</li>'
      + '<li><b>Preço da informação</b>: a parcela da largura por premissa e a medição que decide, por bisseção exata.</li></ol></div><div class="ab-ar" aria-hidden="true"></div>'
      + '<div class="ab-st"><div class="ab-k">o que sai</div><h3>Registro de cálculo</h3><div class="ab-vline">' + RC.chip('PROVADO') + RC.chip('REFUTADO') + RC.chip('RECUSADO') + '</div><p>Veredito, intervalo, classes, afirmação, por escopo, implantação, sensibilidade, testemunhas, diff da versão anterior, sha256 de cada módulo e do registro, e o comando que refaz tudo.</p></div>'
      + '</div></div>'
      + '<div class="col">' + C.pRaw('<b>Verificação.</b> Uma segunda implementação em Python (biblioteca padrão, <code>fractions</code>, sem código em comum) recalcula o intervalo e as classes de todas as ' + N.versoes + ' versões: concordância exata em ' + N.battery.refVersions + ' de ' + N.versoes + '. ' + br.int(N.battery.interior) + ' pontos interiores sorteados caem dentro dos intervalos. ' + N.battery.fired + ' de ' + N.battery.reds + ' falsificações são recusadas: uma premissa com mínimo acima do máximo, uma premissa negativa, uma premissa usada duas vezes num termo (a regra dos cantos não vale), uma fração de implantação acima de 1, uma afirmação uma unidade fora do intervalo, um limiar uma unidade dentro do intervalo, duas tecnologias exclusivas somadas, uma soma que abate mais do que a fonte emite, e o ponto médio em float que imprime uma classe que o envelope não sustenta.')
      + C.pRaw('<b>Fora desta versão, dito aqui.</b> Fórmulas que não são multilineares (razões com premissas compartilhadas entre numerador e denominador, curvas de desempenho) entram na E3 do plano por aritmética intervalar com arredondamento para fora — um intervalo garantido, não necessariamente o mais apertado, e marcado como tal. A ACV não é calculada: entra como faixa declarada com o estudo pinado. O escopo 3 entra por categorias, como faixas declaradas, como o edital admite.')
      + '</div>' }));

  /* ---- 4 · the live registry ---- */
  const rows = vers.map(caseBtn);
  const diffs = N.ledger.diffs.map((d) => RC.diffHtml(d)).join('');
  const aggs = N.aggs.map((g) => RC.aggregateHtml(g, g.result)).join('');
  B.push('<section id="registro"><div class="col sec-head"><div class="lab">4 · demonstração</div><h2>Oito versões em quatro fontes emissoras: cada uma decidida sobre o envelope, re-decidida agora no seu navegador.</h2></div>'
    + '<div class="col">' + C.pRaw('Os fatores físicos são tabelas públicas pinadas por sha256 (IPCC 2006 com os seus limites de 95% ' + a('ipcc', '[3]') + ', GWP do GHG Protocol ' + a('gwp', '[5]') + ', fator do SIN do MCTI ' + a('mcti', '[4]') + ', o Caderno 2025 da Petrobras ' + a('caderno', '[1]') + '); os dados de atividade (gás deslocado, MWh, CO₂ capturado) são faixas ILUSTRATIVAS, típicas da classe de ativo, e dizem isso na própria linha. Os da Petrobras entram no piloto. Escolha uma versão.') + '<div class="ab-conf" id="ab-conf"><i></i><span>conferindo no seu navegador…</span></div></div>'
    + '<div class="wide"><div class="ab-reg">'
    + '<div class="ab-cases" role="group" aria-label="Versões"><div class="ab-k">cenários · versões</div>' + rows.join('') + '</div>'
    + '<div id="ab-panel" aria-live="polite">' + RC.receiptHtml(lead, leadR, D.classes, 'registro publicado · build ' + git) + '</div>'
    + '</div></div>'
    + '<div class="wide"><form class="ab-form" id="ab-form" autocomplete="off">'
    + '<label>premissa<select name="k">' + Object.keys(lead.premissas).map((k) => '<option value="' + esc(k) + '"' + (k === 'gas_tj' ? ' selected' : '') + '>' + esc(k) + '</option>').join('') + '</select></label>'
    + '<label>mínimo<input name="lo" inputmode="decimal" value="1600"></label>'
    + '<label>máximo<input name="hi" inputmode="decimal" value="2400"></label>'
    + '<button type="submit">Re-decidir esta versão</button>'
    + '<p>Mude uma faixa da versão escolhida — o mesmo registro, as mesmas classes. O veredito sai em milissegundos, na sua máquina, com as testemunhas.</p></form></div>'
    + '<div class="col sec-head ab-sub"><h3>Versões: o que mudou da v1 para a v2 da TBG, e o que isso fez ao número</h3></div>'
    + '<div class="col">' + C.p('A v1 estima o gás deslocado por potência instalada e fator de carga; a v2 lê doze meses de medição fiscal. Nada mais mudou. O registro guarda as duas, e o diff é parte do registro — o que o edital chama de controle de versão de cenários e hipóteses.') + '</div>'
    + '<div class="col">' + diffs + '</div>'
    + '<div class="col sec-head ab-sub"><h3>Agregação com auditoria: o que pode e o que não pode ser somado</h3></div>'
    + '<div class="col">' + C.p('Quatro somas. Duas o registro recusa: tecnologias exclusivas sobre a mesma fonte, e a mesma eletricidade abatida duas vezes. Duas ele prova: fontes distintas, uma escolha por fonte. A soma recusada nunca vira potencial do portfólio.') + '</div>'
    + '<div class="col">' + aggs + '</div>'
    + '<div class="col sec-head ab-sub"><h3>Monte Carlo e ponto médio, cara a cara, no mesmo cenário</h3></div>'
    + '<div class="wide"><div class="ab-ev">'
    + '<div class="claim"><div class="ab-k">o que a planilha imprime</div><div class="big">' + br.int(tbg.mid) + ' tCO₂e/ano</div><p>O ponto médio de cada premissa da TBG v1. Cai em Moderado. Nenhuma premissa individual é absurda; a classe não é sustentada pelo envelope.</p></div>'
    + '<div><div class="ab-k">o que o registro garante</div><div class="big">[' + br.int(tbg.lo1) + '; ' + br.int(tbg.hi1) + ']</div><p>Para toda premissa declarada. A afirmação publicada (' + br.int(pb.tbgClaim) + ') está dentro; a classe atravessa 100 mil: RECUSADO, com o que medir.</p></div>'
    + '<div><div class="ab-k">o que decide</div><div class="big">' + esc(tbg.dom.premissa) + ' · ' + esc(tbg.dom.parcelaPct) + '%</div><p>' + esc(tbg.preco.texto) + '. A v2, com a medição, é PROVADO Moderado: [' + br.int(tbg.lo2) + '; ' + br.int(tbg.hi2) + '].</p></div>'
    + '</div></div>'
    + '</section>');

  /* ---- 5 · requirement by requirement ---- */
  B.push('<section id="aderencia"><div class="col sec-head"><div class="lab">5 · aderência ao edital</div><h2>Os oito grupos de requisitos da oportunidade 7004641677, um a um: o que o registro faz e onde está a evidência nesta página.</h2></div>'
    + '<div class="col">' + C.pRaw('O texto do desafio está no portal Conexões para Inovação ' + a('cpsi', '[2]') + ' (módulo Aquisição de Soluções, propostas até 19/10/2026). Cada linha abaixo cita o item do edital e aponta para a seção ou o artefato que o atende; o que ainda não existe diz “plano”.') + '</div>'
    + '<div class="wide">' + C.table({ cols: [{ h: 'requisito do edital' }, { h: 'o que o registro faz' }, { h: 'evidência' }], rows: [
      ['1. Escopo e posicionamento: apoio à decisão em descarbonização (não inventário); alinhado à decisão de investimento e ao roadmap; gera relatório', 'o objeto é a decisão sobre cada potencial (classe, soma, ranking) e o seu registro; relatórios e apresentações gerados dos registros, nunca o contrário', 'esta página; a apresentação e o registro de cálculo são impressos dos mesmos registros (§3, §4)'],
      ['2. Lógica de abatimento: baseline × cenário com solução; potencial relativo a cenários; unidade funcional; transparência no escalonamento', 'a fórmula é a diferença declarada entre o que se emite e o que se passa a emitir, por unidade funcional, em termos assinados; a implantação técnica e a acordada são frações por ano', 'termos e implantação no registro de cada versão (§4); E1 do plano para os cenários da Petrobras'],
      ['3. Ciclo de vida e emissões não operacionais: incorporadas; cradle-to-grave; separação operacional / ACV; fronteiras e premissas transparentes e ajustáveis', 'a ACV entra como faixa declarada com o estudo pinado, marcada “ACV” e somada à parte (nunca se mistura com o operacional); fronteiras e premissas são o próprio registro', 'o tipo “acv” dos termos e o quadro por escopo (§4); E3 do plano'],
      ['4. Escopos 1, 2, 3 e evitadas: escopos 1 e 2 identificados; escopo 3 flexível por categorias; evitadas representadas; sem dupla contagem entre tecnologias concorrentes; níveis tecnologia → iniciativa → portfólio → área → Petrobras', 'cada termo carrega o escopo; o quadro por escopo é decidido à parte; a agregação em qualquer nível é uma soma exata com a auditoria de exclusividade e de excesso sobre a fonte', 'quatro agregações (§4): duas recusadas por dupla contagem, duas provadas; E2 do plano para os níveis'],
      ['5. TRL, incerteza e tecnologias emergentes (crítico para o CENPES): aceita intervalos em vez de valores únicos; premissas documentadas; cenários e sensibilidade; detalhe conforme o TRL', 'toda premissa é um intervalo com fonte; a decisão vale para o intervalo inteiro; a sensibilidade é a parcela da largura por premissa; o preço da informação diz o que medir; o detalhe acompanha o TRL porque a largura o acompanha', 'o núcleo do método (§3) e cada registro (§4): “de onde vem a largura” e “o que decidiria”'],
      ['6. Escalonamento e envelopes de potencial: potencial técnico máximo; potencial acordado; a diferença visível; ramp-up temporal', 'implantação técnica e acordada como frações por ano, cada uma um intervalo; a diferença é o próprio quadro', 'o quadro “implantação” de cada registro (§4)'],
      ['7. Alinhamento com métodos e dados internos: roadmap de descarbonização; nível de caixa-preta aceitável', 'o registro é caixa aberta: cada número vem com a fórmula, as premissas e o comando que o refaz; os dados do roadmap entram como premissas declaradas, nas unidades da Petrobras', 'E1 e E4 do plano (importação dos cenários e das unidades; roda no ambiente da Petrobras)'],
      ['8. Governança, rastreabilidade e auditoria: premissas documentadas e rastreáveis; controle de versão de cenários e hipóteses; resultados reproduzíveis e auditáveis; revisões e discussões técnicas', 'o registro é append-only com sha256 de cada entrada e de cada fonte; o diff entre versões é parte do registro; cada número se refaz com um comando e é conferido por uma segunda implementação sem código em comum; notas de revisão presas à versão', 'o diff v1 → v2, a segunda implementação, o registro de cálculo em PDF (§4); “conferido no seu navegador” no alto desta seção']
    ] }) + '</div>'
    + '</section>');

  /* ---- 6 · value ---- */
  B.push(C.section({ lab: '6 · caso de valor', title: 'Onde o registro entra: a alocação do Fundo, a priorização da MACC, o reporte do Caderno e a auditoria — e o que custa um “Moderado” que o envelope não sustenta.',
    bodyRaw: C.table({ cols: [{ h: 'decisão da Petrobras' }, { h: 'o que está em jogo' }, { h: 'o que muda com o registro' }, { h: 'evidência no demonstrador' }], rows: [
      ['Alocar o Fundo de Descarbonização (US$ 1,0 bi, 2026–30) por custo marginal e GEE abatido [1, p. 52]', 'uma oportunidade classificada acima da sua classe real desloca capital de outra que a alcançaria', 'a classe só é PROVADA quando vale no envelope inteiro; a RECUSADA vem com a medição que a decide, antes do aporte', 'TBG v1 RECUSADO → medir o gás deslocado → v2 PROVADO Moderado'],
      ['Priorizar na MACC Integrada (> 1.000 oportunidades)', 'o ranking entre duas oportunidades com envelopes que se cruzam é uma escolha, não um resultado', 'o ranking só é decidido onde os intervalos se separam; onde se cruzam, o registro diz quanto cada premissa precisa estreitar', 'amina × oxicombustão: [' + br.int(N.ccus.amina.enclosure[0]) + '; ' + br.int(N.ccus.amina.enclosure[1]) + '] e [' + br.int(N.ccus.oxi.enclosure[0]) + '; ' + br.int(N.ccus.oxi.enclosure[1]) + '] — não separáveis'],
      ['Somar o potencial de um ativo, de uma área, da Petrobras', 'tecnologias concorrentes sobre a mesma fonte somadas; o mesmo escopo 2 abatido duas vezes', 'a soma recusada não vira potencial; a soma provada cabe na emissão da fonte', 'FPSO X: amina + oxicombustão RECUSADO; amina + FGRU PROVADO; solar + I-REC RECUSADO'],
      ['Publicar números no Caderno e nos relatórios regulados (SBCE, ISSB)', 'um ponto publicado sem envelope é indefensável quando o fator muda (o do SIN variou 0,0215–0,0289 em quatro meses de 2025)', 'cada número publicado tem o seu registro: envelope, versão, fontes pinadas, comando de recálculo', 'a afirmação de 142 mil COMPATÍVEL com o envelope; a linha I-REC RECUSADA só pelo fator'],
      ['Auditar, meses ou anos depois', 'refazer o estudo; descobrir que a planilha mudou', 'refazer o registro: um arquivo, um comando, a segunda implementação; o diff diz o que mudou e quando', 'cada versão re-decidida no navegador; ' + N.battery.refVersions + '/' + N.versoes + ' na segunda implementação']
    ] })
    + '<div class="col">' + C.pRaw('<b>Frequência e dono da decisão.</b> A do Programa Carbono Neutro: cada ciclo da MACC, cada rodada do Fundo, cada versão do Caderno; os donos são a gerência do programa, as áreas que propõem e o CENPES que avalia o TRL. O registro não decide por eles: entrega o que cada número sustenta.') + '</div>' }));

  /* ---- 7 · work plan ---- */
  B.push('<section id="plano"><div class="col sec-head"><div class="lab">7 · plano de trabalho</div><h2>Doze meses no formato do CPSI: os cenários da Petrobras no registro em três meses; a face de revisão e a agregação por níveis em seis; a auditoria pelo CENPES e a entrega em doze.</h2></div>'
    + '<div class="col">' + C.pRaw('<b>Objetivo geral.</b> Entregar ao CENPES um sistema que guarda cada potencial de abatimento do portfólio com envelope, versão e rastro, decide classe, afirmação e soma sobre o envelope, e se refaz com um comando — rodando no ambiente da Petrobras, com os seus dados, nas suas unidades.') + '</div>'
    + C.table({ cols: [{ h: 'entrega' }, { h: 'meses', cls: 'n' }, { h: 'o que entrega' }, { h: 'critério de aceitação' }], rows: [
      ['E1 · o esquema e a importação', '1–3', 'o esquema do cenário nas unidades e categorias da MACC; importação de planilhas e do roadmap (CSV/Excel) para registros versionados; 20 cenários reais registrados com as áreas', 'os 20 cenários re-decididos pela segunda implementação sem divergência; cada premissa com fonte'],
      ['E2 · agregação por níveis e dupla contagem', '3–5', 'tecnologia → iniciativa → portfólio → área → Petrobras como somas exatas; a declaração de exclusividade e de fonte emissora; a auditoria de excesso', 'nenhuma soma publicada sem auditoria; os casos de exclusividade levantados com o Programa Carbono Neutro recusados'],
      ['E3 · ACV, escopo 3 e fórmulas não multilineares', '4–7', 'termos “ACV” com o estudo pinado; escopo 3 por categorias; aritmética intervalar para razões e curvas, marcada “intervalo externo”', 'a separação operacional / ACV visível em todo registro; nenhum termo ACV somado ao operacional'],
      ['E4 · a face de revisão', '5–8', 'diff entre versões; notas de revisão presas à versão; sensibilidade e preço da informação; relatórios e apresentações gerados dos registros', 'um revisor do CENPES refaz um registro a partir do PDF sem falar conosco'],
      ['E5 · implantação no ambiente da Petrobras', '7–10', 'contêiner e repositório no ambiente da Petrobras; sem dependência de nuvem nossa; carimbo de tempo externo opcional (RFC 3161)', 'o sistema roda e refaz os registros no ambiente da Petrobras'],
      ['E6 · auditoria e entrega', '10–12', 'rerun independente pelo CENPES com o kit; manual; treinamento; o plano de fornecimento em escala', 'o rerun do CENPES reproduz cada número publicado; aceite formal']
    ] })
    + '<div class="col">' + C.pRaw('<b>Marcos e portões.</b> M0 kick-off e acesso aos cenários; M3 os 20 cenários registrados (portão: a segunda implementação concorda); M6 a agregação por níveis (portão: as somas auditadas); M9 a face de revisão e o contêiner no ambiente da Petrobras; M12 o rerun do CENPES. Um portão vermelho para o cronograma até ficar verde — a regra que já governa os nossos registros públicos.') + '</div>'
    + '</section>');

  /* ---- 8 · risks, business, IP ---- */
  B.push(C.section({ lab: '8 · riscos, modelo de negócio, implantação', title: 'O maior risco técnico é a fórmula de um cenário não ser multilinear; o maior risco de adoção é o registro parecer uma ferramenta de inventário. Os dois têm resposta no plano.',
    bodyRaw: C.table({ cols: [{ h: 'risco' }, { h: 'efeito' }, { h: 'mitigação' }, { h: 'onde' }], rows: [
      ['Fórmulas que não são multilineares (razões, curvas de desempenho)', 'a regra dos cantos não vale', 'aritmética intervalar com arredondamento para fora, marcada “intervalo externo”; a regra dos cantos onde vale', 'E3'],
      ['Premissas sem fonte ou sem faixa (um ponto)', 'um envelope degenerado decide tudo e não garante nada', 'o esquema exige faixa e fonte; um ponto é uma faixa de largura zero e é marcado como tal', 'E1'],
      ['Os dados de ACV não existem para a tecnologia', 'o termo ACV fica em aberto', 'o termo ACV entra como SEM DADOS, e o registro diz qual estudo o fecharia — a opacidade medida, não escondida', 'E3'],
      ['A soma por níveis esconde exclusividades não declaradas', 'dupla contagem silenciosa', 'a fonte emissora é obrigatória; a auditoria de excesso pega a soma que ultrapassa a fonte mesmo sem a declaração', 'E2'],
      ['Adoção: “parece um inventário”', 'o sistema é avaliado pelo critério errado', 'o objeto é a decisão (classe, soma, ranking), dito na primeira linha; o inventário é uma entrada', 'E4'],
      ['Equipe de um fundador', 'continuidade', 'o código é aberto (MIT), o kit de rerun é entregue, a segunda implementação é independente; um parceiro acadêmico para a ACV é cotado na proposta', 'E6']
    ] })
    + '<div class="col">' + C.pRaw('<b>Modelo de negócio.</b> Fase de PD&I: contrato de inovação de 12 meses (CPSI), com os cenários reais do Programa Carbono Neutro. Depois: licença de uso do sistema no ambiente da Petrobras com manutenção e evolução anual (novas categorias da MACC, novas fontes pinadas, novos limiares), e o registro de cálculo como anexo dos relatórios regulados. A escalabilidade é a do portfólio: o mesmo registro serve às oportunidades do E&P, do Refino, de Gás e Energia e às futuras do SBCE.')
    + C.pRaw('<b>Propriedade intelectual e dados.</b> O núcleo (a aritmética exata, o decisor, a segunda implementação) é software livre já publicado; o que for desenvolvido no projeto segue a regra do módulo. Os dados da Petrobras não saem do seu ambiente: o sistema roda lá, e nenhum número da Petrobras aparece nesta página — os dados de atividade aqui são ilustrativos e dizem isso.')
    + C.pRaw('<b>Implantação ao final — o critério de sucesso.</b> No M12, um engenheiro do CENPES abre um registro, muda uma premissa, lê o novo veredito com as testemunhas, imprime o registro de cálculo, e um colega o refaz com o comando. Sem nós na sala.') + '</div>' }));

  /* ---- 9 · maturity, team ---- */
  B.push(C.section({ lab: '9 · maturidade e equipe', title: 'TRL 4 com evidência pública: o mesmo motor já decide números de engenharia, de geofísica e de operações offshore em páginas públicas, cada um com registro, segunda implementação e falhas injetadas.',
    bodyRaw: '<div class="col">'
      + C.pRaw('<b>TRL 4, CRL 3.</b> O núcleo aritmético (racionais exatos, intervalos com arredondamento para fora, decisor de três palavras, registro append-only, segunda implementação sem código em comum) está em produção pública desde agosto de 2026: a ' + a('contraprova', 'Contraprova') + ' decide números de injeção de água e valores de projeto metoceânicos; o ' + a('decidivel', 'Decidível') + ' decide a detectabilidade de sísmica 4D sobre caixas inteiras; a ' + a('janela', 'Janela') + ' decide janelas operacionais offshore sobre bandas de erro medidas por satélite, com um livro-razão graduado diariamente. Este demonstrador aplica o mesmo motor ao potencial de abatimento: ' + N.versoes + ' versões, ' + N.battery.checks + ' verificações, ' + N.battery.fired + ' de ' + N.battery.reds + ' falsificações recusadas, ' + N.battery.refVersions + ' de ' + N.versoes + ' versões conferidas pela segunda implementação.')
      + C.pRaw('<b>Equipe.</b> Carlos Toledo, fundador: design industrial, direção de arte e desenvolvimento; ex-EmbraerX (inovação corporativa e aviação). Um parceiro acadêmico para a ACV e os inventários será nomeado quando concordar em sê-lo. Verificação independente é o posicionamento da casa: nenhum código é compartilhado com quem propõe o número.')
      + C.pRaw('<b>Contato.</b> <a href="mailto:carlos@carlostoledo.co">carlos@carlostoledo.co</a> · <a href="' + PROP + '">proposta técnica (PDF)</a> · <a href="' + DECK + '">apresentação (PDF)</a> · <a href="' + NOTA + '">registro de cálculo de exemplo (PDF)</a> · <a href="' + REPO + '/tree/main/apps/abatimento">código e registros</a>.')
      + C.pRaw('<span class="scope">Demonstrador com fatores públicos pinados e dados de atividade ilustrativos — não dados da Petrobras. Um PROVADO fala do envelope declarado, não do mundo: estreitar uma faixa é uma medição, e o registro diz qual.</span>')
      + '</div>' }));

  /* ---- 10 · the ask ---- */
  B.push(C.section({ lab: '10 · o pedido', title: 'Primeiro passo: vinte cenários reais da MACC Integrada, nas unidades da Petrobras, registrados e decididos em três meses — no ambiente da Petrobras.',
    bodyRaw: '<div class="col">' + C.p('É o pedido que um gerente do Programa Carbono Neutro consegue aprovar sozinho: vinte oportunidades já avaliadas, com as suas planilhas e premissas, importadas para o registro; cada uma com envelope, classe decidida ou recusada com a medição que decide, e o diff para a versão seguinte. O que a Petrobras leva no M3: a lista das oportunidades cuja classe o envelope não sustenta, e o que medir em cada uma.')
      + C.pRaw('<b>O que esta versão não faz, dito aqui.</b> Não calcula ACV nem inventário. Não trata fórmulas não multilineares (E3). Não tem os dados da Petrobras: os números desta página são ilustrativos onde dizem sê-lo, e cada fator físico tem fonte e sha256. Não substitui a MACC, o Fundo nem o Caderno — guarda e decide os números que eles produzem.') + '</div>' }));

  /* ---- references ---- */
  B.push(C.section({ lab: 'referências', title: 'Referências citadas',
    bodyRaw: '<div class="col">' + C.p('Cada número desta página aponta para uma destas fontes ou para o registro do próprio demonstrador (apps/abatimento/data/registro-ledger.json). As fontes em PDF estão pinadas por sha256 em corpus/sources/PINS.json.')
      + '<ol class="refs">'
      + '<li>Petrobras. <a href="' + REF.caderno + '">Caderno de Mudanças Climáticas e Transição Energética 2025</a> (edição de 2026; PDF criado em 13/05/2026, sha256 faab42c2…). Compromissos p. 9 e 45; Curva MAC Integrada e Fundo de Descarbonização p. 51–52; Nota 1 das tabelas de ações p. 76, 86, 87; TBG p. 86; desempenho em carbono p. 116–118.</li>'
      + '<li>Petrobras, Conexões para Inovação. <a href="' + REF.cpsi + '">Oportunidade 7004641677 — Sistema de cálculo de potencial de abatimento de emissões (Escopo 1 e 2 abrangendo Emissões Evitadas, Escopo 3 e ACV) de portifólio de Centro de Pesquisas e Desenvolvimentos</a>, módulo Aquisição de Soluções; Petronect, recebimento de propostas 16/09/2026 a 19/10/2026 17:00.</li>'
      + '<li>IPCC. <a href="' + REF.ipcc + '">2006 IPCC Guidelines for National Greenhouse Gas Inventories, Vol. 2, Ch. 2 Stationary Combustion</a>, Table 2.2 (gás natural: CO₂ 56 100 kg/TJ, 54 300–58 300; CH₄ 1 kg/TJ, 0,3–3; N₂O 0,1 kg/TJ, 0,03–0,3). sha256 a25d9f96…</li>'
      + '<li>MCTI/SIRENE. <a href="' + REF.mcti + '">Fatores médios mensais de emissão de CO₂ do SIN</a>, 2025 (jan 0,0237; fev 0,0248; mar 0,0215; abr 0,0289 tCO₂/MWh), com a revisão metodológica de 2025 — valores lidos em nota de imprensa e nota técnica citadas pela imprensa; o arquivo oficial entra pinado no piloto.</li>'
      + '<li>GHG Protocol. <a href="' + REF.gwp + '">Global Warming Potential Values (August 2024)</a>: CH₄ 28 (AR5, não fóssil) / 30 (AR5, fóssil) / 27,0 e 29,8 (AR6); N₂O 265 (AR5) / 273 (AR6). sha256 5f0bbd46…</li>'
      + '<li>WRI. <a href="' + REF.wri + '">Estimating and Reporting the Comparative Emissions Impacts of Products</a> (2019) — o quadro de referência para “emissões evitadas” como diferença entre cenários, inclusive negativa.</li>'
      + '<li>IEEE 1788-2015, Standard for Interval Arithmetic; Moore, Kearfott & Cloud, Introduction to Interval Analysis (SIAM, 2009) — a aritmética com arredondamento para fora da E3.</li>'
      + '</ol></div>' }));

  return TPL.render({
    title: 'Registro de Abatimento — Contraprova para a CPSI 7004641677',
    desc: 'Cada potencial de abatimento com envelope declarado, versão, rastro e recálculo: a classe da MACC, a afirmação publicada e a soma sem dupla contagem decididas sobre o envelope inteiro, em aritmética exata. Proposta para a oportunidade Petrobras 7004641677.',
    path: '/abatimento/', lang: 'pt-BR', sheet: 'report',
    bodyRaw: B.join('\n'),
    cssRaw: css(),
    scriptRaw: '<script>' + bundleText + `
(function(){
  var X = self.ABATIMENTO, A = X.A, RC = X.RC, D = X.D, PUB = ${JSON.stringify(N.ledger.receipts.map((r) => ({ id: r.id, versao: r.versao, enc: r.receipt.enclosure, v: r.receipt.verdict })))};
  var panel = document.getElementById('ab-panel'), form = document.getElementById('ab-form'), conf = document.getElementById('ab-conf');
  var btns = Array.prototype.slice.call(document.querySelectorAll('.ab-case'));
  var cur = 1;
  /* re-decide every published version and compare with the record the page states */
  try {
    var okAll = true, t0 = performance.now();
    for (var i = 0; i < D.cenarios.length; i++) { var c = D.cenarios[i], r = A.decide(c, D.classes); var p = PUB.filter(function(q){ return q.id === c.id && q.versao === c.versao; })[0]; if (!p || p.enc[0] !== r.enclosure[0] || p.enc[1] !== r.enclosure[1] || p.v !== r.verdict) okAll = false; }
    conf.className = 'ab-conf' + (okAll ? ' ok' : ''); conf.querySelector('span').textContent = okAll ? 'conferido no seu navegador: as ' + D.cenarios.length + ' versões re-decididas em ' + Math.max(1, Math.round(performance.now() - t0)) + ' ms coincidem com o registro publicado' : 'ATENÇÃO: uma versão re-decidida aqui difere do registro publicado';
  } catch (e) { conf.querySelector('span').textContent = 'não foi possível re-decidir aqui: ' + e.message; }
  function show(i, c) {
    cur = i; var cc = c || D.cenarios[i]; var t0 = performance.now(); var r = A.decide(cc, D.classes); var ms = performance.now() - t0;
    panel.innerHTML = RC.receiptHtml(cc, r, D.classes, (c ? 'decidido' : 'refeito') + ' agora no seu navegador em ' + Math.max(1, Math.round(ms)) + ' ms · ' + r.cantos + ' cantos em racionais exatos');
    btns.forEach(function(b){ b.setAttribute('aria-pressed', String(Number(b.dataset.i) === i)); });
    if (!c) { var sel = form.querySelector('select[name=k]'); sel.innerHTML = Object.keys(cc.premissas).map(function(k){ return '<option value="' + k + '">' + k + '</option>'; }).join(''); var k0 = Object.keys(cc.premissas)[0]; form.lo.value = cc.premissas[k0].lo; form.hi.value = cc.premissas[k0].hi; }
  }
  btns.forEach(function(b){ b.addEventListener('click', function(){ show(Number(b.dataset.i)); }); });
  form.querySelector('select[name=k]').addEventListener('change', function(){ var cc = D.cenarios[cur], k = this.value; form.lo.value = cc.premissas[k].lo; form.hi.value = cc.premissas[k].hi; });
  form.addEventListener('submit', function(ev){ ev.preventDefault(); var cc = JSON.parse(JSON.stringify(D.cenarios[cur])); var k = form.k.value; cc.premissas[k] = Object.assign({}, cc.premissas[k], { lo: form.lo.value.replace(',', '.'), hi: form.hi.value.replace(',', '.') }); cc.mudanca = 'faixa de ' + k + ' alterada por você para [' + form.lo.value + '; ' + form.hi.value + ']'; try { show(cur, cc); } catch (e) { panel.innerHTML = '<p class="ab-status">' + e.message.replace(/</g, '&lt;') + '</p>'; } });
})();</script>`
  });
}
module.exports = { build, css };
