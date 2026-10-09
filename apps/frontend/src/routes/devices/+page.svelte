<script lang="ts">
  let menuOpen = false;
  let activeMenu = 'Device list';
  let deviceStatusTab = 'All (2)';
  let deviceTypeTab = 'All';
  let faultTab = 'Pending';

  const deviceMenus = ['Device list', 'Fault list', 'Settings', 'Firmware update'];
  const statusTabs = ['All (2)', 'Normal (2)', 'Alarm (0)', 'Fault (0)', 'Offline (0)'];
  const typeTabs = ['All', 'Inverter', 'Meter', 'SCB'];

  const deviceRows = [
    {
      id: 'INV-001',
      name: 'Inverter SUN2000-100KTL',
      plant: 'PLTS Gedung 3 FT',
      type: 'Inverter',
      model: 'SUN2000-100KTL-M1',
      serial: '2102315678',
      power: '94.82 kW',
      yield: '2.67 MWh',
      pr: '81.2%',
      temp: '42 C',
      status: 'Normal',
      sColor: '#22c59a'
    },
    {
      id: 'MET-001',
      name: 'Smart Energy Meter #1',
      plant: 'PLTS di Indomaker',
      type: 'Meter',
      model: 'DTSU666-H',
      serial: '3300112201',
      power: '2.66 kW',
      yield: '11.00 kWh',
      pr: '-',
      temp: '-',
      status: 'Normal',
      sColor: '#22c59a'
    }
  ];

  const faultRows = [
    {
      alarm: 'Grid power outage',
      type: 'Fault',
      code: '10',
      plant: 'PLTS Gedung 3 FT',
      device: '82-ZEI-003B',
      model: 'SG50CX',
      time: '18/Sep/2026 06:17:11'
    },
    {
      alarm: 'Grid power outage',
      type: 'Fault',
      code: '10',
      plant: 'PLTS di Indomaker',
      device: '82-ZEI-003A',
      model: 'SG50CX',
      time: '18/Sep/2026 06:16:59'
    }
  ];

  const settingGroups = [
    {
      title: 'Protection threshold',
      items: [
        { name: 'Over-voltage trip', value: '264 V', unit: 'V' },
        { name: 'Under-voltage trip', value: '184 V', unit: 'V' },
        { name: 'Over-frequency trip', value: '51.5 Hz', unit: 'Hz' }
      ]
    },
    {
      title: 'Communication',
      items: [
        { name: 'Modbus polling interval', value: '5 s', unit: 's' },
        { name: 'Heartbeat timeout', value: '30 s', unit: 's' },
        { name: 'Retry attempts', value: '3', unit: 'times' }
      ]
    }
  ];

  const firmwareRows = [
    { deviceType: 'Inverter', currentVersion: 'v2.4.1', latestVersion: 'v2.5.0', package: 'INV-SG50CX-2.5.0.bin', status: 'Update available' },
    { deviceType: 'Meter', currentVersion: 'v1.9.0', latestVersion: 'v1.9.0', package: 'MET-DTSU666-1.9.0.bin', status: 'Up to date' },
    { deviceType: 'SCB', currentVersion: 'v3.1.2', latestVersion: 'v3.2.0', package: 'SCB-JSB16S-3.2.0.bin', status: 'Update available' }
  ];

  const navigation = [
    { label: 'Home', icon: '⌂', href: '/dashboard' },
    { label: 'Plant', icon: '▦', href: '/plant' },
    { label: 'Device', icon: '▤', href: '/devices' },
    { label: 'Maintenance', icon: '⌁', href: '/maintenance' },
    { label: 'Report', icon: '▧', href: '/report' },
    { label: 'System', icon: '⚙', href: '/settings' }
  ];
</script>

<svelte:head>
  <title>Device Management</title>
</svelte:head>

