#!/usr/bin/env node
/* build.js — site/eleicoes2026/index.html: the 2026 presidential election, both rounds, decided where the published
   bytes allow and refused where they do not. Unlisted (noindex, in no index or sitemap) until the operator links it.

   EVERY NUMBER IS READ HERE from corpus/eleicoes2026/ledger.json (tools/eleicoes2026/ledger.py), which is re-derived
   first (--check) so a page can never show a number its inputs no longer give. The ledger reads the TSE's own files,
   pinned: the BU na Web of every section (corpus/eleicoes2026/PINS.json), the signed results of both rounds
   (SIGNED-PINS.json), the urns' logs where read, the claims as said (claims.json) and the polls as published
   (polls.json). Written in Portuguese: the readers are Brazilian.

   usage: node apps/eleicoes2026/build.js                                                                           MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const OUT = path.join(ROOT, 'site', 'eleicoes2026');
const die = (m) => { console.error('ELEICOES2026 PAGE REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');

try { cp.execFileSync('python3', ['tools/eleicoes2026/ledger.py', '--check'], { cwd: ROOT, encoding: 'utf8' }); }
catch (e) { die('the ledger does not re-derive: ' + (e.stdout || e.stderr || e.message)); }
const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'eleicoes2026', 'ledger.json'), 'utf8'));
const D = L.decisions;
const CL = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'eleicoes2026', 'claims.json'), 'utf8')).claims;
for (const k of ['SIG', 'R1-SUM', 'R1-SEC', 'R2-ARITH', 'R2-WIN', 'R2-SUM', 'EXT', 'C6']) if (!D[k]) die('the ledger lacks ' + k);

const n = (x) => Number(x).toLocaleString('pt-BR');
const pct = (a, b, d = 2) => (100 * a / b).toFixed(d).replace('.', ',');
const m = (s) => '<span class="m">' + C.esc(s) + '</span>';
const W = { CERTIFIED: 'CERTIFICADO', REFUTED: 'REFUTADO', REFUSED: 'RECUSADO', 'NEEDS DATA': 'FALTAM DADOS', PARTIAL: 'PARCIAL', MEASURED: 'MEDIDO' };
/* the verdict as a house tag: filled when decided, dashed while the deciding bytes are not yet published (the stroke grammar:
   dashed = not yet tested), outlined for a refusal or a measurement; the word always beside the form */
const KIND = { CERTIFIED: 'cert', REFUTED: 'held', 'NEEDS DATA': 'open', REFUSED: 'dep', MEASURED: 'dep', PARTIAL: 'dep' };
const stamp = (v) => C.tag(W[v] || v, KIND[v] || 'dep');
const UF_NAMES = { AC: 'Acre', AL: 'Alagoas', AM: 'Amazonas', AP: 'Amapá', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo',
  GO: 'Goiás', MA: 'Maranhão', MG: 'Minas Gerais', MS: 'Mato Grosso do Sul', MT: 'Mato Grosso', PA: 'Pará', PB: 'Paraíba', PE: 'Pernambuco',
  PI: 'Piauí', PR: 'Paraná', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RO: 'Rondônia', RR: 'Roraima', RS: 'Rio Grande do Sul',
  SC: 'Santa Catarina', SE: 'Sergipe', SP: 'São Paulo', TO: 'Tocantins', ZZ: 'Exterior' };

const W2 = D['R2-WIN'], R1 = D['R1-SUM'], EXT = D.EXT;
const r1c = R1.candidates;
const r1valid = Object.values(r1c).reduce((a, c) => a + c.votes, 0);
const extDone = EXT.ufs_complete;
const extLate = extDone.reduce((a, uf) => a + EXT.logs[uf].late_votes, 0);
const extVotes = extDone.reduce((a, uf) => a + EXT.logs[uf].votes_in_logs, 0);

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · dossiê · eleição presidencial de 2026 · 1º turno (4/10) e 2º turno (25/10) · lido em ' + L.generated,
  title: 'Eleições 2026: o que os números permitem decidir',
  deck: 'O lado derrotado pede a anulação do segundo turno. Aqui, cada afirmação que pode ser conferida nos arquivos públicos do TSE é decidida em conta exata, '
    + 'por programas escritos do zero e sem código do TSE; o que não pode ser conferido nesses arquivos é recusado, com o motivo. '
    + 'A pergunta "a eleição foi justa?" não é uma conta: este dossiê responde às perguntas menores, que são contas, e diz quais ficam de fora.'
}));
B.push(C.scope('Publicado, não revisado por pares, não auditado de forma independente. Os dados são do TSE, lidos dos seus arquivos públicos e lacrados por sha256 '
  + '(e por sha512, onde o TSE publica o seu). Nenhuma linha deste trabalho vem do TSE, de partido ou de campanha; nenhuma conclusão sobre pessoas, intenções ou a legalidade de decisões judiciais é tirada aqui.'));

