/*
 * Halaman Beranda.
 * Tahap 3a hanya menampilkan informasi akun dan fitur yang sudah tersedia.
 * Ringkasan profil, jadwal, absensi, cuti, dan slip gaji ditambahkan
 * setelah modul-modul tersebut selesai dibuat.
 */
(function () {
  'use strict';
  var h = MklUI.h;

  MklNav.register('/beranda', {
    title: 'Beranda',
    menu: { label: 'Beranda', order: 1 },
    render: function (root) {
      var u = MklState.user;
      root.appendChild(MklUI.pageHeader('Selamat datang, ' + u.displayName));

      var info = [
        ['Username', u.username],
        ['Role', h('span', { class: 'badge-row' }, u.roles.map(function (r) { return MklUI.badge(r.name, 'info'); }))]
      ];
      if (u.previousLoginAt !== undefined) {
        info.push(['Masuk sebelumnya', u.previousLoginAt ? MklUI.fmtDateTime(u.previousLoginAt) : 'Ini pertama kali Anda masuk']);
      }
      root.appendChild(MklUI.card('Akun Anda', MklUI.infoList(info)));

      var available = MklNav.menuItems(MklState.canAny).filter(function (m) { return m.path !== '/beranda'; });
      var list = h('ul', { class: 'link-list' },
        available.map(function (m) { return h('li', null, h('a', { href: '#' + m.path }, m.label)); }),
        h('li', null, h('a', { href: '#/ganti-password' }, 'Ganti Password')));
      root.appendChild(MklUI.card('Yang bisa Anda lakukan saat ini', list));

      root.appendChild(MklUI.card('Sedang dikembangkan', h('p', { class: 'muted' },
        'Profil, kepegawaian, kontrak, BPJS, jadwal, absensi, cuti, lembur, dan slip gaji akan muncul di menu setelah tahap berikutnya selesai dan diuji.')));
    }
  });
})();
