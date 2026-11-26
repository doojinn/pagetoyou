const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),viewer=path.join(root,'memory-wall'),privateDir=path.join(root,'.data/memory-wall');
function inlineScript(source){return source.replace(/<\/script/gi,'<\\/script');}
function build(){
  const data=JSON.parse(fs.readFileSync(path.join(privateDir,'memory.json'),'utf8'));
  const assets=JSON.parse(fs.readFileSync(path.join(privateDir,'assets.json'),'utf8'));
  for(const session of data.sessions)for(const message of session.messages){
    if(message.avatar)message.avatar=pathToFileURL(assets[message.avatar.slice(7)]).href;
    for(const media of message.media||[])media.url=pathToFileURL(assets[media.url.slice(7)]).href;
  }
  let html=fs.readFileSync(path.join(viewer,'index.html'),'utf8');
  for(const file of ['style.css','enhance.css'])html=html.replace(`<link rel="stylesheet" href="${file}">`,`<style>${fs.readFileSync(path.join(viewer,file),'utf8')}</style>`);
  for(const file of ['vendor/three.min.js','enhance.js','app.js'])html=html.replace(`<script src="${file}"></script>`,()=>`<script>${inlineScript(fs.readFileSync(path.join(viewer,file),'utf8'))}</script>`);
  const json=JSON.stringify(data).replace(/</g,'\\u003c');
  html=html.replace('<script>',()=>`<script>window.MEMORY=${json};</script><script>`);
  const output=path.join(privateDir,'Chat-Galaxy.html');fs.writeFileSync(output,html);
  return {output,messages:data.stats.messages,bytes:Buffer.byteLength(html)};
}
if(require.main===module)console.log(JSON.stringify(build()));
module.exports={build,inlineScript};