B.push(C.tldr({
  findingRaw: '<b>Os números publicados fecham, e a margem é grande demais para a prorrogação.</b> '
    + 'No 1º turno, a soma dos ' + n(D['R1-SEC'].sections) + ' boletins de urna feita por dois programas independentes é igual, voto por voto, ao resultado oficial assinado do TSE, em todos os estados e no exterior. '
    + 'No 2º turno, o resultado assinado dá a Lula ' + n(W2.lula) + ' votos e a Flávio Bolsonaro ' + n(W2.flavio) + ': diferença de ' + n(W2.margin) + '. '
    + 'Para a prorrogação mudar o vencedor seria preciso que ao menos ' + n(W2.margin) + ' votos tivessem entrado depois das 17h, todos para Lula; o TSE informa ' + n(EXT.tse_reported_late_votes) + '. '
    + (extDone.length ? 'Nos estados cujos registros de urna já lemos inteiros (' + extDone.join(', ') + '), foram ' + n(extLate) + ' votos depois das 17h em ' + n(extVotes) + '. ' : '')
    + 'Ficam pendentes, até o TSE publicar os arquivos completos do 2º turno, a soma seção por seção e a contagem nacional dos votos tardios.',
  mechanismRaw: 'Três tipos de prova. <b>Soma exata:</b> cada boletim de urna (BU) é somado em números inteiros, sem arredondar, por um programa em Python e outro em JavaScript, que não compartilham código; os dois precisam concordar e bater com o oficial. '
    + '<b>Assinatura digital:</b> o TSE assina cada arquivo de resultado (JWS, Ed25519); a assinatura é verificada por duas implementações independentes, e um arquivo com um único dígito trocado é recusado pelas duas. '
    + '<b>Registro da urna:</b> cada urna anota, com hora, cada voto computado; contamos os que vieram depois das 17h no relógio de cada urna.',
  checkRaw: m('python3 tools/eleicoes2026/fetch.py bweb 1') + ' baixa os boletins e confere o sha512 publicado pelo TSE; '
    + m('python3 tools/eleicoes2026/ledger.py --check') + ' refaz todas as decisões a partir dos arquivos lacrados.'
}));

B.push(C.stats([
  { k: '1º turno · boletins somados', v: n(D['R1-SEC'].sections), n: 'Seções com voto para presidente, somadas por dois programas: ' + (R1.verdict === 'CERTIFIED' ? 'iguais ao oficial' : 'DIFERENTES do oficial') + '.' },
  { k: 'resultados assinados conferidos', v: D.SIG.verified + ' de ' + D.SIG.files, n: 'Brasil, 27 UFs e exterior, nos dois turnos. Um dígito trocado é recusado.' },
  { k: '2º turno · diferença', v: n(W2.margin), n: 'Lula ' + n(W2.lula) + ' × Flávio ' + n(W2.flavio) + ' votos válidos (resultado assinado).' },
  { k: 'votos após as 17h (TSE)', v: n(EXT.tse_reported_late_votes), n: (100 * EXT.tse_reported_late_votes / W2.margin).toFixed(1).replace('.', ',') + '% do necessário para inverter o resultado.' }
]));

