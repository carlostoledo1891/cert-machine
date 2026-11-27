# R(3,10): novas rotas, derivações e cálculos iniciais

**Nota de pesquisa para transferência ao chat principal.**  
**Data de referência:** 25 de novembro de 2026, horário de Brasília.  
**Autor da síntese:** ChatGPT, em colaboração com Carlos Toledo.  
**Objetivo:** propor experiências e lemas concretos que acrescentem informação às abordagens já documentadas em https://carlostoledo.co/r310/.

## 0. O que esta nota entrega

Esta nota reúne derivações matemáticas em prosa, experiências finitas executadas nesta sessão e propostas ainda abertas. Não contém uma resolução de R(3,10), uma nova exclusão de estrato inteiro ou uma alegação de prioridade bibliográfica.

Os quatro pontos que merecem ser levados primeiro ao chat principal são:

1. **Uma representação comum aos candidatos regulares e não regulares:** todo grafo sem triângulos com 40 vértices e número de independência no máximo 9 possui um emparelhamento perfeito. Particionar o grafo pelas 20 arestas desse emparelhamento leva a vínculos de apenas três formas e a uma formulação exata por 2-SAT para cada seleção de células.
2. **Três obstruções de traços com provas curtas:** duas foram extraídas de cartões de quatro raízes; a terceira surgiu da incompatibilidade de dois cartões individualmente realizáveis que discordam sobre uma mesma aresta física. Elas geram cortes transportáveis e não dependem de catálogos grandes.
3. **Uma redução condicional no grafo de codegree 5:** cinco vértices cujos pares têm exatamente cinco vizinhos comuns forçam um exterior de 13 vértices, isomorfo ao único grafo (3,5;13). No estrato de codegree máximo 5, os dois contatos comuns ao núcleo deixam apenas sete classes iniciais de pares de conjuntos independentes.
4. **Um oráculo uniforme para os ramos de R(6):** doze formas bipartidas cobrem todas as possibilidades de três a nove arestas cruzadas. Uma identidade exata de independência generaliza o teste do ramo de três arestas e permite formular a escolha das seis linhas comuns como um problema inteiro de cobertura.

**Prioridade recomendada:** incorporar primeiro os cortes pequenos e verificar a redução por emparelhamento; depois atacar o núcleo de 13 vértices. A reformulação de R(6) merece um piloto comparativo, não uma nova execução integral por antecipação.

### Legenda de evidência

- **BASE PUBLICADA:** resultado ou estado descrito nas fontes do projeto ou na literatura.
- **DERIVADO AQUI:** argumento em prosa apresentado nesta nota; não é uma formalização em Lean nem revisão externa.
- **COMPUTADO AQUI:** cálculo finito executado, com procedimento reproduzível.
- **PROPOSTA:** trabalho ainda não realizado ou desempenho ainda não estabelecido.
- **NEGATIVO:** uma variante testada falhou no objetivo declarado; não é impossibilidade de toda a família de métodos.

A consulta à literatura foi suficiente para identificar sobreposições importantes, mas não foi uma busca exaustiva de novidade.

## 1. Ponto de partida e dependências

Procuramos um grafo simples G com:

\[
|V(G)|=40,\qquad G\text{ sem triângulos},\qquad \alpha(G)\le9.
\]

Sua existência implicaria R(3,10)=41; sua impossibilidade, combinada com o limite inferior conhecido, implicaria R(3,10)=40.

No estrato regular, todos os graus são 9. Para dois vértices não adjacentes:

\[
c(u,v)=|N(u)\cap N(v)|,\qquad c^*=\max_{u\not\sim v}c(u,v).
\]

O estado publicado usado como referência ainda deixa abertos os estratos c*=3,4,5,6, além de 236 distribuições não regulares da lista adotada. W1f/W1g decidem famílias com determinadas simetrias; R(6) tem o ramo de três arestas cruzadas esgotado sob as premissas descritas, sem fechar o caso inteiro. [S1–S3]

A página lida nesta sessão tinha SHA-256:

58fac33497d67c380b7c81d3d0f3c34d97ab06e998f1ff5bfd8120c8f4c8ccf0

O repositório consultado apontava para:

d2dc414f36960a3fbd81111080e78d905c1e1f66

A página pode avançar depois desta fotografia. Conferir os estados antes de abrir novas tarefas.

### O que não deve ser reapresentado como descoberta

- A colagem de vizinhanças, inclusive a exigência de compatibilidade de várias linhas, é método estabelecido. [S8]
- O projeto já tentou cobertura por linhas, famílias de traços, modelos de momentos, SOS e vários sistemas agregados. [S2–S4]
- A relação de codegree 6 ser livre de triângulos já aparece em Chen, C-005. C-006 e C-013 dão restrições mais fortes sobre seus componentes. Reproduzir esse lema não constitui avanço sobre esse estado. [S9]
- Os argumentos abaixo usam ingredientes clássicos: Tutte, Mantel, König, 2-SAT, inclusão-exclusão e valores pequenos de Ramsey. O interesse está nas reduções e experiências propostas para esta fila.

## 2. Rota A — Particionar todos os candidatos em 20 arestas

### 2.1 Lema: a existência de emparelhamento perfeito não exige regularidade

**DERIVADO AQUI.**

> Se G é um grafo sem triângulos, de ordem par n≥38, com α(G)≤9, então G possui um emparelhamento perfeito.

Basta provar o enunciado para a situação relevante; não usamos regularidade, maximalidade, C35 ou o fechamento de R(7).

Suponha que não exista emparelhamento perfeito. Pelo teorema de Tutte, existe S⊆V(G), de tamanho s, para o qual G−S possui q>s componentes de ordem ímpar. A paridade de n implica:

\[
q\ge s+2.
\]

Como q≥2, toda componente C de G−S tem a=α(C)≤8: outra componente não vazia contribui pelo menos um para α(G−S)≤9.

Os valores conhecidos de R(3,a+1), a=1,…,8, dão a tabela:

| a | Limite geral para a ordem da componente | Maior ordem ímpar permitida |
|---:|---:|---:|
| 1 | 2 | 1 |
| 2 | 5 | 5 |
| 3 | 8 | 7 |
| 4 | 13 | 13 |
| 5 | 17 | 17 |
| 6 | 22 | 21 |
| 7 | 27 | 27 |
| 8 | 35 | 35 |

Em particular, toda componente satisfaz |C|≤5a; se sua ordem é ímpar, satisfaz |C|≤5a−4. Somando sobre todas as componentes:

\[
n-s
\le 5\alpha(G-S)-4q
\le45-4q
\le37-4s.
\]

Logo n≤37−3s≤37, contradizendo n≥38. Isso prova o lema. [Valores de Ramsey: S6; Tutte: S7.]

A dependência nos valores pequenos é explícita. Uma formalização futura pode substituir a tabela por oito lemas aritméticos e a aplicação de Tutte.

**Controle de fronteira:** C35(1,7,11,16) unido a um vértice isolado tem ordem 36, é livre de triângulos, tem α=9 e não possui emparelhamento perfeito. Portanto não se pode simplesmente baixar o limiar par para 36.

**Cálculo adicional:** uma programação dinâmica inteira sobre as possíveis independências e paridades das componentes, incluindo componentes pares opcionais, fornece os seguintes limites mais precisos:

| q componentes ímpares | Ordem total máxima com orçamento de independência 9 | Ordem mínima exigida por uma obstrução de Tutte em n=40 |
|---:|---:|---:|
| 2 | 36 | 40 |
| 3 | 29 | 39 |
| 4 | 24 | 38 |
| 5 | 21 | 37 |
| 6 | 18 | 36 |
| 7 | 15 | 35 |
| 8 | 12 | 34 |
| 9 | 9 | 33 |

A prova curta anterior dispensa esse cálculo. A tabela foi uma checagem adicional da redução.

### 2.2 Três formas de vínculo entre células

Fixe um emparelhamento perfeito:

\[
M=\{v_i^0v_i^1:1\le i\le20\}.
\]

Cada célula i contém uma aresta de G, e não uma órbita de automorfismo.

Entre duas células, a matriz 2×2 de adjacência só pode ser:

- zero;
- uma única aresta;
- um emparelhamento perfeito, com uma das duas fases possíveis.

Uma linha ou coluna com dois elementos 1 criaria um triângulo usando a aresta interna da célula oposta. Portanto há sete matrizes permitidas: uma zero, quatro simples e duas duplas.

Isso vale para candidatos assimétricos e para os não regulares. **Não é necessário supor qualquer involução de G.**

### 2.3 A condição de independência torna-se 2-SAT em uma seleção fixa

Escolha um conjunto K de células e uma variável binária x_i para cada i∈K, indicando qual de seus dois vértices entra no conjunto independente.

Uma aresta física v_i^a v_j^b proíbe a escolha simultânea dos dois extremos:

\[
(x_i\ne a)\lor(x_j\ne b).
\]

Logo as escolhas de um vértice por célula são exatamente as soluções de uma fórmula 2-CNF.

Como uma independente contém no máximo um extremo de cada aresta de M:

\[
\alpha(G)\ge10
\iff
\exists K\subseteq[20],\ |K|=10,\ F_K\text{ satisfatível}.
\]

Esse é um enunciado exato, não uma relaxação.

**Gargalo que permanece:** existem \(\binom{20}{10}=184\,756\) seleções. A fórmula nas 20 variáveis ser insatisfatível só exclui uma independente de tamanho 20. Não exclui uma de tamanho 10. Resolver cada seleção por 2-SAT não transforma a determinação de R(3,10) em um algoritmo polinomial.

Também não constitui uma classificação de grafos: ainda é preciso representar ou restringir as possíveis matrizes entre células.

### 2.4 Controles executados

A equivalência foi testada contra enumeração direta de escolhas independentes em todos os subconjuntos de células dos seguintes controles:

| Grafo | Células | Subconjuntos testados | Subconjuntos satisfatíveis, por tamanho | α |
|---|---:|---:|---|---:|
| Cubo Q3 | 4 | 16 | 1,4,6,4,1 | 4 |
| Wagner de ordem 8 | 4 | 16 | 1,4,6,4,0 | 3 |
| Petersen | 5 | 32 | 1,5,10,10,5,0 | 4 |
| Clebsch | 8 | 256 | 1,8,28,56,46,8,0,0,0 | 5 |

Nenhuma divergência.

O controle Petersen é importante: no emparelhamento dos raios, há dez vínculos simples e nenhum duplo. Uma abordagem que retivesse apenas XOR dos vínculos duplos perderia toda a obstrução.

Uma refutação 2-SAT pode ser registrada por dois caminhos no grafo de implicação: x→¬x e ¬x→x. São certificados pequenos para uma seleção determinada.

### 2.5 Preservar as arestas físicas entre cartões

Denote por A_ij a matriz 2×2 entre as células i,j e por

\[
J=\begin{pmatrix}0&1\\1&0\end{pmatrix}
\]

a adjacência interna da célula.

A matriz de codegrees entre duas células é exatamente:

\[
C_{ij}=JA_{ij}+A_{ij}J+\sum_{k\ne i,j}A_{ik}A_{kj}.
\]

O cálculo é sobre os inteiros: suas entradas contam caminhos de comprimento dois.

- Se A_ij(a,b)=1, a entrada correspondente de C_ij deve ser zero, pela ausência de triângulos.
- Se A_ij(a,b)=0, pode-se impor o limite de codegree do estrato.
- A mesma matriz física A_ij deve ocorrer em todos os cartões que contêm i e j.

**Consequência no estrato c*≤3:** uma ligação dupla entre i,j já fornece dois vizinhos comuns para cada par cruzado não adjacente. Cada terceiro vértice do grafo de ligações duplas que forma um triângulo com i,j contribui mais um. Portanto cada aresta desse grafo de ligações duplas pertence a no máximo um triângulo.

É uma restrição barata sobre o quociente. Ela não contém toda a condição de independência.

Para colar cartões com células já identificadas, as mudanças locais de rótulo dos dois extremos também precisam ser registradas. Nos vínculos duplos isso produz equações XOR; nos simples, dois bits físicos de porta. Fixadas as escolhas de cartões, identidades e multiplicidades, o alinhamento desses bits continua sendo um problema linear sobre F2. Escolher os cartões e suas identificações permanece combinatório.

### 2.6 Trocar o emparelhamento, preservando o grafo

Defina:

\[
\Phi(M)=\#\{\text{pares de células ligados por duas arestas}\}.
\]

Escolher um M que maximize Φ é sempre legítimo, pois G possui finitíssimos emparelhamentos perfeitos. Não há transformação de G, nem risco de criar um triângulo ou uma independente de tamanho 10. Isso contorna o problema lógico da regularização por switching de grafos: o objeto alterado aqui é apenas uma estrutura auxiliar.

No caso 9-regular, cada célula tem 16 incidências externas. Se D_i é seu número de vínculos duplos e S_i o número de simples:

\[
2D_i+S_i=16,\qquad
S_i=2(8-D_i).
\]

Assim o grafo dos vínculos simples é euleriano. Se D=Φ(M) e S é seu número total de vínculos simples:

\[
2D+S=160,\qquad D\le80.
\]

Se S=0, trocar simultaneamente os dois extremos de todas as células é um automorfismo sem pontos fixos. No estrato c*=3, essa família se conecta diretamente ao resultado W1f já publicado.

