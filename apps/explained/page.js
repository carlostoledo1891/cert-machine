/* apps/explained/page.js — the five instruments of the easy read; runs after common.js inside the builder's IIFE */
/* ---------------- Instrument 1: decide a bound ---------------- */
{const v=qdec('{{C31_BOUND}}');const lo=qdec('0.8240'),hi=qdec('0.8260');let corrupt=false;
 const render=()=>{const t=Number($('w1s').value)/400;const B=lo.add(hi.sub(lo).mul(new Q(Math.round(t*100000),100000)));$('w1b').textContent=B.dec(6);let out;
  if(corrupt)out=W('f','refused')+' the data file does not match its pin\n'+K('sha256 expected  ')+'{{C31_TABLE_SHA}}…\n'+K('sha256 read      ')+V('{{C31_TABLE_SHA_BAD}}…')+K('  (simulated here; the pin is the record\'s)')+'\n'+K('nothing is decided from bytes that are not the claimant\'s; the word returns the moment the file matches');
  else if(v.cmp(B)<=0)out=W('c','certified')+' γ₂ ≤ '+B.dec(6)+'\n'+K('certificate  ')+'λ(z) ≤ {{C31_LAMBDA}} at h = 10, every state, rounding mode up\n'+K('value        ')+V(v.dec(10))+' ≤ '+B.dec(6)+'\n'+K('margin       ')+B.sub(v).sci(2)+'\n'+K('falsifier    ')+'a state whose ratio exceeds λ — there is none';
  else out=W('r','refuted')+' the printed bound '+B.dec(6)+' is below what the method certifies\n'+K('witness      ')+'the certified value is '+V(v.dec(10))+', above B by '+v.sub(B).sci(2)+'\n'+K('threshold    ')+'at B = '+v.dec(10)+' the word turns to certified';
  $('w1out').innerHTML=out;};
 $('w1s').addEventListener('input',render);$('w1corrupt').addEventListener('click',e=>{corrupt=!corrupt;e.currentTarget.setAttribute('aria-pressed',String(corrupt));e.currentTarget.textContent=corrupt?'restore the data file':'corrupt one byte of the data file';render();});render();}
