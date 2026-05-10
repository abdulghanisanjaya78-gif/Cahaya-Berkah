/* ─── AUTH ─── */
const USERS = {
  admin:   { pass: '12345',  role: 'admin' },
  kasir:   { pass: 'kasir1', role: 'kasir' },
  viewer:  { pass: 'lihat1', role: 'viewer' }
};

const ROLE_PAGES = {
  admin:  ['index.html','input.html','harga.html','grafik.html','rekap.html'],
  kasir:  ['index.html','input.html','grafik.html','rekap.html'],
  viewer: ['index.html']
};

const ROLE_LABELS = { admin: 'Admin', kasir: 'Kasir', viewer: 'Viewer' };

function getRole()   { return localStorage.getItem('role'); }
function getUser()   { return localStorage.getItem('username'); }
function isLoggedIn(){ return localStorage.getItem('login') === 'true'; }

function cekLogin() {
  if (!isLoggedIn()) { location.href = 'login.html'; return false; }
  return true;
}

function cekRole() {
  const role = getRole() || 'public';
  const page = location.pathname.split('/').pop() || 'index.html';

  /* index.html is public - no login required */
  if (page === 'index.html') {
    buildHomeNav();
    return;
  }

  /* All other pages require login */
  if (!cekLogin()) return;

  /* Redirect if role has no access */
  if (!ROLE_PAGES[role] || !ROLE_PAGES[role].includes(page)) {
    location.href = 'index.html';
    return;
  }

  /* Build nav links per role */
  const menu = document.getElementById('menuNav');
  if (!menu) return;
  menu.innerHTML = '';

  const links = [
    { href: 'index.html',  icon: '🏠', label: 'Home',   roles: ['admin','kasir','viewer'] },
    { href: 'input.html',  icon: '✏️',  label: 'Input',  roles: ['admin','kasir'] },
    { href: 'grafik.html', icon: '📊',  label: 'Grafik', roles: ['admin','kasir'] },
    { href: 'rekap.html',  icon: '📋',  label: 'Rekap',  roles: ['admin','kasir'] },
    { href: 'harga.html',  icon: '💰',  label: 'Harga',  roles: ['admin'] },
  ];

  links.forEach(l => {
    if (!l.roles.includes(role)) return;
    const a = document.createElement('a');
    a.href = l.href;
    a.innerHTML = `<span class="nav-icon">${l.icon}</span><span class="nav-label">${l.label}</span>`;
    if (page === l.href) a.classList.add('active');
    menu.appendChild(a);
  });

  /* Logout */
  const lo = document.createElement('a');
  lo.href = '#';
  lo.className = 'nav-logout';
  lo.innerHTML = `<span class="nav-icon">🚪</span><span class="nav-label">Keluar</span>`;
  lo.onclick = (e) => { e.preventDefault(); logout(); };
  menu.appendChild(lo);

  /* User badge */
  const badge = document.getElementById('userBadge');
  if (badge) {
    badge.textContent = `${ROLE_LABELS[role] || role}: ${getUser()}`;
  }
}

function logout() {
  localStorage.removeItem('login');
  localStorage.removeItem('role');
  localStorage.removeItem('username');
  location.href = 'index.html';
}

/* Build nav for public home page */
function buildHomeNav() {
  const menu = document.getElementById('menuNav');
  if (!menu) return;
  menu.innerHTML = '';

  const page = location.pathname.split('/').pop() || 'index.html';

  if (isLoggedIn()) {
    const role = getRole();
    const links = [
      { href: 'index.html',  icon: '🏠', label: 'Home',   roles: ['admin','kasir','viewer'] },
      { href: 'input.html',  icon: '✏️',  label: 'Input',  roles: ['admin','kasir'] },
      { href: 'grafik.html', icon: '📊',  label: 'Grafik', roles: ['admin','kasir'] },
      { href: 'rekap.html',  icon: '📋',  label: 'Rekap',  roles: ['admin','kasir'] },
      { href: 'harga.html',  icon: '💰',  label: 'Harga',  roles: ['admin'] },
    ];
    links.forEach(l => {
      if (!l.roles.includes(role)) return;
      const a = document.createElement('a');
      a.href = l.href;
      a.innerHTML = `<span class="nav-icon">${l.icon}</span><span class="nav-label">${l.label}</span>`;
      if (page === l.href) a.classList.add('active');
      menu.appendChild(a);
    });
    const lo = document.createElement('a');
    lo.href = '#';
    lo.className = 'nav-logout';
    lo.innerHTML = `<span class="nav-icon">🚪</span><span class="nav-label">Keluar</span>`;
    lo.onclick = (e) => { e.preventDefault(); logout(); };
    menu.appendChild(lo);
  } else {
    const a = document.createElement('a');
    a.href = 'login.html';
    a.className = 'nav-login-btn';
    a.innerHTML = `<span class="nav-icon">🔐</span><span class="nav-label">Login</span>`;
    menu.appendChild(a);
  }
}

