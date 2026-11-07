/*
 * Kirim pesan WhatsApp ke staff (0.18.0).
 * Portal hanya menyiapkan nomor dan isi pesan lalu membuka WhatsApp di HP/komputer pengirim
 * (tautan wa.me). Pengirim sendiri yang menekan Kirim, dari nomornya sendiri. Tidak ada API key.
 * Nomor HP hanya diberikan server kepada Manajer Operasional / HR (hak akses diperiksa server).
 */
(function () {
  'use strict';
  var h = MklUI.h;

  function link(phone, text) {
    return 'https://wa.me/' + encodeURIComponent(phone) + '?text=' + encodeURIComponent(text || '');
  }

  /**
   * Tombol buka WhatsApp untuk satu staff. rec: { employeeId, name, phone, waText }.
   * Mencatat di audit (tanpa isi pesan) saat ditekan.
   */
  function button(rec, topic, opts) {
    opts = opts || {};
    if (!rec.phone) return h('span', { class: 'small muted wa-nophone' }, rec.name + ' belum punya nomor HP di data karyawan.');
    var a = h('a', { class: 'btn btn-wa ' + (opts.small === false ? '' : 'btn-small'), href: link(rec.phone, rec.waText), target: '_blank', rel: 'noopener noreferrer' },
      opts.label || ('Kirim WA ke ' + rec.name));
    a.addEventListener('click', function () {
      a.classList.add('is-opened');
      MklApi.call('wa.logSend', { employeeIds: [rec.employeeId], topic: topic || 'Pesan' }).then(function () { /* catatan audit saja */ });
      if (opts.onOpen) opts.onOpen();
    });
    return a;
  }

  /** Daftar "Kabari staff" setelah jadwal diubah. list: [{ employeeId, name, phone, waText, label }] */
  function notifyList(list, topic) {
    return h('div', { class: 'stack' },
      h('p', null, 'Notifikasi portal sudah dikirim. Agar pasti terbaca, kabari juga lewat WhatsApp: tekan tombol di bawah, WhatsApp akan terbuka dengan pesan siap kirim, lalu tekan Kirim.'),
      h('ul', { class: 'wa-list' }, list.map(function (r) {
        return h('li', null,
          h('div', { class: 'wa-who' }, h('strong', null, r.name), r.label ? h('span', { class: 'small muted' }, ' ' + r.label) : null),
          h('p', { class: 'wa-preview small' }, r.waText),
          button(r, topic));
      })));
  }

  window.MklWaUI = { link: link, button: button, notifyList: notifyList };

  // ================================================================== halaman Kirim Pesan WA
  var TEMPLATES = [
    { id: 'bebas', label: 'Tulis sendiri', text: 'Halo {nama}, ' },
    { id: 'jadwal', label: 'Perubahan jadwal', text: 'Halo {nama}, ada perubahan jadwal Anda. Silakan cek menu Jadwal Saya di portal Mookiland. Mohon balas untuk konfirmasi. Terima kasih.' },
    { id: 'panggil', label: 'Minta bantuan masuk', text: 'Halo {nama}, apakah bisa bantu masuk hari ini? Mohon segera balas. Terima kasih.' },
    { id: 'absen', label: 'Pengingat absen', text: 'Halo {nama}, jangan lupa absen masuk dan pulang di portal Mookiland ya. Terima kasih.' },
    { id: 'info', label: 'Info umum', text: 'Halo {nama}, ada pengumuman baru di portal Mookiland. Silakan buka menu Pengumuman. Terima kasih.' }
  ];

  MklNav.register('/kirim-wa', {
    title: 'Kirim Pesan WA',
    perm: ['schedule.manage.all', 'employee.manage'],
    menu: { label: 'Kirim Pesan WA', order: 10.3, section: 'Jadwal & Absensi' },
    render: function (root) {
      root.appendChild(MklUI.pageHeader('Kirim Pesan WA',
        'Pilih staff dan tulis pesan. WhatsApp di HP atau komputer Anda akan terbuka dengan pesan siap kirim, lalu Anda tekan Kirim. Pesan terkirim dari nomor Anda sendiri.'));
      var area = h('div', null, MklUI.loadingState('Memuat daftar staff...'));
      root.appendChild(area);
      MklApi.call('wa.recipients', {}).then(function (res) {
        MklUI.clear(area);
        if (!res.success) { area.appendChild(MklUI.errorState(res)); return; }
        build(res.data);
      });

      function build(data) {
        var picked = {};
        // ---- penerima
        var posSel = MklUI.selectField({ label: 'Jabatan', name: 'position', options: [{ value: '', label: 'Semua jabatan' }].concat(data.positions.map(function (p) { return { value: p, label: p }; })) });
        var search = MklUI.field({ label: 'Cari nama', name: 'q', placeholder: 'Ketik nama' });
        var list = h('ul', { class: 'wa-pick' });
        var count = h('p', { class: 'small muted', 'aria-live': 'polite' });
        var allBtn = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Pilih semua yang tampil');
        var noneBtn = h('button', { class: 'btn btn-ghost btn-small', type: 'button' }, 'Kosongkan pilihan');
        function visible() {
          var pos = posSel.input.value, q = search.input.value.trim().toLowerCase();
          return data.staff.filter(function (s) {
            return (!pos || s.position === pos) && (!q || (s.name + ' ' + s.fullName).toLowerCase().indexOf(q) !== -1);
          });
        }
        function paintList() {
          MklUI.clear(list);
          visible().forEach(function (s) {
            var cb = h('input', { type: 'checkbox', id: 'wa-' + s.employeeId, checked: picked[s.employeeId] ? true : null, disabled: s.phone ? null : true });
            cb.addEventListener('change', function () { if (cb.checked) picked[s.employeeId] = true; else delete picked[s.employeeId]; paintCount(); });
            list.appendChild(h('li', { class: s.phone ? '' : 'is-disabled' },
              cb, h('label', { for: 'wa-' + s.employeeId }, h('span', { class: 'wa-name' }, s.name), h('span', { class: 'small muted' }, ' ' + (s.position || '-')), s.phone ? null : MklUI.badge('Belum ada nomor HP', 'muted'))));
          });
          if (!list.children.length) list.appendChild(h('li', { class: 'muted' }, 'Tidak ada staff yang cocok.'));
          paintCount();
        }
        function paintCount() { count.textContent = Object.keys(picked).length + ' staff dipilih.'; }
        posSel.input.addEventListener('change', paintList);
        search.input.addEventListener('input', paintList);
        allBtn.addEventListener('click', function () { visible().forEach(function (s) { if (s.phone) picked[s.employeeId] = true; }); paintList(); });
        noneBtn.addEventListener('click', function () { picked = {}; paintList(); });
        area.appendChild(MklUI.card('1. Pilih penerima', h('div', { class: 'stack' },
          h('div', { class: 'form-grid' }, posSel.wrap, search.wrap),
          h('div', { class: 'form-actions' }, allBtn, noneBtn), list, count)));

        // ---- pesan
        var tpl = MklUI.selectField({ label: 'Jenis pesan', name: 'template', options: TEMPLATES.map(function (t) { return { value: t.id, label: t.label }; }) });
        var msg = MklUI.field({ label: 'Isi pesan', name: 'message', multiline: true, rows: 5, maxLength: 1000, value: TEMPLATES[0].text,
          hint: 'Tulis {nama} untuk memasukkan nama panggilan staff secara otomatis.' });
        tpl.input.addEventListener('change', function () {
          var t = TEMPLATES.filter(function (x) { return x.id === tpl.input.value; })[0];
          msg.input.value = t.text;
        });
        area.appendChild(MklUI.card('2. Tulis pesan', h('div', { class: 'stack' }, tpl.wrap, msg.wrap)));

        // ---- kirim
        var prep = h('button', { class: 'btn btn-primary', type: 'button' }, 'Siapkan Pesan');
        var out = h('div');
        area.appendChild(MklUI.card('3. Kirim', h('div', { class: 'stack' },
          h('p', { class: 'small muted' }, 'WhatsApp hanya bisa membuka satu penerima sekali tekan. Tekan tombol tiap staff satu per satu.'), prep, out)));
        prep.addEventListener('click', function () {
          MklUI.clear(out);
          var ids = Object.keys(picked);
          var text = msg.input.value.trim();
          if (!ids.length) { out.appendChild(MklUI.alertBox('error', 'Pilih minimal satu staff.')); return; }
          if (text.length < 5) { out.appendChild(MklUI.alertBox('error', 'Isi pesan minimal 5 karakter.')); return; }
          var topic = (TEMPLATES.filter(function (x) { return x.id === tpl.input.value; })[0] || {}).label || 'Pesan';
          var recs = data.staff.filter(function (s) { return picked[s.employeeId]; }).map(function (s) {
            return { employeeId: s.employeeId, name: s.name, phone: s.phone, label: s.position, waText: text.replace(/\{nama\}/gi, s.name) };
          });
          var done = h('p', { class: 'small muted', 'aria-live': 'polite' });
          var opened = 0;
          out.appendChild(h('ul', { class: 'wa-list' }, recs.map(function (r) {
            return h('li', null,
              h('div', { class: 'wa-who' }, h('strong', null, r.name), h('span', { class: 'small muted' }, ' ' + r.label)),
              h('p', { class: 'wa-preview small' }, r.waText),
              button(r, topic, { label: 'Buka WhatsApp', onOpen: function () { opened++; done.textContent = opened + ' dari ' + recs.length + ' sudah dibuka.'; } }));
          })));
          out.appendChild(done);
        });
        paintList();
      }
    }
  });
})();
