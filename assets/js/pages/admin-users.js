/*
 * Halaman Pengguna (daftar dan detail) untuk System Admin dan Manajemen.
 */
(function () {
  'use strict';
  var h = MklUI.h;

  var STATUS_OPTIONS = [
    { value: '', label: 'Semua status' },
    { value: 'active', label: 'Aktif' },
    { value: 'locked', label: 'Terkunci' },
    { value: 'disabled', label: 'Nonaktif' }
  ];

  function statusBadge(u) {
    if (u.status === 'disabled') return MklUI.badge('Nonaktif', 'muted');
    if (u.locked) return MklUI.badge('Terkunci', 'warning');
    return MklUI.badge('Aktif', 'success');
  }

  function roleBadges(codes, rolesByCode) {
    return h('span', { class: 'badge-row' }, codes.map(function (c) {
      var r = rolesByCode[c];
      return MklUI.badge(r ? r.name : c, r && r.sensitive ? 'warning' : 'info');
    }));
  }

  function loadRoles() {
    return MklApi.call('admin.roles.list', {}).then(function (res) {
      if (!res.success) return { res: res, roles: [], byCode: {} };
      var byCode = {};
      res.data.roles.forEach(function (r) { byCode[r.code] = r; });
      return { res: res, roles: res.data.roles, byCode: byCode };
    });
  }

  /** Kotak centang role. Role yang tidak boleh diberikan pelaku ditampilkan tetapi tidak bisa diubah. */
  function roleCheckboxes(roles, selected, legend) {
    var boxes = [];
    var group = h('fieldset', { class: 'checkbox-group' },
      h('legend', null, legend || 'Role'),
      roles.map(function (r) {
        var id = MklUI.uid('role');
        var cb = h('input', { type: 'checkbox', id: id, name: 'roles', value: r.code, checked: selected.indexOf(r.code) !== -1 ? true : null, disabled: r.canAssign ? null : true });
        boxes.push(cb);
        return h('div', { class: 'checkbox' + (r.canAssign ? '' : ' checkbox-disabled') },
          cb,
          h('label', { for: id },
            h('span', { class: 'checkbox-title' }, r.name, r.sensitive ? MklUI.badge('Sensitif', 'warning') : null),
            h('span', { class: 'muted small' }, r.description),
            r.canAssign ? null : h('span', { class: 'muted small' }, 'Hanya dapat diberikan oleh Manajemen.')));
      }),
      h('p', { class: 'field-error', 'data-error-for': 'roles' }));
    return {
      el: group,
      values: function () { return boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; }); }
    };
  }

  /** Menampilkan password sementara satu kali. */
  function showTemporaryPassword(username, temp, intro) {
    var code = h('code', { class: 'temp-password' }, temp);
    MklUI.modal({
      title: 'Password sementara',
      dismissible: false,
      content: h('div', { class: 'stack' },
        h('p', null, intro + ' Password sementara untuk ', h('strong', null, username), ':'),
        h('div', { class: 'temp-password-box' }, code, MklUI.copyButton(temp)),
        MklUI.alertBox('warning', 'Password ini hanya ditampilkan sekali. Berikan langsung kepada pengguna, jangan lewat grup chat. Pengguna wajib menggantinya saat pertama masuk.')),
      actions: [{ label: 'Saya sudah mencatatnya', variant: 'primary', onClick: function (c) { c.close(); } }]
    });
  }

  // ================================================================== daftar

  MklNav.register('/admin/pengguna', {
    title: 'Pengguna',
    perm: ['user.manage', 'user.manage.privileged'],
    menu: { label: 'Pengguna', order: 20, section: 'Administrasi' },
    render: function (root) {
      var state = { q: '', status: '', role: '', page: 1 };
      var roleInfo = { roles: [], byCode: {} };
      var results = h('div', { class: 'results' });

      var search = MklUI.field({ label: 'Cari username atau nama', name: 'q', maxLength: 64 });
      var status = MklUI.selectField({ label: 'Status', name: 'status', options: STATUS_OPTIONS, value: '' });
      var role = MklUI.selectField({ label: 'Role', name: 'role', options: [{ value: '', label: 'Semua role' }], value: '' });
      var apply = h('button', { class: 'btn btn-secondary', type: 'submit' }, 'Tampilkan');
      var filters = h('form', { class: 'filters', novalidate: true, role: 'search' }, search.wrap, status.wrap, role.wrap, h('div', { class: 'filters-actions' }, apply));
      filters.addEventListener('submit', function (e) {
        e.preventDefault();
        state.q = search.input.value.trim();
        state.status = status.input.value;
        state.role = role.input.value;
        state.page = 1;
        load();
      });

      var addBtn = h('button', { class: 'btn btn-primary', type: 'button' }, 'Tambah Pengguna');
      addBtn.addEventListener('click', openCreate);

      root.appendChild(MklUI.pageHeader('Pengguna', 'Akun untuk masuk ke Mookiland Staff Portal.', addBtn));
      root.appendChild(MklUI.card(null, [filters, results]));

      function load() {
        MklUI.clear(results).appendChild(MklUI.loadingState('Memuat pengguna...'));
        MklApi.call('admin.users.list', { q: state.q, status: state.status, role: state.role, page: state.page, pageSize: 20 }).then(function (res) {
          MklUI.clear(results);
          if (!res.success) { results.appendChild(MklUI.errorState(res, load)); return; }
          results.appendChild(MklUI.table([
            { label: 'Username', render: function (u) { return h('a', { href: '#/admin/pengguna/' + u.userId }, u.username); } },
            { label: 'Nama', render: function (u) { return u.displayName; } },
            { label: 'Role', render: function (u) { return roleBadges(u.roles, roleInfo.byCode); } },
            { label: 'Status', render: statusBadge },
            { label: 'Masuk terakhir', render: function (u) { return u.lastLoginAt ? MklUI.fmtDateTime(u.lastLoginAt) : 'Belum pernah'; } },
            { label: 'Aksi', className: 'col-action', render: function (u) { return h('a', { class: 'btn btn-secondary btn-small', href: '#/admin/pengguna/' + u.userId }, 'Kelola'); } }
          ], res.data.items, 'Tidak ada pengguna yang cocok dengan filter.'));
          results.appendChild(MklUI.pagination(res.data, function (p) { state.page = p; load(); }));
        });
      }

      function openCreate() {
        if (!roleInfo.roles.length) { MklUI.toast('Daftar role belum termuat. Coba lagi.', 'error'); return; }
        var form = h('form', { class: 'stack', novalidate: true });
        var username = MklUI.field({ label: 'Username', name: 'username', required: true, maxLength: 32, autocapitalize: 'none', spellcheck: false, hint: '3–32 karakter: huruf kecil, angka, titik, garis bawah, atau tanda minus. Contoh: budi.santoso' });
        var name = MklUI.field({ label: 'Nama tampilan', name: 'displayName', required: true, maxLength: 80, hint: 'Nama yang tampil di aplikasi.' });
        var roles = roleCheckboxes(roleInfo.roles, ['STAFF'], 'Role');
        var alertSlot = h('div');
        form.appendChild(username.wrap);
        form.appendChild(name.wrap);
        form.appendChild(roles.el);
        form.appendChild(alertSlot);
        var ctl = MklUI.modal({
          title: 'Tambah Pengguna',
          content: form,
          actions: [
            { label: 'Batal', onClick: function (c) { c.close(); } },
            { label: 'Buat Akun', variant: 'primary', id: 'ok', onClick: submit }
          ]
        });
        form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });

        function submit(c, btn) {
          MklUI.clearFieldErrors(form);
          MklUI.clear(alertSlot);
          MklUI.setBusy(btn, true, 'Membuat...');
          MklApi.call('admin.users.create', {
            username: username.input.value.trim(),
            displayName: name.input.value.trim(),
            roles: roles.values()
          }).then(function (res) {
            MklUI.setBusy(btn, false);
            if (!res.success) {
              if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message));
              return;
            }
            c.close();
            MklUI.toast('Akun ' + res.data.user.username + ' berhasil dibuat.', 'success');
            showTemporaryPassword(res.data.user.username, res.data.temporaryPassword, 'Akun berhasil dibuat.');
            load();
          });
        }
      }

      loadRoles().then(function (info) {
        roleInfo = info;
        info.roles.forEach(function (r) { role.input.appendChild(h('option', { value: r.code }, r.name)); });
        load();
      });
    }
  });

  // ================================================================== detail

  MklNav.register('/admin/pengguna/:id', {
    title: 'Kelola Pengguna',
    perm: ['user.manage', 'user.manage.privileged'],
    render: function (root, params) {
      var container = h('div');
      root.appendChild(h('p', null, h('a', { href: '#/admin/pengguna' }, '← Kembali ke daftar Pengguna')));
      root.appendChild(container);
      var roleInfo = { roles: [], byCode: {} };

      function load() {
        MklUI.clear(container).appendChild(MklUI.loadingState('Memuat data pengguna...'));
        Promise.all([MklApi.call('admin.users.get', { userId: params.id }), roleInfo.roles.length ? Promise.resolve(roleInfo) : loadRoles()])
          .then(function (out) {
            var res = out[0];
            roleInfo = out[1];
            MklUI.clear(container);
            if (!res.success) { container.appendChild(MklUI.errorState(res, load)); return; }
            render(res.data);
          });
      }

      function render(u) {
        container.appendChild(MklUI.pageHeader(u.displayName, u.username + (u.isSelf ? ' (akun Anda)' : '')));
        if (!u.canManage) {
          container.appendChild(MklUI.alertBox('info', 'Akun ini memiliki role sensitif. Perubahan hanya dapat dilakukan oleh pengguna dengan role Manajemen.'));
        }

        var renameBtn = h('button', { class: 'btn btn-secondary btn-small', type: 'button', disabled: u.canManage ? null : true }, 'Ubah Nama');
        renameBtn.addEventListener('click', function () { openRename(u); });
        container.appendChild(MklUI.card('Informasi akun', [
          MklUI.infoList([
            ['Username', u.username],
            ['Nama tampilan', u.displayName],
            ['Status', statusBadge(u)],
            ['Terkunci sampai', u.status === 'locked' ? 'Sampai dibuka admin' : (u.locked ? MklUI.fmtDateTime(u.lockedUntil) : '-')],
            ['Wajib ganti password', u.mustChangePassword ? 'Ya' : 'Tidak'],
            ['Masuk terakhir', u.lastLoginAt ? MklUI.fmtDateTime(u.lastLoginAt) : 'Belum pernah'],
            ['Sesi aktif', String(u.activeSessions)],
            ['Dibuat', MklUI.fmtDateTime(u.createdAt)]
          ]),
          h('div', { class: 'form-actions' }, renameBtn)
        ]));

        container.appendChild(employeeLinkCard(u));

        // Role
        var assignable = roleInfo.roles.map(function (r) {
          var copy = {};
          Object.keys(r).forEach(function (k) { copy[k] = r[k]; });
          if (!u.canManage) copy.canAssign = false;
          return copy;
        });
        var roles = roleCheckboxes(assignable, u.roles, 'Role pengguna');
        var saveRoles = h('button', { class: 'btn btn-primary', type: 'button', disabled: u.canManage ? null : true }, 'Simpan Role');
        saveRoles.addEventListener('click', function () {
          var chosen = roles.values().concat(u.roles.filter(function (c) {
            var r = roleInfo.byCode[c];
            return r && !r.canAssign; // role yang tidak bisa diubah pelaku tetap dipertahankan
          })).filter(function (v, i, arr) { return arr.indexOf(v) === i; });
          if (!chosen.length) { MklUI.toast('Pilih minimal satu role.', 'error'); return; }
          MklUI.confirmAction({
            title: 'Simpan perubahan role',
            message: 'Role ' + u.username + ' akan menjadi: ' + chosen.map(function (c) { return roleInfo.byCode[c] ? roleInfo.byCode[c].name : c; }).join(', ') + '.',
            confirmLabel: 'Simpan Role',
            reasonLabel: 'Alasan perubahan',
            reasonRequired: true,
            onConfirm: function (reason) {
              return MklApi.call('admin.users.setRoles', { userId: u.userId, roles: chosen, reason: reason }).then(function (res) {
                if (res.success) { MklUI.toast(res.message, 'success'); load(); }
                return res;
              });
            }
          });
        });
        container.appendChild(MklUI.card('Role', [
          h('p', { class: 'muted' }, 'Role menentukan menu dan data yang boleh diakses. Role bertanda Sensitif hanya dapat diberikan oleh Manajemen.'),
          roles.el,
          h('div', { class: 'form-actions' }, saveRoles)
        ]));

        // Tindakan
        var actions = h('div', { class: 'action-list' });
        function actionRow(title, desc, btnLabel, variant, handler, disabled) {
          var b = h('button', { class: 'btn btn-' + variant, type: 'button', disabled: disabled ? true : null }, btnLabel);
          b.addEventListener('click', handler);
          actions.appendChild(h('div', { class: 'action-row' }, h('div', null, h('strong', null, title), h('p', { class: 'muted small' }, desc)), b));
        }
        var blocked = !u.canManage;
        if (!u.isSelf) {
          actionRow('Reset password', 'Membuat password sementara baru dan mengeluarkan pengguna dari semua perangkat.', 'Reset Password', 'secondary', function () {
            MklUI.confirmAction({
              title: 'Reset password ' + u.username,
              message: 'Password lama tidak berlaku lagi dan pengguna akan dikeluarkan dari semua perangkat. Pastikan Anda sudah memeriksa identitas pengguna.',
              confirmLabel: 'Reset Password',
              reasonLabel: 'Alasan reset',
              reasonRequired: true,
              onConfirm: function (reason) {
                return MklApi.call('admin.users.resetPassword', { userId: u.userId, reason: reason }).then(function (res) {
                  if (res.success) { showTemporaryPassword(u.username, res.data.temporaryPassword, 'Password berhasil direset.'); load(); }
                  return res;
                });
              }
            });
          }, blocked);
        }
        if (u.locked) {
          actionRow('Buka kunci', 'Akun terkunci karena terlalu banyak percobaan gagal.', 'Buka Kunci', 'secondary', function () {
            MklUI.confirmAction({
              title: 'Buka kunci ' + u.username,
              message: 'Pengguna dapat langsung mencoba masuk lagi dengan password yang sama.',
              confirmLabel: 'Buka Kunci',
              reasonLabel: 'Alasan',
              reasonRequired: true,
              onConfirm: function (reason) {
                return MklApi.call('admin.users.unlock', { userId: u.userId, reason: reason }).then(function (res) {
                  if (res.success) { MklUI.toast(res.message, 'success'); load(); }
                  return res;
                });
              }
            });
          }, blocked);
        }
        actionRow('Paksa keluar', 'Mengakhiri semua sesi aktif pengguna ini di semua perangkat.', 'Paksa Keluar', 'secondary', function () {
          MklUI.confirmAction({
            title: 'Paksa keluar ' + u.username,
            message: u.isSelf ? 'Anda juga akan dikeluarkan dari perangkat ini.' : 'Pengguna harus masuk kembali di semua perangkat.',
            confirmLabel: 'Paksa Keluar',
            reasonLabel: 'Alasan',
            reasonRequired: true,
            onConfirm: function (reason) {
              return MklApi.call('admin.users.revokeSessions', { userId: u.userId, reason: reason }).then(function (res) {
                if (res.success) { MklUI.toast(res.message, 'success'); if (!u.isSelf) load(); }
                return res;
              });
            }
          });
        }, blocked && !u.isSelf);
        if (!u.isSelf) {
          var disabling = u.status !== 'disabled';
          actionRow(disabling ? 'Nonaktifkan akun' : 'Aktifkan kembali',
            disabling ? 'Pengguna tidak bisa masuk lagi. Data dan riwayatnya tetap tersimpan.' : 'Pengguna dapat masuk kembali dengan password terakhirnya.',
            disabling ? 'Nonaktifkan' : 'Aktifkan', disabling ? 'danger' : 'primary', function () {
              MklUI.confirmAction({
                title: (disabling ? 'Nonaktifkan ' : 'Aktifkan ') + u.username,
                message: disabling ? 'Akun dinonaktifkan dan semua sesinya diakhiri. Riwayat tidak dihapus.' : 'Akun akan aktif kembali.',
                confirmLabel: disabling ? 'Nonaktifkan' : 'Aktifkan',
                danger: disabling,
                reasonLabel: 'Alasan',
                reasonRequired: true,
                onConfirm: function (reason) {
                  return MklApi.call('admin.users.update', { userId: u.userId, status: disabling ? 'disabled' : 'active', reason: reason, expectedVersion: Number(u.rowVersion) }).then(function (res) {
                    if (res.success) { MklUI.toast(res.message, 'success'); load(); }
                    return res;
                  });
                }
              });
            }, blocked);
        }
        container.appendChild(MklUI.card('Tindakan', actions));
      }

      /** Hubungan akun dengan data karyawan (agar Profil Saya dan data tim bisa terbaca). */
      function employeeLinkCard(u) {
        var parts = [];
        if (u.employee) {
          parts.push(MklUI.infoList([['Karyawan', u.employee.fullName + ' (' + u.employee.employeeId + ')']]));
          var un = h('button', { class: 'btn btn-secondary btn-small', type: 'button', disabled: u.canManage ? null : true }, 'Putus Hubungan');
          un.addEventListener('click', function () {
            MklUI.confirmAction({
              title: 'Putus hubungan dengan data karyawan',
              message: 'Akun ' + u.username + ' tidak lagi terhubung dengan ' + u.employee.fullName + '. Pengguna tidak bisa membuka Profil Saya sampai dihubungkan lagi.',
              confirmLabel: 'Putus Hubungan', reasonLabel: 'Alasan', reasonRequired: true,
              onConfirm: function (reason) {
                return MklApi.call('hr.employees.accountUnlink', { employeeId: u.employee.employeeId, reason: reason }).then(function (res) {
                  if (res.success) { MklUI.toast(res.message, 'success'); load(); }
                  return res;
                });
              }
            });
          });
          parts.push(h('div', { class: 'form-actions' }, un));
        } else {
          parts.push(h('p', null, 'Akun ini belum terhubung dengan data karyawan.'));
          parts.push(h('p', { class: 'muted small' }, 'Hubungkan jika pemilik akun adalah karyawan (misalnya Manajer Operasional). Akun Direktur yang bukan karyawan tidak perlu dihubungkan.'));
          var ln = h('button', { class: 'btn btn-secondary btn-small', type: 'button', disabled: u.canManage ? null : true }, 'Hubungkan ke Karyawan');
          ln.addEventListener('click', function () { openLinkEmployee(u); });
          parts.push(h('div', { class: 'form-actions' }, ln));
        }
        return MklUI.card('Data karyawan', parts);
      }

      function openLinkEmployee(u) {
        var body = h('div', null, MklUI.loadingState('Memuat karyawan yang belum punya akun...'));
        var ctl = MklUI.modal({ title: 'Hubungkan ke Karyawan', content: body });
        MklApi.call('admin.users.unlinkedEmployees', {}).then(function (res) {
          MklUI.clear(body);
          if (!res.success) { body.appendChild(MklUI.alertBox('error', res.message)); return; }
          if (!res.data.items.length) {
            body.appendChild(MklUI.alertBox('info', res.data.totalActive === 0
              ? 'Belum ada data karyawan aktif. HR perlu mengimpor atau menambah data karyawan dulu di menu Karyawan.'
              : 'Semua karyawan aktif sudah terhubung dengan akun. Jika data karyawan ini ganda, HR bisa menghapus data gandanya di halaman karyawan.'));
            return;
          }
          ctl.close();
          var form = h('form', { class: 'stack', novalidate: true });
          var emp = MklUI.selectField({ label: 'Karyawan', name: 'employeeId', required: true, value: '', options: [{ value: '', label: 'Pilih karyawan' }].concat(res.data.items.map(function (e) {
            return { value: e.employeeId, label: e.fullName + ' (' + e.employeeId + (e.positionName ? ', ' + e.positionName : '') + ')' };
          })) });
          var reason = MklUI.field({ label: 'Alasan', name: 'reason', required: true, multiline: true, rows: 2, maxLength: 300, hint: 'Contoh: Akun Manajer Operasional dibuat sebelum data karyawan diimpor.' });
          var alertSlot = h('div');
          [h('p', null, 'Pilih data karyawan milik pemilik akun ', h('strong', null, u.username), '.'), emp.wrap, reason.wrap, alertSlot].forEach(function (x) { form.appendChild(x); });
          var c2 = MklUI.modal({ title: 'Hubungkan ke Karyawan', content: form, actions: [
            { label: 'Batal', onClick: function (c) { c.close(); } },
            { label: 'Hubungkan', variant: 'primary', id: 'ok', onClick: submit }
          ] });
          form.addEventListener('submit', function (e) { e.preventDefault(); submit(c2, c2.buttons.ok); });
          function submit(c, btn) {
            MklUI.clearFieldErrors(form);
            MklUI.clear(alertSlot);
            if (!emp.input.value) { MklUI.showFieldErrors(form, { details: { fields: { employeeId: 'Pilih karyawan.' } } }); return; }
            MklUI.setBusy(btn, true, 'Menghubungkan...');
            MklApi.call('hr.employees.accountLink', { employeeId: emp.input.value, username: u.username, reason: reason.input.value.trim() }).then(function (r) {
              MklUI.setBusy(btn, false);
              if (!r.success) {
                if (!MklUI.showFieldErrors(form, r)) alertSlot.appendChild(MklUI.alertBox('error', r.message));
                return;
              }
              c.close();
              MklUI.toast(r.message, 'success');
              load();
            });
          }
        });
      }

      function openRename(u) {
        var form = h('form', { class: 'stack', novalidate: true });
        var name = MklUI.field({ label: 'Nama tampilan', name: 'displayName', required: true, maxLength: 80, value: u.displayName });
        var alertSlot = h('div');
        form.appendChild(name.wrap);
        form.appendChild(alertSlot);
        var ctl = MklUI.modal({
          title: 'Ubah nama tampilan',
          content: form,
          actions: [
            { label: 'Batal', onClick: function (c) { c.close(); } },
            { label: 'Simpan', variant: 'primary', id: 'ok', onClick: submit }
          ]
        });
        form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });
        function submit(c, btn) {
          MklUI.clearFieldErrors(form);
          MklUI.clear(alertSlot);
          MklUI.setBusy(btn, true, 'Menyimpan...');
          MklApi.call('admin.users.update', { userId: u.userId, displayName: name.input.value.trim(), expectedVersion: Number(u.rowVersion) }).then(function (res) {
            MklUI.setBusy(btn, false);
            if (!res.success) {
              if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message));
              return;
            }
            c.close();
            MklUI.toast(res.message, 'success');
            load();
          });
        }
      }

      load();
    }
  });
})();
