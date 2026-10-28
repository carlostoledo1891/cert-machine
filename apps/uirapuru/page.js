/* apps/uirapuru/page.js — the four instruments of the Uirapuru story; runs after common.js and forest.js inside the builder's IIFE.
   Every decision here is a loop over whole numbers; the forest is seeded (forest.js), the birds invented. */
const {forest}=window.FOREST;
const BLUE={{F7_BLUE}};
/* one square per tree, darker is bluer; a toy holds no number and is drawn as the void, hatched (WARRANT v2: it was a square
   in the guide pattern 2 3, which says nothing); a missing tree is not drawn; the ringed tree is the bird the word rests on */
const drawPatch=(svg,b,wit,slots)=>{const n=slots||b.length,cols=Math.ceil(Math.sqrt(n)),rows=Math.ceil(n/cols),cell=320/cols;svg.setAttribute('viewBox','0 0 320 '+(rows*cell).toFixed(1));const vid=svg.id+'-void';let s='<defs><pattern id="'+vid+'" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="var(--ink-5)" stroke-width="1"/></pattern></defs>';
 for(let i=0;i<b.length;i++){const x=(i%cols)*cell,y=Math.floor(i/cols)*cell,g=cell*.14,w=cell-2*g,r=(cell*.12).toFixed(2);
  if(typeof b[i]!=='number')s+='<rect x="'+(x+g).toFixed(2)+'" y="'+(y+g).toFixed(2)+'" width="'+w.toFixed(2)+'" height="'+w.toFixed(2)+'" rx="'+r+'" class="w-void" fill="url(#'+vid+')" stroke="var(--border-strong)" stroke-width="1"/>';
  else s+='<rect x="'+(x+g).toFixed(2)+'" y="'+(y+g).toFixed(2)+'" width="'+w.toFixed(2)+'" height="'+w.toFixed(2)+'" rx="'+r+'" fill="var(--ink)" fill-opacity="'+(0.06+0.9*b[i]/100).toFixed(3)+'"/>';}
 if(wit>=0&&wit<b.length){const cx=(wit%cols)*cell+cell/2,cy=Math.floor(wit/cols)*cell+cell/2,rr=cell*.58;s+='<circle cx="'+cx.toFixed(2)+'" cy="'+cy.toFixed(2)+'" r="'+rr.toFixed(2)+'" fill="none" stroke="var(--paper)" stroke-width="3.5"/><circle cx="'+cx.toFixed(2)+'" cy="'+cy.toFixed(2)+'" r="'+rr.toFixed(2)+'" fill="none" stroke="var(--ink)" stroke-width="1.5"/>';}
 svg.innerHTML=s;};
/* the call: every bird in the patch, in whole numbers; the word, the bird it rests on, the count */
const call=(b,shape,T)=>{const n=b.length;let least=0,most=0,cnt=0;for(let i=0;i<n;i++){if(b[i]<b[least])least=i;if(b[i]>b[most])most=i;if(b[i]>=T)cnt++;}
 const tree=i=>'tree '+(i+1);let w,html,wit;
 if(shape==='every'){if(b[least]>=T){w='c';wit=least;html=W('c','certified')+' every one of '+n+' birds is at least '+T+' blue\n'+K('certificate ')+n+' calls; the least blue is '+tree(least)+' at '+b[least]+', margin '+(b[least]-T)+'\n'+K('falsifier   ')+'a bird below '+T+' — there is none';}
  else{w='r';wit=least;html=W('r','refuted')+' the bird at '+tree(least)+' is '+b[least]+' blue, below '+T+'\n'+K('witness     ')+tree(least)+'; walk there and look';}}
 else if(shape==='some'){if(b[most]>=T){w='c';wit=most;html=W('c','certified')+' the bird at '+tree(most)+' is '+b[most]+' blue\n'+K('witness     ')+tree(most)+', the bird itself; walk there and look';}
  else{w='r';wit=most;html=W('r','refuted')+' no bird in the patch is '+T+' blue\n'+K('certificate ')+n+' calls; the bluest is '+tree(most)+' at '+b[most]+', below '+T;}}
 else{if(b[most]<T){w='c';wit=most;html=W('c','certified')+' no bird in the patch is '+T+' blue\n'+K('certificate ')+n+' calls; the bluest is '+tree(most)+' at '+b[most]+', margin '+(T-b[most])+'\n'+K('falsifier   ')+'a bird at '+T+' or more — there is none';}
  else{w='r';wit=most;html=W('r','refuted')+' the bird at '+tree(most)+' is '+b[most]+' blue\n'+K('witness     ')+tree(most)+'; walk there and look';}}
 return {w,html:html+'\n'+K('count       ')+cnt+' of '+n+' birds are at least '+T+' blue',wit,cnt,least,most};};
