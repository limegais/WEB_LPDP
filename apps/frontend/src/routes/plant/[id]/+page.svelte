<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Chart from '$lib/components/Chart.svelte';
  
  let menuOpen = false;

  // Dynamic plant name based on URL param
  $: plantName = decodeURIComponent($page.params.id || 'PLTS Gedung 3 FT');
  $: isIndomaker = plantName.toLowerCase().includes('indomaker');
  
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

  // Navigation State
  let activeTab: 'Dashboard' | 'Kontrol Energi' | 'Prediksi & Analitik' | 'Devices' | 'Alarms' = 'Dashboard';
  let overviewPeriod = 'Day';
  let viewMode = '3d'; // '3d' or '2d'
  let chartTab = 'Power Curve';

  // ==========================================
  // KONTROL ENERGI (ENERGY CONTROL) STATE
  // ==========================================
  let controlMode: 'auto' | 'manual' = 'auto';
  let autoStrategy: 'self_consumption' | 'peak_shaving' | 'tou' | 'backup' = 'self_consumption';

  // 1. PV Panel Surya
  let pvBasePower = 3.053; // kW
  let pvLimitPercent = 100; // 0 - 100% (curtailment)
  let pvInverterEnabled = true;
  let pvPeakPower = 7.10; // kW
  let pvDailyYield = 27.80; // kWh
  let pvEfficiency = 98.2; // %
  let pvIrradiance = 825; // W/m²
  let pvString1 = { v: 385, i: 4.1, p: 1.58 };
  let pvString2 = { v: 380, i: 3.9, p: 1.47 };

  // 2. Baterai (BESS)
  let batterySoc = 88; // % (0-100)
  let batteryHealth = 98.4; // %
  let batteryVoltage = 51.2; // V
  let batteryCurrent = 11.7; // A
  let batteryTemp = 28.5; // °C
  let batteryCapacityTotal = 12.0; // kWh
  let batteryMinSocCutoff = 20; // %
  let batteryMaxChargePower = 2.5; // kW
  let batteryManualMode: 'auto' | 'charge' | 'discharge' | 'standby' = 'auto';

  // 3. Grid PLN
  let zeroExportEnabled = false;
  let exportLimit = 3.5; // kW
  let gridVoltage = 221.8; // V
  let gridFrequency = 50.01; // Hz
  let gridDailyExport = 14.80; // kWh
  let gridDailyImport = 3.42; // kWh
  let gridConnected = true;

  // 4. Beban Gedung / Load Monitoring
  let totalLoadPower = 1.36; // kW
  let loadDailyConsumption = 16.42; // kWh
  let loadPeakToday = 2.85; // kW
  let loadVoltage = 220.5; // V
  let loadPowerFactor = 0.98;

  // Toast Notification System
  let toastMessage = '';
  let toastTimer: ReturnType<typeof setTimeout> | null = null;
  function showToast(msg: string) {
    toastMessage = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastMessage = '';
    }, 2800);
  }

  // Reactive calculations for power flows
  $: effectivePv = pvInverterEnabled ? pvBasePower * (pvLimitPercent / 100) : 0;

  // Dynamic calculation for Battery & Grid based on controlMode and settings
  let batteryStatus: 'charging' | 'discharging' | 'standby' = 'charging';
  let batteryPower = 0.60;
  let gridMode: 'export' | 'import' = 'export';
  let gridPower = 1.20;

  function calculateAutoFlows() {
    let surplus = effectivePv - totalLoadPower;
    if (surplus > 0) {
      if (batterySoc < 95) {
        batteryStatus = 'charging';
        batteryPower = Math.min(surplus * 0.45, batteryMaxChargePower);
        let remSurplus = surplus - batteryPower;
        if (zeroExportEnabled) {
          gridMode = 'export';
          gridPower = 0;
        } else {
          gridMode = 'export';
          gridPower = Math.min(remSurplus, exportLimit);
        }
      } else {
        batteryStatus = 'standby';
        batteryPower = 0;
        if (zeroExportEnabled) {
          gridMode = 'export';
          gridPower = 0;
        } else {
          gridMode = 'export';
          gridPower = Math.min(surplus, exportLimit);
        }
      }
    } else {
      let deficit = totalLoadPower - effectivePv;
      if (batterySoc > batteryMinSocCutoff) {
        batteryStatus = 'discharging';
        batteryPower = Math.min(deficit, 1.8);
        let remDeficit = deficit - batteryPower;
        if (remDeficit > 0.05) {
          gridMode = 'import';
          gridPower = remDeficit;
        } else {
          gridMode = 'import';
          gridPower = 0;
        }
      } else {
        batteryStatus = 'standby';
        batteryPower = 0;
        gridMode = 'import';
        gridPower = deficit;
      }
    }
  }

  $: {
    if (controlMode === 'manual') {
      if (batteryManualMode === 'charge') {
        batteryStatus = 'charging';
        batteryPower = Math.min(batteryMaxChargePower, 1.5);
      } else if (batteryManualMode === 'discharge') {
        batteryStatus = 'discharging';
        batteryPower = 1.2;
      } else if (batteryManualMode === 'standby') {
        batteryStatus = 'standby';
        batteryPower = 0;
      } else {
        calculateAutoFlows();
      }
      
      let generationNet = effectivePv + (batteryStatus === 'discharging' ? batteryPower : 0);
      let demandNet = totalLoadPower + (batteryStatus === 'charging' ? batteryPower : 0);
      let diff = generationNet - demandNet;
      
      if (diff > 0) {
        if (zeroExportEnabled) {
          gridMode = 'export';
          gridPower = 0;
        } else {
          gridMode = 'export';
          gridPower = Math.min(diff, exportLimit);
        }
      } else if (diff < 0) {
        gridMode = 'import';
        gridPower = Math.abs(diff);
      } else {
        gridMode = 'export';
        gridPower = 0;
      }
    } else {
      calculateAutoFlows();
    }
  }

  // Interactive Handlers
  function toggleControlMode(mode: 'auto' | 'manual') {
    controlMode = mode;
    showToast(mode === 'auto' 
      ? 'Mode Otomatis aktif: Optimasi daya mandiri berjalan' 
      : 'Mode Manual aktif: Kontrol parameter dan saklar dibuka');
  }

  function setAutoStrategy(strategy: 'self_consumption' | 'peak_shaving' | 'tou' | 'backup') {
    autoStrategy = strategy;
    const names = {
      self_consumption: 'Konsumsi Mandiri (Self-Consumption)',
      peak_shaving: 'Cukur Beban Puncak (Peak Shaving)',
      tou: 'Optimasi Tarif Waktu (TOU)',
      backup: 'Prioritas Cadangan Penuh (Backup)'
    };
    showToast(`Strategi aktif: ${names[strategy]}`);
  }

  function toggleZeroExport() {
    zeroExportEnabled = !zeroExportEnabled;
    showToast(zeroExportEnabled 
      ? 'Zero Export diaktifkan: Arus balik ke PLN dibatasi 0 kW' 
      : 'Zero Export dinonaktifkan: Ekspor ke PLN diizinkan');
  }

  function setBatteryMode(mode: 'auto' | 'charge' | 'discharge' | 'standby') {
    batteryManualMode = mode;
    const labels = {
      auto: 'Baterai: Mengikuti alur otomatis',
      charge: 'Baterai: Paksa Pengisian',
      discharge: 'Baterai: Paksa Pengosongan',
      standby: 'Baterai: Siaga'
    };
    showToast(labels[mode]);
  }

  function togglePvInverter() {
    pvInverterEnabled = !pvInverterEnabled;
    showToast(pvInverterEnabled ? 'Inverter PV dihubungkan' : 'Inverter PV dimatikan');
  }

  // Simulated EMS dispatch log
  const emsLogs = [
    { time: '14:28:10', type: 'info', text: 'EMS AI: Mengalihkan surplus PV 1.20 kW ke pengisian Baterai ESS' },
    { time: '14:22:05', type: 'success', text: 'Grid PLN: Ekspor energi stabil pada 1.20 kW' },
    { time: '14:10:45', type: 'info', text: 'Beban: Konsumsi Gedung 3 FT beroperasi stabil pada 1.36 kW' },
    { time: '13:55:00', type: 'warning', text: 'Baterai: Suhu 28.5 °C dalam ambang batas operasional optimal' },
    { time: '13:30:12', type: 'info', text: 'PV: String 1 & 2 optimal dengan radiasi 825 W/m²' }
  ];

  // Dummy devices for "Devices" tab
  const devices = [
    { id: 'INV-001', type: 'Inverter Hybrid 30kW', status: 'Running', power: '20.5 kW' },
    { id: 'BAT-001', type: 'BESS LFP 12.0 kWh', status: 'Running', power: '0.60 kW' },
    { id: 'MET-001', type: 'Bidirectional Smart Meter', status: 'Running', power: '1.20 kW' },
    { id: 'RLY-001', type: 'Smart Load Controller 4-Ch', status: 'Running', power: '1.36 kW' }
  ];

  // Dummy alarms for "Alarms" tab
  const alarms = [
    { time: '09/10/2026 10:15', device: 'INV-001', message: 'Tegangan grid dalam batas normal', severity: 'Info' }
  ];

  // Reactivity to simulate dynamic data
  $: if (overviewPeriod === 'Day') {
    overview = { energy: '27.80', revenue: '40.16' };
  } else if (overviewPeriod === 'Month') {
    overview = { energy: '840.5', revenue: '1,214.3' };
  } else if (overviewPeriod === 'Year') {
    overview = { energy: '10,240', revenue: '14,800' };
  }

  // ==============================================================
  // PREDIKSI & ANALITIK STATE & ENGINE
  // ==============================================================
  let weatherModelSource: 'BMKG' | 'OpenWeather' = 'BMKG';
  let analyticsViewMode: 'hourly' | 'weekly' = 'hourly';

  const pvSystemSpecs = {
    installedCapacityWp: 7100, // 7.10 kWp
    panelCount: 16,
    panelModel: 'Tier-1 Mono PERC 445 Wp',
    tiltAngle: 15,
    azimuth: 0,
    tempCoefficient: -0.35,
    noct: 45,
    inverterEff: 97.8,
    soilingWiringLoss: 3.2
  };

  let weatherCurrent = {
    source: 'BMKG Stasiun Klimatologi DKI Jakarta / Depok',
    stationId: 'BMKG-96749 (Radius 4.2 km)',
    updateTime: '14:30 WIB (Sinkronisasi Model 06:00 WIB)',
    tempAmbient: 33.5,
    irradianceGhi: 790,
    irradiancePoa: 845,
    cloudCoverTotal: 18,
    cloudLow: 8,
    cloudMid: 10,
    humidity: 68,
    windSpeed: 12,
    uvIndex: 8.5,
    airQualityIndex: 'Sedang (AQI 64)',
    phel: 4.42
  };

  function switchWeatherSource(source: 'BMKG' | 'OpenWeather') {
    weatherModelSource = source;
    if (source === 'BMKG') {
      weatherCurrent = {
        source: 'BMKG Stasiun Klimatologi DKI Jakarta / Depok',
        stationId: 'BMKG-96749 (Radius 4.2 km)',
        updateTime: '14:30 WIB (Sinkronisasi Model 06:00 WIB)',
        tempAmbient: 33.5,
        irradianceGhi: 790,
        irradiancePoa: 845,
        cloudCoverTotal: 18,
        cloudLow: 8,
        cloudMid: 10,
        humidity: 68,
        windSpeed: 12,
        uvIndex: 8.5,
        airQualityIndex: 'Sedang (AQI 64)',
        phel: 4.42
      };
      showToast('Model cuaca beralih ke BMKG (Stasiun Klimatologi Jabodetabek)');
    } else {
      weatherCurrent = {
        source: 'OpenWeather Solar Irradiance API 3.0',
        stationId: 'Satellite Grid Lat -6.36, Lon 106.82',
        updateTime: '14:28 WIB (Solar Cloud Model)',
        tempAmbient: 34.0,
        irradianceGhi: 805,
        irradiancePoa: 860,
        cloudCoverTotal: 15,
        cloudLow: 6,
        cloudMid: 9,
        humidity: 65,
        windSpeed: 13,
        uvIndex: 8.8,
        airQualityIndex: 'Sedang (AQI 60)',
        phel: 4.50
      };
      showToast('Model cuaca beralih ke OpenWeather Solar Irradiance API');
    }
  }

  $: calculatedCellTemp = weatherCurrent.tempAmbient + (weatherCurrent.irradiancePoa / 800) * (pvSystemSpecs.noct - 20);
  $: thermalLossPct = Math.max(0, (calculatedCellTemp - 25) * Math.abs(pvSystemSpecs.tempCoefficient));
  $: theoreticalPvPotentialKw = (pvSystemSpecs.installedCapacityWp / 1000) * (weatherCurrent.irradiancePoa / 1000);
  $: technicalPvPotentialKw = theoreticalPvPotentialKw * (1 - thermalLossPct / 100) * (pvSystemSpecs.inverterEff / 100) * (1 - pvSystemSpecs.soilingWiringLoss / 100);
  $: currentActualKw = effectivePv;
  $: potentialRealizationRatio = technicalPvPotentialKw > 0 ? Math.min(100, (currentActualKw / technicalPvPotentialKw) * 100) : 0;

  const hourlyForecastData = [
    { time: '06:00', weather: 'Cerah', icon: 'sun', irradiance: 45, temp: 26.2, clouds: 10, predictedKw: 0.28, actualKw: 0.25 },
    { time: '07:00', weather: 'Cerah', icon: 'sun', irradiance: 185, temp: 27.8, clouds: 12, predictedKw: 1.18, actualKw: 1.15 },
    { time: '08:00', weather: 'Cerah Berawan', icon: 'partly-cloudy', irradiance: 420, temp: 29.5, clouds: 18, predictedKw: 2.72, actualKw: 2.68 },
    { time: '09:00', weather: 'Cerah Berawan', icon: 'partly-cloudy', irradiance: 680, temp: 31.4, clouds: 20, predictedKw: 4.41, actualKw: 4.38 },
    { time: '10:00', weather: 'Cerah', icon: 'sun', irradiance: 810, temp: 32.8, clouds: 15, predictedKw: 5.22, actualKw: 5.15 },
    { time: '11:00', weather: 'Cerah Berawan', icon: 'partly-cloudy', irradiance: 890, temp: 34.0, clouds: 22, predictedKw: 5.68, actualKw: 5.55 },
    { time: '12:00', weather: 'Cerah Berawan', icon: 'partly-cloudy', irradiance: 920, temp: 35.1, clouds: 24, predictedKw: 5.82, actualKw: 5.70 },
    { time: '13:00', weather: 'Cerah Berawan', icon: 'partly-cloudy', irradiance: 860, temp: 34.8, clouds: 28, predictedKw: 5.42, actualKw: 5.25 },
    { time: '14:00', weather: 'Berawan Tipis', icon: 'partly-cloudy', irradiance: 845, temp: 33.5, clouds: 18, predictedKw: 5.12, actualKw: 4.88 },
    { time: '15:00', weather: 'Berawan', icon: 'cloudy', irradiance: 540, temp: 32.0, clouds: 45, predictedKw: 3.35, actualKw: null },
    { time: '16:00', weather: 'Berawan Tebal', icon: 'cloudy', irradiance: 280, temp: 30.5, clouds: 60, predictedKw: 1.75, actualKw: null },
    { time: '17:00', weather: 'Hujan Lokal Ringan', icon: 'rain', irradiance: 90, temp: 28.2, clouds: 80, predictedKw: 0.52, actualKw: null },
    { time: '18:00', weather: 'Mendung', icon: 'cloudy', irradiance: 0, temp: 27.0, clouds: 75, predictedKw: 0.00, actualKw: null }
  ];

  const weeklyForecastData = [
    { day: 'Hari Ini', date: '17 Okt', weather: 'Cerah Berawan', icon: 'partly-cloudy', psh: 4.42, avgIrradiance: 845, predictedKwh: 31.40, actualKwh: 27.80, tempMinMax: '25° / 35°C', cloudCover: 22, confidence: 96, recommendation: 'Optimal untuk ekspor siang & pengisian penuh ESS' },
    { day: 'Sabtu', date: '18 Okt', weather: 'Cerah Dominan', icon: 'sun', psh: 4.85, avgIrradiance: 890, predictedKwh: 34.20, actualKwh: null, tempMinMax: '25° / 36°C', cloudCover: 12, confidence: 94, recommendation: 'Pembangkitan puncak, disarankan kurangi curtailment' },
    { day: 'Minggu', date: '19 Okt', weather: 'Cerah Berawan', icon: 'partly-cloudy', psh: 4.30, avgIrradiance: 810, predictedKwh: 30.80, actualKwh: null, tempMinMax: '24° / 34°C', cloudCover: 28, confidence: 91, recommendation: 'Beban gedung akhir pekan rendah, simpan daya di baterai ESS' },
    { day: 'Senin', date: '20 Okt', weather: 'Hujan Siang-Sore', icon: 'rain', psh: 3.10, avgIrradiance: 520, predictedKwh: 21.50, actualKwh: null, tempMinMax: '24° / 31°C', cloudCover: 72, confidence: 85, recommendation: 'Waspada intermitensi mendung, pertahankan cadangan ESS min 40%' },
    { day: 'Selasa', date: '21 Okt', weather: 'Berawan Tebal', icon: 'cloudy', psh: 3.50, avgIrradiance: 610, predictedKwh: 24.60, actualKwh: null, tempMinMax: '24° / 32°C', cloudCover: 65, confidence: 88, recommendation: 'Gunakan mode Cukur Beban Puncak (Peak Shaving)' },
    { day: 'Rabu', date: '22 Okt', weather: 'Cerah Berawan', icon: 'partly-cloudy', psh: 4.60, avgIrradiance: 830, predictedKwh: 32.40, actualKwh: null, tempMinMax: '25° / 35°C', cloudCover: 25, confidence: 89, recommendation: 'Kondisi cuaca membaik, produksi normal kembali' },
    { day: 'Kamis', date: '23 Okt', weather: 'Cerah', icon: 'sun', psh: 4.75, avgIrradiance: 865, predictedKwh: 33.50, actualKwh: null, tempMinMax: '25° / 35°C', cloudCover: 15, confidence: 86, recommendation: 'Potensi pembangkitan tinggi, pengujian performansi rutin' }
  ];

  $: totalWeeklyPredictedKwh = weeklyForecastData.reduce((acc, cur) => acc + cur.predictedKwh, 0);
  $: avgDailyPredictedKwh = (totalWeeklyPredictedKwh / weeklyForecastData.length).toFixed(1);
  $: estimatedWeeklyRevenue = Math.round(totalWeeklyPredictedKwh * 1444.7).toLocaleString('id-ID');
  $: estimatedWeeklyCo2Reduction = (totalWeeklyPredictedKwh * 0.794).toFixed(1);

  // Common Light Theme Tooltip styling
  const lightTooltipStyle = {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    padding: [8, 12],
    textStyle: { color: '#0f172a', fontSize: 11 },
    extraCssText: 'box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08); border-radius: 8px;'
  };

  // ECharts Option: Hourly Curve
  $: hourlyPredictionChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      ...lightTooltipStyle,
      axisPointer: { type: 'cross', lineStyle: { color: '#94a3b8', type: 'dashed' } },
      formatter: (params: any[]) => {
        let title = `<div style="font-weight:600;margin-bottom:6px;color:#0f172a;border-bottom:1px solid #f1f5f9;padding-bottom:3px;">Jam ${params[0].axisValue} WIB</div>`;
        params.forEach(p => {
          let val = p.value !== null && p.value !== undefined ? p.value : '-';
          let unit = p.seriesName.includes('Radiasi') ? ' W/m²' : ' kW';
          title += `<div style="display:flex;align-items:center;justify-content:space-between;gap:14px;margin:3px 0;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${p.color};"></span>
              <span style="color:#64748b;">${p.seriesName}</span>
            </div>
            <b style="color:#0f172a;">${val}${unit}</b>
          </div>`;
        });
        return title;
      }
    },
    legend: {
      data: ['Daya Riil (kW)', 'Prediksi Model (kW)', 'Potensi Radiasi (W/m²)'],
      textStyle: { color: '#64748b', fontSize: 11 },
      top: 0,
      right: 10
    },
    grid: { top: 38, right: 54, bottom: 28, left: 44 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: hourlyForecastData.map(h => h.time),
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#64748b', fontSize: 10 }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Daya (kW)',
        nameTextStyle: { color: '#64748b', fontSize: 10, padding: [0, 0, 0, -10] },
        min: 0,
        max: 7.5,
        axisLabel: { color: '#64748b', fontSize: 10 },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
      },
      {
        type: 'value',
        name: 'Radiasi (W/m²)',
        nameTextStyle: { color: '#64748b', fontSize: 10, padding: [0, 0, 0, 20] },
        min: 0,
        max: 1000,
        axisLabel: { color: '#64748b', fontSize: 10 },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: 'Daya Riil (kW)',
        type: 'line',
        smooth: true,
        showSymbol: true,
        symbolSize: 5,
        itemStyle: { color: '#10b981' },
        lineStyle: { color: '#10b981', width: 2.5 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.25)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.0)' }
            ]
          }
        },
        data: hourlyForecastData.map(h => h.actualKw)
      },
      {
        name: 'Prediksi Model (kW)',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#ff4f00', width: 2, type: 'dashed' },
        data: hourlyForecastData.map(h => h.predictedKw)
      },
      {
        name: 'Potensi Radiasi (W/m²)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#0284c7', width: 1.5, type: 'dotted' },
        data: hourlyForecastData.map(h => h.irradiance)
      }
    ]
  };

  // ECharts Option: Weekly Forecast
  $: weeklyPredictionChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      ...lightTooltipStyle,
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['Estimasi Energi (kWh)', 'Jam Matahari Puncak (PSH)'],
      textStyle: { color: '#64748b', fontSize: 11 },
      top: 0,
      right: 10
    },
    grid: { top: 38, right: 54, bottom: 28, left: 44 },
    xAxis: {
      type: 'category',
      data: weeklyForecastData.map(w => `${w.day}\n${w.date}`),
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#64748b', fontSize: 10 }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Energi (kWh)',
        nameTextStyle: { color: '#64748b', fontSize: 10 },
        min: 0,
        max: 45,
        axisLabel: { color: '#64748b', fontSize: 10 },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
      },
      {
        type: 'value',
        name: 'PSH (Jam)',
        nameTextStyle: { color: '#64748b', fontSize: 10 },
        min: 0,
        max: 6,
        axisLabel: { color: '#64748b', fontSize: 10 },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: 'Estimasi Energi (kWh)',
        type: 'bar',
        barWidth: '38%',
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#ff4f00' },
              { offset: 1, color: '#fed7aa' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        data: weeklyForecastData.map(w => w.predictedKwh)
      },
      {
        name: 'Jam Matahari Puncak (PSH)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#0284c7', width: 2 },
        itemStyle: { color: '#0284c7' },
        data: weeklyForecastData.map(w => w.psh)
      }
    ]
  };

  // ==============================================================
  // DASHBOARD BOTTOM CHARTS: 4 INFORMATIVE MODES
  // ==============================================================
  const heatmapDays = ['Minggu', 'Sabtu', 'Jumat', 'Kamis', 'Rabu', 'Selasa', 'Senin'];
  const heatmapHours = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  function generateHeatmapData() {
    let data: [number, number, number][] = [];
    const dayMultipliers = [1.02, 1.05, 0.98, 0.95, 0.92, 0.65, 0.88];
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      for (let hourIdx = 0; hourIdx < heatmapHours.length; hourIdx++) {
        let hour = 6 + hourIdx;
        let peak = 5.8 * dayMultipliers[dayIdx];
        let normalized = Math.sin(((hour - 6) / 12) * Math.PI);
        let val = Math.max(0, +(normalized * peak).toFixed(2));
        if (dayIdx === 5 && hour >= 13 && hour <= 15) {
          val = +(val * 0.38).toFixed(2);
        }
        data.push([hourIdx, dayIdx, val]);
      }
    }
    return data;
  }

  // 1. POWER CURVE OPTION (Clean Light Theme)
  $: powerCurveOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      ...lightTooltipStyle,
      axisPointer: { type: 'cross', lineStyle: { color: '#94a3b8', type: 'dashed' } },
      formatter: (params: any[]) => {
        let title = `<div style="font-weight:600;margin-bottom:6px;color:#0f172a;border-bottom:1px solid #f1f5f9;padding-bottom:3px;">Jam ${params[0].axisValue} WIB</div>`;
        params.forEach(p => {
          title += `<div style="display:flex;align-items:center;justify-content:space-between;gap:14px;margin:3px 0;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${p.color};"></span>
              <span style="color:#64748b;">${p.seriesName}</span>
            </div>
            <b style="color:#0f172a;">${p.value} kW</b>
          </div>`;
        });
        return title;
      }
    },
    legend: {
      data: ['PV Output (kW)', 'Konsumsi Beban (kW)', 'Baterai ESS (kW)', 'Grid PLN (kW)'],
      textStyle: { color: '#64748b', fontSize: 11 },
      top: 0,
      left: 'center'
    },
    grid: { top: 42, right: 30, bottom: 28, left: 44 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '23:59'],
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#64748b', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      name: 'Daya (kW)',
      nameTextStyle: { color: '#64748b', fontSize: 10, padding: [0, 0, 0, -10] },
      axisLabel: { color: '#64748b', fontSize: 10 },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
    },
    series: [
      {
        name: 'PV Output (kW)',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#ff4f00', width: 2.5 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 79, 0, 0.22)' },
              { offset: 1, color: 'rgba(255, 79, 0, 0.0)' }
            ]
          }
        },
        data: [0, 0, 0, 0.28, 2.72, 5.22, 5.82, 4.88, 1.75, 0, 0, 0, 0]
      },
      {
        name: 'Konsumsi Beban (kW)',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#0284c7', width: 2 },
        data: [0.85, 0.82, 0.80, 0.95, 1.45, 1.78, 1.82, 1.36, 1.62, 1.85, 1.40, 1.10, 0.90]
      },
      {
        name: 'Baterai ESS (kW)',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#10b981', width: 2, type: 'dashed' },
        data: [0, 0, 0, 0, 0.85, 1.80, 2.10, 0.76, -0.45, -0.92, -0.65, -0.20, 0]
      },
      {
        name: 'Grid PLN (kW)',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#8b5cf6', width: 1.5 },
        data: [0.85, 0.82, 0.80, 0.67, -0.42, -1.64, -1.90, -0.93, 0.58, 0.93, 0.75, 0.90, 0.90]
      }
    ]
  };

  // 2. ENERGY MONITORING OPTION
  $: energyMonitoringOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      ...lightTooltipStyle,
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['Produksi PV (kWh)', 'Konsumsi Beban (kWh)', 'Ekspor Grid (kWh)', 'Performance Ratio (PR %)'],
      textStyle: { color: '#64748b', fontSize: 11 },
      top: 0,
      left: 'center'
    },
    grid: { top: 48, right: 48, bottom: 28, left: 48 },
    xAxis: {
      type: 'category',
      data: ['11 Okt', '12 Okt', '13 Okt', '14 Okt', '15 Okt', '16 Okt', '17 Okt (Hari Ini)'],
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#64748b', fontSize: 10 }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Energi (kWh)',
        nameTextStyle: { color: '#64748b', fontSize: 10, padding: [0, 0, 0, -10] },
        axisLabel: { color: '#64748b', fontSize: 10 },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
      },
      {
        type: 'value',
        name: 'PR (%)',
        nameTextStyle: { color: '#64748b', fontSize: 10, padding: [0, 0, 0, 15] },
        min: 60,
        max: 100,
        axisLabel: { color: '#64748b', fontSize: 10, formatter: '{value}%' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: 'Produksi PV (kWh)',
        type: 'bar',
        barWidth: '22%',
        itemStyle: { color: '#ff4f00', borderRadius: [3, 3, 0, 0] },
        data: [28.4, 30.2, 26.5, 31.8, 29.4, 32.1, 27.8]
      },
      {
        name: 'Konsumsi Beban (kWh)',
        type: 'bar',
        barWidth: '22%',
        itemStyle: { color: '#0284c7', borderRadius: [3, 3, 0, 0] },
        data: [15.8, 16.2, 15.4, 17.1, 16.8, 14.5, 16.42]
      },
      {
        name: 'Ekspor Grid (kWh)',
        type: 'bar',
        barWidth: '22%',
        itemStyle: { color: '#10b981', borderRadius: [3, 3, 0, 0] },
        data: [12.6, 14.0, 11.1, 14.7, 12.6, 17.6, 14.8]
      },
      {
        name: 'Performance Ratio (PR %)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#f59e0b', width: 2 },
        itemStyle: { color: '#f59e0b' },
        data: [84.2, 85.1, 82.8, 86.4, 85.0, 87.2, 86.1]
      }
    ]
  };

  // 3. GENERATION COMPARISON OPTION
  $: generationComparisonOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      ...lightTooltipStyle,
      axisPointer: { type: 'cross', lineStyle: { color: '#94a3b8', type: 'dashed' } }
    },
    legend: {
      data: ['Hari Ini (17 Okt)', 'Kemarin (16 Okt)', 'Rata-rata Historis', 'Target STC (7.1 kWp)'],
      textStyle: { color: '#64748b', fontSize: 11 },
      top: 0,
      left: 'center'
    },
    grid: { top: 42, right: 30, bottom: 28, left: 44 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#64748b', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      name: 'Daya (kW)',
      nameTextStyle: { color: '#64748b', fontSize: 10, padding: [0, 0, 0, -10] },
      max: 7.5,
      axisLabel: { color: '#64748b', fontSize: 10 },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
    },
    series: [
      {
        name: 'Hari Ini (17 Okt)',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#ff4f00', width: 2.5 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 79, 0, 0.22)' },
              { offset: 1, color: 'rgba(255, 79, 0, 0.0)' }
            ]
          }
        },
        data: [0.28, 1.18, 2.72, 4.41, 5.22, 5.68, 5.82, 5.42, 4.88, 3.35, 1.75, 0.52, 0.0]
      },
      {
        name: 'Kemarin (16 Okt)',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#94a3b8', width: 1.8, type: 'dashed' },
        data: [0.22, 1.05, 2.40, 4.10, 4.80, 5.30, 5.25, 4.90, 4.50, 2.90, 1.40, 0.35, 0.0]
      },
      {
        name: 'Rata-rata Historis',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#0284c7', width: 1.5, type: 'dotted' },
        data: [0.25, 1.10, 2.55, 4.25, 5.00, 5.50, 5.60, 5.20, 4.70, 3.10, 1.55, 0.40, 0.0]
      },
      {
        name: 'Target STC (7.1 kWp)',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#10b981', width: 1.2, type: 'dashed' },
        data: [0.35, 1.30, 2.80, 4.60, 5.40, 6.00, 6.10, 5.80, 5.20, 3.50, 1.80, 0.50, 0.0]
      }
    ]
  };

  // 4. HEATMAP OPTION
  $: heatmapOption = {
    backgroundColor: 'transparent',
    tooltip: {
      position: 'top',
      ...lightTooltipStyle,
      formatter: (p: any) => {
        return `<div style="font-weight:600;margin-bottom:3px;color:#0f172a;">${heatmapDays[p.value[1]]} · Jam ${heatmapHours[p.value[0]]} WIB</div>
        <div style="color:#64748b;">Intensitas Daya: <b style="color:#ff4f00;">${p.value[2]} kW</b></div>`;
      }
    },
    grid: { top: 15, right: 30, bottom: 55, left: 65 },
    xAxis: {
      type: 'category',
      data: heatmapHours,
      splitArea: { show: true, areaStyle: { color: ['rgba(241, 245, 249, 0.4)', 'rgba(255, 255, 255, 0.8)'] } },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#64748b', fontSize: 10 }
    },
    yAxis: {
      type: 'category',
      data: heatmapDays,
      splitArea: { show: true },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#64748b', fontSize: 10 }
    },
    visualMap: {
      min: 0,
      max: 6.2,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 2,
      text: ['6.2 kW (Puncak)', '0 kW'],
      textStyle: { color: '#64748b', fontSize: 10 },
      inRange: {
        color: ['#f8fafc', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ff4f00']
      }
    },
    series: [
      {
        name: 'Intensitas Pembangkitan PV',
        type: 'heatmap',
        data: generateHeatmapData(),
        label: {
          show: true,
          formatter: (p: any) => p.value[2] > 0.5 ? `${p.value[2]}` : '',
          color: '#334155',
          fontSize: 10
        },
        itemStyle: {
          borderColor: '#ffffff',
          borderWidth: 2,
          borderRadius: 3
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.15)',
            borderColor: '#ff4f00',
            borderWidth: 1.5
          }
        }
      }
    ]
  };

  $: activeDashboardChartOption = 
    chartTab === 'Power Curve' ? powerCurveOption :
    chartTab === 'Energy Monitoring' ? energyMonitoringOption :
    chartTab === 'Generation Comparison' ? generationComparisonOption :
    heatmapOption;
