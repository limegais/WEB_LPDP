<script lang="ts">
  import { onMount } from 'svelte';
  import Chart from '$lib/components/Chart.svelte';
  import { apiClient } from '$lib/api/client';
  import type { ComplianceReport, DailyPerformance, Plant } from '@ress/shared-types';

  let plants: Plant[] = [];
  let plantId = '';
  let days = 30;
  let rows: DailyPerformance[] = [];
  let report: ComplianceReport | null = null;
  let error = '';
  let loading = true;

  const fmt = (v: number | null, digits = 2) => (v === null || v === undefined ? '-' : v.toFixed(digits));
  const pct = (v: number | null) => (v === null || v === undefined ? '-' : `${(v * 100).toFixed(1)}%`);

  async function load() {
    if (!plantId) return;
    loading = true;
    try {
      [rows, report] = await Promise.all([
        apiClient.performance(plantId, days).then((r) => r.data),
        apiClient.compliance(plantId)
      ]);
      error = '';
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    try {
      plants = (await apiClient.plants()).data;
      plantId = plants[0]?.id ?? '';
      await load();
    } catch (e) {
      error = (e as Error).message;
      loading = false;
    }
  });

  $: latest = rows.length ? rows[rows.length - 1] : null;
  $: option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['PR', 'PR terkoreksi suhu'] },
    grid: { top: 40, right: 16, bottom: 28, left: 44 },
    xAxis: { type: 'category', data: rows.map((r) => r.day) },
    yAxis: { type: 'value', min: 0, max: 1, axisLabel: { formatter: (v: number) => `${v * 100}%` } },
    series: [
      { name: 'PR', type: 'line', smooth: true, data: rows.map((r) => r.pr) },
      { name: 'PR terkoreksi suhu', type: 'line', smooth: true, data: rows.map((r) => r.prTempCorr) }
    ]
  };

  const statusClass: Record<string, string> = {
    pass: 'bg-emerald-100 text-emerald-700',
    warn: 'bg-amber-100 text-amber-700',
    fail: 'bg-red-100 text-red-700'
  };
  const statusLabel: Record<string, string> = { pass: 'Sesuai', warn: 'Perlu perhatian', fail: 'Belum sesuai' };
</script>

<svelte:head><title>Performa PLTS - IEC 61724-1</title></svelte:head>

<main class="mx-auto max-w-6xl space-y-6 p-4 text-[#1a3449]">
  <header class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <a href="/dashboard" class="text-xs text-[#6e8492]">&larr; Dashboard</a>
      <h1 class="mt-1 text-2xl font-semibold">Performa PLTS</h1>
      <p class="text-sm text-[#748998]">Metrik dan kepatuhan IEC 61724-1:2021, Class {report?.monitoringClass ?? 'A'}</p>
    </div>
    <div class="flex gap-2">
      <select class="rounded border border-[#d9e4ea] px-2 py-1 text-sm" bind:value={plantId} on:change={load}>
        {#each plants as p}<option value={p.id}>{p.name}</option>{/each}
      </select>
      <select class="rounded border border-[#d9e4ea] px-2 py-1 text-sm" bind:value={days} on:change={load}>
        <option value={7}>7 hari</option>
        <option value={30}>30 hari</option>
        <option value={90}>90 hari</option>
      </select>
    </div>
  </header>

  {#if error}<p class="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>{/if}
  {#if !loading && plants.length === 0 && !error}
    <p class="rounded bg-amber-50 p-3 text-sm text-amber-800">Belum ada plant. Jalankan <code>bun run seed</code> di apps/backend.</p>
  {/if}

  <section class="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
    {#each [['Yr (jam)', fmt(latest?.yr ?? null)], ['Ya (jam)', fmt(latest?.ya ?? null)], ['Yf (jam)', fmt(latest?.yf ?? null)], ['PR', pct(latest?.pr ?? null)], ['PR koreksi suhu', pct(latest?.prTempCorr ?? null)], ['Ketersediaan sistem', pct(latest?.systemAvailability ?? null)], ['Ketersediaan data', pct(latest?.dataAvailability ?? null)]] as card}
      <div class="rounded-lg border border-[#e8edef] bg-white p-3">
        <p class="text-[11px] text-[#8399a7]">{card[0]}</p>
        <strong class="text-xl">{card[1]}</strong>
      </div>
    {/each}
  </section>
  {#if latest}<p class="-mt-4 text-xs text-[#8399a7]">Data hari terakhir: {latest.day}</p>{/if}

  <section class="rounded-lg border border-[#e8edef] bg-white p-4">
    <h2 class="mb-2 text-sm font-semibold">Tren Performance Ratio</h2>
    <div class="h-64"><Chart {option} /></div>
  </section>

  <section class="rounded-lg border border-[#e8edef] bg-white p-4">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-sm font-semibold">Kepatuhan IEC 61724-1 (Class A)</h2>
      {#if report}
        <p class="text-xs text-[#748998]">
          Sesuai {report.summary.pass} / {report.summary.total} &middot; Perlu perhatian {report.summary.warn} &middot; Belum sesuai {report.summary.fail}
        </p>
      {/if}
    </div>
    <table class="w-full text-left text-sm">
      <thead><tr class="border-b text-xs text-[#6e8393]"><th class="py-2">Persyaratan</th><th>Status</th><th>Keterangan</th></tr></thead>
      <tbody>
        {#each report?.checks ?? [] as c}
          <tr class="border-b border-[#eff3f5]">
            <td class="py-2 pr-3">{c.label}</td>
            <td class="pr-3"><span class="rounded px-2 py-0.5 text-xs {statusClass[c.status]}">{statusLabel[c.status]}</span></td>
            <td class="text-[#60798a]">{c.detail}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>

  <section class="overflow-x-auto rounded-lg border border-[#e8edef] bg-white p-4">
    <h2 class="mb-2 text-sm font-semibold">Detail harian</h2>
    <table class="w-full min-w-[800px] text-left text-sm">
      <thead>
        <tr class="border-b text-xs text-[#6e8393]">
          <th class="py-2">Tanggal</th><th>H_POA (kWh/m²)</th><th>E_AC (kWh)</th><th>Yr</th><th>Ya</th><th>Yf</th><th>Lc</th><th>Ls</th><th>PR</th><th>PR T-corr</th><th>CF</th>
        </tr>
      </thead>
      <tbody>
        {#each [...rows].reverse() as r}
          <tr class="border-b border-[#eff3f5]">
            <td class="py-2">{r.day}</td><td>{fmt(r.hPoaKwhM2)}</td><td>{fmt(r.eAcKwh, 1)}</td><td>{fmt(r.yr)}</td><td>{fmt(r.ya)}</td><td>{fmt(r.yf)}</td><td>{fmt(r.lc)}</td><td>{fmt(r.ls)}</td><td>{pct(r.pr)}</td><td>{pct(r.prTempCorr)}</td><td>{pct(r.capacityFactor)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>
</main>
