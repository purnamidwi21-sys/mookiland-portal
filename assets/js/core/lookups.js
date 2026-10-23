/*
 * Mookiland Staff Portal - pilihan baku (status karyawan, jenis hubungan kerja,
 * jenis kelamin) dan daftar jabatan dari server. Disimpan sementara di memori
 * tab ini; tidak berisi data pribadi.
 */
(function (global) {
  'use strict';

  var cache = null;
  var pending = null;

  var MklLookups = {
    /** Promise berisi { lookups, positions } atau { error: res }. */
    load: function (force) {
      if (cache && !force) return Promise.resolve(cache);
      if (pending) return pending;
      pending = MklApi.call('master.lookups', {}).then(function (res) {
        pending = null;
        if (!res.success) return { error: res, lookups: {}, positions: [] };
        cache = res.data;
        return cache;
      });
      return pending;
    },

    invalidate: function () { cache = null; },

    /** Pilihan untuk selectField. blankLabel: teks pilihan kosong (opsional). */
    options: function (data, listName, blankLabel) {
      var out = blankLabel !== undefined ? [{ value: '', label: blankLabel }] : [];
      ((data.lookups || {})[listName] || []).forEach(function (o) { out.push({ value: o.code, label: o.label }); });
      return out;
    },

    positionOptions: function (data, blankLabel, includeId) {
      var out = blankLabel !== undefined ? [{ value: '', label: blankLabel }] : [];
      (data.positions || []).forEach(function (p) {
        if (p.active || p.positionId === includeId) out.push({ value: p.positionId, label: p.name + (p.active ? '' : ' (tidak aktif)') });
      });
      return out;
    },

    isActiveStatus: function (data, code) {
      var list = (data.lookups || {}).employee_status || [];
      for (var i = 0; i < list.length; i++) if (list[i].code === code) return !!(list[i].meta && list[i].meta.active);
      return false;
    },

    /** Lencana status karyawan. */
    statusBadge: function (view) {
      var variant = 'success';
      if (!view.isActive) variant = 'muted';
      else if (view.employeeStatus === 'probation') variant = 'info';
      else if (view.employeeStatus === 'long_leave') variant = 'warning';
      return MklUI.badge(view.statusLabel || view.employeeStatus || '-', variant);
    }
  };

  global.MklLookups = MklLookups;
})(window);
