/*
 * Mookiland Staff Portal - service worker (0.13.0).
 * Hanya untuk notifikasi di layar HP. Tidak menyimpan halaman di cache, sehingga
 * portal selalu memakai versi terbaru dari server.
 *
 * Alur: server mengirim "ketukan" push tanpa isi -> service worker mengambil judul
 * notifikasi dari server (action push.pending) memakai kode rahasia perangkat yang
 * disimpan di IndexedDB saat karyawan menekan "Aktifkan pengingat di HP ini".
 */
'use strict';

var DB_NAME = 'mkl-push';
var STORE = 'kv';
var FALLBACK = { title: 'Mookiland Staff Portal', body: 'Ada pemberitahuan baru. Buka portal untuk melihatnya.', link: '/notifikasi', tag: 'mkl-umum' };

function idb(mode, fn) {
  return new Promise(function (resolve, reject) {
    var req = self.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = function () { req.result.createObjectStore(STORE); };
    req.onerror = function () { reject(req.error); };
    req.onsuccess = function () {
      var db = req.result;
      var tx = db.transaction(STORE, mode);
      var out = fn(tx.objectStore(STORE));
      tx.oncomplete = function () { db.close(); resolve(out && out.result !== undefined ? out.result : undefined); };
      tx.onerror = function () { db.close(); reject(tx.error); };
    };
  });
}
function getDevice() { return idb('readonly', function (s) { return s.get('device'); }); }

function fetchPending(dev) {
  return fetch(dev.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'push.pending', payload: { subId: dev.subId, secret: dev.secret }, token: null, client: 'service-worker' }),
    redirect: 'follow', credentials: 'omit', cache: 'no-store'
  }).then(function (r) { return r.json(); });
}

function show(item, base, unread) {
  return self.registration.showNotification(item.title || FALLBACK.title, {
    body: item.body || '',
    tag: item.tag || FALLBACK.tag,
    icon: base + 'assets/icons/icon-192.png',
    badge: base + 'assets/icons/badge-96.png',
    data: { url: base + 'index.html#' + (item.link || '/beranda') },
    renotify: false
  }).then(function () {
    if (unread && self.navigator && self.navigator.setAppBadge) return self.navigator.setAppBadge(unread).catch(function () {});
  });
}

function handlePush() {
  var base = self.registration.scope;
  return getDevice().then(function (dev) {
    if (!dev || !dev.subId) return show(FALLBACK, base, 0);
    return fetchPending(dev).then(function (res) {
      var items = res && res.success && res.data ? res.data.items : [];
      var unread = res && res.success && res.data ? res.data.unread : 0;
      if (!items || !items.length) return show(FALLBACK, base, unread);
      // Paling banyak 3 notifikasi sekaligus; sisanya terlihat di lonceng portal.
      return Promise.all(items.slice(0, 3).map(function (it) { return show(it, base, unread); }));
    });
  }).catch(function () { return show(FALLBACK, base, 0); });
}

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) { event.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (event) {
  event.waitUntil(handlePush());
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || self.registration.scope;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.url.indexOf(self.registration.scope) === 0 && 'focus' in c) {
        return c.focus().then(function (w) { return w && w.navigate ? w.navigate(url) : null; }).catch(function () { return self.clients.openWindow(url); });
      }
    }
    return self.clients.openWindow(url);
  }));
});
