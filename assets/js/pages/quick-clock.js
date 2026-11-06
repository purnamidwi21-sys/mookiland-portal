/*
 * Absen Cepat (0.15.0): absen dari ikon portal di HP tanpa login.
 *
 * HP didaftarkan sekali dari menu Absen (sudah login) sambil membuat PIN 6 angka. Server memberi
 * kode perangkat yang disimpan di HP ini. Setelah itu, membuka ikon portal langsung menampilkan
 * tombol Absen: tekan, ketik PIN, selesai. Server yang memeriksa semuanya (kode perangkat, PIN,
 * lokasi GPS, jam) dan memilih sendiri absen masuk atau pulang.
 */
(function () {
  'use strict';
  var h = MklUI.h;
  var KEY = 'mkl_quick_clock';

  // ------------------------------------------------------------------ penyimpanan di HP ini
  function load() {
    try {
      var v = JSON.parse(window.localStorage.getItem(KEY) || 'null');
      return v && v.deviceId && v.token ? v : null;
    } catch (e) { return null; }
  }
  function save(v) { try { window.localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* abaikan */ } }
  function forget() { try { window.localStorage.removeItem(KEY); } catch (e) { /* abaikan */ } }

  function standalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  }
  function isIos() { return /iPhone|iPad|iPod/.test(window.navigator.userAgent || ''); }

  /** Notifikasi di layar HP langsung dari HP ini (tanpa menunggu antrean server). */
  function notify(title, body) {
    try {
      if (!('Notification' in window) || window.Notification.permission !== 'granted') return;
      var base = window.location.href.split('#')[0].replace(/index\.html$/, '');
      var opts = { body: body, tag: 'mkl-absen', icon: base + 'assets/icons/icon-192.png', badge: base + 'assets/icons/badge-96.png', data: { url: base + 'index.html#/absensi-saya' } };
      if (window.MklPush && 'serviceWorker' in window.navigator) {
        MklPush.register().then(function (reg) {
          if (reg && reg.showNotification) return reg.showNotification(title, opts);
          return new window.Notification(title, opts);
        }).catch(function () { /* abaikan */ });
      } else {
        new window.Notification(title, opts); // eslint-disable-line no-new
      }
    } catch (e) { /* abaikan */ }
  }

  function askNotificationPermission() {
    try {
      if ('Notification' in window && window.Notification.permission === 'default') {
        var p = window.Notification.requestPermission();
        if (p && p.catch) p.catch(function () { /* abaikan */ });
      }
    } catch (e) { /* abaikan */ }
  }

  // ------------------------------------------------------------------ halaman Absen Cepat (tanpa login)
  MklNav.register('/absen-cepat', {
    title: 'Absen Cepat',
    public: true,
    layout: 'bare',
    render: function (root) {
      var wrap = h('div', { class: 'quick-wrap' });
      root.appendChild(wrap);
      if (window.MklPush) MklPush.register();
      var dev = load();
      if (!dev) { notActive(wrap, null); return; }
      refresh();

      function refresh(flash) {
        MklUI.clear(wrap).appendChild(MklUI.loadingState('Memuat...'));
        MklApi.call('quick.status', { deviceId: dev.deviceId, token: dev.token }).then(function (res) {
          MklUI.clear(wrap);
          if (!res.success) {
            if (res.details && res.details.quick === 'inactive') { forget(); notActive(wrap, res.message); return; }
            wrap.appendChild(header(dev.name || ''));
            wrap.appendChild(MklUI.alertBox('error', res.message));
            var retry = h('button', { class: 'btn btn-secondary btn-block', type: 'button' }, 'Coba lagi');
            retry.addEventListener('click', function () { refresh(); });
            wrap.appendChild(retry);
            wrap.appendChild(footerLinks());
            return;
          }
          if (res.data.name && res.data.name !== dev.name) { dev.name = res.data.name; save(dev); }
          paint(res.data, flash);
        });
      }

      function header(name) {
        return h('div', { class: 'quick-head' },
          h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, 'M'),
          h('div', null,
            h('h1', { class: 'page-title quick-title', tabindex: '-1' }, name ? 'Halo, ' + name : 'Absen Cepat'),
            h('p', { class: 'muted small' }, 'Mookiland · Absen Cepat')));
      }

      function paint(d, flash) {
        wrap.appendChild(header(d.name));
        var shift = d.shift ? d.shift.name + ' ' + d.shift.start + '–' + d.shift.end : (d.off ? 'Libur' : 'Tidak ada jadwal terbit');
        wrap.appendChild(h('p', { class: 'quick-date' }, MklTimeUI.dayLabel(d.today, true) + ' · ' + shift));
        wrap.appendChild(h('div', { class: 'clock-status' },
          h('div', { class: 'clock-box' }, h('span', { class: 'muted small' }, 'Masuk'), h('span', { class: 'clock-time' }, d.clockIn || '--:--')),
          h('div', { class: 'clock-box' }, h('span', { class: 'muted small' }, 'Pulang'), h('span', { class: 'clock-time' }, d.clockOut || '--:--'))));

        var slot = h('div', { class: 'quick-slot', 'aria-live': 'polite' });
        if (flash) wrap.appendChild(flash);
        var label, enabled = true, hint = '';
        if (d.action === 'in') { label = 'Absen Masuk'; if (!d.shift) hint = d.off ? 'Hari ini Anda Libur. Absen tetap bisa, tetapi akan diperiksa HR.' : 'Tidak ada jadwal saat ini. Absen tetap bisa, tetapi akan diperiksa HR.'; }
        else if (d.action === 'out') label = 'Absen Pulang';
        else if (d.action === 'wait') { label = 'Absen Pulang'; enabled = false; hint = 'Tombol Absen Pulang aktif mulai pukul ' + d.outFrom + '. Harus pulang lebih awal? Masuk ke portal, lalu buka menu Absen.'; }
        else { label = 'Absen hari ini lengkap'; enabled = false; }
        if (d.lockedUntil) { enabled = false; hint = 'PIN salah terlalu sering. Absen Cepat terkunci sampai pukul ' + d.lockedUntil + '. Untuk absen sekarang, masuk ke portal lalu buka menu Absen.'; }
        if (!d.locations.length) { enabled = false; hint = 'Lokasi kerja belum diatur HR, sehingga absen belum bisa dilakukan.'; }

        var btn = h('button', { class: 'quick-btn quick-btn-' + (d.action === 'out' || d.action === 'wait' ? 'out' : 'in'), type: 'button' },
          h('span', { class: 'quick-btn-label' }, label));
        btn.disabled = !enabled;
        btn.addEventListener('click', function () { startClock(d, slot); });
        wrap.appendChild(h('div', { class: 'quick-btn-wrap' }, btn));
        if (hint) wrap.appendChild(h('p', { class: 'muted center quick-hint' }, hint));
        wrap.appendChild(slot);
        wrap.appendChild(footerLinks());
      }

      function startClock(d, slot) {
        MklUI.clear(slot);
        // Lokasi dicari sambil karyawan mengetik PIN.
        var gps = MklTimeUI.getPosition();
        gps.catch(function () { /* ditangani saat PIN selesai */ });
        pinPad({
          title: d.action === 'out' ? 'Absen Pulang' : 'Absen Masuk',
          onPin: function (pin, pad) {
            pad.busy('Mencari lokasi...');
            gps.then(function (pos) {
              pad.busy('Mengirim...');
              return MklApi.call('quick.clock', {
                deviceId: dev.deviceId, token: dev.token, pin: pin,
                latitude: pos.latitude.toFixed(6), longitude: pos.longitude.toFixed(6), accuracy: pos.accuracy
              });
            }).then(function (res) {
              if (res.success) {
                pad.close();
                var title = (res.data.type === 'out' ? 'Absen pulang' : 'Absen masuk') + ' tercatat ' + res.data.time;
                notify(title, res.message);
                try { if (window.navigator.vibrate) window.navigator.vibrate(200); } catch (e) { /* abaikan */ }
                refresh(h('div', { class: 'quick-done' }, h('span', { class: 'quick-check', 'aria-hidden': 'true' }, '✓'), h('strong', null, title), h('p', null, res.message)));
                return;
              }
              var q = res.details && res.details.quick;
              if (q === 'pin') { pad.wrong(res.message); return; }
              pad.close();
              if (q === 'inactive') { forget(); MklUI.clear(wrap); notActive(wrap, res.message); return; }
              slot.appendChild(MklUI.alertBox('error', res.message));
              if (q === 'locked' || q === 'wait' || q === 'done') refresh(MklUI.alertBox('error', res.message));
            }, function (err) {
              pad.close();
              slot.appendChild(MklUI.alertBox('error', err.message));
            });
          }
        });
      }

      function footerLinks() {
        var remove = h('button', { class: 'btn btn-ghost btn-small', type: 'button' }, 'Hapus Absen Cepat dari HP ini');
        remove.addEventListener('click', function () {
          MklUI.confirmAction({
            title: 'Hapus Absen Cepat?',
            message: 'Setelah dihapus, absen dari HP ini harus lewat login biasa sampai Absen Cepat diaktifkan lagi di menu Absen.',
            confirmLabel: 'Hapus', danger: true,
            onConfirm: function () {
              return MklApi.call('quick.unregister', { deviceId: dev.deviceId, token: dev.token }).then(function (res) {
                forget();
                MklUI.clear(wrap);
                notActive(wrap, 'Absen Cepat sudah dihapus dari HP ini.');
                return res;
              });
            }
          });
        });
        return h('div', { class: 'quick-links' },
          h('a', { class: 'btn btn-secondary btn-block', href: '#/masuk' }, 'Masuk ke portal lengkap'),
          remove);
      }
    }
  });

  function notActive(wrap, message) {
    wrap.appendChild(h('div', { class: 'auth-card card stack' },
      h('h1', { class: 'page-title', tabindex: '-1' }, 'Absen Cepat'),
      message ? MklUI.alertBox('info', message) : null,
      h('p', null, 'Absen Cepat belum aktif di HP ini. Cara mengaktifkan:'),
      h('ol', { class: 'plain-list numbered' },
        h('li', null, 'Masuk ke portal dengan username dan password.'),
        h('li', null, 'Buka menu Absen, lalu tekan Aktifkan di HP ini dan buat PIN 6 angka.')),
      h('a', { class: 'btn btn-primary btn-block', href: '#/masuk' }, 'Masuk ke portal')));
  }

  /** Papan angka PIN 6 digit. opts: {title, onPin(pin, ctl)} */
  function pinPad(opts) {
    var digits = '';
    var dots = h('div', { class: 'pin-dots', 'aria-hidden': 'true' });
    var status = h('p', { class: 'pin-status', role: 'status', 'aria-live': 'polite' }, 'Ketik PIN 6 angka Anda.');
    var keys = h('div', { class: 'pin-keys' });
    var locked = false;
    function draw() {
      MklUI.clear(dots);
      for (var i = 0; i < 6; i++) dots.appendChild(h('span', { class: 'pin-dot' + (i < digits.length ? ' filled' : '') }));
    }
    function press(k) {
      if (locked) return;
      if (k === 'del') { digits = digits.slice(0, -1); draw(); return; }
      if (digits.length >= 6) return;
      digits += k;
      draw();
      if (digits.length === 6) { locked = true; opts.onPin(digits, ctl); }
    }
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].forEach(function (k) {
      if (!k) { keys.appendChild(h('span')); return; }
      var b = h('button', { class: 'pin-key', type: 'button', 'aria-label': k === 'del' ? 'Hapus angka' : k }, k === 'del' ? '⌫' : k);
      b.addEventListener('click', function () { press(k); });
      keys.appendChild(b);
    });
    var box = h('div', { class: 'pin-pad' }, dots, status, keys);
    var m = MklUI.modal({ title: opts.title + ' · PIN', content: box });
    function onKey(e) { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('del'); }
    document.addEventListener('keydown', onKey);
    var ctl = {
      busy: function (text) { status.textContent = text; status.className = 'pin-status'; },
      wrong: function (msg) {
        digits = ''; locked = false; draw();
        status.textContent = msg; status.className = 'pin-status pin-error';
        dots.classList.remove('shake'); void dots.offsetWidth; dots.classList.add('shake');
      },
      close: function () { document.removeEventListener('keydown', onKey); m.close(); }
    };
    draw();
    return ctl;
  }

  // ------------------------------------------------------------------ kartu pengaturan di menu Absen
  function setupCard() {
    var body = h('div', { class: 'stack' });
    var card = MklUI.card('Absen Cepat tanpa login', body);
    function paint() {
      MklUI.clear(body).appendChild(MklUI.loadingState('Memuat...'));
      var local = load();
      MklApi.call('me.quick.status', local ? { deviceId: local.deviceId } : {}).then(function (res) {
        MklUI.clear(body);
        if (!res.success) { body.appendChild(MklUI.errorState(res, paint)); return; }
        var d = res.data;
        if (local && !d.thisDevice) { forget(); local = null; }
        if (d.thisDevice) {
          body.appendChild(MklUI.alertBox('success', 'Absen Cepat aktif di HP ini. Buka ikon Mookiland di layar HP, tekan tombol Absen, lalu ketik PIN.'));
          var off = h('button', { class: 'btn btn-secondary', type: 'button' }, 'Matikan');
          off.addEventListener('click', function () {
            MklUI.confirmAction({ title: 'Matikan Absen Cepat?', message: 'Absen dari HP ini akan kembali lewat login biasa.', confirmLabel: 'Matikan', danger: true,
              onConfirm: function () { return MklApi.call('me.quick.revoke', {}).then(function (r) { if (r.success) { forget(); paint(); } return r; }); } });
          });
          body.appendChild(h('div', { class: 'form-actions' }, h('a', { class: 'btn btn-primary', href: '#/absen-cepat' }, 'Buka Absen Cepat'), off));
          return;
        }
        body.appendChild(h('p', null, 'Absen tanpa login: buka ikon Mookiland di layar HP, tekan tombol Absen, lalu ketik PIN 6 angka. Tombol Absen Pulang aktif mulai ' + d.outBeforeMinutes + ' menit sebelum jam pulang shift.'));
        if (d.active) body.appendChild(MklUI.alertBox('info', 'Absen Cepat sekarang aktif di HP lain (' + d.label + '). Mengaktifkan di HP ini otomatis mematikan yang lama.'));
        if (isIos() && !standalone()) body.appendChild(MklUI.alertBox('warning', 'Di iPhone, aktifkan dari ikon Mookiland di layar utama (bukan dari Safari), supaya Absen Cepat tersimpan di ikon itu.'));
        var on = h('button', { class: 'btn btn-primary', type: 'button' }, 'Aktifkan di HP ini');
        on.addEventListener('click', openRegister);
        body.appendChild(on);
      });
    }

    function openRegister() {
      askNotificationPermission();
      var form = h('form', { class: 'stack', novalidate: true });
      var pin = MklUI.field({ label: 'Buat PIN 6 angka', name: 'pin', type: 'password', inputmode: 'numeric', maxLength: 6, required: true, autocomplete: 'off', hint: 'Bukan angka yang sama semua atau berurutan. Jangan beri tahu PIN ini ke siapa pun.' });
      var pin2 = MklUI.field({ label: 'Ulangi PIN', name: 'pinConfirm', type: 'password', inputmode: 'numeric', maxLength: 6, required: true, autocomplete: 'off' });
      var alertSlot = h('div');
      form.appendChild(pin.wrap); form.appendChild(pin2.wrap); form.appendChild(alertSlot);
      var m = MklUI.modal({
        title: 'Aktifkan Absen Cepat', content: form,
        actions: [
          { label: 'Batal', variant: 'secondary', onClick: function (c) { c.close(); } },
          { label: 'Aktifkan', variant: 'primary', id: 'ok', onClick: submit }
        ]
      });
      form.addEventListener('submit', function (e) { e.preventDefault(); submit(m, m.buttons.ok); });
      function submit(c, btn) {
        MklUI.clearFieldErrors(form); MklUI.clear(alertSlot);
        MklUI.setBusy(btn, true, 'Mengaktifkan...');
        MklApi.call('me.quick.register', { pin: pin.input.value.trim(), pinConfirm: pin2.input.value.trim(), label: window.navigator.userAgent || '' }).then(function (res) {
          MklUI.setBusy(btn, false);
          if (!res.success) { if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message)); return; }
          var u = MklState.user || {};
          save({ deviceId: res.data.deviceId, token: res.data.token, name: String(u.displayName || '').split(' ')[0] });
          c.close();
          MklUI.toast(res.message, 'success');
          paint();
        });
      }
    }
    paint();
    return card;
  }

  window.MklQuick = { has: function () { return !!load(); }, setupCard: setupCard };
})();
