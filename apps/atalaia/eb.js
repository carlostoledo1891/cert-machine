#!/usr/bin/env node
/* eb.js — site/atalaia/eb/index.html: Atalaia for military interlocutors (D31, 2026-11-16), unlisted.
   apps/atalaia · cert-machine · 2026-11-16                                                                          MIT

   WHY. The operator, 2026-11-16, after outside reviews of v0.4: "create the EB html page". A short page for officers
   of the Brazilian Army (EB) that translates the minuta into a command question — when the navigation can no longer be
   trusted, the decision must stay justifiable — and states ONE thing: the partnership is open for testing in a
   battalion's context, with no commitment (the operator, later the same day: "we are asking too many things on the
   page. I have the contact"; the list of asks and the mail link were removed, the battalion stays unnamed). It does not imitate an official document: no coat of arms, no Army visual identity, no "approved",
   "COTER project" or "doctrine of the Army"; it says on its face that it is an independent initiative with no
   endorsement and that nothing has flown. The landing (/atalaia/) and the minuta (/atalaia/doutrina/) stay the other
   two doors.

   WHAT IT COMPARES. The 2025 ESAO study the minuta already cites (Souza e Burity, Revista Agulhas Negras v. 9 n. 14,
   doi:10.70545/ran.v9i14.13519: a constructive simulation in COMBATER of a FlyCart 30 resupplying an isolated
   reconnaissance platoon in the mountains), read in full from the private copy (atalaia/referencias). Every fact about
   it below is the paper's own: 57 kg a day, the three vectors, 100% of the Fennec shot down, up to 89% delivered with
   22–33% losses, weather and jamming NOT simulated (its section 5), the GPS variation in mountains (its review), the
   recommendation of practical trials. The tone is the operator's D19: the study is a reason this proposal exists,
   never a criticism of its authors (the autonomy figure of its table is not mentioned).

   NO CODE (D27): numbers come from registros.js (the records, pinned); the one film is pre-rendered. pt-BR (the
   project's rule). The unit the operator talks to and its people are never named (atalaia/CLAUDE.md, rule 7b).

   usage: node apps/atalaia/eb.js (also called at the end of apps/atalaia/build.js)                               */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const R = require('./registros.js');
const { VERSAO, AV, FR, KG, R12, R30, CAP, EVID, fa, faOk, n } = R;
const OUT = path.join(ROOT, 'site', 'atalaia', 'eb');
const die = (m) => { console.error('ATALAIA EB PAGE REFUSED: ' + m); process.exit(1); };
const esc = C.esc;
const vt = (v) => C.tag(R.VWORD[v][0], R.VWORD[v][1]);
const LV = { D: ['Demonstrado', 'd'], P: ['Proposto', 'p'] };
const chip = (l, det) => '<span class="at-st ' + LV[l][1] + '">' + esc(LV[l][0] + (det ? ' · ' + det : '')) + '</span>';
const c1 = (title, lv) => ({ raw: '<b>' + esc(title) + '</b>' + (lv ? '<span class="at-cl">' + lv + '</span>' : '') });
const c2 = (pairs) => ({ raw: pairs.map(([k, v]) => '<span class="at-cl">' + (k ? '<b>' + esc(k) + '</b> ' : '') + esc(v) + '</span>').join('') });
const src = (raw) => C.pRaw('<span class="at-src">' + raw + '</span>');
const a = (href, raw) => '<a href="' + href + '" target="_blank" rel="noopener">' + raw + '</a>';

/* the numbers this page states in words, checked against the records before a word is written */
if (FR.pedido_kg_dia !== 57) die('the daily demand is no longer the ESAO study\'s 57 kg: ' + FR.pedido_kg_dia);
if (EVID.some((e) => e.l !== 'D')) die('a test result is marked other than Demonstrado; this page says nothing has flown');
const FILM = { f: 'ilha-morros', t: 'Um posto nos morros, com o GNSS falsificado no caminho' };
if (!R.PROV.registros['filmes/' + FILM.f + '.mp4']) die('the film ' + FILM.f + ' is not pinned in PROVENANCE.json');

