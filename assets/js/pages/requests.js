/*
 * Pengajuan Saya: cuti/izin/sakit, lembur, dan koreksi absensi milik sendiri.
 * Formulir koreksi juga dipakai dari halaman Absensi Saya (MklRequests).
 * Semua aturan (saldo, batas tanggal, hak cuti) diperiksa server.
 */
(function () {
  'use strict';
  var h = MklUI.h;
  var T = window.MklTimeUI;

  var STATUS_VARIANT = { menunggu: 'warning', disetujui: 'success', ditolak: 'danger', dibatalkan: 'muted' };
  function statusBadge(s, label) { return MklUI.badge(label || s, STATUS_VARIANT[s] || 'muted'); }

  function minutesBetween(a, b) {
    if (!/^\d{2}:\d{2}$/.test(a || '') || !/^\d{2}:\d{2}$/.test(b || '')) return 0;
    var x = Number(a.slice(0, 2)) * 60 + Number(a.slice(3)), y = Number(b.slice(0, 2)) * 60 + Number(b.slice(3));
    return (y <= x ? y + 1440 : y) - x;
  }

  function period(item) {
    if (item.startDate === item.endDate) return T.dayLabel(item.startDate, true);
    return MklUI.fmtDate(item.startDate) + ' – ' + MklUI.fmtDate(item.endDate);
  }

  /** Kirim formulir dengan pola yang sama di semua modal. */
  function submitter(form, alertSlot, action, buildPayload, onDone) {
    return function (c, btn) {
      MklUI.clearFieldErrors(form);
      MklUI.clear(alertSlot);
      var built = buildPayload();
      if (built && built.error) { alertSlot.appendChild(MklUI.alertBox('error', built.error)); return; }
      MklUI.setBusy(btn, true, 'Mengirim...');
      Promise.resolve(built).then(function (payload) { return MklApi.call(action, payload); }).then(function (res) {
        MklUI.setBusy(btn, false);
        if (!res.success) { if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message)); return; }
        c.close();
        MklUI.toast(res.message, 'success');
        if (onDone) onDone(res);
      });
    };
  }

  function openModal(title, form, alertSlot, onSubmit, submitLabel) {
    form.appendChild(alertSlot);
    var ctl = MklUI.modal({
      title: title, content: form,
      actions: [{ label: 'Batal', onClick: function (c) { c.close(); } }, { label: submitLabel || 'Kirim Pengajuan', variant: 'primary', id: 'ok', onClick: onSubmit }]
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); onSubmit(ctl, ctl.buttons.ok); });
    return ctl;
  }

  // ------------------------------------------------------------------ cuti / izin / sakit
  function leaveForm(summary, onDone) {
    var form = h('form', { class: 'stack', novalidate: true });
    var types = summary.types.filter(function (t) { return t.allowed; });
    var type = MklUI.selectField({ label: 'Jenis', name: 'leaveTypeId', required: true, options: types.map(function (t) { return { value: t.leaveTypeId, label: t.name }; }) });
    var start = MklUI.field({ label: 'Tanggal mulai', name: 'startDate', type: 'date', required: true, value: summary.today });
    var end = MklUI.field({ label: 'Tanggal selesai', name: 'endDate', type: 'date', required: true, value: summary.today });
    var reason = MklUI.field({ label: 'Alasan', name: 'reason', required: true, multiline: true, rows: 2, maxLength: 300 });
    var file = MklUI.fileField({ label: 'Lampiran (surat dokter)', name: 'document', accept: '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png', hint: 'PDF atau foto JPG/PNG, maksimal 5 MB. Wajib untuk sakit lebih dari 1 hari.' });
    var info = h('div', { class: 'note', 'aria-live': 'polite' });
    [type.wrap, start.wrap, end.wrap, info, reason.wrap, file.wrap].forEach(function (x) { form.appendChild(x); });
    if (!summary.eligible) form.insertBefore(h('p', { class: 'muted small' }, 'Cuti tahunan hanya untuk karyawan yang ditetapkan HR. Untuk keperluan pribadi, pilih Izin.'), type.wrap);

    function current() { for (var i = 0; i < types.length; i++) if (types[i].leaveTypeId === type.input.value) return types[i]; return types[0]; }
    var seq = 0;
    function refresh() {
      var t = current();
      file.wrap.hidden = t.requiresDocument === 'tidak';
      if (end.input.value < start.input.value) end.input.value = start.input.value;
      var my = ++seq;
      MklUI.clear(info).appendChild(h('span', { class: 'muted small' }, 'Menghitung jumlah hari...'));
      MklApi.call('me.leave.preview', { leaveTypeId: t.leaveTypeId, startDate: start.input.value, endDate: end.input.value }).then(function (res) {
        if (my !== seq) return;
        MklUI.clear(info);
        if (!res.success) {
          var msg = res.details && res.details.fields ? Object.keys(res.details.fields).map(function (k) { return res.details.fields[k]; }).join(' ') : res.message;
          info.appendChild(h('span', { class: 'issue-warning' }, msg));
          return;
        }
        var d = res.data;
        info.appendChild(h('div', null, h('strong', null, d.totalDays + ' hari'), d.offDays ? ' (' + d.offDays + ' hari Libur di jadwal tidak dihitung)' : ''));
        if (d.available !== null && d.available !== undefined) {
          info.appendChild(h('div', { class: d.totalDays > d.available ? 'issue-error' : 'muted small' }, 'Sisa cuti yang bisa dipakai: ' + d.available + ' hari' + (d.totalDays <= d.available ? ' → setelah disetujui ' + (d.available - d.totalDays) + ' hari.' : '.')));
        }
        if (d.needsDocument) info.appendChild(h('div', { class: 'issue-warning' }, 'Lampirkan surat dokter.'));
        if (d.overlap) info.appendChild(h('div', { class: 'issue-error' }, 'Sudah ada pengajuan pada ' + d.overlap + '.'));
      });
    }
    [type.input, start.input, end.input].forEach(function (el) { el.addEventListener('change', refresh); });
    var alertSlot = h('div');
    openModal('Ajukan cuti / izin / sakit', form, alertSlot, submitter(form, alertSlot, 'me.leave.submit', function () {
      var p = { leaveTypeId: type.input.value, startDate: start.input.value, endDate: end.input.value, reason: reason.input.value.trim() };
      var f = !file.wrap.hidden && file.input.files && file.input.files[0];
      if (!f) return p;
      if (f.size > 5 * 1024 * 1024) return { error: 'Ukuran lampiran ' + MklUI.fmtBytes(f.size) + '. Maksimal 5 MB.' };
      return MklUI.readFileBase64(f).then(function (b64) { p.document = { fileName: f.name, base64: b64 }; return p; });
    }, onDone));
    refresh();
  }

  // ------------------------------------------------------------------ lembur
  function overtimeForm(onDone) {
    var form = h('form', { class: 'stack', novalidate: true });
    var date = MklUI.field({ label: 'Tanggal lembur', name: 'workDate', type: 'date', required: true, value: MklUI.todayYmd(), hint: 'Hari ini atau ke depan = rencana lembur. Tanggal yang sudah lewat = laporan lembur (paling lama 7 hari).' });
    var startT = MklUI.field({ label: 'Jam mulai', name: 'startTime', type: 'time', required: true });
    var endT = MklUI.field({ label: 'Jam selesai', name: 'endTime', type: 'time', required: true, hint: 'Jika lewat tengah malam, isi jam selesai keesokan hari (misalnya 01:00).' });
    var dur = h('p', { class: 'muted small', 'aria-live': 'polite' });
    var reason = MklUI.field({ label: 'Alasan / pekerjaan', name: 'reason', required: true, multiline: true, rows: 2, maxLength: 300, placeholder: 'Contoh: acara ulang tahun, stok opname' });
    [date.wrap, startT.wrap, endT.wrap, dur, reason.wrap].forEach(function (x) { form.appendChild(x); });
    function upd() {
      var m = minutesBetween(startT.input.value, endT.input.value);
      dur.textContent = m ? 'Lama lembur: ' + T.fmtMinutes(m) + (m > 240 ? ' — melebihi batas 4 jam per hari.' : '') : '';
    }
    startT.input.addEventListener('change', upd);
    endT.input.addEventListener('change', upd);
    var alertSlot = h('div');
    openModal('Ajukan lembur', form, alertSlot, submitter(form, alertSlot, 'me.overtime.submit', function () {
      return { workDate: date.input.value, startTime: startT.input.value, endTime: endT.input.value, reason: reason.input.value.trim() };
    }, onDone));
  }

  // ------------------------------------------------------------------ koreksi absensi
  /** opts: { date, clockIn, clockOut, onDone } */
  function correctionForm(opts) {
    opts = opts || {};
    var form = h('form', { class: 'stack', novalidate: true });
    var date = MklUI.field({ label: 'Tanggal', name: 'workDate', type: 'date', required: true, value: opts.date || MklUI.todayYmd() });
    var now = opts.date ? h('p', { class: 'muted small' }, 'Tercatat sekarang: masuk ' + (opts.clockIn || '–') + ', pulang ' + (opts.clockOut || '–') + '.') : null;
    var cin = MklUI.field({ label: 'Jam masuk yang benar', name: 'clockIn', type: 'time', hint: 'Kosongkan jika jam masuk sudah benar.' });
    var cout = MklUI.field({ label: 'Jam pulang yang benar', name: 'clockOut', type: 'time', hint: 'Kosongkan jika jam pulang sudah benar.' });
    var nextDay = MklUI.checkboxField({ label: 'Pulang keesokan hari', name: 'clockOutNextDay', hint: 'Untuk shift yang selesai lewat tengah malam.' });
    var reason = MklUI.field({ label: 'Alasan', name: 'reason', required: true, multiline: true, rows: 2, maxLength: 300, placeholder: 'Contoh: lupa absen pulang, ponsel mati' });
    [date.wrap, now, cin.wrap, cout.wrap, nextDay.wrap, reason.wrap].forEach(function (x) { if (x) form.appendChild(x); });
    var alertSlot = h('div');
    openModal('Ajukan koreksi absensi', form, alertSlot, submitter(form, alertSlot, 'me.correction.submit', function () {
      var p = { workDate: date.input.value, reason: reason.input.value.trim(), clockOutNextDay: nextDay.input.checked };
      if (cin.input.value) p.clockIn = cin.input.value;
      if (cout.input.value) p.clockOut = cout.input.value;
      if (!p.clockIn && !p.clockOut) return { error: 'Isi jam masuk dan/atau jam pulang yang benar.' };
      return p;
    }, opts.onDone));
  }

  window.MklRequests = { correctionForm: correctionForm, statusBadge: statusBadge, period: period };

  // ================================================================== halaman

  MklNav.register('/pengajuan', {
    title: 'Pengajuan Saya',
    perm: ['leave.request.own', 'overtime.request.own', 'attendance.correction.request.own'],
    menu: { label: 'Pengajuan Saya', order: 4.5 },
    render: function (root) {
      root.appendChild(MklUI.pageHeader('Pengajuan Saya', 'Cuti, izin, sakit, lembur, dan koreksi absensi. Semua disetujui Manajer Operasional.'));
      var top = h('div');
      var listArea = h('div');
      root.appendChild(top);
      root.appendChild(listArea);
      var summary = null;

      function loadAll() { loadSummary(); loadList(); }

      function loadSummary() {
        MklUI.clear(top);
        var calls = [];
        if (MklState.can('leave.request.own')) calls.push(MklApi.call('me.leave.summary', {}));
        Promise.all(calls).then(function (res) {
          MklUI.clear(top);
          var s = res[0];
          if (s && !s.success) { top.appendChild(MklUI.errorState(s, loadSummary)); return; }
          if (s && s.data.linked === false) { top.appendChild(T.notLinked()); return; }
          summary = s ? s.data : null;
          var buttons = h('div', { class: 'form-actions' });
          if (summary) {
            var b1 = h('button', { class: 'btn btn-primary', type: 'button' }, 'Ajukan Cuti / Izin / Sakit');
            b1.addEventListener('click', function () { leaveForm(summary, loadAll); });
            buttons.appendChild(b1);
          }
          if (MklState.can('overtime.request.own')) {
            var b2 = h('button', { class: 'btn btn-secondary', type: 'button' }, 'Ajukan Lembur');
            b2.addEventListener('click', function () { overtimeForm(loadAll); });
            buttons.appendChild(b2);
          }
          if (MklState.can('attendance.correction.request.own')) {
            var b3 = h('button', { class: 'btn btn-secondary', type: 'button' }, 'Ajukan Koreksi Absen');
            b3.addEventListener('click', function () { correctionForm({ onDone: loadAll }); });
            buttons.appendChild(b3);
          }
          var content = [];
          if (summary && summary.eligible && summary.balance) {
            var b = summary.balance;
            content.push(h('div', { class: 'stats' },
              T.stat('Sisa cuti tahunan ' + summary.year, b.available + ' hari', b.available <= 0 ? 'warning' : null),
              T.stat('Sisa tahun lalu', b.opening), T.stat('Jatah ' + summary.year, b.accrued),
              T.stat('Terpakai', b.used), T.stat('Menunggu persetujuan', b.pending)));
            if (b.adjusted) content.push(h('p', { class: 'muted small' }, 'Termasuk penyesuaian HR ' + (b.adjusted > 0 ? '+' : '') + b.adjusted + ' hari.'));
          } else if (summary) {
            content.push(h('p', { class: 'muted' }, 'Anda tidak mendapat cuti tahunan. Anda tetap bisa mengajukan sakit, izin, dan cuti khusus.'));
          }
          content.push(buttons);
          top.appendChild(MklUI.card(null, content));
        });
      }

      function loadList() {
        MklUI.clear(listArea).appendChild(MklUI.loadingState('Memuat pengajuan...'));
        MklApi.call('me.requests', {}).then(function (res) {
          MklUI.clear(listArea);
          if (!res.success) { listArea.appendChild(MklUI.errorState(res, loadList)); return; }
          if (res.data.linked === false) return;
          listArea.appendChild(MklUI.card('Riwayat pengajuan', [
            MklUI.table([
              { label: 'Jenis', render: function (i) { return h('span', null, h('strong', null, i.title), h('br'), h('span', { class: 'muted small' }, i.typeLabel)); } },
              { label: 'Tanggal', render: function (i) { return i.type === 'overtime' ? i.period.replace(/^\d{4}-\d{2}-\d{2}/, function (m) { return T.dayLabel(m, true) + ','; }) : period(i); } },
              { label: 'Alasan', render: function (i) { return h('span', { class: 'small' }, i.reason); } },
              { label: 'Status', render: function (i) {
                return h('div', { class: 'stack-tight' }, statusBadge(i.status, i.statusLabel),
                  i.decidedBy ? h('span', { class: 'muted small' }, 'oleh ' + i.decidedBy) : null,
                  i.decisionNote ? h('span', { class: 'small' }, 'Catatan: ' + i.decisionNote) : null,
                  i.approvedMinutes ? h('span', { class: 'small' }, 'Disetujui ' + i.approvedMinutes + ' menit') : null);
              } },
              { label: 'Aksi', className: 'col-action', render: function (i) {
                if (!i.canCancel) return '';
                var b = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Batalkan');
                b.addEventListener('click', function () {
                  MklUI.confirmAction({
                    title: 'Batalkan pengajuan', message: h('p', null, 'Batalkan ' + i.title.toLowerCase() + '?'),
                    confirmLabel: 'Batalkan Pengajuan', danger: true,
                    onConfirm: function () {
                      return MklApi.call('me.request.cancel', { type: i.type, requestId: i.requestId }).then(function (r) {
                        if (r.success) { MklUI.toast(r.message, 'success'); loadAll(); }
                        return r;
                      });
                    }
                  });
                });
                return b;
              } }
            ], res.data.items, 'Belum ada pengajuan.'),
            h('p', { class: 'muted small' }, 'Pengajuan yang sudah disetujui hanya bisa dibatalkan oleh HR. Anda mendapat notifikasi di ikon lonceng setiap ada keputusan.')
          ]));
        });
      }
      loadAll();
    }
  });
})();
