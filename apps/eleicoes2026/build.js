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
const FIG = require(path.join(__dirname, 'figures.js'));
const GEO = require(path.join(__dirname, 'geo.js'));
/* WARRANT (design/WARRANT.md, v2.1): a value that is a float or a model's fit is computed (underlined dashed); a line
   computed in floating point is dashed by its standing, never to tell one series from another (identity is the
   series' token); a number that rests on a model or on chosen inputs names them (the mood, and the premise chain).
   The words are Portuguese (playground/warrant-pt.js), the marks are warrant.js's. */
const WR = require(path.join(ROOT, 'playground', 'warrant.js'));
const WP = require(path.join(ROOT, 'playground', 'warrant-pt.js'));
const cv = (t, why) => WR.value(C.esc(t), WR.COMPUTED, { title: 'computado: ' + why });
const die = (m) => { console.error('ELEICOES2026 PAGE REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');

try { cp.execFileSync('python3', ['tools/eleicoes2026/ledger.py', '--check'], { cwd: ROOT, encoding: 'utf8' }); }
catch (e) { die('the ledger does not re-derive: ' + (e.stdout || e.stderr || e.message)); }
const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'eleicoes2026', 'ledger.json'), 'utf8'));
const D = L.decisions;
const CL = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'eleicoes2026', 'claims.json'), 'utf8')).claims;
for (const k of ['SIG', 'R1-SUM', 'R1-SEC', 'R2-ARITH', 'R2-WIN', 'R2-SUM', 'EXT', 'C6', 'MINURNS', 'RLA', 'TRANSFER', 'MEANFIELD']) if (!D[k]) die('the ledger lacks ' + k);

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

B.push(C.figure({ svgRaw: FIG.scoreboard({ lula: W2.lula, flavio: W2.flavio, margin: W2.margin }), caption: '2º turno, 25 de outubro de 2026: votos válidos no resultado assinado pelo TSE (' + W2.sections.toLocaleString('pt-BR') + ' seções totalizadas).' }));

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
  ['Inverter o 2º turno exigiria adulterar ao menos ' + n(D.MINURNS.urns_if_every_voter_swapped) + ' urnas', D.MINURNS.verdict, 'Mesmo trocando todos os votos de cada urna, das maiores para as menores (§7).'],
  ['Uma auditoria por amostragem confirmaria o vencedor com ' + n(D.RLA.comparison_ballots) + ' votos', D.RLA.verdict, 'Comparação voto a voto, risco de 1%, sem divergências na amostra (§7).'],
  ['"51,74%" (dito na proclamação)', D.C6.verdict, 'A fração assinada é ' + D.C6.signed_exact + ' = ' + D.C6.signed_2dp + '%. Não muda o vencedor.']
];
B.push(C.section({
  lab: '§1 · os veredictos', title: 'O que foi decidido', wide: true,
  bodyRaw: C.table({ cols: [{ h: 'afirmação' }, { h: 'veredicto' }, { h: 'por quê' }], rows: verdictRows.map(([a, v, w]) => [a, { raw: stamp(v) }, w]) })
    + C.pRaw('<b>CERTIFICADO</b>: provado com conta exata. <b>REFUTADO</b>: falso, com o número que mostra. <b>RECUSADO</b>: não dá para decidir com estes dados, e o motivo. <b>FALTAM DADOS</b>: o arquivo que decide ainda não foi publicado. <b>MEDIDO</b>: uma medida ou um modelo, não uma decisão.')
}));

/* §2 the maps */
const RAMP = [[0.65, 'l4'], [0.60, 'l3'], [0.55, 'l2'], [0.50, 'l1'], [0.45, 'f1'], [0.40, 'f2'], [0.35, 'f3'], [-1, 'f4']];
const tone = (sh) => 'var(--el-' + RAMP.find(([t]) => sh >= t)[1] + ')';
const rampLegend = (w) => {
  const steps = [['f4', '< 35%'], ['f3', '35–40'], ['f2', '40–45'], ['f1', '45–50'], ['l1', '50–55'], ['l2', '55–60'], ['l3', '60–65'], ['l4', '≥ 65%']];
  const sw = Math.min(54, (w - 20) / 8);
  return steps.map(([k, t], i) => '    <rect x="' + (10 + i * sw).toFixed(1) + '" y="{Y}" width="' + (sw - 2).toFixed(1) + '" height="10" fill="var(--el-' + k + ')"/>'
    + '<text x="' + (10 + i * sw + (sw - 2) / 2).toFixed(1) + '" y="{Y}" dy="25" text-anchor="middle" class="t-note">' + C.esc(t) + '</text>').join('\n');
};
const ufShare = (rnd) => (code) => {
  const uf = GEO.UF_CODE[code];
  const u = uf && W2.per_uf[uf];
  if (!u) return null;
  const l = rnd === 1 ? u.r1_lula : u.lula, f = rnd === 1 ? u.r1_flavio : u.flavio, sh = l / (l + f);
  return { fill: tone(sh), label: (UF_NAMES[uf] || uf) + ' · ' + rnd + 'º turno', detail: 'Lula ' + pct(l, l + f, 1) + '% · Flávio ' + pct(f, l + f, 1) + '% (entre os dois)' };
};
const MUN = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'eleicoes2026', 'derived', 'r1-municipios.json'), 'utf8')).municipios;
const munShare = (code) => {
  const u = MUN[code];
  if (!u || u.lula + u.flavio === 0) return null;
  const sh = u.lula / (u.lula + u.flavio);
  return { fill: tone(sh), label: u.name + ' (' + u.uf + ')', detail: 'Lula ' + pct(u.lula, u.lula + u.flavio, 1) + '% · Flávio ' + pct(u.flavio, u.lula + u.flavio, 1) + '% entre os dois, 1º turno' };
};
const lulaMun = Object.values(MUN).filter((u) => u.lula > u.flavio).length, flavioMun = Object.values(MUN).filter((u) => u.flavio > u.lula).length;
B.push(C.section({
  lab: '§2 · o mapa', title: 'O país em dois mapas: o 1º e o 2º turno, estado por estado', wide: true,
  bodyRaw: C.pRaw('A cor de cada estado é a parcela de Lula entre os dois finalistas: vermelho onde Lula teve mais votos que Flávio, azul onde Flávio teve mais, e mais forte quanto maior a vantagem. '
      + 'Os números vêm dos resultados assinados do TSE (§4); as fronteiras, da malha oficial do IBGE.')
    + '<div class="el-pair">' + C.figure({ wide: false, svgRaw: GEO.choropleth({ level: 'uf', w: 440, value: ufShare(1), alt: 'Mapa do 1º turno por estado', legendRaw: rampLegend(440) }), caption: '1º turno (4/10).' })
    + C.figure({ wide: false, svgRaw: GEO.choropleth({ level: 'uf', w: 440, value: ufShare(2), alt: 'Mapa do 2º turno por estado', legendRaw: rampLegend(440) }), caption: '2º turno (25/10).' }) + '</div>'
    + C.pRaw('<b>Município por município, 1º turno.</b> Somando os boletins de urna de cada município: Lula à frente de Flávio em ' + n(lulaMun) + ' municípios, Flávio à frente em ' + n(flavioMun) + '. '
      + 'O mapa do 2º turno por município entra quando o TSE publicar os boletins do 2º turno em lote.')
    + C.figure({ svgRaw: GEO.choropleth({ level: 'mun', w: 900, value: munShare, alt: 'Mapa do 1º turno por município: parcela de Lula entre os dois finalistas', legendRaw: rampLegend(900) }),
      caption: '1º turno, ' + n(Object.keys(MUN).length) + ' municípios: a parcela de Lula entre Lula e Flávio, somada dos boletins de urna (§3). Passe o cursor para ver cada município.' })
}));

