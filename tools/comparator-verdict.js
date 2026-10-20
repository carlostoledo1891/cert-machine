/* comparator-verdict.js — THE rule that turns the facts of one Comparator run (tools/openai-math-kernel-result.py's JSON)
   into a word. Shared by every lane that runs Comparator: the openai/math audit's lane K (tools/record-openai-math-kernel.js)
   and the AlphaProof Nexus kernel lane (tools/record-apn-kernel.js). Moved here unchanged from record-openai-math-kernel.js
   on 2026-10-20 so the two cannot diverge (a rule defined twice will).

     CERTIFIED  Comparator exit 0, "Your solution is okay!", and BOTH "nanoda kernel accepts" and "Lean default kernel accepts"
     REFUTED?   a kernel rejects, or Comparator says the statements, a constant or a constant kind do not match, or an
                unpermitted axiom — stated as REFUTED only when a second run agrees (the caller's job)
     REFUSED    anything else: not run, a kernel line missing, a build, export or setup failure — with the stage
   MIT */
'use strict';
/* case-insensitive: Comparator v4.34 prints 'nanoda kernel accepts', v4.28 'Nanoda kernel accepts' (2026-10-20) */
const accepts = (f, k) => f.kernels.some((l) => new RegExp('^' + k + ' kernel accepts the solution', 'i').test(l));
const rejects = (f) => f.kernels.filter((l) => /kernel rejects/.test(l));
const COMPARATOR_NO = [/Challenge and solution theorem statement do not match/, /Const does not match between challenge and target/, /Challenge and solution constant kind don't match/, /not permitted|illegal axiom|uses axiom|Axiom .* is not/i];
function decide(f) {
  if (!f.ran) return { word: 'REFUSED', stage: 'not run', why: f.missing || 'the job stopped before Comparator ran (see the run log)' };
  if (f.exit === 0 && f.okay && accepts(f, 'nanoda') && accepts(f, 'Lean default')) return { word: 'CERTIFIED', why: 'Comparator exit 0; nanoda and Lean\'s kernel both accept' };
  if (f.exit === 0 && f.okay) return { word: 'REFUSED', stage: 'kernels', why: 'Comparator passed but the two acceptance lines were not both printed: ' + JSON.stringify(f.kernels) };
  const text = (f.logTail || []).concat(f.errTail || []).join('\n');
  const no = rejects(f).length ? 'a kernel rejects: ' + rejects(f).join('; ') : (COMPARATOR_NO.find((re) => re.test(text)) ? (text.split('\n').find((l) => COMPARATOR_NO.some((re) => re.test(l))) || '').trim() : null);
  if (no) return { word: 'REFUTED?', stage: 'comparator', why: no };
  const stage = /Building .*\n(?![\s\S]*Exporting)/.test(text) ? 'build' : /Exporting/.test(text) ? 'export or replay' : 'setup';
  return { word: 'REFUSED', stage, why: (f.errTail || []).slice(-3).join(' | ') || 'exit ' + f.exit };
}
module.exports = { accepts, rejects, COMPARATOR_NO, decide };
