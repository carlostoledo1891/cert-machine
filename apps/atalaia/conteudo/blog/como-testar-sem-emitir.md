---
titulo: "Como testar sem emitir"
data: 2026-11-16
resumo: "Para saber o que um receptor, um piloto automático ou uma máquina fazem quando o GNSS mente, é preciso atacá-los. A bancada de testes do Atalaia faz isso sem emitir um único sinal, e entrega um laudo lacrado que outra parte refaz."
fontes:
  - t: "Anatel, Resolução nº 760/2023 (bloqueadores de sinais)"
    u: "https://informacoes.anatel.gov.br/legislacao/resolucoes/2023/1842-resolucao-760"
  - t: "Anatel, Resolução nº 775/2025 (uso temporário; exclui o teste de bloqueador)"
    u: "https://informacoes.anatel.gov.br/legislacao/resolucoes/2025/2025-resolucao-775"
  - t: "Lei nº 9.472/1997 (LGT), art. 162"
    u: "https://www.planalto.gov.br/ccivil_03/leis/l9472.htm"
  - t: "ANAC, RBAC nº 100, 100.107(a)(2)"
    u: "https://pergamum.anac.gov.br/arquivos/RBAC100EMD00.pdf"
  - t: "ISO 18497-4:2024, amostra com o sumário"
    u: "https://cdn.standards.iteh.ai/samples/82688/9e77c86a5bb84b87859f194af2752999/ISO-18497-4-2024.pdf"
  - t: "IMCA Information Note 1730, abril de 2026"
    u: "https://www.imca-int.com/resources/technical-library/in-1730-gnss-jamming-and-spoofing-operational-impacts-and-mitigation-for-dynamic-positioning-dp/"
  - t: "Converge Digest, a Keysight conclui a compra da Spirent"
    u: "https://convergedigest.com/keysight-completes-1-16-billion-acquisition-of-spirent-communications/"
  - t: "Skydel (Safran, ex-Orolia)"
    u: "https://www.4test.no/Orolia-Skydel.htm"
  - t: "Rohde & Schwarz, simulação GNSS"
    u: "https://www.rohde-schwarz.com/br/_56279-610109.html"
  - t: "IABG, white paper sobre sistemas GNSS robustos, dez/2025"
    u: "https://www.iabg.de/fileadmin/Daten/06_MEDIATHEK/04_Veroeffentlichungen/CT_Digitalisierung/2025-12_Whitepaper-Robuste-GNSS-Systeme-EN.pdf"
  - t: "Fraunhofer IIS, ambiente de teste"
    u: "https://www.iis.fraunhofer.de/en/ff/lv/lok/leist/test/over-the-air-testumgebung.html"
  - t: "Statens vegvesen, Jammertest 2026"
    u: "https://www.vegvesen.no/om-oss/presse/aktuelt/2026/09/jammertest-2026/"
  - t: "BSI, EN 16803 (avaliação de segurança de terminais GNSS)"
    u: "https://knowledge.bsigroup.com/products/space-use-of-gnss-based-positioning-for-road-intelligent-transport-systems-its-assessment-of-security-performances-of-gnss-based-positioning-terminals"
---

Um fabricante de drone quer saber o que o seu piloto automático faz quando o GNSS começa a mentir. Um fabricante de máquina agrícola quer mostrar que a máquina não sai da cerca quando perde a correção de precisão. Um operador de embarcação quer conferir o GNSS contra as outras referências antes de confiar nele. Os três precisam da mesma coisa: atacar o equipamento de propósito, de um jeito controlado, e registrar o que aconteceu.

O caminho óbvio é irradiar o ataque. No Brasil, ele está fechado, e com razão. A Resolução nº 760/2023 da Anatel veda a posse e o emprego de bloqueadores por quem não é usuário público listado, e a autorização temporária de uso de radiofrequências exclui expressamente o teste de bloqueador. Lá fora, quem ensaia no ar o faz sob licença do regulador: a IABG, na Alemanha, transmite sinais controlados dentro do seu campus com autorização da agência federal; o Jammertest, na Noruega, é um evento aberto que em 2026 reuniu 310 participantes de 127 organizações de 28 países; o Fraunhofer IIS oferece um ambiente protegido para testar receptores. O equipamento de laboratório é um mercado maduro: a Keysight, que absorveu a Spirent em outubro de 2025, a Safran, com o Skydel, e a Rohde & Schwarz.