/* §1 the verdicts */
const verdictRows = [
  ['1º turno: a soma dos boletins de urna é o resultado oficial', D['R1-SUM'].verdict, 'Iguais candidato a candidato, brancos, nulos e comparecimento, no Brasil e em cada UF.'],
  ['1º turno: cada boletim é aritmeticamente consistente', D['R1-SEC'].verdict, n(D['R1-SEC'].sections) + ' seções: votos = comparecimento; comparecimento + abstenções = eleitores aptos.'],
  ['Os resultados assinados do TSE são autênticos', D.SIG.verdict, D.SIG.verified + ' de ' + D.SIG.files + ' arquivos verificados por duas implementações de Ed25519.'],
  ['2º turno: o resultado assinado fecha as próprias contas', D['R2-ARITH'].verdict, 'Válidos = Lula + Flávio; brancos e nulos; comparecimento; estados + exterior = Brasil.'],
  ['2º turno: Lula teve mais votos válidos', W2.verdict, n(W2.lula) + ' contra ' + n(W2.flavio) + ' no resultado assinado.'],
  ['2º turno: a soma dos boletins é o resultado oficial', D['R2-SUM'].verdict, 'O TSE ainda não publicou os boletins do 2º turno em lote; decidimos no dia em que publicar.'],
  ['A prorrogação até as 19h decidiu o resultado', EXT.verdict === 'CERTIFIED' ? 'REFUTED' : EXT.verdict, 'Precisaria de ' + n(W2.margin) + ' votos após as 17h, todos de um lado. Contagem nacional pendente dos registros completos.'],
  ['"51,74%" (dito na proclamação)', D.C6.verdict, 'A fração assinada é ' + D.C6.signed_exact + ' = ' + D.C6.signed_2dp + '%. Não muda o vencedor.']
];
B.push(C.section({
  lab: '§1 · os veredictos', title: 'O que foi decidido', wide: true,
  bodyRaw: C.table({ cols: [{ h: 'afirmação' }, { h: 'veredicto' }, { h: 'por quê' }], rows: verdictRows.map(([a, v, w]) => [a, { raw: stamp(v) }, w]) })
    + C.pRaw('<b>CERTIFICADO</b>: provado com conta exata. <b>REFUTADO</b>: falso, com o número que mostra. <b>RECUSADO</b>: não dá para decidir com estes dados, e o motivo. <b>FALTAM DADOS</b>: o arquivo que decide ainda não foi publicado.')
}));

/* §2 round 1 */
const ufRows = R1.scopes.filter((s) => s.scope !== 'BR').map((s) => [UF_NAMES[s.scope] || s.scope, n(s.bu_sections_with_votes), n(s.turnout),
  { raw: Object.values(s.equal).every(Boolean) ? '<b>igual</b>' : '<b>DIFERENTE</b>' }]);
const order = Object.entries(r1c).sort((a, b) => b[1].votes - a[1].votes);
B.push(C.section({
  lab: '§2 · 1º turno', title: 'Os boletins de urna somam exatamente o resultado oficial', wide: true,
  bodyRaw: C.pRaw('O boletim de urna (BU) é o papel que cada urna imprime ao fechar e afixa na porta da seção, com os votos daquela seção. O TSE publica todos eles, em arquivo, por estado. '
      + 'Somamos os ' + n(D['R1-SEC'].sections) + ' boletins do cargo de presidente duas vezes, por programas que não compartilham código, e comparamos com o resultado oficial assinado.')
    + C.table({ cols: [{ h: 'candidato' }, { h: 'número' }, { h: 'votos (soma dos BUs = oficial)' }, { h: '% dos válidos' }],
      rows: order.map(([k, c]) => [c.name, k, n(c.votes), pct(c.votes, r1valid)]) })
    + C.pRaw('Brancos ' + n(R1.blank) + ' · nulos ' + n(R1.null) + ' · comparecimento ' + n(R1.turnout) + ' de ' + n(R1.registered) + ' eleitores aptos. '
      + 'Uma seção funcionou sem nenhum voto para presidente e por isso não aparece nos boletins de presidente: são as ' + n(D['R1-SEC'].sections) + ' seções com voto contra as ' + n(R1.scopes[0].signed_sections_installed) + ' instaladas.')
    + '<details><summary>Por estado</summary>' + C.table({ cols: [{ h: 'UF' }, { h: 'seções' }, { h: 'comparecimento' }, { h: 'soma × oficial' }], rows: ufRows }) + '</details>'
}));

