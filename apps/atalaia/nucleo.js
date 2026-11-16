#!/usr/bin/env node
/* nucleo.js — site/atalaia/nucleo/index.html: Atalaia Núcleo, the technical-details page (D36, 2026-11-16), unlisted.
   apps/atalaia · cert-machine · 2026-11-16                                                                          MIT

   WHY. The operator, 2026-11-16, on a brainstorm draft: "I want the page you create as a new details page for the
   technical side", public and unlisted. Rebuilt here in the house template and in Portuguese from that draft (kept
   privately). Núcleo is the integrity layer: a GNSS-free region that GNSS is never allowed to shrink, a gate, and the
   bound |g − x| ≤ diam(R) + ε for any attacker (R1).

   WHAT IS ON IT. Ideas and a MODEL, each tagged: Proposto (an idea or a requirement), Calculado (a model's output, drawn
   dashed), Medido (in simulation or in data, saying which), Provado (in Lean, with the toolchain). The model lives ONCE
   in nucleo-modelo.js: this builder evaluates it to write the page's numbers and refuses if the four reference values
   move, and the same file is inlined into the page for the interactive chart. The results the page reports come from
   data/nucleo.json, written from the private records; an entry without a record stays "em andamento".

   The institute and the unit are not named; no contact; no code of the private engine (atalaia/CLAUDE.md, D27, D36).

   usage: node apps/atalaia/nucleo.js (also called at the end of apps/atalaia/build.js)                           */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const R = require('./registros.js');
const N = require('./nucleo-modelo.js');
const OUT = path.join(ROOT, 'site', 'atalaia', 'nucleo');
const die = (m) => { console.error('ATALAIA NUCLEO PAGE REFUSED: ' + m); process.exit(1); };
const esc = C.esc;
const NJ = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'nucleo.json'), 'utf8'));
const MODELO_SRC = fs.readFileSync(path.join(__dirname, 'nucleo-modelo.js'), 'utf8');

/* the four reference values the text states (alert limit 200 m), from the model; a drift refuses the page */
const REF = {
  hg0: N.autonomia(N.IMU.hg, 200, {}), hg1: N.autonomia(N.IMU.hg, 200, { carrossel: true }),
  ep0: N.autonomia(N.IMU.ep, 200, {}), ep1: N.autonomia(N.IMU.ep, 200, { carrossel: true }) };
const want = { hg0: '5:47', hg1: '12:17', ep0: '4:03', ep1: '9:31' };
for (const k of Object.keys(want)) if (N.relogio(REF[k]) !== want[k]) die('the model gives ' + N.relogio(REF[k]) + ' for ' + k + ', the text says ' + want[k]);
const rel = N.relogio;

const LV = { P: ['Proposto', 'p'], C: ['Calculado', 'p'], M: ['Medido', 'd'], L: ['Provado em Lean', 'd'] };
const chip = (l, det) => '<span class="at-st ' + LV[l][1] + '">' + esc(LV[l][0] + (det ? ' · ' + det : '')) + '</span>';
const c1 = (title, lv) => ({ raw: '<b>' + esc(title) + '</b>' + (lv ? '<span class="at-cl">' + lv + '</span>' : '') });
const c2 = (pairs) => ({ raw: pairs.map(([k, v]) => '<span class="at-cl">' + (k ? '<b>' + esc(k) + '</b> ' : '') + esc(v) + '</span>').join('') });
const src = (raw) => C.pRaw('<span class="at-src">' + raw + '</span>');
const a = (href, raw) => '<a href="' + href + '" target="_blank" rel="noopener">' + raw + '</a>';
const leanChip = (r) => r && /^provado/.test(r.estado) ? chip('L', r.mathlib ? 'Mathlib ' + r.mathlib.split(' ')[0] : '') : chip('P', 'prova em Lean em andamento');
const n = R.n;

const B = [];
B.push(C.header({ eyebrow: 'Atalaia · Núcleo · a camada de integridade · documento de trabalho · versão ' + NJ.versao + ' · ' + NJ.data,
  title: 'Atalaia Núcleo: quanto a posição pode estar errada agora',
  deck: 'Todo navegador de drone responde “onde estou?”. O Núcleo responde à pergunta que fica em aberto: quanto a posição pode estar errada agora, mesmo com alguém atacando o GNSS, numa forma que outra parte consegue recalcular.' }));
B.push('<div class="col">' + C.pull(esc('erro não detectado ≤ diam(Rₜ) + ε')) + C.p('Rₜ é a região onde o drone tem de estar, calculada sem GNSS; ε é a tolerância do GNSS. O limite vale para qualquer atacante. Tudo no Núcleo existe para encolher Rₜ sem trapacear.')
  + C.scope('Proposta de pesquisa: o lado técnico do Atalaia (a entrada é /atalaia/; a minuta, /atalaia/doutrina/). Cada número diz se é proposto, calculado por um modelo, medido (em simulação ou em dados, e onde) ou provado em Lean. Nada voou.') + '</div>');
const prov = ['r1', 'r4', 'r4g', 'p', 'r2'].filter((k) => NJ[k] && /^provado/.test(NJ[k].estado)).length;
const med = ['dem', 'vento', 'carrossel'].filter((k) => NJ[k]).length;
B.push(C.stats([
  { k: 'Resultados de fronteira', v: '6', n: 'R1 a R6, todos com varredura de anterioridade antes de qualquer afirmação' },
  { k: 'Provados em Lean', v: String(prov), n: 'R1, R4, R4 por satélite, a camada probabilística e o núcleo de solidez do R2' },
  { k: 'Medidos', v: String(med), n: 'em simulação ou em dados já no disco' },
  { k: 'Voos reais', v: '0', n: 'nenhum ainda' }]));