/* ─── DATA STORAGE ─── */
function getData()     { return JSON.parse(localStorage.getItem('transaksiData')) || []; }
function saveData(d)   { localStorage.setItem('transaksiData', JSON.stringify(d)); }
function getHarga()    { return JSON.parse(localStorage.getItem('hargaList')) || defaultHarga(); }
function saveHarga(h)  { localStorage.setItem('hargaList', JSON.stringify(h)); }

function defaultHarga() {
  return {
    'Besi': 4500,
    'Box / Kardus': 2000,
    'Majalah': 1000,
    'Besi Campur': 2500,
    'Tembaga Rambut': 80000,
    'Tembaga Lidi': 110000,
    'Aki': 7000,
    'SWL': 1000
  };
}

/* ─── INPUT PAGE ─── */
let hargaList = {};
let keranjang = [];

function loadHarga() {
  hargaList = getHarga();
  const sel = document.getElementById('jenis');
  if (!sel) return;
  sel.innerHTML = '';
  Object.keys(hargaList).forEach(j => {
    const opt = document.createElement('option');
    opt.text = j;
    sel.add(opt);
  });
  setHarga();
}

function setHarga() {
  const j = document.getElementById('jenis').value;
  const h = document.getElementById('hargaSatuan');
  if (h) h.value = formatRp(hargaList[j] || 0);
  const hraw = document.getElementById('hargaRaw');
  if (hraw) hraw.value = hargaList[j] || 0;
  hitungTotal();
}

function hitungTotal() {
  const kg = parseFloat(document.getElementById('kg')?.value) || 0;
  const harga = parseInt(document.getElementById('hargaRaw')?.value) || 0;
  const totalEl = document.getElementById('totalPreview');
  if (totalEl) totalEl.textContent = 'Rp ' + formatRp(kg * harga);
}

function tambahKeranjang() {
  const jenis = document.getElementById('jenis').value;
  const kg = parseFloat(document.getElementById('kg').value);
  const harga = parseInt(document.getElementById('hargaRaw').value);

  if (!kg || kg <= 0) { showToast('Masukkan berat (kg)', 'error'); return; }

  const total = kg * harga;
  keranjang.push({ jenis, kg, harga, total, waktu: new Date().toISOString() });
  renderKeranjang();

  document.getElementById('kg').value = '';
  document.getElementById('totalPreview').textContent = 'Rp 0';
  showToast(`${jenis} ditambahkan ✓`, 'success');
}

function hapusKeranjang(i) {
  keranjang.splice(i, 1);
  renderKeranjang();
}

function renderKeranjang() {
  const tbody = document.getElementById('keranjangBody');
  if (!tbody) return;

  if (keranjang.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:20px">Belum ada item</td></tr>`;
    document.getElementById('totalKeranjang').textContent = 'Rp 0';
    return;
  }

  let grandTotal = 0;
  tbody.innerHTML = keranjang.map((d, i) => {
    grandTotal += d.total;
    return `<tr>
      <td>${d.jenis}</td>
      <td>${d.kg} kg</td>
      <td>Rp ${formatRp(d.harga)}</td>
      <td>Rp ${formatRp(d.total)}</td>
      <td><button class="btn btn-danger btn-sm" onclick="hapusKeranjang(${i})">✕</button></td>
    </tr>`;
  }).join('');

  document.getElementById('totalKeranjang').textContent = 'Rp ' + formatRp(grandTotal);
}

