---
titulo: "Silencioso por padrão"
data: 2026-11-16
resumo: "O Atalaia escuta e não emite. Quando a missão pede, um módulo ativo proposto liga só dentro de um envelope aprovado antes, e cada acionamento vira recibo. E há linhas que não mudam em nenhum modo."
fontes:
  - t: "Anatel, Resolução nº 760/2023 (bloqueadores de sinais)"
    u: "https://informacoes.anatel.gov.br/legislacao/resolucoes/2023/1842-resolucao-760"
  - t: "Anatel, Resolução nº 680/2017 (equipamentos de radiação restrita)"
    u: "https://informacoes.anatel.gov.br/legislacao/resolucoes/2017/936-resolucao-680"
  - t: "Anatel, Ato nº 14.448/2017, texto consolidado de 14/10/2025, no portal de legislação"
    u: "https://informacoes.anatel.gov.br/legislacao/"
  - t: "Anatel, Resolução nº 775/2025 (uso temporário de radiofrequências)"
    u: "https://informacoes.anatel.gov.br/legislacao/resolucoes/2025/2025-resolucao-775"
  - t: "Lei nº 9.472/1997, Lei Geral de Telecomunicações"
    u: "https://www.planalto.gov.br/ccivil_03/leis/l9472.htm"
  - t: "Atalaia, minuta do protocolo v0.5, linhas vermelhas"
    u: "/atalaia/doutrina/"
---

O problema que o Atalaia enfrenta é a emissão dos outros: o bloqueador que abafa o satélite, o falsificador que o imita. A tentação de responder a uma emissão com outra é grande, e é exatamente a que o Atalaia recusa. Ele foi desenhado para escutar.

A frase que o projeto usa em todas as páginas é uma só, escrita uma vez e repetida sem variação:

> O Atalaia recebe sinais e fica em silêncio por padrão. Um módulo ativo opcional, proposto, liga só dentro de um envelope aprovado antes da missão, com equipamento homologado de baixa potência, e cada acionamento fica no registro. Em nenhum modo bloqueia, falsifica ou interfere em sinais de terceiros, nem transmite nas faixas do GNSS.

## Por que silêncio

**Porque é a lei.** No Brasil, a Resolução nº 760/2023 da Anatel veda a comercialização, a posse e o emprego de bloqueadores de sinais, salvo por órgãos públicos listados e em circunstâncias excepcionais. Desenvolver clandestinamente atividade de telecomunicações dá dois a quatro anos de detenção. Um produto que emitisse para revidar nasceria ilegal.

**Porque é mais fácil de adotar.** A defesa civil numa enchente, uma cooperativa agrícola, um armador offshore: nenhum deles quer comprar um risco regulatório junto com a caixa. Um equipamento que só recebe entra em qualquer operação sem pedir licença de espectro para existir.

**Porque silêncio também é integridade.** Um sistema que não emite não se denuncia e não interfere no vizinho. A Resolução nº 680/2017 diz que um equipamento de radiação restrita que cause interferência prejudicial deve cessar o funcionamento imediatamente. O melhor jeito de cumprir isso sempre é não emitir sem necessidade.

## Quando a missão pede mais: o módulo ativo, proposto

Há situações em que escutar não basta: sobre a água, o relevo e a imagem não devolvem a posição; num pátio de pouso, a região pode ficar larga demais para descer com segurança. Para esses casos, o Atalaia propõe um módulo ativo opcional, que traz referências que um falsificador não consegue imitar. São quatro capacidades, todas PROPOSTAS:

- **Alcance cooperativo e balizas autenticadas.** A distância medida, ida e volta, pelo próprio enlace de telemetria, ou por UWB, até uma baliza num posto, num cais, numa plataforma ou na borda de um talhão. A medida é assinada, e uma distância forjada não passa.
- **Radares próprios.** Um radar altímetro no drone, em 24 GHz ou em 60 a 64 GHz, e um radar Doppler de velocidade no solo nos veículos terrestres, que a derrapagem não engana.
- **Integridade compartilhada na frota.** Cada veículo difunde a sua região; um falsificador local aparece como desacordo entre eles.
- **A bancada de testes de integridade.** Ensaio e laudo, lacrados e refazíveis, para receptores, pilotos automáticos e máquinas. Começa digital, sem nenhuma emissão de rádio.

## O envelope

O módulo não liga porque alguém achou melhor. Antes da missão, quem opera aprova um envelope: que emissores podem ligar, onde, com que potência e ciclo, por quanto tempo e quem pode desligar. O envelope é assinado e entra no registro. Dentro dele, a caixa liga o emissor sozinha quando o portão declara o GNSS falso, ou quando a região se aproxima do limite de alerta da fase, e desliga quando a condição some. Fora dele, nada liga, nem por comando: ligar fora exige um envelope novo, assinado. Quem opera pode desligar a qualquer momento. Um envelope vazio é o modo silencioso, e um cliente que precise de silêncio total simplesmente aprova um envelope vazio. O comportamento é o mesmo no civil e na defesa: o envelope decide.

Cada acionamento vai ao registro lacrado: quando, onde, que emissor, que potência, por que motivo e quando desligou. Um verificador de fora refaz a decisão de ligar a partir desse registro. É o recibo de que o envelope foi respeitado.

## O que a regra permite, na nossa leitura

Lemos a norma, e isto não é parecer jurídico. O alcance pelo enlace e a difusão na frota cabem em módulos já homologados nas faixas de 900 MHz, 2,4 GHz e 5,8 GHz. O radar altímetro de drone cabe em 24 GHz e em 60 a 64 GHz (até 122 m de altura e 20 dBm de pico), e não em 76 a 81 GHz em voo nem na faixa aeronáutica de 4,2 a 4,4 GHz. O radar de velocidade no solo cabe em 24 GHz, com operação contínua permitida em equipamento agrícola. O UWB em balizas fixas ao ar livre não tem categoria clara e começaria por uma autorização temporária de ensaio. A caixa com o módulo passa pela homologação de um organismo designado pela Anatel.

## As linhas que não mudam

Em nenhum modo, com nenhum envelope:

- bloquear, falsificar ou interferir em sinais de terceiros;
- transmitir nas faixas do GNSS pelo ar;
- antidrone por bloqueio;
- guiar armas, lançar munição ou designar alvos;
- decodificar comunicações;
- rastrear pessoas ou coletar dados delas.

Entrega, no Atalaia, quer dizer entrega logística. Essas linhas não são uma concessão ao regulador: são o produto. Elas permitem que qualquer operador adote a caixa sem medo do que ela faz, e permitem que um auditor confira, no registro, que ela fez só o que foi autorizado.

Preparado por Carlos Toledo, com ajuda de IA (Claude) na pesquisa e na redação.
