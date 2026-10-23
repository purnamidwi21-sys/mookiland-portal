/*
 * Mookiland Staff Portal - daftar halaman dan navigasi berbasis #alamat.
 *
 * Setiap halaman mendaftar dengan MklNav.register(path, definisi):
 *   path    : '/beranda' atau '/admin/pengguna/:id'
 *   title   : judul halaman
 *   public  : true jika boleh dibuka tanpa masuk
 *   layout  : 'bare' (tanpa menu) atau 'shell' (dengan menu, bawaan)
 *   perm    : permission yang dibutuhkan (satu atau daftar; cukup salah satu)
 *   menu    : { label, order, section } jika tampil di menu samping
 *   render  : function (container, params)
 */
(function (global) {
  'use strict';

  var routes = [];

  function compile(path) {
    var keys = [];
    var pattern = path.replace(/:([a-zA-Z]+)/g, function (m, key) {
      keys.push(key);
      return '([A-Za-z0-9-]+)';
    });
    return { regex: new RegExp('^' + pattern + '$'), keys: keys };
  }

  var MklNav = {
    register: function (path, def) {
      var c = compile(path);
      routes.push({ path: path, regex: c.regex, keys: c.keys, def: def });
    },

    /** Mencocokkan location.hash dengan halaman terdaftar. */
    match: function (hash) {
      var path = String(hash || '').replace(/^#/, '') || '/';
      for (var i = 0; i < routes.length; i++) {
        var m = routes[i].regex.exec(path);
        if (m) {
          var params = {};
          routes[i].keys.forEach(function (k, idx) { params[k] = decodeURIComponent(m[idx + 1]); });
          return { path: routes[i].path, actualPath: path, params: params, def: routes[i].def };
        }
      }
      return null;
    },

    go: function (path) {
      if (global.location.hash === '#' + path) {
        global.dispatchEvent(new global.HashChangeEvent('hashchange'));
      } else {
        global.location.hash = '#' + path;
      }
    },

    /** Halaman yang tampil di menu untuk pengguna saat ini. */
    menuItems: function (canAny) {
      return routes.filter(function (r) {
        return r.def.menu && canAny(r.def.perm ? [].concat(r.def.perm) : []);
      }).map(function (r) {
        return { path: r.path, label: r.def.menu.label, order: r.def.menu.order || 50, section: r.def.menu.section || '' };
      }).sort(function (a, b) { return a.order - b.order; });
    }
  };

  global.MklNav = MklNav;
})(window);
