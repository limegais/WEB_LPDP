<script lang="ts">
  let menuOpen = false;
  let activeMenu = 'Push notifications';
  let notificationTab = 'Smart alarm analysis settings';
  let selectedPlant = 'UNPAD (Medical Faculty)';
  let alarmFilter = 'All';
  let alarmSearch = '';
  let faqSearch = '';
  let expandedFaq = '';
  let savedMessage = '';

  const menus = ['Push notifications', 'Help center'];
  const notificationTabs = ['Smart alarm analysis settings', 'Offline notification'];

  const alarmRows = [
    { name: 'Plant stops operation', target: 'Plant', status: 'Blocked' },
    { name: 'DC bus box N-way branch current is zero or low', target: 'String', status: 'Open' },
    { name: 'The current of branch N of the string inverter is zero or low', target: 'String', status: 'Blocked' },
    { name: 'Inverter stops running', target: 'Inverter', status: 'Blocked' },
    { name: 'Plant operation reliability', target: 'Plant', status: 'Blocked' },
    { name: 'String inverter operation reliability', target: 'Inverter', status: 'Blocked' },
    { name: 'DC combiner box operation reliability', target: 'Combiner box', status: 'Blocked' },
    { name: 'Communication interruption', target: 'General information', status: 'Blocked' },
    { name: 'Constant string current of string inverter', target: 'String', status: 'Blocked' },
    { name: 'DC combiner box string current constant value', target: 'String', status: 'Blocked' },
    { name: 'The string efficiency of the string inverter is low', target: 'String', status: 'Blocked' },
    { name: 'DC combiner box string low efficiency', target: 'String', status: 'Blocked' },
    { name: 'Low PR value', target: 'Plant', status: 'Blocked' },
    { name: 'No plant yield', target: 'Plant', status: 'Open' }
  ];

  const faqs = [
    { group: 'Account related', question: 'How to obtain an account?', answer: 'Ask your organization administrator to create a SolarCloud account and assign plant permissions.' },
    { group: 'Account related', question: 'What if I forget my login password?', answer: 'Use Forgot password on the login screen and follow the verification email.' },
    { group: 'Account related', question: 'How do I change my login password?', answer: 'Open System Settings, choose Security, and select Change password.' },
    { group: 'Account related', question: 'Account deletion', answer: 'Contact your organization administrator or support team to request account deletion.' },
    { group: 'Plant related', question: 'How do I create a plant?', answer: 'Open Plants, select Add plant, then complete the plant profile and timezone.' },
    { group: 'Plant related', question: 'How to share a plant?', answer: 'Open a plant, choose User access, and invite a user with the appropriate role.' },
    { group: 'Plant related', question: 'How to delete a plant?', answer: 'Open plant settings and confirm Delete plant. This requires administrator permission.' },
    { group: 'Inverter related', question: 'How to view inverter data through direct connection?', answer: 'Connect to the inverter network, then use Device details to open the direct data view.' },
    { group: 'Inverter related', question: 'Grid overvoltage', answer: 'Check the grid voltage trend and follow the configured fault response plan.' },
    { group: 'Inverter related', question: 'Grid undervoltage', answer: 'Verify grid supply stability and inspect the inverter AC connection.' },
    { group: 'Communication module related', question: 'Eye indicator status description', answer: 'The indicator color identifies power, network, and communication states.' },
    { group: 'Communication module related', question: 'E-Net indicator status description', answer: 'E-Net shows the current Ethernet link and network communication state.' },
    { group: 'Other issues', question: 'How to view the user manual?', answer: 'Select User manual from Quick access to open the product documentation.' },
    { group: 'Other issues', question: 'How to add iSolarCloud to the email whitelist?', answer: 'Add the official SolarCloud sender domain to your organization email whitelist.' }
  ];

  $: filteredAlarms = alarmRows.filter((row) => {
    const matchesSearch = row.name.toLowerCase().includes(alarmSearch.toLowerCase());
    const matchesFilter = alarmFilter === 'All' || row.target === alarmFilter;
    return matchesSearch && matchesFilter;
  });

  $: filteredFaqs = faqs.filter((faq) => `${faq.group} ${faq.question}`.toLowerCase().includes(faqSearch.toLowerCase()));
  $: faqGroups = [...new Set(filteredFaqs.map((faq) => faq.group))];

  function saveAlarm(index: number) {
    savedMessage = `Alarm rule ${index + 1} saved`;
    window.setTimeout(() => (savedMessage = ''), 2200);
  }

  const navigation = [
    { label: 'Home', icon: '⌂', href: '/dashboard' },
    { label: 'Plant', icon: '▦', href: '/plant' },
    { label: 'Device', icon: '▤', href: '/devices' },
    { label: 'Maintenance', icon: '⌁', href: '/maintenance' },
    { label: 'Report', icon: '▧', href: '/report' },
    { label: 'System', icon: '⚙', href: '/settings' }
  ];
</script>

<svelte:head><title>Support | SolarCloud</title></svelte:head>

