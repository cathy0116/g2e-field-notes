const VERSION='public-v2.2.0', SHELL='g2e-shell-'+VERSION, FULL='g2e-offline-'+VERSION;
const CORE=['./','index.html','styles.css','app.js','audio.js','help.js','model.js','ekg.js','db.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','apple-touch-icon.png','offline-assets.json'];
self.addEventListener('install',e=>e.waitUntil((async()=>{await (await caches.open(SHELL)).addAll(CORE);await self.skipWaiting();})()));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.pathname.endsWith('/version.json')){e.respondWith(fetch(e.request,{cache:'no-store'}));return;}if(e.request.method!=='GET'||u.origin!==self.location.origin||!u.pathname.startsWith(new URL(self.registration.scope).pathname))return;e.respondWith((async()=>{const full=await caches.open(FULL),shell=await caches.open(SHELL);const cached=await full.match(e.request)||await shell.match(e.request);if(cached)return cached;if(u.pathname.includes('/assets/')){const old=await caches.match(e.request);if(old)return old;}try{return await fetch(e.request);}catch(err){if(e.request.mode==='navigate')return await shell.match(new URL('index.html',self.registration.scope));throw err;}})());});
let preparing=false;
self.addEventListener('message',e=>{
 if(e.data?.type==='STATUS'){e.waitUntil((async()=>{const c=await caches.open(FULL);e.ports[0]?.postMessage({ready:!!await c.match(new URL('__complete__',self.registration.scope)),version:VERSION});})());return;}
 if(e.data?.type!=='PREPARE')return;
 const port=e.ports[0];if(preparing){port.postMessage({error:'離線資料正在下載，請稍後再查看。'});return;}preparing=true;
 e.waitUntil((async()=>{try{const list=await (await fetch(new URL('offline-assets.json',self.registration.scope))).json();const cache=await caches.open(FULL);let done=0;for(const path of list){const url=new URL(path,self.registration.scope);if(!await cache.match(url)){const res=await fetch(url,{cache:'reload'});if(!res.ok)throw Error('下載失敗：'+path);await cache.put(url,res);}done++;port.postMessage({done,total:list.length});}await cache.put(new URL('__complete__',self.registration.scope),new Response(VERSION));port.postMessage({ready:true,done,total:list.length});}catch(err){port.postMessage({error:err.message});}finally{preparing=false;}})());
});
