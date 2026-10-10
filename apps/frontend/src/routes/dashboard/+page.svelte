<script lang="ts">
  import Chart from '$lib/components/Chart.svelte';
  import PlantMap from '$lib/components/PlantMap.svelte';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore, ROLES, canAccess, type AuthUser } from '$lib/auth';

  let menuOpen = false;
  let currentUser: AuthUser | null = null;

  onMount(() => {
    authStore.load();
    const unsub = authStore.subscribe((u) => {
      currentUser = u;
      if (!u) goto('/login');
    });
    return unsub;
  });

  function handleLogout() {
    authStore.logout();
  }

  $: roleConfig = currentUser ? ROLES[currentUser.role] : null;
  $: initials = currentUser ? currentUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '--';
  let activeRange = 'Day';

  const plantOptions = ['All Plants', 'PLTS Gedung 3 FT', 'PLTS di Indomaker'];
  let selectedPlant = 'All Plants';

  const plantWeatherData: Record<string, { status: string, icon: string, temp: string, irradiance: string }> = {
    'All Plants': { status: 'Various', icon: '🌍', temp: '25-33°C', irradiance: 'Avg 650 W/m²' },
    'PLTS Gedung 3 FT': { status: 'Sunny', icon: '☀️', temp: '29°C', irradiance: '850 W/m²' },
    'PLTS di Indomaker': { status: 'Partly Cloudy', icon: '⛅', temp: '32°C', irradiance: '520 W/m²' }
  };

  $: weather = plantWeatherData[selectedPlant] || plantWeatherData['All Plants'];

  const plantBatteryData: Record<string, { soc: number, status: string, power: string, color: string }> = {
    'All Plants': { soc: 75, status: 'Various', power: 'Aggregate', color: '#19b89e' },
    'PLTS Gedung 3 FT': { soc: 92, status: 'Charging', power: '0.4 MW', color: '#19b89e' },
    'PLTS di Indomaker': { soc: 45, status: 'Discharging', power: '0.8 MW', color: '#ff4f00' }
  };

  $: battery = plantBatteryData[selectedPlant] || plantBatteryData['All Plants'];

  const recentAlarms = [
    { time: '10:14', msg: 'Inverter 2 Overheating', type: 'fault' },
    { time: '09:00', msg: 'Grid Voltage Abnormal', type: 'alarm' }
  ];

  const ranges = ['Day', 'Week', 'Month', 'Year', 'Total'];

  const navigation = [
    { label: 'Home', icon: '⌂', href: '/dashboard' },
    { label: 'Plants', icon: '▦', href: '/plant' },
    { label: 'Devices', icon: '▤', href: '/devices' },
    { label: 'Owner', icon: '◎', href: '/owner-hub' },
    { label: 'Maintenance', icon: '⌁', href: '/maintenance' },
    { label: 'Reports', icon: '▧', href: '/report' },
    { label: 'Settings', icon: '⚙', href: '/settings' }
  ];

  const summaries = [
    { label: 'YIELD TODAY (MWH)', value: '7.83', target: '92%' },
    { label: 'YIELD THIS MONTH (MWH)', value: '169.93', target: '85%' },
    { label: 'TOTAL YIELD (GWH)', value: '2.60', target: '' },
    { label: 'REAL-TIME POWER (W)', value: '0', target: '' },
    { label: 'INSTALLED POWER (MWP)', value: '3.69', target: '' }
  ];

  const revenue = [
    { label: 'REVENUE TODAY (IDR)', value: '8,176,669.87', target: '95%' },
    { label: 'THIS MONTH (IDR)', value: '167,313,597.75', target: '88%' },
    { label: 'THIS YEAR (IDR)', value: '2,145,032,276.78', target: '' },
    { label: 'TOTAL REVENUE (IDR)', value: '2,540,321,913.90', target: '' }
  ];

  const plantStatuses = [
    { label: 'All plants', value: 17, icon: '▦', color: '#ff4f00' },
    { label: 'Following', value: 0, icon: '★', color: '#ff4f00' },
    { label: 'Normal', value: 13, icon: '●', color: '#19b89e' },
    { label: 'Abnormal', value: 1, icon: '!', color: '#f35a65' },
    { label: 'Offline', value: 3, icon: '◉', color: '#91a1aa' },
    { label: 'Commissioning', value: 0, icon: '↑', color: '#00b7ff' }
  ];

  const dailyPlants = [
    ['PLTS Gedung 3 FT', '3.46 h', '92%'],
    ['PLTS di Indomaker', '3.34 h', '86%']
  ];

  const powerOption = {
    grid: { top: 28, right: 20, bottom: 36, left: 48 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1a3246',
      borderColor: '#1a3246',
      textStyle: { color: '#fff', fontSize: 13 },
      formatter: (p: any[]) => `<b>${p[0].name}</b><br/>Power: <b>${p[0].value} MW</b>`
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '23:00'],
      axisLine: { lineStyle: { color: '#dce4e9' } },
      axisLabel: { color: '#7d909d', fontSize: 12, margin: 10 }
    },
    yAxis: {
      type: 'value',
      name: 'MW',
      nameTextStyle: { color: '#7d909d', fontSize: 12, padding: [0, 0, 0, -20] },
      min: 0,
      max: 1.2,
      interval: 0.4,
      axisLabel: { color: '#7d909d', fontSize: 12 },
      splitLine: { lineStyle: { color: '#ebf0f3', type: 'dashed' } }
    },
    series: [
      {
        name: 'RESS active power',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#ff4f00', width: 3 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255,79,0,0.18)' },
              { offset: 1, color: 'rgba(255,79,0,0.01)' }
            ]
          }
        },
        data: [0.05, 0.05, 0.05, 0.12, 0.68, 0.95, 1.10, 1.08, 0.90, 0.55, 0.18, 0.07, 0.05]
      }
    ]
  };

  const alarmOption = {
    series: [
      {
        type: 'pie',
        radius: ['65%', '84%'],
        silent: true,
        label: { show: false },
        data: [
          { value: 2, itemStyle: { color: '#f35a65' } },
          { value: 1, itemStyle: { color: '#ff4f00' } },
          { value: 7, itemStyle: { color: '#ecf2f5' } }
        ]
      }
    ]
  };
