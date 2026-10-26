/*
 * Profil Saya dan Kepegawaian Saya.
 * Server selalu mengambil data milik akun yang sedang masuk; halaman ini
 * tidak bisa membuka data orang lain. Karyawan bisa mengubah kontak sendiri,
 * dan mengajukan data diri (lahir, jenis kelamin, KTP + foto) yang diperiksa HR.
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

  /** Kartu Data pribadi + tombol Lengkapi Data Diri. */
  function identityCard(me) {
    var idt = me.identity || { missing: [] };
    var parts = [];
    if (idt.pending) {
      parts.push(MklUI.alertBox('info', 'Data diri yang Anda kirim pada ' + MklUI.fmtDateTime(idt.pending.submittedAt) + ' sedang diperiksa HR. Data di bawah akan berubah setelah disetujui.'));
    } else if (idt.lastRejected) {
      parts.push(MklUI.alertBox('warning', 'Data diri yang Anda kirim perlu diperbaiki' + (idt.lastRejected.note ? ': ' + idt.lastRejected.note : '.') + ' Tekan Lengkapi Data Diri untuk mengirim ulang.'));
    } else if (idt.missing.length) {
      parts.push(MklUI.alertBox('warning', 'Mohon lengkapi: ' + idt.missing.join(', ') + '. Tekan Lengkapi Data Diri di bawah.'));
    }
    parts.push(MklUI.infoList([
      ['Nama lengkap', me.fullName],
      ['Nama panggilan', me.nickname],
      ['Jenis kelamin', me.genderLabel],
      ['Tempat, tanggal lahir', [me.birthPlace, me.birthDate ? MklUI.fmtDate(me.birthDate) : ''].filter(Boolean).join(', ')],
      ['Nomor KTP', me.idNumberMasked || 'Belum diisi'],
      ['Foto KTP', idt.hasKtpPhoto ? 'Sudah ada' : 'Belum ada']
    ]));
    var actions = h('div', { class: 'form-actions' });
    if (idt.pending) {
      var cancel = h('button', { class: 'btn btn-secondary', type: 'button' }, 'Batalkan Pengiriman');
      cancel.addEventListener('click', function () {
        MklUI.confirmAction({
          title: 'Batalkan pengiriman data diri', message: h('p', null, 'Data yang sudah dikirim tidak akan diperiksa. Anda bisa mengirim ulang setelahnya.'),
          confirmLabel: 'Batalkan Pengiriman', danger: true,
          onConfirm: function () {
            return MklApi.call('me.request.cancel', { type: 'identity', requestId: idt.pending.requestId }).then(function (r) {
              if (r.success) { MklUI.toast(r.message, 'success'); MklNav.go('/profil'); }
              return r;
            });
          }
        });
      });
      actions.appendChild(cancel);
    } else if (MklState.can('profile.update.own')) {
      var b = h('button', { class: idt.missing.length ? 'btn btn-primary' : 'btn btn-secondary', type: 'button' }, 'Lengkapi Data Diri');
      b.addEventListener('click', function () { identityForm(me); });
      actions.appendChild(b);
    }
    parts.push(actions);
    parts.push(h('p', { class: 'muted small' }, 'Nama dan jabatan diubah oleh HR. Nomor KTP ditampilkan tersamar demi keamanan.'));
    return MklUI.card('Data pribadi', parts);
  }

  function identityForm(me) {
    var form = h('form', { class: 'stack', novalidate: true });
    var place = MklUI.field({ label: 'Tempat lahir', name: 'birthPlace', maxLength: 60, value: me.birthPlace || '', hint: 'Sesuai KTP.' });
    var date = MklUI.field({ label: 'Tanggal lahir', name: 'birthDate', type: 'date', required: true, value: me.birthDate || '' });
    var gender = MklUI.selectField({ label: 'Jenis kelamin', name: 'gender', required: true, value: me.gender || '', options: [{ value: '', label: '— Pilih —' }, { value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }] });
    var ktp = MklUI.field({ label: 'Nomor KTP (NIK)', name: 'idNumber', required: true, inputmode: 'numeric', maxLength: 20, autocomplete: 'off', hint: '16 digit angka, sesuai KTP.' });
    var photo = MklUI.fileField({ label: 'Foto KTP', name: 'photo', required: true, accept: 'image/jpeg,image/png,application/pdf', hint: 'Foto KTP asli, seluruh kartu terlihat dan tulisan terbaca. JPG, PNG, atau PDF, maksimal 5 MB.' });
    var alertSlot = h('div');
    [h('p', { class: 'muted small' }, 'Data ini diperiksa HR dengan foto KTP Anda sebelum disimpan. Foto KTP disimpan di folder privat perusahaan dan hanya dibuka oleh HR.'),
      place.wrap, date.wrap, gender.wrap, ktp.wrap, photo.wrap, alertSlot].forEach(function (x) { form.appendChild(x); });
    var ctl = MklUI.modal({ title: 'Lengkapi Data Diri', content: form, actions: [
      { label: 'Batal', onClick: function (c) { c.close(); } },
      { label: 'Kirim ke HR', variant: 'primary', id: 'ok', onClick: submit }
    ] });
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });
    function submit(c, btn) {
      MklUI.clearFieldErrors(form);
      MklUI.clear(alertSlot);
      var file = photo.input.files && photo.input.files[0];
      if (!file) { MklUI.showFieldErrors(form, { details: { fields: { photo: 'Lampirkan foto KTP (JPG, PNG, atau PDF).' } } }); return; }
      if (file.size > 5 * 1024 * 1024) { MklUI.showFieldErrors(form, { details: { fields: { photo: 'Ukuran file maksimal 5 MB.' } } }); return; }
      MklUI.setBusy(btn, true, 'Mengirim...');
      MklUI.readFileBase64(file).then(function (b64) {
        var payload = { birthDate: date.input.value, gender: gender.input.value, idNumber: ktp.input.value.replace(/[\s.\-]/g, ''), photo: { fileName: file.name, base64: b64 } };
        if (place.input.value.trim()) payload.birthPlace = place.input.value.trim();
        return MklApi.call('me.identity.submit', payload);
      }).then(function (res) {
        MklUI.setBusy(btn, false);
        if (!res.success) { if (!MklUI.showFieldErrors(form, res)) alertSlot.appendChild(MklUI.alertBox('error', res.message)); return; }
        c.close();
        MklUI.toast(res.message, 'success');
        MklNav.go('/profil');
      });
    }
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
        container.appendChild(identityCard(me));

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
