const CACHE = 'sp360-v6';   // bump when you want a fresh cache

const ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k === CACHE ? null : caches.delete(k))))
    ).then(() => self.clients.claim())
     // announce the active SW so we can see it
     .then(() => self.clients.matchAll({type:'window', includeUncontrolled:true}))
     .then(clients => clients.forEach(c => c.postMessage({type:'SW_READY', version: CACHE})))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith((async () => {
    try {
      const net = await fetch(e.request);
      (await caches.open(CACHE)).put(e.request, net.clone());
      return net;
    } catch {
      return (await caches.match(e.request)) || Response.error();
    }
  })());
});
