<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import * as echarts from 'echarts';

  export let option: echarts.EChartsCoreOption;
  export let notMerge: boolean = true;
  let el: HTMLDivElement;
  let chart: echarts.ECharts;

  onMount(() => {
    chart = echarts.init(el);
    chart.setOption(option, notMerge);
    const resize = () => chart.resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  });

  onDestroy(() => chart?.dispose());

  $: if (chart && option) {
    chart.setOption(option, notMerge);
  }
</script>

<div class="h-full w-full" bind:this={el}></div>
