import {getDatabase} from '@netlify/database';
import {getStore} from '@netlify/blobs';
import cloud from '../../cloud/api.cjs';

let handler;
export default async (request,context)=>{
 try{
  if(!handler){
   const {pool}=getDatabase();
   const media=getStore({name:'pagetoyou-media',consistency:'strong'});
   handler=cloud.createCloudHandler({pool,platform:'netlify',store:{set:(id,bytes)=>media.set(id,bytes),get:id=>media.get(id,{type:'arrayBuffer'})}});
  }
  return await handler(request,{ip:context.ip});
 }catch(error){console.error('Netlify initialization failed',error.code||error.name);return Response.json({error:'云端服务尚未就绪，请稍后重试。'},{status:503,headers:{'Cache-Control':'no-store'}});}
};
export const config={path:'/api/*'};
