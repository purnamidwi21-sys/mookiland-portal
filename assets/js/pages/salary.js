/*
 * Profil Gaji (Payroll): jenis gaji, tarif, aturan jam, dan rekening bank.
 * Hanya pemegang permission payroll; nomor rekening lengkap hanya bank.read.all.
 */
(function () {
  'use strict';
  var h = MklUI.h;

  function hoursText(min) { return min ? (Math.round(min / 6) / 10) + ' jam' : '-'; }

  function profileForm(item, done) {
    var p = item.profile || {};
    var form = h('form', { class: 'stack', novalidate: true });
    var payType = MklUI.selectField({ label: 'Jenis gaji', name: 'payType', required: true, value: p.payType || 'harian', options: [{ value: 'harian', label: 'Harian (dibayar per jam hadir)' }, { value: 'bulanan', label: 'Bulanan (gaji tetap)' }] });
    var daily = MklUI.field({ label: 'Tarif harian (Rp)', name: 'dailyRate', type: 'number', inputmode: 'numeric', value: p.dailyRate ? String(p.dailyRate) : '', hint: 'Tarif per jam = tarif harian ÷ 8.' });
    var monthly = MklUI.field({ label: 'Gaji bulanan (Rp)', name: 'monthlySalary', type: 'number', inputmode: 'numeric', value: p.monthlySalary ? String(p.monthlySalary) : '' });
    var cap = MklUI.selectField({ label: 'Jam dibayar per hari (maksimal)', name: 'paidHoursCap', value: String(p.paidHoursCap || 8), options: [{ value: '8', label: '8 jam (lembur dihitung setelah 8 jam)' }, { value: '9', label: '9 jam (lembur dihitung setelah 9 jam)' }] });
    var rounding = MklUI.checkboxField({ label: 'Bulatkan jam masuk ke jam shift', name: 'clockinRounding', checked: item.profile ? p.clockinRounding : true, hint: 'Sesuai tabel pembulatan di file gaji (misalnya masuk 07:50 dihitung 08:00).' });
    var ot = MklUI.checkboxField({ label: 'Dapat upah lembur', name: 'overtimeEligible', checked: item.profile ? p.overtimeEligible : true, hint: 'Lembur = lama hadir di atas batas jam, minimal 15 menit, 1× tarif per jam.' });
    var shortfall = MklUI.checkboxField({ label: 'Potong jam kurang (khusus bulanan)', name: 'shortfallDeduction', checked: !!p.shortfallDeduction, hint: 'Pada hari hadir, jam di bawah jam wajib dipotong gaji ÷ 173 per jam.' });
    var req = MklUI.field({ label: 'Jam wajib per hari (menit, termasuk istirahat)', name: 'requiredMinutes', type: 'number', inputmode: 'numeric', value: p.requiredMinutes ? String(p.requiredMinutes) : '540', hint: '540 menit = 9 jam.' });
    var eff = MklUI.field({ label: 'Berlaku mulai', name: 'effectiveFrom', type: 'date', required: true, value: MklUI.todayYmd(), hint: 'Periode yang berakhir sebelum tanggal ini tetap memakai tarif lama.' });
    var reason = MklUI.field({ label: 'Alasan', name: 'reason', required: true, multiline: true, rows: 2, maxLength: 300, placeholder: 'Contoh: tarif awal, kenaikan tarif' });
    var alertSlot = h('div');
    [payType.wrap, daily.wrap, monthly.wrap, cap.wrap, rounding.wrap, ot.wrap, shortfall.wrap, req.wrap, eff.wrap, reason.wrap, alertSlot].forEach(function (x) { form.appendChild(x); });
    function sync() {
      var harian = payType.input.value === 'harian';
      daily.wrap.hidden = !harian;
      monthly.wrap.hidden = harian;
      shortfall.wrap.hidden = harian;
      req.wrap.hidden = harian || !shortfall.input.checked;
    }
    payType.input.addEventListener('change', function () {
      if (!item.profile) ot.input.checked = payType.input.value === 'harian';
      sync();
    });
    shortfall.input.addEventListener('change', sync);
    sync();
    var ctl = MklUI.modal({
      title: 'Profil gaji: ' + item.fullName, content: form,
      actions: [{ label: 'Batal', onClick: function (c) { c.close(); } }, { label: 'Simpan', variant: 'primary', id: 'ok', onClick: submit }]
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });
    function submit(c, btn) {
      MklUI.clearFieldErrors(form);
      MklUI.clear(alertSlot);
      var harian = payType.input.value === 'harian';
      var payload = {
        employeeId: item.employeeId, payType: payType.input.value, paidHoursCap: Number(cap.input.value), clockinRounding: rounding.input.checked,
        overtimeEligible: ot.input.checked, effectiveFrom: eff.input.value, reason: reason.input.value.trim()
      };
      if (harian) payload.dailyRate = Number(daily.input.value || 0);
      else {
        payload.monthlySalary = Number(monthly.input.value || 0);
        payload.shortfallDeduction = shortfall.input.checked;
        if (shortfall.input.checked) payload.requiredMinutes = Number(req.input.value || 0);
      }
      MklUI.setBusy(btn, true, 'Menyimpan...');
      MklApi.call('hr.payroll.saveProfile', payload).then(function (res) {
        MklUI.setBusy(btn, false);
        if (!res.success) { if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message)); return; }
        c.close();
        MklUI.toast(res.message, 'success');
        done();
      });
    }
  }

  function bankForm(item, done) {
    var form = h('form', { class: 'stack', novalidate: true });
    var bank = MklUI.field({ label: 'Bank', name: 'bankName', required: true, maxLength: 40, placeholder: 'Contoh: BCA, BRI, Mandiri' });
    var no = MklUI.field({ label: 'Nomor rekening', name: 'accountNo', required: true, inputmode: 'numeric', maxLength: 20, hint: 'Angka saja, tanpa spasi atau titik.' });
    var holder = MklUI.field({ label: 'Atas nama', name: 'accountHolder', required: true, maxLength: 80 });
    var reason = MklUI.field({ label: 'Alasan', name: 'reason', required: true, multiline: true, rows: 2, maxLength: 300, placeholder: 'Contoh: rekening gaji baru dari karyawan' });
    var alertSlot = h('div');
    [bank.wrap, no.wrap, holder.wrap, reason.wrap, alertSlot].forEach(function (x) { form.appendChild(x); });
    var ctl = MklUI.modal({
      title: 'Rekening: ' + item.fullName, content: form,
      actions: [{ label: 'Batal', onClick: function (c) { c.close(); } }, { label: 'Simpan', variant: 'primary', id: 'ok', onClick: submit }]
    });
    MklApi.call('hr.payroll.bankGet', { employeeId: item.employeeId }).then(function (res) {
      if (res.success && res.data.bank) {
        bank.input.value = res.data.bank.bankName;
        no.input.value = res.data.bank.accountNo;
        holder.input.value = res.data.bank.accountHolder;
      } else if (!res.success) alertSlot.appendChild(MklUI.alertBox('error', res.message));
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });
    function submit(c, btn) {
      MklUI.clearFieldErrors(form);
      MklUI.clear(alertSlot);
      MklUI.setBusy(btn, true, 'Menyimpan...');
      MklApi.call('hr.payroll.bankSave', { employeeId: item.employeeId, bankName: bank.input.value.trim(), accountNo: no.input.value.replace(/[\s.-]/g, ''), accountHolder: holder.input.value.trim(), reason: reason.input.value.trim() }).then(function (res) {
        MklUI.setBusy(btn, false);
        if (!res.success) { if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message)); return; }
        c.close();
        MklUI.toast(res.message, 'success');
        done();
      });
    }
  }

  function historyModal(item) {
    var body = h('div', null, MklUI.loadingState('Memuat...'));
    MklUI.modal({ title: 'Riwayat profil gaji: ' + item.fullName, content: body, wide: true, actions: [{ label: 'Tutup', onClick: function (c) { c.close(); } }] });
    MklApi.call('hr.payroll.profileHistory', { employeeId: item.employeeId }).then(function (res) {
      MklUI.clear(body);
      if (!res.success) { body.appendChild(MklUI.alertBox('error', res.message)); return; }
      body.appendChild(MklUI.table([
        { label: 'Berlaku mulai', render: function (p) { return MklUI.fmtDate(p.effectiveFrom); } },
        { label: 'Jenis', render: function (p) { return p.payTypeLabel; } },
        { label: 'Tarif / gaji', render: function (p) { return p.payType === 'harian' ? MklUI.fmtMoney(p.dailyRate) + '/hari' : MklUI.fmtMoney(p.monthlySalary) + '/bulan'; } },
        { label: 'Maks jam', render: function (p) { return p.paidHoursCap + ' jam'; } },
        { label: 'Alasan', render: function (p) { return p.reason; } },
        { label: 'Disimpan', render: function (p) { return MklUI.fmtDateTime(p.savedAt) + (p.savedBy ? ' oleh ' + p.savedBy : ''); } }
      ], res.data.items, 'Belum ada profil gaji.'));
    });
  }

  MklNav.register('/profil-gaji', {
    title: 'Profil Gaji',
    perm: 'payroll.prepare',
    menu: { label: 'Profil Gaji', order: 19, section: 'Penggajian' },
    render: function (root) {
      root.appendChild(MklUI.pageHeader('Profil Gaji', 'Jenis gaji, tarif, aturan jam, dan rekening setiap karyawan.'));
      var area = h('div');
      root.appendChild(area);
      function load() {
        MklUI.clear(area).appendChild(MklUI.loadingState('Memuat...'));
        MklApi.call('hr.payroll.profiles', {}).then(function (res) {
          MklUI.clear(area);
          if (!res.success) { area.appendChild(MklUI.errorState(res, load)); return; }
          var d = res.data;
          var missing = d.items.filter(function (i) { return !i.profile; }).length;
          if (missing) area.appendChild(MklUI.alertBox('warning', missing + ' karyawan aktif belum punya profil gaji dan tidak akan dihitung gajinya.'));
          area.appendChild(MklUI.card(null, [
            h('div', { class: 'recap-table' }, MklUI.table([
              { label: 'Nama', render: function (i) { return h('span', null, h('strong', null, i.fullName), h('br'), h('span', { class: 'muted small' }, i.employeeId + (i.positionName ? ' · ' + i.positionName : ''))); } },
              { label: 'Jenis', render: function (i) { return i.profile ? i.profile.payTypeLabel : MklUI.badge('Belum diatur', 'warning'); } },
              { label: 'Tarif / gaji', render: function (i) {
                if (!i.profile) return '';
                var p = i.profile;
                return h('span', null, p.payType === 'harian' ? MklUI.fmtMoney(p.dailyRate) + ' / hari' : MklUI.fmtMoney(p.monthlySalary) + ' / bulan',
                  i.upcoming ? h('span', { class: 'muted small' }, h('br'), 'Mulai ' + MklUI.fmtDate(i.upcoming.effectiveFrom) + ': ' + (i.upcoming.payType === 'harian' ? MklUI.fmtMoney(i.upcoming.dailyRate) : MklUI.fmtMoney(i.upcoming.monthlySalary))) : null);
              } },
              { label: 'Aturan', render: function (i) {
                if (!i.profile) return '';
                var p = i.profile, parts = ['maks ' + p.paidHoursCap + ' jam'];
                parts.push(p.clockinRounding ? 'jam masuk dibulatkan' : 'jam masuk asli');
                parts.push(p.overtimeEligible ? 'dapat lembur' : 'tanpa lembur');
                if (p.shortfallDeduction) parts.push('potong jam kurang dari ' + hoursText(p.requiredMinutes));
                return h('span', { class: 'small' }, parts.join(' · '));
              } },
              { label: 'Rekening', render: function (i) { return i.bank ? h('span', { class: 'small' }, i.bank.bankName + ' ' + i.bank.accountMasked) : MklUI.badge('Belum ada', 'muted'); } },
              { label: 'Aksi', className: 'col-action', render: function (i) {
                var a = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, i.profile ? 'Ubah Gaji' : 'Atur Gaji');
                a.addEventListener('click', function () { profileForm(i, load); });
                var row = h('div', { class: 'btn-row' }, a);
                if (d.canSeeBank) {
                  var b = h('button', { class: 'btn btn-ghost btn-small', type: 'button' }, 'Rekening');
                  b.addEventListener('click', function () { bankForm(i, load); });
                  row.appendChild(b);
                }
                if (i.profile) {
                  var r = h('button', { class: 'btn btn-ghost btn-small', type: 'button' }, 'Riwayat');
                  r.addEventListener('click', function () { historyModal(i); });
                  row.appendChild(r);
                }
                return row;
              } }
            ], d.items, 'Tidak ada karyawan aktif.')),
            h('p', { class: 'muted small' }, 'Perubahan tarif dicatat dengan tanggal berlaku dan tercatat di audit log payroll. Data ini hanya terlihat oleh Payroll.')
          ]));
        });
      }
      load();
    }
  });
})();