Se S≠0, então S≥4: um grafo simples euleriano não tem uma ou duas arestas; S deve ser par. Em particular, D=79 é impossível.

**Proposta de extensão de W1f:** classificar defeitos pequenos em relação ao caso S=0:

- S=4: o suporte simples é um C4;
- S=6: C6 ou duas cópias de C3, disjuntas ou com um vértice comum;
- S maior: ampliar apenas após medir o custo e a cobertura.

Isso descreve famílias que podem ser assimétricas. Ainda não temos um teorema garantindo que todo candidato admita M com S pequeno.

A maximalidade de Φ também permite impor desigualdades de troca. Para duas arestas uv,xy de M que formam um quadrado alternante, substitua-as por ux,vy quando essas arestas existem. O vínculo entre as duas novas células continua duplo; só mudam seus vínculos com as outras células. Se D(e,f) indica ligação dupla:

\[
\Delta\Phi=
\sum_{g\in M\setminus\{uv,xy\}}
[D(ux,g)+D(vy,g)-D(uv,g)-D(xy,g)].
\]

Para um M globalmente ótimo, toda troca permitida satisfaz ΔΦ≤0. A escolha de um ótimo global é uma hipótese sem perda de generalidade; a busca heurística abaixo encontra apenas ótimos locais.

### 2.7 Piloto de otimização do emparelhamento

Controle reconstruído:

\[
G=C_{40}(\pm1,\pm5,\pm9,\pm12,20).
\]

O programa verificou grau 9, ausência de triângulos, codegrees entre 1 e 4 e α(G)=11. Trata-se de um controle existente, não de um candidato Ramsey.

Entre 64 emparelhamentos produzidos por busca aleatorizada, com semente fixa:

| Medida | Antes das trocas | Depois das trocas de quatro ciclos |
|---|---:|---:|
| Menor Φ | 11 | 27 |
| Maior Φ | 29 | 80 |
| Média Φ | 20,015625 | 44,21875 |

Foram feitas 545 trocas estritamente melhoradoras. A amostra não é uniforme entre todos os emparelhamentos.

O emparelhamento antipodal conhecido tem Φ=80 e atinge o limite absoluto. É, portanto, globalmente ótimo para esse controle. A maioria das buscas locais termina abaixo dele. Isso demonstra simultaneamente que a representação muda bastante com M e que o procedimento local não certifica ótimo global.

**Gate A recomendado:** aplicar a representação a controles conhecidos e aos cartões sobreviventes do projeto; medir quantidade e tamanho dos núcleos contraditórios de 2-SAT e o ganho real de escolher M. Um sucesso precisa reduzir a representação ou produzir uma desigualdade nova. A simples equivalência com independência não é sucesso suficiente.

## 3. Rota B — Obstruções transportáveis sobre uma independente de nove vértices

### 3.1 Notação e alcance

Seja S uma independente de tamanho k, com k≥4, em um grafo sem triângulos com α(G)≤k. No alvo, k=9.

Para x∉S, seu traço é:

\[
T(x)=N(x)\cap S.
\]

Dois vértices cujos traços se intersectam são necessariamente não adjacentes: a interseção forneceria um triângulo.

Para J⊆S com quatro elementos, todos os vértices externos cujos traços estão contidos em J são anticompletos a S\J. Consequentemente, o subgrafo formado por J e esses vértices deve ter α≤4. Uma independente de cinco ali se estenderia por S\J a uma independente de k+1.

É essencial usar os traços completos em S. Saber apenas a projeção do traço em J não basta.

### 3.2 Dois padrões proibidos de oito vértices externos

Escolha J={a,b,c,d}. Suponha que existam oito vértices externos distintos com os traços:

\[
\{a\},\{b\},\{a,b\},\{c\},\{a,c\},\{a,d\},\{b,d\},Z,
\]

onde Z é {b,c,d} ou {c,d}.

Nomeie esses vértices A,B,AB,C,AC,AD,BD,Z, respectivamente.

**DERIVADO AQUI:** nenhuma dessas configurações pode ocorrer.

Prova por arestas forçadas:

1. O conjunto {c,d,A,B,AB} teria cinco vértices independentes se A–B não existisse. Todas as demais possíveis arestas são excluídas pelos traços. Logo A–B é forçada.
2. O conjunto {b,d,A,C,AC} força A–C.
3. O conjunto {c,A,AB,AD,BD} força A–BD.
4. Se Z tem traço {b,c,d}, o conjunto {A,AB,AC,AD,Z} força A–Z. Se tem traço {c,d}, o conjunto {b,A,AC,AD,Z} força a mesma aresta.
5. Agora a,B,C,BD,Z são cinco vizinhos de A. Como G é livre de triângulos, são independentes. Contradição.

Cada proibição local de uma independente de cinco usa o complemento S\J para chegar a k+1.

### 3.3 Verificação exaustiva inicial

Representando a,b,c,d pelos bits 1,2,4,8:

| Padrão | Máscaras dos oito traços | Arestas externas livres | Completamentos | Com triângulo | Sem triângulo e com independente de cinco |
|---|---|---:|---:|---:|---:|
| A | 1,2,3,4,5,9,10,14 | 11 | 2.048 | 624 | 1.424 |
| B | 1,2,3,4,5,9,10,12 | 13 | 8.192 | 3.136 | 5.056 |

Nenhum contraexemplo. A enumeração foi refeita por uma implementação separada. A remoção de qualquer um dos oito vértices externos permite algum completamento local válido; essa minimalidade foi verificada somente quanto às oito remoções individuais.

Se z_T indica presença de pelo menos um vértice de traço T, cada padrão dá:

\[
\sum_{T\in\mathcal P}z_T\le7.
\]

Impor todas as imagens sob relabelagens das quatro raízes. Não confundir esse corte de presença com uma desigualdade linear em multiplicidades sem variáveis auxiliares.

Como uma célula de traço T é independente e anticompleta a S\T, sua multiplicidade satisfaz m_T≤|T|. Assim z_T≤m_T≤|T|z_T, com z_T binário, codifica a presença exatamente. A geração e deduplicação em S9 produziu **4.536 cortes distintos dos tipos A/B**. Nos controles Clebsch16, um grafo regular de ordem 22 e C35, o scanner examinou respectivamente 16, 139 e 3.360 raízes máximas, sem rejeitar nenhuma.

### 3.4 O terceiro padrão: dois cartões discordam sobre a mesma aresta

Os dois cortes anteriores não encerram os gêmeos de calibração. Surgiram novos vetores inteiros nos quais cada cartão individual de até quatro raízes tinha um completamento.

Um deles, no gêmeo de ordem 23, forneceu uma obstrução de sobreposição. Dois cartões tinham, respectivamente, três e dez completamentos, mas exigiam valores opostos para uma mesma aresta física. Dessa incompatibilidade foi extraída a seguinte prova.

Escolha cinco raízes distintas a,b,c,d,e dentro de S. Suponha que existam nove vértices externos com traços:

\[
\{c\},\quad
\{a,b,c\}\text{ (duas cópias)},\quad
\{b,d\},\quad
\{c,d\},\quad
\{e\},\quad
\{c,e\},\quad
\{b,e\},\quad
\{b,d,e\}.
\]

Denote-os por x_c, x_abc^1, x_abc^2, x_bd, x_cd, x_e, x_ce, x_be, x_bde.

- No cartão J1={a,b,c,d}, o conjunto {x_c,x_abc^1,x_abc^2,x_bd,x_cd} força x_c–x_bd.
- No cartão J2={b,c,d,e}, o conjunto {b,d,x_c,x_e,x_ce} força x_c–x_e.
- No mesmo J2, o conjunto {c,x_bd,x_e,x_be,x_bde} força x_bd–x_e.

As três arestas forçadas formam um triângulo.

**Detalhe lógico central:** cada independente potencial de cinco é estendida pelos k−4 vértices fora de seu próprio cartão de quatro raízes. A união J1∪J2 tem cinco raízes; usar somente S\(J1∪J2) não daria a contradição necessária.

A checagem do padrão combinado examinou 1.024 atribuições de arestas permitidas: 128 têm triângulo e 896 são livres de triângulos mas contêm uma independente de seis no subgrafo com as cinco raízes. Nenhuma tem simultaneamente ausência de triângulos e α≤5.

Esse terceiro corte exige registrar multiplicidade: duas cópias distintas de {a,b,c}. Não basta uma variável de presença para esse tipo.

Com h_abc indicando m_abc≥2, a equivalência é 2h_abc≤m_abc≤1+2h_abc, pois m_abc≤3. O corte completo é z_c+h_abc+z_bd+z_cd+z_e+z_ce+z_be+z_bde≤7. Para padrões A/B exige-se k≥4; para C, k≥5. Em um candidato de ordem 40, R(3,9)=36 garante a existência de uma raiz S9, inclusive no caso não regular.

### 3.5 Por que esta rota difere do dicionário que transferiu mal

Os cortes são sobre uma marca pequena e preservam a identidade das arestas entre os cartões. As provas não dependem do nome de um núcleo de 30 vértices nem de seus milhares de conjuntos independentes.

Isso não garante ampla cobertura. O novo elemento a testar é a capacidade de extrair pequenas obstruções a partir de incompatibilidades entre cartões, em vez de armazenar apenas refutações de núcleos completos.

Fluxo proposto:

1. Gerar uma solução inteira da relaxação de multiplicidades.
2. Escolher uma realização explícita dos vértices de cada tipo, mantendo cópias distintas.
3. Construir cartões sobre quatro raízes com os mesmos identificadores de aresta.
4. Enumerar ou resolver exatamente os completamentos desses cartões.
5. Projetar as possibilidades nas arestas compartilhadas.
6. Excluir valores sem suporte e procurar um circuito de incompatibilidade.
7. Reduzir o circuito a um padrão pequeno; produzir prova manual, SAT certificada ou ambas.
8. Reintroduzir o corte e medir se aparecem apenas novos fantasmas.

**Gate B recomendado:** reprodução dos três cortes; zero rejeições de controles positivos; medir em um lote fixo quantos perfis sobreviventes são retirados por cartões isolados e quantos exigem sobreposição. Uma sequência ilimitada de fantasmas diferentes sem compressão mensurável é motivo para parar essa formulação.

### 3.6 O resultado negativo que levou aos cortes

Foram impostas todas as desigualdades usadas no piloto para famílias de traços par a par intersectantes, somas de graus, limites de codegree entre raízes e capacidades inteiras. Ainda existiam soluções inteiras nos casos impossíveis:

- ordem 18, grau 5, independente máxima permitida de tamanho 5;
- ordem 23, grau 6, independente máxima permitida de tamanho 6.

Os vetores retornados pelo otimizador foram conferidos em aritmética inteira. O controle Clebsch de ordem 16 passou.

Assim, aumentar indiscriminadamente a coleção dessas desigualdades não é a recomendação. Os cartões exatos de quatro raízes eliminaram os primeiros fantasmas; novos fantasmas exigiram compatibilidade entre cartões. O piloto localizou uma diferença de poder entre essas representações, sem demonstrar que um número fixo de cartões será suficiente no alvo.

## 4. Rota C — Um K5 de codegree cinco força um núcleo de 13 vértices

### 4.1 Grafo auxiliar e premissas

No caso 9-regular, defina H5 sobre V(G): uv é uma aresta de H5 exatamente quando c(u,v)=5.

Uma clique de H5 é uma independente de G, porque vértices adjacentes de G não têm vizinho comum.

Usamos dois resultados elementares já registrados por Chen: G não contém K3,6 nem K4,5. [S9] Uma justificativa curta para K4,5: os 31 vértices restantes não podem ter vizinhos dos dois lados; os lados anticompletos às partes de tamanhos 5 e 4 têm no máximo 13 e 17 vértices, respectivamente, pelos números pequenos de Ramsey. Mesmo permitindo vértices sem contatos em nenhum lado, isso cobre no máximo 30, uma contradição.

### 4.2 Quatro raízes: apenas dois tipos de incidência

Considere quatro raízes independentes, todos os seis codegrees iguais a 5. Sejam t_1,…,t_4 os tamanhos das quatro interseções triplas e q o tamanho da interseção quádrupla.

A contagem do exterior comum de qualquer tripla dá t_i≥3. A proibição de K3,6 dá t_i≤5; a de K4,5 dá q≤4.

A não negatividade de cada célula de traço de tamanho dois implica:

\[
t_i+t_j\le5+q.
\]

O exterior comum das quatro raízes tem tamanho:

\[
30-\sum_i t_i+q.
\]

Ele não pode conter uma independente de seis, portanto tem no máximo 17 vértices. Logo:

\[
\sum_i t_i-q\ge13.
\]

Essas condições deixam apenas:

| Tipo | Interseções triplas | Interseção quádrupla | Exterior |
|---|---|---:|---:|
| A | 4,4,4,4 | 3 | 17 |
| B | 5,4,4,4, com a posição do 5 variável | 4 | 17 |

A enumeração inteira confirmou cinco linhas rotuladas, correspondentes a esses dois tipos. O exterior pertence ao catálogo completo de sete grafos (3,6;17). [S5]

### 4.3 Cinco raízes: um único tipo, exterior C13(1,5)

