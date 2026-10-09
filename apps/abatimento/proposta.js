/* proposta.js — the Proposta Técnica (pt-BR, A4, several pages) for Petrobras's CPSI
   7004641677, printed by headless Chrome with page numbers. Every figure comes from the
   same numbers object as the page; the commercial section is a placeholder the proponent
   fills. apps/abatimento · cert-machine                                            MIT */
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const ROOT = path.join(__dirname, '..', '..');
const T = require(path.join(ROOT, 'design', 'tokens.js'));
const RC = require('./registro.js');
const esc = RC.esc;
const REPO = 'https://github.com/carlostoledo1891/cert-machine';

function build(N, git) {
  const { br, pb, tbg } = N;
  const h = (n, t) => '<h2>' + n + ' · ' + esc(t) + '</h2>';
  const p = (s) => '<p>' + s + '</p>';
  const tbl = (cols, rows) => '<table><thead><tr>' + cols.map((c) => '<th>' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' + rows.map((r) => '<tr>' + r.map((x) => '<td>' + x + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
  const S = [];
  S.push('<header><div class="ey">Proposta Técnica · Petrobras · Conexões para Inovação · Aquisição de Soluções (CPSI) · oportunidade 7004641677 · recebimento de propostas até 19/10/2026 17:00 (Petronect)</div>'
    + '<h1>Registro de Abatimento: sistema de cálculo, registro e decisão do potencial de abatimento de emissões do portfólio do CENPES, com envelopes declarados, versões e recálculo auditável</h1>'
    + '<div class="meta">Proponente: Carlos Toledo (carlos@carlostoledo.co) · demonstrador público: carlostoledo.co/abatimento · código e registros: ' + REPO + '/tree/main/apps/abatimento · versão desta proposta: ' + esc(git) + ', 2026-10-08</div></header>');
  S.push(h('1', 'Objeto'));
  S.push(p('Fornecer ao CENPES, em contrato de inovação de doze meses, um sistema que (i) registra cada potencial de abatimento de emissões do portfólio com as premissas que o produziram, cada uma como faixa com unidade e fonte, (ii) decide sobre o envelope inteiro das premissas — em aritmética exata, nunca em um ponto — a classe de potencial, a compatibilidade da afirmação publicada e a soma por níveis (tecnologia, iniciativa, portfólio, área de negócio, Petrobras) com auditoria de dupla contagem, (iii) guarda cada versão de cada cenário com o diff para a anterior, e (iv) se refaz com um comando, conferido por uma segunda implementação sem código em comum. O sistema é uma camada de governança do número de abatimento: não substitui a Curva MAC Integrada, o inventário de GEE, a análise de ciclo de vida nem o Fundo de Descarbonização; guarda e decide os números que eles produzem.'));
  S.push(h('2', 'Entendimento do desafio'));
  S.push(p('A oportunidade pede uma ferramenta de apoio à decisão em descarbonização, alinhada à decisão de investimento e ao Roadmap de Desenvolvimentos Tecnológicos para a Descarbonização das Operações, que compare baseline e cenário com solução por unidade funcional, trate ciclo de vida e emissões não operacionais separadamente do operacional, represente escopos 1, 2, 3 e emissões evitadas sem dupla contagem entre tecnologias concorrentes, aceite intervalos em vez de valores únicos com premissas documentadas e análise de cenários, distinga potencial técnico de potencial acordado com ramp-up, e seja rastreável, versionada, reproduzível e auditável. Lemos o requisito 5 (“aceita intervalos em vez de valores únicos”) e o requisito 8 (“resultados reproduzíveis e auditáveis”, “controle de versão de cenários e hipóteses”) como o centro do pedido: um número de abatimento é uma decisão de investimento quando se sabe para que premissas ele vale, e é auditável quando se refaz.'));
  S.push(p('O contexto público: o Caderno de Mudanças Climáticas e Transição Energética 2025 da Petrobras organiza mais de ' + br.int(pb.macc) + ' oportunidades de mitigação na Curva MAC Integrada, em cinco categorias, classificadas por potencial de abatimento em três faixas (Incremental 0–100 mil; Moderado 100 mil–1 milhão; Alto &gt; 1 milhão tCO₂e/ano), e aloca o Fundo de Descarbonização (US$ ' + esc(pb.fundoUSD) + ' em 2026–30; 35 oportunidades e ' + esc(pb.fundoMt) + ' tCO₂e/ano em 2025) por custo marginal de abatimento e quantidade total de GEE abatida [1]. Os projetos são publicados como pontos (“aproximadamente ' + br.int(pb.tbgClaim) + ' tCO₂e/ano”).'));
  S.push(h('3', 'Solução proposta'));
  S.push(p('<b>O registro.</b> Cada cenário é um registro versionado: fonte emissora (com a sua emissão anual declarada), categoria da MACC, premissas como faixas com unidade, descrição e fonte (tabelas públicas pinadas por sha256 — IPCC 2006, GHG Protocol, MCTI/SIN — ou a planilha, a medição, o estudo de ACV), a fórmula do abatimento como soma assinada de produtos de premissas, a implantação técnica e a acordada por ano como frações, e a afirmação publicada. O registro é append-only; cada entrada e cada fonte têm sha256.'));
  S.push(p('<b>O núcleo.</b> A fórmula é multilinear (cada premissa não negativa, uma vez por termo), de modo que os extremos do abatimento sobre o envelope das premissas estão nos cantos do envelope — um teorema, não uma amostra. O núcleo enumera os cantos em aritmética racional exata (inteiros de precisão arbitrária) e devolve o intervalo garantido com os cantos que o realizam (testemunhas). Decide então: a classe de potencial contra os limiares declarados (PROVADO se o intervalo cabe inteiro na faixa; REFUTADO se fica inteiro fora; RECUSADO se atravessa um limiar); a compatibilidade da afirmação publicada (dentro ou fora do intervalo); a soma por níveis, recusando tecnologias declaradas mutuamente exclusivas sobre a mesma fonte e somas que excedem a emissão da fonte; o diff entre versões. Para cada cenário calcula a parcela da largura do intervalo que cada premissa explica e o preço da informação: a premissa a medir, com que erro, para que a classe fique decidida, por bisseção exata.'));
  S.push(p('<b>A face de revisão.</b> Para cada versão: as premissas, o intervalo, as classes, a sensibilidade, as notas de revisão presas à versão, o diff para a anterior e o registro de cálculo de uma página com o comando que o refaz. Relatórios e apresentações são gerados dos registros, nunca o contrário: um número que perdeu o seu registro não é impresso.'));
  S.push(p('<b>Verificação independente.</b> Uma segunda implementação em Python (biblioteca padrão, frações, sem código em comum com o núcleo) recalcula intervalos e classes de todas as versões antes de qualquer publicação; falsificações declaradas (faixa invertida, premissa negativa, premissa repetida, implantação acima de 1, afirmação uma unidade fora, limiar uma unidade dentro, exclusivas somadas, soma maior que a fonte, o ponto médio que inventa uma classe) devem ser recusadas em toda construção.'));
  S.push(p('<b>Fronteiras, ditas aqui.</b> O sistema não calcula análise de ciclo de vida nem inventário: a ACV entra como faixa declarada com o estudo pinado, marcada como tal e somada à parte do operacional. Fórmulas que não são multilineares (razões com premissas compartilhadas, curvas de desempenho) entram por aritmética intervalar com arredondamento para fora — um intervalo garantido, não necessariamente o mais apertado, marcado “intervalo externo”. O escopo 3 entra por categorias, como faixas declaradas.'));
  S.push(h('4', 'Aderência requisito a requisito'));
  S.push(tbl(['requisito do edital', 'como a solução o atende', 'estado'], [
    ['1 · apoio à decisão em descarbonização (não inventário); alinhado à decisão de investimento e ao roadmap; gera relatório', 'o objeto é a decisão sobre cada potencial (classe, afirmação, soma, ranking) e o seu registro; relatórios gerados dos registros', 'demonstrado'],
    ['2 · baseline × cenário com solução; potencial relativo a cenários; unidade funcional; transparência no escalonamento', 'fórmula como diferença declarada por unidade funcional, em termos assinados; implantação técnica e acordada como frações por ano', 'demonstrado; E1 para os cenários da Petrobras'],
    ['3 · ciclo de vida; emissões incorporadas; cradle-to-grave; separação operacional/ACV; fronteiras transparentes e ajustáveis', 'termos “ACV” com o estudo pinado, somados à parte; fronteiras e premissas são o próprio registro', 'E3'],
    ['4 · escopos 1, 2, 3 e evitadas; escopo 3 flexível; sem dupla contagem entre tecnologias concorrentes; níveis tecnologia → Petrobras', 'escopo por termo; soma exata por nível com auditoria de exclusividade e de excesso sobre a fonte', 'demonstrado (quatro agregações); E2 para os níveis'],
    ['5 · TRL, incerteza e tecnologias emergentes: aceita intervalos; premissas documentadas; cenários e sensibilidade; detalhe conforme o TRL', 'toda premissa é um intervalo com fonte; a decisão vale para o intervalo inteiro; parcela da largura por premissa; preço da informação', 'demonstrado'],
    ['6 · potencial técnico máximo vs acordado; a diferença; ramp-up temporal', 'quadro de implantação (técnica e acordada) por ano, cada um um intervalo', 'demonstrado'],
    ['7 · alinhamento com dados do roadmap; nível de caixa-preta aceitável', 'caixa aberta por construção (fórmula, premissas e comando em cada registro); os dados do roadmap entram como premissas nas unidades da Petrobras, no ambiente da Petrobras', 'E1, E4, E5'],
    ['8 · premissas rastreáveis; controle de versão de cenários e hipóteses; reproduzível e auditável; revisões e discussões técnicas', 'registro append-only com sha256; diff entre versões; segunda implementação; registro de cálculo; notas de revisão presas à versão', 'demonstrado; E4 para as notas']
  ]));
  S.push(h('5', 'O que já existe (demonstrador público)'));
  S.push(p('Em carlostoledo.co/abatimento, ' + N.versoes + ' versões de ' + N.cenarios + ' cenários sobre ' + N.fontes + ' fontes emissoras, com fatores físicos de tabelas públicas pinadas (IPCC 2006 com limites de 95%; GWP AR5/AR6 do GHG Protocol; fator do SIN do MCTI) e dados de atividade ilustrativos, marcados como tal. Resultados: a eletrificação das ECOMPs da TBG, com as premissas que um engenheiro declararia, tem intervalo [' + br.int(tbg.lo1) + '; ' + br.int(tbg.hi1) + '] tCO₂e/ano — a afirmação publicada (' + br.int(pb.tbgClaim) + ') é compatível e a classe atravessa 100 mil (RECUSADO), enquanto o ponto médio das premissas (' + br.int(tbg.mid) + ') “cairia” em Moderado; medido o gás deslocado (v2), o intervalo é [' + br.int(tbg.lo2) + '; ' + br.int(tbg.hi2) + '] e a classe é PROVADO Moderado. A soma de captura por amina e oxicombustão sobre o mesmo FPSO é RECUSADA por dupla contagem; a de usina solar e I-REC sobre o mesmo escopo 2 também. A bateria executa ' + N.battery.checks + ' verificações, recusa ' + N.battery.fired + ' de ' + N.battery.reds + ' falsificações, e a segunda implementação concorda em ' + N.battery.refVersions + ' de ' + N.versoes + ' versões. Cada versão é re-decidida no navegador do leitor e comparada com o registro publicado.'));
  S.push(h('6', 'Plano de trabalho (12 meses)'));
  S.push(tbl(['entrega', 'meses', 'conteúdo', 'critério de aceitação'], [
    ['E1 · esquema e importação', '1–3', 'esquema do cenário nas unidades e categorias da MACC; importação de planilhas e do roadmap (CSV/Excel) para registros versionados; 20 cenários reais registrados com as áreas', 'os 20 cenários re-decididos pela segunda implementação sem divergência; cada premissa com fonte'],
    ['E2 · agregação por níveis e dupla contagem', '3–5', 'tecnologia → iniciativa → portfólio → área → Petrobras como somas exatas; declaração de exclusividade e de fonte emissora; auditoria de excesso', 'nenhuma soma publicada sem auditoria; os casos de exclusividade levantados com o Programa Carbono Neutro recusados'],
    ['E3 · ACV, escopo 3 e fórmulas não multilineares', '4–7', 'termos “ACV” com o estudo pinado; escopo 3 por categorias; aritmética intervalar para razões e curvas, marcada “intervalo externo”', 'a separação operacional/ACV visível em todo registro; nenhum termo ACV somado ao operacional'],
    ['E4 · face de revisão', '5–8', 'diff entre versões; notas de revisão presas à versão; sensibilidade e preço da informação; relatórios e apresentações gerados dos registros', 'um revisor do CENPES refaz um registro a partir do PDF sem contato conosco'],
    ['E5 · implantação no ambiente da Petrobras', '7–10', 'contêiner e repositório no ambiente da Petrobras; nenhuma dependência de nuvem do proponente; carimbo de tempo externo opcional (RFC 3161)', 'o sistema roda e refaz os registros no ambiente da Petrobras'],
    ['E6 · auditoria e entrega', '10–12', 'rerun independente pelo CENPES com o kit; manual; treinamento; plano de fornecimento em escala', 'o rerun do CENPES reproduz cada número publicado; aceite formal']
  ]));
  S.push(p('<b>Marcos.</b> M0 kick-off e acesso aos cenários; M3 os 20 cenários registrados (portão: a segunda implementação concorda); M6 agregação por níveis (portão: somas auditadas); M9 face de revisão e contêiner no ambiente da Petrobras; M12 rerun do CENPES. Um portão vermelho para o cronograma até ficar verde.'));
  S.push(h('7', 'Equipe e maturidade'));
  S.push(p('TRL 4, CRL 3. O núcleo aritmético (racionais exatos, intervalos com arredondamento para fora, decisor de três palavras, registro append-only, segunda implementação independente) está em produção pública desde agosto de 2026 em três aplicações do mesmo motor: Contraprova (números de engenharia de injeção e valores de projeto metoceânicos), Decidível (detectabilidade de sísmica 4D sobre caixas inteiras) e Janela (janelas operacionais offshore sobre bandas de erro medidas por satélite, com livro-razão graduado diariamente). Equipe: Carlos Toledo, fundador — design industrial, direção de arte e desenvolvimento; ex-EmbraerX. Um parceiro acadêmico para ACV e inventários será nomeado quando concordar em sê-lo. Verificação independente é o posicionamento: nenhum código é compartilhado com quem propõe o número.'));
  S.push(h('8', 'Riscos e mitigação'));
  S.push(tbl(['risco', 'efeito', 'mitigação'], [
    ['fórmulas não multilineares', 'a regra dos cantos não vale', 'aritmética intervalar com arredondamento para fora, marcada “intervalo externo” (E3)'],
    ['premissas sem fonte ou sem faixa', 'envelope degenerado', 'o esquema exige faixa e fonte; um ponto é uma faixa de largura zero, marcada'],
    ['ACV inexistente para a tecnologia', 'termo em aberto', 'SEM DADOS explícito, com o estudo que o fecharia'],
    ['exclusividades não declaradas', 'dupla contagem silenciosa', 'fonte emissora obrigatória; a auditoria de excesso pega a soma que ultrapassa a fonte'],
    ['adoção (“parece um inventário”)', 'avaliação pelo critério errado', 'o objeto é a decisão, dito na primeira linha; o inventário é uma entrada'],
    ['equipe de um fundador', 'continuidade', 'código aberto (MIT), kit de rerun, segunda implementação independente; parceiro acadêmico cotado']
  ]));
  S.push(h('9', 'Modelo de negócio e implantação'));
  S.push(p('Fase de PD&I: o contrato de inovação de doze meses (CPSI) com os cenários reais do Programa Carbono Neutro, no ambiente da Petrobras. Depois: licença de uso com manutenção e evolução anual (novas categorias e limiares da MACC, novas fontes pinadas, novas unidades), e o registro de cálculo como anexo dos relatórios regulados (SBCE, relatórios de sustentabilidade). Escalabilidade: o mesmo registro serve às oportunidades de E&P, Refino, Gás e Energia e às futuras do mercado regulado. Critério de implantação ao final: um engenheiro do CENPES abre um registro, altera uma premissa, lê o novo veredito com as testemunhas, imprime o registro de cálculo, e um colega o refaz com o comando — sem o proponente na sala.'));
  S.push(h('10', 'Propriedade intelectual, dados e segurança'));
  S.push(p('O núcleo é software livre já publicado (MIT); o que for desenvolvido no projeto segue a regra do módulo Aquisição de Soluções. Os dados da Petrobras não saem do seu ambiente: o sistema roda em contêiner no ambiente da Petrobras, sem dependência de nuvem do proponente. Nenhum dado da Petrobras consta do demonstrador público; os dados de atividade ali são ilustrativos e assim marcados.'));
  S.push(h('11', 'Proposta comercial'));
  S.push(p('<span class="fill">[A PREENCHER PELO PROPONENTE: valor global do contrato de inovação (12 meses), cronograma físico-financeiro por entrega E1–E6, condições de pagamento por marco aceito, equipe alocada e dedicação, e o valor de referência da licença de uso e manutenção após o projeto.]</span>'));
  S.push(h('12', 'Referências'));
  S.push('<ol class="refs"><li>Petrobras. Caderno de Mudanças Climáticas e Transição Energética 2025 (edição de 2026; PDF criado em 13/05/2026; sha256 faab42c2…): compromissos p. 9 e 45; Curva MAC Integrada e Fundo de Descarbonização p. 51–52; Nota 1 das tabelas de ações p. 76, 86, 87; TBG p. 86; desempenho em carbono p. 116–118.</li>'
    + '<li>Petrobras, Conexões para Inovação, oportunidade 7004641677 — Sistema de cálculo de potencial de abatimento de emissões (Escopo 1 e 2 abrangendo Emissões Evitadas, Escopo 3 e ACV) de portifólio de Centro de Pesquisas e Desenvolvimentos; Petronect, recebimento de propostas de 16/09/2026 a 19/10/2026 17:00.</li>'
    + '<li>IPCC. 2006 IPCC Guidelines for National Greenhouse Gas Inventories, Vol. 2, Ch. 2, Table 2.2 (sha256 a25d9f96…).</li>'
    + '<li>MCTI/SIRENE. Fatores médios mensais de emissão de CO₂ do SIN, 2025; nota técnica da revisão metodológica de 2025 (valores lidos em fonte secundária nesta versão; o arquivo oficial entra pinado no piloto).</li>'
    + '<li>GHG Protocol. Global Warming Potential Values (August 2024) (sha256 5f0bbd46…).</li>'
    + '<li>WRI. Estimating and Reporting the Comparative Emissions Impacts of Products (2019).</li>'
    + '<li>IEEE 1788-2015, Standard for Interval Arithmetic; Moore, Kearfott &amp; Cloud, Introduction to Interval Analysis (SIAM, 2009).</li></ol>');
  /* a print document: black on white, overriding the dark tokens the screen pages use */
  const css = T.rootCss() + `
:root{--paper:#fff;--ink:#111;--ink-2:#222;--ink-3:#444;--ink-4:#666;--ink-5:#888;--rule:#d9d9d9;--rule-strong:#bdbdbd;--surface:#f6f6f6;--surface2:#eee;--sunk:#fafafa}
*{box-sizing:border-box}
html,body{margin:0;background:#fff;color:var(--ink);font-family:var(--f-sans);-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{padding:0 0 10mm;font-size:10.2px;line-height:1.45}
header{border-bottom:1px solid var(--ink);padding-bottom:8px;margin-bottom:10px}
.ey{font-family:var(--f-mono);font-size:7.8px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-4);margin-bottom:8px}
h1{font-size:17px;line-height:1.22;letter-spacing:-.02em;font-weight:560;margin:0 0 8px}
.meta{font-family:var(--f-mono);font-size:7.6px;color:var(--ink-4)}
h2{font-size:11px;font-weight:600;margin:12px 0 4px;color:var(--ink);page-break-after:avoid}
p{margin:0 0 6px;color:var(--ink-2)}
b{color:var(--ink);font-weight:600}
table{border-collapse:collapse;width:100%;margin:4px 0 8px;page-break-inside:auto}
tr{page-break-inside:avoid}
th{font-family:var(--f-mono);font-size:7.6px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-4);text-align:left;font-weight:500;padding:4px 5px;border-bottom:1px solid var(--ink)}
td{padding:4px 5px;border-bottom:1px solid var(--rule);vertical-align:top;color:var(--ink-2);font-size:9.4px;line-height:1.35}
td:first-child{color:var(--ink)}
.fill{font-style:italic;color:var(--ink-3)}
ol.refs{margin:0;padding-left:16px;color:var(--ink-2);font-size:9.2px}
ol.refs li{margin:0 0 3px}
`;
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Registro de Abatimento — Proposta Técnica (CPSI 7004641677)</title><link rel="stylesheet" href="' + T.GOOGLE_FONTS + '"><style>' + css + '</style></head><body>' + S.join('\n') + '</body></html>';
}

async function print(html, outPath) {
  const { withChrome, settle } = require(path.join(ROOT, 'design', 'cdp.js'));
  const tmp = path.join(os.tmpdir(), 'abatimento-proposta-' + process.pid + '-' + Date.now() + '.html');
  fs.writeFileSync(tmp, html);
  try {
    await withChrome(async (send) => {
      await send('Page.enable'); await send('Page.navigate', { url: 'file://' + tmp }); await settle(3000);
      await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(()=>1)', awaitPromise: true });
      const pdf = await send('Page.printToPDF', { printBackground: true, paperWidth: 8.27, paperHeight: 11.69, displayHeaderFooter: true, headerTemplate: '<span></span>',
        footerTemplate: '<div style="font-size:8px;width:100%;padding:0 12mm;display:flex;justify-content:space-between;font-family:monospace;color:#777"><span>Registro de Abatimento · Proposta Técnica · CPSI 7004641677 · carlostoledo.co/abatimento</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
        marginTop: 0.6, marginBottom: 0.7, marginLeft: 0.7, marginRight: 0.7, preferCSSPageSize: false });
      fs.writeFileSync(outPath, Buffer.from(pdf.data, 'base64'));
    }, { port: 9242 });
  } finally { fs.unlinkSync(tmp); }
  return outPath;
}
module.exports = { build, print };
