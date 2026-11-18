const {test}=require('node:test');const assert=require('node:assert/strict');const {validateGift}=require('../backend.cjs');
const design={background:'paper',font:'kai',opening:'cord',paper:'vintage',tree:'christmas',color:'#e7bc61',glow:65,ending:'愿你平安',music:'',envelope:'mulberry',seal:'#ab7650'};
const gift={title:'见字如面',author:'朋友',words:'一封信',photos:[],theme:'forest',zoom:85,transition:'fade',design};
test('material gifts preserve the chosen envelope and seal through validation',()=>{for(const kind of ['leaf','parchment']){const saved=validateGift({...gift,kind});assert.equal(saved.design.envelope,'mulberry');assert.equal(saved.design.seal,'#ab7650');assert.equal(saved.kind,kind);}assert.throws(()=>validateGift({...gift,kind:'leaf',design:{...design,envelope:'../../other'}}),{status:400});assert.throws(()=>validateGift({...gift,kind:'parchment',design:{...design,seal:'url(https://bad)'}}),{status:400});});
test('earlier gifts without envelope metadata remain valid',()=>{const {envelope,seal,...legacy}=design;assert.equal(validateGift({...gift,kind:'words',design:legacy}).design.opening,'cord');assert.equal(validateGift({...gift,kind:'words',design:undefined}).design,undefined);});

test('coordinated stationery survives save validation without accepting arbitrary asset paths',()=>{
  const d={...design,suite:'blue-porcelain',liner:'stripe',stamp:'postmark',recipient:'小林'};
  const saved=validateGift({...gift,kind:'parchment',design:d});
  assert.deepEqual(Object.fromEntries(['suite','liner','stamp','recipient'].map(k=>[k,saved.design[k]])),{suite:'blue-porcelain',liner:'stripe',stamp:'postmark',recipient:'小林'});
  for(const key of ['suite','liner','stamp'])assert.throws(()=>validateGift({...gift,kind:'parchment',design:{...d,[key]:'../../private'}}),{status:400});
  assert.throws(()=>validateGift({...gift,kind:'parchment',design:{...d,recipient:'字'.repeat(31)}}),{status:400});
});

test('optional packaging and independent wax seal survive publication validation',()=>{
 for(const packaging of [true,false]){const saved=validateGift({...gift,kind:'leaf',design:{...design,packaging,sealEnabled:false}});assert.equal(saved.design.packaging,packaging);assert.equal(saved.design.sealEnabled,false);}
 assert.throws(()=>validateGift({...gift,kind:'leaf',design:{...design,packaging:'false'}}),{status:400});
});

test('snow and Christmas ornaments survive validation, including explicit off choices',()=>{
 const framed=validateGift({...gift,kind:'leaf',design:{...design,photoFrame:'silver',snowLevel:'heavy'}});
 assert.equal(framed.design.photoFrame,'silver');assert.equal(framed.design.snowLevel,'heavy');
 for(const invalid of [{photoFrame:'../asset'},{snowLevel:100}])assert.throws(()=>validateGift({...gift,kind:'leaf',design:{...design,...invalid}}),{status:400});
 const tree={...gift,kind:'tree',photos:[{src:'data:image/png;base64,iVBORw0KGgo='}]};
 for(const snow of [true,false])for(const treeGifts of [true,false])for(const ornamentStyle of ['baubles','crystals','mixed']){
  const saved=validateGift({...tree,design:{...design,snow,treeGifts,ornamentStyle}});
  assert.equal(saved.design.snow,snow);assert.equal(saved.design.treeGifts,treeGifts);assert.equal(saved.design.ornamentStyle,ornamentStyle);
 }
 for(const invalid of [{snow:'false'},{treeGifts:1},{ornamentStyle:'unsupported'}])assert.throws(()=>validateGift({...tree,design:{...design,...invalid}}),{status:400});
 const legacy=validateGift(tree);assert.equal(legacy.design.snow,undefined);assert.equal(legacy.design.ornamentStyle,undefined);
});

test('photo scene settings and raster backgrounds are validated',()=>{const src='data:image/png;base64,iVBORw0KGgo=';const saved=validateGift({...gift,kind:'gallery',photos:[{src}],design:{...design,background:'sunroom',backgroundImage:src,backgroundOpacity:80,galleryStyle:'ribbon',photoIntro:'journey'}});assert.equal(saved.design.backgroundImage,src);assert.equal(saved.design.backgroundOpacity,80);assert.throws(()=>validateGift({...gift,kind:'words',design:{...design,backgroundImage:'data:image/svg+xml;base64,PHN2Zz4='}}),{status:400});assert.throws(()=>validateGift({...gift,kind:'words',design:{...design,photoIntro:'bad'}}),{status:400});assert.throws(()=>validateGift({...gift,kind:'words',design:{...design,backgroundOpacity:101}}),{status:400});});
