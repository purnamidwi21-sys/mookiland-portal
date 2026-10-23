/*
 * Impor data karyawan dari Excel (.xlsx) atau CSV.
 * Langkah: 1) pilih file, 2) periksa pratinjau dan pilih atasan, 3) impor.
 * Pratinjau tidak menyimpan apa pun. File tidak disimpan di server.
 */
(function () {
  'use strict';
  var h = MklUI.h;
  var MAX_BYTES = 5 * 1024 * 1024;

  function readAsBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var s = String(reader.result || '');
        resolve(s.slice(s.indexOf(',') + 1));
      };
      reader.onerror = function () { reject(reader.error); };
      reader.readAsDataURL(file);
    });
  }

  function stepper(active) {
    var steps = ['Pilih file', 'Periksa data', 'Selesai'];
    return h('ol', { class: 'stepper', 'aria-label': 'Langkah impor' }, steps.map(function (s, i) {
      var n = i + 1;
      return h('li', { class: 'stepper-item' + (n === active ? ' is-active' : '') + (n < active ? ' is-done' : ''), 'aria-current': n === active ? 'step' : null },
        h('span', { class: 'stepper-num' }, String(n)), h('span', null, s));
    }));
  }

  MklNav.register('/karyawan/impor', {
    title: 'Impor Karyawan',
    perm: 'employee.manage',
    render: function (root) {
      root.appendChild(h('p', null, h('a', { href: '#/karyawan' }, '← Kembali ke daftar Karyawan')));
      root.appendChild(MklUI.pageHeader('Impor Karyawan dari Excel', 'Menambahkan banyak karyawan sekaligus dari file Excel (.xlsx) atau CSV.'));
      var area = h('div');
      root.appendChild(area);
      showPick();

      // ------------------------------------------------------------ langkah 1
      function showPick(message) {
        MklUI.clear(area);
        area.appendChild(stepper(1));
        var input = h('input', { type: 'file', id: 'import-file', name: 'file', class: 'input', accept: '.xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv' });
        var alertSlot = h('div');
        var btn = h('button', { class: 'btn btn-primary', type: 'submit' }, 'Periksa File');
        var form = h('form', { class: 'stack', novalidate: true },
          h('div', { class: 'field' }, h('label', { for: 'import-file' }, 'File karyawan'), input,
            h('p', { class: 'hint' }, 'Format .xlsx atau .csv, maksimal 5 MB dan 300 baris. File .xls lama: buka di Excel lalu Simpan Sebagai .xlsx.'),
            h('p', { class: 'field-error', 'data-error-for': 'file' })),
          alertSlot,
          h('div', { class: 'form-actions' }, btn));
        if (message) alertSlot.appendChild(MklUI.alertBox('error', message));
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          MklUI.clearFieldErrors(form);
          MklUI.clear(alertSlot);
          var file = input.files && input.files[0];
          if (!file) { MklUI.showFieldErrors(form, { details: { fields: { file: 'Pilih file terlebih dahulu.' } } }); return; }
          if (!/\.(xlsx|csv)$/i.test(file.name)) { MklUI.showFieldErrors(form, { details: { fields: { file: 'Gunakan file .xlsx atau .csv.' } } }); return; }
          if (file.size > MAX_BYTES) { MklUI.showFieldErrors(form, { details: { fields: { file: 'Ukuran file ' + MklUI.fmtBytes(file.size) + '. Maksimal 5 MB.' } } }); return; }
          MklUI.setBusy(btn, true, 'Membaca file...');
          readAsBase64(file).then(function (b64) {
            return MklApi.call('hr.employees.importPreview', { fileName: file.name, mimeType: file.type || '', base64: b64 });
          }, function () {
            return { success: false, message: 'File tidak bisa dibaca oleh browser. Coba pilih ulang file.' };
          }).then(function (res) {
            MklUI.setBusy(btn, false);
            if (!res.success) {
              if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message));
              return;
            }
            showPreview(res.data);
          });
        });
        area.appendChild(MklUI.card('1. Pilih file', [
          h('div', { class: 'note' },
            h('strong', null, 'Kolom yang dikenali (judul kolom di baris pertama tabel):'),
            h('ul', null,
              h('li', null, 'Wajib: Nama Lengkap'),
              h('li', null, 'Dianjurkan: Nama Panggilan, Jabatan, Tanggal Mulai Bekerja (atau Tanggal Masuk)'),
              h('li', null, 'Opsional: Tanggal Lahir, Tempat Lahir, No. KTP (atau NIK), Email, No HP, Jenis Kelamin, Alamat'))),
          h('p', { class: 'muted small' }, 'Kolom lain diabaikan. Baris yang namanya atau nomor KTP-nya sudah ada di sistem otomatis dilewati, jadi file yang sama aman diimpor ulang.'),
          form
        ]));
      }

      // ------------------------------------------------------------ langkah 2
      function showPreview(p) {
        MklUI.clear(area);
        area.appendChild(stepper(2));
        area.appendChild(MklUI.card('Ringkasan', [
          MklUI.infoList([
            ['File', p.fileName + (p.sheetName ? ' (sheet ' + p.sheetName + ')' : '')],
            ['Baris data', String(p.counts.total)],
            ['Akan ditambahkan', h('strong', null, p.counts.create + ' karyawan')],
            ['Dilewati', String(p.counts.skip)],
            ['Perlu dilengkapi setelah impor', p.counts.withWarnings + ' karyawan'],
            ['Kolom dipakai', p.mapped.map(function (m) { return m.header + ' → ' + m.label; }).join('; ')],
            ['Kolom diabaikan', p.ignored.length ? p.ignored.join('; ') : 'Tidak ada'],
            ['Jabatan baru', p.newPositions.length ? p.newPositions.join(', ') : 'Tidak ada']
          ])
        ]));

        var rowsTable = MklUI.table([
          { label: 'Baris', render: function (r) { return String(r.rowNumber); } },
          { label: 'Hasil', render: function (r) { return r.action === 'create' ? MklUI.badge('Ditambahkan', 'success') : MklUI.badge('Dilewati', 'danger'); } },
          { label: 'Nama lengkap', render: function (r) { return r.fullName; } },
          { label: 'Panggilan / username', render: function (r) { return r.action === 'create' ? h('span', null, r.nickname, h('br'), h('code', { class: 'small' }, r.username || '-')) : r.nickname; } },
          { label: 'Jabatan', render: function (r) { return r.positionName; } },
          { label: 'Tanggal masuk', render: function (r) { return r.joinDate ? MklUI.fmtDate(r.joinDate) : ''; } },
          { label: 'KTP', render: function (r) { return r.idNumberMasked; } },
          { label: 'Catatan', render: function (r) {
            if (!r.issues.length) return MklUI.badge('OK', 'success');
            return h('ul', { class: 'issue-list' }, r.issues.map(function (i) {
              return h('li', { class: i.level === 'error' ? 'issue-error' : 'issue-warning' }, i.message);
            }));
          } }
        ], p.rows, 'Tidak ada baris.');
        area.appendChild(MklUI.card('Data per baris', [
          h('p', { class: 'muted small' }, 'Nomor KTP ditampilkan tersamar. Username dibuat dari nama panggilan dan baru dipakai saat akun dibuat.'),
          rowsTable
        ]));

        if (!p.counts.create) {
          area.appendChild(MklUI.card(null, [
            MklUI.alertBox('info', 'Tidak ada data baru untuk diimpor.'),
            h('div', { class: 'form-actions' }, h('a', { class: 'btn btn-secondary', href: '#/karyawan' }, 'Ke daftar Karyawan'))
          ]));
          return;
        }

        var options = [{ value: '', label: 'Tanpa atasan (atur nanti)' }].concat(p.supervisorCandidates.map(function (c) {
          return { value: c.type === 'row' ? 'row:' + c.rowNumber : 'employee:' + c.employeeId, label: c.label };
        }));
        var sup = MklUI.selectField({ label: 'Atasan langsung untuk semua karyawan yang diimpor', name: 'supervisor', options: options,
          value: options.length > 1 ? options[1].value : '',
          hint: 'Biasanya Operasional Manajer. Orang yang dipilih tidak menjadi atasan dirinya sendiri. Bisa diubah per karyawan nanti.' });
        var alertSlot = h('div');
        var back = h('button', { class: 'btn btn-secondary', type: 'button' }, 'Pilih File Lain');
        back.addEventListener('click', function () { showPick(); });
        var go = h('button', { class: 'btn btn-primary', type: 'button' }, 'Impor ' + p.counts.create + ' Karyawan');
        go.addEventListener('click', function () {
          MklUI.clear(alertSlot);
          var val = sup.input.value;
          var payload = { importId: p.importId, supervisorType: 'none' };
          if (val.indexOf('row:') === 0) { payload.supervisorType = 'row'; payload.supervisorRow = Number(val.slice(4)); }
          else if (val.indexOf('employee:') === 0) { payload.supervisorType = 'employee'; payload.supervisorEmployeeId = val.slice(9); }
          MklUI.setBusy(go, true, 'Mengimpor...');
          MklApi.call('hr.employees.importCommit', payload).then(function (res) {
            MklUI.setBusy(go, false);
            if (!res.success) {
              if (res.errorCode === 'NOT_FOUND') { showPick(res.message); return; }
              alertSlot.appendChild(MklUI.alertBox('error', res.message));
              return;
            }
            MklLookups.invalidate();
            showDone(res.data, res.message);
          });
        });
        area.appendChild(MklUI.card('2. Atasan dan impor', [
          sup.wrap,
          h('p', { class: 'muted small' }, 'Employee ID (MKL-0001, dst.) diberikan berurutan mulai dari tanggal masuk paling lama. Pratinjau berlaku 30 menit.'),
          alertSlot,
          h('div', { class: 'form-actions' }, back, go)
        ]));
      }

      // ------------------------------------------------------------ langkah 3
      function showDone(d, message) {
        MklUI.clear(area);
        area.appendChild(stepper(3));
        area.appendChild(MklUI.alertBox('success', message));
        area.appendChild(MklUI.card('Karyawan yang ditambahkan', [
          MklUI.table([
            { label: 'ID', render: function (r) { return h('a', { href: '#/karyawan/' + r.employeeId }, r.employeeId); } },
            { label: 'Nama', render: function (r) { return r.fullName; } },
            { label: 'Jabatan', render: function (r) { return r.positionName; } },
            { label: 'Tanggal masuk', render: function (r) { return r.joinDate ? MklUI.fmtDate(r.joinDate) : ''; } }
          ], d.created, 'Tidak ada.'),
          d.createdPositions && d.createdPositions.length ? h('p', { class: 'muted small' }, 'Jabatan baru dibuat: ' + d.createdPositions.join(', ') + '.') : null
        ]));
        area.appendChild(MklUI.card('Langkah berikutnya', h('ol', { class: 'steps' },
          h('li', null, 'Buka daftar Karyawan, centang "Hanya yang datanya belum lengkap", lalu lengkapi data yang kurang (misalnya nomor KTP 14 digit atau tanggal masuk kosong).'),
          h('li', null, 'Jika ada karyawan yang sudah punya akun (misalnya Manajer Operasional), minta System Admin atau Direktur menghubungkan akunnya di menu Pengguna.'),
          h('li', null, 'Setelah itu tekan Buat Akun Massal di daftar Karyawan untuk membuat akun bagi karyawan lainnya.'))));
        area.appendChild(h('div', { class: 'form-actions' }, h('a', { class: 'btn btn-primary', href: '#/karyawan' }, 'Ke daftar Karyawan')));
      }
    }
  });
})();
