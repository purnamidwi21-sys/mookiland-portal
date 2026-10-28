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

  function adjustModal(periodId, item, done) {
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
        MklUI.toast(res.message, 'success');
        done();
      });
    }
  }

  function detailModal(periodId, item, onChanged) {
    var body = h('div', { class: 'stack' }, MklUI.loadingState('Memuat...'));
        var ctl = MklUI.modal({ title: 'Rincian gaji: ' + item.fullName, content: body, wide: true, actions: [{ label: 'Tutup', onClick: function (c) { c.close(); } }] });
    ctl.dialog.classList.add('modal-payroll');
    function load() {
      MklApi.call('hr.payroll.detail', { periodId: periodId, employeeId: item.employeeId }).then(function (res) {
        MklUI.clear(body);
        if (!res.success) { body.appendChild(MklUI.alertBox('error', res.message)); return; }
        var d = res.data, p = d.profile || {};
        body.appendChild(MklUI.infoList([
          ['Periode', d.period.label + ' (' + T.rangeLabel(d.period.startDate, d.period.endDate) + ')'],
          ['Profil gaji', p.payType ? p.payTypeLabel + ', ' + (p.payType === 'harian' ? MklUI.fmtMoney(p.dailyRate) + '/hari' : MklUI.fmtMoney(p.monthlySalary) + '/bulan') + ', maks ' + p.paidHoursCap + ' jam' + (p.clockinRounding ? ', jam masuk dibulatkan' : '') + (p.overtimeEligible ? ', dapat lembur' : ', tanpa lembur') : '-'],
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
                  if (r.success) { MklUI.toast(r.message, 'success'); onChanged(); load(); }
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
        if (lineRows.some(function (l) { return l.state; })) body.appendChild(MklUI.alertBox('info', 'Total di atas belum termasuk perubahan bertanda kuning. Tutup jendela ini lalu tekan Hitung Ulang.'));
        if (d.canAdjust) {
          var add = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Tambah / Potong Manual');
          add.addEventListener('click', function () { adjustModal(periodId, item, function () { onChanged(); load(); }); });
          body.appendChild(h('div', { class: 'btn-row' }, add));
        }
        body.appendChild(h('h3', null, 'Rincian per hari'));
        body.appendChild(h('div', { class: 'recap-table' }, MklUI.table([
          { label: 'Tanggal', render: function (x) { return T.dayLabel(x.date); } },
          { label: 'Masuk', render: function (x) { return x.adjustedIn && x.adjustedIn !== x.clockIn ? h('span', null, x.clockIn, h('br'), h('span', { class: 'muted small' }, 'dihitung ' + x.adjustedIn)) : x.clockIn; } },
          { label: 'Pulang', render: function (x) { return x.clockOut || '–'; } },
          { label: 'Istirahat', render: function (x) { return x.breakMinutes ? x.breakMinutes + ' m' : '-'; } },
          { label: 'Lama hadir', render: function (x) { return x.spanMinutes ? T.fmtMinutes(x.spanMinutes) : '-'; } },
          { label: 'Dibayar', render: function (x) { return x.pay ? h('span', null, T.fmtMinutes(x.paidMinutes), h('br'), h('span', { class: 'muted small' }, MklUI.fmtMoney(x.pay))) : '-'; } },
          { label: 'Lembur', render: function (x) { return x.overtimeMinutes ? h('span', null, T.fmtMinutes(x.overtimeMinutes), h('br'), h('span', { class: 'muted small' }, MklUI.fmtMoney(x.overtimePay))) : '-'; } },
          { label: 'Jam kurang', render: function (x) { return x.shortMinutes ? h('span', null, T.fmtMinutes(x.shortMinutes), h('br'), h('span', { class: 'muted small' }, '− ' + MklUI.fmtMoney(x.shortDeduction))) : '-'; } },
          { label: 'Catatan', render: function (x) { return x.note ? h('span', { class: 'small' }, x.note) : ''; } }
        ], d.days, 'Tidak ada absensi pada periode ini.')));
      });
    }
    load();
    return ctl;
  }

  // ================================================================== halaman periode

  function markPaidModal(period, done) {
    var form = h('form', { class: 'stack', novalidate: true });
    var date = MklUI.field({ label: 'Tanggal dibayar', name: 'paidDate', type: 'date', required: true, value: MklUI.todayYmd(), hint: 'Tandai setelah transfer benar-benar dilakukan. Karyawan lalu bisa melihat slip gajinya.' });
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
      MklUI.setBusy(btn, true, 'Menyimpan...');
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

  function payslipCard(periodId) {
    var body = h('div', null, MklUI.loadingState('Memuat...'));
    var canDownload = MklState.canAny(['payroll.prepare', 'payslip.read.all']);
    MklApi.call('hr.payroll.payslips', { periodId: periodId }).then(function (res) {
      MklUI.clear(body);
      if (!res.success) { body.appendChild(MklUI.alertBox('error', res.message)); return; }
      body.appendChild(MklUI.table([
        { label: 'Nomor slip', render: function (s) { return s.payslipNo; } },
        { label: 'Nama', render: function (s) { return s.fullName; } },
        { label: 'Pembayaran', render: function (s) { return s.paymentStatus === 'dibayar' ? MklUI.badge('Dibayar ' + MklUI.fmtDate(s.paidAt), 'success') : MklUI.badge('Belum dibayar', 'muted'); } },
        { label: 'Dibuka karyawan', render: function (s) { return s.viewed ? 'Sudah' : 'Belum'; } },
        { label: 'Aksi', className: 'col-action', render: function (s) {
          if (!canDownload) return '';
          var b = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Unduh PDF');
          b.addEventListener('click', function () { download('hr.payroll.payslipDownload', { payslipId: s.payslipId }, b); });
          return b;
        } }
      ], res.data.items, 'Belum ada slip gaji.'));
    });
    return MklUI.card('Slip gaji', body);
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
        if (f.canCalculate) {
          button(p.calcVersion ? 'Hitung Ulang' : 'Hitung Gaji', p.calcVersion && p.status !== 'draf' && !d.stale ? 'secondary' : 'primary', function (b) {
            MklUI.setBusy(b, true, 'Menghitung...');
            MklApi.call('hr.payroll.calculate', { periodId: p.periodId }).then(function (r) {
              MklUI.setBusy(b, false);
              if (!r.success) { MklUI.toast(r.message, 'error'); return; }
              MklUI.toast(r.message, 'success');
              load();
            });
          });
        }
        if (f.canSubmit) {
          button('Ajukan ke Direktur', d.stale ? 'secondary' : 'primary', function () {
            MklUI.confirmAction({
              title: 'Ajukan gaji ' + p.label,
              message: h('p', null, d.items.length + ' karyawan, total bersih ' + MklUI.fmtMoney(d.totals.net) + '. Setelah diajukan, angka tidak bisa diubah kecuali Direktur menolak.'),
              confirmLabel: 'Ajukan',
              onConfirm: function () {
                return MklApi.call('hr.payroll.submit', { periodId: p.periodId }).then(function (r) { if (r.success) { MklUI.toast(r.message, 'success'); load(); } return r; });
              }
            });
          });
        }
        if (f.canDecide) {
          button('Setujui', 'primary', function () { decideModal(p, 'setuju', load); });
          button('Tolak', 'danger', function () { decideModal(p, 'tolak', load); });
        }
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
        if (d.stale) area.appendChild(MklUI.alertBox('warning', 'Ada perubahan absensi, profil gaji, atau tambahan/potongan setelah gaji dihitung. Tekan Hitung Ulang sebelum mengajukan.'));
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
        area.appendChild(MklUI.card('Ringkasan', h('div', { class: 'stats stats-money' },
          stat('Karyawan', d.items.length), stat('Upah / gaji pokok', MklUI.fmtMoney(d.totals.base)), stat('Lembur', MklUI.fmtMoney(d.totals.overtime)),
          stat('Tambahan', MklUI.fmtMoney(d.totals.additions)), stat('Potongan', MklUI.fmtMoney(d.totals.deductions)),
          stat('Total bersih', MklUI.fmtMoney(d.totals.net), 'info'), stat('Perlu dicek', warnCount, warnCount ? 'warning' : null))));

        area.appendChild(MklUI.card('Per karyawan', [
          h('div', { class: 'recap-table money-table' }, MklUI.table([
            { label: 'Nama', render: function (i) {
              return h('span', null, h('strong', null, i.fullName), h('br'), h('span', { class: 'muted small' }, i.payTypeLabel + (i.positionName ? ' · ' + i.positionName : '')),
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
            { label: 'Aksi', className: 'col-action', render: function (i) {
              var b = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Rincian');
              b.addEventListener('click', function () { detailModal(p.periodId, i, load); });
              return b;
            } }
          ], d.items, 'Tidak ada karyawan yang dihitung.')),
          h('p', { class: 'muted small' }, 'BPJS dan PPh 21 ditanggung perusahaan (tidak dipotong dari gaji). Lembur dihitung dari jam absen dan dibayar 1× tarif per jam, sesuai file gaji lama (keputusan pemilik) [Perlu konfirmasi HR/penasihat hukum: PP 35/2021].')
        ]));

        if (p.status === 'disetujui' || p.status === 'dibayar') area.appendChild(payslipCard(p.periodId));
      }
      load();
    }
  });
})();
