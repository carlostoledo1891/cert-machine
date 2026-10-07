/* uses.js — Janela's use cases, ONE definition (PRODUCT.md, "who opens it"):
   who decides, the question they bring, what they leave with, and the door into
   the app that answers it. Read by the app shell (the intro's doors), the method
   page ("para quem") and the deck — a list written three times WILL diverge.

   A door with `door: null` has no button in the app's intro (the manager reads
   the fleet answer the operation doors already open); an entry with `who: null`
   is a door only (the method page). The door ids are the ones client.js acts on.
   apps/janela · cert-machine                                             MIT */
'use strict';

const USES = [
  { door: 'alivio', label: 'Alívio', sub: 'FPSO e FSO, esta semana',
    who: 'coordenação de operações marítimas', q: 'O alívio desta FPSO pode começar, e quando?',
    gets: 'o veredito sobre a faixa medida, a folga até o limite, o limiar que viraria a decisão e, com os seus números de tanque, o aviso de ALÍVIO CRÍTICO',
    n: 'Alívio · 0–72 h', href: '/janela/#op=alivio&modo=semana' },
  { door: 'carga', label: 'Carga de PSV', sub: 'por unidade, 7 dias',
    who: 'logística offshore', q: 'Que unidade o PSV atende primeiro esta semana?',
    gets: 'as unidades pela próxima janela, a menor folga primeiro, cada uma com a semana em 29 inícios',
    n: 'Carga (PSV) · 1–7 dias', href: '/janela/#op=carga&modo=semana' },
  { door: 'campanha', label: 'Campanha', sub: 'instalar, descomissionar',
    who: 'engenharia de campanha', q: 'Quantos dias dez operações levam a partir de novembro?',
    gets: 'a campanha rodada em 32 anos de mar passado: o mar, a Tabela 4-1 e o α do local, em dias de embarcação',
    n: 'Campanha · meses', href: '/janela/#op=lancamento&modo=mes' },
  { door: 'vistoria', label: 'Conferir', sub: 'refaça uma decisão',
    who: 'vistoria (marine warranty) e SMS', q: 'Este argumento de tempo se sustenta?',
    gets: 'a Nota de decisão e o certificado .json: entradas pinadas por sha256, a regra citada, os comandos para refazer à mão',
    n: 'Conferir · por operação', href: '/janela/#site=uep-12446&op=alivio&modo=semana' },
  { door: null,
    who: 'gestão', q: 'Onde o tempo nos custa nesta semana?',
    gets: 'as unidades fora da janela pelo nome e, com a sua diária, o custo da espera até a próxima janela LIBERADA',
    n: 'Semana · a frota', href: '/janela/#op=alivio&modo=semana' },
  { door: 'placar', label: 'Placar', sub: 'previsão × satélite',
    who: 'quem duvida da previsão', q: 'Quanto essa faixa erra?',
    gets: 'o placar: cada faixa comprometida antes do mar e avaliada por satélite, em público, com a regra de admissão escrita antes',
    n: 'Placar · o registro', href: '/janela/#modo=placar' },
  { door: 'metodo', label: 'Método ↗', sub: 'fontes e limites', who: null }
];

const doors = () => USES.filter((u) => u.door);
const cases = () => USES.filter((u) => u.who);

module.exports = { USES, doors, cases };
