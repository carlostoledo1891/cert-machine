/* rows.js — PU Verificado: one row of the published file, decided to its verdict. ONE module, two consumers.
   instruments/pu/ · cert-machine · 2026-10-17

   WHY A MODULE. Until 2026-10-17 the ledger (tools/run-pu-ledger.js) decided a row under every pre-registered
   hypothesis — D+0, D+1, D+1 skipping 24/31 December, B3's settlement calendar, the calendar as of the quotation —
   with REPRODUCED, then CONSISTENT (the printed rate's half-unit box, amendments 5 and 6), then OFF; and the instrument
   (/instruments/pu) decided the same pasted row under the primary settlement alone, so a row the report called
   REPRODUCED under D1b3, or CONSISTENT, could read OFF in the tab. A rule defined twice diverges (the corpus.js
   lesson). The loop body was moved here verbatim; both consumers call decideRow and the ledger re-derived identical.

   rowDecider({ PU, holidays, b3, selic, meta }) — PU: instruments/pu/decide.js · holidays: corpus/pu/holidays.json ·
   b3: corpus/pu/b3-settlement.json · selic: SGS 11 as [{iso, pct6}] ascending · meta: SGS 432 as a Map iso → '11,75'.
   decideRow(row) — row: { kind: 'LTN'|'NTN-F'|'LFT', maturity, date, taxaC, taxaV, puC, puV } (ISO dates; the printed
   prices as BigInt centavos, null when absent); returns one result per offered side, as the ledger records it. */
'use strict';
/* no Node requires at module level: the same bytes run in the browser (playground/pu) */

