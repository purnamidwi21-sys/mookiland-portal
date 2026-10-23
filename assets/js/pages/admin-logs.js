/*
 * Halaman Log Aktivitas: Log Masuk dan Audit Log.
 */
(function () {
  'use strict';
  var h = MklUI.h;

  var RESULT_LABELS = {
    success: ['Berhasil masuk', 'success'],
    logout: ['Keluar', 'info'],
    wrong_password: ['Password salah', 'warning'],
    unknown_user: ['Username tidak dikenal', 'warning'],
    locked: ['Terkunci sementara', 'danger'],
    locked_hard: ['Terkunci', 'danger'],
    disabled: ['Akun nonaktif', 'muted'],
    rate_limited: ['Dibatasi (terlalu sering)', 'danger']
  };

  var ACTION_LABELS = {
    'user.create': 'Membuat pengguna',
    'user.update': 'Mengubah pengguna',
    'user.roles.change': 'Mengubah role',
    'user.password.change': 'Mengganti password sendiri',
    'user.password.reset': 'Reset password',
    'user.unlock': 'Membuka kunci akun',
    'user.sessions.revoke': 'Paksa keluar',
    'access.denied': 'Akses ditolak'
  };

  function resultBadge(code) {
    var l = RESULT_LABELS[code] || [code, 'neutral'];
    return MklUI.badge(l[0], l[1]);
  }

  function shortAgent(ua) {
    if (!ua) return '-';
    var browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser lain';
    var os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
    return browser + (os ? ' · ' + os : '');
  }

  function showChanges(item) {
    var rows = item.changes ? Object.keys(item.changes).map(function (k) {
      var c = item.changes[k] || {};
      return { field: k, from: c.from, to: c.to };
    }) : [];
    MklUI.modal({
      title: 'Detail audit',
      wide: true,
      content: h('div', { class: 'stack' },
        MklUI.infoList([
          ['Waktu', MklUI.fmtDateTime(item.timestamp)],
          ['Pelaku', item.actorUsername],
          ['Aksi', (ACTION_LABELS[item.action] || item.action) + ' (' + item.action + ')'],
          ['Data', item.entityType + ': ' + item.entityLabel],
          ['Alasan', item.reason || '-'],
          ['Kode permintaan', item.requestId || '-']
        ]),
        item.detailHidden
          ? MklUI.alertBox('info', 'Nilai sebelum dan sesudah untuk data HR atau payroll hanya dapat dilihat oleh role HR Admin atau Payroll.')
          : MklUI.table([
            { label: 'Kolom', render: function (r) { return h('code', null, r.field); } },
            { label: 'Sebelum', render: function (r) { return r.from; } },
            { label: 'Sesudah', render: function (r) { return r.to; } }
          ], rows, 'Tidak ada rincian perubahan.')),
      actions: [{ label: 'Tutup', variant: 'secondary', onClick: function (c) { c.close(); } }]
    });
  }

  MklNav.register('/admin/log', {
    title: 'Log Aktivitas',
    perm: ['loginlog.read', 'audit.read.all', 'audit.read.hr', 'audit.read.payroll'],
    menu: { label: 'Log Aktivitas', order: 22, section: 'Administrasi' },
    render: function (root) {
      var tabs = [];
      if (MklState.can('loginlog.read')) tabs.push({ id: 'login', label: 'Log Masuk', render: renderLogin });
      if (MklState.canAny(['audit.read.all', 'audit.read.hr', 'audit.read.payroll'])) tabs.push({ id: 'audit', label: 'Audit Log', render: renderAudit });

      var tabBar = h('div', { class: 'tabs', role: 'tablist' });
      var panel = h('div', { class: 'tab-panel', role: 'tabpanel' });
      root.appendChild(MklUI.pageHeader('Log Aktivitas', 'Catatan masuk/keluar dan semua perubahan data. Log tidak dapat diubah atau dihapus.'));
      root.appendChild(MklUI.card(null, [tabBar, panel]));

      tabs.forEach(function (t, i) {
        var b = h('button', { class: 'tab', type: 'button', role: 'tab', 'aria-selected': i === 0 ? 'true' : 'false' }, t.label);
        b.addEventListener('click', function () { select(i); });
        t.button = b;
        tabBar.appendChild(b);
      });
      function select(i) {
        tabs.forEach(function (t, j) { t.button.setAttribute('aria-selected', i === j ? 'true' : 'false'); });
        MklUI.clear(panel);
        tabs[i].render(panel);
      }
      if (tabs.length) select(0);

      function dateFields(form) {
        var from = MklUI.field({ label: 'Dari tanggal', name: 'dateFrom', type: 'date' });
        var to = MklUI.field({ label: 'Sampai tanggal', name: 'dateTo', type: 'date' });
        form.appendChild(from.wrap);
        form.appendChild(to.wrap);
        return { from: from.input, to: to.input };
      }

      function renderLogin(container) {
        var state = { page: 1 };
        var form = h('form', { class: 'filters', novalidate: true });
        var username = MklUI.field({ label: 'Username', name: 'username', maxLength: 64, autocapitalize: 'none' });
        var result = MklUI.selectField({
          label: 'Hasil', name: 'result', value: '',
          options: [{ value: '', label: 'Semua hasil' }].concat(Object.keys(RESULT_LABELS).map(function (k) { return { value: k, label: RESULT_LABELS[k][0] }; }))
        });
        form.appendChild(username.wrap);
        form.appendChild(result.wrap);
        var dates = dateFields(form);
        form.appendChild(h('div', { class: 'filters-actions' }, h('button', { class: 'btn btn-secondary', type: 'submit' }, 'Tampilkan')));
        var results = h('div', { class: 'results' });
        container.appendChild(form);
        container.appendChild(results);
        form.addEventListener('submit', function (e) { e.preventDefault(); state.page = 1; load(); });

        function load() {
          MklUI.clearFieldErrors(form);
          MklUI.clear(results).appendChild(MklUI.loadingState());
          MklApi.call('admin.logs.login', {
            username: username.input.value.trim(), result: result.input.value,
            dateFrom: dates.from.value, dateTo: dates.to.value, page: state.page, pageSize: 20
          }).then(function (res) {
            MklUI.clear(results);
            if (!res.success) {
              if (!MklUI.showFieldErrors(form, res)) results.appendChild(MklUI.errorState(res, load));
              return;
            }
            results.appendChild(MklUI.table([
              { label: 'Waktu', render: function (r) { return MklUI.fmtDateTime(r.timestamp); } },
              { label: 'Username', render: function (r) { return r.username; } },
              { label: 'Hasil', render: function (r) { return resultBadge(r.result); } },
              { label: 'Perangkat', render: function (r) { return h('span', { title: r.clientInfo }, shortAgent(r.clientInfo)); } }
            ], res.data.items, 'Tidak ada log yang cocok.'));
            results.appendChild(MklUI.pagination(res.data, function (p) { state.page = p; load(); }));
          });
        }
        load();
      }

      function renderAudit(container) {
        var state = { page: 1 };
        var form = h('form', { class: 'filters', novalidate: true });
        var action = MklUI.field({ label: 'Kode aksi (awalan)', name: 'action', maxLength: 64, placeholder: 'contoh: user.', autocapitalize: 'none' });
        var actor = MklUI.field({ label: 'Pelaku (username)', name: 'actor', maxLength: 64, autocapitalize: 'none' });
        form.appendChild(action.wrap);
        form.appendChild(actor.wrap);
        var dates = dateFields(form);
        form.appendChild(h('div', { class: 'filters-actions' }, h('button', { class: 'btn btn-secondary', type: 'submit' }, 'Tampilkan')));
        var results = h('div', { class: 'results' });
        container.appendChild(form);
        container.appendChild(results);
        form.addEventListener('submit', function (e) { e.preventDefault(); state.page = 1; load(); });

        function load() {
          MklUI.clearFieldErrors(form);
          MklUI.clear(results).appendChild(MklUI.loadingState());
          MklApi.call('admin.logs.audit', {
            action: action.input.value.trim(), actor: actor.input.value.trim(),
            dateFrom: dates.from.value, dateTo: dates.to.value, page: state.page, pageSize: 20
          }).then(function (res) {
            MklUI.clear(results);
            if (!res.success) {
              if (!MklUI.showFieldErrors(form, res)) results.appendChild(MklUI.errorState(res, load));
              return;
            }
            results.appendChild(MklUI.table([
              { label: 'Waktu', render: function (r) { return MklUI.fmtDateTime(r.timestamp); } },
              { label: 'Pelaku', render: function (r) { return r.actorUsername; } },
              { label: 'Aksi', render: function (r) { return r.action === 'access.denied' ? MklUI.badge(ACTION_LABELS[r.action], 'danger') : (ACTION_LABELS[r.action] || r.action); } },
              { label: 'Data', render: function (r) { return r.entityLabel || '-'; } },
              { label: 'Alasan', render: function (r) { return r.reason; } },
              { label: '', className: 'col-action', render: function (r) {
                var b = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Detail');
                b.addEventListener('click', function () { showChanges(r); });
                return b;
              } }
            ], res.data.items, 'Tidak ada audit log yang cocok.'));
            results.appendChild(MklUI.pagination(res.data, function (p) { state.page = p; load(); }));
          });
        }
        load();
      }
    }
  });
})();