/* 1 · the open frontier */
const ZQ = NJ.anterioridade && NJ.anterioridade.zhu_citacao;
B.push(C.section({ lab: '1 · A fronteira em aberto', title: 'Onde ninguém está ainda', bodyRaw:
  C.p('A aviação resolveu a integridade do GNSS com níveis de proteção e um risco declarado. Três partes do mesmo problema continuam em aberto para drones que voam sem um GNSS em que se possa confiar.')
  + C.plainList([
    { b: 'Sem GNSS, não há um quadro de integridade para visão, relevo ou inércia.', raw: ZQ ? esc('Uma revisão de 2022 sobre a integridade da navegação visual diz: ') + '<q>' + esc(ZQ) + '</q>' + esc(' (Zhu, Meurer e Günther, NAVIGATION).') : esc('O ponto de partida é a revisão de Zhu, Meurer e Günther sobre a integridade da navegação visual (NAVIGATION, 2022).') },
    { b: 'Contra um adversário, a integridade da aviação não se aplica.', text: 'Ela supõe falhas aleatórias com probabilidade conhecida. Um falsificador não é uma falha aleatória: escolhe o pior momento, e um número como 10⁻⁷ não diz nada sobre ele. Contra um adversário, só um limite de pior caso é honesto.' },
    { b: 'Os limites publicados, quando existem, são do próprio fornecedor.', text: 'Calculados dentro de caixas fechadas, sem que outra parte possa refazê-los. Na aviação, os métodos formais chegaram à detecção e desvio de tráfego (o DAIDALUS da NASA, verificado em PVS); na integridade da navegação, não os encontramos ainda.' }])
  + (NJ.anterioridade && NJ.anterioridade.resumo ? C.p(NJ.anterioridade.resumo) : C.p('Uma varredura de anterioridade (a patente US 12,704,640, SemperFi, DAIDALUS, ARAIM, o laboratório de navegação de Stanford e os métodos por conjuntos) está em andamento; nenhuma afirmação de pioneirismo é feita aqui, e a regra do projeto é não fazê-la.'))
  + C.table({ cols: [{ h: 'Quem' }, { h: 'O que oferece, e o que não aparece no que publica' }], rows: [
    [c1('DJI'), c2([['Oferece:', 'um navegador fechado, que avisa.'], ['Não aparece:', 'posição externa (o modo ADN está declarado no PSDK 3.18.0 e marcado como indisponível); auditoria.']])],
    [c1('Navegação visual'), c2([['Oferece:', 'seguir voando sem GNSS.'], ['Não aparece:', 'um limite de integridade publicado para a visão aprendida.']])],
    [c1('Aviônica (por exemplo, Rockwell Collins)'), c2([['Oferece:', 'integridade GNSS com inércia; detecção de falsificação com soluções inerciais de reserva e limite de erro; o tempo até o alerta de uma navegação de reserva: a anterioridade mais próxima.'], ['Não aparece:', 'um limite de pior caso contra um atacante (os limites são estatísticos, e o GNSS volta a ancorar a reserva); recálculo por terceiros; preço de drone.']])],
    [c1('Antenas anti-interferência'), c2([['Oferece:', 'manter o sinal.'], ['Não aparece:', 'o erro de posição; e têm controle de exportação (7A005.b).']])],
    [c1('Atalaia Núcleo'), c2([['Propõe:', 'um juiz sobre qualquer navegador: um limite de pior caso, válido contra qualquer atacante, provado, e recalculável por um verificador de fora.']])]] }) }));

/* 2 · the product */
const E = require('./nucleo-esquemas.js');
const twin = (w, nw) => '<div class="nu-w">' + w + '</div><div class="nu-nw">' + nw + '</div>';
B.push(C.section({ lab: '2 · O produto', title: 'Uma camada de integridade, não um navegador', bodyRaw:
  C.p('O Núcleo recebe a saída de qualquer navegador como proposta (o EKF3 do ArduPilot, um produto de navegação visual, a posição da DJI) e decide, com um limite que consegue provar, se aquela posição pode ser usada. Os concorrentes viram entradas. Ele vive em três lugares.')
  + C.plainList([
    { b: 'A bordo · Atalaia Bordo.', raw: esc('Roda a região sem GNSS, o portão e a troca de fonte. No ArduPilot, conduz pela própria posição; num DJI, avisa e manda pairar ou pousar.') + ' ' + chip('M', 'simulação: a fatia SITL') },
    { b: 'Antes do voo · Atalaia Central.', raw: esc('Um quinto laudo, o de integridade, ao lado de rota, energia, clima e GNSS: quanto tempo cada perna continua certificável se o GNSS morrer no pior momento, contra o limite de alerta da fase. Veredito por perna: passa, não passa ou falta dado.') + ' ' + chip('P') },
    { b: 'Depois do voo · Perícia.', raw: esc('O registro lacrado refaz o EKF3 e o portão bit a bit; um verificador escrito por outra parte chega às mesmas decisões ou diz onde não chegou.') + ' ' + chip('P') }])
  + C.figure({ svgRaw: twin(E.arquitetura(false), E.arquitetura(true)), source: 'built: o diagrama da arquitetura proposta', caption: 'A arquitetura. A correção do GNSS nunca toca Rₜ: essa seta que falta é o que faz o limite valer contra um falsificador paciente. A troca segue o padrão de garantia em tempo de execução da ASTM F3269-21 (monitor de segurança, função de recuperação, chave).' })
  + C.table({ cols: [{ h: 'Quando o GNSS é atacado' }, { h: 'Via ArduPilot (segunda via, D35) e via DJI (demo no que as unidades voam)' }], rows: [
    [c1('O que a caixa pode fazer'), c2([['ArduPilot:', 'trocar a fonte de posição do EKF3 para a sua (GPS_INPUT ou navegação externa) e seguir a rota.'], ['DJI:', 'avisar e mandar pairar ou pousar pelo PSDK.']])],
    [c1('Dados que a caixa vê'), c2([['ArduPilot:', 'sensores brutos na taxa do laço, relógio comum, o receptor que ela escolhe.'], ['DJI:', 'FlyCart: 50 Hz, sem PPS; M350/M300: 400 Hz com sincronização por hardware.']])],
    [c1('Manobras para o Núcleo'), c2([['ArduPilot:', 'carrossel de guinada e manobras de prova por comando.'], ['DJI:', 'só comandos de velocidade tipo joystick, a confirmar em bancada.']])],
    [c1('Auditoria'), c2([['ArduPilot:', 'firmware aberto, imagens assinadas, reprodução determinística.'], ['DJI:', 'controlador fechado; o registro o cita.']])]] }) }));

