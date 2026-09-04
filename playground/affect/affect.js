/* affect.js — the sentiment subjects, and the control they are measured against.
 *
 * THE AFFECT SET is twelve feeling words written in the order the circumplex
 * puts them: pleasant, then activated, then unpleasant, then deactivated, and
 * round. That ordering is the standard qualitative arrangement of valence
 * against arousal — it is not a quoted coordinate table, and no published angles
 * are claimed anywhere here. It matters only as the order in which the cycle fit
 * walks the items, and the fit either finds a circle in the model's answers or
 * it does not.
 *
 * THE CONTROL is the clock, carried over unchanged. It is the reason the mood
 * results can be read at all: twelve hours have nothing to do with feeling, one
 * model already lays them out as a circle to 1%, and so any deformation a mood
 * causes there is a deformation of something the mood has no business touching.
 * Without it, a moved affect map would mean nothing — moods and feelings are
 * about each other, and a change would be as easily sense as interference.
 *
 * THE SCALARS are the cross-validation. Twelve feelings rated twice, for
 * pleasantness and for activation, in single questions that never mention
 * another feeling, distance, or a dimension. The pairwise questions never
 * mention pleasantness or activation. If the plane recovered from 132 pairwise
 * answers has axes that line up with 24 scalar ones, that agreement was not
 * available to either question set on its own.
 */
'use strict';
const SETS = require('./sets.js');

const AFFECT = ['happy', 'delighted', 'excited', 'astonished', 'tense', 'angry',
  'miserable', 'sad', 'bored', 'sleepy', 'relaxed', 'content'];

/* pairwise subjects, probed under every mood */
const PAIRWISE = [
  { id: 'affect', title: 'the feelings themselves', order: true, kind: 'affect',
    note: 'Twelve feeling words in circumplex order — pleasant, activated, unpleasant, deactivated, and round. If a model holds affect as a plane with a pleasantness axis and an activation axis, these twelve fall on a circle in this order, and nothing in any question says so.',
    items: AFFECT,
    ask: (a, b) => `How far apart are ${a} and ${b} as feelings?` },

  { id: 'clock', title: 'the hours on a clock face', order: true, kind: 'control',
    note: 'The control, unchanged from the neutral run. Twelve hours have nothing to do with how anyone feels, and one model already lays them out as a circle to 1%. Whatever a mood does here, it is doing to something it has no business touching.',
    items: SETS.find(s => s.id === 'clock').items,
    ask: SETS.find(s => s.id === 'clock').ask },
];

/* one ordered subject, probed once — affect flattened onto its own first axis */
const LADDER = { id: 'ladder', title: 'the pleasantness ladder', order: true, kind: 'affect',
  note: 'Seven feelings that differ in one thing only. A set with a single axis in it should come back a line, and the closing step should be the whole way home rather than one more rung.',
  items: ['elated', 'happy', 'pleased', 'indifferent', 'displeased', 'unhappy', 'anguished'],
  ask: (a, b) => `How far apart are ${a} and ${b} as feelings?` };

/* the scalar axes, asked one feeling at a time */
const SCALARS = [
  { id: 'pleasant', label: 'pleasantness',
    ask: (x) => `How pleasant is it to feel ${x}?`,
    ends: (s) => `0 means as unpleasant as a feeling can be and ${s} means as pleasant as a feeling can be` },
  { id: 'activated', label: 'activation',
    ask: (x) => `How much energy does it take to feel ${x}?`,
    ends: (s) => `0 means as calm and still as a feeling can be and ${s} means as worked-up and restless as a feeling can be` },
];

module.exports = { AFFECT, PAIRWISE, LADDER, SCALARS };
