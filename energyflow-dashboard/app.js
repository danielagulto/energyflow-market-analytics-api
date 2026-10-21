/* EnergyFlow dashboard frontend. Configure API_BASE if your backend is hosted elsewhere. */
const API_BASE = (window.ENERGYFLOW_API_BASE || 'http://127.0.0.1:8000').replace(/\/$/, '');
const SUMMARY_PATH = '/api/v1/analytics/summary';
const PRICE_PATH = '/api/v1/prices';
const $ = (id) => document.getElementById(id);
let allRecords = [];
let priceChart = null;
let currentSummary = null;

function formatNumber(value, digits = 2) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString('en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '—';
}
function formatPrice(value) { return formatNumber(value, 2); }
function setConnection(state, label) {
  const dot = $('sidebarStatusDot');
  dot.className = `status-dot ${state}`;
  $('sidebarStatus').textContent = label;
}
function showToast(message) {
  const toast = $('toast'); toast.textContent = message; toast.classList.add('show');
  window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 3000);
}
async function getJson(path) {
  const response = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  return response.json();
}
function pick(obj, keys) {
  for (const key of keys) if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  return undefined;
}
function normalizeRecords(payload) {
  const candidate = Array.isArray(payload) ? payload : pick(payload, ['items', 'records', 'data', 'results', 'prices']);
  if (!Array.isArray(candidate)) return [];
  return candidate.map((row, index) => ({
    id: pick(row, ['id', 'record_id', 'price_id']) ?? `EF-${String(index + 1).padStart(3, '0')}`,
    region: pick(row, ['region', 'country', 'market']) ?? 'ES',
    timestamp: pick(row, ['timestamp', 'datetime', 'date_time', 'observed_at', 'date', 'time', 'period_start']),
    price: Number(pick(row, ['price_eur_mwh', 'price', 'price_eur_mwh_value', 'value', 'price_eur']))
  })).filter(row => Number.isFinite(row.price));
}
function getSummary(payload) {
  return {
    region: pick(payload, ['region']) ?? 'ES',
    count: Number(pick(payload, ['record_count', 'count', 'total_records', 'total'])) || 0,
    average: Number(pick(payload, ['average_price_eur_mwh', 'average_price', 'avg_price', 'mean_price'])),
    minimum: Number(pick(payload, ['minimum_price_eur_mwh', 'minimum_price', 'min_price'])),
    maximum: Number(pick(payload, ['maximum_price_eur_mwh', 'maximum_price', 'max_price'])),
    deviation: Number(pick(payload, ['standard_deviation_eur_mwh', 'standard_deviation', 'std_dev']))
  };
}
function renderSummary(summary) {
  currentSummary = summary;
  $('averagePrice').textContent = formatPrice(summary.average);
  $('minimumPrice').textContent = formatPrice(summary.minimum);
  $('maximumPrice').textContent = formatPrice(summary.maximum);
  $('recordCount').textContent = Number.isFinite(summary.count) ? summary.count.toLocaleString('en-GB') : '—';
  $('priceSpread').innerHTML = `${formatPrice(summary.maximum - summary.minimum)} <small>EUR/MWh</small>`;
  $('rangeMin').textContent = formatPrice(summary.minimum);
  $('rangeAvg').textContent = formatPrice(summary.average);
  $('rangeMax').textContent = formatPrice(summary.maximum);
  const spread = summary.maximum - summary.minimum;
  $('rangeFill').style.width = '100%';
  $('marketInsight').textContent = Number.isFinite(spread) ? `The observed price range is €${formatPrice(spread)} per MWh across ${summary.count} records. These are demo dataset values, not live market quotes.` : 'Summary data loaded. Check the API response fields if some metrics are unavailable.';
  $('lastUpdated').textContent = `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
function formatTimestamp(value, index) {
  if (!value) return `Observation ${String(index + 1).padStart(2, '0')}`;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function renderChart(records) {
  const canvas = $('priceChart');
  const empty = $('chartEmpty');
  if (!window.Chart) { empty.textContent = 'Chart library could not load. Check your internet connection.'; return; }
  if (!records.length) { empty.textContent = 'No individual price records were returned by the API.'; empty.classList.remove('hidden'); if (priceChart) priceChart.destroy(); return; }
  empty.classList.add('hidden');
  const sorted = [...records].sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
  if (priceChart) priceChart.destroy();
  priceChart = new Chart(canvas, {
    type: 'line',
    data: { labels: sorted.map((r, i) => r.timestamp ? formatTimestamp(r.timestamp, i) : `Record ${i + 1}`), datasets: [{ label: 'Price', data: sorted.map(r => r.price), borderColor: '#159a75', backgroundColor: 'rgba(37,214,162,.10)', fill: true, tension: .34, borderWidth: 2, pointRadius: sorted.length > 35 ? 0 : 3, pointHoverRadius: 5, pointBackgroundColor: '#fff', pointBorderColor: '#159a75' }] },
    options: { responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' }, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#132238', padding: 11, displayColors: false, callbacks: { label: context => ` €${formatPrice(context.parsed.y)} / MWh` } } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: '#9aa6b6', maxTicksLimit: 7, maxRotation: 0, font: { family: 'DM Sans', size: 9 } } }, y: { border: { display: false, dash: [3, 4] }, grid: { color: '#edf1f5' }, ticks: { color: '#9aa6b6', font: { family: 'DM Sans', size: 9 }, callback: value => `€${value}` } } } }
  });
  $('chartDataNote').textContent = `${records.length} observations returned`;
}
function renderTable(records) {
  const body = $('recordsBody');
  const query = $('tableSearch').value.trim().toLowerCase();
  const filtered = records.filter(r => [r.id, r.region, r.timestamp, r.price].join(' ').toLowerCase().includes(query));
  $('recordsCount').textContent = `${filtered.length} record${filtered.length === 1 ? '' : 's'}`;
  if (!filtered.length) { body.innerHTML = '<tr><td colspan="5" class="table-message">No records found. The API may only expose summary data, or the search returned no matches.</td></tr>'; return; }
  body.innerHTML = filtered.slice(0, 100).map((r, i) => `<tr><td class="record-id">${escapeHtml(String(r.id ?? `EF-${i + 1}`))}</td><td><span class="region-tag">${escapeHtml(String(r.region))}</span></td><td>${escapeHtml(formatTimestamp(r.timestamp, i))}</td><td class="price-cell">€${formatPrice(r.price)}</td><td><span class="status-tag">Recorded</span></td></tr>`).join('');
}
function escapeHtml(value) { return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
async function loadDashboard() {
  const region = $('regionSelect').value;
  $('chartEmpty').classList.remove('hidden'); $('chartEmpty').textContent = 'Loading market records…';
  $('chartDataNote').textContent = 'Connecting to API…';
  try {
    const summaryPayload = await getJson(`${SUMMARY_PATH}?region=${encodeURIComponent(region)}`);
    renderSummary(getSummary(summaryPayload));
    setConnection('ok', 'API connected');
    try {
      const pricePayload = await getJson(`${PRICE_PATH}?region=${encodeURIComponent(region)}`);
      allRecords = normalizeRecords(pricePayload);
      renderChart(allRecords); renderTable(allRecords);
      if (!allRecords.length) $('chartDataNote').textContent = 'Summary endpoint connected; no price list found.';
    } catch (priceError) {
      allRecords = []; renderChart([]); renderTable([]);
      $('chartDataNote').textContent = 'Summary available; records endpoint unavailable.';
      console.info('EnergyFlow prices endpoint was not available:', priceError.message);
    }
  } catch (error) {
    setConnection('error', 'API unavailable');
    $('chartEmpty').textContent = 'Could not connect. Start the FastAPI server, then refresh.';
    $('chartDataNote').textContent = 'Connection failed';
    $('recordsBody').innerHTML = `<tr><td colspan="5" class="table-message">${escapeHtml(error.message)}. Check that the backend is running at ${escapeHtml(API_BASE)}.</td></tr>`;
    showToast('Could not connect to EnergyFlow API.');
  }
}
function exportCsv() {
  if (!allRecords.length) { showToast('No individual records available to export yet.'); return; }
  const rows = [['id', 'region', 'timestamp', 'price_eur_mwh'], ...allRecords.map(r => [r.id, r.region, r.timestamp ?? '', r.price])];
  const csv = rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a'); link.href = url; link.download = 'energyflow-market-records.csv'; link.click(); URL.revokeObjectURL(url);
  showToast('CSV export downloaded.');
}
$('refreshButton').addEventListener('click', loadDashboard);
$('regionSelect').addEventListener('change', loadDashboard);
$('tableSearch').addEventListener('input', () => renderTable(allRecords));
$('exportButton').addEventListener('click', exportCsv);
$('mobileMenu').addEventListener('click', () => $('sidebar').classList.toggle('open'));
document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', () => $('sidebar').classList.remove('open')));
loadDashboard();