const B = [];
B.push(C.header({ eyebrow: 'Atalaia · ' + R.MARCA.lema + ' · proposta independente · versão ' + VERSAO.n + ' · ' + VERSAO.data,
  title: 'Quando a navegação deixa de ser confiável, a decisão precisa continuar justificável',
  deck: 'Atalaia é uma proposta de protocolo para avaliar a integridade da navegação, a segurança da missão e a auditabilidade no emprego de sistemas de aeronaves remotamente pilotadas (SARP). Não é uma aeronave nem um sistema pronto: é um método para decidir, com critérios escritos antes do voo, quando uma missão pode continuar, quando precisa ser interrompida e quando não há dados suficientes para decidir.' }));
B.push('<div class="col">' + C.scope('Proposta em pesquisa: resultados de simulação e de bancada, nenhum voo real validado. Iniciativa independente de Carlos Toledo, sem vínculo com o Exército Brasileiro e sem endosso dele: não é documento do Exército, não foi submetida ao Sistema de Doutrina Militar Terrestre (SIDOMT) e não é doutrina aprovada.') + '</div>');
B.push(C.stats([
  { k: 'Voos reais validados', v: '0', n: 'nenhum ainda; o primeiro é a etapa de calibração' },
  { k: 'Resultados documentados', v: String(EVID.length), n: 'simulação, bancada, dados gravados e vetores oficiais' },
  { k: 'Áreas de teste sintético', v: '2', n: 'a ilha de Florianópolis e o Médio Vale do Itajaí (SC)' },
  { k: 'Parceria', v: 'aberta', n: 'para testes no contexto de um batalhão' }]));

/* 1 · the command problem */
B.push(C.section({ lab: '1 · O problema de comando', title: 'Decidir sobre uma posição que pode estar errada', bodyRaw:
  C.p('A posição que o GNSS informa a um SARP (o GPS americano, o Galileo europeu e sistemas parecidos, que juntos se chamam GNSS) pode estar indisponível, degradada ou errada. O sinal chega do espaço muito fraco e é fácil de abafar ou de imitar: em janeiro de 2025, um bloqueador escondido em Belo Horizonte fez 21 aeronaves perderem o GPS na aproximação do aeroporto da Pampulha. Uma aeronave que confia no GNSS sem conferir pode ser desviada devagar, sem que o piloto perceba.')
  + C.p('Para quem comanda, perder o sinal é o caso mais fácil, porque se nota. O caso difícil é tomar uma decisão acreditando que a informação de navegação está correta quando ela já não está. São as perguntas que o Atalaia procura responder:')
  + C.plainList([
    { text: 'O que acontece quando a posição informada pelo GNSS deixa de ser confiável?' },
    { text: 'Como saber se a missão ainda pode ser autorizada?' },
    { text: 'Como registrar que uma decisão foi tomada com informação insuficiente?' },
    { text: 'Como avaliar a segurança sem depender só da confiança no equipamento?' },
    { text: 'Como transformar uma experiência isolada em conhecimento para a organização?' }])
  + src('Fonte: Anatel e Polícia Militar, apreensão do bloqueador (Convergência Digital, 24/01/2025).') }));

