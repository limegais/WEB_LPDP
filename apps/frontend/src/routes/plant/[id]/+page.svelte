<script lang="ts">
  import { page } from '$app/stores';
  import Chart from '$lib/components/Chart.svelte';
  
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

  // Navigation State
  let activeTab: 'Dashboard' | 'Kontrol Energi' | 'Prediksi & Analitik' | 'Devices' | 'Alarms' = 'Dashboard';
  let overviewPeriod = 'Day';
  let viewMode = '2d'; // '3d' or '2d'
  let chartTab = 'Power Curve';

  // ==========================================
  // KONTROL ENERGI (ENERGY CONTROL) STATE
  // ==========================================
  let controlMode: 'auto' | 'manual' = 'auto'; // 'auto' | 'manual'
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

  // Toast Notification System (Minimalist)
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

  // Chart points generator for mock SVG
  const generateChartPoints = () => {
    let points = "";
    for(let i=0; i<300; i++) {
      let x = 200 + i*2;
      let y = 190;
      if (i > 50 && i < 250) {
        let base = Math.sin((i-50)/200 * Math.PI) * 120;
        let noise = Math.random() * 40 - 20;
        y = 190 - (base + noise);
      }
      points += `${x},${y} `;
    }
    return points;
  };
  const mockChartPoints = generateChartPoints();

  // ==============================================================
  // PREDIKSI & ANALITIK (FORECAST & ANALYTICS) STATE & ENGINE
  // ==============================================================
  let weatherModelSource: 'BMKG' | 'OpenWeather' = 'BMKG';
  let analyticsViewMode: 'hourly' | 'weekly' = 'hourly';
  let selectedWeatherMetric = 'irradiance';

  // Plant Technical Specs (PLTS Gedung 3 FT)
  const pvSystemSpecs = {
    installedCapacityWp: 7100, // 7.10 kWp
    panelCount: 16,
    panelModel: 'Tier-1 Mono PERC 445 Wp',
    tiltAngle: 15, // deg
    azimuth: 0, // deg (Utara)
    tempCoefficient: -0.35, // %/°C
    noct: 45, // °C
    inverterEff: 97.8, // %
    soilingWiringLoss: 3.2 // %
  };

  // Weather & Irradiance metrics (Live BMKG / OpenWeather Model)
  let weatherCurrent = {
    source: 'BMKG Stasiun Klimatologi DKI Jakarta / Depok',
    stationId: 'BMKG-96749 (Radius 4.2 km)',
    updateTime: '14:30 WIB (Sinkronisasi Model 06:00 WIB)',
    tempAmbient: 33.5, // °C
    irradianceGhi: 790, // W/m²
    irradiancePoa: 845, // W/m² (POA 15°)
    cloudCoverTotal: 18, // %
    cloudLow: 8,
    cloudMid: 10,
    humidity: 68, // %
    windSpeed: 12, // km/h
    uvIndex: 8.5, // Very High
    airQualityIndex: 'Sedang (AQI 64)',
    phel: 4.42 // Peak Sun Hours
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

  // 1. Dynamic Cell Temperature (Sandia / King Model)
  $: calculatedCellTemp = weatherCurrent.tempAmbient + (weatherCurrent.irradiancePoa / 800) * (pvSystemSpecs.noct - 20);
  
  // 2. Thermal Loss Percentage (%)
  $: thermalLossPct = Math.max(0, (calculatedCellTemp - 25) * Math.abs(pvSystemSpecs.tempCoefficient));
  
  // 3. Theoretical Potential (Tanpa rugi-rugi)
  $: theoreticalPvPotentialKw = (pvSystemSpecs.installedCapacityWp / 1000) * (weatherCurrent.irradiancePoa / 1000);
  
  // 4. Technical Potential (Setelah Rugi Suhu, Kabel & Inverter)
  $: technicalPvPotentialKw = theoreticalPvPotentialKw * (1 - thermalLossPct / 100) * (pvSystemSpecs.inverterEff / 100) * (1 - pvSystemSpecs.soilingWiringLoss / 100);
  
  // 5. Output Riil Saat Ini
  $: currentActualKw = effectivePv;
  
  // 6. Real-time Potential Realization (Performance Ratio Sesaat %)
  $: potentialRealizationRatio = technicalPvPotentialKw > 0 ? Math.min(100, (currentActualKw / technicalPvPotentialKw) * 100) : 0;

  // Hourly Dataset (06:00 - 18:00)
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

  // 7-Day Forecast Dataset
  const weeklyForecastData = [
    { day: 'Hari Ini', date: '17 Okt', weather: 'Cerah Berawan', icon: 'partly-cloudy', psh: 4.42, avgIrradiance: 845, predictedKwh: 31.40, actualKwh: 27.80, tempMinMax: '25° / 35°C', cloudCover: 22, confidence: 96, recommendation: 'Optimal untuk ekspor siang & pengisian penuh ESS' },
    { day: 'Sabtu', date: '18 Okt', weather: 'Cerah Dominan', icon: 'sun', psh: 4.85, avgIrradiance: 890, predictedKwh: 34.20, actualKwh: null, tempMinMax: '25° / 36°C', cloudCover: 12, confidence: 94, recommendation: 'Pembangkitan puncak, disarankan kurangi curtailment' },
    { day: 'Minggu', date: '19 Okt', weather: 'Cerah Berawan', icon: 'partly-cloudy', psh: 4.30, avgIrradiance: 810, predictedKwh: 30.80, actualKwh: null, tempMinMax: '24° / 34°C', cloudCover: 28, confidence: 91, recommendation: 'Beban gedung akhir pekan rendah, simpan daya di baterai ESS' },
    { day: 'Senin', date: '20 Okt', weather: 'Hujan Siang-Sore', icon: 'rain', psh: 3.10, avgIrradiance: 520, predictedKwh: 21.50, actualKwh: null, tempMinMax: '24° / 31°C', cloudCover: 72, confidence: 85, recommendation: 'Waspada intermitensi mendung, pertahankan cadangan ESS min 40%' },
    { day: 'Selasa', date: '21 Okt', weather: 'Berawan Tebal', icon: 'cloudy', psh: 3.50, avgIrradiance: 610, predictedKwh: 24.60, actualKwh: null, tempMinMax: '24° / 32°C', cloudCover: 65, confidence: 88, recommendation: 'Gunakan mode Cukur Beban Puncak (Peak Shaving)' },
    { day: 'Rabu', date: '22 Okt', weather: 'Cerah Berawan', icon: 'partly-cloudy', psh: 4.60, avgIrradiance: 830, predictedKwh: 32.40, actualKwh: null, tempMinMax: '25° / 35°C', cloudCover: 25, confidence: 89, recommendation: 'Kondisi cuaca membaik, produksi normal kembali' },
    { day: 'Kamis', date: '23 Okt', weather: 'Cerah', icon: 'sun', psh: 4.75, avgIrradiance: 865, predictedKwh: 33.50, actualKwh: null, tempMinMax: '25° / 35°C', cloudCover: 15, confidence: 86, recommendation: 'Potensi pembangkitan tinggi, pengujian performansi rutin' }
  ];

  // Aggregated Weekly Totals
  $: totalWeeklyPredictedKwh = weeklyForecastData.reduce((acc, cur) => acc + cur.predictedKwh, 0);
  $: avgDailyPredictedKwh = (totalWeeklyPredictedKwh / weeklyForecastData.length).toFixed(1);
  $: estimatedWeeklyRevenue = Math.round(totalWeeklyPredictedKwh * 1444.7).toLocaleString('id-ID'); // Tarif PLN Rp 1.444,70 / kWh
  $: estimatedWeeklyCo2Reduction = (totalWeeklyPredictedKwh * 0.794).toFixed(1); // 0.794 kg CO2 / kWh

  // ECharts Option: Hourly Curve (Dual Axis)
  $: hourlyPredictionChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1e1e1e',
      borderColor: '#383838',
      textStyle: { color: '#e5e5e5', fontSize: 11 },
      axisPointer: { type: 'cross', lineStyle: { color: '#555', type: 'dashed' } },
      formatter: (params: any[]) => {
        let title = `<div style="font-weight:600;margin-bottom:6px;color:#fff;border-bottom:1px solid #333;padding-bottom:3px;">Jam ${params[0].axisValue} WIB</div>`;
        params.forEach(p => {
          let val = p.value !== null && p.value !== undefined ? p.value : '-';
          let unit = p.seriesName.includes('Radiasi') ? ' W/m²' : ' kW';
          title += `<div style="display:flex;align-items:center;justify-content:space-between;gap:14px;margin:3px 0;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${p.color};"></span>
              <span style="color:#a3a3a3;">${p.seriesName}</span>
            </div>
            <b style="color:#fff;">${val}${unit}</b>
          </div>`;
        });
        return title;
      }
    },
    legend: {
      data: ['Daya Riil (kW)', 'Prediksi Model (kW)', 'Potensi Radiasi (W/m²)'],
      textStyle: { color: '#a3a3a3', fontSize: 11 },
      top: 0,
      right: 10
    },
    grid: { top: 38, right: 54, bottom: 28, left: 44 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: hourlyForecastData.map(h => h.time),
      axisLine: { lineStyle: { color: '#333333' } },
      axisLabel: { color: '#737373', fontSize: 10 }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Daya (kW)',
        nameTextStyle: { color: '#737373', fontSize: 10, padding: [0, 0, 0, -10] },
        min: 0,
        max: 7.5,
        axisLabel: { color: '#737373', fontSize: 10 },
        splitLine: { lineStyle: { color: '#262626', type: 'dashed' } }
      },
      {
        type: 'value',
        name: 'Radiasi (W/m²)',
        nameTextStyle: { color: '#737373', fontSize: 10, padding: [0, 0, 0, 10] },
        min: 0,
        max: 1200,
        axisLabel: { color: '#737373', fontSize: 10 },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: 'Daya Riil (kW)',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#22c55e', width: 2.5 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(34, 197, 94, 0.22)' },
              { offset: 1, color: 'rgba(34, 197, 94, 0.0)' }
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
        lineStyle: { color: '#38bdf8', width: 1.5, type: 'dotted' },
        data: hourlyForecastData.map(h => h.irradiance)
      }
    ]
  };

  // ECharts Option: Weekly Forecast (Bar + PSH Line)
  $: weeklyPredictionChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1e1e1e',
      borderColor: '#383838',
      textStyle: { color: '#e5e5e5', fontSize: 11 },
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['Estimasi Energi (kWh)', 'Jam Matahari Puncak (PSH)'],
      textStyle: { color: '#a3a3a3', fontSize: 11 },
      top: 0,
      right: 10
    },
    grid: { top: 38, right: 54, bottom: 28, left: 44 },
    xAxis: {
      type: 'category',
      data: weeklyForecastData.map(w => `${w.day}\n${w.date}`),
      axisLine: { lineStyle: { color: '#333333' } },
      axisLabel: { color: '#737373', fontSize: 10 }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Energi (kWh)',
        nameTextStyle: { color: '#737373', fontSize: 10 },
        min: 0,
        max: 45,
        axisLabel: { color: '#737373', fontSize: 10 },
        splitLine: { lineStyle: { color: '#262626', type: 'dashed' } }
      },
      {
        type: 'value',
        name: 'PSH (Jam)',
        nameTextStyle: { color: '#737373', fontSize: 10 },
        min: 0,
        max: 6,
        axisLabel: { color: '#737373', fontSize: 10 },
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
              { offset: 1, color: 'rgba(255, 79, 0, 0.35)' }
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
        lineStyle: { color: '#38bdf8', width: 2 },
        itemStyle: { color: '#38bdf8' },
        data: weeklyForecastData.map(w => w.psh)
      }
    ]
  };
</script>

<svelte:head>
  <title>Plant Detail - {plantName}</title>
</svelte:head>