</script>

<svelte:head>
  <title>SolarCloud Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-[#f3f7f8] text-[#1a3449]">
  <aside class:open={menuOpen} class="sidebar fixed inset-y-0 left-0 z-30 flex w-[72px] flex-col border-r border-[#0096d6] bg-[#00b7ff]">
    <div class="flex h-14 items-center justify-center border-b border-[#0096d6] text-2xl text-white font-bold">☼</div>
    <nav class="mt-2 flex flex-1 flex-col gap-1 px-2">
      {#each navigation as item, index}
        <a class:current={index === 0} class="nav-button" href={item.href} title={item.label}>
          <span class="nav-glyph">{item.icon}</span>
          <span>{item.label}</span>
        </a>
      {/each}
    </nav>
    <a href="/support" class="nav-button mx-2 mb-3" title="Support">
      <span class="nav-glyph">?</span>
      <span>Support</span>
    </a>
  </aside>

  <main class="h-full lg:pl-[72px]">
    <header class="flex h-14 items-center gap-3 border-b border-[#e8eef1] bg-[#f7fafb] px-4 sm:px-6">
      <button class="icon-button lg:hidden" on:click={() => (menuOpen = !menuOpen)} aria-label="Open navigation">☰</button>
      <p class="hidden text-[13px] text-[#3b5262] font-medium xl:block">RESS Solar Monitoring Dashboard</p>
      
      <div class="ml-4 flex items-center">
        <select bind:value={selectedPlant} class="text-[12px] border border-[#dce4e9] rounded px-2 py-1.5 bg-white outline-none text-[#17324a] font-medium">
          {#each plantOptions as opt}
            <option value={opt}>{opt}</option>
          {/each}
        </select>
      </div>

      <div class="ml-auto flex items-center gap-3">
        <span class="text-[12px] text-[#4b5e6b] font-medium">Updated: 19:42:30</span>
        <button class="icon-button" aria-label="Notifications">♧</button>
        {#if currentUser && roleConfig}
          <div class="flex items-center gap-2">
            <div
              class="rounded px-2 py-0.5 text-[9px] font-bold"
              style="background:{roleConfig.color}22;color:{roleConfig.color};border:1px solid {roleConfig.color}55"
            >
              {roleConfig.badge} {roleConfig.label}
            </div>
            <div
              class="grid h-8 w-8 place-items-center rounded-full text-[10px] font-bold text-white"
              style="background:{roleConfig.color}"
              title="{currentUser.name} ({currentUser.email})"
            >
              {initials}
            </div>
            <button
              class="icon-button text-[10px] text-[#a0b0bb] hover:text-[#f35a65]"
              on:click={handleLogout}
              title="Logout"
              aria-label="Logout"
            >⏻</button>
          </div>
        {:else}
          <div class="grid h-8 w-8 place-items-center rounded-full bg-[#254563] text-[10px] font-bold text-white">R</div>
        {/if}
      </div>
    </header>


    <div class="frame-wrap">
      <section class="main-frame">
        <div class="top-band">
          <div class="summary-grid">
            {#each summaries as item}
              <div class="metric-card">
                <p>{item.label}</p>
                <strong>{item.value}</strong>
                {#if item.target}
                  <div class="target-bar">
                    <div class="target-track">
                      <div class="target-fill target-fill--green" style="width: {item.target}"></div>
                    </div>
                    <span class="target-pct target-pct--green">{item.target}</span>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
          <div class="revenue-grid">
            {#each revenue as item}
              <div class="metric-card metric-card--revenue">
                <p>{item.label}</p>
                <strong>{item.value}</strong>
                {#if item.target}
                  <div class="target-bar">
                    <div class="target-track">
                      <div class="target-fill target-fill--blue" style="width: {item.target}"></div>
                    </div>
                    <span class="target-pct target-pct--blue">{item.target}</span>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>

        <div class="middle-band">
          <article class="panel panel-chart">
            <div class="panel-head">
              <h2>RESS Active Power</h2>
              <div class="control-group">
                {#each ranges as range}
                  <button class:active={activeRange === range} on:click={() => (activeRange = range)}>{range}</button>
                {/each}
              </div>
            </div>
            <div class="chart-date">
              <button aria-label="Previous date">‹</button>
              <span>18/Sep/2026</span>
              <button aria-label="Next date">›</button>
            </div>
            <div class="chart-box">
              <Chart option={powerOption} />
            </div>
            <div class="legend-line"><span></span>RESS Active Power (MW)</div>
          </article>

          <article class="panel panel-weather flex flex-col overflow-hidden">
            <div class="panel-head-simple mb-2">
              <h2 class="!text-[13px] !text-[#4b5e6b] font-bold">Weather & Irradiance</h2>
            </div>
            
            {#if selectedPlant === 'All Plants'}
              <div class="flex flex-col flex-1">
                {#each Object.entries(plantWeatherData).filter(([k]) => k !== 'All Plants') as [name, w]}
                  <div class="flex justify-between items-center flex-1 border-b border-[#edf2f5] last:border-0 px-1 py-1">
                    <span class="truncate w-[55%] text-[12px] text-[#2b4357] font-medium" title={name}>{name}</span>
                    <div class="flex gap-2 items-center text-right flex-shrink-0">
                      <span title={w.status} class="text-[16px]">{w.icon}</span>
                      <span class="text-[13px] text-[#17324a] font-bold">{w.temp}</span>
                      <span class="text-[11px] text-[#4b5e6b]">{w.irradiance}</span>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="flex-1 flex flex-col justify-center items-center text-center">
                <div class="text-4xl text-[#ff4f00] my-2">{weather.icon}</div>
                <strong class="text-lg text-[#17324a]">{weather.status}</strong>
                <div class="flex justify-between w-full px-4 mt-6 text-[13px] text-[#3b5262] font-medium">
                  <span>Temp: <b class="text-[#17324a] text-[14px]">{weather.temp}</b></span>
                  <span>Irr: <b class="text-[#17324a] text-[14px]">{weather.irradiance}</b></span>
                </div>
              </div>
            {/if}
          </article>

          <article class="panel panel-battery flex flex-col overflow-hidden">
            <div class="panel-head-simple mb-2">
              <h2 class="!text-[13px] !text-[#4b5e6b] font-bold">RESS Battery Status</h2>
            </div>
            
            {#if selectedPlant === 'All Plants'}
              <div class="flex flex-col flex-1">
                {#each Object.entries(plantBatteryData).filter(([k]) => k !== 'All Plants') as [name, b]}
                  <div class="flex justify-between items-center flex-1 border-b border-[#edf2f5] last:border-0 px-1 py-1">
                    <span class="truncate w-[40%] text-[12px] text-[#2b4357] font-medium" title={name}>{name}</span>
                    <div class="flex-1 mx-2">
                      <div class="h-[10px] rounded-full bg-[#e9f0f3] overflow-hidden">
                        <div class="h-full rounded-full" style="width: {b.soc}%; background: {b.color}"></div>
                      </div>
                    </div>
                    <div class="flex gap-1.5 items-center flex-shrink-0">
                      <span class="font-bold text-[13px]" style="color: {b.color}">{b.soc}%</span>
                      <span class="text-[11px] text-[#4b5e6b] font-medium">{b.status}</span>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="flex-1 flex flex-col justify-center items-center text-center">
                <div class="text-4xl my-2" style="color: {battery.color}">🔋</div>
                <strong class="text-lg text-[#17324a]">{battery.soc}% SoC</strong>
                <div class="w-full px-4 mt-4">
                  <div class="h-3 rounded-full bg-[#e9f0f3] overflow-hidden">
                    <div class="h-full rounded-full" style="width: {battery.soc}%; background: {battery.color}"></div>
                  </div>
                </div>
                <div class="flex justify-between w-full px-4 mt-4 text-[13px] text-[#3b5262] font-medium">
                  <span style="color: {battery.color}">{battery.status}</span>
                  <span><b class="text-[#17324a] text-[14px]">{battery.power}</b></span>
                </div>
              </div>
            {/if}
          </article>

          <article class="panel panel-alarm flex flex-col overflow-hidden">
            <h2 class="mb-2">Alarms & Feed</h2>
            <div class="flex flex-col flex-1">
              {#each recentAlarms as alarm}
                <div class="alarm-feed-row">
                  <span class="alarm-dot alarm-dot--{alarm.type}"></span>
                  <div class="alarm-feed-content">
                    <span class="alarm-time">{alarm.time}</span>
                    <p class="alarm-msg">{alarm.msg}</p>
                  </div>
                </div>
              {/each}
              <div class="alarm-view-all">
                View all notifications →
              </div>
            </div>
          </article>

          <article class="panel panel-plant flex flex-col">
            <h2>Plant Information</h2>
            <div class="status-list">
              {#each plantStatuses as item}
                <button class="status-row" on:click={() => void 0}>
                  <span class="status-mark" style={`color:${item.color}`}>{item.icon}</span>
                  <span class="status-label">{item.label}</span>
                  <b>{item.value}</b>
                </button>
              {/each}
            </div>
          </article>
        </div>

        <div class="bottom-band">
          <article class="panel panel-hours flex flex-col">
            <div class="panel-head-simple">
              <h2>Daily Equivalent Hours</h2>
              <span>Top 2</span>
            </div>
            <div class="daily-grid">
              {#each dailyPlants as plant, index}
                <div class="daily-row">
                  <em>{index + 1}</em>
                  <div class="daily-main">
                    <div class="daily-line">
                      <span>{plant[0]}</span>
                      <b>{plant[1]}</b>
                    </div>
                    <div class="bar"><span style={`width:${plant[2]}`}></span></div>
                  </div>
                </div>
              {/each}
            </div>
          </article>

          <article class="panel panel-emission flex flex-col">
            <h2>Emission Reduction</h2>
            <div class="emission-grid">
              <div class="emission-item">
                <span class="emission-icon">🌿</span>
                <strong>2,593.30</strong>
                <p>CO₂ Reduction (t)</p>
              </div>
              <div class="emission-item">
                <span class="emission-icon">⛏</span>
                <strong>1,050.85</strong>
                <p>Coal Saved (t)</p>
              </div>
              <div class="emission-item">
                <span class="emission-icon">🌳</span>
                <strong>141,594</strong>
                <p>Trees Equivalent</p>
              </div>
            </div>
          </article>

          <article class="panel panel-map">
            <h2>Plant Locations</h2>
            <div class="map-wrapper" style="margin-top: 8px; height: calc(100% - 24px);">
              <PlantMap {plantWeatherData} />
            </div>
          </article>
        </div>
      </section>
    </div>
  </main>
</div>

<style>
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.2s ease;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .nav-button { display: flex; min-height: 54px; width: 100%; flex-direction: column; align-items: center; justify-content: center; gap: 4px; border-radius: 8px; color: rgba(255, 255, 255, 0.7); font-size: 11px; font-weight: 600; }

  .nav-button:hover, .nav-button.current { background: rgba(0, 0, 0, 0.15); color: #ffffff; }

  .nav-glyph {
    font-size: 19px;
    line-height: 19px;
  }

  .icon-button {
    display: grid;
    height: 30px;
    width: 30px;
    place-items: center;
    border-radius: 6px;
    color: #6d8290;
  }

  .icon-button:hover {
    background: #ebf2f5;
  }

  .frame-wrap {
    height: calc(100vh - 56px);
    padding: 10px 14px 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .main-frame {
    display: grid;
    grid-template-rows: auto 1fr 1fr;
    gap: 12px;
    flex: 1;
    min-height: 0;
    border: 1px solid #e4ecef;
    border-radius: 16px;
    background: radial-gradient(circle at top right, #ffffff 0%, #f7fbfd 38%, #f2f7f9 100%);
    padding: 12px;
    overflow: hidden;
  }

  .panel {
    border: 1px solid #e6edf0;
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 4px 16px rgba(29, 66, 84, 0.06), 0 1px 4px rgba(29,66,84,0.04);
    overflow: hidden;
    transition: box-shadow 0.2s ease;
  }

  .panel:hover {
    box-shadow: 0 8px 28px rgba(29, 66, 84, 0.10), 0 1px 4px rgba(29,66,84,0.04);
  }

  .top-band {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 10px;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    border: 1px solid #e6edf0;
    border-radius: 12px;
    background: #f9fbfc;
    overflow: hidden;
  }

  .revenue-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border: 1px solid #e6edf0;
    border-radius: 12px;
    background: #f9fbfc;
    overflow: hidden;
  }

  .metric-card {
    border-right: 1px solid #e6edf0;
    padding: 8px 12px;
  }

  .metric-card:last-child {
    border-right: 0;
  }

  .metric-card p {
    color: #546977;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.2;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .metric-card strong {
    display: block;
    margin-top: 4px;
    font-size: 24px;
    line-height: 1.15;
    font-weight: 500;
    color: #17324a;
    letter-spacing: -0.02em;
  }

  .metric-card--revenue strong {
    font-size: 20px;
  }

  .target-bar {
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .target-track {
    height: 5px;
    flex: 1;
    border-radius: 999px;
    background: #e9f0f3;
    overflow: hidden;
  }

  .target-fill {
    height: 100%;
    border-radius: 999px;
  }

  .target-fill--green { background: #19b89e; }
  .target-fill--blue  { background: #00b7ff; }

  .target-pct {
    font-size: 12px;
    font-weight: 800;
    flex-shrink: 0;
  }

  .target-pct--green { color: #19b89e; }
  .target-pct--blue  { color: #00b7ff; }

  .middle-band {
    display: grid;
    grid-template-columns: 1.5fr 0.6fr 0.6fr 0.7fr 0.6fr;
    gap: 10px;
    align-items: stretch;
    min-height: 0;
  }

  .panel-chart,
  .panel-alarm,
  .panel-plant,
  .panel-hours,
  .panel-emission,
  .panel-weather,
  .panel-battery,
  .panel-map {
    padding: 14px;
  }

  /* panels in grid rows must fill the row height */
  .middle-band > .panel,
  .bottom-band > .panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .panel h2 {
    margin: 0;
    font-size: 13px;
    font-weight: 800;
    color: #1a3246;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .control-group {
    display: flex;
    border: 1px solid #d9e3e8;
    border-radius: 6px;
    overflow: hidden;
  }

  .control-group button {
    padding: 5px 11px;
    color: #4b5e6b;
    font-size: 13px;
    font-weight: 600;
    line-height: 1;
  }

  .control-group button.active {
    background: #fff;
    color: #ff4f00;
    font-weight: 800;
  }

  .chart-date {
    display: flex;
    width: 160px;
    justify-content: space-between;
    margin: 10px auto 0;
    border-radius: 999px;
    background: #f0f6f9;
    padding: 5px 12px;
    color: #4b5e6b;
    font-size: 12px;
    font-weight: 700;
  }

  .chart-box {
    flex: 1;
    margin-top: 8px;
    min-height: 0;
  }

  .legend-line {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    color: #4b5e6b;
    font-size: 12px;
    font-weight: 600;
    margin-top: 6px;
  }

  .legend-line span {
    height: 10px;
    width: 28px;
    border-radius: 4px;
    background: linear-gradient(90deg, #ff4f00 0%, #ff7733 100%);
    opacity: 0.8;
  }

  /* Alarm feed styles */
  .alarm-feed-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    flex: 1;
    padding: 9px 0;
    border-bottom: 1px solid #edf2f5;
  }

  .alarm-feed-row:last-of-type {
    border-bottom: 0;
  }

  .alarm-dot {
    flex-shrink: 0;
    margin-top: 3px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .alarm-dot--fault { background: #f35a65; box-shadow: 0 0 0 3px rgba(243,90,101,0.15); }
  .alarm-dot--alarm { background: #ff4f00; box-shadow: 0 0 0 3px rgba(255,79,0,0.15); }

  .alarm-feed-content {
    flex: 1;
  }

  .alarm-time {
    font-size: 13px;
    font-weight: 700;
    color: #4b5e6b;
    display: block;
  }

  .alarm-msg {
    margin-top: 2px;
    font-size: 14px;
    font-weight: 700;
    color: #17324a;
    line-height: 1.35;
  }

  .alarm-view-all {
    padding-top: 8px;
    margin-top: auto;
    font-size: 13px;
    font-weight: 700;
    text-align: center;
    color: #00b7ff;
    cursor: pointer;
    letter-spacing: 0.02em;
  }

  .alarm-view-all:hover {
    text-decoration: underline;
  }

  .alarm-body {
    display: grid;
    grid-template-columns: 1fr;
    place-items: center;
    gap: 8px;
    margin: 12px auto 2px;
    width: min(100%, 190px);
  }

  .alarm-ring {
    position: relative;
    height: 108px;
    width: 108px;
  }

  .alarm-center {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    text-align: center;
    color: #20384e;
  }

  .alarm-center strong {
    font-size: 24px;
    line-height: 1;
  }

  .alarm-center span {
    font-size: 9px;
    color: #78909f;
  }

  .alarm-list {
    display: grid;
    gap: 5px;
    width: 100%;
    max-width: 152px;
    font-size: 10px;
    color: #617a89;
  }

  .alarm-list div {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 6px;
  }

  .fault {
    background: #f35a65;
  }

  .alarm {
    background: #ff4f00;
  }

  .notice,
  .advice {
    background: #c8d4db;
  }

  .status-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 8px;
    flex: 1;
  }

  /* Status rows stretch evenly */
  .status-row {
    display: grid;
    grid-template-columns: 24px 1fr auto;
    align-items: center;
    gap: 8px;
    border-radius: 8px;
    border: 1px solid #edf2f5;
    padding: 10px 11px;
    color: #17324a;
    font-size: 14px;
    font-weight: 600;
    text-align: left;
    background: #fcfefe;
    flex: 1;
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  .status-row:hover {
    border-color: #c8d8e2;
    background: #f0f8fd;
  }

  .status-mark {
    font-size: 15px;
    line-height: 1;
  }

  .status-label {
    color: #4b5e6b;
    font-size: 13px;
  }

  .status-row b {
    font-size: 16px;
    font-weight: 400;
    color: #17324a;
  }

  .bottom-band {
    display: grid;
    grid-template-columns: 1fr 1fr 1.5fr;
    gap: 10px;
    align-items: stretch;
    min-height: 0;
  }

  .panel-head-simple {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .panel-head-simple span {
    font-size: 11px;
    color: #4b5e6b;
    font-weight: 600;
  }

  .daily-grid {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }

  .daily-row {
    display: grid;
    grid-template-columns: 20px 1fr;
    gap: 8px;
    align-items: center;
    flex: 1;
  }

  .daily-row em {
    font-style: normal;
    font-size: 15px;
    font-weight: 400;
    color: #ff4f00;
    text-align: center;
  }

  .daily-main {
    display: grid;
    gap: 5px;
  }

  .daily-line {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #3b5262;
  }

  .daily-line b {
    color: #17324a;
    font-weight: 400;
    font-size: 15px;
  }

  .bar {
    height: 6px;
    border-radius: 999px;
    background: #e9f0f3;
    overflow: hidden;
  }

  .bar span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #ff4f00 0%, #ff8040 100%);
    border-radius: 999px;
  }

  .panel-emission {
    background: linear-gradient(135deg, #ffffff 0%, #f3f9fc 100%);
  }

  .emission-grid {
    margin-top: 10px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    flex: 1;
  }

  .emission-item {
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-radius: 10px;
    border: 1px solid #e0eff5;
    background: linear-gradient(135deg, #f7fdff, #edf7fb);
    padding: 12px 10px;
    gap: 2px;
    transition: transform 0.15s ease;
  }

  .emission-item:hover {
    transform: translateY(-2px);
  }

  .emission-icon {
    font-size: 20px;
    margin-bottom: 4px;
    line-height: 1;
  }

  .emission-item strong {
    display: block;
    font-size: 22px;
    font-weight: 400;
    color: #17324a;
    letter-spacing: -0.02em;
  }

  .emission-item p {
    margin-top: 4px;
    font-size: 12px;
    font-weight: 600;
    color: #4b5e6b;
    line-height: 1.3;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  @media (min-width: 1024px) {
    .sidebar {
      transform: translateX(0);
    }
  }

  @media (max-width: 1360px) {
    .main-frame {
      grid-template-rows: 112px minmax(0, 1fr) 204px;
    }

    .top-band {
      grid-template-columns: 1fr;
    }

    .summary-grid {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }

    .revenue-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  @media (max-width: 1180px) {
    .frame-wrap {
      min-height: calc(100vh - 56px);
      overflow-y: auto;
    }

    .main-frame {
      height: auto;
      grid-template-rows: none;
      overflow: visible;
    }

    .middle-band,
    .bottom-band {
      grid-template-columns: 1fr;
    }

    .chart-box {
      height: 220px;
    }
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #dce4e9;
    border-radius: 4px;
  }
</style>



