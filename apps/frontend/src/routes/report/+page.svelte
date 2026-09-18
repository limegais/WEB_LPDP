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
    series: [{ name: 'Energi', type: 'bar', barWidth: 30, itemStyle: { color: '#5c8ee8', borderRadius: [3, 3, 0, 0] }, data: energy }, { name: 'Target', type: 'line', symbol: 'none', lineStyle: { color: '#ff9b31', type: 'dashed', width: 2 }, data: [130, 130, 135, 140, 150, 155, 150, 155, 155] }]
  };

  const plants = [
    ['PT. Indolakto C3', '350.26 MWh', '83.1%', '#16ae8c'], ['PT. Bogasari', '534.45 MWh', '80.8%', '#16ae8c'],
    ['PT. Multi Kencana', '362.53 MWh', '79.6%', '#4e83ee'], ['Superindo (DCC)', '158.09 MWh', '77.2%', '#4e83ee'],
    ['Superindo (SHI)', '88.76 MWh', '76.8%', '#ff9224'], ['Superindo (CJA)', '45.39 MWh', '74.2%', '#ff9224'],
    ['PLTS Malaka P01', '2.16 MWh', '80.8%', '#ffb21c'], ['UNPAD FK', '-', '-', '#ff5361']
  ];
</script>

<svelte:head><title>Laporan & Analisis</title></svelte:head>

