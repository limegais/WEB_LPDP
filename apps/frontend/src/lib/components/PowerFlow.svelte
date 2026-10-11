<script lang="ts">
  // Power flow data — reactive based on selected plant
  export let selectedPlant: string = 'All Plants';

  type NodeState = {
    solar: { power: string; voltage: string; current: string; active: boolean };
    wind: { power: string; voltage: string; current: string; active: boolean };
    inverter: { power: string; voltage: string; current: string; };
    battery: { power: string; voltage: string; current: string; soc: number; status: string };
    grid: { power: string; voltage: string; current: string; exporting: boolean };
    load: { power: string; voltage: string; current: string };
  };

  const plantFlowData: Record<string, NodeState> = {
    'All Plants': {
      solar:   { power: '2.14 kW', voltage: '420 V', current: '5.1 A', active: true },
      wind:    { power: '0.87 kW', voltage: '380 V', current: '2.3 A', active: true },
      inverter:{ power: '2.96 kW', voltage: '220 V', current: '13.4 A' },
      battery: { power: '0.40 kW', voltage: '48.6 V', current: '8.3 A', soc: 75, status: 'Charging' },
      grid:    { power: '1.20 kW', voltage: '220 V', current: '5.5 A', exporting: true },
      load:    { power: '1.36 kW', voltage: '220 V', current: '6.2 A' },
    },
    'PLTS Gedung 3 FT': {
      solar:   { power: '3.46 kW', voltage: '435 V', current: '7.9 A', active: true },
      wind:    { power: '0.00 kW', voltage: '0 V', current: '0 A', active: false },
      inverter:{ power: '3.46 kW', voltage: '220 V', current: '15.7 A' },
      battery: { power: '0.60 kW', voltage: '49.8 V', current: '12.0 A', soc: 92, status: 'Charging' },
      grid:    { power: '2.10 kW', voltage: '220 V', current: '9.5 A', exporting: true },
      load:    { power: '0.76 kW', voltage: '220 V', current: '3.5 A' },
    },
    'PLTS di Indomaker': {
      solar:   { power: '1.82 kW', voltage: '395 V', current: '4.6 A', active: true },
      wind:    { power: '1.20 kW', voltage: '380 V', current: '3.2 A', active: true },
      inverter:{ power: '3.02 kW', voltage: '220 V', current: '13.7 A' },
      battery: { power: '0.80 kW', voltage: '44.2 V', current: '18.1 A', soc: 45, status: 'Discharging' },
      grid:    { power: '0.00 kW', voltage: '220 V', current: '0 A', exporting: false },
      load:    { power: '3.82 kW', voltage: '220 V', current: '17.4 A' },
    },
  };

  $: flow = plantFlowData[selectedPlant] || plantFlowData['All Plants'];
  $: battColor = flow.battery.soc >= 80 ? '#19b89e' : flow.battery.soc >= 40 ? '#ff4f00' : '#f35a65';
</script>

