/* warrant-pt.js — the grammar's words in Portuguese, once.
   playground/ · cert-machine

   playground/warrant.js speaks the house's English: its standing legend and its premise grades. The pt-BR pages that
   draw the grammar (/janela/, /janela/metodo/, /eleicoes2026/) need the same words in Portuguese, and two pages that
   translate them by themselves WILL diverge (the corpus.js lesson). So the translation lives here, and a legend word
   warrant.js adds or changes without a Portuguese one here refuses the build instead of printing half a language.
   The marks themselves (stroke, underline, ladder glyph) are warrant.js's, untouched: only words change.     MIT */
'use strict';
const W = require('./warrant.js');

/* the standing legend's eight strings (warrant.js LEGEND), label and gloss */
const LEGEND = {
  decided: 'decidido', 'exact arithmetic backs it': 'conta exata',
  computed: 'computado', 'float, or a number someone printed; nothing decided it': 'ponto flutuante, ou um número que alguém imprimiu; nada o decidiu',
  chosen: 'escolhido', 'one member of a set the data admits': 'um membro do conjunto que os dados admitem',
  refused: 'recusado', 'no mark — the void is drawn': 'sem marca: o vazio é desenhado',
};
/* the premise ladder (warrant.js GRADE, weakest first), and what each rung means, in the voice Swell's pages use */
const GRADE = ['suposto', 'verificado', 'comparado', 'validado'];
const GRADE_GLOSS = [
  'adotado de uma fonte, escolhido ou lido; nenhuma máquina aqui o conferiu',
  'o código reproduz uma solução de referência das próprias equações; não conferido contra a coisa em si',
  'conferido contra um modelo que guarda mais da física, com o número; não contra a coisa em si',
  'conferido contra observações da própria coisa, guardadas fora da calibração, com o número',
];
if (GRADE.length !== W.GRADE.length) throw new Error('warrant-pt: the premise ladder changed in warrant.js; translate it here');

/* W.legendHtml in Portuguese: the same markup, the words swapped label by label */
function legendHtml(opts) {
  opts = opts || {};
  let h = W.legendHtml(opts);
  for (const L of W.LEGEND) {
    if (!h.includes('>' + L.label + '<')) continue;   /* derived out of this legend (R20) */
    if (!LEGEND[L.label] || !LEGEND[L.gloss]) throw new Error('warrant-pt: the standing legend has a word with no Portuguese here: ' + L.label + ' / ' + L.gloss);
    for (const en of [L.label, L.gloss]) h = h.split('>' + en + '<').join('>' + LEGEND[en] + '<');
  }
  return h;
}
/* W.premisesHtml with the Portuguese ladder */
const UNVERIFIED = 'não verificado';   /* D11: the verification bit's word when it is off */
const premisesHtml = (items, opts) => W.premisesHtml(items, Object.assign({ words: GRADE, gloss: GRADE_GLOSS, unverifiedWord: UNVERIFIED }, opts || {}));

module.exports = { LEGEND, GRADE, GRADE_GLOSS, legendHtml, premisesHtml };
