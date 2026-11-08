/*
 * Halaman Beranda: jadwal hari ini, ringkasan kepegawaian sendiri, dan ringkasan
 * karyawan untuk HR atau tim untuk Supervisor, dan jadwal/absen hari ini.
 * Juga sisa cuti, antrean persetujuan, status penggajian, dan slip gaji terbaru.
 */
(function () {
  'use strict';
  var h = MklUI.h;

  function summaryCard(title, loader, extraClass) {
    var body = h('div', null, MklUI.loadingState('Memuat...'));
    loader(body);
    return MklUI.card(title, body, extraClass);
  }

  function stat(label, value, href, variant) {
    return h(href ? 'a' : 'div', { class: 'stat' + (variant ? ' stat-' + variant : ''), href: href || null },
      h('span', { class: 'stat-value' }, String(value)), h('span', { class: 'stat-label' }, label));
  }

  // 0.17.0: Kekuatan hari ini (pola minimal shift) untuk penyusun jadwal.
  var STATUS = { hadir: ['Hadir', 'success'], menunggu: ['Belum waktunya', 'neutral'], belum_datang: ['Belum absen', 'danger'], tidak_datang: ['Tidak datang', 'danger'], dipanggil: ['Dipanggil', 'info'], tidak_masuk: ['Tidak masuk', 'warning'], tanpa_jadwal: ['Masuk tanpa jadwal', 'warning'] };
  function peopleList(list) {
    return h('ul', { class: 'cov-people' }, list.map(function (p) {
      var st = STATUS[p.status] || [p.status, 'neutral'];
      if (p.status === 'tidak_masuk' && p.reasonLabel) st = ['Tidak masuk (' + p.reasonLabel + ')', 'warning'];
      var txt = p.name + (p.shift ? ' · ' + p.shift + ' ' + p.start : '') + (p.clockIn ? ' (masuk ' + p.clockIn + ')' : '');
      return h('li', null, h('span', { class: 'cov-person' }, txt), ' ', MklUI.badge(st[0], st[1]));
    }));
  }
  // 0.17.2: kartu utama Beranda. Satu kotak per jabatan, angka besar per shift (Pagi-Middle-Siang).
  var SLOT_NAMES = { 3: ['Pagi', 'Middle', 'Siang'], 2: ['Pagi', 'Siang'] };
  // Shift yang di bawah angka terkecil dari semua pola yang boleh ditandai merah.
  function figure(now, allowed) {
    var n = String(now).split('-');
    var names = SLOT_NAMES[n.length] || n.map(function () { return ''; });
    var min = n.map(function (v, i) {
      var vals = (allowed || []).map(function (a) { return Number(String(a).split('-')[i]); }).filter(function (x) { return !isNaN(x); });
      return vals.length ? Math.min.apply(null, vals) : 0;
    });
    return h('div', { class: 'cov-figure', 'aria-hidden': 'true' }, n.map(function (v, i) {
      var short = Number(v) < min[i];
      return h('div', { class: 'cov-slot' + (short ? ' is-short' : '') },
        h('span', { class: 'cov-num' }, v), h('span', { class: 'cov-slot-name' }, names[i]));
    }));
  }
  function coverageCard() {
    var body = h('div', { 'aria-live': 'polite' }, MklUI.loadingState('Memuat...'));
    var summary = h('span', { class: 'cov-summary' });
    var stamp = h('span', { class: 'muted small' });
    var refresh = h('button', { class: 'btn btn-ghost btn-small', type: 'button' }, 'Perbarui');
    var card = h('section', { class: 'card card-wide card-cov' },
      h('div', { class: 'card-head' },
        h('div', { class: 'cov-title' }, h('h2', { class: 'card-title' }, 'Kekuatan staff hari ini'), summary),
        h('div', { class: 'cov-tools' }, stamp, refresh)),
      body);
    var canAssign = MklState.can('schedule.manage.all');
    function paint(t) {
      MklUI.clear(body); MklUI.clear(summary);
      stamp.textContent = 'Diperbarui ' + new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Makassar', hour: '2-digit', minute: '2-digit' }) + ' WITA';
      if (!t.items.length) { body.appendChild(h('p', { class: 'muted' }, 'Pola minimal shift belum diatur. Atur di Susun Jadwal > Pola Minimal.')); paintOthers(t); return; }
      var badCount = t.items.filter(function (it) { return !it.nowOk || !it.planOk; }).length;
      summary.appendChild(badCount ? MklUI.badge(badCount + ' jabatan kurang', 'danger') : MklUI.badge('Semua jabatan sesuai pola', 'success'));
      var grid = h('div', { class: 'cov-grid' });
      t.items.forEach(function (it) {
        var bad = !it.nowOk || !it.planOk;
        var sec = h('section', { class: 'cov-pos' + (bad ? ' is-bad' : '') },
          h('div', { class: 'cov-head' },
            h('h3', { class: 'cov-name' }, it.position),
            bad ? MklUI.badge('Kurang', 'danger') : MklUI.badge('Sesuai', 'success')),
          h('p', { class: 'sr-only' }, 'Sekarang ' + it.now + (it.nowOk ? ', sesuai pola.' : ', tidak sesuai pola.')),
          figure(it.now, it.allowed),
          h('p', { class: 'cov-plan small' },
            h('span', { class: 'cov-chip ' + (it.planOk ? 'is-ok' : 'is-bad') }, 'Jadwal ' + it.plan + (it.planOk ? ' ✓' : ' ✗')),
            ' Pola yang boleh: ' + it.allowed.join(', ')));
        if (it.people.length) {
          sec.appendChild(peopleList(it.people));
        } else {
          sec.appendChild(h('p', { class: 'muted small' }, 'Tidak ada yang dijadwalkan hari ini.'));
        }
        if (bad) {
          if (!it.candidates.length) sec.appendChild(h('p', { class: 'small cov-note' }, 'Tidak ada staff ' + it.position + ' yang sedang libur hari ini.'));
          else sec.appendChild(h('div', { class: 'cov-cands' }, h('span', { class: 'small' }, 'Calon pengganti (libur):'), it.candidates.map(function (c) {
            if (!canAssign) return h('span', { class: 'small' }, c.name + ' ');
            var b = h('button', { class: 'btn btn-primary btn-small', type: 'button' }, 'Panggil ' + c.name);
            b.addEventListener('click', function () { callModal(t, it, c); });
            return b;
          })));
        }
        grid.appendChild(sec);
      });
      body.appendChild(grid);
      paintOthers(t);
      if (badCount && canAssign) {
        body.appendChild(h('p', { class: 'cov-link' }, h('a', { class: 'btn btn-secondary btn-small', href: '#/atur-ulang' }, 'Atur Ulang Jadwal'),
          h('span', { class: 'small muted' }, ' Usulan susunan baru (pindah shift atau panggil staff libur) untuk hari ini sampai 7 hari ke depan.')));
      }
      body.appendChild(h('p', { class: 'muted small cov-foot' }, 'Angka besar = staff yang sudah hadir atau masih menunggu jam masuk. Staff yang belum absen 30 menit setelah jam masuk dihitung belum datang. Jabatan lain tidak punya pola minimal, jadi hanya ditampilkan.'));
    }
    // 0.18.2: jabatan tanpa pola minimal (mis. PA Cleaner, Staff Admin): daftar siapa masuk hari ini, tanpa pemeriksaan pola.
    function paintOthers(t) {
      if (!t.others || !t.others.length) return;
      body.appendChild(h('h3', { class: 'cov-sub' }, 'Jabatan lain'));
      body.appendChild(h('div', { class: 'cov-grid cov-grid-others' }, t.others.map(function (g) {
        var here = g.people.filter(function (p) { return p.status === 'hadir' || p.status === 'tanpa_jadwal'; }).length;
        return h('section', { class: 'cov-pos cov-other' },
          h('div', { class: 'cov-head' }, h('h3', { class: 'cov-name' }, g.position), h('span', { class: 'small muted' }, here + ' dari ' + g.people.length + ' hadir')),
          peopleList(g.people));
      })));
    }
    function load() {
      MklUI.setBusy(refresh, true, 'Memuat...');
      MklApi.call('time.coverage.today', {}).then(function (res) {
        MklUI.setBusy(refresh, false);
        if (!res.success) { MklUI.clear(body).appendChild(MklUI.alertBox('error', res.message)); return; }
        paint(res.data);
      });
    }
    refresh.addEventListener('click', load);
    function callModal(t, it, c) {
      var missing = it.absent.join(', ');
      var form = h('form', { class: 'stack', novalidate: true });
      var sh = MklUI.selectField({ label: 'Shift', name: 'shiftId', options: t.shifts.map(function (s) { return { value: s.shiftId, label: s.code + ' ' + s.startTime + '–' + s.endTime + ' (' + s.name + ')' }; }) });
      var reason = MklUI.field({ label: 'Pesan untuk ' + c.name, name: 'reason', required: true, maxLength: 300, value: missing ? 'Menggantikan ' + missing + ' yang belum datang.' : 'Dibutuhkan untuk memenuhi pola minimal shift.' });
      var alertSlot = h('div');
      [h('p', null, c.name + ' akan langsung dijadwalkan hari ini dan mendapat notifikasi di HP.'), sh.wrap, reason.wrap, alertSlot].forEach(function (x) { form.appendChild(x); });
      var m = MklUI.modal({ title: 'Panggil ' + c.name, content: form, actions: [
        { label: 'Batal', onClick: function (x) { x.close(); } }, { label: 'Panggil', variant: 'primary', id: 'ok', onClick: submit }] });
      form.addEventListener('submit', function (e) { e.preventDefault(); submit(m, m.buttons.ok); });
      function submit(x, btn) {
        MklUI.clearFieldErrors(form); MklUI.clear(alertSlot);
        MklUI.setBusy(btn, true, 'Menyimpan...');
        MklApi.call('time.coverage.assign', { employeeId: c.employeeId, date: t.date, shiftId: sh.input.value, reason: reason.input.value.trim() }).then(function (res) {
          MklUI.setBusy(btn, false);
          if (!res.success) { if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message)); return; }
          x.close();
          MklUI.toast(res.message, 'success');
          paint(res.data);
          if (res.data.notify && window.MklWaUI) {
            MklUI.modal({ title: 'Kabari ' + c.name, content: MklWaUI.notifyList(res.data.notify, 'Panggil masuk'),
              actions: [{ label: 'Selesai', variant: 'primary', onClick: function (z) { z.close(); } }] });
          }
        });
      }
    }
    load();
    return card;
  }

  MklNav.register('/beranda', {
    title: 'Beranda',
    menu: { label: 'Beranda', order: 1 },
    render: function (page) {
      var u = MklState.user;
      // 0.17.1: Beranda lebih ringkas. Kotak "Akun Anda" dan daftar tautan dihapus;
      // waktu masuk sebelumnya tetap tampil di bawah salam (untuk keamanan).
      var sub = u.previousLoginAt === undefined ? null
        : (u.previousLoginAt ? 'Masuk sebelumnya: ' + MklUI.fmtDateTime(u.previousLoginAt) : 'Ini pertama kali Anda masuk.');
      page.appendChild(MklUI.pageHeader('Selamat datang, ' + u.displayName, sub));
      // 0.17.2: Kekuatan staff jadi kartu utama (lebar penuh). Di bawahnya dua kolom:
      // kiri lebar (ringkasan kerja), kanan sempit (urusan pribadi). Di HP kolom kanan tampil lebih dulu.
      if (MklState.canAny(['schedule.manage.all', 'schedule.manage.team'])) page.appendChild(coverageCard());
      var grid = h('div', { class: 'home-grid' });
      var side = h('div', { class: 'home-side' });
      var root = h('div', { class: 'home-main' });
      grid.appendChild(side); grid.appendChild(root);
      page.appendChild(grid);

      if (MklState.can('attendance.clock.own')) {
        side.appendChild(summaryCard('Hari ini', function (body) {
          MklApi.call('me.attendanceToday', {}).then(function (res) {
            MklUI.clear(body);
            if (!res.success) { body.appendChild(MklUI.alertBox('error', res.message)); return; }
            var t = res.data;
            if (!t.linked) { body.appendChild(h('p', { class: 'muted' }, 'Akun Anda belum terhubung dengan data karyawan. Hubungi HR.')); return; }
            body.appendChild(t.shift
              ? h('p', { class: 'today-shift' }, h('span', { class: 'today-name' }, t.shift.name), ' ', h('span', { class: 'today-time' }, t.shift.start + '–' + t.shift.end))
              : h('p', { class: 'today-shift' }, h('span', { class: t.off ? 'today-time' : 'today-none' }, t.off ? 'Libur' : 'Tidak ada jadwal terbit')));
            var info = h('dl', { class: 'today-facts' },
              h('div', null, h('dt', null, 'Masuk'), h('dd', null, t.clockIn || '–')),
              h('div', null, h('dt', null, 'Pulang'), h('dd', null, t.clockOut || '–')));
            body.appendChild(info);
            if (MklState.can('leave.request.own')) {
              MklApi.call('me.leave.summary', {}).then(function (ls) {
                if (ls.success && ls.data.eligible && ls.data.balance) {
                  info.appendChild(h('div', null, h('dt', null, 'Sisa cuti'), h('dd', null, ls.data.balance.available + ' hari')));
                }
              });
            }
            var label = t.canClockOut ? 'Absen Pulang' : (t.canClockIn ? 'Absen Masuk' : 'Lihat Absen');
            body.appendChild(h('div', { class: 'form-actions' },
              h('a', { class: 'btn ' + (t.canClockIn || t.canClockOut ? 'btn-primary' : 'btn-secondary') + ' btn-small', href: '#/absen' }, label),
              MklState.can('schedule.read.own') ? h('a', { class: 'btn btn-secondary btn-small', href: '#/jadwal-saya' }, 'Jadwal Saya') : null));
          });
        }, 'card-today'));
      }

      if (MklState.can('approval.queue')) {
        var apBody = h('div');
        var apCard = MklUI.card('Persetujuan', apBody);
        side.appendChild(apCard);
        MklApi.call('approvals.count', {}).then(function (res) {
          if (!res.success) { apCard.parentNode && apCard.parentNode.removeChild(apCard); return; }
          var n = res.data.pending;
          apBody.appendChild(h('div', { class: 'stats' }, stat('Menunggu persetujuan Anda', n, '#/persetujuan', n ? 'warning' : null)));
        });
      }

      if (MklState.can('announcement.read')) {
        var annBody = h('div');
        var annCard = MklUI.card('Pengumuman terbaru', annBody);
        side.appendChild(annCard);
        MklApi.call('announcements.feed', {}).then(function (res) {
          if (!res.success || !res.data.items.length) { annCard.parentNode && annCard.parentNode.removeChild(annCard); return; }
          annBody.appendChild(h('ul', { class: 'link-list' }, res.data.items.slice(0, 3).map(function (a) {
            return h('li', null, h('a', { href: '#/pengumuman/' + a.announcementId }, a.title), ' ',
              a.canAcknowledge && !a.read ? MklUI.badge('Baru', 'info') : null,
              a.requiresAck && a.canAcknowledge && !a.acknowledged ? MklUI.badge('Perlu konfirmasi', 'warning') : null);
          })));
          if (res.data.items.length > 3) annBody.appendChild(h('p', { class: 'small' }, h('a', { href: '#/pengumuman' }, 'Lihat semua pengumuman')));
        });
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
        side.appendChild(psCard);
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
            body.appendChild(h('dl', { class: 'facts' }, [
              ['Employee ID', me.employeeId], ['Jabatan', me.positionName], ['Atasan langsung', me.supervisorName], ['Masa kerja', me.tenure]
            ].map(function (r) { return h('div', null, h('dt', null, r[0]), h('dd', null, r[1] || '-')); })));
            // Data yang belum lengkap: satu pesan ringkas, bukan dua kotak besar.
            var todo = [];
            if (me.missingContact && me.missingContact.length) todo.push('Mohon lengkapi data kontak Anda: ' + me.missingContact.join(', ') + '.');
            var idt = me.identity;
            if (idt && !idt.pending && idt.missing && idt.missing.length && MklState.moduleOpen('kepegawaian')) {
              todo.push('Mohon lengkapi data diri Anda (' + idt.missing.join(', ') + ') di menu Profil Saya → Lengkapi Data Diri.');
            }
            if (todo.length) body.appendChild(h('div', { class: 'alert alert-warning todo-box', role: 'status' }, todo.map(function (t) { return h('p', null, t); })));
            body.appendChild(h('div', { class: 'form-actions' },
              h('a', { class: 'btn btn-secondary btn-small', href: '#/profil' }, 'Profil Saya'),
              h('a', { class: 'btn btn-secondary btn-small', href: '#/kepegawaian' }, 'Kepegawaian Saya')));
          });
        }));
      }

    }
  });
})();
