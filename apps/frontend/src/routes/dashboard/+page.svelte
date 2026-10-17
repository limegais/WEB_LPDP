<script lang="ts">
  import Chart from "$lib/components/Chart.svelte";
  import PlantMap from "$lib/components/PlantMap.svelte";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { authStore, ROLES, canAccess, type AuthUser } from "$lib/auth";

  let menuOpen = false;
  let currentUser: AuthUser | null = null;

  onMount(() => {
    authStore.load();
    const unsub = authStore.subscribe((u) => {
      currentUser = u;
      if (!u) goto("/login");
    });
    return unsub;
  });

  function handleLogout() {
    authStore.logout();
  }

  $: roleConfig = currentUser ? ROLES[currentUser.role] : null;
  $: initials = currentUser
    ? currentUser.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "--";
  let activeRange = "Day";

  const plantOptions = ["All Plants", "PLTS Gedung 3 FT", "PLTS di Indomaker"];
  let selectedPlant = "All Plants";

  const plantWeatherData: Record<
    string,
    { status: string; temp: string; irradiance: string; condition: string }
  > = {
    "All Plants": {
      status: "Aggregated",
      temp: "25-33°C",
      irradiance: "Avg 650 W/m²",
      condition: "Mixed Weather",
    },
    "PLTS Gedung 3 FT": {
      status: "Optimal",
      temp: "29°C",
      irradiance: "850 W/m²",
      condition: "Sunny / Clear",
    },
    "PLTS di Indomaker": {
      status: "Moderate",
      temp: "32°C",
      irradiance: "520 W/m²",
      condition: "Partly Cloudy",
    },
  };

  $: weather =
    plantWeatherData[selectedPlant] || plantWeatherData["All Plants"];

  const plantBatteryData: Record<
    string,
    { soc: number; status: string; power: string; color: string; flow: string }
  > = {
    "All Plants": {
      soc: 75,
      status: "Standby",
      power: "1.2 MW",
      color: "#10b981",
      flow: "charge",
    },
    "PLTS Gedung 3 FT": {
      soc: 92,
      status: "Charging",
      power: "+0.40 MW",
      color: "#10b981",
      flow: "charge",
    },
    "PLTS di Indomaker": {
      soc: 45,
      status: "Discharging",
      power: "-0.80 MW",
      color: "#ff4f00",
      flow: "discharge",
    },
  };

  $: battery =
    plantBatteryData[selectedPlant] || plantBatteryData["All Plants"];

  const recentAlarms = [
    {
      time: "10:14",
      source: "PLTS Gedung 3 FT",
      msg: "Inverter 2 Overheating",
      type: "fault",
      badge: "Warning",
    },
    {
      time: "09:00",
      source: "PLTS di Indomaker",
      msg: "Grid Voltage Abnormal",
      type: "alarm",
      badge: "Grid Alert",
    },
  ];

  const ranges = ["Day", "Week", "Month", "Year", "Total"];

  const navigation = [
    { label: "Home", icon: "⌂", href: "/dashboard" },
    { label: "Plants", icon: "▦", href: "/plant" },
    { label: "Devices", icon: "▤", href: "/devices" },
    { label: "Owner", icon: "◎", href: "/owner-hub" },
    { label: "Maintenance", icon: "⌁", href: "/maintenance" },
    { label: "Reports", icon: "▧", href: "/report" },
    { label: "Settings", icon: "⚙", href: "/settings" },
  ];

  const summaries = [
    { label: "YIELD TODAY", value: "7.83", unit: "MWH", target: "92%" },
    { label: "YIELD THIS MONTH", value: "169.93", unit: "MWH", target: "85%" },
    { label: "TOTAL YIELD", value: "2.60", unit: "GWH", target: "" },
    { label: "REAL-TIME POWER", value: "1.10", unit: "MW", target: "" },
    { label: "INSTALLED POWER", value: "3.69", unit: "MWP", target: "" },
  ];

  const revenue = [
    {
      label: "REVENUE TODAY",
      value: "8,176,670",
      compact: "Rp 8,18 Jt",
      target: "95%",
    },
    {
      label: "THIS MONTH",
      value: "167,313,598",
      compact: "Rp 167,31 Jt",
      target: "88%",
    },
    {
      label: "THIS YEAR",
      value: "2,145,032,277",
      compact: "Rp 2,15 M",
      target: "",
    },
    {
      label: "TOTAL REVENUE",
      value: "2,540,321,914",
      compact: "Rp 2,54 M",
      target: "",
    },
  ];

  const plantStatuses = [
    { label: "All Plants", value: 17, color: "#ff4f00" },
    { label: "Following", value: 0, color: "#64748b" },
    { label: "Normal", value: 13, color: "#10b981" },
    { label: "Abnormal", value: 1, color: "#ef4444" },
    { label: "Offline", value: 3, color: "#94a3b8" },
    { label: "Commissioning", value: 0, color: "#0ea5e9" },
  ];

  const dailyPlants = [
    { name: "PLTS Gedung 3 FT", hours: "3.46 h", pct: "92%" },
    { name: "PLTS di Indomaker", hours: "3.34 h", pct: "86%" },
  ];

  const powerOption = {
    grid: { top: 28, right: 20, bottom: 36, left: 48 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#1a3246",
      borderColor: "#1a3246",
      textStyle: { color: "#fff", fontSize: 13 },
      formatter: (p: any[]) =>
        `<b>${p[0].name}</b><br/>Power: <b>${p[0].value} MW</b>`,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: [
        "00:00",
        "02:00",
        "04:00",
        "06:00",
        "08:00",
        "10:00",
        "12:00",
        "14:00",
        "16:00",
        "18:00",
        "20:00",
        "22:00",
        "23:00",
      ],
      axisLine: { lineStyle: { color: "#dce4e9" } },
      axisLabel: { color: "#7d909d", fontSize: 12, margin: 10 },
    },
    yAxis: {
      type: "value",
      name: "MW",
      nameTextStyle: {
        color: "#7d909d",
        fontSize: 12,
        padding: [0, 0, 0, -20],
      },
      min: 0,
      max: 1.2,
      interval: 0.4,
      axisLabel: { color: "#7d909d", fontSize: 12 },
      splitLine: { lineStyle: { color: "#ebf0f3", type: "dashed" } },
    },
    series: [
      {
        name: "RESS active power",
        type: "line",
        smooth: true,
        showSymbol: false,
        lineStyle: { color: "#ff4f00", width: 3 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(255,79,0,0.18)" },
              { offset: 1, color: "rgba(255,79,0,0.01)" },
            ],
          },
        },
        data: [
          0.05, 0.05, 0.05, 0.12, 0.68, 0.95, 1.1, 1.08, 0.9, 0.55, 0.18, 0.07,
          0.05,
        ],
      },
    ],
  };

  const alarmOption = {
    series: [
      {
        type: "pie",
        radius: ["65%", "84%"],
        silent: true,
        label: { show: false },
        data: [
          { value: 2, itemStyle: { color: "#f35a65" } },
          { value: 1, itemStyle: { color: "#ff4f00" } },
          { value: 7, itemStyle: { color: "#ecf2f5" } },
        ],
      },
    ],
  };
