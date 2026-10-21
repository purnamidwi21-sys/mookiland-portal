/*
 * Mookiland Staff Portal - penghubung ke server (Google Apps Script).
 *
 * Semua permintaan dikirim sebagai POST dengan Content-Type text/plain
 * agar diterima Apps Script tanpa pemeriksaan CORS tambahan.
 * Token sesi disimpan di sessionStorage (hilang saat tab ditutup) dan
 * selalu dikirim di dalam isi permintaan, tidak pernah di URL.
 */
(function (global) {
  'use strict';

  var TOKEN_KEY = 'mkl_session_token';
  var TIMEOUT_MS = 30000;

  function getToken() {
    try { return global.sessionStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
  }

  function setToken(token) {
    try {
      if (token) global.sessionStorage.setItem(TOKEN_KEY, token);
      else global.sessionStorage.removeItem(TOKEN_KEY);
    } catch (e) { /* penyimpanan tidak tersedia: abaikan */ }
  }

  function failure(code, message) {
    return { success: false, errorCode: code, message: message };
  }

  /**
   * Memanggil action di server.
   * Selalu mengembalikan Promise berisi objek { success, data?, errorCode?, message }.
   * Tidak pernah melempar error, sehingga halaman cukup memeriksa res.success.
   */
  function call(action, payload) {
    var cfg = global.MKL_CONFIG || {};
    var url = String(cfg.API_URL || '');
    if (url.indexOf('https://script.google.com/') !== 0 || !/\/exec$/.test(url)) {
      return Promise.resolve(failure('CONFIG_ERROR',
        'Alamat server belum diatur dengan benar di config.js (harus diawali https://script.google.com/ dan berakhiran /exec).'));
    }

    var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, TIMEOUT_MS) : null;

    var options = {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, payload: payload || {}, token: getToken() }),
      redirect: 'follow',
      credentials: 'omit',
      cache: 'no-store'
    };
    if (controller) options.signal = controller.signal;

    return fetch(url, options)
      .then(function (res) {
        if (!res.ok) {
          return failure('HTTP_' + res.status, 'Server merespons dengan kesalahan (' + res.status + '). Coba lagi beberapa saat.');
        }
        return res.text().then(function (text) {
          var data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            return failure('BAD_RESPONSE',
              'Respons server tidak dapat dibaca. Pastikan Web App di-deploy dengan akses "Anyone" dan URL berakhiran /exec.');
          }
          if (!data || typeof data.success !== 'boolean') {
            return failure('BAD_RESPONSE', 'Respons server tidak sesuai format.');
          }
          if (data.errorCode === 'SESSION_EXPIRED' || data.errorCode === 'UNAUTHENTICATED') {
            setToken(null);
          }
          return data;
        });
      })
      .catch(function (err) {
        if (err && err.name === 'AbortError') {
          return failure('TIMEOUT', 'Server terlalu lama merespons. Coba lagi.');
        }
        return failure('NETWORK_ERROR',
          'Tidak dapat terhubung ke server. Periksa koneksi internet, atau pastikan Web App di-deploy dengan akses "Anyone".');
      })
      .then(function (result) {
        if (timer) clearTimeout(timer);
        return result;
      });
  }

  global.MklApi = Object.freeze({ call: call, getToken: getToken, setToken: setToken });
})(window);
