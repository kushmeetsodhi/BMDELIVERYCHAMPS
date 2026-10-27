self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (ev) {
  ev.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('bm-champs-') === 0; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.registration.unregister(); }));
});
