import {photoArtwork,spaceBackdrop} from './scene-kit.js';
import * as THREE from './vendor/three/three.module.js';
import { OrbitControls } from './vendor/three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from './vendor/three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from './vendor/three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/three/addons/postprocessing/OutputPass.js';

let active=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const rand=n=>{const x=Math.sin(n*127.13+31.77)*43758.5453;return x-Math.floor(x);};
const christmasLooks={
 gold:{lights:[0xba742e,0xf2a94e,0xffd693,0xfff2d0],metal:[0xc29551,0x9b2838,0xe5c38c,0x286145],night:['#24233a','#080910']},
 rose:{lights:[0x94516b,0xee87a9,0xffbfd4,0xffeedb],metal:[0xc38c91,0x982b57,0xead0b9,0x70619a],night:['#352441','#0d0916']},
 aurora:{lights:[0x236c85,0x69c8ba,0xa1e8e1,0xd4caff],metal:[0x73abb1,0x7360af,0xb0d9de,0x276b70],night:['#122e47','#060d1a']}
};
function treeRadius(height){return .09+2.62*height**.88;}
function christmasLights(look,mobile){
 const count=mobile?3300:5600,positions=new Float32Array(count*3),colors=new Float32Array(count*3),sizes=new Float32Array(count),phases=new Float32Array(count);
 const palette=look.lights.map(color=>new THREE.Color(color));
 for(let i=0;i<count;i++){
  const t=.025+.965*rand(i+113),angle=i*2.399963,spiral=i%5===0;
  const theta=spiral?t*Math.PI*16+(rand(i+77)-.5)*.16:angle;
  const scallop=.98+.075*Math.cos(t*7*Math.PI*2+theta*.54);
  const radius=treeRadius(t)*(spiral?1.055:scallop*(.59+.45*rand(i+872)));
  positions.set([Math.sin(theta)*radius,3.83-7.7*t,Math.cos(theta)*radius],i*3);
  const accent=i%43===0;
  const color=palette[accent?3:spiral?2:i%3?1:0];colors.set([color.r,color.g,color.b],i*3);
  sizes[i]=accent?2.7:spiral?1.1+rand(i+36)*.44:.60+rand(i+36)*.82;
  phases[i]=rand(i+191)*Math.PI*2;
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 geometry.setAttribute('aColor',new THREE.BufferAttribute(colors,3));
 geometry.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));
 geometry.setAttribute('aPhase',new THREE.BufferAttribute(phases,1));
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{uTime:{value:0},uFade:{value:1},uScale:{value:1}},
  vertexShader:'attribute vec3 aColor;attribute float aSize;attribute float aPhase;uniform float uTime;uniform float uScale;varying vec3 vColor;varying float vLight;void main(){vec4 p=modelViewMatrix*vec4(position,1.);vColor=aColor;vLight=.62+.38*pow(.5+.5*sin(aPhase+uTime),4.);gl_PointSize=clamp(aSize*uScale*28./-p.z,1.,14.);gl_Position=projectionMatrix*p;}',
  fragmentShader:'uniform float uFade;varying vec3 vColor;varying float vLight;void main(){vec2 q=(gl_PointCoord-.5)*2.;float r=dot(q,q);if(r>1.)discard;float core=exp(-r*10.);float glow=exp(-r*3.)*.39;gl_FragColor=vec4(vColor*(1.+core*1.1),(core+glow)*vLight*uFade*(1.-r));}'
 });
 return new THREE.Points(geometry,material);
}
function make(stage,gift,design){
 const canvas=document.createElement('canvas');canvas.className='gift-webgl-canvas';canvas.setAttribute('aria-label','可切换树种与装饰的三维照片树，拖动旋转、滚轮或双指缩放，点击照片查看');
 let renderer;try{renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'});}catch(e){throw Error('当前设备无法启用 WebGL，已保留基础照片树。');}
 renderer.setClearColor(0x030504);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.88;renderer.outputColorSpace=THREE.SRGBColorSpace;stage.append(canvas);
 const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x030504,.012);
 const spaceSky=spaceBackdrop(scene);const camera=new THREE.PerspectiveCamera(43,1,.1,500);camera.position.set(0,.4,17.1);
 const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.07;controls.target.set(0,-.15,0);controls.minDistance=.85;controls.maxDistance=25;controls.enablePan=true;controls.autoRotate=!reduced.matches;controls.autoRotateSpeed=.35;controls.maxPolarAngle=Math.PI*.91;controls.minPolarAngle=.12;
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.8;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xffeac4,0x10151c,.6));const key=new THREE.DirectionalLight(0xfff4d6,2.3);key.position.set(3,6,5);scene.add(key);const rim=new THREE.DirectionalLight(0xbacfff,1.5);rim.position.set(-5,3,-2);scene.add(rim);const warm=new THREE.PointLight(0xffb84a,12,22,2);warm.position.set(-3,1,4);scene.add(warm);
 const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));const bloom=new UnrealBloomPass(new THREE.Vector2(600,600),.35,.3,2.5);composer.addPass(bloom);composer.addPass(new OutputPass());
 let group=null,items=[],photoMeshes=[],generation=0,currentGift,currentDesign,spread=0,targetSpread=0,quality='auto',automatic=!reduced.matches,frame=0,last=0,lastDraw=0,disposed=false,size='',pointer=null,frames=[],fpsSamples=0,builtMobile=null,lastSpread=-1,starLight=null,sparkles=null,ground=null,garland=null,ornamentCount=0,naturalRoot=null,lightCanopy=null,cameraGoal=null,savedCamera=null,savedTarget=null,burstExpanded=false,pendingPhotos=0,loadingDone=null;
 const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2(),temp=new THREE.Object3D(),targetVector=new THREE.Vector3();
 const ui=document.createElement('div');ui.className='tree-webgl-controls';
 const button=(text,fn)=>{const b=document.createElement('button');b.textContent=text;b.onclick=fn;ui.append(b);return b;};
 const burst=button('散开 · 照片星云',()=>{targetSpread=targetSpread?0:1;if(targetSpread){savedCamera=camera.position.clone();savedTarget=controls.target.clone();controls.target.set(0,0,0);cameraGoal=new THREE.Vector3(0,.2,stage.clientWidth<650?.85:3.6);const wrap=stage.closest('.preview-wrap');if(wrap&&!wrap.classList.contains('full')&&!document.body.classList.contains('gift-reader')){document.querySelector('#gift-full')?.click();burstExpanded=true;}}else{cameraGoal=savedCamera||new THREE.Vector3(0,.4,17.1);controls.target.copy(savedTarget||new THREE.Vector3(0,-.15,0));if(burstExpanded){if(stage.closest('.preview-wrap')?.classList.contains('full'))document.querySelector('#gift-full')?.click();burstExpanded=false;}}controls.autoRotate=automatic&&!targetSpread;burst.textContent=targetSpread?'聚合 · '+({sakura:'樱花树',willow:'垂柳光树'}[currentDesign?.tree]||'圣诞树'):'散开 · 照片星云';});
 button('靠近看看',()=>{cameraGoal=null;camera.position.lerp(controls.target,.25);});button('退远一点',()=>{cameraGoal=null;camera.position.sub(controls.target).multiplyScalar(1.3).add(controls.target);});
 const rotate=button(automatic?'暂停旋转':'继续旋转',()=>{automatic=!automatic;controls.autoRotate=automatic;rotate.textContent=automatic?'暂停旋转':'继续旋转';});
 button('重置视角',()=>{cameraGoal=null;camera.position.set(0,targetSpread?.2:.4,targetSpread?(stage.clientWidth<650?.85:3.6):17.1);controls.target.set(0,targetSpread?0:-.15,0);controls.update();});
 const qualitySelect=document.createElement('select');qualitySelect.setAttribute('aria-label','照片树画质');qualitySelect.innerHTML='<option value="auto">自适应画质</option><option value="low">流畅画质</option><option value="high">精细画质</option>';qualitySelect.onchange=()=>{quality=qualitySelect.value;size='';bloom.enabled=quality!=='low';window.dispatchEvent(new CustomEvent('pgy:design-update',{detail:{isCard:false,patch:{renderQuality:quality}}}));};ui.append(qualitySelect);
 const status=document.createElement('span');status.className='tree-webgl-status';status.textContent='拖动环绕 · 滚轮或双指拉近 · 轻点照片';ui.append(status);stage.append(ui);const guide=document.createElement('p');guide.className='tree-discovery-hint';guide.setAttribute('role','status');stage.append(guide);ui.addEventListener('pointerdown',e=>e.stopPropagation());
 const toggle=button('收起操作',()=>{
  const collapsed=ui.classList.toggle('is-collapsed');
  toggle.textContent=collapsed?'展开操作':'收起操作';
  toggle.setAttribute('aria-expanded',String(!collapsed));
 });
 toggle.type='button';toggle.className='tree-controls-toggle';toggle.setAttribute('aria-expanded','true');
 function releaseGroup(){loadingDone?.();if(!group)return;naturalRoot=null;lightCanopy=null;starLight=null;sparkles=null;ground=null;garland=null;const geometries=new Set(),materials=new Set(),textures=new Set();group.traverse(n=>{if(n.geometry)geometries.add(n.geometry);for(const m of n.material?(Array.isArray(n.material)?n.material:[n.material]):[]){materials.add(m);if(m.map)textures.add(m.map);}});geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());scene.remove(group);group=null;items=[];photoMeshes=[];}
 function assembled(i,count){const t=(i+.5)/count,a=i*2.399963,tree=currentDesign.tree;let y=3.8-t*7.7,r=(.13+t*2.65)*(.84+.16*rand(i+5));if(tree==='sakura'){const p=Math.acos(1-2*t);return new THREE.Vector3(Math.sin(p)*Math.cos(a)*3.3,Math.cos(p)*2.1+1.1,Math.sin(p)*Math.sin(a)*3);}if(tree==='willow'){r=2.9*Math.sin(t*Math.PI*.55);y=3.6-7.4*t*t;}return new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r);}
 function scattered(i){const a=i*2.399963,t=rand(i+13),r=3+rand(i+29)*4.7;return new THREE.Vector3(Math.cos(a)*r,(t-.5)*10,Math.sin(a)*r);}
 function track(object,i,count,scale,instanced,index){const home=assembled(i,count),away=scattered(i);items.push({object,home,away,scale,instanced,index,spin:new THREE.Euler(rand(i+21)*Math.PI,rand(i+7)*Math.PI,rand(i+4)*Math.PI)});return home;}
 let backdrop=null,backdropKey='',backdropGeneration=0;
 function setBackdrop(d){const night=d.tree==='christmas'&&d.background==='midnight'?christmasLooks[d.treeLook]||christmasLooks.gold:null;const nextKey=d.background+(night?':christmas:'+(d.treeLook||'gold'):'');if(backdropKey===nextKey)return;backdropKey=nextKey;const token=++backdropGeneration;const colors={midnight:['#15232e','#030608'],rose:['#78506d','#211c30'],forest:['#456c59','#092527'],paper:['#e9dfc5','#9f957b'],aurora:['#266c64','#16182f'],sunroom:['#ecd7ac','#9b8562'],linen:['#d9c9ad','#a1937a'],sunset:['#a96b62','#2c243d'],botanical:['#c6d0aa','#526e58'],nebula:['#243a5b','#0a1020'],brick:['#c6ac88','#7a6654']};const palette=night?.night||colors[d.background]||colors.midnight;const c=document.createElement('canvas');c.width=1024;c.height=768;const ctx=c.getContext('2d'),gradient=ctx.createRadialGradient(night?512:280,night?430:180,0,560,420,night?640:850);gradient.addColorStop(0,palette[0]);gradient.addColorStop(1,palette[1]);ctx.fillStyle=gradient;ctx.fillRect(0,0,1024,768);for(let i=0;i<160;i++){ctx.fillStyle=i%4?'#eee2bb44':'#fff5df77';ctx.beginPath();ctx.arc(rand(i+500)*1024,rand(i+700)*768,i%13===0?2:.7,0,7);ctx.fill();}if(d.background==='linen'||d.background==='brick'){ctx.strokeStyle='#7b6a4d22';ctx.lineWidth=1;const step=d.background==='linen'?4:70;for(let y=0;y<768;y+=step){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1024,y);ctx.stroke();}for(let x=0;x<1024;x+=d.background==='linen'?5:140){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,768);ctx.stroke();}}
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;backdrop?.dispose();backdrop=texture;scene.background=texture;scene.fog.color.set(palette[1]);canvas.dataset.background=d.background;
 if(d.background==='sunroom')new THREE.TextureLoader().load('./assets/stationery/sunroom-v1.png',texture=>{if(disposed||token!==backdropGeneration){texture.dispose();return;}texture.colorSpace=THREE.SRGBColorSpace;backdrop?.dispose();backdrop=texture;scene.background=texture;});
 }
 // Branches are merged into one draw; blossoms/leaves remain instanced and scatterable.
 function botanicalTree(type,mobile){
  naturalRoot=new THREE.Group();group.add(naturalRoot);const tubes=[],anchors=[];
  const wood=new THREE.MeshStandardMaterial({color:type==='sakura'?0x573e38:0x665136,roughness:.94});
  const tube=(points,radius)=>tubes.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),10,radius,6,false));
  const trunkTop=new THREE.Vector3(.24,.7,0);tube([new THREE.Vector3(0,-4.1,0),new THREE.Vector3(-.25,-2.4,.08),new THREE.Vector3(.12,-.6,0),trunkTop],.19);
  const strands=[];
  for(let i=0;i<9;i++){
   const a=i*2.399963,r=2.0+rand(i+801)*1.1,y=.8+rand(i+920)*1.35;
   const fork=new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r);
   tube([new THREE.Vector3(.1,-1.3+i*.18,0),new THREE.Vector3(Math.cos(a)*r*.35,y-.6,Math.sin(a)*r*.35),fork],.075);
   for(let j=0;j<4;j++){
    const theta=a+(j-1.5)*.37,r2=r+.45+rand(i*13+j+40)*.65;
    const end=new THREE.Vector3(Math.cos(theta)*r2,y+.3+rand(i*7+j+22)*.75,Math.sin(theta)*r2);
    tube([fork,fork.clone().lerp(end,.6).add(new THREE.Vector3(0,.24,0)),end],.025);
    if(type==='willow'){
     const bottom=end.clone().multiply(new THREE.Vector3(1.08,1,1.08));bottom.y=-2.3-rand(i*7+j+600)*1.45;
     const curve=new THREE.CatmullRomCurve3([end,end.clone().add(new THREE.Vector3(Math.cos(theta)*.22,-.9,Math.sin(theta)*.22)),bottom]);
     tubes.push(new THREE.TubeGeometry(curve,18,.012,4,false));strands.push(curve);anchors.push(curve.getPoint(.35+rand(i+j+33)*.4));
    }else anchors.push(end);
   }
  }
  // Merge shared attributes and indices, disposing the temporary tube geometries.
  const positions=[],normals=[],uvs=[],indices=[];let offset=0;
  for(const g of tubes){positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);uvs.push(...g.attributes.uv.array);for(const index of g.index.array)indices.push(index+offset);offset+=g.attributes.position.count;g.dispose();}
  const branches=new THREE.BufferGeometry();branches.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));branches.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));branches.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));branches.setIndex(indices);naturalRoot.add(new THREE.Mesh(branches,wood));
  const total=mobile?900:1500;ornamentCount=total;
  let geometry;
  if(type==='sakura'){
   const shape=new THREE.Shape();for(let i=0;i<=60;i++){const angle=i/60*Math.PI*2,r=.7+.23*Math.cos(angle*5);const x=Math.cos(angle)*r,y=Math.sin(angle)*r;if(!i)shape.moveTo(x,y);else shape.lineTo(x,y);}shape.closePath();
   geometry=new THREE.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:false,steps:1});
  }else{geometry=new THREE.SphereGeometry(1,6,4);geometry.scale(.3,1,.07);}
  const colors=type==='sakura'?[0xf6b7ca,0xffdde5,0xe58aaa]:[0x80a45a,0xaac579,0x527b45];
  const bins=[[],[],[]];for(let i=0;i<total;i++)bins[i%3].push(i);
  bins.forEach((ids,k)=>{
   const mesh=new THREE.InstancedMesh(geometry,new THREE.MeshStandardMaterial({color:colors[k],roughness:.7,side:THREE.DoubleSide,emissive:colors[k],emissiveIntensity:type==='sakura'?.045:.025}),ids.length);mesh.frustumCulled=false;group.add(mesh);
   ids.forEach((i,index)=>{let home;
    if(type==='sakura'){
     const center=anchors[i%anchors.length],phi=Math.acos(1-2*rand(i+141)),angle=i*2.399963,r=Math.cbrt(rand(i+71));
     home=center.clone().add(new THREE.Vector3(Math.sin(phi)*Math.cos(angle)*r*.9,Math.cos(phi)*r*.62,Math.sin(phi)*Math.sin(angle)*r*.9));
    }else{const strand=strands[i%strands.length],t=rand(i+141);home=strand.getPoint(t).add(new THREE.Vector3((rand(i+12)-.5)*.15,0,(rand(i+62)-.5)*.15));}
    const pos=track(mesh,i,total,type==='sakura'?.105+rand(i+54)*.105:.1+rand(i+11)*.07,true,index);pos.copy(home);
    if(type==='willow')items[items.length-1].spin.set(0,i*2.399963,(rand(i+76)-.5)*.5);
   });
  });
  if(type==='sakura'){
   const heart=new THREE.InstancedMesh(new THREE.SphereGeometry(.018,5,3),new THREE.MeshBasicMaterial({color:0xe8c386}),Math.min(450,total));heart.frustumCulled=false;group.add(heart);
   const flowers=items.filter(x=>x.instanced&&x.object.geometry===geometry);
   for(let i=0;i<heart.count;i++){const home=track(heart,i,total,1,true,i);home.copy(flowers[i].home);}
  }
  const soil=new THREE.Mesh(new THREE.CircleGeometry(2.4,40),new THREE.MeshStandardMaterial({color:type==='sakura'?0x514044:0x344d36,roughness:1,transparent:true,opacity:.45}));soil.rotation.x=-Math.PI/2;soil.position.y=-4.12;naturalRoot.add(soil);return anchors;
 }

 function update(next,d){const treeChanged=currentDesign&&currentDesign.tree!==d.tree,previousSpread=spread,previousTarget=targetSpread;setBackdrop(d);spaceSky.update(d.tree==='christmas'&&d.background==='midnight'?{...d,background:'paper'}:d);if(d.renderQuality&&d.renderQuality!==currentDesign?.renderQuality){quality=d.renderQuality;qualitySelect.value=quality;bloom.enabled=quality!=='low';size='';}bloom.strength=.12+d.glow/100*.38;warm.intensity=6+d.glow*.1;const unchanged=currentGift&&currentGift.photos.length===next.photos.length&&currentGift.photos.every((p,i)=>p.src===next.photos[i].src&&p.caption===next.photos[i].caption&&p.name===next.photos[i].name)&&['tree','paper','color','font','photoFrame','ornamentStyle','treeGifts','treeLook'].every(k=>currentDesign[k]===d[k])&&builtMobile===(stage.clientWidth<650);currentGift=next;currentDesign=d;if(unchanged)return;const token=++generation;releaseGroup();loadingDone=window.PagetoyouLoading?.begin(stage,'正在点亮这棵回忆树…');pendingPhotos=next.photos.length;canvas.dataset.tree=d.tree;group=new THREE.Group();scene.add(group);if(treeChanged){if(burstExpanded&&stage.closest('.preview-wrap')?.classList.contains('full'))document.querySelector('#gift-full')?.click();cameraGoal=null;camera.position.set(0,.4,17.1);controls.target.set(0,-.15,0);savedCamera=null;savedTarget=null;controls.autoRotate=automatic;burstExpanded=false;}targetSpread=treeChanged?0:previousTarget;spread=treeChanged?0:previousSpread;burst.textContent=targetSpread?'聚合 · '+({sakura:'樱花树',willow:'垂柳光树'}[d.tree]||'圣诞树'):'散开 · 照片星云';bloom.strength=.1+d.glow/100*.3;
  const mobile=stage.clientWidth<650;builtMobile=mobile;const count=mobile?224:345;ornamentCount=count;lastSpread=-1;let naturalAnchors=[];if(d.tree==='christmas'){const look=christmasLooks[d.treeLook]||christmasLooks.gold;canvas.dataset.treeLook=d.treeLook||'gold';lightCanopy=christmasLights(look,mobile);group.add(lightCanopy);const sphere=new THREE.SphereGeometry(1,mobile?16:20,mobile?12:14),box=new THREE.BoxGeometry(1,1,1);
  const gold=new THREE.MeshPhysicalMaterial({color:look.metal[0],metalness:1,roughness:.2,envMapIntensity:1.2,clearcoat:.65,clearcoatRoughness:.16});
  const red=new THREE.MeshPhysicalMaterial({color:look.metal[1],metalness:.35,roughness:.2,envMapIntensity:1.5,clearcoat:1,clearcoatRoughness:.08});
  const champagne=new THREE.MeshStandardMaterial({color:look.metal[2],metalness:.96,roughness:.2,envMapIntensity:1.15});
  const green=new THREE.MeshStandardMaterial({color:look.metal[3],metalness:.72,roughness:.23,envMapIntensity:1.1});
  const ornamentShape=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.48:1;if(!i)ornamentShape.moveTo(Math.cos(a)*r,Math.sin(a)*r);else ornamentShape.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ornamentShape.closePath();const ornamentStar=new THREE.ExtrudeGeometry(ornamentShape,{depth:.25,bevelEnabled:false});const mats=[gold,red,champagne,green],bins=[[],[],[],[]];for(let i=0;i<count;i++)bins[i%12<7?0:i%12<9?1:i%12<11?2:3].push(i);
  if(d.ornamentStyle!=='mixed')ornamentStar.dispose();bins.forEach((indices,k)=>{const mesh=new THREE.InstancedMesh(d.ornamentStyle==='crystals'?new THREE.OctahedronGeometry(1):d.ornamentStyle==='mixed'&&k===2?ornamentStar:d.ornamentStyle==='mixed'&&k===1?new THREE.IcosahedronGeometry(1,0):sphere,mats[k],indices.length);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;group.add(mesh);indices.forEach((i,j)=>track(mesh,i,count,.043+Math.pow(rand(i+81),2.1)*(.13+.034*i/count),true,j));});
  const cubes=new THREE.InstancedMesh(box,gold,32);cubes.frustumCulled=false;group.add(cubes);for(let i=0;i<cubes.count;i++)track(cubes,(i+.5)/cubes.count*count,count,.045+rand(i+901)*.08,true,i);
  const lampMat=new THREE.MeshStandardMaterial({color:look.lights[3],emissive:look.lights[2],emissiveIntensity:2.8,roughness:.3});const lamps=new THREE.InstancedMesh(sphere,lampMat,mobile?68:100);lamps.frustumCulled=false;group.add(lamps);for(let i=0;i<lamps.count;i++){const it=track(lamps,(i+.5)/lamps.count*count,count,.024+rand(i+401)*.023,true,i);const t=(i+.5)/lamps.count,a=t*Math.PI*16,r=treeRadius(t)*1.06;it.set(Math.cos(a)*r,3.8-t*7.7,Math.sin(a)*r);}
  // One shared mesh for the small metal crowns; no per-ornament draw calls.
  const crowns=new THREE.InstancedMesh(new THREE.CylinderGeometry(.24,.3,.28,8),champagne,count);crowns.frustumCulled=false;group.add(crowns);for(let i=0;i<count;i++){const r=.043+Math.pow(rand(i+81),2.1)*(.13+.034*i/count);const home=track(crowns,i,count,r,true,i);home.y+=r;}
  if(d.tree==='christmas'){const curve=[];for(let i=0;i<=280;i++){const t=i/280,a=t*Math.PI*16,r=treeRadius(t)*1.055;curve.push(new THREE.Vector3(Math.cos(a)*r,3.8-t*7.7,Math.sin(a)*r));}garland=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curve),280,.012,4,false),new THREE.MeshStandardMaterial({color:look.metal[2],emissive:look.lights[1],emissiveIntensity:.45,metalness:.6,roughness:.35,transparent:true,opacity:.7}));group.add(garland);}else garland=null;
  const starShape=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.23:.53,x=Math.cos(a)*r,y=Math.sin(a)*r;if(!i)starShape.moveTo(x,y);else starShape.lineTo(x,y);}starShape.closePath();const star=new THREE.Mesh(new THREE.ExtrudeGeometry(starShape,{depth:.12,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:1,steps:1}),new THREE.MeshStandardMaterial({color:look.lights[3],metalness:.58,roughness:.2,emissive:look.lights[2],emissiveIntensity:.92}));star.position.set(0,4.4,0);group.add(star);
  function glowTexture(cross=false){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,1,64,64,64);g.addColorStop(0,'#ffffff');g.addColorStop(.12,'#fff8edbb');g.addColorStop(.38,'#fff4de33');g.addColorStop(1,'#fff4de00');x.fillStyle=g;x.fillRect(0,0,128,128);if(cross){x.strokeStyle='#fff4caaa';x.lineWidth=1;x.beginPath();x.moveTo(64,17);x.lineTo(64,111);x.moveTo(17,64);x.lineTo(111,64);x.stroke();}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
  starLight=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture(),color:look.lights[3],transparent:true,opacity:.65,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));starLight.position.set(0,4.45,-.12);starLight.scale.set(2.5,2.5,1);group.add(starLight);
  ground=new THREE.Group();
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(8.3,8.3),new THREE.MeshBasicMaterial({map:glowTexture(),color:look.lights[1],transparent:true,opacity:.25,depthWrite:false,blending:THREE.AdditiveBlending}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-4.1;ground.add(floor);
  for(const [r,opacity] of [[2.84,.52],[3.21,.26],[3.59,.12]]){
   const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.011,5,96),new THREE.MeshBasicMaterial({color:look.lights[2],transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));
   ring.rotation.x=-Math.PI/2;ring.position.y=-4.08;ground.add(ring);
  }
  group.add(ground);
  const glitterCount=mobile?82:148,glitterPos=new Float32Array(glitterCount*3);for(let i=0;i<glitterCount;i++){const t=(i+.5)/glitterCount,a=i*2.399963,r=.3+t*3.0;glitterPos.set([Math.cos(a)*r,3.9-t*8,Math.sin(a)*r],i*3);}const glitterGeo=new THREE.BufferGeometry();glitterGeo.setAttribute('position',new THREE.BufferAttribute(glitterPos,3));sparkles=new THREE.Points(glitterGeo,new THREE.PointsMaterial({map:glowTexture(true),color:look.lights[3],size:.19,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));group.add(sparkles);
  if(d.treeGifts!==false){const ribbonMat=new THREE.MeshStandardMaterial({color:0xd8b66e,metalness:.8,roughness:.25});const parcelPart=(geometry,material,ids,offset=new THREE.Vector3())=>{const mesh=new THREE.InstancedMesh(geometry,material,ids.length);mesh.frustumCulled=false;group.add(mesh);ids.forEach((i,index)=>{const home=track(mesh,(i+.5)/8*count,count,1,true,index);const theta=i*2.399963,r=1.8+(i%3)*.58;home.set(Math.sin(theta)*r,-3.87,Math.cos(theta)*r);const item=items.at(-1);item.spin.set(0,theta,0);const delta=offset.clone().applyEuler(item.spin);home.add(delta);item.away.add(delta);});};const ids=Array.from({length:8},(_,i)=>i);for(let k=0;k<2;k++)parcelPart(new THREE.BoxGeometry(.33,.33,.33),new THREE.MeshStandardMaterial({color:look.metal[k?3:1],roughness:.35}),ids.filter(i=>i%2===k));parcelPart(new THREE.BoxGeometry(.35,.065,.35),ribbonMat,ids,new THREE.Vector3(0,.15,0));parcelPart(new THREE.BoxGeometry(.055,.34,.342),ribbonMat,ids);parcelPart(new THREE.BoxGeometry(.342,.34,.055),ribbonMat,ids);}
  }else naturalAnchors=botanicalTree(d.tree,mobile);
  if(mobile){
   for(const item of items){
    const radius=Math.hypot(item.away.x,item.away.z)||1;
    const scale=(9+radius*.55)/radius;item.away.x*=scale;item.away.z*=scale;
   }
  }
  const rows=Math.ceil(next.photos.length/9)||1;
  next.photos.forEach((p,i)=>{const photoGroup=photoArtwork(p,d,{width:.9,resolution:640,index:i,onReady:()=>{if(token===generation)pendingPhotos--;},onError:()=>{if(token===generation){pendingPhotos--;status.textContent='部分照片未能读取，请重新上传原图。';}}});photoMeshes.push(photoGroup.userData.face);group.add(photoGroup);const home=track(photoGroup,(i+.5)/Math.max(1,next.photos.length)*count,count,1,false);if(d.tree==='christmas'){const t=(i+.9)/(next.photos.length+1.8),a=i*2.399963+.5,r=treeRadius(t)*1.08+.08;home.set(Math.cos(a)*r,3.8-t*7.7,Math.sin(a)*r);}else{home.copy(naturalAnchors[i%naturalAnchors.length]);home.y-=.65;home.multiply(new THREE.Vector3(1.03,1,1.03));}const item=items.at(-1);item.photo=true;
   if(mobile){
    const row=i%rows,slot=Math.floor(i/rows),countInRow=Math.ceil((next.photos.length-row)/rows);
    const angle=(slot+(row%2)*.5)/countInRow*Math.PI*2;
    const latitude=(row-(rows-1)/2)*.32;
    item.away.set(Math.sin(angle)*6.4*Math.cos(latitude),6.4*Math.sin(latitude),-Math.cos(angle)*6.4*Math.cos(latitude));
   }
   home.y=Math.min(3.1,home.y);photoGroup.rotation.set(-.04,Math.atan2(home.x,home.z),(rand(i+11)-.5)*.22);photoGroup.userData.homeRotation=photoGroup.quaternion.clone();});
  const dustGeometry=new THREE.BufferGeometry(),pos=new Float32Array(550*3);for(let i=0;i<550;i++){pos[i*3]=(rand(i+3)-.5)*30;pos[i*3+1]=(rand(i+773)-.5)*24;pos[i*3+2]=-7-rand(i+193)*15;}dustGeometry.setAttribute('position',new THREE.BufferAttribute(pos,3));group.add(new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:0xa58d55,size:.025,transparent:true,opacity:.55,depthWrite:false})));
 }
 function photoDialog(photo,origin){const dialog=document.createElement('dialog');dialog.className='cosmos-photo-dialog';dialog.style.fontFamily=stage.style.getPropertyValue('--gift-font');const image=document.createElement('img');image.src=photo.src;image.alt=photo.caption||photo.name;const close=document.createElement('button');close.textContent='关闭照片';close.onclick=()=>dialog.close();const caption=document.createElement('p');caption.textContent=photo.caption??photo.name??'';dialog.append(close,image,caption);dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();if(origin&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const r=image.getBoundingClientRect();image.animate([{transform:'translate('+ (origin.x-r.left-r.width/2)+'px,'+(origin.y-r.top-r.height/2)+'px) scale(.12) rotate(-8deg)',opacity:.3},{transform:'none',opacity:1}],{duration:650,easing:'cubic-bezier(.16,1,.3,1)'});}}
 canvas.addEventListener('wheel',()=>cameraGoal=null,{passive:true});canvas.addEventListener('pointerdown',e=>{cameraGoal=null;e.stopPropagation();pointer={x:e.clientX,y:e.clientY};});canvas.addEventListener('pointerup',e=>{if(!pointer||Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>6)return;const rect=canvas.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(mouse,camera);const hit=raycaster.intersectObjects(photoMeshes)[0];if(hit)photoDialog(hit.object.userData.photo,{x:e.clientX,y:e.clientY});pointer=null;});canvas.addEventListener('pointercancel',()=>pointer=null);
 let lost=false;canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;loadingDone?.();loadingDone=null;status.textContent='图形上下文中断，请切换模板后重试';});
 function draw(t){if(disposed)return;frame=requestAnimationFrame(draw);if(stage.querySelector('.gift-ritual'))return;const rect=stage.getBoundingClientRect();if(lost||document.hidden||!stage.offsetWidth||rect.bottom<0||rect.top>innerHeight){last=t;return;}if(builtMobile!==(stage.clientWidth<650)){const beforeSpread=spread,beforeTarget=targetSpread;update(currentGift,currentDesign);spread=beforeSpread;targetSpread=beforeTarget;lastSpread=-1;burst.textContent=targetSpread?'聚合 · '+({sakura:'樱花树',willow:'垂柳光树'}[currentDesign?.tree]||'圣诞树'):'散开 · 照片星云';}const interval=quality==='low'?32:16;if(t-lastDraw<interval)return;const dt=Math.min(.08,(t-last)/1000||.016);last=t;lastDraw=t;
  const w=stage.clientWidth,h=stage.clientHeight,dpr=quality==='high'?Math.min(devicePixelRatio,2):quality==='low'?1:Math.min(devicePixelRatio,1.6),key=w+':'+h+':'+dpr;if(key!==size){size=key;renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);composer.setPixelRatio(dpr);composer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
  spread=THREE.MathUtils.damp(spread,targetSpread,3.7,dt);
  const fieldOfView=builtMobile?43+spread*23:43;
  if(Math.abs(camera.fov-fieldOfView)>.03){camera.fov=fieldOfView;camera.updateProjectionMatrix();}
  const changed=new Set();const moving=Math.abs(spread-lastSpread)>.00015;for(const item of items){targetVector.lerpVectors(item.home,item.away,spread);if(item.instanced){if(!moving)continue;temp.position.copy(targetVector);temp.rotation.copy(item.spin);temp.scale.setScalar(item.scale);temp.updateMatrix();item.object.setMatrixAt(item.index,temp.matrix);changed.add(item.object);}else{if(item.photo)item.object.scale.setScalar((currentDesign.tree==='christmas'?.69:.65)+(1.3-(currentDesign.tree==='christmas'?.40:.65))*spread);item.object.position.copy(targetVector);if(spread>.2)item.object.quaternion.slerp(camera.quaternion,.08);else if(item.object.userData.homeRotation)item.object.quaternion.slerp(item.object.userData.homeRotation,.12);}}changed.forEach(mesh=>mesh.instanceMatrix.needsUpdate=true);
  if(lightCanopy){const u=lightCanopy.material.uniforms;u.uTime.value=reduced.matches?0:t*.0014;u.uFade.value=(1-spread)**2;u.uScale.value=Math.min(dpr,1.65)*Math.max(.78,Math.min(1.45,h/470));lightCanopy.visible=spread<.95;}
  lastSpread=spread;if(cameraGoal){camera.position.lerp(cameraGoal,reduced.matches?1:1-Math.exp(-dt*4));if(camera.position.distanceTo(cameraGoal)<.01)cameraGoal=null;}if(naturalRoot){naturalRoot.scale.setScalar(Math.max(.001,1-spread));naturalRoot.visible=spread<.98;}if(garland){garland.visible=spread<.98;garland.material.opacity=(1-spread)*.7;}if(ground)ground.visible=spread<.6;if(starLight)starLight.material.opacity=(currentDesign.glow/100)*(1-spread)*(.55+(reduced.matches?0:Math.sin(t*.0012)*.1));if(sparkles){sparkles.visible=spread<.8;sparkles.material.opacity=(1-spread)*(.65+(reduced.matches?0:Math.sin(t*.0016)*.15));}spaceSky.tick(t,reduced.matches);controls.update(dt);renderer.info.autoReset=false;renderer.info.reset();const begin=performance.now();composer.render();const cost=performance.now()-begin;frames.push(cost);if(frames.length>60)frames.shift();if(++fpsSamples%90===0){const average=frames.reduce((n,x)=>n+x,0)/frames.length;if(quality==='auto'&&average>24){bloom.enabled=false;qualitySelect.value='low';quality='low';size='';status.textContent='流畅模式 · 拖动探索，轻点照片';}}
  guide.textContent=targetSpread?'左右 / 上下拖动探索 · 滚轮或双指缩放 · 轻点照片放大':'轻点下方「散开 · 照片星云」，展开藏在树里的回忆';guide.classList.toggle('is-exploring',!!targetSpread);canvas.dataset.photoFrame=currentDesign.photoFrame||'none';canvas.dataset.drawCalls=String(renderer.info.render.calls);canvas.dataset.orbs=String(ornamentCount);canvas.dataset.mode=targetSpread?'cloud':'tree';canvas.dataset.webgl='ready';if(pendingPhotos===0){loadingDone?.();loadingDone=null;}
 }
 update(gift,design);frame=requestAnimationFrame(draw);
 return {stage,update,dispose(){loadingDone?.();disposed=true;cancelAnimationFrame(frame);controls.dispose();releaseGroup();spaceSky.dispose();backdrop?.dispose();environment.dispose();composer.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();ui.remove();guide.remove();},metrics(){return {distance:camera.position.distanceTo(controls.target),spread,tree:currentDesign.tree,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,ornaments:ornamentCount,instanced:items.filter(i=>i.instanced).length,mean:frames.reduce((n,x)=>n+x,0)/Math.max(1,frames.length),photos:photoMeshes.map(mesh=>{const p=mesh.getWorldPosition(new THREE.Vector3()).project(camera);return{x:(p.x+1)/2,y:(1-p.y)/2};})};}};
}
window.PagetoyouTree3D={mount(stage,gift,design){if(active?.stage===stage){active.update(gift,design);return active;}if(active){active.dispose();active=null;}active=make(stage,gift,design);return active;},unmount(){active?.dispose();active=null;},metrics(){return active?.metrics();}};
window.dispatchEvent(new Event('pgy:tree-ready'));


