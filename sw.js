const CACHE_NAME = 'vegas-velha-v1';
const assets = [
  './',
  './index.html',
  './style.css',
  './App.js',
  './manifest.json'
];

// Instala o Service Worker e armazena os arquivos essenciais no cache
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// Ativa o Service Worker e limpa caches antigos, se houverem
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Serve os arquivos direto do cache quando o jogador estiver offline
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
