# Mookiland Staff Portal (frontend)

Tampilan web Mookiland Staff Management System, diterbitkan lewat GitHub Pages.

**Repo ini publik.** Jangan pernah menyimpan password, token, API key, data karyawan,
atau file dari Google Drive di sini. Semua data dan pemeriksaan hak akses ada di
backend (repo privat `mookiland-sms-backend`). Menyembunyikan menu di sini hanya
untuk kenyamanan; server memeriksa ulang setiap permintaan.

## Isi

| File | Fungsi |
| --- | --- |
| `index.html` | Kerangka aplikasi dan Content Security Policy |
| `config.js` | Alamat Web App Apps Script (bukan rahasia) |
| `assets/css/main.css` | Tampilan (desktop, ponsel, mode gelap) |
| `assets/js/core/api.js` | Penghubung ke server |
| `assets/js/core/ui.js` | Komponen: form, tabel, dialog, notifikasi |
| `assets/js/core/state.js` | Pengguna yang sedang masuk, keluar otomatis |
| `assets/js/core/nav.js` | Navigasi halaman |
| `assets/js/core/lookups.js` | Pilihan baku (status, jenis hubungan kerja) dan daftar jabatan |
| `assets/js/help-content.js` | Isi Pusat Bantuan |
| `assets/js/pages/*.js` | Halaman: Masuk, Lupa Password, Ganti Password, Beranda, Pengumuman, Notifikasi, Profil Saya, Kepegawaian Saya, Kontrak Saya, BPJS Saya, Dokumen Saya, Absen, Jadwal Saya, Absensi Saya, Susun Jadwal, Rekap Absensi, Impor Absensi Raptor, Shift & Lokasi, Pengajuan Saya, Persetujuan, Saldo Cuti, Profil Gaji, Penggajian, Slip Gaji Saya, Karyawan (termasuk kontrak, BPJS, dokumen), Impor Karyawan, Jabatan, Kontrak, BPJS, Template Kontrak, Kelola Pengumuman, Pengguna, Role & Permission, Log Aktivitas, Pusat Bantuan |
| `assets/js/app.js` | Tata letak, menu, alur masuk/keluar |

## Versi

- 0.8.4 — Kolom angka aman dari gulir mouse/trackpad; tampilan Rupiah saat mengetik tarif/gaji/jumlah.
- 0.8.3 — Penggajian: tabel karyawan tanpa profil gaji, peringatan sebagai daftar.
- 0.8.2 — Hapus data karyawan ganda/contoh (HR), pesan Hubungkan ke Karyawan lebih jelas.
- 0.8.1 — Lengkapi Data Diri di Profil Saya (lahir, jenis kelamin, nomor KTP, foto KTP) dengan pemeriksaan HR di Persetujuan.
- 0.8.0 — Tahap 4a: profil gaji (harian/bulanan, tarif berlaku mulai, aturan jam), rekening bank, periode gaji 27–26, hitung gaji dari absensi (rumus file gaji lama), tambahan/potongan manual, pengajuan ke Direktur, persetujuan, slip gaji PDF, daftar transfer, Slip Gaji Saya.
- 0.7.0 — Tahap 3c-2: cuti tahunan (saldo, jatah otomatis, proporsional, sisa dibawa), sakit dengan surat dokter, izin, cuti khusus, lembur (rencana & laporan), koreksi absensi, antrean Persetujuan, Saldo Cuti.
- 0.6.0 — Tahap 3c-1: shift, lokasi kerja, jadwal mingguan (draf/terbit), absen GPS dari ponsel, Jadwal Saya, Absensi Saya, rekap absensi, catat manual HR, impor absensi Raptor.
- 0.5.0 — Tahap 3b-2: kontrak kerja (template Word -> PDF, tanda tangan, perpanjangan, pengingat), BPJS, dokumen karyawan, pengumuman, notifikasi lonceng, halaman Saya.
- 0.4.0 — Tahap 3b-1: data karyawan, impor Excel/CSV, jabatan, akun karyawan (satu per satu dan massal, kartu akun), Profil Saya, Kepegawaian Saya.
- 0.3.0 — Tahap 3a: login, ganti password, pengelolaan pengguna, log, Pusat Bantuan.
- 0.2.0 — Tahap 2: halaman uji koneksi.
