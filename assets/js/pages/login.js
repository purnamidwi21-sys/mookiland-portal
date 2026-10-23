/*
 * Halaman Masuk dan Lupa Password.
 */
(function () {
  'use strict';
  var h = MklUI.h;

  function brandBlock(subtitle) {
    return h('div', { class: 'auth-brand' },
      h('span', { class: 'brand-mark brand-mark-lg', 'aria-hidden': 'true' }, 'M'),
      h('h1', { class: 'page-title', tabindex: '-1' }, 'Mookiland Staff Portal'),
      h('p', { class: 'muted' }, subtitle));
  }

  MklNav.register('/masuk', {
    title: 'Masuk',
    public: true,
    layout: 'bare',
    redirectIfAuthed: true,
    render: function (root) {
      var flash = MklState.takeFlash();
      var alertSlot = h('div', { class: 'alert-slot' });
      if (flash) alertSlot.appendChild(MklUI.alertBox(flash.type, flash.message));

      var username = MklUI.field({
        label: 'Username', name: 'username', required: true, autocomplete: 'username',
        autocapitalize: 'none', spellcheck: false, maxLength: 64
      });
      var password = MklUI.passwordField({ label: 'Password', name: 'password', required: true, autocomplete: 'current-password' });
      var submit = h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'Masuk');
      var form = h('form', { class: 'stack', novalidate: true },
        alertSlot, username.wrap, password.wrap, submit,
        h('p', { class: 'center' }, h('a', { href: '#/lupa-password' }, 'Lupa password?')));

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        MklUI.clearFieldErrors(form);
        MklUI.clear(alertSlot);
        var u = username.input.value.trim();
        var p = password.input.value;
        var missing = {};
        if (!u) missing.username = 'Username wajib diisi.';
        if (!p) missing.password = 'Password wajib diisi.';
        if (Object.keys(missing).length) {
          MklUI.showFieldErrors(form, { details: { fields: missing } });
          return;
        }
        MklUI.setBusy(submit, true, 'Memeriksa...');
        MklApi.call('auth.login', { username: u, password: p }).then(function (res) {
          MklUI.setBusy(submit, false);
          if (res.success) {
            MklApi.setToken(res.data.token);
            MklApp.afterLogin(res.data.user);
            return;
          }
          password.input.value = '';
          if (!MklUI.showFieldErrors(form, res)) {
            alertSlot.appendChild(MklUI.alertBox('error', res.message));
            password.input.focus();
          }
        });
      });

      root.appendChild(h('div', { class: 'auth-card card' },
        brandBlock('Masuk dengan username dan password yang diberikan HR atau admin.'),
        form));
      username.input.focus();
    }
  });

  MklNav.register('/lupa-password', {
    title: 'Lupa Password',
    public: true,
    layout: 'bare',
    render: function (root) {
      var contact = h('p', { class: 'muted' }, 'Memuat kontak bantuan...');
      root.appendChild(h('div', { class: 'auth-card card' },
        brandBlock('Lupa password'),
        h('div', { class: 'stack' },
          h('p', null, 'Untuk keamanan, password hanya dapat direset oleh admin. Langkahnya:'),
          h('ol', { class: 'steps' },
            h('li', null, 'Hubungi HR atau admin Mookiland secara langsung (tatap muka atau telepon).'),
            h('li', null, 'Sebutkan username Anda. Admin akan memeriksa identitas Anda.'),
            h('li', null, 'Admin memberikan password sementara secara langsung. Jangan menerima password lewat grup chat.'),
            h('li', null, 'Masuk dengan password sementara, lalu Anda akan diminta membuat password baru.')),
          contact,
          h('a', { class: 'btn btn-secondary btn-block', href: '#/masuk' }, 'Kembali ke halaman Masuk'))));
      MklApi.call('system.ping', {}).then(function (res) {
        var c = res.success && res.data.supportContact;
        contact.textContent = c ? 'Kontak bantuan: ' + c : 'Kontak bantuan: HR atau admin Mookiland.';
      });
    }
  });
})();
