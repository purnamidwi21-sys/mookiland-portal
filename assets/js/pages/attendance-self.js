/*
 * Jadwal dan absensi milik karyawan sendiri: Absen (GPS), Jadwal Saya,
 * Absensi Saya. Juga fungsi bersama untuk halaman jadwal/absensi lain
 * (MklTimeUI).
 *
 * Jam absen selalu jam server. Posisi GPS dikirim ke server dan diperiksa
 * di sana; jarak yang tampil di layar hanya perkiraan.
 */
(function () {
  'use strict';
  var h = MklUI.h;

  var DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  var DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  var MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var STATUS_VARIANT = {
    hadir: 'success', terlambat: 'warning', pulang_cepat: 'warning', terlambat_pulang_cepat: 'warning',
    sedang_bekerja: 'info', tidak_lengkap: 'warning', alpa: 'danger', libur: 'muted', belum_absen: 'info',
    terjadwal: 'muted', tanpa_jadwal: 'warning', kosong: 'muted', cuti: 'info', sakit: 'info', izin: 'info', cuti_khusus: 'info'
  };

  function parse(ymd) { var p = ymd.split('-').map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2])); }
  function ymd(d) { return d.toISOString().slice(0, 10); }

  var T = {
    DAYS: DAYS, DAYS_SHORT: DAYS_SHORT, MONTHS: MONTHS,
    addDays: function (s, n) { var d = parse(s); d.setUTCDate(d.getUTCDate() + n); return ymd(d); },
    weekday: function (s) { return parse(s).getUTCDay(); },
    mondayOf: function (s) { var wd = T.weekday(s); return T.addDays(s, wd === 0 ? -6 : 1 - wd); },
    /** 'Senin, 2 Nov' */
    dayLabel: function (s, withYear) {
      var d = parse(s);
      return DAYS[d.getUTCDay()] + ', ' + d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()].slice(0, 3) + (withYear ? ' ' + d.getUTCFullYear() : '');
    },
    rangeLabel: function (from, to) { return MklUI.fmtDate(from) + ' – ' + MklUI.fmtDate(to); },
    monthLabel: function (ym) { var p = ym.split('-').map(Number); return MONTHS[p[1] - 1] + ' ' + p[0]; },
    /** 125 -> '2 j 5 m' */
    fmtMinutes: function (m) {
      m = m || 0;
      if (!m) return '0 m';
      var hh = Math.floor(m / 60), mm = m % 60;
      return (hh ? hh + ' j' : '') + (hh && mm ? ' ' : '') + (mm ? mm + ' m' : '');
    },
    statusBadge: function (status, label) { return MklUI.badge(label || status, STATUS_VARIANT[status] || 'muted'); },
    isLeave: function (status) { return status === 'cuti' || status === 'sakit' || status === 'izin' || status === 'cuti_khusus'; },
    shiftChip: function (shift) {
      if (!shift) return null;
      return h('span', { class: 'shift-chip shift-' + (shift.color || 'biru') }, shift.code);
    },
    shiftText: function (shift) { return shift ? shift.name + ' ' + shift.startTime + '–' + shift.endTime : ''; },
    /** Jarak dua titik dalam meter (perkiraan, untuk tampilan). */
    distanceM: function (lat1, lng1, lat2, lng2) {
      var R = 6371000, toRad = function (x) { return x * Math.PI / 180; };
      var dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
      var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
      return Math.round(2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    },
    /** Posisi GPS ponsel. Hasil: Promise<{latitude, longitude, accuracy}> atau ditolak dengan pesan. */
    getPosition: function () {
      return new Promise(function (resolve, reject) {
        if (!window.navigator.geolocation) { reject(new Error('Browser ini tidak mendukung lokasi. Gunakan Chrome atau Safari terbaru di ponsel.')); return; }
        window.navigator.geolocation.getCurrentPosition(function (pos) {
          resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) });
        }, function (err) {
          var msg = 'Lokasi tidak bisa dibaca. Coba lagi di tempat terbuka.';
          if (err && err.code === 1) msg = 'Izin lokasi ditolak. Buka pengaturan browser, izinkan Lokasi untuk portal ini, lalu muat ulang halaman.';
          else if (err && err.code === 3) msg = 'Lokasi terlalu lama didapat. Pastikan GPS/Lokasi ponsel menyala, lalu coba lagi.';
          reject(new Error(msg));
        }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
      });
    },
    notLinked: function () {
      return MklUI.card(null, MklUI.alertBox('info', 'Akun Anda belum terhubung dengan data karyawan. Hubungi HR.'));
    }
  };
  window.MklTimeUI = T;

  // ================================================================== Absen

  MklNav.register('/absen', {
    title: 'Absen',
    perm: 'attendance.clock.own',
    menu: { label: 'Absen', order: 1.5 },
    render: function (root) {
      root.appendChild(MklUI.pageHeader('Absen', 'Absen masuk dan pulang dari ponsel di lokasi kerja.'));
      var area = h('div');
      root.appendChild(area);

      function load() {
        MklUI.clear(area).appendChild(MklUI.loadingState('Memuat...'));
        MklApi.call('me.attendanceToday', {}).then(function (res) {
          MklUI.clear(area);
          if (!res.success) { area.appendChild(MklUI.errorState(res, load)); return; }
          if (res.data.linked === false) { area.appendChild(T.notLinked()); return; }
          paint(res.data);
        });
      }

      function paint(d) {
        var shiftInfo;
        if (d.shift) shiftInfo = h('span', null, h('strong', null, d.shift.name), ' ' + d.shift.start + '–' + d.shift.end + (d.shift.workDate !== d.today ? ' (shift tanggal ' + MklUI.fmtDate(d.shift.workDate) + ')' : ''));
        else if (d.off) shiftInfo = MklUI.badge('Libur', 'muted');
        else shiftInfo = h('span', { class: 'muted' }, 'Tidak ada jadwal terbit');

        var status = h('div', { class: 'clock-status' },
          h('div', { class: 'clock-box' }, h('span', { class: 'muted small' }, 'Masuk'), h('span', { class: 'clock-time' }, d.clockIn || '--:--')),
          h('div', { class: 'clock-box' }, h('span', { class: 'muted small' }, 'Pulang'), h('span', { class: 'clock-time' }, d.clockOut || '--:--')));

        var alertSlot = h('div', { 'aria-live': 'polite' });
        var actions = h('div', { class: 'clock-actions' });
        var type = d.canClockOut ? 'out' : (d.canClockIn ? 'in' : null);
        if (!d.locations.length) {
          actions.appendChild(MklUI.alertBox('warning', 'Lokasi kerja belum diatur HR, sehingga absen belum bisa dilakukan.'));
        } else if (type) {
          var btn = h('button', { class: 'btn btn-primary btn-clock', type: 'button' }, type === 'in' ? 'Absen Masuk' : 'Absen Pulang');
          btn.addEventListener('click', function () { doClock(type, btn, alertSlot); });
          actions.appendChild(btn);
          if (type === 'in' && !d.shift) actions.appendChild(h('p', { class: 'muted small' }, 'Anda tidak punya jadwal saat ini. Absen tetap bisa dilakukan, tetapi akan diperiksa HR.'));
        } else {
          actions.appendChild(MklUI.alertBox('success', 'Absen hari ini sudah lengkap. Jika ada yang salah, hubungi HR.'));
        }

        area.appendChild(MklUI.card(T.dayLabel(d.today, true), [
          MklUI.infoList([['Jadwal', shiftInfo], ['Jam server', MklUI.fmtDateTime(d.serverTime)]]),
          status, actions, alertSlot
        ], 'clock-card'));
        area.appendChild(MklUI.card('Petunjuk', h('ul', { class: 'plain-list' },
          h('li', null, 'Nyalakan Lokasi/GPS di ponsel dan izinkan browser memakai lokasi.'),
          h('li', null, 'Absen hanya bisa di dalam area lokasi kerja: ' + d.locations.map(function (l) { return l.name + ' (radius ' + l.radiusM + ' m)'; }).join(', ') + '.'),
          h('li', null, 'Jam yang dicatat adalah jam server (WITA), bukan jam ponsel.'),
          h('li', null, 'Lupa absen atau ponsel bermasalah? Hubungi HR untuk dicatat manual.'))));

        function doClock(kind, button, slot) {
          MklUI.clear(slot);
          MklUI.setBusy(button, true, 'Mencari lokasi...');
          T.getPosition().then(function (pos) {
            var near = null;
            d.locations.forEach(function (l) {
              var dist = T.distanceM(pos.latitude, pos.longitude, l.latitude, l.longitude);
              if (!near || dist < near.dist) near = { l: l, dist: dist };
            });
            slot.appendChild(h('p', { class: 'muted small' }, 'Posisi terbaca: sekitar ' + near.dist + ' m dari ' + near.l.name + ' (akurasi ±' + pos.accuracy + ' m).'));
            MklUI.setBusy(button, true, 'Mengirim...');
            return MklApi.call('me.clock', { type: kind, latitude: pos.latitude.toFixed(6), longitude: pos.longitude.toFixed(6), accuracy: pos.accuracy });
          }).then(function (res) {
            MklUI.setBusy(button, false);
            if (!res.success) { slot.appendChild(MklUI.alertBox('error', res.message)); return; }
            MklUI.toast(res.message, 'success');
            load();
          }, function (err) {
            MklUI.setBusy(button, false);
            slot.appendChild(MklUI.alertBox('error', err.message));
          });
        }
      }
      load();
    }
  });

  // ================================================================== Jadwal Saya

  MklNav.register('/jadwal-saya', {
    title: 'Jadwal Saya',
    perm: 'schedule.read.own',
    menu: { label: 'Jadwal Saya', order: 3 },
    render: function (root) {
      var start = T.mondayOf(MklUI.todayYmd());
      root.appendChild(MklUI.pageHeader('Jadwal Saya', 'Jadwal shift yang sudah diterbitkan untuk Anda.'));
      var prev = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, '← Sebelumnya');
      var next = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Berikutnya →');
      var label = h('strong', { class: 'week-label' });
      root.appendChild(h('div', { class: 'week-nav' }, prev, label, next));
      var area = h('div');
      root.appendChild(area);
      prev.addEventListener('click', function () { start = T.addDays(start, -14); load(); });
      next.addEventListener('click', function () { start = T.addDays(start, 14); load(); });

      function load() {
        var end = T.addDays(start, 13);
        label.textContent = T.rangeLabel(start, end);
        MklUI.clear(area).appendChild(MklUI.loadingState('Memuat jadwal...'));
        MklApi.call('me.schedule', { from: start, to: end }).then(function (res) {
          MklUI.clear(area);
          if (!res.success) { area.appendChild(MklUI.errorState(res, load)); return; }
          if (res.data.linked === false) { area.appendChild(T.notLinked()); return; }
          var list = h('ul', { class: 'day-list' });
          res.data.days.forEach(function (d) {
            var body;
            if (d.shift) body = [T.shiftChip(d.shift), ' ', h('span', null, T.shiftText(d.shift))];
            else if (d.off) body = MklUI.badge(d.note || 'Libur', d.note ? 'info' : 'muted');
            else body = h('span', { class: 'muted' }, 'Belum ada jadwal');
            var extra = [];
            if (d.holiday) extra.push(h('span', { class: 'day-holiday' }, 'Hari libur: ' + d.holiday));
            (d.events || []).forEach(function (e) {
              extra.push(h('span', { class: 'day-event small' }, 'Event' + (e.time ? ' ' + e.time : '') + (e.area ? ' · ' + e.area : '') + ': ' + e.name + (e.summary ? ' (' + e.summary + ')' : '')));
            });
            list.appendChild(h('li', { class: 'day-item' + (d.isToday ? ' is-today' : '') + (d.holiday ? ' is-holiday' : ''), 'aria-current': d.isToday ? 'date' : null },
              h('span', { class: 'day-name' }, T.dayLabel(d.date), d.isToday ? h('span', { class: 'muted small' }, ' (hari ini)') : null),
              h('span', { class: 'day-body' }, body),
              extra.length ? h('span', { class: 'day-extra' }, extra) : null));
          });
          area.appendChild(MklUI.card(null, [list,
            h('p', { class: 'muted small' }, 'Jadwal bisa berubah. Jika ada perubahan, Anda mendapat notifikasi di ikon lonceng. Hari libur nasional dan event di park ikut ditampilkan.')]));
        });
      }
      load();
    }
  });

  // ================================================================== Absensi Saya

  /** Menit berpecahan -> "8:37:04". */
  function dur(min) {
    if (!min) return '-';
    var t = Math.round(min * 60), two = function (n) { return (n < 10 ? '0' : '') + n; };
    return Math.floor(t / 3600) + ':' + two(Math.floor(t / 60) % 60) + ':' + two(t % 60);
  }
  function shiftMonth(ym, n) { var d = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7) - 1 + n, 1)); return d.toISOString().slice(0, 7); }

  /** Absensi per periode gaji (27–26), dihitung seperti Rincian gaji tetapi tanpa angka rupiah. */
  function periodView(root) {
    var month = null;
    var prev = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, '← Periode sebelumnya');
    var next = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Periode berikutnya →');
    var label = h('strong', { class: 'week-label' });
    root.appendChild(h('div', { class: 'week-nav' }, prev, label, next));
    var area = h('div');
    root.appendChild(area);
    prev.addEventListener('click', function () { month = shiftMonth(month, -1); load(); });
    next.addEventListener('click', function () { month = shiftMonth(month, 1); load(); });
    function load() {
      MklUI.clear(area).appendChild(MklUI.loadingState('Memuat absensi...'));
      MklApi.call('me.attendancePeriod', month ? { month: month } : {}).then(function (res) {
        MklUI.clear(area);
        if (!res.success) { area.appendChild(MklUI.errorState(res, load)); return; }
        var d = res.data;
        if (d.linked === false) { area.appendChild(T.notLinked()); return; }
        month = d.month;
        label.textContent = 'Gaji ' + T.monthLabel(d.month) + ' (' + T.rangeLabel(d.from, d.to) + ')';
        next.disabled = d.month >= d.currentMonth;
        var s = d.summary;
        var srcText = d.source === 'final' ? MklUI.alertBox('success', 'Sesuai gaji yang sudah disetujui Direktur.')
          : (d.source === 'tanpa_profil' ? MklUI.alertBox('info', 'Jam absen apa adanya. Jam kerja dan lembur tampil setelah HR mengatur profil gaji Anda.')
            : MklUI.alertBox('info', 'Perkiraan dari data absensi terbaru' + (d.periodStatus ? ' (gaji: ' + d.periodStatus + ')' : '') + '. Angka bisa berubah bila HR mengoreksi absensi.'));
        area.appendChild(MklUI.card('Ringkasan', [srcText,
          h('div', { class: 'stats' },
            stat('Hari hadir', s.present), stat('Lama hadir', dur(s.spanMinutes)), stat('Jam kerja dihitung', dur(s.workMinutes)),
            stat('Lembur', d.overtimeEligible ? dur(s.overtimeMinutes) : 'tidak ada', s.overtimeMinutes ? 'info' : null),
            s.shortMinutes ? stat('Jam kurang', dur(s.shortMinutes), 'warning') : null,
            stat('Belum absen pulang', s.incomplete, s.incomplete ? 'warning' : null)),
          d.rule ? h('p', { class: 'muted small' }, 'Aturan jam masuk: ' + d.rule + '. Jam kerja dihitung paling banyak ' + d.paidHoursCap + ' jam per hari; selebihnya lembur' + (d.overtimeEligible ? ' (minimal 15 menit)' : '') + '.') : null]));
        var canFix = d.canRequestCorrection && window.MklRequests;
        area.appendChild(MklUI.card('Rincian harian', [
          h('div', { class: 'recap-table' }, MklUI.table([
            { label: 'Tanggal', render: function (x) { return T.dayLabel(x.date); } },
            { label: 'Masuk', render: function (x) { return h('span', null, x.clockIn, x.countedIn ? h('span', { class: 'muted small' }, h('br'), 'dihitung ' + x.countedIn) : null); } },
            { label: 'Pulang', render: function (x) { return x.clockOut || MklUI.badge('Belum absen pulang', 'warning'); } },
            { label: 'Istirahat', render: function (x) { return x.breakMinutes ? dur(x.breakMinutes) : '-'; } },
            { label: 'Lama hadir', render: function (x) { return dur(x.spanMinutes); } },
            { label: 'Jam kerja', render: function (x) { return dur(x.workMinutes); } },
            { label: 'Lembur', render: function (x) { return x.overtimeMinutes ? dur(x.overtimeMinutes) : '-'; } },
            { label: 'Catatan', render: function (x) { return h('span', { class: 'small' }, x.shortMinutes ? 'Kurang ' + dur(x.shortMinutes) + (x.note ? '; ' : '') : '', x.note || ''); } },
            canFix ? { label: 'Koreksi', className: 'col-action', render: function (x) {
              if (x.correctionPending) return MklUI.badge('Koreksi menunggu', 'warning');
              var b = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Ajukan Koreksi');
              b.addEventListener('click', function () { MklRequests.correctionForm({ date: x.date, clockIn: (x.clockIn || '').slice(0, 5), clockOut: (x.clockOut || '').slice(0, 5), onDone: load }); });
              return b;
            } } : null
          ].filter(Boolean), d.days, 'Belum ada absensi pada periode ini.')),
          h('p', { class: 'muted small' }, 'Durasi dalam jam:menit:detik. "Dihitung" = jam mulai kerja yang dipakai untuk gaji (dibulatkan ke jam shift). ' +
            (canFix ? 'Jam salah? Tekan Ajukan Koreksi pada tanggal tersebut. Tidak absen sama sekali pada suatu hari? Tekan Koreksi Tanggal Lain.' : 'Jika ada data yang salah, hubungi HR.')),
          canFix ? h('div', { class: 'form-actions' }, (function () {
            var b = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Koreksi Tanggal Lain');
            b.addEventListener('click', function () { MklRequests.correctionForm({ onDone: load }); });
            return b;
          })()) : null
        ]));
      });
    }
    load();
  }

  MklNav.register('/absensi-saya', {
    title: 'Absensi Saya',
    perm: 'attendance.read.own',
    menu: { label: 'Absensi Saya', order: 4 },
    render: function (root) {
      root.appendChild(MklUI.pageHeader('Absensi Saya', 'Jam masuk, pulang, jam kerja, dan lembur Anda.'));
      var tabPeriod = h('button', { class: 'tab', type: 'button', role: 'tab', 'aria-selected': 'true' }, 'Per Periode Gaji');
      var tabMonth = h('button', { class: 'tab', type: 'button', role: 'tab', 'aria-selected': 'false' }, 'Jadwal & Status');
      root.appendChild(h('div', { class: 'tabs', role: 'tablist' }, tabPeriod, tabMonth));
      var body = h('div');
      root.appendChild(body);
      function show(which) {
        tabPeriod.setAttribute('aria-selected', which === 'period' ? 'true' : 'false');
        tabMonth.setAttribute('aria-selected', which === 'month' ? 'true' : 'false');
        MklUI.clear(body);
        if (which === 'period') periodView(body); else monthView(body);
      }
      tabPeriod.addEventListener('click', function () { show('period'); });
      tabMonth.addEventListener('click', function () { show('month'); });
      show('period');
    }
  });

  /** Tampilan lama: per bulan kalender, dibandingkan dengan jadwal shift. */
  function monthView(root) {
    var month = MklUI.todayYmd().slice(0, 7);
    root.appendChild(h('p', { class: 'muted small' }, 'Catatan jam masuk dan pulang per bulan kalender, dibandingkan dengan jadwal shift yang diterbitkan.'));
    var prev = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, '← Bulan lalu');
    var next = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Bulan berikutnya →');
    var label = h('strong', { class: 'week-label' });
    root.appendChild(h('div', { class: 'week-nav' }, prev, label, next));
    var area = h('div');
    root.appendChild(area);
    function shift(n) {
      var p = month.split('-').map(Number);
      var d = new Date(Date.UTC(p[0], p[1] - 1 + n, 1));
      month = d.toISOString().slice(0, 7);
      load();
    }
    prev.addEventListener('click', function () { shift(-1); });
    next.addEventListener('click', function () { shift(1); });

    function load() {
      label.textContent = T.monthLabel(month);
      next.disabled = month >= MklUI.todayYmd().slice(0, 7);
      MklUI.clear(area).appendChild(MklUI.loadingState('Memuat absensi...'));
      MklApi.call('me.attendance', { month: month }).then(function (res) {
        MklUI.clear(area);
        if (!res.success) { area.appendChild(MklUI.errorState(res, load)); return; }
        if (res.data.linked === false) { area.appendChild(T.notLinked()); return; }
        var s = res.data.summary;
        area.appendChild(MklUI.card('Ringkasan', h('div', { class: 'stats' },
          stat('Hari terjadwal', s.scheduled), stat('Hadir', s.present),
          stat('Terlambat', s.late + (s.late ? ' (' + T.fmtMinutes(s.lateMinutes) + ')' : ''), s.late ? 'warning' : null),
          stat('Tidak hadir', s.absent, s.absent ? 'warning' : null),
          stat('Belum absen pulang', s.incomplete, s.incomplete ? 'warning' : null),
          stat('Cuti / sakit / izin', (s.leave || 0) + ' / ' + (s.sick || 0) + ' / ' + (s.permit || 0)),
          stat('Total jam kerja', T.fmtMinutes(s.workedMinutes)))));
        var today = MklUI.todayYmd();
        var canFix = res.data.canRequestCorrection && window.MklRequests;
        var days = res.data.days.filter(function (d) { return d.status !== 'kosong'; });
        area.appendChild(MklUI.card('Rincian harian', [
          MklUI.table([
            { label: 'Tanggal', render: function (d) { return T.dayLabel(d.date); } },
            { label: 'Jadwal', render: function (d) { return d.shift ? h('span', null, T.shiftChip(d.shift), ' ' + d.shift.startTime + '–' + d.shift.endTime) : (d.off ? 'Libur' : '-'); } },
            { label: 'Masuk', render: function (d) { return d.clockIn; } },
            { label: 'Pulang', render: function (d) { return d.clockOut ? d.clockOut + (d.clockOutNextDay ? ' (+1)' : '') : ''; } },
            { label: 'Status', render: function (d) { return T.statusBadge(d.status, d.statusLabel); } },
            { label: 'Terlambat', render: function (d) { return d.lateMinutes ? d.lateMinutes + ' menit' : ''; } },
            canFix ? { label: 'Koreksi', className: 'col-action', render: function (d) {
              if (d.correctionPending) return MklUI.badge('Koreksi menunggu', 'warning');
              if (d.date > today || d.status === 'libur' || T.isLeave(d.status)) return '';
              var b = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Ajukan Koreksi');
              b.addEventListener('click', function () { MklRequests.correctionForm({ date: d.date, clockIn: d.clockIn, clockOut: d.clockOut, onDone: load }); });
              return b;
            } } : null
          ].filter(Boolean), days, 'Belum ada jadwal atau absen di bulan ini.'),
          h('p', { class: 'muted small' }, canFix ? 'Lupa absen atau jam salah? Tekan Ajukan Koreksi pada tanggal tersebut. Manajer Operasional akan memeriksanya.' : 'Jika ada data yang salah (misalnya lupa absen), hubungi HR.')
        ]));
      });
    }
    load();
  }

  function stat(label, value, variant) {
    return h('div', { class: 'stat' + (variant ? ' stat-' + variant : '') },
      h('span', { class: 'stat-value' }, String(value)), h('span', { class: 'stat-label' }, label));
  }
  T.stat = stat;
})();