/* §3 round 1 */
const ufRows = R1.scopes.filter((s) => s.scope !== 'BR').map((s) => [UF_NAMES[s.scope] || s.scope, n(s.bu_sections_with_votes), n(s.turnout),
  { raw: Object.values(s.equal).every(Boolean) ? '<b>igual</b>' : '<b>DIFERENTE</b>' }]);
const order = Object.entries(r1c).sort((a, b) => b[1].votes - a[1].votes);
B.push(C.section({
  lab: '§3 · 1º turno', title: 'Os boletins de urna somam exatamente o resultado oficial', wide: true,
  bodyRaw: C.pRaw('O boletim de urna (BU) é o papel que cada urna imprime ao fechar e afixa na porta da seção, com os votos daquela seção. O TSE publica todos eles, em arquivo, por estado. '
      + 'Somamos os ' + n(D['R1-SEC'].sections) + ' boletins do cargo de presidente duas vezes, por programas que não compartilham código, e comparamos com o resultado oficial assinado.')
    + C.table({ cols: [{ h: 'candidato' }, { h: 'número' }, { h: 'votos (soma dos BUs = oficial)' }, { h: '% dos válidos' }],
      rows: order.map(([k, c]) => [c.name, k, n(c.votes), pct(c.votes, r1valid)]) })
    + C.pRaw('Brancos ' + n(R1.blank) + ' · nulos ' + n(R1.null) + ' · comparecimento ' + n(R1.turnout) + ' de ' + n(R1.registered) + ' eleitores aptos. '
      + 'Uma seção funcionou sem nenhum voto para presidente e por isso não aparece nos boletins de presidente: são as ' + n(D['R1-SEC'].sections) + ' seções com voto contra as ' + n(R1.scopes[0].signed_sections_installed) + ' instaladas.')
    + '<details><summary>Por estado</summary>' + C.table({ cols: [{ h: 'UF' }, { h: 'seções' }, { h: 'comparecimento' }, { h: 'soma × oficial' }], rows: ufRows }) + '</details>'
}));

/* §4 the signatures */
B.push(C.section({
  lab: '§4 · assinaturas', title: 'Os resultados que o TSE publica são assinados, e as assinaturas conferem',
  bodyRaw: C.pRaw('O site de resultados do TSE entrega cada resultado também em versão assinada digitalmente (formato JWS, algoritmo Ed25519). A chave pública está no próprio aplicativo do TSE. '
      + 'Uma assinatura válida prova que o arquivo é exatamente o que o TSE assinou: mudar um voto, um dígito, invalida a assinatura.')
    + C.pRaw('Verificamos os ' + D.SIG.files + ' arquivos (Brasil, 27 UFs e exterior, nos dois turnos) com duas implementações sem código em comum: uma escrita do zero a partir da RFC 8032, só com inteiros, e outra com a criptografia do Node. '
      + 'Resultado: ' + D.SIG.verified + ' de ' + D.SIG.files + ' válidas, e o conteúdo assinado é o mesmo que o site mostra. '
      + 'Controle vermelho: trocamos um único dígito de um total no arquivo nacional do 2º turno; as duas implementações recusaram a assinatura.')
    + C.pRaw('O que isto prova e o que não prova: prova que os números são os do TSE e não foram alterados no caminho até você. Não prova, sozinho, que o TSE somou certo; isso é a §3 (1º turno) e, quando os boletins do 2º turno saírem, a mesma conta.')
}));

/* §5 round 2 */
const R1S = D['R1-SUM'];
const r1Other = R1S.valid - r1c['13'].votes - r1c['22'].votes;
const elect = FIG.electorate([r1c['13'].votes, r1c['22'].votes, r1Other, R1S.blank + R1S.null, R1S.abstention],
  [W2.lula, W2.flavio, 0, W2.blank + W2.null, W2.abstention]);
