/*
 * Halaman Beranda: akun, ringkasan kepegawaian sendiri, dan ringkasan
 * karyawan untuk HR atau tim untuk Supervisor. Ringkasan jadwal, absensi,
 * cuti, dan slip gaji ditambahkan setelah modul-modul tersebut selesai.
 */
(function () {
  'use strict';
  var h = MklUI.h;

  function summaryCard(title, loader) {
    var body = h('div', null, MklUI.loadingState('Memuat...'));
    loader(body);
    return MklUI.card(title, body);
  }

  function stat(label, value, href, variant) {
    return h(href ? 'a' : 'div', { class: 'stat' + (variant ? ' stat-' + variant : ''), href: href || null },
      h('span', { class: 'stat-value' }, String(value)), h('span', { class: 'stat-label' }, label));
  }

  MklNav.register('/beranda', {
    title: 'Beranda',
    menu: { label: 'Beranda', order: 1 },
    render: function (root) {
      var u = MklState.user;
      root.appendChild(MklUI.pageHeader('Selamat datang, ' + u.displayName));

      if (MklState.can('profile.read.own')) {
        root.appendChild(summaryCard('Kepegawaian Anda', function (body) {
          MklApi.call('me.profile', {}).then(function (res) {
            MklUI.clear(body);
            if (!res.success) { body.appendChild(MklUI.alertBox('error', res.message)); return; }
            var me = res.data;
            if (!me.linked) {
              body.appendChild(h('p', { class: 'muted' }, 'Akun Anda belum terhubung dengan data karyawan. Hubungi HR.'));
              return;
            }
            if (me.missingContact && me.missingContact.length) {
              body.appendChild(MklUI.alertBox('warning', 'Mohon lengkapi data kontak Anda: ' + me.missingContact.join(', ') + '.'));
            }
            body.appendChild(MklUI.infoList([
              ['Employee ID', me.employeeId],
              ['Jabatan', me.positionName],
              ['Atasan langsung', me.supervisorName],
              ['Masa kerja', me.tenure]
            ]));
            body.appendChild(h('div', { class: 'form-actions' },
              h('a', { class: 'btn btn-secondary btn-small', href: '#/profil' }, 'Profil Saya'),
              h('a', { class: 'btn btn-secondary btn-small', href: '#/kepegawaian' }, 'Kepegawaian Saya')));
          });
        }));
      }

      if (MklState.can('employee.manage')) {
        root.appendChild(summaryCard('Ringkasan karyawan', function (body) {
          MklApi.call('hr.employees.list', { status: 'active', pageSize: 100 }).then(function (res) {
            MklUI.clear(body);
            if (!res.success) { body.appendChild(MklUI.alertBox('error', res.message)); return; }
            var items = res.data.items;
            var incomplete = items.filter(function (v) { return v.missing && v.missing.length; }).length;
            var noAccount = items.filter(function (v) { return !v.account; }).length;
            body.appendChild(h('div', { class: 'stats' },
              stat('Karyawan aktif', res.data.total, '#/karyawan'),
              stat('Data belum lengkap', incomplete, '#/karyawan', incomplete ? 'warning' : null),
              stat('Belum punya akun', noAccount, '#/karyawan', noAccount ? 'warning' : null)));
            if (!res.data.total) {
              body.appendChild(h('p', null, 'Belum ada data karyawan. ', h('a', { href: '#/karyawan/impor' }, 'Impor dari Excel'), ' atau tambahkan satu per satu di menu Karyawan.'));
            }
          });
        }));
      } else if (MklState.can('employee.read.team') && !MklState.can('employee.read.all')) {
        root.appendChild(summaryCard('Tim Anda', function (body) {
          MklApi.call('hr.employees.list', { status: 'active', pageSize: 5 }).then(function (res) {
            MklUI.clear(body);
            if (!res.success) { body.appendChild(MklUI.alertBox('error', res.message)); return; }
            body.appendChild(h('div', { class: 'stats' }, stat('Anggota tim aktif', res.data.total, '#/karyawan')));
            if (!res.data.total) body.appendChild(h('p', { class: 'muted small' }, 'Belum ada anggota tim. Anggota tim ditentukan HR melalui kolom Atasan langsung.'));
          });
        }));
      }

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
        'Kontrak, BPJS, pengumuman, jadwal, absensi, cuti, lembur, dan slip gaji akan muncul di menu setelah tahap berikutnya selesai dan diuji.')));
    }
  });
})();
