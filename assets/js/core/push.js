/*
 * Mookiland Staff Portal - notifikasi di layar HP (0.13.0).
 * Mendaftarkan service worker (sw.js), meminta izin notifikasi, berlangganan push,
 * dan menyimpan kode perangkat di IndexedDB agar service worker bisa mengambil
 * judul notifikasi. Server tetap memeriksa semuanya; di sini hanya tampilan.
 */
(function (global) {
  'use strict';

  var DB_NAME = 'mkl-push', STORE = 'kv';
  var regPromise = null;

  function idb(mode, fn) {
    return new Promise(function (resolve, reject) {
      if (!global.indexedDB) { reject(new Error('IndexedDB tidak tersedia')); return; }
      var req = global.indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(STORE); };
      req.onerror = function () { reject(req.error); };
      req.onsuccess = function () {
        var db = req.result;
        var tx = db.transaction(STORE, mode);
        var r = fn(tx.objectStore(STORE));
        tx.oncomplete = function () { db.close(); resolve(r && r.result !== undefined ? r.result : undefined); };
        tx.onerror = function () { db.close(); reject(tx.error); };
      };
    });
  }
  function getDevice() { return idb('readonly', function (s) { return s.get('device'); }).catch(function () { return null; }); }
  function setDevice(v) { return idb('readwrite', function (s) { return v ? s.put(v, 'device') : s.delete('device'); }); }

  function b64ToBytes(s) {
    s = String(s).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var raw = global.atob(s), out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }
  function bytesToB64u(buf) {
    var b = new Uint8Array(buf), s = '';
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return global.btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  var MklPush = {
    supported: function () {
      return 'serviceWorker' in global.navigator && 'PushManager' in global && 'Notification' in global && !!global.indexedDB;
    },
    isIos: function () {
      var ua = global.navigator.userAgent || '';
      return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && global.navigator.maxTouchPoints > 1);
    },
    isAndroid: function () { return /Android/.test(global.navigator.userAgent || ''); },
    standalone: function () {
      return (global.matchMedia && global.matchMedia('(display-mode: standalone)').matches) || global.navigator.standalone === true;
    },
    permission: function () { return 'Notification' in global ? global.Notification.permission : 'unsupported'; },

    /** Didaftarkan saat portal dibuka (tanpa meminta izin apa pun). */
    register: function () {
      if (!('serviceWorker' in global.navigator)) return Promise.resolve(null);
      if (!regPromise) {
        regPromise = global.navigator.serviceWorker.register('sw.js').then(function () { return global.navigator.serviceWorker.ready; })
          .catch(function () { regPromise = null; return null; });
      }
      return regPromise;
    },

    clearBadge: function () {
      try { if (global.navigator.clearAppBadge) global.navigator.clearAppBadge().catch(function () {}); } catch (e) { /* tidak didukung */ }
    },

    /** { local: data perangkat di HP ini atau null, subscribed: ada langganan push di browser } */
    localState: function () {
      return Promise.all([getDevice(), MklPush.register()]).then(function (r) {
        var dev = r[0], reg = r[1];
        if (!reg || !reg.pushManager) return { local: dev, subscribed: false };
        return reg.pushManager.getSubscription().then(function (sub) { return { local: dev, subscribed: !!sub, sub: sub }; });
      });
    },

    enable: function () {
      if (!MklPush.supported()) return Promise.resolve({ success: false, message: 'Browser ini belum mendukung notifikasi.' });
      return global.Notification.requestPermission().then(function (perm) {
        if (perm !== 'granted') return { success: false, message: perm === 'denied' ? 'Izin notifikasi ditolak. Izinkan notifikasi untuk portal ini di pengaturan HP/browser, lalu coba lagi.' : 'Izin notifikasi belum diberikan.' };
        return MklApi.call('me.push.config', {}).then(function (cfg) {
          if (!cfg.success) return cfg;
          if (!cfg.data.enabled || !cfg.data.publicKey) return { success: false, message: 'Notifikasi HP belum diaktifkan admin.' };
          var key = b64ToBytes(cfg.data.publicKey);
          return MklPush.register().then(function (reg) {
            if (!reg) throw new Error('Service worker tidak bisa didaftarkan.');
            return reg.pushManager.getSubscription().then(function (old) {
              return old ? old.unsubscribe().catch(function () {}) : null;
            }).then(function () {
              return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
            });
          }).then(function (sub) {
            var j = sub.toJSON ? sub.toJSON() : {};
            var keys = j.keys || {};
            var p256dh = keys.p256dh || (sub.getKey ? bytesToB64u(sub.getKey('p256dh')) : '');
            var auth = keys.auth || (sub.getKey ? bytesToB64u(sub.getKey('auth')) : '');
            return MklApi.call('me.push.subscribe', { endpoint: sub.endpoint, p256dh: p256dh, auth: auth, userAgent: String(global.navigator.userAgent || '').slice(0, 300) });
          }).then(function (res) {
            if (!res.success) return res;
            var apiUrl = (global.MKL_CONFIG && global.MKL_CONFIG.API_URL) || '';
            return setDevice({ subId: res.data.subId, secret: res.data.secret, apiUrl: apiUrl, label: res.data.label, savedAt: new Date().toISOString() })
              .then(function () { return res; });
          });
        });
      }).catch(function (e) {
        return { success: false, message: 'Pengingat belum bisa diaktifkan di HP ini (' + String((e && e.message) || e).slice(0, 120) + '). Pastikan memakai Chrome di Android, atau di iPhone membuka portal dari ikon di layar utama.' };
      });
    },

    disable: function (subId) {
      return getDevice().then(function (dev) {
        var id = subId || (dev && dev.subId);
        var local = !subId || (dev && dev.subId === subId);
        var call = id ? MklApi.call('me.push.unsubscribe', { subId: id }) : Promise.resolve({ success: true, message: 'Pengingat dimatikan.' });
        return call.then(function (res) {
          if (!local) return res;
          return MklPush.register().then(function (reg) {
            return reg && reg.pushManager ? reg.pushManager.getSubscription() : null;
          }).then(function (sub) { return sub ? sub.unsubscribe().catch(function () {}) : null; })
            .then(function () { return setDevice(null).catch(function () {}); })
            .then(function () { return res; });
        });
      });
    },

    /** Kartu "Pengingat di HP" (Profil Saya dan halaman Absen). */
    card: function (opts) {
      opts = opts || {};
      var h = MklUI.h;
      var body = h('div', { class: 'stack push-card' }, MklUI.loadingState('Memeriksa HP ini...'));
      var card = MklUI.card(opts.title || 'Pengingat di HP', body);
      card.classList.add('push-section');

      function steps(list) { return h('ol', { class: 'push-steps' }, list.map(function (t) { return h('li', null, t); })); }
      function btn(label, variant, fn) {
        var b = h('button', { class: 'btn btn-' + (variant || 'secondary'), type: 'button' }, label);
        b.addEventListener('click', function () { fn(b); });
        return b;
      }

      function draw() {
        MklUI.clear(body).appendChild(MklUI.loadingState('Memeriksa HP ini...'));
        Promise.all([MklApi.call('me.push.config', {}), MklPush.localState()]).then(function (r) {
          var cfg = r[0], st = r[1];
          MklUI.clear(body);
          if (!cfg.success) { body.appendChild(MklUI.alertBox('error', cfg.message)); return; }
          var c = cfg.data;
          var intro = c.reminder ? 'Pengingat muncul di layar HP bila Anda belum absen masuk atau belum absen pulang, juga untuk pemberitahuan lain dari portal.'
            : 'Pemberitahuan dari portal (misalnya jadwal terbit atau pengajuan disetujui) muncul di layar HP.';
          body.appendChild(h('p', { class: 'muted' }, intro));
          if (!c.enabled) { body.appendChild(MklUI.alertBox('info', 'Notifikasi HP belum diaktifkan admin.')); return; }
          var here = st.local && st.subscribed && c.devices.some(function (d) { return d.subId === st.local.subId; });
          if (here) {
            body.appendChild(MklUI.alertBox('success', 'Aktif di HP ini' + (st.local.label ? ' (' + st.local.label + ')' : '') + '.'));
            body.appendChild(h('div', { class: 'form-actions' },
              btn('Kirim notifikasi uji', 'primary', function (b) {
                MklUI.setBusy(b, true, 'Mengirim...');
                MklApi.call('me.push.test', {}).then(function (res) { MklUI.setBusy(b, false); MklUI.toast(res.message, res.success ? 'success' : 'error', 8000); });
              }),
              btn('Matikan di HP ini', 'secondary', function (b) {
                MklUI.setBusy(b, true);
                MklPush.disable().then(function (res) { MklUI.setBusy(b, false); MklUI.toast(res.message, res.success ? 'success' : 'error'); draw(); });
              })));
          } else if (!MklPush.supported()) {
            if (MklPush.isIos() && !MklPush.standalone()) {
              body.appendChild(MklUI.alertBox('info', 'Di iPhone, pengingat hanya bisa muncul bila portal dibuka dari ikon di layar utama (iOS 16.4 atau lebih baru).'));
              body.appendChild(steps(['Buka portal ini di Safari.', 'Tekan tombol Bagikan (kotak dengan panah ke atas).', 'Pilih Tambah ke Layar Utama, lalu Tambah.', 'Tutup Safari. Buka Mookiland dari ikon baru di layar utama, lalu masuk.', 'Buka Profil Saya dan tekan Aktifkan pengingat di HP ini.']));
            } else {
              body.appendChild(MklUI.alertBox('warning', 'Browser ini belum mendukung notifikasi. Gunakan Chrome di Android, atau Safari di iPhone (iOS 16.4 atau lebih baru) dari ikon di layar utama.'));
            }
          } else if (MklPush.permission() === 'denied') {
            body.appendChild(MklUI.alertBox('warning', 'Izin notifikasi untuk portal ini ditolak di HP ini.'));
            body.appendChild(steps(MklPush.isIos()
              ? ['Buka Pengaturan iPhone, lalu Notifikasi.', 'Pilih Mookiland dan nyalakan Izinkan Notifikasi.', 'Buka lagi Mookiland dari ikon, lalu tekan Aktifkan pengingat di HP ini.']
              : ['Tekan ikon gembok/pengaturan di sebelah alamat portal (atau buka Info aplikasi Mookiland).', 'Pilih Notifikasi, lalu Izinkan.', 'Muat ulang portal, lalu tekan Aktifkan pengingat di HP ini.']));
          } else {
            if (MklPush.isAndroid() && !MklPush.standalone()) {
              body.appendChild(h('p', { class: 'small muted' }, 'Tips: agar seperti aplikasi, buka menu ⋮ di Chrome lalu pilih Tambahkan ke layar utama (atau Instal aplikasi).'));
            }
            body.appendChild(h('div', { class: 'form-actions' }, btn('Aktifkan pengingat di HP ini', 'primary', function (b) {
              MklUI.setBusy(b, true, 'Mengaktifkan...');
              MklPush.enable().then(function (res) {
                MklUI.setBusy(b, false);
                MklUI.toast(res.message, res.success ? 'success' : 'error', 8000);
                draw();
              });
            })));
            body.appendChild(h('p', { class: 'small muted' }, 'HP akan menanyakan izin notifikasi. Pilih Izinkan.'));
          }
          var others = c.devices.filter(function (d) { return !(st.local && d.subId === st.local.subId); });
          if (others.length && !opts.compact) {
            body.appendChild(h('p', { class: 'small muted' }, 'Perangkat lain yang aktif:'));
            body.appendChild(h('ul', { class: 'push-devices' }, others.map(function (d) {
              var off = btn('Matikan', 'secondary btn-small', function (b) {
                MklUI.setBusy(b, true);
                MklPush.disable(d.subId).then(function (res) { MklUI.toast(res.message, res.success ? 'success' : 'error'); draw(); });
              });
              return h('li', null, h('span', null, d.label || 'Perangkat', h('span', { class: 'muted small' }, ' · sejak ' + MklUI.fmtDate(String(d.since).slice(0, 10)))), off);
            })));
          }
        });
      }
      draw();
      return card;
    }
  };

  global.MklPush = MklPush;
})(window);
