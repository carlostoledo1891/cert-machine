/* grade3.js: the JavaScript grader of Stage 3 of the audit of "Language Models Can Rewrite Their Own Weights"
   (arXiv 2611.21885 v2). Rules: notes/qwen-self-rewriting-stage3-preregistration-2026-11-26.md.

   Written from the rule as the pre-registration states it, sharing no code with grade3.py: it wraps
   instruments/wsp/grade.js (the WSP lane's second grader, BigInt rationals, its own extraction), used unchanged.
   The paper's rule (Tab. 5): the last \boxed{} after the thinking; no credit while the thinking is still open.
     - the thinking ends at the first "</think>" of the text; none at all: WRONG (never read inside the thinking)
     - the prediction is the last closed \boxed{} after it; none: WRONG; an empty one: WRONG
     - then grade.js decides CORRECT / WRONG / REFUSED
   A second reading (after the LAST "</think>") is recorded and decides nothing by itself.

   usage: node grade3.js GOLD < response.txt     |  node grade3.js --selftest     |
          node grade3.js --batch < pairs.jsonl   (each line {"key", "gold", "text", "finish"}; prints one verdict line each)
   MIT */
'use strict';
const path = require('path');
const W = require(path.join(__dirname, '..', '..', 'wsp', 'grade.js'));

const CLOSE = '</think>';
const ELIGIBLE = ['q', 'sqrt', 'pi', 'deg', 'c'];

function goldClass(gold) {
  if (gold === null || gold === undefined || String(gold).trim() === '') return null;
  return W.canon(String(gold))[0];
}

function after(text, useLast) {
  const at = useLast ? text.lastIndexOf(CLOSE) : text.indexOf(CLOSE);
  return at === -1 ? null : text.slice(at + CLOSE.length);
}

function decide(gold, region) {
  if (region === null) return ['WRONG', 'the thinking never closed', null];
  const pred = W.extractBoxed(region);
  if (pred === null) return ['WRONG', 'no closed \\boxed{} after the thinking', null];
  if (pred.trim() === '') return ['WRONG', 'an empty \\boxed{}', pred];
  const [v, why] = W.grade(gold, pred);
  return [v, why, pred];
}

function gradeResponse(gold, text, finish) {
  text = text || '';
  const [v, why, pred] = decide(gold, after(text, false));
  const [v2, , pred2] = decide(gold, after(text, true));
  return { verdict: v, reason: why, pred, think_closed: text.includes(CLOSE), closes: text.split(CLOSE).length - 1,
    cut: finish === 'length', second: { verdict: v2, pred: pred2 } };
}

function selftest() {
  const C = [
    ['7', 'reasoning ... \\boxed{7}', 'length', 'WRONG'],
    ['7', 'reasoning ... \\boxed{7} more', 'stop', 'WRONG'],
    ['7', 'think \\boxed{7}</think>The answer is \\boxed{8}.', 'stop', 'WRONG'],
    ['7', 'think \\boxed{8}</think>So \\boxed{7}.', 'stop', 'CORRECT'],
    ['7', 'think</think>first \\boxed{8}, finally \\boxed{7}', 'stop', 'CORRECT'],
    ['7', 'think</think>The answer is \\boxed{', 'length', 'WRONG'],
    ['7', 'think</think>The answer is \\boxed{7}', 'length', 'CORRECT'],
    ['7', 'think</think>\\boxed{}', 'stop', 'WRONG'],
    ['\\frac{1}{2}', 't</think>\\boxed{0.5}', 'stop', 'CORRECT'],
    ['\\frac{1}{2}', 't</think>\\boxed{x^2+1}', 'stop', 'REFUSED'],
    ['2\\sqrt{3}', 't</think>\\boxed{\\sqrt{12}}', 'stop', 'CORRECT'],
    ['7', 't</think>no box at all', 'stop', 'WRONG'],
  ];
  const failures = [];
  for (const [gold, text, fin, want] of C) {
    const got = gradeResponse(gold, text, fin).verdict;
    if (got !== want) failures.push({ gold, text, want, got });
  }
  const two = gradeResponse('7', 'a</think>\\boxed{7}</think>no box after the second close', 'stop');
  if (!(two.verdict === 'CORRECT' && two.second.verdict === 'WRONG' && two.closes === 2)) failures.push({ case: 'two closes', got: two });
  return { cases: C.length + 1, failures };
}

module.exports = { gradeResponse, goldClass, ELIGIBLE };

if (require.main === module) {
  const a = process.argv.slice(2);
  if (a[0] === '--selftest') {
    const r = selftest();
    console.log(JSON.stringify(r, null, 1));
    process.exit(r.failures.length ? 1 : 0);
  }
  const input = require('fs').readFileSync(0, 'utf8');
  if (a[0] === '--batch') {
    const out = [];
    for (const line of input.split('\n')) {
      if (!line.trim()) continue;
      const o = JSON.parse(line);
      if (o.text === undefined) out.push(JSON.stringify({ key: o.key, gold_class: goldClass(o.gold) }));
      else out.push(JSON.stringify(Object.assign({ key: o.key }, gradeResponse(o.gold, o.text, o.finish))));
    }
    process.stdout.write(out.join('\n') + (out.length ? '\n' : ''));
  } else if (a.length === 1) {
    console.log(JSON.stringify(gradeResponse(a[0], input)));
  } else {
    console.error('usage: node grade3.js GOLD < response.txt | --selftest | --batch < pairs.jsonl');
    process.exit(2);
  }
}
