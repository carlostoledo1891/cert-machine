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
  const G = N.gate, S = G.scenarios, lead = G.lead.receipt, fixed = G.fixed.receipt;
  const W = G.lead.receipt.checks.find((c) => c.id === 'limite');
  const ft = (n) => '<div class="ft"><span>CONTRAPROVA · carlostoledo.co/contraprova</span><span>Radar de Soluções Petrobras · Ciclo 3 · 2026</span><span>' + n + '/12</span></div>';
  const S_ = [];

  S_.push('<section class="s"><div class="ey">Contraprova · verificação independente para computação de engenharia e IA</div>'
    + '<div class="cover"><div><h1>Antes de um número decidir uma operação, ele passa pela contraprova.</h1>'
    + '<p style="margin-top:30px;max-width:44ch">A IA, o simulador e a planilha propõem. A Contraprova decide cada número com aritmética exata, sem compartilhar código com quem calculou — e entrega um recibo que qualquer engenheiro refaz.</p></div>'
    + '<div class="card core"><div class="k">uma recomendação de IA, decidida</div><div class="pred" style="font-size:24px">+4,2% de injeção · previsão ' + esc(lead.claim) + ' bar · confiança 97%</div>'
    + RC.chip(lead.verdict, true) + RC.numberLine(lead, S.rules.PwhMax)
    + '<p style="font-size:15px">Há entradas declaradas que levam a cabeça do poço acima de 360 bar — provado. <b>Com P_d ≤ ' + br.dec(lead.flip.pdGreen, 1) + ' bar: PROVADO.</b></p></div></div>'
    + '<div class="row" style="margin-top:auto;margin-bottom:34px;gap:14px">' + RC.chip('PROVADO', true) + RC.chip('REFUTADO', true) + RC.chip('RECUSADO', true) + '</div>'
    + ft(1) + '</section>');

  S_.push('<section class="s"><div class="ey">1 · o problema</div><h2>Números que decidem, sem recibo</h2><div class="col2">'
    + '<div class="card claim"><div class="k">o que chega hoje</div><div class="pred">previsão: 352 bar</div><div class="pred">confiança: 97%</div><p>Um número sozinho. Quem vai agir sobre ele não consegue refazê-lo.</p></div>'
    + '<div class="card"><ul><li><b>Dois programas, dois números.</b> O mesmo scipy, nos mesmos dados: ' + br.dec(N.scipy.ew.free, 2) + ' m ou ' + br.dec(N.scipy.ew.fixed, 2) + ' m de onda de 100 anos.</li>'
    + '<li><b>Sem resposta, com resultado.</b> Quando o máximo não existe, o otimizador imprime a última iteração — ' + br.int(N.atlas.ggLimit) + ' casos só no atlas público.</li>'
    + '<li><b>A pergunta certa não é “o modelo é bom em média?”</b> É: <em>este</em> número vale para as condições que declaramos?</li></ul></div>'
    + '</div>' + ft(2) + '</section>');

  S_.push('<section class="s"><div class="ey">2 · a arquitetura</div><h2>A IA propõe. A Contraprova decide.</h2><div class="arch">'
    + '<div class="card"><div class="k">dados</div><h3>Ficam onde estão</h3><p>Hindcast, boias, sensores, cadastro — dentro da Petrobras; o piloto usa dados sintéticos no formato dos reais.</p></div><div class="arr">→</div>'
    + '<div class="card claim"><div class="k">quem propõe</div><h3>IA · simulador · otimizador · planilha</h3><p>Uma proposta: um número e o que ele afirma.</p></div><div class="arr">→</div>'
    + '<div class="card core"><div class="k">contraprova</div><h3>Três camadas, em aritmética exata</h3><ol><li><b>Consistência matemática</b> — resolve as equações que declara?</li><li><b>Limites físicos</b> — massa, energia, domínio de validade</li><li><b>Restrições operacionais</b> — em toda a caixa de incerteza</li></ol></div><div class="arr">→</div>'
    + '<div class="card"><div class="k">recibo</div><h3>Verificável por máquina</h3>' + RC.chip('PROVADO') + RC.chip('REFUTADO') + RC.chip('RECUSADO') + '</div>'
    + '</div><p style="margin-top:30px"><b>Decidimos a saída, não o modelo:</b> nenhuma rede neural precisa ser aberta. Nenhum código é compartilhado com quem propôs.</p>' + ft(3) + '</section>');

  S_.push('<section class="s"><div class="ey">3 · três palavras</div><h2>Recusar também é um veredito</h2><div class="col3">'
    + '<div class="card">' + RC.chip('PROVADO', true) + '<p><b>Vale para toda entrada declarada</b> — a caixa de incerteza inteira, não uma amostra, não em média.</p></div>'
    + '<div class="card">' + RC.chip('REFUTADO', true) + '<p><b>Falha, e a falha está provada</b> — o recibo aponta a equação, o limite ou a entrada que a derruba.</p></div>'
    + '<div class="card">' + RC.chip('RECUSADO', true) + '<p><b>A evidência não decide</b> — o recibo mostra uma entrada provada de cada lado e publica o limiar que mudaria a resposta.</p></div>'
    + '</div><p style="margin-top:34px;max-width:70ch">Para IA industrial, “o modelo produziu um resultado, mas a evidência declarada não o garante” vale mais do que outro modelo com 94,7% de acurácia.</p>' + ft(4) + '</section>');

  S_.push('<section class="s"><div class="ey">4 · o portão, numa recomendação de IA</div><h2>+4,2% de injeção: recusado — e o que o decidiria</h2><div class="col2">'
    + '<div class="card claim"><div class="k">o que o modelo entrega</div><p>' + esc(S.cases[0].story) + '</p><div class="pred">previsão ' + esc(lead.claim) + ' bar · confiança 97%</div></div>'
    + '<div class="card core"><div class="k">o que a Contraprova decide</div>' + RC.chip(lead.verdict, true)
    + '<p style="font-family:var(--f-mono);font-size:15px;color:var(--ink)">P_wh ∈ [' + br.dec(lead.enclosure[0], 1) + '; ' + br.dec(lead.enclosure[1], 1) + '] bar para toda entrada declarada</p>'
    + RC.numberLine(lead, S.rules.PwhMax)
    + '<p style="font-size:15px">Uma entrada declarada leva a cabeça do poço acima de 360 bar (provado) e outra a mantém abaixo (provado). <b>Com P_d ≤ ' + br.dec(lead.flip.pdGreen, 1) + ' bar: PROVADO</b>' + (lead.flip.eps ? ' — ou mostrando rugosidade ε ≥ ' + br.dec(lead.flip.eps, 3) + ' mm' : '') + '. A 200 bar, o portão responde ' + fixed.verdict + '.</p></div>'
    + '</div>' + ft(5) + '</section>');

  const faults = S.cases.filter((c) => c.kind === 'falha');
  S_.push('<section class="s"><div class="ey">5 · sete falhas injetadas</div><h2>' + G.faults.caught + ' de ' + G.faults.of + ' pegas — cada uma com o motivo provado</h2><div class="faults">'
    + faults.map((c) => { const r = G.receipts.find((x) => x.id === c.id).receipt; return '<div class="card"><div class="k">' + esc(c.fault) + '</div>' + RC.chip(r.verdict) + '<p>' + esc(reason(r)) + '</p></div>'; }).join('')
    + '<div class="card core"><div class="k">quem confere o conferente</div><p>Uma segunda implementação em Python (decimal, 50 dígitos, sem código em comum) confere ' + G.battery.refPoints + ' entradas. ' + G.battery.fired + '/' + G.battery.reds + ' controles vermelhos a cada build.</p></div>'
    + '</div>' + ft(6) + '</section>');

  S_.push('<section class="s"><div class="ey">6 · já funciona em dados reais</div><h2>A onda de projeto de uma plataforma</h2><div class="col3">'
    + '<div class="card"><div class="k">a escala</div><div class="big">' + br.int(N.atlas.fits) + '</div><p>ajustes de valores extremos em ' + br.int(N.atlas.cells) + ' células do hindcast público — ' + br.int(N.atlas.certified) + ' provados, ' + br.int(N.atlas.refused) + ' recusados com motivo.</p></div>'
    + '<div class="card"><div class="k">o mesmo software</div><div class="big">' + N.scipy.free.agree + ' de ' + N.scipy.free.of + '</div><p>ajustes do scipy na chamada padrão que são o máximo que dizem ser (' + N.scipy.fixed.agree + ' de ' + N.scipy.fixed.of + ' com a locação fixa). Onda de 100 anos: ' + br.dec(N.scipy.ew.free, 2) + ' × ' + br.dec(N.scipy.ew.fixed, 2) + ' m.</p></div>'
    + '<div class="card"><div class="k">uma tabela publicada</div><div class="big">' + N.table.outside95 + ' de ' + N.table.decided + '</div><p>ondas de 100 anos de uma tabela de eólica offshore no Atlântico Sul fora do intervalo de 95% do registro público mais próximo (' + br.sgn(N.table.dMin, 2) + ' a ' + br.sgn(N.table.dMax, 2) + ' m).</p></div>'
    + '</div><p style="margin-top:28px">FPSOs, ancoragens, risers e turbinas offshore são dimensionados por esses números. Qualquer célula é refeita no navegador: carlostoledo.co/instruments/return-level-atlas</p>' + ft(7) + '</section>');

  S_.push('<section class="s"><div class="ey">7 · já enfrentou a IA de fronteira</div><h2>A mesma arquitetura, contra os modelos mais fortes</h2><table><thead><tr><th>o que a IA afirmou</th><th>veredito</th><th>por quê</th></tr></thead><tbody>'
    + '<tr><td>Certificado de GPT-5.4 Pro para o limite de Ramsey diagonal (HorizonMath)</td><td>' + RC.chip('REFUTADO') + '</td><td>O verificador do benchmark aceitava uma orientação; a definição exige as duas.</td></tr>'
    + '<tr><td>Iteração “não verificada” de ChatGPT 5.6 Sol, R(k,k) ≤ 3,78233^(k+o(k))</td><td>' + RC.chip('PROVADO') + '</td><td>Dois programas independentes, duas linguagens; concordam em 25 dígitos.</td></tr>'
    + '<tr><td>Biblioteca de contraexemplos achados por IA (S. Sra, ' + N.ai.countex.of + ' casos)</td><td>' + RC.chip('PROVADO') + '<br><span class="k">' + N.ai.countex.certified + ' de ' + N.ai.countex.of + '</span></td><td>' + N.ai.countex.partial + ' parciais; nenhum refutado. Verificadores escritos do enunciado.</td></tr>'
    + '</tbody></table><p style="margin-top:26px">' + br.int(N.ai.decided) + ' afirmações publicadas decididas no registro público, cada uma com o arquivo que a decidiu.</p>' + ft(8) + '</section>');

  S_.push('<section class="s"><div class="ey">8 · o que substitui</div><h2>Da segunda opinião para a contraprova</h2><table><thead><tr><th>momento</th><th>hoje</th><th>com a Contraprova</th></tr></thead><tbody>'
    + '<tr><td>A IA recomenda mudar a operação</td><td>“352 bar · confiança 97%”</td><td>RECUSADO + o limiar: P_d ≤ ' + br.dec(lead.flip.pdGreen, 1) + ' bar → PROVADO</td></tr>'
    + '<tr><td>Dois programas discordam</td><td>uma reunião</td><td>o recibo diz qual é o máximo e qual parou antes</td></tr>'
    + '<tr><td>A matemática não tem resposta</td><td>a última iteração vira resultado</td><td>RECUSADO, com a prova</td></tr>'
    + '<tr><td>Dados confidenciais</td><td>precisam sair para a auditoria</td><td>o verificador vai aos dados; o recibo viaja</td></tr>'
    + '<tr><td>Auditoria, meses depois</td><td>refazer o estudo</td><td>refazer o recibo: um arquivo, segundos</td></tr>'
    + '</tbody></table>' + ft(9) + '</section>');

  S_.push('<section class="s"><div class="ey">9 · e as alternativas</div><h2>Cada uma entrega algo. Nenhuma entrega uma prova sobre esta saída.</h2><table><thead><tr><th>alternativa</th><th>entrega</th><th>não entrega</th></tr></thead><tbody>'
    + '<tr><td>Segundo consultor</td><td>um segundo número</td><td>um árbitro entre os dois</td></tr>'
    + '<tr><td>Outro software</td><td>outra resposta, outros padrões</td><td>qual está certa</td></tr>'
    + '<tr><td>Métricas do modelo, MLOps</td><td>desempenho médio no teste</td><td>uma decisão sobre ESTA saída</td></tr>'
    + '<tr><td>IA que confere IA</td><td>uma segunda opinião</td><td>uma prova — é outro gerador</td></tr>'
    + '<tr><td>Intervalos de confiança, UQ</td><td>a dispersão estatística</td><td>se a saída respeita as equações</td></tr>'
    + '<tr><td>Verificação formal (Lean, Coq)</td><td>provas completas de programas</td><td>a escala de engenharia de hoje</td></tr>'
    + '</tbody></table>' + ft(10) + '</section>');

  const bar = (a, b, t) => '<div class="bar" style="grid-column:' + (a + 2) + ' / ' + (b + 2) + '">' + t + '</div>';
  S_.push('<section class="s"><div class="ey">10 · o projeto de PD&amp;I proposto</div><h2>Doze meses para um recibo em cada decisão</h2><div class="tl">'
    + '<div class="tlr"><div></div>' + Array.from({ length: 12 }, (_, i) => '<div class="h">' + (i + 1) + '</div>').join('') + '</div>'
    + '<div class="tlr"><div class="lab">Piloto em um fluxo real<span>IA/simulação → decisão, com a Petrobras</span></div>' + bar(0, 4, 'TRL 4 → 6') + '</div>'
    + '<div class="tlr"><div class="lab">Valores de projeto metoceânicos<span>extremos, verificador Python, recibo</span></div>' + bar(0, 6, 'TRL 4 → 6') + '</div>'
    + '<div class="tlr"><div class="lab">Contornos ambientais conjuntos<span>pesquisa: altura–período, IFORM/ISORM</span></div>' + bar(4, 12, 'TRL 2 → 4') + '</div>'
    + '<div class="tlr"><div class="lab">O portão como serviço<span>API ao lado dos modelos de IA</span></div>' + bar(6, 12, 'TRL 3 → 6') + '</div>'
    + '</div><div class="col2" style="margin-top:30px"><div><div class="k">como medimos</div><ul><li>100% dos controles vermelhos recusados</li><li>cada RECUSADO com o limiar que o decide</li><li>recibo refeito por engenheiro da Petrobras</li></ul></div>'
    + '<div><div class="k">o que pedimos</div><ul><li>um fluxo de decisão e um engenheiro-par</li><li>dados sintéticos no formato da Petrobras — nenhum dado real; scripts rodados por ela</li><li>mentoria técnica, interlocutores para a valoração, doze meses</li></ul></div></div>' + ft(11) + '</section>');

  S_.push('<section class="s"><div class="ey">11 · maturidade e contato</div><h2>O motor existe. O piloto é o próximo passo.</h2><div class="col3">'
    + '<div class="card"><div class="k">tecnologia</div><div class="big">TRL 4</div><p>Validado em laboratório, em dados públicos e em escala.</p></div>'
    + '<div class="card"><div class="k">comercial</div><div class="big">CRL 3</div><p>Aplicação definida; piloto com a Petrobras a seguir.</p></div>'
    + '<div class="card core"><div class="k">contato</div><p><b>Carlos Toledo</b>, fundador</p><p>carlos@carlostoledo.co</p><p>carlostoledo.co/contraprova</p></div>'
    + '</div><p style="margin-top:30px;font-size:15px;color:var(--ink-4)">A Contraprova entrega uma prova matemática reexecutável sobre um número — não uma certificação de classe, e não substitui a responsabilidade técnica de quem assina o projeto. Demonstrador com valores típicos e ilustrativos, não dados da Petrobras.</p>' + ft(12) + '</section>');

  if (S_.length !== 12) throw new Error('deck: expected 12 slides, built ' + S_.length);
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Contraprova — apresentação</title>'
    + '<link rel="stylesheet" href="' + T.GOOGLE_FONTS + '"><style>' + css() + '</style></head><body>' + S_.join('\n') + '</body></html>';
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
