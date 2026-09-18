<script lang="ts">
  import Chart from '$lib/components/Chart.svelte';

  let menuOpen = false;
  let activeMenu = 'Curve';
  let curveRange = 'Day';
  let liveAutoRefresh = true;

  const menus = ['Curve', 'Remote maintenance', 'Live data', 'Fault response plan'];
  const ranges = ['Day', 'Week', 'Month', 'Year'];

  const kpi = [
    { label: 'Active sessions', value: '14', tone: '#2a8bf2' },
    { label: 'Remote actions today', value: '39', tone: '#22b894' },
    { label: 'Open faults', value: '5', tone: '#ff8f1f' },
    { label: 'SLA compliance', value: '98.1%', tone: '#6f7ef7' }
  ];

  const curveOption = {
    grid: { top: 20, right: 16, bottom: 32, left: 36 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:00'],
      axisLabel: { color: '#7790a0', fontSize: 10 },
      axisLine: { lineStyle: { color: '#dce7ed' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#7790a0', fontSize: 10 },
      splitLine: { lineStyle: { color: '#ebf1f5' } }
    },
    series: [
      {
        name: 'Power output',
        type: 'line',
        smooth: true,
        lineStyle: { color: '#2a8bf2', width: 2 },
        showSymbol: false,
        data: [0.12, 0.29, 0.84, 1.12, 1.01, 0.66, 0.24]
      },
      {
        name: 'Reference profile',
        type: 'line',
        smooth: true,
        lineStyle: { color: '#ff9b2f', width: 2, type: 'dashed' },
        showSymbol: false,
        data: [0.1, 0.31, 0.88, 1.2, 1.08, 0.69, 0.21]
      }
    ]
  };

  const curveRows = [
    { plant: 'PT. Indolakto C3 - Cicurug', peak: '1.12 MW', sunrise: '05:49', sunset: '17:52', variance: '+3.2%' },
    { plant: 'PLTS Sumpal Camps', peak: '0.87 MW', sunrise: '05:48', sunset: '17:51', variance: '-1.1%' },
    { plant: 'PT. Bogasari Flour Mills', peak: '0.73 MW', sunrise: '05:47', sunset: '17:51', variance: '+2.4%' }
  ];

  const remoteRows = [
    { device: '82-ZEI-003B', plant: 'PLTS Sumpal Camps', status: 'Online', mode: 'Read/Write', latency: '122 ms', updated: '18/Sep/2026 19:34' },
    { device: 'INV-003', plant: 'PT. Indolakto C3', status: 'Online', mode: 'Read only', latency: '98 ms', updated: '18/Sep/2026 19:35' },
    { device: 'SCB-003', plant: 'PT. Multi Kencana', status: 'Offline', mode: 'Locked', latency: '-', updated: '18/Sep/2026 18:58' }
  ];

  const liveRows = [
    { timestamp: '19:42:21', tag: 'INV-001.P_AC', value: '94.82', unit: 'kW', quality: 'Good' },
    { timestamp: '19:42:21', tag: 'INV-001.V_AC', value: '389.10', unit: 'V', quality: 'Good' },
    { timestamp: '19:42:20', tag: 'MET-001.E_DAY', value: '11.00', unit: 'kWh', quality: 'Good' },
    { timestamp: '19:42:19', tag: 'SCB-003.T_BOX', value: '58.00', unit: 'C', quality: 'Warning' },
    { timestamp: '19:42:18', tag: 'INV-003.ALARM_CODE', value: '10', unit: '-', quality: 'Alarm' }
  ];

  const responsePlans = [
    {
      severity: 'Critical',
      trigger: 'Grid outage > 5 minutes',
      sla: '10 min',
      action: 'Switch to islanding mode, notify supervisor, dispatch field team',
      owner: 'NOC Team'
    },
    {
      severity: 'High',
      trigger: 'Inverter communication loss',
      sla: '30 min',
      action: 'Run remote ping/reset, escalate to on-site technician if failed',
      owner: 'Remote Ops'
    },
    {
      severity: 'Medium',
      trigger: 'Abnormal temperature trend',
      sla: '2 hours',
      action: 'Apply derating profile and create preventive maintenance ticket',
      owner: 'Maintenance Lead'
    }
  ];
</script>

<svelte:head>
  <title>Maintenance Center</title>
</svelte:head>

<div class="min-h-screen bg-[#f4f7f8] text-[#17324a]">
  <aside class:open={menuOpen} class="sidebar fixed inset-y-0 left-0 z-30 flex w-[72px] flex-col border-r border-[#e5ecef] bg-white">
    <div class="flex h-14 items-center justify-center border-b border-[#f0f2f4] text-2xl text-[#ff991f]">☼</div>
    <nav class="mt-2 flex flex-1 flex-col gap-1 px-2">
      <a href="/dashboard" class="nav-button"><span class="nav-glyph">⌂</span><span>Home</span></a>
      <a href="/plant" class="nav-button"><span class="nav-glyph">▦</span><span>Plant</span></a>
      <a href="/devices" class="nav-button"><span class="nav-glyph">▤</span><span>Device</span></a>
      <a href="/maintenance" class="nav-button current"><span class="nav-glyph">⌁</span><span>Maintenance</span></a>
      <a href="/report" class="nav-button"><span class="nav-glyph">▧</span><span>Report</span></a>
      <a href="/settings" class="nav-button"><span class="nav-glyph">⚙</span><span>System</span></a>
    </nav>
    <a href="/support" class="nav-button mb-3 mx-2"><span class="nav-glyph">?</span><span>Support</span></a>
  </aside>

  <main class="lg:pl-[72px]">
    <header class="flex h-14 items-center gap-3 border-b border-[#e9eef0] px-4 sm:px-7">
      <button class="icon-button lg:hidden" on:click={() => (menuOpen = !menuOpen)} aria-label="Open navigation">☰</button>
      <p class="hidden text-[11px] text-[#7e909d] sm:block">Good afternoon, <strong class="text-[#3b5062]">PT. RMS</strong></p>
      <span class="hidden text-[11px] text-[#7e909d] sm:block">Friday, 18 Sep 2026</span>
      <div class="ml-auto flex items-center gap-3">
        <label class="hidden h-8 w-52 items-center gap-2 rounded bg-white px-3 text-[#a8b5bd] sm:flex"><span>⌕</span><input class="w-full bg-transparent text-[10px] outline-none" placeholder="Enter a keyword" /></label>
        <button class="icon-button relative" aria-label="Notifications">♧<span class="absolute -right-1 -top-1 grid h-3 w-3 place-items-center rounded-full bg-[#ff5361] text-[7px] text-white">3</span></button>
        <div class="grid h-8 w-8 place-items-center rounded-full bg-[#254563] text-[10px] font-bold text-white">R</div>
      </div>
    </header>

    <div class="mx-auto max-w-[1700px] px-3 py-4 sm:px-5">
      <section class="panel frame">
        <div class="menu-column">
          <h1>Maintenance</h1>
          <div class="menu-stack">
            {#each menus as menu}
              <button class:menu-active={activeMenu === menu} class="menu-item" on:click={() => (activeMenu = menu)}>{menu}</button>
            {/each}
          </div>
        </div>

        <div class="content-column">
          <div class="kpi-row">
            {#each kpi as item}
              <article class="kpi-card">
                <p>{item.label}</p>
                <strong style={`color:${item.tone}`}>{item.value}</strong>
              </article>
            {/each}
          </div>

          {#if activeMenu === 'Curve'}
            <section class="content-section">
              <div class="section-head">
                <h2>Curve</h2>
                <div class="inline-tools">
                  <div class="chips">
                    {#each ranges as range}
                      <button class:active-chip={curveRange === range} class="chip" on:click={() => (curveRange = range)}>{range}</button>
                    {/each}
                  </div>
                  <button class="solid-btn" on:click={() => alert('Curve data exported.')}>Export chart</button>
                </div>
              </div>

              <article class="chart-card">
                <div class="chart-box"><Chart option={curveOption} /></div>
              </article>

              <div class="table-wrap">
                <table class="w-full min-w-[900px] text-left">
                  <thead>
                    <tr class="table-head-row">
                      <th>Plant</th>
                      <th>Peak power</th>
                      <th>Sunrise</th>
                      <th>Sunset</th>
                      <th>Profile variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each curveRows as row}
                      <tr class="table-body-row">
                        <td>{row.plant}</td>
                        <td>{row.peak}</td>
                        <td>{row.sunrise}</td>
                        <td>{row.sunset}</td>
                        <td>{row.variance}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </section>
          {:else if activeMenu === 'Remote maintenance'}
            <section class="content-section">
              <div class="section-head">
                <h2>Remote maintenance</h2>
                <div class="inline-tools">
                  <button class="ghost-btn" on:click={() => alert('Session audit log opened.')}>Session logs</button>
                  <button class="solid-btn" on:click={() => alert('New remote session initialized.')}>Start session</button>
                </div>
              </div>

              <div class="tools-row">
                <select class="toolbar-input"><option>All plants</option></select>
                <select class="toolbar-input"><option>All statuses</option></select>
                <input class="toolbar-input" placeholder="Search by device ID" />
              </div>

              <div class="table-wrap">
                <table class="w-full min-w-[980px] text-left">
                  <thead>
                    <tr class="table-head-row">
                      <th>Device</th>
                      <th>Plant</th>
                      <th>Connection status</th>
                      <th>Permission mode</th>
                      <th>Latency</th>
                      <th>Last update</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each remoteRows as row}
                      <tr class="table-body-row">
                        <td>{row.device}</td>
                        <td>{row.plant}</td>
                        <td><span class:ok-pill={row.status === 'Online'} class:bad-pill={row.status !== 'Online'}>{row.status}</span></td>
                        <td>{row.mode}</td>
                        <td>{row.latency}</td>
                        <td>{row.updated}</td>
                        <td>
                          <div class="action-pack">
                            <button class="action-btn" on:click={() => alert(`Open terminal for ${row.device}`)}>Connect</button>
                            <button class="action-btn" on:click={() => alert(`Reboot command sent to ${row.device}`)}>Reboot</button>
                          </div>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </section>
          {:else if activeMenu === 'Live data'}
            <section class="content-section">
              <div class="section-head">
                <h2>Live data</h2>
                <div class="inline-tools">
                  <label class="refresh-box">
                    <input type="checkbox" bind:checked={liveAutoRefresh} />
                    Auto refresh (2s)
                  </label>
                  <button class="ghost-btn" on:click={() => alert('Live stream paused.')}>Pause stream</button>
                </div>
              </div>

              <div class="tools-row">
                <select class="toolbar-input"><option>Plant: All</option></select>
                <select class="toolbar-input"><option>Device: All</option></select>
                <select class="toolbar-input"><option>Quality: All</option></select>
                <input class="toolbar-input" placeholder="Search tag" />
              </div>

              <div class="table-wrap">
                <table class="w-full min-w-[900px] text-left">
                  <thead>
                    <tr class="table-head-row">
                      <th>Timestamp</th>
                      <th>Tag</th>
                      <th>Value</th>
                      <th>Unit</th>
                      <th>Quality</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each liveRows as row}
                      <tr class="table-body-row">
                        <td>{row.timestamp}</td>
                        <td>{row.tag}</td>
                        <td>{row.value}</td>
                        <td>{row.unit}</td>
                        <td>
                          <span class:ok-pill={row.quality === 'Good'} class:warn-pill={row.quality === 'Warning'} class:bad-pill={row.quality === 'Alarm'}>
                            {row.quality}
                          </span>
                        </td>
                        <td><button class="action-btn" on:click={() => alert(`Trend opened for ${row.tag}`)}>View trend</button></td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </section>
          {:else}
            <section class="content-section">
              <div class="section-head">
                <h2>Fault response plan</h2>
                <button class="solid-btn" on:click={() => alert('New response plan form opened.')}>+ Add plan</button>
              </div>

              <div class="table-wrap">
                <table class="w-full min-w-[1080px] text-left">
                  <thead>
                    <tr class="table-head-row">
                      <th>Severity</th>
                      <th>Trigger condition</th>
                      <th>SLA</th>
                      <th>Response playbook</th>
                      <th>Owner</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each responsePlans as row}
                      <tr class="table-body-row">
                        <td>
                          <span class:critical-pill={row.severity === 'Critical'} class:high-pill={row.severity === 'High'} class:medium-pill={row.severity === 'Medium'}>
                            {row.severity}
                          </span>
                        </td>
                        <td>{row.trigger}</td>
                        <td>{row.sla}</td>
                        <td>{row.action}</td>
                        <td>{row.owner}</td>
                        <td><button class="action-btn" on:click={() => alert('Plan editor opened.')}>Edit</button></td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </section>
          {/if}
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
    border-radius: 5px;
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
    border-radius: 5px;
    color: #6c8190;
  }

  .icon-button:hover {
    background: #edf3f4;
  }

  .panel {
    border: 1px solid #e8edef;
    border-radius: 12px;
    background: #ffffff;
  }

  .frame {
    display: grid;
    grid-template-columns: 200px minmax(0, 1fr);
    min-height: calc(100vh - 130px);
    overflow: hidden;
  }

  .menu-column {
    border-right: 1px solid #eaf0f2;
    padding: 18px 12px;
    background: linear-gradient(180deg, #fcfefe 0%, #f5f9fb 100%);
  }

  .menu-column h1 {
    margin: 0;
    font-size: 20px;
    color: #1f3a52;
  }

  .menu-stack {
    margin-top: 16px;
    display: grid;
    gap: 6px;
  }

  .menu-item {
    text-align: left;
    border-radius: 8px;
    border: 1px solid transparent;
    padding: 9px 10px;
    font-size: 12px;
    color: #617888;
    background: transparent;
  }

  .menu-item:hover {
    background: #f3f8fb;
    border-color: #e3edf3;
  }

  .menu-item.menu-active {
    background: #edf5ff;
    border-color: #cfe2f6;
    color: #1c476c;
    font-weight: 700;
  }

  .content-column {
    padding: 14px;
    display: grid;
    gap: 12px;
  }

  .kpi-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .kpi-card {
    border: 1px solid #e8eff3;
    border-radius: 10px;
    background: #fbfdff;
    padding: 10px;
  }

  .kpi-card p {
    margin: 0;
    font-size: 11px;
    color: #708796;
  }

  .kpi-card strong {
    display: block;
    margin-top: 6px;
    font-size: 20px;
  }

  .content-section {
    display: grid;
    gap: 12px;
  }

  .section-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .section-head h2 {
    margin: 0;
    font-size: 20px;
    color: #1f3a52;
    text-transform: capitalize;
  }

  .inline-tools,
  .tools-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .toolbar-input {
    height: 36px;
    min-width: 160px;
    border: 1px solid #e4edf2;
    border-radius: 8px;
    padding: 0 10px;
    color: #4e6678;
    font-size: 12px;
    background: #f9fcfd;
  }

  .solid-btn,
  .ghost-btn,
  .action-btn {
    height: 34px;
    border-radius: 8px;
    padding: 0 12px;
    font-size: 12px;
  }

  .solid-btn {
    border: 1px solid #1f3a52;
    color: #ffffff;
    background: #1f3a52;
  }

  .ghost-btn,
  .action-btn {
    border: 1px solid #d6e3ea;
    color: #4e6a7d;
    background: #ffffff;
  }

  .chips {
    display: inline-flex;
    gap: 6px;
  }

  .chip {
    border-radius: 999px;
    border: 1px solid #dde8ef;
    padding: 5px 10px;
    font-size: 11px;
    color: #6c8392;
    background: #f7fbfd;
  }

  .chip.active-chip {
    border-color: #1f3a52;
    background: #1f3a52;
    color: #ffffff;
  }

  .chart-card {
    border: 1px solid #e8eff3;
    border-radius: 10px;
    background: #ffffff;
    padding: 8px;
  }

  .chart-box {
    height: 260px;
  }

  .table-wrap {
    overflow-x: auto;
    border: 1px solid #e9eff2;
    border-radius: 10px;
    background: #ffffff;
  }

  table th,
  table td {
    padding: 10px 12px;
    font-size: 12px;
    white-space: nowrap;
  }

  .table-head-row {
    border-bottom: 1px solid #eaf1f4;
    background: #fbfdfe;
    color: #708594;
  }

  .table-body-row {
    border-bottom: 1px solid #eef3f5;
    color: #2a4257;
  }

  .action-pack {
    display: inline-flex;
    gap: 6px;
  }

  .refresh-box {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #688090;
    font-size: 12px;
  }

  .ok-pill,
  .warn-pill,
  .bad-pill,
  .critical-pill,
  .high-pill,
  .medium-pill {
    display: inline-flex;
    border-radius: 999px;
    padding: 3px 8px;
    font-size: 10px;
  }

  .ok-pill {
    color: #1c8a63;
    background: #edf9f3;
  }

  .warn-pill {
    color: #c56f16;
    background: #fff7ea;
  }

  .bad-pill,
  .critical-pill {
    color: #be4a55;
    background: #fff0f2;
  }

  .high-pill {
    color: #ad6a1f;
    background: #fff5e8;
  }

  .medium-pill {
    color: #4e6ea2;
    background: #eef4ff;
  }

  @media (min-width: 1024px) {
    .sidebar {
      transform: translateX(0);
    }
  }

  @media (max-width: 1280px) {
    .kpi-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 1140px) {
    .frame {
      grid-template-columns: 1fr;
    }

    .menu-column {
      border-right: 0;
      border-bottom: 1px solid #eaf0f2;
    }

    .menu-stack {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
