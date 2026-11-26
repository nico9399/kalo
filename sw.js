/* Kalo Service Worker: App offline verfügbar machen */
var V='kalo-0.6.1';
var ASSETS=['./','index.html','manifest.json','icon-180.png','bls.json','zxing.min.js'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(V).then(function(c){return c.addAll(ASSETS);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(e){
  var r=e.request;if(r.method!=='GET')return;
  var u=new URL(r.url);if(u.origin!==self.location.origin)return; // Open Food Facts usw. nie cachen
  var isPage=r.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('index.html');
  if(isPage){
    // Seite: erst Netz (für Updates, max. 3 s), sonst gespeicherte Version
    e.respondWith(new Promise(function(res){
      var done=false;
      var t=setTimeout(function(){caches.match('index.html').then(function(c){if(c&&!done){done=true;res(c);}});},3000);
      fetch(r).then(function(net){clearTimeout(t);var cp=net.clone();caches.open(V).then(function(c){c.put('index.html',cp);});if(!done){done=true;res(net);}})
        .catch(function(){clearTimeout(t);caches.match('index.html').then(function(c){if(!done){done=true;res(c||Response.error());}});});
    }));
    return;
  }
  // Dateien: aus dem Speicher, sonst Netz
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(function(c){return c||fetch(r).then(function(net){if(net.ok){var cp=net.clone();caches.open(V).then(function(ca){ca.put(r,cp);});}return net;});}));
});
