<script lang="ts">
  let menuOpen = false;
  let activeSetting = 'General';

  const settingTabs = ['General', 'Users', 'Notifications', 'Thresholds', 'Data Management'];
</script>

<svelte:head><title>Pengaturan Sistem</title></svelte:head>

<div class="min-h-screen bg-[#f4f7f8] text-[#17324a]">
  <aside class:open={menuOpen} class="sidebar fixed inset-y-0 left-0 z-30 flex w-[72px] flex-col border-r border-[#0096d6] bg-[#00b7ff]">
    <div class="flex h-14 items-center justify-center border-b border-[#0096d6] text-2xl text-white font-bold">☼</div>
    <nav class="mt-2 flex flex-1 flex-col gap-1 px-2">
      <a href="/dashboard" class="nav-button"><span class="nav-glyph">⌂</span><span>Home</span></a>
      <a href="/plant" class="nav-button"><span class="nav-glyph">▦</span><span>Plant</span></a>
      <a href="/devices" class="nav-button"><span class="nav-glyph">▤</span><span>Device</span></a>
      <a href="/maintenance" class="nav-button"><span class="nav-glyph">⌁</span><span>Maintenance</span></a>
      <a href="/report" class="nav-button"><span class="nav-glyph">▧</span><span>Report</span></a>
      <a href="/settings" class="nav-button current"><span class="nav-glyph">⚙</span><span>System</span></a>
    </nav>
    <a href="mailto:support@rms.co.id" class="nav-button mb-3 mx-2"><span class="nav-glyph">?</span><span>Help</span></a>
  </aside>

  <main class="lg:pl-[72px]">
    <header class="flex h-14 items-center gap-3 px-4 sm:px-7">
      <button class="icon-button lg:hidden" on:click={() => (menuOpen = !menuOpen)} aria-label="Open navigation">☰</button>
      <p class="hidden text-[11px] text-[#7e909d] sm:block">Good afternoon, <strong class="text-[#3b5062]">PT. RMS</strong></p>
      <span class="hidden text-[11px] text-[#7e909d] sm:block">Friday, 18 Sep 2026</span>
      <div class="ml-auto flex items-center gap-3">
        <label class="hidden h-8 w-52 items-center gap-2 rounded bg-white px-3 text-[#a8b5bd] sm:flex"><span>⌕</span><input class="w-full bg-transparent text-[10px] outline-none" placeholder="Search plants or devices" /></label>
        <button class="icon-button relative" aria-label="Notifications">♧<span class="absolute -right-1 -top-1 grid h-3 w-3 place-items-center rounded-full bg-[#ff5361] text-[7px] text-white">3</span></button>
        <div class="grid h-8 w-8 place-items-center rounded-full bg-[#254563] text-[10px] font-bold text-white">R</div>
      </div>
    </header>

    <div class="mx-auto max-w-[1550px] px-3 pb-7 sm:px-5">
      <section class="mb-4 flex items-end justify-between gap-3"><div><p class="eyebrow">System</p><h1 class="mt-1 text-[32px] font-semibold text-[#1f3a52]">System settings</h1><p class="mt-2 text-sm text-[#748998]">Configure your renewable energy monitoring platform.</p></div><button class="save-button" on:click={() => alert('Settings saved.')}>Save changes</button></section>

      <div class="grid gap-3 lg:grid-cols-[185px_1fr]">
        <nav class="settings-nav panel h-fit overflow-hidden">{#each settingTabs as tab}<button class:active={activeSetting === tab} on:click={() => (activeSetting = tab)}>{tab}</button>{/each}</nav>

        <section class="panel p-6">
          {#if activeSetting === 'General'}
            <div class="setting-section"><h2>Company information</h2><div class="form-grid"><label>Company name<input value="PT. Rekayasa Mekatronika Solusindo" /></label><label>Company code<input value="RMS-2024" /></label><label>Address<input value="Jl. Kebayoran Baru No. 45, Jakarta Selatan" /></label><label>Phone number<input value="+62 21 7270 1234" /></label><label>Contact email<input value="info@rms.co.id" /></label></div></div>
            <div class="setting-section"><h2>Regional preferences</h2><div class="form-grid"><label>Time zone<select><option>Asia/Jakarta (WIB, UTC+7)</option></select></label><label>Language<select><option>English</option></select></label><label>Date format<select><option>DD/MM/YYYY</option></select></label><label>Energy unit<select><option>kWh / MWh / GWh (auto)</option></select></label></div></div>
            <div class="setting-section"><h2>About the system</h2><div class="info-grid"><div><small>Platform version</small><strong>Renewable Energy Platform v2.4.1</strong></div><div><small>API version</small><strong>REST API v3.2</strong></div><div><small>Last updated</small><strong>2026-09-01</strong></div><div><small>License</small><strong>Enterprise - active until 2027-12-31</strong></div></div></div>
          {:else if activeSetting === 'Users'}
            <div class="setting-section"><div class="section-head"><div><h2>User management</h2><p>Manage platform users and access permissions.</p></div><button class="save-button" on:click={() => alert('User creation form is ready.')}>+ Add user</button></div><div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Plant access</th><th>Status</th><th>Last login</th></tr></thead><tbody>{#each [['Admin RMS','admin@rms.co.id','Super Admin','All plants','Active','2026-09-18 14:27'],['Budi Santoso','budi.s@rms.co.id','Technician','PLTS Gedung 3 FT','Active','2026-09-17 09:11'],['Andi Prasetyo','andi.p@rms.co.id','Technician','PLTS di Indomaker','Active','2026-09-16 16:44']] as user}<tr><td><strong>{user[0]}</strong></td><td>{user[1]}</td><td><span class="role">{user[2]}</span></td><td>{user[3]}</td><td><span class="status">● {user[4]}</span></td><td>{user[5]}</td></tr>{/each}</tbody></table></div></div>
          {:else if activeSetting === 'Notifications'}
            <div class="setting-section"><h2>Notification channels</h2>{#each [['Email','Send reports and alarms to the registered email',true],['SMS','Send SMS for critical alarms',false],['Push notification','Real-time browser notifications',true]] as item}<div class="toggle-row"><div><strong>{item[0]}</strong><p>{item[1]}</p></div><button class:enabled={item[2]} class="toggle" on:click={() => (item[2] = !item[2])}><span></span></button></div>{/each}</div><div class="setting-section"><h2>Alarm notification types</h2>{#each [['Fault','Critical failure requiring immediate attention',true],['Alarm','Operational warning requiring action',true],['Notice','Normal status information',false]] as item}<div class="toggle-row"><div><strong>{item[0]}</strong><p>{item[1]}</p></div><button class:enabled={item[2]} class="toggle" on:click={() => (item[2] = !item[2])}><span></span></button></div>{/each}</div>
          {:else if activeSetting === 'Thresholds'}
            <div class="setting-section"><div class="section-head"><div><h2>Alarm threshold configuration</h2><p>These values automatically trigger alarm notifications.</p></div><button class="toolbar-button" on:click={() => alert('Thresholds reset to defaults.')}>Reset to defaults</button></div>{#each [['Inverter power (min)','Warning when output falls below nominal','85','%'],['PV module temperature (max)','Alarm when module temperature exceeds the limit','75','°C'],['Daily PR (min)','Notify when the daily performance ratio is low','70','%'],['Inverter efficiency (min)','Alarm when conversion efficiency drops','95','%'],['String current imbalance','Detect partial shading or string damage','15','%']] as limit}<div class="limit-row"><div><strong>{limit[0]}</strong><p>{limit[1]}</p></div><div class="limit-input"><input value={limit[2]} /><span>{limit[3]}</span></div></div>{/each}<div class="notice">♧ Threshold changes take effect in real time after saving.</div></div>
          {:else}
            <div class="setting-section"><h2>Data retention</h2><div class="form-grid"><label>Raw data interval<select><option>5 minutes</option></select></label><label>Raw data retention<select><option>12 months</option></select></label><label>Aggregated data retention<select><option>10 years</option></select></label></div></div><div class="setting-section"><h2>Data exports</h2><div class="export-grid">{#each [['Daily energy report','6.74 MWh · 18 Sep 2026','CSV'],['September monthly report','160.18 MWh · Sep 2026','XLSX'],['This month alarms','3 active alarms','CSV'],['Work order history','10 WO · 2026','CSV']] as item}<div><strong>{item[0]}</strong><p>{item[1]}</p><button class="toolbar-button" on:click={() => alert(`Preparing ${item[0]} as ${item[2]}.`)}>↧ {item[2]}</button></div>{/each}</div></div><div class="setting-section"><h2>Backup & synchronization</h2><div class="info-grid"><div><small>Last backup</small><strong>2026-09-18 02:00 WIB</strong></div><div><small>Database size</small><strong>4.83 GB</strong></div><div><small>Synchronization status</small><strong>Online - 14:27:52 WIB</strong></div><div><small>API server</small><strong>api.ress.sems.web.id</strong></div></div></div>
          {/if}
        </section>
      </div>
    </div>
  </main>
</div>

<style>
  .sidebar{transform:translateX(-100%);transition:transform .2s ease}.sidebar.open{transform:translateX(0)}.nav-button { display: flex; min-height: 54px; width: 100%; flex-direction: column; align-items: center; justify-content: center; gap: 4px; border-radius: 8px; color: rgba(255, 255, 255, 0.7); font-size: 11px; font-weight: 600; }.nav-button:hover,.nav-button.current{background:#fff7ed;color:#ff4f00}.nav-glyph{font-size:17px;line-height:17px}.icon-button{display:grid;height:30px;width:30px;place-items:center;border-radius:5px;color:#6c8190}.eyebrow{color:#ff4f00;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.panel{border:1px solid #e8edef;border-radius:10px;background:#fff}.save-button{height:35px;border-radius:6px;background:#1f3544;padding:0 14px;color:#fff;font-size:11px;font-weight:700}.settings-nav button{display:block;width:100%;padding:12px 17px;text-align:left;font-size:12px;color:#385269}.settings-nav button.active{border-left:2px solid #ff4f00;background:#fffaf6;color:#ff4f00;font-weight:700}.setting-section{border-bottom:1px solid #edf1f2;padding-bottom:24px;margin-bottom:24px}.setting-section:last-child{border:0;margin-bottom:0}.setting-section h2{font-size:14px;font-weight:600}.setting-section>p,.section-head p{margin-top:5px;color:#8195a3;font-size:11px}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px 18px;margin-top:18px}.form-grid label{color:#5d7585;font-size:10px}.form-grid input,.form-grid select{display:block;width:100%;height:34px;margin-top:6px;border:1px solid #dce7eb;border-radius:6px;padding:0 10px;color:#365166;background:#fff;font-size:11px;outline:none}.info-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:15px}.info-grid div{min-height:62px;border-radius:6px;background:#f8fafb;padding:12px}.info-grid small{display:block;color:#879aa7;font-size:9px}.info-grid strong{display:block;margin-top:7px;font-size:11px}.section-head{display:flex;justify-content:space-between;gap:15px}.table-wrap{margin-top:16px;overflow-x:auto}.table-wrap table{width:100%;min-width:700px;font-size:10px}.table-wrap th{padding:10px 8px;border-bottom:1px solid #e5edef;text-align:left;color:#718795}.table-wrap td{padding:12px 8px;border-bottom:1px solid #edf2f3;color:#607889}.table-wrap td strong{color:#2d4659}.role,.status{display:inline-block;border-radius:4px;padding:4px 6px;background:#eef6f4;color:#11a37f;font-size:9px}.status{background:#edf9f5}.toggle-row,.limit-row{display:flex;align-items:center;justify-content:space-between;gap:20px;border:1px solid #e5edef;border-bottom:0;padding:16px 18px}.toggle-row:first-of-type,.limit-row:first-of-type{margin-top:15px;border-radius:7px 7px 0 0}.toggle-row:last-of-type,.limit-row:last-of-type{border-bottom:1px solid #e5edef;border-radius:0 0 7px 7px}.toggle-row strong,.limit-row strong{font-size:11px}.toggle-row p,.limit-row p{margin-top:5px;color:#8397a4;font-size:10px}.toggle{height:22px;width:39px;border-radius:999px;background:#dbe5e9;padding:3px}.toggle span{display:block;height:16px;width:16px;border-radius:50%;background:#fff;transition:transform .2s}.toggle.enabled{background:#ff8c20}.toggle.enabled span{transform:translateX(17px)}.toolbar-button{height:32px;border:1px solid #d9e4ea;border-radius:6px;padding:0 11px;background:#fff;color:#5d7687;font-size:10px}.limit-input{display:flex;align-items:center;gap:8px}.limit-input input{width:80px;height:31px;border:1px solid #dce7eb;border-radius:6px;text-align:right;padding:0 9px;font-size:11px}.limit-input span{color:#8397a4;font-size:10px}.notice{margin-top:15px;border:1px solid #ffd7a4;border-radius:6px;padding:11px;color:#c67b23;background:#fffaf1;font-size:10px}.export-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:15px}.export-grid>div{position:relative;min-height:64px;border:1px solid #e5edef;border-radius:7px;padding:13px}.export-grid strong{font-size:11px}.export-grid p{margin-top:5px;color:#8397a4;font-size:10px}.export-grid button{position:absolute;right:10px;top:16px}@media(max-width:700px){.form-grid,.info-grid,.export-grid{grid-template-columns:1fr}.section-head{display:block}.section-head .toolbar-button{margin-top:12px}}@media(min-width:1024px){.sidebar{transform:translateX(0)}}
</style>



