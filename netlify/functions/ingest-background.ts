import {netlifyStore} from '../../server/store.ts';
import {processJob} from '../../server/api.ts';
export default async(request:Request)=>{
 if(request.method!=='POST')return;
 const text=await request.text();if(text.length>300)return;
 let body:{job:string;secret:string};try{body=JSON.parse(text)}catch{return;}
 if(typeof body.job!=='string'||typeof body.secret!=='string')return;
 // Invalid jobs are ignored; valid job infrastructure errors are thrown so Netlify can retry.
 try{await processJob(netlifyStore(),body.job,body.secret)}catch(e){if((e as {status?:number}).status===403)return;throw e;}
};
