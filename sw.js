const V = 'tandem-v1';
const FILES = ['./', 'index.html', 'style.css', 'app.js', 'data.js', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png', 'icons/maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
// cache d'abord (hors ligne), mise à jour en arrière-plan
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => {
    const net = fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(V).then(ch => ch.put(e.request, c)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