<div class="min-h-screen bg-[#f4f7f8] text-[#17324a]">
  <aside class:open={menuOpen} class="sidebar fixed inset-y-0 left-0 z-30 flex w-[72px] flex-col border-r border-[#0096d6] bg-[#00b7ff]">
    <div class="flex h-14 items-center justify-center border-b border-[#0096d6] text-2xl text-white font-bold">☼</div>
    <nav class="mt-2 flex flex-1 flex-col gap-1 px-2">
      {#each navigation as item}
        <a href={item.href} class:current={item.label === 'Device'} class="nav-button" title={item.label}>
          <span class="nav-glyph">{item.icon}</span>
          <span>{item.label}</span>
        </a>
      {/each}
    </nav>
    <a href="mailto:support@rms.co.id" class="nav-button mx-2 mb-3" title="Support">
      <span class="nav-glyph">?</span>
      <span>Support</span>
    </a>
  </aside>

  <main class="lg:pl-[72px]">
    <header class="flex h-14 items-center gap-3 border-b border-[#e9eef0] px-4 sm:px-7">
      <button class="icon-button lg:hidden" on:click={() => (menuOpen = !menuOpen)} aria-label="Open navigation">☰</button>
      <p class="hidden text-[11px] text-[#7e909d] sm:block">Good afternoon, <strong class="text-[#3b5062]">PT. RMS</strong></p>
      <span class="hidden text-[11px] text-[#7e909d] sm:block">Friday, 18 Sep 2026</span>
      <div class="ml-auto flex items-center gap-3">
        <label class="hidden h-8 w-52 items-center gap-2 rounded bg-white px-3 text-[#a8b5bd] sm:flex">
          <span>⌕</span>
          <input class="w-full bg-transparent text-[10px] outline-none" placeholder="Enter a keyword" />
        </label>
        <button class="icon-button relative" aria-label="Notifications">♧<span class="absolute -right-1 -top-1 grid h-3 w-3 place-items-center rounded-full bg-[#ff5361] text-[7px] text-white">3</span></button>
        <div class="grid h-8 w-8 place-items-center rounded-full bg-[#254563] text-[10px] font-bold text-white">R</div>
      </div>
    </header>

    <div class="mx-auto max-w-[1700px] px-3 py-4 sm:px-5">
      <section class="panel frame">
        <div class="menu-column">
          <h1>Device</h1>
          <div class="menu-stack">
            {#each deviceMenus as menu}
              <button class:menu-active={activeMenu === menu} class="menu-item" on:click={() => (activeMenu = menu)}>{menu}</button>
            {/each}
          </div>
        </div>

        <div class="content-column">
          {#if activeMenu === 'Device list'}
            <section class="content-section">
              <div class="section-head">
                <h2>Device list</h2>
                <button class="solid-btn" on:click={() => alert('Add device dialog is ready.')}>+ Add device</button>
              </div>
              <div class="tools-row">
                <label class="toolbar-input search"><span>⌕</span><input placeholder="Search device, serial number, or plant" /></label>
                <select class="toolbar-input"><option>All status</option></select>
                <select class="toolbar-input"><option>All plants</option></select>
                <select class="toolbar-input"><option>All models</option></select>
              </div>
              <div class="tabs-row">
                <div class="left-tabs">
                  {#each statusTabs as tab}
                    <button class:active-tab={deviceStatusTab === tab} class="tab" on:click={() => (deviceStatusTab = tab)}>{tab}</button>
                  {/each}
                </div>
                <div class="right-tabs">
                  {#each typeTabs as tab}
                    <button class:active-chip={deviceTypeTab === tab} class="chip" on:click={() => (deviceTypeTab = tab)}>{tab}</button>
                  {/each}
                </div>
              </div>

              <div class="table-wrap">
                <table class="w-full min-w-[1300px] text-left">
                  <thead>
                    <tr class="table-head-row">
                      <th>ID</th>
                      <th>Device name</th>
                      <th>Plant</th>
                      <th>Type</th>
                      <th>Model</th>
                      <th>Serial number</th>
                      <th>Power</th>
                      <th>Yield today</th>
                      <th>PR</th>
                      <th>Temperature</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each deviceRows as row}
                      <tr class="table-body-row">
                        <td class="font-semibold">{row.id}</td>
                        <td><div class="device-name"><span class="device-dot">⚡</span><span>{row.name}</span></div></td>
                        <td>{row.plant}</td>
                        <td><span class="type-pill">{row.type}</span></td>
                        <td>{row.model}</td>
                        <td>{row.serial}</td>
                        <td>{row.power}</td>
                        <td class="text-[#07a180]">{row.yield}</td>
                        <td>{row.pr}</td>
                        <td>{row.temp}</td>
                        <td><span class="status-pill" style={`--dot:${row.sColor}`}>{row.status}</span></td>
                        <td>
                          <button class="action-btn" on:click={() => alert(`Open detail for ${row.id}`)}>Detail</button>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </section>
          {:else if activeMenu === 'Fault list'}
            <section class="content-section">
              <div class="section-head">
                <h2>Fault list</h2>
                <div class="inline-tools">
                  <label class="refresh-box"><input type="checkbox" /> Refresh interval</label>
                  <select class="toolbar-input mini"><option>5 min</option></select>
                  <button class="ghost-btn" on:click={() => alert('Batch disable queued.')}>Batch disable</button>
                </div>
              </div>

              <div class="fault-top-tabs">
                <button class:active-fault-tab={faultTab === 'Pending'} class="fault-tab" on:click={() => (faultTab = 'Pending')}>Pending</button>
                <button class:active-fault-tab={faultTab === 'Resolved'} class="fault-tab" on:click={() => (faultTab = 'Resolved')}>Resolved</button>
              </div>

              <div class="tools-row">
                <select class="toolbar-input"><option>Please select</option></select>
                <input class="toolbar-input" placeholder="Alarm name" />
                <input class="toolbar-input" placeholder="Fault code" />
                <button class="ghost-btn" on:click={() => alert('Fault filter applied.')}>Search</button>
                <button class="ghost-btn" on:click={() => alert('Advanced filter panel opened.')}>Filter</button>
              </div>

              <div class="table-wrap">
                <table class="w-full min-w-[1250px] text-left">
                  <thead>
                    <tr class="table-head-row">
                      <th><input type="checkbox" /></th>
                      <th>Alarm name</th>
                      <th>Alarm type</th>
                      <th>Fault code</th>
                      <th>Plant name</th>
                      <th>Device name</th>
                      <th>Device model</th>
                      <th>Occurrence time</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each faultRows as row}
                      <tr class="table-body-row">
                        <td><input type="checkbox" /></td>
                        <td>{row.alarm}</td>
                        <td><span class="fault-pill">⚠ Fault</span></td>
                        <td>{row.code}</td>
                        <td>{row.plant}</td>
                        <td>{row.device}</td>
                        <td>{row.model}</td>
                        <td>{row.time}</td>
                        <td><button class="action-btn" on:click={() => alert('Fault detail opened.')}>View</button></td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </section>
          {:else if activeMenu === 'Settings'}
            <section class="content-section">
              <div class="section-head">
                <h2>Settings</h2>
                <button class="solid-btn" on:click={() => alert('Settings saved successfully.')}>Save all</button>
              </div>

              <div class="settings-grid">
                {#each settingGroups as group}
                  <article class="settings-card">
                    <h3>{group.title}</h3>
                    <div class="settings-list">
                      {#each group.items as item}
                        <label class="settings-row">
                          <span>{item.name}</span>
                          <div>
                            <input value={item.value} />
                            <small>{item.unit}</small>
                          </div>
                        </label>
                      {/each}
                    </div>
                  </article>
                {/each}
              </div>

              <div class="toggle-row">
                <label><input type="checkbox" checked /> Email alert for fault</label>
                <label><input type="checkbox" checked /> Auto reconnect communication</label>
                <label><input type="checkbox" /> Lock remote write command</label>
              </div>
            </section>
          {:else}
            <section class="content-section">
              <div class="section-head">
                <h2>Firmware update</h2>
                <button class="solid-btn" on:click={() => alert('Bulk firmware update started.')}>Start bulk update</button>
              </div>

              <div class="firmware-upload">
                <div>
                  <h3>Upload package</h3>
                  <p>Upload signed firmware package before deployment.</p>
                </div>
                <button class="ghost-btn" on:click={() => alert('Package upload dialog is ready.')}>Upload .bin package</button>
              </div>

              <div class="table-wrap">
                <table class="w-full min-w-[980px] text-left">
                  <thead>
                    <tr class="table-head-row">
                      <th>Device type</th>
                      <th>Current version</th>
                      <th>Latest version</th>
                      <th>Package</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each firmwareRows as row}
                      <tr class="table-body-row">
                        <td>{row.deviceType}</td>
                        <td>{row.currentVersion}</td>
                        <td>{row.latestVersion}</td>
                        <td>{row.package}</td>
                        <td>
                          <span class:ok-pill={row.status === 'Up to date'} class:warn-pill={row.status !== 'Up to date'}>
                            {row.status}
                          </span>
                        </td>
                        <td>
                          <button class="action-btn" on:click={() => alert(`${row.deviceType} update started.`)}>Update now</button>
                        </td>
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

  .nav-button { display: flex; min-height: 54px; width: 100%; flex-direction: column; align-items: center; justify-content: center; gap: 4px; border-radius: 8px; color: rgba(255, 255, 255, 0.7); font-size: 11px; font-weight: 600; }

  .nav-button:hover, .nav-button.current { background: rgba(0, 0, 0, 0.15); color: #ffffff; }

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
    grid-template-columns: 180px minmax(0, 1fr);
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
  }

  .tools-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .toolbar-input {
    height: 36px;
    min-width: 150px;
    border: 1px solid #e4edf2;
    border-radius: 8px;
    padding: 0 10px;
    color: #4e6678;
    font-size: 12px;
    background: #f9fcfd;
  }

  .toolbar-input.search {
    display: flex;
    align-items: center;
    min-width: 290px;
    gap: 8px;
  }

  .toolbar-input.search input {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    color: #2f4a5e;
    font-size: 12px;
  }

  .toolbar-input.mini {
    min-width: 90px;
    height: 32px;
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

  .tabs-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .left-tabs,
  .right-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tab {
    border-radius: 8px;
    border: 1px solid #e4edf2;
    padding: 6px 10px;
    font-size: 11px;
    color: #6e8594;
    background: #ffffff;
  }

  .tab.active-tab {
    border-color: #cfe2f6;
    background: #edf5ff;
    color: #1f3a52;
    font-weight: 700;
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

  .device-name {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .device-dot {
    display: inline-grid;
    height: 20px;
    width: 20px;
    place-items: center;
    border-radius: 5px;
    background: #fff5e8;
    color: #ff4f00;
    font-size: 12px;
  }

  .type-pill {
    display: inline-flex;
    border-radius: 5px;
    padding: 2px 6px;
    font-size: 10px;
    color: #6d8493;
    background: #f2f7f9;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #607b8f;
  }

  .status-pill::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: var(--dot);
  }

  .inline-tools {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .refresh-box {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #6c8392;
  }

  .fault-top-tabs {
    display: flex;
    gap: 8px;
    border-bottom: 1px solid #eaf0f2;
    padding-bottom: 8px;
  }

  .fault-tab {
    border-radius: 8px;
    border: 1px solid transparent;
    padding: 6px 12px;
    color: #6d8493;
    background: transparent;
    font-size: 12px;
  }

  .fault-tab.active-fault-tab {
    border-color: #d5e5f3;
    background: #eef6ff;
    color: #1f3a52;
    font-weight: 700;
  }

  .fault-pill {
    display: inline-flex;
    border-radius: 999px;
    padding: 3px 8px;
    font-size: 10px;
    color: #cc4f5b;
    background: #fff1f3;
  }

  .settings-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .settings-card {
    border: 1px solid #e7edf1;
    border-radius: 10px;
    padding: 12px;
    background: #fbfeff;
  }

  .settings-card h3 {
    margin: 0;
    font-size: 14px;
    color: #1f3a52;
  }

  .settings-list {
    margin-top: 10px;
    display: grid;
    gap: 8px;
  }

  .settings-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 12px;
    color: #5f7787;
  }

  .settings-row input {
    width: 120px;
    height: 31px;
    border: 1px solid #dfe9ef;
    border-radius: 7px;
    padding: 0 9px;
    font-size: 12px;
    color: #2d465a;
    background: #ffffff;
  }

  .settings-row small {
    margin-left: 6px;
    color: #7a8f9d;
  }

  .toggle-row {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    border: 1px solid #e7edf1;
    border-radius: 10px;
    background: #fbfeff;
    padding: 10px;
    font-size: 12px;
    color: #5f7787;
  }

  .toggle-row label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .firmware-upload {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    border: 1px solid #e7edf1;
    border-radius: 10px;
    background: #fbfeff;
    padding: 12px;
  }

  .firmware-upload h3 {
    margin: 0;
    font-size: 14px;
    color: #1f3a52;
  }

  .firmware-upload p {
    margin: 3px 0 0;
    font-size: 12px;
    color: #6f8796;
  }

  .ok-pill,
  .warn-pill {
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

  @media (min-width: 1024px) {
    .sidebar {
      transform: translateX(0);
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

    .settings-grid {
      grid-template-columns: 1fr;
    }
  }
</style>



