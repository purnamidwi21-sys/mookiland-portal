/*
 * Kasbon: daftar kasbon karyawan untuk Payroll (Manajer Operasional) dan Direktur.
 * Payroll menandai uang sudah diserahkan, mencatat pelunasan tunai, atau
 * membatalkan kasbon yang belum diserahkan. Persetujuan ada di menu Persetujuan.
 */
(function () {
  'use strict';
  var h = MklUI.h;
  var VARIANT = { disetujui: 'warning', aktif: 'info', lunas: 'success', ditolak: 'danger', dibatalkan: 'muted' };

  function dateModal(title, fields, action, payload, done) {
    var form = h('form', { class: 'stack', novalidate: true });
    var alertSlot = h('div');
    fields.forEach(function (f) { form.appendChild(f.wrap || f); });
    form.appendChild(alertSlot);
    var ctl = MklUI.modal({ title: title, content: form, actions: [
      { label: 'Batal', onClick: function (c) { c.close(); } },
      { label: 'Simpan', variant: 'primary', id: 'ok', onClick: submit }
    ] });
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });
    function submit(c, btn) {
      MklUI.clearFieldErrors(form);
      MklUI.clear(alertSlot);
      MklUI.setBusy(btn, true, 'Menyimpan...');
      MklApi.call(action, payload()).then(function (res) {
        MklUI.setBusy(btn, false);
        if (!res.success) { if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message)); return; }
        c.close();
        MklUI.toast(res.message, 'success');
        done();
      });
    }
  }

  function historyModal(l) {
    var body = h('div', null, MklUI.loadingState('Memuat...'));
    MklUI.modal({ title: 'Riwayat kasbon ' + l.fullName, content: body, wide: true, actions: [{ label: 'Tutup', onClick: function (c) { c.close(); } }] });
    MklApi.call('hr.loans.history', { loanId: l.loanId }).then(function (res) {
      MklUI.clear(body);
      if (!res.success) { body.appendChild(MklUI.alertBox('error', res.message)); return; }
      body.appendChild(MklUI.table([
        { label: 'Tanggal', render: function (t) { return MklUI.fmtDate(t.date); } },
        { label: 'Kejadian', render: function (t) { return t.typeLabel; } },
        { label: 'Jumlah', render: function (t) { return MklUI.fmtMoney(t.amount); } },
        { label: 'Sisa sesudahnya', render: function (t) { return MklUI.fmtMoney(t.balanceAfter); } },
        { label: 'Keterangan', render: function (t) { return t.note; } }
      ], res.data.items, 'Belum ada transaksi.'));
    });
  }

  MklNav.register('/kasbon', {
    title: 'Kasbon',
    perm: ['loan.manage', 'loan.approve'],
    menu: { label: 'Kasbon', order: 18.5, section: 'Penggajian' },
    render: function (root) {
      root.appendChild(MklUI.pageHeader('Kasbon', 'Kasbon karyawan yang sudah disetujui Direktur. Pengajuan baru diputuskan di menu Persetujuan.'));
      var view = 'berjalan';
      var tabA = h('button', { class: 'tab', type: 'button', role: 'tab', 'aria-selected': 'true' }, 'Berjalan');
      var tabB = h('button', { class: 'tab', type: 'button', role: 'tab', 'aria-selected': 'false' }, 'Semua');
      root.appendChild(h('div', { class: 'tabs', role: 'tablist' }, tabA, tabB));
      var area = h('div');
      root.appendChild(area);
      function setView(v) { view = v; tabA.setAttribute('aria-selected', v === 'berjalan' ? 'true' : 'false'); tabB.setAttribute('aria-selected', v === 'semua' ? 'true' : 'false'); load(); }
      tabA.addEventListener('click', function () { setView('berjalan'); });
      tabB.addEventListener('click', function () { setView('semua'); });

      function load() {
        MklUI.clear(area).appendChild(MklUI.loadingState('Memuat...'));
        MklApi.call('hr.loans.list', { view: view }).then(function (res) {
          MklUI.clear(area);
          if (!res.success) { area.appendChild(MklUI.errorState(res, load)); return; }
          var items = res.data.items;
          var waiting = items.filter(function (l) { return l.status === 'disetujui'; }).length;
          if (waiting && MklState.can('loan.manage')) area.appendChild(MklUI.alertBox('warning', waiting + ' kasbon sudah disetujui tetapi belum ditandai diserahkan. Cicilan baru dipotong setelah ditandai.'));
          area.appendChild(MklUI.card(null, [
            view === 'berjalan' ? h('div', { class: 'stats stats-money' }, MklTimeUI.stat('Total sisa kasbon berjalan', MklUI.fmtMoney(res.data.totalBalance), 'info')) : null,
            h('div', { class: 'recap-table money-table' }, MklUI.table([
              { label: 'Karyawan', render: function (l) { return h('span', null, h('strong', null, l.fullName), h('br'), h('span', { class: 'muted small' }, l.employeeId)); } },
              { label: 'Kasbon', render: function (l) { return h('span', null, MklUI.fmtMoney(l.amount || l.requestedAmount), h('br'), h('span', { class: 'muted small' }, l.reason)); } },
              { label: 'Cicilan', render: function (l) { return l.installments ? h('span', null, l.installments + '× ' + MklUI.fmtMoney(l.installmentAmount), h('br'), h('span', { class: 'muted small' }, 'mulai gaji ' + l.startMonthLabel)) : '-'; } },
              { label: 'Sudah dipotong', render: function (l) { return l.installments ? l.paidCount + ' dari ' + l.installments : '-'; } },
              { label: 'Sisa', render: function (l) { return l.status === 'aktif' || l.status === 'disetujui' ? h('strong', null, MklUI.fmtMoney(l.balance)) : '-'; } },
              { label: 'Status', render: function (l) { return h('span', null, MklUI.badge(l.statusLabel, VARIANT[l.status] || 'muted'), l.disbursedAt ? h('span', { class: 'muted small' }, h('br'), 'diserahkan ' + MklUI.fmtDate(l.disbursedAt)) : null); } },
              { label: 'Aksi', className: 'col-action', render: function (l) {
                var row = h('div', { class: 'btn-row' });
                if (l.canDisburse) {
                  var d = h('button', { class: 'btn btn-primary btn-small', type: 'button' }, 'Tandai Sudah Diserahkan');
                  d.addEventListener('click', function () {
                    var date = MklUI.field({ label: 'Tanggal uang diserahkan', name: 'date', type: 'date', required: true, value: MklUI.todayYmd() });
                    dateModal('Serahkan kasbon ' + l.fullName + ' ' + MklUI.fmtMoney(l.amount), [h('p', null, 'Tandai setelah uang benar-benar diserahkan ke karyawan. Cicilan mulai dipotong dari gaji ' + l.startMonthLabel + '.'), date], 'hr.loans.disburse', function () { return { loanId: l.loanId, date: date.input.value }; }, load);
                  });
                  row.appendChild(d);
                }
                if (l.canRepay) {
                  var r = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Catat Pelunasan Tunai');
                  r.addEventListener('click', function () {
                    var amt = MklUI.moneyPreview(MklUI.field({ label: 'Jumlah dibayar (Rp)', name: 'amount', type: 'number', inputmode: 'numeric', required: true, value: String(l.balance) }));
                    var date = MklUI.field({ label: 'Tanggal', name: 'date', type: 'date', required: true, value: MklUI.todayYmd() });
                    var note = MklUI.field({ label: 'Keterangan', name: 'reason', required: true, multiline: true, rows: 2, maxLength: 300, placeholder: 'Contoh: dibayar tunai ke kasir' });
                    dateModal('Pelunasan tunai kasbon ' + l.fullName, [h('p', null, 'Sisa kasbon ' + MklUI.fmtMoney(l.balance) + '.'), amt, date, note], 'hr.loans.repayCash', function () { return { loanId: l.loanId, amount: Number(amt.input.value || 0), date: date.input.value, reason: note.input.value.trim() }; }, load);
                  });
                  row.appendChild(r);
                }
                if (l.canCancel) {
                  var c = h('button', { class: 'btn btn-ghost btn-small', type: 'button' }, 'Batalkan');
                  c.addEventListener('click', function () {
                    MklUI.confirmAction({
                      title: 'Batalkan kasbon ' + l.fullName, message: h('p', null, 'Hanya jika uang belum diserahkan. Karyawan diberi tahu.'),
                      confirmLabel: 'Batalkan Kasbon', danger: true, reasonLabel: 'Alasan', reasonRequired: true,
                      onConfirm: function (reason) { return MklApi.call('hr.loans.cancel', { loanId: l.loanId, reason: reason }).then(function (x) { if (x.success) { MklUI.toast(x.message, 'success'); load(); } return x; }); }
                    });
                  });
                  row.appendChild(c);
                }
                if (l.status !== 'disetujui') {
                  var hb = h('button', { class: 'btn btn-ghost btn-small', type: 'button' }, 'Riwayat');
                  hb.addEventListener('click', function () { historyModal(l); });
                  row.appendChild(hb);
                }
                return row;
              } }
            ], items, view === 'berjalan' ? 'Tidak ada kasbon yang berjalan.' : 'Belum ada kasbon.')),
            h('p', { class: 'muted small' }, 'Cicilan dipotong otomatis saat gaji dihitung, dan tercatat terbayar setelah gaji periode itu disetujui Direktur.')
          ]));
        });
      }
      load();
    }
  });
})();