<div class="min-h-screen bg-[#f4f7f8] text-[#17324a]">
  <aside class:open={menuOpen} class="sidebar fixed inset-y-0 left-0 z-30 flex w-[72px] flex-col border-r border-[#e5ecef] bg-white">
    <div class="flex h-14 items-center justify-center border-b border-[#f0f2f4] text-2xl text-[#ff991f]">☼</div>
    <nav class="mt-2 flex flex-1 flex-col gap-1 px-2">
      {#each navigation as item}
        <a href={item.href} class="nav-button" title={item.label}><span class="nav-glyph">{item.icon}</span><span>{item.label}</span></a>
      {/each}
    </nav>
    <a href="/support" class="nav-button current mx-2 mb-3" title="Support"><span class="nav-glyph">?</span><span>Support</span></a>
  </aside>

  <main class="lg:pl-[72px]">
    <header class="flex h-14 items-center gap-3 border-b border-[#e9eef0] px-4 sm:px-7">
      <button class="icon-button lg:hidden" on:click={() => (menuOpen = !menuOpen)} aria-label="Open navigation">☰</button>
      <p class="hidden text-[11px] text-[#7e909d] sm:block">Good afternoon, <strong class="text-[#3b5062]">PT. RMS</strong></p>
      <span class="hidden text-[11px] text-[#7e909d] sm:block">Friday, 18 Sep 2026</span>
      <div class="ml-auto flex items-center gap-3">
        <label class="hidden h-8 w-52 items-center gap-2 rounded bg-white px-3 text-[#a8b5bd] sm:flex"><span>⌕</span><input class="w-full bg-transparent text-[10px] outline-none" placeholder="Enter a keyword" /></label>
        <button class="icon-button" aria-label="Notifications">♧</button>
        <div class="grid h-8 w-8 place-items-center rounded-full bg-[#254563] text-[10px] font-bold text-white">R</div>
      </div>
    </header>

    <div class="mx-auto max-w-[1800px] px-3 py-3 sm:px-5">
      <section class="support-frame">
        <aside class="subnav">
          <h1>Support</h1>
          <div class="subnav-list">
            {#each menus as menu}
              <button class:active={activeMenu === menu} on:click={() => (activeMenu = menu)}>{menu}</button>
            {/each}
          </div>
        </aside>

        <div class="support-content">
          {#if activeMenu === 'Push notifications'}
            <div class="section-tabs">
              {#each notificationTabs as tab}
                <button class:active={notificationTab === tab} on:click={() => (notificationTab = tab)}>{tab}</button>
              {/each}
            </div>
            <div class="filter-bar">
              <select bind:value={selectedPlant}><option>UNPAD (Medical Faculty)</option><option>All plants</option><option>PLTS Sumpal Camps</option></select>
              <select bind:value={alarmFilter}><option>All</option><option>Plant</option><option>String</option><option>Inverter</option><option>Combiner box</option><option>General information</option></select>
              <input bind:value={alarmSearch} placeholder="Alarm name" />
              <button class="search-btn" on:click={() => (savedMessage = `${filteredAlarms.length} alarm rules found`)}>Search</button>
            </div>
            <div class="table-card">
              <table class="w-full text-left">
                <thead><tr><th>No.</th><th>Alarm name</th><th>Alarm target</th><th>Alarm status</th><th>Action</th></tr></thead>
                <tbody>
                  {#each filteredAlarms as row, index}
                    <tr><td>{index + 1}</td><td>{row.name}</td><td>{row.target}</td><td><span class:open-status={row.status === 'Open'} class="status-text">{row.status}</span></td><td><button class="edit-btn" on:click={() => saveAlarm(index)} aria-label={`Edit ${row.name}`}>✎</button></td></tr>
                  {:else}
                    <tr><td colspan="5" class="empty">No alarm rules match your search.</td></tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else}
            <div class="help-head">
              <div><h2>Quick access</h2><p>Find the most common SolarCloud tasks and answers.</p></div>
              <label class="help-search"><span>⌕</span><input bind:value={faqSearch} placeholder="Search help center" /></label>
            </div>
            <div class="quick-grid">
              <button on:click={() => (savedMessage = 'Registration guide opened')}><span>♙</span><b>New user registration</b></button>
              <button on:click={() => (savedMessage = 'Password guide opened')}><span>♧</span><b>Change password</b></button>
              <button on:click={() => (savedMessage = 'User manual opened')}><span>▣</span><b>User manual</b></button>
            </div>
            <div class="faq-head"><h2>FAQs</h2><span>{filteredFaqs.length} articles</span></div>
            <div class="faq-grid">
              {#each faqGroups as group}
                <section class="faq-group"><h3>{group}</h3>{#each filteredFaqs.filter((faq) => faq.group === group) as faq}<button class:expanded={expandedFaq === faq.question} class="faq-item" on:click={() => (expandedFaq = expandedFaq === faq.question ? '' : faq.question)}><span>?</span><div><strong>{faq.question}</strong>{#if expandedFaq === faq.question}<p>{faq.answer}</p>{/if}</div><i>›</i></button>{/each}</section>
              {:else}<p class="empty">No help articles match your search.</p>{/each}
            </div>
          {/if}
        </div>
      </section>
    </div>
  </main>

  {#if savedMessage}<div class="toast">{savedMessage}</div>{/if}
</div>

<style>
  .sidebar{transform:translateX(-100%);transition:transform .2s ease}.sidebar.open{transform:translateX(0)}.nav-button{display:flex;min-height:49px;width:100%;flex-direction:column;align-items:center;justify-content:center;gap:3px;border-radius:5px;color:#6e8492;font-size:9px}.nav-button:hover,.nav-button.current{background:#fff7ed;color:#fb8b20}.nav-glyph{font-size:17px;line-height:17px}.icon-button{display:grid;height:30px;width:30px;place-items:center;border-radius:5px;color:#6c8190}.icon-button:hover{background:#edf3f4}
  .support-frame{display:grid;grid-template-columns:185px minmax(0,1fr);min-height:calc(100vh - 86px);border:1px solid #e7edf0;border-radius:12px;background:#fff;overflow:hidden}.subnav{border-right:1px solid #e8eef1;background:linear-gradient(180deg,#fbfdfe,#f4f8fa);padding:18px 10px}.subnav h1{margin:0 4px;font-size:17px;color:#203b52}.subnav-list{display:grid;gap:5px;margin-top:13px}.subnav-list button{text-align:left;border-radius:7px;padding:8px 7px;color:#667d8c;font-size:11px}.subnav-list button:hover,.subnav-list button.active{background:#e9e9eb;color:#1d354b;font-weight:700}.support-content{padding:16px 14px}.section-tabs{display:flex;gap:28px;border-bottom:1px solid #edf1f3}.section-tabs button{position:relative;padding:0 0 10px;color:#80919d;font-size:11px}.section-tabs button.active{color:#1c344b;font-weight:700}.section-tabs button.active:after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:2px;background:#1f3548}.filter-bar{display:flex;flex-wrap:wrap;gap:9px;margin:14px 0}.filter-bar select,.filter-bar input{height:34px;min-width:160px;border:1px solid #edf0f2;border-radius:6px;background:#fafafa;padding:0 10px;color:#627987;font-size:11px}.filter-bar input{min-width:150px}.search-btn{height:34px;border:1px solid #aebcc4;border-radius:6px;padding:0 15px;background:white;color:#1b354a;font-size:11px}.table-card{overflow-x:auto;border-top:1px solid #edf1f3}.table-card table{min-width:760px}.table-card th{padding:11px 10px;border-bottom:1px solid #e8edf0;color:#607786;font-size:10px}.table-card td{padding:11px 10px;border-bottom:1px solid #edf1f3;color:#294458;font-size:11px}.status-text{color:#647b89}.status-text.open-status{color:#2c678e}.edit-btn{color:#345269;font-size:16px}.empty{text-align:center!important;color:#8698a3!important;padding:30px!important}.help-head{display:flex;justify-content:space-between;align-items:flex-start;gap:15px}.help-head h2,.faq-head h2{margin:0;color:#1e374e;font-size:15px}.help-head p{margin:4px 0 0;color:#80929d;font-size:11px}.help-search{display:flex;align-items:center;gap:7px;width:230px;border:1px solid #e5edf0;border-radius:7px;padding:0 10px;height:34px;color:#8ba0ab}.help-search input{width:100%;border:0;outline:0;font-size:11px}.quick-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:20px 0 30px}.quick-grid button{display:flex;flex-direction:column;align-items:center;gap:7px;color:#345b80;font-size:11px}.quick-grid button span{font-size:25px;color:#2b526f}.quick-grid button:hover{color:#f28d24}.faq-head{display:flex;align-items:center;gap:10px;margin-bottom:13px}.faq-head span{color:#8a9ba5;font-size:10px}.faq-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:22px}.faq-group h3{margin:0 0 9px;color:#637987;font-size:11px;font-weight:500}.faq-item{display:grid;grid-template-columns:14px 1fr 10px;gap:5px;width:100%;padding:7px 0;text-align:left;color:#3971a8;font-size:10px}.faq-item>span{display:grid;place-items:center;width:12px;height:12px;border:1px solid #3971a8;border-radius:50%;font-size:8px}.faq-item i{font-style:normal}.faq-item strong{font-weight:500}.faq-item p{margin:6px 0 0;color:#718794;line-height:1.5}.faq-item.expanded{color:#1c496d}.toast{position:fixed;right:22px;bottom:22px;border-radius:7px;background:#1f3a52;color:#fff;padding:10px 14px;font-size:11px;box-shadow:0 8px 20px #17324a2b}
  @media (min-width:1024px){.sidebar{transform:translateX(0)}}@media (max-width:1000px){.support-frame{grid-template-columns:1fr}.subnav{border-right:0;border-bottom:1px solid #e8eef1}.subnav-list{grid-template-columns:repeat(2,1fr)}.faq-grid{grid-template-columns:repeat(2,1fr)}}@media (max-width:600px){.faq-grid{grid-template-columns:1fr}.help-head{flex-direction:column}.help-search{width:100%}}
</style>
