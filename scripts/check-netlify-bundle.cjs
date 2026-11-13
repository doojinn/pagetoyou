const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),archive=path.join(root,'.netlify/functions/api.zip');
if(!fs.existsSync(archive))throw Error('Run netlify build before checking the packaged function.');
const target=fs.mkdtempSync(path.join(os.tmpdir(),'pagetoyou-netlify-package-'));
const file=path.join(target,'api.mjs');
fs.writeFileSync(file,execFileSync('tar',['-xOf',archive,'api.mjs'],{maxBuffer:30*1024*1024}));
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
execFileSync(process.execPath,['--input-type=module','-e',`const m=await import(${JSON.stringify(require('node:url').pathToFileURL(file).href)});if(typeof m.default!=='function')throw Error('Missing function handler');console.log('Isolated Netlify function package passed');`],{stdio:'inherit'});
