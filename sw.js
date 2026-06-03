const CACHE = "appsorteio-v14";
const ASSETS = [
    "./",
    "./index.html",
    "./volei.html",
    "./futebol.html",
    "./basquete.html",
    "./handebol.html",
    "./cpz-assinatura.png",
    "./icon-192.png",
    "./banner-home.png",
    "./sport-volei.png",
    "./sport-futebol.png",
    "./sport-basquete.png",
    "./sport-handebol.png"
];

self.addEventListener("install", e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener("activate", e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", e => {
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request))
    );
});
