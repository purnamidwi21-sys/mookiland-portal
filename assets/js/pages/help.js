/*
 * Pusat Bantuan: panduan sesuai permission pengguna, FAQ, kontak, dan versi.
 */
(function () {
  'use strict';
  var h = MklUI.h;

  var SECTION_TITLES = {
    staff: 'Untuk semua pengguna',
    sysadmin: 'Untuk System Admin',
    management: 'Untuk Manajemen'
  };

  function visible(item) {
    return !item.perm || MklState.canAny(item.perm);
  }

  MklNav.register('/bantuan', {
    title: 'Pusat Bantuan',
    menu: { label: 'Pusat Bantuan', order: 90 },
    render: function (root) {
      var help = window.MklHelp;
      var topics = help.topics.filter(visible);
      root.appendChild(MklUI.pageHeader('Pusat Bantuan', 'Panduan langkah demi langkah untuk fitur yang bisa Anda gunakan.'));

      // Daftar isi
      var toc = h('ol', { class: 'toc' });
      var sections = {};
      topics.forEach(function (t) { (sections[t.guide] = sections[t.guide] || []).push(t); });
      var anchors = {};

      Object.keys(SECTION_TITLES).forEach(function (key) {
        if (!sections[key]) return;
        var li = h('li', null, h('strong', null, SECTION_TITLES[key]));
        var sub = h('ol');
        sections[key].forEach(function (t) {
          var b = h('button', { class: 'link-button', type: 'button' }, t.title);
          b.addEventListener('click', function () {
            if (anchors[t.id]) {
              anchors[t.id].scrollIntoView({ behavior: 'smooth', block: 'start' });
              anchors[t.id].focus();
            }
          });
          sub.appendChild(h('li', null, b));
        });
        li.appendChild(sub);
        toc.appendChild(li);
      });
      root.appendChild(MklUI.card('Daftar isi', toc));

      Object.keys(SECTION_TITLES).forEach(function (key) {
        if (!sections[key]) return;
        root.appendChild(h('h2', { class: 'section-title' }, SECTION_TITLES[key]));
        sections[key].forEach(function (t) {
          var title = h('h3', { class: 'card-title', tabindex: '-1' }, t.title);
          anchors[t.id] = title;
          root.appendChild(h('section', { class: 'card help-topic' },
            title,
            h('p', null, t.intro),
            h('ol', { class: 'steps' }, t.steps.map(function (s) { return h('li', null, s); })),
            h('div', { class: 'note note-success' }, h('strong', null, 'Hasil yang seharusnya: '), t.result),
            t.notes ? h('ul', { class: 'notes' }, t.notes.map(function (n) { return h('li', null, n); })) : null));
        });
      });

      root.appendChild(h('h2', { class: 'section-title' }, 'Pertanyaan umum'));
      root.appendChild(MklUI.card(null, help.faq.filter(visible).map(function (f) {
        return h('details', { class: 'faq' }, h('summary', null, f.q), h('p', null, f.a));
      })));

      root.appendChild(h('h2', { class: 'section-title' }, 'Jika terjadi masalah'));
      root.appendChild(MklUI.card(null, MklUI.table([
        { label: 'Masalah', render: function (r) { return r.problem; } },
        { label: 'Kemungkinan penyebab', render: function (r) { return r.cause; } },
        { label: 'Yang perlu diperiksa', render: function (r) { return r.check; } },
        { label: 'Solusi', render: function (r) { return r.solution; } },
        { label: 'Hubungi', render: function (r) { return r.contact; } }
      ], help.troubleshooting)));

      var contact = MklState.user && MklState.user.supportContact;
      root.appendChild(MklUI.card('Kontak bantuan', [
        h('p', null, contact ? contact : 'HR atau admin Mookiland.'),
        h('p', { class: 'muted small' }, 'Saat melapor, sertakan screenshot dan Kode permintaan jika ada. Jangan pernah mengirim password.')
      ]));

      root.appendChild(h('p', { class: 'muted small center' },
        'Versi aplikasi ' + MklApp.VERSION +
        (MklState.user && MklState.user.serverVersion ? ' (server ' + MklState.user.serverVersion + ')' : '') +
        ' · Panduan diperbarui ' + help.updatedAt));
    }
  });
})();
