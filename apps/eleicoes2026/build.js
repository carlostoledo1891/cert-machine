#!/usr/bin/env node
/* build.js — site/eleicoes2026/index.html: the 2026 presidential election, both rounds, decided where the published
   bytes allow and refused where they do not. Unlisted (noindex, in no index or sitemap) until the operator links it.

   EVERY NUMBER IS READ HERE from corpus/eleicoes2026/ledger.json (tools/eleicoes2026/ledger.py), which is re-derived
   first (--check) so a page can never show a number its inputs no longer give. The ledger reads the TSE's own files,
   pinned: the BU na Web of every section (corpus/eleicoes2026/PINS.json), the signed results of both rounds
   (SIGNED-PINS.json), the urns' logs where read, the claims as said (claims.json) and the polls as published
   (polls.json). Written in English since 2026-10-30 (the operator: "no more pt-BR pages"); it was Portuguese until then.
   A translation never re-derives a number: the ledger's own strings that carry a decimal comma ('51,79') are shown
   with a decimal point (dp below), nothing else is changed in them.

   usage: node apps/eleicoes2026/build.js                                                                           MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const OUT = path.join(ROOT, 'site', 'eleicoes2026');
const FIG = require(path.join(__dirname, 'figures.js'));
const GEO = require(path.join(__dirname, 'geo.js'));
/* WARRANT (design/WARRANT.md, v2.1): a value that is a float or a model's fit is computed (underlined dashed); a line
   computed in floating point is dashed by its standing, never to tell one series from another (identity is the
   series' token); a number that rests on a model or on chosen inputs names them (the mood, and the premise chain). */
const WR = require(path.join(ROOT, 'playground', 'warrant.js'));
const cv = (t, why) => WR.value(C.esc(t), WR.COMPUTED, { title: 'computed: ' + why });
const die = (m) => { console.error('ELEICOES2026 PAGE REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');

try { cp.execFileSync('python3', ['tools/eleicoes2026/ledger.py', '--check'], { cwd: ROOT, encoding: 'utf8' }); }
catch (e) { die('the ledger does not re-derive: ' + (e.stdout || e.stderr || e.message)); }
const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'eleicoes2026', 'ledger.json'), 'utf8'));
const D = L.decisions;
const CL = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'eleicoes2026', 'claims.json'), 'utf8')).claims;
for (const k of ['SIG', 'R1-SUM', 'R1-SEC', 'R2-ARITH', 'R2-WIN', 'R2-SUM', 'EXT', 'C6', 'MINURNS', 'RLA', 'TRANSFER', 'MEANFIELD']) if (!D[k]) die('the ledger lacks ' + k);

const n = (x) => Number(x).toLocaleString('en-US');
const pct = (a, b, d = 2) => (100 * a / b).toFixed(d);
/* a ledger string written with a decimal comma ('51,79', '3,99'), shown with a decimal point; the digits untouched */
const dp = (s) => { const t = String(s); if (!/^-?\d+(,\d+)?$/.test(t)) die('not a ledger decimal: ' + t); return t.replace(',', '.'); };
const m = (s) => '<span class="m">' + C.esc(s) + '</span>';
/* the verdict as a house tag: filled when decided, dashed while the deciding bytes are not yet published (the stroke grammar:
   dashed = not yet tested), outlined for a refusal or a measurement; the word always beside the form. The words are the
   house's own (the Portuguese page mapped them one to one: CERTIFICADO, REFUTADO, RECUSADO, FALTAM DADOS, PARCIAL, MEDIDO) */
const KIND = { CERTIFIED: 'cert', REFUTED: 'held', 'NEEDS DATA': 'open', REFUSED: 'dep', MEASURED: 'dep', PARTIAL: 'dep' };
const stamp = (v) => { if (!KIND[v]) die('a verdict word this page has no form for: ' + v); return C.tag(v, KIND[v]); };
const UF_NAMES = { AC: 'Acre', AL: 'Alagoas', AM: 'Amazonas', AP: 'Amapá', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo',
  GO: 'Goiás', MA: 'Maranhão', MG: 'Minas Gerais', MS: 'Mato Grosso do Sul', MT: 'Mato Grosso', PA: 'Pará', PB: 'Paraíba', PE: 'Pernambuco',
  PI: 'Piauí', PR: 'Paraná', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RO: 'Rondônia', RR: 'Roraima', RS: 'Rio Grande do Sul',
  SC: 'Santa Catarina', SE: 'Sergipe', SP: 'São Paulo', TO: 'Tocantins', ZZ: 'Abroad' };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayMon = (iso) => { const [, mo, d] = String(iso).split('-').map(Number); return d + ' ' + MON[mo - 1]; };
/* THE QUOTED CLAIMS IN ENGLISH. claims.json keeps each quotation in the Portuguese it was said in (said / disse); the page
   shows our translation, and refuses to build if the original it translates is no longer the record's. */
const QUOTE_EN = {
  C1: ['É impossível reconhecer o resultado dessa eleição no contexto em que essas coisas aconteceram. Vamos pedir a anulação dessas eleições.',
    'It is impossible to recognise the result of this election in the context in which these things happened. We are going to ask for these elections to be annulled.'],
  C2: ['Eu nunca vou saber se, num estado onde as urnas não foram reabertas, quantos votos eu poderia ter.',
    'I will never know, in a state where the voting machines were not reopened, how many votes I could have had.'],
  C3: ['Nossos fiscais do PL foram retirados de dentro da sala-cofre a partir do momento que essa eleição foi tomada.',
    'Our PL inspectors were removed from inside the vault room from the moment this election was taken.']
};
const saidEn = (c) => {
  if (!c.quoted) return c.said + ' (paraphrase)';
  const q = QUOTE_EN[c.id];
  if (!q || q[0] !== c.said) die('the quotation ' + c.id + ' has no English translation of the record\'s words');
  return '"' + q[1] + '" (our translation)';
};

const W2 = D['R2-WIN'], R1 = D['R1-SUM'], EXT = D.EXT;
const r1c = R1.candidates;
const r1valid = Object.values(r1c).reduce((a, c) => a + c.votes, 0);
const extDone = EXT.ufs_complete;
const extLate = extDone.reduce((a, uf) => a + EXT.logs[uf].late_votes, 0);
const extVotes = extDone.reduce((a, uf) => a + EXT.logs[uf].votes_in_logs, 0);

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · dossier · Brazil’s 2026 presidential election · round 1 (4 October) and round 2 (25 October) · read ' + L.generated,
  title: 'Brazil’s 2026 election: what the numbers can decide',
  deck: 'The losing side asks for the second round to be annulled. Here, every claim that can be checked in the public files of the TSE (the Superior Electoral Court) is decided in exact arithmetic, '
    + 'by programs written from scratch with no TSE code; what cannot be checked in those files is refused, with the reason. '
    + 'The question "was the election fair?" is not a calculation: this dossier answers the smaller questions, which are calculations, and says which ones are left out.'
}));
B.push(C.scope('Published, not peer-reviewed, not independently audited. The data are the TSE’s, read from its public files and sealed by sha256 '
  + '(and by sha512, where the TSE publishes its own). No line of this work comes from the TSE, a party or a campaign; no conclusion about people, intentions or the legality of court decisions is drawn here.'));

