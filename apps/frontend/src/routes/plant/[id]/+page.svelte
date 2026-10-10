<script lang="ts">
  import { page } from '$app/stores';
  
  // Dynamic plant name based on URL param
  const plantName = decodeURIComponent($page.params.id);
  
  const weather = {
    desc: 'Few Clouds',
    temp: '37 °C',
    wind: '13 km/h',
    humidity: '78 %'
  };
  const updateTime = '09/10/2026 14:30:00';
  
  let overview = {
    energy: '27.80',
    revenue: '40.16'
  };
  
  const environmental = {
    coal: '0 kg',
    trees: '782 kTrees',
    co2: '33 Tons'
  };

  // State
  let activeTab = 'Dashboard';
  let overviewPeriod = 'Day';
  let viewMode = '2d'; // '3d' or '2d'
  let chartTab = 'Power Curve';

  // Dummy devices for "Devices" tab
  const devices = [
    { id: 'INV-001', type: 'Inverter', status: 'Running', power: '20.5 kW' },
    { id: 'INV-002', type: 'Inverter', status: 'Running', power: '15.2 kW' },
    { id: 'MET-001', type: 'Smart Meter', status: 'Running', power: '-' }
  ];

  // Dummy alarms for "Alarms" tab
  const alarms = [
    { time: '09/10/2026 10:15', device: 'INV-001', message: 'Grid Voltage High', severity: 'Warning' }
  ];

  // Reactivity to simulate dynamic data
  $: if (overviewPeriod === 'Day') {
    overview = { energy: '27.80', revenue: '40.16' };
  } else if (overviewPeriod === 'Month') {
    overview = { energy: '840.5', revenue: '1,214.3' };
  } else if (overviewPeriod === 'Year') {
    overview = { energy: '10,240', revenue: '14,800' };
  }

  // Chart points generator for mock SVG
  const generateChartPoints = () => {
    let points = "";
    // x from 0 to 1000, y from 0 to 200 (reversed so 0 is bottom)
    for(let i=0; i<300; i++) {
      let x = 200 + i*2;
      let y = 190;
      if (i > 50 && i < 250) {
        // peak around i=150
        let base = Math.sin((i-50)/200 * Math.PI) * 120;
        let noise = Math.random() * 40 - 20;
        y = 190 - (base + noise);
      }
      points += `${x},${y} `;
    }
    return points;
  };
  const mockChartPoints = generateChartPoints();

</script>

<svelte:head>
  <title>Plant Detail - {plantName}</title>
</svelte:head>

