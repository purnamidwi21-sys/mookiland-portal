/*
 * Halaman ringkasan HR: Kontrak (yang akan berakhir), BPJS (status semua
 * karyawan), dan Template Kontrak (Word dengan kolom isian).
 */
(function () {
  'use strict';
  var h = MklUI.h;

  // ================================================================== Kontrak

  MklNav.register('/kontrak', {
    title: 'Kontrak',
    perm: 'contract.manage',
    menu: { label: 'Kontrak', order: 14, section: 'SDM' },
    render: function (root) {
      var state = { within: '60' };
      var results = h('div', { class: 'results' });
      var stats = h('div');
      var filter = MklUI.selectField({ label: 'Tampilkan', name: 'within', value: '60', options: [
        { value: '30', label: 'Berakhir dalam 30 hari' }, { value: '60', label: 'Berakhir dalam 60 hari' },
        { value: '', label: 'Semua karyawan aktif' }] });
      filter.input.addEventListener('change', function () { state.within = filter.input.value; load(); });
      root.appendChild(MklUI.pageHeader('Kontrak', 'Kontrak aktif dan yang akan berakhir. Kontrak dibuat dan dikelola di halaman data masing-masing karyawan.'));
      root.appendChild(stats);
      root.appendChild(MklUI.card(null, [h('div', { class: 'filters' }, filter.wrap), results]));

      function load() {
        MklUI.clear(results).appendChild(MklUI.loadingState('Memuat kontrak...'));
        MklApi.call('hr.contracts.overview', { within: state.within ? Number(state.within) : undefined }).then(function (res) {
          MklUI.clear(results);
          MklUI.clear(stats);
          if (!res.success) { results.appendChild(MklUI.errorState(res, load)); return; }
          var c = res.data.counts;
          stats.appendChild(h('div', { class: 'stats stats-page' },
            statBox('Punya kontrak aktif', c.active), statBox('Belum ada kontrak aktif', c.none, c.none ? 'warning' : null),
            statBox('Berakhir ≤ 30 hari', c.within30, c.within30 ? 'warning' : null)));
          results.appendChild(MklUI.table([
            { label: 'Karyawan', render: function (i) { return h('a', { href: '#/karyawan/' + i.employeeId }, i.fullName); } },
            { label: 'Jabatan', render: function (i) { return i.positionName; } },
            { label: 'Kontrak', render: function (i) { return i.contract ? i.contract.contractNo + ' · ' + i.contract.contractTypeLabel : (i.hasDraft ? 'Ada draf' : 'Belum ada'); } },
            { label: 'Periode', render: function (i) { return i.contract ? MklEmployeeExtras.period(i.contract) : ''; } },
            { label: 'Status', render: function (i) { return i.contract ? MklEmployeeExtras.statusBadgeContract(i.contract) : MklUI.badge(i.hasDraft ? 'Draf' : 'Tidak ada', i.hasDraft ? 'info' : 'warning'); } },
            { label: 'Aksi', className: 'col-action', render: function (i) { return h('a', { class: 'btn btn-secondary btn-small', href: '#/karyawan/' + i.employeeId }, 'Kelola'); } }
          ], res.data.items, state.within ? 'Tidak ada kontrak yang berakhir dalam ' + state.within + ' hari.' : 'Belum ada karyawan aktif.'));
          results.appendChild(h('p', { class: 'muted small' }, 'Pengingat otomatis dikirim ke HR lewat lonceng notifikasi ' + res.data.reminderDays.join(', ') + ' hari sebelum kontrak berakhir.'));
        });
      }
      load();
    }
  });

  function statBox(label, value, variant) {
    return h('div', { class: 'stat' + (variant ? ' stat-' + variant : '') }, h('span', { class: 'stat-value' }, String(value)), h('span', { class: 'stat-label' }, label));
  }

  // ================================================================== BPJS

  MklNav.register('/bpjs', {
    title: 'BPJS',
    perm: 'bpjs.manage',
    menu: { label: 'BPJS', order: 15, section: 'SDM' },
    render: function (root) {
      var results = h('div', { class: 'results' });
      var stats = h('div');
      var state = { filter: '' };
      var filter = MklUI.selectField({ label: 'Tampilkan', name: 'filter', value: '', options: [
        { value: '', label: 'Semua karyawan aktif' }, { value: 'notactive', label: 'Belum aktif di salah satu program' }] });
      filter.input.addEventListener('change', function () { state.filter = filter.input.value; load(); });
      root.appendChild(MklUI.pageHeader('BPJS', 'Status kepesertaan BPJS Kesehatan dan Ketenagakerjaan. Ubah data di halaman masing-masing karyawan.'));
      root.appendChild(stats);
      root.appendChild(MklUI.card(null, [h('div', { class: 'filters' }, filter.wrap), results]));
      function badgeFor(s) { return MklUI.badge(s.statusLabel, s.status === 'aktif' ? 'success' : (s.status === 'nonaktif' ? 'muted' : 'warning')); }
      function load() {
        MklUI.clear(results).appendChild(MklUI.loadingState('Memuat data BPJS...'));
        MklApi.call('hr.bpjs.summary', {}).then(function (res) {
          MklUI.clear(results);
          MklUI.clear(stats);
          if (!res.success) { results.appendChild(MklUI.errorState(res, load)); return; }
          var c = res.data.counts;
          stats.appendChild(h('div', { class: 'stats stats-page' },
            statBox('Kesehatan aktif', c.kesehatan.aktif || 0), statBox('Kesehatan belum aktif', res.data.items.length - (c.kesehatan.aktif || 0), (res.data.items.length - (c.kesehatan.aktif || 0)) ? 'warning' : null),
            statBox('Ketenagakerjaan aktif', c.ketenagakerjaan.aktif || 0), statBox('Ketenagakerjaan belum aktif', res.data.items.length - (c.ketenagakerjaan.aktif || 0), (res.data.items.length - (c.ketenagakerjaan.aktif || 0)) ? 'warning' : null)));
          var items = res.data.items.filter(function (i) { return !state.filter || i.kesehatan.status !== 'aktif' || i.ketenagakerjaan.status !== 'aktif'; });
          results.appendChild(MklUI.table([
            { label: 'Karyawan', render: function (i) { return h('a', { href: '#/karyawan/' + i.employeeId }, i.fullName); } },
            { label: 'Jabatan', render: function (i) { return i.positionName; } },
            { label: 'Kesehatan', render: function (i) { return badgeFor(i.kesehatan); } },
            { label: 'Ketenagakerjaan', render: function (i) { return badgeFor(i.ketenagakerjaan); } },
            { label: 'Aksi', className: 'col-action', render: function (i) { return h('a', { class: 'btn btn-secondary btn-small', href: '#/karyawan/' + i.employeeId }, 'Kelola'); } }
          ], items, 'Semua karyawan aktif sudah terdaftar di kedua program.'));
        });
      }
      load();
    }
  });

  // ================================================================== Template kontrak

  MklNav.register('/template-kontrak', {
    title: 'Template Kontrak',
    perm: ['template.manage', 'contract.manage'],
    menu: { label: 'Template Kontrak', order: 16, section: 'SDM' },
    render: function (root) {
      var area = h('div');
      root.appendChild(MklUI.pageHeader('Template Kontrak', 'File Word (.docx) yang diisi otomatis saat HR menekan Buat PDF dari Template.'));
      root.appendChild(area);
      function load() {
        MklUI.clear(area).appendChild(MklUI.loadingState('Memuat template...'));
        Promise.all([MklApi.call('hr.templates.list', {}), MklLookups.load()]).then(function (out) {
          var res = out[0];
          var lk = out[1];
          MklUI.clear(area);
          if (!res.success) { area.appendChild(MklUI.errorState(res, load)); return; }
          var actions = [];
          if (res.data.canManage) {
            var up = h('button', { class: 'btn btn-primary', type: 'button' }, 'Unggah Template');
            up.addEventListener('click', function () { openUpload(lk, load); });
            actions.push(up);
          }
          area.appendChild(MklUI.card('Template', [
            MklUI.table([
              { label: 'Jenis kontrak', render: function (t) { return t.contractTypeLabel; } },
              { label: 'Nama', render: function (t) { return t.name; } },
              { label: 'Versi', render: function (t) { return String(t.version); } },
              { label: 'Status', render: function (t) { return t.status === 'active' ? MklUI.badge('Dipakai', 'success') : MklUI.badge('Versi lama', 'muted'); } },
              { label: 'Diunggah', render: function (t) { return MklUI.fmtDateTime(t.uploadedAt); } },
              { label: 'Kolom isian', render: function (t) { return String(t.tokens.length); } }
            ], res.data.items, 'Belum ada template. Tanpa template, kontrak tetap bisa dicatat dan PDF bertanda tangan diunggah manual.'),
            actions.length ? h('div', { class: 'form-actions' }, actions) : null
          ]));
          area.appendChild(MklUI.card('Kolom isian yang bisa dipakai', [
            h('p', { class: 'muted small' }, 'Ketik kolom isian di dokumen Word persis seperti di bawah, termasuk tanda kurung kurawal dan huruf besar. Satu template berlaku untuk satu jenis kontrak; mengunggah template baru untuk jenis yang sama menggantikan versi lama.'),
            MklUI.table([
              { label: 'Kolom isian', render: function (t) { return h('code', null, t.token); } },
              { label: 'Diisi dengan', render: function (t) { return t.description; } }
            ], res.data.tokens)
          ]));
        });
      }
      load();
    }
  });

  function openUpload(lk, reload) {
    var type = MklUI.selectField({ label: 'Jenis kontrak', name: 'contractType', required: true, value: 'harian', options: MklLookups.options(lk, 'employment_type') });
    var name = MklUI.field({ label: 'Nama template', name: 'name', required: true, maxLength: 100, value: 'Perjanjian Pekerja Harian Masa Pelatihan' });
    var file = MklUI.fileField({ label: 'File Word (.docx)', name: 'file', accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document', required: true, hint: 'Maksimal 5 MB. Isi template menjadi tanggung jawab Mookiland; [Perlu konfirmasi HR/penasihat hukum].' });
    MklEmployeeExtras.formModal({
      title: 'Unggah Template Kontrak', submitLabel: 'Unggah', busyLabel: 'Memeriksa template...',
      fields: [type, name, file],
      collect: function () { return { contractType: type.input.value, name: name.input.value.trim() }; },
      send: function (p) {
        return MklEmployeeExtras.pickFile(file.input, 'file', /\.docx$/i).then(function (f) {
          if (f.error) return { success: false, message: 'Periksa file.', details: { fields: f.error } };
          return MklApi.call('hr.templates.upload', { contractType: p.contractType, name: p.name, fileName: f.fileName, base64: f.base64 });
        });
      },
      done: function (res) { MklUI.toast(res.message, 'success'); reload(); }
    });
  }
})();