function simpanTransaksi() {
  if (keranjang.length === 0) { showToast('Keranjang kosong', 'error'); return; }

  const namaSupplier = document.getElementById('namaSupplier')?.value || '';
  const data = getData();
  const trxId = 'TRX' + Date.now();
  const now = new Date().toISOString();

  keranjang.forEach(item => {
    data.push({ ...item, id: trxId, namaSupplier, waktu: now });
  });

  saveData(data);
  localStorage.setItem('strukData', JSON.stringify({ items: keranjang, namaSupplier, waktu: now, trxId }));

  keranjang = [];
  renderKeranjang();
  if (document.getElementById('namaSupplier')) document.getElementById('namaSupplier').value = '';
  showToast('Transaksi tersimpan!', 'success');

  setTimeout(() => { location.href = 'invoice.html'; }, 800);
}

/* ─── HARGA PAGE ─── */
function renderHarga() {
  const t = document.getElementById('hargaBody');
  if (!t) return;
  const h = getHarga();
  hargaList = h;
  t.innerHTML = Object.keys(h).map(k => `
    <tr>
      <td>${k}</td>
      <td><input type="number" value="${h[k]}" onchange="updateHarga('${k}', this.value)"
          style="width:120px;text-align:right;"></td>
      <td><button class="btn btn-danger btn-sm" onclick="hapusJenis('${k}')">Hapus</button></td>
    </tr>`).join('');
}

function updateHarga(k, v) {
  const h = getHarga();
  h[k] = parseInt(v) || 0;
  saveHarga(h);
  showToast(`Harga ${k} diperbarui`, 'success');
}

function hapusJenis(k) {
  const h = getHarga();
  delete h[k];
  saveHarga(h);
  renderHarga();
  showToast(`${k} dihapus`, 'success');
}

function tambahJenis() {
  const nama = document.getElementById('namaJenis')?.value?.trim();
  const harga = parseInt(document.getElementById('hargaJenis')?.value);
  if (!nama) { showToast('Masukkan nama jenis', 'error'); return; }
  const h = getHarga();
  h[nama] = harga || 0;
  saveHarga(h);
  renderHarga();
  document.getElementById('namaJenis').value = '';
  document.getElementById('hargaJenis').value = '';
  showToast(`${nama} ditambahkan`, 'success');
}

/* ─── INVOICE PAGE ─── */
function loadStruk() {
  const raw = localStorage.getItem('strukData');
  if (!raw) return;
  const d = JSON.parse(raw);
  const items = d.items || [];
  const now = d.waktu ? new Date(d.waktu) : new Date();

  document.getElementById('invTanggal').textContent = formatTanggal(now);
  document.getElementById('invId').textContent = d.trxId || '-';
  document.getElementById('invSupplier').textContent = d.namaSupplier || '-';

  const tbody = document.getElementById('invBody');
  let total = 0;
  tbody.innerHTML = items.map(x => {
    total += x.total;
    return `<tr>
      <td>${x.jenis}</td>
      <td>${x.kg} kg</td>
      <td>Rp ${formatRp(x.harga)}</td>
      <td>Rp ${formatRp(x.total)}</td>
    </tr>`;
  }).join('');

  document.getElementById('invTotal').textContent = 'Rp ' + formatRp(total);
}