/* §3 the signatures */
B.push(C.section({
  lab: '§3 · assinaturas', title: 'Os resultados que o TSE publica são assinados, e as assinaturas conferem',
  bodyRaw: C.pRaw('O site de resultados do TSE entrega cada resultado também em versão assinada digitalmente (formato JWS, algoritmo Ed25519). A chave pública está no próprio aplicativo do TSE. '
      + 'Uma assinatura válida prova que o arquivo é exatamente o que o TSE assinou: mudar um voto, um dígito, invalida a assinatura.')
    + C.pRaw('Verificamos os ' + D.SIG.files + ' arquivos (Brasil, 27 UFs e exterior, nos dois turnos) com duas implementações sem código em comum: uma escrita do zero a partir da RFC 8032, só com inteiros, e outra com a criptografia do Node. '
      + 'Resultado: ' + D.SIG.verified + ' de ' + D.SIG.files + ' válidas, e o conteúdo assinado é o mesmo que o site mostra. '
      + 'Controle vermelho: trocamos um único dígito de um total no arquivo nacional do 2º turno; as duas implementações recusaram a assinatura.')
    + C.pRaw('O que isto prova e o que não prova: prova que os números são os do TSE e não foram alterados no caminho até você. Não prova, sozinho, que o TSE somou certo; isso é a §2 (1º turno) e, quando os boletins do 2º turno saírem, a mesma conta.')
}));

/* §4 round 2 */
const ufs2 = Object.entries(W2.per_uf).filter(([uf]) => uf !== 'ZZ');
const grewAll = Object.values(W2.per_uf).every((u) => u.lula / (u.lula + u.flavio) > u.r1_lula / (u.r1_lula + u.r1_flavio));
const dumb = CH.dumbbell({
  w: 900, alt: 'Participação de Lula nos votos de Lula e Flávio, por estado, no 1º e no 2º turno',
  x0: 20, x1: 80, xTicks: [20, 30, 40, 50, 60, 70, 80].map((v) => ({ v, t: v + '%' })),
  aName: '1º turno (Lula entre Lula e Flávio)', bName: '2º turno', vOf: (v) => v.toFixed(1).replace('.', ',') + '%',
  rows: ufs2.map(([uf, u]) => ({ k: UF_NAMES[uf], a: 100 * u.r1_lula / (u.r1_lula + u.r1_flavio), b: 100 * u.lula / (u.lula + u.flavio),
    lab: (100 * u.lula / (u.lula + u.flavio)).toFixed(1).replace('.', ',') + '%' })).sort((a, b) => b.b - a.b)
});
B.push(C.section({
  lab: '§4 · 2º turno', title: 'O resultado assinado: ' + n(W2.margin) + ' votos de diferença', wide: true,
  bodyRaw: C.pRaw('Lula ' + n(W2.lula) + ' (' + W2.lula_share_2dp + '% dos válidos), Flávio Bolsonaro ' + n(W2.flavio) + '. Brancos ' + n(W2.blank) + ', nulos ' + n(W2.null)
      + ', comparecimento ' + n(W2.turnout) + ' de ' + n(W2.registered) + ' aptos, ' + n(W2.sections) + ' seções. As contas do próprio arquivo fecham, e os 27 estados mais o exterior somam exatamente o Brasil.')
    + C.pRaw('Para inverter o vencedor seria preciso trocar de lado ' + n(W2.swing_to_reverse) + ' votos (um voto que sai de Lula e vai para Flávio muda a diferença em dois), ou anular ' + n(W2.removal_to_reverse) + ' votos de Lula.')
    + C.figure({ svgRaw: dumb, caption: 'Lula entre os votos de Lula e Flávio, por estado, no 1º e no 2º turno (pontos como na legenda). No 1º turno havia outros candidatos; a comparação usa só os dois finalistas. ' + (grewAll ? 'Entre os dois, Lula cresceu em todos os estados e no exterior.' : 'Entre os dois, Lula não cresceu em todos os estados.') })
}));

/* §5 the extension */
const extRows = [
  { k: 'anular votos de Lula até inverter', v: W2.removal_to_reverse, lab: n(W2.removal_to_reverse), need: true },
  { k: 'trocar votos de lado até inverter', v: W2.swing_to_reverse, lab: n(W2.swing_to_reverse), need: true },
  { k: 'depois das 17h, segundo o TSE', v: EXT.tse_reported_late_votes, lab: n(EXT.tse_reported_late_votes) }
].concat(extDone.map((uf) => ({ k: 'depois das 17h, ' + (UF_NAMES[uf] || uf) + ' (lido)', v: Math.max(10, EXT.logs[uf].late_votes), lab: n(EXT.logs[uf].late_votes) })));
const barsSvg = CH.bars({ w: 900, alt: 'Votos necessários para inverter o resultado, contra os votos registrados depois das 17h', logX: true, min: 10, max: 1e7,
  xTicks: [10, 100, 1e3, 1e4, 1e5, 1e6, 1e7].map((v) => ({ v, t: n(v) })), padL: 300, rowH: 34,
  rows: extRows.map((r) => ({ k: r.k, v: r.v, lab: r.lab, token: r.need ? CH.CTX : CH.CAT[0] })), vOf: (v) => n(Math.round(v)),
  xLabel: 'votos, em escala logarítmica (cada marca vale dez vezes a anterior)' });
