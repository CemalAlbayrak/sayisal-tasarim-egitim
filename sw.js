// Çevrimdışı okuma: kurulumda her şeyi önbelleğe alır, sonra önce önbellekten verir
// ve arka planda yeniler. Dersler değişince SURUM artırılır.
const SURUM = "v1";
const ONBELLEK = "sayisal-tasarim-" + SURUM;
const SABIT = [
  "./", "index.html", "style.css", "app.js", "manifest.webmanifest", "dersler.json",
  "simgeler/simge-192.png", "simgeler/simge-512.png",
  "vendor/katex/katex.min.js", "vendor/katex/katex.min.css"
];

self.addEventListener("install", olay => {
  olay.waitUntil((async () => {
    const c = await caches.open(ONBELLEK);
    await c.addAll(SABIT);
    const dersler = await (await fetch("dersler.json", { cache: "no-cache" })).json();
    await c.addAll(dersler.filter(d => d.yazildi).map(d => "dersler/" + d.id + ".html"));
    const fontlar = await (await fetch("vendor/katex/fonts.json")).json();
    await c.addAll(fontlar);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", olay => {
  olay.waitUntil((async () => {
    for (const ad of await caches.keys()) if (ad !== ONBELLEK) await caches.delete(ad);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", olay => {
  if (olay.request.method !== "GET") return;
  olay.respondWith((async () => {
    const c = await caches.open(ONBELLEK);
    const eski = await c.match(olay.request, { ignoreSearch: true });
    const yeni = fetch(olay.request).then(r => { if (r.ok) c.put(olay.request, r.clone()); return r; }).catch(() => null);
    if (eski) { olay.waitUntil(yeni); return eski; }
    return (await yeni) || new Response("Çevrimdışı ve önbellekte yok.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  })());
});
