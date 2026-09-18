<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(() => goto('/login'));
</script>

<svelte:head><title>RESS Monitoring</title></svelte:head>

<main class="grid min-h-screen place-items-center bg-[#f4f7f8] text-[#17324a]">
  <p class="text-sm text-[#718694]">Membuka halaman login...</p>
</main>
