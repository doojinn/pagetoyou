const {validateBook}=require('./book-validation.cjs');
const kinds = new Set(['card', 'gallery', 'tree', 'slideshow', 'album', 'photo3d', 'words', 'verse', 'cake', 'chat', 'leaf', 'parchment']);
const MAX_AUDIO_BYTES=10*1024*1024;
const MAX_AUDIO_DATA=4*Math.ceil(MAX_AUDIO_BYTES/3)+32;
const fail = (status, message) => Object.assign(new Error(message), { status });

function validateGift(input, options={}) {
  const media=(src,type)=>{const record=options.assets?.get(src);return record&&record.mime.startsWith(type+'/');};
  if (!input || typeof input !== 'object' || !kinds.has(input.kind)) throw fail(400, '请选择有效的礼物模板。');
  const str = (value, max) => { if (typeof value !== 'string' || value.length > max) throw fail(400, '文字内容超出限制。'); return value; };
  const gift = { kind: input.kind, title: str(input.title, 40).trim(), author: str(input.author, 30), words: str(input.words, 2000), photos: [], theme: input.theme || 'forest', zoom: Number(input.zoom) || 85, transition: input.transition || 'fade' };
  if (!gift.title) throw fail(400, '请填写礼物标题。');
  if (!['forest', 'rose', 'ink'].includes(gift.theme) || !['fade', 'slide', 'zoom'].includes(gift.transition) || gift.zoom < 50 || gift.zoom > 125) throw fail(400, '模板设置无效。');
  if (!Array.isArray(input.photos) || input.photos.length > 30) throw fail(400, '照片最多 30 张。');
  const photoIds=new Set();gift.photos = input.photos.map(photo => {const identity={};if(photo?.id!==undefined){if(typeof photo.id!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(photo.id)||photoIds.has(photo.id))throw fail(400,'照片编号无效或重复。');photoIds.add(photo.id);identity.id=photo.id;}
    if (!photo || typeof photo.src !== 'string' || photo.src.length > 3_000_000) throw fail(400, '照片过大，请重新压缩。');
    if(media(photo.src,'image'))return {...identity,src:photo.src,name:str(photo.name||'',100),caption:str(photo.caption||'',100)};
    const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(photo.src);
    if (!match) throw fail(400, '照片格式无效。');
    const bytes = Buffer.from(match[2], 'base64');
    const valid = match[1] === 'jpeg' ? bytes[0] === 255 && bytes[1] === 216 : match[1] === 'png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    if (!valid) throw fail(400, '照片内容无效。');
    return { ...identity,src: photo.src, name: str(photo.name || '', 100), caption: str(photo.caption || '', 100) };
  });
  if (input.kind === 'card') {
    if(gift.photos.length>3)throw fail(400,'贺卡最多支持 3 张照片。');
    if (!input.card || !Array.isArray(input.card.elements) || input.card.elements.length > 30) throw fail(400, '贺卡布局无效。');
    gift.card = { mode: input.card.mode === 'template' ? 'template' : 'free', elements: input.card.elements.map((e, i) => {
      if (!e || !['text', 'photo', 'decor'].includes(e.type)) throw fail(400, '贺卡元素无效。');
      for (const key of ['x', 'y', 'size', 'angle']) if (!Number.isFinite(e[key])) throw fail(400, '元素坐标无效。');
      if (e.x < 0 || e.x > 100 || e.y < 0 || e.y > 100 || e.size < 1 || e.size > 100 || Math.abs(e.angle) > 360 || !['ink', 'rose', 'olive'].includes(e.color)) throw fail(400, '元素设置无效。');
      return { id: i + 1, type: e.type, name: str(e.name || '', 40), content: str(e.content || '', 2000), x: e.x, y: e.y, size: e.size, angle: e.angle, color: e.color };
    }) };
    if(input.card.pages!==undefined){
      if(!Array.isArray(input.card.pages)||input.card.pages.length>5)throw fail(400,'贺卡最多添加 5 页信纸。');
      gift.card.pages=input.card.pages.map(page=>{
        if(!page||typeof page!=='object')throw fail(400,'贺卡信纸无效。');
        const style=page.style??'inherit';
        if(!['inherit','olive','rose-garden','blue-porcelain','ribbon-stripe','midnight-gold','pressed-flower'].includes(style))throw fail(400,'贺卡信纸样式无效。');
        return {title:str(page.title,80),body:str(page.body,2000),sign:str(page.sign,80),style};
      });
    }
    if(input.card.pageMotion!==undefined){
      if(!['turn','rise','fade'].includes(input.card.pageMotion))throw fail(400,'翻页效果无效。');
      gift.card.pageMotion=input.card.pageMotion;
    }
  }
  if ((['tree', 'gallery', 'slideshow', 'photo3d', 'chat'].includes(gift.kind)||gift.kind==='album'&&!input.book) && !gift.photos.length) throw fail(400, '此模板至少需要一张照片。');
  if (['words','verse'].includes(gift.kind) && !gift.words.trim()) throw fail(400, '请填写祝福文字。');
  if(input.design){
    const d=input.design;const allowed={background:['midnight','rose','forest','paper','aurora','sunroom','linen','sunset','botanical','nebula','brick','galaxy','saturn','deepblue'],font:['serif','sans','kai','elegant','brush','hand','literary'],opening:['wax','cord','ribbon'],paper:['cream','vintage','botanical','noir'],tree:['christmas','sakura','willow']};
    gift.design={};for(const [key,values] of Object.entries(allowed)){if(!values.includes(d[key]))throw fail(400,'礼物样式无效。');gift.design[key]=d[key];}
    if(typeof d.color!=='string'||!/^#[0-9a-fA-F]{6}$/.test(d.color)||!Number.isFinite(d.glow)||d.glow<0||d.glow>100)throw fail(400,'光效参数无效。');
    if(d.envelope!==undefined){if(!['ivory','blue','sage','rose','meadow','hydrangea','parchment','mulberry','baroque','love','linen','blush'].includes(d.envelope))throw fail(400,'信封款式无效。');gift.design.envelope=d.envelope;}
    for(const [key,values] of Object.entries({suite:['olive','rose-garden','blue-porcelain','ribbon-stripe','midnight-gold','pressed-flower'],liner:['matching','plain','stripe'],stamp:['botanical','postmark','none']})){if(d[key]!==undefined){if(!values.includes(d[key]))throw fail(400,'信笺套系设置无效。');gift.design[key]=d[key];}}
    for(const key of ['packaging','sealEnabled','snow','treeGifts','cakePhotos'])if(d[key]!==undefined){if(typeof d[key]!=='boolean')throw fail(400,'封装设置无效。');gift.design[key]=d[key];}
    for(const key of ['letterTitle','letterBody','letterSign'])if(d[key]!==undefined)gift.design[key]=str(d[key],key==='letterBody'?2000:80);
    if(d.recipient!==undefined)gift.design.recipient=str(d.recipient,30).trim();
    if(d.seal!==undefined){if(typeof d.seal!=='string'||!/^#[0-9a-fA-F]{6}$/.test(d.seal))throw fail(400,'火漆颜色无效。');gift.design.seal=d.seal;}
    for(const [key,values] of Object.entries({snowLevel:['gentle','normal','heavy'],photoFrame:['none','walnut','silver','polaroid','museum','float','film','deckle','arch','postcard'],cakeStyle:['sapphire','rose','champagne'],renderQuality:['auto','low','high'],treeLook:['gold','rose','aurora'],ornamentStyle:['baubles','crystals','mixed'],sealStyle:['rose','pearl','crimson','sage','violet','gold'],galleryStyle:['wall','ribbon','scrapbook'],photoIntro:['journey','tunnel','explore']})){if(d[key]!==undefined){if(!values.includes(d[key]))throw fail(400,'照片场景样式无效。');gift.design[key]=d[key];}}
    if(d.backgroundOpacity!==undefined){if(!Number.isFinite(d.backgroundOpacity)||d.backgroundOpacity<20||d.backgroundOpacity>100)throw fail(400,'背景可见度无效。');gift.design.backgroundOpacity=d.backgroundOpacity;}
    if(d.backgroundImage){const checked=validateGift({kind:'gallery',title:'background',author:'',words:'',photos:[{src:d.backgroundImage,name:'',caption:''}]},options);gift.design.backgroundImage=checked.photos[0].src;}
    gift.design.color=d.color;gift.design.glow=d.glow;gift.design.ending=str(d.ending,300);gift.design.music='';
    if(d.music){
      const data=typeof d.music==='string'&&d.music.length<=MAX_AUDIO_DATA&&/^data:audio\/(mpeg|wav|ogg|mp4);base64,([A-Za-z0-9+/]+={0,2})$/.exec(d.music);
      if(!media(d.music,'audio')&&(!data||Buffer.from(data[2],'base64').length>MAX_AUDIO_BYTES))throw fail(400,'音乐格式无效或超过 10 MB。');
      gift.design.music=d.music;
    }
  }
  if(input.book!==undefined){if(input.kind!=='album')throw fail(400,'此模板不支持照片书设计。');gift.book=validateBook(input.book,gift.photos);}
  return gift;
}

module.exports={validateGift,fail,MAX_AUDIO_BYTES,MAX_AUDIO_DATA};
