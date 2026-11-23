(()=>{'use strict';
// Original coordinated paper collections. Legacy envelope IDs remain readable.
const suites=[
 {id:'olive',name:'橄榄来信',en:'THE OLIVE LETTER',tile:0,tag:'植物',ink:'#45513e',paper:'botanical',font:'serif',background:'linen',story:'像清晨花园里的一封信。棉纸、橄榄枝与一枚温柔的绿章。'},
 {id:'rose-garden',name:'玫瑰花园',en:'LETTERS FROM THE GARDEN',tile:1,tag:'花卉',ink:'#874854',paper:'cream',font:'serif',background:'rose',story:'让玫瑰沿着纸边慢慢生长，把珍重的话留在中央。'},
 {id:'blue-porcelain',name:'蓝瓷花笺',en:'SOMETHING IN BLUE',tile:2,tag:'花卉',ink:'#405d83',paper:'cream',font:'elegant',background:'paper',story:'一抹瓷蓝，一圈细细的花边，写下清澈而长久的祝愿。'},
 {id:'ribbon-stripe',name:'奶油丝带',en:'A LITTLE CELEBRATION',tile:3,tag:'经典',ink:'#7f6d40',paper:'cream',font:'serif',background:'linen',story:'奶油色条纹、细缎带和小小的庆祝。平凡的日子也值得被认真对待。'},
 {id:'midnight-gold',name:'星夜金笺',en:'UNDER THE SAME STARS',tile:4,tag:'经典',ink:'#c5ae75',paper:'noir',font:'elegant',background:'midnight',story:'把星光藏进深色信纸，在同一片夜空下，说一句一直在。'},
 {id:'pressed-flower',name:'花间手札',en:'PRESSED LITTLE MOMENTS',tile:5,tag:'复古',ink:'#696645',paper:'vintage',font:'kai',background:'sunroom',story:'留一朵小花，收藏一段日常。让这一页带着手作的痕迹。'}
];
const styles=[
 ['ivory','橄榄来信','植物棉笺 · 鼠尾草绿章',0,'#627151','wax','olive'],
 ['blue','雾蓝棉笺','蓝色亚麻 · 珍珠白章',1,'#63889b','wax','blue-porcelain'],
 ['sage','鼠尾草的问候','植物绿纸 · 蔷薇粉章',2,'#b87d80','wax','olive'],
 ['rose','玫瑰花园','手绘玫瑰 · 酒红火漆',3,'#9e3c4b','wax','rose-garden'],
 ['meadow','把春天寄给你','自然压花 · 柔软丝带',4,'#bf9761','ribbon','pressed-flower'],
 ['hydrangea','蓝瓷花笺','绣球花笺 · 鸢尾紫章',5,'#8e92b9','wax','blue-porcelain'],
 ['parchment','时光邮局','旧金棉笺 · 麻绳封存',6,'#997043','cord','pressed-flower'],
 ['mulberry','花落在纸上','楮皮花纸 · 自然棉绳',7,'#ab7650','cord','pressed-flower'],
 ['baroque','远方的手稿','古典雕花 · 香槟金章',8,'#a78147','cord','midnight-gold'],
 ['love','心事留白','象牙棉笺 · 酒红火漆',0,'#9f3443','wax','rose-garden'],
 ['linen','奶油丝带','奶油条纹 · 珍珠封章',0,'#936e43','ribbon','ribbon-stripe'],
 ['blush','一封温柔','玫瑰花笺 · 藕粉绸带',3,'#b8838c','ribbon','rose-garden']
].map(([id,name,desc,tile,seal,opening,suite])=>({id,name,desc,tile,seal,opening,suite}));
const $=s=>document.querySelector(s),studio=window.PagetoyouStudio;
const seals=[['rose','蔷薇粉','#b77e87'],['pearl','珍珠白','#e2d4b4'],['crimson','酒红','#963c43'],['sage','鼠尾草','#8b9975'],['violet','鸢尾紫','#ac92b6'],['gold','香槟金','#bd9b68']].map(([id,name,color],tile)=>({id,name,color,tile}));
const defaultSeal=s=>s.id==='rose'||s.id==='love'?'crimson':s.id==='sage'||s.id==='blush'?'rose':s.id==='hydrangea'?'violet':s.id==='blue'||s.id==='linen'?'pearl':s.opening==='cord'?'gold':'sage';
const find=id=>styles.find(s=>s.id===id)||styles[0];
const suiteFor=id=>suites.find(s=>s.id===id)||suites[0];
let sealEnabled=true;let selected='ivory',cursor=0,callback=null,returnFocus=null,customSeal=null,customOpening=null,liner='matching',stamp='botanical',recipient='',letterTitle='见字如面',letterBody='把平凡的日子，写成值得收藏的一页。',letterSign='予你，一些温柔的日常。',filter='全部';
function art(node,id){const s=suiteFor(id);node.dataset.suite=s.id;node.style.setProperty('--suite-x',(s.tile%3)*50+'%');node.style.setProperty('--suite-y',Math.floor(s.tile/3)*100+'%');}
function paper(node,s){
 node.style.setProperty('--paper-x',(s.tile%3)*50+'%');node.style.setProperty('--paper-y',Math.floor(s.tile/3)*50+'%');node.style.setProperty('--seal',s.seal);node.dataset.envelope=s.id;
 const index=Math.max(0,seals.findIndex(x=>x.id===(s.sealStyle||defaultSeal(s))));
 node.style.setProperty('--wax-x',(index%3)*50+'%');node.style.setProperty('--wax-y',Math.floor(index/3)*100+'%');node.dataset.sealStyle=seals[index].id;node.dataset.sealEnabled=String(s.sealEnabled??s.opening==='wax');
 art(node,s.suite);node.dataset.liner=s.liner||'matching';node.dataset.stamp=s.stamp||'botanical';
}
function envelope(s){
 const n=document.createElement('div');n.className='tactile-envelope closure-'+s.opening;paper(n,s);
 n.innerHTML='<div class="envelope-interior"><i class="envelope-liner"></i></div><div class="tactile-letter"><span>PAGE TO YOU · 予页</span><p>有些话，想慢慢说给你听。</p><small>一页心意，郑重送达。</small></div><div class="tactile-pocket"></div><div class="tactile-flap"><i class="flap-liner"></i></div><div class="thread-wrap"><i class="thread-h"></i><i class="thread-v"></i><i class="bow-left"></i><i class="bow-right"></i><i class="thread-tail"></i></div><div class="tactile-seal"><span>予</span></div><span class="envelope-postmark">予 · 心意邮局<br>WITH LOVE</span>';
 if(s.opening==='cord'){const rope=document.createElementNS('http://www.w3.org/2000/svg','svg');rope.setAttribute('viewBox','0 0 450 300');rope.setAttribute('class','real-twine');rope.innerHTML='<defs><filter id="twine-shadow"><feDropShadow dx="1" dy="2" stdDeviation="1.2" flood-opacity=".32"/></filter></defs><g filter="url(#twine-shadow)"><path class="twine-band" d="M-8 173 Q210 165 458 180 M244 -8 Q250 140 242 308"/><path class="twine-loop twine-left" d="M245 174 C213 123 144 122 163 153 C179 178 213 177 245 174"/><path class="twine-loop twine-right" d="M245 174 C272 123 335 132 314 155 C294 178 267 175 245 174"/><path class="twine-end twine-end-left" d="M245 174 C229 203 200 226 180 243"/><path class="twine-end twine-end-right" d="M245 174 C271 191 292 215 310 239"/><path class="twine-knot" d="M237 174 Q245 161 253 175 Q245 187 237 174"/></g>';n.append(rope);}if(s.recipient){const address=document.createElement('span');address.className='envelope-address';address.textContent='予 '+s.recipient;n.append(address);}
 return n;
}
const page=document.createElement('section');page.id='stationery-picker';page.hidden=true;
page.innerHTML=`<header><button class="stationery-brand">予页 <small>PAGE TO YOU</small></button><span class="atelier-progress"><b>01 挑选信笺</b><i>—</i>02 制作礼物<i>—</i>03 送达心意</span><button class="stationery-cancel">返回 ↗</button></header>
 <main>
 <div class="stationery-heading"><div><span>THE STATIONERY EDIT / 予页纸品室</span><h1>让一封信，<em>替你认真说。</em></h1></div><p>从信封到信纸，从一枝花到一枚印记。<br>挑一套喜欢的，把心意郑重装进去。</p></div>
 <div class="atelier-layout">
 <section class="atelier-display" aria-label="成套信笺预览"><div class="atelier-display-label"><span>YOUR LETTER SET</span><span class="preview-suite-label"></span></div><div class="suite-scene"><div class="suite-preview-paper atelier-paper"><span class="preview-overline">A LITTLE LETTER, JUST FOR YOU</span><strong>见字如面</strong><p>把平凡的日子，<br>写成值得收藏的一页。</p><small>予你，一些温柔的日常。</small></div><div class="envelope-carousel" tabindex="0" role="region" aria-label="信封款式，左右方向键或滑动切换"><div class="envelope-track"></div></div><span class="atelier-sample-tag">信封 × 同系列信纸</span></div><div class="atelier-display-footer"><div class="stationery-arrows"><button class="envelope-prev" aria-label="上一款信封">←</button><span class="envelope-count" aria-live="polite"></span><button class="envelope-next" aria-label="下一款信封">→</button></div><button class="preview-envelope" type="button">拆开看看 ↗</button></div></section>
 <section class="stationery-selection" aria-label="信笺搭配"><span class="atelier-kicker">CURATED FOR YOUR WORDS</span><h2></h2><p class="envelope-description"></p><p class="suite-story"></p><div class="atelier-materials"><span>纤维纸感</span><span>成套内页</span><span>互动拆封</span></div>
 <div class="seal-options"><span>01 / 封上一枚火漆</span><label class="seal-toggle"><input type="checkbox" checked>使用火漆封章</label><div class="wax-palette" role="group" aria-label="火漆款式"></div><label class="closure-choice">02 / 封口搭配<select aria-label="信封绑绳"><option value="wax">仅火漆 · 轻触揭开</option><option value="cord">复古麻绳 · 解结拆封</option><option value="ribbon">柔软缎带 · 解结拆封</option></select></label></div>
 <div class="atelier-options"><label>信封内衬<select aria-label="信封内衬"><option value="matching">同系列花笺</option><option value="plain">素色棉纸</option><option value="stripe">细条纹内衬</option></select></label><label>邮局印记<select aria-label="邮局印记"><option value="botanical">予页藏书章</option><option value="postmark">时光邮戳</option><option value="none">留白</option></select></label></div><label class="atelier-recipient">写给谁 <span>可不填</span><input maxlength="30" placeholder="收信人的名字" aria-label="收信人名字" autocomplete="off"></label><label class="suite-match"><input type="checkbox" checked>同时使用推荐字体与场景背景</label><button class="envelope-choose">选好信笺，开始制作 <span>→</span></button><button type="button" class="envelope-skip">这份礼物不需要信封，直接制作 →</button><p class="envelope-footnote">也可以在编辑时重新选择信封。</p></section>
 </div>
 <section class="atelier-collection"><div class="collection-heading"><div><span class="atelier-kicker">PAPER, PETALS & LITTLE THINGS</span><h2>每一封，都有自己的性格。</h2></div><p>十二款信封 · 六套纸品设计</p></div><div class="collection-filters" role="group" aria-label="按信笺风格筛选"></div><div class="collection-grid"></div></section>
 </main><footer><span>把温柔，寄到某个人的生活里。</span><span>DESIGNED TO BE KEPT · PAGE TO YOU</span></footer>`;
document.body.append(page);
const dialog=document.createElement('dialog');dialog.className='atelier-preview-dialog';dialog.innerHTML='<button type="button" class="atelier-preview-close" aria-label="关闭拆封预览">×</button><div class="atelier-preview-stage"></div>';document.body.append(dialog);
function closePreview(){dialog.querySelector('.gift-ritual')?.remove();dialog.close();page.querySelector('.preview-envelope').focus();}
dialog.querySelector('.atelier-preview-close').onclick=closePreview;
dialog.addEventListener('cancel',()=>dialog.querySelector('.gift-ritual')?.remove());
const stepLabel=document.createElement('p');stepLabel.textContent='① 选择信封与信笺 → ② 填写礼物 → ③ 预览 → ④ 送出';page.querySelector('.atelier-layout').before(stepLabel);const letterEdit=document.createElement('div');letterEdit.className='letter-edit';letterEdit.innerHTML='<p>信笺上的文字 · 实时预览</p><label>标题<input data-letter="letterTitle" maxlength="80"></label><label>正文<textarea data-letter="letterBody" maxlength="2000" rows="4"></textarea></label><label>落款<input data-letter="letterSign" maxlength="80"></label>';page.querySelector('.envelope-choose').before(letterEdit);letterEdit.oninput=e=>{const k=e.target.dataset.letter;if(k==='letterTitle')letterTitle=e.target.value;if(k==='letterBody')letterBody=e.target.value;if(k==='letterSign')letterSign=e.target.value;paint();};
let letterPages=[],letterMotion='turn';
const extraSheets=document.createElement('div');extraSheets.className='extra-letter-sheets';
const sheetFields=document.createElement('div'),addSheet=document.createElement('button');
addSheet.type='button';addSheet.textContent='＋ 添加一页续笺';
const motionLabel=document.createElement('label');motionLabel.textContent='翻阅效果';
const sheetMotion=document.createElement('select');
for(const [value,label] of [['turn','轻轻翻页'],['rise','纸页上浮'],['fade','光影淡入']])sheetMotion.add(new Option(label,value));
sheetMotion.onchange=()=>letterMotion=sheetMotion.value;
motionLabel.append(sheetMotion);extraSheets.append(sheetFields,addSheet,motionLabel);letterEdit.append(extraSheets);
function editExtraSheets(){
 sheetFields.replaceChildren();
 letterPages.forEach((body,i)=>{
  const label=document.createElement('label'),input=document.createElement('textarea'),remove=document.createElement('button');
  label.textContent='第 '+(i+2)+' 页正文';input.rows=4;input.maxLength=2000;input.value=body;
  input.oninput=()=>letterPages[i]=input.value;
  remove.type='button';remove.textContent='移除此页';remove.onclick=()=>{letterPages.splice(i,1);editExtraSheets();addSheet.focus();};
  label.append(input);sheetFields.append(label,remove);
 });
 addSheet.disabled=letterPages.length>=5;motionLabel.hidden=!letterPages.length;sheetMotion.value=letterMotion;
}
addSheet.onclick=()=>{if(letterPages.length<5){letterPages.push('');editExtraSheets();sheetFields.querySelector('label:last-of-type textarea')?.focus();}};
function currentChoice(){const s=styles[((cursor%styles.length)+styles.length)%styles.length];return {...s,sealStyle:customSeal||defaultSeal(s),opening:customOpening||s.opening,sealEnabled,liner,stamp,recipient,letterTitle,letterBody,letterSign,letterPages:[...letterPages],letterMotion};}
function readSheets(stage,d,done){
 const pages=[d.letterBody||'',...(d.letterPages||[]).filter(p=>p.trim())];
 if(pages.length===1){done?.();return;}
 const reader=document.createElement('section');reader.className='gift-ritual letter-reader';reader.setAttribute('aria-label','翻阅信笺');
 const sheet=document.createElement('article');sheet.className='atelier-paper';art(sheet,d.suite||find(d.envelope).suite);
 const heading=document.createElement('h2'),body=document.createElement('p'),sign=document.createElement('small');
 body.tabIndex=0;sheet.append(heading,body,sign);
 const nav=document.createElement('div');nav.className='letter-reader-controls';
 const prev=document.createElement('button'),next=document.createElement('button'),count=document.createElement('span');
 for(const button of [prev,next])button.type='button';
 prev.textContent='上一页';count.setAttribute('aria-live','polite');nav.append(prev,count,next);reader.append(sheet,nav);stage.append(reader);
 reader.onpointerdown=e=>e.stopPropagation();let index=0,animation;
 function show(direction){
  heading.textContent=index===0?(d.letterTitle||'见字如面'):'';body.textContent=pages[index];body.scrollTop=0;
  sign.textContent=index===pages.length-1?(d.letterSign||''):'';
  prev.disabled=index===0;next.textContent=index===pages.length-1?'查看礼物':'下一页';count.textContent=(index+1)+' / '+pages.length;
  animation?.cancel();
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const transform=d.letterMotion==='fade'?'scale(.97)':d.letterMotion==='rise'?'translateY(32px)':`perspective(900px) rotateY(${-direction*46}deg) translateX(${direction*22}px)`;
  animation=sheet.animate([{opacity:0,transform},{opacity:1,transform:'none'}],{duration:760,easing:'cubic-bezier(.2,.7,.25,1)'});
 }
 prev.onclick=()=>{if(index>0){index--;show(-1);}};
 next.onclick=()=>{if(index===pages.length-1){reader.remove();done?.();}else{index++;show(1);}};
 show(1);next.focus({preventScroll:true});
}
function preview(){const s=currentChoice(),stage=dialog.querySelector('.atelier-preview-stage');stage.replaceChildren();dialog.showModal();open(stage,{...s,envelope:s.id},()=>{const n=document.createElement('div');n.className='atelier-preview-opened';const sheet=document.createElement('div');sheet.className='atelier-paper';art(sheet,s.suite);sheet.innerHTML='<span>A LETTER, JUST FOR YOU</span><h2>见字如面</h2><p>有些话，<br>值得慢慢说给你听。</p><small>这封信，等你来完成。</small>';sheet.querySelector('h2').textContent=letterTitle;sheet.querySelector('p').textContent=letterBody;sheet.querySelector('small').textContent=letterSign;const replay=document.createElement('button');replay.type='button';replay.textContent='再拆一次 ↻';replay.onclick=preview;n.append(sheet,replay);stage.append(n);});}
page.querySelector('.preview-envelope').onclick=preview;
function paint(){const paper=page.querySelector('.suite-preview-paper');paper.querySelector('strong').textContent=letterTitle;paper.querySelector('p').textContent=letterBody;paper.querySelector('small').textContent=letterSign;paper.dataset.liner=liner;paper.dataset.stamp=stamp;
 const center=((cursor%styles.length)+styles.length)%styles.length,s=styles[center],suite=suiteFor(s.suite),track=page.querySelector('.envelope-track');track.replaceChildren();
 for(let offset=-1;offset<=1;offset++){const style=styles[(center+offset+styles.length)%styles.length],b=document.createElement('button');b.type='button';b.className='envelope-option';b.style.setProperty('--offset',offset);b.setAttribute('aria-label',offset===0?'预览拆封：'+style.name:'选择信封：'+style.name);b.setAttribute('aria-pressed',String(offset===0));b.tabIndex=offset===0?0:-1;b.append(envelope(offset===0?currentChoice():style));b.onclick=()=>offset===0?preview():move(offset);track.append(b);}
 page.querySelector('.stationery-selection h2').textContent=s.name;page.querySelector('.envelope-description').textContent=s.desc;page.querySelector('.suite-story').textContent=suite.story;page.querySelector('.preview-suite-label').textContent=suite.en;page.querySelector('.envelope-count').textContent=String(center+1).padStart(2,'0')+' / '+styles.length;
 art(page.querySelector('.suite-preview-paper'),suite.id);page.querySelector('.atelier-display').dataset.suite=suite.id;page.querySelector('.closure-choice select').value=customOpening||s.opening;
 page.querySelector('.seal-toggle input').checked=sealEnabled;page.querySelector('.wax-palette').hidden=!sealEnabled;page.querySelectorAll('.wax-option').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.wax===(customSeal||defaultSeal(s)))));
 page.querySelectorAll('.collection-card').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.envelope===s.id)));
}
function move(n){cursor+=n;customSeal=null;customOpening=null;sealEnabled=find(styles[((cursor%styles.length)+styles.length)%styles.length].id).opening==='wax';paint();}
function collection(){
 const grid=page.querySelector('.collection-grid');grid.replaceChildren();
 styles.forEach((s,i)=>{const suite=suiteFor(s.suite);if(filter!=='全部'&&filter!==suite.tag)return;const b=document.createElement('button');b.type='button';b.className='collection-card';b.dataset.envelope=s.id;b.setAttribute('aria-label','选择信笺套系：'+s.name);const scene=document.createElement('div');scene.className='collection-card-art';scene.dataset.suite=suite.id;const inner=document.createElement('div');inner.className='collection-mini-paper atelier-paper';art(inner,suite.id);const monogram=document.createElement('span');monogram.textContent='予';inner.append(monogram);scene.append(inner,envelope(s));const label=document.createElement('div');label.className='collection-card-label';const title=document.createElement('strong');title.textContent=s.name;const type=document.createElement('span');type.textContent=suite.tag+' / '+String(i+1).padStart(2,'0');label.append(title,type);b.append(scene,label);b.onclick=()=>{cursor=i;customSeal=null;customOpening=null;paint();page.querySelector('.atelier-layout').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});};grid.append(b);});
 page.querySelectorAll('.collection-filter').forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===filter)));paint();
}
for(const name of ['全部','植物','花卉','经典','复古']){const b=document.createElement('button');b.type='button';b.className='collection-filter';b.textContent=name;b.onclick=()=>{filter=name;collection();};page.querySelector('.collection-filters').append(b);}
function confirm(){
 const s=currentChoice(),chosen=seals.find(x=>x.id===s.sealStyle),suite=suiteFor(s.suite);selected=s.id;
 const detail={envelope:selected,seal:chosen.color,sealStyle:chosen.id,opening:s.opening,suite:s.suite,sealEnabled,packaging:true,liner,stamp,recipient,letterTitle,letterBody,letterSign,letterPages:s.letterPages,letterMotion};
 if(page.querySelector('.suite-match input').checked)Object.assign(detail,{paper:suite.paper,font:suite.font,background:suite.background});
 page.hidden=true;document.body.classList.remove('choosing-stationery');const done=callback;callback=null;window.dispatchEvent(new CustomEvent('pgy:envelope-selected',{detail}));done?.(detail);
}
function select(done,initial=selected,design={}){
 if(callback)return;returnFocus=document.activeElement;callback=done;cursor=Math.max(0,styles.findIndex(s=>s.id===initial));customSeal=design.sealStyle||null;customOpening=design.opening||null;liner=design.liner||'matching';stamp=design.stamp||'botanical';recipient=design.recipient||'';letterTitle=design.letterTitle||'见字如面';letterBody=design.letterBody||'把平凡的日子，写成值得收藏的一页。';letterSign=design.letterSign||'予你，一些温柔的日常。';letterPages=[...(design.letterPages||[])];letterMotion=design.letterMotion||'turn';editExtraSheets();for(const [key,value] of Object.entries({letterTitle,letterBody,letterSign}))page.querySelector('[data-letter='+key+']').value=value;sealEnabled=design.sealEnabled??((customOpening||find(initial).opening)==='wax');filter='全部';
 page.querySelector('[aria-label="信封内衬"]').value=liner;page.querySelector('[aria-label="邮局印记"]').value=stamp;page.querySelector('[aria-label="收信人名字"]').value=recipient;page.querySelector('.suite-match input').checked=!design.envelope;
 page.hidden=false;document.body.classList.add('choosing-stationery');collection();window.scrollTo(0,0);page.querySelector('.envelope-carousel').focus({preventScroll:true});
}
function cancel(){page.hidden=true;document.body.classList.remove('choosing-stationery');callback=null;const account=returnFocus?.closest('#pgy-account');if(account)account.hidden=false;else if($('#gift-studio').hidden&&$('#pgy-prototype').hidden)$('#studio-home').click();returnFocus?.focus();}
page.addEventListener('keydown',e=>{if(e.key==='Escape')cancel();});page.querySelector('.envelope-prev').onclick=()=>move(-1);page.querySelector('.envelope-next').onclick=()=>move(1);page.querySelector('.envelope-choose').onclick=confirm;page.querySelector('.stationery-cancel').onclick=cancel;page.querySelector('.stationery-brand').onclick=cancel;
seals.forEach(seal=>{const b=document.createElement('button');b.type='button';b.className='wax-option';b.dataset.wax=seal.id;b.setAttribute('aria-label','选择火漆：'+seal.name);b.style.setProperty('--wax-x',(seal.tile%3)*50+'%');b.style.setProperty('--wax-y',Math.floor(seal.tile/3)*100+'%');b.innerHTML='<i></i><span>'+seal.name+'</span>';b.onclick=()=>{customSeal=seal.id;paint();};page.querySelector('.wax-palette').append(b);});
page.querySelector('.seal-toggle input').onchange=e=>{sealEnabled=e.target.checked;paint();};page.querySelector('.envelope-skip').onclick=()=>{page.hidden=true;document.body.classList.remove('choosing-stationery');const done=callback;callback=null;const detail={packaging:false};window.dispatchEvent(new CustomEvent('pgy:envelope-selected',{detail}));done?.(detail);};page.querySelector('.closure-choice select').onchange=e=>{customOpening=e.target.value;sealEnabled=customOpening==='wax';paint();};page.querySelector('[aria-label="信封内衬"]').onchange=e=>{liner=e.target.value;paint();};page.querySelector('[aria-label="邮局印记"]').onchange=e=>{stamp=e.target.value;paint();};page.querySelector('[aria-label="收信人名字"]').oninput=e=>{recipient=e.target.value;paint();};
const carousel=page.querySelector('.envelope-carousel');carousel.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}};
let startX=null,suppressClick=false;carousel.onpointerdown=e=>{startX=e.clientX;};carousel.onpointerup=e=>{if(startX!==null&&Math.abs(e.clientX-startX)>35){move(e.clientX<startX?1:-1);suppressClick=true;setTimeout(()=>suppressClick=false,150);}startX=null;};carousel.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();}},true);carousel.onpointercancel=()=>startX=null;
function syncCard(d){for(const node of document.querySelectorAll('#pg-canvas,#pg-gift')){if(d.suite&&suites.some(s=>s.id===d.suite))art(node,d.suite);else{delete node.dataset.suite;node.style.removeProperty('--suite-x');node.style.removeProperty('--suite-y');}}const stage=document.querySelector('.pg-stage');if(d.suite&&d.background===suiteFor(d.suite).background&&!d.backgroundImage)stage.dataset.suite=d.suite;else delete stage.dataset.suite;const option=presetBox?.querySelector('select');if(option&&presets[d.suite])option.value=d.suite;const paperControl=document.querySelector('#pgy-prototype [data-design=paper]');if(paperControl)paperControl.closest('label').hidden=!!d.suite;}
function open(stage,d,onOpened){
 stage.querySelector('.gift-ritual')?.remove();if(d.packaging===false){onOpened?.();return;}const base=find(d.envelope),s={...base,suite:d.suite||base.suite,seal:d.seal||base.seal,opening:d.opening||base.opening,sealStyle:d.sealStyle||defaultSeal(base),liner:d.liner||'matching',stamp:d.stamp||'botanical',recipient:d.recipient||'',sealEnabled:d.sealEnabled!==false};
 const shell=document.createElement('div');shell.className='gift-ritual stationery-ritual';shell.dataset.suite=s.suite;shell.innerHTML='<span class="letter-ritual-overline">SOMETHING SPECIAL, JUST FOR YOU</span><h2>有一份心意，等你亲手打开。</h2>';if(s.recipient)shell.querySelector('h2').textContent=s.recipient+'，有一份心意等你打开。';
 const e=envelope(s);shell.append(e);const action=document.createElement('button');action.className='unwrap-action';action.type='button';const hint=document.createElement('p');hint.className='unwrap-hint';hint.setAttribute('aria-live','polite');let step=0,locked=false;const tied=s.opening!=='wax';action.textContent=tied?'轻拉绳结':s.sealEnabled?'轻触火漆':'打开封舌';hint.textContent=tied?'先解开蝴蝶结，再打开这封信。':'一枚小小的印记，封存了一份认真的心意。';shell.append(action,hint);stage.append(shell);shell.addEventListener('pointerdown',event=>event.stopPropagation());
 const wait=ms=>new Promise(r=>setTimeout(r,matchMedia('(prefers-reduced-motion: reduce)').matches?0:ms));
 action.onclick=async()=>{if(locked)return;locked=true;action.disabled=true;if(step===0&&tied){shell.classList.add('is-untying');hint.textContent='绳结松开了。现在，揭开封口。';await wait(750);if(!shell.isConnected)return;shell.classList.add('is-untied');step=1;action.textContent=s.sealEnabled?'揭开火漆与封舌':'掀开信封';action.disabled=false;locked=false;return;}shell.classList.add('is-turning');await wait(450);if(!shell.isConnected)return;shell.classList.add('is-unsealed');hint.textContent='封口已打开。';await wait(s.sealEnabled?500:150);if(!shell.isConnected)return;shell.classList.add('is-unfolding');await wait(800);if(!shell.isConnected)return;shell.classList.add('is-extracting');hint.textContent='把这一页，轻轻取出来。';await wait(1050);if(!shell.isConnected)return;shell.classList.add('is-presenting');await wait(650);if(!shell.isConnected)return;shell.classList.add('is-revealing');await wait(500);if(!shell.isConnected)return;shell.remove();readSheets(stage,d,onOpened);};
 let pull=null,ignoreClick=false;e.onpointerdown=event=>{if(!tied||step!==0||locked)return;pull={x:event.clientX,y:event.clientY};e.setPointerCapture(event.pointerId);};e.onpointerup=event=>{if(pull&&Math.hypot(event.clientX-pull.x,event.clientY-pull.y)>28){ignoreClick=true;action.click();setTimeout(()=>ignoreClick=false,200);}pull=null;};e.onpointercancel=()=>pull=null;e.onclick=()=>{if(!ignoreClick)action.click();};e.setAttribute('aria-hidden','true');
}