/* ---------------- Instrument 2: print √3/2 to k digits ---------------- */
{const S32='0.86602540378443864676372317075294';const three4=new Q(3n,4n);const dbl=qdouble(Math.sqrt(3)/2);
 const roundTo=k=>{const digits=S32.slice(2,2+k+1);let q=BigInt(digits.slice(0,k));if(Number(digits[k])>=5)q+=1n;return new Q(q,10n**BigInt(k))};
 const judge=y=>{const g=three4.sub(y.mul(y));const s=g.sign();return {g,word:s>0?W('r','too close')+K(' angle below sixty'):s<0?W('f','apart')+K(' angle above sixty'):W('c','touching')+K(' exactly sixty')}};
 const render=()=>{const k=Number($('w2s').value);$('w2k').textContent=String(k);const y=roundTo(k);const a=judge(y),b=judge(dbl);
  $('w2out').innerHTML=K('the printed string, k = '+k)+'\n  y = '+V(y.dec(k))+'\n  read as the decimal it is   '+a.word+'\n  3/4 − y² = '+a.g.sci(3)+'\n\n'+K('the double nearest to √3/2')+'\n  y = '+V('0.86602540378443859659…')+'\n  read as the number it denotes   '+b.word+'\n  3/4 − y² = '+b.g.sci(3)+'\n\n'+K('the point as it was meant')+'\n  y = '+V('√3/2')+'\n  read as an algebraic number   '+W('c','touching')+K(' 3/4 − y² = 0, exactly');};
 /* the microscope: each reading placed by its distance from √3/2 on a log scale, the verdict as the shape of the mark; the
    placement is a float of an exact quantity, the sign and the word are the exact judge's */
 const sup=e=>String(e).replace(/-/g,'⁻').replace(/\d/g,d=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
 const off=d=>{const t=Math.min(18,Math.max(1,-Math.log10(Math.abs(d))));return 10+(18-t)*7.2};
 const svg=$('w2svg');let base='<text x="14" y="12" font-size="7.5" fill="var(--ink-4)" letter-spacing=".1em">← APART</text><text x="306" y="12" text-anchor="end" font-size="7.5" fill="var(--ink-4)" letter-spacing=".1em">TOO CLOSE →</text>';
 base+='<line x1="14" y1="50" x2="306" y2="50" stroke="var(--rule-strong)"/>';
 for(const e of [15,10,5])for(const sg of [-1,1]){const x=160+sg*off(Math.pow(10,-e));base+='<line x1="'+x+'" y1="47" x2="'+x+'" y2="53" stroke="var(--rule-strong)"/><text x="'+x+'" y="93" text-anchor="middle" font-size="7" fill="var(--ink-4)">10'+sup(-e)+'</text>';}
 base+='<line x1="160" y1="45" x2="160" y2="55" stroke="var(--ink)" stroke-width="1"/><circle cx="160" cy="50" r="3.5" fill="var(--ink)"/><text x="160" y="93" text-anchor="middle" font-size="7" fill="var(--ink)">√3/2</text>';
 base+='<g class="mk" id="w2mp"></g><g class="mk" id="w2md"></g>';svg.innerHTML=base;
 const mark=(g,word,lab,dy,x)=>{const shape=word>0?'<rect x="-4" y="-4" width="8" height="8" transform="rotate(45)" fill="var(--sunk)" stroke="var(--ink)" stroke-width="1.2"/>':word<0?'<path d="M0 -5 L5 4 L-5 4 Z" fill="none" stroke="var(--ink-3)" stroke-width="1" stroke-dasharray="1.5 2"/>':'<circle r="4" fill="var(--ink)"/>';
  const anc=x>250?'end':x<70?'start':'middle';g.innerHTML=shape+'<text y="'+dy+'" text-anchor="'+anc+'" font-size="7" fill="var(--ink-3)">'+lab+'</text>';};
 const place=(g,s,cy)=>{const d=Number(s.g.n)/Number(s.g.d)/1.7320508;const x=s.g.sign()===0?160:160+(s.g.sign()>0?1:-1)*off(d);g.style.transform='translate('+x+'px,'+cy+'px)';return x;};
 const render2=()=>{const k=Number($('w2s').value);const y=roundTo(k);const a=judge(y),b=judge(dbl);
  const xp=place($('w2mp'),a,30);mark($('w2mp'),a.g.sign(),'printed, k = '+k,14,xp);
  const xd=place($('w2md'),b,66);mark($('w2md'),b.g.sign(),'the double',15,xd);};
 $('w2s').addEventListener('input',render);$('w2s').addEventListener('input',render2);render();render2();}
/* ---------------- Instrument 3: plant an error ---------------- */
{const base=[];for(const [i,j] of [[0,1],[0,2],[1,2]])for(const a of [1n,-1n])for(const b of [1n,-1n]){const p=[new Q(0n),new Q(0n),new Q(0n)];p[i]=new Q(a);p[j]=new Q(b);base.push(p);}
 let pts=base.map(p=>p.slice());let last='the twelve points as published';
 const dot=(x,y)=>x[0].mul(y[0]).add(x[1].mul(y[1])).add(x[2].mul(y[2]));
 const decide=()=>{const n=pts.length;let viol=null,contacts=0,pairs=0;const lines=[];for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){pairs++;const p=dot(pts[i],pts[j]),A=dot(pts[i],pts[i]),B=dot(pts[j],pts[j]);const t=new Q(4n).mul(p).mul(p).sub(A.mul(B));if(p.sign()>0&&t.sign()>0){if(!viol)viol={i,j,p,A,B,t};}else if(p.sign()>0&&t.sign()===0){contacts++;lines.push([i,j]);}}return {n,pairs,contacts,viol,lines};};
 const draw=d=>{const svg=$('w3svg');const cx=160,cy=118,R=84;const pos=pts.map((p,i)=>{const a=-Math.PI/2+2*Math.PI*i/pts.length;return [cx+R*Math.cos(a),cy+R*Math.sin(a)]});let s='';
  for(const [i,j] of d.lines)s+='<line x1="'+pos[i][0]+'" y1="'+pos[i][1]+'" x2="'+pos[j][0]+'" y2="'+pos[j][1]+'" stroke="var(--c-s3)" stroke-width="1"/>';
  if(d.viol){const [i,j]=[d.viol.i,d.viol.j];s+='<line x1="'+pos[i][0]+'" y1="'+pos[i][1]+'" x2="'+pos[j][0]+'" y2="'+pos[j][1]+'" stroke="var(--ink)" stroke-width="3"/>';}
  pos.forEach((q,i)=>{const bad=d.viol&&(i===d.viol.i||i===d.viol.j);s+=bad?'<rect x="'+(q[0]-6)+'" y="'+(q[1]-6)+'" width="12" height="12" transform="rotate(45 '+q[0]+' '+q[1]+')" fill="var(--ink)"/>':'<circle cx="'+q[0]+'" cy="'+q[1]+'" r="4.5" fill="var(--c-s4)"/>';});
  s+='<text x="160" y="232" text-anchor="middle" fill="var(--ink-4)" font-size="10">'+d.n+' points · '+d.pairs+' pairs · '+d.contacts+' contacts</text>';svg.innerHTML=s;};
 const render=()=>{const d=decide();draw(d);const fmt=p=>'('+p.map(x=>x.toString()).join(', ')+')';let out=K('change  ')+esc(last)+'\n';
  if(pts.length!==12)out+=W('f','refused')+' the claim says twelve points; the file holds '+pts.length+'\n'+K('count mismatch: nothing is decided until the object is the one claimed');
  else if(d.viol){const v=d.viol;out+=W('r','refuted')+' a pair closer than sixty degrees\n'+K('witness ')+'points '+v.i+' and '+v.j+': '+V(fmt(pts[v.i]))+' · '+V(fmt(pts[v.j]))+'\n'+K('        ')+'p = '+v.p+', A = '+v.A+', B = '+v.B+', 4p² − AB = '+v.t+' > 0';}
  else out+=W('c','certified')+' every pair at least sixty degrees apart\n'+K(d.pairs+' pairs decided, '+d.contacts+' at exactly sixty degrees, none closer');
  $('w3out').innerHTML=out;};
 document.querySelectorAll('#act3 button[data-m]').forEach(b=>b.addEventListener('click',()=>{const m=b.dataset.m;
  if(m==='reset'){pts=base.map(p=>p.slice());last='reset: the twelve points as published';}
  else if(m==='nudge'){const i=3,c=0;pts[i]=pts[i].slice();pts[i][c]=pts[i][c].add(new Q(1n,1000000000n));last='point 3, first coordinate: '+pts[i][c]+' (was '+pts[i][c].sub(new Q(1n,1000000000n))+')';}
  else if(m==='dup'){pts.push(pts[5].slice());last='point 5 appended again';}
  else if(m==='perm'){const i=1;pts[i]=[pts[i][2],pts[i][1],pts[i][0]];last='point 1: first and third coordinates swapped → ('+pts[i].map(x=>x.toString()).join(', ')+')';}
  else if(m==='drop'){if(pts.length>1){pts.pop();last='the last point removed';}}
  else if(m==='scale'){pts=pts.map(p=>p.map(x=>x.mul(new Q(3n))));last='every coordinate multiplied by 3';}
  render();}));render();}
