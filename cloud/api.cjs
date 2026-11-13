const crypto=require('node:crypto');
const {promisify}=require('node:util');
const {validateGift,fail}=require('../gift-validation.cjs');
const scrypt=promisify(crypto.scrypt),hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const refs=gift=>[...new Set([...(Array.isArray(gift.photos)?gift.photos:[]).map(p=>p?.src),gift.design?.backgroundImage,gift.design?.music].filter(v=>typeof v==='string'&&/^\/api\/media\/[a-f0-9]{48}$/.test(v)))];
const userView=u=>({id:u.id,username:u.username,displayName:u.display_name,createdAt:Number(u.created_at)});
const giftView=r=>({id:r.id,title:r.draft_json.title,kind:r.draft_json.kind,status:r.status,revision:r.revision,publishedRevision:r.published_revision,hasUnpublishedChanges:r.published_revision!==null&&r.published_revision!==r.revision,views:r.views,createdAt:Number(r.created_at),updatedAt:Number(r.updated_at),token:r.published_json?r.token:null});

function createCloudHandler({pool,store,origin:configuredOrigin,platform='generic'}){
 const rows=async(q,p=[],db=pool)=>(await db.query(q,p)).rows;
 const one=async(q,p=[],db=pool)=>(await rows(q,p,db))[0];
 async function transaction(fn){const db=await pool.connect();try{await db.query('BEGIN');const result=await fn(db);await db.query('COMMIT');return result;}catch(e){await db.query('ROLLBACK');throw e;}finally{db.release();}}
 async function rate(key,max,window){const now=Date.now(),r=await one('INSERT INTO rate_limits(key,count,reset_at) VALUES($1,1,$2) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.reset_at<=$3 THEN 1 ELSE rate_limits.count+1 END,reset_at=CASE WHEN rate_limits.reset_at<=$3 THEN $2 ELSE rate_limits.reset_at END RETURNING count',[hash(key),now+window,now]);if(r.count>max)throw fail(429,'操作过于频繁，请稍后重试。');}
 async function body(request,max=200000){if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))throw fail(415,'请求应为 JSON。');if(Number(request.headers.get('content-length'))>max)throw fail(413,'内容过大，请减少照片或文字。');const text=await request.text();if(Buffer.byteLength(text)>max)throw fail(413,'内容过大，请减少照片或文字。');try{const parsed=JSON.parse(text);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error();return parsed;}catch{throw fail(400,'请求内容无效。');}}
 const rawToken=request=>/(?:^|;\s*)pgy_session=([a-f0-9]{64})(?:;|$)/.exec(request.headers.get('cookie')||'')?.[1];
 async function user(request,required=true){const token=rawToken(request),r=token&&await one('SELECT u.* FROM users u JOIN sessions s ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>$2',[hash(token),Date.now()]);if(!r&&required)throw fail(401,'登录已过期，请重新登录。');return r||null;}
 async function session(id,remember,secure){const token=crypto.randomBytes(32).toString('hex');await pool.query('INSERT INTO sessions VALUES($1,$2,$3)',[hash(token),id,Date.now()+(remember?604800000:43200000)]);return `pgy_session=${token}; HttpOnly; SameSite=Lax; Path=/${remember?'; Max-Age=604800':''}${secure?'; Secure':''}`;}
 async function checkGift(input,id,db){const paths=refs(input||{});const records=paths.length?await rows('SELECT id,mime FROM media WHERE user_id=$1 AND id=ANY($2::text[])',[id,paths.map(v=>v.slice(11))],db):[];if(records.length!==paths.length)throw fail(400,'部分照片不存在或不属于当前账号，请重新上传。');const assets=new Map(records.map(r=>['/api/media/'+r.id,r]));const gift=validateGift(input,{assets});if(gift.photos.some(p=>p.src.startsWith('data:'))||gift.design?.backgroundImage?.startsWith('data:')||gift.design?.music?.startsWith('data:'))throw fail(400,'请先上传照片、背景和音乐再保存。');return gift;}
 async function linkMedia(id,gift,kind,db){await db.query('DELETE FROM gift_media WHERE gift_id=$1 AND kind=$2',[id,kind]);for(const src of refs(gift))await db.query('INSERT INTO gift_media VALUES($1,$2,$3)',[id,src.slice(11),kind]);}
 return async function handle(request,context={}){
  const origin=configuredOrigin||new URL(request.url).origin,secure=origin.startsWith('https:'),url=new URL(request.url),path=url.pathname,method=request.method;
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
  const send=(value,status=200,cookie)=>new Response(JSON.stringify(value),{status,headers:{...headers,'Content-Type':'application/json;charset=utf-8',...(cookie?{'Set-Cookie':cookie}:{})}});
  try{
   if(!['GET','POST','PUT','DELETE'].includes(method))throw fail(405,'不支持此操作。');
   if(method!=='GET'&&(request.headers.get('x-pgy-request')!=='1'||(request.headers.get('origin')&&request.headers.get('origin')!==origin)))throw fail(403,'请求验证失败。');
   if(path==='/api/meta'&&method==='GET')return send({available:true,public:secure,origin,storage:'remote',platform});
   const ip=context.ip||'unknown';
   if(['/api/auth/register','/api/auth/login'].includes(path)&&method==='POST'){
    await rate('auth:'+ip,40,900000);const input=await body(request,4096),username=typeof input.username==='string'?input.username.trim().toLowerCase():'';
    if(!/^[a-z0-9_]{3,32}$/.test(username)||typeof input.password!=='string'||input.password.length<8||input.password.length>128)throw fail(400,'账号需为 3–32 位字母、数字或下划线，密码需为 8–128 位。');
    let account;
    if(path.endsWith('register')){
     await rate('register:'+ip,10,3600000);const name=typeof input.displayName==='string'?input.displayName.trim():'';if(!name||name.length>30)throw fail(400,'昵称需为 1–30 个字符。');
     const salt=crypto.randomBytes(16).toString('hex'),password=(await scrypt(input.password,salt,64)).toString('hex');
     try{account=await one('INSERT INTO users VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[crypto.randomUUID(),username,name,salt,password,Date.now()]);}catch(e){if(e.code==='23505')throw fail(409,'此账号已被使用。');throw e;}
    }else{await rate('login-user:'+username,16,900000);account=await one('SELECT * FROM users WHERE username=$1',[username]);const candidate=await scrypt(input.password,account?.salt||'pagetoyou-missing-account',64);if(!account||!crypto.timingSafeEqual(candidate,Buffer.from(account.password_hash,'hex')))throw fail(401,'账号或密码不正确。');}
    return send({user:userView(account)},path.endsWith('register')?201:200,await session(account.id,input.remember!==false,secure));
   }
   if(path==='/api/auth/me'&&method==='GET')return send({user:userView(await user(request))});
   if(path==='/api/auth/logout'&&method==='POST'){const token=rawToken(request);if(token)await pool.query('DELETE FROM sessions WHERE token_hash=$1',[hash(token)]);return send({ok:true},200,`pgy_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure?'; Secure':''}`);}
   const pub=/^\/api\/public\/([a-f0-9]{48})$/.exec(path);
   if(pub&&method==='GET'){const r=await one("UPDATE gifts SET views=views+1 WHERE token=$1 AND status='published' RETURNING published_json",[pub[1]]);if(!r)throw fail(404,'这份礼物不存在，或已停止分享。');return send({gift:r.published_json});}
   const asset=/^\/api\/media\/([a-f0-9]{48})$/.exec(path);
   if(asset&&method==='GET'){
    const account=await user(request,false);const r=await one("SELECT m.* FROM media m WHERE m.id=$1 AND (m.user_id=$2 OR EXISTS(SELECT 1 FROM gift_media gm JOIN gifts g ON gm.gift_id=g.id WHERE gm.media_id=m.id AND gm.kind='published' AND g.status='published'))",[asset[1],account?.id||'']);
    if(!r)throw fail(404,'文件不存在或尚未公开。');const bytes=await store.get(r.id);if(!bytes)throw fail(404,'文件暂不可用。');return new Response(bytes,{headers:{...headers,'Content-Type':r.mime,'Content-Disposition':'inline'}});
   }
   if(path==='/api/auth/recover'&&method==='POST'){
    await rate('recover-ip:'+ip,12,3600000);const input=await body(request,4096),username=typeof input.username==='string'?input.username.trim().toLowerCase():'';
    if(!/^[a-z0-9_]{3,32}$/.test(username)||typeof input.recoveryCode!=='string'||input.recoveryCode.length>80)throw fail(400,'账号或恢复码不正确，或恢复码已失效。');await rate('recover-user:'+username,6,3600000);
    if(typeof input.newPassword!=='string'||input.newPassword.length<8||input.newPassword.length>128)throw fail(400,'密码需为 8–128 位。');const salt=crypto.randomBytes(16).toString('hex'),password=(await scrypt(input.newPassword,salt,64)).toString('hex'),code=hash(username+'|'+input.recoveryCode.replace(/[-\s]/g,'').toLowerCase());
    await transaction(async db=>{const account=await one('SELECT * FROM users WHERE username=$1 FOR UPDATE',[username],db);const r=account&&await one('DELETE FROM recovery_codes WHERE code_hash=$1 AND user_id=$2 AND expires_at>$3 RETURNING code_hash',[code,account.id,Date.now()],db);if(!r)throw fail(400,'账号或恢复码不正确，或恢复码已失效。');await db.query('UPDATE users SET salt=$1,password_hash=$2 WHERE id=$3',[salt,password,account.id]);await db.query('DELETE FROM sessions WHERE user_id=$1',[account.id]);await db.query('DELETE FROM recovery_codes WHERE user_id=$1',[account.id]);});return send({ok:true});
   }
   const account=await user(request);
   if(path==='/api/uploads'&&method==='POST'){
    await rate('uploads:'+account.id,100,60000);const input=await body(request,3100000);if(typeof input.data!=='string'||input.data.length>3000000)throw fail(400,'文件过大。');const m=/^data:(image\/(?:jpeg|png|webp)|audio\/(?:mpeg|wav|ogg));base64,([A-Za-z0-9+/]+={0,2})$/.exec(input.data);if(!m)throw fail(400,'不支持的文件格式。');
    const bytes=Buffer.from(m[2],'base64');if(!bytes.length)throw fail(400,'文件内容无效。');if(m[1].startsWith('image/'))validateGift({kind:'gallery',title:'upload',author:'',words:'',photos:[{src:input.data}]});else{const valid=m[1]==='audio/wav'?bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WAVE':m[1]==='audio/ogg'?bytes.toString('ascii',0,4)==='OggS':bytes.toString('ascii',0,3)==='ID3'||bytes[0]===255&&(bytes[1]&224)===224;if(!valid)throw fail(400,'音频内容无效。');}
    const id=crypto.randomBytes(24).toString('hex');await transaction(async db=>{await db.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[account.id]);const r=await one('SELECT COALESCE(SUM(size),0) AS size,COUNT(*) AS count FROM media WHERE user_id=$1',[account.id],db);if(Number(r.size)+bytes.length>100*1024*1024||Number(r.count)>=500)throw fail(400,'测试期每个账号最多 100 MB / 500 个文件。');await db.query('INSERT INTO media VALUES($1,$2,$3,$4,$5)',[id,account.id,m[1],bytes.length,Date.now()]);});
    try{await store.set(id,bytes);}catch(e){await pool.query('DELETE FROM media WHERE id=$1',[id]);throw e;}return send({url:'/api/media/'+id},201);
   }
   if(path==='/api/profile'&&method==='PUT'){const input=await body(request,4096);if(typeof input.displayName!=='string'||!input.displayName.trim()||input.displayName.trim().length>30)throw fail(400,'昵称需为 1–30 个字符。');const r=await one('UPDATE users SET display_name=$1 WHERE id=$2 RETURNING *',[input.displayName.trim(),account.id]);return send({user:userView(r)});}
   if(['/api/auth/password','/api/auth/recovery-codes'].includes(path)&&method==='POST'){
    await rate('password:'+account.id,10,900000);const input=await body(request,4096),current=input.currentPassword??input.password;if(typeof current!=='string'||current.length>128||!crypto.timingSafeEqual(await scrypt(current,account.salt,64),Buffer.from(account.password_hash,'hex')))throw fail(400,'当前密码不正确。');
    if(path.endsWith('recovery-codes')){const codes=Array.from({length:10},()=>crypto.randomBytes(12).toString('hex').match(/.{6}/g).join('-')),expiresAt=Date.now()+365*86400000;await transaction(async db=>{const latest=await one('SELECT password_hash FROM users WHERE id=$1 FOR UPDATE',[account.id],db);if(latest.password_hash!==account.password_hash)throw fail(409,'账号状态已改变，请重新登录。');await db.query('DELETE FROM recovery_codes WHERE user_id=$1',[account.id]);for(const code of codes)await db.query('INSERT INTO recovery_codes VALUES($1,$2,$3)',[hash(account.username+'|'+code.replace(/-/g,'')),account.id,expiresAt]);});return send({codes,expiresAt});}
    if(typeof input.newPassword!=='string'||input.newPassword.length<8||input.newPassword.length>128)throw fail(400,'密码需为 8–128 位。');const salt=crypto.randomBytes(16).toString('hex'),password=(await scrypt(input.newPassword,salt,64)).toString('hex');await transaction(async db=>{const r=await one('UPDATE users SET salt=$1,password_hash=$2 WHERE id=$3 AND password_hash=$4 RETURNING id',[salt,password,account.id,account.password_hash],db);if(!r)throw fail(409,'账号状态已改变，请重新登录。');await db.query('DELETE FROM sessions WHERE user_id=$1',[account.id]);await db.query('DELETE FROM recovery_codes WHERE user_id=$1',[account.id]);});return send({ok:true},200,await session(account.id,true,secure));
   }
   if(path==='/api/gifts'&&method==='GET')return send({gifts:(await rows('SELECT * FROM gifts WHERE user_id=$1 ORDER BY updated_at DESC',[account.id])).map(giftView)});
   if(path==='/api/gifts'&&method==='POST'){
    await rate('save:'+account.id,120,60000);const input=await body(request),gift=await checkGift(input.gift,account.id),id=crypto.randomUUID(),token=crypto.randomBytes(24).toString('hex'),now=Date.now();const r=await transaction(async db=>{await db.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[account.id]);const count=await one('SELECT COUNT(*) AS n FROM gifts WHERE user_id=$1',[account.id],db);if(Number(count.n)>=50)throw fail(400,'测试期每个账号最多 50 份礼物。');const r=await one('INSERT INTO gifts(id,user_id,token,draft_json,created_at,updated_at) VALUES($1,$2,$3,$4::jsonb,$5,$5) RETURNING *',[id,account.id,token,JSON.stringify(gift),now],db);await linkMedia(id,gift,'draft',db);return r;});return send({gift:giftView(r)},201);
   }
   const match=/^\/api\/gifts\/([a-f0-9-]{36})(?:\/(publish|stop))?$/.exec(path);
   if(match){
    if(method==='PUT')await rate('save:'+account.id,120,60000);
    const action=match[2],input=['PUT','POST'].includes(method)?await body(request):null;
    const result=await transaction(async db=>{const r=await one('SELECT * FROM gifts WHERE id=$1 AND user_id=$2 FOR UPDATE',[match[1],account.id],db);if(!r)throw fail(404,'礼物不存在或你无权管理。');
     if(!action&&method==='GET')return {gift:giftView(r),content:r.draft_json};
     if(!action&&method==='DELETE'){await db.query('DELETE FROM gifts WHERE id=$1',[r.id]);return {ok:true};}
     if(!action&&method==='PUT'){if(input.revision!==r.revision)throw fail(409,'草稿已改变，请从个人中心重新打开。');const gift=await checkGift(input.gift,account.id,db),updated=await one('UPDATE gifts SET draft_json=$1::jsonb,revision=revision+1,updated_at=$2 WHERE id=$3 RETURNING *',[JSON.stringify(gift),Date.now(),r.id],db);await linkMedia(r.id,gift,'draft',db);return {gift:giftView(updated)};}
     if(action==='publish'&&method==='POST'){if(input.revision!==r.revision)throw fail(409,'草稿已改变，请保存后重新发布。');const updated=await one("UPDATE gifts SET published_json=draft_json,published_revision=revision,status='published',updated_at=$1 WHERE id=$2 RETURNING *",[Date.now(),r.id],db);await linkMedia(r.id,r.draft_json,'published',db);return {gift:giftView(updated),url:origin+'/g/'+r.token};}
     if(action==='stop'&&method==='POST'){const updated=await one("UPDATE gifts SET status='stopped',updated_at=$1 WHERE id=$2 RETURNING *",[Date.now(),r.id],db);return {gift:giftView(updated)};}throw fail(405,'不支持此操作。');});return send(result);
   }
   throw fail(404,'接口不存在。');
  }catch(e){if(!e.status)console.error('cloud-api error',e.code||e.name);return send({error:e.status?e.message:'服务暂时不可用，请稍后重试。'},e.status||503);}
 };
}
module.exports={createCloudHandler};
