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
 * guide: staff | supervisor | hr | sysadmin | management  (panduan Markdown tujuan)
 * perm : null = semua pengguna; selain itu cukup salah satu permission
 */
window.MklHelp = {
  version: '0.4.0',
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
        'Kotak Kepegawaian Anda menampilkan Employee ID, jabatan, atasan, dan masa kerja. Jika ada pesan kuning "Mohon lengkapi data kontak", buka Profil Saya.',
        'Kotak Akun Anda menampilkan username, role, dan kapan Anda terakhir masuk. Jika waktu masuk sebelumnya tidak Anda kenali, segera ganti password dan hubungi admin.',
        'Kotak Yang bisa Anda lakukan saat ini berisi tautan ke menu yang boleh Anda buka.',
        'Kotak Sedang dikembangkan menjelaskan fitur yang belum tersedia.'
      ],
      result: 'Anda mengetahui akun dan menu apa saja yang bisa dipakai.'
    },
    {
      id: 'profil', guide: 'staff', perm: ['profile.read.own'], title: 'Melihat dan memperbarui Profil Saya',
      intro: 'Profil Saya berisi data pribadi dan kontak Anda. Anda bisa memperbarui sendiri nomor HP, email pribadi, alamat, dan kontak darurat.',
      steps: [
        'Buka menu Profil Saya.',
        'Periksa kotak Data pribadi. Nomor KTP ditampilkan tersamar, misalnya ****1234.',
        'Untuk mengubah kontak, tekan Ubah Kontak di kotak Kontak.',
        'Isi atau perbaiki Nomor HP/WhatsApp (contoh 081234567890), Email pribadi, dan Alamat.',
        'Isi Kontak darurat: nama, hubungan (misalnya Ibu), dan nomor HP orang yang dihubungi jika terjadi sesuatu pada Anda saat bekerja.',
        'Tekan Simpan.'
      ],
      result: 'Muncul pesan "Data kontak Anda disimpan" dan kotak Kontak menampilkan data baru.',
      notes: [
        'Nama, tanggal lahir, nomor KTP, dan data kepegawaian hanya bisa diubah HR. Jika salah, hubungi HR dengan membawa dokumen pendukung.',
        'Jika muncul pesan "Akun Anda belum terhubung dengan data karyawan", minta HR atau admin menghubungkan akun Anda.',
        'Setiap perubahan dicatat di sistem.'
      ]
    },
    {
      id: 'kepegawaian', guide: 'staff', perm: ['profile.read.own'], title: 'Melihat Kepegawaian Saya',
      intro: 'Kepegawaian Saya menampilkan Employee ID, jabatan, atasan, tanggal masuk, masa kerja, status, dan riwayat kepegawaian.',
      steps: [
        'Buka menu Kepegawaian Saya.',
        'Kotak Data kepegawaian menampilkan data Anda saat ini. Masa kerja dihitung otomatis sampai hari ini.',
        'Kotak Riwayat menampilkan perubahan, misalnya mulai bekerja atau perubahan jabatan, beserta tanggal berlakunya.'
      ],
      result: 'Anda mengetahui data kepegawaian yang tercatat di sistem.',
      notes: ['Jika ada data yang tidak sesuai, hubungi HR.']
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

    // ------------------------------------------------------------ Supervisor
    {
      id: 'spv-tim', guide: 'supervisor', perm: ['employee.read.team'], title: 'Melihat data anggota tim',
      intro: 'Supervisor dapat melihat data kepegawaian dasar anggota timnya, yaitu karyawan yang atasan langsungnya adalah Anda (termasuk bawahan dari bawahan Anda).',
      steps: [
        'Buka menu Karyawan.',
        'Daftar hanya berisi anggota tim Anda. Gunakan kolom Cari nama atau ID untuk mencari.',
        'Tekan Lihat untuk membuka jabatan, tanggal masuk, masa kerja, dan status anggota tim.'
      ],
      result: 'Anda melihat data dasar anggota tim. Data pribadi, kontak, dan identitas tidak ditampilkan.',
      notes: [
        'Anggota tim ditentukan HR melalui kolom Atasan langsung pada data karyawan.',
        'Jika daftar kosong padahal Anda punya tim, akun Anda mungkin belum terhubung dengan data karyawan Anda. Hubungi HR atau admin.'
      ]
    },

    // ------------------------------------------------------------ HR Admin
    {
      id: 'hr-impor', guide: 'hr', perm: ['employee.manage'], title: 'Impor karyawan dari Excel',
      intro: 'Gunakan impor untuk memasukkan banyak karyawan sekaligus, misalnya dari file Data Karyawan yang sudah ada. Sistem memeriksa dulu sebelum menyimpan.',
      steps: [
        'Pastikan baris pertama tabel di Excel berisi judul kolom, minimal Nama Lengkap. Kolom yang dikenali: Nama Lengkap, Nama Panggilan, Jabatan, Tanggal Mulai Bekerja, Tanggal Lahir, Tempat Lahir, No. KTP, Email, No HP, Jenis Kelamin, Alamat.',
        'Buka menu Karyawan, lalu tekan Impor dari Excel.',
        'Pada langkah 1 Pilih file, tekan kotak File karyawan dan pilih file .xlsx atau .csv (maksimal 5 MB).',
        'Tekan Periksa File. Tunggu sampai muncul langkah 2 Periksa data.',
        'Baca kotak Ringkasan: jumlah yang akan ditambahkan, yang dilewati, kolom yang dipakai, dan jabatan baru.',
        'Periksa tabel Data per baris. Baris merah "Dilewati" tidak akan diimpor (misalnya nama kosong, nama ganda, atau sudah ada di sistem). Catatan kuning adalah data yang perlu dilengkapi setelah impor.',
        'Di kotak 2. Atasan dan impor, pilih Atasan langsung untuk semua karyawan yang diimpor (biasanya Operasional Manajer).',
        'Tekan Impor N Karyawan.'
      ],
      result: 'Langkah 3 Selesai menampilkan daftar karyawan baru beserta Employee ID-nya (MKL-0001 dan seterusnya, berurutan dari tanggal masuk paling lama).',
      notes: [
        'Pratinjau tidak menyimpan apa pun. Jika lebih dari 30 menit, unggah file lagi.',
        'File tidak disimpan di server. Nomor KTP di layar ditampilkan tersamar.',
        'Mengimpor file yang sama dua kali aman: karyawan yang nama atau nomor KTP-nya sudah ada otomatis dilewati.',
        'Jika nomor KTP di Excel tersimpan sebagai angka, Excel hanya menyimpan 15 digit. Sistem memberi peringatan; cocokkan dengan KTP asli setelah impor.'
      ]
    },
    {
      id: 'hr-lengkapi', guide: 'hr', perm: ['employee.manage'], title: 'Melengkapi data yang kurang',
      intro: 'Setelah impor, sebagian data biasanya belum lengkap, misalnya nomor HP, jenis kelamin, atau jenis hubungan kerja.',
      steps: [
        'Buka menu Karyawan.',
        'Centang Hanya yang datanya belum lengkap, lalu tekan Tampilkan.',
        'Kolom Kelengkapan menunjukkan jumlah data yang kurang. Tekan Kelola pada karyawan.',
        'Kotak kuning di atas halaman menyebut data apa saja yang belum ada.',
        'Tekan Ubah Data untuk melengkapi data umum, atau Ubah Data Identitas untuk nomor KTP/NPWP.'
      ],
      result: 'Setelah semua dilengkapi, kolom Kelengkapan menampilkan "Lengkap".'
    },
    {
      id: 'hr-tambah', guide: 'hr', perm: ['employee.manage'], title: 'Menambah satu karyawan',
      intro: 'Untuk karyawan baru yang masuk setelah impor awal.',
      steps: [
        'Buka menu Karyawan, lalu tekan Tambah Karyawan.',
        'Isi kolom bertanda bintang: Nama lengkap, Nama panggilan, Jabatan, dan Tanggal masuk.',
        'Isi data lain yang sudah ada: identitas, kontak, atasan langsung, jenis hubungan kerja, dan kontak darurat.',
        'Pilih Status awal: Aktif atau Masa percobaan.',
        'Tekan Simpan Karyawan.'
      ],
      result: 'Halaman data karyawan baru terbuka dengan Employee ID berikutnya, misalnya MKL-0025.',
      notes: [
        'Jika muncul peringatan nama yang sama, periksa apakah orangnya memang berbeda. Jika berbeda, centang kotak konfirmasi lalu tekan Simpan Karyawan lagi.',
        'Data karyawan tidak bisa dihapus. Karyawan yang keluar diubah statusnya.'
      ]
    },
    {
      id: 'hr-ubah', guide: 'hr', perm: ['employee.manage'], title: 'Mengubah data karyawan',
      intro: 'Perubahan jabatan, atasan, jenis hubungan kerja, dan tanggal masuk otomatis tercatat di Riwayat kepegawaian.',
      steps: [
        'Buka menu Karyawan, tekan Kelola pada karyawan yang dimaksud.',
        'Tekan Ubah Data.',
        'Ubah kolom yang perlu. Untuk mengosongkan data, hapus isinya.',
        'Isi Alasan perubahan, misalnya "Promosi per 1 November 2026".',
        'Tekan Simpan Perubahan.'
      ],
      result: 'Muncul pesan "Data karyawan disimpan". Perubahan jabatan tampil di kotak Riwayat kepegawaian.',
      notes: ['Jika muncul pesan bahwa data sudah diubah orang lain, muat ulang halaman lalu ulangi perubahan.']
    },
    {
      id: 'hr-status', guide: 'hr', perm: ['employee.manage'], title: 'Mengubah status karyawan (misalnya resign)',
      intro: 'Status menentukan apakah karyawan masih bekerja. Status Kandidat, Mengundurkan diri, Diberhentikan, dan Kontrak berakhir dianggap tidak bekerja.',
      steps: [
        'Buka data karyawan, lalu tekan Ubah Status.',
        'Pilih Status baru.',
        'Isi Tanggal berlaku dan Alasan, misalnya "Mengundurkan diri, surat tanggal 1 Nov 2026".',
        'Baca peringatan kuning jika ada, lalu tekan Simpan Status.'
      ],
      result: 'Status berubah dan tercatat di Riwayat kepegawaian. Karyawan yang tidak bekerja lagi pindah ke filter Status: Sudah keluar.',
      notes: [
        'Jika status menjadi tidak bekerja, akun portal Staff karyawan itu otomatis dinonaktifkan dan dikeluarkan dari semua perangkat.',
        'Akun dengan role sensitif (misalnya HR Admin atau Payroll) tidak dinonaktifkan otomatis. Minta Direktur menonaktifkannya di menu Pengguna.',
        '[Perlu konfirmasi HR/penasihat hukum] Kewajiban saat karyawan keluar (pesangon, sisa cuti, dokumen) belum diatur di tahap ini.'
      ]
    },
    {
      id: 'hr-identitas', guide: 'hr', perm: ['hr.sensitive.read'], title: 'Melihat dan mengubah nomor KTP dan NPWP',
      intro: 'Nomor KTP dan NPWP ditampilkan tersamar. Menampilkan nomor lengkap dicatat di audit log atas nama Anda.',
      steps: [
        'Buka data karyawan. Lihat kotak Data identitas.',
        'Untuk melihat nomor lengkap, tekan Tampilkan, lalu Tampilkan lagi di jendela konfirmasi. Tutup jendela setelah selesai.',
        'Untuk mengubah, tekan Ubah Data Identitas.',
        'Isi Nomor KTP (NIK) baru (16 digit) dan/atau NPWP baru, pilih Status pajak (PTKP) jika perlu.',
        'Isi Alasan, misalnya "Dicocokkan dengan KTP asli", lalu tekan Simpan.'
      ],
      result: 'Muncul pesan "Data identitas disimpan". Label "Perlu dicek" hilang jika nomor KTP sudah 16 digit.',
      notes: [
        'Jangan memotret layar atau mengirim nomor KTP lewat chat.',
        '[Perlu konfirmasi HR/konsultan pajak] Status pajak (PTKP) mengikuti aturan perpajakan yang berlaku.'
      ]
    },
    {
      id: 'hr-akun-massal', guide: 'hr', perm: ['employee.account.manage'], title: 'Membuat akun untuk semua karyawan',
      intro: 'Setelah data karyawan masuk, buat akun portal (role Staff) untuk semua karyawan aktif yang belum punya akun. Username diambil dari nama panggilan dengan huruf kecil.',
      steps: [
        'Pastikan karyawan yang SUDAH punya akun (misalnya Manajer Operasional) sudah dihubungkan oleh admin. Lihat kolom Akun di daftar Karyawan: yang sudah terhubung menampilkan username.',
        'Buka menu Karyawan, lalu tekan Buat Akun Massal.',
        'Periksa daftar nama yang akan dibuatkan akun, lalu tekan Buat N Akun.',
        'Tunggu sampai proses selesai. Jangan menutup halaman.',
        'Di jendela Hasil pembuatan akun, tekan Cetak Kartu Akun. Setiap kartu berisi nama, alamat portal, username, dan password sementara.',
        'Periksa bagian Dilewati jika ada (misalnya username sudah dipakai). Buat akun mereka satu per satu dengan username lain.',
        'Tekan Saya sudah mencetak/mencatat.'
      ],
      result: 'Kolom Akun di daftar Karyawan menampilkan username setiap karyawan.',
      notes: [
        'Password sementara hanya tampil sekali. Jika terlewat, minta System Admin mereset password karyawan tersebut.',
        'Berikan kartu langsung ke masing-masing karyawan. Jangan mengirim lewat grup chat. Karyawan wajib membuat password baru saat pertama masuk.'
      ]
    },
    {
      id: 'hr-akun', guide: 'hr', perm: ['employee.account.manage'], title: 'Membuat akun untuk satu karyawan',
      intro: 'Untuk karyawan baru atau karyawan yang dilewati saat pembuatan akun massal.',
      steps: [
        'Buka data karyawan, lihat kotak Akun portal.',
        'Tekan Buat Akun.',
        'Kosongkan Username agar dibuat dari nama panggilan, atau isi username lain (huruf kecil, contoh dua.lestari).',
        'Tekan Buat Akun, lalu catat password sementara yang tampil.'
      ],
      result: 'Kotak Akun portal menampilkan username karyawan.'
    },
    {
      id: 'hr-jabatan', guide: 'hr', perm: ['employee.manage'], title: 'Mengelola daftar jabatan',
      intro: 'Jabatan dipilih pada data karyawan. Jabatan dari file Excel dibuat otomatis saat impor.',
      steps: [
        'Buka menu Jabatan.',
        'Untuk menambah, tekan Tambah Jabatan, isi Nama jabatan, lalu Simpan.',
        'Untuk mengganti nama atau berhenti memakai jabatan, tekan Ubah, ubah nama atau hapus centang Masih dipakai, isi alasan, lalu Simpan.'
      ],
      result: 'Daftar jabatan menampilkan perubahan dan jumlah karyawan aktif pada setiap jabatan.',
      notes: ['Jabatan tidak bisa dihapus agar riwayat karyawan tetap terbaca.']
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

    {
      id: 'admin-hubungkan', guide: 'sysadmin', perm: ['user.manage', 'user.manage.privileged'], title: 'Menghubungkan akun dengan data karyawan',
      intro: 'Akun yang dibuat di menu Pengguna belum terhubung dengan data karyawan. Hubungkan agar pemiliknya bisa membuka Profil Saya dan, bagi Supervisor, melihat timnya.',
      steps: [
        'Pastikan HR sudah memasukkan data karyawan orang tersebut.',
        'Buka menu Pengguna, tekan Kelola pada akun yang dimaksud.',
        'Di kotak Data karyawan, tekan Hubungkan ke Karyawan.',
        'Pilih nama karyawan, isi Alasan, lalu tekan Hubungkan.'
      ],
      result: 'Kotak Data karyawan menampilkan nama dan Employee ID karyawan.',
      notes: [
        'Akun dengan role sensitif (misalnya Manajer Operasional dengan role HR Admin dan Payroll) hanya bisa dihubungkan oleh Manajemen (Direktur).',
        'Lakukan ini SEBELUM HR menekan Buat Akun Massal, agar orang tersebut tidak mendapat akun kedua.',
        'Akun Direktur yang bukan karyawan tidak perlu dihubungkan.'
      ]
    },

    // ------------------------------------------------------------ Manajemen
    {
      id: 'mgmt-karyawan', guide: 'management', perm: ['employee.read.all'], title: 'Melihat data karyawan',
      intro: 'Manajemen dan Payroll dapat melihat data kepegawaian dasar semua karyawan.',
      steps: [
        'Buka menu Karyawan.',
        'Gunakan filter Status dan Jabatan, atau cari nama.',
        'Tekan Lihat untuk membuka jabatan, atasan, tanggal masuk, masa kerja, dan status.'
      ],
      result: 'Data kepegawaian dasar tampil. Data pribadi, kontak, dan nomor identitas hanya dapat dilihat HR.'
    },
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
      id: 'mgmt-hubungkan-mo', guide: 'management', perm: ['user.manage.privileged'], title: 'Menghubungkan akun Manajer Operasional',
      intro: 'Akun Manajer Operasional dibuat sebelum data karyawan ada dan memiliki role sensitif, sehingga hanya Manajemen yang bisa menghubungkannya ke data karyawannya.',
      steps: [
        'Tunggu sampai HR selesai mengimpor data karyawan.',
        'Buka menu Pengguna, tekan Kelola pada akun Manajer Operasional.',
        'Di kotak Data karyawan, tekan Hubungkan ke Karyawan.',
        'Pilih nama Manajer Operasional, isi Alasan, lalu tekan Hubungkan.'
      ],
      result: 'Manajer Operasional bisa membuka Profil Saya, melihat anggota timnya, dan tidak mendapat akun kedua saat pembuatan akun massal.'
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
    { q: 'Menu absensi, cuti, dan slip gaji belum ada. Kapan tersedia?', a: 'Fitur tersebut sedang dibuat bertahap dan akan muncul di menu setelah selesai diuji.' },
    { q: 'Data pribadi saya salah. Bagaimana memperbaikinya?', a: 'Nomor HP, email pribadi, alamat, dan kontak darurat bisa Anda ubah sendiri di Profil Saya. Data lain (nama, tanggal lahir, KTP, jabatan) diperbaiki HR.', perm: ['profile.read.own'] },
    { q: 'Siapa yang bisa melihat nomor KTP saya?', a: 'Hanya HR. Di layar pun nomor ditampilkan tersamar, dan setiap kali HR menampilkan nomor lengkap, tindakan itu tercatat.', perm: ['profile.read.own'] }
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
      problem: '"Akun Anda belum terhubung dengan data karyawan"', cause: 'Akun dibuat admin sebelum data karyawan ada, atau belum dihubungkan.', check: 'Buka Profil Saya.', solution: 'Admin atau Direktur menghubungkan akun di menu Pengguna > Kelola > Data karyawan.', contact: 'HR atau admin'
    },
    {
      problem: 'Impor Excel: "Kolom Nama Lengkap tidak ditemukan"', cause: 'Baris pertama tabel bukan judul kolom, atau judulnya berbeda.', check: 'Buka file di Excel. Pastikan ada kolom berjudul Nama Lengkap (atau Nama) di salah satu dari 10 baris teratas.', solution: 'Perbaiki judul kolom, simpan, lalu unggah lagi.', contact: 'Admin'
    },
    {
      problem: 'Impor Excel: "Layanan Drive API belum aktif"', cause: 'Pemasangan server Tahap 3b-1 belum lengkap.', check: 'Admin menjalankan setupCekStatus di Apps Script.', solution: 'Admin memasang appsscript.json terbaru lalu menjalankan setupJalankanSemua.', contact: 'Admin'
    },
    {
      problem: 'Pesan "Terjadi kesalahan pada server" dengan kode', cause: 'Kesalahan tak terduga di sistem.', check: 'Catat Kode permintaan.', solution: 'Laporkan dengan screenshot dan kode tersebut.', contact: 'Admin'
    }
  ]
};
