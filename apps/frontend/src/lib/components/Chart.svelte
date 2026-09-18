<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import * as echarts from 'echarts';

  export let option: echarts.EChartsCoreOption;
  let el: HTMLDivElement;
  let chart: echarts.ECharts;

  onMount(() => {
    chart = echarts.init(el);
    chart.setOption(option);
    const resize = () => chart.resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  });

  onDestroy(() => chart?.dispose());

  $: if (chart) {
    chart.setOption(option);
  }
</script>

<div class="h-full w-full" bind:this={el}></div>