/* 2 · the proposal */
B.push(C.section({ lab: '2 · A proposta', title: 'Quatro perguntas antes do voo, três respostas possíveis', bodyRaw:
  C.p('Antes de cada missão, quatro perguntas, cada uma com veredito próprio. Uma missão pode ser viável e, ainda assim, não estar pronta; separar as perguntas deixa isso à vista.')
  + C.table({ cols: [{ h: 'Pergunta' }, { h: 'O que se confere' }], rows: [
    [c1('Viabilidade'), c2([['', 'A missão pode ser feita nas condições conhecidas? Rota, energia no pior caso pela ficha do fabricante, clima e GNSS.']])],
    [c1('Resiliência'), c2([['', 'Se o GNSS e o enlace caírem no pior ponto, há uma saída segura já autorizada?']])],
    [c1('Segurança'), c2([['', 'Os estados da missão, os limites por fase e as ações estão aprovados por quem responde?']])],
    [c1('Auditabilidade'), c2([['', 'O voo vai poder ser reconstruído e conferido por outra equipe?']])]] })
  + C.pRaw(esc('Cada pergunta responde ') + vt('PASSA') + ', ' + vt('NAO PASSA') + esc(' ou ') + vt('FALTA DADO') + '. ' + esc('A terceira resposta é a contribuição central: ela impede que a ausência de evidência seja lida como evidência de segurança, e diz que medida decidiria.'))
  + C.p('Durante o voo, a navegação é tratada como informação sujeita a incerteza. A posição é uma região de proteção, calculada sem o GNSS, que contém a posição real se os limites de erro declarados dos sensores valerem; um GNSS que aponta para fora dela é declarado falso. A missão passa por seis estados combinados antes do voo, cada um com a ação e a autoridade definidas.')
  + C.pull(esc('O Atalaia não promete que todo voo continuará. Ele propõe critérios verificáveis para decidir quando uma missão pode continuar, quando precisa ser interrompida e quando não existem dados suficientes para decidir.'))
  + C.note({ lab: 'Quem decide', bodyRaw: C.plainList([
    { b: 'O Atalaia não decide pela cadeia de comando.', text: 'Calcula, alerta e registra. Quem autoriza a missão, quem pode interrompê-la e quem responde pelo voo continuam sendo quem comanda e o piloto, com função definida e registrada.' },
    { b: 'Interromper é sempre permitido; continuar exige evidência.', text: 'Qualquer elo pode interromper sem justificar antes. Continuar, ou retomar depois de um alarme, exige os laudos e a autorização de quem responde.' },
    { b: 'Só recebe sinais.', text: 'Não bloqueia nem falsifica sinal fora de área autorizada, não guia armamento, não designa alvos e não rastreia pessoas.' }]) })
  + '<h3 class="at-h3">O que complementa e o que não substitui</h3>'
  + C.table({ cols: [{ h: '' }, { h: 'A relação com o que já existe' }], rows: [
    [c1('Complementa'), c2([['', 'o planejamento tático e o método de emprego da organização: acrescenta uma camada de garantia da missão, sem mudar a manobra.']])],
    [c1('Não substitui'), c2([['', 'o piloto, a cadeia de comando, os procedimentos da Força nem a homologação dos meios.']])],
    [c1('Depende da plataforma'), c2([['', 'num SARP DJI de hoje, a caixa a bordo só alerta e manda parar ou pousar; seguir a rota pela região de proteção depende de um autopiloto aberto (PX4, ArduPilot) ou de um modo que o fabricante ainda não liberou.']])],
    [c1('Depende de quem opera'), c2([['', 'a reserva de energia, o limite de região por fase, a ação de enlace perdido e o risco aceito por escrito.']])],
    [c1('Exigiria mudança organizacional'), c2([['', 'a autorização com as quatro perguntas e a conferência dos registros por outra instituição.']])],
    [c1('Pode ser avaliado sem alterar a operação'), c2([['', 'os replays sintéticos; a bancada, com ataques gravados injetados com a aeronave em solo, sem emitir sinal; a observação e o registro de um exercício já previsto, sem voar nada novo.']])]] }) }));

