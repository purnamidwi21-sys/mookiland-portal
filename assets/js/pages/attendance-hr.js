/*
 * Rekap Absensi (HR, Supervisor untuk timnya) dan Impor Absensi Raptor (HR).
 * Server menentukan karyawan mana yang boleh dilihat; catatan manual HR
 * dan impor wajib punya hak akses di server.
 */
(function () {
  'use strict';
  var h = MklUI.h;
  var T = window.MklTimeUI;

  var SOURCE_LABEL = { aplikasi: 'Aplikasi (GPS)', manual_hr: 'Dicatat HR', raptor: 'Raptor', koreksi: 'Koreksi disetujui' };
  function sourceText(s) {
    return String(s || '').split(', ').filter(Boolean).map(function (x) { return SOURCE_LABEL[x] || x; }).join(', ');
  }

  // ================================================================== Rekap Absensi

  /** Riwayat impor Raptor (dengan Hapus Data). Dipakai di Rekap Absensi dan halaman Impor. */
  function importHistory(container, onChanged, opts) {
    opts = opts || {};
    MklApi.call('hr.attendance.imports', {}).then(function (res) {
      if (!res.success) return;
      MklUI.clear(container);
      if (!res.data.items.length && opts.emptyText) container.appendChild(MklUI.card(opts.title || 'Riwayat impor', h('p', { class: 'muted' }, opts.emptyText)));
      if (res.data.items.length) {
        container.appendChild(MklUI.card(opts.title || 'Riwayat impor', MklUI.table([
          { label: 'Waktu', render: function (r) { return MklUI.fmtDateTime(r.importedAt); } },
          { label: 'Periode', render: function (r) { return T.rangeLabel(r.periodStart, r.periodEnd); } },
          { label: 'Hari di file', render: function (r) { return String(r.rowsTotal); } },
          { label: 'Tersimpan', render: function (r) { return String(r.rowsOk); } },
          { label: 'Dilewati', render: function (r) { return String(r.rowsSkipped); } },
          { label: 'Oleh', render: function (r) { return r.importedBy; } },
          { label: 'Status', render: function (r) { return r.deleted ? h('span', null, MklUI.badge('Dihapus', 'muted'), h('br'), h('span', { class: 'muted small' }, MklUI.fmtDateTime(r.deletedAt))) : MklUI.badge('Tersimpan', 'success'); } },
          { label: 'Aksi', className: 'col-action', render: function (r) {
            if (r.deleted) return '';
            var b = h('button', { class: 'btn btn-ghost btn-small', type: 'button' }, 'Hapus Data');
            b.addEventListener('click', function () { deleteImportModal(r, b, onChanged); });
            return b;
          } }
        ], res.data.items, '')));
        container.appendChild(h('p', { class: 'muted small' }, 'Salah unggah atau ingin mengunggah ulang? Tekan Hapus Data pada impor itu, lalu unggah file yang benar.'));
      }
      if (opts.mappings && res.data.mappings.length) {
        container.appendChild(MklUI.card('Pasangan nomor Raptor', [
          MklUI.table([
            { label: 'Nomor Raptor', render: function (m) { return h('code', null, m.empNo); } },
            { label: 'Karyawan', render: function (m) { return m.ignored ? MklUI.badge('Diabaikan', 'muted') : m.fullName + ' (' + m.employeeId + ')'; } }
          ], res.data.mappings, ''),
          h('p', { class: 'muted small' }, 'Untuk mengubah pasangan, unggah file Raptor lalu pilih karyawan yang benar di langkah 2.')
        ]));
      }
    });
  }

  // Hapus absensi dari satu impor supaya file bisa diunggah ulang.
  function deleteImportModal(r, trigger, done) {
    MklUI.setBusy(trigger, true, 'Memeriksa...');
    MklApi.call('hr.attendance.importDelete', { importId: r.importId, dryRun: true }).then(function (res) {
      MklUI.setBusy(trigger, false);
      if (!res.success) { MklUI.toast(res.message, 'error'); return; }
      var s = res.data;
      var form = h('form', { class: 'stack', novalidate: true });
      var inc = MklUI.checkboxField({ label: 'Hapus juga ' + s.correctedDays + ' hari yang sudah dikoreksi HR', name: 'includeCorrected', checked: false,
        hint: 'Biasanya tidak perlu. Koreksi HR (misalnya jam pulang yang diperbaiki) akan hilang dan harus diulang setelah unggah ulang.' });
      var reason = MklUI.field({ label: 'Alasan', name: 'reason', required: true, multiline: true, rows: 2, maxLength: 300, placeholder: 'Contoh: salah file, unggah ulang dengan file yang benar' });
      var alertSlot = h('div');
      var count = h('strong');
      function upd() { count.textContent = (inc.input.checked ? s.raptorDays + s.correctedDays : s.raptorDays) + ' hari absensi dari Raptor'; }
      inc.input.addEventListener('change', upd); upd();
      [h('p', null, 'Rentang ' + T.rangeLabel(s.from, s.to) + ': ', count, ' akan dihapus. Hari yang juga diabsen di portal tidak dihapus, tetapi kembali memakai jam absen portal. Catatan HR tidak dihapus.'),
        s.correctedDays ? inc.wrap : null, reason.wrap,
        h('p', { class: 'muted small' }, 'Setelah dihapus, unggah ulang file Raptor, lalu tekan Hitung Ulang di periode gaji. Penghapusan tercatat di audit log.'), alertSlot
      ].forEach(function (x) { if (x) form.appendChild(x); });
      var ctl = MklUI.modal({ title: 'Hapus data impor Raptor', content: form, actions: [
        { label: 'Batal', onClick: function (c) { c.close(); } },
        { label: 'Hapus Data Absensi', variant: 'danger', id: 'ok', onClick: submit }
      ] });
      form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });
      function submit(c, btn) {
        MklUI.clearFieldErrors(form);
        MklUI.clear(alertSlot);
        MklUI.setBusy(btn, true, 'Menghapus...');
        MklApi.call('hr.attendance.importDelete', { importId: r.importId, includeCorrected: inc.input.checked, reason: reason.input.value.trim() }).then(function (x) {
          MklUI.setBusy(btn, false);
          if (!x.success) { if (!MklUI.showFieldErrors(form, x)) alertSlot.appendChild(MklUI.alertBox('error', x.message)); return; }
          c.close();
          MklUI.toast(x.message, 'success');
          done();
        });
      }
    });
  }


  MklNav.register('/absensi', {
    title: 'Rekap Absensi',
    perm: ['attendance.read.all', 'attendance.read.team'],
    menu: { label: 'Rekap Absensi', order: 10.5, section: 'Jadwal & Absensi' },
    render: function (root) {
      var today = MklUI.todayYmd();
      var importBtn = MklState.can('attendance.import') ? h('a', { class: 'btn btn-secondary', href: '#/absensi/impor' }, 'Impor dari Raptor') : null;
      root.appendChild(MklUI.pageHeader('Rekap Absensi', 'Kehadiran, keterlambatan, dan jam kerja per karyawan.', importBtn));

      var from = MklUI.field({ label: 'Dari', name: 'from', type: 'date', value: today.slice(0, 8) + '01' });
      var to = MklUI.field({ label: 'Sampai', name: 'to', type: 'date', value: today });
      var show = h('button', { class: 'btn btn-primary', type: 'submit' }, 'Tampilkan');
      var filter = h('form', { class: 'filters', novalidate: true }, from.wrap, to.wrap, h('div', { class: 'filters-actions' }, show));
      root.appendChild(MklUI.card(null, [filter, h('p', { class: 'muted small' }, 'Rentang maksimal 62 hari.')]));
      var area = h('div');
      var detail = h('div', { id: 'absensi-rincian' });
      var cmpArea = h('div');
      root.appendChild(area);
      root.appendChild(detail);
      root.appendChild(cmpArea);
      var range = null;
      var histArea = h('div');
      if (MklState.can('attendance.import')) {
        root.appendChild(histArea);
        var refreshHist = function () { importHistory(histArea, function () { refreshHist(); if (range) load(); }, { title: 'Riwayat impor Raptor', emptyText: 'Belum ada file Raptor yang diimpor. Tekan Impor dari Raptor di kanan atas.' }); };
        refreshHist();
      }

      filter.addEventListener('submit', function (e) { e.preventDefault(); load(); });

      function load() {
        MklUI.clearFieldErrors(filter);
        range = { from: from.input.value, to: to.input.value };
        MklUI.clear(detail);
        MklUI.clear(area).appendChild(MklUI.loadingState('Memuat rekap...'));
        MklApi.call('hr.attendance.recap', range).then(function (res) {
          MklUI.clear(area);
          if (!res.success) {
            if (!MklUI.showFieldErrors(filter, res)) area.appendChild(MklUI.errorState(res, load));
            return;
          }
          var d = res.data;
          area.appendChild(MklUI.card('Rekap ' + T.rangeLabel(d.from, d.to), [
            h('div', { class: 'recap-table' }, MklUI.table([
              { label: 'Nama', render: function (i) { return h('span', null, h('strong', null, i.fullName), h('br'), h('span', { class: 'muted small' }, i.employeeId + (i.positionName ? ' · ' + i.positionName : ''))); } },
              { label: 'Hadir', render: function (i) { return i.summary.present + ' dari ' + i.summary.scheduled; } },
              { label: 'Terlambat', render: function (i) { return i.summary.late ? i.summary.late + ' kali (' + T.fmtMinutes(i.summary.lateMinutes) + ')' : '0'; } },
              { label: 'Pulang cepat', render: function (i) { return String(i.summary.early); } },
              { label: 'Tidak hadir', render: function (i) { return i.summary.absent ? MklUI.badge(String(i.summary.absent), 'danger') : '0'; } },
              { label: 'Belum lengkap', render: function (i) { return i.summary.incomplete ? MklUI.badge(String(i.summary.incomplete), 'warning') : '0'; } },
              { label: 'Cuti / sakit / izin', render: function (i) { var s = i.summary; return (s.leave || 0) + ' / ' + (s.sick || 0) + ' / ' + (s.permit || 0); } },
              { label: 'Lembur disetujui', render: function (i) { return i.summary.overtimeMinutes ? T.fmtMinutes(i.summary.overtimeMinutes) : '0'; } },
              { label: 'Lama hadir', render: function (i) {
                var sm = i.summary;
                return h('span', null, mins(sm.spanMinutes), sm.paidMinutes ? h('span', { class: 'small muted d-block' }, 'dibayar ' + mins(sm.paidMinutes)) : null);
              } },
              { label: 'Aksi', className: 'col-action', render: function (i) {
                var b = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Rincian');
                b.addEventListener('click', function () { openDetail(i.employeeId, d.canEdit); });
                return b;
              } }
            ], d.items, 'Tidak ada karyawan pada rekap ini.')),
            h('p', { class: 'muted small' }, 'Hadir = hari dengan absen masuk, dari jumlah hari terjadwal. Tidak hadir = ada jadwal terbit tetapi tidak ada absen, cuti, izin, atau sakit yang disetujui. Belum lengkap = absen masuk tanpa absen pulang. Hari yang belum terbit jadwalnya tidak dihitung.')
          ]));
        });
        if (MklState.canAny(['attendance.read.all', 'attendance.manage'])) loadCompare();
      }

      /** Laporan Portal vs Fingerprint (0.13.0). */
      function loadCompare() {
        MklUI.clear(cmpArea).appendChild(MklUI.loadingState('Memuat perbandingan portal dan fingerprint...'));
        MklApi.call('hr.attendance.compare', range).then(function (res) {
          MklUI.clear(cmpArea);
          if (!res.success) { cmpArea.appendChild(MklUI.errorState(res, loadCompare)); return; }
          var d = res.data, s = d.summary;
          if (!s.portalDays && !d.items.length) return;
          var KIND = { tanpa_fingerprint: ['Tanpa fingerprint', 'danger'], selisih: ['Selisih jam', 'warning'], tanpa_portal: ['Hanya fingerprint', 'info'] };
          var diff = function (m) { return m === null || m === undefined ? '' : (m > 0 ? '+' : '') + m + ' mnt'; };
          cmpArea.appendChild(MklUI.card('Portal vs Fingerprint', [
            h('p', { class: 'muted small' }, 'Gaji memakai jam fingerprint Raptor. Absen portal dipakai sebagai cadangan bila fingerprint tidak ada (atau tidak punya jam pulang), dan sebagai pembanding. ' +
              (d.lastImported ? 'Fingerprint terakhir diimpor sampai ' + MklUI.fmtDate(d.lastImported) + '.' : 'Belum ada file Raptor yang diimpor.')),
            h('div', { class: 'stats' },
              T.stat('Hari absen portal', s.portalDays),
              T.stat('Tanpa fingerprint', s.noFingerprint, s.noFingerprint ? 'danger' : null),
              T.stat('Selisih ≥ ' + d.thresholdMinutes + ' mnt', s.mismatch, s.mismatch ? 'warning' : null),
              d.portalOpen ? T.stat('Hanya fingerprint', s.fingerprintOnly) : null,
              s.notImported ? T.stat('Fingerprint belum diimpor', s.notImported) : null),
            d.items.length ? h('div', { class: 'recap-table' }, MklUI.table([
              { label: 'Nama', render: function (i) { return i.fullName; } },
              { label: 'Tanggal', render: function (i) { return T.dayLabel(i.date); } },
              { label: 'Portal', render: function (i) { return i.portalIn ? i.portalIn + (i.portalOut ? '–' + i.portalOut : '') : '-'; } },
              { label: 'Fingerprint', render: function (i) { return i.raptorIn ? i.raptorIn + (i.raptorOut ? '–' + i.raptorOut : '') : '-'; } },
              { label: 'Selisih masuk/pulang', render: function (i) { return [diff(i.diffIn), diff(i.diffOut)].filter(Boolean).join(' / ') || '-'; } },
              { label: 'Keterangan', render: function (i) { var k = KIND[i.kind] || [i.label, 'muted']; return MklUI.badge(k[0], k[1]); } }
            ], d.items, '')) : h('p', { class: 'muted' }, 'Tidak ada yang perlu dicek.'),
            h('p', { class: 'muted small' }, 'Tanpa fingerprint = absen di portal tetapi tidak ada sidik jari di Raptor pada hari itu (cek kemungkinan titip absen). Selisih = jam portal dan fingerprint berbeda jauh. Hanya fingerprint = tidak absen di portal. Gaji selalu memakai jam fingerprint bila ada.' + (d.total > d.items.length ? ' Ditampilkan ' + d.items.length + ' dari ' + d.total + '.' : ''))
          ]));
        });
      }

      // 0.18.1: menit berpecahan (ketelitian detik dari Penggajian) ditampilkan dibulatkan ke bawah.
      function mins(m) { return T.fmtMinutes(Math.floor((m || 0) + 1e-9)); }
      // Istirahat dari fingerprint Raptor, sama seperti di Penggajian.
      function breakCell(x) {
        if (!x.clockIn) return '';
        if (x.breakKind === 'otomatis') return h('span', null, '1 j', h('span', { class: 'small muted d-block' }, 'otomatis (profil gaji)'));
        if (x.breakKind === 'tidak_istirahat') return h('span', null, '-', h('span', { class: 'small muted d-block' }, 'Tidak istirahat: +' + x.breakCredit + ' m kerja'));
        if (x.breakKind === 'tidak_tercatat') return h('span', { class: 'small muted' }, 'Tidak tercatat');
        if (x.breakKind !== 'fingerprint') return '';
        var over = Math.floor(x.breakOver || 0);
        return h('span', null, mins(x.breakMinutes),
          x.breakCredit ? h('span', { class: 'small muted d-block' }, '+' + mins(x.breakCredit) + ' dihitung kerja') : null,
          over ? h('span', { class: 'd-block' }, MklUI.badge('lebih ' + over + ' m', 'warning')) : null);
      }

      function openDetail(employeeId, canEdit) {
        MklUI.clear(detail).appendChild(MklUI.loadingState('Memuat rincian...'));
        detail.scrollIntoView({ block: 'start' });
        MklApi.call('hr.attendance.recap', { from: range.from, to: range.to, employeeId: employeeId }).then(function (res) {
          MklUI.clear(detail);
          if (!res.success) { detail.appendChild(MklUI.errorState(res, function () { openDetail(employeeId, canEdit); })); return; }
          var it = res.data.items[0];
          var close = h('button', { class: 'btn btn-ghost btn-small', type: 'button' }, 'Tutup Rincian');
          close.addEventListener('click', function () { MklUI.clear(detail); });
          var days = it.days.filter(function (x) { return x.status !== 'kosong' || x.clockIn; });
          var heading = h('h2', { class: 'card-title', tabindex: '-1' }, 'Rincian ' + it.fullName);
          detail.appendChild(MklUI.card(null, [
            h('div', { class: 'card-head' }, heading, close),
            h('div', { class: 'recap-table' }, MklUI.table([
              { label: 'Tanggal', render: function (x) { return T.dayLabel(x.date); } },
              { label: 'Jadwal', render: function (x) { return x.shift ? h('span', null, T.shiftChip(x.shift), ' ' + x.shift.startTime + '–' + x.shift.endTime) : (x.off ? 'Libur' : '-'); } },
              { label: 'Masuk', render: function (x) { return x.clockIn; } },
              { label: 'Pulang', render: function (x) { return x.clockOut ? x.clockOut + (x.clockOutNextDay ? ' (+1)' : '') : ''; } },
              { label: 'Status', render: function (x) { return T.statusBadge(x.status, x.statusLabel); } },
              { label: 'Terlambat', render: function (x) { return x.lateMinutes ? x.lateMinutes + ' m' : ''; } },
              { label: 'Istirahat', render: breakCell },
              { label: 'Lama hadir', render: function (x) {
                if (!x.spanMinutes) return '';
                var sub = [];
                if (x.paidMinutes && Math.floor(x.paidMinutes) !== Math.floor(x.spanMinutes)) sub.push('dibayar ' + mins(x.paidMinutes));
                if (x.payNote) sub.push(x.payNote);
                return h('span', null, mins(x.spanMinutes), sub.length ? h('span', { class: 'small muted d-block' }, sub.join('; ')) : null);
              } },
              { label: 'Sumber', render: function (x) { return sourceText(x.source); } },
              { label: 'Keterangan', render: function (x) { return x.notes ? h('span', { class: 'small' }, x.notes) : ''; } },
              canEdit ? { label: 'Aksi', className: 'col-action', render: function (x) {
                if (x.date > MklUI.todayYmd()) return '';
                var b = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, x.clockIn ? 'Ubah' : 'Catat');
                b.addEventListener('click', function () { manualForm(it, x, function () { openDetail(employeeId, canEdit); }); });
                return b;
              } } : null
            ].filter(Boolean), days, 'Tidak ada jadwal atau absen pada rentang ini.')),
            h('p', { class: 'muted small' }, 'Istirahat diambil dari fingerprint Raptor (jeda antara dua sesi). Lama hadir dihitung sama seperti di Penggajian: jam masuk dibulatkan sesuai Profil Gaji, istirahat 1 jam ikut dibayar, dan istirahat yang lebih pendek menambah jam kerja.'),
            canEdit ? h('p', { class: 'muted small' }, 'Catat/Ubah dipakai bila karyawan lupa absen atau ponselnya bermasalah. Setiap perubahan wajib beralasan dan tercatat di audit log.') : null
          ]));
          heading.focus();
        });
      }

      function manualForm(emp, day, done) {
        var form = h('form', { class: 'stack', novalidate: true });
        var cin = MklUI.field({ label: 'Jam masuk', name: 'clockIn', type: 'time', value: day.clockIn || (day.shift ? day.shift.startTime : '') });
        var cout = MklUI.field({ label: 'Jam pulang', name: 'clockOut', type: 'time', value: day.clockOut || '', hint: 'Kosongkan jika belum pulang.' });
        var nextDay = MklUI.checkboxField({ label: 'Pulang keesokan hari', name: 'clockOutNextDay', checked: day.clockOutNextDay, hint: 'Untuk shift malam yang selesai lewat tengah malam.' });
        var reason = MklUI.field({ label: 'Alasan', name: 'reason', required: true, multiline: true, rows: 2, maxLength: 300, placeholder: 'Contoh: ponsel rusak, dicek CCTV' });
        var alertSlot = h('div');
        [h('p', null, h('strong', null, emp.fullName), ' · ' + T.dayLabel(day.date, true)), cin.wrap, cout.wrap, nextDay.wrap, reason.wrap, alertSlot].forEach(function (x) { form.appendChild(x); });
        var ctl = MklUI.modal({
          title: day.clockIn ? 'Ubah absensi' : 'Catat absensi', content: form,
          actions: [{ label: 'Batal', onClick: function (c) { c.close(); } }, { label: 'Simpan', variant: 'primary', id: 'ok', onClick: submit }]
        });
        form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });
        function submit(c, btn) {
          MklUI.clearFieldErrors(form);
          MklUI.clear(alertSlot);
          var p = { employeeId: emp.employeeId, workDate: day.date, reason: reason.input.value.trim(), clockOutNextDay: nextDay.input.checked };
          if (cin.input.value && cin.input.value !== day.clockIn) p.clockIn = cin.input.value;
          if (cout.input.value && (cout.input.value !== day.clockOut || nextDay.input.checked !== day.clockOutNextDay)) p.clockOut = cout.input.value;
          if (!p.clockIn && !p.clockOut) { alertSlot.appendChild(MklUI.alertBox('error', 'Tidak ada jam yang diubah.')); return; }
          MklUI.setBusy(btn, true, 'Menyimpan...');
          MklApi.call('hr.attendance.setManual', p).then(function (res) {
            MklUI.setBusy(btn, false);
            if (!res.success) { if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message)); return; }
            c.close();
            MklUI.toast(res.message, 'success');
            done();
          });
        }
      }

      load();
    }
  });

  // ================================================================== Impor Raptor

  function stepper(active) {
    var steps = ['Pilih file', 'Pasangkan karyawan', 'Selesai'];
    return h('ol', { class: 'stepper', 'aria-label': 'Langkah impor' }, steps.map(function (s, i) {
      var n = i + 1;
      return h('li', { class: 'stepper-item' + (n === active ? ' is-active' : '') + (n < active ? ' is-done' : ''), 'aria-current': n === active ? 'step' : null },
        h('span', { class: 'stepper-num' }, String(n)), h('span', null, s));
    }));
  }

  MklNav.register('/absensi/impor', {
    title: 'Impor Absensi Raptor',
    perm: 'attendance.import',
    render: function (root) {
      root.appendChild(h('p', null, h('a', { href: '#/absensi' }, '← Kembali ke Rekap Absensi')));
      root.appendChild(MklUI.pageHeader('Impor Absensi dari Raptor', 'Memasukkan jam masuk/pulang dari laporan Employee\'s Time / Attendance Raptor.'));
      var area = h('div');
      root.appendChild(area);
      showPick();

      // ------------------------------------------------------------ langkah 1
      function showPick() {
        MklUI.clear(area);
        area.appendChild(stepper(1));
        var file = MklUI.fileField({ label: 'File laporan Raptor', name: 'file', accept: '.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', hint: 'File .xls atau .xlsx hasil ekspor Raptor, maksimal 5 MB. Jangan diubah isinya.' });
        var alertSlot = h('div');
        var btn = h('button', { class: 'btn btn-primary', type: 'submit' }, 'Periksa File');
        var form = h('form', { class: 'stack', novalidate: true }, file.wrap, alertSlot, h('div', { class: 'form-actions' }, btn));
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          MklUI.clearFieldErrors(form);
          MklUI.clear(alertSlot);
          var f = file.input.files && file.input.files[0];
          var err = !f ? 'Pilih file terlebih dahulu.' : (!/\.(xls|xlsx)$/i.test(f.name) ? 'Gunakan file .xls atau .xlsx dari Raptor.' : (f.size > 5 * 1024 * 1024 ? 'Ukuran file ' + MklUI.fmtBytes(f.size) + '. Maksimal 5 MB.' : ''));
          if (err) { MklUI.showFieldErrors(form, { details: { fields: { file: err } } }); return; }
          MklUI.setBusy(btn, true, 'Membaca file...');
          MklUI.readFileBase64(f).then(function (b64) {
            return MklApi.call('hr.attendance.importPreview', { fileName: f.name, mimeType: f.type || '', base64: b64 });
          }, function () { return { success: false, message: 'File tidak bisa dibaca oleh browser. Coba pilih ulang file.' }; }).then(function (res) {
            MklUI.setBusy(btn, false);
            if (!res.success) { if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message)); return; }
            showPreview(res.data);
          });
        });
        area.appendChild(MklUI.card('1. Pilih file', [
          h('div', { class: 'note' }, h('ol', null,
            h('li', null, 'Di Raptor, buka laporan Employee\'s Time / Attendance.'),
            h('li', null, 'Pilih periode (misalnya tanggal 27 sampai 26 bulan berikutnya), lalu ekspor ke Excel.'),
            h('li', null, 'Unggah file tersebut di sini.'))),
          h('p', { class: 'muted small' }, 'Pratinjau belum menyimpan apa pun. File tidak disimpan di server. Fingerprint menjadi dasar gaji; jam absen portal disimpan sebagai pembanding dan cadangan. Catatan HR tidak akan ditimpa.'),
          form
        ]));
        var hist = h('div');
        area.appendChild(hist);
        importHistory(hist, showPick, { mappings: true });
      }

      // ------------------------------------------------------------ langkah 2
      function showPreview(p) {
        MklUI.clear(area);
        area.appendChild(stepper(2));
        area.appendChild(MklUI.card('Ringkasan file', MklUI.infoList([
          ['File', p.fileName],
          ['Periode', T.rangeLabel(p.period.from, p.period.to)],
          ['Nomor karyawan Raptor', String(p.counts.employees)],
          ['Hari kerja', p.counts.days + ' (' + p.counts.sessions + ' baris absen)'],
          ['Perlu dicek', p.counts.warnings ? MklUI.badge(p.counts.warnings + ' catatan', 'warning') : '0']
        ])));

        var selects = [];
        var opts = [{ value: '', label: '— Belum dipilih —' }, { value: '__ignore', label: 'Abaikan (bukan karyawan)' }]
          .concat(p.employeeOptions.map(function (e) { return { value: e.employeeId, label: e.fullName + ' (' + e.employeeId + ')' }; }));
        var rows = p.employees.map(function (e) {
          var value = e.mapped ? e.mapped.employeeId : (e.ignored ? '__ignore' : (e.suggestion ? e.suggestion.employeeId : ''));
          var sel = h('select', { class: 'input', 'aria-label': 'Karyawan untuk nomor Raptor ' + e.empNo });
          opts.forEach(function (o) { sel.appendChild(h('option', { value: o.value }, o.label)); });
          if (e.mapped && !p.employeeOptions.some(function (o) { return o.employeeId === e.mapped.employeeId; })) {
            sel.appendChild(h('option', { value: e.mapped.employeeId }, e.mapped.fullName + ' (' + e.mapped.employeeId + ', tidak aktif)'));
          }
          sel.value = value;
          selects.push({ e: e, sel: sel });
          var note = h('span');
          var paintNote = function () {
            var v = sel.value;
            var b;
            if (!v) b = MklUI.badge('Pilih karyawan', 'warning');
            else if (v === '__ignore') b = MklUI.badge(e.ignored ? 'Diabaikan (tersimpan)' : 'Diabaikan', 'muted');
            else if (e.mapped && v === e.mapped.employeeId) b = MklUI.badge('Tersimpan', 'success');
            else if (e.suggestion && v === e.suggestion.employeeId) b = MklUI.badge('Saran dari nama', 'info');
            else b = MklUI.badge('Dipilih', 'info');
            MklUI.clear(note).appendChild(b);
          };
          sel.addEventListener('change', paintNote);
          paintNote();
          return { e: e, sel: sel, note: note };
        });
        var alertSlot = h('div', { 'aria-live': 'polite' });
        area.appendChild(MklUI.card('2. Pasangkan nomor Raptor dengan karyawan', [
          h('p', null, 'Periksa setiap baris. Pilihan disimpan, sehingga impor berikutnya otomatis. Nomor yang belum dipilih dilewati.'),
          MklUI.table([
            { label: 'Nomor Raptor', render: function (r) { return h('code', null, r.e.empNo); } },
            { label: 'Nama di Raptor', render: function (r) { return r.e.raptorName; } },
            { label: 'Hari', render: function (r) { return r.e.days + (r.e.warnings ? ' (' + r.e.warnings + ' dicek)' : ''); } },
            { label: 'Karyawan di portal', render: function (r) { return h('div', { class: 'stack-tight' }, r.sel, r.note); } }
          ], rows, '')
        ]));

        if (p.warnings.length) {
          var det = h('details', { class: 'note' }, h('summary', null, 'Catatan yang perlu dicek (' + p.warnings.length + ')'),
            h('ul', { class: 'plain-list small' }, p.warnings.map(function (w) {
              return h('li', null, h('strong', null, w.raptorName + ' · ' + MklUI.fmtDate(w.date)), ': ' + w.message);
            })));
          area.appendChild(MklUI.card(null, [det, h('p', { class: 'muted small' }, 'Hari dengan catatan tetap diimpor dan ditandai "perlu dicek". Perbaiki lewat Rekap Absensi > Rincian > Ubah bila perlu.')]));
        }

        var back = h('button', { class: 'btn btn-secondary', type: 'button' }, 'Pilih File Lain');
        var go = h('button', { class: 'btn btn-primary', type: 'button' }, 'Impor Absensi');
        back.addEventListener('click', showPick);
        area.appendChild(alertSlot);
        area.appendChild(h('div', { class: 'form-actions' }, back, go));
        go.addEventListener('click', function () {
          MklUI.clear(alertSlot);
          var used = {};
          var dup = null;
          var mappings = selects.map(function (s) {
            var v = s.sel.value;
            if (v && v !== '__ignore') { if (used[v]) dup = v; used[v] = true; }
            return { empNo: s.e.empNo, employeeId: v === '__ignore' ? '' : v, ignore: v === '__ignore' };
          });
          if (dup) { alertSlot.appendChild(MklUI.alertBox('error', 'Karyawan ' + dup + ' dipilih untuk lebih dari satu nomor Raptor. Periksa kembali.')); return; }
          var unpicked = mappings.filter(function (m) { return !m.employeeId && !m.ignore; }).length;
          MklUI.confirmAction({
            title: 'Impor absensi',
            message: h('div', null,
              h('p', null, 'Simpan absensi Raptor periode ' + T.rangeLabel(p.period.from, p.period.to) + '?'),
              unpicked ? h('p', null, unpicked + ' nomor Raptor belum dipilih dan akan dilewati.') : null,
              h('p', { class: 'muted small' }, 'Hari yang juga diabsen di portal sekarang memakai jam fingerprint (jam portal disimpan sebagai pembanding). Bila fingerprint tidak punya jam pulang, jam pulang portal dipakai. Hari yang sudah dikoreksi HR tidak diubah.')),
            confirmLabel: 'Impor',
            onConfirm: function () {
              return MklApi.call('hr.attendance.importCommit', { importId: p.importId, mappings: mappings }).then(function (res) {
                if (res.success) window.setTimeout(function () { showDone(res); }, 0);
                return res;
              });
            }
          });
        });
      }

      // ------------------------------------------------------------ langkah 3
      function showDone(res) {
        var r = res.data.result;
        MklUI.clear(area);
        area.appendChild(stepper(3));
        area.appendChild(MklUI.alertBox('success', res.message));
        area.appendChild(MklUI.card('Hasil impor', MklUI.infoList([
          ['Periode', T.rangeLabel(res.data.period.from, res.data.period.to)],
          ['Hari baru', String(r.created)],
          ['Diperbarui', String(r.updated)],
          ['Sama seperti sebelumnya', String(r.unchanged)],
          ['Perlu dicek HR', r.needsCheck ? MklUI.badge(String(r.needsCheck), 'warning') : '0'],
          ['Hari portal yang sekarang memakai jam fingerprint', String(r.portalDays || 0)],
          ['Jam pulang dari portal (fingerprint pulang tidak ada)', String(r.portalOutUsed || 0)],
          ['Dilewati: sudah dikoreksi HR', String(r.skippedExisting)],
          ['Dilewati: nomor belum dipasangkan', String(r.skippedUnmapped)],
          ['Dilewati: diabaikan', String(r.skippedIgnored)],
          ['Dilewati: tanggal di masa depan', String(r.skippedFuture)]
        ])));
        var big = res.data.comparisons.filter(function (c) { return Math.abs(c.diffMinutes) >= 15; });
        if (big.length) {
          area.appendChild(MklUI.card('Selisih jam masuk aplikasi dan Raptor ≥ 15 menit', [
            h('p', { class: 'muted small' }, 'Absen aplikasi tetap dipakai. Selisih besar bisa berarti lupa absen di salah satu sistem atau lokasi ponsel tidak wajar; cek bersama karyawan.'),
            MklUI.table([
              { label: 'Nama', render: function (c) { return c.fullName; } },
              { label: 'Tanggal', render: function (c) { return MklUI.fmtDate(c.date); } },
              { label: 'Aplikasi/HR', render: function (c) { return c.portalIn + ' (' + sourceText(c.source) + ')'; } },
              { label: 'Raptor', render: function (c) { return c.raptorIn; } },
              { label: 'Selisih', render: function (c) { return Math.abs(c.diffMinutes) + ' menit'; } }
            ], big, '')
          ]));
        }
        area.appendChild(h('div', { class: 'form-actions' },
          h('a', { class: 'btn btn-primary', href: '#/absensi' }, 'Lihat Rekap Absensi'),
          h('button', { class: 'btn btn-secondary', type: 'button', onClick: showPick }, 'Impor File Lain')));
      }
    }
  });
})();