const grewAll = Object.values(W2.per_uf).every((u) => u.lula / (u.lula + u.flavio) > u.r1_lula / (u.r1_lula + u.r1_flavio));
const swings = Object.entries(W2.per_uf).map(([uf, u]) => [uf, 100 * (u.lula / (u.lula + u.flavio) - u.r1_lula / (u.r1_lula + u.r1_flavio))]);
const swMin = swings.reduce((a, b) => (b[1] < a[1] ? b : a)), swMax = swings.reduce((a, b) => (b[1] > a[1] ? b : a));
const fmt1 = (x) => x.toFixed(1).replace('.', ',');
const bnDrop = R1S.blank + R1S.null - W2.blank - W2.null, abstDrop = R1S.abstention - W2.abstention;
const lulaGain = W2.lula - r1c['13'].votes, flavioGain = W2.flavio - r1c['22'].votes, pool = r1Other + bnDrop + abstDrop;
if (pool !== lulaGain + flavioGain || R1S.registered_functioning !== W2.registered_functioning) die('the balance between the rounds does not close');
B.push(C.section({
  lab: '§5 · 2º turno', title: 'O resultado assinado: ' + n(W2.margin) + ' votos de diferença', wide: true,
  bodyRaw: C.pRaw('Lula ' + n(W2.lula) + ' (' + W2.lula_share_2dp + '% dos válidos), Flávio Bolsonaro ' + n(W2.flavio) + '. Brancos ' + n(W2.blank) + ', nulos ' + n(W2.null)
      + ', comparecimento ' + n(W2.turnout) + ' de ' + n(W2.registered) + ' aptos, ' + n(W2.sections) + ' seções. As contas do próprio arquivo fecham, e os 27 estados mais o exterior somam exatamente o Brasil.')
    + C.pRaw('Para inverter o vencedor seria preciso trocar de lado ' + n(W2.swing_to_reverse) + ' votos (um voto que sai de Lula e vai para Flávio muda a diferença em dois), ou anular ' + n(W2.removal_to_reverse) + ' votos de Lula.')
    + C.figure({ svgRaw: elect, caption: 'Todo o eleitorado das seções que funcionaram, em cada turno: quem votou em quem, quem votou branco ou nulo e quem não foi votar. Entre os turnos, a abstenção caiu de '
      + fmt1(100 * R1S.abstention / R1S.registered_functioning) + '% para ' + fmt1(100 * W2.abstention / W2.registered_functioning) + '%; os outros ' + n(Object.keys(r1c).length - 2) + ' candidatos do 1º turno deixaram de ser opção no 2º.' })
    + C.figure({ svgRaw: FIG.balance({ others: r1Other, blankDrop: bnDrop, abstDrop, lulaGain, flavioGain }),
      caption: 'Entre os turnos abriram-se ' + n(pool) + ' votos para os finalistas: os ' + n(r1Other) + ' que tinham ido a outros candidatos, ' + n(bnDrop) + ' brancos e nulos a menos e ' + n(abstDrop)
        + ' eleitores a mais. Lula ficou com ' + n(lulaGain) + ' (' + pct(lulaGain, pool, 1) + '%), Flávio com ' + n(flavioGain) + '. As duas barras têm o mesmo total: é uma identidade exata, porque o eleitorado é o mesmo nos dois turnos.' })
    + C.pRaw('<b>Uma virada espalhada, não concentrada.</b> Entre os dois finalistas, a parcela de Lula cresceu ' + (grewAll ? 'em todos os ' + n(Object.keys(W2.per_uf).filter((uf) => uf !== 'ZZ').length) + ' estados' + (W2.per_uf.ZZ ? ' e no exterior' : '') : 'na maioria dos estados')
      + ', de +' + fmt1(swMin[1]) + ' p.p. (' + (UF_NAMES[swMin[0]] || swMin[0]) + ') a +' + fmt1(swMax[1]) + ' p.p. (' + (UF_NAMES[swMax[0]] || swMax[0]) + '). '
      + 'Mudanças parecidas em todo o país são o que se espera quando eleitores de outros candidatos e quem não tinha votado escolhem um lado; os dois mapas da §2 mostram cada estado, e a §7 olha esse padrão de perto.')
}));

/* §6 the extension */
const scaleSvg = FIG.scale([
  { k: 'votos de Lula que precisariam ser anulados para inverter o resultado', v: W2.removal_to_reverse, fill: 'var(--c-s1)', stroke: 'var(--ink-5)', emph: true },
  { k: 'ou votos que precisariam trocar de lado', v: W2.swing_to_reverse, fill: 'var(--c-s2)' },
  { k: 'votos depois das 17h no país, segundo o TSE', v: EXT.tse_reported_late_votes, fill: 'var(--c-1)', emph: true }
].concat(extDone.map((uf) => ({ k: 'votos depois das 17h no ' + (UF_NAMES[uf] || uf) + ', contados nos registros das urnas', v: Math.max(1, EXT.logs[uf].late_votes), fill: 'var(--c-1)' }))));
const RC = D['R1-CLOSE'];
const closeSvg = RC ? CH.dist({ w: 900, h: 300, alt: 'Minutos depois das 17h em que cada urna fechou, no 1º turno', x0: 0, x1: 61, padL: 70,
  bins: Object.keys(RC.minute_histogram).sort((a, b) => a - b).map((k) => ({ k: k + ' min', n: RC.minute_histogram[k] }))
    .concat([{ k: '60 min ou mais', n: RC.closed_60_or_more_minutes_after, token: CH.CTX }]),
  xTicks: [0, 10, 20, 30, 40, 50, 60].map((v) => ({ v: v + 0.5, t: v === 60 ? '60+' : v + ' min' })), yTicks: [],
  xLabel: 'minutos depois das 17h (no relógio de cada urna) em que a urna encerrou a votação',
  marks: [{ x: RC.percentiles_minutes.p50 + 0.5, t: 'metade fechou até ' + fmt1(RC.percentiles_minutes.p50) + ' min' }], unit: 'urnas' }) : '';
const logTable = Object.entries(EXT.logs).map(([uf, x]) => [UF_NAMES[uf] || uf, n(x.sections_read) + ' de ' + n(x.sections_installed), n(x.votes_in_logs) + ' de ' + n(x.turnout_signed),
  n(x.late_votes), String(x.max_late_in_a_section), { raw: x.complete ? '<b>completo</b>' : 'parcial' }]);