<div class="pf-wrap">
  <svg viewBox="0 0 520 260" class="pf-svg" aria-label="Power Flow Diagram">
    <defs>
      <!-- Glow filters -->
      <filter id="glow-solar"><feGaussianBlur stdDeviation="2.5" result="c"/><feMerge><feMergeNode in="c"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="glow-wind"><feGaussianBlur stdDeviation="2.5" result="c"/><feMerge><feMergeNode in="c"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="glow-green"><feGaussianBlur stdDeviation="2" result="c"/><feMerge><feMergeNode in="c"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <!-- Arrow markers -->
      <marker id="arr-orange" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
        <path d="M0,0 L0,6 L6,3 z" fill="#ff4f00"/>
      </marker>
      <marker id="arr-teal" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
        <path d="M0,0 L0,6 L6,3 z" fill="#19b89e"/>
      </marker>
      <marker id="arr-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
        <path d="M0,0 L0,6 L6,3 z" fill="#00b7ff"/>
      </marker>
      <marker id="arr-gray" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
        <path d="M0,0 L0,6 L6,3 z" fill="#91a1aa"/>
      </marker>
      <marker id="arr-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
        <path d="M0,0 L0,6 L6,3 z" fill="#f35a65"/>
      </marker>
    </defs>

    <!-- ============ NODES ============ -->

    <!-- SOLAR PV node -->
    <g opacity={flow.solar.active ? 1 : 0.3}>
      <rect x="10" y="30" width="80" height="64" rx="8" fill="#fff" stroke="#ff4f00" stroke-width="1.5" filter="url(#glow-solar)"/>
      <text x="50" y="52" text-anchor="middle" font-size="18" fill="#ff4f00">☀</text>
      <text x="50" y="66" text-anchor="middle" font-size="7.5" font-weight="700" fill="#3d5264">Renewable (PV)</text>
      <text x="50" y="77" text-anchor="middle" font-size="8" font-weight="700" fill="#ff4f00">{flow.solar.power}</text>
      <text x="50" y="87" text-anchor="middle" font-size="6.5" fill="#7a919f">{flow.solar.voltage} · {flow.solar.current}</text>
    </g>

    <!-- WIND node -->
    <g opacity={flow.wind.active ? 1 : 0.3}>
      <rect x="10" y="120" width="80" height="64" rx="8" fill="#fff" stroke="#00b7ff" stroke-width="1.5" filter="url(#glow-wind)"/>
      <text x="50" y="143" text-anchor="middle" font-size="18" fill="#00b7ff">🌬</text>
      <text x="50" y="157" text-anchor="middle" font-size="7.5" font-weight="700" fill="#3d5264">Wind Turbine</text>
      <text x="50" y="168" text-anchor="middle" font-size="8" font-weight="700" fill="#00b7ff">{flow.wind.power}</text>
      <text x="50" y="178" text-anchor="middle" font-size="6.5" fill="#7a919f">{flow.wind.voltage} · {flow.wind.current}</text>
    </g>

    <!-- INVERTER node -->
    <rect x="175" y="90" width="80" height="64" rx="8" fill="#17324a" stroke="#2a4d6e" stroke-width="1.5"/>
    <text x="215" y="115" text-anchor="middle" font-size="13" fill="#19b89e">⚡</text>
    <text x="215" y="128" text-anchor="middle" font-size="7.5" font-weight="700" fill="#fff">Inverter</text>
    <text x="215" y="139" text-anchor="middle" font-size="8" font-weight="700" fill="#19b89e">{flow.inverter.power}</text>
    <text x="215" y="149" text-anchor="middle" font-size="6.5" fill="#8aacbe">{flow.inverter.voltage} · {flow.inverter.current}</text>

    <!-- BATTERY node -->
    <rect x="340" y="160" width="80" height="64" rx="8" fill="#fff" stroke={battColor} stroke-width="1.5"/>
    <text x="380" y="183" text-anchor="middle" font-size="15" fill={battColor}>🔋</text>
    <text x="380" y="196" text-anchor="middle" font-size="7.5" font-weight="700" fill="#3d5264">Battery ESS</text>
    <text x="380" y="207" text-anchor="middle" font-size="8" font-weight="700" fill={battColor}>{flow.battery.soc}% SoC</text>
    <text x="380" y="217" text-anchor="middle" font-size="6.5" fill="#7a919f">{flow.battery.power} · {flow.battery.status}</text>

    <!-- GRID node -->
    <rect x="340" y="30" width="80" height="64" rx="8" fill="#fff" stroke={flow.grid.exporting ? '#19b89e' : '#00b7ff'} stroke-width="1.5"/>
    <text x="380" y="53" text-anchor="middle" font-size="14" fill={flow.grid.exporting ? '#19b89e' : '#00b7ff'}>🏭</text>
    <text x="380" y="67" text-anchor="middle" font-size="7.5" font-weight="700" fill="#3d5264">{flow.grid.exporting ? 'Grid (Export)' : 'Grid (Import)'}</text>
    <text x="380" y="78" text-anchor="middle" font-size="8" font-weight="700" fill={flow.grid.exporting ? '#19b89e' : '#00b7ff'}>{flow.grid.power}</text>
    <text x="380" y="88" text-anchor="middle" font-size="6.5" fill="#7a919f">{flow.grid.voltage} · {flow.grid.current}</text>

    <!-- LOAD node -->
    <rect x="430" y="90" width="80" height="64" rx="8" fill="#fff" stroke="#f35a65" stroke-width="1.5"/>
    <text x="470" y="113" text-anchor="middle" font-size="14" fill="#f35a65">🏢</text>
    <text x="470" y="127" text-anchor="middle" font-size="7.5" font-weight="700" fill="#3d5264">Load</text>
    <text x="470" y="138" text-anchor="middle" font-size="8" font-weight="700" fill="#f35a65">{flow.load.power}</text>
    <text x="470" y="148" text-anchor="middle" font-size="6.5" fill="#7a919f">{flow.load.voltage} · {flow.load.current}</text>

    <!-- ============ CONNECTIONS ============ -->

    <!-- Solar → Inverter -->
    <line x1="90" y1="62" x2="175" y2="115" stroke="#ff4f00" stroke-width="2" stroke-dasharray="6,3" marker-end="url(#arr-orange)" opacity={flow.solar.active ? 1 : 0.2}>
      <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="1s" repeatCount="indefinite"/>
    </line>

    <!-- Wind → Inverter -->
    <line x1="90" y1="152" x2="175" y2="130" stroke="#00b7ff" stroke-width="2" stroke-dasharray="6,3" marker-end="url(#arr-blue)" opacity={flow.wind.active ? 1 : 0.2}>
      <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="1.2s" repeatCount="indefinite"/>
    </line>

    <!-- Inverter → Grid or Grid → Inverter -->
    {#if flow.grid.exporting}
      <line x1="255" y1="108" x2="340" y2="65" stroke="#19b89e" stroke-width="2" stroke-dasharray="6,3" marker-end="url(#arr-teal)">
        <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="0.9s" repeatCount="indefinite"/>
      </line>
    {:else}
      <line x1="340" y1="65" x2="255" y2="108" stroke="#00b7ff" stroke-width="2" stroke-dasharray="6,3" marker-end="url(#arr-blue)">
        <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="0.9s" repeatCount="indefinite"/>
      </line>
    {/if}

    <!-- Inverter → Battery -->
    {#if flow.battery.status === 'Charging'}
      <line x1="255" y1="135" x2="340" y2="180" stroke="#19b89e" stroke-width="2" stroke-dasharray="6,3" marker-end="url(#arr-teal)">
        <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="1.4s" repeatCount="indefinite"/>
      </line>
    {:else if flow.battery.status === 'Discharging' || flow.battery.status === 'Low'}
      <line x1="340" y1="180" x2="255" y2="135" stroke="#f35a65" stroke-width="2" stroke-dasharray="6,3" marker-end="url(#arr-red)">
        <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="1.4s" repeatCount="indefinite"/>
      </line>
    {:else}
      <line x1="255" y1="135" x2="340" y2="180" stroke="#91a1aa" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.4"/>
    {/if}

    <!-- Inverter → Load -->
    <line x1="255" y1="122" x2="430" y2="122" stroke="#f35a65" stroke-width="2" stroke-dasharray="6,3" marker-end="url(#arr-red)">
      <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="0.8s" repeatCount="indefinite"/>
    </line>
  </svg>

  <!-- Legend row -->
  <div class="pf-legend">
    <span class="pf-leg"><span class="dot" style="background:#ff4f00"></span> Renewable PV</span>
    <span class="pf-leg"><span class="dot" style="background:#00b7ff"></span> Wind</span>
    <span class="pf-leg"><span class="dot" style="background:#19b89e"></span> Export/Charge</span>
    <span class="pf-leg"><span class="dot" style="background:#f35a65"></span> Load/Discharge</span>
    <span class="pf-leg"><span class="dot" style="background:#91a1aa"></span> Idle</span>
  </div>
</div>

<style>
  .pf-wrap {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  .pf-svg {
    flex: 1;
    width: 100%;
    min-height: 0;
    overflow: visible;
  }

  .pf-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 4px 0 2px;
    border-top: 1px solid #edf2f5;
    flex-shrink: 0;
  }

  .pf-leg {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 8px;
    color: #7a919f;
  }

  .dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }
</style>