B.push(C.figure({ svgRaw: FIG.scoreboard({ lula: W2.lula, flavio: W2.flavio, margin: W2.margin }), caption: 'Round 2, 25 October 2026: valid votes in the result signed by the TSE (' + n(W2.sections) + ' sections totalled; a section, seção, is one polling station’s voting machine).' }));

B.push(C.tldr({
  findingRaw: '<b>The published numbers add up, and the margin is too large for the extension.</b> '
    + 'In round 1, the sum of the ' + n(D['R1-SEC'].sections) + ' polling-station reports (boletins de urna), computed by two independent programs, equals the TSE’s signed official result vote for vote, in every state and abroad. '
    + 'In round 2, the signed result gives Lula ' + n(W2.lula) + ' votes and Flávio Bolsonaro ' + n(W2.flavio) + ': a difference of ' + n(W2.margin) + '. '
    + 'For the extension to change the winner, at least ' + n(W2.margin) + ' votes would have had to come in after 17:00, all for Lula; the TSE reports ' + n(EXT.tse_reported_late_votes) + '. '
    + (extDone.length ? 'In the states whose voting-machine logs we have already read in full (' + extDone.join(', ') + '), there were ' + n(extLate) + ' votes after 17:00 out of ' + n(extVotes) + '. ' : '')
    + 'Pending until the TSE publishes the complete round-2 files: the section-by-section sum and the national count of late votes.',
  mechanismRaw: 'Three kinds of proof. <b>Exact sum:</b> every polling-station report (BU) is added up in whole numbers, with no rounding, by one program in Python and another in JavaScript that share no code; the two must agree and match the official result. '
    + '<b>Digital signature:</b> the TSE signs every result file (JWS, Ed25519); the signature is verified by two independent implementations, and a file with a single digit changed is refused by both. '
    + '<b>Voting-machine log:</b> every voting machine (urna) records, with the time, each vote counted; we count those that came after 17:00 on each machine’s clock.',
  checkRaw: m('python3 tools/eleicoes2026/fetch.py bweb 1') + ' downloads the reports and checks the sha512 the TSE publishes; '
    + m('python3 tools/eleicoes2026/ledger.py --check') + ' re-derives every decision from the sealed files.'
}));

B.push(C.stats([
  { k: 'round 1 · reports summed', v: n(D['R1-SEC'].sections), n: 'Sections with a vote for president, summed by two programs: ' + (R1.verdict === 'CERTIFIED' ? 'equal to the official result' : 'DIFFERENT from the official result') + '.' },
  { k: 'signed results checked', v: D.SIG.verified + ' of ' + D.SIG.files, n: 'Brazil, the 27 federative units (UFs) and abroad, in both rounds. One changed digit is refused.' },
  { k: 'round 2 · difference', v: n(W2.margin), n: 'Lula ' + n(W2.lula) + ' × Flávio ' + n(W2.flavio) + ' valid votes (signed result).' },
  { k: 'votes after 17:00 (TSE)', v: n(EXT.tse_reported_late_votes), n: (100 * EXT.tse_reported_late_votes / W2.margin).toFixed(1) + '% of what would be needed to reverse the result.' }
]));

/* §1 the verdicts */
const verdictRows = [
  ['Round 1: the sum of the polling-station reports is the official result', D['R1-SUM'].verdict, 'Equal candidate by candidate, blank, null and turnout, in Brazil and in each UF.'],
  ['Round 1: every report is arithmetically consistent', D['R1-SEC'].verdict, n(D['R1-SEC'].sections) + ' sections: votes = turnout; turnout + abstentions = registered voters.'],
  ['The TSE’s signed results are authentic', D.SIG.verdict, D.SIG.verified + ' of ' + D.SIG.files + ' files verified by two implementations of Ed25519.'],
  ['Round 2: the signed result balances its own accounts', D['R2-ARITH'].verdict, 'Valid = Lula + Flávio; blank and null; turnout; states + abroad = Brazil.'],
  ['Round 2: Lula had more valid votes', W2.verdict, n(W2.lula) + ' against ' + n(W2.flavio) + ' in the signed result.'],
  ['Round 2: the sum of the reports is the official result', D['R2-SUM'].verdict, 'The TSE has not yet published the round-2 reports in bulk; we decide on the day it does.'],
  ['The extension to 19:00 decided the result', EXT.verdict === 'CERTIFIED' ? 'REFUTED' : EXT.verdict, 'It would take ' + n(W2.margin) + ' votes after 17:00, all on one side. National count pending the complete logs.'],
  ['Reversing round 2 would require tampering with at least ' + n(D.MINURNS.urns_if_every_voter_swapped) + ' voting machines', D.MINURNS.verdict, 'Even swapping every vote in each machine, from the largest to the smallest (§7).'],
  ['A sampling audit would confirm the winner with ' + n(D.RLA.comparison_ballots) + ' votes', D.RLA.verdict, 'Vote-by-vote comparison, 1% risk, no discrepancies in the sample (§7).'],
  ['"' + dp(D.C6.said) + '%" (said at the proclamation)', D.C6.verdict, 'The signed fraction is ' + D.C6.signed_exact + ' = ' + dp(D.C6.signed_2dp) + '%. It does not change the winner.']
];
B.push(C.section({
  lab: '§1 · the verdicts', title: 'What was decided', wide: true,
  bodyRaw: C.table({ cols: [{ h: 'claim' }, { h: 'verdict' }, { h: 'why' }], rows: verdictRows.map(([a, v, w]) => [a, { raw: stamp(v) }, w]) })
    + C.pRaw('<b>CERTIFIED</b>: proved in exact arithmetic. <b>REFUTED</b>: false, with the number that shows it. <b>REFUSED</b>: cannot be decided with these data, and the reason. <b>NEEDS DATA</b>: the file that decides has not been published yet. <b>MEASURED</b>: a measurement or a model, not a decision.')
}));

