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
  var TIMEOUT_MS = 45000;
  var listeners = { authLost: [], passwordChange: [] };

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

  function emit(name, data) {
    listeners[name].forEach(function (fn) {
      try { fn(data); } catch (e) { /* abaikan */ }
    });
  }

  /**
   * Memanggil action di server.
   * Selalu mengembalikan Promise berisi objek { success, data?, errorCode?, message, details? }.
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
    var client = '';
    try { client = String(global.navigator.userAgent || '').slice(0, 200); } catch (e) { client = ''; }

    var options = {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, payload: payload || {}, token: getToken(), client: client }),
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
          return data;
        });
      })
      .catch(function (err) {
        if (err && err.name === 'AbortError') {
          return failure('TIMEOUT', 'Server terlalu lama merespons. Periksa koneksi lalu coba lagi.');
        }
        return failure('NETWORK_ERROR',
          'Tidak dapat terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.');
      })
      .then(function (result) {
        if (timer) clearTimeout(timer);
        if (!result.success && action !== 'auth.login') {
          if (result.errorCode === 'SESSION_EXPIRED' || result.errorCode === 'UNAUTHENTICATED') {
            setToken(null);
            emit('authLost', result);
          } else if (result.errorCode === 'PASSWORD_CHANGE_REQUIRED') {
            emit('passwordChange', result);
          }
        }
        return result;
      });
  }

  global.MklApi = Object.freeze({
    call: call,
    getToken: getToken,
    setToken: setToken,
    onAuthLost: function (fn) { listeners.authLost.push(fn); },
    onPasswordChangeRequired: function (fn) { listeners.passwordChange.push(fn); }
  });
})(window);
