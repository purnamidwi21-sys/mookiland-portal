/*
 * Konfigurasi frontend Mookiland Staff Portal.
 *
 * FILE INI PUBLIK. JANGAN PERNAH mengisi password, token, atau API key di sini.
 * API_URL adalah alamat Web App Google Apps Script (berakhiran /exec).
 * Alamat ini bukan rahasia; keamanan dijaga oleh login dan pemeriksaan
 * hak akses di server.
 */
window.MKL_CONFIG = Object.freeze({
  API_URL: 'TEMPEL_URL_WEB_APP_DI_SINI',
  APP_VERSION: '0.2.0',
  ENV: 'staging'
});
