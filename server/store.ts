import {getStore} from '@netlify/blobs';
export interface RecordValue<T>{data:T;etag:string}
export interface Store{
 read<T>(key:string):Promise<RecordValue<T>|null>;
 write(key:string,data:unknown,options?:{onlyIfNew?:boolean;onlyIfMatch?:string}):Promise<{modified:boolean}>;
}
export function netlifyStore():Store{
 // Site-wide storage persists across deploys. Use a separate Netlify site for staging.
 const store=getStore({name:'groundwork-support',consistency:'strong'});
 return {read:async<T>(key:string)=>await store.getWithMetadata(key,{type:'json'}) as RecordValue<T>|null,write:(key,data,options)=>store.setJSON(key,data,options?.onlyIfNew?{onlyIfNew:true}:options?.onlyIfMatch?{onlyIfMatch:options.onlyIfMatch}:undefined)};
}
