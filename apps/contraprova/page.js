/* page.js — /contraprova/: the product face (pt-BR). Every number is read by
   numbers.js from the record that decided it; every receipt is drawn by
   receipt.js, the same function the reader's tab re-runs. The rigor lives one
   click down (the doctrine: product words on the surface, the verdict,
   enclosure and witness underneath). apps/contraprova · cert-machine     MIT */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const RC = require('./receipt.js');
const { br } = require('./numbers.js');

const esc = C.esc;
const REPO = 'https://github.com/carlostoledo1891/cert-machine';
/* the academic partner line — ABSENT until the partner agrees to be named
   (data/partner.json: { "line": "..." }); nothing about a contact is written
   anywhere on the page before that */
const PARTNER = (() => { try { return JSON.parse(require('fs').readFileSync(path.join(__dirname, 'data', 'partner.json'), 'utf8')).line || ''; } catch (e) { return ''; } })();

function css() {
  return `
/* ---- Contraprova (apps/contraprova/page.js) ---- */
.cp-hero{padding:8px 0 0}
.cp-hero h1{font-size:var(--text-display);max-width:15ch;letter-spacing:-.04em}
.cp-hero .deck{max-width:62ch}
.cp-trio{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--rule);
  border:1px solid var(--rule);border-radius:var(--radius-m);overflow:hidden;margin:40px 0 0}
.cp-trio > div{background:var(--sunk);padding:22px 24px;display:flex;flex-direction:column;gap:12px}
.cp-trio p{margin:0;color:var(--ink-3);font-size:var(--text-small);line-height:1.55}
@media (max-width:760px){.cp-trio{grid-template-columns:1fr}}
.cp-chip{display:inline-flex;align-items:center;font-family:var(--f-mono);font-size:.625rem;font-weight:600;
  letter-spacing:.12em;text-transform:uppercase;padding:.4em .85em;border-radius:var(--radius-pill);white-space:nowrap;
  align-self:flex-start;border:1px solid transparent}
.cp-chip.big{font-size:.8125rem;padding:.5em 1.05em}
.cp-chip.provado{background:var(--ink);color:var(--paper)}
.cp-chip.refutado{border-color:var(--ink-2);color:var(--ink)}
.cp-chip.recusado{border:1px dashed var(--ink-4);color:var(--ink-3)}
.cp-chip.nao{border:1px dotted var(--rule-strong);color:var(--ink-5)}
.cp-cta{display:flex;flex-wrap:wrap;gap:12px;margin:32px 0 0}
.cp-cta a{border:1px solid var(--rule-strong);border-radius:var(--radius-pill);padding:10px 18px;
  font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink)}
.cp-cta a.go{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.cp-cta a:hover{border-color:var(--ink)}

/* the architecture, as boxes that stack on a phone */
.cp-arch{display:grid;grid-template-columns:1fr auto 1fr auto 1.5fr auto 1fr;align-items:stretch;gap:0;margin:8px 0 0}
.cp-st{background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius-m);padding:18px 18px;display:flex;flex-direction:column;gap:8px}
.cp-st.core{border-color:var(--ink-3);background:var(--surface2)}
.cp-st.claim{border-style:dashed}
.cp-st .cp-k{margin:0}
.cp-st h3{font-size:1.05rem;margin:0}
.cp-st p{margin:0;font-size:var(--text-small);line-height:1.5;color:var(--ink-3)}
.cp-st ol{margin:4px 0 0;padding-left:18px;font-size:var(--text-small);line-height:1.5;color:var(--ink-2)}
.cp-st ol li{margin:0 0 6px}
.cp-st .cp-vs{display:flex;flex-direction:column;gap:8px;margin-top:4px}
.cp-ar{display:flex;align-items:center;justify-content:center;padding:0 8px;color:var(--ink-4);font-family:var(--f-mono)}
.cp-ar::before{content:'\\2192'}
@media (max-width:1000px){.cp-arch{grid-template-columns:1fr}.cp-ar{padding:6px 0}.cp-ar::before{content:'\\2193'}}

.cp-k{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-4);margin:0 0 10px}
.cp-diff{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin:36px 0 0}
.cp-diff > div{border-top:1px solid var(--rule-strong);padding-top:14px}
.cp-diff b{display:block;color:var(--ink);font-weight:500;margin-bottom:6px}
.cp-diff p{margin:0;color:var(--ink-3);font-size:var(--text-small);line-height:1.55}
@media (max-width:900px){.cp-diff{grid-template-columns:1fr 1fr}}
@media (max-width:560px){.cp-diff{grid-template-columns:1fr}}

/* the live gate */
.cp-gate{display:grid;grid-template-columns:minmax(220px,300px) minmax(0,1fr);gap:24px;align-items:start}
@media (max-width:900px){.cp-gate{grid-template-columns:1fr}}
.cp-cases{display:flex;flex-direction:column;gap:6px}
.cp-cases .cp-k{margin:14px 0 4px}
.cp-cases .cp-k:first-child{margin-top:0}
@media (max-width:900px){.cp-cases{flex-direction:row;flex-wrap:wrap}.cp-cases .cp-k{flex-basis:100%}}
.cp-case{font:inherit;text-align:left;cursor:pointer;background:var(--surface);color:var(--ink-2);
  border:1px solid var(--rule);border-radius:var(--radius-s);padding:10px 12px;display:flex;flex-direction:column;gap:3px}
.cp-case small{font-family:var(--f-mono);font-size:.625rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-4)}
.cp-case span{font-size:var(--text-small);line-height:1.35}
.cp-case:hover{border-color:var(--rule-strong)}
.cp-case[aria-pressed="true"]{border-color:var(--ink-3);background:var(--surface2);color:var(--ink)}
.cp-case:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.cp-rc{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.6fr);gap:1px;background:var(--rule);
  border:1px solid var(--rule);border-radius:var(--radius-m);overflow:hidden}
@media (max-width:760px){.cp-rc{grid-template-columns:1fr}}
.cp-common,.cp-cert{background:var(--sunk);padding:22px 22px}
.cp-common{background:var(--paper)}
.cp-story{font-style:italic;color:var(--ink-3);font-size:var(--text-small);line-height:1.55;margin:0 0 16px}
.cp-pred{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;align-items:baseline;border:1px dashed var(--ink-5);
  border-radius:var(--radius-s);padding:12px 14px}
.cp-pred span{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-4)}
.cp-pred b{font-style:italic;font-weight:400;color:var(--ink-3);font-size:1.25rem;font-family:var(--f-display)}
.cp-vline{display:flex;flex-wrap:wrap;align-items:center;gap:12px}
.cp-means{color:var(--ink-2);font-size:var(--text-small)}
.cp-enc-t{font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink);margin:14px 0 4px}
svg.cp-nl{display:block;width:100%;height:auto;margin:4px 0 8px}
svg.cp-nl.narrow{display:none}
@media (max-width:560px){svg.cp-nl.wide{display:none}svg.cp-nl.narrow{display:block}}
.cp-nl .cp-axis{stroke:var(--c-axis);stroke-width:1}
.cp-nl .cp-enc{fill:var(--band-fill);stroke:var(--ink);stroke-width:1.5}
.cp-nl .cp-guide{stroke:var(--ink-3);stroke-width:1;stroke-dasharray:2 3}
.cp-nl .cp-claim{stroke:var(--ink-3);stroke-width:2;stroke-dasharray:5 4}
.cp-nl text{font-family:var(--f-mono);font-size:12px;fill:var(--ink-2)}
.cp-nl text.claim{font-style:italic;fill:var(--ink-3)}
.cp-nl text.dim{fill:var(--ink-4)}
ul.cp-checks{list-style:none;padding:0;margin:8px 0 0}
ul.cp-checks li{display:grid;grid-template-columns:118px minmax(0,1fr);gap:12px;padding:10px 0;border-top:1px solid var(--rule);align-items:start}
ul.cp-checks li .cp-chip{justify-self:start}
ul.cp-checks li b{display:block;color:var(--ink);font-weight:500;font-size:var(--text-small)}
ul.cp-checks li span{display:block;color:var(--ink-3);font-size:var(--text-small);line-height:1.5}
@media (max-width:560px){ul.cp-checks li{grid-template-columns:1fr;gap:6px}}
.cp-flip{margin:12px 0 0;border:1px solid var(--rule-strong);border-radius:var(--radius-s);padding:14px 16px}
.cp-flip ul{margin:0;padding-left:18px;color:var(--ink-2);font-size:var(--text-small);line-height:1.55}
.cp-run{margin-top:14px;font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-4);line-height:1.5}
.cp-form{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;margin:20px 0 0;padding:16px;border:1px dashed var(--ink-5);border-radius:var(--radius-m)}
.cp-form label{display:flex;flex-direction:column;gap:6px;font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-4)}
.cp-form input{font:inherit;font-family:var(--f-mono);font-size:var(--text-small);width:120px;background:var(--sunk);color:var(--ink);
  border:1px solid var(--rule-strong);border-radius:var(--radius-s);padding:8px 10px;text-transform:none;letter-spacing:0}
.cp-form button{font:inherit;font-family:var(--f-mono);font-size:var(--text-small);cursor:pointer;background:var(--ink);color:var(--paper);
  border:0;border-radius:var(--radius-pill);padding:9px 18px}
.cp-form p{flex-basis:100%;margin:0;color:var(--ink-4);font-size:var(--text-small)}

.cp-ev{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
@media (max-width:900px){.cp-ev{grid-template-columns:1fr}}
.cp-ev > div{background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius-m);padding:22px;display:flex;flex-direction:column;gap:10px}
.cp-ev .big{font-family:var(--f-display);font-size:clamp(1.6rem,1.2rem + 1.2vw,2.3rem);color:var(--ink);letter-spacing:-.02em;line-height:1.05}
.cp-ev p{margin:0;color:var(--ink-3);font-size:var(--text-small);line-height:1.55}
.cp-ev a{align-self:flex-start;font-family:var(--f-mono);font-size:var(--text-eyebrow);margin-top:auto}
.cp-ask{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
@media (max-width:760px){.cp-ask{grid-template-columns:1fr}}
.cp-ask > div{border:1px solid var(--rule-strong);border-radius:var(--radius-m);padding:22px}
.cp-ask ul{margin:0;padding-left:18px;color:var(--ink-2);font-size:var(--text-small);line-height:1.6}
details.cp-why{margin:24px 0 0}
.cp-sub{margin-top:56px}
.cp-gap{height:28px}
@media (max-width:760px){.cp-dumb .figbox svg{min-width:760px}}
details.cp-why > summary{cursor:pointer;font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:.1em;text-transform:uppercase;
  color:var(--ink-3);border:1px solid var(--rule-strong);border-radius:var(--radius-pill);padding:7px 16px;display:inline-block;list-style:none}
details.cp-why > summary::-webkit-details-marker{display:none}
details.cp-why[open] > summary{margin-bottom:20px}
.cp-box td:first-child{color:var(--ink);white-space:nowrap}
`;
}