/* 3 · the core inequality (R1) */
const r1 = NJ.r1 || {};
B.push(C.section({ lab: '3 · Resultado R1', title: 'A desigualdade central', bodyRaw:
  C.p('Duas estimativas correm lado a lado: a fundida de sempre, para a precisão, e Rₜ, que o GNSS nunca pode encolher. O portão aceita uma correção do GNSS só se ela cai dentro de Rₜ alargada por ε. Então nenhum atacante consegue esconder mais erro que o diâmetro da região mais ε.')
  + C.figure({ svgRaw: twin(E.desigualdade(false), E.desigualdade(true)), source: 'built: o desenho do R1', caption: 'A geometria do R1. A posição verdadeira xₜ está em algum ponto de Rₜ; o portão aceitou gₜ porque ela está a no máximo ε de Rₜ; logo o erro que o atacante esconde, de xₜ a gₜ, não passa do diâmetro de Rₜ mais ε, e esse caso, com xₜ e gₜ em lados opostos, é o pior.' })
  + '<div class="at-steps"><ol>'
  + '<li><p>' + esc('Se cada fonte sem GNSS fica dentro do seu limite declarado, a posição verdadeira xₜ está em Rₜ.') + '</p></li>'
  + '<li><p>' + esc('O portão aceita gₜ só se algum ponto p de Rₜ está a no máximo ε dele.') + '</p></li>'
  + '<li><p>' + esc('|gₜ − xₜ| ≤ |gₜ − p| + |p − xₜ| ≤ ε + diam(Rₜ). Nada sobre o atacante foi usado.') + '</p></li></ol></div>'
  + C.pRaw(esc('O limite é justo: um atacante que conhece Rₜ pode pôr a correção na borda oposta. Cada metro tirado de Rₜ é um metro a menos que qualquer atacante consegue esconder.') + ' ' + leanChip(r1))
  + (r1.estado === 'provado' ? C.p('Em Lean: ' + r1.enunciado + ' Toolchain ' + r1.toolchain + ', Mathlib ' + r1.mathlib + '; axiomas: ' + r1.axiomas + '.') : '')
  + (NJ.p ? C.pRaw(esc(NJ.p.resumo) + ' ' + leanChip(NJ.p)) : '')
  + C.note({ lab: 'A regra de projeto que isso impõe', bodyRaw: C.p('Uma correção que só parece consistente nunca pode alimentar Rₜ. Se alimentasse, o passo 1 dependeria de o GNSS ser honesto, e um falsificador poderia arrastar a região aos poucos (o ataque do sapo na água morna). A precisão vem da estimativa fundida; a integridade vem só de Rₜ.') })
  + C.pRaw(esc('Veredito por fase: limite abaixo do limite de alerta ') + C.tag(R.VWORD.PASSA[0], R.VWORD.PASSA[1]) + esc(' · acima ') + C.tag(R.VWORD['NAO PASSA'][0], R.VWORD['NAO PASSA'][1]) + esc(' · uma fonte sem limite declarado ') + C.tag(R.VWORD['FALTA DADO'][0], R.VWORD['FALTA DADO'][1]) + '.') }));

/* 4 · certified endurance without GNSS (the model, interactive) */
const g0 = N.grafico({ imu: 'hg', carrossel: true, arrasto: false, dv: 1, L: 200 });
const carr = NJ.carrossel;
B.push(C.section({ lab: '4 · O número do produto', title: 'Autonomia certificada sem GNSS', bodyRaw:
  C.p('Quanto tempo o drone continua certificável depois de perder o GNSS: o tempo até diam(Rₜ) + ε cruzar o limite de alerta da fase. As curvas abaixo vêm de números de ficha e de leis de crescimento simples; são calculadas, por isso tracejadas. O livro de larguras da fatia de simulação substitui este modelo.')
  + '<div class="nu-ctl"><label>Sensor inercial <select id="nu-imu"><option value="hg">HG4930-S</option><option value="ep">Epson M-G370</option></select></label>'
  + '<label><input type="checkbox" id="nu-car" checked> carrossel, 1 volta/min</label>'
  + '<label><input type="checkbox" id="nu-arr"> modelo de arrasto</label>'
  + '<label>variação do vento <input type="range" id="nu-dv" min="0.5" max="3" step="0.5" value="1"> <output id="nu-dvo">±1,0 m/s</output></label>'
  + '<label>limite de alerta <input type="range" id="nu-L" min="50" max="400" step="10" value="200"> <output id="nu-Lo">200 m</output></label></div>'
  + '<p class="nu-read" id="nu-read" aria-live="polite">' + esc('Só inercial: ' + rel(g0.a0) + ' · com as alavancas: ' + rel(g0.a1) + ' · ganho ×' + n(g0.a1 / g0.a0, 1)) + '</p>' }));
B.push(C.figure({ svgRaw: '<div class="nu-chart" id="nu-chart">' + g0.svg + '</div>', source: 'built: o modelo de nucleo-modelo.js, calculado ao abrir a página',
  caption: 'A largura da região mais ε ao longo dos minutos sem GNSS, para o sensor escolhido: só inercial (tracejado fino) e com as alavancas (tracejado grosso). Linhas tracejadas são calculadas pelo modelo, não medidas.' }));
B.push('<div class="col">' + C.table({ cols: [{ h: 'Sensor, a 200 m' }, { h: 'Autonomia certificada no modelo' }], rows: [
  [c1('HG4930-S', chip('C')), c2([['Só inercial:', rel(REF.hg0)], ['Com carrossel:', rel(REF.hg1)]])],
  [c1('Epson M-G370', chip('C')), c2([['Só inercial:', rel(REF.ep0)], ['Com carrossel:', rel(REF.ep1)]])]] })
  + C.p('Um sensor MEMS com o carrossel poderia superar o sensor tático sem ele: é uma hipótese para o R3, não um resultado.')
  + (carr ? C.pRaw(esc(carr.resumo) + ' ' + chip('M', 'simulação (SITL)')) : '')
  + C.note({ lab: 'O que o modelo supõe', bodyRaw: C.plainList([
    { text: 'Os números de viés são a instabilidade de viés das fichas, tratada como limite constante (HG4930-S: 0,25 °/h e 0,025 mg; Epson M-G370: 0,8 °/h e 24 µg). Os vieses reais de pior caso são maiores e derivam.' },
    { text: 'Nenhum erro de posição, velocidade ou atitude no instante em que o GNSS se perde; ε = 5 m, escolhido. Desenhado: 2 × o limite + ε.' },
    { text: 'Só inercial: g·ω·t³/6 + ½·a·t². Carrossel: a guinada alternada tira o viés horizontal constante do giroscópio e deixa ½·g·(ω/Ω)·t² na pior fase. O viés do giroscópio vertical, que faz o rumo derivar, não é modulado por um giro em guinada; ele, a modulação do acelerômetro e o fator de escala não estão no modelo, que por isso é otimista.' },
    { text: 'Arrasto: a região é a menor entre o limite inercial e a variação do vento vezes o tempo. A fusão real faz melhor; o trabalho com modelo do veículo da EPFL relata uma a duas ordens de grandeza (estocástico, asa fixa, testado em voo).' }]) }) + '</div>');