<!-- min-h-screen but allow scrolling -->
<div class="min-h-screen bg-[#1c1c1c] text-[#dcdcdc] font-sans flex flex-col overflow-x-hidden">
  
  <!-- Top Navigation Bar -->
  <header class="flex items-center justify-between px-4 h-14 border-b border-[#2d2d2d] bg-[#1a1a1a] sticky top-0 z-50">
    <div class="flex items-center gap-3">
      <a href="/plant" class="text-[#a0a0a0] hover:text-white transition-colors" aria-label="Go back">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
      </a>
      <h1 class="text-xl font-bold text-white flex items-center gap-2">
        {plantName}
        <span class="bg-[#123624] text-[#22c55e] text-[10px] px-2 py-0.5 rounded-full font-semibold border border-[#1b5235]">Running</span>
      </h1>
      <button class="text-[#a0a0a0] hover:text-white mt-1">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
    
    <div class="flex items-center gap-4">
      <div class="flex items-center bg-[#252525] rounded-full px-3 py-1 gap-3">
        <div class="w-2 h-2 rounded-full bg-[#505050]"></div>
        <span class="text-xs text-[#a0a0a0]">1</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-[#a0a0a0]" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </div>
      <button class="text-[#a0a0a0] hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg></button>
      <button class="text-[#a0a0a0] hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
    </div>
  </header>
  
  <!-- Interactive Tabs -->
  <nav class="flex gap-6 px-4 h-12 items-center border-b border-[#2d2d2d] bg-[#1a1a1a] text-sm sticky top-14 z-40">
    <button 
      class="h-full border-b-2 px-1 transition-colors {activeTab === 'Dashboard' ? 'border-[#ff4f00] text-[#ff4f00] font-medium' : 'border-transparent text-[#a0a0a0] hover:text-[#dcdcdc]'}"
      on:click={() => activeTab = 'Dashboard'}
    >
      Dashboard
    </button>
    <button 
      class="h-full border-b-2 px-1 transition-colors {activeTab === 'Devices' ? 'border-[#ff4f00] text-[#ff4f00] font-medium' : 'border-transparent text-[#a0a0a0] hover:text-[#dcdcdc]'}"
      on:click={() => activeTab = 'Devices'}
    >
      Devices
    </button>
    <button 
      class="h-full border-b-2 px-1 transition-colors {activeTab === 'Alarms' ? 'border-[#ff4f00] text-[#ff4f00] font-medium' : 'border-transparent text-[#a0a0a0] hover:text-[#dcdcdc]'}"
      on:click={() => activeTab = 'Alarms'}
    >
      Alarms
    </button>
  </nav>

  <!-- Main Content Area -->
  <main class="flex-1 p-4 sm:p-6 w-full max-w-[1600px] mx-auto pb-20">
    
    {#if activeTab === 'Dashboard'}
      <div class="flex flex-col gap-6">
        <!-- Top Section: Visualizer & Cards -->
        <div class="flex flex-col lg:flex-row gap-6">
          
          <!-- Left Section: Visualization (3D or 2D) -->
          <section class="flex-1 bg-[#222222] rounded-xl border border-[#333333] relative overflow-hidden flex flex-col min-h-[500px] shadow-lg">
            
            <!-- Header (Weather & Controls) -->
            <div class="flex justify-between items-start p-5 z-20">
              <div class="flex items-center gap-3">
                <div class="text-4xl">🌤️</div>
                <div>
                  <div class="flex items-end gap-2">
                    <span class="font-bold text-white">{weather.desc}</span>
                    <span class="text-xl font-bold text-white">{weather.temp}</span>
                  </div>
                  <div class="text-[10px] text-[#8a8a8a] mt-0.5">
                    Wind Speed : {weather.wind}, Humidity: {weather.humidity}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-3 text-[11px] text-[#8a8a8a]">
                <span class="hidden sm:inline">Update Time: {updateTime}</span>
                <button class="hover:text-white transition-colors" title="Refresh">↻</button>
                <div class="flex bg-[#2c2c2c] rounded-full p-1 border border-[#3a3a3a] gap-1">
                  <!-- 3D Toggle -->
                  <button 
                    class="p-1.5 rounded-full transition-colors {viewMode === '3d' ? 'bg-[#ff4f00] text-white' : 'text-[#a0a0a0] hover:text-white hover:bg-[#333]'}"
                    on:click={() => viewMode = '3d'}
                    title="3D View"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  </button>
                  <!-- 2D Node Toggle -->
                  <button 
                    class="p-1.5 rounded-full transition-colors {viewMode === '2d' ? 'bg-[#ff4f00] text-white' : 'text-[#a0a0a0] hover:text-white hover:bg-[#333]'}"
                    on:click={() => viewMode = '2d'}
                    title="2D Flow View"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Graphic Area -->
            <div class="flex-1 relative flex items-center justify-center p-4">
              
              {#if viewMode === '3d'}
                <!-- Connecting Lines & Labels overlay for 3D -->
                <div class="absolute inset-0 z-10 pointer-events-none fade-in">
                  <div class="absolute top-[20%] left-[55%] flex flex-col items-center">
                    <span class="text-xl font-normal text-white drop-shadow-md">3.053 <span class="text-sm text-[#a0a0a0]">kW</span></span>
                    <span class="text-xs text-[#22c55e] mt-1 font-semibold">Solar ›</span>
                  </div>
                  <div class="absolute top-[28%] left-[32%] bg-[#1c1c1c]/50 px-2 py-1 rounded backdrop-blur-sm">
                    <span class="text-xs text-[#a0a0a0]">Grid</span>
                  </div>
                  <div class="absolute bottom-[20%] left-[30%] bg-[#1c1c1c]/50 px-2 py-1 rounded backdrop-blur-sm">
                    <span class="text-xs text-[#a0a0a0]">Load</span>
                  </div>
                  <div class="absolute top-[48%] left-[46%] w-2 h-8 bg-[#22c55e] transform -rotate-45 shadow-[0_0_15px_#22c55e] rounded-full opacity-80 animate-bounce"></div>
                </div>
                
                <img src="/images/house-power-flow.jpg" alt="3D Power Flow" class="w-full max-w-[700px] h-auto object-contain z-0 fade-in" style="mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%);" />
              
              {:else}
                <!-- 2D Node Graph Flow -->
                <div class="w-full h-full flex flex-col items-center justify-center relative fade-in">
                  
                  <!-- Connection SVG Lines -->
                  <svg class="absolute inset-0 w-full h-full pointer-events-none" style="z-index: 1;">
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#a0a0a0" />
                      </marker>
                    </defs>
                    <!-- Left branch to Grid -->
                    <path d="M 50% 40% Q 30% 40% 30% 55%" fill="none" stroke="#555" stroke-width="2" marker-end="url(#arrow)" />
                    <!-- Right branch to Load -->
                    <path d="M 50% 40% Q 70% 40% 70% 55%" fill="none" stroke="#555" stroke-width="2" marker-end="url(#arrow)" />
                  </svg>

                  <!-- Solar Node (Top Center) -->
                  <div class="absolute top-[15%] flex flex-col items-center justify-center w-[120px] h-[120px] rounded-full border-2 border-[#22c55e] bg-[#22c55e]/10 shadow-[0_0_20px_rgba(34,197,94,0.15)] z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    <span class="text-xs text-[#a0a0a0]">Solar</span>
                    <span class="text-lg font-normal text-white">3.053 <span class="text-[9px]">kW</span></span>
                  </div>
                  
                  <!-- Grid Node (Bottom Left) -->
                  <div class="absolute top-[55%] left-[30%] -translate-x-1/2 flex flex-col items-center justify-center w-[90px] h-[90px] rounded-full border border-[#555] bg-[#1c1c1c] z-10 hover:border-[#888] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#a0a0a0] mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span class="text-xs text-[#a0a0a0]">Grid</span>
                  </div>
                  
                  <!-- Load Node (Bottom Right) -->
                  <div class="absolute top-[55%] left-[70%] -translate-x-1/2 flex flex-col items-center justify-center w-[90px] h-[90px] rounded-full border border-[#555] bg-[#1c1c1c] z-10 hover:border-[#888] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#a0a0a0] mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    <span class="text-xs text-[#a0a0a0]">Load</span>
                  </div>

                </div>
              {/if}

            </div>
          </section>
          
          <!-- Right Section: Cards -->
          <section class="w-full lg:w-[420px] flex flex-col gap-6">
            
            <!-- Overview Card -->
            <div class="bg-[#222222] border border-[#333333] rounded-xl flex flex-col p-5 shadow-lg hover:border-[#444] transition-colors h-[280px]">
              <div class="flex justify-between items-center mb-8">
                <h2 class="text-sm font-bold text-[#e0e0e0] flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#ff4f00]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Overview <span class="text-[10px] text-[#6a6a6a] font-normal border border-[#444] rounded-full w-4 h-4 inline-flex items-center justify-center cursor-help">i</span>
                </h2>
                <div class="flex gap-2">
                  <div class="bg-[#2a2a2a] border border-[#3a3a3a] text-xs px-2 py-1.5 rounded flex items-center justify-between w-[120px]">
                    <span class="text-[#888] cursor-pointer hover:text-white">‹</span>
                    <span>09/10/2026</span>
                    <span class="text-[#888] cursor-pointer hover:text-white">›</span>
                  </div>
                  <select 
                    class="bg-[#2a2a2a] border border-[#3a3a3a] text-xs px-2 py-1.5 rounded outline-none w-[75px]"
                    bind:value={overviewPeriod}
                  >
                    <option value="Day">Day</option>
                    <option value="Month">Month</option>
                    <option value="Year">Year</option>
                  </select>
                </div>
              </div>
              
              <div class="flex-1 flex items-center justify-center gap-8">
                <!-- Energy Generation -->
                <div class="flex flex-col items-center group">
                  <div class="w-10 h-10 rounded-full bg-[#1b3d2b] text-[#22c55e] flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  </div>
                  <div class="text-4xl font-normal text-white">{overview.energy} <span class="text-[11px] text-[#a0a0a0]">kWh</span></div>
                  <div class="text-[11px] text-[#888] mt-2">Energy Generation</div>
                </div>
                
                <!-- Generation Revenue -->
                <div class="flex flex-col items-center group">
                  <div class="w-10 h-10 rounded-full bg-[#41311b] text-[#ff4f00] flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div class="text-4xl font-normal text-white">{overview.revenue} <span class="text-[11px] text-[#a0a0a0]">k IDR</span></div>
                  <div class="text-[11px] text-[#888] mt-2">Generation Revenue</div>
                </div>
              </div>
            </div>
            
            <!-- Environmental Contributions Card -->
            <div class="bg-[#222222] border border-[#333333] rounded-xl flex flex-col p-5 shadow-lg hover:border-[#444] transition-colors flex-1">
              <h2 class="text-sm font-bold text-[#e0e0e0] flex items-center gap-2 mb-4">
                <span class="text-lg">🍃</span> Environmental Contributions
              </h2>
              
              <div class="flex justify-between gap-3 h-full">
                <div class="flex-1 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a] flex flex-col items-center justify-center p-3">
                  <div class="text-[#a855f7] mb-2 text-2xl">☁️</div>
                  <div class="text-sm font-bold text-white">{environmental.coal}</div>
                  <div class="text-[9px] text-[#888] text-center mt-1 uppercase">Coal Saved</div>
                </div>
                <div class="flex-1 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a] flex flex-col items-center justify-center p-3">
                  <div class="text-[#22c55e] mb-2 text-2xl">🌲</div>
                  <div class="text-sm font-bold text-white">{environmental.trees}</div>
                  <div class="text-[9px] text-[#888] text-center mt-1 uppercase">Trees Planted</div>
                </div>
                <div class="flex-1 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a] flex flex-col items-center justify-center p-3">
                  <div class="text-[#00b7ff] mb-2 text-2xl">🌍</div>
                  <div class="text-sm font-bold text-white">{environmental.co2}</div>
                  <div class="text-[9px] text-[#888] text-center mt-1 uppercase">CO₂ Reduct.</div>
                </div>
              </div>
            </div>
            
          </section>
        </div>

        <!-- Bottom Section: Graphs -->
        <section class="bg-[#222222] border border-[#333333] rounded-xl shadow-lg mt-2 overflow-hidden flex flex-col">
          <!-- Graph Header Tabs -->
          <div class="flex justify-between items-center px-5 border-b border-[#333] bg-[#222]">
            <div class="flex gap-2">
              {#each ['Power Curve', 'Energy Monitoring', 'Generation Comparison', 'Heatmap'] as tab}
                <button 
                  class="py-4 px-2 text-xs transition-colors border-b-2 {chartTab === tab ? 'border-[#ff4f00] text-white font-semibold' : 'border-transparent text-[#888] hover:text-[#ccc]'}"
                  on:click={() => chartTab = tab}
                >
                  {#if tab === 'Power Curve'}
                    <span class="mr-1">∿</span> 
                  {/if}
                  {tab}
                </button>
              {/each}
            </div>
            <div class="flex items-center gap-3">
              <button class="text-xs text-[#888] hover:text-white flex items-center gap-1 border border-[#333] rounded px-2 py-1">
                Data Comparison ›
              </button>
              <button class="text-[#888] hover:text-white p-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              </button>
            </div>
          </div>
          
          <!-- Graph Content -->
          <div class="p-6 relative">
            <div class="flex justify-between items-start">
              
              <!-- Peak Power Label (Left) -->
              <div class="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-3 inline-block z-10 shadow-md">
                <div class="text-xl font-bold text-white">7.10 <span class="text-[10px] text-[#a0a0a0] font-normal">kW</span></div>
                <div class="text-[10px] text-[#888] mt-0.5">Peak PV Power</div>
              </div>
              
              <!-- Date Picker (Right) -->
              <div class="bg-[#2a2a2a] border border-[#3a3a3a] text-xs px-2 py-1.5 rounded flex items-center justify-between w-[130px] z-10">
                <span class="text-[#888] cursor-pointer hover:text-white">‹</span>
                <span>09/10/2026</span>
                <span class="text-[#888] cursor-pointer hover:text-white">›</span>
              </div>
            </div>

            <!-- SVG Mock Line Chart -->
            <div class="w-full h-[280px] mt-4 relative">
              <!-- Y Axis labels & Grid lines -->
              <div class="absolute inset-0 flex flex-col justify-between pt-2 pb-6 text-[10px] text-[#666]">
                {#each ['8.00', '7.00', '6.00', '5.00', '4.00', '3.00', '2.00', '1.00', '0.00'] as val}
                  <div class="flex items-center gap-2 h-0">
                    <span class="w-6 text-right relative -top-2">{val}</span>
                    <div class="flex-1 border-t border-[#333]"></div>
                  </div>
                {/each}
              </div>
              
              <!-- X Axis labels -->
              <div class="absolute bottom-0 left-8 right-0 flex justify-between text-[10px] text-[#666]">
                <span>00:00</span>
                <span>04:00</span>
                <span>08:00</span>
                <span>12:00</span>
                <span>16:00</span>
                <span>20:00</span>
                <span></span>
              </div>

              <!-- The actual Line Chart -->
              <div class="absolute inset-0 left-8 bottom-6">
                <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1000 200">
                  <polyline 
                    points={mockChartPoints} 
                    fill="none" 
                    stroke="#ff4f00" 
                    stroke-width="1.5"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>
      </div>
      
    {:else if activeTab === 'Devices'}
      <!-- Devices Tab -->
      <!-- ... omitted for brevity in thought, keeping in file ... -->
      <div class="bg-[#222222] border border-[#333333] rounded-xl shadow-lg p-6 min-h-[400px]">
        <h2 class="text-lg font-bold text-white mb-6">Connected Devices</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-[#333] text-[#a0a0a0]">
                <th class="py-3 px-4">Device ID</th>
                <th class="py-3 px-4">Type</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">Current Power</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each devices as device}
                <tr class="border-b border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors">
                  <td class="py-3 px-4 font-medium text-white">{device.id}</td>
                  <td class="py-3 px-4 text-[#dcdcdc]">{device.type}</td>
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-[#123624] text-[#22c55e] border border-[#1b5235]">
                      <span class="w-1.5 h-1.5 rounded-full bg-[#22c55e]"></span>
                      {device.status}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-[#dcdcdc]">{device.power}</td>
                  <td class="py-3 px-4 text-right">
                    <button class="text-[#ff4f00] hover:text-[#ff4f00] hover:underline text-xs">View Details</button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
      
    {:else if activeTab === 'Alarms'}
      <!-- Alarms Tab -->
      <div class="bg-[#222222] border border-[#333333] rounded-xl shadow-lg p-6 min-h-[400px]">
        <h2 class="text-lg font-bold text-white mb-6">Recent Alarms</h2>
        {#if alarms.length === 0}
          <div class="text-center text-[#888] py-10">No alarms to display.</div>
        {:else}
          <div class="flex flex-col gap-3">
            {#each alarms as alarm}
              <div class="flex items-center justify-between p-4 bg-[#2a2a2a] border-l-4 border-[#ff4f00] rounded shadow-sm hover:bg-[#333] transition-colors">
                <div>
                  <div class="text-white font-semibold flex items-center gap-2">
                    <span class="text-lg">⚠️</span> {alarm.message}
                  </div>
                  <div class="text-xs text-[#888] mt-1">{alarm.device} • {alarm.time}</div>
                </div>
                <div class="px-3 py-1 bg-[#41311b] text-[#ff4f00] rounded text-xs font-medium border border-[#6b4712]">
                  {alarm.severity}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

  </main>
</div>

<style>
  :global(body) {
    background-color: #1c1c1c;
  }
  .fade-in {
    animation: fadeIn 0.4s ease-in-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>

