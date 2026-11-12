const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const { DatabaseSync } = require('node:sqlite');
const scrypt = promisify(crypto.scrypt);
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const kinds = new Set(['card', 'gallery', 'tree', 'slideshow', 'album', 'photo3d', 'words', 'cake', 'chat', 'leaf', 'parchment']);
const fail = (status, message) => Object.assign(new Error(message), { status });

function validateGift(input) {
  if (!input || typeof input !== 'object' || !kinds.has(input.kind)) throw fail(400, '请选择有效的礼物模板。');
  const str = (value, max) => { if (typeof value !== 'string' || value.length > max) throw fail(400, '文字内容超出限制。'); return value; };
  const gift = { kind: input.kind, title: str(input.title, 40).trim(), author: str(input.author, 30), words: str(input.words, 2000), photos: [], theme: input.theme || 'forest', zoom: Number(input.zoom) || 85, transition: input.transition || 'fade' };
  if (!gift.title) throw fail(400, '请填写礼物标题。');
  if (!['forest', 'rose', 'ink'].includes(gift.theme) || !['fade', 'slide', 'zoom'].includes(gift.transition) || gift.zoom < 50 || gift.zoom > 125) throw fail(400, '模板设置无效。');
  if (!Array.isArray(input.photos) || input.photos.length > 30) throw fail(400, '照片最多 30 张。');
  gift.photos = input.photos.map(photo => {
    if (!photo || typeof photo.src !== 'string' || photo.src.length > 3_000_000) throw fail(400, '照片过大，请重新压缩。');
    const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(photo.src);
    if (!match) throw fail(400, '照片格式无效。');
    const bytes = Buffer.from(match[2], 'base64');
    const valid = match[1] === 'jpeg' ? bytes[0] === 255 && bytes[1] === 216 : match[1] === 'png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    if (!valid) throw fail(400, '照片内容无效。');
    return { src: photo.src, name: str(photo.name || '', 100), caption: str(photo.caption || '', 100) };
  });
  if (input.kind === 'card') {
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
    const d=input.design;const allowed={background:['midnight','rose','forest','paper','aurora'],font:['serif','sans','kai','elegant'],opening:['wax','cord','ribbon'],paper:['cream','vintage','botanical','noir'],tree:['christmas','sakura','willow']};
    gift.design={};for(const [key,values] of Object.entries(allowed)){if(!values.includes(d[key]))throw fail(400,'礼物样式无效。');gift.design[key]=d[key];}
    if(typeof d.color!=='string'||!/^#[0-9a-fA-F]{6}$/.test(d.color)||!Number.isFinite(d.glow)||d.glow<0||d.glow>100)throw fail(400,'光效参数无效。');
    if(d.envelope!==undefined){if(!['ivory','blue','sage','rose','meadow','hydrangea','parchment','mulberry','baroque','love','linen','blush'].includes(d.envelope))throw fail(400,'信封款式无效。');gift.design.envelope=d.envelope;}
    if(d.seal!==undefined){if(typeof d.seal!=='string'||!/^#[0-9a-fA-F]{6}$/.test(d.seal))throw fail(400,'火漆颜色无效。');gift.design.seal=d.seal;}
    gift.design.color=d.color;gift.design.glow=d.glow;gift.design.ending=str(d.ending,300);gift.design.music='';
    if(d.music){if(typeof d.music!=='string'||d.music.length>2900000||!/^data:audio\/(mpeg|wav|ogg);base64,[A-Za-z0-9+/]+=*$/.test(d.music))throw fail(400,'音乐格式无效或超过限制。');gift.design.music=d.music;}
  }
  return gift;
}

function createApp(options = {}) {
  const dataDir = options.dataDir || process.env.DATA_DIR || path.join(__dirname, '.data');
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, 'pagetoyou.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, display_name TEXT NOT NULL, salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS gifts(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), token TEXT UNIQUE NOT NULL, draft_json TEXT NOT NULL, published_json TEXT, status TEXT NOT NULL DEFAULT 'draft', revision INTEGER NOT NULL DEFAULT 1, published_revision INTEGER, views INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS gifts_owner ON gifts(user_id, updated_at);
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);`);
  const configuredOrigin = options.publicOrigin || process.env.PUBLIC_ORIGIN || '';
  if (configuredOrigin && (!/^https?:\/\//.test(configuredOrigin) || new URL(configuredOrigin).origin !== configuredOrigin)) throw Error('PUBLIC_ORIGIN must be an origin without a trailing slash');
  const rates = new Map();
  const janitor = setInterval(() => { for (const [key, value] of rates) if (Date.now() > value.until) rates.delete(key); db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now()); }, 60000).unref();
  function rate(key, max, ms) { let r = rates.get(key); if (!r || Date.now() > r.until) { r = { n: 0, until: Date.now() + ms }; rates.set(key, r); } if (++r.n > max) throw fail(429, '尝试过于频繁，请稍后再试。'); }
  const publicUser = row => ({ id: row.id, username: row.username, displayName: row.display_name, createdAt: row.created_at });
  const safe = row => { const gift = JSON.parse(row.draft_json); return { id: row.id, title: gift.title, kind: gift.kind, status: row.status, revision: row.revision, publishedRevision: row.published_revision, hasUnpublishedChanges: row.published_revision !== null && row.revision !== row.published_revision, views: row.views, createdAt: row.created_at, updatedAt: row.updated_at, token: row.published_json ? row.token : null }; };
  function origin(req) { return configuredOrigin || `http://127.0.0.1:${server.address().port}`; }
  function send(res, status, value) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); }
  function user(req) { const raw = /(?:^|;\s*)pgy_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || ''); if (!raw) throw fail(401, '请先登录。'); const row = db.prepare('SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND expires_at>?').get(hash(raw[1]), Date.now()); if (!row) throw fail(401, '登录已过期，请重新登录。'); return row; }
  function session(res, id) { const token = crypto.randomBytes(32).toString('hex'); db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token), id, Date.now() + 7 * 86400000); res.setHeader('Set-Cookie', `pgy_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${configuredOrigin.startsWith('https:') ? '; Secure' : ''}`); }
  async function body(req, limit = 16 * 1024 * 1024) { if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) throw fail(415, '请求格式应为 JSON。'); let size = 0, parts = []; for await (const part of req) { size += part.length; if (size > limit) throw fail(413, '礼物内容过大，请减少照片数量或尺寸。'); parts.push(part); } try { return JSON.parse(Buffer.concat(parts).toString('utf8')); } catch { throw fail(400, '请求内容无效。'); } }
  function owner(id, uid) { const gift = db.prepare('SELECT * FROM gifts WHERE id=? AND user_id=?').get(id, uid); if (!gift) throw fail(404, '礼物不存在或你无权管理。'); return gift; }
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'no-referrer'); res.setHeader('X-Frame-Options', 'DENY');
    try {
      const allowedHosts = new Set([new URL(origin(req)).host, `localhost:${server.address().port}`]);
      if (!allowedHosts.has(req.headers.host)) throw fail(403, '访问地址未被允许。');
      const pathname = new URL(req.url, origin(req)).pathname;
      if (pathname.startsWith('/api/')) {
        if (!['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)) throw fail(405, '不支持此操作。');
        if (req.method !== 'GET') { if (req.headers['x-pgy-request'] !== '1') throw fail(403, '请求验证失败。'); const incoming = req.headers.origin; if (incoming && incoming !== origin(req) && incoming !== `http://localhost:${server.address().port}`) throw fail(403, '不允许跨站请求。'); }
        if (pathname === '/api/meta' && req.method === 'GET') return send(res, 200, { available: true, public: !!configuredOrigin && !['localhost','127.0.0.1','[::1]'].includes(new URL(configuredOrigin).hostname), origin: origin(req) });
        const ip = req.socket.remoteAddress || 'unknown';
        if (['/api/auth/register', '/api/auth/login'].includes(pathname) && req.method === 'POST') {
          rate('auth:' + ip, 40, 15 * 60000);
          const input = await body(req, 4096), username = typeof input.username === 'string' ? input.username.trim().toLowerCase() : '';
          if (!/^[a-z0-9_]{3,32}$/.test(username) || typeof input.password !== 'string' || input.password.length < 8 || input.password.length > 128) throw fail(400, '账号需为 3–32 位字母、数字或下划线，密码需为 8–128 位。');
          if (pathname.endsWith('register')) {
            rate('register:' + ip, 10, 3600000);
            const displayName = typeof input.displayName === 'string' ? input.displayName.trim() : '';
            if (!displayName || displayName.length > 30) throw fail(400, '昵称需为 1–30 个字符。');
            const salt = crypto.randomBytes(16).toString('hex'), passwordHash = (await scrypt(input.password, salt, 64)).toString('hex'), id = crypto.randomUUID();
            try { db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run(id, username, displayName, salt, passwordHash, Date.now()); } catch (e) { if (e.code?.includes('CONSTRAINT') || e.message.includes('UNIQUE')) throw fail(409, '此账号已被使用。'); throw e; }
            session(res, id); return send(res, 201, { user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(id)) });
          }
          const row = db.prepare('SELECT * FROM users WHERE username=?').get(username);
          const candidate = await scrypt(input.password, row?.salt || 'pagetoyou-missing-account', 64);
          if (!row || !crypto.timingSafeEqual(candidate, Buffer.from(row.password_hash, 'hex'))) throw fail(401, '账号或密码不正确。');
          session(res, row.id); return send(res, 200, { user: publicUser(row) });
        }
        if (pathname === '/api/auth/me' && req.method === 'GET') return send(res, 200, { user: publicUser(user(req)) });
        if (pathname === '/api/auth/logout' && req.method === 'POST') { const raw = /pgy_session=([a-f0-9]{64})/.exec(req.headers.cookie || ''); if (raw) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(raw[1])); res.setHeader('Set-Cookie', 'pgy_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'); return send(res, 200, { ok: true }); }
        const published = /^\/api\/public\/([a-f0-9]{48})$/.exec(pathname);
        if (published && req.method === 'GET') { const row = db.prepare("SELECT * FROM gifts WHERE token=? AND status='published'").get(published[1]); if (!row) throw fail(404, '这份礼物不存在，或已停止分享。'); db.prepare('UPDATE gifts SET views=views+1 WHERE id=?').run(row.id); return send(res, 200, { gift: JSON.parse(row.published_json) }); }
        const account = user(req);
        if (pathname === '/api/profile' && req.method === 'PUT') { const input = await body(req, 4096); if (typeof input.displayName !== 'string' || !input.displayName.trim() || input.displayName.trim().length > 30) throw fail(400, '昵称需为 1–30 个字符。'); db.prepare('UPDATE users SET display_name=? WHERE id=?').run(input.displayName.trim(), account.id); return send(res, 200, { user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(account.id)) }); }
        if (pathname === '/api/auth/password' && req.method === 'POST') { rate('password:' + account.id, 10, 900000); const input = await body(req, 4096); if (typeof input.currentPassword !== 'string' || input.currentPassword.length > 128 || typeof input.newPassword !== 'string' || input.newPassword.length < 8 || input.newPassword.length > 128) throw fail(400, '密码需为 8–128 位。'); if (!crypto.timingSafeEqual(await scrypt(input.currentPassword, account.salt, 64), Buffer.from(account.password_hash, 'hex'))) throw fail(400, '当前密码不正确。'); const salt = crypto.randomBytes(16).toString('hex'); const next = (await scrypt(input.newPassword, salt, 64)).toString('hex'); db.prepare('UPDATE users SET salt=?,password_hash=? WHERE id=?').run(salt, next, account.id); db.prepare('DELETE FROM sessions WHERE user_id=?').run(account.id); session(res, account.id); return send(res, 200, { ok: true }); }
        if (pathname === '/api/gifts' && req.method === 'GET') { const rows = db.prepare('SELECT * FROM gifts WHERE user_id=? ORDER BY updated_at DESC').all(account.id); return send(res, 200, { gifts: rows.map(safe) }); }
        if (pathname === '/api/gifts' && req.method === 'POST') { rate('save:' + account.id, 120, 60000); const count = db.prepare('SELECT count(*) AS n FROM gifts WHERE user_id=?').get(account.id).n; if (count >= 50) throw fail(400, '试用期每个账号最多保存 50 份礼物。'); const input = await body(req), payload = JSON.stringify(validateGift(input.gift)), id = crypto.randomUUID(), token = crypto.randomBytes(24).toString('hex'), now = Date.now(); db.prepare('INSERT INTO gifts(id,user_id,token,draft_json,created_at,updated_at) VALUES(?,?,?,?,?,?)').run(id, account.id, token, payload, now, now); return send(res, 201, { gift: safe(owner(id, account.id)) }); }
        const match = /^\/api\/gifts\/([a-f0-9-]{36})(?:\/(publish|stop))?$/.exec(pathname);
        if (match) {
          const row = owner(match[1], account.id), action = match[2];
          if (!action && req.method === 'GET') return send(res, 200, { gift: safe(row), content: JSON.parse(row.draft_json) });
          if (!action && req.method === 'DELETE') { db.prepare('DELETE FROM gifts WHERE id=?').run(row.id); return send(res, 200, { ok: true }); }
          if (!action && req.method === 'PUT') { rate('save:' + account.id, 120, 60000); const input = await body(req); if (input.revision !== row.revision) throw fail(409, '其他页面已修改这份礼物，请从个人中心重新打开。'); const content = JSON.stringify(validateGift(input.gift)); const changed = db.prepare('UPDATE gifts SET draft_json=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?').run(content, Date.now(), row.id, input.revision); if (!changed.changes) throw fail(409, '草稿已改变，请重新打开。'); return send(res, 200, { gift: safe(owner(row.id, account.id)) }); }
          if (action === 'publish' && req.method === 'POST') { const input = await body(req, 1024); if (input.revision !== row.revision) throw fail(409, '草稿已改变，请保存后重新发布。'); const changed = db.prepare("UPDATE gifts SET published_json=draft_json,published_revision=revision,status='published',updated_at=? WHERE id=? AND revision=?").run(Date.now(), row.id, input.revision); if (!changed.changes) throw fail(409, '草稿已改变，请重新保存后发布。'); return send(res, 200, { gift: safe(owner(row.id, account.id)), url: origin(req) + '/g/' + row.token }); }
          if (action === 'stop' && req.method === 'POST') { db.prepare("UPDATE gifts SET status='stopped',updated_at=? WHERE id=?").run(Date.now(), row.id); return send(res, 200, { gift: safe(owner(row.id, account.id)) }); }
        }
        throw fail(404, '接口不存在。');
      }
      if (!['GET', 'HEAD'].includes(req.method)) throw fail(405, '不支持此操作。');
      const receiver = /^\/g\/[a-f0-9]{48}$/.test(pathname);
      const files = { '/': ['index.html','text/html'], '/index.html': ['index.html','text/html'], '/stationery.js':['stationery.js','text/javascript'], '/stationery.css':['stationery.css','text/css'], '/assets/stationery/envelopes-v1.png':['assets/stationery/envelopes-v1.png','image/png'], '/assets/stationery/ginkgo-v1.png':['assets/stationery/ginkgo-v1.png','image/png'], '/studio.js': ['studio.js','text/javascript'], '/studio.css': ['studio.css','text/css'], '/tree-webgl.js': ['tree-webgl.js','text/javascript'], '/tree-webgl.css': ['tree-webgl.css','text/css'], '/gift-effects.js': ['gift-effects.js','text/javascript'], '/gift-effects.css': ['gift-effects.css','text/css'], '/account.js': ['account.js','text/javascript'], '/account.css': ['account.css','text/css'] };
      let entry = receiver ? files['/'] : files[pathname]; if(pathname.startsWith('/vendor/three/')&&pathname.endsWith('.js')){const root=path.resolve(__dirname,'vendor/three');const file=path.resolve(__dirname,'.'+pathname);if(file.startsWith(root+path.sep)&&fs.existsSync(file))entry=[path.relative(__dirname,file),'text/javascript'];}
      if (!entry) throw fail(404, '页面不存在。');
      let data = fs.readFileSync(path.join(__dirname, entry[0]));
      if (receiver) { data = Buffer.from(data.toString('utf8').replace('<head>', '<head><base href="/">')); res.setHeader('X-Robots-Tag','noindex, nofollow'); }
      res.writeHead(200, { 'Content-Type': entry[1] + '; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(req.method === 'HEAD' ? undefined : data);
    } catch (err) { if (!res.headersSent) send(res, err.status || 500, { error: err.status ? err.message : '服务暂时无法处理请求，请稍后重试。' }); else res.end(); }
  });
  server.on('close', () => { clearInterval(janitor); db.close(); });
  return server;
}
module.exports = { createApp, validateGift };



