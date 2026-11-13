(()=>{'use strict';
const cache=new Map();
async function upload(data){
 const bytes=new TextEncoder().encode(data),digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
 if(cache.has(digest))return cache.get(digest);
 const response=await fetch('/api/uploads',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Pgy-Request':'1'},body:JSON.stringify({data})});
 const result=await response.json();if(!response.ok)throw Object.assign(Error(result.error||'照片上传失败，请重试。'),{status:response.status});
 cache.set(digest,result.url);return result.url;
}
window.PagetoyouCloud={clear(){cache.clear();},async prepare(value){const gift=structuredClone(value);for(const p of gift.photos)if(p.src.startsWith('data:'))p.src=await upload(p.src);for(const key of ['backgroundImage','music'])if(gift.design?.[key]?.startsWith('data:'))gift.design[key]=await upload(gift.design[key]);return gift;}};
})();