B.push(C.section({
  lab: '§6 · a prorrogação', title: 'Para a prorrogação inverter o resultado, seriam precisos ' + n(W2.margin) + ' votos depois das 17h', wide: true,
  bodyRaw: C.pRaw('Às 16h32 de 25 de outubro, o ministro Cristiano Zanin, do STF, estendeu a votação até as 19h nas seções ainda abertas, a pedido da coligação de Lula, por causa da redução de ônibus em algumas cidades. '
      + 'A campanha de Flávio Bolsonaro havia pedido ao TSE extensão parecida em 17 municípios de SP, PR e SC, por causa de chuva. A legalidade da decisão é uma questão jurídica e não é decidida aqui. '
      + 'A pergunta que é uma conta é outra: <b>os votos que só existiram por causa da prorrogação poderiam ter decidido a eleição?</b>')
    + C.figure({ svgRaw: scaleSvg, caption: 'Quadrados de área proporcional ao número de votos, todos no mesmo canto. O quadrado de fora é o que inverteria o resultado; os pequenos, no canto, os votos dados depois das 17h.' })
    + (RC ? C.pRaw('<b>Votar depois das 17h não é, por si, irregular.</b> Pela lei, quem está na fila às 17h vota. No 1º turno, sem prorrogação nenhuma, metade das ' + n(RC.sections)
        + ' urnas do país encerrou até ' + fmt1(RC.percentiles_minutes.p50) + ' minutos depois das 17h, e ' + n(RC.closed_60_or_more_minutes_after) + ' encerraram uma hora ou mais depois, por causa das filas de um dia com seis votos por eleitor. '
        + 'Parte dos votos depois das 17h do 2º turno é essa fila de sempre; o que a prorrogação acrescentou é no máximo o total tardio.')
      + C.figure({ svgRaw: closeSvg, caption: '1º turno, sem prorrogação: quantas urnas encerraram a votação em cada minuto depois das 17h (no relógio de cada urna, exterior excluído). A última barra junta as que encerraram uma hora ou mais depois.' }) : '')
    + C.pRaw('<b>Como contamos.</b> Cada urna grava um registro (log) com a hora de cada evento, e uma linha "O voto do eleitor foi computado" para cada voto. O relógio da urna está na hora local, então o limite é a hora em que a urna ficou "pronta para receber votos" (8h de Brasília, no fuso dela) mais 9 horas. '
      + 'Um voto às 17h00 ou depois conta como tardio. Os registros vêm do site de resultados do TSE, seção por seção; cada arquivo é lacrado por sha256.')
    + (logTable.length ? C.table({ cols: [{ h: 'UF' }, { h: 'seções lidas' }, { h: 'votos nos registros × comparecimento' }, { h: 'após as 17h' }, { h: 'máx. numa seção' }, { h: 'leitura' }], rows: logTable }) : '')
    + C.pRaw('<b>O que falta.</b> A contagem nacional exige os registros das ' + n(W2.sections) + ' seções. O TSE os publica em lote no portal de dados abertos (no 1º turno, três dias depois). Até lá, o veredicto nacional é FALTAM DADOS, '
      + 'com o limiar publicado: só um total de pelo menos ' + n(W2.margin) + ' votos tardios, todos de Lula, inverteria o resultado. O número do TSE é ' + (100 * EXT.tse_reported_late_votes / W2.margin).toFixed(2).replace('.', ',') + '% disso.')
}));