function build(N, bundleText, git) {
  const G = N.gate, S = G.scenarios;
  const lead = G.lead.receipt, fixed = G.fixed.receipt, MC = G.mc;
  const F = require('./gate/flowline.js');
  const B = [];
  const NOTA = '/contraprova/nota-tecnica-exemplo.pdf', DECK = '/contraprova/contraprova-apresentacao.pdf';
  const GL = { PROVADO: 'VÁLIDO — vale para toda entrada dentro da incerteza declarada', REFUTADO: 'INVÁLIDO — a falha está provada: a equação, o limite ou a entrada que a derruba', RECUSADO: 'INDETERMINADO — entradas admissíveis dos dois lados, e o limiar que decide' };
  const gl = (v) => RC.chip(v, true) + '<p class="cp-k">' + esc(GL[v]) + '</p>';
  const REF = {
    seatrium: 'https://www.offshore-technology.com/news/petrobras-fpso-construction-contract-seatrium/',
    twins: 'https://nossaenergia.petrobras.com.br/w/inovacao/digital-twins-na-petrobras-impulsionam-eficiencia-operacional-1-1',
    jubarte: 'https://agencia.petrobras.com.br/w/inovacao/petrobras-usara-gemeo-digital-para-otimizar-producao-e-escoamento-de-petroleo',
    sgso: 'https://www.gov.br/anp/pt-br/assuntos/exploracao-e-producao-de-oleo-e-gas/seguranca-operacional/arq/regulamento_sgso.pdf',
    conexoes: 'https://mercadoeconsumo.com.br/04/07/2022/economia/petrobras-lanca-oportunidades-para-aquisicao-de-solucoes-inovadoras/',
    doi: 'https://doi.org/10.5281/zenodo.22800699'
  };
  const a = (k, t) => '<a href="' + REF[k] + '">' + esc(t) + '</a>';
  const bar1 = (x) => br.dec(x, 1) + ' bar';
  const pct1 = (x) => (100 * x).toFixed(1).replace('.', ',') + '%';
  const VW = { REFUTED: 'REFUTADO', CERTIFIED: 'PROVADO' };   /* the claims register's words, as the page's seals */

  /* ---- 0 · header ---- */
  B.push('<header class="col cp-hero">'
    + '<div class="eyebrow">Contraprova · Engenharia de Reservatórios, Elevação e Escoamento · verificação independente de números de IA e simulação</div>'
    + '<h1>Desafio: decidir, antes de agir, se um número produzido por IA, simulação ou planilha vale para toda a incerteza declarada.</h1>'
    + '<p class="deck">Gêmeos digitais, otimizadores e modelos de IA já recomendam vazões, pressões e valores de projeto na Petrobras [1, 2]. Cada recomendação termina num número que chega sozinho: “previsão 352 bar, confiança 97%”. A Contraprova acrescenta ao fluxo de decisão o que a validação do modelo não dá: sobre o <b>modelo físico declarado</b> e o <b>envelope de incerteza declarado</b> das entradas (faixas com fonte), calcula por <b>aritmética intervalar rigorosa</b> o intervalo garantido da saída — a <b>garantia de pior caso</b> — e devolve um de três vereditos sobre cada número, com um <b>contraexemplo</b> de cada lado quando a evidência não decide e o <b>limiar que decide</b>. Cada veredito sai num certificado de uma página que um engenheiro refaz sem o nosso código.</p>'
    + '<div class="cp-trio">'
    + '<div>' + gl('PROVADO') + '<p>O número respeita as equações e as regras declaradas para toda entrada do envelope — não numa amostra, não em média.</p></div>'
    + '<div>' + gl('REFUTADO') + '<p>Falha, e a falha está provada: um número que não resolve a sua própria equação, viola conservação, uma unidade ou o domínio do modelo.</p></div>'
    + '<div>' + gl('RECUSADO') + '<p>O envelope contém entradas que respeitam a regra e entradas que a violam, ambas verificadas; o certificado publica a medição ou o ajuste que decide.</p></div>'
    + '</div>'
    + '<div class="cp-cta"><a class="go" href="#portao">O portão ao vivo ↓</a><a href="' + NOTA + '">Nota Técnica de exemplo (PDF)</a><a href="' + DECK + '">Apresentação (PDF)</a><a href="#plano">Plano de trabalho</a></div>'
    + '</header>');

  B.push(C.stats([
    { k: 'custo em jogo', v: 'US$ 8,15 bilhões', n: 'os FPSOs P-84 e P-85 (225 mil bpd cada; Seatrium, 2025): a onda de 100 anos fixa a base de projeto de casco, ancoragem e risers [3, 10, 11]; numa linha de injeção, a cadeia é sobrepressão → integridade → parada do injetor → suporte de pressão adiado [4, 12]' },
    { k: 'IA já decide', v: '> US$ 200 mi', n: 'ganhos declarados pela Petrobras com gêmeos digitais nas refinarias; no campo de Jubarte, cerca de 1% de produção a mais num piloto de gêmeo digital [1, 2]' },
    { k: 'no demonstrador', v: G.faults.caught + ' de ' + G.faults.of, n: 'falhas injetadas pegas no portão de injeção de água, cada uma com o motivo provado; ' + G.battery.fired + '/' + G.battery.reds + ' casos de controle negativos a cada build' },
    { k: 'o que o Monte Carlo diria', v: pct1(MC.pOver), n: 'dos ' + br.int(MC.draws) + ' sorteios do mesmo envelope passam de 360 bar na recomendação de IA, e o pior sorteio para em ' + bar1(MC.max) + '; a Contraprova prova uma entrada admissível a ' + bar1(MC.cornerAbove) + ' e outra a ' + bar1(MC.cornerBelow) }
  ]));

  /* ---- 1 · the problem in numbers ---- */
  B.push(C.section({ lab: '1 · o problema em números', title: 'Na Petrobras, gêmeos digitais e IA já propõem números de operação e de projeto; a decisão de agir sobre cada um continua sem prova [1, 2].',
    bodyRaw: '<div class="col">'
      + C.pRaw('A Petrobras declara mais de ' + a('twins', 'US$ 200 milhões de ganhos com gêmeos digitais nas refinarias') + ' e prepara a evolução para a otimização autônoma; no campo de Jubarte, um piloto de gêmeo digital para produção e escoamento ' + a('jubarte', 'aumentou a produção em cerca de 1%') + ' e foi validado para uso [1, 2]. Cada um desses sistemas termina num número — uma vazão de injeção, uma pressão na cabeça do poço, uma onda de projeto — e o número chega sozinho, com uma confiança que fala do modelo, não daquela saída.')
      + C.pRaw('O que está em jogo por número: a onda de 100 anos fixa a base de projeto de cascos, ancoragens e risers (ISO 19901-1, DNV-RP-C205 [10, 11]) de FPSOs como ' + a('seatrium', 'P-84 e P-85 (US$ 8,15 bilhões pelos dois, 225 mil barris por dia cada)') + ' [3]; numa linha de injeção, um número errado segue a cadeia sobrepressão → integridade da linha (limite de pressão na cabeça do poço e limite de erosão, API RP 14E [12]; integridade mecânica, SGSO prática 13 [4]) → parada do injetor → suporte de pressão adiado. O Sistema de Gerenciamento da Segurança Operacional exige que qualquer desvio das especificações de projeto passe pelo gerenciamento de mudanças e pela integridade mecânica (' + a('sgso', 'Resolução ANP 43/2007, práticas 13 e 16') + ' [4]) — e uma recomendação de IA que muda uma vazão é uma mudança.')
      + C.pRaw('Três fatos do demonstrador desta página. Dois programas dão dois números para os mesmos dados: o mesmo scipy, nos mesmos ' + br.int(N.scipy.n) + ' registros, imprime ' + br.dec(N.scipy.ew.free, 2) + ' m ou ' + br.dec(N.scipy.ew.fixed, 2) + ' m de onda de 100 anos. Quando o máximo não existe, o otimizador imprime a última iteração como resultado: ' + br.int(N.atlas.ggLimit) + ' casos só no atlas público. E uma recomendação plausível de IA, “352 bar, 97%”, tem entradas declaradas dos dois lados do limite de 360 bar. A pergunta que o fluxo atual não responde não é “o modelo é bom em média?”; é: <b>este número vale para as condições que declaramos?</b>')
      + '</div>' }));

  /* ---- 2 · what Petrobras does today, and what is added ---- */
  B.push(C.section({ lab: '2 · o que a Petrobras já faz, e o que acrescenta', title: 'A validação de modelos, a UQ e a revisão por pares avaliam o modelo; a Contraprova acrescenta a decisão sobre cada saída, com prova.',
    bodyRaw: '<div class="col">' + C.p('Nada é substituído: o gêmeo digital, o simulador e a revisão continuam como hoje. A Contraprova entra como um portão ao lado do modelo e como anexo do relatório: o certificado de decisão de cada número.') + '</div>'
      + C.table({ cols: [{ h: 'hoje' }, { h: 'entrega' }, { h: 'o que a Contraprova acrescenta' }], rows: [
        ['Validação e métricas do modelo (MLOps, V&amp;V de código, ASME V&amp;V 20 [7], NASA-STD-7009 [8])', 'desempenho médio e credibilidade do modelo', 'uma decisão sobre ESTA saída, nestas condições: o intervalo garantido e o veredito'],
        ['Quantificação de incerteza, intervalos de confiança', 'a dispersão estatística', 'se a saída respeita as equações que declara e as regras, em todo o envelope; a estatística nunca se passa por prova'],
        ['Segundo cálculo, outro software', 'um segundo número', 'o árbitro: qual número é o máximo que diz ser, qual parou antes (' + br.dec(N.scipy.ew.free, 2) + ' × ' + br.dec(N.scipy.ew.fixed, 2) + ' m)'],
        ['Revisão por par ou por classificadora', 'o julgamento de um especialista', 'a re-derivação mecânica de cada número, como insumo da revisão; não a substitui'],
        ['Gerenciamento de mudanças (SGSO, prática 16)', 'o registro da mudança', 'o certificado de decisão como registro técnico da mudança, reexecutável na auditoria'],
        ['Auditoria, meses depois', 'refazer o estudo', 'refazer o certificado: um arquivo, segundos, sem o nosso código']
      ] })
      + '<div class="col"><p class="scope"><b>Glossário.</b> Envelope declarado (nas páginas do motor, “caixa”): as faixas das entradas, com fonte. Contraexemplos (“testemunhas”): uma entrada verificada de cada lado da regra. Certificado de decisão (“recibo”): a Nota Técnica de uma página, reexecutável sem o nosso código. Casos de controle negativos (“controles vermelhos”): erros plantados que cada build precisa recusar. Os selos PROVADO, REFUTADO e RECUSADO leem-se VÁLIDO, INVÁLIDO e INDETERMINADO. “Certificação” tem dono no offshore (sociedades classificadoras, ANP): a Contraprova entrega uma prova matemática reexecutável sobre um número, não uma certificação de classe.</p></div>' }));

  /* ---- 3 · how it decides ---- */
  const hand = (() => {
    const p = { L: 5990, D: 0.1528, eps: 0.00002, rho: 1028, mu: 0.00108, dz: 2105 }, Qd = 7000, Pd = 206;
    const q = Qd / 86400, A = Math.PI * p.D * p.D / 4, v = q / A, Re = p.rho * v * p.D / p.mu;
    const x = F.newton(p.eps / (3.7 * p.D), 2.51 / Re), f = 1 / (x * x);
    const dpf = (p.L / p.D) * p.rho * v * v / 2 / 1e5, hyd = p.rho * 9.80665 * p.dz / 1e5, Pwh = Pd + hyd - dpf * 1;
    const d = (v_, n) => br.dec(v_, n);
    return [
      ['área e velocidade', 'A = πD²/4; v = Q/A', d(A, 5) + ' m² · ' + d(v, 3) + ' m/s'],
      ['número de Reynolds', 'Re = ρvD/μ', br.int(Re)],
      ['fator de atrito (Colebrook, x = 1/√f)', 'x + (2/ln 10)·ln(ε/(3,7D) + 2,51x/Re) = 0', 'x = ' + d(x, 3) + ' → f = ' + d(f, 5)],
      ['perda por atrito', 'Δp = f·(L/D)·ρv²/2', d(f * (p.L / p.D) * p.rho * v * v / 2 / 1e5, 1) + ' bar'],
      ['ganho hidrostático', 'ρgΔz', d(hyd, 1) + ' bar'],
      ['pressão na cabeça do poço', 'P_wh = P_d + ρgΔz − Δp', '<b>' + d(Pd + hyd - f * (p.L / p.D) * p.rho * v * v / 2 / 1e5, 1) + ' bar</b> (limite 360)']
    ];
  })();
  B.push(C.section({ lab: '3 · como decide', title: 'Modelo físico declarado com fonte; intervalo garantido por aritmética intervalar; contraexemplos verificados.',
    bodyRaw: '<div class="wide"><div class="cp-arch">'
      + '<div class="cp-st"><div class="cp-k">envelope declarado</div><h3>Entradas como faixas, com fonte</h3><p>Comprimento, diâmetro, rugosidade, massa específica, viscosidade e desnível da linha, cada um como intervalo; as regras de operação declaradas (P_wh ≤ 360 bar; v ≤ 5 m/s). No piloto, do cadastro e dos perfis, em dados sintéticos no formato da Petrobras.</p></div><div class="cp-ar" aria-hidden="true"></div>'
      + '<div class="cp-st claim"><div class="cp-k">quem propõe</div><h3>IA · simulador · otimizador · planilha</h3><p>Uma proposta: um número e o que ele afirma. O modelo não precisa ser aberto; decide-se a saída, contra o modelo declarado.</p></div><div class="cp-ar" aria-hidden="true"></div>'
      + '<div class="cp-st core"><div class="cp-k">o método</div><h3>Garantia de pior caso sobre o envelope</h3><ol>'
      + '<li><b>Modelo físico declarado</b>: Colebrook [13] e Darcy–Weisbach com o ganho hidrostático; para extremos, máxima verossimilhança nas famílias de Coles [14]. O veredito fala do modelo declarado e do envelope declarado.</li>'
      + '<li><b>Intervalo garantido</b>: aritmética intervalar com arredondamento para fora [5, 6]; a raiz de Colebrook cercada pela monotonicidade em x = 1/√f, cada extremo provado; a regra decidida por bissecção do envelope.</li>'
      + '<li><b>Contraexemplos</b>: uma entrada verificada de cada lado da regra, e o limiar (descarga, rugosidade) que decide.</li></ol></div><div class="cp-ar" aria-hidden="true"></div>'
      + '<div class="cp-st"><div class="cp-k">o que sai</div><h3>Certificado de decisão</h3><div class="cp-vs">' + RC.chip('PROVADO') + RC.chip('REFUTADO') + RC.chip('RECUSADO') + '</div><p>Veredito, intervalo garantido, contraexemplos, limiares e reprodução, numa página (<a href="' + NOTA + '">exemplo em PDF</a>).</p></div>'
      + '</div></div>'
      + '<div class="col">' + C.pRaw('<b>Verificação.</b> Uma segunda implementação em Python (módulo decimal, 50 dígitos, sem código em comum) calcula P_wh em ' + G.battery.refPoints + ' entradas — os 64 cantos e pontos sorteados de duas operações — e o intervalo do portão contém todas. ' + G.battery.checks + ' verificações e ' + G.battery.fired + '/' + G.battery.reds + ' casos de controle negativos a cada build: uma pressão 0,1 bar fora do intervalo, um manifold com 1 m³/d a mais, um f 10⁻⁴ fora das soluções, uma vazão 1 m³/d abaixo do regime turbulento, um “verificador” que avalia só o centro do envelope — todos recusados. Cada caso é decidido de novo no navegador pelo mesmo código que gerou o registro.')
      + C.pRaw('<b>Fora desta versão, dito aqui.</b> Escoamento monofásico, permanente e isotérmico: transientes, multifásico, perfil térmico e a erosão como modelo entram por domínio na E5, cada um como modelo declarado com o seu envelope. Um PROVADO fala do modelo declarado e das entradas declaradas — não do poço.')
      + C.pRaw('<b>O modelo não precisa ser aberto — o que isso implica.</b> O portão compara a saída com o modelo declarado, não com o modelo de quem propõe, e o certificado separa dois tipos de verificação. As <b>regras</b> decidem: o limite físico (atrito ≥ 0, logo P_wh ≤ P_d + ρgΔz) vale em qualquer regime de escoamento; o limite operacional (P_wh ≤ ' + S.rules.PwhMax + ' bar) é decidido sobre o modelo declarado. A <b>consistência com o modelo físico</b> é uma comparação com a referência declarada: se o gêmeo digital resolve uma física mais rica (térmica, multifásica), um número fora do intervalo não está necessariamente errado — está em desacordo com uma referência mais simples, e é o engenheiro quem arbitra. No demonstrador, essa falha sai como INVÁLIDO relativo ao modelo declarado (é assim que o diâmetro de catálogo é pego); em E1 e E2, o engenheiro do ativo define quais verificações são regras e quais são sinalizações para arbitrar. A injeção de água — monofásica, permanente, isotérmica — foi escolhida como piloto porque o modelo declarado a cobre inteira: o limite de escopo acima é uma escolha de projeto.')
      + '</div>'
      + '<div class="col sec-head cp-sub"><h3>Um contraexemplo recalculável à mão</h3></div>'
      + '<div class="col">' + C.p('A entrada admissível que viola o limite na recomendação de IA (+4,2%: Q = 7.000 m³/d, P_d = 206 bar): ε = 0,020 mm, μ = 1,08 mPa·s, D = 152,8 mm, ρ = 1.028 kg/m³, Δz = 2.105 m, L = 5.990 m — a linha mais lisa, a água mais fluida e mais densa, o diâmetro maior, a lâmina maior. Linha a linha, numa planilha; o portão garante o mesmo valor com intervalo (≥ ' + bar1(MC.cornerAbove) + ').') + '</div>'
      + C.table({ cols: [{ h: 'passo' }, { h: 'fórmula' }, { h: 'valor' }], rows: hand.map((r) => [r[0], { raw: '<code>' + esc(r[1]) + '</code>' }, { raw: r[2] }]) }) }));

  /* ---- 4 · demonstration: the live gate, the faults, Monte Carlo, real data, frontier AI ---- */
  const caseBtn = (c, i) => '<button type="button" class="cp-case" data-i="' + i + '" aria-pressed="' + (i === 0 ? 'true' : 'false') + '"><small>' + esc(c.kind === 'proposta' ? 'proposta de IA' : c.fault) + '</small><span>' + esc(c.title) + '</span></button>';
  const rows = S.cases.map(caseBtn);
  const boxRows = Object.keys(S.box).map((k) => { const [w, u, sc, d] = S.boxWords[k]; const f = (x) => (d ? br.dec(x, d) : br.int(x)); return [w, f(Number(S.box[k][0]) * sc) + ' – ' + f(Number(S.box[k][1]) * sc) + ' ' + u]; });
  const tRows = N.table.rows.slice().sort((x, y) => x.d - y.d);
  const lo = Math.floor(Math.min(...tRows.map((r) => Math.min(r.printed, r.decided)))) - 1, hi = Math.ceil(Math.max(...tRows.map((r) => Math.max(r.printed, r.decided)))) + 1;
  const ticks = []; for (let v = lo; v <= hi; v += 2) ticks.push({ v, t: v + ' m' });
  const dumb = CH.dumbbell({ w: 900, rows: tRows.map((r) => ({ k: r.k, a: r.decided, b: r.printed, lab: br.sgn(r.d, 2) + ' m' })), x0: lo, x1: hi, xTicks: ticks,
    aName: 'decidido no registro público', bName: 'impresso na tabela', padL: 250, vOf: (v) => br.dec(v, 2) + ' m',
    alt: 'Ondas de 100 anos: a tabela publicada contra o registro público mais próximo, vinte ajustes em cinco áreas.' });
  B.push('<section id="portao"><div class="col sec-head"><div class="lab">4 · demonstração</div><h2>Uma recomendação de IA de +4,2% de injeção é INDETERMINADA no envelope declarado: há entradas admissíveis a ' + bar1(MC.cornerAbove) + ' e a ' + bar1(MC.cornerBelow) + '; com P_d ≤ ' + br.dec(lead.flip.pdGreen, 1) + ' bar fica VÁLIDA.</h2></div>'
    + '<div class="col">' + C.p(S.line + '. Valores típicos e ilustrativos, não dados da Petrobras. Nove propostas: duas recomendações que um modelo de IA poderia fazer, e sete saídas de referência com uma falha injetada em cada — as sete falhas que um verificador industrial precisa pegar. Cada uma é decidida agora, no seu navegador, pelo mesmo código que gerou o registro publicado.') + '</div>'
    + '<div class="wide"><div class="cp-gate">'
    + '<div class="cp-cases" role="group" aria-label="Propostas"><div class="cp-k">recomendações</div>' + rows.slice(0, 2).join('') + '<div class="cp-k">falhas injetadas</div>' + rows.slice(2).join('') + '</div>'
    + '<div id="cp-panel" aria-live="polite">' + RC.receiptHtml(S.cases[0], lead, S.rules.PwhMax, 'registro publicado') + '</div>'
    + '</div></div>'
    + '<div class="wide"><form class="cp-form" id="cp-form" autocomplete="off">'
    + '<label>vazão Q (m³/d)<input name="q" inputmode="decimal" value="7000"></label>'
    + '<label>descarga P_d (bar)<input name="pd" inputmode="decimal" value="204"></label>'
    + '<label>P_wh prevista (bar)<input name="pwh" inputmode="decimal" value="350"></label>'
    + '<button type="submit">Decidir esta proposta</button>'
    + '<p>Digite a sua proposta: a mesma linha, o mesmo envelope, as mesmas regras. O veredito sai em milissegundos, na sua máquina.</p></form></div>'
    + '<div class="col">' + C.p('O envelope declarado (toda entrada dentro dele é decidida) e as duas regras:') + '</div>'
    + '<div class="cp-box">' + C.table({ cols: [{ h: 'entrada' }, { h: 'intervalo declarado' }], rows: boxRows.concat([['regra 1', S.rulesWords.PwhMax], ['regra 2', S.rulesWords.vMax]]) }) + '</div>'
    + '<div class="col">' + C.pRaw('<b>As sete falhas, pegas com o motivo.</b> ' + G.scenarios.cases.filter((c) => c.kind === 'falha').map((c) => { const r = G.receipts.find((x) => x.id === c.id).receipt; return esc(c.fault) + ' → ' + r.verdict; }).join(' · ') + '. Cada uma é uma saída de referência com um erro que um modelo comete na prática; nenhuma passa.') + '</div>'

    + '<div class="col sec-head cp-sub"><h3>Monte Carlo cara a cara, na mesma recomendação</h3></div>'
    + '<div class="wide"><div class="cp-ev">'
    + '<div class="claim"><div class="cp-k">o que um estudo por sorteio diria</div><div class="big">' + pct1(MC.pOver) + '</div><p>dos ' + br.int(MC.draws) + ' sorteios uniformes do envelope passam de 360 bar (com ' + br.int(MC.draws1k) + ' sorteios: ' + pct1(MC.pOver1k) + '). O sorteio encontra a violação; o que ele subestima é o pior caso: o maior sorteio para em ' + bar1(MC.max) + ', e o envelope contém uma entrada provada a ' + bar1(MC.cornerAbove) + '. A fração é uma afirmação sobre um prior uniforme que ninguém declarou — com outra distribuição das entradas, outro número.</p></div>'
    + '<div><div class="cp-k">o que a Contraprova garante</div><div class="big">' + bar1(MC.cornerAbove) + '</div><p>Uma entrada admissível, com valor garantido, passa do limite — acima do pior sorteio; outra, a ' + bar1(MC.cornerBelow) + ', o respeita. O intervalo garantido da saída é [' + br.dec(lead.enclosure[0], 1) + '; ' + br.dec(lead.enclosure[1], 1) + '] bar. O veredito não depende da fração nem do prior: depende do envelope declarado e das duas entradas provadas.</p></div>'
    + '<div><div class="cp-k">o que decide</div><div class="big">P_d ≤ ' + br.dec(lead.flip.pdGreen, 1) + ' bar</div><p>' + esc(lead.thresholds.join(' ')) + ' A recomendação com a descarga em 200 bar é VÁLIDA no envelope inteiro: P_wh ∈ [' + br.dec(fixed.enclosure[0], 1) + '; ' + br.dec(fixed.enclosure[1], 1) + '] bar.</p></div>'
    + '</div></div>'

    + '<div class="col sec-head cp-sub"><h3>Já funciona em dados reais: a onda de projeto de uma plataforma</h3></div>'
    + '<div class="col">' + C.p('Os valores extremos de altura de onda que dimensionam FPSOs, ancoragens, risers e turbinas eólicas offshore — a onda de 100 anos da base de projeto [10, 11]. O método é o de Reis, Guimarães et al. (Ocean Engineering, 2026) [15]: seis famílias, quatro critérios, níveis de 100 e 1.000 anos; os dados, o hindcast público WAVEWATCH III 1993–2024.') + '</div>'
    + '<div class="wide"><div class="cp-ev">'
    + '<div><div class="cp-k">o mesmo software</div><div class="big">' + br.dec(N.scipy.ew.free, 2) + ' m × ' + br.dec(N.scipy.ew.fixed, 2) + ' m</div><p>A mesma onda de 100 anos, dos mesmos ' + br.int(N.scipy.n) + ' registros horários, pelo mesmo scipy ' + esc(N.scipy.version) + ' chamado de dois jeitos. Só um é o máximo de verossimilhança que os dois dizem calcular: o outro fica ' + br.int(N.scipy.ew.deficit) + ' unidades de log-verossimilhança abaixo de um membro da própria família. Na chamada padrão, ' + N.scipy.free.agree + ' de ' + N.scipy.free.of + ' ajustes conferem; com a locação fixa, ' + N.scipy.fixed.agree + ' de ' + N.scipy.fixed.of + '.</p><a href="../reports/return-levels.html">o relatório →</a></div>'
    + '<div><div class="cp-k">a escala</div><div class="big">' + br.int(N.atlas.fits) + '</div><p>Ajustes em ' + br.int(N.atlas.cells) + ' células, três blocos, seis famílias — ' + br.int(N.atlas.certified) + ' provados como máximo; ' + br.int(N.atlas.ggLimit) + ' recusados com a prova de que o máximo não existe dentro da família (o otimizador imprimiria um ponto do caminho). Qualquer célula é refeita no navegador.</p><a href="../instruments/return-level-atlas/">o atlas →</a></div>'
    + '<div><div class="cp-k">uma tabela publicada</div><div class="big">' + N.table.outside95 + ' de ' + N.table.decided + '</div><p>Ondas de 100 anos de uma tabela de projeto eólico offshore (' + esc(N.table.cite) + ' [16], cinco áreas do Atlântico Sul) fora do intervalo estatístico de 95% do registro público mais próximo (' + N.table.kmMin + '–' + N.table.kmMax + ' km): de ' + br.sgn(N.table.dMin, 2) + ' a ' + br.sgn(N.table.dMax, 2) + ' m. A tabela vem de um hindcast comercial que ninguém de fora refaz: é a distância entre dois registros, e o motivo para um certificado.</p><a href="../instruments/return-level-check/">decida um ajuste impresso →</a></div>'
    + '</div></div>'
    + '<div class="cp-gap"></div><div class="cp-dumb">' + C.figure({ svgRaw: dumb, caption: 'Vinte ajustes impressos (MQ mínimos quadrados, MV máxima verossimilhança, MM momentos) contra o ajuste decidido na célula pública mais próxima. Diferença de registros, não erro da tabela: é exatamente o que um certificado torna visível.' }) + '</div>'

    + '<div class="col sec-head cp-sub"><h3>Calibrado contra a IA de fronteira</h3></div>'
    + '<div class="col">' + C.pRaw('Antes da engenharia, o mesmo motor decidiu ' + br.int(N.ai.decided) + ' afirmações matemáticas publicadas, produzidas com ou por modelos de fronteira — entre elas um certificado de GPT-5.4 Pro para o limite de Ramsey diagonal (benchmark HorizonMath, 2026), com veredito ' + VW[N.ai.horizon] + ' porque o verificador do próprio benchmark aceitava um par se uma orientação passasse e a definição exige as duas; a iteração de ChatGPT 5.6 Sol impressa por Gupta, Ndiaye, Norin e Wei para o mesmo limite, com veredito ' + VW[N.ai.gnnw] + ' por dois programas independentes, em duas linguagens; e a biblioteca de ' + N.ai.countex.of + ' contraexemplos encontrados por IA de S. Sra (' + N.ai.countex.certified + ' inteiros, ' + N.ai.countex.partial + ' parciais). Cada linha com o arquivo que a decidiu, em público e com data: <a href="../reports/horizonmath.html">HorizonMath</a> · <a href="../reports/diagonal-ramsey.html">Ramsey diagonal</a> · <a href="../reports/counterexample-machine.html">contraexemplos</a> · <a href="../reports/decided-2026-09.html">o registro de setembro</a>.') + '</div>'
    + '</section>');

  /* ---- 5 · value case ---- */
  B.push(C.section({ lab: '5 · caso de valor', title: 'Seis decisões em que o certificado entra; a de maior custo é fixar um valor de projeto.',
    bodyRaw: C.table({ cols: [{ h: 'decisão da Petrobras' }, { h: 'custo em jogo' }, { h: 'o que muda com a Contraprova' }, { h: 'evidência no demonstrador' }], rows: [
      ['Fixar um valor de projeto metoceânico (onda de 100 anos)', { raw: 'a base de projeto de cascos, ancoragens e risers [10, 11]; dois FPSOs custam US$ 8,15 bilhões [3]' }, 'o máximo provado, ou a recusa com a prova de que o máximo não existe', br.int(N.atlas.certified) + ' provados, ' + br.int(N.atlas.ggLimit) + ' recusados com motivo'],
      ['Agir sobre uma recomendação de IA ou gêmeo digital (vazão, pressão, injeção)', { raw: 'sobrepressão → integridade da linha (limite de 360 bar; SGSO, prática 13) → parada do injetor → suporte de pressão adiado; a mudança sob o SGSO, prática 16 [4, 12]' }, 'veredito sobre o envelope inteiro antes de agir; o limiar que torna a recomendação VÁLIDA', 'a recomendação de +4,2%: INDETERMINADA; VÁLIDA com P_d ≤ ' + br.dec(lead.flip.pdGreen, 1) + ' bar'],
      ['Arbitrar dois programas que discordam', 'um estudo, semanas, uma reunião sem árbitro', 'qual número é o máximo que diz ser, qual parou antes', br.dec(N.scipy.ew.free, 2) + ' × ' + br.dec(N.scipy.ew.fixed, 2) + ' m; ' + N.scipy.free.agree + ' de ' + N.scipy.free.of],
      ['Aceitar um número de fornecedor ou consultor', 'o custo do estudo e da decisão que ele informa', 'a distância entre o número impresso e o registro público, célula a célula', N.table.outside95 + ' de ' + N.table.decided + ' ondas de uma tabela publicada fora do intervalo de 95%'],
      ['Registrar uma mudança de operação (SGSO, práticas 13 e 16 [4])', 'conformidade; o registro técnico da mudança', 'o certificado de decisão como o registro: modelo, envelope, veredito, limiar', 'a Nota Técnica de exemplo'],
      ['Auditar meses depois', 'refazer o estudo', 'refazer o certificado: um arquivo, segundos, sem o nosso código', 'cada caso re-decidido no navegador']
    ] })
    + '<div class="col">' + C.pRaw('<b>Frequência e dono da decisão.</b> A frequência é a do fluxo: cada recomendação de gêmeo digital ou de IA que vira ação, cada revisão de base de projeto, cada mudança sob o SGSO. Dono na Fase 1: engenharia de reservatórios, elevação e escoamento do ativo (o portão ao lado do modelo); engenharia submarina e naval (valores de projeto); segurança operacional (gerenciamento de mudanças). A viabilidade financeira não é estimada de fora: é a entrega E3b, com interlocutores da Petrobras.')
    + C.pRaw('<b>Onde entra no fluxo atual (nada é substituído).</b> (1) O modelo propõe → o portão decide a saída → o certificado acompanha a decisão. (2) O relatório de base de projeto → o anexo com o máximo provado ou a recusa. (3) A mudança sob o SGSO → o certificado como registro técnico. (4) A auditoria → o certificado refeito. (5) Cada certificado adquirido volta como caso de controle do domínio.')
    + '</div>' }));

  /* ---- 6 · state of the art ---- */
  const cites = [
    ['ASME V&V 20-2009 (R2016) [7]; NASA-STD-7009A [8]; Oberkampf e Roy 2010 [9]', 'Verificação e validação de códigos e modelos: credibilidade do modelo, erro numérico e incerteza de validação — não uma decisão sobre uma saída num envelope declarado.'],
    ['Moore, Kearfott e Cloud 2009 [5]; Hansen e Walster 2004 [6]; Rump 1999 (INTLAB)', 'Aritmética intervalar e otimização global verificada: o método que a Contraprova aplica a números de engenharia.'],
    ['Coles 2001 [14]; ISO 19901-1 [10]; DNV-RP-C205 [11]', 'Extremos e valores de projeto metoceânicos: as famílias, os critérios e os períodos de retorno que a base de projeto usa.'],
    ['Reis, Guimarães et al. 2026 [15]; Bhaskaran et al. 2023 [16]', 'O método de ajuste do atlas; a tabela de projeto eólico decidida contra o registro público.'],
    ['Resolução ANP 43/2007, Regulamento Técnico do SGSO [4]', 'Integridade mecânica (prática 13) e gerenciamento de mudanças (prática 16): onde o certificado de decisão entra como registro.'],
    ['MLOps, monitoramento de modelos, UQ bayesiana', 'Desempenho médio e dispersão: nenhum decide esta saída, nestas condições, com prova.'],
    ['Verificação formal (Lean, Coq)', 'Provas completas de programas; fora da escala de engenharia de hoje (envelopes de incerteza, centenas de milhares de registros).']
  ];
  B.push(C.section({ lab: '6 · estado da arte', title: 'Nas referências consultadas, a V&amp;V e a UQ avaliam o modelo; nenhuma decide uma saída sobre o envelope declarado com um certificado reexecutável.',
    bodyRaw: '<div class="col">' + C.p('A busca não foi sistemática; a revisão de literatura por domínio é parte de E4. O que encontramos: normas e livros de V&V que qualificam códigos e modelos, métodos intervalares que garantem limites, e práticas de MLOps que medem desempenho médio. Não encontramos, nessas referências, o veredito de três valores sobre cada saída, com contraexemplos e o limiar que decide.')
      + '<ul class="cp-cites">' + cites.map(([x, y]) => '<li><b>' + esc(x) + '.</b> ' + esc(y) + '</li>').join('') + '</ul></div>' }));

  /* ---- 7 · work plan ---- */
  B.push('<section id="plano"><div class="col sec-head"><div class="lab">7 · plano de trabalho</div><h2>Doze meses, uma fase central: um fluxo de decisão da Petrobras com certificado em cada número, sobre dados sintéticos no formato dos seus dados, rodado dentro da Petrobras.</h2></div>'
    + '<div class="col">' + C.pRaw('<b>Objetivo geral.</b> Num fluxo em que uma saída de IA ou simulação vira decisão (por exemplo, injeção de água), com dados sintéticos que a Petrobras fornece no formato dos seus dados reais, decidir cada número sobre o envelope declarado e medir o que muda quando a decisão chega com certificado. <b>Objetivos específicos.</b> (1) modelo, envelope e regras declarados com fonte; (2) o portão rodando ao lado do modelo, com certificados por decisão; (3) para cada INDETERMINADO, o limiar ou a medição que decide; (4) valores de projeto metoceânicos com certificado; (5) valoração econômica com interlocutores da Petrobras; (6) scripts entregues prontos, rodados pela Petrobras sobre os dados reais sem o autor.') + '</div>'
    + C.table({ cols: [{ h: 'entrega' }, { h: 'meses', cls: 'n' }, { h: 'o que entrega' }, { h: 'critério de aceitação' }, { h: 'TRL', cls: 'n' }], rows: [
      ['E1 · Fluxo e envelope declarados', '0–2', 'UM fluxo de decisão escolhido com a Petrobras; o modelo físico, as faixas das entradas (cadastro, perfis, PVT) e as regras, com fonte por linha — a partir de dados sintéticos fornecidos pela Petrobras no formato dos reais; nenhum dado real é pedido', 'assinado pelo engenheiro-par; nenhum parâmetro sem fonte', '4'],
      ['E2 · O portão ao lado do modelo', '2–5', 'certificados para cada saída do fluxo (VÁLIDO, INVÁLIDO, INDETERMINADO com contraexemplos e limiar); casos de controle negativos do domínio', '100% dos controles recusados a cada build; três certificados recalculados à mão por engenheiro da Petrobras', '5'],
      ['E3 · Plano de redução de incerteza', '3–6', 'para cada INDETERMINADO: a medição, a inspeção ou o ajuste operacional que decide, com o custo e a ordem', 'lista priorizada aceita pela equipe do ativo', '5'],
      ['E3b · Valoração econômica', '3–6', 'entrevistas e consultas com interlocutores da Petrobras (reservatórios e escoamento, engenharia submarina, segurança operacional): que decisão muda, com que frequência, quanto custa errar, quanto vale para a Petrobras e para a startup — a viabilidade financeira do negócio, que não se estima de fora', 'relatório de valoração com premissas explícitas, validado pelos interlocutores', '—'],
      ['E4 · Valores de projeto metoceânicos', '4–8', 'os ajustes de extremos (famílias e critérios de Reis, Guimarães et al.) sobre dados sintéticos no formato da Petrobras e o hindcast público; o verificador em Python de um arquivo; o formato do certificado para a base de projeto; revisão de literatura por domínio', 'certificados aceitos pela engenharia submarina; um máximo provado ou a recusa provada por ajuste', '5'],
      ['E5 · Integração', '6–10', 'scripts e certificados por decisão entregues prontos, no formato dos dados da Petrobras, para ela rodar sobre os dados reais dentro do seu ambiente; a biblioteca de modelos declarados por domínio (escoamento, balanços, hidrostática, extremos); o certificado como registro de mudança (SGSO)', 'a Petrobras roda sobre os seus dados sem o autor; controles negativos recusados em cada build', '5–6'],
      ['E6 · Contornos ambientais conjuntos (pesquisa)', '8–12', 'o modelo conjunto altura–período e o contorno ambiental (IFORM/ISORM), cada um com o seu certificado', 'revisão com a engenharia submarina; um contorno decidido de ponta a ponta', '2 → 4']
    ] })
    + '<div class="col">' + C.pRaw('<b>Marcos e portões.</b> M0 (mês 0): kick-off; dados sintéticos no formato da Petrobras entregues; NDA. M3: primeiros certificados no fluxo; portão técnico — se mais de 50% das saídas forem INDETERMINADAS, estreitar o envelope com as medições de E3 antes de E4. M6: revisão de meio-termo com o portfólio, com o relatório de valoração (E3b); go/no-go para E4–E6. M12: entrega final; decisão de implantação (o portão como serviço ao lado dos modelos, ou licença por ativo).') + '</div>'
    + '<div class="wide"><div class="cp-ask">'
    + '<div><div class="cp-k">o que pedimos</div><ul><li>um fluxo de decisão e uma pergunta de operação ou de projeto</li><li>dados sintéticos (cadastro, perfis, PVT, séries) no formato dos dados da Petrobras — nenhum dado real</li><li>um engenheiro-par (4 h/semana), mentoria do portfólio e interlocutores para a valoração</li><li>doze meses</li></ul></div>'
    + '<div><div class="cp-k">o que a Petrobras recebe</div><ul><li>o portão rodando ao lado do modelo, com certificados por decisão</li><li>o plano de redução de incerteza e o relatório de valoração</li><li>os scripts prontos, no formato dos seus dados, para rodar sobre os dados reais dentro da Petrobras</li><li>um método que qualquer engenheiro da casa refaz sem o nosso código</li></ul></div></div></div></section>');

  /* ---- 8 · risks, business model, IP, deployment ---- */
  B.push(C.section({ lab: '8 · riscos, modelo de negócio, implantação', title: 'O maior risco técnico é o modelo declarado ficar aquém do fluxo real; a mitigação está no plano.',
    bodyRaw: C.table({ cols: [{ h: 'risco' }, { h: 'efeito' }, { h: 'mitigação' }, { h: 'onde' }], rows: [
      ['Modelo declarado aquém do fluxo (transiente, multifásico, térmico)', 'um VÁLIDO que o campo desmente', 'o escopo dito na seção 3; cada modelo entra declarado com o seu envelope e os seus controles; “o veredito fala do modelo declarado” na primeira página', 'E1, E5'],
      ['Excesso de INDETERMINADO', 'ferramenta lida como conservadora demais', 'todo INDETERMINADO sai com o limiar ou a medição que decide; portão M3; envelopes estreitados por medição, nunca por hipótese', 'E3; M3'],
      ['Acesso a dados', 'os dados de operação e de projeto da Petrobras são confidenciais; um plano que dependa deles não anda', 'o projeto não pede dados reais: dados sintéticos fornecidos pela Petrobras no formato dos reais, complementados pelos públicos (hindcast, boias); os scripts são entregues prontos e a Petrobras os roda sobre os dados reais dentro do seu ambiente', 'M0, E1, E5'],
      ['A palavra “certificação”', 'leitura como certificação de classe', 'a Contraprova entrega uma prova matemática reexecutável sobre um número; não substitui a responsabilidade técnica de quem assina', 'seção 2'],
      ['Equipe de uma pessoa', 'risco de execução', 'engenheiro-par; segunda implementação independente já existente; colaboração acadêmica iniciada', 'seção 9'],
      ['Adoção interna', 'portão paralelo, não usado', 'formato de anexo ao relatório e de registro de mudança; o portão como API ao lado do modelo, sem trocar o modelo', 'E2, E5'],
      ['Viabilidade financeira não estimada', 'a pergunta “quanto vale para a Petrobras e para a startup” fica sem resposta', 'a valoração é uma entrega do projeto (E3b): entrevistas com interlocutores, relatório com premissas explícitas, revisto no M6', 'E3b']
    ] })
    + '<div class="col">' + C.pRaw('<b>Modelo de negócio (CRL 3 → o que falta dizer).</b> Fase de PD&amp;I: contrato de inovação de 12 meses no instrumento do módulo em que a submissão cair; como referência, o módulo Aquisição de Soluções do Conexões previu ' + a('conexoes', 'até R$ 1,6 milhão por proposta, contratos de até 12 meses prorrogáveis por 12') + ' (2022) [17]. Depois: o portão como serviço ao lado dos modelos (licença anual por ativo, com a biblioteca de modelos declarados, os controles por domínio e o suporte) ou o certificado como anexo por relatório; a Petrobras escolhe no M12. O núcleo de aritmética é MIT e fica aberto — auditável, condição do próprio método; o valor pago está na declaração dos modelos e envelopes do ativo, na integração ao fluxo, na suíte de controles por domínio e no suporte. <b>Viabilidade financeira.</b> Não a estimamos de fora: é o objeto de E3b.')
    + C.pRaw('<b>Escalabilidade e abrangência.</b> O portfólio de entrada é Engenharia de Reservatórios, Elevação e Escoamento (o portão ao lado do modelo); pela mesma via entram Tecnologia Submarina (os valores de projeto metoceânicos e os contornos ambientais, E4 e E6) e Geração de Energia (a onda de projeto de turbinas eólicas offshore, a tabela decidida na seção 4). O mesmo método decide outras saídas de modelo: balanços de massa e energia de plantas de processo, hidrostática e estabilidade, tempo de vida à fadiga sob envelope de carga, e a decidibilidade de sísmica 4D (a solução <a href="/decidivel/">Decidível</a>, no outro formulário: o mesmo método, o mesmo formato de certificado). Uma frase cada, sem prazo prometido.')
    + C.pRaw('<b>Propriedade intelectual e confidencialidade.</b> Titularidade do que for desenvolvido no projeto conforme a regra do módulo; aceita. Modelos declarados, envelopes e certificados do ativo são da Petrobras; nenhum dado ou derivado sai do ambiente. O método permanece público; a Petrobras recebe direito de uso irrestrito do núcleo.')
    + C.pRaw('<b>Implantação ao final do projeto — o critério de sucesso.</b> Ao final do M12, um engenheiro da Petrobras roda o portão sobre uma saída nova do seu fluxo, dentro da Petrobras e sem o autor, obtém o certificado e o anexa ao registro da decisão.')
    + '</div>' }));

  /* ---- 9 · maturity and team ---- */
  B.push(C.section({ lab: '9 · maturidade e equipe', title: 'TRL 4 com evidência pública; colaboração acadêmica iniciada; engenheiro-par da Petrobras no piloto.',
    bodyRaw: '<div class="col">'
      + C.pRaw('<b>TRL 4</b> — validado em laboratório, em dados públicos e em escala: o atlas de ondas de projeto (' + br.int(N.atlas.fits) + ' ajustes), os relatórios decididos, o portão demonstrador desta página, o código e os registros arquivados com DOI (' + a('doi', '10.5281/zenodo.22800699') + '). <b>CRL 3</b> — a aplicação da tecnologia definida; o piloto é o próximo passo.')
      + C.pRaw('<b>Equipe.</b> Carlos Toledo, fundador: design industrial, direção de arte e desenvolvimento; ex-EmbraerX (inovação corporativa em aeroespacial); construiu o motor de verificação (código aberto, licença MIT, cada resultado com o arquivo que o decidiu). Colaboração acadêmica iniciada com um laboratório universitário; engenheiro-par da Petrobras no piloto. Uma pessoa hoje; o piloto define as próximas.')
      + (PARTNER ? C.pRaw('<b>Parceria acadêmica.</b> ' + esc(PARTNER)) : '')
      + C.pRaw('<b>Contato.</b> <a href="mailto:carlos@carlostoledo.co">carlos@carlostoledo.co</a> · <a href="' + DECK + '">apresentação (PDF)</a> · <a href="' + NOTA + '">Nota Técnica de exemplo (PDF)</a> · <a href="' + REPO + '/tree/main/apps/contraprova">código</a>')
      + C.pRaw('<span class="scope">Demonstrador com valores típicos e ilustrativos, não dados da Petrobras. Um PROVADO fala do modelo declarado e das entradas declaradas, não do poço nem do mar. A Contraprova entrega uma prova matemática reexecutável sobre um número — não uma certificação de classe, e não substitui a responsabilidade técnica de quem assina o projeto.</span>')
      + '</div>' }));

  /* ---- 10 · the ask ---- */
  B.push(C.section({ lab: '10 · o pedido', title: 'Primeiro passo: um fluxo de decisão e dados sintéticos no formato da Petrobras; certificados das suas saídas em quatro semanas.',
    bodyRaw: '<div class="col">' + C.p('É o pedido que um representante de portfólio consegue aprovar sozinho: um fluxo em que uma saída de modelo vira decisão, as faixas das entradas como dados sintéticos no formato da Petrobras, e em quatro semanas os certificados dessas saídas — VÁLIDO, INVÁLIDO ou INDETERMINADO com o limiar — em scripts que a Petrobras roda sobre o fluxo real dentro do seu ambiente. Depois, os doze meses da seção 7.')
      + '<div class="cp-cta"><a class="go" href="mailto:carlos@carlostoledo.co?subject=Contraprova%20%E2%80%94%20primeiro%20passo">carlos@carlostoledo.co</a><a href="' + NOTA + '">Nota Técnica de exemplo (PDF)</a><a href="' + DECK + '">Apresentação (PDF)</a></div></div>' }));

  /* ---- references ---- */
  const refs = [
    'Petrobras, Nossa Energia. Digital twins na Petrobras impulsionam eficiência operacional (mais de US$ 200 milhões de ganhos nas refinarias; evolução para a otimização autônoma), 2026.',
    'Agência Petrobras. Petrobras usará gêmeo digital para otimizar produção e escoamento de petróleo (piloto em Jubarte, FPSO Cidade de Anchieta e P-57, cerca de 1% de produção a mais; tecnologia da ESSS), 2026.',
    'Offshore Technology; JPT/SPE. Petrobras awards US$ 8.15 bn FPSO construction contract to Seatrium (P-84 e P-85, Atapu e Sépia, 225 mil bpd cada), 2025.',
    'ANP. Resolução n.º 43, de 6 de dezembro de 2007 — Regulamento Técnico do Sistema de Gerenciamento da Segurança Operacional (SGSO): 17 práticas de gestão; prática 13, integridade mecânica; prática 16, gerenciamento de mudanças.',
    'Moore, R. E.; Kearfott, R. B.; Cloud, M. J. Introduction to Interval Analysis. SIAM, 2009.',
    'Hansen, E.; Walster, G. W. Global Optimization Using Interval Analysis, 2.ª ed. Marcel Dekker, 2004. Rump, S. M. INTLAB — INTerval LABoratory, em Developments in Reliable Computing, Kluwer, 1999.',
    'ASME V&V 20-2009 (R2016). Standard for Verification and Validation in Computational Fluid Dynamics and Heat Transfer.',
    'NASA-STD-7009A. Standard for Models and Simulations, 2016.',
    'Oberkampf, W. L.; Roy, C. J. Verification and Validation in Scientific Computing. Cambridge University Press, 2010.',
    'ISO 19901-1:2015. Petroleum and natural gas industries — Specific requirements for offshore structures — Part 1: Metocean design and operating considerations.',
    'DNV-RP-C205. Environmental conditions and environmental loads, 2021.',
    'API RP 14E. Recommended Practice for Design and Installation of Offshore Production Platform Piping Systems (velocidade erosional), 5.ª ed., 1991.',
    'Colebrook, C. F. Turbulent flow in pipes, with particular reference to the transition region between the smooth and rough pipe laws. Journal of the Institution of Civil Engineers 11(4):133–156, 1939.',
    'Coles, S. An Introduction to Statistical Modeling of Extreme Values. Springer, 2001.',
    'Reis, Guimarães et al. Return levels of significant wave height from hindcast data: families, criteria and diagnostics (método do atlas). Ocean Engineering, 2026.',
    'Bhaskaran, S. et al. Offshore wind resource and design-wave assessment in the South Atlantic (tabela de projeto decidida). Energies 16, 6935, 2023.',
    'Petrobras. Conexões para Inovação — módulo Aquisição de Soluções: critérios e valores (Mercado&Consumo, 4 de julho de 2022).'
  ];
  B.push(C.section({ lab: 'referências', title: 'Referências citadas',
    bodyRaw: '<div class="col">' + C.p('Cada número e cada afirmação da página aponta para uma destas fontes ou para o registro do próprio demonstrador (apps/contraprova/data/gate-ledger.json e os registros em certs/). Onde a fonte é uma notícia e não um documento técnico, o número é dado como ordem de grandeza.') + '<ol class="cp-cites">' + refs.map((r) => '<li>' + esc(r) + '</li>').join('') + '</ol></div>' }));

  const ledgerJson = JSON.stringify({ receipts: G.receipts.map((r) => ({ id: r.id, receipt: r.receipt })) }).replace(/</g, '\\u003c');
  const script = '<script>' + bundleText + '</script>\n<script type="application/json" id="cp-ledger">' + ledgerJson + '</script>\n<script>' + CLIENT + '</script>';
  const foot = '<p>' + esc('Gerado por apps/contraprova/build.js a partir de certs/hseva-atlas.json, certs/hseva-ledger.json, certs/design-table-audit.json, certs/claims-ledger.json e apps/contraprova/data/gate-ledger.json; bateria do portão ' + G.battery.checks + ' verificações, ' + G.battery.fired + '/' + G.battery.reds + ' controles vermelhos.') + '</p><p>' + esc('git ' + git) + '</p>';
  return TPL.render({
    title: 'Contraprova — verificação independente de números de engenharia e IA', lang: 'pt-BR',
    desc: 'Contraprova decide, sobre o modelo físico declarado e o envelope de incerteza declarado, se um número proposto por IA, simulação ou planilha vale para toda entrada: VÁLIDO, INVÁLIDO ou INDETERMINADO com contraexemplos e o limiar que decide — num certificado que um engenheiro refaz sem o nosso código.',
    path: '/contraprova/', bodyRaw: B.join('\n\n'), footRaw: foot, cssRaw: css(), scriptRaw: script
  });
}

