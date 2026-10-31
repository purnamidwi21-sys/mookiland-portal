/*
 * Pembuat file Excel (.xlsx) sederhana di browser, tanpa pustaka luar.
 * Dipakai untuk template/ekspor jadwal kerja. Data tidak dikirim ke mana pun:
 * file dibuat di perangkat pengguna lalu langsung diunduh.
 *
 * MklXlsx.build([{ name, rows, widths, freeze: { col, row }, validation: { range, list } }]) -> Blob
 * Isi sel: string | number | null | { v, style } | { date: 'YYYY-MM-DD', style }
 * style: 'title' | 'header' | 'headerDate' | 'date' | 'wrap' | 'holiday' | 'muted'
 */
(function (global) {
  'use strict';

  var CRC_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function utf8(s) { return new global.TextEncoder().encode(s); }

  /** ZIP tanpa kompresi (metode "store"). files: [{ name, data: Uint8Array }] */
  function zip(files) {
    var parts = [], central = [], offset = 0;
    var now = new Date();
    var dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    var dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    files.forEach(function (f) {
      var name = utf8(f.name), data = f.data, crc = crc32(data);
      var head = new DataView(new ArrayBuffer(30));
      head.setUint32(0, 0x04034b50, true); head.setUint16(4, 20, true); head.setUint16(6, 0x0800, true); head.setUint16(8, 0, true);
      head.setUint16(10, dosTime, true); head.setUint16(12, dosDate, true); head.setUint32(14, crc, true);
      head.setUint32(18, data.length, true); head.setUint32(22, data.length, true); head.setUint16(26, name.length, true); head.setUint16(28, 0, true);
      parts.push(new Uint8Array(head.buffer), name, data);
      var cd = new DataView(new ArrayBuffer(46));
      cd.setUint32(0, 0x02014b50, true); cd.setUint16(4, 20, true); cd.setUint16(6, 20, true); cd.setUint16(8, 0x0800, true); cd.setUint16(10, 0, true);
      cd.setUint16(12, dosTime, true); cd.setUint16(14, dosDate, true); cd.setUint32(16, crc, true);
      cd.setUint32(20, data.length, true); cd.setUint32(24, data.length, true); cd.setUint16(28, name.length, true);
      cd.setUint16(30, 0, true); cd.setUint16(32, 0, true); cd.setUint16(34, 0, true); cd.setUint16(36, 0, true); cd.setUint32(38, 0, true);
      cd.setUint32(42, offset, true);
      central.push(new Uint8Array(cd.buffer), name);
      offset += 30 + name.length + data.length;
    });
    var cdSize = central.reduce(function (a, b) { return a + b.length; }, 0);
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    return parts.concat(central, [new Uint8Array(end.buffer)]);
  }

  function esc(s) {
    return String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function colName(i) { // 0 -> A
    var s = '';
    i += 1;
    while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); }
    return s;
  }

  function serial(ymd) {
    var p = ymd.split('-').map(Number);
    return (Date.UTC(p[0], p[1] - 1, p[2]) - Date.UTC(1899, 11, 30)) / 86400000;
  }

  var STYLE = { title: 1, header: 2, headerDate: 3, date: 4, wrap: 5, holiday: 6, muted: 7 };

  var STYLES_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<numFmts count="2"><numFmt numFmtId="164" formatCode="ddd d mmm"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/></numFmts>' +
    '<fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font>' +
    '<font><b/><sz val="11"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF666666"/><name val="Calibri"/></font></fonts>' +
    '<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFE8F0FB"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFFDE2E2"/><bgColor indexed="64"/></patternFill></fill></fills>' +
    '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' +
    '<border><left style="thin"><color rgb="FFCCCCCC"/></left><right style="thin"><color rgb="FFCCCCCC"/></right><top style="thin"><color rgb="FFCCCCCC"/></top><bottom style="thin"><color rgb="FFCCCCCC"/></bottom><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="8">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '<xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
    '<xf numFmtId="164" fontId="2" fillId="2" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>' +
    '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>' +
    '<xf numFmtId="164" fontId="2" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>' +
    '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';

  function build(sheets) {
    var strings = [], sIndex = {};
    var str = function (s) { s = String(s); if (sIndex[s] === undefined) { sIndex[s] = strings.length; strings.push(s); } return sIndex[s]; };
    var files = [];
    sheets.forEach(function (sh, si) {
      var xml = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'];
      if (sh.freeze) {
        var tl = colName(sh.freeze.col) + (sh.freeze.row + 1);
        xml.push('<sheetViews><sheetView workbookViewId="0"' + (si === 0 ? ' tabSelected="1"' : '') + '><pane' + (sh.freeze.col ? ' xSplit="' + sh.freeze.col + '"' : '') + (sh.freeze.row ? ' ySplit="' + sh.freeze.row + '"' : '') +
          ' topLeftCell="' + tl + '" activePane="bottomRight" state="frozen"/></sheetView></sheetViews>');
      }
      if (sh.widths && sh.widths.length) {
        xml.push('<cols>' + sh.widths.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols>');
      }
      xml.push('<sheetData>');
      sh.rows.forEach(function (row, ri) {
        if (!row || !row.length) return;
        var cells = [];
        row.forEach(function (c, ci) {
          if (c === null || c === undefined || c === '') return;
          var ref = colName(ci) + (ri + 1);
          var o = (typeof c === 'object') ? c : { v: c };
          var s = o.style ? ' s="' + STYLE[o.style] + '"' : '';
          if (o.date) cells.push('<c r="' + ref + '"' + (o.style ? s : ' s="' + STYLE.date + '"') + '><v>' + serial(o.date) + '</v></c>');
          else if (typeof o.v === 'number' && isFinite(o.v)) cells.push('<c r="' + ref + '"' + s + '><v>' + o.v + '</v></c>');
          else if (o.v !== null && o.v !== undefined && o.v !== '') cells.push('<c r="' + ref + '"' + s + ' t="s"><v>' + str(o.v) + '</v></c>');
        });
        xml.push('<row r="' + (ri + 1) + '">' + cells.join('') + '</row>');
      });
      xml.push('</sheetData>');
      if (sh.validation && sh.validation.list && sh.validation.list.length) {
        var list = sh.validation.list.join(',').slice(0, 250);
        xml.push('<dataValidations count="1"><dataValidation type="list" allowBlank="1" showErrorMessage="0" sqref="' + sh.validation.range + '"><formula1>"' + esc(list) + '"</formula1></dataValidation></dataValidations>');
      }
      xml.push('</worksheet>');
      files.push({ name: 'xl/worksheets/sheet' + (si + 1) + '.xml', data: utf8(xml.join('')) });
    });
    var head = [
      { name: '[Content_Types].xml', data: utf8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>' +
        sheets.map(function (s, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') + '</Types>') },
      { name: '_rels/.rels', data: utf8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>') },
      { name: 'xl/workbook.xml', data: utf8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
        sheets.map(function (s, i) { return '<sheet name="' + esc(String(s.name).replace(/[\\\/?*\[\]:]/g, ' ').slice(0, 31)) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets></workbook>') },
      { name: 'xl/_rels/workbook.xml.rels', data: utf8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        sheets.map(function (s, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') +
        '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        '<Relationship Id="rId' + (sheets.length + 2) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>') },
      { name: 'xl/styles.xml', data: utf8(STYLES_XML) }
    ];
    var ss = utf8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="' + strings.length + '" uniqueCount="' + strings.length + '">' +
      strings.map(function (s) { return '<si><t xml:space="preserve">' + esc(s) + '</t></si>'; }).join('') + '</sst>');
    var parts = zip(head.concat(files, [{ name: 'xl/sharedStrings.xml', data: ss }]));
    return new global.Blob(parts, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  function download(fileName, blob) {
    var url = global.URL.createObjectURL(blob);
    var a = global.document.createElement('a');
    a.href = url; a.download = fileName;
    global.document.body.appendChild(a);
    a.click();
    global.setTimeout(function () { global.URL.revokeObjectURL(url); if (a.parentNode) a.parentNode.removeChild(a); }, 1000);
  }

  global.MklXlsx = Object.freeze({ build: build, download: download, colName: colName, _crc32: crc32 });
})(window);
