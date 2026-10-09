<script lang="ts">
  let menuOpen = false;
  let monthlyEnergyKwh = 3200;
  let tariffIdr = 1444.7;
  let monthlyBillBefore = 4600000;

  const estimatedSavings = Math.round(monthlyEnergyKwh * tariffIdr);
  const estimatedBillAfter = Math.max(monthlyBillBefore - estimatedSavings, 0);

  const tips = [
    {
      title: 'Read your daily yield trend',
      detail: 'Compare today vs yesterday and against monthly average to quickly detect drops caused by shading, weather, or inverter issues.'
    },
    {
      title: 'Watch PR and inverter temperature',
      detail: 'Low PR and sustained high inverter temperature can reduce production. Schedule cleaning and airflow checks before faults happen.'
    },
    {
      title: 'Track alarm recurrence',
      detail: 'If the same alarm appears repeatedly, create a preventive ticket instead of only acknowledging alarms one by one.'
    },
    {
      title: 'Keep battery SOC healthy',
      detail: 'Avoid extreme charge-discharge cycles. Keep SOC operating range in the recommended window from your battery vendor.'
    }
  ];

  const checklist = [
    { task: 'PV module visual inspection', freq: 'Weekly', owner: 'Site operator' },
    { task: 'Panel cleaning and debris removal', freq: 'Bi-weekly', owner: 'Maintenance team' },
    { task: 'Inverter fan and ventilation check', freq: 'Monthly', owner: 'Technician' },
    { task: 'Cable and connector thermal scan', freq: 'Quarterly', owner: 'Electrical specialist' },
    { task: 'Protection relay and breaker test', freq: 'Semi-annual', owner: 'Engineering team' }
  ];

  const actions = [
    { level: 'Info', playbook: 'Log event, monitor trend for 24h, no immediate dispatch.', target: '< 24h' },
    { level: 'Warning', playbook: 'Run remote diagnosis, verify weather and load context, plan technician visit if repeat > 2x.', target: '< 4h' },
    { level: 'Critical', playbook: 'Isolate risky asset, notify owner immediately, dispatch technician and activate backup plan.', target: '< 30m' }
  ];

  const navigation = [
    { label: 'Home', icon: '⌂', href: '/dashboard' },
    { label: 'Plants', icon: '▦', href: '/plant' },
    { label: 'Devices', icon: '▤', href: '/devices' },
    { label: 'Maintenance', icon: '⌁', href: '/maintenance' },
    { label: 'Reports', icon: '▧', href: '/report' },
    { label: 'Settings', icon: '⚙', href: '/settings' }
  ];
</script>

<svelte:head>
  <title>Owner Hub | SolarCloud</title>
</svelte:head>

