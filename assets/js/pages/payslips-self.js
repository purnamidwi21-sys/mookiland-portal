/*
 * Slip Gaji Saya: slip gaji milik karyawan sendiri. Slip muncul setelah
 * gaji disetujui Direktur dan ditandai sudah dibayar. PDF diunduh langsung
 * dari server (bukan tautan publik) dan setiap unduhan tercatat.
 */
(function () {
  'use strict';
  var h = MklUI.h;
  var T = window.MklTimeUI;

  MklNav.register('/slip-saya', {
    title: 'Slip Gaji Saya',
    perm: 'payslip.read.own',
    menu: { label: 'Slip Gaji Saya', order: 4.8 },
    render: function (root) {
      root.appendChild(MklUI.pageHeader('Slip Gaji Saya', 'Slip gaji tersedia setelah gaji periode itu dibayar.'));
      var area = h('div');
      root.appendChild(area);
      function load() {
        MklUI.clear(area).appendChild(MklUI.loadingState('Memuat...'));
        MklApi.call('me.payslips', {}).then(function (res) {
          MklUI.clear(area);
          if (!res.success) { area.appendChild(MklUI.errorState(res, load)); return; }
          if (!res.data.linked) { area.appendChild(T.notLinked()); return; }
          area.appendChild(MklUI.card(null, [
            MklUI.table([
              { label: 'Periode', render: function (s) { return h('span', null, h('strong', null, s.periodLabel), h('br'), h('span', { class: 'muted small' }, T.rangeLabel(s.startDate, s.endDate))); } },
              { label: 'Nomor slip', render: function (s) { return s.payslipNo; } },
              { label: 'Dibayar', render: function (s) { return MklUI.fmtDate(s.paidAt); } },
              { label: 'Aksi', className: 'col-action', render: function (s) {
                var b = h('button', { class: 'btn btn-primary btn-small', type: 'button' }, 'Unduh PDF');
                b.addEventListener('click', function () {
                  MklUI.setBusy(b, true, 'Mengunduh...');
                  MklApi.call('me.payslipDownload', { payslipId: s.payslipId }).then(function (r) {
                    MklUI.setBusy(b, false);
                    if (!r.success) { MklUI.toast(r.message, 'error'); return; }
                    MklUI.downloadBase64(r.data.fileName, r.data.mimeType, r.data.base64);
                  });
                });
                return b;
              } }
            ], res.data.items, 'Belum ada slip gaji. Slip muncul di sini setelah gaji dibayar.'),
            h('p', { class: 'muted small' }, 'Simpan file slip di tempat aman dan jangan dibagikan di grup chat. Jika ada angka yang tidak sesuai, hubungi Manajer Operasional.')
          ]));
        });
      }
      load();
    }
  });
})();