/* ---------------- Instrument 4: which arithmetic is exact ---------------- */
{const marks=[{n:192n,t:'the GPU rows, dimensions 49–55'},{n:BigInt('{{KW_DESK_MAXNORM_PLAIN}}'),t:'the laptop rows'},{n:395n*10n**33n,t:'dimension 38, the axis rows'}];
 const paths=[{t:'half precision on tensor cores',lim:2048n,x:3.31},{t:'single precision BLAS',lim:16777216n,x:7.22},{t:'exact integers (BigInt)',lim:null}];
 const svg=$('w4svg');let N=192n;const X=l=>12+l/40*296;
 const render=()=>{const t=Number($('w4s').value)/10;N=BigInt(Math.round(Math.pow(10,t)));$('w4n').textContent=group(N.toString());const first=paths.find(p=>p.lim===null||N<p.lim);
  let s='<line x1="12" y1="70" x2="308" y2="70" stroke="var(--c-axis)"/>';for(let e=0;e<=40;e+=5)s+='<line x1="'+X(e)+'" y1="66" x2="'+X(e)+'" y2="74" stroke="var(--c-axis)"/><text x="'+X(e)+'" y="90" text-anchor="middle" fill="var(--ink-4)" font-size="8">10'+String(e).replace(/\d/g,d=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[d])+'</text>';
  s+='<rect x="12" y="34" width="'+(X(3.31)-12)+'" height="8" fill="var(--c-s4)"/><rect x="'+X(3.31)+'" y="34" width="'+(X(7.22)-X(3.31))+'" height="8" fill="var(--c-s3)"/><rect x="'+X(7.22)+'" y="34" width="'+(308-X(7.22))+'" height="8" fill="var(--c-s1)"/>';
  s+='<text x="12" y="28" fill="var(--ink-3)" font-size="8">half</text><text x="'+X(3.31)+'" y="28" fill="var(--ink-3)" font-size="8">single</text><text x="'+X(7.22)+'" y="28" fill="var(--ink-3)" font-size="8">exact integers only</text>';
  for(const m of marks){const l=m.n.toString().length-1+Math.log10(Number(m.n.toString().slice(0,3))/100);s+='<line x1="'+X(l)+'" y1="48" x2="'+X(l)+'" y2="62" stroke="var(--c-s4)"/>';}
  s+='<path d="M'+X(t)+' 52 l-5 -9 h10 z" fill="var(--ink)"/><text x="'+X(t)+'" y="110" text-anchor="middle" fill="var(--ink)" font-size="9">'+group(N.toString())+'</text>';svg.innerHTML=s;
  const near=marks.map((m,i)=>({i,d:Math.abs(m.n.toString().length-1-t)})).sort((a,b)=>a.d-b.d)[0];
  $('w4out').innerHTML=V(first.t)+' is the cheapest exact path for squared norms up to '+group(N.toString())+'\n'+K('every partial sum of an inner product is at most the largest squared norm (Cauchy–Schwarz); half precision holds integers below 2¹¹ = 2,048, single below 2²⁴ = 16,777,216')+'\n'+K('nearest real configuration  ')+marks[near.i].t+', squared norm '+group(marks[near.i].n.toString());};
 $('w4s').addEventListener('input',render);render();
 const canvas=$('w4c'),ctx=canvas.getContext('2d');let frame=0,pairs=0n;const per={{KW_PAIRS_PER_FRAME}}n,total={{KW_PAIRS_BIG}}n;let vis=false;const ioc=new IntersectionObserver(es=>{vis=es[0].isIntersecting},{threshold:.2});ioc.observe(canvas);
 const ramp=['#4a4a55','#6e6e7a','#8b8b97','#a9a9b4','#f6f6f8'];
 const tick=()=>{if(vis&&!reduced){frame++;const w=canvas.width,h=canvas.height;ctx.fillStyle='#101014';ctx.fillRect(0,0,w,h);const cols=40,rows=7,cw=w/cols,ch=(h-44)/rows;const n=(frame*9)%(cols*rows);
   for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const i=r*cols+c;const on=i<n;ctx.fillStyle=on?ramp[(i*7)%5]:'#1c1c22';ctx.fillRect(c*cw+1.5,r*ch+1.5,cw-3,ch-3);}
   pairs=(pairs+per)%total;ctx.fillStyle='#c9c9d2';ctx.font='500 15px "JetBrains Mono",monospace';ctx.fillText('pairs decided  '+group(pairs.toString()),12,h-14);ctx.fillStyle='#6e6e7a';ctx.font='12px "JetBrains Mono",monospace';ctx.fillText('each tile = one 128×128 block on the tensor cores',w-392,h-14);}
  requestAnimationFrame(tick);};tick();}
