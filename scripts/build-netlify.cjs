const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),target=path.join(root,'dist');fs.mkdirSync(target,{recursive:true});
const files=['index.html','studio.js','studio.css','account.js','account.css','gift-effects.js','gift-effects.css','stationery.js','stationery.css','photo-scenes.js','photo-scenes.css','photo-space.js','tree-webgl.js','tree-webgl.css'];
for(const file of files)fs.copyFileSync(path.join(root,file),path.join(target,file));
fs.writeFileSync(path.join(target,'index.html'),fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<head>','<head><base href="/">'));
for(const folder of ['assets','vendor'])fs.cpSync(path.join(root,folder),path.join(target,folder),{recursive:true,filter:src=>!src.endsWith('.md')});
console.log('Static assets prepared in dist; account and publication APIs require a cloud backend.');