/* the reader's tab: every case re-decided by the bundled gate on selection */
const CLIENT = `(function () {
  var CP = self.CONTRAPROVA; if (!CP) return;
  var F = CP.F, S = CP.S, RC = CP.RC, LED = JSON.parse(document.getElementById('cp-ledger').textContent).receipts;
  var panel = document.getElementById('cp-panel'), btns = [].slice.call(document.querySelectorAll('.cp-case'));
  function core(r) { return JSON.stringify([r.verdict, r.enclosure, r.checks.map(function (c) { return [c.verdict, c.text]; }), r.thresholds]); }
  function show(i, push) {
    var c = S.cases[i];
    btns.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
    var t0 = performance.now(), r = F.decide(c.proposal, S.box, S.rules), ms = performance.now() - t0;
    var same = core(r) === core(LED[i].receipt);
    panel.innerHTML = RC.receiptHtml(c, r, S.rules.PwhMax, 'refeito agora no seu navegador em ' + Math.max(1, Math.round(ms)) + ' ms · ' + (same ? 'mesmo veredito e mesmo intervalo do registro publicado' : 'DIFERENTE do registro publicado'));
    if (push) history.replaceState(null, '', '#caso=' + c.id);
  }
  btns.forEach(function (b) { b.addEventListener('click', function () { show(+b.getAttribute('data-i'), true); }); });
  var form = document.getElementById('cp-form');
  function num(s) { s = String(s).trim().replace(/\\s/g, '').replace(',', '.'); return /^\\d+(\\.\\d+)?$/.test(s) ? s : null; }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = num(form.q.value), pd = num(form.pd.value), pwh = num(form.pwh.value);
    if (!q || !pd || !pwh || +q <= 0) { panel.innerHTML = '<p class="cp-story">Digite números positivos, por exemplo 7000, 204 e 350.</p>'; return; }
    btns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    var c = { kind: 'proposta', title: 'Sua proposta', story: 'Proposta digitada: Q = ' + q + ' m³/d, P_d = ' + pd + ' bar, P_wh prevista = ' + pwh + ' bar.' };
    var t0 = performance.now(), r;
    try { r = F.decide({ Q: q, Pd: pd, claim: { Pwh: pwh } }, S.box, S.rules); } catch (err) { panel.innerHTML = '<p class="cp-story">' + RC.esc(err.message) + '</p>'; return; }
    panel.innerHTML = RC.receiptHtml(c, r, S.rules.PwhMax, 'decidido agora no seu navegador em ' + Math.max(1, Math.round(performance.now() - t0)) + ' ms');
    history.replaceState(null, '', '#q=' + q + '&pd=' + pd + '&pwh=' + pwh);
    panel.scrollIntoView({ block: 'nearest' });
  });
  /* the dev hook: #caso=<id> or #q=..&pd=..&pwh=.. drive the same paths the controls use */
  function fromHash() {
    var h = decodeURIComponent(location.hash.slice(1)), m = /^caso=(.+)$/.exec(h);
    if (m) { for (var i = 0; i < S.cases.length; i++) if (S.cases[i].id === m[1]) show(i, false); }
    else if (/^q=/.test(h)) { h.split('&').forEach(function (kv) { var p = kv.split('='); if (form[p[0]]) form[p[0]].value = p[1]; }); form.requestSubmit(); }
  }
  fromHash(); addEventListener('hashchange', fromHash);
})();`;

module.exports = { build };