Para cinco raízes cujos pares têm codegree 5, considere cada subgrupo de quatro.

Marque o par ij quando a tripla complementar tem interseção de tamanho 5. A classificação anterior diz que cada raiz pertence a no máximo uma dessas marcas; as marcas formam um matching em cinco pontos.

Se d_i é seu grau nesse matching e p a interseção das cinco vizinhanças, a interseção quádrupla que omite i tem tamanho 3+d_i. Para a célula exata da tripla complementar a ij:

\[
x_{[5]\setminus\{i,j\}}
=p-2+\mathbf1_{ij\text{ marcado}}-d_i-d_j\ge0.
\]

Como há um vértice não coberto pelo matching, p≤3.

- Duas marcas disjuntas forçam p≥4 por um par entre as duas marcas: impossível.
- Uma marca força p=3; a célula exata do par marcado teria tamanho −1: impossível.
- Sem marcas, as células triplas exigem p≥2 e as células de pares exigem p≤2.

Portanto p=2 e o tipo é único:

- dois vértices adjacentes às cinco raízes;
- um vértice em cada um dos cinco traços de tamanho quatro;
- três vértices em cada um dos cinco traços unitários;
- nenhuma outra célula não vazia.

São 22 vértices na união das vizinhanças. Restam:

\[
40-5-22=13
\]

vértices anticompletos às cinco raízes, com α≤4. Pelo catálogo completo, esse exterior é o único grafo (3,5;13), isomorfo a C13(1,5). [S5]

**Este é um ramo condicional.** Não provamos que H5 contém K5, nem que esse ramo é impossível.

### 4.4 Seis raízes são impossíveis

Se existisse K6 em H5, cada subconjunto de cinco teria o tipo anterior. Escreva p para a interseção comum das seis vizinhanças.

Pela inversão de inclusão-exclusão, uma célula exata de tamanho quatro teria p−1 vértices e uma de tamanho três teria 1−p. Logo p=1.

A distribuição seria:

- um vértice comum às seis raízes;
- um vértice em cada um dos seis traços de tamanho cinco;
- três vértices em cada traço unitário;
- demais células não vazias com tamanho zero.

A união das vizinhanças teria 1+6+18=25 vértices. Restariam nove vértices anticompletos às seis raízes. Esses nove contêm uma independente de quatro, por R(3,4)=9, produzindo uma independente de dez.

Conclusão derivada:

\[
H_5\text{ é }K_6\text{-livre}.
\]

Esse resultado deve ser submetido à revisão e à comparação com a literatura antes de qualquer alegação de novidade.

### 4.5 O deck de 13 vértices já foi contado

Agora imponha também c*≤5.

Os dois vértices comuns às cinco raízes precisam de quatro vizinhos cada no exterior H=C13(1,5). Suas duas linhas são independentes de tamanho quatro e **disjuntas**: já compartilham as cinco raízes, e qualquer interseção adicional ultrapassaria o codegree 5.

Cálculo exato realizado:

- H tem 39 independentes de tamanho quatro.
- Existem 221 pares não ordenados e disjuntos dessas independentes.
- Sob as 52 automorfias explícitas x↦ax+b, a∈{1,5,8,12}, b∈Z13, os pares se dividem em sete órbitas.
- Tamanhos das órbitas: 26,26,52,52,13,26,26.

Não é necessário provar que essas são todas as automorfias: usar um subgrupo verdadeiro continua dando uma cobertura correta, talvez menos reduzida.

O vértice q_i de traço [5]\{i} pode ter contatos, fora das raízes, apenas nos três vértices unitários do tipo {i} e no núcleo H. Se r_i é o número dos primeiros contatos:

\[
|N(q_i)\cap H|=5-r_i,\qquad r_i\in\{1,2,3\}.
\]

r_i=0 exigiria uma independente de tamanho cinco em H.

A linha de q_i no núcleo intersecta cada uma das duas linhas comuns em no máximo um vértice. Aplicando apenas independência e essas interseções, as sete órbitas dão:

| Órbita | Linhas de tamanho 2 | Tamanho 3 | Tamanho 4 | Total |
|---:|---:|---:|---:|---:|
| 1 | 40 | 40 | 11 | 91 |
| 2 | 40 | 40 | 12 | 92 |
| 3 | 40 | 39 | 12 | 91 |
| 4 | 40 | 39 | 11 | 90 |
| 5 | 40 | 40 | 12 | 92 |
| 6 | 40 | 40 | 13 | 93 |
| 7 | 40 | 38 | 11 | 89 |

Linhas de q_i,q_j também devem intersectar-se em no máximo dois vértices, pois esses vértices já têm três raízes comuns.

Representantes concretos dos pares de linhas, na mesma ordem da tabela:

1. {0,2,4,6} e {1,3,5,7}.
2. {0,2,4,6} e {3,5,7,9}.
3. {0,2,4,6} e {1,3,7,10}.
4. {0,2,4,6} e {1,5,7,11}.
5. {0,2,4,6} e {1,5,8,11}.
6. {0,2,4,6} e {5,7,9,11}.
7. {0,2,6,9} e {1,3,7,10}.

Uma identidade adicional para conferir a montagem é e(G[N(S)])=44. O núcleo C13 tem 26 arestas, recebe 65 incidências dos 22 vértices de N(S), e as cinco raízes enviam 45 incidências a N(S); o balanço dos 22 graus nove deixa 44 arestas internas. Portanto, entre os quinze vértices unitários há 44−Σr_i arestas, um número entre 29 e 39.

**O que não foi feito:** a escolha conjunta das cinco linhas, as incidências dos quinze vértices unitários, a realização de todos os graus e a verificação global de independência. Não multiplicar 93^5 e tratar isso como um custo estabelecido.

**Gate C recomendado:** montar o problema conjunto em cada uma das sete órbitas, preservando as identidades do núcleo. Testar primeiro restrições de graus, interseções e os cartões pequenos da Rota B. Se fechar, a conclusão será a exclusão de K5 em H5 naquele estrato, não o fechamento de todo R(5).

## 5. Rota D — Um oráculo uniforme para os ramos de R(6)

### 5.1 Geometria fixa e doze formas de fronteira

Escolha x,y não adjacentes com seis vizinhos comuns C. Escreva:

\[
A=N(x)\setminus N(y),\quad
B=N(y)\setminus N(x),\quad |A|=|B|=3.
\]

Seja F o grafo bipartido entre A e B, com f arestas. O núcleo H, fora de x,y e de suas vizinhanças, tem 26 vértices.

C é independente e anticompleto a A∪B. Como α(G)≤9:

\[
\alpha(F)\le3.
\]

Por König, F precisa de um emparelhamento perfeito. Enumeramos os 512 grafos bipartidos rotulados 3×3:

| f | Rotulados com emparelhamento perfeito | Tipos sob S3×S3 e troca dos lados | Arestas no núcleo H |
|---:|---:|---:|---:|
| 3 | 6 | 1 | 75 |
| 4 | 36 | 1 | 76 |
| 5 | 81 | 3 | 77 |
| 6 | 78 | 3 | 78 |
| 7 | 36 | 2 | 79 |
| 8 | 9 | 1 | 80 |
| 9 | 1 | 1 | 81 |
| Total | 247 | 12 | — |

Isso classifica somente a pequena fronteira F. Não classifica os núcleos ou suas extensões.

Para a∈A:

\[
|N(a)\cap H|=8-d_F(a),
\]

e analogamente para B. Cada vértice de C precisa de uma independente de tamanho sete em H.

A soma de graus fornece:

\[
e(H)=72+f.
\]

### 5.2 Identidade exata de independência

Para uma independente I de H, sejam A_I,B_I,C_I os vértices respectivos sem vizinhos em I. Defina:

\[
a_I=|A_I|,\quad b_I=|B_I|,\quad c_I=|C_I|,
\]

e ν_I o tamanho de um emparelhamento máximo de F[A_I,B_I].

Então:

\[
\alpha(G)=
\max_{I\text{ independente em }H}
\left\{
|I|+
\max\left(
2,\ 1+a_I,\ 1+b_I,\ c_I+a_I+b_I-\nu_I
\right)
\right\}.
\]

Justificativa: depois de fixar I, uma independente fora de H contém ambos x,y; apenas um deles; ou nenhum deles. No último caso, pode usar C_I e uma independente máxima do grafo bipartido restante. Esses são todos os casos.

A identidade funciona também em exemplos menores com a mesma decomposição, sem regularidade. O programa a comparou com uma busca exata independente de α em **240 grafos pequenos sem triângulos**, com zero divergências. Remover propositalmente o termo de matching foi detectado em 215 deles.

Além disso, os 512 grafos F e todas as 64 escolhas de A_I,B_I deram **32.768 verificações exatas** da identidade bipartida α=a+b−ν, comparada com enumeração direta de independentes.

### 5.3 Cobertura inteira das seis linhas comuns

Fixe H,F e as seis linhas de A∪B. Para cada independente I de H, seja h(I) o número das seis linhas comuns que encontram I. Como c_I=6−h(I), a última condição da identidade vira:

\[
h(I)\ge |I|+a_I+b_I-\nu_I-3.
\]

Se z_T é a multiplicidade de uma independente de tamanho sete T⊆V(H) escolhida como linha comum, temos:

\[
\sum_Tz_T=6,
\]

\[
\sum_{T\ni v}z_T
=
9-d_H(v)-\#\{\text{linhas de }A\cup B\text{ que contêm }v\},
\]

\[
\sum_{T:T\cap I\ne\varnothing}z_T
\ge |I|+a_I+b_I-\nu_I-3.
\]

Também é necessário impor as outras três parcelas da identidade de independência e quaisquer limites de codegree usados pelo estrato.

Com todas as independentes I e variáveis inteiras, isso descreve exatamente a escolha das linhas comuns para as fronteiras fixadas. Uma relaxação fracionária continua sendo apenas necessária.

**Relação com o trabalho existente:** quando F são três arestas disjuntas, a desigualdade se reduz ao teste em que o número de linhas comuns que encontram I, somado ao número de pares laterais atingidos duas vezes, é pelo menos |I|. Portanto o caso f=3 reproduz uma condição já usada pelo projeto. [S3] A proposta é uniformizar f=4,…,9 e experimentar um decisor com cortes, não atribuir novidade ao teste existente.

**Gate D recomendado:** comparar o modelo inteiro com o decisor direto em um pequeno lote fixo de registros já decididos, incluindo controles plantados. Medir nós, tempo e tamanho dos certificados. Não iniciar um novo censo com base apenas na elegância da formulação.

## 6. Experimentos que restringem as recomendações

### 6.1 Compatibilidade de contagens não basta

Em um teste de colagem com seis faces do cubo, 64 padrões passaram as compatibilidades locais par a par, mas somente 32 colaram globalmente. Um padrão impossível tem um certificado XOR que soma as equações a 0=1.

Em 2-lifts de C5, 16 escolhas de sinais produzem duas cópias de C5, com α=4, e 16 produzem C10, com α=5. Graus, ausência de triângulos e histograma de codegrees não distinguem os dois grupos. A diferença aparece na paridade global.

Esses são controles pequenos de um mecanismo conhecido, não exemplos de ordem 40.

### 6.2 Células de mesmo traço com dois vértices são insuficientes como hipótese geral

Um controle público de ordem 39, com α=9 e sem automorfismos não triviais segundo o refinamento de cores que o distinguiu por completo, foi examinado em 4.231 raízes independentes de tamanho três e 17.478 de tamanho quatro. Não apareceu ciclo de emparelhamentos entre suas células de traço de tamanho dois.

Isso derruba o gate inicial de usar apenas essas células como fonte abundante de circuitos. A partição por arestas de um emparelhamento perfeito evita depender da existência dessas classes de traço, embora não garanta uma representação fácil.

### 6.3 Cortes agregados continuam fracos em um controle real de 40 vértices

No controle C40(±1,±5,±9,±12,20), os cortes por famílias de traços par a par intersectantes passaram por todas as raízes independentes de tamanhos três a seis testadas.

Entretanto, o teste do tamanho do exterior em seis raízes detectou 2.040 das 65.720 raízes independentes de tamanho seis. Por exemplo:

\[
I=\{0,2,4,6,21,23\}
\]

tem exterior comum

\[
\{8,10,17,19,25,27,29,36,38\},
\]

de tamanho nove. R(3,4)=9 fornece uma independente de quatro nesse exterior. Uma escolha explícita é {8,10,25,27}, produzindo uma independente de dez com I.

Portanto é incorreto resumir os experimentos como “nenhum método local até seis raízes funciona”. A família de desigualdades e o tipo de informação fazem diferença.

### 6.4 O que interromper por enquanto

- Nova busca de potencial para os mesmos movimentos de regularização que já têm uma componente fechada de contraexemplos.
- Ampliação cega de desigualdades agregadas que continuam aceitando fantasmas.
- SOS genérico sem identificar a informação adicional que deveria mudar o resultado.
- Classificações cada vez maiores sem uma medida de cobertura ou uma regra que reduza o resto.
- Supor que uma nova implementação de contagem certifica automaticamente as conclusões de exclusão.

## 7. Plano de trabalho para o chat principal

Os orçamentos abaixo são sugestões de piloto, não estimativas de execução do problema completo.