/* §7 the mathematics of the margin */
{
  const MU = D.MINURNS, RL = D.RLA, MF = D.MEANFIELD, TR = D.TRANSFER;
  const curvePts = Object.entries(MU.curve).map(([k, v]) => [Number(k), v]).sort((a, b) => a[0] - b[0]);
  const urnSvg = CH.scatter({ w: 900, h: 380, alt: 'Eleitores aptos acumulados nas maiores urnas, contra o número de urnas, com os limiares que inverteriam o resultado',
    x0: 1, x1: 6e5, y0: 500, y1: 2e8, logX: true, logY: true, padL: 96,
    xTicks: [1, 10, 100, 1e3, 1e4, 1e5].map((v) => ({ v, t: n(v) })), yTicks: [1e3, 1e4, 1e5, 1e6, 1e7, 1e8].map((v) => ({ v, t: n(v) })),
    xLabel: 'número de urnas, das maiores para as menores (escala logarítmica)', yLabel: 'eleitores aptos nessas urnas',
    curves: [{ pts: curvePts, token: CH.CAT[1], k: '' }],
    hlines: [{ y: MU.swing_needed, token: 'var(--el-lula)' }, { y: MU.removal_needed, token: 'var(--el-flavio)' }],
    pts: [{ x: MU.urns_if_every_voter_swapped, y: MU.swing_needed, token: 'var(--el-lula)', k: 'trocar', v: n(MU.urns_if_every_voter_swapped) + ' urnas, todo eleitor trocado' },
      { x: MU.urns_if_every_voter_removed, y: MU.removal_needed, token: 'var(--el-flavio)', k: 'anular', v: n(MU.urns_if_every_voter_removed) + ' urnas, todo voto anulado' }],
    keys: [{ token: 'var(--el-lula)', t: 'trocar ' + n(MU.swing_needed) + ' votos de lado: ' + n(MU.urns_if_every_voter_swapped) + ' urnas' }, { token: 'var(--el-flavio)', t: 'anular ' + n(MU.removal_needed) + ' votos: ' + n(MU.urns_if_every_voter_removed) + ' urnas' }] });

  /* the three audits as curves over the winner's share, every point from the same formulas the ledger certifies at 2026's margin */
  /* the chosen inputs, read from the ledger (the curves used to type them): the risk limit and the super-simple gamma */
  if (!/^1\/\d+$/.test(RL.risk || '') || !/60-digit/.test(RL.arithmetic || '') || !/1e-40/.test(RL.arithmetic || '')) die('the RLA record lost its risk or its arithmetic note');
  const alpha = 1 / Number(RL.risk.split('/')[1]), riskPct = n(100 * alpha), g = Number(RL.comparison_gamma);
  const ballots = W2.turnout, two = W2.valid;
  const asn = (sh) => (Math.log(1 / alpha) + 0.5 * Math.log(2 * sh)) / (sh * Math.log(2 * sh) + (1 - sh) * Math.log(2 - 2 * sh)) * ballots / two;
  const mu = (sh) => (2 * sh - 1) * two / ballots;
  const cmp = (sh) => 2 * g * Math.log(1 / alpha) / mu(sh);
  const bat = (sh) => Math.log(alpha) / Math.log(1 - mu(sh) / 2);
  const grid = []; for (let v = 50.5; v <= 60.001; v += 0.25) grid.push(v);
  const s26 = 100 * W2.lula / W2.valid;
  const rlaSvg = CH.scatter({ w: 900, h: 380, alt: 'Tamanho da amostra de uma auditoria de risco limitado, pela margem, para três métodos, com 2026 marcado',
    x0: 50, x1: 60.5, y0: 30, y1: 1e6, logY: true, padL: 96,
    xTicks: [50, 52, 54, 56, 58, 60].map((v) => ({ v, t: v + '%' })), yTicks: [100, 1e3, 1e4, 1e5, 1e6].map((v) => ({ v, t: n(v) })),
    xLabel: 'parcela do vencedor entre os dois finalistas', yLabel: 'amostra necessária (risco de 1%)',
    /* the curves are the formulas in JavaScript floating point at every share: computed, so dashed, all three (the third
       used to be the only dashed one, to tell it from the second: dash for identity, WARRANT rule 4). Only the three points
       on the 2026 line are the ledger's certified numbers. */
    curves: [{ pts: grid.map((v) => [v, asn(v / 100)]), token: CH.CAT[0], dashed: true, k: '' }, { pts: grid.map((v) => [v, cmp(v / 100)]), token: CH.CAT[1], dashed: true, k: '' }, { pts: grid.map((v) => [v, bat(v / 100)]), token: CH.CAT[2], dashed: true, k: '' }],
    vlines: [{ x: s26, token: 'var(--el-lula)', t: '2026: ' + s26.toFixed(2).replace('.', ',') + '%' }],
    pts: [{ x: s26, y: RL.polling_ballots, token: CH.CAT[0], k: 'por sorteio de votos', v: n(RL.polling_ballots) + ' votos' },
      { x: s26, y: RL.comparison_ballots, token: CH.CAT[1], k: 'por comparação, voto a voto', v: n(RL.comparison_ballots) + ' votos' },
      { x: s26, y: RL.batch_sections, token: CH.CAT[2], k: 'por comparação, urna a urna', v: n(RL.batch_sections) + ' urnas' }],
    keys: [{ token: CH.CAT[0], t: 'sortear votos (votos)', kind: 'dash' }, { token: CH.CAT[1], t: 'comparar votos (votos)', kind: 'dash' }, { token: CH.CAT[2], t: 'comparar urnas (urnas)', kind: 'dash' }] });

  const mfPts = MF.rows.map((r) => ({ x: 100 * r.others_r1, y: r.logit_shift, fill: r.m2 >= 0.5 ? 'var(--el-lula)' : 'var(--el-flavio)', label: r.uf === 'ZZ' ? 'exterior' : r.uf,
    k: UF_NAMES[r.uf] || r.uf, v: 'log-chances +' + r.logit_shift.toFixed(3).replace('.', ',') + ' · outros no 1º turno ' + (100 * r.others_r1).toFixed(1).replace('.', ',') + '%' }));
  const xs = mfPts.map((q) => q.x), ys = mfPts.map((q) => q.y), mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
  const slope = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  const mfSvg = FIG.labelled({ pts: mfPts, x0: 4, x1: 16, y0: 0.04, y1: 0.19, alt: 'Variação das log-chances de Lula entre os turnos, por estado, contra a parcela dos outros candidatos no 1º turno',
    xTicks: [4, 6, 8, 10, 12, 14, 16].map((v) => ({ v, t: v + '%' })), yTicks: [0.05, 0.10, 0.15].map((v) => ({ v, t: '+' + v.toFixed(2).replace('.', ',') })),
    xLabel: 'votos de outros candidatos no 1º turno (% dos válidos do estado)', yLabel: 'variação das log-chances de Lula',
    fit: [[4.5, my + slope * (4.5 - mx)], [15.5, my + slope * (15.5 - mx)]] });

  B.push(C.section({
    lab: '§7 · a matemática da margem', title: 'Quatro contas sobre o tamanho desta vitória', wide: true,
    bodyRaw: C.pRaw('<b>1. Quantas urnas teriam de ser adulteradas.</b> ' + stamp(MU.verdict) + ' Numa urna, uma adulteração mexe no máximo em tantos votos quantos eleitores ela tem. '
        + 'Ordenando as ' + n(MU.sections) + ' urnas da maior para a menor (a maior tem ' + n(MU.largest_capacity) + ' eleitores; a do meio, ' + n(MU.median_capacity) + '), a conta exata é: '
        + 'para trocar de lado os ' + n(MU.swing_needed) + ' votos que inverteriam o resultado, seria preciso adulterar ao menos <b>' + n(MU.urns_if_every_voter_swapped) + ' urnas</b>, '
        + 'e isso mesmo supondo que em cada uma todo eleitor apareceu e todo voto foi trocado. Anulando votos em vez de trocar, ao menos ' + n(MU.urns_if_every_voter_removed) + '. '
        + 'Cada uma dessas urnas imprime o seu boletim, afixa na porta da seção e o assina digitalmente.')
      + C.figure({ svgRaw: urnSvg, caption: 'A curva soma os eleitores aptos das maiores urnas: a primeira urna, as duas primeiras, e assim por diante. Ela cruza as linhas dos limiares nos números de urnas marcados. Os eleitores aptos por urna são os mesmos nos dois turnos (o cadastro é o mesmo: ' + n(W2.registered_functioning) + ' aptos nas seções que funcionaram, em ambos).' })
      + C.pRaw('<b>2. Quanto bastaria conferir por amostragem.</b> ' + stamp(RL.verdict) + ' Uma auditoria de risco limitado (o método que vários estados americanos usam) sorteia votos ou urnas e para quando a amostra confirma o vencedor com um risco de erro fixado. '
        + 'Com esta margem e <i>dado risco de ' + riskPct + '%, sem encontrar nenhuma divergência na amostra</i>: sortear em média <b>' + n(RL.polling_ballots) + ' votos</b>; ou comparar <b>' + n(RL.comparison_ballots) + ' votos</b> um a um com o registro digital; '
        + 'ou recontar <b>' + n(RL.batch_sections) + ' urnas</b> inteiras sorteadas com probabilidade proporcional ao tamanho. Calculado com logaritmos de 60 dígitos (fórmulas de Lindeman & Stark, 2012). '
        + 'O Brasil não tem voto impresso; a amostra seria de boletins e registros digitais de voto, que são públicos.')
      + C.figure({ svgRaw: rlaSvg, caption: 'Quanto menor a margem, maior a amostra. As curvas são as mesmas fórmulas calculadas em ponto flutuante em cada margem, por isso tracejadas; só os três pontos sobre a linha de 2026 são os números certificados acima. A curva das urnas e a dos votos comparados quase coincidem (' + n(RL.batch_sections) + ' urnas, ' + n(RL.comparison_ballots) + ' votos); a cor e a legenda dizem qual é qual.' })
      + WP.legendHtml({ compact: true, exclude: [WR.CHOSEN, WR.REFUSED] })
      + C.pRaw('<b>Em que estes números se apoiam.</b>') + WP.premisesHtml([
        { grade: WR.ASSUMED, label: 'As fórmulas da auditoria', evidence: 'adotadas de ' + C.esc(RL.source) + '; a conta sobre elas é exata (logaritmos decimais de 60 dígitos, cada teto recusado se o valor cair a menos de 10⁻⁴⁰ de um inteiro), e as fórmulas não são conferidas aqui.' },
        { grade: WR.ASSUMED, label: 'O cenário', evidence: '<i>dado risco de ' + riskPct + '%, nenhuma divergência na amostra e γ = ' + C.esc(RL.comparison_gamma.replace('.', ',')) + '</i>: escolhas, não dados; com divergências, a amostra cresce.' }
      ], { meetLine: 'A conta é exata; a premissa mais fraca fica no degrau <b>' + WP.GRADE[WR.ASSUMED] + '</b>.' })
      + C.pRaw('<b>3. De onde vieram os votos.</b> ' + stamp(TR.verdict) + ' A conta exata, sem modelo, dá para cada fluxo (por exemplo, eleitores de Flávio no 1º turno que votaram em Lula no 2º) o mínimo e o máximo compatíveis com os números de cada unidade. '
        + 'Com os dados por estado, os limites quase nada dizem: entre 0 e ' + n(TR.bounds['others->lula'][1]) + ' dos eleitores de outros candidatos podem ter ido para Lula. '
        + stamp('NEEDS DATA') + ' Com os boletins do 2º turno por seção, cada uma das ' + n(MU.sections) + ' seções vira uma unidade e os limites se estreitam; publicaremos quando o TSE publicar. O saldo nacional exato está na §5.')
      + C.pRaw('<b>4. Um olhar de campo médio (modelo, não veredicto).</b> ' + stamp('MEASURED') + ' Num modelo de campo médio da escolha entre dois candidatos (Brock e Durlauf), cada eleitor decide pela soma de um "campo" comum e da influência dos outros. '
        + 'Uma mudança no campo nacional move as log-chances de todos os estados igualmente se não há influência mútua, e mais nos estados equilibrados se há. '
        + 'Nos dados, as log-chances de Lula subiram entre ' + cv('+' + MF.logit_shift_min.toFixed(3).replace('.', ','), 'ponto flutuante, 6 casas no registro') + ' e ' + cv('+' + MF.logit_shift_max.toFixed(3).replace('.', ','), 'ponto flutuante, 6 casas no registro') + ' em todos os estados; '
        + 'a correlação com o equilíbrio do estado é ' + cv(MF.corr_shift_vs_balance.toFixed(2).replace('.', ','), 'correlação em ponto flutuante') + ' (nenhuma), e com a parcela dos outros candidatos no 1º turno, ' + cv(MF.corr_shift_vs_others.toFixed(2).replace('.', ','), 'correlação em ponto flutuante') + '. '
        + 'Leitura: a virada foi um deslocamento nacional, maior onde havia mais eleitores sem candidato no 2º turno, e não um efeito de influência mútua concentrado nos estados divididos. Com ' + n(MF.rows.length) + ' unidades, é uma descrição, não uma prova.')
      + C.figure({ svgRaw: mfSvg, caption: 'Cada ponto é um estado (cor: quem venceu nele no 2º turno). Eixo vertical: quanto as log-chances de Lula entre os dois finalistas subiram do 1º para o 2º turno. A linha tracejada é o ajuste linear, em ponto flutuante, só para guiar o olho.' })
      + WP.premisesHtml([{ grade: WR.ASSUMED, label: 'O modelo de campo médio (Brock e Durlauf)', evidence: 'adotado da literatura para ler os dados; nada aqui o conferiu. As log-chances são contas sobre os totais assinados; a leitura delas é a do modelo.' }],
        { meetLine: 'A leitura fica no degrau <b>' + WP.GRADE[WR.ASSUMED] + '</b>: com ' + n(MF.rows.length) + ' unidades, uma descrição, não uma prova.' })
  }));
}

