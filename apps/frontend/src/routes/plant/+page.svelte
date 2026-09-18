<script lang="ts">
  let menuOpen = false;
  let activeTab = 'All (20)';

  const tabs = ['All (20)', 'Following (0)', 'Normal (14)', 'Fault (2)', 'Offline (5)'];

  const rows = [
    {
      name: 'UNPAD (Fakultas Kedokteran)',
      location: 'Hegarmanah, Jatinangor',
      status: 'Fault (2)',
      statusColor: '#ff5a67',
      type: 'C&I PV',
      installed: '123.12 kWp',
      realtime: '-',
      yieldToday: '-',
      monthly: '2.19 MWh',
      annual: '2.19 MWh',
      pr: '-'
    },
    {
      name: 'UNPAD (Vokasi)',
      location: 'Jatinangor, Sumedang',
      status: 'Offline device',
      statusColor: '#9ba9b2',
      type: 'C&I PV',
      installed: '86.40 kWp',
      realtime: '-',
      yieldToday: '-',
      monthly: '1.50 MWh',
      annual: '1.50 MWh',
      pr: '-'
    },
    {
      name: 'PLTS Malaka P01',
      location: 'Jl. Nusa Indah VI No. 35',
      status: 'Normal',
      statusColor: '#22c59a',
      type: 'C&I PV',
      installed: '7.63 kWp',
      realtime: '2.66 kW',
      yieldToday: '11.00 kWh',
      monthly: '227.90 kWh',
      annual: '2.16 MWh',
      pr: '80.84%'
    },
    {
      name: 'PT. Indolakto C3 - Cicurug',
      location: 'Paracahna, Sukabumi',
      status: 'Normal',
      statusColor: '#22c59a',
      type: 'C&I PV',
      installed: '812.30 kWp',
      realtime: '594.92 kW',
      yieldToday: '2.67 MWh',
      monthly: '62.04 MWh',
      annual: '350.26 MWh',
      pr: '80.84%'
    },
    {
      name: 'Superindo (SHI)',
      location: 'Sukaraja, Kabupaten Bogor',
      status: 'Normal',
      statusColor: '#22c59a',
      type: 'C&I PV',
      installed: '95.00 kWp',
      realtime: '64.52 kW',
      yieldToday: '275.00 kWh',
      monthly: '6.51 MWh',
      annual: '88.76 MWh',
      pr: '80.84%'
    }
  ];
</script>

<svelte:head>
  <title>Plant Management</title>
</svelte:head>

