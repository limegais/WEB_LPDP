<script lang="ts">
  // ==========================================
  // RESS PLANT MANAGEMENT - ENTERPRISE VIEW
  // ==========================================
  console.log("Plant page loaded - layout v3 synced");
  let menuOpen = false;
  let activeTab = "All (2)";

  // Filter States
  let plantNameFilter = "";
  let countryFilter = "";
  let deviceTypeFilter = "All";
  let deviceSnFilter = "";
  let isExpanded = false;
  let showAddModal = false;

  // Sorting
  let sortField: "status" | "name" | "capacity" | "power" | "yieldToday" | "totalYield" | "pr" = "name";
  let sortAsc = true;

  // Toast
  let toastMessage = "";
  let toastTimer: ReturnType<typeof setTimeout> | null = null;
  function showToast(msg: string) {
    toastMessage = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastMessage = ""; }, 2600);
  }

  // 2 Synchronized Real Plants
  interface SynchronizedPlant {
    id: string;
    name: string;
    location: string;
    status: "Normal" | "Fault" | "Offline";
    statusColor: string;
    image: string;
    gridDate: string;
    capacity: number; // kWp
    capacityStr: string;
    optimizerQty: string;
    hasBattery: boolean;
    currentPower: number; // kW
    specificEnergy: number; // kWh/kWp
    yieldToday: number; // kWh
    totalYield: number; // kWh
    totalYieldStr: string;
    pr: number; // %
  }

  const plants: SynchronizedPlant[] = [
    {
      id: "PL-01",
      name: "PLTS Gedung 3 FT",
      location: "Jakarta, Indonesia",
      status: "Normal",
      statusColor: "#10b981",
      image: "/images/solar-rooftop-thumb.jpg",
      gridDate: "2023-02-15",
      capacity: 123.120,
      capacityStr: "123.120",
      optimizerQty: "--",
      hasBattery: false,
      currentPower: 64.52,
      specificEnergy: 4.60,
      yieldToday: 11.00,
      totalYield: 350260.00,
      totalYieldStr: "350,260.00",
      pr: 80.84,
    },
    {
      id: "PL-02",
      name: "PLTS di Indomaker",
      location: "Jakarta, Indonesia",
      status: "Normal",
      statusColor: "#10b981",
      image: "/images/solar-rooftop-thumb.jpg",
      gridDate: "2023-08-20",
      capacity: 86.400,
      capacityStr: "86.400",
      optimizerQty: "--",
      hasBattery: false,
      currentPower: 2.66,
      specificEnergy: 4.37,
      yieldToday: 11.00,
      totalYield: 534450.00,
      totalYieldStr: "534,450.00",
      pr: 75.00,
    },
  ];

  // Filtering & Sorting
  $: filteredPlants = plants
    .filter((p) => {
      if (activeTab === "Normal (2)" && p.status !== "Normal") return false;
      if (activeTab === "Fault (0)" && p.status !== "Fault") return false;
      if (activeTab === "Offline (0)" && p.status !== "Offline") return false;
      if (activeTab === "Following (0)") return false;
      if (plantNameFilter && !p.name.toLowerCase().includes(plantNameFilter.toLowerCase())) return false;
      if (countryFilter && !p.location.toLowerCase().includes(countryFilter.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let diff = 0;
      if (sortField === "name") diff = a.name.localeCompare(b.name);
      else if (sortField === "status") diff = a.status.localeCompare(b.status);
      else if (sortField === "capacity") diff = a.capacity - b.capacity;
      else if (sortField === "power") diff = a.currentPower - b.currentPower;
      else if (sortField === "yieldToday") diff = a.yieldToday - b.yieldToday;
      else if (sortField === "totalYield") diff = a.totalYield - b.totalYield;
      else if (sortField === "pr") diff = a.pr - b.pr;
      return sortAsc ? diff : -diff;
    });

  function toggleSort(field: typeof sortField) {
    if (sortField === field) {
      sortAsc = !sortAsc;
    } else {
      sortField = field;
      sortAsc = true;
    }
  }

  function handleReset() {
    plantNameFilter = "";
    countryFilter = "";
    deviceTypeFilter = "All";
    deviceSnFilter = "";
    activeTab = "All (2)";
    showToast("Filter berhasil direset.");
  }

  // Add Plant Modal Form
  let newName = "";
  let newCap = "";
  let newLocation = "Jakarta, Indonesia";

  function submitAddPlant() {
    if (!newName) {
      alert("Mohon masukkan nama plant.");
      return;
    }
    showToast(`Plant "${newName}" berhasil ditambahkan.`);
    showAddModal = false;
    newName = "";
    newCap = "";
  }
</script>

<svelte:head>
  <title>Plant Management | RESS</title>
</svelte:head>

<!-- ========================================== -->
<!-- GLOBAL APPLICATION LAYOUT (UNTOUCHED)      -->
<!-- ========================================== -->
<div class="min-h-screen bg-[#f4f7f8] text-[#17324a]">
  <!-- Left Navigation Sidebar -->
  <aside
    class:open={menuOpen}
    class="sidebar fixed inset-y-0 left-0 z-30 flex w-[72px] flex-col border-r border-[#0096d6] bg-[#00b7ff]"
  >
    <div
      class="flex h-14 items-center justify-center border-b border-[#0096d6] text-2xl text-white font-bold"
    >
      ☼
    </div>
    <nav class="mt-2 flex flex-1 flex-col gap-1 px-2">
      <a href="/dashboard" class="nav-button" title="Home"
        ><span class="nav-glyph">⌂</span><span>Home</span></a
      >
      <a href="/plant" class="nav-button current" title="Plants"
        ><span class="nav-glyph">▦</span><span>Plants</span></a
      >
      <a href="/devices" class="nav-button" title="Devices"
        ><span class="nav-glyph">▤</span><span>Devices</span></a
      >
      <a href="/maintenance" class="nav-button" title="Maintenance"
        ><span class="nav-glyph">⌁</span><span>Maintenance</span></a
      >
      <a href="/report" class="nav-button" title="Report"
        ><span class="nav-glyph">▧</span><span>Report</span></a
      >
      <a href="/settings" class="nav-button" title="System"
        ><span class="nav-glyph">⚙</span><span>System</span></a
      >
    </nav>
  </aside>

  <!-- Main Content Area -->
  <main class="min-h-screen lg:pl-[72px]">
    <!-- Top Bar -->
    <header class="flex items-center gap-3 px-4 sm:px-7 h-14 border-b border-[#ebf0f2] bg-white">
      <button
        class="icon-button lg:hidden"
        on:click={() => (menuOpen = !menuOpen)}
        aria-label="Open navigation">☰</button
      >
      <p class="hidden text-[11px] text-[#7e909d] sm:block">
        Good afternoon, <strong class="text-[#3b5062]">PT. RMS</strong>
      </p>
      <span class="hidden text-[11px] text-[#7e909d] sm:block"
        >Friday, 18 Sep 2026</span
      >
      <div class="ml-auto flex items-center gap-3">
        <label
          class="hidden h-8 w-52 items-center gap-2 rounded bg-[#f4f7f8] px-3 text-[#a8b5bd] sm:flex border border-[#e2e8f0]"
        >
          <span>⌕</span>
          <input
            class="w-full bg-transparent text-[11px] outline-none text-[#334155]"
            placeholder="Search plants or devices"
            bind:value={plantNameFilter}
          />
        </label>
        <button class="icon-button relative" aria-label="Notifications"
          >♧<span
            class="absolute -right-1 -top-1 grid h-3 w-3 place-items-center rounded-full bg-[#ff5361] text-[7px] text-white"
            >3</span
          ></button
        >
        <div
          class="grid h-8 w-8 place-items-center rounded-full bg-[#254563] text-[10px] font-bold text-white shadow-sm"
        >
          R
        </div>
      </div>
    </header>

    <!-- Page Body Container -->
    <div
      class="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-[1680px] flex-col px-4 pb-8 sm:px-6 pt-4"
    >
      <!-- Page Title Section (Untouched) -->
      <section class="mb-4 shrink-0">
        <p class="eyebrow">Plant Management</p>
        <h1 class="mt-1 text-[34px] leading-[1.1] font-semibold text-[#1f3a52]">
          Plant list
        </h1>
        <p class="mt-1.5 text-sm text-[#748998]">
          Manage and monitor all your renewable energy installations.
        </p>
      </section>

      <!-- ========================================== -->
      <!-- THE WHITE CONTAINER (.panel) - UPGRADED    -->
      <!-- ========================================== -->
      <section class="panel flex flex-1 flex-col overflow-hidden bg-white shadow-sm">
        
        <!-- Top Filter Bar matching Reference -->
        <div class="filter-toolbar-container">
          <div class="filter-inputs-row">
            <!-- Plant name -->
            <label class="input-labeled">
              <span class="input-title">Plant name</span>
              <input 
                type="text" 
                placeholder="Plant name" 
                bind:value={plantNameFilter}
                class="fusion-field"
              />
            </label>

            <!-- Country/Region -->
            <label class="input-labeled">
              <span class="input-title">Country/Region</span>
              <input 
                type="text" 
                placeholder="Country/Region" 
                bind:value={countryFilter}
                class="fusion-field"
              />
            </label>

            <!-- Device type -->
            <label class="input-labeled">
              <span class="input-title">Device type</span>
              <select bind:value={deviceTypeFilter} class="fusion-field select-field">
                <option value="All">All</option>
                <option value="Inverter">Inverter</option>
                <option value="Battery">Battery</option>
                <option value="Smart Logger">Smart Logger</option>
              </select>
            </label>

            <!-- Device SN -->
            <label class="input-labeled">
              <span class="input-title">Device SN</span>
              <input 
                type="text" 
                placeholder="Device SN" 
                bind:value={deviceSnFilter}
                class="fusion-field"
              />
            </label>

            <!-- Expand Toggle -->
            <button 
              class="expand-link" 
              on:click={() => (isExpanded = !isExpanded)}
            >
              <span>Expand</span>
              <span>{isExpanded ? '⌃' : '⌵'}</span>
            </button>

            <!-- Search Button -->
            <button class="btn-blue-solid" on:click={() => showToast('Pencarian diterapkan')}>
              Search
            </button>

            <!-- Reset Button -->
            <button class="btn-outline-reset" on:click={handleReset}>
              Reset
            </button>
          </div>

          <!-- Add Plant Button on the Right -->
          <button class="btn-add-solid" on:click={() => (showAddModal = true)}>
            Add Plant
          </button>
        </div>

        <!-- Status Tabs Row -->
        <div class="tabs-row">
          <div class="flex items-center gap-6">
            <button
              class:active-tab={activeTab === "All (2)"}
              class="status-tab"
              on:click={() => (activeTab = "All (2)")}>All (2)</button
            >
            <button
              class:active-tab={activeTab === "Following (0)"}
              class="status-tab"
              on:click={() => (activeTab = "Following (0)")}>Following (0)</button
            >
            <button
              class:active-tab={activeTab === "Normal (2)"}
              class="status-tab"
              on:click={() => (activeTab = "Normal (2)")}>Normal (2)</button
            >
            <button
              class:active-tab={activeTab === "Fault (0)"}
              class="status-tab"
              on:click={() => (activeTab = "Fault (0)")}>Fault (0)</button
            >
            <button
              class:active-tab={activeTab === "Offline (0)"}
              class="status-tab"
              on:click={() => (activeTab = "Offline (0)")}>Offline (0)</button
            >
          </div>

          <div class="ml-auto flex items-center gap-2 text-xs text-[#8da0ad]">
            <span>Optional columns</span>
            <button class="icon-tool-btn" title="Compact View">☰</button>
            <button class="icon-tool-btn" title="Grid Settings">▤</button>
          </div>
        </div>

        <!-- Professional Table Area matching Reference -->
        <div class="table-scroll-wrap">
          <table class="enterprise-table">
            <thead>
              <tr>
                <th class="w-14 cursor-pointer" on:click={() => toggleSort('status')}>
                  <div class="th-flex">
                    <span>Status</span>
                    <span class="sort-glyph">{sortField === 'status' ? (sortAsc ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>

                <th class="w-20 text-center">Plant Image</th>

                <th class="cursor-pointer" on:click={() => toggleSort('name')}>
                  <div class="th-flex">
                    <span>Plant Name</span>
                    <span class="sort-glyph">{sortField === 'name' ? (sortAsc ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>

                <th>
                  <div class="leading-tight">
                    <div>Country/Regi</div>
                    <div>on</div>
                  </div>
                </th>

                <th>Grid Connection...</th>

                <th class="text-right cursor-pointer" on:click={() => toggleSort('capacity')}>
                  <div class="th-flex justify-end">
                    <span>Total String Capacity...</span>
                    <span class="sort-glyph">{sortField === 'capacity' ? (sortAsc ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>

                <th class="text-center">
                  <div class="th-flex justify-center">
                    <span>Optimizer Quantity</span>
                    <span class="sort-glyph">⇅</span>
                  </div>
                </th>

                <th class="text-center">Battery</th>

                <th class="text-right cursor-pointer" on:click={() => toggleSort('power')}>
                  <div class="th-flex justify-end">
                    <span>Current Power (kW)</span>
                    <span class="sort-glyph">{sortField === 'power' ? (sortAsc ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>

                <th class="text-right">Specific Energy...</th>

                <th class="text-right cursor-pointer" on:click={() => toggleSort('yieldToday')}>
                  <div class="th-flex justify-end">
                    <span>Yield Today (kWh)</span>
                    <span class="sort-glyph">{sortField === 'yieldToday' ? (sortAsc ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>

                <th class="text-right cursor-pointer" on:click={() => toggleSort('totalYield')}>
                  <div class="th-flex justify-end">
                    <span>Total Yield (kWh) <span class="text-slate-400">ⓘ</span></span>
                    <span class="sort-glyph">{sortField === 'totalYield' ? (sortAsc ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>

                <th class="text-right cursor-pointer" on:click={() => toggleSort('pr')}>
                  <div class="th-flex justify-end">
                    <span>Performance Ratio (%)</span>
                    <span class="sort-glyph">{sortField === 'pr' ? (sortAsc ? '▲' : '▼') : '⇅'}</span>
                  </div>
                </th>

                <th class="w-12 text-center">
                  <button class="gear-tool-btn" title="Customize Columns">⚙</button>
                </th>
              </tr>
            </thead>
            <tbody>
              {#each filteredPlants as plant}
                <tr class="table-item-row">
                  <!-- Status Indicator -->
                  <td class="text-center">
                    <span class="status-dot normal" title="Normal Operation"></span>
                  </td>

                  <!-- Plant Image Thumbnail -->
                  <td class="text-center">
                    <img 
                      src={plant.image} 
                      alt={plant.name} 
                      class="plant-photo" 
                      loading="lazy" 
                    />
                  </td>

                  <!-- Plant Name (clickable link to 3D telemetry view) -->
                  <td>
                    <a 
                      href={`/plant/${encodeURIComponent(plant.name)}`} 
                      class="plant-title-link"
                      title={`Buka telemetri 3D & operasional ${plant.name}`}
                    >
                      {plant.name}
                    </a>
                  </td>

                  <!-- Country / Region -->
                  <td class="text-slate-700">{plant.location}</td>

                  <!-- Grid Connection Date -->
                  <td class="text-slate-600 font-mono text-[11px]">{plant.gridDate}</td>

                  <!-- Total String Capacity -->
                  <td class="text-right font-normal text-slate-800">{plant.capacityStr}</td>

                  <!-- Optimizer Quantity -->
                  <td class="text-center text-slate-400">{plant.optimizerQty}</td>

                  <!-- Battery Indicator -->
                  <td class="text-center">
                    {#if plant.hasBattery}
                      <span class="text-sky-500 font-semibold" title="Battery System Installed">🔋</span>
                    {:else}
                      <span class="text-slate-400">--</span>
                    {/if}
                  </td>

                  <!-- Current Power -->
                  <td class="text-right text-slate-800 font-normal">
                    {plant.currentPower.toFixed(2)}
                  </td>

                  <!-- Specific Energy -->
                  <td class="text-right text-slate-800 font-normal">
                    {plant.specificEnergy.toFixed(2)}
                  </td>

                  <!-- Yield Today -->
                  <td class="text-right text-slate-800 font-normal">
                    {plant.yieldToday.toFixed(2)}
                  </td>

                  <!-- Total Yield -->
                  <td class="text-right text-slate-800 font-normal">
                    {plant.totalYieldStr}
                  </td>

                  <!-- PR (%) -->
                  <td class="text-right text-slate-800 font-normal">
                    {plant.pr.toFixed(2)}
                  </td>

                  <!-- Action View Details -->
                  <td class="text-center">
                    <a 
                      href={`/plant/${encodeURIComponent(plant.name)}`} 
                      class="view-detail-btn"
                      title="Lihat Detail Telemetri"
                    >
                      👁
                    </a>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Table Footer / Pagination matching Reference -->
        <footer class="panel-pagination-footer">
          <div class="text-xs text-slate-500">
            Total: <strong>{filteredPlants.length}</strong> plants
          </div>

          <div class="pagination-actions">
            <button class="page-step-btn" title="Previous page">‹</button>
            <button class="page-num-btn active">1</button>
            <button class="page-num-btn">2</button>
            <button class="page-num-btn">3</button>
            <button class="page-step-btn" title="Next page">›</button>

            <select class="page-size-picker">
              <option>10 / page</option>
              <option>20 / page</option>
              <option>50 / page</option>
            </select>

            <div class="goto-container">
              <span>Go to</span>
              <input type="text" value="1" class="goto-box-input" />
              <span>Page</span>
            </div>
          </div>
        </footer>

      </section>
    </div>
  </main>
</div>

<!-- Add Plant Modal Dialog -->
{#if showAddModal}
  <div class="modal-backdrop">
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="modal-title">Add Plant</h3>
        <button class="close-btn" on:click={() => (showAddModal = false)}>✕</button>
      </div>
      <div class="modal-body">
        <label class="modal-field">
          <span>Plant Name *</span>
          <input type="text" placeholder="e.g. PLTS Cikarang" bind:value={newName} class="fusion-field w-full" />
        </label>
        <label class="modal-field">
          <span>Country/Region *</span>
          <input type="text" placeholder="Jakarta, Indonesia" bind:value={newLocation} class="fusion-field w-full" />
        </label>
        <label class="modal-field">
          <span>Total String Capacity (kWp)</span>
          <input type="number" placeholder="100.00" bind:value={newCap} class="fusion-field w-full" />
        </label>
      </div>
      <div class="modal-footer">
        <button class="btn-outline-reset" on:click={() => (showAddModal = false)}>Cancel</button>
        <button class="btn-blue-solid" on:click={submitAddPlant}>Confirm</button>
      </div>
    </div>
  </div>
{/if}

<!-- Toast Notification Popup -->
{#if toastMessage}
  <div class="toast-popup">
    <span class="w-2 h-2 rounded-full bg-sky-400"></span>
    <span>{toastMessage}</span>
  </div>
{/if}

<style>
  /* ========================================== */
  /* GLOBAL APP SHELL STYLES (PRESERVED)        */
  /* ========================================== */
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.2s ease;
  }
  .sidebar.open {
    transform: translateX(0);
  }
  @media (min-width: 1024px) {
    .sidebar {
      transform: translateX(0);
    }
  }

  .nav-button {
    display: flex;
    min-height: 54px;
    width: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 11px;
    font-weight: 600;
    text-decoration: none;
    transition: background 0.15s;
  }
  .nav-button:hover,
  .nav-button.current {
    background: rgba(0, 0, 0, 0.15);
    color: #ffffff;
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
    background: transparent;
    border: none;
    cursor: pointer;
  }
  .icon-button:hover {
    background: #edf3f4;
  }

  .eyebrow {
    color: #ff4f00;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* ========================================== */
  /* UPGRADED WHITE PANEL & TABLE CONTENT       */
  /* ========================================== */
  .panel {
    border: 1px solid #e8edef;
    border-radius: 6px;
    background: white;
  }

  /* Filter Toolbar */
  .filter-toolbar-container {
    padding: 14px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px solid #eef2f6;
    flex-wrap: wrap;
  }

  .filter-inputs-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .input-labeled {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #475569;
  }

  .input-title {
    font-weight: 500;
    white-space: nowrap;
  }

  .fusion-field {
    height: 30px;
    padding: 0 8px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    font-size: 12px;
    color: #1e293b;
    outline: none;
    background: #ffffff;
    transition: border-color 0.15s;
    min-width: 120px;
  }
  .fusion-field:focus {
    border-color: #0066ff;
  }

  .select-field {
    padding-right: 20px;
  }

  .expand-link {
    background: transparent;
    border: none;
    color: #0066ff;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 4px 6px;
  }

  .btn-blue-solid {
    height: 30px;
    padding: 0 16px;
    background: #0066ff;
    color: #ffffff;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }
  .btn-blue-solid:hover {
    background: #0052cc;
  }

  .btn-outline-reset {
    height: 30px;
    padding: 0 14px;
    background: #ffffff;
    color: #475569;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .btn-outline-reset:hover {
    background: #f8fafc;
  }

  .btn-add-solid {
    height: 30px;
    padding: 0 16px;
    background: #0066ff;
    color: #ffffff;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
  .btn-add-solid:hover {
    background: #0052cc;
  }

  /* Status Tabs */
  .tabs-row {
    padding: 12px 18px;
    border-bottom: 1px solid #eef2f6;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
  }

  .status-tab {
    position: relative;
    background: transparent;
    border: none;
    color: #778d9c;
    cursor: pointer;
    font-size: 12px;
    padding-bottom: 4px;
    font-weight: 500;
    transition: color 0.15s;
  }
  .status-tab.active-tab {
    color: #0066ff;
    font-weight: 700;
  }
  .status-tab.active-tab::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: -12px;
    height: 2.5px;
    background: #0066ff;
    border-radius: 2px 2px 0 0;
  }

  .icon-tool-btn {
    width: 26px;
    height: 26px;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    background: #ffffff;
    color: #64748b;
    cursor: pointer;
    display: grid;
    place-items: center;
    font-size: 12px;
  }
  .icon-tool-btn:hover {
    background: #f8fafc;
    color: #0f172a;
  }

  /* Table Area */
  .table-scroll-wrap {
    overflow-x: auto;
    width: 100%;
  }

  .enterprise-table {
    width: 100%;
    min-width: 1250px;
    border-collapse: collapse;
    font-size: 12px;
  }

  .enterprise-table thead tr {
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  .enterprise-table th {
    padding: 11px 12px;
    font-weight: 600;
    color: #475569;
    white-space: nowrap;
    text-align: left;
    user-select: none;
  }

  .th-flex {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .sort-glyph {
    font-size: 10px;
    color: #94a3b8;
  }

  .gear-tool-btn {
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 13px;
    cursor: pointer;
  }
  .gear-tool-btn:hover {
    color: #334155;
  }

  .table-item-row {
    border-bottom: 1px solid #f1f5f9;
    transition: background-color 0.1s;
  }
  .table-item-row:hover {
    background-color: #f8fbff;
  }

  .enterprise-table td {
    padding: 10px 12px;
    white-space: nowrap;
  }

  /* Status Glowing Dot */
  .status-dot {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }
  .status-dot.normal {
    background: #10b981;
    box-shadow: 0 0 0 2.5px rgba(16, 185, 129, 0.2);
  }

  /* Plant Thumbnail Photo */
  .plant-photo {
    width: 44px;
    height: 30px;
    border-radius: 3px;
    object-fit: cover;
    border: 1px solid #cbd5e1;
    background: #e2e8f0;
    display: inline-block;
  }

  /* Plant Name Link */
  .plant-title-link {
    color: #0066ff;
    text-decoration: none;
    font-weight: 600;
    font-size: 12.5px;
    transition: color 0.15s;
  }
  .plant-title-link:hover {
    color: #0044bb;
    text-decoration: underline;
  }

  .view-detail-btn {
    color: #64748b;
    text-decoration: none;
    padding: 3px 6px;
    border-radius: 4px;
    transition: all 0.15s;
  }
  .view-detail-btn:hover {
    color: #0066ff;
    background: #eef6ff;
  }

  /* Pagination Footer */
  .panel-pagination-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 18px;
    border-top: 1px solid #eef2f6;
    background: #ffffff;
  }

  .pagination-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }

  .page-step-btn, .page-num-btn {
    height: 26px;
    min-width: 26px;
    padding: 0 6px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    color: #475569;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    display: grid;
    place-items: center;
  }
  .page-num-btn.active {
    background: #0066ff;
    color: #ffffff;
    border-color: #0066ff;
    font-weight: 700;
  }

  .page-size-picker {
    height: 26px;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    font-size: 12px;
    color: #475569;
    padding: 0 6px;
    background: #ffffff;
    margin-left: 8px;
  }

  .goto-container {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #64748b;
    margin-left: 8px;
  }

  .goto-box-input {
    width: 32px;
    height: 24px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    text-align: center;
    font-size: 12px;
  }

  /* Modal Dialog */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 50;
    display: grid;
    place-items: center;
    padding: 16px;
  }

  .modal-card {
    background: #ffffff;
    border-radius: 6px;
    width: 100%;
    max-width: 440px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
    overflow: hidden;
  }

  .modal-header {
    padding: 14px 18px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-title {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 14px;
    color: #94a3b8;
    cursor: pointer;
  }

  .modal-body {
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    font-size: 12px;
  }

  .modal-field span {
    display: block;
    margin-bottom: 4px;
    font-weight: 500;
    color: #475569;
  }

  .modal-footer {
    padding: 12px 18px;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  /* Toast Popup */
  .toast-popup {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #0f172a;
    color: #ffffff;
    padding: 10px 16px;
    border-radius: 6px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
    z-index: 60;
  }
</style>
