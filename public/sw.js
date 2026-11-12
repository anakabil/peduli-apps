/* Service worker PEDULI Apps: cache app shell, fallback luring, antrean laporan. */
const VERSION = "peduli-v6";
const SHELL = ["/offline", "/icons/icon-192.png", "/icons/icon-512.png", "/brand/peduli-logo-compact.png", "/brand/gys-logo.png", "/brand/peduli-mark.png", "/ikon/ilustrasi/luring.webp"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Navigasi: selalu dari jaringan; halaman beraut tidak pernah disimpan di cache
  // (mencegah data pengguna lain terbaca di perangkat bersama). Bila luring, tampilkan /offline.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("/offline")));
    return;
  }

  // Aset statis: cache dahulu
  if (/^\/(_next\/static|icons|brand|ikon|rewards)\//.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            // Hanya respons sukses yang disimpan; pengalihan (mis. ke halaman masuk) tidak pernah di-cache
            if (res.ok && !res.redirected) {
              const copy = res.clone();
              caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
      )
    );
  }
});

// Notifikasi ponsel (Web Push): tampilkan, lalu buka halaman terkait saat diketuk
self.addEventListener("push", (event) => {
  let d = {};
  try {
    d = event.data ? event.data.json() : {};
  } catch (e) {
    d = { body: event.data ? event.data.text() : "" };
  }
  const title = d.title || "PEDULI";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: d.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      tag: d.tag || undefined,
      renotify: !!d.tag,
      lang: "id",
      data: { url: d.url || "/notifikasi" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/notifikasi", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => new URL(c.url).origin === self.location.origin);
      if (open) return open.focus().then((c) => (c && "navigate" in c ? c.navigate(target) : null));
      return self.clients.openWindow(target);
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