<!-- Clean, Minimalist Enterprise Dark Dashboard -->
<div class="min-h-screen bg-[#1c1c1c] text-[#d4d4d4] font-sans flex flex-col overflow-x-hidden selection:bg-[#ff4f00] selection:text-white">
  
  <!-- Top Navigation Bar -->
  <header class="flex items-center justify-between px-5 h-14 border-b border-[#2d2d2d] bg-[#1a1a1a] sticky top-0 z-50">
    <div class="flex items-center gap-3">
      <a href="/plant" class="text-[#888] hover:text-white transition-colors" aria-label="Go back">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
      </a>
      <h1 class="text-base font-semibold text-white flex items-center gap-2 tracking-tight">
        {plantName}
        <span class="bg-[#12281e] text-[#22c55e] text-[10px] px-2 py-0.5 rounded font-medium border border-[#1b4332]">Running</span>
      </h1>
      <button class="text-[#666] hover:text-white" aria-label="Plant selector">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
    
    <div class="flex items-center gap-3">
      <div class="flex items-center bg-[#252525] rounded-full px-2.5 py-1 gap-2 border border-[#333]">
        <div class="w-1.5 h-1.5 rounded-full bg-[#22c55e]"></div>
        <span class="text-[11px] text-[#a3a3a3]">Online</span>
      </div>
      <button class="text-[#888] hover:text-white p-1" title="Share">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      </button>
      <button class="text-[#888] hover:text-white p-1" title="Settings">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  </header>
  
  <!-- Interactive Tabs -->
  <nav class="flex gap-6 px-5 h-11 items-center border-b border-[#2d2d2d] bg-[#1a1a1a] text-xs font-medium sticky top-14 z-40">
    <button 
      class="h-full border-b-2 px-1 transition-colors {activeTab === 'Dashboard' ? 'border-[#ff4f00] text-white font-semibold' : 'border-transparent text-[#888] hover:text-[#d4d4d4]'}"
      on:click={() => activeTab = 'Dashboard'}
    >
      Dashboard
    </button>
    
    <button 
      class="h-full border-b-2 px-1 transition-colors flex items-center gap-1.5 {activeTab === 'Kontrol Energi' ? 'border-[#ff4f00] text-white font-semibold' : 'border-transparent text-[#888] hover:text-[#d4d4d4]'}"
      on:click={() => activeTab = 'Kontrol Energi'}
    >
      Kontrol Energi
      <span class="w-1.5 h-1.5 rounded-full bg-[#ff4f00]"></span>
    </button>

    <button 
      class="h-full border-b-2 px-1 transition-colors flex items-center gap-1.5 {activeTab === 'Prediksi & Analitik' ? 'border-[#ff4f00] text-white font-semibold' : 'border-transparent text-[#888] hover:text-[#d4d4d4]'}"
      on:click={() => activeTab = 'Prediksi & Analitik'}
    >
      Prediksi & Analitik
      <span class="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#16231a] text-[#22c55e] border border-[#1b4332]">BMKG / AI</span>
    </button>

    <button 
      class="h-full border-b-2 px-1 transition-colors {activeTab === 'Devices' ? 'border-[#ff4f00] text-white font-semibold' : 'border-transparent text-[#888] hover:text-[#d4d4d4]'}"
      on:click={() => activeTab = 'Devices'}
    >
      Devices
    </button>
    <button 
      class="h-full border-b-2 px-1 transition-colors {activeTab === 'Alarms' ? 'border-[#ff4f00] text-white font-semibold' : 'border-transparent text-[#888] hover:text-[#d4d4d4]'}"
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
          
          <!-- Left Section: Elegant Power Flow Node Topology -->
          <section class="flex-1 bg-[#222222] rounded-xl border border-[#2e2e2e] relative overflow-hidden flex flex-col min-h-[500px]">
            
            <!-- Header (Weather & Controls) -->
            <div class="flex justify-between items-start p-5 z-20">
              <div class="flex items-center gap-3">
                <!-- Clean Sun SVG -->
                <div class="w-9 h-9 rounded-lg bg-[#2a2a2a] border border-[#333] flex items-center justify-center text-[#ff4f00]">
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
                    <span class="font-medium text-white text-sm">{weather.desc}</span>
                    <span class="text-base font-semibold text-white">{weather.temp}</span>
                  </div>
                  <div class="text-[11px] text-[#737373] mt-0.5">
                    Angin: {weather.wind} · Kelembaban: {weather.humidity}
                  </div>
                </div>
              </div>
              
              <div class="flex items-center gap-3 text-[11px] text-[#737373]">
                <!-- Status Mode Badge -->
                <span class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1c1c1c] border border-[#333] text-[#a3a3a3] font-medium">
                  <span class="w-1.5 h-1.5 rounded-full {controlMode === 'auto' ? 'bg-[#22c55e]' : 'bg-[#ff4f00]'}"></span>
                  Mode: {controlMode === 'auto' ? 'Otomatis' : 'Manual'}
                </span>

                <span class="hidden md:inline">Update: {updateTime}</span>
                <button class="text-[#737373] hover:text-white transition-colors" title="Perbarui" on:click={() => showToast('Data diperbarui')}>
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                </button>
                <div class="flex bg-[#1a1a1a] rounded-lg p-0.5 border border-[#333] gap-0.5">
                  <button 
                    class="px-2 py-1 rounded text-[11px] transition-colors {viewMode === '3d' ? 'bg-[#2a2a2a] text-white font-medium' : 'text-[#737373] hover:text-white'}"
                    on:click={() => viewMode = '3d'}
                  >
                    3D
                  </button>
                  <button 
                    class="px-2 py-1 rounded text-[11px] transition-colors {viewMode === '2d' ? 'bg-[#2a2a2a] text-white font-medium' : 'text-[#737373] hover:text-white'}"
                    on:click={() => viewMode = '2d'}
                  >
                    2D
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Graphic Area -->
            <div class="flex-1 relative flex items-center justify-center p-4">
              
              {#if viewMode === '3d'}
                <!-- Clean 3D Overlay -->
                <div class="absolute inset-0 z-10 pointer-events-none fade-in">
                  <div class="absolute top-[20%] left-[55%] flex flex-col items-center bg-[#1c1c1c]/80 px-3 py-1.5 rounded-lg border border-[#333] backdrop-blur-sm">
                    <span class="text-lg font-light text-white">{effectivePv.toFixed(3)} <span class="text-xs text-[#888]">kW</span></span>
                    <span class="text-[11px] text-[#22c55e] font-medium">PV Output</span>
                  </div>
                  <div class="absolute top-[30%] left-[28%] bg-[#1c1c1c]/80 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-[#333] text-center">
                    <span class="text-[10px] text-[#888] block">Grid PLN</span>
                    <span class="text-xs font-semibold {gridMode === 'export' ? 'text-[#22c55e]' : 'text-[#38bdf8]'}">{gridPower.toFixed(2)} kW</span>
                  </div>
                  <div class="absolute bottom-[22%] left-[26%] bg-[#1c1c1c]/80 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-[#333] text-center">
                    <span class="text-[10px] text-[#888] block">Beban</span>
                    <span class="text-xs font-semibold text-white">{totalLoadPower.toFixed(2)} kW</span>
                  </div>
                  <div class="absolute bottom-[22%] right-[26%] bg-[#1c1c1c]/80 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-[#333] text-center">
                    <span class="text-[10px] text-[#888] block">Baterai ESS</span>
                    <span class="text-xs font-semibold text-[#22c55e]">{batterySoc}% ({batteryPower.toFixed(2)} kW)</span>
                  </div>
                </div>
                
                <img src="/images/house-power-flow.jpg" alt="Power Flow Diagram" class="w-full max-w-[650px] h-auto object-contain z-0 fade-in opacity-85" style="mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%);" />
              
              {:else}
                <!-- 2D Minimalist Circular Node Topology -->
                <div class="w-full h-full flex flex-col items-center justify-center relative fade-in select-none">
                  
                  <!-- Clean Connecting SVG Lines -->
                  <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 520 320" preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <marker id="arrow-muted" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#666666" />
                      </marker>
                    </defs>

                    <!-- PV to Inverter -->
                    <line x1="260" y1="88" x2="260" y2="132" stroke="#404040" stroke-width="1.5" stroke-dasharray="4,4" marker-end="url(#arrow-muted)">
                      {#if effectivePv > 0}
                        <animate attributeName="stroke-dashoffset" from="16" to="0" dur="1s" repeatCount="indefinite" />
                      {/if}
                    </line>

                    <!-- Inverter to Grid / Grid to Inverter -->
                    {#if gridMode === 'export'}
                      <line x1="228" y1="160" x2="148" y2="160" stroke="#404040" stroke-width="1.5" stroke-dasharray="4,4" marker-end="url(#arrow-muted)">
                        {#if gridPower > 0}
                          <animate attributeName="stroke-dashoffset" from="16" to="0" dur="1.2s" repeatCount="indefinite" />
                        {/if}
                      </line>
                    {:else}
                      <line x1="148" y1="160" x2="228" y2="160" stroke="#404040" stroke-width="1.5" stroke-dasharray="4,4" marker-end="url(#arrow-muted)">
                        {#if gridPower > 0}
                          <animate attributeName="stroke-dashoffset" from="16" to="0" dur="1.2s" repeatCount="indefinite" />
                        {/if}
                      </line>
                    {/if}

                    <!-- Inverter to Load -->
                    <line x1="292" y1="160" x2="372" y2="160" stroke="#404040" stroke-width="1.5" stroke-dasharray="4,4" marker-end="url(#arrow-muted)">
                      {#if totalLoadPower > 0}
                        <animate attributeName="stroke-dashoffset" from="16" to="0" dur="1s" repeatCount="indefinite" />
                      {/if}
                    </line>

                    <!-- Inverter to Battery / Battery to Inverter -->
                    {#if batteryStatus === 'charging'}
                      <line x1="260" y1="188" x2="260" y2="232" stroke="#404040" stroke-width="1.5" stroke-dasharray="4,4" marker-end="url(#arrow-muted)">
                        <animate attributeName="stroke-dashoffset" from="16" to="0" dur="1.2s" repeatCount="indefinite" />
                      </line>
                    {:else if batteryStatus === 'discharging'}
                      <line x1="260" y1="232" x2="260" y2="188" stroke="#404040" stroke-width="1.5" stroke-dasharray="4,4" marker-end="url(#arrow-muted)">
                        <animate attributeName="stroke-dashoffset" from="16" to="0" dur="1.2s" repeatCount="indefinite" />
                      </line>
                    {:else}
                      <line x1="260" y1="188" x2="260" y2="232" stroke="#333333" stroke-width="1" stroke-dasharray="2,2" />
                    {/if}
                  </svg>

                  <!-- Node 1: PV Solar (Top) -->
                  <div 
                    class="absolute top-[6%] left-1/2 -translate-x-1/2 flex flex-col items-center justify-center w-[116px] h-[116px] rounded-full border border-[#22c55e]/70 bg-[#16231a] z-10 transition-transform hover:scale-105 cursor-pointer shadow-sm"
                    on:click={() => showToast(`PV: ${effectivePv.toFixed(3)} kW`)}
                    role="button"
                    tabindex="0"
                    on:keydown={(e) => e.key === 'Enter' && showToast(`PV: ${effectivePv.toFixed(3)} kW`)}
                  >
                    <svg class="w-5 h-5 text-[#22c55e] mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                    <span class="text-[10px] text-[#a3a3a3]">PV Output</span>
                    <span class="text-base font-light text-white">{effectivePv.toFixed(3)} <span class="text-[10px] text-[#737373]">kW</span></span>
                  </div>

                  <!-- Node 2: Grid PLN (Left) -->
                  <div 
                    class="absolute top-1/2 left-[10%] -translate-y-1/2 flex flex-col items-center justify-center w-[92px] h-[92px] rounded-full border border-[#383838] bg-[#1a1a1a] z-10 transition-transform hover:scale-105 cursor-pointer shadow-sm"
                    on:click={() => showToast(`Grid: ${gridMode === 'export' ? 'Ekspor' : 'Impor'} ${gridPower.toFixed(2)} kW`)}
                    role="button"
                    tabindex="0"
                    on:keydown={(e) => e.key === 'Enter' && showToast(`Grid: ${gridPower.toFixed(2)} kW`)}
                  >
                    <svg class="w-4 h-4 text-[#a3a3a3] mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                    </svg>
                    <span class="text-[10px] text-[#888]">Grid PLN</span>
                    <span class="text-xs font-medium text-white">{gridPower.toFixed(2)} kW</span>
                    <span class="text-[9px] text-[#737373]">{gridMode === 'export' ? 'Ekspor' : 'Impor'}</span>
                  </div>

                  <!-- Center: Inverter Hybrid Hub -->
                  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-[66px] h-[66px] rounded-full border border-[#ff4f00]/60 bg-[#1f1917] z-10 shadow-sm">
                    <span class="text-[9px] font-semibold text-[#ff4f00] uppercase tracking-tight">Inverter</span>
                    <span class="text-[10px] font-medium text-white">{((effectivePv) + (batteryStatus === 'discharging' ? batteryPower : 0)).toFixed(2)} kW</span>
                  </div>

                  <!-- Node 3: Load (Right) -->
                  <div 
                    class="absolute top-1/2 right-[10%] -translate-y-1/2 flex flex-col items-center justify-center w-[92px] h-[92px] rounded-full border border-[#383838] bg-[#1a1a1a] z-10 transition-transform hover:scale-105 cursor-pointer shadow-sm"
                    on:click={() => showToast(`Total Beban: ${totalLoadPower.toFixed(2)} kW`)}
                    role="button"
                    tabindex="0"
                    on:keydown={(e) => e.key === 'Enter' && showToast(`Beban: ${totalLoadPower.toFixed(2)} kW`)}
                  >
                    <svg class="w-4 h-4 text-[#a3a3a3] mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"></path>
                    </svg>
                    <span class="text-[10px] text-[#888]">Beban</span>
                    <span class="text-xs font-medium text-white">{totalLoadPower.toFixed(2)} kW</span>
                    <span class="text-[9px] text-[#737373]">Gedung 3 FT</span>
                  </div>

                  <!-- Node 4: Battery ESS (Bottom) -->
                  <div 
                    class="absolute bottom-[6%] left-1/2 -translate-x-1/2 flex flex-col items-center justify-center w-[116px] h-[116px] rounded-full border border-[#22c55e]/70 bg-[#16231a] z-10 transition-transform hover:scale-105 cursor-pointer shadow-sm"
                    on:click={() => showToast(`Baterai ESS: ${batterySoc}% (${batteryStatus})`)}
                    role="button"
                    tabindex="0"
                    on:keydown={(e) => e.key === 'Enter' && showToast(`Baterai: ${batterySoc}%`)}
                  >
                    <svg class="w-4 h-4 text-[#22c55e] mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="7" width="16" height="10" rx="2" ry="2"></rect>
                      <line x1="22" y1="11" x2="22" y2="13"></line>
                    </svg>
                    <span class="text-[10px] text-[#a3a3a3]">Baterai ESS</span>
                    <span class="text-base font-light text-white">{batterySoc}% <span class="text-[10px] text-[#737373]">SOC</span></span>
                    <span class="text-[9px] text-[#22c55e]">
                      {batteryStatus === 'charging' ? `+${batteryPower.toFixed(2)} kW` : batteryStatus === 'discharging' ? `-${batteryPower.toFixed(2)} kW` : 'Siaga'}
                    </span>
                  </div>

                </div>
              {/if}

            </div>
          </section>
          
          <!-- Right Section: Overview & Environmental Cards -->
          <section class="w-full lg:w-[420px] flex flex-col gap-6">
            
            <!-- Overview Card -->
            <div class="bg-[#222222] border border-[#2e2e2e] rounded-xl flex flex-col p-5 h-[280px]">
              <div class="flex justify-between items-center mb-8">
                <h2 class="text-xs font-semibold uppercase tracking-wider text-[#a3a3a3] flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-[#ff4f00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Overview
                </h2>
                <div class="flex gap-2">
                  <div class="bg-[#1a1a1a] border border-[#333] text-xs px-2 py-1 rounded flex items-center justify-between w-[115px]">
                    <span class="text-[#666] cursor-pointer hover:text-white">‹</span>
                    <span class="text-xs">09/10/2026</span>
                    <span class="text-[#666] cursor-pointer hover:text-white">›</span>
                  </div>
                  <select 
                    class="bg-[#1a1a1a] border border-[#333] text-xs px-2 py-1 rounded outline-none w-[70px] text-[#a3a3a3]"
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
                  <div class="w-9 h-9 rounded-full bg-[#1b3323] text-[#22c55e] flex items-center justify-center mb-3">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                  </div>
                  <div class="text-3xl font-light text-white">{overview.energy} <span class="text-xs text-[#737373]">kWh</span></div>
                  <div class="text-[11px] text-[#737373] mt-1">Energy Generation</div>
                </div>
                
                <!-- Generation Revenue -->
                <div class="flex flex-col items-center">
                  <div class="w-9 h-9 rounded-full bg-[#352516] text-[#ff4f00] flex items-center justify-center mb-3">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 6v12M15 9.5a3.5 3.5 0 0 0-7 0c0 4 7 2 7 6a3.5 3.5 0 0 1-7 0"></path>
                    </svg>
                  </div>
                  <div class="text-3xl font-light text-white">{overview.revenue} <span class="text-xs text-[#737373]">k IDR</span></div>
                  <div class="text-[11px] text-[#737373] mt-1">Generation Revenue</div>
                </div>
              </div>
            </div>
            
            <!-- Environmental Contributions Card -->
            <div class="bg-[#222222] border border-[#2e2e2e] rounded-xl flex flex-col p-5 flex-1">
              <h2 class="text-xs font-semibold uppercase tracking-wider text-[#a3a3a3] mb-4">
                Environmental Contributions
              </h2>
              
              <div class="flex justify-between gap-3 h-full">
                <div class="flex-1 bg-[#1a1a1a] rounded-lg border border-[#2d2d2d] flex flex-col items-center justify-center p-3">
                  <div class="text-xs font-medium text-white">{environmental.coal}</div>
                  <div class="text-[10px] text-[#737373] text-center mt-1 uppercase tracking-tight">Coal Saved</div>
                </div>
                <div class="flex-1 bg-[#1a1a1a] rounded-lg border border-[#2d2d2d] flex flex-col items-center justify-center p-3">
                  <div class="text-xs font-medium text-white">{environmental.trees}</div>
                  <div class="text-[10px] text-[#737373] text-center mt-1 uppercase tracking-tight">Trees Planted</div>
                </div>
                <div class="flex-1 bg-[#1a1a1a] rounded-lg border border-[#2d2d2d] flex flex-col items-center justify-center p-3">
                  <div class="text-xs font-medium text-white">{environmental.co2}</div>
                  <div class="text-[10px] text-[#737373] text-center mt-1 uppercase tracking-tight">CO₂ Reduct.</div>
                </div>
              </div>
            </div>
            
          </section>
        </div>

        <!-- ============================================================== -->
        <!-- QUICK SUMMARY WIDGET: PREDIKSI & CUACA                         -->
        <!-- ============================================================== -->
        <section class="bg-[#222222] border border-[#2e2e2e] rounded-xl p-5 sm:p-6 flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2d2d2d]">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-[#2a201a] border border-[#402a1e] flex items-center justify-center text-[#ff4f00]">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
                </svg>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-sm font-semibold text-white tracking-tight">Prakiraan Cuaca & Prediksi Produksi PV</h2>
                  <span class="text-[10px] px-2 py-0.5 rounded font-medium bg-[#16231a] text-[#22c55e] border border-[#1b4332]">
                    {weatherModelSource} Model
                  </span>
                </div>
                <p class="text-xs text-[#737373] mt-0.5">
                  Estimasi hasil pembangkitan harian/mingguan dan kalkulasi potensi teknis PV 7.10 kWp
                </p>
              </div>
            </div>

            <button 
              class="text-xs text-[#ff4f00] hover:text-[#ff6a26] flex items-center gap-1 font-medium transition-colors group self-start sm:self-auto"
              on:click={() => activeTab = 'Prediksi & Analitik'}
            >
              <span>Buka Prediksi & Analitik Lengkap</span>
              <span class="transition-transform group-hover:translate-x-0.5">→</span>
            </button>
          </div>

          <!-- Quick Metrics Grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="bg-[#1a1a1a] p-3.5 rounded-lg border border-[#2a2a2a] flex flex-col justify-between">
              <span class="text-[11px] text-[#737373]">Estimasi Hari Ini</span>
              <div class="my-1">
                <span class="text-lg font-light text-white">31.40 <span class="text-xs text-[#737373]">kWh</span></span>
                <span class="text-[10px] text-[#22c55e] block font-medium">Tercapai 27.80 kWh (88.5%)</span>
              </div>
              <div class="w-full bg-[#262626] h-1.5 rounded-full overflow-hidden">
                <div class="bg-[#22c55e] h-full rounded-full" style="width: 88.5%;"></div>
              </div>
            </div>

            <div class="bg-[#1a1a1a] p-3.5 rounded-lg border border-[#2a2a2a] flex flex-col justify-between">
              <span class="text-[11px] text-[#737373]">Estimasi Besok</span>
              <div class="my-1">
                <span class="text-lg font-light text-white">34.20 <span class="text-xs text-[#737373]">kWh</span></span>
                <span class="text-[10px] text-[#38bdf8] block font-medium">Cerah Dominan · PSH 4.85j</span>
              </div>
              <span class="text-[10px] text-[#737373]">+8.9% vs rata-rata harian</span>
            </div>

            <div class="bg-[#1a1a1a] p-3.5 rounded-lg border border-[#2a2a2a] flex flex-col justify-between">
              <span class="text-[11px] text-[#737373]">Potensi Teknis PV (Live)</span>
              <div class="my-1">
                <span class="text-lg font-light text-white">{technicalPvPotentialKw.toFixed(2)} <span class="text-xs text-[#737373]">kW</span></span>
                <span class="text-[10px] text-[#22c55e] block font-medium">Pencapaian: {potentialRealizationRatio.toFixed(1)}%</span>
              </div>
              <span class="text-[10px] text-[#737373]">G_poa: {weatherCurrent.irradiancePoa} W/m²</span>
            </div>

            <div class="bg-[#1a1a1a] p-3.5 rounded-lg border border-[#2a2a2a] flex flex-col justify-between">
              <span class="text-[11px] text-[#737373]">Kondisi Cuaca & Awan</span>
              <div class="my-1">
                <span class="text-lg font-light text-white">{weatherCurrent.tempAmbient}°C</span>
                <span class="text-[10px] text-[#a3a3a3] block">Awan {weatherCurrent.cloudCoverTotal}% · Angin {weatherCurrent.windSpeed} km/h</span>
              </div>
              <span class="text-[10px] text-[#737373]">{weatherCurrent.source.split(' ')[0]} {weatherCurrent.stationId}</span>
            </div>
          </div>

          <!-- 3-Day Mini Preview Strip -->
          <div class="bg-[#181818] rounded-lg p-3 border border-[#282828] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-2 text-[#737373]">
              <span class="text-white font-medium">Prakiraan 3 Hari:</span>
              <span>Ringkasan prospek cuaca & energi</span>
            </div>
            <div class="grid grid-cols-3 gap-2 w-full sm:w-auto">
              {#each weeklyForecastData.slice(1, 4) as dayForecast}
                <div class="bg-[#202020] px-3 py-1.5 rounded border border-[#2c2c2c] flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full {dayForecast.predictedKwh > 30 ? 'bg-[#22c55e]' : dayForecast.predictedKwh > 24 ? 'bg-[#ff4f00]' : 'bg-[#38bdf8]'}"></div>
                  <div>
                    <span class="text-white font-medium block text-[11px]">{dayForecast.day}</span>
                    <span class="text-[#737373] text-[10px]">{dayForecast.predictedKwh} kWh</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </section>

        <!-- ============================================================== -->
        <!-- ELEGANT & PROFESSIONAL: KONTROL ENERGI SECTION                 -->
        <!-- ============================================================== -->
        <section class="bg-[#222222] border border-[#2e2e2e] rounded-xl p-5 sm:p-6 flex flex-col gap-5">
          
          <!-- Section Header: Title & Segmented Control -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2d2d2d]">
            <div>
              <div class="flex items-center gap-2.5">
                <h2 class="text-base font-semibold text-white tracking-tight">Kontrol Energi</h2>
                <span class="text-[10px] px-2 py-0.5 rounded font-medium border {controlMode === 'auto' ? 'bg-[#12281e] text-[#22c55e] border-[#1b4332]' : 'bg-[#2b1f15] text-[#ff4f00] border-[#4a2e16]'}">
                  {controlMode === 'auto' ? 'Otomatis' : 'Manual'}
                </span>
              </div>
              <p class="text-xs text-[#737373] mt-0.5">
                Manajemen alur daya Baterai ESS, Grid PLN, Panel Surya PV, dan Beban Ruangan
              </p>
            </div>

            <!-- Minimalist Capsule Segmented Switch -->
            <div class="flex items-center bg-[#181818] p-1 rounded-lg border border-[#2c2c2c] self-start sm:self-auto">
              <button 
                class="px-3.5 py-1.5 rounded-md text-xs font-medium transition-all {controlMode === 'auto' ? 'bg-[#ff4f00] text-white shadow-sm' : 'text-[#888] hover:text-[#d4d4d4]'}"
                on:click={() => toggleControlMode('auto')}
              >
                Otomatis
              </button>
              <button 
                class="px-3.5 py-1.5 rounded-md text-xs font-medium transition-all {controlMode === 'manual' ? 'bg-[#ff4f00] text-white shadow-sm' : 'text-[#888] hover:text-[#d4d4d4]'}"
                on:click={() => toggleControlMode('manual')}
              >
                Manual
              </button>
            </div>
          </div>

          <!-- Clean Mode Status Bar -->
          {#if controlMode === 'auto'}
            <div class="bg-[#181818] border border-[#2c2c2c] rounded-lg px-4 py-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-2 text-[#a3a3a3]">
                <span class="text-[#737373]">Strategi Operasi:</span>
                <span class="text-white font-medium">
                  {autoStrategy === 'self_consumption' ? 'Konsumsi Mandiri (Prioritas beban lokal & pengisian baterai)' :
                   autoStrategy === 'peak_shaving' ? 'Cukur Beban Puncak (Menekan konsumsi puncak PLN)' :
                   autoStrategy === 'tou' ? 'Tarif Waktu (Optimasi jam puncak WBP/LWBP)' :
                   'Cadangan Daya (Mempertahankan baterai penuh untuk darurat)'}
                </span>
              </div>

              <!-- Segmented Strategy Selector -->
              <div class="flex flex-wrap items-center gap-1">
                {#each [
                  { id: 'self_consumption', label: 'Konsumsi Mandiri' },
                  { id: 'peak_shaving', label: 'Beban Puncak' },
                  { id: 'tou', label: 'Tarif Waktu' },
                  { id: 'backup', label: 'Cadangan' }
                ] as strat}
                  <button 
                    class="px-2.5 py-1 rounded text-[11px] transition-colors {autoStrategy === strat.id ? 'bg-[#2a2a2a] text-white font-medium border border-[#3d3d3d]' : 'text-[#737373] hover:text-white'}"
                    on:click={() => setAutoStrategy(strat.id as any)}
                  >
                    {strat.label}
                  </button>
                {/each}
              </div>
            </div>
          {:else}
            <div class="bg-[#211a14] border border-[#3b2c1c] rounded-lg px-4 py-2.5 flex items-center justify-between text-xs text-[#d97706]">
              <span>Kontrol Manual Aktif: Nilai daya dan saklar perangkat dikendalikan langsung oleh operator.</span>
              <button 
                class="text-xs text-[#ff4f00] hover:underline font-medium"
                on:click={() => toggleControlMode('auto')}
              >
                Kembalikan ke Otomatis
              </button>
            </div>
          {/if}

          <!-- Grid of 4 Core Control Cards (Clean, Symmetrical, Professional) -->
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            
            <!-- CARD 1: BATERAI ESS -->
            <div class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex flex-col justify-between hover:border-[#383838] transition-colors">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2 text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">
                    <svg class="w-3.5 h-3.5 text-[#22c55e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="7" width="16" height="10" rx="2" ry="2"></rect>
                      <line x1="22" y1="11" x2="22" y2="13"></line>
                    </svg>
                    Baterai ESS
                  </div>
                  <span class="text-xs font-medium px-2 py-0.5 rounded {batterySoc >= 50 ? 'bg-[#12281e] text-[#22c55e] border border-[#1b4332]' : 'bg-[#2b1f15] text-[#ff4f00] border-[#4a2e16]'}">
                    {batterySoc}% SOC
                  </span>
                </div>

                <!-- Primary Value -->
                <div class="text-2xl font-light text-white tracking-tight mt-1">
                  {batteryStatus === 'charging' ? '+' : batteryStatus === 'discharging' ? '-' : ''}{batteryPower.toFixed(2)} <span class="text-xs text-[#737373] font-normal">kW</span>
                </div>
                <div class="text-xs text-[#737373] mt-0.5 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full {batteryStatus === 'charging' ? 'bg-[#22c55e]' : batteryStatus === 'discharging' ? 'bg-[#ff4f00]' : 'bg-[#666]'}"></span>
                  {batteryStatus === 'charging' ? 'Pengisian Daya' : batteryStatus === 'discharging' ? 'Pengosongan Daya' : 'Siaga'}
                </div>

                <!-- Slim Progress Bar -->
                <div class="w-full bg-[#262626] h-1.5 rounded-full overflow-hidden my-3">
                  <div class="h-full rounded-full transition-all duration-500 bg-[#22c55e]" style="width: {batterySoc}%;"></div>
                </div>

                <!-- Telemetry Metrics -->
                <div class="grid grid-cols-2 gap-2 text-[11px] text-[#737373] py-2 border-t border-[#262626]">
                  <div>Tegangan: <span class="text-white font-medium">{batteryVoltage} V</span></div>
                  <div>Arus: <span class="text-white font-medium">{batteryCurrent} A</span></div>
                  <div>Suhu: <span class="text-white font-medium">{batteryTemp} °C</span></div>
                  <div>SOH: <span class="text-[#22c55e] font-medium">{batteryHealth}%</span></div>
                </div>
              </div>

              <!-- Controls -->
              <div class="pt-3 border-t border-[#262626] flex flex-col gap-2">
                <div class="flex items-center justify-between text-[11px] text-[#737373]">
                  <span>Mode Operasi</span>
                  <span class="text-white font-medium capitalize">{batteryManualMode}</span>
                </div>

                <div class="grid grid-cols-4 gap-1">
                  {#each [
                    { id: 'auto', label: 'Auto' },
                    { id: 'charge', label: 'Isi' },
                    { id: 'discharge', label: 'Kosong' },
                    { id: 'standby', label: 'Siaga' }
                  ] as bmode}
                    <button 
                      class="py-1 rounded text-[11px] transition-colors {batteryManualMode === bmode.id ? 'bg-[#2a2a2a] text-white font-medium border border-[#3d3d3d]' : 'text-[#737373] hover:text-white'}"
                      on:click={() => {
                        if (controlMode !== 'manual') toggleControlMode('manual');
                        setBatteryMode(bmode.id as any);
                      }}
                    >
                      {bmode.label}
                    </button>
                  {/each}
                </div>

                <div class="flex items-center justify-between text-[10px] text-[#737373] mt-1">
                  <span>Batas: {batteryMaxChargePower} kW</span>
                  <span>Min Reserve: {batteryMinSocCutoff}%</span>
                </div>
              </div>
            </div>

            <!-- CARD 2: GRID PLN -->
            <div class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex flex-col justify-between hover:border-[#383838] transition-colors">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2 text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">
                    <svg class="w-3.5 h-3.5 text-[#38bdf8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                    </svg>
                    Grid PLN
                  </div>
                  <span class="text-xs font-medium px-2 py-0.5 rounded {gridMode === 'export' ? 'bg-[#12281e] text-[#22c55e] border border-[#1b4332]' : 'bg-[#16222f] text-[#38bdf8] border border-[#1f374e]'}">
                    {gridMode === 'export' ? 'Ekspor' : 'Impor'}
                  </span>
                </div>

                <!-- Primary Value -->
                <div class="text-2xl font-light text-white tracking-tight mt-1">
                  {gridPower.toFixed(2)} <span class="text-xs text-[#737373] font-normal">kW</span>
                </div>
                <div class="text-xs text-[#737373] mt-0.5">
                  {gridMode === 'export' ? 'Energi disalurkan ke jaringan PLN' : 'Pasokan daya dari jaringan PLN'}
                </div>

                <!-- Telemetry Metrics -->
                <div class="grid grid-cols-2 gap-2 text-[11px] text-[#737373] py-2 mt-4 border-t border-[#262626]">
                  <div>Ekspor Hari Ini: <span class="text-white font-medium">{gridDailyExport} kWh</span></div>
                  <div>Impor Hari Ini: <span class="text-white font-medium">{gridDailyImport} kWh</span></div>
                  <div>Tegangan: <span class="text-white font-medium">{gridVoltage} V</span></div>
                  <div>Frekuensi: <span class="text-white font-medium">{gridFrequency} Hz</span></div>
                </div>
              </div>

              <!-- Controls -->
              <div class="pt-3 border-t border-[#262626] flex flex-col gap-2.5">
                <div class="flex items-center justify-between text-xs">
                  <div>
                    <span class="text-white font-medium block">Batas Zero Export</span>
                    <span class="text-[10px] text-[#737373]">Mencegah arus balik ke PLN</span>
                  </div>
                  <button 
                    class="w-8 h-4 rounded-full transition-colors p-0.5 flex items-center {zeroExportEnabled ? 'bg-[#ff4f00] justify-end' : 'bg-[#333] justify-start'}"
                    on:click={toggleZeroExport}
                    aria-label="Toggle Zero Export"
                  >
                    <div class="w-3 h-3 rounded-full bg-white shadow-sm"></div>
                  </button>
                </div>

                <div>
                  <div class="flex justify-between text-[11px] text-[#737373] mb-1">
                    <span>Batas Ekspor Daya</span>
                    <span class="text-white font-medium">{exportLimit.toFixed(1)} kW</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="5.0" 
                    step="0.5"
                    bind:value={exportLimit}
                    class="w-full accent-[#ff4f00] h-1 bg-[#262626] rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <!-- CARD 3: PANEL SURYA (PV) -->
            <div class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex flex-col justify-between hover:border-[#383838] transition-colors">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2 text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">
                    <svg class="w-3.5 h-3.5 text-[#22c55e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line>
                    </svg>
                    Panel Surya (PV)
                  </div>
                  <span class="text-xs font-medium px-2 py-0.5 rounded {pvInverterEnabled ? 'bg-[#12281e] text-[#22c55e] border border-[#1b4332]' : 'bg-[#2b1919] text-[#ef4444] border-[#4a2424]'}">
                    {pvInverterEnabled ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                <!-- Primary Value -->
                <div class="text-2xl font-light text-white tracking-tight mt-1">
                  {effectivePv.toFixed(3)} <span class="text-xs text-[#737373] font-normal">kW</span>
                </div>
                <div class="text-xs text-[#737373] mt-0.5">
                  Radiasi {pvIrradiance} W/m² · Efisiensi {pvEfficiency}%
                </div>

                <!-- Telemetry Metrics -->
                <div class="grid grid-cols-2 gap-2 text-[11px] text-[#737373] py-2 mt-4 border-t border-[#262626]">
                  <div>String 1: <span class="text-white font-medium">{pvString1.p} kW</span></div>
                  <div>String 2: <span class="text-white font-medium">{pvString2.p} kW</span></div>
                  <div>Puncak Hari Ini: <span class="text-white font-medium">{pvPeakPower.toFixed(1)} kW</span></div>
                  <div>Total Harian: <span class="text-white font-medium">{pvDailyYield} kWh</span></div>
                </div>
              </div>

              <!-- Controls -->
              <div class="pt-3 border-t border-[#262626] flex flex-col gap-2.5">
                <div class="flex justify-between items-center text-xs">
                  <div>
                    <span class="text-white font-medium block">Koneksi Inverter</span>
                    <span class="text-[10px] text-[#737373]">Saklar utama PV</span>
                  </div>
                  <button 
                    class="w-8 h-4 rounded-full transition-colors p-0.5 flex items-center {pvInverterEnabled ? 'bg-[#22c55e] justify-end' : 'bg-[#333] justify-start'}"
                    on:click={togglePvInverter}
                    aria-label="Toggle Inverter PV"
                  >
                    <div class="w-3 h-3 rounded-full bg-white shadow-sm"></div>
                  </button>
                </div>

                <div>
                  <div class="flex justify-between text-[11px] text-[#737373] mb-1">
                    <span>Pembatasan Daya (Curtailment)</span>
                    <span class="text-white font-medium">{pvLimitPercent}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    step="5"
                    bind:value={pvLimitPercent}
                    class="w-full accent-[#22c55e] h-1 bg-[#262626] rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <!-- CARD 4: BEBAN (LOAD MONITORING) -->
            <div class="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex flex-col justify-between hover:border-[#383838] transition-colors">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2 text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">
                    <svg class="w-3.5 h-3.5 text-[#e5e5e5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"></path>
                    </svg>
                    Beban (Load)
                  </div>
                  <span class="text-xs font-medium px-2 py-0.5 rounded bg-[#16222f] text-[#38bdf8] border border-[#1f374e]">
                    Normal
                  </span>
                </div>

                <!-- Primary Value -->
                <div class="text-2xl font-light text-white tracking-tight mt-1">
                  {totalLoadPower.toFixed(2)} <span class="text-xs text-[#737373] font-normal">kW</span>
                </div>
                <div class="text-xs text-[#737373] mt-0.5">
                  Konsumsi aktif Gedung 3 FT saat ini
                </div>

                <!-- Telemetry Metrics -->
                <div class="grid grid-cols-2 gap-2 text-[11px] text-[#737373] py-2 mt-4 border-t border-[#262626]">
                  <div>Konsumsi Hari Ini: <span class="text-white font-medium">{loadDailyConsumption} kWh</span></div>
                  <div>Beban Puncak: <span class="text-white font-medium">{loadPeakToday} kW</span></div>
                  <div>Tegangan: <span class="text-white font-medium">{loadVoltage} V</span></div>
                  <div>Power Factor: <span class="text-white font-medium">{loadPowerFactor}</span></div>
                </div>
              </div>

              <!-- Energy Source Distribution -->
              <div class="pt-3 border-t border-[#262626] flex flex-col gap-2">
                <div class="flex justify-between items-center text-xs text-[#737373]">
                  <span>Sumber Pasokan Daya</span>
                  <span class="text-white font-medium">{effectivePv >= totalLoadPower ? '100% Mandiri (PV)' : 'Hibrida PV & Grid'}</span>
                </div>
                <div class="w-full bg-[#262626] h-1.5 rounded-full overflow-hidden flex">
                  <div class="bg-[#22c55e] h-full" style="width: {Math.min(100, Math.round((effectivePv / (totalLoadPower || 1)) * 100))}%;" title="PV"></div>
                  <div class="bg-[#38bdf8] h-full flex-1" title="Grid"></div>
                </div>
                <div class="flex justify-between text-[10px] text-[#737373]">
                  <span>PV: {Math.min(100, Math.round((effectivePv / (totalLoadPower || 1)) * 100))}%</span>
                  <span>Grid: {Math.max(0, 100 - Math.min(100, Math.round((effectivePv / (totalLoadPower || 1)) * 100)))}%</span>
                </div>
              </div>
            </div>

          </div>

          <!-- Subtle Footer Link -->
          <div class="pt-1 flex justify-end">
            <button 
              class="text-xs text-[#888] hover:text-white flex items-center gap-1 transition-colors"
              on:click={() => activeTab = 'Kontrol Energi'}
            >
              <span>Parameter Sistem EMS & Log Riwayat Dispatch ›</span>
            </button>
          </div>

        </section>

        <!-- Bottom Section: Graphs -->
        <section class="bg-[#222222] border border-[#2e2e2e] rounded-xl overflow-hidden flex flex-col">
          <!-- Graph Header Tabs -->
          <div class="flex justify-between items-center px-5 border-b border-[#2d2d2d] bg-[#222]">
            <div class="flex gap-4">
              {#each ['Power Curve', 'Energy Monitoring', 'Generation Comparison', 'Heatmap'] as tab}
                <button 
                  class="py-3 text-xs transition-colors border-b-2 {chartTab === tab ? 'border-[#ff4f00] text-white font-medium' : 'border-transparent text-[#737373] hover:text-[#d4d4d4]'}"
                  on:click={() => chartTab = tab}
                >
                  {tab}
                </button>
              {/each}
            </div>
            <div class="flex items-center gap-3">
              <button class="text-xs text-[#737373] hover:text-white flex items-center gap-1 border border-[#333] rounded px-2 py-1">
                Data Comparison ›
              </button>
            </div>
          </div>
          
          <!-- Graph Content -->
          <div class="p-6 relative">
            <div class="flex justify-between items-start">
              
              <!-- Peak Power Label (Left) -->
              <div class="bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-2 inline-block z-10">
                <div class="text-xl font-light text-white">{pvPeakPower.toFixed(2)} <span class="text-xs text-[#737373]">kW</span></div>
                <div class="text-[10px] text-[#737373] mt-0.5">Peak PV Power</div>
              </div>
              
              <!-- Date Picker (Right) -->
              <div class="bg-[#1a1a1a] border border-[#2e2e2e] text-xs px-2.5 py-1.5 rounded flex items-center justify-between w-[125px] z-10 text-[#a3a3a3]">
                <span class="text-[#666] cursor-pointer hover:text-white">‹</span>
                <span>09/10/2026</span>
                <span class="text-[#666] cursor-pointer hover:text-white">›</span>
              </div>
            </div>

            <!-- SVG Mock Line Chart -->
            <div class="w-full h-[280px] mt-4 relative">
              <!-- Y Axis labels & Grid lines -->
              <div class="absolute inset-0 flex flex-col justify-between pt-2 pb-6 text-[10px] text-[#555]">
                {#each ['8.00', '7.00', '6.00', '5.00', '4.00', '3.00', '2.00', '1.00', '0.00'] as val}
                  <div class="flex items-center gap-2 h-0">
                    <span class="w-6 text-right relative -top-2">{val}</span>
                    <div class="flex-1 border-t border-[#2a2a2a]"></div>
                  </div>
                {/each}
              </div>
              
              <!-- X Axis labels -->
              <div class="absolute bottom-0 left-8 right-0 flex justify-between text-[10px] text-[#555]">
                <span>00:00</span>
                <span>04:00</span>
                <span>08:00</span>
                <span>12:00</span>
                <span>16:00</span>
                <span>20:00</span>
                <span></span>
              </div>

              <!-- Line Chart -->
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

    <!-- ============================================================== -->
    <!-- DEDICATED TAB: KONTROL ENERGI FULL MANAGEMENT SUITE           -->
    <!-- ============================================================== -->
    {:else if activeTab === 'Kontrol Energi'}
      <div class="flex flex-col gap-6 fade-in">
        
        <!-- Top Banner & Global Switch -->
        <div class="bg-[#222222] border border-[#2e2e2e] rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 class="text-lg font-semibold text-white tracking-tight">Sistem Manajemen & Kontrol Energi (EMS)</h1>
            <p class="text-xs text-[#737373] mt-0.5">Konfigurasi operasional pembangkitan PLTS Gedung 3 FT dan proteksi daya</p>
          </div>

          <div class="flex items-center bg-[#181818] p-1 rounded-lg border border-[#2c2c2c]">
            <button 
              class="px-4 py-2 rounded-md text-xs font-medium transition-all {controlMode === 'auto' ? 'bg-[#ff4f00] text-white shadow-sm' : 'text-[#888] hover:text-white'}"
              on:click={() => toggleControlMode('auto')}
            >
              Mode Otomatis (AI-EMS)
            </button>
            <button 
              class="px-4 py-2 rounded-md text-xs font-medium transition-all {controlMode === 'manual' ? 'bg-[#ff4f00] text-white shadow-sm' : 'text-[#888] hover:text-white'}"
              on:click={() => toggleControlMode('manual')}
            >
              Mode Manual
            </button>
          </div>
        </div>

        <!-- 4 Detailed Control Panels -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- PANEL 1: BATERAI (BESS) -->
          <div class="bg-[#222222] border border-[#2e2e2e] rounded-xl p-6 flex flex-col gap-5">
            <div class="flex justify-between items-center pb-3 border-b border-[#2d2d2d]">
              <div>
                <h3 class="font-medium text-white text-sm">Manajemen Baterai (BESS)</h3>
                <span class="text-xs text-[#737373]">Lithium Iron Phosphate (LFP) 12.0 kWh</span>
              </div>
              <div class="text-right">
                <span class="text-xl font-light text-white">{batterySoc}%</span>
                <span class="text-[10px] text-[#737373] block">State of Charge</span>
              </div>
            </div>

            <!-- SOC Progress & Metrics -->
            <div class="flex flex-col gap-2">
              <div class="w-full bg-[#181818] h-2 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500 bg-[#22c55e]" style="width: {batterySoc}%;"></div>
              </div>
              <div class="flex justify-between text-xs text-[#737373]">
                <span>Cadangan Min: {batteryMinSocCutoff}%</span>
                <span class="text-white font-medium">Status: {batteryStatus === 'charging' ? `Mengisi (+${batteryPower.toFixed(2)} kW)` : batteryStatus === 'discharging' ? `Mengosongkan (-${batteryPower.toFixed(2)} kW)` : 'Siaga'}</span>
                <span>Kapasitas: {batteryCapacityTotal} kWh</span>
              </div>
            </div>

            <!-- Telemetry Grid -->
            <div class="grid grid-cols-4 gap-2 bg-[#1a1a1a] p-3 rounded-lg border border-[#282828] text-center text-xs">
              <div>
                <span class="text-[10px] text-[#737373] block">Tegangan</span>
                <span class="text-white font-medium">{batteryVoltage} V</span>
              </div>
              <div>
                <span class="text-[10px] text-[#737373] block">Arus</span>
                <span class="text-white font-medium">{batteryCurrent} A</span>
              </div>
              <div>
                <span class="text-[10px] text-[#737373] block">Suhu Sel</span>
                <span class="text-white font-medium">{batteryTemp} °C</span>
              </div>
              <div>
                <span class="text-[10px] text-[#737373] block">Kesehatan</span>
                <span class="text-[#22c55e] font-medium">{batteryHealth}%</span>
              </div>
            </div>

            <!-- Manual Dispatch Buttons -->
            <div class="flex flex-col gap-2">
              <span class="text-xs text-[#a3a3a3]">Mode Operasional Baterai</span>
              <div class="grid grid-cols-4 gap-2">
                {#each [
                  { id: 'auto', label: 'Otomatis' },
                  { id: 'charge', label: 'Paksa Isi' },
                  { id: 'discharge', label: 'Paksa Kosong' },
                  { id: 'standby', label: 'Siaga' }
                ] as bmode}
                  <button 
                    class="py-1.5 px-2 rounded text-xs transition-colors {batteryManualMode === bmode.id ? 'bg-[#2a2a2a] text-white font-medium border border-[#3d3d3d]' : 'bg-[#1a1a1a] text-[#737373] border border-[#2a2a2a] hover:text-white'}"
                    on:click={() => {
                      if (controlMode !== 'manual') toggleControlMode('manual');
                      setBatteryMode(bmode.id as any);
                    }}
                  >
                    {bmode.label}
                  </button>
                {/each}
              </div>
            </div>

            <!-- Sliders for Limits -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#2d2d2d]">
              <div>
                <div class="flex justify-between text-xs text-[#737373] mb-1">
                  <span>Batas Daya Pengisian</span>
                  <span class="text-white font-medium">{batteryMaxChargePower} kW</span>
                </div>
                <input type="range" min="0.5" max="3.0" step="0.1" bind:value={batteryMaxChargePower} class="w-full accent-[#22c55e] h-1 bg-[#262626] rounded cursor-pointer" />
              </div>
              <div>
                <div class="flex justify-between text-xs text-[#737373] mb-1">
                  <span>Ambang Cadangan Minimum</span>
                  <span class="text-white font-medium">{batteryMinSocCutoff}%</span>
                </div>
                <input type="range" min="10" max="50" step="5" bind:value={batteryMinSocCutoff} class="w-full accent-[#ff4f00] h-1 bg-[#262626] rounded cursor-pointer" />
              </div>
            </div>
          </div>

          <!-- PANEL 2: GRID PLN -->
          <div class="bg-[#222222] border border-[#2e2e2e] rounded-xl p-6 flex flex-col gap-5">
            <div class="flex justify-between items-center pb-3 border-b border-[#2d2d2d]">
              <div>
                <h3 class="font-medium text-white text-sm">Interkoneksi Grid PLN</h3>
                <span class="text-xs text-[#737373]">Sinkronisasi Jaringan 3-Phase 220V/380V</span>
              </div>
              <div class="text-right">
                <span class="text-xl font-light {gridMode === 'export' ? 'text-[#22c55e]' : 'text-[#38bdf8]'}">
                  {gridPower.toFixed(2)} kW
                </span>
                <span class="text-[10px] text-[#737373] block">{gridMode === 'export' ? 'Ekspor ke PLN' : 'Impor dari PLN'}</span>
              </div>
            </div>

            <!-- Grid Parameters -->
            <div class="grid grid-cols-4 gap-2 bg-[#1a1a1a] p-3 rounded-lg border border-[#282828] text-center text-xs">
              <div>
                <span class="text-[10px] text-[#737373] block">Tegangan</span>
                <span class="text-white font-medium">{gridVoltage} V</span>
              </div>
              <div>
                <span class="text-[10px] text-[#737373] block">Frekuensi</span>
                <span class="text-white font-medium">{gridFrequency} Hz</span>
              </div>
              <div>
                <span class="text-[10px] text-[#737373] block">Ekspor Hari Ini</span>
                <span class="text-white font-medium">{gridDailyExport} kWh</span>
              </div>
              <div>
                <span class="text-[10px] text-[#737373] block">Impor Hari Ini</span>
                <span class="text-white font-medium">{gridDailyImport} kWh</span>
              </div>
            </div>

            <!-- Zero Export Toggle -->
            <div class="p-4 bg-[#1a1a1a] rounded-lg border border-[#282828] flex items-center justify-between">
              <div>
                <div class="text-xs font-medium text-white">Mode Zero Export</div>
                <div class="text-xs text-[#737373] mt-0.5">Membatasi kelebihan daya agar tidak mengalir ke jaringan PLN</div>
              </div>
              <button 
                class="w-8 h-4 rounded-full transition-colors p-0.5 flex items-center {zeroExportEnabled ? 'bg-[#ff4f00] justify-end' : 'bg-[#333] justify-start'}"
                on:click={toggleZeroExport}
                aria-label="Toggle Zero Export"
              >
                <div class="w-3 h-3 rounded-full bg-white shadow-sm"></div>
              </button>
            </div>

            <!-- Export Limit Slider -->
            <div class="flex flex-col gap-1">
              <div class="flex justify-between text-xs text-[#737373]">
                <span>Batas Daya Ekspor Maksimal</span>
                <span class="text-white font-medium">{exportLimit.toFixed(1)} kW</span>
              </div>
              <input type="range" min="0" max="5.0" step="0.5" bind:value={exportLimit} class="w-full accent-[#ff4f00] h-1 bg-[#262626] rounded cursor-pointer" />
            </div>
          </div>

          <!-- PANEL 3: PV PANEL SURYA -->
          <div class="bg-[#222222] border border-[#2e2e2e] rounded-xl p-6 flex flex-col gap-5">
            <div class="flex justify-between items-center pb-3 border-b border-[#2d2d2d]">
              <div>
                <h3 class="font-medium text-white text-sm">Output Panel Surya (PV)</h3>
                <span class="text-xs text-[#737373]">Kapasitas Terpasang 7.1 kWp</span>
              </div>
              <div class="text-right">
                <span class="text-xl font-light text-white">{effectivePv.toFixed(3)} kW</span>
                <span class="text-[10px] text-[#737373] block">Daya Aktif</span>
              </div>
            </div>

            <!-- String Telemetry -->
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-[#1a1a1a] p-3 rounded-lg border border-[#282828]">
                <div class="text-xs text-[#737373]">PV String 1 (Atap Barat)</div>
                <div class="text-base font-light text-white mt-0.5">{pvString1.p} kW</div>
                <div class="text-[10px] text-[#666] mt-0.5">{pvString1.v} V · {pvString1.i} A</div>
              </div>
              <div class="bg-[#1a1a1a] p-3 rounded-lg border border-[#282828]">
                <div class="text-xs text-[#737373]">PV String 2 (Atap Timur)</div>
                <div class="text-base font-light text-white mt-0.5">{pvString2.p} kW</div>
                <div class="text-[10px] text-[#666] mt-0.5">{pvString2.v} V · {pvString2.i} A</div>
              </div>
            </div>

            <!-- Inverter Switch -->
            <div class="p-4 bg-[#1a1a1a] rounded-lg border border-[#282828] flex items-center justify-between">
              <div>
                <div class="text-xs font-medium text-white">Status Operasi Inverter</div>
                <div class="text-xs text-[#737373] mt-0.5">Koneksi saklar utama pembangkitan surya</div>
              </div>
              <button 
                class="w-8 h-4 rounded-full transition-colors p-0.5 flex items-center {pvInverterEnabled ? 'bg-[#22c55e] justify-end' : 'bg-[#333] justify-start'}"
                on:click={togglePvInverter}
                aria-label="Toggle Inverter"
              >
                <div class="w-3 h-3 rounded-full bg-white shadow-sm"></div>
              </button>
            </div>

            <!-- Curtailment Limit -->
            <div class="flex flex-col gap-1">
              <div class="flex justify-between text-xs text-[#737373]">
                <span>Pembatasan Output Panel Surya (Curtailment)</span>
                <span class="text-white font-medium">{pvLimitPercent}%</span>
              </div>
              <input type="range" min="10" max="100" step="5" bind:value={pvLimitPercent} class="w-full accent-[#22c55e] h-1 bg-[#262626] rounded cursor-pointer" />
            </div>
          </div>

          <!-- PANEL 4: LOAD MONITORING -->
          <div class="bg-[#222222] border border-[#2e2e2e] rounded-xl p-6 flex flex-col gap-5">
            <div class="flex justify-between items-center pb-3 border-b border-[#2d2d2d]">
              <div>
                <h3 class="font-medium text-white text-sm">Pemantauan Konsumsi Beban (Load)</h3>
                <span class="text-xs text-[#737373]">Monitoring Konsumsi Gedung 3 FT</span>
              </div>
              <div class="text-right">
                <span class="text-xl font-light text-white">{totalLoadPower.toFixed(2)} kW</span>
                <span class="text-[10px] text-[#737373] block">Daya Aktif Saat Ini</span>
              </div>
            </div>

            <!-- Telemetry Grid -->
            <div class="grid grid-cols-4 gap-2 bg-[#1a1a1a] p-3 rounded-lg border border-[#282828] text-center text-xs">
              <div>
                <span class="text-[10px] text-[#737373] block">Konsumsi Hari Ini</span>
                <span class="text-white font-medium">{loadDailyConsumption} kWh</span>
              </div>
              <div>
                <span class="text-[10px] text-[#737373] block">Beban Puncak</span>
                <span class="text-white font-medium">{loadPeakToday} kW</span>
              </div>
              <div>
                <span class="text-[10px] text-[#737373] block">Tegangan</span>
                <span class="text-white font-medium">{loadVoltage} V</span>
              </div>
              <div>
                <span class="text-[10px] text-[#737373] block">Power Factor</span>
                <span class="text-white font-medium">{loadPowerFactor}</span>
              </div>
            </div>

            <!-- Energy Balance Details -->
            <div class="p-4 bg-[#1a1a1a] rounded-lg border border-[#282828] flex flex-col gap-2.5">
              <div class="flex justify-between items-center text-xs">
                <span class="text-white font-medium">Distribusi Pasokan Beban</span>
                <span class="text-[#22c55e] font-medium">{effectivePv >= totalLoadPower ? 'Didukung Penuh Energi Terbarukan (PV)' : 'Didukung Kombinasi PV & Grid'}</span>
              </div>
              <div class="w-full bg-[#262626] h-2 rounded-full overflow-hidden flex">
                <div class="bg-[#22c55e] h-full" style="width: {Math.min(100, Math.round((effectivePv / (totalLoadPower || 1)) * 100))}%;"></div>
                <div class="bg-[#38bdf8] h-full flex-1"></div>
              </div>
              <div class="flex justify-between text-[11px] text-[#737373]">
                <span>Kontribusi PV: {Math.min(100, Math.round((effectivePv / (totalLoadPower || 1)) * 100))}% ({Math.min(effectivePv, totalLoadPower).toFixed(2)} kW)</span>
                <span>Kontribusi Grid: {Math.max(0, 100 - Math.min(100, Math.round((effectivePv / (totalLoadPower || 1)) * 100)))}% ({Math.max(0, totalLoadPower - effectivePv).toFixed(2)} kW)</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Dispatch Logs Table -->
        <div class="bg-[#222222] border border-[#2e2e2e] rounded-xl p-5">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-[#a3a3a3] mb-3">
            Riwayat Dispatch & Log Sistem
          </h3>
          <div class="flex flex-col gap-1.5">
            {#each emsLogs as log}
              <div class="flex items-center justify-between py-2 px-3 rounded bg-[#1a1a1a] border border-[#282828] text-xs">
                <div class="flex items-center gap-3">
                  <span class="font-mono text-[#666] text-[11px]">{log.time}</span>
                  <span class="text-[#d4d4d4]">{log.text}</span>
                </div>
                <span class="text-[10px] font-medium uppercase tracking-tight {log.type === 'success' ? 'text-[#22c55e]' : log.type === 'warning' ? 'text-[#f59e0b]' : 'text-[#38bdf8]'}">
                  {log.type}
                </span>
              </div>
            {/each}
          </div>
        </div>

      </div>
      
    <!-- ============================================================== -->
    <!-- DEDICATED TAB: PREDIKSI & ANALITIK MANAGEMENT SUITE            -->
    <!-- ============================================================== -->
    {:else if activeTab === 'Prediksi & Analitik'}
      <div class="flex flex-col gap-6 fade-in">
        
        <!-- Top Toolbar: Header & Source Switcher -->
        <div class="bg-[#222222] border border-[#2e2e2e] rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div class="flex items-center gap-2.5">
              <h1 class="text-lg font-semibold text-white tracking-tight">Prediksi & Analitik Pembangkitan Energi Surya</h1>
              <span class="text-[10px] px-2 py-0.5 rounded font-medium bg-[#16231a] text-[#22c55e] border border-[#1b4332]">
                Model Aktif: {weatherModelSource}
              </span>
            </div>
            <p class="text-xs text-[#737373] mt-1">
              Estimasi produksi harian/mingguan, kalkulasi potensi teknis PV 7.10 kWp, dan integrasi parameter cuaca BMKG & OpenWeather
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <!-- Weather API Source Switcher -->
            <div class="flex items-center bg-[#181818] p-1 rounded-lg border border-[#2c2c2c]">
              <button 
                class="px-3 py-1.5 rounded-md text-xs font-medium transition-all {weatherModelSource === 'BMKG' ? 'bg-[#ff4f00] text-white shadow-sm' : 'text-[#888] hover:text-white'}"
                on:click={() => switchWeatherSource('BMKG')}
              >
                Model BMKG
              </button>
              <button 
                class="px-3 py-1.5 rounded-md text-xs font-medium transition-all {weatherModelSource === 'OpenWeather' ? 'bg-[#ff4f00] text-white shadow-sm' : 'text-[#888] hover:text-white'}"
                on:click={() => switchWeatherSource('OpenWeather')}
              >
                OpenWeather Solar
              </button>
            </div>

            <!-- Timeframe Selector (Hourly vs Weekly) -->
            <div class="flex items-center bg-[#181818] p-1 rounded-lg border border-[#2c2c2c]">
              <button 
                class="px-3 py-1.5 rounded-md text-xs font-medium transition-all {analyticsViewMode === 'hourly' ? 'bg-[#2a2a2a] text-white font-medium border border-[#3d3d3d]' : 'text-[#888] hover:text-white'}"
                on:click={() => analyticsViewMode = 'hourly'}
              >
                Per Jam (24 Jam)
              </button>
              <button 
                class="px-3 py-1.5 rounded-md text-xs font-medium transition-all {analyticsViewMode === 'weekly' ? 'bg-[#2a2a2a] text-white font-medium border border-[#3d3d3d]' : 'text-[#888] hover:text-white'}"
                on:click={() => analyticsViewMode = 'weekly'}
              >
                Mingguan (7 Hari)
              </button>
            </div>

            <!-- Sync / Perbarui Button -->
            <button 
              class="px-3 py-1.5 rounded-lg bg-[#181818] hover:bg-[#252525] border border-[#2c2c2c] text-xs text-[#a3a3a3] hover:text-white flex items-center gap-1.5 transition-colors"
              on:click={() => showToast('Sinkronisasi data prakiraan cuaca & estimasi daya berhasil')}
              title="Perbarui Data Cuaca"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              <span>Sync</span>
            </button>
          </div>
        </div>

        <!-- KPI Summary Cards (4 Columns) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <!-- Card 1: Estimasi Produksi Harian -->
          <div class="bg-[#222222] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between hover:border-[#383838] transition-colors">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold uppercase tracking-wider text-[#a3a3a3]">Estimasi Produksi Hari Ini</span>
                <span class="w-2 h-2 rounded-full bg-[#22c55e]"></span>
              </div>
              <div class="my-2">
                <span class="text-2xl font-light text-white">31.40 <span class="text-xs text-[#737373]">kWh</span></span>
                <span class="text-[11px] text-[#22c55e] block font-medium mt-0.5">Realisasi: 27.80 kWh (88.5%)</span>
              </div>
            </div>
            <div class="flex flex-col gap-1.5 pt-3 border-t border-[#2a2a2a]">
              <div class="w-full bg-[#181818] h-1.5 rounded-full overflow-hidden">
                <div class="bg-[#22c55e] h-full rounded-full" style="width: 88.5%;"></div>
              </div>
              <div class="flex justify-between text-[10px] text-[#737373]">
                <span>Confidence: 96%</span>
                <span>Deviasi: +1.8%</span>
              </div>
            </div>
          </div>

          <!-- Card 2: Potensi Energi Teknis PV -->
          <div class="bg-[#222222] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between hover:border-[#383838] transition-colors">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold uppercase tracking-wider text-[#a3a3a3]">Potensi Teknis PV (Live)</span>
                <span class="text-[10px] text-[#ff4f00] font-medium">Cap: 7.10 kWp</span>
              </div>
              <div class="my-2">
                <span class="text-2xl font-light text-white">{technicalPvPotentialKw.toFixed(2)} <span class="text-xs text-[#737373]">kW</span></span>
                <span class="text-[11px] text-[#22c55e] block font-medium mt-0.5">Daya Riil: {currentActualKw.toFixed(2)} kW</span>
              </div>
            </div>
            <div class="flex flex-col gap-1.5 pt-3 border-t border-[#2a2a2a]">
              <div class="w-full bg-[#181818] h-1.5 rounded-full overflow-hidden">
                <div class="bg-[#ff4f00] h-full rounded-full" style="width: {potentialRealizationRatio}%;"></div>
              </div>
              <div class="flex justify-between text-[10px] text-[#737373]">
                <span>Pemanfaatan: {potentialRealizationRatio.toFixed(1)}%</span>
                <span>Inverter Eff: 97.8%</span>
              </div>
            </div>
          </div>

          <!-- Card 3: Radiasi Matahari & PSH -->
          <div class="bg-[#222222] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between hover:border-[#383838] transition-colors">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold uppercase tracking-wider text-[#a3a3a3]">Radiasi Matahari (POA)</span>
                <span class="text-[10px] text-[#38bdf8] font-medium">Tilt 15°</span>
              </div>
              <div class="my-2">
                <span class="text-2xl font-light text-white">{weatherCurrent.irradiancePoa} <span class="text-xs text-[#737373]">W/m²</span></span>
                <span class="text-[11px] text-[#a3a3a3] block font-medium mt-0.5">GHI: {weatherCurrent.irradianceGhi} W/m² · PSH: {weatherCurrent.phel}j</span>
              </div>
            </div>
            <div class="flex items-center justify-between pt-3 border-t border-[#2a2a2a] text-[10px] text-[#737373]">
              <span>Indeks UV: {weatherCurrent.uvIndex} (Tinggi)</span>
              <span>Insolasi: Baik</span>
            </div>
          </div>

          <!-- Card 4: Kondisi Atmosfer & Termal -->
          <div class="bg-[#222222] border border-[#2e2e2e] rounded-xl p-5 flex flex-col justify-between hover:border-[#383838] transition-colors">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold uppercase tracking-wider text-[#a3a3a3]">Kondisi Termal & Modul</span>
                <span class="text-[10px] text-[#a3a3a3]">Sandia Model</span>
              </div>
              <div class="my-2">
                <span class="text-2xl font-light text-white">{calculatedCellTemp.toFixed(1)} <span class="text-xs text-[#737373]">°C</span></span>
                <span class="text-[11px] text-[#f59e0b] block font-medium mt-0.5">Ambient {weatherCurrent.tempAmbient}°C · Loss: -{thermalLossPct.toFixed(2)}%</span>
              </div>
            </div>
            <div class="flex items-center justify-between pt-3 border-t border-[#2a2a2a] text-[10px] text-[#737373]">
              <span>Tutupan Awan: {weatherCurrent.cloudCoverTotal}%</span>
              <span>Angin: {weatherCurrent.windSpeed} km/h</span>
            </div>
          </div>

        </div>

        <!-- Main Chart Section: Prediksi vs Realisasi Curve -->
        <div class="bg-[#222222] border border-[#2e2e2e] rounded-xl p-6 flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2d2d2d]">
            <div>
              <h2 class="text-sm font-semibold text-white tracking-tight">
                {analyticsViewMode === 'hourly' ? 'Kurva Pembangkitan: Prediksi vs Realisasi Daya (24 Jam)' : 'Prospek Produksi Energi Mingguan (7 Hari)'}
              </h2>
              <span class="text-xs text-[#737373]">
                {analyticsViewMode === 'hourly' ? 'Perbandingan daya aktual inverter vs estimasi model cuaca dan potensi fluks radiasi matahari' : 'Estimasi akumulasi produksi energi harian berdasarkan parameter tutupan awan & jam puncak matahari (PSH)'}
              </span>
            </div>

            <div class="flex items-center gap-2 self-start sm:self-auto text-xs text-[#737373]">
              <span>Sumber Data:</span>
              <span class="text-white font-medium bg-[#1a1a1a] px-2.5 py-1 rounded border border-[#2e2e2e]">
                {weatherCurrent.source}
              </span>
            </div>
          </div>

          <!-- Chart Area -->
          <div class="w-full h-[320px] relative">
            <Chart option={analyticsViewMode === 'hourly' ? hourlyPredictionChartOption : weeklyPredictionChartOption} />
          </div>

          <!-- Bottom Metric Legend Chips -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-[#2d2d2d] text-xs">
            <div class="bg-[#1a1a1a] p-2.5 rounded border border-[#282828]">
              <span class="text-[10px] text-[#737373] block">Puncak Prediksi Daya</span>
              <span class="text-white font-medium">5.82 kW (12:00 WIB)</span>
            </div>
            <div class="bg-[#1a1a1a] p-2.5 rounded border border-[#282828]">
              <span class="text-[10px] text-[#737373] block">Rata-rata Produksi Mingguan</span>
              <span class="text-white font-medium">{avgDailyPredictedKwh} kWh / hari</span>
            </div>
            <div class="bg-[#1a1a1a] p-2.5 rounded border border-[#282828]">
              <span class="text-[10px] text-[#737373] block">Evaluasi Akurasi Model</span>
              <span class="text-[#22c55e] font-medium">95.4% (MAE: 0.18 kW)</span>
            </div>
            <div class="bg-[#1a1a1a] p-2.5 rounded border border-[#282828]">
              <span class="text-[10px] text-[#737373] block">Status Peringatan Cuaca</span>
              <span class="text-[#38bdf8] font-medium">Intermitensi Rendah (Kondusif)</span>
            </div>
          </div>
        </div>

        <!-- Detailed Formula Engine & Calculation Breakdown (IEC 61724-1 Standard) -->
        <div class="bg-[#222222] border border-[#2e2e2e] rounded-xl p-6 flex flex-col gap-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2d2d2d]">
            <div>
              <h3 class="text-sm font-semibold text-white tracking-tight">Kalkulasi Transparan Potensi Energi PV Gedung 3 FT</h3>
              <p class="text-xs text-[#737373] mt-0.5">
                Model perhitungan potensi teknis berstandar IEC 61724-1 berdasarkan spesifikasi modul & kondisi cuaca riil
              </p>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-[#a3a3a3] bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-[#2d2d2d]">
              <span class="text-[#737373]">Kapasitas STC:</span>
              <strong class="text-white">7.10 kWp (16 Modul Mono PERC)</strong>
            </div>
          </div>

          <!-- Formula Equation Card -->
          <div class="bg-[#181818] rounded-lg p-4 border border-[#2c2c2c] font-mono text-xs text-[#a3a3a3] overflow-x-auto">
            <div class="text-[#737373] text-[11px] mb-1 font-sans">Formula Potensi Daya Teknis AC:</div>
            <span class="text-[#ff4f00]">P_potensi</span> = <span class="text-white">P_STC</span> × (<span class="text-[#38bdf8]">G_POA</span> / 1000) × [1 + <span class="text-[#f59e0b]">γ</span> · (<span class="text-[#22c55e]">T_cell</span> - 25°C)] × <span class="text-white">η_inverter</span> × (1 - <span class="text-[#737373]">L_kabel</span>)
          </div>

          <!-- Step-by-Step Waterfall Progression -->
          <div class="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
            
            <!-- Step 1 -->
            <div class="bg-[#1a1a1a] p-3 rounded-lg border border-[#2a2a2a] flex flex-col justify-between">
              <div>
                <span class="text-[10px] text-[#737373] block">1. Kapasitas STC</span>
                <span class="text-base font-medium text-white">7.10 kWp</span>
                <p class="text-[10px] text-[#737373] mt-1">1000 W/m² @ 25°C</p>
              </div>
              <div class="text-[10px] text-[#a3a3a3] pt-2 border-t border-[#262626]">Baseline Pabrikan</div>
            </div>

            <!-- Step 2 -->
            <div class="bg-[#1a1a1a] p-3 rounded-lg border border-[#2a2a2a] flex flex-col justify-between">
              <div>
                <span class="text-[10px] text-[#737373] block">2. Fluks Radiasi Riil</span>
                <span class="text-base font-medium text-[#38bdf8]">{theoreticalPvPotentialKw.toFixed(2)} kW</span>
                <p class="text-[10px] text-[#737373] mt-1">{weatherCurrent.irradiancePoa} W/m² (POA)</p>
              </div>
              <div class="text-[10px] text-[#737373] pt-2 border-t border-[#262626]">Faktor Fluks: {(weatherCurrent.irradiancePoa / 1000).toFixed(3)}</div>
            </div>

            <!-- Step 3 -->
            <div class="bg-[#1a1a1a] p-3 rounded-lg border border-[#2a2a2a] flex flex-col justify-between">
              <div>
                <span class="text-[10px] text-[#737373] block">3. Koreksi Suhu Sel</span>
                <span class="text-base font-medium text-[#f59e0b]">{(theoreticalPvPotentialKw * (1 - thermalLossPct / 100)).toFixed(2)} kW</span>
                <p class="text-[10px] text-[#737373] mt-1">Tcell {calculatedCellTemp.toFixed(1)}°C</p>
              </div>
              <div class="text-[10px] text-[#f59e0b] pt-2 border-t border-[#262626]">Rugi Termal: -{thermalLossPct.toFixed(2)}%</div>
            </div>

            <!-- Step 4 -->
            <div class="bg-[#1a1a1a] p-3 rounded-lg border border-[#2a2a2a] flex flex-col justify-between">
              <div>
                <span class="text-[10px] text-[#737373] block">4. Potensi Teknis AC</span>
                <span class="text-base font-medium text-white">{technicalPvPotentialKw.toFixed(2)} kW</span>
                <p class="text-[10px] text-[#737373] mt-1">Inverter 97.8% & Kabel</p>
              </div>
              <div class="text-[10px] text-[#a3a3a3] pt-2 border-t border-[#262626]">Kapasitas Maks AC</div>
            </div>

            <!-- Step 5 -->
            <div class="bg-[#17231a] p-3 rounded-lg border border-[#1b4332] flex flex-col justify-between">
              <div>
                <span class="text-[10px] text-[#22c55e] block font-medium">5. Realisasi Output</span>
                <span class="text-base font-medium text-[#22c55e]">{currentActualKw.toFixed(2)} kW</span>
                <p class="text-[10px] text-[#a3a3a3] mt-1">Inverter Output Aktif</p>
              </div>
              <div class="text-[10px] text-[#22c55e] font-medium pt-2 border-t border-[#1b4332]">Pencapaian: {potentialRealizationRatio.toFixed(1)}%</div>
            </div>

          </div>
        </div>

        <!-- 24-Hour Weather & Irradiance Forecast Timeline -->
        <div class="bg-[#222222] border border-[#2e2e2e] rounded-xl p-6 flex flex-col gap-4">
          <div class="flex items-center justify-between pb-3 border-b border-[#2d2d2d]">
            <div>
              <h3 class="text-sm font-semibold text-white tracking-tight">Timeline Parameter Cuaca & Radiasi 24 Jam</h3>
              <p class="text-xs text-[#737373] mt-0.5">Integrasi data jam ke jam dari {weatherCurrent.source}</p>
            </div>
            <div class="text-xs text-[#737373]">
              Update: {weatherCurrent.updateTime}
            </div>
          </div>

          <!-- Horizontal Hourly Cards Strip -->
          <div class="overflow-x-auto pb-2">
            <div class="flex gap-2.5 min-w-[900px]">
              {#each hourlyForecastData as hour}
                <div class="flex-1 bg-[#1a1a1a] rounded-lg p-3 border border-[#2a2a2a] flex flex-col items-center text-center gap-2 hover:border-[#383838] transition-colors">
                  <span class="font-mono text-xs text-[#a3a3a3]">{hour.time}</span>
                  
                  <!-- Clean Weather SVG Icon -->
                  <div class="w-8 h-8 rounded-full bg-[#242424] flex items-center justify-center {hour.icon === 'sun' ? 'text-[#ff4f00]' : hour.icon === 'rain' ? 'text-[#38bdf8]' : 'text-[#a3a3a3]'}">
                    {#if hour.icon === 'sun'}
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                      </svg>
                    {:else if hour.icon === 'rain'}
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="16" y1="13" x2="16" y2="21"></line><line x1="8" y1="13" x2="8" y2="21"></line><line x1="12" y1="15" x2="12" y2="23"></line>
                        <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>
                      </svg>
                    {:else}
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
                      </svg>
                    {/if}
                  </div>

                  <div>
                    <span class="text-[11px] font-medium text-white block">{hour.weather}</span>
                    <span class="text-[10px] text-[#737373]">{hour.temp}°C</span>
                  </div>

                  <div class="w-full pt-2 border-t border-[#262626] flex flex-col gap-1 text-[10px]">
                    <div class="flex justify-between text-[#737373]">
                      <span>Radiasi:</span>
                      <span class="text-white font-medium">{hour.irradiance} W/m²</span>
                    </div>
                    <div class="flex justify-between text-[#737373]">
                      <span>Awan:</span>
                      <span class="text-[#a3a3a3]">{hour.clouds}%</span>
                    </div>
                    <div class="flex justify-between text-[#737373] mt-0.5">
                      <span>Prediksi:</span>
                      <span class="text-[#ff4f00] font-medium">{hour.predictedKw} kW</span>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- Weekly Forecast Table & EMS Operational Strategy -->
        <div class="bg-[#222222] border border-[#2e2e2e] rounded-xl p-6 flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2d2d2d]">
            <div>
              <h3 class="text-sm font-semibold text-white tracking-tight">Prakiraan Produksi & Rekomendasi Operasi 7 Hari</h3>
              <p class="text-xs text-[#737373] mt-0.5">Panduan optimasi alur daya baterai dan ekspor-impor grid berdasarkan prakiraan cuaca</p>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span class="text-[#737373]">Akumulasi 7 Hari:</span>
              <span class="text-[#22c55e] font-semibold">{totalWeeklyPredictedKwh.toFixed(1)} kWh (~Rp {estimatedWeeklyRevenue})</span>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-[#333] text-[#737373]">
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
                  <tr class="border-b border-[#282828] hover:bg-[#252525] transition-colors">
                    <td class="py-3 px-3">
                      <span class="font-medium text-white block">{item.day}</span>
                      <span class="text-[10px] text-[#737373]">{item.date}</span>
                    </td>
                    <td class="py-3 px-3">
                      <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full {item.predictedKwh > 30 ? 'bg-[#22c55e]' : item.predictedKwh > 24 ? 'bg-[#ff4f00]' : 'bg-[#38bdf8]'}"></div>
                        <span class="text-[#d4d4d4]">{item.weather}</span>
                      </div>
                      <span class="text-[10px] text-[#737373] block ml-4">{item.tempMinMax}</span>
                    </td>
                    <td class="py-3 px-3 font-mono text-white">{item.psh} jam</td>
                    <td class="py-3 px-3 text-[#a3a3a3]">{item.avgIrradiance} W/m²</td>
                    <td class="py-3 px-3">
                      <span class="text-white font-medium text-sm">{item.predictedKwh.toFixed(1)} <span class="text-[10px] text-[#737373]">kWh</span></span>
                      {#if item.actualKwh}
                        <span class="text-[10px] text-[#22c55e] block">Riil: {item.actualKwh} kWh</span>
                      {/if}
                    </td>
                    <td class="py-3 px-3">
                      <span class="inline-flex items-center gap-1 text-[11px] font-medium {item.confidence >= 90 ? 'text-[#22c55e]' : 'text-[#f59e0b]'}">
                        {item.confidence}%
                      </span>
                    </td>
                    <td class="py-3 px-3">
                      <span class="text-[11px] text-[#a3a3a3] block max-w-xs">{item.recommendation}</span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          <!-- Bottom Financial & Environmental Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-[#2d2d2d]">
            <div class="bg-[#1a1a1a] p-3.5 rounded-lg border border-[#282828] flex items-center justify-between">
              <div>
                <span class="text-[11px] text-[#737373] block">Total Estimasi Energi 7 Hari</span>
                <span class="text-xl font-light text-white">{totalWeeklyPredictedKwh.toFixed(1)} <span class="text-xs text-[#737373]">kWh</span></span>
              </div>
              <div class="w-8 h-8 rounded-full bg-[#1b3323] text-[#22c55e] flex items-center justify-center">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
            </div>

            <div class="bg-[#1a1a1a] p-3.5 rounded-lg border border-[#282828] flex items-center justify-between">
              <div>
                <span class="text-[11px] text-[#737373] block">Estimasi Nilai Penghematan</span>
                <span class="text-xl font-light text-white">Rp {estimatedWeeklyRevenue}</span>
              </div>
              <div class="w-8 h-8 rounded-full bg-[#352516] text-[#ff4f00] flex items-center justify-center">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v12M15 9.5a3.5 3.5 0 0 0-7 0c0 4 7 2 7 6a3.5 3.5 0 0 1-7 0"></path>
                </svg>
              </div>
            </div>

            <div class="bg-[#1a1a1a] p-3.5 rounded-lg border border-[#282828] flex items-center justify-between">
              <div>
                <span class="text-[11px] text-[#737373] block">Estimasi Reduksi Emisi CO₂</span>
                <span class="text-xl font-light text-white">{estimatedWeeklyCo2Reduction} <span class="text-xs text-[#737373]">kg CO₂</span></span>
              </div>
              <div class="w-8 h-8 rounded-full bg-[#12281e] text-[#22c55e] flex items-center justify-center">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

      </div>
      
    {:else if activeTab === 'Devices'}
      <!-- Devices Tab -->
      <div class="bg-[#222222] border border-[#2e2e2e] rounded-xl p-6 min-h-[400px]">
        <h2 class="text-base font-semibold text-white mb-6">Connected Devices</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-[#333] text-[#737373]">
                <th class="py-3 px-4">Device ID</th>
                <th class="py-3 px-4">Type</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">Current Power</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each devices as device}
                <tr class="border-b border-[#282828] hover:bg-[#252525] transition-colors">
                  <td class="py-3 px-4 font-medium text-white">{device.id}</td>
                  <td class="py-3 px-4 text-[#a3a3a3]">{device.type}</td>
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-[#12281e] text-[#22c55e] border border-[#1b4332]">
                      <span class="w-1.5 h-1.5 rounded-full bg-[#22c55e]"></span>
                      {device.status}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-[#a3a3a3]">{device.power}</td>
                  <td class="py-3 px-4 text-right">
                    <button class="text-[#ff4f00] hover:underline text-xs">Detail</button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
      
    {:else if activeTab === 'Alarms'}
      <!-- Alarms Tab -->
      <div class="bg-[#222222] border border-[#2e2e2e] rounded-xl p-6 min-h-[400px]">
        <h2 class="text-base font-semibold text-white mb-6">Recent Alarms</h2>
        {#if alarms.length === 0}
          <div class="text-center text-[#737373] py-10">No alarms to display.</div>
        {:else}
          <div class="flex flex-col gap-2.5">
            {#each alarms as alarm}
              <div class="flex items-center justify-between p-3.5 bg-[#1a1a1a] border-l-2 border-[#ff4f00] rounded hover:bg-[#252525] transition-colors text-xs">
                <div>
                  <div class="text-white font-medium">{alarm.message}</div>
                  <div class="text-[11px] text-[#737373] mt-0.5">{alarm.device} · {alarm.time}</div>
                </div>
                <div class="px-2.5 py-0.5 bg-[#2b1f15] text-[#ff4f00] rounded text-[10px] font-medium border border-[#4a2e16]">
                  {alarm.severity}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

  </main>

  <!-- Clean Floating Toast Notification -->
  {#if toastMessage}
    <div class="fixed bottom-6 right-6 z-50 bg-[#1e1e1e] border border-[#383838] text-[#e5e5e5] px-4 py-2.5 rounded-lg shadow-xl text-xs flex items-center gap-3 fade-in">
      <div class="w-1.5 h-1.5 rounded-full bg-[#ff4f00]"></div>
      <span>{toastMessage}</span>
      <button class="text-[#737373] hover:text-white ml-2" on:click={() => toastMessage = ''} aria-label="Close">✕</button>
    </div>
  {/if}

</div>

<style>
  :global(body) {
    background-color: #1c1c1c;
  }
  .fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
