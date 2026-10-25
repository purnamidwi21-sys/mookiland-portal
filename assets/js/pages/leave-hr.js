/*
 * Saldo Cuti (HR): siapa yang berhak cuti tahunan, saldo per tahun,
 * penyesuaian saldo, dan riwayat transaksi.
 */
(function () {
  'use strict';
  var h = MklUI.h;
  var T = window.MklTimeUI;

  function signed(n) { return n > 0 ? '+' + n : String(n); }

  function manageModal(item, year, done) {
    var form = h('form', { class: 'stack', novalidate: true });
    var elig = MklUI.checkboxField({ label: 'Berhak cuti tahunan', name: 'eligible', checked: item.eligible, hint: 'Centang untuk karyawan bulanan. Pekerja harian tidak dicentang.' });
    var reasonE = MklUI.field({ label: 'Alasan perubahan hak', name: 'reason', multiline: true, rows: 2, maxLength: 300 });
    var alertE = h('div');
    var saveE = h('button', { class: 'btn btn-secondary', type: 'button' }, 'Simpan Hak Cuti');
    var secE = h('fieldset', { class: 'form-section' }, h('legend', null, 'Hak cuti tahunan'), elig.wrap, reasonE.wrap, alertE, h('div', { class: 'form-actions' }, saveE));
    form.appendChild(secE);

    var days = MklUI.field({ label: 'Jumlah hari', name: 'days', type: 'number', inputmode: 'numeric', hint: 'Positif menambah (misalnya sisa cuti sebelum memakai sistem), negatif mengurangi.' });
    var reasonA = MklUI.field({ label: 'Alasan penyesuaian', name: 'reasonAdjust', multiline: true, rows: 2, maxLength: 300 });
    var alertA = h('div');
    var saveA = h('button', { class: 'btn btn-secondary', type: 'button' }, 'Simpan Penyesuaian');
    var secA = h('fieldset', { class: 'form-section' }, h('legend', null, 'Penyesuaian saldo ' + year),
      item.balance ? h('p', { class: 'muted small' }, 'Saldo sekarang: ' + item.balance.closing + ' hari.') : null,
      days.wrap, reasonA.wrap, alertA, h('div', { class: 'form-actions' }, saveA));
    secA.hidden = !item.eligible;
    form.appendChild(secA);

    var ctl = MklUI.modal({ title: 'Atur cuti: ' + item.fullName, content: form, actions: [{ label: 'Tutup', onClick: function (c) { c.close(); } }] });
    function finish(c) { c.close(); done(); }

    saveE.addEventListener('click', function () {
      MklUI.clear(alertE);
      MklUI.clearFieldErrors(secE);
      MklUI.setBusy(saveE, true, 'Menyimpan...');
      MklApi.call('hr.leave.setEligible', { employeeId: item.employeeId, eligible: elig.input.checked, reason: reasonE.input.value.trim() }).then(function (res) {
        MklUI.setBusy(saveE, false);
        if (!res.success) { if (!MklUI.showFieldErrors(secE, res)) alertE.appendChild(MklUI.alertBox('error', res.message)); return; }
        MklUI.toast(res.message, 'success');
        finish(ctl);
      });
    });
    saveA.addEventListener('click', function () {
      MklUI.clear(alertA);
      MklUI.clearFieldErrors(secA);
      MklUI.setBusy(saveA, true, 'Menyimpan...');
      MklApi.call('hr.leave.adjust', { employeeId: item.employeeId, year: year, days: Number(days.input.value || 0), reason: reasonA.input.value.trim() }).then(function (res) {
        MklUI.setBusy(saveA, false);
        if (!res.success) {
          if (res.details && res.details.fields && res.details.fields.reason) { res.details.fields.reasonAdjust = res.details.fields.reason; delete res.details.fields.reason; }
          if (!MklUI.showFieldErrors(secA, res)) alertA.appendChild(MklUI.alertBox('error', res.message));
          return;
        }
        MklUI.toast(res.message, 'success');
        finish(ctl);
      });
    });
  }

  function historyModal(item) {
    var body = h('div', null, MklUI.loadingState('Memuat riwayat...'));
    MklUI.modal({ title: 'Riwayat cuti: ' + item.fullName, content: body, wide: true, actions: [{ label: 'Tutup', onClick: function (c) { c.close(); } }] });
    MklApi.call('hr.leave.history', { employeeId: item.employeeId }).then(function (res) {
      MklUI.clear(body);
      if (!res.success) { body.appendChild(MklUI.alertBox('error', res.message)); return; }
      body.appendChild(h('h3', null, 'Transaksi saldo cuti tahunan'));
      body.appendChild(MklUI.table([
        { label: 'Tanggal', render: function (t) { return MklUI.fmtDateTime(t.date); } },
        { label: 'Tahun', render: function (t) { return String(t.year); } },
        { label: 'Jenis', render: function (t) { return t.typeLabel; } },
        { label: 'Hari', render: function (t) { return signed(t.days); } },
        { label: 'Keterangan', render: function (t) { return t.reason; } },
        { label: 'Oleh', render: function (t) { return t.by; } }
      ], res.data.transactions, 'Belum ada transaksi.'));
      body.appendChild(h('h3', null, 'Pengajuan cuti, izin, dan sakit'));
      body.appendChild(MklUI.table([
        { label: 'Jenis', render: function (r) { return r.leaveType; } },
        { label: 'Tanggal', render: function (r) { return r.startDate === r.endDate ? MklUI.fmtDate(r.startDate) : MklUI.fmtDate(r.startDate) + ' – ' + MklUI.fmtDate(r.endDate); } },
        { label: 'Hari', render: function (r) { return String(r.totalDays); } },
        { label: 'Status', render: function (r) { return MklRequests.statusBadge(r.status, r.statusLabel); } },
        { label: 'Alasan', render: function (r) { return r.reason; } }
      ], res.data.requests, 'Belum ada pengajuan.'));
    });
  }

  MklNav.register('/cuti', {
    title: 'Saldo Cuti',
    perm: 'leave.manage',
    menu: { label: 'Saldo Cuti', order: 11.5, section: 'Jadwal & Absensi' },
    render: function (root) {
      root.appendChild(MklUI.pageHeader('Saldo Cuti', 'Hak dan saldo cuti tahunan karyawan.'));
      var year = null;
      var prev = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, '← Tahun lalu');
      var next = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Tahun berikutnya →');
      var label = h('strong', { class: 'week-label' });
      root.appendChild(h('div', { class: 'week-nav' }, prev, label, next));
      var area = h('div');
      root.appendChild(area);
      prev.addEventListener('click', function () { year -= 1; load(); });
      next.addEventListener('click', function () { year += 1; load(); });

      function load() {
        MklUI.clear(area).appendChild(MklUI.loadingState('Memuat saldo...'));
        MklApi.call('hr.leave.balances', year ? { year: year } : {}).then(function (res) {
          MklUI.clear(area);
          if (!res.success) { area.appendChild(MklUI.errorState(res, load)); return; }
          var d = res.data;
          year = d.year;
          label.textContent = 'Tahun ' + d.year;
          next.disabled = d.year >= d.currentYear;
          var eligibleCount = d.items.filter(function (i) { return i.eligible; }).length;
          area.appendChild(MklUI.card(null, [
            h('div', { class: 'recap-table' }, MklUI.table([
              { label: 'Nama', render: function (i) { return h('span', null, h('strong', null, i.fullName), h('br'), h('span', { class: 'muted small' }, i.employeeId + (i.positionName ? ' · ' + i.positionName : ''))); } },
              { label: 'Berhak cuti', render: function (i) { return i.eligible ? MklUI.badge('Ya', 'success') : MklUI.badge('Tidak', 'muted'); } },
              { label: 'Sisa tahun lalu', render: function (i) { return i.balance ? String(i.balance.opening) : ''; } },
              { label: 'Jatah ' + d.year, render: function (i) { return i.balance ? String(i.balance.accrued) : ''; } },
              { label: 'Terpakai', render: function (i) { return i.balance ? String(i.balance.used) : ''; } },
              { label: 'Penyesuaian', render: function (i) { return i.balance && i.balance.adjusted ? signed(i.balance.adjusted) : (i.balance ? '0' : ''); } },
              { label: 'Menunggu', render: function (i) { return i.balance && i.balance.pending ? String(i.balance.pending) : (i.balance ? '0' : ''); } },
              { label: 'Sisa', render: function (i) { return i.balance ? h('strong', null, String(i.balance.closing)) : ''; } },
              { label: 'Aksi', className: 'col-action', render: function (i) {
                var a = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Atur');
                a.addEventListener('click', function () { manageModal(i, d.year, load); });
                var r = h('button', { class: 'btn btn-ghost btn-small', type: 'button' }, 'Riwayat');
                r.addEventListener('click', function () { historyModal(i); });
                return h('div', { class: 'btn-row' }, a, r);
              } }
            ], d.items, 'Tidak ada karyawan aktif.')),
            h('p', { class: 'muted small' }, eligibleCount + ' karyawan berhak cuti tahunan. Jatah ' + d.annualDays + ' hari dicatat otomatis setiap 1 Januari; karyawan yang masuk di tahun berjalan mendapat jatah sebanding bulan penuh yang tersisa. Sisa cuti dibawa seluruhnya ke tahun berikutnya. [Perlu konfirmasi HR]')
          ]));
        });
      }
      load();
    }
  });
})();
