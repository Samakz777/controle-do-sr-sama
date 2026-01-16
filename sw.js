const CACHE_NAME = 'baldes-cache-v5';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon.png',
  './plus.mp3',
  './minus.mp3',
  './trash.mp3'
];

/* INSTALA: pré-cache */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

/* ATIVA: limpa caches antigos */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      ),
      self.clients.claim()
    ])
  );
});

/*
  FETCH:
  - responde do cache se existir
  - tenta buscar na rede
  - se buscar, atualiza o cache (pra evitar versão velha)
*/
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Só lida com GET (evita quebrar requests estranhos)
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          // Atualiza cache (se resposta ok)
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached); // se falhar rede, volta pro cache

      // Se tiver cache, retorna cache rápido e atualiza em segundo plano
      return cached || fetchPromise;
    })
  );
});