<div class="min-h-screen bg-[#f4f7f8] text-[#17324a]">
  <aside class:open={menuOpen} class="sidebar fixed inset-y-0 left-0 z-30 flex w-[72px] flex-col border-r border-[#e5ecef] bg-white">
    <div class="flex h-14 items-center justify-center border-b border-[#f0f2f4] text-2xl text-[#ff991f]">*</div>
    <nav class="mt-2 flex flex-1 flex-col gap-1 px-2">
      <a href="/dashboard" class="nav-button"><span class="nav-glyph">⌂</span><span>Home</span></a><a href="/plant" class="nav-button"><span class="nav-glyph">▦</span><span>Plants</span></a><a href="/devices" class="nav-button"><span class="nav-glyph">▤</span><span>Devices</span></a><a href="/maintenance" class="nav-button"><span class="nav-glyph">⌁</span><span>Maintenance</span></a><a href="/report" class="nav-button current"><span class="nav-glyph">▧</span><span>Reports</span></a><a href="/settings" class="nav-button"><span class="nav-glyph">⚙</span><span>Settings</span></a>
    </nav>
    <a href="mailto:support@rms.co.id" class="nav-button mb-3 mx-2"><span class="nav-glyph">?</span><span>Help</span></a>
  </aside>

  <main class="lg:pl-[72px]">
    <header class="flex h-14 items-center gap-3 px-4 sm:px-7"><button class="icon-button lg:hidden" on:click={() => (menuOpen = !menuOpen)} aria-label="Open navigation">☰</button><p class="hidden text-[11px] text-[#7e909d] sm:block">Good afternoon, <strong class="text-[#3b5062]">PT. RMS</strong></p><span class="hidden text-[11px] text-[#7e909d] sm:block">Friday, 18 Sep 2026</span><div class="ml-auto flex items-center gap-3"><label class="hidden h-8 w-52 items-center gap-2 rounded bg-white px-3 text-[#a8b5bd] sm:flex"><span>⌕</span><input class="w-full bg-transparent text-[10px] outline-none" placeholder="Search plants or devices" /></label><button class="icon-button relative" aria-label="Notifications">♧<span class="absolute -right-1 -top-1 grid h-3 w-3 place-items-center rounded-full bg-[#ff5361] text-[7px] text-white">3</span></button><div class="grid h-8 w-8 place-items-center rounded-full bg-[#254563] text-[10px] font-bold text-white">R</div></div></header>

    <div class="mx-auto max-w-[1600px] space-y-3 px-3 pb-7 sm:px-5">
      <section class="flex flex-wrap items-end justify-between gap-3"><div><p class="eyebrow">Report & Analysis</p><h1 class="mt-1 text-[32px] font-semibold text-[#1f3a52]">Reports & analysis</h1><p class="mt-2 text-sm text-[#748998]">Historical energy production and solar system performance data.</p></div><div class="flex gap-2"><button class="toolbar-btn" on:click={() => alert('Preparing PDF export.')}>↧ Export PDF</button><button class="toolbar-btn" on:click={() => alert('Preparing CSV export.')}>↧ Export CSV</button></div></section>

      <section class="grid gap-3 xl:grid-cols-[1fr_265px]">
        <article class="panel p-5"><div class="flex flex-wrap items-start justify-between gap-3"><div><h2 class="section-title">Produksi energi</h2><p class="section-subtitle">Januari - September 2026 · per bulan</p></div><div class="control-group">{#each periods as item}<button class:active={period === item} on:click={() => (period = item)}>{item}</button>{/each}<span class="divider"></span>{#each reportTabs as item}<button class:active={reportTab === item} on:click={() => (reportTab = item)}>{item}</button>{/each}</div></div><div class="mt-4 h-[235px]"><Chart option={energyOption} /></div><div class="flex justify-between border-t border-[#edf1f3] pt-3 text-[10px] text-[#8195a3]"><span><i class="legend blue"></i>Energi <i class="legend dashed"></i>Target</span><strong class="text-[#526b7d]">Total: 1277.3 MWh</strong></div></article>
        <aside class="panel p-5"><h2 class="section-title">Performa per plant</h2><div class="mt-5 space-y-4">{#each plants as plant}<div><div class="flex justify-between text-[10px]"><span>{plant[0]}</span><strong>{plant[1]}</strong></div><div class="mt-1 flex items-center gap-2"><div class="h-1 flex-1 rounded bg-[#e8edef]"><div class="h-full rounded" style={`width:${Number.parseFloat(plant[2]) || 0}%;background:${plant[3]}`}></div></div><small style={`color:${plant[3]}`}>{plant[2]}</small></div></div>{/each}</div></aside>
      </section>

      <section class="panel overflow-hidden p-5"><div class="flex items-center justify-between"><div><h2 class="section-title">Detail harian — September 2026</h2><p class="section-subtitle">Produksi, target, performa, dan kondisi lingkungan</p></div><button class="toolbar-btn">↧ Export</button></div><div class="mt-4 overflow-x-auto"><table class="w-full min-w-[1000px] text-left"><thead><tr class="border-b border-[#e8eef0] text-[10px] text-[#6e8393]"><th class="py-3">Tanggal</th><th>Energi (kWh)</th><th>Target (kWh)</th><th>PR (%)</th><th>Jam Ekuivalen</th><th>Daya Puncak (kW)</th><th>CO₂ (ton)</th><th>Irradiasi (kWh/m²)</th></tr></thead><tbody>{#each dailyRows as row}<tr class="border-b border-[#eff3f5] text-[11px]"><td class="py-2.5">{row[0]}</td><td class="text-[#1768c2]">{row[1]}</td><td class="text-[#60798a]">{row[2]}</td><td class:text-orange={row[3] === '72.9%' || row[3] === '74.9%'} class="text-[#08a080]">{row[3]}</td><td>{row[4]}</td><td>{row[5]}</td><td class="text-[#08a080]">{row[6]}</td><td class="text-[#60798a]">{row[7]}</td></tr>{/each}</tbody></table></div></section>
    </div>
  </main>
</div>

<style>
  .sidebar { transform:translateX(-100%); transition:transform .2s ease; }.sidebar.open { transform:translateX(0); }.nav-button { display:flex; min-height:49px; width:100%; flex-direction:column; align-items:center; justify-content:center; gap:3px; border-radius:5px; color:#6e8492; font-size:9px; }.nav-button:hover,.nav-button.current { background:#fff7ed; color:#fb8b20; }.nav-glyph { font-size:17px; line-height:17px; }.icon-button { display:grid; height:30px; width:30px; place-items:center; border-radius:5px; color:#6c8190; }.icon-button:hover { background:#edf3f4; }.eyebrow { color:#fb8b20; font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }.panel { border:1px solid #e8edef; border-radius:10px; background:#fff; }.toolbar-btn { height:35px; border:1px solid #d9e4ea; border-radius:8px; padding:0 12px; font-size:12px; color:#5f7585; background:#fff; }.metric { min-height:104px; border:1px solid #e8edef; border-radius:10px; padding:15px 17px; background:#fff; }.metric p,.section-subtitle { color:#8399a7; font-size:10px; }.metric strong { display:block; margin-top:9px; font-size:23px; color:#1f3a52; }.metric small { font-size:13px; font-weight:500; }.metric span { display:block; margin-top:8px; font-size:9px; font-weight:600; }.positive { color:#08a080; }.positive.blue { color:#527fec; }.negative { color:#ff7b22; }.section-title { font-size:14px; font-weight:650; }.control-group { display:flex; align-items:center; border:1px solid #e2eaed; border-radius:5px; overflow:hidden; }.control-group button { padding:7px 10px; color:#8498a5; font-size:10px; }.control-group button.active { background:#edf3f5; color:#2d485c; font-weight:700; }.divider { height:22px; border-left:1px solid #e0e9ec; }.legend { display:inline-block; height:5px; width:5px; margin:0 5px 1px 0; border-radius:1px; background:#5c8ee8; }.legend.dashed { width:17px; height:0; margin-left:12px; border-top:2px dashed #ff9b31; border-radius:0; background:transparent; }.text-orange { color:#ff8b17 !important; }.metric:first-child { border-top:2px solid #ff9b31; }.metric:nth-child(2) { border-top:2px solid #5c8ee8; }.metric:nth-child(3) { border-top:2px solid #22bfa6; }.metric:nth-child(4) { border-top:2px solid #22c59a; }@media (min-width:1024px) { .sidebar { transform:translateX(0); } }
</style>
