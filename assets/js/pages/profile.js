/*
 * Profil Saya dan Kepegawaian Saya.
 * Server selalu mengambil data milik akun yang sedang masuk; halaman ini
 * tidak bisa membuka data orang lain. Karyawan hanya bisa mengubah kontak.
 */
(function () {
  'use strict';
  var h = MklUI.h;

  function notLinked(container, message) {
    container.appendChild(MklUI.card(null, [
      MklUI.alertBox('info', message || 'Akun Anda belum terhubung dengan data karyawan.'),
      h('p', null, 'Hubungi HR agar akun Anda dihubungkan. Sementara itu Anda tetap bisa memakai menu lain yang tersedia.')
    ]));
  }

  function loadProfile(container, render) {
    MklUI.clear(container).appendChild(MklUI.loadingState('Memuat data Anda...'));
    MklApi.call('me.profile', {}).then(function (res) {
      MklUI.clear(container);
      if (!res.success) { container.appendChild(MklUI.errorState(res, function () { loadProfile(container, render); })); return; }
      if (!res.data.linked) { notLinked(container, res.message); return; }
      render(res.data);
    });
  }

  // ================================================================== Profil Saya

  MklNav.register('/profil', {
    title: 'Profil Saya',
    perm: 'profile.read.own',
    menu: { label: 'Profil Saya', order: 5 },
    render: function (root) {
      root.appendChild(MklUI.pageHeader('Profil Saya', 'Data pribadi dan kontak Anda.'));
      var container = h('div');
      root.appendChild(container);

      function render(me) {
        if (me.missingContact && me.missingContact.length) {
          container.appendChild(MklUI.alertBox('warning', 'Mohon lengkapi: ' + me.missingContact.join(', ') + '. Tekan Ubah Kontak di bawah.'));
        }
        container.appendChild(MklUI.card('Data pribadi', [
          MklUI.infoList([
            ['Nama lengkap', me.fullName],
            ['Nama panggilan', me.nickname],
            ['Jenis kelamin', me.genderLabel],
            ['Tempat, tanggal lahir', [me.birthPlace, me.birthDate ? MklUI.fmtDate(me.birthDate) : ''].filter(Boolean).join(', ')],
            ['Nomor KTP', me.idNumberMasked || 'Belum diisi HR']
          ]),
          h('p', { class: 'muted small' }, 'Jika ada data pribadi yang salah, hubungi HR dengan membawa dokumen pendukung (misalnya KTP). Nomor KTP ditampilkan tersamar demi keamanan.')
        ]));

        var ec = me.emergencyContact;
        var editBtn = h('button', { class: 'btn btn-primary', type: 'button' }, 'Ubah Kontak');
        editBtn.addEventListener('click', function () { openContact(me); });
        container.appendChild(MklUI.card('Kontak', [
          MklUI.infoList([
            ['Nomor HP/WhatsApp', me.phoneWa],
            ['Email pribadi', me.personalEmail],
            ['Email perusahaan', me.companyEmail],
            ['Alamat', me.address],
            ['Kontak darurat', ec ? [ec.name, ec.relationship ? '(' + ec.relationship + ')' : '', ec.phone].filter(Boolean).join(' ') : '']
          ]),
          h('div', { class: 'form-actions' }, editBtn)
        ]));
      }

      function openContact(me) {
        var ec = me.emergencyContact || {};
        var form = h('form', { class: 'stack', novalidate: true });
        var phone = MklUI.field({ label: 'Nomor HP/WhatsApp', name: 'phoneWa', value: me.phoneWa || '', maxLength: 20, inputmode: 'tel', autocomplete: 'tel', hint: 'Contoh: 081234567890' });
        var email = MklUI.field({ label: 'Email pribadi', name: 'personalEmail', type: 'email', value: me.personalEmail || '', maxLength: 100, autocomplete: 'email' });
        var address = MklUI.field({ label: 'Alamat', name: 'address', value: me.address || '', multiline: true, maxLength: 300, autocomplete: 'street-address' });
        var ecName = MklUI.field({ label: 'Nama kontak darurat', name: 'emergencyContact.name', value: ec.name || '', maxLength: 80 });
        var ecRel = MklUI.field({ label: 'Hubungan', name: 'emergencyContact.relationship', value: ec.relationship || '', maxLength: 40, hint: 'Contoh: Ibu, Suami, Kakak' });
        var ecPhone = MklUI.field({ label: 'Nomor HP kontak darurat', name: 'emergencyContact.phone', value: ec.phone || '', maxLength: 20, inputmode: 'tel' });
        var alertSlot = h('div');
        [phone.wrap, email.wrap, address.wrap,
          h('fieldset', { class: 'form-section' }, h('legend', null, 'Kontak darurat'), h('p', { class: 'muted small' }, 'Orang yang dihubungi jika terjadi sesuatu pada Anda saat bekerja.'), ecName.wrap, ecRel.wrap, ecPhone.wrap),
          alertSlot].forEach(function (x) { form.appendChild(x); });
        var ctl = MklUI.modal({ title: 'Ubah Kontak', content: form, wide: true, actions: [
          { label: 'Batal', onClick: function (c) { c.close(); } },
          { label: 'Simpan', variant: 'primary', id: 'ok', onClick: submit }
        ] });
        form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });

        function submit(c, btn) {
          MklUI.clearFieldErrors(form);
          MklUI.clear(alertSlot);
          var payload = { expectedVersion: Number(me.rowVersion) };
          [['phoneWa', phone], ['personalEmail', email], ['address', address]].forEach(function (pair) {
            var val = pair[1].input.value.trim();
            if (val !== String(me[pair[0]] || '')) payload[pair[0]] = val;
          });
          var next = { name: ecName.input.value.trim(), relationship: ecRel.input.value.trim(), phone: ecPhone.input.value.trim() };
          if (next.name !== (ec.name || '') || next.relationship !== (ec.relationship || '') || next.phone !== (ec.phone || '')) {
            var p = {};
            Object.keys(next).forEach(function (k) { if (next[k]) p[k] = next[k]; });
            payload.emergencyContact = p;
          }
          MklUI.setBusy(btn, true, 'Menyimpan...');
          MklApi.call('me.updateContact', payload).then(function (res) {
            MklUI.setBusy(btn, false);
            if (!res.success) {
              if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message));
              return;
            }
            c.close();
            MklUI.toast(res.message, 'success');
            loadProfile(container, render);
          });
        }
      }

      loadProfile(container, render);
    }
  });

  // ================================================================== Kepegawaian Saya

  MklNav.register('/kepegawaian', {
    title: 'Kepegawaian Saya',
    perm: 'profile.read.own',
    menu: { label: 'Kepegawaian Saya', order: 6 },
    render: function (root) {
      root.appendChild(MklUI.pageHeader('Kepegawaian Saya', 'Jabatan, masa kerja, dan riwayat kepegawaian Anda.'));
      var container = h('div');
      root.appendChild(container);
      loadProfile(container, function (me) {
        container.appendChild(MklUI.card('Data kepegawaian', MklUI.infoList([
          ['Employee ID', me.employeeId],
          ['Jabatan', me.positionName],
          ['Atasan langsung', me.supervisorName],
          ['Tanggal masuk', me.joinDate ? MklUI.fmtDate(me.joinDate) : ''],
          ['Masa kerja', me.tenure],
          ['Status', MklLookups.statusBadge(me)],
          ['Jenis hubungan kerja', me.employmentTypeLabel],
          me.probationEndDate ? ['Akhir masa percobaan', MklUI.fmtDate(me.probationEndDate)] : null,
          me.permanentDate ? ['Tanggal pengangkatan', MklUI.fmtDate(me.permanentDate)] : null,
          me.contractEndDate ? ['Akhir kontrak', MklUI.fmtDate(me.contractEndDate)] : null
        ].filter(Boolean))));
        container.appendChild(MklUI.card('Riwayat', MklUI.table([
          { label: 'Berlaku', render: function (x) { return MklUI.fmtDate(x.effectiveDate); } },
          { label: 'Perubahan', render: function (x) { return x.label; } },
          { label: 'Dari', render: function (x) { return x.from; } },
          { label: 'Menjadi', render: function (x) { return x.to; } }
        ], me.history || [], 'Belum ada riwayat.')));
        container.appendChild(h('p', { class: 'muted small' }, 'Masa kerja dihitung otomatis dari tanggal masuk sampai hari ini. Jika ada data yang tidak sesuai, hubungi HR.'));
      });
    }
  });
})();