/* §2 the maps */
const RAMP = [[0.65, 'l4'], [0.60, 'l3'], [0.55, 'l2'], [0.50, 'l1'], [0.45, 'f1'], [0.40, 'f2'], [0.35, 'f3'], [-1, 'f4']];
const tone = (sh) => 'var(--el-' + RAMP.find(([t]) => sh >= t)[1] + ')';
const rampLegend = (w) => {
  const steps = [['f4', '< 35%'], ['f3', '35–40'], ['f2', '40–45'], ['f1', '45–50'], ['l1', '50–55'], ['l2', '55–60'], ['l3', '60–65'], ['l4', '≥ 65%']];
  const sw = Math.min(54, (w - 20) / 8);
  return steps.map(([k, t], i) => '    <rect x="' + (10 + i * sw).toFixed(1) + '" y="{Y}" width="' + (sw - 2).toFixed(1) + '" height="10" fill="var(--el-' + k + ')"/>'
    + '<text x="' + (10 + i * sw + (sw - 2) / 2).toFixed(1) + '" y="{Y}" dy="25" text-anchor="middle" class="t-note">' + C.esc(t) + '</text>').join('\n');
};
const ufShare = (rnd) => (code) => {
  const uf = GEO.UF_CODE[code];
  const u = uf && W2.per_uf[uf];
  if (!u) return null;
  const l = rnd === 1 ? u.r1_lula : u.lula, f = rnd === 1 ? u.r1_flavio : u.flavio, sh = l / (l + f);
  return { fill: tone(sh), label: (UF_NAMES[uf] || uf) + ' · round ' + rnd, detail: 'Lula ' + pct(l, l + f, 1) + '% · Flávio ' + pct(f, l + f, 1) + '% (between the two)' };
};
const MUN = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'eleicoes2026', 'derived', 'r1-municipios.json'), 'utf8')).municipios;
const munShare = (code) => {
  const u = MUN[code];
  if (!u || u.lula + u.flavio === 0) return null;
  const sh = u.lula / (u.lula + u.flavio);
  return { fill: tone(sh), label: u.name + ' (' + u.uf + ')', detail: 'Lula ' + pct(u.lula, u.lula + u.flavio, 1) + '% · Flávio ' + pct(u.flavio, u.lula + u.flavio, 1) + '% between the two, round 1' };
};
const lulaMun = Object.values(MUN).filter((u) => u.lula > u.flavio).length, flavioMun = Object.values(MUN).filter((u) => u.flavio > u.lula).length;
B.push(C.section({
  lab: '§2 · the map', title: 'The country in two maps: round 1 and round 2, state by state', wide: true,
  bodyRaw: C.pRaw('The shade of each state is Lula’s share between the two finalists, on a single grey scale: lighter where Lula had more votes than Flávio, darker where Flávio had more, and more extreme the larger the lead; the 50% boundary lies between the fourth and the fifth step of the legend. '
      + 'The numbers come from the TSE’s signed results (§4); the boundaries from the official mesh of the IBGE (the national statistics institute).')
    + '<div class="el-pair">' + C.figure({ wide: false, svgRaw: GEO.choropleth({ level: 'uf', w: 440, value: ufShare(1), alt: 'Round 1 map by state', legendRaw: rampLegend(440) }), caption: 'Round 1 (4 October).' })
    + C.figure({ wide: false, svgRaw: GEO.choropleth({ level: 'uf', w: 440, value: ufShare(2), alt: 'Round 2 map by state', legendRaw: rampLegend(440) }), caption: 'Round 2 (25 October).' }) + '</div>'
    + C.pRaw('<b>Municipality by municipality, round 1.</b> Adding up the polling-station reports of each municipality: Lula ahead of Flávio in ' + n(lulaMun) + ' municipalities, Flávio ahead in ' + n(flavioMun) + '. '
      + 'The round-2 map by municipality comes in when the TSE publishes the round-2 reports in bulk.')
    + C.figure({ svgRaw: GEO.choropleth({ level: 'mun', w: 900, value: munShare, alt: 'Round 1 map by municipality: Lula’s share between the two finalists', legendRaw: rampLegend(900) }),
      caption: 'Round 1, ' + n(Object.keys(MUN).length) + ' municipalities: Lula’s share between Lula and Flávio, summed from the polling-station reports (§3). Hover to see each municipality.' })
}));

/* §3 round 1 */
const ufRows = R1.scopes.filter((s) => s.scope !== 'BR').map((s) => [UF_NAMES[s.scope] || s.scope, n(s.bu_sections_with_votes), n(s.turnout),
  { raw: Object.values(s.equal).every(Boolean) ? '<b>equal</b>' : '<b>DIFFERENT</b>' }]);
const order = Object.entries(r1c).sort((a, b) => b[1].votes - a[1].votes);
B.push(C.section({
  lab: '§3 · round 1', title: 'The polling-station reports add up exactly to the official result', wide: true,
  bodyRaw: C.pRaw('The polling-station report (boletim de urna, BU) is the sheet each voting machine prints when voting closes and that is posted on the door of the section, with that section’s votes. The TSE publishes all of them, as files, by state. '
      + 'We summed the ' + n(D['R1-SEC'].sections) + ' reports for the office of president twice, by programs that share no code, and compared them with the signed official result.')
    + C.table({ cols: [{ h: 'candidate' }, { h: 'number' }, { h: 'votes (sum of the BUs = official)' }, { h: '% of valid votes' }],
      rows: order.map(([k, c]) => [c.name, k, n(c.votes), pct(c.votes, r1valid)]) })
    + C.pRaw('Blank ' + n(R1.blank) + ' · null ' + n(R1.null) + ' · turnout ' + n(R1.turnout) + ' of ' + n(R1.registered) + ' registered voters. '
      + 'One section operated with no vote at all for president and so does not appear in the presidential reports: hence the ' + n(D['R1-SEC'].sections) + ' sections with votes against the ' + n(R1.scopes[0].signed_sections_installed) + ' installed.')
    + '<details><summary>By state</summary>' + C.table({ cols: [{ h: 'UF' }, { h: 'sections' }, { h: 'turnout' }, { h: 'sum × official' }], rows: ufRows }) + '</details>'
}));

/* §4 the signatures */
B.push(C.section({
  lab: '§4 · signatures', title: 'The results the TSE publishes are signed, and the signatures check out',
  bodyRaw: C.pRaw('The TSE’s results site also delivers every result in a digitally signed version (JWS format, Ed25519 algorithm). The public key is in the TSE’s own app. '
      + 'A valid signature proves that the file is exactly what the TSE signed: changing one vote, one digit, invalidates the signature.')
    + C.pRaw('We verified the ' + D.SIG.files + ' files (Brazil, the 27 UFs and abroad, in both rounds) with two implementations with no code in common: one written from scratch from RFC 8032, with integers only, and the other with Node’s cryptography. '
      + 'Result: ' + D.SIG.verified + ' of ' + D.SIG.files + ' valid, and the signed content is the same as what the site shows. '
      + 'Red control: we changed a single digit of one total in the national round-2 file; both implementations refused the signature.')
    + C.pRaw('What this proves and what it does not: it proves that the numbers are the TSE’s and were not altered on their way to you. It does not prove, on its own, that the TSE added correctly; that is §3 (round 1) and, when the round-2 reports come out, the same calculation.')
}));

/* §5 round 2 */
const R1S = D['R1-SUM'];
const r1Other = R1S.valid - r1c['13'].votes - r1c['22'].votes;
const elect = FIG.electorate([r1c['13'].votes, r1c['22'].votes, r1Other, R1S.blank + R1S.null, R1S.abstention],
  [W2.lula, W2.flavio, 0, W2.blank + W2.null, W2.abstention]);