const WORD={c:'CERTIFIED',r:'REFUTED',f:'REFUSED'};
/* ---------------- Instrument 1: describe your Uirapuru ---------------- */
{const svg=$('f1svg'),out=$('f1out');let shape='every';
 const pressed=id=>$(id).getAttribute('aria-pressed')==='true';
 const render=()=>{const n=Number($('f1n').value),T=Number($('f1t').value);$('f1nv').textContent=group(n);$('f1tv').textContent=String(T);const b=forest(7,n,100);
  const claim=shape==='every'?'every Uirapuru in patch 7 is at least '+T+' blue':shape==='some'?'at least one Uirapuru in patch 7 is at least '+T+' blue':'no Uirapuru in patch 7 is '+T+' blue';
  const rough=pressed('f1rough'),amazon=pressed('f1amazon');const r=call(b,shape,T);
  let html=K('claim   ')+(rough?claim.replace(/at least \d+ blue|\d+ blue/,'roughly blue'):claim)+(amazon?', and in the whole Amazon':'')+'\n';
  if(amazon){html+=W('f','refused')+' the claim names no finite patch\n'+K('reason      ')+'the machine can call every bird in a patch; it cannot call every bird in the forest\n'+K('to flip     ')+'name the patch: over patch 7 alone the word would be '+WORD[r.w];drawPatch(svg,b,-1);}
  else if(rough){html+=W('f','refused')+' "roughly blue" is not a number\n'+K('reason      ')+'the guide\'s scale runs 0 to 100; the claim does not say where blue begins\n'+K('to flip     ')+'print the number: at "at least '+T+'" the word would be '+WORD[r.w];drawPatch(svg,b,-1);}
  else{html+=r.html;drawPatch(svg,b,r.wit);}
  out.innerHTML=html;};
 document.querySelectorAll('#act1 button[data-shape]').forEach(bt=>bt.addEventListener('click',()=>{shape=bt.dataset.shape;document.querySelectorAll('#act1 button[data-shape]').forEach(o=>{o.classList.toggle('on',o===bt);o.setAttribute('aria-pressed',o===bt?'true':'false');});render();}));
 for(const id of ['f1rough','f1amazon'])$(id).addEventListener('click',()=>{const on=!pressed(id);$(id).setAttribute('aria-pressed',on?'true':'false');$(id).classList.toggle('on',on);render();});
 $('f1n').addEventListener('input',render);$('f1t').addEventListener('input',render);render();}
