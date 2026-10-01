/* deck.js — the Contraprova pitch deck (pt-BR, 16:9), twelve slides printed
   to PDF by headless Chrome. It reads the SAME numbers object the page reads
   (numbers.js) and draws receipts with the SAME receipt.js, so the deck
   cannot state a figure the page does not. apps/contraprova · cert-machine MIT */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const T = require(path.join(ROOT, 'design', 'tokens.js'));
const RC = require('./receipt.js');
const { br } = require('./numbers.js');
const esc = RC.esc;

function css() {
  return T.rootCss() + `
@page{size:1280px 720px;margin:0}
*{box-sizing:border-box}
html,body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--f-sans);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.s{width:1280px;height:720px;padding:60px 72px 52px;position:relative;overflow:hidden;page-break-after:always;display:flex;flex-direction:column;background:var(--paper)}
.s:last-child{page-break-after:auto}
.ey{font-family:var(--f-mono);font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-4);margin:0 0 18px}
h1{font-size:64px;line-height:1.02;letter-spacing:-.04em;font-weight:560;margin:0;max-width:17ch}
h2{font-size:42px;line-height:1.08;letter-spacing:-.03em;font-weight:540;margin:0 0 28px;max-width:26ch}
p{margin:0;color:var(--ink-3);font-size:19px;line-height:1.5}
b{color:var(--ink);font-weight:520}
.ft{position:absolute;left:72px;right:72px;bottom:26px;display:flex;justify-content:space-between;font-family:var(--f-mono);font-size:11px;color:var(--ink-5);letter-spacing:.06em}
.row{display:flex;gap:28px;align-items:stretch}
.col2{display:grid;grid-template-columns:1fr 1fr;gap:28px}
.cover{display:grid;grid-template-columns:1.25fr 1fr;gap:44px;align-items:start}
.cover h1{font-size:60px}
.col3{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.card{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:24px 26px;display:flex;flex-direction:column;gap:12px}
.card.core{background:var(--surface2);border-color:var(--ink-4)}
.card.claim{border-style:dashed;background:var(--paper)}
.k{font-family:var(--f-mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-4)}
.big{font-size:52px;letter-spacing:-.03em;line-height:1;color:var(--ink);font-weight:540}
.cp-chip{display:inline-flex;align-items:center;font-family:var(--f-mono);font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;
  padding:.45em 1em;border-radius:999px;white-space:nowrap;align-self:flex-start;border:1px solid transparent}
.cp-chip.big{font-size:17px}
.cp-chip.provado{background:var(--ink);color:var(--paper)}
.cp-chip.refutado{border-color:var(--ink-2);color:var(--ink)}
.cp-chip.recusado{border:1px dashed var(--ink-4);color:var(--ink-3)}
.pred{font-style:italic;color:var(--ink-3);font-size:34px}
.arch{display:grid;grid-template-columns:1fr 34px 1fr 34px 1.45fr 34px 1fr;align-items:stretch}
.arr{display:flex;align-items:center;justify-content:center;color:var(--ink-4);font-size:26px}
.arch .card h3{margin:0;font-size:20px;line-height:1.2;font-weight:540}
.arch .card p,.arch .card li{font-size:15px;line-height:1.45;color:var(--ink-3)}
.arch ol{margin:0;padding-left:18px}
table{border-collapse:collapse;width:100%;font-size:16px}
th{font-family:var(--f-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-4);text-align:left;font-weight:500;padding:10px 14px;border-bottom:1px solid var(--rule-strong)}
td{padding:12px 14px;border-bottom:1px solid var(--rule);color:var(--ink-2);vertical-align:top;line-height:1.4}
td:first-child{color:var(--ink)}
tr:last-child td{border-bottom:0}
.faults{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.faults .card{padding:16px 18px;gap:10px}
.faults .card p{font-size:13.5px;line-height:1.4}
.faults .n{font-size:17px;color:var(--ink);font-weight:520;line-height:1.2}
.tl{display:flex;flex-direction:column;gap:14px;font-size:16px}
.tlr{display:grid;grid-template-columns:300px repeat(12,1fr);align-items:center}
.tl .h{font-family:var(--f-mono);font-size:11px;color:var(--ink-4);text-align:center}
.tl .lab{color:var(--ink);padding-right:14px;line-height:1.25}
.tl .lab span{display:block;font-family:var(--f-mono);font-size:11px;color:var(--ink-4);margin-top:3px}
.tl .bar{height:30px;border-radius:8px;background:var(--surface2);border:1px solid var(--ink-4);display:flex;align-items:center;padding:0 12px;font-family:var(--f-mono);font-size:12px;color:var(--ink-2)}
ul{margin:0;padding-left:22px;color:var(--ink-2);font-size:18px;line-height:1.55}
.cp-nl{display:block;width:100%;height:auto}
.cp-nl .cp-axis{stroke:var(--c-axis);stroke-width:1}
.cp-nl .cp-enc{fill:var(--band-fill);stroke:var(--ink);stroke-width:1.5}
.cp-nl .cp-guide{stroke:var(--ink-3);stroke-width:1;stroke-dasharray:2 3}
.cp-nl .cp-claim{stroke:var(--ink-3);stroke-width:2;stroke-dasharray:5 4}
.cp-nl text{font-family:var(--f-mono);font-size:12px;fill:var(--ink-2)}
.cp-nl text.claim{font-style:italic;fill:var(--ink-3)}
`;
}