/* 5 · the levers */
const dem = NJ.dem, vento = NJ.vento, r4 = NJ.r4 || {};
const terr = [5, 10, 15, 20, 30, 40].map((s) => [s + ' %'].concat([10, 5, 2].map((dh) => Math.round(dh / (s / 100)) + ' m')));
B.push(C.section({ lab: '5 · As alavancas', title: 'O que encolhe Rₜ', bodyRaw:
  C.p('Cada alavanca vale pelos metros certificados que tira de Rₜ. O livro de larguras (metros por fonte, por fase, medidos em simulação) decide qual atacar primeiro; o modelo acima aposta no termo t³ do giroscópio.')
  + C.table({ cols: [{ h: 'Alavanca' }, { h: 'O que ataca, como, e onde está' }], rows: [
    [c1('Navegação inercial garantida num grupo de Lie (R2)', NJ.r2 ? leanChip(NJ.r2) : chip('P')), c2([['Ataca:', 'o acúmulo de pessimismo no núcleo inercial.'], ['Como:', 'para sistemas afins no grupo, o erro segue uma equação exatamente linear (Barrau e Bonnabel); o conjunto de erro se propaga ali, com ruído, viés e restos da rotação da Terra limitados de forma rigorosa.'], ['Onde está:', NJ.r2 ? 'o núcleo de solidez está provado em Lean (as operações do conjunto e o invariante de contenção); a log-linearidade e a exponencial de volta à posição, não.' : 'aberto como método garantido; uma nota de projeto vem antes de qualquer código.']])],
    [c1('As incógnitas como símbolos', chip('P')), c2([['Ataca:', 'as correlações perdidas entre estados.'], ['Como:', 'zonotopos com restrições mantêm um símbolo de viés através de inclinação, velocidade e posição, de modo que uma correção de relevo também encolhe o viés; os geradores são o livro de larguras.'], ['Onde está:', 'método conhecido (Scott e outros, 2016), uso novo.']])],
    [c1('Conjuntos invariantes certificados', chip('P')), c2([['Ataca:', 'a sobreaproximação por caixas.'], ['Como:', 'conjuntos de nível polinomiais que envolvem a dinâmica do erro, certificados por soma de quadrados em racionais exatos.'], ['Onde está:', 'método conhecido.']])],
    [c1('Carrossel da aeronave (R3)', carr ? chip('M', 'simulação') : chip('P')), c2([['Ataca:', 'o termo t³ dos vieses horizontais do giroscópio.'], ['Como:', 'giros lentos e alternados de guinada transformam os vieses horizontais em sinais periódicos que se cancelam a cada volta. Um giro em torno de um eixo não modula o viés ao longo desse eixo: o carrossel de guinada não tira o viés do giroscópio vertical, o que faz o rumo derivar.'], ['Onde está:', 'a rotação da IMU foi publicada para veículos terrestres, na roda (Collin, 2015); em multirrotores, não encontramos um teste em voo.']])],
    [c1('O veículo como sensor (R5)', chip('P')), c2([['Ataca:', 'a deriva da velocidade.'], ['Como:', 'uma lei de arrasto com caixas de parâmetros certificadas limita a velocidade, e o crescimento vira linear.'], ['Onde está:', 'versão estocástica testada em voo (EPFL); a versão garantida está em aberto.']])],
    [c1('O relógio contra a retransmissão (R4)', leanChip(r4)), c2([['Ataca:', 'a retransmissão com o OSNMA ligado.'], ['Como:', 'uma retransmissão só acrescenta atraso; com o relógio conhecido a ±δ, o retransmissor fica a no máximo c·δ.'], ['Onde está:', 'provado para o atraso comum; com atrasos por satélite, provado que o relógio sozinho pode não limitar nada (abaixo). O teste do relógio é de 2008 (Papadimitratos e Jovanovic); ataques que adiantam o código continuam em aberto.']])],
    [c1('Erro do relevo certificado', dem ? chip('M', 'dados') : chip('P')), c2([['Ataca:', 'o erro de altura do mapa, δh.'], ['Como:', 'uma correção de relevo vale cerca de δh / |∇h|: metade de δh, metade da correção.'], ['Onde está:', dem ? dem.resumo : 'o Copernicus contra o levantamento de 1 m de SC, já no disco; em andamento.']])],
    [c1('Casadores aprendidos sob cobertura', chip('P')), c2([['Ataca:', 'o erro da visão sem modelo.'], ['Como:', 'a cobertura conforme fixa o limite declarado; um casador que perde a cobertura perde a admissão.'], ['Onde está:', 'responde à lacuna da revisão de 2022.']])],
    [c1('Rota ótima em integridade (R6)', chip('P')), c2([['Ataca:', 'pernas que terminam em falta dado.'], ['Como:', 'escolher a rota, e onde fazer o carrossel, que minimiza diam(Rₜ) na chegada.'], ['Onde está:', 'em aberto.']])]] })
  + '<h3 class="at-h3">A largura de uma correção de relevo, pela inclinação</h3>'
  + C.figure({ svgRaw: twin(E.relevo(false, NJ.dem ? 'δh medido em 95% das células: 4,1 m na ilha, 6,5 m no Médio Vale' : ''), E.relevo(true, '')), source: 'built: δh / |∇h|, calculado', caption: 'A largura de uma correção de relevo, δh / |∇h|, para erros de altura de 10, 5 e 2 m, pela inclinação do terreno. Calculada, por isso tracejada. Certificar δh localmente leva a ilha da curva de cima para a de baixo, onde o levantamento disser.' })
  + C.table({ cols: [{ h: 'Inclinação' }, { h: 'δh / |∇h| para δh de 10, 5 e 2 m' }], rows: terr.map((r) => [c1(r[0], chip('C')), c2([['10 m:', r[1]], ['5 m:', r[2]], ['2 m:', r[3]]])]) })
  + '<h3 class="at-h3">O que uma retransmissão com atraso comum consegue, pela qualidade do relógio</h3>'
  + C.table({ cols: [{ h: 'Relógio conhecido a' }, { h: 'Limite do erro da retransmissão, c·δ' }], rows: [['±10 ns', '≤ 3,0 m'], ['±100 ns', '≤ 30 m'], ['±1 µs', '≤ 300 m']].map((r) => [c1(r[0], leanChip(r4)), c2([['', r[1]]])]) })
  + C.p('Com o OSNMA bloqueando dados de navegação forjados, um falsificador precisa retransmitir, e uma retransmissão só acrescenta atraso; se o atraso é o mesmo para todos os satélites, um receptor cuja solução de tempo precisa ficar a ±δ do relógio da caixa limita a distância do retransmissor a c·δ. Fora da cobertura: ataques que adiantam o código público e retransmitem só os bits de dados. O δ do relógio da caixa sob vibração é um número de bancada.')
  + (NJ.r4g ? C.note({ lab: 'Com atrasos diferentes por satélite (provado em Lean)', bodyRaw: C.p(NJ.r4g.resumo) + C.pRaw(leanChip(NJ.r4g)) }) : '')
  + (r4.estado === 'provado' ? C.p('Em Lean: ' + r4.enunciado + ' Toolchain ' + r4.toolchain + ', Mathlib ' + r4.mathlib + '; axiomas: ' + r4.axiomas + '.') : '')
  + (vento ? C.pRaw(esc(vento.resumo) + ' ' + chip('M', 'dados')) : '') }));

