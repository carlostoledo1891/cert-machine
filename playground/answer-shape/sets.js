/* sets.js — the structures we ask three models about.
 *
 * Each set is a list of items with a canonical order where one exists. Nothing
 * here is a prediction: the question is what THREE models say, and whether they
 * say the same thing. A set earns its place by separating models, not by
 * confirming a guess.
 *
 * `order` — the items have a sequence, so the closing step means something.
 *           Without one (a taxonomy has no first animal) the plate draws the
 *           minimum spanning tree instead.
 * `pair`  — two sets that share their items and differ only in the FRAME. If
 *           the frame moves the geometry, a model is storing what the symbols
 *           are for rather than the symbols.
 */
'use strict';

module.exports = [
  { id: 'weekdays', title: 'the days of the week', order: true,
    note: 'The canonical cycle. Monday follows Sunday, so a model that knows the WEEK closes the loop and one that knows only an ordering lays them on a line.',
    items: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    ask: (a, b) => `How far apart are ${a} and ${b} as days of the week?` },

  { id: 'clock', title: 'the hours on a clock face', order: true, pair: 'digits',
    note: 'Twelve numerals in a frame that closes: twelve o’clock precedes one. Half of a paired experiment with the digits below, which use overlapping symbols in a frame that does not.',
    items: ['1 o’clock', '2 o’clock', '3 o’clock', '4 o’clock', '5 o’clock', '6 o’clock', '7 o’clock', '8 o’clock', '9 o’clock', '10 o’clock', '11 o’clock', '12 o’clock'],
    ask: (a, b) => `How far apart are ${a} and ${b} on a clock face?` },

  { id: 'digits', title: 'the digits', order: true, pair: 'clock',
    note: 'The other half. Nine is not adjacent to zero, and a circle here would mean the method is finding cycles in everything.',
    items: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    ask: (a, b) => `How far apart are the digits ${a} and ${b} in value?` },

  { id: 'chromatic', title: 'the chromatic scale', order: true,
    note: 'The sharpest cycle on the page. B is one semitone from C but they sit at opposite ends of the alphabet and of the scale as written, so a model with pitch CLASS closes and a model with pitch NAMES does not.',
    items: ['C', 'C sharp', 'D', 'D sharp', 'E', 'F', 'F sharp', 'G', 'G sharp', 'A', 'A sharp', 'B'],
    ask: (a, b) => `How far apart are the musical pitches ${a} and ${b}?` },

  { id: 'hues', title: 'the hue wheel', order: true,
    note: 'The one cycle that is not a convention: red really is adjacent to violet on the wheel. A model that puts them at opposite ends has learned a list of colour words rather than a colour space.',
    items: ['red', 'orange', 'yellow', 'chartreuse', 'green', 'spring green', 'cyan', 'azure', 'blue', 'violet', 'magenta', 'rose'],
    ask: (a, b) => `How different are the colours ${a} and ${b} in hue?` },

  { id: 'carnivores', title: 'a branch of the tree of life', order: false,
    note: 'A taxonomy is a tree — cats inside cats, dogs inside dogs, no way round. If a method only reports "structured", this looks like the cycles; the four-point condition is what tells them apart.',
    items: ['domestic cat', 'lion', 'tiger', 'leopard', 'wolf', 'domestic dog', 'red fox', 'grizzly bear', 'polar bear', 'raccoon'],
    ask: (a, b) => `How closely related are a ${a} and a ${b}?` },

  { id: 'nonsense', title: 'seven nonsense strings', order: false,
    note: 'The floor. These are not words, so there is no meaning to have a shape, and whatever comes back is orthography, keyboard distance or invention. Everything above has to clear it.',
    items: ['flarn', 'zubik', 'quolm', 'drapt', 'vessig', 'krondo', 'themu'],
    ask: (a, b) => `How similar are the made-up words "${a}" and "${b}"?` },
];
