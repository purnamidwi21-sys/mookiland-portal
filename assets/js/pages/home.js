/*
 * Halaman Beranda: akun, ringkasan kepegawaian sendiri, dan ringkasan
 * karyawan untuk HR atau tim untuk Supervisor, dan jadwal/absen hari ini.
 * Juga sisa cuti, antrean persetujuan, status penggajian, dan slip gaji terbaru.
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

      if (MklState.can('announcement.read')) {
        var annBody = h('div');
        var annCard = MklUI.card('Pengumuman terbaru', annBody);
        root.appendChild(annCard);
        MklApi.call('announcements.feed', {}).then(function (res) {
          if (!res.success || !res.data.items.length) { annCard.parentNode && annCard.parentNode.removeChild(annCard); return; }
          annBody.appendChild(h('ul', { class: 'link-list' }, res.data.items.slice(0, 3).map(function (a) {
            return h('li', null, h('a', { href: '#/pengumuman/' + a.announcementId }, a.title), ' ',
              a.canAcknowledge && !a.read ? MklUI.badge('Baru', 'info') : null,
              a.requiresAck && a.canAcknowledge && !a.acknowledged ? MklUI.badge('Perlu konfirmasi', 'warning') : null);
          })));
          if (res.data.items.length > 3) annBody.appendChild(h('p', null, h('a', { href: '#/pengumuman' }, 'Lihat semua pengumuman')));
        });
      }

      if (MklState.can('attendance.clock.own')) {
        root.appendChild(summaryCard('Hari ini', function (body) {
          MklApi.call('me.attendanceToday', {}).then(function (res) {
            MklUI.clear(body);
            if (!res.success) { body.appendChild(MklUI.alertBox('error', res.message)); return; }
            var t = res.data;
            if (!t.linked) { body.appendChild(h('p', { class: 'muted' }, 'Akun Anda belum terhubung dengan data karyawan. Hubungi HR.')); return; }
            var info = MklUI.infoList([
              ['Jadwal', t.shift ? t.shift.name + ' ' + t.shift.start + '–' + t.shift.end : (t.off ? 'Libur' : 'Tidak ada jadwal terbit')],
              ['Masuk', t.clockIn || '-'],
              ['Pulang', t.clockOut || '-']
            ]);
            body.appendChild(info);
            if (MklState.can('leave.request.own')) {
              MklApi.call('me.leave.summary', {}).then(function (ls) {
                if (ls.success && ls.data.eligible && ls.data.balance) {
                  info.appendChild(h('dt', null, 'Sisa cuti'));
                  info.appendChild(h('dd', null, ls.data.balance.available + ' hari'));
                }
              });
            }
            var label = t.canClockOut ? 'Absen Pulang' : (t.canClockIn ? 'Absen Masuk' : 'Lihat Absen');
            body.appendChild(h('div', { class: 'form-actions' },
              h('a', { class: 'btn ' + (t.canClockIn || t.canClockOut ? 'btn-primary' : 'btn-secondary') + ' btn-small', href: '#/absen' }, label),
              MklState.can('schedule.read.own') ? h('a', { class: 'btn btn-secondary btn-small', href: '#/jadwal-saya' }, 'Jadwal Saya') : null));
          });
        }));
      }

      if (MklState.canAny(['leave.manage', 'overtime.manage', 'attendance.manage', 'hr.sensitive.manage', 'loan.approve', 'request.approve.hr'])) {
        var apBody = h('div');
        var apCard = MklUI.card('Persetujuan', apBody);
        root.appendChild(apCard);
        MklApi.call('approvals.count', {}).then(function (res) {
          if (!res.success) { apCard.parentNode && apCard.parentNode.removeChild(apCard); return; }
          var n = res.data.pending;
          apBody.appendChild(h('div', { class: 'stats' }, stat('Menunggu persetujuan Anda', n, '#/persetujuan', n ? 'warning' : null)));
        });
      }

      if (MklState.canAny(['payroll.prepare', 'payroll.approve'])) {
        var pyBody = h('div');
        var pyCard = MklUI.card('Penggajian', pyBody);
        root.appendChild(pyCard);
        MklApi.call('hr.payroll.periods', {}).then(function (res) {
          if (!res.success) { pyCard.parentNode && pyCard.parentNode.removeChild(pyCard); return; }
          var items = res.data.items;
          var waiting = items.filter(function (p) { return p.status === 'diajukan'; }).length;
          var row = h('div', { class: 'stats' });
          if (MklState.can('payroll.approve')) row.appendChild(stat('Gaji menunggu persetujuan', waiting, '#/penggajian', waiting ? 'warning' : null));
          if (MklState.can('payroll.prepare')) {
            var open = items.filter(function (p) { return p.status === 'draf' || p.status === 'dihitung'; }).length;
            var unpaid = items.filter(function (p) { return p.status === 'disetujui'; }).length;
            row.appendChild(stat('Periode belum diajukan', open, '#/penggajian'));
            row.appendChild(stat('Disetujui, belum dibayar', unpaid, '#/penggajian', unpaid ? 'warning' : null));
          }
          pyBody.appendChild(row);
          if (items[0]) pyBody.appendChild(h('p', { class: 'small' }, 'Periode terakhir: ', h('a', { href: '#/penggajian/' + items[0].periodId }, items[0].label), ' · ' + items[0].statusLabel));
        });
      }

      if (MklState.can('payslip.read.own')) {
        var psBody = h('div');
        var psCard = MklUI.card('Slip gaji', psBody);
        root.appendChild(psCard);
        MklApi.call('me.payslips', {}).then(function (res) {
          if (!res.success || !res.data.linked) { psCard.parentNode && psCard.parentNode.removeChild(psCard); return; }
          var last = res.data.items[0];
          psBody.appendChild(last
            ? h('p', null, 'Slip terbaru: ', h('strong', null, last.periodLabel), ' (dibayar ' + MklUI.fmtDate(last.paidAt) + ').')
            : h('p', { class: 'muted' }, 'Belum ada slip gaji. Slip muncul setelah gaji dibayar.'));
          psBody.appendChild(h('div', { class: 'form-actions' }, h('a', { class: 'btn btn-secondary btn-small', href: '#/slip-saya' }, 'Slip Gaji Saya')));
        });
      }

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
            var idt = me.identity;
            if (idt && !idt.pending && idt.missing && idt.missing.length) {
              body.appendChild(MklUI.alertBox('warning', 'Mohon lengkapi data diri Anda (' + idt.missing.join(', ') + ') di menu Profil Saya → Lengkapi Data Diri.'));
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
            var statsRow = h('div', { class: 'stats' },
              stat('Karyawan aktif', res.data.total, '#/karyawan'),
              stat('Data belum lengkap', incomplete, '#/karyawan', incomplete ? 'warning' : null),
              stat('Belum punya akun', noAccount, '#/karyawan', noAccount ? 'warning' : null));
            body.appendChild(statsRow);
            if (MklState.can('contract.manage')) {
              MklApi.call('hr.contracts.overview', { within: 30 }).then(function (c) {
                if (c.success) statsRow.appendChild(stat('Kontrak berakhir ≤ 30 hari', c.data.counts.within30, '#/kontrak', c.data.counts.within30 ? 'warning' : null));
              });
            }
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
        'Impor komisi kasir (Tahap 4b) dan notifikasi WhatsApp (Tahap 4c) akan muncul setelah selesai dan diuji.')));
    }
  });
})();
