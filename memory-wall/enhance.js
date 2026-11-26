/* 予页 additions to Memory Universe (MIT): layout choreography, text flight,
   local chat media, chronological navigation. Original engine remains in app.js. */
window.createMemoryExperience = function (api) {
  'use strict';
  const {THREE,scene,camera,renderer,sessions,data,orbit}=api;
  const $=id=>document.getElementById(id);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const all=sessions.flatMap(s=>s.messages.map((m,i)=>({s,m,i})));
  const originals=sessions.map(s=>s.pos.clone());
  const targets=originals.map(v=>v.clone());
  let mode='galaxy',tour=false,tourClock=0,tourIndex=-1,time=0,cardClock=0,drawCursor=0,cardOffset=0;
  const textEntries=all.filter(x=>x.m.text.trim().length>0);
  const cards=[],flowGroup=new THREE.Group(),worldGroup=new THREE.Group();
  scene.add(camera);camera.add(flowGroup);scene.add(worldGroup);
  const maxCards=innerWidth<700?30:54;
  const cardCanvas=document.createElement('canvas');
  cardCanvas.width=768;cardCanvas.height=256;
  const scratch=new THREE.Vector3();
  function cardTexture(entry) {
    const c=cardCanvas,g=c.getContext('2d'),m=entry.m;
    g.clearRect(0,0,c.width,c.height);
    const warm=m.role==='user';
    const fill=g.createLinearGradient(0,0,768,256);
    fill.addColorStop(0,warm?'rgba(34,29,29,.9)':'rgba(14,30,43,.9)');fill.addColorStop(1,'rgba(5,13,24,.62)');
    g.fillStyle=fill;g.fillRect(1,1,766,254);
    g.strokeStyle=warm?'rgba(224,187,139,.4)':'rgba(133,187,214,.4)';g.lineWidth=1.5;g.strokeRect(1,1,766,254);
    g.fillStyle=warm?'#e5bd8c':'#9ac9e0';g.fillRect(0,0,3,256);
    g.font='20px "Microsoft YaHei",sans-serif';g.fillText(m.sender+'  ·  '+(m.time||'').slice(5,16),27,37);
    g.fillStyle='#e4e9ed';g.font='28px "Microsoft YaHei",sans-serif';
    const plain=m.text.replace(/\s+/g,' ').slice(0,180);let line='',lines=[];
    for(const ch of plain){if(g.measureText(line+ch).width>710){lines.push(line);line=ch;if(lines.length===3)break;}else line+=ch;}
    if(lines.length<3&&line)lines.push(line);else if(lines.length===3)lines[2]=lines[2].slice(0,-1)+'…';
    lines.forEach((s,i)=>g.fillText(s,27,87+i*39));
    g.fillStyle='#6e8599';g.font='14px Georgia,serif';g.fillText('A FRAGMENT OF OUR UNIVERSE',27,231);
    const tex=new THREE.CanvasTexture(c);tex.minFilter=THREE.LinearFilter;tex.generateMipmaps=false;
    // CanvasTexture holds the canvas; snapshot each card so pool updates stay independent.
    const copy=document.createElement('canvas');copy.width=768;copy.height=256;copy.getContext('2d').drawImage(c,0,0);tex.image=copy;tex.needsUpdate=true;
    return tex;
  }
  function setEntry(card,entry) {
    card.entry=entry;
    if(card.sprite.material.map)card.sprite.material.map.dispose();
    card.sprite.material.map=cardTexture(entry);
  }
  function nextEntry(){const entry=textEntries[(drawCursor++ + cardOffset)%textEntries.length];return entry;}
  function makeCards() {
    for(let i=0;i<maxCards;i++){
      const material=new THREE.SpriteMaterial({transparent:true,depthWrite:false,opacity:0});
      const sprite=new THREE.Sprite(material);sprite.scale.set(37,12.34,1);sprite.renderOrder=2;
      const card={sprite,phase:i/maxCards,z:-35-i*6,lane:(i*0.61803398875)%1};
      setEntry(card,textEntries[Math.floor(i/maxCards*textEntries.length)]);cards.push(card);worldGroup.add(sprite);
    }
  }
  makeCards();
  // A fine chronological filament connects days, while the original engine draws each message.
  const threadGeo=new THREE.BufferGeometry().setFromPoints(sessions.map(s=>s.pos));
  const thread=new THREE.Line(threadGeo,new THREE.LineBasicMaterial({color:0xa6c5da,transparent:true,opacity:.14,depthWrite:false}));scene.add(thread);
  function updateThread(){threadGeo.setFromPoints(sessions.map(s=>s.pos));}
  function caption(kicker,text){$('scene-kicker').textContent=kicker;$('scene-caption').textContent=text;}
  function setTour(value){tour=value;tourClock=0;$('tour').setAttribute('aria-pressed',String(tour));$('tour').textContent=tour?'暂停漫游':'开始漫游';}
  function setMode(value) {
    if(!['galaxy','helix','wall','flow'].includes(value))return;
    setTour(false);api.closePanel();mode=value;document.body.dataset.mode=mode;
    document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
    sessions.forEach((s,i)=>{
      if(mode==='helix'){const a=i/(sessions.length-1||1)*Math.PI*3;targets[i].set(Math.cos(a)*112,(i-(sessions.length-1)/2)*20,Math.sin(a)*112);}
      else if(mode==='wall'){const cols=5;targets[i].set((i%cols-2)*85,(1-Math.floor(i/cols))*105,Math.sin(i*.7)*14);}
      else targets[i].copy(originals[i]);
    });
    api.expandAll(mode==='helix'||mode==='wall');
    cards.forEach((c,i)=>{(mode==='flow'?flowGroup:worldGroup).add(c.sprite);c.z=-35-i*6;});
    if(mode==='flow')caption('EVERY WORD, STILL TRAVELLING','穿过时间，再遇见说过的每一句话。');
    else if(mode==='helix')caption('TIME HAS A SHAPE','时间盘旋向前，回忆始终发光。');
    else if(mode==='wall')caption('THOUSANDS OF LITTLE MOMENTS','把每一个平凡瞬间，铺成浩瀚。');
    else caption('THE SHAPE OF OUR MEMORIES','每一颗星光，都有一句话的重量。');
    orbit.tTheta=mode==='wall'?0:mode==='helix'?.65:.9;
    orbit.tPhi=mode==='wall'?Math.PI/2:mode==='helix'?1.24:.95;
    const radius=mode==='wall'?680:mode==='helix'?700:initialRadius;
    api.flightTo(mode==='galaxy'?initialTarget:new THREE.Vector3(0,0,0),radius,reduced?.01:2.2);
    if(mode==='flow'){drawCursor=0;cards.forEach(c=>setEntry(c,nextEntry()));}
  }
  const initialRadius=orbit.radius,initialTarget=orbit.target.clone();
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
  $('tour').onclick=()=>{setTour(!tour);if(tour&&mode!=='flow'){api.closePanel();tourIndex=-1;tourClock=7;}};
  $('home').onclick=()=>{setMode('galaxy');$('timeline').value=-1;$('timeline-label').textContent='全部时光';};
  $('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('fullscreen').textContent='浏览器未允许';}};
  const first=data.stats.first?.slice(0,10).replaceAll('-','.'),last=data.stats.last?.slice(0,10).replaceAll('-','.');
  $('date-span').textContent=(data.senders||[]).join(' 与 ')+' · '+first+' — '+last;
  $('s-msgs').textContent=data.stats.messages.toLocaleString();
  const slider=$('timeline');slider.max=sessions.length-1;
  const ticks=$('timeline-ticks');[0,Math.floor(sessions.length/2),sessions.length-1].forEach(i=>{const span=document.createElement('span');span.textContent=sessions[i]?.day.slice(5).replace('-','.');ticks.appendChild(span);});
  function selected(s) {
    slider.value=sessions.indexOf(s);$('timeline-label').textContent=s.day+' · '+s.msgCount+' 句';
    $('side').classList.remove('open');$('menu').classList.remove('on');
    $('search-results').replaceChildren();
    if(!tour) setTour(false);
  }
  slider.addEventListener('input',()=>{setTour(false);const s=sessions[+slider.value];if(s){if(mode==='flow'){setMode('galaxy');}api.selectSession(s);}else{api.closePanel();$('timeline-label').textContent='全部时光';}});
  let searchTimer;
  $('q').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{
    const key=$('q').value.trim().toLowerCase(),box=$('search-results');box.replaceChildren();if(!key)return;
    const matches=all.filter(x=>x.m.text.toLowerCase().includes(key));
    const count=document.createElement('div');count.className='result-count';count.textContent=matches.length?'找到 '+matches.length+' 句，显示前 30 条':'这片星河中没有找到这句话';box.appendChild(count);
    matches.slice(0,30).forEach(x=>{const b=document.createElement('button'),small=document.createElement('small');small.textContent=x.m.sender+' · '+x.m.time;b.appendChild(small);b.appendChild(document.createTextNode(x.m.text.slice(0,100)));b.onclick=()=>{setTour(false);if(mode==='flow')setMode('galaxy');api.selectSession(x.s,x.i);};box.appendChild(b);});
  },180);});
  $('q').addEventListener('keydown',e=>{if(e.key==='Escape'){$('q').value='';$('q').dispatchEvent(new Event('input'));$('q').blur();}});
  function renderMedia(m,el) {
    for(const media of m.media||[]){let node;const ext=media.url.split('.').at(-1);
      if(['jpg','jpeg','png','gif','webp'].includes(ext)){node=document.createElement('img');node.alt=m.kind==='emoji'?'聊天表情':'聊天图片';node.loading='lazy';}
      else if(['mp3','wav','ogg','m4a'].includes(ext)){node=document.createElement('audio');node.controls=true;node.preload='none';}
      else if(['mp4','webm'].includes(ext)){node=document.createElement('video');node.controls=true;node.preload='none';}
      if(node){node.src=media.url;node.addEventListener('error',()=>{const note=document.createElement('div');note.className='media-note';note.textContent='此素材当前无法播放';node.replaceWith(note);},{once:true});el.appendChild(node);}
    }
    if(m.unavailable){const note=document.createElement('div');note.className='media-note';note.textContent='原图尚未解密 · 已保留这条回忆';el.appendChild(note);}
  }
  // Cancel automatic camera travel when the viewer takes control.
  renderer.domElement.addEventListener('pointerdown',()=>setTour(false));
  renderer.domElement.addEventListener('wheel',()=>setTour(false),{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)setTour(false);});
  function step(dt) {
    if(document.hidden)return;
    time+=dt;
    const k=reduced?1:1-Math.exp(-dt*2.3);
    sessions.forEach((s,i)=>{s.pos.lerp(targets[i],k);s.obj.group.position.copy(s.pos);});
    updateThread();
    if(tour){tourClock+=dt;if(mode==='flow'){/* Flow itself is the continuous tour. */}else if(tourClock>8){tourClock=0;tourIndex=(tourIndex+1)%sessions.length;api.selectSession(sessions[tourIndex]);}if(!reduced)orbit.tTheta+=dt*.045;}
    cardClock+=dt;
    if(mode!=='flow'&&cardClock>1.7){cardClock=0;const card=cards[(Math.floor(time/1.7))%cards.length];setEntry(card,nextEntry());}
    const current=api.getSelected();
    for(let i=0;i<cards.length;i++){
      const c=cards[i],sprite=c.sprite;
      if(mode==='flow'){
        if(!reduced)c.z+=dt*13;
        if(c.z>-23){c.z=-355;setEntry(c,nextEntry());}
        // Perspective tunnels keep a quiet center, so near cards don't cover the title.
        const angle=c.lane*Math.PI*2,spread=37+(i%4)*15;
        sprite.position.set(Math.cos(angle)*spread,Math.sin(angle)*spread*.65,c.z);
        sprite.scale.set(37,12.34,1);
        sprite.material.opacity=Math.min(1,(-c.z-23)/28,(360+c.z)/50)*.92;
      }else{
        const s=current||c.entry.s;
        const angle=i*2.39996+time*(reduced?0:.025);
        if(mode==='wall'){
          sprite.position.copy(s.pos).add(scratch.set((i%3-1)*23,(Math.floor(i/3)%3-1)*19,20+(i%3)*5));
          sprite.scale.set(38,12.67,1);
        }else{
          const radius=current?45:20+(i%3)*10;
          sprite.position.copy(s.pos).add(scratch.set(Math.cos(angle)*radius,Math.sin(angle*1.3)*26,Math.sin(angle)*radius));
          sprite.scale.set(current?30:23,current?10:7.67,1);
        }
        const d=sprite.position.distanceTo(camera.position);
        const targetOpacity=(current?(c.entry.s===current?.8:.05):.5)*Math.min(1,500/Math.max(1,d));
        sprite.material.opacity+=(targetOpacity-sprite.material.opacity)*k;
        // Selected day uses its own messages rather than relabeling another day's text.
        if(current&&c.entry.s!==current&&i<18){const index=(i*29+Math.floor(time/20))%current.messages.length;setEntry(c,{s:current,m:current.messages[index],i:index});}
      }
    }
    worldGroup.visible=mode!=='flow';flowGroup.visible=mode==='flow';
    thread.visible=mode!=='flow';
  }
  document.body.dataset.mode=mode;
  window.memoryWall={setMode,selectDay:i=>api.selectSession(sessions[i]),
    get state(){return{mode,tour,messages:all.length,days:sessions.length,cards:cards.length,renderedPoints:sessions.reduce((n,s)=>n+s.obj.points.geometry.attributes.position.count,0),textures:renderer.info.memory.textures};}};
  return {step,selected,renderMedia};
};
