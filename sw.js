// Simple offline-first service worker
const CACHE = "billing-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.png",
  "https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js",
  "https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap"
];

self.addEventListener("install", e=>{
  e.waitUntil(
    caches.open(CACHE).then(c =>
      // try each individually so one missing asset doesn't break install
      Promise.all(ASSETS.map(u => c.add(u).catch(()=>null)))
    ).then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate", e=>{
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch", e=>{
  const req = e.request;
  if(req.method !== "GET") return;
  e.respondWith(
    caches.match(req).then(hit => {
      if(hit) return hit;
      return fetch(req).then(res => {
        // cache successful same-origin / cors responses
        if(res && res.status === 200 && (res.type === "basic" || res.type === "cors")){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
        }
        return res;
      }).catch(()=>{
        // offline fallback to index.html for navigations
        if(req.mode === "navigate") return caches.match("./index.html");
      });
    })
  );
});