const logTable = Object.entries(EXT.logs).map(([uf, x]) => [UF_NAMES[uf] || uf, n(x.sections_read) + ' de ' + n(x.sections_installed), n(x.votes_in_logs) + ' de ' + n(x.turnout_signed),
  n(x.late_votes), String(x.max_late_in_a_section), { raw: x.complete ? '<b>completo</b>' : 'parcial' }]);
B.push(C.section({
  lab: '§5 · a prorrogação', title: 'Para a prorrogação inverter o resultado, seriam precisos ' + n(W2.margin) + ' votos depois das 17h', wide: true,
  bodyRaw: C.pRaw('Às 16h32 de 25 de outubro, o ministro Cristiano Zanin, do STF, estendeu a votação até as 19h nas seções ainda abertas, a pedido da coligação de Lula, por causa da redução de ônibus em algumas cidades. '
      + 'A campanha de Flávio Bolsonaro havia pedido ao TSE extensão parecida em 17 municípios de SP, PR e SC, por causa de chuva. A legalidade da decisão é uma questão jurídica e não é decidida aqui. '
      + 'A pergunta que é uma conta é outra: <b>os votos que só existiram por causa da prorrogação poderiam ter decidido a eleição?</b>')
    + C.figure({ svgRaw: barsSvg, caption: 'Escala logarítmica: cada marca vale dez vezes a anterior. As duas primeiras barras são o que seria preciso para inverter o resultado; as outras, os votos registrados depois das 17h.' })
    + C.pRaw('<b>Como contamos.</b> Cada urna grava um registro (log) com a hora de cada evento, e uma linha "O voto do eleitor foi computado" para cada voto. O relógio da urna está na hora local, então o limite é a hora em que a urna ficou "pronta para receber votos" (8h de Brasília, no fuso dela) mais 9 horas. '
      + 'Um voto às 17h00 ou depois conta como tardio. Os registros vêm do site de resultados do TSE, seção por seção; cada arquivo é lacrado por sha256.')
    + (logTable.length ? C.table({ cols: [{ h: 'UF' }, { h: 'seções lidas' }, { h: 'votos nos registros × comparecimento' }, { h: 'após as 17h' }, { h: 'máx. numa seção' }, { h: 'leitura' }], rows: logTable }) : '')
    + C.pRaw('<b>O que falta.</b> A contagem nacional exige os registros das ' + n(W2.sections) + ' seções. O TSE os publica em lote no portal de dados abertos (no 1º turno, três dias depois). Até lá, o veredicto nacional é FALTAM DADOS, '
      + 'com o limiar publicado: só um total de pelo menos ' + n(W2.margin) + ' votos tardios, todos de Lula, inverteria o resultado. O número do TSE é ' + (100 * EXT.tse_reported_late_votes / W2.margin).toFixed(2).replace('.', ',') + '% disso.')
}));

