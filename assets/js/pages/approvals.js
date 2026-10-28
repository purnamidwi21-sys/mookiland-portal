/*
 * Persetujuan: antrean cuti/izin/sakit, lembur, dan koreksi absensi untuk
 * Manajer Operasional (dan Direktur untuk pengajuan Manajer Operasional).
 * Hak memutuskan diperiksa server pada setiap keputusan.
 */
(function () {
  'use strict';
  var h = MklUI.h;
  var T = window.MklTimeUI;
  var APPROVE = ['leave.manage', 'overtime.manage', 'attendance.manage', 'hr.sensitive.manage', 'loan.approve', 'request.approve.hr'];
  var TYPE_VARIANT = { leave: 'info', overtime: 'warning', correction: 'neutral', identity: 'muted', loan: 'warning' };

  function range(a, b) { return a === b ? T.dayLabel(a, true) : MklUI.fmtDate(a) + ' – ' + MklUI.fmtDate(b); }

  /** Baris rincian per jenis pengajuan. */
  function detailRows(it) {
    var d = it.detail;
    if (d.kind === 'leave') {
      var rows = [['Jenis', d.leaveType], ['Tanggal', range(d.startDate, d.endDate) + ' (' + d.totalDays + ' hari)'], ['Alasan', d.reason]];
      if (d.balance) {
        rows.push(['Saldo cuti', it.status === 'menunggu'
          ? 'Sisa ' + d.balance.closing + ' hari' + (d.balance.pending ? ', termasuk pengajuan ini ' + d.balance.pending + ' hari menunggu' : '') + ' → setelah disetujui ' + (d.balance.closing - d.totalDays) + ' hari'
          : 'Sisa sekarang ' + d.balance.closing + ' hari']);
      }
      if (d.documentId) {
        if (MklState.can('contract.manage') && MklState.can('hr.sensitive.read')) {
          var b = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Lihat Lampiran');
          b.addEventListener('click', function () { MklEmployeeExtras.download('hr.documents.download', d.documentId, b); });
          rows.push(['Lampiran', b]);
        } else rows.push(['Lampiran', 'Ada (dibuka oleh HR)']);
      }
      return rows;
    }
    if (d.kind === 'overtime') {
      var r = [['Jenis', d.requestTypeLabel + ' lembur'], ['Waktu', T.dayLabel(d.workDate, true) + ', ' + d.startTime + '–' + d.endTime + ' (' + d.minutes + ' menit)'], ['Alasan', d.reason]];
      if (d.attendance) {
        r.push(['Absen hari itu', 'masuk ' + (d.attendance.clockIn || '–') + ', pulang ' + (d.attendance.clockOut || '–') +
          (d.attendance.scheduledOut ? ', jadwal selesai ' + d.attendance.scheduledOut : '') +
          (d.attendance.overMinutes !== null && d.attendance.overMinutes !== undefined ? ' → ' + d.attendance.overMinutes + ' menit lewat jadwal' : '')]);
      } else r.push(['Absen hari itu', 'Belum ada catatan absen']);
      if (d.approvedMinutes) r.push(['Disetujui', d.approvedMinutes + ' menit']);
      return r;
    }
    if (d.kind === 'loan') {
      var lr = [['Jumlah diajukan', MklUI.fmtMoney(d.requestedAmount)], ['Usulan cicilan', d.requestedInstallments + ' kali gajian'], ['Keperluan', d.reason]];
      if (d.salary) lr.push(['Gaji', d.salary]);
      lr.push(['Kasbon sebelumnya', d.previousPaid ? d.previousPaid + ' kali, semua lunas' : 'Belum pernah']);
      if (it.status !== 'menunggu' && d.amount) lr.push(['Disetujui', MklUI.fmtMoney(d.amount) + ', ' + d.installments + '× ' + MklUI.fmtMoney(d.installmentAmount) + ', mulai gaji ' + d.startMonthLabel + ' (' + d.statusLabel + ')']);
      return lr;
    }
    if (d.kind === 'identity') {
      var cmp = function (now, before) { return before && before !== now ? h('span', null, now || '-', h('br'), h('span', { class: 'muted small' }, 'Sebelumnya: ' + before)) : (now || '-'); };
      var rows2 = [
        ['Tempat lahir', cmp(d.proposed.birthPlace, d.current.birthPlace)],
        ['Tanggal lahir', cmp(d.proposed.birthDate ? MklUI.fmtDate(d.proposed.birthDate) : '', d.current.birthDate ? MklUI.fmtDate(d.current.birthDate) : '')],
        ['Jenis kelamin', cmp(d.proposed.genderLabel, d.current.genderLabel)],
        ['Nomor KTP', cmp(d.proposed.idNumber, d.current.idNumber)]
      ];
      if (d.canSeePhoto) {
        var pb = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Lihat Foto KTP');
        pb.addEventListener('click', function () {
          MklUI.setBusy(pb, true, 'Membuka...');
          MklApi.call('approvals.identityPhoto', { requestId: it.requestId }).then(function (r) {
            MklUI.setBusy(pb, false);
            if (!r.success) { MklUI.toast(r.message, 'error'); return; }
            MklUI.downloadBase64(r.data.fileName, r.data.mimeType, r.data.base64);
          });
        });
        rows2.push(['Foto KTP', pb]);
      } else rows2.push(['Foto KTP', d.hasPhoto ? 'Ada (dibuka oleh HR)' : 'Tidak ada']);
      if (it.status === 'menunggu') rows2.push(['Periksa', 'Cocokkan nomor KTP, tanggal lahir, dan jenis kelamin dengan foto KTP sebelum menyetujui.']);
      return rows2;
    }
    return [
      ['Tanggal', T.dayLabel(d.workDate, true)], ['Jadwal', d.schedule || 'Tidak ada jadwal terbit'],
      ['Tercatat saat diajukan', 'masuk ' + (d.before.clockIn || '–') + ', pulang ' + (d.before.clockOut || '–')],
      ['Diajukan', 'masuk ' + (d.proposed.clockIn || '(tetap)') + ', pulang ' + (d.proposed.clockOut ? d.proposed.clockOut + (d.proposed.nextDay ? ' (+1 hari)' : '') : '(tetap)')],
      ['Alasan', d.reason]
    ];
  }

  function decideModal(it, decision, done) {
    var form = h('form', { class: 'stack', novalidate: true });
    var minutes = null;
    var loanF = null;
    if (decision === 'setuju' && it.detail.kind === 'loan') {
      var dd = it.detail;
      var la = MklUI.moneyPreview(MklUI.field({ label: 'Jumlah disetujui (Rp)', name: 'loanAmount', type: 'number', inputmode: 'numeric', required: true, value: String(dd.requestedAmount) }));
      var opts = [];
      for (var i = 1; i <= 12; i++) opts.push({ value: String(i), label: i === 1 ? '1 kali (sekaligus)' : i + ' kali gajian' });
      var li = MklUI.selectField({ label: 'Jumlah cicilan', name: 'loanInstallments', value: String(dd.requestedInstallments), options: opts });
      var lm = MklUI.field({ label: 'Mulai dipotong dari gaji bulan', name: 'loanStartMonth', type: 'month', required: true, value: dd.suggestedStartMonth, hint: 'Gaji bulan X = periode 27 bulan sebelumnya s.d. 26 bulan X.' });
      var calc = h('p', { class: 'money-preview' });
      var upd = function () {
        var amt = Number(String(la.input.value).replace(/\D/g, '')) || 0, n = Number(li.input.value) || 1;
        calc.textContent = amt ? 'Dipotong ' + n + '× ' + MklUI.fmtMoney(Math.ceil(amt / n)) + ' per gajian' + (n > 1 && Math.ceil(amt / n) * n !== amt ? ' (cicilan terakhir menyesuaikan)' : '') : '';
      };
      la.input.addEventListener('input', upd); li.input.addEventListener('change', upd); upd();
      [la.wrap, li.wrap, calc, lm.wrap].forEach(function (x) { form.appendChild(x); });
      loanF = { a: la, i: li, m: lm };
    }
    if (decision === 'setuju' && it.detail.kind === 'overtime') {
      minutes = MklUI.field({ label: 'Menit lembur disetujui', name: 'approvedMinutes', type: 'number', inputmode: 'numeric', value: String(it.detail.minutes), hint: 'Boleh lebih sedikit dari yang diajukan (' + it.detail.minutes + ' menit).' });
      form.appendChild(minutes.wrap);
    }
    var note = MklUI.field({ label: decision === 'tolak' ? 'Alasan penolakan' : 'Catatan (opsional)', name: 'note', required: decision === 'tolak', multiline: true, rows: 2, maxLength: 300, hint: 'Catatan ini dikirim ke karyawan.' });
    var alertSlot = h('div');
    form.insertBefore(h('p', null, h('strong', null, it.employee.fullName), ' · ' + it.typeLabel), form.firstChild);
    form.appendChild(note.wrap);
    form.appendChild(alertSlot);
    var ctl = MklUI.modal({
      title: decision === 'tolak' ? 'Tolak pengajuan' : 'Setujui pengajuan', content: form,
      actions: [{ label: 'Batal', onClick: function (c) { c.close(); } },
        { label: decision === 'tolak' ? 'Tolak' : 'Setujui', variant: decision === 'tolak' ? 'danger' : 'primary', id: 'ok', onClick: submit }]
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });
    function submit(c, btn) {
      MklUI.clearFieldErrors(form);
      MklUI.clear(alertSlot);
      var p = { approvalId: it.approvalId, decision: decision, note: note.input.value.trim() };
      if (minutes && minutes.input.value) p.approvedMinutes = Number(minutes.input.value);
      if (loanF) { p.loanAmount = Number(loanF.a.input.value || 0); p.loanInstallments = Number(loanF.i.input.value); p.loanStartMonth = loanF.m.input.value; }
      MklUI.setBusy(btn, true, 'Menyimpan...');
      MklApi.call('approvals.decide', p).then(function (res) {
        MklUI.setBusy(btn, false);
        if (!res.success) { if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message)); return; }
        c.close();
        MklUI.toast(res.message, 'success');
        done();
      });
    }
  }

  function overtimeCreate(done) {
    var form = h('form', { class: 'stack', novalidate: true });
    var emp = MklUI.selectField({ label: 'Karyawan', name: 'employeeId', required: true, options: [{ value: '', label: 'Memuat...' }] });
    var date = MklUI.field({ label: 'Tanggal lembur', name: 'workDate', type: 'date', required: true, value: MklUI.todayYmd() });
    var s = MklUI.field({ label: 'Jam mulai', name: 'startTime', type: 'time', required: true });
    var e = MklUI.field({ label: 'Jam selesai', name: 'endTime', type: 'time', required: true });
    var reason = MklUI.field({ label: 'Alasan / pekerjaan', name: 'reason', required: true, multiline: true, rows: 2, maxLength: 300 });
    var alertSlot = h('div');
    [h('p', { class: 'muted small' }, 'Lembur yang Anda catat untuk karyawan lain langsung tercatat disetujui, dan karyawan mendapat notifikasi.'), emp.wrap, date.wrap, s.wrap, e.wrap, reason.wrap, alertSlot].forEach(function (x) { form.appendChild(x); });
    MklApi.call('hr.employees.list', { status: 'active', pageSize: 100 }).then(function (res) {
      MklUI.clear(emp.input);
      emp.input.appendChild(h('option', { value: '' }, '— Pilih karyawan —'));
      if (res.success) res.data.items.forEach(function (x) { emp.input.appendChild(h('option', { value: x.employeeId }, x.fullName + ' (' + x.employeeId + ')')); });
    });
    var ctl = MklUI.modal({
      title: 'Catat lembur karyawan', content: form,
      actions: [{ label: 'Batal', onClick: function (c) { c.close(); } }, { label: 'Simpan', variant: 'primary', id: 'ok', onClick: submit }]
    });
    form.addEventListener('submit', function (ev) { ev.preventDefault(); submit(ctl, ctl.buttons.ok); });
    function submit(c, btn) {
      MklUI.clearFieldErrors(form);
      MklUI.clear(alertSlot);
      MklUI.setBusy(btn, true, 'Menyimpan...');
      MklApi.call('hr.overtime.create', { employeeId: emp.input.value, workDate: date.input.value, startTime: s.input.value, endTime: e.input.value, reason: reason.input.value.trim() }).then(function (res) {
        MklUI.setBusy(btn, false);
        if (!res.success) { if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message)); return; }
        c.close();
        MklUI.toast(res.message, 'success');
        done();
      });
    }
  }

  MklNav.register('/persetujuan', {
    title: 'Persetujuan',
    perm: APPROVE,
    menu: { label: 'Persetujuan', order: 9.8, section: 'Jadwal & Absensi' },
    render: function (root) {
      var otBtn = MklState.can('overtime.manage') ? h('button', { class: 'btn btn-secondary', type: 'button' }, 'Catat Lembur Karyawan') : null;
      root.appendChild(MklUI.pageHeader('Persetujuan', 'Cuti, izin, sakit, lembur, koreksi absensi, data diri, dan kasbon yang menunggu keputusan.', otBtn));
      var view = 'menunggu';
      var tabPending = h('button', { class: 'tab', type: 'button', role: 'tab', 'aria-selected': 'true' }, 'Menunggu');
      var tabHistory = h('button', { class: 'tab', type: 'button', role: 'tab', 'aria-selected': 'false' }, 'Riwayat');
      root.appendChild(h('div', { class: 'tabs', role: 'tablist' }, tabPending, tabHistory));
      var area = h('div');
      root.appendChild(area);
      function setView(v) {
        view = v;
        tabPending.setAttribute('aria-selected', v === 'menunggu' ? 'true' : 'false');
        tabHistory.setAttribute('aria-selected', v === 'riwayat' ? 'true' : 'false');
        load();
      }
      tabPending.addEventListener('click', function () { setView('menunggu'); });
      tabHistory.addEventListener('click', function () { setView('riwayat'); });
      if (otBtn) otBtn.addEventListener('click', function () { overtimeCreate(load); });

      function load() {
        MklUI.clear(area).appendChild(MklUI.loadingState('Memuat...'));
        MklApi.call('approvals.list', { view: view }).then(function (res) {
          MklUI.clear(area);
          if (!res.success) { area.appendChild(MklUI.errorState(res, load)); return; }
          var items = res.data.items;
          if (view === 'menunggu') {
            tabPending.textContent = 'Menunggu (' + items.filter(function (i) { return i.canDecide; }).length + ')';
            if (!items.length) { area.appendChild(MklUI.card(null, MklUI.emptyState('Tidak ada pengajuan yang menunggu.'))); return; }
            items.forEach(function (it) { area.appendChild(pendingCard(it)); });
          } else {
            area.appendChild(MklUI.card('Keputusan 60 hari terakhir', MklUI.table([
              { label: 'Diputuskan', render: function (it) { return MklUI.fmtDateTime(it.decidedAt || it.submittedAt); } },
              { label: 'Karyawan', render: function (it) { return it.employee.fullName; } },
              { label: 'Pengajuan', render: function (it) { return h('span', null, MklUI.badge(it.typeLabel, TYPE_VARIANT[it.type]), ' ', summaryText(it)); } },
              { label: 'Status', render: function (it) { return MklRequests.statusBadge(it.status, it.statusLabel); } },
              { label: 'Oleh', render: function (it) { return it.decidedBy; } },
              { label: 'Catatan', render: function (it) { return it.note ? h('span', { class: 'small' }, it.note) : ''; } },
              { label: 'Aksi', className: 'col-action', render: function (it) {
                if (!it.canCancelApproved) return '';
                var b = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Batalkan Cuti');
                b.addEventListener('click', function () {
                  MklUI.confirmAction({
                    title: 'Batalkan cuti yang sudah disetujui',
                    message: h('p', null, it.employee.fullName + ': ' + summaryText(it) + '. Saldo cuti tahunan dikembalikan dan karyawan diberi tahu.'),
                    confirmLabel: 'Batalkan Cuti', danger: true, reasonLabel: 'Alasan', reasonRequired: true,
                    onConfirm: function (reason) {
                      return MklApi.call('hr.leave.cancel', { leaveId: it.requestId, reason: reason }).then(function (r) {
                        if (r.success) { MklUI.toast(r.message, 'success'); load(); }
                        return r;
                      });
                    }
                  });
                });
                return b;
              } }
            ], items, 'Belum ada keputusan.')));
          }
        });
      }

      function summaryText(it) {
        var d = it.detail;
        if (d.kind === 'leave') return d.leaveType.split(' (')[0] + ', ' + range(d.startDate, d.endDate) + ' (' + d.totalDays + ' hari)';
        if (d.kind === 'overtime') return MklUI.fmtDate(d.workDate) + ' ' + d.startTime + '–' + d.endTime + (d.approvedMinutes ? ' (' + d.approvedMinutes + ' m disetujui)' : '');
        if (d.kind === 'loan') return MklUI.fmtMoney(d.amount || d.requestedAmount) + (d.installments ? ', ' + d.installments + '× cicilan' : '');
        if (d.kind === 'identity') return 'KTP ' + String(d.proposed.idNumber).slice(-4).replace(/^/, '****');
        return MklUI.fmtDate(d.workDate);
      }

      function pendingCard(it) {
        var actions = h('div', { class: 'form-actions' });
        if (it.canDecide) {
          var ok = h('button', { class: 'btn btn-primary', type: 'button' }, 'Setujui');
          var no = h('button', { class: 'btn btn-danger', type: 'button' }, 'Tolak');
          ok.addEventListener('click', function () { decideModal(it, 'setuju', load); });
          no.addEventListener('click', function () { decideModal(it, 'tolak', load); });
          actions.appendChild(ok);
          actions.appendChild(no);
        } else {
          actions.appendChild(h('p', { class: 'muted small' }, MklState.user && it.employee.employeeId === MklState.user.employeeId
            ? 'Ini pengajuan Anda sendiri; diputuskan oleh Direktur atau pengelola HR lain.' : 'Anda tidak bisa memutuskan pengajuan ini.'));
        }
        return h('section', { class: 'card approval-card' },
          h('div', { class: 'card-head' },
            h('h2', { class: 'card-title' }, it.employee.fullName),
            MklUI.badge(it.typeLabel, TYPE_VARIANT[it.type])),
          h('p', { class: 'muted small' }, (it.employee.positionName ? it.employee.positionName + ' · ' : '') + 'diajukan ' + MklUI.fmtDateTime(it.submittedAt) + (it.submittedBy ? ' oleh ' + it.submittedBy : '')),
          MklUI.infoList(detailRows(it)),
          actions);
      }

      load();
    }
  });
})();