/* 6 · one mission */
B.push(C.section({ lab: '6 · Uma missão', title: 'Ressuprimento na ilha, fase a fase (sintético)', bodyRaw:
  C.plainList([
    { b: 'Antes do voo.', text: 'A Central emite cinco laudos por perna: rota, energia, clima, GNSS e o novo laudo de integridade, a autonomia certificada sem GNSS contra o limite de alerta da perna. Uma perna sobre a água dá falta dado: sem relevo, e o limite do arrasto ainda não foi medido; decidem os voos de calibração.' },
    { b: 'Cruzeiro com o GNSS honesto.', text: 'A estimativa fundida dá a precisão; Rₜ corre em paralelo sem GNSS; cada correção passa pelo portão.' },
    { b: 'O ataque começa.', text: 'Uma correção cai fora de Rₜ ⊕ ε; o alarme vem dentro do tempo declarado; o Vigia aponta a fonte provável; o limite do relógio limita o que uma retransmissão esconde.' },
    { b: 'Voar pela região.', text: 'Na via ArduPilot, a caixa troca a fonte do EKF3 e segue a rota; carrossel e correções de relevo mantêm o limite abaixo do de alerta. Na via DJI, pairar ou pousar.' },
    { b: 'Se o limite cruzar o de alerta.', text: 'A ação segura daquela perna: esperar, ou pousar numa zona avaliada antes. Nunca voltar para casa sob falsificação.' },
    { b: 'Chegada.', text: 'Descida de precisão só sobre um marcador cooperativo, com código de uso único e a confirmação do piloto (D16).' },
    { b: 'Depois do voo.', text: 'O registro lacrado vai à Perícia; o EKF3 e o portão se refazem bit a bit, e o verificador de fora recalcula cada decisão.' }])
  + C.p('A fatia de simulação já voou a primeira versão disso com o ArduPilot de verdade: sem a caixa, o falsificador levou o drone a pousar a 584 m do posto; com a caixa (emulada), o GNSS saiu da região de 100 m, foi declarado falso, a fonte do estimador foi trocada e o pouso ficou a 1,6 m. Simulação; a caixa ali não tem o seu próprio estimador.') }));

/* 7 · the machine */
B.push(C.section({ lab: '7 · A máquina', title: 'A IA propõe, os métodos exatos decidem, o campo dá a última palavra', bodyRaw:
  C.p('A mesma forma do cert-machine: gerar em escala, filtrar em ponto flutuante, certificar com exatidão. A IA nunca vira autoridade: ela propõe, e só sobrevive o que é certificado ou medido em voos registrados antes.')
  + C.figure({ svgRaw: twin(E.maquina(false), E.maquina(true)), source: 'built: o diagrama da máquina', caption: 'A máquina. Muitos candidatos entram à esquerda; saem poucos, sólidos e voáveis. O falsificador ataca cada limite certificado, e um escape em campo rebaixa a fonte que o causou, que volta a ser proposta.' })
  + C.table({ cols: [{ h: 'Ferramenta' }, { h: 'O trabalho dela no Núcleo' }], rows: [
    [c1('o motor do cert-machine'), c2([['', 'famílias de modelos candidatos (formas do erro inercial, leis de arrasto, modelos de erro do relevo, calendários de carrossel) enumeradas, filtradas nos dados e certificadas; caça a limites fechados compactos.']])],
    [c1('intervalos, Taylor, racionais exatos'), c2([['', 'restos rigorosos para as partes não lineares (a exponencial do grupo, a lei de arrasto), arredondamento para fora em toda parte.']])],
    [c1('soma de quadrados'), c2([['', 'conjuntos invariantes certificados para a dinâmica do erro.']])],
    [c1('dReal'), c2([['', 'limites não lineares conferidos em faixas inteiras de parâmetros.']])],
    [c1('Lean'), c2([['', 'R1 e R4 primeiro (pequenos); a log-linearidade do R2 depois (grande, num pod).']])],
    [c1('claimbox'), c2([['', 'cada número de ficha e cada afirmação de concorrente vira uma caixa decidida contra dados medidos; o orçamento de erro vira um livro de afirmações decididas.']])],
    [c1('agentes de IA e busca de programas'), c2([['', 'propõem modelos, código de redução de conjuntos, ataques, roteiros de prova e rotas; um candidato fica só se continua correto sob um verificador fixo e sai mais estreito em registros separados.']])]] })
  + C.p('A certificação garante a matemática. Só voos registrados antes confirmam a física, e qualquer escape rebaixa a fonte que o causou.') }));