function reason(r) {
  const c = r.checks.find((x) => /Dividido/.test(x.text)) || r.checks.find((x) => x.verdict !== 'PROVADO' && x.verdict !== 'NÃO AVALIADO');
  if (!c) return '';
  const t = c.text, i = t.search(/ (Fica|Dividido)/);
  const s = i > 0 ? t.slice(i + 1) : t.split(/(?<=\.)\s/)[0];
  return c.name + ': ' + s;
}

function build(N) {
  const G = N.gate, S = G.scenarios, lead = G.lead.receipt, fixed = G.fixed.receipt, MC = G.mc;
  const ft = (n) => '<div class="ft"><span>CONTRAPROVA · carlostoledo.co/contraprova</span><span>Radar de Soluções Petrobras · Ciclo 3 · 2026</span><span>' + n + '/12</span></div>';
  const GL = { PROVADO: 'válido para toda entrada do envelope declarado', REFUTADO: 'inválido: a falha está provada', RECUSADO: 'indeterminado: contraexemplos dos dois lados e o limiar que decide' };
  const gl = (v) => '<div>' + RC.chip(v, true) + '<div class="gl">' + esc(GL[v]) + '</div></div>';
  const pct = (x) => (100 * x).toFixed(1).replace('.', ',') + '%';
  const bar1 = (x) => br.dec(x, 1) + ' bar';
  const S_ = [];

  S_.push('<section class="s"><div class="ey">Contraprova · Engenharia de Reservatórios, Elevação e Escoamento</div>'
    + '<div class="cover"><div><h1>Decidir, antes de agir, se um número de IA ou simulação vale para toda a incerteza declarada.</h1>'
    + '<p style="margin-top:26px;max-width:46ch">Sobre o modelo físico declarado e o envelope de incerteza declarado das entradas: o intervalo garantido da saída por aritmética intervalar rigorosa — a garantia de pior caso — e um de três vereditos sobre cada número, num certificado que um engenheiro refaz sem o nosso código.</p></div>'
    + '<div class="card core"><div class="k">uma recomendação de IA, decidida</div><div class="pred" style="font-size:22px">+4,2% de injeção · previsão ' + esc(lead.claim) + ' bar · confiança 97%</div>'
    + RC.chip(lead.verdict, true) + RC.numberLine(lead, S.rules.PwhMax)
    + '<p style="font-size:14px">Uma entrada admissível passa do limite a <b>' + bar1(MC.cornerAbove) + '</b>, outra o respeita a ' + bar1(MC.cornerBelow) + ' — ambas verificadas. Um estudo por sorteio diria “' + pct(MC.pOver) + '” e pararia em ' + bar1(MC.max) + '. <b>Com P_d ≤ ' + br.dec(lead.flip.pdGreen, 1) + ' bar: VÁLIDA.</b></p></div></div>'
    + '<div class="row" style="margin-top:auto;margin-bottom:34px;gap:22px">' + gl('PROVADO') + gl('REFUTADO') + gl('RECUSADO') + '</div>' + ft(1) + '</section>');

  S_.push('<section class="s"><div class="ey">1 · o problema em números</div><h2>Gêmeos digitais e IA já propõem números de operação e de projeto na Petrobras; agir sobre cada um continua sem prova</h2><div class="col2" style="font-size:15px">'
    + '<div class="card" style="padding:18px 22px"><div class="k">o que já decide (fontes públicas)</div><ul style="font-size:15px"><li>Mais de <b>US$ 200 milhões</b> de ganhos com gêmeos digitais nas refinarias; evolução para a otimização autônoma (Petrobras, 2026).</li><li>Jubarte: piloto de gêmeo digital de produção e escoamento, <b>≈ 1%</b> de produção a mais, validado para uso (Agência Petrobras, 2026).</li><li>Cada FPSO do pré-sal: <b>225 mil bpd</b> (P-84/P-85, US$ 8,15 bi pelos dois; Seatrium, 2025).</li></ul></div>'
    + '<div class="card claim" style="padding:18px 22px"><div class="k">o que chega hoje</div><div class="pred" style="font-size:26px">previsão: 352 bar · confiança: 97%</div><ul style="font-size:14px"><li>Dois programas, dois números: o mesmo scipy, nos mesmos dados, dá ' + br.dec(N.scipy.ew.free, 2) + ' m ou ' + br.dec(N.scipy.ew.fixed, 2) + ' m de onda de 100 anos.</li><li>Sem resposta, com resultado: quando o máximo não existe, o otimizador imprime a última iteração — ' + br.int(N.atlas.ggLimit) + ' casos no atlas público.</li><li>A mudança de vazão é uma mudança sob o SGSO (ANP 43/2007, práticas 13 e 16).</li></ul></div>'
    + '</div><p style="margin-top:14px;font-size:16px">A pergunta que o fluxo atual não responde não é “o modelo é bom em média?”. É: <b>este número vale para as condições que declaramos?</b></p>' + ft(2) + '</section>');

  S_.push('<section class="s"><div class="ey">2 · o que a Petrobras já faz, e o que acrescenta</div><h2>A validação e a UQ avaliam o modelo; a Contraprova acrescenta a decisão sobre cada saída, com prova</h2><table style="font-size:14px"><thead><tr><th>hoje</th><th>entrega</th><th>o que acrescenta (anexo e portão; nada é substituído)</th></tr></thead><tbody>'
    + '<tr><td>Validação de modelos, MLOps, V&amp;V (ASME V&amp;V 20, NASA-STD-7009)</td><td>desempenho médio e credibilidade do modelo</td><td>uma decisão sobre ESTA saída: o intervalo garantido e o veredito</td></tr>'
    + '<tr><td>UQ, intervalos de confiança</td><td>a dispersão estatística</td><td>se a saída respeita as equações e as regras em todo o envelope</td></tr>'
    + '<tr><td>Segundo cálculo, outro software</td><td>um segundo número</td><td>o árbitro: qual é o máximo, qual parou antes</td></tr>'
    + '<tr><td>Revisão por par ou classificadora</td><td>o julgamento do especialista</td><td>a re-derivação mecânica de cada número, como insumo</td></tr>'
    + '<tr><td>Gerenciamento de mudanças (SGSO)</td><td>o registro da mudança</td><td>o certificado de decisão como registro técnico reexecutável</td></tr>'
    + '<tr><td>Auditoria, meses depois</td><td>refazer o estudo</td><td>refazer o certificado: um arquivo, segundos</td></tr>'
    + '</tbody></table>' + ft(3) + '</section>');

  S_.push('<section class="s"><div class="ey">3 · como decide</div><h2>Modelo físico com fonte; intervalo garantido por aritmética intervalar; contraexemplos verificados</h2><div class="arch">'
    + '<div class="card"><div class="k">envelope declarado</div><h3>Entradas como faixas</h3><p>L, D, ε, ρ, μ, Δz como intervalos com fonte; as regras de operação declaradas.</p></div><div class="arr">→</div>'
    + '<div class="card claim"><div class="k">quem propõe</div><h3>IA · simulador · otimizador · planilha</h3><p>Um número e o que ele afirma; o modelo não precisa ser aberto.</p></div><div class="arr">→</div>'
    + '<div class="card core"><div class="k">o método</div><h3>Garantia de pior caso sobre o envelope</h3><ol><li>Colebrook e Darcy–Weisbach; extremos por máxima verossimilhança (Coles)</li><li>Intervalos com arredondamento para fora; a raiz cercada por monotonicidade; bissecção do envelope</li><li>Uma entrada verificada de cada lado, e o limiar que decide</li></ol></div><div class="arr">→</div>'
    + '<div class="card"><div class="k">certificado de decisão</div><h3>Uma página</h3>' + RC.chip('PROVADO') + RC.chip('REFUTADO') + RC.chip('RECUSADO') + '<p>veredito, intervalo, contraexemplos, limiares, reprodução</p></div>'
    + '</div><p style="margin-top:16px;font-size:14px"><b>Verificação:</b> segunda implementação em Python (decimal, 50 dígitos, sem código em comum) em ' + G.battery.refPoints + ' entradas; ' + G.battery.fired + '/' + G.battery.reds + ' casos de controle negativos a cada build; cada caso re-decidido no navegador. <b>Fora desta versão, dito:</b> transientes, multifásico, perfil térmico, erosão como modelo (E5).</p>' + ft(4) + '</section>');

  const c1 = lead.checks.find((k) => k.id === 'limite');
  S_.push('<section class="s"><div class="ey">4 · demonstração · o portão, numa recomendação de IA</div><h2>+4,2% de injeção: INDETERMINADA no envelope — e o que a tornaria VÁLIDA</h2><div class="col2">'
    + '<div class="card claim"><div class="k">o que o modelo entrega</div><p>' + esc(S.cases[0].story) + '</p><div class="pred">previsão ' + esc(lead.claim) + ' bar · confiança 97%</div></div>'
    + '<div class="card core"><div class="k">o que a Contraprova decide</div>' + RC.chip(lead.verdict, true)
    + '<p style="font-family:var(--f-mono);font-size:15px;color:var(--ink)">P_wh ∈ [' + br.dec(lead.enclosure[0], 1) + '; ' + br.dec(lead.enclosure[1], 1) + '] bar para toda entrada declarada</p>'
    + RC.numberLine(lead, S.rules.PwhMax)
    + '<p style="font-size:14px">' + esc(c1.text.replace('A caixa declarada contém entradas', 'O envelope contém entradas')) + '</p><p style="font-size:14px"><b>' + esc(lead.thresholds[0]) + '</b> A 200 bar: ' + fixed.verdict + ', P_wh ∈ [' + br.dec(fixed.enclosure[0], 1) + '; ' + br.dec(fixed.enclosure[1], 1) + '] bar.</p></div>'
    + '</div>' + ft(5) + '</section>');

  const faults = S.cases.filter((c) => c.kind === 'falha');
  S_.push('<section class="s"><div class="ey">4 · demonstração · sete falhas injetadas e o Monte Carlo cara a cara</div><h2>' + G.faults.caught + ' de ' + G.faults.of + ' falhas pegas com o motivo provado; o pior sorteio para em ' + bar1(MC.max) + ', o envelope prova ' + bar1(MC.cornerAbove) + '</h2><div class="faults">'
    + faults.map((c) => { const r = G.receipts.find((x) => x.id === c.id).receipt; return '<div class="card"><div class="k">' + esc(c.fault) + '</div>' + RC.chip(r.verdict) + '<p>' + esc(reason(r)) + '</p></div>'; }).join('')
    + '<div class="card core"><div class="k">Monte Carlo cara a cara</div><p><b>' + pct(MC.pOver) + '</b> de ' + br.int(MC.draws) + ' sorteios passam de 360 bar; o pior sorteio para em ' + bar1(MC.max) + ', e o envelope contém uma entrada provada a <b>' + bar1(MC.cornerAbove) + '</b>. A fração fala de um prior uniforme não declarado; o veredito não depende dela.</p></div>'
    + '</div>' + ft(6) + '</section>');

  S_.push('<section class="s"><div class="ey">4 · demonstração · já funciona em dados reais</div><h2>A onda de projeto de uma plataforma: o máximo provado, ou a recusa com a prova</h2><div class="col3">'
    + '<div class="card"><div class="k">a escala</div><div class="big">' + br.int(N.atlas.fits) + '</div><p>ajustes de valores extremos em ' + br.int(N.atlas.cells) + ' células do hindcast público — ' + br.int(N.atlas.certified) + ' provados, ' + br.int(N.atlas.refused) + ' recusados com motivo (Reis, Guimarães et al. 2026; Coles 2001).</p></div>'
    + '<div class="card"><div class="k">o mesmo software</div><div class="big">' + N.scipy.free.agree + ' de ' + N.scipy.free.of + '</div><p>ajustes do scipy na chamada padrão que são o máximo que dizem ser (' + N.scipy.fixed.agree + ' de ' + N.scipy.fixed.of + ' com a locação fixa). Onda de 100 anos: ' + br.dec(N.scipy.ew.free, 2) + ' × ' + br.dec(N.scipy.ew.fixed, 2) + ' m.</p></div>'
    + '<div class="card"><div class="k">uma tabela publicada</div><div class="big">' + N.table.outside95 + ' de ' + N.table.decided + '</div><p>ondas de 100 anos de uma tabela de projeto eólico (Bhaskaran et al. 2023) fora do intervalo de 95% do registro público mais próximo (' + br.sgn(N.table.dMin, 2) + ' a ' + br.sgn(N.table.dMax, 2) + ' m).</p></div>'
    + '</div><p style="margin-top:16px;font-size:14px">FPSOs, ancoragens, risers e turbinas offshore são dimensionados por esses números (ISO 19901-1; DNV-RP-C205); qualquer célula é refeita no navegador. Calibração prévia contra a IA de fronteira: ' + br.int(N.ai.decided) + ' afirmações publicadas decididas (um certificado de GPT-5.4 Pro refutado; uma iteração de ChatGPT 5.6 Sol confirmada por dois programas).</p>' + ft(7) + '</section>');

  S_.push('<section class="s"><div class="ey">5 · caso de valor</div><h2 style="font-size:34px">Seis decisões em que o certificado entra; a de maior custo é fixar um valor de projeto</h2><table style="font-size:12.5px"><thead><tr><th>decisão</th><th>custo em jogo</th><th>o que muda</th><th>evidência</th></tr></thead><tbody>'
    + '<tr><td>Fixar a onda de projeto</td><td>a base de projeto de cascos, ancoragens e risers (dois FPSOs: US$ 8,15 bi)</td><td>o máximo provado, ou a recusa com prova</td><td>' + br.int(N.atlas.certified) + ' provados; ' + br.int(N.atlas.ggLimit) + ' recusados</td></tr>'
    + '<tr><td>Agir sobre uma recomendação de IA ou gêmeo digital</td><td>sobrepressão → integridade da linha → parada do injetor → suporte de pressão adiado; a mudança sob o SGSO</td><td>veredito sobre o envelope inteiro antes de agir; o limiar que torna a recomendação válida</td><td>+4,2%: INDETERMINADA; VÁLIDA com P_d ≤ ' + br.dec(lead.flip.pdGreen, 1) + ' bar</td></tr>'
    + '<tr><td>Arbitrar dois programas</td><td>um estudo, semanas</td><td>qual é o máximo, qual parou antes</td><td>' + br.dec(N.scipy.ew.free, 2) + ' × ' + br.dec(N.scipy.ew.fixed, 2) + ' m</td></tr>'
    + '<tr><td>Aceitar um número de fornecedor</td><td>o estudo e a decisão que informa</td><td>a distância ao registro público, célula a célula</td><td>' + N.table.outside95 + ' de ' + N.table.decided + '</td></tr>'
    + '<tr><td>Registrar uma mudança (SGSO, práticas 13 e 16)</td><td>conformidade; o registro técnico</td><td>o certificado como registro reexecutável</td><td>Nota Técnica de exemplo</td></tr>'
    + '<tr><td>Auditar meses depois</td><td>refazer o estudo</td><td>refazer o certificado: um arquivo, segundos</td><td>cada caso re-decidido no navegador</td></tr>'
    + '</tbody></table><p style="margin-top:8px;font-size:12.5px">Dono: reservatórios, elevação e escoamento; engenharia submarina; segurança operacional. Frequência: a do fluxo — cada recomendação que vira ação, cada base de projeto, cada mudança. Viabilidade financeira: entrega E3b.</p>' + ft(8) + '</section>');

  S_.push('<section class="s"><div class="ey">6 · estado da arte</div><h2>Nas referências consultadas, a V&amp;V e a UQ avaliam o modelo; nenhuma decide uma saída sobre o envelope com um certificado reexecutável</h2><ul style="font-size:16px">'
    + '<li><b>ASME V&amp;V 20; NASA-STD-7009; Oberkampf e Roy 2010</b>: credibilidade de códigos e modelos, não a decisão sobre uma saída</li><li><b>Moore, Kearfott e Cloud 2009; Hansen e Walster 2004; INTLAB</b>: aritmética intervalar verificada — o método, aqui aplicado a números de engenharia</li><li><b>Coles 2001; ISO 19901-1; DNV-RP-C205; API RP 14E</b>: extremos, valores de projeto e limites de operação</li><li><b>Reis, Guimarães et al. 2026; Bhaskaran et al. 2023</b>: o método do atlas; a tabela decidida</li><li><b>Resolução ANP 43/2007 (SGSO)</b>: integridade mecânica e gerenciamento de mudanças — onde o certificado entra</li><li><b>MLOps, UQ bayesiana, verificação formal</b>: desempenho médio, dispersão, provas de programas — nenhum decide esta saída, nestas condições</li></ul>'
    + '<p style="margin-top:16px">A busca não foi sistemática; a revisão por domínio é parte de E4. Referências completas na página.</p>' + ft(9) + '</section>');

  const bar = (a, b, t) => '<div class="bar" style="grid-column:' + (a + 2) + ' / ' + (b + 2) + '">' + t + '</div>';
  S_.push('<section class="s"><div class="ey">7 · plano de trabalho</div><h2 style="font-size:32px">Doze meses: um fluxo de decisão da Petrobras com certificado em cada número, sobre dados sintéticos, rodado por ela</h2><div class="tl" style="font-size:12px;gap:7px">'
    + '<div class="tlr"><div></div>' + Array.from({ length: 12 }, (_, i) => '<div class="h">' + (i + 1) + '</div>').join('') + '</div>'
    + '<div class="tlr"><div class="lab">E1 Fluxo e envelope declarados<span>dados sintéticos no formato da Petrobras · TRL 4</span></div>' + bar(0, 2, 'assinado pelo engenheiro-par') + '</div>'
    + '<div class="tlr"><div class="lab">E2 O portão ao lado do modelo<span>certificados por saída; controles do domínio · TRL 5</span></div>' + bar(2, 5, '3 certificados refeitos à mão') + '</div>'
    + '<div class="tlr"><div class="lab">E3 Plano de redução de incerteza<span>por INDETERMINADO, por custo</span></div>' + bar(3, 6, 'aceito pelo ativo') + '</div>'
    + '<div class="tlr"><div class="lab">E3b Valoração econômica<span>entrevistas com interlocutores da Petrobras</span></div>' + bar(3, 6, 'relatório de valoração validado') + '</div>'
    + '<div class="tlr"><div class="lab">E4 Valores de projeto metoceânicos<span>extremos com certificado; revisão de literatura · TRL 5</span></div>' + bar(4, 8, 'aceito pela engenharia submarina') + '</div>'
    + '<div class="tlr"><div class="lab">E5 Integração<span>scripts prontos, rodados pela Petrobras; SGSO · TRL 5–6</span></div>' + bar(6, 10, 'a Petrobras roda sobre os dados reais') + '</div>'
    + '<div class="tlr"><div class="lab">E6 Contornos ambientais (pesquisa)<span>altura–período, IFORM/ISORM · TRL 2–4</span></div>' + bar(8, 12, 'um contorno decidido') + '</div>'
    + '</div><p style="margin-top:8px;font-size:12px"><b>Portões:</b> M0 kick-off, dados sintéticos entregues, NDA · M3 primeiros certificados (se &gt; 50% INDETERMINADO: estreitar por medição antes de E4) · M6 revisão com a valoração, go/no-go E4–E6 · M12 entrega e implantação. <b>Pedimos:</b> um fluxo e uma pergunta; dados sintéticos no formato da Petrobras — nenhum dado real; um engenheiro-par (4 h/semana) e interlocutores para a valoração; doze meses.</p>' + ft(10) + '</section>');

  S_.push('<section class="s"><div class="ey">8 · riscos, modelo de negócio, implantação</div><h2 style="font-size:34px">O maior risco técnico é o modelo declarado ficar aquém do fluxo real; a mitigação está no plano</h2><div class="col2">'
    + '<div class="card" style="padding:12px 16px"><table style="font-size:12px"><thead><tr><th>risco</th><th>mitigação</th></tr></thead><tbody><tr><td>Modelo aquém do fluxo</td><td>escopo dito; cada modelo entra declarado com o seu envelope e os seus controles; “o veredito fala do modelo declarado”</td></tr><tr><td>Excesso de INDETERMINADO</td><td>todo INDETERMINADO com o limiar ou a medição que decide; portão M3; envelopes estreitados por medição, nunca por hipótese</td></tr><tr><td>Acesso a dados</td><td>nenhum dado real é pedido: dados sintéticos no formato da Petrobras e os públicos; scripts prontos rodados pela Petrobras dentro do seu ambiente</td></tr><tr><td>A palavra “certificação”</td><td>prova matemática reexecutável sobre um número; não substitui a responsabilidade técnica de quem assina</td></tr><tr><td>Equipe de uma pessoa</td><td>engenheiro-par; segunda implementação já existente; colaboração acadêmica iniciada</td></tr></tbody></table></div>'
    + '<div><div class="card core"><div class="k">modelo de negócio</div><p style="font-size:14px">PD&amp;I: contrato de inovação de 12 meses no instrumento do módulo (referência: até R$ 1,6 mi por proposta no módulo Aquisição de Soluções, 2022). Depois: o portão como serviço ao lado dos modelos (licença anual por ativo, com a biblioteca de modelos declarados, os controles e o suporte) ou o certificado como anexo por relatório; a Petrobras escolhe no M12. O núcleo de aritmética é MIT e fica aberto. <b>Viabilidade financeira:</b> não estimada de fora — é a entrega E3b.</p></div>'
    + '<div class="card" style="margin-top:14px"><div class="k">PI e implantação</div><p style="font-size:14px">Titularidade conforme a regra do módulo; modelos, envelopes e certificados do ativo são da Petrobras; nenhum dado sai do ambiente. <b>Critério de sucesso:</b> ao final do M12, um engenheiro da Petrobras roda o portão sobre uma saída nova do seu fluxo, dentro da Petrobras e sem o autor, e anexa o certificado ao registro da decisão.</p></div></div>'
    + '</div>' + ft(11) + '</section>');

  S_.push('<section class="s"><div class="ey">9 e 10 · maturidade, equipe e o pedido</div><h2>Primeiro passo: um fluxo de decisão e dados sintéticos no formato da Petrobras; certificados das suas saídas em quatro semanas.</h2><div class="col3">'
    + '<div class="card"><div class="k">tecnologia</div><div class="big">TRL 4</div><p>Validado em laboratório, em dados públicos e em escala; DOI 10.5281/zenodo.22800699.</p></div>'
    + '<div class="card"><div class="k">comercial</div><div class="big">CRL 3</div><p>Aplicação definida; piloto a seguir. Equipe: Carlos Toledo (ex-EmbraerX); colaboração acadêmica iniciada; engenheiro-par no piloto.</p></div>'
    + '<div class="card core"><div class="k">contato</div><p><b>Carlos Toledo</b>, fundador</p><p>carlos@carlostoledo.co</p><p>carlostoledo.co/contraprova</p><p style="font-size:13px">Nota Técnica de exemplo: carlostoledo.co/contraprova/nota-tecnica-exemplo.pdf</p></div>'
    + '</div><p style="margin-top:24px;font-size:14px;color:var(--ink-4)">Prova matemática reexecutável sobre um número — não certificação de classe; não substitui a responsabilidade técnica de quem assina. Demonstrador com valores típicos e ilustrativos, não dados da Petrobras.</p>' + ft(12) + '</section>');

  if (S_.length !== 12) throw new Error('deck: expected 12 slides, built ' + S_.length);
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Contraprova — apresentação</title>'
    + '<link rel="stylesheet" href="' + T.GOOGLE_FONTS + '"><style>' + css() + '.gl{font-family:var(--f-mono);font-size:11px;color:var(--ink-3);margin-top:6px;max-width:26ch;line-height:1.35}</style></head><body>' + S_.join('\n') + '</body></html>';
}

async function print(html, outPath) {
  const fs = require('fs'), os = require('os');
  const { withChrome, settle } = require(path.join(ROOT, 'design', 'cdp.js'));
  const tmp = path.join(os.tmpdir(), 'contraprova-deck-' + process.pid + '.html');
  fs.writeFileSync(tmp, html);
  try {
    await withChrome(async (send) => {
      await send('Page.enable');
      await send('Page.navigate', { url: 'file://' + tmp });
      await settle(3500);                                              /* real wait: fonts */
      const pdf = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0 });
      fs.writeFileSync(outPath, Buffer.from(pdf.data, 'base64'));
    }, { port: 9241 });
  } finally { fs.unlinkSync(tmp); }
}

module.exports = { build, print, css, reason };