/* ─── REKAP PAGE ─── */
function renderRekap(mode, filterVal) {
  const data = getData();
  const tbody = document.getElementById('rekapBody');
  const summaryEl = document.getElementById('rekapSummary');
  if (!tbody) return;

  let filtered = data.filter(d => {
    const w = new Date(d.waktu);
    if (mode === 'tanggal') {
      return toDateStr(w) === filterVal;
    } else if (mode === 'bulan') {
      return toMonthStr(w) === filterVal;
    } else if (mode === 'tahun') {
      return w.getFullYear().toString() === filterVal;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px">Tidak ada data</td></tr>`;
    if (summaryEl) summaryEl.innerHTML = '';
    return;
  }

  // Summary
  const totalKg = filtered.reduce((s,d) => s + parseFloat(d.kg), 0);
  const totalNominal = filtered.reduce((s,d) => s + d.total, 0);
  const jenisSet = [...new Set(filtered.map(d => d.jenis))];

  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="rekap-item"><div class="val">${filtered.length}</div><div class="key">Transaksi</div></div>
      <div class="rekap-item"><div class="val">${totalKg.toFixed(1)} kg</div><div class="key">Total Berat</div></div>
      <div class="rekap-item"><div class="val">${jenisSet.length}</div><div class="key">Jenis Barang</div></div>
      <div class="rekap-item"><div class="val">Rp ${formatRp(totalNominal)}</div><div class="key">Total Nilai</div></div>
    `;
  }

  tbody.innerHTML = filtered.map((d, i) => `
    <tr>
      <td>${i+1}</td>
      <td>${formatTanggal(new Date(d.waktu))}</td>
      <td>${d.namaSupplier || '-'}</td>
      <td>${d.jenis}</td>
      <td>${d.kg} kg</td>
      <td>Rp ${formatRp(d.total)}</td>
    </tr>`).join('');
}

function applyRekap() {
  const tab = document.querySelector('.tab-btn.active')?.dataset.tab || 'tanggal';
  let val = '';

  if (tab === 'tanggal') val = document.getElementById('filterTanggal')?.value || '';
  if (tab === 'bulan')   val = document.getElementById('filterBulan')?.value || '';
  if (tab === 'tahun')   val = document.getElementById('filterTahun')?.value || '';

  renderRekap(tab, val);
}

/* ─── GRAFIK PAGE ─── */
function renderChart() {
  const data = getData();
  const total = {};
  data.forEach(d => { total[d.jenis] = (total[d.jenis] || 0) + d.total; });

  const ctx = document.getElementById('chart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(total),
      datasets: [{
        label: 'Total (Rp)',
        data: Object.values(total),
        backgroundColor: 'rgba(34,211,238,0.25)',
        borderColor: 'rgba(34,211,238,0.9)',
        borderWidth: 2,
        borderRadius: 8,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 11 },
          callback: v => 'Rp ' + formatRp(v) } }
      }
    }
  });
}

/* ─── EXPORT EXCEL ─── */
function exportExcel(mode, filterVal) {
  const data = getData();
  let filtered = data.filter(d => {
    const w = new Date(d.waktu);
    if (mode === 'tanggal') return toDateStr(w) === filterVal;
    if (mode === 'bulan')   return toMonthStr(w) === filterVal;
    if (mode === 'tahun')   return w.getFullYear().toString() === filterVal;
    return true;
  });

  if (filtered.length === 0) { showToast('Tidak ada data untuk diekspor', 'error'); return; }

  // Group by tanggal + supplier
  const totalKg = filtered.reduce((s,d) => s + parseFloat(d.kg), 0);
  const totalNilai = filtered.reduce((s,d) => s + d.total, 0);

  // Per-jenis summary
  const byJenis = {};
  filtered.forEach(d => {
    if (!byJenis[d.jenis]) byJenis[d.jenis] = { kg: 0, total: 0 };
    byJenis[d.jenis].kg += parseFloat(d.kg);
    byJenis[d.jenis].total += d.total;
  });

  const ws_data = [
    ['CV CAHAYA BERKAH LIMBAH'],
    [`Rekap Periode: ${mode.toUpperCase()} — ${filterVal}`],
    ['Dicetak:', formatTanggal(new Date())],
    [],
    ['No', 'Tanggal', 'Supplier', 'Jenis Barang', 'Berat (kg)', 'Harga/kg', 'Total (Rp)'],
    ...filtered.map((d, i) => [
      i + 1,
      formatTanggal(new Date(d.waktu)),
      d.namaSupplier || '-',
      d.jenis,
      d.kg,
      d.harga,
      d.total
    ]),
    [],
    ['RANGKUMAN PER JENIS', '', '', '', '', '', ''],
    ['Jenis', '', '', '', 'Total Kg', '', 'Total Nilai'],
    ...Object.entries(byJenis).map(([k, v]) => [k, '', '', '', v.kg.toFixed(2), '', v.total]),
    [],
    ['', '', '', 'GRAND TOTAL', totalKg.toFixed(2), '', totalNilai],
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  // Column widths
  ws['!cols'] = [
    { wch: 5 }, { wch: 20 }, { wch: 22 }, { wch: 20 },
    { wch: 12 }, { wch: 14 }, { wch: 16 }
  ];

  // Merge header cells
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
  ];

  // Apply borders and styles to all cells
  const borderStyle = {
    top:    { style: 'thin', color: { rgb: 'AAAAAA' } },
    bottom: { style: 'thin', color: { rgb: 'AAAAAA' } },
    left:   { style: 'thin', color: { rgb: 'AAAAAA' } },
    right:  { style: 'thin', color: { rgb: 'AAAAAA' } },
  };
  const headerBorder = {
    top:    { style: 'medium', color: { rgb: '2563EB' } },
    bottom: { style: 'medium', color: { rgb: '2563EB' } },
    left:   { style: 'medium', color: { rgb: '2563EB' } },
    right:  { style: 'medium', color: { rgb: '2563EB' } },
  };

  const range = XLSX.utils.decode_range(ws['!ref']);
  // Row 4 (index 4) is the header row: No, Tanggal, Supplier, ...
  const headerRow = 4;
  // Data rows start at 5, summary header at dataRows+6
  const dataStart = 5;
  const dataEnd = dataStart + filtered.length - 1;
  const summaryHeaderRow = dataEnd + 2;
  const summaryColHeaderRow = summaryHeaderRow + 1;

  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[addr]) ws[addr] = { v: '', t: 's' };

      const isHeaderRow = (R === headerRow);
      const isDataRow = (R >= dataStart && R <= dataEnd);
      const isTitleRow = (R <= 2);
      const isSummaryHeader = (R === summaryHeaderRow || R === summaryColHeaderRow);
      const isGrandTotal = (R === range.e.r);

      // Skip empty spacer rows
      if (R === dataEnd + 1 || R === summaryColHeaderRow + Object.keys(byJenis).length + 1) {
        ws[addr].s = {};
        continue;
      }

      let fill = undefined;
      let fontBold = false;
      let fontColor = '000000';
      let border = borderStyle;

      if (isTitleRow) {
        fill = { fgColor: { rgb: '1E3A5F' } };
        fontBold = true; fontColor = 'FFFFFF';
        border = headerBorder;
      } else if (isHeaderRow) {
        fill = { fgColor: { rgb: '2563EB' } };
        fontBold = true; fontColor = 'FFFFFF';
        border = headerBorder;
      } else if (isSummaryHeader) {
        fill = { fgColor: { rgb: 'DBEAFE' } };
        fontBold = true; fontColor = '1E3A5F';
      } else if (isGrandTotal) {
        fill = { fgColor: { rgb: 'FEF3C7' } };
        fontBold = true; fontColor = '92400E';
        border = { top: { style: 'medium', color: { rgb: 'F59E0B' } }, bottom: { style: 'medium', color: { rgb: 'F59E0B' } }, left: borderStyle.left, right: borderStyle.right };
      } else if (isDataRow && R % 2 === 0) {
        fill = { fgColor: { rgb: 'F8FAFC' } };
      }

      ws[addr].s = {
        border,
        font: { bold: fontBold, color: { rgb: fontColor }, name: 'Calibri', sz: 10 },
        alignment: { vertical: 'center', wrapText: false },
        ...(fill ? { fill } : {})
      };
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Rekap');
  const fname = `CBL_Rekap_${mode}_${filterVal}.xlsx`;
  XLSX.writeFile(wb, fname);
  showToast('File Excel berhasil diunduh!', 'success');
}

/* ─── UTILS ─── */
function formatRp(n) {
  return parseInt(n || 0).toLocaleString('id-ID');
}

function formatTanggal(d) {
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function toDateStr(d)  { return d.toISOString().slice(0, 10); }
function toMonthStr(d) { return d.toISOString().slice(0, 7); }

let _toastTimer;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = (type === 'success' ? '✅ ' : '❌ ') + msg;
  t.className = `show ${type}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { t.className = ''; }, 3000);
}

/* ─── TAB SWITCHING ─── */
function switchTab(btn, tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(tabId).classList.add('active');
  applyRekap();
}
