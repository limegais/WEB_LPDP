<script lang="ts">
  import Chart from '$lib/components/Chart.svelte';

  let menuOpen = false;
  let activeRange = 'Day';

  const ranges = ['Day', 'Week', 'Month', 'Year', 'Total'];

  const navigation = [
    { label: 'Home', icon: '⌂', href: '/dashboard' },
    { label: 'Plants', icon: '▦', href: '/plant' },
    { label: 'Devices', icon: '▤', href: '/devices' },
    { label: 'Maintenance', icon: '⌁', href: '/maintenance' },
    { label: 'Reports', icon: '▧', href: '/report' },
    { label: 'Settings', icon: '⚙', href: '/settings' }
  ];

  const summaries = [
    { label: 'Yield today (MWh)', value: '7.83' },
    { label: 'Yield this month (MWh)', value: '169.93' },
    { label: 'Total yield (GWh)', value: '2.60' },
    { label: 'Real-time power (W)', value: '0' },
    { label: 'Installed power (MWp)', value: '3.69' }
  ];

  const revenue = [
    { label: 'Revenue today (IDR)', value: '8,176,669.87' },
    { label: 'This month (IDR)', value: '167,313,597.75' },
    { label: 'This year (IDR)', value: '2,145,032,276.78' },
    { label: 'Total revenue (IDR)', value: '2,540,321,913.90' }
  ];

  const plantStatuses = [
    { label: 'All plants', value: 17, icon: '▦', color: '#f28a1f' },
    { label: 'Following', value: 0, icon: '★', color: '#f7b12d' },
    { label: 'Normal', value: 13, icon: '●', color: '#19b89e' },
    { label: 'Abnormal', value: 1, icon: '!', color: '#f35a65' },
    { label: 'Offline', value: 3, icon: '◉', color: '#91a1aa' },
    { label: 'Commissioning', value: 0, icon: '↑', color: '#4a8be0' }
  ];

  const dailyPlants = [
    ['UNPAD (Student Center)', '3.46 h', '92%'],
    ['PT. Multi Kencana Niagatama', '3.34 h', '86%'],
    ['PLTS Dayung Camp', '3.08 h', '79%'],
    ['PLTS Malaka P01', '2.91 h', '74%'],
    ['UNPAD (Medical Faculty)', '2.79 h', '69%'],
    ['PT. Indolakto C3 - Cicurug', '2.78 h', '67%']
  ];

  const powerOption = {
    grid: { top: 20, right: 14, bottom: 26, left: 30 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:00'],
      axisLine: { lineStyle: { color: '#dce4e9' } },
      axisLabel: { color: '#7d909d', fontSize: 9 }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1.2,
      interval: 0.4,
      axisLabel: { color: '#7d909d', fontSize: 9 },
      splitLine: { lineStyle: { color: '#ebf0f3' } }
    },
    series: [
      {
        name: 'ESS active power',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#ff8a1e', width: 2 },
        data: [0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08]
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
          { value: 1, itemStyle: { color: '#f3b13c' } },
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
  <aside class:open={menuOpen} class="sidebar fixed inset-y-0 left-0 z-30 flex w-[72px] flex-col border-r border-[#e5ecef] bg-white">
    <div class="flex h-14 items-center justify-center border-b border-[#eef3f5] text-2xl text-[#ff991f]">☼</div>
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
      <p class="hidden text-[11px] text-[#5b7383] xl:block">Good evening, PT. RMS. Friday, 18 Sep 2026</p>
      <div class="ml-auto flex items-center gap-2">
        <span class="text-[10px] text-[#6b8493]">Updated: 19:42:30</span>
        <button class="icon-button" aria-label="Notifications">♧</button>
        <div class="grid h-8 w-8 place-items-center rounded-full bg-[#254563] text-[10px] font-bold text-white">R</div>
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
              </div>
            {/each}
          </div>
          <div class="revenue-grid">
            {#each revenue as item}
              <div class="metric-card metric-card--revenue">
                <p>{item.label}</p>
                <strong>{item.value}</strong>
              </div>
            {/each}
          </div>
        </div>

        <div class="middle-band">
          <article class="panel panel-chart">
            <div class="panel-head">
              <h2>ESS Active Power</h2>
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
            <div class="legend-line"><span></span>ESS active power</div>
          </article>

          <article class="panel panel-alarm">
            <h2>Fault Alarm</h2>
            <div class="alarm-body">
              <div class="alarm-ring">
                <Chart option={alarmOption} />
                <div class="alarm-center">
                  <strong>3</strong>
                  <span>Total</span>
                </div>
              </div>
              <div class="alarm-list">
                <div><i class="dot fault"></i>Fault <b>2</b></div>
                <div><i class="dot alarm"></i>Alarm <b>0</b></div>
                <div><i class="dot notice"></i>Notice <b>0</b></div>
                <div><i class="dot advice"></i>Advice <b>0</b></div>
              </div>
            </div>
          </article>

          <article class="panel panel-plant">
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
          <article class="panel panel-hours">
            <div class="panel-head-simple">
              <h2>Daily Equivalent Hours</h2>
              <span>Top 6</span>
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

          <article class="panel panel-emission">
            <h2>Emission Reduction</h2>
            <div class="emission-grid">
              <div>
                <strong>2,593.30</strong>
                <p>CO2 reduction (t)</p>
              </div>
              <div>
                <strong>1,050.85</strong>
                <p>Standard coal saved (t)</p>
              </div>
              <div>
                <strong>141,594</strong>
                <p>Equivalent trees planted</p>
              </div>
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

  .nav-button {
    display: flex;
    min-height: 49px;
    width: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    border-radius: 6px;
    color: #6e8492;
    font-size: 9px;
  }

  .nav-button:hover,
  .nav-button.current {
    background: #fff7ed;
    color: #fb8b20;
  }

  .nav-glyph {
    font-size: 17px;
    line-height: 17px;
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
    min-height: calc(100vh - 56px);
    padding: 8px 10px 10px;
    overflow: visible;
  }

  .main-frame {
    display: grid;
    grid-template-rows: auto auto auto;
    gap: 10px;
    height: auto;
    min-height: 0;
    border: 1px solid #e4ecef;
    border-radius: 14px;
    background: radial-gradient(circle at top right, #ffffff 0%, #f7fbfd 38%, #f2f7f9 100%);
    padding: 10px;
    overflow: visible;
  }

  .panel {
    border: 1px solid #e6edf0;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 8px 20px rgba(29, 66, 84, 0.04);
    overflow: hidden;
  }

  .top-band {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 8px;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    border: 1px solid #e6edf0;
    border-radius: 10px;
    background: #f9fbfc;
    overflow: hidden;
  }

  .revenue-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border: 1px solid #e6edf0;
    border-radius: 10px;
    background: #f9fbfc;
    overflow: hidden;
  }

  .metric-card {
    border-right: 1px solid #e6edf0;
    padding: 9px 11px;
  }

  .metric-card:last-child {
    border-right: 0;
  }

  .metric-card p {
    color: #7d909d;
    font-size: 9px;
    line-height: 1.2;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .metric-card strong {
    display: block;
    margin-top: 6px;
    font-size: 17px;
    line-height: 1.15;
    color: #17324a;
  }

  .metric-card--revenue strong {
    font-size: 14px;
  }

  .middle-band {
    display: grid;
    grid-template-columns: 1.5fr 0.75fr 0.75fr;
    gap: 8px;
  }

  .panel-chart,
  .panel-alarm,
  .panel-plant,
  .panel-hours,
  .panel-emission {
    padding: 11px;
  }

  .panel h2 {
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    color: #20394f;
    text-transform: uppercase;
    letter-spacing: 0.04em;
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
    padding: 4px 7px;
    color: #738a98;
    font-size: 9px;
    line-height: 1;
  }

  .control-group button.active {
    background: #fff;
    color: #1f3950;
    font-weight: 700;
  }

  .chart-date {
    display: flex;
    width: 140px;
    justify-content: space-between;
    margin: 8px auto 0;
    border-radius: 999px;
    background: #f3f8fa;
    padding: 3px 8px;
    color: #65808f;
    font-size: 9px;
  }

  .chart-box {
    height: 168px;
    margin-top: 4px;
  }

  .legend-line {
    display: flex;
    justify-content: center;
    gap: 6px;
    color: #6a8391;
    font-size: 9px;
    margin-top: 1px;
  }

  .legend-line span {
    height: 6px;
    width: 6px;
    margin-top: 3px;
    border-radius: 50%;
    background: #ff8a1e;
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
    background: #f3b13c;
  }

  .notice,
  .advice {
    background: #c8d4db;
  }

  .status-list {
    display: grid;
    gap: 6px;
    margin-top: 8px;
  }

  .status-row {
    display: grid;
    grid-template-columns: 16px 1fr auto;
    align-items: center;
    gap: 6px;
    border-radius: 6px;
    border: 1px solid #edf2f5;
    padding: 5px 7px;
    color: #2b4357;
    font-size: 10px;
    text-align: left;
    background: #fcfefe;
  }

  .status-row:hover {
    border-color: #d7e3ea;
    background: #f7fbfd;
  }

  .status-mark {
    font-size: 12px;
    line-height: 1;
  }

  .status-label {
    color: #607989;
  }

  .bottom-band {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 8px;
  }

  .panel-head-simple {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .panel-head-simple span {
    font-size: 10px;
    color: #7a919f;
  }

  .daily-grid {
    margin-top: 8px;
    display: grid;
    gap: 6px;
  }

  .daily-row {
    display: grid;
    grid-template-columns: 18px 1fr;
    gap: 6px;
    align-items: center;
  }

  .daily-row em {
    font-style: normal;
    font-size: 10px;
    color: #6a8391;
    text-align: center;
  }

  .daily-main {
    display: grid;
    gap: 3px;
  }

  .daily-line {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 10px;
    color: #5f7887;
  }

  .daily-line b {
    color: #29445a;
  }

  .bar {
    height: 4px;
    border-radius: 999px;
    background: #e9f0f3;
    overflow: hidden;
  }

  .bar span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #ffbe5f 0%, #ff8d1f 100%);
  }

  .panel-emission {
    background: linear-gradient(135deg, #ffffff 0%, #f3f9fc 100%);
  }

  .emission-grid {
    margin-top: 10px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .emission-grid div {
    border-radius: 8px;
    border: 1px solid #e7edf1;
    background: #fbfeff;
    padding: 10px;
  }

  .emission-grid strong {
    display: block;
    font-size: 16px;
    color: #183349;
  }

  .emission-grid p {
    margin-top: 4px;
    font-size: 10px;
    color: #6f8796;
    line-height: 1.25;
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
</style>