/* 8 · frontier results */
const est = (k) => (k === 'r1' || k === 'r4') ? leanChip(NJ[k]) : chip('P');
B.push(C.section({ lab: '8 · Resultados de fronteira', title: 'O que poria o Atalaia na fronteira', bodyRaw:
  C.table({ cols: [{ h: 'Resultado' }, { h: 'Enunciado, e como se mostra' }], rows: [
    [c1('R1 · limite independente do atacante', est('r1')), c2([['Enunciado:', 'com Rₜ livre de GNSS, erro não detectado ≤ diam(Rₜ) + ε.'], ['Como:', 'Lean; dias.']])],
    [c1('R2 · navegação inercial garantida em SE₂(3)', NJ.r2 ? leanChip(NJ.r2) : est('r2')), c2([['Enunciado:', 'os conjuntos de erro se propagam exatamente na álgebra de Lie, com restos certificados.'], ['Como:', 'métodos de intervalos e Lean, num pod; meses.']])],
    [c1('R3 · deriva certificada com carrossel', carr ? chip('M', 'simulação') : chip('P')), c2([['Enunciado:', 'um limite fechado e certificado da deriva sob guinada alternada num multirrotor.'], ['Como:', 'caça a forma fechada e bancada; semanas e bancada.']])],
    [c1('R4 · limite da retransmissão', est('r4')), c2([['Enunciado:', 'OSNMA e um relógio conhecido a ±δ ⇒ erro da retransmissão ≤ c·δ.'], ['Como:', 'Lean e um modelo de relógio; dias.']])],
    [c1('R5 · navegação garantida pelo modelo do veículo', chip('P')), c2([['Enunciado:', 'uma lei de arrasto com caixas de parâmetros certificadas limita a velocidade.'], ['Como:', 'dReal e voos; meses.']])],
    [c1('R6 · rota ótima em integridade', chip('P')), c2([['Enunciado:', 'a rota que minimiza diam(Rₜ) na chegada, sob relevo, textura e vento.'], ['Como:', 'branch-and-bound com intervalos; semanas.']])]] })
  + C.p('R1 e R4, como enunciados acima, são passos curtos: valem como alicerce. O núcleo matemático tem quatro frentes. Três estão provadas em Lean: a solidez do R2 (cada operação do estimador leva um conjunto que contém o erro verdadeiro a outro que ainda o contém), o R4 com atrasos por satélite (que mostrou que o relógio sozinho não basta) e a camada probabilística. A quarta, o R3 provado com a medida de quão justo é Rₜ, está em andamento.')
  + (NJ.r2 ? C.p(NJ.r2.resumo) : '')
  + C.p('Cada um passa por uma varredura de anterioridade antes de qualquer afirmação, e nenhum é anunciado como o primeiro.') }));

/* 9 · path, gates and prices */
B.push(C.section({ lab: '9 · Caminho, portões e preços', title: 'Nada se compra antes de um portão passar', bodyRaw:
  C.plainList([
    { b: 'G0 · simulação, US$ 0.', text: 'O ArduPilot em SITL sobre a ilha, um modelo multirrotor, um caso de falsificação, a caixa trocando a fonte do EKF3; o livro de larguras; R1 e R4 em Lean. Pods com teto de US$ 10.' },
    { b: 'G1 · bancada, cerca de US$ 1,1 mil.', text: 'Conjunto Cube Orange+, Jetson Orin Nano, receptor u-blox ZED-X20P, antena HC977. O hardware no laço precisa chegar às mesmas decisões do SITL.' },
    { b: 'G2 · aeronave aberta de desenvolvimento, cerca de US$ 3,5 a 5,5 mil, mais baterias e o sensor inercial.', text: 'Holybro X650 com Pixhawk 6X, a caixa de voo, rádio de telemetria homologado na Anatel. Carrossel e arrasto em voos reais num campo autorizado.' },
    { b: 'G3 · plataforma pesada, numa fase posterior, US$ 29 a 46 mil.', text: 'IF1200A (ArduPilot) ou Alta X Gen2, ou um DJI emprestado. A demo DJI usa o que a unidade voa.' }])
  + '<h3 class="at-h3">O plano de 12 meses</h3>'
  + C.figure({ svgRaw: twin(E.plano(false, { r1r4: 'provados', larguras: 'em andamento', r2: 'núcleo provado' }), E.plano(true, { r1r4: 'provados', larguras: 'em andamento', r2: 'núcleo provado' })), source: 'built: o cronograma indicativo da proposta e a trilha proposta do Núcleo', caption: 'Barras cheias: o cronograma indicativo da proposta. Barras tracejadas: a trilha do Núcleo, proposta aqui. O que já foi feito está dito ao lado do nome.' })
  + C.table({ cols: [{ h: 'Conjunto' }, { h: 'O que, e o preço' }], rows: [
    [c1('Simulação'), c2([['', 'ArduPilot SITL, o software da caixa e os cenários da Central: US$ 0.']])],
    [c1('Bancada'), c2([['', 'Cube Orange+ US$ 349,90 · Orin Nano US$ 399 · X20P US$ 187 · HC977 US$ 203: cerca de US$ 1,1 mil.']])],
    [c1('Aeronave aberta'), c2([['', 'kit X650 US$ 899 (versões com Pixhawk 6X de US$ 1,4 a 1,85 mil; 3,1 kg de carga com 10 Ah) · Herelink 1.1 de US$ 0,9 a 1,5 mil · caixa de voo sem o sensor tático cerca de US$ 1,4 mil: cerca de US$ 3,5 a 5,5 mil.']])],
    [c1('Aberta pesada'), c2([['', 'IF1200A (ArduPilot, 8,7 kg, 43 min) de US$ 29 a 40 mil · Alta X Gen2 (15,9 kg) US$ 39.650, versão NDAA US$ 45.650.']])],
    [c1('DJI de desenvolvimento'), c2([['', 'M400 de US$ 10,3 a 10,45 mil + Manifold 3 · M350 RTK descontinuado: de US$ 9,1 a 11,1 mil em estoque, US$ 7,5 mil usado.']])],
    [c1('DJI de carga, no Brasil'), c2([['', 'FlyCart 30 de R$ 171 a 313 mil · FlyCart 100 combo de R$ 261 a 291 mil, em anúncios de revendas.']])]] })
  + C.p('Preços de revenda nos EUA antes de frete e impostos brasileiros; estimativa de planejamento, não cotação: peças pequenas pelo Remessa Conforme chegam a cerca do dobro do preço nos EUA. O Herelink ainda não está homologado na Anatel, e a classificação de exportação das plataformas pesadas precisa vir por escrito antes de qualquer pedido.') }));