| Ordem | Tarefa | Entrega exigida | Critério de avanço | Critério para parar |
|---:|---|---|---|---|
| 1 | Re-derivar o lema do emparelhamento e a equivalência 2-SAT | Prova curta e testes de controle | Equivalência validada, incluindo não regulares | Qualquer hipótese ausente ou controle positivo rejeitado |
| 2 | Incorporar os três cortes de traços | Enunciados com padding explícito; certificados/provas | Redução mensurável de perfis abertos | Muitos cortes específicos sem transferência |
| 3 | Colar cartões de quatro raízes por arestas físicas | Um circuito contraditório reproduzível e minimizado | Excluir perfis que passam cartões isolados | Explosão do número de cartões sem cortes compactos |
| 4 | Testar as sete órbitas do ramo K5 em H5 | Um modelo conjunto por órbita, com premissas rastreáveis | Exclusão completa de uma órbita ou redução estrutural | Apenas grande enumeração de cinco linhas sem compressão |
| 5 | Escolher M por Φ e classificar defeitos pequenos | Medidas em controles e famílias S=4/S=6 | Nova exclusão de família ou desigualdade útil | Nenhum ganho além de repetir a análise com involução |
| 6 | Piloto do oráculo uniforme de R(6) | Concordância com decisor direto e controles | Melhoria medida ou certificado menor | Custo comparável ou maior sem reduzir a base de confiança |

Para cada gate:

- Fixar antes a família, a hipótese, o controle positivo e o critério de sucesso.
- Distinguir cobertura completa de amostra.
- Usar a mesma identificação de vértices e arestas ao juntar cartões.
- Gerar a contradição concreta: conjunto independente, triângulo, desigualdade inteira ou ciclo de implicações.
- Usar um orçamento pequeno inicial, por exemplo 1–2 horas de CPU por rota, sem alugar capacidade antes de medir o piloto.
- Registrar inclusive o resultado negativo; não transformar um corte que elimina um fantasma em prova de suficiência do método.

### Texto de transferência sugerido

Este documento contém propostas e cálculos preliminares, não resultados aceitos do projeto. Re-derive primeiro os lemas e confira as sobreposições com Chen e com o ledger atual. Priorize: (i) a representação por 20 arestas, cuja existência vale também para os candidatos não regulares; (ii) os três cortes de traços e a compatibilidade por arestas físicas; (iii) o ramo K5 do grafo de codegree cinco, reduzido ao núcleo C13 e a sete órbitas iniciais. Exija controles e um gate curto antes de qualquer expansão. Preserve os fracassos documentados. Não declare R(3), R(5), R(6) ou a metade não regular fechados por nenhum dos resultados desta nota.

## 8. Fontes e créditos

**S1.** Carlos Toledo, página do programa R(3,10):  
https://carlostoledo.co/r310/

**S2.** Ledger público do programa, incluindo W1f/W1g, G27 e os testes negativos:  
https://github.com/carlostoledo1891/cert-machine/blob/main/corpus/r310-live/sources/round1/LEDGER.md

**S3.** Abertura do ramo de três arestas de R(6):  
https://github.com/carlostoledo1891/cert-machine/blob/main/corpus/r310-live/sources/reveal-draft/r6-2026-11-24/REVEAL-R6.md

**S4.** Mapa de rotas e experimento de switching:  
https://github.com/carlostoledo1891/cert-machine/blob/main/corpus/r310-live/sources/round5/PATHS.md  
https://github.com/carlostoledo1891/cert-machine/blob/main/corpus/r310-live/sources/round5/monovariant/FROZEN-M1-2026-11-25.md

**S5.** Brendan McKay, catálogos de grafos de Ramsey; sete grafos (3,6;17), único (3,5;13), entre outros:  
https://users.cecs.anu.edu.au/~bdm/data/ramsey.html

**S6.** Stanisław Radziszowski, Small Ramsey Numbers, Dynamic Survey:  
https://www.combinatorics.org/ojs/index.php/eljc/article/view/DS1

**S7.** Referência para o teorema de Tutte e a fórmula de Tutte–Berge:  
https://iuuk.mff.cuni.cz/~ipenev/KGLectureNotes.pdf  
As aplicações e contas desta nota são rederivações, não citações de um teorema novo dessa referência.

**S8.** Vigleik Angeltveit, R(3,10)≤41; em particular, colagem de vizinhanças e suas melhorias:  
https://www.combinatorics.org/ojs/index.php/eljc/article/download/v32i4p30/pdf/

**S9.** Zhiyang Chen, registro de afirmações e provas de bicliques/codegree seis:  
https://github.com/jeffchen006/Ramsey-R3-10/blob/main/ralph/CLAIMS.md  
https://github.com/jeffchen006/Ramsey-R3-10/blob/main/ralph/lanes/C/proofs/bicliques.md  
https://github.com/jeffchen006/Ramsey-R3-10/blob/main/ralph/lanes/C/proofs/codegree_six_paths.md

**Limite de autoria e validação:** as propostas foram desenvolvidas por sessões de IA nesta conversa, com cálculos e verificações locais. Reimplementações nessa mesma sessão não equivalem a uma auditoria externa. Nenhuma alegação de prioridade deve ser feita sem busca bibliográfica e comparação com os arquivos atuais do projeto.

**S10.** Arquivo exato do controle público assimétrico de 39 vértices:  
https://raw.githubusercontent.com/carlostoledo1891/cert-machine/main/corpus/r310-c35-r7/c35/review-check/exoo-candidate.g6

## 9. Reprodutores e detalhes técnicos

Os apêndices a seguir incorporam programas usados nesta sessão. Salvar os blocos com os nomes indicados para executar. Os programas pequenos produzem dados em seus diretórios de execução; nenhum acessa contas ou envia resultados.



### Como reproduzir

As provas em prosa das seções 2–5 não dependem do código. Os programas confirmam as contas finitas e os controles descritos. Os pilotos exploratórios de MILP não estão incorporados: os cortes extraídos deles têm provas manuais e verificadores exaustivos próprios abaixo.

Salve cada bloco no caminho relativo indicado, preservando os pequenos arquivos graph6 ao lado dos programas que os leem. Todos usam a biblioteca padrão do Python, exceto a calibração em codegree_cliques.py, que também requer NumPy. Os dados graph6 incorporados são os controles públicos citados, não novos catálogos produzidos nesta sessão.

Comandos:

```bash
python root/probes.py
python root/matching_probe.py
python cover/check_obstructions.py
python cover/check_overlap.py
python global/codegree_cliques.py
python overlap/experiment.py
```

Os tempos dependem do ambiente; os testes são pequenos. Os hashes abaixo identificam o texto incorporado, normalizado com uma quebra de linha final. Para extrair automaticamente os blocos, pode-se usar este programa, passando o caminho deste Markdown e um diretório de saída:

```python
import hashlib, re, sys
from pathlib import Path
source = Path(sys.argv[1]).read_text()
folder = Path(sys.argv[2])
pattern = r"^### Arquivo: ([^\n]+)\n\nSHA-256: ([a-f0-9]{64})\n\n```(?:python|text)\n(.*?)\n```$"
for name, digest, content in re.findall(pattern, source, re.M | re.S):
    rel = Path(name)
    assert not rel.is_absolute() and '..' not in rel.parts
    data = (content + '\n').encode()
    assert hashlib.sha256(data).hexdigest() == digest
    output = folder / rel
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(data)
    print(output)
```

### Arquivo: root/probes.py

SHA-256: 4ed80413f1234f82cb2e85bbde013fdeb5758d24c1cdf935498db8dfaa296543

```python
"""Small exact probes for the R(3,10) research memo; Python standard library."""
from collections import Counter
from functools import lru_cache
from itertools import combinations, permutations
from pathlib import Path
import hashlib
import json
import random

OUT = Path(__file__).resolve().parent
PERMS = list(permutations(range(3)))

def has_perfect(rows):
    return any(all(rows[i] >> p[i] & 1 for i in range(3)) for p in PERMS)

def matching(rows, amask=7, bmask=7):
    aa = [i for i in range(3) if amask >> i & 1]
    def visit(pos, used):
        if pos == len(aa):
            return 0
        best = visit(pos + 1, used)
        allowed = rows[aa[pos]] & bmask & ~used
        while allowed:
            bit = allowed & -allowed
            allowed ^= bit
            best = max(best, 1 + visit(pos + 1, used | bit))
        return best
    return visit(0, 0)

def independent_bipartite_bruteforce(rows, amask, bmask):
    best = 0
    for aa in range(8):
        if aa & ~amask:
            continue
        forbidden = 0
        for i in range(3):
            if aa >> i & 1:
                forbidden |= rows[i]
        best = max(best, aa.bit_count() + (bmask & ~forbidden).bit_count())
    return best

def canonical(rows):
    vals = []
    trans = tuple(sum(((rows[i] >> j) & 1) << i for i in range(3)) for j in range(3))
    for source in (rows, trans):
        for pp in PERMS:
            for qq in PERMS:
                vals.append(tuple(sum(((source[pp[i]] >> qq[j]) & 1) << j
                                      for j in range(3)) for i in range(3)))
    return min(vals)

def bipartite_probe():
    counts = Counter()
    classes = {}
    checks = 0
    for code in range(512):
        rows = tuple((code >> (3*i)) & 7 for i in range(3))
        for am in range(8):
            for bm in range(8):
                val = am.bit_count() + bm.bit_count() - matching(rows, am, bm)
                assert val == independent_bipartite_bruteforce(rows, am, bm)
                checks += 1
        if not has_perfect(rows):
            continue
        f = sum(x.bit_count() for x in rows)
        counts[f] += 1
        key = canonical(rows)
        classes[key] = f
    reps = []
    for rows, f in sorted(classes.items(), key=lambda x: (x[1], x[0])):
        ad = [x.bit_count() for x in rows]
        bd = [sum(x >> j & 1 for x in rows) for j in range(3)]
        reps.append(dict(f=f, rows=list(rows), degrees_A=ad, degrees_B=bd,
                         core_row_sizes_A=[8-x for x in ad],
                         core_row_sizes_B=[8-x for x in bd]))
    return dict(labelled_perfect_matching_by_f=dict(sorted(counts.items())),
                unlabelled_by_f=dict(sorted(Counter(classes.values()).items())),
                total_labelled=sum(counts.values()), total_classes=len(classes),
                exact_matching_identity_checks=checks, representatives=reps)

def independent_masks(adj):
    masks = [0]
    for v, nv in enumerate(adj):
        masks += [s | (1 << v) for s in masks if not s & nv]
    return masks

def alpha_exact(adj):
    @lru_cache(None)
    def solve(s):
        if not s:
            return 0
        vs = [i for i in range(len(adj)) if s >> i & 1]
        v = max(vs, key=lambda i: (adj[i] & s).bit_count())
        bit = 1 << v
        return max(solve(s ^ bit), 1 + solve(s & ~bit & ~adj[v]))
    return solve((1 << len(adj)) - 1)

def factor_alpha(hadj, frows, ar, br, cr, omit_matching=False):
    best = 0
    for I in independent_masks(hadj):
        am = sum((not (s & I)) << i for i, s in enumerate(ar))
        bm = sum((not (s & I)) << i for i, s in enumerate(br))
        cc = sum(not (s & I) for s in cr)
        nu = 0 if omit_matching else matching(frows, am, bm)
        fixed = max(2, 1 + am.bit_count(), 1 + bm.bit_count(),
                    cc + am.bit_count() + bm.bit_count() - nu)
        best = max(best, I.bit_count() + fixed)
    return best

def build_graph(hadj, frows, ar, br, cr):
    # x=0, y=1, A=2..4, B=5..7, C=8.., H afterwards
    c = len(cr)
    off = 8 + c
    adj = [0] * (off + len(hadj))
    def add(u, v):
        adj[u] |= 1 << v
        adj[v] |= 1 << u
    for i in range(3):
        add(0, 2+i)
        add(1, 5+i)
    for j in range(c):
        add(0, 8+j)
        add(1, 8+j)
    for i in range(3):
        for j in range(3):
            if frows[i] >> j & 1:
                add(2+i, 5+j)
    for u, row in enumerate(ar + br + cr, 2):
        # A/B contiguous, then C.
        for v in range(len(hadj)):
            if row >> v & 1:
                add(u, off+v)
    for u in range(len(hadj)):
        for v in range(u):
            if hadj[u] >> v & 1:
                add(off+u, off+v)
    return adj

def oracle_controls():
    rng = random.Random(3102026)
    wrong_mutation = 0
    samples = []
    for trial in range(240):
        n = 4 + trial % 3
        hadj = [0] * n
        for u in range(n):
            for v in range(u):
                if rng.random() < 0.32 and not (hadj[u] & hadj[v]):
                    hadj[u] |= 1 << v
                    hadj[v] |= 1 << u
        ims = independent_masks(hadj)
        frows = tuple(rng.randrange(8) for _ in range(3))
        ar = [rng.choice(ims) for _ in range(3)]
        br = []
        for j in range(3):
            forbidden = 0
            for i in range(3):
                if frows[i] >> j & 1:
                    forbidden |= ar[i]
            br.append(rng.choice([s for s in ims if not s & forbidden]))
        cr = [rng.choice(ims) for _ in range(1 + trial % 3)]
        g = build_graph(hadj, frows, ar, br, cr)
        assert all(not (g[u] & g[v]) for u in range(len(g))
                   for v in range(u) if g[u] >> v & 1)
        direct = alpha_exact(tuple(g))
        factor = factor_alpha(hadj, frows, ar, br, cr)
        assert direct == factor, (trial, direct, factor)
        if factor_alpha(hadj, frows, ar, br, cr, True) != direct:
            wrong_mutation += 1
        if trial < 5:
            samples.append(dict(trial=trial, n=len(g), alpha=direct, F=frows))
    return dict(seed=3102026, triangle_free_graphs_checked=240,
                exact_alpha_agreements=240,
                broken_matching_term_detected=wrong_mutation, samples=samples)

def circulants():
    counts = Counter()
    first = {}
    for half in combinations(range(1,20),4):
        steps = set(half) | {40-x for x in half} | {20}
        if any((a-b) % 40 in steps for a in steps for b in steps):
            continue
        profile = [(t, len(steps & {(t+x) % 40 for x in steps}))
                   for t in range(1,40) if t not in steps]
        low = min(x[1] for x in profile)
        high = max(x[1] for x in profile)
        counts[(low, high)] += 1
        if low >= 1 and high not in first:
            first[high] = (half, steps, profile)
    bestcap = min(first)
    half, steps, profile = first[bestcap]
    adj = tuple(sum(1 << ((i+s) % 40) for s in steps) for i in range(40))
    val = alpha_exact(adj)
    control = dict(n=40, degree=9, steps=sorted(steps), positive_generators=list(half),
                   codegree_min=min(c for _,c in profile), codegree_max=bestcap,
                   alpha=val, root_codegree_histogram=dict(sorted(Counter(c for _,c in profile).items())),
                   adjacency_masks=list(adj))
    return dict(labelled_generator_choices=3876,
                triangle_free_choices=sum(counts.values()),
                profiles={str(k):v for k,v in sorted(counts.items())}, control=control)

def main():
    result = dict(bipartite=bipartite_probe(), oracle=oracle_controls(), circulants=circulants())
    text = json.dumps(result, indent=2, sort_keys=True)
    (OUT/'results.json').write_text(text+'\n')
    print(text)
    print('SCRIPT_SHA256',hashlib.sha256(Path(__file__).read_bytes()).hexdigest())

if __name__ == '__main__':
    main()
```

