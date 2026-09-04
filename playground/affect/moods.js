/* moods.js — six ways to be the person asking.
 *
 * The mood belongs to the QUESTIONER, not to the model. Nothing here instructs
 * a model to feel anything or to play a part: each prefix is a sentence a person
 * might actually type before the same question, and the task after it is
 * identical to the letter. That is deliberate. A model told "answer as though
 * furious" is being tested on role-play compliance, which is a different and
 * much less interesting question than whether an ordinary emotional register in
 * the prompt moves a structure that has nothing to do with emotion.
 *
 * The five non-neutral moods tile the same valence–arousal plane the affect set
 * is meant to lie in, so the deformations they cause can be asked a question no
 * single mood could answer: does the direction a geometry moves track where the
 * mood sits?
 *
 * `near` names the item in the affect set closest to that mood. It is used only
 * to orient a measurement after the fact — no prompt ever contains it.
 */
'use strict';

module.exports = [
  { id: 'neutral', label: 'neutral', near: null, valence: 0, arousal: 0,
    note: 'The question alone, as it was asked on the previous page.',
    prefix: '' },

  { id: 'elated', label: 'elated', near: 'excited', valence: 1, arousal: 1,
    note: 'Pleasant and activated.',
    prefix: "This project is going so well and I'm having a brilliant time with it. " },

  { id: 'urgent', label: 'under pressure', near: 'tense', valence: 0, arousal: 1,
    note: 'Activated, with the valence left out — the axis on its own.',
    prefix: 'I have about four minutes before this has to ship and I am still not done. ' },

  { id: 'angry', label: 'angry', near: 'angry', valence: -1, arousal: 1,
    note: 'Unpleasant and activated.',
    prefix: "I've asked this three times now and gotten nothing I can use. I'm losing patience. " },

  { id: 'weary', label: 'worn down', near: 'sad', valence: -1, arousal: -1,
    note: 'Unpleasant and deactivated.',
    prefix: "I'm pretty worn down today and this is the last thing on a very long list. " },

  { id: 'serene', label: 'serene', near: 'relaxed', valence: 1, arousal: -1,
    note: 'Pleasant and deactivated.',
    prefix: "No rush at all on this one — it's a quiet afternoon and I'm just curious. " },
];
