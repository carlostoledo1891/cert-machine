/* radar-submit.js — fills the Petrobras Radar de Soluções (Ciclo 3) form
   (forms.office.com/r/K40NMxWTrN) from a JSON of answers, page by page, the way
   a person would (tick, type, choose), screenshots every page, and stops BEFORE
   "Submit" unless --submit is given. Dry-run on 2026-09-30 for both solutions:
   every field filled, every page accepted, stopped before Submit.

   A SUBMISSION IS A SEND: --submit only on the operator's word, per form.
   The answers-*.json here carry PREENCHER placeholders for the operator's data
   (startup name, CNPJ, CNPJ year, phone, state, city). Fill a COPY named
   *.filled.json (git-ignored) — the repository is public; never commit it.

   usage: node outreach/petrobras-radar/radar-submit.js <answers.json> <outdir> [--submit]
   outreach/petrobras-radar · cert-machine */
'use strict';
const fs = require('fs');
const path = require('path');
const { withChrome, settle } = require(path.join(__dirname, '..', '..', 'design', 'cdp.js'));
const [answersFile, outDir] = process.argv.slice(2);
const SUBMIT = process.argv.includes('--submit');
const A = JSON.parse(fs.readFileSync(answersFile, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });

(async () => { await withChrome(async (send) => {
  await send('Page.enable'); await send('Runtime.enable'); await send('Input.setIgnoreInputEvents', { ignore: false }).catch(() => {});
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1800, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'https://forms.office.com/r/K40NMxWTrN' }); await settle(9000);
  const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value;
  const clickBtn = (txt) => ev(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.innerText.trim()===${JSON.stringify(txt)}); if(b){b.click(); return true} return false})()`);
  const shot = async (name) => { const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); fs.writeFileSync(path.join(outDir, name), Buffer.from(s.data, 'base64')); };
  const log = [];
  await clickBtn('Next'); await settle(2500);                       /* the cover page */
  for (let page = 1; page <= 6; page++) {
    const titles = JSON.parse(await ev(`JSON.stringify([...document.querySelectorAll('[data-automation-id="questionItem"]')].map(q=>(q.querySelector('[data-automation-id="questionTitle"]')||{innerText:''}).innerText.replace(/\\s+/g,' ')))`));
    for (let qi = 0; qi < titles.length; qi++) {
      const title = titles[qi];
      const key = Object.keys(A).find((k) => title.includes(k));
      if (!key) { log.push('page ' + page + ' · no answer for: ' + title.slice(0, 70)); continue; }
      const v = A[key];
      if (v === null || v === '') { log.push('page ' + page + ' · left blank: ' + key); continue; }
      const q = `document.querySelectorAll('[data-automation-id="questionItem"]')[${qi}]`;
      const kind = await ev(`(()=>{const q=${q}; if(q.querySelector('input[type=checkbox]')) return 'check'; if(q.querySelector('input[type=radio]')) return 'radio'; if(q.querySelector('[aria-haspopup],[role=combobox]')) return 'combo'; if(q.querySelector('textarea,input[type=text],input:not([type])')) return 'text'; return 'unknown'})()`);
      if (kind === 'check' || kind === 'radio') {
        for (const want of [].concat(v)) {
          const ok = await ev(`(()=>{const q=${q}; const i=[...q.querySelectorAll('input[type=checkbox],input[type=radio]')].find(i=>(i.value||'').replace(/\\s+/g,' ').trim().startsWith(${JSON.stringify(want)})); if(!i) return false; if(!i.checked) i.click(); return i.checked})()`);
          log.push('page ' + page + ' · ' + key + ' ← ' + want + (ok ? '' : '  [NOT FOUND]'));
        }
      } else if (kind === 'text') {
        const ok = await ev(`(()=>{const q=${q}; const el=q.querySelector('textarea,input[type=text],input:not([type])'); el.focus(); const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto,'value').set.call(el, ${JSON.stringify(String(v))}); el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); el.blur(); return el.value===${JSON.stringify(String(v))}})()`);
        log.push('page ' + page + ' · ' + key + ' ← ' + String(v).slice(0, 50).replace(/\n/g, ' ') + (String(v).length > 50 ? '…' : '') + ' (' + String(v).length + ' chars)' + (ok ? '' : '  [NOT SET]'));
      } else if (kind === 'combo') {
        await ev(`(()=>{const q=${q}; const c=q.querySelector('[aria-haspopup],[role=combobox]'); c.click(); return true})()`); await settle(700);
        const ok = await ev(`(()=>{const o=[...document.querySelectorAll('[role=option]')].find(o=>o.innerText.replace(/\\s+/g,' ').trim().startsWith(${JSON.stringify(v)})); if(!o) return false; o.click(); return true})()`); await settle(500);
        log.push('page ' + page + ' · ' + key + ' ← ' + v + (ok ? '' : '  [OPTION NOT FOUND]'));
      } else log.push('page ' + page + ' · UNKNOWN INPUT: ' + key);
    }
    await settle(800);
    await shot('page-' + page + '.png');
    const hasNext = await ev(`!![...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='Next')`);
    const hasSubmit = await ev(`!![...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='Submit')`);
    const errors = await ev(`JSON.stringify([...document.querySelectorAll('[role=alert],[data-automation-id="validationError"]')].map(e=>e.innerText).filter(Boolean))`);
    if (errors !== '[]') log.push('page ' + page + ' · validation: ' + errors);
    if (hasNext) { await clickBtn('Next'); await settle(2500); const errs = await ev(`JSON.stringify([...document.querySelectorAll('[role=alert]')].map(e=>e.innerText).filter(Boolean))`); if (errs !== '[]') { log.push('page ' + page + ' · Next refused: ' + errs); break; } continue; }
    if (hasSubmit) {
      if (!SUBMIT) { log.push('READY: every page filled; stopped before Submit (dry run)'); break; }
      await clickBtn('Submit'); await settle(6000); await shot('after-submit.png');
      const t = await ev(`document.body.innerText.slice(0,400)`);
      log.push('SUBMITTED. Page says: ' + t.replace(/\s+/g, ' ').slice(0, 300));
      break;
    }
    log.push('page ' + page + ' · neither Next nor Submit'); break;
  }
  console.log(log.join('\n'));
}, { port: 9262 }); })().catch((e) => { console.error(e); process.exit(1); });
