const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const PRIVATE = path.resolve(__dirname, '../.data/memory-wall');

function parseChunk(source) {
  const match = source.match(/^\s*window\.__wxChunk\s*=\s*([\s\S]*?)\s*;?\s*$/);
  if (!match) throw new Error('不是有效的 Moect 聊天分片');
  const messages = JSON.parse(match[1]);
  if (!Array.isArray(messages)) throw new Error('聊天分片必须为数组');
  return messages;
}
function inside(root, relative) {
  const full = path.resolve(root, relative);
  return full.startsWith(path.resolve(root) + path.sep) ? full : null;
}
function convert(exportPath) {
  const root = path.resolve(exportPath);
  const candidates = [root, ...fs.readdirSync(root, {withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>path.join(root,x.name))];
  const dir = candidates.find(d=>fs.readdirSync(d).some(f=>/^c\d+\.js$/.test(f)));
  if (!dir) throw new Error('未找到 c000001.js 等聊天记录分片');
  const files = fs.readdirSync(dir).filter(f=>/^c\d+\.js$/.test(f)).sort();
  const raw = files.flatMap(f=>parseChunk(fs.readFileSync(path.join(dir,f),'utf8')));
  raw.sort((a,b)=>a.create_time-b.create_time || a.local_id-b.local_id);
  const assets = {}, days = new Map();
  function asset(relative) {
    if (!relative) return null;
    const full = inside(dir,relative);
    if (!full || !fs.existsSync(full) || !fs.statSync(full).isFile()) return null;
    const ext = path.extname(full).toLowerCase();
    if (!['.jpg','.jpeg','.png','.gif','.webp','.mp3','.wav','.ogg','.m4a','.mp4','.webm'].includes(ext)) return null;
    const key = crypto.createHash('sha256').update(relative).digest('hex').slice(0,24)+ext;
    assets[key] = full;
    return '/media/'+key;
  }
  for (const m of raw) {
    const at = Number(m.create_time)*1000;
    const day = m.time_str?.slice(0,10) || new Date(at).toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
    if (!days.has(day)) days.set(day,[]);
    const media = (m.resources||[]).filter(r=>r.status==='available').map(r=>({kind:r.kind,url:asset(r.path)})).filter(r=>r.url);
    days.get(day).push({id:String(m.local_id),role:m.is_sender?'user':'assistant',sender:m.sender||'系统',
      text:String(m.text||'['+(m.type_name||m.kind||'消息')+']'),at,time:m.time_str,kind:m.kind||'text',
      avatar:asset(m.avatar),media,unavailable:m.resource_status==='encrypted',seq:days.get(day).length+1});
  }
  const sessions = [...days].map(([day,messages],i)=>({id:'day-'+day,title:day.slice(5).replace('-','月')+'日',
    day,project:'我们的第 '+(i+1)+' 个聊天日',createdAt:messages[0].at,lastAt:messages.at(-1).at,
    msgCount:messages.length,toolCount:0,messages}));
  const senders = [...new Set(raw.filter(m=>m.kind!=='system').map(m=>m.sender))];
  return {data:{generatedAt:Date.now(),title:'予页 · 聊天星河',senders,
    stats:{messages:raw.length,days:days.size,first:raw[0]?.time_str,last:raw.at(-1)?.time_str,
      unavailable:raw.filter(m=>m.resource_status==='encrypted').length},sessions},assets};
}
function main() {
  if (!process.argv[2]) throw new Error('用法：node scripts/import-memory-wall.cjs <Moect 导出文件夹>');
  const result = convert(process.argv[2]);
  fs.mkdirSync(PRIVATE,{recursive:true});
  fs.writeFileSync(path.join(PRIVATE,'memory.json'),JSON.stringify(result.data));
  fs.writeFileSync(path.join(PRIVATE,'assets.json'),JSON.stringify(result.assets));
  console.log(JSON.stringify({messages:result.data.stats.messages,days:result.data.stats.days,
    availableAssets:Object.keys(result.assets).length,encryptedMessages:result.data.stats.unavailable}));
}
if (require.main===module) main();
module.exports={parseChunk,convert,inside};