/* 3 · the 2025 ESAO study, with and without Atalaia */
B.push(C.section({ lab: '3 · Com e sem o Atalaia', title: 'A simulação da ESAO de 2025, nas duas condições', bodyRaw:
  C.p('Em 2025, oficiais da Escola de Aperfeiçoamento de Oficiais publicaram uma simulação construtiva, feita na ferramenta COMBATER, do ressuprimento aéreo de um pelotão de reconhecimento isolado em operações em montanha, que precisa de 57 kg de suprimento por dia. Compararam o helicóptero Fennec, o SARP TRV-150 e o SARP de carga DJI FlyCart 30, em três itinerários que exploram as elevações para reduzir a exposição ao inimigo. A Fennec cumpriria a missão em menos tempo, mas foi abatida em 100% das simulações; o FlyCart 30 entregou até 89% do suprimento, com 22% a 33% de perdas, sobretudo ao atravessar pontos altos do terreno. O estudo pergunta se o SARP é viável para esse ressuprimento sob a ameaça antiaérea, e conclui que é a alternativa mais segura, com mais tempo de missão.')
  + C.p('Os autores registram o que a simulação não cobriu: as variações do clima, por não haver ferramenta para isso no COMBATER, e outras medidas contra SARP além da antiaérea, como o bloqueio do sinal. Lembram, na revisão da literatura, que em área montanhosa pode haver variação considerável no GPS, e recomendam ensaios práticos com os equipamentos. Os objetivos publicados são outros, e nada disso é falha do estudo. O estudo mostra o valor do SARP para levar suprimento a uma fração isolada; o Atalaia propõe acrescentar uma camada que não era objetivo daquele trabalho: avaliar e registrar a confiabilidade da própria informação de navegação que sustenta a missão.')
  + C.table({ cols: [{ h: '' }, { h: 'A mesma missão, sem e com o Atalaia' }], rows: [
    [c1('Planejamento'), c2([['Sem:', 'itinerários pelo relevo, para reduzir a exposição à defesa antiaérea.'], ['Com:', 'o mesmo planejamento tático e, antes do voo, as quatro perguntas, cada uma com veredito.']])],
    [c1('Navegação'), c2([['Sem:', 'a posição que a aeronave informa; a variação do GPS em montanha é citada, não simulada.'], ['Com:', 'a posição como região de proteção, calculada sem o GNSS; um GNSS que sai dela é declarado falso.']])],
    [c1('Bloqueio e falsificação do GNSS'), c2([['Sem:', 'fora da simulação, como as outras medidas contra SARP além da antiaérea.'], ['Com:', 'o problema central: estados da missão combinados antes do voo, com ação e autoridade definidas.']])],
    [c1('Clima'), c2([['Sem:', 'as variações do clima não puderam ser simuladas.'], ['Com:', 'um laudo confere o vento e a temperatura previstos contra o limite da aeronave.']])],
    [c1('Dados insuficientes'), c2([['Sem:', 'não aparece como estado próprio no método publicado.'], ['Com:', 'falta dado: a ausência de evidência não vira autorização, e o laudo nomeia o dado que decidiria.']])],
    [c1('Registro'), c2([['Sem:', 'os resultados da simulação, conferidos no próprio sistema.'], ['Com:', 'um registro assinado a bordo e encadeado, que outra instituição refaz com um programa próprio.']])],
    [c1('Eficiência tática'), c2([['Sem:', 'medida: suprimento entregue, perdas, tempo de ressuprimento.'], ['Com:', 'não demonstrada: o Atalaia não mede nem promete ganho tático.']])],
    [c1('Validação'), c2([['Sem:', 'simulação construtiva; ensaios práticos recomendados.'], ['Com:', 'simulação e bancada; nenhum voo real.']])]] })
  + '<h3 class="at-h3">Duas perguntas na análise pós-ação</h3>'
  + C.p('Sem o Atalaia, a pergunta principal da análise pós-ação é se a missão cumpriu o seu objetivo. Com ele, são duas: a missão cumpriu o objetivo? E as informações de navegação que a sustentaram eram confiáveis e suficientes? Os indicadores do estudo continuam valendo; o Atalaia acrescenta uma segunda família.')
  + C.table({ cols: [{ h: 'Família' }, { h: 'Indicadores' }], rows: [
    [c1('Os do estudo, mantidos'), c2([['', 'suprimento entregue; perdas de aeronaves; tempo de ressuprimento.']])],
    [c1('Os propostos', chip('P')), c2([['', 'tempo até detectar a perda de confiabilidade da navegação; contenção da posição real pela região de proteção; falsos alarmes por hora de voo; decisões tomadas com evidência insuficiente; registros reconstruídos por uma equipe independente.']])],
    [c1('O custo da cautela', chip('D', 'simulação')), c2([['', 'missões retidas que teriam chegado: se o protocolo recusar demais, compromete a disponibilidade do SARP. Na semana sintética do Atalaia, ' + faOk + ' das ' + fa.length + ' saídas retidas por falta de dado teriam chegado com reserva.']])]] })
  + C.pRaw(esc('Daí uma oportunidade de pesquisa concreta: reproduzir, em simulação, um cenário como o do estudo, mantendo os indicadores dele, e acrescentar uma condição com o Atalaia e com a degradação do GNSS injetada. A hipótese a testar, hoje não demonstrada: uma camada formal de garantia da missão melhora a qualidade das decisões sob degradação da navegação sem impor uma penalidade inaceitável à disponibilidade?') + ' ' + chip('P'))
  + src('Fonte: E. R. Souza e E. A. Burity, “Sistemas de Aeronaves Remotamente Pilotadas para transportar suprimentos nas operações em montanha: possibilidades do futuro testadas em simulação construtiva”, <em>Revista Agulhas Negras</em>, v. 9, n. 14, p. 147–166, 2025, ' + a('https://doi.org/10.70545/ran.v9i14.13519', 'doi:10.70545/ran.v9i14.13519') + ' (resumo; seções 2, 5 e 6).') }));