/* §8 the polls */
if (D.POLLS) {
  const P = D.POLLS.polls.filter((p) => p.cells.length);
  const BR = D.POLLS.by_round;
  const lulaAhead1 = P.filter((p) => p.round === 1).filter((p) => { const l = p.cells.find((x) => x.candidate === '13'), f = p.cells.find((x) => x.candidate === '22'); return l && f && Number(l.published) > Number(f.published); }).length;
  const res = { 1: { '13': 100 * r1c['13'].votes / r1valid, '22': 100 * r1c['22'].votes / r1valid }, 2: { '13': 100 * W2.lula / W2.valid, '22': 100 * W2.flavio / W2.valid } };
  const ELEC = { 1: Date.UTC(2026, 9, 4), 2: Date.UTC(2026, 9, 25) };
  const leadRes = { 1: res[1]['22'] - res[1]['13'], 2: res[2]['22'] - res[2]['13'] };
  const leadPts = P.filter((p) => p.lead_published_flavio_minus_lula !== undefined).map((p) => {
    const [y, mo, d] = String(p.published).split('-').map(Number);
    const days = (Date.UTC(y, mo - 1, d) - ELEC[p.round]) / 864e5;
    const [ln, ld] = p.lead_published_flavio_minus_lula.split('/'); const lead = Number(ln) / Number(ld || 1);   /* the ledger keeps it as an exact fraction */
    return { x: days, y: lead, token: p.round === 1 ? CH.CAT[1] : CH.CAT[0], diamond: p.round === 1, hollow: p.round === 1, k: p.pollster + ' · ' + p.round + 'º turno · ' + p.published,
      v: 'Flávio − Lula: ' + (lead >= 0 ? '+' : '') + lead.toFixed(1).replace('.', ',') + ' p.p.' };
  });
  const below1 = leadPts.filter((q) => q.diamond && q.y < leadRes[1]).length, n1 = leadPts.filter((q) => q.diamond).length;
  const above2 = leadPts.filter((q) => !q.diamond && q.y > leadRes[2]).length, n2 = leadPts.filter((q) => !q.diamond).length;
  const leadSvg = CH.scatter({ w: 900, h: 360, alt: 'Vantagem de Flávio sobre Lula em cada pesquisa, por dias antes da eleição, nos dois turnos, contra o resultado',
    x0: -9, x1: 3.2, y0: -8, y1: 8, padL: 96,
    xTicks: [-8, -6, -4, -2, 0].map((v) => ({ v, t: v === 0 ? 'véspera' : v + ' dias' })), yTicks: [-8, -4, 0, 4, 8].map((v) => ({ v, t: (v > 0 ? '+' : '') + v + ' p.p.' })),
    xLabel: 'dias antes da eleição', yLabel: 'Flávio − Lula, votos válidos',
    pts: leadPts,
    hlines: [{ y: leadRes[1], token: CH.CAT[1], t: 'urnas, 1º turno: Flávio ' + (leadRes[1] >= 0 ? '+' : '') + leadRes[1].toFixed(2).replace('.', ',') },
      { y: leadRes[2], token: CH.CAT[0], t: 'urnas, 2º turno: Flávio ' + leadRes[2].toFixed(2).replace('.', ',') }],
    keys: [{ token: CH.CAT[1], t: 'pesquisas do 1º turno (losango)' }, { token: CH.CAT[0], t: 'pesquisas do 2º turno (ponto)' }] });
  const fig = (rnd, cand, nome, lo, hi) => {
    const rows = P.filter((p) => p.round === rnd).map((p) => ({ p, c: p.cells.find((x) => x.candidate === cand) })).filter((x) => x.c)
      .sort((a, b) => (a.p.published + a.p.pollster < b.p.published + b.p.pollster ? -1 : 1));
    const ticks = []; for (let v = lo; v <= hi; v += 2) ticks.push({ v, t: v + '%' });
    return CH.intervals({ w: 900, rowH: 22, padL: 250, alt: nome + ' nas pesquisas finais do ' + rnd + 'º turno, com a margem declarada, contra o resultado das urnas',
      x0: lo, x1: hi, xTicks: ticks, xLabel: nome + ', % dos votos válidos · última linha: o resultado das urnas',
      rows: rows.map(({ p, c }) => ({ k: (c.inside_margin ? '✓ ' : '') + p.pollster + ' · ' + String(p.published).slice(8, 10) + '/' + String(p.published).slice(5, 7),
        lo: Number(c.published) - Number(p.margin), hi: Number(c.published) + Number(p.margin), point: Number(c.published), v: c.published + '% ± ' + p.margin,
        token: c.inside_margin ? (cand === '13' ? 'var(--el-lula)' : 'var(--el-flavio)') : CH.CTX }))
        .concat([{ k: 'RESULTADO DAS URNAS', point: res[rnd][cand], note: res[rnd][cand].toFixed(2).replace('.', ',') + '%', token: 'var(--ink)' }]) });
  };
  B.push(C.section({
    lab: '§8 · as pesquisas', title: 'As pesquisas erraram nos dois turnos, e para lados opostos', wide: true,
    bodyRaw: C.pRaw('Lemos ' + BR['1'].polls + ' pesquisas nacionais publicadas na última semana do 1º turno e ' + BR['2'].polls + ' na do 2º, cada uma com a fonte e, quando existe, o registro no TSE '
        + '(' + m('corpus/eleicoes2026/polls.json') + '). Comparamos com as urnas as que publicaram votos válidos e margem de erro: ' + BR['1'].compared + ' no 1º turno e ' + BR['2'].compared + ' no 2º.')
      + C.pRaw('<b>1º turno.</b> Em média, as pesquisas deram a Flávio Bolsonaro ' + BR['1'].mean_error_pp_22 + ' ponto a menos do que ele teve: todas as ' + BR['1'].polls_below_result_22
        + ' o subestimaram, e ' + lulaAhead1 + ' delas o puseram atrás de Lula, que ficou em segundo. <b>2º turno.</b> O erro trocou de lado: em média deram a Lula ' + BR['2'].mean_error_pp_13
        + ' ponto a menos, e todas as ' + BR['2'].polls_below_result_13 + ' o subestimaram. Somando os dois turnos, ' + (BR['1'].inside_margin + BR['2'].inside_margin) + ' de '
        + (BR['1'].lula_flavio_cells + BR['2'].lula_flavio_cells) + ' números (Lula ou Flávio, numa pesquisa) contêm o resultado dentro da margem declarada.')
      + C.figure({ svgRaw: leadSvg, caption: 'Cada ponto é uma pesquisa: a vantagem de Flávio sobre Lula nos votos válidos que ela publicou, pelo número de dias antes da eleição. As linhas são o resultado das urnas em cada turno. No 1º turno, ' + below1 + ' de ' + n1 + ' pesquisas ficam abaixo da linha do seu turno; no 2º, ' + above2 + ' de ' + n2 + ' ficam acima.' })
      + C.figure({ svgRaw: fig(1, '22', 'Flávio Bolsonaro', 36, 52), caption: '1º turno: Flávio Bolsonaro em cada pesquisa (ponto) com a margem declarada (barra), contra o resultado das urnas (última linha). Marcadas com ✓ as que contêm o resultado.' })
      + C.figure({ svgRaw: fig(2, '13', 'Lula', 44, 56), caption: '2º turno: Lula em cada pesquisa, com a margem declarada, contra o resultado das urnas (última linha). Marcadas com ✓ as que contêm o resultado.' })
      + C.pRaw('<b>O que um erro de pesquisa prova.</b> Uma pesquisa estima a opinião de uma amostra dias antes da eleição. A margem de erro cobre só o acaso da amostragem, não mudança de última hora, '
        + 'comparecimento diferente do previsto ou eleitores que não respondem; e a margem impressa costuma ser a dos votos totais, mais estreita que a dos válidos. '
        + 'Um erro grande contra um candidato num turno e contra o outro no turno seguinte é o retrato de pesquisas com dificuldade de medir o eleitorado, não de uma contagem desviada para um lado. '
        + 'A contagem é a soma dos boletins, conferida nas §3 a §5.')
  }));
}

