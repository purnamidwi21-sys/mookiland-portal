/*
 * Mookiland Staff Portal - halaman uji koneksi (Tahap 2).
 * Data dari server selalu ditampilkan dengan textContent (bukan innerHTML)
 * agar teks tidak pernah dijalankan sebagai kode.
 */
(function () {
  'use strict';

  var cfg = window.MKL_CONFIG || {};

  function byId(id) { return document.getElementById(id); }

  function display(value) {
    return (value === undefined || value === null || value === '') ? '-' : String(value);
  }

  function renderResult(type, title, rows) {
    var box = byId('result');
    box.className = 'result result-' + type;
    box.textContent = '';

    var heading = document.createElement('strong');
    heading.textContent = title;
    box.appendChild(heading);

    if (rows && rows.length) {
      var list = document.createElement('dl');
      list.className = 'kv';
      rows.forEach(function (row) {
        var dt = document.createElement('dt');
        dt.textContent = row[0];
        var dd = document.createElement('dd');
        dd.textContent = display(row[1]);
        list.appendChild(dt);
        list.appendChild(dd);
      });
      box.appendChild(list);
    }
  }

  function checkConnection() {
    var btn = byId('btn-check');
    btn.disabled = true;
    btn.textContent = 'Memeriksa...';
    renderResult('info', 'Menghubungi server...', []);

    window.MklApi.call('system.ping', {}).then(function (res) {
      if (res.success) {
        var d = res.data || {};
        renderResult('ok', 'Terhubung', [
          ['Aplikasi', d.app],
          ['Versi server', d.version],
          ['Lingkungan', d.environment],
          ['Setup database', d.setupComplete ? 'Selesai' : 'Belum dijalankan'],
          ['Waktu server', d.serverTime],
          ['Kode permintaan', res.requestId]
        ]);
      } else {
        renderResult('error', 'Gagal terhubung', [
          ['Kode', res.errorCode],
          ['Keterangan', res.message],
          ['Kode permintaan', res.requestId]
        ]);
      }
      btn.disabled = false;
      btn.textContent = 'Cek Koneksi';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    byId('app-version').textContent = 'Versi frontend ' + display(cfg.APP_VERSION) + ' · ' + display(cfg.ENV);
    byId('btn-check').addEventListener('click', checkConnection);
  });
})();