const grewAll = Object.values(W2.per_uf).every((u) => u.lula / (u.lula + u.flavio) > u.r1_lula / (u.r1_lula + u.r1_flavio));
const swings = Object.entries(W2.per_uf).map(([uf, u]) => [uf, 100 * (u.lula / (u.lula + u.flavio) - u.r1_lula / (u.r1_lula + u.r1_flavio))]);
const swMin = swings.reduce((a, b) => (b[1] < a[1] ? b : a)), swMax = swings.reduce((a, b) => (b[1] > a[1] ? b : a));
const fmt1 = (x) => x.toFixed(1);
const bnDrop = R1S.blank + R1S.null - W2.blank - W2.null, abstDrop = R1S.abstention - W2.abstention;
const lulaGain = W2.lula - r1c['13'].votes, flavioGain = W2.flavio - r1c['22'].votes, pool = r1Other + bnDrop + abstDrop;
if (pool !== lulaGain + flavioGain || R1S.registered_functioning !== W2.registered_functioning) die('the balance between the rounds does not close');
B.push(C.section({
  lab: '§5 · round 2', title: 'The signed result: a difference of ' + n(W2.margin) + ' votes', wide: true,
  bodyRaw: C.pRaw('Lula ' + n(W2.lula) + ' (' + dp(W2.lula_share_2dp) + '% of valid votes), Flávio Bolsonaro ' + n(W2.flavio) + '. Blank ' + n(W2.blank) + ', null ' + n(W2.null)
      + ', turnout ' + n(W2.turnout) + ' of ' + n(W2.registered) + ' registered, ' + n(W2.sections) + ' sections. The file’s own accounts balance, and the 27 states plus abroad add up exactly to Brazil.')
    + C.pRaw('To reverse the winner, ' + n(W2.swing_to_reverse) + ' votes would have to switch sides (a vote that leaves Lula and goes to Flávio changes the difference by two), or ' + n(W2.removal_to_reverse) + ' of Lula’s votes would have to be annulled.')
    + C.figure({ svgRaw: elect, caption: 'The whole electorate of the sections that operated, in each round: who voted for whom, who voted blank or null and who did not vote. Between the rounds, abstention fell from '
      + fmt1(100 * R1S.abstention / R1S.registered_functioning) + '% to ' + fmt1(100 * W2.abstention / W2.registered_functioning) + '%; the other ' + n(Object.keys(r1c).length - 2) + ' round-1 candidates were no longer an option in round 2.' })
    + C.figure({ svgRaw: FIG.balance({ others: r1Other, blankDrop: bnDrop, abstDrop, lulaGain, flavioGain }),
      caption: 'Between the rounds, ' + n(pool) + ' votes opened up for the finalists: the ' + n(r1Other) + ' that had gone to other candidates, ' + n(bnDrop) + ' fewer blank and null votes and ' + n(abstDrop)
        + ' more voters. Lula took ' + n(lulaGain) + ' (' + pct(lulaGain, pool, 1) + '%), Flávio ' + n(flavioGain) + '. The two bars have the same total: it is an exact identity, because the electorate is the same in both rounds.' })
    + C.pRaw('<b>A swing spread out, not concentrated.</b> Between the two finalists, Lula’s share grew ' + (grewAll ? 'in all ' + n(Object.keys(W2.per_uf).filter((uf) => uf !== 'ZZ').length) + ' states' + (W2.per_uf.ZZ ? ' and abroad' : '') : 'in most states')
      + ', from +' + fmt1(swMin[1]) + ' pp (' + (UF_NAMES[swMin[0]] || swMin[0]) + ') to +' + fmt1(swMax[1]) + ' pp (' + (UF_NAMES[swMax[0]] || swMax[0]) + '). '
      + 'Similar changes across the whole country are what one expects when voters for other candidates and people who had not voted choose a side; the two maps in §2 show each state, and §7 looks at this pattern closely.')
}));

/* §6 the extension */
const scaleSvg = FIG.scale([
  { k: 'Lula’s votes that would have to be annulled to reverse the result', v: W2.removal_to_reverse, fill: 'var(--c-s1)', stroke: 'var(--ink-5)', emph: true },
  { k: 'or votes that would have to switch sides', v: W2.swing_to_reverse, fill: 'var(--c-s2)' },
  { k: 'votes after 17:00 nationwide, according to the TSE', v: EXT.tse_reported_late_votes, fill: 'var(--c-1)', emph: true }
].concat(extDone.map((uf) => ({ k: 'votes after 17:00 in ' + (UF_NAMES[uf] || uf) + ', counted in the voting-machine logs', v: Math.max(1, EXT.logs[uf].late_votes), fill: 'var(--c-1)' }))));
const RC = D['R1-CLOSE'];
const closeSvg = RC ? CH.dist({ w: 900, h: 300, alt: 'Minutes after 17:00 at which each voting machine closed, in round 1', x0: 0, x1: 61, padL: 70,
  bins: Object.keys(RC.minute_histogram).sort((a, b) => a - b).map((k) => ({ k: k + ' min', n: RC.minute_histogram[k] }))
    .concat([{ k: '60 min or more', n: RC.closed_60_or_more_minutes_after, token: CH.CTX }]),
  xTicks: [0, 10, 20, 30, 40, 50, 60].map((v) => ({ v: v + 0.5, t: v === 60 ? '60+' : v + ' min' })), yTicks: [],
  xLabel: 'minutes after 17:00 (on each machine’s clock) at which the machine closed voting',
  marks: [{ x: RC.percentiles_minutes.p50 + 0.5, t: 'half had closed by ' + fmt1(RC.percentiles_minutes.p50) + ' min' }], unit: 'voting machines' }) : '';
const logTable = Object.entries(EXT.logs).map(([uf, x]) => [UF_NAMES[uf] || uf, n(x.sections_read) + ' of ' + n(x.sections_installed), n(x.votes_in_logs) + ' of ' + n(x.turnout_signed),
  n(x.late_votes), String(x.max_late_in_a_section), { raw: x.complete ? '<b>complete</b>' : 'partial' }]);