/* §9 the claims */
const cw = { C1: EXT.verdict === 'CERTIFIED' ? 'REFUTED' : EXT.verdict, C2: 'REFUSED', C3: 'REFUSED', C4: EXT.verdict === 'NEEDS DATA' ? 'NEEDS DATA' : 'CERTIFIED', C5: 'CERTIFIED', C6: D.C6.verdict, C7: 'MEASURED' };
const why = {
  C1: 'A parte que é conta: inverter exigiria ' + n(W2.margin) + ' votos tardios de um lado só. Nacionalmente pendente dos registros completos; onde já lemos tudo, os tardios são centenas, não milhões. A parte jurídica (anular) não é conta.',
  C2: 'Votos que não foram dados não existem em nenhum arquivo. Nenhuma conta decide um "e se".',
  C3: 'É um fato sobre o que aconteceu numa sala do TSE, não um número publicado. O que os fiscais viriam conferir (os totais) está nas §3 a §5.',
  C4: 'Será conferido contra os registros das urnas quando o TSE publicar todos. Onde já lemos tudo, o número por estado está na §6.',
  C5: 'A assinatura confere e as contas do arquivo fecham. A soma seção por seção do 2º turno aguarda os boletins em lote.',
  C6: '51,74% não é a fração de Lula nos válidos do resultado assinado (' + D.C6.signed_2dp + '%). Provável erro de leitura; não muda nada.',
  C7: 'Medido na §8. Um erro de pesquisa não é evidência sobre a contagem.'
};
B.push(C.section({
  lab: '§9 · as alegações', title: 'Cada afirmação pública, com o veredicto que os dados permitem', wide: true,
  bodyRaw: C.table({ cols: [{ h: 'quem' }, { h: 'o que disse' }, { h: 'veredicto' }, { h: 'por quê' }],
    rows: CL.map((c) => [c.quem, c.quoted ? '"' + c.disse + '"' : c.disse + ' (paráfrase)', { raw: stamp(cw[c.id]) }, why[c.id]]) })
    + C.pRaw('Fontes de cada afirmação em ' + m('corpus/eleicoes2026/claims.json') + '. Citações entre aspas apenas quando a fonte foi lida inteira.')
}));

