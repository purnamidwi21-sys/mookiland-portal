/*
 * Halaman milik karyawan sendiri: Kontrak Saya, BPJS Saya, Dokumen Saya,
 * dan Notifikasi. Server hanya mengirim data milik akun yang sedang masuk.
 */
(function () {
  'use strict';
  var h = MklUI.h;

  function notLinked() {
    return MklUI.card(null, MklUI.alertBox('info', 'Akun Anda belum terhubung dengan data karyawan. Hubungi HR.'));
  }

  function loader(root, action, render) {
    var area = h('div');
    root.appendChild(area);
    function load() {
      MklUI.clear(area).appendChild(MklUI.loadingState('Memuat...'));
      MklApi.call(action, {}).then(function (res) {
        MklUI.clear(area);
        if (!res.success) { area.appendChild(MklUI.errorState(res, load)); return; }
        if (res.data.linked === false) { area.appendChild(notLinked()); return; }
        render(area, res.data, load);
      });
    }
    load();
  }

  // ================================================================== Kontrak Saya

  MklNav.register('/kontrak-saya', {
    title: 'Kontrak Saya',
    perm: 'contract.read.own',
    menu: { label: 'Kontrak Saya', order: 7 },
    render: function (root) {
      root.appendChild(MklUI.pageHeader('Kontrak Saya', 'Kontrak kerja Anda yang sudah ditandatangani.'));
      loader(root, 'me.contracts', function (area, data) {
        if (!data.items.length) { area.appendChild(MklUI.card(null, MklUI.emptyState('Belum ada kontrak yang tercatat. Hubungi HR jika Anda sudah menandatangani kontrak.'))); return; }
        data.items.forEach(function (c) {
          var dl = null;
          if (c.signedDocument) {
            dl = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Unduh PDF Kontrak');
            dl.addEventListener('click', function () { MklEmployeeExtras.download('me.documentDownload', c.signedDocument.documentId, dl); });
          }
          area.appendChild(MklUI.card(c.contractNo, [
            MklUI.infoList([
              ['Jenis', c.contractTypeLabel],
              ['Periode', MklEmployeeExtras.period(c)],
              ['Status', MklEmployeeExtras.statusBadgeContract(c)],
              c.wageAmount !== null ? ['Upah', MklUI.fmtMoney(c.wageAmount) + ' ' + c.wageUnitLabel + (c.payFrequencyLabel ? ', dibayar ' + c.payFrequencyLabel.toLowerCase() : '')] : null,
              c.signedAt ? ['Ditandatangani', MklUI.fmtDate(c.signedAt)] : null
            ].filter(Boolean)),
            dl ? h('div', { class: 'form-actions' }, dl) : null
          ]));
        });
      });
    }
  });

  // ================================================================== BPJS Saya

  MklNav.register('/bpjs-saya', {
    title: 'BPJS Saya',
    perm: 'bpjs.read.own',
    menu: { label: 'BPJS Saya', order: 8 },
    render: function (root) {
      root.appendChild(MklUI.pageHeader('BPJS Saya', 'Status kepesertaan BPJS Anda yang tercatat di perusahaan.'));
      loader(root, 'me.bpjs', function (area, data) {
        [['kesehatan', 'BPJS Kesehatan', 'Nomor kartu (JKN)'], ['ketenagakerjaan', 'BPJS Ketenagakerjaan', 'Nomor KPJ']].forEach(function (p) {
          var r = data[p[0]];
          var rows = [['Status', r ? MklUI.badge(r.statusLabel, r.status === 'aktif' ? 'success' : 'warning') : MklUI.badge('Belum terdaftar', 'warning')]];
          if (r) {
            if (r.membershipNo) rows.push([p[2], h('code', null, r.membershipNo)]);
            if (p[0] === 'kesehatan' && r.kesClass) rows.push(['Kelas rawat', 'Kelas ' + r.kesClass]);
            if (p[0] === 'ketenagakerjaan' && r.tkProgramLabels.length) rows.push(['Program', r.tkProgramLabels.join(', ')]);
            if (r.startDate) rows.push(['Mulai', MklUI.fmtDate(r.startDate)]);
          }
          area.appendChild(MklUI.card(p[1], MklUI.infoList(rows)));
        });
        area.appendChild(h('p', { class: 'muted small' }, 'Jika data tidak sesuai dengan kartu BPJS Anda, hubungi HR.'));
      });
    }
  });

  // ================================================================== Dokumen Saya

  MklNav.register('/dokumen-saya', {
    title: 'Dokumen Saya',
    perm: 'profile.read.own',
    menu: { label: 'Dokumen Saya', order: 9 },
    render: function (root) {
      root.appendChild(MklUI.pageHeader('Dokumen Saya', 'Dokumen Anda yang disimpan HR.'));
      loader(root, 'me.documents', function (area, data) {
        area.appendChild(MklUI.card(null, [
          MklUI.table([
            { label: 'Jenis', render: function (d) { return d.categoryLabel; } },
            { label: 'Judul', render: function (d) { return d.title; } },
            { label: 'Tanggal', render: function (d) { return MklUI.fmtDateTime(d.uploadedAt); } },
            { label: 'Aksi', className: 'col-action', render: function (d) {
              var b = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Unduh');
              b.addEventListener('click', function () { MklEmployeeExtras.download('me.documentDownload', d.documentId, b); });
              return b;
            } }
          ], data.items, 'Belum ada dokumen.'),
          h('p', { class: 'muted small' }, 'Untuk menambah atau mengganti dokumen (misalnya ijazah atau KTP baru), serahkan ke HR.')
        ]));
      });
    }
  });

  // ================================================================== Notifikasi

  MklNav.register('/notifikasi', {
    title: 'Notifikasi',
    render: function (root) {
      var markAll = h('button', { class: 'btn btn-secondary', type: 'button' }, 'Tandai Semua Sudah Dibaca');
      root.appendChild(MklUI.pageHeader('Notifikasi', '50 notifikasi terbaru.', markAll));
      var area = h('div');
      root.appendChild(area);
      markAll.addEventListener('click', function () {
        MklUI.setBusy(markAll, true);
        MklApi.call('notifications.markRead', { all: true }).then(function (res) {
          MklUI.setBusy(markAll, false);
          if (res.success) { MklUI.toast(res.message, 'success'); load(); }
        });
      });
      function load() {
        MklUI.clear(area).appendChild(MklUI.loadingState('Memuat notifikasi...'));
        MklApi.call('notifications.list', {}).then(function (res) {
          MklUI.clear(area);
          if (!res.success) { area.appendChild(MklUI.errorState(res, load)); return; }
          if (window.MklApp && MklApp.setNotificationCount) MklApp.setNotificationCount(res.data.unread);
          if (!res.data.items.length) { area.appendChild(MklUI.card(null, MklUI.emptyState('Belum ada notifikasi.'))); return; }
          var list = h('ul', { class: 'notif-list' });
          res.data.items.forEach(function (n) {
            var link = h('a', { href: n.linkPage ? '#' + n.linkPage : '#/notifikasi', class: 'notif-item' + (n.read ? '' : ' is-unread') },
              h('span', { class: 'notif-title' }, n.title),
              n.body ? h('span', { class: 'notif-body muted small' }, n.body) : null,
              h('span', { class: 'muted small' }, MklUI.fmtDateTime(n.createdAt)));
            link.addEventListener('click', function () {
              if (!n.read) MklApi.call('notifications.markRead', { ids: [n.notificationId] }).then(function () { if (window.MklApp) MklApp.refreshNotifications(); });
            });
            list.appendChild(h('li', null, link));
          });
          area.appendChild(MklUI.card(null, list));
        });
      }
      load();
    }
  });
})();
