/*
 * Mookiland Staff Portal - status pengguna yang sedang masuk.
 *
 * Permission di sini hanya dipakai untuk menampilkan atau menyembunyikan
 * menu. Server tetap memeriksa hak akses pada setiap permintaan.
 */
(function (global) {
  'use strict';

  var user = null;
  var flash = null;
  var idle = { timer: null, last: 0, minutes: 30, onExpire: null };

  function markActivity() {
    idle.last = Date.now();
  }

  var MklState = {
    get user() { return user; },

    set: function (u) { user = u; },

    clear: function () {
      user = null;
      MklState.stopIdleWatch();
    },

    can: function (perm) {
      return !!user && user.permissions.indexOf(perm) !== -1;
    },

    canAny: function (perms) {
      if (!perms || !perms.length) return true;
      for (var i = 0; i < perms.length; i++) {
        if (MklState.can(perms[i])) return true;
      }
      return false;
    },

    roleNames: function () {
      return user ? user.roles.map(function (r) { return r.name; }) : [];
    },

    /** Pesan sekali tampil untuk halaman berikutnya (mis. "Sesi berakhir"). */
    setFlash: function (type, message) { flash = { type: type, message: message }; },
    takeFlash: function () { var f = flash; flash = null; return f; },

    /** Keluar otomatis di browser jika tidak ada aktivitas. Server juga memeriksa hal ini. */
    startIdleWatch: function (minutes, onExpire) {
      MklState.stopIdleWatch();
      idle.minutes = minutes || 30;
      idle.onExpire = onExpire;
      markActivity();
      ['click', 'keydown', 'touchstart', 'scroll'].forEach(function (ev) {
        global.addEventListener(ev, markActivity, { passive: true });
      });
      idle.timer = global.setInterval(function () {
        if (Date.now() - idle.last > idle.minutes * 60000) {
          var cb = idle.onExpire;
          MklState.stopIdleWatch();
          if (cb) cb();
        }
      }, 30000);
    },

    stopIdleWatch: function () {
      if (idle.timer) global.clearInterval(idle.timer);
      idle.timer = null;
      ['click', 'keydown', 'touchstart', 'scroll'].forEach(function (ev) {
        global.removeEventListener(ev, markActivity);
      });
    }
  };

  global.MklState = MklState;
})(window);
