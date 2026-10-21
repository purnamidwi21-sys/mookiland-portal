# Mookiland Staff Portal (frontend)

Tampilan web Mookiland Staff Management System, diterbitkan lewat GitHub Pages.

**Repo ini publik.** Jangan pernah menyimpan password, token, API key, data karyawan,
atau file dari Google Drive di sini. Semua data dan pemeriksaan hak akses ada di
backend (repo privat `mookiland-sms-backend`).

## Isi

| File | Fungsi |
| --- | --- |
| `index.html` | Kerangka halaman dan Content Security Policy |
| `config.js` | Alamat Web App Apps Script (bukan rahasia) |
| `assets/css/main.css` | Tampilan |
| `assets/js/core/api.js` | Penghubung ke server |
| `assets/js/app.js` | Logika halaman (Tahap 2: uji koneksi) |
| `.nojekyll` | Mematikan pemrosesan Jekyll di GitHub Pages |

## Versi

0.2.0 — Tahap 2: halaman uji koneksi ke server.
