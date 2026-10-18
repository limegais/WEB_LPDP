<script lang="ts">
  import Chart from '$lib/components/Chart.svelte';

  // Navigation & View State
  let menuOpen = false;
  let selectedPlant = 'All plants';
  let reportTab: 'Energi' | 'Performa' | 'CO₂' | 'Alarm' = 'Energi';
  
  // Date Picker States (seperti ditanggalan)
  let periodMode: 'Bulan' | 'Harian' | 'Rentang' | 'Tahunan' = 'Bulan';
  let selectedDate = '2026-09-18';
  let selectedMonth = '2026-09';
  let startDate = '2026-09-01';
  let endDate = '2026-09-18';
  let selectedYear = '2026';

  let searchQuery = '';
  let sortField: 'date' | 'energy' | 'pr' | 'co2' = 'date';
  let sortAsc = false;

  // Toast Feedback
  let toastMessage = '';
  let toastTimer: ReturnType<typeof setTimeout> | null = null;
  function showToast(msg: string) {
    toastMessage = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastMessage = ''; }, 2600);
  }

  const reportTabs: Array<'Energi' | 'Performa' | 'CO₂' | 'Alarm'> = ['Energi', 'Performa', 'CO₂', 'Alarm'];

  // ==========================================
  // PLANT PROFILES & TECHNICAL SPECIFICATIONS
  // ==========================================
  interface InverterDetail {
    id: string;
    model: string;
    sn: string;
    pDc: number;
    pAc: number;
    efficiency: number;
    temp: number;
    status: string;
  }

  interface PlantProfile {
    id: string;
    name: string;
    displayName: string;
    location: string;
    coordinates: string;
    capacityDC: string;
    capacityAC: string;
    moduleCount: string;
    inverterCount: string;
    inverterModel: string;
    codDate: string;
    gridType: string;
    uptime: string;
    status: string;
    pr: number;
    specificYield: string;
    totalYield: string;
    targetYield: string;
    achievementPct: number;
    savingsTotal: string;
    co2Reduction: string;
    scale: number;
    inverters: InverterDetail[];
  }

  const plantProfiles: Record<string, PlantProfile> = {
    'All plants': {
      id: 'ALL',
      name: 'All plants',
      displayName: 'Portofolio Gabungan PLTS (Semua Plant)',
      location: 'Solo (Jawa Tengah) & Bandung (Jawa Barat)',
      coordinates: 'Multi-Site Jateng & Jabar',
      capacityDC: '209.52 kWp',
      capacityAC: '160.00 kW',
      moduleCount: '540 Modul Monocrystalline Tier-1',
      inverterCount: '3 Unit Inverter On-Grid',
      inverterModel: 'Sungrow SG50CX (2x) & Huawei SUN2000-60KTL (1x)',
      codDate: 'Februari – Agustus 2023',
      gridType: 'Multi-Site 3-Phase 380V (PLN On-Grid)',
      uptime: '99.7%',
      status: 'Normal Operasional',
      pr: 82.6,
      specificYield: '1,128 kWh/kWp',
      totalYield: '1,277.30 MWh',
      targetYield: '1,290.00 MWh',
      achievementPct: 99.0,
      savingsTotal: 'Rp 1,84 Miliar',
      co2Reduction: '1,021.80 Ton CO₂',
      scale: 1.0,
      inverters: [
        { id: 'FT-INV-01', model: 'Sungrow SG50CX', sn: 'SG50-202302-0941', pDc: 48.2, pAc: 47.4, efficiency: 98.3, temp: 41.8, status: 'Online' },
        { id: 'FT-INV-02', model: 'Sungrow SG50CX', sn: 'SG50-202302-0942', pDc: 47.9, pAc: 47.1, efficiency: 98.3, temp: 42.4, status: 'Online' },
        { id: 'IM-INV-01', model: 'Huawei SUN2000-60KTL', sn: 'HW60K-202308-412', pDc: 58.4, pAc: 57.5, efficiency: 98.5, temp: 43.1, status: 'Online' }
      ]
    },
    'PLTS Gedung 3 FT': {
      id: 'FT-SOLO',
      name: 'PLTS Gedung 3 FT',
      displayName: 'PLTS Rooftop Gedung 3 Fakultas Teknik',
      location: 'Surakarta (Solo), Jawa Tengah',
      coordinates: '-7.5583° S, 110.8561° E',
      capacityDC: '123.12 kWp',
      capacityAC: '100.00 kW',
      moduleCount: '324 Modul Monocrystalline 380 Wp',
      inverterCount: '2 Unit Inverter On-Grid',
      inverterModel: 'Sungrow SG50CX (50 kW x 2 Unit)',
      codDate: '15 Februari 2023',
      gridType: 'On-Grid 3-Fasa 380V (Net-Metering EXIM)',
      uptime: '99.8%',
      status: 'Normal Operasional',
      pr: 83.1,
      specificYield: '1,142 kWh/kWp',
      totalYield: '350.26 MWh',
      targetYield: '354.00 MWh',
      achievementPct: 98.9,
      savingsTotal: 'Rp 505,77 Juta',
      co2Reduction: '280.21 Ton CO₂',
      scale: 0.396,
      inverters: [
        { id: 'INV-01', model: 'Sungrow SG50CX', sn: 'SG50-202302-0941', pDc: 48.2, pAc: 47.4, efficiency: 98.3, temp: 41.8, status: 'Online' },
        { id: 'INV-02', model: 'Sungrow SG50CX', sn: 'SG50-202302-0942', pDc: 47.9, pAc: 47.1, efficiency: 98.3, temp: 42.4, status: 'Online' }
      ]
    },
    'PLTS di Indomaker': {
      id: 'IM-BDG',
      name: 'PLTS di Indomaker',
      displayName: 'PLTS Rooftop PT. Indomaker Dinamika',
      location: 'Cimahi, Bandung Barat, Jawa Barat',
      coordinates: '-6.8924° S, 107.5412° E',
      capacityDC: '86.40 kWp',
      capacityAC: '60.00 kW',
      moduleCount: '216 Modul Monocrystalline 400 Wp',
      inverterCount: '1 Unit Inverter On-Grid',
      inverterModel: 'Huawei SUN2000-60KTL-M0 (60 kW)',
      codDate: '20 Agustus 2023',
      gridType: 'On-Grid Industri B-2 3-Fasa 380V',
      uptime: '99.5%',
      status: 'Normal Operasional',
      pr: 80.8,
      specificYield: '1,118 kWh/kWp',
      totalYield: '534.45 MWh',
      targetYield: '538.00 MWh',
      achievementPct: 99.3,
      savingsTotal: 'Rp 771,74 Juta',
      co2Reduction: '427.56 Ton CO₂',
      scale: 0.604,
      inverters: [
        { id: 'INV-01', model: 'Huawei SUN2000-60KTL-M0', sn: 'HW60K-202308-412', pDc: 58.4, pAc: 57.5, efficiency: 98.5, temp: 43.1, status: 'Online' }
      ]
    }
  };

  $: activeProfile = plantProfiles[selectedPlant] || plantProfiles['All plants'];
  $: plantScale = activeProfile.scale;

  // ==========================================
  // DATASETS (Monthly YTD, Daily, Yearly)
  // ==========================================
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep'];

  // Base monthly data (Portfolio total)
  const monthlyData = {
    energy: [112, 98, 126, 132, 145, 154, 137, 148, 149.3], // MWh
    target: [120, 110, 130, 135, 145, 155, 145, 150, 150.0], // MWh
    pr: [82.4, 79.8, 83.1, 82.5, 84.0, 85.2, 81.3, 83.7, 82.6], // %
    co2: [89.6, 78.4, 100.8, 105.6, 116.0, 123.2, 109.6, 118.4, 119.4], // Ton
    alarms: [2, 3, 1, 0, 1, 0, 2, 1, 1], // Insiden
    lossKwh: [420, 680, 210, 0, 180, 0, 390, 210, 240] // kWh
  };

  // Yearly Historical
  const yearlyData = {
    years: ['2023', '2024', '2025', '2026 (YTD)'],
    energy: [1420, 1580, 1690, 1277.3],
    target: [1400, 1550, 1650, 1290.0],
    pr: [80.5, 81.2, 82.0, 82.6],
    co2: [1136, 1264, 1352, 1021.8],
    alarms: [14, 11, 8, 11]
  };

  // Daily records (September 2026)
  const rawDailyRows = [
    { date: '2026-09-01', energy: 5200, target: 6254, pr: 82.6, eqHours: 1.59, peakPower: 547, co2: 3.96, irradiance: 4.10, vDc: 620, iDc: 8.8 },
    { date: '2026-09-02', energy: 4800, target: 6154, pr: 87.4, eqHours: 1.47, peakPower: 505, co2: 3.65, irradiance: 4.28, vDc: 615, iDc: 8.2 },
    { date: '2026-09-03', energy: 6100, target: 6154, pr: 76.4, eqHours: 1.87, peakPower: 642, co2: 4.64, irradiance: 4.61, vDc: 628, iDc: 10.2 },
    { date: '2026-09-04', energy: 5900, target: 6296, pr: 76.3, eqHours: 1.81, peakPower: 621, co2: 4.49, irradiance: 4.10, vDc: 624, iDc: 9.9 },
    { date: '2026-09-05', energy: 6400, target: 6416, pr: 78.0, eqHours: 1.96, peakPower: 674, co2: 4.87, irradiance: 3.99, vDc: 632, iDc: 10.6 },
    { date: '2026-09-06', energy: 5700, target: 6393, pr: 82.3, eqHours: 1.75, peakPower: 600, co2: 4.34, irradiance: 3.90, vDc: 622, iDc: 9.6 },
    { date: '2026-09-07', energy: 6200, target: 6191, pr: 80.3, eqHours: 1.90, peakPower: 653, co2: 4.72, irradiance: 4.82, vDc: 630, iDc: 10.3 },
    { date: '2026-09-08', energy: 5500, target: 6475, pr: 86.7, eqHours: 1.68, peakPower: 579, co2: 4.19, irradiance: 5.34, vDc: 620, iDc: 9.3 },
    { date: '2026-09-09', energy: 4900, target: 6403, pr: 75.2, eqHours: 1.50, peakPower: 516, co2: 3.73, irradiance: 4.08, vDc: 616, iDc: 8.4 },
    { date: '2026-09-10', energy: 6000, target: 6320, pr: 87.1, eqHours: 1.84, peakPower: 632, co2: 4.57, irradiance: 5.17, vDc: 626, iDc: 10.1 },
    { date: '2026-09-11', energy: 5800, target: 6327, pr: 82.1, eqHours: 1.78, peakPower: 611, co2: 4.41, irradiance: 4.40, vDc: 624, iDc: 9.8 },
    { date: '2026-09-12', energy: 6300, target: 6120, pr: 78.9, eqHours: 1.93, peakPower: 663, co2: 4.79, irradiance: 4.38, vDc: 631, iDc: 10.5 },
    { date: '2026-09-13', energy: 5100, target: 6108, pr: 72.9, eqHours: 1.56, peakPower: 537, co2: 3.88, irradiance: 5.26, vDc: 618, iDc: 8.7 },
    { date: '2026-09-14', energy: 6400, target: 6432, pr: 79.6, eqHours: 1.96, peakPower: 674, co2: 4.87, irradiance: 5.33, vDc: 633, iDc: 10.6 },
    { date: '2026-09-15', energy: 5600, target: 6205, pr: 76.9, eqHours: 1.72, peakPower: 589, co2: 4.26, irradiance: 5.05, vDc: 621, iDc: 9.5 },
    { date: '2026-09-16', energy: 5300, target: 6400, pr: 78.6, eqHours: 1.62, peakPower: 558, co2: 4.03, irradiance: 4.89, vDc: 619, iDc: 9.0 },
    { date: '2026-09-17', energy: 6000, target: 6438, pr: 77.9, eqHours: 1.84, peakPower: 632, co2: 4.57, irradiance: 4.94, vDc: 627, iDc: 10.1 },
    { date: '2026-09-18', energy: 5800, target: 6477, pr: 81.2, eqHours: 1.78, peakPower: 611, co2: 4.41, irradiance: 4.94, vDc: 625, iDc: 9.8 }
  ];

  // Calendar Date Navigation Helpers
  function prevDay() {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() - 1);
    const min = new Date('2026-09-01');
    if (cur >= min) {
      selectedDate = cur.toISOString().slice(0, 10);
      showToast(`Tanggal: ${selectedDate}`);
    }
  }

  function nextDay() {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + 1);
    const max = new Date('2026-09-18');
    if (cur <= max) {
      selectedDate = cur.toISOString().slice(0, 10);
      showToast(`Tanggal: ${selectedDate}`);
    }
  }

  function prevMonth() {
    const parts = selectedMonth.split('-');
    let y = parseInt(parts[0], 10);
    let m = parseInt(parts[1], 10) - 1;
    if (m < 1) { m = 12; y--; }
    if (y >= 2026 && m >= 1) {
      selectedMonth = `${y}-${m.toString().padStart(2, '0')}`;
      showToast(`Bulan: ${selectedMonth}`);
    }
  }

  function nextMonth() {
    const parts = selectedMonth.split('-');
    let y = parseInt(parts[0], 10);
    let m = parseInt(parts[1], 10) + 1;
    if (m > 12) { m = 1; y++; }
    if (y <= 2026 && m <= 9) {
      selectedMonth = `${y}-${m.toString().padStart(2, '0')}`;
      showToast(`Bulan: ${selectedMonth}`);
    }
  }

  // Selected Day Record
  $: selectedDayRecord = (() => {
    const match = rawDailyRows.find(r => r.date === selectedDate) || rawDailyRows[rawDailyRows.length - 1];
    return {
      date: match.date,
      energy: Math.round(match.energy * plantScale),
      target: Math.round(match.target * plantScale),
      co2: +(match.co2 * plantScale).toFixed(2),
      peakPower: Math.round(match.peakPower * plantScale),
      pr: selectedPlant === 'PLTS Gedung 3 FT' ? +(match.pr * 1.006).toFixed(1) : selectedPlant === 'PLTS di Indomaker' ? +(match.pr * 0.978).toFixed(1) : match.pr,
      eqHours: match.eqHours,
      irradiance: match.irradiance
    };
  })();

  // Filtered Daily Table Rows according to Date Selection & Range
  $: filteredDailyRows = rawDailyRows
    .map(r => ({
      ...r,
      energy: Math.round(r.energy * plantScale),
      target: Math.round(r.target * plantScale),
      co2: +(r.co2 * plantScale).toFixed(2),
      peakPower: Math.round(r.peakPower * plantScale),
      pr: selectedPlant === 'PLTS Gedung 3 FT' ? +(r.pr * 1.006).toFixed(1) : selectedPlant === 'PLTS di Indomaker' ? +(r.pr * 0.978).toFixed(1) : r.pr
    }))
    .filter(r => {
      // Date range filtering
      if (periodMode === 'Rentang') {
        if (r.date < startDate || r.date > endDate) return false;
      }
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return r.date.toLowerCase().includes(q) ||
        r.energy.toString().includes(q) ||
        r.pr.toString().includes(q) ||
        r.peakPower.toString().includes(q);
    })
    .sort((a, b) => {
      let diff = 0;
      if (sortField === 'date') diff = a.date.localeCompare(b.date);
      else if (sortField === 'energy') diff = a.energy - b.energy;
      else if (sortField === 'pr') diff = Number(a.pr) - Number(b.pr);
      else if (sortField === 'co2') diff = a.co2 - b.co2;
      return sortAsc ? diff : -diff;
    });

  // Table Aggregate Totals
  $: totalDailyEnergy = filteredDailyRows.reduce((acc, r) => acc + r.energy, 0);
  $: totalDailyTarget = filteredDailyRows.reduce((acc, r) => acc + r.target, 0);
  $: avgDailyPr = filteredDailyRows.length > 0 
    ? +(filteredDailyRows.reduce((acc, r) => acc + Number(r.pr), 0) / filteredDailyRows.length).toFixed(1)
    : 0;
  $: totalDailyCo2 = +(filteredDailyRows.reduce((acc, r) => acc + r.co2, 0)).toFixed(2);
  $: avgDailyIrr = filteredDailyRows.length > 0
    ? +(filteredDailyRows.reduce((acc, r) => acc + r.irradiance, 0) / filteredDailyRows.length).toFixed(2)
    : 0;

  // Sorting Handler
  function toggleSort(field: 'date' | 'energy' | 'pr' | 'co2') {
    if (sortField === field) {
      sortAsc = !sortAsc;
    } else {
      sortField = field;
      sortAsc = false;
    }
  }

  // ==========================================
  // EXPORT FUNCTIONS (Complete Real CSV & Formal PDF)
  // ==========================================
  function exportToCsv() {
    const periodLabel = periodMode === 'Harian' 
      ? `Tanggal ${selectedDate}` 
      : periodMode === 'Bulan' 
      ? `Bulan ${selectedMonth}` 
      : periodMode === 'Rentang' 
      ? `Rentang ${startDate} s.d. ${endDate}` 
      : `Tahun ${selectedYear}`;

    const metaLines = [
      'LAPORAN EVALUASI KINERJA OPERASIONAL PEMBANGKIT LISTRIK TENAGA SURYA (PLTS)',
      `Nama Unit,${activeProfile.displayName}`,
      `ID Sistem,${activeProfile.id}`,
      `Lokasi,${activeProfile.location} (${activeProfile.coordinates})`,
      `Kapasitas Terpasang,${activeProfile.capacityDC} (DC) / ${activeProfile.capacityAC} (AC)`,
      `Modul Surya,${activeProfile.moduleCount}`,
      `Inverter Terpasang,${activeProfile.inverterModel}`,
      `Sistem Grid,${activeProfile.gridType}`,
      `Tanggal COD,${activeProfile.codDate}`,
      `Periode Laporan,${periodLabel}`,
      `Tanggal Cetak,${new Date().toLocaleDateString('id-ID')}`,
      '',
      'RINGKASAN EKSEKUTIF KINERJA',
      `Total Produksi Energi,${periodMode === 'Harian' ? selectedDayRecord.energy + ' kWh' : activeProfile.totalYield}`,
      `Target Rencana,${periodMode === 'Harian' ? selectedDayRecord.target + ' kWh' : activeProfile.targetYield}`,
      `Kepatuhan Target,${periodMode === 'Harian' ? ((selectedDayRecord.energy / selectedDayRecord.target) * 100).toFixed(1) + '%' : activeProfile.achievementPct + '%'}`,
      `Performance Ratio (PR),${periodMode === 'Harian' ? selectedDayRecord.pr + '%' : activeProfile.pr + '%'} (Standar IEC 61724)`,
      `Specific Yield,${activeProfile.specificYield}`,
      `Estimasi Penghematan Finansial,${periodMode === 'Harian' ? 'Rp ' + ((selectedDayRecord.energy * 1444) / 1000).toLocaleString('id-ID', {maximumFractionDigits: 0}) + ' Ribu' : activeProfile.savingsTotal}`,
      `Reduksi Emisi CO2,${periodMode === 'Harian' ? selectedDayRecord.co2 + ' Ton' : activeProfile.co2Reduction}`,
      `Uptime Ketersediaan Sistem,${activeProfile.uptime}`,
      '',
      'STATUS PERANGKAT INVERTER',
      'ID Inverter,Model,Nomor Seri,Daya DC (kW),Daya AC (kW),Efisiensi (%),Suhu (C),Status Operasi',
      ...activeProfile.inverters.map(inv => 
        `${inv.id},${inv.model},${inv.sn},${inv.pDc},${inv.pAc},${inv.efficiency}%,${inv.temp} C,${inv.status}`
      ),
      '',
      'REKAPITULASI DATA OPERASIONAL HARIAN',
      'Tanggal,Energi Aktual (kWh),Target Proyeksi (kWh),Deviasi (kWh),Deviasi (%),PR (%),Jam Ekuivalen (h),Daya Puncak (kW),Reduksi CO2 (Ton),Insolasi (kWh/m2)'
    ];

    const dataRows = filteredDailyRows.map(r => {
      const dev = r.energy - r.target;
      const devPct = ((dev / r.target) * 100).toFixed(1) + '%';
      return [
        r.date,
        r.energy,
        r.target,
        dev,
        devPct,
        r.pr + '%',
        r.eqHours,
        r.peakPower,
        r.co2,
        r.irradiance
      ].join(',');
    });

    const summaryRow = [
      `Total / Rata-rata (${filteredDailyRows.length} Hari)`,
      totalDailyEnergy,
      totalDailyTarget,
      totalDailyEnergy - totalDailyTarget,
      ((totalDailyEnergy - totalDailyTarget) / totalDailyTarget * 100).toFixed(1) + '%',
      avgDailyPr + '%',
      '1.76 h',
      '674 kW',
      totalDailyCo2,
      avgDailyIrr
    ].join(',');

    const csvContent = [...metaLines, ...dataRows, summaryRow].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileNameSuffix = periodMode === 'Harian' 
      ? selectedDate 
      : periodMode === 'Bulan' 
      ? selectedMonth 
      : periodMode === 'Rentang' 
      ? `${startDate}_sd_${endDate}` 
      : `Tahun_${selectedYear}`;
    link.download = `Laporan_${selectedPlant.replace(/\s+/g, '_')}_${fileNameSuffix}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`File CSV ${selectedPlant} (${fileNameSuffix}) berhasil diunduh`);
  }

  function exportToPdf() {
    showToast(`Mempersiapkan pratinjau cetak PDF untuk ${selectedPlant}...`);
    setTimeout(() => {
      window.print();
    }, 350);
  }

  // ==========================================
  // DYNAMIC ECHARTS OPTION BUILDER
  // ==========================================
  $: chartOption = getDynamicChartOption(periodMode, reportTab, plantScale, selectedDate);

  function getDynamicChartOption(pMode: 'Bulan' | 'Harian' | 'Rentang' | 'Tahunan', tab: 'Energi' | 'Performa' | 'CO₂' | 'Alarm', scale: number, dateStr: string) {
    const commonGrid = { top: 35, right: 25, bottom: 40, left: 52 };
    
    // --- 1. TAB: PRODUKSI ENERGI ---
    if (tab === 'Energi') {
      if (pMode === 'Harian') {
        // Hourly profile curve for the selected day (06:00 to 18:00)
        const hours = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
        const factors = [0.05, 0.18, 0.42, 0.72, 0.91, 0.98, 1.0, 0.95, 0.82, 0.61, 0.35, 0.12, 0.02];
        const peak = selectedDayRecord.peakPower;
        const actualHourly = factors.map(f => +(peak * f * (0.94 + Math.sin(f * 3) * 0.08)).toFixed(1));
        const targetHourly = factors.map(f => +(peak * 1.02 * f).toFixed(1));
        const maxVal = Math.ceil(peak * 1.25);

        return {
          grid: commonGrid,
          tooltip: {
            trigger: 'axis',
            formatter: (params: any) => {
              const hr = params[0].name;
              const act = params[0].value;
              const tgt = params[1]?.value || 0;
              return `<div style="padding:4px 8px; font-size:12px; line-height:1.6;">
                <b>Jam ${hr} (${dateStr})</b><br/>
                <span style="color:#0284c7">● Daya Aktual: <b>${act} kW</b></span><br/>
                <span style="color:#f97316">-- Daya Proyeksi: <b>${tgt} kW</b></span>
              </div>`;
            }
          },
          xAxis: {
            type: 'category',
            data: hours,
            axisLine: { lineStyle: { color: '#cbd5e1' } },
            axisLabel: { color: '#64748b', fontSize: 11 }
          },
          yAxis: {
            type: 'value',
            max: maxVal,
            axisLabel: { color: '#64748b', fontSize: 11, formatter: '{value} kW' },
            splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
          },
          series: [
            {
              name: 'Daya AC Aktual',
              type: 'line',
              smooth: true,
              symbol: 'circle',
              symbolSize: 6,
              itemStyle: { color: '#0284c7' },
              lineStyle: { color: '#0284c7', width: 2.5 },
              areaStyle: {
                color: {
                  type: 'linear',
                  x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: 'rgba(2, 132, 199, 0.28)' },
                    { offset: 1, color: 'rgba(2, 132, 199, 0.01)' }
                  ]
                }
              },
              data: actualHourly
            },
            {
              name: 'Daya Proyeksi',
              type: 'line',
              smooth: true,
              symbol: 'none',
              lineStyle: { color: '#f97316', width: 2, type: 'dashed' },
              itemStyle: { color: '#f97316' },
              data: targetHourly
            }
          ]
        };
      } else if (pMode === 'Bulan') {
        const eData = monthlyData.energy.map(v => +(v * scale).toFixed(1));
        const tData = monthlyData.target.map(v => +(v * scale).toFixed(1));
        const maxVal = Math.ceil(Math.max(...eData, ...tData) * 1.25);
        return {
          grid: commonGrid,
          tooltip: {
            trigger: 'axis',
            formatter: (params: any) => {
              const month = params[0].name;
              const val = params[0].value;
              const tgt = params[1]?.value || 0;
              const ach = tgt > 0 ? ((val / tgt) * 100).toFixed(1) : '100';
              return `<div style="padding:4px 8px; font-size:12px; line-height:1.6;">
                <b>Bulan ${month} 2026</b><br/>
                <span style="color:#0284c7">● Produksi: <b>${val} MWh</b></span><br/>
                <span style="color:#f97316">-- Target: <b>${tgt} MWh</b></span><br/>
                <span style="color:#10b981">Pencapaian: <b>${ach}%</b></span>
              </div>`;
            }
          },
          xAxis: {
            type: 'category',
            data: months,
            axisLine: { lineStyle: { color: '#cbd5e1' } },
            axisLabel: { color: '#64748b', fontSize: 11 }
          },
          yAxis: {
            type: 'value',
            max: maxVal,
            axisLabel: { color: '#64748b', fontSize: 11, formatter: '{value} MWh' },
            splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
          },
          series: [
            {
              name: 'Produksi Aktual',
              type: 'bar',
              barWidth: 26,
              itemStyle: { borderRadius: [4, 4, 0, 0], color: '#0284c7' },
              data: eData
            },
            {
              name: 'Target Rencana',
              type: 'line',
              symbol: 'circle',
              symbolSize: 6,
              lineStyle: { color: '#f97316', width: 2, type: 'dashed' },
              itemStyle: { color: '#f97316' },
              data: tData
            }
          ]
        };
      } else if (pMode === 'Rentang') {
        // Daily bars within the date range
        const days = filteredDailyRows.map(r => r.date.slice(5));
        const dayE = filteredDailyRows.map(r => r.energy);
        const dayT = filteredDailyRows.map(r => r.target);
        return {
          grid: commonGrid,
          tooltip: { trigger: 'axis' },
          xAxis: {
            type: 'category',
            data: days,
            axisLine: { lineStyle: { color: '#cbd5e1' } },
            axisLabel: { color: '#64748b', fontSize: 10 }
          },
          yAxis: {
            type: 'value',
            axisLabel: { color: '#64748b', fontSize: 11, formatter: '{value} kWh' },
            splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
          },
          series: [
            {
              name: 'Energi Harian',
              type: 'bar',
              barWidth: Math.max(12, Math.min(24, Math.floor(400 / (filteredDailyRows.length || 1)))),
              itemStyle: { borderRadius: [3, 3, 0, 0], color: '#0284c7' },
              data: dayE
            },
            {
              name: 'Target Harian',
              type: 'line',
              symbolSize: 5,
              lineStyle: { color: '#f97316', width: 2, type: 'dashed' },
              itemStyle: { color: '#f97316' },
              data: dayT
            }
          ]
        };
      } else {
        // Tahunan
        const yEData = yearlyData.energy.map(v => +(v * scale).toFixed(1));
        const yTData = yearlyData.target.map(v => +(v * scale).toFixed(1));
        return {
          grid: commonGrid,
          tooltip: { trigger: 'axis' },
          xAxis: {
            type: 'category',
            data: yearlyData.years,
            axisLine: { lineStyle: { color: '#cbd5e1' } },
            axisLabel: { color: '#64748b', fontSize: 11 }
          },
          yAxis: {
            type: 'value',
            axisLabel: { color: '#64748b', fontSize: 11, formatter: '{value} MWh' },
            splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
          },
          series: [
            {
              name: 'Produksi Tahunan',
              type: 'bar',
              barWidth: 38,
              itemStyle: { borderRadius: [4, 4, 0, 0], color: '#0284c7' },
              data: yEData
            },
            {
              name: 'Target Tahunan',
              type: 'line',
              symbolSize: 7,
              lineStyle: { color: '#f97316', width: 2, type: 'dashed' },
              itemStyle: { color: '#f97316' },
              data: yTData
            }
          ]
        };
      }
    }

    // --- 2. TAB: PERFORMANCE RATIO (PR %) ---
    if (tab === 'Performa') {
      const prData = pMode === 'Tahunan' ? yearlyData.pr : monthlyData.pr;
      const xLabels = pMode === 'Tahunan' ? yearlyData.years : months;
      return {
        grid: commonGrid,
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => `<b>${params[0].name}</b><br/>PR: <b>${params[0].value}%</b> (Standar IEC &gt; 80%)`
        },
        xAxis: {
          type: 'category',
          data: xLabels,
          axisLine: { lineStyle: { color: '#cbd5e1' } },
          axisLabel: { color: '#64748b', fontSize: 11 }
        },
        yAxis: {
          type: 'value',
          min: 65,
          max: 95,
          axisLabel: { color: '#64748b', fontSize: 11, formatter: '{value}%' },
          splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
        },
        series: [
          {
            name: 'Performance Ratio',
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            itemStyle: { color: '#08a080' },
            lineStyle: { color: '#08a080', width: 3 },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(8, 160, 128, 0.25)' },
                  { offset: 1, color: 'rgba(8, 160, 128, 0.01)' }
                ]
              }
            },
            markLine: {
              silent: true,
              data: [{ yAxis: 80, name: 'Benchmark 80%' }],
              lineStyle: { color: '#ef4444', type: 'dashed' },
              label: { formatter: '80% (Standar IEC)', position: 'insideEndTop', fontSize: 10 }
            },
            data: prData
          }
        ]
      };
    }

    // --- 3. TAB: CO₂ REDUCTION ---
    if (tab === 'CO₂') {
      const co2Data = (pMode === 'Tahunan' ? yearlyData.co2 : monthlyData.co2).map(v => +(v * scale).toFixed(1));
      const xLabels = pMode === 'Tahunan' ? yearlyData.years : months;
      return {
        grid: commonGrid,
        tooltip: { trigger: 'axis', formatter: '{b}<br/>Reduksi CO₂: <b>{c} Ton</b>' },
        xAxis: {
          type: 'category',
          data: xLabels,
          axisLine: { lineStyle: { color: '#cbd5e1' } },
          axisLabel: { color: '#64748b', fontSize: 11 }
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#64748b', fontSize: 11, formatter: '{value} Ton' },
          splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
        },
        series: [
          {
            name: 'Reduksi Emisi',
            type: 'bar',
            barWidth: 26,
            itemStyle: { borderRadius: [4, 4, 0, 0], color: '#08a080' },
            data: co2Data
          }
        ]
      };
    }

    // --- 4. TAB: ALARM & RELIABILITY ---
    const alarmData = pMode === 'Tahunan' ? yearlyData.alarms : monthlyData.alarms;
    const xLabels = pMode === 'Tahunan' ? yearlyData.years : months;
    return {
      grid: commonGrid,
      tooltip: { trigger: 'axis', formatter: '{b}<br/>Jumlah Insiden: <b>{c} kejadian</b>' },
      xAxis: {
        type: 'category',
        data: xLabels,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
      },
      series: [
        {
          name: 'Insiden Alarm',
          type: 'bar',
          barWidth: 22,
          itemStyle: { borderRadius: [4, 4, 0, 0], color: '#f59e0b' },
          data: alarmData
        }
      ]
    };
  }
</script>

<svelte:head>
  <title>Laporan &amp; Analisis Kinerja PLTS — {activeProfile.name} | RESS</title>
</svelte:head>

<div class="page-shell">
  <!-- Left Navigation Sidebar -->
  <aside class="sidebar {menuOpen ? 'open' : ''}">
    <div class="logo-cell">☀</div>
    <nav class="nav-list">
      <a href="/dashboard" class="nav-button"><span class="nav-glyph">⌂</span><span>Home</span></a>
      <a href="/plant" class="nav-button"><span class="nav-glyph">▦</span><span>Plants</span></a>
      <a href="/devices" class="nav-button"><span class="nav-glyph">▤</span><span>Devices</span></a>
      <a href="/maintenance" class="nav-button"><span class="nav-glyph">⌁</span><span>Maintenance</span></a>
      <a href="/report" class="nav-button current"><span class="nav-glyph">▧</span><span>Reports</span></a>
      <a href="/settings" class="nav-button"><span class="nav-glyph">⚙</span><span>Settings</span></a>
    </nav>
    <a href="/support" class="nav-button nav-help"><span class="nav-glyph">?</span><span>Help</span></a>
  </aside>

  <!-- Main Content Area -->
  <main class="main-area">
    <!-- Top Header Bar -->
    <header class="top-bar">
      <button class="icon-button lg-hidden" on:click={() => (menuOpen = !menuOpen)} aria-label="Open navigation">☰</button>
      <div class="flex items-center gap-2">
        <p class="greeting">Selamat Siang, <strong>PT. RMS</strong></p>
        <span class="text-xs text-slate-300">|</span>
        <span class="date-label">
          {periodMode === 'Harian' ? selectedDate : periodMode === 'Bulan' ? selectedMonth : periodMode === 'Rentang' ? `${startDate} – ${endDate}` : `Tahun ${selectedYear}`}
        </span>
      </div>
      <div class="bar-actions">
        <!-- Plant Selector Dropdown in Top Bar -->
        <div class="flex items-center gap-2">
          <select 
            class="toolbar-input"
            bind:value={selectedPlant}
            on:change={() => showToast(`Menampilkan data: ${selectedPlant}`)}
          >
            <option value="All plants">All plants</option>
            <option value="PLTS Gedung 3 FT">PLTS Gedung 3 FT</option>
            <option value="PLTS di Indomaker">PLTS di Indomaker</option>
          </select>
        </div>

        <button class="icon-button" aria-label="Notifications" title="Notifikasi Sistem">
          <svg class="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span class="notif-dot">3</span>
        </button>
        <div class="avatar" title="PT. RMS Administrator">R</div>
      </div>
    </header>

    <!-- Scrollable Content Body -->
    <div class="content-scroll">
      
      <!-- Page Title & Header Row -->
      <section class="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1">
        <div>
          <div class="text-[10px] font-bold text-[#ff4f00] tracking-wider uppercase">REPORT &amp; ANALYSIS</div>
          <h1 class="text-xl font-bold text-slate-800 mt-1">Laporan &amp; Analisis Kinerja Pembangkit</h1>
          <p class="text-xs text-slate-500 mt-0.5">Data historis produksi energi dan evaluasi performa sistem energi terbarukan.</p>
        </div>

        <!-- Toolbar Selector Controls: Plant + Date Picker (Seperti Ditanggalan) + Export -->
        <div class="flex flex-wrap items-center gap-2 self-start md:self-auto">
          
          <!-- 1. Plant Selection Dropdown -->
          <div class="flex items-center gap-1.5">
            <span class="text-xs text-slate-500 font-medium">Plant:</span>
            <select 
              class="toolbar-input"
              bind:value={selectedPlant}
              on:change={() => showToast(`Memuat data ${selectedPlant}`)}
            >
              <option value="All plants">All plants</option>
              <option value="PLTS Gedung 3 FT">PLTS Gedung 3 FT</option>
              <option value="PLTS di Indomaker">PLTS di Indomaker</option>
            </select>
          </div>

          <!-- 2. Mode Periode Selector -->
          <div class="flex items-center gap-1.5">
            <span class="text-xs text-slate-500 font-medium">Periode:</span>
            <select 
              class="toolbar-input"
              style="min-width: 95px;"
              bind:value={periodMode}
              on:change={() => showToast(`Mode kalender: ${periodMode}`)}
            >
              <option value="Bulan">Bulan</option>
              <option value="Harian">Harian</option>
              <option value="Rentang">Rentang</option>
              <option value="Tahunan">Tahunan</option>
            </select>
          </div>

          <!-- 3. Interactive Calendar Date Picker Input (Seperti Ditanggalan) -->
          <div class="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-lg border border-[#d9e4ea]">
            {#if periodMode === 'Harian'}
              <!-- Previous Day Button -->
              <button class="nav-arrow-btn" on:click={prevDay} title="Hari Sebelumnya">‹</button>
              
              <!-- HTML5 Interactive Native Calendar Date Picker -->
              <input 
                type="date" 
                bind:value={selectedDate} 
                min="2026-09-01" 
                max="2026-09-18" 
                class="calendar-input"
                title="Pilih tanggal dari kalender"
                on:change={() => showToast(`Tanggal terpilih: ${selectedDate}`)}
              />

              <!-- Next Day Button -->
              <button class="nav-arrow-btn" on:click={nextDay} title="Hari Berikutnya">›</button>

            {:else if periodMode === 'Bulan'}
              <!-- Previous Month Button -->
              <button class="nav-arrow-btn" on:click={prevMonth} title="Bulan Sebelumnya">‹</button>
              
              <!-- Month Calendar Picker -->
              <input 
                type="month" 
                bind:value={selectedMonth} 
                min="2026-01" 
                max="2026-09" 
                class="calendar-input"
                title="Pilih bulan dari kalender"
                on:change={() => showToast(`Bulan terpilih: ${selectedMonth}`)}
              />

              <!-- Next Month Button -->
              <button class="nav-arrow-btn" on:click={nextMonth} title="Bulan Berikutnya">›</button>

            {:else if periodMode === 'Rentang'}
              <!-- Date Range Calendar Pickers -->
              <div class="flex items-center gap-1">
                <input 
                  type="date" 
                  bind:value={startDate} 
                  min="2026-09-01" 
                  max="2026-09-18" 
                  class="calendar-input"
                  title="Pilih tanggal mulai"
                />
                <span class="text-xs text-slate-400">s/d</span>
                <input 
                  type="date" 
                  bind:value={endDate} 
                  min="2026-09-01" 
                  max="2026-09-18" 
                  class="calendar-input"
                  title="Pilih tanggal akhir"
                />
              </div>

            {:else}
              <!-- Tahunan -->
              <select 
                class="calendar-input font-medium"
                style="min-width: 95px;"
                bind:value={selectedYear}
                on:change={() => showToast(`Tahun terpilih: ${selectedYear}`)}
              >
                <option value="2026">2026 (YTD)</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            {/if}
          </div>

          <!-- 4. Export Actions -->
          <button class="export-btn export-btn-secondary" on:click={exportToCsv} title="Unduh data teknis lengkap dalam file CSV">
            Export CSV
          </button>
          <button class="export-btn export-btn-primary" on:click={exportToPdf} title="Cetak atau simpan laporan lengkap sebagai PDF">
            Export PDF
          </button>
        </div>
      </section>

      <!-- ========================================== -->
      <!-- 1. PLANT PROFILE & TECHNICAL SPECIFICATIONS CARD -->
      <!-- ========================================== -->
      <section class="panel p-4">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">{activeProfile.id}</span>
              <h2 class="text-base font-bold text-slate-800">{activeProfile.displayName}</h2>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">{activeProfile.location} · {activeProfile.coordinates}</p>
          </div>

          <div class="flex flex-wrap items-center gap-4 text-xs">
            <div class="flex items-center gap-1.5">
              <span class="text-slate-400">Status Operasi:</span>
              <span class="font-semibold text-[#08a080]">● {activeProfile.status}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="text-slate-400">Ketersediaan (Uptime):</span>
              <strong class="text-slate-800">{activeProfile.uptime}</strong>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="text-slate-400">Tanggal Operasi (COD):</span>
              <strong class="text-slate-800">{activeProfile.codDate}</strong>
            </div>
          </div>
        </div>

        <!-- Technical Specification Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 text-xs">
          <div>
            <span class="text-slate-400 block text-[11px]">Kapasitas DC</span>
            <strong class="text-slate-800 text-sm">{activeProfile.capacityDC}</strong>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px]">Kapasitas AC Inverter</span>
            <strong class="text-slate-800 text-sm">{activeProfile.capacityAC}</strong>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px]">Modul Surya</span>
            <strong class="text-slate-800 text-xs">{activeProfile.moduleCount}</strong>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px]">Model Inverter</span>
            <strong class="text-slate-800 text-xs">{activeProfile.inverterModel}</strong>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px]">Tipe Koneksi Grid</span>
            <strong class="text-slate-800 text-xs">{activeProfile.gridType}</strong>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px]">Specific Yield</span>
            <strong class="text-[#08a080] text-sm">{activeProfile.specificYield}</strong>
          </div>
        </div>
      </section>

      <!-- ========================================== -->
      <!-- 2. EXECUTIVE SUMMARY KPI METRIC CARDS -->
      <!-- ========================================== -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        <!-- KPI 1: Total Energi -->
        <div class="kpi-card">
          <div class="kpi-label">
            {periodMode === 'Harian' ? `Produksi Energi (${selectedDate})` : 'Total Produksi Energi (YTD)'}
          </div>
          <div class="mt-2 flex items-baseline gap-1">
            <span class="text-2xl font-bold text-slate-800 tracking-tight">
              {periodMode === 'Harian' ? `${selectedDayRecord.energy.toLocaleString()} kWh` : activeProfile.totalYield}
            </span>
          </div>
          <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Target: {periodMode === 'Harian' ? `${selectedDayRecord.target.toLocaleString()} kWh` : activeProfile.targetYield}
            </span>
            <span class="font-medium text-slate-700">
              {periodMode === 'Harian' 
                ? `${((selectedDayRecord.energy / selectedDayRecord.target) * 100).toFixed(1)}% Tercapai` 
                : `${activeProfile.achievementPct}% Tercapai`}
            </span>
          </div>
        </div>

        <!-- KPI 2: Performance Ratio -->
        <div class="kpi-card">
          <div class="kpi-label">
            {periodMode === 'Harian' ? `PR Hari Ini (${selectedDate})` : 'Performance Ratio (PR)'}
          </div>
          <div class="mt-2 flex items-baseline gap-1">
            <span class="text-2xl font-bold text-[#08a080] tracking-tight">
              {periodMode === 'Harian' ? `${selectedDayRecord.pr}%` : `${activeProfile.pr}%`}
            </span>
          </div>
          <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Standar IEC 61724</span>
            <span class="font-medium text-slate-700">Benchmark &gt; 80%</span>
          </div>
        </div>

        <!-- KPI 3: Estimasi Penghematan Finansial -->
        <div class="kpi-card">
          <div class="kpi-label">
            {periodMode === 'Harian' ? 'Est. Penghematan Hari Ini' : 'Est. Nilai Penghematan'}
          </div>
          <div class="mt-2 flex items-baseline gap-1">
            <span class="text-2xl font-bold text-slate-800 tracking-tight">
              {periodMode === 'Harian' 
                ? `Rp ${((selectedDayRecord.energy * 1444) / 1000).toLocaleString('id-ID', {maximumFractionDigits: 0})} Ribu` 
                : activeProfile.savingsTotal}
            </span>
          </div>
          <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Tarif PLN B-2 / I-3</span>
            <span class="font-medium text-slate-700">Rp 1.444 / kWh</span>
          </div>
        </div>

        <!-- KPI 4: Reduksi Emisi Karbon -->
        <div class="kpi-card">
          <div class="kpi-label">
            {periodMode === 'Harian' ? 'Reduksi CO₂ Hari Ini' : 'Reduksi Emisi Karbon (CO₂)'}
          </div>
          <div class="mt-2 flex items-baseline gap-1">
            <span class="text-2xl font-bold text-slate-800 tracking-tight">
              {periodMode === 'Harian' ? `${selectedDayRecord.co2} Ton` : activeProfile.co2Reduction}
            </span>
          </div>
          <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>{periodMode === 'Harian' ? 'Jam Puncak Matahari (PSH)' : 'Faktor Emisi Grid Jamali'}</span>
            <span class="font-medium text-slate-700">
              {periodMode === 'Harian' ? `${selectedDayRecord.eqHours} h` : '0.80 kg CO₂/kWh'}
            </span>
          </div>
        </div>

      </section>

      <!-- ========================================== -->
      <!-- 3. MAIN ANALYTICS SECTION: CHART + EQUIPMENT STATUS -->
      <!-- ========================================== -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        <!-- Interactive Chart Panel (2 Cols) -->
        <article class="panel lg:col-span-2 p-4 flex flex-col min-h-[380px]">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 class="text-sm font-bold text-slate-800">
                {periodMode === 'Harian' 
                  ? `Kurva Daya Output 24-Jam — ${selectedDate} (${activeProfile.name})` 
                  : reportTab === 'Energi' 
                  ? `Visualisasi Produksi Energi vs Target — ${activeProfile.name}` 
                  : reportTab === 'Performa' 
                  ? `Tren Rasio Performa (PR %) — ${activeProfile.name}` 
                  : reportTab === 'CO₂' 
                  ? `Akumulasi Penurunan Emisi Karbon — ${activeProfile.name}` 
                  : `Catatan Insiden & Pemeliharaan — ${activeProfile.name}`}
              </h2>
              <p class="text-[11px] text-slate-500 mt-0.5">
                {periodMode === 'Harian' 
                  ? `Profil daya aktif (kW) per jam tanggal ${selectedDate}` 
                  : periodMode === 'Bulan' 
                  ? `Data per bulan Januari – September 2026 (${selectedMonth})` 
                  : periodMode === 'Rentang' 
                  ? `Periode kalender ${startDate} sampai ${endDate}` 
                  : `Tren historis tahunan 2023 – 2026`} · {activeProfile.displayName}
              </p>
            </div>

            <!-- Toggles: Metric Tab Toggle -->
            <div class="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              {#each reportTabs as tab}
                <button 
                  class="px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors {reportTab === tab ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'}"
                  on:click={() => { reportTab = tab; showToast(`Metrik: ${tab}`); }}
                >
                  {tab}
                </button>
              {/each}
            </div>
          </div>

          <!-- Dynamic ECharts Display -->
          <div class="w-full flex-1 min-h-[290px] pt-2">
            <Chart option={chartOption} />
          </div>

          <!-- Chart Footer Context Bar -->
          <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
            <div class="flex items-center gap-4">
              {#if periodMode === 'Harian'}
                <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded bg-sky-600"></span> Daya AC Aktual (kW)</span>
                <span class="flex items-center gap-1.5"><span class="w-3 border-t-2 border-dashed border-orange-500"></span> Proyeksi Surya (kW)</span>
              {:else if reportTab === 'Energi'}
                <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded bg-sky-600"></span> Produksi Aktual</span>
                <span class="flex items-center gap-1.5"><span class="w-3 border-t-2 border-dashed border-orange-500"></span> Target Rencana</span>
              {:else if reportTab === 'Performa'}
                <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded bg-[#08a080]"></span> Performance Ratio</span>
                <span class="flex items-center gap-1.5"><span class="w-3 border-t-2 border-dashed border-rose-500"></span> Benchmark Standar (80%)</span>
              {:else if reportTab === 'CO₂'}
                <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded bg-[#08a080]"></span> Reduksi Karbon</span>
              {:else}
                <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded bg-amber-500"></span> Insiden Alarm</span>
              {/if}
            </div>
            <div>
              <span class="font-medium text-slate-700">
                {periodMode === 'Harian' ? 'Total Energi Tanggal Ini:' : 'Total Akumulasi:'}
              </span>
              <strong class="text-slate-900 ml-1">
                {periodMode === 'Harian' 
                  ? `${selectedDayRecord.energy.toLocaleString()} kWh (Puncak: ${selectedDayRecord.peakPower} kW)` 
                  : reportTab === 'Energi' 
                  ? activeProfile.totalYield 
                  : reportTab === 'Performa' 
                  ? `${activeProfile.pr}% (Rata-rata)` 
                  : reportTab === 'CO₂' 
                  ? activeProfile.co2Reduction 
                  : 'Tingkat Ketersediaan 99.8%'}
              </strong>
            </div>
          </div>
        </article>

        <!-- Equipment / Inverter Details Panel (1 Col) -->
        <aside class="panel p-4 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center pb-2.5 border-b border-slate-100">
              <h2 class="text-sm font-bold text-slate-800">Status Perangkat Inverter</h2>
              <span class="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{activeProfile.inverters.length} Unit Aktif</span>
            </div>

            <!-- Inverter Cards List -->
            <div class="flex flex-col gap-2.5 mt-3">
              {#each activeProfile.inverters as inv}
                <div class="p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs">
                  <div class="flex justify-between items-start">
                    <div>
                      <strong class="text-slate-800 font-semibold">{inv.id}</strong>
                      <span class="text-[11px] text-slate-500 ml-1">({inv.model})</span>
                      <p class="text-[10px] text-slate-400 mt-0.5">SN: {inv.sn}</p>
                    </div>
                    <span class="text-[10px] font-semibold text-[#08a080] bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      ● {inv.status}
                    </span>
                  </div>

                  <div class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                    <div>Daya DC / AC: <b>{inv.pDc} / {inv.pAc} kW</b></div>
                    <div class="text-right">Efisiensi: <b class="text-[#08a080]">{inv.efficiency}%</b></div>
                    <div>Suhu Operasi: <b>{inv.temp} °C</b></div>
                    <div class="text-right">Frekuensi: <b>50.0 Hz</b></div>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Technical Health Summary Card -->
          <div class="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div class="flex justify-between items-center text-[11px] font-semibold text-slate-700 mb-1.5">
              <span>Keandalan Sistem Pembangkit</span>
              <span class="text-[#08a080] font-bold">Optimal 100%</span>
            </div>
            <div class="text-[11px] text-slate-500 space-y-1">
              <div class="flex justify-between">
                <span>Rugi Kabel &amp; Inverter:</span>
                <strong class="text-slate-700">2.1% (Standar &lt; 3%)</strong>
              </div>
              <div class="flex justify-between">
                <span>Degradasi Modul Est.:</span>
                <strong class="text-slate-700">0.45% / tahun</strong>
              </div>
              <div class="flex justify-between">
                <span>Inspeksi Terakhir:</span>
                <strong class="text-slate-700">12 September 2026</strong>
              </div>
            </div>
          </div>
        </aside>

      </section>

      <!-- ========================================== -->
      <!-- 4. DAILY DETAIL TABLE (SEARCHABLE & SORTABLE) -->
      <!-- ========================================== -->
      <section class="panel p-4 flex flex-col">
        <!-- Table Header & Controls -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-sm font-bold text-slate-800">Detail Rekapitulasi Operasional — {activeProfile.displayName}</h2>
              {#if periodMode === 'Harian'}
                <span class="text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                  Fokus Tanggal: {selectedDate}
                </span>
              {:else if periodMode === 'Rentang'}
                <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  Rentang: {startDate} s.d. {endDate}
                </span>
              {/if}
            </div>
            <p class="text-[11px] text-slate-500 mt-0.5">
              Klik pada baris tanggal untuk melihat detail daya dan kurva harian kalender tersebut.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <!-- Search Filter -->
            <input 
              type="text" 
              placeholder="Cari tanggal..." 
              bind:value={searchQuery}
              class="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none focus:border-sky-500 w-40 sm:w-48"
            />

            <!-- Quick Export Table -->
            <button class="export-btn export-btn-secondary" on:click={exportToCsv} title="Ekspor data tabel ke CSV">
              Export CSV
            </button>
          </div>
        </div>

        <!-- Table Display -->
        <div class="table-wrap mt-3">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold select-none">
                <th class="py-2.5 px-3 cursor-pointer hover:bg-slate-100" on:click={() => toggleSort('date')}>
                  Tanggal {sortField === 'date' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th class="py-2.5 px-3 cursor-pointer hover:bg-slate-100 text-right" on:click={() => toggleSort('energy')}>
                  Energi (kWh) {sortField === 'energy' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th class="py-2.5 px-3 text-right">Target (kWh)</th>
                <th class="py-2.5 px-3 text-right">Deviasi (%)</th>
                <th class="py-2.5 px-3 cursor-pointer hover:bg-slate-100 text-center" on:click={() => toggleSort('pr')}>
                  PR (%) {sortField === 'pr' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th class="py-2.5 px-3 text-right">Jam Ekuivalen (PSH)</th>
                <th class="py-2.5 px-3 text-right">Daya Puncak (kW)</th>
                <th class="py-2.5 px-3 cursor-pointer hover:bg-slate-100 text-right" on:click={() => toggleSort('co2')}>
                  CO₂ (Ton) {sortField === 'co2' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th class="py-2.5 px-3 text-right">Insolasi (kWh/m²)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {#if filteredDailyRows.length === 0}
                <tr>
                  <td colspan="9" class="py-8 text-center text-slate-400">
                    Tidak ada data yang cocok dengan "{searchQuery}".
                  </td>
                </tr>
              {:else}
                {#each filteredDailyRows as row}
                  {@const isSelected = row.date === selectedDate}
                  {@const deviasi = row.energy - row.target}
                  {@const deviasiPct = +((deviasi / row.target) * 100).toFixed(1)}
                  <tr 
                    class="transition-colors cursor-pointer {isSelected ? 'bg-sky-50/90 font-semibold border-l-4 border-l-sky-600' : 'hover:bg-slate-50/80'}"
                    on:click={() => { selectedDate = row.date; periodMode = 'Harian'; showToast(`Memilih tanggal: ${row.date}`); }}
                    title="Klik untuk memilih tanggal ini di kalender"
                  >
                    <td class="py-2 px-3 text-slate-800 flex items-center gap-1.5">
                      <span>{row.date}</span>
                      {#if isSelected}
                        <span class="text-[9px] font-bold px-1.5 py-0.2 bg-sky-600 text-white rounded">Dipilih</span>
                      {/if}
                    </td>
                    <td class="py-2 px-3 text-right font-medium text-[#1768c2]">{row.energy.toLocaleString()}</td>
                    <td class="py-2 px-3 text-right text-slate-500">{row.target.toLocaleString()}</td>
                    <td class="py-2 px-3 text-right font-medium {deviasi >= 0 ? 'text-[#08a080]' : 'text-slate-500'}">
                      {deviasi >= 0 ? '+' : ''}{deviasiPct}%
                    </td>
                    <td class="py-2 px-3 text-center font-medium {Number(row.pr) >= 80 ? 'text-[#08a080]' : 'text-slate-700'}">
                      {row.pr}%
                    </td>
                    <td class="py-2 px-3 text-right text-slate-600">{row.eqHours} h</td>
                    <td class="py-2 px-3 text-right text-slate-700">{row.peakPower}</td>
                    <td class="py-2 px-3 text-right text-[#08a080] font-medium">{row.co2}</td>
                    <td class="py-2 px-3 text-right text-slate-500">{row.irradiance}</td>
                  </tr>
                {/each}
              {/if}
            </tbody>
            <!-- Summary Footer Row -->
            {#if filteredDailyRows.length > 0}
              <tfoot>
                <tr class="bg-slate-100/90 font-bold text-slate-800 border-t border-slate-300">
                  <td class="py-2.5 px-3">Total / Rata-Rata ({filteredDailyRows.length} Hari)</td>
                  <td class="py-2.5 px-3 text-right text-[#1768c2]">{totalDailyEnergy.toLocaleString()} kWh</td>
                  <td class="py-2.5 px-3 text-right text-slate-600">{totalDailyTarget.toLocaleString()} kWh</td>
                  <td class="py-2.5 px-3 text-right {totalDailyEnergy >= totalDailyTarget ? 'text-[#08a080]' : 'text-slate-600'}">
                    {totalDailyEnergy >= totalDailyTarget ? '+' : ''}{((totalDailyEnergy - totalDailyTarget) / totalDailyTarget * 100).toFixed(1)}%
                  </td>
                  <td class="py-2.5 px-3 text-center text-[#08a080]">
                    {avgDailyPr}%
                  </td>
                  <td class="py-2.5 px-3 text-right text-slate-700">1.76 h</td>
                  <td class="py-2.5 px-3 text-right text-slate-700">674 kW</td>
                  <td class="py-2.5 px-3 text-right text-[#08a080]">{totalDailyCo2} Ton</td>
                  <td class="py-2.5 px-3 text-right text-slate-600">{avgDailyIrr} kWh/m²</td>
                </tr>
              </tfoot>
            {/if}
          </table>
        </div>

        <!-- Table Summary Note -->
        <div class="flex items-center justify-between text-xs text-slate-500 pt-3 mt-1 border-t border-slate-100">
          <span>Menampilkan {filteredDailyRows.length} hari data operasional — {activeProfile.displayName}</span>
          <span class="text-[11px] text-slate-400">Klik tanggal pada tabel untuk langsung berpindah tanggal kalender</span>
        </div>
      </section>

    </div>
  </main>

  <!-- Clean Floating Toast Notification -->
  {#if toastMessage}
    <div class="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2.5 border border-slate-700 fade-in">
      <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
      <span>{toastMessage}</span>
    </div>
  {/if}
</div>

<style>
  /* Base Shell */
  .page-shell {
    display: flex;
    min-height: 100vh;
    background: #f4f7f8;
    color: #1e293b;
    font-family: inherit;
  }

  /* Fixed Left Sidebar */
  .sidebar {
    position: fixed;
    inset-block: 0;
    left: 0;
    z-index: 30;
    display: flex;
    width: 72px;
    flex-direction: column;
    border-right: 1px solid #0096d6;
    background: #00b7ff;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
  }
  .sidebar.open { transform: translateX(0); }
  @media (min-width: 1024px) { .sidebar { transform: translateX(0); } }

  .logo-cell {
    display: flex;
    height: 56px;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid #0096d6;
    font-size: 24px;
    color: #fff;
    font-weight: bold;
  }

  .nav-list {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4px;
    padding: 8px;
    margin-top: 0;
    overflow-y: auto;
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
  .nav-button:hover, .nav-button.current { background: rgba(0, 0, 0, 0.15); color: #ffffff; }
  .nav-glyph { font-size: 17px; line-height: 17px; }
  .nav-help { margin: 0 8px 12px; }

  /* Main Area */
  .main-area {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    height: 100vh;
    overflow: hidden;
  }
  @media (min-width: 1024px) { .main-area { padding-left: 72px; } }

  /* Top Bar */
  .top-bar {
    display: flex;
    height: 56px;
    flex-shrink: 0;
    align-items: center;
    gap: 12px;
    padding: 0 20px;
    border-bottom: 1px solid #e2e8f0;
    background: #fff;
    z-index: 20;
  }
  .lg-hidden { display: block; }
  @media (min-width: 1024px) { .lg-hidden { display: none; } }

  .greeting { font-size: 12px; color: #64748b; }
  .greeting strong { color: #1e293b; }
  .date-label { font-size: 11px; color: #94a3b8; display: none; }
  @media (min-width: 640px) { .date-label { display: block; } }

  .bar-actions { display: flex; gap: 10px; align-items: center; margin-left: auto; }

  .icon-button {
    position: relative;
    display: grid;
    height: 32px;
    width: 32px;
    place-items: center;
    border-radius: 8px;
    color: #64748b;
    font-size: 14px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
  }
  .icon-button:hover { background: #f1f5f9; color: #0f172a; }
  .notif-dot {
    position: absolute;
    top: -2px;
    right: -2px;
    display: grid;
    height: 13px;
    width: 13px;
    place-items: center;
    border-radius: 50%;
    background: #ef4444;
    color: #fff;
    font-size: 8px;
    font-weight: bold;
  }

  .avatar {
    display: grid;
    height: 32px;
    width: 32px;
    place-items: center;
    border-radius: 50%;
    background: #1e3a5f;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
  }

  /* Toolbar Input (matching user's screenshot exactly) */
  .toolbar-input {
    height: 34px;
    min-width: 145px;
    border: 1px solid #d9e4ea;
    border-radius: 8px;
    padding: 0 10px;
    color: #334155;
    font-size: 12px;
    font-weight: 500;
    background: #ffffff;
    outline: none;
    cursor: pointer;
    transition: border-color 0.15s ease;
  }
  .toolbar-input:focus, .toolbar-input:hover {
    border-color: #0284c7;
  }

  /* Interactive Calendar Date Picker Input (seperti ditanggalan) */
  .calendar-input {
    height: 32px;
    border: none;
    background: transparent;
    padding: 0 6px;
    color: #1e293b;
    font-size: 12px;
    font-weight: 500;
    outline: none;
    cursor: pointer;
    font-family: inherit;
  }
  .calendar-input::-webkit-calendar-picker-indicator {
    cursor: pointer;
    filter: opacity(0.75);
    transition: filter 0.15s ease;
  }
  .calendar-input::-webkit-calendar-picker-indicator:hover {
    filter: opacity(1);
  }

  /* Arrow Step Buttons */
  .nav-arrow-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 28px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #f8fafc;
    color: #475569;
    font-size: 15px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .nav-arrow-btn:hover {
    background: #0284c7;
    color: #ffffff;
    border-color: #0284c7;
  }

  /* Content Scroll Container */
  .content-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Executive KPI Card */
  .kpi-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.07);
  }
  .kpi-label {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* Panels */
  .panel {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  /* Export Buttons */
  .export-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    padding: 0 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .export-btn-primary {
    background: #0284c7;
    color: #ffffff;
    border: 1px solid #0369a1;
  }
  .export-btn-primary:hover {
    background: #0369a1;
  }
  .export-btn-secondary {
    background: #ffffff;
    color: #475569;
    border: 1px solid #cbd5e1;
  }
  .export-btn-secondary:hover {
    background: #f8fafc;
    color: #1e293b;
    border-color: #94a3b8;
  }

  /* Table styling */
  .table-wrap {
    overflow-x: auto;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }
  table {
    min-width: 880px;
    border-collapse: collapse;
  }

  /* Animation */
  .fade-in {
    animation: fadeIn 0.25s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Print Stylesheet for PDF */
  @media print {
    .sidebar, .top-bar, .export-btn, .bar-actions, button, input {
      display: none !important;
    }
    .main-area {
      padding-left: 0 !important;
      height: auto !important;
      overflow: visible !important;
    }
    .content-scroll {
      overflow: visible !important;
      padding: 0 !important;
    }
    .page-shell {
      background: white !important;
    }
    .panel, .kpi-card {
      box-shadow: none !important;
      border: 1px solid #cbd5e1 !important;
      break-inside: avoid;
    }
  }
</style>
