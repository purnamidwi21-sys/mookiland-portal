/*
 * Isi Pusat Bantuan Mookiland Staff Portal.
 *
 * Satu sumber untuk:
 *  - halaman Pusat Bantuan di aplikasi (ditampilkan sesuai permission), dan
 *  - panduan Markdown di repo backend (docs/guides/), dibuat dengan
 *    tools/build-guides.js.
 *
 * Hanya fitur yang sudah dibuat dan diuji yang boleh ditulis di sini.
 * Nama menu dan tombol harus sama persis dengan yang tampil di aplikasi.
 *
 * guide: staff | sysadmin | management  (panduan Markdown tujuan)
 * perm : null = semua pengguna; selain itu cukup salah satu permission
 */
window.MklHelp = {
  version: '0.3.0',
  updatedAt: '2026-10-23',

  topics: [
    // ------------------------------------------------------------ semua pengguna
    {
      id: 'membuka', guide: 'staff', perm: null, title: 'Membuka aplikasi',
      intro: 'Mookiland Staff Portal dibuka lewat browser, di ponsel atau komputer. Tidak perlu memasang aplikasi.',
      steps: [
        'Buka Chrome, Safari, atau browser lain di ponsel atau komputer.',
        'Ketik alamat portal yang diberikan HR atau admin, lalu tekan Enter.',
        'Simpan alamat itu sebagai bookmark (penanda) agar mudah dibuka lagi.'
      ],
      result: 'Muncul halaman Masuk dengan kolom Username dan Password.'
    },
    {
      id: 'masuk', guide: 'staff', perm: null, title: 'Masuk (login)',
      intro: 'Gunakan username dan password pribadi Anda. Jangan memakai akun orang lain.',
      steps: [
        'Di halaman Masuk, isi kolom Username.',
        'Isi kolom Password. Tekan Tampilkan jika ingin memeriksa ketikan, lalu Sembunyikan lagi.',
        'Tekan tombol Masuk.'
      ],
      result: 'Halaman Beranda tampil dengan tulisan "Selamat datang" dan nama Anda.',
      notes: [
        'Jika password salah 5 kali berturut-turut, akun dikunci 15 menit. Jika salah 10 kali dalam 24 jam, akun dikunci sampai dibuka admin.',
        'Pesan "Username atau password salah" sengaja tidak menyebut mana yang salah, demi keamanan.'
      ]
    },
    {
      id: 'masuk-pertama', guide: 'staff', perm: null, title: 'Masuk pertama kali dan membuat password baru',
      intro: 'Akun baru dan akun yang baru direset memakai password sementara, misalnya K7QM-P3XT-9VHA.',
      steps: [
        'Masuk dengan username dan password sementara dari admin. Ketik persis, termasuk tanda minus.',
        'Halaman Ganti Password muncul dengan pesan bahwa Anda wajib membuat password baru.',
        'Isi Password saat ini dengan password sementara.',
        'Isi Password baru: minimal 8 karakter, berisi huruf dan angka, dan tidak mengandung username.',
        'Isi Ulangi password baru dengan ketikan yang sama.',
        'Tekan Simpan Password Baru.'
      ],
      result: 'Muncul pesan "Password berhasil diganti" dan Anda dibawa ke Beranda. Menu lain sekarang bisa dibuka.'
    },
    {
      id: 'ganti-password', guide: 'staff', perm: null, title: 'Mengganti password',
      intro: 'Ganti password kapan saja, terutama jika Anda curiga orang lain mengetahuinya.',
      steps: [
        'Di komputer, lihat menu di sebelah kiri. Di ponsel, tekan tombol Menu di kiri atas.',
        'Tekan Ganti Password di bagian bawah menu.',
        'Isi Password saat ini, Password baru, dan Ulangi password baru.',
        'Tekan Simpan Password Baru.'
      ],
      result: 'Muncul pesan "Password berhasil diganti". Perangkat lain yang sedang masuk dengan akun Anda otomatis dikeluarkan.'
    },
    {
      id: 'lupa-password', guide: 'staff', perm: null, title: 'Lupa password',
      intro: 'Untuk keamanan, password hanya bisa direset oleh admin setelah memeriksa identitas Anda.',
      steps: [
        'Di halaman Masuk, tekan Lupa password? untuk melihat petunjuk dan kontak bantuan.',
        'Hubungi HR atau admin secara langsung dan sebutkan username Anda.',
        'Terima password sementara secara langsung dari admin. Jangan menerima password lewat grup chat.',
        'Masuk dengan password sementara, lalu buat password baru seperti pada topik "Masuk pertama kali".'
      ],
      result: 'Anda bisa masuk kembali dengan password baru buatan Anda sendiri.'
    },
    {
      id: 'beranda', guide: 'staff', perm: null, title: 'Memahami Beranda',
      intro: 'Beranda adalah halaman pertama setelah masuk.',
      steps: [
        'Kotak Akun Anda menampilkan username, role, dan kapan Anda terakhir masuk. Jika waktu masuk sebelumnya tidak Anda kenali, segera ganti password dan hubungi admin.',
        'Kotak Yang bisa Anda lakukan saat ini berisi tautan ke menu yang boleh Anda buka.',
        'Kotak Sedang dikembangkan menjelaskan fitur yang belum tersedia.'
      ],
      result: 'Anda mengetahui akun dan menu apa saja yang bisa dipakai.'
    },
    {
      id: 'keluar', guide: 'staff', perm: null, title: 'Keluar dengan aman',
      intro: 'Selalu keluar setelah selesai, terutama di perangkat milik orang lain.',
      steps: [
        'Buka menu (di ponsel tekan Menu di kiri atas).',
        'Tekan Keluar di bagian bawah menu.'
      ],
      result: 'Halaman Masuk tampil dengan pesan "Anda telah keluar."',
      notes: [
        'Anda otomatis dikeluarkan setelah 30 menit tanpa aktivitas, atau 12 jam setelah masuk.',
        'Menutup tab browser juga mengakhiri sesi di tab itu. Membuka tab baru berarti harus masuk lagi.'
      ]
    },
    {
      id: 'lapor', guide: 'staff', perm: null, title: 'Melaporkan masalah',
      intro: 'Jika muncul pesan error atau data tidak sesuai, laporkan agar bisa diperiksa.',
      steps: [
        'Ambil screenshot layar yang menampilkan pesan error.',
        'Catat Kode permintaan jika tertulis di pesan (10 huruf/angka). Kode ini membantu admin menemukan masalah di catatan sistem.',
        'Kirim screenshot dan penjelasan singkat ke kontak bantuan di bagian bawah halaman ini.',
        'Jangan pernah mengirim password Anda, termasuk kepada admin.'
      ],
      result: 'Admin dapat menelusuri masalah tanpa memerlukan password Anda.'
    },

    // ------------------------------------------------------------ System Admin
    {
      id: 'admin-tambah', guide: 'sysadmin', perm: ['user.manage', 'user.manage.privileged'], title: 'Menambah pengguna',
      intro: 'Setiap orang mendapat akun sendiri. Jangan memakai satu akun bersama.',
      steps: [
        'Buka menu Pengguna, lalu tekan Tambah Pengguna.',
        'Isi Username (huruf kecil, angka, titik, garis bawah, atau tanda minus; contoh budi.santoso).',
        'Isi Nama tampilan.',
        'Centang role yang sesuai. Untuk karyawan biasa cukup Staff. Role bertanda Sensitif hanya bisa diberikan oleh Manajemen.',
        'Tekan Buat Akun.',
        'Catat password sementara yang muncul, lalu tekan Saya sudah mencatatnya.',
        'Berikan username dan password sementara langsung kepada orang tersebut.'
      ],
      result: 'Akun baru muncul di daftar Pengguna dengan status Aktif. Pengguna wajib membuat password baru saat pertama masuk.',
      notes: ['Password sementara hanya ditampilkan sekali. Jika terlewat, lakukan Reset Password.']
    },
    {
      id: 'admin-role', guide: 'sysadmin', perm: ['user.manage', 'user.manage.privileged'], title: 'Mengubah role pengguna',
      intro: 'Role menentukan menu dan data yang boleh diakses seseorang.',
      steps: [
        'Buka menu Pengguna, lalu tekan Kelola pada pengguna yang dimaksud.',
        'Di kotak Role, centang atau hapus centang role.',
        'Tekan Simpan Role, isi Alasan perubahan, lalu tekan Simpan Role di dialog.'
      ],
      result: 'Muncul pesan "Role berhasil diperbarui". Perubahan berlaku pada permintaan berikutnya pengguna tersebut dan tercatat di Audit Log.',
      notes: [
        'Anda tidak dapat menambah role untuk akun Anda sendiri.',
        'Harus selalu ada minimal satu akun aktif dengan role System Admin dan satu dengan role Manajemen.'
      ]
    },
    {
      id: 'admin-reset', guide: 'sysadmin', perm: ['user.manage', 'user.manage.privileged'], title: 'Reset password pengguna',
      intro: 'Lakukan hanya setelah memastikan identitas orang yang meminta, misalnya tatap muka atau telepon ke nomor yang terdaftar.',
      steps: [
        'Buka menu Pengguna, tekan Kelola pada pengguna tersebut.',
        'Di kotak Tindakan, tekan Reset Password.',
        'Isi Alasan reset, lalu tekan Reset Password.',
        'Catat password sementara dan berikan langsung kepada pengguna.'
      ],
      result: 'Password lama tidak berlaku, pengguna dikeluarkan dari semua perangkat, dan wajib membuat password baru saat masuk.',
      notes: ['Untuk akun Anda sendiri, gunakan menu Ganti Password.']
    },
    {
      id: 'admin-kunci', guide: 'sysadmin', perm: ['user.manage', 'user.manage.privileged'], title: 'Membuka kunci akun',
      intro: 'Akun terkunci jika password salah terlalu sering. Status Terkunci tampil di daftar Pengguna.',
      steps: [
        'Buka menu Pengguna. Pilih Status: Terkunci lalu tekan Tampilkan untuk melihat akun yang terkunci.',
        'Tekan Kelola, lalu Buka Kunci.',
        'Isi alasan, lalu tekan Buka Kunci.'
      ],
      result: 'Status kembali Aktif dan pengguna dapat mencoba masuk lagi dengan password yang sama.',
      notes: ['Jika pengguna juga lupa password, cukup lakukan Reset Password; kunci ikut terbuka.']
    },
    {
      id: 'admin-paksa-keluar', guide: 'sysadmin', perm: ['user.manage', 'user.manage.privileged'], title: 'Paksa keluar dari semua perangkat',
      intro: 'Gunakan jika ponsel pengguna hilang atau ada dugaan akun dipakai orang lain.',
      steps: [
        'Buka menu Pengguna, tekan Kelola.',
        'Tekan Paksa Keluar, isi alasan, lalu tekan Paksa Keluar.'
      ],
      result: 'Muncul jumlah sesi yang diakhiri. Pengguna harus masuk kembali di semua perangkat.'
    },
    {
      id: 'admin-nonaktif', guide: 'sysadmin', perm: ['user.manage', 'user.manage.privileged'], title: 'Menonaktifkan dan mengaktifkan akun',
      intro: 'Akun karyawan yang keluar dinonaktifkan, tidak dihapus, agar riwayatnya tetap tersimpan.',
      steps: [
        'Buka menu Pengguna, tekan Kelola.',
        'Tekan Nonaktifkan, isi alasan (contoh: Resign per 31 Oktober), lalu tekan Nonaktifkan.',
        'Untuk mengaktifkan kembali, buka akun yang sama dan tekan Aktifkan.'
      ],
      result: 'Status menjadi Nonaktif dan semua sesi pengguna langsung berakhir. Pengguna melihat pesan "Akun Anda tidak aktif" saat mencoba masuk.'
    },
    {
      id: 'admin-role-lihat', guide: 'sysadmin', perm: ['role.view', 'user.manage', 'user.manage.privileged'], title: 'Melihat isi role',
      intro: 'Menu Role & Permission menunjukkan apa saja yang bisa dilakukan setiap role.',
      steps: [
        'Buka menu Role & Permission.',
        'Tekan nama role untuk melihat daftar permission-nya, dikelompokkan per modul.'
      ],
      result: 'Anda dapat memastikan role yang diberikan tidak membuka akses berlebih.',
      notes: ['System Admin tidak otomatis bisa melihat data gaji, rekening, atau dokumen pribadi karyawan.']
    },
    {
      id: 'admin-log-masuk', guide: 'sysadmin', perm: ['loginlog.read'], title: 'Membaca Log Masuk',
      intro: 'Log Masuk mencatat setiap percobaan masuk dan keluar.',
      steps: [
        'Buka menu Log Aktivitas, pilih tab Log Masuk.',
        'Isi filter Username, Hasil, atau tanggal bila perlu, lalu tekan Tampilkan.'
      ],
      result: 'Tampil daftar terbaru lebih dulu, dengan waktu, username, hasil, dan jenis perangkat.',
      notes: ['Banyak "Password salah" atau "Username tidak dikenal" dalam waktu singkat bisa menandakan percobaan menebak password.']
    },
    {
      id: 'admin-audit', guide: 'sysadmin', perm: ['audit.read.all', 'audit.read.hr', 'audit.read.payroll'], title: 'Membaca Audit Log',
      intro: 'Audit Log mencatat siapa mengubah apa, kapan, nilai sebelum dan sesudah, serta alasannya.',
      steps: [
        'Buka menu Log Aktivitas, pilih tab Audit Log.',
        'Saring dengan Kode aksi (contoh user. untuk semua perubahan akun), Pelaku, atau tanggal, lalu tekan Tampilkan.',
        'Tekan Detail untuk melihat kolom yang berubah beserta nilai sebelum dan sesudahnya.'
      ],
      result: 'Setiap perubahan dapat ditelusuri. Password dan kode rahasia tidak pernah ditampilkan.',
      notes: ['Baris "Akses ditolak" berarti seseorang mencoba membuka fitur yang bukan haknya.']
    },

    // ------------------------------------------------------------ Manajemen
    {
      id: 'mgmt-role-sensitif', guide: 'management', perm: ['user.manage.privileged'], title: 'Memberi akses sensitif',
      intro: 'Role HR Admin, Payroll, System Admin, dan Manajemen membuka data pribadi, gaji, atau pengelolaan akun. Hanya Manajemen yang bisa memberikannya.',
      steps: [
        'Buka menu Pengguna, tekan Kelola pada orang yang dimaksud.',
        'Di kotak Role, centang role yang dibutuhkan untuk pekerjaannya saja.',
        'Tekan Simpan Role, isi alasan, lalu konfirmasi.'
      ],
      result: 'Akun tersebut mendapat akses baru dan sejak itu hanya dapat dikelola oleh Manajemen.',
      notes: [
        'Berikan akses seperlunya. Contoh: penghitung payroll cukup role Payroll; penyetuju payroll memakai role Manajemen.',
        'Orang yang menghitung payroll tidak boleh menjadi orang yang menyetujuinya.'
      ]
    },
    {
      id: 'mgmt-akun-admin', guide: 'management', perm: ['user.manage.privileged'], title: 'Akun admin pertama',
      intro: 'Akun "admin" dibuat saat pemasangan dan memiliki role System Admin dan Manajemen.',
      steps: [
        'Buat akun pribadi untuk Direktur dengan role Manajemen (dan Staff bila Direktur juga karyawan).',
        'Buat akun pribadi untuk pengelola teknis dengan role System Admin.',
        'Setelah keduanya bisa masuk, buka akun admin, hapus centang Manajemen, lalu Simpan Role. Akun admin tetap menjadi akun cadangan System Admin.'
      ],
      result: 'Setiap orang memakai akun pribadinya, sehingga Audit Log menunjukkan siapa yang melakukan setiap perubahan.'
    }
  ],

  faq: [
    { q: 'Apakah admin bisa melihat password saya?', a: 'Tidak. Password disimpan dalam bentuk acak yang tidak bisa dikembalikan. Admin hanya bisa membuat password sementara baru.' },
    { q: 'Mengapa saya harus masuk lagi saat membuka tab baru?', a: 'Sesi hanya berlaku di tab tempat Anda masuk, agar lebih aman di perangkat bersama.' },
    { q: 'Bolehkah saya masuk di ponsel dan komputer sekaligus?', a: 'Boleh. Jika Anda mengganti password, perangkat lain otomatis dikeluarkan.' },
    { q: 'Mengapa menu saya berbeda dengan rekan kerja?', a: 'Menu menyesuaikan role masing-masing. Jika merasa membutuhkan akses tambahan, tanyakan kepada atasan atau admin.' },
    { q: 'Menu profil, absensi, dan slip gaji belum ada. Kapan tersedia?', a: 'Fitur tersebut sedang dibuat bertahap dan akan muncul di menu setelah selesai diuji.' }
  ],

  troubleshooting: [
    {
      problem: 'Tidak bisa masuk: "Username atau password salah"', cause: 'Salah ketik, huruf besar/kecil pada password, atau keyboard berbahasa lain.',
      check: 'Tekan Tampilkan untuk memeriksa ketikan password. Pastikan Caps Lock mati.', solution: 'Ketik ulang dengan hati-hati. Jika tetap gagal, gunakan Lupa password?.', contact: 'HR atau admin'
    },
    {
      problem: 'Lupa password', cause: '-', check: '-', solution: 'Ikuti topik "Lupa password". Admin membuat password sementara setelah memeriksa identitas.', contact: 'HR atau admin'
    },
    {
      problem: '"Akun dikunci sementara"', cause: 'Password salah 5 kali berturut-turut.', check: 'Lihat jam yang tertulis di pesan.', solution: 'Tunggu sampai jam tersebut, atau minta admin membuka kunci.', contact: 'Admin'
    },
    {
      problem: '"Akun Anda dikunci. Hubungi admin"', cause: 'Password salah 10 kali dalam 24 jam.', check: '-', solution: 'Admin membuka kunci atau mereset password.', contact: 'Admin'
    },
    {
      problem: '"Akun Anda tidak aktif"', cause: 'Akun dinonaktifkan, misalnya karena masa kerja berakhir.', check: '-', solution: 'Konfirmasi status kepegawaian kepada HR.', contact: 'HR'
    },
    {
      problem: '"Sesi Anda telah berakhir"', cause: 'Tidak ada aktivitas 30 menit, sudah 12 jam sejak masuk, password diganti, atau admin memaksa keluar.', check: '-', solution: 'Masuk kembali. Jika terjadi berulang tanpa alasan, laporkan ke admin.', contact: 'Admin'
    },
    {
      problem: 'Halaman tidak terbuka atau "Tidak dapat terhubung ke server"', cause: 'Internet putus, alamat portal salah, atau server sedang diperbarui.', check: 'Coba buka situs lain. Pastikan alamat portal sesuai bookmark.', solution: 'Tunggu beberapa menit lalu muat ulang halaman.', contact: 'Admin jika berlangsung lebih dari 15 menit'
    },
    {
      problem: '"Anda tidak memiliki akses untuk tindakan ini"', cause: 'Role Anda tidak mencakup fitur tersebut.', check: 'Lihat role Anda di Beranda.', solution: 'Minta akses kepada atasan jika memang dibutuhkan untuk pekerjaan.', contact: 'Atasan, lalu admin'
    },
    {
      problem: 'Pesan "Terjadi kesalahan pada server" dengan kode', cause: 'Kesalahan tak terduga di sistem.', check: 'Catat Kode permintaan.', solution: 'Laporkan dengan screenshot dan kode tersebut.', contact: 'Admin'
    }
  ]
};
