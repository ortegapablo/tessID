// Nombre del caché
const version = 'v2';
const CACHE_NAME = `IDparser-${version}`;
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/js/index.js',
    '/favicon.svg',
    '/manifest.json',
    '/tess/mrzf.traineddata.gz',
    '/tess/tesseract-core-lstm.wasm.js',
    '/tess/tesseract-core-simd-lstm.wasm.js',
    '/tess/tesseract.min.js',
    '/tess/worker.min.js'
];

// Evento de instalación: cachea los recursos estáticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME)
            console.log('Caching static assets');
            cache.addAll(STATIC_ASSETS);
        })(),
    );
});

// Evento de activación: limpia cachés antiguas
self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        console.log('Deleting old cache:', name);
                        return caches.delete(cache);
                    }
                }),
            );
            await clients.claim();
            console.log('Service worker activated and old caches deleted');
        })(),
    );
});

// Evento fetch: responde con recursos cacheados o realiza una solicitud de red
self.addEventListener('fetch', (event) => {
    console.log(`[Service Worker] Fetched resource ${event.request.url}`, event);
    if (event.request.mode === "navigate") {
        event.respondWith(caches.match("/"));
        return;
    }


    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(event.request.url);
            if (cachedResponse) {
                // Return the cached response if it's available.
                return cachedResponse;
            }
            console.log(`[Service Worker] Fetching resource ${event.request.url}`);
            // Respond with a HTTP 404 response status.
            return new Response(null, { status: 404 });
        })(),
    );
});