B.push(C.section({
  lab: '§6 · the extension', title: 'For the extension to reverse the result, ' + n(W2.margin) + ' votes after 17:00 would be needed', wide: true,
  bodyRaw: C.pRaw('At 16:32 on 25 October, Justice Cristiano Zanin of the STF (the Supreme Federal Court) extended voting to 19:00 in the sections still open, at the request of Lula’s coalition, because of reduced bus service in some cities. '
      + 'Flávio Bolsonaro’s campaign had asked the TSE for a similar extension in 17 municipalities of SP, PR and SC, because of rain. The legality of the decision is a legal question and is not decided here. '
      + 'The question that is a calculation is another one: <b>could the votes that existed only because of the extension have decided the election?</b>')
    + C.figure({ svgRaw: scaleSvg, caption: 'Squares with area proportional to the number of votes, all in the same corner. The outer square is what would reverse the result; the small ones, in the corner, the votes cast after 17:00.' })
    + (RC ? C.pRaw('<b>Voting after 17:00 is not, in itself, irregular.</b> By law, whoever is in line at 17:00 votes. In round 1, with no extension at all, half of the country’s ' + n(RC.sections)
        + ' voting machines closed within ' + fmt1(RC.percentiles_minutes.p50) + ' minutes after 17:00, and ' + n(RC.closed_60_or_more_minutes_after) + ' closed an hour or more later, because of the queues of a day with six votes per voter. '
        + 'Part of the round-2 votes after 17:00 is that usual queue; what the extension added is at most the late total.')
      + C.figure({ svgRaw: closeSvg, caption: 'Round 1, no extension: how many voting machines closed voting in each minute after 17:00 (on each machine’s clock, abroad excluded). The last bar groups those that closed an hour or more later.' }) : '')
    + C.pRaw('<b>How we count.</b> Each voting machine writes a log with the time of every event, and a line "O voto do eleitor foi computado" (the voter’s vote was counted) for every vote. The machine’s clock is on local time, so the limit is the time the machine became "ready to receive votes" (8:00 Brasília time, in its own time zone) plus 9 hours. '
      + 'A vote at 17:00 or later counts as late. The logs come from the TSE’s results site, section by section; each file is sealed by sha256.')
    + (logTable.length ? C.table({ cols: [{ h: 'UF' }, { h: 'sections read' }, { h: 'votes in the logs × turnout' }, { h: 'after 17:00' }, { h: 'max. in one section' }, { h: 'reading' }], rows: logTable }) : '')
    + C.pRaw('<b>What is missing.</b> The national count needs the logs of all ' + n(W2.sections) + ' sections. The TSE publishes them in bulk on its open-data portal (in round 1, three days later). Until then, the national verdict is NEEDS DATA, '
      + 'with the threshold published: only a total of at least ' + n(W2.margin) + ' late votes, all for Lula, would reverse the result. The TSE’s figure is ' + (100 * EXT.tse_reported_late_votes / W2.margin).toFixed(2) + '% of that.')
}));