/* 4 · one illustrative case */
B.push(C.section({ lab: '4 · Um caso ilustrativo', title: 'Apoio logístico a uma fração isolada em relevo complexo', bodyRaw:
  C.p('O cenário de referência é sintético e fica no Médio Vale do Itajaí (SC): a base em Blumenau e um posto avançado a ' + n(AV.post_km) + ' km, nos morros a sudoeste. A aeronave dos exemplos é o DJI FlyCart 30, porque a ficha dele é pública e as contas de energia precisam dela; o protocolo não depende do modelo. As bases e os destinos são pontos escolhidos sobre o relevo real; nenhuma instalação é indicada.')
  + '<div class="at-steps"><ol>' + [
    ['Existe uma necessidade de transporte.', esc('O posto recebe ' + KG + ' kg por saída; ' + CAP.saidas_precisa + ' saídas cobrem os ' + FR.pedido_kg_dia + ' kg por dia que o estudo da ESAO usou para um pelotão.')],
    ['A missão é viável em condições conhecidas.', esc('Os quatro laudos de viabilidade passam no pior caso: rota, energia (com ' + KG + ' kg, sobram ao menos ' + n(R12.margin_wh[0]) + ' Wh além da reserva; passa até ' + AV.passa_ate_kg + ' kg), clima e GNSS, com previsão e leitura simuladas.') + ' ' + vt('PASSA')],
    ['A informação do GNSS torna-se inconsistente.', esc('No meio do caminho, um aparelho passa a imitar o GNSS e a puxar a aeronave devagar para o lado. A posição informada sai da região de proteção, e a caixa declara o GNSS falso e avisa o piloto.')],
    ['O protocolo distingue evidência suficiente de falta de informação.', esc('Com 30 kg, o laudo de energia não decide: no pior caso a aeronave pousaria abaixo da reserva; no melhor, sobraria energia. Ele diz o que decidiria: voos de calibração.') + ' ' + vt(R30.verdict) + ' ' + esc('Um posto na serra, a 15 km, não passa nem com a aeronave vazia.') + ' ' + vt('NAO PASSA')],
    ['A decisão considera segurança, disponibilidade e contingências.', esc('Pelo próprio protocolo, a missão de referência hoje não seria liberada: é viável, mas faltam uma zona de pouso de contingência levantada, a aprovação dos estados por quem responde e a caixa que lacra o registro. É o comportamento pedido: não liberar o que não se consegue demonstrar, e dizer o que falta.')],
    ['Ao final, uma equipe independente reconstrói o que aconteceu.', esc('O registro do voo é assinado a bordo e encadeado; outra instituição refaz cada decisão a partir dele, com um programa próprio. O laudo e o lacre foram testados em bancada: 53 erros plantados, todos pegos.')]]
    .map(([h, raw]) => '<li><p><b>' + esc(h) + '</b> ' + raw + '</p></li>').join('') + '</ol></div>'
  + C.figure({ svgRaw: R.filme(FILM.f, FILM.t, '/atalaia/filmes/'), record: ['apps/atalaia/data/filmes/' + FILM.f + '.mp4'],
    caption: FILM.t + '. O mesmo tipo de missão, num posto nos morros do norte da ilha de Florianópolis: no meio do caminho o GNSS passa a mentir (o trecho vermelho), a aeronave segue pela região de proteção, entrega e volta com reserva. Seguir pela região supõe um autopiloto que aceite a posição da caixa; num DJI de hoje, a ação autorizada seria pousar. Simulação; nada voou.' }) }));

