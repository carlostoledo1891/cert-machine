/* uses.js — Janela's use cases, ONE definition (PRODUCT.md, "who opens it"):
   who decides, the question they bring, what they leave with, and the door into
   the app that answers it. Read by the app shell (the intro's doors), the method
   page ("who it is for") and the deck — a list written three times WILL diverge.

   A door with `door: null` has no button in the app's intro (the manager reads
   the fleet answer the operation doors already open); an entry with `who: null`
   is a door only (the method page). The door ids are the ones client.js acts on.

   THE PAGES ARE ENGLISH since 2026-10-30 (the operator: no more pt-BR pages).
   Each entry's `en` holds its English words; the deck went English too on
   2026-10-31 (it was never sent) and calls cases('en'). The Portuguese words
   stay as each entry's base, read by nothing published today.
   apps/janela · cert-machine                                             MIT */
'use strict';

const USES = [
  { door: 'alivio', label: 'Alívio', sub: 'FPSO e FSO, esta semana',
    who: 'coordenação de operações marítimas', q: 'O alívio desta FPSO pode começar, e quando?',
    gets: 'o veredito sobre a faixa medida, a folga até o limite, o limiar que viraria a decisão e, com os seus números de tanque, o aviso de ALÍVIO CRÍTICO',
    n: 'Alívio · 0–72 h', href: '/janela/#op=alivio&modo=semana',
    en: { label: 'Offloading', sub: 'FPSO and FSO, this week',
      who: 'marine operations coordination', q: 'Can this FPSO\'s offloading start, and when?',
      gets: 'the verdict over the measured band, the margin to the limit, the threshold that would flip the decision and, with your tank numbers, the CRITICAL OFFLOADING warning',
      n: 'Offloading · 0–72 h' } },
  { door: 'carga', label: 'Carga de PSV', sub: 'por unidade, 7 dias',
    who: 'logística offshore', q: 'Que unidade o PSV atende primeiro esta semana?',
    gets: 'as unidades pela próxima janela, a menor folga primeiro, cada uma com a semana em 29 inícios',
    n: 'Carga (PSV) · 1–7 dias', href: '/janela/#op=carga&modo=semana',
    en: { label: 'PSV cargo', sub: 'per unit, 7 days',
      who: 'offshore logistics', q: 'Which unit does the PSV serve first this week?',
      gets: 'the units by their next window, the smallest margin first, each with the week in 29 starts',
      n: 'Cargo (PSV) · 1–7 days' } },
  { door: 'campanha', label: 'Campanha', sub: 'instalar, descomissionar',
    who: 'engenharia de campanha', q: 'Quantos dias dez operações levam a partir de novembro?',
    gets: 'a campanha rodada em 32 anos de mar passado: o mar, a Tabela 4-1 e o α do local, em dias de embarcação',
    n: 'Campanha · meses', href: '/janela/#op=lancamento&modo=mes',
    en: { label: 'Campaign', sub: 'install, decommission',
      who: 'campaign engineering', q: 'How many days do ten operations take from November on?',
      gets: 'the campaign run over 32 years of past sea: the sea, Table 4-1 and the site\'s α, in vessel days',
      n: 'Campaign · months' } },
  { door: 'vistoria', label: 'Conferir', sub: 'refaça uma decisão',
    who: 'vistoria (marine warranty) e SMS', q: 'Este argumento de tempo se sustenta?',
    gets: 'a Nota de decisão e o certificado .json: entradas pinadas por sha256, a regra citada, os comandos para refazer à mão',
    n: 'Conferir · por operação', href: '/janela/#site=uep-12446&op=alivio&modo=semana',
    en: { label: 'Check', sub: 'redo a decision',
      who: 'marine warranty survey and HSE', q: 'Does this weather argument hold?',
      gets: 'the decision note and the .json certificate: inputs pinned by sha256, the rule cited, the commands to redo it by hand',
      n: 'Check · per operation' } },
  { door: null,
    who: 'gestão', q: 'Onde o tempo nos custa nesta semana?',
    gets: 'as unidades fora da janela pelo nome e, com a sua diária, o custo da espera até a próxima janela LIBERADA',
    n: 'Semana · a frota', href: '/janela/#op=alivio&modo=semana',
    en: { who: 'management', q: 'Where is the weather costing us this week?',
      gets: 'the units outside the window by name and, with your day rate, the cost of waiting for the next CLEARED window',
      n: 'Week · the fleet' } },
  { door: 'placar', label: 'Placar', sub: 'previsão × satélite',
    who: 'quem duvida da previsão', q: 'Quanto essa faixa erra?',
    gets: 'o placar: cada faixa comprometida antes do mar e avaliada por satélite, em público, com a regra de admissão escrita antes',
    n: 'Placar · o registro', href: '/janela/#modo=placar',
    en: { label: 'Scoreboard', sub: 'forecast × satellite',
      who: 'whoever doubts the forecast', q: 'How far off is this band?',
      gets: 'the scoreboard: every band committed before the sea and scored by satellite, in public, with the admission rule written beforehand',
      n: 'Scoreboard · the record' } },
  { door: 'metodo', label: 'Método ↗', sub: 'fontes e limites', who: null,
    en: { label: 'Method ↗', sub: 'sources and limits' } }
];

/* lang 'en' lays an entry's English over its Portuguese (the door ids and the links stay); no lang: the Portuguese words */
const pick = (lang) => (u) => (lang === 'en' ? Object.assign({}, u, u.en) : u);
const doors = (lang) => USES.filter((u) => u.door).map(pick(lang));
const cases = (lang) => USES.filter((u) => u.who).map(pick(lang));

module.exports = { USES, doors, cases };