/* 10 · decided */
B.push(C.section({ lab: '10 · Já decidido', title: 'As decisões do operador', bodyRaw:
  C.table({ cols: [{ h: 'Questão' }, { h: 'Decisão' }], rows: [
    ['Piloto automático aberto', 'segunda via; a DJI fica para a demo'], ['Qual', 'ArduPilot'], ['Fatia SITL antes da reunião', 'feita, privada'],
    ['Valores dos portões', 'como escritos, rotulados como estimativas'], ['Plataforma pesada', 'fase posterior'], ['Regras e licenças', 'verificadas, em privado'],
    ['GPLv3', 'nos pontos para o jurídico'], ['Dados públicos', 'sim, lida a licença de cada um'], ['Pods', 'permitidos, teto de US$ 10'],
    ['O Núcleo', 'background IP; R1 a R6 entram na proposta dentro dos pacotes de arquitetura e de validação']].map((r) => [c1(r[0]), c2([['', r[1]]])]) }) }));

/* 11 · limits */
B.push(C.section({ lab: '11 · Limites', title: 'O que não é a nossa luta, e os riscos', bodyRaw:
  C.plainList([
    { b: 'Não é a nossa luta.', text: 'Autonomia e pilotos de IA; corridas de precisão da navegação visual; drones baratos descartáveis; hardware anti-interferência e guerra eletrônica.' },
    { b: 'Linhas vermelhas.', text: 'Só recepção: nunca emitir, bloquear ou falsificar; nenhuma antena CRPA (7A005.b); nenhum rastreamento de alvo e nenhuma guiagem a um ponto qualquer do solo (D16); um piloto sempre no comando, como o RBAC nº 100 exige.' },
    { b: 'Riscos.', text: 'O limite de pior caso pode sair largo demais para voar, e o livro de larguras responde isso primeiro. Os modelos físicos são onde entra a falsa confiança: limites a partir de dados com cobertura, rebaixados a cada escape. A instabilidade de viés não é um limite, então o modelo acima é otimista. A certificação exata prova a matemática, não a física. O carrossel gasta energia e balança uma carga pendurada.' }]) }));

/* 12 · sources */
const SRC = [
  ['https://navi.ion.org/content/69/2/navi.518', 'Zhu, Meurer e Günther, integridade da navegação visual (NAVIGATION, 2022)'],
  ['https://arxiv.org/pdf/1904.09251', 'Hartley e outros, EKF invariante com contato (erro log-linear)'],
  ['https://arxiv.org/pdf/2208.03427.pdf', 'Chang e Luo, modelo de erro log-linear do INS'],
  ['https://portal.mardi4nfdi.de/wiki/Publication:2288615', 'zonotopos com restrições para estimação de conjuntos não linear (Automatica, 2020)'],
  ['https://isprs-archives.copernicus.org/articles/XL-3-W4/117/2016/', 'Khaghani e Skaloud, navegação pelo modelo dinâmico do veículo (ISPRS, 2016)'],
  ['https://www.gpsworld.com/research-mems-imu-carouseling-for-ground-vehicles/', 'Collin, carrossel de IMU MEMS em veículos terrestres (a IMU na roda)'],
  ['https://store.astm.org/f3269-21.html', 'ASTM F3269-21, garantia em tempo de execução'],
  ['https://gps.mae.cornell.edu/Paper_F5_8_ION_GNSS_2013b.pdf', 'Cornell, detecção de falsificação por movimento forçado da antena (ION GNSS 2013)'],
  ['https://par.nsf.gov/servlets/purl/10314805', 'SemperFi, manobra de verificação ativa para VANTs'],
  ['https://patents.google.com/patent/US12704640B2/en', 'Rockwell Collins, US 12,704,640, detecção de falsificador com limite de erro de alta integridade'],
  ['https://patents.google.com/patent/US11168986B2/en', 'Rockwell Collins, US 11,168,986, navegação inercial de reserva e tempo até o alerta'],
  ['https://navi.ion.org/content/70/4/navi.616', 'Mina, Kanhere, Kousik e Gao, o GPS conferido contra o conjunto alcançável da IMU (NAVIGATION, 2023)'],
  ['https://experts.arizona.edu/en/publications/an-ins-monitor-to-detect-gnss-spoofers-capable-of-tracking-vehicl/', 'Tanil, Khanafseh, Joerger e Pervan, monitor inercial contra falsificadores (IEEE TAES, 2018)'],
  ['https://arxiv.org/abs/1001.0025', 'Papadimitratos e Jovanovic, proteção do GNSS por relógio (2008)'],
  ['https://ardupilot.org/copter/docs/airspeed-estimation.html', 'ArduPilot, estimação do vento pelo arrasto'],
  ['https://ardupilot.org/sub/docs/common-ekf-sources.html', 'ArduPilot, seleção de fontes do EKF'],
  ['https://ardupilot.org/dev/docs/secure-firmware.html', 'ArduPilot, firmware assinado'],
  ['https://docs.px4.io/main/en/dev_log/flight_log_analysis_statistical', 'PX4, logs públicos (CC BY)'],
  ['https://www.caa.cz/wp-content/uploads/2024/12/SORA-v2.5-Main-Body-Release-JAR_doc_25.pdf', 'JARUS SORA 2.5'],
  ['https://pergamum.anac.gov.br/arquivos/RBAC100EMD00.pdf', 'ANAC, RBAC nº 100']];
B.push(C.section({ lab: '12 · Fontes', title: 'Lidas no rascunho e na verificação', bodyRaw:
  C.plainList(SRC.map(([u, t]) => ({ raw: a(u, esc(t)) }))) }));

