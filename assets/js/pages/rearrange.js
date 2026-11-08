/*
 * Atur Ulang Jadwal (0.18.0): perubahan jadwal mendadak, hari ini sampai 7 hari ke depan.
 * 1. Tandai staff yang tidak masuk (jadwal aslinya tidak diubah; hanya tidak dihitung di pola).
 * 2. Server mengusulkan susunan baru yang sesuai pola minimal shift: pindah shift sesama jabatan
 *    dan/atau memanggil staff yang libur, dengan perubahan paling sedikit.
 * 3. Manajer memilih usulan + alasan; jadwal terbit berubah, staff dapat notifikasi, lalu bisa
 *    dikabari lewat WhatsApp (dibuka di HP/komputer pengirim).
 * Semua hak akses dan pemeriksaan pola dilakukan server.
 */
(function () {
  'use strict';
  var h = MklUI.h;
  var T = window.MklTimeUI;

  function actionText(a) {
    if (a.type === 'double') return 'Double shift: ' + a.name + ' dari ' + a.fromLabel + ' menjadi ' + a.label + ' (dibayar per jam)';
    return a.type === 'call'
      ? 'Panggil ' + a.name + ' (sedang libur) masuk ' + a.label
      : 'Pindahkan ' + a.name + ' dari ' + a.fromLabel + ' ke ' + a.label;
  }

  MklNav.register('/atur-ulang', {
    title: 'Atur Ulang Jadwal',
    perm: ['schedule.manage.all'],
    menu: { label: 'Atur Ulang Jadwal', order: 10.2, section: 'Jadwal & Absensi' },
    render: function (root) {
      var addBtn = h('button', { class: 'btn btn-primary', type: 'button' }, 'Tandai Tidak Masuk');
      root.appendChild(MklUI.pageHeader('Atur Ulang Jadwal',
        'Untuk perubahan mendadak, hari ini sampai 7 hari ke depan. Tandai staff yang tidak masuk, lalu pilih susunan baru yang sesuai pola minimal shift.', addBtn));
      var absArea = h('div', null, MklUI.loadingState('Memuat...'));
      var sugArea = h('div');
      root.appendChild(MklUI.card('Staff tidak masuk', absArea));
      root.appendChild(h('h2', { class: 'section-title' }, 'Kekurangan staff dan usulan'));
      root.appendChild(sugArea);
      var listData = null;
      addBtn.addEventListener('click', function () { if (listData) markModal(); });

      function load() {
        MklUI.clear(sugArea).appendChild(MklUI.loadingState('Mencari susunan yang sesuai pola...'));
        MklApi.call('time.rearrange.list', {}).then(function (res) {
          if (!res.success) { MklUI.clear(absArea).appendChild(MklUI.errorState(res, load)); return; }
          paintAbsences(res.data);
        });
        loadSuggest();
      }
      function loadSuggest() {
        MklApi.call('time.rearrange.suggest', {}).then(function (res) {
          if (!res.success) { MklUI.clear(sugArea).appendChild(MklUI.errorState(res, loadSuggest)); return; }
          paintSuggest(res.data);
        });
      }

      // ------------------------------------------------------------ daftar tidak masuk
      function paintAbsences(d) {
        listData = d;
        MklUI.clear(absArea);
        if (!d.absences.length) {
          absArea.appendChild(h('p', { class: 'muted' }, 'Belum ada staff yang ditandai tidak masuk untuk ' + MklUI.fmtDate(d.from) + ' – ' + MklUI.fmtDate(d.to) + '.'));
          return;
        }
        absArea.appendChild(MklUI.table([
          { label: 'Tanggal', render: function (r) { return T.dayLabel(r.date); } },
          { label: 'Staff', render: function (r) { return h('span', null, h('strong', null, r.name), h('br'), h('span', { class: 'small muted' }, r.position)); } },
          { label: 'Jadwal', render: function (r) { return r.shift; } },
          { label: 'Alasan', render: function (r) { return h('span', null, MklUI.badge(r.reasonLabel, r.reason === 'tanpa_kabar' ? 'danger' : 'warning'), r.note ? h('span', { class: 'small muted' }, ' ' + r.note) : null); } },
          { label: '', render: function (r) {
            var b = h('button', { class: 'btn btn-ghost btn-small', type: 'button' }, 'Batalkan');
            b.addEventListener('click', function () {
              MklUI.confirmAction({ title: 'Batalkan tanda tidak masuk?', message: r.name + ' pada ' + T.dayLabel(r.date, true) + ' akan dihitung lagi di pola minimal shift.',
                confirmLabel: 'Batalkan Tanda', onConfirm: function () {
                  return MklApi.call('time.rearrange.cancelAbsent', { absenceId: r.absenceId }).then(function (res) {
                    if (res.success) { MklUI.toast(res.message, 'success'); paintAbsences(res.data); loadSuggest(); }
                    return res;
                  });
                } });
            });
            return b;
          } }
        ], d.absences));
      }

      function markModal() {
        var d = listData;
        var form = h('form', { class: 'stack', novalidate: true });
        var emp = MklUI.selectField({ label: 'Staff', name: 'employeeId', required: true,
          options: [{ value: '', label: 'Pilih staff' }].concat(d.staff.map(function (s) { return { value: s.employeeId, label: s.name + ' (' + (s.position || '-') + ')' }; })) });
        var from = MklUI.field({ label: 'Dari tanggal', name: 'from', type: 'date', required: true, value: d.from });
        var to = MklUI.field({ label: 'Sampai tanggal', name: 'to', type: 'date', value: d.from, hint: 'Paling jauh ' + MklUI.fmtDate(d.to) + '.' });
        [from.input, to.input].forEach(function (i) { i.min = d.from; i.max = d.to; });
        var reason = MklUI.selectField({ label: 'Alasan', name: 'reason', required: true, options: Object.keys(d.reasons).map(function (k) { return { value: k, label: d.reasons[k] }; }) });
        var note = MklUI.field({ label: 'Catatan', name: 'note', maxLength: 300, placeholder: 'Misalnya: kabar lewat WA pukul 07.10' });
        var alertSlot = h('div');
        [emp.wrap, h('div', { class: 'form-grid' }, from.wrap, to.wrap), reason.wrap, note.wrap,
          h('p', { class: 'small muted' }, 'Jadwal staff ini tidak diubah dan absensinya tetap tercatat apa adanya. Cuti, izin, atau sakit resmi tetap diajukan lewat portal.'), alertSlot]
          .forEach(function (x) { form.appendChild(x); });
        var m = MklUI.modal({ title: 'Tandai tidak masuk', content: form, actions: [
          { label: 'Batal', onClick: function (x) { x.close(); } }, { label: 'Simpan', variant: 'primary', id: 'ok', onClick: submit }] });
        form.addEventListener('submit', function (e) { e.preventDefault(); submit(m, m.buttons.ok); });
        function submit(x, btn) {
          MklUI.clearFieldErrors(form); MklUI.clear(alertSlot);
          MklUI.setBusy(btn, true, 'Menyimpan...');
          MklApi.call('time.rearrange.markAbsent', { employeeId: emp.input.value, from: from.input.value, to: to.input.value, reason: reason.input.value, note: note.input.value.trim() }).then(function (res) {
            MklUI.setBusy(btn, false);
            if (!res.success) { if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message)); return; }
            x.close();
            MklUI.toast(res.message, 'success');
            paintAbsences(res.data);
            loadSuggest();
          });
        }
      }

      // ------------------------------------------------------------ usulan
      function paintSuggest(s) {
        MklUI.clear(sugArea);
        if (!s.hasRules) {
          sugArea.appendChild(MklUI.alertBox('info', 'Pola minimal shift belum diatur. Atur dulu di Susun Jadwal > Pola Minimal.'));
          return;
        }
        if (!s.problems.length) {
          sugArea.appendChild(MklUI.alertBox('success', 'Semua jabatan sesuai pola minimal shift untuk ' + MklUI.fmtDate(s.from) + ' – ' + MklUI.fmtDate(s.to) + '.'));
          return;
        }
        s.problems.forEach(function (p) {
          var body = h('div', { class: 'stack' });
          body.appendChild(h('p', { class: 'ru-now' },
            MklUI.badge('Sekarang ' + p.now, 'danger'), ' ', h('span', { class: 'small muted' }, 'Pola yang boleh: ' + p.allowed.join(', '))));
          if (p.absent.length) body.appendChild(h('p', { class: 'small' }, 'Tidak masuk: ' + p.absent.join(', ')));
          if (!p.solutions.length) {
            body.appendChild(h('div', { class: 'alert alert-warning' },
              h('p', { class: 'ru-p' }, 'Tidak ada susunan yang sesuai dengan memindah shift atau memanggil staff yang libur.'),
              h('p', { class: 'ru-p' }, 'Ubah manual di ', h('a', { href: '#/jadwal' }, 'Susun Jadwal'), ' atau hubungi staff lewat ', h('a', { href: '#/kirim-wa' }, 'Kirim Pesan WA'), '.')));
          }
          p.solutions.forEach(function (sol, i) {
            var apply = h('button', { class: 'btn btn-primary btn-small', type: 'button' }, 'Terapkan');
            apply.addEventListener('click', function () { applyModal(p, sol); });
            body.appendChild(h('div', { class: 'ru-sol' },
              h('div', { class: 'ru-sol-main' },
                h('p', { class: 'ru-sol-title' }, p.solutions.length > 1 ? 'Usulan ' + (i + 1) : 'Usulan'),
                h('ul', { class: 'ru-actions' }, sol.actions.map(function (a) { return h('li', null, actionText(a)); })),
                h('p', { class: 'small' }, 'Hasil: ', MklUI.badge(p.position + ' ' + sol.result + ' ✓', 'success'))),
              apply));
          });
          sugArea.appendChild(MklUI.card(T.dayLabel(p.date) + ', ' + p.position, body, 'ru-card'));
        });
      }

      function applyModal(p, sol) {
        var form = h('form', { class: 'stack', novalidate: true });
        var reason = MklUI.field({ label: 'Alasan (dikirim ke staff)', name: 'reason', required: true, maxLength: 300,
          value: p.absent.length ? 'Menggantikan ' + p.absent.join(', ') + '.' : 'Memenuhi pola minimal shift.' });
        var alertSlot = h('div');
        [h('p', null, T.dayLabel(p.date, true) + ', ' + p.position + ': ' + p.now + ' menjadi ' + sol.result + '.'),
          h('ul', { class: 'ru-actions' }, sol.actions.map(function (a) { return h('li', null, actionText(a)); })),
          reason.wrap, h('p', { class: 'small muted' }, 'Jadwal terbit langsung berubah dan staff mendapat notifikasi di portal/HP.'), alertSlot]
          .forEach(function (x) { form.appendChild(x); });
        var m = MklUI.modal({ title: 'Terapkan usulan', content: form, actions: [
          { label: 'Batal', onClick: function (x) { x.close(); } }, { label: 'Terapkan', variant: 'primary', id: 'ok', onClick: submit }] });
        form.addEventListener('submit', function (e) { e.preventDefault(); submit(m, m.buttons.ok); });
        function submit(x, btn) {
          MklUI.clearFieldErrors(form); MklUI.clear(alertSlot);
          MklUI.setBusy(btn, true, 'Menyimpan...');
          MklApi.call('time.rearrange.apply', { date: p.date, position: p.position, reason: reason.input.value.trim(),
            actions: sol.actions.map(function (a) { return a.type + ':' + a.employeeId + ':' + a.shiftId; }) }).then(function (res) {
            MklUI.setBusy(btn, false);
            if (!res.success) {
              if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message));
              if (res.errorCode === 'CONFLICT') loadSuggest();
              return;
            }
            x.close();
            MklUI.toast(res.message, 'success');
            paintSuggest(res.data.suggestions);
            MklUI.modal({ title: 'Kabari staff', content: MklWaUI.notifyList(res.data.notify, 'Atur ulang jadwal'),
              actions: [{ label: 'Selesai', variant: 'primary', onClick: function (c) { c.close(); } }] });
          });
        }
      }

      load();
    }
  });
})();