function rowDecider({ PU: D, holidays: HOL, b3: B3, selic: SELIC, meta: META }) {
  const cal = D.calendar(HOL);
  /* CALENDAR-AS-OF-QUOTE (amendment 2026-10-16, amendments[1]): the pinned list without the 20 Novembers of 2024 and later —
     the holiday Lei 14.759 created on 2023-12-21, which today's file carries and no earlier quotation could have known */
  const calPre = D.calendar({ holidays: HOL.holidays.filter((h) => !(/-11-20$/.test(h) && Number(h.slice(0, 4)) >= 2024)) });
  const CALS = { today: cal, pre: calPre };
  /* B3's settlement days (phase B, B1): days B3 did not trade or settle that the bank calendar counts as business days;
     a settlement path that crosses a rule-only (undocumented) day is marked so */
  const b3day = (iso) => B3.days[iso] || null;
  const nextSettleB3 = (iso) => { let d = cal.next(iso); let ruleOnly = false; for (;;) { const b = b3day(d); if (!b) break; if (!b.documented) ruleOnly = true; d = cal.next(d); } return { d, ruleOnly }; };
  const sameOrNextB3 = (iso) => { const b = b3day(iso); if (!b) return { d: iso, ruleOnly: false }; const n = nextSettleB3(iso); return { d: n.d, ruleOnly: n.ruleOnly || !b.documented }; };

  /* phase B, B2 — the LFT inputs: the Selic daily rate (SGS 11) as the index, the Selic target (SGS 432) as the projection's meta */
  const IDX = SELIC ? D.selicIndex(SELIC) : null;
  const metaAt = (iso) => { if (!META) return null; if (META.has(iso)) return META.get(iso); let best = null; for (const k of META.keys()) if (k < iso && (!best || k > best)) best = k; return best ? META.get(best) : null; };
  /* the VNA at a settlement for a quotation: the exact index at D+0, the projection over k business days otherwise */
  const vnaFor = (quote, settle) => { if (!IDX) return null; const v = IDX.vna6(quote); if (v === null) return null; if (settle === quote) return { vna6: v, k: 0, meta: null };
    const k = cal.du(quote, settle); const meta = metaAt(quote); if (!meta) return null; const p = D.vnaProjetado(v, meta, k); return p.ok ? { vna6: p.vna6, k, meta } : { refused: p.straddle, k, meta }; };

  const decide = (kind, taxa, settle, maturity, c, quote) => {
    if (kind === 'LTN') return D.decideLTN(taxa, settle, maturity, c || cal);
    if (kind === 'NTN-F') return D.decideNTNF(taxa, settle, maturity, c || cal);
    const v = vnaFor(quote, settle); if (!v) return { kind: 'LFT', decided: false, needsData: 'no Selic index or meta for ' + quote };
    if (v.refused) return { kind: 'LFT', decided: false, straddle: v.refused, at: 'VNA projetado' };
    const r = D.decideLFT(taxa, settle, maturity, c || cal, v.vna6); r.vna6 = D.dec(v.vna6, 6); r.projectedDays = v.k; r.meta = v.meta; return r;
  };
  const PRIMARY = { C: 'D1', V: 'D0' };          /* pre-registered primary hypothesis per side */
  /* D1x (amendment of 2026-10-16, preregistration.json amendments[0]): the next business day that is neither 24 nor 31
     December — Tesouro Direto does not settle on those two days; the pinned calendar documents them only by omission */
  const nextSettle = (iso) => { let d = cal.next(iso); while (/-12-(24|31)$/.test(d)) d = cal.next(d); return d; };
  const HYPS = { C: ['D0', 'D1', 'D1x', 'D1b3'], V: ['D0', 'D1', 'D0b3', 'D1b3'] };

  function decideRow(r) {
    const results = [];
    if (!cal.isBiz(r.date)) { results.push({ row: r, side: '-', verdict: 'NEEDS DATA', why: 'Data Base is not a business day on the pinned calendar' }); return results; }
    const b1 = nextSettleB3(r.date), b0 = sameOrNextB3(r.date);
    const settles = { D0: r.date, D1: cal.next(r.date), D1x: nextSettle(r.date), D1b3: b1.d, D0b3: b0.d };
    const ruleOnly = { D1b3: b1.ruleOnly, D0b3: b0.ruleOnly };
    for (const side of ['C', 'V']) {
      const taxa = side === 'C' ? r.taxaC : r.taxaV, printed = side === 'C' ? r.puC : r.puV;
      if (printed === null || printed === 0n || /^0+[,.]?0*$/.test(taxa)) continue;     /* the side was not offered that day */
      if (settles.D1 >= r.maturity || settles.D0 >= r.maturity) { results.push({ row: r, side, verdict: 'NEEDS DATA', why: 'settlement on or after maturity' }); continue; }
      const out = { row: r, side, printed, taxa, hyp: {} };
      const matches = [];
      for (const h of HYPS[side]) {
        if (h === 'D1x' && settles.D1x === settles.D1) continue;          /* same day: nothing new to decide */
        if (h === 'D1b3' && settles.D1b3 === settles.D1) continue;        /* B3 settles the same day: nothing new */
        if (h === 'D0b3' && settles.D0b3 === settles.D0) continue;
        for (const cn of ['today', 'pre']) {
          /* the two calendars differ only when a 20 November of 2024+ lies in [settlement, maturity) */
          if (cn === 'pre' && CALS.today.du(settles[h], r.maturity) === CALS.pre.du(settles[h], r.maturity)) continue;
          const dres = decide(r.kind, taxa, settles[h], r.maturity, CALS[cn], r.date);
          const key = (cn === 'today' ? h : h + '/pre') + (ruleOnly[h] ? '/r' : '');
          const rec = { settle: settles[h], calendar: cn, decided: dres.decided, du: dres.du || (dres.flows && dres.flows[dres.flows.length - 1] && dres.flows[dres.flows.length - 1].du) };
          if (dres.needsData) { rec.needsData = dres.needsData; }
          else if (dres.decided) {
            rec.pu6 = D.dec(dres.pu6, 6); rec.t2 = D.trunc2(dres.pu6); rec.r2 = D.round2(dres.pu6);
            if (rec.t2 === printed) matches.push(key + '/T');
            if (rec.r2 === printed) matches.push(key + '/R');
            if (dres.margin) rec.margin = dres.margin;
          } else { rec.refused = dres.straddle || dres.refused; }
          out.hyp[key] = rec;
        }
      }
      const prim = out.hyp[PRIMARY[side]];
      /* CONSISTENT (amendment 5, 2026-10-16; widened by amendment 6 the same night): not reproduced under any hypothesis, but
         the printed centavos lie inside the interval of prices the printed rate's own precision allows — rate ± half a unit of
         its last printed decimal — under one of the settlement hypotheses decided for the row. The primary is tried first and
         every hypothesis that holds is recorded by its code (as REPRODUCED records its matches), so the census can say under
         which settlement each CONSISTENT row sits. The LFT's published rates (2 decimals, ágio/deságio) are roundings of the
         rate actually used; until September 2021 the sell side settled D+1, which the primary (D+0) alone never sees. */
      if (!matches.length) {
        const dp = (taxa.split(/[,.]/)[1] || '').length; const unit = 5n * 10n ** BigInt(Math.max(0, 6 - dp - 1));   /* half a unit of the last decimal, at 10^-6 % */
        const [pn] = D.ratePercentToRational(taxa); const asPct = (x) => { const neg = x < 0n; const a = (neg ? -x : x).toString().padStart(7, '0'); return (neg ? '-' : '') + a.slice(0, -6) + ',' + a.slice(-6); };
        const keys = Object.keys(out.hyp).sort((a, b) => (a === PRIMARY[side] ? -1 : b === PRIMARY[side] ? 1 : 0));
        for (const key of keys) {
          const rec = out.hyp[key]; if (!rec.decided) continue;
          const lo = decide(r.kind, asPct(pn - unit), rec.settle, r.maturity, CALS[rec.calendar], r.date), hi = decide(r.kind, asPct(pn + unit), rec.settle, r.maturity, CALS[rec.calendar], r.date);
          if (!(lo.decided && hi.decided)) continue;
          const a = lo.pu6 < hi.pu6 ? lo.pu6 : hi.pu6, b = lo.pu6 < hi.pu6 ? hi.pu6 : lo.pu6;
          if (printed >= D.trunc2(a) && printed <= D.round2(b)) {
            if (!out.consistent) out.consistent = { codes: [], under: key, rateBox: [asPct(pn - unit), asPct(pn + unit)], puRange: [D.dec(a, 6), D.dec(b, 6)] };
            out.consistent.codes.push(key);
          }
        }
      }
      if (matches.length) { out.verdict = 'REPRODUCED'; out.codes = matches; }
      else if (out.consistent) { out.verdict = 'CONSISTENT'; }
      else if (prim.needsData) { out.verdict = 'NEEDS DATA'; out.why = prim.needsData; }
      else if (!prim.decided) { out.verdict = 'REFUSED'; }
      else { out.verdict = 'OFF'; out.diffCents = (printed - prim.t2).toString(); out.diffCentsR = (printed - prim.r2).toString(); }
      results.push(out);
    }
    return results;
  }
  return { decideRow, decide, vnaFor, metaAt, IDX, cal, calPre, CALS, PRIMARY, HYPS, nextSettle, nextSettleB3, sameOrNextB3 };
}

const PU_ROWS = { rowDecider };
if (typeof module !== 'undefined' && module.exports) module.exports = PU_ROWS;
else if (typeof globalThis !== 'undefined') globalThis.PU_ROWS = PU_ROWS;
