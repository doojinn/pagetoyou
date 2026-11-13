const kinds = new Set(['card', 'gallery', 'tree', 'slideshow', 'album', 'photo3d', 'words', 'cake', 'chat', 'leaf', 'parchment']);
const fail = (status, message) => Object.assign(new Error(message), { status });

function validateGift(input, options={}) {
  const media=(src,type)=>{const record=options.assets?.get(src);return record&&record.mime.startsWith(type+'/');};
  if (!input || typeof input !== 'object' || !kinds.has(input.kind)) throw fail(400, '请选择有效的礼物模板。');
  const str = (value, max) => { if (typeof value !== 'string' || value.length > max) throw fail(400, '文字内容超出限制。'); return value; };
  const gift = { kind: input.kind, title: str(input.title, 40).trim(), author: str(input.author, 30), words: str(input.words, 2000), photos: [], theme: input.theme || 'forest', zoom: Number(input.zoom) || 85, transition: input.transition || 'fade' };
  if (!gift.title) throw fail(400, '请填写礼物标题。');
  if (!['forest', 'rose', 'ink'].includes(gift.theme) || !['fade', 'slide', 'zoom'].includes(gift.transition) || gift.zoom < 50 || gift.zoom > 125) throw fail(400, '模板设置无效。');
  if (!Array.isArray(input.photos) || input.photos.length > 30) throw fail(400, '照片最多 30 张。');
  gift.photos = input.photos.map(photo => {
    if (!photo || typeof photo.src !== 'string' || photo.src.length > 3_000_000) throw fail(400, '照片过大，请重新压缩。');
    if(media(photo.src,'image'))return {src:photo.src,name:str(photo.name||'',100),caption:str(photo.caption||'',100)};
    const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(photo.src);
    if (!match) throw fail(400, '照片格式无效。');
    const bytes = Buffer.from(match[2], 'base64');
    const valid = match[1] === 'jpeg' ? bytes[0] === 255 && bytes[1] === 216 : match[1] === 'png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    if (!valid) throw fail(400, '照片内容无效。');
    return { src: photo.src, name: str(photo.name || '', 100), caption: str(photo.caption || '', 100) };
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
  }
  if (['tree', 'gallery', 'slideshow', 'album', 'photo3d', 'chat'].includes(gift.kind) && !gift.photos.length) throw fail(400, '此模板至少需要一张照片。');
  if (gift.kind === 'words' && !gift.words.trim()) throw fail(400, '请填写祝福文字。');
  if(input.design){
    const d=input.design;const allowed={background:['midnight','rose','forest','paper','aurora','sunroom','linen','sunset','botanical','nebula','brick'],font:['serif','sans','kai','elegant'],opening:['wax','cord','ribbon'],paper:['cream','vintage','botanical','noir'],tree:['christmas','sakura','willow']};
    gift.design={};for(const [key,values] of Object.entries(allowed)){if(!values.includes(d[key]))throw fail(400,'礼物样式无效。');gift.design[key]=d[key];}
    if(typeof d.color!=='string'||!/^#[0-9a-fA-F]{6}$/.test(d.color)||!Number.isFinite(d.glow)||d.glow<0||d.glow>100)throw fail(400,'光效参数无效。');
    if(d.envelope!==undefined){if(!['ivory','blue','sage','rose','meadow','hydrangea','parchment','mulberry','baroque','love','linen','blush'].includes(d.envelope))throw fail(400,'信封款式无效。');gift.design.envelope=d.envelope;}
    if(d.seal!==undefined){if(typeof d.seal!=='string'||!/^#[0-9a-fA-F]{6}$/.test(d.seal))throw fail(400,'火漆颜色无效。');gift.design.seal=d.seal;}
    for(const [key,values] of Object.entries({sealStyle:['rose','pearl','crimson','sage','violet','gold'],galleryStyle:['wall','ribbon','scrapbook'],photoIntro:['journey','explore']})){if(d[key]!==undefined){if(!values.includes(d[key]))throw fail(400,'照片场景样式无效。');gift.design[key]=d[key];}}
    if(d.backgroundOpacity!==undefined){if(!Number.isFinite(d.backgroundOpacity)||d.backgroundOpacity<20||d.backgroundOpacity>100)throw fail(400,'背景可见度无效。');gift.design.backgroundOpacity=d.backgroundOpacity;}
    if(d.backgroundImage){const checked=validateGift({kind:'gallery',title:'background',author:'',words:'',photos:[{src:d.backgroundImage,name:'',caption:''}]},options);gift.design.backgroundImage=checked.photos[0].src;}
    gift.design.color=d.color;gift.design.glow=d.glow;gift.design.ending=str(d.ending,300);gift.design.music='';
    if(d.music){if(typeof d.music!=='string'||d.music.length>2900000||(!media(d.music,'audio')&&!/^data:audio\/(mpeg|wav|ogg);base64,[A-Za-z0-9+/]+=*$/.test(d.music)))throw fail(400,'音乐格式无效或超过限制。');gift.design.music=d.music;}
  }
  return gift;
}

module.exports={validateGift,fail};