/* ---------------- Instrument 2: read the map twice ---------------- */
{const svg=$('f2svg'),out=$('f2out');
 const render=()=>{const k=Number($('f2s').value);$('f2kv').textContent='0.'+k;const exact=new Q(BigInt(k),10n);const dbl=qdouble(k/10);const diff=dbl.sub(exact);const s=diff.sign();
  let g='<line x1="14" y1="58" x2="306" y2="58" stroke="var(--rule-strong)"/>';
  for(let i=0;i<=10;i++){const x=16+i*28.8;g+='<path d="M'+x+' 44 L'+(x+5)+' 58 L'+(x-5)+' 58 Z" fill="var(--ink-4)"/><text x="'+x+'" y="74" text-anchor="middle" font-size="7" fill="var(--ink-4)">'+(i/10).toFixed(1)+'</text>';}
  const x=16+k*28.8;g+='<circle cx="'+x+'" cy="30" r="4" fill="var(--ink)"/><text x="'+(x>250?x-8:x+8)+'" y="20" text-anchor="'+(x>250?'end':'start')+'" font-size="7" fill="var(--ink-3)">printed, 0.'+k+'</text>';
  if(s!==0){const xd=x+(s<0?-10:10);g+='<rect x="-4" y="-4" width="8" height="8" transform="translate('+xd+' 30) rotate(45)" fill="var(--sunk)" stroke="var(--ink)" stroke-width="1.2"/><line x1="'+x+'" y1="40" x2="'+xd+'" y2="40" stroke="var(--ink-3)" stroke-dasharray="2 3"/><text x="'+Math.min(268,Math.max(52,xd))+'" y="10" text-anchor="middle" font-size="6.5" fill="var(--ink-3)">the double, not to scale</text>';}
  svg.innerHTML=g;
  out.innerHTML=K('printed                      ')+V('0.'+k+' m')+'\n'+K('read as the decimal it is    ')+exact.n+'/'+exact.d+' m, exactly  '+W('c','on tree '+k)+'\n'+K('read as the double it denotes  ')+dbl.dec(20)+'… m  '+(s===0?W('c','on tree '+k)+K(' the same number both ways'):(s<0?W('r','before tree '+k):W('r','past tree '+k))+K(' by '+diff.abs().sci(2)+' m'))+'\n'+K('the claim "the bird is on tree '+k+'"   ')+(s===0?'holds under both readings':'holds under one reading and fails under the other; the machine writes down which it used');};
 $('f2s').addEventListener('input',render);render();}
/* ---------------- Instrument 3: plant a bird ---------------- */
{const base=forest(3,{{F3_N}},{{F3_SEED}});let birds=base.slice(),moves=0,fooled=0;const svg=$('f3svg'),out=$('f3out');
 const decide=(what)=>{let html=K('change  ')+what+'\n';let w,wit=-1;
  const malformed=birds.length!=={{F3_N}}||birds.some(x=>typeof x!=='number');
  if(birds.length!=={{F3_N}}){w='f';html+=W('f','refused')+' the claim says {{F3_N}} trees; the patch holds '+birds.length+'\n'+K('rule    ')+'nothing is decided until the patch is the one claimed';}
  else if(birds.some(x=>typeof x!=='number')){const t=birds.findIndex(x=>typeof x!=='number');w='f';wit=t;html+=W('f','refused')+' tree '+(t+1)+' holds a toy, and the guide has no number for a toy\n'+K('rule    ')+'a bird without a number is not a bird the claim is about';}
  else{let most=0;for(let i=1;i<{{F3_N}};i++)if(birds[i]>birds[most])most=i;wit=most;
   if(birds[most]<={{F3_MAX}}){w='c';html+=W('c','certified')+' every bird is at most {{F3_MAX}} blue\n'+K('certificate ')+'{{F3_N}} calls; the bluest is tree '+(most+1)+' at '+birds[most]+', margin '+({{F3_MAX}}-birds[most])+'\n'+K('falsifier   ')+'a bird above {{F3_MAX}} — there is none';}
   else{w='r';html+=W('r','refuted')+' the bird at tree '+(most+1)+' is '+birds[most]+' blue, above {{F3_MAX}}\n'+K('witness     ')+'tree '+(most+1)+'; walk there and look';}}
  const truth=malformed?'malformed':birds.every(x=>x<={{F3_MAX}});
  if((truth===true&&w==='r')||(truth===false&&w==='c'))fooled++;
  html+='\n'+K('moves '+moves+' · fooled '+fooled);out.innerHTML=html;drawPatch(svg,birds,wit,{{F3_N}});};
 const M={paint:()=>{birds[13]=95;return 'tree 14 painted 95 blue';},swap:()=>{[birds[4],birds[21]]=[birds[21],birds[4]];return 'the birds at trees 5 and 22 swapped';},toy:()=>{birds[19]='toy';return 'a toy put in tree 20';},drop:()=>{birds.pop();return 'the last tree cut down';},reset:()=>{birds=base.slice();moves=-1;fooled=0;return 'the patch as seeded';}};
 document.querySelectorAll('#act3 button[data-m]').forEach(bt=>bt.addEventListener('click',()=>{const what=M[bt.dataset.m]();moves++;decide(what);}));
 decide('the patch as seeded');}
