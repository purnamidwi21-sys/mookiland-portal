/*
 * Tahap Peluncuran (0.12.0): buka/tutup fitur karyawan per kelompok.
 * Sakelar disimpan dan DIPERIKSA di server (MklRollout); halaman ini hanya mengubahnya.
 */
(function () {
  'use strict';
  var h = MklUI.h;

  MklNav.register('/admin/tahap-peluncuran', {
    title: 'Tahap Peluncuran',
    perm: ['settings.manage', 'user.manage.privileged', 'employee.manage'],
    menu: { label: 'Tahap Peluncuran', order: 23, section: 'Administrasi' },
    render: function (root) {
      root.appendChild(MklUI.pageHeader('Tahap Peluncuran', 'Fitur karyawan dibuka bertahap. Fitur yang belum dibuka tidak tampil di portal karyawan dan ditolak oleh server.'));
      var body = h('div', { class: 'stack' }, MklUI.loadingState('Memuat...'));
      root.appendChild(body);

      function load() {
        MklApi.call('admin.rollout.get', {}).then(function (res) {
          MklUI.clear(body);
          if (!res.success) { body.appendChild(MklUI.errorState(res, load)); return; }
          draw(res.data);
        });
      }

      function draw(d) {
        var boxes = {};
        body.appendChild(MklUI.alertBox('info', 'Selalu terbuka untuk semua karyawan: ' + d.always + '. Fitur pengelola untuk HR, Payroll, Supervisor, dan Direktur tidak terpengaruh.'));
        if (!d.configured) body.appendChild(MklUI.alertBox('warning', 'Pengaturan belum ada. Jalankan setupJalankanSemua di Apps Script, atau tekan Simpan di bawah. Sampai saat itu semua fitur dianggap terbuka.'));
        var list = h('div', { class: 'stack' });
        d.groups.forEach(function (g) {
          var cb = MklUI.checkboxField({ name: 'g_' + g.code, label: 'Buka: ' + g.label, checked: g.open, hint: g.items });
          cb.input.setAttribute('data-code', g.code);
          boxes[g.code] = cb.input;
          list.appendChild(h('div', { class: 'rollout-row' }, cb.wrap,
            h('span', { class: 'rollout-badges' },
              g.open ? MklUI.badge('Dibuka', 'success') : MklUI.badge('Belum dibuka', 'muted'),
              g.phase1 ? MklUI.badge('Fase 1', 'info') : null)));
        });
        var save = h('button', { class: 'btn btn-primary', type: 'button' }, 'Simpan');
        body.appendChild(MklUI.card('Kelompok fitur karyawan', [list,
          h('p', { class: 'muted small' }, 'Selama Gaji belum dibuka, slip gaji (resmi maupun draf) tidak dikirim ke email karyawan dan karyawan tidak mendapat notifikasi slip. PDF slip tetap bisa diunduh HR dari halaman Penggajian.'),
          d.push ? h('p', { class: 'muted small' }, 'Pengingat di HP: ' + (d.push.enabled ? d.push.users + ' pengguna sudah mengaktifkan di ' + d.push.devices + ' perangkat. Pengingat belum absen hanya dikirim bila Absen lewat HP dibuka.' : 'belum aktif (jalankan setupJalankanSemua dan setupPasangPemicu).')) : null,
          d.updatedAt ? h('p', { class: 'muted small' }, 'Terakhir diubah ' + MklUI.fmtDateTime(d.updatedAt) + (d.updatedBy ? ' oleh ' + d.updatedBy : '') + '. Riwayat lengkap ada di Log Aktivitas.') : null,
          h('div', { class: 'form-actions' }, save)]));

        save.addEventListener('click', function () {
          var open = d.groups.filter(function (g) { return boxes[g.code].checked; }).map(function (g) { return g.code; });
          var opened = d.groups.filter(function (g) { return !g.open && boxes[g.code].checked; });
          var closed = d.groups.filter(function (g) { return g.open && !boxes[g.code].checked; });
          if (!opened.length && !closed.length && d.configured) { MklUI.toast('Tidak ada perubahan.', 'info'); return; }
          var names = function (arr) { return arr.map(function (g) { return g.label; }).join(', '); };
          MklUI.confirmAction({
            title: 'Simpan Tahap Peluncuran',
            message: h('div', null,
              opened.length ? h('p', null, 'Dibuka untuk semua karyawan: ', h('strong', null, names(opened)), '.') : null,
              closed.length ? h('p', null, 'Ditutup: ', h('strong', null, names(closed)), '. Menu ini hilang dari portal karyawan.') : null,
              h('p', { class: 'muted small' }, 'Karyawan yang sedang membuka portal melihat perubahan setelah memuat ulang halaman.')),
            confirmLabel: 'Simpan',
            reasonLabel: 'Catatan (tidak wajib)',
            reasonHint: 'Misalnya "Fase 2: slip gaji mulai November". Dicatat di audit log.',
            onConfirm: function (reason) {
              var payload = { open: open };
              if (reason) payload.reason = reason;
              return MklApi.call('admin.rollout.save', payload).then(function (r) {
                if (r.success) {
                  MklUI.toast(r.message, 'success', 8000);
                  // Menu sendiri ikut berubah (fitur karyawan milik pengguna ini juga mengikuti sakelar).
                  if (window.MklApp && MklApp.refreshUser) MklApp.refreshUser();
                }
                return r;
              });
            }
          });
        });
      }
      load();
    }
  });
})();
