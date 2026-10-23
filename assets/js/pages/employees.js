/*
 * Halaman Karyawan: daftar, detail, tambah/ubah, status, data identitas,
 * akun portal karyawan (satu per satu dan massal).
 *
 * Catatan: file ini dimuat SETELAH employee-import.js dan positions.js agar
 * alamat #/karyawan/impor dan #/karyawan/jabatan tidak dianggap ID karyawan.
 *
 * Data yang tampil sudah disaring server sesuai role:
 *   HR (employee.manage)       : lengkap
 *   Payroll/Manajemen          : data kepegawaian dasar
 *   Supervisor                 : data dasar anggota timnya saja
 */
(function () {
  'use strict';
  var h = MklUI.h;
  var READ_PERMS = ['employee.manage', 'employee.read.all', 'employee.read.team'];
  var ACCOUNT_PERMS = ['employee.account.manage', 'user.manage', 'user.manage.privileged'];

  function canManage() { return MklState.can('employee.manage'); }

  /** Mengambil semua karyawan (beberapa halaman sekaligus). */
  function fetchAll(filter) {
    var items = [];
    function page(n) {
      var p = { status: (filter && filter.status) || 'active', page: n, pageSize: 100 };
      return MklApi.call('hr.employees.list', p).then(function (res) {
        if (!res.success) return res;
        items = items.concat(res.data.items);
        if (n < res.data.totalPages) return page(n + 1);
        return { success: true, data: { items: items } };
      });
    }
    return page(1);
  }

  function missingBadge(v) {
    if (!v.missing) return null;
    return v.missing.length ? MklUI.badge(v.missing.length + ' data kurang', 'warning') : MklUI.badge('Lengkap', 'success');
  }

  function accountBadge(v) {
    if (v.account === undefined) return null;
    if (!v.account) return MklUI.badge('Belum ada akun', 'muted');
    return MklUI.badge(v.account.username, v.account.status === 'active' ? 'info' : 'muted');
  }

  function formError(form, slot, res) {
    if (!MklUI.showFieldErrors(form, res)) slot.appendChild(MklUI.alertBox('error', res.message));
  }

  // ================================================================== daftar

  MklNav.register('/karyawan', {
    title: 'Karyawan',
    perm: READ_PERMS,
    menu: { label: 'Karyawan', order: 12, section: 'SDM' },
    render: function (root) {
      var full = canManage();
      var state = { q: '', status: 'active', positionId: '', incomplete: false, page: 1 };
      var results = h('div', { class: 'results' });
      var lookupData = { lookups: {}, positions: [] };

      var search = MklUI.field({ label: 'Cari nama atau ID', name: 'q', maxLength: 60 });
      var status = MklUI.selectField({ label: 'Status', name: 'status', value: 'active', options: [
        { value: 'active', label: 'Masih bekerja' }, { value: 'inactive', label: 'Sudah keluar' }, { value: 'all', label: 'Semua' }] });
      var position = MklUI.selectField({ label: 'Jabatan', name: 'positionId', options: [{ value: '', label: 'Semua jabatan' }], value: '' });
      var incomplete = full ? MklUI.checkboxField({ label: 'Hanya yang datanya belum lengkap', name: 'incomplete' }) : null;
      var apply = h('button', { class: 'btn btn-secondary', type: 'submit' }, 'Tampilkan');
      var filters = h('form', { class: 'filters', novalidate: true, role: 'search' },
        search.wrap, status.wrap, position.wrap, incomplete ? incomplete.wrap : null, h('div', { class: 'filters-actions' }, apply));
      filters.addEventListener('submit', function (e) {
        e.preventDefault();
        state.q = search.input.value.trim();
        state.status = status.input.value;
        state.positionId = position.input.value;
        state.incomplete = incomplete ? incomplete.input.checked : false;
        state.page = 1;
        load();
      });

      var actions = [];
      if (full) {
        var addBtn = h('button', { class: 'btn btn-primary', type: 'button' }, 'Tambah Karyawan');
        addBtn.addEventListener('click', function () { openEmployeeForm(null, function (id) { MklNav.go('/karyawan/' + id); }); });
        actions.push(addBtn);
        actions.push(h('a', { class: 'btn btn-secondary', href: '#/karyawan/impor' }, 'Impor dari Excel'));
      }
      if (MklState.canAny(ACCOUNT_PERMS) && MklState.canAny(READ_PERMS) && full) {
        var bulkBtn = h('button', { class: 'btn btn-secondary', type: 'button' }, 'Buat Akun Massal');
        bulkBtn.addEventListener('click', openBulkAccounts);
        actions.push(bulkBtn);
      }
      var subtitle = full ? 'Data kepegawaian seluruh karyawan.'
        : (MklState.canAny(['employee.read.all']) ? 'Data kepegawaian dasar seluruh karyawan.' : 'Data dasar anggota tim Anda.');
      root.appendChild(MklUI.pageHeader('Karyawan', subtitle, actions.length ? actions : null));
      root.appendChild(MklUI.card(null, [filters, results]));

      function load() {
        MklUI.clear(results).appendChild(MklUI.loadingState('Memuat data karyawan...'));
        MklApi.call('hr.employees.list', {
          q: state.q, status: state.status, positionId: state.positionId || undefined,
          incomplete: state.incomplete || undefined, page: state.page, pageSize: 25
        }).then(function (res) {
          MklUI.clear(results);
          if (!res.success) { results.appendChild(MklUI.errorState(res, load)); return; }
          var cols = [
            { label: 'ID', render: function (v) { return h('a', { href: '#/karyawan/' + v.employeeId }, v.employeeId); } },
            { label: 'Nama', render: function (v) { return h('span', null, v.fullName, h('br'), h('span', { class: 'muted small' }, v.nickname)); } },
            { label: 'Jabatan', render: function (v) { return v.positionName; } },
            { label: 'Tanggal masuk', render: function (v) { return v.joinDate ? MklUI.fmtDate(v.joinDate) : ''; } },
            { label: 'Masa kerja', render: function (v) { return v.tenure; } },
            { label: 'Status', render: MklLookups.statusBadge }
          ];
          if (full) {
            cols.push({ label: 'Akun', render: accountBadge });
            cols.push({ label: 'Kelengkapan', render: missingBadge });
          }
          cols.push({ label: 'Aksi', className: 'col-action', render: function (v) { return h('a', { class: 'btn btn-secondary btn-small', href: '#/karyawan/' + v.employeeId }, full ? 'Kelola' : 'Lihat'); } });
          var empty = state.q || state.positionId || state.incomplete ? 'Tidak ada karyawan yang cocok dengan filter.'
            : (full ? 'Belum ada data karyawan. Tekan Tambah Karyawan atau Impor dari Excel.' : 'Belum ada data karyawan yang bisa Anda lihat.');
          results.appendChild(MklUI.table(cols, res.data.items, empty));
          results.appendChild(MklUI.pagination(res.data, function (p) { state.page = p; load(); }));
        });
      }

      MklLookups.load().then(function (data) {
        lookupData = data;
        MklLookups.positionOptions(data).forEach(function (o) { position.input.appendChild(h('option', { value: o.value }, o.label)); });
        load();
      });

      // ------------------------------------------------------------ akun massal
      function openBulkAccounts() {
        var body = h('div', { class: 'stack' }, MklUI.loadingState('Memeriksa karyawan yang belum punya akun...'));
        var ctl = MklUI.modal({ title: 'Buat Akun Massal', content: body, wide: true });
        fetchAll({ status: 'active' }).then(function (res) {
          MklUI.clear(body);
          if (!res.success) { body.appendChild(MklUI.alertBox('error', res.message)); return; }
          var pending = res.data.items.filter(function (v) { return !v.account; });
          if (!pending.length) {
            body.appendChild(MklUI.alertBox('success', 'Semua karyawan aktif sudah memiliki akun.'));
            return;
          }
          ctl.close();
          confirmBulk(pending);
        });
      }

      function confirmBulk(pending) {
        var list = h('ol', { class: 'compact-list' }, pending.map(function (v) {
          return h('li', null, v.fullName + ' (' + v.employeeId + (v.positionName ? ', ' + v.positionName : '') + ')');
        }));
        var content = h('div', { class: 'stack' },
          h('p', null, 'Akun dengan role Staff akan dibuat untuk ', h('strong', null, pending.length + ' karyawan'), ' berikut. Username diambil dari nama panggilan (huruf kecil).'),
          list,
          MklUI.alertBox('warning', 'Jika ada karyawan di daftar ini yang SUDAH punya akun (misalnya akun Manajer Operasional yang dibuat admin sebelumnya), batalkan dulu dan minta admin menghubungkan akun tersebut di menu Pengguna. Kalau tidak, karyawan itu akan punya dua akun.'),
          h('p', { class: 'muted small' }, 'Password sementara setiap akun hanya ditampilkan satu kali setelah proses selesai. Siapkan printer atau tempat mencatat.'));
        MklUI.modal({
          title: 'Buat Akun Massal',
          content: content,
          wide: true,
          actions: [
            { label: 'Batal', onClick: function (c) { c.close(); } },
            { label: 'Buat ' + pending.length + ' Akun', variant: 'primary', onClick: function (c) { c.close(); runBulk(pending.length); } }
          ]
        });
      }

      function runBulk(total) {
        var created = [];
        var skipped = [];
        var progress = h('p', { role: 'status' }, 'Membuat akun... 0 dari ' + total);
        var ctl = MklUI.modal({ title: 'Membuat akun', dismissible: false, content: h('div', { class: 'stack' }, MklUI.loadingState('Jangan tutup halaman ini.'), progress) });
        function step() {
          MklApi.call('hr.employees.accountsCreateBulk', { limit: 8, skipIds: skipped.map(function (s) { return s.employeeId; }) }).then(function (res) {
            if (!res.success) { ctl.close(); showBulkResult(created, skipped, res); return; }
            created = created.concat(res.data.created);
            skipped = skipped.concat(res.data.skipped);
            progress.textContent = 'Membuat akun... ' + (created.length + skipped.length) + ' dari ' + total;
            if (res.data.remaining > 0 && (res.data.created.length || res.data.skipped.length)) { step(); return; }
            ctl.close();
            showBulkResult(created, skipped, null);
          });
        }
        step();
      }

      function showBulkResult(created, skipped, error) {
        var portalUrl = window.location.origin + window.location.pathname;
        var cards = h('div', { class: 'account-cards' }, created.map(function (c) {
          return h('div', { class: 'account-card' },
            h('p', { class: 'account-card-title' }, 'Akun Mookiland Staff Portal'),
            MklUI.infoList([
              ['Nama', c.fullName],
              ['Jabatan', c.positionName],
              ['Alamat portal', portalUrl],
              ['Username', h('code', null, c.username)],
              ['Password sementara', h('code', { class: 'temp-password-sm' }, c.temporaryPassword)]
            ]),
            h('p', { class: 'small' }, 'Masuk dengan data di atas, lalu buat password baru Anda sendiri. Jangan berikan password kepada siapa pun. Simpan atau hancurkan kartu ini setelah dipakai.'));
        }));
        var content = h('div', { class: 'stack' },
          error ? MklUI.alertBox('error', 'Proses berhenti: ' + error.message + ' Akun yang sudah dibuat tercantum di bawah. Tekan Buat Akun Massal lagi untuk melanjutkan sisanya.') : null,
          created.length ? MklUI.alertBox('warning', created.length + ' akun dibuat. Password sementara hanya tampil SEKARANG. Tekan Cetak Kartu Akun, lalu berikan kartu langsung ke masing-masing karyawan (jangan lewat grup chat).') : MklUI.alertBox('info', 'Tidak ada akun baru yang dibuat.'),
          skipped.length ? h('div', { class: 'no-print' },
            h('h3', { class: 'section-title' }, 'Dilewati (' + skipped.length + ')'),
            h('ul', null, skipped.map(function (s) { return h('li', null, h('strong', null, s.fullName + ' (' + s.employeeId + '): '), s.reason); }))) : null,
          cards);
        var actions = [];
        if (created.length) {
          actions.push({ label: 'Cetak Kartu Akun', variant: 'secondary', onClick: function () { printCards(); } });
        }
        actions.push({ label: created.length ? 'Saya sudah mencetak/mencatat' : 'Tutup', variant: 'primary', onClick: function (c) { c.close(); load(); } });
        MklUI.modal({ title: 'Hasil pembuatan akun', content: content, wide: true, dismissible: false, actions: actions });
      }
    }
  });

  function printCards() {
    document.body.classList.add('print-cards');
    var done = function () { document.body.classList.remove('print-cards'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
    window.setTimeout(done, 1000);
  }

  // ================================================================== form tambah/ubah

  /**
   * emp: data karyawan (level full) untuk diubah, atau null untuk karyawan baru.
   * onSaved(employeeId) dipanggil setelah berhasil.
   */
  function openEmployeeForm(emp, onSaved) {
    var isNew = !emp;
    var body = h('div', null, MklUI.loadingState('Menyiapkan formulir...'));
    var ctl = MklUI.modal({ title: isNew ? 'Tambah Karyawan' : 'Ubah Data Karyawan', content: body, wide: true });
    Promise.all([MklLookups.load(), fetchAll({ status: 'active' })]).then(function (out) {
      var lk = out[0];
      var all = out[1];
      MklUI.clear(body);
      if (lk.error || !all.success) { body.appendChild(MklUI.alertBox('error', (lk.error || all).message)); return; }
      ctl.close();
      buildForm(lk, all.data.items);
    });

    function buildForm(lk, employees) {
      var e = emp || {};
      var ec = e.emergencyContact || {};
      var supOptions = [{ value: '', label: 'Tanpa atasan' }].concat(employees.filter(function (x) { return x.employeeId !== e.employeeId; })
        .map(function (x) { return { value: x.employeeId, label: x.fullName + ' (' + x.employeeId + (x.positionName ? ', ' + x.positionName : '') + ')' }; }));
      var F = {};
      function txt(name, label, opts) {
        opts = opts || {};
        F[name] = MklUI.field({ label: label, name: name, value: opts.value !== undefined ? opts.value : (e[name] || ''), required: opts.required, maxLength: opts.maxLength || 100, type: opts.type, hint: opts.hint, multiline: opts.multiline, inputmode: opts.inputmode, autocomplete: opts.autocomplete });
        return F[name].wrap;
      }
      function sel(name, label, options, opts) {
        opts = opts || {};
        F[name] = MklUI.selectField({ label: label, name: name, options: options, value: opts.value !== undefined ? opts.value : (e[name] || ''), required: opts.required, hint: opts.hint });
        return F[name].wrap;
      }
      var form = h('form', { class: 'stack', novalidate: true });
      var alertSlot = h('div');
      var dupSlot = h('div');
      form.appendChild(h('fieldset', { class: 'form-section' }, h('legend', null, 'Identitas'),
        h('div', { class: 'form-grid' },
          txt('fullName', 'Nama lengkap', { required: true, hint: 'Sesuai KTP.' }),
          txt('nickname', 'Nama panggilan', { required: true, maxLength: 40, hint: 'Dipakai untuk username akun.' }),
          sel('gender', 'Jenis kelamin', MklLookups.options(lk, 'gender', 'Belum diisi')),
          txt('birthPlace', 'Tempat lahir', { maxLength: 60 }),
          txt('birthDate', 'Tanggal lahir', { type: 'date' }),
          isNew && MklState.can('hr.sensitive.manage') ? txt('idNumber', 'Nomor KTP (NIK)', { maxLength: 16, inputmode: 'numeric', hint: '16 digit angka. Bisa diisi nanti.' }) : null)));
      form.appendChild(h('fieldset', { class: 'form-section' }, h('legend', null, 'Kontak'),
        h('div', { class: 'form-grid' },
          txt('phoneWa', 'Nomor HP/WhatsApp', { maxLength: 20, inputmode: 'tel', hint: 'Contoh: 081234567890' }),
          txt('personalEmail', 'Email pribadi', { type: 'email', maxLength: 100 }),
          txt('companyEmail', 'Email perusahaan', { type: 'email', maxLength: 100 })),
        txt('address', 'Alamat', { multiline: true, maxLength: 300 })));
      form.appendChild(h('fieldset', { class: 'form-section' }, h('legend', null, 'Kepegawaian'),
        h('div', { class: 'form-grid' },
          sel('positionId', 'Jabatan', MklLookups.positionOptions(lk, 'Pilih jabatan', e.positionId), { required: true, hint: 'Jabatan baru ditambahkan di halaman Jabatan.' }),
          sel('supervisorId', 'Atasan langsung', supOptions),
          txt('joinDate', 'Tanggal masuk', { type: 'date', required: true }),
          sel('employmentType', 'Jenis hubungan kerja', MklLookups.options(lk, 'employment_type', 'Belum diisi'), { hint: '[Perlu konfirmasi HR] sesuai perjanjian kerja.' }),
          isNew ? sel('employeeStatus', 'Status awal', [{ value: 'active', label: 'Aktif' }, { value: 'probation', label: 'Masa percobaan' }], { value: 'active' }) : null,
          txt('probationEndDate', 'Akhir masa percobaan', { type: 'date' }),
          txt('permanentDate', 'Tanggal pengangkatan', { type: 'date' }),
          txt('contractEndDate', 'Akhir kontrak', { type: 'date' }))));
      F['emergencyContact.name'] = MklUI.field({ label: 'Nama', name: 'emergencyContact.name', value: ec.name || '', maxLength: 80 });
      F['emergencyContact.relationship'] = MklUI.field({ label: 'Hubungan', name: 'emergencyContact.relationship', value: ec.relationship || '', maxLength: 40, hint: 'Contoh: Ibu, Suami, Kakak' });
      F['emergencyContact.phone'] = MklUI.field({ label: 'Nomor HP', name: 'emergencyContact.phone', value: ec.phone || '', maxLength: 20, inputmode: 'tel' });
      form.appendChild(h('fieldset', { class: 'form-section' }, h('legend', null, 'Kontak darurat'),
        h('div', { class: 'form-grid' }, F['emergencyContact.name'].wrap, F['emergencyContact.relationship'].wrap, F['emergencyContact.phone'].wrap)));
      if (!isNew) {
        F.reason = MklUI.field({ label: 'Alasan perubahan', name: 'reason', required: true, multiline: true, rows: 2, maxLength: 300, hint: 'Dicatat di audit log. Contoh: Pembaruan alamat sesuai KTP baru.' });
        form.appendChild(F.reason.wrap);
      }
      form.appendChild(dupSlot);
      form.appendChild(alertSlot);

      var dupConfirm = null;
      var fc = MklUI.modal({
        title: isNew ? 'Tambah Karyawan' : 'Ubah Data Karyawan: ' + e.fullName,
        content: form,
        wide: true,
        actions: [
          { label: 'Batal', onClick: function (c) { c.close(); } },
          { label: isNew ? 'Simpan Karyawan' : 'Simpan Perubahan', variant: 'primary', id: 'ok', onClick: submit }
        ]
      });
      form.addEventListener('submit', function (ev) { ev.preventDefault(); submit(fc, fc.buttons.ok); });

      var FIELDS = ['fullName', 'nickname', 'gender', 'birthPlace', 'birthDate', 'phoneWa', 'personalEmail', 'companyEmail', 'address',
        'positionId', 'supervisorId', 'joinDate', 'employmentType', 'probationEndDate', 'permanentDate', 'contractEndDate'];

      function submit(c, btn) {
        MklUI.clearFieldErrors(form);
        MklUI.clear(alertSlot);
        var payload = {};
        FIELDS.forEach(function (f) {
          var val = F[f].input.value.trim();
          if (isNew) { if (val) payload[f] = val; }
          else if (val !== String(e[f] || '')) payload[f] = val; // kosong = dikosongkan
        });
        var contact = {
          name: F['emergencyContact.name'].input.value.trim(),
          relationship: F['emergencyContact.relationship'].input.value.trim(),
          phone: F['emergencyContact.phone'].input.value.trim()
        };
        if (contact.name !== (ec.name || '') || contact.relationship !== (ec.relationship || '') || contact.phone !== (ec.phone || '')) {
          var ecPayload = {};
          Object.keys(contact).forEach(function (k) { if (contact[k]) ecPayload[k] = contact[k]; });
          payload.emergencyContact = ecPayload;
        }
        var action;
        if (isNew) {
          if (F.idNumber && F.idNumber.input.value.trim()) payload.idNumber = F.idNumber.input.value.replace(/\s/g, '');
          payload.employeeStatus = F.employeeStatus.input.value;
          if (dupConfirm && dupConfirm.input.checked) payload.confirmDuplicateName = true;
          action = 'hr.employees.create';
        } else {
          payload.employeeId = e.employeeId;
          payload.expectedVersion = Number(e.rowVersion);
          payload.reason = F.reason.input.value.trim();
          action = 'hr.employees.update';
        }
        MklUI.setBusy(btn, true, 'Menyimpan...');
        MklApi.call(action, payload).then(function (res) {
          MklUI.setBusy(btn, false);
          if (!res.success) {
            if (res.errorCode === 'CONFLICT' && res.details && res.details.duplicateName && !dupConfirm) {
              dupConfirm = MklUI.checkboxField({ label: 'Saya sudah memeriksa: ini orang yang berbeda dengan nama yang sama', name: 'confirmDuplicateName' });
              dupSlot.appendChild(MklUI.alertBox('warning', res.message));
              dupSlot.appendChild(dupConfirm.wrap);
              dupConfirm.input.focus();
              return;
            }
            formError(form, alertSlot, res);
            return;
          }
          c.close();
          MklUI.toast(res.message, 'success');
          onSaved(isNew ? res.data.employeeId : e.employeeId);
        });
      }
    }
  }

  // ================================================================== detail

  MklNav.register('/karyawan/:id', {
    title: 'Data Karyawan',
    perm: READ_PERMS,
    render: function (root, params) {
      var container = h('div');
      root.appendChild(h('p', null, h('a', { href: '#/karyawan' }, '← Kembali ke daftar Karyawan')));
      root.appendChild(container);

      function load() {
        MklUI.clear(container).appendChild(MklUI.loadingState('Memuat data karyawan...'));
        Promise.all([MklApi.call('hr.employees.get', { employeeId: params.id }), MklLookups.load()]).then(function (out) {
          MklUI.clear(container);
          if (!out[0].success) { container.appendChild(MklUI.errorState(out[0], load)); return; }
          render(out[0].data, out[1]);
        });
      }

      function render(v, lk) {
        var full = !!v.can;
        var actions = [];
        if (full) {
          var edit = h('button', { class: 'btn btn-primary', type: 'button' }, 'Ubah Data');
          edit.addEventListener('click', function () { openEmployeeForm(v, function () { load(); }); });
          var st = h('button', { class: 'btn btn-secondary', type: 'button' }, 'Ubah Status');
          st.addEventListener('click', function () { openStatus(v, lk); });
          actions.push(edit, st);
        }
        container.appendChild(MklUI.pageHeader(v.fullName, v.employeeId + ' · ' + (v.positionName || 'Jabatan belum diisi'), actions.length ? actions : null));

        if (full && v.missing && v.missing.length) {
          container.appendChild(MklUI.alertBox('warning', 'Data belum lengkap: ' + v.missing.join(', ') + '.'));
        }

        container.appendChild(MklUI.card('Kepegawaian', MklUI.infoList([
          ['Employee ID', v.employeeId],
          ['Nama panggilan', v.nickname],
          ['Jabatan', v.positionName],
          ['Atasan langsung', v.supervisorName ? v.supervisorName + ' (' + v.supervisorId + ')' : ''],
          ['Tanggal masuk', v.joinDate ? MklUI.fmtDate(v.joinDate) : ''],
          ['Masa kerja', v.tenure],
          ['Status', MklLookups.statusBadge(v)],
          ['Jenis hubungan kerja', v.employmentTypeLabel],
          ['Akhir masa percobaan', v.probationEndDate ? MklUI.fmtDate(v.probationEndDate) : ''],
          ['Tanggal pengangkatan', v.permanentDate ? MklUI.fmtDate(v.permanentDate) : ''],
          ['Akhir kontrak', v.contractEndDate ? MklUI.fmtDate(v.contractEndDate) : ''],
          full && !v.isActive ? ['Alasan status', v.statusReason] : null
        ].filter(Boolean))));

        if (!full) {
          container.appendChild(h('p', { class: 'muted small' }, 'Data pribadi, kontak, dan identitas hanya dapat dilihat HR.'));
          return;
        }

        container.appendChild(MklUI.card('Data pribadi dan kontak', MklUI.infoList([
          ['Jenis kelamin', v.genderLabel],
          ['Tempat, tanggal lahir', [v.birthPlace, v.birthDate ? MklUI.fmtDate(v.birthDate) : ''].filter(Boolean).join(', ')],
          ['Nomor HP/WhatsApp', v.phoneWa],
          ['Email pribadi', v.personalEmail],
          ['Email perusahaan', v.companyEmail],
          ['Alamat', v.address],
          ['Kontak darurat', v.emergencyContact ? [v.emergencyContact.name, v.emergencyContact.relationship ? '(' + v.emergencyContact.relationship + ')' : '', v.emergencyContact.phone].filter(Boolean).join(' ') : '']
        ])));

        if (v.sensitive) container.appendChild(sensitiveCard(v));
        container.appendChild(accountCard(v));

        container.appendChild(MklUI.card('Riwayat kepegawaian', MklUI.table([
          { label: 'Berlaku', render: function (x) { return MklUI.fmtDate(x.effectiveDate); } },
          { label: 'Perubahan', render: function (x) { return x.label; } },
          { label: 'Dari', render: function (x) { return x.from; } },
          { label: 'Menjadi', render: function (x) { return x.to; } },
          { label: 'Alasan', render: function (x) { return x.reason; } }
        ], v.history || [], 'Belum ada riwayat.')));
      }

      function sensitiveCard(v) {
        var s = v.sensitive;
        var btns = [];
        var show = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Tampilkan');
        show.addEventListener('click', function () { reveal(v); });
        btns.push(show);
        if (v.can.editSensitive) {
          var ed = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Ubah Data Identitas');
          ed.addEventListener('click', function () { openSensitive(v); });
          btns.push(ed);
        }
        return MklUI.card('Data identitas', [
          MklUI.infoList([
            ['Nomor KTP (NIK)', s.idNumberMasked ? h('span', null, s.idNumberMasked, ' ', s.idNumberValid ? null : MklUI.badge('Perlu dicek', 'warning')) : 'Belum diisi'],
            ['NPWP', s.npwpMasked || 'Belum diisi'],
            ['Status pajak (PTKP)', s.taxStatus || 'Belum diisi']
          ]),
          h('p', { class: 'muted small' }, 'Nomor ditampilkan tersamar. Menekan Tampilkan dicatat di audit log.'),
          h('div', { class: 'form-actions' }, btns)
        ]);
      }

      function reveal(v) {
        var body = h('div', { class: 'stack' }, h('p', null, 'Nomor KTP dan NPWP lengkap akan ditampilkan. Tindakan ini dicatat di audit log atas nama Anda.'));
        MklUI.modal({
          title: 'Tampilkan data identitas',
          content: body,
          actions: [
            { label: 'Batal', onClick: function (c) { c.close(); } },
            { label: 'Tampilkan', variant: 'primary', id: 'ok', onClick: function (c, btn) {
              MklUI.setBusy(btn, true);
              MklApi.call('hr.employees.revealSensitive', { employeeId: v.employeeId }).then(function (res) {
                MklUI.setBusy(btn, false);
                MklUI.clear(body);
                if (!res.success) { body.appendChild(MklUI.alertBox('error', res.message)); return; }
                btn.parentNode.removeChild(btn);
                body.appendChild(MklUI.infoList([
                  ['Nomor KTP (NIK)', h('code', null, res.data.idNumber || 'Belum diisi')],
                  ['NPWP', h('code', null, res.data.npwp || 'Belum diisi')],
                  ['Status pajak', res.data.taxStatus || 'Belum diisi']
                ]));
                body.appendChild(h('p', { class: 'muted small' }, 'Tutup jendela ini setelah selesai. Jangan memotret layar.'));
              });
            } }
          ]
        });
      }

      function openSensitive(v) {
        var form = h('form', { class: 'stack', novalidate: true });
        var ktp = MklUI.field({ label: 'Nomor KTP (NIK) baru', name: 'idNumber', maxLength: 16, inputmode: 'numeric', hint: '16 digit. Kosongkan jika tidak diubah.' });
        var npwp = MklUI.field({ label: 'NPWP baru', name: 'npwp', maxLength: 25, inputmode: 'numeric', hint: '15 atau 16 digit. Titik dan tanda minus boleh. Kosongkan jika tidak diubah.' });
        var tax = MklUI.selectField({ label: 'Status pajak (PTKP)', name: 'taxStatus', value: v.sensitive.taxStatus || '', hint: '[Perlu konfirmasi HR/konsultan pajak] TK = tidak kawin, K = kawin, angka = jumlah tanggungan.', options: [
          { value: '', label: 'Tidak diubah' }, { value: 'TK/0', label: 'TK/0' }, { value: 'TK/1', label: 'TK/1' }, { value: 'TK/2', label: 'TK/2' }, { value: 'TK/3', label: 'TK/3' },
          { value: 'K/0', label: 'K/0' }, { value: 'K/1', label: 'K/1' }, { value: 'K/2', label: 'K/2' }, { value: 'K/3', label: 'K/3' },
          { value: 'K/I/0', label: 'K/I/0' }, { value: 'K/I/1', label: 'K/I/1' }, { value: 'K/I/2', label: 'K/I/2' }, { value: 'K/I/3', label: 'K/I/3' }] });
        var reason = MklUI.field({ label: 'Alasan', name: 'reason', required: true, multiline: true, rows: 2, maxLength: 300, hint: 'Contoh: Dicocokkan dengan KTP asli.' });
        var alertSlot = h('div');
        [ktp.wrap, npwp.wrap, tax.wrap, reason.wrap, alertSlot].forEach(function (x) { form.appendChild(x); });
        var ctl = MklUI.modal({ title: 'Ubah Data Identitas', content: form, actions: [
          { label: 'Batal', onClick: function (c) { c.close(); } },
          { label: 'Simpan', variant: 'primary', id: 'ok', onClick: submit }
        ] });
        form.addEventListener('submit', function (ev) { ev.preventDefault(); submit(ctl, ctl.buttons.ok); });
        function submit(c, btn) {
          MklUI.clearFieldErrors(form);
          MklUI.clear(alertSlot);
          var p = { employeeId: v.employeeId, reason: reason.input.value.trim() };
          if (ktp.input.value.trim()) p.idNumber = ktp.input.value.replace(/\s/g, '');
          if (npwp.input.value.trim()) p.npwp = npwp.input.value.trim();
          if (tax.input.value && tax.input.value !== (v.sensitive.taxStatus || '')) p.taxStatus = tax.input.value;
          MklUI.setBusy(btn, true, 'Menyimpan...');
          MklApi.call('hr.employees.updateSensitive', p).then(function (res) {
            MklUI.setBusy(btn, false);
            if (!res.success) { formError(form, alertSlot, res); return; }
            c.close();
            MklUI.toast(res.message, 'success');
            load();
          });
        }
      }

      function openStatus(v, lk) {
        var form = h('form', { class: 'stack', novalidate: true });
        var opts = MklLookups.options(lk, 'employee_status').filter(function (o) { return o.value !== v.employeeStatus; });
        var status = MklUI.selectField({ label: 'Status baru', name: 'status', options: [{ value: '', label: 'Pilih status' }].concat(opts), value: '', required: true });
        var date = MklUI.field({ label: 'Tanggal berlaku', name: 'effectiveDate', type: 'date', required: true, value: MklUI.todayYmd() });
        var reason = MklUI.field({ label: 'Alasan', name: 'reason', required: true, multiline: true, rows: 2, maxLength: 300, hint: 'Contoh: Mengundurkan diri, surat tanggal 1 Nov 2026.' });
        var warn = h('div');
        var alertSlot = h('div');
        status.input.addEventListener('change', function () {
          MklUI.clear(warn);
          if (status.input.value && !MklLookups.isActiveStatus(lk, status.input.value)) {
            warn.appendChild(MklUI.alertBox('warning', 'Karyawan akan dianggap sudah tidak bekerja. ' + (v.account ? 'Akun portal ' + v.account.username + ' akan dinonaktifkan dan semua sesinya diakhiri (kecuali akun dengan role sensitif). ' : '') + 'Data dan riwayatnya tetap tersimpan.'));
          }
        });
        [h('p', null, 'Status sekarang: ', MklLookups.statusBadge(v)), status.wrap, date.wrap, reason.wrap, warn, alertSlot].forEach(function (x) { form.appendChild(x); });
        var ctl = MklUI.modal({ title: 'Ubah Status: ' + v.fullName, content: form, actions: [
          { label: 'Batal', onClick: function (c) { c.close(); } },
          { label: 'Simpan Status', variant: 'primary', id: 'ok', onClick: submit }
        ] });
        form.addEventListener('submit', function (ev) { ev.preventDefault(); submit(ctl, ctl.buttons.ok); });
        function submit(c, btn) {
          MklUI.clearFieldErrors(form);
          MklUI.clear(alertSlot);
          MklUI.setBusy(btn, true, 'Menyimpan...');
          MklApi.call('hr.employees.changeStatus', {
            employeeId: v.employeeId, status: status.input.value, effectiveDate: date.input.value,
            reason: reason.input.value.trim(), expectedVersion: Number(v.rowVersion)
          }).then(function (res) {
            MklUI.setBusy(btn, false);
            if (!res.success) { formError(form, alertSlot, res); return; }
            c.close();
            MklUI.toast(res.message, 'success');
            load();
          });
        }
      }

      function accountCard(v) {
        var parts = [];
        if (v.account) {
          parts.push(MklUI.infoList([
            ['Username', h('code', null, v.account.username)],
            ['Status akun', v.account.status === 'active' ? MklUI.badge('Aktif', 'success') : MklUI.badge(v.account.status === 'locked' ? 'Terkunci' : 'Nonaktif', 'muted')]
          ]));
          var btns = [];
          if (v.can.linkAccount) {
            btns.push(h('a', { class: 'btn btn-secondary btn-small', href: '#/admin/pengguna/' + v.account.userId }, 'Kelola di menu Pengguna'));
            var un = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Putus Hubungan Akun');
            un.addEventListener('click', function () {
              MklUI.confirmAction({
                title: 'Putus hubungan akun',
                message: 'Akun ' + v.account.username + ' tidak lagi terhubung dengan data ' + v.fullName + '. Akun tetap ada dan bisa dihubungkan lagi.',
                confirmLabel: 'Putus Hubungan', reasonLabel: 'Alasan', reasonRequired: true,
                onConfirm: function (reason) {
                  return MklApi.call('hr.employees.accountUnlink', { employeeId: v.employeeId, reason: reason }).then(function (res) {
                    if (res.success) { MklUI.toast(res.message, 'success'); load(); }
                    return res;
                  });
                }
              });
            });
            btns.push(un);
          } else {
            parts.push(h('p', { class: 'muted small' }, 'Reset password atau perubahan role dilakukan System Admin di menu Pengguna.'));
          }
          if (btns.length) parts.push(h('div', { class: 'form-actions' }, btns));
          return MklUI.card('Akun portal', parts);
        }
        parts.push(h('p', null, v.isActive ? 'Karyawan ini belum memiliki akun untuk masuk ke portal.' : 'Karyawan tidak aktif; akun tidak dibuat.'));
        var btns2 = [];
        if (v.isActive && v.can.createAccount) {
          var mk = h('button', { class: 'btn btn-primary btn-small', type: 'button' }, 'Buat Akun');
          mk.addEventListener('click', function () { openCreateAccount(v); });
          btns2.push(mk);
        }
        if (v.can.linkAccount) {
          var ln = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Hubungkan Akun yang Sudah Ada');
          ln.addEventListener('click', function () { openLink(v); });
          btns2.push(ln);
        } else {
          parts.push(h('p', { class: 'muted small' }, 'Jika karyawan ini sudah punya akun (dibuat admin sebelumnya), jangan buat akun baru. Minta System Admin atau Direktur menghubungkannya di menu Pengguna.'));
        }
        if (btns2.length) parts.push(h('div', { class: 'form-actions' }, btns2));
        return MklUI.card('Akun portal', parts);
      }

      function openCreateAccount(v) {
        var form = h('form', { class: 'stack', novalidate: true });
        var username = MklUI.field({ label: 'Username', name: 'username', maxLength: 32, autocapitalize: 'none', spellcheck: false,
          hint: 'Kosongkan agar dibuat otomatis dari nama panggilan "' + v.nickname + '". Huruf kecil, angka, titik, garis bawah, atau tanda minus.' });
        var alertSlot = h('div');
        form.appendChild(h('p', null, 'Akun dengan role Staff akan dibuat untuk ', h('strong', null, v.fullName), '.'));
        form.appendChild(username.wrap);
        form.appendChild(alertSlot);
        var ctl = MklUI.modal({ title: 'Buat Akun', content: form, actions: [
          { label: 'Batal', onClick: function (c) { c.close(); } },
          { label: 'Buat Akun', variant: 'primary', id: 'ok', onClick: submit }
        ] });
        form.addEventListener('submit', function (ev) { ev.preventDefault(); submit(ctl, ctl.buttons.ok); });
        function submit(c, btn) {
          MklUI.clearFieldErrors(form);
          MklUI.clear(alertSlot);
          var p = { employeeId: v.employeeId };
          if (username.input.value.trim()) p.username = username.input.value.trim();
          MklUI.setBusy(btn, true, 'Membuat...');
          MklApi.call('hr.employees.accountCreate', p).then(function (res) {
            MklUI.setBusy(btn, false);
            if (!res.success) { formError(form, alertSlot, res); return; }
            c.close();
            MklUI.tempPasswordModal(res.data.username, res.data.temporaryPassword, 'Akun berhasil dibuat.');
            load();
          });
        }
      }

      function openLink(v) {
        var form = h('form', { class: 'stack', novalidate: true });
        var username = MklUI.field({ label: 'Username akun yang sudah ada', name: 'username', required: true, maxLength: 32, autocapitalize: 'none', spellcheck: false });
        var reason = MklUI.field({ label: 'Alasan', name: 'reason', required: true, multiline: true, rows: 2, maxLength: 300, hint: 'Contoh: Akun Manajer Operasional dibuat sebelum data karyawan diimpor.' });
        var alertSlot = h('div');
        [h('p', null, 'Hubungkan akun yang sudah ada dengan data ', h('strong', null, v.fullName), '.'), username.wrap, reason.wrap, alertSlot].forEach(function (x) { form.appendChild(x); });
        var ctl = MklUI.modal({ title: 'Hubungkan Akun', content: form, actions: [
          { label: 'Batal', onClick: function (c) { c.close(); } },
          { label: 'Hubungkan', variant: 'primary', id: 'ok', onClick: submit }
        ] });
        form.addEventListener('submit', function (ev) { ev.preventDefault(); submit(ctl, ctl.buttons.ok); });
        function submit(c, btn) {
          MklUI.clearFieldErrors(form);
          MklUI.clear(alertSlot);
          MklUI.setBusy(btn, true, 'Menghubungkan...');
          MklApi.call('hr.employees.accountLink', { employeeId: v.employeeId, username: username.input.value.trim(), reason: reason.input.value.trim() }).then(function (res) {
            MklUI.setBusy(btn, false);
            if (!res.success) { formError(form, alertSlot, res); return; }
            c.close();
            MklUI.toast(res.message, 'success');
            load();
          });
        }
      }

      load();
    }
  });

  window.MklEmployeesPage = { openEmployeeForm: openEmployeeForm };
})();
