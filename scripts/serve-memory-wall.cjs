const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../memory-wall'),data=path.resolve(__dirname,'../.data/memory-wall');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.gif':'image/gif','.webp':'image/webp','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.m4a':'audio/mp4','.mp4':'video/mp4','.webm':'video/webm','.md':'text/plain; charset=utf-8'};
function createServer() {
  return http.createServer((req,res)=>{
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'");
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
    let pathname;
    try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
    let file;
    if(pathname==='/memory.json') file=path.join(data,'memory.json');
    else if(/^\/media\/[a-f0-9]{24}\.[a-z0-9]+$/.test(pathname)){
      try{file=JSON.parse(fs.readFileSync(path.join(data,'assets.json'),'utf8'))[pathname.slice(7)];}catch{}
    }else if(/^\/(index\.html|app\.js|style\.css|enhance\.js|enhance\.css|vendor\/three\.min\.js|LICENSE\.upstream|THIRD-PARTY-NOTICES\.md)$/.test(pathname)||pathname==='/') file=path.join(root,pathname==='/'?'index.html':pathname.slice(1));
    if(!file||!fs.existsSync(file)){res.writeHead(404);return res.end('Not found');}
    const stat=fs.statSync(file),type=MIME[path.extname(file)]||'application/octet-stream';
    const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    if(range){const start=Number(range[1]),end=Math.min(stat.size-1,range[2]?Number(range[2]):stat.size-1);
      if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});return res.end();}
      res.writeHead(206,{'Content-Type':type,'Content-Range':`bytes ${start}-${end}/${stat.size}`,'Content-Length':end-start+1,'Accept-Ranges':'bytes'});
      if(req.method==='HEAD')return res.end();return fs.createReadStream(file,{start,end}).pipe(res);
    }
    res.writeHead(200,{'Content-Type':type,'Content-Length':stat.size,'Accept-Ranges':'bytes'});
    if(req.method==='HEAD')return res.end();fs.createReadStream(file).pipe(res);
  });
}
if(require.main===module){const port=Number(process.env.MEMORY_PORT)||4196;createServer().listen(port,'127.0.0.1',()=>console.log(`聊天星河 http://127.0.0.1:${port}`));}
module.exports={createServer};