### Arquivo: root/matching_probe.py

SHA-256: 35c534321287050823c981cb74298654e5947e025201e254ea8dbbcd2032eb0d

```python
"""Auxiliary-matching optimization on a 40-vertex positive control.
Only the perfect matching changes; the graph never changes.
"""
from itertools import combinations
from pathlib import Path
import hashlib
import json
import random
import time

OUT=Path(__file__).resolve().parent
N=40
STEPS=(1,5,9,12,20,28,31,35,39)
ADJ=[{(v+s)%N for s in STEPS} for v in range(N)]

def double(e,f):
    a,b=e;c,d=f
    return (c in ADJ[a] and d in ADJ[b]) or (d in ADJ[a] and c in ADJ[b])

def score(M):
    return sum(double(e,f) for e,f in combinations(M,2))

def random_matching(rng):
    def visit(rem):
        if not rem:
            return []
        v=min(rem,key=lambda x:len(ADJ[x]&rem))
        cand=list(ADJ[v]&rem);rng.shuffle(cand)
        for w in cand:
            tail=visit(rem-{v,w})
            if tail is not None:
                return [(v,w)]+tail
        return None
    M=visit(set(range(N)))
    assert M is not None
    return M

def improve(M):
    M=list(M);steps=0
    while True:
        best=None
        for i,j in combinations(range(len(M)),2):
            a,b=M[i];c,d=M[j]
            for ee,ff in [((a,c),(b,d)),((a,d),(b,c))]:
                if ee[1] not in ADJ[ee[0]] or ff[1] not in ADJ[ff[0]]:
                    continue
                delta=sum(int(double(ee,g))+int(double(ff,g))
                          -int(double(M[i],g))-int(double(M[j],g))
                          for k,g in enumerate(M) if k not in (i,j))
                if delta>0 and (best is None or delta>best[0]):
                    best=(delta,i,j,ee,ff)
        if best is None:
            return M,steps
        delta,i,j,ee,ff=best
        old=score(M)
        M[i]=ee;M[j]=ff
        assert score(M)==old+delta
        steps+=1

def stats(M):
    links=[set() for _ in M]
    d=score(M)
    for i,j in combinations(range(len(M)),2):
        if double(M[i],M[j]):links[i].add(j);links[j].add(i)
    unseen=set(range(len(M)));components=0
    while unseen:
        components+=1
        stack=[unseen.pop()]
        while stack:
            for v in links[stack.pop()]&unseen:
                unseen.remove(v);stack.append(v)
    return dict(double_links=d,single_links=160-2*d,
                cycle_rank_of_double_links=d-20+components,
                double_degrees=sorted(map(len,links)))

def main():
    started=time.perf_counter();rng=random.Random(3102026)
    records=[];best=None
    antipodal=[(i,i+20) for i in range(20)]
    for t in range(65):
        M=antipodal if t==0 else random_matching(rng)
        before=stats(M)
        improved,changes=improve(M)
        after=stats(improved)
        records.append(dict(trial=t,before=before['double_links'],
                            after=after['double_links'],switches=changes))
        if best is None or after['double_links']>best['stats']['double_links']:
            best=dict(trial=t,matching=improved,stats=after)
    result=dict(seed=3102026,graph_steps=STEPS,initial_antipodal=stats(antipodal),
                trials=65,before_range=[min(r['before'] for r in records),max(r['before'] for r in records)],
                after_range=[min(r['after'] for r in records),max(r['after'] for r in records)],
                total_improving_flips=sum(r['switches'] for r in records),
                best=best,records=records,
                claim='local optima under alternating 4-cycle flips, not certified global optima',
                seconds=round(time.perf_counter()-started,4))
    (OUT/'matching_results.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k!='records'},indent=2))
    print('SCRIPT_SHA256',hashlib.sha256(Path(__file__).read_bytes()).hexdigest())

if __name__=='__main__':main()
```

### Arquivo: cover/check_obstructions.py

SHA-256: 6ca4c32aaafa71027e3b21873bcdf5c790a6b017b0adf6c0dd42cd12a44e505c

```python
"""Second, direct exhaustive checker for two trace obstructions.

No import of the pilot encoders. For each completion, test the actual graph
for a triangle and then for an independent five-set using adjacency masks.
"""
from itertools import combinations
import json
from pathlib import Path

PATTERNS = {'A':[1,2,3,4,5,9,10,14], 'B':[1,2,3,4,5,9,10,12]}


def direct_check(traces):
    root_size=4
    order=root_size+len(traces)
    mandatory=[]
    for outside,trace in enumerate(traces,root_size):
        for root in range(root_size):
            if trace>>root&1:mandatory.append((root,outside))
    free=[(left+root_size,right+root_size) for left,right in combinations(range(len(traces)),2)
          if traces[left]&traces[right]==0]
    triangles=0
    independent=0
    models=[]
    witnesses=[]
    five_sets=list(combinations(range(order),5))
    for assignment in range(1<<len(free)):
        neighbors=[0]*order
        for left,right in mandatory+[edge for index,edge in enumerate(free) if assignment>>index&1]:
            neighbors[left]|=1<<right
            neighbors[right]|=1<<left
        triangle=next(((left,right) for left in range(order) for right in range(left)
                       if neighbors[left]>>right&1 and neighbors[left]&neighbors[right]),None)
        if triangle is not None:
            triangles+=1
            continue
        witness=next((subset for subset in five_sets
                      if all(not(neighbors[left]>>right&1) for left,right in combinations(subset,2))),None)
        if witness is None:models.append(assignment)
        else:
            independent+=1
            witnesses.append((assignment,list(witness)))
    return {'traces':traces,'vertices':order,'free_edges':free,'assignments':1<<len(free),
            'assignments_with_triangle':triangles,'triangle_free_with_independent_five':independent,
            'counterexamples':models,'witnesses':witnesses}


def unit_proof(traces):
    order=4+len(traces)
    fixed={tuple(sorted((root,outside+4))) for outside,trace in enumerate(traces)
           for root in range(4) if trace>>root&1}
    free=[(left+4,right+4) for left,right in combinations(range(len(traces)),2)
          if traces[left]&traces[right]==0]
    variables={edge:index+1 for index,edge in enumerate(free)}
    clauses={}
    for subset in combinations(range(order),5):
        pairs=list(combinations(subset,2))
        if any(pair in fixed for pair in pairs):continue
        clause=frozenset(variables[pair] for pair in pairs if pair in variables)
        clauses.setdefault(clause,{'kind':'independent_five','vertices':list(subset)})
    for subset in combinations(range(order),3):
        pairs=list(combinations(subset,2))
        if any(pair not in fixed and pair not in variables for pair in pairs):continue
        clause=frozenset(-variables[pair] for pair in pairs if pair in variables)
        clauses.setdefault(clause,{'kind':'triangle','vertices':list(subset)})
    assignments={}
    steps=[]
    while True:
        progress=False
        for clause,reason in clauses.items():
            if any(assignments.get(abs(literal))==(literal>0) for literal in clause):continue
            remaining=[literal for literal in clause if abs(literal) not in assignments]
            if not remaining:
                return {'result':'contradiction','free_edges':free,'steps':steps,'final_clause':dict(reason)}
            if len(remaining)==1:
                literal=remaining[0]
                assignments[abs(literal)]=literal>0
                steps.append({'edge':list(free[abs(literal)-1]),'present':literal>0,'reason':reason})
                progress=True
        if not progress:return {'result':'stuck','free_edges':free,'steps':steps,
                                'unassigned':len(free)-len(assignments)}


if __name__=='__main__':
    results={}
    for name,traces in PATTERNS.items():
        check=direct_check(traces)
        assert not check['counterexamples']
        deletions=[]
        for index in range(len(traces)):
            deletion=direct_check(traces[:index]+traces[index+1:])
            assert deletion['counterexamples']
            deletions.append(len(deletion['counterexamples']))
        proof=unit_proof(traces)
        results[name]={'direct':check,'single_deletion_feasible_counts':deletions,'unit_proof':proof}
        print(name,{key:value for key,value in check.items() if key!='witnesses'},flush=True)
        print(name,'deletions',deletions,'unit_proof',proof,flush=True)
    Path(__file__).with_name('obstruction_checks.json').write_text(json.dumps(results,indent=2)+'\n')
```

### Arquivo: cover/check_overlap.py

SHA-256: dd356a0ea32aeff7f9f3a7f6322c0af9bb2496b06889c9059d1f6fbc8eccd140

```python
"""Reproduce the overlap conflict and the third portable trace obstruction.

Only Python's standard library is used. This code constructs actual graphs;
it does not import the MILP or card-domain encoders used for discovery.
An outside trace is exact in the entire specified independent root.
"""
from itertools import combinations
import json
from pathlib import Path


def census(root_size, traces):
    order = root_size + len(traces)
    fixed = [(root, root_size + index)
             for index, trace in enumerate(traces)
             for root in range(root_size) if trace >> root & 1]
    free = [(root_size + left, root_size + right)
            for left, right in combinations(range(len(traces)), 2)
            if not traces[left] & traces[right]]
    targets = list(combinations(range(order), root_size + 1))
    counts = {'triangle': 0, f'independent{root_size + 1}': 0,
              'counterexample': 0}
    models = []
    for assignment in range(1 << len(free)):
        neighbors = [0] * order
        for left, right in fixed + [edge for bit, edge in enumerate(free)
                                   if assignment >> bit & 1]:
            neighbors[left] |= 1 << right
            neighbors[right] |= 1 << left
        if any(neighbors[left] >> right & 1 and
               neighbors[left] & neighbors[right]
               for left, right in combinations(range(order), 2)):
            counts['triangle'] += 1
        elif any(all(not neighbors[left] >> right & 1
                     for left, right in combinations(vertices, 2))
                 for vertices in targets):
            counts[f'independent{root_size + 1}'] += 1
        else:
            counts['counterexample'] += 1
            models.append(assignment)
    return {'traces': traces, 'root_size': root_size, 'vertices': order,
            'free_edges': free, 'assignments': 1 << len(free),
            'results': counts, 'models': models}


if __name__ == '__main__':
    folder = Path(__file__).parent
    third = census(5, [4, 7, 7, 10, 12, 16, 20, 18, 26])
    assert third['results'] == {'triangle': 128, 'independent6': 896,
                               'counterexample': 0}
    third.pop('models')
    (folder / 'third_pattern_check.json').write_text(
        json.dumps(third, indent=2) + '\n')
    print('third pattern', third['results'])

    overlap = []
    cases = [('left', [1, 4, 7, 7, 8, 10, 12], (5, 9), 3, [1]),
             ('right', [2, 4, 5, 6, 8, 9, 10, 13], (4, 6), 10, [0])]
    for name, traces, marked, expected_count, expected_values in cases:
        result = census(4, traces)
        bit = result['free_edges'].index(marked)
        values = sorted({assignment >> bit & 1
                         for assignment in result['models']})
        assert len(result['models']) == expected_count
        assert values == expected_values
        record = {'name': name, 'traces': traces,
                  'free_edges': result['free_edges'],
                  'assignments': result['assignments'],
                  'valid_completions': result['models'],
                  'marked_edge': marked, 'marked_edge_values': values}
        overlap.append(record)
        print(name, 'valid completions', len(result['models']),
              'marked edge values', values)
    (folder / 'overlap_circuit_check.json').write_text(
        json.dumps(overlap, indent=2) + '\n')
```