const foot = '<p>' + esc('Atalaia Núcleo, versão ' + NJ.versao + ', ' + NJ.data + '. Preparado por Carlos Toledo, com ajuda de IA (Claude) na pesquisa e na redação. Documento de trabalho: não é doutrina aprovada nem proposta comercial. Linhas tracejadas são calculadas a partir de fórmulas e de números de ficha; preços são anúncios de revendas; os resultados medidos e provados vêm de apps/atalaia/data/nucleo.json, escrito a partir dos registros privados do projeto.') + '</p>';
const css = R.CSS_BASE + `
.at-steps ol{margin:var(--s-4) 0;padding-left:1.6em;display:flex;flex-direction:column;gap:var(--s-2)}
.at-steps li::marker{font-family:var(--f-mono);color:var(--ink-4)}
.at-steps li p{margin:0}
.nu-svg{display:block;width:100%;height:auto}
.nu-nw{display:none}
@media (max-width:640px){.nu-w{display:none}.nu-nw{display:block}}
.nu-bs{font-size:var(--text-small);fill:var(--ink-3)}
.nu-sec{font-family:var(--f-mono)!important;font-size:var(--text-eyebrow);letter-spacing:var(--track-eyebrow);fill:var(--ink-3)}
.nu-sec2{font-family:var(--f-mono)!important;font-size:var(--text-eyebrow);letter-spacing:var(--track-eyebrow);fill:var(--ink-4)}
.nu-reg{fill:var(--band-fill);stroke:var(--ink);stroke-width:2}
.nu-eps{fill:none;stroke:var(--ink-3);stroke-width:1.5;stroke-dasharray:5 4}
.nu-err{stroke:var(--ink);stroke-width:2.2}
.nu-x{fill:var(--ink);stroke:var(--paper);stroke-width:2}
.nu-g{fill:var(--paper);stroke:var(--ink);stroke-width:2.2}
.nu-dim{stroke:var(--ink-3);stroke-width:1.2}
.nu-forbid{stroke:var(--ink-3);stroke-width:1.6;stroke-dasharray:2 3}
.nu-rule{stroke:var(--ink-4);stroke-width:1}
.nu-fb{fill:none;stroke:var(--ink-3);stroke-width:1.4;stroke-dasharray:5 4}
.nu-t10{fill:none;stroke:var(--ink-3);stroke-width:1.5;stroke-dasharray:5 4}
.nu-t5{fill:none;stroke:var(--ink-2);stroke-width:2;stroke-dasharray:5 4}
.nu-t2{fill:none;stroke:var(--ink);stroke-width:2.75;stroke-dasharray:5 4}
.nu-bar{fill:var(--ink-3);stroke:none}
.nu-bar.prop{fill:var(--band-fill);stroke:var(--ink);stroke-width:1.4;stroke-dasharray:5 4}
.nu-gl{font-size:var(--text-small);fill:var(--ink-2)}
.nu-svg text{font-family:var(--f-sans)!important}
.nu-chart{aspect-ratio:720/340}
.nu-grid{stroke:var(--rule);stroke-width:1}
.nu-ax{font-family:var(--f-mono)!important;font-size:12px;fill:var(--ink-3)}
.nu-axl{font-size:13px;fill:var(--ink-3)}
.nu-lim{stroke:var(--ink);stroke-width:1.5}
.nu-c0{fill:none;stroke:var(--ink-3);stroke-width:2;stroke-dasharray:5 4}
.nu-c1{fill:none;stroke:var(--ink);stroke-width:3.5;stroke-dasharray:5 4}
.nu-mk{fill:var(--paper);stroke:var(--ink);stroke-width:2}
.nu-lb{font-size:13px;font-weight:600;fill:var(--ink);paint-order:stroke;stroke:var(--paper);stroke-width:4px;stroke-linejoin:round}
.nu-box{fill:var(--sunk);stroke:var(--rule-strong);stroke-width:1.2}
.nu-box.nu-key{stroke:var(--ink);stroke-width:2}
.nu-bt{font-size:14px;fill:var(--ink)}
.nu-arr{stroke:var(--ink-3);stroke-width:1.6}
.nu-ahp{fill:var(--ink-3)}
.nu-ctl{display:flex;flex-wrap:wrap;gap:var(--s-3) var(--s-5);align-items:center;margin:var(--s-4) 0 var(--s-2);font-size:var(--text-small);color:var(--ink-2)}
.nu-ctl label{display:inline-flex;align-items:center;gap:var(--s-2)}
.nu-ctl select{font:inherit;color:var(--ink);background:var(--sunk);border:1px solid var(--rule-strong);border-radius:var(--radius-s);padding:2px var(--s-2)}
.nu-ctl output{font-family:var(--f-mono);min-width:5.5em}
.nu-read{font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink);min-height:1.5em}
`;
const script = '<script>' + MODELO_SRC.replace(/<\/script/gi, '<\\/script') + `
(function(){var $=function(i){return document.getElementById(i)};
function fmt(v){return '±'+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+' m/s'}
function draw(){var o={imu:$('nu-imu').value,carrossel:$('nu-car').checked,arrasto:$('nu-arr').checked,dv:+$('nu-dv').value,L:+$('nu-L').value};
$('nu-dvo').textContent=fmt(o.dv);$('nu-Lo').textContent=o.L+' m';var g=NUCLEO.grafico(o);$('nu-chart').innerHTML=g.svg;
$('nu-read').textContent='Só inercial: '+NUCLEO.relogio(g.a0)+' · com as alavancas: '+NUCLEO.relogio(g.a1)+(g.a0&&g.a1?' · ganho ×'+(g.a1/g.a0).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1}):'')}
['nu-imu','nu-car','nu-arr','nu-dv','nu-L'].forEach(function(i){$(i).addEventListener('input',draw);$(i).addEventListener('change',draw)})})();
</script>`;
let html = TPL.render({ title: 'Atalaia Núcleo: a camada de integridade', bodyRaw: B.join('\n\n'), footRaw: foot, lang: 'pt-BR', cssRaw: css, scriptRaw: script,
  desc: 'Atalaia Núcleo, o lado técnico do Atalaia: uma região de proteção que o GNSS nunca encolhe, um portão, e o limite de erro que vale contra qualquer atacante; o modelo da autonomia certificada sem GNSS, as alavancas, os resultados de fronteira, portões e preços.', path: '/atalaia/nucleo/' });
html = html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, nofollow">');
if (!/name="robots" content="noindex/.test(html)) html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log('site/atalaia/nucleo/index.html written (unlisted, v' + NJ.versao + '): model ' + want.hg0 + '/' + want.hg1 + '/' + want.ep0 + '/' + want.ep1 + '; proved ' + prov + ', measured ' + med);
