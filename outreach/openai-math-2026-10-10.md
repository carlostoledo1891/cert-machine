# openai/math audit: the public post and the email (2026-10-10)

Status: READY. The operator asked for the public post and will send the email ("Make the public posting
linking and I will send the email"). There is no X, LinkedIn or Mastodon access from this repo, so the posts are
pasted by hand. Facts checked at draft time against the live page and its records (findings.json, the three ledgers).
Upstream openai/math HEAD was still fd4aeeb2 at 13:25 UTC. Before posting, re-check that the page is live and that
upstream has not moved: `git -C ~/Projects/openai-math ls-remote origin HEAD`. If it has moved, the page still holds
at fd4aeeb2, but the post should say "at the commit it shipped".

Page: https://carlostoledo.co/reports/openai-math.html

---

## A · X (277 characters, with the link counted as 23)

---- PASTE BELOW THIS LINE ----

OpenAI's math release, audited at the commit it shipped: every proof the kernels finished holds — and 14 gaps between what it claims and what it checks, incl. 5 headlines no Lean statement carries (Hilbert's 16th, Kaplansky, Penrose…). Made with Claude. https://carlostoledo.co/reports/openai-math.html

---- END PASTE ----

## B · Mathstodon (under 500 characters as raw text)

---- PASTE BELOW THIS LINE ----

OpenAI's math release (719 manuscripts), audited at the commit it shipped. Every proof the kernels finished holds; no finite claim was refuted. But 14 gaps between what it claims and what it checks: 5 headlines no checked statement carries (Hilbert's 16th, Kaplansky, Penrose, maximal coarse assembly, Projected Lax), 63 displayed definitions compared by type only, 15 unpublished witnesses. Each pinned to file and line. Made with Claude. https://carlostoledo.co/reports/openai-math.html

---- END PASTE ----

## C · LinkedIn

---- PASTE BELOW THIS LINE ----

We audited OpenAI's math release (719 machine-generated manuscripts, 416 Lean challenges) at the commit it shipped, before any fix.

What holds: every proof the kernels finished is accepted both by Lean's kernel and by nanoda, an independent kernel the release had switched on for only 2 of its 416 challenges. That is 310 of 324 run so far, with none rejected. We also re-decided 44 finite certificates in exact arithmetic with our own code, and none was refuted.

What we found: 14 gaps between what the release claims and what it checks.
• 5 headlines are carried by no machine-checked statement:
  – Hilbert's 16th problem: the uniform bound is in no statement; only a quintic Liénard case is.
  – Kaplansky: the Lean group is required to have torsion, but the headline group is torsion-free.
  – The spacetime Penrose inequality: it is not stated anywhere.
  – Maximal coarse assembly: the Lean is about the reduced map.
  – Projected Lax: the formalized cone has an exact lift, given by the family's own third manuscript.
• 34 of the 242 formalized families state less than their claim, or something other than it, with nothing saying so.
• 63 displayed definitions are compared by type only, and one of them carries "the plane is not 5-colorable". We supplied the missing check and settled 9 of the 10 challenges.
• 15 headline witnesses are asserted but not published; some papers cite checkers the release does not ship; some shipped checkers stop short of what their paper claims.

A gap is not an error, and most of these claims may well be true. Each gap is pinned to a file and line, with what would close it.

Made with Claude. The evidence is the files, not the model.
https://carlostoledo.co/reports/openai-math.html

---- END PASTE ----

---

## D · The email to OpenAI (the operator sends; the recipient is the operator's to choose: the release has no contact address,
##     and issues and discussions are disabled on the repository)

Subject: Independent audit of github.com/openai/math at fd4aeeb2: 14 gaps, with file-and-line evidence

---- PASTE BELOW THIS LINE ----

Hello,

I ran an independent audit of the openai/math release at commit fd4aeeb2, the head since October 8. The report is public: https://carlostoledo.co/reports/openai-math.html

In short, the proofs hold. Every Lean proof we ran to completion was accepted by Lean's kernel and by nanoda (310 of 324 so far, none rejected), and the 44 finite certificates we re-decided in exact arithmetic all held. The issues are in what the release claims beyond what it checks. The ones that matter most:

1. Five family headlines are carried by no Comparator statement:
   - 143, Hilbert's 16th: only the quintic Liénard case is stated, not the uniform bound.
   - 197, Kaplansky: the finitely presented Lean group is required to have odd-prime torsion, but the headline group is torsion-free.
   - 260, Penrose: CKSBondiPenrose states no Penrose inequality.
   - 307, coarse assembly: the Lean is about the reduced map, but the headline is about the maximal one.
   - 095, Projected Lax: the family's third manuscript gives the formalized cone an exact lift.
2. 34 of the 242 formalized families state a different theorem from their headline (11), or less than a manuscript their scope note links (23), with nothing saying so. Each one is listed with the missing clause.
3. 63 of the 65 definition holes are displayed with full bodies but compared by type only. We compared the bodies and ran a transfer check in Lean: 9 of the 10 configurations are settled, and DefocusingNLS is not.
4. nanoda is enabled for only 2 of the 416 configurations, and its hard-coded 16 MiB thread stack overflows on 13 of your exports.
5. 15 headline witnesses are not published, and several papers cite code that is not shipped (for example, the verification/code directory of the N(6) = 3 paper).

Each item links its file and line at fd4aeeb2 and says what would close it. Issues are disabled on the repository, so I'm writing directly. I'm happy to send the list in another format, or to re-check after a fix. The audit was built with Claude; the evidence is the files.

Best regards,
Carlos Toledo
https://carlostoledo.co

---- END PASTE ----