/* §7 the mathematics of the margin */
{
  const MU = D.MINURNS, RL = D.RLA, MF = D.MEANFIELD, TR = D.TRANSFER;
  const curvePts = Object.entries(MU.curve).map(([k, v]) => [Number(k), v]).sort((a, b) => a[0] - b[0]);
  const urnSvg = CH.scatter({ w: 900, h: 380, alt: 'Registered voters accumulated over the largest voting machines, against the number of machines, with the thresholds that would reverse the result',
    x0: 1, x1: 6e5, y0: 500, y1: 2e8, logX: true, logY: true, padL: 96,
    xTicks: [1, 10, 100, 1e3, 1e4, 1e5].map((v) => ({ v, t: n(v) })), yTicks: [1e3, 1e4, 1e5, 1e6, 1e7, 1e8].map((v) => ({ v, t: n(v) })),
    xLabel: 'number of voting machines, largest to smallest (log scale)', yLabel: 'registered voters in those machines',
    curves: [{ pts: curvePts, token: CH.CAT[1], k: '' }],
    hlines: [{ y: MU.swing_needed, token: 'var(--el-lula)' }, { y: MU.removal_needed, token: 'var(--el-flavio)' }],
    pts: [{ x: MU.urns_if_every_voter_swapped, y: MU.swing_needed, token: 'var(--el-lula)', k: 'swap', v: n(MU.urns_if_every_voter_swapped) + ' machines, every voter swapped' },
      { x: MU.urns_if_every_voter_removed, y: MU.removal_needed, token: 'var(--el-flavio)', k: 'annul', v: n(MU.urns_if_every_voter_removed) + ' machines, every vote annulled' }],
    keys: [{ token: 'var(--el-lula)', t: 'switch ' + n(MU.swing_needed) + ' votes: ' + n(MU.urns_if_every_voter_swapped) + ' machines' }, { token: 'var(--el-flavio)', t: 'annul ' + n(MU.removal_needed) + ' votes: ' + n(MU.urns_if_every_voter_removed) + ' machines' }] });

  /* the three audits as curves over the winner's share, every point from the same formulas the ledger certifies at 2026's margin */
  /* the chosen inputs, read from the ledger (the curves used to type them): the risk limit and the super-simple gamma */
  if (!/^1\/\d+$/.test(RL.risk || '') || !/60-digit/.test(RL.arithmetic || '') || !/1e-40/.test(RL.arithmetic || '')) die('the RLA record lost its risk or its arithmetic note');
  const alpha = 1 / Number(RL.risk.split('/')[1]), riskPct = n(100 * alpha), g = Number(RL.comparison_gamma);
  const ballots = W2.turnout, two = W2.valid;
  const asn = (sh) => (Math.log(1 / alpha) + 0.5 * Math.log(2 * sh)) / (sh * Math.log(2 * sh) + (1 - sh) * Math.log(2 - 2 * sh)) * ballots / two;
  const mu = (sh) => (2 * sh - 1) * two / ballots;
  const cmp = (sh) => 2 * g * Math.log(1 / alpha) / mu(sh);
  const bat = (sh) => Math.log(alpha) / Math.log(1 - mu(sh) / 2);
  const grid = []; for (let v = 50.5; v <= 60.001; v += 0.25) grid.push(v);
  const s26 = 100 * W2.lula / W2.valid;
  const rlaSvg = CH.scatter({ w: 900, h: 380, alt: 'Sample size of a risk-limiting audit, by margin, for three methods, with 2026 marked',
    x0: 50, x1: 60.5, y0: 30, y1: 1e6, logY: true, padL: 96,
    xTicks: [50, 52, 54, 56, 58, 60].map((v) => ({ v, t: v + '%' })), yTicks: [100, 1e3, 1e4, 1e5, 1e6].map((v) => ({ v, t: n(v) })),
    xLabel: 'the winner’s share between the two finalists', yLabel: 'sample needed (1% risk)',
    /* the curves are the formulas in JavaScript floating point at every share: computed, so dashed, all three (the third
       used to be the only dashed one, to tell it from the second: dash for identity, WARRANT rule 4). Only the three points
       on the 2026 line are the ledger's certified numbers. */
    curves: [{ pts: grid.map((v) => [v, asn(v / 100)]), token: CH.CAT[0], dashed: true, k: '' }, { pts: grid.map((v) => [v, cmp(v / 100)]), token: CH.CAT[1], dashed: true, k: '' }, { pts: grid.map((v) => [v, bat(v / 100)]), token: CH.CAT[2], dashed: true, k: '' }],
    vlines: [{ x: s26, token: 'var(--el-lula)', t: '2026: ' + s26.toFixed(2) + '%' }],
    pts: [{ x: s26, y: RL.polling_ballots, token: CH.CAT[0], k: 'by sampling votes', v: n(RL.polling_ballots) + ' votes' },
      { x: s26, y: RL.comparison_ballots, token: CH.CAT[1], k: 'by comparison, vote by vote', v: n(RL.comparison_ballots) + ' votes' },
      { x: s26, y: RL.batch_sections, token: CH.CAT[2], k: 'by comparison, machine by machine', v: n(RL.batch_sections) + ' machines' }],
    keys: [{ token: CH.CAT[0], t: 'sample votes (votes)', kind: 'dash' }, { token: CH.CAT[1], t: 'compare votes (votes)', kind: 'dash' }, { token: CH.CAT[2], t: 'compare machines (machines)', kind: 'dash' }] });

  const mfPts = MF.rows.map((r) => ({ x: 100 * r.others_r1, y: r.logit_shift, fill: r.m2 >= 0.5 ? 'var(--el-lula)' : 'var(--el-flavio)', label: r.uf === 'ZZ' ? 'abroad' : r.uf,
    k: UF_NAMES[r.uf] || r.uf, v: 'log-odds +' + r.logit_shift.toFixed(3) + ' · others in round 1 ' + (100 * r.others_r1).toFixed(1) + '%' }));
  const xs = mfPts.map((q) => q.x), ys = mfPts.map((q) => q.y), mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
  const slope = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  const mfSvg = FIG.labelled({ pts: mfPts, x0: 4, x1: 16, y0: 0.04, y1: 0.19, alt: 'Change in Lula’s log-odds between the rounds, by state, against the other candidates’ share in round 1',
    xTicks: [4, 6, 8, 10, 12, 14, 16].map((v) => ({ v, t: v + '%' })), yTicks: [0.05, 0.10, 0.15].map((v) => ({ v, t: '+' + v.toFixed(2) })),
    xLabel: 'votes for other candidates in round 1 (% of the state’s valid votes)', yLabel: 'change in Lula’s log-odds',
    fit: [[4.5, my + slope * (4.5 - mx)], [15.5, my + slope * (15.5 - mx)]] });

  B.push(C.section({
    lab: '§7 · the mathematics of the margin', title: 'Four calculations on the size of this victory', wide: true,
    bodyRaw: C.pRaw('<b>1. How many voting machines would have to be tampered with.</b> ' + stamp(MU.verdict) + ' In one machine, tampering moves at most as many votes as the machine has voters. '
        + 'Ordering the ' + n(MU.sections) + ' machines from the largest to the smallest (the largest has ' + n(MU.largest_capacity) + ' voters; the median one, ' + n(MU.median_capacity) + '), the exact calculation is: '
        + 'to switch the ' + n(MU.swing_needed) + ' votes that would reverse the result, at least <b>' + n(MU.urns_if_every_voter_swapped) + ' voting machines</b> would have to be tampered with, '
        + 'and that even assuming that in each one every voter turned up and every vote was switched. Annulling votes instead of switching them, at least ' + n(MU.urns_if_every_voter_removed) + '. '
        + 'Each of these machines prints its report, posts it on the door of the section and signs it digitally.')
      + C.figure({ svgRaw: urnSvg, caption: 'The curve adds up the registered voters of the largest machines: the first machine, the first two, and so on. It crosses the threshold lines at the numbers of machines marked. The registered voters per machine are the same in both rounds (the register is the same: ' + n(W2.registered_functioning) + ' registered in the sections that operated, in both).' })
      + C.pRaw('<b>2. How much a sampling check would need.</b> ' + stamp(RL.verdict) + ' A risk-limiting audit (the method several US states use) samples votes or voting machines and stops when the sample confirms the winner with a fixed risk of error. '
        + 'With this margin and <i>given a risk of ' + riskPct + '%, finding no discrepancy in the sample</i>: sample on average <b>' + n(RL.polling_ballots) + ' votes</b>; or compare <b>' + n(RL.comparison_ballots) + ' votes</b> one by one with the digital record; '
        + 'or recount <b>' + n(RL.batch_sections) + ' voting machines</b> in full, sampled with probability proportional to size. Computed with 60-digit logarithms (the formulas of Lindeman & Stark, 2012). '
        + 'Brazil has no printed vote; the sample would be of the reports and the digital vote records, which are public.')
      + C.figure({ svgRaw: rlaSvg, caption: 'The smaller the margin, the larger the sample. The curves are the same formulas computed in floating point at each margin, hence dashed; only the three points on the 2026 line are the certified numbers above. The machine curve and the compared-votes curve nearly coincide (' + n(RL.batch_sections) + ' machines, ' + n(RL.comparison_ballots) + ' votes); the colour and the legend say which is which.' })
      + WR.legendHtml({ compact: true })
      + C.pRaw('<b>What these numbers rest on.</b>') + WR.premisesHtml([
        { grade: WR.ASSUMED, label: 'The audit formulas', evidence: 'adopted from ' + C.esc(RL.source) + '; the arithmetic on them is exact (60-digit decimal logarithms, each ceiling refused if its value falls within 10⁻⁴⁰ of an integer), and the formulas are not checked here.' },
        { grade: WR.ASSUMED, label: 'The scenario', evidence: '<i>given a risk of ' + riskPct + '%, no discrepancy in the sample and γ = ' + C.esc(RL.comparison_gamma) + '</i>: choices, not data; with discrepancies, the sample grows.' }
      ], { meetLine: 'The arithmetic is exact; the weakest premise sits on the rung <b>' + WR.GRADE[WR.ASSUMED] + '</b>.' })
      + C.pRaw('<b>3. Where the votes came from.</b> ' + stamp(TR.verdict) + ' The exact calculation, with no model, gives for each flow (for example, Flávio’s round-1 voters who voted for Lula in round 2) the minimum and the maximum compatible with the numbers of each unit. '
        + 'With the data by state, the bounds say almost nothing: between 0 and ' + n(TR.bounds['others->lula'][1]) + ' of the voters for other candidates may have gone to Lula. '
        + stamp('NEEDS DATA') + ' With the round-2 reports by section, each of the ' + n(MU.sections) + ' sections becomes a unit and the bounds narrow; we will publish when the TSE publishes. The exact national balance is in §5.')
      + C.pRaw('<b>4. A mean-field look (a model, not a verdict).</b> ' + stamp('MEASURED') + ' In a mean-field model of the choice between two candidates (Brock and Durlauf), each voter decides by the sum of a common "field" and the influence of the others. '
        + 'A change in the national field moves every state’s log-odds equally if there is no mutual influence, and more in the balanced states if there is. '
        + 'In the data, Lula’s log-odds rose by between ' + cv('+' + MF.logit_shift_min.toFixed(3), 'floating point, 6 decimal places in the record') + ' and ' + cv('+' + MF.logit_shift_max.toFixed(3), 'floating point, 6 decimal places in the record') + ' in every state; '
        + 'the correlation with the state’s balance is ' + cv(MF.corr_shift_vs_balance.toFixed(2), 'a floating-point correlation') + ' (none), and with the other candidates’ share in round 1, ' + cv(MF.corr_shift_vs_others.toFixed(2), 'a floating-point correlation') + '. '
        + 'Reading: the swing was a national shift, larger where there were more voters with no candidate in round 2, and not a mutual-influence effect concentrated in the divided states. With ' + n(MF.rows.length) + ' units, it is a description, not a proof.')
      + C.figure({ svgRaw: mfSvg, caption: 'Each point is a state (colour: who won it in round 2). Vertical axis: how much Lula’s log-odds between the two finalists rose from round 1 to round 2. The dashed line is the linear fit, in floating point, only to guide the eye.' })
      + WR.premisesHtml([{ grade: WR.ASSUMED, label: 'The mean-field model (Brock and Durlauf)', evidence: 'adopted from the literature to read the data; nothing here checked it. The log-odds are calculations on the signed totals; their reading is the model’s.' }],
        { meetLine: 'The reading sits on the rung <b>' + WR.GRADE[WR.ASSUMED] + '</b>: with ' + n(MF.rows.length) + ' units, a description, not a proof.' })
  }));
}

