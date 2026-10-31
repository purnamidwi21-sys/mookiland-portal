/*
 * Penggajian: periode gaji (27–26), hitung dari absensi, tambahan/potongan
 * manual, pengajuan ke Direktur, persetujuan, tanda sudah dibayar, daftar
 * transfer, dan slip gaji per periode.
 * Semua hak akses diperiksa server; tombol di sini hanya mengikuti flags dari server.
 */
(function () {
  'use strict';
  var h = MklUI.h;
  var T = window.MklTimeUI;
  var VIEW = ['payroll.prepare', 'payroll.approve'];
  var STATUS_VARIANT = { draf: 'muted', dihitung: 'info', diajukan: 'warning', disetujui: 'success', dibayar: 'success' };

  function statusBadge(p) { return MklUI.badge(p.statusLabel, STATUS_VARIANT[p.status] || 'muted'); }
  function hours(min) { return min ? (Math.round(min / 6) / 10).toString().replace('.', ',') + ' j' : '-'; }
  function stat(label, value, variant) { return T.stat(label, value, variant); }
  function money2(n) {
    var c = Math.round(n * 100), frac = c % 100;
    return MklUI.fmtMoney(Math.floor(c / 100)) + (frac ? ',' + (frac < 10 ? '0' : '') + frac : '');
  }
  /** Menit berpecahan -> "8:37:04" (jam:menit:detik), sama seperti file gaji lama. */
  function dur(min) {
    if (!min) return '-';
    var t = Math.round(min * 60), two = function (n) { return (n < 10 ? '0' : '') + n; };
    return Math.floor(t / 3600) + ':' + two(Math.floor(t / 60) % 60) + ':' + two(t % 60);
  }

  /** Perkiraan tanggal periode di layar (server yang menentukan). */
  function periodPreview(ym) {
    if (!/^\d{4}-\d{2}$/.test(ym)) return '';
    var y = +ym.slice(0, 4), m = +ym.slice(5, 7);
    var end = new Date(Date.UTC(y, m - 1, 26)), start = new Date(Date.UTC(y, m - 2, 27));
    return 'Periode ' + T.monthLabel(ym) + ': ' + MklUI.fmtDate(start.toISOString().slice(0, 10)) + ' – ' + MklUI.fmtDate(end.toISOString().slice(0, 10)) + '.';
  }

  function createPeriodModal(suggested, done) {
    var form = h('form', { class: 'stack', novalidate: true });
    var month = MklUI.field({ label: 'Bulan gaji', name: 'month', type: 'month', required: true, value: suggested, hint: 'Gaji bulan X = absensi tanggal 27 bulan sebelumnya sampai tanggal 26 bulan X.' });
    var preview = h('p', { class: 'muted small' }, periodPreview(suggested));
    var pay = MklUI.field({ label: 'Rencana tanggal bayar (opsional)', name: 'payDate', type: 'date' });
    var alertSlot = h('div');
    [month.wrap, preview, pay.wrap, alertSlot].forEach(function (x) { form.appendChild(x); });
    month.input.addEventListener('input', function () { preview.textContent = periodPreview(month.input.value); });
    var ctl = MklUI.modal({
      title: 'Buat periode gaji', content: form,
      actions: [{ label: 'Batal', onClick: function (c) { c.close(); } }, { label: 'Buat Periode', variant: 'primary', id: 'ok', onClick: submit }]
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });
    function submit(c, btn) {
      MklUI.clearFieldErrors(form);
      MklUI.clear(alertSlot);
      var p = { month: month.input.value };
      if (pay.input.value) p.payDate = pay.input.value;
      MklUI.setBusy(btn, true, 'Membuat...');
      MklApi.call('hr.payroll.createPeriod', p).then(function (res) {
        MklUI.setBusy(btn, false);
        if (!res.success) { if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message)); return; }
        c.close();
        MklUI.toast(res.message, 'success');
        done(res.data.periodId);
      });
    }
  }

  // ================================================================== daftar periode

  MklNav.register('/penggajian', {
    title: 'Penggajian',
    perm: VIEW,
    menu: { label: 'Penggajian', order: 18, section: 'Penggajian' },
    render: function (root) {
      var createBtn = MklState.can('payroll.prepare') ? h('button', { class: 'btn btn-primary', type: 'button' }, 'Buat Periode') : null;
      root.appendChild(MklUI.pageHeader('Penggajian', 'Periode gaji tanggal 27 sampai 26, dihitung dari absensi.', createBtn));
      var area = h('div');
      root.appendChild(area);
      var suggested = '';
      if (createBtn) createBtn.addEventListener('click', function () { createPeriodModal(suggested, function (id) { MklNav.go('/penggajian/' + id); }); });
      function load() {
        MklUI.clear(area).appendChild(MklUI.loadingState('Memuat...'));
        MklApi.call('hr.payroll.periods', {}).then(function (res) {
          MklUI.clear(area);
          if (!res.success) { area.appendChild(MklUI.errorState(res, load)); return; }
          suggested = res.data.suggestedMonth;
          var waiting = res.data.items.filter(function (p) { return p.status === 'diajukan'; });
          if (waiting.length && MklState.can('payroll.approve')) area.appendChild(MklUI.alertBox('warning', waiting.length + ' periode gaji menunggu persetujuan Direktur.'));
          area.appendChild(MklUI.card(null, MklUI.table([
            { label: 'Periode', render: function (p) { return h('span', null, h('strong', null, p.label), h('br'), h('span', { class: 'muted small' }, T.rangeLabel(p.startDate, p.endDate))); } },
            { label: 'Status', render: statusBadge },
            { label: 'Karyawan', render: function (p) { return p.calcVersion ? String(p.totals.employees) : '-'; } },
            { label: 'Total bersih', render: function (p) { return p.calcVersion ? MklUI.fmtMoney(p.totals.net) : '-'; } },
            { label: 'Dihitung', render: function (p) { return p.calculatedAt ? h('span', { class: 'small' }, MklUI.fmtDateTime(p.calculatedAt) + (p.preparedBy ? ' oleh ' + p.preparedBy : '')) : 'Belum'; } },
            { label: 'Aksi', className: 'col-action', render: function (p) { return h('a', { class: 'btn btn-secondary btn-small', href: '#/penggajian/' + p.periodId }, 'Buka'); } }
          ], res.data.items, createBtn ? 'Belum ada periode gaji. Tekan Buat Periode untuk mulai.' : 'Belum ada periode gaji.')));
        });
      }
      load();
    }
  });

  // ================================================================== rincian per karyawan

  function adjustModal(periodId, item, done, quiet) {
    var form = h('form', { class: 'stack', novalidate: true });
    var kind = MklUI.selectField({ label: 'Jenis', name: 'kind', required: true, value: 'tambah', options: [{ value: 'tambah', label: 'Tambahan (bonus, insentif, uang makan, dll.)' }, { value: 'potong', label: 'Potongan (kasbon, kerusakan, dll.)' }] });
    var desc = MklUI.field({ label: 'Keterangan di slip', name: 'description', required: true, maxLength: 100, placeholder: 'Contoh: Bonus target, Kasbon Oktober' });
    var amount = MklUI.field({ label: 'Jumlah (Rp)', name: 'amount', type: 'number', inputmode: 'numeric', required: true });
    MklUI.moneyPreview(amount);
    var reason = MklUI.field({ label: 'Alasan', name: 'reason', required: true, multiline: true, rows: 2, maxLength: 300, hint: 'Dicatat di audit log payroll.' });
    var alertSlot = h('div');
    [h('p', null, h('strong', null, item.fullName)), kind.wrap, desc.wrap, amount.wrap, reason.wrap, alertSlot].forEach(function (x) { form.appendChild(x); });
    var ctl = MklUI.modal({
      title: 'Tambahan / potongan manual', content: form,
      actions: [{ label: 'Batal', onClick: function (c) { c.close(); } }, { label: 'Simpan', variant: 'primary', id: 'ok', onClick: submit }]
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });
    function submit(c, btn) {
      MklUI.clearFieldErrors(form);
      MklUI.clear(alertSlot);
      MklUI.setBusy(btn, true, 'Menyimpan...');
      MklApi.call('hr.payroll.adjust', { periodId: periodId, employeeId: item.employeeId, kind: kind.input.value, description: desc.input.value.trim(), amount: Number(amount.input.value || 0), reason: reason.input.value.trim() }).then(function (res) {
        MklUI.setBusy(btn, false);
        if (!res.success) { if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message)); return; }
        c.close();
        if (!quiet) MklUI.toast(res.message, 'success');
        done();
      });
    }
  }

  /** Koreksi absen fingerprint dari jendela Rincian (attendance.manage). day = null untuk mencatat hari yang belum ada. */
  function correctModal(d, item, day, done) {
    var form = h('form', { class: 'stack', novalidate: true });
    var date = MklUI.field({ label: 'Tanggal', name: 'workDate', type: 'date', required: true, value: day ? day.date : '' });
    date.input.min = d.period.startDate; date.input.max = d.period.endDate < MklUI.todayYmd() ? d.period.endDate : MklUI.todayYmd();
    if (day) date.input.readOnly = true;
    var cin = MklUI.field({ label: 'Jam masuk', name: 'clockIn', type: 'time', value: day ? day.clockIn : '', hint: day ? 'Tercatat: ' + day.clockIn : 'Contoh 09:55.' });
    var cout = MklUI.field({ label: 'Jam pulang', name: 'clockOut', type: 'time', value: day ? day.clockOut : '', hint: day ? 'Tercatat: ' + (day.clockOut || 'belum ada') : '' });
    [cin, cout].forEach(function (f) { f.input.step = '1'; });
    var nextDay = MklUI.checkboxField({ label: 'Pulang keesokan hari', name: 'clockOutNextDay', checked: false, hint: 'Untuk shift yang selesai lewat tengah malam.' });
    var wasSpecial = !!(day && /Shift khusus/.test(day.note || ''));
    var special = MklUI.checkboxField({ label: 'Shift khusus (jam masuk tidak dibulatkan)', name: 'specialShift', checked: wasSpecial, hint: 'Centang bila karyawan diminta datang di luar jam shift resmi. Upah dihitung dari jam masuk asli.' });
    var brk = MklUI.field({ label: 'Istirahat (menit)', name: 'breakMinutes', type: 'number', inputmode: 'decimal', value: day && day.breakMinutes ? String(Math.round(day.breakMinutes * 100) / 100) : '0',
      hint: 'Jeda antara absen keluar dan masuk lagi saat istirahat. 0 = istirahat tidak tercatat (dianggap istirahat biasa, termasuk dalam 8 jam). Istirahat 1–49 menit: sisanya sampai 60 menit dihitung jam kerja. Bila benar-benar tidak istirahat, centang Tidak istirahat.' });
    var wasNoBreak = !!(day && /Tidak istirahat/.test(day.note || ''));
    var noBreak = MklUI.checkboxField({ label: 'Tidak istirahat (bekerja terus)', name: 'noBreak', checked: wasNoBreak, hint: 'Centang bila karyawan benar-benar tidak istirahat. 60 menit istirahat ditambahkan sebagai jam kerja (bisa jadi lembur).' });
    noBreak.input.addEventListener('change', function () { brk.wrap.hidden = noBreak.input.checked; });
    brk.wrap.hidden = wasNoBreak;
    var reason = MklUI.field({ label: 'Alasan', name: 'reason', required: true, multiline: true, rows: 2, maxLength: 300, placeholder: 'Contoh: lupa absen pulang, dicek CCTV / konfirmasi supervisor' });
    var alertSlot = h('div');
    [h('p', null, h('strong', null, item.fullName), day ? ' · ' + T.dayLabel(day.date, true) : ''), day ? null : date.wrap, cin.wrap, cout.wrap, nextDay.wrap, special.wrap, noBreak.wrap, brk.wrap, reason.wrap,
      h('p', { class: 'muted small' }, 'Perubahan tercatat di audit log dan tidak tertimpa saat impor Raptor berikutnya.'), alertSlot].forEach(function (x) { if (x) form.appendChild(x); });
    var ctl = MklUI.modal({
      title: day ? 'Koreksi absen' : 'Catat absen', content: form,
      actions: [{ label: 'Batal', onClick: function (c) { c.close(); } }, { label: 'Simpan', variant: 'primary', id: 'ok', onClick: submit }]
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });
    function norm(t) { return t && t.length === 5 ? t + ':00' : t; }
    function submit(c, btn) {
      MklUI.clearFieldErrors(form);
      MklUI.clear(alertSlot);
      var p = { employeeId: item.employeeId, workDate: date.input.value, reason: reason.input.value.trim(), clockOutNextDay: nextDay.input.checked };
      if (cin.input.value && (!day || norm(cin.input.value) !== day.clockIn)) p.clockIn = norm(cin.input.value);
      if (cout.input.value && (!day || norm(cout.input.value) !== day.clockOut || nextDay.input.checked)) p.clockOut = norm(cout.input.value);
      var b = Number(String(brk.input.value || '0').replace(',', '.'));
      if (!noBreak.input.checked && (!day || Math.abs(b - (day.breakMinutes || 0)) > 0.001)) p.breakMinutes = b;
      if (noBreak.input.checked !== wasNoBreak || (!day && noBreak.input.checked)) p.noBreak = noBreak.input.checked;
      if (special.input.checked !== wasSpecial || (!day && special.input.checked)) p.specialShift = special.input.checked;
      if (day && !p.clockIn && !p.clockOut && p.breakMinutes === undefined && p.specialShift === undefined && p.noBreak === undefined) { alertSlot.appendChild(MklUI.alertBox('error', 'Tidak ada yang diubah.')); return; }
      MklUI.setBusy(btn, true, 'Menyimpan...');
      MklApi.call('hr.attendance.setManual', p).then(function (res) {
        MklUI.setBusy(btn, false);
        if (!res.success) { if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message)); return; }
        c.close();
        done(res.message);
      });
    }
  }

  /** Hitung ulang gaji satu karyawan (cepat; karyawan lain tidak berubah). */
  function recalcOne(periodId, item, quiet) {
    return MklApi.call('hr.payroll.calculate', { periodId: periodId, employeeIds: [item.employeeId] }).then(function (r) {
      if (!r.success) MklUI.toast(r.message, 'error');
      else if (!quiet) MklUI.toast(r.message, 'success');
      return r;
    });
  }

  function detailModal(periodId, item, onChanged) {
    var body = h('div', { class: 'stack' }, MklUI.loadingState('Memuat...'));
    var dirty = false;
    // Halaman periode dimuat ulang sekali saja, saat jendela ini ditutup.
    var ctl = MklUI.modal({ title: 'Rincian gaji: ' + item.fullName, content: body, wide: true, actions: [{ label: 'Tutup', onClick: function (c) { c.close(); } }],
      onClose: function () { if (dirty) onChanged(); } });
    ctl.dialog.classList.add('modal-payroll');
    var canCalc = true;
    /** Setelah koreksi/tambahan: gaji karyawan ini langsung dihitung ulang (tidak perlu menekan Hitung Ulang). */
    function changed(msg) {
      dirty = true;
      MklUI.clear(body).appendChild(MklUI.loadingState('Menghitung ulang gaji ' + item.fullName + '...'));
      if (!canCalc) { if (msg) MklUI.toast(msg, 'success'); load(); return; }
      recalcOne(periodId, item, true).then(function (r) {
        if (r.success) MklUI.toast((msg ? msg + ' ' : '') + 'Gaji ' + item.fullName + ' sudah dihitung ulang.', 'success');
        load();
      });
    }
    function load() {
      MklApi.call('hr.payroll.detail', { periodId: periodId, employeeId: item.employeeId }).then(function (res) {
        MklUI.clear(body);
        if (!res.success) { body.appendChild(MklUI.alertBox('error', res.message)); return; }
        var d = res.data, p = d.profile || {};
        canCalc = !!d.canCalculate;
        var final = d.period.status === 'disetujui' || d.period.status === 'dibayar';
        var bRin = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Unduh Rincian (PDF)');
        bRin.addEventListener('click', function () { download('hr.payroll.detailDownload', { periodId: periodId, employeeId: item.employeeId }, bRin); });
        var bSlip = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, d.payslipIssued ? 'Unduh Slip Gaji' : 'Unduh Slip (DRAF)');
        bSlip.addEventListener('click', function () { download('hr.payroll.slipDownload', { periodId: periodId, employeeId: item.employeeId }, bSlip); });
        body.appendChild(h('div', { class: 'btn-row' }, bRin, MklState.canAny(['payroll.prepare', 'payslip.read.all']) ? bSlip : null));
        if (!final) body.appendChild(h('p', { class: 'muted small' }, 'Periode belum disetujui Direktur: rincian dan slip bertanda DRAF dan bisa berubah.'));
        if (d.stale) {
          var rc = d.canCalculate ? h('button', { class: 'btn btn-primary btn-small', type: 'button' }, 'Hitung Ulang ' + item.fullName) : null;
          if (rc) rc.addEventListener('click', function () { changed(''); });
          body.appendChild(h('div', { class: 'alert alert-warning' }, h('p', null, 'Data karyawan ini berubah setelah gajinya dihitung (' + (d.staleReason || 'ada perubahan') + '). Angka di bawah belum termasuk perubahan itu.'), rc ? h('div', { class: 'btn-row' }, rc) : null));
        }
        body.appendChild(MklUI.infoList([
          ['Periode', d.period.label + ' (' + T.rangeLabel(d.period.startDate, d.period.endDate) + ')'],
          ['Profil gaji', p.payType ? p.payTypeLabel + ', ' + (p.payType === 'harian' ? MklUI.fmtMoney(p.dailyRate) + '/hari' : MklUI.fmtMoney(p.monthlySalary) + '/bulan') + ', maks ' + p.paidHoursCap + ' jam' + (p.clockinRounding ? ', jam masuk dibulatkan' : '') + (p.overtimeEligible ? ', dapat lembur' : ', tanpa lembur') : '-'],
          ['Tarif per jam', d.stats.hourlyRate ? money2(d.stats.hourlyRate) + ' (gaji ÷ ' + String(Math.round(d.stats.hourlyDivisor * 100) / 100).replace('.', ',') + ')' : 'Hitung Ulang untuk menampilkan'],
          ['Aturan jam masuk', d.stats.shiftRule || 'Tekan Hitung Ulang (versi 0.9.16) untuk menampilkan'],
          ['Hari hadir', String(d.stats.present || 0)],
          ['Lembur disetujui di Persetujuan', T.fmtMinutes(d.stats.approvedOvertimeMinutes || 0) + ' (sebagai pembanding; upah lembur dihitung dari jam absen)']
        ]));
        if (d.warnings.length) body.appendChild(h('div', { class: 'alert alert-warning' }, h('ul', { class: 'warning-list' }, d.warnings.map(function (w) { return h('li', null, w); }))));
        var lineRows = d.lines.map(function (l) { return Object.assign({ state: l.removed ? 'removed' : '' }, l); })
          .concat((d.pendingAdjustments || []).map(function (j) { return Object.assign({ manual: true, state: 'pending' }, j); }));
        function removeButton(l) {
          var b = h('button', { class: 'btn btn-ghost btn-small', type: 'button' }, 'Hapus');
          b.addEventListener('click', function () {
            MklUI.confirmAction({
              title: 'Hapus tambahan/potongan', message: h('p', null, l.description + ': ' + MklUI.fmtMoney(l.amount)),
              confirmLabel: 'Hapus', danger: true, reasonLabel: 'Alasan', reasonRequired: true,
              onConfirm: function (reason) {
                return MklApi.call('hr.payroll.adjustRemove', { adjustmentId: l.adjustmentId, reason: reason }).then(function (r) {
                  if (r.success) changed('Dihapus.');
                  return r;
                });
              }
            });
          });
          return b;
        }
        body.appendChild(h('h3', null, 'Komponen gaji'));
        body.appendChild(MklUI.table([
          { label: 'Komponen', render: function (l) {
            var tag = l.state === 'pending' ? MklUI.badge('belum masuk total', 'warning') : (l.state === 'removed' ? MklUI.badge('dihapus, belum dihitung ulang', 'warning') : (l.manual ? MklUI.badge('manual', 'muted') : null));
            return h('span', null, l.description, tag ? h('span', null, ' ', tag) : null);
          } },
          { label: 'Jumlah', render: function (l) {
            var txt = (l.deduction ? '− ' : '') + MklUI.fmtMoney(l.amount);
            return l.state === 'removed' ? h('s', null, txt) : h('span', { class: l.deduction ? 'text-danger' : null }, txt);
          } },
          { label: 'Aksi', className: 'col-action', render: function (l) { return l.manual && l.state !== 'removed' && d.canAdjust ? removeButton(l) : ''; } }
        ], lineRows, 'Tidak ada komponen.'));
        body.appendChild(MklUI.infoList([['Total pendapatan', MklUI.fmtMoney(d.gross)], ['Total potongan', MklUI.fmtMoney(d.deductions)], ['Gaji bersih', h('strong', null, MklUI.fmtMoney(d.net))]]));
        if (lineRows.some(function (l) { return l.state; }) && !d.stale) body.appendChild(MklUI.alertBox('info', 'Total di atas belum termasuk perubahan bertanda kuning. Tekan Hitung Ulang di halaman periode.'));
        if (d.canAdjust) {
          var add = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Tambah / Potong Manual');
          add.addEventListener('click', function () { adjustModal(periodId, item, function () { changed(''); }, true); });
          body.appendChild(h('div', { class: 'btn-row' }, add));
        }
        body.appendChild(h('h3', null, 'Rincian per hari'));
        if (d.canCorrect) {
          var addDay = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Catat Absen Hari Lain');
          addDay.addEventListener('click', function () { correctModal(d, item, null, changed); });
          body.appendChild(h('div', { class: 'btn-row' }, addDay));
        }
        body.appendChild(h('div', { class: 'recap-table' }, MklUI.table([
          { label: 'Tanggal', render: function (x) { return T.dayLabel(x.date); } },
          { label: 'Masuk', render: function (x) { return x.adjustedIn && x.adjustedIn !== x.clockIn ? h('span', null, x.clockIn, h('br'), h('span', { class: 'muted small' }, 'dihitung ' + x.adjustedIn)) : x.clockIn; } },
          { label: 'Pulang', render: function (x) { return x.clockOut || '–'; } },
          { label: 'Istirahat', render: function (x) { return x.breakMinutes ? dur(x.breakMinutes) : '-'; } },
          { label: 'Lama hadir', render: function (x) { return x.spanMinutes ? dur(x.spanMinutes) : '-'; } },
          { label: 'Dibayar', render: function (x) { return x.pay ? h('span', null, dur(x.paidMinutes), h('br'), h('span', { class: 'muted small' }, MklUI.fmtMoney(x.pay))) : '-'; } },
          { label: 'Lembur', render: function (x) { return x.overtimeMinutes ? h('span', null, dur(x.overtimeMinutes), h('br'), h('span', { class: 'muted small' }, MklUI.fmtMoney(x.overtimePay))) : '-'; } },
          { label: 'Jam kurang', render: function (x) { return x.shortMinutes ? h('span', null, dur(x.shortMinutes), h('br'), h('span', { class: 'muted small' }, '− ' + MklUI.fmtMoney(x.shortDeduction))) : '-'; } },
          { label: 'Catatan', render: function (x) { return x.note ? h('span', { class: 'small' }, x.note) : ''; } },
          d.canCorrect ? { label: 'Aksi', className: 'col-action', render: function (x) {
            var b = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Koreksi');
            b.addEventListener('click', function () { correctModal(d, item, x, changed); });
            return b;
          } } : null
        ].filter(Boolean), d.days, 'Tidak ada absensi pada periode ini.')));
        body.appendChild(h('p', { class: 'muted small' }, 'Durasi ditulis jam:menit:detik.'));
      });
    }
    load();
    return ctl;
  }

  // ================================================================== halaman periode

  function markPaidModal(period, done) {
    var form = h('form', { class: 'stack', novalidate: true });
    var date = MklUI.field({ label: 'Tanggal dibayar', name: 'paidDate', type: 'date', required: true, value: MklUI.todayYmd(), hint: 'Tandai setelah transfer benar-benar dilakukan. Karyawan lalu bisa melihat slip gajinya, dan PDF slip dikirim ke email masing-masing karyawan.' });
    var alertSlot = h('div');
    [date.wrap, alertSlot].forEach(function (x) { form.appendChild(x); });
    var ctl = MklUI.modal({
      title: 'Tandai gaji ' + period.label + ' sudah dibayar', content: form,
      actions: [{ label: 'Batal', onClick: function (c) { c.close(); } }, { label: 'Tandai Sudah Dibayar', variant: 'primary', id: 'ok', onClick: submit }]
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });
    function submit(c, btn) {
      MklUI.clearFieldErrors(form);
      MklUI.clear(alertSlot);
      MklUI.setBusy(btn, true, 'Menyimpan & mengirim email...');
      MklApi.call('hr.payroll.markPaid', { periodId: period.periodId, paidDate: date.input.value }).then(function (res) {
        MklUI.setBusy(btn, false);
        if (!res.success) { if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message)); return; }
        c.close();
        MklUI.toast(res.message, 'success');
        done();
      });
    }
  }

  function decideModal(period, decision, done) {
    var form = h('form', { class: 'stack', novalidate: true });
    var note = MklUI.field({ label: decision === 'tolak' ? 'Alasan penolakan' : 'Catatan (opsional)', name: 'note', required: decision === 'tolak', multiline: true, rows: 3, maxLength: 300, hint: 'Dikirim ke Payroll yang mengajukan.' });
    var alertSlot = h('div');
    form.appendChild(h('p', null, decision === 'setuju'
      ? 'Setelah disetujui, angka gaji ' + period.label + ' terkunci dan slip gaji PDF dibuat. Karyawan baru bisa melihat slip setelah ditandai sudah dibayar.'
      : 'Periode dikembalikan ke Payroll untuk diperbaiki dan dihitung ulang.'));
    form.appendChild(note.wrap);
    form.appendChild(alertSlot);
    var ctl = MklUI.modal({
      title: (decision === 'setuju' ? 'Setujui' : 'Tolak') + ' gaji ' + period.label, content: form,
      actions: [{ label: 'Batal', onClick: function (c) { c.close(); } }, { label: decision === 'setuju' ? 'Setujui' : 'Tolak', variant: decision === 'setuju' ? 'primary' : 'danger', id: 'ok', onClick: submit }]
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });
    function submit(c, btn) {
      MklUI.clearFieldErrors(form);
      MklUI.clear(alertSlot);
      MklUI.setBusy(btn, true, 'Menyimpan...');
      MklApi.call('hr.payroll.decide', { periodId: period.periodId, decision: decision, note: note.input.value.trim() }).then(function (res) {
        MklUI.setBusy(btn, false);
        if (!res.success) { if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message)); return; }
        c.close();
        MklUI.toast(res.message, 'success');
        done();
      });
    }
  }

  function download(route, payload, btn) {
    MklUI.setBusy(btn, true, 'Mengunduh...');
    return MklApi.call(route, payload).then(function (res) {
      MklUI.setBusy(btn, false);
      if (!res.success) { MklUI.toast(res.message, 'error'); return res; }
      MklUI.downloadBase64(res.data.fileName, res.data.mimeType, res.data.base64);
      if (res.message) MklUI.toast(res.message, res.data.missingBank ? 'warning' : 'success');
      return res;
    });
  }

  function sendSlipEmail(payload, btn, done) {
    MklUI.setBusy(btn, true, 'Mengirim...');
    MklApi.call('hr.payroll.payslipEmail', payload).then(function (r) {
      MklUI.setBusy(btn, false);
      if (!r.success) { MklUI.toast(r.message, 'error'); return; }
      var bad = r.data && ((r.data.failed && r.data.failed.length) || (r.data.noEmail && r.data.noEmail.length));
      MklUI.toast(r.message, bad ? 'warning' : 'success');
      done();
    });
  }

  function payslipCard(periodId) {
    var body = h('div', null, MklUI.loadingState('Memuat...'));
    var canDownload = MklState.canAny(['payroll.prepare', 'payslip.read.all']);
    function load() {
      MklApi.call('hr.payroll.payslips', { periodId: periodId }).then(function (res) {
        MklUI.clear(body);
        if (!res.success) { body.appendChild(MklUI.alertBox('error', res.message)); return; }
        var d = res.data, canEmail = d.canEmail && d.emailEnabled;
        var pending = d.items.filter(function (s) { return s.paymentStatus === 'dibayar' && !s.emailedAt; });
        if (canEmail && pending.length) {
          var all = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Kirim Slip yang Belum Terkirim (' + pending.length + ')');
          all.addEventListener('click', function () { sendSlipEmail({ periodId: periodId }, all, load); });
          body.appendChild(h('div', { class: 'btn-row' }, all));
        }
        body.appendChild(MklUI.table([
          { label: 'Nomor slip', render: function (s) { return s.payslipNo; } },
          { label: 'Nama', render: function (s) { return s.fullName; } },
          { label: 'Pembayaran', render: function (s) { return s.paymentStatus === 'dibayar' ? MklUI.badge('Dibayar ' + MklUI.fmtDate(s.paidAt), 'success') : MklUI.badge('Belum dibayar', 'muted'); } },
          { label: 'Email', render: function (s) {
            if (!s.emailMasked) return MklUI.badge('Belum ada email', 'warning');
            return h('span', { class: 'small' }, s.emailMasked, h('br'), s.emailedAt ? h('span', { class: 'muted' }, 'terkirim ' + MklUI.fmtDateTime(s.emailedAt)) : h('span', { class: 'muted' }, s.paymentStatus === 'dibayar' ? 'belum terkirim' : 'dikirim saat ditandai dibayar'));
          } },
          { label: 'Dibuka karyawan', render: function (s) { return s.viewed ? 'Sudah' : 'Belum'; } },
          { label: 'Aksi', className: 'col-action', render: function (s) {
            var row = h('div', { class: 'btn-row' });
            if (canDownload) {
              var b = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Unduh PDF');
              b.addEventListener('click', function () { download('hr.payroll.payslipDownload', { payslipId: s.payslipId }, b); });
              row.appendChild(b);
            }
            if (canEmail && s.paymentStatus === 'dibayar' && s.emailMasked) {
              var e = h('button', { class: 'btn btn-ghost btn-small', type: 'button' }, s.emailedAt ? 'Kirim Ulang' : 'Kirim Email');
              e.addEventListener('click', function () { sendSlipEmail({ periodId: periodId, payslipId: s.payslipId }, e, load); });
              row.appendChild(e);
            }
            return row.childNodes.length ? row : '';
          } }
        ], d.items, 'Belum ada slip gaji.'));
        if (canEmail && d.items.some(function (s) { return !s.emailMasked; })) body.appendChild(h('p', { class: 'muted small' }, 'Karyawan tanpa email: isi Email perusahaan atau Email pribadi di menu Karyawan (atau karyawan mengisinya di Profil Saya), lalu tekan Kirim Email.'));
      });
    }
    load();
    return MklUI.card('Slip gaji', body);
  }

  /**
   * Kirim slip DRAF ke email karyawan untuk diperiksa sebelum disetujui Direktur.
   * one: satu karyawan (kirim/kirim ulang), selain itu semua yang belum menerima draf hitungan terakhir.
   */
  function draftEmailModal(p, list, one, done, selected) {
    var form = h('form', { class: 'stack', novalidate: true });
    var withEmail = list.filter(function (i) { return i.hasEmail; });
    var noEmail = list.filter(function (i) { return !i.hasEmail; });
    var reply = MklUI.field({ label: 'Batas lapor bila ada yang salah (opsional)', name: 'replyBy', type: 'date', hint: 'Ditulis di email dan di PDF draf.' });
    var slot = h('div');
    [
      h('p', null, one ? 'Draf slip ' + one.fullName + ' (PDF bertanda DRAF) dikirim ke email karyawan ini.' : (selected ? 'Draf slip (PDF bertanda DRAF) dikirim ke email ' + withEmail.length + ' karyawan yang dipilih.' : 'Draf slip (PDF bertanda DRAF) dikirim ke email ' + withEmail.length + ' karyawan yang belum menerima draf, atau yang angkanya berubah sejak draf dikirim.')),
      h('p', { class: 'muted small' }, 'Isi email tanpa angka gaji; angka hanya di lampiran PDF. Draf bukan slip resmi: angka masih bisa berubah sampai Direktur menyetujui. Karyawan yang datanya berubah dan belum dihitung ulang tidak dikirimi.'),
      !one && noEmail.length ? MklUI.alertBox('warning', noEmail.length + ' karyawan belum punya email dan tidak dikirimi: ' + noEmail.map(function (i) { return i.fullName; }).join(', ') + '. Isi email di data karyawan.') : null,
      reply.wrap, slot
    ].forEach(function (x) { if (x) form.appendChild(x); });
    var ctl = MklUI.modal({ title: 'Kirim draf slip gaji ' + p.label, content: form, actions: [{ label: 'Batal', onClick: function (c) { c.close(); } }, { label: 'Kirim', variant: 'primary', id: 'ok', onClick: submit }] });
    if (!one && !withEmail.length) { ctl.buttons.ok.disabled = true; slot.appendChild(MklUI.alertBox('info', 'Semua karyawan yang punya email sudah menerima draf hitungan terakhir. Untuk mengirim ulang, tekan Kirim Ulang pada baris karyawan.')); }
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });
    function submit(c, btn) {
      MklUI.clearFieldErrors(form); MklUI.clear(slot);
      var payload = { periodId: p.periodId };
      if (one) payload.employeeId = one.employeeId;
      else if (selected) payload.employeeIds = withEmail.map(function (i) { return i.employeeId; });
      if (reply.input.value) payload.replyBy = reply.input.value;
      MklUI.setBusy(btn, true, 'Mengirim (beberapa detik per karyawan)...');
      MklApi.call('hr.payroll.draftEmail', payload).then(function (r) {
        MklUI.setBusy(btn, false);
        if (!r.success) { if (!MklUI.showFieldErrors(form, r)) slot.appendChild(MklUI.alertBox('error', r.message)); return; }
        c.close();
        MklUI.toast(r.message, r.data && (r.data.failed.length || r.data.noEmail.length || (r.data.skippedStale && r.data.skippedStale.length)) ? 'warning' : 'success');
        done();
      });
    }
  }

  /** Menu saat nama karyawan diklik: Rincian gaji, Profil Gaji, Data Karyawan. */
  function nameMenu(p, i, load) {
    var go = function (hash) { return function (c) { c.close(); location.hash = hash; }; };
    var acts = [{ label: 'Rincian Gaji', variant: 'primary', onClick: function (c) { c.close(); detailModal(p.periodId, i, load); } }];
    if (MklState.can('payroll.prepare')) acts.push({ label: 'Profil Gaji', onClick: go('#/profil-gaji/' + encodeURIComponent(i.employeeId)) });
    if (MklState.canAny(['employee.manage', 'employee.read.all'])) acts.push({ label: 'Data Karyawan', onClick: go('#/karyawan/' + encodeURIComponent(i.employeeId)) });
    MklUI.modal({ title: i.fullName, content: h('p', { class: 'muted' }, i.employeeId + (i.positionName ? ' · ' + i.positionName : '') + '. Buka:'), actions: acts });
  }

  var FILTERS = [
    ['semua', 'Semua karyawan'], ['berubah', 'Perlu dihitung ulang'], ['peringatan', 'Ada peringatan'], ['draf_belum', 'Draf belum dikirim'],
    ['harian', 'Harian'], ['bulanan', 'Bulanan'], ['lembur', 'Ada lembur'], ['komisi', 'Ada komisi'], ['potongan', 'Ada potongan'], ['rekening', 'Belum ada rekening']
  ];
  function matchFilter(i, f) {
    switch (f) {
      case 'berubah': return i.stale;
      case 'peringatan': return i.warnings.length > 0;
      case 'draf_belum': return !i.draftEmailedAt;
      case 'harian': return i.payType === 'harian';
      case 'bulanan': return i.payType === 'bulanan';
      case 'lembur': return i.overtime > 0;
      case 'komisi': return i.commission !== 0;
      case 'potongan': return i.deductions > 0;
      case 'rekening': return !i.hasBank;
      default: return true;
    }
  }

  /** Tabel per karyawan dengan cari nama, filter, dan pilih karyawan (hitung ulang / kirim draf untuk yang dipilih). */
  function employeeCard(d, p, f, showDraft, load) {
    var state = { q: '', filter: 'semua', sel: {} };
    try { var saved = JSON.parse(window.sessionStorage.getItem('mkl_pay_filter') || '{}'); if (saved.periodId === p.periodId) { state.q = saved.q || ''; state.filter = saved.filter || 'semua'; } } catch (e) { /* abaikan */ }
    var search = h('input', { class: 'input', type: 'search', placeholder: 'Cari nama, ID, atau jabatan', 'aria-label': 'Cari karyawan', value: state.q });
    var filter = h('select', { class: 'input', 'aria-label': 'Filter karyawan' });
    FILTERS.forEach(function (x) { filter.appendChild(h('option', { value: x[0] }, x[1])); });
    filter.value = state.filter;
    var allBox = h('input', { type: 'checkbox', 'aria-label': 'Pilih semua yang tampil' });
    var count = h('span', { class: 'muted small' });
    var bar = h('div', { class: 'btn-row bulk-bar' });
    var tableArea = h('div');
    var canSel = f.canCalculate || f.canDraftEmail;
    var bRecalc = f.canCalculate ? h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Hitung Ulang Terpilih') : null;
    var bDraft = f.canDraftEmail ? h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Kirim Draf ke Terpilih') : null;
    var visible = [];
    function selected() { return d.items.filter(function (i) { return state.sel[i.employeeId]; }); }
    function refreshBar() {
      var n = selected().length;
      count.textContent = n ? n + ' dipilih' : '';
      if (bRecalc) { bRecalc.disabled = !n; bRecalc.textContent = 'Hitung Ulang Terpilih' + (n ? ' (' + n + ')' : ''); }
      if (bDraft) { bDraft.disabled = !n; bDraft.textContent = 'Kirim Draf ke Terpilih' + (n ? ' (' + n + ')' : ''); }
      allBox.checked = visible.length > 0 && visible.every(function (i) { return state.sel[i.employeeId]; });
    }
    if (bRecalc) bRecalc.addEventListener('click', function () {
      var ids = selected().map(function (i) { return i.employeeId; });
      MklUI.setBusy(bRecalc, true, 'Menghitung...');
      MklApi.call('hr.payroll.calculate', { periodId: p.periodId, employeeIds: ids }).then(function (r) {
        MklUI.setBusy(bRecalc, false);
        if (!r.success) { MklUI.toast(r.message, 'error'); return; }
        MklUI.toast(r.message, 'success');
        load();
      });
    });
    if (bDraft) bDraft.addEventListener('click', function () { draftEmailModal(p, selected(), null, load, true); });
    allBox.addEventListener('change', function () {
      visible.forEach(function (i) { if (allBox.checked) state.sel[i.employeeId] = true; else delete state.sel[i.employeeId]; });
      paint();
    });
    function remember() { try { window.sessionStorage.setItem('mkl_pay_filter', JSON.stringify({ periodId: p.periodId, q: state.q, filter: state.filter })); } catch (e) { /* abaikan */ } }
    search.addEventListener('input', function () { state.q = search.value; remember(); paint(); });
    filter.addEventListener('change', function () { state.filter = filter.value; remember(); paint(); });
    function paint() {
      var q = state.q.trim().toLowerCase();
      visible = d.items.filter(function (i) {
        if (!matchFilter(i, state.filter)) return false;
        return !q || [i.fullName, i.nickname, i.employeeId, i.positionName].join(' ').toLowerCase().indexOf(q) !== -1;
      });
      MklUI.clear(tableArea).appendChild(h('div', { class: 'recap-table money-table' }, MklUI.table([
        canSel ? { label: 'Pilih', className: 'col-check', render: function (i) {
          var bx = h('input', { type: 'checkbox', 'aria-label': 'Pilih ' + i.fullName, checked: !!state.sel[i.employeeId] });
          bx.addEventListener('change', function () { if (bx.checked) state.sel[i.employeeId] = true; else delete state.sel[i.employeeId]; refreshBar(); });
          return bx;
        } } : null,
        { label: 'Nama', render: function (i) {
          var nameBtn = h('button', { class: 'link-button', type: 'button', title: 'Buka Rincian, Profil Gaji, atau Data Karyawan' }, i.fullName);
          nameBtn.addEventListener('click', function () { nameMenu(p, i, load); });
          return h('span', null, h('strong', null, nameBtn), h('br'), h('span', { class: 'muted small' }, i.payTypeLabel + (i.positionName ? ' · ' + i.positionName : '')),
            i.stale ? h('span', null, h('br'), MklUI.badge('Perlu dihitung ulang: ' + i.staleReason, 'warning')) : null,
            i.warnings.length ? h('span', null, h('br'), MklUI.badge(i.warnings.length + ' peringatan', 'warning')) : null,
            !i.hasBank && i.net > 0 ? h('span', null, h('br'), MklUI.badge('Belum ada rekening', 'muted')) : null);
        } },
        { label: 'Hadir', render: function (i) { return i.daysPresent + ' hari'; } },
        { label: 'Jam dibayar', render: function (i) { return i.payType === 'harian' ? hours(i.paidMinutes) : '-'; } },
        { label: 'Upah / gaji', render: function (i) { return MklUI.fmtMoney(i.base); } },
        { label: 'Lembur', render: function (i) { return i.overtime ? h('span', null, MklUI.fmtMoney(i.overtime), h('br'), h('span', { class: 'muted small' }, hours(i.overtimeMinutes))) : '-'; } },
        { label: 'Tambahan', render: function (i) { return i.additions ? MklUI.fmtMoney(i.additions) : '-'; } },
        { label: 'Potongan', render: function (i) { return i.deductions ? '− ' + MklUI.fmtMoney(i.deductions) : '-'; } },
        { label: 'Bersih', render: function (i) { return h('strong', null, MklUI.fmtMoney(i.net)); } },
        showDraft ? { label: 'Draf slip', render: function (i) {
          var st = i.draftEmailedAt ? h('span', { class: 'small' }, MklUI.badge('Terkirim', 'success'), ' ' + MklUI.fmtDateTime(i.draftEmailedAt))
            : (i.draftChangedAt ? h('span', { class: 'small' }, MklUI.badge('Angka berubah', 'warning'), ' draf ' + MklUI.fmtDateTime(i.draftChangedAt) + ' perlu dikirim lagi')
              : (i.hasEmail ? h('span', { class: 'muted small' }, 'Belum dikirim') : MklUI.badge('Belum ada email', 'muted')));
          if (!f.canDraftEmail || !i.hasEmail || i.stale) return st;
          var b = h('button', { class: 'btn btn-ghost btn-small', type: 'button' }, i.draftEmailedAt ? 'Kirim Ulang' : 'Kirim');
          b.addEventListener('click', function () { draftEmailModal(p, [i], i, load); });
          return h('span', null, st, h('br'), b);
        } } : null,
        { label: 'Aksi', className: 'col-action', render: function (i) {
          var b = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Rincian');
          b.addEventListener('click', function () { detailModal(p.periodId, i, load); });
          return b;
        } }
      ].filter(Boolean), visible, d.items.length ? 'Tidak ada karyawan yang cocok dengan pencarian atau filter.' : 'Tidak ada karyawan yang dihitung.')));
      refreshBar();
    }
    var tools = h('div', { class: 'filter-bar' }, search, filter);
    if (canSel) {
      bar.appendChild(h('label', { class: 'checkbox-inline' }, allBox, ' Pilih semua yang tampil'));
      if (bRecalc) bar.appendChild(bRecalc);
      if (bDraft) bar.appendChild(bDraft);
      bar.appendChild(count);
    }
    paint();
    return MklUI.card('Per karyawan', [tools, canSel ? bar : null, tableArea,
      h('p', { class: 'muted small' }, 'Klik nama karyawan untuk membuka Rincian Gaji, Profil Gaji, atau Data Karyawan. BPJS dan PPh 21 ditanggung perusahaan (tidak dipotong dari gaji). Lembur dihitung dari jam absen dan dibayar 1× tarif per jam, sesuai file gaji lama (keputusan pemilik) [Perlu konfirmasi HR/penasihat hukum: PP 35/2021].')]);
  }

  MklNav.register('/penggajian/:id', {
    title: 'Periode Gaji',
    perm: VIEW,
    render: function (root, params) {
      var area = h('div');
      root.appendChild(area);
      function load() {
        MklUI.clear(area).appendChild(MklUI.loadingState('Memuat...'));
        MklApi.call('hr.payroll.period', { periodId: params.id }).then(function (res) {
          MklUI.clear(area);
          if (!res.success) { area.appendChild(MklUI.errorState(res, load)); return; }
          render(res.data);
        });
      }

      function render(d) {
        var p = d.period, f = d.flags;
        var actions = h('div', { class: 'btn-row' });
        function button(label, variant, onClick) {
          var b = h('button', { class: 'btn btn-' + variant, type: 'button' }, label);
          b.addEventListener('click', function () { onClick(b); });
          actions.appendChild(b);
          return b;
        }
        function calc(b, ids) {
          MklUI.setBusy(b, true, 'Menghitung...');
          MklApi.call('hr.payroll.calculate', ids ? { periodId: p.periodId, employeeIds: ids } : { periodId: p.periodId }).then(function (r) {
            MklUI.setBusy(b, false);
            if (!r.success) { MklUI.toast(r.message, 'error'); return; }
            MklUI.toast(r.message, 'success');
            load();
          });
        }
        var staleIds = d.staleIds || [];
        if (f.canCalculate && p.calcVersion && staleIds.length && !d.staleAll) {
          button('Hitung Ulang yang Berubah (' + staleIds.length + ')', 'primary', function (b) { calc(b, staleIds); });
          button('Hitung Ulang Semua', 'secondary', function (b) { calc(b); });
        } else if (f.canCalculate) {
          button(p.calcVersion ? 'Hitung Ulang Semua' : 'Hitung Gaji', p.calcVersion && p.status !== 'draf' && !d.stale ? 'secondary' : 'primary', function (b) { calc(b); });
        }
        if (f.canSubmit) {
          button('Ajukan ke Direktur', d.stale ? 'secondary' : 'primary', function () {
            MklUI.confirmAction({
              title: 'Ajukan gaji ' + p.label,
              message: h('div', null, h('p', null, d.items.length + ' karyawan, total bersih ' + MklUI.fmtMoney(d.totals.net) + '. Setelah diajukan, angka tidak bisa diubah kecuali Direktur menolak.'),
                d.submitEmails && d.submitEmails.length ? h('p', { class: 'muted small' }, 'Email pemberitahuan (tanpa rincian per karyawan) otomatis dikirim ke ' + d.submitEmails.join(', ') + '.') : null),
              confirmLabel: 'Ajukan',
              onConfirm: function () {
                return MklApi.call('hr.payroll.submit', { periodId: p.periodId }).then(function (r) { if (r.success) { MklUI.toast(r.message, r.data && r.data.emailTo && r.data.emailTo.length && !r.data.emailSent ? 'warning' : 'success'); load(); } return r; });
              }
            });
          });
        }
        if (f.canDecide) {
          button('Setujui', 'primary', function () { decideModal(p, 'setuju', load); });
          button('Tolak', 'danger', function () { decideModal(p, 'tolak', load); });
        }
        if (f.canDraftEmail) {
          var notYet = d.items.filter(function (i) { return !i.draftEmailedAt && !i.stale; });
          button('Kirim Draf Slip ke Karyawan', 'secondary', function () { draftEmailModal(p, notYet, null, load); });
        }
        if (p.calcVersion) button('Unduh Ringkasan (PDF)', 'secondary', function (b) { download('hr.payroll.summaryDownload', { periodId: p.periodId }, b); });
        if (f.canTransfer) button('Unduh Daftar Transfer', 'secondary', function (b) { download('hr.payroll.transferList', { periodId: p.periodId }, b); });
        if (f.canMarkPaid) button('Tandai Sudah Dibayar', 'primary', function () { markPaidModal(p, load); });
        if (f.canDelete) {
          button('Hapus Periode', 'ghost', function () {
            MklUI.confirmAction({
              title: 'Hapus periode gaji ' + p.label,
              message: h('div', null,
                h('p', null, 'Periode ' + T.rangeLabel(p.startDate, p.endDate) + ' beserta hasil hitungannya akan dihapus, termasuk tambahan/potongan yang dicatat untuk periode ini (jika ada).'),
                h('p', null, 'Absensi, profil gaji, dan kasbon tidak berubah. Periode ini bisa dibuat lagi lewat Buat Periode.')),
              confirmLabel: 'Hapus Periode', danger: true, reasonLabel: 'Alasan', reasonRequired: true,
              onConfirm: function (reason) {
                return MklApi.call('hr.payroll.deletePeriod', { periodId: p.periodId, reason: reason }).then(function (r) {
                  if (r.success) { MklUI.toast(r.message, 'success'); location.hash = '#/penggajian'; }
                  return r;
                });
              }
            });
          });
        }

        area.appendChild(h('p', null, h('a', { href: '#/penggajian' }, '← Semua periode')));
        area.appendChild(MklUI.pageHeader('Gaji ' + p.label, T.rangeLabel(p.startDate, p.endDate)));
        var info = [['Status', statusBadge(p)]];
        if (p.calculatedAt) info.push(['Dihitung', MklUI.fmtDateTime(p.calculatedAt) + (p.preparedBy ? ' oleh ' + p.preparedBy : '') + ' (versi ' + p.calcVersion + ')']);
        if (p.submittedAt && ['diajukan', 'disetujui', 'dibayar'].indexOf(p.status) !== -1) info.push(['Diajukan', MklUI.fmtDateTime(p.submittedAt)]);
        if (p.approvedAt) info.push(['Disetujui', MklUI.fmtDateTime(p.approvedAt) + (p.approvedBy ? ' oleh ' + p.approvedBy : '')]);
        if (p.paidAt) info.push(['Dibayar', MklUI.fmtDate(p.paidAt)]);
        if (p.payDate && !p.paidAt) info.push(['Rencana bayar', MklUI.fmtDate(p.payDate)]);
        if (p.decisionNote) info.push([p.status === 'draf' ? 'Catatan penolakan' : 'Catatan Direktur', p.decisionNote]);
        area.appendChild(MklUI.card(null, [MklUI.infoList(info), actions.childNodes.length ? actions : null,
          f.decideBlockedReason ? MklUI.alertBox('info', f.decideBlockedReason) : null]));

        if (p.status === 'draf' && p.decisionNote) area.appendChild(MklUI.alertBox('warning', 'Ditolak Direktur: ' + p.decisionNote + ' Perbaiki, lalu Hitung Ulang dan ajukan lagi.'));
        if (d.staleAll) area.appendChild(MklUI.alertBox('warning', 'Ada impor absensi yang dihapus setelah gaji dihitung. Tekan Hitung Ulang Semua sebelum mengajukan atau mengirim draf slip.'));
        else if (d.stale) {
          var nm = d.items.filter(function (i) { return i.stale; }).map(function (i) { return i.fullName; }).concat((d.notCalculated || []).map(function (x) { return x.fullName + ' (belum dihitung)'; }));
          area.appendChild(MklUI.alertBox('warning', staleIds.length + ' karyawan perlu dihitung ulang karena datanya berubah: ' + nm.join(', ') + '. Tekan Hitung Ulang yang Berubah; karyawan lain tidak ikut dihitung ulang.'));
        }
        else if (p.status === 'draf' && p.calcVersion) area.appendChild(MklUI.alertBox('info', 'Ada tambahan/potongan yang belum masuk ke total. Tekan Hitung Ulang.'));
        var missing = d.missingProfiles || [];
        if (missing.length) {
          var go = MklState.can('payroll.prepare') ? h('a', { class: 'btn btn-secondary btn-small', href: '#/profil-gaji' }, 'Buka Profil Gaji') : null;
          area.appendChild(MklUI.card('Belum punya profil gaji (' + missing.length + ' karyawan)', [
            h('p', { class: 'muted small' }, 'Karyawan berikut tidak ikut dihitung. Atur profil gajinya dengan tanggal Berlaku mulai paling lambat ' + MklUI.fmtDate(p.endDate) + ', lalu tekan Hitung Ulang.'),
            h('div', { class: 'recap-table' }, MklUI.table([
              { label: 'Employee ID', render: function (m) { return m.employeeId; } },
              { label: 'Nama', render: function (m) { return m.fullName; } },
              { label: 'Jabatan', render: function (m) { return m.positionName; } }
            ], missing, '')),
            go ? h('div', { class: 'form-actions' }, go) : null
          ], 'card-warning'));
        }
        if (d.periodWarnings.length) {
          area.appendChild(MklUI.card('Perlu dicek', h('ul', { class: 'warning-list' }, d.periodWarnings.map(function (w) { return h('li', null, w); })), 'card-warning'));
        }

        if (!p.calcVersion) {
          area.appendChild(MklUI.card(null, MklUI.emptyState(f.canCalculate
            ? 'Belum dihitung. Pastikan absensi periode ini sudah lengkap (termasuk impor Raptor) dan profil gaji sudah diatur, lalu tekan Hitung Gaji.'
            : 'Gaji periode ini belum dihitung oleh Payroll.')));
          return;
        }
        var warnCount = d.items.filter(function (i) { return i.warnings.length; }).length;
        var showDraft = f.canDraftEmail || d.items.some(function (i) { return i.draftEmailedAt; });
        area.appendChild(MklUI.card('Ringkasan', h('div', { class: 'stats stats-money' },
          stat('Karyawan', d.items.length), stat('Upah / gaji pokok', MklUI.fmtMoney(d.totals.base)), stat('Lembur', MklUI.fmtMoney(d.totals.overtime)),
          stat('Tambahan', MklUI.fmtMoney(d.totals.additions)), stat('Potongan', MklUI.fmtMoney(d.totals.deductions)),
          stat('Total bersih', MklUI.fmtMoney(d.totals.net), 'info'), stat('Perlu dicek', warnCount, warnCount ? 'warning' : null))));

        area.appendChild(employeeCard(d, p, f, showDraft, load));

        if (p.status === 'disetujui' || p.status === 'dibayar') area.appendChild(payslipCard(p.periodId));
      }
      load();
    }
  });
})();
