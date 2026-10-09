/* deck.js — the Registro de Abatimento pitch deck (pt-BR, 16:9), twelve slides printed
   to PDF by headless Chrome from the SAME numbers object the page reads, drawing the
   receipt's number line with the SAME registro.js. apps/abatimento · cert-machine MIT */
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const ROOT = path.join(__dirname, '..', '..');
const T = require(path.join(ROOT, 'design', 'tokens.js'));
const RC = require('./registro.js');
const esc = RC.esc;

function css() {
  return T.rootCss() + `
@page{size:1280px 720px;margin:0}
*{box-sizing:border-box}
html,body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--f-sans);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.s{width:1280px;height:720px;padding:60px 72px 52px;position:relative;overflow:hidden;page-break-after:always;display:flex;flex-direction:column;background:var(--paper)}
.s:last-child{page-break-after:auto}
.ey{font-family:var(--f-mono);font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-4);margin:0 0 18px}
h1{font-size:58px;line-height:1.04;letter-spacing:-.04em;font-weight:560;margin:0;max-width:19ch}
h2{font-size:40px;line-height:1.08;letter-spacing:-.03em;font-weight:540;margin:0 0 26px;max-width:28ch}
p{margin:0;color:var(--ink-3);font-size:19px;line-height:1.5}
b{color:var(--ink);font-weight:520}
.ft{position:absolute;left:72px;right:72px;bottom:26px;display:flex;justify-content:space-between;font-family:var(--f-mono);font-size:11px;color:var(--ink-5);letter-spacing:.06em}
.row{display:flex;gap:28px;align-items:stretch}
.col2{display:grid;grid-template-columns:1fr 1fr;gap:28px}
.col3{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.cover{display:grid;grid-template-columns:1.25fr 1fr;gap:44px;align-items:start}
.card{background:var(--surface);border:1px solid var(--rule);border-radius:14px;padding:24px 26px;display:flex;flex-direction:column;gap:12px}
.card.core{background:var(--surface2);border-color:var(--ink-4)}
.card.claim{border-style:dashed;background:var(--paper)}
.k{font-family:var(--f-mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-4)}
.big{font-size:50px;letter-spacing:-.03em;line-height:1;color:var(--ink);font-weight:540}
.ab-chip{display:inline-flex;align-items:center;font-family:var(--f-mono);font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;padding:.45em 1em;border-radius:999px;white-space:nowrap;align-self:flex-start;border:1px solid transparent}
.ab-chip.big{font-size:17px}
.ab-chip.provado{background:var(--ink);color:var(--paper)}
.ab-chip.refutado{border-color:var(--ink-2);color:var(--ink)}
.ab-chip.recusado{border:1px dashed var(--ink-4);color:var(--ink-3)}
.ab-chip.nao{border:1px dotted var(--rule-strong);color:var(--ink-5)}
.pred{font-style:italic;color:var(--ink-3);font-size:30px;line-height:1.25}
.arch{display:grid;grid-template-columns:1fr 34px 1fr 34px 1.45fr 34px 1fr;align-items:stretch}
.arr{display:flex;align-items:center;justify-content:center;color:var(--ink-4);font-size:26px}
.arch .card h3{margin:0;font-size:20px;line-height:1.2;font-weight:540}
.arch .card p,.arch .card li{font-size:15px;line-height:1.45;color:var(--ink-3)}
.arch ol{margin:0;padding-left:18px}
table{border-collapse:collapse;width:100%;font-size:15.5px}
th{font-family:var(--f-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-4);text-align:left;font-weight:500;padding:9px 12px;border-bottom:1px solid var(--rule-strong)}
td{padding:9px 12px;border-bottom:1px solid var(--rule);color:var(--ink-2);vertical-align:top;line-height:1.35}
td:first-child{color:var(--ink)}
tr:last-child td{border-bottom:0}
ul{margin:0;padding-left:22px;color:var(--ink-2);font-size:18px;line-height:1.55}
.ab-nl{display:block;width:100%;height:auto}
.ab-nl .ab-axis{stroke:var(--c-axis);stroke-width:1}
.ab-nl .ab-enc{fill:var(--band-fill);stroke:var(--ink);stroke-width:1.5}
.ab-nl .ab-guide{stroke:var(--ink-3);stroke-width:1;stroke-dasharray:2 3}
.ab-nl .ab-claim{stroke:var(--ink-3);stroke-width:2;stroke-dasharray:5 4}
.ab-nl text{font-family:var(--f-mono);font-size:13px;fill:var(--ink-2)}
.ab-nl text.claim{font-style:italic;fill:var(--ink-3)}
.ab-nl text.dim{fill:var(--ink-4)}
.tl{display:flex;flex-direction:column;gap:12px;font-size:15px}
.tlr{display:grid;grid-template-columns:330px repeat(12,1fr);align-items:center}
.tl .h{font-family:var(--f-mono);font-size:11px;color:var(--ink-4);text-align:center}
.tl .lab{color:var(--ink);padding-right:14px;line-height:1.25}
.tl .lab span{display:block;font-family:var(--f-mono);font-size:11px;color:var(--ink-4);margin-top:3px}
.tl .bar{height:28px;border-radius:8px;background:var(--surface2);border:1px solid var(--ink-4);display:flex;align-items:center;padding:0 12px;font-family:var(--f-mono);font-size:12px;color:var(--ink-2)}
.tight .card p{font-size:16px;line-height:1.42}.tight .card{padding:18px 22px;gap:9px}
.checks{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:10px 28px}
.checks li{display:grid;grid-template-columns:118px 1fr;gap:12px;align-items:start;font-size:15px;line-height:1.35;color:var(--ink-2)}
.checks li b{display:block;color:var(--ink);font-weight:520}
`;
}

