// d12 (rewritten 2026-11-03): the Weight-Space Programming baseline card, 1600x900 CSS px at 1.5x -> 2400x1350;
// every number from certs/wsp-baseline.json (C1, C3) and certs/wsp-regrade.json (the post's printed 48.1 / 7.9)
const fs=require('fs'),path=require('path');
const ROOT='/Users/carlostoledo/Projects/cert-machine', HERE=__dirname;
const { withChrome, settle } = require(ROOT+'/design/cdp.js');
const B=JSON.parse(fs.readFileSync(ROOT+'/certs/wsp-baseline.json','utf8'));
const G=JSON.parse(fs.readFileSync(ROOT+'/certs/wsp-regrade.json','utf8'));
const C1=B.conditions.C1, C3=B.conditions.C3;
if(!C1||!C3) throw new Error('C1 and C3 must be in the record');
if(!/^mostly a settings effect/.test(B.reading.verdict)) throw new Error('the reading changed: redraw the card');
const pct=(x)=>(100*x).toFixed(1)+'%';
const FONT='<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">';
const css=`*{box-sizing:border-box;margin:0}html,body{width:1600px;height:900px;overflow:hidden}
body{background:#fff;color:#000;font-family:Inter,sans-serif;padding:64px 72px;position:relative}
.k{font:500 15px 'JetBrains Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:#4d4d4d}
h1{font-weight:600;letter-spacing:-.025em;line-height:1.04}
.sub{font-size:24px;line-height:1.35;color:#262626}
.foot{position:absolute;left:72px;bottom:52px;font:500 16px 'JetBrains Mono',monospace;letter-spacing:.14em;color:#4d4d4d}`;
function svg(){
  const W=1456,H=400,ml=440,mt=10,rowH=92,barH=48,pw=W-ml-420;
  const X=(v)=>ml+v/60*pw;   // axis 0–60 %
  const unFloor=100*C1.all_samples.acc_floor, edPrinted=100*G.post_runs.post_edited_50_passes.merged_printed.acc;
  const c3Floor=100*C3.all_samples.acc_floor, c3Dec=100*C3.all_samples.acc_decided;
  const rows=[
    ['the post’s settings · no edit',unFloor,null,'#9a9aa6',pct(C1.all_samples.acc_floor)+' here (the post prints '+pct(G.post_runs.post_unedited.merged_printed.acc)+') · 93% hit the limit'],
    ['the post’s settings · the edit',edPrinted,null,'#000',pct(G.post_runs.post_edited_50_passes.merged_printed.acc)+' as the post prints it · 33% hit the limit'],
    ['Qwen’s own settings · no edit',c3Floor,c3Dec,'#000',pct(C3.all_samples.acc_floor)+' with refusals counted wrong, '+pct(C3.all_samples.acc_decided)+' on the decided · 98.5% answered'],
  ];
  let s=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="JetBrains Mono, monospace">`;
  for(const v of [0,10,20,30,40,50,60]){const x=X(v);s+=`<line x1="${x}" x2="${x}" y1="${mt}" y2="${mt+rows.length*rowH}" stroke="#e4e4e4"/><text x="${x}" y="${mt+rows.length*rowH+28}" text-anchor="middle" font-size="16" fill="#4d4d4d">${v}%</text>`;}
  rows.forEach((r,i)=>{const y=mt+i*rowH+(rowH-barH)/2;const w=Math.max(2,X(r[1])-ml);
    s+=`<rect x="${ml}" y="${y}" width="${w}" height="${barH}" fill="${r[3]}"/>`;
    if(r[2]!=null){const w2=X(r[2])-X(r[1]);s+=`<rect x="${ml+w}" y="${y}" width="${w2}" height="${barH}" fill="none" stroke="#000" stroke-width="2" stroke-dasharray="6 5"/>`;}
    const end=r[2]!=null?X(r[2]):ml+w;
    s+=`<text x="${ml-16}" y="${y+barH/2+7}" text-anchor="end" font-size="20" font-weight="500" fill="#000">${r[0]}</text>
    <text x="${end+14}" y="${y+barH/2+7}" font-size="17" fill="#262626">${r[2]!=null?'':r[4]}</text>`;
    if(r[2]!=null) s+=`<text x="${ml}" y="${y+barH+24}" font-size="17" fill="#262626">${r[4]}</text>`;
  });
  s+=`<text x="0" y="${H-30}" font-size="17" fill="#262626">MATH-500 · 500 problems × 4 samples · same prompt and template · one exact grader · pre-registered.</text>
  <text x="0" y="${H-6}" font-size="17" fill="#262626">Qwen’s own settings: its model card’s non-thinking text settings (temperature 1.0, top_p 1.0, presence 2.0).</text>`;
  return s+'</svg>';
}
const html=`<!doctype html><meta charset=utf-8>${FONT}<style>${css}</style><body>
  <div class=k>MIT CSAIL’s weight-space programming · Qwen3.5-0.8B edited by GPT-6 Astra, no training · decided from the bytes, then re-run</div>
  <h1 style="font-size:56px;margin-top:18px">The edit is real. The baseline was the problem.</h1>
  <div class=sub style="margin-top:14px">Under the post’s settings the base model loops and scores 7%. Under its maker’s own settings, with no edit, it scores what the edited model scores.</div>
  <div style="margin-top:30px">${svg()}</div>
  <div class=foot>2 OF 488 TENSORS DIFFER · THE DOSE IS 6, NOT 1 · EVERY INPUT PINNED · CARLOSTOLEDO.CO/REPORTS</div>
</body>`;
fs.writeFileSync(path.join(HERE,'x-wsp-baseline.html'),html);
withChrome(async (send)=>{
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1600,height:900,deviceScaleFactor:1.5,mobile:false});
  await send('Page.navigate',{url:'file://'+path.join(HERE,'x-wsp-baseline.html')});await settle(3000);
  const s=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(HERE,'..','d12-wsp.png'),Buffer.from(s.data,'base64'));console.log('d12-wsp.png');
},{port:9236}).catch(e=>{console.error(e);process.exit(1)});