/* ---------------- Instrument 4: ask the machine ---------------- */
{const b=forest(7,{{F7_N}},100);const box=$('ask');
 const refused=(why,flip)=>W('f','refused')+' '+why+(flip?'\n'+K('to flip  ')+flip:'');
 const every=call(b,'every',BLUE);
 const ROWS=[
  ['Every Uirapuru in patch 7 is at least '+BLUE+' blue.',()=>every.html],
  ['There is a blue Uirapuru somewhere in the Amazon.',()=>refused('no finite patch is named; the machine calls patches, not forests','name the patch, and the word is the call\'s')],
  ['Uirapurus are, roughly, blue.',()=>refused('"roughly" is not a number on the guide\'s scale','print the number: at "at least '+BLUE+'", patch 7 would be '+WORD[every.w])],
  ['The Uirapuru at tree 17 is bluer than the one at tree 18.',()=>b[16]>b[17]?W('c','certified')+' tree 17 is '+b[16]+', tree 18 is '+b[17]+'\n'+K('certificate ')+'two calls; the difference is '+(b[16]-b[17]):W('r','refuted')+' tree 17 is '+b[16]+', tree 18 is '+b[17]+'\n'+K('witness     ')+'the pair itself'],
  ['The toucan at tree 5 has a red beak.',()=>refused('the machine cannot see, hear or call a toucan: there is no exact decider for toucans, so it says so rather than guess')],
  ['The recording proves the bird sings above C5 (recording available from the authors).',()=>refused('the recording was not published; nothing decides a song nobody can hear','publish the recording, and the song is a claim about a finite patch')],
  ['No Uirapuru will ever be bluer than 100.',()=>refused('a statement about every bird for all time is a theorem, not a claim about a patch; it is left to proofs and proof assistants')],
  ['{{F7_COUNT}} of the {{F7_N}} birds in patch 7 are at least '+BLUE+' blue.',()=>every.cnt==={{F7_COUNT}}?W('c','certified')+' the count is '+every.cnt+'\n'+K('certificate ')+'{{F7_N}} calls, each bird against '+BLUE:W('r','refuted')+' the count is '+every.cnt],
  ['The bird is at 0.3 m.',()=>{const d=qdouble(0.3).sub(new Q(3n,10n));return W('c','on tree 3')+K(' as the decimal it is')+'\n'+W('r','before tree 3')+K(' as the double it denotes, by '+d.abs().sci(2)+' m')+'\n'+K('the machine writes down which reading it used');}],
  ['The bluest bird in patch 7 is at tree {{F7_BLUEST_TREE}}, {{F7_BLUEST}} blue.',()=>every.most==={{F7_BLUEST_TREE}}-1&&b[every.most]==={{F7_BLUEST}}?W('c','certified')+' tree '+(every.most+1)+' is '+b[every.most]+'\n'+K('certificate ')+'{{F7_N}} calls; no bird is bluer':W('r','refuted')+' the bluest is tree '+(every.most+1)+' at '+b[every.most]]
 ];
 const els=ROWS.map(([s,f],i)=>{const q=document.createElement('div');q.className='q';q.innerHTML='<div class="s">'+esc(s)+'</div><button class="ctrl" type="button">ask</button><div class="a"></div>';
  const bt=q.querySelector('button');bt.addEventListener('click',()=>{q.querySelector('.a').innerHTML=f();q.classList.add('on');});box.appendChild(q);return q;});
 $('askall').addEventListener('click',()=>{els.forEach((q,i)=>{if(q.classList.contains('on'))return;const go=()=>q.querySelector('button').click();if(reduced)go();else setTimeout(go,i*220);});});}
