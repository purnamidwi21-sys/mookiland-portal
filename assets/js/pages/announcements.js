/*
 * Pengumuman: dibaca semua pengguna, dikelola HR.
 * Isi pengumuman ditampilkan sebagai teks biasa (tanpa HTML).
 */
(function () {
  'use strict';
  var h = MklUI.h;

  function body(text) { return h('div', { class: 'announcement-body' }, text); }

  function meta(a) {
    return h('p', { class: 'muted small' }, [a.categoryLabel, a.publishedAt ? MklUI.fmtDateTime(a.publishedAt) : '', a.audienceType === 'positions' ? 'Untuk: ' + a.audienceLabel : ''].filter(Boolean).join(' · '));
  }

  // ================================================================== daftar (semua pengguna)

  MklNav.register('/pengumuman', {
    title: 'Pengumuman',
    perm: 'announcement.read',
    menu: { label: 'Pengumuman', order: 2 },
    render: function (root) {
      root.appendChild(MklUI.pageHeader('Pengumuman', 'Informasi dari perusahaan untuk Anda.'));
      var list = h('div');
      root.appendChild(list);
      function load() {
        MklUI.clear(list).appendChild(MklUI.loadingState('Memuat pengumuman...'));
        MklApi.call('announcements.feed', {}).then(function (res) {
          MklUI.clear(list);
          if (!res.success) { list.appendChild(MklUI.errorState(res, load)); return; }
          if (!res.data.items.length) { list.appendChild(MklUI.card(null, MklUI.emptyState('Belum ada pengumuman.'))); return; }
          res.data.items.forEach(function (a) {
            var badges = [];
            if (a.canAcknowledge && !a.read) badges.push(MklUI.badge('Baru', 'info'));
            if (a.requiresAck && a.canAcknowledge && !a.acknowledged) badges.push(MklUI.badge('Perlu konfirmasi', 'warning'));
            var preview = a.body.length > 220 ? a.body.slice(0, 220) + '…' : a.body;
            list.appendChild(h('section', { class: 'card announcement-card' + (a.canAcknowledge && !a.read ? ' is-unread' : '') },
              h('h2', { class: 'card-title' }, h('a', { href: '#/pengumuman/' + a.announcementId }, a.title), ' ', h('span', { class: 'badge-row' }, badges)),
              meta(a), body(preview),
              h('div', { class: 'form-actions' }, h('a', { class: 'btn btn-secondary btn-small', href: '#/pengumuman/' + a.announcementId }, 'Baca selengkapnya'))));
          });
        });
      }
      load();
    }
  });

  MklNav.register('/pengumuman/:id', {
    title: 'Pengumuman',
    perm: 'announcement.read',
    render: function (root, params) {
      root.appendChild(h('p', null, h('a', { href: '#/pengumuman' }, '← Semua pengumuman')));
      var area = h('div');
      root.appendChild(area);
      function load() {
        MklUI.clear(area).appendChild(MklUI.loadingState('Memuat...'));
        MklApi.call('announcements.feed', {}).then(function (res) {
          MklUI.clear(area);
          if (!res.success) { area.appendChild(MklUI.errorState(res, load)); return; }
          var a = res.data.items.filter(function (x) { return x.announcementId === params.id; })[0];
          if (!a) { area.appendChild(MklUI.card(null, MklUI.emptyState('Pengumuman tidak ditemukan, sudah diarsipkan, atau bukan untuk Anda.'))); return; }
          if (a.canAcknowledge && !a.read) {
            MklApi.call('announcements.markRead', { announcementId: a.announcementId }).then(function () { if (window.MklApp && MklApp.refreshNotifications) MklApp.refreshNotifications(); });
          }
          var foot = [];
          if (a.requiresAck && a.canAcknowledge) {
            if (a.acknowledged) foot.push(MklUI.alertBox('success', 'Anda sudah mengonfirmasi telah membaca pengumuman ini.'));
            else {
              var ack = h('button', { class: 'btn btn-primary', type: 'button' }, 'Saya sudah membaca dan memahami');
              ack.addEventListener('click', function () {
                MklUI.setBusy(ack, true);
                MklApi.call('announcements.acknowledge', { announcementId: a.announcementId }).then(function (r) {
                  MklUI.setBusy(ack, false);
                  if (!r.success) { MklUI.toast(r.message, 'error'); return; }
                  MklUI.toast(r.message, 'success');
                  load();
                });
              });
              foot.push(MklUI.alertBox('warning', 'Pengumuman ini memerlukan konfirmasi bahwa Anda sudah membacanya.'), h('div', { class: 'form-actions' }, ack));
            }
          }
          area.appendChild(MklUI.pageHeader(a.title));
          area.appendChild(MklUI.card(null, [meta(a), body(a.body), a.expiresAt ? h('p', { class: 'muted small' }, 'Tampil sampai ' + MklUI.fmtDate(a.expiresAt)) : null].concat(foot)));
        });
      }
      load();
    }
  });

  // ================================================================== kelola (HR)

  MklNav.register('/kelola-pengumuman', {
    title: 'Kelola Pengumuman',
    perm: 'announcement.manage',
    menu: { label: 'Kelola Pengumuman', order: 17, section: 'SDM' },
    render: function (root) {
      var state = { status: 'all' };
      var results = h('div', { class: 'results' });
      var add = h('button', { class: 'btn btn-primary', type: 'button' }, 'Buat Pengumuman');
      add.addEventListener('click', function () { openForm(null); });
      var status = MklUI.selectField({ label: 'Status', name: 'status', value: 'all', options: [
        { value: 'all', label: 'Semua' }, { value: 'draft', label: 'Draf' }, { value: 'published', label: 'Terbit' }, { value: 'archived', label: 'Diarsipkan' }] });
      status.input.addEventListener('change', function () { state.status = status.input.value; load(); });
      root.appendChild(MklUI.pageHeader('Kelola Pengumuman', 'Buat draf, terbitkan, dan lihat siapa yang sudah membaca.', add));
      root.appendChild(MklUI.card(null, [h('div', { class: 'filters' }, status.wrap), results]));

      var STATUS = { draft: ['Draf', 'info'], published: ['Terbit', 'success'], archived: ['Diarsipkan', 'muted'] };

      function load() {
        MklUI.clear(results).appendChild(MklUI.loadingState('Memuat...'));
        MklApi.call('hr.announcements.list', { status: state.status }).then(function (res) {
          MklUI.clear(results);
          if (!res.success) { results.appendChild(MklUI.errorState(res, load)); return; }
          results.appendChild(MklUI.table([
            { label: 'Judul', render: function (a) { return h('span', null, h('strong', null, a.title), h('br'), h('span', { class: 'muted small' }, a.categoryLabel + ' · ' + a.audienceLabel + (a.requiresAck ? ' · wajib konfirmasi' : ''))); } },
            { label: 'Status', render: function (a) { return MklUI.badge(STATUS[a.status][0], STATUS[a.status][1]); } },
            { label: 'Terbit', render: function (a) { return a.publishedAt ? MklUI.fmtDateTime(a.publishedAt) : '-'; } },
            { label: 'Dibaca', render: function (a) { return a.stats ? a.stats.read + ' dari ' + a.stats.targets + (a.requiresAck ? ' (konfirmasi ' + a.stats.acknowledged + ')' : '') : '-'; } },
            { label: 'Aksi', className: 'col-action', render: function (a) {
              var acts = [];
              if (a.status === 'draft') {
                acts.push(btn('Ubah', function () { openForm(a); }));
                acts.push(btn('Terbitkan', function () { publish(a); }, 'primary'));
              } else {
                acts.push(btn('Pembaca', function () { readers(a); }));
              }
              if (a.status !== 'archived') acts.push(btn('Arsipkan', function () { archive(a); }));
              return h('span', { class: 'badge-row' }, acts);
            } }
          ], res.data.items, 'Belum ada pengumuman.'));
        });
      }

      function btn(label, fn, variant) {
        var b = h('button', { class: 'btn btn-' + (variant || 'secondary') + ' btn-small', type: 'button' }, label);
        b.addEventListener('click', fn);
        return b;
      }

      function openForm(a) {
        MklLookups.load().then(function (lk) {
          var title = MklUI.field({ label: 'Judul', name: 'title', required: true, maxLength: 120, value: a ? a.title : '' });
          var cat = MklUI.selectField({ label: 'Kategori', name: 'category', required: true, value: a ? a.category : 'umum', options: MklLookups.options(lk, 'announcement_category') });
          var text = MklUI.field({ label: 'Isi pengumuman', name: 'body', required: true, multiline: true, rows: 8, maxLength: 5000, value: a ? a.body : '', hint: 'Teks biasa. Baris baru tetap tampil. Jangan mencantumkan data pribadi, gaji, atau password.' });
          var aud = MklUI.selectField({ label: 'Untuk', name: 'audienceType', value: a ? a.audienceType : 'all', options: [{ value: 'all', label: 'Semua karyawan' }, { value: 'positions', label: 'Jabatan tertentu' }] });
          var boxes = [];
          var posGroup = h('fieldset', { class: 'checkbox-group' }, h('legend', null, 'Jabatan'), (lk.positions || []).filter(function (p) { return p.active; }).map(function (p) {
            var c = MklUI.checkboxField({ label: p.name, name: 'pos_' + p.positionId, checked: a && a.positionIds.indexOf(p.positionId) !== -1 });
            c.input.value = p.positionId;
            boxes.push(c.input);
            return c.wrap;
          }), h('p', { class: 'field-error', 'data-error-for': 'positionIds' }));
          function toggle() { posGroup.hidden = aud.input.value !== 'positions'; }
          aud.input.addEventListener('change', toggle);
          toggle();
          var ack = MklUI.checkboxField({ label: 'Wajib dikonfirmasi', name: 'requiresAck', checked: a ? a.requiresAck : false, hint: 'Karyawan menekan tombol "Saya sudah membaca dan memahami". Cocok untuk aturan atau kebijakan.' });
          var exp = MklUI.field({ label: 'Tampil sampai (opsional)', name: 'expiresAt', type: 'date', value: a ? a.expiresAt : '', hint: 'Kosongkan jika tidak ada batas.' });
          MklEmployeeExtras.formModal({
            title: a ? 'Ubah Draf Pengumuman' : 'Buat Pengumuman', wide: true, submitLabel: 'Simpan Draf',
            fields: [title, cat, text, aud, posGroup, ack, exp, h('p', { class: 'muted small' }, 'Pengumuman disimpan sebagai draf dulu. Karyawan baru menerimanya setelah Anda menekan Terbitkan.')],
            collect: function () {
              var p = { title: title.input.value.trim(), category: cat.input.value, body: text.input.value.trim(), audienceType: aud.input.value,
                requiresAck: ack.input.checked, expiresAt: exp.input.value || (a ? '' : undefined) };
              if (p.audienceType === 'positions') p.positionIds = boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
              if (a) { p.announcementId = a.announcementId; p.expectedVersion = Number(a.rowVersion); }
              return p;
            },
            send: function (p) { return MklApi.call('hr.announcements.save', p); },
            done: function (res) { MklUI.toast(res.message, 'success'); load(); }
          });
        });
      }

      function publish(a) {
        MklUI.confirmAction({
          title: 'Terbitkan pengumuman',
          message: h('div', null, h('p', null, '"' + a.title + '" akan tampil untuk ' + a.audienceLabel.toLowerCase() + ' dan dikirim sebagai notifikasi di lonceng.'), h('p', { class: 'muted small' }, 'Setelah terbit, isinya tidak bisa diubah. Jika ada kesalahan, arsipkan lalu buat pengumuman baru.')),
          confirmLabel: 'Terbitkan',
          onConfirm: function () {
            return MklApi.call('hr.announcements.publish', { announcementId: a.announcementId, expectedVersion: Number(a.rowVersion) }).then(function (res) {
              if (res.success) { MklUI.toast(res.message, 'success'); load(); }
              return res;
            });
          }
        });
      }

      function archive(a) {
        MklUI.confirmAction({
          title: 'Arsipkan pengumuman', message: '"' + a.title + '" tidak tampil lagi untuk karyawan. Catatan pembacanya tetap tersimpan.',
          confirmLabel: 'Arsipkan', reasonLabel: 'Alasan', reasonRequired: true,
          onConfirm: function (reason) {
            return MklApi.call('hr.announcements.archive', { announcementId: a.announcementId, reason: reason }).then(function (res) {
              if (res.success) { MklUI.toast(res.message, 'success'); load(); }
              return res;
            });
          }
        });
      }

      function readers(a) {
        var content = h('div', null, MklUI.loadingState('Memuat...'));
        MklUI.modal({ title: 'Pembaca: ' + a.title, content: content, wide: true, actions: [{ label: 'Tutup', variant: 'primary', onClick: function (c) { c.close(); } }] });
        MklApi.call('hr.announcements.readers', { announcementId: a.announcementId }).then(function (res) {
          MklUI.clear(content);
          if (!res.success) { content.appendChild(MklUI.alertBox('error', res.message)); return; }
          content.appendChild(MklUI.table([
            { label: 'Karyawan', render: function (r) { return r.fullName; } },
            { label: 'Jabatan', render: function (r) { return r.positionName; } },
            { label: 'Dibaca', render: function (r) { return r.readAt ? MklUI.fmtDateTime(r.readAt) : MklUI.badge('Belum', 'warning'); } },
            a.requiresAck ? { label: 'Konfirmasi', render: function (r) { return r.acknowledgedAt ? MklUI.fmtDateTime(r.acknowledgedAt) : MklUI.badge('Belum', 'warning'); } } : null
          ].filter(Boolean), res.data.items, 'Tidak ada karyawan sasaran.'));
          content.appendChild(h('p', { class: 'muted small' }, 'Karyawan yang belum punya akun portal tidak bisa membaca pengumuman; sampaikan secara langsung.'));
        });
      }

      load();
    }
  });
})();