/* §6 the polls */
if (D.POLLS) {
  const P = D.POLLS.polls.filter((p) => p.cells.length);
  const BR = D.POLLS.by_round;
  const lulaAhead1 = P.filter((p) => p.round === 1).filter((p) => { const l = p.cells.find((x) => x.candidate === '13'), f = p.cells.find((x) => x.candidate === '22'); return l && f && Number(l.published) > Number(f.published); }).length;
  const res = { 1: { '13': 100 * r1c['13'].votes / r1valid, '22': 100 * r1c['22'].votes / r1valid }, 2: { '13': 100 * W2.lula / W2.valid, '22': 100 * W2.flavio / W2.valid } };
  const fig = (rnd, cand, nome, lo, hi) => {
    const rows = P.filter((p) => p.round === rnd).map((p) => ({ p, c: p.cells.find((x) => x.candidate === cand) })).filter((x) => x.c)
      .sort((a, b) => (a.p.published + a.p.pollster < b.p.published + b.p.pollster ? -1 : 1));
    const ticks = []; for (let v = lo; v <= hi; v += 2) ticks.push({ v, t: v + '%' });
    return CH.intervals({ w: 900, rowH: 22, padL: 250, alt: nome + ' nas pesquisas finais do ' + rnd + 'º turno, com a margem declarada, contra o resultado das urnas',
      x0: lo, x1: hi, xTicks: ticks, xLabel: nome + ', % dos votos válidos · última linha: o resultado das urnas',
      rows: rows.map(({ p, c }) => ({ k: p.pollster + ' · ' + String(p.published).slice(8, 10) + '/' + String(p.published).slice(5, 7),
        lo: Number(c.published) - Number(p.margin), hi: Number(c.published) + Number(p.margin), point: Number(c.published), v: c.published + '% ± ' + p.margin,
        note: c.inside_margin ? 'contém o resultado' : undefined, token: c.inside_margin ? CH.CAT[1] : CH.CTX }))
        .concat([{ k: 'RESULTADO DAS URNAS', point: res[rnd][cand], note: res[rnd][cand].toFixed(2).replace('.', ',') + '%', token: CH.CAT[0] }]) });
  };
  B.push(C.section({
    lab: '§6 · as pesquisas', title: 'As pesquisas erraram nos dois turnos, e para lados opostos', wide: true,
    bodyRaw: C.pRaw('Lemos ' + BR['1'].polls + ' pesquisas nacionais publicadas na última semana do 1º turno e ' + BR['2'].polls + ' na do 2º, cada uma com a fonte e, quando existe, o registro no TSE '
        + '(' + m('corpus/eleicoes2026/polls.json') + '). Comparamos com as urnas as que publicaram votos válidos e margem de erro: ' + BR['1'].compared + ' no 1º turno e ' + BR['2'].compared + ' no 2º.')
      + C.pRaw('<b>1º turno.</b> Em média, as pesquisas deram a Flávio Bolsonaro ' + BR['1'].mean_error_pp_22 + ' ponto a menos do que ele teve: todas as ' + BR['1'].polls_below_result_22
        + ' o subestimaram, e ' + lulaAhead1 + ' delas o puseram atrás de Lula, que ficou em segundo. <b>2º turno.</b> O erro trocou de lado: em média deram a Lula ' + BR['2'].mean_error_pp_13
        + ' ponto a menos, e todas as ' + BR['2'].polls_below_result_13 + ' o subestimaram. Somando os dois turnos, ' + (BR['1'].inside_margin + BR['2'].inside_margin) + ' de '
        + (BR['1'].lula_flavio_cells + BR['2'].lula_flavio_cells) + ' números (Lula ou Flávio, numa pesquisa) contêm o resultado dentro da margem declarada.')
      + C.figure({ svgRaw: fig(1, '22', 'Flávio Bolsonaro', 36, 52), caption: '1º turno: Flávio Bolsonaro em cada pesquisa (ponto) com a margem declarada (barra), contra o resultado das urnas (última linha). As que contêm o resultado dizem isso ao lado.' })
      + C.figure({ svgRaw: fig(2, '13', 'Lula', 44, 56), caption: '2º turno: Lula em cada pesquisa, com a margem declarada, contra o resultado das urnas (última linha). As que contêm o resultado dizem isso ao lado.' })
      + C.pRaw('<b>O que um erro de pesquisa prova.</b> Uma pesquisa estima a opinião de uma amostra dias antes da eleição. A margem de erro cobre só o acaso da amostragem, não mudança de última hora, '
        + 'comparecimento diferente do previsto ou eleitores que não respondem; e a margem impressa costuma ser a dos votos totais, mais estreita que a dos válidos. '
        + 'Um erro grande contra um candidato num turno e contra o outro no turno seguinte é o retrato de pesquisas com dificuldade de medir o eleitorado, não de uma contagem desviada para um lado. '
        + 'A contagem é a soma dos boletins, conferida nas §2 a §4.')
  }));
}

