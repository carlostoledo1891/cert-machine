# Nota ao Tesouro Nacional — duas convenções não documentadas na série histórica do Tesouro Direto (rascunho 2026-10-16; o envio é do operador)

Written for: the Tesouro Direto / Secretaria do Tesouro Nacional team that publishes the Tesouro Transparente dataset
"Preços e taxas dos títulos públicos ofertados no Tesouro Direto" (precotaxatesourodireto.csv). Portuguese, formal,
two findings and two concrete asks. Canal sugerido: o "Fale Conosco" do Tesouro Direto ou o e-mail do Tesouro
Transparente (dados abertos); o operador escolhe. Nada aqui afirma erro do publicador: as duas convenções são medidas
nos próprios dados e o pedido é que sejam documentadas.

---

Assunto: série histórica "Preços e taxas" do Tesouro Direto — duas convenções de cálculo que o conjunto de dados não
documenta (calendário de feriados vigente na cotação; precisão da taxa do Tesouro Selic)

Prezados,

Recalculei, em aritmética exata, todos os preços unitários publicados na série histórica do Tesouro Direto (Tesouro
Transparente, arquivo precotaxatesourodireto.csv, de 31/12/2004 a 15/10/2026: 77.053 linhas, 145.439 preços de compra e
venda de Tesouro Prefixado, Tesouro Prefixado com Juros Semestrais e Tesouro Selic) a partir da Metodologia de Cálculo dos
Títulos Públicos Federais (STN, 29/04/2024, Tabela 3), do calendário de feriados nacionais da ANBIMA e das séries 11 e
432 do SGS do Banco Central. O programa, o registro linha a linha e a pré-inscrição das hipóteses estão públicos em
https://carlostoledo.co/reports/pu-verificado.html e https://github.com/carlostoledo1891/cert-machine (MIT). 91,0%
dos preços reproduzem ao centavo o valor da metodologia; o restante se explica, em quase todos os casos, por duas
convenções que a metodologia e a documentação do conjunto de dados não registram. Escrevo para relatá-las e pedir que
sejam documentadas — não para afirmar erro: em ambos os casos o publicador foi coerente com a informação disponível no
dia.

**1. O calendário de feriados vigente no dia da cotação.** A Lei 14.759, de 21/12/2023, tornou 20 de novembro feriado
nacional. O arquivo de feriados da ANBIMA hoje distribuído o traz a partir de 2024, e todo recálculo feito hoje conta
esse dia como não útil. Mas 17.911 preços publicados antes de 26/12/2023, de títulos com vencimento posterior a 2024,
só se reproduzem quando o 20 de novembro de 2024 em diante é contado como dia útil — isto é, com o calendário em vigor
no dia da cotação (um dia útil a mais por 20 de novembro em dia de semana entre a liquidação e o vencimento). A última
cotação precificada no calendário antigo é a de 22/12/2023 e a primeira no calendário novo é a de 26/12/2023. O efeito
chega a quatro dias úteis para os vencimentos de 2029 e produz, para quem recalcula hoje, diferenças de dezenas de
centavos a alguns reais por título.

Pedido: registrar, na documentação do conjunto de dados (ou numa coluna), a versão do calendário de feriados usada em
cada cotação, ou ao menos a data em que o Tesouro Direto adotou o feriado de 20 de novembro no cálculo dos preços.

**2. A precisão da taxa publicada do Tesouro Selic.** O arquivo publica a taxa (ágio/deságio) do Tesouro Selic com duas
casas decimais, mas os preços publicados correspondem a uma taxa com mais casas: de 2020 em diante, 12.779 preços de
Tesouro Selic não reproduzem exatamente a taxa impressa, mas caem dentro do intervalo de preços que a meia-unidade da
última casa impressa permite (taxa ± 0,005 p.p.). Antes de 2020 os preços do Tesouro Selic reproduzem exatamente; de 2020 em
diante, nenhum preço de Tesouro Selic sai desse intervalo, mas quase nenhum se decide ao centavo.

Pedido: publicar a taxa do Tesouro Selic com as casas decimais efetivamente usadas no cálculo (a Tabela 3 trabalha com a
taxa truncada em seis casas), ou documentar se a taxa impressa é arredondada ou truncada.

Uma terceira observação, já documentada nos circulares da B3 e portanto apenas registrada aqui: a liquidação dos preços
segue o calendário da B3 (não liquida em 25 de janeiro, 9 de julho e 20 de novembro nos anos em que a bolsa os observou,
nem em 24 e 31 de dezembro), e não o calendário bancário nacional em que a metodologia conta os dias úteis. Uma linha a
respeito na documentação do conjunto de dados evitaria o mesmo trabalho a quem o reutilizar.

Todas as hipóteses testadas, os preços que não se reproduzem sob nenhuma delas (com valor exato e diferença) e os
controles negativos estão no registro público acima. Fico à disposição para detalhar qualquer item.

Atenciosamente,
Carlos Toledo
carlos@carlostoledo.co · https://carlostoledo.co

---
Antes de enviar: conferir 91,0% e 12.779 contra o certs/pu-ledger.json em vigor (o relatório os imprime; 2026-10-16: 132.362 de 145.439 e 12.779);
conferir a data da última cotação no arquivo; escolher o canal. A nota não cita a ANBIMA nem a B3 como destinatárias.
