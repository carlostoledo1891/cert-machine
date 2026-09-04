/* sets.js — the structures we ask about, and what each one is a test of.

   Goodfire opens the model: they find circles for weekdays, an HSL surface for
   colours and a tree in genomic features by decomposing ACTIVATIONS. That
   requires the weights.

   This asks the opposite way round. If those geometries are real, they should
   be recoverable from the OUTSIDE — from nothing but what the model says — and
   a shape that only exists inside the activations was never a shape the model
   uses. So: elicit a dissimilarity for every pair, and decide what the answers
   can and cannot be.

   Every set here is a prediction, and the two controls are there to be failed.
*/
'use strict';

module.exports = [
  { id: 'weekdays', title: 'the days of the week', predict: 'a circle',
    why: 'Monday follows Sunday. If the model only knows an ordering it will lay them on a line; if it knows the WEEK it will close the loop, and the closure is visible as a single long edge that should not be there in a line.',
    items: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },

  { id: 'months', title: 'the months', predict: 'a circle',
    why: 'The same test with twelve points and a longer way round. A model that has January next to December has the year as a cycle rather than as a list.',
    items: ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'] },

  { id: 'hues', title: 'the hue wheel', predict: 'a circle',
    why: 'Colour is the cleanest cycle there is and the one place the answer is not a convention: red really is adjacent to violet in the spectrum-as-wheel, and a model that puts them at opposite ends has learned a list of colour words rather than a colour space.',
    items: ['red', 'orange', 'yellow', 'chartreuse', 'green', 'spring green',
            'cyan', 'azure', 'blue', 'violet', 'magenta', 'rose'] },

  { id: 'digits', title: 'the digits', predict: 'a line',
    why: 'The control that must NOT be a circle. Nine is not adjacent to zero. If a circle appears here the method is finding cycles in everything and none of the others mean anything.',
    items: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] },

  { id: 'unrelated', title: 'seven unrelated nouns', predict: 'nothing low-dimensional',
    why: 'The other control. These words share no structure, so their dissimilarities should need most of the available dimensions and no clean shape should survive. A method that draws a tidy circle here is drawing its own assumptions.',
    items: ['piano', 'granite', 'hurricane', 'ledger', 'mackerel', 'trombone', 'vinegar'] },
];
