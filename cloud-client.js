(()=>{'use strict';
const cache=new Map();
async function audioRequest(path,method,value){
 const response=await fetch(path,{method,credentials:'same-origin',headers:{'Content-Type':'application/json','X-Pgy-Request':'1'},body:value&&JSON.stringify(value)});
 const result=await response.json();
 if(!response.ok)throw Object.assign(Error(result.error||'音乐上传失败，请重试。'),{status:response.status});
 return result;
}
async function uploadAudio(data){
 const [,mime,encoded]=/^data:(audio\/[^;]+);base64,(.+)$/.exec(data);
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(data));
 const key='audio:'+Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
 if(cache.has(key))return cache.get(key);
 const size=encoded.length/4*3-(encoded.endsWith('==')?2:encoded.endsWith('=')?1:0);
 const {id}=await audioRequest('/api/uploads/audio','POST',{size});
 const path='/api/uploads/audio/'+id;
 const chunkBytes=2097150,chunkChars=chunkBytes/3*4;
 try{
  for(let i=0;i<encoded.length;i+=chunkChars){
   const chunk={mime,offset:i/4*3,data:encoded.slice(i,i+chunkChars)};
   let result;
   try{result=await audioRequest(path,'PUT',chunk);}catch(error){
    if(error.status&&error.status<500)throw error;
    result=await audioRequest(path,'PUT',chunk);
   }
   if(result.url){cache.set(key,result.url);return result.url;}
  }
  throw Error('音乐未上传完整，请重试。');
 }catch(error){await audioRequest(path,'DELETE').catch(()=>{});throw error;}
}
async function upload(data){
 const bytes=new TextEncoder().encode(data),digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
 if(cache.has(digest))return cache.get(digest);
 const response=await fetch('/api/uploads',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Pgy-Request':'1'},body:JSON.stringify({data})});
 const result=await response.json();if(!response.ok)throw Object.assign(Error(result.error||'照片上传失败，请重试。'),{status:response.status});
 cache.set(digest,result.url);return result.url;
}
window.PagetoyouCloud={clear(){cache.clear();},async prepare(value){const gift=structuredClone(value);for(const p of gift.photos)if(p.src.startsWith('data:'))p.src=await upload(p.src);if(gift.design?.backgroundImage?.startsWith('data:'))gift.design.backgroundImage=await upload(gift.design.backgroundImage);if(gift.design?.music?.startsWith('data:'))gift.design.music=await uploadAudio(gift.design.music);return gift;}};
})();
