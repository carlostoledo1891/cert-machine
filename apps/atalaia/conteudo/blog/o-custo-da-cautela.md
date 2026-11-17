---
titulo: "O custo da cautela"
data: 2026-11-16
resumo: "Numa semana sintética, 56 das 111 saídas que o Atalaia reteve teriam chegado. Publicamos esse número de propósito: dizer o que recusamos, e por quê, é parte do produto."
fontes:
  - t: "Atalaia, minuta do protocolo v0.5, seção 9 (a semana sintética e o custo da cautela)"
    u: "/atalaia/doutrina/"
  - t: "Atalaia Núcleo, seções 4, 8 e 9 (o carrossel, o protótipo e o G0)"
    u: "/atalaia/nucleo/"
  - t: "Atalaia, página de entrada (o caso da Costa da Lagoa)"
    u: "/atalaia/"
---

Toda tecnologia de segurança vende as situações perigosas que evita. A outra metade da conta aparece bem menos: a indisponibilidade que ela causa. Um sistema que segura toda missão nunca deixa um drone cair, e também nunca entrega nada. O Atalaia mede as duas coisas e publica as duas, e a segunda tem nome: o custo da cautela.

## A semana sintética

Para medir, montamos uma semana sintética de frota: 210 saídas de uma base, com o destino a uma distância de 2 a 11 km, carga de 5 a 30 kg e previsão de vento sorteadas. Antes de cada voo, a Central decidiu: liberou 75, esperou dado em 111 e recusou 24. Depois, um simulador voou cada uma, com um drone e um vento também sorteados.

O resultado, em três linhas:

- Das 75 liberadas, nenhuma pousou abaixo da reserva, nem a única em que o vento passou da previsão.
- Das 24 recusadas, nenhuma teria chegado.
- Das 111 que esperaram dado, **56 teriam chegado com reserva.**

Esse 56 de 111 é o custo da cautela. Metade das saídas retidas era, na verdade, voável. Quem publicasse só a linha de cima diria "zero falhas" e estaria certo. Estaria também escondendo o número que o cliente vai sentir na operação.

Duas ressalvas, porque elas importam. É simulação: dentro das premissas, uma saída liberada não falha por construção, porque a decisão é aritmética sobre o pior caso. O teste confere as contas e mede o custo da cautela; o comportamento do drone, da bateria e do vento reais só se mede em campo. E a semana é sintética: as distâncias, as cargas e os ventos foram sorteados, não tirados de uma operação real.

## Por que o falta dado não é um defeito

O Atalaia decide em três estados: ✓ PASSA, × NÃO PASSA e ∅ FALTA DADO. O terceiro é o que gera o custo, e é também o que o torna honesto. Um falta dado nunca é um não genérico: ele nomeia a medida que decidiria. Numa missão de ressuprimento a uma comunidade só acessível por barco ou trilha, por exemplo, o veredito diz o que falta: o consumo real com carga, o gasto na subida e a saúde das baterias. São coisas que voos de calibração medem.

Por isso o custo da cautela é uma métrica central da pesquisa, e não um efeito colateral. Cada etapa da qualificação relata as duas coisas, e os voos de calibração serão avaliados pelo quanto reduzem esse custo sem liberar nenhuma saída que não chegaria.

## Onde mais publicamos o que recusamos

O 56 de 111 não é um caso isolado. É o hábito do projeto.

**O portão de simulação não passou como escrito, e dissemos.** O critério do G0 exigia que um controle vermelho, uma declaração errada de propósito, escapasse da região em todos os voos simulados. Na rodada inicial, escapou só em 4 de 8. Escrevemos um vermelho mais forte, selado antes de rodar, e uma previsão do que ia acontecer. A previsão errou em dois voos, e o vermelho escapou em 6 de 8. O G0 passou por uma emenda datada, feita depois de ler os números e rotulada como emenda. Os voos que não serviram continuam nos registros, com o resultado de cada rodada.

**O laudo da bancada diz o que o equipamento não afirma.** No ensaio em simulação com o firmware real do ArduPilot, o piloto automático sozinho recebeu ∅ FALTA DADO na contenção e na conduta, porque não declara região nem conduta. Ele alarmou, e no arrasto alarmou antes da caixa: 14,9 s contra 46,0 s, porque a região de 100 m custa tempo. O laudo registra as duas coisas.

**Uma conta no papel mudou o produto do mar.** A região absoluta sem GNSS de um navio em águas profundas ficou em 10 a 18 m, contra um limite de alerta de 2 a 5 m: o portão absoluto não passa. Dissemos isso, e o produto do mar passou a ser o portão relativo à instalação, que fica em cerca de 3,6 a 3,8 m contra 5 m.

**A medição derrubou um modelo.** A versão inicial do modelo de autonomia dizia que um sensor inercial MEMS, com giros lentos e alternados do drone, superaria um sensor tático sem eles. A simulação mostrou que a inclinação de cruzeiro vaza o viés do giroscópio vertical, e a afirmação caiu. A página diz qual era o número antigo e por que ele saiu.

## Por que isso é produto

Quem compra integridade compra o direito de ouvir um não. Um verificador que nunca recusa é decorativo: é compatível com o sistema estar certo e igualmente compatível com o teste não testar nada. É por isso que cada bateria do Atalaia leva controles vermelhos, falsificações plantadas que precisam ser pegas. No registro, 53 de 53 erros plantados foram pegos em bancada. No laudo de ensaio, um veredito falsificado, um número falsificado e um falso alarme plantado foram todos pegos por um verificador escrito à parte.

Um cliente que vê o custo da cautela antes de comprar sabe o que está comprando. Um cliente que só descobre depois perde a confiança no voo retido sem explicação. O Atalaia prefere que a conversa difícil aconteça na página, com o número na mesa.

Preparado por Carlos Toledo, com ajuda de IA (Claude) na pesquisa e na redação.
