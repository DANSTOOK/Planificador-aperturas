/* Service worker: permite abrir la app sin internet.
   - La página (index.html) se pide primero a la red y, si no hay señal, se usa la guardada.
   - Estilos, código, datos e imágenes se sirven de lo guardado y se actualizan en segundo plano.
   El avance de cada persona ya vive en su navegador (IndexedDB), así que no se pierde sin señal.
   Al publicar, GitHub Actions cambia BUILD para estrenar caché y borrar la anterior. */
const BUILD = 'local';
const CACHE = `aperturas-${BUILD}`;
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'assets/tienda.png', 'assets/tienda.glb', 'assets/icon-192.png', 'assets/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('aperturas-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const mismoSitio = url.origin === self.location.origin;
  const fuentes = /fonts\.(googleapis|gstatic)\.com$|cdn\.jsdelivr\.net$/.test(url.hostname);
  if (!mismoSitio && !fuentes) return;

  // Página: red primero, guardada si no hay señal
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req)
      .then(res => { const copia = res.clone(); caches.open(CACHE).then(c => c.put('index.html', copia)); return res; })
      .catch(() => caches.match('index.html').then(r => r || caches.match('./'))));
    return;
  }

  // Lo demás: guardado al instante y se actualiza en segundo plano
  e.respondWith(caches.open(CACHE).then(async c => {
    const guardado = await c.match(req);
    const red = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()); return res; }).catch(() => guardado);
    return guardado || red;
  }));
});