/* §7 the claims */
const cw = { C1: EXT.verdict === 'CERTIFIED' ? 'REFUTED' : EXT.verdict, C2: 'REFUSED', C3: 'REFUSED', C4: EXT.verdict === 'NEEDS DATA' ? 'NEEDS DATA' : 'CERTIFIED', C5: 'CERTIFIED', C6: D.C6.verdict, C7: 'MEASURED' };
const why = {
  C1: 'A parte que é conta: inverter exigiria ' + n(W2.margin) + ' votos tardios de um lado só. Nacionalmente pendente dos registros completos; onde já lemos tudo, os tardios são centenas, não milhões. A parte jurídica (anular) não é conta.',
  C2: 'Votos que não foram dados não existem em nenhum arquivo. Nenhuma conta decide um "e se".',
  C3: 'É um fato sobre o que aconteceu numa sala do TSE, não um número publicado. O que os fiscais viriam conferir (os totais) está nas §2 a §4.',
  C4: 'Será conferido contra os registros das urnas quando o TSE publicar todos. Onde já lemos tudo, o número por estado está na §5.',
  C5: 'A assinatura confere e as contas do arquivo fecham. A soma seção por seção do 2º turno aguarda os boletins em lote.',
  C6: '51,74% não é a fração de Lula nos válidos do resultado assinado (' + D.C6.signed_2dp + '%). Provável erro de leitura; não muda nada.',
  C7: 'Medido na §6. Um erro de pesquisa não é evidência sobre a contagem.'
};
B.push(C.section({
  lab: '§7 · as alegações', title: 'Cada afirmação pública, com o veredicto que os dados permitem', wide: true,
  bodyRaw: C.table({ cols: [{ h: 'quem' }, { h: 'o que disse' }, { h: 'veredicto' }, { h: 'por quê' }],
    rows: CL.map((c) => [c.quem, c.quoted ? '"' + c.disse + '"' : c.disse + ' (paráfrase)', { raw: stamp(cw[c.id]) }, why[c.id]]) })
    + C.pRaw('Fontes de cada afirmação em ' + m('corpus/eleicoes2026/claims.json') + '. Citações entre aspas apenas quando a fonte foi lida inteira.')
}));

/* §8 limits */
B.push(C.section({
  lab: '§8 · o que não foi decidido', title: 'Os limites deste dossiê',
  bodyRaw: C.plainList([
    { b: '"A eleição foi justa".', text: 'Não é uma conta. Este dossiê decide as partes que são: se o total oficial é a soma dos boletins, se os resultados são autênticos, se a prorrogação poderia ter mudado o vencedor.' },
    { b: 'O software da urna.', text: 'Não auditamos o código da urna, os testes públicos de segurança nem o teste de integridade do dia da eleição. Os boletins e registros conferem entre si e com o total, o que é uma prova sobre os números publicados, não sobre o código que os gerou.' },
    { b: 'Questões jurídicas.', text: 'A competência e a legalidade da decisão do STF, e qualquer pedido de anulação, são do Judiciário.' },
    { b: 'O 2º turno seção por seção.', text: 'Pendente dos boletins e registros em lote do TSE; o veredicto será publicado aqui, com a data, seja qual for.' },
    { b: 'Independência.', text: 'Escrito com auxílio de IA (Claude, da Anthropic). Nenhuma checagem independente por terceiros ainda; os comandos para refazer tudo estão no repositório.' }
  ])
}));

const foot = '<p>' + C.esc('Gerado por apps/eleicoes2026/build.js a partir de corpus/eleicoes2026/ledger.json (sha256 ' + sha('corpus/eleicoes2026/ledger.json').slice(0, 16)
  + '…), refeito na construção por tools/eleicoes2026/ledger.py --check.') + '</p><p>' + C.esc('git ' + git) + '</p>';
let html = TPL.render({ title: 'Eleições 2026: o que os números permitem decidir · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot, lang: 'pt-BR',
  desc: 'A eleição presidencial de 2026 nos dois turnos, decidida em conta exata a partir dos arquivos do TSE: boletins de urna, resultados assinados, registros das urnas e as alegações do lado derrotado.',
  path: '/eleicoes2026/' });
html = html.replace('<span class="lab">tl;dr</span>', '<span class="lab">em resumo</span>').replace('<b>The finding.</b>', '<b>O resultado.</b>')
  .replace('<b>The mechanism.</b>', '<b>Como foi decidido.</b>').replace('<b>Check it.</b>', '<b>Confira.</b>');
html = html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, nofollow">');
if (!/name="robots" content="noindex/.test(html)) html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log('site/eleicoes2026/index.html written (unlisted): ' + Object.entries(D).map(([k, v]) => k + ' ' + v.verdict).join(', ') + ' @ git ' + git);