/* §8 the polls */
if (D.POLLS) {
  const P = D.POLLS.polls.filter((p) => p.cells.length);
  const BR = D.POLLS.by_round;
  const lulaAhead1 = P.filter((p) => p.round === 1).filter((p) => { const l = p.cells.find((x) => x.candidate === '13'), f = p.cells.find((x) => x.candidate === '22'); return l && f && Number(l.published) > Number(f.published); }).length;
  const res = { 1: { '13': 100 * r1c['13'].votes / r1valid, '22': 100 * r1c['22'].votes / r1valid }, 2: { '13': 100 * W2.lula / W2.valid, '22': 100 * W2.flavio / W2.valid } };
  const ELEC = { 1: Date.UTC(2026, 9, 4), 2: Date.UTC(2026, 9, 25) };
  const leadRes = { 1: res[1]['22'] - res[1]['13'], 2: res[2]['22'] - res[2]['13'] };
  const leadPts = P.filter((p) => p.lead_published_flavio_minus_lula !== undefined).map((p) => {
    const [y, mo, d] = String(p.published).split('-').map(Number);
    const days = (Date.UTC(y, mo - 1, d) - ELEC[p.round]) / 864e5;
    const [ln, ld] = p.lead_published_flavio_minus_lula.split('/'); const lead = Number(ln) / Number(ld || 1);   /* the ledger keeps it as an exact fraction */
    return { x: days, y: lead, token: p.round === 1 ? CH.CAT[1] : CH.CAT[0], diamond: p.round === 1, hollow: p.round === 1, k: p.pollster + ' · round ' + p.round + ' · ' + p.published,
      v: 'Flávio − Lula: ' + (lead >= 0 ? '+' : '') + lead.toFixed(1) + ' pp' };
  });
  const below1 = leadPts.filter((q) => q.diamond && q.y < leadRes[1]).length, n1 = leadPts.filter((q) => q.diamond).length;
  const above2 = leadPts.filter((q) => !q.diamond && q.y > leadRes[2]).length, n2 = leadPts.filter((q) => !q.diamond).length;
  const leadSvg = CH.scatter({ w: 900, h: 360, alt: 'Flávio’s lead over Lula in each poll, by days before the election, in both rounds, against the result',
    x0: -9, x1: 3.2, y0: -8, y1: 8, padL: 96,
    xTicks: [-8, -6, -4, -2, 0].map((v) => ({ v, t: v === 0 ? 'eve' : v + ' days' })), yTicks: [-8, -4, 0, 4, 8].map((v) => ({ v, t: (v > 0 ? '+' : '') + v + ' pp' })),
    xLabel: 'days before the election', yLabel: 'Flávio − Lula, valid votes',
    pts: leadPts,
    hlines: [{ y: leadRes[1], token: CH.CAT[1], t: 'result, round 1: Flávio ' + (leadRes[1] >= 0 ? '+' : '') + leadRes[1].toFixed(2) },
      { y: leadRes[2], token: CH.CAT[0], t: 'result, round 2: Flávio ' + leadRes[2].toFixed(2) }],
    keys: [{ token: CH.CAT[1], t: 'round-1 polls (diamond)' }, { token: CH.CAT[0], t: 'round-2 polls (dot)' }] });
  const fig = (rnd, cand, nome, lo, hi) => {
    const rows = P.filter((p) => p.round === rnd).map((p) => ({ p, c: p.cells.find((x) => x.candidate === cand) })).filter((x) => x.c)
      .sort((a, b) => (a.p.published + a.p.pollster < b.p.published + b.p.pollster ? -1 : 1));
    const ticks = []; for (let v = lo; v <= hi; v += 2) ticks.push({ v, t: v + '%' });
    return CH.intervals({ w: 900, rowH: 22, padL: 250, alt: nome + ' in the final polls of round ' + rnd + ', with the declared margin, against the result',
      x0: lo, x1: hi, xTicks: ticks, xLabel: nome + ', % of valid votes · last row: the result',
      rows: rows.map(({ p, c }) => ({ k: (c.inside_margin ? '✓ ' : '') + p.pollster + ' · ' + dayMon(p.published),
        lo: Number(c.published) - Number(p.margin), hi: Number(c.published) + Number(p.margin), point: Number(c.published), v: c.published + '% ± ' + p.margin,
        token: c.inside_margin ? (cand === '13' ? 'var(--el-lula)' : 'var(--el-flavio)') : CH.CTX }))
        .concat([{ k: 'THE RESULT', point: res[rnd][cand], note: res[rnd][cand].toFixed(2) + '%', token: 'var(--ink)' }]) });
  };
  B.push(C.section({
    lab: '§8 · the polls', title: 'The polls missed in both rounds, in opposite directions', wide: true,
    bodyRaw: C.pRaw('We read ' + BR['1'].polls + ' national polls published in the last week before round 1 and ' + BR['2'].polls + ' in the week before round 2, each with its source and, where it exists, its registration with the TSE '
        + '(' + m('corpus/eleicoes2026/polls.json') + '). We compared with the result those that published valid votes and a margin of error: ' + BR['1'].compared + ' in round 1 and ' + BR['2'].compared + ' in round 2.')
      + C.pRaw('<b>Round 1.</b> On average, the polls gave Flávio Bolsonaro ' + dp(BR['1'].mean_error_pp_22) + ' points less than he got: all ' + BR['1'].polls_below_result_22
        + ' underestimated him, and ' + lulaAhead1 + ' of them put him behind Lula, who came second. <b>Round 2.</b> The error switched sides: on average they gave Lula ' + dp(BR['2'].mean_error_pp_13)
        + ' points less, and all ' + BR['2'].polls_below_result_13 + ' underestimated him. Over both rounds, ' + (BR['1'].inside_margin + BR['2'].inside_margin) + ' of '
        + (BR['1'].lula_flavio_cells + BR['2'].lula_flavio_cells) + ' numbers (Lula or Flávio, in one poll) contain the result within the declared margin.')
      + C.figure({ svgRaw: leadSvg, caption: 'Each point is a poll: Flávio’s lead over Lula in valid votes as the poll published it, by the number of days before the election. The lines are the result of each round. In round 1, ' + below1 + ' of ' + n1 + ' polls lie below their round’s line; in round 2, ' + above2 + ' of ' + n2 + ' lie above it.' })
      + C.figure({ svgRaw: fig(1, '22', 'Flávio Bolsonaro', 36, 52), caption: 'Round 1: Flávio Bolsonaro in each poll (dot) with the declared margin (bar), against the result (last row). Marked ✓: those that contain the result.' })
      + C.figure({ svgRaw: fig(2, '13', 'Lula', 44, 56), caption: 'Round 2: Lula in each poll, with the declared margin, against the result (last row). Marked ✓: those that contain the result.' })
      + C.pRaw('<b>What a polling error proves.</b> A poll estimates the opinion of a sample days before the election. The margin of error covers only the chance of sampling, not a late change of mind, '
        + 'a turnout different from the one expected or voters who do not answer; and the printed margin is usually the one for total votes, narrower than the one for valid votes. '
        + 'A large error against one candidate in one round and against the other in the next round is the picture of polls struggling to measure the electorate, not of a count skewed to one side. '
        + 'The count is the sum of the reports, checked in §3 to §5.')
  }));
}