/* 5 · what has and has not been shown */
B.push(C.section({ lab: '5 · Evidências e limites', title: 'O que já foi demonstrado, e o que ainda não', bodyRaw:
  C.p('Cada resultado abaixo foi obtido em simulação, em bancada, em dados gravados ou em vetores de teste oficiais, e diz qual. Nenhum é resultado de voo.')
  + C.table({ cols: [{ h: 'Resultado' }, { h: 'O que mostra' }], rows: EVID.map((e) => [c1(e.k, chip(e.l, e.det)), c2([['', e.t]])]) })
  + '<h3 class="at-h3">O que ainda não foi demonstrado</h3>'
  + C.plainList([
    { b: 'Integração embarcada.', text: 'A caixa a bordo ainda não existe. Receber os dados da aeronave, manter a sincronização, calcular a região, registrar e caber na energia, no peso e no processamento da plataforma é engenharia embarcada ainda por fazer.' },
    { b: 'Validação em campo.', text: 'Nenhum voo real. O primeiro é a etapa de calibração, em campo autorizado.' },
    { b: 'Desempenho em plataformas reais.', text: 'Os limites de erro dos sensores e a independência entre eles são hipóteses a medir; num DJI de hoje, a caixa só alerta e manda parar ou pousar.' },
    { b: 'Generalidade.', text: 'Os casos de hoje são, em boa parte, favoráveis: o relevo do Vale e dos morros ajuda. Numa rota plana a partir de Tabatinga não ajuda, e o laudo diz falta dado; ambiente urbano e mata densa ainda não foram testados.' },
    { b: 'Adequação operacional militar.', text: 'Não avaliada. É o que os testes no contexto de um batalhão começariam a examinar.' }])
  + C.pRaw(esc('As hipóteses, os modelos e os critérios de validação estão na minuta técnica, seções 8 a 11: ') + '<a href="/atalaia/doutrina/">/atalaia/doutrina/</a>.') }));

/* 6 · the partnership (the operator, 2026-11-16: "we are asking too many things on the page. I have the contact and we
   should cite the partnership is open for testing in the Batalhão context"): one statement, no list of asks, no contact
   form — the battalion stays unnamed (atalaia/CLAUDE.md, rule 3) */