### Arquivo: global/codegree_cliques.py

SHA-256: 1a96101495116c05dd3fe55dc9b765e6609d6f0084fb06ab2a548e3c9eab1bb5

```python
"""Small exact calculations for independent roots in a hypothetical (3,10;40).

All arithmetic is integral.  No graph census or SAT solver is used.
The alpha<=9 assumptions are necessary conditions, not an existence claim.
Run: python codegree_cliques.py
"""
from collections import Counter
from itertools import combinations, product
import json
from pathlib import Path

OUT = Path(__file__).resolve().parent


def subsets(k, size):
    return [sum(1 << i for i in c) for c in combinations(range(k), size)]


def mobius_cells(intersections, k):
    """Exact-trace cells from common-neighbour intersection cardinalities."""
    cells = {}
    for mask in sorted(range(1, 1 << k), key=int.bit_count, reverse=True):
        cells[mask] = intersections[mask] - sum(
            v for sup, v in cells.items() if sup & mask == mask
        )
    return cells


def four_root_rows():
    result = []
    for triples in product(range(6), repeat=4):
        for q in range(5):
            ints = {15: q}
            ints.update({15 ^ (1 << i): triples[i] for i in range(4)})
            ints.update({m: 5 for m in subsets(4, 2)})
            ints.update({1 << i: 9 for i in range(4)})
            cells = mobius_cells(ints, 4)
            if min(cells.values()) < 0:
                continue
            exterior = 36 - sum(cells.values())
            if not 0 <= exterior <= 17:
                continue
            result.append({"triples": triples, "quadruple": q,
                           "exterior": exterior, "cells": cells})
    assert len(result) == 5
    assert {(tuple(sorted(r["triples"])), r["quadruple"], r["exterior"])
            for r in result} == {((4, 4, 4, 4), 3, 17),
                                 ((4, 4, 4, 5), 4, 17)}
    return result


def five_root_rows():
    triples = subsets(5, 3)
    quadruples = subsets(5, 4)
    result = []
    for bits in range(1 << len(triples)):
        ints = {m: 4 + ((bits >> i) & 1) for i, m in enumerate(triples)}
        for q in quadruples:
            five_count = sum(ints[t] == 5 for t in triples if t & q == t)
            if five_count > 1:
                break
            ints[q] = 3 + five_count
        else:
            for r in range(5):
                full = {**ints, 31: r}
                full.update({m: 5 for m in subsets(5, 2)})
                full.update({1 << i: 9 for i in range(5)})
                cells = mobius_cells(full, 5)
                if min(cells.values()) < 0:
                    continue
                exterior = 35 - sum(cells.values())
                if not 0 <= exterior <= 13:
                    continue
                result.append({"fivefold": r, "exterior": exterior,
                               "cells": cells})
    assert len(result) == 1
    row = result[0]
    assert row["fivefold"] == 2 and row["exterior"] == 13
    assert all(v == {1: 3, 2: 0, 3: 0, 4: 1, 5: 2}[m.bit_count()]
               for m, v in row["cells"].items())
    return result


def six_root_rows():
    result = []
    for r in range(3):
        ints = {m: {1: 9, 2: 5, 3: 4, 4: 3, 5: 2, 6: r}[m.bit_count()]
                for m in range(1, 64)}
        cells = mobius_cells(ints, 6)
        if min(cells.values()) < 0:
            continue
        exterior = 34 - sum(cells.values())
        result.append({"sixfold": r, "exterior": exterior,
                       "passes_R34": exterior <= 8, "cells": cells})
    assert len(result) == 1
    assert result[0]["sixfold"] == 1 and result[0]["exterior"] == 9
    assert not result[0]["passes_R34"]
    return result


def circulant(n, differences):
    differences = set(differences)
    return [sum(1 << j for j in range(n) if (j - i) % n in differences)
            for i in range(n)]


def independent_sets(adj, size, candidates=None, chosen=0):
    if candidates is None:
        candidates = (1 << len(adj)) - 1
    if size == 0:
        yield chosen
        return
    while candidates:
        if candidates.bit_count() < size:
            return
        bit = candidates & -candidates
        v = bit.bit_length() - 1
        candidates ^= bit
        yield from independent_sets(adj, size - 1,
                                    candidates & ~adj[v], chosen | bit)


def graph6(line):
    data = line.strip().encode()
    n = data[0] - 63
    bits = [(v - 63 >> s) & 1 for v in data[1:] for s in range(5, -1, -1)]
    adj = [0] * n
    index = 0
    for j in range(1, n):
        for i in range(j):
            if bits[index]:
                adj[i] |= 1 << j
                adj[j] |= 1 << i
            index += 1
    return adj


def check_actual_graph(adj, alpha):
    n = len(adj)
    for i in range(n):
        assert not adj[i] >> i & 1
        for j in range(i):
            assert bool(adj[i] >> j & 1) == bool(adj[j] >> i & 1)
            if adj[i] >> j & 1:
                assert adj[i] & adj[j] == 0
    assert next(independent_sets(adj, alpha), None) is not None
    assert next(independent_sets(adj, alpha + 1), None) is None
    checked = Counter()
    for k in (3, 4):
        for rootmask in independent_sets(adj, k):
            roots = [i for i in range(n) if rootmask >> i & 1]
            ints = {}
            for mask in range(1, 1 << k):
                common = (1 << n) - 1
                for i, v in enumerate(roots):
                    if mask >> i & 1:
                        common &= adj[v]
                ints[mask] = common.bit_count()
            predicted = mobius_cells(ints, k)
            direct = Counter()
            for x in range(n):
                if rootmask >> x & 1:
                    continue
                trace = sum(1 << i for i, v in enumerate(roots) if adj[v] >> x & 1)
                direct[trace] += 1
            assert all(predicted[m] == direct[m] for m in predicted)
            assert sum(direct.values()) == n - k
            checked[k] += 1
    return {"vertices": n, "edges": sum(a.bit_count() for a in adj) // 2,
            "degrees": sorted({a.bit_count() for a in adj}), "alpha": alpha,
            "independent_root_checks": checked}


def intersecting_families(k):
    """All maximal pairwise-intersecting families of nonempty k-bit masks."""
    n = (1 << k) - 1
    graph = [sum(1 << j for j in range(n) if i != j and (i + 1) & (j + 1))
             for i in range(n)]
    result = []

    def bron_kerbosch(r, p, x):
        if not p and not x:
            result.append(r)
            return
        union = p | x
        pivot = (union & -union).bit_length() - 1
        candidates = p & ~graph[pivot] if union else p
        while candidates:
            bit = candidates & -candidates
            v = bit.bit_length() - 1
            bron_kerbosch(r | bit, p & graph[v], x & graph[v])
            p ^= bit
            x |= bit
            candidates ^= bit

    bron_kerbosch(0, (1 << n) - 1, 0)
    return result


def cap4_negative_control():
    """Exact cyclic orbit reduction on ONE fixed graph, not a graph census."""
    import numpy as np
    adj = circulant(40, {1, 5, 9, 12, 20, 28, 31, 35, 39})
    full = (1 << 40) - 1
    assert all(a.bit_count() == 9 for a in adj)
    assert all(not adj[i] & adj[j] for i in range(40)
               for j in range(i) if adj[i] >> j & 1)
    assert max((adj[i] & adj[j]).bit_count()
               for i in range(40) for j in range(i)) == 4
    result = {}
    # R(3,10-k)-1 for k=3,4,5,6 respectively.
    exterior_bounds = {3: 22, 4: 17, 5: 13, 6: 8}
    for k in (3, 4, 5, 6):
        families = intersecting_families(k)
        reps, weights = [], []
        for roots in independent_sets(adj, k - 1, full & ~adj[0] & ~1, 1):
            orbit = {((roots << j) | (roots >> (40 - j))) & full for j in range(40)}
            if roots == min(orbit):
                reps.append(roots)
                weights.append(len(orbit))
        cells = np.zeros((len(reps), 1 << k), dtype=np.int16)
        outside_failures = 0
        outside_example = None
        for z, rootmask in enumerate(reps):
            roots = [i for i in range(40) if rootmask >> i & 1]
            union = 0
            for v in roots:
                union |= adj[v]
            if 40 - k - union.bit_count() > exterior_bounds[k]:
                outside_failures += weights[z]
                if outside_example is None:
                    exterior_mask = full & ~union & ~rootmask
                    outside_example = {"roots": roots,
                                       "exterior": [v for v in range(40)
                                                    if exterior_mask >> v & 1]}
            for v in range(40):
                trace = sum(1 << i for i, x in enumerate(roots) if adj[x] >> v & 1)
                cells[z, trace] += 1
        matrix = np.zeros((1 << k, len(families)), dtype=np.int16)
        for j, family in enumerate(families):
            for trace in range(1, 1 << k):
                matrix[trace, j] = family >> (trace - 1) & 1
        maxima = (cells @ matrix).max(axis=1)
        histogram = Counter()
        for value, weight in zip(maxima, weights):
            histogram[int(value)] += weight
        assert histogram == {9: sum(weights)}
        result[k] = {"independent_root_sets": sum(weights),
                     "cyclic_orbits": len(reps), "maximal_families": len(families),
                     "intersecting_family_maximum_histogram": histogram,
                     "Ramsey_exterior_failures": outside_failures,
                     "Ramsey_exterior_example": outside_example}
    return result


def c13_two_common_rows():
    """Small cap-five K5 anchor deck, modulo 52 explicit automorphisms."""
    adj = circulant(13, {1, 5, 8, 12})
    rows = {k: list(independent_sets(adj, k)) for k in (2, 3, 4)}

    def transform(mask, multiplier, offset):
        return sum(1 << ((multiplier * i + offset) % 13)
                   for i in range(13) if mask >> i & 1)

    maps = [(a, b) for a in (1, 5, 8, 12) for b in range(13)]
    for a, b in maps:
        for i in range(13):
            assert transform(adj[i], a, b) == adj[(a * i + b) % 13]

    def key(pair):
        return min(tuple(sorted(transform(x, a, b) for x in pair)) for a, b in maps)

    pairs = [(x, y) for x, y in combinations(rows[4], 2) if not x & y]
    orbits = Counter(key(pair) for pair in pairs)
    result = []
    for pair, count in sorted(orbits.items()):
        allowed = {k: [r for r in rows[k] if all((r & c).bit_count() <= 1 for c in pair)]
                   for k in (2, 3, 4)}
        result.append({"C_rows": [[i for i in range(13) if r >> i & 1] for r in pair],
                       "unordered_pair_orbit_size": count,
                       "q_row_counts_by_size": {k: len(v) for k, v in allowed.items()},
                       "q_row_masks_by_size": allowed})
    assert len(pairs) == 221 and len(orbits) == 7
    assert sum(orbits.values()) == 221
    return {"independent_rows_by_size": {k: len(v) for k, v in rows.items()},
            "unordered_disjoint_I4_pairs": len(pairs),
            "explicit_automorphism_group_order": len(maps), "orbits": result}


def main():
    c13 = circulant(13, {1, 5, 8, 12})
    clebsch = [sum(1 << j for j in range(16) if (i ^ j).bit_count() in (1, 4))
               for i in range(16)]
    controls = {"C13": check_actual_graph(c13, 4),
                "Clebsch16": check_actual_graph(clebsch, 5)}
    for name, alpha in (("r35_13.g6", 4), ("r36_17.g6", 5)):
        path = OUT / name
        if path.exists():
            controls[name] = [check_actual_graph(graph6(line), alpha)
                              for line in path.read_text().splitlines() if line.strip()]
    result = {"four_root_labelled_rows": four_root_rows(),
              "five_root_rows": five_root_rows(), "six_root_rows": six_root_rows(),
              "positive_controls": controls,
              "cap4_negative_control": cap4_negative_control(),
              "cap5_K5_C13_deck": c13_two_common_rows()}
    (OUT / "codegree_cliques_results.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({"K4_labelled_rows": 5, "K4_types": 2, "K5_types": 1,
                      "K6_types_passing_R34": 0, "controls": controls,
                      "cap4_negative_control": result["cap4_negative_control"],
                      "cap5_K5_C13_pair_orbits": 7}, indent=2))


if __name__ == "__main__":
    main()
```

### Arquivo: global/r35_13.g6

SHA-256: eb4d3f787f07ed14c0a82a83bee170ed096c24b6a7e971fded185ca1a760798f

```text
Ls`?XGRQR@B`Kc
```

### Arquivo: global/r36_17.g6

SHA-256: 3286c5366ddc70f349c3f7e798d7acbc79dc026c7abe0c8f406cad41ca990361