/* §9 the claims */
const cw = { C1: EXT.verdict === 'CERTIFIED' ? 'REFUTED' : EXT.verdict, C2: 'REFUSED', C3: 'REFUSED', C4: EXT.verdict === 'NEEDS DATA' ? 'NEEDS DATA' : 'CERTIFIED', C5: 'CERTIFIED', C6: D.C6.verdict, C7: 'MEASURED' };
const why = {
  C1: 'The part that is a calculation: reversing the result would take ' + n(W2.margin) + ' late votes from one side only. Nationally pending the complete logs; where we have read everything, the late votes are in the hundreds, not the millions. The legal part (annulment) is not a calculation.',
  C2: 'Votes that were not cast do not exist in any file. No calculation decides a "what if".',
  C3: 'It is a fact about what happened in a room of the TSE, not a published number. What the inspectors would have come to check (the totals) is in §3 to §5.',
  C4: 'It will be checked against the voting-machine logs when the TSE publishes them all. Where we have read everything, the number by state is in §6.',
  C5: 'The signature checks out and the file’s accounts balance. The section-by-section sum of round 2 waits for the reports in bulk.',
  C6: dp(D.C6.said) + '% is not Lula’s fraction of the valid votes in the signed result (' + dp(D.C6.signed_2dp) + '%). Probably a misreading; it changes nothing.',
  C7: 'Measured in §8. A polling error is not evidence about the count.'
};
B.push(C.section({
  lab: '§9 · the claims', title: 'Each public statement, with the verdict the data allow', wide: true,
  bodyRaw: C.table({ cols: [{ h: 'who' }, { h: 'what was said' }, { h: 'verdict' }, { h: 'why' }],
    rows: CL.map((c) => [c.who, saidEn(c), { raw: stamp(cw[c.id]) }, why[c.id]]) })
    + C.pRaw('Sources for each statement in ' + m('corpus/eleicoes2026/claims.json') + '. Quotation marks only where the source was read in full; the quotations are our translation from the Portuguese, and the originals are in the same file.')
}));

/* §10 limits */
B.push(C.section({
  lab: '§10 · what was not decided', title: 'The limits of this dossier',
  bodyRaw: C.plainList([
    { b: '"The election was fair".', text: 'It is not a calculation. This dossier decides the parts that are: whether the official total is the sum of the reports, whether the results are authentic, whether the extension could have changed the winner.' },
    { b: 'The voting machine’s software.', text: 'We did not audit the voting machine’s code, the public security tests or the election-day integrity test. The reports and the logs agree with one another and with the total, which is a proof about the published numbers, not about the code that produced them.' },
    { b: 'Legal questions.', text: 'The jurisdiction and the legality of the STF’s decision, and any request for annulment, are for the courts.' },
    { b: 'Round 2 section by section.', text: 'Pending the TSE’s bulk reports and logs; the verdict will be published here, with the date, whatever it is.' },
    { b: 'Independence.', text: 'Written with AI assistance (Claude, by Anthropic). No independent check by a third party yet; the commands to redo everything are in the repository.' }
  ])
}));

const foot = '<p>' + C.esc('Generated by apps/eleicoes2026/build.js from corpus/eleicoes2026/ledger.json (sha256 ' + sha('corpus/eleicoes2026/ledger.json').slice(0, 16)
  + '…), re-derived at build time by tools/eleicoes2026/ledger.py --check.') + '</p>';  // no commit hash on a public page (2026-10-30)
/* NO PARTY HUE (the operator, 2026-10-28: "colors: use between the ones the grammar have"; design/WARRANT.md v2.2). The two
   finalists are the grammar's categorical greys (--c-1 Lula, --c-3 Flávio), always beside their names; the maps are ONE
   ordered scale of Lula's share between the two finalists, eight steps mixed between two of the grammar's tokens
   (--rule-strong to --ink): lighter is more Lula, darker more Flávio, the 50% boundary between the fourth and fifth steps.
   The party reds and blues it replaced are retired. */
let html = TPL.render({ title: 'Brazil’s 2026 election: what the numbers can decide · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot, lang: 'en',
  cssRaw: ':root{--el-lula:var(--c-1);--el-flavio:var(--c-3);--el-f4:var(--rule-strong);--el-f3:color-mix(in oklab,var(--ink) 14%,var(--rule-strong));--el-f2:color-mix(in oklab,var(--ink) 29%,var(--rule-strong));--el-f1:color-mix(in oklab,var(--ink) 43%,var(--rule-strong));--el-l1:color-mix(in oklab,var(--ink) 57%,var(--rule-strong));--el-l2:color-mix(in oklab,var(--ink) 71%,var(--rule-strong));--el-l3:color-mix(in oklab,var(--ink) 86%,var(--rule-strong));--el-l4:var(--ink)}'
    + '.t-big{font-size:var(--text-2);font-weight:var(--weight-strong);fill:var(--ink)}.t-score{font-size:var(--text-1);font-weight:var(--weight-strong);fill:var(--ink)}'
    + '.t-kick{font-size:var(--text-eyebrow);letter-spacing:var(--track-eyebrow);fill:var(--ink-3)}.el-pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:var(--s-4)}', scriptRaw: CH.script(),
  desc: 'Brazil’s 2026 presidential election in both rounds, decided in exact arithmetic from the TSE’s files: polling-station reports, signed results, voting-machine logs and the losing side’s claims.',
  path: '/eleicoes2026/' });
html = html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, nofollow">');
if (!/name="robots" content="noindex/.test(html)) html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>');
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log('site/eleicoes2026/index.html written (unlisted): ' + Object.entries(D).map(([k, v]) => k + ' ' + v.verdict).join(', ') + ' @ git ' + git);
