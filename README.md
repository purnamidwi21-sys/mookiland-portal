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
| `assets/js/pages/*.js` | Halaman: Masuk, Lupa Password, Ganti Password, Beranda, Profil Saya, Kepegawaian Saya, Karyawan, Impor Karyawan, Jabatan, Pengguna, Role & Permission, Log Aktivitas, Pusat Bantuan |
| `assets/js/app.js` | Tata letak, menu, alur masuk/keluar |

## Versi

- 0.4.0 — Tahap 3b-1: data karyawan, impor Excel/CSV, jabatan, akun karyawan (satu per satu dan massal, kartu akun), Profil Saya, Kepegawaian Saya.
- 0.3.0 — Tahap 3a: login, ganti password, pengelolaan pengguna, log, Pusat Bantuan.
- 0.2.0 — Tahap 2: halaman uji koneksi.