</script>

<svelte:head>
  <title>Renewable Energy Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-[#f3f7f8] text-[#1a3449]">
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
      {#each navigation as item, index}
        <a
          class:current={index === 0}
          class="nav-button"
          href={item.href}
          title={item.label}
        >
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
    <header
      class="flex h-14 items-center gap-3 border-b border-[#e8eef1] bg-[#f7fafb] px-4 sm:px-6"
    >
      <button
        class="icon-button lg:hidden"
        on:click={() => (menuOpen = !menuOpen)}
        aria-label="Open navigation">☰</button
      >
      <p class="hidden text-[13px] text-[#3b5262] font-medium xl:block">
        RESS Renewable Energy Monitoring Dashboard
      </p>

      <div class="ml-4 flex items-center">
        <select
          bind:value={selectedPlant}
          class="text-[12px] border border-[#dce4e9] rounded px-2 py-1.5 bg-white outline-none text-[#17324a] font-medium"
        >
          {#each plantOptions as opt}
            <option value={opt}>{opt}</option>
          {/each}
        </select>
      </div>

      <div class="ml-auto flex items-center gap-3">
        <span class="text-[12px] text-[#4b5e6b] font-medium"
          >Updated: 19:42:30</span
        >
        <button class="icon-button" aria-label="Notifications">♧</button>
        {#if currentUser && roleConfig}
          <div class="flex items-center gap-2">
            <div
              class="rounded px-2 py-0.5 text-[9px] font-bold"
              style="background:{roleConfig.color}22;color:{roleConfig.color};border:1px solid {roleConfig.color}55"
            >
              {roleConfig.badge}
              {roleConfig.label}
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
              aria-label="Logout">⏻</button
            >
          </div>
        {:else}
          <div
            class="grid h-8 w-8 place-items-center rounded-full bg-[#254563] text-[10px] font-bold text-white"
          >
            R
          </div>
        {/if}
      </div>
    </header>

    <div class="frame-wrap">
      <section class="main-frame">
        <!-- TOP BAND: KPIs -->
        <div class="top-band">
          <div class="summary-grid">
            {#each summaries as item}
              <div class="metric-card">
                <span class="metric-label">{item.label}</span>
                <div class="metric-val-wrap">
                  <strong class="metric-val">{item.value}</strong>
                  {#if item.unit}
                    <span class="metric-unit">{item.unit}</span>
                  {/if}
                </div>
                {#if item.target}
                  <div class="target-bar">
                    <div class="target-track">
                      <div
                        class="target-fill target-fill--green"
                        style="width: {item.target}"
                      ></div>
                    </div>
                    <span class="target-pct target-pct--green"
                      >{item.target}</span
                    >
                  </div>
                {:else}
                  <div class="target-placeholder"></div>
                {/if}
              </div>
            {/each}
          </div>

          <div class="revenue-grid">
            {#each revenue as item}
              <div class="metric-card metric-card--revenue">
                <span class="metric-label">{item.label}</span>
                <div class="metric-val-wrap">
                  <strong class="metric-val text-[#1e293b]"
                    >{item.compact}</strong
                  >
                </div>
                <div class="flex items-center justify-between mt-1">
                  <span class="text-[11px] font-medium text-[#64748b]"
                    >IDR {item.value}</span
                  >
                  {#if item.target}
                    <span class="text-[11px] font-bold text-[#0284c7]"
                      >{item.target}</span
                    >
                  {/if}
                </div>
                {#if item.target}
                  <div class="target-bar !mt-1.5">
                    <div class="target-track">
                      <div
                        class="target-fill target-fill--blue"
                        style="width: {item.target}"
                      ></div>
                    </div>
                  </div>
                {:else}
                  <div class="target-placeholder"></div>
                {/if}
              </div>
            {/each}
          </div>
        </div>

        <!-- MIDDLE BAND: 3 Balanced Cards (Power Curve, Weather/Irradiance, Battery BESS) -->
        <div class="middle-band">
          <!-- Active Power Curve -->
          <article class="panel panel-chart">
            <div class="panel-head">
              <div class="flex items-center gap-2">
                <h2 class="panel-title">RESS Active Power</h2>
                <span class="panel-badge">Live Telemetry</span>
              </div>
              <div class="control-group">
                {#each ranges as range}
                  <button
                    class:active={activeRange === range}
                    on:click={() => (activeRange = range)}>{range}</button
                  >
                {/each}
              </div>
            </div>

            <div class="chart-date">
              <button aria-label="Previous date" class="hover:text-[#ff4f00]"
                >‹</button
              >
              <span>18/Sep/2026</span>
              <button aria-label="Next date" class="hover:text-[#ff4f00]"
                >›</button
              >
            </div>

            <div class="chart-box">
              <Chart option={powerOption} />
            </div>

            <div class="chart-footer">
              <div class="legend-line">
                <span class="legend-swatch"></span>
                <span class="text-[11px] font-medium text-[#64748b]"
                  >RESS Active Power (MW)</span
                >
              </div>
              <div class="chart-stats-strip">
                <div class="chart-stat">
                  <span class="stat-lbl">Puncak Daya:</span>
                  <strong class="stat-val">1.10 MW</strong>
                </div>
                <div class="chart-stat">
                  <span class="stat-lbl">Rata-rata Siang:</span>
                  <strong class="stat-val">0.78 MW</strong>
                </div>
                <div class="chart-stat">
                  <span class="stat-lbl">Total Hari Ini:</span>
                  <strong class="stat-val text-[#ff4f00]">7.83 MWh</strong>
                </div>
              </div>
            </div>
          </article>

          <!-- Weather & Solar Irradiance -->
          <article class="panel panel-weather">
            <div class="panel-head">
              <div class="flex items-center gap-2">
                <h2 class="panel-title">Weather & Irradiance</h2>
                <span class="panel-badge">Sensors Online</span>
              </div>
            </div>

            <div class="fleet-weather-list">
              <!-- Site 1: Gedung 3 FT -->
              <div class="fleet-weather-card">
                <div class="fleet-card-header">
                  <span class="plant-name">PLTS Gedung 3 FT</span>
                  <span class="status-pill status-pill--optimal">Optimal</span>
                </div>
                <div class="fleet-card-body">
                  <div class="weather-icon-box text-amber-500">
                    <svg
                      class="w-6 h-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <circle cx="12" cy="12" r="4" />
                      <path
                        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
                      />
                    </svg>
                  </div>
                  <div class="weather-metrics">
                    <div class="metric-pair">
                      <span class="metric-pair-val">29°C</span>
                      <span class="metric-pair-lbl">Suhu Modul</span>
                    </div>
                    <div class="metric-pair">
                      <span class="metric-pair-val text-amber-600"
                        >850 W/m²</span
                      >
                      <span class="metric-pair-lbl">Radiasi Solar</span>
                    </div>
                  </div>
                </div>
                <div class="fleet-card-sub">
                  <span>Kondisi: Cerah Terang</span>
                  <span>Kelembapan: 62%</span>
                </div>
              </div>

              <!-- Site 2: Indomaker -->
              <div class="fleet-weather-card">
                <div class="fleet-card-header">
                  <span class="plant-name">PLTS di Indomaker</span>
                  <span class="status-pill status-pill--moderate">Moderate</span
                  >
                </div>
                <div class="fleet-card-body">
                  <div class="weather-icon-box text-sky-500">
                    <svg
                      class="w-6 h-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41"
                      />
                      <path d="M15.5 13a4.5 4.5 0 0 0-7.8-3.2" />
                      <path
                        d="M17.5 19H9a5 5 0 0 1-1-9.9 6.5 6.5 0 0 1 12.3 2.9A4.5 4.5 0 0 1 17.5 19Z"
                      />
                    </svg>
                  </div>
                  <div class="weather-metrics">
                    <div class="metric-pair">
                      <span class="metric-pair-val">32°C</span>
                      <span class="metric-pair-lbl">Suhu Modul</span>
                    </div>
                    <div class="metric-pair">
                      <span class="metric-pair-val text-sky-600">520 W/m²</span>
                      <span class="metric-pair-lbl">Radiasi Solar</span>
                    </div>
                  </div>
                </div>
                <div class="fleet-card-sub">
                  <span>Kondisi: Berawan Tipis</span>
                  <span>Kelembapan: 71%</span>
                </div>
              </div>
            </div>

            <div class="panel-summary-bar">
              <span>Rata-rata Radiasi: <b>685 W/m²</b></span>
              <span>Rata-rata Suhu: <b>30.5°C</b></span>
            </div>
          </article>

          <!-- Battery Storage (BESS) -->
          <article class="panel panel-battery">
            <div class="panel-head">
              <div class="flex items-center gap-2">
                <h2 class="panel-title">RESS Battery Status</h2>
                <span class="panel-badge">BESS Active</span>
              </div>
            </div>

            <div class="fleet-battery-list">
              <!-- Battery Site 1 -->
              <div class="fleet-battery-card">
                <div class="fleet-card-header">
                  <span class="plant-name">PLTS Gedung 3 FT</span>
                  <span class="flow-pill flow-pill--charge">
                    <span class="flow-indicator flow-indicator--charge"></span>
                    Charging +0.40 MW
                  </span>
                </div>
                <div class="battery-gauge-row">
                  <div class="battery-icon text-emerald-600">
                    <svg
                      class="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <rect width="16" height="10" x="2" y="7" rx="2" ry="2" />
                      <line x1="22" x2="22" y1="11" y2="13" />
                      <polyline points="11 9 9 12 13 12 11 15" />
                    </svg>
                  </div>
                  <div class="battery-track-wrap">
                    <div class="battery-track">
                      <div
                        class="battery-fill"
                        style="width: 92%; background: #10b981;"
                      ></div>
                    </div>
                  </div>
                  <strong class="battery-pct-val text-emerald-600">92%</strong>
                </div>
                <div class="fleet-card-sub">
                  <span>Tegangan: 785 V</span>
                  <span>Health (SOH): 99.1%</span>
                </div>
              </div>

              <!-- Battery Site 2 -->
              <div class="fleet-battery-card">
                <div class="fleet-card-header">
                  <span class="plant-name">PLTS di Indomaker</span>
                  <span class="flow-pill flow-pill--discharge">
                    <span class="flow-indicator flow-indicator--discharge"
                    ></span>
                    Discharging -0.80 MW
                  </span>
                </div>
                <div class="battery-gauge-row">
                  <div class="battery-icon text-orange-500">
                    <svg
                      class="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <rect width="16" height="10" x="2" y="7" rx="2" ry="2" />
                      <line x1="22" x2="22" y1="11" y2="13" />
                      <line x1="6" y1="12" x2="14" y2="12" />
                    </svg>
                  </div>
                  <div class="battery-track-wrap">
                    <div class="battery-track">
                      <div
                        class="battery-fill"
                        style="width: 45%; background: #ff4f00;"
                      ></div>
                    </div>
                  </div>
                  <strong class="battery-pct-val text-orange-500">45%</strong>
                </div>
                <div class="fleet-card-sub">
                  <span>Tegangan: 742 V</span>
                  <span>Health (SOH): 97.8%</span>
                </div>
              </div>
            </div>

            <div class="panel-summary-bar">
              <span>Total Kapasitas: <b>2.40 MWh</b></span>
              <span>Net Flow: <b class="text-orange-600">-0.40 MW</b></span>
            </div>
          </article>
        </div>

        <!-- BOTTOM BAND: 3 Balanced Cards (Health & Alarms, Equivalent Hours & ESG, Map) -->
        <div class="bottom-band">
          <!-- Col 1: Plant Health & Alarms Feed -->
          <article class="panel panel-ops">
            <div class="panel-head">
              <h2 class="panel-title">Kesehatan Armada & Alarms</h2>
              <span class="panel-badge">2 Aktif</span>
            </div>

            <!-- Health Status Counters -->
            <div class="health-status-strip">
              {#each plantStatuses as item}
                <div class="health-chip">
                  <span class="health-dot" style="background: {item.color};"
                  ></span>
                  <span class="health-lbl">{item.label}</span>
                  <strong class="health-val">{item.value}</strong>
                </div>
              {/each}
            </div>

            <!-- Recent Alarms List -->
            <div class="alarm-feed-wrap">
              {#each recentAlarms as alarm}
                <div class="alarm-feed-card">
                  <div class="alarm-top-line">
                    <span class="alarm-time-badge">{alarm.time}</span>
                    <span class="alarm-plant-source">{alarm.source}</span>
                    <span class="alarm-severity alarm-severity--{alarm.type}"
                      >{alarm.badge}</span
                    >
                  </div>
                  <p class="alarm-text">{alarm.msg}</p>
                </div>
              {/each}
            </div>

            <a href="/maintenance" class="alarm-footer-link">
              Lihat seluruh riwayat alarm & notifikasi →
            </a>
          </article>

          <!-- Col 2: Daily Equivalent Hours & Emission Reduction (ESG) -->
          <article class="panel panel-esg">
            <div class="panel-head">
              <h2 class="panel-title">PSH & Reduksi Emisi (ESG)</h2>
              <span class="panel-badge">Sertifikasi Hijau</span>
            </div>

            <!-- Equivalent Hours (Top Section) -->
            <div class="psh-section">
              <div class="psh-head">
                <span
                  class="text-[12px] font-bold text-[#475569] uppercase tracking-wider"
                  >Jam Ekuivalen Harian (Top 2)</span
                >
                <span class="text-[11px] text-[#64748b]"
                  >Standar 3.0 h/hari</span
                >
              </div>
              <div class="psh-list">
                {#each dailyPlants as plant, i}
                  <div class="psh-item">
                    <div class="psh-info">
                      <span class="psh-rank">{i + 1}</span>
                      <span class="psh-name">{plant.name}</span>
                      <strong class="psh-hours">{plant.hours}</strong>
                    </div>
                    <div class="psh-bar-track">
                      <div
                        class="psh-bar-fill"
                        style="width: {plant.pct};"
                      ></div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Emission Reduction (Bottom Section) -->
            <div class="esg-section">
              <div class="esg-grid">
                <!-- CO2 -->
                <div class="esg-stat-card">
                  <div class="esg-icon-wrap text-emerald-600">
                    <svg
                      class="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
                      />
                      <path
                        d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"
                      />
                    </svg>
                  </div>
                  <strong class="esg-val">2,593.30</strong>
                  <span class="esg-unit">Ton CO₂ Terhindar</span>
                </div>

                <!-- Coal -->
                <div class="esg-stat-card">
                  <div class="esg-icon-wrap text-slate-700">
                    <svg
                      class="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polygon
                        points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
                      />
                    </svg>
                  </div>
                  <strong class="esg-val">1,050.85</strong>
                  <span class="esg-unit">Ton Batubara Hemat</span>
                </div>

                <!-- Trees -->
                <div class="esg-stat-card">
                  <div class="esg-icon-wrap text-teal-600">
                    <svg
                      class="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M12 10v12M12 2a5 5 0 0 0-5 5c0 2 1.5 3.5 3 4.5l-3 4.5h10l-3-4.5c1.5-1 3-2.5 3-4.5a5 5 0 0 0-5-5z"
                      />
                    </svg>
                  </div>
                  <strong class="esg-val">141,594</strong>
                  <span class="esg-unit">Pohon Ekuivalen</span>
                </div>
              </div>
            </div>
          </article>

          <!-- Col 3: Map -->
          <article class="panel panel-map">
            <div class="panel-head">
              <div class="flex items-center gap-2">
                <h2 class="panel-title">Sebaran Geografis Plant</h2>
                <span class="panel-badge">Jawa Barat & Tengah</span>
              </div>
            </div>
            <div class="map-container-inner">
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
  }

  .nav-button:hover,
  .nav-button.current {
    background: rgba(0, 0, 0, 0.15);
    color: #ffffff;
  }

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
    padding: 12px 16px 16px;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
  }

  .main-frame {
    display: flex;
    flex-direction: column;
    gap: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.04);
    padding: 14px;
    min-height: min-content;
  }

  /* TOP BAND */
  .top-band {
    display: grid;
    grid-template-columns: 1.32fr 1fr;
    gap: 12px;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #f8fafc;
    overflow: hidden;
  }

  .revenue-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #f8fafc;
    overflow: hidden;
  }

  .metric-card {
    border-right: 1px solid #e2e8f0;
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .metric-card:last-child {
    border-right: 0;
  }

  .metric-card--revenue:nth-child(2) {
    border-right: 0;
  }

  .metric-card--revenue:nth-child(1),
  .metric-card--revenue:nth-child(2) {
    border-bottom: 1px solid #e2e8f0;
  }

  .metric-label {
    color: #64748b;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .metric-val-wrap {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin-top: 4px;
  }

  .metric-val {
    font-size: 23px;
    line-height: 1.15;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.02em;
  }

  .metric-unit {
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
  }

  .target-placeholder {
    height: 14px;
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
    background: #e2e8f0;
    overflow: hidden;
  }

  .target-fill {
    height: 100%;
    border-radius: 999px;
  }

  .target-fill--green {
    background: #10b981;
  }

  .target-fill--blue {
    background: #0284c7;
  }

  .target-pct {
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .target-pct--green {
    color: #059669;
  }

  .target-pct--blue {
    color: #0284c7;
  }

  /* PANELS BASE */
  .panel {
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    transition:
      box-shadow 0.2s ease,
      border-color 0.2s ease;
  }

  .panel:hover {
    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
    border-color: #cbd5e1;
  }

  .panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .panel-title {
    margin: 0;
    font-size: 12px;
    font-weight: 800;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .panel-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 999px;
    background: #f1f5f9;
    color: #475569;
    letter-spacing: 0.02em;
  }

  .panel-summary-bar {
    margin-top: auto;
    padding-top: 8px;
    border-top: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    color: #64748b;
  }

  .panel-summary-bar b {
    color: #0f172a;
    font-weight: 700;
  }

  /* MIDDLE BAND */
  .middle-band {
    display: grid;
    grid-template-columns: 1.35fr 1fr 1fr;
    gap: 12px;
    align-items: stretch;
  }

  /* Active Power Chart */
  .control-group {
    display: flex;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    overflow: hidden;
    background: #f8fafc;
  }

  .control-group button {
    padding: 4px 10px;
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    transition: all 0.15s ease;
  }

  .control-group button.active {
    background: #ffffff;
    color: #ea580c;
    font-weight: 700;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .chart-date {
    display: flex;
    width: 150px;
    justify-content: space-between;
    align-items: center;
    margin: 2px auto 6px;
    border-radius: 999px;
    background: #f1f5f9;
    padding: 4px 12px;
    color: #334155;
    font-size: 11px;
    font-weight: 700;
  }

  .chart-box {
    height: 190px;
    width: 100%;
  }

  .chart-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 6px;
    border-top: 1px solid #f1f5f9;
    margin-top: 4px;
  }

  .legend-line {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .legend-swatch {
    height: 8px;
    width: 22px;
    border-radius: 4px;
    background: linear-gradient(90deg, #ff4f00 0%, #ff8040 100%);
  }

  .chart-stats-strip {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .chart-stat {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
  }

  .stat-lbl {
    color: #64748b;
  }

  .stat-val {
    color: #0f172a;
    font-weight: 700;
  }

  /* Weather & Fleet Cards */
  .fleet-weather-list,
  .fleet-battery-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }

  .fleet-weather-card,
  .fleet-battery-card {
    border: 1px solid #f1f5f9;
    border-radius: 10px;
    background: #fafcfd;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition:
      border-color 0.15s ease,
      background 0.15s ease;
  }

  .fleet-weather-card:hover,
  .fleet-battery-card:hover {
    border-color: #e2e8f0;
    background: #ffffff;
  }

  .fleet-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .plant-name {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.01em;
  }

  .status-pill {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 999px;
  }

  .status-pill--optimal {
    background: #ecfdf5;
    color: #059669;
  }

  .status-pill--moderate {
    background: #fef3c7;
    color: #d97706;
  }

  .fleet-card-body {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .weather-icon-box {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 8px;
    background: #f8fafc;
    flex-shrink: 0;
  }

  .weather-metrics {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
  }

  .metric-pair {
    display: flex;
    flex-direction: column;
  }

  .metric-pair-val {
    font-size: 15px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.15;
  }

  .metric-pair-lbl {
    font-size: 10px;
    font-weight: 600;
    color: #64748b;
  }

  .fleet-card-sub {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 10px;
    font-weight: 500;
    color: #94a3b8;
    padding-top: 4px;
    border-top: 1px dashed #f1f5f9;
  }

  /* Battery Flow Pills */
  .flow-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
  }

  .flow-pill--charge {
    background: #ecfdf5;
    color: #059669;
  }

  .flow-pill--discharge {
    background: #fff7ed;
    color: #ea580c;
  }

  .flow-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .flow-indicator--charge {
    background: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  }

  .flow-indicator--discharge {
    background: #f97316;
    box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
  }

  .battery-gauge-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .battery-icon {
    flex-shrink: 0;
  }

  .battery-track-wrap {
    flex: 1;
  }

  .battery-track {
    height: 8px;
    border-radius: 999px;
    background: #e2e8f0;
    overflow: hidden;
  }

  .battery-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.3s ease;
  }

  .battery-pct-val {
    font-size: 14px;
    font-weight: 800;
    min-width: 36px;
    text-align: right;
  }

  /* BOTTOM BAND */
  .bottom-band {
    display: grid;
    grid-template-columns: 1fr 1fr 1.2fr;
    gap: 12px;
    align-items: stretch;
  }

  /* Col 1: Health Status Chips & Alarm Feed */
  .health-status-strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    margin-bottom: 10px;
  }

  .health-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border-radius: 8px;
    border: 1px solid #f1f5f9;
    background: #fafcfd;
  }

  .health-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .health-lbl {
    font-size: 11px;
    color: #64748b;
    font-weight: 600;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .health-val {
    font-size: 12px;
    font-weight: 700;
    color: #0f172a;
  }

  .alarm-feed-wrap {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }

  .alarm-feed-card {
    border: 1px solid #f1f5f9;
    border-radius: 8px;
    background: #ffffff;
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .alarm-top-line {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .alarm-time-badge {
    font-size: 11px;
    font-weight: 700;
    color: #475569;
    background: #f1f5f9;
    padding: 1px 6px;
    border-radius: 4px;
  }

  .alarm-plant-source {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    flex: 1;
  }

  .alarm-severity {
    font-size: 10px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 4px;
  }

  .alarm-severity--fault {
    background: #ffe4e6;
    color: #e11d48;
  }

  .alarm-severity--alarm {
    background: #ffedd5;
    color: #ea580c;
  }

  .alarm-text {
    font-size: 12px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.3;
    margin: 0;
  }

  .alarm-footer-link {
    margin-top: 8px;
    font-size: 11px;
    font-weight: 700;
    color: #0284c7;
    text-align: center;
    display: block;
    padding-top: 6px;
    border-top: 1px solid #f1f5f9;
  }

  .alarm-footer-link:hover {
    text-decoration: underline;
  }

  /* Col 2: PSH & ESG Section */
  .psh-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f1f5f9;
  }

  .psh-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .psh-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .psh-item {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .psh-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .psh-rank {
    font-size: 12px;
    font-weight: 800;
    color: #ff4f00;
    width: 14px;
    text-align: center;
  }

  .psh-name {
    font-size: 12px;
    font-weight: 600;
    color: #334155;
    flex: 1;
  }

  .psh-hours {
    font-size: 12px;
    font-weight: 700;
    color: #0f172a;
  }

  .psh-bar-track {
    height: 5px;
    border-radius: 999px;
    background: #f1f5f9;
    overflow: hidden;
  }

  .psh-bar-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #ff4f00 0%, #ff8040 100%);
  }

  /* ESG Section */
  .esg-section {
    padding-top: 8px;
  }

  .esg-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }

  .esg-stat-card {
    border: 1px solid #f1f5f9;
    border-radius: 8px;
    background: #fafcfd;
    padding: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 2px;
  }

  .esg-icon-wrap {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: #ffffff;
    margin-bottom: 2px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .esg-val {
    font-size: 15px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.15;
  }

  .esg-unit {
    font-size: 9px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  /* Col 3: Map */
  .map-container-inner {
    flex: 1;
    min-height: 180px;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #f1f5f9;
  }

  /* Responsive Media Queries */
  @media (min-width: 1024px) {
    .sidebar {
      transform: translateX(0);
    }
  }

  @media (max-width: 1360px) {
    .top-band {
      grid-template-columns: 1fr;
    }
    .middle-band {
      grid-template-columns: 1fr 1fr;
    }
    .panel-chart {
      grid-column: span 2;
    }
    .bottom-band {
      grid-template-columns: 1fr 1fr;
    }
    .panel-map {
      grid-column: span 2;
    }
  }

  @media (max-width: 900px) {
    .middle-band,
    .bottom-band {
      grid-template-columns: 1fr;
    }
    .panel-chart,
    .panel-map {
      grid-column: auto;
    }
    .summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .revenue-grid {
      grid-template-columns: 1fr;
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