A bancada do Atalaia parte de outra pergunta: quanto dá para testar sem emitir nada?

## Três camadas, da mais barata à mais cara

**Domínio da posição.** O GNSS falso entra como posição no piloto automático, que roda em simulação com o firmware real. Sem rádio e sem cabo. Esta camada existe, e já produziu um laudo.

**Domínio do sinal, em software.** Gravações públicas de sinais atacados passam por um receptor em software, que roda como programa à parte. Também sem emissão. Cada gravação só entra depois de lida a licença. Esta camada está preparada, não construída.

**Por cabo, com o sinal confinado.** Um gerador ligado por cabo ao receptor físico, sem antena. Pela lei, o sinal confinado num cabo não é radiocomunicação; mas a lei também veda emissor de radiofrequência sem homologação, e a regra dos bloqueadores pode alcançar o gerador. Por isso esta camada espera um parecer jurídico e um portão de compra próprio. Um gerador de bloqueio com saída de antena não existe no projeto, nunca.

## O laudo inaugural

Em 16/11/2026, a bancada rodou o seu catálogo inicial no ArduCopter 4.7.2 em simulação, numa missão de cerca de 4,4 km até um posto nos morros. Três ensaios: nominal, sem ataque; arrasto, com o GNSS puxado 2 m/s para o lado a partir de 35% da ida; e salto, com o GNSS deslocado 300 m de uma vez. Dois equipamentos sob teste: o ArduPilot sozinho e o ArduPilot com a caixa do Atalaia, emulada.

O laudo mede cinco itens, cada um com ✓ PASSA, × NÃO PASSA ou ∅ FALTA DADO, e o critério de cada um foi escrito antes: contenção, alarme, falso alarme, conduta e desfecho. Os resultados, todos de simulação:

- Sob arrasto, o ArduPilot sozinho alarmou em 14,9 s, antes da caixa, que alarmou em 46,0 s, mas pousou a 585,7 m do posto. Com a caixa, o pouso ficou a 1,8 m.
- Sob salto, 300,0 m sem a caixa e 0,8 m com ela.
- No ensaio nominal, nenhum falso alarme em 600 s nos dois.
- O ArduPilot sozinho recebeu ∅ FALTA DADO na contenção e na conduta, porque não declara região nem conduta. É o ponto da bancada: ela diz também o que o equipamento não afirma.

O catálogo foi escrito antes de qualquer execução. Um verificador escrito à parte refez os 30 itens a partir do registro bruto e chegou aos mesmos vereditos. Três controles vermelhos foram plantados de propósito: um veredito falsificado, um número falsificado e um falso alarme inserido no meio do ensaio nominal. Todos foram pegos.

## O que o laudo ainda não mostra

O próprio laudo diz. A caixa é emulada: a sua estimativa é a verdade do simulador mais um erro sorteado, então a contenção dela passa por construção, e o que se mede é o protocolo do lado do piloto automático. O falsificador é ingênuo: desloca a posição e deixa a velocidade verdadeira, e é por isso que o estimador do ArduPilot percebe o arrasto. O terreno é plano, e a aeronave simulada não é um drone de carga. Houve uma execução por par, sem estatística de falso alarme.

## Para quem, e o que não dizemos

A bancada serve a fabricantes de drones e de pilotos automáticos, a fabricantes de máquinas agrícolas autônomas e a operadores de posicionamento dinâmico. Há ganchos: o RBAC nº 100 pede uma navegação com desempenho e confiabilidade suficientes, demonstrados de maneira aceitável pela ANAC; o Anexo D.2 da ISO 18497-4 descreve o teste de cerca virtual; a IMCA IN 1730 pede a conferência cruzada do GNSS. Mas nenhuma regra brasileira obriga esse ensaio hoje, e dizemos isso.

A gravação e a reprodução de ataques já estão em norma europeia, a EN 16803-2 e -3. O que não encontramos, nos serviços que lemos, é um laudo lacrado que uma terceira parte refaça a partir do pacote, com um veredito de contenção. É isso que a bancada vende: ensaio e laudo. Homologar equipamento continua sendo papel da Anatel, por organismos designados por ela.

Preparado por Carlos Toledo, com ajuda de IA (Claude) na pesquisa e na redação.
