/*
 * Komisi penjualan kasir dari laporan POS Raptor: hasil per periode gaji,
 * impor laporan POS, tarif komisi, dan operator POS.
 * Semua hak akses dan perhitungan di server; halaman ini hanya menampilkan.
 */
(function () {
  'use strict';
  var h = MklUI.h;
  var T = window.MklTimeUI;
  var VIEW = ['payroll.prepare', 'payroll.approve'];
  var ACCEPT = '.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  function money(n) {
    var neg = n < 0, c = Math.round(Math.abs(n) * 100), frac = c % 100;
    return (neg ? '− ' : '') + MklUI.fmtMoney(Math.floor(c / 100)) + (frac ? ',' + (frac < 10 ? '0' : '') + frac : '');
  }
  function qtyText(q) { return String(Math.round(q * 100) / 100).replace('.', ','); }

  /** Bulan gaji yang memuat hari ini (periode 27–26). */
  function currentMonth() {
    var t = MklUI.todayYmd(), ym = t.slice(0, 7);
    if (+t.slice(8, 10) >= 27) { var d = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7), 1)); ym = d.toISOString().slice(0, 7); }
    return ym;
  }
  function shiftMonth(ym, n) { var d = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7) - 1 + n, 1)); return d.toISOString().slice(0, 7); }

  function empOptions(list, extra) {
    return [{ value: '', label: '— Pilih —' }].concat(extra || []).concat(list.map(function (e) { return { value: e.employeeId, label: e.fullName + ' (' + e.employeeId + ')' }; }));
  }
  function select(options, value, label) {
    var s = h('select', { class: 'input', 'aria-label': label });
    options.forEach(function (o) { s.appendChild(h('option', { value: o.value }, o.label)); });
    s.value = value || '';
    return s;
  }

  // ================================================================== rincian baris

  function linesModal(month, who, canEdit, employees, done) {
    var body = h('div', { class: 'stack' }, MklUI.loadingState('Memuat...'));
    var ctl = MklUI.modal({ title: 'Rincian komisi: ' + who.label, content: body, wide: true });
    var payload = { month: month };
    if (who.unassigned) payload.unassigned = true; else payload.employeeId = who.employeeId;
    MklApi.call('hr.commission.lines', payload).then(function (res) {
      MklUI.clear(body);
      if (!res.success) { body.appendChild(MklUI.alertBox('error', res.message)); return; }
      var items = res.data.items;
      var checks = [];
      var cols = [];
      if (canEdit) cols.push({ label: 'Pilih', className: 'col-action', render: function (l) { var c = h('input', { type: 'checkbox', 'aria-label': 'Pilih struk ' + l.receiptNo + ' ' + l.itemName }); checks.push({ c: c, l: l }); return c; } });
      cols = cols.concat([
        { label: 'Tanggal', render: function (l) { return T.dayLabel(l.date) + (l.time ? ' ' + l.time : ''); } },
        { label: 'Struk', render: function (l) { return h('span', null, h('code', null, l.receiptNo), h('br'), h('span', { class: 'muted small' }, l.pos + ' · operator ' + (l.opNo || '-'))); } },
        { label: 'Barang', render: function (l) { return h('span', null, l.itemName, h('br'), h('span', { class: 'muted small' }, l.category || '-')); } },
        { label: 'Jumlah', render: function (l) { return qtyText(l.qty) + (l.refund ? ' (refund)' : ''); } },
        { label: 'Komisi', render: function (l) { return money(l.amount); } },
        { label: 'Kasir', render: function (l) {
          var v = l.assignedBy === 'operator' ? 'success' : (l.assignedBy === 'tanpa_kasir' ? 'warning' : 'info');
          return h('span', null, l.fullName || '-', h('br'), MklUI.badge(l.assignedLabel, v), l.note ? h('span', { class: 'muted small' }, ' ' + l.note) : null);
        } }
      ]);
      body.appendChild(h('p', { class: 'muted small' }, items.length + ' baris. "Kasir yang bertugas" = struk dicetak operator bukan kasir, dialihkan ke kasir yang mencetak struk sebelumnya di POS yang sama.'));
      body.appendChild(h('div', { class: 'recap-table' }, MklUI.table(cols, items, 'Tidak ada baris komisi.')));
      if (!canEdit || !items.length) return;
      var form = h('form', { class: 'stack', novalidate: true });
      var emp = MklUI.selectField({ label: 'Pindahkan baris yang dipilih ke kasir', name: 'employeeId', required: true, options: empOptions(employees) });
      var reason = MklUI.field({ label: 'Alasan', name: 'reason', required: true, maxLength: 300, hint: 'Misalnya: struk ini dibuat saat shift kasir lain. Dicatat di audit log.' });
      var slot = h('div');
      var btn = h('button', { class: 'btn btn-primary', type: 'submit' }, 'Pindahkan');
      [emp.wrap, reason.wrap, slot, h('div', { class: 'form-actions' }, btn)].forEach(function (x) { form.appendChild(x); });
      body.appendChild(MklUI.card('Ubah kasir', form));
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        MklUI.clearFieldErrors(form); MklUI.clear(slot);
        var ids = checks.filter(function (x) { return x.c.checked; }).map(function (x) { return x.l.lineId; });
        if (!ids.length) { slot.appendChild(MklUI.alertBox('error', 'Centang dulu baris yang mau dipindahkan.')); return; }
        MklUI.setBusy(btn, true, 'Menyimpan...');
        MklApi.call('hr.commission.reassign', { lineIds: ids, employeeId: emp.input.value, reason: reason.input.value.trim() }).then(function (r) {
          MklUI.setBusy(btn, false);
          if (!r.success) { if (!MklUI.showFieldErrors(form, r)) slot.appendChild(MklUI.alertBox('error', r.message)); return; }
          ctl.close();
          MklUI.toast(r.message, 'success');
          done();
        });
      });
    });
  }

  // ================================================================== hasil per periode

  function overviewTab(area, state) {
    MklUI.clear(area).appendChild(MklUI.loadingState('Memuat...'));
    MklApi.call('hr.commission.overview', { month: state.month }).then(function (res) {
      MklUI.clear(area);
      if (!res.success) { area.appendChild(MklUI.errorState(res, function () { overviewTab(area, state); })); return; }
      var d = res.data;
      state.employees = d.employeeOptions;
      var reload = function () { overviewTab(area, state); };
      if (d.locked) area.appendChild(MklUI.alertBox('info', d.locked));
      if (!d.rateCount) area.appendChild(MklUI.alertBox('warning', 'Tarif komisi belum diisi. Buka tab Tarif Komisi, lalu impor dari file gaji Excel lama atau tambahkan kategori dan barang.'));
      if (d.unassigned.lines) area.appendChild(MklUI.alertBox('warning', d.unassigned.lines + ' baris komisi (' + money(d.unassigned.amount) + ') belum punya kasir dan belum masuk gaji siapa pun. Tekan Rincian pada baris "Belum ada kasir".'));
      var pp = d.payrollPeriod;
      var info = [['Periode', T.rangeLabel(d.from, d.to)], ['Gaji', pp ? h('a', { href: '#/penggajian/' + pp.periodId }, 'Gaji ' + d.label + ' (' + pp.statusLabel + ')') : 'Periode gaji ' + d.label + ' belum dibuat']];
      area.appendChild(MklUI.card(null, [MklUI.infoList(info),
        h('div', { class: 'stats stats-money' }, T.stat('Total komisi', money(d.total), 'info'), T.stat('Kasir', d.items.length), T.stat('Belum ada kasir', d.unassigned.lines, d.unassigned.lines ? 'warning' : null)),
        h('p', { class: 'muted small' }, 'Komisi masuk ke gaji sebagai "Komisi penjualan POS" saat Hitung Gaji / Hitung Ulang di menu Penggajian.')]));
      var rows = d.items.slice();
      if (d.unassigned.lines) rows.push({ unassigned: true, fullName: 'Belum ada kasir', lines: d.unassigned.lines, qty: null, refunds: null, amount: d.unassigned.amount });
      area.appendChild(MklUI.card('Per kasir', h('div', { class: 'recap-table money-table' }, MklUI.table([
        { label: 'Kasir', render: function (i) { return i.unassigned ? MklUI.badge(i.fullName, 'warning') : h('strong', null, i.fullName); } },
        { label: 'Baris struk', render: function (i) { return String(i.lines); } },
        { label: 'Barang', render: function (i) { return i.qty === null ? '' : qtyText(i.qty); } },
        { label: 'Refund', render: function (i) { return i.refunds ? String(i.refunds) : '-'; } },
        { label: 'Komisi', render: function (i) { return h('strong', null, money(i.amount)); } },
        { label: 'Aksi', className: 'col-action', render: function (i) {
          var b = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Rincian');
          b.addEventListener('click', function () { linesModal(state.month, i.unassigned ? { unassigned: true, label: 'belum ada kasir' } : { employeeId: i.employeeId, label: i.fullName }, d.canEdit, state.employees, reload); });
          return b;
        } }
      ], rows, 'Belum ada komisi pada periode ini. Impor laporan POS di tab Impor dari POS.'))));
      area.appendChild(MklUI.card('Laporan POS yang diimpor', h('div', { class: 'recap-table' }, MklUI.table([
        { label: 'POS', render: function (i) { return i.pos; } },
        { label: 'Tanggal', render: function (i) { return T.rangeLabel(i.from, i.to); } },
        { label: 'File', render: function (i) { return h('span', { class: 'small' }, i.fileNames); } },
        { label: 'Baris', render: function (i) { return String(i.lines); } },
        { label: 'Komisi', render: function (i) { return money(i.total); } },
        { label: 'Diimpor', render: function (i) { return MklUI.fmtDateTime(i.createdAt) + (i.importedBy ? ' oleh ' + i.importedBy : ''); } },
        { label: 'Aksi', className: 'col-action', render: function (i) {
          if (!i.canDelete) return '';
          var b = h('button', { class: 'btn btn-ghost btn-small', type: 'button' }, 'Hapus');
          b.addEventListener('click', function () {
            MklUI.confirmAction({
              title: 'Hapus impor komisi ' + i.pos,
              message: h('p', null, 'Semua baris komisi dari impor ini (' + i.lines + ' baris, ' + money(i.total) + ', ' + T.rangeLabel(i.from, i.to) + ') dihapus. Laporan yang benar bisa diimpor lagi.'),
              confirmLabel: 'Hapus', danger: true, reasonLabel: 'Alasan', reasonRequired: true,
              onConfirm: function (reason) {
                return MklApi.call('hr.commission.importDelete', { importId: i.importId, reason: reason }).then(function (r) { if (r.success) { MklUI.toast(r.message, 'success'); reload(); } return r; });
              }
            });
          });
          return b;
        } }
      ], d.imports, 'Belum ada laporan POS untuk periode ini.'))));
    });
  }

  // ================================================================== impor dari POS

  function importTab(area, state) {
    MklUI.clear(area);
    if (!MklState.can('payroll.prepare')) { area.appendChild(MklUI.alertBox('info', 'Impor laporan POS dilakukan oleh Payroll.')); return; }
    var file = MklUI.fileField({ label: 'File laporan POS (2 atau 3 file sekaligus)', name: 'files', accept: ACCEPT, hint: 'File .xls atau .xlsx dari Raptor POS, masing-masing maksimal 5 MB, untuk SATU POS (Resto atau Ticket).' });
    file.input.multiple = true;
    var slot = h('div');
    var btn = h('button', { class: 'btn btn-primary', type: 'submit' }, 'Periksa File');
    var form = h('form', { class: 'stack', novalidate: true }, file.wrap, slot, h('div', { class: 'form-actions' }, btn));
    var result = h('div');
    area.appendChild(MklUI.card('Impor laporan POS', [
      h('div', { class: 'note' }, h('ol', null,
        h('li', null, 'Di Raptor POS, pilih periode gaji (tanggal 27 sampai 26), lalu ekspor ke Excel untuk satu POS: ', h('strong', null, 'PLU Receipt Details'), ' dan ', h('strong', null, 'Receipt Number Report'), '.'),
        h('li', null, 'Boleh ditambah ', h('strong', null, 'All Receipt Number Report'), ' (per operator) agar nama operator tampil.'),
        h('li', null, 'Pilih file-file itu sekaligus di bawah, tekan Periksa File, periksa operator, lalu Simpan Komisi.'),
        h('li', null, 'Ulangi untuk POS lainnya (misalnya Resto lalu Ticket).'))),
      h('p', { class: 'muted small' }, 'File tidak disimpan di server; hanya baris barang yang punya komisi. Mengimpor ulang POS dan tanggal yang sama menggantikan impor sebelumnya. Kasir yang sudah diubah HR dipertahankan.'),
      form
    ]));
    area.appendChild(result);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      MklUI.clearFieldErrors(form); MklUI.clear(slot); MklUI.clear(result);
      var fs = Array.prototype.slice.call(file.input.files || []);
      var err = fs.length < 2 ? 'Pilih minimal 2 file: PLU Receipt Details dan Receipt Number Report.' : (fs.length > 3 ? 'Pilih paling banyak 3 file untuk satu POS.' : '');
      fs.forEach(function (f) {
        if (!err && !/\.(xls|xlsx)$/i.test(f.name)) err = f.name + ' bukan file .xls/.xlsx.';
        if (!err && f.size > 5 * 1024 * 1024) err = f.name + ' berukuran ' + MklUI.fmtBytes(f.size) + '. Maksimal 5 MB.';
      });
      if (err) { MklUI.showFieldErrors(form, { details: { fields: { files: err } } }); return; }
      MklUI.setBusy(btn, true, 'Membaca file (bisa 1 menit)...');
      Promise.all(fs.map(function (f) { return MklUI.readFileBase64(f).then(function (b) { return { fileName: f.name, base64: b }; }); })).then(function (list) {
        return MklApi.call('hr.commission.importPreview', { files: list });
      }, function () { return { success: false, message: 'File tidak bisa dibaca oleh browser. Coba pilih ulang file.' }; }).then(function (res) {
        MklUI.setBusy(btn, false);
        if (!res.success) { if (!MklUI.showFieldErrors(form, res)) slot.appendChild(MklUI.alertBox('error', res.message)); return; }
        preview(result, res.data, state, function () { MklUI.clear(result); file.input.value = ''; });
      });
    });
  }

  function summaryBlock(s) {
    var wrap = h('div', { class: 'stack' });
    if (s.locked) wrap.appendChild(MklUI.alertBox('error', s.locked));
    if (s.replaces && s.replaces.length) wrap.appendChild(MklUI.alertBox('info', 'Menggantikan impor ' + s.replaces.map(function (r) { return r.pos + ' ' + T.rangeLabel(r.from, r.to); }).join(', ') + '. Kasir yang diubah HR dipertahankan.'));
    wrap.appendChild(h('div', { class: 'stats stats-money' }, T.stat('Total komisi', money(s.total), 'info'), T.stat('Dialihkan ke kasir bertugas', s.reassigned), T.stat('Belum ada kasir', s.unassigned.lines, s.unassigned.lines ? 'warning' : null)));
    wrap.appendChild(h('div', { class: 'recap-table money-table' }, MklUI.table([
      { label: 'Kasir', render: function (p) { return p.fullName; } },
      { label: 'Baris', render: function (p) { return String(p.lines); } },
      { label: 'Barang', render: function (p) { return qtyText(p.qty); } },
      { label: 'Refund', render: function (p) { return p.refunds ? String(p.refunds) : '-'; } },
      { label: 'Komisi', render: function (p) { return h('strong', null, money(p.amount)); } }
    ], s.perEmployee, 'Belum ada komisi untuk kasir. Pilih kasir untuk operator di atas.')));
    if (s.warnings.length) wrap.appendChild(h('ul', { class: 'warning-list' }, s.warnings.map(function (w) { return h('li', null, w); })));
    return wrap;
  }

  function preview(result, p, state, reset) {
    MklUI.clear(result);
    result.appendChild(MklUI.card('Isi file', MklUI.infoList([
      ['File', h('span', null, p.files.map(function (f) { return f.label + ': ' + f.fileName; }).join(' · '))],
      ['POS', p.pos], ['Tanggal', T.rangeLabel(p.from, p.to)],
      ['Struk', String(p.counts.receipts)], ['Baris barang', p.counts.pluLines + ' (berkomisi: ' + p.counts.commissionLines + (p.counts.refunds ? ', refund: ' + p.counts.refunds : '') + ')'],
      p.counts.missingReceipts ? ['Struk tanpa operator', MklUI.badge(p.counts.missingReceipts + ' struk tidak ada di Receipt Number Report', 'warning')] : null
    ].filter(Boolean))));
    if (p.unmatchedHints.length) {
      result.appendChild(MklUI.card('Barang yang mungkin belum punya tarif', [
        h('p', { class: 'muted small' }, 'Barang berikut satu grup dengan barang berkomisi, tetapi belum ada di daftar tarif sehingga komisinya 0. Bila seharusnya berkomisi, tambahkan di tab Tarif Komisi lalu periksa file lagi.'),
        h('ul', null, p.unmatchedHints.map(function (x) { return h('li', null, x.itemName + ' (' + x.group + ', ' + x.count + ' baris)'); }))
      ], 'card-warning'));
    }
    var opts = empOptions(p.employeeOptions, [{ value: '__bukan', label: 'Bukan kasir (alihkan ke kasir yang bertugas)' }]);
    var rows = p.operators.map(function (o) {
      var v = o.role === 'bukan_kasir' ? '__bukan' : (o.employeeId || o.suggestedEmployeeId || '');
      var sel = select(opts, v, 'Kasir untuk operator ' + o.opNo);
      if (o.role === 'kasir' && o.employeeId && sel.value !== o.employeeId) { sel.appendChild(h('option', { value: o.employeeId }, o.employeeId + ' (tidak aktif)')); sel.value = o.employeeId; }
      return { o: o, sel: sel };
    });
    var sumArea = h('div');
    var alertSlot = h('div', { 'aria-live': 'polite' });
    var choice = function () {
      return rows.filter(function (r) { return r.sel.value; }).map(function (r) {
        return r.sel.value === '__bukan' ? { opNo: r.o.opNo, role: 'bukan_kasir', opName: r.o.opName } : { opNo: r.o.opNo, role: 'kasir', employeeId: r.sel.value, opName: r.o.opName };
      });
    };
    var seq = 0;
    var refresh = function () {
      var my = ++seq;
      sumArea.style.opacity = '0.5';
      MklApi.call('hr.commission.importCommit', { importId: p.importId, operators: choice(), dryRun: true }).then(function (r) {
        if (my !== seq) return;
        sumArea.style.opacity = '';
        if (!r.success) { MklUI.clear(alertSlot).appendChild(MklUI.alertBox('error', r.message)); return; }
        MklUI.clear(sumArea).appendChild(summaryBlock(r.data));
      });
    };
    rows.forEach(function (r) { r.sel.addEventListener('change', refresh); });
    result.appendChild(MklUI.card('Operator POS', [
      h('p', null, 'Pilih karyawan untuk setiap operator kasir. Operator yang bukan kasir (misalnya akun manajer) pilih "Bukan kasir": struknya dialihkan ke kasir yang mencetak struk sebelumnya di POS yang sama. Pilihan disimpan untuk impor berikutnya.'),
      h('div', { class: 'recap-table' }, MklUI.table([
        { label: 'Operator', render: function (r) { return h('span', null, h('code', null, r.o.opNo), r.o.opName ? ' ' + r.o.opName : ''); } },
        { label: 'Struk', render: function (r) { return r.o.receipts + (r.o.firstDate ? ' (' + T.rangeLabel(r.o.firstDate, r.o.lastDate) + ')' : ''); } },
        { label: 'Kasir', render: function (r) { return h('span', null, r.sel, r.o.saved ? h('span', { class: 'muted small' }, ' tersimpan') : (r.o.suggestedEmployeeId ? h('span', { class: 'muted small' }, ' saran dari nama') : null)); } }
      ], rows, ''))
    ]));
    sumArea.appendChild(summaryBlock(p));
    var save = h('button', { class: 'btn btn-primary', type: 'button' }, 'Simpan Komisi');
    var cancel = h('button', { class: 'btn btn-secondary', type: 'button' }, 'Batal');
    cancel.addEventListener('click', reset);
    result.appendChild(MklUI.card('Hasil', [sumArea, alertSlot, h('div', { class: 'form-actions' }, cancel, save)]));
    save.addEventListener('click', function () {
      MklUI.clear(alertSlot);
      MklUI.setBusy(save, true, 'Menyimpan...');
      MklApi.call('hr.commission.importCommit', { importId: p.importId, operators: choice() }).then(function (r) {
        MklUI.setBusy(save, false);
        if (!r.success) { alertSlot.appendChild(MklUI.alertBox('error', (r.details && r.details.fields && r.details.fields.operators) || r.message)); return; }
        MklUI.toast(r.message, 'success');
        var m = p.to.slice(0, 7);
        if (+p.to.slice(8, 10) >= 27) m = shiftMonth(m, 1);
        state.month = m;
        state.show('hasil');
      });
    });
  }

  // ================================================================== tarif

  function rateModal(r, modes, done) {
    var form = h('form', { class: 'stack', novalidate: true });
    var cat = MklUI.field({ label: 'Nama kategori', name: 'category', required: true, maxLength: 60, value: r ? r.category : '' });
    var amt = MklUI.field({ label: 'Komisi (Rp)', name: 'amount', required: true, inputmode: 'decimal', value: r ? String(r.amount).replace('.', ',') : '', hint: 'Boleh desimal, misalnya 3950 atau 4000. Untuk 5% dari harga, isi hasilnya (5% × 80.000 = 4000).' });
    var mode = MklUI.selectField({ label: 'Cara hitung', name: 'calcMode', options: modes.map(function (m) { return { value: m.code, label: m.label }; }), value: r ? r.calcMode : 'per_qty' });
    var active = MklUI.checkboxField({ label: 'Aktif', name: 'active', checked: r ? r.active : true, hint: 'Kategori tidak aktif: barangnya tidak mendapat komisi pada impor berikutnya.' });
    var slot = h('div');
    [cat.wrap, amt.wrap, mode.wrap, active.wrap, slot].forEach(function (x) { form.appendChild(x); });
    var ctl = MklUI.modal({ title: r ? 'Ubah kategori' : 'Tambah kategori', content: form, actions: [{ label: 'Batal', onClick: function (c) { c.close(); } }, { label: 'Simpan', variant: 'primary', id: 'ok', onClick: submit }] });
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });
    function submit(c, btn) {
      MklUI.clearFieldErrors(form); MklUI.clear(slot);
      var p = { category: cat.input.value.trim(), amount: amt.input.value.trim().replace(/\./g, ''), calcMode: mode.input.value, active: active.input.checked };
      if (r) p.rateId = r.rateId;
      MklUI.setBusy(btn, true);
      MklApi.call('hr.commission.rateSave', p).then(function (res) {
        MklUI.setBusy(btn, false);
        if (!res.success) { if (!MklUI.showFieldErrors(form, res)) slot.appendChild(MklUI.alertBox('error', res.message)); return; }
        c.close(); MklUI.toast(res.message, 'success'); done();
      });
    }
  }

  function itemModal(it, rates, done) {
    var form = h('form', { class: 'stack', novalidate: true });
    var name = MklUI.field({ label: 'Nama barang di POS', name: 'itemName', required: true, maxLength: 80, value: it ? it.itemName : '', hint: 'Tulis persis seperti di laporan PLU Receipt Details. Huruf besar/kecil tidak masalah.' });
    var cat = MklUI.selectField({ label: 'Kategori', name: 'rateId', required: true, options: [{ value: '', label: '— Pilih —' }].concat(rates.map(function (r) { return { value: r.rateId, label: r.category + ' (' + money(r.amount) + (r.calcMode === 'per_baris' ? ' per baris' : '') + ')' }; })), value: it ? it.rateId : '' });
    var slot = h('div');
    [name.wrap, cat.wrap, slot].forEach(function (x) { form.appendChild(x); });
    var ctl = MklUI.modal({ title: it ? 'Ubah barang' : 'Tambah barang', content: form, actions: [{ label: 'Batal', onClick: function (c) { c.close(); } }, { label: 'Simpan', variant: 'primary', id: 'ok', onClick: submit }] });
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });
    function submit(c, btn) {
      MklUI.clearFieldErrors(form); MklUI.clear(slot);
      var p = { itemName: name.input.value.trim(), rateId: cat.input.value };
      if (it) p.itemId = it.itemId;
      MklUI.setBusy(btn, true);
      MklApi.call('hr.commission.itemSave', p).then(function (res) {
        MklUI.setBusy(btn, false);
        if (!res.success) { if (!MklUI.showFieldErrors(form, res)) slot.appendChild(MklUI.alertBox('error', res.message)); return; }
        c.close(); MklUI.toast(res.message, 'success'); done();
      });
    }
  }

  function ratesTab(area, notice) {
    MklUI.clear(area).appendChild(MklUI.loadingState('Memuat...'));
    var reload = function () { ratesTab(area); };
    MklApi.call('hr.commission.rates', {}).then(function (res) {
      MklUI.clear(area);
      if (!res.success) { area.appendChild(MklUI.errorState(res, reload)); return; }
      if (notice) area.appendChild(MklUI.alertBox('success', notice));
      var d = res.data;
      if (d.canEdit) {
        var file = MklUI.fileField({ label: 'File gaji Excel lama', name: 'file', accept: ACCEPT, hint: 'File yang berisi sheet "Comission Rate" (tabel Category | Amount dan Category | Item).' });
        var slot = h('div');
        var btn = h('button', { class: 'btn btn-secondary', type: 'submit' }, 'Impor Tarif');
        var form = h('form', { class: 'stack', novalidate: true }, file.wrap, slot, h('div', { class: 'form-actions' }, btn));
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          MklUI.clearFieldErrors(form); MklUI.clear(slot);
          var f = file.input.files && file.input.files[0];
          if (!f) { MklUI.showFieldErrors(form, { details: { fields: { file: 'Pilih file terlebih dahulu.' } } }); return; }
          if (f.size > 5 * 1024 * 1024) { MklUI.showFieldErrors(form, { details: { fields: { file: 'Maksimal 5 MB.' } } }); return; }
          MklUI.setBusy(btn, true, 'Membaca file...');
          MklUI.readFileBase64(f).then(function (b) { return MklApi.call('hr.commission.ratesImport', { fileName: f.name, base64: b }); }).then(function (r) {
            MklUI.setBusy(btn, false);
            if (!r.success) { if (!MklUI.showFieldErrors(form, r)) slot.appendChild(MklUI.alertBox('error', r.message)); return; }
            MklUI.toast('Tarif komisi diimpor.', 'success');
            ratesTab(area, r.message);
          });
        });
        area.appendChild(MklUI.card('Impor dari file gaji Excel lama', [h('p', { class: 'muted small' }, 'Kategori dan barang ditambahkan atau diperbarui; yang sudah ada di portal tetap ada. Barang dengan kategori tanpa komisi dilewati.'), form]));
      }
      var addCat = d.canEdit ? h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Tambah Kategori') : null;
      if (addCat) addCat.addEventListener('click', function () { rateModal(null, d.modes, reload); });
      area.appendChild(MklUI.card('Kategori komisi', [
        h('div', { class: 'recap-table money-table' }, MklUI.table([
          { label: 'Kategori', render: function (r) { return h('strong', null, r.category); } },
          { label: 'Komisi', render: function (r) { return money(r.amount); } },
          { label: 'Cara hitung', render: function (r) { return r.calcModeLabel; } },
          { label: 'Barang', render: function (r) { return String(r.itemCount); } },
          { label: 'Status', render: function (r) { return r.active ? MklUI.badge('Aktif', 'success') : MklUI.badge('Tidak aktif', 'muted'); } },
          d.canEdit ? { label: 'Aksi', className: 'col-action', render: function (r) { var b = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Ubah'); b.addEventListener('click', function () { rateModal(r, d.modes, reload); }); return b; } } : null
        ].filter(Boolean), d.rates, 'Belum ada kategori komisi.')),
        addCat ? h('div', { class: 'form-actions' }, addCat) : null,
        h('p', { class: 'muted small' }, 'Perubahan tarif berlaku untuk impor berikutnya. Untuk periode yang belum diajukan, impor ulang laporan POS agar komisinya ikut berubah. [Perlu konfirmasi HR] Aturan komisi sebaiknya tertulis di peraturan perusahaan atau perjanjian kerja.')
      ]));
      var search = MklUI.field({ label: 'Cari barang', name: 'q', placeholder: 'Misalnya: TSHIRT' });
      var listArea = h('div');
      var addItem = d.canEdit ? h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Tambah Barang') : null;
      if (addItem) addItem.addEventListener('click', function () { itemModal(null, d.rates, reload); });
      var paint = function () {
        var q = search.input.value.trim().toLowerCase();
        var items = d.items.filter(function (i) { return !q || i.itemName.toLowerCase().indexOf(q) !== -1 || i.category.toLowerCase().indexOf(q) !== -1; });
        MklUI.clear(listArea).appendChild(h('div', { class: 'recap-table money-table' }, MklUI.table([
          { label: 'Barang', render: function (i) { return i.itemName; } },
          { label: 'Kategori', render: function (i) { return i.category + (i.active ? '' : ' (tidak aktif)'); } },
          { label: 'Komisi', render: function (i) { return money(i.amount); } },
          d.canEdit ? { label: 'Aksi', className: 'col-action', render: function (i) {
            var e1 = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Ubah');
            e1.addEventListener('click', function () { itemModal(i, d.rates, reload); });
            var e2 = h('button', { class: 'btn btn-ghost btn-small', type: 'button' }, 'Hapus');
            e2.addEventListener('click', function () {
              MklUI.confirmAction({ title: 'Hapus ' + i.itemName, message: h('p', null, 'Barang ini tidak lagi mendapat komisi pada impor berikutnya.'), confirmLabel: 'Hapus', danger: true,
                onConfirm: function () { return MklApi.call('hr.commission.itemRemove', { itemId: i.itemId }).then(function (r) { if (r.success) { MklUI.toast(r.message, 'success'); reload(); } return r; }); } });
            });
            return h('span', { class: 'btn-row' }, e1, e2);
          } } : null
        ].filter(Boolean), items, q ? 'Tidak ada barang yang cocok.' : 'Belum ada barang.')));
      };
      search.input.addEventListener('input', paint);
      paint();
      area.appendChild(MklUI.card('Barang berkomisi (' + d.items.length + ')', [search.wrap, listArea, addItem ? h('div', { class: 'form-actions' }, addItem) : null]));
    });
  }

  // ================================================================== operator

  function operatorsTab(area) {
    MklUI.clear(area).appendChild(MklUI.loadingState('Memuat...'));
    var reload = function () { operatorsTab(area); };
    MklApi.call('hr.commission.operators', {}).then(function (res) {
      MklUI.clear(area);
      if (!res.success) { area.appendChild(MklUI.errorState(res, reload)); return; }
      var d = res.data;
      area.appendChild(MklUI.card('Operator POS', [
        h('p', { class: 'muted small' }, 'Nomor operator (OpNo) di Receipt Number Report menentukan kasir setiap struk. Daftar ini terisi saat impor pertama.'),
        h('div', { class: 'recap-table' }, MklUI.table([
          { label: 'Operator', render: function (o) { return h('span', null, h('code', null, o.opNo), o.opName ? ' ' + o.opName : ''); } },
          { label: 'Peran', render: function (o) { return o.role === 'kasir' ? MklUI.badge('Kasir', 'success') : MklUI.badge('Bukan kasir', 'muted'); } },
          { label: 'Karyawan', render: function (o) { return o.fullName ? o.fullName + ' (' + o.employeeId + ')' : '-'; } },
          d.canEdit ? { label: 'Aksi', className: 'col-action', render: function (o) {
            var b = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Ubah');
            b.addEventListener('click', function () {
              var form = h('form', { class: 'stack', novalidate: true });
              var opts = empOptions(d.employeeOptions, [{ value: '__bukan', label: 'Bukan kasir (alihkan ke kasir yang bertugas)' }]);
              var sel = MklUI.selectField({ label: 'Kasir untuk operator ' + o.opNo, name: 'operators', options: opts, value: o.role === 'bukan_kasir' ? '__bukan' : o.employeeId });
              var slot = h('div');
              form.appendChild(sel.wrap); form.appendChild(slot);
              MklUI.modal({ title: 'Ubah operator ' + o.opNo, content: form, actions: [{ label: 'Batal', onClick: function (c) { c.close(); } }, { label: 'Simpan', variant: 'primary', onClick: function (c, btn) {
                MklUI.clear(slot);
                var v = sel.input.value;
                if (!v) { slot.appendChild(MklUI.alertBox('error', 'Pilih kasir atau Bukan kasir.')); return; }
                MklUI.setBusy(btn, true);
                MklApi.call('hr.commission.operatorSave', v === '__bukan' ? { opNo: o.opNo, role: 'bukan_kasir' } : { opNo: o.opNo, role: 'kasir', employeeId: v }).then(function (r) {
                  MklUI.setBusy(btn, false);
                  if (!r.success) { slot.appendChild(MklUI.alertBox('error', (r.details && r.details.fields && r.details.fields.operators) || r.message)); return; }
                  c.close(); MklUI.toast(r.message, 'success'); reload();
                });
              } }] });
            });
            return b;
          } } : null
        ].filter(Boolean), d.items, 'Belum ada operator. Impor laporan POS terlebih dahulu.'))
      ]));
    });
  }

  // ================================================================== halaman

  MklNav.register('/komisi', {
    title: 'Komisi Penjualan',
    perm: VIEW,
    menu: { label: 'Komisi', order: 18.2, section: 'Penggajian' },
    render: function (root) {
      root.appendChild(MklUI.pageHeader('Komisi Penjualan', 'Komisi kasir dari laporan POS Raptor. Masuk ke gaji sebagai komponen Komisi penjualan.'));
      var state = { month: currentMonth(), employees: [] };
      var tabs = [['hasil', 'Hasil per Periode'], ['impor', 'Impor dari POS'], ['tarif', 'Tarif Komisi'], ['operator', 'Operator POS']];
      var bar = h('div', { class: 'tabs', role: 'tablist' });
      var btns = {};
      tabs.forEach(function (t) {
        var b = h('button', { class: 'tab', type: 'button', role: 'tab', 'aria-selected': 'false' }, t[1]);
        b.addEventListener('click', function () { state.show(t[0]); });
        btns[t[0]] = b; bar.appendChild(b);
      });
      root.appendChild(bar);
      var nav = h('div', { class: 'week-nav' });
      var prev = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, '← Periode sebelumnya');
      var next = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Periode berikutnya →');
      var label = h('strong', { class: 'week-label' });
      nav.appendChild(prev); nav.appendChild(label); nav.appendChild(next);
      root.appendChild(nav);
      var area = h('div');
      root.appendChild(area);
      prev.addEventListener('click', function () { state.month = shiftMonth(state.month, -1); state.show('hasil'); });
      next.addEventListener('click', function () { state.month = shiftMonth(state.month, 1); state.show('hasil'); });
      state.show = function (tab) {
        Object.keys(btns).forEach(function (k) { btns[k].setAttribute('aria-selected', k === tab ? 'true' : 'false'); });
        nav.style.display = tab === 'hasil' ? '' : 'none';
        label.textContent = 'Gaji ' + T.monthLabel(state.month);
        next.disabled = state.month >= currentMonth();
        if (tab === 'hasil') overviewTab(area, state);
        else if (tab === 'impor') importTab(area, state);
        else if (tab === 'tarif') ratesTab(area);
        else operatorsTab(area);
      };
      state.show('hasil');
    }
  });
})();
