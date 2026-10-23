/*
 * Daftar jabatan. Jabatan tidak dihapus; jabatan yang tidak dipakai lagi
 * dinonaktifkan agar riwayat karyawan tetap terbaca.
 */
(function () {
  'use strict';
  var h = MklUI.h;

  MklNav.register('/karyawan/jabatan', {
    title: 'Jabatan',
    perm: 'employee.manage',
    menu: { label: 'Jabatan', order: 13, section: 'SDM' },
    render: function (root) {
      var results = h('div', { class: 'results' });
      var add = h('button', { class: 'btn btn-primary', type: 'button' }, 'Tambah Jabatan');
      add.addEventListener('click', function () { openForm(null); });
      root.appendChild(MklUI.pageHeader('Jabatan', 'Daftar jabatan yang dipilih pada data karyawan.', add));
      root.appendChild(MklUI.card(null, results));

      function load() {
        MklUI.clear(results).appendChild(MklUI.loadingState('Memuat jabatan...'));
        MklApi.call('hr.positions.list', {}).then(function (res) {
          MklUI.clear(results);
          if (!res.success) { results.appendChild(MklUI.errorState(res, load)); return; }
          results.appendChild(MklUI.table([
            { label: 'Nama jabatan', render: function (p) { return p.name; } },
            { label: 'Karyawan aktif', render: function (p) { return String(p.activeEmployees); } },
            { label: 'Status', render: function (p) { return p.active ? MklUI.badge('Dipakai', 'success') : MklUI.badge('Tidak aktif', 'muted'); } },
            { label: 'Aksi', className: 'col-action', render: function (p) {
              var b = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Ubah');
              b.addEventListener('click', function () { openForm(p); });
              return b;
            } }
          ], res.data.items, 'Belum ada jabatan. Jabatan juga dibuat otomatis saat impor dari Excel.'));
        });
      }

      function openForm(p) {
        var form = h('form', { class: 'stack', novalidate: true });
        var name = MklUI.field({ label: 'Nama jabatan', name: 'name', required: true, maxLength: 60, value: p ? p.name : '' });
        var active = p ? MklUI.checkboxField({ label: 'Masih dipakai', name: 'active', checked: p.active, hint: 'Hapus centang jika jabatan tidak dipakai lagi. Karyawan yang sudah memakai jabatan ini tidak berubah.' }) : null;
        var reason = p ? MklUI.field({ label: 'Alasan perubahan', name: 'reason', required: true, multiline: true, rows: 2, maxLength: 300 }) : null;
        var alertSlot = h('div');
        [name.wrap, active ? active.wrap : null, reason ? reason.wrap : null, alertSlot].forEach(function (x) { if (x) form.appendChild(x); });
        var ctl = MklUI.modal({ title: p ? 'Ubah Jabatan' : 'Tambah Jabatan', content: form, actions: [
          { label: 'Batal', onClick: function (c) { c.close(); } },
          { label: 'Simpan', variant: 'primary', id: 'ok', onClick: submit }
        ] });
        form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });
        function submit(c, btn) {
          MklUI.clearFieldErrors(form);
          MklUI.clear(alertSlot);
          var action = p ? 'hr.positions.update' : 'hr.positions.create';
          var payload = p ? { positionId: p.positionId, name: name.input.value.trim(), active: active.input.checked, reason: reason.input.value.trim() } : { name: name.input.value.trim() };
          MklUI.setBusy(btn, true, 'Menyimpan...');
          MklApi.call(action, payload).then(function (res) {
            MklUI.setBusy(btn, false);
            if (!res.success) {
              if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message));
              return;
            }
            c.close();
            MklUI.toast(res.message, 'success');
            MklLookups.invalidate();
            load();
          });
        }
      }

      load();
    }
  });
})();
