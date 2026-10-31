/*
 * Susun Jadwal (mingguan, per section), impor/template Excel jadwal,
 * Libur & Event, dan Shift & Lokasi.
 * Hak akses diperiksa server: penyusun jadwal tim hanya melihat dan
 * mengubah anggota timnya; impor jadwal serta mengubah libur/event hanya
 * untuk pengelola semua jadwal.
 */
(function () {
  'use strict';
  var h = MklUI.h;
  var T = window.MklTimeUI;
  var OFF = 'LIBUR';

  // ================================================================== Susun Jadwal

  var NOTES = ['Cuti', 'Sakit', 'Izin'];
  var CELL_TEXT = { Cuti: 'Leave', Sakit: 'Sick', Izin: 'Izin' };

  function cellValue(cell) {
    if (!cell || !cell.shiftId) return '';
    return cell.shiftId === OFF && cell.note ? OFF + '|' + cell.note : cell.shiftId;
  }

  function shiftLabel(s) { return s ? s.code + ' ' + s.startTime + '–' + s.endTime : ''; }

  /** Pilihan sel: shift buatan impor (kode J0800) cukup jam masuknya. */
  function optLabel(s) { return s.code === 'J' + s.startTime.replace(':', '') ? s.startTime : s.code + ' ' + s.startTime; }

  /** Teks isi sel untuk tampilan harian. */
  function valueText(v, shiftById) {
    if (!v) return 'Belum dijadwalkan';
    if (v === OFF) return 'Libur';
    if (v.indexOf(OFF + '|') === 0) return v.slice(OFF.length + 1);
    var s = shiftById(v);
    return s ? shiftLabel(s) + ' (' + s.name + ')' : '?';
  }

  function eventsTable(list, full) {
    return h('div', { class: 'recap-table' }, MklUI.table([
      { label: 'Jam', render: function (e) { return e.time || '-'; } },
      { label: 'Area', render: function (e) { return e.area || '-'; } },
      { label: 'Kategori', render: function (e) { return e.category || '-'; } },
      { label: 'Nama', render: function (e) { return h('strong', null, e.name); } },
      { label: 'Ringkasan', render: function (e) { return h('span', { class: 'small' }, e.summary || '-'); } },
      full ? { label: 'Catatan', render: function (e) { return h('span', { class: 'small' }, e.remarks || '-'); } } : null,
      { label: 'Anak', render: function (e) { return e.children ? String(e.children) : '-'; } },
      { label: 'Dewasa', render: function (e) { return e.adults ? String(e.adults) : '-'; } }
    ].filter(Boolean), list, 'Tidak ada event.'));
  }

  /** Jadwal harian satu tanggal: hari libur, event, dan karyawan per section. */
  function dailyModal(d, data, valueOf, shiftById) {
    var hol = (data.holidays || {})[d];
    var evs = (data.events || {})[d] || [];
    var groups = [], last = null;
    data.employees.forEach(function (e) {
      var sec = e.positionName || '-';
      if (!last || last.section !== sec) { last = { section: sec, rows: [] }; groups.push(last); }
      last.rows.push({ e: e, v: valueOf(e.employeeId, d) });
    });
    var content = h('div', { class: 'stack' },
      hol ? MklUI.alertBox('error', 'Hari libur nasional: ' + hol.join(', ')) : h('p', { class: 'muted small' }, 'Bukan hari libur nasional.'),
      h('h3', { class: 'daily-section' }, 'Event di park (' + evs.length + ')'),
      evs.length ? eventsTable(evs, true) : h('p', { class: 'muted small' }, 'Tidak ada event.'),
      h('h3', { class: 'daily-section' }, 'Karyawan'),
      h('div', { class: 'recap-table' }, h('table', { class: 'table' },
        h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Section'), h('th', { scope: 'col' }, 'Nama'), h('th', { scope: 'col' }, 'Shift'))),
        h('tbody', null, groups.map(function (g) {
          return g.rows.map(function (r, i) {
            return h('tr', null, i === 0 ? h('th', { scope: 'row', rowspan: String(g.rows.length) }, g.section) : null,
              h('td', null, r.e.nickname || r.e.fullName),
              h('td', null, valueText(r.v, shiftById)));
          });
        })))),
      h('p', { class: 'muted small' }, 'Termasuk perubahan yang belum disimpan. Jadwal tidak dipakai untuk menghitung gaji.'));
    MklUI.modal({ title: 'Jadwal ' + T.dayLabel(d, true), content: content, wide: true, actions: [{ label: 'Tutup', onClick: function (c) { c.close(); } }] });
  }

  /** Template / ekspor Excel jadwal (dibuat di browser). */
  function templateModal(defFrom) {
    var from = MklUI.field({ label: 'Dari tanggal', name: 'from', type: 'date', required: true, value: defFrom });
    var to = MklUI.field({ label: 'Sampai tanggal', name: 'to', type: 'date', required: true, value: T.addDays(defFrom, 27), hint: 'Maksimal 93 hari. Jadwal yang sudah ada ikut terisi, jadi file ini juga bisa dipakai sebagai ekspor.' });
    var slot = h('div');
    var form = h('form', { class: 'stack', novalidate: true }, h('p', { class: 'muted small' }, 'Template berisi sheet Jadwal (per section), Public Holiday, Event, dan Petunjuk. Isi di Excel lalu impor kembali dengan tombol Impor dari Excel.'), from.wrap, to.wrap, slot);
    var ctl = MklUI.modal({ title: 'Unduh template jadwal', content: form, actions: [{ label: 'Batal', onClick: function (c) { c.close(); } }, { label: 'Unduh Template', variant: 'primary', id: 'ok', onClick: submit }] });
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });
    function submit(c, btn) {
      MklUI.clearFieldErrors(form); MklUI.clear(slot);
      MklUI.setBusy(btn, true, 'Menyiapkan...');
      MklApi.call('time.schedules.templateData', { from: from.input.value, to: to.input.value }).then(function (res) {
        MklUI.setBusy(btn, false);
        if (!res.success) { if (!MklUI.showFieldErrors(form, res)) slot.appendChild(MklUI.alertBox('error', res.message)); return; }
        MklXlsx.download('Jadwal_Kerja_' + res.data.from + '_sd_' + res.data.to + '.xlsx', buildTemplate(res.data));
        c.close();
        MklUI.toast('Template jadwal diunduh.', 'success');
      });
    }
  }

  function buildTemplate(t) {
    var holByDate = {};
    t.holidays.forEach(function (x) { holByDate[x.date] = x.name; });
    var HEAD = 5;
    var rows = [
      [{ v: 'JADWAL KERJA MOOKILAND', style: 'title' }],
      [{ v: 'Periode ' + MklUI.fmtDate(t.from) + ' – ' + MklUI.fmtDate(t.to), style: 'muted' }],
      [{ v: 'Isi sel dengan jam masuk (contoh 08:00), Day Off, Leave (cuti), Sick (sakit), atau Izin. Sel kosong = jadwal tidak diubah saat diimpor.', style: 'muted' }],
      [],
      [{ v: 'Section', style: 'header' }, { v: 'Staff Name', style: 'header' }].concat(t.dates.map(function (d) { return { date: d, style: holByDate[d] ? 'holiday' : 'headerDate' }; }))
    ];
    t.rows.forEach(function (r) {
      rows.push([r.section, r.name].concat(t.dates.map(function (d) { return r.cells[d] || null; })));
    });
    var starts = [];
    (t.shifts || []).forEach(function (s) { var m = /^(\d{2}:\d{2})/.exec(s); if (m && starts.indexOf(m[1]) === -1) starts.push(m[1]); });
    starts.sort();
    var lastCol = MklXlsx.colName(1 + t.dates.length);
    var lastRow = HEAD + Math.max(t.rows.length, 1) + 30;
    var sheets = [{
      name: 'Jadwal', rows: rows, widths: [22, 18].concat(t.dates.map(function () { return 11; })), freeze: { col: 2, row: HEAD },
      validation: { range: 'C' + (HEAD + 1) + ':' + lastCol + lastRow, list: starts.concat(['Day Off', 'Leave', 'Sick', 'Izin']) }
    }, {
      name: 'Public Holiday', widths: [14, 40], freeze: { col: 0, row: 1 },
      rows: [[{ v: 'Tanggal', style: 'header' }, { v: 'Hari Libur', style: 'header' }]].concat(t.holidays.map(function (x) { return [{ date: x.date }, x.name]; }))
    }, {
      name: 'Event', widths: [5, 12, 8, 18, 18, 24, 32, 32, 9, 9], freeze: { col: 0, row: 1 },
      rows: [['No', 'Date', 'Time', 'Area', 'Category', 'Name', 'Summary', 'Remarks', 'Children', 'Adults'].map(function (x) { return { v: x, style: 'header' }; })]
        .concat(t.events.map(function (e, i) { return [i + 1, { date: e.date }, e.time || null, e.area || null, e.category || null, e.name, e.summary || null, e.remarks || null, e.children || null, e.adults || null]; }))
    }, {
      name: 'Petunjuk', widths: [110],
      rows: [
        [{ v: 'Cara mengisi template jadwal', style: 'title' }],
        [],
        ['1. Sheet Jadwal: satu baris per karyawan, dikelompokkan per section (jabatan). Jangan ubah judul kolom Section dan Staff Name.'],
        ['2. Tanggal ada di baris judul, ke kanan. Boleh menambah kolom tanggal baru di sebelah kanan.'],
        ['3. Isi sel: jam masuk (08:00), Day Off (libur), Leave (cuti), Sick (sakit), Izin. Sel kosong tidak mengubah jadwal yang sudah ada.'],
        ['4. Jam masuk dipasangkan dengan shift yang jam masuknya sama. Jam baru dibuatkan shift otomatis (pulang 9 jam kemudian, istirahat 60 menit).'],
        ['5. Karyawan baru: tambahkan baris dengan nama panggilan seperti di portal. Saat impor, nama bisa dipasangkan ke karyawan secara manual.'],
        ['6. Sheet Public Holiday: tanggal dan nama hari libur nasional. Sheet Event: event di park (tanggal, jam, area, nama, ringkasan, catatan, jumlah anak dan dewasa).'],
        ['7. Simpan file, lalu di portal: Susun Jadwal > Impor dari Excel. Periksa pratinjau sebelum menyimpan.'],
        ['8. Catatan event bisa berisi data pelanggan: jangan bagikan file ini ke luar tim.'],
        [],
        [{ v: 'Shift yang ada saat template dibuat:', style: 'header' }]
      ].concat((t.shifts || []).map(function (s) { return [s]; }))
    }];
    return MklXlsx.build(sheets);
  }

  /** Impor jadwal dari Excel: pilih file → pratinjau + pasangkan nama → simpan. */
  function importModal(onDone) {
    var file = MklUI.fileField({ label: 'File jadwal (.xlsx atau .xls)', name: 'file', accept: '.xlsx,.xls', hint: 'Maksimal 5 MB. Susunan seperti file "Staff Working Schedule" atau template dari tombol Unduh Template.' });
    var slot = h('div');
    var area = h('div', { class: 'stack' }, h('p', { class: 'muted small' }, 'Tabel jadwal dibaca dari judul kolom Section dan Staff Name dengan tanggal ke kanan. Sheet hari libur (Tanggal | Hari Libur) dan event (Date | Time | Area | Name ...) ikut dibaca. File tidak disimpan di server.'), file.wrap, slot);
    var ctl = MklUI.modal({ title: 'Impor jadwal dari Excel', content: area, wide: true, actions: [{ label: 'Batal', onClick: function (c) { c.close(); } }, { label: 'Periksa File', variant: 'primary', id: 'ok', onClick: check }] });
    var preview = null, rows = [], fromF, toF, pubC, holC, evC;
    function check(c, btn) {
      if (preview) { commit(c, btn); return; }
      MklUI.clearFieldErrors(area); MklUI.clear(slot);
      var f = file.input.files && file.input.files[0];
      var err = !f ? 'Pilih file jadwal.' : (!/\.(xlsx|xls)$/i.test(f.name) ? 'File harus .xlsx atau .xls.' : (f.size > 5 * 1024 * 1024 ? 'Ukuran file maksimal 5 MB.' : ''));
      if (err) { MklUI.showFieldErrors(area, { details: { fields: { file: err } } }); return; }
      MklUI.setBusy(btn, true, 'Membaca file (bisa 1 menit)...');
      MklUI.readFileBase64(f).then(function (b) { return MklApi.call('time.schedules.importPreview', { fileName: f.name, base64: b }); },
        function () { return { success: false, message: 'File tidak bisa dibaca oleh browser. Coba pilih ulang file.' }; }).then(function (res) {
        MklUI.setBusy(btn, false);
        if (!res.success) { if (!MklUI.showFieldErrors(area, res)) slot.appendChild(MklUI.alertBox('error', res.message)); return; }
        preview = res.data;
        paintPreview();
        btn.textContent = 'Simpan Jadwal';
      });
    }
    function paintPreview() {
      var p = preview;
      MklUI.clear(slot);
      file.wrap.style.display = 'none';
      slot.appendChild(MklUI.alertBox('success', 'File terbaca: ' + p.fileName + (p.sheets.length ? ' (sheet ' + p.sheets.join(', ') + ')' : '') + '.'));
      slot.appendChild(MklUI.infoList([
        ['Tanggal jadwal', p.firstDate ? T.rangeLabel(p.firstDate, p.lastDate) : 'tidak ada'],
        ['Karyawan di file', String(p.staff.length)],
        ['Hari libur', String(p.holidays) + (p.holidayRange ? ' (' + T.rangeLabel(p.holidayRange[0], p.holidayRange[1]) + ')' : '')],
        ['Event', String(p.events)]
      ]));
      if (p.newShifts.length) slot.appendChild(MklUI.alertBox('warning', 'Jam masuk ' + p.newShifts.join(', ') + ' belum punya shift. Shift dibuat otomatis ("Masuk ' + p.newShifts[0] + '", pulang 9 jam kemudian, istirahat 60 menit); ubah di Shift & Lokasi bila perlu.'));
      if (p.warnings.length) slot.appendChild(h('ul', { class: 'warning-list' }, p.warnings.map(function (w) { return h('li', null, w); })));
      if (p.staff.length) {
        var opts = [{ value: '', label: '— Lewati (tidak diimpor) —' }].concat(p.employeeOptions.map(function (e) { return { value: e.employeeId, label: e.fullName + (e.nickname ? ' (' + e.nickname + ')' : '') + (e.positionName ? ' · ' + e.positionName : '') }; }));
        rows = p.staff.map(function (s) {
          var sel = h('select', { class: 'input', 'aria-label': 'Karyawan untuk ' + s.name });
          opts.forEach(function (o) { sel.appendChild(h('option', { value: o.value }, o.label)); });
          sel.value = s.savedIgnore ? '' : (s.savedEmployeeId || s.suggestedEmployeeId || '');
          return { s: s, sel: sel };
        });
        slot.appendChild(h('h3', { class: 'daily-section' }, 'Pasangkan nama di file dengan karyawan'));
        slot.appendChild(h('div', { class: 'recap-table import-map' }, MklUI.table([
          { label: 'Nama di file', render: function (r) { return h('strong', null, r.s.name); } },
          { label: 'Section', render: function (r) { return r.s.section || '-'; } },
          { label: 'Isi', render: function (r) { var c = r.s.counts; return h('span', { class: 'small' }, c.time + ' masuk, ' + c.off + ' libur' + (c.note ? ', ' + c.note + ' cuti/sakit/izin' : '')); } },
          { label: 'Karyawan', render: function (r) { return h('span', null, r.sel, !r.s.savedEmployeeId && !r.s.savedIgnore && r.s.suggestedEmployeeId ? h('span', { class: 'muted small' }, ' saran') : null); } }
        ], rows)));
        slot.appendChild(h('p', { class: 'muted small' }, 'Pilihan ini diingat untuk impor berikutnya.'));
        fromF = MklUI.field({ label: 'Impor jadwal dari tanggal', name: 'from', type: 'date', value: p.suggestedFrom });
        toF = MklUI.field({ label: 'Sampai tanggal', name: 'to', type: 'date', value: p.suggestedTo, hint: 'Tanggal di luar rentang ini tidak diubah. Bawaan: mulai hari ini, agar jadwal yang sudah lewat tetap.' });
        slot.appendChild(h('div', { class: 'form-grid' }, fromF.wrap, toF.wrap));
        pubC = MklUI.checkboxField({ label: 'Langsung terbitkan', name: 'publish', checked: false, hint: 'Karyawan yang jadwalnya berubah mendapat notifikasi. Bila tidak dicentang, jadwal tersimpan sebagai draf; terbitkan per minggu di Susun Jadwal.' });
        slot.appendChild(pubC.wrap);
      }
      holC = MklUI.checkboxField({ label: 'Simpan ' + p.holidays + ' hari libur', name: 'holidays', checked: p.holidays > 0 });
      evC = MklUI.checkboxField({ label: 'Simpan ' + p.events + ' event', name: 'events', checked: p.events > 0, hint: 'Event yang sama (tanggal, jam, dan nama) diperbarui, tidak digandakan.' });
      if (p.holidays) slot.appendChild(holC.wrap);
      if (p.events) slot.appendChild(evC.wrap);
      slot.appendChild(h('div', { 'aria-live': 'polite', 'data-slot': 'err' }));
    }
    function commit(c, btn) {
      var errSlot = slot.querySelector('[data-slot="err"]');
      MklUI.clear(errSlot);
      MklUI.clearFieldErrors(slot);
      var payload = {
        importId: preview.importId,
        mappings: rows.map(function (r) { return { index: r.s.index, employeeId: r.sel.value, ignore: !r.sel.value }; }),
        publish: pubC ? pubC.input.checked : false, holidays: holC.input.checked, events: evC.input.checked
      };
      if (fromF && fromF.input.value) payload.from = fromF.input.value;
      if (toF && toF.input.value) payload.to = toF.input.value;
      MklUI.setBusy(btn, true, 'Menyimpan jadwal...');
      MklApi.call('time.schedules.importCommit', payload).then(function (res) {
        MklUI.setBusy(btn, false);
        if (!res.success) { if (!MklUI.showFieldErrors(slot, res)) errSlot.appendChild(MklUI.alertBox('error', res.message)); return; }
        c.close();
        MklUI.toast(res.message, 'success', 12000);
        if (onDone) onDone();
      });
    }
    return ctl;
  }

  MklNav.register('/jadwal', {
    title: 'Susun Jadwal',
    perm: ['schedule.manage.all', 'schedule.manage.team'],
    menu: { label: 'Susun Jadwal', order: 10, section: 'Jadwal & Absensi' },
    render: function (root) {
      var weekStart = T.mondayOf(MklUI.todayYmd());
      var data = null;
      var pending = {}; // 'empId|date' -> shiftId | 'LIBUR' | 'LIBUR|Cuti' | ''
      var canAll = MklState.can('schedule.manage.all');

      var saveBtn = h('button', { class: 'btn btn-secondary', type: 'button' }, 'Simpan Draf');
      var pubBtn = h('button', { class: 'btn btn-primary', type: 'button' }, 'Terbitkan');
      var copyBtn = h('button', { class: 'btn btn-secondary', type: 'button' }, 'Salin dari Minggu Lalu');
      var impBtn = canAll ? h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Impor dari Excel') : null;
      var tplBtn = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Unduh Template');
      var calLink = canAll ? h('a', { class: 'btn btn-ghost btn-small', href: '#/libur-event' }, 'Libur & Event') : null;
      root.appendChild(MklUI.pageHeader('Susun Jadwal', 'Atur shift per karyawan per hari (dikelompokkan per section), lalu terbitkan agar terlihat oleh karyawan. Klik tanggal untuk melihat jadwal harian, hari libur, dan event.', [impBtn, tplBtn, calLink]));

      var prev = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, '← Minggu lalu');
      var thisWeek = h('button', { class: 'btn btn-ghost btn-small', type: 'button' }, 'Minggu ini');
      var next = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Minggu depan →');
      var label = h('strong', { class: 'week-label' });
      root.appendChild(h('div', { class: 'week-nav' }, prev, label, next, thisWeek));
      var info = h('div', { 'aria-live': 'polite' });
      root.appendChild(info);
      var area = h('div');
      root.appendChild(area);
      root.appendChild(h('div', { class: 'form-actions sticky-actions' }, copyBtn, saveBtn, pubBtn));

      function dirtyCount() { return Object.keys(pending).length; }
      function guard(fn) {
        return function () {
          if (!dirtyCount()) { fn(); return; }
          MklUI.confirmAction({
            title: 'Buang perubahan?',
            message: h('p', null, 'Ada ' + dirtyCount() + ' perubahan yang belum disimpan. Jika dilanjutkan, perubahan tersebut hilang.'),
            confirmLabel: 'Buang Perubahan', danger: true,
            onConfirm: function () { fn(); return Promise.resolve({ success: true }); }
          });
        };
      }
      prev.addEventListener('click', guard(function () { weekStart = T.addDays(weekStart, -7); load(); }));
      next.addEventListener('click', guard(function () { weekStart = T.addDays(weekStart, 7); load(); }));
      thisWeek.addEventListener('click', guard(function () { weekStart = T.mondayOf(MklUI.todayYmd()); load(); }));
      if (impBtn) impBtn.addEventListener('click', guard(function () { importModal(load); }));
      tplBtn.addEventListener('click', function () { templateModal(weekStart); });

      function paintInfo() {
        MklUI.clear(info);
        if (!data) return;
        var n = dirtyCount();
        if (n) info.appendChild(MklUI.alertBox('warning', n + ' perubahan belum disimpan. Tekan Simpan Draf.'));
        else if (data.draftCount) info.appendChild(MklUI.alertBox('info', data.draftCount + ' sel masih draf (belum terlihat karyawan). Tekan Terbitkan bila jadwal sudah benar.'));
        else info.appendChild(h('p', { class: 'muted small' }, 'Semua jadwal minggu ini sudah terbit.'));
        saveBtn.disabled = !n;
        pubBtn.disabled = !n && !data.draftCount;
      }

      function load() {
        pending = {};
        label.textContent = T.rangeLabel(weekStart, T.addDays(weekStart, 6));
        MklUI.clear(info);
        MklUI.clear(area).appendChild(MklUI.loadingState('Memuat jadwal...'));
        saveBtn.disabled = pubBtn.disabled = copyBtn.disabled = true;
        MklApi.call('time.schedules.week', { weekStart: weekStart }).then(function (res) {
          MklUI.clear(area);
          if (!res.success) { area.appendChild(MklUI.errorState(res, load)); return; }
          data = res.data;
          copyBtn.disabled = false;
          paintGrid();
          paintInfo();
        });
      }

      function shiftById(id) {
        for (var i = 0; i < data.shifts.length; i++) if (data.shifts[i].shiftId === id) return data.shifts[i];
        return null;
      }
      function valueOf(emp, d) {
        var k = emp + '|' + d;
        return pending[k] !== undefined ? pending[k] : cellValue((data.cells[emp] || {})[d]);
      }

      function paintGrid() {
        var active = data.shifts.filter(function (s) { return s.active; });
        if (!active.length) {
          area.appendChild(MklUI.card(null, [MklUI.alertBox('warning', 'Belum ada shift aktif.'),
            canAll ? h('p', null, h('a', { href: '#/shift' }, 'Buat shift di menu Shift & Lokasi'), ' atau impor jadwal dari Excel (shift dibuat otomatis).') : h('p', null, 'Minta HR membuat shift terlebih dahulu.')]));
        }
        if (!data.employees.length) {
          area.appendChild(MklUI.card(null, MklUI.emptyState('Belum ada karyawan aktif yang bisa Anda jadwalkan.')));
          return;
        }
        var today = MklUI.todayYmd();
        var holidays = data.holidays || {}, events = data.events || {};
        var thead = h('thead', null, h('tr', null, h('th', { scope: 'col', class: 'sched-name' }, 'Karyawan'),
          data.dates.map(function (d) {
            var hol = holidays[d], ev = events[d] || [];
            var name = 'Jadwal harian ' + T.dayLabel(d) + (hol ? ', hari libur ' + hol.join(', ') : '') + (ev.length ? ', ' + ev.length + ' event' : '');
            var btn = h('button', { class: 'sched-day-btn', type: 'button', title: name, 'aria-label': name },
              T.DAYS_SHORT[T.weekday(d)], h('br'), h('span', { class: 'muted small' }, String(Number(d.slice(8)))),
              hol ? h('span', { class: 'sched-mark is-holiday' }, 'Libur nas.') : null,
              ev.length ? h('span', { class: 'sched-mark is-event' }, ev.length + ' event') : null);
            btn.addEventListener('click', function () { dailyModal(d, data, valueOf, shiftById); });
            return h('th', { scope: 'col', class: (d === today ? 'is-today' : '') + (hol ? ' is-holiday' : '') || null }, btn);
          })));
        var tbody = h('tbody');
        var lastSection = null;
        data.employees.forEach(function (e) {
          var sec = e.positionName || '-';
          if (sec !== lastSection) {
            lastSection = sec;
            var n = data.employees.filter(function (x) { return (x.positionName || '-') === sec; }).length;
            tbody.appendChild(h('tr', { class: 'sched-section' }, h('th', { scope: 'colgroup', colspan: String(data.dates.length + 1) }, sec + ' (' + n + ')')));
          }
          var row = h('tr', null, h('th', { scope: 'row', class: 'sched-name' }, h('span', null, e.nickname || e.fullName)));
          data.dates.forEach(function (d) {
            var cell = (data.cells[e.employeeId] || {})[d] || {};
            var current = cellValue(cell);
            var sel = h('select', { class: 'input sched-select', 'aria-label': (e.nickname || e.fullName) + ', ' + T.dayLabel(d) });
            sel.appendChild(h('option', { value: '' }, '–'));
            sel.appendChild(h('option', { value: OFF }, 'Libur'));
            NOTES.forEach(function (n) { sel.appendChild(h('option', { value: OFF + '|' + n }, n)); });
            data.shifts.forEach(function (s) {
              if (!s.active && s.shiftId !== cell.shiftId) return;
              sel.appendChild(h('option', { value: s.shiftId }, optLabel(s) + (s.active ? '' : ' (nonaktif)')));
            });
            sel.value = current;
            var td = h('td', { class: 'sched-cell' }, sel);
            var mark = function () {
              var v = sel.value;
              var isOff = v === OFF || v.indexOf(OFF + '|') === 0;
              var s = v && !isOff ? shiftById(v) : null;
              td.className = 'sched-cell' + (isOff ? ' is-off' : '') + (v.indexOf(OFF + '|') === 0 ? ' is-note' : '') + (s ? ' shift-bg-' + s.color : '') +
                (pending[e.employeeId + '|' + d] !== undefined ? ' is-dirty' : (cell.status === 'draft' ? ' is-draft' : ''));
              sel.title = s ? s.name + ' ' + s.startTime + '–' + s.endTime : (isOff ? (v === OFF ? 'Libur' : 'Libur: ' + v.slice(OFF.length + 1)) : 'Belum dijadwalkan');
            };
            sel.addEventListener('change', function () {
              var key = e.employeeId + '|' + d;
              if (sel.value === current) delete pending[key]; else pending[key] = sel.value;
              mark();
              paintInfo();
            });
            mark();
            row.appendChild(td);
          });
          tbody.appendChild(row);
        });
        area.appendChild(MklUI.card(null, [
          h('div', { class: 'grid-scroll', tabindex: '0', role: 'region', 'aria-label': 'Tabel jadwal minggu ini' }, h('table', { class: 'sched-grid' }, thead, tbody)),
          h('div', { class: 'sched-legend muted small' },
            h('span', null, h('span', { class: 'legend-box is-draft' }), ' Draf (belum terlihat karyawan)'),
            h('span', null, h('span', { class: 'legend-box is-dirty' }), ' Diubah, belum disimpan'),
            h('span', null, 'Cuti / Sakit / Izin = libur dengan keterangan'),
            active.map(function (s) { return h('span', null, T.shiftChip(s), ' ' + s.name + ' ' + s.startTime + '–' + s.endTime); })),
          h('p', { class: 'muted small' }, 'Jadwal tidak dipakai untuk menghitung gaji; gaji dihitung dari absensi.')
        ]));
      }

      function save() {
        var cells = Object.keys(pending).map(function (k) {
          var p = k.split('|');
          return { employeeId: p[0], date: p[1], shiftId: pending[k] };
        });
        return MklApi.call('time.schedules.saveWeek', { weekStart: weekStart, cells: cells });
      }

      saveBtn.addEventListener('click', function () {
        MklUI.setBusy(saveBtn, true, 'Menyimpan...');
        save().then(function (res) {
          MklUI.setBusy(saveBtn, false);
          if (!res.success) { MklUI.clear(info).appendChild(MklUI.alertBox('error', res.message)); return; }
          MklUI.toast(res.message, 'success');
          load();
        });
      });

      pubBtn.addEventListener('click', function () {
        var n = dirtyCount();
        MklUI.confirmAction({
          title: 'Terbitkan jadwal',
          message: h('div', null,
            h('p', null, 'Terbitkan jadwal ' + T.rangeLabel(weekStart, T.addDays(weekStart, 6)) + '?'),
            n ? h('p', null, n + ' perubahan yang belum disimpan akan disimpan dulu.') : null,
            h('p', { class: 'muted small' }, 'Karyawan yang jadwalnya berubah mendapat notifikasi. Absensi memakai jadwal yang sudah terbit.')),
          confirmLabel: 'Terbitkan',
          onConfirm: function () {
            var first = n ? save() : Promise.resolve({ success: true });
            return first.then(function (r) {
              if (!r.success) return r;
              return MklApi.call('time.schedules.publish', { weekStart: weekStart }).then(function (res) {
                if (res.success) { MklUI.toast(res.message, 'success'); load(); }
                return res;
              });
            });
          }
        });
      });

      copyBtn.addEventListener('click', guard(function () {
        MklUI.setBusy(copyBtn, true, 'Menyalin...');
        MklApi.call('time.schedules.copyWeek', { weekStart: weekStart, fromWeekStart: T.addDays(weekStart, -7) }).then(function (res) {
          MklUI.setBusy(copyBtn, false);
          if (!res.success) { MklUI.clear(info).appendChild(MklUI.alertBox('error', res.message)); return; }
          MklUI.toast(res.message, res.data.changed ? 'success' : 'info');
          load();
        });
      }));

      load();
    }
  });

  // ================================================================== Libur & Event

  MklNav.register('/libur-event', {
    title: 'Libur & Event',
    perm: ['schedule.manage.all', 'schedule.manage.team'],
    menu: { label: 'Libur & Event', order: 10.5, section: 'Jadwal & Absensi' },
    render: function (root) {
      var today = MklUI.todayYmd();
      var from = MklUI.field({ label: 'Dari', name: 'from', type: 'date', value: T.addDays(today, -7) });
      var to = MklUI.field({ label: 'Sampai', name: 'to', type: 'date', value: T.addDays(today, 90) });
      var show = h('button', { class: 'btn btn-secondary', type: 'submit' }, 'Tampilkan');
      root.appendChild(MklUI.pageHeader('Libur & Event', 'Hari libur nasional dan event di park (pesta, kunjungan sekolah, dll.). Tampil di Susun Jadwal dan Jadwal Saya. Bisa juga diimpor dari Excel lewat Susun Jadwal.'));
      var form = h('form', { class: 'filter-bar', novalidate: true }, from.wrap, to.wrap, h('div', { class: 'field' }, h('label', null, ' '), show));
      root.appendChild(form);
      var area = h('div');
      root.appendChild(area);
      form.addEventListener('submit', function (e) { e.preventDefault(); load(); });

      function load() {
        MklUI.clear(area).appendChild(MklUI.loadingState('Memuat...'));
        MklApi.call('time.calendar.list', { from: from.input.value, to: to.input.value }).then(function (res) {
          MklUI.clear(area);
          if (!res.success) { area.appendChild(MklUI.errorState(res, load)); return; }
          var d = res.data;
          var addHol = d.canEdit ? h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Tambah Hari Libur') : null;
          var addEv = d.canEdit ? h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Tambah Event') : null;
          if (addHol) addHol.addEventListener('click', function () { holidayForm(null); });
          if (addEv) addEv.addEventListener('click', function () { eventForm(null); });
          area.appendChild(MklUI.card('Hari libur nasional (' + d.holidays.length + ')', [
            h('div', { class: 'recap-table' }, MklUI.table([
              { label: 'Tanggal', render: function (x) { return T.dayLabel(x.date, true); } },
              { label: 'Hari libur', render: function (x) { return x.name; } },
              d.canEdit ? { label: 'Aksi', className: 'col-action', render: function (x) {
                var e1 = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Ubah');
                var e2 = h('button', { class: 'btn btn-ghost btn-small', type: 'button' }, 'Hapus');
                e1.addEventListener('click', function () { holidayForm(x); });
                e2.addEventListener('click', function () { remove('time.calendar.holidayRemove', { holidayId: x.holidayId }, 'Hapus hari libur ' + x.name + '?'); });
                return h('span', null, e1, ' ', e2);
              } } : null
            ].filter(Boolean), d.holidays, 'Belum ada hari libur pada rentang ini.')),
            addHol ? h('div', { class: 'form-actions' }, addHol) : null]));
          area.appendChild(MklUI.card('Event di park (' + d.events.length + ')', [
            h('div', { class: 'recap-table' }, MklUI.table([
              { label: 'Tanggal', render: function (x) { return T.dayLabel(x.date, true); } },
              { label: 'Jam', render: function (x) { return x.time || '-'; } },
              { label: 'Area', render: function (x) { return x.area || '-'; } },
              { label: 'Kategori', render: function (x) { return x.category || '-'; } },
              { label: 'Nama', render: function (x) { return h('strong', null, x.name); } },
              { label: 'Ringkasan', render: function (x) { return h('span', { class: 'small' }, x.summary || '-'); } },
              { label: 'Catatan', render: function (x) { return h('span', { class: 'small' }, x.remarks || '-'); } },
              { label: 'Anak / Dewasa', render: function (x) { return (x.children || 0) + ' / ' + (x.adults || 0); } },
              d.canEdit ? { label: 'Aksi', className: 'col-action', render: function (x) {
                var e1 = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Ubah');
                var e2 = h('button', { class: 'btn btn-ghost btn-small', type: 'button' }, 'Hapus');
                e1.addEventListener('click', function () { eventForm(x); });
                e2.addEventListener('click', function () { remove('time.calendar.eventRemove', { eventId: x.eventId }, 'Hapus event ' + x.name + ' (' + MklUI.fmtDate(x.date) + ')?'); });
                return h('span', null, e1, ' ', e2);
              } } : null
            ].filter(Boolean), d.events, 'Belum ada event pada rentang ini.')),
            h('p', { class: 'muted small' }, 'Catatan event hanya terlihat oleh penyusun jadwal. Karyawan melihat jam, area, nama, dan ringkasan di Jadwal Saya.'),
            addEv ? h('div', { class: 'form-actions' }, addEv) : null]));
        });
      }

      function remove(action, payload, question) {
        MklUI.confirmAction({
          title: 'Hapus', message: h('p', null, question), confirmLabel: 'Hapus', danger: true,
          onConfirm: function () { return MklApi.call(action, payload).then(function (r) { if (r.success) { MklUI.toast(r.message, 'success'); load(); } return r; }); }
        });
      }

      function simpleForm(title, fields, build, action) {
        var slot = h('div');
        var form = h('form', { class: 'stack', novalidate: true }, fields.map(function (f) { return f.wrap; }), slot);
        var ctl = MklUI.modal({ title: title, content: form, actions: [{ label: 'Batal', onClick: function (c) { c.close(); } }, { label: 'Simpan', variant: 'primary', id: 'ok', onClick: submit }] });
        form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });
        function submit(c, btn) {
          MklUI.clearFieldErrors(form); MklUI.clear(slot);
          MklUI.setBusy(btn, true, 'Menyimpan...');
          MklApi.call(action, build()).then(function (res) {
            MklUI.setBusy(btn, false);
            if (!res.success) { if (!MklUI.showFieldErrors(form, res)) slot.appendChild(MklUI.alertBox('error', res.message)); return; }
            c.close();
            MklUI.toast(res.message, 'success');
            load();
          });
        }
      }

      function holidayForm(x) {
        var date = MklUI.field({ label: 'Tanggal', name: 'date', type: 'date', required: true, value: x ? x.date : '' });
        var name = MklUI.field({ label: 'Nama hari libur', name: 'name', required: true, maxLength: 80, value: x ? x.name : '' });
        if (x) date.input.readOnly = true;
        simpleForm(x ? 'Ubah hari libur' : 'Tambah hari libur', [date, name], function () { return { date: date.input.value, name: name.input.value.trim() }; }, 'time.calendar.holidaySave');
      }

      function eventForm(x) {
        var f = {
          date: MklUI.field({ label: 'Tanggal', name: 'date', type: 'date', required: true, value: x ? x.date : '' }),
          time: MklUI.field({ label: 'Jam', name: 'time', type: 'time', value: x ? x.time : '' }),
          area: MklUI.field({ label: 'Area', name: 'area', maxLength: 60, value: x ? x.area : '', hint: 'Contoh: Under The Tree, The Lounge.' }),
          category: MklUI.field({ label: 'Kategori', name: 'category', maxLength: 80, value: x ? x.category : '', hint: 'Contoh: Birthday Party, School Visit.' }),
          name: MklUI.field({ label: 'Nama event', name: 'name', required: true, maxLength: 80, value: x ? x.name : '' }),
          summary: MklUI.field({ label: 'Ringkasan (terlihat karyawan)', name: 'summary', multiline: true, rows: 2, maxLength: 300, value: x ? x.summary : '' }),
          remarks: MklUI.field({ label: 'Catatan (hanya penyusun jadwal)', name: 'remarks', multiline: true, rows: 2, maxLength: 500, value: x ? x.remarks : '' }),
          children: MklUI.field({ label: 'Jumlah anak', name: 'children', type: 'number', inputmode: 'numeric', value: x && x.children ? String(x.children) : '' }),
          adults: MklUI.field({ label: 'Jumlah dewasa', name: 'adults', type: 'number', inputmode: 'numeric', value: x && x.adults ? String(x.adults) : '' })
        };
        simpleForm(x ? 'Ubah event' : 'Tambah event', Object.keys(f).map(function (k) { return f[k]; }), function () {
          var p = { date: f.date.input.value, time: f.time.input.value.slice(0, 5), area: f.area.input.value.trim(), category: f.category.input.value.trim(), name: f.name.input.value.trim(),
            summary: f.summary.input.value.trim(), remarks: f.remarks.input.value.trim(), children: Number(f.children.input.value || 0), adults: Number(f.adults.input.value || 0) };
          if (x) p.eventId = x.eventId;
          return p;
        }, 'time.calendar.eventSave');
      }

      load();
    }
  });

  // ================================================================== Shift & Lokasi

  MklNav.register('/shift', {
    title: 'Shift & Lokasi',
    perm: ['schedule.manage.all', 'attendance.manage'],
    menu: { label: 'Shift & Lokasi', order: 11, section: 'Jadwal & Absensi' },
    render: function (root) {
      root.appendChild(MklUI.pageHeader('Shift & Lokasi', 'Daftar shift (jam kerja) dan lokasi kerja untuk absen GPS.'));
      var shiftArea = h('div');
      var locArea = h('div');
      root.appendChild(shiftArea);
      root.appendChild(locArea);
      var canShift = MklState.can('schedule.manage.all');
      var canLoc = MklState.can('attendance.manage');

      // ---------------------------------------------------------- shift
      function loadShifts() {
        MklUI.clear(shiftArea).appendChild(MklUI.loadingState('Memuat shift...'));
        MklApi.call('time.shifts.list', {}).then(function (res) {
          MklUI.clear(shiftArea);
          if (!res.success) { shiftArea.appendChild(MklUI.errorState(res, loadShifts)); return; }
          var add = canShift ? h('button', { class: 'btn btn-primary btn-small', type: 'button' }, 'Tambah Shift') : null;
          if (add) add.addEventListener('click', function () { shiftForm(null, res.data.colors); });
          shiftArea.appendChild(MklUI.card(null, [
            h('div', { class: 'card-head' }, h('h2', { class: 'card-title' }, 'Shift'), add),
            MklUI.table([
              { label: 'Kode', render: function (s) { return T.shiftChip(s); } },
              { label: 'Nama', render: function (s) { return s.name; } },
              { label: 'Jam', render: function (s) { return s.startTime + '–' + s.endTime + (s.crossesMidnight ? ' (+1)' : ''); } },
              { label: 'Istirahat', render: function (s) { return s.breakMinutes + ' menit'; } },
              { label: 'Toleransi terlambat', render: function (s) { return s.lateGraceMinutes + ' menit'; } },
              { label: 'Jam kerja', render: function (s) { return T.fmtMinutes(s.workMinutes); } },
              { label: 'Status', render: function (s) { return s.active ? MklUI.badge('Aktif', 'success') : MklUI.badge('Nonaktif', 'muted'); } },
              canShift ? { label: 'Aksi', className: 'col-action', render: function (s) {
                var b = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Ubah');
                b.addEventListener('click', function () { shiftForm(s, res.data.colors); });
                return b;
              } } : null
            ].filter(Boolean), res.data.items, 'Belum ada shift. Tekan Tambah Shift.'),
            h('p', { class: 'muted small' }, 'Contoh: kode 8 untuk shift masuk 08:00. Shift yang tidak dipakai lagi cukup dinonaktifkan agar jadwal lama tetap terbaca.')
          ]));
        });
      }

      function shiftForm(s, colors) {
        var form = h('form', { class: 'stack', novalidate: true });
        var f = {
          code: MklUI.field({ label: 'Kode', name: 'code', required: true, maxLength: 6, value: s ? s.code : '', hint: '1–6 huruf/angka, tampil di tabel jadwal. Contoh: 8, P, S13.' }),
          name: MklUI.field({ label: 'Nama shift', name: 'name', required: true, maxLength: 40, value: s ? s.name : '', placeholder: 'Contoh: Pagi 08.00' }),
          startTime: MklUI.field({ label: 'Jam masuk', name: 'startTime', type: 'time', required: true, value: s ? s.startTime : '' }),
          endTime: MklUI.field({ label: 'Jam pulang', name: 'endTime', type: 'time', required: true, value: s ? s.endTime : '', hint: 'Jika lebih awal dari jam masuk, shift dianggap selesai keesokan hari.' }),
          breakMinutes: MklUI.field({ label: 'Istirahat (menit)', name: 'breakMinutes', type: 'number', inputmode: 'numeric', value: s ? String(s.breakMinutes) : '60' }),
          lateGraceMinutes: MklUI.field({ label: 'Toleransi terlambat (menit)', name: 'lateGraceMinutes', type: 'number', inputmode: 'numeric', value: s ? String(s.lateGraceMinutes) : '0', hint: 'Terlambat dihitung jika masuk lebih dari sekian menit setelah jam masuk. [Perlu konfirmasi HR]' })
        };
        var color = MklUI.selectField({ label: 'Warna', name: 'color', value: s ? s.color : 'biru', options: colors.map(function (c) { return { value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }; }) });
        var active = s ? MklUI.checkboxField({ label: 'Aktif', name: 'active', checked: s.active, hint: 'Shift nonaktif tidak bisa dipilih untuk jadwal baru.' }) : null;
        var alertSlot = h('div');
        Object.keys(f).forEach(function (k) { form.appendChild(f[k].wrap); });
        form.appendChild(color.wrap);
        if (active) form.appendChild(active.wrap);
        form.appendChild(alertSlot);
        var ctl = MklUI.modal({
          title: s ? 'Ubah shift ' + s.code : 'Tambah shift', content: form,
          actions: [{ label: 'Batal', onClick: function (c) { c.close(); } }, { label: 'Simpan', variant: 'primary', id: 'ok', onClick: submit }]
        });
        form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });
        function submit(c, btn) {
          MklUI.clearFieldErrors(form);
          MklUI.clear(alertSlot);
          var p = {
            code: f.code.input.value.trim(), name: f.name.input.value.trim(), startTime: f.startTime.input.value, endTime: f.endTime.input.value,
            breakMinutes: Number(f.breakMinutes.input.value || 0), lateGraceMinutes: Number(f.lateGraceMinutes.input.value || 0), color: color.input.value
          };
          if (s) { p.shiftId = s.shiftId; p.active = active.input.checked; p.expectedVersion = Number(s.rowVersion); }
          MklUI.setBusy(btn, true, 'Menyimpan...');
          MklApi.call('time.shifts.save', p).then(function (res) {
            MklUI.setBusy(btn, false);
            if (!res.success) { if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message)); return; }
            c.close();
            MklUI.toast(res.message, 'success');
            loadShifts();
          });
        }
      }

      // ---------------------------------------------------------- lokasi
      function loadLocations() {
        MklUI.clear(locArea).appendChild(MklUI.loadingState('Memuat lokasi...'));
        MklApi.call('time.locations.list', {}).then(function (res) {
          MklUI.clear(locArea);
          if (!res.success) { locArea.appendChild(MklUI.errorState(res, loadLocations)); return; }
          var add = canLoc ? h('button', { class: 'btn btn-primary btn-small', type: 'button' }, 'Tambah Lokasi') : null;
          if (add) add.addEventListener('click', function () { locationForm(null); });
          locArea.appendChild(MklUI.card(null, [
            h('div', { class: 'card-head' }, h('h2', { class: 'card-title' }, 'Lokasi kerja'), add),
            MklUI.table([
              { label: 'Nama', render: function (l) { return l.name; } },
              { label: 'Titik', render: function (l) {
                if (l.latitude === null) return '';
                return h('a', { href: 'https://www.google.com/maps?q=' + l.latitude + ',' + l.longitude, target: '_blank', rel: 'noopener noreferrer' }, l.latitude.toFixed(5) + ', ' + l.longitude.toFixed(5));
              } },
              { label: 'Radius', render: function (l) { return l.radiusM + ' m'; } },
              { label: 'Status', render: function (l) { return l.active ? MklUI.badge('Aktif', 'success') : MklUI.badge('Nonaktif', 'muted'); } },
              canLoc ? { label: 'Aksi', className: 'col-action', render: function (l) {
                var b = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Ubah');
                b.addEventListener('click', function () { locationForm(l); });
                return b;
              } } : null
            ].filter(Boolean), res.data.items, 'Belum ada lokasi kerja. Absen GPS belum bisa dipakai sampai lokasi ditambahkan.'),
            h('p', { class: 'muted small' }, 'Karyawan hanya bisa absen di dalam radius lokasi aktif. Tekan koordinat untuk memeriksa titiknya di Google Maps.')
          ]));
        });
      }

      function locationForm(l) {
        var form = h('form', { class: 'stack', novalidate: true });
        var name = MklUI.field({ label: 'Nama lokasi', name: 'name', required: true, maxLength: 60, value: l ? l.name : '', placeholder: 'Contoh: Mookiland' });
        var address = MklUI.field({ label: 'Alamat', name: 'address', maxLength: 200, value: l ? l.address : '' });
        var lat = MklUI.field({ label: 'Latitude', name: 'latitude', required: true, inputmode: 'decimal', maxLength: 20, value: l && l.latitude !== null ? String(l.latitude) : '', placeholder: '-8.65' });
        var lng = MklUI.field({ label: 'Longitude', name: 'longitude', required: true, inputmode: 'decimal', maxLength: 20, value: l && l.longitude !== null ? String(l.longitude) : '', placeholder: '115.21' });
        var here = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Pakai Lokasi Saya Sekarang');
        var hereMsg = h('p', { class: 'muted small', 'aria-live': 'polite' });
        here.addEventListener('click', function () {
          MklUI.setBusy(here, true, 'Mencari lokasi...');
          hereMsg.textContent = '';
          T.getPosition().then(function (p) {
            MklUI.setBusy(here, false);
            lat.input.value = p.latitude.toFixed(6);
            lng.input.value = p.longitude.toFixed(6);
            hereMsg.textContent = 'Titik diisi dari posisi Anda (akurasi ±' + p.accuracy + ' m). Lakukan ini saat berdiri di area absen.';
          }, function (err) { MklUI.setBusy(here, false); hereMsg.textContent = err.message; });
        });
        var radius = MklUI.field({ label: 'Radius (meter)', name: 'radiusM', type: 'number', required: true, inputmode: 'numeric', value: l ? String(l.radiusM) : '100', hint: '20–1000 meter. Saran 100 m; terlalu kecil membuat absen sering gagal karena GPS ponsel meleset.' });
        var active = MklUI.checkboxField({ label: 'Aktif', name: 'active', checked: l ? l.active : true });
        var reason = MklUI.field({ label: 'Alasan', name: 'reason', required: true, multiline: true, rows: 2, maxLength: 300, hint: 'Dicatat di audit log.' });
        var alertSlot = h('div');
        [name.wrap, address.wrap, lat.wrap, lng.wrap, h('div', null, here, hereMsg), radius.wrap, active.wrap, reason.wrap, alertSlot].forEach(function (x) { form.appendChild(x); });
        var ctl = MklUI.modal({
          title: l ? 'Ubah lokasi' : 'Tambah lokasi', content: form,
          actions: [{ label: 'Batal', onClick: function (c) { c.close(); } }, { label: 'Simpan', variant: 'primary', id: 'ok', onClick: submit }]
        });
        form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });
        function submit(c, btn) {
          MklUI.clearFieldErrors(form);
          MklUI.clear(alertSlot);
          var p = {
            name: name.input.value.trim(), address: address.input.value.trim(), latitude: lat.input.value.trim().replace(',', '.'),
            longitude: lng.input.value.trim().replace(',', '.'), radiusM: Number(radius.input.value || 0), active: active.input.checked, reason: reason.input.value.trim()
          };
          if (l) { p.locationId = l.locationId; p.expectedVersion = Number(l.rowVersion); }
          MklUI.setBusy(btn, true, 'Menyimpan...');
          MklApi.call('time.locations.save', p).then(function (res) {
            MklUI.setBusy(btn, false);
            if (!res.success) { if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message)); return; }
            c.close();
            MklUI.toast(res.message, 'success');
            loadLocations();
          });
        }
      }

      loadShifts();
      loadLocations();
    }
  });
})();
