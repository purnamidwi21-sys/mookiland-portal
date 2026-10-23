/*
 * Halaman Ganti Password.
 */
(function () {
  'use strict';
  var h = MklUI.h;

  MklNav.register('/ganti-password', {
    title: 'Ganti Password',
    render: function (root) {
      var forced = MklState.user && MklState.user.mustChangePassword;
      var alertSlot = h('div', { class: 'alert-slot' });
      if (forced) {
        alertSlot.appendChild(MklUI.alertBox('warning',
          'Anda masuk dengan password sementara. Buat password baru sebelum menggunakan menu lain.'));
      }
      var current = MklUI.passwordField({ label: 'Password saat ini', name: 'currentPassword', required: true, autocomplete: 'current-password' });
      var next = MklUI.passwordField({ label: 'Password baru', name: 'newPassword', required: true, autocomplete: 'new-password' });
      var repeat = MklUI.passwordField({ label: 'Ulangi password baru', name: 'repeatPassword', required: true, autocomplete: 'new-password' });
      var submit = h('button', { class: 'btn btn-primary', type: 'submit' }, 'Simpan Password Baru');

      var form = h('form', { class: 'stack form-narrow', novalidate: true },
        alertSlot,
        current.wrap, next.wrap, repeat.wrap,
        h('div', { class: 'note' },
          h('strong', null, 'Syarat password baru:'),
          h('ul', null,
            h('li', null, 'Minimal 8 karakter.'),
            h('li', null, 'Berisi huruf dan angka.'),
            h('li', null, 'Tidak mengandung username Anda.'),
            h('li', null, 'Berbeda dari password saat ini.'))),
        h('div', { class: 'form-actions' }, submit));

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        MklUI.clearFieldErrors(form);
        MklUI.clear(alertSlot);
        var errs = {};
        if (!current.input.value) errs.currentPassword = 'Password saat ini wajib diisi.';
        if (!next.input.value) errs.newPassword = 'Password baru wajib diisi.';
        if (next.input.value !== repeat.input.value) errs.repeatPassword = 'Ulangan password tidak sama dengan password baru.';
        if (Object.keys(errs).length) {
          MklUI.showFieldErrors(form, { details: { fields: errs } });
          return;
        }
        MklUI.setBusy(submit, true, 'Menyimpan...');
        MklApi.call('auth.changePassword', { currentPassword: current.input.value, newPassword: next.input.value }).then(function (res) {
          MklUI.setBusy(submit, false);
          if (res.success) {
            if (MklState.user) MklState.user.mustChangePassword = false;
            if (window.MklApp && MklApp.refreshNotifications) MklApp.refreshNotifications();
            MklUI.toast('Password berhasil diganti. Perangkat lain yang masuk dengan akun ini telah dikeluarkan.', 'success');
            MklNav.go('/beranda');
            return;
          }
          if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message));
        });
      });

      root.appendChild(MklUI.pageHeader('Ganti Password', 'Gunakan password yang hanya Anda ketahui.'));
      root.appendChild(MklUI.card(null, form));
    }
  });
})();
