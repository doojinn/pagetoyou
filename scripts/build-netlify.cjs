const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),target=path.join(root,'dist');fs.mkdirSync(target,{recursive:true});
const files=['index.html','studio.js','studio.css','cloud-client.js','account.js','account.css','gift-effects.js','gift-effects.css','stationery.js','stationery.css','photo-scenes.js','photo-scenes.css','photo-space.js','tree-webgl.js','tree-webgl.css'];
for(const file of files)fs.copyFileSync(path.join(root,file),path.join(target,file));
fs.writeFileSync(path.join(target,'index.html'),fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<head>','<head><base href="/">'));
for(const folder of ['assets','vendor'])fs.cpSync(path.join(root,folder),path.join(target,folder),{recursive:true,filter:src=>!src.endsWith('.md')});
const functionsTarget=path.join(root,'.netlify','generated-functions');fs.mkdirSync(functionsTarget,{recursive:true});require('esbuild').buildSync({entryPoints:[path.join(root,'netlify/functions/api.mjs')],bundle:true,platform:'node',target:'node24',format:'esm',outfile:path.join(functionsTarget,'api.mjs'),external:['pg-native','bufferutil','utf-8-validate']});
console.log('Static assets and self-contained Netlify function prepared.');
