/* sets.js — the structures we ask about. Every one is a prediction, and the
   ones that are here to fail are marked as such.

   `order`  the items have a canonical sequence, so the plate can walk it and
            the closing step means something. Without one (a taxonomy has no
            first animal) the plate draws the minimum spanning tree instead.
   `shape`  what the answers should look like if the model has the structure.
*/
'use strict';

module.exports = [
  /* ---- cycles: the closing step is the whole test ------------------------ */
  { id: 'weekdays', title: 'the days of the week', shape: 'cycle', order: true, predict: 'a circle',
    why: 'Monday follows Sunday. A model that only knows an ordering lays them on a line; one that knows the WEEK closes the loop.',
    items: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },

  { id: 'months', title: 'the months', shape: 'cycle', order: true, predict: 'a circle',
    why: 'The same test with twelve points and a longer way round. January next to December is the year as a cycle rather than as a list.',
    items: ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'] },

  { id: 'hues', title: 'the hue wheel', shape: 'cycle', order: true, predict: 'a circle',
    why: 'The one cycle that is not a convention: red really is adjacent to violet in the spectrum-as-wheel. A model that puts them at opposite ends has learned a list of colour words rather than a colour space.',
    items: ['red', 'orange', 'yellow', 'chartreuse', 'green', 'spring green',
            'cyan', 'azure', 'blue', 'violet', 'magenta', 'rose'] },

  { id: 'compass', title: 'the compass', shape: 'cycle', order: true, predict: 'a circle',
    why: 'Eight directions with no cultural argument about their order and no ambiguity about the closing step. If any cycle is clean, this one is.',
    items: ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'] },

  { id: 'chromatic', title: 'the chromatic scale', shape: 'cycle', order: true, predict: 'a circle',
    why: 'Octave equivalence is the sharpest version of this question: B is one semitone from C, but they are at opposite ends of the alphabet and of the scale as it is usually written. A model with pitch CLASS closes; a model with pitch NAMES does not.',
    items: ['C', 'C sharp', 'D', 'D sharp', 'E', 'F', 'F sharp', 'G', 'G sharp', 'A', 'A sharp', 'B'] },

  { id: 'clockhours', title: 'the hours on a clock face', shape: 'cycle', order: true, predict: 'a circle',
    why: 'THE PAIRED EXPERIMENT. Same numerals as the digits below, different frame. Twelve o’clock follows eleven and precedes one; nine does not follow zero. If the frame moves the geometry, the model is not storing numerals, it is storing what the numerals are FOR.',
    items: ['1 o’clock', '2 o’clock', '3 o’clock', '4 o’clock', '5 o’clock', '6 o’clock',
            '7 o’clock', '8 o’clock', '9 o’clock', '10 o’clock', '11 o’clock', '12 o’clock'] },

  { id: 'emotions', title: 'the wheel of emotions', shape: 'cycle', order: true, predict: 'a circle',
    why: 'Plutchik’s wheel puts joy opposite sadness and anger opposite fear, with each adjacent pair blending. It is a psychologist’s model, not a fact about the world — so this measures whether the model absorbed the model.',
    items: ['joy', 'trust', 'fear', 'surprise', 'sadness', 'disgust', 'anger', 'anticipation'] },

  /* ---- lines: an order with two ends ------------------------------------- */
  { id: 'digits', title: 'the digits', shape: 'line', order: true, predict: 'a line',
    why: 'The control that must NOT close. Nine is not adjacent to zero. If a circle appears here the method is finding cycles in everything and none of the others mean anything.',
    items: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] },

  { id: 'scales', title: 'scales of size', shape: 'line', order: true, predict: 'a line, and a long one',
    why: 'Twelve orders of magnitude at every step. If the model has any sense of scale at all this should be the most one-dimensional thing on the page — and the closing step, atom back to galaxy, the longest.',
    items: ['a proton', 'an atom', 'a virus', 'a cell', 'an ant', 'a person',
            'a mountain', 'the Earth', 'the Sun', 'the solar system', 'the galaxy', 'the observable universe'] },

  { id: 'planets', title: 'the planets outward', shape: 'line', order: true, predict: 'a line',
    why: 'An ordering with real physical content behind it. Neptune is not adjacent to Mercury and no amount of the word "planet" should make it so.',
    items: ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'] },

  { id: 'alphabet', title: 'eight letters', shape: 'line', order: true, predict: 'a line',
    why: 'Pure sequence with no meaning attached — the alphabet is a list and nothing else. Whatever geometry appears here is the geometry of ordering itself, with the semantics subtracted.',
    items: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] },

  /* ---- trees and grids: structured, but not a cycle ---------------------- */
  { id: 'carnivores', title: 'a branch of the tree of life', shape: 'tree', order: false, predict: 'a tree, not a cycle',
    why: 'THE TEST THAT SEPARATES KINDS OF STRUCTURE. A taxonomy is a tree: cats nested inside cats, dogs inside dogs, no way round. If curvature only says "structured", this looks like the cycles. If the four-point condition works, this is where it shows.',
    items: ['domestic cat', 'lion', 'tiger', 'leopard', 'wolf', 'domestic dog',
            'red fox', 'grizzly bear', 'polar bear', 'raccoon'] },

  { id: 'kinship', title: 'kinship terms', shape: 'grid', order: false, predict: 'a grid — generation against gender',
    why: 'Two independent axes and nothing cyclic about either. Mother and father differ in one coordinate; mother and daughter in the other. A model holding both should need two dimensions and use them at right angles.',
    items: ['grandmother', 'grandfather', 'mother', 'father', 'aunt', 'uncle',
            'sister', 'brother', 'daughter', 'son', 'granddaughter', 'grandson'] },

  /* ---- the controls: here to fail ---------------------------------------- */
  { id: 'unrelated', title: 'seven unrelated nouns', shape: 'none', order: false, predict: 'nothing low-dimensional',
    why: 'These words share no structure, so their dissimilarities should need most of the available dimensions and no clean shape should survive. A method that draws a tidy circle here is drawing its own assumptions.',
    items: ['piano', 'granite', 'hurricane', 'ledger', 'mackerel', 'trombone', 'vinegar'] },

  { id: 'nonsense', title: 'seven nonsense strings', shape: 'none', order: false, predict: 'nothing at all',
    why: 'The harder control. These are not words, so there is no meaning to have a shape. Anything the model reports here is orthography, keyboard distance or invention — and whatever it is, it is the floor everything above must clear.',
    items: ['flarn', 'zubik', 'quolm', 'drapt', 'vessig', 'krondo', 'themu'] },
];
