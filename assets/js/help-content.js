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
  version: '0.9.10',
  updatedAt: '2026-10-28',

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
        'Tanggal lahir, jenis kelamin, dan nomor KTP diisi lewat Lengkapi Data Diri (lihat topik berikutnya). Nama dan data kepegawaian hanya bisa diubah HR.',
        'Jika muncul pesan "Akun Anda belum terhubung dengan data karyawan", minta HR atau admin menghubungkan akun Anda.',
        'Setiap perubahan dicatat di sistem.'
      ]
    },
    {
      id: 'data-diri', guide: 'staff', perm: ['profile.update.own'], title: 'Melengkapi data diri dan foto KTP',
      intro: 'Anda mengisi sendiri tempat dan tanggal lahir, jenis kelamin, nomor KTP, dan foto KTP. HR mencocokkannya dengan foto KTP sebelum disimpan.',
      steps: [
        'Siapkan KTP asli. Foto seluruh kartu di tempat terang sampai tulisan terbaca jelas.',
        'Buka menu Profil Saya, lalu tekan Lengkapi Data Diri di kotak Data pribadi.',
        'Isi Tempat lahir, Tanggal lahir, Jenis kelamin, dan Nomor KTP (NIK) 16 digit, sama persis dengan KTP.',
        'Di Foto KTP, pilih foto KTP (JPG, PNG, atau PDF, maksimal 5 MB).',
        'Tekan Kirim ke HR.'
      ],
      result: 'Muncul pesan "Data diri dikirim. HR akan mencocokkan dengan foto KTP Anda." Kotak Data pribadi menampilkan "sedang diperiksa HR". Setelah disetujui, Anda mendapat notifikasi dan datanya berubah.',
      notes: [
        'Jika ditolak, alasan dari HR tampil di Profil Saya. Perbaiki, lalu tekan Lengkapi Data Diri lagi.',
        'Selama masih diperiksa, Anda bisa menekan Batalkan Pengiriman untuk mengirim ulang dengan data yang benar.',
        'Foto KTP disimpan di folder privat perusahaan dan hanya dibuka oleh HR. Jangan kirim foto KTP lewat grup chat.'
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
      id: 'pengumuman-baca', guide: 'staff', perm: ['announcement.read'], title: 'Membaca pengumuman',
      intro: 'Pengumuman dari perusahaan tampil di menu Pengumuman dan di Beranda. Pengumuman baru juga muncul sebagai notifikasi di ikon lonceng.',
      steps: [
        'Buka menu Pengumuman. Pengumuman yang belum dibaca bertanda Baru.',
        'Tekan judul atau Baca selengkapnya.',
        'Jika ada tulisan "Pengumuman ini memerlukan konfirmasi", baca sampai selesai lalu tekan Saya sudah membaca dan memahami.'
      ],
      result: 'Tanda Baru hilang. Untuk pengumuman wajib konfirmasi, muncul kotak hijau bahwa Anda sudah mengonfirmasi.'
    },
    {
      id: 'notifikasi', guide: 'staff', perm: null, title: 'Melihat notifikasi (ikon lonceng)',
      intro: 'Ikon lonceng di kanan atas menunjukkan jumlah notifikasi yang belum dibaca, misalnya pengumuman baru atau kontrak yang sudah aktif.',
      steps: [
        'Tekan ikon lonceng di kanan atas.',
        'Notifikasi yang belum dibaca bertanda garis biru di kiri. Tekan notifikasi untuk membuka halaman terkait.',
        'Untuk menghapus angka di lonceng sekaligus, tekan Tandai Semua Sudah Dibaca.'
      ],
      result: 'Angka di lonceng berkurang atau hilang.',
      notes: ['Angka di lonceng diperbarui otomatis setiap 3 menit. Notifikasi tidak pernah memuat gaji, nomor KTP, atau password.']
    },
    {
      id: 'kontrak-saya', guide: 'staff', perm: ['contract.read.own'], title: 'Melihat dan mengunduh kontrak kerja',
      intro: 'Kontrak yang sudah ditandatangani dan diaktifkan HR tampil di menu Kontrak Saya.',
      steps: [
        'Buka menu Kontrak Saya.',
        'Periksa nomor kontrak, jenis, periode, status, dan upah.',
        'Tekan Unduh PDF Kontrak untuk menyimpan salinan kontrak bertanda tangan.'
      ],
      result: 'File PDF kontrak tersimpan di ponsel atau komputer Anda.',
      notes: ['Simpan file kontrak di tempat aman karena berisi nomor KTP Anda.', 'Draf kontrak yang belum ditandatangani tidak tampil di sini.']
    },
    {
      id: 'bpjs-saya', guide: 'staff', perm: ['bpjs.read.own'], title: 'Melihat status BPJS',
      intro: 'Menu BPJS Saya menampilkan status BPJS Kesehatan dan BPJS Ketenagakerjaan Anda yang tercatat di perusahaan.',
      steps: ['Buka menu BPJS Saya.', 'Cocokkan nomor kartu dengan kartu BPJS atau aplikasi Mobile JKN / JMO Anda.'],
      result: 'Anda mengetahui status kepesertaan BPJS. Jika berbeda, hubungi HR.'
    },
    {
      id: 'dokumen-saya', guide: 'staff', perm: ['profile.read.own'], title: 'Mengunduh dokumen saya',
      intro: 'Dokumen Anda yang disimpan HR (misalnya ijazah, sertifikat, kartu BPJS) bisa diunduh di menu Dokumen Saya.',
      steps: ['Buka menu Dokumen Saya.', 'Tekan Unduh pada dokumen yang diperlukan.'],
      result: 'File tersimpan di perangkat Anda.',
      notes: ['Untuk menambah atau mengganti dokumen, serahkan dokumen ke HR.']
    },
    {
      id: 'absen', guide: 'staff', perm: ['attendance.clock.own'], title: 'Absen masuk dan pulang',
      intro: 'Absen dilakukan dari ponsel di lokasi kerja. Sistem memeriksa posisi GPS ponsel dan memakai jam server (WITA).',
      steps: [
        'Nyalakan Lokasi/GPS di ponsel.',
        'Buka menu Absen (atau tekan tombol Absen Masuk di Beranda).',
        'Periksa jadwal Anda hari ini, lalu tekan Absen Masuk.',
        'Jika browser meminta izin lokasi, pilih Izinkan.',
        'Saat selesai bekerja, buka menu Absen lagi dan tekan Absen Pulang.'
      ],
      result: 'Muncul pesan "Absen masuk tercatat pukul ..." (atau "Absen pulang tercatat ..."), dan jam tampil di kotak Masuk/Pulang.',
      notes: [
        'Absen hanya bisa di dalam radius lokasi kerja. Jika ditolak karena jarak, pastikan Anda berada di area Mookiland lalu coba lagi.',
        'Jika pesan menyebut sinyal GPS kurang akurat, tunggu beberapa detik di tempat terbuka lalu tekan lagi.',
        'Lupa absen atau ponsel bermasalah? Hubungi HR untuk dicatat manual. Jangan meminta rekan memakai akun Anda.'
      ]
    },
    {
      id: 'jadwal-saya', guide: 'staff', perm: ['schedule.read.own'], title: 'Melihat jadwal kerja',
      intro: 'Menu Jadwal Saya menampilkan shift Anda yang sudah diterbitkan untuk dua minggu.',
      steps: [
        'Buka menu Jadwal Saya.',
        'Hari ini ditandai dengan warna dan tulisan (hari ini).',
        'Tekan Berikutnya → untuk melihat dua minggu berikutnya, atau ← Sebelumnya untuk dua minggu sebelumnya.'
      ],
      result: 'Anda melihat kode shift, nama shift, dan jam masuk–pulang setiap hari, atau Libur.',
      notes: ['Jika jadwal Anda diubah setelah terbit, Anda mendapat notifikasi di ikon lonceng.', '"Belum ada jadwal" berarti jadwal hari itu belum diterbitkan atasan/HR.']
    },
    {
      id: 'absensi-saya', guide: 'staff', perm: ['attendance.read.own'], title: 'Melihat catatan absensi',
      intro: 'Menu Absensi Saya menampilkan jam masuk, jam pulang, dan status kehadiran Anda per bulan.',
      steps: [
        'Buka menu Absensi Saya.',
        'Lihat Ringkasan: hari terjadwal, hadir, terlambat, tidak hadir, belum absen pulang, dan total jam kerja.',
        'Gulir ke Rincian harian untuk melihat setiap hari. Tekan ← Bulan lalu untuk bulan sebelumnya.'
      ],
      result: 'Anda mengetahui catatan kehadiran Anda yang dipakai perusahaan.',
      notes: ['Jika ada yang salah (misalnya lupa absen pulang), tekan Ajukan Koreksi pada tanggal itu. Lihat topik "Mengajukan koreksi absensi".']
    },
    {
      id: 'ajukan-cuti', guide: 'staff', perm: ['leave.request.own'], title: 'Mengajukan cuti, izin, atau sakit',
      intro: 'Cuti tahunan hanya untuk karyawan bulanan yang ditetapkan HR. Semua karyawan bisa mengajukan sakit, izin, dan cuti khusus. Semua disetujui Manajer Operasional.',
      steps: [
        'Buka menu Pengajuan Saya, lalu tekan Ajukan Cuti / Izin / Sakit.',
        'Pilih Jenis, lalu isi Tanggal mulai dan Tanggal selesai. Sistem langsung menampilkan jumlah hari (hari Libur di jadwal tidak dihitung) dan sisa cuti Anda.',
        'Untuk sakit lebih dari 1 hari, pilih file surat dokter (PDF atau foto) di kolom Lampiran.',
        'Isi Alasan, lalu tekan Kirim Pengajuan.'
      ],
      result: 'Pengajuan tampil di Riwayat pengajuan dengan status Menunggu. Setelah diputuskan, Anda mendapat notifikasi di ikon lonceng.',
      notes: [
        'Cuti tahunan diajukan paling lambat 3 hari sebelumnya. Untuk keadaan mendesak, hubungi Manajer Operasional.',
        'Sakit dan izin boleh diajukan setelah kejadian, paling lama 30 hari ke belakang.',
        'Saldo cuti baru berkurang setelah disetujui. Pengajuan yang masih menunggu sudah diperhitungkan agar tidak melebihi saldo.'
      ]
    },
    {
      id: 'ajukan-lembur', guide: 'staff', perm: ['overtime.request.own'], title: 'Mengajukan lembur',
      intro: 'Lembur bisa diajukan sebelum (rencana) atau sesudah dikerjakan (laporan, untuk lembur mendadak).',
      steps: [
        'Buka menu Pengajuan Saya, lalu tekan Ajukan Lembur.',
        'Isi Tanggal lembur, Jam mulai, dan Jam selesai. Lama lembur tampil di bawahnya.',
        'Isi Alasan / pekerjaan, lalu tekan Kirim Pengajuan.'
      ],
      result: 'Pengajuan berstatus Menunggu. Manajer Operasional bisa menyetujui seluruhnya atau sebagian menit.',
      notes: ['Tanggal hari ini atau ke depan dicatat sebagai rencana; tanggal yang sudah lewat sebagai laporan (paling lama 7 hari).', 'Lembur paling lama 4 jam per hari. [Perlu konfirmasi HR]']
    },
    {
      id: 'ajukan-koreksi', guide: 'staff', perm: ['attendance.correction.request.own'], title: 'Mengajukan koreksi absensi',
      intro: 'Dipakai jika Anda lupa absen masuk/pulang atau jam yang tercatat salah.',
      steps: [
        'Buka menu Absensi Saya. Pada tanggal yang salah, tekan Ajukan Koreksi (atau dari Pengajuan Saya tekan Ajukan Koreksi Absen).',
        'Isi Jam masuk yang benar dan/atau Jam pulang yang benar. Kosongkan yang sudah benar.',
        'Centang Pulang keesokan hari jika shift selesai lewat tengah malam.',
        'Isi Alasan, lalu tekan Kirim Pengajuan.'
      ],
      result: 'Tanggal itu bertanda Koreksi menunggu. Setelah disetujui, jam di Absensi Saya berubah dan sumbernya tertulis Koreksi disetujui.',
      notes: ['Koreksi hanya untuk hari ini atau tanggal yang sudah lewat, paling lama 31 hari ke belakang.']
    },
    {
      id: 'ajukan-kasbon', guide: 'staff', perm: ['loan.request.own'], title: 'Mengajukan kasbon',
      intro: 'Kasbon diajukan dari portal dan diputuskan Direktur. Cicilannya dipotong otomatis dari gaji.',
      steps: [
        'Buka menu Pengajuan Saya, lalu tekan Ajukan Kasbon.',
        'Isi Jumlah kasbon (Rp). Di bawahnya tampil angka dalam Rupiah; periksa sebelum mengirim.',
        'Pilih Usulan cicilan (berapa kali gajian), lalu isi Keperluan.',
        'Tekan Kirim Pengajuan.'
      ],
      result: 'Muncul pesan "Pengajuan kasbon ... dikirim ke Direktur." Setelah diputuskan, Anda mendapat notifikasi berisi jumlah, cicilan, dan mulai dipotong.',
      notes: [
        'Direktur menentukan jumlah yang disetujui, jumlah cicilan, dan bulan mulai dipotong.',
        'Kasbon baru hanya bisa diajukan setelah kasbon sebelumnya lunas. Sisa kasbon tampil di Pengajuan Saya.',
        'Potongan kasbon tercantum di slip gaji.'
      ]
    },
    {
      id: 'pengajuan-saya', guide: 'staff', perm: ['leave.request.own', 'overtime.request.own', 'attendance.correction.request.own'], title: 'Melihat dan membatalkan pengajuan',
      intro: 'Semua pengajuan Anda (cuti, izin, sakit, lembur, koreksi) ada di menu Pengajuan Saya beserta keputusannya.',
      steps: [
        'Buka menu Pengajuan Saya. Bagian atas menampilkan sisa cuti tahunan (jika Anda berhak).',
        'Lihat kolom Status: Menunggu, Disetujui, Ditolak, atau Dibatalkan, beserta catatan dari penyetuju.',
        'Untuk menarik pengajuan yang masih Menunggu, tekan Batalkan lalu konfirmasi.'
      ],
      result: 'Status pengajuan berubah menjadi Dibatalkan.',
      notes: ['Pengajuan yang sudah disetujui hanya bisa dibatalkan HR. Hubungi Manajer Operasional.']
    },
    {
      id: 'slip-saya', guide: 'staff', perm: ['payslip.read.own'], title: 'Melihat dan mengunduh slip gaji',
      intro: 'Slip gaji setiap periode (tanggal 27 sampai 26) tersedia di menu Slip Gaji Saya setelah gaji periode itu dibayar.',
      steps: [
        'Buka menu Slip Gaji Saya.',
        'Cari baris periode yang ingin dilihat, misalnya Desember 2026.',
        'Tekan Unduh PDF.'
      ],
      result: 'File PDF slip gaji tersimpan di ponsel atau komputer Anda. Isinya: rincian upah atau gaji, lembur, tambahan, potongan, dan gaji bersih.',
      notes: [
        'Slip belum muncul jika gaji periode itu belum ditandai dibayar. Anda mendapat notifikasi di lonceng saat slip tersedia.',
        'Simpan file slip di tempat aman dan jangan dibagikan di grup chat.',
        'Jika ada angka yang tidak sesuai, hubungi Manajer Operasional.'
      ]
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

    {
      id: 'susun-jadwal', guide: 'supervisor', perm: ['schedule.manage.all', 'schedule.manage.team'], title: 'Menyusun dan menerbitkan jadwal mingguan',
      intro: 'Jadwal disusun per minggu (Senin–Minggu). Supervisor hanya bisa menjadwalkan anggota timnya; HR bisa menjadwalkan semua karyawan.',
      steps: [
        'Buka menu Susun Jadwal. Pilih minggu dengan ← Minggu lalu / Minggu depan →.',
        'Untuk memulai dari jadwal minggu sebelumnya, tekan Salin dari Minggu Lalu. Sel yang sudah terisi tidak ditimpa.',
        'Di setiap kotak (karyawan × hari), pilih shift, Libur, atau – (kosong). Kotak yang diubah berwarna kuning.',
        'Tekan Simpan Draf. Draf (warna biru) belum terlihat oleh karyawan.',
        'Jika sudah benar, tekan Terbitkan lalu konfirmasi.'
      ],
      result: 'Muncul pesan "Jadwal ... diterbitkan". Karyawan yang jadwalnya berubah mendapat notifikasi dan bisa melihatnya di Jadwal Saya.',
      notes: [
        'Absensi (terlambat, tidak hadir) dihitung dari jadwal yang sudah terbit.',
        'Mengubah jadwal yang sudah terbit tidak langsung terlihat karyawan sampai Anda menekan Terbitkan lagi.',
        'Di ponsel, geser tabel ke kanan untuk melihat hari lainnya.'
      ]
    },
    {
      id: 'rekap-absensi', guide: 'supervisor', perm: ['attendance.read.all', 'attendance.read.team'], title: 'Melihat rekap absensi',
      intro: 'Rekap Absensi menampilkan kehadiran, keterlambatan, dan jam kerja per karyawan. Supervisor hanya melihat anggota timnya.',
      steps: [
        'Buka menu Rekap Absensi.',
        'Isi Dari dan Sampai (maksimal 62 hari), lalu tekan Tampilkan.',
        'Tekan Rincian pada seorang karyawan untuk melihat setiap hari: jadwal, jam masuk/pulang, status, dan sumber data (Aplikasi, Raptor, atau Dicatat HR).'
      ],
      result: 'Rekap dan rincian per hari tampil di layar.',
      notes: ['Tidak hadir = ada jadwal terbit tetapi tidak ada absen. Belum lengkap = absen masuk tanpa absen pulang.']
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
      id: 'hr-hapus-ganda', guide: 'hr', perm: ['employee.manage'], title: 'Menghapus data karyawan ganda atau data contoh',
      intro: 'Data ganda (misalnya karena impor dua kali) atau data contoh yang belum pernah dipakai bisa dihapus permanen, termasuk akun Staff-nya.',
      steps: [
        'Buka menu Karyawan, lalu bandingkan baris yang ganda. Tentukan mana yang dipakai dan catat Employee ID-nya.',
        'Tekan Kelola pada data yang akan dihapus (bukan yang dipakai).',
        'Gulir ke bawah, di kotak Hapus data karyawan tekan Hapus Data Karyawan.',
        'Isi Alasan, misalnya "Data ganda dari impor; yang dipakai MKL-0003", lalu tekan Hapus Permanen.'
      ],
      result: 'Muncul pesan "Data ... dihapus." dan baris itu hilang dari daftar Karyawan. Jika data itu punya akun Staff, akunnya ikut dihapus dan tidak bisa masuk lagi.',
      notes: [
        'Sistem menolak penghapusan jika data itu sudah punya absensi, cuti, lembur, kontrak, BPJS, dokumen, profil gaji, rekening, atau menjadi atasan langsung karyawan lain. Pesannya menyebut apa saja yang masih ada.',
        'Jika akunnya memegang role sensitif (misalnya Manajer Operasional), minta Direktur memutus hubungan akun dulu di menu Pengguna.',
        'Karyawan yang pernah bekerja jangan dihapus; gunakan Ubah Status (misalnya Mengundurkan diri).',
        'Penghapusan tercatat di Audit Log.'
      ]
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

    {
      id: 'hr-kontrak-buat', guide: 'hr', perm: ['contract.manage'], title: 'Membuat kontrak kerja',
      intro: 'Kontrak dibuat dari halaman data karyawan. Alurnya: buat draf, buat PDF dari template, tanda tangani, unggah PDF bertanda tangan, lalu aktifkan.',
      steps: [
        'Buka menu Karyawan, tekan Kelola pada karyawan yang dimaksud, lalu gulir ke kotak Kontrak kerja.',
        'Tekan Buat Kontrak.',
        'Pilih Jenis kontrak (misalnya Harian untuk Perjanjian Pekerja Harian Masa Pelatihan), isi Tanggal kontrak, Tanggal mulai, Tanggal berakhir, Besaran upah, Satuan upah, dan Dibayar (mingguan/bulanan).',
        'Tekan Simpan.'
      ],
      result: 'Muncul draf dengan nomor kontrak otomatis, misalnya PK/2026/001, beserta langkah berikutnya.',
      notes: [
        'Jika muncul jendela "Perlu diperiksa", misalnya total PKWT lebih dari 5 tahun, konsultasikan dulu dengan penasihat hukum sebelum ditandatangani.',
        'Satu karyawan hanya boleh punya satu draf pada satu waktu.'
      ]
    },
    {
      id: 'hr-kontrak-pdf', guide: 'hr', perm: ['contract.manage'], title: 'Membuat PDF kontrak dari template',
      intro: 'Sistem mengisi template Word dengan data karyawan dan kontrak, lalu membuat PDF siap cetak.',
      steps: [
        'Di kotak Kontrak kerja, pada draf, tekan Buat PDF dari Template.',
        'Jika muncul "Data belum lengkap", lengkapi data yang disebut (misalnya alamat lewat Ubah Data, atau nomor KTP lewat Ubah Data Identitas), lalu tekan lagi.',
        'PDF terunduh otomatis. Periksa isinya, lalu cetak dua rangkap.',
        'Untuk mengunduh lagi, tekan Unduh PDF untuk Ditandatangani.'
      ],
      result: 'PDF kontrak berisi nama, alamat, nomor KTP, tanggal, dan upah karyawan, tanpa kolom isian {{...}} yang tersisa.',
      notes: ['PDF memuat nomor KTP. Jangan kirim lewat chat. Draf PDF tidak terlihat oleh karyawan.', 'Tombol ini hanya muncul jika sudah ada template Word untuk jenis kontrak tersebut (menu Template Kontrak).']
    },
    {
      id: 'hr-kontrak-aktif', guide: 'hr', perm: ['contract.manage'], title: 'Mengunggah kontrak bertanda tangan dan mengaktifkan',
      intro: 'Kontrak baru berlaku di sistem setelah PDF bertanda tangan diunggah dan kontrak diaktifkan.',
      steps: [
        'Pindai (scan) kontrak yang sudah ditandatangani kedua pihak menjadi satu file PDF.',
        'Pada draf, tekan Unggah PDF Bertanda Tangan, pilih file, lalu tekan Unggah.',
        'Tekan Aktifkan Kontrak, isi Tanggal ditandatangani, lalu tekan Aktifkan.'
      ],
      result: 'Status kontrak menjadi Aktif. Jenis hubungan kerja dan akhir kontrak di data karyawan ikut diperbarui, dan karyawan mendapat notifikasi serta bisa mengunduh kontraknya di Kontrak Saya.'
    },
    {
      id: 'hr-kontrak-perpanjang', guide: 'hr', perm: ['contract.manage'], title: 'Memperpanjang atau mengakhiri kontrak',
      intro: 'Perpanjangan dibuat sebagai kontrak baru yang terhubung dengan kontrak sebelumnya.',
      steps: [
        'Pada kontrak berstatus Aktif, tekan Perpanjang. Tanggal mulai otomatis diisi sehari setelah kontrak lama berakhir.',
        'Isi data kontrak baru, lalu ikuti langkah membuat PDF, tanda tangan, unggah, dan aktifkan.',
        'Untuk mengakhiri kontrak lebih awal, tekan Akhiri Kontrak, isi tanggal dan alasan.'
      ],
      result: 'Setelah kontrak baru diaktifkan, kontrak lama berstatus Diperpanjang.',
      notes: ['Mengakhiri kontrak tidak mengubah status karyawan. Jika karyawan berhenti bekerja, gunakan juga Ubah Status.', '[Perlu konfirmasi HR/penasihat hukum] Kompensasi akhir PKWT dan hak lain saat kontrak berakhir belum dihitung sistem.']
    },
    {
      id: 'hr-kontrak-pengingat', guide: 'hr', perm: ['contract.manage'], title: 'Memantau kontrak yang akan berakhir',
      intro: 'Sistem mengirim notifikasi ke HR 60, 30, 14, dan 7 hari sebelum kontrak berakhir, dan sekali lagi jika tanggalnya sudah lewat.',
      steps: [
        'Buka menu Kontrak. Secara bawaan tampil kontrak yang berakhir dalam 60 hari, diurutkan dari yang paling dekat.',
        'Tekan Kelola untuk membuka data karyawan lalu perpanjang atau akhiri kontraknya.'
      ],
      result: 'Tidak ada kontrak yang berakhir tanpa diketahui HR.'
    },
    {
      id: 'hr-template', guide: 'hr', perm: ['template.manage'], title: 'Mengganti template kontrak Word',
      intro: 'Template adalah file Word (.docx) berisi kolom isian seperti {{NAMA_PEKERJA}} yang diisi otomatis oleh sistem.',
      steps: [
        'Buka menu Template Kontrak dan lihat daftar Kolom isian yang bisa dipakai.',
        'Di Word, ketik kolom isian di tempat yang akan diisi, persis seperti di daftar (huruf besar, dengan tanda kurung kurawal ganda).',
        'Tekan Unggah Template, pilih Jenis kontrak, isi nama, pilih file .docx, lalu tekan Unggah.'
      ],
      result: 'Template baru berstatus Dipakai dan versi lama menjadi Versi lama.',
      notes: ['Jika ada kolom isian yang salah eja, template ditolak dan nama kolomnya disebut.', '[Perlu konfirmasi HR/penasihat hukum] Isi template menjadi tanggung jawab Mookiland.']
    },
    {
      id: 'hr-bpjs', guide: 'hr', perm: ['bpjs.manage'], title: 'Mencatat BPJS karyawan',
      intro: 'Setiap karyawan punya catatan BPJS Kesehatan dan BPJS Ketenagakerjaan.',
      steps: [
        'Buka data karyawan, gulir ke kotak BPJS.',
        'Pada BPJS Kesehatan atau BPJS Ketenagakerjaan, tekan Ubah.',
        'Pilih Status (Belum terdaftar, Sedang didaftarkan, Aktif, Nonaktif), isi nomor kepesertaan, tanggal mulai, dan untuk Ketenagakerjaan centang program yang diikuti.',
        'Isi Alasan perubahan, lalu tekan Simpan.',
        'Untuk melihat semua karyawan sekaligus, buka menu BPJS.'
      ],
      result: 'Status tersimpan dan tercatat di Riwayat status BPJS. Karyawan bisa melihatnya di BPJS Saya.',
      notes: ['Status Aktif wajib disertai nomor kepesertaan.', 'Iuran dan potongan BPJS dihitung di modul payroll (Tahap 4).']
    },
    {
      id: 'hr-dokumen', guide: 'hr', perm: ['contract.manage'], title: 'Menyimpan dokumen karyawan',
      intro: 'Dokumen seperti KTP, KK, ijazah, dan sertifikat disimpan di Google Drive privat milik sistem dan hanya bisa dibuka lewat portal.',
      steps: [
        'Buka data karyawan, gulir ke kotak Dokumen, lalu tekan Unggah Dokumen.',
        'Pilih Jenis dokumen, isi judul jika perlu, lalu pilih file PDF, JPG, atau PNG (maksimal 5 MB).',
        'Hapus centang "Karyawan bisa melihat" jika dokumen hanya untuk HR, lalu tekan Unggah.',
        'Untuk dokumen yang salah unggah, tekan Arsipkan dan isi alasannya.'
      ],
      result: 'Dokumen tampil di daftar. Dokumen yang boleh dilihat karyawan muncul di menu Dokumen Saya miliknya.',
      notes: ['Dokumen identitas (KTP, KK, NPWP) bertanda Identitas dan setiap pembukaannya tercatat.', 'Dokumen yang diarsipkan tidak dihapus dan masih bisa dilihat HR.']
    },
    {
      id: 'hr-pengumuman', guide: 'hr', perm: ['announcement.manage'], title: 'Membuat dan menerbitkan pengumuman',
      intro: 'Pengumuman dibuat sebagai draf, lalu diterbitkan. Saat terbit, karyawan sasaran mendapat notifikasi di lonceng.',
      steps: [
        'Buka menu Kelola Pengumuman, tekan Buat Pengumuman.',
        'Isi Judul, Kategori, dan Isi pengumuman. Pilih Untuk: Semua karyawan atau Jabatan tertentu.',
        'Centang Wajib dikonfirmasi untuk aturan atau kebijakan yang harus dibaca semua orang. Isi Tampil sampai jika ada batas waktu.',
        'Tekan Simpan Draf, periksa lagi, lalu tekan Terbitkan.',
        'Tekan Pembaca untuk melihat siapa yang sudah dan belum membaca.'
      ],
      result: 'Pengumuman tampil di menu Pengumuman dan Beranda karyawan sasaran.',
      notes: ['Pengumuman yang sudah terbit tidak bisa diubah. Jika salah, arsipkan lalu buat yang baru.', 'Jangan mencantumkan data pribadi, gaji, atau password di pengumuman.']
    },

    {
      id: 'hr-shift', guide: 'hr', perm: ['schedule.manage.all'], title: 'Membuat daftar shift',
      intro: 'Shift adalah jam kerja yang dipilih saat menyusun jadwal, misalnya masuk 08:00. Buat sekali, lalu dipakai terus.',
      steps: [
        'Buka menu Shift & Lokasi, lalu tekan Tambah Shift.',
        'Isi Kode (singkat, tampil di tabel jadwal), Nama shift, Jam masuk, dan Jam pulang.',
        'Isi Istirahat (menit) dan Toleransi terlambat (menit), pilih Warna, lalu tekan Simpan.',
        'Ulangi untuk setiap jam masuk yang dipakai (misalnya 07:00, 08:00, 10:00, 11:00, 13:00).'
      ],
      result: 'Shift tampil di daftar dan bisa dipilih di Susun Jadwal.',
      notes: [
        'Jam pulang yang lebih awal dari jam masuk (misalnya 22:00–06:00) otomatis dianggap selesai keesokan hari.',
        'Shift yang tidak dipakai lagi: tekan Ubah, hapus centang Aktif. Jadwal lama tetap terbaca.',
        'Mengubah jam shift berlaku juga untuk jadwal yang sudah dibuat dengan shift itu.',
        'Toleransi terlambat dan aturan potongan [Perlu konfirmasi HR].'
      ]
    },
    {
      id: 'hr-lokasi', guide: 'hr', perm: ['attendance.manage'], title: 'Mengatur lokasi kerja untuk absen GPS',
      intro: 'Karyawan hanya bisa absen dari ponsel di dalam radius lokasi kerja yang aktif.',
      steps: [
        'Berdirilah di area absen (misalnya pintu masuk karyawan) dengan ponsel.',
        'Buka menu Shift & Lokasi, lalu tekan Tambah Lokasi.',
        'Isi Nama lokasi, tekan Pakai Lokasi Saya Sekarang (atau ketik Latitude dan Longitude dari Google Maps).',
        'Isi Radius (saran 100 meter) dan Alasan, lalu tekan Simpan.',
        'Tekan koordinat di tabel untuk memeriksa titiknya di Google Maps.'
      ],
      result: 'Lokasi tampil dengan status Aktif dan karyawan bisa mulai absen.',
      notes: ['Radius terlalu kecil membuat absen sering gagal karena GPS ponsel bisa meleset puluhan meter.', 'Sistem tidak bisa mendeteksi aplikasi pemalsu lokasi. Cocokkan dengan data Raptor bila ada kecurigaan.']
    },
    {
      id: 'hr-absen-manual', guide: 'hr', perm: ['attendance.manage'], title: 'Mencatat atau memperbaiki absensi',
      intro: 'Dipakai bila karyawan lupa absen, ponselnya rusak, atau jam dari Raptor salah.',
      steps: [
        'Buka menu Rekap Absensi, pilih rentang tanggal, tekan Tampilkan.',
        'Tekan Rincian pada karyawan yang dimaksud.',
        'Pada tanggal yang salah, tekan Catat (belum ada absen) atau Ubah.',
        'Isi Jam masuk dan/atau Jam pulang. Centang Pulang keesokan hari untuk shift malam.',
        'Isi Alasan, lalu tekan Simpan.'
      ],
      result: 'Kolom Sumber berisi "Dicatat HR" dan Keterangan berisi alasan Anda. Perubahan tercatat di audit log.',
      notes: ['Catatan HR tidak akan ditimpa oleh impor Raptor berikutnya.']
    },
    {
      id: 'hr-impor-raptor', guide: 'hr', perm: ['attendance.import'], title: 'Mengimpor absensi dari Raptor',
      intro: 'Jam masuk/pulang dari laporan Raptor "Employee\'s Time / Attendance" bisa dimasukkan ke portal.',
      steps: [
        'Di Raptor, buka laporan Employee\'s Time / Attendance, pilih periode, lalu ekspor ke Excel.',
        'Di portal, buka Rekap Absensi lalu tekan Impor dari Raptor.',
        'Pilih file .xls atau .xlsx tersebut, lalu tekan Periksa File.',
        'Periksa kolom Karyawan di portal untuk setiap nomor Raptor. Pilih karyawan yang benar, atau Abaikan (bukan karyawan). Pilihan disimpan untuk impor berikutnya.',
        'Buka Catatan yang perlu dicek bila ada, lalu tekan Impor Absensi dan konfirmasi.'
      ],
      result: 'Halaman Hasil impor menampilkan jumlah hari baru, diperbarui, dan dilewati.',
      notes: [
        'Beberapa sesi dalam sehari (misalnya keluar saat istirahat) digabung: jam masuk pertama dan jam pulang terakhir.',
        'Sesi tanpa jam pulang atau lebih dari 16 jam dianggap lupa absen pulang dan ditandai perlu dicek. [Perlu konfirmasi HR]',
        'Absen dari aplikasi (GPS) dan catatan HR tidak pernah ditimpa. Selisih jam masuk ≥ 15 menit antara aplikasi dan Raptor ditampilkan untuk dicek.',
        'Mengimpor file yang sama dua kali tidak menggandakan data.',
        'Riwayat impor tampil di bawah Rekap Absensi dan di halaman Impor dari Raptor. Salah unggah atau ingin mengulang? Di Riwayat impor, tekan Hapus Data pada impor itu. Jendela konfirmasi menampilkan jumlah hari yang akan dihapus. Isi Alasan, lalu tekan Hapus Data Absensi. Setelah itu unggah file yang benar dan tekan Hitung Ulang di periode gaji.',
        'Hapus Data hanya menghapus absensi dari Raptor pada rentang tanggal impor itu. Absen aplikasi (GPS) dan catatan HR tidak dihapus. Hari Raptor yang sudah dikoreksi HR tetap disimpan, kecuali Anda mencentang Hapus juga hari yang sudah dikoreksi HR.',
        'Hapus Data ditolak bila rentangnya mengenai gaji yang sedang diajukan atau sudah disetujui Direktur.',
        'Sesi terakhir yang berlanjut sampai keesokan hari (misalnya absen lagi malam hari) diberi catatan. Periksa dan koreksi bila salah absen.',
        'File Raptor tidak disimpan di server.'
      ]
    },

    {
      id: 'hr-data-diri', guide: 'hr', perm: ['hr.sensitive.manage'], title: 'Memeriksa data diri dari karyawan',
      intro: 'Data diri yang dikirim karyawan (lahir, jenis kelamin, nomor KTP, foto KTP) baru tersimpan setelah Anda setujui.',
      steps: [
        'Buka menu Persetujuan. Pengajuan berlabel Data diri menampilkan data baru dan data sebelumnya.',
        'Tekan Lihat Foto KTP. File terunduh ke perangkat Anda.',
        'Cocokkan Nomor KTP, Tanggal lahir, Tempat lahir, dan Jenis kelamin dengan foto KTP.',
        'Jika sesuai, tekan Setujui lalu Setujui. Jika tidak, tekan Tolak, tulis yang perlu diperbaiki (misalnya "Foto buram" atau "Nomor KTP beda 1 digit"), lalu tekan Tolak.',
        'Hapus file foto KTP dari folder Unduhan perangkat Anda setelah selesai.'
      ],
      result: 'Jika disetujui, data tersimpan di data karyawan dan foto masuk ke dokumen KTP karyawan. Karyawan mendapat notifikasi.',
      notes: [
        'Data diri milik Manajer Operasional diperiksa oleh Direktur.',
        'Nomor KTP yang sudah dipakai karyawan lain ditolak otomatis.',
        'Setiap pembukaan foto KTP tercatat di Audit Log.'
      ]
    },
    {
      id: 'hr-persetujuan', guide: 'hr', perm: ['leave.manage', 'overtime.manage', 'attendance.manage'], title: 'Menyetujui atau menolak pengajuan',
      intro: 'Semua pengajuan cuti, izin, sakit, lembur, dan koreksi absensi masuk ke menu Persetujuan. Jumlah yang menunggu tampil di Beranda.',
      steps: [
        'Buka menu Persetujuan, tab Menunggu.',
        'Baca rincian setiap pengajuan: tanggal, alasan, saldo cuti, lampiran surat dokter (tekan Lihat Lampiran), atau jam absen hari itu untuk lembur dan koreksi.',
        'Tekan Setujui (boleh isi catatan; untuk lembur, menit yang disetujui bisa dikurangi), atau Tolak dan isi alasan.',
        'Tab Riwayat menampilkan keputusan 60 hari terakhir.'
      ],
      result: 'Karyawan mendapat notifikasi. Cuti mengurangi saldo; koreksi langsung mengubah jam absen; cuti/izin/sakit tampil di Rekap Absensi.',
      notes: [
        'Anda tidak bisa memutuskan pengajuan Anda sendiri. Pengajuan Manajer Operasional diputuskan oleh Direktur.',
        'Persetujuan oleh Supervisor belum dipakai: semua pengajuan diputuskan Manajer Operasional.'
      ]
    },
    {
      id: 'hr-saldo-cuti', guide: 'hr', perm: ['leave.manage'], title: 'Mengatur hak dan saldo cuti tahunan',
      intro: 'Cuti tahunan hanya untuk karyawan yang ditandai berhak (karyawan bulanan). Jatah 12 hari dicatat otomatis setiap 1 Januari.',
      steps: [
        'Buka menu Saldo Cuti.',
        'Pada karyawan bulanan, tekan Atur, centang Berhak cuti tahunan, isi alasan, lalu tekan Simpan Hak Cuti. Jatah tahun berjalan langsung dicatat.',
        'Saat mulai memakai sistem, masukkan sisa cuti lama: Atur → Penyesuaian saldo → Jumlah hari (misalnya 3) dan alasan → Simpan Penyesuaian.',
        'Tekan Riwayat untuk melihat semua transaksi saldo dan pengajuan karyawan itu.'
      ],
      result: 'Kolom Sisa menunjukkan saldo terbaru dan karyawan melihat angka yang sama di Pengajuan Saya.',
      notes: [
        'Karyawan yang masuk di tahun berjalan mendapat jatah sebanding bulan penuh yang tersisa (contoh: masuk 1 Juli → 6 hari).',
        'Sisa cuti dibawa seluruhnya ke tahun berikutnya. [Perlu konfirmasi HR/penasihat hukum]',
        'Penyesuaian tidak boleh membuat saldo minus.'
      ]
    },
    {
      id: 'hr-batal-cuti', guide: 'hr', perm: ['leave.manage'], title: 'Membatalkan cuti yang sudah disetujui',
      intro: 'Jika cuti yang sudah disetujui batal dilakukan, HR membatalkannya agar saldo kembali.',
      steps: ['Buka menu Persetujuan, tab Riwayat.', 'Pada cuti yang dimaksud, tekan Batalkan Cuti.', 'Isi alasan, lalu tekan Batalkan Cuti.'],
      result: 'Status menjadi Dibatalkan, saldo cuti tahunan dikembalikan, dan karyawan mendapat notifikasi.'
    },
    {
      id: 'hr-catat-lembur', guide: 'hr', perm: ['overtime.manage'], title: 'Mencatat lembur untuk karyawan',
      intro: 'Manajer Operasional bisa langsung mencatat lembur yang ia perintahkan, tanpa menunggu karyawan mengajukan.',
      steps: ['Buka menu Persetujuan, tekan Catat Lembur Karyawan.', 'Pilih Karyawan, isi tanggal, jam mulai, jam selesai, dan alasan.', 'Tekan Simpan.'],
      result: 'Lembur langsung tercatat disetujui, karyawan mendapat notifikasi, dan totalnya tampil di kolom Lembur disetujui pada Rekap Absensi.',
      notes: ['Lembur untuk diri sendiri tetap harus disetujui Direktur.']
    },

    // ------------------------------------------------------------ Payroll
    {
      id: 'payroll-profil', guide: 'payroll', perm: ['payroll.prepare'], title: 'Mengatur profil gaji karyawan',
      intro: 'Setiap karyawan aktif butuh profil gaji agar gajinya bisa dihitung: jenis gaji, tarif, dan aturan jam. Karyawan tanpa profil gaji tidak dihitung.',
      steps: [
        'Buka menu Profil Gaji. Kotak kuning di atas menyebut berapa karyawan yang belum punya profil.',
        'Tekan Atur Gaji (atau Ubah Gaji) pada baris karyawan.',
        'Pilih Jenis gaji: Harian (dibayar per jam hadir) atau Bulanan (gaji tetap).',
        'Untuk harian, isi Tarif harian (Rp). Untuk bulanan, isi Gaji bulanan (Rp).',
        'Isi Tarif per jam = gaji ÷. Harian: biasanya 8. Bulanan: jam kerja per hari × hari kerja per minggu × 4,33. Contoh: kerja 8 jam termasuk istirahat (7 jam kerja), libur 1 hari = 7 × 6 × 4,33 = 181,86 (file gaji lama membulatkannya menjadi 182); kerja 9 jam termasuk istirahat (8 jam kerja), libur 2 hari = 8 × 5 × 4,33 = 173,2 (file gaji lama: 173). Boleh 2 angka di belakang koma. Di bawahnya tampil Tarif per jam dalam Rupiah.',
        'Karyawan yang kerja 9 jam: pilih Jam dibayar per hari 9 jam, supaya lembur baru dihitung setelah 9 jam.',
        'Pilih Jam dibayar per hari (maksimal): 8 jam, atau 9 jam untuk karyawan yang memang dibayar 9 jam.',
        'Centang Bulatkan jam masuk ke jam shift bila jam masuk karyawan ini dibulatkan seperti di file gaji lama. Hapus centang untuk memakai jam masuk asli.',
        'Centang Dapat upah lembur bila karyawan ini dibayar lembur.',
        'Khusus bulanan: centang Potong jam kurang bila jam kurang dari jam wajib dipotong, lalu isi Jam wajib per hari (menit, termasuk istirahat), misalnya 540 untuk 9 jam.',
        'Isi Berlaku mulai dan Alasan, lalu tekan Simpan.'
      ],
      result: 'Muncul pesan "Profil gaji ... disimpan, berlaku mulai ...: Rp... per hari". Cocokkan angkanya. Kolom Tarif / gaji dan Aturan di tabel terisi.',
      notes: [
        'Saat Ubah Gaji, tanggal Berlaku mulai otomatis terisi tanggal profil yang sekarang. Biarkan tanggal itu untuk memperbaiki angka yang salah ketik.',
        'Kenaikan tarif tidak menimpa tarif lama. Isi tanggal Berlaku mulai yang lebih baru, maka periode yang berakhir sebelum tanggal itu tetap memakai tarif lama. Tekan Riwayat untuk melihat semua perubahan.',
        'Tarif ini ternyata sudah berlaku lebih awal (misalnya tarif awal sejak April)? Di Ubah Gaji, isi Berlaku mulai dengan tanggal yang lebih awal lalu Simpan. Profil lama diganti, tidak ditumpuk. Hal ini ditolak bila karyawan punya tarif lain yang lebih lama di antara kedua tanggal itu, atau bila tanggalnya mengenai gaji yang sudah disetujui.',
        'Untuk mengubah tanggal Berlaku mulai banyak karyawan sekaligus (misalnya setelah input awal), centang karyawannya atau Pilih semua yang punya profil, tekan Ubah Tanggal Berlaku, isi tanggal dan alasan, lalu Simpan. Tarifnya tidak berubah. Setelah itu tekan Hitung Ulang di periode gaji.',
        'Tanggal Berlaku mulai tidak boleh jatuh di periode yang sudah disetujui Direktur.',
        'Setiap perubahan tercatat di Audit Log payroll.'
      ]
    },
    {
      id: 'payroll-rekening', guide: 'payroll', perm: ['bank.read.all'], title: 'Mencatat rekening bank karyawan',
      intro: 'Nomor rekening dipakai untuk Daftar Transfer. Di tabel nomor ditampilkan tersamar (****1234).',
      steps: [
        'Buka menu Profil Gaji.',
        'Tekan Rekening pada baris karyawan. Jika sudah ada, nomor lengkap tampil (pembukaan ini tercatat di Audit Log).',
        'Isi Bank, Nomor rekening (angka saja), Atas nama, dan Alasan.',
        'Tekan Simpan.'
      ],
      result: 'Muncul pesan "Rekening ... disimpan". Kolom Rekening menampilkan nama bank dan 4 angka terakhir.',
      notes: ['Cocokkan nomor rekening dengan buku tabungan atau konfirmasi langsung dari karyawan, bukan dari pesan yang diteruskan orang lain.']
    },
    {
      id: 'payroll-aturan', guide: 'payroll', perm: ['payroll.prepare'], title: 'Cara gaji dihitung',
      intro: 'Perhitungan mengikuti rumus file gaji Mookiland yang lama. Rincian per hari bisa dilihat di tombol Rincian pada setiap karyawan.',
      steps: [
        'Jam masuk dibulatkan (jika dicentang di profil): sebelum 07:00 → 07:00; sampai 08:30 → 08:00; sampai 10:30 → jam asli; sampai 11:20 → 11:00; sampai 13:05 → 13:00; setelah itu → 13:00.',
        'Lama hadir = jam pulang − jam masuk (setelah dibulatkan), termasuk istirahat. Jika Raptor mencatat istirahat dan istirahatnya lebih pendek dari 50 menit, sisa sampai 60 menit ditambahkan.',
        'Tarif per jam = tarif harian atau gaji bulanan ÷ angka di profil gaji (bawaan: harian 8, bulanan 173).',
        'Harian: jam dibayar = jam penuh lama hadir, paling banyak 8 (atau 9). Jika kurang dari 8 jam, dibayar sesuai lama hadir sampai detik.',
        'Jam masuk, pulang, dan lama hadir dihitung sampai detik dari data Raptor, sama seperti file gaji lama.',
        'Lembur = lama hadir di atas 8 (atau 9) jam, minimal 15 menit, dibayar 1× tarif per jam (sampai detik).',
        'Bulanan: gaji tetap. Jika Potong jam kurang aktif, jam di bawah jam wajib pada hari hadir dipotong gaji ÷ 173 per jam.',
        'Hari tanpa jam pulang tidak dibayar dan muncul sebagai peringatan. Perbaiki absensinya dulu (Rekap Absensi > Rincian, atau impor Raptor), lalu Hitung Ulang.'
      ],
      result: 'Angka di Penggajian sama dengan hasil rumus file gaji lama untuk data absensi yang sama.',
      notes: [
        'Lembur dihitung dari jam absen (tidak perlu disetujui dulu) dan dibayar 1× tarif per jam, sesuai file gaji lama dan keputusan pemilik. [Perlu konfirmasi HR/penasihat hukum: PP 35/2021 mengatur upah lembur 1,5× untuk jam pertama dan 2× untuk jam berikutnya.]',
        'Pembulatan jam masuk setelah 13:05 menjadi 13:00 mengikuti file lama dan memang disengaja (keputusan pemilik).',
        'BPJS dan PPh 21 ditanggung perusahaan dan tidak dipotong dari gaji. Sistem tidak menghitung PPh 21; perhitungan dan pelaporan pajak perusahaan tetap dilakukan di luar sistem. [Perlu konfirmasi konsultan pajak]',
        'Pengaturan angka-angka ini ada di sheet Settings (payroll_...). Ubah hanya bila sudah disepakati.'
      ]
    },
    {
      id: 'payroll-periode', guide: 'payroll', perm: ['payroll.prepare'], title: 'Membuat periode dan menghitung gaji',
      intro: 'Gaji bulan X dihitung dari absensi tanggal 27 bulan sebelumnya sampai tanggal 26 bulan X.',
      steps: [
        'Pastikan absensi periode itu sudah lengkap: impor Raptor sudah dilakukan dan absen tanpa jam pulang sudah diperbaiki.',
        'Buka menu Penggajian, lalu tekan Buat Periode.',
        'Pilih Bulan gaji. Di bawahnya tampil tanggal periode. Isi Rencana tanggal bayar jika perlu, lalu tekan Buat Periode.',
        'Di halaman periode, tekan Hitung Gaji.',
        'Baca kotak kuning (jika ada): karyawan tanpa profil gaji, atau hari tanpa jam pulang.',
        'Periksa tabel Per karyawan: Hadir, Jam dibayar, Upah / gaji, Lembur, Tambahan, Potongan, Bersih.'
      ],
      result: 'Status periode menjadi Sudah dihitung dan Ringkasan menampilkan Total bersih.',
      notes: [
        'Jika absensi, profil gaji, atau tambahan/potongan berubah setelah dihitung, muncul peringatan. Tekan Hitung Ulang.',
        'Hitung Ulang aman dilakukan berkali-kali sebelum diajukan. Hasil lama disimpan sebagai versi sebelumnya.',
        'Salah memilih bulan? Buka periode itu, tekan Hapus Periode, isi alasan, lalu tekan Hapus Periode lagi. Hanya bisa sebelum diajukan ke Direktur. Hasil hitungan dan tambahan/potongan periode itu ikut terhapus; absensi, profil gaji, dan kasbon tidak berubah. Penghapusan tercatat di Audit Log.'
      ]
    },
    {
      id: 'payroll-rincian', guide: 'payroll', perm: ['payroll.prepare'], title: 'Memeriksa rincian dan menambah tambahan/potongan',
      intro: 'Bonus, insentif, kasbon, atau potongan lain dicatat manual per karyawan, dengan alasan.',
      steps: [
        'Di halaman periode, tekan Rincian pada baris karyawan.',
        'Periksa Komponen gaji, Tarif per jam, dan Rincian per hari (jam masuk asli dan yang dihitung, pulang, lama hadir, dibayar, lembur; durasi jam:menit:detik).',
        'Untuk menambah, tekan Tambah / Potong Manual.',
        'Pilih Jenis (Tambahan atau Potongan), isi Keterangan di slip, Jumlah (Rp), dan Alasan, lalu tekan Simpan.',
        'Tutup jendela Rincian, lalu tekan Hitung Ulang.'
      ],
      result: 'Kolom Tambahan atau Potongan karyawan itu berubah, dan Keterangan di slip tampil di slip gaji.',
      notes: [
        'Untuk menghapus tambahan/potongan yang salah, tekan Hapus di baris komponen bertanda manual, isi alasan, lalu Hitung Ulang.',
        'Tambahan/potongan tidak bisa diubah setelah periode diajukan, kecuali Direktur menolaknya.',
        'Ada kesalahan fingerprint (misalnya lupa absen pulang)? Tekan Koreksi di baris tanggal itu, ubah Jam masuk, Jam pulang, atau Istirahat (menit), isi Alasan, lalu Simpan. Untuk tanggal yang tidak ada absennya, tekan Catat Absen Hari Lain. Setelah itu tekan Hitung Ulang Sekarang. Baris yang dikoreksi bertanda Dikoreksi HR dan tidak tertimpa saat impor Raptor berikutnya. Koreksi hanya bisa sebelum periode diajukan ke Direktur.',
        'Tekan Unduh Rincian (PDF) untuk menyimpan rincian gaji dan absensi per hari karyawan itu, seperti lembar "Salary & Absence Breakdown" di file lama.',
        'Tekan Unduh Slip (DRAF) untuk melihat slip sebelum disetujui Direktur. Slip DRAF tidak bernomor dan bukan slip resmi, jadi jangan dikirim ke karyawan. Setelah disetujui, tombolnya menjadi Unduh Slip Gaji dan mengunduh slip resmi.',
        'Rincian dan slip berisi data gaji. Simpan di tempat yang aman dan jangan diteruskan lewat grup chat.'
      ]
    },
    {
      id: 'payroll-ajukan', guide: 'payroll', perm: ['payroll.prepare'], title: 'Mengajukan gaji ke Direktur',
      intro: 'Gaji harus disetujui Direktur sebelum dibayar. Yang menghitung tidak bisa menyetujui sendiri.',
      steps: [
        'Pastikan tidak ada peringatan "Ada perubahan ... Tekan Hitung Ulang".',
        'Tekan Ajukan ke Direktur.',
        'Periksa jumlah karyawan dan total bersih di jendela konfirmasi, lalu tekan Ajukan.'
      ],
      result: 'Status menjadi Menunggu persetujuan Direktur. Direktur mendapat notifikasi.',
      notes: ['Jika Direktur menolak, status kembali Draf dan alasan penolakan tampil di halaman periode. Perbaiki, Hitung Ulang, lalu ajukan lagi.']
    },
    {
      id: 'payroll-bayar', guide: 'payroll', perm: ['payroll.mark_paid'], title: 'Daftar transfer dan menandai sudah dibayar',
      intro: 'Setelah disetujui, angka terkunci dan slip gaji PDF dibuat. Karyawan baru bisa melihat slip setelah ditandai dibayar.',
      steps: [
        'Buka periode yang berstatus Disetujui.',
        'Tekan Unduh Daftar Transfer. File CSV berisi nama, bank, nomor rekening, dan jumlah bersih, dengan baris TOTAL di akhir.',
        'Buka file di Excel dan lakukan transfer lewat internet banking.',
        'Setelah semua transfer selesai, tekan Tandai Sudah Dibayar, isi Tanggal dibayar, lalu tekan Tandai Sudah Dibayar.'
      ],
      result: 'Status menjadi Sudah dibayar. Karyawan mendapat notifikasi dan slip muncul di Slip Gaji Saya.',
      notes: [
        'Baris "BELUM ADA REKENING" di file transfer berarti rekening karyawan itu belum dicatat. Lengkapi di Profil Gaji > Rekening.',
        'File transfer berisi nomor rekening lengkap. Simpan di komputer kantor, jangan dikirim lewat grup chat, dan hapus setelah selesai.'
      ]
    },
    {
      id: 'payroll-slip', guide: 'payroll', perm: ['payroll.prepare', 'payslip.read.all'], title: 'Mengunduh slip gaji karyawan',
      intro: 'Slip gaji setiap karyawan ada di bagian Slip gaji pada halaman periode yang sudah disetujui.',
      steps: [
        'Buka menu Penggajian, lalu tekan Buka pada periode.',
        'Di bagian Slip gaji, cari nama karyawan.',
        'Tekan Unduh PDF.'
      ],
      result: 'File PDF slip tersimpan. Kolom Dibuka karyawan menunjukkan apakah karyawan sudah membuka slipnya.',
      notes: ['Setiap unduhan slip tercatat di Audit Log.']
    },

    {
      id: 'payroll-kasbon', guide: 'payroll', perm: ['loan.manage'], title: 'Menyerahkan dan memantau kasbon',
      intro: 'Kasbon yang disetujui Direktur muncul di menu Kasbon. Cicilan baru dipotong setelah uangnya ditandai diserahkan.',
      steps: [
        'Setelah mendapat notifikasi "Kasbon ... disetujui", serahkan uangnya ke karyawan.',
        'Buka menu Kasbon, lalu tekan Tandai Sudah Diserahkan pada kasbon itu. Isi tanggal, lalu tekan Simpan.',
        'Saat menghitung gaji, cicilan masuk otomatis sebagai Cicilan kasbon di Rincian dan slip gaji.',
        'Jika karyawan membayar tunai, tekan Catat Pelunasan Tunai, isi jumlah dan keterangan, lalu Hitung Ulang periode gaji yang belum disetujui.'
      ],
      result: 'Kolom Sudah dipotong dan Sisa berubah setelah gaji periode itu disetujui Direktur. Kasbon berstatus Lunas setelah sisanya Rp0.',
      notes: [
        'Kasbon yang disetujui tetapi belum ditandai diserahkan tidak dipotong. Halaman periode gaji menampilkan peringatannya.',
        'Kasbon yang uangnya belum diserahkan bisa dibatalkan dengan tombol Batalkan.',
        'Tekan Riwayat untuk melihat penyerahan, potongan gaji, dan pembayaran tunai.'
      ]
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
      id: 'mgmt-persetujuan', guide: 'management', perm: ['request.approve.hr'], title: 'Menyetujui pengajuan Manajer Operasional',
      intro: 'Manajer Operasional tidak bisa menyetujui pengajuannya sendiri. Cuti, izin, lembur, dan koreksi absensinya diputuskan oleh Direktur.',
      steps: ['Buka menu Persetujuan (jumlah yang menunggu juga tampil di Beranda).', 'Baca rinciannya, lalu tekan Setujui atau Tolak (alasan wajib untuk menolak).'],
      result: 'Manajer Operasional mendapat notifikasi keputusan Anda.',
      notes: ['Pengajuan karyawan lain tidak tampil untuk Direktur; semuanya diputuskan Manajer Operasional.']
    },
    {
      id: 'mgmt-gaji', guide: 'management', perm: ['payroll.approve'], title: 'Menyetujui atau menolak gaji',
      intro: 'Gaji yang diajukan Payroll (Manajer Operasional) menunggu persetujuan Anda sebelum dibayar.',
      steps: [
        'Buka menu Penggajian. Periode yang menunggu berstatus Menunggu persetujuan Direktur. Beranda juga menampilkan jumlahnya.',
        'Tekan Buka pada periode itu.',
        'Periksa Ringkasan dan tabel Per karyawan. Tekan Rincian untuk melihat rincian per hari seorang karyawan.',
        'Tekan Setujui (catatan boleh dikosongkan), atau Tolak dan isi Alasan penolakan.'
      ],
      result: 'Jika disetujui: status menjadi Disetujui, angka terkunci, dan slip gaji PDF dibuat. Jika ditolak: periode kembali ke Payroll dengan catatan Anda.',
      notes: [
        'Jika Anda juga yang menghitung periode itu, tombol Setujui tidak muncul. Persetujuan harus oleh orang lain.',
        'Sistem menyimpan sidik jari angka yang Anda setujui di sheet PayrollApprovals.'
      ]
    },
    {
      id: 'mgmt-kasbon', guide: 'management', perm: ['loan.approve'], title: 'Menyetujui kasbon',
      intro: 'Semua pengajuan kasbon diputuskan Direktur di menu Persetujuan.',
      steps: [
        'Buka menu Persetujuan. Pengajuan berlabel Kasbon menampilkan jumlah, usulan cicilan, keperluan, gaji karyawan, dan riwayat kasbon sebelumnya.',
        'Tekan Setujui. Isi Jumlah disetujui, pilih Jumlah cicilan, dan Mulai dipotong dari gaji bulan. Di bawahnya tampil potongan per gajian.',
        'Tekan Setujui. Atau tekan Tolak dan tulis alasannya.'
      ],
      result: 'Karyawan dan Manajer Operasional mendapat notifikasi. Kasbon muncul di menu Kasbon dengan status "Disetujui, belum diserahkan".',
      notes: ['Gaji bulan X dihitung dari tanggal 27 bulan sebelumnya sampai 26 bulan X. Bulan yang gajinya sudah disetujui tidak bisa dipilih.']
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
    { q: 'Siapa yang bisa melihat kontrak dan upah saya?', a: 'Hanya Anda dan HR. Atasan dan admin teknis tidak bisa melihat kontrak atau upah Anda.', perm: ['contract.read.own'] },
    { q: 'Kapan slip gaji saya muncul?', a: 'Setelah gaji periode itu disetujui Direktur dan ditandai sudah dibayar. Anda mendapat notifikasi di lonceng.', perm: ['payslip.read.own'] },
    { q: 'Siapa yang bisa melihat gaji saya?', a: 'Anda sendiri, Payroll (Manajer Operasional), dan Direktur. Atasan dan admin teknis tidak bisa melihatnya.', perm: ['payslip.read.own'] },
    { q: 'Mengapa saya tidak bisa memilih Cuti tahunan?', a: 'Cuti tahunan hanya untuk karyawan bulanan yang ditetapkan HR. Pekerja harian tetap bisa mengajukan sakit, izin, dan cuti khusus.', perm: ['leave.request.own'] },
    { q: 'Apakah sisa cuti hangus di akhir tahun?', a: 'Tidak. Sisa cuti dibawa ke tahun berikutnya dan ditambah jatah baru setiap 1 Januari.', perm: ['leave.request.own'] },
    { q: 'Apakah lokasi saya dilacak terus?', a: 'Tidak. Lokasi hanya dibaca saat Anda menekan Absen Masuk atau Absen Pulang, dan disimpan sebagai bukti absen.', perm: ['attendance.clock.own'] },
    { q: 'Jam absen saya berbeda dengan jam di ponsel. Mengapa?', a: 'Sistem selalu memakai jam server (WITA) agar adil dan tidak bisa diubah dari ponsel.', perm: ['attendance.clock.own'] },
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
      problem: 'Buat PDF kontrak: "Data belum lengkap untuk mengisi template"', cause: 'Data yang dibutuhkan template kosong, misalnya alamat atau nomor KTP 16 digit.', check: 'Baca daftar data di pesan.', solution: 'Lengkapi lewat Ubah Data, Ubah Data Identitas, atau Ubah draf kontrak, lalu tekan Buat PDF lagi.', contact: 'HR'
    },
    {
      problem: 'Unggah dokumen: "Jenis file tidak didukung"', cause: 'File bukan PDF, JPG, atau PNG, atau hanya diganti namanya.', check: 'Buka file di komputer.', solution: 'Simpan ulang sebagai PDF atau foto JPG/PNG.', contact: 'HR'
    },
    {
      problem: 'Ikon lonceng tidak berubah setelah pengumuman terbit', cause: 'Angka diperbarui setiap 3 menit.', check: 'Tunggu beberapa menit atau muat ulang halaman.', solution: 'Buka menu Pengumuman untuk melihat langsung.', contact: 'Admin jika tetap tidak muncul'
    },
    {
      problem: 'Absen: "Izin lokasi ditolak"', cause: 'Browser tidak diizinkan memakai lokasi.', check: 'Lihat ikon gembok/lokasi di samping alamat portal.', solution: 'Buka pengaturan situs di browser, ubah Lokasi menjadi Izinkan, lalu muat ulang halaman.', contact: 'HR jika tetap gagal'
    },
    {
      problem: 'Absen: "Anda berada sekitar ... m dari ..."', cause: 'Posisi ponsel di luar radius lokasi kerja, atau GPS meleset.', check: 'Pastikan Anda di area Mookiland dan GPS menyala.', solution: 'Pindah ke tempat terbuka, tunggu beberapa detik, coba lagi. Jika selalu gagal di tempat yang benar, minta HR memeriksa titik dan radius lokasi.', contact: 'HR'
    },
    {
      problem: 'Impor Raptor: "Susunan laporan Raptor tidak dikenali"', cause: 'File bukan laporan Employee\'s Time / Attendance, atau sudah diubah.', check: 'Buka file di Excel: harus ada judul EmpNo, Name, lalu Date In, Time In, Date Out, Time Out.', solution: 'Ekspor ulang dari Raptor tanpa mengubah isinya.', contact: 'Admin'
    },
    {
      problem: 'Pengajuan cuti: "Sisa cuti Anda ... hari"', cause: 'Jumlah hari melebihi sisa cuti, termasuk pengajuan lain yang masih menunggu.', check: 'Lihat sisa cuti di Pengajuan Saya.', solution: 'Kurangi jumlah hari, atau batalkan pengajuan lain yang masih menunggu.', contact: 'Manajer Operasional'
    },
    {
      problem: 'Persetujuan: tombol Setujui tidak ada', cause: 'Pengajuan itu milik Anda sendiri.', check: 'Lihat nama di kartu pengajuan.', solution: 'Pengajuan Anda diputuskan Direktur atau pengelola HR lain.', contact: 'Direktur'
    },
    {
      problem: 'Penggajian: "Ada perubahan absensi, profil gaji, atau tambahan/potongan sejak gaji dihitung"', cause: 'Data berubah setelah tombol Hitung ditekan.', check: '-', solution: 'Tekan Hitung Ulang, periksa lagi, lalu Ajukan ke Direktur.', contact: 'Admin jika tetap muncul'
    },
    {
      problem: 'Penggajian: karyawan tidak ada di tabel', cause: 'Karyawan belum punya profil gaji, atau profilnya berlaku setelah akhir periode.', check: 'Baca kotak kuning di halaman periode. Buka Profil Gaji.', solution: 'Atur profil gaji dengan tanggal Berlaku mulai sebelum akhir periode, lalu Hitung Ulang.', contact: 'Manajer Operasional'
    },
    {
      problem: 'Profil gaji: "Sudah ada periode gaji yang disetujui sesudah tanggal ini"', cause: 'Tanggal Berlaku mulai jatuh di periode yang sudah dikunci.', check: 'Lihat tanggal akhir periode terakhir yang disetujui.', solution: 'Pilih tanggal setelah periode itu. Kekurangan bayar periode lama dicatat sebagai Tambahan di periode berikutnya.', contact: 'Manajer Operasional'
    },
    {
      problem: 'Slip gaji tidak muncul di Slip Gaji Saya', cause: 'Gaji periode itu belum ditandai dibayar, atau akun belum terhubung dengan data karyawan.', check: 'Tanyakan status gaji ke Manajer Operasional.', solution: 'Tunggu sampai gaji ditandai dibayar. Jika akun belum terhubung, minta admin menghubungkannya.', contact: 'Manajer Operasional'
    },
    {
      problem: 'Pesan "Terjadi kesalahan pada server" dengan kode', cause: 'Kesalahan tak terduga di sistem.', check: 'Catat Kode permintaan.', solution: 'Laporkan dengan screenshot dan kode tersebut.', contact: 'Admin'
    }
  ]
};
