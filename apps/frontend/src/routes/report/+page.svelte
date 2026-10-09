<script lang="ts">
  import Chart from '$lib/components/Chart.svelte';

  let menuOpen = false;
  let period = 'Bulan';
  let reportTab = 'Energi';

  const periods = ['Harian', 'Bulan', 'Tahunan'];
  const reportTabs = ['Energi', 'Performa', 'Alarm', 'CO₂'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep'];
  const energy = [112, 98, 126, 132, 145, 154, 137, 148, 149];

  const dailyRows = [
    ['2026-09-01', '5200', '6254', '82.6%', '1.59 h', '547', '3.96', '4.10'],
    ['2026-09-02', '4800', '6154', '87.4%', '1.47 h', '505', '3.65', '4.28'],
    ['2026-09-03', '6100', '6154', '76.4%', '1.87 h', '642', '4.64', '4.61'],
    ['2026-09-04', '5900', '6296', '76.3%', '1.81 h', '621', '4.49', '4.10'],
    ['2026-09-05', '6400', '6416', '78.0%', '1.96 h', '674', '4.87', '3.99'],
    ['2026-09-06', '5700', '6393', '82.3%', '1.75 h', '600', '4.34', '3.90'],
    ['2026-09-07', '6200', '6191', '80.3%', '1.90 h', '653', '4.72', '4.82'],
    ['2026-09-08', '5500', '6475', '86.7%', '1.68 h', '579', '4.19', '5.34'],
    ['2026-09-09', '4900', '6403', '75.2%', '1.50 h', '516', '3.73', '4.08'],
    ['2026-09-10', '6000', '6320', '87.1%', '1.84 h', '632', '4.57', '5.17'],
    ['2026-09-11', '5800', '6327', '82.1%', '1.78 h', '611', '4.41', '4.40'],
    ['2026-09-12', '6300', '6120', '78.9%', '1.93 h', '663', '4.79', '4.38'],
    ['2026-09-13', '5100', '6108', '72.9%', '1.56 h', '537', '3.88', '5.26'],
    ['2026-09-14', '6400', '6432', '79.6%', '1.96 h', '674', '4.87', '5.33'],
    ['2026-09-15', '5600', '6205', '76.9%', '1.72 h', '589', '4.26', '5.05'],
    ['2026-09-16', '5300', '6400', '78.6%', '1.62 h', '558', '4.03', '4.89'],
    ['2026-09-17', '6000', '6438', '77.9%', '1.84 h', '632', '4.57', '4.94'],
    ['2026-09-18', '5800', '6477', '74.9%', '1.78 h', '611', '4.41', '4.94']
  ];

  const energyOption = {
    grid: { top: 25, right: 20, bottom: 35, left: 42 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: months, axisLine: { lineStyle: { color: '#dce5e9' } }, axisLabel: { color: '#8ca0af', fontSize: 10 } },
    yAxis: { type: 'value', min: 0, max: 180, interval: 45, axisLabel: { color: '#8ca0af', fontSize: 10 }, splitLine: { lineStyle: { color: '#e9eff2' } } },
    series: [
      { name: 'Energi', type: 'bar', barWidth: 30, itemStyle: { color: '#5c8ee8', borderRadius: [3, 3, 0, 0] }, data: energy },
      { name: 'Target', type: 'line', symbol: 'none', lineStyle: { color: '#ff4f00', type: 'dashed', width: 2 }, data: [130, 130, 135, 140, 150, 155, 150, 155, 155] }
    ]
  };

  const plants = [
    ['PLTS Gedung 3 FT', '350.26 MWh', '83.1%', '#16ae8c'],
    ['PLTS di Indomaker', '534.45 MWh', '80.8%', '#16ae8c']
  ];
</script>

<svelte:head><title>Laporan & Analisis</title></svelte:head>

<div class="page-shell">
  <aside class:open={menuOpen} class="sidebar">
    <div class="logo-cell">☼</div>
    <nav class="nav-list">
      <a href="/dashboard" class="nav-button"><span class="nav-glyph">⌂</span><span>Home</span></a>
      <a href="/plant" class="nav-button"><span class="nav-glyph">▦</span><span>Plants</span></a>
      <a href="/devices" class="nav-button"><span class="nav-glyph">▤</span><span>Devices</span></a>
      <a href="/maintenance" class="nav-button"><span class="nav-glyph">⌁</span><span>Maintenance</span></a>
      <a href="/report" class="nav-button current"><span class="nav-glyph">▧</span><span>Reports</span></a>
      <a href="/settings" class="nav-button"><span class="nav-glyph">⚙</span><span>Settings</span></a>
    </nav>
    <a href="/support" class="nav-button nav-help"><span class="nav-glyph">?</span><span>Help</span></a>
  </aside>

  <main class="main-area">
    <header class="top-bar">
      <button class="icon-button lg-hidden" on:click={() => (menuOpen = !menuOpen)} aria-label="Open navigation">☰</button>
      <p class="greeting">Good afternoon, <strong>PT. RMS</strong></p>
      <span class="date-label">Friday, 18 Sep 2026</span>
      <div class="bar-actions">
        <label class="search-box">
          <span>⌕</span>
          <input placeholder="Search plants or devices" />
        </label>
        <button class="icon-button" aria-label="Notifications">♧<span class="notif-dot">3</span></button>
        <div class="avatar">R</div>
      </div>
    </header>

    <div class="content-wrap">
      <!-- Page title -->
      <section class="page-title-row">
        <div>
          <p class="eyebrow">Report &amp; Analysis</p>
          <h1>Reports &amp; analysis</h1>
          <p class="subtitle">Historical energy production and solar system performance data.</p>
        </div>
        <div class="row-actions">
          <button class="toolbar-btn" on:click={() => alert('Preparing PDF export.')}>↧ Export PDF</button>
          <button class="toolbar-btn" on:click={() => alert('Preparing CSV export.')}>↧ Export CSV</button>
        </div>
      </section>

      <!-- Main content grid: chart + plant perf -->
      <section class="main-grid">
        <!-- Energy chart panel -->
        <article class="panel chart-panel">
          <div class="chart-header">
            <div>
              <h2 class="section-title">Produksi energi</h2>
              <p class="section-subtitle">Januari - September 2026 · per bulan</p>
            </div>
            <div class="control-group">
              {#each periods as item}
                <button class:active={period === item} on:click={() => (period = item)}>{item}</button>
              {/each}
              <span class="divider"></span>
              {#each reportTabs as item}
                <button class:active={reportTab === item} on:click={() => (reportTab = item)}>{item}</button>
              {/each}
            </div>
          </div>
          <div class="chart-area">
            <Chart option={energyOption} />
          </div>
          <div class="chart-footer">
            <span><i class="legend blue"></i>Energi <i class="legend dashed"></i>Target</span>
            <strong>Total: 1277.3 MWh</strong>
          </div>
        </article>

        <!-- Plant performance panel -->
        <aside class="panel plant-panel">
          <h2 class="section-title">Performa per plant</h2>
          <div class="plant-list">
            {#each plants as plant}
              <div class="plant-item">
                <div class="plant-name-row">
                  <span>{plant[0]}</span>
                  <strong>{plant[1]}</strong>
                </div>
                <div class="bar-row">
                  <div class="bar-bg">
                    <div class="bar-fill" style={`width:${parseFloat(plant[2]) || 0}%;background:${plant[3]}`}></div>
                  </div>
                  <small style={`color:${plant[3]}`}>{plant[2]}</small>
                </div>
              </div>
            {/each}
          </div>
        </aside>
      </section>

      <!-- Daily detail table -->
      <section class="panel table-panel">
        <div class="table-header">
          <div>
            <h2 class="section-title">Detail harian — September 2026</h2>
            <p class="section-subtitle">Produksi, target, performa, dan kondisi lingkungan</p>
          </div>
          <button class="toolbar-btn">↧ Export</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Energi (kWh)</th>
                <th>Target (kWh)</th>
                <th>PR (%)</th>
                <th>Jam Ekuivalen</th>
                <th>Daya Puncak (kW)</th>
                <th>CO₂ (ton)</th>
                <th>Irradiasi (kWh/m²)</th>
              </tr>
            </thead>
            <tbody>
              {#each dailyRows as row}
                <tr>
                  <td>{row[0]}</td>
                  <td class="col-energy">{row[1]}</td>
                  <td class="col-muted">{row[2]}</td>
                  <td class="col-green">{row[3]}</td>
                  <td>{row[4]}</td>
                  <td>{row[5]}</td>
                  <td class="col-green">{row[6]}</td>
                  <td class="col-muted">{row[7]}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </main>
</div>

<style>
  /* ---- Layout Shell ---- */
  .page-shell {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: #f4f7f8;
    color: #17324a;
    font-family: inherit;
  }

  .sidebar {
    position: fixed;
    inset-block: 0;
    left: 0;
    z-index: 30;
    display: flex;
    width: 72px;
    flex-direction: column;
    border-right: 1px solid #0096d6;
    background: #00b7ff;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
  }
  .sidebar.open { transform: translateX(0); }
  @media (min-width: 1024px) { .sidebar { transform: translateX(0); } }

  .logo-cell {
    display: flex;
    height: 56px;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid #0096d6;
    font-size: 24px;
    color: #fff;
    font-weight: bold;
  }

  .nav-list {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4px;
    padding: 8px;
    margin-top: 0;
    overflow-y: auto;
  }

  .nav-button { display: flex; min-height: 54px; width: 100%; flex-direction: column; align-items: center; justify-content: center; gap: 4px; border-radius: 8px; color: rgba(255, 255, 255, 0.7); font-size: 11px; font-weight: 600; }
  .nav-button:hover, .nav-button.current { background: rgba(0, 0, 0, 0.15); color: #ffffff; }
  .nav-glyph { font-size: 17px; line-height: 17px; }
  .nav-help { margin: 0 8px 12px; }

  /* ---- Main Area ---- */
  .main-area {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    padding-left: 0;
  }
  @media (min-width: 1024px) { .main-area { padding-left: 72px; } }

  .top-bar {
    display: flex;
    height: 56px;
    flex-shrink: 0;
    align-items: center;
    gap: 12px;
    padding: 0 20px;
    border-bottom: 1px solid #e8edf1;
    background: #fff;
  }
  .lg-hidden { display: block; }
  @media (min-width: 1024px) { .lg-hidden { display: none; } }

  .greeting { font-size: 11px; color: #7e909d; }
  .greeting strong { color: #3b5062; }
  .date-label { font-size: 11px; color: #7e909d; display: none; }
  @media (min-width: 640px) { .date-label { display: block; } }

  .bar-actions { display: flex; gap: 10px; align-items: center; margin-left: auto; }

  .search-box {
    display: none;
    height: 32px;
    width: 200px;
    align-items: center;
    gap: 8px;
    border-radius: 6px;
    background: #f3f7f9;
    border: 1px solid #e2eaed;
    padding: 0 12px;
    color: #a8b5bd;
    font-size: 10px;
  }
  @media (min-width: 640px) { .search-box { display: flex; } }
  .search-box input { width: 100%; background: transparent; border: none; outline: none; }

  .icon-button {
    position: relative;
    display: grid;
    height: 30px;
    width: 30px;
    place-items: center;
    border-radius: 5px;
    color: #6c8190;
    font-size: 14px;
  }
  .icon-button:hover { background: #edf3f4; }
  .notif-dot {
    position: absolute;
    top: -3px;
    right: -3px;
    display: grid;
    height: 12px;
    width: 12px;
    place-items: center;
    border-radius: 50%;
    background: #ff5361;
    color: #fff;
    font-size: 7px;
  }

  .avatar {
    display: grid;
    height: 32px;
    width: 32px;
    place-items: center;
    border-radius: 50%;
    background: #254563;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
  }

  /* ---- Content Area ---- */
  .content-wrap {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 10px;
    padding: 12px 16px;
    overflow: hidden;
    min-height: 0;
  }

  .page-title-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 10px;
    flex-shrink: 0;
  }

  .eyebrow { color: #ff4f00; font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
  h1 { margin-top: 4px; font-size: 22px; font-weight: 600; color: #1f3a52; }
  .subtitle { margin-top: 4px; font-size: 11px; color: #748998; }

  .row-actions { display: flex; gap: 8px; }

  /* ---- Main content grid ---- */
  .main-grid {
    display: grid;
    grid-template-columns: 1fr 260px;
    gap: 10px;
    flex: 1;
    min-height: 0;
  }

  /* ---- Panel base ---- */
  .panel {
    border: 1px solid #e8edef;
    border-radius: 10px;
    background: #fff;
    overflow: hidden;
  }

  /* ---- Chart panel ---- */
  .chart-panel {
    display: flex;
    flex-direction: column;
    padding: 16px;
    min-height: 0;
  }

  .chart-header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    flex-shrink: 0;
  }

  .chart-area {
    flex: 1;
    min-height: 0;
    margin-top: 12px;
  }

  .chart-footer {
    display: flex;
    justify-content: space-between;
    border-top: 1px solid #edf1f3;
    padding-top: 10px;
    margin-top: 8px;
    font-size: 10px;
    color: #8195a3;
    flex-shrink: 0;
  }
  .chart-footer strong { color: #526b7d; }

  /* ---- Plant perf panel ---- */
  .plant-panel {
    display: flex;
    flex-direction: column;
    padding: 16px;
    min-height: 0;
  }

  .plant-list {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0;
    margin-top: 12px;
    overflow-y: auto;
  }

  .plant-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-bottom: 1px solid #f0f4f6;
    padding: 6px 0;
  }
  .plant-item:last-child { border-bottom: none; }

  .plant-name-row {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #4a6172;
  }
  .plant-name-row strong { color: #1f3a52; }

  .bar-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }
  .bar-bg { flex: 1; height: 4px; border-radius: 99px; background: #e8edef; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 99px; }

  /* ---- Table panel ---- */
  .table-panel {
    flex-shrink: 0;
    padding: 16px;
    max-height: 280px;
    overflow: hidden;
  }

  .table-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .table-wrap {
    margin-top: 12px;
    overflow-x: auto;
    overflow-y: auto;
    max-height: 200px;
  }

  table { width: 100%; min-width: 900px; text-align: left; border-collapse: collapse; }
  thead tr { border-bottom: 1px solid #e8eef0; }
  th { padding: 8px 6px; font-size: 10px; color: #6e8393; font-weight: 600; }
  td { padding: 8px 6px; font-size: 11px; border-bottom: 1px solid #eff3f5; }

  .col-energy { color: #1768c2; }
  .col-muted { color: #60798a; }
  .col-green { color: #08a080; }

  /* ---- Shared components ---- */
  .section-title { font-size: 13px; font-weight: 650; color: #1f3a52; margin: 0; }
  .section-subtitle { color: #8399a7; font-size: 10px; margin-top: 2px; }

  .toolbar-btn {
    height: 32px;
    border: 1px solid #d9e4ea;
    border-radius: 7px;
    padding: 0 12px;
    font-size: 11px;
    color: #5f7585;
    background: #fff;
    cursor: pointer;
  }
  .toolbar-btn:hover { background: #f4f8fa; }

  .control-group {
    display: flex;
    align-items: center;
    border: 1px solid #e2eaed;
    border-radius: 5px;
    overflow: hidden;
  }
  .control-group button { padding: 6px 10px; color: #8498a5; font-size: 10px; }
  .control-group button.active { background: #edf3f5; color: #2d485c; font-weight: 700; }
  .divider { height: 22px; border-left: 1px solid #e0e9ec; }

  .legend { display: inline-block; height: 5px; width: 5px; margin: 0 5px 1px 0; border-radius: 1px; background: #5c8ee8; }
  .legend.dashed { width: 17px; height: 0; margin-left: 12px; border-top: 2px dashed #ff4f00; border-radius: 0; background: transparent; }
</style>