function renderGift(stage,gift){stage.querySelector('.material-gift')?.remove();if(!['leaf','parchment'].includes(gift.kind))return;const wrap=document.createElement('article');wrap.className='material-gift material-'+gift.kind;
if(gift.kind==='leaf'){const b=document.createElement('button');b.className='gift-leaf';b.setAttribute('aria-label','翻转这片叶子，读背面的留言');const img=document.createElement('img');img.src='./assets/stationery/ginkgo-v1.png';img.alt='带有细密叶脉的金色银杏叶';b.append(img);const note=document.createElement('span');note.className='leaf-inscription';note.textContent=gift.words||'送你一片秋天。';b.append(note);b.onclick=()=>{b.classList.toggle('leaf-turned');b.setAttribute('aria-label',b.classList.contains('leaf-turned')?'翻回叶子正面':'翻转这片叶子，读背面的留言');};wrap.append(b);const caption=document.createElement('p');caption.textContent='轻触叶片，读一读背面的悄悄话。';wrap.append(caption);}
else{const paper=document.createElement('div');paper.className='parchment-sheet';const head=document.createElement('span');head.className='manuscript-overline';head.textContent='A LETTER TO KEEP';const title=document.createElement('h2');title.textContent=gift.title;const body=document.createElement('p');body.className='manuscript-body';body.textContent=gift.words||'见字如面。\n愿每一个平凡的日子，都有温柔的回响。';const sign=document.createElement('p');sign.className='manuscript-sign';sign.textContent=gift.author?'写信的人 · '+gift.author:'予你，见字如面。';paper.append(head,title,body,sign);wrap.append(paper);}stage.append(wrap);}
function addChange(parent,isCard){const b=document.createElement('button');b.type='button';b.className='change-envelope';b.textContent='重新挑选信封 ↗';b.onclick=()=>{const gift=isCard?window.PagetoyouCard.current():studio.current();select(detail=>{if(!isCard)studio.setDesign({...window.PagetoyouStationery.decorate(gift.design),...detail});},gift?.design?.envelope,gift?.design||{});};parent.prepend(b);}
document.querySelectorAll('[data-design=opening]').forEach(n=>n.closest('label').remove());
document.querySelectorAll('.gift-design-controls').forEach(box=>addChange(box,!!box.closest('#pgy-prototype')));
const text=(id,name,content,x,y,size,color='ink',type='text')=>({id,name,content,x,y,size,color,type,angle:0});
const presets={
 parchment:{name:'羊皮纸书信 · 旧时手稿',paper:'vintage',font:'kai',elements:[text(1,'题签','LETTERS THROUGH TIME',18,12,9,'olive'),text(2,'标题','展信佳',18,26,27),text(3,'正文','亲爱的朋友：\n\n有些话，想在这张旧纸上慢慢写给你。\n\n愿每一个平凡的日子，\n都有人惦记，有温柔回响。',18,42,12),text(4,'落款','见字如面，愿你一切都好。',22,84,10,'olive')]},
 letter:{name:'见字如面 · 素笺',paper:'cream',elements:[text(1,'题签','A LETTER, JUST FOR YOU',12,9,10,'olive'),text(2,'信件标题','见字如面',12,21,30),text(3,'书信正文','亲爱的朋友：\n\n想把生活里小小的美好，\n都慢慢讲给你听。\n\n愿你心里有光，脚下有路，\n每一次出发，都有温柔相伴。',12,36,14),text(4,'署名','一直惦记你的朋友',38,85,12,'olive')]},
 birthday:{name:'生日手札 · 暖金',paper:'vintage',elements:[text(1,'题签','ANOTHER BEAUTIFUL YEAR',12,10,10,'olive'),text(2,'生日标题','又一起长大了一岁',12,25,23,'rose'),text(3,'生日祝福','愿你一直热爱，永远自在。\n\n可以勇敢，也可以慢慢来。\n\n新的一岁，\n我们继续把日子过成喜欢的模样。',12,41,14),text(4,'小小的星光','✧',72,13,26,'olive','decor'),text(5,'生日署名','生日快乐，我的朋友。',20,83,14,'rose')]},
 garden:{name:'花间问候 · 植物笺',paper:'botanical',elements:[text(1,'植物装饰','❦',40,10,40,'olive','decor'),text(2,'问候标题','把春天寄给你',14,30,25,'olive'),text(3,'问候正文','愿花开时有人陪你看，\n愿风起时有人为你添衣。\n\n那些微小而确切的幸福，\n都正在向你走来。',13,48,14),text(4,'落款','予你，一些温柔的日常。',20,83,12,'olive')]},
 memory:{name:'留住这一天 · 照片笺',paper:'cream',elements:[text(1,'纪念标题','留住这一天',12,9,26,'rose'),text(2,'照片说明','我们的平凡好日子',13,30,46,'ink','photo'),text(3,'纪念文字','有你在的日子，\n都值得被认真收藏。',13,72,14),text(4,'署名','TO OUR LITTLE MOMENTS',13,89,9,'olive')]}
};
for(const suite of suites){
 const midnight=suite.id==='midnight-gold';
 presets[suite.id]={name:suite.name+' · 成套内页',suite:suite.id,paper:suite.paper,font:suite.font,elements:[
  text(1,'英文题签',suite.en,22,23,7,'olive'),
  text(2,'信件标题',midnight?'同一片星空下':suite.id==='rose-garden'?'把温柔写给你':suite.id==='ribbon-stripe'?'今天也值得庆祝':'见字如面',21,33,23,midnight?'olive':'rose'),
  text(3,'书信正文','亲爱的朋友：\n\n愿那些平凡的小事，\n也能给你长久的欢喜。\n\n很高兴，生活里有你。',22,47,11),
  text(4,'落款','一直惦记你的朋友',29,81,10,'olive')
 ]};
}
function applyCardPreset(key){const gift=window.PagetoyouCard.current();key=key||(presets[gift.design?.suite]?gift.design.suite:'letter');const p=presets[key]||presets.letter;window.PagetoyouCard.load({...gift,title:p.name.split(' · ')[0],design:{...gift.design,paper:p.paper,font:p.font||'kai',...(p.suite?{suite:p.suite}:key==='parchment'?{suite:undefined}:{})},card:{mode:'template',elements:structuredClone(p.elements).map((e,i)=>{const key=['','letterTitle','letterBody','letterSign'][i];return {...e,...(gift.design?.[key]?{content:gift.design[key]}:{})};})}},false);document.querySelectorAll('.preset-swatches button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.preset===key)));}
const presetBox=document.createElement('div');presetBox.className='letter-presets';presetBox.innerHTML='<label>内页样式<select aria-label="贺卡内页样式"></select></label><button type="button">应用这款内页</button><small>应用会替换当前布局与文字。</small>';for(const [key,p]of Object.entries(presets)){const o=document.createElement('option');o.value=key;o.textContent=p.name;presetBox.querySelector('select').append(o);}presetBox.querySelector('button').onclick=()=>applyCardPreset(presetBox.querySelector('select').value);$('.pg-materials').prepend(presetBox);
const swatches=document.createElement('div');swatches.className='preset-swatches';swatches.setAttribute('role','group');swatches.setAttribute('aria-label','成套内页预览');for(const suite of suites){const b=document.createElement('button');b.type='button';b.className='atelier-paper';art(b,suite.id);b.dataset.preset=suite.id;b.setAttribute('aria-label','应用内页：'+suite.name);b.setAttribute('aria-pressed','false');const title=document.createElement('span');title.textContent=suite.name;b.append(title);b.onclick=()=>{presetBox.querySelector('select').value=suite.id;applyCardPreset(suite.id);};swatches.append(b);}presetBox.prepend(swatches);
window.PagetoyouStationery={styles,suites,select,open,renderGift,applyCardPreset,syncCard,get ready(){return !!latest;},decorate:d=>({background:'midnight',font:'serif',opening:'wax',paper:'cream',tree:'christmas',color:'#e7bc61',glow:65,ending:'愿这份心意，陪你度过每一个平凡的日子。',music:'',...d,...(latest||{})})};let latest=null;window.addEventListener('pgy:envelope-selected',e=>latest=e.detail);
})();
