import {netlifyStore} from '../../server/store.ts';
import {createHandler} from '../../server/api.ts';
export default async(request:Request)=>createHandler({
 store:netlifyStore(),env:process.env,
 enqueue:async(job,secret,origin)=>{
  const response=await fetch(new URL('/.netlify/functions/ingest-background',origin),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({job,secret}),signal:AbortSignal.timeout(8000)});
  if(response.status!==202)throw Error('Background indexing was not accepted');
 }
})(request);