```text
P??GaOo`XMGsIcT?pSLaGuA?
P?C?I_h`SDEQQcLAh`dU?tG?
P@oGQA?`ACcdCtDYC]Ah?goC
PG?OSAKccKGiGwJSI[@oWUA_
PGD?OkeO_WAEGQobP_s`cgU?
Ps`A?WIDGeCdGsQEKK?oLL_O
Ps`A?_KChFCiBoQSKCOoXL_O
```

### Arquivo: overlap/experiment.py

SHA-256: 9b397b156f1bafdab35cd343fbe9f63482738189dcb7d8b45084c94d1dd686d2

```python
#!/usr/bin/env python3
"""Small exact experiments on matching phases and overlapping graph charts.

Standard library only. No Ramsey search or catalogue enumeration is performed.
The optional graph39.g6 is a single public positive-control graph.
"""

from collections import Counter, defaultdict, deque
from itertools import combinations, product
from pathlib import Path
import hashlib
import json
import time


HERE = Path(__file__).resolve().parent


def adjacency(order, edges):
    rows = [0] * order
    for u, v in edges:
        if u == v or not (0 <= u < order and 0 <= v < order):
            raise ValueError("Invalid simple-graph edge")
        rows[u] |= 1 << v
        rows[v] |= 1 << u
    return rows


def graph6_read(text):
    line = text.strip()
    if line.startswith(">>graph6<<"):
        line = line[len(">>graph6<<"):]
    order = ord(line[0]) - 63
    if not 0 <= order <= 62:
        raise ValueError("This experiment supports short graph6 only")
    bits = []
    for character in line[1:]:
        value = ord(character) - 63
        if not 0 <= value < 64:
            raise ValueError("Invalid graph6 character")
        bits.extend((value >> shift) & 1 for shift in range(5, -1, -1))
    if len(bits) < order * (order - 1) // 2:
        raise ValueError("Truncated graph6")
    edges = []
    position = 0
    for v in range(1, order):
        for u in range(v):
            if bits[position]:
                edges.append((u, v))
            position += 1
    return adjacency(order, edges)


def graph_facts(rows):
    order = len(rows)
    edges = sum(row.bit_count() for row in rows) // 2
    triangles = 0
    codegrees = Counter()
    for u, v in combinations(range(order), 2):
        common = (rows[u] & rows[v]).bit_count()
        if rows[u] & (1 << v):
            triangles += common
        else:
            codegrees[common] += 1
    return {
        "vertices": order,
        "edges": edges,
        "degree_histogram": dict(sorted(Counter(row.bit_count() for row in rows).items())),
        "triangles": triangles // 3,
        "nonadjacent_codegree_histogram": dict(sorted(codegrees.items())),
    }


def independent_sets(rows, collect_sizes=()):
    counts = Counter()
    collected = {size: [] for size in collect_sizes}
    largest = ()

    def visit(candidates, chosen):
        nonlocal largest
        size = len(chosen)
        counts[size] += 1
        if size in collected:
            collected[size].append(chosen)
        if size > len(largest):
            largest = chosen
        while candidates:
            bit = candidates & -candidates
            candidates ^= bit
            vertex = bit.bit_length() - 1
            visit(candidates & ~rows[vertex], chosen + (vertex,))

    visit((1 << len(rows)) - 1, ())
    return dict(sorted(counts.items())), largest, collected


def two_lift(order, edges, phases):
    lifted = []
    for index, (u, v) in enumerate(edges):
        phase = (phases >> index) & 1
        for bit in (0, 1):
            lifted.append((2 * u + bit, 2 * v + (bit ^ phase)))
    return adjacency(2 * order, lifted)


def gf2_reduce(equations):
    """Return consistency, rank and an XOR contradiction over original rows."""
    pivots = {}
    for index, (mask, rhs) in enumerate(equations):
        provenance = 1 << index
        while mask:
            pivot = mask.bit_length() - 1
            if pivot not in pivots:
                pivots[pivot] = (mask, rhs, provenance)
                break
            old_mask, old_rhs, old_provenance = pivots[pivot]
            mask ^= old_mask
            rhs ^= old_rhs
            provenance ^= old_provenance
        if not mask and rhs:
            used = [i for i in range(len(equations)) if provenance & (1 << i)]
            check_mask = 0
            check_rhs = 0
            for i in used:
                check_mask ^= equations[i][0]
                check_rhs ^= equations[i][1]
            assert check_mask == 0 and check_rhs == 1
            return False, len(pivots), used
    return True, len(pivots), []


def cube_charts():
    edges = [(u, v) for u, v in combinations(range(8), 2) if (u ^ v).bit_count() == 1]
    edge_indices = {edge: i for i, edge in enumerate(edges)}
    faces = []
    for coordinate in range(3):
        for value in (0, 1):
            vertices = [v for v in range(8) if ((v >> coordinate) & 1) == value]
            face_edges = [edge_indices[(u, v)] for u, v in combinations(vertices, 2)
                          if (u, v) in edge_indices]
            assert len(face_edges) == 4
            faces.append({"vertices": vertices, "edges": face_edges})

    def local_signatures(parity_word):
        signatures = []
        for face_id, face in enumerate(faces):
            signatures.append({edge: ((parity_word >> face_id) & 1) if i == 0 else 0
                               for i, edge in enumerate(face["edges"])})
        return signatures

    def whole_system(signatures):
        variable = len(edges)
        orientations = {}
        for face_id, face in enumerate(faces):
            for vertex in face["vertices"]:
                orientations[(face_id, vertex)] = variable
                variable += 1
        equations = []
        for face_id, face in enumerate(faces):
            for edge_id in face["edges"]:
                u, v = edges[edge_id]
                mask = ((1 << edge_id) | (1 << orientations[(face_id, u)])
                        | (1 << orientations[(face_id, v)]))
                equations.append((mask, signatures[face_id][edge_id]))
        return equations

    def every_pair_compatible(signatures):
        for first, second in combinations(range(6), 2):
            shared = set(faces[first]["vertices"]) & set(faces[second]["vertices"])
            variables = {vertex: i for i, vertex in enumerate(sorted(shared))}
            equations = []
            for edge_id in set(faces[first]["edges"]) & set(faces[second]["edges"]):
                u, v = edges[edge_id]
                mask = (1 << variables[u]) | (1 << variables[v])
                equations.append((mask, signatures[first][edge_id] ^ signatures[second][edge_id]))
            if not gf2_reduce(equations)[0]:
                return False
        return True

    distribution = Counter()
    for phases in range(1 << len(edges)):
        face_word = 0
        for face_id, face in enumerate(faces):
            parity = sum((phases >> edge_id) & 1 for edge_id in face["edges"]) % 2
            face_word |= parity << face_id
        distribution[face_word] += 1
        assert face_word.bit_count() % 2 == 0

    accepted_pairs = []
    accepted_global = []
    for word in range(64):
        signatures = local_signatures(word)
        if every_pair_compatible(signatures):
            accepted_pairs.append(word)
        consistent, rank, _ = gf2_reduce(whole_system(signatures))
        if consistent:
            accepted_global.append(word)
        assert consistent == (word in distribution)
        assert rank == 23

    phantom = local_signatures(1)
    equations = whole_system(phantom)
    consistent, rank, certificate = gf2_reduce(equations)
    assert not consistent
    local_controls = []
    for face_id, face in enumerate(faces):
        vertex_map = {vertex: i for i, vertex in enumerate(face["vertices"])}
        local_edges = [(vertex_map[edges[e][0]], vertex_map[edges[e][1]]) for e in face["edges"]]
        phases = sum(phantom[face_id][e] << i for i, e in enumerate(face["edges"]))
        graph = two_lift(4, local_edges, phases)
        counts, largest, _ = independent_sets(graph)
        facts = graph_facts(graph)
        assert facts["triangles"] == 0 and len(largest) == 4
        local_controls.append({"face": face_id, "alpha": len(largest), "facts": facts})

    valid_controls = []
    for phases in (0, 1, 7, 31, 341, 1365, 2730, 4095):
        graph = two_lift(8, edges, phases)
        counts, largest, _ = independent_sets(graph)
        facts = graph_facts(graph)
        assert facts["triangles"] == 0 and facts["degree_histogram"] == {3: 16}
        assert len(largest) == 8
        valid_controls.append({"phases": phases, "alpha": len(largest), "facts": facts})

    return {
        "physical_edge_signings_enumerated": 4096,
        "local_face_parity_patterns": 64,
        "patterns_passing_all_pairwise_chart_checks": len(accepted_pairs),
        "patterns_with_a_global_lift": len(accepted_global),
        "global_signings_per_realizable_pattern": sorted(set(distribution.values())),
        "phantom_parity_word": "000001",
        "global_equations": len(equations),
        "global_variables": 36,
        "coefficient_rank": rank,
        "contradiction_certificate_row_indices": certificate,
        "contradiction_is_xor_of_all_rows": certificate == list(range(len(equations))),
        "local_graph_controls": local_controls,
        "global_graph_controls": valid_controls,
    }


def three_chart_single_ports():
    """Three locally valid matching-cell charts, pairwise consistent but ungluable."""
    pairs = [(0, 1), (1, 2), (0, 2)]
    outcomes = Counter()
    for ports in range(8):
        word = sum((((ports >> i) ^ (ports >> j)) & 1) << c
                   for c, (i, j) in enumerate(pairs))
        outcomes[word] += 1
    accepted = []
    for word in range(8):
        equations = []
        for chart, (i, j) in enumerate(pairs):
            equations.append(((1 << i) | (1 << (3+chart)), 0))
            equations.append(((1 << j) | (1 << (3+chart)), (word >> chart) & 1))
        consistent, rank, certificate = gf2_reduce(equations)
        assert rank == 5
        assert consistent == (word in outcomes)
        if consistent:
            accepted.append(word)
        if word == 7:
            phantom_certificate = certificate
            assert certificate == list(range(6))
    local = adjacency(6, [(0, 1), (2, 3), (4, 5), (0, 2), (1, 4)])
    _, maximum, _ = independent_sets(local)
    assert graph_facts(local)["triangles"] == 0 and len(maximum) == 3
    return {"patterns_passing_pairwise_checks": 8, "globally_realizable_patterns": len(accepted),
            "physical_port_assignments_enumerated": 8, "phantom_parities": [1, 1, 1],
            "global_equations": 6, "global_variables": 6, "coefficient_rank": 5,
            "contradiction_certificate_row_indices": phantom_certificate,
            "local_phantom_graph": "P6", "local_alpha": len(maximum),
            "local_facts": graph_facts(local)}


def pentagon_transversals():
    edges = [(0, 1), (1, 2), (2, 3), (3, 4), (0, 4)]
    outcomes = Counter()
    histograms = set()
    controls = []
    for phases in range(32):
        graph = two_lift(5, edges, phases)
        counts, largest, _ = independent_sets(graph)
        facts = graph_facts(graph)
        equations = [((1 << u) | (1 << v), 1 ^ ((phases >> index) & 1))
                     for index, (u, v) in enumerate(edges)]
        consistent, _, _ = gf2_reduce(equations)
        explicit = []
        for choices in product((0, 1), repeat=5):
            selected = [2 * i + choice for i, choice in enumerate(choices)]
            if all(not (graph[u] & (1 << v)) for u, v in combinations(selected, 2)):
                explicit.append(selected)
        assert consistent == bool(explicit)
        assert consistent == bool(phases.bit_count() % 2)
        assert len(largest) == (5 if consistent else 4)
        histograms.add(json.dumps(facts, sort_keys=True))
        outcomes[(phases.bit_count() % 2, len(largest), consistent)] += 1
        if phases in (0, 1):
            controls.append({"phases": phases, "alpha": len(largest), "facts": facts,
                             "independent_transversals": explicit,
                             "all_independent_set_counts": counts})
    assert len(histograms) == 1
    return {
        "signings_enumerated": 32,
        "distinct_degree_triangle_codegree_summaries": len(histograms),
        "outcomes": [{"cycle_phase": key[0], "alpha": key[1],
                      "has_independent_transversal": key[2], "count": value}
                     for key, value in sorted(outcomes.items())],
        "controls": controls,
    }


def triangle_lifts():
    """Physical matching signs are allowed odd cycle parity, unlike frame cocycles."""
    edges = [(0, 1), (1, 2), (0, 2)]
    results = []
    for phases in (0, 1):
        graph = two_lift(3, edges, phases)
        _, largest, _ = independent_sets(graph)
        results.append({"phases": phases, "alpha": len(largest), "facts": graph_facts(graph)})
    assert results[0]["facts"]["triangles"] == 2
    assert results[1]["facts"]["triangles"] == 0
    assert results[1]["alpha"] == 3
    return results