/* §10 limits */
B.push(C.section({
  lab: '§10 · o que não foi decidido', title: 'Os limites deste dossiê',
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
  cssRaw: ':root{--el-lula:#e5484d;--el-flavio:#3d84f6;--el-l1:#4a2326;--el-l2:#7d2b30;--el-l3:#b4343a;--el-l4:#ee5a60;--el-f1:#1d2a45;--el-f2:#24427c;--el-f3:#2f63c0;--el-f4:#6aa0fb}'
    + '.t-big{font-size:var(--text-2);font-weight:var(--weight-strong);fill:var(--ink)}.t-score{font-size:var(--text-1);font-weight:var(--weight-strong);fill:var(--ink)}'
    + '.t-kick{font-size:var(--text-eyebrow);letter-spacing:var(--track-eyebrow);fill:var(--ink-3)}.el-pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:var(--s-4)}', scriptRaw: CH.script(),
  desc: 'A eleição presidencial de 2026 nos dois turnos, decidida em conta exata a partir dos arquivos do TSE: boletins de urna, resultados assinados, registros das urnas e as alegações do lado derrotado.',
  path: '/eleicoes2026/' });
html = html.replace('<span class="lab">tl;dr</span>', '<span class="lab">em resumo</span>').replace('<b>The finding.</b>', '<b>O resultado.</b>')
  .replace('<b>The mechanism.</b>', '<b>Como foi decidido.</b>').replace('<b>Check it.</b>', '<b>Confira.</b>');
html = html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, nofollow">');
if (!/name="robots" content="noindex/.test(html)) html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log('site/eleicoes2026/index.html written (unlisted): ' + Object.entries(D).map(([k, v]) => k + ' ' + v.verdict).join(', ') + ' @ git ' + git);
