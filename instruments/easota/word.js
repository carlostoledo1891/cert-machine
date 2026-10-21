/* instruments/easota/word.js — the easota ledger's WORD, composed in ONE place (2026-10-21, after the self-audit's finding:
   certs/selfaudit-mutations.json found 28 printed values moved one unit past the bytes still CERTIFIED, because the word
   was about the bytes witnessing a value and the printed digits were a field beside it, gated only on the page and in the
   paper numbers — a rule defined in two consumers WILL diverge, so it lives here and tools/run-easota-ledger.js and
   instruments/selfaudit/shapes.js both call it).

   The decision from the bytes (witnessed; a repair) and whether the printed digits state the exact value under the row's
   convention (printedAgrees) give the word:
     WITNESSED    the bytes are an exact witness of the printed value (or nothing is printed and the exact value is certified)
     MISPRINTED   the bytes are an exact witness of a value the printed digits do NOT state → the register's REFUTED, kind
                  not-from-the-published-data, the exact value certified beside it (what tools/run-mc100-einstein.js already
                  says for the same problems)
     REPAIRED     a witness only within a verifier's tolerance; a repair built from the same bytes certified beside it (the
                  printed value is the as-published one; printedAgrees is reported, not gated — circles/ours_2026)
     UNWITNESSED  the bytes fail exactly and no repair exists (the register build refuses such a row)
     UNDECIDED    the hexagons' interval decision could not separate a pair or place a vertex

   The ledger record's own `grammar` string still lists the three words it was pinned with (the self-audit's pre-registration
   froze the record's bytes); it gains MISPRINTED at the next re-pin (Phase 5, the freeze).                               MIT */
'use strict';

const WORDS = ['WITNESSED', 'MISPRINTED', 'REPAIRED', 'UNWITNESSED', 'UNDECIDED'];

function wordOf({ verdict, printed, printedAgrees }) {
  if (!WORDS.includes(verdict)) throw new Error('easota word: not a decision word: ' + verdict);
  if (verdict === 'WITNESSED' && printed !== null && printed !== undefined && printedAgrees === false) return 'MISPRINTED';
  return verdict;
}

/* the register's word for the ledger's */
const REGISTER = { WITNESSED: ['CERTIFIED', 'none'], MISPRINTED: ['REFUTED', 'not-from-the-published-data'], REPAIRED: ['REPAIRED', 'tolerance-witness'] };
function registerWord(word) {
  if (!(word in REGISTER)) return null; /* UNWITNESSED, UNDECIDED: the register build refuses the row */
  return { verdict: REGISTER[word][0], kind: REGISTER[word][1] };
}

module.exports = { WORDS, wordOf, registerWord };
