# Baseline request — blind-spot human baselines (DRAFT, gated; a SEND)

Drafted 2026-09-21 for the METR plan's first deliverable (notes/metr-plan-2026-09-21.md).
Sending is Carlos's, per person. Nothing here has been sent. Pseudonyms only in
the record; the consent line is the one in environments/blind_spot/baselines.json.

Who it is for: five to ten people with a digital-design background (RTL,
verification or formal), one message each, adapted to the name. Written for
someone who has never seen this repository.

---

Subject: 30–90 minutes of your verification instinct, timed, for a human baseline

Hi <name>,

I am building an evaluation task for AI models and I need a human baseline on it
from people who actually know digital design. Would you give it 30 to 90 minutes,
timed, in the next two weeks?

**The task.** A small combinational circuit (22 three-bit inputs, three output
pins) decides whether two integer vectors meet at an angle of at least 60°. One
mutation may have been applied to its netlist — a single bit of a single cell's
port bent — or none. You name one to eight input pairs on which the mutant's
output pins differ from the original's, or you answer EQUIVALENT (no input can
tell them apart), or UNDECIDED. There is no answer key: a pair you name is run
through the actual netlist under the actual mutation, and EQUIVALENT is checked
against a SAT proof. A correct diagnosis with no killing pair does not count;
UNDECIDED is a valid answer and costs nothing; a false claim costs.

**Three levels.** *Located*: the mutation is named (cell, port, bit, the netlist
statement it sits in). *Profile*: the location is withheld; you are told which of
four testbenches killed the mutant. *Blind*: nothing but the design. You would
attempt up to six tasks per level, in the order given, and stop when your time is
up.

**What I record.** For each attempt: the wall-clock time from seeing the prompt
to saving your answer (you report it), the answer, and its outcome from the
verifier. Under a pseudonym you choose. No name, e-mail or employer is stored,
and the pseudonymous rows may be published as the baseline table. The consent
line you would be agreeing to is exactly this:

> I agree that my timed attempt (the time I took, my answer and its scored
> outcome) is recorded under a pseudonym I chose and may be published as part of
> a human-baseline table for the blind-spot task; no name, e-mail or employer is
> recorded.

**Rules.** Pen, paper, a calculator and a text editor. The netlist listing is
available if you want it. No simulator, no SAT solver, no AI model — the point is
the human number.

**How.** I send you a folder with the prompts as plain text files and a one-line
answer format; you send back the answer files and your times. If you would rather
do it on a call so the timing is clean, that works too.

Would you be up for it? If yes, tell me which of the next two weeks suits you
and I will send the folder.

Thanks,
Carlos

---

Notes for the sender (not part of the message):
- The task list is `tasks` in environments/blind_spot/baselines.json (six per
  rung, seed 2027, filled by `python3 environments/blind_spot/inspect/ledger.py`).
- On return: append one row per attempt to `attempts` following `attempt_schema`,
  then `python3 environments/blind_spot/inspect/ledger.py --grade-baselines`,
  which grades every reply with the exact verifier and re-pins the file. The
  battery is red until that runs.
- Do not send the prompts by pasting them into a chat with any model.