<div class="min-h-screen bg-[#f3f7f8] text-[#19344a]">
  <aside class:open={menuOpen} class="sidebar fixed inset-y-0 left-0 z-30 flex w-[72px] flex-col border-r border-[#0096d6] bg-[#00b7ff]">
    <div class="flex h-14 items-center justify-center border-b border-[#0096d6] text-2xl text-white font-bold">☼</div>
    <nav class="mt-2 flex flex-1 flex-col gap-1 px-2">
      {#each navigation as item}
        <a class="nav-button" href={item.href} title={item.label}>
          <span class="nav-glyph">{item.icon}</span>
          <span>{item.label}</span>
        </a>
      {/each}
    </nav>
    <a href="/owner-hub" class="nav-button current mx-2 mb-3" title="Owner Hub">
      <span class="nav-glyph">◎</span>
      <span>Owner</span>
    </a>
  </aside>

  <main class="lg:pl-[72px]">
    <header class="flex h-14 items-center gap-3 border-b border-[#e8eef1] bg-[#f7fafb] px-4 sm:px-6">
      <button class="icon-button lg:hidden" on:click={() => (menuOpen = !menuOpen)} aria-label="Open navigation">☰</button>
      <p class="hidden text-[11px] text-[#5b7383] xl:block">Owner Hub for PV asset users</p>
      <div class="ml-auto flex items-center gap-2">
        <a href="/support" class="icon-link">Support</a>
        <a href="/dashboard" class="icon-link">Dashboard</a>
      </div>
    </header>

    <div class="mx-auto max-w-[1650px] px-3 py-3 sm:px-5">
      <section class="hero">
        <div>
          <p class="eyebrow">Owner information center</p>
          <h1>Practical insights for PV owners</h1>
          <p>Understand your plant performance, monthly savings impact, and what actions to take when alarms happen.</p>
        </div>
      </section>

      <section class="grid gap-3 xl:grid-cols-[1fr_1fr]">
        <article class="panel">
          <h2>Monthly savings estimator</h2>
          <div class="calc-grid">
            <label>Monthly PV energy (kWh)<input type="number" bind:value={monthlyEnergyKwh} min="0" /></label>
            <label>Electricity tariff (IDR/kWh)<input type="number" bind:value={tariffIdr} min="0" step="0.1" /></label>
            <label>Bill before PV (IDR)<input type="number" bind:value={monthlyBillBefore} min="0" /></label>
          </div>
          <div class="results">
            <div><span>Estimated savings</span><strong>IDR {estimatedSavings.toLocaleString('id-ID')}</strong></div>
            <div><span>Estimated bill after PV</span><strong>IDR {estimatedBillAfter.toLocaleString('id-ID')}</strong></div>
          </div>
        </article>

        <article class="panel">
          <h2>What to monitor every day</h2>
          <div class="tips">
            {#each tips as tip}
              <div>
                <h3>{tip.title}</h3>
                <p>{tip.detail}</p>
              </div>
            {/each}
          </div>
        </article>
      </section>

      <section class="grid gap-3 xl:grid-cols-[1.2fr_.8fr] mt-3">
        <article class="panel">
          <h2>Maintenance checklist for owners</h2>
          <div class="table-wrap">
            <table class="w-full text-left">
              <thead><tr><th>Task</th><th>Frequency</th><th>Owner</th></tr></thead>
              <tbody>
                {#each checklist as row}
                  <tr><td>{row.task}</td><td>{row.freq}</td><td>{row.owner}</td></tr>
                {/each}
              </tbody>
            </table>
          </div>
        </article>

        <article class="panel">
          <h2>Alarm response guide</h2>
          <div class="action-list">
            {#each actions as action}
              <div>
                <span class={`level ${action.level.toLowerCase()}`}>{action.level}</span>
                <p>{action.playbook}</p>
                <small>Response target: {action.target}</small>
              </div>
            {/each}
          </div>
        </article>
      </section>
    </div>
  </main>
</div>

<style>
  .sidebar { transform: translateX(-100%); transition: transform .2s ease; }
  .sidebar.open { transform: translateX(0); }
  .nav-button { display: flex; min-height: 54px; width: 100%; flex-direction: column; align-items: center; justify-content: center; gap: 4px; border-radius: 8px; color: rgba(255, 255, 255, 0.7); font-size: 11px; font-weight: 600; }
  .nav-button:hover, .nav-button.current { background: rgba(0, 0, 0, 0.15); color: #ffffff; }
  .nav-glyph { font-size:17px; line-height:17px; }
  .icon-button { display:grid; height:30px; width:30px; place-items:center; border-radius:6px; color:#6d8290; }
  .icon-button:hover { background:#ebf2f5; }
  .icon-link { border:1px solid #dce6eb; border-radius:999px; padding:4px 10px; font-size:11px; color:#37546a; background:#fff; }
  .hero { border:1px solid #e3ecef; border-radius:12px; background:linear-gradient(120deg,#ffffff,#f4fafb); padding:16px 18px; }
  .eyebrow { color:#f08a1f; text-transform:uppercase; letter-spacing:.1em; font-size:10px; font-weight:700; }
  h1 { margin:7px 0 5px; font-size:28px; color:#1e3a50; }
  .hero p { margin:0; color:#688192; font-size:12px; }
  .panel { border:1px solid #e4ecef; border-radius:12px; background:#fff; padding:12px; box-shadow:0 6px 16px rgba(27, 62, 80, .04); }
  .panel h2 { margin:0; font-size:13px; font-weight:700; color:#1f3a52; text-transform:uppercase; letter-spacing:.04em; }
  .calc-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin-top:10px; }
  .calc-grid label { display:grid; gap:5px; color:#698193; font-size:11px; }
  .calc-grid input { height:36px; border:1px solid #dbe7ec; border-radius:8px; padding:0 10px; color:#284459; font-size:12px; }
  .results { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px; }
  .results div { border:1px solid #e4ecef; border-radius:9px; padding:10px; background:#f9fcfd; }
  .results span { color:#6f8797; font-size:10px; }
  .results strong { display:block; margin-top:4px; font-size:15px; color:#163248; }
  .tips { display:grid; gap:8px; margin-top:10px; }
  .tips div { border:1px solid #e9f0f3; border-radius:9px; padding:9px; background:#fbfdfe; }
  .tips h3 { margin:0; font-size:12px; color:#244157; }
  .tips p { margin:4px 0 0; font-size:11px; color:#6f8797; line-height:1.4; }
  .table-wrap { margin-top:10px; overflow-x:auto; border:1px solid #e8eff2; border-radius:10px; }
  table th, table td { padding:9px 10px; font-size:11px; }
  table thead tr { background:#f9fcfd; color:#648090; }
  table tbody tr { border-top:1px solid #edf2f4; color:#274156; }
  .action-list { display:grid; gap:8px; margin-top:10px; }
  .action-list div { border:1px solid #e8eff2; border-radius:9px; padding:9px; background:#fbfdfe; }
  .level { display:inline-flex; border-radius:999px; padding:3px 8px; font-size:10px; font-weight:700; }
  .level.info { background:#eef5ff; color:#4a6eaa; }
  .level.warning { background:#fff6e8; color:#b3701a; }
  .level.critical { background:#fff0f2; color:#b74959; }
  .action-list p { margin:6px 0 3px; color:#5f7788; font-size:11px; line-height:1.4; }
  .action-list small { color:#7d93a1; font-size:10px; }
  @media (min-width: 1024px) { .sidebar { transform: translateX(0); } }
  @media (max-width: 1100px) {
    .calc-grid, .results { grid-template-columns:1fr; }
  }
</style>