function build(N) {
  const { br, pb, tbg } = N;
  const D = N.D;
  const v1 = tbg.v1, v2 = tbg.v2;
  const ft = (n) => '<div class="ft"><span>CONTRAPROVA · REGISTRO DE ABATIMENTO · CPSI 7004641677 · carlostoledo.co/abatimento</span><span>' + n + ' / 12</span></div>';
  const S = [];
  /* 1 cover */
  S.push('<section class="s"><div class="ey">Contraprova · Registro de Abatimento · proposta para a oportunidade CPSI 7004641677 (Aquisição de Soluções, CENPES)</div><div class="cover"><div><h1>Cada potencial de abatimento com envelope, versão, rastro e recálculo — decidido, não estimado.</h1><p style="margin-top:26px;max-width:52ch">A MACC Integrada tem mais de ' + br.int(pb.macc) + ' oportunidades e o Fundo aloca US$ ' + esc(pb.fundoUSD) + ' por GEE abatido. Cada uma chega como um ponto. O registro guarda o ponto com as premissas que o produziram, como faixas com fonte, e decide sobre o envelope inteiro.</p></div>'
    + '<div class="card core"><div class="k">o que a planilha imprime · o que o registro decide</div><div class="big">' + br.int(tbg.mid) + '</div><p>tCO₂e/ano no ponto médio das premissas da eletrificação da TBG: “Moderado”.</p>' + RC.chip('RECUSADO', true) + '<p>o envelope é [' + br.int(tbg.lo1) + '; ' + br.int(tbg.hi1) + '] e atravessa 100 mil; medir o gás deslocado decide — e a v2, medida, é PROVADO Moderado.</p></div></div>' + ft(1) + '</section>');
  /* 2 problem */
  S.push('<section class="s"><div class="ey">1 · o problema</div><h2>A MACC decide por classes; o portfólio chega em pontos. Um ponto sem envelope não diz em que classe está, nem o que mudaria de classe.</h2><div class="col3">'
    + '<div class="card"><div class="k">as classes do Caderno</div><p><b>Incremental</b> 0–100 mil · <b>Moderado</b> 100 mil–1 milhão · <b>Alto</b> &gt; 1 milhão tCO₂e/ano [1, p. 76, 86]</p></div>'
    + '<div class="card claim"><div class="k">os pontos publicados</div><p class="pred">“aproximadamente ' + br.int(pb.tbgClaim) + ' tCO₂e/ano” · “aproximadamente ' + br.int(pb.bogClaim) + ' tCO₂e/ano” [1, p. 86]</p></div>'
    + '<div class="card"><div class="k">o fator que ninguém declara</div><p>O fator do SIN foi 0,0215 a 0,0289 tCO₂/MWh em quatro meses de 2025 (MCTI); o implícito no reporte da Petrobras é ' + esc(pb.irecFactor) + ' [1, p. 116]. Só ele leva a linha de escopo 2 de Incremental a Moderado.</p></div></div>'
    + '<p style="margin-top:24px"><b>E a soma que vale duas vezes:</b> amina e oxicombustão sobre os mesmos gases exaustos; uma usina solar e o I-REC sobre o mesmo escopo 2. O edital pede mecanismos contra a dupla contagem; o registro a decide.</p>' + ft(2) + '</section>');
  /* 3 product */
  S.push('<section class="s"><div class="ey">2 · o produto</div><h2>Um registro, não uma calculadora: o cenário versionado, o núcleo exato, o livro-razão e a face de revisão.</h2><div class="arch">'
    + '<div class="card"><h3>Registro</h3><p>Fonte emissora, categoria da MACC, premissas como faixas com fonte, fórmula, implantação técnica e acordada, afirmação publicada. Versionado, sha256.</p></div><div class="arr">→</div>'
    + '<div class="card claim"><h3>Quem propõe</h3><p>A planilha, a ACV, o estudo, a área. Um número e as suas premissas. Nada é recalculado por nós.</p></div><div class="arr">→</div>'
    + '<div class="card core"><h3>Núcleo</h3><ol><li>forma multilinear → extremos nos cantos (teorema)</li><li>2ⁿ cantos em racionais exatos</li><li>classe, afirmação, soma e diff decididos</li><li>sensibilidade e preço da informação</li></ol></div><div class="arr">→</div>'
    + '<div class="card"><h3>Registro de cálculo</h3><div>' + RC.chip('PROVADO') + ' ' + RC.chip('REFUTADO') + ' ' + RC.chip('RECUSADO') + '</div><p>Intervalo, testemunhas, classes, escopos, implantação, diff, comando de recálculo, segunda implementação.</p></div></div>' + ft(3) + '</section>');
  /* 4 method */
  S.push('<section class="s"><div class="ey">3 · como decide</div><h2>abatimento = Σ sinal × fator × Π premissas. Multilinear: os extremos estão nos cantos. Todos os cantos, exatos, com testemunhas.</h2><div class="col2">'
    + '<div class="card"><div class="k">por que vale</div><p>Uma forma afim em cada premissa separadamente atinge o mínimo e o máximo nos vértices da caixa. Enumerar os 2ⁿ vértices em racionais (BigInt) dá o intervalo exato — nenhuma amostra, nenhum float, nenhuma aproximação.</p><p style="margin-top:10px">A classe é PROVADA quando o intervalo cabe inteiro na faixa; REFUTADA quando fica inteiro fora; RECUSADA quando atravessa um limiar — e então o registro diz qual premissa medir, com que erro, por bisseção exata.</p></div>'
    + '<div class="card core"><div class="k">verificado</div><ul><li>segunda implementação em Python (frações), sem código em comum: ' + N.battery.refVersions + ' de ' + N.versoes + ' versões idênticas</li><li>' + br.int(N.battery.interior) + ' pontos interiores sorteados, todos dentro</li><li>' + N.battery.fired + ' de ' + N.battery.reds + ' falsificações recusadas: faixa invertida, premissa negativa, premissa repetida, implantação &gt; 1, afirmação uma unidade fora, limiar uma unidade dentro, exclusivas somadas, soma maior que a fonte, o ponto médio que inventa uma classe</li><li>cada versão re-decidida no navegador do leitor, comparada com o registro publicado</li></ul></div></div>' + ft(4) + '</section>');
  /* 5 TBG v1 */
  S.push('<section class="s"><div class="ey">4 · um registro</div><h2>TBG, eletrificação das ECOMPs, v1: a afirmação de ' + br.int(pb.tbgClaim) + ' é compatível; a classe não está decidida.</h2>'
    + '<div class="col2"><div class="card claim"><div class="k">premissas declaradas (faixa · fonte)</div><table>' + Object.entries(N.c('tbg-ecomp', 1).premissas).slice(0, 9).map(([k, p]) => '<tr><td>' + esc(k) + '</td><td>' + esc(p.lo) + ' – ' + esc(p.hi) + ' ' + esc(p.un || '') + '</td><td>' + esc(p.fonte || '') + '</td></tr>').join('') + '</table></div>'
    + '<div class="card core"><div class="k">decidido</div>' + RC.chip('RECUSADO', true) + '<p>abatimento ∈ [' + br.int(v1.enclosure[0]) + '; ' + br.int(v1.enclosure[1]) + '] tCO₂e/ano · ' + v1.cantos + ' cantos</p>' + RC.numberLine(v1, D.classes) + '<p><b>de onde vem a largura:</b> ' + v1.sensibilidade.linhas.slice(0, 3).map((l) => esc(l.premissa) + ' ' + esc(l.parcelaPct) + '%').join(' · ') + '</p><p><b>o que decidiria:</b> ' + esc(v1.sensibilidade.preco.texto) + '.</p></div></div>' + ft(5) + '</section>');
  /* 6 v1->v2 */
  const d = tbg.diff;
  S.push('<section class="s"><div class="ey">5 · versões</div><h2>v2: o gás deslocado foi medido. Uma premissa estreitou; a classe ficou decidida. O diff é parte do registro.</h2><div class="col2">'
    + '<div class="card"><div class="k">v1 → v2</div><table><tr><th>premissa</th><th>mudança</th><th>antes</th><th>depois</th></tr>' + d.premissas.map((p) => '<tr><td>' + esc(p.premissa) + '</td><td>' + esc(p.mudanca) + '</td><td>' + esc(p.antes.join(' – ')) + '</td><td>' + esc(p.depois.join(' – ')) + '</td></tr>').join('') + '</table><p style="margin-top:12px">intervalo [' + br.int(d.envelope.antes[0]) + '; ' + br.int(d.envelope.antes[1]) + '] → [' + br.int(d.envelope.depois[0]) + '; ' + br.int(d.envelope.depois[1]) + '] · largura ' + br.int(d.envelope.larguraAntes) + ' → ' + br.int(d.envelope.larguraDepois) + ' · a fórmula não mudou</p></div>'
    + '<div class="card core"><div class="k">v2 decidida</div>' + RC.chip('PROVADO', true) + '<p>classe <b>Moderado</b> para toda premissa do envelope</p>' + RC.numberLine(v2, D.classes) + '<p>A afirmação publicada continua compatível. O registro guarda as duas versões, quem mudou o quê, e o que isso fez ao número — o que o edital chama de controle de versão de cenários e hipóteses.</p></div></div>' + ft(6) + '</section>');
  /* 7 double counting */
  S.push('<section class="s tight"><div class="ey">6 · agregação</div><h2>A soma que o registro recusa, e a que prova. Dupla contagem decidida, não recomendada.</h2><div class="col2">'
    + '<div class="card"><div class="k">FPSO X: amina + oxicombustão</div>' + RC.chip('RECUSADO', true) + '<p>As duas atuam sobre os mesmos gases exaustos e são exclusivas: a soma [' + br.int(N.ccus.both.result.lo) + '; ' + br.int(N.ccus.both.result.hi) + '] conta o mesmo abatimento duas vezes e, no alto do envelope, ultrapassa o que a unidade emite. Cada uma, sozinha, é PROVADO Moderado — e “Alto”, a classe da ação na frota, é REFUTADO para uma unidade.</p></div>'
    + '<div class="card"><div class="k">escopo 2 Brasil: usina solar + I-REC</div>' + RC.chip('RECUSADO', true) + '<p>A mesma eletricidade abatida duas vezes: a usina evita a compra; o I-REC já neutralizou a compra. O registro recusa a soma e guarda as duas linhas, com o fator do SIN como premissa declarada [' + esc(N.c('irec-2025').premissas.fe_sin.lo) + '; ' + esc(N.c('irec-2025').premissas.fe_sin.hi) + '].</p></div></div>'
    + '<div class="row" style="margin-top:16px"><div class="card core" style="flex:1"><div class="k">as somas que o registro prova</div><p>FPSO X: amina + FGRU (fontes distintas) — [' + br.int(N.ccus.ok.result.lo) + '; ' + br.int(N.ccus.ok.result.hi) + '] tCO₂e/ano, dentro da emissão das fontes. Portfólio com uma escolha por fonte: [' + br.int(N.portfolio.result.lo) + '; ' + br.int(N.portfolio.result.hi) + '] tCO₂e/ano.</p></div></div>' + ft(7) + '</section>');
  /* 8 requirements */
  S.push('<section class="s"><div class="ey">7 · aderência ao edital</div><h2>Os oito grupos de requisitos da oportunidade 7004641677, um a um.</h2><ul class="checks">'
    + '<li>' + RC.chip('PROVADO') + '<div><b>1 · apoio à decisão, não inventário; relatório</b>o objeto é a decisão sobre cada potencial; relatórios gerados dos registros</div></li>'
    + '<li>' + RC.chip('PROVADO') + '<div><b>2 · baseline × solução; unidade funcional; escalonamento</b>a fórmula é a diferença declarada; implantação como frações por ano</div></li>'
    + '<li>' + RC.chip('RECUSADO') + '<div><b>3 · ciclo de vida, operacional ≠ ACV</b>a ACV entra como faixa declarada com o estudo pinado e é somada à parte — E3 do plano</div></li>'
    + '<li>' + RC.chip('PROVADO') + '<div><b>4 · escopos 1, 2, 3, evitadas; dupla contagem; níveis</b>escopo por termo; soma exata por nível com auditoria de exclusividade e de excesso</div></li>'
    + '<li>' + RC.chip('PROVADO') + '<div><b>5 · intervalos, premissas, sensibilidade, TRL</b>o núcleo do método: toda premissa é um intervalo e a decisão vale para ele inteiro</div></li>'
    + '<li>' + RC.chip('PROVADO') + '<div><b>6 · técnico × acordado; ramp-up</b>o quadro de implantação de cada registro</div></li>'
    + '<li>' + RC.chip('RECUSADO') + '<div><b>7 · dados internos do roadmap</b>entram como premissas declaradas nas unidades da Petrobras — E1 e E4; caixa aberta por construção</div></li>'
    + '<li>' + RC.chip('PROVADO') + '<div><b>8 · governança, versões, reprodutibilidade, revisão</b>registro append-only com sha256, diff entre versões, segunda implementação, registro de cálculo</div></li></ul>'
    + '<p style="margin-top:18px;font-size:16px">RECUSADO aqui significa “atendido no plano, não no demonstrador”: a mesma palavra que usamos para um número.</p>' + ft(8) + '</section>');
  /* 9 value */
  S.push('<section class="s"><div class="ey">8 · caso de valor</div><h2>Onde entra: o Fundo, a MACC, o Caderno, a auditoria.</h2><table><tr><th>decisão</th><th>o que está em jogo</th><th>o que muda</th></tr>'
    + '<tr><td>alocar o Fundo (US$ 1,0 bi 2026–30) por custo marginal e GEE abatido</td><td>uma oportunidade classificada acima da sua classe real desloca capital</td><td>a classe só é PROVADA no envelope inteiro; a RECUSADA vem com a medição que decide</td></tr>'
    + '<tr><td>priorizar na MACC (&gt; 1.000 oportunidades)</td><td>um ranking entre envelopes que se cruzam é uma escolha</td><td>o ranking é decidido só onde os intervalos se separam</td></tr>'
    + '<tr><td>somar por ativo, área, Petrobras</td><td>exclusivas somadas; o mesmo escopo 2 duas vezes</td><td>a soma recusada não vira potencial do portfólio</td></tr>'
    + '<tr><td>publicar no Caderno e nos relatórios regulados</td><td>um ponto sem envelope quando o fator muda</td><td>cada número publicado tem registro, envelope, versão e recálculo</td></tr>'
    + '<tr><td>auditar depois</td><td>refazer o estudo</td><td>refazer o registro: um arquivo, um comando, a segunda implementação</td></tr></table>' + ft(9) + '</section>');
  /* 10 plan */
  const E = [['E1 · esquema e importação', '20 cenários reais registrados', 1, 3], ['E2 · agregação por níveis', 'dupla contagem e excesso auditados', 3, 5], ['E3 · ACV, escopo 3, não multilinear', 'intervalo externo marcado', 4, 7], ['E4 · face de revisão', 'diff, notas, relatórios dos registros', 5, 8], ['E5 · ambiente da Petrobras', 'contêiner, sem nuvem nossa', 7, 10], ['E6 · auditoria e entrega', 'rerun pelo CENPES', 10, 12]];
  S.push('<section class="s"><div class="ey">9 · plano de trabalho · 12 meses (CPSI)</div><h2>Os cenários da Petrobras no registro em três meses; a face de revisão em oito; o rerun do CENPES em doze.</h2><div class="tl"><div class="tlr"><div></div>' + Array.from({ length: 12 }, (_, i) => '<div class="h">M' + (i + 1) + '</div>').join('') + '</div>'
    + E.map((e) => '<div class="tlr"><div class="lab">' + esc(e[0]) + '<span>' + esc(e[1]) + '</span></div>' + Array.from({ length: 12 }, (_, i) => (i + 1 >= e[2] && i + 1 <= e[3]) ? '<div class="bar" style="grid-column:' + (e[2] + 1) + ' / ' + (e[3] + 2) + '">meses ' + e[2] + '–' + e[3] + '</div>' : '').join('').replace(/(<div class="bar"[\s\S]*?<\/div>)([\s\S]*)/, '$1') + '</div>').join('') + '</div>'
    + '<p style="margin-top:18px;font-size:16px">Portões: M3 a segunda implementação concorda nos 20 cenários; M6 as somas auditadas; M9 o contêiner roda na Petrobras; M12 o rerun do CENPES reproduz cada número publicado.</p>' + ft(10) + '</section>');
  /* 11 not / risks */
  S.push('<section class="s"><div class="ey">10 · o que não faz, e os riscos</div><h2>Não calcula ACV nem inventário. Não trata fórmulas não multilineares nesta versão. Não tem dados da Petrobras.</h2><div class="col2">'
    + '<div class="card"><div class="k">dito aqui</div><ul><li>a ACV entra como faixa declarada com o estudo pinado; o registro decide sobre ela, não a calcula</li><li>razões e curvas entram na E3 por aritmética intervalar, marcadas “intervalo externo”</li><li>os dados de atividade do demonstrador são ilustrativos e dizem isso na linha; os fatores físicos são tabelas públicas pinadas por sha256</li><li>um PROVADO fala do envelope declarado, não do mundo</li></ul></div>'
    + '<div class="card"><div class="k">riscos e mitigação</div><ul><li>fórmula não multilinear → intervalo externo (E3)</li><li>premissa sem faixa → faixa de largura zero, marcada</li><li>ACV inexistente → SEM DADOS, com o estudo que fecharia</li><li>exclusividade não declarada → a auditoria de excesso sobre a fonte pega a soma</li><li>“parece um inventário” → o objeto é a decisão, dito na primeira linha</li><li>equipe de um → código aberto, kit de rerun, segunda implementação, parceiro acadêmico cotado</li></ul></div></div>' + ft(11) + '</section>');
  /* 12 ask */
  S.push('<section class="s"><div class="ey">11 · o pedido</div><h2>Vinte cenários reais da MACC Integrada, nas unidades da Petrobras, registrados e decididos em três meses — no ambiente da Petrobras.</h2><div class="col2">'
    + '<div class="card core"><div class="k">o que a Petrobras leva no M3</div><p>A lista das oportunidades cuja classe o envelope não sustenta, e o que medir em cada uma; cada cenário com envelope, versão e registro de cálculo; a segunda implementação concordando em todos.</p></div>'
    + '<div class="card"><div class="k">contato</div><p><b>Carlos Toledo</b> · carlos@carlostoledo.co</p><p>carlostoledo.co/abatimento · proposta técnica (PDF) · registro de cálculo de exemplo (PDF) · código e registros: github.com/carlostoledo1891/cert-machine/tree/main/apps/abatimento</p><p style="margin-top:8px;font-size:15px">Linhagem: Contraprova (engenharia), Decidível (geofísica) e Janela (operações offshore) — o mesmo motor, em páginas públicas, desde agosto de 2026.</p></div></div>' + ft(12) + '</section>');

  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Registro de Abatimento — apresentação</title><link rel="stylesheet" href="' + T.GOOGLE_FONTS + '"><style>' + css() + '</style></head><body>' + S.join('\n') + '</body></html>';
}

async function print(html, outPath) {
  const { withChrome, settle } = require(path.join(ROOT, 'design', 'cdp.js'));
  const tmp = path.join(os.tmpdir(), 'abatimento-print-' + process.pid + '-' + Date.now() + '.html');
  fs.writeFileSync(tmp, html);
  try {
    await withChrome(async (send) => {
      await send('Page.enable'); await send('Page.navigate', { url: 'file://' + tmp }); await settle(3000);
      await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(()=>1)', awaitPromise: true });
      const pdf = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0 });
      fs.writeFileSync(outPath, Buffer.from(pdf.data, 'base64'));
    }, { port: 9241 });
  } finally { fs.unlinkSync(tmp); }
  return outPath;
}
module.exports = { build, print, css };
