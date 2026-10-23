/*
 * Mookiland Staff Portal - komponen tampilan.
 *
 * Semua teks dimasukkan dengan textContent (bukan innerHTML), sehingga data
 * dari server tidak pernah dijalankan sebagai kode.
 */
(function (global) {
  'use strict';

  var doc = global.document;
  var idCounter = 0;

  function uid(prefix) {
    idCounter += 1;
    return (prefix || 'mkl') + '-' + idCounter;
  }

  function append(el, child) {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) {
      child.forEach(function (c) { append(el, c); });
      return;
    }
    if (child instanceof global.Node) el.appendChild(child);
    else el.appendChild(doc.createTextNode(String(child)));
  }

  /** Membuat elemen: h('button', {class: 'btn', onClick: fn}, 'Simpan'). */
  function h(tag, attrs) {
    var el = doc.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'text') el.textContent = String(v);
        else if (k === 'class') el.className = v;
        else if (k.indexOf('on') === 0 && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'value') el.value = v;
        else if (k === 'checked') el.checked = !!v;
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, String(v));
      });
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
    return el;
  }

  // ------------------------------------------------------------------ format

  var dtFormat = null;
  function fmtDateTime(iso) {
    if (!iso) return '-';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    try {
      if (!dtFormat) {
        dtFormat = new Intl.DateTimeFormat('id-ID', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar'
        });
      }
      return dtFormat.format(d) + ' WITA';
    } catch (e) {
      return String(iso);
    }
  }

  // ------------------------------------------------------------------ badge, state

  function badge(text, variant) {
    return h('span', { class: 'badge badge-' + (variant || 'neutral') }, text);
  }

  function loadingState(text) {
    return h('div', { class: 'state', role: 'status' },
      h('span', { class: 'spinner', 'aria-hidden': 'true' }),
      h('span', null, text || 'Memuat...'));
  }

  function emptyState(text) {
    return h('div', { class: 'state state-empty' }, text || 'Belum ada data.');
  }

  function errorState(res, onRetry) {
    return h('div', { class: 'state state-error', role: 'alert' },
      h('strong', null, 'Gagal memuat data'),
      h('p', null, (res && res.message) || 'Terjadi kesalahan.'),
      (res && res.requestId) ? h('p', { class: 'muted small' }, 'Kode permintaan: ' + res.requestId) : null,
      onRetry ? h('button', { class: 'btn btn-secondary', type: 'button', onClick: onRetry }, 'Coba lagi') : null);
  }

  function alertBox(type, message) {
    return h('div', { class: 'alert alert-' + type, role: type === 'error' ? 'alert' : 'status' }, message);
  }

  // ------------------------------------------------------------------ toast

  function toast(message, type) {
    var root = doc.getElementById('toast-root');
    if (!root) return;
    var el = h('div', { class: 'toast toast-' + (type || 'info'), role: type === 'error' ? 'alert' : 'status' }, message);
    root.appendChild(el);
    global.setTimeout(function () {
      el.classList.add('toast-hide');
      global.setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    }, type === 'error' ? 6000 : 4000);
  }

  // ------------------------------------------------------------------ busy button

  function setBusy(btn, busy, busyLabel) {
    if (busy) {
      if (!btn.getAttribute('data-label')) btn.setAttribute('data-label', btn.textContent);
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      btn.textContent = busyLabel || 'Memproses...';
    } else {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      if (btn.getAttribute('data-label')) btn.textContent = btn.getAttribute('data-label');
    }
  }

  // ------------------------------------------------------------------ form

  /**
   * Membuat field berlabel. opts: {label, name, type, value, required, autocomplete,
   * hint, maxLength, placeholder, inputmode, multiline, rows}
   */
  function field(opts) {
    var id = uid('f');
    var hintId = id + '-hint';
    var errId = id + '-err';
    var attrs = {
      id: id,
      name: opts.name,
      class: 'input',
      autocomplete: opts.autocomplete || 'off',
      maxlength: opts.maxLength || null,
      placeholder: opts.placeholder || null,
      inputmode: opts.inputmode || null,
      required: opts.required || null,
      'aria-describedby': (opts.hint ? hintId + ' ' : '') + errId,
      autocapitalize: opts.autocapitalize || null,
      spellcheck: opts.spellcheck === false ? 'false' : null
    };
    var input;
    if (opts.multiline) {
      attrs.rows = opts.rows || 3;
      input = h('textarea', attrs);
      if (opts.value) input.value = opts.value;
    } else {
      attrs.type = opts.type || 'text';
      attrs.value = opts.value || null;
      input = h('input', attrs);
    }
    var wrap = h('div', { class: 'field' },
      h('label', { for: id }, opts.label, opts.required ? h('span', { class: 'req', 'aria-hidden': 'true' }, ' *') : null),
      input,
      opts.hint ? h('p', { class: 'hint', id: hintId }, opts.hint) : null,
      h('p', { class: 'field-error', id: errId, 'data-error-for': opts.name }));
    return { wrap: wrap, input: input };
  }

  /** Menambahkan tombol Tampilkan/Sembunyikan pada field password. */
  function passwordField(opts) {
    var f = field({
      label: opts.label, name: opts.name, type: 'password', required: opts.required,
      autocomplete: opts.autocomplete, hint: opts.hint, maxLength: 128
    });
    var toggle = h('button', {
      class: 'btn btn-ghost btn-small input-toggle', type: 'button', 'aria-pressed': 'false',
      'aria-label': 'Tampilkan password ' + opts.label.toLowerCase()
    }, 'Tampilkan');
    toggle.addEventListener('click', function () {
      var show = f.input.type === 'password';
      f.input.type = show ? 'text' : 'password';
      toggle.textContent = show ? 'Sembunyikan' : 'Tampilkan';
      toggle.setAttribute('aria-pressed', show ? 'true' : 'false');
      f.input.focus();
    });
    var row = h('div', { class: 'input-with-action' });
    f.input.parentNode.insertBefore(row, f.input);
    row.appendChild(f.input);
    row.appendChild(toggle);
    return f;
  }

  function selectField(opts) {
    var id = uid('s');
    var select = h('select', { id: id, name: opts.name, class: 'input' });
    opts.options.forEach(function (o) {
      select.appendChild(h('option', { value: o.value, selected: o.value === opts.value ? true : null }, o.label));
    });
    var wrap = h('div', { class: 'field' + (opts.inline ? ' field-inline' : '') },
      h('label', { for: id }, opts.label), select);
    return { wrap: wrap, input: select };
  }

  function clearFieldErrors(form) {
    Array.prototype.forEach.call(form.querySelectorAll('[data-error-for]'), function (p) { p.textContent = ''; });
    Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid]'), function (el) { el.removeAttribute('aria-invalid'); });
  }

  /** Menampilkan pesan error per field dari res.details.fields. Mengembalikan true jika ada. */
  function showFieldErrors(form, res) {
    var fields = res && res.details && res.details.fields;
    if (!fields) return false;
    var first = null;
    Object.keys(fields).forEach(function (name) {
      var p = form.querySelector('[data-error-for="' + name + '"]');
      var input = form.querySelector('[name="' + name + '"]');
      if (p) p.textContent = fields[name];
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        if (!first) first = input;
      }
    });
    if (first) first.focus();
    return true;
  }

  // ------------------------------------------------------------------ modal

  /**
   * opts: {title, content (Node), actions: [{label, variant, onClick(ctl), id}], dismissible (default true)}
   * Mengembalikan { close(), dialog, buttons }.
   */
  function modal(opts) {
    var root = doc.getElementById('modal-root');
    var previous = doc.activeElement;
    var titleId = uid('m');
    var dismissible = opts.dismissible !== false;
    var buttons = {};

    var dialog = h('div', { class: 'modal' + (opts.wide ? ' modal-wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId });
    var overlay = h('div', { class: 'modal-overlay' }, dialog);

    function close() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      doc.removeEventListener('keydown', onKey);
      doc.body.classList.remove('modal-open');
      if (previous && previous.focus) previous.focus();
    }

    function onKey(e) {
      if (e.key === 'Escape' && dismissible) { e.preventDefault(); close(); return; }
      if (e.key === 'Tab') {
        var focusable = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        var firstEl = focusable[0];
        var lastEl = focusable[focusable.length - 1];
        if (e.shiftKey && doc.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && doc.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
      }
    }

    var ctl = { close: close, dialog: dialog, buttons: buttons };
    var header = h('div', { class: 'modal-header' },
      h('h2', { id: titleId }, opts.title),
      dismissible ? h('button', { class: 'btn btn-ghost btn-small', type: 'button', 'aria-label': 'Tutup', onClick: close }, 'Tutup') : null);
    var body = h('div', { class: 'modal-body' }, opts.content);
    var footer = h('div', { class: 'modal-footer' });
    (opts.actions || []).forEach(function (a) {
      var b = h('button', { class: 'btn btn-' + (a.variant || 'secondary'), type: 'button' }, a.label);
      b.addEventListener('click', function () { a.onClick(ctl, b); });
      if (a.id) buttons[a.id] = b;
      footer.appendChild(b);
    });
    append(dialog, [header, body, opts.actions && opts.actions.length ? footer : null]);

    if (dismissible) {
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    }
    doc.addEventListener('keydown', onKey);
    doc.body.classList.add('modal-open');
    root.appendChild(overlay);
    var focusTarget = dialog.querySelector('input, select, textarea') || footer.querySelector('button') || dialog.querySelector('button');
    if (focusTarget) focusTarget.focus();
    return ctl;
  }

  /**
   * Dialog konfirmasi dengan kolom alasan opsional.
   * opts: {title, message, confirmLabel, danger, reasonLabel, reasonRequired, onConfirm(reason) -> Promise<res>}
   * onConfirm dipanggil saat tombol ditekan; jika res.success false, pesan ditampilkan di dialog.
   */
  function confirmAction(opts) {
    var form = h('form', { novalidate: true, class: 'stack' });
    var msg = h('div', null, opts.message);
    var alertSlot = h('div');
    var reason = null;
    if (opts.reasonLabel) {
      reason = field({ label: opts.reasonLabel, name: 'reason', required: !!opts.reasonRequired, multiline: true, rows: 3, maxLength: 300, hint: opts.reasonHint || 'Alasan dicatat di audit log.' });
    }
    append(form, [msg, reason ? reason.wrap : null, alertSlot]);
    var ctl = modal({
      title: opts.title,
      content: form,
      actions: [
        { label: 'Batal', variant: 'secondary', onClick: function (c) { c.close(); } },
        { label: opts.confirmLabel || 'Lanjutkan', variant: opts.danger ? 'danger' : 'primary', id: 'ok', onClick: submit }
      ]
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(ctl, ctl.buttons.ok); });

    function submit(c, btn) {
      clearFieldErrors(form);
      clear(alertSlot);
      var r = reason ? reason.input.value.trim() : '';
      if (reason && opts.reasonRequired && r.length < 3) {
        showFieldErrors(form, { details: { fields: { reason: 'Alasan wajib diisi (minimal 3 karakter).' } } });
        return;
      }
      setBusy(btn, true);
      Promise.resolve(opts.onConfirm(r)).then(function (res) {
        setBusy(btn, false);
        if (!res || res.success) { c.close(); return; }
        if (!showFieldErrors(form, res)) alertSlot.appendChild(alertBox('error', res.message));
      });
    }
    return ctl;
  }

  // ------------------------------------------------------------------ table & pagination

  /** columns: [{label, render(row) -> Node|string, className}] */
  function table(columns, rows, emptyText) {
    if (!rows.length) return emptyState(emptyText);
    var thead = h('thead', null, h('tr', null, columns.map(function (c) {
      return h('th', { scope: 'col', class: c.className || null }, c.label);
    })));
    var tbody = h('tbody', null, rows.map(function (row) {
      return h('tr', null, columns.map(function (c) {
        var v = c.render(row);
        return h('td', { 'data-label': c.label, class: c.className || null }, (v === '' || v === null || v === undefined) ? '-' : v);
      }));
    }));
    return h('div', { class: 'table-wrap' }, h('table', { class: 'table' }, thead, tbody));
  }

  function pagination(info, onChange) {
    if (!info || info.totalPages <= 1) {
      return h('p', { class: 'muted small' }, (info ? info.total : 0) + ' data');
    }
    var prev = h('button', { class: 'btn btn-secondary btn-small', type: 'button', disabled: info.page <= 1 ? true : null }, 'Sebelumnya');
    var next = h('button', { class: 'btn btn-secondary btn-small', type: 'button', disabled: info.page >= info.totalPages ? true : null }, 'Berikutnya');
    prev.addEventListener('click', function () { onChange(info.page - 1); });
    next.addEventListener('click', function () { onChange(info.page + 1); });
    return h('nav', { class: 'pagination', 'aria-label': 'Halaman data' },
      prev, h('span', null, 'Halaman ' + info.page + ' dari ' + info.totalPages + ' (' + info.total + ' data)'), next);
  }

  function copyButton(text) {
    var btn = h('button', { class: 'btn btn-secondary btn-small', type: 'button' }, 'Salin');
    btn.addEventListener('click', function () {
      function done() { btn.textContent = 'Tersalin'; global.setTimeout(function () { btn.textContent = 'Salin'; }, 2000); }
      if (global.navigator.clipboard && global.navigator.clipboard.writeText) {
        global.navigator.clipboard.writeText(text).then(done, function () { toast('Salin manual: pilih teks lalu tekan Ctrl+C.', 'info'); });
      } else {
        toast('Salin manual: pilih teks lalu tekan Ctrl+C.', 'info');
      }
    });
    return btn;
  }

  function pageHeader(title, subtitle, actions) {
    return h('div', { class: 'page-header' },
      h('div', null, h('h1', { tabindex: '-1', class: 'page-title' }, title), subtitle ? h('p', { class: 'muted' }, subtitle) : null),
      actions ? h('div', { class: 'page-actions' }, actions) : null);
  }

  function card(title, content, extraClass) {
    return h('section', { class: 'card' + (extraClass ? ' ' + extraClass : '') },
      title ? h('h2', { class: 'card-title' }, title) : null, content);
  }

  /** Daftar label-nilai. rows: [[label, value(Node|string)]] */
  function infoList(rows) {
    return h('dl', { class: 'kv' }, rows.map(function (r) {
      return [h('dt', null, r[0]), h('dd', null, (r[1] === '' || r[1] === null || r[1] === undefined) ? '-' : r[1])];
    }));
  }

  global.MklUI = Object.freeze({
    h: h, clear: clear, uid: uid,
    fmtDateTime: fmtDateTime,
    badge: badge, loadingState: loadingState, emptyState: emptyState, errorState: errorState, alertBox: alertBox,
    toast: toast, setBusy: setBusy,
    field: field, passwordField: passwordField, selectField: selectField,
    clearFieldErrors: clearFieldErrors, showFieldErrors: showFieldErrors,
    modal: modal, confirmAction: confirmAction,
    table: table, pagination: pagination, copyButton: copyButton,
    pageHeader: pageHeader, card: card, infoList: infoList
  });
})(window);
