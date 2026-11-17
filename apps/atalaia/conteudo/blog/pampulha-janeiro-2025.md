---
titulo: "Pampulha, janeiro de 2025"
data: 2026-11-16
resumo: "Um bloqueador no alto de um morro fez 21 aeronaves perderem o GPS sobre um aeroporto de Belo Horizonte. O que o caso ensina a quem opera drones e a quem vai precisar provar o que aconteceu."
fontes:
  - t: "Agência Gov (Anatel), operação desmonta fábrica clandestina de bloqueadores e relembra o caso da Pampulha, 15/09/2025"
    u: "https://agenciagov.ebc.com.br/noticias/202509/operacao-conjunta-desmantela-fabrica-clandestina-de-bloqueadores-de-sinais-em-sao-paulo"
  - t: "Convergência Digital, Anatel apreende equipamento clandestino que fez 21 aeronaves perderem o sinal de GPS em Minas Gerais, 24/01/2025"
    u: "https://convergenciadigital.com.br/mercado/anatel-apreende-equipamento-clandestino-que-fez-21-aeronaves-perderem-o-sinal-de-gps-em-minas-gerais/"
  - t: "DPL News, Anatel interrompe uso de jammer que interferia na navegação aérea em Belo Horizonte, 27/01/2025"
    u: "https://dplnews.com/brasil-anatel-interrompe-uso-de-jammer-que-interferia-em-comunicacoes-e-navegacao-aerea-em-belo-horizonte/"
  - t: "Aviacionline, prisão em Belo Horizonte por bloqueador que afetou o GPS de aeronaves, 26/01/2025"
    u: "https://www.aviacionline.com/man-arrested-in-belo-horizonte-for-operating-drone-signal-jammer-that-affected-aircraft-gps"
  - t: "Intercept Brasil, os 173 aviões de Brasília e os bloqueadores antidrone, 2023"
    u: "https://www.intercept.com.br/?p=422332"
  - t: "Atalaia, minuta do protocolo v0.5"
    u: "/atalaia/doutrina/"
---

Entre 17 e 21 de janeiro de 2025, 21 aeronaves perderam o sinal de GPS ao sobrevoar o perímetro do aeroporto da Pampulha, em Belo Horizonte, e tiveram de pousar por procedimentos de instrumentos. Em 21 de janeiro, a empresa que presta os serviços de navegação aérea do aeroporto acionou a gerência regional da Anatel. No dia 22, a Polícia Militar de Minas Gerais relatou falhas recorrentes de GPS nos drones que usava para monitorar a região.

Em 24 de janeiro, fiscais da Anatel e a polícia detectaram um sinal constante na faixa do GPS no bairro da Serra. Com análise técnica e radiogoniometria, a técnica de achar um emissor medindo de que direção o sinal chega, localizaram a fonte: um bloqueador instalado no alto do Aglomerado da Serra. A emissão foi interrompida e o aparelho, apreendido. O responsável pela instalação foi levado à Polícia Federal. Pela Lei Geral de Telecomunicações, operar um bloqueador sem autorização é atividade clandestina de telecomunicações, com pena de dois a quatro anos de detenção. A imprensa especializada relatou que o aparelho provavelmente servia para atrapalhar os drones da polícia.

Em setembro de 2025, ao anunciar o desmonte de uma fábrica clandestina de bloqueadores em Sorocaba, a própria Anatel lembrou o caso: o dispositivo estava causando sérios prejuízos à navegação aérea, conforme reportado pelo aeroporto.

Não foi um caso isolado. Entre abril de 2021 e março de 2022, segundo um relatório da Anatel citado pela imprensa, 173 aeronaves perderam a navegação por satélite na aproximação ou na saída de Brasília, por bloqueadores antidrone operados pelo próprio Estado.

## O que o caso ensina

**A ameaça é local, barata e não precisa de guerra.** Um aparelho, num ponto alto, bastou para afetar a aproximação de um aeroporto por vários dias. Não houve ataque sofisticado: houve um transmissor de ruído na faixa certa.

**A aviação tinha para onde recuar. O drone pequeno, em geral, não.** As aeronaves pousaram por instrumentos, porque a aviação mantém procedimentos e auxílios que não dependem do satélite. Os drones da polícia, no mesmo céu, simplesmente falharam. Um drone de carga ou de inspeção que perde o GNSS precisa de um plano decidido antes: seguir por quanto tempo, segurar ou pousar onde.

**O bloqueio é o caso fácil.** Um bloqueador é barulhento: o receptor percebe que perdeu o sinal. O caso difícil é a falsificação, em que o sinal continua chegando, só que mentindo, e um drone que confia cegamente no GNSS pode ser desviado devagar, sem que o piloto perceba. A Pampulha mostra que o equipamento existe e circula. A fábrica de Sorocaba, com maletas antidrone prontas para venda, mostra que há quem o produza.

**Achar a fonte é geometria.** A Anatel achou o bloqueador medindo direções. É o mesmo princípio que o Atalaia propõe usar de forma passiva, com a frota e postos fixos como sensores: em simulação, com três postos de escuta, a fonte de interferência ficou localizada em cerca de 350 m. É simulação, e nenhum posto existe ainda.

**Depois do fato, alguém vai perguntar o que aconteceu.** Num incidente com um drone sob interferência, a pergunta do investigador é simples e difícil: a posição em que o veículo confiava estava certa naquele instante? Sem um registro lacrado, a resposta depende da palavra de quem operava. Com um registro assinado na captura, encadeado e refeito por um verificador de outra parte, a resposta vira uma conta que qualquer um refaz.

## O que o Atalaia teria feito, num caso assim

Isto é ilustrativo, não medido. O Atalaia não teria impedido o bloqueio: ele só escuta, e nunca emite para revidar. Sob bloqueio, o GNSS some, e a região de proteção passa a crescer só com o sensor inercial, o relevo e a câmera. Antes da decolagem, o veredito já teria dito por quanto tempo cada perna da missão continua dentro do limite de alerta sem GNSS. Durante o voo, enquanto a região coubesse no limite, a missão seguiria. Quando deixasse de caber, a caixa seguraria ou pousaria numa zona avaliada antes. Nunca voltaria para casa guiada por um sinal suspeito. E tudo ficaria no registro.

Se o ataque fosse de falsificação, o portão faria a diferença: a posição falsa, ao cair fora da região calculada sem ela, seria declarada falsa, com a fonte apontada. Num ensaio em simulação com o firmware real do ArduPilot, sob um GNSS arrastado aos poucos, o piloto automático sozinho pousou a 585,7 m do posto; com a caixa emulada, a 1,8 m. A caixa ali é emulada e o falsificador é ingênuo, e o laudo diz isso.

A Pampulha não pede um drone que nunca se perca. Pede um drone que saiba o que ainda consegue garantir, e que deixe a prova.

Preparado por Carlos Toledo, com ajuda de IA (Claude) na pesquisa e na redação.