B.push(C.section({ lab: '6 · A parceria', title: 'Aberta a testes no contexto de um batalhão', bodyRaw:
  C.p('A parceria está aberta para testes no contexto de um batalhão, sem compromisso de adoção, de aquisição ou de mudança de procedimento. Os testes seguem as quatro etapas da minuta (seção 9), cada uma com o critério de aceitação escrito antes:')
  + C.plainList([
    { b: 'Simulação sobre o terreno da área de emprego.', text: 'As missões que o batalhão de fato voaria, calculadas sobre o relevo real, com os laudos e os replays.' },
    { b: 'Bancada, com a aeronave em solo.', text: 'Ataques gravados injetados na caixa, sem emitir sinal, e o lacre do registro conferido.' },
    { b: 'Calibração em campo autorizado.', text: 'Voos curtos que medem o consumo com carga e o erro real de cada sensor.' },
    { b: 'Exercício.', text: 'A missão com a equipe que opera, num exercício já previsto, e o verificador independente reconstruindo o voo pelo registro.' }])
  + C.p('Uma das perguntas dos testes: se isto for demonstrado de forma independente, em que tipo de missão haveria benefício concreto? A resposta depende de requisitos que só quem opera conhece.')
  + '<h3 class="at-h3">Aderência potencial ao processo de evolução doutrinária</h3>'
  + C.p('Se houver avaliação militar, a proposta tem caminho conhecido no Exército. A doutrina é produzida pelo Sistema de Doutrina Militar Terrestre, o SIDOMT; o COTER, por intermédio do Centro de Doutrina do Exército, prepara a diretriz de cada produto doutrinário; uma ideia passa pela sistemática de experimentação doutrinária antes de virar manual; e a Doutrina Militar Terrestre mede uma capacidade pelos sete fatores do DOAMEPI. A seção 12 da minuta diz o que cada fator pediria do Atalaia.')
  + C.p('Esta proposta não foi submetida, enquadrada ou aceita por esse sistema: não é projeto do COTER, não é doutrina do Exército e não está em experimentação doutrinária.')
  + src('Fontes: Exército Brasileiro, EB20-MF-10.102, ' + a('https://bdex.eb.mil.br/jspui/bitstream/123456789/11768/1/EB20MF10102.pdf', '<em>Doutrina Militar Terrestre</em>') + ', 3ª ed., 2022 (§ 3.3.4, DOAMEPI); COTER, ' + a('https://bdex.eb.mil.br/jspui/bitstream/123456789/14389/1/PDDMT2025.pdf', 'Plano de Desenvolvimento da Doutrina Militar Terrestre 2025') + ' (§ 4 e § 5); Instruções Reguladoras da Sistemática de Experimentação Doutrinária (EB70-IR-10.002), 2018.')
  + C.pRaw(esc('Para ler mais: ') + '<a href="/atalaia/">' + esc('a apresentação curta, com quatro replays sintéticos') + '</a>' + esc(', e ') + '<a href="/atalaia/doutrina/">' + esc('a minuta técnica') + '</a>' + esc(', com princípios, estados da missão, requisitos, hipóteses, critérios de validação, limites e o histórico de versões.')) }));

const foot = '<p>' + esc('Atalaia v' + VERSAO.n + ', ' + VERSAO.data + '. Preparado por Carlos Toledo, autor da proposta, com ajuda de IA (Claude) na pesquisa e na redação. Iniciativa independente: não é documento do Exército Brasileiro nem tem o endosso dele, e não usa marca, brasão ou identidade visual da Força. Documento de trabalho, não doutrina aprovada nem proposta comercial. Os números das missões vêm de apps/atalaia/data (cada registro fixado por sha256 em PROVENANCE.json); os resultados de teste, dos registros do LOCUS e do Veto.') + '</p>';
const css = R.CSS_BASE + R.FILM_CSS + `
.at-steps ol{margin:var(--s-4) 0 0;padding-left:1.6em;display:flex;flex-direction:column;gap:var(--s-3)}
.at-steps li::marker{font-family:var(--f-mono);color:var(--ink-4)}
.at-steps li p{margin:0}
`;
let html = TPL.render({ title: 'Atalaia: uma proposta de pesquisa para avaliação pelo Exército', bodyRaw: B.join('\n\n'), footRaw: foot, lang: 'pt-BR', cssRaw: css, scriptRaw: R.FILM_SCRIPT,
  desc: 'Atalaia v' + VERSAO.n + ', para interlocutores militares: proposta independente de pesquisa aplicada em resiliência de PNT e garantia da missão para SARP; o que já foi demonstrado em simulação e bancada, o que ainda não foi, e o pedido de uma avaliação técnica preliminar.', path: '/atalaia/eb/' });
html = html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, nofollow">');
if (!/name="robots" content="noindex/.test(html)) html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>');
for (const w of ['aprovado pelo COTER', 'doutrina do Exército Brasileiro', 'brasão oficial']) if (html.includes(w)) die('the page says "' + w + '"');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log('site/atalaia/eb/index.html written (unlisted, v' + VERSAO.n + '): ' + EVID.length + ' results, 0 flights, one film');
