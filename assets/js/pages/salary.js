/*
 * Profil Gaji (Payroll): jenis gaji, tarif, aturan jam, dan rekening bank.
 * Hanya pemegang permission payroll; nomor rekening lengkap hanya bank.read.all.
 */
(function () {
  'use strict';
  var h = MklUI.h;

  var lastEffective = '';

  function hoursText(min) { return min ? (Math.round(min / 6) / 10) + ' jam' : '-'; }
  var DEF_DIV = { harian: 8, bulanan: 173 };
  function num(n) { return String(Math.round(n * 100) / 100).replace('.', ','); }
  /** Rupiah dengan 2 desimal bila ada (Rp38.491,15). */
  function money2(n) {
    var c = Math.round(n * 100), frac = c % 100;
    return MklUI.fmtMoney(Math.floor(c / 100)) + (frac ? ',' + (frac < 10 ? '0' : '') + frac : '');
  }
  function hourlyText(p) {
    var base = p.payType === 'harian' ? p.dailyRate : p.monthlySalary, d = p.hourlyDivisor || DEF_DIV[p.payType];
    return 'per jam ' + money2(base / d) + ' (÷' + num(d) + ')';
  }

  function profileForm(item, done) {
    var cur = item.profile || item.upcoming;
    var p = cur || {};
    var form = h('form', { class: 'stack', novalidate: true });
    var payType = MklUI.selectField({ label: 'Jenis gaji', name: 'payType', required: true, value: p.payType || 'harian', options: [{ value: 'harian', label: 'Harian (dibayar per jam hadir)' }, { value: 'bulanan', label: 'Bulanan (gaji tetap)' }] });
    var daily = MklUI.field({ label: 'Tarif harian (Rp)', name: 'dailyRate', type: 'number', inputmode: 'numeric', value: p.dailyRate ? String(p.dailyRate) : '' });
    MklUI.moneyPreview(daily);
    var monthly = MklUI.field({ label: 'Gaji bulanan (Rp)', name: 'monthlySalary', type: 'number', inputmode: 'numeric', value: p.monthlySalary ? String(p.monthlySalary) : '' });
    MklUI.moneyPreview(monthly);
    var cap = MklUI.selectField({ label: 'Jam dibayar per hari (maksimal)', name: 'paidHoursCap', value: String(p.paidHoursCap || 8), options: [{ value: '8', label: '8 jam (lembur dihitung setelah 8 jam)' }, { value: '9', label: '9 jam (lembur dihitung setelah 9 jam)' }] });
    var rounding = MklUI.checkboxField({ label: 'Bulatkan jam masuk ke jam shift', name: 'clockinRounding', checked: cur ? p.clockinRounding : true, hint: 'Sesuai tabel pembulatan di file gaji (misalnya masuk 07:50 dihitung 08:00).' });
    var ot = MklUI.checkboxField({ label: 'Dapat upah lembur', name: 'overtimeEligible', checked: cur ? p.overtimeEligible : true, hint: 'Lembur = lama hadir di atas batas jam, minimal 15 menit, 1× tarif per jam.' });
    var shortfall = MklUI.checkboxField({ label: 'Potong jam kurang (khusus bulanan)', name: 'shortfallDeduction', checked: !!p.shortfallDeduction, hint: 'Pada hari hadir, jam di bawah jam wajib dipotong gaji ÷ 173 per jam.' });
    var div = MklUI.field({ label: 'Tarif per jam = gaji ÷', name: 'hourlyDivisor', type: 'number', inputmode: 'numeric', required: true,
      value: String(p.hourlyDivisor || DEF_DIV[p.payType || 'harian']),
      hint: 'Dipakai untuk upah per jam dan lembur. Bulanan = jam kerja per hari × hari kerja per minggu × 4,33, misalnya 7 × 6 × 4,33 = 181,86 (file gaji lama: 182) atau 8 × 5 × 4,33 = 173,2 (file gaji lama: 173). Harian: biasanya 8. Boleh pakai 2 angka di belakang koma.' });
    div.input.setAttribute('step', '0.01');
    var divPreview = h('div', { class: 'money-preview' });
    div.wrap.appendChild(divPreview);
    var req = MklUI.field({ label: 'Jam wajib per hari (menit, termasuk istirahat)', name: 'requiredMinutes', type: 'number', inputmode: 'numeric', value: p.requiredMinutes ? String(p.requiredMinutes) : '540', hint: '540 menit = 9 jam.' });
    var latestEff = item.upcoming ? item.upcoming.effectiveFrom : (item.profile ? item.profile.effectiveFrom : '');
    var eff = MklUI.field({ label: 'Berlaku mulai', name: 'effectiveFrom', type: 'date', required: true, value: latestEff || lastEffective || MklUI.todayYmd(),
      hint: latestEff ? 'Profil sekarang berlaku sejak ' + MklUI.fmtDate(latestEff) + '. Biarkan tanggal ini untuk memperbaiki angka; isi tanggal sesudahnya untuk kenaikan tarif.' : 'Periode yang berakhir sebelum tanggal ini tidak memakai profil ini. Untuk menghitung gaji periode lama, pilih tanggal sebelum awal periode itu.' });
    var reason = MklUI.field({ label: 'Alasan', name: 'reason', required: true, multiline: true, rows: 2, maxLength: 300, placeholder: 'Contoh: tarif awal, kenaikan tarif' });
    var alertSlot = h('div');
    [payType.wrap, daily.wrap, monthly.wrap, div.wrap, cap.wrap, rounding.wrap, ot.wrap, shortfall.wrap, req.wrap, eff.wrap, reason.wrap, alertSlot].forEach(function (x) { form.appendChild(x); });
    function sync() {
      var harian = payType.input.value === 'harian';
      daily.wrap.hidden = !harian;
      monthly.wrap.hidden = harian;
      shortfall.wrap.hidden = harian;
      req.wrap.hidden = harian || !shortfall.input.checked;
      var base = Number((harian ? daily : monthly).input.value || 0), d = Number(div.input.value || 0);
      divPreview.textContent = base > 0 && d > 0 ? 'Tarif per jam: ' + money2(base / d) : '';
    }
    payType.input.addEventListener('change', function () {
      if (!cur) ot.input.checked = payType.input.value === 'harian';
      var other = payType.input.value === 'harian' ? 'bulanan' : 'harian';
      if (!div.input.value || Number(div.input.value) === DEF_DIV[other] || (other === 'bulanan' && Number(div.input.value) > 24) || (other === 'harian' && Number(div.input.value) <= 24)) div.input.value = String(DEF_DIV[payType.input.value]);
      sync();
    });
    [daily.input, monthly.input, div.input].forEach(function (x) { x.addEventListener('input', sync); });
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
        overtimeEligible: ot.input.checked, effectiveFrom: eff.input.value, reason: reason.input.value.trim(),
        hourlyDivisor: Number(String(div.input.value || 0).replace(',', '.'))
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
        if (res.success) lastEffective = payload.effectiveFrom;
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
        { label: 'Tarif per jam', render: function (p) { return hourlyText(p).replace('per jam ', ''); } },
        { label: 'Maks jam', render: function (p) { return p.paidHoursCap + ' jam'; } },
        { label: 'Alasan', render: function (p) { return p.reason; } },
        { label: 'Disimpan', render: function (p) { return MklUI.fmtDateTime(p.savedAt) + (p.savedBy ? ' oleh ' + p.savedBy : ''); } }
      ], res.data.items, 'Belum ada profil gaji.'));
    });
  }

  function bulkEffectiveModal(ids, done) {
    var form = h('form', { class: 'stack', novalidate: true });
    var eff = MklUI.field({ label: 'Berlaku mulai (baru)', name: 'effectiveFrom', type: 'date', required: true, value: lastEffective || '', hint: 'Tarif dan aturan tidak berubah; hanya tanggal berlakunya. Untuk menghitung gaji periode lama, pilih tanggal sebelum awal periode itu (misalnya 1 Agustus untuk gaji September).' });
    var reason = MklUI.field({ label: 'Alasan', name: 'reason', required: true, multiline: true, rows: 2, maxLength: 300, value: 'Tanggal berlaku saat input awal' });
    var alertSlot = h('div');
    [h('p', null, ids.length + ' karyawan dipilih. Yang diubah adalah profil gaji terakhir masing-masing.'), eff.wrap, reason.wrap, alertSlot].forEach(function (x) { form.appendChild(x); });
    var ctl = MklUI.modal({ title: 'Ubah tanggal berlaku', content: form, actions: [
      { label: 'Batal', onClick: function (c) { c.close(); } },
      { label: 'Simpan', variant: 'primary', id: 'ok', onClick: submit }
    ] });
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });
    function submit(c, btn) {
      MklUI.clearFieldErrors(form);
      MklUI.clear(alertSlot);
      MklUI.setBusy(btn, true, 'Menyimpan...');
      MklApi.call('hr.payroll.bulkEffective', { employeeIds: ids, effectiveFrom: eff.input.value, reason: reason.input.value.trim() }).then(function (res) {
        MklUI.setBusy(btn, false);
        if (!res.success) { if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message)); return; }
        lastEffective = eff.input.value;
        c.close();
        MklUI.toast(res.message, res.data.skipped.length ? 'warning' : 'success');
        if (res.data.skipped.length) {
          MklUI.modal({ title: 'Tidak diubah (' + res.data.skipped.length + ')', content: MklUI.table([
            { label: 'Karyawan', render: function (x) { return x.fullName + ' (' + x.employeeId + ')'; } },
            { label: 'Alasan', render: function (x) { return x.reason; } }
          ], res.data.skipped, ''), actions: [{ label: 'Tutup', onClick: function (c2) { c2.close(); } }] });
        }
        done();
      });
    }
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
          var missing = d.items.filter(function (i) { return !i.profile && !i.upcoming; }).length;
          if (missing) area.appendChild(MklUI.alertBox('warning', missing + ' karyawan aktif belum punya profil gaji dan tidak akan dihitung gajinya.'));
          var selected = {};
          var withProfile = d.items.filter(function (i) { return i.profile || i.upcoming; });
          var bulkBtn = h('button', { class: 'btn btn-secondary btn-small', type: 'button', disabled: true }, 'Ubah Tanggal Berlaku (0)');
          var allBox = h('input', { type: 'checkbox', id: 'sal-all' });
          var boxes = [];
          function refresh() {
            var n = Object.keys(selected).length;
            bulkBtn.textContent = 'Ubah Tanggal Berlaku (' + n + ')';
            bulkBtn.disabled = !n;
            allBox.checked = n > 0 && n === withProfile.length;
          }
          allBox.addEventListener('change', function () {
            boxes.forEach(function (b) { b.box.checked = allBox.checked; if (allBox.checked) selected[b.id] = true; else delete selected[b.id]; });
            refresh();
          });
          bulkBtn.addEventListener('click', function () { bulkEffectiveModal(Object.keys(selected), load); });
          area.appendChild(MklUI.card(null, [
            withProfile.length ? h('div', { class: 'btn-row bulk-bar' }, h('label', { class: 'checkbox-inline', for: 'sal-all' }, allBox, ' Pilih semua yang punya profil'), bulkBtn) : null,
            h('div', { class: 'recap-table' }, MklUI.table([
              { label: 'Pilih', className: 'col-check', render: function (i) {
                if (!i.profile && !i.upcoming) return '';
                var bx = h('input', { type: 'checkbox', 'aria-label': 'Pilih ' + i.fullName });
                bx.addEventListener('change', function () { if (bx.checked) selected[i.employeeId] = true; else delete selected[i.employeeId]; refresh(); });
                boxes.push({ id: i.employeeId, box: bx });
                return bx;
              } },
              { label: 'Nama', render: function (i) { return h('span', null, h('strong', null, i.fullName), h('br'), h('span', { class: 'muted small' }, i.employeeId + (i.positionName ? ' · ' + i.positionName : ''))); } },
              { label: 'Jenis', render: function (i) { return i.profile ? i.profile.payTypeLabel : (i.upcoming ? i.upcoming.payTypeLabel : MklUI.badge('Belum diatur', 'warning')); } },
              { label: 'Tarif / gaji', render: function (i) {
                if (!i.profile && !i.upcoming) return '';
                var p = i.profile || i.upcoming;
                return h('span', null, p.payType === 'harian' ? MklUI.fmtMoney(p.dailyRate) + ' / hari' : MklUI.fmtMoney(p.monthlySalary) + ' / bulan',
                  h('span', { class: 'muted small' }, h('br'), (i.profile ? 'berlaku sejak ' : 'mulai berlaku ') + MklUI.fmtDate(p.effectiveFrom)),
                  i.profile && i.upcoming ? h('span', { class: 'muted small' }, h('br'), 'Mulai ' + MklUI.fmtDate(i.upcoming.effectiveFrom) + ': ' + (i.upcoming.payType === 'harian' ? MklUI.fmtMoney(i.upcoming.dailyRate) : MklUI.fmtMoney(i.upcoming.monthlySalary))) : null);
              } },
              { label: 'Aturan', render: function (i) {
                if (!i.profile && !i.upcoming) return '';
                var p = i.profile || i.upcoming, parts = [hourlyText(p), 'maks ' + p.paidHoursCap + ' jam'];
                parts.push(p.clockinRounding ? 'jam masuk dibulatkan' : 'jam masuk asli');
                parts.push(p.overtimeEligible ? 'dapat lembur' : 'tanpa lembur');
                if (p.shortfallDeduction) parts.push('potong jam kurang dari ' + hoursText(p.requiredMinutes));
                return h('span', { class: 'small' }, parts.join(' · '));
              } },
              { label: 'Rekening', render: function (i) { return i.bank ? h('span', { class: 'small' }, i.bank.bankName + ' ' + i.bank.accountMasked) : MklUI.badge('Belum ada', 'muted'); } },
              { label: 'Aksi', className: 'col-action', render: function (i) {
                var a = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, i.profile || i.upcoming ? 'Ubah Gaji' : 'Atur Gaji');
                a.addEventListener('click', function () { profileForm(i, load); });
                var row = h('div', { class: 'btn-row' }, a);
                if (d.canSeeBank) {
                  var b = h('button', { class: 'btn btn-ghost btn-small', type: 'button' }, 'Rekening');
                  b.addEventListener('click', function () { bankForm(i, load); });
                  row.appendChild(b);
                }
                if (i.profile || i.upcoming) {
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
