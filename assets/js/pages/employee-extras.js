/*
 * Bagian tambahan di halaman data karyawan (HR): Kontrak kerja, BPJS, Dokumen.
 * Setiap bagian hanya tampil jika pengguna memegang permission-nya; server
 * tetap memeriksa ulang setiap permintaan.
 */
(function () {
  'use strict';
  var h = MklUI.h;
  var MAX_BYTES = 5 * 1024 * 1024;

  function section(title, loader) {
    var body = h('div', null, MklUI.loadingState('Memuat ' + title.toLowerCase() + '...'));
    var card = MklUI.card(title, body);
    loader(body);
    return card;
  }

  function formModal(opts) {
    var form = h('form', { class: 'stack', novalidate: true });
    var alertSlot = h('div');
    opts.fields.forEach(function (f) { if (f) form.appendChild(f.wrap || f); });
    form.appendChild(alertSlot);
    var ctl = MklUI.modal({
      title: opts.title, content: form, wide: !!opts.wide,
      actions: [{ label: 'Batal', onClick: function (c) { c.close(); } }, { label: opts.submitLabel || 'Simpan', variant: 'primary', id: 'ok', onClick: submit }]
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });
    function submit(c, btn) {
      MklUI.clearFieldErrors(form);
      MklUI.clear(alertSlot);
      var p = opts.collect();
      if (p && p.error) { MklUI.showFieldErrors(form, { details: { fields: p.error } }); return; }
      MklUI.setBusy(btn, true, opts.busyLabel || 'Menyimpan...');
      Promise.resolve(opts.send(p)).then(function (res) {
        MklUI.setBusy(btn, false);
        if (!res.success) {
          if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message));
          return;
        }
        c.close();
        if (opts.done) opts.done(res);
      });
    }
    return ctl;
  }

  /** Membaca file dari input, memeriksa ukuran, mengembalikan Promise base64 atau {error}. */
  function pickFile(input, name, accept) {
    var file = input.files && input.files[0];
    if (!file) return Promise.resolve({ error: fieldErr(name, 'Pilih file terlebih dahulu.') });
    if (file.size > MAX_BYTES) return Promise.resolve({ error: fieldErr(name, 'Ukuran file ' + MklUI.fmtBytes(file.size) + '. Maksimal 5 MB.') });
    if (accept && !accept.test(file.name)) return Promise.resolve({ error: fieldErr(name, 'Jenis file tidak didukung.') });
    return MklUI.readFileBase64(file).then(function (b64) { return { base64: b64, fileName: file.name }; }, function () {
      return { error: fieldErr(name, 'File tidak bisa dibaca browser. Pilih ulang file.') };
    });
  }
  function fieldErr(name, msg) { var o = {}; o[name] = msg; return o; }

  function download(action, documentId, btn) {
    MklUI.setBusy(btn, true, 'Mengunduh...');
    MklApi.call(action, { documentId: documentId }).then(function (res) {
      MklUI.setBusy(btn, false);
      if (!res.success) { MklUI.toast(res.message, 'error'); return; }
      MklUI.downloadBase64(res.data.fileName, res.data.mimeType, res.data.base64);
    });
  }

  function smallBtn(label, onClick, variant) {
    var b = h('button', { class: 'btn btn-' + (variant || 'secondary') + ' btn-small', type: 'button' }, label);
    b.addEventListener('click', function () { onClick(b); });
    return b;
  }

  function statusBadgeContract(c) {
    var map = { draft: 'info', aktif: 'success', diperpanjang: 'muted', berakhir: 'muted', dibatalkan: 'muted' };
    var parts = [MklUI.badge(c.statusLabel, map[c.status] || 'neutral')];
    if (c.daysLeft !== null && c.daysLeft !== undefined) {
      if (c.daysLeft < 0) parts.push(MklUI.badge('Lewat ' + (-c.daysLeft) + ' hari', 'danger'));
      else if (c.daysLeft <= 60) parts.push(MklUI.badge('Sisa ' + c.daysLeft + ' hari', c.daysLeft <= 14 ? 'danger' : 'warning'));
    }
    return h('span', { class: 'badge-row' }, parts);
  }

  function period(c) {
    return MklUI.fmtDate(c.startDate) + ' – ' + (c.endDate ? MklUI.fmtDate(c.endDate) : 'tidak ditentukan');
  }

  // ================================================================== KONTRAK

  function contractsCard(v, reload) {
    return section('Kontrak kerja', function (body) {
      Promise.all([MklApi.call('hr.contracts.list', { employeeId: v.employeeId }), MklLookups.load()]).then(function (out) {
        var res = out[0];
        var lk = out[1];
        MklUI.clear(body);
        if (!res.success) { body.appendChild(MklUI.alertBox('error', res.message)); return; }
        var items = res.data.items;
        var templates = res.data.templates || {};
        var hasDraft = items.some(function (c) { return c.status === 'draft'; });
        var active = items.filter(function (c) { return c.status === 'aktif'; })[0] || null;
        if (!items.length) body.appendChild(h('p', { class: 'muted' }, 'Belum ada kontrak tercatat.'));
        items.forEach(function (c) {
          var acts = [];
          if (c.status === 'draft') {
            acts.push(smallBtn('Ubah', function () { openContractForm(v, lk, c, null, reload); }));
            if (templates[c.contractType]) {
              acts.push(smallBtn(c.draftDocument ? 'Buat Ulang PDF' : 'Buat PDF dari Template', function (b) { generate(c, b, reload); }, 'primary'));
            }
            if (c.draftDocument) acts.push(smallBtn('Unduh PDF untuk Ditandatangani', function (b) { download('hr.documents.download', c.draftDocument.documentId, b); }));
            acts.push(smallBtn(c.signedDocument ? 'Ganti PDF Bertanda Tangan' : 'Unggah PDF Bertanda Tangan', function () { openUploadSigned(c, reload); }));
            if (c.signedDocument) acts.push(smallBtn('Aktifkan Kontrak', function () { openActivate(c, reload); }, 'primary'));
            acts.push(smallBtn('Batalkan Draf', function () { openClose(c, reload); }));
          }
          if (c.signedDocument && c.status !== 'draft') acts.push(smallBtn('Unduh Kontrak Bertanda Tangan', function (b) { download('hr.documents.download', c.signedDocument.documentId, b); }));
          if (c.status === 'aktif') {
            if (!hasDraft) acts.push(smallBtn('Perpanjang', function () { openContractForm(v, lk, null, c, reload); }));
            acts.push(smallBtn('Akhiri Kontrak', function () { openClose(c, reload); }));
          }
          var info = [
            ['Jenis', c.contractTypeLabel],
            ['Periode', period(c)],
            ['Status', statusBadgeContract(c)],
            c.wageAmount !== null ? ['Upah', MklUI.fmtMoney(c.wageAmount) + ' ' + c.wageUnitLabel + (c.payFrequencyLabel ? ', dibayar ' + c.payFrequencyLabel.toLowerCase() : '')] : null,
            c.signedAt ? ['Ditandatangani', MklUI.fmtDate(c.signedAt)] : null,
            c.notes ? ['Catatan', c.notes] : null
          ].filter(Boolean);
          var steps = null;
          if (c.status === 'draft') {
            steps = h('ol', { class: 'contract-steps small' },
              h('li', { class: templates[c.contractType] ? (c.draftDocument ? 'done' : '') : 'skip' }, templates[c.contractType] ? 'Buat PDF dari template, unduh, dan cetak' : 'Belum ada template Word untuk ' + c.contractTypeLabel + ': siapkan kontrak di luar sistem'),
              h('li', { class: c.signedDocument ? 'done' : '' }, 'Tanda tangani, pindai (scan) menjadi PDF, lalu unggah'),
              h('li', null, 'Tekan Aktifkan Kontrak'));
          }
          body.appendChild(h('div', { class: 'contract-item' },
            h('div', { class: 'contract-head' }, h('strong', null, c.contractNo)),
            MklUI.infoList(info), steps,
            acts.length ? h('div', { class: 'form-actions' }, acts) : null));
        });
        var top = [];
        if (!hasDraft && !active) top.push(smallBtn('Buat Kontrak', function () { openContractForm(v, lk, null, null, reload); }, 'primary'));
        if (top.length && v.isActive) body.appendChild(h('div', { class: 'form-actions' }, top));
      });
    });
  }

  function openContractForm(v, lk, c, prev, reload) {
    var isNew = !c;
    var typeOpts = MklLookups.options(lk, 'employment_type');
    var type = MklUI.selectField({ label: 'Jenis kontrak', name: 'contractType', options: typeOpts, required: true, value: c ? c.contractType : (prev ? 'pkwt' : (v.employmentType || 'harian')) });
    var cdate = MklUI.field({ label: 'Tanggal kontrak', name: 'contractDate', type: 'date', value: c ? c.contractDate : MklUI.todayYmd(), hint: 'Tanggal yang tertulis di kontrak ("dibuat pada hari ... tanggal ...").' });
    var start = MklUI.field({ label: 'Tanggal mulai', name: 'startDate', type: 'date', required: true, value: c ? c.startDate : '' });
    var end = MklUI.field({ label: 'Tanggal berakhir', name: 'endDate', type: 'date', value: c ? c.endDate : '', hint: 'Wajib untuk PKWT, Harian, Paruh waktu, dan Magang.' });
    var wage = MklUI.field({ label: 'Besaran upah (Rp)', name: 'wageAmount', inputmode: 'numeric', maxLength: 12, value: c && c.wageAmount !== null ? String(c.wageAmount) : '', hint: 'Angka saja, contoh 150000.' });
    var unit = MklUI.selectField({ label: 'Satuan upah', name: 'wageUnit', value: c ? c.wageUnit : 'hari', options: [{ value: '', label: 'Belum diisi' }, { value: 'hari', label: 'Per hari kerja' }, { value: 'bulan', label: 'Per bulan' }] });
    var freq = MklUI.selectField({ label: 'Dibayar', name: 'payFrequency', value: c ? c.payFrequency : 'bulanan', options: [{ value: '', label: 'Belum diisi' }, { value: 'mingguan', label: 'Mingguan' }, { value: 'bulanan', label: 'Bulanan' }] });
    var notes = MklUI.field({ label: 'Catatan internal', name: 'notes', multiline: true, rows: 2, maxLength: 500, value: c ? c.notes : '' });
    if (prev && prev.endDate) {
      var d = new Date(prev.endDate + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1);
      start.input.value = d.toISOString().slice(0, 10);
    }
    formModal({
      title: isNew ? (prev ? 'Perpanjang Kontrak ' + prev.contractNo : 'Buat Kontrak') : 'Ubah Draf ' + c.contractNo, wide: true,
      fields: [
        h('p', { class: 'muted small' }, isNew ? 'Kontrak dibuat sebagai draf. Nomor kontrak diberikan otomatis.' : 'Hanya draf yang bisa diubah.'),
        h('div', { class: 'form-grid' }, type.wrap, cdate.wrap, start.wrap, end.wrap, wage.wrap, unit.wrap, freq.wrap), notes,
        h('p', { class: 'muted small' }, '[Perlu konfirmasi HR/penasihat hukum] Jenis kontrak dan jangka waktunya mengikuti peraturan ketenagakerjaan yang berlaku.')
      ],
      collect: function () {
        var w = wage.input.value.replace(/[.\s]/g, '');
        if (w && !/^\d+$/.test(w)) return { error: { wageAmount: 'Isi angka saja, contoh 150000.' } };
        var p = { contractType: type.input.value, startDate: start.input.value, contractDate: cdate.input.value || undefined, endDate: end.input.value || (isNew ? undefined : ''),
          notes: notes.input.value.trim() || undefined, wageUnit: unit.input.value || undefined, payFrequency: freq.input.value || undefined };
        if (w) p.wageAmount = Number(w);
        if (isNew) { p.employeeId = v.employeeId; if (prev) p.previousContractId = prev.contractId; }
        else { p.contractId = c.contractId; p.expectedVersion = Number(c.rowVersion); }
        return p;
      },
      send: function (p) { return MklApi.call(isNew ? 'hr.contracts.create' : 'hr.contracts.update', p); },
      done: function (res) {
        MklUI.toast(res.message, 'success');
        if (res.data && res.data.warnings && res.data.warnings.length) {
          MklUI.modal({ title: 'Perlu diperiksa', content: h('div', { class: 'stack' }, res.data.warnings.map(function (w) { return MklUI.alertBox('warning', w); })), actions: [{ label: 'Mengerti', variant: 'primary', onClick: function (x) { x.close(); } }] });
        }
        reload();
      }
    });
  }

  function generate(c, btn, reload) {
    MklUI.setBusy(btn, true, 'Membuat PDF...');
    MklApi.call('hr.contracts.generate', { contractId: c.contractId }).then(function (res) {
      MklUI.setBusy(btn, false);
      if (!res.success) {
        var content = h('div', { class: 'stack' }, MklUI.alertBox('error', res.message),
          res.details && res.details.missing ? h('p', null, 'Lengkapi data tersebut di halaman ini (Ubah Data, Ubah Data Identitas, atau Ubah draf kontrak), lalu tekan Buat PDF lagi.') : null);
        MklUI.modal({ title: 'PDF belum bisa dibuat', content: content, actions: [{ label: 'Tutup', variant: 'primary', onClick: function (x) { x.close(); } }] });
        return;
      }
      MklUI.toast(res.message, 'success');
      MklApi.call('hr.documents.download', { documentId: res.data.documentId }).then(function (d) {
        if (d.success) MklUI.downloadBase64(d.data.fileName, d.data.mimeType, d.data.base64);
        reload();
      });
    });
  }

  function openUploadSigned(c, reload) {
    var file = MklUI.fileField({ label: 'PDF kontrak bertanda tangan', name: 'file', accept: '.pdf,application/pdf', required: true, hint: 'Hasil pindai (scan) kontrak yang sudah ditandatangani kedua pihak. PDF, maksimal 5 MB.' });
    formModal({
      title: 'Unggah PDF Bertanda Tangan: ' + c.contractNo, submitLabel: 'Unggah', busyLabel: 'Mengunggah...',
      fields: [file, h('p', { class: 'muted small' }, 'Setelah kontrak diaktifkan, karyawan bisa mengunduh PDF ini di menu Kontrak Saya.')],
      collect: function () { return { input: file.input }; },
      send: function (p) {
        return pickFile(p.input, 'file', /\.pdf$/i).then(function (f) {
          if (f.error) return { success: false, message: 'Periksa file.', details: { fields: f.error } };
          return MklApi.call('hr.contracts.uploadSigned', { contractId: c.contractId, base64: f.base64 });
        });
      },
      done: function (res) { MklUI.toast(res.message, 'success'); reload(); }
    });
  }

  function openActivate(c, reload) {
    var signed = MklUI.field({ label: 'Tanggal ditandatangani', name: 'signedAt', type: 'date', required: true, value: MklUI.todayYmd() });
    formModal({
      title: 'Aktifkan Kontrak ' + c.contractNo, submitLabel: 'Aktifkan',
      fields: [h('p', null, 'Kontrak menjadi berlaku. Jenis hubungan kerja dan tanggal akhir kontrak di data karyawan ikut diperbarui, dan karyawan mendapat notifikasi.'), signed],
      collect: function () { return { contractId: c.contractId, signedAt: signed.input.value, expectedVersion: Number(c.rowVersion) }; },
      send: function (p) { return MklApi.call('hr.contracts.activate', p); },
      done: function (res) { MklUI.toast(res.message, 'success'); reload(); }
    });
  }

  function openClose(c, reload) {
    var draft = c.status === 'draft';
    var end = draft ? null : MklUI.field({ label: 'Tanggal berakhir', name: 'endDate', type: 'date', required: true, value: MklUI.todayYmd() });
    var reason = MklUI.field({ label: 'Alasan', name: 'reason', required: true, multiline: true, rows: 2, maxLength: 300 });
    formModal({
      title: (draft ? 'Batalkan Draf ' : 'Akhiri Kontrak ') + c.contractNo, submitLabel: draft ? 'Batalkan Draf' : 'Akhiri Kontrak',
      fields: [h('p', null, draft ? 'Draf tidak dipakai. Nomor kontraknya tetap tercatat.' : 'Kontrak ditandai berakhir. Status karyawan TIDAK berubah otomatis; jika karyawan berhenti bekerja, gunakan Ubah Status.'), end, reason],
      collect: function () { return { contractId: c.contractId, endDate: end ? end.input.value : undefined, reason: reason.input.value.trim(), expectedVersion: Number(c.rowVersion) }; },
      send: function (p) { return MklApi.call('hr.contracts.close', p); },
      done: function (res) { MklUI.toast(res.message, 'success'); reload(); }
    });
  }

  // ================================================================== BPJS

  function bpjsCard(v, reload) {
    return section('BPJS', function (body) {
      Promise.all([MklApi.call('hr.bpjs.get', { employeeId: v.employeeId }), MklLookups.load()]).then(function (out) {
        var res = out[0];
        var lk = out[1];
        MklUI.clear(body);
        if (!res.success) { body.appendChild(MklUI.alertBox('error', res.message)); return; }
        var d = res.data;
        var grid = h('div', { class: 'bpjs-grid' });
        [['kesehatan', 'BPJS Kesehatan'], ['ketenagakerjaan', 'BPJS Ketenagakerjaan']].forEach(function (pair) {
          var r = d[pair[0]];
          var rows = [['Status', r ? MklUI.badge(r.statusLabel, r.status === 'aktif' ? 'success' : (r.status === 'nonaktif' ? 'muted' : 'warning')) : MklUI.badge('Belum terdaftar', 'warning')]];
          if (r) {
            rows.push([pair[0] === 'kesehatan' ? 'Nomor kartu (JKN)' : 'Nomor KPJ', r.membershipNo ? h('code', null, r.membershipNo) : '']);
            if (pair[0] === 'kesehatan') rows.push(['Kelas rawat', r.kesClass ? 'Kelas ' + r.kesClass : '']);
            else rows.push(['Program', r.tkProgramLabels.join(', ')]);
            rows.push(['Mulai', r.startDate ? MklUI.fmtDate(r.startDate) : '']);
            if (r.endDate) rows.push(['Berakhir', MklUI.fmtDate(r.endDate)]);
            if (r.notes) rows.push(['Catatan', r.notes]);
          }
          grid.appendChild(h('div', { class: 'bpjs-box' }, h('h3', null, pair[1]), MklUI.infoList(rows),
            h('div', { class: 'form-actions' }, smallBtn('Ubah', function () { openBpjsForm(v, pair[0], pair[1], r, d.tkOptions, lk, reload); }))));
        });
        body.appendChild(grid);
        if (d.history.length) {
          body.appendChild(h('details', { class: 'faq' }, h('summary', null, 'Riwayat status BPJS'),
            MklUI.table([
              { label: 'Berlaku', render: function (x) { return MklUI.fmtDate(x.effectiveDate); } },
              { label: 'Program', render: function (x) { return x.program; } },
              { label: 'Dari', render: function (x) { return x.from; } },
              { label: 'Menjadi', render: function (x) { return x.to; } },
              { label: 'Alasan', render: function (x) { return x.reason; } }
            ], d.history)));
        }
        body.appendChild(h('p', { class: 'muted small' }, 'Iuran dan potongan BPJS dihitung di modul payroll (Tahap 4). [Perlu konfirmasi HR] Data mengikuti pendaftaran resmi di BPJS.'));
      });
    });
  }

  function openBpjsForm(v, program, label, r, tkOptions, lk, reload) {
    var status = MklUI.selectField({ label: 'Status', name: 'status', required: true, value: r ? r.status : 'proses', options: MklLookups.options(lk, 'bpjs_status') });
    var no = MklUI.field({ label: program === 'kesehatan' ? 'Nomor kartu JKN' : 'Nomor KPJ', name: 'membershipNo', inputmode: 'numeric', maxLength: 30, value: r ? r.membershipNo : '', hint: 'Angka saja. Wajib jika status Aktif.' });
    var start = MklUI.field({ label: 'Tanggal mulai', name: 'startDate', type: 'date', value: r ? r.startDate : '' });
    var end = MklUI.field({ label: 'Tanggal berakhir', name: 'endDate', type: 'date', value: r ? r.endDate : '', hint: 'Isi jika kepesertaan berhenti.' });
    var kes = program === 'kesehatan' ? MklUI.selectField({ label: 'Kelas rawat', name: 'kesClass', value: r ? r.kesClass : '', options: [{ value: '', label: 'Belum diisi' }, { value: '1', label: 'Kelas 1' }, { value: '2', label: 'Kelas 2' }, { value: '3', label: 'Kelas 3' }] }) : null;
    var boxes = [];
    var tk = null;
    if (program === 'ketenagakerjaan') {
      var chosen = r ? r.tkPrograms : ['jht', 'jkk', 'jkm', 'jp'];
      tk = h('fieldset', { class: 'checkbox-group' }, h('legend', null, 'Program yang diikuti'), tkOptions.map(function (o) {
        var c = MklUI.checkboxField({ label: o.label, name: 'tk_' + o.code, checked: chosen.indexOf(o.code) !== -1 });
        c.input.value = o.code;
        boxes.push(c.input);
        return c.wrap;
      }), h('p', { class: 'field-error', 'data-error-for': 'tkPrograms' }));
    }
    var notes = MklUI.field({ label: 'Catatan', name: 'notes', multiline: true, rows: 2, maxLength: 300, value: r ? r.notes : '' });
    var reason = MklUI.field({ label: 'Alasan perubahan', name: 'reason', required: true, multiline: true, rows: 2, maxLength: 300, hint: 'Contoh: Kartu BPJS sudah terbit.' });
    formModal({
      title: label + ': ' + v.fullName, wide: true,
      fields: [h('div', { class: 'form-grid' }, status.wrap, no.wrap, start.wrap, end.wrap, kes ? kes.wrap : null), tk, notes, reason],
      collect: function () {
        var p = { employeeId: v.employeeId, program: program, status: status.input.value, membershipNo: no.input.value.trim(),
          startDate: start.input.value, endDate: end.input.value, notes: notes.input.value.trim(), reason: reason.input.value.trim() };
        if (kes) p.kesClass = kes.input.value;
        if (tk) p.tkPrograms = boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
        if (r) p.expectedVersion = Number(r.rowVersion);
        return p;
      },
      send: function (p) { return MklApi.call('hr.bpjs.save', p); },
      done: function (res) { MklUI.toast(res.message, 'success'); reload(); }
    });
  }

  // ================================================================== DOKUMEN

  function documentsCard(v, reload) {
    return section('Dokumen', function (body) {
      Promise.all([MklApi.call('hr.documents.list', { employeeId: v.employeeId }), MklLookups.load()]).then(function (out) {
        var res = out[0];
        var lk = out[1];
        MklUI.clear(body);
        if (!res.success) { body.appendChild(MklUI.alertBox('error', res.message)); return; }
        var can = res.data.can;
        body.appendChild(MklUI.table([
          { label: 'Jenis', render: function (d) { return h('span', { class: 'badge-row' }, d.categoryLabel, d.sensitive ? MklUI.badge('Identitas', 'warning') : null); } },
          { label: 'Judul', render: function (d) { return d.title; } },
          { label: 'Diunggah', render: function (d) { return MklUI.fmtDateTime(d.uploadedAt); } },
          { label: 'Ukuran', render: function (d) { return MklUI.fmtBytes(d.sizeBytes); } },
          { label: 'Karyawan bisa lihat', render: function (d) { return d.visibleToEmployee ? 'Ya' : 'Tidak'; } },
          { label: 'Aksi', className: 'col-action', render: function (d) {
            var acts = [];
            if (!d.sensitive || can.viewSensitive) acts.push(smallBtn('Unduh', function (b) { download('hr.documents.download', d.documentId, b); }));
            if (d.category !== 'kontrak' && (!d.sensitive || can.uploadSensitive)) acts.push(smallBtn('Arsipkan', function () { openArchive(d, reload); }));
            return h('span', { class: 'badge-row' }, acts);
          } }
        ], res.data.items, 'Belum ada dokumen.'));
        var up = smallBtn('Unggah Dokumen', function () { openUpload(v, lk, can, reload); }, 'primary');
        body.appendChild(h('div', { class: 'form-actions' }, up));
        body.appendChild(h('p', { class: 'muted small' }, 'File disimpan di Google Drive privat milik sistem dan hanya bisa diunduh lewat portal. Dokumen identitas (KTP, KK, NPWP) hanya bisa dibuka HR, dan setiap pembukaan tercatat.'));
      });
    });
  }

  function openUpload(v, lk, can, reload) {
    var cats = ((lk.lookups || {}).document_category || []).filter(function (c) {
      return !(c.meta && c.meta.system) && (!(c.meta && c.meta.sensitive) || can.uploadSensitive);
    }).map(function (c) { return { value: c.code, label: c.label }; });
    var cat = MklUI.selectField({ label: 'Jenis dokumen', name: 'category', required: true, options: [{ value: '', label: 'Pilih jenis' }].concat(cats), value: '' });
    var title = MklUI.field({ label: 'Judul (opsional)', name: 'title', maxLength: 100, hint: 'Contoh: Ijazah SMA, Sertifikat Barista 2025.' });
    var vis = MklUI.checkboxField({ label: 'Karyawan bisa melihat dan mengunduh dokumen ini', name: 'visibleToEmployee', checked: true });
    var file = MklUI.fileField({ label: 'File', name: 'file', accept: '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png', required: true, hint: 'PDF, JPG, atau PNG. Maksimal 5 MB.' });
    formModal({
      title: 'Unggah Dokumen: ' + v.fullName, submitLabel: 'Unggah', busyLabel: 'Mengunggah...',
      fields: [cat, title, file, vis],
      collect: function () {
        if (!cat.input.value) return { error: { category: 'Pilih jenis dokumen.' } };
        return { category: cat.input.value, title: title.input.value.trim(), visible: vis.input.checked };
      },
      send: function (p) {
        return pickFile(file.input, 'file', /\.(pdf|jpe?g|png)$/i).then(function (f) {
          if (f.error) return { success: false, message: 'Periksa file.', details: { fields: f.error } };
          return MklApi.call('hr.documents.upload', { employeeId: v.employeeId, category: p.category, title: p.title || undefined, visibleToEmployee: p.visible, base64: f.base64 });
        });
      },
      done: function (res) { MklUI.toast(res.message, 'success'); reload(); }
    });
  }

  function openArchive(d, reload) {
    MklUI.confirmAction({
      title: 'Arsipkan dokumen', message: '"' + d.title + '" tidak tampil lagi di daftar. File tidak dihapus dan tetap tercatat.',
      confirmLabel: 'Arsipkan', reasonLabel: 'Alasan', reasonRequired: true,
      onConfirm: function (reason) {
        return MklApi.call('hr.documents.archive', { documentId: d.documentId, reason: reason }).then(function (res) {
          if (res.success) { MklUI.toast(res.message, 'success'); reload(); }
          return res;
        });
      }
    });
  }

  // ================================================================== pemasangan

  window.MklEmployeeExtras = {
    /** Menambahkan kartu Kontrak, BPJS, dan Dokumen sesuai hak akses. */
    render: function (container, v, reloadPage) {
      if (MklState.can('contract.manage')) container.appendChild(contractsCard(v, reloadPage));
      if (MklState.can('bpjs.manage')) container.appendChild(bpjsCard(v, reloadPage));
      if (MklState.can('contract.manage')) container.appendChild(documentsCard(v, reloadPage));
    },
    download: download,
    pickFile: pickFile,
    formModal: formModal,
    statusBadgeContract: statusBadgeContract,
    period: period
  };
})();
