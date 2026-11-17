---
titulo: "Um limite, não uma estimativa"
data: 2026-11-16
resumo: "Todo navegador responde onde o veículo está. O Atalaia responde quanto essa posição pode estar errada agora, no pior caso, de um jeito que outra parte recalcula."
fontes:
  - t: "Atalaia Núcleo: a camada de integridade, versão 0.4"
    u: "/atalaia/nucleo/"
  - t: "Atalaia, minuta do protocolo v0.5, seção 9 (resultados com o estágio de cada um)"
    u: "/atalaia/doutrina/"
  - t: "Drevelle e Bonnifait, domínios de confiança por inversão de conjuntos, IEEE T-RO, 2013"
    u: "https://doi.org/10.1109/TRO.2013.2262776"
  - t: "Mina, Kanhere, Kousik e Gao, o GPS conferido contra o alcançável do sensor inercial, NAVIGATION, 2023"
    u: "https://doi.org/10.33012/navi.616"
  - t: "Liu, Wang e Abel, níveis de proteção com zonotopos, GPS Solutions, 2023"
    u: "https://doi.org/10.1007/s10291-023-01447-z"
  - t: "Le Bars e outros, navegação inercial por intervalos num barco autônomo, 2022"
    u: "https://doi.org/10.3389/fcteg.2021.786188"
  - t: "Zhu e outros, nível de proteção determinístico para odometria LiDAR-inercial, arXiv 2605.09383"
    u: "https://arxiv.org/abs/2605.09383"
---

Pergunte a um navegador de drone onde ele está, e ele responde com um ponto. Os bons acompanham o ponto de um número: o erro médio quadrático, o círculo que contém metade das posições, a parte do voo dentro de uma tolerância. São números honestos sobre o desempenho típico, e respondem a uma pergunta de engenharia: quão bom isto costuma ser?

Quem precisa decidir se uma missão segue faz outra pergunta: quão errado isto pode estar agora? Quando o sinal de satélite pode estar sendo falsificado, a pergunta fica mais dura, porque um falsificador não é ruído. Ele escolhe o pior momento, e uma média, por melhor que seja, não diz nada sobre ele.

O Atalaia foi desenhado em torno dessa segunda pergunta.

## A posição é uma região

A ideia cabe numa frase: a posição é uma região, não um ponto. Cada sensor do veículo tem um limite de erro declarado: o inercial, a câmera, o relevo sob ele, a altura sobre o chão. O Atalaia calcula a região onde o veículo certamente está se cada sensor ficar dentro do seu limite. Chamamos isso de região de proteção.

O detalhe que muda tudo é o que fica de fora. A região é calculada sem o GNSS, o sinal de satélite. O GNSS continua sendo usado, mas como um candidato que precisa passar por um portão: a posição do satélite só é aceita se cair dentro da região, alargada por uma margem pequena. Se cair fora, ela é declarada falsa, e a caixa alarma, aponta a fonte e troca a fonte do estimador, segura ou pousa, como foi combinado antes da missão.

Como a região foi feita sem o GNSS, o atacante não tem como arrastá-la. O erro que ele consegue esconder fica limitado à largura da região mais a margem, seja qual for o ataque. Essa desigualdade está provada em Lean 4.35.0, com a Mathlib, usando só os axiomas padrão. O limite também é justo: um atacante que conheça a região pode pôr a posição falsa na borda oposta. Cada metro tirado da região é, portanto, um metro a menos que qualquer atacante consegue esconder, e o trabalho de engenharia passa a ser um só: encolher a região sem trapacear.

Se a região ficar vazia, alguma hipótese falhou: um sensor passou do limite declarado. Retirar uma fonte de cada vez aponta qual.

## O que não é nosso

A estimação por conjuntos é um campo estabelecido, e convém dizer quem chegou antes. A região vazia que acusa uma fonte falsa está em Jaulin, em 2009. Drevelle e Bonnifait tiram domínios de confiança da localização por inversão de conjuntos desde 2013. Su, Schön e Joerger propuseram um detector GNSS por conjuntos em 2023. Mina e coautores conferem o GPS contra o conjunto alcançável do sensor inercial. Liu, Wang e Abel calculam níveis de proteção com zonotopos. Le Bars e coautores fazem navegação inercial por intervalos num barco autônomo. Um preprint de 2026 dá um nível de proteção determinístico para odometria LiDAR-inercial.

O que não encontramos, juntos, são quatro coisas: os vieses do sensor inercial dentro do estado da região, a prova verificada por máquina, um registro que outra parte refaz e um portão que só aceita a correção de fora dentro de uma região construída sem ela. É ausência nas buscas, não prova de que não exista. É essa combinação que construímos e medimos.

## Os números, com o estágio de cada um

Nenhum voo real ainda. O que existe: a posição real ficou dentro da região em 24.300 de 24.300 verificações de 45 voos simulados de 45 minutos sobre relevo e imagens reais, com instantes correlacionados, que não contam como experimentos independentes. Num protótipo do estimador de conjunto, rodado sobre o sensor inercial de 8 voos simulados no ArduPilot, a posição real ficou dentro da região em todas as épocas, nos três modelos de ruído, e a região saiu até 3 vezes mais justa que uma caixa de intervalos com os mesmos limites. Tudo simulação, com o firmware real.

## Por que um limite vende

Um limite permite decidir. Se a região mais a margem cabe no limite de alerta da fase, ✓ PASSA. Se não cabe, × NÃO PASSA. Se uma fonte não tem limite declarado, ∅ FALTA DADO, e o veredito nomeia o dado que decidiria. Um limite também pode ser recalculado: cada leitura é assinada na captura e encadeada, e um verificador escrito por outra parte refaz cada decisão.

Há um custo, e ele é publicado. Um limite garantido é mais largo que uma estimativa típica. Com sensor inercial de consumo, a garantia se perde em cerca de 3 minutos sem GNSS. Em relevo plano, o relevo não ajuda. Sobre a água, o protocolo recusa a missão. Numa semana sintética de 210 saídas, 56 das 111 retidas por falta de dado teriam chegado. É o preço de não chutar, e ele cai à medida que voos de calibração medem o que falta.

Por fim, o Atalaia não substitui o navegador: ele o julga. O estimador do ArduPilot, um produto de visão, a posição de um fabricante, todos viram propostas que o portão aceita ou recusa. O que o Atalaia acrescenta é a resposta que faltava: quanto a posição pode estar errada agora, e a prova.

Preparado por Carlos Toledo, com ajuda de IA (Claude) na pesquisa e na redação.