/* ---------------- the sorter ---------------- */
{const box=$('sorter');const bins=[{k:'read',n:{{RfShaped}},c:'var(--c-1)'},{k:'prose',n:{{RfRefProse}},c:'var(--c-s2)'},{k:'no number',n:{{RfRefNoQuantity}},c:'var(--c-s2)'},{k:'ambiguous',n:{{RfRefAmbiguous}},c:'var(--c-s2)'},{k:'asymptotic',n:{{RfRefAsymptotic}},c:'var(--c-s2)'},{k:'≈',n:{{RfRefApproximate}},c:'var(--c-s2)'}];
 const seq=[];bins.forEach((b,bi)=>{for(let i=0;i<b.n;i++)seq.push(bi)});for(let i=seq.length-1;i>0;i--){const j=(i*7919)%(i+1);[seq[i],seq[j]]=[seq[j],seq[i]];}
 bins.forEach((b,i)=>{const l=document.createElement('div');l.className='lab';l.style.left=(2+i*16.3)+'%';l.innerHTML='<b>'+b.n+'</b>'+b.k;box.appendChild(l);});
 const chips=seq.map((bi,i)=>{const s=document.createElement('span');s.className='s';s.style.transitionDelay=(i*0.02)+'s';box.appendChild(s);return {s,bi}});const place={};bins.forEach((b,i)=>place[i]=0);
 const go=()=>chips.forEach(({s,bi})=>{const k=place[bi]++;const bx=box.clientWidth*(0.1+bi*0.163);const col=k%4,row=Math.floor(k/4);s.style.transform='translate('+(bx-box.clientWidth/2+col*11-16)+'px,'+(box.clientHeight-44-row*11)+'px)';s.style.background=bins[bi].c;});
 const ios=new IntersectionObserver(es=>{if(es[0].isIntersecting){setTimeout(go,300);ios.disconnect();}},{threshold:.4});ios.observe(box);}
