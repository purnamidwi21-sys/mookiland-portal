/*
 * Halaman Role & Permission (hanya baca).
 */
(function () {
  'use strict';
  var h = MklUI.h;

  MklNav.register('/admin/role', {
    title: 'Role & Permission',
    perm: ['role.view', 'user.manage', 'user.manage.privileged'],
    menu: { label: 'Role & Permission', order: 21, section: 'Administrasi' },
    render: function (root) {
      var body = h('div', { class: 'stack' }, MklUI.loadingState('Memuat role...'));
      root.appendChild(MklUI.pageHeader('Role & Permission',
        'Isi setiap role. Pemberian role ke pengguna dilakukan di menu Pengguna.'));
      root.appendChild(body);

      function load() {
        MklApi.call('admin.roles.list', {}).then(function (res) {
          MklUI.clear(body);
          if (!res.success) { body.appendChild(MklUI.errorState(res, load)); return; }
          body.appendChild(MklUI.alertBox('info',
            'Pada versi ini isi role ditetapkan oleh sistem. Permission bertanda Sensitif membuka akses ke data pribadi, gaji, atau pengelolaan akun.'));
          res.data.roles.forEach(function (role) {
            var byModule = {};
            role.permissions.forEach(function (p) {
              (byModule[p.module] = byModule[p.module] || []).push(p);
            });
            var groups = Object.keys(byModule).sort().map(function (mod) {
              return h('div', { class: 'perm-group' },
                h('h3', null, mod.charAt(0).toUpperCase() + mod.slice(1)),
                h('ul', { class: 'perm-list' }, byModule[mod].map(function (p) {
                  return h('li', null,
                    h('span', null, p.description),
                    p.sensitive ? MklUI.badge('Sensitif', 'warning') : null,
                    h('code', { class: 'muted small' }, p.code));
                })));
            });
            body.appendChild(h('details', { class: 'card role-card' },
              h('summary', null,
                h('span', { class: 'role-name' }, role.name),
                role.sensitive ? MklUI.badge('Sensitif', 'warning') : MklUI.badge('Umum', 'info'),
                role.active ? null : MklUI.badge('Nonaktif', 'muted'),
                h('span', { class: 'muted small' }, role.permissions.length + ' permission')),
              h('p', { class: 'muted' }, role.description),
              groups));
          });
        });
      }
      load();
    }
  });
})();