<div class="min-h-screen bg-[#f4f7f8] text-[#17324a]">
  <aside class:open={menuOpen} class="sidebar fixed inset-y-0 left-0 z-30 flex w-[72px] flex-col border-r border-[#e5ecef] bg-white">
    <div class="flex h-14 items-center justify-center border-b border-[#f0f2f4] text-2xl text-[#ff991f]">*</div>
    <nav class="mt-2 flex flex-1 flex-col gap-1 px-2">
      <a href="/dashboard" class="nav-button" title="Home"><span class="nav-glyph">⌂</span><span>Home</span></a>
      <a href="/plant" class="nav-button current" title="Plants"><span class="nav-glyph">▦</span><span>Plants</span></a>
      <a href="/devices" class="nav-button" title="Devices"><span class="nav-glyph">▤</span><span>Devices</span></a>
      <a href="/maintenance" class="nav-button" title="Maintenance"><span class="nav-glyph">⌁</span><span>Maintenance</span></a>
      <a href="/report" class="nav-button" title="Report"><span class="nav-glyph">▧</span><span>Report</span></a>
      <a href="/settings" class="nav-button" title="System"><span class="nav-glyph">⚙</span><span>System</span></a>
    </nav>
  </aside>

  <main class="lg:pl-[72px]">
    <header class="flex h-14 items-center gap-3 px-4 sm:px-7">
      <button class="icon-button lg:hidden" on:click={() => (menuOpen = !menuOpen)} aria-label="Open navigation">☰</button>
      <p class="hidden text-[11px] text-[#7e909d] sm:block">Good afternoon, <strong class="text-[#3b5062]">PT. RMS</strong></p>
      <span class="hidden text-[11px] text-[#7e909d] sm:block">Friday, 18 Sep 2026</span>
      <div class="ml-auto flex items-center gap-3">
        <label class="hidden h-8 w-52 items-center gap-2 rounded bg-white px-3 text-[#a8b5bd] sm:flex">
          <span>⌕</span>
          <input class="w-full bg-transparent text-[10px] outline-none" placeholder="Search plants or devices" />
        </label>
        <button class="icon-button relative" aria-label="Notifications">♧<span class="absolute -right-1 -top-1 grid h-3 w-3 place-items-center rounded-full bg-[#ff5361] text-[7px] text-white">3</span></button>
        <div class="grid h-8 w-8 place-items-center rounded-full bg-[#254563] text-[10px] font-bold text-white">R</div>
      </div>
    </header>

    <div class="mx-auto max-w-[1580px] px-3 pb-6 sm:px-5">
      <section class="mb-3">
        <p class="eyebrow">Plant Management</p>
        <h1 class="mt-1 text-[40px] leading-[1.1] font-semibold text-[#1f3a52]">Plant list</h1>
        <p class="mt-2 text-sm text-[#748998]">Manage and monitor all your solar installations.</p>
      </section>

      <section class="panel overflow-hidden">
        <div class="border-b border-[#ebf0f2] p-4">
          <div class="flex flex-wrap items-center gap-2">
            <select class="toolbar-input"><option>All countries / regions</option></select>
            <select class="toolbar-input"><option>All plant types</option></select>
            <label class="toolbar-input search"><input placeholder="Plant or device name" /><span>⌕</span></label>
            <button class="toolbar-btn" on:click={() => alert('Filters applied.')}>⚯ Filter</button>
            <button class="toolbar-btn primary" on:click={() => alert('Plant search applied.')}>Search</button>
            <button class="ml-auto toolbar-btn" on:click={() => alert('Add plant form is ready.')}>+ Add plant</button>
          </div>
          <div class="mt-4 flex flex-wrap items-center gap-5 text-xs">
            {#each tabs as tab}
              <button class:active-tab={activeTab === tab} class="status-tab" on:click={() => (activeTab = tab)}>{tab}</button>
            {/each}
            <div class="ml-auto flex items-center gap-2 text-[#8da0ad]">
              <span>Optional columns</span>
              <button class="chip">☰</button>
              <button class="chip">▤</button>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[1200px] text-left">
            <thead>
              <tr class="border-b border-[#ebf0f2] bg-[#fcfdfe] text-[11px] text-[#6e8393]">
                <th class="px-4 py-3">Plant name</th>
                <th class="px-3 py-3">Status</th>
                <th class="px-3 py-3">Plant type</th>
                <th class="px-3 py-3">Installed power</th>
                <th class="px-3 py-3">Real-time power</th>
                <th class="px-3 py-3">Yield today</th>
                <th class="px-3 py-3">Monthly yield</th>
                <th class="px-3 py-3">Annual yield</th>
                <th class="px-3 py-3">Plant PR</th>
                <th class="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each rows as row}
                <tr class="border-b border-[#eff3f5] text-[12px] text-[#2a4257]">
                  <td class="px-4 py-3">
                    <div class="flex items-start gap-3">
                      <span class="thumb"></span>
                      <div>
                        <p class="font-semibold">{row.name}</p>
                        <p class="text-[11px] text-[#8ca0ad]">{row.location}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-3 py-3"><span class="status-pill" style={`--dot:${row.statusColor}`}>{row.status}</span></td>
                  <td class="px-3 py-3">{row.type}</td>
                  <td class="px-3 py-3">{row.installed}</td>
                  <td class="px-3 py-3">{row.realtime}</td>
                  <td class="px-3 py-3">{row.yieldToday}</td>
                  <td class="px-3 py-3">{row.monthly}</td>
                  <td class="px-3 py-3">{row.annual}</td>
                  <td class="px-3 py-3">{row.pr}</td>
                  <td class="px-3 py-3 text-[#6f8392]">☆ ⌂ ⋮</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <footer class="flex items-center justify-between px-4 py-3 text-xs text-[#89a0af]">
          <p>Showing 12 of 20 plants</p>
          <div class="flex items-center gap-1">
            <button class="chip">‹</button>
            <button class="chip chip-active">1</button>
            <button class="chip">2</button>
            <button class="chip">›</button>
          </div>
        </footer>
      </section>
    </div>
  </main>
</div>

<style>
  .sidebar { transform: translateX(-100%); transition: transform .2s ease; }
  .sidebar.open { transform: translateX(0); }
  .nav-button { display:flex; min-height:49px; width:100%; flex-direction:column; align-items:center; justify-content:center; gap:3px; border-radius:5px; color:#6e8492; font-size:9px; }
  .nav-button:hover, .nav-button.current { background:#fff7ed; color:#fb8b20; }
  .nav-glyph { font-size:17px; line-height:17px; }
  .icon-button { display:grid; height:30px; width:30px; place-items:center; border-radius:5px; color:#6c8190; }
  .icon-button:hover { background:#edf3f4; }
  .eyebrow { color:#fb8b20; font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
  .panel { border:1px solid #e8edef; border-radius:10px; background:white; }
  .toolbar-input { height:35px; min-width:145px; border:1px solid #e7eef1; border-radius:8px; padding:0 11px; color:#6c8292; font-size:12px; background:#f9fbfc; }
  .toolbar-input.search { display:flex; align-items:center; justify-content:space-between; min-width:280px; }
  .toolbar-input.search input { width:100%; border:none; outline:none; background:transparent; color:#3d566a; font-size:12px; }
  .toolbar-btn { height:35px; border:1px solid #d9e4ea; border-radius:8px; padding:0 12px; font-size:12px; color:#5f7585; background:white; }
  .toolbar-btn.primary { color:white; background:#1f3a52; border-color:#1f3a52; }
  .status-tab { position:relative; color:#778d9c; }
  .status-tab.active-tab { color:#1f3a52; font-weight:700; }
  .status-tab.active-tab::after { content:''; position:absolute; left:0; right:0; bottom:-9px; height:2px; background:#ff9224; }
  .thumb { width:26px; height:26px; border-radius:3px; background:linear-gradient(135deg,#cad8de,#8bb2bf); }
  .status-pill { display:inline-flex; align-items:center; gap:5px; font-size:11px; color:#607b8f; }
  .status-pill::before { content:''; width:6px; height:6px; border-radius:999px; background:var(--dot); }
  .chip { min-width:24px; height:24px; border:1px solid #e4ecef; border-radius:6px; font-size:11px; color:#8399a7; }
  .chip-active { background:#ff972e; border-color:#ff972e; color:white; }
  @media (min-width: 1024px) {
    .sidebar { transform: translateX(0); }
  }
</style>