def two_sat_transversal(rows, cells):
    """Exactly decide one independent vertex from every given two-vertex cell.

    Internal cell edges are allowed: the transversal uses exactly one endpoint.
    Each physical cross-edge forbids one assignment and contributes two arcs.
    An UNSAT answer includes both implication paths between opposing literals.
    """
    flattened = [vertex for cell in cells for vertex in cell]
    assert all(len(cell) == 2 for cell in cells)
    assert len(set(flattened)) == len(flattened)
    order = 2 * len(cells)
    directed = [[] for _ in range(order)]
    reverse = [[] for _ in range(order)]
    forbidden = []
    for i, j in combinations(range(len(cells)), 2):
        for a, b in product((0, 1), repeat=2):
            if rows[cells[i][a]] & (1 << cells[j][b]):
                forbidden.append((i, a, j, b))
                for source, target in ((2*i+a, 2*j+(1-b)), (2*j+b, 2*i+(1-a))):
                    directed[source].append(target)
                    reverse[target].append(source)
    visited = set()
    finish = []

    def first(vertex):
        if vertex in visited:
            return
        visited.add(vertex)
        for target in directed[vertex]:
            first(target)
        finish.append(vertex)

    for vertex in range(order):
        first(vertex)
    component = [-1] * order

    def second(vertex, number):
        if component[vertex] >= 0:
            return
        component[vertex] = number
        for target in reverse[vertex]:
            second(target, number)

    for vertex in reversed(finish):
        if component[vertex] < 0:
            second(vertex, vertex)

    def path(source, target):
        queue = deque([source])
        previous = {source: None}
        while queue and target not in previous:
            vertex = queue.popleft()
            for neighbor in directed[vertex]:
                if neighbor not in previous:
                    previous[neighbor] = vertex
                    queue.append(neighbor)
        assert target in previous
        sequence = []
        vertex = target
        while vertex is not None:
            sequence.append(vertex)
            vertex = previous[vertex]
        sequence.reverse()
        assert all(v in directed[u] for u, v in zip(sequence, sequence[1:]))
        return [[vertex//2, vertex%2] for vertex in sequence]

    for variable in range(len(cells)):
        if component[2*variable] == component[2*variable+1]:
            return {"satisfiable": False, "clauses": len(forbidden),
                    "contradiction_variable": variable,
                    "path_0_to_1": path(2*variable, 2*variable+1),
                    "path_1_to_0": path(2*variable+1, 2*variable)}

    # Component identifiers above are vertex names, so compute a condensation
    # topological order explicitly rather than relying on incidental SCC labels.
    components = set(component)
    successors = {c: set() for c in components}
    incoming = {c: 0 for c in components}
    for u in range(order):
        for v in directed[u]:
            a, b = component[u], component[v]
            if a != b and b not in successors[a]:
                successors[a].add(b)
                incoming[b] += 1
    queue = deque(sorted(c for c in components if incoming[c] == 0))
    topological = {}
    while queue:
        c = queue.popleft()
        topological[c] = len(topological)
        for successor in sorted(successors[c]):
            incoming[successor] -= 1
            if incoming[successor] == 0:
                queue.append(successor)
    assert len(topological) == len(components)
    choices = [int(topological[component[2*i+1]] > topological[component[2*i]])
               for i in range(len(cells))]
    assert all(not (choices[i] == a and choices[j] == b) for i, a, j, b in forbidden)
    selected = [cell[choices[i]] for i, cell in enumerate(cells)]
    assert all(not (rows[u] & (1 << v)) for u, v in combinations(selected, 2))
    return {"satisfiable": True, "clauses": len(forbidden), "choices": choices,
            "selected_vertices": selected}


def exact_matching_quotient(rows, matching):
    """A triangle-free graph with an edge 1-factor has seven cross-matrix types."""
    assert sorted(vertex for pair in matching for vertex in pair) == list(range(len(rows)))
    assert all(rows[u] & (1 << v) for u, v in matching)
    assert graph_facts(rows)["triangles"] == 0
    classes = Counter()
    quotient = []
    double_links = []
    for i, j in combinations(range(len(matching)), 2):
        matrix = [[int(bool(rows[u] & (1 << v))) for v in matching[j]] for u in matching[i]]
        assert all(sum(row) <= 1 for row in matrix)
        assert all(sum(matrix[a][b] for a in (0, 1)) <= 1 for b in (0, 1))
        count = sum(map(sum, matrix))
        classes[count] += 1
        quotient.append({"cells": [i, j], "matrix": matrix})
        if count == 2:
            double_links.append([i, j, 0 if matrix[0][0] else 1])
    weighted_degrees = [0] * len(matching)
    for record in quotient:
        i, j = record["cells"]
        weight = sum(map(sum, record["matrix"]))
        weighted_degrees[i] += weight
        weighted_degrees[j] += weight
    expected = [rows[u].bit_count() + rows[v].bit_count() - 2 for u, v in matching]
    assert weighted_degrees == expected
    return {"cells": matching, "cross_matrix_counts_by_number_of_edges": dict(sorted(classes.items())),
            "double_links": double_links, "weighted_quotient_degrees": weighted_degrees,
            "cross_matrices": quotient}


def matching_quotient_controls():
    """For small valid graphs compare all cell subsets against actual stable sets."""
    q3_edges = [(u, v) for u, v in combinations(range(8), 2) if (u ^ v).bit_count() == 1]
    wagner_edges = sorted({tuple(sorted((i, (i+1) % 8))) for i in range(8)}
                          | {(i, i+4) for i in range(4)})
    clebsch_edges = [(u, v) for u, v in combinations(range(16), 2) if u ^ v in (1, 2, 4, 8, 15)]
    petersen_edges = sorted({tuple(sorted((i, (i+1) % 5))) for i in range(5)}
                            | {tuple(sorted((i+5, (i+2) % 5+5))) for i in range(5)}
                            | {(i, i+5) for i in range(5)})
    graphs = [("cube_q3", adjacency(8, q3_edges), [(i, i+4) for i in range(4)]),
              ("wagner8", adjacency(8, wagner_edges), [(i, i+4) for i in range(4)]),
              ("petersen10", adjacency(10, petersen_edges), [(i, i+5) for i in range(5)]),
              ("clebsch16", adjacency(16, clebsch_edges), [(i, i+1) for i in range(0, 16, 2)])]
    results = {}
    for name, rows, matching in graphs:
        quotient = exact_matching_quotient(rows, matching)
        counts, maximum, sets = independent_sets(rows, range(len(matching)+1))
        vertex_cell = {v: i for i, cell in enumerate(matching) for v in cell}
        realized = {sum(1 << vertex_cell[v] for v in independent)
                    for values in sets.values() for independent in values}
        sat_counts = Counter()
        representative_unsat = None
        maximum_witness = None
        for mask in range(1 << len(matching)):
            cells = [matching[i] for i in range(len(matching)) if mask & (1 << i)]
            decision = two_sat_transversal(rows, cells)
            assert decision["satisfiable"] == (mask in realized)
            if decision["satisfiable"]:
                sat_counts[len(cells)] += 1
                if maximum_witness is None or len(cells) > len(maximum_witness["cells"]):
                    maximum_witness = {"cells": cells, "decision": decision}
            elif representative_unsat is None:
                representative_unsat = {"cells": cells, "decision": decision}
        assert max(sat_counts) == len(maximum)
        results[name] = {"facts": graph_facts(rows), "alpha": len(maximum),
                         "matching_quotient": quotient, "cell_subsets_tested": 1 << len(matching),
                         "satisfiable_subsets_by_size": dict(sorted(sat_counts.items())),
                         "maximum_transversal_witness": maximum_witness,
                         "representative_unsat": representative_unsat}

    # Same real Wagner graph, deliberately chosen independent cells: dropping
    # single/three-edge matrices produces a false positive. The full 2SAT is exact.
    rows = graphs[1][1]
    cells = [(0, 2), (1, 3), (4, 6), (5, 7)]
    equations = []
    for i, j in combinations(range(4), 2):
        phase = matching_phase(rows, cells[i], cells[j])
        if phase is not None:
            equations.append(((1 << i) | (1 << j), 1 ^ phase))
    full = two_sat_transversal(rows, cells)
    assert gf2_reduce(equations)[0] and not full["satisfiable"]
    results["partial_matrix_counterexample"] = {
        "graph": "wagner8", "cells": cells, "perfect_matching_only_XOR_consistent": True,
        "number_of_XOR_equations": len(equations), "full_2SAT": full}
    return results


def stable_colors(rows):
    colors = [row.bit_count() for row in rows]
    rounds = 0
    while True:
        signatures = []
        for vertex, row in enumerate(rows):
            neighborhood = Counter(colors[u] for u in range(len(rows)) if row & (1 << u))
            signatures.append((colors[vertex], tuple(sorted(neighborhood.items()))))
        palette = {signature: i for i, signature in enumerate(sorted(set(signatures)))}
        new_colors = [palette[signature] for signature in signatures]
        rounds += 1
        if len(set(new_colors)) == len(set(colors)):
            return new_colors, rounds
        colors = new_colors


def matching_phase(rows, first, second):
    matrix = [[bool(rows[u] & (1 << v)) for v in second] for u in first]
    if any(sum(row) != 1 for row in matrix):
        return None
    if any(matrix[0][column] + matrix[1][column] != 1 for column in (0, 1)):
        return None
    return 0 if matrix[0][0] else 1


def rooted_cell_measurement(rows, roots):
    root_count = 0
    with_cells = 0
    with_matchings = 0
    with_cycles = 0
    distinct_cells = set()
    relation_frequency = Counter()
    best = None
    for root in roots:
        root_count += 1
        root_set = set(root)
        classes = defaultdict(list)
        for vertex in range(len(rows)):
            if vertex not in root_set:
                trace = sum(int(bool(rows[vertex] & (1 << anchor))) << i
                            for i, anchor in enumerate(root))
                classes[trace].append(vertex)
        cells = [tuple(vertices) for vertices in classes.values() if len(vertices) == 2
                 and not (rows[vertices[0]] & (1 << vertices[1]))]
        cells.sort()
        distinct_cells.update(cells)
        with_cells += bool(cells)
        links = []
        parent = list(range(len(cells)))

        def find(vertex):
            while parent[vertex] != vertex:
                vertex = parent[vertex]
            return vertex

        for first, second in combinations(range(len(cells)), 2):
            phase = matching_phase(rows, cells[first], cells[second])
            if phase is not None:
                links.append((first, second, phase))
                relation_frequency[(cells[first], cells[second])] += 1
                parent[find(first)] = find(second)
        components = len({find(i) for i in range(len(cells))})
        cycle_rank = len(links) - len(cells) + components
        with_matchings += bool(links)
        with_cycles += cycle_rank > 0
        score = (cycle_rank, len(links), len(cells))
        if best is None or score > tuple(best["score"]):
            best = {"root": root, "cells": cells, "matching_links": links,
                    "score": score, "cycle_rank": cycle_rank}
    return {
        "independent_roots": root_count,
        "roots_with_independent_two_vertex_cells": with_cells,
        "roots_with_perfect_matching_links": with_matchings,
        "roots_with_a_matching_cycle": with_cycles,
        "distinct_physical_two_vertex_cells": len(distinct_cells),
        "distinct_physical_matching_relations": len(relation_frequency),
        "relations_occurring_in_multiple_root_views": sum(value > 1 for value in relation_frequency.values()),
        "maximum_reuse_of_one_relation": max(relation_frequency.values(), default=0),
        "best_example": best,
    }


def graph_controls():
    clebsch_edges = [(u, v) for u, v in combinations(range(16), 2)
                     if u ^ v in (1, 2, 4, 8, 15)]
    result = {}
    graphs = {"clebsch": adjacency(16, clebsch_edges)}
    graph_path = HERE / "graph39.g6"
    if graph_path.exists():
        graphs["public_graph39"] = graph6_read(graph_path.read_text())
    for name, rows in graphs.items():
        counts, largest, roots = independent_sets(rows, (3, 4))
        colors, rounds = stable_colors(rows)
        result[name] = {
            "facts": graph_facts(rows),
            "alpha": len(largest),
            "maximum_independent_set": largest,
            "independent_set_counts": counts,
            "stable_color_classes": len(set(colors)),
            "color_refinement_rounds": rounds,
            "trivial_automorphism_group_proved_by_discrete_refinement": len(set(colors)) == len(rows),
            "three_root_views": rooted_cell_measurement(rows, roots[3]),
            "four_root_views": rooted_cell_measurement(rows, roots[4]),
        }
    assert result["clebsch"]["alpha"] == 5
    assert result["clebsch"]["facts"]["triangles"] == 0
    if "public_graph39" in result:
        assert result["public_graph39"]["alpha"] == 9
        assert result["public_graph39"]["facts"]["triangles"] == 0
        result["public_graph39"]["file_sha256"] = hashlib.sha256(graph_path.read_bytes()).hexdigest()
    return result


def main():
    start = time.perf_counter()
    result = {
        "cube_overlap_experiment": cube_charts(),
        "three_chart_single_port_experiment": three_chart_single_ports(),
        "pentagon_independence_experiment": pentagon_transversals(),
        "triangle_lift_control": triangle_lifts(),
        "matching_quotient_controls": matching_quotient_controls(),
        "rooted_positive_controls": graph_controls(),
    }
    result["runtime_seconds"] = round(time.perf_counter() - start, 3)
    destination = HERE / "results.json"
    destination.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
```

### Arquivo: overlap/graph39.g6

SHA-256: 1ca386759278ca99ed0ef86abc0760d471f291b671d54510b6e43351c9004e38

```text
fo??????OE?FAGC?_qK??_cAB_Cp???scCHYAED?ALc@KE?FAF?@pS_GO??P?IK@OAI?TC@H[AOGI?@B@O`C_p?GiKC_GJ`gCOhCF?_kD?T__@CWVwC?C?K??Nw??
```

