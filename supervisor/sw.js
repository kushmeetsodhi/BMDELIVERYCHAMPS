// Offline copy of the app shell.
// The version changes on every build, which is how phones pick up a
// new release: the new worker installs, clears the old cache, and the
// next open runs the new code.
var VERSION = '522647a16d';
var PREFIX = 'bm-sup-';
var CACHE = PREFIX + VERSION;
var SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest',
             'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function (ev) {
  ev.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(SHELL.map(function (u) { return new Request(u, { cache: 'reload' }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (ev) {
  ev.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) {
      return k.indexOf(PREFIX) === 0 && k !== CACHE;
    }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (ev) {
  var req = ev.request;
  // Only this site's own files. Calls to the Apps Script backend go
  // straight to the network, untouched - a cached answer there would
  // be a wrong answer.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // Another app lives in a folder below this one and has its own cache.
  var SKIP = '';
  if (SKIP && new URL(req.url).pathname.indexOf(SKIP) > -1) return;

  // The page and its setting: network first, so a release reaches the
  // phone on the next open; the cached copy when there is no signal.
  var isShell = req.mode === 'navigate' || /\/(index\.html|config\.js)?(\?.*)?$/.test(req.url);
  if (isShell) {
    ev.respondWith(fetch(req, { cache: 'no-cache' }).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) {
        return hit || caches.match('index.html');
      });
    }));
    return;
  }

  // Icons and the manifest: the cache is fine.
  ev.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
    return hit || fetch(req);
  }));
});
