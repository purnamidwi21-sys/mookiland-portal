/*
 * Susun Jadwal (mingguan) dan Shift & Lokasi.
 * Hak akses diperiksa server: penyusun jadwal tim hanya melihat dan
 * mengubah anggota timnya.
 */
(function () {
  'use strict';
  var h = MklUI.h;
  var T = window.MklTimeUI;
  var OFF = 'LIBUR';

  // ================================================================== Susun Jadwal

  MklNav.register('/jadwal', {
    title: 'Susun Jadwal',
    perm: ['schedule.manage.all', 'schedule.manage.team'],
    menu: { label: 'Susun Jadwal', order: 10, section: 'Jadwal & Absensi' },
    render: function (root) {
      var weekStart = T.mondayOf(MklUI.todayYmd());
      var data = null;
      var pending = {}; // 'empId|date' -> shiftId | 'LIBUR' | ''

      var saveBtn = h('button', { class: 'btn btn-secondary', type: 'button' }, 'Simpan Draf');
      var pubBtn = h('button', { class: 'btn btn-primary', type: 'button' }, 'Terbitkan');
      var copyBtn = h('button', { class: 'btn btn-secondary', type: 'button' }, 'Salin dari Minggu Lalu');
      root.appendChild(MklUI.pageHeader('Susun Jadwal', 'Atur shift per karyawan per hari, lalu terbitkan agar terlihat oleh karyawan.'));

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

      function paintGrid() {
        var active = data.shifts.filter(function (s) { return s.active; });
        if (!active.length) {
          area.appendChild(MklUI.card(null, [MklUI.alertBox('warning', 'Belum ada shift aktif.'),
            MklState.can('schedule.manage.all') ? h('p', null, h('a', { href: '#/shift' }, 'Buat shift di menu Shift & Lokasi')) : h('p', null, 'Minta HR membuat shift terlebih dahulu.')]));
        }
        if (!data.employees.length) {
          area.appendChild(MklUI.card(null, MklUI.emptyState('Belum ada karyawan aktif yang bisa Anda jadwalkan.')));
          return;
        }
        var today = MklUI.todayYmd();
        var thead = h('thead', null, h('tr', null, h('th', { scope: 'col', class: 'sched-name' }, 'Karyawan'),
          data.dates.map(function (d) {
            return h('th', { scope: 'col', class: d === today ? 'is-today' : null }, T.DAYS_SHORT[T.weekday(d)], h('br'), h('span', { class: 'muted small' }, String(Number(d.slice(8)))));
          })));
        var tbody = h('tbody');
        data.employees.forEach(function (e) {
          var row = h('tr', null, h('th', { scope: 'row', class: 'sched-name' }, h('span', null, e.nickname || e.fullName), h('span', { class: 'muted small' }, e.positionName || '')));
          data.dates.forEach(function (d) {
            var cell = (data.cells[e.employeeId] || {})[d] || {};
            var current = cell.shiftId || '';
            var sel = h('select', { class: 'input sched-select', 'aria-label': (e.nickname || e.fullName) + ', ' + T.dayLabel(d) });
            sel.appendChild(h('option', { value: '' }, '–'));
            sel.appendChild(h('option', { value: OFF }, 'Libur'));
            data.shifts.forEach(function (s) {
              if (!s.active && s.shiftId !== current) return;
              sel.appendChild(h('option', { value: s.shiftId }, s.code + ' ' + s.startTime + (s.active ? '' : ' (nonaktif)')));
            });
            sel.value = current;
            var td = h('td', { class: 'sched-cell' }, sel);
            var mark = function () {
              var v = sel.value;
              var s = v && v !== OFF ? shiftById(v) : null;
              td.className = 'sched-cell' + (v === OFF ? ' is-off' : '') + (s ? ' shift-bg-' + s.color : '') +
                (pending[e.employeeId + '|' + d] !== undefined ? ' is-dirty' : (cell.status === 'draft' ? ' is-draft' : ''));
              sel.title = s ? s.name + ' ' + s.startTime + '–' + s.endTime : (v === OFF ? 'Libur' : 'Belum dijadwalkan');
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
            active.map(function (s) { return h('span', null, T.shiftChip(s), ' ' + s.name + ' ' + s.startTime + '–' + s.endTime); }))
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