/* ---------------- Instrument 5: shape the window ---------------- */
{const Wn=JSON.parse('{{WIN}}');const M=Wn.M.map(r=>r.map(qdec)),b=Wn.b.map(qdec),eps=qdec(Wn.eps);
 const P=c=>{let num=new Q(0n),den=new Q(0n);for(let i=0;i<3;i++){den=den.add(b[i].mul(c[i]));for(let j=0;j<3;j++)num=num.add(c[i].mul(c[j]).mul(M[i][j]));}return new Q(2n).sub(num.div(den.mul(den))).sub(eps)};
 const svg=$('w5svg');const render=()=>{const c2=new Q(BigInt($('w5s2').value),1000n),c4=new Q(BigInt($('w5s4').value),1000n);$('w5c2').textContent=c2.dec(3);$('w5c4').textContent=c4.dec(3);const c=[new Q(1n),c2,c4];
  const vhalf=new Q(1n).add(c2.div(new Q(4n))).add(c4.div(new Q(16n)));const ok=vhalf.sign()>0;const X=t=>160+t*280,Y=v=>142-v*112;
  let s='<line x1="'+X(-.5)+'" y1="'+Y(0)+'" x2="'+X(.5)+'" y2="'+Y(0)+'" stroke="var(--c-axis)"/><line x1="'+X(-.5)+'" y1="'+Y(1)+'" x2="'+X(.5)+'" y2="'+Y(1)+'" stroke="var(--c-grid)" stroke-dasharray="2 3"/>';
  let d='';for(let i=0;i<=60;i++){const t=-.5+i/60;const v=1+Number(c2.n)/Number(c2.d)*t*t+Number(c4.n)/Number(c4.d)*t*t*t*t;d+=(i?'L':'M')+X(t).toFixed(1)+','+Y(v).toFixed(1);}
  s+='<path d="'+d+'" fill="none" stroke="'+(ok?'var(--c-1)':'var(--ink-4)')+'" stroke-width="2"'+(ok?'':' stroke-dasharray="5 4"')+'/><text x="'+(X(.5)+3)+'" y="'+(Y(1)+3)+'" fill="var(--ink-4)" font-size="9">1</text><text x="'+X(-.5)+'" y="160" fill="var(--ink-4)" font-size="9">−½</text><text x="'+(X(.5)-9)+'" y="160" fill="var(--ink-4)" font-size="9">½</text>';
  svg.innerHTML=s;const p=P(c);const pq=qdec(Wn.pquartic),ps=qdec(Wn.pstar);let out;
  if(!ok)out=W('f','refused')+' v(½) = '+vhalf.dec(4)+' ≤ 0: the window must be positive on the interval\n'+K('the paper\'s hypotheses: even, positive on [−½, ½], at most 1 — the last holds because c₂, c₄ ≤ 0');
  else{const cmp=p.cmp(pq);out='P = '+V(p.dec(10))+K('  simple and on the line')+'\n'+K('the paper\'s quartic   ')+pq.dec(10)+(cmp>0?'  '+W('c','beaten')+K(' by '+p.sub(pq).sci(2)):cmp<0?K('  ahead by '+pq.sub(p).sci(2)):K('  equal'))+'\n'+K('the best quartic      ')+ps.dec(10)+K('  gap '+ps.sub(p).sci(2))+'\n'+K('D = ')+V(new Q(1n).add(p).div(new Q(2n)).dec(10))+K('  distinct zeros, (1 + P)/2; ε₁₅ = '+eps.sci(2));}
  $('w5out').innerHTML=out;};
 $('w5s2').addEventListener('input',render);$('w5s4').addEventListener('input',render);
 $('w5paper').addEventListener('click',()=>{$('w5s2').value=-280;$('w5s4').value=-4080;render();});
 $('w5best').addEventListener('click',()=>{$('w5s2').value=Math.round(Number('{{WIN_CSTAR2}}')*1000);$('w5s4').value=Math.round(Number('{{WIN_CSTAR4}}')*1000);render();});
 render();}