</script>

<svelte:head>
  <title>Plant Detail - {plantName} | RESS Monitoring</title>
</svelte:head>

<!-- Global App Shell Layout: Unified Sidebar + Main View -->
<div class="page-shell min-h-screen bg-[#f3f7f8] text-[#1a3449] font-sans flex flex-col overflow-x-hidden selection:bg-[#ff4f00] selection:text-white">
  
  <!-- Fixed Left Sidebar (Standard RESS Unified Navigation) -->
  <aside class="sidebar {menuOpen ? 'open' : ''} fixed inset-y-0 left-0 z-30 flex w-[72px] flex-col border-r border-[#0096d6] bg-[#00b7ff]">
    <div class="flex h-14 items-center justify-center border-b border-[#0096d6] text-2xl text-white font-bold">
      ☼
    </div>
    <nav class="mt-2 flex flex-1 flex-col gap-1 px-2">
      <a class="nav-button" href="/dashboard" title="Home">
        <span class="nav-glyph">⌂</span>
        <span>Home</span>
      </a>
      <a class="nav-button current" href="/plant" title="Plants">
        <span class="nav-glyph">▦</span>
        <span>Plants</span>
      </a>
      <a class="nav-button" href="/devices" title="Devices">
        <span class="nav-glyph">▤</span>
        <span>Devices</span>
      </a>
      <a class="nav-button" href="/maintenance" title="Maintenance">
        <span class="nav-glyph">⌁</span>
        <span>Maintenance</span>
      </a>
      <a class="nav-button" href="/report" title="Reports">
        <span class="nav-glyph">▧</span>
        <span>Reports</span>
      </a>
      <a class="nav-button" href="/settings" title="Settings">
        <span class="nav-glyph">⚙</span>
        <span>Settings</span>
      </a>
    </nav>
    <a href="/support" class="nav-button mx-2 mb-3" title="Support">
      <span class="nav-glyph">?</span>
      <span>Support</span>
    </a>
  </aside>

  <!-- Main View Area (Offset by Sidebar on Desktop) -->
  <div class="flex-1 flex flex-col lg:pl-[72px]">
    
    <!-- Clean Bright Top Navigation Bar -->
    <header class="flex items-center justify-between px-5 sm:px-6 h-14 border-b border-[#e2e8f0] bg-white sticky top-0 z-40 shadow-sm">
      <div class="flex items-center gap-3">
        <!-- Mobile hamburger -->
        <button 
          class="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100" 
          on:click={() => menuOpen = !menuOpen}
          aria-label="Toggle Menu"
        >
          ☰
        </button>

        <!-- Back to Plant List -->
        <a 
          href="/plant" 
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284c7] hover:text-[#0369a1] bg-sky-50 hover:bg-sky-100 px-2.5 py-1.5 rounded-lg border border-sky-100 transition-colors" 
          aria-label="Go back to Plant List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd" />
          </svg>
          <span class="hidden sm:inline">Plants</span>
        </a>

        <div class="h-4 w-px bg-slate-200"></div>

        <!-- Plant Title & Status Pill -->
        <div class="flex items-center gap-2">
          <h1 class="text-sm sm:text-base font-bold text-[#0f172a] flex items-center gap-2 tracking-tight">
            {plantName}
          </h1>
          <span class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Normal · Running
          </span>
        </div>

        <!-- Plant Switcher Dropdown -->
        <select 
          class="hidden md:inline-block text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium outline-none cursor-pointer hover:border-slate-300"
          value={plantName}
          on:change={(e) => goto(`/plant/${encodeURIComponent(e.currentTarget.value)}`)}
          title="Ganti Plant"
        >
          <option value="PLTS Gedung 3 FT">PLTS Gedung 3 FT</option>
          <option value="PLTS di Indomaker">PLTS di Indomaker</option>
        </select>
      </div>
      
      <!-- Right Quick Tools -->
      <div class="flex items-center gap-2 sm:gap-3">
        <div class="flex items-center bg-slate-100 rounded-full px-2.5 py-1 gap-1.5 border border-slate-200">
          <div class="w-2 h-2 rounded-full bg-[#10b981]"></div>
          <span class="text-[11px] font-medium text-slate-600">Online</span>
        </div>

        <button 
          class="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors" 
          title="Perbarui Data"
          on:click={() => showToast('Data telemetry plant diperbarui')}
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </button>

        <a 
          href="/report" 
          class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 text-xs font-semibold text-[#ff4f00] transition-colors"
          title="Buka Laporan Terperinci"
        >
          <span>Laporan</span>
          <span class="text-[10px]">↗</span>
        </a>
      </div>
    </header>
    
    <!-- Clean Interactive Sub-Tabs Bar -->
    <nav class="flex gap-6 px-5 sm:px-6 h-11 items-center border-b border-[#e2e8f0] bg-white text-xs font-medium sticky top-14 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-x-auto">
      <button 
        class="h-full border-b-2 px-1 transition-colors whitespace-nowrap {activeTab === 'Dashboard' ? 'border-[#ff4f00] text-[#ff4f00] font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'}"
        on:click={() => activeTab = 'Dashboard'}
      >
        Dashboard
      </button>
      
      <button 
        class="h-full border-b-2 px-1 transition-colors flex items-center gap-1.5 whitespace-nowrap {activeTab === 'Kontrol Energi' ? 'border-[#ff4f00] text-[#ff4f00] font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'}"
        on:click={() => activeTab = 'Kontrol Energi'}
      >
        Kontrol Energi
        <span class="w-1.5 h-1.5 rounded-full bg-[#ff4f00]"></span>
      </button>

      <button 
        class="h-full border-b-2 px-1 transition-colors flex items-center gap-1.5 whitespace-nowrap {activeTab === 'Prediksi & Analitik' ? 'border-[#ff4f00] text-[#ff4f00] font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'}"
        on:click={() => activeTab = 'Prediksi & Analitik'}
      >
        Prediksi & Analitik
        <span class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">BMKG / AI</span>
      </button>

      <button 
        class="h-full border-b-2 px-1 transition-colors whitespace-nowrap {activeTab === 'Devices' ? 'border-[#ff4f00] text-[#ff4f00] font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'}"
        on:click={() => activeTab = 'Devices'}
      >
        Devices
      </button>
      <button 
        class="h-full border-b-2 px-1 transition-colors whitespace-nowrap {activeTab === 'Alarms' ? 'border-[#ff4f00] text-[#ff4f00] font-bold' : 'border-transparent text-slate-500 hover:text-slate-900'}"
        on:click={() => activeTab = 'Alarms'}
      >
        Alarms
      </button>
    </nav>

    <!-- Main Content Area: Bright & Elegant White Panels -->
    <main class="flex-1 p-4 sm:p-6 w-full max-w-[1600px] mx-auto pb-20">
      
      {#if activeTab === 'Dashboard'}
        <div class="flex flex-col gap-6">
          
          <!-- Top Section: Visualizer & Overview Cards -->
          <div class="flex flex-col lg:flex-row gap-6">
            
            <!-- Left Section: Clean White Visualizer Card -->
            <section class="flex-1 bg-white rounded-xl border border-[#e2e8f0] shadow-sm relative overflow-hidden flex flex-col min-h-[520px]">
              
              <!-- Header (Weather & Visualizer Controls) -->
              <div class="flex justify-between items-start p-5 z-20 border-b border-slate-100 bg-white/90 backdrop-blur-sm">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="23" y2="12"></line>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                  </div>
                  <div>
                    <div class="flex items-baseline gap-2">
                      <span class="font-semibold text-slate-800 text-sm">{weather.desc}</span>
                      <span class="text-base font-bold text-slate-900">{weather.temp}</span>
                    </div>
                    <div class="text-[11px] text-slate-500 mt-0.5">
                      Angin: {weather.wind} · Kelembaban: {weather.humidity}
                    </div>
                  </div>
                </div>
                
                <div class="flex items-center gap-3 text-[11px] text-slate-500">
                  <span class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                    <span class="w-1.5 h-1.5 rounded-full {controlMode === 'auto' ? 'bg-emerald-500' : 'bg-orange-500'}"></span>
                    Mode: {controlMode === 'auto' ? 'Otomatis' : 'Manual'}
                  </span>

                  <span class="hidden md:inline">Update: {updateTime}</span>

                  <!-- 3D / 2D Segment Switch -->
                  <div class="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 gap-0.5">
                    <button 
                      class="px-2.5 py-1 rounded text-[11px] font-medium transition-colors {viewMode === '3d' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}"
                      on:click={() => viewMode = '3d'}
                    >
                      3D
                    </button>
                    <button 
                      class="px-2.5 py-1 rounded text-[11px] font-medium transition-colors {viewMode === '2d' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}"
                      on:click={() => viewMode = '2d'}
                    >
                      2D
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Graphic Diagram Area (Bright Daylight Background) -->
              <div class="flex-1 relative flex items-center justify-center p-2 sm:p-4 overflow-hidden bg-gradient-to-br from-slate-50/50 via-sky-50/20 to-amber-50/20">
                
                {#if viewMode === '3d'}
                  <!-- 3D Isometric Energy Flow Area -->
                  <div class="relative w-full max-w-[660px] aspect-square flex items-center justify-center select-none fade-in">
                    
                    <!-- Soft Daylight Ambient Glow -->
                    <div class="absolute inset-0 rounded-full bg-radial from-amber-100/30 via-emerald-100/20 to-transparent pointer-events-none blur-2xl"></div>

                    <!-- Base 3D House Image -->
                    <img 
                      src="/images/house-power-flow.jpg" 
                      alt="Power Flow Diagram" 
                      class="w-full h-full object-contain z-0 fade-in transition-opacity duration-700 {pvInverterEnabled ? 'opacity-95' : 'opacity-70'}" 
                      style="mask-image: radial-gradient(ellipse 70% 68% at 50% 50%, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 74%); -webkit-mask-image: radial-gradient(ellipse 70% 68% at 50% 50%, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 74%);" 
                    />

                    <!-- Dynamic SVG Electrical Flow Overlay -->
                    <svg class="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1024 1024" preserveAspectRatio="xMidYMid meet">
                      <defs>
                        <!-- Glow filters -->
                        <filter id="glow-energy-light" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="3" result="blur1" />
                          <feMerge>
                            <feMergeNode in="blur1" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>

                        <filter id="glow-grid-light" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="3" result="blur1" />
                          <feMerge>
                            <feMergeNode in="blur1" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      <!-- 1. BASE CONDUIT TRACKS -->
                      <path d="M 440 270 L 550 350 L 675 436 L 681 465 L 681 535" stroke="rgba(15,23,42,0.18)" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M 655 442 L 614 468 L 614 690 L 665 690 L 665 650" stroke="rgba(15,23,42,0.18)" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M 852 365 Q 815 470 770 436 L 770 565 L 770 672 L 685 672 L 685 650" stroke="rgba(15,23,42,0.18)" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M 685 650 L 685 690 L 730 735 L 758 775" stroke="rgba(15,23,42,0.18)" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M 665 650 L 665 690 L 614 690 L 480 690 L 390 710 L 290 765" stroke="rgba(15,23,42,0.18)" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />

                      <!-- 2. DYNAMIC ELECTRIC FLOWS -->
                      {#if pvInverterEnabled}
                        <!-- A. Solar PV Flow -->
                        {#if effectivePv > 0}
                          <path 
                            d="M 440 270 L 550 350 L 675 436 L 681 465 L 681 535" 
                            stroke="#059669" 
                            stroke-width="3" 
                            stroke-linecap="round" 
                            stroke-linejoin="round" 
                            fill="none" 
                            stroke-dasharray="14 26" 
                            class={effectivePv > 2 ? 'flow-anim-forward-fast' : 'flow-anim-forward'} 
                            filter="url(#glow-energy-light)" 
                          />
                          <path 
                            d="M 440 270 L 550 350 L 675 436 L 681 465 L 681 535" 
                            stroke="#ffffff" 
                            stroke-width="1.4" 
                            stroke-linecap="round" 
                            stroke-linejoin="round" 
                            fill="none" 
                            stroke-dasharray="5 35" 
                            class={effectivePv > 2 ? 'flow-anim-forward-fast' : 'flow-anim-forward'} 
                          />

                          <path 
                            d="M 655 442 L 614 468 L 614 690 L 665 690 L 665 650" 
                            stroke="#059669" 
                            stroke-width="2.6" 
                            stroke-linecap="round" 
                            stroke-linejoin="round" 
                            fill="none" 
                            stroke-dasharray="12 24" 
                            class="flow-anim-forward" 
                            filter="url(#glow-energy-light)" 
                          />
                        {/if}

                        <!-- B. Grid PLN Flow -->
                        {#if gridPower > 0}
                          <path 
                            d="M 852 365 Q 815 470 770 436 L 770 565 L 770 672 L 685 672 L 685 650" 
                            stroke={gridMode === 'export' ? '#059669' : '#0284c7'} 
                            stroke-width="3" 
                            stroke-linecap="round" 
                            stroke-linejoin="round" 
                            fill="none" 
                            stroke-dasharray="14 26" 
                            class={gridMode === 'export' ? 'flow-anim-reverse' : 'flow-anim-forward'} 
                            filter="url(#glow-energy-light)" 
                          />
                        {/if}

                        <!-- C. Load Flow -->
                        {#if totalLoadPower > 0}
                          <path 
                            d="M 665 650 L 665 690 L 614 690 L 480 690 L 390 710 L 290 765" 
                            stroke="#059669" 
                            stroke-width="3" 
                            stroke-linecap="round" 
                            stroke-linejoin="round" 
                            fill="none" 
                            stroke-dasharray="14 26" 
                            class="flow-anim-forward" 
                            filter="url(#glow-energy-light)" 
                          />
                        {/if}

                        <!-- D. Battery Flow -->
                        {#if batteryPower > 0 && batteryStatus !== 'standby'}
                          <path 
                            d="M 685 650 L 685 690 L 730 735 L 758 775" 
                            stroke={batteryStatus === 'charging' ? '#059669' : '#10b981'} 
                            stroke-width="3" 
                            stroke-linecap="round" 
                            stroke-linejoin="round" 
                            fill="none" 
                            stroke-dasharray="14 26" 
                            class={batteryStatus === 'charging' ? 'flow-anim-forward' : 'flow-anim-reverse'} 
                            filter="url(#glow-energy-light)" 
                          />
                        {/if}

                        <!-- Inverter Pulse Indicator -->
                        <circle cx="682" cy="592" r="26" fill="none" stroke="#059669" class="inverter-ring" />
                        <circle cx="682" cy="592" r="4" fill="#059669" />
                      {:else}
                        <circle cx="682" cy="592" r="3.5" fill="#ef4444" />
                      {/if}

                      <circle cx="681" cy="535" r="3" fill={pvInverterEnabled && effectivePv > 0 ? "#059669" : "#94a3b8"} />
                      <circle cx="665" cy="650" r="3" fill={pvInverterEnabled ? "#059669" : "#94a3b8"} />
                      <circle cx="685" cy="650" r="3" fill={pvInverterEnabled ? "#059669" : "#94a3b8"} />
                    </svg>

                    <!-- 3. CRISP WHITE TELEMETRY BADGES -->
                    <div class="absolute inset-0 z-20 pointer-events-none">
                      
                      <!-- Badge 1: PV Output -->
                      <div 
                        class="absolute top-[18%] left-[54%] flex flex-col items-center bg-white/95 px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-md backdrop-blur-md pointer-events-auto transition-transform hover:scale-105 cursor-pointer"
                        on:click={() => showToast(`PV Output: ${effectivePv.toFixed(3)} kW`)}
                        role="button"
                        tabindex="0"
                        on:keydown={(e) => e.key === 'Enter' && showToast(`PV Output: ${effectivePv.toFixed(3)} kW`)}
                      >
                        <div class="flex items-center gap-1.5 mb-0.5">
                          <span class="w-2 h-2 rounded-full {effectivePv > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}"></span>
                          <span class="text-[10px] text-emerald-700 font-bold tracking-wide">PV Output</span>
                        </div>
                        <span class="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{effectivePv.toFixed(3)} <span class="text-[10px] text-slate-500 font-normal">kW</span></span>
                      </div>

                      <!-- Badge 2: Grid PLN -->
                      <div 
                        class="absolute top-[29%] left-[25%] bg-white/95 px-3 py-1.5 rounded-xl border border-slate-200 text-center shadow-md backdrop-blur-md pointer-events-auto transition-transform hover:scale-105 cursor-pointer"
                        on:click={() => showToast(`Grid PLN: ${gridMode === 'export' ? 'Ekspor' : 'Impor'} ${gridPower.toFixed(2)} kW`)}
                        role="button"
                        tabindex="0"
                        on:keydown={(e) => e.key === 'Enter' && showToast(`Grid PLN: ${gridPower.toFixed(2)} kW`)}
                      >
                        <span class="text-[9px] text-slate-500 block uppercase tracking-wider font-semibold">Grid PLN</span>
                        <span class="text-xs font-bold {gridMode === 'export' ? 'text-emerald-600' : 'text-sky-600'}">{gridPower.toFixed(2)} kW</span>
                        <span class="text-[9px] text-slate-500 block">{gridMode === 'export' ? 'Ekspor' : 'Impor'}</span>
                      </div>

                      <!-- Badge 3: Beban Gedung -->
                      <div 
                        class="absolute top-[78%] left-[25%] bg-white/95 px-3 py-1.5 rounded-xl border border-slate-200 text-center shadow-md backdrop-blur-md pointer-events-auto transition-transform hover:scale-105 cursor-pointer"
                        on:click={() => showToast(`Konsumsi Beban: ${totalLoadPower.toFixed(2)} kW`)}
                        role="button"
                        tabindex="0"
                        on:keydown={(e) => e.key === 'Enter' && showToast(`Konsumsi Beban: ${totalLoadPower.toFixed(2)} kW`)}
                      >
                        <span class="text-[9px] text-slate-500 block uppercase tracking-wider font-semibold">Beban Gedung</span>
                        <span class="text-xs font-bold text-slate-900">{totalLoadPower.toFixed(2)} kW</span>
                        <span class="text-[9px] text-slate-500 block">{plantName.replace('PLTS ', '')}</span>
                      </div>

                      <!-- Badge 4: Baterai ESS -->
                      <div 
                        class="absolute top-[78%] left-[73%] bg-white/95 px-3 py-1.5 rounded-xl border border-slate-200 text-center shadow-md backdrop-blur-md pointer-events-auto transition-transform hover:scale-105 cursor-pointer"
                        on:click={() => showToast(`Baterai ESS: ${batterySoc}% (${batteryStatus})`)}
                        role="button"
                        tabindex="0"
                        on:keydown={(e) => e.key === 'Enter' && showToast(`Baterai ESS: ${batterySoc}%`)}
                      >
                        <span class="text-[9px] text-slate-500 block uppercase tracking-wider font-semibold">Baterai ESS</span>
                        <span class="text-xs font-bold text-emerald-600">{batterySoc}% ({batteryPower.toFixed(2)} kW)</span>
                        <span class="text-[9px] text-slate-500 block capitalize">{batteryStatus}</span>
                      </div>

                    </div>

                  </div>
                
                {:else}
                  <!-- 2D Minimalist Circular Node Topology (Clean White Theme) -->
                  <div class="w-full h-full flex flex-col items-center justify-center relative fade-in select-none">
                    
                    <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 520 320" preserveAspectRatio="xMidYMid meet">
                      <defs>
                        <marker id="arrow-green" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
                        </marker>
                        <marker id="arrow-cyan" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0284c7" />
                        </marker>
                      </defs>

                      <!-- PV to Inverter -->
                      {#if pvInverterEnabled && effectivePv > 0}
                        <line x1="260" y1="88" x2="260" y2="132" stroke="#10b981" stroke-width="2.5" stroke-dasharray="8,6" marker-end="url(#arrow-green)">
                          <animate attributeName="stroke-dashoffset" from="28" to="0" dur="1s" repeatCount="indefinite" />
                        </line>
                      {:else}
                        <line x1="260" y1="88" x2="260" y2="132" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3,3" />
                      {/if}

                      <!-- Inverter to Grid -->
                      {#if pvInverterEnabled && gridPower > 0}
                        {#if gridMode === 'export'}
                          <line x1="228" y1="160" x2="148" y2="160" stroke="#10b981" stroke-width="2.5" stroke-dasharray="8,6" marker-end="url(#arrow-green)">
                            <animate attributeName="stroke-dashoffset" from="28" to="0" dur="1.2s" repeatCount="indefinite" />
                          </line>
                        {:else}
                          <line x1="148" y1="160" x2="228" y2="160" stroke="#0284c7" stroke-width="2.5" stroke-dasharray="8,6" marker-end="url(#arrow-cyan)">
                            <animate attributeName="stroke-dashoffset" from="28" to="0" dur="1.2s" repeatCount="indefinite" />
                          </line>
                        {/if}
                      {:else}
                        <line x1="148" y1="160" x2="228" y2="160" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3,3" />
                      {/if}

                      <!-- Inverter to Load -->
                      {#if pvInverterEnabled && totalLoadPower > 0}
                        <line x1="292" y1="160" x2="372" y2="160" stroke="#10b981" stroke-width="2.5" stroke-dasharray="8,6" marker-end="url(#arrow-green)">
                          <animate attributeName="stroke-dashoffset" from="28" to="0" dur="1s" repeatCount="indefinite" />
                        </line>
                      {:else}
                        <line x1="292" y1="160" x2="372" y2="160" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3,3" />
                      {/if}

                      <!-- Inverter to Battery -->
                      {#if pvInverterEnabled && batteryPower > 0 && batteryStatus !== 'standby'}
                        <line x1="260" y1="188" x2="260" y2="232" stroke="#10b981" stroke-width="2.5" stroke-dasharray="8,6" marker-end="url(#arrow-green)">
                          <animate attributeName="stroke-dashoffset" from="28" to="0" dur="1.2s" repeatCount="indefinite" />
                        </line>
                      {:else}
                        <line x1="260" y1="188" x2="260" y2="232" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="2,2" />
                      {/if}
                    </svg>

                    <!-- Node 1: PV Solar (Top) -->
                    <div 
                      class="absolute top-[6%] left-1/2 -translate-x-1/2 flex flex-col items-center justify-center w-[116px] h-[116px] rounded-full border-2 {pvInverterEnabled && effectivePv > 0 ? 'border-emerald-500 bg-emerald-50/70' : 'border-slate-300 bg-white'} z-10 transition-transform hover:scale-105 cursor-pointer shadow-sm"
                      on:click={() => showToast(`PV: ${effectivePv.toFixed(3)} kW`)}
                      role="button"
                      tabindex="0"
                      on:keydown={(e) => e.key === 'Enter' && showToast(`PV: ${effectivePv.toFixed(3)} kW`)}
                    >
                      <svg class="w-5 h-5 {effectivePv > 0 ? 'text-emerald-600' : 'text-slate-400'} mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line>
                      </svg>
                      <span class="text-[10px] text-slate-500 font-medium">PV Output</span>
                      <span class="text-base font-bold text-slate-900">{effectivePv.toFixed(3)} <span class="text-[10px] text-slate-500 font-normal">kW</span></span>
                    </div>

                    <!-- Node 2: Grid PLN (Left) -->
                    <div 
                      class="absolute top-1/2 left-[10%] -translate-y-1/2 flex flex-col items-center justify-center w-[94px] h-[94px] rounded-full border-2 border-slate-200 bg-white z-10 transition-transform hover:scale-105 cursor-pointer shadow-sm"
                      on:click={() => showToast(`Grid: ${gridMode === 'export' ? 'Ekspor' : 'Impor'} ${gridPower.toFixed(2)} kW`)}
                      role="button"
                      tabindex="0"
                      on:keydown={(e) => e.key === 'Enter' && showToast(`Grid: ${gridPower.toFixed(2)} kW`)}
                    >
                      <svg class="w-4 h-4 text-sky-600 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                      </svg>
                      <span class="text-[10px] text-slate-500 font-medium">Grid PLN</span>
                      <span class="text-xs font-bold text-slate-900">{gridPower.toFixed(2)} kW</span>
                      <span class="text-[9px] font-semibold {gridMode === 'export' ? 'text-emerald-600' : 'text-sky-600'}">{gridMode === 'export' ? 'Ekspor' : 'Impor'}</span>
                    </div>

                    <!-- Center: Inverter Hybrid Hub -->
                    <div 
                      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-[78px] h-[78px] rounded-full border-2 transition-all cursor-pointer hover:scale-105 z-10 shadow-md {pvInverterEnabled ? 'border-emerald-500 bg-emerald-50' : 'border-rose-400 bg-rose-50'}"
                      on:click={togglePvInverter}
                      role="button"
                      tabindex="0"
                      on:keydown={(e) => e.key === 'Enter' && togglePvInverter()}
                      title="Klik untuk {pvInverterEnabled ? 'mematikan' : 'menyalakan'} Inverter"
                    >
                      <span class="text-[9px] font-bold uppercase tracking-tight {pvInverterEnabled ? 'text-emerald-700' : 'text-rose-700'}">
                        {pvInverterEnabled ? 'INV · ON' : 'INV · OFF'}
                      </span>
                      <span class="text-[11px] font-bold text-slate-900">
                        {pvInverterEnabled ? ((effectivePv) + (batteryStatus === 'discharging' ? batteryPower : 0)).toFixed(2) + ' kW' : '0 kW'}
                      </span>
                      <span class="text-[8px] text-slate-500">{pvInverterEnabled ? 'Aktif' : 'Mati'}</span>
                    </div>

                    <!-- Node 3: Load (Right) -->
                    <div 
                      class="absolute top-1/2 right-[10%] -translate-y-1/2 flex flex-col items-center justify-center w-[94px] h-[94px] rounded-full border-2 border-slate-200 bg-white z-10 transition-transform hover:scale-105 cursor-pointer shadow-sm"
                      on:click={() => showToast(`Total Beban: ${totalLoadPower.toFixed(2)} kW`)}
                      role="button"
                      tabindex="0"
                      on:keydown={(e) => e.key === 'Enter' && showToast(`Beban: ${totalLoadPower.toFixed(2)} kW`)}
                    >
                      <svg class="w-4 h-4 text-slate-600 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"></path>
                      </svg>
                      <span class="text-[10px] text-slate-500 font-medium">Beban</span>
                      <span class="text-xs font-bold text-slate-900">{totalLoadPower.toFixed(2)} kW</span>
                      <span class="text-[9px] text-slate-500">{plantName.replace('PLTS ', '')}</span>
                    </div>

                    <!-- Node 4: Battery ESS (Bottom) -->
                    <div 
                      class="absolute bottom-[6%] left-1/2 -translate-x-1/2 flex flex-col items-center justify-center w-[116px] h-[116px] rounded-full border-2 border-emerald-500 bg-emerald-50/70 z-10 transition-transform hover:scale-105 cursor-pointer shadow-sm"
                      on:click={() => showToast(`Baterai ESS: ${batterySoc}% (${batteryStatus})`)}
                      role="button"
                      tabindex="0"
                      on:keydown={(e) => e.key === 'Enter' && showToast(`Baterai: ${batterySoc}%`)}
                    >
                      <svg class="w-4 h-4 text-emerald-600 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="7" width="16" height="10" rx="2" ry="2"></rect>
                        <line x1="22" y1="11" x2="22" y2="13"></line>
                      </svg>
                      <span class="text-[10px] text-slate-600 font-medium">Baterai ESS</span>
                      <span class="text-base font-bold text-slate-900">{batterySoc}% <span class="text-[10px] text-slate-500 font-normal">SOC</span></span>
                      <span class="text-[9px] font-semibold text-emerald-600">
                        {batteryStatus === 'charging' ? `+${batteryPower.toFixed(2)} kW` : batteryStatus === 'discharging' ? `-${batteryPower.toFixed(2)} kW` : 'Siaga'}
                      </span>
                    </div>

                  </div>
                {/if}

              </div>
            </section>
            
            <!-- Right Section: Overview & Environmental Cards (Clean White Theme) -->
            <section class="w-full lg:w-[420px] flex flex-col gap-6">
              
              <!-- Overview Card -->
              <div class="bg-white border border-[#e2e8f0] shadow-sm rounded-xl flex flex-col p-5 h-[280px]">
                <div class="flex justify-between items-center mb-6">
                  <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#ff4f00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Ringkasan Pembangkitan
                  </h2>
                  <div class="flex gap-2">
                    <div class="bg-slate-50 border border-slate-200 text-xs px-2.5 py-1 rounded-lg flex items-center justify-between w-[120px] text-slate-700">
                      <span class="text-slate-400 cursor-pointer hover:text-slate-700">‹</span>
                      <span class="text-xs font-medium">09/10/2026</span>
                      <span class="text-slate-400 cursor-pointer hover:text-slate-700">›</span>
                    </div>
                    <select 
                      class="bg-slate-50 border border-slate-200 text-xs px-2 py-1 rounded-lg outline-none w-[70px] text-slate-700 font-medium"
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
                  <div class="flex flex-col items-center">
                    <div class="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-2 shadow-sm">
                      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                      </svg>
                    </div>
                    <div class="text-3xl font-light text-slate-900 tracking-tight">{overview.energy} <span class="text-xs text-slate-500 font-normal">kWh</span></div>
                    <div class="text-[11px] text-slate-500 mt-1 font-medium">Energy Generation</div>
                  </div>
                  
                  <!-- Generation Revenue -->
                  <div class="flex flex-col items-center">
                    <div class="w-11 h-11 rounded-full bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center mb-2 shadow-sm">
                      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 6v12M15 9.5a3.5 3.5 0 0 0-7 0c0 4 7 2 7 6a3.5 3.5 0 0 1-7 0"></path>
                      </svg>
                    </div>
                    <div class="text-3xl font-light text-slate-900 tracking-tight">{overview.revenue} <span class="text-xs text-slate-500 font-normal">k IDR</span></div>
                    <div class="text-[11px] text-slate-500 mt-1 font-medium">Generation Revenue</div>
                  </div>
                </div>
              </div>
              
              <!-- Environmental Contributions Card -->
              <div class="bg-white border border-[#e2e8f0] shadow-sm rounded-xl flex flex-col p-5 flex-1">
                <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
                  <svg class="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  Kontribusi Lingkungan
                </h2>
                
                <div class="flex justify-between gap-3 h-full">
                  <div class="flex-1 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col items-center justify-center p-3">
                    <div class="text-sm font-bold text-slate-800">{environmental.coal}</div>
                    <div class="text-[10px] text-slate-500 text-center mt-1 uppercase tracking-tight font-medium">Coal Saved</div>
                  </div>
                  <div class="flex-1 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col items-center justify-center p-3">
                    <div class="text-sm font-bold text-emerald-700">{environmental.trees}</div>
                    <div class="text-[10px] text-slate-500 text-center mt-1 uppercase tracking-tight font-medium">Trees Planted</div>
                  </div>
                  <div class="flex-1 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col items-center justify-center p-3">
                    <div class="text-sm font-bold text-sky-700">{environmental.co2}</div>
                    <div class="text-[10px] text-slate-500 text-center mt-1 uppercase tracking-tight font-medium">CO₂ Reduct.</div>
                  </div>
                </div>
              </div>
              
            </section>
          </div>

          <!-- Quick Summary Widget: Prediksi & Cuaca (Clean White Theme) -->
          <section class="bg-white border border-[#e2e8f0] shadow-sm rounded-xl p-5 sm:p-6 flex flex-col gap-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#ff4f00]">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
                  </svg>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h2 class="text-sm font-bold text-slate-900 tracking-tight">Prakiraan Cuaca & Prediksi Produksi PV</h2>
                    <span class="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {weatherModelSource} Model
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 mt-0.5">
                    Estimasi hasil pembangkitan harian/mingguan dan kalkulasi potensi teknis PV
                  </p>
                </div>
              </div>

              <button 
                class="text-xs text-[#ff4f00] hover:text-[#ea580c] flex items-center gap-1 font-semibold transition-colors group self-start sm:self-auto"
                on:click={() => activeTab = 'Prediksi & Analitik'}
              >
                <span>Buka Prediksi & Analitik Lengkap</span>
                <span class="transition-transform group-hover:translate-x-0.5">→</span>
              </button>
            </div>

            <!-- Quick Metrics Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                <span class="text-[11px] text-slate-500 font-medium">Estimasi Hari Ini</span>
                <div class="my-1">
                  <span class="text-lg font-bold text-slate-900">31.40 <span class="text-xs text-slate-500 font-normal">kWh</span></span>
                  <span class="text-[10px] text-emerald-600 block font-semibold">Tercapai 27.80 kWh (88.5%)</span>
                </div>
                <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-emerald-500 h-full rounded-full" style="width: 88.5%;"></div>
                </div>
              </div>

              <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                <span class="text-[11px] text-slate-500 font-medium">Estimasi Besok</span>
                <div class="my-1">
                  <span class="text-lg font-bold text-slate-900">34.20 <span class="text-xs text-slate-500 font-normal">kWh</span></span>
                  <span class="text-[10px] text-sky-600 block font-semibold">Cerah Dominan · PSH 4.85j</span>
                </div>
                <span class="text-[10px] text-slate-500">+8.9% vs rata-rata harian</span>
              </div>

              <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                <span class="text-[11px] text-slate-500 font-medium">Potensi Teknis PV (Live)</span>
                <div class="my-1">
                  <span class="text-lg font-bold text-slate-900">{technicalPvPotentialKw.toFixed(2)} <span class="text-xs text-slate-500 font-normal">kW</span></span>
                  <span class="text-[10px] text-emerald-600 block font-semibold">Pencapaian: {potentialRealizationRatio.toFixed(1)}%</span>
                </div>
                <span class="text-[10px] text-slate-500">G_poa: {weatherCurrent.irradiancePoa} W/m²</span>
              </div>

              <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                <span class="text-[11px] text-slate-500 font-medium">Kondisi Cuaca & Awan</span>
                <div class="my-1">
                  <span class="text-lg font-bold text-slate-900">{weatherCurrent.tempAmbient}°C</span>
                  <span class="text-[10px] text-slate-600 block font-medium">Awan {weatherCurrent.cloudCoverTotal}% · Angin {weatherCurrent.windSpeed} km/h</span>
                </div>
                <span class="text-[10px] text-slate-500">{weatherCurrent.source.split(' ')[0]} {weatherCurrent.stationId}</span>
              </div>
            </div>

            <!-- 3-Day Mini Preview Strip -->
            <div class="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-2 text-slate-600">
                <span class="text-slate-900 font-semibold">Prakiraan 3 Hari:</span>
                <span>Ringkasan prospek cuaca & energi</span>
              </div>
              <div class="grid grid-cols-3 gap-2 w-full sm:w-auto">
                {#each weeklyForecastData.slice(1, 4) as dayForecast}
                  <div class="bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2 shadow-xs">
                    <div class="w-2 h-2 rounded-full {dayForecast.predictedKwh > 30 ? 'bg-emerald-500' : dayForecast.predictedKwh > 24 ? 'bg-orange-500' : 'bg-sky-500'}"></div>
                    <div>
                      <span class="text-slate-900 font-bold block text-[11px]">{dayForecast.day}</span>
                      <span class="text-slate-500 text-[10px]">{dayForecast.predictedKwh} kWh</span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </section>

          <!-- Interactive Bottom Analytics Charts -->
          <section class="bg-white border border-[#e2e8f0] shadow-sm rounded-xl overflow-hidden flex flex-col">
            
            <!-- Chart Filter Toolbar -->
            <div class="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div class="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start">
                {#each ['Power Curve', 'Energy Monitoring', 'Generation Comparison', 'Heatmap'] as tab}
                  <button 
                    class="px-3 py-1.5 rounded-md text-xs font-semibold transition-all {chartTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}"
                    on:click={() => chartTab = tab}
                  >
                    {tab}
                  </button>
                {/each}
              </div>

              <div class="flex items-center gap-2 text-xs text-slate-500">
                <span>Interval: Realtime Telemetry</span>
                <span class="text-slate-300">|</span>
                <span class="text-emerald-600 font-medium">Online RTU-01</span>
              </div>
            </div>

            <!-- Chart Canvas Container -->
            <div class="p-5">
              <div class="w-full h-[340px] bg-white rounded-lg p-2">
                <Chart option={activeDashboardChartOption} />
              </div>

              <!-- Tab Engineering Insight Footer -->
              <div class="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <div class="flex items-start md:items-center gap-2.5">
                  <svg class="w-4 h-4 text-[#ff4f00] shrink-0 mt-0.5 md:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {#if chartTab === 'Power Curve'}
                      <strong class="text-slate-900">Keseimbangan Daya:</strong> P_pv (5.82 kW) menyuplai Beban (1.36 kW), Pengisian Baterai (+0.76 kW), dan Ekspor Grid (1.90 kW). Sistem beroperasi optimal tanpa pemotongan daya.
                    {:else if chartTab === 'Energy Monitoring'}
                      <strong class="text-slate-900">Audit Neraca Energi:</strong> Total produksi 206.2 kWh mampu memenuhi kebutuhan siang hari, dan surplus 97.4 kWh diekspor ke PLN untuk menekan tagihan bulanan.
                    {:else if chartTab === 'Generation Comparison'}
                      <strong class="text-slate-900">Analisis Komparatif:</strong> Kurva produksi mencapai 82.0% dari kapasitas puncak teoritis STC, membuktikan panel surya bersih dan tracking MPPT bekerja optimal.
                    {:else if chartTab === 'Heatmap'}
                      <strong class="text-slate-900">Pola Insolasi:</strong> Matriks visual menunjukkan distribusi intensitas radiasi matahari 06:00 - 18:00 WIB. Warna oranye menandakan jam produksi puncak (Peak Sun Hours).
                    {/if}
                  </span>
                </div>
                <div class="flex items-center gap-2 shrink-0 text-[11px] text-slate-400">
                  <span>Resolusi: 60 Menit</span>
                </div>
              </div>
            </div>
          </section>
        </div>

      <!-- ============================================================== -->
      <!-- TAB: KONTROL ENERGI (EMS MANAGEMENT SUITE)                     -->
      <!-- ============================================================== -->
      {:else if activeTab === 'Kontrol Energi'}
        <div class="flex flex-col gap-6 fade-in">
          
          <!-- Top Banner & Global Switch -->
          <div class="bg-white border border-[#e2e8f0] shadow-sm rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 class="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Sistem Manajemen & Kontrol Energi (EMS)</h1>
              <p class="text-xs text-slate-500 mt-0.5">Konfigurasi operasional pembangkitan {plantName} dan proteksi aliran daya</p>
            </div>

            <div class="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button 
                class="px-4 py-2 rounded-md text-xs font-semibold transition-all {controlMode === 'auto' ? 'bg-[#ff4f00] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}"
                on:click={() => toggleControlMode('auto')}
              >
                Mode Otomatis (AI-EMS)
              </button>
              <button 
                class="px-4 py-2 rounded-md text-xs font-semibold transition-all {controlMode === 'manual' ? 'bg-[#ff4f00] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}"
                on:click={() => toggleControlMode('manual')}
              >
                Mode Manual
              </button>
            </div>
          </div>

          <!-- Strategy Status Bar -->
          {#if controlMode === 'auto'}
            <div class="bg-white border border-[#e2e8f0] shadow-sm rounded-xl px-5 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-2 text-slate-600">
                <span class="font-medium text-slate-500">Strategi Operasi:</span>
                <span class="text-slate-900 font-bold">
                  {autoStrategy === 'self_consumption' ? 'Konsumsi Mandiri (Prioritas beban lokal & pengisian baterai)' :
                   autoStrategy === 'peak_shaving' ? 'Cukur Beban Puncak (Menekan konsumsi puncak PLN)' :
                   autoStrategy === 'tou' ? 'Tarif Waktu (Optimasi jam puncak WBP/LWBP)' :
                   'Cadangan Daya (Mempertahankan baterai penuh untuk darurat)'}
                </span>
              </div>

              <!-- Segmented Strategy Selector -->
              <div class="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                {#each [
                  { id: 'self_consumption', label: 'Konsumsi Mandiri' },
                  { id: 'peak_shaving', label: 'Beban Puncak' },
                  { id: 'tou', label: 'Tarif Waktu' },
                  { id: 'backup', label: 'Cadangan' }
                ] as strat}
                  <button 
                    class="px-2.5 py-1 rounded text-[11px] font-semibold transition-colors {autoStrategy === strat.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}"
                    on:click={() => setAutoStrategy(strat.id as any)}
                  >
                    {strat.label}
                  </button>
                {/each}
              </div>
            </div>
          {:else}
            <div class="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center justify-between text-xs text-amber-800">
              <span class="font-medium">Kontrol Manual Aktif: Nilai daya dan saklar perangkat dikendalikan langsung oleh operator.</span>
              <button 
                class="text-xs text-[#ff4f00] hover:underline font-bold"
                on:click={() => toggleControlMode('auto')}
              >
                Kembalikan ke Otomatis
              </button>
            </div>
          {/if}

          <!-- 4 Core Control Cards (Clean Light Theme) -->
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            
            <!-- CARD 1: BATERAI ESS -->
            <div class="bg-white border border-[#e2e8f0] shadow-sm rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <svg class="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="7" width="16" height="10" rx="2" ry="2"></rect>
                      <line x1="22" y1="11" x2="22" y2="13"></line>
                    </svg>
                    Baterai ESS
                  </div>
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full {batterySoc >= 50 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}">
                    {batterySoc}% SOC
                  </span>
                </div>

                <div class="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                  {batteryStatus === 'charging' ? '+' : batteryStatus === 'discharging' ? '-' : ''}{batteryPower.toFixed(2)} <span class="text-xs text-slate-500 font-normal">kW</span>
                </div>
                <div class="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full {batteryStatus === 'charging' ? 'bg-emerald-500' : batteryStatus === 'discharging' ? 'bg-orange-500' : 'bg-slate-400'}"></span>
                  {batteryStatus === 'charging' ? 'Pengisian Daya' : batteryStatus === 'discharging' ? 'Pengosongan Daya' : 'Siaga'}
                </div>

                <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden my-3">
                  <div class="h-full rounded-full transition-all duration-500 bg-emerald-500" style="width: {batterySoc}%;"></div>
                </div>

                <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-500 py-2 border-t border-slate-100">
                  <div>Tegangan: <span class="text-slate-800 font-semibold">{batteryVoltage} V</span></div>
                  <div>Arus: <span class="text-slate-800 font-semibold">{batteryCurrent} A</span></div>
                  <div>Suhu: <span class="text-slate-800 font-semibold">{batteryTemp} °C</span></div>
                  <div>SOH: <span class="text-emerald-600 font-semibold">{batteryHealth}%</span></div>
                </div>
              </div>

              <!-- Controls -->
              <div class="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <div class="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Mode Operasi</span>
                  <span class="text-slate-800 font-bold capitalize">{batteryManualMode}</span>
                </div>

                <div class="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  {#each [
                    { id: 'auto', label: 'Auto' },
                    { id: 'charge', label: 'Isi' },
                    { id: 'discharge', label: 'Kosong' },
                    { id: 'standby', label: 'Siaga' }
                  ] as bmode}
                    <button 
                      class="py-1 rounded text-[11px] font-semibold transition-colors {batteryManualMode === bmode.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}"
                      on:click={() => {
                        if (controlMode !== 'manual') toggleControlMode('manual');
                        setBatteryMode(bmode.id as any);
                      }}
                    >
                      {bmode.label}
                    </button>
                  {/each}
                </div>

                <div class="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>Batas: {batteryMaxChargePower} kW</span>
                  <span>Min Reserve: {batteryMinSocCutoff}%</span>
                </div>
              </div>
            </div>

            <!-- CARD 2: GRID PLN -->
            <div class="bg-white border border-[#e2e8f0] shadow-sm rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <svg class="w-3.5 h-3.5 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                    </svg>
                    Grid PLN
                  </div>
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full {gridMode === 'export' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-sky-50 text-sky-700 border border-sky-200'}">
                    {gridMode === 'export' ? 'Ekspor' : 'Impor'}
                  </span>
                </div>

                <div class="text-2xl font-bold {gridMode === 'export' ? 'text-emerald-600' : 'text-sky-600'} tracking-tight mt-1">
                  {gridPower.toFixed(2)} <span class="text-xs text-slate-500 font-normal">kW</span>
                </div>
                <div class="text-xs text-slate-500 mt-0.5">
                  Tegangan: {gridVoltage} V · Frekuensi: {gridFrequency} Hz
                </div>

                <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-500 py-3 border-t border-slate-100 my-2">
                  <div>Ekspor Hari Ini: <span class="text-slate-800 font-semibold">{gridDailyExport} kWh</span></div>
                  <div>Impor Hari Ini: <span class="text-slate-800 font-semibold">{gridDailyImport} kWh</span></div>
                </div>
              </div>

              <div class="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-slate-700">Mode Zero Export</span>
                  <button 
                    class="w-8 h-4 rounded-full transition-colors p-0.5 flex items-center {zeroExportEnabled ? 'bg-[#ff4f00] justify-end' : 'bg-slate-300 justify-start'}"
                    on:click={toggleZeroExport}
                    aria-label="Toggle Zero Export"
                  >
                    <div class="w-3 h-3 rounded-full bg-white shadow-xs"></div>
                  </button>
                </div>
                <div class="flex justify-between text-[10px] text-slate-500">
                  <span>Batas Ekspor Maks: {exportLimit} kW</span>
                </div>
              </div>
            </div>

            <!-- CARD 3: PV PANEL SURYA -->
            <div class="bg-white border border-[#e2e8f0] shadow-sm rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <svg class="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line>
                    </svg>
                    PV Panel Surya
                  </div>
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full {pvInverterEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
                    {pvInverterEnabled ? 'Inverter ON' : 'Inverter OFF'}
                  </span>
                </div>

                <div class="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                  {effectivePv.toFixed(3)} <span class="text-xs text-slate-500 font-normal">kW</span>
                </div>
                <div class="text-xs text-slate-500 mt-0.5">
                  Radiasi: {pvIrradiance} W/m² · Efisiensi: {pvEfficiency}%
                </div>

                <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-500 py-3 border-t border-slate-100 my-2">
                  <div>String 1: <span class="text-slate-800 font-semibold">{pvString1.p} kW</span></div>
                  <div>String 2: <span class="text-slate-800 font-semibold">{pvString2.p} kW</span></div>
                </div>
              </div>

              <div class="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-slate-700">Saklar Inverter Utama</span>
                  <button 
                    class="w-8 h-4 rounded-full transition-colors p-0.5 flex items-center {pvInverterEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'}"
                    on:click={togglePvInverter}
                    aria-label="Toggle Inverter"
                  >
                    <div class="w-3 h-3 rounded-full bg-white shadow-xs"></div>
                  </button>
                </div>
                <div class="flex justify-between text-[10px] text-slate-500">
                  <span>Curtailment: {pvLimitPercent}%</span>
                </div>
              </div>
            </div>

            <!-- CARD 4: BEBAN GEDUNG -->
            <div class="bg-white border border-[#e2e8f0] shadow-sm rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <svg class="w-3.5 h-3.5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"></path>
                    </svg>
                    Beban Gedung
                  </div>
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    PF: {loadPowerFactor}
                  </span>
                </div>

                <div class="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                  {totalLoadPower.toFixed(2)} <span class="text-xs text-slate-500 font-normal">kW</span>
                </div>
                <div class="text-xs text-slate-500 mt-0.5">
                  Konsumsi Hari Ini: {loadDailyConsumption} kWh
                </div>

                <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-500 py-3 border-t border-slate-100 my-2">
                  <div>Beban Puncak: <span class="text-slate-800 font-semibold">{loadPeakToday} kW</span></div>
                  <div>Tegangan: <span class="text-slate-800 font-semibold">{loadVoltage} V</span></div>
                </div>
              </div>

              <div class="pt-3 border-t border-slate-100 text-xs text-slate-500">
                <span class="font-medium text-slate-700">Pasokan Mandiri PV:</span> {Math.min(100, Math.round((effectivePv / (totalLoadPower || 1)) * 100))}%
              </div>
            </div>

          </div>

          <!-- Dispatch Logs Table -->
          <div class="bg-white border border-[#e2e8f0] shadow-sm rounded-xl p-5 sm:p-6">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Riwayat Dispatch & Log Sistem AI-EMS
            </h3>
            <div class="flex flex-col gap-2">
              {#each emsLogs as log}
                <div class="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div class="flex items-center gap-3">
                    <span class="font-mono text-slate-400 text-[11px]">{log.time}</span>
                    <span class="text-slate-700 font-medium">{log.text}</span>
                  </div>
                  <span class="text-[10px] font-bold uppercase tracking-tight {log.type === 'success' ? 'text-emerald-600' : log.type === 'warning' ? 'text-amber-600' : 'text-sky-600'}">
                    {log.type}
                  </span>
                </div>
              {/each}
            </div>
          </div>

        </div>

      <!-- ============================================================== -->
      <!-- TAB: PREDIKSI & ANALITIK (BMKG / AI SOLAR FORECAST)            -->
      <!-- ============================================================== -->
      {:else if activeTab === 'Prediksi & Analitik'}
        <div class="flex flex-col gap-6 fade-in">
          
          <!-- Top Toolbar: Header & Source Switcher -->
          <div class="bg-white border border-[#e2e8f0] shadow-sm rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <div class="flex items-center gap-2.5">
                <h1 class="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Prediksi & Analitik Pembangkitan Energi Surya</h1>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Model Aktif: {weatherModelSource}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                Estimasi produksi harian/mingguan, kalkulasi potensi teknis PV, dan integrasi parameter cuaca BMKG & OpenWeather
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <!-- Weather API Source Switcher -->
              <div class="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button 
                  class="px-3 py-1.5 rounded-md text-xs font-semibold transition-all {weatherModelSource === 'BMKG' ? 'bg-[#ff4f00] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}"
                  on:click={() => switchWeatherSource('BMKG')}
                >
                  Model BMKG
                </button>
                <button 
                  class="px-3 py-1.5 rounded-md text-xs font-semibold transition-all {weatherModelSource === 'OpenWeather' ? 'bg-[#ff4f00] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}"
                  on:click={() => switchWeatherSource('OpenWeather')}
                >
                  OpenWeather Solar
                </button>
              </div>

              <!-- Timeframe Selector -->
              <div class="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button 
                  class="px-3 py-1.5 rounded-md text-xs font-semibold transition-all {analyticsViewMode === 'hourly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}"
                  on:click={() => analyticsViewMode = 'hourly'}
                >
                  Per Jam (24 Jam)
                </button>
                <button 
                  class="px-3 py-1.5 rounded-md text-xs font-semibold transition-all {analyticsViewMode === 'weekly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}"
                  on:click={() => analyticsViewMode = 'weekly'}
                >
                  Mingguan (7 Hari)
                </button>
              </div>
            </div>
          </div>

          <!-- KPI Summary Cards (Clean White Theme) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div class="bg-white border border-[#e2e8f0] shadow-sm rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-600">Estimasi Produksi Hari Ini</span>
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <div class="my-2">
                  <span class="text-2xl font-bold text-slate-900">31.40 <span class="text-xs text-slate-500 font-normal">kWh</span></span>
                  <span class="text-[11px] text-emerald-600 block font-semibold mt-0.5">Realisasi: 27.80 kWh (88.5%)</span>
                </div>
              </div>
              <div class="flex flex-col gap-1.5 pt-3 border-t border-slate-100">
                <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-emerald-500 h-full rounded-full" style="width: 88.5%;"></div>
                </div>
                <div class="flex justify-between text-[10px] text-slate-500">
                  <span>Confidence: 96%</span>
                  <span>Deviasi: +1.8%</span>
                </div>
              </div>
            </div>

            <div class="bg-white border border-[#e2e8f0] shadow-sm rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-600">Potensi Teknis PV (Live)</span>
                  <span class="text-[10px] text-[#ff4f00] font-bold">Cap: 7.10 kWp</span>
                </div>
                <div class="my-2">
                  <span class="text-2xl font-bold text-slate-900">{technicalPvPotentialKw.toFixed(2)} <span class="text-xs text-slate-500 font-normal">kW</span></span>
                  <span class="text-[11px] text-emerald-600 block font-semibold mt-0.5">Daya Riil: {currentActualKw.toFixed(2)} kW</span>
                </div>
              </div>
              <div class="flex flex-col gap-1.5 pt-3 border-t border-slate-100">
                <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-[#ff4f00] h-full rounded-full" style="width: {potentialRealizationRatio}%;"></div>
                </div>
                <div class="flex justify-between text-[10px] text-slate-500">
                  <span>Pemanfaatan: {potentialRealizationRatio.toFixed(1)}%</span>
                  <span>Inverter Eff: 97.8%</span>
                </div>
              </div>
            </div>

            <div class="bg-white border border-[#e2e8f0] shadow-sm rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-600">Radiasi Matahari (POA)</span>
                  <span class="text-[10px] text-sky-600 font-bold">Tilt 15°</span>
                </div>
                <div class="my-2">
                  <span class="text-2xl font-bold text-slate-900">{weatherCurrent.irradiancePoa} <span class="text-xs text-slate-500 font-normal">W/m²</span></span>
                  <span class="text-[11px] text-slate-600 block font-medium mt-0.5">GHI: {weatherCurrent.irradianceGhi} W/m² · PSH: {weatherCurrent.phel}j</span>
                </div>
              </div>
              <div class="flex items-center justify-between pt-3 border-t border-slate-100 text-[10px] text-slate-500">
                <span>Indeks UV: {weatherCurrent.uvIndex} (Tinggi)</span>
                <span>Insolasi: Baik</span>
              </div>
            </div>

            <div class="bg-white border border-[#e2e8f0] shadow-sm rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-600">Kondisi Termal & Modul</span>
                  <span class="text-[10px] text-slate-500">Sandia Model</span>
                </div>
                <div class="my-2">
                  <span class="text-2xl font-bold text-slate-900">{calculatedCellTemp.toFixed(1)} <span class="text-xs text-slate-500 font-normal">°C</span></span>
                  <span class="text-[11px] text-amber-600 block font-semibold mt-0.5">Ambient {weatherCurrent.tempAmbient}°C · Loss: -{thermalLossPct.toFixed(2)}%</span>
                </div>
              </div>
              <div class="flex items-center justify-between pt-3 border-t border-slate-100 text-[10px] text-slate-500">
                <span>Tutupan Awan: {weatherCurrent.cloudCoverTotal}%</span>
                <span>Angin: {weatherCurrent.windSpeed} km/h</span>
              </div>
            </div>

          </div>

          <!-- Main Chart: Prediksi vs Realisasi Curve -->
          <div class="bg-white border border-[#e2e8f0] shadow-sm rounded-xl p-6 flex flex-col gap-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 class="text-sm font-bold text-slate-900 tracking-tight">
                  {analyticsViewMode === 'hourly' ? 'Kurva Pembangkitan: Prediksi vs Realisasi Daya (24 Jam)' : 'Prospek Produksi Energi Mingguan (7 Hari)'}
                </h2>
                <span class="text-xs text-slate-500">
                  {analyticsViewMode === 'hourly' ? 'Perbandingan daya aktual inverter vs estimasi model cuaca dan potensi fluks radiasi matahari' : 'Estimasi akumulasi produksi energi harian berdasarkan parameter tutupan awan'}
                </span>
              </div>

              <div class="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-500">
                <span>Sumber Data:</span>
                <span class="text-slate-800 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  {weatherCurrent.source}
                </span>
              </div>
            </div>

            <div class="w-full h-[320px] relative">
              <Chart option={analyticsViewMode === 'hourly' ? hourlyPredictionChartOption : weeklyPredictionChartOption} />
            </div>
          </div>

          <!-- Weekly Forecast Table -->
          <div class="bg-white border border-[#e2e8f0] shadow-sm rounded-xl p-6 flex flex-col gap-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 class="text-sm font-bold text-slate-900 tracking-tight">Prakiraan Produksi & Rekomendasi Operasi 7 Hari</h3>
                <p class="text-xs text-slate-500 mt-0.5">Panduan optimasi alur daya baterai dan ekspor-impor grid berdasarkan prakiraan cuaca</p>
              </div>
              <div class="flex items-center gap-2 text-xs">
                <span class="text-slate-500">Akumulasi 7 Hari:</span>
                <span class="text-emerald-600 font-bold">{totalWeeklyPredictedKwh.toFixed(1)} kWh (~Rp {estimatedWeeklyRevenue})</span>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="border-b border-slate-200 text-slate-500 font-semibold">
                    <th class="py-3 px-3">Hari & Tanggal</th>
                    <th class="py-3 px-3">Kondisi Cuaca</th>
                    <th class="py-3 px-3">Jam Puncak (PSH)</th>
                    <th class="py-3 px-3">Rata-rata Radiasi</th>
                    <th class="py-3 px-3">Estimasi Produksi</th>
                    <th class="py-3 px-3">Akurasi</th>
                    <th class="py-3 px-3">Rekomendasi Operasional EMS</th>
                  </tr>
                </thead>
                <tbody>
                  {#each weeklyForecastData as item}
                    <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td class="py-3 px-3">
                        <span class="font-bold text-slate-900 block">{item.day}</span>
                        <span class="text-[10px] text-slate-500">{item.date}</span>
                      </td>
                      <td class="py-3 px-3">
                        <div class="flex items-center gap-2">
                          <div class="w-2 h-2 rounded-full {item.predictedKwh > 30 ? 'bg-emerald-500' : item.predictedKwh > 24 ? 'bg-orange-500' : 'bg-sky-500'}"></div>
                          <span class="text-slate-800 font-medium">{item.weather}</span>
                        </div>
                        <span class="text-[10px] text-slate-500 block ml-4">{item.tempMinMax}</span>
                      </td>
                      <td class="py-3 px-3 font-mono font-bold text-slate-800">{item.psh} jam</td>
                      <td class="py-3 px-3 text-slate-600">{item.avgIrradiance} W/m²</td>
                      <td class="py-3 px-3">
                        <span class="text-slate-900 font-bold text-sm">{item.predictedKwh.toFixed(1)} <span class="text-[10px] text-slate-500 font-normal">kWh</span></span>
                        {#if item.actualKwh}
                          <span class="text-[10px] text-emerald-600 block font-semibold">Riil: {item.actualKwh} kWh</span>
                        {/if}
                      </td>
                      <td class="py-3 px-3">
                        <span class="inline-flex items-center gap-1 text-[11px] font-bold {item.confidence >= 90 ? 'text-emerald-600' : 'text-amber-600'}">
                          {item.confidence}%
                        </span>
                      </td>
                      <td class="py-3 px-3">
                        <span class="text-[11px] text-slate-600 block max-w-xs">{item.recommendation}</span>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>

        </div>
        
      <!-- ============================================================== -->
      <!-- TAB: DEVICES                                                   -->
      <!-- ============================================================== -->
      {:else if activeTab === 'Devices'}
        <div class="bg-white border border-[#e2e8f0] shadow-sm rounded-xl p-6 min-h-[400px]">
          <h2 class="text-base font-bold text-slate-900 mb-6">Connected Devices ({plantName})</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-slate-200 text-slate-500 font-semibold">
                  <th class="py-3 px-4">Device ID</th>
                  <th class="py-3 px-4">Type</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4">Current Power</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each devices as device}
                  <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td class="py-3 px-4 font-bold text-slate-900">{device.id}</td>
                    <td class="py-3 px-4 text-slate-600">{device.type}</td>
                    <td class="py-3 px-4">
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {device.status}
                      </span>
                    </td>
                    <td class="py-3 px-4 font-semibold text-slate-800">{device.power}</td>
                    <td class="py-3 px-4 text-right">
                      <button class="text-[#ff4f00] hover:underline text-xs font-bold" on:click={() => showToast(`Detail perangkat ${device.id}`)}>Detail</button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
        
      <!-- ============================================================== -->
      <!-- TAB: ALARMS                                                    -->
      <!-- ============================================================== -->
      {:else if activeTab === 'Alarms'}
        <div class="bg-white border border-[#e2e8f0] shadow-sm rounded-xl p-6 min-h-[400px]">
          <h2 class="text-base font-bold text-slate-900 mb-6">Recent Alarms & Events</h2>
          {#if alarms.length === 0}
            <div class="text-center text-slate-400 py-10">No alarms to display.</div>
          {:else}
            <div class="flex flex-col gap-2.5">
              {#each alarms as alarm}
                <div class="flex items-center justify-between p-3.5 bg-slate-50 border-l-4 border-amber-500 rounded-lg hover:bg-slate-100 transition-colors text-xs">
                  <div>
                    <div class="text-slate-900 font-semibold">{alarm.message}</div>
                    <div class="text-[11px] text-slate-500 mt-0.5">{alarm.device} · {alarm.time}</div>
                  </div>
                  <div class="px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-200">
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

  <!-- Floating Toast Notification (Clean Light Theme) -->
  {#if toastMessage}
    <div class="fixed bottom-6 right-6 z-50 bg-white border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl shadow-xl text-xs flex items-center gap-3 fade-in">
      <div class="w-2 h-2 rounded-full bg-[#ff4f00]"></div>
      <span class="font-medium">{toastMessage}</span>
      <button class="text-slate-400 hover:text-slate-700 ml-2" on:click={() => toastMessage = ''} aria-label="Close">✕</button>
    </div>
  {/if}

</div>

<style>
  :global(body) {
    background-color: #f3f7f8;
  }
  
  /* Sidebar styles matching application shell */
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

  .fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Electric Current Flow Keyframes */
  @keyframes electricFlowForward {
    from {
      stroke-dashoffset: 44;
    }
    to {
      stroke-dashoffset: 0;
    }
  }

  @keyframes electricFlowReverse {
    from {
      stroke-dashoffset: 0;
    }
    to {
      stroke-dashoffset: 44;
    }
  }

  @keyframes inverterPulse {
    0% {
      r: 14;
      opacity: 0.85;
      stroke-width: 2.5;
    }
    60% {
      r: 44;
      opacity: 0.4;
      stroke-width: 1.2;
    }
    100% {
      r: 58;
      opacity: 0;
      stroke-width: 0.2;
    }
  }

  .flow-anim-forward {
    animation: electricFlowForward 1.3s linear infinite;
  }

  .flow-anim-reverse {
    animation: electricFlowReverse 1.3s linear infinite;
  }

  .flow-anim-forward-fast {
    animation: electricFlowForward 0.85s linear infinite;
  }

  .inverter-ring {
    animation: inverterPulse 2.2s cubic-bezier(0.1, 0.7, 0.4, 1) infinite;
  }
</style>
