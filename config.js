/*
 * Konfigurasi frontend Mookiland Staff Portal.
 *
 * FILE INI PUBLIK. JANGAN PERNAH mengisi password, token, atau API key di sini.
 * API_URL adalah alamat Web App Google Apps Script (berakhiran /exec).
 * Alamat ini bukan rahasia; keamanan dijaga oleh login dan pemeriksaan
 * hak akses di server.
 */
window.MKL_CONFIG = Object.freeze({
  API_URL: 'https://script.google.com/macros/s/AKfycby-noiG5Swmrxo6uSdu-MQelKal_8VSdTqXQW25kI8n032GcaqE0Rzv3wc6rJczqbZB/exec',
  APP_VERSION: '0.2.0',
  ENV: 'staging'
});
