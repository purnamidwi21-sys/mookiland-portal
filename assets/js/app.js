/*
 * Mookiland Staff Portal - kerangka aplikasi: tata letak, menu, masuk/keluar.
 */
(function () {
  'use strict';
  var h = MklUI.h;
  var VERSION = '0.3.0';

  function appRoot() {
    return document.getElementById('app');
  }

  function bareLayout() {
    var root = appRoot();
    root.className = 'layout-bare';
    MklUI.clear(root);
    var main = h('main', { class: 'bare-main', id: 'main' });
    root.appendChild(main);
    root.appendChild(h('footer', { class: 'footer' }, 'Mookiland Staff Portal · versi ' + VERSION));
    return main;
  }

  function shellLayout(activePath) {
    var root = appRoot();
    root.className = 'layout-shell';
    MklUI.clear(root);
    var user = MklState.user;

    var menuBtn = h('button', { class: 'btn btn-ghost menu-toggle', type: 'button', 'aria-controls': 'sidebar', 'aria-expanded': 'false' }, 'Menu');
    var header = h('header', { class: 'app-header' },
      menuBtn,
      h('a', { class: 'brand', href: '#/beranda' },
        h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, 'M'),
        h('span', { class: 'brand-name' }, 'Mookiland Staff Portal')),
      h('span', { class: 'header-user' }, user.displayName));

    var items = MklNav.menuItems(MklState.canAny);
    var nav = h('nav', { class: 'sidebar', id: 'sidebar', 'aria-label': 'Menu utama' });
    var lastSection = null;
    var list = h('ul', { class: 'nav-list' });
    items.forEach(function (it) {
      if (it.section && it.section !== lastSection) {
        list.appendChild(h('li', { class: 'nav-section' }, it.section));
        lastSection = it.section;
      }
      var current = activePath === it.path || activePath.indexOf(it.path + '/') === 0;
      list.appendChild(h('li', null, h('a', { href: '#' + it.path, class: 'nav-link', 'aria-current': current ? 'page' : null }, it.label)));
    });
    var logoutBtn = h('button', { class: 'nav-link nav-button', type: 'button' }, 'Keluar');
    logoutBtn.addEventListener('click', function () { logout(); });
    nav.appendChild(list);
    nav.appendChild(h('ul', { class: 'nav-list nav-bottom' },
      h('li', null, h('a', { href: '#/ganti-password', class: 'nav-link', 'aria-current': activePath === '/ganti-password' ? 'page' : null }, 'Ganti Password')),
      h('li', null, logoutBtn)));

    var backdrop = h('div', { class: 'sidebar-backdrop' });
    function setOpen(open) {
      root.classList.toggle('sidebar-open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    menuBtn.addEventListener('click', function () { setOpen(!root.classList.contains('sidebar-open')); });
    backdrop.addEventListener('click', function () { setOpen(false); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });

    var main = h('main', { class: 'app-main', id: 'main' });
    root.appendChild(header);
    root.appendChild(nav);
    root.appendChild(backdrop);
    root.appendChild(main);
    return main;
  }

  function forbidden(container) {
    container.appendChild(MklUI.pageHeader('Tidak ada akses'));
    container.appendChild(MklUI.card(null, [
      h('p', null, 'Anda tidak memiliki akses ke halaman ini. Jika memang dibutuhkan untuk pekerjaan Anda, hubungi atasan atau admin.'),
      h('a', { class: 'btn btn-secondary', href: '#/beranda' }, 'Kembali ke Beranda')
    ]));
  }

  function route() {
    var m = MklNav.match(window.location.hash);
    var user = MklState.user;
    if (!m) { MklNav.go(user ? '/beranda' : '/masuk'); return; }
    var def = m.def;
    if (!def.public && !user) { MklNav.go('/masuk'); return; }
    if (def.redirectIfAuthed && user) { MklNav.go('/beranda'); return; }
    if (user && user.mustChangePassword && !def.public && m.path !== '/ganti-password') { MklNav.go('/ganti-password'); return; }

    document.title = def.title + ' · Mookiland Staff Portal';
    var container = (def.layout === 'bare') ? bareLayout() : shellLayout(m.actualPath);
    if (def.perm && !MklState.canAny([].concat(def.perm))) {
      forbidden(container);
    } else {
      def.render(container, m.params);
    }
    var heading = container.querySelector('.page-title');
    if (heading && def.layout !== 'bare') heading.focus();
    window.scrollTo(0, 0);
  }

  function startIdle() {
    var minutes = (MklState.user && MklState.user.sessionIdleMinutes) || 30;
    MklState.startIdleWatch(minutes, function () {
      // Permintaan keluar dibuat lebih dulu (selagi token masih ada), baru sesi di browser dihapus.
      MklApi.call('auth.logout', {});
      endSession('Sesi Anda berakhir karena tidak ada aktivitas selama ' + minutes + ' menit. Silakan masuk kembali.', 'warning');
    });
  }

  var PREV_LOGIN_KEY = 'mkl_prev_login';

  /** Waktu "masuk sebelumnya" hanya dikirim server saat login; disimpan untuk tab ini. */
  function rememberPreviousLogin(user) {
    try {
      if (user.previousLoginAt !== undefined) {
        window.sessionStorage.setItem(PREV_LOGIN_KEY, user.previousLoginAt || '');
      } else {
        var saved = window.sessionStorage.getItem(PREV_LOGIN_KEY);
        if (saved !== null) user.previousLoginAt = saved;
      }
    } catch (e) { /* penyimpanan tidak tersedia: abaikan */ }
  }

  function endSession(message, type) {
    try { window.sessionStorage.removeItem(PREV_LOGIN_KEY); } catch (e) { /* abaikan */ }
    MklApi.setToken(null);
    MklState.clear();
    MklUI.clear(document.getElementById('modal-root'));
    document.body.classList.remove('modal-open');
    if (message) MklState.setFlash(type || 'info', message);
    MklNav.go('/masuk');
  }

  function logout() {
    var token = MklApi.getToken();
    if (!token) { endSession('Anda telah keluar.', 'success'); return; }
    MklApi.call('auth.logout', {}).then(function () {
      endSession('Anda telah keluar.', 'success');
    });
  }

  var MklApp = {
    VERSION: VERSION,

    afterLogin: function (user) {
      rememberPreviousLogin(user);
      MklState.set(user);
      startIdle();
      MklNav.go(user.mustChangePassword ? '/ganti-password' : '/beranda');
    },

    logout: logout
  };
  window.MklApp = MklApp;

  function boot() {
    MklApi.onAuthLost(function (res) {
      if (!MklState.user) return;
      endSession(res.message || 'Sesi Anda telah berakhir. Silakan masuk kembali.', 'warning');
    });
    MklApi.onPasswordChangeRequired(function () {
      if (MklState.user) MklState.user.mustChangePassword = true;
      MklNav.go('/ganti-password');
    });
    window.addEventListener('hashchange', route);

    if (!MklApi.getToken()) { route(); return; }
    MklApi.call('auth.me', {}).then(function (res) {
      if (res.success) {
        rememberPreviousLogin(res.data.user);
        MklState.set(res.data.user);
        startIdle();
      } else if (res.errorCode !== 'SESSION_EXPIRED' && res.errorCode !== 'UNAUTHENTICATED') {
        MklState.setFlash('error', res.message);
      }
      route();
    });
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
